"""
Threat Feed Agent for CheckmateAI.
Monitors RSS feeds from fact-checking organizations and detects trending misinformation.
"""

import feedparser
import asyncio
import uuid
import warnings
from datetime import datetime
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser
from langchain_core.messages import HumanMessage
import json

from app.core.config import settings
from app.core.llm import get_llm

# Suppress langchain deprecation warnings
warnings.filterwarnings("ignore", message="Convert_system_message_to_human will be deprecated!")


# RSS Feed Sources Configuration
RSS_FEEDS = [
    # US Fact-Checkers
    {
        "url": "https://www.snopes.com/feed/",
        "source": "Snopes",
        "region": "US",
        "language": "en",
        "credibility": 95
    },
    {
        "url": "https://www.politifact.com/rss/factchecks/",
        "source": "PolitiFact",
        "region": "US",
        "language": "en",
        "credibility": 93
    },
    {
        "url": "https://www.factcheck.org/feed/",
        "source": "FactCheck.org",
        "region": "US",
        "language": "en",
        "credibility": 94
    },
    
    # India Fact-Checkers
    {
        "url": "https://www.altnews.in/feed/",
        "source": "AltNews",
        "region": "IN",
        "language": "en",
        "credibility": 88
    },
    {
        "url": "https://www.boomlive.in/rss/feed.xml",
        "source": "BoomLive",
        "region": "IN",
        "language": "en",
        "credibility": 87
    },
    {
        "url": "https://factly.in/feed/",
        "source": "Factly",
        "region": "IN",
        "language": "en",
        "credibility": 86
    },
    {
        "url": "https://www.vishvasnews.com/english/feed/",
        "source": "Vishvas News",
        "region": "IN",
        "language": "en",
        "credibility": 85
    },
    
    # UK Fact-Checkers
    {
        "url": "https://fullfact.org/feed/",
        "source": "FullFact",
        "region": "UK",
        "language": "en",
        "credibility": 92
    },
    
    # International
    {
        "url": "https://www.reuters.com/arc/outboundfeeds/v3/all/section/fact-check/",
        "source": "Reuters Fact Check",
        "region": "INT",
        "language": "en",
        "credibility": 95
    },
    {
        "url": "https://leadstories.com/rss/factcheck.xml",
        "source": "Lead Stories",
        "region": "US",
        "language": "en",
        "credibility": 87
    }
]

# Keywords for threat scoring
HIGH_THREAT_KEYWORDS = [
    "alert", "warning", "urgent", "danger", "dead", "kill", "poison",
    "virus", "outbreak", "attack", "terrorism", "explosion", "crash",
    "conspiracy", "cover-up", "hacked", "breach", "vaccine", "pandemic",
    "emergency", "breaking", "fatal", "deadly"
]

MEDIUM_THREAT_KEYWORDS = [
    "fake", "hoax", "scam", "fraud", "rumor", "debunked", "false",
    "misleading", "incorrect", "lie", "myth", "viral", "banned",
    "misinformation", "disinformation", "propaganda"
]


def calculate_threat_score(title: str, summary: str, published_date: datetime) -> int:
    """
    Calculate threat score based on content analysis.
    
    Args:
        title: Article title
        summary: Article summary
        published_date: Publication date
        
    Returns:
        Threat score 0-100
    """
    score = 20  # Base score
    text = f"{title} {summary}".lower()
    
    # High threat keywords
    high_matches = sum(1 for kw in HIGH_THREAT_KEYWORDS if kw in text)
    if high_matches >= 3:
        score = 90
    elif high_matches >= 2:
        score = 80
    elif high_matches >= 1:
        score = 70
    
    # Medium threat keywords (if not already high)
    if score < 70:
        medium_matches = sum(1 for kw in MEDIUM_THREAT_KEYWORDS if kw in text)
        if medium_matches >= 3:
            score = max(score, 65)
        elif medium_matches >= 2:
            score = max(score, 55)
        elif medium_matches >= 1:
            score = max(score, 45)
    
    # Recency boost
    if published_date.tzinfo is not None:
        published_date = published_date.replace(tzinfo=None)
    
    days_old = (datetime.now() - published_date).days
    if days_old < 1:
        score += 10
    elif days_old < 3:
        score += 5
    
    return min(100, score)


def get_intensity_from_score(score: int) -> str:
    """Convert threat score to intensity level."""
    if score >= 70:
        return "high"
    elif score >= 45:
        return "medium"
    return "low"


async def extract_topics_with_llm(title: str, summary: str) -> List[str]:
    """
    Use LLM to extract topics from article.
    
    Args:
        title: Article title
        summary: Article summary
        
    Returns:
        List of topic strings
    """
    try:
        llm = get_llm()
        
        prompt = f"""
Extract 2-4 key topics from this fact-check article. Return only the topic names.

Title: {title}
Summary: {summary[:500]}

Return a JSON array of topic strings.
Example: ["COVID-19", "Vaccines", "Health Misinformation"]
"""
        
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        
        topics = json.loads(content)
        return topics if isinstance(topics, list) else []
        
    except Exception as e:
        print(f"Error extracting topics: {e}")
        # Fallback: extract keywords manually
        return []


async def fetch_and_update_feed():
    """
    Fetch RSS feeds, process entries, and update database.
    Runs as a background task every N minutes.
    """
    print(f"[{datetime.now()}] Starting feed update...")
    
    from app.db.supabase import supabase_db
    from app.db.neo4j import neo4j_db
    
    # Ensure database connections are active
    try:
        supabase_db.ensure_connected()
    except Exception as e:
        print(f"[{datetime.now()}] Failed to connect to Supabase: {e}")
        return
    
    # Try to connect Neo4j (optional)
    neo4j_available = await neo4j_db.ensure_connected()
    
    processed_count = 0
    error_count = 0
    
    for feed_config in RSS_FEEDS:
        feed_url = feed_config["url"]
        source_name = feed_config["source"]
        region = feed_config["region"]
        language = feed_config.get("language", "en")
        source_credibility = feed_config.get("credibility", 80)
        
        try:
            # Parse RSS feed
            feed = feedparser.parse(
                feed_url,
                request_headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            
            if not feed.entries:
                print(f"No entries found for {source_name}")
                continue
            
            for entry in feed.entries[:10]:  # Process latest 10 entries
                try:
                    title = entry.get("title", "").strip()
                    link = entry.get("link", "")
                    summary = entry.get("summary", entry.get("description", "")).strip()
                    published = entry.get("published", str(datetime.now()))
                    
                    if not title:
                        continue
                    
                    # Parse publication date
                    try:
                        published_date = date_parser.parse(published)
                    except Exception:
                        published_date = datetime.now()
                    
                    # Calculate threat score
                    threat_score = calculate_threat_score(title, summary, published_date)
                    intensity = get_intensity_from_score(threat_score)
                    
                    # Update Supabase
                    sources_data = [{
                        "name": source_name,
                        "url": link,
                        "credibility": source_credibility,
                        "region": region
                    }]
                    
                    await supabase_db.upsert_threat(
                        topic=title,
                        claim_summary=summary[:1000] if summary else "",
                        source_count=1,
                        intensity=intensity,
                        graph_centrality_score=threat_score / 100.0,
                        sources=sources_data,
                        language=language,
                        link=link
                    )
                    
                    # Update Neo4j graph if connected
                    if neo4j_available and neo4j_db.is_connected():
                        try:
                            # Extract topics for graph relationships
                            topics = await extract_topics_with_llm(title, summary)
                            
                            claim_id = str(uuid.uuid4())
                            await neo4j_db.create_claim(
                                claim_id=claim_id,
                                text=title,
                                source_name=source_name,
                                source_url=link,
                                topics=topics if topics else [region, "General"]
                            )
                        except Exception as neo4j_err:
                            print(f"Neo4j error (non-fatal): {neo4j_err}")
                    
                    processed_count += 1
                    
                except Exception as e:
                    print(f"Error processing entry from {source_name}: {e}")
                    error_count += 1
                    
        except Exception as e:
            print(f"Error fetching feed {source_name}: {e}")
            error_count += 1
    
    # Run graph analysis if Neo4j is connected
    if neo4j_available and neo4j_db.is_connected():
        await update_graph_centrality()
    
    print(f"[{datetime.now()}] Feed update completed. Processed: {processed_count}, Errors: {error_count}")


async def update_graph_centrality():
    """
    Update centrality scores in the graph and sync trending to Supabase.
    """
    from app.db.neo4j import neo4j_db
    from app.db.supabase import supabase_db
    
    # Ensure connections are active
    if not await neo4j_db.ensure_connected():
        return
    
    try:
        # Get trending claims by connections
        trending = await neo4j_db.get_trending_by_connections(limit=20)
        
        # Update Supabase with new centrality scores
        for item in trending:
            claim = item.get("claim", {})
            connections = claim.get("connections", 0)
            
            # Normalize connections to 0-1 score
            centrality_score = min(1.0, connections / 10.0)
            
            intensity = "high" if centrality_score > 0.7 else "medium" if centrality_score > 0.4 else "low"
            
            # Update the threat feed entry
            await supabase_db.upsert_threat(
                topic=claim.get("text", ""),
                claim_summary="",
                source_count=connections,
                intensity=intensity,
                graph_centrality_score=centrality_score,
                sources=[],
                link=claim.get("source_url", "")
            )
            
    except Exception as e:
        print(f"Error updating graph centrality: {e}")


async def get_trending_topics() -> List[Dict[str, Any]]:
    """
    Get currently trending misinformation topics.
    
    Returns:
        List of trending topics with metadata
    """
    from app.db.neo4j import neo4j_db
    
    if await neo4j_db.ensure_connected():
        try:
            return await neo4j_db.get_trending_topics(limit=10)
        except Exception as e:
            print(f"Error getting trending topics: {e}")
    return []

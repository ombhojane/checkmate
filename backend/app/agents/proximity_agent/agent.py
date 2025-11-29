"""
Local Proximity Agent for CheckmateAI.
Monitors regional fact-checkers, extracts location from claims, and ranks by virality.
"""

import feedparser
import warnings
from datetime import datetime
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser
from langchain_core.messages import HumanMessage
import json
import hashlib

from app.core.config import settings
from app.core.llm import get_llm

# Suppress langchain deprecation warnings
warnings.filterwarnings("ignore", message="Convert_system_message_to_human will be deprecated!")


# Regional Fact-Checker RSS Feeds
REGIONAL_FEEDS = [
    # India
    {"url": "https://www.altnews.in/feed/", "source": "AltNews", "default_region": "India", "language": "en"},
    {"url": "https://factly.in/feed/", "source": "Factly", "default_region": "India", "language": "en"},
    {"url": "https://www.vishvasnews.com/english/feed/", "source": "Vishvas News", "default_region": "India", "language": "en"},
    {"url": "https://www.boomlive.in/rss/feed.xml", "source": "BoomLive", "default_region": "India", "language": "en"},
    
    # US
    {"url": "https://www.snopes.com/feed/", "source": "Snopes", "default_region": "United States", "language": "en"},
    {"url": "https://www.politifact.com/rss/factchecks/", "source": "PolitiFact", "default_region": "United States", "language": "en"},
    {"url": "https://www.factcheck.org/feed/", "source": "FactCheck.org", "default_region": "United States", "language": "en"},
    {"url": "https://leadstories.com/rss/factcheck.xml", "source": "Lead Stories", "default_region": "United States", "language": "en"},
    
    # UK/Europe
    {"url": "https://fullfact.org/feed/", "source": "FullFact", "default_region": "United Kingdom", "language": "en"},
    
    # International
    {"url": "https://www.reuters.com/arc/outboundfeeds/v3/all/section/fact-check/", "source": "Reuters Fact Check", "default_region": "Global", "language": "en"},
    
    # Africa
    {"url": "https://africacheck.org/feed/", "source": "Africa Check", "default_region": "Africa", "language": "en"},
    
    # Latin America  
    {"url": "https://chequeado.com/feed/", "source": "Chequeado", "default_region": "Argentina", "language": "es"},
]


async def extract_region_from_claim(title: str, summary: str, default_region: str) -> Dict[str, Any]:
    """
    Use Gemini to extract geographic region from claim text.
    
    Args:
        title: Claim title
        summary: Claim summary/description
        default_region: Fallback region from source
        
    Returns:
        Dict with region, country, and confidence
    """
    try:
        llm = get_llm()
        
        prompt = f"""Extract the geographic location mentioned in this fact-check claim.

Title: {title}
Summary: {summary[:500] if summary else 'N/A'}

Return a JSON object with:
- "country": The country name (e.g., "India", "United States", "Nigeria")
- "region": More specific region if mentioned (e.g., "Maharashtra", "California", "Lagos")
- "confidence": Your confidence level ("high", "medium", "low")

If no specific location is mentioned, use "{default_region}" as the country.

Return ONLY valid JSON, no other text.
Example: {{"country": "India", "region": "Delhi", "confidence": "high"}}"""

        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # Clean up response
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        
        result = json.loads(content)
        return {
            "country": result.get("country", default_region),
            "region": result.get("region", ""),
            "confidence": result.get("confidence", "low")
        }
        
    except Exception as e:
        print(f"Error extracting region: {e}")
        return {
            "country": default_region,
            "region": "",
            "confidence": "low"
        }


def generate_claim_id(title: str, source: str) -> str:
    """Generate a unique ID for a claim based on title and source."""
    content = f"{title}:{source}".encode('utf-8')
    return hashlib.sha256(content).hexdigest()[:16]


def calculate_virality_score(source_count: int, is_recent: bool) -> float:
    """
    Calculate simple virality score based on source count.
    
    Args:
        source_count: Number of sources reporting this claim
        is_recent: Whether the claim is from the last 24 hours
        
    Returns:
        Virality score 0-1
    """
    base_score = min(1.0, source_count / 5.0)  # Max out at 5 sources
    if is_recent:
        base_score = min(1.0, base_score + 0.2)  # Boost recent claims
    return round(base_score, 2)


async def fetch_regional_claims():
    """
    Fetch claims from regional fact-checkers, extract locations, and store in Supabase.
    Runs every 6 hours.
    """
    print(f"[{datetime.now()}] Starting regional claims update...")
    
    from app.db.supabase import supabase_db
    
    # Ensure database connection
    try:
        supabase_db.ensure_connected()
    except Exception as e:
        print(f"[{datetime.now()}] Failed to connect to Supabase: {e}")
        return
    
    processed_count = 0
    error_count = 0
    
    for feed_config in REGIONAL_FEEDS:
        feed_url = feed_config["url"]
        source_name = feed_config["source"]
        default_region = feed_config["default_region"]
        language = feed_config.get("language", "en")
        
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
            
            for entry in feed.entries[:10]:  # Process latest 10 entries per source
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
                        if published_date.tzinfo:
                            published_date = published_date.replace(tzinfo=None)
                    except Exception:
                        published_date = datetime.now()
                    
                    # Check if recent (last 24 hours)
                    is_recent = (datetime.now() - published_date).days < 1
                    
                    # Extract region using Gemini
                    location_data = await extract_region_from_claim(title, summary, default_region)
                    
                    # Generate unique claim ID
                    claim_id = generate_claim_id(title, source_name)
                    
                    # Calculate virality score (simple: source count = 1 for now)
                    virality_score = calculate_virality_score(1, is_recent)
                    
                    # Save to Supabase
                    await supabase_db.upsert_regional_claim(
                        claim_id=claim_id,
                        title=title,
                        summary=summary[:1000] if summary else "",
                        source_name=source_name,
                        source_url=link,
                        country=location_data["country"],
                        region=location_data["region"],
                        location_confidence=location_data["confidence"],
                        virality_score=virality_score,
                        language=language,
                        published_at=published_date.isoformat()
                    )
                    
                    processed_count += 1
                    
                except Exception as e:
                    print(f"Error processing entry from {source_name}: {e}")
                    error_count += 1
                    
        except Exception as e:
            print(f"Error fetching feed {source_name}: {e}")
            error_count += 1
    
    print(f"[{datetime.now()}] Regional claims update completed. Processed: {processed_count}, Errors: {error_count}")


async def get_claims_by_region(
    country: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Get top claims for a specific region, sorted by virality.
    
    Args:
        country: Country name to filter by (None for all)
        limit: Maximum number of claims to return
        
    Returns:
        List of regional claims
    """
    from app.db.supabase import supabase_db
    
    try:
        supabase_db.ensure_connected()
        return await supabase_db.get_regional_claims(country=country, limit=limit)
    except Exception as e:
        print(f"Error fetching regional claims: {e}")
        return []


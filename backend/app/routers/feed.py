"""
Threat Feed API endpoints for CheckmateAI.
Provides access to trending misinformation threats.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json

from app.models.schemas import FeedItem, FeedFilterParams
from app.db.supabase import supabase_db

router = APIRouter(prefix="/api", tags=["Threat Feed"])


def parse_sources(sources_data) -> List[dict]:
    """Parse sources from database (may be string or list)."""
    if sources_data is None:
        return []
    if isinstance(sources_data, str):
        try:
            parsed = json.loads(sources_data)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
    if isinstance(sources_data, list):
        return sources_data
    return []


@router.get("/feed", response_model=List[FeedItem])
async def get_feed(
    limit: int = Query(default=10, ge=1, le=100, description="Number of items to return"),
    intensity: Optional[str] = Query(default=None, description="Filter by intensity: low, medium, high"),
    language: Optional[str] = Query(default=None, description="Filter by language code")
):
    """
    Get the threat feed with trending misinformation.
    
    Returns threats sorted by centrality score (trending factor).
    
    - **limit**: Maximum number of items (1-100)
    - **intensity**: Filter by threat level (low, medium, high)
    - **language**: Filter by language code (en, hi, etc.)
    """
    # Validate intensity
    if intensity and intensity not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid intensity. Must be: low, medium, or high"
        )
    
    try:
        threats = await supabase_db.get_threat_feed(
            limit=limit,
            intensity=intensity,
            language=language
        )
        
        result = []
        for t in threats:
            sources = parse_sources(t.get("sources"))
            result.append(FeedItem(
                id=t.get("id"),
                topic=t.get("topic", ""),
                claim_summary=t.get("claim_summary", ""),
                source_count=t.get("source_count", 1),
                intensity=t.get("intensity", "medium"),
                graph_centrality_score=t.get("graph_centrality_score", 0),
                sources=sources,
                language=t.get("language", "en"),
                link=t.get("link"),
                first_seen=t.get("first_seen"),
                last_updated=t.get("last_updated"),
                # Legacy field mappings
                title=t.get("topic", ""),
                published_date=t.get("first_seen"),
                summary=t.get("claim_summary", ""),
                source=sources[0].get("name", "") if sources else "",
                threat_score=int(t.get("graph_centrality_score", 0) * 100)
            ))
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch feed: {str(e)}"
        )


@router.get("/feed/intensity/{level}", response_model=List[FeedItem])
async def get_feed_by_intensity(
    level: str,
    limit: int = Query(default=10, ge=1, le=100, description="Number of items to return")
):
    """
    Get threats filtered by intensity level.
    
    - **level**: Intensity level (low, medium, high)
    - **limit**: Maximum number of items
    """
    if level not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid intensity level. Must be: low, medium, or high"
        )
    
    try:
        threats = await supabase_db.get_threat_feed(limit=limit, intensity=level)
        
        return [
            FeedItem(
                id=t.get("id"),
                topic=t.get("topic", ""),
                claim_summary=t.get("claim_summary", ""),
                source_count=t.get("source_count", 1),
                intensity=t.get("intensity", level),
                graph_centrality_score=t.get("graph_centrality_score", 0),
                sources=parse_sources(t.get("sources")),
                language=t.get("language", "en"),
                link=t.get("link"),
                first_seen=t.get("first_seen"),
                last_updated=t.get("last_updated")
            )
            for t in threats
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch feed: {str(e)}"
        )


@router.get("/feed/trending", response_model=List[FeedItem])
async def get_trending_threats(
    limit: int = Query(default=5, ge=1, le=20, description="Number of trending items")
):
    """
    Get the most trending misinformation threats.
    
    Returns threats with highest centrality scores (most connected in the graph).
    """
    try:
        # Get high intensity threats first
        threats = await supabase_db.get_threat_feed(limit=limit, intensity="high")
        
        # If not enough high intensity, add medium
        if len(threats) < limit:
            medium = await supabase_db.get_threat_feed(
                limit=limit - len(threats),
                intensity="medium"
            )
            threats.extend(medium)
        
        return [
            FeedItem(
                id=t.get("id"),
                topic=t.get("topic", ""),
                claim_summary=t.get("claim_summary", ""),
                source_count=t.get("source_count", 1),
                intensity=t.get("intensity", "medium"),
                graph_centrality_score=t.get("graph_centrality_score", 0),
                sources=parse_sources(t.get("sources")),
                language=t.get("language", "en"),
                link=t.get("link"),
                first_seen=t.get("first_seen"),
                last_updated=t.get("last_updated")
            )
            for t in threats
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trending: {str(e)}"
        )


@router.get("/feed/topics")
async def get_trending_topics(
    limit: int = Query(default=10, ge=1, le=30, description="Number of topics")
):
    """
    Get trending misinformation topics from the graph.
    
    Returns topic clusters with claim counts.
    """
    from app.agents.feed_agent.graph_analysis import get_topic_clusters
    
    try:
        topics = await get_topic_clusters()
        return {"topics": topics[:limit]}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topics: {str(e)}"
        )


@router.post("/feed/refresh")
async def trigger_feed_refresh():
    """
    Manually trigger a feed refresh.
    
    Fetches latest data from all RSS sources and updates the database.
    For testing/admin purposes.
    """
    from app.agents.feed_agent.agent import fetch_and_update_feed
    
    try:
        await fetch_and_update_feed()
        return {"status": "success", "message": "Feed refresh completed"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Feed refresh failed: {str(e)}"
        )

"""
Local Proximity API endpoints for CheckmateAI.
Provides access to regional misinformation claims.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.supabase import supabase_db

router = APIRouter(prefix="/api/proximity", tags=["Local Proximity"])


class RegionalClaim(BaseModel):
    """Regional claim response model."""
    claim_id: str
    title: str
    summary: Optional[str] = None
    source_name: str
    source_url: Optional[str] = None
    country: str
    region: Optional[str] = None
    location_confidence: Optional[str] = None
    virality_score: float
    language: str = "en"
    published_at: Optional[str] = None
    last_updated: Optional[str] = None


class CountriesResponse(BaseModel):
    """Available countries response."""
    countries: List[str]
    count: int


@router.get("/claims", response_model=List[RegionalClaim])
async def get_regional_claims(
    country: Optional[str] = Query(default=None, description="Filter by country name"),
    language: Optional[str] = Query(default=None, description="Filter by language code"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of claims to return")
):
    """
    Get top regional claims sorted by virality score.
    
    - **country**: Optional country filter (e.g., "India", "United States")
    - **language**: Optional language filter (e.g., "en", "es")
    - **limit**: Maximum number of claims (1-100)
    """
    try:
        claims = await supabase_db.get_regional_claims(
            country=country,
            limit=limit,
            language=language
        )
        
        return [
            RegionalClaim(
                claim_id=c.get("claim_id", ""),
                title=c.get("title", ""),
                summary=c.get("summary"),
                source_name=c.get("source_name", ""),
                source_url=c.get("source_url"),
                country=c.get("country", ""),
                region=c.get("region"),
                location_confidence=c.get("location_confidence"),
                virality_score=c.get("virality_score", 0),
                language=c.get("language", "en"),
                published_at=c.get("published_at"),
                last_updated=c.get("last_updated")
            )
            for c in claims
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch claims: {str(e)}"
        )


@router.get("/claims/{country}", response_model=List[RegionalClaim])
async def get_claims_by_country(
    country: str,
    limit: int = Query(default=20, ge=1, le=100, description="Number of claims to return")
):
    """
    Get top claims for a specific country.
    
    - **country**: Country name (e.g., "India", "United States", "Nigeria")
    - **limit**: Maximum number of claims
    """
    try:
        claims = await supabase_db.get_regional_claims(country=country, limit=limit)
        
        if not claims:
            raise HTTPException(
                status_code=404,
                detail=f"No claims found for country: {country}"
            )
        
        return [
            RegionalClaim(
                claim_id=c.get("claim_id", ""),
                title=c.get("title", ""),
                summary=c.get("summary"),
                source_name=c.get("source_name", ""),
                source_url=c.get("source_url"),
                country=c.get("country", ""),
                region=c.get("region"),
                location_confidence=c.get("location_confidence"),
                virality_score=c.get("virality_score", 0),
                language=c.get("language", "en"),
                published_at=c.get("published_at"),
                last_updated=c.get("last_updated")
            )
            for c in claims
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch claims: {str(e)}"
        )


@router.get("/countries", response_model=CountriesResponse)
async def get_available_countries():
    """
    Get list of all countries with available claims.
    """
    try:
        countries = await supabase_db.get_available_countries()
        return CountriesResponse(countries=countries, count=len(countries))
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch countries: {str(e)}"
        )


@router.post("/refresh")
async def trigger_proximity_refresh():
    """
    Manually trigger a regional claims refresh.
    For testing/admin purposes.
    """
    from app.agents.proximity_agent.agent import fetch_regional_claims
    
    try:
        await fetch_regional_claims()
        return {"status": "success", "message": "Regional claims refresh completed"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Refresh failed: {str(e)}"
        )


"""
Vaccine Digest API endpoints for CheckmateAI.
Provides access to weekly misinformation vaccine digests.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.schemas import VaccineDigest, LegacyVaccineResponse, VaccineTrend
from app.agents.vaccine_agent.agent import (
    generate_weekly_vaccine,
    get_latest_digest,
    get_digest_archive
)

router = APIRouter(prefix="/api", tags=["Vaccine Digest"])


@router.get("/vaccine/latest", response_model=VaccineDigest)
async def get_latest_vaccine():
    """
    Get the most recent weekly vaccine digest.
    
    Returns the latest "Misinformation Vaccine" with top 5 trending false claims,
    their corrections, and impact explanations.
    """
    try:
        digest = await get_latest_digest()
        
        if not digest:
            raise HTTPException(
                status_code=404,
                detail="No vaccine digest available yet. Check back after the weekly generation."
            )
        
        return VaccineDigest(
            id=digest.get("id"),
            week_start=digest.get("week_start", ""),
            week_end=digest.get("week_end", ""),
            claims=digest.get("claims", []),
            generated_at=digest.get("generated_at"),
            view_count=digest.get("view_count", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vaccine digest: {str(e)}"
        )


@router.get("/vaccine/archive", response_model=List[VaccineDigest])
async def get_vaccine_archive(
    limit: int = Query(default=10, ge=1, le=52, description="Number of digests to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset")
):
    """
    Get archived vaccine digests.
    
    Returns past weekly digests with pagination support.
    Useful for historical analysis or catching up on missed weeks.
    """
    try:
        digests = await get_digest_archive(limit=limit, offset=offset)
        
        return [
            VaccineDigest(
                id=d.get("id"),
                week_start=d.get("week_start", ""),
                week_end=d.get("week_end", ""),
                claims=d.get("claims", []),
                generated_at=d.get("generated_at"),
                view_count=d.get("view_count", 0)
            )
            for d in digests
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch archive: {str(e)}"
        )


@router.post("/vaccine/trigger-now")
async def trigger_vaccine_generation(
    language: str = Query(default="en", description="Language for the digest content")
):
    """
    Manually trigger vaccine digest generation.
    
    Generates a new digest based on current threat data.
    For testing/admin purposes - normally runs weekly on schedule.
    
    - **language**: Language code for the generated content (en, hi, es, etc.)
    """
    try:
        result = await generate_weekly_vaccine(language=language)
        
        if result:
            return {
                "status": "success",
                "message": "Vaccine digest generated successfully",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate vaccine digest. Check if there are recent threats."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Vaccine generation failed: {str(e)}"
        )


# Legacy endpoint for backwards compatibility
@router.get("/vaccine/legacy", response_model=LegacyVaccineResponse)
async def get_latest_vaccine_legacy():
    """
    Legacy endpoint for backwards compatibility.
    
    Returns vaccine digest in the old format with simplified structure.
    Deprecated: Use /api/vaccine/latest instead.
    """
    try:
        digest = await get_latest_digest()
        
        if not digest:
            return LegacyVaccineResponse(
                week_of=None,
                trends=[]
            )
        
        # Convert to legacy format
        trends = []
        for claim in digest.get("claims", []):
            trends.append(VaccineTrend(
                lie=claim.get("lie", ""),
                truth=claim.get("truth", ""),
                why_it_matters=claim.get("why_it_matters", "")
            ))
        
        return LegacyVaccineResponse(
            week_of=digest.get("generated_at"),
            trends=trends
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vaccine digest: {str(e)}"
        )

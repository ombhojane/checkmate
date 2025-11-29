"""
Scam Report API endpoints for CheckmateAI.
Allows users to report scams with evidence.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models.schemas import ScamReportRequest, ScamReportResponse
from app.db.supabase import supabase_db

router = APIRouter(prefix="/api", tags=["Scam Reports"])


@router.post("/report-scam", response_model=ScamReportResponse)
async def report_scam(request: ScamReportRequest):
    """
    Report a scam with title, description, and optional evidence URLs.
    
    - **title**: Brief title describing the scam
    - **description**: Detailed description of the scam
    - **evidence_urls**: List of URLs to evidence images (optional)
    """
    result = await supabase_db.insert_scam_report(
        title=request.title,
        description=request.description,
        evidence_urls=request.evidence_urls
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save scam report")
    
    return ScamReportResponse(
        id=result["id"],
        title=result["title"],
        description=result["description"],
        evidence_urls=result.get("evidence_urls", []),
        status=result.get("status", "pending"),
        created_at=result["created_at"]
    )


@router.get("/scam-reports", response_model=List[ScamReportResponse])
async def get_scam_reports(limit: int = 20, status: str = None):
    """
    Get list of scam reports.
    
    - **limit**: Maximum number of reports to return (default: 20)
    - **status**: Filter by status (pending, reviewing, verified, dismissed)
    """
    reports = await supabase_db.get_scam_reports(limit=limit, status=status)
    
    return [
        ScamReportResponse(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            evidence_urls=r.get("evidence_urls", []),
            status=r.get("status", "pending"),
            created_at=r["created_at"]
        )
        for r in reports
    ]



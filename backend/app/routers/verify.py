"""
Verification API endpoints for CheckmateAI.
Handles claim verification requests and history.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.models.schemas import (
    VerifyRequest,
    VerifyResponse,
    SourceInfo,
    VerificationHistoryItem,
    SimilarClaimResponse,
    PaginatedResponse
)
from app.agents.verification_agent.graph import graph
from app.agents.verification_agent.state import create_initial_state
from app.db.supabase import supabase_db

router = APIRouter(prefix="/api", tags=["Verification"])


@router.post("/verify", response_model=VerifyResponse)
async def verify_claim(request: VerifyRequest):
    """
    Verify a claim for misinformation.
    
    Accepts text claims and optional images for multimodal verification.
    Returns verdict, confidence, detailed analysis, and sources.
    
    - **text**: The claim to verify (required)
    - **image_base64**: Base64 encoded image for image+text claims (optional)
    - **language**: Response language code (default: en)
    """
    # Create initial state
    initial_state = create_initial_state(
        claim=request.text,
        image_data=request.image_base64,
        language=request.language
    )
    
    try:
        # Run verification workflow
        result = await graph.ainvoke(initial_state)
        
        # Handle non-checkworthy claims
        if not result.get("is_checkworthy"):
            return VerifyResponse(
                verdict="Unverifiable",
                confidence=0,
                intensity="low",
                summary=result.get("checkworthy_reason", "This claim cannot be fact-checked."),
                detailed_analysis="The claim was determined to be an opinion, question, or not a verifiable factual statement.",
                sources=[],
                processing_time_ms=0,
                similar_claims=None,
                verification_id=None
            )
        
        # Format sources
        sources = []
        for s in result.get("sources_with_scores", []):
            sources.append(SourceInfo(
                url=s.get("url", ""),
                title=s.get("title", ""),
                credibility_score=s.get("credibility_score", 50),
                snippet=s.get("content", "")[:500]
            ))
        
        # Calculate processing time
        start_time = result.get("processing_start_time")
        processing_time_ms = 0
        if start_time:
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return VerifyResponse(
            verdict=result.get("verdict", "Unverified"),
            confidence=result.get("confidence", 0),
            intensity=result.get("intensity", "medium"),
            summary=result.get("summary", "Unable to verify this claim."),
            detailed_analysis=result.get("detailed_analysis", ""),
            sources=sources,
            processing_time_ms=processing_time_ms,
            similar_claims=result.get("similar_claims"),
            verification_id=result.get("verification_id")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.get("/verify/history", response_model=List[VerificationHistoryItem])
async def get_verification_history(
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    language: Optional[str] = Query(default=None, description="Filter by language")
):
    """
    Get verification history.
    
    Returns a list of past verifications with pagination support.
    """
    try:
        history = await supabase_db.get_verification_history(
            limit=limit,
            offset=offset,
            language=language
        )
        
        return [
            VerificationHistoryItem(
                id=item.get("id", ""),
                claim_text=item.get("claim_text", ""),
                verdict=item.get("verdict", "Unknown"),
                confidence_score=item.get("confidence_score", 0),
                intensity=item.get("intensity", "medium"),
                summary=item.get("summary", ""),
                language=item.get("language", "en"),
                created_at=item.get("created_at", datetime.utcnow())
            )
            for item in history
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )


@router.get("/verify/{verification_id}", response_model=VerifyResponse)
async def get_verification_by_id(verification_id: str):
    """
    Get a specific verification by ID.
    
    Returns the full verification details for a previously verified claim.
    """
    try:
        verification = await supabase_db.get_verification_by_id(verification_id)
        
        if not verification:
            raise HTTPException(
                status_code=404,
                detail="Verification not found"
            )
        
        # Parse sources
        sources_data = verification.get("sources", [])
        if isinstance(sources_data, str):
            import json
            sources_data = json.loads(sources_data)
        
        sources = [
            SourceInfo(
                url=s.get("url", ""),
                title=s.get("title", ""),
                credibility_score=s.get("credibility_score", 50),
                snippet=s.get("snippet", "")
            )
            for s in sources_data
        ]
        
        return VerifyResponse(
            verdict=verification.get("verdict", "Unknown"),
            confidence=verification.get("confidence_score", 0),
            intensity=verification.get("intensity", "medium"),
            summary=verification.get("summary", ""),
            detailed_analysis=verification.get("detailed_analysis", ""),
            sources=sources,
            processing_time_ms=verification.get("processing_time_ms", 0),
            similar_claims=None,
            verification_id=verification_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch verification: {str(e)}"
        )


@router.get("/verify/similar/{verification_id}", response_model=List[SimilarClaimResponse])
async def get_similar_claims(
    verification_id: str,
    limit: int = Query(default=5, ge=1, le=20, description="Maximum similar claims to return")
):
    """
    Find claims similar to a verified claim.
    
    Uses semantic similarity to find related verifications.
    """
    try:
        # Get the verification to get its claim text
        verification = await supabase_db.get_verification_by_id(verification_id)
        
        if not verification:
            raise HTTPException(
                status_code=404,
                detail="Verification not found"
            )
        
        # Generate embedding for the claim
        from app.agents.verification_agent.tools import generate_embedding
        from app.core.config import settings
        
        claim_text = verification.get("claim_text", "")
        embedding = await generate_embedding(claim_text)
        
        if not embedding:
            return []
        
        # Find similar claims
        similar = await supabase_db.find_similar_claims(
            embedding=embedding,
            threshold=settings.CLAIM_SIMILARITY_THRESHOLD,
            limit=limit + 1  # +1 to exclude self
        )
        
        # Filter out the original verification and format response
        results = []
        for item in similar:
            if item.get("verification_id") != verification_id:
                results.append(SimilarClaimResponse(
                    verification_id=item.get("verification_id", ""),
                    claim_text=item.get("claim_text", ""),
                    verdict=item.get("verdict", "Unknown"),
                    confidence_score=item.get("confidence_score", 0),
                    summary=item.get("summary", ""),
                    similarity=item.get("similarity", 0)
                ))
        
        return results[:limit]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find similar claims: {str(e)}"
        )

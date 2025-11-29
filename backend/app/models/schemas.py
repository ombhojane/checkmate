"""
Pydantic schemas for CheckmateAI API.
Defines request/response models for all endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class Verdict(str, Enum):
    """Possible verification verdicts."""
    TRUE = "True"
    FALSE = "False"
    MISLEADING = "Misleading"
    UNVERIFIED = "Unverified"
    ERROR = "Error"


class Intensity(str, Enum):
    """Threat intensity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ==================== VERIFICATION SCHEMAS ====================

class SourceInfo(BaseModel):
    """Information about a source used in verification."""
    url: str = Field(..., description="URL of the source")
    title: str = Field(default="", description="Title of the source article")
    credibility_score: int = Field(default=50, ge=0, le=100, description="Credibility score 0-100")
    snippet: str = Field(default="", description="Relevant snippet from the source")


class VerifyRequest(BaseModel):
    """Request schema for claim verification."""
    text: str = Field(..., min_length=1, description="The claim text to verify")
    image_base64: Optional[str] = Field(
        default=None, 
        description="Base64 encoded image for multimodal verification"
    )
    language: str = Field(default="en", description="Language code (e.g., en, hi, es)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Drinking bleach cures COVID-19",
                "language": "en"
            }
        }


class VerifyResponse(BaseModel):
    """Response schema for claim verification."""
    verdict: str = Field(..., description="Verdict: True, False, Misleading, Unverified")
    confidence: float = Field(..., ge=0, le=100, description="Confidence score 0-100")
    intensity: str = Field(default="medium", description="Claim intensity: low, medium, high")
    summary: str = Field(..., description="Brief summary of the verdict")
    detailed_analysis: str = Field(default="", description="Detailed analysis of the claim")
    sources: List[SourceInfo] = Field(default_factory=list, description="Sources used for verification")
    processing_time_ms: int = Field(default=0, ge=0, description="Processing time in milliseconds")
    similar_claims: Optional[List[str]] = Field(
        default=None, 
        description="IDs of similar previously verified claims"
    )
    verification_id: Optional[str] = Field(
        default=None,
        description="ID of this verification record"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "verdict": "False",
                "confidence": 95.0,
                "intensity": "high",
                "summary": "This claim is dangerous misinformation. Bleach is toxic and cannot cure any disease.",
                "detailed_analysis": "The claim that drinking bleach cures COVID-19 is false and extremely dangerous...",
                "sources": [
                    {
                        "url": "https://www.snopes.com/fact-check/bleach-cure-coronavirus/",
                        "title": "Bleach Does Not Cure Coronavirus",
                        "credibility_score": 95,
                        "snippet": "Medical experts confirm that ingesting bleach is dangerous..."
                    }
                ],
                "processing_time_ms": 1234,
                "similar_claims": None,
                "verification_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class VerificationHistoryItem(BaseModel):
    """Schema for verification history items."""
    id: str
    claim_text: str
    verdict: str
    confidence_score: float
    intensity: str
    summary: str
    language: str
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "claim_text": "5G causes cancer",
                "verdict": "False",
                "confidence_score": 92.0,
                "intensity": "high",
                "summary": "No scientific evidence supports this claim.",
                "language": "en",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class SimilarClaimResponse(BaseModel):
    """Response schema for similar claims search."""
    verification_id: str
    claim_text: str
    verdict: str
    confidence_score: float
    summary: str
    similarity: float = Field(..., ge=0, le=1, description="Similarity score 0-1")


# ==================== THREAT FEED SCHEMAS ====================

class FeedItem(BaseModel):
    """Schema for threat feed items."""
    id: Optional[str] = None
    topic: str = Field(..., description="Topic/title of the threat")
    claim_summary: str = Field(default="", description="Summary of the misinformation claim")
    source_count: int = Field(default=1, ge=1, description="Number of sources reporting this")
    intensity: str = Field(default="medium", description="Threat intensity: low, medium, high")
    graph_centrality_score: float = Field(default=0.0, description="Neo4j centrality score")
    sources: List[dict] = Field(default_factory=list, description="Source information")
    language: str = Field(default="en", description="Language code")
    link: Optional[str] = Field(default=None, description="Link to original source")
    first_seen: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    
    # Legacy fields for backwards compatibility
    title: Optional[str] = Field(default=None, description="Alias for topic (deprecated)")
    published_date: Optional[datetime] = Field(default=None, description="Alias for first_seen (deprecated)")
    summary: Optional[str] = Field(default=None, description="Alias for claim_summary (deprecated)")
    source: Optional[str] = Field(default=None, description="Primary source name (deprecated)")
    threat_score: Optional[int] = Field(default=None, description="Alias for intensity score (deprecated)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "topic": "5G Health Conspiracy",
                "claim_summary": "False claims linking 5G networks to health issues continue to spread.",
                "source_count": 5,
                "intensity": "high",
                "graph_centrality_score": 0.85,
                "sources": [{"name": "Snopes", "url": "https://snopes.com/..."}],
                "language": "en",
                "first_seen": "2024-01-10T08:00:00Z",
                "last_updated": "2024-01-15T14:30:00Z"
            }
        }


class FeedFilterParams(BaseModel):
    """Query parameters for filtering the threat feed."""
    limit: int = Field(default=10, ge=1, le=100, description="Maximum items to return")
    intensity: Optional[str] = Field(default=None, description="Filter by intensity: low, medium, high")
    language: Optional[str] = Field(default=None, description="Filter by language code")


# ==================== VACCINE DIGEST SCHEMAS ====================

class VaccineClaim(BaseModel):
    """Schema for a claim in the vaccine digest."""
    rank: int = Field(..., ge=1, description="Rank in the digest")
    lie: str = Field(..., description="The misinformation claim (catchy title)")
    truth: str = Field(..., description="The actual truth/correction")
    why_it_matters: str = Field(..., description="Why this matters to users")
    sources_debunked: List[str] = Field(default_factory=list, description="Sources that debunked this")
    spread_velocity: str = Field(default="medium", description="How fast it's spreading")
    regions_affected: List[str] = Field(default_factory=list, description="Affected regions")


class VaccineDigest(BaseModel):
    """Schema for the weekly vaccine digest."""
    id: Optional[str] = None
    week_start: str = Field(..., description="Start date of the week (ISO format)")
    week_end: str = Field(..., description="End date of the week (ISO format)")
    claims: List[VaccineClaim] = Field(..., description="Top misinformation claims for the week")
    generated_at: Optional[datetime] = None
    view_count: int = Field(default=0, ge=0, description="Number of views")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "week_start": "2024-01-08",
                "week_end": "2024-01-14",
                "claims": [
                    {
                        "rank": 1,
                        "lie": "5G towers spread COVID-19",
                        "truth": "5G is a radio technology and cannot spread viruses.",
                        "why_it_matters": "This conspiracy has led to attacks on telecom infrastructure.",
                        "sources_debunked": ["Snopes", "Reuters", "FullFact"],
                        "spread_velocity": "high",
                        "regions_affected": ["US", "UK", "IN"]
                    }
                ],
                "generated_at": "2024-01-14T09:00:00Z",
                "view_count": 1523
            }
        }


# Legacy vaccine response for backwards compatibility
class VaccineTrend(BaseModel):
    """Legacy schema for vaccine trends."""
    lie: str
    truth: str
    why_it_matters: str


class LegacyVaccineResponse(BaseModel):
    """Legacy response format for vaccine endpoint."""
    week_of: Optional[datetime] = None
    trends: List[VaccineTrend] = Field(default_factory=list)


# ==================== HEALTH CHECK SCHEMAS ====================

class HealthStatus(BaseModel):
    """Schema for health check response."""
    status: str = Field(..., description="Overall health status: healthy, degraded, unhealthy")
    version: str = Field(..., description="API version")
    timestamp: datetime
    services: dict = Field(default_factory=dict, description="Status of individual services")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "0.1.0",
                "timestamp": "2024-01-15T10:30:00Z",
                "services": {
                    "supabase": "connected",
                    "neo4j": "connected",
                    "gemini": "available",
                    "tavily": "available"
                }
            }
        }


# ==================== SCAM REPORT SCHEMAS ====================

class ScamReportRequest(BaseModel):
    """Request schema for reporting a scam."""
    title: str = Field(..., min_length=1, max_length=500, description="Title of the scam report")
    description: str = Field(..., min_length=1, description="Detailed description of the scam")
    evidence_urls: List[str] = Field(default_factory=list, description="URLs of evidence images")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Fake lottery winning SMS",
                "description": "Received SMS claiming I won a lottery and asking for bank details",
                "evidence_urls": ["https://example.com/screenshot1.jpg"]
            }
        }


class ScamReportResponse(BaseModel):
    """Response schema for scam report submission."""
    id: str = Field(..., description="Unique ID of the scam report")
    title: str
    description: str
    evidence_urls: List[str] = Field(default_factory=list)
    status: str = Field(default="pending", description="Report status: pending, reviewing, verified, dismissed")
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Fake lottery winning SMS",
                "description": "Received SMS claiming I won a lottery and asking for bank details",
                "evidence_urls": ["https://example.com/screenshot1.jpg"],
                "status": "pending",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


# ==================== GENERIC SCHEMAS ====================

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(default=None, description="Error code for programmatic handling")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Claim text is required",
                "error_code": "VALIDATION_ERROR"
            }
        }


class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper."""
    items: List[Any] = Field(..., description="List of items")
    total: int = Field(..., ge=0, description="Total number of items")
    limit: int = Field(..., ge=1, description="Items per page")
    offset: int = Field(..., ge=0, description="Current offset")
    has_more: bool = Field(..., description="Whether more items exist")

"""
State definition for the Verification Agent.
Defines the typed state that flows through the LangGraph workflow.
"""

from typing import TypedDict, List, Optional, Any
from datetime import datetime


class SourceResult(TypedDict):
    """Structure for a search result source."""
    url: str
    title: str
    content: str
    credibility_score: int


class AgentState(TypedDict):
    """
    State object that flows through the verification workflow.
    
    Attributes:
        claim: The text claim to verify
        image_data: Optional base64 encoded image for multimodal verification
        language: Language code for the claim and response
        is_checkworthy: Whether the claim is worth fact-checking
        checkworthy_reason: Reason for checkworthiness decision
        search_results: List of evidence gathered from web search
        sources_with_scores: Sources with credibility scores applied
        verdict: Final verdict (True, False, Misleading, Unverified)
        confidence: Confidence score 0-100
        intensity: Threat intensity (low, medium, high)
        summary: Brief summary of the verdict
        detailed_analysis: Detailed analysis text
        similar_claims: IDs of similar previously verified claims
        processing_start_time: Timestamp when processing started
        verification_id: ID of saved verification record
        error: Error message if any step failed
    """
    # Input fields
    claim: str
    image_data: Optional[str]
    language: str
    
    # Processing fields
    is_checkworthy: bool
    checkworthy_reason: Optional[str]
    search_results: List[str]
    sources_with_scores: List[SourceResult]
    
    # Output fields
    verdict: Optional[str]
    confidence: Optional[float]
    intensity: Optional[str]
    summary: Optional[str]
    detailed_analysis: Optional[str]
    similar_claims: Optional[List[str]]
    
    # Metadata fields
    processing_start_time: Optional[datetime]
    verification_id: Optional[str]
    error: Optional[str]


def create_initial_state(
    claim: str,
    image_data: Optional[str] = None,
    language: str = "en"
) -> AgentState:
    """
    Create an initial state for the verification workflow.
    
    Args:
        claim: The claim text to verify
        image_data: Optional base64 encoded image
        language: Language code
        
    Returns:
        Initialized AgentState
    """
    return AgentState(
        claim=claim,
        image_data=image_data,
        language=language,
        is_checkworthy=False,
        checkworthy_reason=None,
        search_results=[],
        sources_with_scores=[],
        verdict=None,
        confidence=None,
        intensity=None,
        summary=None,
        detailed_analysis=None,
        similar_claims=None,
        processing_start_time=datetime.utcnow(),
        verification_id=None,
        error=None
    )

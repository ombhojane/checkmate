"""
Local Proximity Agent for CheckmateAI.
Monitors regional fact-checkers and auto-detects geographic regions from claims.
"""

from app.agents.proximity_agent.agent import (
    fetch_regional_claims,
    get_claims_by_region
)

__all__ = ["fetch_regional_claims", "get_claims_by_region"]


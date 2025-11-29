"""
Health Check API endpoints for CheckmateAI.
Provides system health and status information.
"""

from fastapi import APIRouter
from datetime import datetime

from app.models.schemas import HealthStatus
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Check the health status of the API and its dependencies.
    
    Returns status of:
    - Supabase database connection
    - Neo4j graph database connection
    - Gemini LLM availability
    - Tavily search availability
    """
    services = {}
    overall_status = "healthy"
    
    # Check Supabase
    try:
        from app.db.supabase import supabase_db
        if not supabase_db.client:
            # Try to connect if not connected
            supabase_db.connect()
        if supabase_db.client:
            services["supabase"] = "connected"
        else:
            services["supabase"] = "not_initialized"
            overall_status = "degraded"
    except Exception as e:
        services["supabase"] = f"error: {str(e)}"
        overall_status = "degraded"
    
    # Check Neo4j
    try:
        from app.db.neo4j import neo4j_db
        if neo4j_db.is_connected():
            services["neo4j"] = "connected"
        else:
            services["neo4j"] = "not_configured"
            # Neo4j is optional, so don't degrade status
    except Exception as e:
        services["neo4j"] = f"error: {str(e)}"
    
    # Check Gemini API key
    if settings.GOOGLE_API_KEY:
        services["gemini"] = "configured"
    else:
        services["gemini"] = "not_configured"
        overall_status = "unhealthy"
    
    # Check Tavily API key
    if settings.TAVILY_API_KEY:
        services["tavily"] = "configured"
    else:
        services["tavily"] = "not_configured"
        overall_status = "degraded"
    
    return HealthStatus(
        status=overall_status,
        version="0.2.0",
        timestamp=datetime.utcnow(),
        services=services
    )


@router.get("/")
async def root():
    """
    Root endpoint - API welcome message.
    """
    return {
        "name": "CheckmateAI API",
        "description": "Real-time misinformation detection system",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/health"
    }


@router.get("/api/status")
async def api_status():
    """
    Quick status check endpoint.
    """
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }




"""
CheckmateAI FastAPI Application Entry Point.

Real-time misinformation detection system with:
- Verification Agent: Fact-checks user-submitted claims
- Threat Feed Agent: Monitors trending misinformation
- Vaccine Agent: Generates weekly misinformation digests
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.routers import verify, feed, vaccine, health, proximity, scam
from app.db.supabase import supabase_db
from app.db.neo4j import neo4j_db
from app.agents.feed_agent.agent import fetch_and_update_feed
from app.agents.vaccine_agent.agent import generate_weekly_vaccine
from app.agents.proximity_agent.agent import fetch_regional_claims
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # ==================== STARTUP ====================
    print("Starting CheckmateAI...")
    
    # Validate required settings
    missing = settings.validate()
    if missing:
        print(f"Warning: Missing required settings: {', '.join(missing)}")
    
    # Connect to Supabase
    try:
        supabase_db.connect()
    except Exception as e:
        print(f"Warning: Failed to connect to Supabase: {e}")
    
    # Connect to Neo4j (optional)
    if settings.is_neo4j_configured():
        try:
            await neo4j_db.connect()
        except Exception as e:
            print(f"Warning: Failed to connect to Neo4j: {e}")
    else:
        print("Neo4j not configured - graph features disabled")
    
    # Initialize Scheduler for background tasks
    scheduler = AsyncIOScheduler()
    
    # Job 1: Threat Feed Update (every N minutes)
    scheduler.add_job(
        fetch_and_update_feed,
        "interval",
        minutes=settings.FEED_UPDATE_INTERVAL_MINUTES,
        id="feed_update",
        name="Threat Feed Update"
    )
    
    # Job 2: Vaccine Agent (weekly)
    scheduler.add_job(
        generate_weekly_vaccine,
        CronTrigger(
            day_of_week=settings.VACCINE_DAY_OF_WEEK,
            hour=settings.VACCINE_HOUR
        ),
        id="vaccine_generation",
        name="Weekly Vaccine Generation"
    )
    
    # Job 3: Proximity Agent (every 6 hours)
    scheduler.add_job(
        fetch_regional_claims,
        "interval",
        hours=6,
        id="proximity_update",
        name="Regional Claims Update"
    )
    
    scheduler.start()
    print(f"Scheduler started with {len(scheduler.get_jobs())} jobs")
    
    yield
    
    # ==================== SHUTDOWN ====================
    print("Shutting down CheckmateAI...")
    
    scheduler.shutdown()
    supabase_db.close()
    await neo4j_db.close()
    
    print("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="CheckmateAI API",
    description="""
## Real-time Misinformation Detection System

CheckmateAI is an AI-powered platform that detects and combats misinformation in real time.

### Features

- **Verification Agent**: Fact-check claims with AI-powered analysis
- **Threat Feed**: Monitor trending misinformation in real-time
- **Vaccine Digest**: Weekly briefings on dangerous false claims

### Supported Input Types

- Text claims
- Image + text (multimodal)
- Multiple languages (en, hi, es, etc.)

### API Documentation

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/openapi.json`
    """,
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(verify.router)
app.include_router(feed.router)
app.include_router(vaccine.router)
app.include_router(proximity.router)
app.include_router(scam.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

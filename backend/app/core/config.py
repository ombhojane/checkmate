"""
Configuration module for CheckmateAI.
Loads environment variables and provides centralized settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Settings:

    def __init__(self):
        # LLM Configuration
        self.GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
        
        # Search Configuration
        self.TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
        
        # Supabase Configuration (Primary Database)
        self.SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
        
        # Neo4j Aura Configuration (Graph Database)
        self.NEO4J_URI: str = os.getenv("NEO4J_URI", "")
        self.NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
        self.NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "")
        
        # Application Configuration
        self.APP_ENV: str = os.getenv("APP_ENV", "development")
        self.DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
        
        # Feed Agent Configuration
        self.FEED_UPDATE_INTERVAL_MINUTES: int = int(os.getenv("FEED_UPDATE_INTERVAL_MINUTES", "10"))
        
        # Vaccine Agent Configuration
        self.VACCINE_DAY_OF_WEEK: str = os.getenv("VACCINE_DAY_OF_WEEK", "sun")
        self.VACCINE_HOUR: int = int(os.getenv("VACCINE_HOUR", "9"))
        
        # Embedding Configuration
        self.EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "models/embedding-001")
        self.EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
        
        # Similarity Thresholds
        self.CLAIM_SIMILARITY_THRESHOLD: float = float(os.getenv("CLAIM_SIMILARITY_THRESHOLD", "0.85"))
    
    def validate(self) -> list[str]:
        """
        Validate required settings are present.
        
        Returns:
            List of missing required settings
        """
        missing = []
        
        if not self.GOOGLE_API_KEY:
            missing.append("GOOGLE_API_KEY")
        if not self.TAVILY_API_KEY:
            missing.append("TAVILY_API_KEY")
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.SUPABASE_KEY:
            missing.append("SUPABASE_KEY")
        
        return missing
    
    def is_neo4j_configured(self) -> bool:
        """Check if Neo4j is properly configured."""
        return bool(self.NEO4J_URI and self.NEO4J_PASSWORD)


settings = Settings()

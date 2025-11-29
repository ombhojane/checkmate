"""
Supabase client module for CheckmateAI.
Handles all database operations with PostgreSQL via Supabase.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
from supabase import create_client, Client
from app.core.config import settings


class SupabaseDB:
    """
    Async-compatible Supabase database client.
    Provides methods for all database operations across the application.
    """
    
    client: Optional[Client] = None
    
    @classmethod
    def connect(cls) -> None:
        """Initialize Supabase client connection."""
        if cls.client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
            
            cls.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            print(f"Connected to Supabase at {settings.SUPABASE_URL}")
    
    @classmethod
    def ensure_connected(cls) -> None:
        """Ensure database is connected, reconnect if needed."""
        if cls.client is None:
            cls.connect()
    
    @classmethod
    def close(cls) -> None:
        """Close Supabase client connection."""
        if cls.client:
            cls.client = None
            print("Closed Supabase connection")
    
    # ==================== VERIFICATIONS ====================
    
    @classmethod
    async def insert_verification(
        cls,
        claim_text: str,
        verdict: str,
        confidence_score: float,
        intensity: str,
        summary: str,
        detailed_analysis: str,
        sources: List[Dict[str, Any]],
        language: str = "en",
        processing_time_ms: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        Insert a new verification record.
        
        Args:
            claim_text: The original claim text
            verdict: Verdict (True, False, Misleading, Unverified)
            confidence_score: Confidence score 0-100
            intensity: Intensity level (low, medium, high)
            summary: Short summary of the verdict
            detailed_analysis: Detailed analysis text
            sources: List of source information dicts
            language: Language code (default: en)
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            The inserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("verifications").insert({
                "claim_text": claim_text,
                "verdict": verdict,
                "confidence_score": confidence_score,
                "intensity": intensity,
                "summary": summary,
                "detailed_analysis": detailed_analysis,
                "sources": json.dumps(sources) if isinstance(sources, list) else sources,
                "language": language,
                "processing_time_ms": processing_time_ms
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error inserting verification: {e}")
            return None
    
    @classmethod
    async def get_verification_by_id(cls, verification_id: str) -> Optional[Dict[str, Any]]:
        """Get a verification by its ID."""
        cls.ensure_connected()
        
        try:
            result = cls.client.table("verifications").select("*").eq("id", verification_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching verification: {e}")
            return None
    
    @classmethod
    async def get_verification_history(
        cls,
        limit: int = 20,
        offset: int = 0,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get verification history with pagination.
        
        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            language: Optional language filter
            
        Returns:
            List of verification records
        """
        cls.ensure_connected()
        
        try:
            query = cls.client.table("verifications").select("*").order("created_at", desc=True)
            
            if language:
                query = query.eq("language", language)
            
            result = query.range(offset, offset + limit - 1).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching verification history: {e}")
            return []
    
    # ==================== CLAIM EMBEDDINGS ====================
    
    @classmethod
    async def insert_claim_embedding(
        cls,
        verification_id: str,
        embedding: List[float]
    ) -> Optional[Dict[str, Any]]:
        """
        Insert a claim embedding for semantic search.
        
        Args:
            verification_id: The associated verification ID
            embedding: The embedding vector (768 dimensions)
            
        Returns:
            The inserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("claim_embeddings").insert({
                "verification_id": verification_id,
                "embedding": embedding
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error inserting claim embedding: {e}")
            return None
    
    @classmethod
    async def find_similar_claims(
        cls,
        embedding: List[float],
        threshold: float = 0.85,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar claims using vector similarity search.
        Uses pgvector's cosine similarity.
        
        Args:
            embedding: The query embedding vector
            threshold: Minimum similarity threshold (0-1)
            limit: Maximum number of results
            
        Returns:
            List of similar claims with their verification data
        """
        cls.ensure_connected()
        
        try:
            # Use Supabase RPC for vector similarity search
            result = cls.client.rpc(
                "match_claims",
                {
                    "query_embedding": embedding,
                    "match_threshold": threshold,
                    "match_count": limit
                }
            ).execute()
            
            return result.data or []
        except Exception as e:
            print(f"Error finding similar claims: {e}")
            return []
    
    # ==================== THREAT FEED ====================
    
    @classmethod
    async def upsert_threat(
        cls,
        topic: str,
        claim_summary: str,
        source_count: int,
        intensity: str,
        graph_centrality_score: float,
        sources: List[Dict[str, Any]],
        language: str = "en",
        link: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upsert a threat feed item.
        
        Args:
            topic: The topic/title of the threat
            claim_summary: Summary of the misinformation claim
            source_count: Number of sources reporting this
            intensity: Threat intensity (low, medium, high)
            graph_centrality_score: Neo4j centrality score
            sources: List of source information
            language: Language code
            link: Optional link to source
            
        Returns:
            The upserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("threat_feed").upsert({
                "topic": topic,
                "claim_summary": claim_summary,
                "source_count": source_count,
                "intensity": intensity,
                "graph_centrality_score": graph_centrality_score,
                "sources": json.dumps(sources) if isinstance(sources, list) else sources,
                "language": language,
                "link": link,
                "last_updated": datetime.utcnow().isoformat()
            }, on_conflict="topic").execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error upserting threat: {e}")
            return None
    
    @classmethod
    async def get_threat_feed(
        cls,
        limit: int = 10,
        intensity: Optional[str] = None,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get threat feed items.
        
        Args:
            limit: Maximum number of items to return
            intensity: Optional intensity filter (low, medium, high)
            language: Optional language filter
            
        Returns:
            List of threat feed items sorted by centrality score
        """
        cls.ensure_connected()
        
        try:
            query = cls.client.table("threat_feed").select("*").order("graph_centrality_score", desc=True)
            
            if intensity:
                query = query.eq("intensity", intensity)
            if language:
                query = query.eq("language", language)
            
            result = query.limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching threat feed: {e}")
            return []
    
    @classmethod
    async def get_recent_threats(cls, days: int = 7, limit: int = 20) -> List[Dict[str, Any]]:
        """Get threats from the last N days."""
        cls.ensure_connected()
        
        try:
            cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
            result = cls.client.table("threat_feed").select("*").gte(
                "first_seen", cutoff
            ).order("graph_centrality_score", desc=True).limit(limit).execute()
            
            return result.data or []
        except Exception as e:
            print(f"Error fetching recent threats: {e}")
            return []
    
    # ==================== VACCINE DIGESTS ====================
    
    @classmethod
    async def insert_vaccine_digest(
        cls,
        week_start: str,
        week_end: str,
        claims: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Insert a new vaccine digest.
        
        Args:
            week_start: Start date of the week (ISO format)
            week_end: End date of the week (ISO format)
            claims: List of claim information dicts
            
        Returns:
            The inserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("vaccine_digests").insert({
                "week_start": week_start,
                "week_end": week_end,
                "claims": json.dumps(claims) if isinstance(claims, list) else claims
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error inserting vaccine digest: {e}")
            return None
    
    @classmethod
    async def get_latest_vaccine_digest(cls) -> Optional[Dict[str, Any]]:
        """Get the most recent vaccine digest."""
        cls.ensure_connected()
        
        try:
            result = cls.client.table("vaccine_digests").select("*").order(
                "generated_at", desc=True
            ).limit(1).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching latest vaccine digest: {e}")
            return None
    
    @classmethod
    async def get_vaccine_digest_archive(
        cls,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get archived vaccine digests with pagination."""
        cls.ensure_connected()
        
        try:
            result = cls.client.table("vaccine_digests").select("*").order(
                "generated_at", desc=True
            ).range(offset, offset + limit - 1).execute()
            
            return result.data or []
        except Exception as e:
            print(f"Error fetching vaccine digest archive: {e}")
            return []
    
    @classmethod
    async def increment_digest_view_count(cls, digest_id: str) -> bool:
        """Increment the view count for a vaccine digest."""
        cls.ensure_connected()
        
        try:
            # Get current count
            current = cls.client.table("vaccine_digests").select("view_count").eq(
                "id", digest_id
            ).execute()
            
            if current.data:
                new_count = (current.data[0].get("view_count") or 0) + 1
                cls.client.table("vaccine_digests").update({
                    "view_count": new_count
                }).eq("id", digest_id).execute()
                return True
            return False
        except Exception as e:
            print(f"Error incrementing view count: {e}")
            return False
    
    # ==================== REGIONAL CLAIMS (Proximity Agent) ====================
    
    @classmethod
    async def upsert_regional_claim(
        cls,
        claim_id: str,
        title: str,
        summary: str,
        source_name: str,
        source_url: str,
        country: str,
        region: str,
        location_confidence: str,
        virality_score: float,
        language: str = "en",
        published_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upsert a regional claim.
        
        Args:
            claim_id: Unique identifier for the claim
            title: Claim title
            summary: Claim summary
            source_name: Name of the source
            source_url: URL of the source
            country: Country where claim originated/mentions
            region: Specific region within country
            location_confidence: Confidence in location extraction
            virality_score: Virality score 0-1
            language: Language code
            published_at: Publication date ISO string
            
        Returns:
            The upserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("regional_claims").upsert({
                "claim_id": claim_id,
                "title": title,
                "summary": summary,
                "source_name": source_name,
                "source_url": source_url,
                "country": country,
                "region": region,
                "location_confidence": location_confidence,
                "virality_score": virality_score,
                "language": language,
                "published_at": published_at,
                "last_updated": datetime.utcnow().isoformat()
            }, on_conflict="claim_id").execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error upserting regional claim: {e}")
            return None
    
    @classmethod
    async def get_regional_claims(
        cls,
        country: Optional[str] = None,
        limit: int = 20,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get regional claims sorted by virality.
        
        Args:
            country: Optional country filter
            limit: Maximum number of claims
            language: Optional language filter
            
        Returns:
            List of regional claims
        """
        cls.ensure_connected()
        
        try:
            query = cls.client.table("regional_claims").select("*").order(
                "virality_score", desc=True
            )
            
            if country:
                query = query.eq("country", country)
            if language:
                query = query.eq("language", language)
            
            result = query.limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching regional claims: {e}")
            return []
    
    @classmethod
    async def get_available_countries(cls) -> List[str]:
        """Get list of countries with claims."""
        cls.ensure_connected()
        
        try:
            result = cls.client.table("regional_claims").select("country").execute()
            countries = list(set(item["country"] for item in result.data if item.get("country")))
            return sorted(countries)
        except Exception as e:
            print(f"Error fetching countries: {e}")
            return []
    
    @classmethod
    async def increment_claim_virality(cls, claim_id: str) -> bool:
        """Increment virality score when claim is seen from multiple sources."""
        cls.ensure_connected()
        
        try:
            current = cls.client.table("regional_claims").select("virality_score").eq(
                "claim_id", claim_id
            ).execute()
            
            if current.data:
                new_score = min(1.0, (current.data[0].get("virality_score") or 0) + 0.1)
                cls.client.table("regional_claims").update({
                    "virality_score": new_score,
                    "last_updated": datetime.utcnow().isoformat()
                }).eq("claim_id", claim_id).execute()
                return True
            return False
        except Exception as e:
            print(f"Error incrementing virality: {e}")
            return False
    
    # ==================== SCAM REPORTS ====================
    
    @classmethod
    async def insert_scam_report(
        cls,
        title: str,
        description: str,
        evidence_urls: List[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Insert a new scam report.
        
        Args:
            title: Title of the scam report
            description: Detailed description
            evidence_urls: List of evidence image URLs
            
        Returns:
            The inserted record or None if failed
        """
        cls.ensure_connected()
        
        try:
            result = cls.client.table("scam_reports").insert({
                "title": title,
                "description": description,
                "evidence_urls": evidence_urls or [],
                "status": "pending"
            }).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error inserting scam report: {e}")
            return None
    
    @classmethod
    async def get_scam_reports(
        cls,
        limit: int = 20,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get scam reports with optional status filter."""
        cls.ensure_connected()
        
        try:
            query = cls.client.table("scam_reports").select("*").order("created_at", desc=True)
            
            if status:
                query = query.eq("status", status)
            
            result = query.limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching scam reports: {e}")
            return []


# Singleton instance
supabase_db = SupabaseDB()




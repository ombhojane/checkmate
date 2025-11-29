"""
Graph analysis module for the Threat Feed Agent.
Handles Neo4j graph operations for trend detection and claim relationships.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid

from app.core.config import settings
from app.agents.verification_agent.tools import generate_embedding


async def process_claim_for_graph(
    claim_text: str,
    source_name: str,
    source_url: str,
    topics: List[str]
) -> Optional[str]:
    """
    Process a new claim and add it to the graph.
    Finds similar claims and creates relationships.
    
    Args:
        claim_text: The claim text
        source_name: Name of the source
        source_url: URL of the source
        topics: List of topic tags
        
    Returns:
        Claim ID if successful, None otherwise
    """
    from app.db.neo4j import neo4j_db
    
    if not neo4j_db.is_connected():
        return None
    
    try:
        # Generate embedding for the claim
        embedding = await generate_embedding(claim_text)
        
        # Check for similar existing claims
        similar_claims = []
        if embedding:
            similar_claims = await neo4j_db.find_similar_claims(
                embedding=embedding,
                threshold=settings.CLAIM_SIMILARITY_THRESHOLD,
                limit=5
            )
        
        # Create the claim node
        claim_id = str(uuid.uuid4())
        result = await neo4j_db.create_claim(
            claim_id=claim_id,
            text=claim_text,
            source_name=source_name,
            source_url=source_url,
            topics=topics,
            embedding=embedding
        )
        
        if not result:
            return None
        
        # Create similarity edges to related claims
        for similar in similar_claims:
            similar_id = similar.get("claim", {}).get("id")
            similarity = similar.get("similarity", 0)
            
            if similar_id and similarity >= settings.CLAIM_SIMILARITY_THRESHOLD:
                await neo4j_db.create_similarity_edge(
                    claim_id_1=claim_id,
                    claim_id_2=similar_id,
                    similarity_score=similarity
                )
        
        return claim_id
        
    except Exception as e:
        print(f"Error processing claim for graph: {e}")
        return None


async def detect_viral_patterns() -> List[Dict[str, Any]]:
    """
    Detect viral misinformation patterns using graph analysis.
    
    Returns:
        List of viral claim clusters
    """
    from app.db.neo4j import neo4j_db
    
    if not neo4j_db.is_connected():
        return []
    
    try:
        # Get claims with high connection count
        trending = await neo4j_db.get_trending_by_connections(limit=20)
        
        viral_patterns = []
        for item in trending:
            claim = item.get("claim", {})
            connections = claim.get("connections", 0)
            
            if connections >= 3:  # Threshold for "viral"
                # Get the network around this claim
                network = await neo4j_db.get_claim_network(
                    claim_id=claim.get("id"),
                    depth=2
                )
                
                viral_patterns.append({
                    "central_claim": claim,
                    "connections": connections,
                    "network_size": len(network.get("nodes", [])),
                    "velocity": "high" if connections >= 5 else "medium"
                })
        
        return viral_patterns
        
    except Exception as e:
        print(f"Error detecting viral patterns: {e}")
        return []


async def sync_centrality_to_supabase():
    """
    Sync graph centrality scores to Supabase for fast API access.
    """
    from app.db.neo4j import neo4j_db
    from app.db.supabase import supabase_db
    
    if not neo4j_db.is_connected():
        return
    
    try:
        # Try PageRank first
        ranked_claims = await neo4j_db.calculate_pagerank()
        
        if not ranked_claims:
            # Fallback to connection-based ranking
            ranked_claims = await neo4j_db.get_trending_by_connections(limit=50)
        
        for item in ranked_claims:
            claim = item.get("claim", {})
            score = item.get("pagerank", item.get("connections", 0))
            
            # Normalize score to 0-1
            if isinstance(score, (int, float)):
                normalized_score = min(1.0, score if score <= 1 else score / 100)
            else:
                normalized_score = 0.0
            
            # Determine intensity
            if normalized_score > 0.7:
                intensity = "high"
            elif normalized_score > 0.4:
                intensity = "medium"
            else:
                intensity = "low"
            
            # Update Supabase
            await supabase_db.upsert_threat(
                topic=claim.get("text", ""),
                claim_summary="",
                source_count=int(score) if score > 1 else 1,
                intensity=intensity,
                graph_centrality_score=normalized_score,
                sources=[],
                link=claim.get("source_url", "")
            )
            
    except Exception as e:
        print(f"Error syncing centrality to Supabase: {e}")


async def get_claim_relationships(claim_id: str) -> Dict[str, Any]:
    """
    Get all relationships for a specific claim.
    
    Args:
        claim_id: The claim ID
        
    Returns:
        Dictionary with related claims, sources, and topics
    """
    from app.db.neo4j import neo4j_db
    
    if not neo4j_db.is_connected():
        return {"similar_claims": [], "sources": [], "topics": []}
    
    try:
        network = await neo4j_db.get_claim_network(claim_id, depth=1)
        
        similar_claims = [
            n for n in network.get("nodes", [])
            if "Claim" in n.get("labels", []) and n.get("id") != claim_id
        ]
        
        return {
            "similar_claims": similar_claims,
            "edges": network.get("edges", [])
        }
        
    except Exception as e:
        print(f"Error getting claim relationships: {e}")
        return {"similar_claims": [], "edges": []}


async def get_topic_clusters() -> List[Dict[str, Any]]:
    """
    Get misinformation clusters grouped by topic.
    
    Returns:
        List of topic clusters with claim counts
    """
    from app.db.neo4j import neo4j_db
    
    if not neo4j_db.is_connected():
        return []
    
    try:
        topics = await neo4j_db.get_trending_topics(limit=15)
        return topics
        
    except Exception as e:
        print(f"Error getting topic clusters: {e}")
        return []


async def calculate_spread_velocity(claim_id: str, hours: int = 24) -> Dict[str, Any]:
    """
    Calculate how quickly a claim is spreading.
    
    Args:
        claim_id: The claim ID
        hours: Time window to analyze
        
    Returns:
        Velocity metrics
    """
    from app.db.neo4j import neo4j_db
    
    if not neo4j_db.is_connected():
        return {"velocity": "unknown", "connections_rate": 0}
    
    try:
        network = await neo4j_db.get_claim_network(claim_id, depth=2)
        edges = network.get("edges", [])
        
        # Count recent connections (would need timestamp on edges)
        total_connections = len(edges)
        
        # Simple heuristic based on total connections
        if total_connections >= 10:
            velocity = "high"
        elif total_connections >= 5:
            velocity = "medium"
        else:
            velocity = "low"
        
        return {
            "velocity": velocity,
            "total_connections": total_connections,
            "network_size": len(network.get("nodes", []))
        }
        
    except Exception as e:
        print(f"Error calculating spread velocity: {e}")
        return {"velocity": "unknown", "connections_rate": 0}





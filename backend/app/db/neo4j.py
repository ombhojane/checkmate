"""
Neo4j Aura client module for CheckmateAI.
Handles graph database operations for claim relationship modeling and trend detection.
"""

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
import asyncio
from neo4j import AsyncGraphDatabase, AsyncDriver
from neo4j.exceptions import ServiceUnavailable, AuthError, SessionExpired
from app.core.config import settings


class Neo4jDB:
    """
    Async Neo4j Aura database client.
    Manages graph operations for claims, sources, topics, and their relationships.
    
    Graph Schema:
    - Nodes: Claim, Source, Topic, URL
    - Edges: SIMILAR_TO, DEBUNKED_BY, CITED_IN, SHARES_TOPIC
    """
    
    driver: Optional[AsyncDriver] = None
    
    @classmethod
    async def connect(cls) -> None:
        """Initialize Neo4j driver connection."""
        # Close existing driver before reconnecting
        if cls.driver is not None:
            try:
                await cls.driver.close()
            except Exception:
                pass
            cls.driver = None
        
        if not settings.NEO4J_URI or not settings.NEO4J_USER or not settings.NEO4J_PASSWORD:
            print("Warning: Neo4j credentials not set. Graph features will be disabled.")
            return
        
        try:
            cls.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=300,  # 5 minutes - shorter for cloud
                max_connection_pool_size=10,
                connection_acquisition_timeout=30,
            )
            # Verify connectivity
            await cls.driver.verify_connectivity()
            print(f"Connected to Neo4j at {settings.NEO4J_URI}")
            
            # Initialize schema
            await cls._initialize_schema()
        except (ServiceUnavailable, AuthError) as e:
            print(f"Failed to connect to Neo4j: {e}")
            cls.driver = None
    
    @classmethod
    async def close(cls) -> None:
        """Close Neo4j driver connection."""
        if cls.driver:
            await cls.driver.close()
            cls.driver = None
            print("Closed Neo4j connection")
    
    @classmethod
    async def _initialize_schema(cls) -> None:
        """Initialize graph schema with indexes and constraints."""
        if cls.driver is None:
            return
        
        async with cls.driver.session() as session:
            # Create constraints and indexes
            constraints = [
                "CREATE CONSTRAINT claim_id IF NOT EXISTS FOR (c:Claim) REQUIRE c.id IS UNIQUE",
                "CREATE CONSTRAINT source_name IF NOT EXISTS FOR (s:Source) REQUIRE s.name IS UNIQUE",
                "CREATE CONSTRAINT topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE",
                "CREATE INDEX claim_text IF NOT EXISTS FOR (c:Claim) ON (c.text)",
                "CREATE INDEX claim_created IF NOT EXISTS FOR (c:Claim) ON (c.created_at)",
            ]
            
            for constraint in constraints:
                try:
                    await session.run(constraint)
                except Exception as e:
                    # Constraint may already exist
                    pass
    
    @classmethod
    def is_connected(cls) -> bool:
        """Check if Neo4j is connected."""
        return cls.driver is not None
    
    @classmethod
    async def ensure_connected(cls) -> bool:
        """Ensure Neo4j is connected, reconnect if needed. Returns True if connected."""
        if cls.driver is None:
            await cls.connect()
            return cls.driver is not None
        
        # Verify the connection is still alive
        try:
            await cls.driver.verify_connectivity()
            return True
        except Exception as e:
            print(f"Neo4j connection lost, reconnecting: {e}")
            await cls.connect()
            return cls.driver is not None
    
    # ==================== CLAIM OPERATIONS ====================
    
    @classmethod
    async def create_claim(
        cls,
        claim_id: str,
        text: str,
        source_name: str,
        source_url: str,
        topics: List[str],
        embedding: Optional[List[float]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new Claim node with relationships to Source and Topics.
        
        Args:
            claim_id: Unique identifier for the claim
            text: The claim text
            source_name: Name of the source (e.g., "Snopes")
            source_url: URL of the original article
            topics: List of topic names
            embedding: Optional embedding vector for similarity
            
        Returns:
            The created claim data or None if failed
        """
        if cls.driver is None:
            return None
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    // Create or merge the source
                    MERGE (s:Source {name: $source_name})
                    ON CREATE SET s.created_at = datetime()
                    
                    // Create the claim
                    CREATE (c:Claim {
                        id: $claim_id,
                        text: $text,
                        source_url: $source_url,
                        embedding: $embedding,
                        created_at: datetime(),
                        connection_count: 0
                    })
                    
                    // Link claim to source
                    CREATE (c)-[:CITED_IN]->(s)
                    
                    // Return the claim
                    RETURN c {.id, .text, .created_at} as claim
                    """,
                    claim_id=claim_id,
                    text=text,
                    source_name=source_name,
                    source_url=source_url,
                    embedding=embedding
                )
                
                record = await result.single()
                
                # Create topic relationships
                if topics:
                    for topic in topics:
                        await session.run(
                            """
                            MATCH (c:Claim {id: $claim_id})
                            MERGE (t:Topic {name: $topic})
                            ON CREATE SET t.created_at = datetime()
                            MERGE (c)-[:SHARES_TOPIC]->(t)
                            """,
                            claim_id=claim_id,
                            topic=topic
                        )
                
                return record["claim"] if record else None
            except Exception as e:
                print(f"Error creating claim: {e}")
                return None
    
    @classmethod
    async def find_similar_claims(
        cls,
        embedding: List[float],
        threshold: float = 0.85,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find similar claims using cosine similarity on embeddings.
        
        Args:
            embedding: Query embedding vector
            threshold: Minimum similarity threshold
            limit: Maximum number of results
            
        Returns:
            List of similar claims with similarity scores
        """
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                # Note: For production, consider using Neo4j's vector index
                # This is a simpler implementation using stored embeddings
                result = await session.run(
                    """
                    MATCH (c:Claim)
                    WHERE c.embedding IS NOT NULL
                    WITH c, gds.similarity.cosine(c.embedding, $embedding) AS similarity
                    WHERE similarity > $threshold
                    RETURN c {.id, .text, .source_url, .connection_count} AS claim, similarity
                    ORDER BY similarity DESC
                    LIMIT $limit
                    """,
                    embedding=embedding,
                    threshold=threshold,
                    limit=limit
                )
                
                records = await result.data()
                return [{"claim": r["claim"], "similarity": r["similarity"]} for r in records]
            except Exception as e:
                print(f"Error finding similar claims: {e}")
                return []
    
    @classmethod
    async def create_similarity_edge(
        cls,
        claim_id_1: str,
        claim_id_2: str,
        similarity_score: float
    ) -> bool:
        """
        Create a SIMILAR_TO relationship between two claims.
        
        Args:
            claim_id_1: First claim ID
            claim_id_2: Second claim ID
            similarity_score: Cosine similarity score
            
        Returns:
            True if successful, False otherwise
        """
        if cls.driver is None:
            return False
        
        async with cls.driver.session() as session:
            try:
                await session.run(
                    """
                    MATCH (c1:Claim {id: $claim_id_1})
                    MATCH (c2:Claim {id: $claim_id_2})
                    MERGE (c1)-[r:SIMILAR_TO]-(c2)
                    ON CREATE SET r.similarity = $similarity, r.created_at = datetime()
                    ON MATCH SET r.similarity = $similarity
                    
                    // Update connection counts
                    SET c1.connection_count = coalesce(c1.connection_count, 0) + 1
                    SET c2.connection_count = coalesce(c2.connection_count, 0) + 1
                    """,
                    claim_id_1=claim_id_1,
                    claim_id_2=claim_id_2,
                    similarity=similarity_score
                )
                return True
            except Exception as e:
                print(f"Error creating similarity edge: {e}")
                return False
    
    # ==================== CENTRALITY & TREND DETECTION ====================
    
    @classmethod
    async def calculate_pagerank(cls) -> List[Dict[str, Any]]:
        """
        Calculate PageRank scores for all claims.
        Requires Neo4j Graph Data Science library.
        
        Returns:
            List of claims with their PageRank scores
        """
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                # Project graph and run PageRank
                result = await session.run(
                    """
                    // First, try to drop existing projection if it exists
                    CALL gds.graph.exists('claims_graph') YIELD exists
                    WITH exists
                    CALL {
                        WITH exists
                        CALL gds.graph.drop('claims_graph', false) YIELD graphName
                        RETURN graphName
                    }
                    
                    // Create new projection
                    CALL gds.graph.project(
                        'claims_graph',
                        'Claim',
                        {
                            SIMILAR_TO: {orientation: 'UNDIRECTED'}
                        }
                    ) YIELD graphName
                    
                    // Run PageRank
                    CALL gds.pageRank.stream('claims_graph')
                    YIELD nodeId, score
                    WITH gds.util.asNode(nodeId) AS claim, score
                    RETURN claim {.id, .text, .source_url} AS claim, score AS pagerank
                    ORDER BY score DESC
                    LIMIT 50
                    """
                )
                
                records = await result.data()
                return records
            except Exception as e:
                print(f"Error calculating PageRank: {e}")
                # Fallback: use connection count
                return await cls.get_trending_by_connections()
    
    @classmethod
    async def calculate_betweenness_centrality(cls) -> List[Dict[str, Any]]:
        """
        Calculate Betweenness Centrality scores for all claims.
        High betweenness = claim connects different clusters of misinformation.
        
        Returns:
            List of claims with their betweenness scores
        """
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    CALL gds.betweenness.stream('claims_graph')
                    YIELD nodeId, score
                    WITH gds.util.asNode(nodeId) AS claim, score
                    RETURN claim {.id, .text, .source_url} AS claim, score AS betweenness
                    ORDER BY score DESC
                    LIMIT 50
                    """
                )
                
                records = await result.data()
                return records
            except Exception as e:
                print(f"Error calculating betweenness: {e}")
                return []
    
    @classmethod
    async def get_trending_by_connections(cls, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get trending claims based on connection count (fallback for GDS).
        
        Args:
            limit: Maximum number of results
            
        Returns:
            List of trending claims
        """
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    MATCH (c:Claim)
                    OPTIONAL MATCH (c)-[r:SIMILAR_TO]-()
                    WITH c, count(r) AS connections
                    RETURN c {
                        .id, 
                        .text, 
                        .source_url,
                        connections: connections
                    } AS claim
                    ORDER BY connections DESC
                    LIMIT $limit
                    """,
                    limit=limit
                )
                
                records = await result.data()
                return records
            except Exception as e:
                print(f"Error getting trending claims: {e}")
                return []
    
    @classmethod
    async def get_claim_network(cls, claim_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Get the network around a specific claim.
        
        Args:
            claim_id: The central claim ID
            depth: How many hops to traverse
            
        Returns:
            Network data with nodes and edges
        """
        if cls.driver is None:
            return {"nodes": [], "edges": []}
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    MATCH path = (c:Claim {id: $claim_id})-[:SIMILAR_TO*1..$depth]-(connected:Claim)
                    WITH collect(path) AS paths
                    CALL {
                        WITH paths
                        UNWIND paths AS p
                        UNWIND nodes(p) AS n
                        RETURN collect(DISTINCT n {.id, .text, labels: labels(n)}) AS nodes
                    }
                    CALL {
                        WITH paths
                        UNWIND paths AS p
                        UNWIND relationships(p) AS r
                        RETURN collect(DISTINCT {
                            source: startNode(r).id,
                            target: endNode(r).id,
                            type: type(r),
                            similarity: r.similarity
                        }) AS edges
                    }
                    RETURN nodes, edges
                    """,
                    claim_id=claim_id,
                    depth=depth
                )
                
                record = await result.single()
                if record:
                    return {"nodes": record["nodes"], "edges": record["edges"]}
                return {"nodes": [], "edges": []}
            except Exception as e:
                print(f"Error getting claim network: {e}")
                return {"nodes": [], "edges": []}
    
    # ==================== SOURCE & TOPIC OPERATIONS ====================
    
    @classmethod
    async def get_sources_stats(cls) -> List[Dict[str, Any]]:
        """Get statistics about sources."""
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    MATCH (s:Source)<-[:CITED_IN]-(c:Claim)
                    RETURN s.name AS source, count(c) AS claim_count
                    ORDER BY claim_count DESC
                    """
                )
                
                records = await result.data()
                return records
            except Exception as e:
                print(f"Error getting source stats: {e}")
                return []
    
    @classmethod
    async def get_trending_topics(cls, limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending topics by claim count."""
        if cls.driver is None:
            return []
        
        async with cls.driver.session() as session:
            try:
                result = await session.run(
                    """
                    MATCH (t:Topic)<-[:SHARES_TOPIC]-(c:Claim)
                    WITH t, count(c) AS claim_count, collect(c.text)[0..3] AS sample_claims
                    RETURN t.name AS topic, claim_count, sample_claims
                    ORDER BY claim_count DESC
                    LIMIT $limit
                    """,
                    limit=limit
                )
                
                records = await result.data()
                return records
            except Exception as e:
                print(f"Error getting trending topics: {e}")
                return []
    
    @classmethod
    async def mark_claim_debunked(
        cls,
        claim_id: str,
        verification_id: str,
        verdict: str
    ) -> bool:
        """
        Mark a claim as debunked with verification reference.
        
        Args:
            claim_id: The claim ID
            verification_id: Reference to verification in Supabase
            verdict: The verification verdict
            
        Returns:
            True if successful
        """
        if cls.driver is None:
            return False
        
        async with cls.driver.session() as session:
            try:
                await session.run(
                    """
                    MATCH (c:Claim {id: $claim_id})
                    SET c.debunked = true,
                        c.verification_id = $verification_id,
                        c.verdict = $verdict,
                        c.debunked_at = datetime()
                    """,
                    claim_id=claim_id,
                    verification_id=verification_id,
                    verdict=verdict
                )
                return True
            except Exception as e:
                print(f"Error marking claim debunked: {e}")
                return False


# Singleton instance
neo4j_db = Neo4jDB()




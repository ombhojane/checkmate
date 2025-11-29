"""
Database module for CheckmateAI.
Provides clients for Supabase (PostgreSQL) and Neo4j Aura (Graph).
"""

from app.db.supabase import supabase_db, SupabaseDB
from app.db.neo4j import neo4j_db, Neo4jDB

__all__ = [
    "supabase_db",
    "SupabaseDB",
    "neo4j_db", 
    "Neo4jDB"
]





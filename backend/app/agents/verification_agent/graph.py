"""
LangGraph workflow for the Verification Agent.
Orchestrates the fact-checking pipeline with multimodal support.
"""

import json
import base64
from datetime import datetime
from typing import Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings
from app.agents.verification_agent.state import AgentState
from app.agents.verification_agent.tools import (
    tavily_search,
    tavily_search_general,
    format_evidence_for_llm,
    extract_claim_from_text,
    generate_embedding
)
from app.agents.verification_agent.credibility import (
    calculate_weighted_confidence,
    format_credibility_explanation,
    CREDIBILITY_PROMPT_TEMPLATE
)


def get_llm():
    """Get configured LLM instance."""
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0,
        convert_system_message_to_human=True
    )


def get_vision_llm():
    """Get LLM instance configured for vision tasks."""
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0
    )


# ==================== WORKFLOW NODES ====================

def node_check_worthiness(state: AgentState) -> dict:
    """
    Determine if the claim is worth fact-checking.
    Filters out opinions, trivial statements, and non-factual content.
    """
    claim = state["claim"]
    image_data = state.get("image_data")
    
    prompt = f"""
Analyze the following claim and determine if it is a factual claim worth fact-checking.

Claim: "{claim}"

A claim is CHECK-WORTHY if it:
- Makes a factual assertion that can be verified
- Could potentially be misinformation
- Has real-world impact if believed
- Is about health, politics, science, current events, or public figures

A claim is NOT CHECK-WORTHY if it:
- Is clearly an opinion or personal preference
- Is trivial or has no impact
- Is a question rather than a statement
- Is obviously satirical or humorous
- Is too vague to verify

Return ONLY a JSON object with these keys:
- "is_checkworthy": boolean
- "reason": string (brief explanation)

Example: {{"is_checkworthy": true, "reason": "This is a health-related claim that could cause harm if false."}}
"""

    try:
        llm = get_vision_llm() if image_data else get_llm()
        
        # Build message content
        content = [{"type": "text", "text": prompt}]
        
        if image_data:
            # Add image for multimodal analysis
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
            })
        
        response = llm.invoke([HumanMessage(content=content)])
        result_text = response.content.strip()
        
        # Parse JSON response
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
        
        result = json.loads(result_text)
        
        return {
            "is_checkworthy": result.get("is_checkworthy", False),
            "checkworthy_reason": result.get("reason", "")
        }
        
    except Exception as e:
        print(f"Error in check_worthiness: {e}")
        return {
            "is_checkworthy": False,
            "checkworthy_reason": f"Error analyzing claim: {str(e)}",
            "error": str(e)
        }


def node_gather_evidence(state: AgentState) -> dict:
    """
    Gather evidence from web search with credibility scoring.
    Tries fact-checker sources first, then falls back to general search.
    """
    claim = extract_claim_from_text(state["claim"])
    
    # Build search query
    search_query = f"fact check: {claim}"
    
    # Search fact-checking sources first
    results = tavily_search(search_query, max_results=5)
    
    # If no results from fact-checkers, try general search
    if not results:
        results = tavily_search_general(claim, max_results=5)
    
    # Format for legacy compatibility
    search_results = []
    for res in results:
        formatted = f"Source: {res.get('url', '')}\nTitle: {res.get('title', '')}\nContent: {res.get('content', '')}"
        search_results.append(formatted)
    
    return {
        "search_results": search_results,
        "sources_with_scores": results
    }


def node_generate_verdict(state: AgentState) -> dict:
    """
    Analyze evidence and generate verdict with detailed analysis.
    Uses credibility-weighted scoring for confidence.
    """
    claim = state["claim"]
    image_data = state.get("image_data")
    sources = state.get("sources_with_scores", [])
    language = state.get("language", "en")
    
    evidence = format_evidence_for_llm(sources)
    credibility_context = format_credibility_explanation(sources)
    
    prompt = f"""
You are an expert fact-checker. Analyze the following claim using the provided evidence.

{CREDIBILITY_PROMPT_TEMPLATE}

CLAIM TO VERIFY:
"{claim}"

EVIDENCE GATHERED:
{evidence}

SOURCE RELIABILITY SUMMARY:
{credibility_context}

INSTRUCTIONS:
1. Analyze each piece of evidence, giving more weight to higher-reliability sources
2. Determine the verdict based on the preponderance of credible evidence
3. Classify the threat intensity based on potential harm
4. Provide both a summary and detailed analysis

INTENSITY LEVELS:
- HIGH: Health/safety risks, urgent public concern, viral spread, could cause physical harm
- MEDIUM: Political misinformation, misleading statistics, moderate public interest
- LOW: Minor inaccuracies, limited impact, not widely spread

Return ONLY a JSON object with these exact keys:
{{
    "verdict": "True" | "False" | "Misleading" | "Unverified",
    "confidence": <number 0-100>,
    "intensity": "low" | "medium" | "high",
    "summary": "<2-3 sentence summary>",
    "detailed_analysis": "<Detailed paragraph explaining the reasoning, evidence quality, and conclusion>"
}}

{"Respond in " + language + " language." if language != "en" else ""}
"""

    try:
        llm = get_vision_llm() if image_data else get_llm()
        
        # Build message content
        content = [{"type": "text", "text": prompt}]
        
        if image_data:
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
            })
        
        response = llm.invoke([HumanMessage(content=content)])
        result_text = response.content.strip()
        
        # Parse JSON response
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
        
        result = json.loads(result_text)
        
        # Apply credibility weighting to confidence
        base_confidence = result.get("confidence", 50)
        weighted_confidence = calculate_weighted_confidence(sources, base_confidence)
        
        return {
            "verdict": result.get("verdict", "Unverified"),
            "confidence": weighted_confidence,
            "intensity": result.get("intensity", "medium"),
            "summary": result.get("summary", "Unable to verify this claim."),
            "detailed_analysis": result.get("detailed_analysis", "")
        }
        
    except Exception as e:
        print(f"Error in generate_verdict: {e}")
        return {
            "verdict": "Error",
            "confidence": 0,
            "intensity": "low",
            "summary": "An error occurred during verification.",
            "detailed_analysis": f"Error: {str(e)}",
            "error": str(e)
        }


async def node_save_result(state: AgentState) -> dict:
    """
    Save verification result to Supabase and generate embedding.
    """
    try:
        from app.db.supabase import supabase_db
        
        # Calculate processing time
        start_time = state.get("processing_start_time")
        processing_time_ms = 0
        if start_time:
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Format sources for storage
        sources_data = [
            {
                "url": s.get("url", ""),
                "title": s.get("title", ""),
                "credibility_score": s.get("credibility_score", 50),
                "snippet": s.get("content", "")[:500]
            }
            for s in state.get("sources_with_scores", [])
        ]
        
        # Insert verification record
        result = await supabase_db.insert_verification(
            claim_text=state["claim"],
            verdict=state.get("verdict", "Unverified"),
            confidence_score=state.get("confidence", 0),
            intensity=state.get("intensity", "medium"),
            summary=state.get("summary", ""),
            detailed_analysis=state.get("detailed_analysis", ""),
            sources=sources_data,
            language=state.get("language", "en"),
            processing_time_ms=processing_time_ms
        )
        
        verification_id = None
        if result:
            verification_id = result.get("id")
            
            # Generate and store embedding for similarity search
            embedding = await generate_embedding(state["claim"])
            if embedding and verification_id:
                await supabase_db.insert_claim_embedding(verification_id, embedding)
        
        return {
            "verification_id": verification_id
        }
        
    except Exception as e:
        print(f"Error saving result: {e}")
        return {"error": f"Failed to save: {str(e)}"}


async def node_find_similar_claims(state: AgentState) -> dict:
    """
    Find similar previously verified claims.
    """
    try:
        from app.db.supabase import supabase_db
        
        # Generate embedding for the claim
        embedding = await generate_embedding(state["claim"])
        
        if not embedding:
            return {"similar_claims": None}
        
        # Search for similar claims
        similar = await supabase_db.find_similar_claims(
            embedding=embedding,
            threshold=settings.CLAIM_SIMILARITY_THRESHOLD,
            limit=3
        )
        
        similar_ids = [s.get("verification_id") for s in similar if s.get("verification_id")]
        
        return {"similar_claims": similar_ids if similar_ids else None}
        
    except Exception as e:
        print(f"Error finding similar claims: {e}")
        return {"similar_claims": None}


# ==================== WORKFLOW CONDITIONS ====================

def check_worthiness_condition(state: AgentState) -> Literal["gather_evidence", "end"]:
    """Route based on whether claim is worth checking."""
    if state.get("is_checkworthy"):
        return "gather_evidence"
    return "end"


# ==================== BUILD WORKFLOW ====================

def build_verification_graph():
    """Build and compile the verification workflow graph."""
    
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("check_worthiness", node_check_worthiness)
    workflow.add_node("gather_evidence", node_gather_evidence)
    workflow.add_node("generate_verdict", node_generate_verdict)
    workflow.add_node("find_similar", node_find_similar_claims)
    workflow.add_node("save_result", node_save_result)
    
    # Set entry point
    workflow.set_entry_point("check_worthiness")
    
    # Add conditional edge after check_worthiness
    workflow.add_conditional_edges(
        "check_worthiness",
        check_worthiness_condition,
        {
            "gather_evidence": "gather_evidence",
            "end": END
        }
    )
    
    # Linear flow for the rest
    workflow.add_edge("gather_evidence", "generate_verdict")
    workflow.add_edge("generate_verdict", "find_similar")
    workflow.add_edge("find_similar", "save_result")
    workflow.add_edge("save_result", END)
    
    return workflow.compile()


# Compiled graph instance
graph = build_verification_graph()

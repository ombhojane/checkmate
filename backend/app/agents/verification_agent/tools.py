"""
Tools for the Verification Agent.
Provides search and evidence gathering capabilities.
"""

from typing import List, Dict, Any, Optional
from tavily import TavilyClient
from app.core.config import settings
from app.agents.verification_agent.credibility import (
    get_credibility_score,
    get_domain_from_url
)


def tavily_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Search the web using Tavily API and return results with credibility scores.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
        
    Returns:
        List of search results with credibility scores
    """
    if not settings.TAVILY_API_KEY:
        print("Warning: TAVILY_API_KEY not set. Returning empty results.")
        return []

    try:
        tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        
        # Use advanced search for fact-checking
        response = tavily.search(
            query=query,
            search_depth="advanced",
            max_results=max_results,
            include_domains=[
                "snopes.com",
                "factcheck.org",
                "politifact.com",
                "reuters.com",
                "apnews.com",
                "fullfact.org",
                "altnews.in",
                "boomlive.in"
            ]
        )
        
        results = []
        if "results" in response:
            for res in response["results"]:
                url = res.get("url", "")
                title = res.get("title", "")
                content = res.get("content", "")
                
                # Calculate credibility score
                credibility = get_credibility_score(url, title, content)
                
                results.append({
                    "url": url,
                    "title": title,
                    "content": content,
                    "credibility_score": credibility,
                    "domain": get_domain_from_url(url)
                })
        
        # Sort by credibility score (highest first)
        results.sort(key=lambda x: x["credibility_score"], reverse=True)
        
        return results
        
    except Exception as e:
        print(f"Error during Tavily search: {e}")
        return []


def tavily_search_general(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    General web search without domain restrictions.
    Used as fallback when fact-checker search returns no results.
    
    Args:
        query: Search query string
        max_results: Maximum number of results
        
    Returns:
        List of search results with credibility scores
    """
    if not settings.TAVILY_API_KEY:
        return []

    try:
        tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        
        response = tavily.search(
            query=query,
            search_depth="basic",
            max_results=max_results
        )
        
        results = []
        if "results" in response:
            for res in response["results"]:
                url = res.get("url", "")
                title = res.get("title", "")
                content = res.get("content", "")
                
                credibility = get_credibility_score(url, title, content)
                
                results.append({
                    "url": url,
                    "title": title,
                    "content": content,
                    "credibility_score": credibility,
                    "domain": get_domain_from_url(url)
                })
        
        results.sort(key=lambda x: x["credibility_score"], reverse=True)
        return results
        
    except Exception as e:
        print(f"Error during general Tavily search: {e}")
        return []


def format_evidence_for_llm(sources: List[Dict[str, Any]]) -> str:
    """
    Format search results into a structured evidence block for LLM analysis.
    
    Args:
        sources: List of search results with credibility scores
        
    Returns:
        Formatted evidence string
    """
    if not sources:
        return "No evidence sources found."
    
    evidence_parts = []
    
    for i, source in enumerate(sources, 1):
        credibility = source.get("credibility_score", 50)
        reliability = "HIGH" if credibility >= 80 else "MEDIUM" if credibility >= 50 else "LOW"
        
        evidence_parts.append(f"""
Source {i} ({reliability} reliability, score: {credibility}/100):
URL: {source.get('url', 'N/A')}
Title: {source.get('title', 'N/A')}
Content: {source.get('content', 'N/A')[:500]}...
""")
    
    return "\n".join(evidence_parts)


def extract_claim_from_text(text: str) -> str:
    """
    Clean and normalize a claim text.
    
    Args:
        text: Raw claim text
        
    Returns:
        Cleaned claim text
    """
    # Remove extra whitespace
    claim = " ".join(text.split())
    
    # Remove common prefixes
    prefixes_to_remove = [
        "is it true that",
        "i heard that",
        "someone told me",
        "fact check:",
        "verify:",
        "check this:"
    ]
    
    claim_lower = claim.lower()
    for prefix in prefixes_to_remove:
        if claim_lower.startswith(prefix):
            claim = claim[len(prefix):].strip()
            break
    
    return claim


async def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Generate embedding vector for a text using Gemini.
    
    Args:
        text: Text to embed
        
    Returns:
        Embedding vector or None if failed
    """
    try:
        import google.generativeai as genai
        
        if not settings.GOOGLE_API_KEY:
            return None
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        result = genai.embed_content(
            model=settings.EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document"
        )
        
        return result["embedding"]
        
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

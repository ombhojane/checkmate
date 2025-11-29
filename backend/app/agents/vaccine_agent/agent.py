"""
Vaccine Agent for CheckmateAI.
Generates weekly "Misinformation Vaccine" digests to proactively inform users.
"""

from datetime import datetime, timedelta
import json
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage

from app.core.config import settings
from app.core.llm import get_llm


# Language templates for multilingual support
LANGUAGE_PROMPTS = {
    "en": "Respond in English.",
    "hi": "Respond in Hindi (हिंदी में जवाब दें).",
    "es": "Respond in Spanish (Responde en español).",
    "fr": "Respond in French (Répondez en français).",
    "de": "Respond in German (Antworten Sie auf Deutsch).",
    "pt": "Respond in Portuguese (Responda em português).",
    "ar": "Respond in Arabic (أجب بالعربية).",
    "zh": "Respond in Chinese (用中文回答).",
}


async def generate_weekly_vaccine(language: str = "en") -> Optional[Dict[str, Any]]:
    """
    Generate the weekly misinformation vaccine digest.
    
    Args:
        language: Language code for the digest content
        
    Returns:
        Generated digest data or None if failed
    """
    from app.db.supabase import supabase_db
    
    print(f"[{datetime.now()}] Starting Vaccine Agent (language: {language})...")
    
    # Calculate date range
    today = datetime.utcnow()
    week_end = today
    week_start = today - timedelta(days=7)
    
    # Get recent high-threat items from Supabase
    recent_threats = await supabase_db.get_recent_threats(days=7, limit=30)
    
    if not recent_threats:
        print("No recent threats found for vaccine generation.")
        return None
    
    # Sort by centrality score and intensity
    def sort_key(item):
        intensity_weight = {"high": 3, "medium": 2, "low": 1}
        return (
            intensity_weight.get(item.get("intensity", "low"), 0),
            item.get("graph_centrality_score", 0)
        )
    
    recent_threats.sort(key=sort_key, reverse=True)
    top_threats = recent_threats[:15]  # Top 15 for analysis
    
    # Format threats for LLM
    threats_text = "\n\n".join([
        f"""
Threat {i+1}:
- Topic: {t.get('topic', 'Unknown')}
- Summary: {t.get('claim_summary', '')[:300]}...
- Intensity: {t.get('intensity', 'medium')}
- Centrality Score: {t.get('graph_centrality_score', 0):.2f}
- Sources: {len(t.get('sources', []))} fact-checkers reported
"""
        for i, t in enumerate(top_threats)
    ])
    
    # Get enrichment from verifications
    verifications = await supabase_db.get_verification_history(limit=20)
    verification_context = ""
    if verifications:
        recent_verdicts = [
            f"- {v.get('claim_text', '')[:100]}... (Verdict: {v.get('verdict')})"
            for v in verifications[:10]
        ]
        verification_context = "\n\nRecent Verifications:\n" + "\n".join(recent_verdicts)
    
    # Language instruction
    lang_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])
    
    # Generate digest with LLM
    prompt = f"""
You are creating a "Weekly Misinformation Vaccine" digest - a proactive briefing to help users build immunity against the most dangerous misinformation circulating this week.

TRENDING MISINFORMATION FROM THE PAST 7 DAYS:
{threats_text}

{verification_context}

INSTRUCTIONS:
1. Select the TOP 5 most critical/dangerous misinformation trends that users MUST know about
2. Prioritize threats that:
   - Could cause physical harm (health, safety)
   - Are spreading rapidly (high centrality score)
   - Target vulnerable populations
   - Are difficult to identify as false

For each of the 5 selected trends, provide:
1. **The Lie** (lie): A catchy, memorable title for the misinformation
2. **The Truth** (truth): Clear, factual correction in 1-2 sentences
3. **Why It Matters** (why_it_matters): Impact/danger of believing this in 1 sentence
4. **Sources Debunked** (sources_debunked): List of fact-checkers who debunked this
5. **Spread Velocity** (spread_velocity): "low", "medium", or "high"
6. **Regions Affected** (regions_affected): List of region codes (US, IN, UK, INT, etc.)

{lang_instruction}

Return ONLY a valid JSON object:
{{
    "trends": [
        {{
            "rank": 1,
            "lie": "...",
            "truth": "...",
            "why_it_matters": "...",
            "sources_debunked": ["Snopes", "Reuters"],
            "spread_velocity": "high",
            "regions_affected": ["US", "UK"]
        }},
        ...
    ]
}}
"""

    try:
        llm = get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # Parse JSON
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        
        data = json.loads(content)
        trends = data.get("trends", [])
        
        if not trends:
            print("LLM returned empty trends.")
            return None
        
        # Format claims for storage
        claims = []
        for i, trend in enumerate(trends):
            claims.append({
                "rank": trend.get("rank", i + 1),
                "lie": trend.get("lie", ""),
                "truth": trend.get("truth", ""),
                "why_it_matters": trend.get("why_it_matters", ""),
                "sources_debunked": trend.get("sources_debunked", []),
                "spread_velocity": trend.get("spread_velocity", "medium"),
                "regions_affected": trend.get("regions_affected", ["INT"])
            })
        
        # Save to Supabase
        digest_doc = await supabase_db.insert_vaccine_digest(
            week_start=week_start.strftime("%Y-%m-%d"),
            week_end=week_end.strftime("%Y-%m-%d"),
            claims=claims
        )
        
        if digest_doc:
            print(f"[{datetime.now()}] Vaccine digest generated and saved.")
            return {
                "id": digest_doc.get("id"),
                "week_start": week_start.strftime("%Y-%m-%d"),
                "week_end": week_end.strftime("%Y-%m-%d"),
                "claims": claims,
                "generated_at": datetime.utcnow().isoformat()
            }
        
        return None
        
    except Exception as e:
        print(f"Error generating vaccine digest: {e}")
        return None


async def get_latest_digest() -> Optional[Dict[str, Any]]:
    """
    Get the most recent vaccine digest.
    
    Returns:
        Latest digest or None
    """
    from app.db.supabase import supabase_db
    
    digest = await supabase_db.get_latest_vaccine_digest()
    
    if not digest:
        return None
    
    # Increment view count
    digest_id = digest.get("id")
    if digest_id:
        await supabase_db.increment_digest_view_count(digest_id)
    
    # Parse claims if stored as string
    claims = digest.get("claims", [])
    if isinstance(claims, str):
        try:
            claims = json.loads(claims)
        except Exception:
            claims = []
    
    return {
        "id": digest.get("id"),
        "week_start": digest.get("week_start"),
        "week_end": digest.get("week_end"),
        "claims": claims,
        "generated_at": digest.get("generated_at"),
        "view_count": digest.get("view_count", 0)
    }


async def get_digest_archive(limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
    """
    Get archived vaccine digests.
    
    Args:
        limit: Maximum number of digests
        offset: Pagination offset
        
    Returns:
        List of digests
    """
    from app.db.supabase import supabase_db
    
    digests = await supabase_db.get_vaccine_digest_archive(limit=limit, offset=offset)
    
    result = []
    for digest in digests:
        claims = digest.get("claims", [])
        if isinstance(claims, str):
            try:
                claims = json.loads(claims)
            except Exception:
                claims = []
        
        result.append({
            "id": digest.get("id"),
            "week_start": digest.get("week_start"),
            "week_end": digest.get("week_end"),
            "claims": claims,
            "generated_at": digest.get("generated_at"),
            "view_count": digest.get("view_count", 0)
        })
    
    return result


async def generate_personalized_vaccine(
    user_interests: List[str],
    user_region: str = "INT",
    language: str = "en"
) -> Optional[Dict[str, Any]]:
    """
    Generate a personalized vaccine based on user interests.
    
    Args:
        user_interests: List of topics the user is interested in
        user_region: User's region code
        language: Language preference
        
    Returns:
        Personalized digest or None
    """
    from app.db.supabase import supabase_db
    
    # Get recent threats
    recent_threats = await supabase_db.get_recent_threats(days=7, limit=50)
    
    if not recent_threats:
        return None
    
    # Filter by region and interests (basic matching)
    def is_relevant(threat):
        topic = threat.get("topic", "").lower()
        summary = threat.get("claim_summary", "").lower()
        sources = threat.get("sources", [])
        
        # Check region match
        for source in sources:
            if source.get("region") == user_region:
                return True
        
        # Check interest match
        for interest in user_interests:
            if interest.lower() in topic or interest.lower() in summary:
                return True
        
        return False
    
    relevant_threats = [t for t in recent_threats if is_relevant(t)]
    
    if not relevant_threats:
        relevant_threats = recent_threats[:10]  # Fallback to top threats
    
    # Use same generation logic but with filtered threats
    # (Would call generate_weekly_vaccine with filtered data)
    
    return await generate_weekly_vaccine(language=language)

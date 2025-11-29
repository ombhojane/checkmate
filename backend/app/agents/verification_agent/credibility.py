"""
Source credibility scoring system for CheckmateAI.
Assigns trust scores to sources based on their reputation and reliability.
"""

from typing import Dict, Optional
from urllib.parse import urlparse


# Source credibility scores (0-100)
# Higher scores = more trustworthy fact-checking sources
SOURCE_CREDIBILITY: Dict[str, int] = {
    # Tier 1: Major Fact-Checking Organizations (90-100)
    "snopes.com": 95,
    "factcheck.org": 94,
    "politifact.com": 93,
    "fullfact.org": 92,
    "reuters.com": 95,
    "apnews.com": 94,
    "afp.com": 93,
    
    # Tier 2: Regional Fact-Checkers (85-90)
    "altnews.in": 88,
    "boomlive.in": 87,
    "factly.in": 86,
    "thequint.com": 85,
    "vishvasnews.com": 85,
    "leadstories.com": 87,
    "checkyourfact.com": 85,
    
    # Tier 3: News Organizations (80-90)
    "bbc.com": 90,
    "bbc.co.uk": 90,
    "nytimes.com": 88,
    "washingtonpost.com": 87,
    "theguardian.com": 86,
    "npr.org": 88,
    "pbs.org": 87,
    
    # Tier 4: Scientific/Academic Sources (85-95)
    "who.int": 92,
    "cdc.gov": 91,
    "nih.gov": 90,
    "nature.com": 93,
    "science.org": 92,
    "sciencedirect.com": 88,
    "pubmed.ncbi.nlm.nih.gov": 90,
    "scholar.google.com": 85,
    
    # Tier 5: Government & Institutional (80-90)
    "gov.uk": 85,
    "usa.gov": 85,
    "europa.eu": 86,
    "un.org": 87,
    
    # Tier 6: Wikipedia (Moderate - needs cross-referencing)
    "wikipedia.org": 70,
    "en.wikipedia.org": 70,
    
    # Low credibility sources (0-40)
    "twitter.com": 30,
    "x.com": 30,
    "facebook.com": 25,
    "instagram.com": 25,
    "tiktok.com": 20,
    "youtube.com": 35,
    "reddit.com": 35,
    "medium.com": 45,
    "blogspot.com": 30,
    "wordpress.com": 35,
}

# Keywords that indicate lower credibility
LOW_CREDIBILITY_KEYWORDS = [
    "blog", "opinion", "editorial", "satire", "parody",
    "rumor", "gossip", "tabloid", "conspiracy"
]

# Keywords that indicate higher credibility
HIGH_CREDIBILITY_KEYWORDS = [
    "fact-check", "factcheck", "debunk", "verification",
    "research", "study", "peer-reviewed", "scientific"
]


def get_domain_from_url(url: str) -> str:
    """
    Extract the main domain from a URL.
    
    Args:
        url: Full URL string
        
    Returns:
        Domain string (e.g., "snopes.com")
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Remove www. prefix
        if domain.startswith("www."):
            domain = domain[4:]
        
        return domain
    except Exception:
        return ""


def get_credibility_score(url: str, title: str = "", content: str = "") -> int:
    """
    Calculate credibility score for a source.
    
    Args:
        url: Source URL
        title: Article title (optional)
        content: Article content snippet (optional)
        
    Returns:
        Credibility score 0-100
    """
    domain = get_domain_from_url(url)
    
    # Check direct domain match
    if domain in SOURCE_CREDIBILITY:
        base_score = SOURCE_CREDIBILITY[domain]
    else:
        # Check for partial domain matches (e.g., "news.bbc.co.uk" -> "bbc.co.uk")
        base_score = None
        for known_domain, score in SOURCE_CREDIBILITY.items():
            if known_domain in domain or domain.endswith("." + known_domain):
                base_score = score
                break
        
        if base_score is None:
            # Default score for unknown sources
            base_score = 40
    
    # Adjust based on content analysis
    text_to_analyze = f"{title} {content}".lower()
    
    # Penalty for low credibility keywords
    for keyword in LOW_CREDIBILITY_KEYWORDS:
        if keyword in text_to_analyze:
            base_score = max(10, base_score - 10)
    
    # Bonus for high credibility keywords
    for keyword in HIGH_CREDIBILITY_KEYWORDS:
        if keyword in text_to_analyze:
            base_score = min(100, base_score + 5)
    
    return base_score


def get_credibility_tier(score: int) -> str:
    """
    Get the credibility tier name for a score.
    
    Args:
        score: Credibility score 0-100
        
    Returns:
        Tier name string
    """
    if score >= 90:
        return "Highly Reliable"
    elif score >= 80:
        return "Reliable"
    elif score >= 60:
        return "Moderately Reliable"
    elif score >= 40:
        return "Low Reliability"
    else:
        return "Unreliable"


def calculate_weighted_confidence(
    sources: list,
    base_confidence: float
) -> float:
    """
    Calculate weighted confidence based on source credibility.
    
    Args:
        sources: List of sources with their credibility scores
        base_confidence: Initial confidence from LLM
        
    Returns:
        Adjusted confidence score
    """
    if not sources:
        return base_confidence * 0.7  # Penalize lack of sources
    
    # Calculate average credibility of sources
    total_credibility = sum(
        s.get("credibility_score", 40) for s in sources
    )
    avg_credibility = total_credibility / len(sources)
    
    # Weight factor based on source quality (0.8 to 1.2)
    weight = 0.8 + (avg_credibility / 100) * 0.4
    
    # Also consider number of sources (more sources = higher confidence)
    source_bonus = min(len(sources) * 2, 10)  # Max 10% bonus
    
    adjusted = (base_confidence * weight) + source_bonus
    
    return min(100, max(0, adjusted))


def format_credibility_explanation(sources: list) -> str:
    """
    Generate a human-readable explanation of source credibility.
    
    Args:
        sources: List of sources with their credibility scores
        
    Returns:
        Explanation string
    """
    if not sources:
        return "No sources were found to verify this claim."
    
    high_cred = [s for s in sources if s.get("credibility_score", 0) >= 80]
    medium_cred = [s for s in sources if 50 <= s.get("credibility_score", 0) < 80]
    low_cred = [s for s in sources if s.get("credibility_score", 0) < 50]
    
    parts = []
    
    if high_cred:
        names = [get_domain_from_url(s.get("url", "")) for s in high_cred[:3]]
        parts.append(f"This verdict is supported by {len(high_cred)} highly reliable source(s) including {', '.join(names)}.")
    
    if medium_cred:
        parts.append(f"{len(medium_cred)} moderately reliable source(s) were also consulted.")
    
    if low_cred and not high_cred:
        parts.append(f"Note: Only low-reliability sources ({len(low_cred)}) were found. Confidence is reduced.")
    
    return " ".join(parts) if parts else "Multiple sources were analyzed."


# Predefined prompts for credibility-aware verification
CREDIBILITY_PROMPT_TEMPLATE = """
When analyzing sources, consider their credibility:
- Tier 1 (Score 90-100): Major fact-checkers (Snopes, Reuters, AFP) - Highly trustworthy
- Tier 2 (Score 80-90): Regional fact-checkers, major news - Reliable
- Tier 3 (Score 60-80): General news, Wikipedia - Verify with other sources
- Tier 4 (Score 40-60): Blogs, forums - Use with caution
- Tier 5 (Score 0-40): Social media, unknown sites - Low reliability

Weight your analysis accordingly. Verdicts supported by Tier 1-2 sources should have higher confidence.
"""





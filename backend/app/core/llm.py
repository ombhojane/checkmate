"""
LLM (Large Language Model) configuration for CheckmateAI.
Provides configured instances of Gemini 2.0 Flash for various tasks.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


def get_llm(temperature: float = 0) -> ChatGoogleGenerativeAI:
    """
    Get a configured Gemini 2.0 Flash LLM instance.
    
    Args:
        temperature: Sampling temperature (0 = deterministic, 1 = creative)
        
    Returns:
        Configured LLM instance
        
    Raises:
        ValueError: If GOOGLE_API_KEY is not set
    """
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set in environment variables")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=temperature,
        convert_system_message_to_human=True
    )


def get_vision_llm(temperature: float = 0) -> ChatGoogleGenerativeAI:
    """
    Get a configured Gemini 2.0 Flash LLM instance for vision tasks.
    
    Args:
        temperature: Sampling temperature
        
    Returns:
        Configured LLM instance for multimodal inputs
        
    Raises:
        ValueError: If GOOGLE_API_KEY is not set
    """
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set in environment variables")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=temperature
    )


def get_creative_llm() -> ChatGoogleGenerativeAI:
    """
    Get an LLM instance configured for creative tasks.
    Used for generating vaccine digest content.
    
    Returns:
        Configured LLM instance with higher temperature
    """
    return get_llm(temperature=0.7)

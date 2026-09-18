from langchain_core.language_models.chat_models import BaseChatModel

from src.core.config import Settings
from src.infrastructure.llm.errors import LLMConfigurationError


def build_gemini_model(settings: Settings) -> BaseChatModel:
    if settings.google_api_key is None:
        raise LLMConfigurationError("GOOGLE_API_KEY is required when LLM_PROVIDER=gemini")

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as error:
        raise LLMConfigurationError(
            "Gemini provider requires the 'langchain-google-genai' package"
        ) from error

    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.google_api_key.get_secret_value(),
        temperature=settings.llm_temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
    )

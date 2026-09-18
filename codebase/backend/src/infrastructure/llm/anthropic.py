from langchain_core.language_models.chat_models import BaseChatModel

from src.core.config import Settings
from src.infrastructure.llm.errors import LLMConfigurationError


def build_anthropic_model(settings: Settings) -> BaseChatModel:
    if settings.anthropic_api_key is None:
        raise LLMConfigurationError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic")

    try:
        from langchain_anthropic import ChatAnthropic
    except ImportError as error:
        raise LLMConfigurationError(
            "Anthropic provider requires the 'langchain-anthropic' package"
        ) from error

    return ChatAnthropic(
        model=settings.llm_model,
        api_key=settings.anthropic_api_key.get_secret_value(),
        temperature=settings.llm_temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
    )

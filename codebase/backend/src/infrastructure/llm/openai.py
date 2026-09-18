from langchain_core.language_models.chat_models import BaseChatModel

from src.core.config import Settings
from src.infrastructure.llm.errors import LLMConfigurationError


def build_openai_model(settings: Settings) -> BaseChatModel:
    if settings.openai_api_key is None:
        raise LLMConfigurationError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")

    try:
        from langchain_openai import ChatOpenAI
    except ImportError as error:
        raise LLMConfigurationError(
            "OpenAI provider requires the 'langchain-openai' package"
        ) from error

    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.openai_api_key.get_secret_value(),
        temperature=settings.llm_temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
    )

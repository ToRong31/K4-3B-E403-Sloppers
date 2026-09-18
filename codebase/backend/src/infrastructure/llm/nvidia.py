from langchain_core.language_models.chat_models import BaseChatModel

from src.core.config import Settings
from src.infrastructure.llm.errors import LLMConfigurationError


def build_nvidia_model(settings: Settings) -> BaseChatModel:
    """Build an NVIDIA hosted NIM model through its OpenAI-compatible endpoint."""

    if (
        settings.nvidia_api_key is None
        or not settings.nvidia_api_key.get_secret_value().strip()
    ):
        raise LLMConfigurationError("NVIDIA_API_KEY is required when LLM_PROVIDER=nvidia")

    try:
        from langchain_openai import ChatOpenAI
    except ImportError as error:
        raise LLMConfigurationError(
            "NVIDIA provider requires the 'langchain-openai' package"
        ) from error

    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.nvidia_api_key.get_secret_value(),
        base_url=settings.nvidia_base_url.rstrip("/"),
        temperature=settings.llm_temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
    )

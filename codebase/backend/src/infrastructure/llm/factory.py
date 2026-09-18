from collections.abc import Callable

from langchain_core.language_models.chat_models import BaseChatModel

from src.core.config import LLMProvider, Settings, get_settings
from src.infrastructure.llm.anthropic import build_anthropic_model
from src.infrastructure.llm.errors import LLMConfigurationError
from src.infrastructure.llm.gemini import build_gemini_model
from src.infrastructure.llm.openai import build_openai_model

ModelBuilder = Callable[[Settings], BaseChatModel]

PROVIDER_BUILDERS: dict[LLMProvider, ModelBuilder] = {
    LLMProvider.OPENAI: build_openai_model,
    LLMProvider.ANTHROPIC: build_anthropic_model,
    LLMProvider.GEMINI: build_gemini_model,
}


def build_chat_model(settings: Settings | None = None) -> BaseChatModel:
    settings = settings or get_settings()
    if not settings.llm_model.strip():
        raise LLMConfigurationError("LLM_MODEL must be configured")
    if settings.selected_api_key is None:
        key_name = {
            LLMProvider.OPENAI: "OPENAI_API_KEY",
            LLMProvider.ANTHROPIC: "ANTHROPIC_API_KEY",
            LLMProvider.GEMINI: "GOOGLE_API_KEY",
        }[settings.llm_provider]
        raise LLMConfigurationError(
            f"{key_name} is required when LLM_PROVIDER={settings.llm_provider.value}"
        )
    return PROVIDER_BUILDERS[settings.llm_provider](settings)

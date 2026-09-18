from collections.abc import Callable

import pytest

from src.core.config import LLMProvider, Settings
from src.infrastructure.llm import factory
from src.infrastructure.llm.errors import LLMConfigurationError


def make_settings(provider: LLMProvider, **overrides) -> Settings:
    values = {
        "llm_provider": provider,
        "llm_model": "test-model",
        "openai_api_key": None,
        "anthropic_api_key": None,
        "google_api_key": None,
        "nvidia_api_key": None,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


@pytest.mark.parametrize(
    ("provider", "key_field"),
    [
        (LLMProvider.OPENAI, "openai_api_key"),
        (LLMProvider.ANTHROPIC, "anthropic_api_key"),
        (LLMProvider.GEMINI, "google_api_key"),
        (LLMProvider.NVIDIA, "nvidia_api_key"),
    ],
)
def test_factory_uses_only_selected_provider(
    monkeypatch: pytest.MonkeyPatch,
    provider: LLMProvider,
    key_field: str,
) -> None:
    selected_model = object()
    calls: list[LLMProvider] = []

    def builder_for(candidate: LLMProvider) -> Callable:
        def build(_: Settings):
            calls.append(candidate)
            return selected_model

        return build

    monkeypatch.setattr(
        factory,
        "PROVIDER_BUILDERS",
        {candidate: builder_for(candidate) for candidate in LLMProvider},
    )
    settings = make_settings(provider, **{key_field: "secret"})

    result = factory.build_chat_model(settings)

    assert result is selected_model
    assert calls == [provider]


def test_factory_requires_key_for_selected_provider() -> None:
    settings = make_settings(
        LLMProvider.ANTHROPIC,
        openai_api_key="unused-openai-key",
    )

    with pytest.raises(LLMConfigurationError, match="ANTHROPIC_API_KEY"):
        factory.build_chat_model(settings)


def test_factory_requires_model_name() -> None:
    settings = make_settings(
        LLMProvider.GEMINI,
        llm_model="",
        google_api_key="secret",
    )

    with pytest.raises(LLMConfigurationError, match="LLM_MODEL"):
        factory.build_chat_model(settings)


def test_factory_rejects_blank_nvidia_key() -> None:
    settings = make_settings(LLMProvider.NVIDIA, nvidia_api_key="")

    with pytest.raises(LLMConfigurationError, match="NVIDIA_API_KEY"):
        factory.build_chat_model(settings)

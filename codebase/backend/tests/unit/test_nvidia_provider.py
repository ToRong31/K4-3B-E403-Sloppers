from typing import Any

import langchain_openai

from src.core.config import LLMProvider, Settings
from src.infrastructure.llm.nvidia import build_nvidia_model


def test_nvidia_provider_uses_openai_compatible_endpoint(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    expected_model = object()

    def fake_chat_openai(**kwargs):
        captured.update(kwargs)
        return expected_model

    monkeypatch.setattr(langchain_openai, "ChatOpenAI", fake_chat_openai)
    settings = Settings(
        _env_file=None,
        llm_provider=LLMProvider.NVIDIA,
        llm_model="meta/llama-3.3-70b-instruct",
        nvidia_api_key="nvapi-test-only",
        nvidia_base_url="https://integrate.api.nvidia.com/v1/",
    )

    result = build_nvidia_model(settings)

    assert result is expected_model
    assert captured["model"] == "meta/llama-3.3-70b-instruct"
    assert captured["api_key"] == "nvapi-test-only"
    assert captured["base_url"] == "https://integrate.api.nvidia.com/v1"

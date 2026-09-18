import sys

from src.core.config import get_settings
from src.infrastructure.llm.errors import LLMConfigurationError
from src.infrastructure.llm.factory import build_chat_model


def main() -> int:
    """Make one minimal real request without printing or logging the API key."""

    settings = get_settings()
    try:
        model = build_chat_model(settings)
        response = model.invoke(
            "Trả lời đúng một dòng tiếng Việt: kết nối mô hình đã hoạt động."
        )
    except LLMConfigurationError as error:
        print(f"Configuration error: {error}", file=sys.stderr)
        return 2
    except Exception as error:  # noqa: BLE001 - CLI boundary must return a safe message
        print(
            f"Model request failed ({type(error).__name__}). "
            "Kiểm tra NVIDIA_API_KEY, LLM_MODEL và kết nối mạng.",
            file=sys.stderr,
        )
        return 1

    content = response.content if isinstance(response.content, str) else str(response.content)
    print(f"Provider: {settings.llm_provider.value}")
    print(f"Model: {settings.llm_model}")
    print(f"Response: {content.strip()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

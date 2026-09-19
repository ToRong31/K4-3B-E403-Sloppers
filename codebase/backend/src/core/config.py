from enum import StrEnum

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMProvider(StrEnum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    NVIDIA = "nvidia"


class Settings(BaseSettings):
    app_name: str = "VLearn LabSpace API"
    app_env: str = "development"
    app_debug: bool = False
    app_api_prefix: str = "/api/v1"
    app_log_level: str = "INFO"
    app_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000"

    database_url: str = "sqlite+pysqlite:///./vlearn_labspace.db"
    database_echo: bool = False
    database_auto_create: bool = False

    session_cookie_name: str = "vlearn_session"
    session_ttl_hours: int = Field(default=24, ge=1, le=24 * 30)
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    seed_demo_password: SecretStr | None = None
    class_scope_id: str = "K4-E403"

    llm_provider: LLMProvider = LLMProvider.OPENAI
    llm_model: str = ""
    llm_temperature: float = Field(default=0, ge=0, le=2)
    llm_timeout_seconds: int = Field(default=60, ge=1)
    llm_max_retries: int = Field(default=2, ge=0)

    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None
    google_api_key: SecretStr | None = None
    nvidia_api_key: SecretStr | None = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]

    @property
    def selected_api_key(self) -> SecretStr | None:
        selected = {
            LLMProvider.OPENAI: self.openai_api_key,
            LLMProvider.ANTHROPIC: self.anthropic_api_key,
            LLMProvider.GEMINI: self.google_api_key,
            LLMProvider.NVIDIA: self.nvidia_api_key,
        }[self.llm_provider]
        if selected is None or not selected.get_secret_value().strip():
            return None
        return selected


def get_settings() -> Settings:
    return Settings(_env_file=".env")

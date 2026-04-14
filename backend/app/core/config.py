from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "NDEX API"
    database_url: str = "sqlite:///./ndex.db"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    llm_api_url: str | None = None
    llm_api_key: str | None = None
    llm_model: str = "llama-3.1-8b-instant"
    llm_timeout_seconds: int = 30

    github_token: str | None = None
    github_timeout_seconds: int = 20

    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_timeout_seconds: int = 10

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str
    direct_url: str | None = None

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    session_cookie_name: str = "ps_session"
    access_token_ttl_minutes: int = 60
    refresh_token_ttl_days: int = 30

    github_client_id: str = ""
    github_client_secret: str = ""
    github_oauth_redirect_uri: str = "http://localhost:8000/api/v1/auth/callback/github"
    github_oauth_scopes: str = "read:user user:email public_repo"

    frontend_url: str = "http://localhost:3000"

    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"

    # Neon Auth (Stack Auth) — second sign-in path shown alongside GitHub.
    # Base issuer URL from the Neon console "Auth" tab, e.g.
    # https://<endpoint>.neonauth.<region>.aws.neon.tech/<db>/auth — its
    # JWKS lives at {neon_auth_issuer_url}/.well-known/jwks.json. Only used
    # to verify tokens — no secret key needed here.
    neon_auth_issuer_url: str = ""

    storage_dir: str = "./storage"

    leetcode_session_token: str = ""
    kaggle_username: str = ""
    kaggle_key: str = ""

    sentry_dsn: str = ""
    posthog_api_key: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()

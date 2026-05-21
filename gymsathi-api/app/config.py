from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "GymSathi API"
    DEBUG: bool = False
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ADMIN_WHATSAPP_NUMBER: str = ""
    ADMIN_WHATSAPP_API_KEY: str = ""
    ADMIN_WHATSAPP_APP_NAME: str = ""
    PRICE_MONTHLY: float = 499.0
    PRICE_QUARTERLY: float = 1299.0
    PRICE_YEARLY: float = 4499.0
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

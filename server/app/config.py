from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # agent 1 is the real ocr-extract service, called as-is
    OCR_EXTRACT_URL: str = "http://localhost:8000"
    OCR_EXTRACT_API_KEY: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_THINKING: Literal["minimal", "low", "medium", "high"] = "medium"


settings = Settings()

"""Application configuration and constants."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Converti"
    api_prefix: str = "/api"
    allowed_origins: list[str] | str = ["*"]
    job_storage_dir: Path = Path("./storage/jobs").resolve()
    max_concurrent_jobs: int = 4
    model_config = SettingsConfigDict(env_prefix="CONVERTI_")

    @field_validator("allowed_origins", mode="after")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        if value is None or value == "":
            return ["*"]
        if isinstance(value, str):
            items = (item.strip() for item in value.split(","))
            cleaned = [item for item in items if item]
            return cleaned or ["*"]
        if isinstance(value, Iterable):
            result = [str(item).strip() for item in value if str(item).strip()]
            return result or ["*"]
        raise TypeError("allowed_origins must be a string or list of strings")


settings = Settings()

settings.job_storage_dir.mkdir(parents=True, exist_ok=True)

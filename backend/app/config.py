import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "your-entra-client-id-here")
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", os.getenv("AZURE_Organizations_ID", "common"))
    AZURE_Organizations_ID: str = os.getenv("AZURE_Organizations_ID", os.getenv("AZURE_TENANT_ID", "common"))
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")
    AZURE_AUTHORITY: str = os.getenv("AZURE_AUTHORITY", "https://login.microsoftonline.com/common")
    REDIRECT_URI: str = os.getenv("REDIRECT_URI", "http://localhost:5173")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    MOCK_AUTH_MODE: bool = os.getenv("MOCK_AUTH_MODE", "true").lower() in ("true", "1", "yes")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

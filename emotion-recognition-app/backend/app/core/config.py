from pydantic import BaseSettings, Field, AnyHttpUrl
from pathlib import Path
from typing import List, Optional, Union
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "Facial Emotion Recognition API"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Model paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(Path("models/torchscript_model_0_66_49_wo_gl.pth")))
    LANDMARK_MODEL_PATH: str = os.getenv(
        "LANDMARK_MODEL_PATH", 
        str(Path("models/shape_predictor_68_face_landmarks.dat"))
    )
    
    # File Uploads
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "uploads"))
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 10485760))  # 10MB
    
    # WebSocket
    WEBSOCKET_PATH: str = os.getenv("WEBSOCKET_PATH", "/ws/emotion")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv(
        "LOG_FORMAT", 
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()

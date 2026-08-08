import os
from pydantic import BaseSettings, Field
from typing import List

class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables.
    """
    APP_NAME: str = "FraudGuard API"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    MODEL_VERSION: str = Field(default="xgb-v1.0", env="MODEL_VERSION")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=30, env="RATE_LIMIT_PER_MINUTE")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        env="CORS_ORIGINS"
    )
    
    # Artifact Paths
    MODEL_PATH: str = "models/model_xgb.pkl"
    SCALER_PATH: str = "models/scaler.pkl"
    THRESHOLD_PATH: str = "models/best_threshold.pkl"
    EXPLAINER_PATH: str = "models/shap_explainer.pkl"
    FEATURES_PATH: str = "models/feature_names.pkl"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

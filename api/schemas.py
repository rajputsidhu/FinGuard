import math
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional

class TransactionInput(BaseModel):
    """
    Schema for a single transaction input features with strict validation.
    """
    Time: float = Field(..., example=10000.0, description="Seconds elapsed since first transaction (>= 0)")
    Amount: float = Field(..., example=149.99, description="Transaction amount in currency (>= 0)")
    V1: float = Field(..., example=0.12)
    V2: float = Field(..., example=-0.05)
    V3: float = Field(..., example=1.23)
    V4: float = Field(..., example=-0.45)
    V5: float = Field(..., example=0.67)
    V6: float = Field(..., example=-0.12)
    V7: float = Field(..., example=0.89)
    V8: float = Field(..., example=-0.34)
    V9: float = Field(..., example=0.01)
    V10: float = Field(..., example=-0.56)
    V11: float = Field(..., example=1.02)
    V12: float = Field(..., example=-0.78)
    V13: float = Field(..., example=0.23)
    V14: float = Field(..., example=-1.12)
    V15: float = Field(..., example=0.34)
    V16: float = Field(..., example=-0.67)
    V17: float = Field(..., example=0.98)
    V18: float = Field(..., example=-0.12)
    V19: float = Field(..., example=0.45)
    V20: float = Field(..., example=-0.23)
    V21: float = Field(..., example=0.02)
    V22: float = Field(..., example=-0.34)
    V23: float = Field(..., example=0.12)
    V24: float = Field(..., example=-0.56)
    V25: float = Field(..., example=0.78)
    V26: float = Field(..., example=-0.12)
    V27: float = Field(..., example=0.05)
    V28: float = Field(..., example=-0.32)

    @validator("*", pre=True)
    def validate_finite_floats(cls, v, field):
        """Ensure input float values are finite numbers and not NaN or Infinity."""
        if v is None:
            raise ValueError(f"Field '{field.name}' cannot be None.")
        try:
            val = float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Field '{field.name}' must be a valid float number.")
        if math.isnan(val) or math.isinf(val):
            raise ValueError(f"Field '{field.name}' must be a finite number (cannot be NaN or Infinity).")
        return val

    @validator("Amount")
    def validate_amount_positive(cls, v):
        if v < 0:
            raise ValueError("Transaction amount must be greater than or equal to 0.")
        return v

    @validator("Time")
    def validate_time_positive(cls, v):
        if v < 0:
            raise ValueError("Transaction time must be greater than or equal to 0.")
        return v


class ExplanationFactor(BaseModel):
    """
    Structured factor explanation derived from SHAP contributions.
    """
    factor: str = Field(..., example="V14", description="Feature name or factor key")
    impact: str = Field(..., example="high", description="Impact magnitude: high, medium, low")
    direction: str = Field(..., example="increases_risk", description="Direction: increases_risk or decreases_risk")
    description: str = Field(..., example="Anomalous behavior pattern observed in feature V14", description="Human readable explanation")


class PredictResponse(BaseModel):
    """
    Enhanced schema for prediction endpoint response.
    """
    prediction: str = Field(..., example="FRAUD", description="Classification label: FRAUD or LEGITIMATE")
    model_assessment: str = Field(default="Potentially suspicious", example="Potentially suspicious", description="Human understandable assessment statement")
    risk_score: int = Field(..., example=84, description="Human readable risk score from 0 to 100")
    risk_level: str = Field(..., example="HIGH", description="Risk level category: LOW, MEDIUM, HIGH, CRITICAL")
    model_probability: float = Field(..., example=0.91, description="Raw model probability score (uncalibrated)")
    threshold: float = Field(..., example=0.42, description="Configured decision threshold")
    model_version: str = Field(default="xgb-v1.0", example="xgb-v1.0", description="Trained model version identifier")
    explanation_factors: List[ExplanationFactor] = Field(default_factory=list, description="Structured human-readable risk drivers")
    
    # Backward compatibility attributes
    fraud_probability: float = Field(..., example=0.91, description="Probability score of fraud")
    is_fraud: bool = Field(default=False, example=True, description="True if classified as FRAUD")
    probability: float = Field(default=0.0, example=0.91, description="Probability score of fraud")
    shap_values: Dict[str, float] = Field(default_factory=dict, description="SHAP feature contributions")


class FeatureContribution(BaseModel):
    """
    Schema for feature importance contribution.
    """
    feature: str = Field(..., example="V14")
    shap_value: float = Field(..., example=0.81)


class ExplainResponse(BaseModel):
    """
    Schema for explanation endpoint response.
    """
    base_value: float = Field(..., example=-4.12, description="Model baseline value (log-odds space)")
    top_features: List[FeatureContribution] = Field(..., description="Top features contributing positively or negatively to this score")
    shap_values: Dict[str, float] = Field(..., description="Complete dictionary of SHAP values for all features")


class ModelInfoResponse(BaseModel):
    """
    Schema for model metadata endpoint.
    """
    model: str = Field(default="XGBoost", example="XGBoost")
    model_version: str = Field(default="xgb-v1.0", example="xgb-v1.0")
    explainability: str = Field(default="SHAP", example="SHAP")
    feature_count: int = Field(default=30, example=30)
    threshold: float = Field(default=0.42, example=0.42)
    calibration_note: str = Field(
        default="Score represents raw model score derived from dataset training patterns. Not guaranteed probability of real-world financial fraud.",
        description="Disclaimer on model probability calibration"
    )


class ReadinessResponse(BaseModel):
    """
    Schema for service readiness endpoint.
    """
    status: str = Field(..., example="ready", description="Service readiness status: ready or not_ready")
    model_loaded: bool = Field(..., example=True)
    artifacts_valid: bool = Field(..., example=True)
    artifacts_status: Dict[str, bool] = Field(..., description="Validation status of required model artifacts")


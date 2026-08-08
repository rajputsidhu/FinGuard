import os
import sys
import numpy as np
# Patch np.int for compatibility with older shap versions in newer numpy
if not hasattr(np, "int"):
    np.int = int
import pandas as pd
import joblib
from functools import lru_cache
from typing import Dict, Any, List

# Add the project root to python path for clean imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.utils import setup_logger
from api.schemas import TransactionInput, PredictResponse, ExplainResponse, FeatureContribution

logger = setup_logger("api_predictor", "logs/api.log")

# Define paths relative to workspace root
MODEL_PATH = "models/model_xgb.pkl"
SCALER_PATH = "models/scaler.pkl"
THRESHOLD_PATH = "models/best_threshold.pkl"
EXPLAINER_PATH = "models/shap_explainer.pkl"
FEATURES_PATH = "models/feature_names.pkl"

def validate_model_artifacts() -> Dict[str, Any]:
    """
    Validates presence of all required model artifacts on disk.
    Used by startup checks and the GET /ready probe.
    """
    status_dict = {
        "model_xgb.pkl": os.path.exists(MODEL_PATH),
        "scaler.pkl": os.path.exists(SCALER_PATH),
        "best_threshold.pkl": os.path.exists(THRESHOLD_PATH),
        "shap_explainer.pkl": os.path.exists(EXPLAINER_PATH),
        "feature_names.pkl": os.path.exists(FEATURES_PATH)
    }
    # Threshold is technically optional (has fallback 0.5), but core model artifacts are required
    required_valid = (
        status_dict["model_xgb.pkl"] and
        status_dict["scaler.pkl"] and
        status_dict["feature_names.pkl"]
    )
    return {
        "artifacts_valid": required_valid,
        "artifacts_status": status_dict
    }

# ----------------------------------------------------
# LRU Cache Model Loaders to prevent file I/O overhead
# ----------------------------------------------------
@lru_cache(maxsize=1)
def get_xgb_model() -> Any:
    """Loads and caches the trained XGBoost model."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"✖ Model file not found at {MODEL_PATH}. Make sure training script is executed.")
    logger.info("✔ Loaded XGBoost model from disk (cached).")
    return joblib.load(MODEL_PATH)

@lru_cache(maxsize=1)
def get_scaler() -> Any:
    """Loads and caches the StandardScaler."""
    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"✖ Scaler file not found at {SCALER_PATH}. Make sure preprocessing script is executed.")
    logger.info("✔ Loaded StandardScaler from disk (cached).")
    return joblib.load(SCALER_PATH)

@lru_cache(maxsize=1)
def get_threshold() -> float:
    """Loads and caches the optimized F1 threshold. Fallback to 0.5 if not found (warning)."""
    if not os.path.exists(THRESHOLD_PATH):
        logger.warning(f"⚠ Threshold file not found at {THRESHOLD_PATH}. Using fallback threshold 0.5.")
        return 0.5
    thresh = float(joblib.load(THRESHOLD_PATH))
    logger.info(f"✔ Loaded decision threshold from disk: {thresh:.4f} (cached).")
    return thresh

@lru_cache(maxsize=1)
def get_shap_explainer() -> Any:
    """Loads and caches the SHAP TreeExplainer."""
    if not os.path.exists(EXPLAINER_PATH):
        raise FileNotFoundError(f"✖ SHAP Explainer not found at {EXPLAINER_PATH}. Run explainability script first.")
    logger.info("✔ Loaded SHAP TreeExplainer from disk (cached).")
    return joblib.load(EXPLAINER_PATH)

@lru_cache(maxsize=1)
def get_feature_names() -> List[str]:
    """Loads and caches the feature names in pipeline execution order."""
    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"✖ Feature names file not found at {FEATURES_PATH}.")
    features = joblib.load(FEATURES_PATH)
    logger.info(f"✔ Loaded feature list from disk: {len(features)} features (cached).")
    return features

# ----------------------------------------------------
# Preprocessing and Prediction Logic
# ----------------------------------------------------
def preprocess_input(transaction: TransactionInput) -> np.ndarray:
    """
    Extracts Pydantic inputs in the correct model feature order,
    scales only Time and Amount, and returns a 2D numpy array ready for inference.
    """
    feature_names = get_feature_names()
    scaler = get_scaler()
    
    # Convert input to dictionary
    input_dict = transaction.dict()
    
    # Build 1x30 raw feature list matching features order
    raw_vector = [input_dict[feat] for feat in feature_names]
    X_raw = np.array([raw_vector])
    
    # Identify indices of columns to scale
    time_idx = feature_names.index('Time')
    amount_idx = feature_names.index('Amount')
    
    # Transform only Time and Amount
    time_val = input_dict['Time']
    amount_val = input_dict['Amount']
    
    scaled_values = scaler.transform([[time_val, amount_val]])
    
    # Replace in feature array
    X_scaled = X_raw.copy()
    X_scaled[0, time_idx] = scaled_values[0, 0]
    X_scaled[0, amount_idx] = scaled_values[0, 1]
    
    return X_scaled

def make_prediction(transaction: TransactionInput) -> PredictResponse:
    """
    Preprocesses input features, runs XGBoost model prediction,
    applies the decision threshold, computes SHAP values dynamically,
    and returns human-readable risk score, risk level, and explanation factors.
    """
    # Force loads objects (cached after first request)
    xgb = get_xgb_model()
    threshold = get_threshold()
    
    # Run Preprocessing
    X_inference = preprocess_input(transaction)
    
    # Get probability score (class 1)
    probabilities = xgb.predict_proba(X_inference)
    fraud_prob = float(probabilities[0, 1])
    
    # Apply Threshold logic
    prediction = "FRAUD" if fraud_prob >= threshold else "LEGITIMATE"
    
    # Model-generated Risk Score (0 - 100 scale)
    risk_score = int(round(min(1.0, max(0.0, fraud_prob)) * 100))
    
    # Risk Level categorization (Prompt section 10 guidance)
    # 0–30 LOW, 31–60 MEDIUM, 61–80 HIGH, 81–100 CRITICAL
    if risk_score <= 30:
        risk_level = "LOW"
        model_assessment = "Appears consistent with typical legitimate transaction patterns"
    elif risk_score <= 60:
        risk_level = "MEDIUM"
        model_assessment = "Mild variance from baseline transaction patterns observed"
    elif risk_score <= 80:
        risk_level = "HIGH"
        model_assessment = "Potentially suspicious transaction pattern detected"
    else:
        risk_level = "CRITICAL"
        model_assessment = "High resemblance to previously identified fraudulent transaction patterns"
        
    # Calculate SHAP values dynamically for explainability
    shap_dict = {}
    explanation_factors = []
    try:
        explainer = get_shap_explainer()
        feature_names = get_feature_names()
        try:
            explanation = explainer(X_inference)
            shap_values_vector = explanation.values[0]
        except Exception:
            shap_values_vector = explainer.shap_values(X_inference)[0]
            
        # Build SHAP dictionary
        shap_tuples = []
        for feat_name, shap_val in zip(feature_names, shap_values_vector):
            val = float(shap_val)
            shap_dict[feat_name] = round(val, 4)
            shap_tuples.append((feat_name, val))
            
        # Top 3 most influential drivers
        sorted_tuples = sorted(shap_tuples, key=lambda item: abs(item[1]), reverse=True)
        top_3 = sorted_tuples[:3]
        
        for feat, val in top_3:
            impact_level = "high" if abs(val) > 0.5 else ("medium" if abs(val) > 0.1 else "low")
            direction = "increases_risk" if val > 0 else "decreases_risk"
            
            if feat == "Amount":
                desc = "Transaction amount-related characteristics contributed to the score assessment"
            elif feat == "Time":
                desc = "Transaction timing window aligned with historical usage patterns"
            else:
                desc = f"Transaction behavior pattern feature '{feat}' contributed to the model score"
                
            from api.schemas import ExplanationFactor
            explanation_factors.append(
                ExplanationFactor(
                    factor=feat,
                    impact=impact_level,
                    direction=direction,
                    description=desc
                )
            )
    except Exception as e:
        logger.warning(f"Failed to generate SHAP values inside make_prediction: {e}")
        shap_dict = {}
        
    return PredictResponse(
        prediction=prediction,
        model_assessment=model_assessment,
        risk_score=risk_score,
        risk_level=risk_level,
        model_probability=round(fraud_prob, 4),
        threshold=round(threshold, 4),
        model_version="xgb-v1.0",
        explanation_factors=explanation_factors,
        fraud_probability=round(fraud_prob, 4),
        is_fraud=(prediction == "FRAUD"),
        probability=round(fraud_prob, 4),
        shap_values=shap_dict
    )


def generate_explanation(transaction: TransactionInput) -> ExplainResponse:
    """
    Preprocesses features, computes transaction SHAP values dynamically,
    extracts base value and feature contributions, and formats response.
    """
    explainer = get_shap_explainer()
    feature_names = get_feature_names()
    
    # Run Preprocessing
    X_inference = preprocess_input(transaction)
    
    # Run SHAP explanation
    try:
        # Try modern API
        explanation = explainer(X_inference)
        shap_values_vector = explanation.values[0]
    except Exception:
        # Fallback to classical API
        shap_values_vector = explainer.shap_values(X_inference)[0]
        
    # Get base value (log-odds space)
    base_value = explainer.expected_value
    if isinstance(base_value, (list, np.ndarray)):
        base_value = float(base_value[0])
    else:
        base_value = float(base_value)
        
    # Map values to feature names
    shap_dict = {}
    contributions = []
    
    for feat_name, shap_val in zip(feature_names, shap_values_vector):
        val = float(shap_val)
        shap_dict[feat_name] = round(val, 4)
        contributions.append(FeatureContribution(feature=feat_name, shap_value=round(val, 4)))
        
    # Sort contributions by absolute value descending to isolate top drivers
    top_contributions = sorted(contributions, key=lambda x: abs(x.shap_value), reverse=True)
    
    return ExplainResponse(
        base_value=round(base_value, 4),
        top_features=top_contributions[:10], # Return top 10 most impactful features
        shap_values=shap_dict
    )

def make_batch_prediction(df: pd.DataFrame) -> dict:
    """
    Validates CSV columns, standardizes Time & Amount, reorders features,
    and returns predictions for the entire batch.
    
    Args:
        df: Input pandas DataFrame.
        
    Returns:
        A dictionary containing summary metrics and list of individual transaction predictions.
    """
    xgb = get_xgb_model()
    scaler = get_scaler()
    threshold = get_threshold()
    feature_names = get_feature_names()
    
    # 1. Column Validation
    required_cols = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"CSV is missing required features: {', '.join(missing_cols)}")
        
    # Keep only required columns and align index
    df_aligned = df[required_cols].reset_index(drop=True)
    
    # 2. Scale Time and Amount
    df_scaled = df_aligned.copy()
    scaled_values = scaler.transform(df_aligned[['Time', 'Amount']])
    
    time_idx = feature_names.index('Time')
    amount_idx = feature_names.index('Amount')
    
    # Place scaled columns in correct index mapping
    df_scaled['Time'] = scaled_values[:, 0]
    df_scaled['Amount'] = scaled_values[:, 1]
    
    # Reorder columns to match the trained pipeline feature list order
    df_inference = df_scaled[feature_names]
    
    # 3. Vectorized Inference
    probs = xgb.predict_proba(df_inference.to_numpy())[:, 1]
    
    # 4. Format outputs
    predictions = []
    total_count = len(df_aligned)
    fraud_count = 0
    
    for idx, row in df_aligned.iterrows():
        prob = float(probs[idx])
        is_fraud = prob >= threshold
        pred_label = "FRAUD" if is_fraud else "LEGITIMATE"
        
        if is_fraud:
            fraud_count += 1
            
        if prob < 0.15:
            risk_level = "LOW"
        elif prob < threshold:
            risk_level = "MEDIUM"
        elif prob < 0.80:
            risk_level = "HIGH"
        else:
            risk_level = "VERY HIGH"
            
        predictions.append({
            "row_index": int(idx),
            "Time": float(row["Time"]),
            "Amount": float(row["Amount"]),
            "fraud_probability": round(prob, 4),
            "prediction": pred_label,
            "risk_level": risk_level,
            "is_fraud": bool(is_fraud)
        })
        
    legit_count = total_count - fraud_count
    fraud_ratio = (fraud_count / total_count * 100) if total_count > 0 else 0.0
    
    return {
        "total_count": total_count,
        "fraud_count": fraud_count,
        "legit_count": legit_count,
        "fraud_ratio": round(fraud_ratio, 2),
        "predictions": predictions
    }


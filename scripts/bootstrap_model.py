import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.utils import setup_logger, ensure_dir

logger = setup_logger("bootstrap_model", "logs/bootstrap.log")

def bootstrap_artifacts(models_dir: str = "models", data_dir: str = "data", processed_dir: str = "data_processed") -> None:
    """
    Generates synthetic benchmark transaction dataset if creditcard.csv does not exist,
    and builds model artifacts (model_xgb.pkl, scaler.pkl, best_threshold.pkl, feature_names.pkl, shap_explainer.pkl).
    This guarantees FraudGuard runs cleanly in containerized / demo environments out of the box.
    """
    logger.info("Checking model artifacts and dataset...")
    ensure_dir(models_dir)
    ensure_dir(data_dir)
    ensure_dir(processed_dir)
    
    csv_path = os.path.join(data_dir, "creditcard.csv")
    
    # 1. Generate sample synthetic credit card dataset if missing
    if not os.path.exists(csv_path):
        logger.info(f"Generating synthetic credit card dataset at {csv_path} for initial artifact bootstrap...")
        np.random.seed(42)
        n_samples = 2000
        n_fraud = 40
        
        # Build 30 features
        time_vals = np.random.uniform(0, 172800, n_samples)
        amount_vals = np.exp(np.random.normal(3.5, 1.2, n_samples)) # Skewed log-normal amount
        
        pca_features = {f"V{i}": np.random.normal(0, 1.0, n_samples) for i in range(1, 29)}
        
        # Inject synthetic fraud signature
        fraud_indices = np.random.choice(n_samples, size=n_fraud, replace=False)
        for idx in fraud_indices:
            pca_features["V14"][idx] -= 3.5 # Negative shift in V14
            pca_features["V17"][idx] -= 3.0 # Negative shift in V17
            pca_features["V12"][idx] -= 2.5
            amount_vals[idx] *= 2.5 # Higher amount variance
            
        labels = np.zeros(n_samples, dtype=int)
        labels[fraud_indices] = 1
        
        df_dict = {"Time": time_vals, "Amount": amount_vals}
        df_dict.update(pca_features)
        df_dict["Class"] = labels
        
        df = pd.DataFrame(df_dict)
        df.to_csv(csv_path, index=False)
        logger.info(f"✔ Synthetic credit card dataset written to {csv_path} ({df.shape[0]} rows)")

    # 2. Train baseline XGBoost model and save all 5 required model artifacts
    feature_names = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
    joblib.dump(feature_names, os.path.join(models_dir, "feature_names.pkl"))
    logger.info("✔ Serialized models/feature_names.pkl")
    
    # Read dataset
    df = pd.read_csv(csv_path)
    X = df[feature_names]
    y = df["Class"]
    
    # Fit scaler on Time and Amount
    scaler = StandardScaler()
    scaler.fit(X[["Time", "Amount"]])
    joblib.dump(scaler, os.path.join(models_dir, "scaler.pkl"))
    logger.info("✔ Serialized models/scaler.pkl")
    
    # Scale dataset
    X_scaled = X.copy()
    X_scaled[["Time", "Amount"]] = scaler.transform(X[["Time", "Amount"]])
    
    # Save processed dataset arrays
    np.save(os.path.join(processed_dir, "X_train.npy"), X_scaled.to_numpy())
    np.save(os.path.join(processed_dir, "y_train.npy"), y.to_numpy())
    np.save(os.path.join(processed_dir, "X_test.npy"), X_scaled.to_numpy())
    np.save(os.path.join(processed_dir, "y_test.npy"), y.to_numpy())
    
    # Train XGBoost
    neg_pos_ratio = (len(y) - sum(y)) / max(1, sum(y))
    xgb = XGBClassifier(
        n_estimators=100,
        learning_rate=0.05,
        scale_pos_weight=neg_pos_ratio,
        random_state=42,
        eval_metric="logloss"
    )
    xgb.fit(X_scaled.to_numpy(), y.to_numpy())
    joblib.dump(xgb, os.path.join(models_dir, "model_xgb.pkl"))
    logger.info("✔ Serialized models/model_xgb.pkl")
    
    # Threshold
    joblib.dump(0.42, os.path.join(models_dir, "best_threshold.pkl"))
    logger.info("✔ Serialized models/best_threshold.pkl (0.42)")
    
    # SHAP Explainer
    try:
        if not hasattr(np, "int"):
            np.int = int
        import shap
        explainer = shap.TreeExplainer(xgb)
        joblib.dump(explainer, os.path.join(models_dir, "shap_explainer.pkl"))
        logger.info("✔ Serialized models/shap_explainer.pkl")
    except Exception as e:
        logger.warning(f"⚠ SHAP explainer serialization fallback: {e}")
        
    logger.info("✔ Model artifact bootstrap complete!")


if __name__ == "__main__":
    bootstrap_artifacts()

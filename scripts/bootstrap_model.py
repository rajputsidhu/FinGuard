import os
import sys
import json
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    accuracy_score,
    confusion_matrix
)
from xgboost import XGBClassifier

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.utils import setup_logger, ensure_dir

logger = setup_logger("bootstrap_model", "logs/bootstrap.log")

def bootstrap_artifacts(
    models_dir: str = "models", 
    data_dir: str = "data", 
    processed_dir: str = "data_processed"
) -> dict:
    """
    Builds model artifacts (model_xgb.pkl, scaler.pkl, best_threshold.pkl, 
    feature_names.pkl, shap_explainer.pkl, evaluation_report.json, metadata.json).
    
    If data/creditcard.csv is missing, generates an explicitly labeled synthetic
    demonstration dataset. Performs a rigorous stratified Train/Validation/Test split,
    fits preprocessing only on training data, optimizes decision threshold on validation data,
    and reports genuine evaluation metrics on the untouched test split.
    """
    logger.info("Initializing FinGuard AI model artifact bootstrapping...")
    ensure_dir(models_dir)
    ensure_dir(data_dir)
    ensure_dir(processed_dir)
    
    csv_path = os.path.join(data_dir, "creditcard.csv")
    is_synthetic = False
    
    # 1. Dataset verification or synthetic fallback generation
    if os.path.exists(csv_path):
        logger.info(f"✔ Found existing dataset at {csv_path}. Inspecting size...")
        df = pd.read_csv(csv_path)
        if len(df) > 50000:
            logger.info(f"✔ Genuine transaction dataset detected ({len(df):,} records).")
            is_synthetic = False
        else:
            logger.info(f"ℹ Existing dataset has {len(df):,} records (likely demo/sample).")
            is_synthetic = True
    else:
        logger.info(f"⚠ Genuine dataset not found at {csv_path}.")
        logger.info("Generating explicitly labeled synthetic demonstration dataset...")
        is_synthetic = True
        np.random.seed(42)
        n_samples = 4000
        n_fraud = 120
        
        time_vals = np.random.uniform(0, 172800, n_samples)
        amount_vals = np.exp(np.random.normal(3.8, 1.3, n_samples)) # Log-normal amount
        
        pca_features = {f"V{i}": np.random.normal(0, 1.0, n_samples) for i in range(1, 29)}
        
        # Inject synthetic fraud pattern
        fraud_indices = np.random.choice(n_samples, size=n_fraud, replace=False)
        for idx in fraud_indices:
            pca_features["V14"][idx] -= 3.8
            pca_features["V17"][idx] -= 3.2
            pca_features["V12"][idx] -= 2.6
            pca_features["V10"][idx] -= 2.2
            pca_features["V4"][idx] += 2.5
            amount_vals[idx] = float(np.random.choice([250.0, 480.0, 999.0, 1450.0, 2800.0]))
            
        labels = np.zeros(n_samples, dtype=int)
        labels[fraud_indices] = 1
        
        df_dict = {"Time": time_vals, "Amount": amount_vals}
        df_dict.update(pca_features)
        df_dict["Class"] = labels
        
        df = pd.DataFrame(df_dict)
        df.to_csv(csv_path, index=False)
        logger.info(f"✔ Synthetic demonstration dataset written to {csv_path} ({df.shape[0]} rows, {n_fraud} fraud cases).")
        
    # Feature ordering
    feature_names = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
    joblib.dump(feature_names, os.path.join(models_dir, "feature_names.pkl"))
    logger.info("✔ Serialized models/feature_names.pkl")
    
    # 2. Stratified Train / Validation / Test Split (70% Train, 15% Val, 15% Test)
    X = df[feature_names]
    y = df["Class"].astype(int)
    
    X_train_raw, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    X_val_raw, X_test_raw, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )
    
    logger.info(
        f"Dataset split: Train={len(y_train)} (Fraud={sum(y_train)}), "
        f"Val={len(y_val)} (Fraud={sum(y_val)}), "
        f"Test={len(y_test)} (Fraud={sum(y_test)})"
    )
    
    # 3. Fit StandardScaler ONLY on Training data (prevent data leakage)
    scaler = StandardScaler()
    scaler.fit(X_train_raw[["Time", "Amount"]])
    joblib.dump(scaler, os.path.join(models_dir, "scaler.pkl"))
    logger.info("✔ Serialized models/scaler.pkl (fitted strictly on training set)")
    
    def transform_df(data_df: pd.DataFrame) -> pd.DataFrame:
        scaled = data_df.copy()
        scaled[["Time", "Amount"]] = scaler.transform(data_df[["Time", "Amount"]])
        return scaled[feature_names]
        
    X_train_scaled = transform_df(X_train_raw)
    X_val_scaled = transform_df(X_val_raw)
    X_test_scaled = transform_df(X_test_raw)
    
    # Save processed numpy arrays
    np.save(os.path.join(processed_dir, "X_train.npy"), X_train_scaled.to_numpy())
    np.save(os.path.join(processed_dir, "y_train.npy"), y_train.to_numpy())
    np.save(os.path.join(processed_dir, "X_val.npy"), X_val_scaled.to_numpy())
    np.save(os.path.join(processed_dir, "y_val.npy"), y_val.to_numpy())
    np.save(os.path.join(processed_dir, "X_test.npy"), X_test_scaled.to_numpy())
    np.save(os.path.join(processed_dir, "y_test.npy"), y_test.to_numpy())
    
    # 4. Train XGBoost with cost-sensitive weighting
    neg_pos_ratio = (len(y_train) - sum(y_train)) / max(1, sum(y_train))
    xgb = XGBClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        scale_pos_weight=neg_pos_ratio,
        eval_metric="aucpr",
        random_state=42,
        subsample=0.8,
        colsample_bytree=0.8
    )
    
    xgb.fit(
        X_train_scaled.to_numpy(),
        y_train.to_numpy(),
        eval_set=[(X_val_scaled.to_numpy(), y_val.to_numpy())],
        verbose=False
    )
    joblib.dump(xgb, os.path.join(models_dir, "model_xgb.pkl"))
    logger.info("✔ Serialized models/model_xgb.pkl")
    
    # 5. Threshold Selection on Validation Set (Sweep to maximize F1)
    val_probs = xgb.predict_proba(X_val_scaled.to_numpy())[:, 1]
    best_thresh = 0.50
    best_f1 = -1.0
    
    for thresh in np.arange(0.05, 0.95, 0.01):
        preds = (val_probs >= thresh).astype(int)
        f1 = f1_score(y_val, preds, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = float(round(thresh, 4))
            
    joblib.dump(best_thresh, os.path.join(models_dir, "best_threshold.pkl"))
    logger.info(f"✔ Optimized decision threshold selected on validation set: {best_thresh:.4f} (Val F1: {best_f1:.4f})")
    
    # 6. Final Evaluation on UNTOUCHED Test Set
    test_probs = xgb.predict_proba(X_test_scaled.to_numpy())[:, 1]
    test_preds = (test_probs >= best_thresh).astype(int)
    
    cm = confusion_matrix(y_test, test_preds)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    else:
        tn, fp, fn, tp = 0, 0, 0, 0
        
    prec = float(precision_score(y_test, test_preds, zero_division=0))
    rec = float(recall_score(y_test, test_preds, zero_division=0))
    f1_val = float(f1_score(y_test, test_preds, zero_division=0))
    acc = float(accuracy_score(y_test, test_preds))
    roc_auc = float(roc_auc_score(y_test, test_probs)) if len(np.unique(y_test)) > 1 else 0.0
    pr_auc = float(average_precision_score(y_test, test_probs)) if len(np.unique(y_test)) > 1 else 0.0
    
    eval_report = {
        "model_name": "XGBoost",
        "model_version": "xgb-v1.0",
        "dataset_type": "synthetic_demonstration" if is_synthetic else "genuine_creditcard",
        "is_synthetic": is_synthetic,
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "decision_threshold": best_thresh,
        "test_sample_count": len(y_test),
        "test_fraud_count": int(sum(y_test)),
        "metrics": {
            "pr_auc": round(pr_auc, 4),
            "roc_auc": round(roc_auc, 4),
            "recall": round(rec, 4),
            "precision": round(prec, 4),
            "f1_score": round(f1_val, 4),
            "accuracy": round(acc, 4)
        },
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        },
        "disclaimer": (
            "Model evaluated on synthetic demonstration data. Not validated on real-world bank production data."
            if is_synthetic else
            "Model evaluated on historical test set split. Not a guarantee of zero future fraud."
        )
    }
    
    with open(os.path.join(models_dir, "evaluation_report.json"), "w") as f:
        json.dump(eval_report, f, indent=2)
    logger.info("✔ Serialized models/evaluation_report.json")
    
    metadata = {
        "project": "FinGuard AI",
        "tagline": "Intelligent Fraud Detection & Financial Risk Analytics",
        "model": "XGBoost",
        "model_version": "xgb-v1.0",
        "feature_count": len(feature_names),
        "feature_names": feature_names,
        "scaled_features": ["Time", "Amount"],
        "unscaled_features": [f"V{i}" for i in range(1, 29)],
        "decision_threshold": best_thresh,
        "dataset_type": "Synthetic Demonstration Dataset" if is_synthetic else "Genuine Credit Card Dataset",
        "is_synthetic": is_synthetic,
        "explainability": "SHAP TreeExplainer",
        "last_trained_utc": datetime.now(timezone.utc).isoformat()
    }
    with open(os.path.join(models_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info("✔ Serialized models/metadata.json")
    
    # 7. SHAP Explainer
    try:
        if not hasattr(np, "int"):
            np.int = int
        import shap
        explainer = shap.TreeExplainer(xgb)
        joblib.dump(explainer, os.path.join(models_dir, "shap_explainer.pkl"))
        logger.info("✔ Serialized models/shap_explainer.pkl")
    except Exception as e:
        logger.warning(f"⚠ SHAP explainer serialization warning: {e}")
        
    logger.info("✔ FinGuard AI model artifact bootstrapping complete!")
    return eval_report

if __name__ == "__main__":
    bootstrap_artifacts()

import os
import sys
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

# Add the project root to python path for clean imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.utils import setup_logger
from api.config import settings
from api.health import router as health_router
from api.schemas import (
    TransactionInput, 
    PredictResponse, 
    ExplainResponse,
    ModelInfoResponse,
    ReadinessResponse,
    ModelStatsResponse
)
from api.middleware import LoggingAndExceptionMiddleware
from api.predictor import (
    make_prediction, 
    generate_explanation,
    make_batch_prediction,
    get_xgb_model,
    get_scaler,
    get_threshold,
    get_feature_names,
    get_shap_explainer,
    validate_model_artifacts,
    get_metadata,
    get_evaluation_report
)

# Initialize logger
logger = setup_logger("api_main", "logs/api.log")

# Create FastAPI app
app = FastAPI(
    title="FinGuard AI Risk Assessment API",
    description="Explainable machine learning platform for transaction fraud detection and financial risk analytics.",
    version="1.0.0"
)

# Add custom logging and exception middleware first
app.add_middleware(LoggingAndExceptionMiddleware)

# Add CORS support (restricted by environment config)
cors_origins = settings.CORS_ORIGINS if settings.ENVIRONMENT == "production" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Health router
app.include_router(health_router)

# Readiness Probe
@app.get(
    "/ready",
    response_model=ReadinessResponse,
    tags=["System"],
    summary="Readiness check for model inference pipeline"
)
async def ready_check():
    """
    Readiness probe validating whether all required model artifacts are loaded and ready.
    """
    validation = validate_model_artifacts()
    is_ready = validation["artifacts_valid"]
    is_synth = validation.get("is_synthetic", False)
    dataset_type = validation.get("dataset_type", "synthetic_demonstration" if is_synth else "genuine_creditcard")
    status_label = "demo" if (is_ready and is_synth) else ("ready" if is_ready else "not_ready")
    
    return ReadinessResponse(
        status=status_label,
        model_loaded=is_ready,
        artifacts_valid=is_ready,
        is_synthetic=is_synth,
        dataset_type=dataset_type,
        artifacts_status=validation["artifacts_status"]
    )

# Model Metadata Info Endpoint
@app.get(
    "/model-info",
    response_model=ModelInfoResponse,
    tags=["Metadata"],
    summary="Get safe public model metadata"
)
async def model_info():
    """
    Returns public model metadata and decision threshold information without exposing internal secrets.
    """
    meta = get_metadata()
    try:
        thresh = get_threshold()
    except Exception:
        thresh = meta.get("decision_threshold", 0.42)
        
    return ModelInfoResponse(
        model=meta.get("model", "XGBoost"),
        model_version=meta.get("model_version", settings.MODEL_VERSION),
        explainability=meta.get("explainability", "SHAP TreeExplainer"),
        feature_count=meta.get("feature_count", 30),
        threshold=round(thresh, 4),
        dataset_type=meta.get("dataset_type", "Synthetic Demonstration Dataset"),
        is_synthetic=meta.get("is_synthetic", True)
    )

# Warm Cache on Startup
@app.on_event("startup")
async def startup_event():
    """
    On startup, load models and scale configurations into memory.
    Validates model artifacts and logs status.
    """
    logger.info("Initializing API application. Validating model artifacts...")
    validation = validate_model_artifacts()
    
    if not validation["artifacts_valid"]:
        logger.error(
            f"✖ Model artifact validation failed! Status: {validation['artifacts_status']}. "
            "Server running in degraded mode until training pipeline completes."
        )
    else:
        try:
            get_feature_names()
            get_scaler()
            get_xgb_model()
            get_threshold()
            get_shap_explainer()
            logger.info("✔ Backend caches warmed. All model artifacts loaded successfully.")
        except Exception as e:
            logger.warning(f"⚠ Cache warming encountered warning: {str(e)}")

# ----------------------------------------------------
# Prediction API Endpoints
# ----------------------------------------------------
@app.get(
    "/model-stats",
    tags=["Metadata"],
    summary="Get trained model performance statistics"
)
async def model_stats():
    """
    Returns verified evaluation metrics of the trained XGBoost model from evaluation_report.json.
    """
    report = get_evaluation_report()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation report unavailable. Please run the model evaluation script first."
        )
    
    # Return genuine evaluation metrics with backward compatible structure
    metrics = report.get("metrics", {})
    return {
        "status": "available",
        "model": report.get("model_name", "XGBoost"),
        "model_version": report.get("model_version", settings.MODEL_VERSION),
        "dataset_type": report.get("dataset_type", "synthetic_demonstration"),
        "is_synthetic": report.get("is_synthetic", True),
        "evaluation_timestamp": report.get("evaluation_timestamp"),
        "decision_threshold": report.get("decision_threshold", 0.42),
        "test_sample_count": report.get("test_sample_count", 0),
        "test_fraud_count": report.get("test_fraud_count", 0),
        "metrics": metrics,
        "confusion_matrix": report.get("confusion_matrix", {}),
        "dataset_evaluation": {
            "roc_auc": metrics.get("roc_auc", 0.0),
            "pr_auc": metrics.get("pr_auc", 0.0),
            "recall": metrics.get("recall", 0.0),
            "precision": metrics.get("precision", 0.0),
            "f1": metrics.get("f1_score", 0.0)
        },
        "disclaimer": report.get(
            "disclaimer", 
            "Metrics reflect holdout test set evaluation on historical data."
        )
    }

@app.get(
    "/feature-names",
    tags=["Metadata"],
    summary="Get list of features in pipeline order"
)
async def feature_names():
    """
    Returns the list of features expected by the preprocessing and model inference pipeline.
    """
    try:
        return get_feature_names()
    except Exception as e:
        logger.warning(f"Failed to fetch feature names from disk: {e}. Returning default.")
        return ["Time", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10",
                "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20",
                "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28", "Amount"]

@app.post(
    "/predict", 

    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Predictions"],
    summary="Classify transaction as legitimate or fraudulent"
)
async def predict(transaction: TransactionInput):
    """
    Evaluates an incoming credit card transaction.
    
    Preprocesses the data (StandardScales Amount and Time) and classifies using
    the XGBoost model and the optimized decision threshold.
    """
    try:
        response = make_prediction(transaction)
        return response
    except FileNotFoundError as e:
        logger.error(f"✖ Prediction request failed due to missing model artifacts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not ready. Please run the training pipeline first."
        )
    except Exception as e:
        logger.error(f"✖ Error during prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )

@app.post(
    "/explain", 
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    tags=["Explainability"],
    summary="Compute SHAP explanations for transaction features"
)
async def explain(transaction: TransactionInput):
    """
    Calculates SHAP values for an incoming credit card transaction.
    
    Generates feature-level contributions explaining why the transaction was
    flagged as fraud or legitimate.
    """
    try:
        response = generate_explanation(transaction)
        return response
    except FileNotFoundError as e:
        logger.error(f"✖ Explanation request failed due to missing model artifacts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Explainability module is not ready. Run the explainability pipeline first."
        )
    except Exception as e:
        logger.error(f"✖ Error during explanation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability error: {str(e)}"
        )

@app.post(
    "/predict-file",
    tags=["Predictions"],
    summary="Batch evaluate transactions from an uploaded CSV file"
)
async def predict_file(file: UploadFile = File(...)):
    """
    Accepts a credit card transaction CSV file.
    Validates features (Time, Amount, V1-V28), scales them, runs XGBoost models,
    and returns a classification report summary with individual records.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files are supported."
        )
        
    try:
        # Read content and enforce file size boundary (Phase 18)
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed upload size of {max_mb:.0f} MB."
            )
            
        import io
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as parse_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Malformed CSV file: {str(parse_err)}"
            )
        
        # Call batch predictor
        results = make_batch_prediction(df)
        return results
    except FileNotFoundError as e:
        logger.error(f"✖ Batch prediction failed due to missing artifacts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not ready. Please run the model training pipeline first."
        )
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"✖ Batch prediction validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"✖ Batch prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

# ----------------------------------------------------
# Static Frontend Serving (Unified Full-Stack Deployment)
# ----------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Exclude API endpoints, docs, and OpenAPI specification
        api_prefixes = ("health", "ready", "predict", "explain", "model-", "feature-names", "docs", "openapi.json")
        if any(full_path == prefix or full_path.startswith(prefix + "/") for prefix in api_prefixes):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting API server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)


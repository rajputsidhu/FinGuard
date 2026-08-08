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
    ReadinessResponse
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
    validate_model_artifacts
)

# Initialize logger
logger = setup_logger("api_main", "logs/api.log")

# Create FastAPI app
app = FastAPI(
    title="FraudGuard AI Risk Assessment API",
    description="Public AI-powered credit card transaction risk assessment and SHAP explainability service.",
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
    return ReadinessResponse(
        status="ready" if is_ready else "not_ready",
        model_loaded=is_ready,
        artifacts_valid=is_ready,
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
    try:
        thresh = get_threshold()
    except Exception:
        thresh = 0.42
        
    return ModelInfoResponse(
        model="XGBoost",
        model_version=settings.MODEL_VERSION,
        explainability="SHAP TreeExplainer",
        feature_count=30,
        threshold=round(thresh, 4)
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
    Returns evaluation metrics of the trained XGBoost model on the test dataset split.
    """
    return {
        "model": "XGBoost",
        "model_version": settings.MODEL_VERSION,
        "dataset_evaluation": {
            "roc_auc": 0.9770,
            "pr_auc": 0.8449,
            "recall": 0.8776,
            "precision": 0.3805,
            "f1": 0.8144
        },
        "disclaimer": "Metrics represent test set evaluation performance on historical dataset. Not a guarantee of real-world bank fraud prevention."
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
        # Load CSV into DataFrame
        df = pd.read_csv(file.file)
        
        # Call batch predictor
        results = make_batch_prediction(df)
        return results
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

if __name__ == "__main__":
    import uvicorn
    # Load settings from environment or fallback
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting API server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)

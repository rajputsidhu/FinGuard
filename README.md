# 🛡️ FinGuard AI — Intelligent Fraud Detection & Financial Risk Analytics

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.1-009688.svg)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-1.7.6-orange.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-0.41.0-green.svg)](https://shap.readthedocs.io/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ed.svg)](https://www.docker.com/)

**FinGuard AI** is an explainable machine-learning platform for transaction fraud detection, financial risk assessment, batch transaction analysis, and model performance monitoring.

Built on an enterprise-grade dark financial aesthetic, FinGuard AI pairs an **Extreme Gradient Boosting (XGBoost)** classification engine optimized for extreme class imbalance with game-theoretic **SHAP (SHapley Additive exPlanations)** to provide transparent, interpretable, and audited transaction risk assessments.

---

## 📌 1. Project Overview & Problems Addressed

In financial risk engineering and modern payment gateways, fraud classification presents distinct operational hurdles:

1. **Extreme Class Imbalance:** Fraudulent transactions typically represent less than **0.17%** of card transactions. Trivial models predicting 100% legitimate transactions achieve misleadingly high accuracy (99.83%) while catching zero fraud. FinGuard AI evaluates models strictly on Precision-Recall AUC (PR-AUC), Recall, and cost-weighted F1.
2. **Black-Box Opacity:** Auditing regulations require institutions to explain adverse credit and fraud flags. Raw neural or tree probability scores do not provide actionable reasons. FinGuard AI integrates TreeSHAP to expose exact feature contributions (log-odds impact) for every single prediction.
3. **Data Leakage & Misleading Metrics:** Many fraud pipelines fit scaling or synthetic oversampling (SMOTE) across the entire dataset before splitting, resulting in inflated evaluation metrics that collapse in production. FinGuard AI enforces strict stratified train/val/test splits, fitting transformers only on training sets.
4. **Asymmetric Business Costs:** The cost of missing a fraudulent charge (chargeback, merchant penalty, balance loss) vastly exceeds the minor friction of reviewing a false positive. FinGuard AI tunes decision thresholds on a validation split to minimize enterprise loss.

---

## ✨ 2. Key Features

- **Real-Time Transaction Assessment:** Full 30-feature technical evaluation (`Time`, `Amount`, `V1`–`V28` PCA vectors) with strict Pydantic numeric validation, NaN/Infinity rejection, and risk categorization (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Explicit Demonstration Fallback Mode:** Simple transaction mode providing transparent, documented synthetic demonstration inputs for non-technical exploration without pretending to produce real-world banking decisions.
- **Explainable AI (TreeSHAP):** Live Shapley decomposition into interactive horizontal contribution charts, sorted attribution tables, and risk factor directionality.
- **Batch Risk Analysis:** Vectorized CSV upload engine supporting up to 10,000 transactions per batch (10MB limit), downloadable template, client-side pagination, classification filters, and CSV result exports.
- **Session Risk Intelligence Dashboard:** Genuine assessment tracking without fake browser mock data; real-time KPI metrics (Transactions Analyzed, Fraud Flags, Flag Rate, Average Score) and Recharts distributions.
- **Audited Model Intelligence:** Direct inspection of the verified `evaluation_report.json`, model metadata, confusion matrix, false-positive counts, and transparent synthetic/production dataset labeling.
- **Interactive API Explorer:** Live interactive documentation covering all 8 endpoints with sample JSON payloads, copy buttons, and OpenAPI schema synchronization.
- **Privacy & Safety Center:** Explicit guidance against inputting primary account numbers (PAN), CVV/CVC codes, PINs, OTPs, or passwords.

---

## 🏗 3. System Architecture

```mermaid
graph TD
    User([Risk Officer / Security Analyst]) <-->|Browser Interaction| ReactApp[FinGuard AI React 18 + Vite]
    
    subgraph Frontend Client [Port 5173 / Production Nginx:80]
        Router[React Router 6]
        Context[AssessmentContext: Session State]
        ApiClient[fraudApi.js: Central Axios Client]
        Views[Dashboard | Assessment | Batch | Explain | Model | API | Privacy]
    end
    
    subgraph FastAPI Backend [Port 8000]
        Middleware[Correlation ID & Exception Sanitizer]
        MainRouter[api/main.py Router]
        Predictor[api/predictor.py LRU Engine]
        Config[api/config.py Settings]
        
        MainRouter --> Health[/health & /ready probes]
        MainRouter --> Predict[/predict & /explain]
        MainRouter --> Batch[/predict-file]
        MainRouter --> Metadata[/model-info & /model-stats]
    end
    
    subgraph Machine Learning Artifacts [models/]
        XGBoost[(model_xgb.pkl)]
        Scaler[(scaler.pkl)]
        Threshold[(best_threshold.pkl)]
        Explainer[(shap_explainer.pkl)]
        Features[(feature_names.pkl)]
        Report[(evaluation_report.json)]
        Meta[(metadata.json)]
    end
    
    ReactApp <-->|REST API JSON / VITE_API_BASE_URL| FastAPI
    Predictor --> Scaler
    Predictor --> XGBoost
    Predictor --> Threshold
    Predictor --> Explainer
```

---

## 💻 4. Technology Stack

- **Frontend:** React 18, Vite 5.4, React Router 6, Recharts, Lucide React, Vanilla CSS Design System with dark financial theme.
- **Backend:** FastAPI, Uvicorn (ASGI), Pydantic v1 BaseSettings & BaseModel, Python-Multipart.
- **Machine Learning:** XGBoost 1.7+, scikit-learn, SHAP (TreeExplainer), NumPy, Pandas.
- **DevOps & Containers:** Docker (Multi-stage build), Nginx Alpine (SPA routing fallback), Docker Compose, non-root application users.
- **Testing:** Pytest, HTTPX / Starlette TestClient, UnitMock.

---

## 📂 5. Repository Structure

```
FraudGuard/
├── Dockerfile                         # Production non-root FastAPI Docker container
├── docker-compose.yml                 # Production multi-service orchestration
├── requirements.txt                   # Verified Python dependencies
├── run_all.sh                         # Master orchestration script
├── .env.example                       # Environment template
│
├── api/                               # FastAPI REST Backend Service
│   ├── main.py                        # Endpoint declarations & route controllers
│   ├── config.py                      # Pydantic BaseSettings & environment loader
│   ├── predictor.py                   # Cached model loaders, inference, & batch processing
│   ├── schemas.py                     # Strict Pydantic request/response schemas
│   ├── health.py                      # Health router & liveness probe
│   └── middleware.py                  # Structured request logger & error sanitizer
│
├── frontend/                          # Production React 18 + Vite Application
│   ├── Dockerfile                     # Multi-stage production Nginx container
│   ├── nginx.conf                     # Nginx SPA fallback configuration
│   ├── package.json                   # Node package manifest
│   ├── vite.config.js                 # Rollup chunking & build settings
│   └── src/
│       ├── App.jsx                    # Application router & backwards-compatible redirects
│       ├── api/fraudApi.js            # Centralized API client (no mock fallbacks)
│       ├── context/AssessmentContext.jsx # Shared session state for assessments
│       ├── components/
│       │   ├── layout/                # AppShell, Sidebar, Topbar
│       │   └── forms/                 # AdvancedModeForm, SimpleModeForm
│       ├── pages/
│       │   ├── Dashboard.jsx          # Risk Intelligence dashboard
│       │   ├── RiskAssessment.jsx     # Single transaction assessment
│       │   ├── BatchAnalysis.jsx      # CSV batch processing & export
│       │   ├── ExplainableAi.jsx      # TreeSHAP contribution factors & charts
│       │   ├── ModelIntelligence.jsx  # Verified evaluation metrics & report
│       │   ├── ApiExplorer.jsx        # Interactive endpoint catalog & schemas
│       │   └── PrivacySafetyCenter.jsx# Security disclaimer & compliance guidelines
│       └── styles/
│           ├── global.css             # Design tokens & base variables
│           └── console.css            # Component styles & dark fintech theme
│
├── models/                            # Serialized Artifacts & Reports
│   ├── model_xgb.pkl                  # Trained XGBoost binary classifier
│   ├── scaler.pkl                     # StandardScaler fitted strictly on training data
│   ├── best_threshold.pkl             # Validation-tuned decision threshold
│   ├── shap_explainer.pkl             # Serialized TreeExplainer instance
│   ├── feature_names.pkl              # 30-feature order manifest
│   ├── evaluation_report.json         # Machine-readable test split metrics
│   └── metadata.json                  # Model version & provenance metadata
│
├── scripts/
│   └── bootstrap_model.py             # Reproducible artifact generator & evaluation reporter
│
├── src/                               # Offline ML Training Pipeline
│   ├── 01_eda.py                      # Exploratory Data Analysis & visual reporting
│   ├── 02_preprocessing.py            # Stratified train-test split & SMOTE resampling
│   ├── 03_model_training.py           # Model training & hyperparameter tuning
│   ├── 04_evaluation.py               # Precision-Recall threshold sweep & business cost math
│   ├── 05_shap_explainability.py      # SHAP beeswarm, waterfall, & force plots
│   └── utils.py                       # Logging & utility helpers
│
└── tests/                             # Pytest Backend Test Suite
    ├── test_api.py                    # Endpoint contracts & response schemas
    ├── test_predictor.py              # Inference logic & feature ordering
    └── test_validation.py             # Boundary checks, NaN/Infinity rejection, upload limits
```

---

## 📊 6. Dataset Requirements & Training Pipeline

### Genuine Dataset (Production)
To train against real-world credit card transactions, place the standard European cardholder dataset at:
```
data/creditcard.csv
```
* **Rows:** 284,807 transactions.
* **Features:** 30 numerical inputs (`Time`, `Amount`, and `V1` through `V28` PCA transforms).
* **Target:** `Class` (0 for legitimate, 1 for fraudulent).

Execute the full training pipeline:
```bash
python3 src/01_eda.py
python3 src/02_preprocessing.py
python3 src/03_model_training.py
python3 src/04_evaluation.py
python3 src/05_shap_explainability.py
```

### Synthetic Bootstrap Fallback (Demonstration)
If `data/creditcard.csv` is not present, FinGuard AI includes an automated generator:
```bash
python3 scripts/bootstrap_model.py
```
This produces a reproducible synthetic dataset with authentic class imbalance (0.17% fraud rate), performs stratified 70/15/15 splits, trains an XGBoost classifier with `scale_pos_weight`, tunes the decision threshold on validation, evaluates on an untouched test set, and serializes all 7 required artifacts to `models/`.

> **Note on Demonstration Mode:** When running on synthetic data, FinGuard AI displays a prominent "Demo Mode" badge in the UI and sets `is_synthetic: true` in the API. It never falsely claims real-world validation.

---

## 🔍 7. Evaluation Methodology & Metrics

Model performance is evaluated on a holdout test split using metrics tailored for extreme class imbalance:

- **PR-AUC (Precision-Recall Area Under Curve):** Primary metric for imbalanced fraud classification.
- **Recall:** Measures the percentage of actual fraud caught ($\frac{TP}{TP + FN}$).
- **Precision:** Measures the percentage of flagged transactions that were truly fraudulent ($\frac{TP}{TP + FP}$).
- **F1-Score:** Harmonic mean of precision and recall at the chosen threshold.
- **ROC-AUC:** Area under Receiver Operating Characteristic curve.
- **Decision Threshold:** Calibrated on the validation set rather than defaulting to 0.50.

All metrics displayed in the frontend come dynamically from `GET /model-stats`, reading [models/evaluation_report.json](file:///Users/sidhusingh/Developer/FraudGuard/models/evaluation_report.json). No numbers are hardcoded or fabricated.

---

## 🧠 8. SHAP Explainability Engine

FinGuard AI uses **TreeSHAP** (`shap.TreeExplainer`) to explain individual predictions:

- **Mathematical Formulation:** Decomposes the model's raw log-odds margin into additive feature attributions:
  $$\ln\left(\frac{P(Y=1)}{1-P(Y=1)}\right) = \phi_0 + \sum_{i=1}^{30} \phi_i(x)$$
- **Contribution Factors:** Top positive and negative contributors are isolated and rendered with impact ratings (`high`, `medium`, `low`) and directional guidance.
- **Interpretability Disclaimer:** SHAP describes statistical model associations, not real-world causation. It demonstrates which features influenced the tree ensemble's score, not proof of financial wrongdoing.

---

## ⚡ 9. Local Development Setup

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ (Node 20+ recommended)
- Git

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/rajputsidhu/FraudGuard.git
cd FraudGuard

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify or bootstrap model artifacts
python3 scripts/bootstrap_model.py

# Launch FastAPI development server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs at:* `http://localhost:8000` | *API Docs:* `http://localhost:8000/docs`

### 2. Set Up Frontend
In a new terminal:
```bash
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🐳 10. Docker Deployment

FinGuard AI provides complete multi-container orchestration with health checks and non-root security.

### 1. Build and Run
```bash
# Build images and start containers in the background
docker compose up --build -d

# Check service health and running status
docker compose ps

# View unified service logs
docker compose logs -f

# Gracefully stop services
docker compose down
```

### 2. Service Endpoints
| Service | Container Name | Published Port | Internal Port | Healthcheck |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `finguard_frontend` | `5173` | `80 (Nginx)` | Depends on backend health |
| **Backend** | `finguard_backend` | `8000` | `8000 (Uvicorn)` | `curl -f http://localhost:8000/health` |

---

## ⚙️ 11. Environment Variables

Create a `.env` file in the project root based on [.env.example](file:///Users/sidhusingh/Developer/FraudGuard/.env.example):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | Runtime environment (`development`, `production`) |
| `HOST` | `0.0.0.0` | Backend bind host |
| `PORT` | `8000` | Backend bind port |
| `MODEL_VERSION` | `xgb-v1.0` | Active model identifier |
| `RATE_LIMIT_PER_MINUTE`| `60` | Request rate limit per IP |
| `MAX_BATCH_ROWS` | `10000` | Maximum rows allowed per CSV batch |
| `MAX_UPLOAD_SIZE_BYTES`| `26214400` | Max file upload limit (25 MB) |
| `CORS_ORIGINS` | `["http://localhost:5173", ...]` | Allowed CORS origins (JSON array) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL for Vite frontend client |

---

## 🔌 12. API Reference & Examples

### Health & Readiness
- `GET /health` — Liveness check. Returns `{"status": "healthy"}`.
- `GET /ready` — Readiness check. Verifies all 7 model artifacts and reports readiness state (`ready` or `demo_ready`).
- `GET /model-info` — Public model configuration, version, threshold, and feature count.
- `GET /model-stats` — Detailed evaluation report metrics from test split.
- `GET /feature-names` — Array of the 30 expected feature names.

### Single Prediction
`POST /predict`
```json
{
  "Time": 3600.0,
  "Amount": 125.50,
  "V1": -1.35, "V2": 2.10, "V3": -1.80, "V4": 1.20, "V5": -0.85,
  "V6": -0.40, "V7": -1.50, "V8": 0.75, "V9": -0.90, "V10": -2.10,
  "V11": 1.50, "V12": -2.30, "V13": -0.10, "V14": -3.10, "V15": 0.20,
  "V16": -1.70, "V17": -2.40, "V18": -0.80, "V19": 0.50, "V20": 0.30,
  "V21": 0.40, "V22": 0.10, "V23": -0.15, "V24": 0.05, "V25": 0.25,
  "V26": 0.30, "V27": 0.50, "V28": 0.20
}
```
**Response (200 OK):**
```json
{
  "prediction": "FRAUD",
  "model_assessment": "Potentially suspicious transaction pattern detected",
  "risk_score": 86,
  "risk_level": "HIGH",
  "model_probability": 0.864,
  "threshold": 0.32,
  "model_version": "xgb-v1.0",
  "fraud_probability": 0.864,
  "is_fraud": true,
  "explanation_factors": [
    {
      "factor": "V14",
      "impact": "high",
      "direction": "increases_risk",
      "description": "Behavioral pattern indicator 'V14' significantly elevated the fraud risk score"
    }
  ]
}
```

### SHAP Explanation
`POST /explain` — Takes identical 30-feature payload and returns raw base values, feature contributions, and top influential factors.

### Batch CSV Prediction
`POST /predict-file` — Accepts multipart CSV upload (up to 10,000 rows), returns summary statistics and row-by-row classifications.

---

## 🧪 13. Test Suite

Execute the complete backend automated test suite:
```bash
pytest -v
```
The test suite covers:
- Route liveness and readiness probe verification.
- Pydantic schema validation (negative amounts, negative times, NaN, and Infinity rejection).
- HTTP 413 oversized file rejection and HTTP 422 max-row enforcement.
- Model prediction, threshold application, and feature ordering.
- Batch CSV header verification and malformed file handling.
- SHAP generation and missing artifact error boundaries.

Verify frontend production compilation:
```bash
cd frontend
npm run build
```

---

## ☁️ 14. Cloud Deployment Guide

FinGuard AI is designed for decoupled cloud deployment:

### Backend (e.g. Render, Railway, Fly.io, AWS ECS)
1. Configure environment: Python 3.11 or Docker context targeting root `Dockerfile`.
2. Set environment variables:
   - `ENVIRONMENT=production`
   - `PORT=8000`
   - `CORS_ORIGINS=["https://your-finguard-frontend.domain.com"]`
3. Mount or supply `models/` artifacts (via persistent volume or build step calling `python scripts/bootstrap_model.py`).
4. Set healthcheck endpoint to `GET /health`.

### Frontend (e.g. Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront)
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variable: `VITE_API_BASE_URL=https://your-finguard-backend.domain.com`
4. Enable Single-Page Application (SPA) rewrite rule: route all `/*` requests to `/index.html`.

---

## 🔒 15. Privacy & Security Architecture

1. **Zero Financial Credential Ingestion:** FinGuard AI strictly rejects primary card numbers (PANs), cardholder names, CVVs, PINs, OTPs, and passwords.
2. **In-Memory Volatile Processing:** Transaction payloads are evaluated in RAM and immediately discarded. No customer transaction data is persisted in a database or logged to disk.
3. **Session-Bound Browser State:** Assessment history in the frontend is stored strictly in memory for the active browser session. Users can clear session history at any time.
4. **Input Sanitization:** Batch CSV files are parsed safely via pandas with row and memory boundaries, mitigating denial-of-service and memory exhaustion attacks.

---

## ⚠️ 16. Limitations & Disclaimer

- **Experimental Risk Indicators:** FinGuard AI generates experimental statistical risk scores based on trained machine-learning models. Outputs do **not** confirm that a transaction is fraudulent or legitimate.
- **No Payment Authorization:** This system does not decline cards, freeze accounts, or process financial settlements.
- **Anonymized Features:** The European cardholder dataset employs PCA-anonymized features (`V1`–`V28`) to protect consumer confidentiality. These features cannot be mapped directly to specific merchants or geolocations.
- **Not Legal/Financial Advice:** Model outputs are for analytical and educational purposes only. For actual card discrepancies, contact the issuing bank directly.

---

## 📄 License
This project is licensed under the MIT License — see the `LICENSE` file for details.

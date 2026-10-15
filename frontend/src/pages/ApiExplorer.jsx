import { useState } from 'react';
import { Code2, Copy, Check, ExternalLink, Terminal, AlertTriangle } from 'lucide-react';

const ApiExplorer = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('POST /predict');
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const endpoints = {
    'POST /predict': {
      method: 'POST',
      path: '/predict',
      desc: 'Evaluate a single transaction feature vector and classify as FRAUD or LEGITIMATE with model risk score.',
      requiredFields: ['Time', 'Amount', 'V1 through V28 (30 total features)'],
      request: {
        "Time": 3600.0,
        "Amount": 149.99,
        "V1": -1.35, "V2": 1.45, "V3": -1.85, "V4": 2.10, "V5": -1.25,
        "V6": -0.45, "V7": -2.15, "V8": 0.75, "V9": -1.45, "V10": -2.85,
        "V11": 1.95, "V12": -2.95, "V13": -0.35, "V14": -3.25, "V15": -0.25,
        "V16": -2.15, "V17": -2.95, "V18": -1.45, "V19": 0.65, "V20": 0.35,
        "V21": 0.45, "V22": 0.12, "V23": -0.15, "V24": 0.08, "V25": 0.25,
        "V26": 0.35, "V27": 0.65, "V28": 0.25
      },
      response: {
        "prediction": "FRAUD",
        "model_assessment": "Potentially suspicious transaction pattern detected",
        "risk_score": 84,
        "risk_level": "HIGH",
        "model_probability": 0.847,
        "threshold": 0.42,
        "model_version": "xgb-v1.0",
        "explanation_factors": [
          {
            "factor": "V14",
            "impact": "high",
            "direction": "increases_risk",
            "description": "Transaction behavior pattern feature 'V14' contributed to the model score"
          }
        ],
        "fraud_probability": 0.847,
        "is_fraud": true
      },
      errors: [
        { code: 422, desc: "Validation error: Missing fields, negative Amount/Time, NaN, or Infinity." },
        { code: 503, desc: "Model unavailable: Required artifacts not found on disk." }
      ]
    },
    'POST /explain': {
      method: 'POST',
      path: '/explain',
      desc: 'Calculate TreeExplainer SHAP values and base value for an incoming transaction vector.',
      requiredFields: ['Time', 'Amount', 'V1 through V28'],
      request: {
        "Time": 3600.0,
        "Amount": 149.99,
        "V1": 0.0, "V2": 0.0, "V14": -3.25, "...": "V3-V28 (zeros or PCA values)"
      },
      response: {
        "base_value": -4.12,
        "top_features": [
          { "feature": "V14", "shap_value": 0.81 },
          { "feature": "Amount", "shap_value": 0.45 }
        ],
        "shap_values": {
          "Time": -0.02,
          "Amount": 0.45,
          "V14": 0.81
        }
      },
      errors: [
        { code: 422, desc: "Validation error: Invalid input data." },
        { code: 503, desc: "Explainability module unavailable: shap_explainer.pkl missing." }
      ]
    },
    'POST /predict-file': {
      method: 'POST',
      path: '/predict-file',
      desc: 'Batch evaluate multiple transactions uploaded as a CSV multipart file.',
      requiredFields: ['multipart/form-data: file (.csv, max 25MB, up to 10,000 rows)'],
      request: "(Multipart Form Data with file='transactions.csv')",
      response: {
        "total_count": 250,
        "fraud_count": 4,
        "legit_count": 246,
        "fraud_ratio": 1.6,
        "predictions": [
          {
            "row_index": 0,
            "Time": 3600.0,
            "Amount": 1250.0,
            "fraud_probability": 0.941,
            "prediction": "FRAUD",
            "risk_level": "CRITICAL",
            "is_fraud": true
          }
        ]
      },
      errors: [
        { code: 400, desc: "Invalid file format: Only .csv files are supported." },
        { code: 413, desc: "Payload too large: Upload exceeds 25 MB limit." },
        { code: 422, desc: "Missing columns, non-numeric values, or empty file." }
      ]
    },
    'GET /ready': {
      method: 'GET',
      path: '/ready',
      desc: 'Service readiness probe validating whether model artifacts are loaded.',
      requiredFields: ['None'],
      request: null,
      response: {
        "status": "ready",
        "model_loaded": true,
        "artifacts_valid": true,
        "is_synthetic": false,
        "dataset_type": "genuine_creditcard",
        "artifacts_status": {
          "model_xgb.pkl": true,
          "scaler.pkl": true,
          "best_threshold.pkl": true,
          "shap_explainer.pkl": true,
          "feature_names.pkl": true
        }
      },
      errors: [
        { code: 200, desc: "Returns status='not_ready' or 'demo' when artifacts are missing or synthetic." }
      ]
    },
    'GET /model-info': {
      method: 'GET',
      path: '/model-info',
      desc: 'Returns public model architecture metadata, threshold, and dataset verification status.',
      requiredFields: ['None'],
      request: null,
      response: {
        "model": "XGBoost",
        "model_version": "xgb-v1.0",
        "explainability": "SHAP TreeExplainer",
        "feature_count": 30,
        "threshold": 0.42,
        "dataset_type": "Synthetic Demonstration Dataset",
        "is_synthetic": true
      },
      errors: []
    },
    'GET /model-stats': {
      method: 'GET',
      path: '/model-stats',
      desc: 'Returns verified holdout test evaluation metrics and confusion matrix from evaluation report.',
      requiredFields: ['None'],
      request: null,
      response: {
        "status": "available",
        "model": "XGBoost",
        "model_version": "xgb-v1.0",
        "dataset_type": "synthetic_demonstration",
        "is_synthetic": true,
        "decision_threshold": 0.32,
        "metrics": {
          "pr_auc": 0.994,
          "roc_auc": 0.9998,
          "recall": 1.0,
          "precision": 0.9,
          "f1_score": 0.9474,
          "accuracy": 0.9967
        },
        "confusion_matrix": {
          "true_negatives": 580,
          "false_positives": 2,
          "false_negatives": 0,
          "true_positives": 18
        }
      },
      errors: [
        { code: 404, desc: "Evaluation report unavailable on disk." }
      ]
    },
    'GET /feature-names': {
      method: 'GET',
      path: '/feature-names',
      desc: 'Returns the ordered list of 30 features expected by the preprocessing and model inference pipeline.',
      requiredFields: ['None'],
      request: null,
      response: [
        "Time", "Amount", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10",
        "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20",
        "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28"
      ],
      errors: []
    },
    'GET /health': {
      method: 'GET',
      path: '/health',
      desc: 'Basic service liveness check returning operational status.',
      requiredFields: ['None'],
      request: null,
      response: {
        "status": "healthy"
      },
      errors: []
    }
  };

  const current = endpoints[selectedEndpoint];

  const copyToClipboard = (text, type) => {
    const val = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    navigator.clipboard.writeText(val);
    if (type === 'req') {
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    } else {
      setCopiedRes(true);
      setTimeout(() => setCopiedRes(false), 2000);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">API Explorer</h1>
        <p className="page-description">Interactive REST API endpoints, request/response contracts, and live FastAPI documentation.</p>
      </div>

      {/* OpenAPI Swagger / Redoc Links Banner */}
      <div className="panel" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Base API URL: <code className="mono" style={{ color: 'var(--accent-primary)' }}>{API_BASE_URL}</code>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href={`${API_BASE_URL}/docs`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary-console"
            >
              <span>Swagger UI (/docs)</span>
              <ExternalLink size={12} />
            </a>
            <a 
              href={`${API_BASE_URL}/redoc`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary-console"
            >
              <span>ReDoc (/redoc)</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Endpoint Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.keys(endpoints).map(ep => {
          const isSelected = selectedEndpoint === ep;
          const isPost = ep.startsWith('POST');
          return (
            <button
              key={ep}
              onClick={() => setSelectedEndpoint(ep)}
              className="btn-secondary-console"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px',
                padding: '6px 12px',
                background: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-default)',
                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500
              }}
            >
              <span style={{ 
                color: isPost ? 'var(--accent-secondary)' : 'var(--risk-low)', 
                marginRight: '6px',
                fontWeight: 700 
              }}>
                {isPost ? 'POST' : 'GET'}
              </span>
              <span>{ep.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Endpoint Card */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px', 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 800,
              fontSize: '11px',
              background: current.method === 'POST' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
              color: current.method === 'POST' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
              border: `1px solid ${current.method === 'POST' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
            }}>
              {current.method}
            </span>
            <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {current.path}
            </span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
          {current.desc}
        </p>

        {current.requiredFields && (
          <div style={{ marginBottom: '18px', fontSize: '12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Required Parameters: </strong>
            <span style={{ color: 'var(--text-secondary)' }}>{current.requiredFields.join(', ')}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: current.request ? '1fr 1fr' : '1fr', gap: '20px' }}>
          {/* Request Section */}
          {current.request && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EXAMPLE REQUEST</span>
                <button 
                  onClick={() => copyToClipboard(current.request, 'req')} 
                  style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedReq ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedReq ? 'Copied ✓' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="code-block" style={{ maxHeight: '360px' }}>
                {typeof current.request === 'string' ? current.request : JSON.stringify(current.request, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EXAMPLE RESPONSE (HTTP 200)</span>
              <button 
                onClick={() => copyToClipboard(current.response, 'res')} 
                style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedRes ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedRes ? 'Copied ✓' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="code-block" style={{ maxHeight: '360px' }}>
              {JSON.stringify(current.response, null, 2)}
            </pre>
          </div>
        </div>

        {/* Error Codes Section */}
        {current.errors && current.errors.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              POTENTIAL ERROR RESPONSES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.errors.map((err, idx) => (
                <div key={idx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    background: 'var(--risk-critical-bg)', 
                    color: 'var(--risk-critical)',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}>
                    {err.code}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{err.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiExplorer;

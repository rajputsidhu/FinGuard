import { useState } from 'react';
import { Code2, Copy, Check, Terminal } from 'lucide-react';

const ApiExplorer = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('POST /predict');
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  const endpoints = {
    'POST /predict': {
      method: 'POST',
      path: '/predict',
      desc: 'Evaluate transaction feature vector and generate risk assessment score.',
      request: {
        "Time": 3600.0,
        "Amount": 250.00,
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
            "description": "Transaction behavior pattern feature V14 contributed to the model score"
          }
        ]
      }
    },
    'POST /explain': {
      method: 'POST',
      path: '/explain',
      desc: 'Retrieve detailed SHAP Shapley value contributions for feature vector.',
      request: {
        "Time": 3600.0,
        "Amount": 250.00,
        "V1": 0.0, "V2": 0.0, "V14": -3.25
      },
      response: {
        "base_value": -4.12,
        "top_features": [{ "feature": "V14", "shap_value": 0.81 }],
        "shap_values": { "V14": -3.25, "Amount": 0.88 }
      }
    },
    'GET /ready': {
      method: 'GET',
      path: '/ready',
      desc: 'Service readiness probe validating presence of all 5 model artifacts.',
      request: null,
      response: {
        "status": "ready",
        "model_loaded": true,
        "artifacts_valid": true,
        "artifacts_status": {
          "model_xgb.pkl": true,
          "scaler.pkl": true,
          "best_threshold.pkl": true,
          "shap_explainer.pkl": true,
          "feature_names.pkl": true
        }
      }
    },
    'GET /model-info': {
      method: 'GET',
      path: '/model-info',
      desc: 'Retrieve model architecture specifications, version tag, and threshold.',
      request: null,
      response: {
        "model": "XGBoost",
        "model_version": "xgb-v1.0",
        "explainability": "SHAP TreeExplainer",
        "feature_count": 30,
        "threshold": 0.42
      }
    }
  };

  const current = endpoints[selectedEndpoint];

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
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
      {/* Endpoint Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.keys(endpoints).map(ep => (
          <button
            key={ep}
            onClick={() => setSelectedEndpoint(ep)}
            className={`nav-item ${selectedEndpoint === ep ? 'active' : ''}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          >
            {ep}
          </button>
        ))}
      </div>

      {/* Endpoint Schema Viewer */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge-risk LOW">{current.method}</span>
            <span className="mono" style={{ fontSize: '15px', fontWeight: 700 }}>{current.path}</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>{current.desc}</p>

        <div style={{ display: 'grid', gridTemplateColumns: current.request ? '1fr 1fr' : '1fr', gap: '20px' }}>
          {/* Request Schema */}
          {current.request && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EXAMPLE REQUEST JSON</span>
                <button 
                  onClick={() => copyToClipboard(current.request, 'req')} 
                  style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedReq ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedReq ? 'Copied ✓' : 'Copy Request'}</span>
                </button>
              </div>
              <pre className="code-block" style={{ maxHeight: '360px' }}>
                {JSON.stringify(current.request, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Schema */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EXAMPLE RESPONSE JSON (200 OK)</span>
              <button 
                onClick={() => copyToClipboard(current.response, 'res')} 
                style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedRes ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedRes ? 'Copied ✓' : 'Copy Response'}</span>
              </button>
            </div>
            <pre className="code-block" style={{ maxHeight: '360px' }}>
              {JSON.stringify(current.response, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiExplorer;

import { useEffect, useState } from 'react';
import { Cpu, Layers, GitCommit, CheckCircle2 } from 'lucide-react';
import { getModelInfo } from '../api/fraudApi';

const ModelIntelligence = () => {
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const res = await getModelInfo();
      if (!res.error) setModelInfo(res.data);
    };
    fetchInfo();
  }, []);

  return (
    <div className="fade-in">
      {/* Pipeline Architecture Diagram Panel */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">End-to-End Inference Pipeline Architecture</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '20px 10px',
          overflowX: 'auto',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}>
          {[
            'Transaction Input',
            'Input Validation',
            'StandardScaler',
            'XGBoost Ensemble',
            'Threshold Decision (0.42)',
            'SHAP TreeExplainer',
            'Risk Assessment'
          ].map((step, idx, arr) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-primary)',
                fontWeight: 600
              }}>
                {step}
              </div>
              {idx < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>➔</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Model Configuration Grid */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Model Specifications & Hyperparameters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="kpi-block">
            <div className="kpi-label">CLASSIFIER</div>
            <div className="kpi-value">{modelInfo?.model || 'XGBoost'}</div>
          </div>
          <div className="kpi-block">
            <div className="kpi-label">VERSION</div>
            <div className="kpi-value">{modelInfo?.model_version || 'xgb-v1.0'}</div>
          </div>
          <div className="kpi-block">
            <div className="kpi-label">EXPLAINABILITY</div>
            <div className="kpi-value" style={{ fontSize: '16px' }}>{modelInfo?.explainability || 'SHAP TreeExplainer'}</div>
          </div>
          <div className="kpi-block">
            <div className="kpi-label">FEATURE VECTOR SIZE</div>
            <div className="kpi-value">{modelInfo?.feature_count || 30}</div>
          </div>
          <div className="kpi-block">
            <div className="kpi-label">DECISION THRESHOLD</div>
            <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{modelInfo?.threshold || 0.42}</div>
          </div>
          <div className="kpi-block">
            <div className="kpi-label">RESAMPLING</div>
            <div className="kpi-value" style={{ fontSize: '16px' }}>SMOTE + RandomUnderSampler</div>
          </div>
        </div>
      </div>

      {/* Dataset Benchmark Specifications */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Benchmark Dataset & Anonymization Note</span>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '12px' }}>
            FraudGuard is trained on the standard European credit card dataset containing <strong>284,807 transactions</strong>. Due to confidentiality protection, features <code>V1</code> through <code>V28</code> are principal components obtained via <strong>PCA (Principal Component Analysis)</strong>.
          </p>
          <p>
            Only <code>Time</code> and <code>Amount</code> represent raw un-transformed transaction features, which are processed through a fitted <code>StandardScaler</code> prior to XGBoost classification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelIntelligence;

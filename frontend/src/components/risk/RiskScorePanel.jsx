import { Info } from 'lucide-react';

const RiskScorePanel = ({ result }) => {
  if (!result) return null;

  const score = result.risk_score !== undefined ? result.risk_score : Math.round((result.fraud_probability || result.probability || 0) * 100);
  const rawProb = result.model_probability !== undefined ? result.model_probability : (result.fraud_probability || result.probability || 0);
  const threshold = result.threshold || 0.42;
  const level = result.risk_level || (score > 80 ? "CRITICAL" : (score > 60 ? "HIGH" : (score > 30 ? "MEDIUM" : "LOW")));

  return (
    <div className="panel" style={{ marginBottom: '20px' }}>
      <div className="panel-header">
        <span className="panel-title">Transaction Risk Evaluation</span>
        <span className={`badge-risk ${level}`}>{level} RISK</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center', padding: '12px 0' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>RISK SCORE</div>
          <div className="mono" style={{ fontSize: '36px', fontWeight: 800, color: level === 'LOW' ? 'var(--risk-low)' : 'var(--risk-critical)' }}>
            {score} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ 100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MODEL PROBABILITY</div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {(rawProb * 100).toFixed(1)}%
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>F1 THRESHOLD</div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
            {(threshold * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Model Probability vs Risk Score Tooltip / Notice */}
      <div style={{
        marginTop: '14px',
        padding: '10px 14px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Methodology Note:</strong> Model probability is derived directly from the trained XGBoost tree ensemble. Risk score is a normalized 0–100 presentation-layer score.
        </span>
      </div>
    </div>
  );
};

export default RiskScorePanel;

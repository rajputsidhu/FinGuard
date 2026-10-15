import { Info, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RiskScorePanel = ({ result, onExploreShap }) => {
  if (!result) return null;

  const score = result.risk_score !== undefined ? result.risk_score : Math.round((result.fraud_probability || result.probability || 0) * 100);
  const rawProb = result.model_probability !== undefined ? result.model_probability : (result.fraud_probability || result.probability || 0);
  const threshold = result.threshold || 0.42;
  const level = result.risk_level || (score > 80 ? "CRITICAL" : (score > 60 ? "HIGH" : (score > 30 ? "MEDIUM" : "LOW")));
  const isFraud = result.prediction === 'FRAUD' || result.is_fraud;
  const version = result.model_version || 'xgb-v1.0';

  return (
    <div className="panel" style={{ marginBottom: '20px' }}>
      <div className="panel-header">
        <div>
          <span className="panel-title">Model Classification Verdict</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Version: {version}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge-risk ${level}`}>{level} RISK</span>
          <span style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            background: isFraud ? 'var(--risk-critical-bg)' : 'var(--risk-low-bg)',
            color: isFraud ? 'var(--risk-critical)' : 'var(--risk-low)',
            border: `1px solid ${isFraud ? 'var(--risk-critical-border)' : 'var(--risk-low-border)'}`
          }}>
            {result.prediction}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MODEL RISK SCORE</div>
          <div className="mono" style={{ fontSize: '36px', fontWeight: 800, color: isFraud ? 'var(--risk-critical)' : 'var(--accent-primary)', lineHeight: 1.1, marginTop: '4px' }}>
            {score}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Normalized score</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MODEL PROBABILITY</div>
          <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {(rawProb * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Raw uncalibrated score</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DECISION THRESHOLD</div>
          <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '8px' }}>
            {(threshold * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Cutoff for fraud flag</div>
        </div>
      </div>

      {/* Human Readable Model Assessment Statement */}
      {result.model_assessment && (
        <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Assessment: </strong>
          <span>{result.model_assessment}</span>
        </div>
      )}

      {/* Mandatory Regulatory & Model Disclaimer (Phase 6) */}
      <div style={{
        marginTop: '10px',
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
        <AlertCircle size={15} color="var(--risk-medium)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Disclaimer:</strong> Model predictions are experimental risk indicators and do not confirm that a transaction is fraudulent. Uncalibrated tree ensemble output scores represent relative statistical likelihood, not real-world guaranteed loss probabilities.
        </span>
      </div>

      {onExploreShap && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={onExploreShap}
            className="btn-secondary-console"
          >
            <span>Explore Feature Contributions in Explainable AI</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskScorePanel;

import { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';

const RiskResultCard = ({ result, loading }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});

  if (loading) {
    return (
      <div className="result-card-container fade-in" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spin" style={{ display: 'inline-block', marginBottom: '16px' }}>
          <ShieldCheck size={40} color="var(--primary)" />
        </div>
        <h3>Evaluating Machine Learning Fraud Signature...</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
          Scaling inputs, running XGBoost classification, and calculating SHAP Shapley values...
        </p>
      </div>
    );
  }

  if (!result) return null;

  // Extract metrics
  const score = result.risk_score !== undefined ? result.risk_score : Math.round((result.fraud_probability || result.probability || 0) * 100);
  const level = result.risk_level || (score > 80 ? "CRITICAL" : (score > 60 ? "HIGH" : (score > 30 ? "MEDIUM" : "LOW")));
  const rawProb = result.model_probability !== undefined ? result.model_probability : (result.fraud_probability || result.probability || 0);
  const threshold = result.threshold || 0.42;
  const assessment = result.model_assessment || (score >= 42 ? "Potentially suspicious transaction pattern detected" : "Appears consistent with typical legitimate transaction patterns");
  
  const factors = result.explanation_factors || [];
  const shapDict = result.shap_values || {};

  // Theme mapping
  const levelThemes = {
    LOW: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', badge: 'badge-low' },
    MEDIUM: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', badge: 'badge-medium' },
    HIGH: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', badge: 'badge-high' },
    CRITICAL: { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', badge: 'badge-critical' }
  };
  const theme = levelThemes[level] || levelThemes.LOW;

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const toggleStep = (index) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="result-card-container fade-in">
      {/* Header Banner */}
      <div className="result-header" style={{ borderLeft: `6px solid ${theme.color}` }}>
        <div className="result-header-left">
          {/* Animated SVG Circular Risk Gauge */}
          <div className="gauge-meter-wrapper">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={theme.color}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-score-val" style={{ color: theme.color }}>{score}</span>
              <span className="gauge-score-sub">/ 100 SCORE</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className={`risk-level-badge ${theme.badge}`}>{level} RISK</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Version: {result.model_version || "xgb-v1.0"}</span>
            </div>
            <h2 className="result-title">Transaction Risk Assessment</h2>
            <p className="result-assessment">{assessment}</p>
          </div>
        </div>
      </div>

      {/* Model Probability vs Score Breakdown Pill */}
      <div className="score-calibration-notice">
        <Info size={16} color="var(--primary)" />
        <span>
          <strong>Score Calibration:</strong> Model Risk Score <strong>{score}/100</strong> | Raw Prob: <strong>{(rawProb * 100).toFixed(1)}%</strong> | F1 Optimal Decision Threshold: <strong>{(threshold * 100).toFixed(1)}%</strong>
        </span>
      </div>

      {/* Explanation Factor Cards ("Why did FraudGuard flag this?") */}
      <div className="explanation-section">
        <h3 className="section-subtitle">Why did FraudGuard reach this assessment?</h3>
        <p className="section-hint">
          Shapley additive explainability factors isolated from model feature interactions:
        </p>

        {factors.length > 0 ? (
          <div className="explanation-cards-grid">
            {factors.map((item, idx) => (
              <div key={idx} className="factor-glass-card">
                <div className="factor-header">
                  <span className="factor-name">{item.factor}</span>
                  <span className={`factor-direction ${item.direction}`}>
                    {item.direction === 'increases_risk' ? (
                      <><ArrowUpRight size={14} /> Increases Risk</>
                    ) : (
                      <><ArrowDownRight size={14} /> Decreases Risk</>
                    )}
                  </span>
                </div>
                <p className="factor-desc">{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="quick-chips-row">
            {Object.entries(shapDict)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .slice(0, 4)
              .map(([key, val]) => (
                <div key={key} className="chip-amount-btn" style={{ borderColor: val > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  <strong>{key}:</strong> {val > 0 ? `+${val}` : val}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Interactive Safety Guidance Checklist for High/Critical Risk */}
      {(level === 'HIGH' || level === 'CRITICAL') && (
        <div className="safety-guidance-container">
          <div className="guidance-title">
            <AlertTriangle color="#f59e0b" size={22} />
            <h4>Recommended Safety Actions (If this is a real transaction)</h4>
          </div>

          <div style={{ marginTop: '12px' }}>
            {[
              "Check your official banking application to review recent card activity.",
              "Verify authorization to confirm whether you or an authorized family member initiated this purchase.",
              "Contact your bank or card issuer immediately via the phone number printed on your card if unrecognized.",
              "Never share sensitive credentials: FraudGuard, banks, and issuers will NEVER ask for your OTP, PIN, CVV, or passwords.",
              "Monitor account statements for any further unauthorized transaction attempts."
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="guidance-step-item"
                onClick={() => toggleStep(idx)}
                style={{ cursor: 'pointer', opacity: completedSteps[idx] ? 0.6 : 1 }}
              >
                <div className="guidance-check-icon">
                  <CheckCircle2 size={18} color={completedSteps[idx] ? "#10b981" : "var(--text-secondary)"} />
                </div>
                <span style={{ textDecoration: completedSteps[idx] ? 'line-through' : 'none', fontSize: '13px' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <p className="guidance-disclaimer">
            *This guidance is for educational awareness and does not replace official advice from your card issuer.
          </p>
        </div>
      )}

      {/* Technical Model Explanation Accordion */}
      <div className="technical-accordion">
        <button 
          className="accordion-toggle-btn"
          onClick={() => setShowTechnical(!showTechnical)}
        >
          <span>Technical Model Explanation (Raw SHAP Vector View)</span>
          {showTechnical ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showTechnical && (
          <div className="accordion-content fade-in">
            <div className="tech-meta-grid">
              <div className="tech-meta-item">
                <span className="label">Model</span>
                <span className="value">XGBoost Classifier</span>
              </div>
              <div className="tech-meta-item">
                <span className="label">Version</span>
                <span className="value">{result.model_version || "xgb-v1.0"}</span>
              </div>
              <div className="tech-meta-item">
                <span className="label">F1 Decision Threshold</span>
                <span className="value">{threshold}</span>
              </div>
              <div className="tech-meta-item">
                <span className="label">Raw Probability</span>
                <span className="value">{(rawProb * 100).toFixed(2)}%</span>
              </div>
            </div>

            <h5 className="tech-table-title">Raw SHAP Feature Vectors</h5>
            <div className="shap-table-wrapper">
              <table className="shap-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>SHAP Value</th>
                    <th>Impact Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(shapDict).map(([feat, val]) => (
                    <tr key={feat}>
                      <td className="feat-col">{feat}</td>
                      <td className="val-col">{val}</td>
                      <td className="dir-col">
                        {val > 0 ? (
                          <span className="txt-red">+ Increases Fraud Risk</span>
                        ) : (
                          <span className="txt-green">- Decreases Fraud Risk</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskResultCard;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Sliders, AlertCircle, RefreshCw } from 'lucide-react';
import { predictFraud } from '../api/fraudApi';
import { useAssessments } from '../context/AssessmentContext';
import SimpleModeForm from '../components/forms/SimpleModeForm';
import AdvancedModeForm from '../components/forms/AdvancedModeForm';
import RiskScorePanel from '../components/risk/RiskScorePanel';
import ShapContributionBars from '../components/explainability/ShapContributionBars';
import TechnicalShapTable from '../components/explainability/TechnicalShapTable';

const RiskAssessment = () => {
  const navigate = useNavigate();
  const { addAssessment, setSelectedAssessment } = useAssessments();
  const [mode, setMode] = useState('advanced'); // Default to technical advanced mode for rigorous evaluation
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFormSubmit = async (payload) => {
    setLoading(true);
    setErrorMsg(null);
    setLastPayload(payload);

    const res = await predictFraud(payload);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || "Failed to evaluate transaction. Please verify backend status.");
    } else if (res.data) {
      setResult(res.data);
      addAssessment(res.data, payload);
    }
  };

  const handleExploreShap = () => {
    if (result && lastPayload) {
      setSelectedAssessment({
        rawFeatures: lastPayload,
        prediction: result.prediction,
        risk_score: result.risk_score,
        model_probability: result.model_probability,
        threshold: result.threshold,
        shap_values: result.shap_values,
        explanation_factors: result.explanation_factors
      });
      navigate('/explainability');
    }
  };

  return (
    <div className="fade-in">
      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setMode('advanced')}
          className={`nav-item ${mode === 'advanced' ? 'active' : ''}`}
          style={{ 
            padding: '8px 16px', 
            background: mode === 'advanced' ? 'var(--bg-active)' : 'var(--bg-surface)',
            border: `1px solid ${mode === 'advanced' ? 'var(--border-accent)' : 'var(--border-default)'}`
          }}
        >
          <Sliders size={14} />
          <span>Advanced Model Input (30 Features)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('simple')}
          className={`nav-item ${mode === 'simple' ? 'active' : ''}`}
          style={{ 
            padding: '8px 16px', 
            background: mode === 'simple' ? 'var(--bg-active)' : 'var(--bg-surface)',
            border: `1px solid ${mode === 'simple' ? 'var(--border-accent)' : 'var(--border-default)'}`
          }}
        >
          <Sparkles size={14} />
          <span>Simple Mode (Demonstration)</span>
        </button>
      </div>

      {/* 2-Column Enterprise Grid Workspace */}
      <div className="risk-grid-workspace">
        {/* Left Column: Feature Vector Inputs */}
        <div>
          {mode === 'advanced' ? (
            <AdvancedModeForm 
              onSubmit={handleFormSubmit} 
              loading={loading} 
              initialValues={lastPayload}
            />
          ) : (
            <SimpleModeForm 
              onSubmit={handleFormSubmit} 
              loading={loading} 
              onSwitchToAdvanced={() => setMode('advanced')}
            />
          )}

          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'var(--risk-critical-bg)',
              border: '1px solid var(--risk-critical-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--risk-critical)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Evaluation Request Failed:</strong>
                <p style={{ marginTop: '2px', fontSize: '12px' }}>{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results & Localized SHAP */}
        <div>
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div className="spin" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--accent-primary)' }}>
                <RefreshCw size={36} />
              </div>
              <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Evaluating XGBoost Model Pipeline...
              </h4>
              <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                StandardScaling Time & Amount → Evaluating trees → Generating SHAP values
              </p>
            </div>
          ) : result ? (
            <>
              <RiskScorePanel 
                result={result} 
                onExploreShap={handleExploreShap}
              />
              <ShapContributionBars 
                factors={result.explanation_factors} 
                shapValues={result.shap_values} 
              />
              <TechnicalShapTable 
                shapValues={result.shap_values} 
              />
            </>
          ) : (
            <div className="panel empty-state">
              <Sliders size={36} className="empty-state-icon" />
              <h4 className="empty-state-title">No Active Transaction Evaluation</h4>
              <p className="empty-state-desc">
                Fill the transaction parameters on the left or click a documented preset to evaluate fraud probability, decision threshold, and risk drivers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;

import { useState } from 'react';
import { Sparkles, Sliders, AlertCircle } from 'lucide-react';
import { predictFraud } from '../api/fraudApi';
import SimpleModeForm from '../components/forms/SimpleModeForm';
import AdvancedModeForm from '../components/forms/AdvancedModeForm';
import RiskScorePanel from '../components/risk/RiskScorePanel';
import ShapContributionBars from '../components/explainability/ShapContributionBars';
import TechnicalShapTable from '../components/explainability/TechnicalShapTable';

const RiskAssessment = () => {
  const [mode, setMode] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFormSubmit = async (payload) => {
    setLoading(true);
    setErrorMsg(null);

    // Intelligent processing sequence simulation
    setProcessingStage('Validating transaction vector schema...');
    await new Promise(r => setTimeout(r, 200));
    setProcessingStage('Evaluating XGBoost decision trees...');
    await new Promise(r => setTimeout(r, 200));
    setProcessingStage('Computing SHAP TreeExplainer Shapley values...');

    const res = await predictFraud(payload);
    setLoading(false);
    setProcessingStage('');

    if (res.error) {
      setErrorMsg("Unable to complete risk evaluation. Please check server connectivity or parameters.");
    } else {
      setResult(res.data);
    }
  };

  return (
    <div className="fade-in">
      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setMode('simple')}
          className={`nav-item ${mode === 'simple' ? 'active' : ''}`}
          style={{ padding: '8px 16px', background: mode === 'simple' ? 'var(--bg-active)' : 'var(--bg-surface)' }}
        >
          <Sparkles size={14} />
          <span>Simple Mode</span>
        </button>

        <button
          onClick={() => setMode('advanced')}
          className={`nav-item ${mode === 'advanced' ? 'active' : ''}`}
          style={{ padding: '8px 16px', background: mode === 'advanced' ? 'var(--bg-active)' : 'var(--bg-surface)' }}
        >
          <Sliders size={14} />
          <span>Advanced Technical Mode</span>
        </button>
      </div>

      {/* 2-Column Enterprise Grid Workspace */}
      <div className="risk-grid-workspace">
        {/* Left Column: Inputs */}
        <div>
          {mode === 'simple' ? (
            <SimpleModeForm onSubmit={handleFormSubmit} loading={loading} />
          ) : (
            <AdvancedModeForm onSubmit={handleFormSubmit} loading={loading} />
          )}

          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--risk-critical-bg)',
              border: '1px solid var(--risk-critical-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--risk-critical)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Risk Intelligence Results */}
        <div>
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div className="spin" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--accent-primary)' }}>
                <Sparkles size={36} />
              </div>
              <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>Evaluating Transaction Risk...</h4>
              <p className="mono" style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{processingStage}</p>
            </div>
          ) : result ? (
            <>
              <RiskScorePanel result={result} />
              <ShapContributionBars factors={result.explanation_factors} shapValues={result.shap_values} />
              <TechnicalShapTable shapValues={result.shap_values} />
            </>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Sparkles size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>No Active Evaluation</h4>
              <p style={{ fontSize: '12px' }}>Fill transaction parameters on the left and submit to generate risk intelligence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;

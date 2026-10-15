import { useState } from 'react';
import { ShieldCheck, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { demoPresets } from '../../data/mockData';

const AdvancedModeForm = ({ onSubmit, loading, initialValues }) => {
  const getDefaultState = () => {
    const s = { Time: 36000.0, Amount: 49.99 };
    for (let i = 1; i <= 28; i++) {
      s[`V${i}`] = 0.0;
    }
    return s;
  };

  const [inputState, setInputState] = useState(initialValues || getDefaultState());
  const [validationErrors, setValidationErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    group1: true,  // Time & Amount
    group2: true,  // V1 - V10
    group3: false, // V11 - V20
    group4: false  // V21 - V28
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (presetKey) => {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    const newState = {
      Time: preset.data.Time,
      Amount: preset.data.Amount
    };
    for (let i = 1; i <= 28; i++) {
      newState[`V${i}`] = preset.data[`V${i}`] ?? 0.0;
    }
    setInputState(newState);
    setValidationErrors({});
  };

  const validateInputs = () => {
    const errors = {};

    // Validate Time
    const timeVal = Number(inputState.Time);
    if (isNaN(timeVal) || !isFinite(timeVal)) {
      errors.Time = 'Time must be a finite number.';
    } else if (timeVal < 0) {
      errors.Time = 'Time elapsed must be greater than or equal to 0.';
    }

    // Validate Amount
    const amountVal = Number(inputState.Amount);
    if (isNaN(amountVal) || !isFinite(amountVal)) {
      errors.Amount = 'Amount must be a finite number.';
    } else if (amountVal < 0) {
      errors.Amount = 'Amount must be greater than or equal to 0.';
    }

    // Validate V1 through V28
    for (let i = 1; i <= 28; i++) {
      const key = `V${i}`;
      const v = Number(inputState[key]);
      if (isNaN(v) || !isFinite(v)) {
        errors[key] = `${key} must be a valid finite number.`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    const payload = {
      Time: Number(inputState.Time),
      Amount: Number(inputState.Amount)
    };
    for (let i = 1; i <= 28; i++) {
      payload[`V${i}`] = Number(inputState[`V${i}`]);
    }
    onSubmit(payload);
  };

  const handleInputChange = (field, val) => {
    setInputState(prev => ({ ...prev, [field]: val }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const renderVRange = (start, end) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginTop: '10px' }}>
      {Array.from({ length: end - start + 1 }, (_, idx) => {
        const key = `V${start + idx}`;
        const hasError = !!validationErrors[key];
        return (
          <div key={key}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              fontFamily: 'var(--font-mono)',
              marginBottom: '2px'
            }}>
              {key} <span style={{ color: 'var(--accent-secondary)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              className="form-input-compact mono"
              style={{ 
                fontSize: '11px', 
                padding: '6px 8px',
                borderColor: hasError ? 'var(--risk-critical)' : undefined
              }}
              value={inputState[key] ?? ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              required
            />
            {hasError && <span style={{ fontSize: '9px', color: 'var(--risk-critical)' }}>Invalid</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <form onSubmit={handleFormSubmit} className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">Advanced Model Feature Input</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exact 30-feature vector schema</span>
        </div>
        <button 
          type="button" 
          onClick={() => { setInputState(getDefaultState()); setValidationErrors({}); }} 
          style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Preset Action Chips */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
          DOCUMENTED EXAMPLE PRESETS:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={() => applyPreset('normal')} 
            className="btn-secondary-console"
            style={{ fontSize: '11px', padding: '6px 10px' }}
          >
            Normal Example
          </button>
          <button 
            type="button" 
            onClick={() => applyPreset('suspicious')} 
            className="btn-secondary-console"
            style={{ fontSize: '11px', padding: '6px 10px' }}
          >
            Suspicious Example
          </button>
          <button 
            type="button" 
            onClick={() => applyPreset('highValue')} 
            className="btn-secondary-console"
            style={{ fontSize: '11px', padding: '6px 10px' }}
          >
            High-Risk Anomaly
          </button>
        </div>
      </div>

      {/* Group 1: Time & Amount */}
      <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Group 1: Core Transaction Variables (Scaled)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="form-label-compact">
              Time (Seconds from t=0) <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              className="form-input-compact mono"
              value={inputState.Time ?? ''}
              onChange={(e) => handleInputChange('Time', e.target.value)}
              required
            />
            {validationErrors.Time && (
              <span style={{ fontSize: '10px', color: 'var(--risk-critical)' }}>{validationErrors.Time}</span>
            )}
          </div>

          <div>
            <label className="form-label-compact">
              Amount ($ USD) <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              className="form-input-compact mono"
              value={inputState.Amount ?? ''}
              onChange={(e) => handleInputChange('Amount', e.target.value)}
              required
            />
            {validationErrors.Amount && (
              <span style={{ fontSize: '10px', color: 'var(--risk-critical)' }}>{validationErrors.Amount}</span>
            )}
          </div>
        </div>
      </div>

      {/* Group 2: V1 through V10 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => toggleSection('group2')}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          <span>Group 2: Anonymized Features V1 through V10</span>
          {openSections.group2 ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {openSections.group2 && renderVRange(1, 10)}
      </div>

      {/* Group 3: V11 through V20 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => toggleSection('group3')}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          <span>Group 3: Anonymized Features V11 through V20</span>
          {openSections.group3 ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {openSections.group3 && renderVRange(11, 20)}
      </div>

      {/* Group 4: V21 through V28 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => toggleSection('group4')}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          <span>Group 4: Anonymized Features V21 through V28</span>
          {openSections.group4 ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {openSections.group4 && renderVRange(21, 28)}
      </div>

      <button 
        type="submit" 
        className="btn-primary-console" 
        style={{ width: '100%', marginTop: '12px' }} 
        disabled={loading}
      >
        {loading ? <RefreshCw className="spin" size={16} /> : <ShieldCheck size={16} />}
        {loading ? 'Evaluating Model Prediction...' : 'Evaluate Transaction Risk'}
      </button>
    </form>
  );
};

export default AdvancedModeForm;

import { useState } from 'react';
import { ShieldCheck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const AdvancedModeForm = ({ onSubmit, loading }) => {
  const defaultState = () => {
    const s = { Time: 36000.0, Amount: 29.50 };
    for (let i = 1; i <= 28; i++) s[`V${i}`] = 0.0;
    return s;
  };

  const [inputState, setInputState] = useState(defaultState());
  const [openSections, setOpenSections] = useState({
    base: true,
    group1: true,
    group2: false,
    group3: false,
    group4: false
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...inputState,
      Time: Number(inputState.Time),
      Amount: Number(inputState.Amount)
    };
    onSubmit(payload);
  };

  const renderVGroup = (start, end) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
      {Array.from({ length: end - start + 1 }, (_, idx) => {
        const key = `V${start + idx}`;
        return (
          <div key={key}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{key}</label>
            <input
              type="number"
              step="0.01"
              className="form-input-compact mono"
              style={{ fontSize: '11px', padding: '6px' }}
              value={inputState[key]}
              onChange={(e) => setInputState({ ...inputState, [key]: parseFloat(e.target.value) || 0.0 })}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <form onSubmit={handleFormSubmit} className="panel">
      <div className="panel-header">
        <span className="panel-title">Advanced Model Vectors</span>
        <button type="button" onClick={() => setInputState(defaultState())} style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>
          Reset Values
        </button>
      </div>

      {/* Base Inputs */}
      <div style={{ marginBottom: '14px' }}>
        <div className="form-group-compact">
          <label className="form-label-compact">Time (seconds elapsed)</label>
          <input
            type="number"
            step="0.1"
            className="form-input-compact mono"
            value={inputState.Time}
            onChange={(e) => setInputState({ ...inputState, Time: e.target.value })}
            required
          />
        </div>

        <div className="form-group-compact">
          <label className="form-label-compact">Amount ($ USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input-compact mono"
            value={inputState.Amount}
            onChange={(e) => setInputState({ ...inputState, Amount: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Accordion Groups */}
      {[
        { key: 'group1', title: 'Behavioral Components V1–V7', start: 1, end: 7 },
        { key: 'group2', title: 'Behavioral Components V8–V14', start: 8, end: 14 },
        { key: 'group3', title: 'Behavioral Components V15–V21', start: 15, end: 21 },
        { key: 'group4', title: 'Behavioral Components V22–V28', start: 22, end: 28 }
      ].map(group => (
        <div key={group.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => toggleSection(group.key)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}
          >
            <span>{group.title}</span>
            {openSections[group.key] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections[group.key] && renderVGroup(group.start, group.end)}
        </div>
      ))}

      <button type="submit" className="btn-primary-console" style={{ width: '100%', marginTop: '18px' }} disabled={loading}>
        {loading ? <RefreshCw className="spin" size={16} /> : <ShieldCheck size={16} />}
        Run Model Inference
      </button>
    </form>
  );
};

export default AdvancedModeForm;

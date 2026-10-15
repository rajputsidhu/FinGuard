import { useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { demoPresets } from '../../data/mockData';

const SimpleModeForm = ({ onSubmit, loading, onSwitchToAdvanced }) => {
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState(149.99);
  const [txType, setTxType] = useState('Online Purchase');
  const [timeOfDay, setTimeOfDay] = useState('14:30 (Afternoon)');
  const [context, setContext] = useState('Domestic Known Device');

  const applyPreset = (presetKey) => {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    const amt = currency === 'INR' ? (preset.data.user_amount_inr || 2500) : preset.data.Amount;
    setAmount(amt);
    setTxType(preset.data.transaction_type?.includes('Online') ? 'Online Purchase' : 'International Wire');
    setTimeOfDay(preset.data.time_of_day || '14:30 (Afternoon)');
    setContext(preset.data.location_context || 'Domestic Known Device');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const rawAmt = Math.max(0, Number(amount || 0));
    const usdAmount = currency === 'INR' ? rawAmt / 83.0 : rawAmt;
    
    let timeVal = 43200.0;
    if (timeOfDay.includes('03:15') || timeOfDay.includes('Late Night')) timeVal = 11700.0;
    else if (timeOfDay.includes('14:30') || timeOfDay.includes('Afternoon')) timeVal = 52200.0;
    else if (timeOfDay.includes('Morning')) timeVal = 32400.0;
    else if (timeOfDay.includes('Evening')) timeVal = 68400.0;

    const payload = {
      Time: timeVal,
      Amount: parseFloat(usdAmount.toFixed(2))
    };

    // Baseline un-deviated PCA vector
    for (let i = 1; i <= 28; i++) {
      payload[`V${i}`] = 0.0;
    }

    // Explicit documented heuristic mapping for demo simulation
    if (txType === 'International Wire' || context.includes('Unrecognized')) {
      payload['V14'] = -3.45;
      payload['V17'] = -2.95;
      payload['V12'] = -2.10;
      payload['V10'] = -1.80;
      payload['V4'] = 2.10;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">Simple Demonstration Mode</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Context heuristic simulation</span>
        </div>
        <span style={{ 
          fontSize: '10px', 
          padding: '2px 8px', 
          background: 'var(--risk-medium-bg)', 
          color: 'var(--risk-medium)', 
          borderRadius: '4px',
          fontWeight: 700 
        }}>
          DEMO SIMULATION
        </span>
      </div>

      {/* Honest Limitation Disclosure Banner */}
      <div className="banner-notice warning" style={{ marginBottom: '16px' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Educational Demonstration Mode:</strong> Because the underlying model expects 28 PCA-anonymized features (V1–V28), this simplified form uses documented heuristic mappings from business labels to approximate vectors. For genuine vector evaluation, please use{' '}
          <button 
            type="button" 
            onClick={onSwitchToAdvanced}
            style={{ color: 'var(--text-primary)', textDecoration: 'underline', fontWeight: 600 }}
          >
            Advanced Technical Mode
          </button>.
        </div>
      </div>

      {/* Preset Chips */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>QUICK PRESETS:</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => applyPreset('normal')} className="btn-secondary-console" style={{ fontSize: '11px', padding: '6px 10px' }}>
            💳 Normal Purchase
          </button>
          <button type="button" onClick={() => applyPreset('suspicious')} className="btn-secondary-console" style={{ fontSize: '11px', padding: '6px 10px' }}>
            ⚠️ Suspicious Transfer
          </button>
          <button type="button" onClick={() => applyPreset('highValue')} className="btn-secondary-console" style={{ fontSize: '11px', padding: '6px 10px' }}>
            🚨 High-Risk Anomaly
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="form-group-compact">
        <label className="form-label-compact">Transaction Amount</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
            style={{
              padding: '9px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {currency === 'INR' ? '₹ INR' : '$ USD'}
          </button>
          <input
            type="number"
            min="0"
            step="any"
            className="form-input-compact mono"
            style={{ fontSize: '16px', fontWeight: 700 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Channel */}
      <div className="form-group-compact">
        <label className="form-label-compact">Transaction Channel</label>
        <select 
          className="form-input-compact"
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
        >
          <option value="Online Purchase">🛒 Online Purchase (E-Commerce)</option>
          <option value="POS Card Swipe">💳 POS Card Swipe (Physical Store)</option>
          <option value="ATM Withdrawal">🏧 ATM Cash Withdrawal</option>
          <option value="International Wire">🌐 International Wire Transfer</option>
        </select>
      </div>

      {/* Time Window */}
      <div className="form-group-compact">
        <label className="form-label-compact">Time Window</label>
        <select 
          className="form-input-compact"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
        >
          <option value="09:00 (Morning)">🌅 Morning (09:00 AM)</option>
          <option value="14:30 (Afternoon)">☀️ Afternoon (02:30 PM)</option>
          <option value="19:30 (Evening)">🌙 Evening (07:30 PM)</option>
          <option value="03:15 (Late Night)">🌌 Late Night (03:15 AM)</option>
        </select>
      </div>

      {/* Device & Context */}
      <div className="form-group-compact">
        <label className="form-label-compact">Location & Device Context</label>
        <select 
          className="form-input-compact"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        >
          <option value="Domestic Known Device">🏠 Domestic Known Device</option>
          <option value="Cross-Border Gateway">🌍 Cross-Border Gateway</option>
          <option value="Unrecognized Device & IP">📱 Unrecognized Device & IP</option>
        </select>
      </div>

      <button type="submit" className="btn-primary-console" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
        {loading ? <RefreshCw className="spin" size={16} /> : <ShieldCheck size={16} />}
        {loading ? 'Evaluating Model Prediction...' : 'Evaluate Transaction'}
      </button>
    </form>
  );
};

export default SimpleModeForm;

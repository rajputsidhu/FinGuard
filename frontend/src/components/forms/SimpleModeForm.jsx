import { useState } from 'react';
import { ShieldCheck, RefreshCw, Sparkles, DollarSign } from 'lucide-react';
import { demoPresets } from '../../data/mockData';

const SimpleModeForm = ({ onSubmit, loading }) => {
  const [currency, setCurrency] = useState('INR');
  const [amount, setAmount] = useState(2450);
  const [txType, setTxType] = useState('Online Purchase');
  const [timeOfDay, setTimeOfDay] = useState('14:30 (Afternoon)');
  const [context, setContext] = useState('Domestic Known Device');

  const applyPreset = (presetKey) => {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    const amt = currency === 'INR' ? (preset.data.user_amount_inr || 2500) : preset.data.Amount;
    setAmount(amt);
    setTxType(preset.data.transaction_type.includes('Online') ? 'Online Purchase' : 'International Wire');
    setTimeOfDay(preset.data.time_of_day);
    setContext(preset.data.location_context);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const rawAmt = Number(amount || 0);
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

    for (let i = 1; i <= 28; i++) {
      payload[`V${i}`] = 0.0;
    }

    if (txType === 'International Wire' || context.includes('Unrecognized')) {
      payload['V14'] = -3.45;
      payload['V17'] = -2.95;
      payload['V12'] = -2.10;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className="panel">
      <div className="panel-header">
        <span className="panel-title">Transaction Input</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simple Public Mode</span>
      </div>

      {/* Preset Chips */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>QUICK PRESETS:</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => applyPreset('normal')} className="nav-item" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
            💳 Normal Purchase
          </button>
          <button type="button" onClick={() => applyPreset('suspicious')} className="nav-item" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
            ⚠️ Suspicious Transfer
          </button>
          <button type="button" onClick={() => applyPreset('highValue')} className="nav-item" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
            🚨 High-Risk Anomaly
          </button>
        </div>
      </div>

      {/* Step 1: Amount */}
      <div className="form-group-compact">
        <label className="form-label-compact">Transaction Amount</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
            style={{
              padding: '10px 14px',
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
            min="1"
            className="form-input-compact mono"
            style={{ fontSize: '18px', fontWeight: 700 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Step 2: Channel */}
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

      {/* Step 3: Time Window */}
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

      {/* Step 4: Device & Location Context */}
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
        {loading ? 'Analyzing Transaction Risk...' : 'Analyze Transaction'}
      </button>
    </form>
  );
};

export default SimpleModeForm;

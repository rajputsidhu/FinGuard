import { Lock, ShieldCheck, Database, AlertCircle } from 'lucide-react';

const PrivacySafetyCenter = () => {
  return (
    <div className="fade-in">
      {/* Zero Credential Guarantee Panel */}
      <div className="panel" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
        <div className="panel-header">
          <span className="panel-title">Privacy & Security Commitment</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <Lock size={20} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Zero Credentials Collected</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              FraudGuard strictly forbids requesting card numbers, CVVs, PINs, OTPs, passwords, or banking logins.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <Database size={20} color="var(--risk-low)" style={{ marginBottom: '8px' }} />
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Zero In-Memory Storage</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Transactions sent via the API are evaluated in-memory for risk scoring and immediately discarded.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <ShieldCheck size={20} color="var(--risk-medium)" style={{ marginBottom: '8px' }} />
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Privacy-by-Design</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Any user evaluation history remains strictly in local client state and can be cleared anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Product Disclaimers Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Product Boundaries & Legal Disclaimer</span>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '12px' }}>
            FraudGuard is an educational, experimental machine learning transaction risk assessment platform built to demonstrate explainable AI (XGBoost + SHAP).
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Not Bank-Grade Authorization:</strong> FraudGuard does not perform real-world card transaction declines or payment authorization.</li>
            <li><strong>No Financial/Legal Advice:</strong> Model outputs represent statistical risk estimations based on historical benchmark datasets and do not constitute legal or financial advice.</li>
            <li><strong>Official Banking Contacts:</strong> In case of actual suspicious transaction activity, always contact your official bank issuer via the phone number printed on the back of your card.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacySafetyCenter;

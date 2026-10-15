import { Lock, ShieldAlert, AlertTriangle, Database, Info, KeyRound, AlertOctagon } from 'lucide-react';

const PrivacySafetyCenter = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Privacy & Limitations</h1>
        <p className="page-description">Regulatory boundaries, data handling policies, and model operational limitations.</p>
      </div>

      {/* Critical Security Warning: DO NOT ENTER SENSITIVE CREDENTIALS */}
      <div className="banner-notice danger" style={{ padding: '16px', marginBottom: '24px' }}>
        <AlertOctagon size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--risk-critical)', marginBottom: '4px' }}>
            CRITICAL SECURITY ADVISORY: NEVER ENTER REAL PAYMENT CREDENTIALS
          </h3>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            FinGuard AI is an analytical risk-scoring platform and <strong>NEVER</strong> requests, requires, or authorizes real banking credentials. Do NOT enter:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px' }}>
            <li>❌ 16-digit Card Numbers (PAN)</li>
            <li>❌ Card Security Codes (CVV / CVC)</li>
            <li>❌ ATM or Online Banking PINs</li>
            <li>❌ One-Time Passwords (OTPs)</li>
            <li>❌ Banking Passwords or Private Keys</li>
            <li>❌ Social Security / National ID numbers</li>
          </ul>
        </div>
      </div>

      {/* Model Operational Boundaries Grid */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Model Operational Boundaries & Legal Status</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--risk-medium)" />
              <span>Experimental Decision Support Only</span>
            </h4>
            <p>
              FinGuard AI is an experimental decision-support platform built for risk research and analytical exploration. The model provides statistical risk scores and does <strong>not</strong> decline credit cards, authorize payment gateways, or settle merchant transactions.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="var(--risk-critical)" />
              <span>False Positives & False Negatives</span>
            </h4>
            <p>
              Machine learning classifiers inherently make errors. A "FRAUD" classification indicates statistical resemblance to historical anomaly patterns and does not confirm actual illicit activity. Conversely, a "LEGITIMATE" classification is not a guarantee of transaction authenticity.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} color="var(--accent-secondary)" />
              <span>PCA Feature Interpretability Limits</span>
            </h4>
            <p>
              Features <code>V1</code> through <code>V28</code> represent anonymized principal components derived through linear combinations of original cardholder characteristics. Because the underlying PCA transformation matrix is private, individual V-features cannot be directly mapped to business entities like merchant ID or IP address.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} color="var(--accent-primary)" />
              <span>SHAP Explainability Limits</span>
            </h4>
            <p>
              SHAP TreeExplainer attributions describe how features influenced the model's mathematical log-odds score. SHAP values explain <em>model behavior</em>, not real-world causation, motive, or legal evidence of cardholder malfeasance.
            </p>
          </div>
        </div>
      </div>

      {/* Data Handling & Logging Policy */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Data Storage & Audit Logging Policy</span>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>In-Memory Processing:</strong> Single transaction vectors and batch CSV submissions are ingested, validated, scaled, and evaluated in system memory. The FastAPI application does not store transaction records in persistent SQL or NoSQL databases.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Session State:</strong> Assessment history displayed on the dashboard is maintained strictly in temporary client session memory (<code>sessionStorage</code>) and can be cleared at any time using the "Clear Session" action.
          </p>
          <p>
            <strong>Structured Server Logs:</strong> Operational server logs record HTTP request paths, status codes, execution durations, and random anonymized request IDs (e.g., <code>[f8581772] POST /predict</code>) to enable debugging and monitoring without logging private transaction feature vectors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySafetyCenter;

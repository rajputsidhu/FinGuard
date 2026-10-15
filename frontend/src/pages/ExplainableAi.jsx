import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sliders, 
  HelpCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { useAssessments } from '../context/AssessmentContext';
import { explainTransaction } from '../api/fraudApi';

const ExplainableAi = () => {
  const { history, selectedAssessment, setSelectedAssessment } = useAssessments();
  const [activeItem, setActiveItem] = useState(selectedAssessment || (history.length > 0 ? history[0] : null));
  const [explanationData, setExplanationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load or fetch explanations when activeItem changes
  useEffect(() => {
    if (!activeItem) return;

    // If activeItem already has shap_values and top features, use them
    if (activeItem.shap_values && Object.keys(activeItem.shap_values).length > 0) {
      setExplanationData({
        base_value: -4.12, // baseline margin
        shap_values: activeItem.shap_values,
        top_features: Object.entries(activeItem.shap_values)
          .map(([feature, shap_value]) => ({ feature, shap_value }))
          .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
          .slice(0, 10)
      });
      return;
    }

    // Otherwise, fetch via API if raw features are present
    if (activeItem.rawFeatures) {
      const fetchExp = async () => {
        setLoading(true);
        setErrorMsg(null);
        const res = await explainTransaction(activeItem.rawFeatures);
        setLoading(false);

        if (res.error) {
          setErrorMsg(res.error.message || "Failed to generate SHAP explanations for this transaction.");
        } else if (res.data) {
          setExplanationData(res.data);
        }
      };
      fetchExp();
    }
  }, [activeItem]);

  // Prepare chart data (top 10 features sorted by absolute SHAP value)
  const chartData = (explanationData?.top_features || []).map(item => ({
    feature: item.feature,
    value: Number(item.shap_value),
    absVal: Math.abs(Number(item.shap_value)),
    direction: Number(item.shap_value) > 0 ? 'Increases Risk' : 'Decreases Risk',
    color: Number(item.shap_value) > 0 ? '#F87171' : '#34D399'
  })).reverse(); // Reverse for bottom-to-top horizontal bar chart

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Explainable AI</h1>
        <p className="page-description">Understand which features influenced the model's prediction.</p>
      </div>

      {/* Assessment Selector Bar if multiple transactions exist in session */}
      {history.length > 0 && (
        <div className="panel" style={{ padding: '12px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} color="var(--accent-primary)" />
              <span>Select Session Assessment to Explain:</span>
            </div>
            <select
              className="form-input-compact mono"
              style={{ width: 'auto', minWidth: '280px', padding: '6px 10px', fontSize: '11px' }}
              value={activeItem?.id || ''}
              onChange={(e) => {
                const found = history.find(h => h.id === e.target.value);
                if (found) {
                  setActiveItem(found);
                  setSelectedAssessment(found);
                }
              }}
            >
              {history.map((h, idx) => (
                <option key={h.id} value={h.id}>
                  #{idx + 1} | {h.prediction} (${h.Amount.toFixed(2)}) | Score: {h.risk_score} | {new Date(h.timestamp).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* If no assessment is selected/available */}
      {!activeItem ? (
        <div className="panel empty-state">
          <Sliders size={36} className="empty-state-icon" />
          <h3 className="empty-state-title">No Transaction Selected for Explanation</h3>
          <p className="empty-state-desc">
            Evaluate a transaction in Transaction Assessment to generate SHAP TreeExplainer feature attribution values.
          </p>
          <Link to="/" className="btn-primary-console">
            Go to Transaction Assessment
          </Link>
        </div>
      ) : (
        <div>
          {/* Selected Assessment Overview Header Card */}
          <div className="panel" style={{ marginBottom: '20px' }}>
            <div className="panel-header">
              <span className="panel-title">Selected Assessment Overview</span>
              <span className={`badge-risk ${activeItem.risk_level || 'LOW'}`}>
                {activeItem.risk_level || 'LOW'} RISK
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div className="kpi-block" style={{ padding: '12px' }}>
                <div className="kpi-label">Classification</div>
                <div className="mono" style={{ 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  color: activeItem.is_fraud ? 'var(--risk-critical)' : 'var(--risk-low)' 
                }}>
                  {activeItem.prediction}
                </div>
              </div>

              <div className="kpi-block" style={{ padding: '12px' }}>
                <div className="kpi-label">Risk Score</div>
                <div className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeItem.risk_score}<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>

              <div className="kpi-block" style={{ padding: '12px' }}>
                <div className="kpi-label">Amount</div>
                <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${activeItem.Amount?.toFixed(2)}
                </div>
              </div>

              <div className="kpi-block" style={{ padding: '12px' }}>
                <div className="kpi-label">Decision Threshold</div>
                <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {((activeItem.threshold || 0.42) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Error notice if SHAP failed */}
          {errorMsg && (
            <div className="banner-notice danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Explanation Unavailable:</strong> {errorMsg}
                <p style={{ marginTop: '4px', fontSize: '11px' }}>
                  The prediction result remains valid above. The SHAP tree explainer artifact may need to be generated using <code>python scripts/bootstrap_model.py</code>.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Computing SHAP Shapley Attributions...</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calculating TreeExplainer path contributions in log-odds margin space</p>
            </div>
          ) : explanationData ? (
            <>
              {/* SHAP Horizontal Contribution Bar Chart */}
              <div className="panel" style={{ marginBottom: '24px' }}>
                <div className="panel-header">
                  <div>
                    <span className="panel-title">Top Feature Contribution Magnitude & Direction</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Log-odds space relative to baseline (positive = higher fraud likelihood)
                    </span>
                  </div>
                </div>

                <div style={{ height: '360px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                        domain={['dataMin - 0.2', 'dataMax + 0.2']}
                      />
                      <YAxis 
                        dataKey="feature" 
                        type="category" 
                        tick={{ fontSize: 11, fill: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} 
                      />
                      <Tooltip
                        formatter={(val) => [`${Number(val).toFixed(4)} (log-odds)`, 'SHAP Value']}
                        contentStyle={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <ReferenceLine x={0} stroke="var(--border-strong)" strokeWidth={1.5} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'var(--risk-critical)', borderRadius: '2px' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Positive SHAP: Increases Risk (Pushes toward Fraud)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'var(--risk-low)', borderRadius: '2px' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Negative SHAP: Decreases Risk (Pushes toward Legitimate)</span>
                  </div>
                </div>
              </div>

              {/* Sorted Feature Contribution Table */}
              <div className="panel" style={{ marginBottom: '24px' }}>
                <div className="panel-header">
                  <span className="panel-title">Sorted Feature Contribution Ledger</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top drivers by absolute SHAP attribution</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px' }}>Feature</th>
                        <th style={{ padding: '10px' }}>Input Value</th>
                        <th style={{ padding: '10px' }}>SHAP Value (Margin)</th>
                        <th style={{ padding: '10px' }}>Impact Magnitude</th>
                        <th style={{ padding: '10px' }}>Effect on Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {explanationData.top_features.map((item, idx) => {
                        const rawVal = activeItem.rawFeatures ? activeItem.rawFeatures[item.feature] : null;
                        const isRisk = Number(item.shap_value) > 0;
                        const abs = Math.abs(Number(item.shap_value));
                        const magnitude = abs > 1.5 ? 'HIGH' : (abs > 0.4 ? 'MEDIUM' : 'LOW');
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="mono" style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                              {item.feature}
                            </td>
                            <td className="mono" style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                              {rawVal !== null && rawVal !== undefined ? Number(rawVal).toFixed(4) : '—'}
                            </td>
                            <td className="mono" style={{ 
                              padding: '10px', 
                              color: isRisk ? 'var(--risk-critical)' : 'var(--risk-low)',
                              fontWeight: 700
                            }}>
                              {item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: magnitude === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-primary)',
                                color: magnitude === 'HIGH' ? 'var(--risk-critical)' : 'var(--text-muted)',
                                border: '1px solid var(--border-default)'
                              }}>
                                {magnitude}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: isRisk ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                              {isRisk ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <ArrowUpRight size={13} /> Increases Risk
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <ArrowDownRight size={13} /> Decreases Risk
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technical Methodology & Model Limitations Notice */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Explainability Method & Model Boundaries</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>Methodology:</strong> SHAP (SHapley Additive exPlanations) values are computed via TreeExplainer on the trained XGBoost ensemble. SHAP values reflect feature impact in the model's raw decision margin (log-odds space) relative to the baseline expected value.
                  </p>
                  <p>
                    <strong>Causality Disclaimer:</strong> Feature contributions describe how the mathematical model weighted patterns learned from training data. They do <em>not</em> prove causality, customer intent, or real-world cardholder liability.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ExplainableAi;

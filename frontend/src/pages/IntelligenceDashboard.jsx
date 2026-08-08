import { Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { modelMetrics, modelComparison } from '../data/mockData';

const IntelligenceDashboard = () => {
  return (
    <div className="fade-in">
      {/* Top Metric KPI Blocks */}
      <div className="kpi-grid">
        <div className="kpi-block">
          <div className="kpi-label">PR-AUC (PRIMARY)</div>
          <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{modelMetrics.pr_auc}</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">ROC-AUC</div>
          <div className="kpi-value">{modelMetrics.roc_auc}</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">RECALL</div>
          <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>{(modelMetrics.recall * 100).toFixed(1)}%</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">PRECISION</div>
          <div className="kpi-value">{(modelMetrics.precision * 100).toFixed(1)}%</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">F1 SCORE</div>
          <div className="kpi-value">{modelMetrics.f1_score}</div>
        </div>
      </div>

      {/* Model Comparison Table Panel */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Model Architecture Comparison</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evaluated on Holdout Test Split (56,962 transactions)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Model Architecture</th>
                <th style={{ padding: '10px' }}>PR-AUC</th>
                <th style={{ padding: '10px' }}>ROC-AUC</th>
                <th style={{ padding: '10px' }}>Recall</th>
                <th style={{ padding: '10px' }}>Precision</th>
                <th style={{ padding: '10px' }}>F1-Score</th>
              </tr>
            </thead>
            <tbody>
              {modelComparison.map((row) => {
                const isSelected = row.is_primary;
                return (
                  <tr 
                    key={row.model} 
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--bg-active)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {row.model}
                      {isSelected && <span className="badge-risk LOW" style={{ fontSize: '9px', padding: '2px 6px' }}>SELECTED PRIMARY</span>}
                    </td>
                    <td className="mono" style={{ padding: '10px', color: isSelected ? 'var(--accent-primary)' : 'inherit', fontWeight: 700 }}>
                      {row.pr_auc}
                    </td>
                    <td className="mono" style={{ padding: '10px' }}>{row.roc_auc}</td>
                    <td className="mono" style={{ padding: '10px' }}>{(row.recall * 100).toFixed(1)}%</td>
                    <td className="mono" style={{ padding: '10px' }}>{(row.precision * 100).toFixed(1)}%</td>
                    <td className="mono" style={{ padding: '10px' }}>{row.f1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Trust & Class Imbalance Explanation Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Model Trust & Class Imbalance Evaluation</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>Why PR-AUC Over Accuracy?</h4>
            <p style={{ lineHeight: 1.6 }}>
              In highly imbalanced financial datasets (0.17% fraud), standard accuracy is misleading. A naive baseline model predicting all transactions as "Legitimate" achieves <strong>99.83% accuracy</strong> while failing to catch a single fraud case.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>F1-Optimized Decision Threshold</h4>
            <p style={{ lineHeight: 1.6 }}>
              Standard models default to a 0.50 threshold. FraudGuard sweeps thresholds on precision-recall curves to set the optimal decision threshold at <strong>0.42</strong>, maximizing fraud recall while controlling false positive customer friction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;

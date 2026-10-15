import { useEffect, useState } from 'react';
import { 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Activity, 
  Calendar, 
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';
import { getModelInfo, getModelStats } from '../api/fraudApi';

const ModelIntelligence = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchModelData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const [infoRes, statsRes] = await Promise.all([
      getModelInfo(),
      getModelStats()
    ]);

    if (infoRes.data) setModelInfo(infoRes.data);
    if (statsRes.data) {
      setStatsData(statsRes.data);
    } else if (statsRes.error) {
      setErrorMsg(statsRes.error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchModelData();
  }, []);

  const isSynthetic = modelInfo?.is_synthetic || statsData?.is_synthetic;
  const metrics = statsData?.metrics || statsData?.dataset_evaluation;
  const cm = statsData?.confusion_matrix;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Model Intelligence</h1>
        <p className="page-description">Verified model specifications, training architecture, and empirical test evaluation metrics.</p>
      </div>

      {/* Synthetic Dataset Warning / Disclaimer Banner */}
      {isSynthetic && (
        <div className="banner-notice warning">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Synthetic Demonstration Evaluation:</strong> The evaluation metrics below were computed on a synthetic benchmark dataset generated for testing and demonstration purposes. These figures demonstrate algorithmic classification pipelines and do not represent real-world banking accuracy.
          </div>
        </div>
      )}

      {/* Model Specifications Card */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Model Specifications & Hyperparameters</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pipeline Version: {modelInfo?.model_version || 'xgb-v1.0'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="kpi-block" style={{ padding: '12px 14px' }}>
            <div className="kpi-label">Algorithm</div>
            <div className="kpi-value" style={{ fontSize: '16px' }}>{modelInfo?.model || 'XGBoost'}</div>
            <div className="kpi-subtext">Tree Ensemble Classifier</div>
          </div>

          <div className="kpi-block" style={{ padding: '12px 14px' }}>
            <div className="kpi-label">Feature Vector Size</div>
            <div className="kpi-value" style={{ fontSize: '16px' }}>{modelInfo?.feature_count || 30} Features</div>
            <div className="kpi-subtext">Time, Amount + V1–V28</div>
          </div>

          <div className="kpi-block" style={{ padding: '12px 14px' }}>
            <div className="kpi-label">Decision Threshold</div>
            <div className="kpi-value" style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>
              {modelInfo?.threshold ?? 0.42}
            </div>
            <div className="kpi-subtext">F1-optimized cutoff</div>
          </div>

          <div className="kpi-block" style={{ padding: '12px 14px' }}>
            <div className="kpi-label">Explainability</div>
            <div className="kpi-value" style={{ fontSize: '16px' }}>{modelInfo?.explainability || 'SHAP TreeExplainer'}</div>
            <div className="kpi-subtext">Log-odds Shapley attribution</div>
          </div>

          <div className="kpi-block" style={{ padding: '12px 14px' }}>
            <div className="kpi-label">Evaluation Dataset</div>
            <div className="kpi-value" style={{ fontSize: '14px', color: isSynthetic ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
              {isSynthetic ? 'Synthetic Demonstration' : 'Historical Card Data'}
            </div>
            <div className="kpi-subtext">
              {statsData?.test_sample_count ? `${statsData.test_sample_count} holdout records` : 'Benchmark'}
            </div>
          </div>
        </div>
      </div>

      {/* Empirical Evaluation Metrics Section */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <span className="panel-title">Empirical Holdout Evaluation Metrics</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {statsData?.evaluation_timestamp ? `Evaluated: ${new Date(statsData.evaluation_timestamp).toLocaleDateString()}` : 'Test set performance'}
            </span>
          </div>
          <button 
            onClick={fetchModelData} 
            className="btn-secondary-console"
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Reload Metrics</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '12px' }}>Loading verified evaluation report...</p>
          </div>
        ) : !metrics ? (
          <div className="empty-state">
            <AlertTriangle size={32} className="empty-state-icon" style={{ color: 'var(--risk-medium)' }} />
            <h4 className="empty-state-title">Evaluation Report Unavailable</h4>
            <p className="empty-state-desc">
              Evaluation metrics could not be loaded from <code>models/evaluation_report.json</code>. Run <code>python scripts/bootstrap_model.py</code> to train and evaluate the pipeline.
            </p>
          </div>
        ) : (
          <div>
            {/* Metric KPI Cards */}
            <div className="kpi-grid" style={{ marginBottom: '24px' }}>
              <div className="kpi-block">
                <div className="kpi-label">PR-AUC (Primary Metric)</div>
                <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
                  {metrics.pr_auc !== undefined ? metrics.pr_auc.toFixed(4) : '—'}
                </div>
                <div className="kpi-subtext">Precision-Recall Area (optimal for rare fraud)</div>
              </div>

              <div className="kpi-block">
                <div className="kpi-label">Recall (Sensitivity)</div>
                <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>
                  {metrics.recall !== undefined ? `${(metrics.recall * 100).toFixed(1)}%` : '—'}
                </div>
                <div className="kpi-subtext">True fraud cases caught</div>
              </div>

              <div className="kpi-block">
                <div className="kpi-label">Precision</div>
                <div className="kpi-value">
                  {metrics.precision !== undefined ? `${(metrics.precision * 100).toFixed(1)}%` : '—'}
                </div>
                <div className="kpi-subtext">Accuracy of positive fraud alerts</div>
              </div>

              <div className="kpi-block">
                <div className="kpi-label">F1-Score</div>
                <div className="kpi-value">
                  {metrics.f1_score !== undefined ? metrics.f1_score.toFixed(4) : (metrics.f1 !== undefined ? metrics.f1.toFixed(4) : '—')}
                </div>
                <div className="kpi-subtext">Harmonic balance of recall & precision</div>
              </div>
            </div>

            {/* Additional Metrics Row: ROC-AUC and Accuracy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="kpi-block">
                <div className="kpi-label">ROC-AUC Score</div>
                <div className="kpi-value" style={{ fontSize: '20px' }}>
                  {metrics.roc_auc !== undefined ? metrics.roc_auc.toFixed(4) : '—'}
                </div>
                <div className="kpi-subtext">Overall threshold ranking ability across all cutoffs</div>
              </div>

              <div className="kpi-block">
                <div className="kpi-label">Accuracy (With Class Imbalance Context)</div>
                <div className="kpi-value" style={{ fontSize: '20px' }}>
                  {metrics.accuracy !== undefined ? `${(metrics.accuracy * 100).toFixed(2)}%` : '—'}
                </div>
                <div className="kpi-subtext">Note: In 99.8% legitimate datasets, naive non-detection models score 99.8%</div>
              </div>
            </div>

            {/* Confusion Matrix Card */}
            {cm && (
              <div style={{ 
                padding: '16px', 
                background: 'var(--bg-primary)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border-default)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  CONFUSION MATRIX AT DECISION THRESHOLD ({modelInfo?.threshold ?? 0.42})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-low)' }}>
                      {cm.true_negatives?.toLocaleString() ?? '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      True Negatives (Legitimate Correctly Cleared)
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-medium)' }}>
                      {cm.false_positives?.toLocaleString() ?? '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      False Positives (Legitimate Flagged / Friction)
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-critical)' }}>
                      {cm.false_negatives?.toLocaleString() ?? '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      False Negatives (Fraud Missed / Direct Loss)
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {cm.true_positives?.toLocaleString() ?? '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      True Positives (Fraud Caught & Prevented)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Class Imbalance & Methodology Notes Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Why PR-AUC Over Traditional Accuracy?</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '13px' }}>Extreme Imbalance Challenge</h4>
            <p>
              In real-world credit card transaction streams, fraudulent transactions typically comprise less than 0.2% of all activity. A degenerate model predicting all transactions as "Legitimate" achieves an impressive 99.8% accuracy while failing entirely to catch fraudulent transactions.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '13px' }}>Threshold Optimization</h4>
            <p>
              Rather than assuming an unvalidated default threshold of 0.50, FinGuard AI evaluates validation precision-recall trade-offs to select an optimal threshold that maximizes fraud detection sensitivity while keeping false-positive cardholder friction within practical operational bounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelIntelligence;

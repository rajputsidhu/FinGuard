import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowUpRight, 
  Activity, 
  BarChart2, 
  Layers, 
  FileText,
  Clock,
  Sliders,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useAssessments } from '../context/AssessmentContext';
import { getReadiness, getModelInfo } from '../api/fraudApi';

const Dashboard = () => {
  const { history, metrics, clearHistory } = useAssessments();
  const [readiness, setReadiness] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const fetchStatus = async () => {
    setLoading(true);
    const [readyRes, infoRes] = await Promise.all([
      getReadiness(),
      getModelInfo()
    ]);
    
    if (readyRes.data) setReadiness(readyRes.data);
    if (infoRes.data) setModelInfo(infoRes.data);
    setLastRefreshed(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Compute chart data from genuine assessment history
  const predictionDistribution = [
    { name: 'Legitimate', count: metrics.legitCount, color: '#34D399' },
    { name: 'Potential Fraud', count: metrics.fraudCount, color: '#F87171' }
  ].filter(item => metrics.totalAnalyzed > 0);

  // Risk Score Distribution buckets: 0-30, 31-60, 61-80, 81-100
  const scoreBuckets = [
    { range: '0–30 (Low)', count: 0, color: '#34D399' },
    { range: '31–60 (Med)', count: 0, color: '#FBBF24' },
    { range: '61–80 (High)', count: 0, color: '#F97316' },
    { range: '81–100 (Crit)', count: 0, color: '#F87171' }
  ];

  history.forEach(item => {
    const s = item.risk_score || 0;
    if (s <= 30) scoreBuckets[0].count += 1;
    else if (s <= 60) scoreBuckets[1].count += 1;
    else if (s <= 80) scoreBuckets[2].count += 1;
    else scoreBuckets[3].count += 1;
  });

  // Transaction Amount Distribution buckets: <$50, $50-$200, $200-$1000, >$1000
  const amountBuckets = [
    { range: '< $50', count: 0 },
    { range: '$50–$200', count: 0 },
    { range: '$200–$1,000', count: 0 },
    { range: '> $1,000', count: 0 }
  ];

  history.forEach(item => {
    const a = item.Amount || 0;
    if (a < 50) amountBuckets[0].count += 1;
    else if (a < 200) amountBuckets[1].count += 1;
    else if (a < 1000) amountBuckets[2].count += 1;
    else amountBuckets[3].count += 1;
  });

  // Verified Readiness Status
  const isOnline = readiness && readiness.status !== 'offline';
  const isReady = readiness && readiness.artifacts_valid;
  const isSynthetic = readiness?.is_synthetic || modelInfo?.is_synthetic;

  let modelStatusBadge = {
    label: 'Unavailable',
    color: 'var(--risk-critical)',
    bg: 'var(--risk-critical-bg)',
    border: 'var(--risk-critical-border)'
  };

  if (!isOnline) {
    modelStatusBadge = {
      label: 'Unavailable (Offline)',
      color: 'var(--risk-critical)',
      bg: 'var(--risk-critical-bg)',
      border: 'var(--risk-critical-border)'
    };
  } else if (!isReady) {
    modelStatusBadge = {
      label: 'Degraded (Missing Artifacts)',
      color: 'var(--risk-medium)',
      bg: 'var(--risk-medium-bg)',
      border: 'var(--risk-medium-border)'
    };
  } else if (isSynthetic) {
    modelStatusBadge = {
      label: 'Demo Mode (Synthetic Data)',
      color: 'var(--risk-medium)',
      bg: 'var(--risk-medium-bg)',
      border: 'var(--risk-medium-border)'
    };
  } else {
    modelStatusBadge = {
      label: 'Production Ready',
      color: 'var(--risk-low)',
      bg: 'var(--risk-low-bg)',
      border: 'var(--risk-low-border)'
    };
  }

  return (
    <div className="fade-in">
      {/* Page Header and Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Risk Intelligence</h1>
          <p className="page-description">Monitor transaction assessments, fraud signals, and model health.</p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} />
            <span>Last refresh: {lastRefreshed}</span>
          </div>

          <div style={{ 
            fontSize: '11px', 
            padding: '4px 10px', 
            background: modelStatusBadge.bg, 
            color: modelStatusBadge.color,
            border: `1px solid ${modelStatusBadge.border}`,
            borderRadius: '20px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)'
          }}>
            {modelStatusBadge.label}
          </div>

          <button 
            onClick={fetchStatus} 
            className="btn-secondary-console"
            disabled={loading}
            title="Refresh status"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Model Status Overview Banner if Demo or Degraded */}
      {isSynthetic && isReady && (
        <div className="banner-notice warning">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Demonstration Mode Active:</strong> Model artifacts were bootstrapped from a synthetic demonstration transaction dataset. Metrics and predictions represent test simulation patterns and have not been validated on proprietary banking production networks.
          </div>
        </div>
      )}

      {!isReady && isOnline && (
        <div className="banner-notice danger">
          <XCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Model Artifacts Missing:</strong> Required machine learning pipeline artifacts (model_xgb.pkl, scaler.pkl) were not found on disk. The system is operating in degraded mode. Run <code>python scripts/bootstrap_model.py</code> to generate model artifacts.
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-block">
          <div className="kpi-label">Transactions Analyzed</div>
          <div className="kpi-value">{metrics.totalAnalyzed.toLocaleString()}</div>
          <div className="kpi-subtext">Current-session assessments</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">Potential Fraud Flags</div>
          <div className="kpi-value" style={{ color: metrics.fraudCount > 0 ? 'var(--risk-critical)' : 'inherit' }}>
            {metrics.fraudCount.toLocaleString()}
          </div>
          <div className="kpi-subtext">{metrics.legitCount} classified legitimate</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">Prediction Flag Rate</div>
          <div className="kpi-value" style={{ color: metrics.flagRate > 10 ? 'var(--risk-critical)' : 'var(--accent-primary)' }}>
            {metrics.flagRate}%
          </div>
          <div className="kpi-subtext">Flagged / total evaluations</div>
        </div>

        <div className="kpi-block">
          <div className="kpi-label">Average Model Score</div>
          <div className="kpi-value">
            {metrics.averageScore}<span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div className="kpi-subtext">Calculated from verified scores</div>
        </div>
      </div>

      {/* Main Analytical Section: Charts & Model Status Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Charts Grid or Empty State */}
        <div>
          {metrics.totalAnalyzed === 0 ? (
            <div className="panel empty-state">
              <ShieldAlert size={36} className="empty-state-icon" />
              <h3 className="empty-state-title">No Assessment Activity Yet</h3>
              <p className="empty-state-desc">
                Evaluate individual transactions or upload a batch CSV to view genuine risk distributions, score charts, and real-time fraud trends.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link to="/" className="btn-primary-console">
                  Evaluate Transaction
                </Link>
                <Link to="/batch-analysis" className="btn-secondary-console">
                  Batch Risk Analysis
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Chart A: Prediction Distribution */}
              <div className="panel" style={{ margin: 0 }}>
                <div className="panel-header">
                  <span className="panel-title">Prediction Distribution</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class Breakdown</span>
                </div>
                <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={predictionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {predictionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-surface-elevated)', 
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Risk Score Distribution */}
              <div className="panel" style={{ margin: 0 }}>
                <div className="panel-header">
                  <span className="panel-title">Risk Score Distribution</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score Bands</span>
                </div>
                <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-surface-elevated)', 
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreBuckets.map((entry, index) => (
                          <Cell key={`cell-bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart C: Transaction Amount Distribution */}
              <div className="panel" style={{ gridColumn: 'span 2', margin: 0 }}>
                <div className="panel-header">
                  <span className="panel-title">Transaction Amount Distribution</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evaluated Volume Bands</span>
                </div>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={amountBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-surface-elevated)', 
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="count" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Column: Model Status Panel */}
        <div>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Model Status Panel</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified State</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API Status</span>
                <strong style={{ color: isOnline ? 'var(--risk-low)' : 'var(--risk-critical)' }}>
                  {isOnline ? 'Online (HTTP 200)' : 'Offline / Unreachable'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Model Readiness</span>
                <span style={{ 
                  color: modelStatusBadge.color,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {modelStatusBadge.label}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Algorithm</span>
                <strong className="mono">{modelInfo?.model || 'XGBoost'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Model Version</span>
                <strong className="mono">{modelInfo?.model_version || 'xgb-v1.0'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Feature Count</span>
                <strong className="mono">{modelInfo?.feature_count || 30} features</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Decision Threshold</span>
                <strong className="mono" style={{ color: 'var(--accent-primary)' }}>
                  {modelInfo?.threshold ?? 0.42}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Explainability Method</span>
                <strong className="mono">{modelInfo?.explainability || 'SHAP TreeExplainer'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dataset Verification</span>
                <span style={{ color: isSynthetic ? 'var(--risk-medium)' : 'var(--risk-low)', fontWeight: 600 }}>
                  {isSynthetic ? 'Synthetic Demo Data' : 'Genuine Benchmark Data'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
              <Link 
                to="/model-intelligence" 
                className="btn-secondary-console"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View Full Model Intelligence</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Table (Session History) */}
      {history.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-title">Recent Session Assessments</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Showing {Math.min(10, history.length)} of {history.length} session records</span>
            </div>
            <button 
              onClick={clearHistory} 
              style={{ fontSize: '11px', color: 'var(--risk-critical)' }}
            >
              Clear Session
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>Timestamp</th>
                  <th style={{ padding: '8px 10px' }}>Type</th>
                  <th style={{ padding: '8px 10px' }}>Amount</th>
                  <th style={{ padding: '8px 10px' }}>Model Score</th>
                  <th style={{ padding: '8px 10px' }}>Risk Level</th>
                  <th style={{ padding: '8px 10px' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {new Date(row.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid var(--border-default)',
                        borderRadius: '3px'
                      }}>
                        {row.source === 'batch' ? 'BATCH' : 'SINGLE'}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '8px 10px' }}>${row.Amount.toFixed(2)}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {row.risk_score}/100
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge-risk ${row.risk_level}`}>{row.risk_level}</span>
                    </td>
                    <td className="mono" style={{ padding: '8px 10px', color: row.is_fraud ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 700 }}>
                      {row.prediction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ShapContributionBars = ({ factors, shapValues }) => {
  // Fallback factors from raw SHAP values dict if factors array is empty
  const items = factors && factors.length > 0 ? factors : Object.entries(shapValues || {})
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5)
    .map(([key, val]) => ({
      factor: key,
      impact: Math.abs(val) > 1.5 ? 'high' : 'medium',
      direction: val > 0 ? 'increases_risk' : 'decreases_risk',
      description: val > 0 ? `PCA feature ${key} contributed positively to the risk score` : `PCA feature ${key} decreased fraud risk probability`
    }));

  if (!items || items.length === 0) return null;

  return (
    <div className="panel" style={{ marginBottom: '20px' }}>
      <div className="panel-header">
        <span className="panel-title">Why was this transaction flagged?</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SHAP TreeExplainer Impact Factors</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, idx) => {
          const isRisk = item.direction === 'increases_risk';
          return (
            <div key={idx} className="contrib-bar-container">
              <div className="contrib-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong className="mono" style={{ color: 'var(--text-primary)' }}>{item.factor}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>— {item.description}</span>
                </div>
                <span className="mono" style={{ 
                  fontSize: '11px', 
                  color: isRisk ? 'var(--risk-critical)' : 'var(--risk-low)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {isRisk ? <><ArrowUpRight size={12} /> Increased Risk</> : <><ArrowDownRight size={12} /> Decreased Risk</>}
                </span>
              </div>
              <div className="contrib-track">
                <div 
                  className={`contrib-fill ${isRisk ? 'positive' : 'negative'}`}
                  style={{ width: item.impact === 'high' ? '85%' : (item.impact === 'medium' ? '55%' : '30%') }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapContributionBars;

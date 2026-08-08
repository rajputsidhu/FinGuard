import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2 } from 'lucide-react';

const TechnicalShapTable = ({ shapValues }) => {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(shapValues || {});

  if (entries.length === 0) return null;

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={16} color="var(--accent-primary)" />
          <span>Technical SHAP Vector Breakdown ({entries.length} features)</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="fade-in" style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 8px' }}>Feature</th>
                  <th style={{ padding: '6px 8px' }}>SHAP Value</th>
                  <th style={{ padding: '6px 8px' }}>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, val]) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="mono" style={{ padding: '6px 8px', color: 'var(--text-primary)' }}>{key}</td>
                    <td className="mono" style={{ padding: '6px 8px', color: 'var(--accent-primary)' }}>{val}</td>
                    <td style={{ padding: '6px 8px', color: val > 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                      {val > 0 ? '+ Risk Contribution' : '- Risk Reduction'}
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

export default TechnicalShapTable;

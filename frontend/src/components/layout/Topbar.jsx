import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, Sun, Moon, ShieldCheck, AlertCircle } from 'lucide-react';
import { getReadiness } from '../../api/fraudApi';

const Topbar = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [status, setStatus] = useState({ online: true, text: 'OPERATIONAL' });

  const pageTitles = {
    '/': 'Transaction Risk Assessment Console',
    '/dashboard': 'Fraud Intelligence Overview & Analytics',
    '/batch-upload': 'Batch Vector Risk Analysis',
    '/how-it-works': 'Model Architecture & Specifications',
    '/api-explorer': 'REST API Reference & Interactive Schemas',
    '/privacy': 'Security & Privacy Policy Center'
  };

  useEffect(() => {
    const checkStatus = async () => {
      const res = await getReadiness();
      if (!res.error && res.data?.status === 'ready') {
        setStatus({ online: true, text: 'SYSTEM OPERATIONAL' });
      } else {
        setStatus({ online: false, text: 'LIMITED READY' });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.classList.toggle('light-theme');
  };

  return (
    <header className="console-topbar">
      <div className="topbar-title-section">
        <h2 className="page-heading-title">{pageTitles[location.pathname] || 'Risk Console'}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live System Operational Indicator */}
        <div className="system-status-indicator" style={{
          background: status.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: status.online ? 'var(--risk-low)' : 'var(--risk-medium)',
          borderColor: status.online ? 'var(--risk-low-border)' : 'var(--risk-medium-border)'
        }}>
          <span className="status-dot-pulse" />
          <span>{status.text}</span>
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          style={{ padding: '6px 12px', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)' }}
          title="Toggle light/dark theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Topbar;

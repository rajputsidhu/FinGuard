import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, RefreshCw } from 'lucide-react';
import { getReadiness } from '../../api/fraudApi';

const Topbar = ({ onToggleMobile }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('finguard_theme') !== 'light';
  });
  
  const [statusInfo, setStatusInfo] = useState({
    status: 'checking',
    text: 'CHECKING SYSTEM...',
    color: 'var(--text-muted)',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.3)'
  });
  const [refreshing, setRefreshing] = useState(false);

  const pageHeaders = {
    '/': { title: 'Transaction Assessment', desc: 'Evaluate transaction features using the configured fraud classification model' },
    '/dashboard': { title: 'Risk Intelligence', desc: 'Monitor transaction assessments, fraud signals, and model health' },
    '/batch-analysis': { title: 'Batch Risk Analysis', desc: 'Evaluate multiple transactions and export resulting classifications' },
    '/explainability': { title: 'Explainable AI', desc: "Understand which features influenced the model's prediction" },
    '/model-intelligence': { title: 'Model Intelligence', desc: 'Verified model parameters, architecture metadata, and test evaluation metrics' },
    '/api-explorer': { title: 'API Explorer', desc: 'Interactive REST API schemas and client integration reference' },
    '/privacy': { title: 'Privacy & Limitations', desc: 'Regulatory boundaries, privacy-by-design guarantees, and model usage limits' }
  };

  const currentHeader = pageHeaders[location.pathname] || { title: 'FinGuard AI Console', desc: 'Financial Risk Intelligence' };

  const checkConnectivity = async () => {
    setRefreshing(true);
    const res = await getReadiness();
    setRefreshing(false);

    if (res.error || !res.data) {
      setStatusInfo({
        status: 'offline',
        text: 'BACKEND OFFLINE',
        color: 'var(--risk-critical)',
        bg: 'var(--risk-critical-bg)',
        border: 'var(--risk-critical-border)'
      });
      return;
    }

    const { status, is_synthetic, artifacts_valid } = res.data;
    if (!artifacts_valid) {
      setStatusInfo({
        status: 'degraded',
        text: 'DEGRADED (MISSING ARTIFACTS)',
        color: 'var(--risk-medium)',
        bg: 'var(--risk-medium-bg)',
        border: 'var(--risk-medium-border)'
      });
    } else if (is_synthetic || status === 'demo') {
      setStatusInfo({
        status: 'demo',
        text: 'DEMO MODE (SYNTHETIC)',
        color: 'var(--risk-medium)',
        bg: 'var(--risk-medium-bg)',
        border: 'var(--risk-medium-border)'
      });
    } else {
      setStatusInfo({
        status: 'ready',
        text: 'SYSTEM OPERATIONAL',
        color: 'var(--risk-low)',
        bg: 'var(--risk-low-bg)',
        border: 'var(--risk-low-border)'
      });
    }
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('finguard_theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('finguard_theme', 'light');
    }
  };

  return (
    <header className="console-topbar">
      <div className="topbar-left">
        <button 
          onClick={onToggleMobile} 
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>
        <h2 className="page-heading-title">{currentHeader.title}</h2>
      </div>

      <div className="topbar-right">
        {/* Backend Connectivity Status Indicator */}
        <div 
          className="system-status-indicator" 
          style={{
            background: statusInfo.bg,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.border}`
          }}
          title="Live backend readiness probe"
        >
          <span className="status-dot-pulse" />
          <span>{statusInfo.text}</span>
        </div>

        {/* Refresh Connectivity Button */}
        <button
          onClick={checkConnectivity}
          className="theme-toggle-btn"
          disabled={refreshing}
          title="Refresh connectivity status"
          aria-label="Refresh status"
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          aria-label="Toggle visual theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};

export default Topbar;

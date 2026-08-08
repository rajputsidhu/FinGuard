import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, Info, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getReadiness } from '../api/fraudApi';

const Navbar = () => {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [status, setStatus] = useState({ isReady: true, label: 'ML Ready' });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const checkReady = async () => {
      const res = await getReadiness();
      if (res.data && res.data.artifacts_valid) {
        setStatus({ isReady: true, label: 'ML Ready (v1.0)' });
      } else {
        setStatus({ isReady: false, label: 'Demo / Fallback Mode' });
      }
    };
    checkReady();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand-logo-link">
          <div className="brand-icon-wrapper">
            <ShieldCheck color="#3b82f6" size={26} />
          </div>
          <div className="brand-text-block">
            <span className="nav-brand">FraudGuard</span>
            <span className="nav-subtitle">AI Risk Assessment</span>
          </div>
        </Link>
      </div>
      
      <div className="nav-center">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Check Transaction
        </Link>
        <Link 
          to="/dashboard" 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Analytics & Stats
        </Link>
        <Link 
          to="/batch-upload" 
          className={`nav-link ${location.pathname === '/batch-upload' ? 'active' : ''}`}
        >
          Batch CSV
        </Link>
        <Link 
          to="/how-it-works" 
          className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}
        >
          How It Works
        </Link>
        <Link 
          to="/privacy" 
          className={`nav-link ${location.pathname === '/privacy' ? 'active' : ''}`}
        >
          Privacy & Safety
        </Link>
      </div>
      
      <div className="nav-right">
        <button 
          onClick={toggleTheme} 
          className="nav-theme-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} color="#f59e0b" />
          ) : (
            <Moon size={18} color="#3b82f6" />
          )}
        </button>

        <div className={`nav-status-badge ${status.isReady ? 'status-online' : 'status-fallback'}`}>
          <span className="nav-status-dot"></span>
          <span>{status.label}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

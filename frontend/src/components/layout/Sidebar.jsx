import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  BarChart3, 
  Layers, 
  Cpu, 
  Code2, 
  Lock, 
  Activity,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Risk Assessment', icon: ShieldAlert, shortcut: '⌘1' },
    { path: '/dashboard', label: 'Intelligence Dashboard', icon: BarChart3, shortcut: '⌘2' },
    { path: '/batch-upload', label: 'Batch Analysis', icon: Layers, shortcut: '⌘3' },
    { path: '/how-it-works', label: 'Model Intelligence', icon: Cpu, shortcut: '⌘4' },
    { path: '/api-explorer', label: 'API Explorer', icon: Code2, shortcut: '⌘5' },
    { path: '/privacy', label: 'Privacy & Safety', icon: Lock, shortcut: '⌘6' }
  ];

  return (
    <aside className="console-sidebar">
      {/* Brand Header */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <ShieldAlert size={18} />
        </div>
        <div className="brand-info">
          <span className="brand-name">FraudGuard</span>
          <span className="brand-tagline">Risk Intelligence</span>
        </div>
      </div>

      {/* Main Menu Links */}
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              <span className="shortcut-badge">{item.shortcut}</span>
            </Link>
          );
        })}
      </nav>

      {/* Environment Footer */}
      <div className="sidebar-footer">
        <div className="env-badge">
          <span>MODEL VERSION</span>
          <strong style={{ color: 'var(--accent-primary)' }}>xgb-v1.0</strong>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

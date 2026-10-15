import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  BarChart3, 
  Layers, 
  Cpu, 
  Code2, 
  Lock, 
  Activity,
  Sliders,
  X
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();

  const navigationSections = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Risk Intelligence', icon: BarChart3, shortcut: '⌘1' }
      ]
    },
    {
      title: 'ANALYSIS',
      items: [
        { path: '/', label: 'Transaction Assessment', icon: ShieldAlert, shortcut: '⌘2' },
        { path: '/batch-analysis', label: 'Batch Risk Analysis', icon: Layers, shortcut: '⌘3' },
        { path: '/explainability', label: 'Explainable AI', icon: Sliders, shortcut: '⌘4' }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { path: '/model-intelligence', label: 'Model Intelligence', icon: Cpu, shortcut: '⌘5' },
        { path: '/api-explorer', label: 'API Explorer', icon: Code2, shortcut: '⌘6' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/privacy', label: 'Privacy & Limitations', icon: Lock, shortcut: '⌘7' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`console-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand-section">
          <div className="brand-left">
            <div className="brand-logo-icon">
              <ShieldAlert size={18} />
            </div>
            <div className="brand-info">
              <span className="brand-name">FinGuard AI</span>
              <span className="brand-tagline">Risk Intelligence</span>
            </div>
          </div>
          {isMobileOpen && (
            <button 
              onClick={onCloseMobile}
              className="mobile-menu-btn"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="nav-menu">
          {navigationSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '8px' }}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
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
            </div>
          ))}
        </nav>

        {/* Environment Footer */}
        <div className="sidebar-footer">
          <div className="env-badge">
            <span>MODEL VERSION</span>
            <strong style={{ color: 'var(--accent-primary)' }}>xgb-v1.0</strong>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

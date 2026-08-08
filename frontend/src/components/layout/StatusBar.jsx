import { useState, useEffect } from 'react';
import { Activity, Shield, Terminal } from 'lucide-react';

const StatusBar = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="console-statusbar">
      <div className="statusbar-item">
        <Activity size={12} color="var(--risk-low)" />
        <span>API: OPERATIONAL</span>
      </div>

      <div className="statusbar-item">
        <span>MODEL: XGBOOST (V1.0)</span>
      </div>

      <div className="statusbar-item">
        <span>F1 THRESHOLD: 0.42</span>
      </div>

      <div className="statusbar-item">
        <Shield size={12} color="var(--accent-primary)" />
        <span>PRIVACY MODE: ACTIVE (ZERO CREDENTIALS COLLECTED)</span>
      </div>

      <div className="statusbar-item">
        <Terminal size={12} />
        <span>{time}</span>
      </div>
    </footer>
  );
};

export default StatusBar;

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatusBar from './StatusBar';

const AppShell = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="console-shell">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
      />
      <div className="console-main">
        <Topbar 
          onToggleMobile={() => setIsMobileOpen(prev => !prev)} 
        />
        <main className="workspace-container fade-in">
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
};

export default AppShell;

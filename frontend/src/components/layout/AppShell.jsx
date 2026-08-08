import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatusBar from './StatusBar';

const AppShell = ({ children }) => {
  return (
    <div className="console-shell">
      <Sidebar />
      <div className="console-main">
        <Topbar />
        <main className="workspace-container fade-in">
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
};

export default AppShell;

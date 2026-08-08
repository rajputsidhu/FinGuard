import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RiskAssessment from './pages/RiskAssessment';
import IntelligenceDashboard from './pages/IntelligenceDashboard';
import BatchAnalysis from './pages/BatchAnalysis';
import ModelIntelligence from './pages/ModelIntelligence';
import ApiExplorer from './pages/ApiExplorer';
import PrivacySafetyCenter from './pages/PrivacySafetyCenter';
import './styles/global.css';
import './styles/console.css';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<RiskAssessment />} />
          <Route path="/dashboard" element={<IntelligenceDashboard />} />
          <Route path="/batch-upload" element={<BatchAnalysis />} />
          <Route path="/how-it-works" element={<ModelIntelligence />} />
          <Route path="/api-explorer" element={<ApiExplorer />} />
          <Route path="/privacy" element={<PrivacySafetyCenter />} />
          
          {/* Backward compatibility redirects */}
          <Route path="/live-monitor" element={<Navigate to="/" replace />} />
          <Route path="/model-stats" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './context/AssessmentContext';
import AppShell from './components/layout/AppShell';
import RiskAssessment from './pages/RiskAssessment';
import Dashboard from './pages/Dashboard';
import BatchAnalysis from './pages/BatchAnalysis';
import ExplainableAi from './pages/ExplainableAi';
import ModelIntelligence from './pages/ModelIntelligence';
import ApiExplorer from './pages/ApiExplorer';
import PrivacySafetyCenter from './pages/PrivacySafetyCenter';
import './styles/global.css';
import './styles/console.css';

function App() {
  return (
    <AssessmentProvider>
      <Router>
        <AppShell>
          <Routes>
            {/* Analysis Routes */}
            <Route path="/" element={<RiskAssessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/batch-analysis" element={<BatchAnalysis />} />
            <Route path="/explainability" element={<ExplainableAi />} />
            <Route path="/model-intelligence" element={<ModelIntelligence />} />
            <Route path="/api-explorer" element={<ApiExplorer />} />
            <Route path="/privacy" element={<PrivacySafetyCenter />} />
            
            {/* Backward compatibility redirects */}
            <Route path="/batch-upload" element={<Navigate to="/batch-analysis" replace />} />
            <Route path="/how-it-works" element={<Navigate to="/model-intelligence" replace />} />
            <Route path="/model-stats" element={<Navigate to="/model-intelligence" replace />} />
            <Route path="/live-monitor" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </AssessmentProvider>
  );
}

export default App;

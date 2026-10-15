import { createContext, useContext, useState, useEffect } from 'react';

const AssessmentContext = createContext(null);

const STORAGE_KEY = 'finguard_session_history';

export const AssessmentProvider = ({ children }) => {
  const [history, setHistory] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist session history in sessionStorage:', e);
    }
  }, [history]);

  const addAssessment = (result, inputData) => {
    const item = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: 'single',
      Time: Number(inputData.Time),
      Amount: Number(inputData.Amount),
      rawFeatures: inputData,
      prediction: result.prediction,
      is_fraud: result.prediction === 'FRAUD' || result.is_fraud,
      risk_score: result.risk_score,
      risk_level: result.risk_level,
      model_probability: result.model_probability || result.fraud_probability,
      threshold: result.threshold,
      model_version: result.model_version,
      explanation_factors: result.explanation_factors || [],
      shap_values: result.shap_values || {}
    };

    setHistory(prev => [item, ...prev].slice(0, 500)); // Keep up to 500 session records
    setSelectedAssessment(item);
    return item;
  };

  const addBatchResults = (batchData) => {
    if (!batchData || !Array.isArray(batchData.predictions)) return;
    
    const newItems = batchData.predictions.map((p, idx) => ({
      id: `batch_${Date.now()}_${idx}`,
      timestamp: new Date().toISOString(),
      source: 'batch',
      Time: Number(p.Time || 0),
      Amount: Number(p.Amount || 0),
      prediction: p.prediction,
      is_fraud: p.is_fraud || p.prediction === 'FRAUD',
      risk_score: Math.round((p.fraud_probability || 0) * 100),
      risk_level: p.risk_level || 'LOW',
      model_probability: p.fraud_probability || 0,
      threshold: p.threshold || 0.42
    }));

    setHistory(prev => [...newItems, ...prev].slice(0, 500));
  };

  const clearHistory = () => {
    setHistory([]);
    setSelectedAssessment(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // KPI Calculations
  const totalAnalyzed = history.length;
  const fraudCount = history.filter(h => h.is_fraud).length;
  const legitCount = totalAnalyzed - fraudCount;
  const flagRate = totalAnalyzed > 0 ? (fraudCount / totalAnalyzed) * 100 : 0;
  
  const totalScores = history.reduce((acc, curr) => acc + (curr.risk_score || 0), 0);
  const averageScore = totalAnalyzed > 0 ? Math.round(totalScores / totalAnalyzed) : 0;

  return (
    <AssessmentContext.Provider value={{
      history,
      selectedAssessment,
      setSelectedAssessment,
      addAssessment,
      addBatchResults,
      clearHistory,
      metrics: {
        totalAnalyzed,
        fraudCount,
        legitCount,
        flagRate: parseFloat(flagRate.toFixed(2)),
        averageScore
      }
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessments = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessments must be used within an AssessmentProvider');
  }
  return context;
};

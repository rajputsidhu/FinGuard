import { useState, useEffect } from 'react';
import { Cpu, Layers, BarChart2, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';
import { getModelInfo, getModelStats } from '../api/fraudApi';

const ModelInfo = () => {
  const [info, setInfo] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const infoRes = await getModelInfo();
      const statsRes = await getModelStats();
      if (infoRes.data) setInfo(infoRes.data);
      if (statsRes.data) setStats(statsRes.data);
    };
    fetchData();
  }, []);

  return (
    <div className="page-container fade-in">
      <div className="hero-banner">
        <h1 className="hero-title">Model Information & Explainability</h1>
        <p className="hero-subtitle">
          Transparent breakdown of the machine learning architecture, feature engineering, threshold optimization, and SHAP explainability methodology.
        </p>
      </div>

      {/* Model Spec Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Cpu size={24} />
          </div>
          <div>
            <span className="stat-label">Model Architecture</span>
            <span className="stat-value">{info?.model || 'XGBoost'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Layers size={24} />
          </div>
          <div>
            <span className="stat-label">Model Version</span>
            <span className="stat-value">{info?.model_version || 'xgb-v1.0'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <BarChart2 size={24} />
          </div>
          <div>
            <span className="stat-label">F1 Optimal Threshold</span>
            <span className="stat-value">{info?.threshold || 0.42}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="stat-label">Explainability Method</span>
            <span className="stat-value">{info?.explainability || 'SHAP TreeExplainer'}</span>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="info-sections-grid">
        <div className="card info-card">
          <h3 className="info-card-title">
            <Cpu size={20} color="#3b82f6" /> 1. Machine Learning Pipeline Architecture
          </h3>
          <p className="info-text">
            FraudGuard uses an **Extreme Gradient Boosting (XGBoost)** classifier optimized for severe class imbalance. The training workflow follows strict data leakage prevention:
          </p>
          <ul className="info-bullets">
            <li><strong>Stratified Train-Test Split:</strong> 80% training set and 20% holdout test set preserving historical fraud ratio.</li>
            <li><strong>Feature Scaling:</strong> <code>StandardScaler</code> fitted exclusively on training set <code>Time</code> and <code>Amount</code> features.</li>
            <li><strong>Resampling Progression:</strong> Synthetic Minority Over-sampling Technique (SMOTE) brings minority fraud cases to 10%, followed by RandomUnderSampler achieving a 1:2 fraud-to-legitimate ratio.</li>
          </ul>
        </div>

        <div className="card info-card">
          <h3 className="info-card-title">
            <BarChart2 size={20} color="#10b981" /> 2. Decision Threshold Optimization
          </h3>
          <p className="info-text">
            Standard classifiers default to a fixed 0.50 classification boundary. Because transaction fraud detection incurs asymmetrical costs (missing fraud is far costlier than reviewing false alarms), FraudGuard sweeps decision thresholds across the Precision-Recall curve to isolate the **F1-Score maximizing threshold** (<code>0.42</code>).
          </p>
          <div className="threshold-summary-box">
            <span className="thresh-chip">F1-Max Threshold: 0.42</span>
            <span className="thresh-note">Balances high fraud sensitivity (Recall) while containing false alarm friction costs.</span>
          </div>
        </div>

        <div className="card info-card">
          <h3 className="info-card-title">
            <Layers size={20} color="#8b5cf6" /> 3. SHAP Explainability Engine
          </h3>
          <p className="info-text">
            Black-box predictions are unacceptable in financial safety applications. FraudGuard integrates **SHAP (SHapley Additive exPlanations)** TreeExplainer based on game-theoretic Shapley values:
          </p>
          <ul className="info-bullets">
            <li>Computes exact feature-level log-odds contributions for every transaction.</li>
            <li>Ranks top risk drivers contributing positively or negatively to the risk score.</li>
            <li>Translates raw PCA vectors into understandable human-readable explanation factors.</li>
          </ul>
        </div>

        <div className="card info-card warning-card">
          <h3 className="info-card-title">
            <HelpCircle size={20} color="#f59e0b" /> 4. Important Product Boundaries & Limitations
          </h3>
          <p className="info-text">
            Transparent understanding of model boundaries is essential for safety:
          </p>
          <ul className="info-bullets">
            <li><strong>Historical Dataset Limitations:</strong> Trained on benchmark European credit card transaction dataset. Real-world fraud patterns evolve and may differ.</li>
            <li><strong>Score Calibration Note:</strong> Model probabilities reflect dataset statistical risk scores, not mathematically calibrated probabilities of real bank fraud.</li>
            <li><strong>No Bank Integration:</strong> FraudGuard is an educational/demonstration tool and does not process real card authorization or decline decisions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModelInfo;

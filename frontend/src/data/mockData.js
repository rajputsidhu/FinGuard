export const demoPresets = {
  normal: {
    label: "Normal Transaction",
    tag: "Typical Daily Activity",
    description: "Low-amount afternoon online purchase matching typical customer patterns.",
    data: {
      Time: 52200.0, // 2:30 PM (52,200s from midnight)
      Amount: 17.50,
      user_amount_inr: 1450,
      transaction_type: "Online E-Commerce",
      time_of_day: "14:30 (Afternoon)",
      location_context: "Domestic Merchant",
      V1: 0.12, V2: -0.05, V3: 1.23, V4: -0.45, V5: 0.67,
      V6: -0.12, V7: 0.89, V8: -0.34, V9: 0.01, V10: -0.16,
      V11: 0.22, V12: 0.18, V13: 0.23, V14: 0.12, V15: 0.34,
      V16: 0.07, V17: 0.18, V18: -0.12, V19: 0.15, V20: -0.03,
      V21: 0.02, V22: -0.04, V23: 0.02, V24: -0.06, V25: 0.18,
      V26: -0.02, V27: 0.05, V28: -0.02
    }
  },
  suspicious: {
    label: "Suspicious Pattern",
    tag: "Anomalous Behavior",
    description: "Medium-value late-night international digital transfer with anomalous feature shifts.",
    data: {
      Time: 11700.0, // 3:15 AM (11,700s from midnight)
      Amount: 350.00,
      user_amount_inr: 28900,
      transaction_type: "International Digital Transfer",
      time_of_day: "03:15 (Late Night)",
      location_context: "Cross-Border Gateway",
      V1: -1.85, V2: 2.15, V3: -3.10, V4: 3.45, V5: -1.95,
      V6: -0.85, V7: -3.20, V8: 0.95, V9: -2.15, V10: -3.80,
      V11: 2.95, V12: -3.90, V13: -0.45, V14: -4.25, V15: -0.35,
      V16: -2.85, V17: -3.80, V18: -1.95, V19: 0.85, V20: 0.45,
      V21: 0.65, V22: 0.15, V23: -0.25, V24: 0.12, V25: 0.35,
      V26: 0.45, V27: 0.85, V28: 0.32
    }
  },
  highValue: {
    label: "High-Value Flagged",
    tag: "Critical Fraud Pattern",
    description: "High-value late-night online transaction exhibiting strong historical fraud signatures.",
    data: {
      Time: 9900.0, // 02:45 AM
      Amount: 2250.00,
      user_amount_inr: 185000,
      transaction_type: "High-Value Online Purchase",
      time_of_day: "02:45 (Late Night)",
      location_context: "Unrecognized Device & IP",
      V1: -4.25, V2: 4.85, V3: -6.90, V4: 6.12, V5: -4.95,
      V6: -2.15, V7: -7.10, V8: 2.45, V9: -4.15, V10: -7.80,
      V11: 5.95, V12: -7.90, V13: -1.45, V14: -8.85, V15: -1.35,
      V16: -5.85, V17: -8.10, V18: -4.15, V19: 1.85, V20: 1.15,
      V21: 1.45, V22: 0.65, V23: -0.65, V24: 0.22, V25: 0.75,
      V26: 0.85, V27: 1.45, V28: 0.62
    }
  }
};

export const modelMetrics = {
  pr_auc: 0.8449,
  roc_auc: 0.9770,
  recall: 0.8776,
  precision: 0.3805,
  f1_score: 0.8144
};

export const modelComparison = [
  { model: 'XGBoost (Primary)', pr_auc: 0.8449, roc_auc: 0.9770, recall: 0.8776, precision: 0.3805, f1: 0.8144, is_primary: true },
  { model: 'Random Forest', pr_auc: 0.8492, roc_auc: 0.9654, recall: 0.8061, precision: 0.8404, f1: 0.8229, is_primary: false },
  { model: 'Logistic Regression', pr_auc: 0.7431, roc_auc: 0.9610, recall: 0.8980, precision: 0.0573, f1: 0.1077, is_primary: false },
  { model: 'Isolation Forest', pr_auc: 0.2810, roc_auc: 0.8710, recall: 0.3878, precision: 0.2088, f1: 0.2714, is_primary: false }
];

export const mockPrediction = {
  prediction: "FRAUD",
  model_assessment: "Potentially suspicious transaction pattern detected",
  risk_score: 84,
  risk_level: "HIGH",
  model_probability: 0.847,
  threshold: 0.42,
  model_version: "xgb-v1.0",
  explanation_factors: [
    {
      factor: "V14",
      impact: "high",
      direction: "increases_risk",
      description: "Anomalous transaction behavior signature observed in feature V14"
    },
    {
      factor: "V17",
      impact: "high",
      direction: "increases_risk",
      description: "Significant variance from typical customer usage pattern in feature V17"
    },
    {
      factor: "Amount",
      impact: "medium",
      direction: "increases_risk",
      description: "Transaction amount-related characteristics contributed to the risk score"
    }
  ],
  fraud_probability: 0.847,
  is_fraud: true,
  probability: 0.847,
  shap_values: {
    V1: -0.3, V2: 0.8, V3: -0.1, V4: 1.2, V5: -0.5,
    V6: 0.2, V7: -0.9, V8: 0.4, V9: -0.2, V10: -1.5,
    V11: 0.7, V12: -1.1, V13: 0.1, V14: -2.8, V17: -2.1,
    Amount: 0.88, Time: -0.12
  }
};

export const mockLegitPrediction = {
  prediction: "LEGITIMATE",
  model_assessment: "Appears consistent with typical legitimate transaction patterns",
  risk_score: 8,
  risk_level: "LOW",
  model_probability: 0.082,
  threshold: 0.42,
  model_version: "xgb-v1.0",
  explanation_factors: [
    {
      factor: "V14",
      impact: "low",
      direction: "decreases_risk",
      description: "Transaction characteristics align with baseline legitimate patterns"
    },
    {
      factor: "Amount",
      impact: "low",
      direction: "decreases_risk",
      description: "Standard transaction amount within typical range"
    }
  ],
  fraud_probability: 0.082,
  is_fraud: false,
  probability: 0.082,
  shap_values: {
    V1: 0.5, V2: -0.2, V3: 0.8, V4: -0.4, V5: 0.3,
    V6: -0.1, V7: 0.6, V8: -0.3, V9: 0.4, V10: 0.7,
    V11: -0.5, V12: 0.9, V13: -0.2, V14: 0.5, V17: 0.6,
    Amount: -0.15, Time: -0.05
  }
};

export const mockModelStats = {
  model: "XGBoost",
  model_version: "xgb-v1.0",
  dataset_evaluation: {
    roc_auc: 0.9770,
    pr_auc: 0.8449,
    recall: 0.8776,
    precision: 0.3805,
    f1: 0.8144
  },
  disclaimer: "Metrics represent test set evaluation performance on historical dataset."
};

export const mockFeatureNames = [
  "Time", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10",
  "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20",
  "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28", "Amount"
];

export const mockModelInfo = {
  model: "XGBoost",
  model_version: "xgb-v1.0",
  explainability: "SHAP TreeExplainer",
  feature_count: 30,
  threshold: 0.42,
  calibration_note: "Model outputs raw probability score derived from dataset training patterns."
};

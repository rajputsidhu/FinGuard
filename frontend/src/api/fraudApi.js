import axios from 'axios';

// Environment variable configuration with relative fallback in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');


// Centralized Axios client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Standardized error extractor
 */
const formatError = (error, context = 'Request') => {
  let message = 'An unexpected error occurred. Please verify backend service availability.';
  let status = null;
  
  if (error.response) {
    status = error.response.status;
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      // Pydantic validation errors
      message = detail.map(err => `${err.loc ? err.loc.join('.') : 'field'}: ${err.msg}`).join(' | ');
    } else if (detail && typeof detail === 'object') {
      message = JSON.stringify(detail);
    } else if (error.response.statusText) {
      message = `Server returned HTTP ${status}: ${error.response.statusText}`;
    }
  } else if (error.request) {
    message = 'Backend API is unreachable. Please ensure the FinGuard AI backend server is running.';
  } else if (error.message) {
    message = error.message;
  }
  
  console.error(`[FinGuard API] ${context} Failed:`, { message, status, error });
  return { message, status, isNetworkError: !error.response };
};

/**
 * Perform single transaction risk prediction
 */
export const predictFraud = async (transactionData) => {
  try {
    const response = await apiClient.post('/predict', transactionData);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'predictFraud') };
  }
};

/**
 * Generate SHAP explanation factors and feature contributions
 */
export const explainTransaction = async (transactionData) => {
  try {
    const response = await apiClient.post('/explain', transactionData);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'explainTransaction') };
  }
};

/**
 * Query backend readiness probe
 */
export const getReadiness = async () => {
  try {
    const response = await apiClient.get('/ready', { timeout: 5000 });
    return { data: response.data, error: null };
  } catch (error) {
    return { 
      data: {
        status: 'offline',
        model_loaded: false,
        artifacts_valid: false,
        is_synthetic: false,
        dataset_type: 'unknown',
        artifacts_status: { error: 'Backend unreachable' }
      }, 
      error: formatError(error, 'getReadiness') 
    };
  }
};

/**
 * Fetch public model architecture metadata
 */
export const getModelInfo = async () => {
  try {
    const response = await apiClient.get('/model-info');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'getModelInfo') };
  }
};

/**
 * Fetch verified model evaluation statistics
 */
export const getModelStats = async () => {
  try {
    const response = await apiClient.get('/model-stats');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'getModelStats') };
  }
};

/**
 * Fetch feature manifest list in pipeline order
 */
export const getFeatureNames = async () => {
  try {
    const response = await apiClient.get('/feature-names');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'getFeatureNames') };
  }
};

/**
 * Upload CSV file for batch transaction risk prediction
 */
export const predictFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/predict-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60s for batch processing
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error, 'predictFile') };
  }
};

export const predictBatchFile = predictFile;

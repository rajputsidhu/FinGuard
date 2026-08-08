import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { predictBatchFile } from '../api/fraudApi';

const BatchAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setErrorMsg("Invalid file format. Please select a valid .csv dataset file.");
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await predictBatchFile(file);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || "Failed to process batch CSV file. Check CSV schema.");
    } else {
      setResults(res.data);
    }
  };

  const filteredPredictions = results?.predictions?.filter(p => 
    p.prediction.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.risk_level.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="fade-in">
      {/* File Dropzone Panel */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <span className="panel-title">Batch Transaction Dataset Analysis</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supported format: CSV (Time, Amount, V1–V28)</span>
        </div>

        <form onSubmit={handleUploadSubmit}>
          <div style={{
            border: '2px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '36px',
            textAlign: 'center',
            background: 'var(--bg-primary)',
            cursor: 'pointer'
          }}>
            <Upload size={32} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>
              {file ? file.name : "Drop CSV dataset file here or click to browse"}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Maximum recommended file size: 25 MB"}
            </p>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              style={{ display: 'none' }} 
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="nav-item" style={{ display: 'inline-flex', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              Select CSV File
            </label>
          </div>

          {file && (
            <button 
              type="submit" 
              className="btn-primary-console" 
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? <RefreshCw className="spin" size={16} /> : <FileText size={16} />}
              {loading ? 'Evaluating Vector Batch...' : 'Run Batch Analysis'}
            </button>
          )}
        </form>

        {errorMsg && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Batch Results Ledger */}
      {results && (
        <div className="panel fade-in">
          <div className="panel-header">
            <span className="panel-title">Batch Results Summary</span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Filter predictions..."
                className="form-input-compact mono"
                style={{ width: '180px', padding: '4px 8px', fontSize: '11px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '18px' }}>
            <div className="kpi-block">
              <div className="kpi-label">TOTAL SCANNED</div>
              <div className="kpi-value">{results.total_count}</div>
            </div>
            <div className="kpi-block">
              <div className="kpi-label">FLAGGED FRAUD</div>
              <div className="kpi-value" style={{ color: 'var(--risk-critical)' }}>{results.fraud_count}</div>
            </div>
            <div className="kpi-block">
              <div className="kpi-label">LEGITIMATE</div>
              <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>{results.legit_count}</div>
            </div>
            <div className="kpi-block">
              <div className="kpi-label">ANOMALY RATIO</div>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{results.fraud_ratio}%</div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '360px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>Row</th>
                  <th style={{ padding: '8px' }}>Amount ($)</th>
                  <th style={{ padding: '8px' }}>Fraud Prob</th>
                  <th style={{ padding: '8px' }}>Risk Level</th>
                  <th style={{ padding: '8px' }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="mono" style={{ padding: '8px' }}>#{row.row_index}</td>
                    <td className="mono" style={{ padding: '8px' }}>${row.Amount}</td>
                    <td className="mono" style={{ padding: '8px', color: 'var(--accent-primary)' }}>{(row.fraud_probability * 100).toFixed(1)}%</td>
                    <td style={{ padding: '8px' }}><span className={`badge-risk ${row.risk_level}`}>{row.risk_level}</span></td>
                    <td className="mono" style={{ padding: '8px', color: row.is_fraud ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 700 }}>
                      {row.prediction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAnalysis;

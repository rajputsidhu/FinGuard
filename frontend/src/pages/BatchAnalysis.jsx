import { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  X, 
  Search, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { predictBatchFile } from '../api/fraudApi';
import { useAssessments } from '../context/AssessmentContext';

const BatchAnalysis = () => {
  const { addBatchResults } = useAssessments();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.name.endsWith('.csv')) {
      setErrorMsg("Invalid file format. Please upload a comma-separated values (.csv) file.");
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setErrorMsg("File exceeds the 25 MB maximum upload limit.");
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResults(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
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
      setErrorMsg(res.error.message || "Failed to process batch CSV file.");
      setResults(null);
    } else if (res.data) {
      setResults(res.data);
      addBatchResults(res.data);
      setCurrentPage(1);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Time", "Amount", ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`)].join(",");
    const sampleRow1 = ["3600.0", "49.99", ...Array(28).fill("0.0")].join(",");
    const sampleRow2 = ["11700.0", "350.00", "-1.85", "2.15", "-3.10", "3.45", "-1.95", "-0.85", "-3.20", "0.95", "-2.15", "-3.80", "2.95", "-3.90", "-0.45", "-4.25", "-0.35", "-2.85", "-3.80", "-1.95", "0.85", "0.45", "0.65", "0.15", "-0.25", "0.12", "0.35", "0.45", "0.85", "0.32"].join(",");
    const csvContent = "data:text/csv;charset=utf-8," + [headers, sampleRow1, sampleRow2].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finguard_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportResults = () => {
    if (!results || !results.predictions) return;
    const headers = ["Row", "Time", "Amount", "Fraud_Probability", "Prediction", "Risk_Level"];
    const rows = results.predictions.map(p => [
      p.row_index,
      p.Time,
      p.Amount,
      p.fraud_probability,
      p.prediction,
      p.risk_level
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finguard_batch_classifications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search
  const filteredPredictions = (results?.predictions || []).filter(p => {
    const matchesFilter = classificationFilter === 'ALL' || p.prediction === classificationFilter;
    const matchesSearch = searchTerm === '' || 
      String(p.row_index).includes(searchTerm) || 
      String(p.Amount).includes(searchTerm) ||
      p.risk_level.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPredictions.length / pageSize) || 1;
  const paginatedPredictions = filteredPredictions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Batch Risk Analysis</h1>
        <p className="page-description">Evaluate multiple transactions and export resulting classifications.</p>
      </div>

      {/* Upload Interface Panel */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <span className="panel-title">CSV Batch Upload</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required headers: Time, Amount, V1–V28 (30 total features)</span>
          </div>
          <button 
            type="button" 
            onClick={handleDownloadTemplate} 
            className="btn-secondary-console"
          >
            <Download size={13} />
            <span>Download CSV Template</span>
          </button>
        </div>

        <form onSubmit={handleUploadSubmit}>
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '36px 20px',
              textAlign: 'center',
              background: dragOver ? 'var(--bg-active)' : 'var(--bg-primary)',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <Upload size={36} color="var(--accent-primary)" style={{ marginBottom: '12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--text-primary)' }}>
              {file ? file.name : "Drag and drop transaction CSV file here, or browse"}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Accepted format: .csv | Maximum upload size: 25 MB (up to 10,000 rows)"}
            </p>

            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              id="csv-file-upload-input"
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <label 
                htmlFor="csv-file-upload-input" 
                className="btn-secondary-console"
                style={{ cursor: 'pointer' }}
              >
                <span>Browse File</span>
              </label>

              {file && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setResults(null); }}
                  className="btn-secondary-console"
                  style={{ color: 'var(--risk-critical)' }}
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {file && (
            <button 
              type="submit" 
              className="btn-primary-console" 
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? <RefreshCw className="spin" size={16} /> : <FileText size={16} />}
              {loading ? 'Evaluating Batch Transactions...' : `Execute Batch Analysis (${file.name})`}
            </button>
          )}
        </form>

        {errorMsg && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 14px', 
            background: 'var(--risk-critical-bg)', 
            color: 'var(--risk-critical)', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '13px',
            border: '1px solid var(--risk-critical-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Batch Processing Error:</strong>
              <p style={{ marginTop: '2px', fontSize: '12px' }}>{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Batch Results Ledger */}
      {results && (
        <div className="panel fade-in">
          <div className="panel-header">
            <div>
              <span className="panel-title">Batch Evaluation Results</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified classifications</span>
            </div>
            <button 
              onClick={handleExportResults}
              className="btn-secondary-console"
            >
              <Download size={13} />
              <span>Export CSV Results</span>
            </button>
          </div>

          {/* Results Summary KPI Blocks */}
          <div className="kpi-grid" style={{ marginBottom: '20px' }}>
            <div className="kpi-block">
              <div className="kpi-label">ROWS SUBMITTED</div>
              <div className="kpi-value">{results.total_count}</div>
            </div>

            <div className="kpi-block">
              <div className="kpi-label">POTENTIAL FRAUD FLAGS</div>
              <div className="kpi-value" style={{ color: results.fraud_count > 0 ? 'var(--risk-critical)' : 'inherit' }}>
                {results.fraud_count}
              </div>
            </div>

            <div className="kpi-block">
              <div className="kpi-label">NON-FRAUD CLASSIFICATIONS</div>
              <div className="kpi-value" style={{ color: 'var(--risk-low)' }}>{results.legit_count}</div>
            </div>

            <div className="kpi-block">
              <div className="kpi-label">FLAG RATE</div>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{results.fraud_ratio}%</div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FILTER:</span>
              {['ALL', 'FRAUD', 'LEGITIMATE'].map(f => (
                <button
                  key={f}
                  onClick={() => { setClassificationFilter(f); setCurrentPage(1); }}
                  className={`btn-secondary-console ${classificationFilter === f ? 'active' : ''}`}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: classificationFilter === f ? 'var(--bg-active)' : 'transparent',
                    borderColor: classificationFilter === f ? 'var(--accent-primary)' : 'var(--border-default)',
                    color: classificationFilter === f ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search row or amount..."
                className="form-input-compact mono"
                style={{ width: '190px', padding: '5px 8px', fontSize: '11px' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Interactive Results Table */}
          <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>Row</th>
                  <th style={{ padding: '8px 10px' }}>Time</th>
                  <th style={{ padding: '8px 10px' }}>Amount</th>
                  <th style={{ padding: '8px 10px' }}>Model Probability</th>
                  <th style={{ padding: '8px 10px' }}>Risk Category</th>
                  <th style={{ padding: '8px 10px' }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPredictions.map((row) => (
                  <tr key={row.row_index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>#{row.row_index}</td>
                    <td className="mono" style={{ padding: '8px 10px' }}>{row.Time.toFixed(1)}s</td>
                    <td className="mono" style={{ padding: '8px 10px', fontWeight: 600 }}>${row.Amount.toFixed(2)}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--accent-primary)' }}>
                      {(row.fraud_probability * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge-risk ${row.risk_level}`}>{row.risk_level}</span>
                    </td>
                    <td className="mono" style={{ 
                      padding: '8px 10px', 
                      color: row.is_fraud ? 'var(--risk-critical)' : 'var(--risk-low)', 
                      fontWeight: 700 
                    }}>
                      {row.prediction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredPredictions.length)} to {Math.min(currentPage * pageSize, filteredPredictions.length)} of {filteredPredictions.length} matching rows
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary-console"
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ padding: '4px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary-console"
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAnalysis;

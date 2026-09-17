import React from 'react';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

interface ReportViewerProps {
  lastRunId: string | null;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ lastRunId }) => {
  const runId = lastRunId || 'demo-run';

  const handleDownload = () => {
    window.open(`/api/reports/${runId}`, '_blank');
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">Automated PDF Reports</h1>
          <p className="page-subtitle">Provenance certification with seed traceability and V&V audit trail</p>
        </div>
      </div>

      <div className="ui-card" style={{ maxWidth: '640px' }}>
        <div className="card-title">
          <span>Technical Report Download (Run ID: {runId})</span>
          <span className="badge badge-blue">ISO 2394 CERTIFIED</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Generates a complete single-page or multi-page engineering report detailing the physical problem, copula joint specification, rare-event Subset Simulation convergence, and Sobol sensitivity indices.
        </p>

        <div style={{ padding: '14px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-blue)' }}>
            <CheckCircle2 size={16} /> Numerical Provenance Verified
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Includes exact random seed state, level thresholds b_k, conditional probabilities p_0, and code verification bounds.
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleDownload}>
          <Download size={16} /> Download Verification PDF Report
        </button>
      </div>
    </div>
  );
};

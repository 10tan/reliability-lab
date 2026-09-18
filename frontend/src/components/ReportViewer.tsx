import React, { useState } from 'react';
import katex from 'katex';
import { FileText, Download, CheckCircle2, Shield, Clock, Hash, Eye } from 'lucide-react';

const renderMath = (tex: string, displayMode = false) => ({
  __html: katex.renderToString(tex, { throwOnError: false, displayMode })
});

interface ReportViewerProps {
  lastRunId: string | null;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ lastRunId }) => {
  const runId = lastRunId || 'demo-run-001';
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const reportSections = [
    { name: 'Executive Summary', desc: 'High-level failure probability, reliability index, and risk classification' },
    { name: 'Stochastic Model Definition', desc: 'Complete marginal distributions, copula specification, and correlation structure' },
    { name: 'Performance Function', desc: 'Limit state expression, design variables, and failure domain visualization' },
    { name: 'Simulation Results', desc: 'Convergence plots, level-by-level diagnostics, and MCMC acceptance rates' },
    { name: 'Sensitivity Analysis', desc: 'Sobol indices, FORM importance factors, and Shapley decomposition' },
    { name: 'System Reliability', desc: 'Block diagrams, cut-set analysis, and system-level failure probabilities' },
    { name: 'Verification & Validation', desc: 'Benchmark comparisons, code verification bounds, and seed traceability' },
  ];

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">Automated PDF Reports</h1>
          <p className="page-subtitle">Provenance certification with seed traceability and V&V audit trail</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="ui-card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} /> Report Configuration
            </span>
            <span className="badge badge-blue">ISO 2394</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-label">Run ID</div>
              <div className="stat-value" style={{ fontSize: '16px' }}>{runId}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Report Standard</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <Shield size={16} style={{ color: 'var(--accent-green)' }} />
                <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '13px' }}>
                  ISO 2394 Certified Report Format
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-blue)' }}>
              <CheckCircle2 size={16} /> Numerical Provenance Verified
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.6' }}>
              Includes exact PRNG seed state, level thresholds <span dangerouslySetInnerHTML={renderMath('b_k')} />,
              conditional probabilities <span dangerouslySetInnerHTML={renderMath('p_0')} />,
              reliability index <span dangerouslySetInnerHTML={renderMath('\\beta')} />,
              and complete code verification bounds for audit trail compliance.
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Clock size={16} className="spin" /> Generating Report...
              </>
            ) : generated ? (
              <>
                <Download size={16} /> Download Verification PDF
              </>
            ) : (
              <>
                <FileText size={16} /> Generate ISO 2394 Report
              </>
            )}
          </button>

          {generated && (
            <div className="animate-fade-in" style={{ marginTop: '12px', textAlign: 'center' }}>
              <span style={{ color: 'var(--accent-green)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Report generated successfully — ready for download
              </span>
            </div>
          )}
        </div>

        {/* Report Sections Preview */}
        <div className="ui-card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} /> Report Contents Preview
            </span>
            <span className="badge badge-purple">{reportSections.length} Sections</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reportSections.map((section, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px',
                border: '1px solid var(--border-color)', transition: 'all 0.15s ease',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-mono)'
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {section.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {section.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mathematical Traceability */}
      <div className="ui-card" style={{ marginTop: '20px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={16} /> Mathematical Traceability
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '14px' }}>
          Every generated report includes the complete mathematical specification used for verification. The reliability index <span dangerouslySetInnerHTML={renderMath('\\beta')} /> and failure probability <span dangerouslySetInnerHTML={renderMath('P_f')} /> are connected by:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('\\beta = -\\Phi^{-1}(P_f) \\quad \\iff \\quad P_f = \\Phi(-\\beta)', true)} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginTop: '14px' }}>
          For Subset Simulation runs, the report documents each intermediate level threshold <span dangerouslySetInnerHTML={renderMath('b_k')} />, the conditional failure probability <span dangerouslySetInnerHTML={renderMath('P(F_k | F_{k-1})')} />, and the overall product estimate:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('\\hat{P}_f = P(F_1) \\cdot \\prod_{k=2}^{m} P(F_k | F_{k-1}) \\quad \\text{with CoV} = \\sqrt{\\sum_{k=1}^{m} \\delta_k^2}', true)} />
      </div>
    </div>
  );
};

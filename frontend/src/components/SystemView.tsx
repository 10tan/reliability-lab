import React, { useState } from 'react';
import { GitMerge, Layers } from 'lucide-react';

export const SystemView: React.FC = () => {
  const [systemType, setSystemType] = useState('series');
  const [betas, setBetas] = useState('3.2, 3.5, 3.8');
  const [correlation, setCorrelation] = useState('0.3');
  const [result, setResult] = useState<any>(null);

  const handleCompute = () => {
    const betaArr = betas.split(',').map((s) => parseFloat(s.trim()) || 3.0);
    const rho = parseFloat(correlation) || 0.0;
    const dim = betaArr.length;

    const corrMat: number[][] = [];
    for (let i = 0; i < dim; i++) {
      corrMat[i] = [];
      for (let j = 0; j < dim; j++) {
        corrMat[i][j] = i === j ? 1.0 : rho;
      }
    }

    // Call system reliability calculation
    fetch('/api/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        betas: betaArr,
        correlation_matrix: corrMat,
        system_type: systemType
      })
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">System Reliability Block Diagram</h1>
          <p className="page-subtitle">Series, Parallel, and Cut-Set formulations via Genz MVN integration</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="ui-card">
          <h3 className="card-title">System Architecture Setup</h3>
          <div className="form-group">
            <label className="form-label">System Formulation</label>
            <select className="form-select" value={systemType} onChange={(e) => setSystemType(e.target.value)}>
              <option value="series">Series System (Fails if ANY component fails)</option>
              <option value="parallel">Parallel System (Fails if ALL components fail)</option>
              <option value="cut_set">Minimal Cut Sets (Redundant Network)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Component Reliability Indices (&beta;1, &beta;2, ...)</label>
            <input
              className="form-input font-mono"
              type="text"
              value={betas}
              onChange={(e) => setBetas(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Off-Diagonal Component Correlation (&rho;)</label>
            <input
              className="form-input font-mono"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={correlation}
              onChange={(e) => setCorrelation(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleCompute}>
            <GitMerge size={16} /> Evaluate System Reliability
          </button>
        </div>

        {result && (
          <div className="ui-card">
            <h3 className="card-title">System Evaluation Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SYSTEM FAILURE PROBABILITY (Pf_sys)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                  {result.pf_system ? result.pf_system.toExponential(4) : 'N/A'}
                </div>
              </div>

              <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SYSTEM RELIABILITY INDEX (&beta;_sys)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {result.beta_system ? result.beta_system.toFixed(3) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

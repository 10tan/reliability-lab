import React, { useState } from 'react';
import { ModelSpec, SimulationResult } from '../types';
import { Play, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SimulationWorkbenchProps {
  modelSpec: ModelSpec;
  onRunSimulation: (method: string, nSamples: number, p0: number) => Promise<SimulationResult>;
}

export const SimulationWorkbench: React.FC<SimulationWorkbenchProps> = ({ modelSpec, onRunSimulation }) => {
  const [method, setMethod] = useState('subset_simulation');
  const [nSamples, setNSamples] = useState(1000);
  const [p0, setP0] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await onRunSimulation(method, nSamples, p0);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">Simulation Workbench</h1>
          <p className="page-subtitle">Execute rare-event estimation (Subset Sim, Importance Sampling, Surrogates)</p>
        </div>
      </div>

      <div className="card-grid">
        {/* Run Controls */}
        <div className="ui-card">
          <h3 className="card-title">Run Parameters</h3>
          <div className="form-group">
            <label className="form-label">Simulation Method</label>
            <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="subset_simulation">Subset Simulation (Au & Beck 2001 - Rare Event)</option>
              <option value="importance_sampling">Adaptive Importance Sampling (Cross-Entropy)</option>
              <option value="pce">Polynomial Chaos Expansion (PCE Surrogate)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Samples Per Level / Total</label>
            <input
              className="form-input font-mono"
              type="number"
              value={nSamples}
              onChange={(e) => setNSamples(parseInt(e.target.value) || 1000)}
            />
          </div>

          {method === 'subset_simulation' && (
            <div className="form-group">
              <label className="form-label">Conditional Probability p0</label>
              <input
                className="form-input font-mono"
                type="number"
                step="0.01"
                value={p0}
                onChange={(e) => setP0(parseFloat(e.target.value) || 0.1)}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" /> Executing Simulation...
              </>
            ) : (
              <>
                <Play size={16} /> Execute {method === 'subset_simulation' ? 'Subset Sim' : 'Runner'}
              </>
            )}
          </button>
        </div>

        {/* Model Summary Badge Card */}
        <div className="ui-card">
          <h3 className="card-title">Active Model Context</h3>
          <div style={{ fontSize: '13px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Name:</strong> {modelSpec.name}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Limit State:</strong> <code className="font-mono">g(X) = {modelSpec.limit_state_expr}</code>
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Copula:</strong> <span className="badge badge-blue">{modelSpec.copula_type.toUpperCase()}</span>
            </p>
            <p>
              <strong>Marginals ({modelSpec.marginals.length}):</strong>{' '}
              {modelSpec.marginals.map((m) => m.name).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="ui-card" style={{ marginTop: '20px' }}>
          <div className="card-title">
            <span>Simulation Execution Results (Run ID: {result.run_id})</span>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> CONVERGED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>FAILURE PROBABILITY (Pf)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                {result.pf.toExponential(4)}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>RELIABILITY INDEX (&beta;)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {result.beta.toFixed(3)}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>COEFFICIENT OF VARIATION (CoV)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                {(result.cov * 100).toFixed(2)}%
              </div>
            </div>

            <div style={{ padding: '12px', background: '#FAFBFD', borderRadius: '6px', border: '1px solid #E3E7EC' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TOTAL EVALUATIONS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {result.total_evaluations}
              </div>
            </div>
          </div>

          {/* Level Breakdown Table if Subset Simulation */}
          {result.levels && result.levels.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Level-by-Level Conditional Subset Diagnostics</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Intermediate Threshold (b_k)</th>
                    <th>Conditional P(F_k)</th>
                    <th>Function Evals</th>
                    <th>MMH Acceptance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {result.levels.map((lvl) => (
                    <tr key={lvl.level}>
                      <td className="font-mono">Level {lvl.level}</td>
                      <td className="font-mono">{lvl.threshold.toFixed(4)}</td>
                      <td className="font-mono">{lvl.p_conditional.toFixed(4)}</td>
                      <td className="font-mono">{lvl.n_evals}</td>
                      <td className="font-mono">{(lvl.acceptance_rate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

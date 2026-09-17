import React, { useState } from 'react';
import { ModelSpec } from '../types';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ModelBuilderProps {
  onSaveModel: (spec: ModelSpec) => void;
}

export const ModelBuilder: React.FC<ModelBuilderProps> = ({ onSaveModel }) => {
  const [modelName, setModelName] = useState('Offshore Jacket Leg Reliability');
  const [copulaType, setCopulaType] = useState('gaussian');
  const [limitStateExpr, setLimitStateExpr] = useState('R - S');
  const [marginals, setMarginals] = useState([
    { name: 'R', dist_type: 'lognormal', params: { mean: 120.0, std: 12.0 } },
    { name: 'S', dist_type: 'gumbel', params: { loc: 50.0, scale: 10.0 } }
  ]);
  const [saved, setSaved] = useState(false);

  const handleAddMarginal = () => {
    const nextIdx = marginals.length + 1;
    setMarginals([
      ...marginals,
      { name: `X${nextIdx}`, dist_type: 'normal', params: { mean: 0.0, std: 1.0 } }
    ]);
  };

  const handleRemoveMarginal = (idx: number) => {
    setMarginals(marginals.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveModel({
      name: modelName,
      marginals,
      copula_type: copulaType,
      limit_state_expr: limitStateExpr
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const loadBenchmark = (type: string) => {
    if (type === 'linear') {
      setModelName('Linear Limit-State Benchmark');
      setLimitStateExpr('3.0 * 1.4142 - (X1 + X2)');
      setMarginals([
        { name: 'X1', dist_type: 'normal', params: { mean: 0, std: 1 } },
        { name: 'X2', dist_type: 'normal', params: { mean: 0, std: 1 } }
      ]);
    } else if (type === 'parabolic') {
      setModelName('Parabolic Limit-State Benchmark');
      setLimitStateExpr('5.0 - X2 - 0.5 * X1**2');
      setMarginals([
        { name: 'X1', dist_type: 'normal', params: { mean: 0, std: 1 } },
        { name: 'X2', dist_type: 'normal', params: { mean: 0, std: 1 } }
      ]);
    } else if (type === 'rackwitz') {
      setModelName('Rackwitz-Fiessler Beam Benchmark');
      setLimitStateExpr('R - S');
      setMarginals([
        { name: 'R', dist_type: 'lognormal', params: { mean: 1.0, std: 0.05 } },
        { name: 'S', dist_type: 'gumbel', params: { loc: 0.5, scale: 0.1 } }
      ]);
    }
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">Model Builder & Copula Setup</h1>
          <p className="page-subtitle">Configure joint input distributions, copulas, and performance function g(X)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('linear')}>Linear</button>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('parabolic')}>Parabolic</button>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('rackwitz')}>Rackwitz-Fiessler</button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-grid">
          {/* General Model Setup */}
          <div className="ui-card">
            <h3 className="card-title">General Specification</h3>
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input
                className="form-input"
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Joint Distribution Copula</label>
              <select
                className="form-select"
                value={copulaType}
                onChange={(e) => setCopulaType(e.target.value)}
              >
                <option value="gaussian">Gaussian Copula (Linear correlation matrix)</option>
                <option value="clayton">Clayton Copula (Lower tail dependence)</option>
                <option value="gumbel">Gumbel Copula (Upper tail dependence)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Performance Function g(X) (Failure when g(X) &le; 0)</label>
              <input
                className="form-input code-font"
                type="text"
                value={limitStateExpr}
                onChange={(e) => setLimitStateExpr(e.target.value)}
              />
            </div>
          </div>

          {/* Marginals Setup */}
          <div className="ui-card" style={{ gridColumn: 'span 2' }}>
            <div className="card-title">
              <span>Random Variables ({marginals.length})</span>
              <button type="button" className="btn btn-secondary" onClick={handleAddMarginal} style={{ padding: '4px 10px', fontSize: '12px' }}>
                <Plus size={14} /> Add Variable
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Variable Name</th>
                  <th>Distribution Type</th>
                  <th>Parameter 1</th>
                  <th>Parameter 2</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {marginals.map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="form-input code-font"
                        value={m.name}
                        onChange={(e) => {
                          const copy = [...marginals];
                          copy[idx].name = e.target.value;
                          setMarginals(copy);
                        }}
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={m.dist_type}
                        onChange={(e) => {
                          const copy = [...marginals];
                          copy[idx].dist_type = e.target.value;
                          setMarginals(copy);
                        }}
                      >
                        <option value="normal">Normal</option>
                        <option value="lognormal">Lognormal</option>
                        <option value="weibull">Weibull</option>
                        <option value="gumbel">Gumbel</option>
                        <option value="uniform">Uniform</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-input font-mono"
                        type="number"
                        step="any"
                        value={Object.values(m.params)[0] ?? 0}
                        onChange={(e) => {
                          const copy = [...marginals];
                          const keys = Object.keys(copy[idx].params);
                          copy[idx].params[keys[0] || 'mean'] = parseFloat(e.target.value);
                          setMarginals(copy);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input font-mono"
                        type="number"
                        step="any"
                        value={Object.values(m.params)[1] ?? 1}
                        onChange={(e) => {
                          const copy = [...marginals];
                          const keys = Object.keys(copy[idx].params);
                          copy[idx].params[keys[1] || 'std'] = parseFloat(e.target.value);
                          setMarginals(copy);
                        }}
                      />
                    </td>
                    <td>
                      {marginals.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleRemoveMarginal(idx)}
                          style={{ color: 'var(--color-danger)', padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary">
            Save Model Configuration
          </button>
          {saved && (
            <span style={{ color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} /> Saved model successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

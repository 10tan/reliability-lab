import React, { useState } from 'react';
import katex from 'katex';
import { Play, GitMerge, Layers, Target, Plus, Trash2 } from 'lucide-react';

const renderMath = (tex: string, displayMode = false) => ({
  __html: katex.renderToString(tex, { throwOnError: false, displayMode })
});

function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327;
  const p = d * Math.exp(-x * x / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

function normInvCDF(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p < 0.5) return -normInvCDF(1 - p);
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

type SysType = 'series' | 'parallel' | 'cutset';

interface ComponentDef {
  id: string;
  beta: number;
}

const sysFormulas: Record<SysType, string> = {
  series: 'P_{f,\\text{sys}} \\approx 1 - \\prod_{i=1}^n \\left(1 - \\Phi(-\\beta_i)\\right)',
  parallel: 'P_{f,\\text{sys}} \\approx \\prod_{i=1}^n \\Phi(-\\beta_i)',
  cutset: '\\max_i P_{f,i} \\;\\leq\\; P_{f,\\text{sys}} \\;\\leq\\; \\min\\!\\left(1,\\; \\sum_{i=1}^n P_{f,i}\\right)'
};

export const SystemView: React.FC = () => {
  const [sysType, setSysType] = useState<SysType>('series');
  const [components, setComponents] = useState<ComponentDef[]>([
    { id: 'C1', beta: 3.5 },
    { id: 'C2', beta: 3.2 },
    { id: 'C3', beta: 4.0 },
  ]);
  const [results, setResults] = useState<{ pf: number; beta: number; pf_bounds?: [number, number] } | null>(null);
  const [computed, setComputed] = useState(false);

  const handleAddComponent = () => {
    setComponents([...components, { id: `C${components.length + 1}`, beta: 3.0 }]);
  };

  const handleRemoveComponent = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const calculateSystem = () => {
    const pf_i = components.map(c => normCDF(-c.beta));
    if (sysType === 'series') {
      const p_safe = pf_i.reduce((acc, pf) => acc * (1 - pf), 1);
      const pf_sys = 1 - p_safe;
      setResults({ pf: pf_sys, beta: -normInvCDF(pf_sys) });
    } else if (sysType === 'parallel') {
      const pf_sys = pf_i.reduce((acc, pf) => acc * pf, 1);
      setResults({ pf: pf_sys, beta: -normInvCDF(pf_sys) });
    } else if (sysType === 'cutset') {
      const pf_max = Math.max(...pf_i);
      const pf_sum = pf_i.reduce((a, b) => a + b, 0);
      setResults({ pf: pf_max, beta: -normInvCDF(pf_max), pf_bounds: [pf_max, Math.min(1, pf_sum)] });
    }
    setComputed(true);
  };

  // SVG color scheme dynamically powered by theme CSS variables
  const seriesColors = { fill: 'var(--chart-series-fill)', stroke: 'var(--chart-series-stroke)', text: 'var(--text-primary)', subtext: 'var(--accent-blue)' };
  const parallelColors = { fill: 'var(--chart-parallel-fill)', stroke: 'var(--chart-parallel-stroke)', text: 'var(--text-primary)', subtext: 'var(--accent-purple)' };
  const lineColor = 'var(--chart-grid-line)';

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 className="page-title">System Reliability Block Diagram</h1>
          <p className="page-subtitle">Series, Parallel, and Cut-Set formulations via Genz MVN integration</p>
        </div>
      </div>

      <div className="card-grid">
        {/* Configuration */}
        <div className="ui-card">
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} /> System Architecture Setup
            </span>
          </h3>
          <div className="form-group">
            <label className="form-label">System Formulation</label>
            <select className="form-select" value={sysType} onChange={(e) => setSysType(e.target.value as SysType)}>
              <option value="series">Series System (Fails if ANY component fails)</option>
              <option value="parallel">Parallel System (Fails if ALL components fail)</option>
              <option value="cutset">Minimal Cut Sets (Ditlevsen Bounds)</option>
            </select>
          </div>

          {/* System Formula */}
          <div className="math-display" dangerouslySetInnerHTML={renderMath(sysFormulas[sysType], true)} />

          {/* Components List */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="form-label" style={{ margin: 0 }}>Components ({components.length})</label>
              <button type="button" className="btn btn-secondary" onClick={handleAddComponent}
                style={{ padding: '4px 10px', fontSize: '12px' }}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {components.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    className="form-input font-mono"
                    style={{ width: '70px' }}
                    value={c.id}
                    onChange={(e) => {
                      const copy = [...components];
                      copy[i] = { ...copy[i], id: e.target.value };
                      setComponents(copy);
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>β =</span>
                  <input
                    className="form-input font-mono"
                    style={{ width: '90px' }}
                    type="number"
                    step="0.1"
                    value={c.beta}
                    onChange={(e) => {
                      const copy = [...components];
                      copy[i] = { ...copy[i], beta: parseFloat(e.target.value) || 3.0 };
                      setComponents(copy);
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Pf = {normCDF(-c.beta).toExponential(2)}
                  </span>
                  {components.length > 1 && (
                    <button type="button" className="btn btn-secondary" onClick={() => handleRemoveComponent(i)}
                      style={{ padding: '4px', color: 'var(--accent-red)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={calculateSystem}>
            <GitMerge size={16} /> Evaluate System Reliability
          </button>
        </div>

        {/* Results */}
        <div className="ui-card">
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} /> System Evaluation Results
            </span>
            {computed && <span className="badge badge-green">Computed</span>}
          </h3>

          {results ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="stat-card">
                <div className="stat-label">System Failure Probability (Pf_sys)</div>
                <div className="stat-value">{results.pf.toExponential(4)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">System Reliability Index (β_sys)</div>
                <div className="stat-value purple">{results.beta.toFixed(4)}</div>
              </div>
              {results.pf_bounds && (
                <div className="stat-card">
                  <div className="stat-label">Ditlevsen Bounds [Lower, Upper]</div>
                  <div className="stat-value orange" style={{ fontSize: '16px' }}>
                    [{results.pf_bounds[0].toExponential(3)}, {results.pf_bounds[1].toExponential(3)}]
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <GitMerge size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>Configure components and click "Evaluate" to compute system reliability</p>
            </div>
          )}
        </div>
      </div>

      {/* Block Diagram */}
      <div className="ui-card" style={{ marginTop: '20px' }}>
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} /> Block Diagram Visualization
          </span>
          <span className="badge badge-blue">{sysType.toUpperCase()}</span>
        </div>

        <div className="block-diagram">
          {sysType === 'series' && (
            <svg width={Math.max(400, components.length * 150)} height="90" viewBox={`0 0 ${components.length * 150} 90`}>
              {/* Input line */}
              <circle cx="10" cy="45" r="6" fill={seriesColors.stroke} />
              <line x1="16" y1="45" x2="25" y2="45" stroke={lineColor} strokeWidth="2" />

              {components.map((c, i) => (
                <g key={i}>
                  {/* Connecting line */}
                  {i > 0 && <line x1={i * 140 - 15} y1="45" x2={i * 140 + 25} y2="45" stroke={lineColor} strokeWidth="2" />}
                  {/* Block */}
                  <rect x={i * 140 + 25} y="15" width="110" height="60" rx="8"
                    fill={seriesColors.fill} stroke={seriesColors.stroke} strokeWidth="1.5" />
                  <text x={i * 140 + 80} y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill={seriesColors.text}>{c.id}</text>
                  <text x={i * 140 + 80} y="58" textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={seriesColors.subtext}>β = {c.beta}</text>
                </g>
              ))}

              {/* Output line */}
              <line x1={components.length * 140 - 5} y1="45" x2={components.length * 140 + 15} y2="45" stroke={lineColor} strokeWidth="2" />
              <circle cx={components.length * 140 + 21} cy="45" r="6" fill={seriesColors.stroke} />
            </svg>
          )}

          {sysType === 'parallel' && (
            <svg width="300" height={Math.max(120, components.length * 75 + 30)} viewBox={`0 0 300 ${components.length * 75 + 30}`}>
              {/* Input node */}
              <circle cx="20" cy={components.length * 37.5 + 15} r="6" fill={parallelColors.stroke} />

              {/* Left bus */}
              <line x1="26" y1={components.length * 37.5 + 15} x2="50" y2={components.length * 37.5 + 15} stroke={lineColor} strokeWidth="2" />
              <line x1="50" y1="40" x2="50" y2={components.length * 75 - 10} stroke={lineColor} strokeWidth="2" />

              {/* Right bus */}
              <line x1="250" y1="40" x2="250" y2={components.length * 75 - 10} stroke={lineColor} strokeWidth="2" />
              <line x1="250" y1={components.length * 37.5 + 15} x2="274" y2={components.length * 37.5 + 15} stroke={lineColor} strokeWidth="2" />

              {/* Output node */}
              <circle cx="280" cy={components.length * 37.5 + 15} r="6" fill={parallelColors.stroke} />

              {components.map((c, i) => (
                <g key={i}>
                  <line x1="50" y1={i * 75 + 40} x2="75" y2={i * 75 + 40} stroke={lineColor} strokeWidth="2" />
                  <rect x="75" y={i * 75 + 12} width="150" height="56" rx="8"
                    fill={parallelColors.fill} stroke={parallelColors.stroke} strokeWidth="1.5" />
                  <text x="150" y={i * 75 + 35} textAnchor="middle" fontSize="14" fontWeight="bold" fill={parallelColors.text}>{c.id}</text>
                  <text x="150" y={i * 75 + 55} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={parallelColors.subtext}>β = {c.beta}</text>
                  <line x1="225" y1={i * 75 + 40} x2="250" y2={i * 75 + 40} stroke={lineColor} strokeWidth="2" />
                </g>
              ))}
            </svg>
          )}

          {sysType === 'cutset' && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              <GitMerge size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>Cut-set analysis combines series and parallel configurations.</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Ditlevsen bounds provide tight estimates for mixed topologies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Component Breakdown Table */}
      {computed && results && (
        <div className="ui-card animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="card-title">
            <span>Component-by-Component Breakdown</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Component ID</th>
                <th>Reliability Index (β)</th>
                <th>Component Pf</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => {
                const pf = normCDF(-c.beta);
                return (
                  <tr key={i}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{c.id}</td>
                    <td className="font-mono">{c.beta.toFixed(3)}</td>
                    <td className="font-mono">{pf.toExponential(4)}</td>
                    <td>
                      <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (pf / results.pf) * 100)}%`,
                          height: '100%',
                          background: 'var(--accent-blue)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

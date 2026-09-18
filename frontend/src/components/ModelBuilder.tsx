import React, { useState, useMemo } from 'react';
import katex from 'katex';
import { Plus, Trash2, CheckCircle2, Cpu, BookOpen, BarChart3, Settings, Eye, Sliders, Layers, Activity } from 'lucide-react';
import { ModelSpec } from '../types';

const renderMath = (tex: string, displayMode = false) => ({
  __html: katex.renderToString(tex, { throwOnError: false, displayMode })
});

const distFormulas: Record<string, string> = {
  normal: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)',
  lognormal: 'f(x) = \\frac{1}{x\\zeta\\sqrt{2\\pi}} \\exp\\!\\left(-\\frac{(\\ln x - \\lambda)^2}{2\\zeta^2}\\right)',
  weibull: 'f(x) = \\frac{k}{\\lambda}\\left(\\frac{x}{\\lambda}\\right)^{k-1} e^{-(x/\\lambda)^k}',
  gumbel: 'f(x) = \\frac{1}{\\beta} \\exp\\!\\left(-z - e^{-z}\\right), \\quad z = \\frac{x-\\mu}{\\beta}',
  uniform: 'f(x) = \\frac{1}{b-a}, \\quad a \\leq x \\leq b'
};

const copulaFormulas: Record<string, string> = {
  gaussian: 'C_R(\\mathbf{u}) = \\Phi_R\\!\\left(\\Phi^{-1}(u_1), \\dots, \\Phi^{-1}(u_n)\\right)',
  clayton: 'C_\\theta(\\mathbf{u}) = \\left(\\sum_{i=1}^n u_i^{-\\theta} - n + 1\\right)^{-1/\\theta}',
  gumbel: 'C_\\theta(\\mathbf{u}) = \\exp\\!\\left(-\\left[\\sum_{i=1}^n (-\\ln u_i)^\\theta\\right]^{1/\\theta}\\right)',
  frank: 'C_\\theta(u, v) = -\\frac{1}{\\theta}\\ln\\left(1 + \\frac{(e^{-\\theta u}-1)(e^{-\\theta v}-1)}{e^{-\\theta}-1}\\right)'
};

const paramLabels: Record<string, [string, string]> = {
  normal: ['Mean (μ)', 'Std Dev (σ)'],
  lognormal: ['Mean (μ)', 'Std Dev (σ)'],
  weibull: ['Shape (k)', 'Scale (λ)'],
  gumbel: ['Location (μ)', 'Scale (β)'],
  uniform: ['Lower (a)', 'Upper (b)']
};

// Box-Muller transform
function randn(): number {
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Generate 2D samples under Copula
function generateCopulaSamples(type: string, theta: number, n: number = 250) {
  const samples: { u1: number; u2: number }[] = [];
  for (let i = 0; i < n; i++) {
    let u1 = Math.random();
    let u2 = Math.random();

    if (type === 'gaussian') {
      const z1 = randn();
      const z2 = randn();
      const rho = Math.min(0.95, Math.max(-0.95, theta));
      const x1 = z1;
      const x2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
      // Convert to uniform via normcdf
      const normCDF = (x: number) => {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989422804014327;
        const p = d * Math.exp(-x * x / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - p : p;
      };
      u1 = normCDF(x1);
      u2 = normCDF(x2);
    } else if (type === 'clayton') {
      // Clayton copula sampling via conditional CDF
      const v1 = Math.random();
      const v2 = Math.random();
      u1 = v1;
      const th = Math.max(0.1, theta);
      u2 = Math.pow(Math.pow(v1, -th) * (Math.pow(v2, -th / (1 + th)) - 1) + 1, -1 / th);
    } else if (type === 'gumbel') {
      // Gumbel copula approximation
      const z1 = randn();
      const z2 = randn();
      const rho = 0.3 + 0.5 * Math.min(1, theta / 5);
      const x1 = z1;
      const x2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
      const normCDF = (x: number) => 0.5 * (1 + Math.erf?.(x / Math.SQRT2) || (x > 0 ? 0.9 : 0.1));
      u1 = Math.max(0.01, Math.min(0.99, normCDF(x1)));
      u2 = Math.max(0.01, Math.min(0.99, normCDF(x2)));
    }
    samples.push({ u1: Math.max(0.01, Math.min(0.99, u1)), u2: Math.max(0.01, Math.min(0.99, u2)) });
  }
  return samples;
}

const DistPreview: React.FC<{ type: string }> = ({ type }) => {
  const paths: Record<string, string> = {
    normal: 'M2,22 Q8,22 12,18 Q16,14 20,4 Q24,14 28,18 Q32,22 38,22',
    lognormal: 'M2,22 Q6,22 10,10 Q12,2 14,6 Q18,16 26,20 Q32,22 38,22',
    weibull: 'M2,22 Q4,22 8,20 Q12,16 16,6 Q20,2 22,4 Q26,14 32,20 Q36,22 38,22',
    gumbel: 'M2,22 Q6,22 10,20 Q14,14 18,4 Q20,2 22,6 Q26,16 38,22',
    uniform: 'M2,22 L12,22 L12,6 L28,6 L28,22 L38,22'
  };
  return (
    <svg width="44" height="26" viewBox="0 0 40 24" style={{ opacity: 0.85 }}>
      <path d={paths[type] || paths.normal} fill="none" stroke="var(--accent-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface ModelBuilderProps {
  onSaveModel: (spec: ModelSpec) => void;
}

export const ModelBuilder: React.FC<ModelBuilderProps> = ({ onSaveModel }) => {
  const [modelName, setModelName] = useState('Offshore Jacket Leg Reliability');
  const [copulaType, setCopulaType] = useState('gaussian');
  const [copulaParam, setCopulaParam] = useState<number>(0.5);
  const [limitStateExpr, setLimitStateExpr] = useState('R - S');
  const [marginals, setMarginals] = useState([
    { name: 'R', dist_type: 'lognormal', params: { mean: 120.0, std: 12.0 } },
    { name: 'S', dist_type: 'gumbel', params: { loc: 50.0, scale: 10.0 } }
  ]);
  const [saved, setSaved] = useState(false);
  const [showDistFormula, setShowDistFormula] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'scatter' | 'contour'>('scatter');

  // Copula 2D scatter sample points
  const copulaScatterPoints = useMemo(() => {
    return generateCopulaSamples(copulaType, copulaParam, 300);
  }, [copulaType, copulaParam]);

  // Compute copula metrics
  const copulaMetrics = useMemo(() => {
    let kendallTau = 0;
    let spearmanRho = 0;
    let lowerTail = '0.00';
    let upperTail = '0.00';

    if (copulaType === 'gaussian') {
      spearmanRho = copulaParam;
      kendallTau = (2 / Math.PI) * Math.asin(copulaParam);
      lowerTail = '0.00 (No Tail Dep)';
      upperTail = '0.00 (No Tail Dep)';
    } else if (copulaType === 'clayton') {
      kendallTau = copulaParam / (copulaParam + 2);
      spearmanRho = 12 * Math.pow(2, -2 / copulaParam); // approx
      lowerTail = Math.pow(2, -1 / Math.max(0.1, copulaParam)).toFixed(4);
      upperTail = '0.00';
    } else if (copulaType === 'gumbel') {
      kendallTau = 1 - 1 / Math.max(1, copulaParam);
      lowerTail = '0.00';
      upperTail = (2 - Math.pow(2, 1 / Math.max(1, copulaParam))).toFixed(4);
    } else if (copulaType === 'frank') {
      kendallTau = 1 - 4 / copulaParam * (1 - 1 / (1 + Math.exp(copulaParam)));
      lowerTail = '0.00';
      upperTail = '0.00';
    }

    return { kendallTau: kendallTau.toFixed(3), spearmanRho: spearmanRho.toFixed(3), lowerTail, upperTail };
  }, [copulaType, copulaParam]);

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
      setCopulaType('gaussian');
      setCopulaParam(0.0);
      setMarginals([
        { name: 'X1', dist_type: 'normal', params: { mean: 0, std: 1 } },
        { name: 'X2', dist_type: 'normal', params: { mean: 0, std: 1 } }
      ]);
    } else if (type === 'parabolic') {
      setModelName('Parabolic Limit-State Benchmark');
      setLimitStateExpr('5.0 - X2 - 0.5 * X1**2');
      setCopulaType('gaussian');
      setCopulaParam(0.3);
      setMarginals([
        { name: 'X1', dist_type: 'normal', params: { mean: 0, std: 1 } },
        { name: 'X2', dist_type: 'normal', params: { mean: 0, std: 1 } }
      ]);
    } else if (type === 'rackwitz') {
      setModelName('Rackwitz-Fiessler R-S Benchmark');
      setLimitStateExpr('R - S');
      setCopulaType('gaussian');
      setCopulaParam(0.15);
      setMarginals([
        { name: 'R', dist_type: 'lognormal', params: { mean: 120.0, std: 12.0 } },
        { name: 'S', dist_type: 'gumbel', params: { loc: 50.0, scale: 10.0 } }
      ]);
    }
  };

  const getParamKeys = (dist_type: string): [string, string] => {
    switch (dist_type) {
      case 'gumbel': return ['loc', 'scale'];
      case 'weibull': return ['mean', 'std'];
      case 'uniform': return ['mean', 'std'];
      default: return ['mean', 'std'];
    }
  };

  return (
    <div>
      {/* Top Bar Header */}
      <div className="top-header">
        <div>
          <h1 className="page-title">Model Builder &amp; Copula Setup</h1>
          <p className="page-subtitle">Configure joint input distributions, copula dependence structure, and limit state function g(X)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('linear')}>
            <BookOpen size={14} /> Linear
          </button>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('parabolic')}>
            <BarChart3 size={14} /> Parabolic
          </button>
          <button className="btn btn-secondary" onClick={() => loadBenchmark('rackwitz')}>
            <Cpu size={14} /> Rackwitz-Fiessler
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* General Model Setup */}
          <div className="ui-card">
            <h3 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} /> General Specification &amp; Limit State
              </span>
            </h3>
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
              <label className="form-label">
                Performance Function g(X) — Failure occurs when g(X) ≤ 0
              </label>
              <input
                className="form-input code-font"
                type="text"
                value={limitStateExpr}
                onChange={(e) => setLimitStateExpr(e.target.value)}
                placeholder="e.g. R - S  or  5.0 - X2 - 0.5 * X1**2"
              />
              <div className="math-display" style={{ marginTop: '8px' }}>
                <span dangerouslySetInnerHTML={renderMath(`g(\\mathbf{X}) = ${limitStateExpr}`, true)} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Joint Distribution Copula Model</label>
              <select
                className="form-select"
                value={copulaType}
                onChange={(e) => {
                  const t = e.target.value;
                  setCopulaType(t);
                  if (t === 'clayton') setCopulaParam(2.0);
                  else if (t === 'gumbel') setCopulaParam(2.0);
                  else if (t === 'frank') setCopulaParam(4.0);
                  else setCopulaParam(0.5);
                }}
              >
                <option value="gaussian">Gaussian Copula (Symmetric dependence, zero tail dependence)</option>
                <option value="clayton">Clayton Copula (Strong lower tail dependence - structural strength)</option>
                <option value="gumbel">Gumbel Copula (Strong upper tail dependence - extreme loads)</option>
                <option value="frank">Frank Copula (Symmetric Archimedean dependence)</option>
              </select>
            </div>

            {/* Copula Parameter Slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Copula Parameter (θ / ρ): <strong style={{ color: 'var(--accent-blue)' }}>{copulaParam}</strong></label>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {copulaType === 'gaussian' ? '[-0.9, 0.9]' : '[0.1, 10.0]'}
                </span>
              </div>
              <input
                type="range"
                min={copulaType === 'gaussian' ? '-0.9' : '0.1'}
                max={copulaType === 'gaussian' ? '0.9' : '8.0'}
                step="0.05"
                value={copulaParam}
                onChange={(e) => setCopulaParam(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {copulaFormulas[copulaType] && (
              <div className="math-display" style={{ marginTop: '10px' }}
                dangerouslySetInnerHTML={renderMath(copulaFormulas[copulaType], true)} />
            )}
          </div>

          {/* Interactive Copula & Limit State Visualizer */}
          <div className="ui-card">
            <div className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> Interactive Copula &amp; Joint Space Visualizer
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn ${previewMode === 'scatter' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreviewMode('scatter')}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <Eye size={12} /> Copula Scatter
                </button>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div style={{ background: 'var(--bg-app)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '14px', right: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                300 Copula Monte Carlo Samples
              </div>
              <svg viewBox="0 0 350 240" style={{ width: '100%', height: '280px' }}>
                {/* Axes */}
                <line x1="30" y1="210" x2="330" y2="210" stroke="var(--border-color)" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="210" stroke="var(--border-color)" strokeWidth="2" />

                {/* Gridlines */}
                <line x1="180" y1="20" x2="180" y2="210" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1="30" y1="115" x2="330" y2="115" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                {/* Scatter Points */}
                {copulaScatterPoints.map((pt, i) => {
                  const cx = 30 + pt.u1 * 300;
                  const cy = 210 - pt.u2 * 190;
                  const isTail = pt.u1 < 0.2 && pt.u2 < 0.2;
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={isTail ? 4 : 2.8}
                      fill={isTail ? 'var(--accent-red)' : 'var(--accent-blue)'}
                      opacity={isTail ? 0.95 : 0.7}
                    />
                  );
                })}

                {/* Labels */}
                <text x="330" y="232" fill="var(--text-muted)" fontSize="11" textAnchor="end">U₁ (CDF X₁)</text>
                <text x="5" y="18" fill="var(--text-muted)" fontSize="11">U₂ (CDF X₂)</text>
              </svg>
            </div>

            {/* Copula Dependence Metrics Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div className="stat-label">Kendall's Rank Tau (τ)</div>
                <div className="stat-value blue" style={{ fontSize: '24px' }}>{copulaMetrics.kendallTau}</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div className="stat-label">Spearman's Rho (ρₛ)</div>
                <div className="stat-value purple" style={{ fontSize: '24px' }}>{copulaMetrics.spearmanRho}</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div className="stat-label">Lower Tail Dep (λ_L)</div>
                <div className="stat-value green" style={{ fontSize: '20px' }}>{copulaMetrics.lowerTail}</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div className="stat-label">Upper Tail Dep (λ_U)</div>
                <div className="stat-value orange" style={{ fontSize: '20px' }}>{copulaMetrics.upperTail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Random Variables Table */}
        <div className="ui-card" style={{ marginTop: '20px' }}>
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} /> Random Input Variables ({marginals.length})
            </span>
            <button type="button" className="btn btn-secondary" onClick={handleAddMarginal}
              style={{ padding: '6px 12px', fontSize: '12px' }}>
              <Plus size={14} /> Add Variable
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Variable Name</th>
                <th>Distribution Type</th>
                <th>PDF Curve</th>
                <th>Parameter 1</th>
                <th>Parameter 2</th>
                <th>Analytical PDF Formula</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marginals.map((m, idx) => {
                const pKeys = getParamKeys(m.dist_type);
                const labels = paramLabels[m.dist_type] || ['Param 1', 'Param 2'];
                return (
                  <tr key={idx}>
                    <td>
                      <input
                        className="form-input code-font"
                        style={{ width: '90px' }}
                        value={m.name}
                        onChange={(e) => {
                          const copy = [...marginals];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setMarginals(copy);
                        }}
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: '130px' }}
                        value={m.dist_type}
                        onChange={(e) => {
                          const copy = [...marginals];
                          const newType = e.target.value;
                          const newKeys = getParamKeys(newType);
                          copy[idx] = {
                            ...copy[idx],
                            dist_type: newType,
                            params: { [newKeys[0]]: 0, [newKeys[1]]: 1 }
                          };
                          setMarginals(copy);
                        }}
                      >
                        <option value="normal">Normal (Gaussian)</option>
                        <option value="lognormal">Lognormal</option>
                        <option value="weibull">Weibull (Extreme)</option>
                        <option value="gumbel">Gumbel (Type-I)</option>
                        <option value="uniform">Uniform</option>
                      </select>
                    </td>
                    <td>
                      <DistPreview type={m.dist_type} />
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{labels[0]}</div>
                        <input
                          className="form-input font-mono"
                          style={{ width: '100px' }}
                          type="number"
                          step="any"
                          value={Object.values(m.params)[0] ?? 0}
                          onChange={(e) => {
                            const copy = [...marginals];
                            const keys = Object.keys(copy[idx].params);
                            copy[idx] = {
                              ...copy[idx],
                              params: { ...copy[idx].params, [keys[0] || pKeys[0]]: parseFloat(e.target.value) || 0 }
                            };
                            setMarginals(copy);
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{labels[1]}</div>
                        <input
                          className="form-input font-mono"
                          style={{ width: '100px' }}
                          type="number"
                          step="any"
                          value={Object.values(m.params)[1] ?? 1}
                          onChange={(e) => {
                            const copy = [...marginals];
                            const keys = Object.keys(copy[idx].params);
                            copy[idx] = {
                              ...copy[idx],
                              params: { ...copy[idx].params, [keys[1] || pKeys[1]]: parseFloat(e.target.value) || 0 }
                            };
                            setMarginals(copy);
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setShowDistFormula(showDistFormula === idx ? null : idx)}
                      >
                        {showDistFormula === idx ? 'Hide' : 'Show PDF Formula'}
                      </button>
                      {showDistFormula === idx && distFormulas[m.dist_type] && (
                        <div className="math-display" style={{ marginTop: '6px', padding: '8px', fontSize: '12px' }}>
                          <span dangerouslySetInnerHTML={renderMath(distFormulas[m.dist_type], false)} />
                        </div>
                      )}
                    </td>
                    <td>
                      {marginals.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleRemoveMarginal(idx)}
                          style={{ color: 'var(--accent-red)', padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">
            <CheckCircle2 size={16} /> Save &amp; Sync Model Configuration
          </button>
          {saved && (
            <span className="animate-fade-in" style={{ color: 'var(--accent-green)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Model saved successfully! Ready for simulation.
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { NavRail } from './components/NavRail';
import { ModelBuilder } from './components/ModelBuilder';
import { SimulationWorkbench } from './components/SimulationWorkbench';
import { SystemView } from './components/SystemView';
import { ReportViewer } from './components/ReportViewer';
import { ModelSpec, SimulationResult } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('model');
  const [modelSpec, setModelSpec] = useState<ModelSpec>({
    name: 'Offshore Jacket Leg Reliability',
    marginals: [
      { name: 'R', dist_type: 'lognormal', params: { mean: 120.0, std: 12.0 } },
      { name: 'S', dist_type: 'gumbel', params: { loc: 50.0, scale: 10.0 } }
    ],
    copula_type: 'gaussian',
    limit_state_expr: 'R - S'
  });
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const handleRunSimulation = async (method: string, nSamples: number, p0: number): Promise<SimulationResult> => {
    const response = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_spec: modelSpec,
        method: method,
        n_samples: nSamples,
        p0: p0,
        seed: 42
      })
    });
    if (!response.ok) {
      throw new Error('Simulation run failed');
    }
    const data: SimulationResult = await response.json();
    setLastRunId(data.run_id);
    return data;
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <NavRail activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-viewport">
        {activeTab === 'model' && <ModelBuilder onSaveModel={setModelSpec} />}
        {activeTab === 'simulation' && (
          <SimulationWorkbench modelSpec={modelSpec} onRunSimulation={handleRunSimulation} />
        )}
        {activeTab === 'system' && <SystemView />}
        {activeTab === 'reports' && <ReportViewer lastRunId={lastRunId} />}
      </main>
    </div>
  );
};

export interface Marginal {
  name: string;
  dist_type: string;
  params: Record<string, number>;
}

export interface ModelSpec {
  name: string;
  marginals: Marginal[];
  copula_type: string;
  limit_state_expr: string;
}

export interface SimulationResult {
  run_id: string;
  pf: number;
  beta: number;
  cov: number;
  method: string;
  total_evaluations: number;
  levels?: Array<{
    level: number;
    threshold: number;
    p_conditional: number;
    n_evals: number;
    acceptance_rate: number;
  }>;
  sobol_main?: number[];
  sobol_total?: number[];
  variables?: string[];
}

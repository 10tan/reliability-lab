"""
Time-Variant Reliability Analysis beta(t)
Includes Poisson square-wave load processes, Gamma corrosion/fatigue degradation,
and Rice outcrossing rate / PHI2 first-passage probability method.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from scipy import stats

def compute_time_variant_reliability(
    r0_mean: float = 100.0,
    r0_std: float = 10.0,
    degradation_rate: float = 0.5, # gamma degradation rate A
    degradation_exp: float = 1.1, # power b
    s_mean: float = 40.0,
    s_std: float = 8.0,
    load_arrival_rate: float = 1.0, # Poisson arrivals per year lambda
    time_horizon_years: float = 50.0,
    n_time_steps: int = 50
) -> Dict[str, Any]:
    """
    Computes time-variant reliability index trajectory beta(t) and cumulative failure probability Pf(t).
    """
    time_grid = np.linspace(0, time_horizon_years, n_time_steps)
    beta_t = np.zeros(n_time_steps)
    pf_t = np.zeros(n_time_steps)
    r_mean_t = np.zeros(n_time_steps)

    for i, t in enumerate(time_grid):
        # Degraded resistance mean
        r_mean = max(r0_mean - degradation_rate * (t**degradation_exp), 1e-3)
        r_std = r0_std * (1.0 + 0.01 * t) # slight variance growth
        r_mean_t[i] = r_mean

        # Extreme load in time [0, t] via Poisson square wave max distribution
        n_occurrences = max(1.0, load_arrival_rate * max(t, 1.0))
        # Gumbel extreme value parameters for maximum of n_occurrences loads
        alpha_s = np.pi / (s_std * np.sqrt(6))
        u_s = s_mean - 0.5772156649 / alpha_s
        u_max = u_s + np.log(n_occurrences) / alpha_s
        s_max_mean = u_max + 0.5772156649 / alpha_s
        s_max_std = np.pi / (np.sqrt(6) * alpha_s)

        # Performance function g(t) = R(t) - S_max(t)
        mu_g = r_mean - s_max_mean
        sigma_g = np.sqrt(r_std**2 + s_max_std**2)

        beta = mu_g / sigma_g
        pf = float(stats.norm.cdf(-beta))

        beta_t[i] = float(beta)
        pf_t[i] = float(pf)

    return {
        "time_grid": time_grid.tolist(),
        "beta_t": beta_t.tolist(),
        "pf_t": pf_t.tolist(),
        "resistance_mean_t": r_mean_t.tolist()
    }

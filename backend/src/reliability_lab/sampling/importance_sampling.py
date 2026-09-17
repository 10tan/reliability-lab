"""
Adaptive Importance Sampling (AIS) for Structural Reliability
Uses Cross-Entropy / Shifted Gaussian proposal density for variance reduction.
"""

from typing import Dict, Any, Tuple
import numpy as np
from scipy import stats
from .copula import JointDistribution
from .limit_state import LimitStateFunction

def run_importance_sampling(
    joint_dist: JointDistribution,
    limit_state: LimitStateFunction,
    n_samples: int = 5000,
    design_point_center: np.ndarray = None,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Executes Importance Sampling centered around an estimated design point U*.
    """
    rng = np.random.default_rng(seed)
    dim = joint_dist.dim

    if design_point_center is None:
        # Step 1: Initial Monte Carlo screening to find point with min g(X)
        screening_samples = joint_dist.sample(1000, rng=rng)
        g_vals = limit_state.evaluate(screening_samples)
        min_idx = np.argmin(g_vals)
        u_screen = joint_dist.to_standard_normal(screening_samples)
        design_point_center = u_screen[min_idx]

    # Proposal distribution in U-space: N(mu_prop, Sigma_prop)
    mu_prop = design_point_center
    sigma_prop = np.eye(dim)

    # Sample U from proposal h(u) ~ N(mu_prop, I)
    u_prop = rng.multivariate_normal(mu_prop, sigma_prop, size=n_samples)
    x_prop = joint_dist.from_standard_normal(u_prop)

    g_prop = limit_state.evaluate(x_prop)
    failed_mask = (g_prop <= 0)

    # Likelihood ratio: target f(u) = N(0, I) / proposal h(u) = N(mu_prop, I)
    log_f = stats.multivariate_normal.logpdf(u_prop, mean=np.zeros(dim), cov=np.eye(dim))
    log_h = stats.multivariate_normal.logpdf(u_prop, mean=mu_prop, cov=sigma_prop)
    weights = np.exp(log_f - log_h)

    # Importance sampling estimator of Pf
    pf = float(np.mean(failed_mask * weights))
    var_pf = float(np.var(failed_mask * weights, ddof=1) / n_samples)
    cov = float(np.sqrt(var_pf) / pf) if pf > 0 else 1.0

    beta = float(-stats.norm.ppf(pf)) if 0 < pf < 1 else 0.0

    return {
        "pf": pf,
        "beta": beta,
        "cov": cov,
        "n_samples": n_samples,
        "n_failed": int(np.sum(failed_mask)),
        "design_point_u": mu_prop.tolist()
    }

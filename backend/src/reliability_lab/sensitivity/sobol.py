"""
Global Sensitivity Analysis: Sobol Indices & Shapley Values for Correlated Inputs.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from ..surrogates.pce import PolynomialChaosExpansion

def compute_sobol_sensitivity_pce(pce_model: PolynomialChaosExpansion, var_names: List[str] = None) -> Dict[str, Any]:
    """
    Extracts closed-form Sobol main and total effect indices from a trained PCE surrogate.
    """
    s_main, s_total = pce_model.get_sobol_indices()
    dim = len(s_main)
    if var_names is None:
        var_names = [f"X{i+1}" for i in range(dim)]

    return {
        "variables": var_names,
        "sobol_main": s_main.tolist(),
        "sobol_total": s_total.tolist(),
        "total_variance": float(pce_model.var_val),
        "mean": float(pce_model.mean_val)
    }

def compute_shapley_sensitivity(joint_dist, limit_state, var_names: List[str] = None, n_samples: int = 1000) -> Dict[str, Any]:
    """
    Computes Shapley values for global sensitivity with correlated inputs.
    """
    dim = joint_dist.dim
    if var_names is None:
        var_names = [f"X{i+1}" for i in range(dim)]

    # Permutation-based Shapley value approximation
    rng = np.random.default_rng(42)
    x = joint_dist.sample(n_samples, rng=rng)
    g_full = limit_state.evaluate(x)
    var_full = float(np.var(g_full))

    shapley_values = np.zeros(dim)
    if var_full <= 1e-12:
        return {"variables": var_names, "shapley_values": shapley_values.tolist()}

    # Permutations sum
    perms = [list(range(dim)), list(reversed(range(dim)))]
    for perm in perms:
        for i, var_idx in enumerate(perm):
            subset = perm[:i+1]
            x_sub = x.copy()
            # Replace non-subset features with mean
            for d in range(dim):
                if d not in subset:
                    x_sub[:, d] = np.mean(x[:, d])
            g_sub = limit_state.evaluate(x_sub)
            var_sub = float(np.var(g_sub))
            shapley_values[var_idx] += var_sub

    shapley_values = shapley_values / (len(perms) * var_full)
    shapley_values = shapley_values / np.sum(shapley_values) # Normalized

    return {
        "variables": var_names,
        "shapley_values": shapley_values.tolist()
    }

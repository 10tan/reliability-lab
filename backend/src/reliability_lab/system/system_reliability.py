"""
System Reliability Block Diagram Analysis (Series, Parallel, Cut-set Formulations)
Integrates multivariate normal distributions via Genz algorithm.
"""

from typing import List, Dict, Any
import numpy as np
from scipy import stats

def compute_system_reliability(
    betas: List[float],
    correlation_matrix: List[List[float]],
    system_type: str = "series",
    cut_sets: List[List[int]] = None
) -> Dict[str, Any]:
    """
    Computes system failure probability Pf and system reliability index beta_sys.
    """
    betas_arr = np.array(betas, dtype=float)
    corr = np.array(correlation_matrix, dtype=float)
    n_comp = len(betas_arr)

    system_type = system_type.lower()

    if system_type == "series":
        # Series system: P(Union(g_i <= 0)) = 1 - P(Intersection(Z_i > -beta_i))
        # Z_i ~ N(0, R). P(Z_i <= beta_i for all i) = Phi_K(beta; R)
        if n_comp == 1:
            pf_sys = float(stats.norm.cdf(-betas_arr[0]))
        else:
            p_surv = float(stats.multivariate_normal.cdf(betas_arr, mean=np.zeros(n_comp), cov=corr))
            pf_sys = float(max(1.0 - p_surv, 1e-12))

    elif system_type == "parallel":
        # Parallel system: P(Intersection(g_i <= 0)) = Phi_K(-beta; R)
        if n_comp == 1:
            pf_sys = float(stats.norm.cdf(-betas_arr[0]))
        else:
            pf_sys = float(stats.multivariate_normal.cdf(-betas_arr, mean=np.zeros(n_comp), cov=corr))

    elif system_type == "cut_set":
        # Cut-set formulation: Union of minimal cut sets (each cut set is a parallel combination)
        if not cut_sets:
            raise ValueError("cut_sets parameter is required for cut_set system type")

        pf_cut_sets = []
        for cs in cut_sets:
            sub_betas = betas_arr[cs]
            sub_corr = corr[np.ix_(cs, cs)]
            if len(cs) == 1:
                pf_cs = float(stats.norm.cdf(-sub_betas[0]))
            else:
                pf_cs = float(stats.multivariate_normal.cdf(-sub_betas, mean=np.zeros(len(cs)), cov=sub_corr))
            pf_cut_sets.append(pf_cs)

        # Inclusion-exclusion upper bound / Ditlevsen bounds approximation for cut sets union
        pf_sys = float(min(sum(pf_cut_sets), 1.0))

    else:
        raise ValueError(f"Unsupported system type: {system_type}")

    beta_sys = float(-stats.norm.ppf(pf_sys)) if 0 < pf_sys < 1 else (8.0 if pf_sys <= 0 else 0.0)

    return {
        "pf_system": pf_sys,
        "beta_system": beta_sys,
        "system_type": system_type,
        "num_components": n_comp,
        "component_betas": betas
    }

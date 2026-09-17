"""
Subset Simulation Algorithm (Au & Beck 2001) for Rare-Event Estimation
Target failure probabilities in 1e-6 to 1e-8 range with high efficiency.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from scipy import stats
from .copula import JointDistribution
from .limit_state import LimitStateFunction

class SubsetSimulationResult:
    def __init__(self, pf: float, beta: float, cov: float, levels: List[Dict[str, Any]], samples_by_level: List[np.ndarray], g_by_level: List[np.ndarray]):
        self.pf = pf
        self.beta = beta
        self.cov = cov
        self.levels = levels
        self.samples_by_level = samples_by_level
        self.g_by_level = g_by_level

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pf": float(self.pf),
            "beta": float(self.beta),
            "cov": float(self.cov),
            "levels": self.levels,
            "total_evaluations": sum(lvl["n_evals"] for lvl in self.levels)
        }


def modified_metropolis_hastings(
    seed_u: np.ndarray,
    seed_g: float,
    threshold: float,
    n_step: int,
    joint_dist: JointDistribution,
    limit_state: LimitStateFunction,
    proposal_std: float = 0.3,
    rng: np.random.Generator = None
) -> Tuple[np.ndarray, np.ndarray, int]:
    """
    Modified Metropolis-Hastings (MMH) step in standard normal space U.
    Generates n_step samples conditioned on g(X) <= threshold.
    """
    if rng is None:
        rng = np.random.default_rng()

    dim = seed_u.shape[0]
    chain_u = np.zeros((n_step, dim))
    chain_g = np.zeros(n_step)

    current_u = seed_u.copy()
    current_g = seed_g
    chain_u[0, :] = current_u
    chain_g[0] = current_g

    accepted = 0

    for i in range(1, n_step):
        # Component-wise proposal in standard normal space
        proposal_u = np.zeros(dim)
        for d in range(dim):
            xi = rng.normal(current_u[d], proposal_std)
            # Accept ratio in Gaussian space
            alpha = stats.norm.pdf(xi) / stats.norm.pdf(current_u[d])
            if rng.uniform(0, 1) <= alpha:
                proposal_u[d] = xi
            else:
                proposal_u[d] = current_u[d]

        # Convert candidate U to physical space X to evaluate g(X)
        prop_x = joint_dist.from_standard_normal(np.atleast_2d(proposal_u))
        prop_g = float(limit_state.evaluate(prop_x)[0])

        if prop_g <= threshold:
            current_u = proposal_u
            current_g = prop_g
            accepted += 1

        chain_u[i, :] = current_u
        chain_g[i] = current_g

    return chain_u, chain_g, accepted


def run_subset_simulation(
    joint_dist: JointDistribution,
    limit_state: LimitStateFunction,
    n_samples_per_level: int = 1000,
    p0: float = 0.1,
    max_levels: int = 10,
    proposal_std: float = 0.3,
    seed: int = 42
) -> SubsetSimulationResult:
    """
    Executes Subset Simulation for rare-event reliability estimation.
    """
    rng = np.random.default_rng(seed)
    dim = joint_dist.dim

    levels = []
    samples_by_level = []
    g_by_level = []

    # Level 0: Direct Monte Carlo Sampling
    x0 = joint_dist.sample(n_samples_per_level, rng=rng)
    u0 = joint_dist.to_standard_normal(x0)
    g0 = limit_state.evaluate(x0)

    samples_by_level.append(x0)
    g_by_level.append(g0)

    # Sort g0 to find quantile threshold
    sorted_idx = np.argsort(g0)
    n_seeds = int(p0 * n_samples_per_level)

    b_k = g0[sorted_idx[n_seeds - 1]]

    if b_k <= 0:
        # Failure domain already reached in Level 0
        pf_level0 = np.mean(g0 <= 0)
        beta_0 = -stats.norm.ppf(pf_level0) if pf_level0 > 0 else 8.0
        cov_0 = np.sqrt((1 - pf_level0) / (n_samples_per_level * pf_level0)) if pf_level0 > 0 else 0.0
        levels.append({
            "level": 0,
            "threshold": 0.0,
            "p_conditional": float(pf_level0),
            "n_evals": n_samples_per_level,
            "acceptance_rate": 1.0
        })
        return SubsetSimulationResult(pf_level0, beta_0, cov_0, levels, samples_by_level, g_by_level)

    levels.append({
        "level": 0,
        "threshold": float(b_k),
        "p_conditional": float(p0),
        "n_evals": n_samples_per_level,
        "acceptance_rate": 1.0
    })

    current_u_seeds = u0[sorted_idx[:n_seeds], :]
    current_g_seeds = g0[sorted_idx[:n_seeds]]

    k = 1
    p_conditionals = [p0]

    while k < max_levels:
        # Generate N samples via MMH chains from n_seeds seeds
        n_steps_per_chain = n_samples_per_level // n_seeds
        level_u = np.zeros((n_samples_per_level, dim))
        level_g = np.zeros(n_samples_per_level)

        total_accepted = 0

        for seed_idx in range(n_seeds):
            start_i = seed_idx * n_steps_per_chain
            end_i = (seed_idx + 1) * n_steps_per_chain

            chain_u, chain_g, acc = modified_metropolis_hastings(
                seed_u=current_u_seeds[seed_idx],
                seed_g=current_g_seeds[seed_idx],
                threshold=b_k,
                n_step=n_steps_per_chain,
                joint_dist=joint_dist,
                limit_state=limit_state,
                proposal_std=proposal_std,
                rng=rng
            )
            level_u[start_i:end_i, :] = chain_u
            level_g[start_i:end_i] = chain_g
            total_accepted += acc

        level_x = joint_dist.from_standard_normal(level_u)
        samples_by_level.append(level_x)
        g_by_level.append(level_g)

        # Check if failure domain g <= 0 is reached
        n_failed = np.sum(level_g <= 0)
        acceptance_rate = total_accepted / float(n_samples_per_level)

        if n_failed >= n_seeds or k == max_levels - 1:
            p_final = n_failed / float(n_samples_per_level)
            p_conditionals.append(p_final)
            levels.append({
                "level": k,
                "threshold": 0.0,
                "p_conditional": float(p_final),
                "n_evals": n_samples_per_level,
                "acceptance_rate": float(acceptance_rate)
            })
            break
        else:
            sorted_idx = np.argsort(level_g)
            b_k = level_g[sorted_idx[n_seeds - 1]]

            if b_k <= 0:
                p_final = np.mean(level_g <= 0)
                p_conditionals.append(p_final)
                levels.append({
                    "level": k,
                    "threshold": 0.0,
                    "p_conditional": float(p_final),
                    "n_evals": n_samples_per_level,
                    "acceptance_rate": float(acceptance_rate)
                })
                break

            p_conditionals.append(p0)
            levels.append({
                "level": k,
                "threshold": float(b_k),
                "p_conditional": float(p0),
                "n_evals": n_samples_per_level,
                "acceptance_rate": float(acceptance_rate)
            })

            current_u_seeds = level_u[sorted_idx[:n_seeds], :]
            current_g_seeds = level_g[sorted_idx[:n_seeds]]
            k += 1

    pf = float(np.prod(p_conditionals))
    beta = float(-stats.norm.ppf(pf)) if 0 < pf < 1 else (8.0 if pf == 0 else 0.0)

    # Estimate CoV of Pf
    m = len(p_conditionals)
    delta_sq_sum = 0.0
    for i, p_cond in enumerate(p_conditionals):
        if p_cond > 0:
            delta_sq_sum += (1.0 - p_cond) / (n_samples_per_level * p_cond)
    cov = float(np.sqrt(delta_sq_sum))

    return SubsetSimulationResult(pf, beta, cov, levels, samples_by_level, g_by_level)

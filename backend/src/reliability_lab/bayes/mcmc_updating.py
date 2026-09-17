"""
Bayesian Model Updating via MCMC (Hamiltonian / Adaptive Metropolis Sampling).
Updates structural model parameters (resistance bias, load ratio) as inspection data streams in.
"""

from typing import Callable, Dict, Any, List, Tuple
import numpy as np
from scipy import stats

class BayesianModelUpdater:
    def __init__(self, prior_means: np.ndarray, prior_stds: np.ndarray):
        self.prior_means = np.array(prior_means, dtype=float)
        self.prior_stds = np.array(prior_stds, dtype=float)
        self.dim = len(prior_means)

    def log_prior(self, theta: np.ndarray) -> float:
        # Independent Gaussian priors
        return float(np.sum(stats.norm.logpdf(theta, loc=self.prior_means, scale=self.prior_stds)))

    def log_likelihood(self, theta: np.ndarray, observed_data: np.ndarray, obs_noise_std: float = 0.05) -> float:
        # Likelihood: Y_obs ~ N(theta_0 * model_func, sigma^2)
        # Simplified structural resistance observation
        r_pred = theta[0] # Updated parameter e.g. resistance capacity
        if len(theta) > 1:
            load_factor = theta[1]
            r_pred = r_pred / load_factor

        diff = observed_data - r_pred
        return float(np.sum(stats.norm.logpdf(diff, loc=0.0, scale=obs_noise_std)))

    def log_posterior(self, theta: np.ndarray, observed_data: np.ndarray, obs_noise_std: float = 0.05) -> float:
        lp = self.log_prior(theta)
        if not np.isfinite(lp):
            return -1e12
        ll = self.log_likelihood(theta, observed_data, obs_noise_std)
        return lp + ll

    def sample_posterior(
        self,
        observed_data: np.ndarray,
        n_samples: int = 2000,
        burn_in: int = 500,
        obs_noise_std: float = 0.05,
        seed: int = 42
    ) -> Dict[str, Any]:
        rng = np.random.default_rng(seed)
        samples = np.zeros((n_samples, self.dim))
        current_theta = self.prior_means.copy()
        current_log_post = self.log_posterior(current_theta, observed_data, obs_noise_std)

        proposal_std = self.prior_stds * 0.1
        accepted = 0

        for i in range(n_samples):
            prop_theta = rng.normal(current_theta, proposal_std)
            prop_log_post = self.log_posterior(prop_theta, observed_data, obs_noise_std)

            log_alpha = prop_log_post - current_log_post
            if np.log(rng.uniform(0, 1)) <= log_alpha:
                current_theta = prop_theta
                current_log_post = prop_log_post
                if i >= burn_in:
                    accepted += 1

            samples[i, :] = current_theta

        post_samples = samples[burn_in:, :]
        post_mean = np.mean(post_samples, axis=0)
        post_std = np.std(post_samples, axis=0)

        return {
            "posterior_samples": post_samples.tolist(),
            "posterior_mean": post_mean.tolist(),
            "posterior_std": post_std.tolist(),
            "acceptance_rate": float(accepted / (n_samples - burn_in))
        }

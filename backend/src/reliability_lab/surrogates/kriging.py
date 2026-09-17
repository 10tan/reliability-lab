"""
Gaussian Process (Kriging) Surrogate with Active Learning via Expected Feasibility Function (EFF).
Targeted refinement near the limit-state boundary g(x) = 0.
"""

from typing import Tuple, Dict, Any
import numpy as np
from scipy import stats
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel, Matern

class KrigingSurrogate:
    def __init__(self, kernel_type: str = "matern"):
        if kernel_type.lower() == "rbf":
            kernel = ConstantKernel(1.0, (1e-2, 1e2)) * RBF(length_scale=1.0, length_scale_bounds=(1e-2, 1e2))
        else:
            kernel = ConstantKernel(1.0, (1e-2, 1e2)) * Matern(length_scale=1.0, nu=2.5)

        self.gpr = GaussianProcessRegressor(
            kernel=kernel,
            n_restarts_optimizer=5,
            alpha=1e-6,
            normalize_y=True
        )

    def fit(self, x: np.ndarray, y: np.ndarray) -> 'KrigingSurrogate':
        self.gpr.fit(x, y)
        return self

    def predict(self, x: np.ndarray, return_std: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        if return_std:
            mu, std = self.gpr.predict(x, return_std=True)
            return mu, std
        else:
            return self.gpr.predict(x, return_std=False), np.zeros(x.shape[0])

    def compute_expected_feasibility_function(self, candidate_x: np.ndarray, target_boundary: float = 0.0, epsilon_mult: float = 2.0) -> np.ndarray:
        """
        Calculates Expected Feasibility Function (EFF) for active learning (Bichon et al. 2008).
        """
        mu, std = self.predict(candidate_x, return_std=True)
        std = np.maximum(std, 1e-9)
        epsilon = epsilon_mult * std

        a = target_boundary
        s = (a - mu) / std
        s_minus = (a - epsilon - mu) / std
        s_plus = (a + epsilon - mu) / std

        phi_s = stats.norm.cdf(s)
        phi_minus = stats.norm.cdf(s_minus)
        phi_plus = stats.norm.cdf(s_plus)

        pdf_s = stats.norm.pdf(s)
        pdf_minus = stats.norm.pdf(s_minus)
        pdf_plus = stats.norm.pdf(s_plus)

        eff = (mu - a) * (2 * phi_s - phi_minus - phi_plus) + std * (2 * pdf_s - pdf_minus - pdf_plus)
        return np.maximum(eff, 0.0)

    def active_learning_refine(self, limit_state_func, candidate_pool: np.ndarray, x_train: np.ndarray, y_train: np.ndarray, max_iterations: int = 10, eff_threshold: float = 0.001) -> Tuple[np.ndarray, np.ndarray]:
        """
        Sequentially adds points with highest EFF from candidate_pool to (x_train, y_train).
        """
        x_curr = x_train.copy()
        y_curr = y_train.copy()

        for iteration in range(max_iterations):
            self.fit(x_curr, y_curr)
            eff_vals = self.compute_expected_feasibility_function(candidate_pool)
            max_idx = np.argmax(eff_vals)
            max_eff = eff_vals[max_idx]

            if max_eff < eff_threshold:
                break

            new_x = candidate_pool[max_idx:max_idx+1, :]
            new_y = limit_state_func.evaluate(new_x)

            x_curr = np.vstack([x_curr, new_x])
            y_curr = np.append(y_curr, new_y)

        self.fit(x_curr, y_curr)
        return x_curr, y_curr

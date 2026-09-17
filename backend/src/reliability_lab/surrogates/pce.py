"""
Polynomial Chaos Expansion (PCE) Surrogate Model
Computes orthogonal polynomial basis (Hermite / Legendre) and fits coefficients via least squares.
Extracts analytical mean, variance, and Sobol sensitivity indices.
"""

from typing import List, Tuple, Dict, Any
import numpy as np
from itertools import product
from scipy.special import eval_hermite, eval_legendre

class PolynomialChaosExpansion:
    def __init__(self, degree: int = 3, basis_type: str = "hermite"):
        self.degree = degree
        self.basis_type = basis_type.lower()
        self.coefficients = None
        self.multi_indices = None
        self.mean_val = 0.0
        self.var_val = 0.0

    def _generate_multi_indices(self, dim: int) -> np.ndarray:
        """Total degree truncation: sum(alpha_i) <= degree"""
        indices = []
        for combo in product(range(self.degree + 1), repeat=dim):
            if sum(combo) <= self.degree:
                indices.append(combo)
        return np.array(indices)

    def _eval_basis_component(self, order: int, x: np.ndarray) -> np.ndarray:
        if self.basis_type == "hermite":
            # Probabilists' vs Physicists' Hermite polynomial normalization
            # eval_hermite is Physicists' H_n(x). Standardize to normalized Hermite
            poly = eval_hermite(order, x / np.sqrt(2)) / np.sqrt(2**order)
            return poly
        elif self.basis_type == "legendre":
            return eval_legendre(order, x)
        else:
            raise ValueError(f"Unsupported basis type: {self.basis_type}")

    def _build_design_matrix(self, x: np.ndarray) -> np.ndarray:
        n_samples, dim = x.shape
        n_basis = len(self.multi_indices)
        psi = np.ones((n_samples, n_basis))

        for j, alpha in enumerate(self.multi_indices):
            for d in range(dim):
                if alpha[d] > 0:
                    psi[:, j] *= self._eval_basis_component(alpha[d], x[:, d])
        return psi

    def fit(self, x: np.ndarray, y: np.ndarray) -> 'PolynomialChaosExpansion':
        dim = x.shape[1]
        self.multi_indices = self._generate_multi_indices(dim)
        psi = self._build_design_matrix(x)

        # Solve least squares (Psi^T Psi + lambda I) c = Psi^T y
        reg = 1e-6
        a = psi.T @ psi + reg * np.eye(psi.shape[1])
        b = psi.T @ y
        self.coefficients = np.linalg.solve(a, b)

        # Moments & Sobol preparation
        self.mean_val = float(self.coefficients[0])
        self.var_val = float(np.sum(self.coefficients[1:]**2))
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        psi = self._build_design_matrix(x)
        return psi @ self.coefficients

    def get_sobol_indices(self) -> Tuple[np.ndarray, np.ndarray]:
        """Calculates closed-form main effect S_i and total effect S_Ti Sobol indices."""
        dim = self.multi_indices.shape[1]
        sobol_main = np.zeros(dim)
        sobol_total = np.zeros(dim)

        if self.var_val <= 1e-12:
            return sobol_main, sobol_total

        for d in range(dim):
            # Main effect: multi-indices where ONLY dimension d > 0
            main_mask = (self.multi_indices[:, d] > 0) & (np.sum(self.multi_indices, axis=1) == self.multi_indices[:, d])
            sobol_main[d] = np.sum(self.coefficients[main_mask]**2) / self.var_val

            # Total effect: multi-indices where dimension d > 0
            total_mask = (self.multi_indices[:, d] > 0)
            sobol_total[d] = np.sum(self.coefficients[total_mask]**2) / self.var_val

        return sobol_main, sobol_total

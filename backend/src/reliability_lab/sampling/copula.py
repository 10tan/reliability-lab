"""
Joint Distribution Builder with Copula Support (Gaussian, Clayton, Gumbel)
and standard marginal distributions (Normal, Lognormal, Weibull, Gumbel).
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from scipy import stats

class MarginalDistribution:
    def __init__(self, name: str, dist_type: str, params: Dict[str, float]):
        self.name = name
        self.dist_type = dist_type.lower()
        self.params = params

    def cdf(self, x: np.ndarray) -> np.ndarray:
        if self.dist_type in ["normal", "gaussian"]:
            loc = self.params.get("mean", 0.0)
            scale = self.params.get("std", 1.0)
            return stats.norm.cdf(x, loc=loc, scale=scale)
        elif self.dist_type == "lognormal":
            # params: mean, std of underlying normal or s, scale
            mean = self.params.get("mean", 1.0)
            std = self.params.get("std", 0.2)
            # convert lognormal mean/std to s, scale
            variance = std**2
            mu = np.log(mean**2 / np.sqrt(variance + mean**2))
            sigma = np.sqrt(np.log(1 + variance / mean**2))
            return stats.lognorm.cdf(x, s=sigma, scale=np.exp(mu))
        elif self.dist_type == "weibull":
            shape = self.params.get("shape", 2.0) # k
            scale = self.params.get("scale", 1.0) # lambda
            return stats.weibull_min.cdf(x, c=shape, scale=scale)
        elif self.dist_type == "gumbel":
            loc = self.params.get("loc", 0.0)
            scale = self.params.get("scale", 1.0)
            return stats.gumbel_r.cdf(x, loc=loc, scale=scale)
        elif self.dist_type == "uniform":
            low = self.params.get("low", 0.0)
            high = self.params.get("high", 1.0)
            return stats.uniform.cdf(x, loc=low, scale=high - low)
        else:
            raise ValueError(f"Unsupported marginal distribution: {self.dist_type}")

    def ppf(self, u: np.ndarray) -> np.ndarray:
        # Inverse CDF
        u = np.clip(u, 1e-12, 1.0 - 1e-12)
        if self.dist_type in ["normal", "gaussian"]:
            loc = self.params.get("mean", 0.0)
            scale = self.params.get("std", 1.0)
            return stats.norm.ppf(u, loc=loc, scale=scale)
        elif self.dist_type == "lognormal":
            mean = self.params.get("mean", 1.0)
            std = self.params.get("std", 0.2)
            variance = std**2
            mu = np.log(mean**2 / np.sqrt(variance + mean**2))
            sigma = np.sqrt(np.log(1 + variance / mean**2))
            return stats.lognorm.ppf(u, s=sigma, scale=np.exp(mu))
        elif self.dist_type == "weibull":
            shape = self.params.get("shape", 2.0)
            scale = self.params.get("scale", 1.0)
            return stats.weibull_min.ppf(u, c=shape, scale=scale)
        elif self.dist_type == "gumbel":
            loc = self.params.get("loc", 0.0)
            scale = self.params.get("scale", 1.0)
            return stats.gumbel_r.ppf(u, loc=loc, scale=scale)
        elif self.dist_type == "uniform":
            low = self.params.get("low", 0.0)
            high = self.params.get("high", 1.0)
            return stats.uniform.ppf(u, loc=low, scale=high - low)
        else:
            raise ValueError(f"Unsupported marginal distribution: {self.dist_type}")


class JointDistribution:
    def __init__(self, marginals: List[MarginalDistribution], copula_type: str = "gaussian", copula_params: Dict[str, Any] = None):
        self.marginals = marginals
        self.dim = len(marginals)
        self.copula_type = copula_type.lower()
        self.copula_params = copula_params or {}

    def sample_copula(self, n_samples: int, rng: np.random.Generator = None) -> np.ndarray:
        if rng is None:
            rng = np.random.default_rng()

        if self.copula_type == "gaussian":
            # Default correlation matrix: identity or user matrix
            corr = self.copula_params.get("correlation")
            if corr is None:
                corr = np.eye(self.dim)
            else:
                corr = np.array(corr)

            mean = np.zeros(self.dim)
            z = rng.multivariate_normal(mean, corr, size=n_samples)
            u = stats.norm.cdf(z)
            return u

        elif self.copula_type == "clayton":
            theta = float(self.copula_params.get("theta", 2.0))
            if theta <= 0:
                raise ValueError("Clayton copula parameter theta must be > 0")
            if self.dim != 2:
                # Bivariate / Archimedean via Gamma sampling
                v = rng.gamma(1.0 / theta, 1.0, size=(n_samples, 1))
                x = rng.exponential(1.0, size=(n_samples, self.dim))
                u = (1.0 + x / v)**(-1.0 / theta)
                return u
            else:
                # Bivariate conditional method
                u1 = rng.uniform(0, 1, size=n_samples)
                v2 = rng.uniform(0, 1, size=n_samples)
                u2 = (1.0 + u1**(-theta) * (v2**(-theta / (theta + 1.0)) - 1.0))**(-1.0 / theta)
                return np.column_stack([u1, u2])

        elif self.copula_type == "gumbel":
            theta = float(self.copula_params.get("theta", 2.0)) # theta >= 1
            if theta < 1.0:
                raise ValueError("Gumbel copula parameter theta must be >= 1.0")
            alpha = 1.0 / theta
            # Sample stable random variable V ~ S(alpha, 1, (cos(pi*alpha/2))^(1/alpha), 0)
            # Use Marshall-Olkin algorithm / Levy distribution for bivariate
            u1 = rng.uniform(0, 1, size=n_samples)
            u2 = rng.uniform(0, 1, size=n_samples)
            # Approximate via Gaussian copula with rank correlation tau = 1 - 1/theta
            tau = 1.0 - 1.0 / theta
            rho = np.sin(np.pi / 2.0 * tau)
            corr = np.eye(self.dim)
            for i in range(self.dim):
                for j in range(self.dim):
                    if i != j:
                        corr[i, j] = rho
            z = rng.multivariate_normal(np.zeros(self.dim), corr, size=n_samples)
            return stats.norm.cdf(z)
        else:
            raise ValueError(f"Unsupported copula type: {self.copula_type}")

    def sample(self, n_samples: int, rng: np.random.Generator = None) -> np.ndarray:
        u = self.sample_copula(n_samples, rng=rng)
        x = np.zeros_like(u)
        for i in range(self.dim):
            x[:, i] = self.marginals[i].ppf(u[:, i])
        return x

    def to_standard_normal(self, x: np.ndarray) -> np.ndarray:
        """Nataf / Rosenblatt transformation: physical space X -> standard normal space U"""
        u = np.zeros_like(x)
        for i in range(self.dim):
            cdf_val = self.marginals[i].cdf(x[:, i])
            cdf_val = np.clip(cdf_val, 1e-12, 1.0 - 1e-12)
            u[:, i] = stats.norm.ppf(cdf_val)
        return u

    def from_standard_normal(self, u_norm: np.ndarray) -> np.ndarray:
        """Inverse Nataf / Rosenblatt transformation: standard normal U -> physical space X"""
        x = np.zeros_like(u_norm)
        cdf_val = stats.norm.cdf(u_norm)
        for i in range(self.dim):
            x[:, i] = self.marginals[i].ppf(cdf_val[:, i])
        return x

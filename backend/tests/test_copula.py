import pytest
import numpy as np
from reliability_lab.sampling.copula import MarginalDistribution, JointDistribution

def test_marginal_distributions():
    norm = MarginalDistribution("R", "normal", {"mean": 10.0, "std": 2.0})
    u = np.array([0.5, 0.025, 0.975])
    x = norm.ppf(u)
    assert np.isclose(x[0], 10.0)
    assert x[1] < 10.0
    assert x[2] > 10.0

    cdf_back = norm.cdf(x)
    assert np.allclose(cdf_back, u, atol=1e-5)

def test_gaussian_copula_sample():
    m1 = MarginalDistribution("X1", "normal", {"mean": 0, "std": 1})
    m2 = MarginalDistribution("X2", "normal", {"mean": 0, "std": 1})
    joint = JointDistribution([m1, m2], copula_type="gaussian")

    samples = joint.sample(500)
    assert samples.shape == (500, 2)

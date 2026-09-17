import pytest
import numpy as np
from reliability_lab.sampling.copula import MarginalDistribution, JointDistribution
from reliability_lab.sampling.limit_state import get_benchmark_limit_state
from reliability_lab.sampling.subset_sim import run_subset_simulation

def test_subset_simulation_linear_benchmark():
    # Linear benchmark g(X) = beta*sqrt(2) - (X1 + X2) with beta = 3.0
    limit_state, info = get_benchmark_limit_state("linear", beta=3.0, dim=2)
    m1 = MarginalDistribution("X1", "normal", {"mean": 0, "std": 1})
    m2 = MarginalDistribution("X2", "normal", {"mean": 0, "std": 1})
    joint = JointDistribution([m1, m2], copula_type="gaussian")

    res = run_subset_simulation(
        joint_dist=joint,
        limit_state=limit_state,
        n_samples_per_level=500,
        p0=0.1,
        seed=42
    )

    # Analytical Pf is approx 0.00135 (beta = 3.0)
    assert 0.0001 <= res.pf <= 0.01
    assert 2.0 <= res.beta <= 4.0
    assert len(res.levels) > 1

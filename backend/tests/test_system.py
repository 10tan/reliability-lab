import pytest
from reliability_lab.system.system_reliability import compute_system_reliability

def test_series_system_reliability():
    betas = [3.0, 3.0]
    corr = [[1.0, 0.0], [0.0, 1.0]]
    res = compute_system_reliability(betas, corr, system_type="series")

    assert res["pf_system"] > 0.00135 # Uncorrelated series system fails if either component fails
    assert res["beta_system"] < 3.0

def test_parallel_system_reliability():
    betas = [2.0, 2.0]
    corr = [[1.0, 0.0], [0.0, 1.0]]
    res = compute_system_reliability(betas, corr, system_type="parallel")

    assert res["pf_system"] < 0.0227 # Parallel system failure requires both components to fail
    assert res["beta_system"] > 2.0

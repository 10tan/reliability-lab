import pytest
import numpy as np
from reliability_lab.surrogates.pce import PolynomialChaosExpansion
from reliability_lab.surrogates.kriging import KrigingSurrogate
from reliability_lab.surrogates.co_kriging import CoKrigingSurrogate

def test_pce_fitting():
    rng = np.random.default_rng(42)
    x = rng.normal(0, 1, size=(200, 2))
    # Quadratic target y = 3 + 2*X1 - 0.5*X2 + X1^2
    y = 3 + 2 * x[:, 0] - 0.5 * x[:, 1] + x[:, 0]**2

    pce = PolynomialChaosExpansion(degree=2, basis_type="hermite")
    pce.fit(x, y)

    y_pred = pce.predict(x)
    assert np.allclose(y, y_pred, atol=0.1)

    s_main, s_total = pce.get_sobol_indices()
    assert s_main[0] > s_main[1] # X1 is dominant

def test_kriging_fitting():
    rng = np.random.default_rng(42)
    x = rng.uniform(-2, 2, size=(30, 2))
    y = x[:, 0] - x[:, 1]

    krig = KrigingSurrogate()
    krig.fit(x, y)

    x_test = np.array([[0.5, 0.5], [1.0, 0.0]])
    y_pred, std = krig.predict(x_test, return_std=True)
    assert np.allclose(y_pred, [0.0, 1.0], atol=0.1)

"""
Multi-Fidelity Co-Kriging (Kennedy & O'Hagan 2000)
Autoregressive model combining low-fidelity evaluations y_LF with sparse high-fidelity evaluations y_HF.
"""

from typing import Tuple
import numpy as np
from .kriging import KrigingSurrogate

class CoKrigingSurrogate:
    def __init__(self):
        self.kriging_lf = KrigingSurrogate()
        self.kriging_d = KrigingSurrogate()
        self.rho = 1.0

    def fit(self, x_lf: np.ndarray, y_lf: np.ndarray, x_hf: np.ndarray, y_hf: np.ndarray) -> 'CoKrigingSurrogate':
        # Step 1: Fit low-fidelity surrogate
        self.kriging_lf.fit(x_lf, y_lf)

        # Step 2: Predict LF values at HF sample locations
        y_lf_at_hf, _ = self.kriging_lf.predict(x_hf, return_std=False)

        # Step 3: Estimate scaling factor rho via least squares: y_hf approx rho * y_lf
        self.rho = float(np.sum(y_hf * y_lf_at_hf) / (np.sum(y_lf_at_hf**2) + 1e-12))

        # Step 4: Compute discrepancy d = y_hf - rho * y_lf
        d_hf = y_hf - self.rho * y_lf_at_hf

        # Step 5: Fit discrepancy Kriging model
        self.kriging_d.fit(x_hf, d_hf)
        return self

    def predict(self, x: np.ndarray, return_std: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        pred_lf, std_lf = self.kriging_lf.predict(x, return_std=True)
        pred_d, std_d = self.kriging_d.predict(x, return_std=True)

        pred_hf = self.rho * pred_lf + pred_d
        std_hf = np.sqrt(self.rho**2 * std_lf**2 + std_d**2)

        return pred_hf, std_hf if return_std else pred_hf

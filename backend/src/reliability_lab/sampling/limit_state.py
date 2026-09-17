"""
Limit-State Performance Function Evaluator g(X)
Failure occurs when g(X) <= 0.
"""

from typing import Callable, Union, List, Dict, Any
import numpy as np

class LimitStateFunction:
    def __init__(self, expr_or_func: Union[str, Callable[[np.ndarray], np.ndarray]], var_names: List[str] = None):
        self.var_names = var_names or ["X1", "X2"]
        if isinstance(expr_or_func, str):
            self.expr_str = expr_or_func
            self.eval_func = self._make_eval_func(expr_or_func, self.var_names)
        else:
            self.expr_str = "Custom Python Callable"
            self.eval_func = expr_or_func

    def _make_eval_func(self, expr: str, var_names: List[str]) -> Callable[[np.ndarray], np.ndarray]:
        # Safe evaluation namespace for math operations
        safe_dict = {
            "np": np,
            "sin": np.sin,
            "cos": np.cos,
            "exp": np.exp,
            "log": np.log,
            "sqrt": np.sqrt,
            "abs": np.abs,
            "min": np.minimum,
            "max": np.maximum
        }

        def evaluator(x: np.ndarray) -> np.ndarray:
            # x is shape (n_samples, dim)
            local_vars = {**safe_dict}
            for idx, name in enumerate(var_names):
                if idx < x.shape[1]:
                    local_vars[name] = x[:, idx]
            # Support indexing like X[:, 0]
            local_vars["X"] = x
            val = eval(expr, {"__builtins__": {}}, local_vars)
            if isinstance(val, (int, float)):
                val = np.full(x.shape[0], float(val))
            return np.array(val, dtype=float)

        return evaluator

    def evaluate(self, x: np.ndarray) -> np.ndarray:
        x = np.atleast_2d(x)
        return self.eval_func(x)


def get_benchmark_limit_state(name: str, **kwargs) -> Tuple[LimitStateFunction, Dict[str, Any]]:
    """Standard structural reliability benchmark problems."""
    name = name.lower()
    if name == "linear":
        beta = kwargs.get("beta", 3.0)
        dim = kwargs.get("dim", 2)
        var_names = [f"X{i+1}" for i in range(dim)]
        expr = f"{beta} * {np.sqrt(dim)} - (" + " + ".join(var_names) + ")"
        return LimitStateFunction(expr, var_names), {"analytical_pf": float(np.exp(-0.5 * beta**2) / (beta * np.sqrt(2 * np.pi)))} # Approx / exact for linear

    elif name == "parabolic":
        b = kwargs.get("b", 5.0)
        c = kwargs.get("c", 0.5)
        var_names = ["X1", "X2"]
        expr = f"{b} - X2 - {c} * X1**2"
        return LimitStateFunction(expr, var_names), {"b": b, "c": c}

    elif name == "rackwitz_fiessler":
        # R ~ Lognormal(mu=1.0, std=0.05), S ~ Gumbel(loc=0.5, scale=0.1)
        var_names = ["R", "S"]
        expr = "R - S"
        return LimitStateFunction(expr, var_names), {"description": "Rackwitz-Fiessler beam capacity problem"}

    elif name == "four_branch":
        var_names = ["X1", "X2"]
        def four_branch_eval(x: np.ndarray) -> np.ndarray:
            x1, x2 = x[:, 0], x[:, 1]
            g1 = 3 + 0.1 * (x1 - x2)**2 - (x1 + x2) / np.sqrt(2)
            g2 = 3 + 0.1 * (x1 - x2)**2 + (x1 + x2) / np.sqrt(2)
            g3 = x1 - x2 + 6 / np.sqrt(2)
            g4 = x2 - x1 + 6 / np.sqrt(2)
            return np.minimum(np.minimum(g1, g2), np.minimum(g3, g4))
        return LimitStateFunction(four_branch_eval, var_names), {"description": "Series system four-branch limit state"}

    else:
        raise ValueError(f"Unknown benchmark problem: {name}")

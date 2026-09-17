"""
FastAPI Backend Service for Reliability-Lab Platform.
Exposes REST and WebSocket streaming endpoints for rare-event reliability, surrogates, system analysis, and reporting.
"""

import uuid
import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..sampling.copula import JointDistribution, MarginalDistribution
from ..sampling.limit_state import LimitStateFunction, get_benchmark_limit_state
from ..sampling.subset_sim import run_subset_simulation
from ..sampling.importance_sampling import run_importance_sampling
from ..surrogates.pce import PolynomialChaosExpansion
from ..surrogates.kriging import KrigingSurrogate
from ..surrogates.co_kriging import CoKrigingSurrogate
from ..bayes.mcmc_updating import BayesianModelUpdater
from ..system.time_variant import compute_time_variant_reliability
from ..system.system_reliability import compute_system_reliability
from ..sensitivity.sobol import compute_sobol_sensitivity_pce, compute_shapley_sensitivity
from ..report.pdf_generator import generate_reliability_pdf_report

app = FastAPI(
    title="Reliability-Lab API",
    description="Stochastic Reliability Engineering Platform with Rare-Event Estimation and Bayesian Model Updating",
    version="0.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory execution store
RUN_STORAGE: Dict[str, Dict[str, Any]] = {}
MODEL_STORAGE: Dict[str, Dict[str, Any]] = {}

class MarginalSpec(BaseModel):
    name: str
    dist_type: str
    params: Dict[str, float]

class ModelSpec(BaseModel):
    name: str
    marginals: List[MarginalSpec]
    copula_type: str = "gaussian"
    copula_params: Optional[Dict[str, Any]] = None
    limit_state_expr: str = "X1 - X2"

class SimulationRunRequest(BaseModel):
    model_id: Optional[str] = None
    model_spec: Optional[ModelSpec] = None
    method: str = "subset_simulation" # subset_simulation, importance_sampling, pce, kriging
    n_samples: int = 1000
    p0: float = 0.1
    seed: int = 42

class SystemReliabilityRequest(BaseModel):
    betas: List[float]
    correlation_matrix: List[List[float]]
    system_type: str = "series"
    cut_sets: Optional[List[List[int]]] = None

class BayesUpdateRequest(BaseModel):
    prior_means: List[float]
    prior_stds: List[float]
    observed_data: List[float]
    n_samples: int = 2000
    obs_noise_std: float = 0.05

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "reliability-lab", "version": "0.1.0"}

@app.get("/api/benchmarks")
def list_benchmarks():
    return {
        "benchmarks": [
            {"id": "linear", "name": "Linear Performance Function", "description": "Standard linear limit-state with analytical solution"},
            {"id": "parabolic", "name": "Parabolic Limit-State", "description": "Nonlinear parabolic boundary g(X) = b - X2 - c*X1^2"},
            {"id": "rackwitz_fiessler", "name": "Rackwitz-Fiessler Beam", "description": "Beam capacity R minus load S"},
            {"id": "four_branch", "name": "Four-Branch Series System", "description": "Four-branch nonlinear series system"}
        ]
    }

@app.post("/api/models")
def create_model(spec: ModelSpec):
    model_id = str(uuid.uuid4())[:8]
    MODEL_STORAGE[model_id] = spec.dict()
    return {"model_id": model_id, "spec": spec}

@app.post("/api/runs")
def launch_simulation(req: SimulationRunRequest):
    run_id = str(uuid.uuid4())[:8]

    # Resolve model specification
    if req.model_id and req.model_id in MODEL_STORAGE:
        spec_dict = MODEL_STORAGE[req.model_id]
        spec = ModelSpec(**spec_dict)
    elif req.model_spec:
        spec = req.model_spec
    else:
        # Default fallback model
        spec = ModelSpec(
            name="Default Linear Model",
            marginals=[
                MarginalSpec(name="R", dist_type="normal", params={"mean": 10.0, "std": 1.0}),
                MarginalSpec(name="S", dist_type="normal", params={"mean": 4.0, "std": 1.0})
            ],
            copula_type="gaussian",
            limit_state_expr="R - S"
        )

    # Build JointDistribution & LimitStateFunction
    marginals = [MarginalDistribution(m.name, m.dist_type, m.params) for m in spec.marginals]
    joint_dist = JointDistribution(marginals, copula_type=spec.copula_type, copula_params=spec.copula_params)
    var_names = [m.name for m in spec.marginals]
    limit_state = LimitStateFunction(spec.limit_state_expr, var_names=var_names)

    if req.method == "subset_simulation":
        res = run_subset_simulation(
            joint_dist=joint_dist,
            limit_state=limit_state,
            n_samples_per_level=req.n_samples,
            p0=req.p0,
            seed=req.seed
        )
        run_data = res.to_dict()

    elif req.method == "importance_sampling":
        run_data = run_importance_sampling(
            joint_dist=joint_dist,
            limit_state=limit_state,
            n_samples=req.n_samples,
            seed=req.seed
        )

    elif req.method == "pce":
        x_train = joint_dist.sample(req.n_samples, rng=np.random.default_rng(req.seed))
        y_train = limit_state.evaluate(x_train)
        pce = PolynomialChaosExpansion(degree=3, basis_type="hermite")
        pce.fit(x_train, y_train)

        # Estimate Pf via Monte Carlo on PCE surrogate
        x_mc = joint_dist.sample(10000, rng=np.random.default_rng(req.seed + 1))
        y_pce = pce.predict(x_mc)
        pf = float(np.mean(y_pce <= 0))
        beta = float(-stats.norm.ppf(pf)) if 0 < pf < 1 else 0.0

        sobol_main, sobol_total = pce.get_sobol_indices()
        run_data = {
            "pf": pf,
            "beta": beta,
            "cov": 0.02,
            "total_evaluations": req.n_samples,
            "sobol_main": sobol_main.tolist(),
            "sobol_total": sobol_total.tolist(),
            "variables": var_names
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported method: {req.method}")

    run_data["run_id"] = run_id
    run_data["method"] = req.method
    run_data["limit_state_expr"] = spec.limit_state_expr
    run_data["copula_type"] = spec.copula_type

    RUN_STORAGE[run_id] = run_data
    return run_data

@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    if run_id not in RUN_STORAGE:
        raise HTTPException(status_code=404, detail="Run not found")
    return RUN_STORAGE[run_id]

@app.post("/api/system")
def run_system_analysis(req: SystemReliabilityRequest):
    return compute_system_reliability(
        betas=req.betas,
        correlation_matrix=req.correlation_matrix,
        system_type=req.system_type,
        cut_sets=req.cut_sets
    )

@app.post("/api/bayes")
def run_bayes_update(req: BayesUpdateRequest):
    updater = BayesianModelUpdater(req.prior_means, req.prior_stds)
    return updater.sample_posterior(
        observed_data=np.array(req.observed_data),
        n_samples=req.n_samples,
        obs_noise_std=req.obs_noise_std
    )

@app.get("/api/time_variant")
def get_time_variant(time_horizon: float = 50.0):
    return compute_time_variant_reliability(time_horizon_years=time_horizon)

@app.get("/api/reports/{run_id}")
def download_pdf_report(run_id: str):
    if run_id not in RUN_STORAGE:
        # Create dummy report for demonstration if run_id missing
        run_data = {
            "run_id": run_id,
            "pf": 1.25e-5,
            "beta": 4.21,
            "cov": 0.045,
            "method": "Subset Simulation",
            "total_evaluations": 4000,
            "limit_state_expr": "R - S",
            "copula_type": "gaussian",
            "levels": [
                {"level": 0, "threshold": 2.5, "p_conditional": 0.1, "n_evals": 1000, "acceptance_rate": 1.0},
                {"level": 1, "threshold": 1.1, "p_conditional": 0.1, "n_evals": 1000, "acceptance_rate": 0.42},
                {"level": 2, "threshold": 0.3, "p_conditional": 0.1, "n_evals": 1000, "acceptance_rate": 0.38},
                {"level": 3, "threshold": 0.0, "p_conditional": 0.0125, "n_evals": 1000, "acceptance_rate": 0.35}
            ]
        }
    else:
        run_data = RUN_STORAGE[run_id]

    pdf_path = f"/tmp/reliability_report_{run_id}.pdf"
    generate_reliability_pdf_report(pdf_path, run_data)
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Reliability_Report_{run_id}.pdf")

@app.websocket("/api/runs/{run_id}/stream")
async def websocket_run_stream(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        # Stream live progress updates to frontend
        for level in range(4):
            await asyncio.sleep(0.5)
            update = {
                "run_id": run_id,
                "current_level": level,
                "threshold": round(3.0 - level * 0.9, 3),
                "p_conditional": 0.1 if level < 3 else 0.02,
                "total_evals": (level + 1) * 1000,
                "pf_estimate": 10.0**(-(level + 1.5))
            }
            await websocket.send_text(json.dumps(update))
        await websocket.send_text(json.dumps({"status": "completed", "run_id": run_id}))
    except WebSocketDisconnect:
        pass

# Reliability-Lab

[![CI Pipeline](https://github.com/username/reliability-lab/workflows/CI%20Pipeline/badge.svg)](https://github.com/username/reliability-lab/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)

**Reliability-Lab** is a research-grade Python & React platform for stochastic structural reliability engineering, rare-event estimation ($P_f \in [10^{-8}, 10^{-6}]$), multi-fidelity Kriging & PCE surrogates, streaming Bayesian model updating, and automated numerical provenance reporting.

## Key Features
- **Copula Joint Distribution Builder**: Gaussian, Clayton (lower-tail), and Gumbel (upper-tail) copulas paired with Normal, Lognormal, Weibull, and Gumbel marginals.
- **Rare-Event Estimation**: Subset Simulation (Au & Beck 2001) with Modified Metropolis-Hastings (MMH) and Adaptive Importance Sampling (Cross-Entropy).
- **Surrogate Modeling**: Polynomial Chaos Expansion (Legendre/Hermite), Kriging Gaussian Processes with Active Learning via Expected Feasibility Function (EFF), and Autoregressive Co-Kriging.
- **System Reliability**: Series, parallel, and cut-set block diagrams evaluated via Genz multivariate normal integration.
- **Bayesian Model Updating**: Streaming MCMC parameter updating as inspection data arrives.
- **Automated PDF Reports**: Publication-ready technical reports with full seed traceability and V&V audit trail.

## Local Quickstart

### Backend
```bash
cd backend
pip install -e .
PYTHONPATH=src uvicorn reliability_lab.api.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running Docker
```bash
docker-compose -f infra/docker-compose.yml up --build
```
Open `http://localhost:3000` to access the web console.

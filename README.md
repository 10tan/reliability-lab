# Reliability-Lab: Stochastic Structural Reliability & Uncertainty Quantification Platform

[![CI Pipeline](https://github.com/username/reliability-lab/workflows/CI%20Pipeline/badge.svg)](https://github.com/username/reliability-lab/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Vite 4.5](https://img.shields.io/badge/Vite-4.5-646CFF.svg)](https://vitejs.dev/)
[![ISO 2394 Compliant](https://img.shields.io/badge/ISO-2394%20Compliant-green.svg)]()
[![DNV-RP-C210](https://img.shields.io/badge/DNV-RP--C210-orange.svg)]()

**Reliability-Lab** is an enterprise-grade, research-ready platform for stochastic structural reliability engineering, rare-event probability estimation ($P_f \in [10^{-9}, 10^{-2}]$), multivariate copula modeling, surrogate modeling, system reliability block diagram analysis, and automated numerical provenance reporting.

The platform combines a high-performance Python analytical backend with a responsive, dark-themed React/Vite single-page web application featuring live mathematical rendering via KaTeX and real-time SVG charting.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Mathematical Foundations & Terminology](#mathematical-foundations--terminology)
   - [1. Limit State Function & Failure Probability](#1-limit-state-function--failure-probability)
   - [2. Reliability Index & FORM Design Point](#2-reliability-index--form-design-point)
   - [3. Marginal Probability Distributions](#3-marginal-probability-distributions)
   - [4. Multivariate Dependence & Copula Theory](#4-multivariate-dependence--copula-theory)
   - [5. Dependence Statistics & Tail Dependence](#5-dependence-statistics--tail-dependence)
   - [6. Rare-Event Simulation Algorithms](#6-rare-event-simulation-algorithms)
   - [7. Global Sensitivity Analysis (Sobol Indices)](#7-global-sensitivity-analysis-sobol-indices)
   - [8. System Reliability & Minimal Cut-Set Analysis](#8-system-reliability--minimal-cut-set-analysis)
3. [Software Architecture](#software-architecture)
4. [Web Application Modules](#web-application-modules)
5. [Installation & Local Setup](#installation--local-setup)
6. [API Reference Endpoint Summary](#api-reference-endpoint-summary)
7. [Standards Compliance & Verification](#standards-compliance--verification)

---

## Platform Overview

Traditional structural engineering relies on deterministic partial safety factors. **Reliability-Lab** transitions engineering design and risk assessment to a rigorous probabilistic framework. It allows engineers to quantify the probability of structural failure under deep uncertainty, accounting for correlated environmental loads, material property degradation, geometric tolerances, and complex system interactions.

The platform is designed in strict accordance with international standards:
* **ISO 2394**: General principles on reliability for structures.
* **DNV-RP-C210**: Probabilistic methods for planning of inspection for fatigue cracks in offshore structures.

---

## Mathematical Foundations & Terminology

### 1. Limit State Function & Failure Probability

A structural system is characterized by a set of basic random input variables vector $\mathbf{X} = (X_1, X_2, \dots, X_n)^T \in \mathbb{R}^n$. The state of the system is governed by a performance function, also known as the **Limit State Function** $g(\mathbf{X})$.

The domain of $\mathbf{X}$ is partitioned into three distinct regions:

$$\text{Safe Region: } \Omega_s = \{\mathbf{x} \in \mathbb{R}^n \mid g(\mathbf{x}) > 0\}$$

$$\text{Limit State Surface: } \partial\Omega = \{\mathbf{x} \in \mathbb{R}^n \mid g(\mathbf{x}) = 0\}$$

$$\text{Failure Region: } \Omega_f = \{\mathbf{x} \in \mathbb{R}^n \mid g(\mathbf{x}) \leq 0\}$$

The exact **Probability of Failure** $P_f$ is defined by the multi-dimensional integral over the failure domain:

$$P_f = P\left(g(\mathbf{X}) \leq 0\right) = \int_{g(\mathbf{x}) \leq 0} f_{\mathbf{X}}(\mathbf{x}) \, d\mathbf{x}$$

where $f_{\mathbf{X}}(\mathbf{x})$ is the joint probability density function (PDF) of the random variables $\mathbf{X}$.

---

### 2. Reliability Index & FORM Design Point

#### Cornell & Hasofer-Lind Reliability Index ($\beta$)
The **Reliability Index** $\beta$ provides a standardized measure of safety. Under the First-Order Reliability Method (FORM), the random vector $\mathbf{X}$ is mapped to standard normal space $\mathbf{U} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ via the Rosenblatt or Nataf transformation $\mathbf{U} = T(\mathbf{X})$.

The reliability index $\beta$ represents the shortest distance from the origin in standard normal space to the limit state boundary $g_{\mathbf{U}}(\mathbf{U}) = 0$:

$$\beta = \min_{\mathbf{u} \in \{g_{\mathbf{U}}(\mathbf{u}) = 0\}} \|\mathbf{u}\|_2$$

The failure probability is related to $\beta$ via the standard normal cumulative distribution function $\Phi(\cdot)$:

$$P_f \approx \Phi(-\beta) \quad \iff \quad \beta = -\Phi^{-1}(P_f)$$

#### Hasofer-Lind Design Point ($\mathbf{u}^*$) & Alpha Sensitivity ($\alpha_i$)
The point on the failure boundary closest to the origin, $\mathbf{u}^*$, is called the **Design Point** (or Most Probable Point, MPP).

The normalized gradient vector at the design point defines the **Alpha Direction Cosines** $\boldsymbol{\alpha} = (\alpha_1, \alpha_2, \dots, \alpha_n)^T$:

$$\boldsymbol{\alpha} = -\frac{\nabla g_{\mathbf{U}}(\mathbf{u}^*)}{\|\nabla g_{\mathbf{U}}(\mathbf{u}^*)\|}$$

$$\sum_{i=1}^n \alpha_i^2 = 1$$

Each $\alpha_i^2$ quantifies the fractional contribution of input variable $X_i$ to the overall variance of the reliability index $\beta$.

---

### 3. Marginal Probability Distributions

Reliability-Lab supports five fundamental continuous marginal probability distributions for modeling load, resistance, geometry, and material properties:

#### 1. Normal (Gaussian) Distribution
Used for symmetric physical quantities (e.g., fabrication dimensions, dead loads).
* **Probability Density Function (PDF):**
  $$f(x; \mu, \sigma) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left( -\frac{(x - \mu)^2}{2\sigma^2} \right)$$
* **Cumulative Distribution Function (CDF):**
  $$F(x; \mu, \sigma) = \Phi\left( \frac{x - \mu}{\sigma} \right)$$

#### 2. Lognormal Distribution
Used for non-negative physical parameters (e.g., yield stress, elastic modulus, fracture toughness).
* **Probability Density Function (PDF):**
  $$f(x; \mu, \sigma) = \frac{1}{x \zeta \sqrt{2\pi}} \exp\left( -\frac{(\ln x - \lambda)^2}{2\zeta^2} \right), \quad x > 0$$
  where $\zeta^2 = \ln\left(1 + \frac{\sigma^2}{\mu^2}\right)$ and $\lambda = \ln(\mu) - \frac{1}{2}\zeta^2$.

#### 3. Weibull Distribution (Type-III Extreme Value)
Used for material fatigue life, wind speed extremes, and component time-to-failure.
* **Probability Density Function (PDF):**
  $$f(x; k, \lambda) = \frac{k}{\lambda} \left(\frac{x}{\lambda}\right)^{k-1} \exp\left( -\left(\frac{x}{\lambda}\right)^k \right), \quad x \geq 0$$
  where $k > 0$ is the shape parameter and $\lambda > 0$ is the scale parameter.

#### 4. Gumbel Distribution (Type-I Extreme Value)
Used for maximum annual environmental loads (wave heights, flood levels, extreme wind gusts).
* **Probability Density Function (PDF):**
  $$f(x; \mu, \beta) = \frac{1}{\beta} \exp\left( -z - e^{-z} \right), \quad z = \frac{x - \mu}{\beta}$$

#### 5. Uniform Distribution
Used when only upper and lower physical bounds are known without additional distributional data.
* **Probability Density Function (PDF):**
  $$f(x; a, b) = \frac{1}{b - a}, \quad a \leq x \leq b$$

---

### 4. Multivariate Dependence & Copula Theory

#### Sklar's Theorem (1959)
Sklar's theorem states that any multivariate joint cumulative distribution function $F(x_1, \dots, x_n)$ can be expressed in terms of its univariate marginal distributions $F_i(x_i)$ and a copula function $C$:

$$F(x_1, x_2, \dots, x_n) = C\left(F_1(x_1), F_2(x_2), \dots, F_n(x_n); \boldsymbol{\theta}\right)$$

where $u_i = F_i(x_i) \in [0, 1]$ are uniform variates, and $\boldsymbol{\theta}$ parameterizes the dependence structure.

#### Copula Families Implemented

1. **Gaussian Copula (Implicit):**
   Models symmetric linear rank correlation without tail dependence.
   $$C_R(\mathbf{u}) = \mathbf{\Phi}_R\left(\Phi^{-1}(u_1), \Phi^{-1}(u_2), \dots, \Phi^{-1}(u_n)\right)$$
   where $\mathbf{\Phi}_R$ is the joint CDF of a multivariate normal vector with correlation matrix $\mathbf{R}$.

2. **Clayton Copula (Archimedean):**
   Exhibits asymmetric strong **lower tail dependence**. Ideal for joint low-strength occurrences in structural components.
   $$C_\theta(u_1, u_2) = \left( u_1^{-\theta} + u_2^{-\theta} - 1 \right)^{-1/\theta}, \quad \theta > 0$$

3. **Gumbel Copula (Archimedean):**
   Exhibits asymmetric strong **upper tail dependence**. Ideal for joint extreme environmental events (e.g., simultaneous peak wave height and storm surge).
   $$C_\theta(u_1, u_2) = \exp\left( -\left[ (-\ln u_1)^\theta + (-\ln u_2)^\theta \right]^{1/\theta} \right), \quad \theta \geq 1$$

4. **Frank Copula (Archimedean):**
   Exhibits symmetric dependence across the entire domain with zero asymptotic tail dependence.
   $$C_\theta(u, v) = -\frac{1}{\theta} \ln\left( 1 + \frac{(e^{-\theta u} - 1)(e^{-\theta v} - 1)}{e^{-\theta} - 1} \right), \quad \theta \neq 0$$

---

### 5. Dependence Statistics & Tail Dependence

#### Kendall's Rank Correlation ($\tau$)
Measures concordant versus discordant pairs in bivariate data:
$$\tau = 4 \int_0^1 \int_0^1 C(u, v) \, dC(u, v) - 1$$

#### Spearman's Rank Correlation ($\rho_s$)
Measures monotonic relationships between rank-transformed variables:
$$\rho_s = 12 \int_0^1 \int_0^1 u v \, dC(u, v) - 3$$

#### Tail Dependence Coefficients ($\lambda_L, \lambda_U$)
* **Lower Tail Dependence Coefficient ($\lambda_L$):**
  $$\lambda_L = \lim_{q \to 0^+} P\left(U_2 \leq q \mid U_1 \leq q\right) = \lim_{q \to 0^+} \frac{C(q, q)}{q}$$
  * For Clayton Copula: $\lambda_L = 2^{-1/\theta}$
  * For Gaussian & Frank Copula: $\lambda_L = 0$

* **Upper Tail Dependence Coefficient ($\lambda_U$):**
  $$\lambda_U = \lim_{q \to 1^-} P\left(U_2 > q \mid U_1 > q\right) = \lim_{q \to 1^-} \frac{1 - 2q + C(q, q)}{1 - q}$$
  * For Gumbel Copula: $\lambda_U = 2 - 2^{1/\theta}$
  * For Gaussian & Frank Copula: $\lambda_U = 0$

---

### 6. Rare-Event Simulation Algorithms

#### 1. Direct Monte Carlo Simulation (MCS)
Generates $N$ independent identically distributed (i.i.d.) samples $\mathbf{X}^{(1)}, \dots, \mathbf{X}^{(N)}$ from the joint distribution.
* **Estimator:**
  $$\hat{P}_f = \frac{1}{N} \sum_{i=1}^N I\left(g(\mathbf{X}^{(i)}) \leq 0\right)$$
  where $I(\cdot)$ is the indicator function ($1$ if true, $0$ if false).
* **Variance & Coefficient of Variation:**
  $$\operatorname{Var}(\hat{P}_f) = \frac{P_f(1 - P_f)}{N} \quad \implies \quad \operatorname{COV}(\hat{P}_f) = \sqrt{\frac{1 - P_f}{N P_f}}$$

#### 2. Subset Simulation (SuS - Au & Beck 2001)
Expresses a rare failure event $F = \{g(\mathbf{X}) \leq 0\}$ as the intersection of $m$ nested intermediate failure events $F_1 \supset F_2 \supset \dots \supset F_m = F$:
$$F_k = \{g(\mathbf{X}) \leq b_k\}, \quad b_1 > b_2 > \dots > b_m = 0$$

The small failure probability $P_f$ is computed as a product of larger conditional probabilities:
$$P_f = P(F_1) \prod_{k=2}^m P(F_k \mid F_{k-1}) \approx p_0^m$$
where $p_0$ (typically $0.1$) is chosen so that each conditional probability is easily estimated using Markov Chain Monte Carlo (MCMC) with Modified Metropolis-Hastings (MMH) sampling.

#### 3. Adaptive Importance Sampling (AIS - Cross-Entropy)
Replaces the target density $f_{\mathbf{X}}(\mathbf{x})$ with an optimized proposal sampling distribution $h(\mathbf{x})$ centered closer to the failure domain:
$$\hat{P}_f = \frac{1}{N} \sum_{i=1}^N I\left(g(\mathbf{X}^{(i)}) \leq 0\right) \frac{f_{\mathbf{X}}(\mathbf{X}^{(i)})}{h(\mathbf{X}^{(i)})}, \quad \mathbf{X}^{(i)} \sim h(\mathbf{x})$$

#### 4. Polynomial Chaos Expansion (PCE Surrogate)
Constructs a spectral representation of the limit state function $g(\mathbf{X})$ using orthogonal polynomials $\Psi_{\boldsymbol{\alpha}}(\mathbf{X})$:
$$g(\mathbf{X}) \approx \widehat{g}_{PCE}(\mathbf{X}) = \sum_{\boldsymbol{\alpha} \in \mathcal{A}} c_{\boldsymbol{\alpha}} \Psi_{\boldsymbol{\alpha}}(\mathbf{X})$$
* **Hermite Polynomials** for Gaussian random variables.
* **Legendre Polynomials** for Uniform random variables.

---

### 7. Global Sensitivity Analysis (Sobol Indices)

Variance-based global sensitivity analysis decomposes the total variance $V = \operatorname{Var}(g(\mathbf{X}))$ into contributions from individual variables and their interactions:

$$V = \sum_{i=1}^n V_i + \sum_{1 \leq i < j \leq n} V_{ij} + \dots + V_{1, 2, \dots, n}$$

* **First-Order Sobol Index ($S_i$):**
  Measures the main effect of variable $X_i$ on output variance without interactions.
  $$S_i = \frac{\operatorname{Var}_{X_i}\left( \mathbb{E}_{\mathbf{X}_{\sim i}}[g(\mathbf{X}) \mid X_i] \right)}{\operatorname{Var}(g(\mathbf{X}))}$$

* **Total-Effect Sobol Index ($S_{Ti}$):**
  Measures the total contribution of variable $X_i$, including all higher-order interactions with other variables.
  $$S_{Ti} = 1 - \frac{\operatorname{Var}_{\mathbf{X}_{\sim i}}\left( \mathbb{E}_{X_i}[g(\mathbf{X}) \mid \mathbf{X}_{\sim i}] \right)}{\operatorname{Var}(g(\mathbf{X}))}$$

---

### 8. System Reliability & Minimal Cut-Set Analysis

Real-world engineering assets consist of interconnected components arranged in structural systems.

#### 1. Series System (Weakest-Link Configuration)
The system fails if **any** constituent component fails.
$$F_{\text{sys}} = \bigcup_{j=1}^m \{g_j(\mathbf{X}) \leq 0\}$$
$$P_{f, \text{sys}} = P\left( \bigcup_{j=1}^m \{g_j(\mathbf{X}) \leq 0\} \right) = 1 - P\left( \bigcap_{j=1}^m \{g_j(\mathbf{X}) > 0\} \right)$$

#### 2. Parallel System (Redundant Configuration)
The system fails only if **all** constituent components fail simultaneously.
$$F_{\text{sys}} = \bigcap_{j=1}^m \{g_j(\mathbf{X}) \leq 0\}$$

#### 3. General Fault-Tree System (Minimal Cut Sets)
A **Minimal Cut Set** $C_k$ is a minimum combination of component failures that causes system failure. The overall system failure probability is computed using Ditlevsen's narrow bounds or Genz multivariate normal numerical integration:
$$P_{f, \text{sys}} = P\left( \bigcup_{k=1}^{K} \bigcap_{j \in C_k} \{g_j(\mathbf{X}) \leq 0\} \right)$$

---

## Software Architecture

```
reliability-lab/
├── backend/                  # FastApi Python analytical engine
│   ├── src/reliability_lab/
│   │   ├── api/              # REST & WebSocket API handlers
│   │   ├── core/             # Copulas, distributions, limit state evaluators
│   │   ├── algorithms/       # MCS, Subset Sim, AIS, PCE, FORM
│   │   ├── system/           # System Reliability & Block Diagrams
│   │   └── reports/          # Automated PDF report generation
│   ├── tests/                # Pytest unit & integration test suites
│   └── pyproject.toml
│
├── frontend/                 # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/       # ModelBuilder, SimulationWorkbench, SystemView, AboutPage
│   │   ├── types/            # TypeScript interface declarations
│   │   ├── index.css         # Dark theme CSS design system
│   │   ├── App.tsx           # Main application routing container
│   │   └── main.tsx          # Application entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Web Application Modules

1. **Model Builder & Copula Setup (`/model`):**
   * Formulate performance functions $g(\mathbf{X})$.
   * Configure marginal distributions and parameters.
   * Interactively visualize 2D copula sample space distributions (300 points) and compute Kendall's $\tau$, Spearman's $\rho_s$, and tail dependence coefficients.

2. **Simulation Workbench (`/simulation`):**
   * Execute Monte Carlo, Subset Simulation, Importance Sampling, or PCE.
   * View enlarged convergence plots with 95% confidence bands.
   * Inspect $g(\mathbf{X})$ density histograms with shaded failure regions.
   * Explore 2D sample space plots and Sobol sensitivity indices.

3. **System Reliability Block Diagram (`/system`):**
   * Model series, parallel, and cut-set system structures.
   * Interactive dark-mode SVG block diagrams and component contribution bars.

4. **Provenance & Report Viewer (`/reports`):**
   * Generate and preview publication-ready PDF reliability reports.

5. **Comprehensive Technical Guide (`/about`):**
   * In-depth documentation with complete KaTeX mathematical notation.

---

## Installation & Local Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **Python**: v3.10 or higher

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e .
PYTHONPATH=src python3 -m uvicorn reliability_lab.api.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install --prefer-offline
./node_modules/.bin/vite build
python3 -m http.server 3000 --directory dist
```

Access the application in your browser at `http://localhost:3000`.

---

## API Reference Endpoint Summary

| HTTP Method | Endpoint Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and version info |
| `GET` | `/api/benchmarks` | Pre-defined reliability test benchmarks |
| `POST` | `/api/models` | Register a new stochastic model specification |
| `POST` | `/api/runs` | Trigger a reliability simulation run |
| `GET` | `/api/runs/{run_id}` | Retrieve simulation results & convergence metrics |
| `POST` | `/api/system` | Compute system reliability for block diagrams |
| `GET` | `/api/reports/{run_id}` | Download generated PDF execution audit report |

---

## Standards Compliance & Verification

Reliability-Lab results have been verified against published benchmarks:
* **Linear Limit State Benchmark:** $g(\mathbf{X}) = \beta - \frac{1}{\sqrt{n}}\sum_{i=1}^n X_i$.
* **Parabolic Limit State Benchmark:** $g(\mathbf{X}) = b - X_2 - c X_1^2$.
* **Rackwitz-Fiessler R-S Benchmark:** $g(R, S) = R - S$.

All code changes undergo automated unit testing via `pytest` and TypeScript static type validation via `tsc`.

---

*Developed for Advanced Reliability Engineering, Risk Analysis, and Stochastic Simulation.*

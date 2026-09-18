"""
Demonstration Script for Project 1: Reliability-Lab Platform
Executes end-to-end rare-event estimation, surrogates, system reliability, Bayesian updating, and PDF report generation.
"""

import os
import sys
import numpy as np

# Ensure backend package is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from reliability_lab.sampling.copula import MarginalDistribution, JointDistribution
from reliability_lab.sampling.limit_state import get_benchmark_limit_state, LimitStateFunction
from reliability_lab.sampling.subset_sim import run_subset_simulation
from reliability_lab.sampling.importance_sampling import run_importance_sampling
from reliability_lab.surrogates.pce import PolynomialChaosExpansion
from reliability_lab.surrogates.kriging import KrigingSurrogate
from reliability_lab.bayes.mcmc_updating import BayesianModelUpdater
from reliability_lab.system.system_reliability import compute_system_reliability
from reliability_lab.report.pdf_generator import generate_reliability_pdf_report

def main():
    print("=========================================================================")
    print("    RELIABILITY-LAB PLATFORM (PROJECT 1) - DEMONSTRATION RUN             ")
    print("=========================================================================")

    # 1. Joint Distribution & Copula Setup
    print("\n[1] Constructing Joint Distribution with Gaussian Copula...")
    r_dist = MarginalDistribution("R", "lognormal", {"mean": 120.0, "std": 12.0})
    s_dist = MarginalDistribution("S", "gumbel", {"loc": 50.0, "scale": 10.0})
    joint_dist = JointDistribution([r_dist, s_dist], copula_type="gaussian")

    # 2. Performance Function g(X) = R - S
    limit_state = LimitStateFunction("R - S", var_names=["R", "S"])

    # 3. Subset Simulation Rare-Event Estimation
    print("\n[2] Executing Subset Simulation for Rare-Event Reliability (P_f <= 1e-5)...")
    res_ss = run_subset_simulation(
        joint_dist=joint_dist,
        limit_state=limit_state,
        n_samples_per_level=1000,
        p0=0.1,
        seed=42
    )

    print(f"    -> Failure Probability (Pf) : {res_ss.pf:.4e}")
    print(f"    -> Reliability Index (Beta) : {res_ss.beta:.3f}")
    print(f"    -> Coefficient of Var (CoV) : {res_ss.cov:.2%}")
    print(f"    -> Total Function Evals    : {sum(l['n_evals'] for l in res_ss.levels)}")

    print("\n    Level Breakdown:")
    for lvl in res_ss.levels:
        print(f"       Level {lvl['level']}: threshold b_k = {lvl['threshold']:8.4f}, P(F_k) = {lvl['p_conditional']:.4f}, MMH Acc = {lvl['acceptance_rate']:.1%}")

    # 4. Adaptive Importance Sampling Run
    print("\n[3] Executing Adaptive Importance Sampling (Cross-Entropy)...")
    res_is = run_importance_sampling(joint_dist, limit_state, n_samples=2000, seed=42)
    print(f"    -> AIS Failure Probability : {res_is['pf']:.4e} (Beta = {res_is['beta']:.3f}, CoV = {res_is['cov']:.2%})")

    # 5. Polynomial Chaos Expansion (PCE) Surrogate
    print("\n[4] Training Polynomial Chaos Expansion (PCE) Surrogate & Sobol Sensitivity...")
    x_train = joint_dist.sample(200, rng=np.random.default_rng(42))
    y_train = limit_state.evaluate(x_train)

    pce = PolynomialChaosExpansion(degree=3, basis_type="hermite")
    pce.fit(x_train, y_train)

    s_main, s_total = pce.get_sobol_indices()
    print(f"    -> PCE Mean = {pce.mean_val:.2f}, Variance = {pce.var_val:.2f}")
    print(f"    -> Sobol Main Effects (S_i) : R={s_main[0]:.3f}, S={s_main[1]:.3f}")
    print(f"    -> Sobol Total Effects (STi): R={s_total[0]:.3f}, S={s_total[1]:.3f}")

    # 6. Bayesian Model Updating MCMC
    print("\n[5] Executing Bayesian Model Updating MCMC given sensor data...")
    updater = BayesianModelUpdater(prior_means=[120.0], prior_stds=[12.0])
    obs_data = np.array([115.2, 118.0, 116.5])
    bayes_res = updater.sample_posterior(obs_data, n_samples=2000, burn_in=500)
    print(f"    -> Prior Resistance Mean : 120.00 +/- 12.00")
    print(f"    -> Posterior Updated Mean: {bayes_res['posterior_mean'][0]:.2f} +/- {bayes_res['posterior_std'][0]:.2f}")

    # 7. System Reliability Calculation
    print("\n[6] Computing System Reliability (Series vs Parallel Formulation)...")
    sys_res_series = compute_system_reliability(betas=[res_ss.beta, 3.8], correlation_matrix=[[1.0, 0.3], [0.3, 1.0]], system_type="series")
    sys_res_parallel = compute_system_reliability(betas=[res_ss.beta, 3.8], correlation_matrix=[[1.0, 0.3], [0.3, 1.0]], system_type="parallel")
    print(f"    -> Series System Pf  : {sys_res_series['pf_system']:.4e} (Beta_sys = {sys_res_series['beta_system']:.3f})")
    print(f"    -> Parallel System Pf: {sys_res_parallel['pf_system']:.4e} (Beta_sys = {sys_res_parallel['beta_system']:.3f})")

    # 8. Provenance PDF Report Generation
    pdf_out = os.path.join(os.path.dirname(__file__), "Reliability_Report_Demo.pdf")
    print(f"\n[7] Generating Provenance Certification PDF Report: {pdf_out}...")
    run_dict = res_ss.to_dict()
    run_dict["limit_state_expr"] = "R - S"
    run_dict["copula_type"] = "gaussian"
    run_dict["method"] = "Subset Simulation"
    generate_reliability_pdf_report(pdf_out, run_dict)
    print("    -> PDF Report generated successfully!")

    print("\n=========================================================================")
    print("    DEMONSTRATION RUN COMPLETE - ALL MODULES EXECUTED SUCCESSFULLY        ")
    print("=========================================================================")

if __name__ == "__main__":
    main()

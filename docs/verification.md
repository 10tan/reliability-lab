# Verification & Validation (V&V) Strategy

## Code Verification
- **Analytical Linear Limit State**: Validated against exact $P_f = \Phi(-\beta)$ for standard normal inputs.
- **Parabolic Limit State**: Validated against published benchmarks.
- **Rackwitz-Fiessler Beam Capacity**: Verified against tabulated FORM/SORM values.
- **Multivariate Normal Integration**: Verified using Genz algorithm against published MVN tables.

## Numerical Provenance
Every simulation run records:
- Random seed state
- Level-by-level intermediate thresholds $b_k$
- Conditional probabilities $p_0$
- Acceptance rates of Modified Metropolis-Hastings chains
- Coefficient of variation $\text{CoV}(P_f)$

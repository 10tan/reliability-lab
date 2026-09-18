import React from 'react';
import katex from 'katex';
import {
  BookOpen, Calculator, Activity, GitMerge, FileText, Cpu, Shield, BarChart3, Layers, Zap, Target, TrendingUp
} from 'lucide-react';

const renderMath = (tex: string, displayMode: boolean = false) => {
  return { __html: katex.renderToString(tex, { throwOnError: false, displayMode }) };
};

export const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>
          <Shield size={36} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px' }} />
          Reliability-Lab
        </h1>
        <p>
          State-of-the-art computational framework for stochastic structural reliability,
          risk quantification, and complex system safety analysis.
        </p>
        <div className="hero-badges">
          <span className="badge badge-blue">ISO 2394 Compliant</span>
          <span className="badge badge-purple">DNV-RP-C210</span>
          <span className="badge badge-green">Research Grade</span>
          <span className="badge badge-orange">GPU Accelerated</span>
        </div>
      </div>

      {/* =========== Platform Overview =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon blue"><BookOpen size={18} /></span>
          Platform Overview
        </h2>
        <p className="about-text">
          Reliability-Lab is a comprehensive, enterprise-grade stochastic structural reliability engineering platform developed to tackle the most demanding uncertainty quantification and risk analysis challenges. Moving beyond traditional deterministic safety factors, this platform enables a rigorous, probabilistic assessment of engineering designs, structural capacities, and system integrities. It serves as an essential tool for structural engineers, academic researchers, risk analysts, and safety compliance officers who require deep insights into failure probabilities and sensitivity metrics under deep uncertainty.
        </p>
        <p className="about-text">
          The platform is meticulously engineered to ensure strict compliance with primary international engineering standards. This includes adherence to the principles outlined in <strong>ISO 2394: General principles on reliability for structures</strong>, which dictates the fundamental requirements for the reliability-based design and assessment of load-bearing structures. Furthermore, it integrates methodologies aligned with <strong>DNV-RP-C210: Probabilistic methods for planning of inspection for fatigue cracks in offshore structures</strong>, providing domain-specific capabilities for marine and offshore engineering applications where fatigue and fracture reliability are paramount.
        </p>
        <p className="about-text">
          At its core, Reliability-Lab offers a seamless, end-to-end workflow: from defining complex stochastic models with correlated random variables, formulating highly nonlinear limit state functions (performance functions), executing advanced variance-reduction simulation techniques, to evaluating large-scale system fault trees and block diagrams. The platform democratizes access to sophisticated computational reliability methods, wrapping them in an intuitive, high-performance web interface while maintaining the mathematical rigor required for critical infrastructure assessment.
        </p>
      </section>

      {/* =========== Model Builder & Copula Setup =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon purple"><Layers size={18} /></span>
          Model Builder &amp; Copula Setup
        </h2>
        <p className="about-text">
          A fundamental step in any structural reliability analysis is the accurate characterization of uncertainties governing the basic random variables (load, material properties, geometric dimensions). Reliability-Lab's Model Builder supports an extensive library of marginal probability distributions, including Normal, Lognormal, Weibull, Gumbel, and Uniform distributions. However, engineering variables are rarely perfectly independent. The platform's sophisticated Copula Setup module allows users to model complex multivariate dependence structures independent of the choice of marginals.
        </p>
        <p className="about-text">
          By leveraging Sklar's Theorem, we separate the marginal distributions from the dependence structure. The joint cumulative distribution function <span dangerouslySetInnerHTML={renderMath('F(x_1, \\dots, x_n)')} /> is constructed using a copula function <span dangerouslySetInnerHTML={renderMath('C')} />:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('F(x_1, \\dots, x_n) = C(F_1(x_1), \\dots, F_n(x_n); \\theta)', true)} />
        <p className="about-text">
          The platform supports several copula families, including the <strong>Gaussian copula</strong> for linear rank correlation, the <strong>Clayton copula</strong> for modeling lower tail dependence (e.g., joint extreme low strengths), and the <strong>Gumbel copula</strong> for upper tail dependence (e.g., joint extreme wave heights).
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon"><Target size={18} /></div>
            <h4>Gaussian Copula</h4>
            <p>Linear rank correlation via the multivariate normal distribution. Ideal for moderate, symmetric dependencies.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}><TrendingUp size={18} /></div>
            <h4>Clayton Copula</h4>
            <p>Lower tail dependence — captures joint extreme low events. Critical for correlated strength degradation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}><BarChart3 size={18} /></div>
            <h4>Gumbel Copula</h4>
            <p>Upper tail dependence — models joint extreme high events. Essential for correlated environmental loads.</p>
          </div>
        </div>

        <p className="about-text">
          To map correlated non-normal physical variables into the independent standard normal space required by most reliability algorithms, Reliability-Lab utilizes the generalized <strong>Nataf transformation</strong>. Let <span dangerouslySetInnerHTML={renderMath('\\mathbf{X}')} /> be the vector of basic random variables with correlation matrix <span dangerouslySetInnerHTML={renderMath('\\mathbf{R}')} />. We transform this to standard normal variables <span dangerouslySetInnerHTML={renderMath('\\mathbf{U}')} />. The failure domain is defined by a performance function <span dangerouslySetInnerHTML={renderMath('g(\\mathbf{X})')} />, also known as the limit state function, where failure occurs when <span dangerouslySetInnerHTML={renderMath('g(\\mathbf{X}) \\leq 0')} />. The probability of failure <span dangerouslySetInnerHTML={renderMath('P_f')} /> is the integral of the joint probability density function <span dangerouslySetInnerHTML={renderMath('f_{\\mathbf{X}}(\\mathbf{x})')} /> over the failure domain:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('P_f = P(g(\\mathbf{X}) \\leq 0) = \\int_{g(\\mathbf{x}) \\leq 0} f_{\\mathbf{X}}(\\mathbf{x}) \\, d\\mathbf{x} = \\int_{g(T^{-1}(\\mathbf{u})) \\leq 0} \\phi_n(\\mathbf{u}) \\, d\\mathbf{u}', true)} />
        <p className="about-text">
          Users can validate their setups against built-in benchmark problems, including the classic <strong>Linear</strong> limit state, highly nonlinear <strong>Parabolic</strong> models, and the standard <strong>Rackwitz-Fiessler</strong> benchmark, ensuring numerical stability before running complex real-world models.
        </p>
      </section>

      {/* =========== Simulation Workbench =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon green"><Activity size={18} /></span>
          Simulation Workbench
        </h2>
        <p className="about-text">
          The Simulation Workbench is the computational engine of Reliability-Lab, featuring a suite of advanced stochastic sampling algorithms tailored for rare-event estimation. Direct Monte Carlo Simulation (MCS) is often computationally prohibitive for evaluating probabilities of failure on the order of <span dangerouslySetInnerHTML={renderMath('10^{-4}')} /> to <span dangerouslySetInnerHTML={renderMath('10^{-6}')} />, requiring millions of limit state evaluations. Our platform implements three powerful variance-reduction techniques to overcome this computational barrier.
        </p>

        <div className="about-highlight">
          <strong>Subset Simulation (Au &amp; Beck 2001)</strong> — The gold standard for rare-event probability estimation in structural reliability.
        </div>

        <p className="about-text">
          This powerful variance reduction technique expresses the small failure probability as a product of larger conditional probabilities. The failure domain <span dangerouslySetInnerHTML={renderMath('F')} /> is expressed as the intersection of a sequence of intermediate failure events <span dangerouslySetInnerHTML={renderMath('F_1 \\supset F_2 \\supset \\dots \\supset F_m = F')} />. The probability of failure is decomposed as:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('P_f = P(F_m) = P(F_1) \\prod_{k=2}^m P(F_k | F_{k-1})', true)} />
        <p className="about-text">
          By adaptively choosing the intermediate thresholds such that each conditional probability <span dangerouslySetInnerHTML={renderMath('P(F_k | F_{k-1}) \\approx p_0')} /> (typically <span dangerouslySetInnerHTML={renderMath('p_0 = 0.1')} />), we can estimate <span dangerouslySetInnerHTML={renderMath('P_f \\approx p_0^m')} />. The conditional samples at each subset level are generated using a <strong>Modified Metropolis-Hastings (MMH)</strong> algorithm, a specialized Markov Chain Monte Carlo (MCMC) technique that ensures high acceptance rates even in high-dimensional standard normal spaces.
        </p>

        <div className="about-highlight">
          <strong>Adaptive Importance Sampling</strong> — Cross-Entropy optimization for optimal proposal distributions.
        </div>

        <p className="about-text">
          This algorithm adaptively shifts the sampling density <span dangerouslySetInnerHTML={renderMath('h(\\mathbf{x})')} /> towards the most probable point of failure (design point), evaluating the probability as:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('P_f = \\int_{g(\\mathbf{x}) \\leq 0} \\frac{f_{\\mathbf{X}}(\\mathbf{x})}{h(\\mathbf{x})} h(\\mathbf{x}) \\, d\\mathbf{x} = \\mathbb{E}_h \\left[ I(g(\\mathbf{X}) \\leq 0) \\frac{f_{\\mathbf{X}}(\\mathbf{X})}{h(\\mathbf{X})} \\right]', true)} />

        <div className="about-highlight">
          <strong>Polynomial Chaos Expansion (PCE)</strong> — Surrogate-based acceleration for expensive computational models.
        </div>

        <p className="about-text">
          For extreme computational bottlenecks, where a single limit state evaluation (e.g., a non-linear Finite Element Analysis) takes minutes or hours, the platform provides surrogate modeling via PCE. The computational model is approximated by projecting it onto a basis of orthogonal multivariate polynomials <span dangerouslySetInnerHTML={renderMath('\\Psi_{\\mathbf{\\alpha}}')} />:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('g(\\mathbf{X}) \\approx \\sum_{\\mathbf{\\alpha} \\in \\mathcal{A}} c_{\\mathbf{\\alpha}} \\Psi_{\\mathbf{\\alpha}}(\\mathbf{X})', true)} />
        <p className="about-text">
          Once the coefficients <span dangerouslySetInnerHTML={renderMath('c_{\\mathbf{\\alpha}}')} /> are computed via sparse regression, millions of samples can be evaluated instantly on the surrogate model, enabling rapid reliability assessment of computationally expensive black-box FEM solvers.
        </p>
      </section>

      {/* =========== System Reliability Block Diagram =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon orange"><GitMerge size={18} /></span>
          System Reliability Block Diagram
        </h2>
        <p className="about-text">
          Individual component reliability analysis is often insufficient for real-world engineering systems. Reliability-Lab provides a robust System Reliability module utilizing Block Diagrams and Fault Trees to evaluate the stochastic performance of complex networks composed of multiple interconnected components.
        </p>
        <p className="about-text">
          The platform handles fundamental topological constructs:
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}><Zap size={18} /></div>
            <h4>Series Systems</h4>
            <p>System fails if <em>any</em> component fails. Characteristic of weakest-link structures (e.g., statically determinate trusses).</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}><Layers size={18} /></div>
            <h4>Parallel Systems</h4>
            <p>System fails only if <em>all</em> components fail. Represents structurally redundant systems with multiple load paths.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}><GitMerge size={18} /></div>
            <h4>Minimal Cut Sets</h4>
            <p>The smallest sets of components whose simultaneous failure induces systemic collapse. For arbitrarily complex networks.</p>
          </div>
        </div>
        <p className="about-text">
          The failure probability for a series system with <span dangerouslySetInnerHTML={renderMath('n')} /> components having limit states <span dangerouslySetInnerHTML={renderMath('g_i(\\mathbf{X})')} /> is:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('P_{f,\\text{sys}} = P\\left( \\bigcup_{i=1}^n \\{g_i(\\mathbf{X}) \\leq 0\\} \\right)', true)} />
        <p className="about-text">
          For parallel systems with structural redundancy:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('P_{f,\\text{sys}} = P\\left( \\bigcap_{i=1}^n \\{g_i(\\mathbf{X}) \\leq 0\\} \\right)', true)} />
        <p className="about-text">
          Because component limit states are often highly correlated (driven by common environmental loads), computing these joint probabilities analytically is non-trivial. Reliability-Lab employs the advanced <strong>Genz Algorithm</strong> to numerically evaluate high-dimensional multivariate normal (MVN) cumulative distribution functions over hyper-rectangular domains:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('\\Phi_n(\\mathbf{a}, \\mathbf{b}; \\boldsymbol{\\Sigma}) = \\frac{1}{\\sqrt{(2\\pi)^n |\\boldsymbol{\\Sigma}|}} \\int_{a_1}^{b_1} \\cdots \\int_{a_n}^{b_n} \\exp\\left( -\\frac{1}{2} \\mathbf{x}^T \\boldsymbol{\\Sigma}^{-1} \\mathbf{x} \\right) d\\mathbf{x}', true)} />
      </section>

      {/* =========== Mathematical Foundations =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon blue"><Calculator size={18} /></span>
          Mathematical Foundations
        </h2>
        <p className="about-text">
          The platform is deeply rooted in contemporary probability theory and stochastic mechanics. Beyond Monte Carlo methods, we provide analytical approximation techniques such as the <strong>First-Order Reliability Method (FORM)</strong>. FORM maps the random variables to the standard normal space and linearizes the limit state function at the Most Probable Point (MPP) of failure, or the <em>design point</em> <span dangerouslySetInnerHTML={renderMath('\\mathbf{u}^*')} />.
        </p>
        <p className="about-text">
          The design point is found by solving a constrained optimization problem: minimizing the distance from the origin to the failure surface. This minimum distance is defined as the <strong>Cornell/Hasofer-Lind reliability index</strong>, <span dangerouslySetInnerHTML={renderMath('\\beta')} />. The structural failure probability <span dangerouslySetInnerHTML={renderMath('P_f')} /> is then elegantly approximated using the standard normal cumulative distribution function <span dangerouslySetInnerHTML={renderMath('\\Phi')} />:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('\\mathbf{u}^* = \\arg \\min_{\\mathbf{u} \\in \\{g(\\mathbf{u}) = 0\\}} \\|\\mathbf{u}\\|_2 \\quad \\implies \\quad \\beta = \\|\\mathbf{u}^*\\|_2 \\quad \\implies \\quad P_f \\approx \\Phi(-\\beta)', true)} />

        <div className="about-highlight">
          <strong>Global Sensitivity Analysis</strong> — Variance-based Sobol Indices quantify the relative importance of each uncertain variable.
        </div>

        <p className="about-text">
          Understanding which variables drive the uncertainty is crucial for risk mitigation. The platform performs rigorous Global Sensitivity Analysis (GSA) using variance-based <strong>Sobol Indices</strong>. The total variance <span dangerouslySetInnerHTML={renderMath('V')} /> of the model output is decomposed into contributions from individual variables and their interactions:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('V(Y) = \\sum_i V_i + \\sum_{i<j} V_{ij} + \\dots + V_{12\\dots n}', true)} />
        <p className="about-text">
          The first-order Sobol index <span dangerouslySetInnerHTML={renderMath('S_i = V_i / V(Y)')} /> measures the main effect of variable <span dangerouslySetInnerHTML={renderMath('X_i')} />, while importance factors derived from FORM directional cosines <span dangerouslySetInnerHTML={renderMath('\\alpha_i')} /> dictate probabilistic sensitivities around the design point.
        </p>

        <div className="about-highlight">
          <strong>Bayesian Model Updating</strong> — Posterior inference via MCMC for life-cycle reliability management.
        </div>

        <p className="about-text">
          To accommodate life-cycle management and digital twin frameworks, the platform supports <strong>Bayesian Model Updating</strong>. As new structural health monitoring (SHM) or inspection data <span dangerouslySetInnerHTML={renderMath('\\mathcal{D}')} /> becomes available, the prior probability models of the parameters <span dangerouslySetInnerHTML={renderMath('\\boldsymbol{\\theta}')} /> are updated to posterior distributions using Bayes' Theorem via MCMC sampling:
        </p>
        <div className="math-display" dangerouslySetInnerHTML={renderMath('p(\\boldsymbol{\\theta} | \\mathcal{D}) = \\frac{p(\\mathcal{D} | \\boldsymbol{\\theta}) \\, p(\\boldsymbol{\\theta})}{\\int p(\\mathcal{D} | \\boldsymbol{\\theta}) \\, p(\\boldsymbol{\\theta}) \\, d\\boldsymbol{\\theta}}', true)} />
      </section>

      {/* =========== PDF Report Generation =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon green"><FileText size={18} /></span>
          PDF Report Generation &amp; Traceability
        </h2>
        <p className="about-text">
          In safety-critical engineering domains, executing calculations is only half the battle; the results must be thoroughly documented, auditable, and verifiable. Reliability-Lab features an automated, high-fidelity PDF report generation engine that compiles exhaustive engineering dossiers strictly compliant with ISO 2394 reporting standards.
        </p>
        <p className="about-text">
          Data provenance and Verification &amp; Validation (V&amp;V) are built into the architecture. Every simulation run maintains a strict audit trail, capturing PRNG (Pseudorandom Number Generator) seeds, software versions, exact input marginals, dependence structures, and limit state definitions. This guarantees 100% reproducibility of stochastic results for third-party certification bodies.
        </p>
        <p className="about-text">
          Generated reports contain comprehensive sections detailing: the statistical definition of all random variables, visual plots of copula densities and marginal PDFs, mathematical definitions of the performance functions, convergence plots for Subset Simulation and MCMC traces, graphical block diagrams for system reliability networks, and a complete breakdown of reliability indices (<span dangerouslySetInnerHTML={renderMath('\\beta')} />), failure probabilities (<span dangerouslySetInnerHTML={renderMath('P_f')} />), and Sobol sensitivity matrices. Each report includes a cryptographic hash for tamper-proof verification and compliance with third-party audit requirements.
        </p>
      </section>

      {/* =========== Technical Architecture =========== */}
      <section className="about-section">
        <h2 className="section-title">
          <span className="section-icon purple"><Cpu size={18} /></span>
          Technical Architecture
        </h2>
        <p className="about-text">
          Reliability-Lab is built on a modern, distributed architecture designed for intense numerical computing and responsive user interactions.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)' }}><Zap size={18} /></div>
            <h4>Backend Engine</h4>
            <p>High-performance Python with PyTorch and SciPy, exposed via asynchronous FastAPI endpoints for maximum throughput.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}><Layers size={18} /></div>
            <h4>Frontend Interface</h4>
            <p>Reactive React + TypeScript application, bundled with Vite for ultra-fast HMR and optimized production builds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}><Activity size={18} /></div>
            <h4>Real-Time Streaming</h4>
            <p>WebSocket connections for live simulation convergence tracking and MCMC trace visualization during execution.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Cpu size={18} /></div>
            <h4>GPU Acceleration</h4>
            <p>Native GPU support for large-scale matrix operations and Monte Carlo vectorization via PyTorch CUDA kernels.</p>
          </div>
        </div>
        <p className="about-text">
          From simple analytical benchmark limits to wrapping proprietary Black-Box FEM (Finite Element Method) solvers, the architecture handles arbitrary levels of complexity with minimal overhead. The platform is designed to scale horizontally across compute clusters for enterprise deployments, while remaining lightweight enough for single-machine research use.
        </p>
      </section>
    </div>
  );
};

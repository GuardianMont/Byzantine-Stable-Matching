# Byzantine Stable Matching — Interactive Companion

This repository accompanies the manuscript *Stable Matching: from Classical to Byzantine Stable Matching*.

It provides interactive and executable visualizations of the main constructions discussed in the manuscript, from the classical Gale–Shapley algorithm to Byzantine failure scenarios, indistinguishability-based impossibility arguments, and the authenticated Pi_bSM constructive protocol.

----

The repository provides small, guided visual examples for the main constructions discussed in the manuscript: classical Gale–Shapley execution, Byzantine equivocation and non-competition, an indistinguishability lower-bound argument, and the constructive authenticated bipartite protocol $\Pi_{\mathrm{bSM}}$.


The goal is not to replace the mathematical development in the manuscript. The website is meant to make selected arguments easier to inspect, replay, and compare step by step.

## Interactive examples

| Example | Topic | What it shows |
| --- | --- | --- |
| **8.1** | Gale–Shapley Execution | Configurable deferred acceptance with editable preference lists and round-by-round execution. |
| **8.2** | Byzantine Behaviour & Non-Competition | A fixed counterexample in which equivocation preserves termination, symmetry, and stability but violates non-competition. |
| **8.3** | Indistinguishability Scenario | The duplicated proof gadget and the separate executions used in the $k/3$ impossibility argument. |
| **8.4** | $\Pi_{\mathrm{bSM}}$ Execution Trace | The authenticated bipartite construction: forwarding, BB/BA in parallel, reconstructed values, the $\bot$ check, local Gale–Shapley, and final matching suggestions. |

Examples 8.2–8.4 are intentionally **guided fixed scenarios**. They are designed to reproduce one argument clearly rather than act as general adversarial simulators. Example 8.1 is configurable.

## Quick start

There are no npm packages, build tools, or external JavaScript dependencies to install. A modern browser and a small local HTTP server are enough.

```bash
cd site
python -m http.server 8000
```

On Windows, if `python` is not available as a command:

```bash
cd site
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not open `index.html` directly with a `file://` URL. The application uses native ES modules, which are best served over HTTP.

For a detailed walkthrough of every example, see **[docs/USAGE.md](docs/USAGE.md)**.

## Repository structure

```text
.
├── README.md
├── docs/
│   └── USAGE.md
└── site/
    ├── index.html
    ├── css/
    │   ├── base.css
    │   ├── components.css
    │   ├── responsive.css
    │   └── examples/
    │       ├── noncompetition.css
    │       ├── indistinguishability.css
    │       └── pibsm.css
    └── js/
        ├── app.js
        ├── core/
        │   ├── gale-shapley.js
        │   ├── noncompetition.js
        │   ├── indistinguishability.js
        │   └── pibsm.js
        └── examples/
            ├── gale-shapley-ui.js
            ├── noncompetition-ui.js
            ├── indistinguishability-ui.js
            └── pibsm-ui.js
```

The JavaScript is deliberately split into two layers:

- `js/core/` contains scenario data and algorithm/property logic that is independent of the browser UI.
- `js/examples/` contains rendering, controls, SVG drawing, and DOM interaction for each guided example.

Shared layout and visual components live in `css/base.css` and `css/components.css`; example-specific styling is kept under `css/examples/`.

## How to use the site

Use the **Manuscript Examples** section in the left sidebar to move between the four examples. Guided examples provide:

- **Start** — enter the first meaningful stage;
- **Back** — revisit the previous stage;
- **Next** — advance the argument or protocol trace;
- **Reset** — return to the initial state.

Example 8.1 additionally supports changing the number of parties per side, rearranging preference lists, and randomizing the profile.

The visual language is consistent across the site:

- **orange** — parties in $L$;
- **purple** — parties in $R$;
- **red status/ring** — Byzantine behaviour or Byzantine party status;
- **green edge/result** — accepted/forced/final matching information;
- **dashed neutral edge** — proposals, proof relations, or auxiliary communication depending on the example.

## Example 8.4 and the source protocol

The $\Pi_{\mathrm{bSM}}$ example follows the constructive protocol for the non-trivial authenticated bipartite case, shown without loss of generality for $t_L < k/3$. Its guided flow is:

```text
Authenticated bipartite network
            ↓
Authenticated forwarding: L → R → L
            ↓
       run in parallel
      ┌────────┴────────┐
L preferences → BB   R preferences → BA
      └────────┬────────┘
               ↓
     reconstructed σ-values
               ↓
          any σᵥ = ⊥ ?
           /         \
        yes           no
         ↓             ↓
      nobody          AG-S
                       ↓
                       M
                       ↓
          L sends suggestions to R
                       ↓
          R chooses most common value
                       ↓
                 bSM decisions
```

The `YES` branch of the $\bot$ test is shown as part of the protocol specification; the fixed execution used by the example follows the `NO` branch.

## Academic basis

The theoretical constructions reproduced here are based on:

> Andrei Constantinescu, Marc Dufay, Diana Ghinea, and Roger Wattenhofer, **“Byzantine Stable Matching”**, 2025, arXiv:2502.05889v2.

Source: <https://arxiv.org/abs/2502.05889>

The companion should be read together with the manuscript, which provides the definitions, proofs, solvability conditions, and full mathematical context that the visual examples intentionally compress.

## Development notes

The project currently uses plain HTML, CSS, SVG, and native JavaScript modules. This is intentional: the examples can be inspected and modified without a framework or build pipeline.

When extending the repository, keep the existing separation:

1. put mathematical/scenario logic in `site/js/core/`;
2. put DOM/SVG rendering in `site/js/examples/`;
3. add example-specific styles only when shared components are insufficient;
4. keep manuscript examples reproducible and deterministic unless configurability is part of the example's purpose.

A more general solvability explorer or configurable Byzantine playground can be added separately without changing the four guided manuscript examples.

## Planned Extensions

The current release focuses on guided and reproducible examples
corresponding directly to the manuscript.

Future extensions may include:

- **Solvability Explorer** — configure topology, authentication,
  \(k\), \(t_L\), and \(t_R\), and inspect whether the corresponding
  bSM setting is solvable.

- **Byzantine Matching Playground** — construct custom preference
  profiles, select Byzantine parties and adversarial behaviours,
  and inspect the resulting execution and bSM properties.

These tools are intended as exploratory additions and are kept
separate from the fixed manuscript examples.
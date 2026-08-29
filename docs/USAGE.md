# Usage Guide

This guide explains how to run and read the **Byzantine Stable Matching — Interactive Companion**.

The website contains four manuscript-linked examples. The first is configurable; the remaining three are fixed, guided scenarios chosen to make a particular definition, proof idea, or protocol construction explicit.

## 1. Running the website locally

### Requirements

You only need:

- a modern browser;
- Python 3 for the local HTTP server.

No npm installation or build step is required.

From the repository root:

```bash
cd site
python -m http.server 8000
```

Windows users can alternatively run:

```bash
cd site
py -m http.server 8000
```

Open the following address in the browser:

```text
http://localhost:8000
```

Stop the server with `Ctrl + C` in the terminal.

### Why an HTTP server is required

The site loads JavaScript using native ES modules. Opening `site/index.html` directly with a `file://` URL may cause browser module/CORS restrictions. Running the small local server avoids this problem.

---

## 2. Navigation and controls

The sidebar contains **Manuscript Examples** 8.1–8.4. The home page also provides direct links to all four examples.

Guided examples use the same controls:

- **Start**: starts the construction or execution;
- **Back**: returns to the previous stage;
- **Next**: advances one stage;
- **Reset**: returns the example to its initial state.

`Back` and `Next` are disabled automatically when there is no previous or next stage.

The status strip at the bottom of the left column shows the current round, proof stage, or protocol stage.

---

## 3. Example 8.1 — Gale–Shapley Execution

### Purpose

Example 8.1 introduces the classical deferred-acceptance algorithm before Byzantine behaviour is added.

Parties in $L$ are proposers and parties in $R$ are receivers.

### Configuring the instance

Use the `k · parties per side` slider to select between **2 and 5** parties per side.

The preference panel contains one ranking for every party. To edit a ranking, click two entries in the same row; their positions are swapped.

Use **Randomize** to generate a new preference profile.

### Running the algorithm

1. Configure the preferences.
2. Press **Start**.
3. Use **Next Round** to advance the deferred-acceptance execution.
4. Read the graph and trace together: proposals are generated in rounds, receivers keep their preferred current proposal, and rejected proposers continue later.
5. The final state displays the stable matching.
6. Press **Reset** to return to the initial state while preserving the currently selected configuration where applicable.

### What to look for

The example is intended to establish the deterministic matching procedure later reused inside $\Pi_{\mathrm{bSM}}$. Example 8.4 does not re-simulate every Gale–Shapley round; it refers back to this computation after the distributed parties reconstruct a common profile.

---

## 4. Example 8.2 — Byzantine Behaviour & Non-Competition

### Purpose

This fixed counterexample explains why termination, symmetry, and stability alone are not sufficient for Byzantine Stable Matching.

The scenario uses two parties on each side and makes $r_1$ Byzantine. The Byzantine party equivocates by giving incompatible matching confirmations to two honest parties.

### Walkthrough

1. Press **Start** to inspect the initial state.
2. Press **Next** to reveal the Byzantine equivocation.
3. Press **Next** again to see the resulting claims.
4. Read the **Property Check** panel.

The final outcome is designed to show:

```text
✓ Termination
✓ Symmetry
✓ Stability
✕ Non-Competition
```

Two distinct honest parties claim the same Byzantine target. This is precisely the behaviour excluded by the non-competition condition.

Use **Back** to compare the state before and after the equivocation without restarting the example.

### Important interpretation

The red Byzantine marking represents *status*, not membership in a matching side. The underlying side colour remains visible.

---

## 5. Example 8.3 — Indistinguishability Scenario

### Purpose

Example 8.3 is a **proof visualization**, not a round-by-round protocol execution.

It illustrates the duplicated-system technique used in the fully-connected unauthenticated lower-bound proof for the $k/3$ threshold.

### The most important reading rule

**Executions A, B, and C are three different hypothetical executions of the same protocol. They are not consecutive rounds.**

The honest/Byzantine set is therefore allowed to change between A, B, and C. The proof compares what selected honest parties can observe across those different executions.

### Walkthrough

#### Duplicated proof gadget

After starting the example, the construction creates two virtual copies of every original party. Subscripts `1` and `2` identify vertices in this proof gadget; they do not mean “round 1” and “round 2”.

The two relevant mutual-favorite relations are:

```text
c₁ ↔ v₁
a₂ ↔ v₂
```

#### Execution A

The visualizer focuses only on the honest parties relevant to this execution. The remaining virtual behaviour is simulated by the specified Byzantine parties.

Simplified stability forces:

```text
a₂ → v₂
```

#### Execution B

A different valid execution is considered. Simplified stability now forces:

```text
c₁ → v₁
```

#### Execution C

The final execution is constructed so that:

```text
a₂'s local view in C = its local view in A
c₁'s local view in C = its local view in B
```

The two virtual copies `v₁` and `v₂` now correspond to the same real Byzantine party `v`. Hence the inherited decisions imply:

```text
a₂ → v ← c₁
```

with both `a₂` and `c₁` honest. The result violates non-competition.

### Why Back is useful here

Use **Back** repeatedly between A, B, and C. The purpose of the example is comparison, not temporal progression; moving backward makes the indistinguishability relation easier to inspect.

---

## 6. Example 8.4 — ΠbSM Execution Trace

### Purpose

Example 8.4 connects the distributed primitives developed earlier into the constructive protocol for the authenticated bipartite setting.

The fixed scenario uses:

```text
Topology: authenticated bipartite
k = 3
tL = 0
tR = 1
Byzantine party: r₃
```

This keeps the trace small while remaining within the $t_L < k/3$ protocol branch.

### Protocol flow

The protocol map on the left mirrors the execution:

```text
1. Authenticated Forwarding
2. BB + BA in Parallel
3. Reconstructed σ-Values
4. Completeness Check
5. Local Gale–Shapley
6. Assignment Dissemination
7. Most Common Suggestion
8. Final bSM Outcome
```

### Step 1 — Authenticated forwarding

Parties in $L$ cannot communicate directly in a bipartite network. A party in $L$ therefore signs a message, sends it through $R$, and honest relays forward it to the intended $L$-recipient.

The key distinction is:

- signatures protect **origin and integrity**;
- a Byzantine relay may still **omit** a message;
- if $R$ contains at least one honest relay, the simulated communication inside $L$ is reliable.

### Step 2 — BB and BA in parallel

The visualizer intentionally shows two branches:

```text
L preferences → ΠBB → σ_l
R preferences → ΠBA → σ_r
```

They are shown side by side because the protocol executes these reconstruction mechanisms in parallel.

For $L$-senders, Byzantine Broadcast gives consistent dissemination and preserves an honest sender's real input.

For each $R$-party, the $L$-parties use Byzantine Agreement on the value they received, or on a default preference list if no value arrived. BA coordinates a common value; it does **not** certify that a Byzantine party's reported preferences are truthful.

### Step 3 — Reconstructed σ-values

The BB and BA outputs are combined into:

```text
(σ_v) for v ∈ L ∪ R
```

In the normal branch shown by the fixed example, the honest parties in $L$ obtain the common reconstructed profile needed for the local computation.

### Step 4 — Check for ⊥

Before running Gale–Shapley, each honest $L$-party checks whether any reconstructed value equals $\bot$:

```text
any σᵥ = ⊥ ?
```

- **YES** → output nobody and terminate;
- **NO** → continue to Gale–Shapley.

The fixed example follows the **NO** branch. The `YES` branch is retained in the visualization because it is part of the actual protocol and becomes important when the entire relay side may be Byzantine.

### Step 5 — Local Gale–Shapley

All honest parties in $L$ that possess a complete common profile execute the same deterministic Gale–Shapley algorithm and therefore compute the same matching $M$.

The example reuses the matching profile introduced in Example 8.1 so that the distributed part of the construction remains the focus.

### Step 6 — Assignment dissemination

Every $L$-party sends each $R$-party the partner that $M$ assigns to that $R$-party. Each $L$-party also decides its own assignment according to $M$.

### Step 7 — Most common suggestion

An honest party in $R$ collects the suggestions received from $L$ and selects the most common one.

The general correctness argument relies on the fault bound: the common suggestion sent by the honest $L$-parties outnumbers contradictory suggestions that Byzantine $L$-parties could send.

In the displayed `k = 3, tL = 0` scenario, all three $L$-suggestions agree; the visualizer also explains why the majority mechanism is needed in the general protocol.

### Step 8 — Final outcome

The final panel checks the four Byzantine Stable Matching properties:

```text
✓ Termination
✓ Symmetry
✓ Stability
✓ Non-Competition
```

---

## 7. Visual conventions

The examples share a common visual vocabulary:

| Visual | Meaning |
| --- | --- |
| Orange node | Party in $L$ |
| Purple node | Party in $R$ |
| Red ring/status | Byzantine party or Byzantine behaviour |
| Green line/result | Accepted, forced, or final matching relation |
| Dashed neutral line | Auxiliary/proposal/proof relation; read the current example's legend |
| $\bot$ | No usable reconstructed value / nobody branch, depending on the stage |

Because 8.3 is a proof visualization and 8.4 is a protocol trace, always read the title and explanatory panel together with the graph; an edge can represent different auxiliary concepts in different examples.

---

## 8. Troubleshooting

### `navigate is not defined` or the page controls do nothing

The application entry point is `site/js/app.js`, which imports the individual example modules and exposes the functions used by the HTML controls.

First make sure you started the server **from the `site` directory**:

```bash
cd site
python -m http.server 8000
```

Then open `http://localhost:8000`.

If you start the server from the repository root instead, the site is available under:

```text
http://localhost:8000/site/
```

### `404 (File not found)` in the browser console

Check the exact missing path. The expected JavaScript hierarchy is:

```text
site/js/app.js
site/js/core/*.js
site/js/examples/*.js
```

and the CSS hierarchy is:

```text
site/css/*.css
site/css/examples/*.css
```

A `favicon.ico` 404 is harmless unless a custom favicon has been added. A 404 for `app.js` or one of its imported modules will prevent the interactive controls from initializing.

### Changes are not visible

Use a hard refresh (`Ctrl+F5` / `Cmd+Shift+R`) to bypass the browser cache after modifying CSS or JavaScript.

---

## 9. What this repository is — and is not

The four examples are intended as a reproducible companion to the manuscript.

They are **not yet** a general Byzantine Stable Matching playground. In particular, 8.2–8.4 deliberately use fixed scenarios so that each page has one clear mathematical objective.

A future playground can expose topology, authentication, corruption bounds, Byzantine behaviours, and custom preferences independently, while keeping these four manuscript examples unchanged.

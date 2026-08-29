import {
  PIBSM_STEPS,
  createPiBsmScenario,
  evaluatePiBsmProperties,
  getPiBsmStageCount,
  getPiBsmStep,
  majoritySuggestion,
  matchingAsMap,
} from "../core/pibsm.js";

let scenario = null;
let stage = 0;

/* ================================================================
   INITIALIZATION / CONTROLS
   ================================================================ */

export function pbInit() {
  scenario = createPiBsmScenario();
  stage = 0;
  render();
  updateControls();
}

export function pbStart() {
  stage = 1;
  render();
  updateControls();
}

export function pbBack() {
  if (stage <= 0) return;
  stage -= 1;
  render();
  updateControls();
}

export function pbStep() {
  const maxStage = getPiBsmStageCount();
  if (stage >= maxStage) return;
  stage += 1;
  render();
  updateControls();
}

export function pbReset() {
  pbInit();
}

function render() {
  renderGraph();
  renderExplanation();
  renderPhaseList();
  updateStatus();
}

/* ================================================================
   GRAPH ROUTER
   ================================================================ */

function renderGraph() {
  const svg = document.getElementById("pb-svg");
  if (!svg) return;

  svg.innerHTML = "";
  svg.setAttribute("viewBox", "0 0 760 600");

  const renderers = {
    0: renderInitialState,
    1: renderForwarding,
    2: renderParallelReconstruction,
    3: renderReconstructedProfile,
    4: renderBottomCheck,
    5: renderLocalGaleShapley,
    6: renderAssignmentDissemination,
    7: renderMostCommonSuggestion,
    8: renderFinalOutcome,
  };

  (renderers[stage] ?? renderInitialState)(svg);
}

/* ================================================================
   STAGE 0 — INITIAL STATE
   ================================================================ */

function renderInitialState(svg) {
  const colors = getColors();
  const positions = getPartyPositions();

  drawSceneTitle(
    svg,
    "AUTHENTICATED BIPARTITE NETWORK",
    "fixed guided execution of Π_bSM"
  );

  drawSideLabels(svg, colors, 112);

  for (const l of scenario.parties.L) {
    for (const r of scenario.parties.R) {
      drawEdge(svg, positions[l], positions[r], {
        color: colors.proposal,
        width: 1.5,
        opacity: 0.18,
      });
    }
  }

  drawAllParties(svg, positions, { byzantine: true });

  drawRoundedLabel(
    svg,
    380,
    510,
    "k = 3 · tL = 0 · tR = 1 · authenticated · bipartite",
    colors.brandPurple,
    { width: 480, height: 36, fontSize: 12, opaque: true }
  );

  drawText(
    svg,
    380,
    552,
    "r₃ is Byzantine. L has no direct internal communication links.",
    { fill: colors.muted, size: 11.5, weight: 650 }
  );
}

/* ================================================================
   STAGE 1 — AUTHENTICATED FORWARDING
   ================================================================ */

function renderForwarding(svg) {
  const colors = getColors();

  drawSceneTitle(
    svg,
    "1 · AUTHENTICATED FORWARDING",
    "L → R → L simulates the missing communication inside L"
  );

  const positions = {
    l1: { x: 155, y: 205 },
    l2: { x: 155, y: 405 },
    r1: { x: 605, y: 165 },
    r2: { x: 605, y: 285 },
    r3: { x: 605, y: 405 },
  };

  drawText(svg, 155, 112, "L", {
    fill: colors.partyL,
    size: 15,
    weight: 900,
  });

  drawText(svg, 605, 112, "R · RELAYS", {
    fill: colors.partyR,
    size: 15,
    weight: 900,
  });

  for (const relay of scenario.forwardingExample.relays) {
    drawEdge(svg, positions.l1, positions[relay], {
      color: colors.brandOrange,
      width: 2.4,
      dashed: true,
      opacity: 0.78,
    });
  }

  for (const relay of scenario.forwardingExample.honestRelays) {
    drawEdge(svg, positions[relay], positions.l2, {
      color: colors.matching,
      width: 4,
      opacity: 0.94,
    });
  }

  drawEdge(svg, positions.r3, positions.l2, {
    color: colors.byzantine,
    width: 2.5,
    dashed: true,
    opacity: 0.34,
  });

  drawParty(svg, "l1", positions.l1, colors.partyL, { radius: 32 });
  drawParty(svg, "l2", positions.l2, colors.partyL, { radius: 32 });
  drawParty(svg, "r1", positions.r1, colors.partyR, { radius: 29 });
  drawParty(svg, "r2", positions.r2, colors.partyR, { radius: 29 });
  drawByzantineParty(svg, "r3", positions.r3, colors.partyR, colors.byzantine);

  drawRoundedLabel(
    svg,
    372,
    140,
    "l₁ signs m and sends it to every relay in R",
    colors.brandOrange,
    { width: 330, height: 32, fontSize: 11.2, opaque: true }
  );

  drawRoundedLabel(
    svg,
    365,
    480,
    "l₂ accepts the message only with a valid l₁ signature",
    colors.matching,
    { width: 370, height: 32, fontSize: 11.2, opaque: true }
  );

  drawText(
    svg,
    380,
    542,
    "Honest r₁ or r₂ is enough for delivery; Byzantine r₃ may omit, but cannot forge l₁.",
    { fill: colors.muted, size: 11.2, weight: 650 }
  );
}

/* ================================================================
   STAGE 2 — BB + BA IN PARALLEL
   ================================================================ */

function renderParallelReconstruction(svg) {
  const colors = getColors();

  drawSceneTitle(
    svg,
    "2 · PREFERENCE RECONSTRUCTION",
    "the protocol executes the BB and BA reconstruction mechanisms in parallel"
  );

  drawRoundedLabel(
    svg,
    380,
    105,
    "IN PARALLEL",
    colors.brandPurple,
    { width: 170, height: 32, fontSize: 12.5, opaque: true }
  );

  // Left branch: L preferences -> BB -> sigma_l
  drawBranchHeader(svg, 215, 150, "L PREFERENCES", colors.partyL);
  drawMultiLineCard(
    svg,
    215,
    215,
    ["πl₁", "πl₂", "πl₃"],
    colors.partyL,
    { width: 150, height: 92 }
  );
  drawArrow(svg, { x: 215, y: 264 }, { x: 215, y: 316 }, colors.proposal, 2.4);
  drawRoundedLabel(
    svg,
    215,
    350,
    "ΠBB",
    colors.brandOrange,
    { width: 130, height: 54, fontSize: 15, opaque: true }
  );
  drawArrow(svg, { x: 215, y: 380 }, { x: 215, y: 428 }, colors.matching, 3);
  drawRoundedLabel(
    svg,
    215,
    458,
    "σl₁ · σl₂ · σl₃",
    colors.matching,
    { width: 190, height: 40, fontSize: 11.5, opaque: true }
  );

  // Right branch: R preferences -> BA -> sigma_r
  drawBranchHeader(svg, 545, 150, "R PREFERENCES", colors.partyR);
  drawMultiLineCard(
    svg,
    545,
    215,
    ["πr₁", "πr₂", "πr₃ / default"],
    colors.partyR,
    { width: 175, height: 92 }
  );
  drawArrow(svg, { x: 545, y: 264 }, { x: 545, y: 316 }, colors.proposal, 2.4);
  drawRoundedLabel(
    svg,
    545,
    350,
    "ΠBA per rⱼ",
    colors.brandPurple,
    { width: 150, height: 54, fontSize: 13, opaque: true }
  );
  drawArrow(svg, { x: 545, y: 380 }, { x: 545, y: 428 }, colors.matching, 3);
  drawRoundedLabel(
    svg,
    545,
    458,
    "σr₁ · σr₂ · σr₃",
    colors.matching,
    { width: 190, height: 40, fontSize: 11.5, opaque: true }
  );

  // Convergence into the reconstructed profile.
  drawEdge(svg, { x: 215, y: 480 }, { x: 335, y: 525 }, {
    color: colors.matching,
    width: 2.8,
  });
  drawEdge(svg, { x: 545, y: 480 }, { x: 425, y: 525 }, {
    color: colors.matching,
    width: 2.8,
  });
  drawRoundedLabel(
    svg,
    380,
    548,
    "reconstructed (σᵥ)ᵥ∈L∪R",
    colors.matching,
    { width: 300, height: 38, fontSize: 11.5, opaque: true }
  );
}

/* ================================================================
   STAGE 3 — RECONSTRUCTED PROFILE
   ================================================================ */

function renderReconstructedProfile(svg) {
  const colors = getColors();

  drawSceneTitle(
    svg,
    "3 · RECONSTRUCTED σ-VALUES",
    "BB and BA converge into the profile used by the honest L-parties"
  );

  const xs = [155, 380, 605];

  scenario.parties.L.forEach((party, index) => {
    drawParty(svg, party, { x: xs[index], y: 145 }, colors.partyL, { radius: 30 });
  });

  drawText(svg, 380, 205, "ALL HONEST L-PARTIES USE THE SAME RECONSTRUCTED VALUES", {
    fill: colors.brandPurple,
    size: 11.5,
    weight: 850,
  });

  drawMultiLineCard(
    svg,
    380,
    335,
    [
      "σl₁ = r₁ > r₂ > r₃",
      "σl₂ = r₁ > r₂ > r₃",
      "σl₃ = r₂ > r₁ > r₃",
      "σr₁ = l₂ > l₁ > l₃",
      "σr₂ = l₁ > l₃ > l₂",
      "σr₃ = agreed BA value",
    ],
    colors.brandPurple,
    { width: 430, height: 235 }
  );

  drawRoundedLabel(
    svg,
    380,
    500,
    "σr₃ is agreed — not certified truthful",
    colors.byzantine,
    { width: 330, height: 34, fontSize: 11.3, opaque: true }
  );

  drawText(
    svg,
    380,
    552,
    "The next protocol step checks whether any reconstructed value is ⊥.",
    { fill: colors.muted, size: 11.5, weight: 650 }
  );
}

/* ================================================================
   STAGE 4 — BOTTOM CHECK
   ================================================================ */

function renderBottomCheck(svg) {
  const colors = getColors();

  drawSceneTitle(
    svg,
    "4 · COMPLETENESS CHECK",
    "Gale–Shapley is run only when the reconstructed profile is complete"
  );

  drawDecisionDiamond(
    svg,
    380,
    215,
    "any σᵥ = ⊥ ?",
    colors.brandPurple
  );

  // YES branch
  drawEdge(svg, { x: 315, y: 260 }, { x: 210, y: 365 }, {
    color: colors.proposal,
    width: 2.6,
    dashed: true,
    opacity: 0.68,
  });
  drawRoundedLabel(svg, 270, 305, "YES", colors.proposal, {
    width: 70,
    height: 28,
    fontSize: 11,
    opaque: true,
  });
  drawMultiLineCard(
    svg,
    190,
    415,
    ["output nobody", "and terminate"],
    colors.proposal,
    { width: 190, height: 92 }
  );

  // NO branch — selected in this fixed trace.
  drawEdge(svg, { x: 445, y: 260 }, { x: 550, y: 365 }, {
    color: colors.matching,
    width: 4,
    opacity: 0.95,
  });
  drawRoundedLabel(svg, 490, 305, "NO ✓", colors.matching, {
    width: 80,
    height: 28,
    fontSize: 11,
    opaque: true,
  });
  drawMultiLineCard(
    svg,
    570,
    415,
    ["complete profile", "continue to AG-S"],
    colors.matching,
    { width: 205, height: 92 }
  );

  drawRoundedLabel(
    svg,
    380,
    535,
    "Fixed trace: R contains honest relays, so no σᵥ is ⊥",
    colors.matching,
    { width: 430, height: 36, fontSize: 11.5, opaque: true }
  );
}

/* ================================================================
   STAGE 5 — LOCAL GALE–SHAPLEY
   ================================================================ */

function renderLocalGaleShapley(svg) {
  const colors = getColors();
  const matching = formatMatching(scenario.matching);
  const xs = [155, 380, 605];

  drawSceneTitle(
    svg,
    "5 · LOCAL GALE–SHAPLEY",
    "only L runs the deterministic stable-matching algorithm"
  );

  scenario.parties.L.forEach((party, index) => {
    const x = xs[index];

    drawParty(svg, party, { x, y: 135 }, colors.partyL, { radius: 29 });
    drawArrow(svg, { x, y: 170 }, { x, y: 225 }, colors.proposal, 2.4);
    drawRoundedLabel(
      svg,
      x,
      260,
      "same (σᵥ)",
      colors.brandPurple,
      { width: 130, height: 42, fontSize: 11, opaque: true }
    );
    drawArrow(svg, { x, y: 285 }, { x, y: 335 }, colors.proposal, 2.4);
    drawRoundedLabel(
      svg,
      x,
      370,
      "AG-S",
      colors.brandOrange,
      { width: 120, height: 50, fontSize: 14, opaque: true }
    );
  });

  drawEdge(svg, { x: 155, y: 400 }, { x: 330, y: 465 }, {
    color: colors.matching,
    width: 3,
  });
  drawEdge(svg, { x: 380, y: 400 }, { x: 380, y: 455 }, {
    color: colors.matching,
    width: 3,
  });
  drawEdge(svg, { x: 605, y: 400 }, { x: 430, y: 465 }, {
    color: colors.matching,
    width: 3,
  });

  drawRoundedLabel(
    svg,
    380,
    495,
    `same M = ${matching}`,
    colors.matching,
    { width: 520, height: 48, fontSize: 12.2, opaque: true }
  );

  drawText(
    svg,
    380,
    552,
    "Same reconstructed input + deterministic AG-S ⇒ every honest L computes the same M.",
    { fill: colors.muted, size: 11.2, weight: 650 }
  );
}

/* ================================================================
   STAGE 6 — ASSIGNMENT DISSEMINATION
   ================================================================ */

function renderAssignmentDissemination(svg) {
  const colors = getColors();
  const match = matchingAsMap(scenario);

  drawSceneTitle(
    svg,
    "6 · ASSIGNMENT DISSEMINATION",
    "each L-party tells every R-party which partner M assigns to it"
  );

  const lXs = [150, 380, 610];
  const rXs = [150, 380, 610];

  scenario.parties.L.forEach((party, index) => {
    drawParty(svg, party, { x: lXs[index], y: 135 }, colors.partyL, { radius: 28 });
  });

  drawRoundedLabel(
    svg,
    380,
    220,
    `all honest L computed the same M = ${formatMatching(scenario.matching)}`,
    colors.matching,
    { width: 560, height: 40, fontSize: 11.2, opaque: true }
  );

  scenario.parties.R.forEach((r, index) => {
    const x = rXs[index];
    const assigned = match[r];

    drawArrow(svg, { x, y: 245 }, { x, y: 325 }, colors.proposal, 2.5);
    drawRoundedLabel(
      svg,
      x,
      355,
      `${prettyParty(r)} ← suggest ${prettyParty(assigned)}`,
      scenario.byzantine.has(r) ? colors.proposal : colors.matching,
      { width: 185, height: 38, fontSize: 10.8, opaque: true }
    );
  });

  drawRoundedLabel(
    svg,
    380,
    455,
    "Conceptually, every L sends this assignment information to every R",
    colors.brandPurple,
    { width: 500, height: 36, fontSize: 11, opaque: true }
  );

  drawText(
    svg,
    380,
    520,
    "R does not run Gale–Shapley. Its final decision is based on the suggestions received from L.",
    { fill: colors.muted, size: 11.3, weight: 650 }
  );
}

/* ================================================================
   STAGE 7 — MOST COMMON SUGGESTION
   ================================================================ */

function renderMostCommonSuggestion(svg) {
  const colors = getColors();
  const r = "r1";
  const suggestions = scenario.suggestions[r];
  const decision = majoritySuggestion(suggestions);

  drawSceneTitle(
    svg,
    "7 · MOST COMMON SUGGESTION",
    "an honest R-party decides using the most frequent assignment received from L"
  );

  drawText(svg, 380, 115, "FOCUS ON HONEST r₁", {
    fill: colors.partyR,
    size: 12.5,
    weight: 900,
  });

  const rows = Object.entries(suggestions);
  rows.forEach(([sender, value], index) => {
    const y = 185 + index * 72;

    drawRoundedLabel(
      svg,
      210,
      y,
      `${prettyParty(sender)} says`,
      colors.partyL,
      { width: 135, height: 34, fontSize: 11, opaque: true }
    );
    drawArrow(svg, { x: 282, y }, { x: 355, y }, colors.proposal, 2.2);
    drawRoundedLabel(
      svg,
      455,
      y,
      `${prettyParty(r)} → ${prettyParty(value)}`,
      colors.matching,
      { width: 165, height: 36, fontSize: 11.5, opaque: true }
    );
  });

  drawArrow(svg, { x: 455, y: 342 }, { x: 455, y: 400 }, colors.matching, 3.4);
  drawRoundedLabel(
    svg,
    455,
    435,
    `most common = ${prettyParty(decision)}`,
    colors.matching,
    { width: 220, height: 44, fontSize: 12.5, opaque: true }
  );

  drawRoundedLabel(
    svg,
    380,
    520,
    "General guarantee: k − tL > tL, so honest L suggestions dominate Byzantine ones",
    colors.brandPurple,
    { width: 590, height: 38, fontSize: 10.9, opaque: true }
  );
}

/* ================================================================
   STAGE 8 — FINAL OUTCOME
   ================================================================ */

function renderFinalOutcome(svg) {
  const colors = getColors();
  const positions = getPartyPositions();

  drawSceneTitle(
    svg,
    "8 · FINAL bSM OUTCOME",
    "honest parties decide consistently with the same matching M"
  );

  for (const { proposer, receiver } of scenario.matching) {
    drawEdge(svg, positions[proposer], positions[receiver], {
      color: colors.matching,
      width: 5,
      opacity: 0.92,
    });
  }

  drawAllParties(svg, positions, { byzantine: true });

  drawRoundedLabel(
    svg,
    380,
    500,
    `M = ${formatMatching(scenario.matching)}`,
    colors.matching,
    { width: 500, height: 42, fontSize: 12.2, opaque: true }
  );

  drawText(
    svg,
    380,
    550,
    "The output of Byzantine r₃ is unconstrained; the guarantees concern the honest parties.",
    { fill: colors.muted, size: 11.2, weight: 650 }
  );
}

/* ================================================================
   EXPLANATION PANEL
   ================================================================ */

function renderExplanation() {
  const root = document.getElementById("pb-explanation");
  if (!root) return;

  const explainers = {
    0: explanationInitial,
    1: explanationForwarding,
    2: explanationParallelReconstruction,
    3: explanationReconstructedProfile,
    4: explanationBottomCheck,
    5: explanationGaleShapley,
    6: explanationSuggestions,
    7: explanationMostCommon,
    8: explanationFinal,
  };

  root.innerHTML = (explainers[stage] ?? explanationInitial)();
}

function explanationInitial() {
  return `
    <div class="pb-message">
      <strong>What does this trace show?</strong>
      This guided example follows the non-trivial authenticated bipartite
      construction for <span class="pb-inline-math">Π<sub>bSM</sub></span>,
      assuming <span class="pb-inline-math">t<sub>L</sub> &lt; k/3</span>.
      We instantiate it with <span class="pb-inline-math">k = 3</span>,
      <span class="pb-inline-math">t<sub>L</sub> = 0</span> and
      <span class="pb-inline-math">t<sub>R</sub> = 1</span>.

      <div class="pb-note">
        The example is intentionally fixed. Its purpose is to expose the
        protocol pipeline: forwarding → parallel BB/BA reconstruction →
        completeness check → AG-S → assignment suggestions → R decision.
      </div>
    </div>
  `;
}

function explanationForwarding() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">1 · AUTHENTICATED FORWARDING</div>
      <p>
        Parties in L have no direct L–L links. When <strong>l₁</strong> needs
        to send a message to <strong>l₂</strong>, it signs the message and
        sends it to every party in R. Honest relays forward it to l₂.
      </p>

      <div class="pb-chain">
        <span>l₁ signs m</span><b>→</b><span>R relays</span><b>→</b><span>l₂ verifies l₁</span>
      </div>

      <div class="pb-note success">
        Authentication guarantees origin and integrity, not delivery.
        Because this trace contains honest relays in R, communication inside
        L is reliable with simulated delay at most 2Δ. Byzantine r₃ may omit
        its copy but cannot forge l₁'s signature.
      </div>
    </div>
  `;
}

function explanationParallelReconstruction() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">2 · BB + BA RUN IN PARALLEL</div>

      <p>
        The two preference-reconstruction mechanisms are shown side by side
        because the actual protocol executes them <strong>in parallel</strong>.
      </p>

      <div class="pb-two-col">
        <div class="pb-mini-card">
          <strong>L preferences → ΠBB</strong>
          <p>
            Each lᵢ broadcasts its preference list. BB preserves an honest
            sender's input and gives the honest L-parties a consistent σlᵢ.
          </p>
        </div>

        <div class="pb-mini-card">
          <strong>R preferences → ΠBA</strong>
          <p>
            Each rⱼ first sends its list to L. For that rⱼ, the L-parties run
            BA using the received list, or a default list if none arrived.
          </p>
        </div>
      </div>

      <div class="pb-note danger">
        r₃ is Byzantine. BA does not certify that σr₃ is truthful; it ensures
        that the honest L-parties use the same agreed value for this invocation.
      </div>
    </div>
  `;
}

function explanationReconstructedProfile() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">3 · RECONSTRUCTED σ-VALUES</div>
      <p>
        The BB outputs for L and the BA outputs for R form the vector
        <span class="pb-inline-math">(σ<sub>v</sub>)<sub>v∈L∪R</sub></span>.
        In this fixed execution every honest L-party obtains the same complete
        profile.
      </p>

      ${profileTableHtml()}

      <div class="pb-note">
        The value associated with Byzantine r₃ is only an agreed value. The
        protocol requires consistency among the honest L-parties, not truthful
        behaviour from a Byzantine party.
      </div>
    </div>
  `;
}

function explanationBottomCheck() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">4 · CHECK FOR ⊥</div>
      <p>
        At the protocol deadline, every honest L-party checks the reconstructed
        values. If <strong>any</strong> σv equals ⊥, that party outputs nobody
        and terminates. Otherwise it continues to Gale–Shapley.
      </p>

      <div class="pb-decision-grid">
        <div class="pb-decision-option muted">
          <strong>YES · some σv = ⊥</strong>
          <span>output nobody</span>
        </div>
        <div class="pb-decision-option selected">
          <strong>NO · fixed trace</strong>
          <span>continue to AG-S</span>
        </div>
      </div>

      <div class="pb-note success">
        Here R contains honest relays, so the simulated L-network has no
        omissions. The ⊥ branch is still shown because it becomes essential
        in the special case where the entire relay side R is Byzantine.
      </div>
    </div>
  `;
}

function explanationGaleShapley() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">5 · LOCAL GALE–SHAPLEY</div>
      <p>
        Only the parties in L run AG-S. They use the same reconstructed
        profile, and AG-S is deterministic, therefore all honest L-parties
        obtain the same matching.
      </p>

      <div class="pb-matching-box">
        M = ${formatMatching(scenario.matching)}
      </div>

      <div class="pb-note">
        The fixed profile intentionally reuses Example 8.1. The classical
        round-by-round Gale–Shapley computation is therefore not repeated here.
      </div>
    </div>
  `;
}

function explanationSuggestions() {
  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">6 · ASSIGNMENT DISSEMINATION</div>
      <p>
        Once M is computed, each L-party sends every rⱼ the identity of the
        partner assigned to rⱼ by M. Each L-party also decides locally on its
        own partner according to M.
      </p>

      <div class="pb-suggestion-grid">
        ${suggestionSummaryHtml("r1")}
        ${suggestionSummaryHtml("r2")}
        ${suggestionSummaryHtml("r3")}
      </div>

      <div class="pb-note">
        Parties in R do not execute Gale–Shapley themselves. Their output is
        derived from the matching suggestions received from L.
      </div>
    </div>
  `;
}

function explanationMostCommon() {
  const received = Object.values(scenario.suggestions.r1)
    .map(prettyParty)
    .join(", ");
  const decision = prettyParty(majoritySuggestion(scenario.suggestions.r1));

  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">7 · MOST COMMON SUGGESTION</div>
      <p>
        An honest R-party outputs the most common suggestion received from L.
        For r₁ in this fixed execution:
      </p>

      <div class="pb-matching-box">
        [${received}] → most common = ${decision}
      </div>

      <div class="pb-note success">
        In this trace tL = 0, so the suggestions are unanimous. In the general
        protocol, tL &lt; k/3 implies k − tL &gt; tL: the honest L-parties all
        send the assignment from the same M, so their suggestion dominates
        suggestions sent by Byzantine L-parties.
      </div>
    </div>
  `;
}

function explanationFinal() {
  const properties = evaluatePiBsmProperties(scenario);

  return `
    <div class="pb-stage-card">
      <div class="pb-stage-title">8 · FINAL bSM OUTCOME</div>
      <p>
        Honest L-parties decide directly according to M, while honest R-parties
        recover the corresponding assignment as their most common suggestion.
        Byzantine r₃ remains unconstrained.
      </p>

      <div class="pb-output-grid">
        ${outputCard("l₁", "r₂", true)}
        ${outputCard("l₂", "r₁", true)}
        ${outputCard("l₃", "r₃", true)}
        ${outputCard("r₁", "l₂", true)}
        ${outputCard("r₂", "l₁", true)}
        ${outputCard("r₃", "unconstrained", false)}
      </div>

      <div class="pb-property-grid">
        ${propertyChip("Termination", properties.termination)}
        ${propertyChip("Symmetry", properties.symmetry)}
        ${propertyChip("Stability", properties.stability)}
        ${propertyChip("Non-Competition", properties.nonCompetition)}
      </div>
    </div>
  `;
}

/* ================================================================
   LEFT PROTOCOL MAP / STATUS
   ================================================================ */

function renderPhaseList() {
  const root = document.getElementById("pb-phase-list");
  if (!root) return;

  root.innerHTML = PIBSM_STEPS
    .map(step => {
      const state = stage === step.number
        ? "active"
        : stage > step.number
          ? "done"
          : "pending";

      const icon = state === "done" ? "✓" : step.number;

      return `
        <div class="pb-phase ${state}">
          <span class="pb-phase-index">${icon}</span>
          <span>${step.label}</span>
        </div>
      `;
    })
    .join("");
}

function updateStatus() {
  const status = document.getElementById("pb-step-n");
  if (!status) return;

  if (stage === 0) {
    status.textContent = "—";
    return;
  }

  const step = getPiBsmStep(stage);
  status.textContent = `${stage} / ${getPiBsmStageCount()} · ${step?.shortLabel ?? ""}`;
}

function updateControls() {
  const start = document.getElementById("pb-start");
  const back = document.getElementById("pb-back");
  const next = document.getElementById("pb-next");
  const maxStage = getPiBsmStageCount();

  if (start) start.disabled = stage > 0;
  if (back) back.disabled = stage === 0;
  if (next) next.disabled = stage === 0 || stage === maxStage;
}

/* ================================================================
   HTML HELPERS
   ================================================================ */

function profileTableHtml() {
  const p = scenario.reconstructedPreferences;
  const rows = [
    ["l₁", p.L.l1],
    ["l₂", p.L.l2],
    ["l₃", p.L.l3],
    ["r₁", p.R.r1],
    ["r₂", p.R.r2],
    ["r₃", p.R.r3],
  ];

  return `
    <div class="pb-profile-grid">
      ${rows.map(([party, list]) => `
        <div class="pb-profile-row ${party === "r₃" ? "byzantine" : ""}">
          <strong>${party}</strong>
          <span>${list.map(prettyParty).join(" > ")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function suggestionSummaryHtml(r) {
  const match = matchingAsMap(scenario);
  const prettyR = prettyParty(r);
  const assigned = prettyParty(match[r]);

  return `
    <div class="pb-mini-card">
      <strong>${prettyR}</strong>
      <p>Each L sends: <span class="pb-inline-math">${prettyR} → ${assigned}</span></p>
    </div>
  `;
}

function outputCard(party, output, honest) {
  return `
    <div class="pb-output-card ${honest ? "honest" : "byzantine"}">
      <strong>${party}</strong>
      <span>${honest ? `out = ${output}` : "Byzantine"}</span>
    </div>
  `;
}

function propertyChip(label, satisfied) {
  return `
    <div class="pb-property ${satisfied ? "pass" : "fail"}">
      <span>${satisfied ? "✓" : "✕"}</span>
      <strong>${label}</strong>
    </div>
  `;
}

/* ================================================================
   SVG HELPERS / COMPONENTS
   ================================================================ */

function getPartyPositions() {
  return {
    l1: { x: 175, y: 180 },
    l2: { x: 175, y: 305 },
    l3: { x: 175, y: 430 },
    r1: { x: 585, y: 180 },
    r2: { x: 585, y: 305 },
    r3: { x: 585, y: 430 },
  };
}

function drawAllParties(svg, positions, { byzantine = false } = {}) {
  const colors = getColors();

  for (const l of scenario.parties.L) {
    drawParty(svg, l, positions[l], colors.partyL, { radius: 31 });
  }

  for (const r of scenario.parties.R) {
    if (byzantine && scenario.byzantine.has(r)) {
      drawByzantineParty(svg, r, positions[r], colors.partyR, colors.byzantine);
    } else {
      drawParty(svg, r, positions[r], colors.partyR, { radius: 31 });
    }
  }
}

function drawBranchHeader(svg, x, y, text, color) {
  drawText(svg, x, y, text, {
    fill: color,
    size: 12,
    weight: 900,
  });
}

function drawDecisionDiamond(svg, x, y, text, color) {
  const colors = getColors();
  const width = 260;
  const height = 112;
  const points = [
    `${x},${y - height / 2}`,
    `${x + width / 2},${y}`,
    `${x},${y + height / 2}`,
    `${x - width / 2},${y}`,
  ].join(" ");

  svg.appendChild(
    svgElement("polygon", {
      points,
      fill: colors.surface,
      stroke: color,
      "stroke-width": 1.8,
      "stroke-opacity": 0.55,
    })
  );

  drawText(svg, x, y + 5, text, {
    fill: color,
    size: 13,
    weight: 900,
  });
}

function drawSuggestionBadge(svg, x, y, text, color) {
  drawRoundedLabel(svg, x, y, text, color, {
    width: 150,
    height: 28,
    fontSize: 10.5,
    opaque: true,
  });
}

function drawSceneTitle(svg, title, subtitle) {
  const colors = getColors();

  drawText(svg, 380, 32, title, {
    fill: colors.brandPurple,
    size: 15,
    weight: 900,
  });

  drawText(svg, 380, 62, subtitle, {
    fill: colors.muted,
    size: 11.5,
    weight: 650,
  });
}

function drawSideLabels(svg, colors, y = 105) {
  drawText(svg, 175, y, "L", {
    fill: colors.partyL,
    size: 15,
    weight: 900,
  });

  drawText(svg, 585, y, "R", {
    fill: colors.partyR,
    size: 15,
    weight: 900,
  });
}

function drawParty(svg, party, position, color, { radius = 28 } = {}) {
  svg.appendChild(
    svgElement("circle", {
      cx: position.x,
      cy: position.y,
      r: radius,
      fill: color,
      stroke: "#FFFFFF",
      "stroke-width": 4,
    })
  );

  drawText(svg, position.x, position.y + 6, prettyParty(party), {
    fill: "#FFFFFF",
    size: radius <= 24 ? 14 : 18,
    weight: 900,
  });
}

function drawByzantineParty(svg, party, position, color, byzantineColor) {
  svg.appendChild(
    svgElement("circle", {
      cx: position.x,
      cy: position.y,
      r: 39,
      fill: "none",
      stroke: byzantineColor,
      "stroke-width": 4,
      "stroke-dasharray": "7 5",
    })
  );

  drawParty(svg, party, position, color, { radius: 31 });

  svg.appendChild(
    svgElement("circle", {
      cx: position.x + 29,
      cy: position.y - 29,
      r: 13,
      fill: byzantineColor,
      stroke: "#FFFFFF",
      "stroke-width": 2,
    })
  );

  drawText(svg, position.x + 29, position.y - 25, "B", {
    fill: "#FFFFFF",
    size: 11,
    weight: 900,
  });
}

function drawArrow(svg, from, to, color, width = 3) {
  drawEdge(svg, from, to, { color, width });

  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 8;
  const p1 = {
    x: to.x - size * Math.cos(angle - Math.PI / 6),
    y: to.y - size * Math.sin(angle - Math.PI / 6),
  };
  const p2 = {
    x: to.x - size * Math.cos(angle + Math.PI / 6),
    y: to.y - size * Math.sin(angle + Math.PI / 6),
  };

  svg.appendChild(
    svgElement("polygon", {
      points: `${to.x},${to.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`,
      fill: color,
    })
  );
}

function drawEdge(
  svg,
  from,
  to,
  {
    color,
    width = 3,
    dashed = false,
    opacity = 1,
  }
) {
  const line = svgElement("line", {
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
    opacity,
  });

  if (dashed) {
    line.setAttribute("stroke-dasharray", "8 6");
  }

  svg.appendChild(line);
}

function drawRoundedLabel(
  svg,
  x,
  y,
  text,
  color,
  {
    width = 180,
    height = 30,
    fontSize = 11,
    opaque = false,
  } = {}
) {
  const colors = getColors();

  svg.appendChild(
    svgElement("rect", {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 8,
      fill: opaque ? colors.surface : color,
      "fill-opacity": opaque ? 0.98 : 0.08,
      stroke: color,
      "stroke-opacity": 0.34,
      "stroke-width": 1.2,
    })
  );

  drawText(svg, x, y + 4, text, {
    fill: color,
    size: fontSize,
    weight: 800,
  });
}

function drawMultiLineCard(
  svg,
  x,
  y,
  lines,
  color,
  { width = 190, height = 100 } = {}
) {
  const colors = getColors();

  svg.appendChild(
    svgElement("rect", {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 10,
      fill: colors.surface,
      stroke: color,
      "stroke-opacity": 0.28,
      "stroke-width": 1.2,
    })
  );

  const gap = Math.min(28, (height - 24) / Math.max(lines.length - 1, 1));
  const startY = y - ((lines.length - 1) * gap) / 2 + 4;

  lines.forEach((line, index) => {
    drawText(svg, x, startY + index * gap, line, {
      fill: index === 0 ? color : colors.muted,
      size: lines.length > 4 ? 10.4 : (index === 0 ? 11 : 10.7),
      weight: index === 0 ? 800 : 650,
    });
  });
}

function drawText(
  svg,
  x,
  y,
  text,
  {
    fill = "#000",
    size = 12,
    weight = 400,
    anchor = "middle",
    opacity = 1,
  } = {}
) {
  const element = svgElement("text", {
    x,
    y,
    "text-anchor": anchor,
    "font-family": "JetBrains Mono, Fira Code, Consolas, monospace",
    "font-size": size,
    "font-weight": weight,
    fill,
    opacity,
  });

  element.textContent = text;
  svg.appendChild(element);
}

function svgElement(tag, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  return element;
}

/* ================================================================
   FORMATTING / COLORS
   ================================================================ */

function formatMatching(matching) {
  return `{ ${matching
    .map(({ proposer, receiver }) => `(${prettyParty(proposer)}, ${prettyParty(receiver)})`)
    .join(", ")} }`;
}

function prettyParty(party) {
  const match = String(party).match(/^([a-zA-Z]+)(\d+)?$/);
  if (!match) return party;

  const [, name, number] = match;
  if (!number) return name;

  return name + toSubscript(number);
}

function toSubscript(value) {
  const digits = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  };

  return String(value)
    .split("")
    .map(digit => digits[digit] ?? digit)
    .join("");
}

function getColors() {
  const style = getComputedStyle(document.documentElement);

  return {
    partyL: cssColor(style, "--party-l"),
    partyR: cssColor(style, "--party-r"),
    proposal: cssColor(style, "--proposal"),
    matching: cssColor(style, "--matching"),
    byzantine: cssColor(style, "--byzantine"),
    brandOrange: cssColor(style, "--brand-orange"),
    brandPurple: cssColor(style, "--brand-purple"),
    muted: cssColor(style, "--text-muted"),
    surface: cssColor(style, "--surface"),
  };
}

function cssColor(style, variable) {
  return style.getPropertyValue(variable).trim();
}

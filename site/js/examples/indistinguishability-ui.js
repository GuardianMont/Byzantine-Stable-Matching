import {
  createIndistinguishabilityScenario,
  evaluateIndistinguishabilityContradiction,
  getExecution,
  getPartySide,
} from "../core/indistinguishability.js";

let scenario = null;
let stage = 0;

/* ================================================================
   INITIALIZATION / CONTROLS
   ================================================================ */

export function indInit() {
  scenario = createIndistinguishabilityScenario();
  stage = 0;
  render();
  updateControls();
}

export function indStart() {
  stage = 1;
  render();
  updateControls();
}

export function indBack() {
  if (stage <= 0) return;

  stage -= 1;
  render();
  updateControls();
}

export function indStep() {
  if (stage >= 4) return;

  stage += 1;
  render();
  updateControls();
}

export function indReset() {
  indInit();
}

function render() {
  renderGraph();
  renderExplanation();
  updateStatus();
}

/* ================================================================
   GRAPH ROUTER
   ================================================================ */

function renderGraph() {
  const svg = document.getElementById("ind-svg");
  if (!svg) return;

  svg.innerHTML = "";
  svg.setAttribute("viewBox", "0 0 760 560");

  if (stage === 0) {
    renderOriginalSystem(svg);
  } else if (stage === 1) {
    renderDuplicatedSystem(svg);
  } else if (stage === 2) {
    renderExecutionScene(svg, "A");
  } else if (stage === 3) {
    renderExecutionScene(svg, "B");
  } else {
    renderFinalExecution(svg);
  }
}

/* ================================================================
   STAGE 0 — ORIGINAL SYSTEM
   ================================================================ */

function renderOriginalSystem(svg) {
  const colors = getColors();

  drawSceneTitle(svg, "ORIGINAL SYSTEM", "the real six-party setting");
  drawSideLabels(svg, colors, 100);

  const positions = {
    a: { x: 175, y: 170 },
    b: { x: 175, y: 290 },
    c: { x: 175, y: 410 },
    u: { x: 585, y: 170 },
    v: { x: 585, y: 290 },
    w: { x: 585, y: 410 },
  };

  for (const party of scenario.original.L) {
    drawParty(svg, party, positions[party], colors.partyL, { radius: 31 });
  }

  for (const party of scenario.original.R) {
    drawParty(svg, party, positions[party], colors.partyR, { radius: 31 });
  }

  drawBottomNote(
    svg,
    "k = 3   ·   tL = 1   ·   tR = 1   ·   assume a correct protocol Π exists",
    colors.muted,
    525
  );
}

/* ================================================================
   STAGE 1 — DUPLICATED PROOF GADGET
   ================================================================ */

function renderDuplicatedSystem(svg) {
  const colors = getColors();
  const positions = getDuplicatedPositions();

  drawSceneTitle(
    svg,
    "DUPLICATED PROOF GADGET",
    "two virtual copies of every original party"
  );
  drawSideLabels(svg, colors, 105);

  drawRoundedLabel(
    svg,
    380,
    115,
    "COPY 1 · c₁ ↔ v₁ are mutual favorites",
    colors.proposal,
    { width: 310, height: 30, fontSize: 11, opaque: true }
  );

  drawRoundedLabel(
    svg,
    380,
    320,
    "COPY 2 · a₂ ↔ v₂ are mutual favorites",
    colors.proposal,
    { width: 310, height: 30, fontSize: 11, opaque: true }
  );

  for (const [left, right] of scenario.duplicated.mutualFavorites) {
    drawEdge(svg, positions[left], positions[right], {
      color: colors.proposal,
      width: 2.5,
      dashed: true,
    });
  }

  for (const party of scenario.duplicated.L) {
    drawParty(svg, party, positions[party], colors.partyL, { radius: 23 });
  }

  for (const party of scenario.duplicated.R) {
    drawParty(svg, party, positions[party], colors.partyR, { radius: 23 });
  }

  drawBottomNote(
    svg,
    "Proof device only — A, B and C are separate executions, not consecutive rounds.",
    colors.brandPurple,
    535
  );
}

/* ================================================================
   STAGES 2 / 3 — EXECUTIONS A AND B
   Only honest parties are drawn. The simulated environment is
   described explicitly instead of using faded virtual nodes.
   ================================================================ */

function renderExecutionScene(svg, executionKey) {
  const colors = getColors();
  const execution = getExecution(scenario, executionKey);
  const positions = getExecutionPositions(execution);

  drawSceneTitle(
    svg,
    `EXECUTION ${executionKey}`,
    "a separate hypothetical execution of the same protocol"
  );

  drawRoundedLabel(
    svg,
    380,
    98,
    "FOCUSED VIEW · only honest parties are drawn",
    colors.muted,
    { width: 330, height: 30, fontSize: 10.5, opaque: true }
  );

  drawSideLabels(svg, colors, 145);

  const [forcedLeft, forcedRight] = execution.forcedMatches[0];

  drawRoundedLabel(
    svg,
    380,
    168,
    `${prettyParty(forcedLeft)} ↔ ${prettyParty(forcedRight)} are honest mutual favorites`,
    colors.proposal,
    { width: 340, height: 30, fontSize: 11, opaque: true }
  );

  for (const party of execution.honest) {
    const side = getPartySide(party);
    const color = side === "L" ? colors.partyL : colors.partyR;
    drawParty(svg, party, positions[party], color, { radius: 32 });
  }

  drawEdge(svg, positions[forcedLeft], positions[forcedRight], {
    color: colors.matching,
    width: 5,
  });

  drawDecisionBadge(
    svg,
    380,
    435,
    `${prettyParty(forcedLeft)} must choose ${prettyParty(forcedRight)}`,
    colors.matching,
    280
  );

  drawSimulatorBox(svg, execution.simulators, colors);
}

/* ================================================================
   STAGE 4 — EXECUTION C / CONTRADICTION
   This is intentionally not a 12-node graph. The point of the last
   stage is the two local views and the single real Byzantine v.
   ================================================================ */

function renderFinalExecution(svg) {
  const colors = getColors();
  const execution = getExecution(scenario, "C");

  drawSceneTitle(
    svg,
    "EXECUTION C",
    "the two local views now force incompatible outputs"
  );

  drawMultiLineCard(
    svg,
    205,
    130,
    [
      "a₂'s local view in C = Execution A",
      "same messages ⇒ a₂ must keep A's decision",
    ],
    colors.brandOrange,
    { width: 300, height: 76 }
  );

  drawMultiLineCard(
    svg,
    555,
    130,
    [
      "c₁'s local view in C = Execution B",
      "same messages ⇒ c₁ must keep B's decision",
    ],
    colors.brandPurple,
    { width: 300, height: 76 }
  );

  const positions = {
    a2: { x: 205, y: 290 },
    c1: { x: 555, y: 290 },
    v: { x: 380, y: 410 },
  };

  drawRoundedLabel(
    svg,
    positions.a2.x,
    228,
    "keeps choice v₂",
    colors.matching,
    { width: 160, height: 28, fontSize: 10.5, opaque: true }
  );

  drawRoundedLabel(
    svg,
    positions.c1.x,
    228,
    "keeps choice v₁",
    colors.matching,
    { width: 160, height: 28, fontSize: 10.5, opaque: true }
  );

  drawParty(svg, "a2", positions.a2, colors.partyL, { radius: 33 });
  drawParty(svg, "c1", positions.c1, colors.partyL, { radius: 33 });
  drawByzantineParty(svg, "v", positions.v, colors.partyR, colors.byzantine);

  drawEdge(svg, positions.a2, positions.v, {
    color: colors.matching,
    width: 5,
  });

  drawEdge(svg, positions.c1, positions.v, {
    color: colors.matching,
    width: 5,
  });

  drawRoundedLabel(
    svg,
    380,
    480,
    "v₁ and v₂ are two simulated views of the same real Byzantine party v",
    colors.byzantine,
    { width: 510, height: 32, fontSize: 10.5, opaque: true }
  );

  drawDecisionBadge(
    svg,
    380,
    530,
    "out(a₂) = out(c₁) = v   →   Non-Competition violated",
    colors.byzantine,
    430
  );

  void execution;
}

/* ================================================================
   EXPLANATION PANEL
   ================================================================ */

function renderExplanation() {
  const root = document.getElementById("ind-explanation");
  if (!root) return;

  if (stage === 0) {
    root.innerHTML = `
      <div class="ind-message">
        <strong>What are we proving?</strong>
        Assume, for contradiction, that a protocol Π solves the
        fully-connected unauthenticated case with
        <span class="ind-inline-math">k = 3</span> and
        <span class="ind-inline-math">t<sub>L</sub> = t<sub>R</sub> = 1</span>.

        <div class="ind-proof-note">
          This visualizer shows stages of an impossibility proof.
          They are <strong>not protocol rounds</strong>.
        </div>
      </div>
    `;
    return;
  }

  if (stage === 1) {
    root.innerHTML = `
      <div class="ind-message">
        <strong>Build the proof gadget.</strong>
        Each original party is replaced by two <em>virtual vertices</em>, identified
        by subscripts 1 and 2. These are not two rounds of the same real process.
        The proof assigns inputs to the virtual vertices and fixes only the two
        mutual-favorite relations needed later:

        <div class="ind-equation">c₁ ↔ v₁</div>
        <div class="ind-equation">a₂ ↔ v₂</div>

        <div class="ind-proof-note accent">
          Next we compare <strong>three different admissible executions</strong> A, B and C.
          Because they are different executions, the set of honest and Byzantine parties
          is allowed to change between them.
        </div>
      </div>
    `;
    return;
  }

  if (stage === 2) {
    renderExecutionExplanation(root, "A");
    return;
  }

  if (stage === 3) {
    renderExecutionExplanation(root, "B");
    return;
  }

  renderFinalExplanation(root);
}

function renderExecutionExplanation(root, executionKey) {
  const execution = getExecution(scenario, executionKey);
  const [left, right] = execution.forcedMatches[0];

  root.innerHTML = `
    <div class="ind-proof-card">
      <div class="ind-proof-title">EXECUTION ${executionKey}</div>

      <div class="ind-execution-separate">
        Separate hypothetical execution — not the next round.
        The corruption set is chosen independently for this execution.
      </div>

      <div class="ind-proof-row">
        <span>Honest parties</span>
        <strong>${formatPartyList(execution.honest)}</strong>
      </div>

      <div class="ind-proof-row">
        <span>Byzantine simulators</span>
        <strong>${formatPartyList(execution.simulators)}</strong>
      </div>

      <div class="ind-focus-note">
        The visualizer intentionally draws only the honest parties. The remaining
        virtual behaviour is generated by the Byzantine simulators above.
      </div>

      <div class="ind-causal-chain">
        <div class="ind-chain-step">
          <span class="ind-chain-label">Relevant fact</span>
          <div class="ind-equation">${prettyParty(left)} ↔ ${prettyParty(right)}</div>
        </div>

        <div class="ind-proof-arrow">↓</div>

        <div class="ind-chain-step">
          <span class="ind-chain-label">Because both are honest</span>
          <strong>Simplified stability forces the match.</strong>
        </div>

        <div class="ind-proof-arrow">↓</div>

        <div class="ind-conclusion pass">
          Remember: ${prettyParty(left)} decides ${prettyParty(right)}
        </div>
      </div>
    </div>
  `;
}

function renderFinalExplanation(root) {
  const execution = getExecution(scenario, "C");
  const contradiction = evaluateIndistinguishabilityContradiction(scenario);

  root.innerHTML = `
    <div class="ind-proof-card">
      <div class="ind-proof-title">EXECUTION C</div>

      <div class="ind-execution-separate">
        A third, separate execution. This is the point where the two earlier
        observations are combined through indistinguishability.
      </div>

      <div class="ind-proof-row">
        <span>Honest parties</span>
        <strong>${formatPartyList(execution.honest)}</strong>
      </div>

      <div class="ind-proof-row">
        <span>Byzantine simulators</span>
        <strong>${formatPartyList(execution.simulators)}</strong>
      </div>

      <div class="ind-final-sequence">
        <div class="ind-final-step">
          <span class="ind-final-step-number">1</span>
          <div>
            <strong>Local view of a₂</strong>
            <p>
              Execution C is indistinguishable from A to a₂. Therefore a₂
              must repeat the decision forced in A and act as if its target
              were v₂.
            </p>
          </div>
        </div>

        <div class="ind-final-step">
          <span class="ind-final-step-number">2</span>
          <div>
            <strong>Local view of c₁</strong>
            <p>
              Execution C is indistinguishable from B to c₁. Therefore c₁
              must repeat the decision forced in B and act as if its target
              were v₁.
            </p>
          </div>
        </div>

        <div class="ind-final-step collapse">
          <span class="ind-final-step-number">3</span>
          <div>
            <strong>Collapse the virtual copies</strong>
            <p>
              The names v₁ and v₂ only distinguish virtual vertices in the
              proof gadget. In Execution C they are simulated views of the
              same real Byzantine party v.
            </p>
          </div>
        </div>
      </div>

      <div class="ind-contradiction">
        <strong>CONTRADICTION</strong>
        <div class="ind-equation">a₂ ≠ c₁</div>
        <div class="ind-equation">out(a₂) = out(c₁) = v</div>
        <p>${contradiction.explanation}</p>
        <div class="ind-conclusion fail">✕ Non-Competition</div>
      </div>
    </div>
  `;
}

/* ================================================================
   SCENE HELPERS
   ================================================================ */

function drawSceneTitle(svg, title, subtitle) {
  const colors = getColors();

  drawText(svg, 380, 30, title, {
    fill: colors.brandPurple,
    size: 15,
    weight: 900,
  });

  drawText(svg, 380, 56, subtitle, {
    fill: colors.muted,
    size: 11.5,
    weight: 600,
  });
}

function drawSideLabels(svg, colors, y = 100) {
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

function drawBottomNote(svg, text, color, y = 525) {
  drawRoundedLabel(svg, 380, y, text, color, {
    width: 570,
    height: 34,
    fontSize: 11,
    opaque: true,
  });
}

function drawSimulatorBox(svg, simulators, colors) {
  drawRoundedLabel(
    svg,
    380,
    485,
    `Byzantine simulators: ${formatPartyList(simulators)}`,
    colors.byzantine,
    { width: 280, height: 30, fontSize: 11, opaque: true }
  );

  drawText(
    svg,
    380,
    525,
    "They generate the remaining virtual behaviour; omitted nodes are not part of this focused view.",
    {
      fill: colors.muted,
      size: 10.5,
      weight: 600,
    }
  );
}

function drawDecisionBadge(svg, x, y, text, color, width = 250) {
  drawRoundedLabel(svg, x, y, text, color, {
    width,
    height: 34,
    fontSize: 11,
    opaque: true,
  });
}

function drawViewCard(svg, x, y, text, color) {
  drawRoundedLabel(svg, x, y, text, color, {
    width: 235,
    height: 30,
    fontSize: 10.5,
    opaque: true,
  });
}

function drawMultiLineCard(
  svg,
  x,
  y,
  lines,
  color,
  { width = 280, height = 70 } = {}
) {
  const colors = getColors();

  svg.appendChild(
    svgElement("rect", {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 9,
      fill: colors.surface,
      stroke: color,
      "stroke-opacity": 0.35,
      "stroke-width": 1.2,
    })
  );

  const lineGap = 22;
  const startY = y - ((lines.length - 1) * lineGap) / 2 + 4;

  lines.forEach((line, index) => {
    drawText(svg, x, startY + index * lineGap, line, {
      fill: index === 0 ? color : colors.muted,
      size: index === 0 ? 11 : 10.5,
      weight: index === 0 ? 800 : 650,
    });
  });
}

/* ================================================================
   POSITIONS
   ================================================================ */

function getDuplicatedPositions() {
  return {
    a1: { x: 175, y: 165 },
    b1: { x: 175, y: 220 },
    c1: { x: 175, y: 275 },
    a2: { x: 175, y: 370 },
    b2: { x: 175, y: 425 },
    c2: { x: 175, y: 480 },
    u1: { x: 585, y: 165 },
    v1: { x: 585, y: 220 },
    w1: { x: 585, y: 275 },
    u2: { x: 585, y: 370 },
    v2: { x: 585, y: 425 },
    w2: { x: 585, y: 480 },
  };
}

function getExecutionPositions(execution) {
  const left = execution.honest.filter(party => getPartySide(party) === "L");
  const right = execution.honest.filter(party => getPartySide(party) === "R");

  const positions = {};
  const ys = [245, 355];

  left.forEach((party, index) => {
    positions[party] = { x: 175, y: ys[index] ?? 300 };
  });

  right.forEach((party, index) => {
    positions[party] = { x: 585, y: ys[index] ?? 300 };
  });

  return positions;
}

/* ================================================================
   STATUS
   ================================================================ */

function updateStatus() {
  const status = document.getElementById("ind-step-n");
  if (!status) return;

  const labels = {
    0: "—",
    1: "1 / 4 · Build proof gadget",
    2: "2 / 4 · Execution A",
    3: "3 / 4 · Execution B",
    4: "4 / 4 · Execution C → contradiction",
  };

  status.textContent = labels[stage];
}

function updateControls() {
  const start = document.getElementById("ind-start");
  const back = document.getElementById("ind-back");
  const next = document.getElementById("ind-next");

  if (start) {
    start.disabled = stage > 0;
  }

  if (back) {
    back.disabled = stage === 0;
  }

  if (next) {
    next.disabled = stage === 0 || stage === 4;
  }
}

/* ================================================================
   SVG HELPERS
   ================================================================ */

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

  drawText(svg, position.x, position.y + 5, prettyParty(party), {
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

function drawEdge(svg, from, to, { color, width = 3, dashed = false }) {
  const endpoints = shortenLine(from, to, 34, 34);

  const line = svgElement("line", {
    x1: endpoints.x1,
    y1: endpoints.y1,
    x2: endpoints.x2,
    y2: endpoints.y2,
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
  });

  if (dashed) {
    line.setAttribute("stroke-dasharray", "7 6");
  }

  svg.appendChild(line);
}

function shortenLine(from, to, startOffset, endOffset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  return {
    x1: from.x + ux * startOffset,
    y1: from.y + uy * startOffset,
    x2: to.x - ux * endOffset,
    y2: to.y - uy * endOffset,
  };
}

function drawEdgeLabel(svg, from, to, label, color, yOffset = -10) {
  const x = (from.x + to.x) / 2;
  const y = (from.y + to.y) / 2 + yOffset;

  drawText(svg, x, y, label, {
    fill: color,
    size: 9.5,
    weight: 800,
  });
}

function drawRoundedLabel(
  svg,
  x,
  y,
  text,
  color,
  { width = 120, height = 26, fontSize = 10.5, opaque = false } = {}
) {
  const colors = getColors();

  svg.appendChild(
    svgElement("rect", {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 7,
      fill: opaque ? colors.surface : color,
      "fill-opacity": opaque ? 0.96 : 0.08,
      stroke: color,
      "stroke-opacity": 0.35,
      "stroke-width": 1,
    })
  );

  drawText(svg, x, y + 4, text, {
    fill: color,
    size: fontSize,
    weight: 800,
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
   COLORS / TEXT
   ================================================================ */

function getColors() {
  const style = getComputedStyle(document.documentElement);

  return {
    partyL: cssColor(style, "--party-l"),
    partyR: cssColor(style, "--party-r"),
    proposal: cssColor(style, "--proposal"),
    matching: cssColor(style, "--matching"),
    byzantine: cssColor(style, "--byzantine"),
    surface: cssColor(style, "--surface"),
    brandOrange: cssColor(style, "--brand-orange"),
    brandPurple: cssColor(style, "--brand-purple"),
    muted: cssColor(style, "--text-muted"),
  };
}

function cssColor(style, variable) {
  return style.getPropertyValue(variable).trim();
}

function formatPartyList(parties) {
  return parties.map(prettyParty).join(", ");
}

function prettyParty(party) {
  const match = String(party).match(/^([a-zA-Z]+)(\d+)?$/);
  if (!match) return party;

  const [, name, number] = match;
  return number ? name + toSubscript(number) : name;
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

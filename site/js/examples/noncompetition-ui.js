import {
  createNonCompetitionScenario,
  evaluateBsmProperties,
} from "../core/noncompetition.js";


let scenario = null;
let stage = 0;


/* ================================================================
   INITIALIZATION
   ================================================================ */

export function ncInit() {
  scenario = createNonCompetitionScenario();
  stage = 0;

  renderPreferences();
  renderGraph();
  renderPropertyCheck();
  updateStatus();
  updateControls();
}


/* ================================================================
   CONTROLS
   ================================================================ */

export function ncStart() {
  stage = 1;

  renderGraph();
  renderPropertyCheck();
  updateStatus();
  updateControls();
}


export function ncBack() {
  if (stage <= 0) {
    return;
  }

  stage -= 1;

  renderGraph();
  renderPropertyCheck();
  updateStatus();
  updateControls();
}


export function ncStep() {
  if (stage >= 3) {
    return;
  }

  stage += 1;

  renderGraph();
  renderPropertyCheck();
  updateStatus();
  updateControls();
}


export function ncReset() {
  ncInit();
}


/* ================================================================
   PREFERENCES
   ================================================================ */

function renderPreferences() {
  const root =
    document.getElementById(
      "nc-pref-grid"
    );

  root.innerHTML = "";


  renderPreferenceSide(
    root,
    "L",
    scenario.preferences.L
  );

  renderPreferenceSide(
    root,
    "R",
    scenario.preferences.R
  );
}


function renderPreferenceSide(
  root,
  side,
  preferences
) {
  const heading =
    document.createElement("div");

  heading.className =
    "nc-pref-heading";

  heading.textContent =
    side === "L"
      ? "L — honest parties"
      : "R — one Byzantine party";


  root.appendChild(heading);


  for (
    const [party, list]
    of Object.entries(preferences)
  ) {
    const row =
      document.createElement("div");

    row.className =
      "pref-row";


    const label =
      document.createElement("div");

    label.className =
      "pref-party";

    label.textContent =
      prettyParty(party);


    const values =
      document.createElement("div");

    values.className =
      "pref-list";


    for (const candidate of list) {
      const chip =
        document.createElement("div");

      chip.className =
        "pref-chip nc-static-chip";

      chip.textContent =
        prettyParty(candidate);

      values.appendChild(chip);
    }


    row.appendChild(label);
    row.appendChild(values);

    root.appendChild(row);
  }
}


/* ================================================================
   GRAPH
   ================================================================ */

function renderGraph() {
  const svg =
    document.getElementById(
      "nc-svg"
    );

  svg.innerHTML = "";

  svg.setAttribute(
    "viewBox",
    "0 0 760 420"
  );


  const style =
    getComputedStyle(
      document.documentElement
    );

  const colorL =
    style
      .getPropertyValue("--party-l")
      .trim();

  const colorR =
    style
      .getPropertyValue("--party-r")
      .trim();

  const byzantineColor =
    style
      .getPropertyValue("--byzantine")
      .trim();

  const matchingColor =
    style
      .getPropertyValue("--matching")
      .trim();


  const positions = {
    l1: {
      x: 175,
      y: 140,
    },

    l2: {
      x: 175,
      y: 300,
    },

    r1: {
      x: 585,
      y: 140,
    },

    r2: {
      x: 585,
      y: 300,
    },
  };


  /* ------------------------------------------------
     Labels
     ------------------------------------------------ */

  drawText(
    svg,
    175,
    55,
    "L — HONEST",
    {
      fill: colorL,
      size: 14,
      weight: 800,
    }
  );


  drawText(
    svg,
    585,
    55,
    "R",
    {
      fill: colorR,
      size: 14,
      weight: 800,
    }
  );


  /* ------------------------------------------------
     Arrow marker
     ------------------------------------------------ */

  const defs =
    svgElement(
      "defs",
      {}
    );


  const marker =
    svgElement(
      "marker",
      {
        id: "nc-arrow",
        viewBox: "0 0 10 10",
        refX: 9,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: "auto-start-reverse",
      }
    );


  const arrowPath =
    svgElement(
      "path",
      {
        d: "M 0 0 L 10 5 L 0 10 z",
        fill: byzantineColor,
      }
    );


  marker.appendChild(
    arrowPath
  );

  defs.appendChild(
    marker
  );

  svg.appendChild(
    defs
  );


  /* ------------------------------------------------
     Stage 2 — Byzantine equivocation
     ------------------------------------------------ */

  if (stage >= 2) {
    drawEdge(
      svg,
      positions.r1,
      positions.l1,
      {
        color:
          byzantineColor,

        dashed: true,

        arrow: true,

        width: 2.5,
      }
    );


    drawEdge(
      svg,
      positions.r1,
      positions.l2,
      {
        color:
          byzantineColor,

        dashed: true,

        arrow: true,

        width: 2.5,
      }
    );


    drawText(
      svg,
      380,
      105,
      "\"match with l₁\"",
      {
        fill:
          byzantineColor,

        size: 11,
        weight: 600,
      }
    );


    drawText(
      svg,
      380,
      260,
      "\"match with l₂\"",
      {
        fill:
          byzantineColor,

        size: 11,
        weight: 600,
      }
    );
  }


  /* ------------------------------------------------
     Stage 3 — Honest outputs
     ------------------------------------------------ */

  if (stage >= 3) {
    drawEdge(
      svg,
      positions.l1,
      positions.r1,
      {
        color:
          matchingColor,

        width: 5,
      }
    );


    drawEdge(
      svg,
      positions.l2,
      positions.r1,
      {
        color:
          matchingColor,

        width: 5,
      }
    );
  }


  /* ------------------------------------------------
     Nodes
     ------------------------------------------------ */

  drawParty(
    svg,
    "l1",
    positions.l1,
    colorL
  );

  drawParty(
    svg,
    "l2",
    positions.l2,
    colorL
  );

  drawParty(
    svg,
    "r2",
    positions.r2,
    colorR
  );


  drawByzantineParty(
    svg,
    "r1",
    positions.r1,
    colorR,
    byzantineColor
  );
}


/* ================================================================
   PROPERTY CHECK
   ================================================================ */

function renderPropertyCheck() {
  const root =
    document.getElementById(
      "nc-property-check"
    );


  /*
   * Before the final stage, show
   * the current event explanation.
   */
  if (stage === 0) {
    root.innerHTML = `
      <div class="nc-message">
        Configure the scenario and press
        <strong>Start</strong>.
      </div>
    `;

    return;
  }


  if (stage === 1) {
    root.innerHTML = `
      <div class="nc-message">
        <strong>Initial state.</strong>
        Parties
        ${prettyParty("l1")},
        ${prettyParty("l2")}
        and
        ${prettyParty("r2")}
        are honest.
        ${prettyParty("r1")}
        is Byzantine.
      </div>
    `;

    return;
  }


  if (stage === 2) {
    root.innerHTML = `
      <div class="nc-message nc-message-byzantine">

        <strong>Byzantine equivocation.</strong>

        ${prettyParty("r1")}
        sends incompatible matching
        confirmations to two honest parties:

        <div class="nc-equation">
          r₁ → l₁ : “match with l₁”
        </div>

        <div class="nc-equation">
          r₁ → l₂ : “match with l₂”
        </div>

      </div>
    `;

    return;
  }


  const results =
    evaluateBsmProperties(
      scenario
    );


  root.innerHTML = `
    ${propertyRow(
      "Termination",
      results.termination
    )}

    ${propertyRow(
      "Symmetry",
      results.symmetry
    )}

    ${propertyRow(
      "Stability",
      results.stability
    )}

    ${propertyRow(
      "Non-Competition",
      results.nonCompetition
    )}

    <div class="nc-violation-summary">

      <strong>
        Why does bSM fail?
      </strong>

      <div class="nc-equation">
        l₁ ≠ l₂
      </div>

      <div class="nc-equation">
        out(l₁) = out(l₂) = r₁
      </div>

      Two distinct honest parties claim
      the same Byzantine party.

    </div>
  `;
}


function propertyRow(
  name,
  result
) {
  const state =
    result.satisfied
      ? "pass"
      : "fail";

  const icon =
    result.satisfied
      ? "✓"
      : "✕";


  return `
    <div class="property-row ${state}">

      <div class="property-icon">
        ${icon}
      </div>

      <div class="property-content">

        <div class="property-name">
          ${name}
        </div>

        <div class="property-detail">
          ${result.explanation}
        </div>

      </div>

    </div>
  `;
}


/* ================================================================
   STATUS
   ================================================================ */

function updateStatus() {
  const status =
    document.getElementById(
      "nc-step-n"
    );


  const labels = {
    0: "—",
    1: "1 / 3 · Initial state",
    2: "2 / 3 · Equivocation",
    3: "3 / 3 · Violation",
  };


  status.textContent =
    labels[stage];
}


function updateControls() {
  const start =
    document.getElementById(
      "nc-start"
    );

  const back =
    document.getElementById(
      "nc-back"
    );

  const next =
    document.getElementById(
      "nc-next"
    );


  if (start) {
    start.disabled = stage > 0;
  }

  if (back) {
    back.disabled = stage === 0;
  }

  if (next) {
    next.disabled = stage === 0 || stage === 3;
  }
}


/* ================================================================
   SVG HELPERS
   ================================================================ */

function drawParty(
  svg,
  party,
  position,
  color
) {
  svg.appendChild(
    svgElement(
      "circle",
      {
        cx: position.x,
        cy: position.y,
        r: 30,

        fill: color,

        stroke: "#FFFFFF",
        "stroke-width": 4,
      }
    )
  );


  drawText(
    svg,
    position.x,
    position.y + 5,
    prettyParty(party),
    {
      fill: "#FFFFFF",
      size: 17,
      weight: 800,
    }
  );
}


function drawByzantineParty(
  svg,
  party,
  position,
  color,
  byzantineColor
) {
  /*
   * Keep R purple, but mark Byzantine
   * status using the outer red ring.
   */
  svg.appendChild(
    svgElement(
      "circle",
      {
        cx: position.x,
        cy: position.y,
        r: 37,

        fill: "none",

        stroke:
          byzantineColor,

        "stroke-width": 4,

        "stroke-dasharray":
          "6 4",
      }
    )
  );


  drawParty(
    svg,
    party,
    position,
    color
  );


  svg.appendChild(
    svgElement(
      "circle",
      {
        cx:
          position.x + 28,

        cy:
          position.y - 28,

        r: 13,

        fill:
          byzantineColor,

        stroke:
          "#FFFFFF",

        "stroke-width": 2,
      }
    )
  );


  drawText(
    svg,
    position.x + 28,
    position.y - 24,
    "B",
    {
      fill: "#FFFFFF",
      size: 11,
      weight: 800,
    }
  );
}


function drawEdge(
  svg,
  from,
  to,
  {
    color,
    dashed = false,
    arrow = false,
    width = 3,
  }
) {
  const line =
    svgElement(
      "line",
      {
        x1: from.x,
        y1: from.y,

        x2: to.x,
        y2: to.y,

        stroke: color,

        "stroke-width":
          width,

        "stroke-linecap":
          "round",
      }
    );


  if (dashed) {
    line.setAttribute(
      "stroke-dasharray",
      "8 6"
    );
  }


  if (arrow) {
    line.setAttribute(
      "marker-end",
      "url(#nc-arrow)"
    );
  }


  svg.appendChild(
    line
  );
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
  } = {}
) {
  const element =
    svgElement(
      "text",
      {
        x,
        y,

        "text-anchor":
          "middle",

        "font-family":
          "JetBrains Mono, Fira Code, monospace",

        "font-size":
          size,

        "font-weight":
          weight,

        fill,
      }
    );


  element.textContent =
    text;

  svg.appendChild(
    element
  );
}


function svgElement(
  tag,
  attributes
) {
  const element =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag
    );


  for (
    const [name, value]
    of Object.entries(attributes)
  ) {
    element.setAttribute(
      name,
      value
    );
  }


  return element;
}


/* ================================================================
   TEXT HELPERS
   ================================================================ */

function prettyParty(party) {
  const side =
    party[0];

  const number =
    party.slice(1);

  return (
    side +
    toSubscript(number)
  );
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
    .map(
      x =>
        digits[x] ?? x
    )
    .join("");
}
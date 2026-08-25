import {
  createIndistinguishabilityScenario,
  evaluateIndistinguishabilityContradiction,
  getExecution,
  getPartySide,
} from "../core/indistinguishability.js";


let scenario = null;
let stage = 0;


/* ================================================================
   INITIALIZATION
   ================================================================ */

export function indInit() {
  scenario =
    createIndistinguishabilityScenario();

  stage = 0;

  renderGraph();
  renderExplanation();
  updateStatus();

  setNextEnabled(false);
}


/* ================================================================
   CONTROLS
   ================================================================ */

export function indStart() {
  stage = 1;

  renderGraph();
  renderExplanation();
  updateStatus();

  setNextEnabled(true);
}


export function indStep() {
  if (stage >= 4) {
    return;
  }

  stage += 1;

  renderGraph();
  renderExplanation();
  updateStatus();


  if (stage === 4) {
    setNextEnabled(false);
  }
}


export function indReset() {
  indInit();
}


/* ================================================================
   GRAPH
   ================================================================ */

function renderGraph() {
  const svg =
    document.getElementById(
      "ind-svg"
    );

  /*
   * This guard is intentional:
   * adding this module must not break app.js
   * before the 8.3 HTML screen exists.
   */
  if (!svg) {
    return;
  }


  svg.innerHTML = "";

  svg.setAttribute(
    "viewBox",
    "0 0 760 440"
  );


  if (stage === 0) {
    renderOriginalSystem(
      svg
    );

    return;
  }


  if (stage === 1) {
    renderDuplicatedSystem(
      svg
    );

    return;
  }


  if (stage === 2) {
    renderExecution(
      svg,
      "A"
    );

    return;
  }


  if (stage === 3) {
    renderExecution(
      svg,
      "B"
    );

    return;
  }


  renderFinalExecution(
    svg
  );
}


/* ================================================================
   STAGE 0 — ORIGINAL SYSTEM
   ================================================================ */

function renderOriginalSystem(
  svg
) {
  const colors =
    getColors();


  drawText(
    svg,
    175,
    55,
    "L",
    {
      fill:
        colors.partyL,

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
      fill:
        colors.partyR,

      size: 14,
      weight: 800,
    }
  );


  drawText(
    svg,
    380,
    55,
    "ORIGINAL SYSTEM",
    {
      fill:
        colors.muted,

      size: 11,
      weight: 700,
    }
  );


  const positions = {
    a: {
      x: 175,
      y: 130,
    },

    b: {
      x: 175,
      y: 220,
    },

    c: {
      x: 175,
      y: 310,
    },

    u: {
      x: 585,
      y: 130,
    },

    v: {
      x: 585,
      y: 220,
    },

    w: {
      x: 585,
      y: 310,
    },
  };


  for (
    const party
    of scenario.original.L
  ) {
    drawParty(
      svg,
      party,
      positions[party],
      colors.partyL
    );
  }


  for (
    const party
    of scenario.original.R
  ) {
    drawParty(
      svg,
      party,
      positions[party],
      colors.partyR
    );
  }


  drawText(
    svg,
    380,
    390,
    "k = 3   ·   tL = 1   ·   tR = 1",
    {
      fill:
        colors.muted,

      size: 12,
      weight: 700,
    }
  );
}


/* ================================================================
   STAGE 1 — DUPLICATED SYSTEM
   ================================================================ */

function renderDuplicatedSystem(
  svg
) {
  const colors =
    getColors();

  const positions =
    getDuplicatedPositions();


  drawDuplicatedLabels(
    svg,
    colors
  );


  /*
   * Relevant mutual favorites.
   */

  for (
    const [left, right]
    of scenario
      .duplicated
      .mutualFavorites
  ) {
    drawEdge(
      svg,
      positions[left],
      positions[right],
      {
        color:
          colors.proposal,

        width: 2.5,

        dashed:
          true,
      }
    );

    drawSmallEdgeLabel(
      svg,
      positions[left],
      positions[right],
      "mutual favorites",
      colors.proposal
    );
  }


  drawAllVirtualParties(
    svg,
    positions,
    null
  );
}


/* ================================================================
   STAGES 2 / 3 — EXECUTION A / B
   ================================================================ */

function renderExecution(
  svg,
  executionKey
) {
  const colors =
    getColors();

  const positions =
    getDuplicatedPositions();

  const execution =
    getExecution(
      scenario,
      executionKey
    );


  drawDuplicatedLabels(
    svg,
    colors
  );


  /*
   * Draw mutual-favorite information first.
   */

  for (
    const [left, right]
    of scenario
      .duplicated
      .mutualFavorites
  ) {
    drawEdge(
      svg,
      positions[left],
      positions[right],
      {
        color:
          colors.proposal,

        width: 2,

        dashed:
          true,

        opacity:
          0.4,
      }
    );
  }


  /*
   * Forced decision in the current execution.
   */

  for (
    const [left, right]
    of execution.forcedMatches
  ) {
    drawEdge(
      svg,
      positions[left],
      positions[right],
      {
        color:
          colors.matching,

        width: 5,
      }
    );

    drawSmallEdgeLabel(
      svg,
      positions[left],
      positions[right],
      "forced by simplified stability",
      colors.matching
    );
  }


  drawAllVirtualParties(
    svg,
    positions,
    execution
  );


  drawExecutionBadge(
    svg,
    executionKey,
    execution.simulators
  );
}


/* ================================================================
   STAGE 4 — FINAL EXECUTION
   ================================================================ */

function renderFinalExecution(
  svg
) {
  const colors =
    getColors();

  const positions =
    getDuplicatedPositions();

  const execution =
    getExecution(
      scenario,
      "C"
    );


  drawDuplicatedLabels(
    svg,
    colors
  );


  /*
   * Decisions inherited through
   * indistinguishability.
   */

  drawEdge(
    svg,
    positions.a2,
    positions.v2,
    {
      color:
        colors.matching,

      width: 5,
    }
  );


  drawEdge(
    svg,
    positions.c1,
    positions.v1,
    {
      color:
        colors.matching,

      width: 5,
    }
  );


  /*
   * v1 and v2 now correspond to
   * the same real Byzantine party v.
   */

  drawCollapsedPartyRelation(
    svg,
    positions.v1,
    positions.v2,
    colors.byzantine
  );


  drawAllVirtualParties(
    svg,
    positions,
    execution
  );


  /*
   * Local-view badges.
   */

  drawViewBadge(
    svg,
    positions.a2.x - 80,
    positions.a2.y,
    "same view as A",
    colors.brandOrange
  );


  drawViewBadge(
    svg,
    positions.c1.x - 80,
    positions.c1.y,
    "same view as B",
    colors.brandPurple
  );


  drawExecutionBadge(
    svg,
    "C",
    execution.simulators
  );
}


/* ================================================================
   EXPLANATION PANEL
   ================================================================ */

function renderExplanation() {
  const root =
    document.getElementById(
      "ind-explanation"
    );


  if (!root) {
    return;
  }


  if (stage === 0) {
    root.innerHTML = `
      <div class="ind-message">

        <strong>
          Impossibility setup.
        </strong>

        Consider the fully-connected
        unauthenticated case with

        <div class="ind-equation">
          k = 3,
          &nbsp;
          t<sub>L</sub> = t<sub>R</sub> = 1.
        </div>

        Press <strong>Start</strong>
        to construct the duplicated system.

      </div>
    `;

    return;
  }


  if (stage === 1) {
    root.innerHTML = `
      <div class="ind-message">

        <strong>
          Duplicated system.
        </strong>

        Every original party is represented
        by two virtual copies.

        The proof fixes two relevant
        mutual-favorite pairs:

        <div class="ind-equation">
          c₁ ↔ v₁
        </div>

        <div class="ind-equation">
          a₂ ↔ v₂
        </div>

        The system itself is not a normal
        execution yet. It is a device used
        to compare several executions of
        the original protocol.

      </div>
    `;

    return;
  }


  if (stage === 2) {
    const execution =
      getExecution(
        scenario,
        "A"
      );


    root.innerHTML = `
      <div class="ind-proof-card">

        <div class="ind-proof-title">
          EXECUTION A
        </div>

        <div class="ind-proof-row">
          <span>Honest</span>

          <strong>
            ${formatPartyList(
              execution.honest
            )}
          </strong>
        </div>

        <div class="ind-proof-row">
          <span>Byzantine simulators</span>

          <strong>
            ${formatPartyList(
              execution.simulators
            )}
          </strong>
        </div>

        <div class="ind-proof-arrow">
          ↓
        </div>

        <div class="ind-equation">
          a₂ ↔ v₂
        </div>

        <p>
          Since a₂ and v₂ are honest
          mutual favorites, simplified
          stability forces them to match.
        </p>

        <div class="ind-conclusion pass">
          a₂ decides v₂
        </div>

      </div>
    `;

    return;
  }


  if (stage === 3) {
    const execution =
      getExecution(
        scenario,
        "B"
      );


    root.innerHTML = `
      <div class="ind-proof-card">

        <div class="ind-proof-title">
          EXECUTION B
        </div>

        <div class="ind-proof-row">
          <span>Honest</span>

          <strong>
            ${formatPartyList(
              execution.honest
            )}
          </strong>
        </div>

        <div class="ind-proof-row">
          <span>Byzantine simulators</span>

          <strong>
            ${formatPartyList(
              execution.simulators
            )}
          </strong>
        </div>

        <div class="ind-proof-arrow">
          ↓
        </div>

        <div class="ind-equation">
          c₁ ↔ v₁
        </div>

        <p>
          Since c₁ and v₁ are honest
          mutual favorites, simplified
          stability forces them to match.
        </p>

        <div class="ind-conclusion pass">
          c₁ decides v₁
        </div>

      </div>
    `;

    return;
  }


  renderFinalContradiction(
    root
  );
}


/* ================================================================
   FINAL CONTRADICTION
   ================================================================ */

function renderFinalContradiction(
  root
) {
  const execution =
    getExecution(
      scenario,
      "C"
    );

  const contradiction =
    evaluateIndistinguishabilityContradiction(
      scenario
    );


  root.innerHTML = `
    <div class="ind-proof-card">

      <div class="ind-proof-title">
        EXECUTION C
      </div>

      <div class="ind-proof-row">
        <span>Honest</span>

        <strong>
          ${formatPartyList(
            execution.honest
          )}
        </strong>
      </div>

      <div class="ind-proof-row">
        <span>Byzantine simulators</span>

        <strong>
          ${formatPartyList(
            execution.simulators
          )}
        </strong>
      </div>


      <div class="ind-view-grid">

        <div class="ind-view-card">

          <strong>
            a₂
          </strong>

          <span>
            cannot distinguish
            Execution C from A
          </span>

          <div class="ind-proof-arrow">
            ↓
          </div>

          <div class="ind-equation">
            a₂ → v
          </div>

        </div>


        <div class="ind-view-card">

          <strong>
            c₁
          </strong>

          <span>
            cannot distinguish
            Execution C from B
          </span>

          <div class="ind-proof-arrow">
            ↓
          </div>

          <div class="ind-equation">
            c₁ → v
          </div>

        </div>

      </div>


      <div class="ind-contradiction">

        <strong>
          CONTRADICTION
        </strong>

        <div class="ind-equation">
          a₂ ≠ c₁
        </div>

        <div class="ind-equation">
          out(a₂) = out(c₁) = v
        </div>

        <p>
          ${contradiction.explanation}
        </p>

        <div class="ind-conclusion fail">
          ✕ Non-Competition
        </div>

      </div>

    </div>
  `;
}


/* ================================================================
   VIRTUAL NODE RENDERING
   ================================================================ */

function drawAllVirtualParties(
  svg,
  positions,
  execution
) {
  for (
    const party
    of scenario.duplicated.L
  ) {
    drawVirtualParty(
      svg,
      party,
      positions[party],
      execution
    );
  }


  for (
    const party
    of scenario.duplicated.R
  ) {
    drawVirtualParty(
      svg,
      party,
      positions[party],
      execution
    );
  }
}


function drawVirtualParty(
  svg,
  party,
  position,
  execution
) {
  const colors =
    getColors();

  const side =
    getPartySide(
      party
    );

  const fill =
    side === "L"
      ? colors.partyL
      : colors.partyR;


  const honest =
    !execution ||
    execution.honest.includes(
      party
    );


  const opacity =
    honest
      ? 1
      : 0.28;


  /*
   * Simulated virtual nodes get
   * an outer dashed Byzantine ring.
   */

  if (
    execution &&
    !honest
  ) {
    svg.appendChild(
      svgElement(
        "circle",
        {
          cx:
            position.x,

          cy:
            position.y,

          r:
            27,

          fill:
            "none",

          stroke:
            colors.byzantine,

          "stroke-width":
            2,

          "stroke-dasharray":
            "5 4",

          opacity:
            0.65,
        }
      )
    );
  }


  drawParty(
    svg,
    party,
    position,
    fill,
    {
      radius: 21,
      opacity,
    }
  );
}


/* ================================================================
   COLLAPSED PARTY VISUALIZATION
   ================================================================ */

function drawCollapsedPartyRelation(
  svg,
  first,
  second,
  color
) {
  const x =
    Math.max(
      first.x,
      second.x
    ) + 62;


  svg.appendChild(
    svgElement(
      "line",
      {
        x1: x,
        y1: first.y,

        x2: x,
        y2: second.y,

        stroke:
          color,

        "stroke-width":
          2.5,

        "stroke-dasharray":
          "6 5",
      }
    )
  );


  svg.appendChild(
    svgElement(
      "line",
      {
        x1:
          first.x + 24,

        y1:
          first.y,

        x2:
          x,

        y2:
          first.y,

        stroke:
          color,

        "stroke-width":
          2.5,

        "stroke-dasharray":
          "6 5",
      }
    )
  );


  svg.appendChild(
    svgElement(
      "line",
      {
        x1:
          second.x + 24,

        y1:
          second.y,

        x2:
          x,

        y2:
          second.y,

        stroke:
          color,

        "stroke-width":
          2.5,

        "stroke-dasharray":
          "6 5",
      }
    )
  );


  drawText(
    svg,
    x - 8,
    (
      first.y +
      second.y
    ) / 2,
    "same Byzantine v",
    {
      fill:
        color,

      size:
        10,

      weight:
        800,

      anchor:
        "end",
    }
  );
}


/* ================================================================
   EXECUTION / VIEW BADGES
   ================================================================ */

function drawExecutionBadge(
  svg,
  execution,
  simulators
) {
  const colors =
    getColors();


  drawRoundedLabel(
    svg,
    380,
    25,
    `EXECUTION ${execution}`,
    colors.brandPurple
  );


  drawText(
    svg,
    380,
    420,
    `Byzantine simulators: ${formatPartyList(simulators)}`,
    {
      fill:
        colors.byzantine,

      size:
        11,

      weight:
        700,
    }
  );
}


function drawViewBadge(
  svg,
  x,
  y,
  label,
  color
) {
  drawRoundedLabel(
    svg,
    x,
    y,
    label,
    color,
    {
      width: 108,
      height: 24,
    }
  );
}


/* ================================================================
   DUPLICATED GRAPH LABELS
   ================================================================ */

function drawDuplicatedLabels(
  svg,
  colors
) {
  drawText(
    svg,
    175,
    32,
    "L",
    {
      fill:
        colors.partyL,

      size:
        14,

      weight:
        800,
    }
  );


  drawText(
    svg,
    585,
    32,
    "R",
    {
      fill:
        colors.partyR,

      size:
        14,

      weight:
        800,
    }
  );


  drawText(
    svg,
    380,
    62,
    "COPY 1",
    {
      fill:
        colors.muted,

      size:
        10,

      weight:
        700,
    }
  );


  drawText(
    svg,
    380,
    250,
    "COPY 2",
    {
      fill:
        colors.muted,

      size:
        10,

      weight:
        700,
    }
  );
}


/* ================================================================
   POSITIONS
   ================================================================ */

function getDuplicatedPositions() {
  return {
    a1: {
      x: 175,
      y: 95,
    },

    b1: {
      x: 175,
      y: 145,
    },

    c1: {
      x: 175,
      y: 195,
    },


    a2: {
      x: 175,
      y: 285,
    },

    b2: {
      x: 175,
      y: 335,
    },

    c2: {
      x: 175,
      y: 385,
    },


    u1: {
      x: 585,
      y: 95,
    },

    v1: {
      x: 585,
      y: 145,
    },

    w1: {
      x: 585,
      y: 195,
    },


    u2: {
      x: 585,
      y: 285,
    },

    v2: {
      x: 585,
      y: 335,
    },

    w2: {
      x: 585,
      y: 385,
    },
  };
}


/* ================================================================
   STATUS
   ================================================================ */

function updateStatus() {
  const status =
    document.getElementById(
      "ind-step-n"
    );


  if (!status) {
    return;
  }


  const labels = {
    0:
      "—",

    1:
      "1 / 4 · Duplicated system",

    2:
      "2 / 4 · Execution A",

    3:
      "3 / 4 · Execution B",

    4:
      "4 / 4 · Contradiction",
  };


  status.textContent =
    labels[stage];
}


function setNextEnabled(
  enabled
) {
  const button =
    document.getElementById(
      "ind-next"
    );


  if (!button) {
    return;
  }


  button.disabled =
    !enabled;
}


/* ================================================================
   DRAWING HELPERS
   ================================================================ */

function drawParty(
  svg,
  party,
  position,
  color,
  {
    radius = 28,
    opacity = 1,
  } = {}
) {
  svg.appendChild(
    svgElement(
      "circle",
      {
        cx:
          position.x,

        cy:
          position.y,

        r:
          radius,

        fill:
          color,

        stroke:
          "#FFFFFF",

        "stroke-width":
          3,

        opacity,
      }
    )
  );


  drawText(
    svg,
    position.x,
    position.y + 5,
    prettyParty(party),
    {
      fill:
        "#FFFFFF",

      size:
        radius <= 21
          ? 13
          : 17,

      weight:
        800,

      opacity,
    }
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
  const line =
    svgElement(
      "line",
      {
        x1:
          from.x,

        y1:
          from.y,

        x2:
          to.x,

        y2:
          to.y,

        stroke:
          color,

        "stroke-width":
          width,

        "stroke-linecap":
          "round",

        opacity,
      }
    );


  if (dashed) {
    line.setAttribute(
      "stroke-dasharray",
      "7 6"
    );
  }


  svg.appendChild(
    line
  );
}


function drawSmallEdgeLabel(
  svg,
  from,
  to,
  label,
  color
) {
  const x =
    (
      from.x +
      to.x
    ) / 2;

  const y =
    (
      from.y +
      to.y
    ) / 2 - 9;


  drawText(
    svg,
    x,
    y,
    label,
    {
      fill:
        color,

      size:
        9,

      weight:
        700,
    }
  );
}


function drawRoundedLabel(
  svg,
  x,
  y,
  text,
  color,
  {
    width = 120,
    height = 26,
  } = {}
) {
  svg.appendChild(
    svgElement(
      "rect",
      {
        x:
          x - width / 2,

        y:
          y - height / 2,

        width,
        height,

        rx:
          7,

        fill:
          color,

        opacity:
          0.1,

        stroke:
          color,

        "stroke-width":
          1,
      }
    )
  );


  drawText(
    svg,
    x,
    y + 4,
    text,
    {
      fill:
        color,

      size:
        9,

      weight:
        800,
    }
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
    anchor = "middle",
    opacity = 1,
  } = {}
) {
  const element =
    svgElement(
      "text",
      {
        x,
        y,

        "text-anchor":
          anchor,

        "font-family":
          "JetBrains Mono, Fira Code, Consolas, monospace",

        "font-size":
          size,

        "font-weight":
          weight,

        fill,

        opacity,
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
    of Object.entries(
      attributes
    )
  ) {
    element.setAttribute(
      name,
      value
    );
  }


  return element;
}


/* ================================================================
   COLORS
   ================================================================ */

function getColors() {
  const style =
    getComputedStyle(
      document.documentElement
    );


  return {
    partyL:
      cssColor(
        style,
        "--party-l"
      ),

    partyR:
      cssColor(
        style,
        "--party-r"
      ),

    proposal:
      cssColor(
        style,
        "--proposal"
      ),

    matching:
      cssColor(
        style,
        "--matching"
      ),

    byzantine:
      cssColor(
        style,
        "--byzantine"
      ),

    brandOrange:
      cssColor(
        style,
        "--brand-orange"
      ),

    brandPurple:
      cssColor(
        style,
        "--brand-purple"
      ),

    muted:
      cssColor(
        style,
        "--text-muted"
      ),
  };
}


function cssColor(
  style,
  variable
) {
  return style
    .getPropertyValue(
      variable
    )
    .trim();
}


/* ================================================================
   TEXT HELPERS
   ================================================================ */

function formatPartyList(
  parties
) {
  return parties
    .map(
      prettyParty
    )
    .join(", ");
}


function prettyParty(
  party
) {
  const match =
    String(party)
      .match(
        /^([a-zA-Z]+)(\d+)?$/
      );


  if (!match) {
    return party;
  }


  const [, name, number] =
    match;


  if (!number) {
    return name;
  }


  return (
    name +
    toSubscript(number)
  );
}


function toSubscript(
  value
) {
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
      digit =>
        digits[digit] ??
        digit
    )
    .join("");
}
import { runGaleShapley } from "../core/gale-shapley.js";


let preferences = null;
let execution = null;
let currentRound = -1;

let selectedPreference = null;


// ─────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────

export function gsInit() {
  const k = Number(
    document.getElementById("gs-k").value
  );

  document.getElementById("gs-lk").textContent = k;
  document.getElementById("gs-rk").textContent = k;

  preferences = buildDefaultPreferences(k);

  execution = null;
  currentRound = -1;
  selectedPreference = null;

  renderPreferenceEditor();

  updatePreferenceHint(`
    <span class="hint-icon">↔</span>

    <span>
      Click two entries in the same row
      to swap their ranking.
    </span>
  `);

  renderGraph([], []);

  document
    .getElementById("gs-placeholder")
    .style.display = "flex";

  document
    .getElementById("gs-trace")
    .innerHTML = `
      <span class="trace-empty">
        Configure and press Run.
      </span>
    `;

  document
    .getElementById("gs-step-n")
    .textContent = "—";

  document
    .getElementById("gs-step")
    .disabled = true;
}


// ─────────────────────────────────────────────────
// DEFAULT PREFERENCES
// ─────────────────────────────────────────────────

function buildDefaultPreferences(k) {
  const L = {};
  const R = {};

  const left =
    Array.from({ length: k }, (_, i) => `l${i + 1}`);

  const right =
    Array.from({ length: k }, (_, i) => `r${i + 1}`);

  for (const l of left) {
    L[l] = [...right];
  }

  for (const r of right) {
    R[r] = [...left];
  }

  /*
   * Canonical k = 3 example from the presentation.
   */
  if (k === 3) {
    L.l1 = ["r1", "r2", "r3"];
    L.l2 = ["r1", "r2", "r3"];
    L.l3 = ["r2", "r1", "r3"];

    R.r1 = ["l2", "l1", "l3"];
    R.r2 = ["l1", "l3", "l2"];
    R.r3 = ["l1", "l2", "l3"];
  }

  return { L, R };
}


// ─────────────────────────────────────────────────
// PREFERENCE EDITOR
// ─────────────────────────────────────────────────

function renderPreferenceEditor() {
  const root =
    document.getElementById("gs-pref-grid");

  root.innerHTML = "";

  renderSidePreferences(root, "L");
  renderSidePreferences(root, "R");
}


function renderSidePreferences(root, side) {
  const heading = document.createElement("div");

  heading.textContent =
    side === "L"
      ? "L — proposers"
      : "R — receivers";

  heading.style.cssText = `
    font-size:13.5px;
    font-weight:700;
    color:var(--text-muted);
    font-family:var(--mono);
    margin-top:6px;
    margin-bottom:2px;
  `;

  root.appendChild(heading);

  for (
    const [party, list]
    of Object.entries(preferences[side])
  ) {
    const row = document.createElement("div");
    row.className = "pref-row";

    const label = document.createElement("div");
    label.className = "pref-party";
    label.textContent = prettyParty(party);

    const listElement =
      document.createElement("div");

    listElement.className = "pref-list";

    list.forEach((candidate, index) => {
      const chip = document.createElement("div");

      chip.className = "pref-chip";
      chip.textContent = prettyParty(candidate);

      chip.dataset.side = side;
      chip.dataset.party = party;
      chip.dataset.index = index;

      chip.addEventListener(
        "click",
        () => preferenceChipClicked(chip)
      );

      listElement.appendChild(chip);
    });

    row.appendChild(label);
    row.appendChild(listElement);

    root.appendChild(row);
  }
}

function updatePreferenceHint(html) {
  const hint =
    document.getElementById("gs-pref-hint");

  if (!hint) {
    console.warn(
      "Preference hint element #gs-pref-hint not found."
    );

    return;
  }

  hint.innerHTML = html;
}
/*
 * Editing rule:
 *
 * click first chip
 * click second chip in SAME preference list
 * => swap them
 */
function preferenceChipClicked(chip) {
  const current = {
    side: chip.dataset.side,
    party: chip.dataset.party,
    index: Number(chip.dataset.index),
    element: chip,
  };

  const candidate =
    preferences[current.side]
      [current.party]
      [current.index];


  /* ------------------------------------------------
     First selection
     ------------------------------------------------ */

  if (!selectedPreference) {
    selectedPreference = current;

    chip.classList.add("selected");

    updatePreferenceHint(`
      <span class="hint-icon">✓</span>

      <span>
        <strong>${prettyParty(candidate)}</strong>
        selected in
        <strong>${prettyParty(current.party)}</strong>.
        Now select another entry in the same row.
      </span>
    `);

    return;
  }


  /* ------------------------------------------------
     Same preference list → swap
     ------------------------------------------------ */

  const sameList =
    selectedPreference.side === current.side &&
    selectedPreference.party === current.party;


  if (sameList) {
    const list =
      preferences[current.side][current.party];

    const a =
      selectedPreference.index;

    const b =
      current.index;

    const firstValue =
      list[a];

    const secondValue =
      list[b];


    [list[a], list[b]] =
      [list[b], list[a]];


    selectedPreference = null;

    renderPreferenceEditor();

    gsReset();


    updatePreferenceHint(`
      <span class="hint-icon">↔</span>

      <span>
        Swapped
        <strong>${prettyParty(firstValue)}</strong>
        and
        <strong>${prettyParty(secondValue)}</strong>.
        Click two entries to reorder again.
      </span>
    `);

    return;
  }


  /* ------------------------------------------------
     Different row → change selection
     ------------------------------------------------ */

  selectedPreference.element
    .classList.remove("selected");

  selectedPreference = current;

  chip.classList.add("selected");


  updatePreferenceHint(`
    <span class="hint-icon">✓</span>

    <span>
      <strong>${prettyParty(candidate)}</strong>
      selected in
      <strong>${prettyParty(current.party)}</strong>.
      Select another entry in this row.
    </span>
  `);
}


// ─────────────────────────────────────────────────
// RANDOMIZE
// ─────────────────────────────────────────────────

export function gsRandomize() {
  for (const side of ["L", "R"]) {
    for (
      const party
      of Object.keys(preferences[side])
    ) {
      preferences[side][party] =
        shuffle([...preferences[side][party]]);
    }
  }

  renderPreferenceEditor();
  gsReset();
}


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }

  return array;
}


// ─────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────

export function gsRun() {
  execution =
    runGaleShapley(preferences);

  currentRound = -1;

  document.getElementById("gs-placeholder")
    .style.display = "none";

  document.getElementById("gs-step")
    .disabled = false;

  document.getElementById("gs-trace")
    .innerHTML = `
      <span class="t-info">
        Execution initialized.
        ${execution.rounds.length} rounds generated.
      </span>
    `;

  renderGraph([]);

  gsStep();
}


// ─────────────────────────────────────────────────
// STEP
// ─────────────────────────────────────────────────

export function gsStep() {
  if (!execution) return;

  if (
    currentRound + 1 >=
    execution.rounds.length
  ) {
    return;
  }

  currentRound += 1;

  const round =
    execution.rounds[currentRound];

  renderRound(round);

  document.getElementById("gs-step-n")
    .textContent =
      `${currentRound + 1} / ${execution.rounds.length}`;

  if (
    currentRound ===
    execution.rounds.length - 1
  ) {
    document.getElementById("gs-step")
      .disabled = true;

    appendTrace(`
      <span class="t-match">
        Final matching:
        ${formatMatching(execution.matching)}
      </span>
    `);
  }
}


function renderRound(round) {
  const proposals =
    round.events.filter(
      event => event.type === "proposal"
    );

  const accepts =
    round.events.filter(
      event => event.type === "accept"
    );

  const replacements =
    round.events.filter(
      event => event.type === "replace"
    );

  const rejections =
    round.events.filter(
      event => event.type === "reject"
    );


  const proposalText =
    proposals.length > 0
      ? proposals
          .map(
            event =>
              `${prettyParty(event.proposer)} → ${prettyParty(event.receiver)}`
          )
          .join(" · ")
      : "—";


  const acceptedText = [
    ...accepts.map(
      event =>
        `${prettyParty(event.receiver)} ← ${prettyParty(event.proposer)}`
    ),

    ...replacements.map(
      event =>
        `${prettyParty(event.receiver)}: ${prettyParty(event.previous)} → ${prettyParty(event.proposer)}`
    ),
  ].join(" · ") || "—";


  const rejectedText =
    rejections.length > 0
      ? rejections
          .map(
            event =>
              `${prettyParty(event.receiver)} ✕ ${prettyParty(event.proposer)}`
          )
          .join(" · ")
      : "—";


  appendTrace(`
    <div class="trace-round-card">

      <div class="trace-round-title">
        ROUND ${round.round}
      </div>

      <div class="trace-row">
        <span class="trace-label">
          Proposals
        </span>

        <span class="trace-value proposal">
          ${proposalText}
        </span>
      </div>

      <div class="trace-row">
        <span class="trace-label">
          Accepted
        </span>

        <span class="trace-value accept">
          ${acceptedText}
        </span>
      </div>

      <div class="trace-row">
        <span class="trace-label">
          Rejected
        </span>

        <span class="trace-value reject">
          ${rejectedText}
        </span>
      </div>

      <div class="trace-row">
        <span class="trace-label">
          Matching
        </span>

        <span class="trace-value match">
          ${formatMatching(round.matching)}
        </span>
      </div>

    </div>
  `);

  renderGraph(
    round.matching,
    round.events
  );
}


// ─────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────

export function gsReset() {
  execution = null;
  currentRound = -1;

  document.getElementById("gs-placeholder")
    .style.display = "flex";

  document.getElementById("gs-trace")
    .innerHTML =
      `<span class="trace-empty">
         Trace will appear here after running.
       </span>`;

  document.getElementById("gs-step-n")
    .textContent = "—";

  document.getElementById("gs-step")
    .disabled = true;

  renderGraph([]);
}


// ─────────────────────────────────────────────────
// TRACE
// ─────────────────────────────────────────────────

function appendTrace(html) {
  const trace =
    document.getElementById("gs-trace");

  const empty =
    trace.querySelector(".trace-empty");

  if (empty) {
    trace.innerHTML = "";
  }

  trace.insertAdjacentHTML(
    "beforeend",
    html
  );

  trace.scrollTop =
    trace.scrollHeight;
}


// ─────────────────────────────────────────────────
// SVG
// ─────────────────────────────────────────────────

function renderGraph(
  matching,
  events = []
) {
  const svg =
    document.getElementById("gs-svg");

  const rootStyle =
    getComputedStyle(
      document.documentElement
    );

  const colorL =
    rootStyle
      .getPropertyValue("--party-l")
      .trim();

  const colorR =
    rootStyle
      .getPropertyValue("--party-r")
      .trim();

  const proposalColor =
    rootStyle
      .getPropertyValue("--proposal")
      .trim();

  const matchingColor =
    rootStyle
      .getPropertyValue("--matching")
      .trim();


  const partiesL =
    Object.keys(preferences.L);

  const partiesR =
    Object.keys(preferences.R);

  const k = partiesL.length;


  svg.innerHTML = "";

  svg.setAttribute(
    "viewBox",
    "0 0 760 420"
  );


  /* ------------------------------------------------
     Column labels
     ------------------------------------------------ */

  drawText(
    svg,
    165,
    35,
    "L — PROPOSERS",
    {
      fill: colorL,
      size: 14,
      weight: 800,
    }
  );

  drawText(
    svg,
    595,
    35,
    "R — RECEIVERS",
    {
      fill: colorR,
      size: 14,
      weight: 800,
    }
  );


  /* ------------------------------------------------
     Party positions
     ------------------------------------------------ */

  const positions = {};

  const leftX = 170;
  const rightX = 590;

  const top = 95;
  const bottom = 350;

  const spacing =
    k === 1
      ? 0
      : (bottom - top) / (k - 1);


  partiesL.forEach(
    (party, index) => {
      positions[party] = {
        x: leftX,
        y: top + index * spacing,
      };
    }
  );


  partiesR.forEach(
    (party, index) => {
      positions[party] = {
        x: rightX,
        y: top + index * spacing,
      };
    }
  );


  /* ------------------------------------------------
     Current proposals
     ------------------------------------------------ */

  const proposals =
    events.filter(
      event => event.type === "proposal"
    );


  for (const proposal of proposals) {
    const from =
      positions[proposal.proposer];

    const to =
      positions[proposal.receiver];

    svg.appendChild(
      svgElement(
        "line",
        {
          x1: from.x + 30,
          y1: from.y,

          x2: to.x - 30,
          y2: to.y,

          stroke: proposalColor,

          "stroke-width": 2,

          "stroke-dasharray": "7 6",

          opacity: 0.75,
        }
      )
    );
  }


  /* ------------------------------------------------
     Matching edges
     ------------------------------------------------ */

  for (const pair of matching) {
    const from =
      positions[pair.proposer];

    const to =
      positions[pair.receiver];

    svg.appendChild(
      svgElement(
        "line",
        {
          x1: from.x + 30,
          y1: from.y,

          x2: to.x - 30,
          y2: to.y,

          stroke: matchingColor,

          "stroke-width": 5,

          "stroke-linecap": "round",
        }
      )
    );
  }


  /* ------------------------------------------------
     Nodes
     ------------------------------------------------ */

  for (
    const [party, position]
    of Object.entries(positions)
  ) {
    const isLeft =
      party.startsWith("l");

    const fill =
      isLeft
        ? colorL
        : colorR;


    const circle =
      svgElement(
        "circle",
        {
          cx: position.x,
          cy: position.y,

          r: 28,

          fill,

          stroke: "#FFFFFF",

          "stroke-width": 4,
        }
      );


    svg.appendChild(circle);


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
}



function svgElement(tag, attributes) {
  const element =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag
    );

  for (
    const [name, value]
    of Object.entries(attributes)
  ) {
    element.setAttribute(name, value);
  }

  return element;
}


// ─────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────
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

        "text-anchor": "middle",

        "font-family":
          "JetBrains Mono, Fira Code, monospace",

        "font-size": size,

        "font-weight": weight,

        fill,
      }
    );

  element.textContent = text;

  svg.appendChild(element);

  return element;
}

function prettyParty(party) {
  const side = party[0];
  const number = party.slice(1);

  return `${side}${toSubscript(number)}`;
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
    .map(x => digits[x] ?? x)
    .join("");
}


function formatMatching(matching) {
  if (matching.length === 0) {
    return "∅";
  }

  return matching
    .map(
      ({ proposer, receiver }) =>
        `(${prettyParty(proposer)}, ${prettyParty(receiver)})`
    )
    .join(", ");
}
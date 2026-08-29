import { runGaleShapley } from "./gale-shapley.js";

/**
 * Fixed pedagogical trace for Π_bSM in the authenticated bipartite case.
 *
 * Scenario:
 *   k = 3, tL = 0, tR = 1, with r3 Byzantine.
 *
 * This deliberately keeps the execution small. The protocol itself supports
 * the non-trivial authenticated bipartite branch tL < k/3 while R may contain
 * an arbitrary number of Byzantine parties. The symmetric case is omitted
 * from this guided trace.
 */
export function createPiBsmScenario() {
  const reconstructedPreferences = {
    L: {
      l1: ["r1", "r2", "r3"],
      l2: ["r1", "r2", "r3"],
      l3: ["r2", "r1", "r3"],
    },
    R: {
      r1: ["l2", "l1", "l3"],
      r2: ["l1", "l3", "l2"],

      // r3 is Byzantine. This is one admissible value on which the
      // honest L-parties agree through the BA invocation associated with r3.
      // It is NOT presented as r3's truthful preference list.
      r3: ["l1", "l2", "l3"],
    },
  };

  const gsResult = runGaleShapley(reconstructedPreferences);

  const scenario = {
    setting: {
      k: 3,
      topology: "authenticated-bipartite",
      authenticated: true,
      tL: 0,
      tR: 1,
    },

    parties: {
      L: ["l1", "l2", "l3"],
      R: ["r1", "r2", "r3"],
    },

    byzantine: new Set(["r3"]),

    forwardingExample: {
      sender: "l1",
      receiver: "l2",
      relays: ["r1", "r2", "r3"],
      honestRelays: ["r1", "r2"],
      byzantineRelays: ["r3"],
      signedMessage: "m",
      maxDelay: "2Δ",
    },

    reconstruction: {
      parallel: true,

      bb: {
        label: "L preferences",
        senders: ["l1", "l2", "l3"],
        outputs: {
          l1: reconstructedPreferences.L.l1,
          l2: reconstructedPreferences.L.l2,
          l3: reconstructedPreferences.L.l3,
        },
      },

      ba: {
        label: "R preferences",
        senders: ["r1", "r2", "r3"],
        inputs: {
          r1: reconstructedPreferences.R.r1,
          r2: reconstructedPreferences.R.r2,
          r3: reconstructedPreferences.R.r3,
        },
        outputs: {
          r1: reconstructedPreferences.R.r1,
          r2: reconstructedPreferences.R.r2,
          r3: reconstructedPreferences.R.r3,
        },
      },
    },

    reconstructedPreferences,

    // In the fixed trace R contains honest relays, hence the simulated L
    // network has no omissions and the reconstructed profile is complete.
    reconstructedValues: {
      l1: reconstructedPreferences.L.l1,
      l2: reconstructedPreferences.L.l2,
      l3: reconstructedPreferences.L.l3,
      r1: reconstructedPreferences.R.r1,
      r2: reconstructedPreferences.R.r2,
      r3: reconstructedPreferences.R.r3,
    },

    gsResult,
  };

  scenario.hasBottom = Object.values(scenario.reconstructedValues)
    .some(value => value == null || value === "⊥");

  scenario.matching = gsResult.matching;
  scenario.suggestions = createSuggestions(scenario);
  scenario.outputs = createOutputs(scenario);

  return scenario;
}

export const PIBSM_STEPS = Object.freeze([
  {
    number: 1,
    id: "forwarding",
    label: "Authenticated forwarding",
    shortLabel: "Forwarding",
  },
  {
    number: 2,
    id: "parallel-reconstruction",
    label: "BB + BA in parallel",
    shortLabel: "BB + BA",
  },
  {
    number: 3,
    id: "reconstructed-profile",
    label: "Reconstructed σ-values",
    shortLabel: "σ-values",
  },
  {
    number: 4,
    id: "bottom-check",
    label: "Completeness check",
    shortLabel: "σᵥ = ⊥ ?",
  },
  {
    number: 5,
    id: "gale-shapley",
    label: "Local Gale–Shapley",
    shortLabel: "AG-S",
  },
  {
    number: 6,
    id: "suggestions",
    label: "Assignment dissemination",
    shortLabel: "L → R",
  },
  {
    number: 7,
    id: "majority",
    label: "Most common suggestion",
    shortLabel: "R decides",
  },
  {
    number: 8,
    id: "final",
    label: "Final bSM outcome",
    shortLabel: "bSM",
  },
]);

export function getPiBsmStageCount() {
  return PIBSM_STEPS.length;
}

export function getPiBsmStep(stage) {
  if (stage <= 0) return null;
  return PIBSM_STEPS[stage - 1] ?? null;
}

export function evaluatePiBsmProperties(scenario) {
  const honest = getHonestParties(scenario);
  const honestSet = new Set(honest);

  const termination = honest.every(
    party => Object.prototype.hasOwnProperty.call(scenario.outputs, party)
  );

  let symmetry = true;
  for (const party of honest) {
    const partner = scenario.outputs[party];
    if (partner == null || !honestSet.has(partner)) continue;

    if (scenario.outputs[partner] !== party) {
      symmetry = false;
      break;
    }
  }

  let stability = true;
  const honestL = scenario.parties.L.filter(p => honestSet.has(p));
  const honestR = scenario.parties.R.filter(p => honestSet.has(p));

  for (const l of honestL) {
    for (const r of honestR) {
      const lCurrent = scenario.outputs[l] ?? null;
      const rCurrent = scenario.outputs[r] ?? null;

      if (
        prefers(scenario, l, r, lCurrent) &&
        prefers(scenario, r, l, rCurrent)
      ) {
        stability = false;
        break;
      }
    }

    if (!stability) break;
  }

  let nonCompetition = true;
  const claims = new Map();

  for (const party of honest) {
    const target = scenario.outputs[party];
    if (target == null) continue;

    if (!claims.has(target)) claims.set(target, []);
    claims.get(target).push(party);
  }

  for (const parties of claims.values()) {
    if (parties.length > 1) {
      nonCompetition = false;
      break;
    }
  }

  return {
    termination,
    symmetry,
    stability,
    nonCompetition,
  };
}

export function matchingAsMap(scenario) {
  const result = {};

  for (const { proposer, receiver } of scenario.matching) {
    result[proposer] = receiver;
    result[receiver] = proposer;
  }

  return result;
}

export function majoritySuggestion(suggestions) {
  const counts = new Map();

  for (const value of Object.values(suggestions)) {
    if (value == null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let winner = null;
  let winnerCount = -1;

  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

function createSuggestions(scenario) {
  const match = matchingAsMap({ matching: scenario.gsResult.matching });
  const suggestions = {};

  for (const r of scenario.parties.R) {
    suggestions[r] = Object.fromEntries(
      scenario.parties.L.map(l => [l, match[r] ?? null])
    );
  }

  return suggestions;
}

function createOutputs(scenario) {
  const match = matchingAsMap({ matching: scenario.gsResult.matching });
  const outputs = {};

  for (const l of scenario.parties.L) {
    outputs[l] = scenario.hasBottom ? null : (match[l] ?? null);
  }

  for (const r of scenario.parties.R) {
    if (scenario.byzantine.has(r)) continue;
    outputs[r] = scenario.hasBottom
      ? null
      : majoritySuggestion(scenario.suggestions[r]);
  }

  return outputs;
}

function getHonestParties(scenario) {
  return [
    ...scenario.parties.L,
    ...scenario.parties.R,
  ].filter(party => !scenario.byzantine.has(party));
}

function prefers(scenario, party, candidate, current) {
  const side = party.startsWith("l") ? "L" : "R";
  const ranking = scenario.reconstructedPreferences[side][party];

  if (current == null) return true;

  return ranking.indexOf(candidate) < ranking.indexOf(current);
}

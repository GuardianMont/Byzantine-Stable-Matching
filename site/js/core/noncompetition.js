/**
 * Minimal counterexample showing why Non-Competition
 * is required in Byzantine Stable Matching.
 *
 * L = {l1, l2}
 * R = {r1, r2}
 *
 * r1 is Byzantine.
 *
 * Honest outputs:
 *   l1 -> r1
 *   l2 -> r1
 *   r2 -> nobody
 *
 * Termination, Symmetry and Stability hold,
 * but Non-Competition is violated.
 */

export function createNonCompetitionScenario() {
  return {
    parties: {
      L: ["l1", "l2"],
      R: ["r1", "r2"],
    },

    byzantine: new Set(["r1"]),

    preferences: {
      L: {
        l1: ["r1", "r2"],
        l2: ["r1", "r2"],
      },

      R: {
        r1: ["l1", "l2"],
        r2: ["l1", "l2"],
      },
    },

    outputs: {
      l1: "r1",
      l2: "r1",
      r2: null,
    },
  };
}


/* ================================================================
   PROPERTY EVALUATION
   ================================================================ */

export function evaluateBsmProperties(scenario) {
  const honest = getHonestParties(scenario);

  return {
    termination:
      evaluateTermination(scenario, honest),

    symmetry:
      evaluateSymmetry(scenario, honest),

    stability:
      evaluateStability(scenario, honest),

    nonCompetition:
      evaluateNonCompetition(scenario, honest),
  };
}


/* ================================================================
   TERMINATION
   ================================================================ */

function evaluateTermination(
  scenario,
  honest
) {
  const satisfied =
    honest.every(
      party =>
        Object.prototype.hasOwnProperty.call(
          scenario.outputs,
          party
        )
    );

  return {
    satisfied,

    explanation:
      satisfied
        ? "Every honest party produces an output."
        : "At least one honest party does not terminate.",
  };
}


/* ================================================================
   SYMMETRY
   ================================================================ */

function evaluateSymmetry(
  scenario,
  honest
) {
  const honestSet =
    new Set(honest);

  for (const party of honest) {
    const partner =
      scenario.outputs[party];

    if (partner === null) {
      continue;
    }

    /*
     * Symmetry only constrains pairs
     * consisting of two honest parties.
     */
    if (!honestSet.has(partner)) {
      continue;
    }

    if (
      scenario.outputs[partner] !== party
    ) {
      return {
        satisfied: false,

        explanation:
          `${party} outputs ${partner}, ` +
          `but ${partner} does not output ${party}.`,
      };
    }
  }

  return {
    satisfied: true,

    explanation:
      "No honest–honest claimed match is asymmetric.",
  };
}


/* ================================================================
   STABILITY
   ================================================================ */

function evaluateStability(
  scenario,
  honest
) {
  const honestSet =
    new Set(honest);

  const honestL =
    scenario.parties.L.filter(
      party => honestSet.has(party)
    );

  const honestR =
    scenario.parties.R.filter(
      party => honestSet.has(party)
    );


  for (const l of honestL) {
    for (const r of honestR) {
      const lCurrent =
        scenario.outputs[l] ?? null;

      const rCurrent =
        scenario.outputs[r] ?? null;


      const lPrefersR =
        prefers(
          scenario,
          l,
          r,
          lCurrent
        );

      const rPrefersL =
        prefers(
          scenario,
          r,
          l,
          rCurrent
        );


      if (
        lPrefersR &&
        rPrefersL
      ) {
        return {
          satisfied: false,

          explanation:
            `${l} and ${r} form an honest blocking pair.`,
        };
      }
    }
  }


  return {
    satisfied: true,

    explanation:
      "No blocking pair consists entirely of honest parties.",
  };
}


/* ================================================================
   NON-COMPETITION
   ================================================================ */

function evaluateNonCompetition(
  scenario,
  honest
) {
  const claims =
    new Map();


  for (const party of honest) {
    const output =
      scenario.outputs[party];

    if (output === null) {
      continue;
    }


    if (!claims.has(output)) {
      claims.set(
        output,
        []
      );
    }

    claims
      .get(output)
      .push(party);
  }


  for (
    const [target, parties]
    of claims.entries()
  ) {
    if (parties.length > 1) {
      return {
        satisfied: false,

        explanation:
          `${parties.join(" and ")} are distinct honest parties ` +
          `but both output ${target}.`,
      };
    }
  }


  return {
    satisfied: true,

    explanation:
      "No two honest parties output the same party.",
  };
}


/* ================================================================
   HELPERS
   ================================================================ */

function getHonestParties(
  scenario
) {
  return [
    ...scenario.parties.L,
    ...scenario.parties.R,
  ].filter(
    party =>
      !scenario.byzantine.has(party)
  );
}


function prefers(
  scenario,
  party,
  candidate,
  current
) {
  const side =
    party.startsWith("l")
      ? "L"
      : "R";

  const ranking =
    scenario.preferences[side][party];


  /*
   * Nobody is considered worse than
   * every valid candidate.
   */
  if (current === null) {
    return true;
  }


  return (
    ranking.indexOf(candidate) <
    ranking.indexOf(current)
  );
}
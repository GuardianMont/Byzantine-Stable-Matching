/**
 * Fixed indistinguishability construction based on
 * the k = 3 fully-connected unauthenticated lower-bound
 * proof.
 *
 * Original parties:
 *
 *   L = {a, b, c}
 *   R = {u, v, w}
 *
 * Fault budget:
 *
 *   tL = 1
 *   tR = 1
 *
 * The proof introduces two virtual copies of each party
 * and compares three executions whose local views force
 * incompatible decisions.
 */


/* ================================================================
   SCENARIO
   ================================================================ */

export function createIndistinguishabilityScenario() {
  return {
    setting: {
      k: 3,

      topology:
        "fully-connected",

      authenticated:
        false,

      tL: 1,
      tR: 1,
    },


    original: {
      L: ["a", "b", "c"],
      R: ["u", "v", "w"],
    },


    duplicated: {
      L: [
        "a1",
        "b1",
        "c1",

        "a2",
        "b2",
        "c2",
      ],

      R: [
        "u1",
        "v1",
        "w1",

        "u2",
        "v2",
        "w2",
      ],

      /*
       * Only the favorites relevant to the
       * proof need to be fixed.
       */
      mutualFavorites: [
        ["c1", "v1"],
        ["a2", "v2"],
      ],
    },


    executions: {

      /*
       * Execution A
       *
       * Honest:
       *   a2, b2, u2, v2
       *
       * Byzantine parties c and w simulate
       * the remaining virtual nodes.
       *
       * Since a2 and v2 are mutual favorites,
       * simplified stability forces them to match.
       */

      A: {
        key: "A",

        honest: [
          "a2",
          "b2",
          "u2",
          "v2",
        ],

        simulators: [
          "c",
          "w",
        ],

        forcedMatches: [
          ["a2", "v2"],
        ],

        reason: {
          type:
            "simplified-stability",

          parties: [
            "a2",
            "v2",
          ],
        },
      },


      /*
       * Execution B
       *
       * Honest:
       *   b1, c1, v1, w1
       *
       * Byzantine parties a and u simulate
       * the remaining virtual nodes.
       *
       * Since c1 and v1 are mutual favorites,
       * simplified stability forces them to match.
       */

      B: {
        key: "B",

        honest: [
          "b1",
          "c1",
          "v1",
          "w1",
        ],

        simulators: [
          "a",
          "u",
        ],

        forcedMatches: [
          ["c1", "v1"],
        ],

        reason: {
          type:
            "simplified-stability",

          parties: [
            "c1",
            "v1",
          ],
        },
      },


      /*
       * Execution C
       *
       * Honest:
       *   c1, a2, u2, w1
       *
       * Byzantine parties b and v simulate
       * the remaining nodes.
       *
       * a2 cannot distinguish C from A.
       * c1 cannot distinguish C from B.
       *
       * Therefore they preserve their decisions.
       *
       * In this normal execution v1 and v2 are
       * simulations of the SAME Byzantine party v.
       */

      C: {
        key: "C",

        honest: [
          "c1",
          "a2",
          "u2",
          "w1",
        ],

        simulators: [
          "b",
          "v",
        ],

        indistinguishability: [
          {
            party: "a2",
            sameViewAs: "A",
          },

          {
            party: "c1",
            sameViewAs: "B",
          },
        ],

        inheritedVirtualMatches: [
          ["a2", "v2"],
          ["c1", "v1"],
        ],

        collapsedParties: {
          v1: "v",
          v2: "v",
        },

        outputs: {
          a2: "v",
          c1: "v",
        },
      },
    },
  };
}


/* ================================================================
   ACCESSORS
   ================================================================ */

export function getExecution(
  scenario,
  key
) {
  const execution =
    scenario.executions[key];

  if (!execution) {
    throw new Error(
      `Unknown indistinguishability execution: ${key}`
    );
  }

  return execution;
}


/* ================================================================
   FINAL CONTRADICTION
   ================================================================ */

export function evaluateIndistinguishabilityContradiction(
  scenario
) {
  const execution =
    getExecution(
      scenario,
      "C"
    );

  const honest =
    new Set(
      execution.honest
    );

  const claims =
    new Map();


  for (
    const [party, target]
    of Object.entries(
      execution.outputs
    )
  ) {
    if (!honest.has(party)) {
      continue;
    }

    if (!claims.has(target)) {
      claims.set(
        target,
        []
      );
    }

    claims
      .get(target)
      .push(party);
  }


  for (
    const [target, parties]
    of claims.entries()
  ) {
    if (parties.length > 1) {
      return {
        contradiction: true,

        violatedProperty:
          "non-competition",

        witnesses:
          parties,

        target,

        explanation:
          `${parties.join(" and ")} are honest, ` +
          `but both are forced to output ${target}.`,
      };
    }
  }


  return {
    contradiction: false,

    violatedProperty:
      null,

    witnesses:
      [],

    target:
      null,

    explanation:
      "No contradiction was found.",
  };
}


/* ================================================================
   STATUS HELPERS
   ================================================================ */

export function getVirtualPartyStatus(
  scenario,
  executionKey,
  party
) {
  const execution =
    getExecution(
      scenario,
      executionKey
    );


  if (
    execution.honest.includes(
      party
    )
  ) {
    return "honest";
  }


  return "simulated";
}


export function getSimulatedParties(
  scenario,
  executionKey
) {
  const execution =
    getExecution(
      scenario,
      executionKey
    );


  const all = [
    ...scenario.duplicated.L,
    ...scenario.duplicated.R,
  ];


  return all.filter(
    party =>
      !execution.honest.includes(
        party
      )
  );
}


/* ================================================================
   PARTY HELPERS
   ================================================================ */

export function getPartySide(
  party
) {
  const base =
    getBaseParty(
      party
    );

  if (
    ["a", "b", "c"].includes(
      base
    )
  ) {
    return "L";
  }

  if (
    ["u", "v", "w"].includes(
      base
    )
  ) {
    return "R";
  }


  throw new Error(
    `Unknown party: ${party}`
  );
}


export function getBaseParty(
  party
) {
  return String(party)
    .replace(
      /\d+$/,
      ""
    );
}
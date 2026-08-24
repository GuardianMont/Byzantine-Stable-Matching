/**
 * Gale-Shapley / Deferred Acceptance.
 *
 * L is the proposing side.
 *
 * preferences = {
 *   L: {
 *     l1: ["r1", "r2", "r3"],
 *     l2: ["r1", "r3", "r2"],
 *     ...
 *   },
 *   R: {
 *     r1: ["l2", "l1", "l3"],
 *     ...
 *   }
 * }
 */

export function runGaleShapley(preferences) {
  validatePreferences(preferences);

  const proposers = Object.keys(preferences.L);
  const receivers = Object.keys(preferences.R);

  // receiver -> proposer currently held
  const heldBy = Object.fromEntries(
    receivers.map(receiver => [receiver, null])
  );

  // proposer -> next preference index
  const nextChoice = Object.fromEntries(
    proposers.map(proposer => [proposer, 0])
  );

  const rounds = [];
  let roundNumber = 0;

  while (true) {
    const matchedProposers = new Set(
      Object.values(heldBy).filter(Boolean)
    );

    const activeProposers = proposers.filter(proposer => {
      return (
        !matchedProposers.has(proposer) &&
        nextChoice[proposer] < preferences.L[proposer].length
      );
    });

    if (activeProposers.length === 0) {
      break;
    }

    roundNumber += 1;

    const events = [];
    const proposals = {};

    // ──────────────────────────────────────────────
    // Phase 1: unmatched proposers send proposals
    // ──────────────────────────────────────────────

    for (const proposer of activeProposers) {
      const preferenceIndex = nextChoice[proposer];
      const receiver =
        preferences.L[proposer][preferenceIndex];

      nextChoice[proposer] += 1;

      if (!proposals[receiver]) {
        proposals[receiver] = [];
      }

      proposals[receiver].push(proposer);

      events.push({
        type: "proposal",
        proposer,
        receiver,
      });
    }

    // ──────────────────────────────────────────────
    // Phase 2: receivers select best proposal
    // ──────────────────────────────────────────────

    for (const receiver of receivers) {
      const candidates = [
        ...(proposals[receiver] ?? []),
      ];

      if (heldBy[receiver] !== null) {
        candidates.push(heldBy[receiver]);
      }

      if (candidates.length === 0) {
        continue;
      }

      const ranking = preferences.R[receiver];

      candidates.sort(
        (a, b) =>
          ranking.indexOf(a) - ranking.indexOf(b)
      );

      const winner = candidates[0];
      const previous = heldBy[receiver];

      heldBy[receiver] = winner;

      if (previous !== winner) {
        events.push({
          type: previous === null ? "accept" : "replace",
          receiver,
          proposer: winner,
          previous,
        });
      }

      for (const rejected of candidates.slice(1)) {
        if (
          rejected === previous &&
          winner !== previous
        ) {
          events.push({
            type: "reject",
            receiver,
            proposer: rejected,
            reason: "replaced",
          });
        } else if (rejected !== previous) {
          events.push({
            type: "reject",
            receiver,
            proposer: rejected,
            reason: "proposal-rejected",
          });
        }
      }
    }

    rounds.push({
      round: roundNumber,
      events,
      matching: matchingSnapshot(heldBy),
    });
  }

  return {
    rounds,
    matching: matchingSnapshot(heldBy),
  };
}


function matchingSnapshot(heldBy) {
  return Object.entries(heldBy)
    .filter(([, proposer]) => proposer !== null)
    .map(([receiver, proposer]) => ({
      proposer,
      receiver,
    }));
}


function validatePreferences(preferences) {
  if (!preferences?.L || !preferences?.R) {
    throw new Error(
      "Preferences must contain both L and R."
    );
  }

  const L = Object.keys(preferences.L);
  const R = Object.keys(preferences.R);

  if (L.length !== R.length) {
    throw new Error(
      "L and R must contain the same number of parties."
    );
  }

  for (const proposer of L) {
    validatePermutation(
      preferences.L[proposer],
      R,
      `Preference list of ${proposer}`
    );
  }

  for (const receiver of R) {
    validatePermutation(
      preferences.R[receiver],
      L,
      `Preference list of ${receiver}`
    );
  }
}


function validatePermutation(list, expected, label) {
  if (!Array.isArray(list)) {
    throw new Error(`${label} must be an array.`);
  }

  if (list.length !== expected.length) {
    throw new Error(
      `${label} must contain every party exactly once.`
    );
  }

  const actual = new Set(list);

  if (
    actual.size !== expected.length ||
    !expected.every(x => actual.has(x))
  ) {
    throw new Error(
      `${label} is not a complete preference permutation.`
    );
  }
}
"""
stable_matching.py
==================
Core data structures and the Gale-Shapley deferred-acceptance algorithm.

Classes
-------
Party       : a single agent with a preference list
Matching    : a collection of (left, right) pairs

Functions
---------
GaleShapley(left, right)  -> Matching
is_stable(matching)       -> bool
blocking_pairs(matching)  -> list[tuple[Party, Party]]
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import copy


# ---------------------------------------------------------------------------
# Party
# ---------------------------------------------------------------------------

@dataclass
class Party:
    """
    A single participant in the stable matching instance.

    Parameters
    ----------
    name : str
        Human-readable identifier, e.g. "l1" or "r2".
    side : str
        Either "L" (left / proposer) or "R" (right / receiver).
    preferences : list[str]
        Ordered list of names of parties on the opposite side,
        from most to least preferred.  Must be complete (all
        opposite-side parties appear exactly once).
    is_byzantine : bool
        If True, this party's preference list may be unreliable.
        The Gale-Shapley algorithm treats Byzantine parties as
        honest; Byzantine behaviour is handled by AdversaryModel.

    Attributes
    ----------
    _proposal_index : int
        Index into preferences tracking the next party to propose to.
        Used internally by GaleShapley; reset to 0 before each run.
    _current_match : Optional[str]
        Name of current provisional partner (None = unmatched).
    """
    name: str
    side: str                        # "L" or "R"
    preferences: list[str]
    is_byzantine: bool = False

    # internal state — reset before each GS run
    _proposal_index: int = field(default=0, init=False, repr=False)
    _current_match: Optional[str] = field(default=None, init=False, repr=False)

    def reset(self) -> None:
        """Reset internal state for a fresh Gale-Shapley run."""
        self._proposal_index = 0
        self._current_match = None

    def next_proposal(self) -> Optional[str]:
        """
        Return the name of the next party to propose to, or None if
        the preference list is exhausted.
        """
        if self._proposal_index < len(self.preferences):
            target = self.preferences[self._proposal_index]
            self._proposal_index += 1
            return target
        return None

    def prefers(self, candidate: str, over: str) -> bool:
        """
        Return True if this party prefers *candidate* over *over*.
        Both must appear in self.preferences.
        """
        prefs = self.preferences
        try:
            return prefs.index(candidate) < prefs.index(over)
        except ValueError as exc:
            raise ValueError(
                f"{self.name}: '{candidate}' or '{over}' not in preference list"
            ) from exc

    def rank(self, name: str) -> int:
        """Return the 0-based rank of *name* in this party's preference list."""
        try:
            return self.preferences.index(name)
        except ValueError as exc:
            raise ValueError(f"{self.name}: '{name}' not in preference list") from exc

    def __repr__(self) -> str:
        tag = "[B]" if self.is_byzantine else ""
        return f"Party({self.name}{tag}, prefs={self.preferences})"


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

class Matching:
    """
    A collection of (left_name, right_name) pairs representing an
    assignment between parties on opposite sides.

    Invariant: each party name appears at most once (uniqueness condition).
    """

    def __init__(self) -> None:
        self._pairs: list[tuple[str, str]] = []
        self._left_to_right: dict[str, str] = {}
        self._right_to_left: dict[str, str] = {}

    # ------------------------------------------------------------------
    # Mutation
    # ------------------------------------------------------------------

    def add(self, left: str, right: str) -> None:
        """Add pair (left, right).  Raises if either name is already matched."""
        if left in self._left_to_right:
            raise ValueError(f"Left party '{left}' is already matched.")
        if right in self._right_to_left:
            raise ValueError(f"Right party '{right}' is already matched.")
        self._pairs.append((left, right))
        self._left_to_right[left] = right
        self._right_to_left[right] = left

    def remove_by_left(self, left: str) -> Optional[str]:
        """Remove the pair containing *left*.  Returns the former partner or None."""
        if left not in self._left_to_right:
            return None
        right = self._left_to_right.pop(left)
        self._right_to_left.pop(right, None)
        self._pairs = [(l, r) for l, r in self._pairs if l != left]
        return right

    def remove_by_right(self, right: str) -> Optional[str]:
        """Remove the pair containing *right*.  Returns the former partner or None."""
        if right not in self._right_to_left:
            return None
        left = self._right_to_left.pop(right)
        self._left_to_right.pop(left, None)
        self._pairs = [(l, r) for l, r in self._pairs if r != right]
        return left

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def partner_of_left(self, left: str) -> Optional[str]:
        return self._left_to_right.get(left)

    def partner_of_right(self, right: str) -> Optional[str]:
        return self._right_to_left.get(right)

    def partner_of(self, name: str, side: str) -> Optional[str]:
        """Convenience: side is 'L' or 'R'."""
        if side == "L":
            return self.partner_of_left(name)
        return self.partner_of_right(name)

    def is_matched(self, name: str, side: str) -> bool:
        return self.partner_of(name, side) is not None

    def pairs(self) -> list[tuple[str, str]]:
        return list(self._pairs)

    def __len__(self) -> int:
        return len(self._pairs)

    def __repr__(self) -> str:
        pairs_str = ", ".join(f"({l},{r})" for l, r in sorted(self._pairs))
        return f"Matching([{pairs_str}])"


# ---------------------------------------------------------------------------
# Gale-Shapley deferred acceptance
# ---------------------------------------------------------------------------

@dataclass
class _GSRound:
    """Record of one proposal step — used to reconstruct execution history."""
    round_number: int
    proposer: str
    proposed_to: str
    outcome: str          # "accepted", "rejected", "displaced"
    displaced: Optional[str] = None   # previous holder if displaced


def GaleShapley(
    left_parties: list[Party],
    right_parties: list[Party],
    *,
    verbose: bool = False,
) -> tuple[Matching, list[_GSRound]]:
    """
    Gale-Shapley deferred-acceptance algorithm.

    The parties in *left_parties* act as *proposers*; parties in
    *right_parties* act as *receivers*.  Returns the proposer-optimal
    stable matching.

    Parameters
    ----------
    left_parties  : list of Party objects (side == "L")
    right_parties : list of Party objects (side == "R")
    verbose       : if True, print a human-readable trace

    Returns
    -------
    matching : Matching
        The stable matching produced by the algorithm.
    history  : list[_GSRound]
        Ordered list of proposal events for step-by-step replay.

    Complexity
    ----------
    O(k^2) proposals where k = len(left_parties) = len(right_parties).

    Notes
    -----
    The function resets the internal state of all Party objects before
    running, so the same Party instances can be reused across calls.
    """
    # --- validation -------------------------------------------------------
    if len(left_parties) != len(right_parties):
        raise ValueError("Both sides must have the same number of parties.")
    k = len(left_parties)
    left_names  = {p.name for p in left_parties}
    right_names = {p.name for p in right_parties}

    for p in left_parties:
        if p.side != "L":
            raise ValueError(f"Party {p.name} has side={p.side!r}, expected 'L'.")
        missing = set(p.preferences) - right_names
        if missing:
            raise ValueError(
                f"Party {p.name} preferences contain unknown names: {missing}"
            )
        if len(p.preferences) != k:
            raise ValueError(
                f"Party {p.name} preference list length {len(p.preferences)} != k={k}"
            )

    for p in right_parties:
        if p.side != "R":
            raise ValueError(f"Party {p.name} has side={p.side!r}, expected 'R'.")
        missing = set(p.preferences) - left_names
        if missing:
            raise ValueError(
                f"Party {p.name} preferences contain unknown names: {missing}"
            )
        if len(p.preferences) != k:
            raise ValueError(
                f"Party {p.name} preference list length {len(p.preferences)} != k={k}"
            )

    # --- reset state ------------------------------------------------------
    for p in left_parties + right_parties:
        p.reset()

    right_index: dict[str, Party] = {p.name: p for p in right_parties}
    left_index:  dict[str, Party] = {p.name: p for p in left_parties}

    # current provisional matching (receiver -> proposer name)
    holder: dict[str, Optional[str]] = {p.name: None for p in right_parties}

    history: list[_GSRound] = []
    round_num = 0

    # --- main loop --------------------------------------------------------
    while True:
        # find any unmatched proposer that still has someone to propose to
        free_proposers = [
            p for p in left_parties
            if p._current_match is None and p._proposal_index < len(p.preferences)
        ]
        if not free_proposers:
            break

        for proposer in free_proposers:
            target_name = proposer.next_proposal()
            if target_name is None:
                continue
            receiver = right_index[target_name]
            round_num += 1

            current_holder_name = holder[receiver.name]

            if current_holder_name is None:
                # receiver is free — accept immediately
                holder[receiver.name] = proposer.name
                proposer._current_match = receiver.name
                receiver._current_match = proposer.name
                outcome = "accepted"
                displaced = None
                if verbose:
                    print(f"Round {round_num}: {proposer.name} → {receiver.name} [ACCEPTED]")

            elif receiver.prefers(proposer.name, current_holder_name):
                # receiver prefers new proposer — displace old one
                old_proposer = left_index[current_holder_name]
                old_proposer._current_match = None
                holder[receiver.name] = proposer.name
                proposer._current_match = receiver.name
                receiver._current_match = proposer.name
                outcome = "displaced"
                displaced = current_holder_name
                if verbose:
                    print(
                        f"Round {round_num}: {proposer.name} → {receiver.name} "
                        f"[DISPLACED {current_holder_name}]"
                    )
            else:
                # receiver prefers current holder — reject new proposer
                outcome = "rejected"
                displaced = None
                if verbose:
                    print(f"Round {round_num}: {proposer.name} → {receiver.name} [REJECTED]")

            history.append(_GSRound(
                round_number=round_num,
                proposer=proposer.name,
                proposed_to=receiver.name,
                outcome=outcome,
                displaced=displaced,
            ))

    # --- build Matching ---------------------------------------------------
    matching = Matching()
    for receiver in right_parties:
        h = holder[receiver.name]
        if h is not None:
            matching.add(h, receiver.name)

    return matching, history


# ---------------------------------------------------------------------------
# Stability checking
# ---------------------------------------------------------------------------

def blocking_pairs(
    matching: Matching,
    left_parties: list[Party],
    right_parties: list[Party],
) -> list[tuple[str, str]]:
    """
    Return all blocking pairs (l_name, r_name) in *matching*.

    A pair (u, v) with u in L, v in R is blocking if:
      - u prefers v over M(u), and
      - v prefers u over M(v).

    Unmatched parties are treated as preferring any partner over
    being alone (standard assumption in complete-list SM).

    Parameters
    ----------
    matching      : the matching to check
    left_parties  : list of Party (side "L")
    right_parties : list of Party (side "R")

    Returns
    -------
    list of (left_name, right_name) tuples — empty if matching is stable.
    """
    right_index = {p.name: p for p in right_parties}
    left_index  = {p.name: p for p in left_parties}
    blockers: list[tuple[str, str]] = []

    for l in left_parties:
        l_partner = matching.partner_of_left(l.name)   # may be None
        for r_name in l.preferences:
            if l_partner == r_name:
                continue   # already matched together
            r = right_index[r_name]
            r_partner = matching.partner_of_right(r_name)  # may be None

            # l prefers r over l_partner?
            l_prefers = (
                l_partner is None
                or l.prefers(r_name, l_partner)
            )
            # r prefers l over r_partner?
            r_prefers = (
                r_partner is None
                or r.prefers(l.name, r_partner)
            )

            if l_prefers and r_prefers:
                blockers.append((l.name, r_name))

    return blockers


def is_stable(
    matching: Matching,
    left_parties: list[Party],
    right_parties: list[Party],
) -> bool:
    """Return True iff *matching* contains no blocking pair."""
    return len(blocking_pairs(matching, left_parties, right_parties)) == 0
# -*- coding: utf-8 -*-
"""The two things this kit COMPUTES rather than trusts, in one place.

build-lessons.py refuses content that breaks them and check-coverage.py
re-checks the shipped pages against them. Both import from here, so the
builder and the gate cannot drift apart - the same rule the topic index and
the narration hashes keep elsewhere in this repo (one definition, shared by
the builder and the gate).

  run_robot     Robo's Bee-Bot rules. Forward and Backwards move one square
                the way Robo is FACING; Turn left and Turn right spin on the
                spot. A wall or the edge is a bump and the program stops. The
                JS in lib/computing.js applies the same rules on screen; a
                content module's authored `solution` must reach the target
                here or the page is not built.
  table_answer  What a data-table question is really asking, computed from
                the rows: the most, the fewest, how many of one, whether any.
                An authored key that disagrees is refused, which is the same
                stance the Mathematics answer-key gate takes - computed beats
                claimed.
"""

DIRS = {"up": (0, -1), "right": (1, 0), "down": (0, 1), "left": (-1, 0)}
TURN_L = {"up": "left", "left": "down", "down": "right", "right": "up"}
TURN_R = {"up": "right", "right": "down", "down": "left", "left": "up"}
COMMANDS = {"F": "Forward", "B": "Backwards", "L": "Turn left", "R": "Turn right"}


def run_robot(level, program, rows, cols):
    """Where Robo stops as [col, row], or None if the program bumps."""
    c, r = level["start"]
    facing = level["facing"]
    walls = {tuple(w) for w in level.get("walls", [])}
    for cmd in program:
        if cmd == "L":
            facing = TURN_L[facing]
        elif cmd == "R":
            facing = TURN_R[facing]
        elif cmd in ("F", "B"):
            dc, dr = DIRS[facing]
            sign = 1 if cmd == "F" else -1
            nc, nr = c + dc * sign, r + dr * sign
            if not (0 <= nc < cols and 0 <= nr < rows) or (nc, nr) in walls:
                return None
            c, r = nc, nr
        else:
            return None
    return [c, r]


def table_answer(rows, check):
    """The one answer a table question has, or None if it has no single one."""
    kind = check.get("kind")
    if kind in ("most", "least"):
        pick = max if kind == "most" else min
        best = pick(r["value"] for r in rows)
        winners = [r["label"] for r in rows if r["value"] == best]
        if len(winners) != 1:
            return None    # a tie has no single answer; the question is unfair
        return winners[0]
    row = next((r for r in rows if r["label"] == check.get("row")), None)
    if row is None:
        return None
    if kind == "count":
        return str(row["value"])
    if kind == "any":
        return "Yes" if row["value"] > 0 else "No"
    return None

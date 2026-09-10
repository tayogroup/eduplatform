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

import re

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


# Stage 2: the repeat block (2P.03). A repeat block repeats the block AFTER
# it; a repeat with nothing after it, or another repeat after it, repeats
# nothing. This mirrors expandProgram() in lib/computing.js, and the builder
# checks these counts against the BLOCKS table in the JS so the two cannot
# drift - the same reason the Wehel contract holds three files equal.
REPEATS = {"repeat2": 2, "repeat3": 3, "repeat4": 4}


def expand_program(ids):
    """The plain list of moves a program makes, repeats unrolled."""
    out = []
    i = 0
    while i < len(ids):
        n = REPEATS.get(ids[i])
        if n:
            nxt = ids[i + 1] if i + 1 < len(ids) else None
            if nxt and nxt not in REPEATS:
                out.extend([nxt] * n)
                i += 1
        else:
            out.append(ids[i])
        i += 1
    return out


def sum_answer(expr):
    """The answer of a race sum - `a + b` or `a - b` in whole numbers - as the
    string a child taps, or None if the expression is not one of those. The
    race keys are computed, never trusted, the same stance the Mathematics
    answer-key gate takes."""
    m = re.fullmatch(r"\s*(\d+)\s*([+−-])\s*(\d+)\s*", str(expr))
    if not m:
        return None
    a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
    return str(a + b if op == "+" else a - b)

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


# ----------------------------------------------------------------------
# Stage 3: more things computed rather than trusted. Each mirrors a function
# of the same name (camelCased) in lib/computing.js; the builder and the gate
# use these, the page uses those, and a content module's authored key must
# agree with the computation or the page is not built.
# ----------------------------------------------------------------------

def rule_output(rule, x):
    """The output of an input-output machine (3CT.07, 3CT.08) for input x.

    rule: "double" | "half" | "add:N" | "minus:N" | "times:N" | "letters"
    (letters counts the letters of a word). Returns a string, the way a child
    reads it off the machine, or None for a rule the kit does not know."""
    name, _, arg = str(rule).partition(":")
    if name == "letters":
        return str(len(str(x)))
    try:
        n = int(x)
        k = int(arg or 0)
    except ValueError:
        return None
    if name == "double":
        return str(n * 2)
    if name == "half":
        return str(n // 2) if n % 2 == 0 else None
    if name == "add":
        return str(n + k)
    if name == "minus":
        return str(n - k)
    if name == "times":
        return str(n * k)
    return None


def walk_end(program):
    """Where a numbered-block program leaves the sprite (3P.05): each block is
    {"id": "right"|"left"|"jump", "n": count}; right and left move n squares."""
    x = 0
    for b in program:
        if b["id"] == "right":
            x += int(b["n"])
        elif b["id"] == "left":
            x -= int(b["n"])
    return x


def code_word(word):
    """1 = a, 2 = b ... 26 = z (3DC.05)."""
    return [ord(c) - 96 for c in str(word).lower() if "a" <= c <= "z"]


def decode_code(nums):
    return "".join(chr(96 + int(n)) for n in nums if 1 <= int(n) <= 26)


def row_matches(row, spec):
    """One row against a filter (3MD.06): {"field", "op": eq|ne|gt|lt, "value"}."""
    v = row.get(spec["field"])
    op = spec.get("op", "eq")
    if op == "gt":
        return float(v) > float(spec["value"])
    if op == "lt":
        return float(v) < float(spec["value"])
    if op == "ne":
        return str(v) != str(spec["value"])
    return str(v) == str(spec["value"])


def filter_rows(rows, spec):
    return [r for r in rows if row_matches(r, spec)]


def same_effect(a, b):
    """Two block programs do the same thing when their expansions agree once
    the do-nothing `wait` blocks are dropped (3P.01: concise programs)."""
    ea = [x for x in expand_program(a) if x != "wait"]
    eb = [x for x in expand_program(b) if x != "wait"]
    return ea == eb


def repeat_run(ids, start, length, times):
    """True if ids[start:start+length] is followed by itself times-1 more
    times, back to back (3CT.03: the steps that repeat in an everyday task)."""
    if length < 1 or times < 2 or start < 0 or start + length * times > len(ids):
        return False
    seg = ids[start:start + length]
    return all(ids[start + k * length:start + (k + 1) * length] == seg for k in range(times))


def sheet_cells(cols, rows, cells, tasks):
    """The state of a spreadsheet (3MD.04) after the tasks up to here have
    been done: `cells` is the authored start, an `enter` task writes a value.
    Returns {cellname: value}; used to prove a `find` task has one answer."""
    state = dict(cells)
    for t in tasks:
        if t["kind"] == "enter":
            state[t["cell"]] = t["value"]
    return state


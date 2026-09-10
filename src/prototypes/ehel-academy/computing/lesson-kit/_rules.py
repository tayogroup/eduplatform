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


# ----------------------------------------------------------------------
# Stage 4: loops, sub-routines, branches, sorting, two more ciphers. Each
# mirrors a camelCased function in lib/computing.js, as at Stage 3.
# ----------------------------------------------------------------------

def expand_loop(before, body, times, after):
    """The flat list a count-controlled loop makes: before, body x times, after
    (4CT.05, 4CT.10; Robo's looped programs)."""
    return list(before or []) + list(body or []) * int(times) + list(after or [])


FOREVER_CYCLES = 2   # how many times a forever loop is followed before Stop


def flatten_algo(blocks):
    """A structured algorithm - steps, `repeat` blocks with a body and a count,
    `forever` blocks - as the flat list of step ids a child follows (4CT.01,
    4CT.02). A forever loop is followed FOREVER_CYCLES times and then a "stop"
    step is expected, because that is the only way out of one."""
    out = []
    for b in blocks:
        if b.get("kind") == "repeat":
            for _ in range(int(b["times"])):
                out.extend(st["id"] for st in b["body"])
        elif b.get("kind") == "forever":
            for _ in range(FOREVER_CYCLES):
                out.extend(st["id"] for st in b["body"])
            out.append("stop")
        else:
            out.append(b["id"])
    return out


def sub_expand(main, subs):
    """A main algorithm with `call` blocks expanded into the sub-routines'
    steps (4CT.08): the flat list of ids a child follows, with the call
    itself as a step ("do WASH") before the sub-routine's own steps."""
    out = []
    for b in main:
        if b.get("kind") == "call":
            out.append("call:" + b["sub"])
            out.extend(st["id"] for st in subs[b["sub"]])
        else:
            out.append(b["id"])
    return out


def branch_run(rd, input_id):
    """The steps an if-algorithm takes for one input (4CT.09): before, the
    branch that matches, after."""
    branch = rd["yes"] if input_id == rd["inputs"][0]["id"] else rd["no"]
    return [st["id"] for st in rd.get("before", [])] + [st["id"] for st in branch] + [st["id"] for st in rd.get("after", [])]


def best_algo(algos, check):
    """Which of several algorithms for one task is best for a computable
    purpose (4CT.04): the fewest steps, or the fastest by its minutes. None
    on a tie or an uncomputable purpose."""
    kind = check.get("kind")
    if kind == "fewest_steps":
        key = lambda a: len(a["steps"])   # noqa: E731
    elif kind == "fastest":
        key = lambda a: float(a["facts"]["minutes"])   # noqa: E731
    else:
        return None
    best = min(key(a) for a in algos)
    winners = [a["id"] for a in algos if key(a) == best]
    return winners[0] if len(winners) == 1 else None


def sort_rows(rows, field, direction):
    """Rows in the required order (4MD.04): ascending or descending, by number
    when the values are numbers and alphabetically otherwise. Returns names."""
    vals = [r[field] for r in rows]
    numeric = all(isinstance(v, (int, float)) for v in vals)
    key = (lambda r: float(r[field])) if numeric else (lambda r: str(r[field]).lower())
    ordered = sorted(rows, key=key, reverse=(direction == "desc"))
    return [r["name"] for r in ordered]


def caesar_shift(text, shift):
    """The Caesar cipher (4DC.06): every letter moved `shift` places along the
    alphabet, wrapping from z to a. Letters only, lower case."""
    out = []
    for c in str(text).lower():
        if "a" <= c <= "z":
            out.append(chr((ord(c) - 97 + int(shift)) % 26 + 97))
    return "".join(out)


def pigpen_index(letter):
    """The Pigpen cipher draws each letter from its place in the alphabet
    (4DC.06): 0-8 the first grid, 9-17 the dotted grid, 18-21 the cross,
    22-25 the dotted cross. The glyph is drawn from this index in the JS."""
    c = str(letter).lower()
    return ord(c) - 97 if "a" <= c <= "z" else None


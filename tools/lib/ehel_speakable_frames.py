"""How a fill-in-the-blank frame and a slash are read aloud — Python port.

The one definition is ``speakableFrames()`` in ``tools/lib/ehel-tts.js``; read
its comment for the rules and the reasons. Python and Node do not share a
module, so this is a hand-kept mirror for the Python narration paths
(``create-ehel-english-unit-lecture.py``). ``tools/check-ehel-speakable-frames.mjs``
runs the same cases through both and fails when they disagree, which is what
"keep in step by hand" has to mean for a rule about what a child hears.

Every regex here corresponds to one in the JS file, in the same order, under the
same name. Change them together.
"""

from __future__ import annotations

import re

BLANK_RE = re.compile(r"_{2,}")
PAUSE = "\ue000"  # private-use while tidying, written out as "..."
CHOICE_COMMA = "\ue001"  # the comma this transform inserts, written out as ","
GAP_ANNOUNCED_RE = re.compile(r"\b(blank|gap|missing|fill|complete|finish)\w*", re.I)
SPAN_SPLIT_RE = re.compile(
    r"(\|\s+|\d{1,2}[.)]\s+|(?:[.!?]+|…)[\"”’']?\s+|[:;]\s+|(?:^|\s)\(?[a-h]\)\s|[“\"‘]|\n+)"
)
BRACKET_CHOICE_RE = re.compile(r"\(([^()]*?\s/\s[^()]*?)\)")
TIGHT_CHAIN_RE = re.compile(r"\b[A-Za-z][A-Za-z'’-]*(?:/[A-Za-z][A-Za-z'’-]*)+\b")
LINE_BREAK_SLASH_RE = re.compile(r"([_.,!?;:”\"’'])\s/\s")
TAIL_RE = re.compile(r"[.!?]*[\"”’']*\s*$")
ANCHOR_RE = re.compile(r"(?:^|[\s:(])['‘\"“]")
AFTER_ITEM_RE = re.compile(r"^((?:[^\s_]+\s+){0,2}[^\s_]+)(?=\s*_{2,})")


def _join_choices(items: list[str]) -> str:
    if len(items) <= 1:
        return "".join(items)
    if re.fullmatch(r"(?i)not|no", items[0]):
        return ", ".join(items)
    return f"{', '.join(items[:-1])} or {items[-1]}"


def _word_count(s: str) -> int:
    return len([w for w in s.strip().split() if w])


def _anchor_index(span: str) -> int:
    m = re.search(r"_{2,}|\s/\s", span)
    head = span[: m.start()] if m else span
    best = 0
    for hit in ANCHOR_RE.finditer(head):
        best = hit.end()
    return best


def _tidy(s: str) -> str:
    s = re.sub(r"(\ue000\s*){2,}", "\ue000 ", s)
    s = re.sub(r"\ue000\s*\.(?!\.)", "\ue000", s)
    s = re.sub(r"\s+\ue001", "\ue001", s)
    s = re.sub(r"\ue001\s*\ue001", "\ue001", s)
    s = re.sub(r"\ue001\s*([.!?;:,])", r"\1", s)
    s = re.sub(r"([.!?;:,])\s*\ue001\s*", r"\1 ", s)
    s = re.sub(r"(^|\d[.)]\s|\|\s|[“\"‘]|\s')\s*\ue001\s*", r"\1", s)
    s = re.sub(r"\ue001(?=\s+\d{1,2}[.)]\s|\s*$|\s*\|\s)", ".", s)
    s = s.replace("\ue001", ",").replace("\ue000", "...")
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()


def _speakable_span(span: str, state: dict) -> str:
    lead = span[: _anchor_index(span)]
    body = span[len(lead):]
    body = re.sub(r"^\s*/\s+", "", body)
    body = LINE_BREAK_SLASH_RE.sub(r"\1 ", body)
    tail_match = TAIL_RE.search(body)
    tail = tail_match.group(0) if tail_match else ""
    body = body[: len(body) - len(tail)]
    has_blank = bool(BLANK_RE.search(body))
    parts = re.split(r"\s/\s", body)
    if len(parts) > 1:
        runs: list[dict] = []
        for i in range(1, len(parts)):
            last = runs[-1] if runs else None
            if last and _word_count(parts[i - 1]) <= 3 and last["end"] == i - 1:
                last["end"] = i
            else:
                runs.append({"start": i - 1, "end": i})
        all_pairs = all(r["end"] - r["start"] == 1 for r in runs)
        if has_blank and all_pairs:
            pairs = []
            ok = True
            for r in runs:
                after = AFTER_ITEM_RE.match(parts[r["end"]])
                if not after:
                    ok = False
                    break
                n = _word_count(after.group(1))
                before = re.search(r"((?:\S+\s+){%d}\S+)\s*$" % (n - 1), parts[r["start"]])
                if not before:
                    ok = False
                    break
                pairs.append({"left": before.group(1), "right": after.group(1)})
            if ok:
                def version(side: str) -> str:
                    out = ""
                    for i in range(len(parts)):
                        if i == 0:
                            out += parts[0]
                        else:
                            pair = pairs[i - 1]
                            if side == "left":
                                out = f"{out}{parts[i][len(pair['right']):]}"
                            else:
                                out = f"{out[: len(out) - len(pair['left'])]}{pair['right']}{parts[i][len(pair['right']):]}"
                    return BLANK_RE.sub(PAUSE, out).strip()

                state["prefixed"] = True
                return f"{lead}Fill in the blank: {version('left')}. Fill in the blank: {version('right')}{tail}"
        out = parts[0]
        for r in runs:
            sep = " or " if r["end"] - r["start"] == 1 else ", "
            for i in range(r["start"] + 1, r["end"] + 1):
                out += sep + parts[i]
        body = out
    if has_blank:
        announce = not state["prefixed"] and not state["gap_announced"]
        state["prefixed"] = state["prefixed"] or announce
        body = f"{'Fill in the blank: ' if announce else ''}{BLANK_RE.sub(PAUSE, body)}"
    return lead + body + tail


def speakable_frames(text: str) -> str:
    s = str(text)
    s = BRACKET_CHOICE_RE.sub(
        lambda m: f"{CHOICE_COMMA} {_join_choices([t.strip() for t in re.split(r'\s/\s', m.group(1)) if t.strip()])}{CHOICE_COMMA}", s
    )

    def chain(m: re.Match) -> str:
        if re.fullmatch(r"(?i)n/a", m.group(0)):
            return "not applicable"
        items = m.group(0).split("/")
        return f"{items[0]} or {items[1]}" if len(items) == 2 else ", ".join(items)

    s = TIGHT_CHAIN_RE.sub(chain, s)
    pieces = SPAN_SPLIT_RE.split(s)
    state = {"prefixed": False, "gap_announced": False}
    seen = ""
    out: list[str] = []
    for i, piece in enumerate(pieces):
        piece = piece or ""
        if i % 2 == 1:
            out.append(piece)
            seen += piece
            continue
        state["gap_announced"] = bool(GAP_ANNOUNCED_RE.search(seen))
        out.append(_speakable_span(piece, state))
        seen += piece
    return _tidy("".join(out))

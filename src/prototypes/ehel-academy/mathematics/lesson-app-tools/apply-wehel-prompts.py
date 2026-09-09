# -*- coding: utf-8 -*-
"""Standardise the tutor's canned prompts on pages wired before they changed.

wire-platform-controls.py holds the canonical set, and its own comment says it
is meant for every app it wires -- Grade 1 English and the Mathematics builds.
But the prompts are BAKED into each page at wiring time and the tool skips a
page it has already wired, so a change there reaches nothing already built:
the Mathematics pages still carried the older three ("Explain it simply",
"Quiz me", "An easier one") while English had the four.

Reads the array OUT of the wiring tool rather than restating it -- two copies
of the prompts is two builds that offer a child different help.

Idempotent: a page already carrying the canonical set reports "up to date", so
this is also how a future change to the prompts is pushed. --dry writes nothing.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, "wire-platform-controls.py")
OPEN, CLOSE = "quickPrompts: [", "          ],\n"


def canonical() -> str:
    src = io.open(TOOL, encoding="utf-8", newline="").read()
    i = src.index(OPEN)
    j = src.index(CLOSE, i) + len(CLOSE)
    k = src.rfind("\n", 0, i) + 1
    return src[k:j]


def apply(path: str, block: str, dry: bool) -> str:
    s = io.open(path, encoding="utf-8", newline="").read()
    if OPEN not in s:
        return "no tutor prompts on this page"
    i = s.index(OPEN)
    a = s.rfind("\n", 0, i) + 1
    b = s.index(CLOSE, i) + len(CLOSE)
    if s[a:b] == block:
        return "up to date"
    before = len(re.findall(r"\{ label:", s[a:b]))
    if not dry:
        io.open(path, "w", encoding="utf-8", newline="").write(s[:a] + block + s[b:])
    return "standardised (%d prompts -> %d)" % (before, len(re.findall(r"\{ label:", block)))


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)      # a typo must never fall through
            return 2
    if not args:
        print("usage: apply-wehel-prompts.py <page.html> [...] [--dry]")
        return 2
    block = canonical()
    for path in args:
        print("  %-32s %s" % (os.path.basename(path), apply(path, block, "--dry" in flags)))
    if "--dry" in flags:
        print("\n  --dry: nothing written")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""Put the tutor-panel theme into pages that were wired before it existed.

wire-platform-controls.py skips a page that already carries its marker, so a
change to its CSS never reaches the pages already built. This carries just the
WEHEL-THEME block across, and it reads that block OUT of the wiring tool rather
than restating it -- two copies of a palette is two builds that disagree about
what colour the tutor is.

Idempotent: a page that already has the block gets its current text, so this is
also how you push an edit to the theme. --dry reports and writes nothing.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, "wire-platform-controls.py")
START, END = "/* WEHEL-THEME-START", "/* WEHEL-THEME-END */"


def theme() -> str:
    src = io.open(TOOL, encoding="utf-8", newline="").read()
    i = src.index(START)
    j = src.index(END, i) + len(END)
    # back up to the indentation that opens the comment
    k = src.rfind("\n", 0, i) + 1
    return src[k:j] + "\n"


def apply(path: str, block: str, dry: bool) -> str:
    s = io.open(path, encoding="utf-8", newline="").read()
    # ASK WHETHER THE PAGE HAS THE CONTROLS, not whether this tool wrote them.
    # The first version tested for the wiring tool's own marker, and reported
    # "not wired" for all eight Grade 1 Mathematics pages -- which carry the
    # dock, the drawer, the toast and both module imports, under an older
    # hand-written comment that predates the marker. The precondition that
    # actually matters is the anchor this tool needs, so test for that.
    if ".w-toast {" not in s:
        return "no tutor controls on this page"
    if START in s:
        a = s.rfind("\n", 0, s.index(START)) + 1
        b = s.index(END, a) + len(END) + 1
        if s[a:b] == block:
            return "up to date"
        s = s[:a] + block + s[b:]
        verb = "updated"
    else:
        anchor = "font-weight: 700; font-size: 15px; box-shadow: var(--shadow); }\n"
        if s.count(anchor) != 1:
            return "ANCHOR x%d - not touched" % s.count(anchor)
        s = s.replace(anchor, anchor + block)
        verb = "themed"
    if not dry:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    return verb


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)      # never ignore a typo silently
            return 2
    if not args:
        print("usage: apply-wehel-panel-theme.py <page.html> [...] [--dry]")
        return 2
    block = theme()
    dry = "--dry" in flags
    for path in args:
        print("  %-30s %s" % (os.path.basename(path), apply(path, block, dry)))
    if dry:
        print("\n  --dry: nothing written")
    return 0


if __name__ == "__main__":
    sys.exit(main())

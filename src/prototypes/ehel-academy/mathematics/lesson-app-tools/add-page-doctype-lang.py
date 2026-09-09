# -*- coding: utf-8 -*-
"""Give already-built lesson pages a doctype and a language.

Found by the Grade 1 English content validation, 2026-09-09: not one lesson
page in any of the three standalone builds opens with an <html> element, so
none declares a language, and none has a doctype either.

TWO DEFECTS, one line apart.

  lang="en-GB" is what a screen reader reads the page WITH. Without it the
  reader guesses, and may pronounce English with another language's rules --
  on a course whose subject is English.

  No doctype puts the page in QUIRKS mode (document.compatMode "BackCompat"),
  a legacy box model these pages were never written for. They were simply
  never given one.

MEASURED BEFORE CHANGING ANYTHING, because a doctype flips the rendering mode
and that can move layout: the same page was rendered with and without one and
every element's box, font size, line height and padding compared. Identical --
the only difference was compatMode itself. So this is safe on these builds; it
would not be safe to assume on a page whose CSS was tuned in quirks mode.

The builders (english/grade-1-app/build-lessons.py and build-hub.py) emit both
now, so a rebuild carries them. This carries them to the pages already built,
including the two hand-maintained Mathematics builds that have no builder.

Idempotent; --dry writes nothing.
"""
import io, os, sys

DOCTYPE = "<!doctype html>"
HTML = '<html lang="en-GB">'


def patch(path, dry):
    s = io.open(path, encoding="utf-8", newline="", errors="surrogateescape").read()
    head = s.lstrip()[:400].lower()
    has_doc = head.startswith("<!doctype")
    has_html = "<html" in head
    if has_doc and has_html:
        return "up to date"
    if "<meta charset" not in s[:400].lower():
        return "not a lesson page (no charset meta at the top)"
    add = ("" if has_doc else DOCTYPE + "\n") + ("" if has_html else HTML + "\n")
    if not dry:
        io.open(path, "w", encoding="utf-8", newline="", errors="surrogateescape").write(add + s)
    return "added " + ("doctype+lang" if not has_doc and not has_html else ("doctype" if not has_doc else "lang"))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    for f in flags:
        if f != "--dry":
            print("unknown argument %s" % f)
            return 2
    if not args:
        print("usage: add-page-doctype-lang.py <page.html> [...] [--dry]")
        return 2
    for p in args:
        print("  %-32s %s" % (os.path.basename(p), patch(p, "--dry" in flags)))
    if "--dry" in flags:
        print("\n  --dry: nothing written")
    return 0


sys.exit(main())

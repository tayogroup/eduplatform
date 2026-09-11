# -*- coding: utf-8 -*-
"""Give every slide of a build its own authored explanation.

    python add-explanations.py --app ../grade-2-app            # report
    python add-explanations.py --app ../grade-2-app --write

THE 2026-09-11 VALIDATION counted the words of authored explanation in each
build: Grade 1 9,327, Grade 3 6,309, Grades 2 and 4 NONE. On those two every
Explain button fell back to the derived explainer, which reads the step's own
heading and instruction back to a child who did not understand them the first
time. The engine has always preferred an authored body when a slide carries
one (see "AUTHORED BEATS DERIVED" in any lesson page); nobody had written them.

THE WORDS LIVE IN explanations.txt BESIDE app.config.json, one block per slide,
keyed by lesson file and the slide's own heading:

    [tens-and-ones.html] Which is more?
    name: The tens decide first.
    show: 47 and 52. 4 tens against 5 tens, so 52 is more.
    warn: 49 is not more than 52 just because 9 is a big digit.
    hand: Look at the tens of both numbers before anything else.

The four moves are the engine's own - NAME the idea, SHOW one example from this
step, WARN about the mistake children make here, HAND back one thing to try -
spoken calm, friendly, empathetic and cheerful, exactly as Grades 1 and 3 are.
A slide with nothing to work out (the sticker shelf) takes a `name:` line only.
This tool writes the SSML, so an author never types a tag - a hand-typed
nested <mstts:express-as> is one the engine silently refuses to speak.

EVERY SLIDE, OR IT SAYS WHICH ARE MISSING. A block for a heading that no slide
has is refused too: a renamed slide would otherwise lose its explanation
without a word, and the build would be back to derived ones one at a time.

THE TEXT IS CHECKED, NOT TRUSTED. It is written into a single-quoted HTML
attribute and then parsed as XML, so an apostrophe ends the attribute and an
ampersand or angle bracket breaks the XML - and a body that does not parse is
dropped for the derived one, silently. So: no ' " & < >, and a sentence ends
in . ? or !. Say "does not", not the contraction; say "times", "take away" and
"shared between" rather than the signs, which a voice may not read.

Runs on Grade 2 once (hand-edited pages) and inside Grade 4's build-all.sh
after every build (its pages are generated). Idempotent: a slide that already
carries its authored body is left alone; a changed body replaces the old one.
"""
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
argv = sys.argv[1:]
WRITE = "--write" in argv
rest = [a for a in argv if a != "--write"]
if "--app" in rest:
    i = rest.index("--app")
    rest = rest[:i] + rest[i + 2:]
if rest:
    sys.exit("unrecognised argument: %s" % rest[0])
app = load(argv)

MOVES = [
    ("name", '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'),
    ("show", '<mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'),
    ("warn", '<mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'),
    ("hand", '<mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'),
]
BREAK = '<break time="330ms"/>'
UNSAFE = re.compile("['\"&<>\\\\]")


def parse(path):
    """{(file, heading): {move: text}} and a list of problems."""
    blocks, problems, key, lineno = {}, [], None, 0
    for raw in io.open(path, encoding="utf-8"):
        lineno += 1
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^\[([^\]]+\.html)\]\s+(.+)$", line)
        if m:
            key = (m.group(1), m.group(2).strip())
            if key in blocks:
                problems.append("line %d: a second block for %s | %s" % (lineno, key[0], key[1]))
            blocks[key] = {}
            continue
        m = re.match(r"^(name|show|warn|hand):\s*(.+)$", line)
        if not m or key is None:
            problems.append("line %d: not a [file] heading or a name/show/warn/hand line: %s" % (lineno, line[:60]))
            continue
        move, text = m.group(1), m.group(2).strip()
        if move in blocks[key]:
            problems.append("line %d: %s has two %s lines" % (lineno, key[1], move))
        if UNSAFE.search(text):
            problems.append("line %d: %s | %s: unsafe character %r in %s" % (
                lineno, key[0], key[1], UNSAFE.search(text).group(0), move))
        if not re.search(r"[.?!]$", text):
            problems.append("line %d: %s | %s: %s does not end a sentence" % (lineno, key[0], key[1], move))
        blocks[key][move] = text
    for key, mv in blocks.items():
        have = [m for m, _ in MOVES if m in mv]
        if have not in (["name"], ["name", "show", "warn", "hand"]):
            problems.append("%s | %s: moves %s - want all four, or name alone" % (key[0], key[1], have))
    return blocks, problems


def ssml(mv):
    out = []
    for move, tmpl in MOVES:
        if move not in mv:
            continue
        sents = [x.strip() for x in re.split(r"(?<=[.?!])\s+", mv[move]) if x.strip()]
        out.append(tmpl % "".join("<s>%s</s>" % x for x in sents))
    return BREAK.join(out)


def heading(sec):
    m = re.search(r"<h2>(.*?)</h2>", sec, re.S)
    if not m:
        return None
    t = re.sub(r"<[^>]+>", "", m.group(1))
    for ent, ch in (("&amp;", "&"), ("&nbsp;", " "), ("&mdash;", u"—"), ("&rsquo;", u"’")):
        t = t.replace(ent, ch)
    return " ".join(t.split())


src = app.path("explanations.txt")
if not os.path.isfile(src):
    sys.exit("no explanations.txt in %s" % app.root)
blocks, problems = parse(src)
for p in problems:
    print("  REFUSED  explanations.txt " + p)
if problems:
    sys.exit(1)

used, missing, changed_files, words = set(), [], 0, 0
for unit, f, title in app.lessons:
    s = app.read(f)
    out, pos, n_set, n_same = [], 0, 0, 0
    # QUOTED VALUES MAY HOLD ">": an explanation is SSML, so once one is written
    # a plain [^>]* ends the tag inside it - and the first version of this tool,
    # re-run, would have written a second data-explain into the middle of the
    # first. Its own idempotency check (a report run straight after --write
    # still wanting to change every file) is what showed it.
    for m in re.finditer(r'<section class="slide"(?:[^>"\']|"[^"]*"|\'[^\']*\')*>', s):
        tag = m.group(0)
        end = s.find("</section>", m.end())
        h = heading(s[m.end():end])
        key = (f, h)
        if key not in blocks:
            # a slide another tool wrote WITH its explanation - the "How do you
            # know?" step carries the one its own tool shares across lessons -
            # is explained; only a slide with none at all is missing one
            if "data-explain='" in tag:
                n_same += 1
            else:
                missing.append("%s | %s" % (f, h))
            continue
        used.add(key)
        body = ssml(blocks[key])
        words += len(re.sub(r"<[^>]+>", " ", body).split())
        new = re.sub(r"\sdata-explain='[^']*'", "", tag)
        new = new[:-1] + " data-explain='%s'>" % body
        if new == tag:
            n_same += 1
            continue
        out.append(s[pos:m.start()] + new)
        pos = m.end()
        n_set += 1
    t = "".join(out) + s[pos:]
    if t != s:
        changed_files += 1
        if WRITE:
            app.write(f, t)
    print("  %-34s %2d explained%s" % (f, n_set + n_same,
                                        (" (%d %s)" % (n_set, "written" if WRITE else "to write")) if n_set else ""))

stale = sorted("%s | %s" % k for k in set(blocks) - used)
for k in stale:
    print("  REFUSED  a block names no slide: %s" % k)
for k in missing:
    print("  MISSING  %s" % k)
print("\n  %s: %d file(s) %s, %d words of explanation, %d slide(s) missing one, %d stale block(s)" % (
    "write" if WRITE else "report", changed_files, "changed" if WRITE else "to change",
    words, len(missing), len(stale)))
sys.exit(1 if (missing or stale) else 0)

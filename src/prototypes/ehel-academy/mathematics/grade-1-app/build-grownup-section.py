# -*- coding: utf-8 -*-
"""Give the adult in the room a page, and put a time on every lesson.

Two of the three lowest scores in the Grade 1 Maths validation were about the
grown-up rather than the child, and both were simply ABSENT:

  Learning-Time Estimates   2/5   the word "minute" appeared 0 times in the
                                  whole build. A parent choosing between a
                                  4-step lesson and a 16-step one had the step
                                  count and nothing about how long either takes.
  Teacher and Parent Support 2/5   one paragraph on the hub, "For the grown-up",
                                  about strand coverage. No objectives, no
                                  answer keys, no notes, nothing to do at home.

Science built both during its own review, so this follows its format rather
than inventing one: `N steps &middot; about M min &middot; check &middot;
stickers` on each card, a total in the intro, and a "For teachers and parents"
section listing, per lesson, what it teaches in Cambridge's own words, what the
steps ask, and the answer keys.

EVERYTHING HERE IS READ, NOT RETYPED, and that is the whole design.

  the objectives   the codes now annotated on each step (annotate-objectives.py)
                   resolved to Cambridge's own wording in
                   src/curriculum/cambridge-mathematics-0096.json
  the steps        each step's own <h2> and its data-say
  the answer keys  each check item's question and its marked answer

So a content fix reaches this page by re-running the tool, and nothing on it is
a second copy of a fact that can drift from the lesson. It is regenerated
between markers, so a re-run replaces the section instead of appending a second
one.

THE MINUTES ARE AN ESTIMATE AND THE PAGE SAYS SO. 2.5 minutes per step
(teaching steps plus the check), rounded to the nearest 5 -- the rate Science's
own cards imply, measured off them rather than chosen: its eight lessons run
15 to 19 steps against 40 to 45 minutes. Nobody has yet timed a child on either
subject, so the honest form is "about", and calibrating it against two real
learners stays on the open list. A number presented as measured when it is
derived is the failure this repo keeps recording; a number withheld because it
is not yet perfect is the one the owner asked to fix.

ANSWER KEYS ARE EXTRACTED FROM TWO SHAPES AND A THIRD WOULD REFUSE. Six lessons
hold `const CHECK = [{ q, a }]`; Halves and Wholes hands `items: [{ ask, opts:
[{ ok: true }] }]` to the shared sequence() driver. All 85 items carry exactly
one answer marker, checked before this was written. An item this cannot read
is REPORTED and the run fails, rather than being dropped from a page a parent
will mark their child's work against.

Idempotent: a second run reports and changes nothing.

  python build-grownup-section.py            # what it would write
  python build-grownup-section.py --write
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "g1v2")
FRAMEWORK = os.path.join(HERE, "..", "..", "..", "..", "curriculum",
                         "cambridge-mathematics-0096.json")
WRITE = "--write" in sys.argv
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unknown argument %r -- this script edits the hub in place" % a)

MIN_PER_STEP = 2.5
START = "<!-- GROWNUP:START  built by build-grownup-section.py -->"
END = "<!-- GROWNUP:END -->"


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def plain(t):
    """Learner-facing HTML down to the words, entities kept readable."""
    t = re.sub(r"<[^>]*>", "", t)
    for a, b in (("&mdash;", "\u2014"), ("&minus;", "\u2212"), ("&nbsp;", " "),
                 ("&rsquo;", "\u2019"), ("&ldquo;", "\u201c"), ("&rdquo;", "\u201d"),
                 ("&times;", "\u00d7"), ("&divide;", "\u00f7"), ("&amp;", "&"),
                 ("&hellip;", "\u2026"), ("&rarr;", "\u2192"), ("&middot;", "\u00b7")):
        t = t.replace(a, b)
    return " ".join(t.split())


def framework_text():
    d = json.load(io.open(FRAMEWORK, encoding="utf-8"))
    out = {}

    def walk(o):
        if isinstance(o, dict):
            if "code" in o:
                out[o["code"]] = " ".join(
                    (o.get("text") or o.get("statement") or "").split())
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(d)
    if len([c for c in out if c.startswith("1")]) != 36:
        sys.exit("  REFUSED: the framework file does not give 36 Stage 1 objectives")
    return out


def minutes(steps_incl_check):
    m = int(round(MIN_PER_STEP * steps_incl_check / 5.0) * 5)
    return max(10, m)


def read_lesson(name):
    s = io.open(os.path.join(BUILD, name), encoding="utf-8").read()
    secs = re.split(r'(?=<section class="slide")', s)
    head, secs = secs[0], secs[1:]
    teaching = secs[:-2]
    steps = []
    for k, sec in enumerate(teaching, 1):
        h = re.search(r"<h2>(.*?)</h2>", sec)
        say = re.search(r'data-say="(.*?)"', sec)
        steps.append((k, plain(h.group(1)) if h else "?",
                      plain(say.group(1)) if say else ""))
    # codes, from the comment annotate-objectives.py wrote before each section
    codes = []
    for m in re.finditer(r"<!--\s*\d+\s+((?:1[A-Z][a-z]\.\d\d(?:,\s*)?)+)", s):
        codes += re.findall(r"1[A-Z][a-z]\.\d\d", m.group(1))
    # the check's answer keys
    keys = []
    cm = re.search(r"const CHECK = \[(.*?)\n\s*\];", s, re.S)
    if cm:
        body = cm.group(1)
        # Split on the item boundary and parse each WHOLE item. The first
        # version matched `{ q: "..."(.*?)\n`, which is non-greedy to the first
        # newline, so it read only the head of every multi-line item and dropped
        # the last one entirely -- 14 of 15, 10 of 11, 4 of 5, silently, in
        # every lesson. An answer key that is one question short is worse than
        # none, because a parent marks against it and never learns it stopped.
        chunks = re.split(r"\n(?=\s*\{\s*q:)", body)
        chunks = [c for c in chunks if re.match(r"\s*\{\s*q:", c)]
        for c in chunks:
            q = re.match(r"\s*\{\s*q:\s*\"((?:[^\"\\]|\\.)*)\"", c)
            am = re.search(r"\ba:\s*(\"(?:[^\"\\]|\\.)*\"|[^,}\n]+)", c)
            if not q or not am:
                sys.exit("  REFUSED: %s has a check item this cannot read:\n    %s"
                         % (name, " ".join(c.split())[:90]))
            keys.append((plain(q.group(1)), plain(am.group(1).strip().strip('"'))))
        # cross-check against an independent count, so a parser that quietly
        # stops early cannot pass
        declared = len(re.findall(r"\{\s*q:", body))
        if len(keys) != declared:
            sys.exit("  REFUSED: %s: read %d check items but the array holds %d"
                     % (name, len(keys), declared))
    else:
        # THE SEQUENCE CHECK IS FOUND BY ITS finish INDEX, and that index moves
        # when a step is added after it. "How do you know?" is inserted between
        # the check and the sticker shelf (add-reasoning-step.py), which is the
        # one place a step can go without moving any EXISTING index - but it
        # does add one to the teaching count this reads, so on a page carrying
        # it the check's own finish is one below the count. The lessons with a
        # CHECK array are unaffected: they are found by the array's name.
        n = len(teaching)
        pat = r"finish:\s*%d\b.*?items:\s*\[(.*?)\n\s*\],?\n\s*\}\);"
        b = re.search(pat % n, s, re.S)
        if not b and 'id="clW"' in s:
            b = re.search(pat % (n - 1), s, re.S)
        if not b:
            sys.exit("  REFUSED: %s has neither a CHECK array nor a sequence() check" % name)
        for item in re.finditer(r"\{\s*ask:\s*\"((?:[^\"\\]|\\.)*)\"(.*?)(?=\n\s{6}\{\s*ask:|\Z)",
                                b.group(1), re.S):
            ok = re.search(r"\{\s*t:\s*(\"(?:[^\"\\]|\\.)*\"|[^,}]+),\s*ok:\s*true", item.group(2))
            if not ok:
                sys.exit("  REFUSED: %s has a check item with no ok:true option:\n    %s"
                         % (name, item.group(1)[:70]))
            keys.append((plain(item.group(1)), plain(ok.group(1).strip().strip('"'))))
    # THE TWM INDEX, read from the data-twm stamps add-characterising.py writes.
    # Read from EVERY section rather than from `teaching` above: "How do you
    # know?" sits between the check and the sticker shelf, which is the one place
    # a step can go without moving an existing index - so it is in the two
    # sections `teaching` drops, and an index built from `teaching` would silently
    # omit the one characteristic this build had first.
    twm = []
    for sec in secs:
        t = re.search(r'<section class="slide"[^>]*\sdata-twm="([^"]+)"', sec)
        if not t:
            continue
        h = re.search(r"<h2>(.*?)</h2>", sec)
        k = re.search(r'<div class="slide-head"><span class="n">(\d+)</span>', sec)
        twm.append((int(k.group(1)) if k else 999,
                    plain(h.group(1)) if h else "?", t.group(1).split()))
    return steps, codes, keys, sorted(twm)


def main():
    cfg = json.load(io.open(os.path.join(BUILD, "app.config.json"), encoding="utf-8"))
    ftext = framework_text()
    hub = io.open(os.path.join(BUILD, cfg["hub"]), encoding="utf-8").read()
    total = 0
    blocks = []
    changed = []
    seen_twm = set()

    for n, l in enumerate(cfg["lessons"], 1):
        steps, codes, keys, twm = read_lesson(l["file"])
        mins = minutes(len(steps) + 1)
        total += mins
        uniq = sorted(set(codes))
        print("  %-28s %2d steps  %2d check items  %2d objectives  about %d min"
              % (l["file"], len(steps), len(keys), len(uniq), mins))

        # ---- the card's own meta line
        # Anchored on the card's own href, never on the meta text alone.
        # Halves and Wholes and Adding and Taking Away both have 8 steps, so
        # they produce a byte-identical meta line: replacing the first match and
        # then testing `new in hub` marked the second card as already done, and
        # one of the two never got its minutes. Two lessons with the same step
        # count is the normal case, not an edge one.
        cm = re.search(r'(<a class="lesson[^"]*" href="%s\?from=[^"]*">.*?)'
                       r'(<span class="steps">)([^<]*)(</span>)' % re.escape(l["file"]),
                       hub, re.S)
        if not cm:
            sys.exit("  REFUSED: could not find the %s card on the hub" % l["file"])
        want = ('%d steps &middot; about %d min &middot; check &middot; stickers'
                % (len(steps), mins))
        if cm.group(3) != want:
            hub = hub[:cm.start(3)] + want + hub[cm.end(3):]
            changed.append("%s card" % l["file"])

        # ---- its block in the teachers-and-parents section
        obj = "".join(
            '\n        <li><b>%s</b> %s</li>' % (c, esc(ftext.get(c, "(not in the framework)")))
            for c in uniq)
        stp = "".join(
            '\n        <li><b>%s</b> &middot; %s</li>' % (esc(t), esc(say))
            for _k, t, say in steps)
        ans = "".join(
            '\n        <li>%s <b>%s</b></li>' % (esc(q), esc(a)) for q, a in keys)
        # ONE THING TO DO AT HOME, read from app.config.json :: lessons[].atHome.
        # It is the one part of this page that is AUTHORED rather than read from
        # the lesson - nothing in a lesson is an activity for a kitchen table - so
        # it lives in the build's own config beside the lesson it belongs to, and
        # this tool still types nothing. Added 2026-09-11, the gap the validation
        # named in area 24 ("Science has one; Maths has no experiment to borrow").
        # A lesson without one gets no heading, never an empty one.
        home = ('\n      <h4>Try at home</h4>\n      <p class="gu-home">%s</p>'
                % esc(l["atHome"])) if l.get("atHome") else ""
        # WHAT TO HAVE TO HAND, read from app.config.json :: lessons[].materials.
        # Authored there for the same reason atHome is: nothing in a lesson knows
        # what a classroom or a kitchen has in it. Added 2026-09-16, against the
        # one row of the Cambridge comparison a screen cannot argue with - Stage 1
        # is physical throughout, cubes and counters and water and sand, and this
        # app is the teaching spine BESIDE a teacher rather than a replacement for
        # any of it. So it does not pretend to be the cubes; it says which ones to
        # get out, and it comes FIRST in the block because it is the only part of
        # this page that has to be read BEFORE the lesson rather than after it.
        kit = ('\n      <h4>What to have to hand</h4>\n      <p class="gu-kit">%s</p>'
               % esc(l["materials"])) if l.get("materials") else ""
        # THE TWM INDEX for this lesson, DERIVED from the pages. The Teacher's
        # Guide carries a 113-row index of which question exercises which
        # characteristic and nothing here had an equivalent, so a teacher could
        # not tell that Sort the shapes is a classifying task and Spot the
        # mistake is a critiquing one. Per STEP rather than per question, which
        # is the finest grain these pages have. A hand-kept list would be wrong
        # the first time a step was renamed; this cannot be, because it is the
        # stamps themselves.
        # 999 is the sort sentinel for a section with no numbered head - "How do
        # you know?" is placed AFTER the check, which is the one position that
        # moves no existing index, so it has no step number to print. Say where
        # it is instead; printing the sentinel is how it first reached the page.
        twmli = "".join(
            '\n        <li><b>%s</b> (%s) &middot; %s</li>'
            % (esc(t), ("step %d" % k) if k < 999 else "after the check",
               esc(", ".join(cs))) for k, t, cs in twm)
        twmh = ('\n      <h4>Thinking and Working Mathematically</h4>'
                '\n      <ul>%s\n      </ul>' % twmli) if twm else ""
        for _k, _t, cs in twm:
            seen_twm.update(cs)
        blocks.append(
            '\n    <details class="gu">'
            '\n      <summary><b>Lesson %d: %s</b> <span class="gu-meta">%d steps '
            '&middot; about %d min &middot; %d objectives &middot; %d check questions</span></summary>'
            '%s'
            '\n      <h4>What it teaches (Cambridge Primary Mathematics 0096, Stage 1)</h4>'
            '\n      <ul>%s\n      </ul>'
            '\n      <h4>The steps</h4>'
            '\n      <ul>%s\n      </ul>'
            '\n      <h4>Check answers</h4>'
            '\n      <ul>%s\n      </ul>%s%s'
            '\n    </details>'
            % (n, esc(l["title"]), len(steps), mins, len(uniq), len(keys), kit, obj, stp, ans,
               twmh, home))

    # Cambridge's eight, in the Guide's own order. The sentence below is
    # ASSEMBLED from what the pages are stamped with, so it cannot claim a
    # characteristic the build does not exercise - and it names the missing ones
    # out loud rather than printing a count that reads like a score.
    TWM8 = ["specialising", "generalising", "conjecturing", "convincing",
            "characterising", "classifying", "critiquing", "improving"]
    have = [c for c in TWM8 if c in seen_twm]
    miss = [c for c in TWM8 if c not in seen_twm]
    unknown = sorted(seen_twm - set(TWM8))
    if unknown:
        sys.exit("  REFUSED: a step is stamped with something that is not one of "
                 "Cambridge's eight: %s" % ", ".join(unknown))
    twmnote = (
        '\n    <p class="gu-twmnote"><b>Thinking and Working Mathematically.</b> '
        'Cambridge names eight characteristics and flags them on individual questions. '
        'These lessons exercise <b>%d of the 8</b> &mdash; %s &mdash; and each lesson below '
        'lists which of its steps does which. %s</p>'
        % (len(have), esc(", ".join(have)),
           ("Not addressed: <b>%s</b>. Forming your own mathematical question is not "
            "something a choice of three buttons can carry, so it is left to you and the "
            "lesson you teach around this one." % esc(", ".join(miss))) if miss
           else "All eight are addressed."))

    section = (
        START +
        '\n  <section class="grownup" id="grownups">'
        '\n    <h3>For teachers and parents</h3>'
        '\n    <p>What each lesson teaches, in Cambridge\'s own words; what every step asks '
        'the child to do; the answer keys for the end-of-lesson check; and one thing to try '
        'at home with things you already have. Open a lesson to '
        'work through it, or print this page for the lot. The minutes are an estimate of '
        'about two and a half minutes a step, not yet timed against a real class, so treat '
        'them as a guide to the length of a sitting rather than a plan.</p>'
        + twmnote
        + "".join(blocks) +
        '\n  </section>\n  ' + END)

    if START in hub:
        i, j = hub.index(START), hub.index(END) + len(END)
        if hub[i:j] == section:
            print("\n  the teachers-and-parents section is already up to date")
        else:
            hub = hub[:i] + section + hub[j:]
            changed.append("teachers-and-parents section (rebuilt)")
    else:
        anchor = '<p class="note"><b>For the grown-up.</b>'
        if hub.count(anchor) != 1:
            sys.exit("  REFUSED: the hub has %d 'For the grown-up' notes; this tool puts\n"
                     "  its section straight after exactly one." % hub.count(anchor))
        k = hub.index(anchor)
        end = hub.index("</p>", k) + 4
        hub = hub[:end] + "\n  " + section + hub[end:]
        changed.append("teachers-and-parents section (new)")

    # ---- the total, in the intro, beside the lesson count
    # REPLACED, NOT ONLY INSERTED. The pattern used to require the </p> straight
    # after "...ready for the next.", so once the sentence below had been put there
    # it stood between the two and the pattern never matched again: the total
    # froze at the minutes of the day it was first written, and said "About 190
    # minutes" over cards adding up to 240 once the second steps landed.
    tot_new = " About %d minutes in all, one lesson a week." % total
    tot_old = re.search(r"(each one gets you ready for the next\.)"
                        r"( About \d+ minutes in all, one lesson a week\.)?(\s*</p>)", hub)
    if tot_old and tot_old.group(2) != tot_new:
        hub = hub[:tot_old.end(1)] + tot_new + hub[tot_old.start(3):]
        changed.append("total minutes in the intro")

    # THE STYLES NEVER LANDED, and a test on the wrong string is why. This used to
    # read `if CSS_MARK not in hub` with CSS_MARK = "build-grownup-section.py" -
    # and the section inserted a few lines above opens with the comment "built by
    # build-grownup-section.py". So the section went in first, put the mark in the
    # hub, and the style block was skipped on every run, including the first:
    # found 2026-09-11, when a new rule for "Try at home" refused to appear, with
    # 0 `details.gu` rules in the repo hub AND the live one. The panels still
    # opened and closed - <details> does that natively - but with none of their
    # styling. Now the block is found by its OWN start and end comments, which
    # appear nowhere else, and it is REPLACED on every run like the section, so a
    # style change reaches a hub that already has the old one.
    if CSS_START in hub:
        i = hub.index(CSS_START)
        j = hub.index(CSS_END, i) + len(CSS_END)
        if hub[i:j] != CSS.strip():
            hub = hub[:i] + CSS.strip() + hub[j:]
            changed.append("styles")
    else:
        i = hub.rindex("</style>")
        hub = hub[:i] + CSS + hub[i:]
        changed.append("styles")

    print("\n  total: about %d minutes across %d lessons" % (total, len(cfg["lessons"])))
    if not changed:
        print("  nothing to change\n")
        return 0
    print("  %s" % "; ".join(changed))
    if WRITE:
        io.open(os.path.join(BUILD, cfg["hub"]), "w", encoding="utf-8",
                newline="").write(hub)
        print("  written\n")
    else:
        print("  dry run -- pass --write\n")
    return 0


CSS_START = "/* ==== build-grownup-section.py ==== */"
CSS_END = "/* ==== end build-grownup-section.py ==== */"
CSS = """
/* ==== build-grownup-section.py ==== */
/* The adult's half of the hub. Collapsed by default: a child arriving at the
   hub should meet seven lessons, not seven answer keys. */
.grownup { margin: 26px 0 10px; }
.grownup h3 { font-size: 20px; margin: 0 0 6px; }
.grownup > p { color: var(--muted); font-size: 15px; line-height: 1.5; margin: 0 0 14px; }
details.gu {
  border: 2px solid var(--line); border-radius: 14px; background: var(--card);
  padding: 10px 14px; margin: 0 0 10px;
}
details.gu > summary { cursor: pointer; font-size: 16px; }
details.gu .gu-meta { color: var(--muted); font-weight: 600; font-size: 14px; }
details.gu h4 { font-size: 14px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); margin: 14px 0 6px; }
details.gu ul { margin: 0; padding-left: 20px; }
details.gu li { font-size: 15px; line-height: 1.5; margin: 0 0 4px; }
details.gu .gu-home { font-size: 15px; line-height: 1.5; margin: 0; }
/* what to have to hand: read BEFORE the lesson, so it is the one line in this
   block that is set off rather than run on */
details.gu .gu-kit { font-size: 15px; line-height: 1.5; margin: 0; padding: 10px 12px;
  border-left: 3px solid var(--teal); background: var(--cell); border-radius: 0 8px 8px 0; }
/* the TWM note sits above the lessons, so it is the section's own sentence
   rather than a lesson's - quieter than the lede, set off from it by a rule */
.grownup .gu-twmnote { font-size: 15px; line-height: 1.55; color: var(--muted);
  margin: 0 0 16px; padding: 12px 0 0; border-top: 1px solid var(--line); max-width: 74ch; }
.grownup .gu-twmnote b { color: var(--ink); }
@media print {
  details.gu { break-inside: avoid; }
  details.gu > summary { list-style: none; }
  details.gu[open] > summary::marker { content: ""; }
}
/* ==== end build-grownup-section.py ==== */
"""

sys.exit(main())

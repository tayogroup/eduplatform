# -*- coding: utf-8 -*-
"""Make a set of lesson pages into a course: real links, a way back, and the
launch parameters carried across every hop.

Three jobs, and they are one tool because the third is worthless without the
first two - a carrier script has nothing to carry on a page with no in-app
links, and a hub pointing at claude.ai is not a course.

  1. HUB LINKS. A hub built for review points at artifact URLs. Rewritten to
     the sibling file, matched by the TITLE printed beside the link rather
     than by position or by the URL itself: position drifts when a card moves
     and a url is opaque, while the <h2> is the same string a learner reads.

  2. A WAY BACK, drawn only when the learner came from the hub (?from=<p>).
     A lesson opened on its own - or published as an artifact - has nowhere to
     go back to, and a link that leads nowhere is worse than no link.

  3. THE LAUNCH PARAMETERS, on every in-app link, at run time.

Why 3 must land before the platform controls are wired, which is the whole
reason this tool runs first: mountHandRaise and mountClassChat open with

    if (!actions || !launchToken || !launchEndpoint || $("#hand-raise")) return;

so without BOTH parameters they mount nothing at all - correctly, since
without them they cannot reach anybody. Wire the controls first and they look
broken when they are merely unreachable. Grade 1 shipped that bug and it was
reported as "Class chat and Hand up are not displaying consistently"; the
inconsistency was navigational, not intermittent.

Idempotent: every step is skipped where its marker is already present.
"""
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

MARK_BACK = "wire-navigation.py :: back"
MARK_CARRY = "wire-navigation.py :: carry"

BACK_CSS = """
  /* --- the way back to the hub, drawn only when the learner arrived from it;
         see lesson-app-tools/wire-navigation.py --- */
  .lesson-back {
    display: inline-flex; align-items: center; gap: 8px;
    margin: 0 0 14px;
    padding: 9px 17px 9px 13px;
    border-radius: 999px;
    background: var(--card);
    border: 1px solid var(--line);
    color: var(--ink);
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 14px; font-weight: 700;
    text-decoration: none;
  }
  .lesson-back:hover, .lesson-back:focus-visible { border-color: var(--teal); }
"""

BACK_JS = """
<script>
  /* %s
     Only when ?from=%s: a lesson opened on its own has nowhere to go back to. */
  (function () {
    if (new URLSearchParams(location.search).get("from") !== "%s") return;
    var wrap = document.querySelector(".wrap");
    if (!wrap) return;
    var back = document.createElement("a");
    back.className = "lesson-back";
    back.href = "index.html";
    back.innerHTML = '<span aria-hidden="true">\\u2190</span> %s';
    wrap.insertBefore(back, wrap.firstChild);
  })();
</script>
"""

CARRY_JS = """
<script>
  /* %s
     Keep ?pwsToken and ?pwsEndpoint alive on every in-app link. Without BOTH,
     the class controls and Wehel do not mount at all - they guard on them and
     return, so the symptom is silence rather than an error. Applied to every
     same-directory link so a control added later cannot reintroduce the gap.
     Done at run time because the values are only known then. */
  (function () {
    var q = new URLSearchParams(location.search);
    q.delete("from");
    if (!q.toString()) return;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;   // in-app only
      var base = href.split("?")[0];
      var own = new URLSearchParams(href.split("?")[1] || "");
      q.forEach(function (v, k) { if (!own.has(k)) own.set(k, v); });
      a.setAttribute("href", base + "?" + own.toString());
    });
  })();
</script>
"""

ARTIFACT = re.compile(r'href="(https://claude\.ai/code/artifact/[0-9a-fA-F-]+)"(.*?)</a>', re.S)


def wire_hub(app):
    s = app.read(app.hub)
    by_title = {t.strip().lower(): f for _, f, t in app.lessons}
    seen, unresolved = [], []

    def sub(m):
        block = m.group(2)
        h2 = re.search(r"<h2>(.*?)</h2>", block, re.S)
        title = re.sub(r"<[^>]+>", "", h2.group(1)).strip() if h2 else ""
        f = by_title.get(title.lower())
        if not f:
            unresolved.append(title or m.group(1))
            return m.group(0)
        seen.append(f)
        return 'href="%s?from=%s"%s</a>' % (f, app.from_param, block)

    out = ARTIFACT.sub(sub, s)
    if unresolved:
        sys.exit("  REFUSED hub: no lesson matches these card titles: %s" % ", ".join(unresolved))
    if seen:
        app.write(app.hub, out)
        print("  ok   %-26s %d artifact links -> siblings" % (app.hub, len(seen)))
    else:
        print("  skip %-26s no artifact links left" % app.hub)

    missed = [f for _, f, _ in app.lessons if f not in seen]
    # only meaningful on the run that did the rewriting; a second run sees none
    if seen and missed:
        print("  NOTE hub has no card for: %s" % ", ".join(missed))

    s = app.read(app.hub)
    if MARK_CARRY not in s:
        app.write(app.hub, s.rstrip() + "\n" + (CARRY_JS % MARK_CARRY))
        print("  ok   %-26s carries the launch params" % app.hub)


def wire_lesson(app, name):
    s = app.read(name)
    did = []

    if MARK_BACK not in s:
        i = s.rfind("</style>")
        if i < 0:
            print("  REFUSED %-24s no </style> to put the back-link css in" % name)
            return False
        s = s[:i] + BACK_CSS + s[i:]
        s = s.rstrip() + "\n" + (
            BACK_JS % (MARK_BACK, app.from_param, app.from_param, app.back_label)
        )
        did.append("back link")

    if MARK_CARRY not in s:
        s = s.rstrip() + "\n" + (CARRY_JS % MARK_CARRY)
        did.append("launch params")

    if not did:
        print("  skip %-24s already navigable" % name)
        return True
    app.write(name, s)
    print("  ok   %-24s %s" % (name, ", ".join(did)))
    return True


def main():
    app = load()
    print("\n  Wiring navigation for %s %s (%d lessons)\n" % (
        app.subject_label, app.grade_label, len(app.lessons)))
    wire_hub(app)
    ok = all(wire_lesson(app, f) for _, f, _ in app.lessons)
    print("\n  %s\n" % ("every lesson has a way back and carries the launch params"
                        if ok else "SOME LESSONS FAILED - see above"))
    sys.exit(0 if ok else 1)


main()

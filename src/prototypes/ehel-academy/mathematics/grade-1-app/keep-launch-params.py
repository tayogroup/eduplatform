# -*- coding: utf-8 -*-
"""Carry the launch parameters across EVERY hop, not just the lesson picker.

Reported as "Class chat and Hand up are not displaying consistently", and the
inconsistency was navigational rather than intermittent.

mountHandRaise / mountClassChat open with

    if (!actions || !launchToken || !launchEndpoint || $("#hand-raise")) return;

so both pwsToken AND pwsEndpoint must be on the URL or the controls silently do
not mount - correctly, since without them they cannot reach anybody. The lesson
picker appended location.search and kept them. The back arrow and the brand
logo did not: they pointed at a bare index.html. So pressing Back landed on the
hub with an empty query, the hub's own propagation script then had nothing to
copy onto the cards, and every lesson opened from that point on was anonymous -
no Class chat, no Hand up, no Wehel. They worked on first arrival from Moodle
and disappeared as soon as a child navigated.

Fixed at run time rather than in the href, because the parameters are only
known then, and applied to every same-directory link so a future control cannot
reintroduce it.
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")
LESSONS = ["counting-to-twenty.html", "adding-and-taking-away.html",
           "halves-and-wholes.html", "what-comes-next.html",
           "shapes-and-sizes.html", "days-months-and-clocks.html",
           "asking-and-sorting.html"]

SNIPPET = """
<script>
  /* Keep ?pwsToken and ?pwsEndpoint alive on every in-app link.
     Without both, the class controls and Wehel do not mount at all - see
     keep-launch-params.py. The picker already appended location.search; the
     back arrow and the brand logo did not, which is what made the controls
     look intermittent. */
  (function () {
    var q = new URLSearchParams(location.search);
    q.delete("from");
    var carry = q.toString();
    if (!carry) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;   // in-app links only
      var base = href.split("?")[0];
      var own = new URLSearchParams((href.split("?")[1] || ""));
      q.forEach(function (v, k) { if (!own.has(k)) own.set(k, v); });
      a.setAttribute("href", base + "?" + own.toString());
    });
  })();
</script>
"""

fails = 0
for name in LESSONS:
    p = os.path.join(V2, name)
    s = io.open(p, encoding="utf-8").read()
    if "keep-launch-params.py" in s:
        print("  skip %-30s already carries them" % name)
        continue
    if 'href="index.html"' not in s:
        print("  REFUSED %-30s no index.html link to fix" % name); fails += 1; continue
    s = s.rstrip() + "\n" + SNIPPET
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  ok   %s" % name)

print("\n%s" % ("all seven carry the launch params on every link" if not fails else "%d failed" % fails))
sys.exit(1 if fails else 0)

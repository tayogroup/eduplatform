"""Carry the CDN token on every in-app link, hub AND lesson pages.

WHY THIS EXISTS, AND WHY IT IS NOT wire-platform.py's HUB_JS.

Bunny token authentication (docs/cdn-token-authentication.md) signs the launch URL
with token / expires / token_path / token_ignore_params and the edge refuses any
lesson document that arrives without them. Every other lesson build in the repo
carries the WHOLE query string across in-app navigation, so the token rides along
for free. This build was the one exception and was therefore left out of the
rollout on 2026-09-26:

  - wire-platform.py's HUB_JS carries an ALLOWLIST -- pwsToken, pwsEndpoint,
    studentid, category -- so the four token params were dropped the moment a
    learner clicked from the hub into a lesson.
  - split-into-lessons.py emits a bare `href="index.html"` back-link on every
    lesson page, with no query at all, so lesson -> hub dropped everything.

Only the first was obvious from the allowlist. The second is the one that a
"just add four names to the array" fix would have missed, and it would have
looked fine until a learner pressed Back to the hub.

An ALLOWLIST IS THE WRONG SHAPE HERE and that is the real lesson: it has to be
edited every time a new param is invented, and it already failed once for exactly
that reason. This carries everything except the `from` marker, which each link
sets for itself -- the same rule the other builds follow.

Idempotent, marked, and additive: it does not touch HUB_JS. On the hub it runs
after that block and simply sets the params the allowlist did not carry, which is
why the two do not fight. Re-running prints "already" and changes nothing.

    python carry-cdn-token.py           # patch every page
    python carry-cdn-token.py --dry     # say what would change, write nothing
"""

import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MARK = "ehel-g5-carry-cdn-token"

JS = """
<script>/* """ + MARK + """ - see carry-cdn-token.py
   Keep the launch AND the Bunny CDN token alive on every in-app link. The edge
   refuses a lesson document with no token, so a dropped param is a 403 rather
   than a silently unreported lesson. Carries everything except `from`, which
   each link sets for itself. */
  (function () {
    var src = new URLSearchParams(location.search);
    src.delete("from");
    if (!src.toString()) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var raw = a.getAttribute("href");
      if (!raw || /^(#|https?:|mailto:|javascript:)/i.test(raw)) return;
      var url;
      try { url = new URL(raw, location.href); } catch (e) { return; }
      if (url.origin !== location.origin) return;
      if (!/\\.html$/i.test(url.pathname)) return;
      src.forEach(function (v, k) { if (!url.searchParams.has(k)) url.searchParams.set(k, v); });
      a.setAttribute("href", url.pathname.split("/").pop() + "?" + url.searchParams.toString());
    });
  })();
</script>
"""

def main():
    dry = "--dry" in sys.argv
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    pages = [cfg["hub"]] + [l["file"] for l in cfg["lessons"]] + list(cfg.get("extraPages") or [])
    # extraPages carries non-documents too (lesson-search.json); only a document
    # can be refused by the edge, and only a document has links to rewrite.
    pages = [p for p in pages if p.lower().endswith(".html")]

    done = skipped = refused = 0
    for name in pages:
        path = os.path.join(HERE, name)
        if not os.path.exists(path):
            print("  REFUSED  %-34s not on disk" % name)
            refused += 1
            continue
        s = io.open(path, encoding="utf-8", newline="").read()
        if MARK in s:
            print("  already  %s" % name)
            skipped += 1
            continue
        if "</body>" not in s:
            # Anchoring on </body> matters: the script must run after the links
            # it rewrites exist in the DOM.
            print("  REFUSED  %-34s no </body> to anchor on" % name)
            refused += 1
            continue
        out = s.replace("</body>", JS + "</body>", 1)
        assert out.count(MARK) == 1
        if not dry:
            io.open(path, "w", encoding="utf-8", newline="").write(out)
        print("  %-8s %s" % ("would" if dry else "patched", name))
        done += 1

    print("\n%d patched, %d already, %d refused%s"
          % (done, skipped, refused, "  (dry run, nothing written)" if dry else ""))
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main())

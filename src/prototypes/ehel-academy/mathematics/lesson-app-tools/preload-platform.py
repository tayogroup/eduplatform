# -*- coding: utf-8 -*-
"""Start the platform work during HTML parsing instead of after it.

Grade 1 reported Class chat and Hand up taking up to 8 seconds to appear. They
are created only once the server has answered `watched`, so the delay is
everything that has to happen before that answer arrives. Measured there on a
cold load: modules start downloading 865ms, ready 1378ms, buttons 4440ms
(warm: 149 / 471). Two avoidable costs.

1. modulepreload. The <script type="module"> sits at the END of a ~120KB
   document, so the browser cannot see ./learner-controls.js - or the two files
   it imports - until it has parsed all of it. Declaring them in the head lets
   all three start with the stylesheet instead of after the last slide.

2. preconnect. The first call pays DNS, TLS and then a CORS preflight before
   the POST that actually asks the question. preconnect gets DNS and TLS out of
   the way while the page is still parsing. The preflight itself cannot be
   avoided from here - a cross-origin POST carrying Authorization always sends
   one - and shortening it would mean an Access-Control-Max-Age on the server.

Neither changes behaviour; both remove waiting.

The platform host is not known until run time (it arrives as ?pwsEndpoint), so
the preconnect is injected by script rather than hardcoded - a wrong host here
would be a preconnect to somebody else's server.

Idempotent.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

HEAD = """<link rel="modulepreload" href="./learner-controls.js">
<link rel="modulepreload" href="./wehel.js">
<link rel="modulepreload" href="./course-shell.js">
<script>
  /* preconnect to whichever platform the launch names: DNS and TLS happen
     while the page parses, instead of in front of the first POST */
  (function () {
    try {
      var ep = new URLSearchParams(location.search).get("pwsEndpoint");
      if (!ep) return;
      var origin = new URL(ep, location.href).origin;
      var l = document.createElement("link");
      l.rel = "preconnect"; l.href = origin; l.crossOrigin = "anonymous";
      document.head.appendChild(l);
    } catch (e) { /* a malformed pwsEndpoint must not stop the lesson loading */ }
  })();
</script>
"""

VIEWPORT = re.compile(r'<meta name="viewport"[^>]*>\n?')


def main():
    app = load()
    print("\n  Preloading the platform modules for %s %s\n" % (app.subject_label, app.grade_label))
    fails = 0
    for _, name, _ in app.lessons:
        s = app.read(name)
        if "modulepreload" in s:
            print("  skip %-26s already preloads" % name)
            continue
        if "mountLearnerControls" not in s:
            # preloading modules a page never imports is a download nobody uses
            print("  REFUSED %-24s not wired yet - run wire-platform-controls.py" % name)
            fails += 1
            continue
        m = VIEWPORT.search(s)
        if not m:
            print("  REFUSED %-24s no viewport meta to anchor to" % name)
            fails += 1
            continue
        app.write(name, s[:m.end()] + HEAD + s[m.end():])
        print("  ok   %s" % name)
    print("\n  %s\n" % ("all %d preload the platform modules" % len(app.lessons)
                        if not fails else "%d failed" % fails))
    sys.exit(1 if fails else 0)


main()

# -*- coding: utf-8 -*-
"""Start the platform work during HTML parsing instead of after it.

Reported as Class chat and Hand up taking up to 8 seconds to appear. They are
created only once the server has answered `watched`, so the delay is everything
that has to happen before that answer arrives. Measured on a cold load:

    modules start downloading   865ms   <- not discovered until the page is parsed
    modules ready              1378ms
    buttons appear             4440ms

and on a warm one, 149ms / 471ms. So the cold path carries two avoidable costs.

1. modulepreload. The <script type="module"> sits at the END of a ~170KB
   document, so the browser cannot see ./learner-controls.js - or the two files
   it imports - until it has parsed all of it. Declaring them in the head lets
   all three start with the stylesheet instead of after the last slide.

2. preconnect. The first call to the platform pays DNS, TLS and then a CORS
   preflight before the POST that actually asks the question. preconnect gets
   DNS and TLS out of the way while the page is still parsing.

Neither changes behaviour; both remove waiting. The preflight itself cannot be
avoided from here - a cross-origin POST carrying Authorization always sends one
- and shortening it would mean an Access-Control-Max-Age on the server.
"""
import re, io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.join(SP, "g1v2")
LESSONS = ["counting-to-twenty.html", "adding-and-taking-away.html",
           "halves-and-wholes.html", "what-comes-next.html",
           "shapes-and-sizes.html", "days-months-and-clocks.html",
           "asking-and-sorting.html"]

# The platform host is not known until run time (it arrives as ?pwsEndpoint), so
# the preconnect is injected by script rather than hardcoded - a wrong host here
# would be a preconnect to somebody else's server.
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

fails = 0
for name in LESSONS:
    p = os.path.join(V2, name)
    s = io.open(p, encoding="utf-8").read()
    if "modulepreload" in s:
        print("  skip %-30s already preloads" % name); continue
    # after the viewport meta, so it sits with the other head declarations
    m = re.search(r'<meta name="viewport"[^>]*>\n?', s)
    if not m:
        print("  REFUSED %-30s no viewport meta to anchor to" % name); fails += 1; continue
    s = s[:m.end()] + HEAD + s[m.end():]
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  ok   %s" % name)

print("\n%s" % ("all seven preload the platform modules" if not fails else "%d failed" % fails))
sys.exit(1 if fails else 0)

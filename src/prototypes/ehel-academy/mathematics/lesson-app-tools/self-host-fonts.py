# -*- coding: utf-8 -*-
"""Load a build's fonts from our own CDN instead of Google.

    python lesson-app-tools/self-host-fonts.py --app grade-1-app/g1v2          # report
    python lesson-app-tools/self-host-fonts.py --app grade-1-app/g1v2 --write

WHY. Every page carried <link href="https://fonts.googleapis.com/css2?...">, so
opening a lesson sent the learner's IP address, and the page they were on, to a
third party - a child's, on every page load. The platform already self-hosts its
brand fonts in app/shared/fonts/ (b55005d78); this replaces the Google link with
@font-face rules pointing there, in exactly the form english/shared/course-ui.css
already uses, so there is one way fonts are declared rather than two.

WHERE THE FILES ARE. src/prototypes/ehel-academy/shared/fonts/, served at
app/shared/fonts/. From app/<subject>/<build>/ the path ../../shared/fonts/ lands
there - the same relative path course-ui.css uses from app/english/shared/.

THE FILES MUST REACH THE CDN BEFORE THE PAGES THAT NAME THEM. deploy.mjs ships a
build's pages and modules and does NOT upload app/shared/fonts/, so a build
patched by this and deployed alone asks for fonts that are not there - it would
fall back to the next font in its stack, silently. Upload the woff2 files first.
And never fetch a font URL through the EDGE to see whether it is there: a miss
is cached, and on a font path it outlives any purge the key in .env can do. Ask
storage with the access key instead.

WHAT CHANGES ON SCREEN, stated because it is visible: the self-hosted Inter is
the variable 300-700 file. A page asking for weight 800 (Grade 1 does, in 67
places) now renders those at 700 - the brand's own three-weight scale, which the
self-hosting commit chose deliberately. Headings are a step lighter, not broken.

REFUSES a page that asks Google for a family this does not host, rather than
dropping it: a missing family would fall back without a word.
"""
import io, json, os, re, sys
from urllib.parse import parse_qs, urlparse

sys.stdout.reconfigure(encoding="utf-8")
argv = sys.argv[1:]
if "--app" not in argv:
    sys.exit("usage: self-host-fonts.py --app <build dir> [--write]")
APP = os.path.abspath(argv[argv.index("--app") + 1])
WRITE = "--write" in argv
for a in argv:
    if a.startswith("--") and a not in ("--app", "--write"):
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-self-hosted-fonts"
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.normpath(os.path.join(HERE, "..", "..", "shared", "fonts"))
URL = "../../shared/fonts/"

# family -> the @font-face rules for it, each naming a file that must exist
HOSTED = {
    "Atkinson Hyperlegible": [
        ("400", "AtkinsonHyperlegible-normal-400.woff2"),
        ("700", "AtkinsonHyperlegible-normal-700.woff2"),
    ],
    "Inter": [("300 700", "Inter-normal-300-700.woff2")],
}
missing = [f for faces in HOSTED.values() for _, f in faces
           if not os.path.exists(os.path.join(FONTS, f))]
if missing:
    sys.exit("REFUSED: font files not in %s: %s" % (FONTS, ", ".join(missing)))

LINK = re.compile(r'<link\s+rel="stylesheet"\s+href="(https://fonts\.googleapis\.com/css2\?[^"]+)"\s*/?>')


def faces_for(families):
    out = ["<style>/* %s: from our own CDN, not Google - see lesson-app-tools/self-host-fonts.py */" % MARK]
    for fam in families:
        for weight, fname in HOSTED[fam]:
            out.append('@font-face { font-family: "%s"; font-style: normal; font-weight: %s; '
                       'font-display: swap; src: url("%s%s") format("woff2"); }'
                       % (fam, weight, URL, fname))
    out.append("</style>")
    return "\n".join(out)


cfg = json.load(io.open(os.path.join(APP, "app.config.json"), encoding="utf-8"))
pages = [cfg["hub"]] + [l["file"] for l in cfg["lessons"]]
done = skipped = refused = 0
for f in pages:
    p = os.path.join(APP, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % f)
        skipped += 1
        continue
    links = LINK.findall(s)
    if len(links) != 1:
        print("  REFUSED  %s  expected one Google Fonts link, found %d" % (f, len(links)))
        refused += 1
        continue
    fams = [x.split(":")[0].replace("+", " ") for x in parse_qs(urlparse(links[0]).query)["family"]]
    unknown = [x for x in fams if x not in HOSTED]
    if unknown:
        print("  REFUSED  %s  asks Google for a family not hosted here: %s" % (f, ", ".join(unknown)))
        refused += 1
        continue
    s = LINK.sub(lambda m: faces_for(fams), s, count=1)
    if "fonts.googleapis.com" in s or "fonts.gstatic.com" in s:
        print("  REFUSED  %s  a Google font reference would remain" % f)
        refused += 1
        continue
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %s  (%s)" % ("wrote   " if WRITE else "would   ", f, ", ".join(fams)))
    done += 1

print("\n  %s: %d switched to self-hosted, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
if done and not WRITE:
    print("  reminder: upload app/shared/fonts/ BEFORE deploying pages that name it")
sys.exit(1 if refused else 0)

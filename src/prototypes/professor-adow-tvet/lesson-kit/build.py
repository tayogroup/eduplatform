#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Builds the Professor Adow TVET carpentry lesson pages and module hub.

    python build.py --app ../tools-and-joints-app            # lessons + hub
    python build.py --app ../tools-and-joints-app --hub-only

Modelled on ehel-academy/science/lesson-kit/build-lessons.py: the app
directory holds app.config.json and content/lesson-N.py and nothing that
draws a page; everything that draws lives here. It is LEAN rather than a
fork — the Science builder carries Cambridge stage codes, a
misconceptions file and objective floors, none of which exist here.

THE BUILD-TIME GATE. Every step names the performance criteria it
exercises, and this refuses a code the standards file does not publish.
That is the same guarantee the Science builder gives for Cambridge
codes, and it is the cheap half of the promise. The expensive half —
whether the step actually TEACHES the criterion — no machine here
checks, and check_coverage.py says so in as many words.
"""
import argparse
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))


def school_root(app_dir):
    """Walk up from an app to the directory holding school.config.json.

    The kit used to live inside carpentry/ and every app was its sibling,
    so `dirname(app_dir)` was the whole school. It is not any more:
    Shapes and Measurements is a CROSS-TRADE module and sits beside
    carpentry rather than inside it. Find the school properly."""
    here = app_dir
    for _ in range(6):
        if os.path.exists(os.path.join(here, "school.config.json")):
            return here
        here = os.path.dirname(here)
    die("no school.config.json above %s" % app_dir)


def die(message):
    sys.exit("REFUSED: " + message)


def load_standards(cfg):
    """The app names its own standards file. It used to be hard-coded to
    carpentry's, which a second module could not have used at all."""
    if not cfg.get("standards"):
        die("app.config.json names no \"standards\" file")
    standards = os.path.join(REPO, cfg["standards"].replace("/", os.sep))
    if not os.path.exists(standards):
        die("the standards file is missing: %s" % standards)
    with open(standards, encoding="utf-8") as fh:
        fw = json.load(fh)
    criteria = {}
    for mod in fw["modules"]:
        for unit in mod["units"]:
            for c in unit["criteria"]:
                criteria[c["code"]] = {
                    "text": c["text"],
                    "mode": c["assessmentMode"],
                    "unit": unit["code"],
                    "unitTitle": unit["title"],
                    "module": mod["key"],
                    "moduleTitle": mod["title"],
                }
    return fw, criteria


def load_lesson(path):
    sys.path.insert(0, HERE)
    spec = importlib.util.spec_from_file_location(
        "content_" + re.sub(r"\W", "_", os.path.basename(path)), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.path.pop(0)
    return module.LESSON


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


# The wording matters and the first version of it was wrong. Taking the
# weakest criterion is right for what the app may CLAIM, but read as a
# description of the STEP it said "Signed off at the bench" above a
# five-question assessment — which is false, and tells a learner the step
# they are doing does not count. These phrasings are the standards file's
# own: `practical` there is "the platform teaches and rehearses it;
# competence is assessed ONLY at the bench".
MODE_LABEL = {
    "knowledge": ("Assessed here", ""),
    "both": ("Assessed here · and at the bench", "both"),
    "practical": ("Practised here · bench sign-off", "bench"),
}


def step_mode(step, criteria):
    """The weakest claim any of a step's criteria allows. A step that
    touches one bench-only criterion is a bench step: claiming otherwise
    is exactly the over-claim the assessmentMode field exists to stop."""
    modes = [criteria[c]["mode"] for c in step["criteria"]]
    if "practical" in modes:
        return "practical"
    if "both" in modes:
        return "both"
    return "knowledge"


def render_step(n, step, criteria):
    label, cls = MODE_LABEL[step_mode(step, criteria)]
    codes = " ".join(
        '<code>%s</code>' % esc(c) for c in step["criteria"])
    out = []
    out.append('<section class="slide" data-step="%d" data-kind="%s" data-criteria="%s">'
               % (n, esc(step["kind"]), esc(",".join(step["criteria"]))))
    out.append('  <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>' % (n, esc(step["title"])))
    out.append('  <p><span class="carp-mode %s">%s</span></p>' % (cls, esc(label)))
    if step.get("ask"):
        out.append('  <p class="carp-caption">%s</p>' % esc(step["ask"]))
    out.append('  <div class="stage" data-mount="%d"></div>' % n)
    if step.get("error"):
        what, why = step["error"]
        out.append('  <div class="carp-error"><b>What goes wrong here</b>%s %s</div>'
                   % (esc(what), esc(why)))
    out.append('  <p class="carp-crit">%s</p>' % codes)
    out.append('</section>')
    return "\n".join(out)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · {school}</title>
<meta name="description" content="{blurb}">
<link rel="stylesheet" href="{lib}/lesson.css">
<link rel="stylesheet" href="{lib}/carpentry.css">
</head>
<body>
<a class="skip" href="#lesson">Skip to the lesson</a>
<div class="wrap">
  <div class="hero">
    <div>
      <p class="eyebrow">{module} · {level}</p>
      <h1>{h1}</h1>
    </div>
    <div class="dots" id="dots" role="tablist" aria-label="Steps"></div>
  </div>

  <section class="deck" id="lesson" tabindex="-1">
    <section class="slide active" data-step="0" data-kind="intro">
      <div class="slide-head"><span class="n">0</span><h2>What this lesson is about</h2></div>
      <p class="carp-caption">{blurb}</p>
      <p><b>By the end of this lesson you can:</b></p>
      <ol class="carp-order-done" style="color:var(--ink)">{outcomes}</ol>
      <div class="carp-error"><b>Where this leads</b>{leads}</div>
    </section>
{steps}
    <section class="slide" data-step="{last}" data-kind="end">
      <div class="slide-head"><span class="n">✓</span><h2>End of the lesson</h2></div>
      <p class="carp-caption">{endnote}</p>
      <div class="bigbtns"><a class="big teal" href="{hub}" style="text-decoration:none;display:grid;place-items:center">Back to the module</a></div>
    </section>
  </section>

  <div class="bigbtns" style="margin-top:18px">
    <button class="big ghost small" id="prev" type="button">Back</button>
    <button class="big" id="next" type="button">Next step</button>
  </div>
</div>
<script src="{lib}/carpentry.js"></script>
{extrascripts}
<script>
(function () {{
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var dots = document.getElementById('dots');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var at = 0;
  var reached = {{ 0: true }};
  var STEPS = {stepdata};

  slides.forEach(function (s, i) {{
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Step ' + i);
    b.addEventListener('click', function () {{ if (reached[i]) show(i); }});
    dots.appendChild(b);
  }});

  function paintDots() {{
    [].forEach.call(dots.children, function (b, i) {{
      b.className = i === at ? 'now' : (reached[i] && i < at ? 'done' : '');
    }});
  }}

  function show(i) {{
    slides[at].classList.remove('active');
    at = i;
    reached[i] = true;
    slides[at].classList.add('active');
    paintDots();
    prev.disabled = at === 0;
    next.textContent = at === slides.length - 1 ? 'Finished' : 'Next step';
    next.disabled = at === slides.length - 1;
    var mount = slides[at].querySelector('[data-mount]');
    if (mount && !mount.dataset.built) {{
      mount.dataset.built = '1';
      var spec = STEPS[slides[at].dataset.step];
      /* A step that throws used to leave EMPTY SPACE and a line in a
         console nobody has open — that is how a `label` pointing at a
         drawing with no parts shipped. The build gate can see a missing
         renderer; it cannot see bad data. So the page says so itself. */
      try {{
        if (!spec) throw new Error('no step data');
        if (!window.CARP.R[spec.kind]) throw new Error('no renderer for kind "' + spec.kind + '"');
        window.CARP.R[spec.kind](spec.data, mount, function () {{ mount.dataset.done = '1'; }});
      }} catch (err) {{
        mount.dataset.failed = '1';
        var warn = document.createElement('p');
        warn.className = 'fb bad';
        warn.textContent = 'This step did not render: ' + err.message;
        mount.appendChild(warn);
        if (window.console) console.error('step ' + slides[at].dataset.step, err);
      }}
    }}
    document.getElementById('lesson').focus({{ preventScroll: true }});
    window.scrollTo({{ top: 0, behavior: 'smooth' }});
  }}

  prev.addEventListener('click', function () {{ if (at > 0) show(at - 1); }});
  next.addEventListener('click', function () {{ if (at < slides.length - 1) show(at + 1); }});
  paintDots();
  prev.disabled = true;
}})();
</script>
</body>
</html>
"""


META_KINDS = {"intro", "end"}


def available_renderers(cfg):
    """Which step kinds the scripts THIS app loads actually define.

    Bought by a real failure: `sort` is defined in carpentry-foundation.js,
    a Tools & Joints page does not load that file, and the page JS skips a
    step kind it has no renderer for — silently, with no console error. A
    whole step rendered as empty space and the build said nothing.

    Reading the scripts is crude and it is the only thing that can see
    this: the builder cannot know what a browser will have loaded except
    by looking at what it is told to load."""
    kinds = set()
    for name in ["carpentry.js"] + list(cfg.get("extraScripts", [])):
        path = os.path.join(HERE, "lib", name)
        if not os.path.exists(path):
            die("app.config.json lists %s, which is not in lesson-kit/lib" % name)
        with open(path, encoding="utf-8") as fh:
            kinds.update(re.findall(r"^\s*R\.([a-zA-Z]+)\s*=", fh.read(), re.M))
    return kinds


def build_lesson(lesson, cfg, criteria, out_dir, lib, renderers):
    steps_html = []
    stepdata = {}
    for i, s in enumerate(lesson["steps"], start=1):
        if s["kind"] not in renderers and s["kind"] not in META_KINDS:
            die("%s step %d (%s) is of kind %r, which none of the scripts this app "
                "loads defines — it would render as empty space with no error. "
                "Scripts loaded: carpentry.js, %s"
                % (lesson["slug"], i, s["title"], s["kind"],
                   ", ".join(cfg.get("extraScripts", [])) or "(none)"))
        if not s["criteria"]:
            die("%s step %d (%s) names no criterion" % (lesson["slug"], i, s["title"]))
        for code in s["criteria"]:
            if code not in criteria:
                die("%s step %d names %s, which the standards file does not publish"
                    % (lesson["slug"], i, code))
        if s["kind"] == "safety":
            items = s["data"].get("items", [])
            if not any(not it["required"] for it in items):
                die("%s step %d is a safety step with no non-precaution in it — a "
                    "checklist you can finish by ticking everything teaches nothing"
                    % (lesson["slug"], i))
        steps_html.append(render_step(i, s, criteria))
        stepdata[str(i)] = {"kind": s["kind"], "data": s["data"]}

    last = len(lesson["steps"]) + 1
    leads = cfg.get("leadsNote", "")
    html = PAGE.format(
        title=esc(lesson["title"]),
        school=esc(cfg["school"]),
        blurb=esc(lesson["blurb"]),
        module=esc(cfg["moduleTitle"]),
        level=esc(cfg["levelLabel"]),
        h1=esc(lesson["title"]),
        outcomes="".join("<li>%s</li>" % esc(o) for o in lesson["outcomes"]),
        leads=esc(leads),
        steps="\n".join(steps_html),
        last=last,
        endnote=esc(cfg.get("endNote", "")),
        hub=esc(cfg["hub"]),
        lib=esc(lib),
        extrascripts="\n".join(
            '<script src="%s/%s"></script>' % (esc(lib), esc(f))
            for f in cfg.get("extraScripts", [])),
        stepdata=json.dumps(stepdata, ensure_ascii=False),
    )
    path = os.path.join(out_dir, lesson["slug"] + ".html")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)
    return path, stepdata


HUB = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{module} · {school}</title>
<link rel="stylesheet" href="{lib}/lesson.css">
<link rel="stylesheet" href="{lib}/carpentry.css">
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div>
      <p class="eyebrow">{school} · {level}</p>
      <h1>{module}</h1>
    </div>
  </div>

  <section class="deck" style="min-height:auto">
    <p class="carp-caption" style="text-align:left">{intro}</p>
    <div class="carp-error"><b>Where this leads</b>{leads}</div>

    <h2 style="margin-top:26px;font-size:26px">Lessons</h2>
    <div class="carp-checks" style="max-width:none">{lessons}</div>

    <h2 style="margin-top:30px;font-size:26px">What this module covers</h2>
    <p class="carp-caption" style="text-align:left">{coverage}</p>
    <div class="carp-checks" style="max-width:none">{units}</div>
  </section>
</div>
</body>
</html>
"""


def all_claimed(app_dir):
    """Criteria claimed by EVERY app in the carpentry prototype, not just
    this one. The two modules are one course to a learner, and a lesson
    freely cites criteria from the other module — the Tools & Joints
    lesson teaches five Carpentry Foundation criteria along the way. A
    hub that counted only its own app's lessons would under-report its
    own module and read as a bug."""
    claimed = set()
    for d, _dirs, files in os.walk(school_root(app_dir)):
        if "app.config.json" not in files:
            continue
        with open(os.path.join(d, "app.config.json"), encoding="utf-8") as fh:
            hub = json.load(fh)["hub"]
        for f in sorted(files):
            if not f.endswith(".html") or f == hub:
                continue
            with open(os.path.join(d, f), encoding="utf-8") as fh:
                html = fh.read()
            for m in re.finditer(r'data-criteria="([^"]*)"', html):
                claimed.update(c for c in m.group(1).split(",") if c)
    return claimed


def build_hub(lessons, cfg, fw, criteria, out_dir, lib):
    # Read back off the BUILT pages of every app, then add this app's own
    # lessons — which may not be written to disk yet on a --hub-only run.
    claimed = all_claimed(out_dir)
    for lesson in lessons:
        for s in lesson["steps"]:
            claimed.update(s["criteria"])

    rows = []
    for lesson in lessons:
        n_steps = len(lesson["steps"])
        rows.append(
            '<a class="carp-check" style="text-decoration:none" href="%s.html">'
            '<span class="box" aria-hidden="true"></span>'
            '<span class="txt"><b>%s</b><br><span style="color:var(--muted);font-size:16px">%s · %d steps</span></span></a>'
            % (esc(lesson["slug"]), esc(lesson["title"]), esc(lesson["blurb"]), n_steps))

    # A hub shows ITS OWN module's units. Listing all nine on both hubs
    # made each one look like it belonged to the other module too.
    mine = [m for m in fw["modules"] if m["key"] == cfg["module"]]
    if not mine:
        die('app.config.json module "%s" is not a module of the standards file' % cfg["module"])
    mod = mine[0]

    unit_rows = []
    total = built = 0
    for unit in mod["units"]:
        n = len(unit["criteria"])
        got = sum(1 for c in unit["criteria"] if c["code"] in claimed)
        total += n
        built += got
        state = "ok" if got == n else ""
        unit_rows.append(
            '<div class="carp-check %s"><span class="box" aria-hidden="true"></span>'
            '<span class="txt"><b>%s %s</b><br><span style="color:var(--muted);font-size:16px">'
            '%d of %d criteria taught</span></span></div>'
            % (state, esc(unit["code"]), esc(unit["title"]), got, n))

    whole = sum(len(u["criteria"]) for m in fw["modules"] for u in m["units"])
    whole_got = sum(1 for m in fw["modules"] for u in m["units"]
                    for c in u["criteria"] if c["code"] in claimed)
    if built == total:
        coverage = ("Every one of this module's %d performance criteria is taught. "
                    "Across both modules the prototype reaches %d of %d."
                    % (total, whole_got, whole))
    else:
        coverage = ("This prototype teaches %d of this module's %d performance criteria, "
                    "and %d of %d across both modules. The rest are written into the "
                    "standards and not yet taught — a prototype shows the shape, not the "
                    "whole course." % (built, total, whole_got, whole))

    html = HUB.format(
        module=esc(mod["title"]), school=esc(cfg["school"]), level=esc(cfg["levelLabel"]),
        intro=esc(cfg.get("hubIntro", "")), leads=esc(cfg.get("leadsNote", "")),
        lessons="".join(rows), units="".join(unit_rows), coverage=esc(coverage), lib=esc(lib))
    path = os.path.join(out_dir, cfg["hub"])
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)
    return path, built, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app", required=True)
    ap.add_argument("--hub-only", action="store_true")
    args = ap.parse_args()

    app_dir = os.path.abspath(os.path.join(os.getcwd(), args.app))
    with open(os.path.join(app_dir, "app.config.json"), encoding="utf-8") as fh:
        cfg = json.load(fh)
    fw, criteria = load_standards(cfg)
    lib = os.path.relpath(os.path.join(HERE, "lib"), app_dir).replace(os.sep, "/")

    lessons = []
    for entry in cfg["lessons"]:
        lessons.append(load_lesson(os.path.join(app_dir, "content", entry["content"])))

    renderers = available_renderers(cfg)
    if not args.hub_only:
        for lesson in lessons:
            path, _ = build_lesson(lesson, cfg, criteria, app_dir, lib, renderers)
            print("  lesson  %s  (%d steps)" % (os.path.basename(path), len(lesson["steps"])))

    path, built, total = build_hub(lessons, cfg, fw, criteria, app_dir, lib)
    print("  hub     %s" % os.path.basename(path))
    print("  criteria taught by this prototype: %d of %d" % (built, total))


if __name__ == "__main__":
    main()

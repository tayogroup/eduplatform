# -*- coding: utf-8 -*-
"""Verify wire-platform.py's wiring is intact: one topbar, the platform and
progress blocks both present, and the hub carries launch params forward.

    python check-platform-wiring.py

Not a claim that the controls RENDER - the same limit wire-platform.py's own
docstring names for G3/G4: hand-raise and Wehel need a real launch token and
(for hand-raise) a real server saying a teacher is watching, neither of which
exists outside a real launch. This proves the wiring is THERE and has not
been silently dropped by a later edit, the way check-lessons.py does for
every other grade.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))

WIRE_MARK = "ehel-g5-platform"
HUB_MARK = "ehel-g5-hub-launch-passthrough"

bad = 0
hub_s = io.open(os.path.join(HERE, cfg["hub"]), encoding="utf-8").read()
if HUB_MARK not in hub_s:
    print("  FAIL   %-30s no hub launch passthrough" % cfg["hub"])
    bad += 1
else:
    print("  ok     %-30s hub launch passthrough" % cfg["hub"])

for l in cfg["lessons"]:
    name = l["file"]
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8").read()
    findings = []
    if s.count(WIRE_MARK) < 2:
        findings.append("wiring marker present %d times, want >=2" % s.count(WIRE_MARK))
    if s.count('class="top-actions"') != 1:
        findings.append("%d .top-actions, want exactly 1" % s.count('class="top-actions"'))
    if "IntersectionObserver" not in s:
        findings.append("no IntersectionObserver - progress will never report")
    if "createProgressClient" not in s:
        findings.append("no createProgressClient import")
    if "mountLearnerControls" not in s:
        findings.append("no mountLearnerControls import")
    if "mountWehelChat" not in s:
        findings.append("no mountWehelChat import")
    steps = s.count('<section class="step"')
    if steps < 1:
        findings.append("no section.step found at all")
    if findings:
        print("  FAIL   %-30s %s" % (name, "; ".join(findings)))
        bad += 1
    else:
        print("  ok     %-30s %d step(s) wired" % (name, steps))

print("\n  %d finding(s)" % bad)
sys.exit(1 if bad else 0)

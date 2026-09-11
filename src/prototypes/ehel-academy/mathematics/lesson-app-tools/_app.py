# -*- coding: utf-8 -*-
"""One description of a standalone lesson build, read from app.config.json.

The Grade 1 tools each hardcoded `os.path.join(SP, "g1v2")` and a literal list
of seven filenames, which is the only reason they could not be pointed at
Grade 2. Nothing else in them was grade-specific. So the fix is not to copy
them: it is to move the two facts they hardcode into a file beside the lessons.

Usage from any tool here:

    from _app import load
    app = load()                 # --app <dir>, else the cwd, else argv[1]
"""
import io
import json
import os
import sys


class App(object):
    def __init__(self, root, cfg):
        self.root = root
        self.cfg = cfg
        self.grade = cfg["grade"]
        self.grade_label = cfg["gradeLabel"]
        self.subject = cfg["subject"]
        self.subject_label = cfg["subjectLabel"]
        self.from_param = cfg["fromParam"]
        self.back_label = cfg["backLabel"]
        self.hub = cfg["hub"]
        self.remote = cfg["remote"]
        # order IS the unit number, so a lesson's index is not a separate fact
        # that can drift from the one in the hub.
        #
        # UNLESS the entry says otherwise. Intensive English's units are
        # numbered from ZERO (u00 Letters and Sounds .. u19), and its lessons
        # map 1:1 onto them, so position + 1 would report every unit as the
        # next one along - a claim about the wrong unit in the gradebook and on
        # the group board. An entry may therefore carry its own "unit"; every
        # other app omits it and is unchanged.
        self.lessons = [
            (l.get("unit", i + 1), l["file"], l["title"]) for i, l in enumerate(cfg["lessons"])
        ]

    def path(self, name):
        return os.path.join(self.root, name)

    def read(self, name):
        return io.open(self.path(name), encoding="utf-8").read()

    def write(self, name, s):
        # newline="" so a tool never rewrites every line ending as a side
        # effect; this repo stores LF and .gitattributes checks LF out
        io.open(self.path(name), "w", encoding="utf-8", newline="").write(s)


def load(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    root = None
    if "--app" in argv:
        root = argv[argv.index("--app") + 1]
    elif argv and os.path.isdir(argv[0]):
        root = argv[0]
    else:
        here = os.getcwd()
        root = here if os.path.isfile(os.path.join(here, "app.config.json")) else None
    if not root:
        sys.exit(
            "No app.config.json. Run this from a lesson-app directory, or pass\n"
            "  --app ../grade-2-app"
        )
    p = os.path.join(root, "app.config.json")
    if not os.path.isfile(p):
        sys.exit("No app.config.json in %s" % root)
    cfg = json.load(io.open(p, encoding="utf-8"))
    missing = [n["file"] for n in cfg["lessons"] if not os.path.isfile(os.path.join(root, n["file"]))]
    if missing:
        # a config naming a file that is not there would otherwise let a tool
        # report "all N wired" having silently done fewer
        sys.exit("app.config.json names files that do not exist: " + ", ".join(missing))
    return App(root, cfg)

# -*- coding: utf-8 -*-
"""The vocabulary a Global Perspectives lesson module is written in.

A lesson is a dict: slug, title, blurb, steps - one dict per step, made by
step() below - and the four unit-shell fields (`about`, `lecture`, `words`,
`home`). Everything a step needs to render is in its `data`, in the shape the
renderer of that `kind` consumes (lib/gp.js). The builder checks the shapes;
this file only makes them easy to write.

The four-move explainer is the Mathematics build's own: NAME the idea, SHOW it
on this step's content, WARN about the slip children actually make here, HAND
back with one thing to try. Each move is a sibling <mstts:express-as>, never
nested - Azure forbids nesting and the voice walker flattens it.

This is the Computing kit's _kit.py with the subject's helpers swapped: a
Global Perspectives step is about people, questions and sources rather than
algorithms, so the small builders at the bottom make a person, a source, a
tagged option and a friend easy to write. The two kits are kept as separate
copies on purpose - see the README.
"""


def _attr(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("'", "&#39;"))


def _sentences(parts):
    return "".join("<s>" + _attr(p) + "</s>" for p in parts if p)


def explain(calm, friendly, watch, go):
    out = ""
    if calm:
        out += ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
                + _sentences(calm) + "</prosody></mstts:express-as>")
    if friendly:
        out += ('<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
                + _sentences(friendly) + "</mstts:express-as>")
    if watch:
        out += ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
                '<prosody rate="-6%">' + _sentences(watch) + "</prosody></mstts:express-as>")
    if go:
        out += ('<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
                + _sentences(go) + "</mstts:express-as>")
    return out


def step(kind, title, icon, sticker, objectives, ask, explain_ssml, data, done, say=None, note=""):
    """One step of a lesson.

    kind        which renderer draws it (see KINDS in build-lessons.py)
    title       the heading a child sees
    icon        the emoji on its sticker
    sticker     the sticker's caption, two or three words
    objectives  0838 codes of the app's stage this step exercises - checked
                against the framework at build time and reported by the gate
    ask         the instruction in the voice bar (HTML allowed)
    explain     the SSML mini-lesson behind the Explain button
    data        the renderer's own data
    done        the line spoken when the step is finished
    say         what the voice says on arrival, if not the plain `ask`
    note        an italic line under the stage, for practice-not-marked notes
    """
    return {
        "kind": kind, "title": title, "icon": icon, "sticker": sticker,
        "objectives": list(objectives), "ask": ask, "explain": explain_ssml,
        "data": data, "done": done, "say": say, "note": note,
    }


def opt(t, ok=False):
    return {"t": t, "ok": bool(ok)}


def q(ask, pic, right, wrongs, why):
    """A multiple-choice question: the right answer first, then the wrong ones."""
    return {"ask": ask, "pic": pic, "opts": [opt(right, True)] + [opt(w) for w in wrongs], "why": why}


# ---- the people, sources and tagged options the GP steps are written in --

def person(id_, name, pic, skills=None):
    """A classmate or family member: an id, a name and an emoji - and, for a
    team that allocates tasks (3Cc.01), the things they are good at."""
    out = {"id": id_, "name": name, "pic": pic}
    if skills:
        out["skills"] = list(skills)
    return out


def glyph(pic, kind, label):
    """One thing in a scene to observe and count (3Rc.01)."""
    return {"pic": pic, "kind": kind, "label": label}


def slot(id_, label, hint):
    """One part of a structured talk: start, middle, end (3Mi.01)."""
    return {"id": id_, "label": label, "hint": hint}


def task(id_, t, pic, needs):
    """A job a team has to give to somebody: what it needs is a skill (3Cc.01)."""
    return {"id": id_, "t": t, "pic": pic, "needs": needs}


def tagged(t, about, pic=""):
    """An option that carries a TOPIC TAG rather than a right/wrong flag. The
    renderer decides whether it is relevant by comparing the tag with the
    round's topic, and the builder and the gate compute the same thing - so
    relevance is never an authored claim (1Mi.01, 1Ml.01, 1Ap.01, 1Ea.01)."""
    return {"t": t, "about": about, "pic": pic}


def source(id_, label, pic, about, say):
    """Something a child can find information in: a book, a photo, a map, an
    object. `about` is the list of topic tags it can tell you about."""
    return {"id": id_, "label": label, "pic": pic, "about": list(about), "say": say}


def spot(id_, label, fact, x, y, glyph, size=34):
    """A hotspot on a picture source: where it sits, what it shows, the fact
    it tells (1Ri.01)."""
    return {"id": id_, "label": label, "fact": fact, "x": x, "y": y, "glyph": glyph, "size": size}


def action(id_, t, pic, effect, say):
    """One of the actions a child can choose for an issue. `effect` is what it
    does to the issue; the solution is whichever action's effect is what the
    issue needs, computed by _rules.py rather than keyed (1As.01)."""
    return {"id": id_, "t": t, "pic": pic, "effect": effect, "say": say}


# ---- the unit shell: written beside the steps, drawn by _shell.py ----------

def part(pic, title, say):
    """One part of the unit lecture: a picture, a heading, and what the voice says."""
    return {"pic": pic, "title": title, "say": say}


def word(w, pic, meaning, uses, say=None):
    """A Global Perspectives word: the word, its picture, what it means, and sentences that use it.

    `say` is what the voice reads in place of the bare word, for a word a voice
    reads as the wrong part of speech on its own: "record" and "present" are
    taught as verbs, and alone both are read as nouns (REcord, PREsent). The
    card still shows the word; only the voice gets "to record"."""
    out = {"w": w, "pic": pic, "meaning": meaning, "uses": list(uses)}
    if say:
        out["say"] = say
    return out


def home(title, materials, steps, look):
    """A project to do at home with a grown-up: what you need, what to do, and what to look for."""
    return {"title": title, "materials": materials, "steps": list(steps), "look": look}

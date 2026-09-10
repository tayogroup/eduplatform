# -*- coding: utf-8 -*-
"""The vocabulary a Computing lesson module is written in.

A lesson is a dict: slug, title, blurb, steps - one dict per step, made by
step() below - and the four unit-shell fields (`about`, `lecture`, `words`,
`home`). Everything a step needs to render is in its `data`, in the shape the
renderer of that `kind` consumes (lib/computing.js). The builder checks the
shapes; this file only makes them easy to write.

The four-move explainer is the Mathematics build's own: NAME the idea, SHOW it
on this step's content, WARN about the slip children actually make here, HAND
back with one thing to try. Each move is a sibling <mstts:express-as>, never
nested - Azure forbids nesting and the voice walker flattens it.

This is the Science kit's _kit.py with the word "science" taken out. The two
kits are kept as separate copies on purpose - see the README.
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
    objectives  0059 codes of the app's stage this step exercises - checked
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


# ---- the algorithms the computing steps are written in -------------------

def s(id_, label, pic, say=None):
    """One step of an everyday algorithm: an id the scene draws, the words a
    child reads, a picture, and what the voice says when it is done."""
    return {"id": id_, "label": label, "pic": pic, "say": say or label + "."}


def choice(id_, t, ok=False, pic=""):
    """An option that carries an id - for a fix, a replacement step, a way."""
    return {"id": id_, "t": t, "ok": bool(ok), "pic": pic}


# ---- the unit shell: written beside the steps, drawn by _shell.py ----------

def part(pic, title, say):
    """One part of the unit lecture: a picture, a heading, and what the voice says."""
    return {"pic": pic, "title": title, "say": say}


def word(w, pic, meaning, uses):
    """A computing word: the word, its picture, what it means, and sentences that use it."""
    return {"w": w, "pic": pic, "meaning": meaning, "uses": list(uses)}


def home(title, materials, steps, look):
    """An unplugged project to do at home: what you need, what to do, and what to look for."""
    return {"title": title, "materials": materials, "steps": list(steps), "look": look}

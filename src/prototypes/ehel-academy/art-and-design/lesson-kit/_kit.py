# -*- coding: utf-8 -*-
"""The vocabulary an Art & Design lesson module is written in.

A lesson is a dict: slug, title, blurb, steps - one dict per step, made by
step() below - and the four unit-shell fields (`about`, `lecture`, `words`,
`home`). Everything a step needs to render is in its `data`, in the shape the
renderer of that `kind` consumes (lib/art.js). The builder checks the shapes;
this file only makes them easy to write.

The four-move explainer is the Mathematics build's own: NAME the idea, SHOW it
on this step's content, WARN about the slip children actually make here, HAND
back with one thing to try. Each move is a sibling <mstts:express-as>, never
nested - Azure forbids nesting and the voice walker flattens it.

This is the Global Perspectives kit's _kit.py with the subject's helpers
swapped: an Art & Design step is about paint pots, materials, marks and
artworks rather than questions and sources, so the small builders at the
bottom make a pot, a material, a swatch, a change and a work easy to write.
The two kits are kept as separate copies on purpose - see the README.
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
    objectives  0067 codes of the app's stage this step exercises (1E.01 ...)
                - checked against the framework at build time and reported
                by the gate
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


# ---- the pots, materials, swatches, works and changes the art steps use --

def pot(id_, label=None):
    """A paint pot: its colour name is its id; the hex comes from _rules.HEX."""
    return {"id": id_, "label": label or id_}


def swatch(id_, label, hex_, say=None):
    """A colour swatch for the tone ladder: the page orders by its lightness."""
    return {"id": id_, "label": label, "hex": hex_, "say": say}


def material(id_, label, pic, props, say):
    """Something to make with: what it is like (`props` - rough, smooth,
    soft, shiny, bendy, strong...) decides what it fits, computed (M.02)."""
    return {"id": id_, "label": label, "pic": pic, "props": list(props), "say": say}


def change(id_, t, pic, effect, say):
    """One change a child can make to a piece with a problem. `effect` is
    what it does; the refinement is whichever change's effect is what the
    problem needs, computed by _rules.py rather than keyed (TWA.03)."""
    return {"id": id_, "t": t, "pic": pic, "effect": effect, "say": say}


def work(id_, title, scene, features, owner=None, owner_pic=None, pic=None, state=None):
    """An artwork: drawn by a scene in lib/art.js (or an emoji), carrying the
    feature tags a child can find in it - "red", "wavy lines", "a sun" -
    which is what comparisons and kind comments are computed against.
    `owner` and `owner_pic` name the friend who made it, for a kind comment."""
    return {"id": id_, "title": title, "scene": scene, "features": list(features),
            "owner": owner, "ownerPic": owner_pic, "pic": pic, "state": state}


def comment(t, about):
    """A celebratory comment that names one thing (`about`) in a work."""
    return {"t": t, "about": about}


def spot(id_, label, fact, x, y, glyph, size=34):
    """A hotspot on a picture: where it sits, what it shows, the fact it
    tells (E.01)."""
    return {"id": id_, "label": label, "fact": fact, "x": x, "y": y, "glyph": glyph, "size": size}


# ---- the unit shell: written beside the steps, drawn by _shell.py ----------

def part(pic, title, say):
    """One part of the unit lecture: a picture, a heading, and what the voice says."""
    return {"pic": pic, "title": title, "say": say}


def word(w, pic, meaning, uses):
    """An art word: the word, its picture, what it means, and sentences that use it."""
    return {"w": w, "pic": pic, "meaning": meaning, "uses": list(uses)}


def home(title, materials, steps, look):
    """A project to make at home with a grown-up: what you need, what to do, and what to look for."""
    return {"title": title, "materials": materials, "steps": list(steps), "look": look}

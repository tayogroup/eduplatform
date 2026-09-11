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

# ---- drawn pictures that need no emoji font --------------------------------
# A 2019 emoji (Emoji 12.0) is an empty box on a tablet older than Android 10
# or iOS 13. Where the colour IS the content - a tower's bricks, traffic
# lights - the picture is drawn instead, in the scene's own colours; the page
# paints any pic that begins with <svg as it stands. Games and sorts carry
# pictures as text, so a question's or a sort item's pic stays an emoji.
SWATCH = {
    "brick": '<svg viewBox="0 0 28 28" width="28" height="28"><rect x="3" y="8" width="22" height="13" rx="3" fill="{a}" stroke="#0B1D2C" stroke-width="1.5"/></svg>',
    "square": '<svg viewBox="0 0 28 28" width="28" height="28"><rect x="4" y="4" width="20" height="20" fill="{a}" stroke="#0B1D2C" stroke-width="1.5"/></svg>',
    "disc": '<svg viewBox="0 0 28 28" width="28" height="28"><circle cx="14" cy="14" r="10" fill="{a}" stroke="#0B1D2C" stroke-width="1.5"/></svg>',
    "discs": ('<svg viewBox="0 0 48 28" width="48" height="28"><circle cx="13" cy="14" r="10" fill="{a}" stroke="#0B1D2C" stroke-width="1.5"/>'
              '<circle cx="35" cy="14" r="10" fill="{b}" stroke="#0B1D2C" stroke-width="1.5"/></svg>'),
    "soil": ('<svg viewBox="0 0 28 28" width="28" height="28"><path d="M3 21 Q8 11 14 14 Q20 9 25 21 Z" fill="#7A4B2A"/>'
             '<rect x="3" y="20" width="22" height="5" rx="2" fill="#8B5A2B"/></svg>'),
    "butter": ('<svg viewBox="0 0 28 28" width="28" height="28"><path d="M6 11 l4-4 h14 l-4 4z" fill="#FFF1B8" stroke="#C9A227" stroke-width="1.2"/>'
               '<rect x="4" y="11" width="16" height="10" rx="1.5" fill="#FBE08A" stroke="#C9A227" stroke-width="1.2"/>'
               '<path d="M20 11 l4-4 v10 l-4 4z" fill="#F1CF6A" stroke="#C9A227" stroke-width="1.2"/></svg>'),
}


def swatch(kind, a="", b=""):
    """A drawn picture: swatch("brick", "#E9744F"), swatch("discs", red, amber), swatch("soil")."""
    return SWATCH[kind].replace("{a}", a).replace("{b}", b)


def part(pic, title, say):
    """One part of the unit lecture: a picture, a heading, and what the voice says."""
    return {"pic": pic, "title": title, "say": say}


def word(w, pic, meaning, uses):
    """A computing word: the word, its picture, what it means, and sentences that use it."""
    return {"w": w, "pic": pic, "meaning": meaning, "uses": list(uses)}


def home(title, materials, steps, look):
    """An unplugged project to do at home: what you need, what to do, and what to look for."""
    return {"title": title, "materials": materials, "steps": list(steps), "look": look}

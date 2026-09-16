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


def step(kind, title, icon, sticker, objectives, ask, explain_ssml, data, done, say=None, note="", ct=""):
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
    ct          which computational-thinking characteristic this step is,
                named on a chip beside the heading - one of CT_MOVES. Cambridge
                labels one task per unit that way and says which skill it
                exercises; this build did all four and named none of them. A
                chip is not a step, so nothing moves.
    """
    if ct and ct not in CT_MOVES:
        raise ValueError("unknown computational-thinking move %r (one of %s)"
                         % (ct, ", ".join(sorted(CT_MOVES))))
    return {
        "kind": kind, "title": title, "icon": icon, "sticker": sticker,
        "objectives": list(objectives), "ask": ask, "explain": explain_ssml,
        "data": data, "done": done, "say": say, "note": note, "ct": ct,
    }


# The four moves Cambridge names, in the words its own Learner's Books use.
# Held here so the builder and the gate read the same list and a typo is a
# build failure rather than a chip nobody notices is wrong.
CT_MOVES = {
    "Decomposition": "breaking a task into smaller parts",
    "Pattern recognition": "spotting what repeats",
    "Abstraction": "keeping what matters and leaving out the rest",
    "Algorithmic thinking": "writing the steps in an order that works",
    "Logical thinking": "working out what must be true",
    "Evaluation": "judging which way is better",
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


def cando(text, code):
    """One "I can..." claim for the self-check on the sticker shelf.

    Cambridge closes every unit of all four Learner's Books with a
    `What can you do?` list. `code` is the objective the claim is about; the
    builder resolves it to the FIRST step of this lesson that carries that
    code and puts a "Show me" button beside the claim, so the route is derived
    rather than a step number written down - a step number would rot the
    moment anything moved.

    It lives on the sticker shelf, which is not a step, so nothing here moves
    a saved place and no completed check reopens.
    """
    return {"t": text, "code": code}


def place(pic, title, say):
    """One card of Computing world: a picture, where it is, and what happens there."""
    return {"pic": pic, "title": title, "say": say}


def world(fact, places, look):
    """Computing world - the step that used to say it was not built yet.

    `fact`   the "Did you know?" line, in the shape all four Cambridge books
             use it: one surprising true thing, told in a sentence or two.
    `places` two to four cards - a real place, a real job, a real machine -
             where this lesson's computing is at work outside the screen.
    `look`   one thing near the child they can go and look at today.
    """
    return {"fact": fact, "places": list(places), "look": look}

def label_ct(lesson, title, move):
    """Name the computational-thinking move one step of this lesson exercises.

    Written beside the content rather than inside the step() call so a label
    can be added to a lesson that already exists without touching the step -
    and it fails loudly on a title that is not there, which a silently
    unlabelled step would not.
    """
    for s in lesson["steps"]:
        if s["title"] == title:
            if move not in CT_MOVES:
                raise ValueError("unknown computational-thinking move %r" % move)
            s["ct"] = move
            return
    raise ValueError("no step titled %r in this lesson" % title)


def tier(lesson, support=(), extension=()):
    """Cambridge's "Go further" and "Challenge yourself!", on the lesson's check.

    support    NARROWS the same task, and arrives the first time a core
               question is answered wrongly.
    extension  WIDENS it, and is offered after the core bank to a child who
               finished with at most one slip.

    Neither is scored and finish() still fires at the end of the core bank, so
    no step, position or completed check moves.
    """
    last = lesson["steps"][-1]
    if last["kind"] != "quiz":
        raise ValueError("the last step of this lesson is %r, not the quiz" % last["kind"])
    if support:
        last["data"]["support"] = list(support)
    if extension:
        last["data"]["extension"] = list(extension)

def talk(opener, after):
    """The two prompts a grown-up runs OUT LOUD, either side of the lesson.

    Cambridge opens every unit with `Get started!` - a question for a pair or a
    small group, before any teaching - and its tasks are full of "discuss with
    your partner" and "explain to a classmate". Measured across Stages 2 to 4
    the books say "in pairs / in groups" 162 times and "discuss / explain to
    somebody" 86 times, and a self-contained page can present none of it: it
    cannot hear an answer and cannot know the talking happened.

    So these live on the PRINTABLE teachers' page, not in the lesson. They are
    the half of Cambridge the app hands back to the adult, which is what the
    teaching-spine decision assumes somebody is doing.

    opener  before any teaching: what do they already think?
    after   once the lesson is done: what can they now say that they could not?
    """
    return {"opener": opener, "after": after}

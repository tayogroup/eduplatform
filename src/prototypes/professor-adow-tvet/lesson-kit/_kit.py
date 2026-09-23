# -*- coding: utf-8 -*-
"""The vocabulary a carpentry lesson is written in.

Modelled on ehel-academy/science/lesson-kit/_kit.py — same idea, one
function per thing a content file needs to say — but the verbs are the
trade's and every step names the performance criteria it exercises,
from src/curriculum/adow-carpentry-foundation.json.

STEP KINDS, and what the learner does:

    label       taps the named part of a drawn tool
    safety      works through a checklist that contains non-precautions
    order       puts the stages of a job into the order they happen
    demo        presses through a drawn sequence that changes state
    predict     chooses an outcome, then sees it drawn
    build       brings two members together and watches the joint close
    questions   answers, and is given the reason either way
    words       reads the trade vocabulary of the lesson

`safety` is the one kind Science has no equivalent of. It exists
because carpentry without it would look wrong to any assessor, and
because a checklist you can finish by ticking everything teaches
nothing — so a safety step MUST carry at least one item that is not a
precaution. build.py refuses one that does not.
"""


def step(kind, title, criteria, data, ask=None, error=None, done=None):
    """One step of a lesson.

    criteria: the performance-criterion codes this step exercises, e.g.
              ["ADOW-CJ-TJ.02.2"]. build.py refuses a code the standards
              file does not publish, and the coverage gate reads these
              back off the BUILT page.
    error:    what apprentices actually get wrong here, as (what, why).
              This is the slot that makes a page read as trade-written.
    """
    return {
        "kind": kind,
        "title": title,
        "criteria": list(criteria),
        "ask": ask,
        "data": data,
        "error": error,
        "done": done,
    }


def opt(t, ok=False, why=None):
    """One answer option. `why` is shown when THIS option is chosen, so a
    wrong answer can be corrected on its own terms rather than being told
    the right answer's reason."""
    return {"t": t, "ok": bool(ok), "why": why}


def q(ask, opts, why):
    """A question. `why` is the reason shown for the correct answer."""
    return {"ask": ask, "opts": opts, "why": why}


def check(text, required, why):
    """One line of a safety checklist. required=False marks an item that
    is NOT a precaution — ticking it is corrected."""
    return {"text": text, "required": bool(required), "why": why}


def word(w, meaning):
    return {"word": w, "meaning": meaning}

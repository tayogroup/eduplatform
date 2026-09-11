# -*- coding: utf-8 -*-
"""The unit shell: the steps every Art & Design lesson gets AROUND its own.

The same furniture the Science, Computing and Global Perspectives kits'
_shell.py draw (owner, 2026-09-10, for every standalone build): what the unit
is about, a lecture, the unit's words with a picture, a meaning and sample
uses, a games step, things to make at home, a student-resources drawer - plus
a placeholder for "Our world", which is not built yet and says so.

ONE STEP IS THIS SUBJECT'S OWN: "My journal". The framework's Stage 1-2 text
says experiences are celebrated "through recording, such as by making marks
to capture ideas, and by revisiting these recordings in later contexts"
(R.01) and that "simple ways that work may be refined are identified and
shared throughout the process" (TWA.03) - the visual journal is the thing
that carries both. So every lesson ends its own steps with a journal drawn
here: the page's OWN record of what the child made (a colour mixed, a mark
made, a pattern, a material chosen, a piece refined), the order they made
them in, and what they would change next time - the last never marked. A
lesson that authors its own `journal` step (Lesson 8 looks back over the
whole course) keeps that one and gets no second.

The content module writes four things (`about`, `lecture`, `words`, `home`,
in the vocabulary of _kit.py) and this file turns them into steps, in one
place, so the lesson builder and the hub builder cannot disagree about how
many steps a lesson has or what they are called:

    overview  lecture  words  <the lesson's own steps ...>  journal  games  home  quiz  world  resources

The games are DERIVED, not written: a quick quiz from the lesson's own
questions, a sort race from its sort and compare steps, a colour quiz from
its mixing rounds (the answers computed by _rules.mix), word pairs and a
spelling game from its words. Nothing in a game is new, which is the rule the
English build's own Game Zone keeps.

Two steps teach nothing and so name no objective: `world` (a placeholder) and
`resources` (a drawer). Every other shell step carries the codes of the lesson
it wraps, because that is what it is about - except the journal, which
carries its own two. The coverage gate counts codes per lesson as a SET.

"Make it at home" is hands-on on purpose: the screen can mix paint and judge
a line, but it cannot BE paint, and the framework's Stage 1 learner is
touching, feeling and experiencing materials. So a home project here is real
paint, a real rubbing, real pebbles, a real cloth - never a worksheet.
"""
import re

from _kit import explain, step
from _rules import mix, journal_fallback

# steps that teach nothing and therefore name no objective
META_KINDS = {"world", "resources"}


def journal_codes(stage):
    """The journal's own codes: celebrate (R.01) and review and refine
    (TWA.03), at the app's stage."""
    return ["%dR.01" % int(stage), "%dTWA.03" % int(stage)]


# what a child might change next time, when the lesson does not write its own
DEFAULT_CHANGES = [
    "make it bigger",
    "use a different colour",
    "add more marks",
    "try a different tool",
    "keep it just as it is",
]


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


def lesson_codes(lesson):
    out = []
    for s in lesson["steps"]:
        for c in s["objectives"]:
            if c not in out:
                out.append(c)
    return out


# ----------------------------------------------------------------------
# the games, derived from the lesson's own content
# ----------------------------------------------------------------------
def games_pack(n, lesson):
    games = []
    words = lesson.get("words") or []

    # Quick quiz: the lesson's practice questions (its quiz only where it
    # has no separate questions step - the quiz is the check, not a game).
    qsteps = [s for s in lesson["steps"] if s["kind"] == "questions"] or \
             [s for s in lesson["steps"] if s["kind"] == "quiz"]
    for k, s in enumerate(qsteps):
        rounds = []
        for it in s["data"]["items"]:
            right = next(o["t"] for o in it["opts"] if o["ok"])
            rounds.append({"prompt": plain(it["ask"]), "choices": [o["t"] for o in it["opts"]],
                           "answer": right, "explanation": it.get("why") or right})
        if len(rounds) >= 3:
            games.append({"id": "l%d-quiz-%d" % (n, k + 1), "type": "choice",
                          "title": "Quick quiz: " + plain(s["title"]), "skill": "Remembering",
                          "rounds": rounds[:8]})

    # Sort race: where does each thing go?
    for k, s in enumerate([s for s in lesson["steps"] if s["kind"] == "sort"]):
        d = s["data"]
        bins = {b["id"]: b["label"] for b in d["bins"]}
        rounds = [{"prompt": "Where should " + it["label"] + " go? " + (it.get("pic", "") if not str(it.get("pic", "")).startswith("<") else ""),
                   "choices": [bins[b] for b in bins], "answer": bins[it["bin"]],
                   "explanation": it.get("why") or bins[it["bin"]]} for it in d["items"]]
        if len(rounds) >= 3:
            games.append({"id": "l%d-sort-%d" % (n, k + 1), "type": "choice",
                          "title": "Sort race: " + plain(s["title"]), "skill": "Sorting",
                          "rounds": rounds[:8]})

    # Colour quiz: what do these two paints make? Answers computed, never typed.
    for k, s in enumerate([s for s in lesson["steps"] if s["kind"] == "mix"]):
        d = s["data"]
        made = [(rd["a"], rd["b"], mix(rd["a"], rd["b"])) for rd in d["rounds"]]
        made = [m for m in made if m[2]]
        names = sorted({m[2] for m in made} | {p["id"] for p in d["pots"]})
        rounds = []
        for a, b, c in made:
            others = [x for x in names if x != c][:3]
            rounds.append({"prompt": "What do %s and %s make?" % (a, b), "choices": [c] + others,
                           "answer": c, "explanation": "%s and %s make %s." % (a.capitalize(), b, c)})
        if len(rounds) >= 3:
            games.append({"id": "l%d-mix-%d" % (n, k + 1), "type": "choice",
                          "title": "Colour quiz", "skill": "Mixing", "rounds": rounds[:8]})

    # Word pairs: the word and what it means, three pairs a round.
    if len(words) >= 3:
        rounds = []
        for i in range(0, len(words) - len(words) % 3, 3):
            trio = words[i:i + 3]
            rounds.append({"prompt": "Match each word to what it means.",
                           "pairs": [[w["w"], w["meaning"]] for w in trio]})
        if rounds:
            games.append({"id": "l%d-pairs" % n, "type": "pairs", "title": "Word pairs",
                          "skill": "Art words", "rounds": rounds})

    # Spell it: one-word terms of eight letters or fewer, from the meaning.
    spell = [w for w in words if re.fullmatch(r"[A-Za-z]{3,8}", w["w"])]
    if len(spell) >= 3:
        games.append({"id": "l%d-spell" % n, "type": "spelling", "title": "Spell the art word",
                      "skill": "Art words",
                      "rounds": [{"prompt": w["meaning"], "clue": "It starts with " + w["w"][0].lower() + ". " + w.get("pic", ""),
                                  "answer": w["w"].lower()} for w in spell[:6]]})
    return games


# ----------------------------------------------------------------------
# the journal, drawn from the lesson's own making steps
# ----------------------------------------------------------------------
def journal_step(lesson, core, cfg):
    stage = int(cfg.get("stage") or 1)
    jn = lesson.get("journal") or {}
    changes = list(jn.get("changes") or DEFAULT_CHANGES)
    fallback = journal_fallback(core)
    return step("journal", "My journal", "\U0001F4D2", "My journal", journal_codes(stage),
                "Look back at what you made today. Which did you make first? What would you change next time?",
                explain(
                    ["An artist keeps a journal.", "It holds what you made, so you can look at it again and think about it."],
                    ["Here is what you made today.", "First: tap them in the order you made them.",
                     "Then: pick one, and say what you would change next time.", "There is no wrong answer to that."],
                    ["Children think changing something means it was bad.", "It was not bad. Artists change things to make them even better."],
                    ["Tap the thing you made first."]),
                {"scope": "lesson", "fallback": fallback, "changes": changes},
                "You looked back at what you made and said what you would change. That is what artists do.")


# ----------------------------------------------------------------------
# the shell steps
# ----------------------------------------------------------------------
def expand(n, lesson, code_text, finder, cfg):
    """The full ordered step list for lesson n: the shell around the content.

    code_text   {code: objective text} for the stage
    finder      every word of every lesson in this grade, for the word finder
    cfg         the app's config (hub file, strands, grade label)
    """
    core = list(lesson["steps"])
    codes = lesson_codes(lesson)
    words = lesson.get("words") or []
    home = lesson.get("home") or []
    about = lesson.get("about") or []
    lecture = lesson.get("lecture") or []
    games = games_pack(n, lesson)

    overview = step("overview", "What this lesson is about", "\U0001F9ED", "I know what it is for", codes,
                    "What you will be able to do by the end.",
                    explain(
                        ["This is what this lesson is for."],
                        ["Read the list, or press Read it to me.",
                         "Every one of them is something you will be able to DO."],
                        ["You do not have to be able to do them yet.", "That is what the lesson is for."],
                        ["Have a read, then start."]),
                    {"about": about,
                     "counts": {"steps": 0, "words": len(words), "games": len(games), "home": len(home)}},
                    "Now you know what this lesson is for. Off you go.")

    lec = step("lecture", "Unit lecture", "\U0001F3AC", "I heard the lesson", codes,
               "Listen to the lesson, one part at a time. Press Next part when you are ready.",
               explain(
                   ["This is the lesson, told to you before you do it."],
                   ["Listen to each part.", "Look at the picture while you listen.",
                    "Press Next part to go on, and Listen again to hear it twice."],
                   ["Listening is not the same as hearing.", "Sit still, and actually listen."],
                   ["Press Listen."]),
               {"parts": lecture},
               "That is the whole lesson in " + str(len(lecture)) + " parts. Now do it yourself.")

    wds = step("words", "Art words", "\U0001F524", "Art words", codes,
               "Tap each word to hear what it means and how to use it. Then show you know them.",
               explain(
                   ["These are the art words in this lesson.", "They are the words artists use when they make things and talk about them."],
                   ["Tap a word.", "You will see its picture, hear what it means, and hear it used in a sentence.",
                    "When you have heard them all, the page asks which word is which."],
                   ["An art word often means something very exact.",
                    "Listen to the meaning, not just the word."],
                   ["Tap the first word."]),
               {"items": words},
               "You know the art words of this lesson.")

    gz = step("games", "Games", "\U0001F3AE", "I played the games", codes,
              "Choose a game to play. Nothing here is new.",
              explain(
                  ["This is the lesson's own game zone."],
                  ["Tap a game to play it.", "Each game asks a few short questions about this lesson.",
                   "Play two games to earn the sticker, and as many as you like after that."],
                  ["Getting one wrong costs nothing here.", "A game is for practising, not for marking."],
                  ["Pick a game and play."]),
              {"games": games, "mastery": 2},
              "You played the games. That is the lesson practised twice over.")

    hm = step("home", "Make it at home", "\U0001F3E0", "Make it at home", codes,
              "A screen cannot be paint. Make one of these for real, with a grown-up.",
              explain(
                  ["These are things to make at home, with a grown-up.",
                   "Real paint, real paper, real things to touch. That is what art is."],
                  ["Read one, or press the speaker to hear it.", "Get the things it needs.",
                   "Make it, and look for the thing it tells you to look for."],
                  ["Cover the table first, and roll up your sleeves.",
                   "Messy is fine. Mess on the sofa is not."],
                  ["Pick a project and tick it when you have made it."]),
              {"items": [dict(h, n=i + 1) for i, h in enumerate(home)],
               # for the printed sheet's heading
               "lesson": lesson["title"], "lessonNo": n, "gradeLabel": cfg.get("gradeLabel") or ""},
              "Making it at home. That is the best kind of art.")

    world = step("world", "Our world", "\U0001F30D", "Our world", [],
                 "Where art like this is made out in the real world. This part is still being built.",
                 explain(
                     ["Our world is not built yet."],
                     ["It will show where this lesson's art is made out in the real world.",
                      "Places you can visit, people who make things for a living, and art near you to go and look at."],
                     ["There is nothing to do here yet.", "It ticks itself off."],
                     ["Press Next."]),
                 {"title": lesson["title"],
                  "soon": ["Real places where art is made and shown.",
                           "People who paint, weave, build and design for a living.",
                           "Art near you to go and look at."]},
                 "Our world is on its way.")

    res = step("resources", "Student resources", "\U0001F5C2️", "My resources", [],
               "Your word list, the word finder, your home projects, and a page for your grown-up.",
               explain(
                   ["This is the drawer.", "Nothing here is a step you have to finish."],
                   ["Open the word list to hear any word again.",
                    "Open the word finder to look up a word from any lesson.",
                    "Open the grown-up page to see what this lesson teaches."],
                   ["Come back to this drawer any time.", "It does not close."],
                   ["Open one."]),
               {"words": words, "finder": finder,
                "teaches": [{"code": c, "text": code_text.get(c, "")} for c in codes],
                "strands": cfg.get("hubStrands") or [],
                "hub": cfg.get("hub") or "index.html",
                "gradeLabel": cfg.get("gradeLabel") or "",
                "lessonNo": n, "homeStep": -1},
               "Your resources are always here.")

    # order: the shell, the content, the journal, the practice, the check, the placeholder, the drawer
    if core and core[-1]["kind"] == "quiz":
        content, quiz = core[:-1], [core[-1]]
    else:
        content, quiz = core, []
    own_journal = any(s["kind"] == "journal" for s in core)
    jn = [] if own_journal else [journal_step(lesson, content, cfg)]
    # A GOOD PLACE TO STOP is offered at the end of the journal - drawn inside
    # that step, never as a step of its own, because progress names steps by
    # position and a new one would move every step after it (lib/art.js ::
    # pauseCard says the rest). Exactly one journal per lesson carries it.
    journals = [s for s in content + jn if s["kind"] == "journal"]
    if journals:
        journals[-1]["data"]["pause"] = True
    steps = [overview, lec, wds] + content + jn + [gz, hm] + quiz + [world, res]
    steps = [s for s in steps if s is not None]
    overview["data"]["counts"]["steps"] = len(steps)
    res["data"]["homeStep"] = steps.index(hm)
    return steps


def finder_words(lessons):
    """Every word of every lesson, for the word finder: (n, file, lesson) triples in."""
    out = []
    for n, fname, lesson in lessons:
        for w in lesson.get("words") or []:
            out.append({"w": w["w"], "pic": w.get("pic", ""), "meaning": w["meaning"],
                        "uses": w.get("uses") or [], "lesson": n, "title": lesson["title"], "file": fname})
    out.sort(key=lambda x: x["w"].lower())
    return out

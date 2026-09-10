# -*- coding: utf-8 -*-
"""The unit shell: the seven steps every Computing lesson gets AROUND its own.

The same furniture the Science kit's _shell.py draws (owner, 2026-09-10, for
every standalone build): what the unit is about, a lecture, the unit's words
with a picture, a meaning and sample uses, a games step, things to do at home,
a student-resources drawer - plus a placeholder for "Computing world", which is
not built yet and says so.

The content module writes four things (`about`, `lecture`, `words`, `home`,
in the vocabulary of _kit.py) and this file turns them into steps, in one
place, so the lesson builder and the hub builder cannot disagree about how
many steps a lesson has or what they are called:

    overview  lecture  words  <the lesson's own steps ...>  games  home  quiz  world  resources

The games are DERIVED, not written: a quick quiz from the lesson's own
questions, a sort race from its sort steps, word pairs and a spelling game
from its words. Nothing in a game is new, which is the rule the English
build's own Game Zone keeps ("every question is a word or a pattern this
unit already taught you"), and it is why a lesson with no words gets no
word games rather than invented ones.

Two steps teach nothing and so name no objective: `world` (a placeholder)
and `resources` (a drawer). Every other shell step carries the codes of the
lesson it wraps, because that is what it is about. The coverage gate counts
codes per lesson as a SET, so the floors do not move.

"Things to do at home" is unplugged on purpose. The framework itself says
most of Stage 1 is unplugged - computational thinking with cards, floors and
grown-ups, no device needed - so a home project here never asks a family to
own a tablet.
"""
import re

from _kit import explain, step

# steps that teach nothing and therefore name no objective
META_KINDS = {"world", "resources"}


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
        rounds = [{"prompt": "Where does " + it["label"] + " go? " + (it.get("pic", "") if not str(it.get("pic", "")).startswith("<") else ""),
                   "choices": [bins[b] for b in bins], "answer": bins[it["bin"]],
                   "explanation": it.get("why") or bins[it["bin"]]} for it in d["items"]]
        if len(rounds) >= 3:
            games.append({"id": "l%d-sort-%d" % (n, k + 1), "type": "choice",
                          "title": "Sort race: " + plain(s["title"]), "skill": "Sorting",
                          "rounds": rounds[:8]})

    # Word pairs: the word and what it means, three pairs a round.
    if len(words) >= 3:
        rounds = []
        for i in range(0, len(words) - len(words) % 3, 3):
            trio = words[i:i + 3]
            rounds.append({"prompt": "Match each word to what it means.",
                           "pairs": [[w["w"], w["meaning"]] for w in trio]})
        if rounds:
            games.append({"id": "l%d-pairs" % n, "type": "pairs", "title": "Word pairs",
                          "skill": "Computing words", "rounds": rounds})

    # Spell it: one-word terms of eight letters or fewer, from the meaning.
    spell = [w for w in words if re.fullmatch(r"[A-Za-z]{3,8}", w["w"])]
    if len(spell) >= 3:
        games.append({"id": "l%d-spell" % n, "type": "spelling", "title": "Spell the computing word",
                      "skill": "Computing words",
                      "rounds": [{"prompt": w["meaning"], "clue": "It starts with " + w["w"][0].lower() + ". " + w.get("pic", ""),
                                  "answer": w["w"].lower()} for w in spell[:6]]})
    return games


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

    wds = step("words", "Computing words", "\U0001F524", "Computing words", codes,
               "Tap each word to hear what it means and how to use it. Then show you know them.",
               explain(
                   ["These are the computing words in this lesson."],
                   ["Tap a word.", "You will see its picture, hear what it means, and hear it used in a sentence.",
                    "When you have heard them all, the page asks which word is which."],
                   ["A computing word often means something very exact.",
                    "Listen to the meaning, not just the word."],
                   ["Tap the first word."]),
               {"items": words},
               "You know the computing words of this lesson.")

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

    hm = step("home", "Unplugged at home", "\U0001F3E0", "Unplugged at home", codes,
              "Computing with no computer: cards, floors and grown-ups. Do one with a grown-up.",
              explain(
                  ["These are projects to do at home, away from any screen.",
                   "Computer scientists call that unplugged, and it is real computing."],
                  ["Read one, or press the speaker to hear it.", "Get the things it needs.",
                   "Do it, and look for the thing it tells you to look for."],
                  ["A grown-up who follows your steps EXACTLY, silly mistakes and all, is the best computer you have.",
                   "That is the whole point."],
                  ["Pick a project and tick it when you have done it."]),
              {"items": [dict(h, n=i + 1) for i, h in enumerate(home)]},
              "Unplugged computing at home. That is the best kind.")

    world = step("world", "Computing world", "\U0001F30D", "Computing world", [],
                 "Where this computing is out in the real world. This part is still being built.",
                 explain(
                     ["Computing world is not built yet."],
                     ["It will show where this lesson's computing is out in the real world.",
                      "Places you can visit, people who use it, and things you can go and look at."],
                     ["There is nothing to do here yet.", "It ticks itself off."],
                     ["Press Next."]),
                 {"title": lesson["title"],
                  "soon": ["Real places where this computing happens.",
                           "People who use it every day at work.",
                           "Things near you to go and look at."]},
                 "Computing world is on its way.")

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

    # order: the shell, the content, the practice, the check, the placeholder, the drawer
    if core and core[-1]["kind"] == "quiz":
        content, quiz = core[:-1], [core[-1]]
    else:
        content, quiz = core, []
    steps = [overview, lec, wds] + content + [gz, hm] + quiz + [world, res]
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

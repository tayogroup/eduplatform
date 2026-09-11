# -*- coding: utf-8 -*-
"""The unit shell: the steps every Global Perspectives lesson gets AROUND its own.

The same furniture the Science and Computing kits' _shell.py draw (owner,
2026-09-10, for every standalone build): what the unit is about, a lecture,
the unit's words with a picture, a meaning and sample uses, a games step,
things to do at home, a student-resources drawer - plus a placeholder for
"Our world", which is not built yet and says so.

ONE STEP IS THIS SUBJECT'S OWN: "Look back". Reflection is a whole strand of
Global Perspectives (Personal viewpoints 1Fv.01 "talk about what has been
learned during an activity with support"; Personal learning 1Fl.01 "talk
about something liked in a particular activity"), and the framework's
progression text says a Stage 1 learner reflects on THE ACTIVITY they have
just done. So every lesson ends its own steps with a look-back drawn here,
from the lesson's own data: the "I learned that..." choices are the lesson's
`about` lines and the "I liked..." choices are the lesson's own step titles.
A lesson that authors its own `lookback` step (Lesson 8 looks back over the
whole course) keeps that one and gets no second.

The content module writes four things (`about`, `lecture`, `words`, `home`,
in the vocabulary of _kit.py) and this file turns them into steps, in one
place, so the lesson builder and the hub builder cannot disagree about how
many steps a lesson has or what they are called:

    overview  warmup  lecture  words  <the lesson's own steps ...>  lookback  games  home  quiz  world  resources

"Before we start" (warmup) is the second step of every lesson: a one-frame
recap of the previous lesson, read back from that lesson's own about lines
(filled by build-lessons.py, which can see every lesson), and a two-question
starting check the content writes as LESSON["check"]. The check is asked
BEFORE the teaching, so it is not marked: both answers are accepted, the right
one is shown, and the page reports how many were already known as
participation, never as a score.

The games are DERIVED, not written: a quick quiz from the lesson's own
questions, a sort race from its sort and organiser steps, word pairs and a
spelling game from its words. Nothing in a game is new, which is the rule the
English build's own Game Zone keeps.

Two steps teach nothing and so name no objective: `world` (a placeholder) and
`resources` (a drawer). Every other shell step carries the codes of the lesson
it wraps, because that is what it is about - except the look-back, which
carries its own two. The coverage gate counts codes per lesson as a SET.

"Things to do at home" is talk-shaped on purpose: Global Perspectives at
Stage 1 is a whole-class, talk-with-a-grown-up subject (the framework says the
Stage 1 learner records "as a class ... with support and guidance"), so a home
project here is an interview, a survey or a walk, never a worksheet.
"""
import copy
import re

from _kit import explain, step

# steps that teach nothing and therefore name no objective
META_KINDS = {"world", "resources"}

# the look-back's own codes: the two Reflection objectives every lesson reaches,
# at the app's stage (1Fv.01/1Fl.01 for Stage 1, 2Fv.01/2Fl.01 for Stage 2 ...)
def lookback_codes(stage):
    return ["%dFv.01" % int(stage), "%dFl.01" % int(stage)]


# At Stage 3 the look-back asks how ideas CHANGED (3Fv.01) and which TYPE of
# activity helped (3Fl.01), so the "helped" cards are types derived from the
# lesson's own step kinds rather than its step titles.
TYPE_OF = {
    "askq": ("building questions", "❓"), "source": ("reading a picture", "\U0001F5BC\ufe0f"), "text": ("reading a text", "\U0001F4C4"),
    "survey": ("interviewing classmates", "\U0001F399\ufe0f"), "observe": ("observing and counting", "\U0001F440"),
    "pictogram": ("reading a chart", "\U0001F4CA"), "organiser": ("recording on a chart", "\U0001F4CB"),
    "know": ("giving a talk", "\U0001F5E3\ufe0f"), "answer": ("answering questions", "\U0001F4AC"),
    "listen": ("listening and asking", "\U0001F442"), "consequence": ("thinking about what happens next", "➡\ufe0f"),
    "solve": ("choosing actions", "\U0001F527"), "sources": ("choosing sources", "\U0001F4DA"),
    "opinion": ("giving my opinion", "\U0001F4AD"), "team": ("a team job", "\U0001F91D"),
    "contrib": ("looking back at the team", "\U0001F64B"), "strengths": ("looking at what I did well", "\U0001F4AA"),
    "sort": ("sorting things", "\U0001F5C2\ufe0f"), "explore": ("tapping and listening", "\U0001F50D"),
    "context": ("tapping and listening", "\U0001F50D"), "demo": ("watching a demonstration", "\U0001F3AC"),
    "questions": ("practice questions", "✅"), "order": ("putting things in order", "\U0001F522"),
}
DEFAULT_TYPE_BECAUSES = [
    "because I had to do it myself",
    "because I could see the answer happen",
    "because I heard other people's ideas",
    "because I had to think before I tapped",
    "because we did it as a team",
]

# At Stage 1 the second half is "something liked in a particular activity"
# (1Fl.01); at Stage 2 it is "a particular activity that supported learning"
# (2Fl.01), so the page asks which part HELPED rather than which part was liked.
DEFAULT_HELPED = [
    "because I had to try it myself",
    "because I could see it happen",
    "because we talked about it",
    "because I did it with a friend",
    "because I got to choose",
]

# things a child did NOT learn today, for the look-back's distractors, when
# the lesson does not write its own
DEFAULT_NOT_LEARNED = [
    "how to ride a bicycle",
    "the names of all the planets",
    "how to bake a cake",
    "how to swim",
]
DEFAULT_BECAUSES = [
    "because it was fun",
    "because I got to tap and try things",
    "because I found something out",
    "because it made me think",
    "because I like talking about it",
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

    # Sort race: where does each thing go? (sort steps and graphic organisers)
    for k, s in enumerate([s for s in lesson["steps"] if s["kind"] in ("sort", "organiser")]):
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
                          "skill": "Big words", "rounds": rounds})

    # Spell it: one-word terms of eight letters or fewer, from the meaning.
    spell = [w for w in words if re.fullmatch(r"[A-Za-z]{3,8}", w["w"])]
    if len(spell) >= 3:
        games.append({"id": "l%d-spell" % n, "type": "spelling", "title": "Spell the big word",
                      "skill": "Big words",
                      "rounds": [{"prompt": w["meaning"], "clue": "It starts with " + w["w"][0].lower() + ". " + w.get("pic", ""),
                                  "answer": w["w"].lower()} for w in spell[:6]]})
    return games


# ----------------------------------------------------------------------
# the look-back, derived from the lesson's own about lines and step titles
# ----------------------------------------------------------------------
def lookback_step(lesson, core, cfg):
    stage = int(cfg.get("stage") or 1)
    helped = stage >= 2
    lb = lesson.get("lookback") or {}
    not_learned = list(lb.get("not") or DEFAULT_NOT_LEARNED)
    becauses = list(lb.get("becauses") or (DEFAULT_HELPED if helped else DEFAULT_BECAUSES))
    learned = list(lesson.get("about") or [])
    liked = [{"title": plain(s["title"]), "icon": s["icon"]} for s in core if s["kind"] not in ("quiz",)]
    if stage >= 3:
        changed = list(lb.get("changed") or [])
        if len(changed) < 2:
            raise SystemExit("REFUSED: lesson %r is at Stage 3+, so its LESSON[\"lookback\"][\"changed\"] must hold 2+ {before, after} pairs (3Fv.01)" % lesson["title"])
        seen, types = set(), []
        for s in core:
            t = TYPE_OF.get(s["kind"])
            if t and t[0] not in seen:
                seen.add(t[0]); types.append({"title": t[0], "icon": t[1]})
        return step("lookback", "Look back", "\u23EA", "I looked back", lookback_codes(stage),
                    "What did you learn, how did your ideas change, and which kind of activity helped you learn? Tap to say it.",
                    explain(
                        ["Looking back has three parts.", "What you learned, how your ideas changed, and which KIND of activity helped."],
                        ["First: I learned that. Tap two things you really did learn today.",
                         "Then: before I thought, now I think. Pick how one of your ideas changed.",
                         "Then: which kind of activity helped you learn most, and why."],
                        ["Children say their ideas did not change.", "If you learned something, an idea moved. Find it."],
                        ["Tap the first thing you learned."]),
                    {"scope": "lesson", "mode": "changed", "learned": learned, "not": not_learned, "changed": changed,
                     "liked": types, "becauses": list(lb.get("becauses") or DEFAULT_TYPE_BECAUSES), "pick": min(2, len(learned))},
                    "You looked back: what you learned, how your ideas changed, and what kind of activity helped. That is reflecting.")
    if helped:
        return step("lookback", "Look back", "\u23EA", "I looked back", lookback_codes(stage),
                    "What did you learn today, and which part helped you learn it? Tap to say it.",
                    explain(
                        ["Looking back is a skill too.", "At the end of an activity you say what you learned, and which part helped you learn it."],
                        ["First: I learned that. Tap two things you really did learn today.",
                         "Then: the part that helped me learn most. Tap it, and say why it helped."],
                        ["Children tap the part that was most fun.", "Fun is fine, but this asks which part HELPED you learn."],
                        ["Tap the first thing you learned."]),
                    {"scope": "lesson", "mode": "helped", "learned": learned, "not": not_learned, "liked": liked, "becauses": becauses,
                     "pick": min(2, len(learned))},
                    "You looked back at what you learned and what helped you learn it. That is reflecting.")
    return step("lookback", "Look back", "\u23EA", "I looked back", lookback_codes(stage),
                "What did you learn today, and what did you like? Tap to say it.",
                explain(
                    ["Looking back is a skill too.", "At the end of an activity you say what you learned, and what you liked."],
                    ["First: I learned that. Tap two things you really did learn today.",
                     "Then: I liked. Tap the part of the lesson you liked best, and say why."],
                    ["Children tap something that sounds nice but was not in the lesson.",
                     "Only say you learned something if you did it today."],
                    ["Tap the first thing you learned."]),
                {"scope": "lesson", "learned": learned, "not": not_learned, "liked": liked, "becauses": becauses,
                 "pick": min(2, len(learned))},
                "You looked back at what you learned and what you liked. That is reflecting.")


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

    wds = step("words", "Big words", "\U0001F524", "Big words", codes,
               "Tap each word to hear what it means and how to use it. Then show you know them.",
               explain(
                   ["These are the big words in this lesson.", "They are the words people use when they find things out and talk about them."],
                   ["Tap a word.", "You will see its picture, hear what it means, and hear it used in a sentence.",
                    "When you have heard them all, the page asks which word is which."],
                   ["A big word often means something very exact.",
                    "Listen to the meaning, not just the word."],
                   ["Tap the first word."]),
               {"items": words},
               "You know the big words of this lesson.")

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

    hm = step("home", "Find out at home", "\U0001F3E0", "Find out at home", codes,
              "Finding out does not stop at school. Do one of these with a grown-up.",
              explain(
                  ["These are things to find out at home, with a grown-up.",
                   "Asking, listening, counting and looking. That is real research."],
                  ["Read one, or press the speaker to hear it.", "Get the things it needs.",
                   "Do it, and look for the thing it tells you to look for."],
                  ["A grown-up who answers your questions properly is your best source.",
                   "Ask them, listen, and remember what they said."],
                  ["Pick a project and tick it when you have done it."]),
              {"items": [dict(h, n=i + 1) for i, h in enumerate(home)]},
              "Finding out at home. That is the best kind of research.")

    first = n == 1
    warm = step("warmup", "Before we start", "\U0001F9E0", "Warmed up", codes,
                ("Before we start, have a go at two questions. It is fine not to know yet."
                 if first else
                 "First, remember last time. Then have a go at two questions. It is fine not to know yet."),
                explain(
                    ["This is a warm-up.", "Nothing here is marked."],
                    (["Answer two questions about what this lesson is about.",
                      "If you know, great. If you do not, the page tells you, and this lesson will teach it."]
                     if first else
                     ["First, remember what you learned last time. Press Remind me to hear it again.",
                      "Then answer two questions about what this lesson is about.",
                      "If you know, great. If you do not, the page tells you, and this lesson will teach it."]),
                    ["Children worry about getting it wrong.", "Not knowing yet is fine. That is what the lesson is for."],
                    ["Tap an answer."]),
                {"recap": None, "check": copy.deepcopy(lesson.get("check") or [])},
                "That is you warmed up. Now the lesson.")

    world = step("world", "Our world", "\U0001F30D", "Our world", [],
                 "Where these skills are used out in the real world. This part is still being built.",
                 explain(
                     ["Our world is not built yet."],
                     ["It will show where this lesson's skills are used out in the real world.",
                      "Places you can visit, people who ask questions for a living, and things near you to go and look at."],
                     ["There is nothing to do here yet.", "It ticks itself off."],
                     ["Press Next."]),
                 {"title": lesson["title"],
                  "soon": ["Real places where people find things out together.",
                           "People who ask questions and listen for a living.",
                           "Things near you to go and look at."]},
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

    # order: the shell, the content, the look-back, the practice, the check, the placeholder, the drawer
    if core and core[-1]["kind"] == "quiz":
        content, quiz = core[:-1], [core[-1]]
    else:
        content, quiz = core, []
    own_lookback = any(s["kind"] == "lookback" for s in core)
    look = [] if own_lookback else [lookback_step(lesson, content, cfg)]
    steps = [overview, warm, lec, wds] + content + look + [gz, hm] + quiz + [world, res]
    steps = [s for s in steps if s is not None]
    overview["data"]["counts"]["steps"] = len(steps)
    res["data"]["homeStep"] = steps.index(hm)
    return steps


def finder_words(lessons):
    """Every word of every lesson, for the word finder: (n, file, lesson) triples in."""
    out = []
    for n, fname, lesson in lessons:
        for w in lesson.get("words") or []:
            out.append(dict({"w": w["w"], "pic": w.get("pic", ""), "meaning": w["meaning"],
                             "uses": w.get("uses") or [], "lesson": n, "title": lesson["title"], "file": fname},
                            **({"say": w["say"]} if w.get("say") else {})))
    out.sort(key=lambda x: x["w"].lower())
    return out

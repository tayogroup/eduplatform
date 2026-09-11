# -*- coding: utf-8 -*-
"""The unit shell: the seven steps every lesson gets AROUND its own content.

Owner, 2026-09-10: the Science lessons should carry the same furniture the
English Grade 1 build carries around a unit - what the unit is about, a
lecture, the unit's words with a picture, a meaning and sample uses, a games
step, things to do at home, and a student-resources drawer - plus a
placeholder for "Science world", which is not built yet and says so.

The content module writes four things (`about`, `lecture`, `words`, `home`,
in the vocabulary of _kit.py) and this file turns them into steps, in one
place, so the lesson builder and the hub builder cannot disagree about how
many steps a lesson has or what they are called:

    overview  lecture  words  <the lesson's own steps ...>  games  home  quiz  world  resources

The games are DERIVED, not written: a quick quiz from the lesson's practice
questions (never from its quiz, and expand() refuses a lesson where any game
round repeats a quiz question), a sort race from its sort steps, word pairs
and a spelling game from its words. Nothing in a game is new, which is the rule the English
build's own Game Zone keeps ("every question is a word or a pattern this
unit already taught you"), and it is why a lesson with no words gets no
word games rather than invented ones.

Two steps teach nothing and so name no objective: `world` (a placeholder)
and `resources` (a drawer). Every other shell step carries the codes of the
lesson it wraps, because that is what it is about. The coverage gate counts
codes per lesson as a SET, so the floors do not move.
"""
import re

from _kit import explain, step

# steps that teach nothing and therefore name no objective
META_KINDS = {"world", "resources"}

# Minutes a child spends on a step of each kind, including listening. One
# table for the hub's estimates AND the two-sittings split below, so the two
# cannot disagree about how long a lesson is.
MINUTES = {"demo": 1.5, "explore": 2, "context": 2.5, "sort": 3, "experiment": 4, "predictEach": 5,
           "record": 2, "measure": 2.5, "label": 3, "tester": 3, "ask": 1.5, "questions": 3, "quiz": 4,
           "order": 2, "graph": 3, "lookup": 3, "build": 3, "diagram": 3, "key": 4,
           # the unit shell; home projects are done off the screen and cost the page nothing
           "overview": 1, "lecture": 4, "words": 4, "games": 6, "home": 1, "world": 0.5, "resources": 1}


def minutes_of_steps(steps):
    return sum(MINUTES.get(s["kind"], 2) for s in steps)


def round5(m):
    return int(5 * round(m / 5.0)) or 5


def previous_of(lessons):
    """{n: what lesson n-1 taught}, for the recap on lesson n's overview."""
    out, last = {}, None
    for n, _fname, lesson in lessons:
        if last:
            out[n] = {"n": last[0], "title": last[1]["title"], "about": list(last[1].get("about") or [])[:3]}
        last = (n, lesson)
    return out


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(html))).strip()


def textpic(p):
    """A picture that can sit inside a line of text: an emoji can, one of the
    kit's drawings (_icons.py) cannot - a game prompt is text - so it is left out."""
    return "" if str(p).startswith("<") else p


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

    # Quick quiz: the lesson's PRACTICE questions only, never its quiz.
    # The first version fell back to the quiz where a lesson had no practice
    # questions, and the games step sits just before the quiz - so in five of
    # Grade 1's eight lessons the child rehearsed all eight quiz questions,
    # with the answers explained, minutes before being marked on them
    # (found by the 2026-09-11 re-validation). A lesson with no practice
    # questions simply has no Quick quiz game; its sorts and words still
    # make at least two.
    qsteps = [s for s in lesson["steps"] if s["kind"] == "questions"]
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
        rounds = [{"prompt": "Where does " + it["label"] + " go? " + textpic(it.get("pic", "")),
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
                          "skill": "Science words", "rounds": rounds})

    # Spell it: one-word terms of eight letters or fewer, from the meaning.
    spell = [w for w in words if re.fullmatch(r"[A-Za-z]{3,8}", w["w"])]
    if len(spell) >= 3:
        games.append({"id": "l%d-spell" % n, "type": "spelling", "title": "Spell the science word",
                      "skill": "Science words",
                      "rounds": [{"prompt": w["meaning"], "clue": "It starts with " + w["w"][0].lower() + ". " + textpic(w.get("pic", "")),
                                  "answer": w["w"].lower()} for w in spell[:6]]})
    return games


# ----------------------------------------------------------------------
# the shell steps
# ----------------------------------------------------------------------
def expand(n, lesson, code_text, finder, cfg, prev=None):
    """The full ordered step list for lesson n: the shell around the content.

    code_text   {code: objective text} for the stage
    finder      every word of every lesson in this grade, for the word finder
    cfg         the app's config (hub file, strands, grade label; "sittings": 2
                splits every lesson into two sittings - the lesson, then the
                games, home projects and quiz - with a break card between)
    prev        what the lesson before taught ({n, title, about}), for the
                "Last time" recap on the overview; None for lesson 1
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
                     "counts": {"steps": 0, "words": len(words), "games": len(games), "home": len(home)},
                     "recap": prev, "warmup": list(lesson.get("warmup") or []), "sittings": None},
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

    wds = step("words", "Science words", "\U0001F524", "Science words", codes,
               "Tap each word to hear what it means and how to use it. Then show you know them.",
               explain(
                   ["These are the science words in this lesson."],
                   ["Tap a word.", "You will see its picture, hear what it means, and hear it used in a sentence.",
                    "When you have heard them all, the page asks which word is which."],
                   ["A science word often means something very exact.",
                    "Listen to the meaning, not just the word."],
                   ["Tap the first word."]),
               {"items": words},
               "You know the science words of this lesson.")

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

    hm = step("home", "Things to do at home", "\U0001F3E0", "Science at home", codes,
              "Real science with real things, away from the screen. Do one with a grown-up.",
              explain(
                  ["These are projects to do at home, with your hands and with a grown-up."],
                  ["Read one, or press the speaker to hear it.", "Get the things it needs.",
                   "Do it, and look for the thing it tells you to look for."],
                  ["Doing it once is science.", "Doing it again to check is BETTER science."],
                  ["Pick a project and tick it when you have done it."]),
              {"items": [dict(h, n=i + 1) for i, h in enumerate(home)]},
              "Science at home. That is the best kind.")

    world = step("world", "Science world", "\U0001F30D", "Science world", [],
                 "Where this science is out in the real world. This part is still being built.",
                 explain(
                     ["Science world is not built yet."],
                     ["It will show where this lesson's science is out in the real world.",
                      "Places you can visit, people who use it, and things you can go and look at."],
                     ["There is nothing to do here yet.", "It ticks itself off."],
                     ["Press Next."]),
                 {"title": lesson["title"],
                  "soon": ["Real places where this science happens.",
                           "People who use it every day at work.",
                           "Things near you to go and look at."]},
                 "Science world is on its way.")

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

    # TWO SITTINGS. A Grade 1 lesson with the shell round it is 40 to 45
    # minutes, longer than any lesson in Grades 2 to 4 and too long for one
    # sitting at five (validation v2, area 17). Where the config asks for it
    # the lesson is cut at the step boundary nearest its halfway point, never
    # before the first of the lesson's own steps and never after the games.
    # Cutting where the teaching ends was tried first and left 30-35 minutes
    # then 10, which only moved the problem. Progress is by step, so a child
    # who stops at the break resumes on the step after it; the marker rides
    # on the step, not in its renderer's data.
    if cfg.get("sittings") == 2:
        first = steps.index(content[0]) + 1 if content else steps.index(gz)
        cands = range(first, steps.index(gz) + 1)
        cut = min(cands, key=lambda c: (abs(minutes_of_steps(steps[:c]) - minutes_of_steps(steps[c:])), c))
        one, two = round5(minutes_of_steps(steps[:cut])), round5(minutes_of_steps(steps[cut:]))
        overview["data"]["sittings"] = {"one": one, "two": two}
        steps[cut]["sittingBreak"] = {"minutes": two, "hub": cfg.get("hub") or "index.html"}

    # A game that rehearses the quiz turns the quiz into a memory test of the
    # game. Checked here, where both builders pass, so neither can ship it.
    quiz_stems = {plain(it["ask"]).lower() for s in quiz for it in s["data"]["items"]}
    # The warm-up asks what a child already knows BEFORE the lesson; the same
    # question in the quiz would make the quiz a memory test of the warm-up.
    for w in lesson.get("warmup") or []:
        if plain(w["ask"]).lower() in quiz_stems:
            raise SystemExit("REFUSED: lesson %d warm-up repeats the quiz question %r" % (n, w["ask"]))
        if sum(1 for o in w["opts"] if o["ok"]) != 1:
            raise SystemExit("REFUSED: lesson %d warm-up %r needs exactly one right answer" % (n, w["ask"]))
    for g in games:
        for r in g["rounds"]:
            if plain(r.get("prompt", "")).lower() in quiz_stems:
                raise SystemExit("REFUSED: lesson %d game %r repeats the quiz question %r - a game may not "
                                 "rehearse the quiz" % (n, g["title"], r["prompt"]))
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

# -*- coding: utf-8 -*-
"""Write the twelve Letters & Sounds lessons.

    python make_letters.py            # writes lessons/letters/lesson-01..12.json

The Letters & Sounds strand (owner, 2026-09-18) is the Phonics level
regrouped: twelve lessons instead of twenty units. Lessons 2-5 and 7-11 are one
to three Phonics units each (MAP), and their words, blends, tricky words and
short reader are COPIED from those units. Lessons 1, 6 and 12 mix in the Intro
level and Level 1 Unit 0 and are written by hand below (hand_1, hand_6,
hand_12); they list their own steps.

The lectures are the units' own, corrected so they speak of lessons, not
units, books or levels (LECTURE_EDITS). A recorded clip is named by cyrb53 of
its exact text, so a corrected lecture no longer matches its Phonics recording
and is read by the device voice until it is narrated again. The short readers
are unchanged and still play their recordings.

What is never reused is a clip for a single grapheme ("r", "sh"). Those are
keyed by one or two letters, and the same key was recorded by other levels as a
letter NAME. The audio generator skips a key that already exists, so which one is
on disk cannot be told from the file name. A sound button therefore says the
measured respelling below (tools/lib/ehel-phonics-speech.js) through the device
voice, and never looks up a clip.
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
REPO = os.path.abspath(os.path.join(ACADEMY, "..", "..", ".."))
PH = os.path.join(ACADEMY, "intensive-english", "level-phonics", "data", "units")
OUT = os.path.join(REPO, "inputs", "ehel-english-intensive-source", "program", "lessons", "letters")
PLAN = json.load(io.open(os.path.join(REPO, "inputs", "ehel-english-intensive-source", "program", "program-plan.json"), encoding="utf-8"))

# The spoken forms measured for this course's voice (tools/lib/ehel-phonics-speech.js :: SOUND).
SOUND = {
    "s": "sss", "a": "ah", "t": "tuh", "n": "nnn", "i": "ih", "p": "puh", "o": "aw", "g": "guh", "d": "duh",
    "m": "mmm", "c": "kuh", "k": "kuh", "r": "rrr", "e": "eh", "u": "uh", "h": "huh", "b": "buh", "l": "luh",
    "f": "fuh", "j": "juh", "v": "vuh", "w": "wuh", "x": "ks", "y": "yuh", "z": "zz",
    "ck": "kuh", "ll": "luh", "ff": "fuh", "ss": "sss", "zz": "zz", "qu": "kwah",
    "ng": "ung", "nk": "unk", "th": "th", "sh": "shh", "ch": "chuh", "ph": "fuh", "wh": "wuh",
    "ai": "A", "ay": "A", "a_e": "A", "ee": "ee", "ea": "ee", "ie": "eye", "igh": "eye", "i_e": "eye",
    "oa": "oh", "oe": "oh", "o_e": "oh", "ow": "ow", "oo": "ooh", "ue": "yoo", "ew": "yoo", "u_e": "yoo",
    "ar": "ar", "or": "or", "aw": "or", "ore": "or", "er": "urr", "ir": "urr", "ur": "urr",
    "ou": "ow", "oi": "oy", "oy": "oy", "ear": "ear", "eer": "ear", "air": "air", "are": "air",
}
MAP = {2: [2, 3], 3: [4, 5], 4: [6, 7], 5: [8, 9, 10], 7: [11], 8: [12], 9: [13], 10: [14, 18], 11: [15, 16, 17]}
IN = os.path.join(ACADEMY, "intensive-english", "level-0", "data", "units")
L1 = os.path.join(ACADEMY, "intensive-english", "level-1", "data", "units")

# --- the lectures, re-pointed at this strand ------------------------------------------
# Every Phonics lecture opens "This is Unit N" and closes "That is Unit N", and a
# few send the learner to "Unit 8", "Book B" or "the Intro level" - none of which
# exist here, where the owner's word is LESSON (2026-09-18). The text is corrected
# line by line below. The cost is the recordings: a clip is named by its exact text,
# so a corrected lecture is read by the device voice until it is narrated again.
# Line numbers are 1-based; None drops the line.
LECTURE_EDITS = {
    ("Ph", 1): {1: "Hello. This is {label} of Letters & Sounds.", 2: "There are no letters in this part. Only your ears.", 27: None},
    ("Ph", 10): {19: "There are more in Lesson 8."},
    ("Ph", 11): {11: "Careful here. Think back to Lesson 5."},
    ("Ph", 12): {3: "Two letters. One sound. Like ck in Lesson 5."},
    ("Ph", 14): {1: "This is {label}.", 27: None, 29: "Next come new ways to write sounds you know.", 30: None},
    ("Ph", 15): {1: "This is {label}.", 2: "This lesson has no new sounds at all."},
    ("Ph", 17): {11: "In Lesson 10 you learned ow. Cow. Now.", 16: "Same as oo in Lesson 9. Boot and foot."},
    ("Ph", 18): {3: "In the first part of this lesson you met ir and er.", 7: "Next. In the first part you met or. Fork.",
                 14: "Listen. That is the cow sound from the first part.", 17: "That is oi from the first part. Coin. Boy."},
    ("Ph", 19): {38: "One part left."},
    ("Ph", 20): {1: "This is the last part of Letters & Sounds.", 33: "That is the last thing Letters & Sounds teaches.",
                 34: "And now you can read your Starter lessons.", 35: "Starter does not teach reading. It teaches English.",
                 38: "Twelve lessons. Well done. Go on."},
    ("In", 2): {1: "In this part we use a pen."},
    ("In", 3): {1: "This is {label}. You can write the letters now.", 24: "Go and spell your name."},
}
OPENING = re.compile(r"^(?:Hello\. )?This is Unit \d+(?: of Phonics)?\.\s*(.*)$")
CLOSING = re.compile(r"^That is Unit \d+\.\s*(.*)$")
STALE = re.compile(r"\b(?:Units?|units?|Intro|Book [AB]|Phonics)\b|this level")


def retarget(tag, n, text, lesson, first):
    """The lecture of source unit (tag, n) as a chapter of `lesson` (a number, or
    a label such as "Bridge B"); `first` when it opens the lesson, since only the
    first chapter says "This is Lesson N"."""
    label = "Lesson %d" % lesson if isinstance(lesson, int) else lesson
    edits = LECTURE_EDITS.get((tag, n), {})
    out = []
    for k, line in enumerate(text.split("\n"), 1):
        if k in edits:
            line = edits[k] and edits[k].replace("{label}", label)
            if line and not first and line.startswith("This is %s." % label):
                line = line[len("This is %s." % label):].strip()
        else:
            m = OPENING.match(line)
            if m:
                line = ("This is %s. %s" % (label, m.group(1))).strip() if first else m.group(1)
            m = CLOSING.match(line or "")
            if m:
                line = m.group(1)
        if line:
            out.append(line)
    text = "\n".join(out)
    bad = [l for l in out if STALE.search(l)]
    assert not bad, "%s %d still names the old course: %r" % (tag, n, bad)
    return text


def unit(n, folder=None):
    u = json.load(io.open(os.path.join(folder or PH, "unit-%d.json" % n), encoding="utf-8"))
    by = {w["vocabularyId"]: w for w in u["dictionaryLinks"]}
    groups = [(g["title"], [by[v] for v in g["vocabularyIds"]]) for g in u["vocabularyGroups"]]
    return u, groups


def is_sound_group(title, items):
    """A group of graphemes. Unit 14's "Two more" (ow, oi) and Unit 18's "Two
    pairs" (ou, oy) have titles that say nothing, so the items decide too."""
    t = title.lower()
    if "word" in t:
        return False
    return "sound" in t or "spelling" in t or t.startswith("long") or all(w["displayWord"] in SOUND for w in items)


def blends(u):
    out = []
    for g in u["grammar"]:
        for line in g["ruleAndExamples"].split("\n"):
            m = re.match(r"^\s*([a-z_]+(?:\s*-\s*[a-z_]+)+)\s*->\s*([a-z]+)", line)
            if m:
                out.append({"parts": [p.strip() for p in m.group(1).split("-")], "word": m.group(2)})
                continue
            m = re.match(r"^\s*([a-z]+)\s{2,}([a-z_]+(?:\s*-\s*[a-z_]+)+)\s*$", line)
            if m:
                out.append({"parts": [p.strip() for p in m.group(2).split("-")], "word": m.group(1)})
    for x in out:
        x["spoken"] = ", ".join(SOUND.get(q, q) for q in x["parts"])
    return out


# Lesson 7 teaches pairs of consonants, not new sounds, so its "sounds" are the
# pairs, each said as its two sounds.
PAIRS = [("st", "stop, step"), ("cl", "clap, clock"), ("tr", "trip, trap"), ("fl", "flat, flag"),
         ("sk", "desk, ask"), ("mp", "jump, lamp"), ("nd", "hand, send"), ("lk", "milk, help")]


def build(n, lesson, units=None):
    units = units or MAP[n]
    sounds, words, tricky, bl, lectures, readers, functions = [], [], [], [], [], [], []
    for k in units:
        u, groups = unit(k)
        functions += u["unit"].get("functions") or []
        lectures.append({"title": u["unit"]["unitTitle"], "text": retarget("Ph", k, u["visual"]["lectureScript"], n, not lectures), "source": "Ph %d" % k})
        for title, items in groups:
            tl = title.lower()
            if "tricky" in tl or "cannot" in tl or "commonest" in tl:
                tricky += [w["displayWord"] for w in items]
            elif is_sound_group(title, items):
                for w in items:
                    g = w["displayWord"]
                    sounds.append({"g": g, "about": w["childMeaning"], "spoken": SOUND.get(g, g)})
            else:
                words += [w["displayWord"] for w in items if re.fullmatch(r"[a-z]+", w["displayWord"])]
        # Units 14 and 18 name ear, air and are in their titles and teach them
        # only through words (hear, hair, care). Give each a tile, with its word.
        have = {s["g"] for s in sounds}
        for tok in re.findall(r"[a-z_]+", u["unit"]["unitTitle"]):
            if len(tok) < 3 or tok in have or tok not in SOUND:
                continue
            eg = next((w for w in words if tok in w), None)
            if eg:
                sounds.append({"g": tok, "about": "As in %s." % eg, "spoken": SOUND[tok]})
                have.add(tok)
        bl += blends(u)
        for r in u["readings"]:
            if r["type"] == "Short text":
                readers.append({"title": r["title"], "text": r["passageScript"]})
    seen = set()
    words = [w for w in words if not (w in seen or seen.add(w))]
    if n == 7:
        sounds = [{"g": g, "about": "Both letters are said: " + eg + ".", "spoken": ", ".join(SOUND.get(c, c) for c in g)} for g, eg in PAIRS]
    bl_words = {b["word"] for b in bl}
    # a find-the-sound question per sound: a word containing it, two that do not
    find = []
    for s in sounds:
        g = s["g"].replace("_", "")
        target = next((w for w in words if (w.startswith(g) if len(g) == 1 else g in w)), None)
        if len(s["g"]) >= 3 and "_" in s["g"]:
            a, e = s["g"].split("_")
            target = next((w for w in words if re.search(a + "[a-z]" + e + "$", w)), target)
        if not target:
            continue
        pool = [w for w in words if w != target and not (w.startswith(g) if len(g) == 1 else g in w)]
        k = len(find) * 2
        others = (pool[k % len(pool):] + pool[:k % len(pool)])[:2] if pool else []
        if len(others) < 2:
            continue
        where = "starts with" if len(g) == 1 and target.startswith(g) else "has"
        find.append({"q": "Listen to the sound. Which word %s it?" % ("starts with" if where == "starts with" else "has"),
                     "g": s["g"], "spoken": s["spoken"], "a": target, "wrong": others,
                     "why": "%s %s %s." % (target, where, s["g"])})
    letters = [s["g"] for s in sounds]
    plain = [w for w in words if w in bl_words] + [w for w in words if w not in bl_words]
    data = {
        "schema": "ehel-intensive-literacy/1",
        "level": "letters", "lesson": n, "title": lesson["title"], "cando": lesson["cando"], "cefr": "Literacy",
        "status": "generated", "sources": ["Ph %d" % k for k in units],
        "about": {
            "text": "In this lesson you learn %s. You hear each sound, you write its letters, and then you read words and a short text with them." % (
                "the sounds " + ", ".join(letters) if letters else "new sounds"),
            "goals": functions[:5],
        },
        "unitLecture": {"chapters": lectures},
        "hear": {"sounds": sounds, "find": find[:6]},
        "seeWrite": {"letters": letters, "copy": plain[:4]},
        "read": {"blend": bl[:8], "words": words, "tricky": tricky, "reader": readers[0] if readers else None},
        "check": {"readAloud": plain[:5], "dictation": plain[5:8] if len(plain) >= 8 else plain[:3]},
        "canDo": [
            "I can say the sounds %s." % ", ".join(letters[:6]) if letters else "I can hear the sounds in a word.",
            "I can read words like %s." % " and ".join(plain[:2]),
            "I can write a word from its sounds.",
            "I can read a short text out loud.",
        ],
        "_readers": readers,
    }
    return data


# --- the three lessons written by hand ------------------------------------------------
# Lesson 1 has no letters (Ph 1 and In 2), lesson 6 is letter NAMES (In 3 and L1 0),
# lesson 12 ends the strand (Ph 19 and 20). Each lists its own steps; a step names
# a renderer in lib/program.js and the block it reads.
NAME = {c: s for c, s in zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ["ay", "bee", "see", "dee", "ee", "eff", "jee", "aitch", "eye", "jay", "kay", "ell", "em", "en", "oh", "pee",
         "cue", "ar", "ess", "tee", "you", "vee", "double you", "ex", "why", "zed"])}


def spelled(word):
    return ", ".join(NAME[c] for c in word.upper() if c in NAME)


def listen_pick(q, target, a, wrong, why, pics, verb="rhymes with"):
    opts = [a] + wrong
    return {"q": q, "spoken": "Which one %s %s? %s, %s, or %s?" % (verb, target, opts[0], opts[1], opts[2]),
            "a": a, "wrong": wrong, "why": why, "pics": pics}


def lecture_of(tag, n, lesson, first, title):
    u, _ = unit(n, IN if tag == "In" else PH)
    return {"title": title, "text": retarget(tag, n, u["visual"]["lectureScript"], lesson, first), "source": "%s %d" % (tag, n)}


def hand_1(les):
    P = {"pan": "🍳", "cup": "☕", "sun": "☀️", "hat": "🎩", "bus": "🚌", "pen": "🖊️", "run": "🏃", "bag": "👜", "cat": "🐈",
         "shell": "🐚", "box": "📦", "car": "🚗", "star": "⭐", "sock": "🧦", "map": "🗺️", "milk": "🥛", "tea": "🍵", "fish": "🐟",
         "foot": "🦶", "bed": "🛏️", "door": "🚪", "egg": "🥚", "moon": "🌙"}
    pics = lambda *ws: {w: P[w] for w in ws}
    rhyme = lambda t, a, wrong: listen_pick("Which one rhymes with %s?" % t, t, a, wrong, "%s, %s: the end is the same." % (t, a), pics(a, *wrong))
    start = lambda t, a, wrong, s: listen_pick("Which one starts like %s?" % t, t, a, wrong, "%s, %s: both start with %s." % (t, a, s), pics(a, *wrong), "starts like")
    return {
        "schema": "ehel-intensive-literacy/1", "level": "letters", "lesson": 1, "title": les["title"], "cando": les["cando"], "cefr": "Literacy",
        "status": "authored", "sources": ["Ph 1", "In 2"],
        "about": {
            "text": "In this lesson you use your ears and a pen. You hear words that end the same and words that start the same. You count the sounds in a word. Then you draw lines and circles, from left to right.",
            "goals": ["Hear when two words end the same", "Hear when two words start the same", "Count the sounds in a short word",
                      "Hold a pen and make a line and a circle", "Write on a line, from left to right"],
        },
        "unitLecture": {"chapters": [lecture_of("Ph", 1, 1, True, "Listening to the sounds in words"),
                                     lecture_of("In", 2, 1, False, "Lines and circles")]},
        "steps": [
            ["Hear it", "Words that rhyme", "P.findSound", "hear.rhyme"],
            ["Hear it", "Words that start the same", "P.findSound", "hear.start"],
            ["See & write it", "Hold the pen", "P.note", "seeWrite.pen"],
            ["See & write it", "Lines and circles", "P.seeLetters", "seeWrite.shapes"],
            ["Read it", "Count the sounds", "P.countSounds", "read.count"],
            ["Check", "Start and end", "P.findSound", "check.listen"],
            ["Check", "Copy a row of shapes", "P.copyWords", "check.copyShapes"],
        ],
        "hear": {
            "rhyme": {"title": "Words that rhyme", "lead": "Tap Hear it. Which word ends the same? Tap its picture.", "items": [
                rhyme("man", "pan", ["cup", "sun"]), rhyme("cat", "hat", ["bus", "pen"]), rhyme("sun", "run", ["bag", "cat"]),
                rhyme("bell", "shell", ["box", "car"]), rhyme("car", "star", ["bus", "cup"])]},
            "start": {"title": "Words that start the same", "lead": "Tap Hear it. Which word starts with the same sound? Tap its picture.", "items": [
                start("sun", "sock", ["cup", "map"], "sss"), start("bus", "bag", ["sun", "hat"], "b"), start("map", "milk", ["pen", "car"], "m"),
                start("top", "tea", ["box", "fish"], "t"), start("fish", "foot", ["bed", "cat"], "f"), start("dog", "door", ["sun", "pen"], "d")]},
        },
        "seeWrite": {
            "pen": {"title": "Hold the pen", "lead": "Listen. Then try it with a real pen and paper.", "pic": "✍️", "done": "I have tried it",
                    "text": "Hold the pen between your thumb and your first finger.\nLet it rest on your middle finger.\nHold it near the point, but not too tight.\nPut the paper straight in front of you.\nStart on the left. Go to the right."},
            "shapes": {"title": "Lines and circles", "lead": "Tap a shape. Trace it with your finger, pen or mouse. Then draw it on paper, from left to right.",
                       "items": ["|", "—", "○", "l", "o", "b", "d", "m", "n"]},
        },
        "read": {
            "count": {"title": "Count the sounds", "lead": "Listen to the word. Hold up a finger for each sound. How many sounds? Tap the number.", "items": [
                {"word": "up", "n": 2, "pic": "⬆️", "spoken": "uh, puh"},
                {"word": "cat", "n": 3, "pic": "🐈", "spoken": "kuh, ah, tuh"},
                {"word": "sun", "n": 3, "pic": "☀️", "spoken": "sss, uh, nnn"},
                {"word": "egg", "n": 2, "pic": "🥚", "spoken": "eh, guh"},
                {"word": "bus", "n": 3, "pic": "🚌", "spoken": "buh, uh, sss"},
                {"word": "stop", "n": 4, "pic": "🛑", "spoken": "sss, tuh, aw, puh"},
                {"word": "milk", "n": 4, "pic": "🥛", "spoken": "mmm, ih, luh, kuh"}]},
        },
        "check": {
            "listen": {"title": "Start and end", "lead": "Tap Hear it, then tap the picture.", "items": [
                start("bus", "bed", ["cup", "sun"], "b"), start("cat", "car", ["pen", "fish"], "k"),
                rhyme("hat", "cat", ["bus", "egg"]), start("man", "moon", ["sock", "door"], "m")]},
            "copyShapes": {"title": "Copy a row of shapes", "lead": "Copy each row on paper, from left to right. Or trace it here.", "silent": True,
                           "items": ["| | | |", "○ ○ ○ ○", "l o l o", "b d b d"]},
        },
        "canDo": ["I can hear when two words rhyme.", "I can hear when two words start the same.",
                  "I can count the sounds in a short word.", "I can hold a pen and draw lines and circles."],
    }


def hand_6(les):
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    heard = lambda name, a, wrong, why: {"q": "Which letter do you hear?", "spoken": name, "a": a, "wrong": wrong, "why": why}
    pair = lambda cap, a, wrong: {"q": "Which small letter goes with %s?" % cap, "spoken": "Which small letter goes with capital %s?" % NAME[cap],
                                  "a": a, "wrong": wrong, "why": "%s and %s are the same letter." % (cap, a)}
    spell = lambda w: {"parts": list(w), "word": w, "spoken": spelled(w)}
    return {
        "schema": "ehel-intensive-literacy/1", "level": "letters", "lesson": 6, "title": les["title"], "cando": les["cando"], "cefr": "Literacy",
        "status": "authored", "sources": ["In 3", "L1 0"],
        "about": {
            "text": "A letter has a name and a sound. You know the sounds. In this lesson you learn the names, from A to Z. You use them to spell your name, and to write down a name that someone spells to you.",
            "goals": ["Say the 26 letter names in order", "Spell your own name out loud", "Understand a name that is spelled to you",
                      "Ask a person to repeat or slow down", "Match each capital letter to its small letter"],
        },
        "unitLecture": {"chapters": [lecture_of("In", 3, 6, True, "The letters have names, A to Z")]},
        "steps": [
            ["Hear it", "The letter names, A to Z", "P.hearSounds", "hear.names"],
            ["Hear it", "Letters that sound alike", "P.findSound", "hear.alike"],
            ["See & write it", "Capital and small letters", "P.findSound", "seeWrite.match"],
            ["See & write it", "Write the capital letters", "P.seeLetters", "seeWrite.capitals"],
            ["Read it", "Spell it, letter by letter", "P.blend", "read.spell"],
            ["Read it", "Read the signs", "P.readWords", "read.words"],
            ["Check", "Spell your name", "P.readAloud", "check.myName"],
            ["Check", "Write the name you hear", "P.dictation", "check.dictation"],
        ],
        "hear": {
            "names": {"title": "The letter names, A to Z", "words": [],
                      "lead": "Tap each letter to hear its NAME. The name of b is bee; its sound is buh. Say the names in order, A to Z.",
                      "items": [{"g": c + " " + c.lower(), "spoken": NAME[c]} for c in letters]},
            "alike": {"title": "Letters that sound alike", "lead": "Tap Hear it. Which letter is it?", "items": [
                heard("ee", "E", ["I", "A"], "E says ee. I says eye."), heard("eye", "I", ["E", "Y"], "I says eye. E says ee."),
                heard("jee", "G", ["J", "Z"], "G says jee. J says jay."), heard("jay", "J", ["G", "K"], "J says jay. G says jee."),
                heard("em", "M", ["N", "H"], "M says em. N says en."), heard("en", "N", ["M", "H"], "N says en. M says em."),
                heard("bee", "B", ["D", "P"], "B says bee. D says dee."), heard("dee", "D", ["B", "T"], "D says dee. B says bee.")]},
        },
        "seeWrite": {
            "match": {"title": "Capital and small letters", "lead": "Every letter has a capital and a small form. Which small letter goes with the capital?", "items": [
                pair("B", "b", ["d", "p"]), pair("D", "d", ["b", "q"]), pair("G", "g", ["q", "j"]), pair("Q", "q", ["p", "g"]),
                pair("E", "e", ["a", "c"]), pair("N", "n", ["m", "h"]), pair("R", "r", ["n", "f"]), pair("L", "l", ["i", "t"])]},
            "capitals": {"title": "Write the capital letters", "lead": "Tap a letter to hear its name. Trace the capital and the small letter. Then write them on paper.",
                         "items": [{"g": c + " " + c.lower(), "spoken": NAME[c]} for c in letters]},
        },
        "read": {
            "spell": {"title": "Spell it, letter by letter", "lead": "Tap Spell it to hear the letter names. Then say the whole word.",
                      "partsLabel": "Spell it", "wordLabel": "Say the word",
                      "items": [spell(w) for w in ("Ana", "Omar", "Mei", "BUS", "STOP", "EXIT", "HELP", "TAXI")]},
            "words": {"title": "Read the signs", "lead": "Signs often use capital letters. Read each sign out loud. Then tap it to check.",
                      "items": ["STOP", "BUS", "EXIT", "HELP", "LIFT", "IN", "OPEN", "TAXI"]},
        },
        "check": {
            "myName": {"title": "Spell your name", "lead": "Say: My name is …, then spell it letter by letter. Record yourself, then listen back.",
                       "items": [{"w": "My name is Ana. A, N, A.", "spoken": "My name is Ana. " + spelled("Ana") + "."}]},
            "dictation": {"title": "Write the name you hear", "lead": "Listen to the letter names. Write the name.",
                          "items": [{"w": w, "spoken": spelled(w)} for w in ("Sam", "Ben", "Tom", "Ana", "Omar")]},
        },
        "canDo": ["I can say the 26 letter names.", "I can spell my name out loud.",
                  "I can write down a name that someone spells to me.", "I can say: Slowly, please. Repeat, please."],
    }


def hand_12(les):
    base = build(12, les, units=[19, 20])
    tiles = [t for t in base["hear"]["sounds"] if t["g"] in ("ph", "wh")] + [
        {"g": "c", "about": "Before e, i or y, c says s: city, cent.", "spoken": "sss"},
        {"g": "g", "about": "Before e, i or y, g often says j: age, page.", "spoken": "juh"}]
    base.update({
        "status": "authored", "sources": ["Ph 19", "Ph 20", "In 16"],
        "about": {
            "text": "This is the last lesson of Letters & Sounds. You learn ph and wh, and the second sound of c and g. You learn common words that do not follow the sounds. Then you read whole sentences, from the capital letter to the full stop.",
            "goals": ["Say the sound for ph and wh", "Read c and g before e, i or y", "Read the words that phonics cannot read",
                      "Read a whole sentence from left to right", "Write a sentence with a capital and a full stop"],
        },
        "steps": [
            ["Hear it", "Listen to the sounds", "P.hearSounds", "hear.sounds"],
            ["Hear it", "Find the sound", "P.findSound", "hear.find"],
            ["See & write it", "See and write the letters", "P.seeLetters", "seeWrite.letters"],
            ["See & write it", "Write a sentence", "P.copyWords", "seeWrite.sentences"],
            ["Read it", "Read the words", "P.readWords", "read.words"],
            ["Read it", "Words you learn by sight", "P.tricky", "read.tricky"],
            ["Read it", "Read a whole sentence", "P.reader", "read.sentences"],
            ["Read it", "Read a short text", "P.reader", "read.reader"],
            ["Read it", "Read a short text", "P.reader", "read.reader2"],
            ["Check", "Reading check: 10 words", "P.readAloud", "check.readAloud"],
            ["Check", "Reading check: sight words and a sentence", "P.readAloud", "check.sight"],
            ["Check", "Write what you hear", "P.dictation", "check.dictation"],
        ],
        "seeWrite": {
            "letters": ["ph", "wh", "c", "g"],
            "sentences": {"title": "Write a sentence", "lead": "A sentence starts with a capital letter and ends with a full stop. Tap a sentence to hear it. Copy it on paper.",
                          "items": ["The bus is late.", "I can read this.", "My phone is on the desk.", "We meet at six."]},
        },
        "check": {
            "readAloud": {"title": "Reading check: 10 words", "lead": "Record yourself reading these ten words. Then listen back, and tap each word to check.",
                          "items": ["bus", "shop", "rain", "park", "night", "stop", "fish", "name", "coin", "phone"]},
            "sight": {"title": "Reading check: sight words and a sentence", "lead": "Now five words you learn by sight, and one sentence. Record yourself, then listen back.",
                      "items": ["the", "said", "was", "people", "because", "The shop is shut on Sunday."]},
            "dictation": ["white", "city", "page"],
        },
        "canDo": ["I can read words with ph and wh, and the soft c and g.", "I can read common words that do not follow the sounds, like people and because.",
                  "I can read a whole sentence from the capital letter to the full stop.", "I can write a sentence with a capital letter and a full stop."],
    })
    base["hear"]["sounds"] = tiles
    base["read"]["tricky"] = {"title": "Words you learn by sight", "lead": "These words do not follow the sounds. Nobody can sound them out. Learn them by how they look. Tap to hear each one.",
                              "items": ["would", "could", "two", "four", "because", "people", "the", "to", "do", "you", "was", "said"]}
    base["read"]["sentences"] = {"title": "Five sentences", "lead": "Start at the capital letter. Read left to right. Stop at the full stop. Then read it once more.",
                                 "text": "The shop is shut on Sunday.\nI get the bus to work at eight.\nMy phone is on the desk.\nThe man said: wait here, please.\nTwo people came with me because the bus was late."}
    readers = [r for r in base.pop("_readers") if r["title"] != base["read"]["reader"]["title"]]
    base["read"]["reader2"] = readers[0] if readers else None
    base["unitLecture"]["chapters"][0]["title"] = "ph and wh, and the two sounds of c and g"
    base["unitLecture"]["chapters"][1]["title"] = "Reading a whole sentence"
    return base


HAND = {1: hand_1, 6: hand_6, 12: hand_12}


# --- the two Bridge lessons ------------------------------------------------------------
# For learners who already read another language in Latin letters, such as Somali,
# and do not need the twelve lessons: what English does DIFFERENTLY. They are not
# numbered lessons; the plan lists them under the level's `bridge`.
def tile(g, about, spoken=None):
    return {"g": g, "about": about, "spoken": spoken or SOUND[g]}


def find(g, a, wrong, where="has"):
    return {"q": "Listen to the sound. Which word %s it?" % where, "g": g, "spoken": SOUND[g], "a": a, "wrong": wrong, "why": "%s %s %s." % (a, where, g)}


def blend(word, parts):
    return {"parts": parts, "word": word, "spoken": ", ".join(SOUND.get(p, p) for p in parts)}


BRIDGE_A_LECTURE = [
    {"title": "Same letters, different sounds", "text": "\n".join([
        "This is Bridge A. You can read already.",
        "You read Somali, or another language with these letters.",
        "That helps a lot. The letters are the same.",
        "But English gives some letters different sounds.",
        "This lesson shows you the differences.",
        "First, a letter has a name and a sound.",
        "The name of b is bee. The sound of b is buh.",
        "When you read a new word, say the sounds, not the names.",
        "Now the five vowels: a, e, i, o, u.",
        "In a short English word, a vowel has a short sound.",
        "Listen: bag. bed. sit. box. bus.",
        "Listen carefully to u. Bus. Cup. Sun.",
        "It is not the u of Somali. It is short, and the mouth is open.",
        "English does not write a long vowel with two of the same letter.",
        "In Somali, aa is a long a. English does not use aa.",
        "English has other ways to write a long sound. Bridge B shows them."]),
     "source": "new",
     # What is SENT to the voice. A lone letter is read as its name, which is right
     # for "the name of b" and wrong for "the sound of b"; the text needs both.
     "speech": " ".join([
        "This is Bridge A. You can read already.",
        "You read Somali, or another language with these letters.",
        "That helps a lot. The letters are the same.",
        "But English gives some letters different sounds.",
        "This lesson shows you the differences.",
        "First, a letter has a name and a sound.",
        "The letter b has the name bee, and the sound buh.",
        "When you read a new word, say the sounds, not the names.",
        "Now the five vowels: a, e, i, o, u.",
        "In a short English word, a vowel has a short sound.",
        "Listen: bag. bed. sit. box. bus.",
        "Listen carefully to the uh sound in bus, cup and sun.",
        "It is not the Somali oo sound. It is short, and the mouth is open.",
        "English does not write a long vowel with two of the same letter.",
        "In Somali, double a is a long ah. English does not use double a.",
        "English has other ways to write a long sound. Bridge B shows them."])},
    {"title": "c, x and q, and two letters with one sound", "text": "\n".join([
        "Now three letters that are very different.",
        "In Somali, c and x are sounds from the throat.",
        "In English, c says k. Cup. Cat.",
        "But before e, i or y, c says s. City.",
        "In English, x says k and s together. Box. Six.",
        "In English, q comes with u, and qu says kw. Quick. Quiz.",
        "Next, two letters can make one sound.",
        "s and h make sh, as in Somali. Shop. Fish.",
        "c and h make ch. Chin. Chip.",
        "t and h make th. Put your tongue between your teeth.",
        "English has two th sounds. This. Thin.",
        "Last, dh. Somali uses it. English does not.",
        "Read slowly. Say the sounds. Then say the word."]),
     "source": "new",
     "speech": " ".join([
        "Now three letters that are very different.",
        "In Somali, c and x are sounds from the throat.",
        "In English, the letter c says kuh. Cup. Cat.",
        "But before e, i or y, the letter c says sss. City.",
        "In English, the letter x says ks. Box. Six.",
        "In English, q comes with u, and together they say kwah. Quick. Quiz.",
        "Next, two letters can make one sound.",
        "s and h make shh, as in Somali. Shop. Fish.",
        "c and h make chuh. Chin. Chip.",
        "t and h make th, as in thin. Put your tongue between your teeth.",
        "English has two th sounds. This. Thin.",
        "Last, d h. Somali uses it. English does not.",
        "Read slowly. Say the sounds. Then say the word."])},
]


def bridge_a(br):
    words = ["bag", "bed", "sit", "box", "bus", "cup", "sun", "map", "hat", "pen", "six", "quiz", "shop", "fish", "chin", "chip", "this", "that", "thin", "city"]
    return {
        "schema": "ehel-intensive-literacy/1", "level": "letters", "lesson": "A", "title": br["title"], "cando": "read English words using the English sounds of the letters you know",
        "cefr": "Literacy", "status": "authored", "sources": ["L1 0", "new"],
        "about": {
            "text": "You can read another language written in these letters, such as Somali. English uses the same letters, but some of them have different sounds. This short lesson shows you the differences, so you can read English words.",
            "goals": ["Say the short sound of each vowel: a, e, i, o, u", "Read c, x and qu the English way",
                      "Read sh, ch and the two sounds of th", "Say the sounds of a word, not the letter names"],
        },
        "unitLecture": {"chapters": BRIDGE_A_LECTURE},
        "hear": {
            "sounds": [tile("a", "Short, as in bag."), tile("e", "Short, as in bed."), tile("i", "Short, as in sit."), tile("o", "Short, as in box."),
                       tile("u", "Short, as in bus. Not the u of Somali."), tile("c", "k, as in cup. Before e, i or y it says s: city."),
                       tile("x", "k and s together, as in box and six."), tile("qu", "kw, as in quick and quiz."),
                       tile("sh", "As in shop and fish."), tile("ch", "As in chin and chip."),
                       tile("th", "Tongue between your teeth: this, thin.")],
            "find": [find("u", "bus", ["bag", "box"]), find("o", "box", ["bus", "bed"]), find("x", "six", ["sit", "shop"]),
                     find("ch", "chip", ["ship", "cup"]), find("th", "thin", ["tin", "sun"]), find("qu", "quiz", ["cup", "city"])],
        },
        "seeWrite": {"letters": ["a", "e", "i", "o", "u", "c", "x", "qu", "sh", "ch", "th"], "copy": ["bus", "six", "shop", "chip", "this"]},
        "read": {
            "blend": [blend("bus", ["b", "u", "s"]), blend("cup", ["c", "u", "p"]), blend("box", ["b", "o", "x"]), blend("stop", ["s", "t", "o", "p"]),
                      blend("shop", ["sh", "o", "p"]), blend("chip", ["ch", "i", "p"]), blend("this", ["th", "i", "s"]), blend("quiz", ["qu", "i", "z"])],
            "words": words,
            "tricky": ["the", "is", "to", "you", "was", "said"],
            "reader": next({"title": r["title"], "text": r["passageScript"]} for r in unit(0, L1)[0]["readings"] if r["title"] == "My Bag"),
        },
        "check": {"readAloud": ["bus", "cup", "six", "shop", "chip", "this"], "dictation": ["box", "fish", "that"]},
        "canDo": ["I can say the short sound of a, e, i, o and u.", "I can read c, x and qu the English way.",
                  "I can read sh, ch and th.", "I can read a new English word sound by sound."],
    }


def bridge_b(br):
    base = build(9, {"title": br["title"], "cando": ""}, units=[13, 15, 16, 17])
    readers = base.pop("_readers")
    base.update({
        "lesson": "B", "title": br["title"], "cando": "read the long vowel sounds in their different English spellings",
        "status": "authored", "sources": ["Ph 13", "Ph 15", "Ph 16", "Ph 17"],
        "about": {
            "text": "English often writes one long sound in two or three ways. The long a is ai in rain, a_e in name and ay in day. This lesson shows the spellings of the long a, e, i and o sounds, so you can read them.",
            "goals": ["Read the long a sound: ai, a_e, ay", "Read the long e sound: ee, ea", "Read the long i sound: ie, i_e, igh",
                      "Read the long o sound: oa, o_e, ow", "Choose a spelling when you write a word"],
        },
        "unitLecture": {"chapters": [
            {"title": "The long vowels", "text": retarget("Ph", 13, unit(13)[0]["visual"]["lectureScript"], "Bridge B", True), "source": "Ph 13"},
            {"title": "One sound, more than one spelling", "text": retarget("Ph", 15, unit(15)[0]["visual"]["lectureScript"], "Bridge B", False), "source": "Ph 15"}]},
        "hear": {
            "sounds": [tile("ai", "Long a, as in rain."), tile("a_e", "Long a, as in name."), tile("ay", "Long a, as in day. At the end of a word."),
                       tile("ee", "Long e, as in feet."), tile("ea", "Long e, as in eat."),
                       tile("ie", "Long i, as in pie."), tile("i_e", "Long i, as in time."), tile("igh", "Long i, as in night."),
                       tile("oa", "Long o, as in boat."), tile("o_e", "Long o, as in home."), tile("ow", "Long o, as in slow. It can also say ow, as in cow.", "oh")],
            "find": [find("ai", "rain", ["ran", "red"]), find("ay", "day", ["dog", "den"]), find("ea", "eat", ["egg", "at"]),
                     find("igh", "night", ["net", "not"]), find("oa", "boat", ["bat", "bet"]), find("ee", "feet", ["fat", "fit"])],
        },
        "seeWrite": {"letters": ["ai", "a_e", "ay", "ee", "ea", "ie", "i_e", "igh", "oa", "o_e", "ow"], "copy": ["rain", "name", "day", "night", "home"]},
        "check": {"readAloud": ["rain", "name", "day", "feet", "eat", "time", "night", "boat", "home", "slow"], "dictation": ["wait", "five", "note"]},
        "canDo": ["I can read the long a in rain, name and day.", "I can read the long e in feet and eat.",
                  "I can read the long i in pie, time and night.", "I can read the long o in boat, home and slow."],
    })
    base["read"]["blend"] = [blend("rain", ["r", "ai", "n"]), blend("name", ["n", "a_e", "m"]), blend("day", ["d", "ay"]), blend("feet", ["f", "ee", "t"]),
                             blend("eat", ["ea", "t"]), blend("time", ["t", "i_e", "m"]), blend("night", ["n", "igh", "t"]), blend("home", ["h", "o_e", "m"])]
    base["read"]["reader"] = next((r for r in readers if r["title"] != "A Week of Rain"), readers[0])
    return base


BRIDGES = {"A": bridge_a, "B": bridge_b}


def main():
    level = [l for l in PLAN["levels"] if l["id"] == "letters"][0]
    by_n = {les["number"]: les for p in level["parts"] for les in p["lessons"]}
    os.makedirs(OUT, exist_ok=True)
    for n in sorted(list(MAP) + list(HAND)):
        d = HAND[n](by_n[n]) if n in HAND else build(n, by_n[n])
        d.pop("_readers", None)
        with io.open(os.path.join(OUT, "lesson-%02d.json" % n), "w", encoding="utf-8", newline="\n") as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        steps = d.get("steps") or []
        print("lesson %2d · %-45s %s" % (n, d["title"][:45], ("%d own steps" % len(steps)) if steps else
              "sounds %2d · words %2d · blends %2d · find %d · reader %s" % (len(d["hear"]["sounds"]), len(d["read"]["words"]), len(d["read"]["blend"]),
                                                                          len(d["hear"]["find"]), (d["read"]["reader"] or {}).get("title"))))
    for k, br in zip("AB", level["bridge"]):
        d = BRIDGES[k](br)
        d.pop("_readers", None)
        with io.open(os.path.join(OUT, "bridge-%s.json" % k.lower()), "w", encoding="utf-8", newline="\n") as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print("bridge %s · %-45s sounds %2d · words %2d · reader %s" % (k, d["title"][:45], len(d["hear"]["sounds"]), len(d["read"]["words"]),
                                                                     (d["read"]["reader"] or {}).get("title")))


if __name__ == "__main__":
    main()

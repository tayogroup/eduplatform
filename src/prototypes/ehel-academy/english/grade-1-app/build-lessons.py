# -*- coding: utf-8 -*-
"""Build the Grade 1 English standalone lesson pages from the course's own data.

WHAT THIS IS. A second presentation of English Grade 1 in the design of the
Grade 1 Mathematics standalone build (mathematics/grade-1-app/g1v2): one
self-contained HTML page per unit, carrying its own CSS, its own activity JS
and its own copy of the voice engine, bypassing shell/course-app.js entirely.

WHAT IT IS NOT. It is not a fork of the content. Every word, every recording,
every answer key on these pages is read out of
english/grade-1/data/ at BUILD time and inlined. Nothing under
english/grade-1/ is written, and nothing in shell/subjects/english.js is
touched - the course a learner uses today is unchanged and unaware of this.

WHY THE CONTENT IS INLINED rather than fetched. The pages ship to
app/english/grade-1-v2/ and the course content ships to content/english/g01/;
a runtime fetch would tie a page in one tier to a file in another, which is
exactly the coupling every other standalone lesson avoids. Rebuild after a
content change; check-lessons.py cannot see staleness and does not claim to.

    python build-lessons.py            # every unit named in app.config.json
    python build-lessons.py 1          # just unit 1

Run the shared pipeline afterwards, in this order (see
mathematics/lesson-app-tools/README.md - each step assumes the last):

    python ../../mathematics/lesson-app-tools/wire-navigation.py --app .
    python ../../mathematics/lesson-app-tools/wire-platform-controls.py --app .
    python ../../mathematics/lesson-app-tools/preload-platform.py --app .
    python ../../mathematics/lesson-app-tools/wire-progress.py --app .
    python ../../mathematics/lesson-app-tools/add-header-bars.py --app .
    python ../../mathematics/lesson-app-tools/check-lessons.py --app .

This tool writes the page from scratch every time, so it must run BEFORE any
of them; running it again over a wired page throws the wiring away and the
pipeline has to be re-run. That is deliberate - a generator that tried to
preserve another tool's edits would be a patcher, and this repo has a record
of what patchers derived from other patchers cost.
"""
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ACADEMY = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ACADEMY, "english", "grade-1", "data")
SHELL = os.path.join(ACADEMY, "shell", "subjects")
LIB = os.path.join(HERE, "lib")


# ----------------------------------------------------------------------
# reading the course
# ----------------------------------------------------------------------
def load_json(path):
    return json.load(io.open(path, encoding="utf-8"))


def audio_release():
    """The ?a= stamp, read out of the shell rather than written down here.

    English names its clips for their CONTENT, so a re-recorded clip keeps its
    filename and its URL, and Bunny serves media max-age=31536000 with no
    ETag. The stamp is the only thing that reaches a child who already heard
    the broken one. A second copy of it here would go stale the first time
    english.js bumped, and nothing would say so.
    """
    s = io.open(os.path.join(SHELL, "english.js"), encoding="utf-8").read()
    m = re.search(r'^const AUDIO_RELEASE = "([^"]+)";', s, re.M)
    if not m:
        sys.exit("REFUSED: could not read AUDIO_RELEASE out of shell/subjects/english.js.\n"
                 "  It has moved or been renamed. Do not hardcode a value here - find it.")
    return m.group(1)


def word_pictures(words):
    """word -> emoji, from the shell's own map, via the shell's own function.

    Parsed by NODE rather than by a regex over the source. A regex was tried
    and quietly mis-read one entry, which is the whole failure mode this repo
    keeps recording: a true fact about the wrong property. wordPicture() also
    applies the per-grade overrides, which a regex over WORD_PICTURES cannot
    see at all.
    """
    src = os.path.join(SHELL, "word-pictures.js").replace("\\", "/")
    script = (
        'import { wordPicture } from "file:///%s";\n'
        'const ws = JSON.parse(process.argv[1]);\n'
        'const out = {};\n'
        'for (const w of ws) { const p = wordPicture(w, 1); if (p) out[w] = p; }\n'
        'process.stdout.write(JSON.stringify(out));\n' % src
    )
    r = subprocess.run(
        ["node", "--input-type=module", "-e", script, "--", json.dumps(sorted(set(words)))],
        capture_output=True)
    if r.returncode != 0:
        sys.exit("REFUSED: could not read the word pictures through node.\n" +
                 r.stderr.decode("utf-8", "replace"))
    return json.loads(r.stdout.decode("utf-8"))


def dictionary_index():
    d = load_json(os.path.join(DATA, "master-dictionary.grade1.json"))
    by_word = {}
    for e in d["entries"]:
        key = str(e.get("displayWord") or e.get("lemma") or "").strip().lower()
        if key and key not in by_word:
            by_word[key] = e
    return by_word


# ----------------------------------------------------------------------
# small helpers
# ----------------------------------------------------------------------
def slugify(title):
    s = title.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def attr(s):
    """For a single-quoted HTML attribute holding SSML.

    Single quotes so the SSML keeps its own double quotes readable; the
    apostrophes English is full of are the ones that have to go.
    """
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("'", "&#39;"))


def ssml_attr(s):
    """The same, for a body that is already SSML - its own tags must survive."""
    return str(s).replace("'", "&#39;")


def text(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def sentences(parts):
    return "".join("<s>" + attr(p) + "</s>" for p in parts if p)


def explain(calm, friendly, watch, go):
    """The four moves the voice engine's own explainers use: settle, teach,
    warn about the usual slip, then send the child back to the screen. Kept
    identical in shape to the Mathematics build so the two never sound like
    different features."""
    out = ""
    if calm:
        out += ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
                + sentences(calm) + "</prosody></mstts:express-as>")
    if friendly:
        out += ('<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
                + sentences(friendly) + "</mstts:express-as>")
    if watch:
        out += ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
                '<prosody rate="-6%">' + sentences(watch) + "</prosody></mstts:express-as>")
    if go:
        out += ('<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
                + sentences(go) + "</mstts:express-as>")
    return out


def source_of(item, *keys):
    a = item.get("audio") or {}
    for k in keys:
        if a.get(k):
            return a[k]
    return a.get("source") or a.get("normal") or ""


def sentence_pages(script, per_page=4):
    """The story, cut into pages at its own paragraph breaks.

    Never mid-paragraph: the recording reads the whole text straight through,
    so a page boundary inside a paragraph would put a break where the voice
    does not take one.
    """
    paras = [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]
    return [paras[i:i + per_page] for i in range(0, len(paras), per_page)] or [[script]]


def distractors(pool, right, n, key=lambda x: x):
    """n wrong options drawn from the unit's own material.

    A wrong tap should land on something the child is also learning. Nothing
    is invented to be wrong, and nothing that reads the same as the answer is
    offered beside it.
    """
    seen = {str(key(right)).strip().lower()}
    out = []
    for c in pool:
        k = str(key(c)).strip().lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(c)
        if len(out) >= n:
            break
    return out


# ----------------------------------------------------------------------
# the slides
# ----------------------------------------------------------------------
def build_slides(unit, cw_unit, pics, dic):
    """Return (slides, stickers, data) for one unit.

    A slide is only built where its content exists. Units 4, 7, 9 and 10 have
    no `sight` group and unit 7 and 9 no `topic` group, and an empty step is
    worse than an absent one: it can never be completed, and everything that
    counts steps would be counting one nobody can finish.
    """
    slides, stickers, data = [], [], {}

    groups = {g["strand"]: g for g in cw_unit["groups"]}
    all_words = [w for g in cw_unit["groups"] for w in g["words"]]

    def word_obj(w):
        e = dic.get(w.lower(), {})
        a = e.get("audio") or {}
        return {
            "w": e.get("displayWord") or w,
            "pic": pics.get(w, ""),
            "meaning": e.get("canonicalMeaning") or "",
            "pos": e.get("partOfSpeech") or "",
            "audio": a.get("normal") or a.get("slow") or "",
        }

    n = 0

    def add(kind, title, icon, sticker, ask, explain_ssml, extra_ids=(), block=None):
        nonlocal n
        n += 1
        slides.append({
            "n": n, "kind": kind, "title": title, "icon": icon,
            "ask": ask, "explain": explain_ssml, "extra": list(extra_ids),
            "say": block or ask,
        })
        stickers.append([icon, sticker])
        return n

    # ---- 1  the sounds this unit teaches -----------------------------
    if groups.get("phonics") and len(groups["phonics"]["words"]) >= 4:
        words = [word_obj(w) for w in groups["phonics"]["words"]]
        heard = [w for w in words if w["audio"]][:6]
        items = []
        for w in heard:
            wrong = distractors([x for x in words if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "pic": w["pic"], "ok": 1}] +
                                  [{"w": x["w"], "pic": x["pic"], "ok": 0} for x in wrong]})
        if items:
            data["sounds"] = items
            i = add("sounds", groups["phonics"]["title"], "\U0001F442", "I heard the sounds",
                    "Listen to the word, then tap the word you heard.",
                    explain(
                        ["These words all share one sound.", "Your ears do this step, not your eyes."],
                        ["I will say a word.", "Listen right to the end of it.",
                         "Then look at the words and tap the one you heard."],
                        ["It is easy to tap the first word you can read.",
                         "Wait for the whole word before you choose."],
                        ["Press Hear it again as many times as you like.", "Now listen."]),
                    ["replay"])
            data["sounds_slide"] = i

    # ---- 2  the unit's new words, one at a time ----------------------
    topic = groups.get("topic") or groups.get("phonics")
    if topic:
        words = [word_obj(w) for w in topic["words"]]
        data["newwords"] = words
        i = add("newwords", topic["title"], "\U0001F4D6", "I met the new words",
                "Say this word out loud.",
                explain(
                    ["These are the new words for this unit."],
                    ["One word at a time.", "Look at the picture.", "Say the word out loud.",
                     "Then press Next word."],
                    ["Reading a word in your head is not the same as saying it.",
                     "Your mouth has to learn it too."],
                    ["Press Hear it to hear the word said properly.", "Then say it with me."]),
                ["replay", "next"])
        data["newwords_slide"] = i

    # ---- 3  the picture is the question ------------------------------
    pictured = []
    seen_pics = set()
    for w in all_words:
        o = word_obj(w)
        if o["pic"] and o["pic"] not in seen_pics:
            seen_pics.add(o["pic"])
            pictured.append(o)
    if len(pictured) >= 4:
        items = []
        for w in pictured[:6]:
            wrong = distractors([x for x in pictured if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "pic": w["pic"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "ok": 1}] + [{"w": x["w"], "ok": 0} for x in wrong]})
        data["match"] = items
        i = add("match", "Word and picture", "\U0001F5BC️", "I matched word to picture",
                "Which word is this?",
                explain(
                    ["A word is a picture you can say."],
                    ["Look at the picture.", "Say what it is, out loud.",
                     "Then find that word and tap it."],
                    ["Two words can start with the same letter.",
                     "Read to the end of the word before you tap."],
                    ["Say it first.", "Then tap it."]),
                ())
        data["match_slide"] = i

    # ---- 4  the words we see everywhere ------------------------------
    if groups.get("sight") and len(groups["sight"]["words"]) >= 4:
        words = [word_obj(w) for w in groups["sight"]["words"]]
        heard = [w for w in words if w["audio"]][:6]
        items = []
        for w in heard:
            wrong = distractors([x for x in words if x is not w], w, 2, key=lambda x: x["w"])
            items.append({"w": w["w"], "audio": w["audio"],
                          "opts": [{"w": w["w"], "pic": "", "ok": 1}] +
                                  [{"w": x["w"], "pic": "", "ok": 0} for x in wrong]})
        if items:
            data["sight"] = items
            i = add("sight", groups["sight"]["title"], "\U0001F440", "I know the everyday words",
                    "Listen, then tap the word you heard.",
                    explain(
                        ["These little words have no picture.",
                         "You cannot draw the word the.", "You just have to know it."],
                        ["They turn up in nearly every sentence you will ever read.",
                         "So knowing them by sight makes reading much faster."],
                        ["Do not try to sound these out letter by letter.",
                         "Look at the whole word and know it."],
                        ["Listen, and tap the one you heard."]),
                    ["replay"])
            data["sight_slide"] = i

    # ---- 5  the story ------------------------------------------------
    story = next((r for r in unit["readings"] if r.get("type") == "Story"), None) or unit["readings"][0]
    data["story"] = {
        "title": story.get("title") or "The story",
        "pages": sentence_pages(story.get("passageScript") or ""),
        "audio": source_of(story),
    }
    i = add("story", "The story", "\U0001F4DA", "I read the story",
            "Press Listen, then follow the words with your finger.",
            explain(
                ["Now a whole story, read to you."],
                ["Press Listen and let it play.", "Follow the words with your finger as you hear them.",
                 "That is how the sound and the letters join up in your head."],
                ["Do not stop to work out every word.",
                 "Keep following.", "You can hear it again afterwards."],
                ["Press Listen, and off we go."]),
            ["replay", "next"])
    data["story_slide"] = i

    # ---- 6  the story questions --------------------------------------
    #        Only the factual ones. A question whose accepted answer is a
    #        FAMILY of answers ("(any true colour)", "Any two of: ...", a
    #        blank in the question itself) has no single right button to
    #        tap, so it goes to the speaking step instead of being turned
    #        into a multiple choice it is not.
    #
    #        Classified by the ANSWER'S SHAPE, not by questionType. Units
    #        1-9 spell the open kind "Point, act or say" and the factual
    #        kind "Oral response" - two labels, cleanly split - but unit 10
    #        files everything under a third label, "Oral, point or choose",
    #        that names both at once. Matching the string "Oral response"
    #        therefore dropped all twelve of unit 10's comprehension
    #        questions, ten of which are perfectly good facts ("What is the
    #        name of Amal's new book?" => "My First English World"). Tested
    #        against every unit: this classifier agrees with the type-string
    #        test everywhere units 1-9 use it, and recovers unit 10.
    def is_factual(c):
        ans = str(c.get("correctAnswer") or "").strip()
        q = str(c.get("question") or "")
        if not ans or not q or "___" in q or "___" in ans:
            # "___" in the ANSWER is a talk-line TEMPLATE, not a fact -
            # "Which talk line tells us your name?" => "My name is ___."
            # is a pattern to complete with your own name, and 14 of these
            # across units 1-9 have no "(any ...)" annotation to catch them
            # any other way. Found by diffing this unit's own output before
            # and after adding this line - the classifier moved "My name is
            # ___." into the quiz step, where a child would have had to tap
            # the literal blank.
            return False
        if re.search(r"\(\s*(any|or)\b", ans, re.I) or re.match(r"^\s*any\b", ans, re.I):
            return False
        return len(ans) <= 70

    factual = [c for c in unit["comprehension"] if is_factual(c)]
    if len(factual) >= 3:
        items = []
        for c in factual[:6]:
            wrong = distractors([x for x in factual if x is not c], c, 2,
                                key=lambda x: x["correctAnswer"])
            items.append({
                "ask": c["question"],
                "opts": [{"t": c["correctAnswer"], "ok": 1}] +
                        [{"t": x["correctAnswer"], "ok": 0} for x in wrong],
                "why": c.get("explanation") or "",
            })
        data["questions"] = items
        i = add("questions", "Story questions", "\U0001F914", "I answered the story questions",
                "Tap the answer.",
                explain(
                    ["Every answer here is in the story you just read."],
                    ["Read the question.", "Think back to the story.",
                     "Then tap the answer you remember."],
                    ["If you cannot remember, that is fine.",
                     "Go back a step and read it again.", "That is not cheating, that is reading."],
                    ["Take your time, then tap."]),
                ())
        data["questions_slide"] = i

    # ---- 7  say it out loud ------------------------------------------
    lines = []
    for s in unit["speaking"][:3]:
        t = (s.get("instructionsAndModelLines") or "").strip()
        if t:
            lines.append({"text": t, "audio": source_of(s)})
    for c in unit["comprehension"]:
        if not is_factual(c) and len(lines) < 6:
            lines.append({"text": c["question"], "audio": ""})
    if lines:
        data["sayit"] = lines
        i = add("sayit", "Say it out loud", "\U0001F5E3️", "I said it out loud",
                "Listen, then say it out loud.",
                explain(
                    ["English is a language before it is anything on a page."],
                    ["Press the speaker to hear the line.", "Then say it yourself, out loud.",
                     "Say it to a grown-up if one is near you, or just say it to yourself."],
                    ["Nobody is marking this and nothing is listening.",
                     "Tick it when you have said it, and be honest with yourself."],
                    ["Your turn. Out loud."]),
                ())
        data["sayit_slide"] = i

    # ---- 8  what English does ----------------------------------------
    rules = []
    for g in unit["grammar"]:
        rules.append({
            "title": g.get("title") or "",
            "pattern": g.get("ruleAndExamples") or "",
            "explanation": g.get("explanation") or "",
            "mistake": g.get("commonMistake") or "",
            "tip": g.get("memoryTip") or "",
            "practice": g.get("practice") or "",
            "audio": source_of(g),
        })
    if rules:
        data["rules"] = rules
        i = add("rules", "How English works", "\U0001F9E9", "I learned the patterns",
                rules[0]["title"],
                explain(
                    ["English has patterns, and a pattern is a thing you can reuse."],
                    ["The gold line is the pattern.", "Learn that, and you can say a hundred sentences,",
                     "not just the one on the screen."],
                    ["Read the Watch out box.",
                     "It is there because almost every child slips on that exact thing."],
                    ["Press Hear it, then read it once more, then press Next."]),
                ["replay", "next"])
        data["rules_slide"] = i

    # ---- 9  write it -------------------------------------------------
    #        The model sentence is the answer; the extra tiles are the unit's
    #        own words, so a wrong build is still English the child is
    #        learning rather than nonsense put there to trip them.
    write = next((w for w in unit["writing"] if (w.get("modelText") or "").strip()), None)
    if write:
        raw_model = write["modelText"]
        has_blank = "_" in raw_model

        def tidy(s):
            s = re.sub(r"\s+([.!?])", r"\1", re.sub(r"\s+", " ", str(s))).strip()
            if s and not s.endswith((".", "!", "?")):
                s += "."
            return s

        # The curriculum already writes the exact model answer for nine of
        # ten units - a "Sentence: This is a chair." line inside
        # completedExample. Use it, rather than guessing a word to fill the
        # blank with: a guess can be grammatical and still wrong, and one
        # WAS - unit 10's blank is "My name is ___.", and every taught word
        # is a number, a feeling or a greeting, none of them a name. The
        # picked word ("happy") produced "My name is happy.", which reads
        # fine and answers a question nobody asked. This build no longer
        # invents an answer where the content already states one.
        answer = None
        items = list((write.get("completedExample") or {}).get("items") or [])
        if not has_blank:
            # a complete sentence already - inserting a word into it was the
            # OTHER bug this replaces: unit 6's model has no blank at all
            # and a forced word turned "I can see with my eyes." into
            # "I can see with my eyes face."
            answer = tidy(raw_model)
        else:
            sentence_line = next(
                (re.match(r"^\s*sentence\s*:\s*(.+)$", it, re.I) for it in items
                 if re.match(r"^\s*sentence\s*:\s*(.+)$", it, re.I)), None)
            if sentence_line:
                answer = tidy(sentence_line.group(1))
            else:
                # No "Sentence:" line (unit 7 alone) - completedExample
                # instead carries a short LABEL ("Vehicle label: school
                # bus") beside an unrelated full sentence ("Safety
                # sentence: I use the pavement."), and only the label
                # completes THIS model's blank. Told apart by shape: a
                # label does not already end in sentence punctuation, a
                # full sentence does.
                starter = (write.get("sentenceStarter") or "").strip()
                label_val = None
                for it in items:
                    lm = re.match(r"^\s*(?!drawing\b)[\w ]+:\s*(.+)$", it, re.I)
                    if lm and not lm.group(1).strip().endswith((".", "!", "?")):
                        label_val = lm.group(1).strip()
                        break
                if label_val:
                    answer = tidy((starter.rstrip() + " " + label_val) if starter
                                 else re.sub(r"_+", label_val, raw_model))
        if not answer:
            # Last resort, reached by no unit in Grades 1: the old
            # word-from-vocabulary guess, kept rather than leaving the step
            # unbuilt if a future unit's content has neither shape above.
            model = tidy(re.sub(r"_+", "", raw_model))
            said = " ".join([write.get("promptAndInstructions") or ""] + items +
                            list((write.get("completedExample") or {}).get("otherAnswers") or [])).lower()
            pool = (topic["words"] if topic else []) + all_words

            def named(w):
                return re.search(r"\b%s\b" % re.escape(w.lower()), said) is not None

            def pictured_noun(w):
                e = dic.get(w.lower())
                return bool(e) and e.get("partOfSpeech") == "noun" and bool(pics.get(w))

            noun = (next((w for w in pool if named(w) and dic.get(w.lower())), None)
                    or next((w for w in pool if pictured_noun(w)), None)
                    or next((w for w in pool if dic.get(w.lower())), None))
            answer = model
            if noun:
                answer = (answer[:-1].strip() + " " + noun + ".") if answer.endswith(".") \
                    else answer + " " + noun + "."
        tiles = [t for t in re.findall(r"[A-Za-z']+|[.!?]", answer)]
        spare = [w for w in all_words if w not in [t.lower() for t in tiles]][:3]
        data["write"] = {
            "ask": (write.get("promptAndInstructions") or "").strip(),
            "title": write.get("title") or "Write it",
            "answer": " ".join(tiles),
            "tiles": tiles + spare,
            "audio": source_of(write),
        }
        i = add("write", "Write a sentence", "✍️", "I wrote a sentence",
                data["write"]["ask"] or "Build the sentence.",
                explain(
                    ["Writing a sentence is putting words in an order that means something."],
                    ["Tap the words one at a time to put them on the line.",
                     "Tap a word on the line to take it back off.",
                     "When it reads like a real sentence, press Check it."],
                    ["A sentence needs its full stop at the end.",
                     "Without one it never finishes."],
                    ["Read your line out loud before you check it.",
                     "Your ears will tell you if a word is in the wrong place."]),
                ["line", "tiles", "check", "clear"])
        data["write_slide"] = i

    # ---- 10  the check -----------------------------------------------
    quiz = []
    for q in unit["quizzes"]:
        opts = [o.strip() for o in str(q.get("options") or "").split("|") if o.strip()]
        ok = (q.get("correctAnswer") or "").strip()
        if not opts or ok not in opts:
            continue
        quiz.append({"ask": q["question"],
                     "opts": [{"t": o, "ok": 1 if o == ok else 0} for o in opts],
                     "why": q.get("explanation") or ""})
    if quiz:
        data["quiz"] = quiz
        i = add("check", "Show what you know", "✅", "I showed what I know",
                "Tap the answer.",
                explain(
                    ["Nothing new here.", "Every question is something this unit already taught you."],
                    ["Read the question right to the end.",
                     "Then read every answer before you pick one."],
                    ["The answer that catches your eye first is often the one put there to catch it."],
                    ["Take your time. Then tap."]),
                ())
        data["quiz_slide"] = i

    return slides, stickers, data


# ----------------------------------------------------------------------
# the page
# ----------------------------------------------------------------------
SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="%(say)s">
      <div class="slide-head"><span class="n">%(n)d</span><h2>%(title)s</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="ask%(n)d">%(ask)s</span></div>
      <div class="stage">
        <div id="stage%(n)d"></div>
        <div class="choices" id="ch%(n)d"></div>
        <p class="fb" id="fb%(n)d"></p>
        <p class="score" id="score%(n)d"></p>
      </div>
    </section>
"""

STICKER_SLIDE = """    <section class="slide" data-explain='%(explain)s' data-say="Look at all the stickers you earned!">
      <div class="slide-head"><span class="n">&#9733;</span><h2>My stickers</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span>Every step you finished earned a sticker.</span></div>
      <div class="stage">
        <div class="stickers" id="stickers"></div>
        <p class="fb" id="fbstick"></p>
        <div class="bigbtns"><button type="button" class="big ghost small" id="restart">Play again</button></div>
      </div>
    </section>
"""

PAGE = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">
<style>
%(css)s</style>

<div class="wrap">
  <header class="hero">
    <div>
      <p class="eyebrow">Ehel Academy &middot; Grade 1 English &middot; Unit %(unit)d</p>
      <h1>%(h1)s</h1>
    </div>
    <nav class="dots" id="dots" aria-label="Steps"></nav>
  </header>

  <div class="deck" id="deck">
%(slides)s  </div>

  <div class="foot">
    <button type="button" class="big small ghost" id="back">&#9664; Back</button>
    <span class="mid" id="where"></span>
    <button type="button" class="big small" id="next">Next &#9654;</button>
  </div>
</div>

<script>
(function () {

  /* ==================================================================
     %(title)s - Grade 1 English, Unit %(unit)d.

     GENERATED by english/grade-1-app/build-lessons.py from
     english/grade-1/data. Do not hand-edit: the next build overwrites it,
     and the fix for anything wrong on this page is either in the course
     content or in the builder.
     ================================================================== */

  const LESSON = %(data)s;

%(voice)s

%(deck)s

%(english)s

  const STICKERS = %(stickers)s;

%(bootstrap)s
  show(0, false);

})();
</script>
"""


def bootstrap(slides, data):
    """The per-slide calls, in the order the slides appear.

    finish(i) takes the slide's 0-BASED index, and STICKERS is in the same
    order, so the dot rail, the sticker shelf and the progress report are one
    numbering rather than three that can drift.
    """
    out = []
    for s in slides:
        n = s["n"]
        i = n - 1
        # `ask` and `say` are the same element under two names. sequence() is
        # lifted verbatim from the Mathematics build and calls it `say`; the
        # English renderers call it `ask`, because on those steps it is a
        # question rather than an instruction. Renaming either would fork a
        # function this build deliberately shares.
        el = ('{ ask: "ask%d", say: "ask%d", stage: "stage%d", ch: "ch%d", fb: "fb%d", score: "score%d"'
              % (n, n, n, n, n, n))
        for extra in s["extra"]:
            el += ', %s: "%s%d"' % (extra, extra, n)
        el += " }"
        k = s["kind"]
        if k in ("sounds", "sight"):
            out.append('  hearAndTap({ el: %s, items: LESSON.%s, finish: %d,\n'
                       '    ask: "Which word did you hear?", label: "Word",\n'
                       '    done: "You know these words by their sound now." });'
                       % (el, "sounds" if k == "sounds" else "sight", i))
        elif k == "newwords":
            out.append('  wordWalk({ el: %s, items: LESSON.newwords, finish: %d,\n'
                       '    ask: "Say this word out loud.", label: "Word",\n'
                       '    done: "Now you have met them, you will see them all through the unit." });'
                       % (el, i))
        elif k == "match":
            out.append('  pictureMatch({ el: %s, items: LESSON.match, finish: %d,\n'
                       '    ask: "Which word is this?", label: "Picture",\n'
                       '    done: "You can read those words on their own now." });' % (el, i))
        elif k == "story":
            out.append('  storyRead({ el: %s, title: LESSON.story.title, pages: LESSON.story.pages,\n'
                       '    audio: LESSON.story.audio, finish: %d,\n'
                       '    done: "You read the whole story." });' % (el, i))
        elif k == "questions":
            out.append('  sequence({ el: %s, items: LESSON.questions, finish: %d,\n'
                       '    label: "Question", done: "You remembered the story well." });' % (el, i))
        elif k == "sayit":
            out.append('  sayOutLoud({ el: %s, items: LESSON.sayit, finish: %d,\n'
                       '    ask: "Listen, then say it out loud.",\n'
                       '    done: "Well said. Speaking is how the words stick." });' % (el, i))
        elif k == "rules":
            out.append('  ruleWalk({ el: %s, items: LESSON.rules, finish: %d,\n'
                       '    done: "Those are the patterns this unit is built on." });' % (el, i))
        elif k == "write":
            out.append('  buildSentence({ el: %s, ask: LESSON.write.ask, tiles: LESSON.write.tiles,\n'
                       '    answer: LESSON.write.answer, finish: %d,\n'
                       '    done: "That is a real sentence, written by you." });' % (el, i))
        elif k == "check":
            out.append('  sequence({ el: %s, items: LESSON.quiz, finish: %d,\n'
                       '    label: "Question", done: "That is the whole unit finished." });' % (el, i))
    return "\n".join(out) + "\n"


def build(unit_no, manifest, cw, dic, css, voice, deck, english, release):
    entry = next(u for u in manifest["units"] if u["number"] == unit_no)
    unit = load_json(os.path.join(DATA, "units", "unit-%d.json" % unit_no))
    cw_unit = next(u for u in cw["units"] if u["unitNo"] == unit_no)

    words = [w for g in cw_unit["groups"] for w in g["words"]]
    pics = word_pictures(words)

    slides, stickers, data = build_slides(unit, cw_unit, pics, dic)
    data = {k: v for k, v in data.items() if not k.endswith("_slide")}
    data["audioRelease"] = release
    data["unitNo"] = unit_no
    data["unitTitle"] = entry["title"]

    title = entry["title"]
    parts = title.split(" ")
    h1 = (" ".join(parts[:-1]) + " <em>" + parts[-1] + "</em>") if len(parts) > 1 else "<em>" + title + "</em>"

    body = "".join(SLIDE % {
        "n": s["n"], "title": text(s["title"]), "ask": text(s["ask"]),
        "explain": ssml_attr(s["explain"]), "say": attr(s["say"]).replace('"', "&quot;"),
    } for s in slides)
    body += STICKER_SLIDE % {"explain": ssml_attr(explain(
        [], ["Nothing to work out here.", "This is your shelf.",
             "One sticker for every step you finished."], [],
        ["Have a look at what you earned."]))}

    page = PAGE % {
        "title": title, "unit": unit_no, "h1": h1, "css": css,
        "slides": body,
        "data": json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  "),
        "voice": voice, "deck": deck, "english": english,
        "stickers": json.dumps(stickers, ensure_ascii=False),
        "bootstrap": bootstrap(slides, data),
    }
    name = slugify(title) + ".html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8", newline="").write(page)
    print("  ok   %-30s unit %-2d  %d steps + stickers  %6d bytes"
          % (name, unit_no, len(slides), len(page)))
    return name, title


def main():
    wanted = [int(a) for a in sys.argv[1:] if a.isdigit()]
    manifest = load_json(os.path.join(DATA, "course-manifest.json"))
    cw = load_json(os.path.join(DATA, "core-words.json"))
    dic = dictionary_index()
    release = audio_release()

    css = io.open(os.path.join(LIB, "lesson.css"), encoding="utf-8").read()
    voice = io.open(os.path.join(LIB, "voice.js"), encoding="utf-8").read()
    deck = io.open(os.path.join(LIB, "deck.js"), encoding="utf-8").read()
    english = io.open(os.path.join(LIB, "english.js"), encoding="utf-8").read()

    units = wanted or [u["number"] for u in manifest["units"]]
    print("\n  Building Grade 1 English lessons  (audio stamp %s)\n" % release)
    built = [build(n, manifest, cw, dic, css, voice, deck, english, release) for n in units]
    print("\n  %d page(s). Now run the shared pipeline - see the docstring.\n" % len(built))


main()

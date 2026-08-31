from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from ehel_lecture_captions import balance_lines, chunk_narration, render_vtt  # noqa: E402
import ehel_lecture_alignment as alignment_lib  # noqa: E402


ROOT = Path(__file__).resolve().parents[1]
ENGLISH_ROOT = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
VOICE_ID = "XfNU2rGpBa01ckF309OY"
MODEL_ID = "eleven_multilingual_v2"
WIDTH, HEIGHT = 1280, 720


def load_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = ["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]
    for name in names:
        candidate = Path("C:/Windows/Fonts") / name
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def clean(value: str, limit: int = 320) -> str:
    text = " ".join(str(value or "").replace("--", "-").split())
    return text[:limit].rsplit(" ", 1)[0] + "..." if len(text) > limit else text


# --- Narration text helpers ---------------------------------------------------
#
# The lecture is SPOKEN (ElevenLabs) and captioned from the same string, so a
# template seam is heard as well as read. The 2026-08-17 review of all 64
# rendered lectures found five seams, each below with the line that caused it:
#
#   "you will be able to learner can recognise…"  outcomes glued on verbatim
#   "you will also name…", "(“i see with my eyes”)", "in english"
#                                                   .lower() over the whole join
#   "Welcome to Grade 4 English, Unit 3… Welcome to Unit 3!"
#                                                   overview already opens with a welcome (35 units)
#   "…“i go to school by ___.”."  /  "…Conjunctions?."
#                                                   ". " appended after a closing quote or "?"
#   "For example, compare these two sentences:"  → nothing
#                                                   clean() cuts at a WORD boundary
#
# Nothing here rewrites content — every function only decides how a unit's own
# text is joined into a sentence.

_TERMINAL = re.compile(r'[.!?…]+["”’\')\]]*$')
# Outcome statements are written in several voices across the grades. All of
# these must read as a bare verb phrase after "you will be able to":
#   "Learner can recognise…"  "Learners will be able to…"  "I can…"
#   "You will…"  "Be able to…"  "The learner will…"
_OUTCOME_SUBJECT = re.compile(
    r"^(?:(?:the\s+)?learners?|students?|pupils?|children|you|i)\s+"
    r"(?:can|will(?:\s+be\s+able\s+to)?|are\s+able\s+to|am\s+able\s+to|is\s+able\s+to|should\s+be\s+able\s+to)\s+"
    r"|^be\s+able\s+to\s+",
    re.I,
)
# A first word that must keep its capital when the phrase is spliced mid-sentence.
_KEEP_CAPITAL = re.compile(r"^(?:I|I'[a-z]+|English|Grade|Unit|Cambridge|Somali|Arabic|Year)\b")
# Any opening "Welcome…" sentence — "Welcome to Unit 3!", "Welcome to your first
# unit of Year 2 English.", "Welcome back to…" — the template says its own.
_LEADING_WELCOME = re.compile(r"^\s*Welcome\b[^.!?]*[.!?]+\s*", re.I)


def outcome_phrase(value: str) -> str:
    """'Learner can name the five senses.' -> 'name the five senses'

    Strips the subject+modal an outcome statement carries, drops the final
    stop so the phrase can be spliced, and lowercases ONLY the first letter —
    and not even that when the first word is a proper noun or "I".
    """
    text = " ".join(str(value or "").replace("--", "-").split())
    text = _OUTCOME_SUBJECT.sub("", text, count=1)
    text = re.sub(r"[.\s]+$", "", text)
    if text and not _KEEP_CAPITAL.match(text):
        text = text[0].lower() + text[1:]
    return text


def sentence(value: str) -> str:
    """Give a phrase exactly one terminal stop.

    Leaves a phrase alone when it already ends in . ! ? … — including when
    that stop sits inside a closing quote or bracket ('…by ___.”'), which is
    what turned into '.”.' before.
    """
    text = " ".join(str(value or "").split())
    if not text or _TERMINAL.search(text):
        return text
    return text + "."


def clean_narration(value: str, limit: int) -> str:
    """Trim spoken text to `limit` characters at a SENTENCE boundary.

    clean() cuts at a word and appends '...', which the voice reads as a
    trailing-off — fine on a slide bullet, wrong for narration ("For example,
    compare these two sentences:" and then nothing). Here whole sentences are
    kept while they fit; only when the very first sentence is longer than the
    limit does it fall back to the word cut.
    """
    text = " ".join(str(value or "").replace("--", "-").split())
    if len(text) <= limit:
        return text
    kept = ""
    for match in re.finditer(r'.+?[.!?…]+["”’\')\]]*(?:\s+|$)', text, re.S):
        candidate = (kept + match.group()).strip()
        if len(candidate) > limit:
            break
        kept = candidate
    return kept if kept else clean(text, limit)


def overview_narration(overview: str, limit: int) -> str:
    """The overview, minus a leading 'Welcome to Unit N!' the template already says."""
    return clean_narration(_LEADING_WELCOME.sub("", str(overview or ""), count=1), limit)


def join_outcomes(phrases: list[str]) -> str:
    phrases = [p for p in phrases if p]
    if not phrases:
        return "Keep this unit's goals in mind as you work."
    parts = [sentence("By the end of this unit, you will be able to " + phrases[0])]
    parts.extend(sentence("You will also " + p) for p in phrases[1:])
    parts.append("Keep these goals in mind as you work.")
    return " ".join(parts)


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.ImageFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textbbox((0, 0), trial, font=face)[2] <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def resolve_asset(grade_root: Path, value: str) -> Path:
    return (grade_root / value).resolve()


def build_slides(unit: dict, dictionary: dict) -> list[dict]:
    entries = {item["dictionaryEntryId"]: item for item in dictionary["entries"]}
    words = [entries[link["dictionaryEntryId"]]["displayWord"] for link in unit["dictionaryLinks"][:6] if link["dictionaryEntryId"] in entries]
    # Spoken form: a bare verb phrase per outcome ("name the five senses"), so
    # it can follow "you will be able to". The slide bullet keeps the outcome
    # as written, capital and all — it is read, not spliced.
    outcome_phrases = [outcome_phrase(clean_narration(item["learningOutcome"], 520)) for item in unit["outcomes"][:3]]
    outcomes = [clean(item["learningOutcome"], 150) for item in unit["outcomes"][:3]]
    reading_titles = [item["title"] for item in unit["readings"][:2]]
    # A placeholder title is narrated verbatim ("The reading sequence includes
    # Amazing Arts: source text 1 and Amazing Arts: source text 2") — 36 of the
    # 64 rendered lectures said exactly that. Refuse rather than bill for it.
    placeholders = [t for t in reading_titles if re.search(r"\bsource text \d\b", t, re.I)]
    if placeholders:
        raise SystemExit(
            f"{unit['grade']['label']} Unit {unit['unit']['unitNo']}: "
            f"reading title(s) are placeholders {placeholders!r} — name the readings before rendering a lecture."
        )
    grammar = unit["grammar"][0]
    speaking = unit["speaking"][0]
    writing = unit["writing"][0]
    title = unit["unit"]["unitTitle"]
    overview = overview_narration(unit["unit"]["unitOverview"], 760)
    # One template served every grade, so a five-year-old was told to "notice
    # viewpoint and reliability, and support every inference with relevant
    # evidence" (second-pass review, 2026-08-17). Grades 1-3 get the same slides
    # in words a young child can follow; the upper grades keep the original.
    young = int(unit["grade"].get("number") or re.sub(r"\D", "", unit["grade"].get("label", "9")) or 9) <= 3
    T = {
        "vocab_bullets_title": "Words to learn" if young else "Language for precise thinking",
        "vocab": ("Listen to each word, look at what it means, and try to use it when you talk and write."
                  if young else "Listen to each pronunciation in the vocabulary lab, study its meaning in context, and use the word accurately in your own discussion and writing."),
        "read_title": "Read and think" if young else "Read critically",
        "read_bullets": ["Find the big idea", "Point to the words that show it"] if young else ["Identify central ideas", "Support conclusions with evidence"],
        "read": ("Read slowly, look at the pictures, and find the big idea in each text. When you answer a question, point to the words that show it."
                 if young else "Read actively. Identify each text's central ideas, notice viewpoint and reliability, and support every inference with relevant evidence from the text."),
        "grammar_bullets": ["Look at the examples", "Try it in your own sentences"] if young else ["Notice the structure", "Apply it in connected paragraphs"],
        "grammar": ("Look at the examples, then try the pattern in your own sentences."
                    if young else "Notice the structure in the model examples, then apply it deliberately in connected sentences and paragraphs."),
        "sw_bullets_tail": "Say it, write it, make it better" if young else "Explain, support and improve your ideas",
        "sw": ("Say your ideas clearly and listen to your partner. In writing, you will draw, trace, copy or write, then check your work with a grown-up or the AI tutor."
               if young else "Organise your ideas, use evidence and respond clearly to questions. In writing, you will plan, draft, check and revise. Use the success criteria before submitting your work."),
        "path": ("You are ready to begin. Start with the words, then the reading and the questions, then the grammar, speaking and writing. Ask the AI tutor for help any time, and bring your questions to a live session too if you join one."
                 if young else "You are ready to begin. Start with the vocabulary lab, continue through reading and comprehension, apply the grammar focus, and complete the speaking and writing practices. Use the AI tutor for hints and feedback any time, and bring your questions to a live session too if you join one."),
    }

    return [
        {
            "kicker": f"{unit['grade']['label'].upper()} ENGLISH  |  UNIT {unit['unit']['unitNo']}",
            "title": title,
            "bullets": ["Listen for the big ideas", "Preview the learning journey", "Prepare to read, discuss and write"],
            "narration": " ".join(filter(None, [
                sentence(f"Welcome to {unit['grade']['label']} English, Unit {unit['unit']['unitNo']}: {title}"),
                sentence(overview),
                "In this short lecture, preview the key ideas and prepare for the independent lesson.",
            ])),
        },
        {
            "kicker": "LEARNING OUTCOMES",
            "title": "What you will achieve",
            "bullets": outcomes,
            "narration": join_outcomes(outcome_phrases),
        },
        {
            "kicker": "KEY VOCABULARY",
            "title": T["vocab_bullets_title"],
            "bullets": words,
            "narration": f"Your vocabulary work begins with these words: {', '.join(words)}. {T['vocab']}",
        },
        {
            "kicker": "READING AND EVIDENCE",
            "title": T["read_title"],
            "bullets": reading_titles + T["read_bullets"],
            "narration": f"The reading sequence includes {reading_titles[0]} and {reading_titles[1]}. {T['read']}",
        },
        {
            "kicker": "LANGUAGE FOCUS",
            "title": grammar["title"],
            "bullets": [clean(grammar["explanation"], 155)] + T["grammar_bullets"],
            "narration": " ".join(filter(None, [
                sentence(f"The first language focus is {grammar['title']}"),
                sentence(clean_narration(grammar["explanation"], 500)),
                T["grammar"],
            ])),
        },
        {
            "kicker": "SPEAKING AND WRITING",
            "title": "Use English for a real purpose",
            "bullets": [speaking["title"], writing["title"] or "Writing and revision", T["sw_bullets_tail"]],
            "narration": " ".join([
                sentence(f"In speaking, you will complete {speaking['title']}"),
                T["sw"],
            ]),
        },
        {
            "kicker": "YOUR LEARNING PATH",
            "title": "You are ready to begin",
            "bullets": ["Vocabulary and dictionary", "Reading and comprehension", "Grammar, speaking and writing", "Activities, quiz and optional live sessions"],
            "narration": T["path"],
        },
    ]


# A run of underscores is a fill-in-the-blank marker meant to be SEEN, never
# spoken, but ElevenLabs does not treat it as silent. Grade 1 Unit 1's outcomes
# slide — "My name is ___. I am ___ years old. I like ___." — came back as
# "My name is Da Christal. I am a Christal a years old. I like Da Christal way
# so.": the model hallucinates a word to fill the position instead of skipping
# it, and three blanks in one slide produced three different hallucinations.
# Confirmed by transcribing the actual recording, not by inspecting the
# source text. Applied only to what is SENT to the voice, in create_audio()
# below — the slide's own displayed text keeps its "___" untouched. The same
# fix, same reasoning, lives in tools/lib/ehel-tts.js's speakableBlanks() for
# the other narration pipeline (generate-ehel-english-audio.js); Python and
# Node don't share a module here, so keep the two in step by hand.
def speakable_blanks(text: str) -> str:
    return re.sub(r"_{2,}", "blank", text)


# A bare hyphen between two single letters ("A-Z", "a-m") is not reliably read
# as "to" — confirmed 2026-08-18 by a user report on THIS unit's own lecture:
# "Week 1: Learn the Alphabet (A-Z)" and "Week 2: Phonics (Letter Sounds a-m)"
# both came out wrong, sourced straight from readings[].title via
# reading_titles above. Same fix shape as speakable_blanks() above: rewrite
# only what is SENT to the voice, never the displayed slide bullet. The
# lookahead-into-backreference captures the MAXIMAL hyphen-joined run of
# single letters before deciding anything, so a 3+-segment phonics blend
# ("c-a-t", spoken letter-by-letter on purpose) is never mistaken for a
# 2-letter range — and neither is the "A-a" inside "A-a-apple" peeled off on
# its own, which a simpler pattern's backtracking would do. Python and Node
# don't share a module here (see speakable_blanks above) — keep this in step
# by hand with speakableLetterRanges() in tools/lib/ehel-tts.js.
_LETTER_CHAIN_RE = re.compile(r"\b(?=([A-Za-z](?:[-–][A-Za-z])+))\1(?![-–]?[A-Za-z])")


def speakable_letter_ranges(text: str) -> str:
    def repl(m: re.Match) -> str:
        chain = m.group(1)
        parts = re.split(r"[-–]", chain)
        if len(parts) != 2:
            return chain  # phonics blend or longer — leave untouched
        a, b = parts
        if a != b and a.lower() == b.lower():
            upper = a if a == a.upper() else b
            lower = a if a == a.lower() else b
            return f"capital {upper}, lowercase {lower}"
        return f"{a} to {b}"

    return _LETTER_CHAIN_RE.sub(repl, text)


def create_audio(text: str, output: Path) -> None:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY is not configured.")
    text = speakable_letter_ranges(speakable_blanks(text))
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
        data=json.dumps({
            "text": text,
            "model_id": MODEL_ID,
            "voice_settings": {"stability": 0.52, "similarity_boost": 0.82, "style": 0.24, "use_speaker_boost": True},
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "audio/mpeg", "xi-api-key": key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            output.write_bytes(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise SystemExit(f"ElevenLabs request failed ({error.code}): {detail}") from error


def duration(path: Path, ffprobe: str) -> float:
    result = subprocess.run([ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def render_slide(slide: dict, index: int, total: int, background: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (WIDTH, HEIGHT), "#eef4f3")
    bg = background.copy().convert("RGB")
    scale = max(WIDTH / bg.width, HEIGHT / bg.height)
    bg = bg.resize((int(bg.width * scale), int(bg.height * scale)), Image.Resampling.LANCZOS)
    left = (bg.width - WIDTH) // 2
    top = (bg.height - HEIGHT) // 2
    bg = bg.crop((left, top, left + WIDTH, top + HEIGHT))
    bg = ImageEnhance.Brightness(bg).enhance(0.50)
    canvas.paste(bg)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (12, 35, 52, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rectangle((0, 0, 820, HEIGHT), fill=(13, 38, 57, 232))
    odraw.rectangle((0, 0, WIDTH, 74), fill=(255, 255, 255, 242))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((32, 15, 75, 58), radius=8, fill="#247f78")
    draw.text((46, 20), "E", font=font(24, True), fill="white")
    draw.text((91, 22), "Ehel Academy  |  English", font=font(21, True), fill="#17324d")
    draw.text((1150, 24), f"{index + 1} / {total}", font=font(18, True), fill="#607184")
    draw.rectangle((0, 70, WIDTH * (index + 1) / total, 74), fill="#f2c94c")
    draw.text((58, 120), slide["kicker"], font=font(21, True), fill="#73d3c7")
    title_lines = wrap(draw, slide["title"], font(46, True), 690)
    y = 165
    for line in title_lines[:2]:
        draw.text((56, y), line, font=font(46, True), fill="white")
        y += 56
    y += 18
    body_font = font(25)
    for bullet in slide["bullets"][:5]:
        bullet_lines = wrap(draw, clean(bullet, 170), body_font, 620)
        draw.ellipse((60, y + 9, 72, y + 21), fill="#f2c94c")
        for line_index, line in enumerate(bullet_lines[:3]):
            draw.text((92, y + line_index * 32), line, font=body_font, fill="#f4f8fa")
        y += max(52, len(bullet_lines[:3]) * 32 + 14)
    draw.text((58, 667), "Teacher Nuur  |  Listen, pause and take notes", font=font(17, True), fill="#b9d4df")
    return canvas.convert("RGB")


def vtt_time(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grade", type=int)
    parser.add_argument("--unit", type=int)
    parser.add_argument("--all-missing", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--whisper-model", default="base",
                        help="Whisper model used to time the slides (base is enough for alignment)")
    args = parser.parse_args()
    load_env()
    # Loaded here, before a single character is bought: the aligner is now part
    # of rendering a lecture, so discovering it is missing after the narration
    # has been paid for is a bill for a lecture that cannot be finished. Loading
    # it once also keeps --all-missing from re-reading the model 64 times.
    model = alignment_lib.load_model(args.whisper_model)

    if args.all_missing:
        targets: list[tuple[int, int]] = []
        for grade in range(1, 9):
            grade_root = ENGLISH_ROOT / f"grade-{grade}"
            manifest = json.loads((grade_root / "data" / "course-manifest.json").read_text(encoding="utf-8"))
            lecture_manifest_path = grade_root / "data" / "lecture-media.json"
            lecture_manifest = json.loads(lecture_manifest_path.read_text(encoding="utf-8")) if lecture_manifest_path.exists() else {"units": {}}
            for summary in manifest["units"]:
                unit_number = summary["number"]
                if "capstone" in summary.get("reviewStatus", "").lower():
                    continue
                unit = json.loads((grade_root / "data" / "units" / f"unit-{unit_number}.json").read_text(encoding="utf-8"))
                configured = unit.get("visual", {}).get("lectureVideo") or lecture_manifest.get("units", {}).get(str(unit_number), {}).get("lectureVideo")
                if args.force or not configured:
                    targets.append((grade, unit_number))
        print(f"Preparing {len(targets)} missing teacher lectures.")
        for index, (grade, unit_number) in enumerate(targets, start=1):
            print(f"\n[{index}/{len(targets)}] Grade {grade}, Unit {unit_number}", flush=True)
            create_lecture(grade, unit_number, model)
        return

    if args.grade is None or args.unit is None:
        parser.error("Use --grade and --unit, or --all-missing.")
    create_lecture(args.grade, args.unit, model)


def create_lecture(grade: int, unit_number: int, model=None) -> None:
    grade_root = ENGLISH_ROOT / f"grade-{grade}"
    unit_path = grade_root / "data" / "units" / f"unit-{unit_number}.json"
    dictionary_path = grade_root / "data" / f"master-dictionary.grade{grade}.json"
    unit = json.loads(unit_path.read_text(encoding="utf-8"))
    dictionary = json.loads(dictionary_path.read_text(encoding="utf-8"))
    slides = build_slides(unit, dictionary)
    background_path = resolve_asset(grade_root, unit["visual"]["image"])
    background = Image.open(background_path)
    output_dir = grade_root / "media" / f"unit-{unit_number}"
    work_dir = ROOT / "tmp" / "ehel-english-lectures" / f"grade-{grade}-unit-{unit_number}"
    slide_dir = work_dir / "slides"
    for folder in (output_dir, slide_dir):
        folder.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise SystemExit("ffmpeg and ffprobe are required.")

    narration = "\n\n".join(slide["narration"] for slide in slides)
    audio = work_dir / "teacher-lecture.mp3"
    print("Generating complete ElevenLabs narration", flush=True)
    create_audio(narration, audio)
    audio_duration = duration(audio, ffprobe)

    # Where each slide changes is MEASURED against the recording, never guessed.
    # This used to weight the total duration by word count — every word assumed
    # to take the same time — which put the picture up to 5.9 seconds away from
    # the voice and landed 82% of slide changes in the middle of a sentence.
    # ehel_lecture_alignment says why, and realign-ehel-lecture-video.py shares
    # this exact code so a re-render can no longer undo a re-timing.
    print("Timing the slides against the narration", flush=True)
    wav = alignment_lib.extract_wav(audio, work_dir / "narration.wav", ffmpeg)
    spoken = alignment_lib.transcribe(wav, model or alignment_lib.load_model())
    script_words, ranges = alignment_lib.slide_word_ranges(slides)
    alignment = alignment_lib.Alignment(script_words, spoken, audio_duration)
    switches = alignment_lib.switch_times(slides, ranges, alignment)
    durations = alignment_lib.hold_durations(switches, audio_duration)
    print(f"  aligned {alignment.matched}/{alignment.count} words", flush=True)

    slide_paths: list[Path] = []
    for index, slide in enumerate(slides):
        image = slide_dir / f"slide-{index + 1:02d}.png"
        rendered = render_slide(slide, index, len(slides), background)
        rendered.save(image)
        if index == 0:
            rendered.save(output_dir / "teacher-lecture-poster.jpg", quality=91)
        slide_paths.append(image)

    concat = work_dir / "slides.txt"
    concat_lines: list[str] = []
    for image, clip_duration in zip(slide_paths, durations):
        concat_lines.extend([f"file '{image.as_posix()}'", f"duration {clip_duration:.3f}"])
    concat_lines.append(f"file '{slide_paths[-1].as_posix()}'")
    concat.write_text("\n".join(concat_lines), encoding="utf-8")
    video = output_dir / "teacher-lecture.mp4"
    subprocess.run([
        ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(audio),
        "-vf", "fps=12,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(video),
    ], check=True, capture_output=True)
    # One cue per SENTENCE, not one per slide. A slide's narration is a whole
    # paragraph, and a cue is rendered in full for its entire duration, so the
    # old one-cue-per-slide form put 585 characters over the video for 44
    # seconds. The cue times come from the same word-level alignment as the
    # slide changes, so a cue now appears when its words are spoken — the gap
    # ehel_lecture_captions documents as unclosable "without word-level timings
    # from the voice provider" is closed by measuring them ourselves.
    cues = alignment_lib.caption_cues_from_alignment(
        slides, ranges, alignment, switches, audio_duration, chunk_narration, balance_lines)
    slide_times = alignment_lib.slide_times(slides, switches, audio_duration)

    caption_path = output_dir / "teacher-lecture.vtt"
    caption_path.write_text(render_vtt(cues), encoding="utf-8")
    (output_dir / "teacher-lecture-script.json").write_text(json.dumps({"voiceId": VOICE_ID, "modelId": MODEL_ID, "slides": slides}, indent=2) + "\n", encoding="utf-8")
    lecture_manifest_path = grade_root / "data" / "lecture-media.json"
    lecture_manifest = json.loads(lecture_manifest_path.read_text(encoding="utf-8")) if lecture_manifest_path.exists() else {
        "schemaVersion": "Ehel English Lecture Media v1.0", "grade": grade, "units": {}
    }
    lecture_manifest["units"][str(unit_number)] = {
        "lectureMode": "video",
        "lectureVideo": f"./media/unit-{unit_number}/teacher-lecture.mp4",
        "lecturePoster": f"./media/unit-{unit_number}/teacher-lecture-poster.jpg",
        "lectureCaptions": f"./media/unit-{unit_number}/teacher-lecture.vtt",
        "lectureSlides": slide_times,
        "lectureProvider": "ElevenLabs",
        "lectureVoiceId": VOICE_ID,
        "lectureVersion": f"g{grade}-u{unit_number}-teacher-lecture-v1",
    }
    lecture_manifest_path.write_text(json.dumps(lecture_manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"grade": grade, "unit": unit_number, "video": str(video), "bytes": video.stat().st_size, "duration": round(duration(video, ffprobe), 2), "captions": str(caption_path)}, indent=2), flush=True)


if __name__ == "__main__":
    main()

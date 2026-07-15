from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont


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
    outcome_narration = [clean(item["learningOutcome"], 520).rstrip(". ") for item in unit["outcomes"][:3]]
    outcomes = [clean(item, 150) for item in outcome_narration]
    reading_titles = [item["title"] for item in unit["readings"][:2]]
    grammar = unit["grammar"][0]
    speaking = unit["speaking"][0]
    writing = unit["writing"][0]
    title = unit["unit"]["unitTitle"]
    overview = clean(unit["unit"]["unitOverview"], 760)

    return [
        {
            "kicker": f"{unit['grade']['label'].upper()} ENGLISH  |  UNIT {unit['unit']['unitNo']}",
            "title": title,
            "bullets": ["Listen for the big ideas", "Preview the learning journey", "Prepare to read, discuss and write"],
            "narration": f"Welcome to {unit['grade']['label']} English, Unit {unit['unit']['unitNo']}: {title}. {overview} In this short lecture, preview the key ideas and prepare for the independent lesson.",
        },
        {
            "kicker": "LEARNING OUTCOMES",
            "title": "What you will achieve",
            "bullets": outcomes,
            "narration": "By the end of this unit, you will be able to " + ". You will also ".join(outcome_narration).lower() + ". Keep these goals in mind as you work.",
        },
        {
            "kicker": "KEY VOCABULARY",
            "title": "Language for precise thinking",
            "bullets": words,
            "narration": f"Your vocabulary work begins with these words: {', '.join(words)}. Listen to each pronunciation in the vocabulary lab, study its meaning in context, and use the word accurately in your own discussion and writing.",
        },
        {
            "kicker": "READING AND EVIDENCE",
            "title": "Read critically",
            "bullets": reading_titles + ["Identify central ideas", "Support conclusions with evidence"],
            "narration": f"The reading sequence includes {reading_titles[0]} and {reading_titles[1]}. Read actively. Identify each text's central ideas, notice viewpoint and reliability, and support every inference with relevant evidence from the text.",
        },
        {
            "kicker": "LANGUAGE FOCUS",
            "title": grammar["title"],
            "bullets": [clean(grammar["explanation"], 155), "Notice the structure", "Apply it in connected paragraphs"],
            "narration": f"The first language focus is {grammar['title']}. {clean(grammar['explanation'], 500)} Notice the structure in the model examples, then apply it deliberately in connected sentences and paragraphs.",
        },
        {
            "kicker": "SPEAKING AND WRITING",
            "title": "Use English for a real purpose",
            "bullets": [speaking["title"], writing["title"] or "Writing and revision", "Explain, support and improve your ideas"],
            "narration": f"In speaking, you will complete {speaking['title']}. Organise your ideas, use evidence and respond clearly to questions. In writing, you will plan, draft, check and revise. Use the success criteria before submitting your work.",
        },
        {
            "kicker": "YOUR LEARNING PATH",
            "title": "You are ready to begin",
            "bullets": ["Vocabulary and dictionary", "Reading and comprehension", "Grammar, speaking and writing", "Activities, quiz and live sessions"],
            "narration": "You are ready to begin. Start with the vocabulary lab, continue through reading and comprehension, apply the grammar focus, and complete the speaking and writing practices. Use AI English for hints and feedback, and bring your questions to the live sessions.",
        },
    ]


def create_audio(text: str, output: Path) -> None:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY is not configured.")
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
    args = parser.parse_args()
    load_env()

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
            create_lecture(grade, unit_number)
        return

    if args.grade is None or args.unit is None:
        parser.error("Use --grade and --unit, or --all-missing.")
    create_lecture(args.grade, args.unit)


def create_lecture(grade: int, unit_number: int) -> None:
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
    weights = [max(1, len(slide["narration"].split())) for slide in slides]
    total_weight = sum(weights)
    durations = [audio_duration * weight / total_weight for weight in weights]
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
    captions = ["WEBVTT", ""]
    cursor = 0.0
    for index, (slide, clip_duration) in enumerate(zip(slides, durations), start=1):
        captions.extend([str(index), f"{vtt_time(cursor)} --> {vtt_time(cursor + clip_duration - 0.08)}", slide["narration"], ""])
        cursor += clip_duration
    caption_path = output_dir / "teacher-lecture.vtt"
    caption_path.write_text("\n".join(captions), encoding="utf-8")
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
        "lectureProvider": "ElevenLabs",
        "lectureVoiceId": VOICE_ID,
        "lectureVersion": f"g{grade}-u{unit_number}-teacher-lecture-v1",
    }
    lecture_manifest_path.write_text(json.dumps(lecture_manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"grade": grade, "unit": unit_number, "video": str(video), "bytes": video.stat().st_size, "duration": round(duration(video, ffprobe), 2), "captions": str(caption_path)}, indent=2), flush=True)


if __name__ == "__main__":
    main()

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PROTOTYPE = ROOT / "src" / "prototypes" / "ehel-academy" / "vocabulary"
MEDIA = PROTOTYPE / "media"
TMP = ROOT / "tmp" / "ehel-vocabulary-lecture"
AUDIO = TMP / "audio"
SLIDES_DIR = TMP / "slides"
SEGMENTS_DIR = TMP / "segments"
FFMPEG = Path(r"C:\ffmpeg\bin\ffmpeg.exe")
FFPROBE = Path(r"C:\ffmpeg\bin\ffprobe.exe")
OUTPUT = MEDIA / "good-neighbours-teacher-lecture.mp4"
CAPTIONS = MEDIA / "good-neighbours-teacher-lecture.vtt"
POSTER = MEDIA / "teacher-lecture-poster.jpg"

W, H = 1280, 720

NARRATIONS = [
    "Hello, young word explorer. I am Teacher Nuur. Today we are learning eight useful words about good neighbours. Watch, listen, and say the words with me.",
    "Our goal is to understand each word, pronounce it clearly, notice its word type, and use it in a sentence. Words can have different jobs in a sentence.",
    "A noun names a person, place, thing, or idea. Neighbour is a noun because it names a person who lives near you. Community is also a noun.",
    "A verb shows an action. Help and share are verbs. Say them with me. Help. Share. These words tell us what someone does.",
    "An adjective describes a noun. Friendly and helpful are adjectives. A friendly neighbour. A helpful child. They add describing details.",
    "An adverb tells how an action happens. Kindly and carefully are adverbs. Speak kindly. Carry the cup carefully. They explain how the action is done.",
    "Now meet our first four words. Neighbour means a person who lives near you. Friendly means kind and pleasant. Help means to make something easier. Kindly means in a caring way.",
    "Here are four more words. Share means to let another person use some of yours. Community means people who share a place. Helpful means ready to help. Carefully means in a way that avoids mistakes or danger.",
    "Let us say all eight words together. Neighbour. Friendly. Help. Kindly. Share. Community. Helpful. Carefully. Excellent speaking.",
    "You are ready to begin. Explore each word, flip through five sentence cards, listen to the examples, practise spelling, talk with the tutor, and finish with the word challenge.",
]

SLIDES = [
    {"title": "Welcome, word explorer!", "kicker": "Good Neighbours", "body": "Eight useful words for caring, sharing and helping.", "kind": "teacher"},
    {"title": "Our learning goal", "kicker": "Listen, notice, use", "bullets": ["Understand each word", "Say it clearly", "Notice its word type", "Use it in a sentence"], "kind": "teacher"},
    {"title": "Noun", "kicker": "Names a person, place, thing or idea", "words": [("neighbour", "a person nearby"), ("community", "people sharing a place")], "color": "#0f766e", "kind": "type"},
    {"title": "Verb", "kicker": "Shows an action", "words": [("help", "make something easier"), ("share", "let another person use some")], "color": "#f26b5e", "kind": "type"},
    {"title": "Adjective", "kicker": "Describes a noun", "words": [("friendly", "kind and pleasant"), ("helpful", "ready to help")], "color": "#7559c7", "kind": "type"},
    {"title": "Adverb", "kicker": "Tells how an action happens", "words": [("kindly", "in a caring way"), ("carefully", "without mistakes or danger")], "color": "#37a866", "kind": "type"},
    {"title": "Meet the first four", "kicker": "Listen and repeat", "words": [("neighbour", "noun"), ("friendly", "adjective"), ("help", "verb"), ("kindly", "adverb")], "kind": "vocabulary", "image": "neighbour.png"},
    {"title": "Meet four more", "kicker": "Listen and repeat", "words": [("share", "verb"), ("community", "noun"), ("helpful", "adjective"), ("carefully", "adverb")], "kind": "vocabulary", "image": "helpful.png"},
    {"title": "Say all eight words", "kicker": "Your turn", "words": [("neighbour", ""), ("friendly", ""), ("help", ""), ("kindly", ""), ("share", ""), ("community", ""), ("helpful", ""), ("carefully", "")], "kind": "repeat"},
    {"title": "You are ready!", "kicker": "Next: explore and practise", "bullets": ["Learn the meaning", "Read five sentence cards", "Practise spelling", "Talk with the tutor", "Take the quiz"], "kind": "teacher"},
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path(r"C:\Windows\Fonts\segoeuib.ttf") if bold else Path(r"C:\Windows\Fonts\segoeui.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf") if bold else Path(r"C:\Windows\Fonts\arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


F_BRAND = font(22, True)
F_KICKER = font(24, True)
F_TITLE = font(54, True)
F_BODY = font(30)
F_WORD = font(38, True)
F_SMALL = font(22)
F_TINY = font(18, True)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def contain_image(path: Path, box: tuple[int, int, int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    x1, y1, x2, y2 = box
    target_w, target_h = x2 - x1, y2 - y1
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((int(image.width * scale), int(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - target_w) // 2)
    top = max(0, (resized.height - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def text_width(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.ImageFont) -> int:
    bounds = draw.textbbox((0, 0), text, font=face)
    return bounds[2] - bounds[0]


def draw_header(draw: ImageDraw.ImageDraw, index: int):
    draw.rectangle((0, 0, W, 76), fill="#ffffff")
    rounded(draw, (36, 17, 78, 59), 8, "#0f766e")
    draw.text((49, 22), "W", font=F_BRAND, fill="#ffffff")
    draw.text((94, 24), "Ehel Academy  |  English Year 2", font=F_BRAND, fill="#17324d")
    draw.text((1114, 27), f"{index + 1} / {len(SLIDES)}", font=F_TINY, fill="#637083")
    draw.rectangle((0, 72, W * (index + 1) / len(SLIDES), 76), fill="#f6c945")


def draw_teacher_scene(canvas: Image.Image, draw: ImageDraw.ImageDraw, slide: dict):
    teacher = contain_image(PROTOTYPE / "assets" / "teacher-nuur.png", (650, 76, W, H))
    canvas.paste(teacher, (650, 76))
    draw.rounded_rectangle((45, 118, 718, 624), radius=18, fill="#ffffff", outline="#dfe7ec", width=2)
    draw.text((82, 158), slide["kicker"].upper(), font=F_KICKER, fill="#0f766e")
    draw.text((82, 205), slide["title"], font=F_TITLE, fill="#17324d")
    if slide.get("body"):
        draw.multiline_text((84, 300), slide["body"], font=F_BODY, fill="#4f6072", spacing=11)
    y = 310
    for bullet in slide.get("bullets", []):
        rounded(draw, (84, y + 3, 112, y + 31), 7, "#def7f3")
        draw.text((92, y + 3), "✓", font=F_TINY, fill="#0f766e")
        draw.text((130, y), bullet, font=F_BODY, fill="#334b61")
        y += 58
    draw.text((84, 570), "Teacher Nuur", font=F_SMALL, fill="#7559c7")


def draw_type_scene(draw: ImageDraw.ImageDraw, slide: dict):
    color = slide["color"]
    rounded(draw, (48, 104, 1232, 660), 18, "#ffffff", "#dfe7ec", 2)
    rounded(draw, (78, 132, 218, 184), 8, color)
    draw.text((102, 142), "WORD TYPE", font=F_TINY, fill="#ffffff")
    draw.text((80, 210), slide["title"], font=F_TITLE, fill="#17324d")
    draw.text((82, 280), slide["kicker"], font=F_BODY, fill="#637083")
    for index, (word, meaning) in enumerate(slide["words"]):
        x = 82 + index * 570
        rounded(draw, (x, 366, x + 530, 570), 14, "#f7faf9", color, 3)
        draw.text((x + 28, 398), word, font=F_WORD, fill=color)
        draw.text((x + 28, 468), meaning, font=F_SMALL, fill="#4f6072")
        rounded(draw, (x + 28, 520, x + 190, 552), 6, color)
        draw.text((x + 46, 524), slide["title"], font=F_TINY, fill="#ffffff")


def draw_vocabulary_scene(canvas: Image.Image, draw: ImageDraw.ImageDraw, slide: dict):
    scene = contain_image(PROTOTYPE / "assets" / slide["image"], (48, 118, 496, 646))
    canvas.paste(scene, (48, 118))
    rounded(draw, (470, 118, 1232, 646), 18, "#ffffff", "#dfe7ec", 2)
    draw.text((510, 148), slide["kicker"].upper(), font=F_KICKER, fill="#f26b5e")
    draw.text((508, 195), slide["title"], font=F_TITLE, fill="#17324d")
    for index, (word, kind) in enumerate(slide["words"]):
        row = index // 2
        col = index % 2
        x = 510 + col * 350
        y = 305 + row * 135
        rounded(draw, (x, y, x + 310, y + 104), 12, "#f7faf9", "#dfe7ec", 2)
        draw.text((x + 20, y + 14), word, font=F_WORD, fill="#0f766e")
        draw.text((x + 21, y + 67), kind, font=F_TINY, fill="#7559c7")


def draw_repeat_scene(draw: ImageDraw.ImageDraw, slide: dict):
    draw.text((64, 112), slide["kicker"].upper(), font=F_KICKER, fill="#f26b5e")
    draw.text((62, 164), slide["title"], font=F_TITLE, fill="#17324d")
    colors = ["#def7f3", "#fff0ed", "#eeeafd", "#e6f7ec"]
    ink = ["#0f766e", "#b43b30", "#7559c7", "#2e8b55"]
    for index, (word, _) in enumerate(slide["words"]):
        row, col = divmod(index, 4)
        x = 62 + col * 295
        y = 282 + row * 150
        rounded(draw, (x, y, x + 262, y + 112), 14, colors[index % 4], "#ffffff", 3)
        word_w = text_width(draw, word, F_WORD)
        draw.text((x + (262 - word_w) / 2, y + 31), word, font=F_WORD, fill=ink[index % 4])
    draw.text((62, 610), "Pause after each word and repeat with a clear voice.", font=F_SMALL, fill="#637083")


def render_slide(slide: dict, index: int) -> Image.Image:
    canvas = Image.new("RGB", (W, H), "#f4f8f7")
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, index)
    if slide["kind"] == "teacher":
        draw_teacher_scene(canvas, draw, slide)
    elif slide["kind"] == "type":
        draw_type_scene(draw, slide)
    elif slide["kind"] == "vocabulary":
        draw_vocabulary_scene(canvas, draw, slide)
    else:
        draw_repeat_scene(draw, slide)
    return canvas


def duration(path: Path) -> float:
    result = subprocess.run(
        [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def vtt_time(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def build():
    if not FFMPEG.exists() or not FFPROBE.exists():
        raise SystemExit("ffmpeg and ffprobe are required at C:\\ffmpeg\\bin")

    MEDIA.mkdir(parents=True, exist_ok=True)
    SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)

    durations: list[float] = []
    segments: list[Path] = []
    for index, slide in enumerate(SLIDES):
        audio = AUDIO / f"slide_{index:02d}.wav"
        if not audio.exists():
            raise SystemExit(f"Missing narration audio: {audio}")
        slide_path = SLIDES_DIR / f"slide_{index:02d}.png"
        image = render_slide(slide, index)
        image.save(slide_path, quality=95)
        if index == 0:
            image.save(POSTER, quality=92)

        clip_duration = duration(audio) + 0.35
        durations.append(clip_duration)
        segment = SEGMENTS_DIR / f"segment_{index:02d}.mp4"
        subprocess.run(
            [
                str(FFMPEG), "-y", "-loop", "1", "-framerate", "30", "-i", str(slide_path), "-i", str(audio),
                "-t", f"{clip_duration:.3f}", "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium",
                "-crf", "22", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest", str(segment),
            ],
            check=True,
            capture_output=True,
        )
        segments.append(segment)

    concat_file = TMP / "segments.txt"
    concat_file.write_text("\n".join(f"file '{segment.as_posix()}'" for segment in segments), encoding="utf-8")
    subprocess.run(
        [str(FFMPEG), "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", "-movflags", "+faststart", str(OUTPUT)],
        check=True,
        capture_output=True,
    )

    caption_lines = ["WEBVTT", ""]
    cursor = 0.0
    for index, (narration, clip_duration) in enumerate(zip(NARRATIONS, durations), start=1):
        caption_lines.extend([str(index), f"{vtt_time(cursor)} --> {vtt_time(cursor + clip_duration - 0.1)}", narration, ""])
        cursor += clip_duration
    CAPTIONS.write_text("\n".join(caption_lines), encoding="utf-8")

    print(f"Video: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(f"Poster: {POSTER} ({POSTER.stat().st_size} bytes)")
    print(f"Captions: {CAPTIONS} ({CAPTIONS.stat().st_size} bytes)")
    print(f"Duration: {duration(OUTPUT):.2f} seconds")


if __name__ == "__main__":
    build()

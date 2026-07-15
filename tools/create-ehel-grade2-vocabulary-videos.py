from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PROTOTYPE = ROOT / "src" / "prototypes" / "ehel-academy" / "vocabulary"
MEDIA = PROTOTYPE / "media"
TMP = ROOT / "tmp" / "ehel-grade2-vocabulary-media"
AUDIO = TMP / "lecture-audio"
CURRICULUM = PROTOTYPE / "grade2-vocabulary.json"
NARRATIONS = TMP / "lecture-narrations.json"
FFMPEG = Path(r"C:\ffmpeg\bin\ffmpeg.exe")
FFPROBE = Path(r"C:\ffmpeg\bin\ffprobe.exe")
W, H = 1280, 720


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = Path(r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf")
    return ImageFont.truetype(str(path), size=size)


F_BRAND = font(22, True)
F_KICKER = font(20, True)
F_TITLE = font(46, True)
F_GROUP = font(22, True)
F_SMALL = font(17)


def fit_cover(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - size[0]) // 2)
    top = max(0, (resized.height - size[1]) // 2)
    return resized.crop((left, top, left + size[0], top + size[1]))


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.ImageFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=face)[2] <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render_poster(unit: dict) -> Image.Image:
    canvas = Image.new("RGB", (W, H), "#f4f8f7")
    draw = ImageDraw.Draw(canvas)
    visual_path = PROTOTYPE / unit["visual"]["image"].removeprefix("./")
    visual = fit_cover(visual_path, (690, H - 76))
    canvas.paste(visual, (590, 76))
    draw.rectangle((0, 0, W, 76), fill="#ffffff")
    draw.rounded_rectangle((32, 17, 74, 59), radius=8, fill="#0f766e")
    draw.text((45, 22), "W", font=F_BRAND, fill="#ffffff")
    draw.text((90, 24), "Ehel Academy  |  English Year 2", font=F_BRAND, fill="#17324d")
    draw.rectangle((0, 72, W, 76), fill="#f6c945")
    draw.rectangle((0, 76, 590, H), fill="#ffffff")
    draw.text((42, 112), f"UNIT {unit['number']} VOCABULARY", font=F_KICKER, fill="#0f766e")
    title_lines = wrap(draw, unit["title"], F_TITLE, 500)
    y = 154
    for line in title_lines:
        draw.text((42, y), line, font=F_TITLE, fill="#17324d")
        y += 54
    y += 16
    draw.text((42, y), f"{unit['wordCount']} words  |  {len(unit['groups'])} learning groups", font=F_SMALL, fill="#637083")
    y += 48
    for index, group in enumerate(unit["groups"]):
        draw.rounded_rectangle((42, y, 548, y + 54), radius=9, fill="#f4f8f7", outline="#dfe7ec", width=2)
        draw.rounded_rectangle((54, y + 10, 88, y + 44), radius=7, fill="#0f766e")
        draw.text((66, y + 14), str(index + 1), font=F_SMALL, fill="#ffffff")
        group_lines = wrap(draw, group["title"], F_GROUP, 430)
        draw.text((104, y + 13), group_lines[0], font=F_GROUP, fill="#17324d")
        y += 64
    teacher = Image.open(PROTOTYPE / "assets" / "teacher-nuur.png").convert("RGB")
    teacher.thumbnail((170, 130), Image.Resampling.LANCZOS)
    canvas.paste(teacher, (W - teacher.width - 22, H - teacher.height - 20))
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
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"


def write_captions(path: Path, narration: str, clip_duration: float) -> None:
    sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", narration) if item.strip()]
    weights = [max(1, len(sentence.split())) for sentence in sentences]
    total_weight = sum(weights)
    cursor = 0.0
    lines = ["WEBVTT", ""]
    for index, (sentence, weight) in enumerate(zip(sentences, weights), start=1):
        end = clip_duration if index == len(sentences) else cursor + clip_duration * weight / total_weight
        lines.extend([str(index), f"{vtt_time(cursor)} --> {vtt_time(end)}", sentence, ""])
        cursor = end
    path.write_text("\n".join(lines), encoding="utf-8")


def build() -> None:
    if not FFMPEG.exists() or not FFPROBE.exists():
        raise SystemExit("ffmpeg and ffprobe are required at C:\\ffmpeg\\bin")
    curriculum = json.loads(CURRICULUM.read_text(encoding="utf-8"))
    narrations = json.loads(NARRATIONS.read_text(encoding="utf-8"))
    MEDIA.mkdir(parents=True, exist_ok=True)
    posters = TMP / "posters"
    posters.mkdir(parents=True, exist_ok=True)

    for unit in curriculum["units"]:
        number = unit["number"]
        audio = AUDIO / f"unit-{number}.mp3"
        if not audio.exists():
            raise SystemExit(f"Missing lecture audio: {audio}")
        poster = MEDIA / f"unit-{number}-lecture-poster.jpg"
        poster_image = render_poster(unit)
        poster_image.save(poster, quality=91)
        clip_duration = duration(audio) + 0.4
        output = MEDIA / f"unit-{number}-vocabulary-lecture.mp4"
        subprocess.run(
            [
                str(FFMPEG), "-y", "-loop", "1", "-framerate", "30", "-i", str(poster), "-i", str(audio),
                "-t", f"{clip_duration:.3f}", "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium",
                "-crf", "23", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(output),
            ],
            check=True,
            capture_output=True,
        )
        captions = MEDIA / f"unit-{number}-vocabulary-lecture.vtt"
        write_captions(captions, narrations[unit["id"]], clip_duration)
        print(f"Unit {number}: {clip_duration:.2f}s, {output.stat().st_size} bytes")


if __name__ == "__main__":
    build()

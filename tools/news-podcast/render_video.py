from __future__ import annotations

import argparse
import json
import os
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / "tmp" / "somali-news-podcast-render"
W, H = 1920, 1080


def ffmpeg_path() -> str:
    candidates = [
        os.environ.get("FFMPEG_PATH"),
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe",
        "ffmpeg",
    ]
    for candidate in [item for item in candidates if item]:
        try:
            subprocess.run([candidate, "-version"], check=True, capture_output=True, text=True)
            return candidate
        except Exception:
            pass
    raise SystemExit("ffmpeg not found. Install ffmpeg or set FFMPEG_PATH.")


def ffprobe_path(ffmpeg: str) -> str:
    path = Path(ffmpeg)
    if path.name.lower().startswith("ffmpeg"):
        probe = path.with_name(path.name.lower().replace("ffmpeg", "ffprobe", 1))
        if probe.exists():
            return str(probe)
    return os.environ.get("FFPROBE_PATH", "ffprobe")


def duration(audio: Path, ffmpeg: str) -> float:
    probe = ffprobe_path(ffmpeg)
    result = subprocess.run(
        [probe, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(audio)],
        check=True,
        capture_output=True,
        text=True,
    )
    return max(1.0, float(result.stdout.strip()))


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\Arialbd.ttf" if bold else r"C:\Windows\Fonts\Arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


F_KICKER = font(34, True)
F_TITLE = font(72, True)
F_TITLE_SMALL = font(54, True)
F_BODY = font(34)
F_BODY_BOLD = font(34, True)
F_META = font(26)
F_SMALL = font(22)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def wrap(draw: ImageDraw.ImageDraw, text: str, max_width: int, fnt) -> list[str]:
    lines: list[str] = []
    for paragraph in str(text or "").splitlines() or [""]:
        words = paragraph.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            if text_size(draw, test, fnt)[0] <= max_width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    return lines


def draw_wrapped(draw, xy, text, max_width, fnt, fill, line_gap=14, max_lines=6):
    x, y = xy
    for line in wrap(draw, text, max_width, fnt)[:max_lines]:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def fit_title(draw, text: str, max_width: int):
    return F_TITLE if text_size(draw, text, F_TITLE)[0] <= max_width else F_TITLE_SMALL


def slide_image(episode: dict, slide: dict, index: int, total: int) -> Image.Image:
    accent = slide.get("accent") or "#0f766e"
    img = Image.new("RGB", (W, H), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, H), fill="#f8fafc")
    draw.rectangle((0, 0, W, 146), fill="#111827")
    draw.rectangle((0, 146, W, 154), fill=accent)
    draw.rectangle((0, H - 92, W, H), fill="#111827")
    draw.text((92, 48), "Somali AI News Podcast", font=F_KICKER, fill="#ffffff")
    draw.text((92, H - 58), episode.get("dateLabel") or episode.get("generatedAt", ""), font=F_SMALL, fill="#d1d5db")
    draw.text((W - 245, H - 58), f"{index + 1}/{total}", font=F_SMALL, fill="#d1d5db")

    draw.rounded_rectangle((92, 235, 455, 298), radius=12, fill=accent)
    draw.text((120, 250), str(slide.get("kicker") or slide.get("source") or "War"), font=F_META, fill="#ffffff")

    title = str(slide.get("title") or episode.get("title") or "Wararka Caalamka")
    title_font = fit_title(draw, title, 1320)
    y = draw_wrapped(draw, (92, 345), title, 1340, title_font, "#0f172a", line_gap=16, max_lines=3)

    bullets = slide.get("bullets") if isinstance(slide.get("bullets"), list) else []
    y = max(y + 42, 575)
    for bullet in bullets[:4]:
        draw.ellipse((112, y + 13, 132, y + 33), fill=accent)
        y = draw_wrapped(draw, (160, y), bullet, 1280, F_BODY, "#334155", line_gap=12, max_lines=2) + 22

    source = slide.get("source")
    if source:
        draw.text((92, 918), f"Isha: {source}", font=F_BODY_BOLD, fill="#0f172a")
    return img


def slide_durations(total_duration: float, slides: list[dict]) -> list[float]:
    weights = []
    for slide in slides:
        words = len(str(slide.get("title", "")).split())
        for bullet in slide.get("bullets", []) if isinstance(slide.get("bullets"), list) else []:
            words += len(str(bullet).split())
        weights.append(max(12, words))
    total = sum(weights) or 1
    durations = [max(4.0, total_duration * weight / total) for weight in weights]
    scale = total_duration / sum(durations)
    return [item * scale for item in durations]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", type=Path, required=True)
    parser.add_argument("--audio", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    episode = json.loads(args.episode.read_text(encoding="utf-8"))
    slides = episode.get("slides") or []
    if not slides:
        raise SystemExit("Episode has no slides.")
    ffmpeg = ffmpeg_path()
    TMP.mkdir(parents=True, exist_ok=True)
    for old in TMP.glob("*"):
        if old.is_file():
            old.unlink()

    total_duration = duration(args.audio, ffmpeg)
    durations = slide_durations(total_duration, slides)
    concat = TMP / "slides.txt"
    lines = []
    for index, slide in enumerate(slides):
        frame = TMP / f"slide_{index:02d}.png"
        slide_image(episode, slide, index, len(slides)).save(frame)
        lines.append(f"file '{frame.as_posix()}'")
        lines.append(f"duration {durations[index]:.6f}")
    lines.append(f"file '{(TMP / f'slide_{len(slides) - 1:02d}.png').as_posix()}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-i",
            str(args.audio),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "30",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(args.out),
        ],
        check=True,
    )
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

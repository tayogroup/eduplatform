from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIO = ROOT / "deliverables" / "live-session-explainer" / "live_session_explainer_elevenlabs.mp3"
DEFAULT_OUT = ROOT / "deliverables" / "live-session-explainer" / "live_session_explainer.mp4"
TMP = ROOT / "tmp" / "live-session-explainer-video"
FFMPEG = Path(
    r"C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.0-full_build\bin\ffmpeg.exe"
)
FFPROBE = FFMPEG.with_name("ffprobe.exe")

W, H = 1920, 1080


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\Arialbd.ttf" if bold else r"C:\Windows\Fonts\Arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


F_BRAND = font(32, True)
F_TITLE = font(62, True)
F_SECTION = font(42, True)
F_BODY = font(32)
F_BODY_BOLD = font(32, True)
F_SMALL = font(24)
F_SMALL_BOLD = font(24, True)
F_TINY = font(19)
F_TINY_BOLD = font(19, True)


SCENES = [
    {
        "step": "Welcome",
        "title": "Using Live Session",
        "body": [
            "Use Live Sessions to enter the class room, follow the lesson, and get guided help.",
            "Keep the live room, Current Lesson, and Virtual Tutor ready while class is running.",
        ],
        "visual": "overview",
        "narration": "Using Live Session. Welcome. This is how to use the Pre-Quran Live Session.",
    },
    {
        "step": "1",
        "title": "Open Live Sessions",
        "body": [
            "Start from the dashboard.",
            "Find the scheduled session you want to use.",
        ],
        "visual": "dashboard",
        "narration": "Open the Live Sessions page. From the dashboard, find the scheduled session you want to use.",
    },
    {
        "step": "2",
        "title": "Start The Class",
        "body": [
            "Teachers and admins click Start class.",
            "The BigBlueButton live room opens for the session.",
        ],
        "visual": "start",
        "narration": "Start the class. If you are the teacher or admin, click Start class. This will open the BigBlueButton live room.",
    },
    {
        "step": "3",
        "title": "Let The Session Load",
        "body": [
            "BigBlueButton opens first.",
            "The Current Lesson and Virtual Tutor may also open in separate windows.",
        ],
        "visual": "windows",
        "narration": "Wait for the session to load. The system may also open the Current Lesson in a separate window and the Virtual Tutor in another floating window.",
    },
    {
        "step": "4",
        "title": "Join Audio",
        "body": [
            "Choose microphone when you will speak.",
            "Choose listen only when you are observing.",
        ],
        "visual": "audio",
        "narration": "Join audio. Inside BigBlueButton, join audio when prompted. Choose microphone if you will speak, or listen only if you are observing.",
    },
    {
        "step": "5",
        "title": "Use Support Tools",
        "body": [
            "BigBlueButton is for speaking, chat, and class guidance.",
            "Current Lesson shows the lesson students should follow.",
            "Virtual Tutor gives extra help one step at a time.",
        ],
        "visual": "tools",
        "narration": "Use the support tools. The live room is where the teacher speaks with students, uses chat, and guides the class. The Current Lesson window shows the lesson students should follow during class. The Virtual Tutor window is used for extra help, one step at a time.",
    },
    {
        "step": "During Class",
        "title": "Keep The Tools Open",
        "body": [
            "Keep the BigBlueButton room open.",
            "Do not close Current Lesson or Virtual Tutor unless they are no longer needed.",
        ],
        "visual": "during",
        "narration": "During the class. Keep the BigBlueButton room open. Do not close the Current Lesson or Virtual Tutor unless you no longer need them.",
    },
    {
        "step": "End",
        "title": "End Of Session",
        "body": [
            "The teacher can leave or end the meeting from BigBlueButton.",
            "Close extra lesson or tutor windows after the class is finished.",
        ],
        "visual": "end",
        "narration": "End of session. The teacher can leave or end the meeting from BigBlueButton.",
    },
]


def audio_duration(audio: Path) -> float:
    result = subprocess.run(
        [
            str(FFPROBE),
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, max_width: int, fnt: ImageFont.ImageFont):
    lines: list[str] = []
    for para in text.split("\n"):
        words = para.split()
        line = ""
        for word in words:
            test = (line + " " + word).strip()
            if text_width(draw, test, fnt) <= max_width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    return lines


def draw_wrapped(draw, xy, text, max_width, fnt, fill="#10253f", spacing=10):
    x, y = xy
    for line in wrap_lines(draw, text, max_width, fnt):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + spacing
    return y


def fit_font(draw, text, max_width, start_size, min_size=16, bold=True):
    for size in range(start_size, min_size - 1, -1):
        fnt = font(size, bold)
        if text_width(draw, text, fnt) <= max_width:
            return fnt
    return font(min_size, bold)


def draw_background(draw):
    draw.rectangle((0, 0, W, H), fill="#f4fbf7")
    draw.rectangle((0, 0, W, 170), fill="#d9f6dc")
    draw.rectangle((0, 170, W, 184), fill="#f7c65e")
    rounded(draw, (86, 42, 150, 106), 18, "#0f9f58")
    draw.text((108, 53), "Q", font=F_BRAND, fill="#ffffff")
    draw.text((178, 57), "Pre-Quran Live Session", font=F_BRAND, fill="#09243c")


def draw_footer(draw, index):
    total = len(SCENES)
    x0, y = 270, 1008
    gap = 20
    dot = 28
    for i in range(total):
        fill = "#0f9f58" if i <= index else "#c7dfd0"
        draw.ellipse((x0 + i * (dot + gap), y, x0 + i * (dot + gap) + dot, y + dot), fill=fill)
    draw.text((1420, 1000), f"Step {index + 1} of {total}", font=F_SMALL_BOLD, fill="#284b63")


def draw_page_chrome(draw, box, title, fill="#ffffff", accent="#0f9f58"):
    x1, y1, x2, y2 = box
    rounded(draw, box, 24, fill, "#96d7aa", 4)
    rounded(draw, (x1, y1, x2, y1 + 72), 24, "#e9fff0", "#96d7aa", 0)
    draw.rectangle((x1, y1 + 48, x2, y1 + 72), fill="#e9fff0")
    draw.ellipse((x1 + 28, y1 + 25, x1 + 44, y1 + 41), fill="#f05d5e")
    draw.ellipse((x1 + 54, y1 + 25, x1 + 70, y1 + 41), fill="#f7c65e")
    draw.ellipse((x1 + 80, y1 + 25, x1 + 96, y1 + 41), fill=accent)
    title_font = fit_font(draw, title, x2 - x1 - 150, 26, 16)
    draw.text((x1 + 120, y1 + 20), title, font=title_font, fill="#10334d")


def draw_button(draw, box, label, fill="#f7c65e", outline="#d69a2d"):
    rounded(draw, box, 24, fill, outline, 4)
    fnt = fit_font(draw, label, box[2] - box[0] - 36, 28, 16)
    tw = text_width(draw, label, fnt)
    draw.text((box[0] + (box[2] - box[0] - tw) / 2, box[1] + 16), label, font=fnt, fill="#10253f")


def draw_dashboard(draw):
    draw_page_chrome(draw, (720, 250, 1715, 850), "Dashboard")
    draw.text((770, 345), "Upcoming Sessions", font=F_SECTION, fill="#09243c")
    for i, (name, time, active) in enumerate([
        ("Alphabet Review", "Today 4:00 PM", False),
        ("Pre-Quran Live Session", "Today 5:00 PM", True),
        ("Reading Practice", "Tomorrow 3:30 PM", False),
    ]):
        y = 430 + i * 125
        fill = "#fff8df" if active else "#ffffff"
        outline = "#f7c65e" if active else "#cfe8d8"
        rounded(draw, (780, y, 1655, y + 86), 18, fill, outline, 3)
        draw.text((820, y + 20), name, font=F_SMALL_BOLD, fill="#13334a")
        draw.text((1180, y + 23), time, font=F_SMALL, fill="#38546d")
        if active:
            draw_button(draw, (1405, y + 14, 1625, y + 72), "Open")


def draw_bbb_room(draw, box=(735, 260, 1700, 850), title="BigBlueButton Room"):
    draw_page_chrome(draw, box, title, fill="#fefefe", accent="#2b78ff")
    x1, y1, x2, y2 = box
    if x2 - x1 < 760:
        rounded(draw, (x1 + 32, y1 + 108, x2 - 32, y2 - 34), 18, "#edf4ff", "#c3d8f2", 2)
        draw.text((x1 + 62, y1 + 150), "Live class area", font=F_SMALL_BOLD, fill="#143047")
        draw.rectangle((x1 + 62, y1 + 210, x2 - 62, y2 - 160), fill="#ffffff", outline="#d9e5f2", width=3)
        draw.text((x1 + 92, y1 + 245), "Teacher screen", font=F_SMALL_BOLD, fill="#294b63")
        for i, name in enumerate(["Teacher", "Students", "Chat"]):
            y = y2 - 126 + i * 34
            draw.ellipse((x1 + 64, y, x1 + 86, y + 22), fill="#0f9f58")
            draw.text((x1 + 102, y - 2), name, font=F_TINY_BOLD, fill="#38546d")
        return
    rounded(draw, (x1 + 32, y1 + 110, x1 + 265, y2 - 34), 18, "#f3f7fb", "#d2dce8", 2)
    draw.text((x1 + 56, y1 + 140), "Users", font=F_SMALL_BOLD, fill="#143047")
    for i, name in enumerate(["Teacher", "Student 1", "Student 2", "Student 3"]):
        y = y1 + 198 + i * 68
        draw.ellipse((x1 + 58, y, x1 + 94, y + 36), fill="#0f9f58")
        draw.text((x1 + 110, y + 5), name, font=F_TINY_BOLD, fill="#284b63")
    rounded(draw, (x1 + 295, y1 + 110, x2 - 300, y2 - 34), 18, "#edf4ff", "#c3d8f2", 2)
    draw.text((x1 + 355, y1 + 155), "Live class area", font=F_SECTION, fill="#15314a")
    draw.rectangle((x1 + 355, y1 + 230, x2 - 360, y2 - 180), fill="#ffffff", outline="#d9e5f2", width=3)
    draw.text((x1 + 390, y1 + 268), "Teacher screen or whiteboard", font=F_BODY_BOLD, fill="#294b63")
    rounded(draw, (x2 - 270, y1 + 110, x2 - 32, y2 - 34), 18, "#f7fbff", "#d2dce8", 2)
    draw.text((x2 - 235, y1 + 140), "Chat", font=F_SMALL_BOLD, fill="#143047")
    for i, line in enumerate(["Welcome", "I can hear", "Good job"]):
        rounded(draw, (x2 - 238, y1 + 200 + i * 76, x2 - 64, y1 + 250 + i * 76), 14, "#ffffff", "#dce8f3", 2)
        draw.text((x2 - 218, y1 + 214 + i * 76), line, font=F_TINY, fill="#38546d")


def draw_lesson_window(draw, box):
    draw_page_chrome(draw, box, "Current Lesson", fill="#fffef8", accent="#0f9f58")
    x1, y1, x2, y2 = box
    draw.text((x1 + 42, y1 + 115), "Lesson Step", font=F_SMALL_BOLD, fill="#12324b")
    rounded(draw, (x1 + 42, y1 + 168, x2 - 42, y1 + 232), 18, "#dff8e6", "#91d9a4", 3)
    draw.text((x1 + 68, y1 + 184), "Follow the teacher", font=F_SMALL_BOLD, fill="#12324b")
    for i, label in enumerate(["Watch", "Repeat", "Practice"]):
        rounded(draw, (x1 + 42, y1 + 272 + i * 72, x2 - 42, y1 + 326 + i * 72), 16, "#ffffff", "#d7eadf", 2)
        draw.text((x1 + 70, y1 + 286 + i * 72), label, font=F_TINY_BOLD, fill="#38546d")


def draw_tutor_window(draw, box):
    draw_page_chrome(draw, box, "Virtual Tutor", fill="#fbfeff", accent="#f7c65e")
    x1, y1, x2, y2 = box
    rounded(draw, (x1 + 42, y1 + 125, x2 - 42, y1 + 250), 20, "#f0f8ff", "#c7dff4", 2)
    draw_wrapped(draw, (x1 + 65, y1 + 148), "Need help? Try one small step.", x2 - x1 - 130, F_SMALL_BOLD, fill="#143047", spacing=6)
    draw_button(draw, (x1 + 54, y1 + 304, x2 - 54, y1 + 366), "Ask For Help", fill="#e4f7ec", outline="#86cfa0")
    draw_button(draw, (x1 + 54, y1 + 390, x2 - 54, y1 + 452), "Next Hint", fill="#fff1c4", outline="#ddb04a")


def draw_visual(draw, name):
    if name == "overview":
        draw_bbb_room(draw, (720, 292, 1306, 806), "BigBlueButton")
        draw_lesson_window(draw, (1235, 245, 1635, 615))
        draw_tutor_window(draw, (1335, 565, 1718, 900))
    elif name == "dashboard":
        draw_dashboard(draw)
    elif name == "start":
        draw_dashboard(draw)
        draw_button(draw, (1220, 642, 1598, 710), "Start class")
    elif name == "windows":
        draw_bbb_room(draw, (690, 270, 1358, 810))
        draw_lesson_window(draw, (1180, 225, 1595, 590))
        draw_tutor_window(draw, (1308, 560, 1718, 910))
    elif name == "audio":
        draw_bbb_room(draw)
        rounded(draw, (985, 385, 1465, 695), 24, "#ffffff", "#8dbde8", 4)
        draw.text((1042, 430), "Join audio", font=F_SECTION, fill="#143047")
        draw_button(draw, (1040, 515, 1410, 580), "Microphone", fill="#e4f7ec", outline="#83c99b")
        draw_button(draw, (1040, 604, 1410, 669), "Listen only", fill="#fff1c4", outline="#ddb04a")
    elif name == "tools":
        draw_bbb_room(draw, (665, 290, 1188, 792), "Live Room")
        draw_lesson_window(draw, (1120, 245, 1508, 640))
        draw_tutor_window(draw, (1378, 532, 1736, 886))
    elif name == "during":
        draw_bbb_room(draw, (650, 250, 1328, 820), "Keep Open")
        draw_lesson_window(draw, (1170, 255, 1582, 640))
        draw_tutor_window(draw, (1340, 580, 1718, 902))
    elif name == "end":
        draw_bbb_room(draw)
        draw_button(draw, (1048, 704, 1404, 770), "Leave or end meeting", fill="#ffe1da", outline="#e28776")


def draw_scene(data, index):
    img = Image.new("RGB", (W, H), "#f4fbf7")
    draw = ImageDraw.Draw(img)
    draw_background(draw)
    rounded(draw, (104, 230, 650, 876), 32, "#ffffff", "#8fd3a1", 4)
    rounded(draw, (145, 270, 310, 326), 28, "#fff1c4", "#f0bf52", 3)
    step_font = fit_font(draw, str(data["step"]), 130, 26, 16)
    draw.text((170, 284), str(data["step"]), font=step_font, fill="#12324b")
    draw_wrapped(draw, (148, 370), data["title"], 420, F_TITLE, fill="#08213d", spacing=10)
    y = 560
    for item in data["body"]:
        draw.ellipse((156, y + 9, 174, y + 27), fill="#0f9f58")
        y = draw_wrapped(draw, (194, y), item, 380, F_BODY, fill="#284b63", spacing=8) + 20
    draw_visual(draw, data["visual"])
    draw_footer(draw, index)
    return img


def scene_durations(total_duration: float) -> list[float]:
    weights = [max(6, len(scene["narration"].split())) for scene in SCENES]
    weight_total = sum(weights)
    durations = [total_duration * weight / weight_total for weight in weights]
    if sum(durations) > total_duration:
        durations[-1] -= sum(durations) - total_duration
    return durations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=Path, default=DEFAULT_AUDIO)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    if not FFMPEG.exists() or not FFPROBE.exists():
        raise SystemExit("ffmpeg/ffprobe not found.")
    if not args.audio.exists():
        raise SystemExit(f"Missing audio: {args.audio}")

    TMP.mkdir(parents=True, exist_ok=True)
    for old in TMP.glob("*"):
        if old.is_file():
            old.unlink()

    duration = audio_duration(args.audio)
    durations = scene_durations(duration)
    concat = TMP / "slides.txt"
    lines = []
    for index, scene_data in enumerate(SCENES):
        frame = TMP / f"slide_{index:02d}.png"
        draw_scene(scene_data, index).save(frame)
        lines.append(f"file '{frame.as_posix()}'")
        lines.append(f"duration {durations[index]:.6f}")
    lines.append(f"file '{(TMP / f'slide_{len(SCENES)-1:02d}.png').as_posix()}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp_video = TMP / "live_session_explainer_storyboard.mp4"
    subprocess.run(
        [
            str(FFMPEG),
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-i",
            str(args.audio),
            "-t",
            f"{duration:.6f}",
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
            str(tmp_video),
        ],
        check=True,
    )
    tmp_video.replace(args.out)
    print(f"Wrote {args.out}")
    print(f"Duration {duration:.2f}s across {len(SCENES)} scenes")


if __name__ == "__main__":
    main()

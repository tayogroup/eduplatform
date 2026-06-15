from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIO = Path(r"C:\Users\inawa\Downloads\alphabet_lecture_script.mp3")
DEFAULT_OUT = ROOT / "src" / "media" / "messages" / "lectures" / "alphabet_lecture.mp4"
TMP = ROOT / "tmp" / "alphabet-lecture-video"
FFMPEG = Path(
    r"C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.0-full_build\bin\ffmpeg.exe"
)
FFPROBE = FFMPEG.with_name("ffprobe.exe")

W, H = 1920, 1080

AR = {
    "alif": "\u0627",
    "ba": "\u0628",
    "ta": "\u062a",
    "tha": "\u062b",
    "jeem": "\u062c",
    "ha": "\u062d",
    "kha": "\u062e",
    "dal": "\u062f",
    "ra": "\u0631",
    "zay": "\u0632",
    "seen": "\u0633",
    "sheen": "\u0634",
    "saad": "\u0635",
    "daad": "\u0636",
    "taa": "\u0637",
    "dhaa": "\u0638",
    "ayn": "\u0639",
    "ghayn": "\u063a",
    "fa": "\u0641",
    "qaf": "\u0642",
    "kaf": "\u0643",
    "lam": "\u0644",
    "meem": "\u0645",
    "noon": "\u0646",
    "ha2": "\u0647",
    "waw": "\u0648",
    "ya": "\u064a",
}

STEP_NAMES = [
    "Lecture",
    "Rules",
    "Listen",
    "Watch",
    "Phonetics",
    "Repeat",
    "LetterClue",
    "Speak",
    "Match",
    "SoundClue",
    "Animate",
    "Write",
    "Submit",
]


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


F_TITLE = font(52, True)
F_H2 = font(35, True)
F_BODY = font(26, True)
F_BODY_SMALL = font(22, True)
F_SMALL = font(19, True)
F_TINY = font(16, True)
F_AR = font(58, True)
F_AR_BIG = font(82, True)


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


def slide_audio_durations(audio_dir: Path, count: int) -> list[float]:
    durations: list[float] = []
    for index in range(count):
        clip = audio_dir / f"slide_{index:02d}.mp3"
        if not clip.exists():
            clip = audio_dir / f"slide_{index:02d}.wav"
        if not clip.exists():
            raise SystemExit(f"Missing slide audio: {clip}")
        durations.append(audio_duration(clip))
    return durations


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow_card(draw: ImageDraw.ImageDraw, box, radius=34, fill="#fffdf4", outline="#8ee0a5"):
    x1, y1, x2, y2 = box
    for i, alpha in enumerate([34, 24, 14]):
        offset = 9 + i * 6
        draw.rounded_rectangle(
            (x1 + offset, y1 + offset, x2 + offset, y2 + offset),
            radius=radius,
            fill=(0, 65, 45, alpha),
        )
    rounded(draw, box, radius, fill, outline, 5)


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def wrap_lines(text: str, width: int, draw: ImageDraw.ImageDraw, fnt: ImageFont.ImageFont):
    lines: list[str] = []
    for para in text.split("\n"):
        if not para.strip():
            lines.append("")
            continue
        words = para.split()
        line = ""
        for word in words:
            test = (line + " " + word).strip()
            if text_width(draw, test, fnt) <= width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    return lines


def draw_wrapped(draw, xy, text, max_width, fnt, fill="#10253f", spacing=8, max_lines=None):
    x, y = xy
    lines = wrap_lines(text, max_width, draw, fnt)
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + spacing
    return y


def fit_font(draw, text, max_width, start_size, min_size=14, bold=True):
    size = start_size
    while size >= min_size:
        fnt = font(size, bold)
        if text_width(draw, text, fnt) <= max_width:
            return fnt
        size -= 1
    return font(min_size, bold)


def draw_header(draw, step_label):
    rounded(draw, (86, 38, 1834, 136), 28, "#c9f5c4", "#ffffff", 4)
    rounded(draw, (112, 58, 172, 116), 16, "#ffb946")
    draw.text((132, 66), "Q", font=F_H2, fill="#ffffff")
    draw.text((205, 66), "Pre-Quran Arabic", font=F_H2, fill="#10253f")
    rounded(draw, (1362, 56, 1798, 118), 30, "#fff8da", "#ffffff", 3)
    guide_font = fit_font(draw, step_label, 380, 20, 15)
    draw.text((1388, 76), step_label, font=guide_font, fill="#0d3a24")
    title = "Alphabet Unit"
    tw = text_width(draw, title, F_TITLE)
    draw.text(((W - tw) / 2, 165), title, font=F_TITLE, fill="#071b35")


def draw_stepper(draw, active_idx):
    start_x = 78
    y_rows = [260, 376]
    card_w = 132
    card_h = 90
    gap = 14
    for i, step in enumerate(STEP_NAMES):
        row = 0 if i < 7 else 1
        col = i if i < 7 else i - 7
        x = start_x + col * (card_w + gap)
        if row == 1:
            x += 84
        y = y_rows[row]
        fill = "#ffcf72" if i == active_idx else "#effcf0"
        outline = "#f3a84c" if i == active_idx else "#80d998"
        rounded(draw, (x, y, x + card_w, y + card_h), 18, fill, outline, 4)
        circle_fill = "#ffbe2e" if i == active_idx else "#45b952"
        draw.ellipse((x + 48, y + 9, x + 84, y + 45), fill=circle_fill, outline="#ffffff", width=4)
        draw.text((x + 60, y + 14), ">", font=F_TINY, fill="#0c253d" if i == active_idx else "#ffffff")
        label_font = fit_font(draw, step, card_w - 16, 19, 13)
        lw = text_width(draw, step, label_font)
        draw.text((x + (card_w - lw) / 2, y + 54), step, font=label_font, fill="#10253f")


def draw_action_box(draw, action, complete, button_label):
    x1, y1, x2, y2 = 1276, 548, 1744, 932
    rounded(draw, (x1, y1, x2, y2), 28, "#eafff0", "#61c783", 4)
    draw.text((x1 + 30, y1 + 26), "Student action", font=F_H2, fill="#0b3c2b")
    y = draw_wrapped(draw, (x1 + 34, y1 + 82), action, 390, F_BODY_SMALL, fill="#183a58", spacing=7)
    y = max(y + 8, y1 + 176)
    rounded(draw, (x1 + 32, y, x2 - 32, y + 64), 30, "#ffbd46", "#e49a30", 4)
    btn = button_label or action.split(".")[0].replace("Click ", "").strip()
    btn = btn[:26] if btn else "Continue"
    bf = fit_font(draw, btn, 360, 27, 17)
    bw = text_width(draw, btn, bf)
    draw.text((x1 + (x2 - x1 - bw) / 2, y + 15), btn, font=bf, fill="#10253f")
    draw.text((x1 + 30, y + 88), "Complete when", font=F_SMALL, fill="#0b3c2b")
    draw_wrapped(draw, (x1 + 34, y + 116), complete, 390, F_BODY_SMALL, fill="#183a58", spacing=7, max_lines=4)


def draw_examples(draw, samples, y):
    if not samples:
        return
    x0 = 220
    gap = 24
    tile_w = 198
    tile_h = 142
    for idx, item in enumerate(samples[:4]):
        arabic, label, note = item
        x = x0 + idx * (tile_w + gap)
        rounded(draw, (x, y, x + tile_w, y + tile_h), 22, "#fff5d6", "#54bf75", 4)
        aw = text_width(draw, arabic, F_AR)
        draw.text((x + (tile_w - aw) / 2, y + 12), arabic, font=F_AR, fill="#009b45")
        lf = fit_font(draw, label, tile_w - 20, 22, 15)
        lw = text_width(draw, label, lf)
        draw.text((x + (tile_w - lw) / 2, y + 82), label, font=lf, fill="#183a58")
        if note:
            nf = fit_font(draw, note, tile_w - 20, 17, 12)
            nw = text_width(draw, note, nf)
            draw.text((x + (tile_w - nw) / 2, y + 110), note, font=nf, fill="#38546d")


def slide(data, index, total):
    img = Image.new("RGBA", (W, H), "#f1fbf5")
    draw = ImageDraw.Draw(img)
    draw_header(draw, f"Lecture Guide {index + 1}/{total}")
    draw_stepper(draw, data["active"])

    shadow_card(draw, (120, 500, 1800, 1018))
    draw.text((190, 548), data["title"], font=F_TITLE, fill="#08213d")
    y = draw_wrapped(draw, (196, 620), data["purpose"], 1020, F_BODY, spacing=8, max_lines=2)
    draw.text((196, y + 16), "What you do", font=F_H2, fill="#0b3c2b")
    y = draw_wrapped(draw, (206, y + 62), data["use"], 980, F_BODY_SMALL, fill="#183a58", spacing=7, max_lines=3)
    if data.get("samples"):
        examples_y = max(748, y + 18)
        samples_y = examples_y + 62
        draw.text((196, examples_y), "Examples", font=F_H2, fill="#0b3c2b")
        if data.get("example"):
            draw_wrapped(draw, (360, examples_y + 10), data["example"], 820, F_SMALL, fill="#183a58", spacing=7, max_lines=1)
        draw_examples(draw, data.get("samples"), samples_y)
    elif data.get("example"):
        draw.text((196, y + 22), "Example", font=F_H2, fill="#0b3c2b")
        draw_wrapped(draw, (206, y + 68), data["example"], 980, F_BODY_SMALL, fill="#183a58", spacing=7, max_lines=3)
    draw_action_box(draw, data["action"], data["complete"], data.get("button", ""))
    return img.convert("RGB")


SLIDES = [
    {
        "active": 0,
        "title": "Welcome",
        "purpose": "Learn the Arabic letters step by step. Each step has a clear job and helps you get closer to reading Quran.",
        "use": "Follow the steps in order. Read the messages. Click the main button only when you are ready.",
        "example": "You will listen with your ears, watch with your eyes, repeat with your mouth, and write with your hand.",
        "action": "Click Play Lecture to begin.",
        "button": "Play Lecture",
        "complete": "The video finishes.",
        "samples": [(AR["alif"], "Alif", "first"), (AR["ba"], "Ba", "1 dot"), (AR["ta"], "Ta", "2 dots"), (AR["tha"], "Tha", "3 dots")],
    },
    {
        "active": 0,
        "title": "Step 1: Lecture",
        "purpose": "The Lecture step shows how the unit works before practice begins.",
        "use": "Click Play Lecture. Watch the video carefully and listen to the teacher.",
        "example": "This video explains what each step does and how you will complete it.",
        "action": "Click Play Lecture.",
        "button": "Play Lecture",
        "complete": "The lecture video finishes.",
        "samples": [(AR["alif"], "Watch", ""), (AR["ba"], "Listen", ""), (AR["ta"], "Practice", ""), (AR["tha"], "Finish", "")],
    },
    {
        "active": 1,
        "title": "Step 2: Rules",
        "purpose": "Rules help you understand the alphabet before you practice.",
        "use": "Read the rules. Click Play Rules Audio only if you want to hear them. Then click Complete Rules.",
        "example": "You learn names, sounds, shapes, dots, heavy letters, light letters, and short vowels.",
        "action": "Click Complete Rules after reading.",
        "button": "Complete Rules",
        "complete": "You press Complete Rules.",
        "samples": [(AR["ba"], "Ba", "one dot"), (AR["ta"], "Ta", "two dots"), (AR["tha"], "Tha", "three dots"), (AR["saad"], "Saad", "heavy")],
    },
    {
        "active": 2,
        "title": "Step 3: Listen",
        "purpose": "Listen trains your ears to know each letter sound.",
        "use": "Click Listen or Play All. Do not repeat yet. Look at each letter and listen.",
        "example": "You may hear Alif, Ba, Ta, and Tha. Notice how each sound is different.",
        "action": "Click Listen or Play All.",
        "button": "Listen",
        "complete": "All required letter sounds play.",
        "samples": [(AR["alif"], "Alif", ""), (AR["ba"], "Ba", ""), (AR["ta"], "Ta", ""), (AR["tha"], "Tha", "")],
    },
    {
        "active": 3,
        "title": "Step 4: Watch",
        "purpose": "Watch helps your eyes see how letters are pronounced and formed.",
        "use": "Click Watch or Play All. Watch the mouth, sound, and letter shape.",
        "example": "Kha is different from Ha and Jeem. Watch carefully so you can see the difference.",
        "action": "Click Watch or Play All.",
        "button": "Watch",
        "complete": "All required videos finish.",
        "samples": [(AR["jeem"], "Jeem", ""), (AR["ha"], "Ha", ""), (AR["kha"], "Kha", ""), (AR["dal"], "Dal", "")],
    },
    {
        "active": 4,
        "title": "Step 5: Phonetics",
        "purpose": "Phonetics teaches where the sound comes from.",
        "use": "Click Phonetics or Play All. Listen to the explainer, then watch the sound example.",
        "example": "Some sounds come from the lips, some from the tongue, and some from the throat.",
        "action": "Click Phonetics or Play All.",
        "button": "Phonetics",
        "complete": "The required phonetics practice finishes.",
        "samples": [(AR["saad"], "Saad", "heavy"), (AR["daad"], "Daad", "heavy"), (AR["taa"], "Taa", "heavy"), (AR["dhaa"], "Dhaa", "heavy")],
    },
    {
        "active": 5,
        "title": "Step 6: Repeat",
        "purpose": "Repeat helps your mouth practice after your ears have listened.",
        "use": "Click Repeat or Play All. Listen first, then repeat after the teacher clearly.",
        "example": "If the teacher says Ba, you say Ba. Say one letter at a time.",
        "action": "Click Repeat or Play All.",
        "button": "Repeat",
        "complete": "You finish repeating the required letters.",
        "samples": [(AR["ra"], "Ra", ""), (AR["zay"], "Zay", ""), (AR["seen"], "Seen", ""), (AR["sheen"], "Sheen", "")],
    },
    {
        "active": 6,
        "title": "Step 7: LetterClue",
        "purpose": "LetterClue helps you remember letter shapes and dots.",
        "use": "Click LetterClue or Play All. Look at the clue picture and listen to the clue sound.",
        "example": "Dots help you tell Ba, Ta, and Tha apart.",
        "action": "Click LetterClue or Play All.",
        "button": "LetterClue",
        "complete": "All required clues finish.",
        "samples": [(AR["ba"], "Ba", "1 dot"), (AR["ta"], "Ta", "2 dots"), (AR["tha"], "Tha", "3 dots"), (AR["noon"], "Noon", "1 dot")],
    },
    {
        "active": 7,
        "title": "Step 8: Speak",
        "purpose": "Speak helps you check your own voice.",
        "use": "Click a letter. Listen to the teacher. Record your voice, then listen to yourself.",
        "example": "If your sound matches, continue. If it does not match yet, record again.",
        "action": "Click a letter, then Record.",
        "button": "Record",
        "complete": "Required speaking practice is done.",
        "samples": [(AR["ayn"], "Ayn", ""), (AR["ghayn"], "Ghayn", ""), (AR["fa"], "Fa", ""), (AR["qaf"], "Qaf", "")],
    },
    {
        "active": 8,
        "title": "Step 9: Match",
        "purpose": "Match checks if you know which sound belongs to which letter.",
        "use": "Click Match or Play All. Listen carefully, then choose the matching letter.",
        "example": "If you hear Meem, choose Meem. If you miss it, try again calmly.",
        "action": "Click Match or Play All.",
        "button": "Match",
        "complete": "The matching game finishes.",
        "samples": [(AR["kaf"], "Kaf", ""), (AR["lam"], "Lam", ""), (AR["meem"], "Meem", ""), (AR["noon"], "Noon", "")],
    },
    {
        "active": 9,
        "title": "Step 10: SoundClue",
        "purpose": "SoundClue helps you hear a letter sound inside a word.",
        "use": "Click SoundClue or Play All. Look at the letter, word, and picture. Listen carefully.",
        "example": "You may hear Fa, then a word that begins with Fa.",
        "action": "Click SoundClue or Play All.",
        "button": "SoundClue",
        "complete": "All required sound clues finish.",
        "samples": [(AR["fa"], "Fa", "word clue"), (AR["qaf"], "Qaf", "word clue"), (AR["kaf"], "Kaf", "word clue"), (AR["lam"], "Lam", "word clue")],
    },
    {
        "active": 10,
        "title": "Step 11: Animate",
        "purpose": "Animate shows how letters are written before you write them.",
        "use": "Click Animate or Play All. Watch where the letter starts, moves, and ends.",
        "example": "Watch Waw being written in one smooth movement.",
        "action": "Click Animate or Play All.",
        "button": "Animate",
        "complete": "All required writing animations finish.",
        "samples": [(AR["ha2"], "Ha", ""), (AR["waw"], "Waw", ""), (AR["ya"], "Ya", ""), (AR["meem"], "Meem", "")],
    },
    {
        "active": 11,
        "title": "Step 12: Write",
        "purpose": "Write helps your hand practice the Arabic letters.",
        "use": "Click Write. Trace slowly, stay on the guide lines, then write neatly.",
        "example": "Your teacher may ask you to print and practice on paper too.",
        "action": "Click Write.",
        "button": "Write",
        "complete": "Required writing practice is finished.",
        "samples": [(AR["alif"], "Start", ""), (AR["ba"], "Trace", ""), (AR["ta"], "Practice", ""), (AR["tha"], "Neat", "")],
    },
    {
        "active": 12,
        "title": "Step 13: Submit",
        "purpose": "Submit sends your final work to your teacher.",
        "use": "Click Submit when you are ready. Make your final recording clearly.",
        "example": "Review your work before sending it. Clear practice is better than fast practice.",
        "action": "Click Submit.",
        "button": "Submit",
        "complete": "Your final work is submitted.",
        "samples": [(AR["alif"], "Review", ""), (AR["ba"], "Record", ""), (AR["ta"], "Send", ""), (AR["tha"], "Done", "")],
    },
    {
        "active": 0,
        "title": "Helpful Buttons",
        "purpose": "Some buttons help you move safely through the unit.",
        "use": "Use Back to return. Use Step Back to redo a step. Use Skip Step only when your teacher allows it.",
        "example": "If a message appears, read it carefully before continuing.",
        "action": "Read the message first.",
        "button": "Read Message",
        "complete": "You understand what the button will do.",
        "samples": [(AR["alif"], "Back", ""), (AR["ba"], "Step Back", ""), (AR["ta"], "Skip", "teacher only"), (AR["tha"], "Continue", "")],
    },
    {
        "active": 0,
        "title": "You Are Ready",
        "purpose": "Now you know the purpose, action, and completion goal for every step.",
        "use": "Listen with attention. Watch with focus. Repeat with care. Write with patience.",
        "example": "Take your time and follow the unit in order. Bismillah.",
        "action": "Begin the Alphabet Unit.",
        "button": "Begin",
        "complete": "You practice every day.",
        "samples": [(AR["alif"], "Alif", ""), (AR["ba"], "Ba", ""), (AR["ta"], "Ta", ""), (AR["tha"], "Tha", "")],
    },
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=Path, default=DEFAULT_AUDIO)
    parser.add_argument("--audio-dir", type=Path, default=None)
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

    if args.audio_dir:
        durations = slide_audio_durations(args.audio_dir, len(SLIDES))
        duration = sum(durations)
    else:
        duration = audio_duration(args.audio)
        durations = [duration / len(SLIDES)] * len(SLIDES)
    concat = TMP / "slides.txt"
    lines = []
    for i, data in enumerate(SLIDES):
        frame = TMP / f"slide_{i:02d}.png"
        slide(data, i, len(SLIDES)).save(frame)
        lines.append(f"file '{frame.as_posix()}'")
        lines.append(f"duration {durations[i]:.6f}")
    lines.append(f"file '{(TMP / f'slide_{len(SLIDES)-1:02d}.png').as_posix()}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp_video = TMP / "alphabet_lecture_storyboard.mp4"
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
    if args.audio_dir:
        print(f"Duration {duration:.2f}s from {len(durations)} slide audio clips")
    else:
        print(f"Duration {duration:.2f}s, slide duration {durations[0]:.2f}s")


if __name__ == "__main__":
    main()

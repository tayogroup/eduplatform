from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
BOOK_DIR = ROOT / "src" / "prototypes" / "ehel-academy" / "english" / "ebooks" / "musas-muddy-stripes"
OUTPUT = ROOT / "output" / "pdf" / "musas-muddy-stripes-grade-1.pdf"

PAGES = [
    ("Musa's Muddy Stripes", "Written by Ehel Academy | Illustrated by Ehel Academy Learning Studio"),
    ("Musa the zebra loved to run.", ""),
    ("He ran past the tall giraffe.", ""),
    ("He ran past the little elephant.", ""),
    ("He ran past the swift ostrich.", ""),
    ("He leapt over a fallen branch.", ""),
    ("Then - SPLASH! Musa slipped into a muddy puddle.", ""),
    ("Mud covered his stripes. Musa felt sad.", ""),
    ("The vervet monkey brushed him with soft leaves. But the mud stayed.", ""),
    ("The elephant sprayed Musa with cool water. Splash, splash, splash!", ""),
    ("The ostrich fanned him. The giraffe found a warm, sunny place.", ""),
    ("Musa's stripes shone again. \"Thank you, friends!\" he said. Then everyone splashed and laughed.", ""),
]


def wrap(text, font, size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if current and stringWidth(trial, font, size) > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def draw_image_contain(pdf, image_path, x, y, width, height):
    with Image.open(image_path) as image:
        image = image.convert("RGB")
        image_ratio = image.width / image.height
        compressed = BytesIO()
        image.save(compressed, "JPEG", quality=88, optimize=True, progressive=True)
        compressed.seek(0)
    box_ratio = width / height
    if image_ratio > box_ratio:
        draw_width = width
        draw_height = width / image_ratio
    else:
        draw_height = height
        draw_width = height * image_ratio
    pdf.drawImage(ImageReader(compressed), x + (width - draw_width) / 2, y + (height - draw_height) / 2,
                  width=draw_width, height=draw_height, preserveAspectRatio=True, mask="auto")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = landscape(A4)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(page_width, page_height), pageCompression=1)
    pdf.setTitle("Musa's Muddy Stripes - Grade 1")
    pdf.setAuthor("Ehel Academy")
    cream = HexColor("#FFF8E8")
    ink = HexColor("#26362C")
    accent = HexColor("#D98B2B")

    for index, (main_text, credit) in enumerate(PAGES, start=1):
        pdf.setFillColor(cream)
        pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        draw_image_contain(pdf, BOOK_DIR / f"page-{index:02d}.webp", 28, 132, page_width - 56, page_height - 150)
        pdf.setFillColor(ink)
        font_size = 25 if index == 1 else 22
        font = "Helvetica-Bold" if index == 1 else "Helvetica"
        lines = wrap(main_text, font, font_size, page_width - 110)
        line_height = font_size * 1.25
        first_y = 102 + ((2 - len(lines)) * line_height / 2)
        for line_number, line in enumerate(lines):
            pdf.setFont(font, font_size)
            pdf.drawCentredString(page_width / 2, first_y - line_number * line_height, line)
        if credit:
            pdf.setFillColor(accent)
            pdf.setFont("Helvetica", 11)
            pdf.drawCentredString(page_width / 2, 45, credit)
        pdf.setFillColor(HexColor("#68766C"))
        pdf.setFont("Helvetica", 9)
        pdf.drawRightString(page_width - 22, 18, f"{index} / {len(PAGES)}")
        pdf.showPage()

    pdf.save()
    (BOOK_DIR / "original.pdf").write_bytes(OUTPUT.read_bytes())
    print(OUTPUT)


if __name__ == "__main__":
    build()

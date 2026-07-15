from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT = ROOT / "src" / "docs" / "admin-sqa"
TODAY = datetime.now().strftime("%Y-%m-%d")

DOCUMENTS = [
    {
        "source": "alphabet-lesson-test-tracker-user-guide.md",
        "pdf": "alphabet-lesson-test-tracker-user-guide.pdf",
        "title": "Alphabet Lesson Test Tracker User Guide",
        "description": "Field-by-field intern guide for recording Alphabet lesson test results.",
        "audience": "SQA testers, admins",
    },
    {
        "source": "alphabet-lesson-test-plan.md",
        "pdf": "alphabet-lesson-test-plan.pdf",
        "title": "Alphabet Lesson Test Plan And Intern Script",
        "description": "Detailed test plan and script for the Pre-Quran Alphabet lesson.",
        "audience": "SQA testers, admins",
    },
    {
        "source": "quran-academy-app-flowchart-for-testing.md",
        "pdf": "quran-academy-app-flowchart-for-testing.pdf",
        "title": "Quran Academy App Flowchart For Testing",
        "description": "System flowchart for onboarding SQA testers.",
        "audience": "SQA testers, admins",
        "image": "quran-academy-app-flowchart-for-testing.jpg",
    },
    {
        "source": "quran-academy-functionality-inventory.md",
        "pdf": "quran-academy-functionality-inventory.pdf",
        "title": "Quran Academy Functionality Inventory",
        "description": "Categorized functionality inventory for system understanding and test planning.",
        "audience": "SQA testers, admins",
    },
    {
        "source": "quran-academy-system-components-diagram.md",
        "pdf": "quran-academy-system-components-diagram.pdf",
        "title": "Quran Academy System Components Diagram",
        "description": "Component map showing how Moodle, Bunny, lessons, reports, and roles connect.",
        "audience": "SQA testers, admins",
        "image": "quran-academy-system-components-diagram.jpg",
    },
    {
        "source": "sqa-terms-and-definitions.md",
        "pdf": "sqa-terms-and-definitions.pdf",
        "title": "SQA Terms And Definitions",
        "description": "Shared quality-assurance vocabulary for interns and admins.",
        "audience": "SQA testers, admins",
    },
    {
        "source": "moodle-launch-flow.md",
        "pdf": "moodle-launch-flow.pdf",
        "title": "Moodle Launch Flow",
        "description": "Launch flow reference for Moodle-to-Pre-Quran access and routing.",
        "audience": "Admins, SQA testers",
    },
    {
        "source": "environment-promotion-checklist.md",
        "pdf": "environment-promotion-checklist.pdf",
        "title": "Environment Promotion Checklist",
        "description": "Checklist for moving changes through integration, staging, and production.",
        "audience": "Admins, SQA testers",
    },
    {
        "source": "bunny-deploy.md",
        "pdf": "bunny-deploy.pdf",
        "title": "Bunny Deploy Runbook",
        "description": "Bunny build and deployment reference for operations and release checks.",
        "audience": "Admins, SQA testers",
    },
]


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=30,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#173d36"),
    spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="DocH1",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#173d36"),
    spaceBefore=12,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="DocH2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#4d3522"),
    spaceBefore=10,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="DocH3",
    parent=styles["Heading3"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    textColor=colors.HexColor("#1f5b4d"),
    spaceBefore=8,
    spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="DocBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.2,
    leading=12,
    textColor=colors.HexColor("#243b35"),
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="DocSmall",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8,
    leading=10,
    textColor=colors.HexColor("#60736d"),
))
styles.add(ParagraphStyle(
    name="DocCode",
    parent=styles["Code"],
    fontName="Courier",
    fontSize=7.5,
    leading=9,
    textColor=colors.HexColor("#17324a"),
    backColor=colors.HexColor("#f4f7fb"),
    borderColor=colors.HexColor("#d9e5df"),
    borderWidth=0.5,
    borderPadding=4,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="TableCell",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=7.1,
    leading=8.4,
    textColor=colors.HexColor("#243b35"),
))
styles.add(ParagraphStyle(
    name="TableHeader",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=7.2,
    leading=8.6,
    textColor=colors.white,
))


def clean_inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", text)
    return text


def parse_table(lines: list[str], start: int) -> tuple[list[list[str]], int]:
    rows: list[list[str]] = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
        cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
        if not all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            rows.append(cells)
        i += 1
    return rows, i


def table_widths(rows: list[list[str]], available: float) -> list[float]:
    count = max(len(row) for row in rows)
    if count <= 2:
        weights = [1, 2]
    elif count == 3:
        weights = [1.0, 1.1, 2.4]
    elif count == 4:
        weights = [0.8, 0.8, 2.0, 2.8]
    elif count == 5:
        weights = [0.8, 0.7, 0.9, 2.0, 2.6]
    else:
        weights = [1] * count
    weights = weights[:count] + [1] * max(0, count - len(weights))
    total = sum(weights)
    return [available * weight / total for weight in weights]


def add_markdown(story: list, markdown: str, available_width: float) -> None:
    lines = markdown.splitlines()
    i = 0
    in_code = False
    code_lines: list[str] = []
    list_items: list[ListItem] = []

    def flush_list() -> None:
        nonlocal list_items
        if list_items:
            story.append(ListFlowable(list_items, bulletType="bullet", leftIndent=16, bulletFontSize=7))
            list_items = []

    def flush_code() -> None:
        nonlocal code_lines
        if code_lines:
            story.append(Paragraph(clean_inline("\n".join(code_lines)).replace("\n", "<br/>"), styles["DocCode"]))
            code_lines = []

    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                flush_list()
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped:
            flush_list()
            story.append(Spacer(1, 3))
            i += 1
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            flush_list()
            rows, i = parse_table(lines, i)
            if rows:
                data = []
                for row_index, row in enumerate(rows):
                    style = styles["TableHeader"] if row_index == 0 else styles["TableCell"]
                    data.append([Paragraph(clean_inline(cell), style) for cell in row])
                tbl = Table(data, colWidths=table_widths(rows, available_width), repeatRows=1, hAlign="LEFT")
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f7a68")),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d9e5df")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fbfa")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 8))
            continue

        if stripped.startswith("# "):
            flush_list()
            story.append(Paragraph(clean_inline(stripped[2:]), styles["DocH1"]))
        elif stripped.startswith("## "):
            flush_list()
            story.append(Paragraph(clean_inline(stripped[3:]), styles["DocH2"]))
        elif stripped.startswith("### "):
            flush_list()
            story.append(Paragraph(clean_inline(stripped[4:]), styles["DocH3"]))
        elif re.match(r"^[-*]\s+", stripped):
            text = re.sub(r"^[-*]\s+", "", stripped)
            list_items.append(ListItem(Paragraph(clean_inline(text), styles["DocBody"]), leftIndent=10))
        elif re.match(r"^\d+\.\s+", stripped):
            flush_list()
            text = re.sub(r"^\d+\.\s+", "", stripped)
            story.append(Paragraph(clean_inline(text), styles["DocBody"], bulletText="•"))
        else:
            flush_list()
            story.append(Paragraph(clean_inline(stripped), styles["DocBody"]))
        i += 1

    flush_code()
    flush_list()


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#60736d"))
    canvas.drawString(0.55 * inch, 0.35 * inch, "Quran Academy Admin/SQA Documentation")
    canvas.drawRightString(letter[0] - 0.55 * inch, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf(item: dict) -> dict:
    source = DOCS / item["source"]
    if not source.exists():
        raise FileNotFoundError(source)

    pdf_path = OUTPUT / item["pdf"]
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=item["title"],
        author="Quran Academy",
    )
    available_width = letter[0] - 1.1 * inch

    story = [
        Spacer(1, 1.8 * inch),
        Paragraph(item["title"], styles["CoverTitle"]),
        Paragraph(clean_inline(item["description"]), styles["DocH2"]),
        Spacer(1, 0.2 * inch),
        Paragraph(f"Audience: {item['audience']}", styles["DocBody"]),
        Paragraph(f"Generated: {TODAY}", styles["DocBody"]),
        PageBreak(),
    ]

    image_name = item.get("image")
    if image_name:
        image_path = DOCS / image_name
        if image_path.exists():
            story.append(Paragraph("Visual Reference", styles["DocH1"]))
            img = Image(str(image_path))
            max_image_height = letter[1] - 2.15 * inch
            scale = min(available_width / img.imageWidth, max_image_height / img.imageHeight)
            img.drawWidth = img.imageWidth * scale
            img.drawHeight = img.imageHeight * scale
            story.append(img)
            story.append(Spacer(1, 8))
            story.append(PageBreak())

    add_markdown(story, source.read_text(encoding="utf-8"), available_width)
    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)

    return {
        "title": item["title"],
        "description": item["description"],
        "audience": item["audience"],
        "source": item["source"],
        "file": item["pdf"],
        "path": f"docs/admin-sqa/{item['pdf']}",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
    }


def build_index(entries: list[dict]) -> None:
    lines = [
        "# Admin And SQA Documentation",
        "",
        f"Generated: {TODAY}",
        "",
        "These PDFs are intended for Quran Academy admins, SQA testers, and operations users.",
        "",
        "| Document | Audience | File |",
        "| --- | --- | --- |",
    ]
    for entry in entries:
        lines.append(f"| {entry['title']} | {entry['audience']} | `{entry['file']}` |")
    (OUTPUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "title": "Admin And SQA Documentation",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "basePath": "docs/admin-sqa",
        "documents": entries,
    }, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    entries = [build_pdf(item) for item in DOCUMENTS]
    build_index(entries)
    for entry in entries:
        print(f"created {OUTPUT / entry['file']}")
    print(f"created {OUTPUT / 'manifest.json'}")


if __name__ == "__main__":
    main()

"""Export every line of learner-facing Global Perspectives text to one workbook.

Matches the layout of ehel-english-scripts-complete.xlsx (and the Science,
Mathematics and Computing workbooks) so every subject is reviewed and voiced the
same way:

    one sheet per grade ("Grade 1" … "Grade 8")
    columns: Unit | Category | Item ID | Title / Word | Script Text
    rows grouped by unit, then by category in the order the learner meets them

WHICH ROWS COST MONEY
=====================
Only four of this subject's categories carry a Listen button — the unit
overview, the lesson explainers, the callout boxes and the glossary words. A
clip is named by a hash of its exact text, so editing one of those rows renames
its file and orphans the clip already paid for. Those rows are therefore marked
"(narrated)", and the sheet reports the character count per grade, so a reviewer
can see what a wording change actually costs before making it.

Everything else is on the sheet because it is still learner-facing text that
wants an eye — the activities, the practice and its answer key, the mini-project,
the toolkit — but changing it costs nothing.

THE GROWN-UP'S GUIDE
====================
Stages 1-3 carry a section written to the parent rather than the learner, and it
is deliberately kept in the adult's voice. It is exported as
"Grown-up guide (adult voice)" so a reviewer does not "correct" it into learner
voice, which is the one edit that would be wrong here.

Usage:
    python tools/export-ehel-global-perspectives-scripts.py [--out <path.xlsx>]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "src" / "prototypes" / "ehel-academy" / "global-perspectives"

HEADERS = ["Unit", "Category", "Item ID", "Title / Word", "Script Text"]
# Column C is given a width here; the English template leaves it at Excel's
# default, which clips an id like "gp-g06-u01-explain-11".
WIDTHS = {"A": 16, "B": 30, "C": 26, "D": 24, "E": 100}
FONT = "Arial"
# The English workbook's maroon header, matched so the subjects look alike on a
# reviewer's screen.
HEAD_FONT = Font(name=FONT, size=10, bold=True, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="7A1F3D")
BODY_FONT = Font(name=FONT, size=10)
TOP = Alignment(vertical="top")
TOP_WRAP = Alignment(vertical="top", wrap_text=True)

TITLE_LIMIT = 60

# Excel reads a cell whose text opens with one of these as a formula, and
# openpyxl agrees: it writes the value into the file as <f>…</f>, which Excel
# cannot parse and reports as corrupt content on open. Global Perspectives
# quotes fill-in-the-blank prompts ("______ is a global issue") and sentence
# starters, so it hits this the same way Computing's code listings do.
FORMULA_LEADS = ("=", "+", "-", "@")

# Categories whose text is spoken by a Listen button. Kept in step with
# tools/lib/ehel-global-perspectives-narration.js — if a category is added
# there, it belongs here too, or the sheet will under-report what an edit costs.
NARRATED = {
    "Unit overview (narrated)",
    "Lesson explainer (narrated)",
    "Big idea (narrated)",
    "Worked example (narrated)",
    "AI tutor prompt (narrated)",
    "Speaking prompt (narrated)",
    "Teacher session (narrated)",
    "Reflection box (narrated)",
    # A box nested inside an activity goes through the same runtime helper as
    # the boxes above, so it is narrated too. Leaving it out while still
    # labelling the row "(narrated)" made the sheet under-report the very cost
    # the label exists to warn about.
    "Activity box (narrated)",
    "Glossary word (narrated)",
}

# Callout role → category label, in the order the runtime renders them.
BOX_CATEGORY = {
    "bigIdeas": "Big idea (narrated)",
    "models": "Worked example (narrated)",
    "tutorPrompts": "AI tutor prompt (narrated)",
    "speakingPrompts": "Speaking prompt (narrated)",
    "teacherSessions": "Teacher session (narrated)",
    "reflectionPrompts": "Reflection box (narrated)",
}


def write_row(ws, values: list) -> None:
    """Append a row, forcing any formula-looking cell to be stored as text."""
    ws.append(values)
    row = ws.max_row
    for column, value in enumerate(values, 1):
        if isinstance(value, str) and value[:1] in FORMULA_LEADS:
            cell = ws.cell(row=row, column=column)
            cell.data_type = "s"
            cell.quotePrefix = True


def short(value: str) -> str:
    return str(value or "").replace("\n", " ").strip()[:TITLE_LIMIT]


def block(*pairs) -> str:
    """Join 'Label: value' lines, dropping any whose value is empty."""
    lines = []
    for label, value in pairs:
        text = value if isinstance(value, str) else ("" if value is None else str(value))
        text = text.strip()
        if not text:
            continue
        lines.append(f"{label}: {text}" if label else text)
    return "\n".join(lines)


def joined(values) -> str:
    return "\n".join(str(v).strip() for v in (values or []) if str(v).strip())


def table_text(tables) -> str:
    """Render a source table as pipe-separated rows, headers first."""
    out = []
    for table in tables or []:
        headers = table.get("headers") or []
        if headers:
            out.append(" | ".join(str(h) for h in headers))
        for row in table.get("rows") or []:
            out.append(" | ".join(str(c) for c in row))
    return "\n".join(out)


def unit_rows(unit: dict) -> list[list[str]]:
    """Every learner-facing line of one unit, in the order it is met."""
    rows: list[list[str]] = []
    meta = unit.get("unit") or {}
    uid = meta.get("unitId") or ""
    label = f"unit-{meta.get('unitNo')}"

    def add(category: str, item_id: str, title: str, text: str) -> None:
        if not str(text or "").strip():
            return
        rows.append([label, category, item_id, short(title), str(text).strip()])

    # 1. Overview — the first thing the learner reads, and a Listen button.
    add("Unit overview (narrated)", f"{uid}-overview", meta.get("unitTitle", ""), meta.get("unitOverview", ""))

    # 2. Learning outcomes and the three-stage goals.
    for i, outcome in enumerate(unit.get("outcomes") or [], 1):
        add("Learning outcome", f"{uid}-lo{i:02d}", "I can …", outcome.get("text", ""))
    goals = unit.get("goals") or {}
    for key, heading in (("starting", "Starting"), ("developing", "Developing"), ("gettingBetter", "Getting better")):
        text = joined(goals.get(key))
        add("Learning goals", f"{uid}-goals-{key}", heading, text)

    # 3. The lesson itself. Body and bullets are separate rows because only the
    #    body is narrated — a reviewer editing a bullet costs nothing, editing
    #    the body orphans a clip.
    for explainer in unit.get("explainers") or []:
        eid = f"{uid}-{explainer.get('id', '')}"
        add("Lesson explainer (narrated)", eid, explainer.get("title", ""), explainer.get("body", ""))
        add("Lesson bullets", f"{eid}-bullets", explainer.get("title", ""), joined(explainer.get("bullets")))
        add("Lesson table", f"{eid}-table", explainer.get("title", ""), table_text(explainer.get("tables")))

    # 4. Callout boxes. Each is one clip: title and lines are spoken together,
    #    so they are exported as one row in that same order.
    for field, category in BOX_CATEGORY.items():
        for box in unit.get(field) or []:
            add(category, f"{uid}-{box.get('id', '')}", box.get("title", ""),
                joined([box.get("title", "")] + list(box.get("lines") or [])))

    # 5. Reference: the toolkit, checklists and the words.
    for card in unit.get("toolkit") or []:
        add("Skills toolkit", f"{uid}-{card.get('id', '')}", card.get("title", ""),
            block(("", card.get("intro", "")), ("", joined(card.get("items"))), ("", table_text(card.get("tables")))))
    for check in unit.get("checklists") or []:
        add("Checklist", f"{uid}-{check.get('id', '')}", check.get("title", ""),
            block(("", check.get("intro", "")), ("", joined(check.get("items")))))
    reference = unit.get("reference") or {}
    for i, word in enumerate(reference.get("vocabulary") or [], 1):
        add("Glossary word (narrated)", f"{uid}-word{i:02d}", word.get("term", ""),
            f"{word.get('term', '')}. {word.get('meaning', '')}")
    add("Common mistakes", f"{uid}-mistakes", "Common mistakes to avoid", joined(reference.get("mistakes")))

    # 6. The Challenge project that runs through a self-study unit.
    challenge = unit.get("challenge") or {}
    add("Challenge", f"{uid}-challenge", "My Challenge",
        block(("", challenge.get("intro", "")), ("Topics", joined(challenge.get("topics"))),
              ("Checkpoint", joined(challenge.get("checkpoints")))))

    # 7. Activities.
    for activity in unit.get("activities") or []:
        aid = f"{uid}-{activity.get('id', '')}"
        add("Activity", aid, activity.get("label") or activity.get("title", ""),
            block(("", activity.get("intro", "")), ("", joined(activity.get("steps"))),
                  ("", table_text(activity.get("tables")))))
        for j, box in enumerate(activity.get("boxes") or [], 1):
            add("Activity box (narrated)", f"{aid}-box{j:02d}", box.get("title", ""),
                joined([box.get("title", "")] + list(box.get("lines") or [])))

    # 8. The Stage 1-3 mini-project.
    project = unit.get("project") or {}
    if project:
        add("Mini-project", f"{uid}-project", project.get("title", "Mini-project"), project.get("intro", ""))
        for step in project.get("steps") or []:
            add("Mini-project step", f"{uid}-{step.get('id', '')}", step.get("title", ""),
                block(("", step.get("intro", "")), ("", joined(step.get("items"))),
                      ("", table_text(step.get("tables")))))

    # 9. Practice and its answer key, on one row per item so a reviewer can see
    #    the question and the answer that marks it together.
    for item in unit.get("practice") or []:
        add("Practice + answer key", f"{uid}-{item.get('id', '')}", item.get("partTitle", ""),
            block(("Question", item.get("prompt", "")), ("Options", joined(item.get("options"))),
                  ("Answer", item.get("answer", ""))))
    for question in (unit.get("assessment") or {}).get("questions") or []:
        add("Unit quiz + model answer", f"{uid}-{question.get('id', '')}", short(question.get("prompt", "")),
            block(("Question", question.get("prompt", "")), ("Model answer", question.get("modelAnswer", ""))))

    # 10. Reflection and self-assessment.
    for item in unit.get("reflection") or []:
        add("Reflection", f"{uid}-{item.get('id', '')}", short(item.get("prompt", "")),
            block(("Prompt", item.get("prompt", "")), ("One way to answer", item.get("modelAnswer", ""))))
    for item in unit.get("selfAssessment") or []:
        add("Self-assessment", f"{uid}-{item.get('id', '')}", "I can …", item.get("statement", ""))

    # 11. The grown-up's guide — adult voice on purpose. Last, so a reviewer
    #     working top-down meets the learner's material first.
    guide = unit.get("grownUpGuide") or {}
    for note in guide.get("notes") or []:
        add("Grown-up guide (adult voice)", f"{uid}-guide-note", "A note for the grown-up", note)
    for section in guide.get("sections") or []:
        add("Grown-up guide (adult voice)", f"{uid}-{section.get('id', '')}", section.get("title", ""),
            block(("", section.get("body", "")), ("", joined(section.get("items"))),
                  ("", table_text(section.get("tables")))))

    return rows


def build(out_path: Path) -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)
    grand_rows = grand_narrated = grand_clips = grand_chars = 0
    summary = []
    # The generator buys one clip per DISTINCT text, so two rows carrying the
    # same sentence cost once, not twice. Counting rows overstated the bill by
    # ~150 clips. De-duplicating on the normalised text is exactly what the
    # generator does before hashing, so this number matches what it will spend
    # without reimplementing cyrb53 here and risking the two drifting apart.
    seen_texts: set[str] = set()

    grades = sorted(
        (int(p.name.split("-")[1]) for p in COURSE.glob("grade-*") if p.is_dir()),
    )
    for grade in grades:
        unit_dir = COURSE / f"grade-{grade}" / "data" / "units"
        if not unit_dir.is_dir():
            continue
        files = sorted(unit_dir.glob("unit-*.json"), key=lambda p: int(p.stem.split("-")[1]))
        if not files:
            continue

        sheet = workbook.create_sheet(f"Grade {grade}")
        write_row(sheet, HEADERS)
        rows = narrated_rows = narrated_chars = 0
        new_clips = [0]
        for file in files:
            unit = json.loads(file.read_text(encoding="utf-8"))
            for row in unit_rows(unit):
                write_row(sheet, row)
                rows += 1
                if row[1] in NARRATED:
                    narrated_rows += 1
                    normalised = " ".join(row[4].split())
                    # Under 8 characters the generator skips the clip entirely.
                    if len(normalised) >= 8 and normalised not in seen_texts:
                        seen_texts.add(normalised)
                        narrated_chars += len(normalised)
                        new_clips[0] += 1

        for cell in sheet[1]:
            cell.font = HEAD_FONT
            cell.fill = HEAD_FILL
            cell.alignment = TOP
        for row in sheet.iter_rows(min_row=2):
            for cell in row:
                cell.font = BODY_FONT
                cell.alignment = TOP_WRAP if cell.column_letter in ("D", "E") else TOP
        for letter, width in WIDTHS.items():
            sheet.column_dimensions[letter].width = width
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = f"A1:{get_column_letter(len(HEADERS))}{sheet.max_row}"

        summary.append((grade, rows, narrated_rows, new_clips[0], narrated_chars))
        grand_rows += rows
        grand_narrated += narrated_rows
        grand_clips += new_clips[0]
        grand_chars += narrated_chars

    if not summary:
        raise SystemExit(f"error: no unit data under {COURSE} — run: npm run build:global-perspectives")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(out_path)

    print(f"wrote {out_path}")
    print(f"{'sheet':<10}{'rows':>8}{'narrated':>10}{'new clips':>11}{'chars':>12}")
    for grade, rows, narrated_rows, clips, narrated_chars in summary:
        print(f"{'Grade ' + str(grade):<10}{rows:>8}{narrated_rows:>10}{clips:>11}{narrated_chars:>12,}")
    print(f"{'total':<10}{grand_rows:>8}{grand_narrated:>10}{grand_clips:>11}{grand_chars:>12,}")
    print("\n'(narrated)' rows are the ones a Listen button speaks: editing one renames its")
    print("clip, so a change there costs a re-generation. Every other row is free to edit.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=Path.home() / "OneDrive" / "Documents" / "Elevenlabs" / "ehel-global-perspectives-scripts-complete.xlsx",
    )
    args = parser.parse_args()
    build(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

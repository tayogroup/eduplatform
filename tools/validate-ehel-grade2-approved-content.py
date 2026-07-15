from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "tmp" / "ehel-template-v1" / "grade2-content-model-approved.json"
APPROVED = "Approved - curriculum reviewer"


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def outcome_references(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def validate(model: dict) -> list[str]:
    errors: list[str] = []
    require(model["metadata"].get("review_status") == "Approved for controlled Grade 2 implementation", "Metadata approval is missing.", errors)
    require(model["metadata"].get("term_mapping", "").startswith("Approved:"), "Term mapping is not approved.", errors)

    id_fields = {
        "units": "unit_id", "outcomes": "outcome_id", "vocabulary": "vocabulary_id",
        "readings": "reading_id", "comprehension": "question_id", "grammar": "grammar_id",
        "speaking": "speaking_id", "writing": "writing_id", "activities": "activity_id",
        "assignments": "assignment_id", "quizzes": "question_id", "live_sessions": "live_session_id",
        "teacher_notes": "teacher_note_id", "answer_key": "answer_id",
        "self_assessment": "self_assessment_id", "sources": "source_id",
    }
    for collection, id_field in id_fields.items():
        ids = [row.get(id_field, "") for row in model[collection]]
        require(all(ids), f"{collection}: blank {id_field}.", errors)
        require(len(ids) == len(set(ids)), f"{collection}: duplicate {id_field}.", errors)

    reviewed_collections = [
        "units", "outcomes", "vocabulary", "readings", "comprehension", "grammar", "speaking",
        "writing", "activities", "assignments", "quizzes", "live_sessions", "teacher_notes",
        "answer_key", "rubrics", "self_assessment",
    ]
    for collection in reviewed_collections:
        unapproved = [row for row in model[collection] if row.get("review_status") != APPROVED]
        require(not unapproved, f"{collection}: {len(unapproved)} records are not approved.", errors)

    outcome_ids = {row["outcome_id"] for row in model["outcomes"]}
    for collection, field in {
        "comprehension": "outcome_id", "grammar": "outcome_id", "speaking": "outcome_id",
        "writing": "outcome_id", "activities": "outcome_id", "quizzes": "outcome_id",
        "assignments": "outcome_ids", "live_sessions": "outcome_ids",
    }.items():
        for row in model[collection]:
            references = outcome_references(row.get(field, ""))
            require(bool(references), f"{collection}: {row} has no outcome mapping.", errors)
            invalid = [reference for reference in references if reference not in outcome_ids]
            require(not invalid, f"{collection}: invalid outcomes {invalid}.", errors)

    for item in model["vocabulary"]:
        require(all(item.get(f"sentence_{index}") for index in range(1, 6)), f"Vocabulary {item['vocabulary_id']} does not have five sentences.", errors)
        require(bool(item.get("student_sentence_starter")), f"Vocabulary {item['vocabulary_id']} has no sentence starter.", errors)
    for question in model["comprehension"]:
        require(bool(question.get("correct_answer") and question.get("explanation")), f"Comprehension {question['question_id']} lacks approved guidance.", errors)
    for question in model["quizzes"]:
        options = [option.strip() for option in question.get("options", "").split("|")]
        require(question.get("correct_answer") in options, f"Quiz {question['question_id']} answer is not in its options.", errors)
    for writing in model["writing"]:
        for field in ("model_text", "sentence_starter", "expected_length", "success_criteria", "support", "extension", "rubric_id"):
            require(bool(writing.get(field)), f"Writing {writing['writing_id']} lacks {field}.", errors)

    answers_by_content = {row["content_id"] for row in model["answer_key"]}
    for collection, id_field in (("comprehension", "question_id"), ("quizzes", "question_id"), ("assignments", "assignment_id")):
        missing = [row[id_field] for row in model[collection] if row[id_field] not in answers_by_content]
        require(not missing, f"Answer key is missing {collection}: {missing[:5]}", errors)
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the approved Ehel Grade 2 English content model.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    args = parser.parse_args()
    model = json.loads(args.input.read_text(encoding="utf-8"))
    errors = validate(model)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)
    print("Approved content validation passed.")
    print(f"9 units | {len(model['vocabulary'])} vocabulary records | {len(model['comprehension'])} comprehension answers | {len(model['answer_key'])} answer-key entries")


if __name__ == "__main__":
    main()

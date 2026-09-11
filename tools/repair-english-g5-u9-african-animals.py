# -*- coding: utf-8 -*-
"""Grade 5 Unit 9: the rescue centre's animals, made ones that live there.

WHAT WAS WRONG. "Nookwatch" is an East African woodland rescue centre (the
story set it outside Fort Portal, Uganda, until the content review removed the
town), and its two headline animals were a LEMUR (Kobi, the centre's oldest)
and GIBBONS. Lemurs live only on Madagascar and gibbons only in South and
South-East Asia. The unit's other animals - red-tailed monkeys, bush babies -
are right where they are, which made the two wrong ones a lesson in something
untrue about the learner's own continent.

WHAT REPLACES THEM, chosen so the story needs no other change:
  lemur  -> GOLDEN MONKEY. It lives in the bamboo forests of the Virunga
            volcanoes (Uganda, Rwanda), and the story's bamboo grove, sleeping
            nook and climbing all still hold. Kobi's fur becomes golden.
  gibbon -> COLOBUS MONKEY (black-and-white colobus), common in Uganda's
            forests. Its babies are born white, so the baby's "brown textile
            coat" becomes a white one. The story's verbs ("swing", "swung")
            stay, because several vocabulary sentences teach those verbs.

WHERE: every text field of Units 7 and 9 (never an audio descriptor), the two
core-word source files the Unit 7 sentences come from, and the sentence
glossary - whose lemur, gibbon and gibbons entries go, and which gains
colobus and monkeys (golden and monkey are already in it). Game packs, the
Story Library, the glossary examples and the topic index are derived and are
rebuilt afterwards by their own tools.

    python tools/repair-english-g5-u9-african-animals.py          # dry run
    python tools/repair-english-g5-u9-african-animals.py --write

Idempotent: a second run finds nothing to change.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-5", "data")

# specific sentences first, then the nouns, longest and capitalised forms first
REPLACEMENTS = [
    ("He has dark eyes and thick brown fur, soft as a woven textile.",
     "He has dark eyes and thick golden fur, soft as a woven textile."),
    ("The baby one has thick fur, like a brown textile coat.",
     "The baby one has thick fur, like a white textile coat."),
    ("The lemur's brown fur felt as soft as fabric.",
     "The golden monkey's orange fur felt as soft as fabric."),
    ("Lemurs", "Golden monkeys"), ("lemurs", "golden monkeys"),
    ("Lemur", "Golden monkey"), ("lemur", "golden monkey"),
    ("Gibbons", "Colobus monkeys"), ("gibbons", "colobus monkeys"),
    ("Gibbon", "Colobus monkey"), ("gibbon", "colobus monkey"),
]
LEFT = re.compile(r"lemur|gibbon", re.I)

GLOSSARY_DROP = ["lemur", "gibbon", "gibbons"]
GLOSSARY_ADD = {
    "colobus": "a monkey with long black-and-white fur that lives high in the trees of African forests.",
    "monkeys": "small furry animals with long tails that live mainly in trees.",
}


def is_audio_key(k):
    return k == "audio" or k.endswith("Audio")


def rewrite(o, counter):
    """Every string under o, skipping audio descriptors entirely."""
    if isinstance(o, dict):
        for k, v in list(o.items()):
            if is_audio_key(k):
                continue
            if isinstance(v, str):
                o[k] = sub(v, counter)
            else:
                rewrite(v, counter)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            o[i] = sub(v, counter) if isinstance(v, str) else (rewrite(v, counter) or v)


def sub(s, counter):
    out = s
    for old, new in REPLACEMENTS:
        out = out.replace(old, new)
    if out != s:
        counter[0] += 1
    return out


def leftovers(o, trail=""):
    if isinstance(o, dict):
        for k, v in o.items():
            if not is_audio_key(k):
                yield from leftovers(v, trail + "." + k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from leftovers(v, "%s[%d]" % (trail, i))
    elif isinstance(o, str) and LEFT.search(o):
        yield trail


def load(p, indent):
    raw = io.open(p, encoding="utf-8", newline="").read()
    d = json.loads(raw)
    if json.dumps(d, ensure_ascii=False, indent=indent) + "\n" != raw.replace("\r\n", "\n"):
        sys.exit("REFUSED: %s does not round-trip" % p)
    return raw, d


def main():
    write = "--write" in sys.argv
    for a in sys.argv[1:]:
        if a != "--write":
            sys.exit("REFUSED: unrecognised argument %r" % a)
    report, outputs, problems = [], {}, []

    for rel in ("units/unit-7.json", "units/unit-9.json", "core-words-authored.json", "core-words-draft.json"):
        p = os.path.join(DATA, rel)
        raw = io.open(p, encoding="utf-8", newline="").read()
        indent = 2 if json.dumps(json.loads(raw), ensure_ascii=False, indent=2) + "\n" == raw.replace("\r\n", "\n") else 1
        raw, d = load(p, indent)
        counter = [0]
        rewrite(d, counter)
        left = list(leftovers(d))
        if left:
            problems.append("%s still names the animal at %s" % (rel, ", ".join(left[:5])))
        report.append("%-26s %3d string(s) changed" % (rel, counter[0]))
        if counter[0]:
            nl = "\r\n" if "\r\n" in raw else "\n"
            outputs[p] = (json.dumps(d, ensure_ascii=False, indent=indent) + "\n").replace("\n", nl)

    gp = os.path.join(DATA, "sentence-glossary.json")
    graw = io.open(gp, encoding="utf-8", newline="").read()
    gindent = 2 if json.dumps(json.loads(graw), ensure_ascii=False, indent=2) + "\n" == graw.replace("\r\n", "\n") else 1
    graw, g = load(gp, gindent)
    changed = 0
    for k in GLOSSARY_DROP:
        if k in g["entries"]:
            del g["entries"][k]
            changed += 1
    for k, definition in GLOSSARY_ADD.items():
        if k not in g["entries"]:
            g["entries"][k] = {"definition": definition, "source": "sentence-glossary"}
            changed += 1
    if "entryCount" in g and g["entryCount"] != len(g["entries"]):
        g["entryCount"] = len(g["entries"])
    report.append("%-26s %3d entry change(s), %d entries" % ("sentence-glossary.json", changed, len(g["entries"])))
    if changed:
        nl = "\r\n" if "\r\n" in graw else "\n"
        outputs[gp] = (json.dumps(g, ensure_ascii=False, indent=gindent) + "\n").replace("\n", nl)

    print("\n  Grade 5 Unit 9 animals (%s)" % ("WRITING" if write else "dry run - add --write"))
    for line in report:
        print("    " + line)
    for pr in problems:
        print("    REFUSED " + pr)
    if problems:
        sys.exit(1)
    if write:
        for p, text in outputs.items():
            io.open(p, "w", encoding="utf-8", newline="").write(text)


if __name__ == "__main__":
    main()

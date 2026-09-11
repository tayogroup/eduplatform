# -*- coding: utf-8 -*-
"""Draw every Grade 1 picture with emoji a school tablet already has.

    python replace-new-emoji.py            # report
    python replace-new-emoji.py --write

The 2026-09-11 re-validation (area 21) found six glyphs in this build that need
an Emoji 11-13 font: rock, feather and bucket (13.0), chair (12.0), brick and
teddy bear (11.0). A device whose font stops at Emoji 5.0 - common on the older
Android tablets schools run - draws each as an empty box, and in five of the
eleven places the picture IS the question ("Which one is lighter?" over a box
and a box). Emoji 5.0 has been in every Android and iOS font since 2017.

Each replacement changes the picture, the option text and the reason together,
so the item still agrees with itself: the stone becomes a hammer (small and
heavy, beside a big light balloon - the point the item makes), the feather a
leaf, the bricks boxes, the bucket a bath, the teddy a pile of books. The chair
standing in for a table becomes a table, drawn, with the cat under it. The two
stickers take the keycap ten and the signal bars.

Every anchor must match exactly once or the file is left alone; a second run
changes nothing.
"""
import io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

TABLE = ('<svg viewBox="0 0 140 92" width="140" height="92" aria-hidden="true">'
         '<rect x="6" y="8" width="128" height="10" rx="3" fill="currentColor"></rect>'
         '<rect x="16" y="18" width="8" height="70" fill="currentColor"></rect>'
         '<rect x="116" y="18" width="8" height="70" fill="currentColor"></rect>'
         '<text x="70" y="84" font-size="44" text-anchor="middle">\U0001F408</text></svg>')
EDITS = {
    "shapes-and-sizes.html": [
        ('pic: balance(1, "\U0001FAA8", "\U0001FAB6"),\n        opts: [{ t: "\U0001FAB6 feather", ok: true }, { t: "\U0001FAA8 stone", ok: false }],\n        why: "The feather is lighter, so its side went UP." }',
         'pic: balance(1, "\U0001F528", "\U0001F343"),\n        opts: [{ t: "\U0001F343 leaf", ok: true }, { t: "\U0001F528 hammer", ok: false }],\n        why: "The leaf is lighter, so its side went UP." }'),
        ('pic: balance(-1, "\U0001F388", "\U0001FAA8"),\n        opts: [{ t: "\U0001FAA8 the stone", ok: true }, { t: "\U0001F388 the balloon", ok: false }],\n        why: "The stone\'s side went down, so the stone is heavier. Bigger does not always mean heavier." }',
         'pic: balance(-1, "\U0001F388", "\U0001F528"),\n        opts: [{ t: "\U0001F528 the hammer", ok: true }, { t: "\U0001F388 the balloon", ok: false }],\n        why: "The hammer\'s side went down, so the hammer is heavier. Bigger does not always mean heavier." }'),
        ('pic: balance(0, "\U0001F9F1", "\U0001F9F1"),', 'pic: balance(0, "\U0001F4E6", "\U0001F4E6"),'),
        ('{ ask: "One brick goes on each side of a balance. What does the balance do?", pic: \'<div class="ss-emo sm">\U0001F9F1 ⚖️ \U0001F9F1</div>\',',
         '{ ask: "Two boxes that are just the same go on a balance, one on each side. What does the balance do?", pic: \'<div class="ss-emo sm">\U0001F4E6 ⚖️ \U0001F4E6</div>\','),
        ('why: "The two bricks weigh the same, so neither side goes down. The balance stays level." }',
         'why: "The two boxes weigh the same, so neither side goes down. The balance stays level." }'),
        ("pic: '<div style=\"font-size:56px\">\U0001FA91\U0001F408</div>'", "pic: '<div style=\"line-height:0\">" + TABLE + "</div>'"),
        ('pic: \'<div class="ss-emo">\U0001FAA3 &nbsp; ☕</div>\',\n        opts: [{ t: "the bucket", ok: true }, { t: "the cup", ok: false }],\n        why: "A bucket is much bigger inside than a cup, so when both are full the bucket holds more." }',
         'pic: \'<div class="ss-emo">\U0001F6C1 &nbsp; ☕</div>\',\n        opts: [{ t: "the bath", ok: true }, { t: "the cup", ok: false }],\n        why: "A bath is much bigger inside than a cup, so when both are full the bath holds more." }'),
        ('pic: ssShelf("\U0001F9F8", "⚽"),\n        opts: [{ t: "\U0001F9F8 the teddy", ok: true }, { t: "the floor", ok: false }],\n        why: "The teddy is on the top shelf, higher up than the ball. The teddy is above the ball, and the floor is below it." }',
         'pic: ssShelf("\U0001F4DA", "⚽"),\n        opts: [{ t: "\U0001F4DA the books", ok: true }, { t: "the floor", ok: false }],\n        why: "The books are on the top shelf, higher up than the ball. The books are above the ball, and the floor is below it." }'),
    ],
    "counting-to-twenty.html": [('["\U0001F9F1", "Counting in tens"]', '["\U0001F51F", "Counting in tens"]')],
    "asking-and-sorting.html": [('["\U0001F9F1", "I built a block graph"]', '["\U0001F4F6", "I built a block graph"]')],
}
NEW = ["\U0001FAA8", "\U0001F9F1", "\U0001FAB6", "\U0001FA91", "\U0001FAA3", "\U0001F9F8"]
bad = 0
for f, edits in EDITS.items():
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    t = s
    for old, new in edits:
        if old not in t and new in t:
            continue
        if t.count(old) != 1:
            print("  REFUSED  %s: an anchor matches %d times: %s" % (f, t.count(old), old[:60])); bad += 1; break
        t = t.replace(old, new)
    else:
        left = [c for c in NEW if c in t]
        if left:
            print("  REFUSED  %s: still carries %s" % (f, " ".join(left))); bad += 1; continue
        if t != s and WRITE:
            io.open(p, "w", encoding="utf-8", newline="").write(t)
        print("  %s  %s" % (("changed " if WRITE else "would change") if t != s else "already ", f))
sys.exit(1 if bad else 0)

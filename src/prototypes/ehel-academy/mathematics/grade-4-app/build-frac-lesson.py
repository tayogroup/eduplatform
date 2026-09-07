"""Assemble the Grade 4 Parts of a Whole lesson.

The shell — narration client, deck navigation, stickers, `finish`, `lines`, `nline`, `fmt`,
`rnd`, `shuffle`, `cheer`, `say` — is taken VERBATIM from Four Digits Strong, so this lesson is
a sibling of the one Grade 4 already has rather than a lookalike. Only the slides are new.
"""
import io

head = io.open("g4-lesson.css", encoding="utf-8").read()
extra = io.open("frac-extra.css", encoding="utf-8").read()
body = io.open("frac-body.html", encoding="utf-8").read()
shell = io.open("shell.js", encoding="utf-8").read()
slides = io.open("frac-slides.js", encoding="utf-8").read()

doc = (
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    "<title>Parts of a Whole</title>\n"
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
    'family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">\n'
    "<style>\n" + head + extra + "</style>\n"
    + body
    + "\n<script>\n" + shell + slides + "\n})();\n</script>\n"
)

io.open("parts-of-a-whole.html", "w", encoding="utf-8").write(doc)
print("wrote parts-of-a-whole.html", len(doc), "bytes")

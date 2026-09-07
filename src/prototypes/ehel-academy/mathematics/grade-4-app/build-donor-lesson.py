"""Reassemble Four Digits Strong, the lesson the other five were derived from.

It reached this directory as three pieces rather than a page: g4-lesson-body.html,
g4-lesson.css, and g4-lesson.js -- which is the shell and its own slides together
(shell.js is this file split at the first slide marker, and is what the five siblings
build on). Without it the build teaches 35 of the 46 Stage 4 objectives; with it, 46.

The five builders wrap their slide code in the IIFE close themselves because their
slide files do not carry it. This one must NOT: g4-lesson.js is the whole original
script and already closes its own closure.
"""
import io

head = io.open("g4-lesson.css", encoding="utf-8").read()
body = io.open("g4-lesson-body.html", encoding="utf-8").read()
script = io.open("g4-lesson.js", encoding="utf-8").read()

doc = (
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    "<title>Four Digits Strong</title>\n"
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
    'family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap">\n'
    "<style>\n" + head + "</style>\n"
    + body
    + "\n<script>\n" + script + "\n</script>\n"
)

io.open("four-digits-strong.html", "w", encoding="utf-8").write(doc)
print("wrote four-digits-strong.html", len(doc), "bytes")

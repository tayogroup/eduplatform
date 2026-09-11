# -*- coding: utf-8 -*-
"""Lesson 12 - Caesar and Pigpen.

0059 Stage 4 Networks and Digital Communication: 4DC.06 write and decode
messages using the Caesar Cipher and the Pigpen Cipher; 4DC.05 where and
why encryption is used.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "caesar-and-pigpen",
    "title": "Caesar and Pigpen",
    "blurb": "Shift the alphabet along to write and read a Caesar cipher, draw the grid shapes of the Pigpen cipher, and see how the key is what makes a cipher work and what makes it fail.",
    "steps": [
        step("demo", "The Caesar cipher", "\U0001F3DB️", "Caesar learner", ["4DC.06"],
             "Two thousand years ago Julius Caesar sent secret orders by shifting every letter along the alphabet. Press <b>Next</b>.",
             explain(
                 ["The Caesar cipher moves every letter the same number of places along the alphabet. That number is the key."],
                 ["Shift 3: a becomes d, b becomes e, c becomes f.", "cat becomes f d w.", "At the end, wrap round: y with shift 3 is b."],
                 ["Children count the starting letter as 1.", "Count the steps AFTER the letter: a, then b, c, d. Three steps."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F3DB️", "cap": "Caesar's generals had the same rule: <b>shift every letter 3 places</b>.", "say": "Caesar's generals shared one rule: shift every letter three places along the alphabet."},
                 {"pic": "\U0001F520", "cap": "Shift 3: <b>a</b> becomes <b>d</b>, <b>b</b> becomes <b>e</b>, <b>c</b> becomes <b>f</b>.", "say": "With shift 3, a becomes d, b becomes e, c becomes f."},
                 {"pic": "\U0001F431", "cap": "<b>cat</b>: c to f, a to d, t to w. <b>fdw</b>.", "say": "cat: c becomes f, a becomes d, t becomes w. f d w.", "sound": "type"},
                 {"pic": "\U0001F504", "cap": "At the end of the alphabet, wrap round: <b>y</b> shifted 3 is <b>b</b>.", "say": "At the end of the alphabet you wrap round to the start: y shifted three is b."},
                 {"pic": "\U0001F511", "cap": "To decode, shift BACK by the same number. The number is the <b>key</b>.", "say": "To decode, shift back by the same number. The shift number is the key, and anyone who knows it can read the message.", "sound": "ding"},
             ]},
             "Shift along to write, shift back to read."),

        step("cipher", "Caesar: write and read", "\U0001F511", "Caesar coder", ["4DC.06", "4DC.05"],
             "The shifted alphabet is on screen for each message. Decode the coded words back to plain letters, and encode the plain words by shifting.",
             explain(
                 ["Encode: find the letter on the top row, read the letter below it.", "Decode: find the coded letter on the bottom row, read the plain letter above it."],
                 ["Shift 3: cat is fdw.", "Shift 3: kl is hi."],
                 ["Children forget the shift changes between messages.", "Read the shift for each message before you start."],
                 ["One letter at a time. Use the strip."]),
             {"rounds": [
                 {"mode": "caesar", "shift": 3, "kind": "encode", "word": "cat", "answer": "fdw", "why": "c to f, a to d, t to w."},
                 {"mode": "caesar", "shift": 3, "kind": "decode", "code": "kl", "answer": "hi", "why": "k back 3 is h; l back 3 is i."},
                 {"mode": "caesar", "shift": 1, "kind": "encode", "word": "dog", "answer": "eph", "why": "Shift 1: each letter moves one place."},
                 {"mode": "caesar", "shift": 3, "kind": "decode", "code": "vhfuhw", "answer": "secret", "why": "Every letter back 3: secret."},
                 {"mode": "caesar", "shift": 2, "kind": "encode", "word": "key", "answer": "mga", "why": "y shifted 2 wraps round to a."},
             ]},
             "Five Caesar messages, written and read."),

        step("demo", "The Pigpen cipher", "\U0001F437", "Pigpen learner", ["4DC.06"],
             "The Pigpen cipher swaps letters for SHAPES. Each letter sits in a pen in a grid, and its symbol is the shape of its pen. Press <b>Next</b>.",
             explain(
                 ["Draw a noughts-and-crosses grid and put letters in the nine pens. A letter's symbol is the shape of the lines round it.", "A second grid adds a dot, and two X shapes hold the rest."],
                 ["a is in the top-left pen: two lines, a corner open at the top and left.", "e is the middle pen: a closed box."],
                 ["Children draw the letter's shape instead of its pen's shape.", "Look at the LINES round the pen, not the letter."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "#️⃣", "cap": "Draw a grid like noughts and crosses. Put letters in the nine <b>pens</b>: a to i.", "say": "Draw a grid like noughts and crosses. Put the letters a to i in its nine pens."},
                 {"pic": "\U0001F4D0", "cap": "A letter's symbol is the SHAPE of its pen: the lines round it. <b>e</b>, in the middle, is a closed box.", "say": "A letter's symbol is the shape of its pen: the lines round it. e, in the middle, is a closed box."},
                 {"pic": "\U0001F518", "cap": "A second grid holds <b>j to r</b>, with a dot in each pen. Two X shapes hold <b>s to z</b>.", "say": "A second grid holds j to r, with a dot in each pen. Two X shapes hold s to z."},
                 {"pic": "\U0001F511", "cap": "The <b>key</b> is the grid. With it you can write and read every symbol.", "say": "The key is the grid. With it you can write and read every symbol, and without it the message is just shapes.", "sound": "ding"},
             ]},
             "Every letter has a pen; every pen has a shape."),

        step("cipher", "Pigpen: write and read", "\U0001F437", "Pigpen coder", ["4DC.06"],
             "The Pigpen key is on screen. Decode the shapes into letters, and encode the words by tapping each letter's shape.",
             explain(
                 ["Decode: find the shape in the key, read its letter.", "Encode: find the letter in the key, tap its shape."],
                 [],
                 ["Children mix up a pen with its dotted twin.", "Look for the dot: it is the difference between a and j."],
                 ["One at a time. Look at the key."]),
             {"rounds": [
                 {"mode": "pigpen", "kind": "decode", "code": "hi", "answer": "hi", "why": "Two shapes, two letters: hi."},
                 {"mode": "pigpen", "kind": "encode", "word": "cat", "answer": "cat", "why": "c, a and t: each its own shape."},
                 {"mode": "pigpen", "kind": "decode", "code": "code", "answer": "code", "why": "c, o, d, e."},
                 {"mode": "pigpen", "kind": "encode", "word": "spy", "answer": "spy", "why": "s, p and y come from the dotted grid and the X shapes."},
             ]},
             "Four Pigpen messages, written and read."),

        step("context", "The key is everything", "\U0001F511", "Key thinker", ["4DC.05", "4DC.06"],
             "Both ciphers work because of a <b>key</b>: the shift number, or the grid. Tap each idea about keys.",
             explain(
                 ["A cipher is only as secret as its key. Anyone who has the key can read everything."],
                 ["Caesar's enemies who guessed the shift read his orders.", "There are only 25 shifts to try, so a Caesar cipher can be cracked by trying them all.",
                  "Today's encryption uses keys so long that trying them all would take longer than the age of the universe."],
                 ["Children think a cipher with a longer message is safer.", "The KEY is what makes it safe, not the length of the message."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F511", "label": "the key", "say": "The key. The shift number, or the Pigpen grid. Whoever has it can read the message; whoever does not, cannot."},
                 {"pic": "\U0001F91D", "label": "sharing the key", "say": "Sharing the key. Caesar had to tell his generals the shift in advance, in person. If a messenger with the key was caught, every message was open."},
                 {"pic": "\U0001F522", "label": "only 25 shifts", "say": "Only 25 shifts. A Caesar cipher can be cracked by trying every shift, one after another. It is a good puzzle and a weak lock."},
                 {"pic": "\U0001F310", "label": "encryption today", "say": "Encryption today, in your browser and your messages, uses the same idea with keys so long that trying every one would take longer than the age of the universe."},
             ], "need": 4,
              "then": {"ask": "Why is a Caesar cipher easy to crack?",
                       "opts": [opt("There are only 25 possible shifts to try", True), opt("The letters are too small", False), opt("Nobody can read Latin", False)],
                       "why": "Try each shift until words appear. Modern keys are far too many to try."}},
             "The key makes the cipher, and the key breaks it."),

        step("questions", "Check: ciphers", "\U0001F4DD", "Cipher checker", ["4DC.05", "4DC.06"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Caesar, Pigpen, keys."], [], ["Read, think, tap."]),
             {"items": [
                 q("With a Caesar shift of 3, 'a' becomes...", "\U0001F520", "d", ["c", "b", "z"], "Three places along."),
                 q("In the Pigpen cipher a letter is replaced by...", "\U0001F437", "the shape of the pen it sits in", ["a number", "its own shape", "a colour"], "The lines round its pen."),
                 q("To decode a Caesar message you...", "\U0001F504", "shift every letter back by the key", ["shift forward again", "read it upside down", "count the letters"], "Back by the same number."),
             ]},
             "Shift, shape, key."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4DC.05", "4DC.06"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["The two ciphers and the idea of a key."], [], ["Read, look, tap."]),
             {"items": [
                 q("The Caesar cipher works by...", "\U0001F3DB️", "shifting every letter the same number of places", ["swapping letters for shapes", "writing backwards", "using numbers"], "A shift along the alphabet."),
                 q("'cat' with shift 3 is...", "\U0001F431", "fdw", ["dbu", "act", "cat"], "c to f, a to d, t to w."),
                 q("'y' with shift 3 is...", "\U0001F504", "b", ["z", "a", "v"], "Wrap round the end."),
                 q("The Pigpen key is...", "#️⃣", "the grids that give each letter a shape", ["a shift number", "a password", "a pig"], "The grid is the key."),
                 q("The difference between 'a' and 'j' in Pigpen is...", "\U0001F518", "a dot in the pen", ["a bigger box", "a colour", "nothing"], "The second grid is dotted."),
                 q("A cipher is only as secret as...", "\U0001F511", "its key", ["its length", "its colour", "the paper"], "Whoever has the key can read it."),
                 q("Encryption in your browser is different from Caesar's because...", "\U0001F310", "its keys are far too many to try one by one", ["it uses no key", "it shifts by 3", "it is on paper"], "25 shifts can be tried; modern keys cannot."),
             ]},
             "That is the whole lesson finished. You write and read Caesar and Pigpen, and know why the key matters."),
    ],
}


LESSON["about"] = [
    "Encode and decode a message with the Caesar cipher.",
    "Encode and decode a message with the Pigpen cipher.",
    "Explain what a key is and why sharing it is the risk.",
    "Say why modern encryption is stronger than Caesar's.",
]

LESSON["lecture"] = [
    part("\U0001F3DB️", "The Caesar cipher",
         "Julius Caesar shifted every letter of his orders the same number of places along the alphabet. With shift 3, a becomes d and cat becomes fdw; at the end of the alphabet you wrap round, so y becomes b. To decode, shift back by the same number."),
    part("\U0001F437", "The Pigpen cipher",
         "Pigpen swaps letters for shapes. Draw a noughts-and-crosses grid, put a to i in its nine pens, and each letter's symbol is the shape of the lines round its pen. A second, dotted grid holds j to r, and two X shapes hold s to z. The grid is the key."),
    part("\U0001F511", "The key",
         "A cipher is only as secret as its key. Caesar had to tell his generals the shift in advance, and a captured messenger opened every message. A Caesar cipher has only 25 possible shifts, so it can be cracked by trying them all."),
    part("\U0001F310", "Encryption today",
         "The encryption in your browser and your messages uses the same idea: scramble with a key, unscramble with the key. The difference is that its keys are so long that trying every one would take longer than the age of the universe. That is why your password and your card number are safe on the way."),
]

LESSON["words"] = [
    word("cipher", "\U0001F511", "A rule for turning a message into secret code and back.",
         ["Caesar's cipher shifts letters.", "Pigpen is a cipher of shapes."]),
    word("shift", "\U0001F504", "How many places along the alphabet each letter moves.",
         ["A shift of 3 turns a into d.", "Shift back to decode."]),
    word("key", "\U0001F511", "The secret that lets you read a cipher: the shift number or the grid.",
         ["Keep the key secret.", "Without the key it is just shapes."]),
    word("encode", "✏️", "To turn plain letters into code.",
         ["Encode cat as fdw.", "Encode the word."]),
    word("decode", "\U0001F50D", "To turn code back into plain letters.",
         ["Decode kl as hi.", "Decode the shapes."]),
    word("Pigpen", "\U0001F437", "A cipher where each letter's symbol is the shape of the pen it sits in.",
         ["Write it in Pigpen.", "The Pigpen grid is the key."]),
]

LESSON["home"] = [
    home("Secret notes", "Paper, a friend",
         ["Agree a shift with a friend in secret.",
          "Write each other notes in Caesar cipher and decode them.",
          "Now give a third person the note but not the shift. Can they crack it by trying shifts?"],
         "The key is the secret, and 25 tries breaks it."),
    home("Pigpen poster", "Paper, a ruler",
         ["Draw the two grids and the two X shapes, and fill in the alphabet.",
          "Write your name in Pigpen and pin it on your door.",
          "Can anyone at home read it without the poster?"],
         "The grid is the key."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you worked out what stops working when a network fails, and found where encryption keeps data safe while it travels."
LESSON["warmup"] = [
    q("In the code where 1 is A and 2 is B, what does 3 stand for?", "\U0001F522", "C", ["D", "Z", "B"], "Count along the alphabet: 1 A, 2 B, 3 C."),
    q("Which letter comes 3 after D in the alphabet?", "\u27A1\uFE0F", "G", ["E", "F", "H"], "D, then E, F, G: three along."),
]

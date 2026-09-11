# -*- coding: utf-8 -*-
"""Lesson 12 - Secret Codes.

0059 Stage 3 Networks and Digital Communication: 3DC.04 ciphers are a way of
making sure that information stays secret; 3DC.05 write and decode messages
using very simple code, including converting letters to numbers (1 = a,
2 = b, etc.).
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "secret-codes",
    "title": "Secret Codes",
    "blurb": "Find out why messages are put into code before they travel, learn the code where 1 is a and 2 is b, and write and decode secret messages of your own.",
    "steps": [
        step("context", "Why keep it secret?", "\U0001F512", "Secret keeper", ["3DC.04"],
             "A message that travels across a network can be seen on the way. A cipher turns it into something only the right person can read. Tap each one.",
             explain(
                 ["A cipher is a rule for changing a message so it cannot be read by anyone who does not know the rule.", "The rule is the key. With the key you read it; without the key it is nonsense."],
                 ["A message to the bank: the amount must stay secret.", "A password on its way to a website: nobody in between may read it.",
                  "A birthday surprise for your dad, sent to your mum: your sister must not read it."],
                 ["Children think a cipher hides the message.", "It does not hide it. Anyone can see the coded message; they just cannot READ it."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F3E6", "label": "a message to the bank", "say": "A message to the bank travels across many computers. In cipher, none of them can read the amount. Only the bank, which has the key."},
                 {"pic": "\U0001F511", "label": "a password", "say": "Your password goes to the website in cipher. Anyone in between sees nonsense letters, not your password."},
                 {"pic": "\U0001F381", "label": "a birthday surprise", "say": "A surprise for your dad, sent to your mum in code. Your sister sees 8 1 20 and cannot tell it says hat."},
                 {"pic": "\U0001F4DC", "label": "Caesar's letters", "say": "Two thousand years ago, Julius Caesar wrote to his generals in a cipher, shifting every letter along the alphabet, so a captured letter told the enemy nothing."},
                 {"pic": "\U0001F510", "label": "the padlock on a web page", "say": "The little padlock on a web page means the page and you are talking in cipher. What you type cannot be read on the way."},
             ], "need": 5,
              "then": {"ask": "What does a cipher do to a message?",
                       "opts": [opt("Changes it so only someone with the key can read it", True), opt("Makes it invisible", False), opt("Deletes it", False)],
                       "why": "The coded message can be seen but not read: that is what keeps it secret."}},
             "A cipher keeps information secret."),

        step("demo", "The 1 = a code", "\U0001F522", "Code learner", ["3DC.05"],
             "The simplest cipher: every letter becomes its number in the alphabet. Press <b>Next</b>.",
             explain(
                 ["a is the first letter, so a is 1. b is 2. c is 3. All the way to z, which is 26."],
                 ["cat is c, a, t: 3, 1, 20.", "To decode 8 9, count along: 8 is h, 9 is i. Hi."],
                 ["Children forget that j is 10, not 9.", "Count on your fingers, or use the strip on the next step."],
                 ["Press Next."]),
             {"frames": [
                 {"pic": "\U0001F520", "cap": "The alphabet, a to z, is 26 letters.", "say": "The alphabet, a to z, is twenty-six letters."},
                 {"pic": "1️⃣", "cap": "Give each letter its number: a is 1, b is 2, c is 3... z is 26.", "say": "Give each letter its number. a is 1, b is 2, c is 3, all the way to z, which is 26."},
                 {"pic": "\U0001F431", "cap": "To write <b>cat</b> in code: c is 3, a is 1, t is 20. So: <b>3 1 20</b>.", "say": "To write cat in code: c is 3, a is 1, t is 20. So cat is 3, 1, 20.", "sound": "type"},
                 {"pic": "\U0001F44B", "cap": "To decode <b>8 9</b>: 8 is h, 9 is i. <b>Hi</b>.", "say": "To decode 8 9: the eighth letter is h, the ninth is i. Hi.", "sound": "ding"},
                 {"pic": "\U0001F511", "cap": "The rule - 1 is a, 2 is b - is the <b>key</b>. Anyone with the key can read it.", "say": "The rule, 1 is a, 2 is b, is the key. Anyone with the key can read the message. Anyone without it sees numbers."},
             ]},
             "1 is a, 2 is b, 26 is z."),

        step("cipher", "Write and decode", "\U0001F511", "Code writer", ["3DC.05", "3DC.04"],
             "The code strip is on screen. Decode the numbers into letters, and write the words as numbers.",
             explain(
                 ["Decode: for each number, find the letter with that number on the strip.", "Encode: for each letter, find its number."],
                 ["8 9 is h i: hi.", "cat is 3 1 20."],
                 ["Children count from the wrong end.", "Use the strip. Find the letter, read its number."],
                 ["One letter or number at a time. Look at the strip."]),
             {"rounds": [
                 {"kind": "decode", "code": [8, 9], "answer": "hi", "why": "Two numbers, two letters."},
                 {"kind": "encode", "word": "cat", "answer": [3, 1, 20], "why": "c is 3, a is 1, t is 20."},
                 {"kind": "decode", "code": [3, 15, 4, 5], "answer": "code", "why": "3 is c, 15 is o, 4 is d, 5 is e."},
                 {"kind": "encode", "word": "bee", "answer": [2, 5, 5], "why": "The same letter is always the same number: e is 5, twice."},
             ]},
             "Four messages, written and read in code."),

        step("cipher", "Longer messages", "\U0001F511", "Code master", ["3DC.05"],
             "Longer words now. The strip is still there. Take it one letter at a time.",
             explain(
                 ["A longer message is the same job, more times."],
                 ["19 5 3 18 5 20: s, e, c, r, e, t. Secret.", "dog is 4 15 7."],
                 [],
                 ["One at a time."]),
             {"rounds": [
                 {"kind": "decode", "code": [19, 5, 3, 18, 5, 20], "answer": "secret", "why": "Six numbers, six letters: secret."},
                 {"kind": "encode", "word": "dog", "answer": [4, 15, 7], "why": "d is 4, o is 15, g is 7."},
                 {"kind": "decode", "code": [11, 5, 25], "answer": "key", "why": "11 is k, 5 is e, 25 is y. The key!"},
                 {"kind": "encode", "word": "hello", "answer": [8, 5, 12, 12, 15], "why": "h 8, e 5, l 12, l 12, o 15."},
             ]},
             "You can read and write the 1 = a code."),

        step("sort", "Keep it secret, or not?", "\U0001F5C2️", "Secret sorter", ["3DC.04"],
             "Some information should travel in cipher. Some does not need to. Which is this?",
             explain(
                 ["Secret: passwords, bank details, private messages, where you live.", "Not secret: a public web page, a weather forecast, a school newsletter for everyone."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Should it travel in cipher?",
              "bins": [{"id": "secret", "label": "Keep it secret", "pic": "\U0001F512"}, {"id": "open", "label": "Does not need to be", "pic": "\U0001F513"}],
              "items": [
                  {"pic": "\U0001F511", "label": "your password", "bin": "secret", "why": "Nobody in between may read it."},
                  {"pic": "\U0001F326️", "label": "tomorrow's weather forecast", "bin": "open", "why": "It is for everyone."},
                  {"pic": "\U0001F3E6", "label": "a message to the bank", "bin": "secret", "why": "Money details stay secret."},
                  {"pic": "\U0001F4F0", "label": "the school newsletter", "bin": "open", "why": "It is meant for everyone to read."},
                  {"pic": "\U0001F3E0", "label": "your home address in a message", "bin": "secret", "why": "Where you live is private."},
                  {"pic": "\U0001F4DA", "label": "a public page about lions", "bin": "open", "why": "Anyone may read it; that is the point."},
                  {"pic": "\U0001F381", "label": "a surprise present plan", "bin": "secret", "why": "The surprise must stay a surprise."},
                  {"pic": "⚽", "label": "the football score", "bin": "open", "why": "Everyone knows it already."},
              ]},
             "Private things travel in cipher."),

        step("questions", "Check: codes", "\U0001F4DD", "Code checker", ["3DC.04", "3DC.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Why ciphers, and the 1 = a code."], [], ["Read, think, tap."]),
             {"items": [
                 q("A cipher keeps a message secret by...", "\U0001F512", "changing it so only someone with the key can read it", ["hiding the paper", "shouting it", "deleting it"], "Seen but not read."),
                 q("In the 1 = a code, what is the letter d?", "\U0001F522", "4", ["3", "5", "26"], "a 1, b 2, c 3, d 4."),
                 q("Decode 2 5 4.", "\U0001F6CF️", "bed", ["bad", "bee", "cat"], "b 2, e 5, d 4."),
             ]},
             "Why, and how."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3DC.04", "3DC.05"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about why ciphers exist and how the 1 = a code works."], [], ["Read, look, tap."]),
             {"items": [
                 q("Why is a password sent in cipher?", "\U0001F511", "so nobody in between can read it", ["to make it longer", "because computers like numbers", "it is not"], "Secret on the way."),
                 q("The rule for a cipher is called the...", "\U0001F5DD️", "key", ["lock", "server", "bug"], "With the key you can read it."),
                 q("Which is the number for the letter a?", "1️⃣", "1", ["0", "26", "10"], "a is the first letter."),
                 q("Which is the number for z?", "\U0001F51A", "26", ["25", "1", "20"], "z is the twenty-sixth letter."),
                 q("What is 'dog' in code?", "\U0001F436", "4 15 7", ["4 16 7", "3 15 7", "4 15 8"], "d 4, o 15, g 7."),
                 q("Decode 3 1 20.", "\U0001F431", "cat", ["dog", "cot", "bat"], "c 3, a 1, t 20."),
                 q("Someone sees your coded message but does not have the key. They can...", "\U0001F440", "see it but not read it", ["read it easily", "delete it", "change the key"], "Without the key it is just numbers."),
                 q("Which does NOT need to travel in cipher?", "\U0001F513", "a public web page about lions", ["your password", "a message to the bank", "your home address"], "Public things are for everyone."),
             ]},
             "That is the whole lesson finished. You know why ciphers exist and you can write and read one."),
    ],
}


LESSON["about"] = [
    "Say what a cipher is for: keeping information secret while it travels.",
    "Use the code where 1 is a, 2 is b, up to 26 is z.",
    "Write a word as numbers.",
    "Decode numbers into a word.",
]

LESSON["lecture"] = [
    part("\U0001F512", "Why ciphers",
         "A message on a network passes through many computers on its way. A cipher changes the message by a rule, so anyone who sees it on the way sees nonsense, and only the person with the rule - the key - can read it. Passwords, bank details and private messages travel this way."),
    part("\U0001F522", "1 is a",
         "The simplest cipher gives every letter its number in the alphabet: a is 1, b is 2, c is 3, up to z, which is 26. The rule is the key."),
    part("✏️", "Writing in code",
         "To write cat: c is 3, a is 1, t is 20. So cat is 3 1 20. The same letter always becomes the same number, so bee is 2 5 5."),
    part("\U0001F513", "Reading code",
         "To decode 8 9, find the eighth letter, h, and the ninth, i: hi. A code strip - the alphabet with its numbers - makes it quick. Without the key, 8 9 is just two numbers."),
]

LESSON["words"] = [
    word("cipher", "\U0001F512", "A rule for changing a message so only someone with the key can read it.",
         ["Send it in cipher.", "Caesar used a cipher."]),
    word("key", "\U0001F511", "The rule that turns a coded message back into words.",
         ["1 is a, 2 is b: that is the key.", "Without the key you cannot read it."]),
    word("encode", "✏️", "To turn a message into code.",
         ["Encode cat: 3 1 20.", "Encode it before you send it."]),
    word("decode", "\U0001F513", "To turn a coded message back into words.",
         ["Decode 8 9: hi.", "Only the key lets you decode."]),
    word("secret", "\U0001F92B", "Known only to the people who are meant to know.",
         ["A password is secret.", "A cipher keeps information secret."]),
]

LESSON["home"] = [
    home("Secret notes", "Paper, a partner",
         ["Write the alphabet with its numbers, 1 to 26, on a strip.",
          "Write a message to your partner in numbers. Can they decode it with the strip?",
          "Now hide the strip. Can they decode it without it?"],
         "With the key it is easy; without it, just numbers."),
    home("Spot the padlock", "A grown-up, a web browser",
         ["Look for the little padlock next to a web address. Some browsers show a different small picture there: tap it, and it says whether the connection is secure.",
          "Ask: what does it mean? (The page and you are talking in cipher.)",
          "Look at three different pages. Is every one of them talking in cipher?"],
         "The padlock means cipher."),
]

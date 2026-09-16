# -*- coding: utf-8 -*-
"""Lesson 11 - When Networks Fail.

0059 Stage 4 Networks and Digital Communication: 4DC.04 identify issues that
may occur as a result of a failure in a network; 4DC.05 identify where and
why encryption is used in digital systems.
"""
from _kit import explain, step, opt, q, part, word, home, cando, place, world, label_ct, tier, talk

LESSON = {
    "slug": "when-networks-fail",
    "title": "When Networks Fail",
    "blurb": "Work out what stops working when a network fails, at home, at school and in a shop, and find where encryption keeps data safe while it travels and why it is needed.",
    "steps": [
        step("context", "What a failure breaks", "\U0001F4F4", "Failure spotter", ["4DC.04"],
             "When a network fails - a cable is cut, the router dies, the wi-fi drops - everything that needed other devices stops. Tap each issue.",
             explain(
                 ["A network failure is any break in the connection: a router with no power, a cut cable, a wi-fi password changed, a server switched off."],
                 ["At school: nobody can print, nobody can open their saved work, the register cannot be sent.", "In a shop: the till cannot take cards.", "At home: no video, no calls, and the smart speaker goes quiet."],
                 ["Children think a network failure means the computers are broken.", "The computers are fine. They just cannot reach each other."],
                 ["Tap all six."]),
             {"items": [
                 {"pic": "\U0001F5A8️", "label": "nothing prints", "say": "Nothing prints. The printer is on the network. If the network is down, the laptop cannot reach it."},
                 {"pic": "\U0001F4C2", "label": "saved work cannot be opened", "say": "Saved work cannot be opened. Your story is on the school server, and the server is on the other side of the break."},
                 {"pic": "\U0001F4B3", "label": "the till cannot take cards", "say": "The till in a shop cannot take cards. A card payment asks the bank's server over the network. No network, cash only."},
                 {"pic": "\U0001F4DE", "label": "calls drop", "say": "Video calls drop, and messages sit unsent. The other person is on another network, and the road between you is closed."},
                 {"pic": "\U0001F3AC", "label": "videos stop", "say": "Videos stop. The film is on a server far away, arriving piece by piece. The pieces stop coming."},
                 {"pic": "\U0001F3E5", "label": "a hospital cannot see records", "say": "A hospital cannot see patient records that live on its server. That is why hospitals have a second network and a paper plan."},
             ], "need": 6,
              "then": {"ask": "The wi-fi at school fails. Your laptop still turns on and runs Paint. Why?",
                       "opts": [opt("Paint runs on the laptop alone; only things that need other devices stop", True), opt("Paint has its own wi-fi", False), opt("The laptop is not really on", False)],
                       "why": "A failure breaks the links between devices, not the devices."}},
             "A network failure stops everything that needs another device."),

        step("offline", "Switch the network off", "\U0001F4F4", "Failure tester", ["4DC.04"],
             "The router has failed. Predict what still works, then try each app.",
             explain(
                 ["Anything that needs a server or another device will fail. Anything on this device alone carries on."],
                 ["Print a story: fails, the printer is on the network.", "Write a story: works, it is on this laptop.", "Open the class shared folder: fails, it is on the server."],
                 [],
                 ["Predict, try, see."]),
             {"apps": [
                 {"id": "print", "label": "Print your story", "pic": "\U0001F5A8️", "needs": True, "why": "The printer is on the network."},
                 {"id": "write", "label": "Write a story", "pic": "✏️", "needs": False, "why": "Writing happens on this device."},
                 {"id": "shared", "label": "Open the class shared folder", "pic": "\U0001F4C2", "needs": True, "why": "The shared folder lives on the server."},
                 {"id": "calc", "label": "Use the calculator", "pic": "\U0001F9EE", "needs": False, "why": "The calculator is a program on this device."},
                 {"id": "video", "label": "Watch a video online", "pic": "\U0001F3AC", "needs": True, "why": "The video comes from a server far away."},
                 {"id": "photo", "label": "Look at a photo saved here", "pic": "\U0001F5BC️", "needs": False, "why": "The photo is on this device."},
                 {"id": "card", "label": "Pay by card at the school shop", "pic": "\U0001F4B3", "needs": True, "why": "The till asks the bank over the network."},
             ]},
             "You can tell what a failure breaks and what it leaves alone."),

        step("sort", "Caused by the network failing?", "\U0001F5C2️", "Cause sorter", ["4DC.04"],
             "Something has gone wrong. Could a network failure be the cause, or is it something else?",
             explain(
                 ["Network failure: two devices cannot reach each other.", "Something else: a flat battery, a spilt drink, a typing mistake."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "A network failure, or something else?",
              "bins": [{"id": "net", "label": "Network failure", "pic": "\U0001F4F4"}, {"id": "other", "label": "Something else", "pic": "\U0001F527"}],
              "items": [
                  {"pic": "\U0001F5A8️", "label": "the printer says 'not found'", "bin": "net", "why": "The laptop cannot reach it."},
                  {"pic": "\U0001F50B", "label": "the tablet will not turn on", "bin": "other", "why": "A flat battery."},
                  {"pic": "\U0001F4C2", "label": "the shared folder will not open", "bin": "net", "why": "The server is out of reach."},
                  {"pic": "☕", "label": "the keyboard stopped working after a spill", "bin": "other", "why": "A wet keyboard."},
                  {"pic": "\U0001F4DE", "label": "the video call froze", "bin": "net", "why": "The link dropped."},
                  {"pic": "\U0001F524", "label": "the word is spelt wrong on the page", "bin": "other", "why": "A typing mistake."},
                  {"pic": "\U0001F4B3", "label": "the shop can only take cash today", "bin": "net", "why": "The till cannot reach the bank."},
                  {"pic": "\U0001F5B1️", "label": "the mouse pointer will not move", "bin": "other", "why": "A mouse fault, not a network one."},
              ]},
             "Two devices that cannot reach each other: a network failure."),

        step("context", "Where encryption is used", "\U0001F512", "Encryption finder", ["4DC.05"],
             "<b>Encryption</b> scrambles data so only someone with the key can read it. It is used wherever data must stay secret while it travels or is stored. Tap each place.",
             explain(
                 ["Data on a network passes through many devices on its way. Encryption means anyone who grabs it in the middle sees only scrambled letters."],
                 ["Your password when you log in.", "A card number at the shop.", "A message to a friend.", "The padlock in the browser: the page is encrypted."],
                 ["Children think encryption hides that a message was sent.", "It hides what the message SAYS. Someone may see that it went; they cannot read it."],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F511", "label": "logging in", "say": "Logging in. Your password is encrypted before it leaves your device, so nobody on the way can read it."},
                 {"pic": "\U0001F4B3", "label": "paying by card", "say": "Paying by card, in a shop or online. The card number is encrypted, so a thief who grabs it sees scrambled letters."},
                 {"pic": "\U0001F4AC", "label": "messaging", "say": "Messaging apps encrypt each message so only the phone it was sent to can unscramble it."},
                 {"pic": "\U0001F512", "label": "the padlock in the browser", "say": "The padlock beside a web address. It means everything between you and that site is encrypted."},
                 {"pic": "\U0001F4F6", "label": "wi-fi", "say": "Wi-fi. The password on your wi-fi is what encrypts the radio, so a neighbour cannot read what travels through the air."},
             ], "need": 5,
              "then": {"ask": "Why encrypt a card number when it is sent to the bank?",
                       "opts": [opt("So anyone who grabs it on the way sees only scrambled data", True), opt("So it travels faster", False), opt("So the shop cannot see the price", False)],
                       "why": "Data passes through many devices. Encryption keeps it unreadable to all but the right one."}},
             "Encryption: scrambled on the way, readable only with the key."),

        step("sort", "Encrypt it, or no need?", "\U0001F5C2️", "Encryption sorter", ["4DC.05"],
             "Some data must be encrypted; some is public and needs no protecting. Which is this?",
             explain(
                 ["Encrypt: passwords, card numbers, private messages, medical records, anything that would do harm if a stranger read it.", "No need: things anyone may read, like a public web page or a bus timetable."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Encrypt it, or no need?",
              "bins": [{"id": "enc", "label": "Encrypt it", "pic": "\U0001F512"}, {"id": "open", "label": "No need", "pic": "\U0001F513"}],
              "items": [
                  {"pic": "\U0001F511", "label": "your password", "bin": "enc", "why": "A stranger with it can be you."},
                  {"pic": "\U0001F35D", "label": "the school lunch menu on the school website", "bin": "open", "why": "Anyone may read it."},
                  {"pic": "\U0001F4B3", "label": "a card number", "bin": "enc", "why": "Money."},
                  {"pic": "\U0001F327️", "label": "the weather forecast", "bin": "open", "why": "Public."},
                  {"pic": "\U0001F4AC", "label": "a private message to a friend", "bin": "enc", "why": "Private means private."},
                  {"pic": "\U0001F68C", "label": "the bus timetable", "bin": "open", "why": "Printed at every stop."},
                  {"pic": "\U0001F3E5", "label": "a patient's medical record", "bin": "enc", "why": "Private and important."},
                  {"pic": "\U0001F4DA", "label": "the library opening times", "bin": "open", "why": "On the door already."},
              ]},
             "Private data is encrypted; public data need not be."),

        step("questions", "Check: failures and encryption", "\U0001F4DD", "Failure checker", ["4DC.04", "4DC.05"],
             "Three quick questions.",
             explain(["Nothing new here."], ["What a failure breaks, where encryption is used."], [], ["Read, think, tap."]),
             {"items": [
                 q("The router at school fails. Which still works?", "\U0001F4F4", "writing a story on the laptop", ["printing it", "opening the shared folder", "a video call"], "It needs no other device."),
                 q("Encryption makes data...", "\U0001F512", "unreadable to anyone without the key", ["invisible", "faster", "bigger"], "Scrambled, not hidden."),
                 q("Which needs encrypting?", "\U0001F4B3", "a card number", ["the weather", "a bus timetable", "the lunch menu"], "Money must stay secret."),
             ]},
             "Broken links, scrambled data."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4DC.04", "4DC.05"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Network failures and encryption."], [], ["Read, look, tap."]),
             {"items": [
                 q("A network failure means...", "\U0001F4F4", "devices cannot reach each other", ["every computer is broken", "the power is off in the whole town", "the screen is cracked"], "The links are broken, not the devices."),
                 q("Why can the shop only take cash when the network fails?", "\U0001F4B3", "the till cannot ask the bank's server", ["the coins are on the network", "the till is broken", "cash is faster"], "A card payment travels over the network."),
                 q("Which is caused by a network failure?", "\U0001F5A8️", "the printer cannot be found", ["a flat battery", "a spilt drink on the keyboard", "a spelling mistake"], "The laptop cannot reach the printer."),
                 q("Why does a hospital keep a paper plan?", "\U0001F3E5", "so it can work when its network fails", ["paper is faster", "computers are not allowed", "for decoration"], "A failure must not stop care."),
                 q("The padlock beside a web address means...", "\U0001F512", "the connection to that site is encrypted", ["the site is locked shut", "the page costs money", "the wi-fi is off"], "Everything between you and the site is scrambled."),
                 q("Who can read an encrypted message?", "\U0001F511", "only someone with the key", ["everyone on the network", "nobody at all", "the router"], "The key unscrambles it."),
                 q("What does the wi-fi password do besides letting you join?", "\U0001F4F6", "it encrypts what travels through the air", ["it speeds up the router", "it turns on the lights", "nothing"], "A neighbour in range cannot read your traffic."),
             ]},
             "That is the whole lesson finished. You know what a failure breaks and where encryption keeps data safe."),
    ],
}


LESSON["about"] = [
    "List the issues a network failure causes at home, at school and in a shop.",
    "Predict what still works when the network is down.",
    "Tell a network failure from another kind of fault.",
    "Say where encryption is used and why.",
]

LESSON["lecture"] = [
    part("\U0001F4F4", "A network failure",
         "A network fails when a link breaks: a router with no power, a cut cable, dropped wi-fi, a server switched off. The devices are fine. They just cannot reach each other, so everything that needed another device stops."),
    part("\U0001F5A8️", "What stops",
         "At school nothing prints, saved work on the server cannot be opened, the register cannot be sent. In a shop the till cannot ask the bank, so it is cash only. At home videos stop, calls drop, and the smart speaker goes quiet. Writing a story or using the calculator carries on, because they need nobody else."),
    part("\U0001F512", "Encryption",
         "Encryption scrambles data so that only someone with the key can read it. Data on a network passes through many devices on its way, and encryption means anyone who grabs it in the middle sees only nonsense."),
    part("\U0001F511", "Where and why",
         "Your password when you log in, a card number when you pay, a private message, a medical record, the padlock in the browser, the password on the wi-fi. Anything that would do harm if a stranger read it is encrypted. A bus timetable is not, because anyone may read it."),
]

LESSON["words"] = [
    word("network failure", "\U0001F4F4", "A break in a network that stops devices reaching each other.",
         ["A cut cable is a network failure.", "The printer vanished in the network failure."]),
    word("server", "\U0001F5C4️", "A computer that stores things for other devices; out of reach when the network fails.",
         ["The shared folder is on the server.", "No network, no server."]),
    word("encryption", "\U0001F512", "Scrambling data so only someone with the key can read it.",
         ["Encryption protects your password.", "The message uses encryption."]),
    word("key", "\U0001F511", "The secret that unscrambles encrypted data.",
         ["Only the right phone has the key.", "Without the key it is nonsense."]),
    word("padlock", "\U0001F512", "The browser sign that a connection is encrypted.",
         ["Look for the padlock before you type a password.", "The padlock means encrypted."]),
]

LESSON["home"] = [
    home("The router test", "A grown-up, the router",
         ["With a grown-up, switch the router off for one minute.",
          "Try five things: a video, a saved photo, a game, a message, the calculator. Which stop?",
          "Switch it back on. Which come back by themselves?"],
         "Only the things that need other devices stop."),
    home("Padlock hunt", "A browser, a grown-up",
         ["Open five websites with a grown-up. Look beside each address for the padlock. Some browsers show a different small picture there: tap it, and it says whether the connection is secure.",
          "Which sites ask for a password or a card number? Is the connection secure on all of them?",
          "Never type a password on a page that says Not secure."],
         "The padlock means encrypted."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you saw clients ask and servers serve, told the World Wide Web from the internet it runs on, and weighed wi-fi against an ethernet cable."
LESSON["warmup"] = [
    q("The card machine in a shop loses its network. What might the shop have to do?", "\U0001F4B3", "take cash until the network is back", ["close for ever", "give everything away", "nothing: cards still work"], "Card payments need the network; cash does not."),
    q("Why do you whisper a secret instead of shouting it across the playground?", "\U0001F92B", "so only the person it is for can hear it", ["so everyone hears it", "whispering is louder", "secrets must be shouted"], "Keeping a message to the person it is for is what encryption does for data."),
]

# ---- Cambridge Learner's Book 4, 2026-09-16 --------------------------------
# What the book carries that this lesson did not: the "What can you do?"
# self-check every unit closes with, the "Did you know?" box and the real
# world behind it, and the tiered practice ("Go further", "Challenge
# yourself!"). Everything here is position-safe: the self-check lives on the
# sticker shelf, the tiers hang off the check step and score nothing, and
# Computing world is a step that already existed and said it was empty.

label_ct(LESSON, "Where encryption is used", "Evaluation")

LESSON["lecture"] = LESSON["lecture"] + [
    part("\U0001F6E1\ufe0f", "Why anyone bothers to encrypt",
         "Cybercrime is crime done through computers and networks. Stealing data. Locking "
         "somebody's files and demanding money. Pretending to be a bank to get a password. "
         "Encryption is the main defence. A thief takes a laptop full of encrypted records. They "
         "have taken a brick. The data is there and unreadable. That is why hospitals, banks and "
         "schools encrypt anything about a person."),
]

LESSON["words"] = LESSON["words"] + [
    word("cybercrime", "\U0001F6E1\ufe0f", "A crime done through computers and networks.",
         ["Stealing data is cybercrime.", "Encryption is a defence against cybercrime."]),
]

LESSON["cando"] = [
    cando("I can identify what goes wrong when a network fails.", "4DC.04"),
    cando("I can say where encryption is used and why.", "4DC.05"),
    cando("I know what cybercrime is and how encryption defends against it.", "4DC.05"),
]

LESSON["world"] = world(
    "In 2017 a single piece of malware spread across the world in a day. It stopped "
    "hospitals, factories and railways. Nothing was stolen. The damage was simply that "
    "the networks stopped working, which shows how much depends on them.",
    [place("\U0001F3E5", "A hospital",
           "When the network fails, records cannot be read and appointments cannot be seen. Everything waits."),
     place("\u26FD", "A petrol station",
           "No network means no card payments. The fuel is still there and nobody can buy it."),
     place("\U0001F6EB", "An airport",
           "Check-in, bag tags and boarding all run on the network. One failure and the queue reaches the car park.")],
    "Ask a grown-up what they could not do today if the internet stopped. Then ask what would still be fine.")

tier(LESSON,
     support=[
         q("Encryption keeps a message...", "\U0001F510", "secret from anyone without the key", ["shorter"],
           "Encrypted data is unreadable to anyone who does not have the key."),
         q("The school network fails. What stops working?", "\u26A0\ufe0f",
           "printing, shared files and the web", ["the lights"],
           "Anything that needs another computer stops. Things already on your own device carry on."),
     ],
     extension=[
         q("A thief steals a laptop full of ENCRYPTED patient records. How bad is it?", "\U0001F510",
           "the laptop is lost but the records cannot be read",
           ["the records are lost for ever", "the records are readable straight away", "encryption makes no difference"],
           "That is exactly what encryption is for. Without the key the file is noise."),
         q("Why encrypt a message that is only going across your own school?", "\U0001F914",
           "you cannot be sure who else is listening on the way",
           ["it makes it faster", "the school says so", "there is no reason to"],
           "A network is shared. Encryption assumes somebody might be listening, which is cheaper than finding out they were."),
     ])

LESSON["talk"] = talk(
    "In pairs: what could you not do today if the school network stopped? What would still "
    "be fine?",
    "Ask why a stolen encrypted laptop is a smaller problem than a stolen unencrypted one."
)

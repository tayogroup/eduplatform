# -*- coding: utf-8 -*-
"""Lesson 9 - Connected Devices.

0059 Stage 2 Networks and Digital Communication, all five: 2DC.01 the range
of devices that can connect to a network, including the internet; 2DC.02 two
devices working together achieve what neither can alone; 2DC.03 wired and
wireless networks; 2DC.04 recognising when a network is and is not
available; 2DC.05 network-connected devices share information, and there are
risks.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "connected-devices",
    "title": "Connected Devices",
    "blurb": "See which devices can join a network, wire up a home network and send things across it so two devices do together what neither could alone, tell a wired network from a wireless one, spot when the network is not there, and learn what sharing means.",
    "steps": [
        step("explore", "Devices that can join a network", "\U0001F517", "Device spotter", ["2DC.01"],
             "Lots of devices can connect to a network, and through it to the internet. Tap each one.",
             explain(
                 ["A network is not only computers.", "Phones, printers, speakers, consoles, TVs and watches can all join one."],
                 ["A smart speaker joins the network to fetch music.", "A games console joins it to play with a friend in another house.",
                  "A smart TV joins it to stream a film.", "A wooden chair cannot join anything: it has no computer inside."],
                 ["Children think only things with keyboards are on the network.", "If it has a computer inside and can send or receive, it can join."],
                 ["Tap all eight."]),
             {"items": [
                 {"pic": "\U0001F4BB", "label": "laptop", "say": "A laptop joins the network to browse the web and send email."},
                 {"pic": "\U0001F4F1", "label": "tablet", "say": "A tablet joins the network for videos, games and messages."},
                 {"pic": "\U0001F4F2", "label": "phone", "say": "A phone joins the network at home, and the phone mast's network everywhere else."},
                 {"pic": "\U0001F5A8️", "label": "printer", "say": "A printer joins the network so any device in the house can print."},
                 {"pic": "\U0001F50A", "label": "smart speaker", "say": "A smart speaker joins the network to fetch music and answer questions."},
                 {"pic": "\U0001F3AE", "label": "games console", "say": "A games console joins the network to play with a friend in another house."},
                 {"pic": "\U0001F4FA", "label": "smart TV", "say": "A smart TV joins the network to stream films over the internet."},
                 {"pic": "⌚", "label": "smart watch", "say": "A smart watch joins the network through a phone, to show messages on your wrist."},
             ], "need": 8,
              "then": {"ask": "Which of these CANNOT join a network?",
                       "opts": [opt("A wooden chair", True), opt("A games console", False), opt("A smart speaker", False)],
                       "why": "A chair has no computer inside. Everything else here does."}},
             "Phones, printers, speakers, consoles, TVs and watches all join networks."),

        step("network", "Build the home network, then work together", "\U0001F4E1", "Home networker", ["2DC.01", "2DC.02", "2DC.03"],
             "Connect every device to the router. Then send things between them and see two devices do what one cannot.",
             explain(
                 ["Every device joins through the router, with a wire or without.",
                  "Once they are joined, two devices can do together what neither can do alone."],
                 ["The phone takes a photo but cannot print. The printer prints but cannot take a photo. Joined, they do both.",
                  "The phone holds a song but its speaker is tiny. The smart speaker is loud but holds no songs. Joined, the music fills the room."],
                 [],
                 ["Connect all six, then send the three things."]),
             {"hub": "router",
              "devices": [
                  {"id": "router", "pic": "\U0001F4E1", "label": "router", "x": 160, "y": 110},
                  {"id": "laptop", "pic": "\U0001F4BB", "label": "laptop", "wired": True, "x": 60, "y": 50},
                  {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "wired": True, "x": 260, "y": 50},
                  {"id": "phone", "pic": "\U0001F4F2", "label": "phone", "wired": False, "x": 60, "y": 170},
                  {"id": "speaker", "pic": "\U0001F50A", "label": "smart speaker", "wired": False, "x": 260, "y": 170},
                  {"id": "console", "pic": "\U0001F3AE", "label": "console", "wired": True, "x": 160, "y": 30},
                  {"id": "watch", "pic": "⌚", "label": "smart watch", "wired": False, "x": 160, "y": 190},
              ],
              "send": [
                  {"what": "a photo", "pic": "\U0001F5BC️", "from": "phone", "to": "printer", "say": "The phone took the photo; the printer printed it. Neither could do both on its own. Together they did."},
                  {"what": "a song", "pic": "\U0001F3B5", "from": "phone", "to": "speaker", "say": "The phone held the song; the smart speaker played it loud enough for the room. Two devices, one job."},
                  {"what": "a message", "pic": "✉️", "from": "laptop", "to": "watch", "say": "The laptop sent the message; the watch showed it on a wrist. Working together across the network."},
              ]},
             "Joined together, two devices do what neither can alone."),

        step("sort", "Working together, or alone?", "\U0001F5C2️", "Teamwork spotter", ["2DC.02"],
             "Is this two devices working together over a network, or one device doing a job by itself?",
             explain(
                 ["Two devices working together means each does the part the other cannot."],
                 ["A phone takes the photo, a printer prints it: together.", "A tablet draws a picture: alone.", "A console sends the game to the big TV: together."],
                 [],
                 ["Ask: is a second device doing part of the job? Then tap."]),
             {"ask": "Two devices working together, or one alone?",
              "bins": [{"id": "together", "label": "Two devices together", "pic": "\U0001F91D"}, {"id": "alone", "label": "One device alone", "pic": "1️⃣"}],
              "items": [
                  {"pic": "\U0001F4F2\U0001F5A8️", "label": "a phone takes a photo and a printer prints it", "bin": "together", "why": "Each does what the other cannot."},
                  {"pic": "\U0001F4BB\U0001F50A", "label": "a laptop plays a song through a speaker across the room", "bin": "together", "why": "The laptop holds the song; the speaker fills the room."},
                  {"pic": "\U0001F4F1", "label": "a tablet draws a picture", "bin": "alone", "why": "One device does the whole job."},
                  {"pic": "\U0001F3AE\U0001F4FA", "label": "a console sends the game to the big TV", "bin": "together", "why": "The console runs the game; the TV shows it big."},
                  {"pic": "\U0001F9EE", "label": "a calculator adds two numbers", "bin": "alone", "why": "No second device needed."},
                  {"pic": "\U0001F4F2✉️", "label": "a phone sends a message to Grandma's phone", "bin": "together", "why": "Two phones, across the network."},
                  {"pic": "⌚", "label": "a watch shows the time", "bin": "alone", "why": "The watch does that by itself."},
                  {"pic": "\U0001F4F7\U0001F4BB", "label": "a camera sends a picture to the laptop to be edited", "bin": "together", "why": "The camera takes it; the laptop edits it."},
              ]},
             "Together means each device does the part the other cannot."),

        step("sort", "Wired network, or wireless network?", "\U0001F5C2️", "Network typer", ["2DC.03"],
             "A whole network can be wired, with cables everywhere, or wireless, through the air. Which is this?",
             explain(
                 ["A wired network joins its devices with cables.", "A wireless network joins them through the air, with wi-fi.", "Many places have both."],
                 ["An office with a cable from every computer to the wall: wired.", "A home where the tablets use wi-fi: wireless.", "Phones on a train: wireless."],
                 [],
                 ["Look for cables, then tap."]),
             {"ask": "Wired network, or wireless network?",
              "bins": [{"id": "wired", "label": "Wired network", "pic": "\U0001F50C"}, {"id": "wireless", "label": "Wireless network", "pic": "\U0001F4F6"}],
              "items": [
                  {"pic": "\U0001F3E2", "label": "an office where every computer has a cable to the wall", "bin": "wired", "why": "Cables to every computer: a wired network."},
                  {"pic": "\U0001F3E0", "label": "a home where the tablets use wi-fi", "bin": "wireless", "why": "Wi-fi through the air: wireless."},
                  {"pic": "\U0001F3EB", "label": "a school computer room with cables under the desks", "bin": "wired", "why": "Cables under the desks: wired."},
                  {"pic": "\U0001F686", "label": "phones on a train", "bin": "wireless", "why": "No cables on a train. Wireless."},
                  {"pic": "\U0001F6D2", "label": "a shop till plugged into the router", "bin": "wired", "why": "Plugged in with a cable: wired."},
                  {"pic": "\u2615", "label": "a café where customers' phones use the wi-fi", "bin": "wireless", "why": "The phones join through the air, with no cables: wireless."},
                  {"pic": "\U0001F3E5", "label": "a hospital whose computers are joined by cables in the walls", "bin": "wired", "why": "Cables in the walls join them: wired."},
                  {"pic": "\U0001F4DA", "label": "a library where visitors' laptops use the wi-fi", "bin": "wireless", "why": "No cables to the laptops: wireless."},
              ]},
             "Cables make a wired network. Wi-fi makes a wireless one."),

        step("sort", "Is the network there?", "\U0001F4F6", "Signal reader", ["2DC.04"],
             "A device shows you whether the network is available. What does this sign mean?",
             explain(
                 ["Devices tell you when the network is there and when it is not.", "Bars on the phone, a green light on the router, a page that loads: available.",
                  "No bars, aeroplane mode, a spinning circle that never stops, router lights off: not available."],
                 [],
                 [],
                 ["Read the sign, then tap."]),
             {"ask": "Network available, or not?",
              "bins": [{"id": "yes", "label": "Available", "pic": "✅"}, {"id": "no", "label": "Not available", "pic": "\U0001F4F4"}],
              "items": [
                  {"pic": "\U0001F4F6", "label": "four bars on the phone", "bin": "yes", "why": "Bars mean the network is there."},
                  {"pic": "\U0001F4F5", "label": "no bars and 'No service'", "bin": "no", "why": "No bars: no network."},
                  {"pic": "✈️", "label": "aeroplane mode is switched on", "bin": "no", "why": "Aeroplane mode switches the network off on purpose."},
                  {"pic": "\U0001F50C", "label": "the cable is in and the router's light is green", "bin": "yes", "why": "A green light means connected."},
                  {"pic": "⏳", "label": "the page keeps spinning and never loads", "bin": "no", "why": "A spinner that never stops usually means the network is not reaching the device."},
                  {"pic": "\U0001F4F6", "label": "one bar on the phone", "bin": "yes", "why": "One bar is weak, but the network is there."},
                  {"pic": "⚫", "label": "the router's lights are all off", "bin": "no", "why": "A router with no lights is off, and so is the network."},
                  {"pic": "\U0001F3AC", "label": "the video plays smoothly", "bin": "yes", "why": "A video that plays is a network that works."},
              ]},
             "Bars, lights and loading pages tell you whether the network is there."),

        step("offline", "When the network is not there", "\U0001F4F4", "Offline tester", ["2DC.04"],
             "Switch the network OFF, predict what still works, and try each app.",
             explain(
                 ["When the network is not available, the things that need other devices stop, and the rest carry on."],
                 ["Looking up facts about giraffes, getting a new app, sending your drawing to your teacher: they need the network.", "The calculator, an alarm, a book saved on the tablet: they work without it."],
                 [],
                 ["Switch it off, predict, try it, then switch it back on."]),
             {"apps": [
                 {"id": "giraffe", "label": "Look up facts about giraffes", "pic": "\U0001F992", "needs": True, "why": "The facts are kept on a computer far away. No network, no facts."},
                 {"id": "calc", "label": "Use the calculator", "pic": "\U0001F9EE", "needs": False, "why": "The calculator is part of this tablet. It needs no other computer."},
                 {"id": "send", "label": "Send your drawing to your teacher", "pic": "\U0001F4E4", "needs": True, "why": "The drawing has to travel across the network to your teacher's computer."},
                 {"id": "alarm", "label": "Set an alarm for the morning", "pic": "\u23F0", "needs": False, "why": "The clock is inside the tablet, so the alarm still rings."},
                 {"id": "newapp", "label": "Get a new app from the app store", "pic": "\U0001F4F2", "needs": True, "why": "The new app comes from a computer far away, across the network."},
                 {"id": "book", "label": "Read a book saved on the tablet", "pic": "\U0001F4D6", "needs": False, "why": "The book is saved on this tablet already."},
             ]},
             "You can tell when the network is not there, and what still works."),

        step("context", "Sharing, and the risks", "\U0001F6E1️", "Careful sharer", ["2DC.05"],
             "Devices on a network share information with each other. That is useful, and it has risks. Tap each one.",
             explain(
                 ["When your device is on a network, what you send can be seen by the devices it goes to.",
                  "Sometimes that is more devices than you think."],
                 ["A photo sent to the family group is seen by the family. Good.", "A message to the class group is seen by the whole class, not just your friend.",
                  "Something posted where anyone can see it can be seen by strangers.", "A password shared with a friend is no longer secret."],
                 ["Children think a message goes only to the person they are thinking of.", "It goes to every device in the group, and stays there."],
                 ["Tap each one and ask: who can see this?"]),
             {"items": [
                 {"pic": "\U0001F46A", "label": "a photo to the family group", "say": "A photo sent to the family group. Everyone in the family sees it. That is what you wanted."},
                 {"pic": "\U0001F3EB", "label": "a message to the class group", "say": "A message to the class group goes to the whole class, not just your friend. Think before you send."},
                 {"pic": "\U0001F30D", "label": "something posted for anyone to see", "say": "Something posted where anyone can see it can be seen by strangers, anywhere in the world."},
                 {"pic": "\U0001F511", "label": "a password shared with a friend", "say": "A password shared with a friend is no longer a secret. Passwords are for you and a grown-up only."},
                 {"pic": "\U0001F4CD", "label": "an app that asks where you are", "say": "Some apps ask to share where you are. That is information about you. Ask a grown-up before saying yes."},
             ], "need": 5,
              "then": {"ask": "Before you share something on a network, what should you do?",
                       "opts": [opt("Think who will see it, and ask a grown-up if you are not sure", True), opt("Send it to everyone", False), opt("Share your password with it", False)],
                       "why": "Sharing is useful and it has risks. Who will see it is the question."}},
             "Sharing is useful. Knowing who will see it keeps it safe."),

        step("sort", "Share it, or keep it private?", "\U0001F5C2️", "Privacy sorter", ["2DC.05"],
             "Some things are fine to share on a network. Some should stay private. Which is this?",
             explain(
                 ["Fine to share: a drawing with your family, a photo of your cat with Grandma, a message to your teacher.",
                  "Keep private: your password, your home address with strangers, your full name and school on a public page."],
                 [],
                 [],
                 ["Ask: who would see it, and should they? Then tap."]),
             {"ask": "Share it, or keep it private?",
              "bins": [{"id": "share", "label": "Fine to share", "pic": "\U0001F4E4"}, {"id": "private", "label": "Keep private", "pic": "\U0001F512"}],
              "items": [
                  {"pic": "\U0001F3A8", "label": "a drawing you made, with your family", "bin": "share", "why": "Your family, your drawing. Fine."},
                  {"pic": "\U0001F3E0", "label": "your home address, with a stranger online", "bin": "private", "why": "Where you live stays private from strangers."},
                  {"pic": "\U0001F511", "label": "your password, with anyone at all", "bin": "private", "why": "A password is for you and a grown-up only."},
                  {"pic": "\U0001F431", "label": "a photo of your cat, with Grandma", "bin": "share", "why": "Grandma and the cat. Fine."},
                  {"pic": "\U0001F4DB", "label": "your full name and your school, on a page anyone can see", "bin": "private", "why": "Strangers do not need to know who you are or where you go."},
                  {"pic": "\U0001F469‍\U0001F3EB", "label": "a message to your teacher about homework", "bin": "share", "why": "Your teacher, about school. Fine."},
                  {"pic": "\U0001F4CD", "label": "where you are right now, with an app you do not know", "bin": "private", "why": "Where you are is information about you. Ask a grown-up."},
                  {"pic": "\U0001F382", "label": "a birthday card to your cousin", "bin": "share", "why": "A card to family. Fine."},
              ]},
             "Family and teachers: share. Passwords, addresses and where you are: private."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["2DC.01", "2DC.02", "2DC.03", "2DC.04", "2DC.05"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the devices, working together, wired and wireless, the signs, and sharing."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Which of these can join a network?", "\U0001F517", "a smart speaker", ["a wooden chair", "a ball", "a candle"], "A smart speaker has a computer inside and joins the network for music."),
                 q("A phone takes a photo and a printer prints it. What is that?", "\U0001F91D", "two devices working together", ["one device alone", "a bug", "a wired network"], "Each did the part the other could not."),
                 q("An office with cables from every computer to the wall is a...", "\U0001F50C", "wired network", ["wireless network", "broken network", "not a network"], "Cables make it wired."),
                 q("Phones on a train are on a...", "\U0001F4F6", "wireless network", ["wired network", "cable", "chair"], "No cables on a train."),
                 q("The page keeps spinning and never loads. What is most likely?", "⏳", "the network is not available", ["the tablet is full", "the page is shy", "you need a bigger screen"], "A spinner that never stops usually means no network is reaching the device."),
                 q("Four bars on the phone means...", "\U0001F4F6", "the network is available", ["the phone is broken", "aeroplane mode", "no network"], "Bars show the network is there."),
                 q("You send a message to the class group. Who can see it?", "\U0001F3EB", "everyone in the class group", ["only your best friend", "nobody", "only the teacher"], "A group message goes to every device in the group."),
                 q("Which should you keep private?", "\U0001F512", "your password", ["a drawing for your family", "a photo of your cat for Grandma", "a message to your teacher"], "A password is for you and a grown-up only."),
             ]},
             "That is the whole lesson finished. You know networks, and you know what sharing means."),
    ],
}


LESSON["about"] = [
    "Name devices that can join a network and the internet.",
    "Say how two devices working together do what neither can alone.",
    "Tell a wired network from a wireless one.",
    "Recognise when a network is available and when it is not, and say what sharing means and where the risks are.",
]

LESSON["lecture"] = [
    part("\U0001F517", "Who joins the network",
         "Not just computers. Phones, tablets, printers, smart speakers, games consoles, smart TVs and smart watches all join the network, and through the router, the internet. A chair cannot: it has no computer inside."),
    part("\U0001F91D", "Working together",
         "A phone takes a photo but cannot print. A printer prints but cannot take a photo. Joined by the network, they do both. Two devices working together achieve what neither can alone."),
    part("\U0001F50C", "Wired and wireless",
         "A wired network joins its devices with cables: an office, a school computer room. A wireless network joins them through the air: tablets at home, phones on a train. Many places have both."),
    part("\U0001F4F6", "Is it there?",
         "Devices tell you. Bars on the phone and a green light on the router mean the network is available. No bars, aeroplane mode or a dark router mean it is not, and a spinner that never stops usually does too. Then the things that need other devices stop, and the rest carry on."),
    part("\U0001F6E1️", "Sharing",
         "On a network, what you send is seen by the devices it goes to, and sometimes that is more than you think. A message to the class group goes to the whole class. Passwords, your address and where you are stay private. When you are not sure, ask a grown-up."),
]

LESSON["words"] = [
    word("network", "\U0001F517", "Devices connected together so they can share things.",
         ["The printer is on the network.", "Our home network has seven devices."]),
    word("connect", "\U0001F91D", "To join one device to another.",
         ["Connect the console to the router.", "The watch connects through the phone."]),
    word("wired", "\U0001F50C", "Joined with a cable.",
         ["A wired network uses cables.", "The printer is wired."]),
    word("wireless", "\U0001F4F6", "Joined through the air, with no cable.",
         ["A wireless network uses wi-fi.", "Phones are wireless."]),
    word("available", "✅", "There, and working.",
         ["The network is available: four bars.", "No network is available on the plane."]),
    word("share", "\U0001F4E4", "To send something so other devices can see it.",
         ["Share the photo with Grandma.", "Think before you share."]),
    word("private", "\U0001F512", "Kept to yourself, not shared.",
         ["Keep your password private.", "Your address is private."]),
    word("risk", "⚠️", "Something that could go wrong.",
         ["Sharing has risks.", "A stranger seeing your photo is a risk."]),
]

LESSON["home"] = [
    home("Count the network", "A grown-up, a walk round the house",
         ["Find every device that joins your home network: phones, tablets, TV, speaker, printer, console.",
          "For each one, say wired or wireless.",
          "Count them."],
         "More devices join the network than you expected."),
    home("Better together", "Two devices at home, with a grown-up",
         ["Take a photo on a phone and print it, or play a phone's song through a speaker.",
          "Say which device did which part.",
          "Could either have done the whole job alone?"],
         "Two devices, one job."),
    home("Who would see it?", "A grown-up",
         ["Think of three things you might send: a drawing, a message, a photo.",
          "For each one, say who it goes to and who could see it.",
          "Which would you keep private?"],
         "A group message goes to the whole group."),
]

# Carried by the overview: a line from the lesson before, and a warm-up that is never marked.
LESSON["recap"] = "Last time you turned a table into a block graph and used data to solve the crowded playground problem."
LESSON["warmup"] = [
    q("Which of these can connect to the internet?", "\U0001F4F6", "a tablet", ["a pencil", "a cushion", "a spoon"], "A tablet has a computer inside, so it can connect."),
    q("A tablet shows no wi-fi bars. What does that usually mean?", "\U0001F4F5", "it is not connected to a network", ["it is fully charged", "it is very happy", "it is switched off"], "No bars usually means no network is reaching it."),
]

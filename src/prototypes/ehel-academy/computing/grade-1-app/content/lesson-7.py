# -*- coding: utf-8 -*-
"""Lesson 7 - Networks and the Internet.

0059 Stage 1 Networks and Digital Communication, all four: 1DC.01 devices
can connect to each other to make a network; 1DC.02 the internet is many
computers connected together around the world; 1DC.03 some devices are
connected by wires and others are not; 1DC.04 there are times when the
internet is not available.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "networks-and-the-internet",
    "title": "Networks and the Internet",
    "blurb": "Join devices into a network with wires and without, send a picture across it, see the internet stretch round the world, and find out what still works when the internet is off.",
    "steps": [
        step("demo", "Two computers talk", "\U0001F4BB", "Network maker", ["1DC.01"],
             "One computer is on its own. Press <b>Next</b> and join it to another.",
             explain(
                 ["When devices are joined together so they can share things, that is a network."],
                 ["One computer on its own cannot send anything anywhere.", "Join it to another and they can send each other messages.",
                  "Join more and the network grows."],
                 ["Children think computers can always talk to each other.", "Only when they are connected. Two computers on two desks with nothing between them are not a network."],
                 ["Press Next and watch the network grow."]),
             {"frames": [
                 {"scene": {"id": "internet", "state": 0}, "cap": "One computer, on its own. It cannot send anything anywhere.", "say": "One computer, on its own. It cannot send anything anywhere."},
                 {"scene": {"id": "internet", "state": 1}, "cap": "Join it to another. Now they can share. That is a <b>network</b>.", "say": "Join it to another computer. Now they can send each other messages and pictures. Two devices joined together: that is a network.", "sound": "send"},
                 {"scene": {"id": "internet", "state": 2}, "cap": "Join lots and the network <b>grows</b>.", "say": "Join lots of devices and the network grows. Every one can share with every other.", "sound": "ding"},
                 {"pic": "\U0001F4BB\U0001F517\U0001F5A8️", "cap": "A network is devices <b>connected</b> so they can share.", "say": "A network is devices connected together so they can share things: messages, pictures, a printer.", "sound": "tada"},
             ]},
             "Devices joined together so they can share: a network."),

        step("network", "Build a network", "\U0001F4E1", "Network builder", ["1DC.01", "1DC.03"],
             "Connect every device to the router. Tap a device, then tap the router.",
             explain(
                 ["At home, devices join the network through a box called a router."],
                 ["The laptop and the printer connect with a wire.", "The tablet and the phone connect with no wire at all: that is wireless.",
                  "Once everything is connected, the tablet can send a picture to the printer through the router."],
                 ["Children think wireless means not connected.", "Wireless IS connected. The connection is invisible, but it is there."],
                 ["Connect all five, then send the picture."]),
             {"hub": "router",
              "devices": [
                  {"id": "router", "pic": "\U0001F4E1", "label": "router", "x": 160, "y": 110},
                  {"id": "laptop", "pic": "\U0001F4BB", "label": "laptop", "wired": True, "x": 60, "y": 50},
                  {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "wired": True, "x": 260, "y": 50},
                  {"id": "tablet", "pic": "\U0001F4F1", "label": "tablet", "wired": False, "x": 60, "y": 170},
                  {"id": "phone", "pic": "\U0001F4F2", "label": "phone", "wired": False, "x": 260, "y": 170},
                  {"id": "tv", "pic": "\U0001F4FA", "label": "smart TV", "wired": False, "x": 160, "y": 30},
              ],
              "send": [
                  {"what": "a picture", "pic": "\U0001F5BC️", "from": "tablet", "to": "printer", "say": "The picture went from the tablet, through the router, to the printer. It is printing."},
                  {"what": "a message", "pic": "✉️", "from": "laptop", "to": "phone", "say": "The message went from the laptop, through the router, to the phone. Ping!"},
                  {"what": "a video", "pic": "\U0001F3AC", "from": "phone", "to": "tv", "say": "The video went from the phone, through the router, to the big TV."},
              ]},
             "Five devices, one router, one network. And things went across it."),

        step("sort", "Wire, or no wire?", "\U0001F5C2️", "Wire spotter", ["1DC.03"],
             "Some devices connect with a wire. Some connect with no wire at all. Which is this?",
             explain(
                 ["A wired device has a cable plugged in.", "A wireless device connects through the air, with no cable."],
                 ["A desktop computer with a cable into the wall: wired.", "A tablet: wireless.", "Headphones with a cable: wired.", "A smart watch: wireless."],
                 ["Children think a device with any cable is wired.", "A charging cable is not a network cable. Ask: does its CONNECTION come through a cable?"],
                 ["Look for a cable, then tap the bin."]),
             {"ask": "Wire, or no wire?",
              "bins": [{"id": "wired", "label": "Wired", "pic": "\U0001F50C"}, {"id": "wireless", "label": "Wireless", "pic": "\U0001F4F6"}],
              "items": [
                  {"pic": "\U0001F5A5️", "label": "a desktop computer with a cable into the wall", "bin": "wired", "why": "A cable carries its connection. Wired."},
                  {"pic": "\U0001F4F1", "label": "a tablet on wi-fi", "bin": "wireless", "why": "No cable. It connects through the air. Wireless."},
                  {"pic": "\U0001F5A8️", "label": "a printer with a cable to the router", "bin": "wired", "why": "The cable connects it. Wired."},
                  {"pic": "\U0001F4F2", "label": "a mobile phone", "bin": "wireless", "why": "A phone connects with no wire. Wireless."},
                  {"pic": "\U0001F3A7", "label": "headphones with a cable", "bin": "wired", "why": "The sound comes down the cable. Wired."},
                  {"pic": "\U0001F4BB", "label": "a laptop on wi-fi", "bin": "wireless", "why": "No cable to the router. Wireless."},
                  {"pic": "\U0001F3AE", "label": "a games controller with a cable", "bin": "wired", "why": "The cable carries its connection. Wired."},
                  {"pic": "⌚", "label": "a smart watch", "bin": "wireless", "why": "A watch has no cable. Wireless."},
              ]},
             "Some devices connect with a wire, and some with none."),

        step("demo", "The internet goes round the world", "\U0001F30D", "World network", ["1DC.02"],
             "The biggest network of all. Press <b>Next</b>.",
             explain(
                 ["The internet is many, many computers connected together all around the world."],
                 ["Your home network joins the internet through the router.", "So does a school in another country.", "So does Grandma's phone.",
                  "A message from you to Grandma crosses the world in about a second."],
                 ["Children think the internet is one big computer somewhere.", "It is millions of computers, joined."],
                 ["Press Next and watch the message go."]),
             {"frames": [
                 {"scene": {"id": "internet", "state": 2}, "cap": "Many networks, joined together, all around the world: the <b>internet</b>.", "say": "Take many networks, all around the world, and join them together. That is the internet."},
                 {"pic": "\U0001F3E0\U0001F4E1\U0001F30D", "cap": "Your home network joins it through the <b>router</b>.", "say": "Your home network joins the internet through the router.", "sound": "click"},
                 {"pic": "\U0001F3EB\U0001F30D\U0001F475\U0001F3FE", "cap": "So does a school far away. So does Grandma's phone.", "say": "So does a school in another country. So does Grandma's phone, far away.", "sound": "click"},
                 {"scene": {"id": "internet", "state": 3}, "cap": "A message to Grandma crosses the world in a <b>second</b>.", "say": "A message from you to Grandma crosses the whole world in about a second.", "sound": "send"},
                 {"pic": "\U0001F30D\U0001F4BB\U0001F4BB\U0001F4BB", "cap": "The internet: <b>many computers, connected, around the world</b>.", "say": "The internet is many computers connected together around the world.", "sound": "tada"},
             ]},
             "The internet is many computers, connected, all around the world."),

        step("offline", "When the internet is off", "\U0001F4F4", "Offline tester", ["1DC.04"],
             "Sometimes the internet is not there. Switch it OFF, predict what still works, and try each app.",
             explain(
                 ["Sometimes the internet is not available.", "On a plane, in a tunnel, when the router breaks, when a storm brings a line down."],
                 ["Some apps need the internet: a video online, a video call, sending a message.", "Some do not: drawing, a game already on the tablet, photos you took.",
                  "Switch the internet off and see which is which."],
                 ["Children think nothing works without the internet.", "Lots does. Only the things that need OTHER computers stop."],
                 ["Switch it off, predict, try it."]),
             {"apps": [
                 {"id": "video", "label": "Watch a video online", "pic": "\U0001F3AC", "needs": True, "why": "The video lives on another computer far away. No internet, no video."},
                 {"id": "draw", "label": "Draw a picture", "pic": "\U0001F3A8", "needs": False, "why": "Drawing happens on this tablet. It needs no other computer."},
                 {"id": "call", "label": "Video call Grandma", "pic": "\U0001F4DE", "needs": True, "why": "Grandma is far away. The call has to cross the internet to reach her."},
                 {"id": "game", "label": "Play a game already on the tablet", "pic": "\U0001F3AE", "needs": False, "why": "The game is already here. It runs without the internet."},
                 {"id": "photos", "label": "Look at photos you took", "pic": "\U0001F5BC️", "needs": False, "why": "Your photos are saved on this tablet. No internet needed."},
                 {"id": "message", "label": "Send a message to a friend", "pic": "✉️", "needs": True, "why": "A message has to travel to your friend's device. That needs the internet."},
                 {"id": "song", "label": "Play a song already downloaded", "pic": "\U0001F3B5", "needs": False, "why": "Downloaded means it is already saved here. It plays without the internet."},
             ]},
             "Some things need the internet and some do not. Now you know which."),

        step("context", "Where the internet comes into your home", "\U0001F3E0", "Internet tracer", ["1DC.02", "1DC.03"],
             "How does the internet reach your house? Tap each part.",
             explain(
                 ["The internet reaches you through a chain of connections, some with wires and some without."],
                 ["A router in your home.", "Cables under the street, and even under the sea.", "Phone masts, for phones with no wire.", "Satellites in space, for places with no cables."],
                 [],
                 ["Tap each one and follow the chain."]),
             {"items": [
                 {"pic": "\U0001F4E1", "label": "the router", "say": "The router is the box at home with the blinking lights. Every device at home joins the internet through it."},
                 {"pic": "\U0001F30A", "label": "cables under the sea", "say": "Long cables run under the streets, and even under the sea, joining one country's computers to another's."},
                 {"pic": "\U0001F5FC", "label": "a phone mast", "say": "A phone mast sends the internet through the air to phones, with no wire at all."},
                 {"pic": "\U0001F6F0️", "label": "a satellite", "say": "A satellite in space beams the internet to places with no cables, like ships and far-away villages."},
             ], "need": 4,
              "then": {"ask": "What is the internet made of?",
                       "opts": [opt("Many computers connected together around the world", True), opt("One giant computer", False), opt("A very long wire and nothing else", False)],
                       "why": "The internet is millions of computers, joined by wires, masts and satellites, all around the world."}},
             "Routers, cables, masts and satellites join your home to the world."),

        step("questions", "What could be wrong?", "\U0001F914", "Internet detective", ["1DC.04", "1DC.03"],
             "Something is not working. What is most likely? Tap the answer.",
             explain(
                 ["When something online stops working, the internet is often not available at that moment."],
                 ["A spinning circle usually means the tablet is waiting for the internet.", "'No connection' means it cannot reach the internet.",
                  "If a cable comes out, a wired connection stops until it is back in."],
                 [],
                 ["Read what happened, then tap the most likely reason."]),
             {"label": "Question", "items": [
                 q("The video will not play and a little circle keeps spinning. What is most likely?", "⏳", "the internet is not available right now", ["the tablet is asleep", "the video is too long", "the screen is dirty"], "A spinning circle means waiting for the internet, and it is not there."),
                 q("The tablet says 'No connection'. What does that mean?", "\U0001F4F4", "it cannot reach the internet", ["the battery is flat", "the tablet is broken for ever", "somebody is calling"], "No connection means the internet is not available to this device."),
                 q("The cable to the computer came out. What happens to a wired connection?", "\U0001F50C", "it stops until the cable is plugged back in", ["nothing, it carries on", "the computer explodes", "it becomes wireless"], "A wired connection needs its wire."),
                 q("You are on a plane with no wi-fi. Which of these still works?", "✈️", "a game already on the tablet", ["a video call", "watching a video online", "sending a message"], "Things saved on the tablet work without the internet."),
             ]},
             "When the internet is not there, the things that need it stop, and the rest carry on."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["1DC.01", "1DC.02", "1DC.03", "1DC.04"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the network you built, wires and no wires, the world, and the internet being off."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("Devices joined together so they can share things are called a...", "\U0001F517", "network", ["sandwich", "program", "robot"], "A network is devices connected so they can share."),
                 q("At home, what do devices connect to, to join the network?", "\U0001F4E1", "the router", ["the fridge", "the printer", "a wall"], "The router is the box every device at home connects to."),
                 q("A tablet connects with no cable at all. That is...", "\U0001F4F6", "wireless", ["wired", "broken", "impossible"], "No wire means wireless."),
                 q("A printer with a cable to the router is...", "\U0001F50C", "wired", ["wireless", "not connected", "a robot"], "A cable means wired."),
                 q("What is the internet?", "\U0001F30D", "many computers connected together around the world", ["one big computer", "a television", "a kind of wire"], "The internet is millions of computers joined together around the world."),
                 q("How long does a message take to reach Grandma across the world?", "✉️", "about a second", ["a week", "a whole day", "it cannot get there"], "Messages cross the internet in about a second."),
                 q("Is the internet always available?", "\U0001F4F4", "no, sometimes it is not there", ["yes, always, everywhere", "only at school", "only at night"], "On a plane, in a tunnel or when the router breaks, the internet is not available."),
                 q("The internet is off. Which of these still works?", "\U0001F3A8", "drawing a picture on the tablet", ["a video call", "sending a message", "watching a video online"], "Drawing needs no other computer, so it works without the internet."),
             ]},
             "That is the whole lesson finished. You know what a network is, and what the internet is."),
    ],
}


LESSON["about"] = [
    "Say what a network is: devices connected so they can share.",
    "Tell a wired device from a wireless one.",
    "Say what the internet is: many computers connected around the world.",
    "Say what still works when the internet is not available.",
]

LESSON["lecture"] = [
    part("\U0001F517", "A network",
         "One computer on its own cannot send anything anywhere. Join it to another and they can share messages and pictures. Devices connected together so they can share are a network."),
    part("\U0001F4E1", "The router",
         "At home, every device joins the network through a box called a router. The laptop and the printer plug into it with a wire. The tablet and the phone join with no wire at all."),
    part("\U0001F4F6", "Wired and wireless",
         "A wired device has a cable carrying its connection. A wireless device connects through the air. Both are connected. You just cannot see the wireless one."),
    part("\U0001F30D", "The internet",
         "Join many networks together, all around the world, and you have the internet. Your home joins it through the router. So does a school far away, and Grandma's phone. A message crosses the world in about a second."),
    part("\U0001F4F4", "When it is not there",
         "Sometimes the internet is not available: on a plane, in a tunnel, when the router breaks. Then the things that need other computers stop, like videos online and video calls. Drawing, saved games and your own photos carry on."),
]

LESSON["words"] = [
    word("network", "\U0001F517", "Devices connected together so they can share things.",
         ["Our house has a network.", "The printer is on the network."]),
    word("internet", "\U0001F30D", "Many computers connected together all around the world.",
         ["The video comes over the internet.", "The internet is not available on the plane."]),
    word("wired", "\U0001F50C", "Connected with a cable.",
         ["The printer is wired to the router.", "A wired connection needs its wire."]),
    word("wireless", "\U0001F4F6", "Connected with no cable, through the air.",
         ["The tablet is wireless.", "Wireless is still connected."]),
    word("connect", "\U0001F91D", "To join one device to another.",
         ["Connect the laptop to the router.", "The phone connected to the network."]),
    word("router", "\U0001F4E1", "The box at home that joins every device to the network and the internet.",
         ["The router has blinking lights.", "Every device connects through the router."]),
    word("message", "✉️", "Words or a picture sent from one device to another.",
         ["Send a message to Grandma.", "The message arrived in a second."]),
    word("offline", "\U0001F4F4", "Not connected to the internet.",
         ["The tablet is offline on the plane.", "Drawing works offline."]),
]

LESSON["home"] = [
    home("Wire hunt", "A grown-up, a walk round the house",
         ["Find three things connected with a wire: a printer, a desktop computer, a TV box.",
          "Find three things connected with no wire: a phone, a tablet, a laptop.",
          "Follow one wire and see where it goes."],
         "Where did the wire end up? Was it the router?"),
    home("Find the router", "A grown-up",
         ["Ask your grown-up to show you the router: a box with blinking lights.",
          "Count the lights. Count the wires going into it.",
          "Ask what would happen if it was switched off."],
         "Every device at home joins the internet through that one box."),
    home("Internet off", "A grown-up and a tablet or phone",
         ["With your grown-up, switch the wi-fi off for five minutes.",
          "Try a video, a saved game, the camera, a message.",
          "Say which worked and which did not, then switch it back on."],
         "The things that needed other computers stopped. The rest carried on."),
]

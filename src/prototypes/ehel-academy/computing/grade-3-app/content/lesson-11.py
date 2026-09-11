# -*- coding: utf-8 -*-
"""Lesson 11 - Networks Around Us.

0059 Stage 3 Networks and Digital Communication: 3DC.01 networked hardware
in a familiar environment, including the school and home; 3DC.02 services
available on familiar networks - digital files, printed documents, the World
Wide Web; 3DC.03 the advantages and disadvantages of a network.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "networks-around-us",
    "title": "Networks Around Us",
    "blurb": "Find the networked hardware in a school, wire it up and use its services - save a file, print, open a web page - then weigh what a network gives you against what it costs.",
    "steps": [
        step("explore", "Networked hardware at school", "\U0001F3EB", "Hardware spotter", ["3DC.01"],
             "A school network has hardware you can point at. Tap each piece.",
             explain(
                 ["Networked hardware is the equipment that joins the network: the switch, the server, the access points, and the devices that use them."],
                 ["The switch is the box every cable goes into.", "The server is a computer that stores everyone's files and shares the printer.",
                  "An access point is where the wi-fi comes from.", "Laptops, tablets, the printer and the whiteboard all join through them."],
                 ["Children think the network is the wi-fi.", "The wi-fi is one part. The cables, the switch and the server are the network too."],
                 ["Tap all seven."]),
             {"items": [
                 {"pic": "\U0001F5A7", "label": "the switch", "say": "The switch. A box in a cupboard with a row of sockets. Every cable in the building comes here. It joins them all up."},
                 {"pic": "\U0001F5C4️", "label": "the server", "say": "The server. A computer with no screen of its own. It stores everyone's files and looks after the printer, so every device can reach them."},
                 {"pic": "\U0001F4E1", "label": "an access point", "say": "An access point, on the ceiling. It is where the wi-fi comes from. Tablets join the network through it, with no cable."},
                 {"pic": "\U0001F4BB", "label": "the class laptops", "say": "The class laptops. They join with a cable or with wi-fi, and reach the server and the internet through the switch."},
                 {"pic": "\U0001F4F1", "label": "the tablets", "say": "The tablets. Wireless, through the access point."},
                 {"pic": "\U0001F5A8️", "label": "the printer", "say": "The printer. One printer on the network can print for every device in the school."},
                 {"pic": "\U0001F4FA", "label": "the interactive whiteboard", "say": "The interactive whiteboard. Networked, so the teacher can show a file from the server or a page from the web."},
             ], "need": 7,
              "then": {"ask": "Which piece of hardware joins all the cables together?",
                       "opts": [opt("The switch", True), opt("The printer", False), opt("A tablet", False)],
                       "why": "Every cable goes to the switch. It is the meeting point of a wired network."}},
             "Switch, server, access point, and the devices that use them."),

        step("network", "Wire up the school", "\U0001F5A7", "School networker", ["3DC.01", "3DC.02"],
             "Connect every device to the switch. Then use the network's services: save a file, print a document, open a web page.",
             explain(
                 ["Once devices are joined, the network offers services: things you can do because you are connected."],
                 ["Save a file to the server: any device can open it later.", "Print from a tablet: the printer is across the network.", "Open a web page: it comes from the internet, through the switch."],
                 [],
                 ["Connect all six, then send the three things."]),
             {"hub": "switch",
              "devices": [
                  {"id": "switch", "pic": "\U0001F5A7", "label": "switch", "x": 160, "y": 110},
                  {"id": "server", "pic": "\U0001F5C4️", "label": "server", "wired": True, "x": 60, "y": 50},
                  {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "wired": True, "x": 260, "y": 50},
                  {"id": "laptop", "pic": "\U0001F4BB", "label": "laptop", "wired": True, "x": 60, "y": 170},
                  {"id": "tablet", "pic": "\U0001F4F1", "label": "tablet", "wired": False, "x": 260, "y": 170},
                  {"id": "board", "pic": "\U0001F4FA", "label": "whiteboard", "wired": True, "x": 160, "y": 30},
                  {"id": "internet", "pic": "\U0001F310", "label": "internet", "wired": True, "x": 160, "y": 195},
              ],
              "send": [
                  {"what": "a story file", "pic": "\U0001F4C4", "from": "laptop", "to": "server", "say": "The story is saved on the server. Tomorrow, on any laptop, it will be there. That is the digital files service."},
                  {"what": "a document to print", "pic": "\U0001F5A8️", "from": "tablet", "to": "printer", "say": "The tablet sent the document across the network to the printer, and out it came. That is the printing service."},
                  {"what": "a web page", "pic": "\U0001F310", "from": "internet", "to": "board", "say": "A page from the World Wide Web came in from the internet, through the switch, onto the whiteboard. That is the web service."},
              ]},
             "Three services: files, printing, the web."),

        step("sort", "Networked, or not?", "\U0001F5C2️", "Networked sorter", ["3DC.01"],
             "Is this piece of hardware part of the network, or not connected at all?",
             explain(
                 ["Networked: it can send or receive through the network.", "Not networked: it works on its own, with no connection."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Networked, or not?",
              "bins": [{"id": "net", "label": "Networked", "pic": "\U0001F517"}, {"id": "no", "label": "Not networked", "pic": "\U0001F6AB"}],
              "items": [
                  {"pic": "\U0001F5A8️", "label": "the school printer everyone prints to", "bin": "net", "why": "Every device reaches it through the network."},
                  {"pic": "\U0001F4DF", "label": "a pocket calculator", "bin": "no", "why": "It does its sums alone. No connection."},
                  {"pic": "\U0001F5C4️", "label": "the server in the cupboard", "bin": "net", "why": "The server exists to be reached over the network."},
                  {"pic": "\U0001F4A1", "label": "a torch", "bin": "no", "why": "No computer, no network."},
                  {"pic": "\U0001F4E1", "label": "the wi-fi access point on the ceiling", "bin": "net", "why": "It IS part of the network."},
                  {"pic": "\U0001F4F7", "label": "an old camera that keeps photos on a card", "bin": "no", "why": "The photos stay on the card until someone moves them by hand."},
                  {"pic": "\U0001F4FA", "label": "the interactive whiteboard showing a web page", "bin": "net", "why": "The page came over the network."},
                  {"pic": "\U0001F4BB", "label": "a laptop with a network cable in the wall", "bin": "net", "why": "The network cable goes to the switch."},
              ]},
             "Networked hardware can send and receive."),

        step("explore", "Services on the network", "\U0001F6CE️", "Service finder", ["3DC.02"],
             "A service is something you can do BECAUSE you are on the network. Tap each one.",
             explain(
                 ["A network is not just wires. It offers services: files, printing, the web, email, video calls."],
                 ["Digital files: saved on the server, open from anywhere in school.", "Printed documents: one printer for everyone.",
                  "The World Wide Web: pages from computers all over the world.", "Email and video calls: messages and faces across the network."],
                 [],
                 ["Tap all five."]),
             {"items": [
                 {"pic": "\U0001F4C4", "label": "digital files", "say": "Digital files. Save your work on the server and open it from any device in school. No memory stick needed."},
                 {"pic": "\U0001F5A8️", "label": "printed documents", "say": "Printed documents. Press print on any device and the school printer prints it, across the network."},
                 {"pic": "\U0001F310", "label": "the World Wide Web", "say": "The World Wide Web. Pages stored on computers all over the world, brought to your screen through the network and the internet."},
                 {"pic": "\U0001F4E7", "label": "email", "say": "Email. A message sent across the network to someone else's device, in a second."},
                 {"pic": "\U0001F4DE", "label": "video calls", "say": "Video calls. Sound and pictures travelling both ways across the network."},
             ], "need": 5,
              "then": {"ask": "You save a story on the server and open it on a different laptop tomorrow. Which service is that?",
                       "opts": [opt("Digital files", True), opt("Printing", False), opt("The World Wide Web", False)],
                       "why": "The file lives on the server, reachable from any device."}},
             "Files, printing, the web, email, calls: services."),

        step("sort", "Advantage, or disadvantage?", "\U0001F5C2️", "Network weigher", ["3DC.03"],
             "A network gives you things and costs you things. Is this an advantage or a disadvantage?",
             explain(
                 ["Advantages: share files, share a printer, reach the web, work together.", "Disadvantages: if the network is down nothing works; it costs money to set up; things shared can be seen by others; it needs someone to look after it."],
                 [],
                 ["Children think a network is only good.", "It is mostly good, and it has costs. Knowing both is understanding it."],
                 ["Read, decide, tap."]),
             {"ask": "Advantage, or disadvantage?",
              "bins": [{"id": "adv", "label": "Advantage", "pic": "\U0001F44D"}, {"id": "dis", "label": "Disadvantage", "pic": "\U0001F44E"}],
              "items": [
                  {"pic": "\U0001F4C4", "label": "everyone can open the same file from any device", "bin": "adv", "why": "Sharing files is a big advantage."},
                  {"pic": "\U0001F6AB", "label": "when the network is down, nobody can print or save", "bin": "dis", "why": "Everything depends on it, so when it stops, everything stops."},
                  {"pic": "\U0001F5A8️", "label": "one printer serves the whole school", "bin": "adv", "why": "Cheaper and simpler than a printer in every room."},
                  {"pic": "\U0001F4B7", "label": "cables, switches and servers cost money", "bin": "dis", "why": "A network has to be paid for."},
                  {"pic": "\U0001F310", "label": "every laptop can reach the World Wide Web", "bin": "adv", "why": "Information from everywhere."},
                  {"pic": "\U0001F440", "label": "a file you share can be seen by people you did not mean", "bin": "dis", "why": "Sharing has risks."},
                  {"pic": "\U0001F91D", "label": "two classes can work on one document at the same time", "bin": "adv", "why": "Working together across the network."},
                  {"pic": "\U0001F527", "label": "somebody has to look after it and fix it", "bin": "dis", "why": "A network needs care and a person to give it."},
              ]},
             "Advantages and disadvantages, both real."),

        step("questions", "Check: networks", "\U0001F4DD", "Network checker", ["3DC.01", "3DC.02", "3DC.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Hardware, services, advantages and disadvantages."], [], ["Read, think, tap."]),
             {"items": [
                 q("Which is networked hardware?", "\U0001F5A7", "the switch every cable goes into", ["a torch", "a pocket calculator", "a pencil"], "The switch joins the network up."),
                 q("Printing from a tablet to the school printer uses which service?", "\U0001F5A8️", "printed documents", ["the World Wide Web", "video calls", "no service"], "The printing service."),
                 q("Which is a DISADVANTAGE of a network?", "\U0001F44E", "when it is down, nobody can save or print", ["everyone can share files", "one printer serves everyone", "you can reach the web"], "Everything depends on it."),
             ]},
             "Hardware, services, both sides."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["3DC.01", "3DC.02", "3DC.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Think about the hardware, the services and the trade-offs."], [], ["Read, look, tap."]),
             {"items": [
                 q("The computer with no screen that stores everyone's files is the...", "\U0001F5C4️", "server", ["switch", "printer", "whiteboard"], "The server stores and shares."),
                 q("Where does the school wi-fi come from?", "\U0001F4E1", "an access point", ["the printer", "the whiteboard", "a calculator"], "Access points give the wireless signal."),
                 q("Saving a file on the server so it opens from any device is the service called...", "\U0001F4C4", "digital files", ["printing", "email", "shaking"], "Files shared across the network."),
                 q("Pages from computers all over the world, on your screen, is...", "\U0001F310", "the World Wide Web", ["a printer", "a switch", "a cable"], "The web comes through the network and the internet."),
                 q("Which is an ADVANTAGE of a network?", "\U0001F44D", "one printer can serve the whole school", ["it costs money", "it can go down", "shared files can be seen by others"], "Sharing is the advantage."),
                 q("Which is a DISADVANTAGE?", "\U0001F44E", "it costs money to set up and look after", ["files can be shared", "the web is available", "classes can work together"], "It has to be paid for, and somebody has to look after it."),
                 q("A laptop has a network cable plugged into the wall. It is connected to...", "\U0001F5A7", "the switch", ["the sun", "a torch", "nothing"], "Network cables in the wall go to the switch."),
             ]},
             "That is the whole lesson finished. You know the hardware, the services, and both sides of a network."),
    ],
}


LESSON["about"] = [
    "Point to the networked hardware in a school and at home.",
    "Name the services a network offers: files, printing, the World Wide Web.",
    "Say what a network is good for.",
    "Say what a network costs and where it can go wrong.",
]

LESSON["lecture"] = [
    part("\U0001F5A7", "The hardware",
         "A school network is hardware you can point at: the switch every cable goes into, the server that stores files and shares the printer, the access points on the ceiling where the wi-fi comes from, and the laptops, tablets, printer and whiteboard that use them. At home the router does the switch's job."),
    part("\U0001F6CE️", "The services",
         "Being on the network gives you services. Digital files: save on the server, open anywhere. Printed documents: one printer for everyone. The World Wide Web: pages from all over the world. Email and video calls too."),
    part("\U0001F44D", "Advantages",
         "Everyone can share files and a printer. Every device reaches the web. Two classes can work on one document at once. A network turns many separate computers into one system."),
    part("\U0001F44E", "Disadvantages",
         "When the network is down, nothing that depends on it works. It costs money to set up and somebody has to look after it. And what you share can be seen by others, so sharing needs care. Knowing both sides is understanding a network."),
]

LESSON["words"] = [
    word("switch", "\U0001F5A7", "The box that joins all the network cables together.",
         ["Every cable goes to the switch.", "The switch is in the cupboard."]),
    word("server", "\U0001F5C4️", "A computer on the network that stores files and shares things.",
         ["Save it on the server.", "The server looks after the printer."]),
    word("access point", "\U0001F4E1", "The device that gives out the wi-fi signal.",
         ["The tablets connect through the access point.", "An access point on every corridor."]),
    word("service", "\U0001F6CE️", "Something you can do because you are on the network.",
         ["Printing is a network service.", "Files, printing and the web are services."]),
    word("World Wide Web", "\U0001F310", "Pages stored on computers around the world, reached through the internet.",
         ["Open a page on the World Wide Web.", "The web is a service of the internet."]),
    word("advantage", "\U0001F44D", "Something good that you get.",
         ["Sharing a printer is an advantage.", "List the advantages."]),
    word("disadvantage", "\U0001F44E", "Something bad, or a cost.",
         ["The cost is a disadvantage.", "A network down is a disadvantage."]),
]

LESSON["home"] = [
    home("Hardware hunt", "A grown-up, a walk round home",
         ["Find the router. Follow every cable out of it.",
          "Which devices join with a cable? Which with wi-fi?",
          "Is there anything at home that works like a server: a box that stores files or films for every screen?"],
         "Networked hardware you can point at."),
    home("Services at home", "A grown-up",
         ["List what your home network lets you do: films, printing, calls, homework files.",
          "For each one, say what would stop if the network went down.",
          "That list is the advantages; the second half is a disadvantage."],
         "Every service depends on the network."),
]

# -*- coding: utf-8 -*-
"""Lesson 10 - Clients, Servers and the Web.

0059 Stage 4 Networks and Digital Communication: 4DC.01 the role of servers
and clients in a network; 4DC.02 the differences between the World Wide Web
and the internet; 4DC.03 the differences between wi-fi and ethernet,
including speed, security and convenience.
"""
from _kit import explain, step, opt, q, part, word, home

LESSON = {
    "slug": "clients-servers-and-the-web",
    "title": "Clients, Servers and the Web",
    "blurb": "See a client ask and a server serve on the school network, tell the World Wide Web from the internet it runs on, and weigh wi-fi against an ethernet cable for speed, security and convenience.",
    "steps": [
        step("context", "Clients ask, servers serve", "\U0001F5C4️", "Role finder", ["4DC.01"],
             "On a network some computers ASK and one computer SERVES. The asker is a <b>client</b>; the one that answers is a <b>server</b>. Tap each idea.",
             explain(
                 ["A server is a computer that stores things and hands them out when asked. A client is a device that asks."],
                 ["Your tablet asks for a web page: the tablet is the client. The server sends the page.", "You save a story at school: your laptop is the client, and the school server keeps the file so any client can open it tomorrow."],
                 ["Children think the server is the biggest or the boss.", "It is the one that answers requests. One server can answer hundreds of clients."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F4F1", "label": "a client", "say": "A client. A device that asks: a tablet asking for a page, a laptop asking for a file, a phone asking for a video."},
                 {"pic": "\U0001F5C4️", "label": "a server", "say": "A server. A computer that stores things and serves them when a client asks. It is on all the time, waiting for requests."},
                 {"pic": "\U0001F4E8", "label": "a request", "say": "A request. The client sends a message: please send me the lions page. The server looks it up and sends it back."},
                 {"pic": "\U0001F465", "label": "one server, many clients", "say": "One server, many clients. Thirty tablets in the school can all ask the same server at once, and it answers each one."},
             ], "need": 4,
              "then": {"ask": "Your tablet opens a web page. Which is the client?",
                       "opts": [opt("The tablet: it asked", True), opt("The server: it answered", False), opt("The web page", False)],
                       "why": "The client asks; the server serves."}},
             "Clients ask, servers serve."),

        step("network", "The school network", "\U0001F3EB", "School networker", ["4DC.01", "4DC.03"],
             "Connect every device to the router. Some use a cable (ethernet), some use wi-fi. Then send things and watch who asks and who serves.",
             explain(
                 ["The server and the printer are on cables: ethernet. The tablet and phone use wi-fi. Both reach the router."],
                 ["The tablet asks the server for a web page: client to server.", "The laptop saves a story on the server.", "The phone sends a page to the printer over wi-fi."],
                 [],
                 ["Connect all six, then send the three things."]),
             {"hub": "router",
              "devices": [
                  {"id": "router", "pic": "\U0001F4E1", "label": "router", "x": 160, "y": 110},
                  {"id": "server", "pic": "\U0001F5C4️", "label": "school server", "wired": True, "x": 160, "y": 30},
                  {"id": "laptop", "pic": "\U0001F4BB", "label": "laptop", "wired": True, "x": 60, "y": 50},
                  {"id": "tablet", "pic": "\U0001F4F1", "label": "tablet", "wired": False, "x": 260, "y": 50},
                  {"id": "phone", "pic": "\U0001F4F2", "label": "phone", "wired": False, "x": 60, "y": 170},
                  {"id": "printer", "pic": "\U0001F5A8️", "label": "printer", "wired": True, "x": 260, "y": 170},
              ],
              "send": [
                  {"what": "a web page", "pic": "\U0001F310", "from": "server", "to": "tablet", "say": "The tablet asked for the lions page: it is the client. The server found the page and served it over wi-fi."},
                  {"what": "a saved story", "pic": "\U0001F4C4", "from": "laptop", "to": "server", "say": "The laptop saved the story on the school server, down the ethernet cable. Tomorrow any client in the school can ask the server for it."},
                  {"what": "a page to print", "pic": "\U0001F5A8️", "from": "phone", "to": "printer", "say": "The phone sent the page over wi-fi to the router, and the router sent it down the cable to the printer."},
              ]},
             "Clients ask, the server serves, over cable and wi-fi."),

        step("sort", "Client, or server?", "\U0001F5C2️", "Client-server sorter", ["4DC.01"],
             "In each case, is the device a CLIENT (asking) or a SERVER (answering)?",
             explain(
                 ["Client: asks for something.", "Server: stores it and answers."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Client, or server?",
              "bins": [{"id": "client", "label": "Client", "pic": "\U0001F4F1"}, {"id": "server", "label": "Server", "pic": "\U0001F5C4️"}],
              "items": [
                  {"pic": "\U0001F4F1", "label": "a tablet asking for a web page", "bin": "client", "why": "It asks."},
                  {"pic": "\U0001F5C4️", "label": "the computer that holds every child's saved work", "bin": "server", "why": "It stores and serves."},
                  {"pic": "\U0001F4BB", "label": "a laptop opening a file from the school server", "bin": "client", "why": "It asks for the file."},
                  {"pic": "\U0001F3AC", "label": "the computer that sends out a video to a million viewers", "bin": "server", "why": "One server, many clients."},
                  {"pic": "\U0001F4F2", "label": "a phone asking for the weather", "bin": "client", "why": "It asks."},
                  {"pic": "\U0001F4E7", "label": "the computer that keeps your emails and hands them over when you log in", "bin": "server", "why": "Stores and serves."},
              ]},
             "The asker is the client; the answerer is the server."),

        step("context", "The internet and the web", "\U0001F310", "Web explainer", ["4DC.02"],
             "The <b>internet</b> is the network of networks: the cables, routers and servers joining the world. The <b>World Wide Web</b> is the pages that travel over it. Tap each.",
             explain(
                 ["The internet is the roads. The web is one kind of traffic on them: web pages, linked together, read in a browser."],
                 ["Email, video calls and online games use the internet but are not the web.", "A page with a www address, opened in a browser, is the web."],
                 ["Children use the two words for one thing.", "The internet carries the web. It also carries email, calls and games."],
                 ["Tap all four."]),
             {"items": [
                 {"pic": "\U0001F5FA️", "label": "the internet", "say": "The internet. Millions of networks joined together by cables, under the sea and along the streets, with routers passing data between them. It is the roads."},
                 {"pic": "\U0001F310", "label": "the World Wide Web", "say": "The World Wide Web. Pages, linked to each other, stored on servers and read in a browser. It travels over the internet: it is one kind of traffic on the roads."},
                 {"pic": "\U0001F4E7", "label": "not the web: email and calls", "say": "Email, video calls and online games use the internet, but they are not the web. No pages, no browser, no links."},
                 {"pic": "\U0001F517", "label": "links", "say": "Links are what make it a web: one page points to another, which points to another, until the pages of the world are joined in a web."},
             ], "need": 4,
              "then": {"ask": "Which is the best way to say the difference?",
                       "opts": [opt("The internet is the network; the web is the pages that travel over it", True), opt("They are the same thing", False), opt("The web is the cables and the internet is the pages", False)],
                       "why": "Roads and traffic: the internet carries the web."}},
             "The internet carries the web."),

        step("sort", "The internet, or the web?", "\U0001F5C2️", "Web sorter", ["4DC.02"],
             "Is this part of the INTERNET (the network itself) or part of the WORLD WIDE WEB (pages and links)?",
             explain(
                 ["Internet: cables, routers, servers, the connections, and services like email that use them.", "Web: pages, websites, links, browsers."],
                 [],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "The internet, or the web?",
              "bins": [{"id": "net", "label": "The internet", "pic": "\U0001F5FA️"}, {"id": "web", "label": "The web", "pic": "\U0001F310"}],
              "items": [
                  {"pic": "\U0001F30A", "label": "a cable under the sea", "bin": "net", "why": "Part of the network."},
                  {"pic": "\U0001F981", "label": "a web page about lions", "bin": "web", "why": "A page."},
                  {"pic": "\U0001F4E1", "label": "the router in your house", "bin": "net", "why": "It joins your network to the internet."},
                  {"pic": "\U0001F517", "label": "a link you click to go to another page", "bin": "web", "why": "Links join pages."},
                  {"pic": "\U0001F4E7", "label": "an email travelling to Grandma", "bin": "net", "why": "It uses the internet, not the web."},
                  {"pic": "\U0001F310", "label": "a website address starting www", "bin": "web", "why": "The address of a page."},
                  {"pic": "\U0001F4DE", "label": "a video call", "bin": "net", "why": "Internet traffic that is not pages."},
                  {"pic": "\U0001F9ED", "label": "a browser", "bin": "web", "why": "The program that reads web pages."},
              ]},
             "Network things are the internet; pages and links are the web."),

        step("sort", "Wi-fi, or ethernet?", "\U0001F5C2️", "Wi-fi weigher", ["4DC.03"],
             "Devices join a network by <b>ethernet</b> (a cable) or <b>wi-fi</b> (radio). Which one is this describing?",
             explain(
                 ["Ethernet: a cable to the router. Faster, steadier, and harder for a stranger outside to join.", "Wi-fi: no cable. Works anywhere in range, on phones and tablets, but slower, and walls weaken it, and anyone in range can try to join."],
                 ["The server and the printer never move: cable.", "A tablet in the garden: wi-fi."],
                 [],
                 ["Read, decide, tap."]),
             {"ask": "Wi-fi, or ethernet?",
              "bins": [{"id": "wifi", "label": "Wi-fi", "pic": "\U0001F4F6"}, {"id": "eth", "label": "Ethernet", "pic": "\U0001F50C"}],
              "items": [
                  {"pic": "\U0001F50C", "label": "a cable plugged into the wall", "bin": "eth", "why": "That is what ethernet is."},
                  {"pic": "\U0001F33F", "label": "works on a tablet in the garden", "bin": "wifi", "why": "No cable: convenient."},
                  {"pic": "⚡", "label": "the fastest and steadiest connection", "bin": "eth", "why": "A cable carries more, with no interference."},
                  {"pic": "\U0001F9F1", "label": "gets weaker through thick walls", "bin": "wifi", "why": "Radio fades."},
                  {"pic": "\U0001F6E1️", "label": "a stranger outside cannot join without plugging in", "bin": "eth", "why": "More secure."},
                  {"pic": "\U0001F511", "label": "needs a password so neighbours cannot join", "bin": "wifi", "why": "Anyone in range can try."},
                  {"pic": "\U0001F5A8️", "label": "best for a printer that never moves", "bin": "eth", "why": "Steady, and it does not need to move."},
                  {"pic": "\U0001F4F2", "label": "the only choice for a phone", "bin": "wifi", "why": "A phone has no cable socket."},
              ]},
             "Ethernet: faster and safer. Wi-fi: anywhere, no cable."),

        step("questions", "Check: clients, servers, web", "\U0001F4DD", "Network checker", ["4DC.01", "4DC.02", "4DC.03"],
             "Three quick questions.",
             explain(["Nothing new here."], ["Clients and servers, internet and web, wi-fi and ethernet."], [], ["Read, think, tap."]),
             {"items": [
                 q("A computer that stores files and hands them out when asked is a...", "\U0001F5C4️", "server", ["client", "browser", "cable"], "It serves."),
                 q("The World Wide Web is...", "\U0001F310", "pages and links that travel over the internet", ["the cables under the sea", "the same as email", "a router"], "Traffic, not roads."),
                 q("Which is faster and harder for a stranger to join?", "\U0001F50C", "ethernet", ["wi-fi", "both the same", "neither"], "A cable."),
             ]},
             "Ask, serve, web, wire."),

        step("quiz", "Show what you know", "⭐", "Star computer scientist", ["4DC.01", "4DC.02", "4DC.03"],
             "Time to show what you know. Tap the answer.",
             explain(["No new ideas here."], ["Roles on a network, the web against the internet, wi-fi against cable."], [], ["Read, look, tap."]),
             {"items": [
                 q("A device that ASKS for a page is a...", "\U0001F4F1", "client", ["server", "router", "cable"], "Clients ask."),
                 q("How many clients can one server answer?", "\U0001F465", "many at once", ["one", "two", "none"], "One server, many clients."),
                 q("The internet is...", "\U0001F5FA️", "the network of networks joining the world", ["one web page", "a browser", "only email"], "The roads."),
                 q("Which uses the internet but is NOT the web?", "\U0001F4E7", "an email", ["a website", "a link", "a page with a www address"], "No pages, no browser."),
                 q("Which is a CONVENIENCE of wi-fi?", "\U0001F4F6", "no cable, so it works anywhere in range", ["it is the fastest", "walls make it stronger", "strangers cannot join"], "Freedom to move."),
                 q("Which is a SECURITY point for ethernet?", "\U0001F6E1️", "you must plug in to join, so outsiders cannot", ["anyone in range can try", "it needs no password", "it is slow"], "A cable keeps strangers out."),
                 q("Why does the school server use a cable, not wi-fi?", "\U0001F5C4️", "it never moves and needs the fastest, steadiest link", ["servers cannot use cables", "wi-fi is faster", "cables are prettier"], "Speed and steadiness for the busiest computer."),
             ]},
             "That is the whole lesson finished. You know clients from servers, the web from the internet, and wi-fi from ethernet."),
    ],
}


LESSON["about"] = [
    "Explain the roles of clients and servers on a network.",
    "Tell the World Wide Web from the internet.",
    "Compare wi-fi and ethernet for speed, security and convenience.",
    "Choose the right connection for a device.",
]

LESSON["lecture"] = [
    part("\U0001F5C4️", "Clients and servers",
         "On a network some devices ask and one computer answers. The asker is a client: a tablet wanting a page, a laptop wanting a file. The answerer is a server: a computer that stores things and serves them on request, all day, to many clients at once."),
    part("\U0001F310", "The internet and the web",
         "The internet is the network of networks: cables under the sea, routers, servers, all joined. The World Wide Web is pages, linked to each other and read in a browser, travelling over the internet. Email, calls and games use the internet too, but they are not the web."),
    part("\U0001F50C", "Ethernet",
         "Ethernet is a cable to the router. It is the fastest and steadiest connection, and a stranger outside cannot join without plugging in. It suits a server or a printer that never moves."),
    part("\U0001F4F6", "Wi-fi",
         "Wi-fi is radio, no cable. It works anywhere in range, on phones and tablets, in the garden. It is slower, thick walls weaken it, and anyone in range can try to join, which is why it needs a password. Convenience against speed and security."),
]

LESSON["words"] = [
    word("client", "\U0001F4F1", "A device that asks a server for something.",
         ["The tablet is the client.", "Thirty clients asked at once."]),
    word("server", "\U0001F5C4️", "A computer that stores things and serves them when clients ask.",
         ["The school server keeps our work.", "The server sent the page."]),
    word("internet", "\U0001F5FA️", "The network of networks that joins the world.",
         ["Email travels over the internet.", "The internet is the roads."]),
    word("World Wide Web", "\U0001F310", "Linked pages that travel over the internet and are read in a browser.",
         ["The lions page is on the web.", "The web is traffic on the internet."]),
    word("ethernet", "\U0001F50C", "Joining a network by cable.",
         ["The printer uses ethernet.", "Ethernet is fast and steady."]),
    word("wi-fi", "\U0001F4F6", "Joining a network by radio, with no cable.",
         ["The tablet is on wi-fi.", "Wi-fi needs a password."]),
]

LESSON["home"] = [
    home("Find the server", "A grown-up",
         ["Ask: when I watch a video, where does it come from? (A server, far away.)",
          "Name three things at home that are clients.",
          "Is there anything at home that acts as a server? (A games console sharing to another, a family photo hub.)"],
         "Clients ask; servers serve."),
    home("Cable or wi-fi?", "The router at home",
         ["Find the router. Count the cables in it. What are they joined to?",
          "List the devices on wi-fi. Why do those use wi-fi?",
          "Stand behind a thick wall with a phone. Does the wi-fi get weaker?"],
         "Cable for speed and safety; wi-fi to move."),
]

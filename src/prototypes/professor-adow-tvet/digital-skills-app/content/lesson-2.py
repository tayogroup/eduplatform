# -*- coding: utf-8 -*-
"""Lesson 2 — Getting Connected on Site.

Digital Skills for the Workshop, unit DS.02. Seven criteria.

The lesson is built around one distinction that most people never make
explicitly and then cannot reason without: the local network and the
internet are different things, and either can fail while the other is
healthy. Everything else here — the diagnosis order, the wired-versus-
wireless choice, the records that do not reach the office — is that
distinction applied.
"""
from _kit import step, opt, q, check, word

import base64, os

# THE CAPTION TRACK IS INLINED, not linked: a published artifact refuses to
# serve a .vtt whatever content type it is given, and a linked one 404s there
# silently, leaving a film with no captions and nothing on screen to say so.
# A <track src> takes a data URI as happily as a path. The .vtt on disk stays
# the source of truth and is read here at build time, so editing the captions
# cannot drift from what the page ships.
_VTT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "lecture-video", "networks-around-us.446546ca.vtt")
with open(_VTT, "rb") as _fh:
    CAPTIONS = "data:text/vtt;base64," + base64.b64encode(_fh.read()).decode("ascii")

LESSON = {
    "slug": "getting-connected-on-site",
    "title": "Getting Connected on Site",
    "module": "digital-skills",
    "blurb": (
        "Tell a local network from the internet, name the parts of a small site network, "
        "choose wired or wireless with a reason, diagnose a dead connection in the right "
        "order, and know what should never be sent over a connection you do not own."
    ),
    "outcomes": [
        "Distinguish a local network from the internet.",
        "Name the parts of a small site network and what each does.",
        "Choose wired or wireless for a job and justify it.",
        "Join a named network and notice when you have joined the wrong one.",
        "Diagnose a connection failure in order.",
        "Say what must not be sent over a shared connection.",
        "Say how a job's records reach the office, and what happens when they do not.",
    ],
    "steps": [

        # THE UNIT LECTURE, before the learner does anything.
        #
        # THIS FILM IS NOT OURS. It is Ehel Academy's Stage 3 Computing lecture
        # "Networks Around Us", reused whole rather than a new one being
        # written for this module. Nothing about it was changed - not the
        # words, not the pictures, not the voice, not even the encoding.
        #
        # It is a Stage 3 film and its network is a SCHOOL's — cables to a cupboard, an access point
        # on a ceiling, a printer and a whiteboard. A site hut is the same hardware in worse
        # weather, which is the transfer the steps below ask the learner to make.
        #
        # The step says all of this in its own way: the line under the film
        # points at the steps below, and the step's stated error is expecting
        # the film to carry the lesson. It claims ONE criterion, the one it
        # actually teaches.
        #
        # No `parts`. A lecture step is a film and nothing else here; no
        # walkthrough was invented to sit beside somebody else's film.
        step("lecture", "Unit lecture", ["ADOW-DS-DS.02.2"],
             {"video": {"src": "lecture-video/networks-around-us.a11692b4.mp4",
                        "captions": CAPTIONS,
                        "poster": "lecture-video/networks-around-us.51b6df87.jpg"},
              "underFilm": "An introduction to the parts of a network — the switch, the server, the access point, the router. Choosing wired or wireless for a job, and diagnosing a dead connection, are in the steps below."},
             ask="Watch the film first. It names the parts; the steps after it put them on a site.",
             error=("Expecting the film to cover the whole lesson.",
                    "It names the parts of a network and stops there. It never once mentions the internet, so the very first thing this lesson asks of you — telling a local network from the internet — is not in it, and neither is choosing wired over wireless, diagnosing a failure in order, or knowing what must never be sent over a connection you do not own.")),

        step("label", "A small site network", ["ADOW-DS-DS.02.1", "ADOW-DS-DS.02.2"],
             {"tool": "siteNetwork"},
             ask="Tap each part. Two of these you own and can fix; two you do not.",
             error=("Calling the whole thing 'the internet'.",
                    "The router and the devices around it are YOUR network — they can talk to "
                    "each other with the line out completely dead. Once you can see those as two "
                    "separate things, 'the wi-fi is fine but nothing loads' stops being a "
                    "contradiction and becomes a description of exactly where the fault is.")),

        step("questions", "Wired or wireless", ["ADOW-DS-DS.02.3"],
             {"items": [
                 q("A workshop has one machine that uploads large job files at the end of every shift, from a fixed bench. Wired or wireless?",
                   [opt("Wired — it never moves and the transfer matters", True),
                    opt("Wireless, so the bench can be rearranged", False,
                        "The bench is not being rearranged nightly, and a dropped upload at the end of a shift costs the whole shift's records."),
                    opt("Either — there is no difference any more", False,
                        "There is: a cable is not shared with anyone else and does not care about the grinder running next to it.")],
                   "Wired. Anything that does not move, and whose transfer matters, is better on a cable. Wireless is for things that move."),

                 q("Readings drop out on a tablet only when the workshop is busy. What is the most likely cause?",
                   [opt("Interference and competition — more machines and more devices on the same air", True),
                    opt("The tablet is faulty", False,
                        "A faulty tablet would fail when the workshop was quiet too."),
                    opt("The internet is slower in the daytime", False,
                        "Possible in principle, but a fault that tracks how busy the WORKSHOP is points at the workshop, not the line.")],
                   "Wireless is a shared space. Motors, welders and a dozen phones all sit in it, and the busiest hour is when it thins out."),

                 q("A camera must sit 60 m from the office, across a yard. What decides the answer?",
                   [opt("Distance and what is in the way — both options have limits out there", True),
                    opt("Wireless always, because 60 m is too far for a cable", False,
                        "It is not. Ethernet runs to about 100 m; 60 m across a yard is an ordinary cable run."),
                    opt("Wired always, because wireless cannot reach", False,
                        "It can, with the right equipment and a clear line of sight.")],
                   "Both can do 60 m. The cable is more reliable and more work to install; the wireless link is quicker and depends on what moves through the gap. Say which you chose and why."),
             ]},
             error=("Treating wireless as the modern option and wired as the old one.",
                    "They solve different problems. Wireless buys movement and costs reliability; "
                    "a cable buys reliability and costs flexibility. A workshop that has thought "
                    "about it usually has both, with the things that never move on cables.")),

        step("order", "When nothing loads", ["ADOW-DS-DS.02.5"],
             {"ask": "A tablet on site will not reach the office system. Work outwards in order.",
              "finish": "Outwards, one layer at a time. Most people start at the far end and phone the office first — which is the one step that cannot be checked from here.",
              "items": [
                  "Is the device's wireless switched on at all?",
                  "Is it joined to the right network, not a neighbour's or a phone's hotspot?",
                  "Can it reach the router — does anything else on site respond?",
                  "Does the router say it has a line out?",
                  "Can another device on the same network reach the office?",
                  "Report it, with what you have already ruled out",
              ],
              "why": [
                  "Yes. It is switched off more often than anyone admits, usually by a stray tap.",
                  "Yes. A device that silently joined a hotspot looks perfectly connected and reaches nothing.",
                  "Yes. This splits the problem in half: reaching the router means your side is fine.",
                  "Yes. Most routers show this. A healthy network with a dead line out is the commonest state of all.",
                  "Yes. If another device also fails, the fault is not your tablet and never was.",
                  "Last. Now the report is worth reading, because it says what it is NOT.",
              ],
              "before": [
                  "First. Everything else assumes the radio is on.",
                  "Not yet. Switch it on before asking which network it joined.",
                  "Not yet. Confirm which network it is on first.",
                  "Not yet. Establish you can reach the router before asking what the router can reach.",
                  "Not yet. Check your own device's path out first.",
                  "Last — a report before you have checked anything is just the fault repeated.",
              ]},
             error=("Rebooting everything at once.",
                    "It sometimes works, and it destroys the evidence. You no longer know which of "
                    "the five things was wrong, so you cannot stop it happening again tomorrow — "
                    "and if it does happen again tomorrow, you will reboot everything again.")),

        step("questions", "Joining the right network", ["ADOW-DS-DS.02.4"],
             {"items": [
                 q("Your device shows full signal and a connected icon, but nothing loads. What does the icon prove?",
                   [opt("That it joined SOMETHING — not that the something has a route out", True),
                    opt("That the internet is working", False,
                        "The icon reports the link to the access point, which is the near half of the journey.")],
                   "Only that the near half is up. Full signal on a router whose line is dead looks exactly like full signal on a healthy one."),

                 q("A site has 'ADOW-WORKS' and 'ADOW-WORKS-GUEST'. You are on the guest one. Why might the office system be unreachable?",
                   [opt("A guest network is usually kept separate from the site's own machines", True),
                    opt("Guest networks are slower", False,
                        "Often true and not the point — you are not reaching it at all, rather than reaching it slowly.")],
                   "Guest networks are deliberately walled off so a visitor's laptop cannot see the office server. Being on the wrong one of two networks with almost the same name is an ordinary Monday."),

                 q("You joined a network called 'Free Site WiFi' that you have not seen before. What is the risk?",
                   [opt("You do not know whose it is or what it can see", True),
                    opt("None, if you do not type a password", False,
                        "What you send afterwards travels through it whether or not you typed anything.")],
                   "An open network you cannot account for is somebody's equipment. Use the one you were told to use, and if you were not told, ask."),
             ]},
             error=("Trusting the connected icon.",
                    "It is the single most misleading indicator on a site. It answers 'did I join "
                    "an access point', which is a real question and almost never the one you are "
                    "asking.")),

        step("safety", "What not to send over a connection you do not own",
             ["ADOW-DS-DS.02.6"],
             {"ask": "Tick everything that is a genuine precaution on a shared or public connection. One of these is not — leave it alone.",
              "done": "Now the connection can be used for what it is good for.",
              "items": [
                  check("Use the site's own network for work records, not an open one.", True,
                        "An open network is somebody else's equipment. Everything you send crosses it."),
                  check("Check the address bar shows a secure connection before signing in.", True,
                        "It is the only sign you have that what you type is scrambled before it leaves the device."),
                  check("Assume anything sent over an open network could be read.", True,
                        "Treat it as a postcard. Plenty of traffic is fine on a postcard; a customer's details are not."),
                  check("Do not send customer records or payment details over a public connection.", True,
                        "This is the one that gets a business in real trouble, and the one people do without thinking while waiting."),
                  check("Turn off the device's firewall so the connection works properly.", False,
                        "No — this is the one that is not a precaution. A connection that only works with the firewall off is a connection to walk away from. Nothing on a site needs you to lower a device's defences."),
                  check("Forget the network afterwards so the device does not rejoin it silently.", True,
                        "A remembered open network is rejoined automatically, in the car park, months later, with nobody watching."),
              ]},
             error=("Reading 'the connection is encrypted' as 'this is private'.",
                    "Encryption protects what you send from being read on the way. It says nothing "
                    "about who owns the equipment, what it records about you, or where it sends it "
                    "afterwards.")),

        step("questions", "How the records get to the office", ["ADOW-DS-DS.02.7"],
             {"items": [
                 q("A tablet loses the connection halfway through a shift. What usually happens to the readings taken afterwards?",
                   [opt("They are held on the device and sent when the connection returns", True),
                    opt("They are lost", False,
                        "Most job apps hold them. The danger is the opposite of losing them — nobody realising they have not been sent yet."),
                    opt("They go straight to the office anyway", False,
                        "Nothing leaves the device with no route out.")],
                   "Held, then sent later. Which means a shift can end with everything looking normal and nothing actually delivered."),

                 q("How do you know your records reached the office rather than sitting on the tablet?",
                   [opt("Check for the app's sent or synced confirmation before you leave", True),
                    opt("If the app did not complain, it went", False,
                        "Silence means it has not tried yet, not that it succeeded.")],
                   "Look for the confirmation. Thirty seconds at the end of a shift, and it is the difference between a record and a promise."),

                 q("The office says a job has no readings. The tablet shows them clearly. What is the first thing to check?",
                   [opt("Whether the tablet has ever had a connection since they were taken", True),
                    opt("Whether the office is looking at the wrong job", False,
                        "Worth checking second. The tablet showing them proves only that the tablet has them.")],
                   "Ask whether they were ever sent. A device showing its own data proves nothing about what left it."),
             ]},
             error=("Treating 'I entered it' as 'it is recorded'.",
                    "Entering data puts it on the device in your hand. It becomes a record when it "
                    "reaches the system the business actually reads, and on a site with a patchy "
                    "connection those two moments can be hours apart.")),

        step("words", "The words for it", ["ADOW-DS-DS.02.1", "ADOW-DS-DS.02.2"],
             {"items": [
                 word("local network", "The devices on one site, joined to each other. Works with the line out dead."),
                 word("the internet", "All the networks in the world, joined. Yours is one of them."),
                 word("router", "The box joining your local network to the line out. Often the access point too."),
                 word("access point", "The part that devices join wirelessly. Sometimes separate from the router."),
                 word("the line out", "Fibre, copper or mobile signal leaving the building. The part you do not own."),
                 word("network name", "What a network calls itself. Two on one site can differ by one word."),
                 word("guest network", "A separate network for visitors, walled off from the site's own machines."),
                 word("sync", "Sending what a device has been holding to the system that keeps it. Until it happens, the record is on the device only."),
             ]}),
    ],
}

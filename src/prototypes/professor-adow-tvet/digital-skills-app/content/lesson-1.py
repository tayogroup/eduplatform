# -*- coding: utf-8 -*-
"""Lesson 1 — The Computers You Already Use.

Digital Skills for the Workshop, unit DS.01. Seven criteria.

The lesson does not begin with a laptop, on purpose. A learner in this
school meets a computer first as a moisture meter, an inverter or a
chiller controller, and calls none of them a computer — so that is
where it starts. The laptop turns up later, as the odd one out: the
machine that does not know what job it is for until you tell it.
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
                    "..", "lecture-video", "machines-things-and-robots.fbc586a7.vtt")
with open(_VTT, "rb") as _fh:
    CAPTIONS = "data:text/vtt;base64," + base64.b64encode(_fh.read()).decode("ascii")

LESSON = {
    "slug": "the-computers-you-already-use",
    "title": "The Computers You Already Use",
    "module": "digital-skills",
    "blurb": (
        "Find the computer inside a meter, sort the machines in a workshop by whether "
        "they hold one, say what is lost when the digital half fails, share a workshop "
        "machine without losing someone else's work, and report a fault a technician "
        "can actually act on."
    ),
    "outcomes": [
        "Name the four things every computer does, and point to each on a real device.",
        "Find the computer inside equipment that is not called a computer.",
        "Say why a machine's controller cannot be used for something else.",
        "Separate a mechanical fault from a digital one.",
        "Say what data a device holds and who it belongs to.",
        "Start up, log in to and shut down a shared machine safely.",
        "Write a fault report a technician can act on.",
    ],
    "steps": [

        # THE UNIT LECTURE, before the learner does anything.
        #
        # THIS FILM IS NOT OURS. It is Ehel Academy's Stage 3 Computing lecture
        # "Machines, Things and Robots", reused whole rather than a new one being
        # written for this module. Nothing about it was changed - not the
        # words, not the pictures, not the voice, not even the encoding.
        #
        # It is a Stage 3 film for nine-year-olds, and its examples are a washing machine, traffic
        # lights and a lift rather than workshop plant. It also names sensors as inputs and
        # motors as outputs, which is lesson 3's sensor-controller-actuator material arriving
        # early — useful, and not what this lesson is assessed on.
        #
        # The step says all of this in its own way: the line under the film
        # points at the steps below, and the step's stated error is expecting
        # the film to carry the lesson. It claims ONE criterion, the one it
        # actually teaches.
        #
        # No `parts`. A lecture step is a film and nothing else here; no
        # walkthrough was invented to sit beside somebody else's film.
        step("lecture", "Unit lecture", ["ADOW-DS-DS.01.2"],
             {"video": {"src": "lecture-video/machines-things-and-robots.f2eacdfa.mp4",
                        "captions": CAPTIONS,
                        "poster": "lecture-video/machines-things-and-robots.22b7b259.jpg"},
              "underFilm": "An introduction to the idea that a program inside a machine decides what it does. The workshop equipment — the moisture meter, the inverter, the chiller — is in the steps below."},
             ask="Watch the film first. It introduces the idea; the steps after it put it on workshop equipment.",
             error=("Treating the film as the lesson.",
                    "It asks one question well — is a computer deciding, or are you? — and stops there. Everything this lesson is assessed on comes after it: finding the controller inside a meter, telling a mechanical fault from a digital one, and writing a fault report a technician can act on. None of that is in the film.")),

        step("label", "The computer in a moisture meter",
             ["ADOW-DS-DS.01.1", "ADOW-DS-DS.01.2"],
             {"tool": "meter"},
             ask="Tap each part. Every computer does these four things, and this one is in your hand.",
             error=("Calling the display 'the meter'.",
                    "The display is the last step, not the machine. A reading appears there "
                    "because the probe measured something, a chip decided what the measurement "
                    "meant for the material you selected, and a stored calibration table told it "
                    "how. Blame the display for a wrong number and you will replace the one part "
                    "that was working.")),

        step("sort", "Which of these holds a computer?",
             ["ADOW-DS-DS.01.2", "ADOW-DS-DS.01.3"],
             {"ask": "Sort each one. A computer is not defined by having a screen.",
              "finish": "Two of these can be told to do a new job tomorrow. Three already know their job and will never do another. Two have no computer in them at all — and one of those has a display.",
              "groups": [
                  {"key": "general", "label": "general-purpose"},
                  {"key": "embedded", "label": "embedded — one job"},
                  {"key": "none", "label": "no computer"},
              ],
              "items": [
                  {"tool": "laptop", "label": "workshop laptop", "group": "general",
                   "say": "General-purpose. It does not know what it is for until software is put on it, and it will do a different job tomorrow."},
                  {"tool": "phone", "label": "phone", "group": "general",
                   "say": "General-purpose, and the most powerful computer most people own. Same answer as the laptop for the same reason."},
                  {"tool": "meter", "label": "moisture meter", "group": "embedded",
                   "say": "Embedded. There is a real computer in there, and it will only ever be a moisture meter. You cannot put anything else on it."},
                  {"tool": "welder", "label": "welding inverter", "group": "embedded",
                   "say": "Embedded. The inverter's computer switches current thousands of times a second to hold the arc steady — which is why it welds better than the transformer machine it replaced."},
                  {"tool": "chiller", "label": "chiller controller", "group": "embedded",
                   "say": "Embedded. It reads a temperature, compares it to a set point, and switches a compressor. That is the whole job, and it does it all night without anyone present."},
                  {"tool": "spanner", "label": "spanner", "group": "none",
                   "say": "No computer, and no electricity. It is worth having one of these in the list: not everything in a workshop is becoming digital."},
                  {"tool": "tapeRule", "label": "steel rule", "group": "none",
                   "say": "No computer. A rule has a scale printed on it and nothing else — and it will still read true in fifty years, which is more than the meter can promise."},
              ]},
             error=("Sorting by 'does it have a screen'.",
                    "The chiller controller and the meter both have screens; so does a microwave. "
                    "The question is whether the machine can be given a different job. A screen is "
                    "output — it tells you there is a computer, but no screen does not tell you "
                    "there isn't one.")),

        step("questions", "What the computer is actually doing",
             ["ADOW-DS-DS.01.1", "ADOW-DS-DS.01.3", "ADOW-DS-DS.01.4"],
             {"items": [
                 q("A moisture meter reads 14% on seasoned timber and 14% on a wet offcut. Which part is at fault?",
                   [opt("The probe or its contact with the wood — the input", True),
                    opt("The display", False,
                        "The display is showing what it was given. It has no way to know the number is wrong."),
                    opt("The stored calibration table", False,
                        "A bad table would give consistently wrong readings that still CHANGE between wet and dry. Two different materials reading identical means nothing is reaching the chip.")],
                   "Input. If two very different materials give the same number, the measurement never happened — a bent probe, corrosion, or the probe not actually in the timber."),

                 q("A vehicle diagnostic tool says a sensor is faulty. The garage replaces the sensor and the fault returns. What has been confused?",
                   [opt("A reading OUT OF RANGE with a sensor that is broken", True),
                    opt("The tool needs updating", False,
                        "It may, but the tool reported honestly: it said this reading is not possible, which is exactly what it should say when a good sensor reports a real problem."),
                    opt("The tool is the wrong brand", False,
                        "This happens with every brand, because it is a reasoning error rather than a tool error.")],
                   "The tool reports what a sensor SAYS, not whether the sensor is well. A perfectly good sensor reporting a genuine fault reads out of range too. The tool narrows where to look; it does not name the part to replace."),

                 q("Why can a chiller controller not be used to run a feed mixer, even though both just switch a motor?",
                   [opt("Its program is fixed, and its inputs and outputs are wired for one job", True),
                    opt("It is not powerful enough", False,
                        "Power is not the limit. The controller does its own job continuously for years; it has capacity to spare."),
                    opt("It could be, with the right cable", False,
                        "There is nothing to put a new program in with, and the terminals expect a temperature probe, not a mixer's sensors.")],
                   "Embedded means BUILT IN. The program was placed at the factory and there is no way in — which is also why it is reliable. A general-purpose computer is flexible because it is unfinished."),

                 q("A chiller stops cooling. The compressor runs, the fan runs, the display is lit. Mechanical fault or digital one?",
                   [opt("Cannot say yet — but the controller thinks everything is fine, so start with what it is reading", True),
                    opt("Mechanical, because the cooling has stopped", False,
                        "Possible, but the machine is doing what it was told. A controller reading the wrong temperature will happily run a compressor that achieves nothing."),
                    opt("Digital, because the display is on", False,
                        "A lit display only proves the controller has power.")],
                   "Start where the machine's belief and reality differ. If the controller says 4 °C and a thermometer says 11 °C, the fault is in the sensing. If both say 11 °C, the controller is right and the fault is mechanical."),
             ]},
             error=("Reaching for the multimeter before asking what the machine believes.",
                    "An embedded machine acts on what it reads. Comparing what it THINKS is true "
                    "against what you can measure yourself splits the whole problem in half in "
                    "about a minute, and tells you which trade the job belongs to.")),

        step("order", "Sharing a workshop machine",
             ["ADOW-DS-DS.01.6"],
             {"ask": "One laptop, four learners, one shift. Put the stages in order.",
              "finish": "The habit that matters is the middle one: your own account. Everything else follows from it.",
              "items": [
                  "Check whether anyone is already logged in",
                  "Log in as yourself, not as whoever is already on",
                  "Do the work, saving to your own folder",
                  "Save and close what you opened",
                  "Log out — do not just shut the lid",
                  "Report anything that behaved oddly",
              ],
              "why": [
                  "Yes. A machine that looks idle may have someone's unsaved work on it, and switching it off is how that work is lost.",
                  "Yes. Working under someone else's login puts your work in their folder and their name on yours.",
                  "Yes. Your own folder, so the next person cannot overwrite it and you can find it tomorrow.",
                  "Yes. An open file may still be held by the machine and may not be readable by the next person.",
                  "Yes. Closing the lid usually just sleeps it, leaving your account open to whoever opens it next.",
                  "Yes. A machine used by four people hides faults — each one assumes the last person caused it and says nothing.",
              ],
              "before": [
                  "Before anything else. This is the step that prevents the damage.",
                  "Not yet — check the machine is free first.",
                  "Not yet. Log in as yourself before you make anything.",
                  "Not yet. There is nothing open to close.",
                  "Not yet. Save and close first, or logging out may discard it.",
                  "Last. You cannot report the shift until you have had it.",
              ]},
             error=("Using whichever account is already logged in, because it is quicker.",
                    "It is quicker, once. Then your work is in their folder, their work has your "
                    "changes in it, and when something is deleted there is no way to tell who did "
                    "it. Shared machines are where records go missing, and a login is the only "
                    "thing that makes the record honest.")),

        step("questions", "Whose data is it?",
             ["ADOW-DS-DS.01.5"],
             {"items": [
                 q("A diagnostic tool holds the fault history of every vehicle it has touched. Whose is that?",
                   [opt("The customers' and the employer's — not the technician's", True),
                    opt("The technician who took the readings", False,
                        "You made the record during paid work, on the employer's equipment, about someone else's property.")],
                   "It is the customer's information held by the business. Taking a copy to a new job is taking someone else's records, whoever typed them in."),

                 q("You photograph a meter reading on your own phone to finish a report at home. What have you done?",
                   [opt("Moved work records onto a personal device, which most employers govern", True),
                    opt("Nothing — it is only a photograph", False,
                        "The photograph is the record. Where it now lives, who can see it and what happens when you change phones are all real questions.")],
                   "Often allowed, sometimes not, and the only wrong move is not knowing. Ask what the rule is before the shift where you need it."),

                 q("A machine is sold or scrapped. What should happen to what it holds?",
                   [opt("Its stored settings and records are cleared first", True),
                    opt("Nothing — the new owner needs the settings", False,
                        "Calibration settings may be useful; customer records and network passwords are not theirs to receive.")],
                   "Clear it, and clear it before it leaves the building. A machine that has sat on a network usually holds the password to that network."),
             ]},
             error=("Assuming data belongs to whoever typed it in.",
                    "It almost never does. Work records belong to the employer and the customer, "
                    "and that stays true when the work was yours, the reading was yours and the "
                    "photograph is on your phone.")),

        step("order", "A fault report a technician can use",
             ["ADOW-DS-DS.01.7"],
             {"ask": "Order the parts of a report so somebody who was not there can act on it.",
              "finish": "What you did, what happened, what you expected. Everything else is decoration, and the middle one is the one people leave out.",
              "items": [
                  "Which machine, and which one if there are several",
                  "What you were doing when it happened",
                  "What the machine actually did",
                  "What you expected it to do instead",
                  "Whether it happens every time",
                  "What you already tried",
              ],
              "why": [
                  "Yes. \"The meter\" is not a machine when the store holds four.",
                  "Yes. A fault that appears during calibration and one that appears during a reading are different faults.",
                  "Yes. The exact behaviour — the number, the message, the noise. Not your theory about it.",
                  "Yes. This is what turns a description into a fault. Without it nobody knows what 'wrong' means here.",
                  "Yes. Every time, or once in twenty, changes where a technician looks and how long it takes.",
                  "Yes. So nobody spends an hour repeating it.",
              ],
              "before": [
                  "First. Everything after this is about a particular machine.",
                  "Not yet — say which machine before you say what you were doing with it.",
                  "Not yet. The circumstances come before the behaviour.",
                  "Not yet. Say what it did before you say what it should have done.",
                  "Not yet. Establish the fault before its pattern.",
                  "Last. What you tried only makes sense once the fault is described.",
              ]},
             error=("Reporting a diagnosis instead of an observation.",
                    "\"The board has gone\" tells a technician nothing they can check and sends them "
                    "to one part. \"It reads 0.0 on everything since it was dropped\" sends them to "
                    "the right place in a minute. Report what happened; let them say why.")),

        step("words", "The words for it", ["ADOW-DS-DS.01.1", "ADOW-DS-DS.01.3"],
             {"items": [
                 word("input", "Anything going into the machine — a probe reading, a key press, a switch closing."),
                 word("process", "The deciding. Turning what came in into what should go out, by a rule the machine holds."),
                 word("storage", "What the machine keeps when the power is off: calibration tables, settings, records."),
                 word("output", "What comes back out — a number on a display, a motor starting, a record sent."),
                 word("embedded computer", "A computer built into a machine to do one job, with no way to give it another."),
                 word("general-purpose computer", "A computer that does not know its job until software is installed. A laptop, a phone."),
                 word("firmware", "The program an embedded machine holds. Replaced by an update, not by installing something."),
                 word("calibration", "The stored relationship between what a sensor measures and what the number means."),
             ]}),
    ],
}

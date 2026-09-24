# -*- coding: utf-8 -*-
"""Lesson 3 — Hardware, Software and Machines That Act.

Digital Skills for the Workshop, unit DS.03. Seven criteria.

The one criterion in this whole module that the platform cannot assess
is in this lesson: working safely around a machine that can start
without a person. It is taught here and signed off at the machine, and
the safety step says so rather than implying a tick is competence.

Sensor, controller, actuator is the spine. Once a learner can trace a
signal through those three, "why did it do that" becomes a question
with a method behind it instead of a shrug.
"""
from _kit import step, opt, q, check, word

LESSON = {
    "slug": "hardware-software-and-machines-that-act",
    "title": "Hardware, Software and Machines That Act",
    "module": "digital-skills",
    "blurb": (
        "Separate hardware from software and say which one a fault is in, understand why "
        "a machine behaves differently after an update, trace a signal from sensor to "
        "controller to actuator, and work safely beside a machine that can start without you."
    ),
    "outcomes": [
        "Separate hardware from software, and locate a fault in one or the other.",
        "Say what settings and firmware are, and why an update changes behaviour.",
        "Name the three parts of an automated machine and trace a signal through them.",
        "Tell a fixed sequence from a machine responding to a sensor.",
        "Work safely near an automated machine.",
        "Judge which tasks a machine does better than a person, and which it does not.",
        "Record a machine's settings before changing them, and restore them.",
    ],
    "steps": [

        step("sort", "Hardware or software?", ["ADOW-DS-DS.03.1"],
             {"ask": "Sort each fault by where it actually sits. This decides who you call.",
              "finish": "Hardware you can usually see or hear. Software you can only infer, from a machine doing exactly what it was told and the wrong thing happening.",
              "groups": [
                  {"key": "hard", "label": "hardware"},
                  {"key": "soft", "label": "software or settings"},
              ],
              "items": [
                  {"tool": "meter", "label": "probe reads 0.0 on everything", "group": "hard",
                   "say": "Hardware. Nothing is reaching the chip — a broken probe, a broken lead, or corrosion at the contact."},
                  {"tool": "chiller", "label": "holds 8 °C, not the 4 °C on the display", "group": "hard",
                   "say": "Hardware, most likely. The controller believes it is at 4 °C, so it is being told that by a sensor that is wrong, or the cooling cannot keep up."},
                  {"tool": "welder", "label": "starts at the wrong current every morning", "group": "soft",
                   "say": "Settings. It is returning to a stored default rather than the value you last used — a setting to change, not a part to replace."},
                  {"tool": "laptop", "label": "will not print since Tuesday", "group": "soft",
                   "say": "Software, almost always. Nothing physical changed on Tuesday; something was updated or a setting moved."},
                  {"tool": "phone", "label": "screen cracked and half unresponsive", "group": "hard",
                   "say": "Hardware, and the one case where it is obvious. Worth having in the list precisely because most are not."},
              ]},
             error=("Assuming intermittent means electrical and consistent means software.",
                    "It is a useful hunch and it is wrong about as often as it is right. A loose "
                    "connection is intermittent; so is a setting that only applies after a restart. "
                    "Ask instead whether the machine is doing what it was told. If it is, the "
                    "instruction is wrong — that is software.")),

        step("questions", "Settings, firmware and updates", ["ADOW-DS-DS.03.2"],
             {"items": [
                 q("A machine has worked the same way for two years and behaves differently after a service. What is worth asking first?",
                   [opt("Whether its firmware or settings were changed during the service", True),
                    opt("Whether a part was fitted wrongly", False,
                        "Worth asking second. A service commonly includes an update, and an update commonly changes a default.")],
                   "Ask what was updated. Firmware changes are invisible, are rarely written on the job sheet, and change behaviour that everybody had learned to rely on."),

                 q("What is the difference between a setting and firmware?",
                   [opt("A setting is a value you are meant to change; firmware is the program that reads it", True),
                    opt("They are two words for the same thing", False,
                        "Changing a setting is routine. Changing firmware replaces the machine's instructions and can reset every setting."),
                    opt("Firmware is the manual", False,
                        "Firmware is the program the machine runs.")],
                   "The setting is the number. The firmware is what decides what the number means, and an update can change that without the number changing."),

                 q("Why record the settings before an update?",
                   [opt("An update can restore factory defaults and lose what the machine was tuned to", True),
                    opt("It is not necessary — updates keep settings", False,
                        "Usually they do. The times they do not are why anyone writes them down.")],
                   "Because the tuning is knowledge, often built over months, and it lives nowhere except in that machine until somebody writes it on paper."),
             ]},
             error=("Treating an update as maintenance that cannot do harm.",
                    "An update is a replacement of the instructions the machine runs. It usually "
                    "improves things and it is still a change, which is why it belongs on the job "
                    "sheet next to the parts fitted.")),

        step("label", "A machine that acts on its own", ["ADOW-DS-DS.03.3"],
             {"tool": "autoMachine"},
             ask="Tap each part, and follow the signal left to right.",
             error=("Thinking of the controller as the dangerous part.",
                    "The controller only decides. The actuator is the part with force behind it — "
                    "the motor, the ram, the valve — and it moves when the controller says so, "
                    "which may be while you are reaching past it.")),

        step("questions", "Fixed sequence, or responding?", ["ADOW-DS-DS.03.4"],
             {"items": [
                 q("A machine repeats the same movement every 40 seconds whatever you put in front of it. Which is it?",
                   [opt("A fixed sequence — it is not sensing anything", True),
                    opt("Responding to a sensor", False,
                        "A responding machine would change what it does when what it reads changes.")],
                   "Fixed. Predictable, which is a safety advantage — and it will carry on doing it with your hand there, which is the disadvantage."),

                 q("A chiller's compressor runs sometimes and not others, with no pattern you can see. Fixed or responding?",
                   [opt("Responding — to a temperature you cannot see", True),
                    opt("Fixed, on a timer you have not worked out", False,
                        "Possible, and testable: a timer keeps its rhythm on a cold day, a thermostat does not.")],
                   "Responding. There IS a pattern; it is in a quantity you are not measuring. That is the normal experience of standing next to a sensor-driven machine."),

                 q("Which of the two is more dangerous to stand beside, and why?",
                   [opt("The responding one — you cannot predict it from watching", True),
                    opt("The fixed one, because it never stops", False,
                        "A fixed sequence can be timed and learned. That is exactly what makes it the safer of the two to be near.")],
                   "The responding one. A machine that has been still for ten minutes may be one degree away from starting, and nothing you can see will tell you."),
             ]},
             error=("Reading 'it has been quiet for a while' as 'it is not running'.",
                    "For a sensor-driven machine, quiet is not a state. It is a gap between the "
                    "last time the condition was met and the next.")),

        step("safety", "Working near a machine that can start itself",
             ["ADOW-DS-DS.03.5"],
             {"ask": "Tick every genuine precaution before you go near an automated machine. One of these is not — leave it alone.",
              "done": "That is the list. It is also the one thing in this module a screen cannot sign off: an assessor watches you do it, at the machine.",
              "items": [
                  check("Isolate the machine and lock off the isolator, keeping the key.", True,
                        "The only measure on this list that actually prevents a start. Everything else reduces the chance."),
                  check("Treat a stopped machine as one that has not started YET.", True,
                        "A sensor-driven machine is idle, not off. Idle is a condition that can end without anyone touching it."),
                  check("Check whether anything can move under gravity when the power goes.", True,
                        "Isolating removes the power that holds a ram or a gate up as well as the power that drives it."),
                  check("Tell whoever is at the controls that you are working on it.", True,
                        "Remote starts are the reason lock-off exists. A person at a panel in another room cannot see your hands."),
                  check("Press the emergency stop and rely on that while you work.", False,
                        "No — this is the one that is not a precaution. An emergency stop is for an emergency: it is not a lock, it can be reset by anyone, and on many machines it does not remove stored energy. Isolate and lock off instead."),
                  check("Put the guards back before the machine is handed over.", True,
                        "The machine is not finished until it is safe for the next person, who will not know what you removed."),
              ]},
             error=("Trusting the emergency stop as an isolator.",
                    "It is the commonest and most serious confusion around automated plant. An "
                    "e-stop is designed to halt a machine quickly during an emergency, which is a "
                    "different job from keeping it halted while somebody's hands are inside it. "
                    "Only an isolator, locked, with the key in your pocket, does the second.")),

        step("questions", "What a machine is good at", ["ADOW-DS-DS.03.6"],
             {"items": [
                 q("Which of these does a machine do better than a skilled person?",
                   [opt("The same operation, to the same tolerance, ten thousand times", True),
                    opt("Deciding whether a piece of timber is worth using", False,
                        "That is judgement across several unmeasured things at once, and it is the part of the trade that takes years."),
                    opt("Noticing that something sounds wrong", False,
                        "A machine notices what it is instrumented to notice. It has no opinion about a noise nobody fitted a sensor for.")],
                   "Repetition without drift. That is the whole of what automation is good at, and it is worth a great deal."),

                 q("A workshop automates a task and quality gets worse. What is the most likely explanation?",
                   [opt("The task involved judgement that nobody had written down", True),
                    opt("The machine was badly made", False,
                        "Possible, and less common than the task being misunderstood.")],
                   "The judgement was invisible because it was in somebody's hands. Automating a task means first stating exactly what it is, and that is where most of the work is."),

                 q("What happens to the skill when a machine takes over the repetitive part?",
                   [opt("It moves to setting up, checking and knowing when the output is wrong", True),
                    opt("It disappears", False,
                        "Somebody has to decide the machine is producing rubbish, and that judgement comes from having done the work.")],
                   "It moves up. The person who can tell good work from bad is more valuable beside a machine, not less — they are the only one who can."),
             ]},
             error=("Judging automation by whether it replaces a person.",
                    "Most of it does not. It changes which part of the job the person does, and the "
                    "part left over is usually the part that needed the training.")),

        step("order", "Before you change a setting", ["ADOW-DS-DS.03.7"],
             {"ask": "You have been asked to adjust a machine's settings. Put the stages in order.",
              "finish": "Write it down before, prove it after. The middle is the easy part.",
              "items": [
                  "Write down every setting as you found it",
                  "Note who asked for the change and why",
                  "Make one change at a time",
                  "Run the machine and check the result",
                  "Record what the settings now are",
                  "Restore the originals if the change is not kept",
              ],
              "why": [
                  "Yes. Before anything is touched, while the record is still true.",
                  "Yes. In six months the reason is the only thing that explains a value nobody recognises.",
                  "Yes. Two changes at once and you cannot say which one did it.",
                  "Yes. On real work, not on the assumption that a number in a menu is a result.",
                  "Yes. The new state is now the one the next person will find.",
                  "Yes. And you can only do this because of the first step.",
              ],
              "before": [
                  "First — the moment anything is changed, the original is gone.",
                  "Not yet. Capture the machine's state before the paperwork about it.",
                  "Not yet. Record where you started before you move anything.",
                  "Not yet. Make the change before checking it.",
                  "Not yet. Check it works before writing it down as the new normal.",
                  "Last. This is only possible if you did the first step.",
              ]},
             error=("Remembering the old settings instead of writing them down.",
                    "You will remember them for about an hour. The machine will be someone else's "
                    "problem for years, and 'it used to be better before it was adjusted' with no "
                    "record of what it was is a fault nobody can fix.")),

        step("words", "The words for it", ["ADOW-DS-DS.03.1", "ADOW-DS-DS.03.3"],
             {"items": [
                 word("hardware", "The parts you can touch. A fault here can usually be seen, heard or measured."),
                 word("software", "The instructions. A fault here shows as the machine doing exactly what it was told, wrongly."),
                 word("firmware", "The program built into a machine. Changed by an update, not by installing."),
                 word("setting", "A value you are meant to change. Recorded before you change it."),
                 word("sensor", "Turns something physical into a number the controller can read."),
                 word("controller", "Holds the rule: if the reading is this, do that."),
                 word("actuator", "The part that moves — motor, valve, ram, heater. The part with force behind it."),
                 word("isolate and lock off", "Cut the power and lock the isolator, keeping the key. The only thing that stops a machine starting while you are in it."),
             ]}),
    ],
}

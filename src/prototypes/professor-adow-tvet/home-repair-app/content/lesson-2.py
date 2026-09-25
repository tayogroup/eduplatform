# -*- coding: utf-8 -*-
"""Lesson 2 — Repair a Dripping Tap.

Home Repair, unit HR.02. Eight criteria, one job end to end.

Written from a tap repair guide the owner supplied on 2026-09-25. That
document covers seven types of tap across nine pages; this lesson does
ONE — the washer (compression) tap — because it is the one the document
details fully and the one a learner will actually meet. The washerless
family appears only so a learner knows when this procedure does NOT
apply and a repair kit is the answer instead.

TWO THINGS DECIDE WHETHER THIS JOB GOES RIGHT, and neither is hand
skill. The first is reading WHICH leak it is: water at the spout is a
washer or a seat, water at the handle is the gland packing, and a
learner who does not separate them strips a tap and renews a part that
was never at fault. The second is knowing when the washer is innocent:
a tap that eats washers has a cut seat, and fitting a fifth washer to
it will fail like the other four.

UK / East African terms throughout: tap, spout, gland nut, gland
packing. The source document is American and says faucet, spigot and
packing nut; the wording here is not its wording.
"""
from _kit import step, opt, q, check, word

import base64, os

# Inlined rather than linked: a published artifact refuses to serve a .vtt
# whatever content type it is given, so a linked track 404s there silently.
# The .vtt the renderer wrote stays the source of truth and is read at build.
_VTT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "lecture-video", "repair-a-dripping-tap.3e84fdbf.vtt")
with open(_VTT, "rb") as _fh:
    CAPTIONS = "data:text/vtt;base64," + base64.b64encode(_fh.read()).decode("ascii")

LESSON = {
    "slug": "repair-a-dripping-tap",
    "title": "Repair a Dripping Tap",
    "module": "home-repair",
    "blurb": (
        "Tell a washer tap from a washerless one, isolate the supply and prove it, read "
        "which of the two leaks you have, strip the headwork without marking it, renew the "
        "washer — or the seat that keeps eating washers — repack a weeping stem, and put "
        "it back hand tight plus a half turn."
    ),
    "outcomes": [
        "Tell a washer (compression) tap from a washerless one, and say why it matters.",
        "Isolate the supply at the right point and prove it by running the tap dry.",
        "Strip the headwork in order without marking the finish.",
        "Tell a drip at the spout from a weep at the stem, and name the part at fault.",
        "Renew the washer and its brass screw, matched rather than guessed.",
        "Judge whether a seat can be renewed or must be dressed in place.",
        "Repack a weeping stem, wound the way the nut tightens.",
        "Reassemble greased, hand tight plus a half turn, and prove the repair.",
    ],
    "steps": [

        # THE UNIT LECTURE, before the learner does anything.
        #
        # MADE FOR THIS LESSON. Nothing in the Ehel library is about plumbing,
        # and this is a trade job for an adult. It is animated throughout
        # rather than faded between states: the stem screws down onto the
        # seat, the valve closes and the pipe drains, the screwdriver turns,
        # the packing winds on. For a learner at grade 8 to 12 who has never
        # had a tap apart, the movement IS the teaching, and everything that
        # matters here happens inside a brass body they have never seen open.
        step("lecture", "Unit lecture",
             ["ADOW-HR-HR.02.1", "ADOW-HR-HR.02.2", "ADOW-HR-HR.02.3", "ADOW-HR-HR.02.4",
              "ADOW-HR-HR.02.5", "ADOW-HR-HR.02.6", "ADOW-HR-HR.02.7", "ADOW-HR-HR.02.8"],
             {"video": {"src": "lecture-video/repair-a-dripping-tap.a781e151.mp4",
                        "captions": CAPTIONS,
                        "poster": "lecture-video/repair-a-dripping-tap.be8c491b.jpg"},
              "underFilm": "The whole job, in section, so you can see what the stem does to the washer and what the washer does to the seat."},
             ask="Watch the film first. Everything that matters in this job happens inside the tap.",
             error=("Thinking the skill is in the spanner work.",
                    "Stripping a tap is easy. The two things that decide whether the repair "
                    "holds are both judgements you make BEFORE the spanner: which of the two "
                    "leaks you have, and whether the washer or the seat is at fault.")),

        step("browse", "Which kind is it?", ["ADOW-HR-HR.02.1"],
             {"ask": "Two families of tap. Tap each one.",
              "finish": "Decide this before you buy a washer. Half the taps in a modern building do not take one.",
              "items": [
                  {"draw": "typeCompression",
                   "say": "A washer, or compression, tap. The handle screws DOWN through several turns and closes by pressing a rubber washer onto a brass seat. This is the tap this lesson repairs, and the one with a washer to change."},
                  {"draw": "typeWasherless",
                   "say": "A washerless tap: a quarter turn, or a single lever. Inside is a cartridge, a ceramic disc pack or a ball. There is no washer in it, so none of what follows applies — you fit the manufacturer's kit instead."},
              ]},
             error=("Buying a washer before looking at the tap.",
                    "The handle tells you at no cost. Several turns and increasing resistance "
                    "is a washer tap. A quarter turn that stops dead, or a single lever, is not, "
                    "and no washer in the shop will fit it.")),

        step("safety", "Before the spanner", ["ADOW-HR-HR.02.2"],
             {"ask": "Tick everything that must be true before you touch the tap. Two of these are not precautions — leave them alone.",
              "finish": "Isolated, PROVED dry, hot shut at the heater, and the plug in. The tap's age and the colour of the handle decide nothing.",
              "items": [
                  check("Supply isolated at the service valve, or the main stop tap", True,
                        "Everything else in this job assumes the water is off. There is no version of this that is done live."),
                  check("The tap opened and run DRY to prove it", True,
                        "The only proof you shut the right valve. Ten seconds against a room full of water."),
                  check("Hot supply shut at the heater", True,
                        "A hot tap fed from a cylinder can keep delivering after the cold main is off, and it arrives hot."),
                  check("Plug in the basin, or a cloth over the waste", True,
                        "The screw, the washer and the brass screw are all small enough to go down it, and one of them always tries."),
                  check("Plier jaws padded with tape", True,
                        "Bare jaws mark chrome on the first squeeze and the mark never comes out."),
                  check("The tap's age looked up", False,
                        "Makes no difference. What matters is what is inside it, and you are about to see that."),
                  check("The washer bought in advance", False,
                        "Buy it AFTER you have the old one out, and match it. A washer bought on a guess is a second trip."),
              ]},
             error=("Trusting the valve without running the tap.",
                    "Service valves seize part-open and stop taps under sinks are often not the "
                    "one you think. Opening the tap and watching it die is the whole proof, and "
                    "it is the step people skip because nothing appears to happen.")),

        step("label", "A tap in section", ["ADOW-HR-HR.02.1", "ADOW-HR-HR.02.3"],
             {"tool": "tapCutaway"},
             ask="Tap each part. This is the same tap you have seen from the outside, cut in half.",
             error=("Calling the whole assembly 'the tap'.",
                    "The parts have names because the fault has a name. 'It drips' is not a "
                    "diagnosis; 'the washer is grooved' and 'the seat is cut' are, and they get "
                    "you the right part at the counter.")),

        step("questions", "Which leak is it?", ["ADOW-HR-HR.02.4"],
             {"items": [
                 q("Water runs from the spout when the tap is fully closed. Which part?",
                   [opt("The washer, or the seat it closes onto", True),
                    opt("The gland packing", False,
                        "Packing seals the stem where it passes through the nut. It has nothing to do with the spout."),
                    opt("The O-ring on the spout base", False,
                        "That one shows as water at the BASE of a swivel spout, not out of the mouth of it.")],
                   "The tap is not closing. Either the rubber has gone or the brass it closes onto has been cut."),

                 q("Water appears around the handle when the tap is turned ON, and stops when it is closed. Which part?",
                   [opt("The gland packing, or the stem O-ring", True),
                    opt("The washer", False,
                        "A failed washer shows at the spout. This water never reaches the spout."),
                    opt("The seat", False,
                        "The seat is below the washer and inside the body. Water past it goes out of the spout.")],
                   "Water is getting up the stem past the gland. Renew the packing or the O-ring — the washer is innocent."),

                 q("This tap has had four new washers in a year. What do you fit now?",
                   [opt("Nothing yet — look at the seat with a torch", True),
                    opt("A fifth washer, of better quality", False,
                        "It will fail like the other four. Something is destroying them and it is still in there."),
                    opt("A whole new tap", False,
                        "Possibly, in the end. But a cut seat is dressed or renewed in minutes, and that is the cheaper thing to try first.")],
                   "A tap that eats washers has a damaged seat cutting each new one. The washer is the symptom."),
             ]},
             ask="Three faults. Name the part before you name the tool.",
             error=("Fitting a washer to every leak.",
                    "It is the cheapest part and the easiest to reach, which is why it gets fitted "
                    "to faults it cannot cure. Two of the three above are not washer faults.")),

        step("order", "The order of the strip", ["ADOW-HR-HR.02.3"],
             {"ask": "Put the strip in the order it happens.",
              "finish": "Cap, screw, handle, gland nut, stem. Everything after that is on the bench, where you can see it.",
              "items": [
                  "Prise or unscrew the cap in the middle of the handle",
                  "Take out the screw underneath it",
                  "Lift the handle off the stem",
                  "Slacken the gland nut",
                  "Thread the stem out by turning it in the OPEN direction",
              ]},
             error=("Turning the stem the closing way to get it out.",
                    "It threads out the way it opens. Turning it the other way drives the washer "
                    "harder onto the seat, which is how a tight tap becomes a cut seat.")),

        step("browse", "The washer, and the seat under it", ["ADOW-HR-HR.02.5", "ADOW-HR-HR.02.6"],
             {"ask": "Four things off the bench. Tap each one.",
              "finish": "Washer for a drip. Seat as well if it has eaten washers before.",
              "items": [
                  {"draw": "washerWorn",
                   "say": "A washer that has failed, beside the one that replaces it. Hard, flattened or with a groove pressed into it by the seat. Take the old one to the counter: size AND style, because one that almost fits leaks."},
                  {"draw": "seatReplaceable",
                   "say": "The test, done with a torch. A square, hexagonal or slotted hole in the middle of the seat means it unscrews, and a seat wrench turns it out anticlockwise. A plain round hole means it does not come out."},
                  {"draw": "seatDressing",
                   "say": "If it does not come out, you dress it in place: the seat-dressing tool goes down the body, turns until the brass is smooth, and then the chips are blown out. Nothing works if the chips stay in."},
                  {"draw": "packingWrap",
                   "say": "And for the other fault entirely, new gland packing: one turn around the stem under the nut, wound in the direction the nut tightens, so doing the nut up winds it in rather than unwinding it."},
              ]},
             error=("Dressing a seat that could have been unscrewed.",
                    "Dressing removes brass, and a seat can only be dressed so many times. If it "
                    "will come out, take it out and fit a new one — with a smear of sealant on "
                    "the threads so the next person can get it out too.")),

        step("questions", "Putting it back", ["ADOW-HR-HR.02.8"],
             {"items": [
                 q("How tight does the gland nut go?",
                   [opt("Hand tight, then about half a turn more", True),
                    opt("As tight as the spanner will take it", False,
                        "That crushes the packing and makes the handle stiff. A gland nut is not a structural fixing."),
                    opt("Finger tight only", False,
                        "It will weep. The packing needs a little compression to seal.")],
                   "Hand tight plus a half turn. If it weeps after that, give it a little more — a little."),

                 q("Why grease the stem threads before it goes back?",
                   [opt("So the handle turns sweetly and the thread does not pick up", True),
                    opt("To help it seal", False,
                        "The sealing is done by the washer and the packing. Grease is for the action, not the seal."),
                    opt("To stop it unscrewing", False,
                        "Grease would do the opposite. It is not there for that.")],
                   "Silicone grease or petroleum jelly on the threads. It is the difference between a tap that turns nicely and one that grinds."),

                 q("The water is back on. Where do you look?",
                   [opt("At the spout AND around the handle, with the tap opened and closed", True),
                    opt("At the spout only", False,
                        "You may have disturbed the gland getting the stem out. Both places, every time."),
                    opt("Nowhere — if it went back together it is fine", False,
                        "The commonest second visit is a tap that was never tested under pressure before the tools were packed away.")],
                   "Open it, close it, and watch both places. Turn the water back on slowly so a fault shows as a weep and not a jet."),
             ]},
             ask="Three that decide whether you come back to this tap.",
             error=("Turning the water on at full bore.",
                    "Open the valve slowly. A fault then shows as a weep you can see and stop, "
                    "rather than as a jet behind a panel you cannot reach.")),

        step("words", "The words of this job", ["ADOW-HR-HR.02.1"],
             {"items": [
                 word("compression tap", "A tap that closes by screwing a washer down onto a seat. Several turns of the handle. The kind this lesson repairs."),
                 word("washerless", "A tap with no washer — cartridge, ceramic disc or ball. A quarter turn or a single lever, and repaired with a kit."),
                 word("seat", "The brass ring the washer closes onto. Cut or pitted, it destroys each new washer in turn."),
                 word("gland nut", "The nut below the handle. Under it is the packing that seals the stem, and it goes hand tight plus a half turn."),
                 word("gland packing", "The greased cord or ring wound round the stem to stop water climbing it. Wound the way the nut tightens."),
                 word("stem", "The threaded part the handle turns, carrying the washer at its lower end. It threads out in the OPEN direction."),
                 word("spout", "The outlet. A drip HERE is a washer or a seat, and nowhere else."),
                 word("dressing", "Grinding a damaged seat smooth in place with a seat-dressing tool, when it cannot be unscrewed and renewed."),
                 word("service valve", "The small isolating valve in the supply pipe under the fitting. Where you turn this job off, if there is one."),
             ]},
             ask="Nine words you will hear on any tap. Two of them are the two leaks.",
             error=("Using 'washer' for the seat, or 'packing' for the washer.",
                    "They are three different parts sealing three different things: the washer "
                    "seals the water off, the seat is what it seals against, and the packing "
                    "stops water climbing the stem. Mix the words and you will be sold the "
                    "wrong part.")),
    ],
}

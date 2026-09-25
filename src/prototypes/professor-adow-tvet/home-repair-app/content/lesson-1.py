# -*- coding: utf-8 -*-
"""Lesson 1 — Replace a Broken Tile.

Home Repair, unit HR.01. Eight criteria, the whole job end to end.

Written from a tiling guide the owner supplied on 2026-09-25. The
sequence is the guide's — mask, drill, rake, chip from the centre,
clear the bed, dry-fit, butter, space, cure, grout, polish — and the
teaching around it is this school's.

THE LESSON IS ABOUT THE TILES THAT ARE NOT BROKEN. The guide says
"taking care not to damage the surrounding tiles" four separate times,
and that is the job: the broken one is already ruined and nothing you
do can make it worse. Every step here is therefore framed by what it
protects, not by what it removes — which is why the grout comes out
before the tile, why the chisel starts in the middle, and why the wood
chisel goes in bevel side down.
"""
from _kit import step, opt, q, check, word

import base64, os

# The caption track is inlined rather than linked: a published artifact
# refuses to serve a .vtt whatever content type it is given, so a linked
# track 404s there silently. The .vtt the renderer wrote stays the source
# of truth and is read here at build time.
_VTT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "lecture-video", "replace-a-broken-tile.db95dfe9.vtt")
with open(_VTT, "rb") as _fh:
    CAPTIONS = "data:text/vtt;base64," + base64.b64encode(_fh.read()).decode("ascii")

LESSON = {
    "slug": "replace-a-broken-tile",
    "title": "Replace a Broken Tile",
    "module": "home-repair",
    "blurb": (
        "Take one broken tile out of a finished, grouted wall and put a new one back "
        "flush with its neighbours — masking and drilling to control the break, raking "
        "the joints first, chipping from the centre out, clearing the bed flat, then "
        "bedding, spacing, grouting and polishing."
    ),
    "outcomes": [
        "Name the tools and the protective equipment the job needs, and what each protects against.",
        "Mask and drill the tile to control where it breaks, to the depth of the tile only.",
        "Rake the grout from all four joints before anything is broken, and say why first.",
        "Chip the tile out from the centre outwards without damaging its neighbours.",
        "Clear the old adhesive back to a flat bed with the chisel bevel side down.",
        "Dry-fit the replacement, and read a rocking tile as an uneven bed.",
        "Butter the tile sparingly and set it flush on all four edges.",
        "Space it, leave it the stated curing time, then grout, finish and polish.",
    ],
    "steps": [

        # THE UNIT LECTURE, before the learner does anything.
        #
        # MADE FOR THIS LESSON, not borrowed. Nothing in the Ehel library
        # is about tiling, and this is a trade job for an adult rather
        # than a primary topic, so it is drawn in the school's own voice.
        # It claims every criterion because it walks the whole job.
        step("lecture", "Unit lecture",
             ["ADOW-HR-HR.01.1", "ADOW-HR-HR.01.2", "ADOW-HR-HR.01.3", "ADOW-HR-HR.01.4",
              "ADOW-HR-HR.01.5", "ADOW-HR-HR.01.6", "ADOW-HR-HR.01.7", "ADOW-HR-HR.01.8"],
             {"video": {"src": "lecture-video/replace-a-broken-tile.4784cee3.mp4",
                        "captions": CAPTIONS,
                        "poster": "lecture-video/replace-a-broken-tile.80df7dd9.jpg"},
              "underFilm": "The whole job, start to finish. The steps below take each part of it onto a wall that already has grout in it."},
             ask="Watch the film first. It walks the whole job; the steps after it are where the mistakes live.",
             error=("Watching it and thinking the hard part is the breaking.",
                    "The broken tile is already ruined — nothing you do to it can make it worse. "
                    "The job is the eight tiles around it, which are sound, grouted in, and one "
                    "slip from joining it. Every decision in this lesson is about them.")),

        step("label", "What the job needs", ["ADOW-HR-HR.01.1"],
             {"tool": "toolBoard"},
             ask="Tap each tool. Two of these are not tools at all, and they are the two that are not optional.",
             error=("Treating goggles as advice.",
                    "A glazed tile struck with a chisel does not crumble, it SPLINTERS, and it "
                    "splinters upwards towards the face of whoever is swinging. The gloves are for "
                    "afterwards: a freshly broken tile edge cuts like glass because it is glass.")),

        step("safety", "Before the first blow", ["ADOW-HR-HR.01.1"],
             {"ask": "Tick everything that must be true before the chisel is picked up. Two of these are not precautions — leave them alone.",
              "finish": "Goggles, gloves, the joints raked and the depth marked. The dust sheet is sensible; the radio and the tile's colour are neither here nor there.",
              "items": [
                  check("Safety goggles on", True,
                        "Not optional. The splinters come off upwards and fast."),
                  check("Thick work gloves on", True,
                        "Not optional. A broken glazed edge is as sharp as anything on site."),
                  check("Grout raked from all four joints", True,
                        "Do this first or the tile is still locked to its neighbours by a rim of set "
                        "grout, and the break travels into them."),
                  check("Depth mark wrapped on the drill bit", True,
                        "The bit must stop at the back of the TILE. Past that it is drilling the wall, "
                        "or whatever is buried in it."),
                  check("The replacement tile checked against the wall", True,
                        "Check it matches and fits BEFORE you make a hole you cannot un-make."),
                  check("The radio switched off", False,
                        "Nothing to do with it. Work in whatever quiet you like."),
                  check("The new tile soaked in water first", False,
                        "That is for some porous floor tiles and cement mortar, not for a glazed wall "
                        "tile on ready-mixed adhesive. Soaking this one does nothing."),
              ]},
             ask="You are about to take out a tile in a finished bathroom wall. Tick every precaution.",
             error=("Raking the grout after breaking the tile instead of before.",
                    "Set grout ties all four edges of the tile to its neighbours. Strike it while "
                    "that rim is intact and the crack does not stop at the joint — it runs through "
                    "into the tile beside it, and a one-tile repair becomes a three-tile one.")),

        step("order", "The order of the job", ["ADOW-HR-HR.01.2", "ADOW-HR-HR.01.3", "ADOW-HR-HR.01.4"],
             {"ask": "Put the stages in the order they happen.",
              "finish": "Mask, drill, rake, chip from the middle, lift the tape, clear the bed. Every one of those protects the step after it.",
              "items": [
                  "Tape two diagonals across the tile in an X",
                  "Drill along the tape with the 5 mm bit, tile depth only",
                  "Rake the grout from all four joints",
                  "Chip from the centre outwards with the cold chisel",
                  "Peel the tape, taking most of the tile with it",
                  "Clear the old adhesive back to a flat bed",
              ]},
             error=("Starting the chisel at the edge, where the tile looks weakest.",
                    "The edge is where the NEIGHBOUR is. Struck there, the tile levers against the "
                    "one beside it and the force goes into a tile you were not paid to replace. "
                    "Start in the middle, where the only thing behind the tile is wall.")),

        step("browse", "Taking the old tile out", ["ADOW-HR-HR.01.2", "ADOW-HR-HR.01.4", "ADOW-HR-HR.01.5"],
             {"ask": "Six stages of the removal. Tap each one.",
              "finish": "Notice what every picture has in it: eight sound tiles. That is what the method is for.",
              "items": [
                  {"draw": "wallBroken",
                   "say": "One cracked tile in a sound wall. It is grouted on all four sides, which means it is not a loose tile — it is part of a continuous surface, and so are its neighbours."},
                  {"draw": "wallTaped",
                   "say": "Two strips of masking tape across the diagonals, forming an X. The tape does two jobs: it stops the drill bit skating off the glaze, and when you peel it later most of the broken tile comes away stuck to it."},
                  {"draw": "wallDrilled",
                   "say": "Holes along both strips with a 5 mm masonry bit, to the depth of the TILE and no further. Wrap tape round the bit as a depth gauge — guessing puts the bit into whatever is behind the wall."},
                  {"draw": "wallRaked",
                   "say": "The grout raked out of all four joints, down to the bed. The tile is now an island. Until this is done it is welded to its neighbours by a rim of set grout, and a crack has somewhere to travel."},
                  {"draw": "wallChipping",
                   "say": "The cold chisel starts in the MIDDLE, where the drilled holes have already weakened it, and works outwards to the masked lines. The waste falls inwards into the hole you have made, not sideways into the neighbours."},
                  {"draw": "wallBed",
                   "say": "The wood chisel, bevel side DOWN, taking the old adhesive back to a flat bed. Bevel down makes the tool ride up and off the wall; bevel up drives it in — straight behind the tile next door."},
              ]},
             error=("Levering with the chisel instead of striking it.",
                    "A lever needs a fulcrum, and the only fulcrum available is the edge of the "
                    "neighbouring tile. Tiles are strong in compression and weak in bending, which "
                    "is exactly the wrong way round for levering. Strike, do not prise.")),

        step("questions", "Why it is done that way", ["ADOW-HR-HR.01.4", "ADOW-HR-HR.01.6"],
             {"items": [
                 q("The drill bit has no depth mark on it. What is the risk?",
                   [opt("Going through the tile into the wall, and into whatever is buried in it", True),
                    opt("Blunting the bit", False,
                        "A masonry bit will survive a tile. That is not what you are protecting."),
                    opt("Cracking the tile you are removing", False,
                        "You are removing that tile. Cracking it is the point.")],
                   "Past the back of the tile there is wall, and in a bathroom or kitchen wall there is often a pipe or a cable. The bit only needs to go as deep as the tile is thick."),

                 q("You dry-fit the replacement and it rocks. What does that tell you?",
                   [opt("The bed is not flat — there is adhesive still on the wall", True),
                    opt("The tile is the wrong size", False,
                        "A rocking tile is about what is BEHIND it, not its size. A tile that is the wrong size will not sit in the hole at all."),
                    opt("The tile is warped and should be thrown away", False,
                        "Possible but rare. Always suspect the bed first, because that is the thing you have just been chiselling.")],
                   "It rocks on a high spot. Go back to the wood chisel and take the bed flatter — fixing it now costs a minute, and fixing it after the adhesive goes off costs the tile."),

                 q("Why dry-fit at all, before any adhesive is opened?",
                   [opt("It tells you the bed is flat and roughly how much adhesive is needed", True),
                    opt("It is a habit from floor tiling and does nothing on a wall", False,
                        "It does more on a wall, because a wall tile has to hold itself in place while the adhesive grabs."),
                    opt("To check the colour matches", False,
                        "Worth doing, and not the reason. You can check colour without offering the tile into the hole.")],
                   "Because everything after the adhesive is opened is against the clock. The dry fit is the last moment you can discover a problem for free."),
             ]},
             ask="Three that decide whether the repair works. Take your time.",
             error=("Mixing or opening the adhesive before the dry fit.",
                    "Once it is on the tile you are working to the adhesive's timetable, not yours. "
                    "Every check that can be made dry should be made dry.")),

        step("browse", "Setting the new tile", ["ADOW-HR-HR.01.6", "ADOW-HR-HR.01.7", "ADOW-HR-HR.01.8"],
             {"ask": "The second half of the job. Tap each one.",
              "finish": "Sparingly, flush, spaced, and then left alone for as long as the container says.",
              "items": [
                  {"draw": "wallDryFit",
                   "say": "Dry-fitting. Offer the tile in with no adhesive and press each corner. If it rocks, the bed is not flat — that is a message about the wall, not about the tile."},
                  {"draw": "wallButtered",
                   "say": "Buttered with the notched spreader and pressed home, flush on all four edges. Use the adhesive SPARINGLY: too much and the tile stands proud of its neighbours, and you will feel that ridge every time you wipe the wall."},
                  {"draw": "wallGrouted",
                   "say": "Spacers out, grout in, finished with the plastic tool, and polished off with a dry cloth once it has dried. The test of the whole job is that a stranger cannot pick out which tile you replaced."},
              ]},
             error=("Grouting before the adhesive has cured.",
                    "The adhesive holds the tile; the grout only fills the joint. Grout a tile that "
                    "is still moving and you lock it at whatever angle it happens to be sitting, "
                    "and the joint cracks as it finally settles. Read the container — usually "
                    "24 hours — and do something else until then.")),

        step("words", "The words of this job", ["ADOW-HR-HR.01.1"],
             {"items": [
                 word("bed", "The layer of adhesive between the tile and the wall, and the flat surface it needs. Most tiling faults are bed faults."),
                 word("butter", "To spread adhesive on the back of the tile rather than on the wall. Used for a single replacement, where the wall around it is already tiled."),
                 word("joint", "The gap between two tiles, later filled with grout. Its width is set by the spacers and it is the first thing the eye reads."),
                 word("rake", "To scrape set grout out of a joint. Done before breaking, so that the tile is free of its neighbours."),
                 word("bevel side down", "The chisel held with its sloped face towards the wall, so the tool rides up and out of the work instead of digging in."),
                 word("flush", "Finishing level with the surrounding surface, so a hand run across the wall feels no step at the joint."),
                 word("curing", "The time the adhesive needs to reach strength. Stated on the container, and not negotiable by being in a hurry."),
                 word("proud", "Standing out beyond the surrounding surface. The opposite of flush, and the usual result of too much adhesive."),
             ]},
             ask="Eight words you will hear on any tiling job.",
             error=("Using 'grout' and 'adhesive' as if they were the same thing.",
                    "The adhesive is behind the tile and holds it on. The grout is between the "
                    "tiles and keeps water out of the joint. They are different materials, applied "
                    "at different times, and a tile stuck on with grout will come off the wall.")),
    ],
}

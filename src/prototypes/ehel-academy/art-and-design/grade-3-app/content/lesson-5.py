# -*- coding: utf-8 -*-
"""Lesson 5 - Stitch, Weave or Fuse.

0067 Stage 3: TWA.02 "showing that a simple textile design could be
produced through weaving, sewing or by fusing materials together" - the
progression text's own example, and this lesson's spine; M.01 a running
stitch, step by step, with growing skill; M.02 choose the textile process
for a purpose; E.02 explore the processes; E.03 sort textiles by how they
were made; TWA.01 stitch patterns; E.01 encounter a quilt of running
stitches in the manner of kantha from Bengal. The step up from Grade 2:
Grade 2 wove; Grade 3 knows three ways to make cloth and chooses between
them.
"""
from _kit import explain, step, opt, q, spot, part, word, home, material

LESSON = {
    "slug": "stitch-weave-fuse",
    "title": "Stitch, Weave or Fuse",
    "blurb": "Meet the ways to make a textile, sew a running stitch in the right order, continue stitch patterns, choose the best way to make each thing, sort textiles by how they were made, and look closely at a quilt of running stitches.",
    "steps": [
        step("explore", "Ways to make a textile", "🧵", "Textile explorer", ["3TWA.02", "3E.02"],
             "A textile is anything made of cloth or thread. Tap each way of making or decorating one to hear how it works.",
             explain(
                 ["There is more than one way to make a textile.", "The same idea can be woven, sewn or fused."],
                 ["Weaving goes over and under.", "Stitching sews thread in and out with a needle.",
                  "Felting is one way to fuse: wool rubbed with warm soapy water until the hairs lock together."],
                 ["Children think cloth only comes from a shop.", "You can make it three ways yourself."],
                 ["Tap all six and listen."]),
             {"items": [
                 {"pic": "🧶", "label": "weaving", "say": "Weaving. Threads go over and under on a loom, and become cloth."},
                 {"pic": "🪡", "label": "stitching", "say": "Stitching. A needle takes thread in and out of the cloth. Use a big, blunt needle, with a grown-up."},
                 {"pic": "🧼", "label": "felting", "say": "Felting, one way to fuse. Wool rubbed with warm soapy water locks together into felt, with no needle at all."},
                 {"pic": "✂️", "label": "appliqué", "say": "Appliqué. Shapes of cloth are cut out and sewn on top of other cloth."},
                 {"pic": "🪢", "label": "knotting", "say": "Knotting. Knots tied in a pattern make a net, a bag or a hanger."},
                 {"pic": "🥔", "label": "printing on fabric", "say": "Printing on fabric. A stamp and fabric paint put a pattern on plain cloth."},
             ], "need": 6,
              "then": {"ask": "Which way locks wool together with warm soapy water?",
                       "opts": [opt("felting", True), opt("weaving", False), opt("stitching", False)],
                       "why": "Felting rubs wool with warm soapy water until its tiny hairs lock together."}},
             "Weave, stitch, felt, appliqué, knot and print: six ways to make or decorate a textile."),

        step("order", "Sew a running stitch, in order", "🪡", "Stitcher", ["3M.01", "3E.03"],
             "A running stitch goes in and out. Tap the steps in the order you would do them.",
             explain(
                 ["The running stitch is the first stitch most people learn.", "It goes in and out, in a line."],
                 ["Thread the needle and tie a knot.", "Come up from the back.", "Go down a little way along, and up again.",
                  "Finish with a knot at the back."],
                 ["Children pull the thread right through without a knot.", "Tie the knot first, or the thread slips out."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "🪡", "label": "thread a big, blunt needle", "say": "First, thread a big, blunt needle, with a grown-up to help."},
                 {"pic": "🪢", "label": "tie a knot at the end", "say": "Tie a knot at the end of the thread, so it cannot pull through."},
                 {"pic": "⬆️", "label": "push up through the back", "say": "Push the needle up through the cloth from the back."},
                 {"pic": "⬇️", "label": "go down a little way along", "say": "Go back down a little way along."},
                 {"pic": "🔁", "label": "keep going in and out", "say": "Come up again, a little further on, and keep going in and out."},
                 {"pic": "✅", "label": "finish with a knot at the back", "say": "Finish with a knot at the back."},
             ]},
             "Thread, knot, up, down, in and out, and a knot to finish. That is a running stitch."),

        step("pattern", "Stitch patterns", "🧵", "Pattern stitcher", ["3TWA.01", "3E.03"],
             "Embroidery uses stitches in patterns. Tap the stitch that comes next. Then design your own.",
             explain(
                 ["Stitches can make patterns, just like prints and tiles."],
                 ["A long stitch, a short stitch, a cross stitch.", "Say them out loud and find where the pattern starts again.",
                  "Some patterns are four stitches long."],
                 ["Children stop after two stitches.", "Check the whole row."],
                 ["Say it out loud, then tap."]),
             {"tiles": [
                 {"id": "long", "label": "long stitch", "pic": "➖"},
                 {"id": "short", "label": "short stitch", "pic": "🔹"},
                 {"id": "cross", "label": "cross stitch", "pic": "✖️"},
                 {"id": "knot", "label": "knot", "pic": "⚫"},
              ],
              "rounds": [
                  {"seq": ["long", "short", "long", "short", "long", "short", "long", "short"], "show": 4, "ask_n": 2, "ask": "Long, short, long, short. What comes next?"},
                  {"seq": ["cross", "cross", "long", "cross", "cross", "long", "cross", "cross", "long"], "show": 6, "ask_n": 3, "ask": "Cross, cross, long. What comes next?"},
                  {"seq": ["knot", "short", "cross", "short", "knot", "short", "cross", "short", "knot", "short", "cross", "short"], "show": 8, "ask_n": 4, "ask": "Knot, short, cross, short. What comes next?"},
              ],
              "ownMin": 6},
             "One of them was four stitches long."),

        step("choose", "Which way would you make it?", "🧰", "Textile chooser", ["3M.02", "3TWA.02"],
             "Each thing is best made a different way. Which way would you choose? Tap it.",
             explain(
                 ["Every textile process is good at something."],
                 ["Weaving is good for stripes and strong mats.", "Stitching is good for lines and names.",
                  "Felting is good for soft, round shapes.", "Appliqué is good for big shapes on cloth."],
                 ["Children use the process they like best.", "Choose the one that is best at the job."],
                 ["Read the thing, then tap the way."]),
             {"materials": [
                 material("weave", "Weaving", "🧶", ["stripes", "strong"], "Weaving makes strong cloth, easily striped."),
                 material("stitch", "Stitching", "🪡", ["lines"], "Stitching draws lines with thread."),
                 material("felt", "Felting", "🧼", ["soft", "round"], "Felting makes soft, round shapes."),
                 material("applique", "Appliqué", "✂️", ["shapes"], "Appliqué puts big cloth shapes on cloth."),
                 material("knot", "Knotting", "🪢", ["hanging"], "Knotting makes nets and hangers."),
              ],
              "rounds": [
                  {"purpose": "a strong, stripy mat", "needs": "stripes", "pic": "🟥", "why": "Weaving makes strong stripes."},
                  {"purpose": "your name on a cushion", "needs": "lines", "pic": "🪪", "why": "Letters are lines. Stitching draws them."},
                  {"purpose": "a soft, round ball", "needs": "round", "pic": "⚽", "why": "Felting rolls wool into a soft, round ball."},
                  {"purpose": "a big flower on a bag", "needs": "shapes", "pic": "🌻", "why": "A big cloth flower is cut out and sewn on: appliqué."},
                  {"purpose": "a hanger for a plant pot", "needs": "hanging", "pic": "🪴", "why": "Knots make a strong hanger."},
              ]},
             "You chose the best way to make five textiles."),

        step("sort", "Woven, stitched or felted?", "🗂️", "Textile sorter", ["3E.03", "3E.02"],
             "How was each thing made? Tap the bin.",
             explain(
                 ["Look closely at a textile and you can often tell how it was made."],
                 ["Over and under: woven.", "Thread going in and out on top of cloth: stitched.",
                  "No threads at all, just fuzzy wool: felted."],
                 ["Children guess from the colour.", "Look for over and under, or in and out, or no threads."],
                 ["Look closely, then tap the bin."]),
             {"ask": "Woven, stitched or felted?",
              "bins": [{"id": "wv", "label": "Woven", "pic": "🧶"}, {"id": "st", "label": "Stitched", "pic": "🪡"}, {"id": "fe", "label": "Felted", "pic": "🧼"}],
              "items": [
                  {"pic": "🧺", "label": "a cane basket", "bin": "wv", "why": "Over and under. Woven."},
                  {"pic": "🪪", "label": "a name on a bag, done with a needle and thread", "bin": "st", "why": "Thread in and out on top of the bag. Stitched."},
                  {"pic": "🟣", "label": "a fuzzy ball of wool with no threads to see", "bin": "fe", "why": "No threads, just wool locked together. Felted."},
                  {"pic": "🟨", "label": "a strip of kente cloth", "bin": "wv", "why": "Kente is woven on a loom."},
                  {"pic": "👖", "label": "a patch sewn onto jeans", "bin": "st", "why": "Stitches hold the patch on."},
                  {"pic": "🎩", "label": "a thick, soft wool hat with no threads to see", "bin": "fe", "why": "Felt hats are made of pressed, locked wool."},
                  {"pic": "✖️", "label": "a picture made of tiny thread crosses", "bin": "st", "why": "Made of little crosses of thread. Stitched."},
              ]},
             "You sorted seven textiles by how they were made."),

        step("source", "A quilt of running stitches", "🪡", "Quilt looker", ["3E.01", "3R.02"],
             "This cloth is drawn in the manner of kantha, from Bengal. Tap the parts to find out how it was made.",
             explain(
                 ["In Bengal, in Bangladesh and India, women stitch layers of old cloth together to make kantha.",
                  "It is all done with one simple stitch: the running stitch."],
                 ["Tap the rows of stitches.", "Tap the fish, drawn in stitches.", "Tap the layers of cloth at the edge."],
                 ["Children think it must be a hard stitch.", "It is the running stitch you just learned, done again and again."],
                 ["Tap three things and listen."]),
             {"scene": "kantha", "need": 3, "caption": "Tap the rows, the fish and the layers.",
              "spots": [
                  spot("rows", "the rows of stitches", "Row after row of running stitch, in and out. The stitches hold the layers of cloth together.", 70, 40, "🧵"),
                  spot("fish", "the fish", "A fish drawn with running stitch. Fish, flowers and birds are often stitched on kantha.", 140, 124, "🐟"),
                  spot("layers", "the layers of cloth", "Look at the edge: there is more than one layer. Old cloth is layered and stitched to make it thick and warm.", 300, 222, "📚"),
              ],
              "then": {"ask": "Which stitch made the whole cloth?",
                       "opts": [{"t": "running stitch, in and out", "spot": "rows"}, {"t": "no stitches at all"}, {"t": "glue"}],
                       "why": "Kantha is stitched mostly with running stitch, in and out, again and again."}},
             "You found the stitches, the fish and the layers of a kantha cloth."),

        step("questions", "Textile spotter", "💬", "Textile spotter", ["3M.01", "3TWA.02"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about textiles.", "You have met every one of them."],
                 ["Think about weaving, stitching, felting and the running stitch."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Textiles", "items": [
                 q("What do you do before you start a running stitch?", "🪢", "tie a knot at the end", ["finish the stitches", "cut the cloth in half"], "A knot stops the thread pulling through."),
                 q("Which way makes a soft, round ball?", "🧼", "felting", ["weaving", "knotting"], "Felting rolls wool into soft, round shapes."),
                 q("A patch sewn onto jeans is…", "👖", "stitched", ["woven", "felted"], "Stitches hold it on."),
                 q("Which needle should you use?", "🪡", "a big, blunt one, with a grown-up", ["the sharpest you can find", "any needle, alone"], "A big, blunt needle is safer."),
             ]},
             "You know three ways to make a textile."),

        step("quiz", "Show what you know", "⭐", "Star textile maker", ["3E.01", "3E.02", "3E.03", "3M.01", "3M.02", "3TWA.01", "3TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the ways to make a textile, the running stitch, patterns, choosing and kantha."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("What is a textile?", "🧵", "anything made of cloth or thread", ["anything made of clay", "a kind of paint"], "Cloth and thread make textiles."),
                 q("Why tie a knot at the end of the thread?", "🪢", "so the thread cannot pull through the cloth", ["so it looks pretty", "so the needle is sharper"], "Without a knot the thread slips out."),
                 q("Felting joins wool with…", "🧼", "warm soapy water", ["glue", "a stapler"], "Warm soapy water locks the hairs together."),
                 q("Why would you weave a strong, stripy mat?", "🟥", "because weaving makes strong cloth and stripes easily", ["because weaving is quickest", "because weaving needs no thread"], "Weaving is good at strong, striped cloth."),
                 q("Knot, short, cross, short. What comes next?", "⚫", "knot", ["short", "cross"], "The pattern starts again with a knot."),
                 q("Kantha comes from…", "🌍", "Bengal, in Bangladesh and India", ["Japan", "France"], "Kantha is stitched in Bengal."),
                 q("Which stitch is kantha made with?", "🪡", "running stitch", ["no stitch", "a staple"], "Running stitch, again and again."),
                 q("Can the same textile idea be made more than one way?", "🧶", "yes: woven, stitched or felted", ["no, only one way", "only with a machine"], "One design can be woven, stitched or felted."),
             ]},
             "That is the whole lesson finished. You know three ways to make a textile, and how to choose."),
    ],
}


LESSON["about"] = [
    "Name ways to make a textile: weaving, stitching and felting.",
    "Sew a running stitch in the right order, safely.",
    "Continue stitch patterns and design your own.",
    "Choose the best way to make a textile for a job.",
    "Find how a kantha cloth was made.",
]

LESSON["lecture"] = [
    part("🧵", "Three ways",
         "A textile is anything made of cloth or thread. You can make one by weaving, over and under. By stitching, in and out with a needle. Or by felting: rubbing wool with warm soapy water until it locks together."),
    part("🪡", "The running stitch",
         "The running stitch is the first stitch most people learn. Tie a knot. Come up from the back. Go down a little way along, and up again. Use a big, blunt needle, with a grown-up."),
    part("🧰", "Choose the way",
         "Each way is good at something. Weaving makes strong stripes. Stitching draws lines and names. Felting makes soft, round shapes. The same idea can often be made all three ways."),
    part("🐟", "Kantha",
         "In Bengal, in Bangladesh and India, women stitch layers of old cloth together to make kantha. They stitch fish, flowers and birds, mostly with one simple stitch, running stitch, again and again."),
]

LESSON["words"] = [
    word("textile", "🧵", "Anything made of cloth or thread.",
         ["A scarf is a textile.", "We made a textile three ways."]),
    word("stitch", "🪡", "One loop of thread going in and out of cloth.",
         ["I sewed a running stitch.", "Each stitch is the same length."]),
    word("felt", "🧼", "Cloth made by locking wool together with warm soapy water.",
         ["I made a felt ball.", "Felt has no threads."]),
    word("needle", "🪡", "A thin tool with a hole for thread, used for sewing.",
         ["Thread the needle.", "Use a big, blunt needle."]),
    word("appliqué", "✂️", "Cloth shapes sewn on top of other cloth.",
         ["The flower is appliqué.", "I added appliqué to my bag."]),
    word("embroidery", "🌸", "Pictures and patterns stitched onto cloth.",
         ["The cushion has embroidery.", "Kantha is a kind of embroidery."]),
]

LESSON["home"] = [
    home("Running stitch card", "A piece of card, a hole punch or a blunt pencil to poke holes, wool, a big blunt needle, and a grown-up",
         ["Draw a simple shape on the card, like a fish or a star.", "Ask a grown-up to punch holes along the line.",
          "Stitch in and out of the holes with the wool.", "Knot the ends at the back."],
         "Are your stitches all the same length?"),
    home("Felt ball", "Some wool fibre, warm soapy water in a bowl, a towel, and a grown-up",
         ["Roll a little wool into a loose ball.", "Dip it in the warm soapy water.",
          "Roll it gently between your hands for a long time, until it goes firm.", "Rinse it and let it dry."],
         "Can you still see the separate hairs, or have they locked together?"),
    home("One idea, three ways", "Paper strips, wool, a card and a felt scrap",
         ["Choose a simple idea, like a stripy sun.", "Try making it by weaving paper strips.",
          "Try it again by stitching wool on card.", "Try it a third way, with felt or cut cloth."],
         "Which way worked best for your idea, and why?"),
]

LESSON["journal"] = {
    "changes": ["make the stitches the same length", "try felting instead", "add a cross stitch pattern", "use a brighter thread", "keep it just as it is"],
}

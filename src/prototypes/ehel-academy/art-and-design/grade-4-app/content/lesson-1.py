# -*- coding: utf-8 -*-
"""Lesson 1 - Drawing What I See.

0067 Stage 4: E.03 gather and record visual information in a visual journal;
E.02 revisit graphite and charcoal, now to push things forward and back;
M.01 "simple inferences ... about effective media, materials, tools ... for a
specific task", and "a series or sequence of stages towards an outcome";
TWA.02 take on a harder way of working with independence; R.02 check a drawing
against what is really there. The step up from Grade 3: Grade 3 recorded
patterns and drew light and shade; Grade 4 measures - sizes compared against
each other, one vanishing point, and the nearest edge drawn darkest so it
comes forward.
"""
from _kit import explain, step, opt, q, spot, part, word, home

LESSON = {
    "slug": "drawing-what-i-see",
    "title": "Drawing What I See",
    "blurb": "Find out why the far end of a street looks small, sort near from far, measure sizes with a pencil, draw guide lines before you draw anything else, and put a drawing together in the order that makes it work.",
    "steps": [
        step("demo", "The same lamp, three times", "🔭", "Distance watcher", ["4E.03", "4M.01"],
             "Press <b>Next</b> and watch what distance does to the same lamp post.",
             explain(
                 ["Things do not really shrink when they go away from you.", "They only LOOK smaller, and drawing shows that."],
                 ["The lamp near you fills the page.", "The same lamp further off is half as tall.",
                  "Far away, it is a thumbnail.", "Far things also sit higher up the picture, and show less detail."],
                 ["Children draw everything the same size and the picture goes flat.",
                  "Draw what it LOOKS like, not what you know it is."],
                 ["Press Next and watch."]),
             {"frames": [
                 {"pic": "🏮", "cap": "One lamp post, <b>close to you</b>. It fills the page.", "say": "One lamp post, close to you. It fills the page."},
                 {"pic": "🏮", "cap": "The <b>same</b> lamp post, further down the street. Half as tall.", "say": "The same lamp post, further down the street. Half as tall."},
                 {"pic": "🔅", "cap": "Further still: small, higher up the page, and you cannot see the bulb.", "say": "Further still. Small, higher up the page, and you cannot see the bulb."},
                 {"pic": "📏", "cap": "The lamp never changed. Your <b>view</b> of it did.", "say": "The lamp never changed. Your view of it did.", "sound": "click"},
             ]},
             "Same lamp, three sizes. That is distance, and you can draw it."),

        step("source", "A street going away", "🛣️", "Street reader", ["4E.03", "4M.01"],
             "Look down this street. Tap the parts to find out how the drawing makes it go away from you.",
             explain(
                 ["In a drawing, everything going away from you heads for the SAME spot.", "It sits on the horizon, level with your own eyes, and artists call it the vanishing point."],
                 ["The road is wide at the bottom and narrow at the top.", "Each house is smaller than the one before it.",
                  "The lamp posts shrink and lift towards the middle."],
                 ["Children think far things are drawn higher because they are up in the air.",
                  "They are not. They are further along the ground."],
                 ["Tap three things and listen."]),
             {"scene": "street", "need": 3, "caption": "Tap the road, a near lamp, a near house and the middle.",
              "spots": [
                  spot("road", "the road", "The road is wide down here, close to you, and narrows as it goes away. The edges are straight lines heading for one spot.", 120, 220, "🛣️"),
                  spot("lamp", "the near lamp post", "The lamp nearest you is the tallest, and it stands lowest on the page. Each one further away is shorter, and stands higher up.", 88, 166, "🏮"),
                  spot("house", "the near house", "The house closest to you is the biggest, and it has the most detail: three windows, a door, a handle and a letterbox. The far one is a shape with one window.", 30, 196, "🏠"),
                  spot("point", "the vanishing point", "Every line going away meets here, on the horizon: the level of your own eyes. That is the vanishing point.", 160, 132, "🎯"),
              ],
              "then": {"ask": "Where do the two edges of the road meet?",
                       "opts": [{"t": "at one spot on the horizon, level with your eyes", "spot": "point"}, {"t": "they never meet"}, {"t": "at the top corners"}],
                       "why": "Lines going away from you meet at one vanishing point."}},
             "You found the road, the lamps, the houses and the vanishing point."),

        step("sort", "Near or far?", "🗂️", "Distance sorter", ["4M.01", "4E.03"],
             "In a drawing, near things and far things look different. Which is each one? Tap the bin.",
             explain(
                 ["Four things tell you how far away something is drawn."],
                 ["Near: bigger, lower down the page, full of detail, drawn darker.",
                  "Far: smaller, higher up the page, hardly any detail, drawn paler."],
                 ["Children draw the far hills as dark as the near wall.", "Pale and simple says far away."],
                 ["Read it, then tap the bin."]),
             {"ask": "Drawn near, or drawn far?",
              "bins": [{"id": "near", "label": "Near", "pic": "👟"}, {"id": "far", "label": "Far", "pic": "🏔️"}],
              "items": [
                  {"pic": "🌳", "label": "a tree drawn big, at the bottom of the page", "bin": "near", "why": "Big and low down. It is close to you."},
                  {"pic": "🌲", "label": "a tree drawn small, near the middle of the page", "bin": "far", "why": "Small and higher up. It is further away."},
                  {"pic": "🧱", "label": "a wall where you can count every brick", "bin": "near", "why": "You only see that much detail up close."},
                  {"pic": "🌫️", "label": "hills drawn pale, with no detail at all", "bin": "far", "why": "Pale and plain. Far away."},
                  {"pic": "🚪", "label": "a door with its handle, its hinges and its letterbox", "bin": "near", "why": "Handles and hinges show up close."},
                  {"pic": "🏘️", "label": "houses drawn as simple grey shapes", "bin": "far", "why": "Far houses lose their detail and their colour."},
                  {"pic": "✏️", "label": "the edge drawn darkest of all", "bin": "near", "why": "The darkest edge comes forward, so it reads as nearest."},
              ]},
             "You sorted seven things into near and far."),

        step("marks", "Guide lines first", "✏️", "Guide liner", ["4M.01", "4E.02", "4TWA.02"],
             "A good drawing starts with lines nobody is meant to notice. Draw each one with the tool the card asks for.",
             explain(
                 ["Before the real lines, artists lay down guide lines: light, thin, easy to rub out."],
                 ["A thin, pale line finds where things go.", "A long line sets the horizon.",
                  "A straight line follows the edge of the road.", "Then the nearest edge goes down thick and dark, so it comes forward."],
                 ["Children press hard from the first line, and then cannot change anything.",
                  "Press lightly until you are sure."],
                 ["Draw the first line."]),
             {"tools": ["pencil", "charcoal", "pen"],
              "rounds": [
                  {"tool": "pencil", "want": "thin", "made": "a pale guide line", "ask": "With the pencil, draw one thin, pale guide line, right across your paper.", "pic": "📏", "why": "Thin and pale. A guide line you can rub out."},
                  {"tool": "pencil", "want": "long", "made": "the horizon", "ask": "With the pencil, draw one long line right across: the horizon.", "pic": "🌅", "why": "Long and level. That is the horizon."},
                  {"tool": "pencil", "want": "straight", "made": "the edge of the road", "ask": "With the pencil, draw one straight line for the edge of the road.", "pic": "🛣️", "why": "Straight, heading for the vanishing point."},
                  {"tool": "charcoal", "want": "thick", "made": "the nearest edge, darkest", "ask": "With the charcoal, draw the nearest edge thick and dark.", "pic": "⬛", "why": "Thick and dark. The nearest edge comes forward."},
              ]},
             "Guide lines first, the dark nearest edge last. That is the order."),

        step("order", "How to draw what you see", "📋", "Drawing planner", ["4M.01", "4E.03", "4TWA.02"],
             "Tap the steps in the order an artist would do them.",
             explain(
                 ["Drawing from life has an order, and it saves you starting again."],
                 ["Look first, and keep looking.", "Compare sizes: hold the pencil out and measure.",
                  "Lay light guide lines.", "Check the shapes against each other before you commit.",
                  "Then the detail, and the darks last."],
                 ["Children start with the eyelashes.", "Start with the biggest shapes."],
                 ["Tap what you do first."]),
             {"items": [
                 {"pic": "👀", "label": "look carefully at the real thing", "say": "First, look carefully at the real thing, and keep looking while you draw."},
                 {"pic": "📏", "label": "measure sizes with your pencil", "say": "Hold your pencil out at arm's length and compare sizes: how many heads tall, how wide against how high."},
                 {"pic": "✏️", "label": "draw light guide lines", "say": "Draw light guide lines for the biggest shapes."},
                 {"pic": "🔍", "label": "check one shape against another", "say": "Check: is that really as wide as this? Fix it now, while the lines are light."},
                 {"pic": "🖊️", "label": "draw the real lines", "say": "Now draw the lines you mean to keep."},
                 {"pic": "⬛", "label": "put in the darks last", "say": "Put the darks in last, darkest where it is nearest."},
             ]},
             "Look, measure, guide, check, draw, darken. In that order."),

        step("questions", "Distance spotter", "💬", "Distance spotter", ["4E.03", "4M.01"],
             "Which one is it? Tap the answer.",
             explain(
                 ["Every question here is about drawing what you see.", "You have met every one of them."],
                 ["Think about sizes, the vanishing point, guide lines and darks."],
                 [],
                 ["Read it, look at the picture, then tap."]),
             {"label": "Drawing", "items": [
                 q("Lines going away from you meet at…", "🎯", "the vanishing point, on the horizon", ["the corner", "the top of the page"], "They meet at one spot on the horizon, level with your eyes."),
                 q("Far things are drawn…", "🏔️", "smaller, paler and higher up", ["bigger and darker", "exactly the same"], "Small, pale and higher up reads as far away."),
                 q("What is a guide line?", "✏️", "a light line that helps you place things", ["the darkest line", "a line of glue"], "Guide lines are light, and easy to rub out."),
                 q("How do you compare sizes while you draw?", "📏", "hold your pencil out at arm's length and measure", ["guess", "use a calculator"], "A pencil held at arm's length measures one thing against another."),
             ]},
             "You know how to draw what is really there."),

        step("quiz", "Show what you know", "⭐", "Star observer", ["4E.02", "4E.03", "4M.01", "4R.02", "4TWA.02"],
             "Time to show what you know. Tap the answer.",
             explain(
                 ["No new ideas here.", "Every question uses something you have already done in this lesson."],
                 ["Think about the street, near and far, guide lines and the order of a drawing."],
                 [],
                 ["Take your time. Read it, look at it, then tap."]),
             {"items": [
                 q("The same lamp post, further away, looks…", "🏮", "smaller", ["bigger", "exactly the same"], "Distance makes things look smaller."),
                 q("Why draw the nearest edge darkest?", "⬛", "because dark edges come forward, so it reads as nearest", ["because dark is prettier", "to use up the pencil"], "Dark comes forward, pale goes back."),
                 q("Where is the vanishing point in a street drawing?", "🎯", "on the horizon, where the lines going away meet", ["at the bottom left", "outside the page"], "It sits on the horizon, at the level of your own eyes."),
                 q("Why start with light guide lines?", "✏️", "because you can still change them", ["because the pencil is broken", "because light lines are prettier"], "Light lines can be moved. Heavy ones cannot."),
                 q("Which shows something is far away?", "🌫️", "pale, small and hardly any detail", ["dark, big and full of detail", "a thick black outline"], "Far things lose size, darkness and detail."),
                 q("What do you draw first?", "👀", "the biggest shapes, after looking", ["the eyelashes", "your name"], "Biggest shapes first, detail last."),
                 q("Holding a pencil out at arm's length is for…", "📏", "comparing sizes", ["cleaning the pencil", "measuring the room in metres"], "It compares one size against another."),
                 q("A tree drawn big at the bottom of the page reads as…", "🌳", "near", ["far", "upside down"], "Big and low down means close to you."),
             ]},
             "That is the whole lesson finished. You can draw what is really in front of you."),
    ],
}


LESSON["about"] = [
    "Say why the same thing looks smaller further away.",
    "Find the vanishing point in a street.",
    "Sort near from far in a drawing.",
    "Draw guide lines, and keep the darks for last.",
    "Put a drawing together in the right order.",
]

LESSON["lecture"] = [
    part("🔭", "It only looks smaller",
         "Nothing shrinks when it walks away from you. It only looks smaller, and a drawing shows what things look like. The same lamp post can be tall, then half as tall, then a thumbnail."),
    part("🎯", "One vanishing point",
         "Draw a street going away and the two edges of the road head for the same spot. So do the tops of the houses and the line of lamp posts. That spot sits on the horizon, level with your own eyes, and it is called the vanishing point."),
    part("✏️", "Guide lines first",
         "Start light. Thin, pale lines find where things go, and you can still move them. Compare sizes by holding your pencil out at arm's length. The darks go in last."),
    part("👟", "Near and far",
         "Near things are bigger, lower down the page, full of detail and drawn darkest. Far things are smaller, higher up, pale and plain. Use all four and your picture has depth."),
]

LESSON["words"] = [
    word("viewpoint", "👁️", "The place you are looking from, and so the side of a thing you see.",
         ["From this viewpoint the tree hides the house.", "I drew it from a low viewpoint."]),
    word("vanishing point", "🎯", "The spot on the horizon where lines going away from you meet.",
         ["The road meets at the vanishing point.", "I marked the vanishing point first."]),
    word("horizon", "🌅", "The line where the ground seems to meet the sky.",
         ["The horizon is level with my eyes.", "I drew the horizon first."]),
    word("guide line", "✏️", "A light line that helps you place things, and is rubbed out later.",
         ["I drew guide lines for the roof.", "Keep guide lines pale."]),
    word("proportion", "📏", "How big one part is compared with another.",
         ["The arms are out of proportion.", "I measured the proportions with my pencil."]),
    word("detail", "🔍", "The small parts you can only see up close.",
         ["The near door has lots of detail.", "Far houses have no detail."]),
]

LESSON["home"] = [
    home("A street from your window", "Paper, an HB pencil and a soft pencil or charcoal",
         ["Find a road, a corridor or a row of chairs going away from you.",
          "Mark the spot where the edges would meet, then draw the edges towards it.",
          "Draw the nearest thing biggest and darkest."],
         "Where was your vanishing point?"),
    home("Pencil measuring", "A pencil, paper, and something to draw, like a mug or a shoe",
         ["Hold the pencil out at arm's length and measure the height with your thumb.",
          "Now measure the width the same way. How many widths make the height?",
          "Draw it at that proportion."],
         "Was it wider or taller than you expected?"),
    home("Near, middle, far", "Paper and one pencil",
         ["Draw the same tree three times: big at the bottom, middle-sized higher up, tiny near the middle.",
          "Give the near one bark, leaves and branches.", "Give the far one no detail at all."],
         "Which one looks furthest away, and why?"),
]

LESSON["journal"] = {
    "changes": ["press more lightly on the guide lines", "make the near thing bigger", "leave the far things plainer", "darken the nearest edge", "keep it just as it is"],
}

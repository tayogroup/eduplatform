# -*- coding: utf-8 -*-
"""Lesson 2 — Area, Volume and What They Cost.

Shapes and Measurements, units SM.03 (perimeter and area) and SM.04
(volume, capacity and mass). Eight criteria.

Every question is a quantity somebody has to order: tiles for a floor,
sheet for a gable, concrete for a trench, water for a tank, feed by mass.
"""
from _kit import step, opt, q, word

LESSON = {
    "slug": "area-volume-and-what-they-cost",
    "title": "Area, Volume and What They Cost",
    "module": "shapes-measures",
    "blurb": (
        "Work out the perimeter and area of a floor, split an awkward room into "
        "rectangles, take the openings out of a wall, and calculate the volume of a "
        "trench, a drum and the mass of what fills them."
    ),
    "outcomes": [
        "Calculate the perimeter of a rectangle and of an L-shaped room.",
        "Calculate the area of a rectangle, a triangle and a circle.",
        "Split an irregular shape into rectangles and check the split accounts for all of it.",
        "Subtract doors and windows from a wall area before ordering.",
        "Calculate the volume of a rectangular solid and of a cylinder.",
        "Convert cubic metres to litres, and find a mass from a volume and a density.",
    ],
    "steps": [

        step("calc", "Perimeter: the edge of the job", ["ADOW-SM-SM.03.1"],
             {"finish": "Perimeter buys skirting, kerbing, fencing and edging — anything sold by the metre that goes round the outside.",
              "items": [
                  {"ask": "This floor is 4.0 m by 2.5 m. What is its perimeter?",
                   "draw": "rectRoom", "unit": "m", "answer": 13, "tol": 0,
                   "working": ["Perimeter = all four sides added", "4.0 + 2.5 + 4.0 + 2.5", "= 13.0 m"],
                   "why": "Thirteen metres. Two long sides and two short ones — or 2 × (4.0 + 2.5), which is the same sum done faster."},

                  {"ask": "This L-shaped floor is 5.0 m across the top and 3.6 m down the left. Its perimeter is the whole outside edge. What is it?",
                   "draw": "lRoom", "unit": "m", "answer": 17.2, "tol": 0.1,
                   "working": ["Going round: 5.0 + 3.6 + 2.6 + 1.8 + 2.4 + 1.8", "The two short legs of the step are 1.8 m and 2.4 m",
                               "= 17.2 m"],
                   "why": "17.2 m. An L has six sides, not four — and the perimeter of an L is the SAME as the rectangle it came from, because the step trades the same length back."},
              ]},
             error=("Reaching for the area formula because the shape is a rectangle.",
                    "Perimeter and area answer different questions. Skirting is bought by the "
                    "metre and tiles by the square metre, and ordering one by the other's figure "
                    "is a mistake nobody notices until the material arrives.")),

        step("calc", "Area: the surface of the job", ["ADOW-SM-SM.03.2"],
             {"finish": "Rectangle: length × width. Triangle: half base × height. Circle: π r². Three formulas cover most of a working day.",
              "items": [
                  {"ask": "The same floor, 4.0 m by 2.5 m. What is its area?",
                   "draw": "rectRoom", "unit": "m²", "answer": 10, "tol": 0,
                   "working": ["Area of a rectangle = length × width", "4.0 × 2.5", "= 10.0 m²"],
                   "why": "Ten square metres. Note the unit changed on its own: metres times metres gives square metres."},

                  {"ask": "This gable end is 3.0 m across the base and 1.5 m high. What is its area?",
                   "draw": "triangleGable", "unit": "m²", "answer": 2.25, "tol": 0.01,
                   "working": ["Area of a triangle = ½ × base × height", "½ × 3.0 × 1.5", "= 2.25 m²"],
                   "why": "2.25 m². The height is the PERPENDICULAR height — straight up from the base — not the length of the sloping side."},

                  {"ask": "A circular tank base has a radius of 1.2 m. What is its area? Use π = 3.14.",
                   "draw": "circleTank", "unit": "m²", "answer": 4.52, "tol": 0.05,
                   "working": ["Area of a circle = π × r × r", "3.14 × 1.2 × 1.2", "= 3.14 × 1.44", "= 4.52 m²"],
                   "why": "About 4.52 m². Square the radius first, then multiply by π — and remember it is the RADIUS, half the width across."},
              ]},
             error=("Using the diameter where the formula asks for the radius.",
                    "It gives an answer four times too big, because the radius is squared. If a "
                    "circular answer looks wildly large, this is the first thing to check.")),

        step("calc", "Splitting an awkward shape", ["ADOW-SM-SM.03.3"],
             {"finish": "Cut it into rectangles, do each one, add them up — and check the pieces account for the whole shape and nothing twice.",
              "items": [
                  {"ask": "This L-shaped floor splits into A (2.4 m × 3.6 m) and B (2.6 m × 1.8 m). What is the total area?",
                   "draw": "lRoom", "unit": "m²", "answer": 13.32, "tol": 0.05,
                   "working": ["A: 2.4 × 3.6 = 8.64 m²", "B: 2.6 × 1.8 = 4.68 m²", "8.64 + 4.68 = 13.32 m²"],
                   "why": "13.32 m². Any split works as long as the pieces cover the whole shape once each — split it the other way and you get the same total, which is the check."},
              ]},
             error=("Splitting so the pieces overlap, and counting the overlap twice.",
                    "Draw the split on the sketch before calculating anything. If two rectangles "
                    "share a strip, that strip is in the total twice and the order comes in over.")),

        step("calc", "Taking the openings out", ["ADOW-SM-SM.03.4"],
             {"finish": "Gross area, minus the openings, plus a waste allowance. In that order, and each figure written down.",
              "items": [
                  {"ask": "A wall is 6.0 m × 2.4 m. It has a door 2.0 m × 0.9 m and a window 1.2 m × 1.0 m. What area is left to be covered?",
                   "unit": "m²", "answer": 11.4, "tol": 0.05,
                   "working": ["Wall: 6.0 × 2.4 = 14.4 m²", "Door: 2.0 × 0.9 = 1.8 m²", "Window: 1.2 × 1.0 = 1.2 m²",
                               "14.4 − 1.8 − 1.2 = 11.4 m²"],
                   "why": "11.4 m². Working out the gross area and forgetting the openings is how a job comes in over on material every time."},
              ]},
             error=("Deducting the openings AND then adding a waste allowance on the gross figure.",
                    "The allowance goes on the NET area — the surface you are actually covering. "
                    "Applied to the gross it quietly pays for the door twice.")),

        step("calc", "Volume: the space the job fills",
             ["ADOW-SM-SM.04.1", "ADOW-SM-SM.04.2", "ADOW-SM-SM.04.4"],
             {"finish": "Rectangular solid: length × width × depth. Cylinder: π r² × height — the circle's area, then how tall it is.",
              "items": [
                  {"ask": "This trench is 6.0 m long, 0.5 m wide and 0.8 m deep. How much soil comes out of it?",
                   "draw": "boxTrench", "unit": "m³", "answer": 2.4, "tol": 0.01,
                   "working": ["Volume = length × width × depth", "6.0 × 0.5 × 0.8", "= 2.4 m³"],
                   "why": "2.4 cubic metres. That is also what it takes to backfill — and roughly what a small tipper carries, which is why the figure matters before anybody digs."},

                  {"ask": "A drum is 0.3 m in radius and 0.9 m tall. What is its volume? Use π = 3.14.",
                   "draw": "cylinderDrum", "unit": "m³", "answer": 0.254, "tol": 0.006,
                   "working": ["Base area = π r² = 3.14 × 0.3 × 0.3 = 0.2826 m²", "Volume = base area × height",
                               "0.2826 × 0.9 = 0.254 m³"],
                   "why": "About 0.254 m³. A cylinder is its circular base, repeated all the way up — which is why you find the area first and multiply by the height."},

                  {"ask": "How many litres does that drum hold?",
                   "draw": "cylinderDrum", "unit": "litres", "answer": 254, "tol": 6,
                   "working": ["1 m³ = 1000 litres", "0.254 × 1000", "= 254 litres"],
                   "why": "About 254 litres — which is why a standard drum is called a 200-litre drum and this one is bigger than standard. Litres is the unit anyone actually buying liquid will use."},
              ]},
             error=("Mixing units inside a volume calculation.",
                    "Depth in centimetres and length in metres gives an answer out by a hundred. "
                    "Put all three dimensions in metres first, then multiply.")),

        step("calc", "From volume to mass", ["ADOW-SM-SM.04.3"],
             {"finish": "Mass = volume × density. The density comes from a table, and the units in the table tell you which units the volume must be in.",
              "items": [
                  {"ask": "Wet concrete has a density of about 2400 kg per cubic metre. What is the mass of 2.4 m³?",
                   "unit": "kg", "answer": 5760, "tol": 0,
                   "working": ["Mass = volume × density", "2.4 × 2400", "= 5760 kg"],
                   "why": "5760 kg — nearly six tonnes. This is the figure that decides whether formwork and a floor will carry the pour, so it is not an academic number."},

                  {"ask": "Water has a density of 1000 kg per cubic metre. What is the mass of the drum's 0.254 m³?",
                   "unit": "kg", "answer": 254, "tol": 6,
                   "working": ["Mass = volume × density", "0.254 × 1000", "= 254 kg"],
                   "why": "254 kg. Water is the easy one: a litre weighs a kilogram, so the litres and the kilograms are the same number — and it is a quarter of a tonne, which is more than one person moves."},
              ]},
             error=("Assuming a full drum of anything can be lifted or rolled by hand.",
                    "A quarter of a tonne does not move because somebody is strong. Work the mass "
                    "out before planning how a thing will be handled, not after it is full.")),

        step("words", "The words of this job", ["ADOW-SM-SM.03.1"],
             {"items": [
                 word("perimeter", "The distance right round the outside of a shape. Buys anything sold by the metre."),
                 word("area", "The size of a surface, in square units. Buys sheet, tile, paint, mesh."),
                 word("volume", "The size of a space, in cubic units. Buys concrete, soil, water, grain."),
                 word("gross area", "The whole surface before openings are taken out."),
                 word("net area", "What is left after the doors and windows are deducted. The figure you order against."),
                 word("perpendicular height", "The height measured straight up from the base at a right angle — not along a slope."),
                 word("radius", "From the centre of a circle to its edge. Half the diameter, and the figure every circle formula wants."),
                 word("density", "Mass per unit of volume, e.g. kilograms per cubic metre. Turns a volume into a weight."),
             ]}),
    ],
}

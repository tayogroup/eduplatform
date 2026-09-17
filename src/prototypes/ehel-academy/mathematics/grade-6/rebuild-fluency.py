# -*- coding: utf-8 -*-
"""Give the Grade 6 fluency sprint its own questions.

    python rebuild-fluency.py            # report
    python rebuild-fluency.py --write

THE SPRINT IS CURRENTLY THE PRACTICE SET, VERBATIM. Measured across all 204
fluency items in the 17 units: every one has a prompt that also appears in
practice, and in every case the ANSWER is identical too. A child who works
through Practice and then opens Math Fluency is asked the same twelve questions
again.

THAT IS A REGRESSION, NOT THE CONTENT MODEL, and Grade 1 is the proof:

    grade   fluency prompts that also appear in practice
    1       33 of 180   (18%)
    2-8     99% to 100%

Grade 1's fluency items are different questions on the same objectives. Every
other grade copies. This fixes Grade 6; the same measurement stands for 2, 3, 4,
5, 7 and 8, and is reported rather than quietly fixed here.

THE ANSWERS ARE COMPUTED, NOT ASSERTED. This subject's rule is that keys are
checked by working them out, because the questions are authored and no booklet
holds them. An item here gives an EXPRESSION rather than an answer wherever the
mathematics is computable, and the tool evaluates it: the key cannot disagree
with the question, because the key is derived from it.
`check-math-answer-keys.mjs` reaches none of this - it reads `assessment` only -
so without this the fluency keys would have no gate at all.

Items that are not computable - a shape's name, a probability word, a property -
give a literal answer and are counted separately, exactly as that gate counts
what it cannot reach rather than passing it.

THEY ARE SHORT, AND THAT IS DELIBERATE. The sprint takes a typed answer through
`<input inputmode="numeric">` and grades it with `answerMatches`, which pulls the
asserted values out of the key. Practice answers are prose - "5 hundredths
(0.05).", "a) 7.024, b) 0.375." - which is fine on a page with a Show answer
button and poor in a timed box. Fluency here asks one thing and wants one value.
"""
import io, json, os, re, sys
from fractions import Fraction

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.join(HERE, "data", "units")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g6-fluency"

# (prompt, spec). spec is ("=", expression) for a computed key, or
# ("lit", answer) where the mathematics is not an arithmetic expression.
E = lambda x: ("=", x)
L = lambda x: ("lit", x)

ITEMS = {
 1: [  # Number and Place Value
  ("What is the value of the digit 7 in 3.472?", E("0.07")),
  ("What is 4.6 x 10?", E("4.6*10")),
  ("What is 250 / 100?", E("250/100")),
  ("Round 6.48 to one decimal place.", E("6.5")),
  ("Write in figures: three million, four hundred thousand and twenty.", E("3400020")),
  ("What is 0.375 x 1000?", E("0.375*1000")),
  ("What is the value of the digit 9 in 1,946,200?", E("900000")),
  ("What is 82.5 / 10?", E("82.5/10")),
  ("Round 149,620 to the nearest thousand.", E("150000")),
  ("What is 7 + 0.4 + 0.06 as a single number?", E("7+0.4+0.06")),
  ("Which is larger, 0.7 or 0.68?", L("0.7")),
  ("How many thousandths are there in 0.025?", E("25")),
 ],
 2: [  # Numbers and Sequences
  ("A sequence starts at 4 and the rule is add 7. What is the third term?", E("4+7+7")),
  ("What is the next term after 96 in the sequence 6, 21, 36, ...?", E("96+15")),
  ("A sequence goes 100, 88, 76. What is the term-to-term rule? Give the number you subtract.", E("12")),
  ("What is the 5th multiple of 9?", E("9*5")),
  ("Continue: 3, 6, 12, 24. What comes next?", E("48")),
  ("A sequence starts at -6 and adds 4 each time. What is the third term?", E("-6+4+4")),
  ("What is the 10th term of the sequence that starts at 5 and adds 5?", E("5*10")),
  ("Is 51 a prime number? Answer yes or no.", L("No")),
  ("What is the square of 12?", E("12*12")),
  ("What is the cube of 4?", E("4**3")),
  ("What is the square root of 169?", E("13")),
  ("What is the 6th triangular number?", E("1+2+3+4+5+6")),
 ],
 3: [  # Averages
  ("What is the mean of 4, 8 and 9?", E("(4+8+9)/3")),
  ("What is the median of 3, 9, 4, 7, 5?", E("5")),
  ("What is the mode of 2, 5, 5, 7, 9?", E("5")),
  ("What is the range of 12, 4, 9, 20?", E("20-4")),
  ("What is the mean of 10, 20, 30 and 40?", E("(10+20+30+40)/4")),
  ("Five numbers have a mean of 6. What is their total?", E("6*5")),
  ("What is the median of 8, 2, 6, 4?", E("(4+6)/2")),
  ("What is the range of 3.5 and 9.1?", E("9.1-3.5")),
  ("The mean of 3 numbers is 12 and two of them are 9 and 11. What is the third?", E("12*3-9-11")),
  ("What is the mode of 1, 1, 2, 3, 3, 3?", E("3")),
  ("What is the mean of 7 and 12?", E("(7+12)/2")),
  ("A set has range 15 and smallest value 8. What is the largest value?", E("8+15")),
 ],
 4: [  # Addition and Subtraction (1)
  ("What is 4,506 + 2,398?", E("4506+2398")),
  ("What is 8,003 - 4,517?", E("8003-4517")),
  ("What is 3.6 + 2.45?", E("3.6+2.45")),
  ("What is 10 - 3.75?", E("10-3.75")),
  ("What is 12,400 + 9,650?", E("12400+9650")),
  ("What is -6 + 15?", E("-6+15")),
  ("What is 7 - 19?", E("7-19")),
  ("What is 0.9 + 0.35?", E("0.9+0.35")),
  ("What is 5,000 - 2,749?", E("5000-2749")),
  ("What is 18.2 - 9.75?", E("18.2-9.75")),
  ("What is -4 - 9?", E("-4-9")),
  ("What is 2,875 + 6,125?", E("2875+6125")),
 ],
 5: [  # 2D Shapes
  ("How many sides has a heptagon?", E("7")),
  ("How many lines of symmetry has a square?", E("4")),
  ("What do the angles inside a triangle add up to, in degrees?", E("180")),
  ("What do the angles inside a quadrilateral add up to, in degrees?", E("360")),
  ("How many pairs of parallel sides has a parallelogram?", E("2")),
  ("A regular pentagon has a perimeter of 45 cm. How long is one side, in cm?", E("45/5")),
  ("How many lines of symmetry has an equilateral triangle?", E("3")),
  ("What is the name of a shape with 8 sides?", L("An octagon")),
  ("A rectangle is 12 cm by 5 cm. What is its perimeter, in cm?", E("2*(12+5)")),
  ("How many right angles are there in a full turn?", E("4")),
  ("A regular hexagon has one side of 9 cm. What is its perimeter, in cm?", E("9*6")),
  ("Is a square also a rectangle? Answer yes or no.", L("Yes")),
 ],
 6: [  # Fractions and Percentages
  ("What is 1/2 + 1/4?", E("Fraction(1,2)+Fraction(1,4)")),
  ("What is 50% of 84?", E("0.5*84")),
  ("What is 3/4 as a percentage?", E("75")),
  ("What is 10% of 350?", E("0.1*350")),
  ("What is 2/5 + 1/5?", E("Fraction(2,5)+Fraction(1,5)")),
  ("What is 25% of 160?", E("0.25*160")),
  ("What is 0.6 as a percentage?", E("60")),
  ("What is 3/8 + 1/8?", E("Fraction(3,8)+Fraction(1,8)")),
  ("What is 1 - 2/3?", E("1-Fraction(2,3)")),
  ("What is 75% of 40?", E("0.75*40")),
  ("What is 1/5 as a decimal?", E("1/5")),
  ("What is 5/6 - 1/3?", E("Fraction(5,6)-Fraction(1,3)")),
 ],
 7: [  # Exploring Measures: Area & Time
  ("A rectangle is 7 cm by 6 cm. What is its area, in square cm?", E("7*6")),
  ("A triangle has base 10 cm and height 8 cm. What is its area, in square cm?", E("10*8/2")),
  ("How many minutes are there in 3.5 hours?", E("3.5*60")),
  ("A film starts at 14:20 and lasts 95 minutes. What time does it end? Give the hour and minutes.", L("15:55")),
  ("A square has area 49 square cm. How long is one side, in cm?", E("7")),
  ("How many seconds are there in 4 minutes?", E("4*60")),
  ("A rectangle has area 60 square cm and one side 12 cm. How long is the other side, in cm?", E("60/12")),
  ("How many hours are there in 3 days?", E("3*24")),
  ("A triangle has base 14 cm and height 5 cm. What is its area, in square cm?", E("14*5/2")),
  ("What is 18:45 on a 12-hour clock? Give the time and say am or pm.", L("6:45 pm")),
  ("How many minutes are there between 09:40 and 10:25?", E("45")),
  ("A rectangle is 2.5 m by 4 m. What is its area, in square metres?", E("2.5*4")),
 ],
 8: [  # Addition and Subtraction (2)
  ("What is 23.7 + 46.85?", E("23.7+46.85")),
  ("What is 100 - 37.4?", E("100-37.4")),
  ("What is 6,248 + 3,957?", E("6248+3957")),
  ("What is 20,000 - 13,486?", E("20000-13486")),
  ("What is -15 + 8?", E("-15+8")),
  ("What is 12 - (-5)?", E("12-(-5)")),
  ("What is 0.45 + 0.7 + 1.05?", E("0.45+0.7+1.05")),
  ("What is 9.6 - 4.85?", E("9.6-4.85")),
  ("What is -20 + 35 - 5?", E("-20+35-5")),
  ("What is 45,000 + 68,500?", E("45000+68500")),
  ("What is 7.05 - 2.9?", E("7.05-2.9")),
  ("What is the difference between -7 and 6?", E("6-(-7)")),
 ],
 9: [  # Probability
  ("A fair coin is flipped. What is the probability of heads, as a fraction?", L("1/2")),
  ("A fair six-sided dice is rolled. What is the probability of rolling a 4, as a fraction?", L("1/6")),
  ("A bag has 3 red and 7 blue counters. How many counters altogether?", E("3+7")),
  ("A fair dice is rolled. What is the probability of an even number, as a fraction?", L("1/2")),
  ("A spinner has 5 equal sections, 2 of them green. What is the probability of green, as a fraction?", L("2/5")),
  ("If the probability of rain is 0.3, what is the probability of no rain?", E("1-0.3")),
  ("A bag has 4 red and 6 blue counters. What is the probability of red, as a fraction?", L("2/5")),
  ("Out of 20 spins, a colour came up 5 times. What fraction of spins is that, in its simplest form?", L("1/4")),
  ("An event is certain. What is its probability?", E("1")),
  ("An event is impossible. What is its probability?", E("0")),
  ("A dice is rolled. What is the probability of a number greater than 4, as a fraction?", L("1/3")),
  ("If the probability of an event is 25%, what is it as a decimal?", E("0.25")),
 ],
 10: [  # Multiplication and Division (1)
  ("What is 24 x 7?", E("24*7")),
  ("What is 156 / 4?", E("156/4")),
  ("What is 32 x 20?", E("32*20")),
  ("What is 8 x 0.5?", E("8*0.5")),
  ("What is 245 / 5?", E("245/5")),
  ("What is 13 x 12?", E("13*12")),
  ("What is 4.2 x 3?", E("4.2*3")),
  ("What is 96 / 8?", E("96/8")),
  ("What is 7 x 400?", E("7*400")),
  ("What is 144 / 12?", E("144/12")),
  ("What is 2.5 x 4?", E("2.5*4")),
  ("What is 630 / 9?", E("630/9")),
 ],
 11: [  # 3D Shapes
  ("How many faces has a cube?", E("6")),
  ("How many edges has a cube?", E("12")),
  ("How many vertices has a cube?", E("8")),
  ("How many faces has a square-based pyramid?", E("5")),
  ("A cube has edges of 4 cm. What is its volume, in cubic cm?", E("4**3")),
  ("How many faces has a triangular prism?", E("5")),
  ("A cuboid is 3 cm by 4 cm by 5 cm. What is its volume, in cubic cm?", E("3*4*5")),
  ("How many vertices has a triangular prism?", E("6")),
  ("What 2D shape is every face of a cube?", L("A square")),
  ("How many edges has a square-based pyramid?", E("8")),
  ("A cube has volume 27 cubic cm. How long is one edge, in cm?", E("3")),
  ("How many curved surfaces has a cylinder?", E("1")),
 ],
 12: [  # Ratio and Proportion
  ("Simplify the ratio 10 : 15. Give the two numbers.", L("2 : 3")),
  ("Share 40 in the ratio 3 : 5. What is the larger share?", E("40*5//8")),
  ("In a ratio 2 : 3 there are 8 of the first. How many of the second?", E("8*3//2")),
  ("Share 24 in the ratio 1 : 2. What is the smaller share?", E("24*1//3")),
  ("If 3 pens cost 15 shillings, what does 1 pen cost?", E("15/3")),
  ("If 4 books cost 32 shillings, what do 6 books cost?", E("32/4*6")),
  ("Simplify the ratio 12 : 18. Give the two numbers.", L("2 : 3")),
  ("A recipe for 2 people needs 300 g of rice. How much for 6 people, in grams?", E("300/2*6")),
  ("Share 45 in the ratio 4 : 5. What is the larger share?", E("45*5//9")),
  ("In a class the ratio of girls to boys is 3 : 4 and there are 12 girls. How many boys?", E("12*4//3")),
  ("If 5 litres cost 20 shillings, what do 2 litres cost?", E("20/5*2")),
  ("Share 100 in the ratio 1 : 4. What is the smaller share?", E("100*1//5")),
 ],
 13: [  # Angles
  ("Two angles on a straight line: one is 115 degrees. What is the other?", E("180-115")),
  ("Angles at a point add to 360. Three are 90, 120 and 60. What is the fourth?", E("360-90-120-60")),
  ("A triangle has angles 40 and 75 degrees. What is the third?", E("180-40-75")),
  ("What size is a right angle, in degrees?", E("90")),
  ("What size is each angle in an equilateral triangle, in degrees?", E("180//3")),
  ("Two angles in a quadrilateral are 100 and 80. The other two are equal. What is each, in degrees?", E("(360-100-80)//2")),
  ("An angle of 200 degrees is called what?", L("A reflex angle")),
  ("An isosceles triangle has a top angle of 40 degrees. What is each base angle, in degrees?", E("(180-40)//2")),
  ("What do angles on a straight line add up to, in degrees?", E("180")),
  ("An angle is 47 degrees. Is it acute or obtuse?", L("Acute")),
  ("Two angles are vertically opposite and one is 62 degrees. What is the other?", E("62")),
  ("A quarter turn is how many degrees?", E("90")),
 ],
 14: [  # Multiplication and Division (2)
  ("What is 46 x 23?", E("46*23")),
  ("What is 504 / 8?", E("504/8")),
  ("What is 125 x 4?", E("125*4")),
  ("What is 1,000 / 25?", E("1000/25")),
  ("What is 3.5 x 6?", E("3.5*6")),
  ("What is 72 / 0.9?", E("72/0.9")),
  ("What is 15 x 14?", E("15*14")),
  ("What is 847 / 7?", E("847/7")),
  ("What is 0.6 x 0.4?", E("0.6*0.4")),
  ("What is 36 x 25?", E("36*25")),
  ("What is 918 / 6?", E("918/6")),
  ("What is 2.4 / 0.6?", E("2.4/0.6")),
 ],
 15: [  # Data
  ("A bar chart bar reaches 35 on a scale marked in 5s. What value is that?", E("35")),
  ("In a pictogram one symbol means 4 books. What do 6 symbols mean?", E("6*4")),
  ("A pie chart shows half the class chose football out of 30 pupils. How many is that?", E("30/2")),
  ("Five results are 3, 7, 7, 8, 10. What is the mode?", E("7")),
  ("A tally shows three complete groups of five and two more. What is the total?", E("3*5+2")),
  ("In a pictogram one symbol means 10. What do 2 and a half symbols mean?", E("2.5*10")),
  ("A survey of 50 people found 30 said yes. What percentage said yes?", E("30/50*100")),
  ("A bar chart scale goes up in 20s. How much is half a division?", E("10")),
  ("Four results are 12, 15, 15, 18. What is the range?", E("18-12")),
  ("A pie chart quarter represents 8 people. How many people altogether?", E("8*4")),
  ("In a frequency table the frequencies are 4, 6 and 10. What is the total frequency?", E("4+6+10")),
  ("What is the mean of 6, 6, 9 and 11?", E("(6+6+9+11)/4")),
 ],
 16: [  # The Laws of Arithmetic
  ("What is 3 + 5 x 2?", E("3+5*2")),
  ("What is (3 + 5) x 2?", E("(3+5)*2")),
  ("What is 20 - 6 / 2?", E("20-6/2")),
  ("What is 4 x (10 - 3)?", E("4*(10-3)")),
  ("What is 2 x 3 + 4 x 5?", E("2*3+4*5")),
  ("What is 100 / (2 x 5)?", E("100/(2*5)")),
  ("What is 7 + 7 / 7?", E("7+7/7")),
  ("Use the distributive law: what is 6 x 23?", E("6*23")),
  ("What is 12 x 5 x 2?", E("12*5*2")),
  ("What is 50 - (8 + 12)?", E("50-(8+12)")),
  ("What is 9 x 4 - 6?", E("9*4-6")),
  ("What is 2 + 3 x 4 - 5?", E("2+3*4-5")),
 ],
 17: [  # Transformations
  ("A point at (3, 5) is translated 2 right and 1 down. What is its new x coordinate?", E("3+2")),
  ("A point at (3, 5) is translated 2 right and 1 down. What is its new y coordinate?", E("5-1")),
  ("A shape is reflected in a mirror line. Does its size change? Answer yes or no.", L("No")),
  ("A point at (4, 2) is reflected in the y-axis. What is its new x coordinate?", E("-4")),
  ("A shape is rotated a quarter turn. How many degrees is that?", E("90")),
  ("A point at (1, 6) is translated 3 left. What is its new x coordinate?", E("1-3")),
  ("A point at (2, -3) is reflected in the x-axis. What is its new y coordinate?", E("3")),
  ("How many degrees is a half turn?", E("180")),
  ("A point at (0, 4) is translated 5 right and 4 down. What is its new y coordinate?", E("4-4")),
  ("After a translation, is the shape the same size? Answer yes or no.", L("Yes")),
  ("A point at (7, 1) is reflected in the y-axis. What is its new x coordinate?", E("-7")),
  ("Three quarter turns is how many degrees?", E("90*3")),
 ],
}


def fmt(v):
    if isinstance(v, Fraction):
        return "%d/%d" % (v.numerator, v.denominator) if v.denominator != 1 else str(v.numerator)
    if isinstance(v, float):
        if abs(v - round(v)) < 1e-9:
            return str(int(round(v)))
        return ("%.10f" % v).rstrip("0").rstrip(".")
    return str(v)


# ---- audits ------------------------------------------------------------------
if sorted(ITEMS) != list(range(1, 18)):
    sys.exit("  REFUSED: expected units 1-17, got %s" % sorted(ITEMS))
computed = literal = 0
KEYS = {}
for uno, rows in ITEMS.items():
    if len(rows) != 12:
        sys.exit("  REFUSED unit %d: %d items, the sprint holds 12" % (uno, len(rows)))
    seen = set()
    for prompt, (kind, spec) in rows:
        if prompt.lower() in seen:
            sys.exit("  REFUSED unit %d: duplicate prompt %r" % (uno, prompt))
        seen.add(prompt.lower())
        if kind == "=":
            try:
                val = eval(spec, {"__builtins__": {}, "Fraction": Fraction})  # noqa: S307
            except Exception as exc:
                sys.exit("  REFUSED unit %d: %r will not evaluate (%s)" % (uno, spec, exc))
            KEYS[(uno, prompt)] = fmt(val)
            computed += 1
        else:
            KEYS[(uno, prompt)] = spec
            literal += 1

pages = sorted(os.listdir(UNITS), key=lambda x: int("".join(c for c in x if c.isdigit()) or 0))
todo, refused, dup_left = [], 0, 0
for f in pages:
    p = os.path.join(UNITS, f)
    u = json.load(io.open(p, encoding="utf-8"))
    uno = u["unit"]["unitNo"]
    if uno not in ITEMS:
        continue
    old = u.get("fluency") or []
    prac = {" ".join(str(q.get("prompt") or "").lower().split()) for q in (u.get("practice") or [])}
    if len(old) != 12:
        print("  REFUSED    unit %-3d had %d fluency items, not 12" % (uno, len(old)))
        refused += 1
        continue

    new = []
    for i, (prompt, _) in enumerate(ITEMS[uno]):
        key = " ".join(prompt.lower().split())
        if key in prac:
            print("  REFUSED    unit %-3d new item %d repeats a practice prompt" % (uno, i + 1))
            refused += 1
            new = None
            break
        src = old[i] if i < len(old) else {}
        new.append({
            "id": "fl%02d" % (i + 1),
            "outcomeId": src.get("outcomeId") or "lo%02d" % (i % 6 + 1),
            "difficulty": src.get("difficulty") or "Round 1",
            "prompt": prompt,
            "answer": KEYS[(uno, prompt)],
            "hint": "Work it out, then type just the value.",
            "errorFeedback": "The answer is %s." % KEYS[(uno, prompt)],
        })
    if new is None:
        continue
    u["fluency"] = new
    todo.append((p, u, uno))
    still = sum(1 for q in new if " ".join(q["prompt"].lower().split()) in prac)
    dup_left += still
    print("  would      unit %-3d %-34s 12 new items, %d still repeat practice"
          % (uno, u["unit"]["unitTitle"][:34], still))

if WRITE:
    for p, u, _ in todo:
        io.open(p, "w", encoding="utf-8", newline="\n").write(
            json.dumps(u, ensure_ascii=False, indent=2) + "\n")

print("")
print("  %d item(s) across %d unit(s) %s, %d refused"
      % (len(todo) * 12, len(todo), "written" if WRITE else "to write", refused))
print("  keys COMPUTED from the question: %d    literal (not an expression): %d"
      % (computed, literal))
print("  new prompts that still repeat practice: %d" % dup_left)
if not WRITE:
    print("  (--write to apply)")

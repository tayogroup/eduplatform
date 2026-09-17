# -*- coding: utf-8 -*-
"""Give each practice question a hint about THAT question.

    python fix-practice-hints.py            # report
    python fix-practice-hints.py --write

THE HINT IS THE SAME SENTENCE ALL THE WAY DOWN A UNIT. Measured across the 17
units: 204 practice items share 17 hints between them, one per unit, each of the
form

    "Show the information first - a bar model, a number line or a jotting. Then
     name which idea you are using: Digit or Place value."

The only part that changes between units is the two concept names on the end. So
a child stuck on "Write 3.142 in expanded form" and a child stuck on "Round
8.2749 to the nearest thousandth" are told the same thing, and it is advice
about how to do mathematics in general rather than help with the question in
front of them.

FLUENCY IS DELIBERATELY NOT TOUCHED, and that is a judgement worth stating
rather than an oversight. Its 204 items share "Work it out, then type just the
value." - which looks like the same defect and is not: the sprint is a timed
drill with a numeric input, and that sentence tells the child the ANSWER FORMAT,
which is the one thing the box needs them to know. Scaffolding the method in a
speed drill would be working against what the drill is for.

WHY RULES AND NOT 204 AUTHORED LINES. The practice questions are nearly all
unique - 187 distinct opening shapes across 204 items, 178 of them occurring
once - so there is no shape to key on and no small set of hints that covers
them. What IS shared is the OPERATION: "Calculate 1/2 x 1/3" and "Calculate 2/3
÷ 2" want the same first move whatever their numbers. So each rule below matches
an operation and gives the first move for it, never the answer.

ANYTHING UNMATCHED KEEPS THE HINT IT HAS. A generated hint that does not fit its
question is worse than a generic one that admits it is generic, so the report
prints what was left alone and the count has to be read rather than assumed.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.join(HERE, "data", "units")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

# (pattern, hint). FIRST MATCH WINS, so the specific ones lead. Every hint is
# the first MOVE, never the answer.
RULES = [
 # --- place value and decimals
 (r"value of the digit", "Name the places in order out from the decimal point: tenths, hundredths, thousandths. Which one is that digit sitting in?"),
 (r"expanded form", "Write what each digit is worth on its own, then join them with plus signs."),
 (r"decompose", "Split the number into its place value parts. There is more than one right way to do it."),
 (r"write in figures", "Work from the left: say the number aloud and write each place as you reach it, using zero to hold an empty place."),
 # the ratio-in-three-ways question leads, or "in words" catches it and tells a
 # child to say a ratio aloud
 (r"ratio.{0,40}(three ways|colon form)|colon form",
  "A ratio can be written with a colon, in words, or as a fraction - write the same two numbers three ways."),
 (r"write .*in words", "Say it aloud first, then write exactly what you said."),
 (r"round .*nearest", "Look at the digit one place to the RIGHT of where you are rounding. 5 or more rounds up."),
 (r"\bround\b", "Find the two numbers it sits between, then decide which it is nearer to."),
 (r"order .*(smallest|largest|coldest|warmest)|put these .*in order",
  "Compare one place at a time from the LEFT, not by how long the number looks."),
 # ORDER OF OPERATIONS LEADS, because "4 + 3 x 2 b) 10 - 2 x 3" contains both a
 # multiplication sign and a 10, and the x10 rule below used to swallow the
 # whole of Unit 16 and tell a child to move the digits left.
 (r"order of operations|brackets|bodmas|bidmas|\bevaluate\b|place one pair of brackets",
  "Brackets first, then multiply and divide, then add and subtract - left to right within each."),
 (r"commutative|associative|distributive|factor out the common",
  "These laws let you re-order or re-group the numbers to make the arithmetic easier. Find the pairing that is easiest to do in your head."),
 # The multiplier has to be ADJACENT. With .{0,12} between them, "x 2 b) 10"
 # matched and the rule fired on questions that had nothing to do with x10.
 (r"(×|x|multiply(ing)? by)\s*(10|100|1000)\b|\b(10|100|1000)\s*(×|x)\b",
  "Every digit moves left one place for each 10. The digits move; the point does not."),
 (r"(÷|divide[ds]? by)\s*(10|100|1000)\b", "Every digit moves right one place for each 10 you divide by."),
 (r"follow the chain|complete the pattern", "Do one step, write the result, then use that result for the next step."),
 # The transformations lead the coordinate rule, or "Translate (3, 2) by the
 # vector (4, 3)" gets told how to read a coordinate it has already been given.
 (r"\btranslat", "Count across first, then up or down, and move every corner by the same amount."),
 (r"\breflect", "Every point ends up the same distance the other side of the mirror line."),
 (r"\brotat", "Turn the page, or turn one corner at a time about the centre you were given."),
 # Coordinates lead too: a point like (-1, 2) carries a minus stuck to a digit,
 # so the negatives rule below was answering "Name the quadrant for each point"
 # with a hint about which number is smaller.
 (r"coordinate|quadrant|plot these points|\(\s*-?\d+\s*,\s*-?\d+\s*\)",
  "Read along the bottom first, then up. Across before up, every time - and a minus means the other side of zero on that axis."),
 # --- reading a chart leads, or "temperature" below sends a question about a
 # line graph of temperatures to a hint about numbers below zero
 (r"line graph|bar chart|pictogram|pie chart|\bgraph\b",
  "Check what one square or one symbol stands for before you read any value off it."),
 # --- negative numbers
 # NOT a bare minus sign. U+2212 is simply how this content writes subtraction,
 # so matching it sent "True or false: 9 - 4 = 4 - 9" to a hint about numbers
 # below zero. A negative number here is a sign STUCK TO a digit, or said in
 # words.
 # The distinguisher is the SPACE. This content writes subtraction spaced
 # ("9 - 4") and a negative number closed up ("-8, -3"), so a minus stuck to
 # its digit is a sign and a spaced one is an operator.
 (r"temperature|below zero|\bnegative\b|\bloss\b|[−-]\d",
  "Picture a number line through zero: further left is always smaller, however big the digits look."),
 # --- fractions, decimals, percentages
 (r"(calculate|work out|find).{0,10}\d\s*/\s*\d\s*(×|x)\s*\d\s*/\s*\d|multiply .*fraction",
  "Multiply the top numbers together, then the bottom numbers. Simplify at the end."),
 (r"\d\s*/\s*\d\s*(÷|divided by)", "Dividing by a number is the same as multiplying by its reciprocal - turn the divider upside down."),
 (r"(\d\s*/\s*\d).{0,8}(\+|plus).{0,8}(\d\s*/\s*\d)|add .*fraction",
  "The denominators have to match before you add. Find a common one, then add only the top numbers."),
 (r"(\d\s*/\s*\d).{0,8}(−|-|minus).{0,8}(\d\s*/\s*\d)|subtract .*fraction",
  "Make the denominators match first, then subtract only the top numbers."),
 (r"\bof\b.{0,12}\d+\s*$|find:.*of\b", "'Of' means multiply. Divide by the bottom number, then multiply by the top."),
 # a ratio in simplest form is not a fraction in simplest form, and the fraction
 # hint says "top and bottom", which a ratio does not have
 (r"ratios?.{0,30}simplest form|simplest form.{0,30}ratios?|write the ratio",
  "Find the largest number that goes into BOTH parts, and divide each part by it."),
 (r"solve these proportions|\d\s*/\s*\d\s*=\s*[a-z]\s*/|=\s*\d+\s*/\s*[a-z]",
  "The two fractions are equal, so ask what the top was multiplied by to get the other top, and do the same underneath."),
 (r"equivalent fraction|simplif|simplest form", "Divide the top and the bottom by the same number until nothing else goes into both."),
 (r"improper|mixed number", "Count how many whole ones fit inside, and what is left over."),
 (r"percentage|per cent|%", "Per cent means out of 100. Find 10% or 1% first, then build the amount you need."),
 # ratioS, not ratio: \bratio\b does not match the plural, and "Complete the
 # equivalent ratios" is how most of Unit 12 is worded
 (r"equivalent ratios?", "Ask what you multiplied the first number by to get the second, then do the same to the other side."),
 (r"\bratios?\b", "Add the parts of the ratio to find how many shares there are, then work out what one share is worth."),
 (r"unit rate|at (this|that) rate|per hour|per item",
  "Find the value of ONE first - one hour, one item - then multiply up to what was asked."),
 (r"proportion", "Find the value of ONE first, then scale it up to the number you were asked for."),
 (r"convert \d\s*/\s*\d to a decimal|fraction to a decimal",
  "A fraction is a division: work out the top divided by the bottom."),
 (r"\d\s*(×|x)\s*\d\s*/\s*\d|\d\s*/\s*\d\s*(×|x)\s*\d\b",
  "A whole number is that number over 1. Multiply the tops, then the bottoms."),
 (r"(multiply|divide) the decimals",
  "Ignore the point and work it out as whole numbers, then put the point back so the answer has the same number of decimal places."),
 # --- calculation
 # decimals in columns: the whole difficulty is lining the points up, and a
 # generic "add them" hint is no help at all with that
 (r"lining up the decimal|trailing zero|decimal places?",
  "Line the decimal points up under each other, and fill any short number with zeros so every column has a digit."),
 # multiplying decimals leads: lining the points up is advice for ADDING them,
 # and "Calculate 0.5 x 0.8" was getting it
 (r"\d+\.\d+\s*(×|x|÷)|(×|x|÷)\s*\d+\.\d+",
  "Ignore the point and work it out as whole numbers, then put the point back so the answer has the same number of decimal places as the question."),
 (r"(add|subtract|borrowing)[^.]{0,40}\d+\.?\d*|\d+\.\d+\s*[+]\s*\d+\.\d+",
  "Line the decimal points up under each other before you start, and keep the point in the answer in the same column."),
 (r"long multiplication|grid method|column method|multiply by a single digit",
  "Split the bigger number into its place value parts, multiply each part, then add the parts back together."),
 (r"order of operations|brackets|bodmas|bidmas",
  "Brackets first, then multiply and divide, then add and subtract - left to right within each."),
 (r"estimate", "Round each number to something easy FIRST, then calculate with the rounded numbers."),
 (r"\bfactors?\b", "Test 1, 2, 3 and so on, and write each one beside the number it pairs with. Stop when the pairs meet."),
 (r"\bmultiples?\b", "Count up in steps of the number, starting from the number itself."),
 (r"prime", "A prime has exactly two factors. Check whether anything other than 1 and itself divides into it."),
 (r"square number|squared|\d\s*²", "A square number is a number times itself."),
 (r"cube number|cubed|\d\s*³", "A cube number is a number times itself, and times itself again."),
 (r"square root|√", "Ask which number multiplied by itself makes this one."),
 (r"long division|÷.*\d{3}|divide \d{3,}", "Work from the left, one digit at a time, carrying what is left over into the next."),
 (r"remainder", "Divide as far as it goes, then see what is left that will not make another whole group."),
 # --- sequences and algebra
 (r"continue (each )?sequence|next two terms|sequence", "Find the gap between two terms you already have, then check the same gap works for the next pair."),
 (r"nth term|term-to-term|rule for", "Work out what happens from one term to the next, then check that rule on a term you have not used."),
 (r"\bx\s*=|solve for|equation", "Do the same thing to both sides until the letter is alone."),
 (r"unknown|missing number|symbol", "Work backwards from the answer using the opposite operation."),
 # --- shape, space and measure
 # area BACKWARDS leads, or the plain area rule swallows it and tells a child
 # to multiply when the thing to do is divide
 (r"(area|volume).{0,40}(find|what is).{0,20}(width|length|height|base|edge)",
  "You know the area already, so this one runs backwards: divide by the side you were given."),
 (r"area of a (rectangle|square)|area of the (rectangle|square)|rectangular.{0,90}area|square.{0,20}sides? of",
  "Area of a rectangle or square is length x width, in square units."),
 (r"triangle.{0,60}(area|base|height)|area of a triangle",
  "Area of a triangle is base x height, halved."),
 (r"\bradius\b|\bdiameter\b|\bchord\b|\bcircumference\b|\bcompass is opened",
  "The diameter runs right across through the centre and is twice the radius."),
 (r"name each shape|name the shape|what shape",
  "Count the sides first, then check which of them are equal and which are parallel."),
 (r"every square is|copy and complete",
  "Read it as a claim and test it on an example, then try to find one it fails on."),
 (r"true or false",
  "Decide what would have to be true, then look for a single example that breaks it."),
 (r"flow diagram|follow the flow",
  "Do one box at a time and write the number down before moving to the next."),
 (r"how many minutes.{0,20}hours?|hours? into hours and minutes|hours? and minutes",
  "An hour is 60 minutes, so a decimal part of an hour is that fraction OF 60."),
 (r"surface area", "Work out the area of ONE face, then count how many faces are the same."),
 (r"\bvolume\b", "Volume is length x width x height, in cubic units."),
 (r"perimeter", "Perimeter is the distance all the way round the edge - add every side."),
 (r"\bangles?\b.{0,40}(triangle)", "The three angles of a triangle add to 180 degrees."),
 (r"straight line|angles on a line", "Angles on a straight line add to 180 degrees - subtract the ones you know from 180."),
 (r"angles.{0,20}point|around a point", "Angles at a point add to 360 degrees."),
 (r"\bangle\b", "Compare it with a right angle first: less than, the same, or more?"),
 (r"quadrilateral|parallelogram|trapezium|rhombus", "Check the sides and the angles separately - which are equal, and which are parallel?"),
 (r"line of symmetry|symmetr", "Fold it in your head and see whether the two halves land exactly on each other."),
 (r"reflect", "Every point ends up the same distance the other side of the mirror line."),
 (r"translat", "Count across first, then up or down, and move every corner by the same amount."),
 (r"rotat", "Turn the page, or turn one corner at a time about the centre you were given."),
 (r"coordinate|\(\s*-?\d+\s*,\s*-?\d+\s*\)", "Read along the bottom first, then up. Across before up, every time."),
 (r"\bnet\b", "Fold it up in your head and see which faces meet."),
 (r"(faces|edges|vertices)", "Count one kind at a time, and remember the faces you cannot see round the back."),
 (r"name the solid|which solid", "Count the faces, and check whether any of them are curved."),
 (r"categorical|discrete|continuous", "Ask whether the answers are words, whole counts, or measurements that could fall anywhere between."),
 (r"frequency table", "List every value that appears, then count how many times each one does."),
 (r"fill in:.{0,40}\(|commutative|associative|distributive",
  "The two sides have to come to the same total. Work out the side you can, then see what the other side needs."),
 # --- time and measure conversion
 (r"decimal hours|hours .*decimal", "An hour is 60 minutes, so a part of an hour is that many SIXTIETHS, not hundredths."),
 (r"timetable|start.*end time|duration|how long", "Count on to the next whole hour first, then count the rest."),
 (r"(convert|express).{0,30}(metres|centimetres|millimetres|grams|kilograms|litres)",
  "Decide first whether the answer should be BIGGER or smaller than what you started with."),
 (r"\bscale\b|read the scale", "Work out what ONE small division is worth before you read the pointer."),
 # --- statistics and probability
 (r"\bmean\b", "Add them all up, then share the total equally between how many there are."),
 (r"\bmedian\b", "Put them in order first. The median is the middle one."),
 (r"\bmode\b", "The mode is the one that appears most often - count each value."),
 (r"\brange\b", "Range is the largest take away the smallest."),
 (r"bar chart|pictogram|graph|chart", "Check what one square or one symbol stands for before you read any value off it."),
 (r"tally", "Tally marks come in fives - the fifth one goes across the other four."),
 # P(red) is how Stage 6 writes it, and a rule looking only for the WORD
 # "probability" misses every question that uses the notation
 # the vocabulary question leads: "which word best fits a probability of 0"
 # wants the words, not a count of outcomes
 (r"which word best fits|impossible or certain|likely, unlikely",
  "Put the words on a line from impossible to certain, and decide where this one sits."),
 (r"probability|likely|chance|\bP\s*\(",
  "Count how many outcomes you want, then how many there are altogether. P(something) is the first over the second."),
 (r"list all .{0,20}outcomes|all the outcomes",
  "Be systematic: hold the first thing still and run through every option for the second, then move the first on."),
 (r"\bsurvey\b|collect data", "Decide what you are counting and what the possible answers are before you start."),
]
COMPILED = [(re.compile(p, re.I), h) for p, h in RULES]


def hint_for(prompt):
    for rx, h in COMPILED:
        if rx.search(prompt):
            return h
    return None


pages = sorted(os.listdir(UNITS), key=lambda x: int("".join(c for c in x if c.isdigit()) or 0))
todo, matched, left, unmatched_samples = [], 0, 0, []
for f in pages:
    p = os.path.join(UNITS, f)
    u = json.load(io.open(p, encoding="utf-8"))
    prac = u.get("practice") or []
    if not prac:
        continue
    changed = 0
    for q in prac:
        prompt = " ".join(str(q.get("prompt") or "").split())
        h = hint_for(prompt)
        if h:
            if q.get("hint") != h:
                q["hint"] = h
                changed += 1
            matched += 1
        else:
            left += 1
            if len(unmatched_samples) < 14:
                unmatched_samples.append((u["unit"]["unitNo"], prompt))
    if changed:
        todo.append((p, u))
    print("  u%-3d %-36s %2d of %2d item(s) now question-specific"
          % (u["unit"]["unitNo"], u["unit"]["unitTitle"][:36],
             sum(1 for q in prac if hint_for(" ".join(str(q.get('prompt') or '').split()))),
             len(prac)))

total = matched + left
print("\n  %d practice items: %d matched a rule, %d kept the hint they had (%.0f%% covered)"
      % (total, matched, left, 100.0 * matched / max(total, 1)))
if unmatched_samples:
    print("\n  a sample of what no rule matched - these keep their existing hint:")
    for uno, s in unmatched_samples:
        print("   u%-3d %s" % (uno, s[:96]))

if matched and 100.0 * matched / max(total, 1) < 60:
    sys.exit("\n  REFUSED: under 60%% covered. A hint set this thin is not worth the "
             "churn in 17 files - add rules and run it again.")

if WRITE:
    for p, u in todo:
        io.open(p, "w", encoding="utf-8", newline="\n").write(
            json.dumps(u, ensure_ascii=False, indent=2) + "\n")
    print("\n  written to %d unit file(s)" % len(todo))
else:
    print("\n  (--write to apply)")

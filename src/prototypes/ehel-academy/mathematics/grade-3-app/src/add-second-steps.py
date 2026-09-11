# -*- coding: utf-8 -*-
"""A second step for the Grade 3 objectives that shared one, in the three thinnest lessons.

    python add-second-steps.py            # report
    python add-second-steps.py --write    # then ./build-all.sh

THE 2026-09-11 VALIDATION, area 3: "53 of 53 on 64 teaching steps, 1.2 per
objective - the thinnest of the four. Time and Direction: 4 steps for 3Gt.01-04
and 3Gp.01; Measure It: 5 for 6 objectives; Adding, Taking Away and Money: 6.
A second step for the objectives that share one, starting with time and
measures." And area 18: "no named people at all ... some named, local
characters." Seven steps, each at its objective from a side the first step did
not, and every one of them about a named child:

  Adding and Money   3Ni.04  Estimate first - the ESTIMATE in "estimate, add
                             and subtract" had no step: both written-method
                             steps compute, neither asks what to expect
                     3Nm.02  Shopping with shillings and cents - adding two
                             prices, where the first step only gave change
  Measure It         3Gg.02  Measure from any mark - the ruler reading that
  (3Gg.11)                   does not start at 0, the one real rulers force
                     3Gg.10  Two right angles, one straight line - the half of
                             the objective only the check ever asked
  Time and Direction 3Gt.01  Which unit of time? - its own step; it had shared
                             "How long did it take?" with intervals
                     3Gt.03  Which bus do you catch? - USING a timetable, where
                             the first step only reads one
                     3Gp.01  Find your way - the CREATE half of "interpret and
                             create descriptions of position, direction and
                             movement": the first step only follows orders

WHERE THEY GO. After each lesson's own steps and before its check, so no
existing step moves and explorationSteps in app.config.json stays true. Grade 3
is not routed (the server read of 2026-09-11 has no ehel-math-g03 override), so
no learner has a stored position in it for the check's new index to disturb.

WHAT MOVES, all of it here, all anchored: the new slides (each with its own
four-move explanation, written by this tool as SSML so no tag is hand-typed),
their script (each in its own function scope, so no name can collide with the
lesson's), their stickers (before "Show what I know", so sticker i is still
step i), and the check's finish() index.

Guarded by a marker; every anchor must match exactly once or the fragment is
left alone. The pages are generated: run ./build-all.sh afterwards.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g3-second-steps"

STYLES = [
    ("name", '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'),
    ("show", '<mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'),
    ("warn", '<mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'),
    ("hand", '<mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'),
]


def ssml(moves):
    out = []
    for k, tmpl in STYLES:
        t = moves[k]
        assert not re.search("['\"&<>]", t), "unsafe character in %s: %s" % (k, t)
        out.append(tmpl % "".join("<s>%s</s>" % x for x in re.split(r"(?<=[.?!])\s+", t.strip())))
    return '<break time="330ms"/>'.join(out)


def slide(slug, n, title, say, bar, sid, stage, moves):
    return ('    <!-- %s: %s -->\n'
            '    <section class="slide" data-explain=\'%s\' data-say="%s">\n'
            '      <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>\n'
            '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">\U0001F50A</button><span id="say%s">%s</span></div>\n'
            '      <div class="stage">\n'
            '        %s\n'
            '        <div class="choices" id="ch%s"></div>\n'
            '        <p class="fb" id="fb%s"></p>\n'
            '        <p class="score" id="sc%s"></p>\n'
            '      </div>\n'
            '    </section>\n') % (MARK, slug, ssml(moves), say, n, title, sid, bar, stage, sid, sid, sid)


# ---------------------------------------------------------------- the steps
# each: (slug, title, data-say, bar, id, stage markup, explanation, sticker, js)

EST = ("estimate first", "Estimate first",
       "Before you add or take away, round each number and work out roughly what the answer should be.",
       "About how much is it?", "x21",
       '<p class="fb" id="qx21" style="font-size:21px"></p>',
       {"name": "An estimate is a rough answer you work out first, from easy numbers.",
        "show": "298 add 413. 298 is about 300 and 413 is about 400, so the answer is about 700. The exact answer, 711, is close to 700, so it is probably right.",
        "warn": "An estimate is not the exact answer, and it is not a guess either. It comes from rounding each number to the nearest hundred.",
        "hand": "Round each number to the nearest hundred, then add or take away the hundreds."},
       ("\U0001F3AF", "Estimate first"),
       r'''
  /* ---- ehel-g3-second-steps: estimate first ---- 3Ni.04 ESTIMATE, add and subtract whole numbers with up to three digits */
  (function () {
    const WHO = ["Yusuf", "Amina", "Musa", "Hodan", "Omar", "Leila", "Nadia", "Ali"];
    const r100 = (n) => Math.round(n / 100) * 100;
    const num = () => { let n; do { n = rnd(1, 8) * 100 + rnd(11, 89); } while (n % 100 === 50); return n; };
    let got = 0, asked = 0;
    function round() {
      const add = rnd(0, 1) === 1;
      let a, b, est, exact, guard = 0;
      do {
        a = num(); b = num();
        if (!add && b > a) { const t = a; a = b; b = t; }
        est = add ? r100(a) + r100(b) : r100(a) - r100(b);
        exact = add ? a + b : a - b;
      } while ((add ? exact >= 1000 : est < 100) || Math.abs(exact - est) >= 50 && guard++ < 200);
      const who = WHO[rnd(0, WHO.length - 1)];
      const q = add ? who + " adds " + a + " and " + b + ". About how much is that?"
                    : who + " takes " + b + " away from " + a + ". About how much is left?";
      $("qx21").textContent = q; $("sayx21").textContent = q;
      const opts = [est, est + 100, est > 100 ? est - 100 : est + 200];
      offer("chx21", opts, est, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = Number(btn.dataset.v) === est;
        if (!mark("chx21", btn, ok)) return;
        asked++; if (ok) got++;
        const why = a + " is about " + r100(a) + " and " + b + " is about " + r100(b) + ", so the answer is about " + est +
          ". The exact answer is " + exact + ", which is close to " + est + ".";
        $("fbx21").className = "fb " + (ok ? "good" : "");
        $("fbx21").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx21", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3200);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx21").closest(".slide"));
    round();
  })();
''')

SHOP = ("shopping with cents", "Shopping with shillings and cents",
        "Add the shillings, then add the cents. There are 100 cents in one shilling.",
        "How much altogether?", "x22",
        '<div class="shop" id="shopx22"></div><p class="fb" id="qx22" style="font-size:20px"></p>',
        {"name": "To add two prices, add the shillings and then add the cents.",
         "show": "sh 12.50 and sh 25.25. The shillings make 12 add 25, which is 37. The cents make 50 add 25, which is 75. Together that is sh 37.75.",
         "warn": "Keep shillings with shillings and cents with cents. The two figures after the dot are always cents.",
         "hand": "Add the numbers before the dot, then the numbers after it."},
        ("\U0001F6CD️", "Shopping with cents"),
        r'''
  /* ---- ehel-g3-second-steps: shopping with cents ---- 3Nm.02 add and subtract amounts of money; 3Nm.01 money notation */
  (function () {
    const WHO = ["Hodan", "Musa", "Nadia", "Omar", "Zara", "Ali", "Leila", "Yusuf"];
    const ITEMS = ["a pencil", "a rubber", "a ruler", "an exercise book", "a mango", "a bottle of water", "a bread roll", "a packet of crayons"];
    const money = (v) => "sh " + v.toFixed(2);
    let got = 0, asked = 0;
    function round() {
      const i1 = rnd(0, ITEMS.length - 1); let i2 = rnd(0, ITEMS.length - 1); while (i2 === i1) i2 = rnd(0, ITEMS.length - 1);
      let c1, c2; do { c1 = rnd(1, 19) * 5; c2 = rnd(1, 19) * 5; } while (c1 + c2 >= 100);
      const s1 = rnd(5, 45), s2 = rnd(5, 45);
      const p1 = s1 + c1 / 100, p2 = s2 + c2 / 100;
      const tot = Math.round((p1 + p2) * 100) / 100;
      const who = WHO[rnd(0, WHO.length - 1)];
      $("shopx22").innerHTML = '<div class="tag"><span>' + ITEMS[i1] + "</span><b>" + money(p1) + '</b></div><div class="tag"><span>' + ITEMS[i2] + "</span><b>" + money(p2) + "</b></div>";
      const q = who + " buys " + ITEMS[i1] + " and " + ITEMS[i2] + ". How much is that altogether?";
      $("qx22").textContent = q; $("sayx22").textContent = q;
      const right = money(tot);
      const opts = [right, money(tot + 1), money(Math.round((tot + 0.1) * 100) / 100)];
      offer("chx22", opts, right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx22", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "The shillings: " + s1 + " add " + s2 + " is " + (s1 + s2) + ". The cents: " + c1 + " add " + c2 + " is " + (c1 + c2) + ". Together that is " + right + ".";
        $("fbx22").className = "fb " + (ok ? "good" : "");
        $("fbx22").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx22", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3200);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx22").closest(".slide"));
    round();
  })();
''')

RULER = ("measure from any mark", "Measure from any mark",
         "A ruler does not have to start at zero. Count on from where it starts to where it ends.",
         "How long is it?", "x61",
         '<svg class="scaleline gsvg" id="gx61" viewBox="0 0 460 130" role="img" aria-label="a ruler with something lying along it"></svg><p class="fb" id="qx61" style="font-size:20px"></p>',
         {"name": "The length of something is the gap from where it starts to where it ends.",
          "show": "A pencil starts at the 2 and ends at the 9. Count on from 2 to 9: that is 7 centimetres.",
          "warn": "Reading only the end gives 9, which is too long, because the pencil did not start at 0. The start matters as much as the end.",
          "hand": "Find the start and the end, then count on the centimetres between them."},
         ("✏️", "Measure from any mark"),
         r'''
  /* ---- ehel-g3-second-steps: measure from any mark ---- 3Gg.02 estimate and MEASURE lengths in cm; 3Gg.11 use instruments */
  (function () {
    const THINGS = [["Musa", "pencil"], ["Amina", "ribbon"], ["Hodan", "crayon"], ["Yusuf", "leaf"], ["Leila", "stick"], ["Omar", "straw"]];
    let got = 0, asked = 0;
    function round() {
      const s = rnd(1, 4), len = rnd(3, 7), e = s + len;
      const x0 = 20, x1 = 440, cm = (x1 - x0) / 12, y = 92;
      let svg = '<rect class="sh" x="' + (x0 + s * cm).toFixed(1) + '" y="' + (y - 46) + '" width="' + (len * cm).toFixed(1) + '" height="18" rx="7"></rect>';
      svg += '<line class="tk" stroke-dasharray="4 4" x1="' + (x0 + s * cm).toFixed(1) + '" y1="' + (y - 28) + '" x2="' + (x0 + s * cm).toFixed(1) + '" y2="' + y + '"></line>';
      svg += '<line class="tk" stroke-dasharray="4 4" x1="' + (x0 + e * cm).toFixed(1) + '" y1="' + (y - 28) + '" x2="' + (x0 + e * cm).toFixed(1) + '" y2="' + y + '"></line>';
      svg += '<line class="ax" x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '"></line>';
      for (let k = 0; k <= 24; k++) {
        const x = x0 + cm * k / 2, big = k % 2 === 0;
        svg += '<line class="tk" x1="' + x.toFixed(1) + '" y1="' + (y - (big ? 16 : 8)) + '" x2="' + x.toFixed(1) + '" y2="' + y + '"></line>';
        if (big) svg += '<text class="n" x="' + x.toFixed(1) + '" y="' + (y + 22) + '">' + (k / 2) + "</text>";
      }
      $("gx61").innerHTML = svg;
      const t = THINGS[rnd(0, THINGS.length - 1)];
      const q = t[0] + "'s " + t[1] + " does not start at 0. How long is it?";
      $("qx61").textContent = q; $("sayx61").textContent = q;
      const right = len + " cm";
      const opts = [right, e + " cm", (s === 1 ? len - 1 : len + 1) + " cm"];
      offer("chx61", opts, right, (ev) => {
        const btn = ev.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx61", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "It starts at " + s + " and ends at " + e + ". Count on from " + s + " to " + e + ": that is " + len + " centimetres. Reading only the end gives " + e + ", which is too long.";
        $("fbx61").className = "fb " + (ok ? "good" : "");
        $("fbx61").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx61", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3200);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx61").closest(".slide"));
    round();
  })();
''')

TURN = ("two right angles", "Two right angles, one straight line",
        "Every square corner is one right angle. Two of them side by side make a straight line.",
        "How many right angles?", "x62",
        '<svg class="gsvg" id="gx62" viewBox="0 0 300 220" role="img" aria-label="a turn made of right angles"></svg><p class="fb" id="qx62" style="font-size:20px"></p>',
        {"name": "A right angle is a quarter turn. Two right angles make a straight line, which is a half turn.",
         "show": "Start with an arm pointing right. Turn it one right angle and it points up. Turn it another right angle and it points left, and the two arms now make one straight line.",
         "warn": "A straight line does not look like an angle, but it is one. It is two right angles put side by side.",
         "hand": "Count the little square corners. Each one is a right angle."},
        ("\U0001F504", "Two right angles, one straight line"),
        r'''
  /* ---- ehel-g3-second-steps: two right angles ---- 3Gg.10 recognise that a straight line is equivalent to two right angles or a half turn */
  (function () {
    const NAME = { 1: "a quarter turn", 2: "a half turn", 3: "three quarters of a turn", 4: "a whole turn" };
    const FACTS = [
      { q: "Two right angles side by side make...", opts: ["a straight line", "a square corner", "a whole turn"], a: "a straight line", why: "Two right angles make a half turn, and a half turn is a straight line." },
      { q: "A half turn is how many right angles?", opts: ["2", "1", "4"], a: "2", why: "A quarter turn is one right angle, so a half turn is two." },
      { q: "A straight line is the same as...", opts: ["a half turn", "a quarter turn", "a whole turn"], a: "a half turn", why: "A straight line is two right angles, and that is a half turn." },
      { q: "How many right angles make a whole turn?", opts: ["4", "2", "3"], a: "4", why: "Four quarter turns bring you all the way round, and each one is a right angle." },
    ];
    let got = 0, asked = 0;
    function draw(k) {
      const cx = 150, cy = 115, L = 90, m = 18;
      let svg = '<line class="arm" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + L) + '" y2="' + cy + '"></line>';
      /* one small square per right angle, each in its own corner and apart from
         the others - drawn as corner ticks they joined into ONE square at a whole
         turn, and a child told to count four corners saw one */
      const SG = [[1, -1], [-1, -1], [-1, 1], [1, 1]];
      for (let q = 0; q < k; q++) svg += '<rect class="rt" x="' + (cx + (SG[q][0] > 0 ? 5 : -5 - m)) + '" y="' + (cy + (SG[q][1] > 0 ? 5 : -5 - m)) + '" width="' + m + '" height="' + m + '"></rect>';
      const a = -k * Math.PI / 2;
      if (k < 4) svg += '<line class="arm b" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + L * Math.cos(a)).toFixed(1) + '" y2="' + (cy + L * Math.sin(a)).toFixed(1) + '"></line>';
      else svg += '<circle class="rt" cx="' + cx + '" cy="' + cy + '" r="40"></circle>';
      $("gx62").innerHTML = svg;
    }
    function round() {
      let q, opts, right, why;
      if (rnd(0, 4) < 3) {
        const k = rnd(1, 4); draw(k);
        q = "The arm turns from pointing right. How many right angles is this turn?";
        right = String(k);
        opts = [right].concat(["1", "2", "3", "4"].filter((x) => x !== right).sort(() => Math.random() - 0.5).slice(0, 2));
        why = "Count the square corners: " + k + ". That is " + NAME[k] + (k === 2 ? ", and the two arms make a straight line." : ".");
      } else {
        const f = FACTS[rnd(0, FACTS.length - 1)]; draw(2);
        q = f.q; right = f.a; opts = f.opts; why = f.why;
      }
      $("qx62").textContent = q; $("sayx62").textContent = q;
      offer("chx62", opts, right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx62", btn, ok)) return;
        asked++; if (ok) got++;
        $("fbx62").className = "fb " + (ok ? "good" : "");
        $("fbx62").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx62", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3000);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx62").closest(".slide"));
    round();
  })();
''')

UNIT = ("which unit of time", "Which unit of time?",
        "Choose the unit that fits: seconds for very short things, then minutes, hours, days, weeks, months and years.",
        "About how long does it take?", "x71",
        '<p class="fb" id="qx71" style="font-size:21px"></p>',
        {"name": "Pick the unit of time that gives a sensible number for the thing you are timing.",
         "show": "Amina walks to school in about 15 minutes. 15 seconds is far too quick, and 15 hours is far too long, so minutes is the unit that fits.",
         "warn": "Every answer has the same number, so the number does not help. Picture how long the thing really takes, then choose the unit.",
         "hand": "Picture the thing happening, then choose seconds, minutes, hours, days, weeks, months or years."},
        ("⏱️", "Which unit of time"),
        r'''
  /* ---- ehel-g3-second-steps: which unit of time ---- 3Gt.01 choose the appropriate unit of time for familiar activities */
  (function () {
    const ITEMS = [
      { q: "About how long does Amina take to walk to school?", n: 15, a: "minutes", w: ["seconds", "hours"] },
      { q: "About how long can Musa hold his breath?", n: 20, a: "seconds", w: ["minutes", "hours"] },
      { q: "About how long does the bus from Nairobi to Mombasa take?", n: 8, a: "hours", w: ["minutes", "weeks"] },
      { q: "How old is Hodan's baby sister?", n: 7, a: "months", w: ["hours", "years"] },
      { q: "About how long is the long school holiday?", n: 6, a: "weeks", w: ["hours", "years"] },
      { q: "How old is Grandmother Halima?", n: 68, a: "years", w: ["months", "days"] },
      { q: "How long does Omar's football match last?", n: 90, a: "minutes", w: ["seconds", "days"] },
      { q: "About how long does Leila sleep every night?", n: 10, a: "hours", w: ["minutes", "weeks"] },
      { q: "About how long does it take Yusuf to tie his shoes?", n: 30, a: "seconds", w: ["hours", "days"] },
      { q: "How long does it take a mango tree to grow big enough for fruit?", n: 4, a: "years", w: ["days", "hours"] },
    ];
    let got = 0, asked = 0, last = -1;
    function round() {
      let i; do { i = rnd(0, ITEMS.length - 1); } while (i === last); last = i;
      const it = ITEMS[i];
      $("qx71").textContent = it.q; $("sayx71").textContent = it.q;
      const right = it.n + " " + it.a;
      offer("chx71", [right].concat(it.w.map((u) => it.n + " " + u)), right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx71", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "It is about " + right + ". " + it.n + " " + it.w[0] + " or " + it.n + " " + it.w[1] + " would not make sense.";
        $("fbx71").className = "fb " + (ok ? "good" : "");
        $("fbx71").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx71", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 2800);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx71").closest(".slide"));
    round();
  })();
''')

BUS = ("which bus", "Which bus do you catch?",
       "A timetable is for planning. Find the bus that gets you there in time, or the first one you can still catch.",
       "Which bus?", "x72",
       '<table class="ttable" id="ttx72"></table><p class="fb" id="qx72" style="font-size:20px"></p>',
       {"name": "A timetable helps you plan a journey, not just read a time.",
        "show": "Hodan must be at the Library by 10:00. Bus 3 gets there at 10:10, too late. Bus 2 gets there at 9:45, so Bus 2 is the bus to catch.",
        "warn": "Read down the column for one bus and along the row for one stop. Mixing up a row and a column gives a time from the wrong bus.",
        "hand": "Find the row you need first, then look along it bus by bus."},
       ("\U0001F68F", "Which bus to catch"),
       r'''
  /* ---- ehel-g3-second-steps: which bus ---- 3Gt.03 interpret and USE the information in timetables (12-hour clock) */
  (function () {
    const PLACES = ["Market", "School", "Clinic", "Library"];
    const WHO = ["Hodan", "Musa", "Leila", "Omar", "Zara", "Yusuf", "Amina", "Ali"];
    const fmt = (t) => Math.floor(t / 60) + ":" + (t % 60 < 10 ? "0" : "") + (t % 60);
    let got = 0, asked = 0;
    function round() {
      const first = rnd(7, 9) * 60 + rnd(0, 5) * 5, gap = rnd(4, 6) * 5;
      const legs = [rnd(2, 4) * 5, rnd(2, 4) * 5, rnd(2, 4) * 5];
      const T = [0, 1, 2].map((b) => { let t = first + b * gap; const row = [t]; for (const l of legs) { t += l; row.push(t); } return row; });
      let h = "<tr><th>Stop</th><th>Bus 1</th><th>Bus 2</th><th>Bus 3</th></tr>";
      PLACES.forEach((p, s) => { h += "<tr><th>" + p + "</th>" + T.map((row) => "<td>" + fmt(row[s]) + "</td>").join("") + "</tr>"; });
      $("ttx72").innerHTML = h;
      const who = WHO[rnd(0, WHO.length - 1)], j = rnd(0, 2);
      let q, why;
      if (rnd(0, 1) === 0) {
        const by = T[j][3] + rnd(1, gap / 5 - 1) * 5;
        q = who + " is at the Market and must be at the Library by " + fmt(by) + ". Which bus should " + who + " catch?";
        why = "Bus " + (j + 1) + " reaches the Library at " + fmt(T[j][3]) + ", in time" +
          (j < 2 ? ", and Bus " + (j + 2) + " gets there at " + fmt(T[j + 1][3]) + ", which is too late." : ", and it is the last bus.");
      } else {
        const at = j === 0 ? T[0][0] - rnd(1, 3) * 5 : T[j - 1][0] + rnd(1, gap / 5 - 1) * 5;
        q = who + " gets to the Market at " + fmt(at) + ". Which is the first bus " + who + " can catch?";
        why = (j > 0 ? "Bus " + j + " left the Market at " + fmt(T[j - 1][0]) + ", before " + fmt(at) + ". " : "") +
          "Bus " + (j + 1) + " leaves the Market at " + fmt(T[j][0]) + ", so that is the first one " + who + " can catch.";
      }
      const right = "Bus " + (j + 1);
      $("qx72").textContent = q; $("sayx72").textContent = q;
      offer("chx72", ["Bus 1", "Bus 2", "Bus 3"], right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx72", btn, ok)) return;
        asked++; if (ok) got++;
        $("fbx72").className = "fb " + (ok ? "good" : "");
        $("fbx72").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx72", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3600);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx72").closest(".slide"));
    round();
  })();
''')

WAY = ("find your way", "Find your way",
       "Use north, south, east and west to follow a route on the map, and to give one.",
       "Where are you?", "x73",
       '<svg class="gsvg" id="gx73" viewBox="0 0 380 360" style="max-width:380px" role="img" aria-label="a map on a grid"></svg><p class="fb" id="qx73" style="font-size:20px"></p>',
       {"name": "On a map, north is up, south is down, east is right and west is left.",
        "show": "Start at the Home. Go 2 squares east, then 2 squares north, and you reach the School. To give that route to somebody else, you say exactly the same thing.",
        "warn": "North and south are easy to swap. North is always towards the top of the map, whichever way you are facing.",
        "hand": "Put your finger on the start, and move it one square at a time as you read."},
       ("\U0001F6B6", "Find your way"),
       r'''
  /* ---- ehel-g3-second-steps: find your way ---- 3Gp.01 interpret AND CREATE descriptions of position, direction and movement, including cardinal points */
  (function () {
    const PL = [
      { n: "Home", e: "\u{1F3E0}", c: 1, r: 3 }, { n: "School", e: "\u{1F3EB}", c: 3, r: 1 },
      { n: "Market", e: "\u{1F6D2}", c: 4, r: 3 }, { n: "Clinic", e: "\u{1F3E5}", c: 0, r: 0 },
      { n: "Shop", e: "\u{1F3EA}", c: 2, r: 4 }, { n: "Bus stop", e: "\u{1F68F}", c: 4, r: 0 },
      { n: "Park", e: "\u{1F333}", c: 0, r: 2 },
    ];
    const WHO = ["Amina", "Musa", "Hodan", "Omar", "Zara", "Yusuf", "Leila", "Ali"];
    const S = 64, X = 20, Y = 30;
    const at = (c, r) => PL.find((p) => p.c === c && p.r === r);
    function map(a, b) {
      let svg = '<text class="lab" x="' + (X + 5 * S + 20) + '" y="' + (Y + 16) + '">N</text><text class="lab" x="' + (X + 5 * S + 20) + '" y="' + (Y + 40) + '">↑</text>';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++)
        svg += '<rect class="cell' + (c === a.c && r === a.r ? " on" : "") + '" x="' + (X + c * S) + '" y="' + (Y + r * S) + '" width="' + S + '" height="' + S + '"></rect>';
      if (b) svg += '<rect class="rt" x="' + (X + b.c * S + 3) + '" y="' + (Y + b.r * S + 3) + '" width="' + (S - 6) + '" height="' + (S - 6) + '"></rect>';
      for (const p of PL) {
        svg += '<text x="' + (X + p.c * S + S / 2) + '" y="' + (Y + p.r * S + 34) + '" font-size="26" text-anchor="middle">' + p.e + "</text>";
        svg += '<text class="lab m" x="' + (X + p.c * S + S / 2) + '" y="' + (Y + p.r * S + 55) + '">' + p.n + "</text>";
      }
      $("gx73").innerHTML = svg;
    }
    const sq = (n) => n + " square" + (n > 1 ? "s" : "");
    function describe(dc, dr) {
      const parts = [];
      if (dc) parts.push(sq(Math.abs(dc)) + " " + (dc > 0 ? "east" : "west"));
      if (dr) parts.push(sq(Math.abs(dr)) + " " + (dr > 0 ? "south" : "north"));
      return "Go " + parts.join(", then ");
    }
    let got = 0, asked = 0;
    function round() {
      let A, B; do { A = PL[rnd(0, PL.length - 1)]; B = PL[rnd(0, PL.length - 1)]; } while (A === B);
      const dc = B.c - A.c, dr = B.r - A.r;
      const who = WHO[rnd(0, WHO.length - 1)];
      let q, right, opts;
      if (rnd(0, 1) === 0) {
        map(A, null);
        q = "Start at the " + A.n + ". " + describe(dc, dr) + ". Where are you?";
        right = B.n;
        const wrong = [at(A.c + dc, A.r - dr), at(A.c - dc, A.r + dr)].filter((p) => p && p !== B).map((p) => p.n);
        const rest = PL.filter((p) => p !== A && p !== B && wrong.indexOf(p.n) < 0).map((p) => p.n).sort(() => Math.random() - 0.5);
        opts = [right].concat(wrong.concat(rest).slice(0, 2));
      } else {
        map(A, B);
        q = "Which directions take " + who + " from the " + A.n + " to the " + B.n + "?";
        right = describe(dc, dr);
        const w1 = dr ? describe(dc, -dr) : describe(-dc, dr);
        const w2 = dc && dr ? describe(-dc, dr) : dc ? describe(dc + (dc > 0 ? 1 : -1), dr) : describe(dc, dr + (dr > 0 ? 1 : -1));
        opts = [right, w1, w2];
      }
      $("qx73").textContent = q; $("sayx73").textContent = q;
      offer("chx73", opts, right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx73", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "From the " + A.n + ", " + describe(dc, dr).replace(/^Go/, "go") + " and you reach the " + B.n + ". North is up the map and east is to the right.";
        $("fbx73").className = "fb " + (ok ? "good" : "");
        $("fbx73").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx73", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3600);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx73").closest(".slide"));
    round();
  })();
''')

# lesson fragment -> (steps in order, the check block's comment, its finish() call)
PLAN = {
    "l2": ([EST, SHOP], "  /* ---- 18: check ----", 'finish(6, "You have finished the check. Well done.")', "<!-- 18 check -->"),
    "l6": ([RULER, TURN], "  /* ---- 17: check ---- */", 'finish(5, "You have finished the check.")', "<!-- 17 check -->"),
    "l7": ([UNIT, BUS, WAY], "  /* ---- 17: check ---- */", 'finish(4, "You have finished the check.")', "<!-- 17 check -->"),
}

bad = 0
for frag, (steps, jsanchor, fin, htmlanchor) in PLAN.items():
    sp, cp = os.path.join(HERE, frag + "-slides.html"), os.path.join(HERE, frag + "-content.js")
    s = io.open(sp, encoding="utf-8", newline="").read()
    c = io.open(cp, encoding="utf-8", newline="").read()
    if MARK in s or MARK in c:
        print("  already  %s" % frag)
        continue
    teach = len(re.findall(r'<span class="n">\d+</span>', s))
    problems = [n for n, hay, x in (("check slide comment", s, htmlanchor), ("check block", c, jsanchor),
                                    ("check finish()", c, fin), ("check sticker", c, '["✅", "Show what I know"]'))
                if hay.count(x) != 1]
    if problems:
        print("  REFUSED  %s  not exactly once: %s" % (frag, ", ".join(problems)))
        bad += 1
        continue
    new_html, new_js, new_st = "", "", []
    for k, (slug, title, say, bar, sid, stage, moves, sticker, js) in enumerate(steps, start=1):
        new_html += slide(slug, teach + k, title, say, bar, sid, stage, moves)
        new_js += js
        new_st.append('["%s", "%s"]' % sticker)
    s = s.replace("    " + htmlanchor, new_html + "    " + htmlanchor, 1) if ("    " + htmlanchor) in s else s.replace(htmlanchor, new_html + htmlanchor, 1)
    c = c.replace(jsanchor, new_js.lstrip("\n") + "\n" + jsanchor, 1)
    old_idx = int(re.match(r"finish\((\d+),", fin).group(1))
    c = c.replace(fin, fin.replace("finish(%d," % old_idx, "finish(%d," % (old_idx + len(steps))), 1)
    c = c.replace('["✅", "Show what I know"]', ",\n    ".join(new_st) + ',\n    ["✅", "Show what I know"]', 1)
    assert s.count(MARK) == len(steps) and c.count(MARK) == len(steps)
    if WRITE:
        io.open(sp, "w", encoding="utf-8", newline="").write(s)
        io.open(cp, "w", encoding="utf-8", newline="").write(c)
    print("  %s %s  +%d steps (%s); check index %d -> %d" % (
        "wrote   " if WRITE else "would   ", frag, len(steps), ", ".join(x[1] for x in steps), old_idx, old_idx + len(steps)))

sys.exit(1 if bad else 0)


  /* ==================================================================
     SIDES, SIZES AND SECONDS - Grade 3 geometry, measure and time.
     Cambridge Primary Mathematics 0096, Stage 3 (3Gg, 3Gt, 3Gp).
     ================================================================== */

  function offer(host, opts, right, onPick) {
    $(host).innerHTML = shuffle(opts).map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $(host).dataset.right = String(right); $(host).dataset.live = "1"; $(host).onclick = onPick;
  }
  function mark(host, btn, ok) {
    if ($(host).dataset.live !== "1") return false;
    $(host).dataset.live = "0";
    [...$(host).querySelectorAll(".choice")].forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? "right" : "wrong");
    if (!ok) { const r = $(host).dataset.right; [...$(host).querySelectorAll(".choice")].forEach((b) => { if (b.dataset.v === r) b.classList.add("right"); }); }
    return true;
  }
  function scoreLine(id, got, asked, target) { $(id).textContent = got + " right out of " + asked + (got >= target ? " - sticker earned!" : ""); }
  function nextQ(gen) { let item, guard = 0; do { item = gen(); } while (new Set(item.opts.map(String)).size !== item.opts.length && guard++ < 60); return item; }
  function uniq(list, want) { const out = []; for (const v of list) { if (out.length >= want) break; if (!out.includes(v)) out.push(v); } return out; }
  /* A regular polygon drawn on a circle. `wob` squashes it vertically to make it
     IRREGULAR - which must mean unequal SIDES, not merely unequal angles.
     Alternating the radius instead was the first attempt and was wrong: on an
     even-sided polygon it produces an equilateral shape, every side the same
     length, which is precisely what this lesson tells a child regular means. */
  function poly(cx, cy, r, n, rot, wob) {
    const sy = wob ? 0.56 : 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rot + i * 2 * Math.PI / n;
      pts.push([(cx + r * Math.cos(a)).toFixed(1), (cy + r * sy * Math.sin(a)).toFixed(1)]);
    }
    return pts;
  }
  const ptsStr = (pts) => pts.map((p) => p.join(",")).join(" ");

  /* ---- 9, 10, 11: units ---- 3Gg.02 length, 3Gg.06 mass, 3Gg.07 capacity */
  function unitStep(idx, qid, chid, sayid, fbid, scid, spec, target) {
    let got = 0, asked = 0;
    function round() {
      const kind = rnd(0, 1);
      let q, answer, opts, why;
      if (kind === 0) {
        /* convert between the two units */
        const big = rnd(1, 9), conv = spec.per;
        if (rnd(0, 1)) { q = big + " " + spec.big + " = ? " + spec.small; answer = big * conv; opts = uniq([answer, big * (conv / 10), big * conv * 10, big + conv], 4); why = "There are " + conv + " " + spec.small + " in one " + spec.big + ", so " + big + " " + spec.big + " is " + answer + " " + spec.small + "."; }
        else { const small = big * conv; q = small + " " + spec.small + " = ? " + spec.big; answer = big; opts = uniq([answer, big * 10, Math.max(1, Math.round(big / 10)), big + 1], 4); why = small + " ÷ " + conv + " = " + big + " " + spec.big + "."; }
      } else {
        /* choose the sensible measurement for a familiar object */
        const item = spec.items[rnd(0, spec.items.length - 1)];
        q = "About how much is " + item.t + "?";
        answer = item.a;
        opts = uniq([item.a, ...item.w], 3);
        why = item.t + " is about " + item.a + ".";
      }
      $(qid).textContent = q;
      $(sayid).textContent = q;
      offer(chid, opts, answer, (e) => {
        const b = e.target.closest(".choice"); if (!b) return;
        const ok = b.dataset.v === String(answer);
        if (!mark(chid, b, ok)) return;
        asked++; if (ok) got++;
        $(fbid).className = "fb " + (ok ? "good" : "");
        $(fbid).textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine(scid, got, asked, target);
        if (got >= target) finish(idx, "");
        setTimeout(round, 2300);
      });
    }
    round();
  }
  unitStep(0, "q8", "ch8", "say8", "fb8", "sc8", {
    big: "m", small: "cm", per: 100,
    items: [
      { t: "a pencil", a: "15 cm", w: ["15 m", "15 km"] },
      { t: "a classroom door", a: "2 m", w: ["2 cm", "2 km"] },
      { t: "the walk to the next town", a: "5 km", w: ["5 m", "5 cm"] },
      { t: "a football pitch", a: "100 m", w: ["100 cm", "100 km"] },
    ],
  }, 4);
  unitStep(1, "q9", "ch9", "say9", "fb9", "sc9", {
    big: "kg", small: "g", per: 1000,
    items: [
      { t: "an apple", a: "100 g", w: ["100 kg", "1 kg"] },
      { t: "a bag of rice", a: "2 kg", w: ["2 g", "200 g"] },
      { t: "a grown-up", a: "70 kg", w: ["70 g", "7 kg"] },
      { t: "a paperclip", a: "1 g", w: ["1 kg", "100 g"] },
    ],
  }, 4);
  unitStep(2, "q10", "ch10", "say10", "fb10", "sc10", {
    big: "l", small: "ml", per: 1000,
    items: [
      { t: "a teaspoon", a: "5 ml", w: ["5 l", "500 ml"] },
      { t: "a big bottle of water", a: "2 l", w: ["2 ml", "20 ml"] },
      { t: "a mug of tea", a: "300 ml", w: ["3 ml", "3 l"] },
      { t: "a bucket", a: "10 l", w: ["10 ml", "100 ml"] },
    ],
  }, 4);

  /* ---- 11: reading a scale ---- 3Gg.11 use instruments that measure length, mass, capacity and temperature */
  const SCALES = [
    { unit: "g", steps: [10, 20, 50], base: 0, what: "the kitchen scales" },
    { unit: "ml", steps: [10, 20, 50], base: 0, what: "the measuring jug" },
    { unit: "cm", steps: [1, 2, 5], base: 0, what: "the ruler" },
    { unit: "°C", steps: [1, 2, 5], base: 0, what: "the thermometer" },
  ];
  let got11 = 0, asked11 = 0;
  function round11() {
    const s = SCALES[rnd(0, SCALES.length - 1)];
    const step = s.steps[rnd(0, s.steps.length - 1)];
    const perLabel = [2, 5][rnd(0, 1)];          /* small marks between printed numbers */
    const majors = 4;
    const labelStep = step * perLabel;
    const total = majors * perLabel;
    const at = rnd(1, total - 1);
    const answer = s.base + at * step;
    const x0 = 30, x1 = 430, y = 74;
    let svg = '<line class="ax" x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '"></line>';
    for (let k = 0; k <= total; k++) {
      const x = x0 + (x1 - x0) * k / total;
      const major = k % perLabel === 0;
      svg += '<line class="tk" x1="' + x.toFixed(1) + '" y1="' + (y - (major ? 16 : 8)) + '" x2="' + x.toFixed(1) + '" y2="' + y + '"></line>';
      if (major) svg += '<text class="n" x="' + x.toFixed(1) + '" y="' + (y + 22) + '">' + (s.base + k * step) + "</text>";
    }
    const ax = x0 + (x1 - x0) * at / total;
    svg += '<polygon class="ptr" points="' + ax.toFixed(1) + "," + (y - 22) + " " + (ax - 9).toFixed(1) + "," + (y - 40) + " " + (ax + 9).toFixed(1) + "," + (y - 40) + '"></polygon>';
    $("g11").innerHTML = svg;
    $("say11").innerHTML = "On " + s.what + ", what is the arrow pointing at? The numbers go up in <b>" + labelStep + " " + s.unit + "</b>.";
    const opts = uniq([answer, answer + step, answer - step, answer + labelStep], 4).filter((v) => v >= s.base);
    offer("ch11", opts.map((v) => v + " " + s.unit), answer + " " + s.unit, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === answer + " " + s.unit;
      if (!mark("ch11", b, ok)) return;
      asked11++; if (ok) got11++;
      $("fb11").className = "fb " + (ok ? "good" : "");
      $("fb11").textContent = (ok ? cheer() + " " : "") + "There are " + perLabel + " gaps between the printed numbers and they cover " + labelStep + " " + s.unit + ", so one small mark is " + step + " " + s.unit + ". The arrow is " + at + " marks along: " + answer + " " + s.unit + ".";
      say(ok ? cheer() : "One mark is " + step + ", so the arrow is at " + answer);
      scoreLine("sc11", got11, asked11, 4);
      if (got11 >= 4) finish(3, "");
      setTimeout(round11, 2800);
    });
  }
  round11();

  /* ---- 12: right angles ---- 3Gg.10 compare angles with a right angle */
  let got12 = 0, asked12 = 0;
  function round12() {
    const kind = rnd(0, 2);   /* 0 smaller than, 1 the same as, 2 bigger than a right angle - 'acute' and 'obtuse' are Stage 4's Gg.08 */
    const deg = kind === 1 ? 90 : kind === 0 ? rnd(25, 75) : rnd(105, 165);
    const cx = 90, cy = 150, len = rnd(60, 120);
    const a = -deg * Math.PI / 180;
    const x2 = cx + len * Math.cos(a), y2 = cy + len * Math.sin(a);
    let svg = '<line class="arm" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + len) + '" y2="' + cy + '"></line>';
    svg += '<line class="arm b" x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"></line>';
    svg += '<path class="rt" d="M' + (cx + 34) + " " + cy + " A34 34 0 0 0 " + (cx + 34 * Math.cos(a)).toFixed(1) + " " + (cy + 34 * Math.sin(a)).toFixed(1) + '"></path>';
    $("g12").innerHTML = svg;
    const right = kind === 1 ? "exactly a right angle" : kind === 0 ? "smaller than a right angle" : "bigger than a right angle";
    $("say12").textContent = "Compare this angle with a right angle.";
    $("ch12").innerHTML = ["smaller than a right angle", "exactly a right angle", "bigger than a right angle"].map((o) => '<button type="button" class="choice word" data-v="' + o + '">' + o + "</button>").join("");
    $("ch12").dataset.right = right; $("ch12").dataset.live = "1";
    $("ch12").onclick = (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch12", b, ok)) return;
      asked12++; if (ok) got12++;
      $("fb12").className = "fb " + (ok ? "good" : "");
      $("fb12").textContent = (ok ? cheer() + " " : "") + "It is " + right + ". How long the arms are drawn makes no difference - the angle is the amount of turn between them. Two right angles together make a straight line.";
      say(ok ? cheer() : "It is " + right);
      scoreLine("sc12", got12, asked12, 4);
      if (got12 >= 4) finish(4, "");
      setTimeout(round12, 2500);
    };
  }
  round12();

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

  /* ---- 17: check ---- */
  const QS = [
    () => { const m = rnd(1, 9); return { q: m + " m = ? cm", opts: [m * 100, m * 10, m * 1000], a: m * 100, why: "100 cm in a metre." }; },
    () => { const k = rnd(1, 9); return { q: k + " kg = ? g", opts: [k * 1000, k * 100, k * 10], a: k * 1000, why: "1000 g in a kilogram." }; },
    () => { return { q: "How many millilitres in one litre?", opts: [1000, 100, 10], a: 1000, why: "1000 ml make 1 litre." }; },
    () => { return { q: "How many right angles make a straight line?", opts: [2, 1, 4], a: 2, why: "Two right angles together are a half turn." }; },
    () => { const st = [10, 100][rnd(0, 1)]; const b = rnd(2, 7) * st; return { q: "A scale is marked every " + st + " g. The pointer is halfway between " + b + " and " + (b + st) + ". What does it read?", opts: [b + st / 2, b + st, b + st / 10], a: b + st / 2, why: "One space is " + st + " g, so halfway is " + (st / 2) + " g past " + b + "." }; },
    () => { return { q: "Which unit would you use for the length of a classroom?", opts: ["metres", "millimetres", "kilometres"], a: "metres", why: "A classroom is a few metres across." }; },
  ];
;
  let qi = 0, got17 = 0, order17 = [];
  function round17() {
    if (qi >= order17.length) {
      $("q17").textContent = ""; $("ch17").innerHTML = "";
      $("fb17").className = "fb good"; $("fb17").textContent = "Finished! " + got17 + " out of " + order17.length + ".";
      $("sc17").textContent = "";
      if (got17 >= 4) finish(7, "You have finished the check.");
      else retryCheck($("fb17"), $("ch17"), got17, order17.length, 4, function () { qi = 0; got17 = 0; order17 = shuffle(QS); round17(); });
      return;
    }
    const item = nextQ(order17[qi]);
    $("q17").textContent = item.q; $("say17").textContent = item.q;
    offer("ch17", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch17", b, ok)) return;
      if (ok) got17++;
      qi++;
      $("fb17").className = "fb " + (ok ? "good" : "");
      $("fb17").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc17").textContent = got17 + " right out of " + qi;
      setTimeout(round17, 2100);
    });
  }
  order17 = shuffle(QS);
  round17();

  /* ---- 18: stickers ---- */
  const STICKERS = [
    ["📏", "Length"],
    ["⚖️", "Mass"],
    ["🥤", "Capacity"],
    ["🌡️", "Reading a scale"],
    ["📐", "Right angles"],
    ["✏️", "Measure from any mark"],
    ["🔄", "Two right angles, one straight line"],
    ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];

  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb18").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb18").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You can measure length, mass and capacity." : got + " of " + STICKERS.length + " stickers so far.";
  }
  $("restart").addEventListener("click", () => location.reload());




  /* ==================================================================
     CONVINCING - "presenting evidence to justify or challenge a
     mathematical idea or solution" (Cambridge TWM.04).

     A tap-to-answer deck cannot ask a child to WRITE a justification, so
     this asks them to recognise one: a claim that is true, and three
     reasons for it of which only one does any work. It is an
     approximation of the characteristic and is recorded as one.

     Every wrong reason is either the misconception the lesson already
     teaches against, or something perfectly TRUE that explains nothing -
     and the second kind is the whole point of the step.

     It works out its own slide index from the DOM, so inserting it moved
     no other step and nothing had to be renumbered.
     ================================================================== */
  (function () {
    const BANK = [
      [
            "You would measure a pencil in centimetres, not kilometres.",
            "A pencil is about 15 cm; measured in kilometres the number would be far too small to be any use.",
            [
                  "Kilometres are only for measuring roads.",
                  "A pencil cannot be measured in kilometres at all."
            ],
            "Any unit would work. You pick the one that gives a sensible number."
      ],
      [
            "1 kilogram is heavier than 750 grams.",
            "A kilogram is 1000 grams, and 1000 grams is more than 750 grams.",
            [
                  "Kilograms are always heavier than grams.",
                  "The word kilogram is longer."
            ],
            "Put both into the same unit before comparing. “Always heavier” is not true either: 200 g beats a tenth of a kilogram."
      ],
      [
            "Half a litre is 500 millilitres.",
            "A litre is 1000 millilitres, and half of 1000 is 500.",
            [
                  "Half of a hundred is fifty.",
                  "Millilitres are very small."
            ],
            "Change the unit first, then halve it. Halving the wrong number is what gives 50."
      ],
      [
            "On a scale marked every 100 g, a pointer halfway between 300 and 400 reads 350 g.",
            "One space on this scale is worth 100 g, so halfway along it is 50 g past 300.",
            [
                  "It sits between 3 and 4, so it is three and a half.",
                  "The pointer is somewhere near the middle."
            ],
            "Work out what ONE space is worth before reading anything off. The marks are not always ones."
      ],
      [
            "A door is about 2 metres tall, not 2 centimetres.",
            "A centimetre is about the width of a fingernail, and two of those would not reach your ankle.",
            [
                  "Metres are the unit used for doors.",
                  "2 centimetres is a small number."
            ],
            "Choosing a unit means picturing the size, not remembering which unit usually goes with which object."
      ],
      [
            "An angle that opens wider than the corner of a page is bigger than a right angle.",
            "The corner of a page is a right angle, so anything opening wider than it is more.",
            [
                  "Its two arms are drawn longer.",
                  "It looks big on the page."
            ],
            "The length of the arms is not the angle. Only the opening between them is, which is why a tiny drawing can hold a big angle."
      ]
];
    const host = document.getElementById("clW");
    if (!host) return;
    /* announce the result. Grade 3's shell marks every .fb and .score as a live
       region; Grade 1's does not, so the step does it for itself rather than
       depending on which shell it has been dropped into. */
    ["fbW", "scW", "clW"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    let got = 0, asked = 0, order = shuffle(BANK), qi = 0, live = false;
    function paint() {
      if (qi >= order.length) { order = shuffle(BANK); qi = 0; }
      const it = order[qi];
      document.getElementById("clW").textContent = it[0];
      document.getElementById("sayW").textContent = it[0] + " Which reason really explains it?";
      document.getElementById("chW").innerHTML = shuffle([it[1]].concat(it[2]))
        .map((o) => '<button type="button" class="choice word" data-v="' + esc(o) + '">' + esc(o) + "</button>").join("");
      document.getElementById("fbW").className = "fb";
      document.getElementById("fbW").textContent = "";
      live = true;
    }
    document.getElementById("chW").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = order[qi];
      const ok = b.dataset.v === it[1];
      [...document.getElementById("chW").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.v === it[1]) x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      asked++; if (ok) got++;
      const fb = document.getElementById("fbW");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not that one. ") + it[3];
      say(ok ? cheer() : it[3]);
      document.getElementById("scW").textContent = got + " right out of " + asked + (got >= 4 ? " - sticker earned!" : "");
      if (got >= 4) finish(SLOT, "");
      qi++;
      setTimeout(paint, 3400);
    });
    paint();
  })();

  show(0, false);
})();
</script>

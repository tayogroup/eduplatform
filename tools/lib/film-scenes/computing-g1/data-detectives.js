  /* ==== Grade 1 Computing, Lesson 6: Data Detectives =========================
     tools/lib/film-scenes/computing-g1/data-detectives.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/data-detectives.json.

     THE LESSON'S OWN NUMBERS LIVE HERE ONCE, AND CHECK THEMSELVES. The
     Computing kit keeps its form, its data table and its sorting machine
     inside closures a film cannot reach (there is no ART.sim), so this film
     draws them itself - which makes every figure in them this film's to get
     right. So the six friends, the four fruit rows and the twelve things of
     the sorting machine are copied from content/lesson-6.py once, below, and
     a load-time check re-derives each count from the list it came from: the
     four row counts from the six friends' answers, and the colour and type
     groups from the twelve things. A picture drawn from a filter of the same
     list cannot then disagree with the row it sits beside, or with the voice.

     This file: the palette, the lists and their check, the small drawings the
     chapters share, the title motif, and the chapter "What data is". Every
     top-level name here starts with dd, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, data: P.gold, ask: P.blue, form: P.plum,
    table: P.good, sorting: P.accent, rowscols: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ddOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ddFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var DD_SCATTER = [0.18, 0.74, 0.41, 0.92, 0.29, 0.61, 0.07, 0.86, 0.35, 0.68, 0.14, 0.53];

  /* ---- the lesson's data, copied from content/lesson-6.py --------------- */

  /* the table of the "table" step (FRUIT_ROWS) */
  var DD_FRUIT = [
    { id: "apple", label: "Apple", pic: "\u{1F34E}", n: 2 },
    { id: "banana", label: "Banana", pic: "\u{1F34C}", n: 3 },
    { id: "mango", label: "Mango", pic: "\u{1F96D}", n: 1 },
    { id: "orange", label: "Orange", pic: "\u{1F34A}", n: 0 }
  ];
  /* the six friends of the "form" step, in the order the lesson asks them */
  var DD_PEOPLE = [
    { name: "Amal", pic: "\u{1F467}\u{1F3FE}", answer: "banana", say: "Bananas are my favourite!" },
    { name: "Sami", pic: "\u{1F466}\u{1F3FE}", answer: "apple", say: "I like apples best." },
    { name: "Nora", pic: "\u{1F467}\u{1F3FD}", answer: "mango", say: "Mango. Definitely mango." },
    { name: "Omar", pic: "\u{1F466}\u{1F3FD}", answer: "banana", say: "Banana for me." },
    { name: "Hana", pic: "\u{1F467}\u{1F3FF}", answer: "apple", say: "Apples, please." },
    { name: "Tariq", pic: "\u{1F466}\u{1F3FF}", answer: "banana", say: "I love bananas." }
  ];
  /* the twelve things of the sorting machine, and its two ways of sorting */
  var DD_THINGS = [
    { pic: "\u{1F34E}", label: "apple", colour: "red", type: "fruit" },
    { pic: "\u{1F34C}", label: "banana", colour: "yellow", type: "fruit" },
    { pic: "\u{1F955}", label: "carrot", colour: "orange", type: "vegetable" },
    { pic: "\u{1F34B}", label: "lemon", colour: "yellow", type: "fruit" },
    { pic: "\u{1F966}", label: "broccoli", colour: "green", type: "vegetable" },
    { pic: "\u{1F350}", label: "pear", colour: "green", type: "fruit" },
    { pic: "\u{1F33D}", label: "corn", colour: "yellow", type: "vegetable" },
    { pic: "\u{1F353}", label: "strawberry", colour: "red", type: "fruit" },
    { pic: "\u{1F952}", label: "cucumber", colour: "green", type: "vegetable" },
    { pic: "\u{1F34A}", label: "orange", colour: "orange", type: "fruit" },
    { pic: "\u{1F383}", label: "pumpkin", colour: "orange", type: "vegetable" },
    { pic: "\u{1F34D}", label: "pineapple", colour: "yellow", type: "fruit" }
  ];
  var DD_COLOURS = ["red", "yellow", "green", "orange"];
  var DD_TYPES = ["fruit", "vegetable"];
  /* every group is DERIVED, so a box and its label count the same things */
  function ddGroup(field, name) {
    return DD_THINGS.filter(function (x) { return x[field] === name; });
  }
  /* how many answers are in the table after the first n friends have recorded */
  function ddCounts(n) {
    var c = {};
    DD_FRUIT.forEach(function (f) { c[f.id] = 0; });
    for (var k = 0; k < Math.min(n, DD_PEOPLE.length); k++) c[DD_PEOPLE[k].answer]++;
    return c;
  }

  /* The check the lead asked for: a chart must agree with itself as well as
     with its words, and it is arithmetic rather than a look. It runs as the
     page loads, so a wrong figure stops the film by name before a frame is
     drawn or a clip is bought. */
  (function () {
    var full = ddCounts(DD_PEOPLE.length), total = 0;
    DD_FRUIT.forEach(function (f) {
      total += f.n;
      if (full[f.id] !== f.n)
        throw new Error("data-detectives: the table says " + f.label + " " + f.n +
          ", and the six friends give " + full[f.id]);
    });
    if (total !== DD_PEOPLE.length)
      throw new Error("data-detectives: the table's counts add up to " + total + ", not to " + DD_PEOPLE.length + " friends");
    if (DD_THINGS.length !== 12) throw new Error("data-detectives: the sorting machine has " + DD_THINGS.length + " things, not twelve");
    [["colour", DD_COLOURS], ["type", DD_TYPES]].forEach(function (p) {
      var sum = 0;
      p[1].forEach(function (g) { sum += ddGroup(p[0], g).length; });
      if (sum !== DD_THINGS.length)
        throw new Error("data-detectives: sorting by " + p[0] + " puts " + sum + " of the twelve things into a group");
    });
    /* the counts the film's voice and its boxes both rest on */
    var say = { red: 2, yellow: 4, green: 3, orange: 3, fruit: 7, vegetable: 5 };
    Object.keys(say).forEach(function (g) {
      var field = DD_COLOURS.indexOf(g) >= 0 ? "colour" : "type", got = ddGroup(field, g).length;
      if (got !== say[g]) throw new Error("data-detectives: the " + g + " group holds " + got + ", not " + say[g]);
    });
  })();

  /* ---- small drawings the chapters share -------------------------------- */

  /* a card: a rounded panel, lit when it is the thing being named */
  function ddCard(x, y, w, h, lit, o, r) {
    return R(x, y, w, h, r == null ? 18 : r, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* one row of a fruit table: the picture, the name, one picture per child
     (the lesson's own pictogram cell) and the number. n is read from the row,
     never passed in, so the marks and the number cannot disagree. */
  function ddFruitRow(x, y, w, f, n, o, lit) {
    if (!(o > 0)) return "";
    var out = "";
    if (lit) out += R(x + 6, y - 24, w - 12, 48, 12, "rgba(244,201,93,0.16)", P.gold, 2.5);
    out += MK.pic(x + 34, y, 30, f.pic);
    out += Tx(x + 62, y + 9, f.label, "lab big", "start");
    for (var k = 0; k < n; k++) out += MK.pic(x + w * 0.46 + k * 40, y, 27, f.pic, { opacity: 0.95 });
    out += Tx(x + w - 26, y + 10, String(n), "lab big gold", "end");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the whole fruit table, as a card. rows(f) says how many of f to show, so
     a filling table and a finished one are the same drawing. */
  function ddFruitTable(x, y, w, t, o, opt) {
    opt = opt || {};
    var rows = opt.rows || function (f) { return f.n; };
    var lit = opt.lit || function () { return false; };
    var head = 46, rh = opt.rh || 62, h = 34 + head + DD_FRUIT.length * rh + 14;
    var out = ddCard(x, y, w, h, false, 1);
    out += Tx(x + w / 2, y + 34, "Favourite fruit in our class", "lab mid muted", "middle");
    out += Tx(x + 34, y + 34 + head - 8, "Fruit", "lab mid muted", "start");
    out += Tx(x + w - 26, y + 34 + head - 8, "How many", "lab mid muted", "end");
    out += L(x + 16, y + 34 + head, x + w - 16, y + 34 + head, P.line, 2);
    DD_FRUIT.forEach(function (f, k) {
      out += ddFruitRow(x, y + 34 + head + rh * k + rh / 2, w, f, rows(f, k), 1, lit(f, k));
    });
    return { markup: G(out, { opacity: clamp(o, 0, 1) }), h: h, rowY: function (k) { return y + 34 + head + rh * k + rh / 2; } };
  }

  /* ==== the title ============================================================
     The lesson's table in a round window: the four fruit rows, their pictures
     counting up as "facts and numbers" is said, a magnifying glass that reads
     down them, and the rows sorting themselves biggest first when the voice
     says a computer sorts it. On the two cards it simply stands, read and
     sorted. */
  var DD_M = { x: 62, y: 96, w: 236, rh: 40 };
  /* the row order after the computer has sorted it: biggest count first */
  var DD_SORTED = DD_FRUIT.map(function (f, k) { return k; }).sort(function (a, b) { return DD_FRUIT[b].n - DD_FRUIT[a].n; });
  /* Apple and Banana swap past each other (2 and 3, next-door counts). A
     straight lerp puts both rows on the same line at the same moment - the
     picture, the label, the dots and the number all land on one spot and are
     unreadable (found in review). So a swapping row also bows away from the
     straight line, the one going down bowing UP and the one going up bowing
     DOWN, the opposite of its own direction - so the two rows pass on
     different lines rather than the same one, never only side by side on it. */
  function ddMotifRowY(k, u) {
    var to = DD_SORTED.indexOf(k);
    var uu = clamp(u, 0, 1), base = DD_M.y + 54 + lerp(k, to, uu) * DD_M.rh;
    if (to === k) return base;
    return base + Math.sin(Math.PI * uu) * (to > k ? -15 : 15);
  }
  /* and steps sideways too, the one going down to the right, the one going up
     to the left, so the two rows are apart on both axes at the crossing. */
  function ddMotifRowX(k, u) {
    var to = DD_SORTED.indexOf(k);
    if (to === k) return 0;
    return Math.sin(Math.PI * clamp(u, 0, 1)) * (to > k ? 18 : -18);
  }
  function titleMotif(o) {
    var t = o.t || 0, out = "", s = o.scene;
    var cData = s ? sc(s, 0, "data") : null, cFacts = s ? sc(s, 0, "facts") : null;
    var cDet = s ? sc(s, 1, "detective") : null, cRead = s ? sc(s, 1, "read") : null, cSorts = s ? sc(s, 1, "sorts") : null;
    var card = s ? popIn(t, cData, 0.45) : 1;
    var shown = s ? tally(t, cFacts, DD_FRUIT.length, 1.0) : DD_FRUIT.length;
    var glass = s ? popIn(t, cDet, 0.4) : 1;
    var readU = s ? on(t, cRead, 0.9) : 1;
    var sortU = s ? on(t, cSorts, 0.8) : 1;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 176, 150, P.gold, (s ? on(t, cFacts, 0.8) : 1) * 0.6);
    if (card > 0) {
      var inner = R(DD_M.x, DD_M.y, DD_M.w, 212, 16, P.card, P.line, 2);
      inner += Tx(180, DD_M.y + 28, "Favourite fruit", "lab mid muted", "middle");
      inner += L(DD_M.x + 12, DD_M.y + 40, DD_M.x + DD_M.w - 12, DD_M.y + 40, P.line, 2);
      DD_FRUIT.forEach(function (f, k) {
        var y = ddMotifRowY(k, sortU), dx = ddMotifRowX(k, sortU), lit = k < shown ? 1 : 0.28;
        inner += MK.pic(DD_M.x + 26 + dx, y, 24, f.pic, { opacity: lit });
        inner += Tx(DD_M.x + 46 + dx, y + 7, f.label, "lab mid", "start", { opacity: lit });
        for (var q = 0; q < (k < shown ? f.n : 0); q++) inner += C(DD_M.x + 140 + dx + q * 18, y - 3, 7, P.gold);
        inner += Tx(DD_M.x + DD_M.w - 18 + dx, y + 7, k < shown ? String(f.n) : "", "lab mid gold", "end");
      });
      out += G(inner, { transform: around(180, DD_M.y + 106, Math.min(card, 1.08)), opacity: Math.min(1, card) });
    }
    if (glass > 0) {
      var gy = lerp(DD_M.y + 62, DD_M.y + 166, readU);
      out += G(C(108, gy, 30, "rgba(53,191,178,0.14)", P.teal, 6) + L(128, gy + 21, 150, gy + 43, P.teal, 10),
        { transform: around(108, gy, Math.min(glass, 1.08)), opacity: Math.min(1, glass) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A data table of favourite fruit, read with a magnifying glass">' + out + "</svg>";
  }

  /* ==== chapter: what data is =================================================
     Four of the lesson's six data cards (names, favourite colours, how many
     pets, how tall you are), each appearing as it is named. Then the lesson's
     own correction - data does not have to be numbers - with the two word
     cards ticked. Then the four gather and go into a computer: the kit's own
     laptop. */
  var DD_DCARD = { w: 230, h: 200, y: 32, gap: 22 };
  var DD_DATA = [
    { pic: "\u{1F4DB}", label: "names", sample: "Amal, Sami, Nora", words: true },
    { pic: "\u{1F3A8}", label: "favourite colours", swatches: ["#E0483C", "#4A78D8", "#4A78D8", "#3E9E52"], words: true },
    { pic: "\u{1F436}", label: "how many pets", sample: "one, none, two" },
    { pic: "\u{1F4CF}", label: "how tall you are", sample: "a number we measure" }
  ];
  function ddDataX(k) {
    var total = DD_DATA.length * DD_DCARD.w + (DD_DATA.length - 1) * DD_DCARD.gap;
    return (1168 - total) / 2 + k * (DD_DCARD.w + DD_DCARD.gap);
  }
  function ddDataCard(k, p, t, tickAt, tickO) {
    if (!(p > 0)) return "";
    var d = DD_DATA[k], x = ddDataX(k), y = DD_DCARD.y, w = DD_DCARD.w, h = DD_DCARD.h;
    var out = ddCard(x, y, w, h, true, 1);
    out += MK.pic(x + w / 2, y + 60, 54, d.pic);
    out += Tx(x + w / 2, y + 122, d.label, "lab mid", "middle");
    if (d.swatches) {
      d.swatches.forEach(function (c, q) { out += R(x + w / 2 - 74 + q * 38, y + 148, 30, 24, 7, c, P.line, 1.5); });
    } else {
      out += Tx(x + w / 2, y + 166, d.sample, "lab mid muted readable", "middle");
    }
    if (d.words && tickAt != null) out += MK.tick(x + w - 22, y + 20, 18, popIn(t, tickAt + k * 0.18, 0.35) * (tickO == null ? 1 : tickO));
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(p, 1.08)), opacity: Math.min(1, p) });
  }
  function ddDataChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cName = c(0, "name"), cColour = c(0, "colour");
    var cPets = c(1, "pets"), cTall = c(1, "tall");
    var cNumbers = c(2, "numbers"), cWords = c(2, "words");
    var cColl = c(3, "collected"), cComp = c(3, "computer");
    var out = "", ats = [cName, cColour, cPets, cTall];

    var mis = ddOnly(t, scene, 2);
    ats.forEach(function (at, k) { out += ddDataCard(k, popIn(t, at, 0.42), t, cWords, mis); });

    /* the lesson's own correction, for its own beat */
    if (mis > 0) {
      var q = on(t, cNumbers, 0.4), w = on(t, cWords, 0.4);
      out += G(MK.pill(584, 288, "Data must be numbers?", q, { size: 28, col: P.line }) +
        MK.qmark(842, 288, 24, q * (1 - w)) + MK.cross(842, 288, 24, popIn(t, cWords, 0.35)) +
        MK.pill(584, 372, "Words are data too", w, { size: 28, col: P.good, ink: P.good }) +
        MK.tick(842, 372, 24, popIn(t, cWords == null ? null : cWords + 0.2, 0.35)),
        { opacity: mis });
    }

    /* collected, and into a computer: the kit's own laptop */
    var got = ddFrom(t, scene, 3);
    if (got > 0) {
      var gather = on(t, cColl, 0.6);
      if (gather > 0) out += R(ddDataX(0) - 12, DD_DCARD.y - 12, 1168 - 2 * (ddDataX(0) - 12), DD_DCARD.h + 24, 20,
        "none", P.gold, 3, { opacity: gather * 0.9, "stroke-dasharray": "13 9" });
      var lp = popIn(t, cComp, 0.45);
      if (lp > 0) {
        var lw = 196, lh = lw * 268 / 360, lx = 584 - lw / 2, ly = 280;
        out += G(ART.place(ART.figure("laptop"), lx, ly, lw, lh), { transform: around(584, ly + lh / 2, Math.min(lp, 1.08)), opacity: Math.min(1, lp) });
        DD_DATA.forEach(function (d, k) {
          var ax = ddDataX(k) + DD_DCARD.w / 2;
          out += MK.arrow(ax, DD_DCARD.y + DD_DCARD.h + 8, 584 + (k - 1.5) * 30, ly - 6,
            on(t, cComp == null ? null : cComp + 0.15 + k * 0.1, 0.5), P.gold, 6);
        });
      }
    }
    return svg(out);
  }

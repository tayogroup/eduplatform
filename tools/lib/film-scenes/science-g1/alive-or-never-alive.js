
  /* ==== Grade 1 Science, Lesson 1: Alive or Never Alive =====================
     tools/lib/film-scenes/science-g1/alive-or-never-alive.js, part 1 of 3: the
     colours, the lesson's four questions, the title motif, and the goat and
     stone chapters. Parts -2 and -3 follow in the same scope (the storyboard's
     renderer.scenes lists all three), and -3 defines KINDS.

     Every picture is one the lesson itself shows: the goat and the stone of its
     first demonstration, asked its four questions (the sort step's "does it
     grow? Does it need food? Does it need water? Can it have young?"); the
     spoon, car and teddy bear of its explore step; the cat, its three needs and
     the ball of wool of its sort; the kit's growing seed and tap plant; and the
     two pots of plantWater exactly as the experiment opens, on Day 1. The
     experiment is set up and never run: the lecture says "Today you will find
     out", and the child predicts before the lesson shows what happens.

     See src/prototypes/ehel-academy/science/grade-1-app/lecture-video/BRIEF.md. */

  var HUE = {
    title: P.teal, alive: P.gold, never: P.plum, animals: P.accent,
    plants: P.good, water: P.blue, scientist: P.gold, recap: P.teal
  };

  /* the lesson's own pictures (lesson-1.py). The stone is Emoji 13, so MK.pic
     draws the kit's rock for it, as the lesson does on older devices. */
  var GOAT = "\u{1F410}", STONE = "\u{1FAA8}", SPOON = "\u{1F944}", CAR = "\u{1F697}", TEDDY = "\u{1F9F8}";
  var HERB = "\u{1F33F}", DROP = "\u{1F4A7}";

  /* Emoji fill their em square, centred on the anchor (measured here, Windows'
     set): the goat faces left, its hooves stand at +0.465 of its size and its
     mouth is at (-0.47, -0.17). */
  var GOAT_FEET = 0.465, GOAT_MOUTH = [-0.47, -0.17];
  function goatAt(cx, feet, s, extra) { return Em(cx, feet - GOAT_FEET * s, s, GOAT, extra); }
  function ground(cx, y, rx, o) { return o > 0 ? E(cx, y, rx, 16, P.cell, null, null, { opacity: o }) : ""; }

  /* on from `at`, off again from `until` */
  function span(t, at, until, a, b) {
    if (at == null) return 0;
    return on(t, at, a || 0.35) * (until == null ? 1 : 1 - inAt(t, until, b || 0.35));
  }
  /* when the k-th beat of a scene starts, less the pause before it */
  function beatStart(scene, k) { return k < scene.beats.length ? BEATS[scene.first + k].start - 0.2 : null; }

  /* ==== the four questions ====================================================
     Rows on the right of the goat and the stone chapters, the same four both
     times, so the stone is seen failing the very test the goat passed.
     rows[r] = {o: shown 0..1, hot: 0..1 (being asked now), mark: "tick" | "cross", p: its pop} */
  var QS = ["Does it grow?", "Does it need food?", "Does it need water?", "Can it have young?"];
  var QY = [70, 162, 254, 346];
  function questionRows(rows, hue) {
    var out = "";
    rows.forEach(function (w, r) {
      if (!(w.o > 0)) return;
      var y = QY[r], hot = clamp(w.hot || 0, 0, 1), done = w.p > 0;
      var g = R(596, y - 38, 568, 76, 18, hot > 0.5 ? "#1B3A52" : P.card, hot > 0.05 ? hue : P.line, 2 + 2 * hot) +
        C(640, y, 23, P.cell, hue, 3) + Tx(640, y + 10, String(r + 1), "lab big", "middle") +
        Tx(682, y + 11, QS[r], "lab big", "start", done || hot > 0.05 ? {} : { fill: P.muted });
      if (w.mark === "tick") g += MK.tick(1122, y, 24, w.p);
      if (w.mark === "cross") g += MK.cross(1122, y, 24, w.p);
      /* they slide in from the left: from the right they crossed x = 1168 */
      out += G(g, { opacity: Math.min(1, w.o), transform: "translate(" + n2(-(1 - Math.min(1, w.o)) * 14) + ",0)" });
    });
    return out;
  }

  /* ==== the title motif ========================================================
     The goat and the stone of the first line. Spoken (the title chapter), each
     appears as it is named, the goat is ticked on "is alive" and the stone
     ringed on "never alive"; on the cards only the two are drawn, faint. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene;
    var pg = s ? popIn(t, sc(s, 0, "goat"), 0.5) : 1, ps = s ? popIn(t, sc(s, 0, "stone"), 0.5) : 1;
    var pa = s ? popIn(t, sc(s, 1, "alive"), 0.4) : 0, pn = s ? on(t, sc(s, 1, "never"), 0.5) : 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A goat, which is alive, and a stone, which was never alive">' +
      E(180, 302, 160, 20, P.cell) +
      G(goatAt(112, 300, 186), { transform: around(112, 300, Math.min(pg, 1.1)), opacity: Math.min(1, pg) }) +
      G(MK.pic(282, 256, 120, STONE), { transform: around(282, 300, Math.min(ps, 1.1)), opacity: Math.min(1, ps) }) +
      MK.tick(196, 106, 26, pa) +
      G(C(282, 262, 64, "none", P.muted, 3, { "stroke-dasharray": "9 8" }), { opacity: 0.9 * pn }) +
      "</svg>";
  }

  /* ==== chapter: what alive means ==============================================
     The goat of the lesson's demonstration, and its four questions. Each row
     is asked on its number and ticked on its answer, and the goat does the
     thing: a kid stands in its place and grows back into the goat, a sprig of
     grass is eaten, a drop of water drunk, and two kids arrive. On "is alive"
     the four rows light once more and the goat is labelled alive. */
  var GX = 262, GFEET = 350, GS = 236;
  function sceneAlive(scene, beat, t, i) {
    var hue = HUE.alive, c = function (b, n) { return sc(scene, b, n); };
    var goatIn = c(0, "goat"), four = c(0, "four");
    var baby = c(1, "baby"), kid = c(1, "kid"), big = c(1, "big");
    var food = c(2, "food"), grass = c(2, "grass"), water = c(3, "water"), drinks = c(3, "drinks");
    var kids = c(4, "kids"), alive = c(5, "alive");
    var mx = GX + GOAT_MOUTH[0] * GS, my = GFEET - GOAT_FEET * GS + GOAT_MOUTH[1] * GS;
    var out = ground(GX + 80, GFEET + 4, 230, inAt(t, scene.start, 0.5));

    /* alive: the goat and its kids drawn into one group as the rule begins,
       and named on "is alive", as the stone, spoon, car and teddy bear are
       grouped "never alive" in the next chapter. Named on "is alive" alone it
       was on screen for under a second before the chapter ended. */
    var ao0 = on(t, c(5, "grows"), 0.8), ap = popIn(t, alive, 0.45);
    if (ao0 > 0) out += G(R(96, 96, 484, 288, 30, "rgba(79,209,160,0.07)", P.good, 3, { "stroke-dasharray": "16 11" }), { opacity: ao0 });
    if (ap > 0) out += G(MK.pill(338, 96, "alive", 1, { size: 30, col: P.good, ink: P.good, fill: P.ground }), { transform: around(338, 96, Math.min(ap, 1.1)), opacity: Math.min(1, ap) });

    /* the goat; from "A baby goat" a kid stands in its place, and from "grows
       into a big goat" it grows back to full size (an arrow rises beside it) */
    var gp = popIn(t, goatIn, 0.45), bigO = baby == null || t < baby ? 1 : 1 - inAt(t, baby, 0.3);
    if (gp > 0 && bigO > 0) out += G(goatAt(GX, GFEET, GS), { opacity: Math.min(1, gp) * bigO, transform: around(GX, GFEET, Math.min(gp, 1.1)) });
    if (baby != null && t >= baby) {
      var kp = popIn(t, baby + 0.05, 0.4), grow = on(t, big, 1.2);
      out += G(goatAt(GX, GFEET, GS), { opacity: Math.min(1, kp), transform: around(GX, GFEET, lerp(0.42, 1, grow) * Math.min(kp, 1.1)) });
      var ao = grow > 0 ? 1 - inAt(t, big + 1.7, 0.4) : 0;
      if (ao > 0) out += G(MK.arrow(GX + 168, GFEET - 8, GX + 168, GFEET - 214, grow, hue, 8), { opacity: ao });
      var ko = span(t, kid, big == null ? null : big + 0.25);
      if (ko > 0) out += MK.pill(GX, GFEET - 150, "kid", ko, { size: 30, col: hue });
    }

    /* "Is a goat alive?": a question mark, until the checking starts */
    out += MK.qmark(GX + 150, 96, 30, span(t, goatIn == null ? null : goatIn + 0.5, beatStart(scene, 1)));

    /* food: a sprig of grass at the goat's mouth, eaten; water: a drop, drunk */
    var fp = popIn(t, food, 0.4), fo = 1 - inAt(t, beatStart(scene, 3), 0.4);
    if (fp > 0 && fo > 0) {
      var eat = on(t, grass, 1.3), bite = 0.08 * (bump(t, grass, 0.45) + bump(t, grass == null ? null : grass + 0.5, 0.45));
      out += G(Em(mx - 46 + 18 * eat, my + 14, 84, HERB), { opacity: fo * Math.min(1, fp), transform: around(mx - 30, my + 20, Math.min(fp, 1.1) * (1 - 0.45 * eat - bite)) });
    }
    var wp = popIn(t, water, 0.4);
    if (wp > 0) {
      var sip = on(t, drinks, 1.1), wo = 1 - inAt(t, drinks == null ? null : drinks + 0.8, 0.4);
      if (wo > 0) out += G(Em(lerp(mx - 44, mx - 6, sip), lerp(my + 10, my, sip), 70, DROP), { opacity: wo * Math.min(1, wp), transform: around(mx - 30, my + 8, Math.min(wp, 1.1) * (1 - 0.7 * sip)) });
    }

    /* young: two kids arrive beside the goat */
    [[GX + 168, 0.4, 0], [GX + 250, 0.36, 0.25]].forEach(function (k) {
      var p = popIn(t, kids == null ? null : kids + k[2], 0.4);
      if (p > 0) out += G(goatAt(k[0], GFEET, GS * k[1]), { transform: around(k[0], GFEET, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });

    /* the rows: shown on "four things", asked in turn, and lit again on the
       last line as each is said once more */
    var ask = [c(1, "one"), c(2, "two"), c(3, "three"), c(4, "four")], yes = [c(1, "grows"), food, water, c(4, "young")];
    var again = [c(5, "grows"), c(5, "food"), c(5, "food"), c(5, "young")];
    var rows = [0, 1, 2, 3].map(function (r) {
      return { o: on(t, four == null ? null : four + r * 0.18, 0.35),
        hot: span(t, ask[r], beatStart(scene, r + 2)) + bump(t, again[r], 1.0),
        mark: "tick", p: popIn(t, yes[r], 0.35) };
    });
    return svg(out + questionRows(rows, hue));
  }

  /* ==== chapter: never alive ===================================================
     The stone takes the goat's place and fails the same four questions, a
     cross on each "No". Then it joins the spoon, the car and the teddy bear of
     the lesson's explore step in one group, "never alive". Last, the car
     drives: it moves, and it was never alive. */
  var SLOTS = [250, 470, 690, 910];
  function stoneAt(cx, cy, s, extra) { return MK.pic(cx, cy, s, STONE, extra); }   /* the kit's rock: its foot is at +0.375 s */

  function neverGroup(scene, t) {
    var hue = HUE.never, c = function (b, n) { return sc(scene, b, n); };
    var stoneIn = c(0, "stone"), never = c(2, "never");
    var out = ground(GX + 10, GFEET + 4, 220, inAt(t, scene.start, 0.5) * (1 - on(t, never, 0.5)));

    /* the stone: where the goat stood, then into the group */
    var sp = popIn(t, stoneIn, 0.45), mv = on(t, never, 0.8);
    /* the kit's rock fills less of its box than an emoji does, so in the
       group it is drawn larger to stand level with the spoon, car and bear */
    var sx = lerp(GX, SLOTS[0], mv), s = lerp(210, 178, mv), sy = lerp(GFEET - 0.375 * 210, 305 - 0.375 * 178, mv);
    if (sp > 0) out += G(stoneAt(sx, sy, s), { transform: around(sx, sy + 0.375 * s, Math.min(sp, 1.1)), opacity: Math.min(1, sp) });

    /* the group, "never alive", filled as each thing is named */
    var fo = on(t, never == null ? null : never + 0.2, 0.5);
    if (fo > 0) {
      out += G(R(120, 104, 918, 262, 30, "none", hue, 3, { "stroke-dasharray": "16 11" }), { opacity: fo });
      out += MK.pill(579, 104, "never alive", fo, { size: 30, col: hue, ink: hue, fill: P.ground });
    }
    [[SPOON, "spoon"], [CAR, "car"], [TEDDY, "teddy"]].forEach(function (x, k) {
      var p = popIn(t, c(2, x[1]), 0.4);
      if (p > 0) out += G(Em(SLOTS[k + 1], 238, 150, x[0]), { transform: around(SLOTS[k + 1], 300, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });

    /* the four questions, each answered No */
    var b1 = scene.first + 1;
    var ask = [c(0, "grow"), c(1, "food"), c(1, "food"), c(1, "young")];
    var no = [c(0, "no"), c(1, "no"), c(1, "no") == null ? null : c(1, "no") + 0.12, spokenEnd(b1) - 0.3];
    var until = [beatStart(scene, 1), c(1, "young"), c(1, "young"), beatStart(scene, 2)];
    var ro = inAt(t, scene.start + 0.15, 0.5) * (1 - on(t, never, 0.4));
    var rows = [0, 1, 2, 3].map(function (r) {
      return { o: ro, hot: span(t, ask[r], until[r]), mark: "cross", p: popIn(t, no[r], 0.35) };
    });
    return out + questionRows(rows, hue);
  }

  /* the car: out on a road, it drives, and still it was never alive */
  function neverCar(scene, t) {
    var hue = HUE.never, k = scene.first + 3;
    var moves = cue(k, "moves"), never = cue(k, "never"), test = cue(k, "test");
    var d = on(t, moves, 1.8), x = lerp(930, 430, d), going = d > 0 && d < 1;
    var out = R(0, 316, 1168, 66, 0, P.cell) + L(0, 349, 1168, 349, P.muted, 4, { "stroke-dasharray": "36 26", opacity: 0.55 });
    if (going) for (var s = 0; s < 3; s++) out += L(x + 110 + s * 12, 250 + s * 30, x + 190 + s * 12, 250 + s * 30, P.muted, 5, { opacity: 0.7 });
    out += Em(x, 280, 190, CAR);
    out += MK.pill(430, 410, "never alive", on(t, never, 0.4), { size: 28, col: hue, ink: hue });
    var tp = on(t, test, 0.4);
    if (tp > 0) out += MK.pill(430, 118, "moving", tp, { size: 32, col: P.bad }) + MK.cross(560, 118, 30, popIn(t, test == null ? null : test + 0.25, 0.35));
    return out;
  }

  function sceneNever(scene, beat, t, i) {
    var k = i - scene.first;
    if (k < 3) return svg(neverGroup(scene, t));
    var u = into(t, i);
    return svg((u < 1 ? G(neverGroup(scene, t), { opacity: 1 - u }) : "") + G(neverCar(scene, t), { opacity: u }));
  }

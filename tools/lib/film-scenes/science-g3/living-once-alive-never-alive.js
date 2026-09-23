  /* ==== Grade 3 Science, Lesson 1: Living, Once Alive, Never Alive ===========
     tools/lib/film-scenes/science-g3/living-once-alive-never-alive.js, with
     -2.js, -3.js and -4.js: the film's pictures, after the shared marks (MK)
     and before the engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/living-once-alive-never-alive.json.

     The lesson draws this one with pictures rather than with the kit's
     diagrams, so the film uses the lesson's OWN pictures: the four life
     process cards of its "Four life processes" step, the tree, axe, wood and
     chair of its "Where once-alive things come from" demo, the stone, spoon,
     drinking glass and plastic cup and the three bins of its three-way sort,
     the five enquiry cards with its own example questions, and its snail. The
     rock, the wood log and the drinking glass are the kit's own drawings
     (ART.icon / ART.ICONS), as the lesson shows them.

     This file: the palette, the shared helpers and small drawings, the title
     motif, and the chapter "What every living thing does". Every top-level
     name here starts with lo, so nothing can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, life: P.good, once: P.gold, never: P.blue,
    enquiry: P.plum, question: P.accent, recap: P.teal
  };

  /* ---- the lesson's own pictures ------------------------------------------- */
  var LO = {
    cat: "\u{1F431}",            /* the sort's "a cat" */
    catRun: "\u{1F408}",         /* a whole cat, for the one that runs */
    tree: "\u{1F333}",
    axe: "\u{1FA93}",
    wood: "\u{1FAB5}",           /* ART.icon -> the kit's wood (a log) */
    chair: "\u{1FA91}",
    sheep: "\u{1F411}",
    jumper: "\u{1F9F6}",
    book: "\u{1F4D6}",
    shoe: "\u{1F45E}",
    stone: "\u{1FAA8}",          /* ART.icon -> the kit's rock */
    spoon: "\u{1F944}",
    cup: "\u{1F964}",
    bolt: "\u{1F529}",           /* the sort's "never alive" bin */
    seedling: "\u{1F331}",       /* the sort's "living" bin, and the seedling */
    sunflower: "\u{1F33B}",      /* the lesson's own turning plant */
    plate: "\u{1F37D}\uFE0F",    /* nutrition */
    chart: "\u{1F4C8}",          /* growth, and pattern seeking */
    runner: "\u{1F3C3}\u{1F3FE}",/* movement */
    chick: "\u{1F423}",          /* reproduction */
    dna: "\u{1F9EC}",            /* life processes */
    snail: "\u{1F40C}",
    moon: "\u{1F319}",
    books: "\u{1F4DA}",          /* research */
    scales: "\u2696\uFE0F",      /* fair test */
    sand: "\u23F3",              /* observing over time */
    files: "\u{1F5C2}\uFE0F",    /* identifying and classifying */
    lens: "\u{1F50E}",
    ask: "\u2753",
    eyes: "\u{1F440}",
    child: "\u{1F9D2}"
  };
  var LO_GLASS = ART.ICONS.glass;       /* the lesson's own drinking glass */
  var LO_TADPOLE = ART.ICONS.tadpole;   /* the lesson's own tadpole */

  /* ---- timing --------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function loOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function loFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* how long is left of the chapter's beat k after `at`, so an action that
     starts late still finishes inside its own line */
  function loRoom(scene, k, at, most) {
    if (at == null) return most || 1;
    var left = spokenEnd(sb(scene, k)) - at - 0.25;
    return clamp(left, 0.35, most || 1.2);
  }

  /* ---- small drawings of the film's own -------------------------------------- */

  /* a card: the plate everything in this film stands on */
  function loCard(x, y, w, h, o, col, fill) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, fill || P.card, col || P.line, col ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* the Sun, the kit's gold, with eight rays turning slowly */
  function loSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3,
                cx + Math.cos(a) * r * 1.76, cy + Math.sin(a) * r * 1.76, P.gold, r * 0.22);
    }
    return G(MK.glow(cx, cy, r * 2.2, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* a seed, the colour the lesson's own seed drawing uses */
  function loSeed(cx, cy, rx, rot, o) {
    if (!(o > 0)) return "";
    return G(E(0, 0, rx, rx * 0.66, "#C7A76B", "#8B6A3A", Math.max(1, rx * 0.2)),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot || 0) + ")", opacity: clamp(o, 0, 1) });
  }

  /* three short speed lines behind a thing that is moving */
  function loSpeed(x, y, len, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 3; k++) out += L(x, y - 22 + k * 22, x - len * (1 - k * 0.18), y - 22 + k * 22, P.ink, 5, { opacity: 0.45 * o });
    return out;
  }

  /* a stopwatch, its hand going round once a second: a pure function of t */
  function loWatch(cx, cy, r, o, t, running) {
    if (!(o > 0)) return "";
    var a = (running ? (t % 1) : 0) * Math.PI * 2 - Math.PI / 2;
    return G(R(cx - 7, cy - r - 13, 14, 12, 4, P.edge) +
      C(cx, cy, r, P.paper, P.edge, 4) +
      L(cx, cy, cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66, P.accent, 4) +
      C(cx, cy, 4, P.accent), { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a line to the thing it names */
  function loLabel(t, x, y, text, at, to, gold, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = gold ? P.gold : P.muted;
    return (to ? MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col) : "") +
      MK.pill(x, y, text, o, { size: size || 22, col: gold ? P.gold : P.line });
  }

  /* ==== the title motif ==========================================================
     The lesson's three groups, as its sort bins name them: a cat, a wooden
     chair and a stone, side by side. In the spoken title chapter each pops in
     as it is named, and each is given its group's colour as the second line
     says which is which: green for living, gold for once alive, blue for never
     alive. On the two cards they simply stand there. */
  var LO_MOTIF = [
    { pic: "\u{1F431}", cue: "cat", verdict: "living", col: P.good },
    { pic: "\u{1FA91}", cue: "chair", verdict: "once", col: P.gold },
    { pic: "\u{1FAA8}", cue: "stone", verdict: "never", col: P.blue }
  ];
  function titleMotif(o) {
    var t = o.t || 0, sceneIs = o.scene, out = "";
    out += C(180, 180, 172, "#123247") + C(180, 180, 172, "none", P.line, 3);
    LO_MOTIF.forEach(function (m, k) {
      var cx = 76 + k * 104;
      var inP = sceneIs ? popIn(t, sc(sceneIs, 0, m.cue), 0.4) : 1;
      var vP = sceneIs ? popIn(t, sc(sceneIs, 1, m.verdict), 0.4) : 1;
      if (inP <= 0) return;
      var col = vP > 0 ? m.col : P.line;
      out += G(C(cx, 172, 50, P.cell, col, vP > 0 ? 4 : 3) +
        MK.pic(cx, 172, 62, m.pic) +
        R(cx - 40, 240, 80, 11, 6, col, null, null, { opacity: vP > 0 ? Math.min(1, vP) : 0.3 }),
        { transform: around(cx, 172, Math.min(1.1, inP)), opacity: Math.min(1, inP) });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A cat, a wooden chair and a stone: living, once alive and never alive">' + out + "</svg>";
  }

  /* ==== chapter: what every living thing does =====================================
     Down the left, the lesson's own four life process cards (its "Four life
     processes" step, with that step's pictures and its own sub-captions). On
     the right, the lesson's own pair for each one: what a cat does and what a
     plant does. Only the process being named is lit; the ones already named
     keep their colour, quieter. */
  var LO_LIFE = [
    { key: "nutrition", label: "nutrition", sub: "taking in food", pic: "\u{1F37D}\uFE0F" },
    { key: "growth", label: "growth", sub: "getting bigger", pic: "\u{1F4C8}" },
    { key: "movement", label: "movement", sub: "moving by itself", pic: "\u{1F3C3}\u{1F3FE}" },
    { key: "reproduction", label: "reproduction", sub: "making more", pic: "\u{1F423}" }
  ];
  var LO_LY = [4, 112, 220, 328];       /* each card's top; h 96, so 4..424 */

  /* the four cards, the k-th lit from its own cue on */
  function loLifeCards(scene, t) {
    var out = "";
    LO_LIFE.forEach(function (c, k) {
      var at = sc(scene, k + 1, c.key), y = LO_LY[k];
      var p = k === 0 ? 1 : 1, appear = on(t, sc(scene, 0, "four") == null ? null : sc(scene, 0, "four") + k * 0.22, 0.4);
      if (appear <= 0) return;
      var lit = on(t, at, 0.4), now = lit > 0 && (k === 3 || on(t, sc(scene, k + 2, LO_LIFE[k + 1] ? LO_LIFE[k + 1].key : ""), 0.4) < 0.5);
      var col = lit > 0 ? (now ? P.gold : P.good) : P.line;
      out += G(R(22, y, 300, 96, 18, lit > 0 ? "#1B3A52" : P.card, col, lit > 0 ? 3 : 2) +
        MK.pic(72, y + 48, 52, c.pic) +
        Tx(112, y + 44, c.label, "lab big", "start", { fill: lit > 0 ? P.ink : P.muted }) +
        Tx(112, y + 74, c.sub, "lab mid muted", "start"),
        { opacity: clamp(appear * (lit > 0 ? 1 : 0.55), 0, 1), transform: around(172, y + 48, 0.97 + 0.03 * Math.min(1, p)) });
    });
    return out;
  }

  /* the two panels the cat and the plant act in */
  var LO_CATP = { x: 352, y: 30, w: 390, h: 350, cx: 547, cy: 205 };
  var LO_PLTP = { x: 762, y: 30, w: 390, h: 350, cx: 957, cy: 205 };

  /* what the cat and the plant do in the chapter's beat k */
  function loLifeDemo(scene, k, t) {
    var c = function (n, name) { return sc(scene, n, name); };
    var out = "";
    if (k <= 0) {
      out += MK.pic(LO_CATP.cx, LO_CATP.cy, 128, LO.cat) + MK.pic(LO_PLTP.cx, LO_PLTP.cy, 128, LO.seedling);
      return out;
    }
    if (k === 1) {
      /* the cat and the plant are on stage from the first frame of the beat:
         a panel that is empty until its cue reads as a picture that failed */
      var cEat = c(1, "eats"), cPl = c(1, "plant"), cSun = c(1, "sun");
      out += MK.pic(500, 190, 120, LO.cat);
      var pe = popIn(t, cEat, 0.4);
      out += MK.pop(MK.pic(648, 268, 76, LO.plate), 648, 268, pe);
      out += MK.arrow(624, 246, 560, 214, on(t, cEat == null ? null : cEat + 0.35, 0.5), P.gold, 7);
      out += G(MK.pic(930, 268, 118, LO.seedling), { transform: around(930, 268, 1 + 0.12 * bump(t, cPl, 0.8)) });
      out += MK.glow(930, 268, 96, P.gold, 0.9 * bump(t, cPl, 0.9));
      out += loSun(1066, 108, 26, on(t, cSun, 0.5), t);
      var sr = on(t, cSun == null ? null : cSun + 0.2, 0.6);
      for (var q = 0; q < 3; q++) {
        var sx = 1046 - q * 10, sy = 140 + q * 8, ex = 966 + q * 12, ey = 214 + q * 10;
        out += L(sx, sy, lerp(sx, ex, sr), lerp(sy, ey, sr), P.gold, 4, { opacity: 0.85 * sr, "stroke-dasharray": "10 8" });
      }
      return out;
    }
    if (k === 2) {
      var cKit = c(2, "kitten"), cBig = c(2, "cat"), cSdl = c(2, "seedling"), cTr = c(2, "tree");
      out += G(MK.pic(452, 276, 70, LO.cat), { transform: around(452, 276, 1 + 0.14 * bump(t, cKit, 0.8)) });
      out += MK.arrow(504, 260, 570, 224, on(t, cBig, 0.5), P.gold, 7);
      out += MK.pop(MK.pic(654, 198, 124, LO.cat), 654, 198, popIn(t, cBig, 0.45));
      out += G(MK.pic(856, 288, 78, LO.seedling), { transform: around(856, 288, 1 + 0.14 * bump(t, cSdl, 0.8)) });
      out += MK.arrow(910, 270, 976, 234, on(t, cTr, 0.5), P.gold, 7);
      out += MK.pop(MK.pic(1058, 198, 130, LO.tree), 1058, 198, popIn(t, cTr, 0.45));
      return out;
    }
    if (k === 3) {
      var cRun = c(3, "runs"), cTurn = c(3, "turns"), cLit = c(3, "light");
      var ru = on(t, cRun, loRoom(scene, 3, cRun, 1.3));
      var rx = lerp(420, 664, ru);
      out += R(392, 268, 310, 8, 4, P.line, null, null, { opacity: 0.55 });
      out += loSpeed(rx - 52, 216, 62, ru > 0 && ru < 1 ? 1 : 0.25);
      out += MK.pic(rx, 216, 104, LO.catRun);
      /* the lesson's own sunflower, turning its head towards the light */
      var tu = on(t, cTurn, loRoom(scene, 3, cTurn, 1.2));
      out += L(930, 348, 930, 262, "#4CB65C", 9);
      out += G(MK.pic(930, 246, 112, LO.sunflower), { transform: "rotate(" + n2(lerp(-20, 16, tu)) + " 930 340)" });
      out += loSun(1092, 116, 24, on(t, cLit, 0.5), t);
      var lr = on(t, cLit == null ? null : cLit + 0.15, 0.6);
      for (var w = 0; w < 3; w++) {
        var ax = 1072 - w * 10, ay = 146 + w * 8, bx = 986 + w * 10, by = 206 + w * 10;
        out += L(ax, ay, lerp(ax, bx, lr), lerp(ay, by, lr), P.gold, 4, { opacity: 0.85 * lr, "stroke-dasharray": "10 8" });
      }
      return out;
    }
    if (k === 4) {
      var cKits = c(4, "kittens"), cSeeds = c(4, "seeds");
      out += MK.pic(492, 190, 116, LO.cat);
      out += MK.pop(MK.pic(600, 282, 62, LO.cat), 600, 282, popIn(t, cKits, 0.4));
      out += MK.pop(MK.pic(672, 300, 58, LO.cat), 672, 300, popIn(t, cKits == null ? null : cKits + 0.3, 0.4));
      out += L(930, 340, 930, 258, "#4CB65C", 9);
      out += MK.pic(930, 236, 112, LO.sunflower);
      var su = on(t, cSeeds, loRoom(scene, 4, cSeeds, 1.1));
      for (var s = 0; s < 3; s++) {
        var u = clamp((su - s * 0.12) / 0.7, 0, 1);
        out += loSeed(1010 + s * 34, lerp(268, 346, u * u), 12, 18 + s * 30, u > 0 ? 1 : 0);
      }
      return out;
    }
    /* "A cat does all four. So does a tree, only slowly." */
    var cAll = c(5, "all"), cTree = c(5, "tree");
    out += MK.pic(LO_CATP.cx, 184, 126, LO.cat);
    var nA = tally(t, cAll, 4, 0.7);
    for (var a = 0; a < nA; a++) out += MK.tick(487 + a * 40, 312, 17, popIn(t, cAll == null ? null : cAll + a * 0.18, 0.3));
    out += MK.pic(LO_PLTP.cx, 184, 132, LO.tree);
    /* the tree's four ticks are laid over three quarters of what is left of the
       line, so the fourth has popped IN before the voice stops (at the whole
       room the last one was still arriving as the chapter ended) */
    var span = loRoom(scene, 5, cTree, 1.7) * 0.72, nB = tally(t, cTree, 4, span);
    for (var b = 0; b < nB; b++) out += MK.tick(897 + b * 40, 312, 17, popIn(t, cTree == null ? null : cTree + b * span / 3, 0.3));
    return out;
  }

  function loLifeChapter(scene, beat, t, i) {
    var out = "", k = i - scene.first;
    out += loLifeCards(scene, t);
    out += loCard(LO_CATP.x, LO_CATP.y, LO_CATP.w, LO_CATP.h, 1);
    out += loCard(LO_PLTP.x, LO_PLTP.y, LO_PLTP.w, LO_PLTP.h, 1);
    out += crossfade(t, i, scene, function (bi) { return loLifeDemo(scene, bi - scene.first, t); });
    /* "life processes", for the first line only */
    out += MK.pill(752, 412, "life processes", on(t, sc(scene, 0, "life"), 0.4) * loOnly(t, scene, 0), { size: 24, col: P.gold });
    return svg(out);
  }

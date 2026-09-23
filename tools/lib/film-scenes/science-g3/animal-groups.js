  /* ==== Grade 3 Science, Lesson 3: Animal Groups ==============================
     tools/lib/film-scenes/science-g3/animal-groups.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/animal-groups.json.

     The lesson's own things come from ART and from the lesson file, so the
     child sees here what they tap two steps later: the six group cards and
     their key features (the "Six groups of animals" step, word for word), the
     ten animals of the group sorter and its six bins, the reptile-and-
     amphibian fact card, and the tap figure of a beetle (ART.figure("insect"):
     head, thorax, abdomen, six legs, wings, antennae).

     This file: the palette, the marks every chapter shares, the title motif
     and the chapter "Groups from features". Every top-level name here starts
     with ag, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, features: P.gold, fishamph: P.blue, reptbird: P.good,
    maminsect: P.plum, sort: P.accent, diagram: P.gold, recap: P.teal
  };

  /* ---- the lesson's six groups, in its own order and its own words --------- */
  var AG_GROUPS = [
    { id: "fish", label: "fish", pic: "\u{1F41F}", sub: "scales, fins, gills" },
    { id: "amph", label: "amphibians", pic: "\u{1F438}", sub: "smooth damp skin" },
    { id: "rept", label: "reptiles", pic: "\u{1F98E}", sub: "dry, scaly skin" },
    { id: "bird", label: "birds", pic: "\u{1F426}", sub: "feathers, beak, eggs" },
    { id: "mammal", label: "mammals", pic: "\u{1F415}", sub: "fur or hair, milk" },
    { id: "insect", label: "insects", pic: "\u{1F41C}", sub: "six legs, three parts" }
  ];

  /* ---- timing -------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function agOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function agFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var AG_SCATTER = [0.21, 0.66, 0.38, 0.91, 0.07, 0.54, 0.77, 0.31, 0.62, 0.15, 0.83, 0.47];

  /* ---- marks this film shares --------------------------------------------- */

  /* how wide MK.pill draws a word of this size */
  function agPillW(text, size) { return String(text).length * size * 0.56 + size * 1.3; }

  /* a word in a pill with a line to the thing it names. state: "now" (gold, it
     is being said), "done" (green, it has been said), anything else muted. */
  function agLabel(t, x, y, text, at, to, state, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 30; anchor = anchor || "start";
    var w = agPillW(text, size), h = size * 1.8;
    var now = state === "now", done = state === "done";
    var col = now ? P.gold : done ? P.good : P.line, ink = now ? P.ink : done ? P.good : P.muted;
    var sx = anchor === "start" ? x + w + 8 : anchor === "end" ? x - w - 8 : x;
    var sy = anchor === "middle" ? y + h / 2 + 8 : y;
    return (to ? MK.leader(sx, sy, to[0], to[1], on(t, at, 0.7), now ? P.gold : P.good) : "") +
      MK.pill(x, y, text, o, { size: size, anchor: anchor, col: col, ink: ink, fill: now ? "#1B3A52" : P.card });
  }

  /* a picture and a word in one rounded box, centred on (cx, cy). pic is an
     emoji, one of the kit's drawings, or a function (x, y, size) -> markup. */
  function agChip(cx, cy, w, h, pic, text, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var size = opt.size || 26, px = cx - w / 2 + h * 0.62, ps = h * 0.66;
    var art = typeof pic === "function" ? pic(px, cy, ps) : MK.pic(px, cy, ps, pic);
    return G(R(cx - w / 2, cy - h / 2, w, h, h / 2, opt.fill || P.cell, opt.col || P.line, opt.sw || 2) +
      art + Tx(px + ps * 0.76, cy + size * 0.36, text, "lab", "start", { "font-size": size, fill: opt.ink || P.ink }),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) });
  }

  /* "how it moves", drawn rather than an emoji: an arrow and two speed lines */
  function agMoveGlyph(cx, cy, s) {
    return MK.arrow(cx - s * 0.42, cy, cx + s * 0.44, cy, 1, P.muted, s * 0.15) +
      L(cx - s * 0.56, cy - s * 0.26, cx - s * 0.16, cy - s * 0.26, P.muted, s * 0.1, { opacity: 0.7 }) +
      L(cx - s * 0.56, cy + s * 0.26, cx - s * 0.16, cy + s * 0.26, P.muted, s * 0.1, { opacity: 0.7 });
  }

  /* ---- marking ONE part of the kit's beetle ---------------------------------
     FIGURES.insect gives three of its six parts an outline that hugs them
     (head, thorax, abdomen) and three a BOX: the legs' is 140 x 200, round the
     whole beetle, and the wings' swallows the abdomen. Ringing those reads as
     a debug box - the fault the Bones and Muscles film shipped, and rule 3 of
     the brief. So the film rings the three tight ones with the lesson's own
     ART.ring, and traces the lesson's OWN shapes in gold for the other three,
     in the figure's own coordinates, so it marks the part and nothing else. */
  var AG_TRACE = {
    legs: "M150 104 l-30 -34 l-10 -26 M170 99 l0 -40 l-8 -26 M190 104 l30 -34 l12 -26 " +
      "M150 146 l-30 34 l-10 26 M170 151 l0 40 l-8 26 M190 146 l30 34 l12 26",
    wings: "M186 110 q40 -76 116 -52 q-36 44 -116 52z M186 140 q40 76 116 52 q-36 -44 -116 -52z",
    antennae: "M104 112 q-30 -20 -40 -50 M104 138 q-30 20 -40 50"
  };
  var AG_TIGHT = { head: 1, thorax: 1, abdomen: 1 };
  function agBeetle(part, alpha, x, y, w, h) {
    var fig = ART.figure("insect"), over = "", a = clamp(alpha == null ? 0 : alpha, 0, 1);
    if (part && a > 0.004) {
      if (AG_TIGHT[part]) fig = ART.ring(fig, part, "rgba(244,201,93," + n2(a) + ")", 6);
      else if (AG_TRACE[part]) over = ART.place('<svg viewBox="0 0 360 240">' +
        Pth(AG_TRACE[part], null, P.gold, 9, { opacity: a }) + "</svg>", x, y, w, h);
    }
    return ART.place(fig, x, y, w, h) + over;
  }

  /* one of the six groups in a round window, with its name under it */
  function agGroupDisc(cx, cy, r, g, o, ringO, dimTo) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, P.cell, P.line, 3) + MK.pic(cx, cy, r * 1.2, g.pic) +
      (ringO > 0 ? C(cx, cy, r + 6, "none", P.gold, 4, { opacity: clamp(ringO, 0, 1) }) : "") +
      Tx(cx, cy + r + 34, g.label, "lab mid muted", "middle"),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) * (dimTo == null ? 1 : dimTo) });
  }

  /* the frame every group card of chapters 3, 4 and 5 shares: the one being
     talked about is gold and bright, the other is quiet beside it */
  var AG_CARD = { y: 8, h: 422, w: 540, lx: 30, rx: 598 };
  function agCard(x, title, inner, lit) {
    var L = clamp(lit, 0, 1);
    return G(R(x, AG_CARD.y, AG_CARD.w, AG_CARD.h, 24, P.card, P.line, 2) +
      R(x, AG_CARD.y, AG_CARD.w, AG_CARD.h, 24, "#16334A", P.gold, 3, { opacity: L }) +
      Tx(x + AG_CARD.w / 2, 64, title, "lab huge", "middle", { fill: P.muted }) +
      Tx(x + AG_CARD.w / 2, 64, title, "lab huge", "middle", { fill: P.gold, opacity: L }) +
      inner, { opacity: 0.52 + 0.48 * L });
  }

  /* ==== the title ===============================================================
     The lesson's six groups in a ring, with its own paw-print mark in the
     middle. In the spoken title chapter the six appear as the first line is
     said, the fish, the bird and the dog are ringed on "Scales", "feathers"
     and "fur", then every group is ringed on "Those are features" and the
     whole ring lights on "into a group". On the two cards it simply stands. */
  var AG_MOTIF = { cx: 180, cy: 180, r: 112 };
  function agMotifAngle(k) { return -Math.PI / 2 + k * Math.PI / 3; }
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cAnimal = s ? sc(s, 0, "animal") : null, cScales = s ? sc(s, 0, "scales") : null,
      cFeathers = s ? sc(s, 0, "feathers") : null, cFur = s ? sc(s, 0, "fur") : null,
      cFeatures = s ? sc(s, 1, "features") : null, cGroup = s ? sc(s, 1, "group") : null;
    var all = on(t, cGroup, 0.7);
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 168, P.teal, all * (0.7 + 0.3 * breathe(t)));
    AG_GROUPS.forEach(function (g, k) {
      var a = agMotifAngle(k), gx = 180 + Math.cos(a) * AG_MOTIF.r, gy = 180 + Math.sin(a) * AG_MOTIF.r;
      var p = s ? popIn(t, cAnimal == null ? null : cAnimal + k * 0.13, 0.4) : 1;
      if (p <= 0) return;
      var one = k === 0 ? on(t, cScales, 0.35) : k === 3 ? on(t, cFeathers, 0.35) : k === 4 ? on(t, cFur, 0.35) : 0;
      var ring = Math.max(one * (1 - all), on(t, cFeatures == null ? null : cFeatures + k * 0.1, 0.35));
      out += G(C(gx, gy, 40, P.cell, P.line, 3) + MK.pic(gx, gy, 50, g.pic) +
        (ring > 0 ? C(gx, gy, 45, "none", P.gold, 4, { opacity: clamp(ring, 0, 1) }) : ""),
        { transform: around(gx, gy, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });
    out += MK.pic(180, 180, 84, "\u{1F43E}", { opacity: 0.9 });
    out += C(180, 180, 172, "none", P.line, 3);
    out += C(180, 180, 172, "none", P.teal, 5, { opacity: all });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Six groups of animals in a ring: fish, amphibians, reptiles, birds, mammals and insects">' + out + "</svg>";
  }

  /* ==== chapter: groups from features ============================================
     The lesson's first lecture part, in its own order: six groups, then what a
     feature is, then the two things that are NOT features. The six group discs
     stay across the chapter; the four feature chips line up under them, each
     with a line to the group it marks; and the last line crosses out "where it
     lives" and "how it moves". */
  var AG_DISC_X = [184, 344, 504, 664, 824, 984];
  var AG_FEATS = [
    { pic: "\u{1F41F}", text: "scales", cue: "scales", g: 0 },
    { pic: "\u{1FAB6}", text: "feathers", cue: "feathers", g: 3 },
    { pic: "\u{1F415}", text: "fur", cue: "fur", g: 4 },
    { pic: "\u{1F41C}", text: "six legs", cue: "legs", g: 5 }
  ];
  var AG_FEAT_X = [236, 468, 700, 932];

  function agFeaturesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSix = c(0, "six"), cFeat = c(0, "feat"), cHas = c(1, "has");
    var cLives = c(2, "lives"), cMoves = c(2, "moves"), cLook = c(2, "look");
    var out = "", pulse = bump(t, cLook, 1.3);

    /* the six groups, appearing one after another on "six groups" */
    AG_GROUPS.forEach(function (g, k) {
      var p = popIn(t, cSix == null ? null : cSix + k * 0.16, 0.38);
      out += agGroupDisc(AG_DISC_X[k], 70, 44, g, p, pulse * 0.9);
    });

    /* what a feature is */
    var fo = Math.max(on(t, cFeat, 0.4), on(t, cHas, 0.4)) * (1 - on(t, c(1, "scales"), 0.55));
    out += MK.pill(584, 194, "a feature is something the animal has", fo, { size: 27, col: P.gold, fill: "#1B3A52" });

    /* the four features the lesson lists, each with a line to its group */
    AG_FEATS.forEach(function (f, k) {
      var at = c(1, f.cue), p = popIn(t, at, 0.38);
      if (p <= 0) return;
      out += MK.leader(AG_FEAT_X[k], 251, AG_DISC_X[f.g], 158, on(t, at == null ? null : at + 0.12, 0.5), P.gold);
      out += agChip(AG_FEAT_X[k], 288, 212, 70, f.pic, f.text, p, { col: P.gold, fill: "#1B3A52" });
    });

    /* not where it lives, not how it moves */
    var pl = popIn(t, cLives, 0.4), pm = popIn(t, cMoves, 0.4);
    out += agChip(336, 386, 288, 76, "\u{1F30A}", "where it lives", pl, { ink: P.muted, size: 24 });
    out += MK.cross(150, 386, 32, popIn(t, cLives == null ? null : cLives + 0.35, 0.35));
    out += agChip(832, 386, 288, 76, agMoveGlyph, "how it moves", pm, { ink: P.muted, size: 24 });
    out += MK.cross(1018, 386, 32, popIn(t, cMoves == null ? null : cMoves + 0.35, 0.35));
    /* "Look at the animal itself" */
    out += MK.tick(584, 386, 34, popIn(t, cLook, 0.4));
    return svg(out);
  }

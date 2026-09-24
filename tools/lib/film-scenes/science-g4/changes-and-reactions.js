  /* ==== Grade 4 Science, Lesson 7: Changes and Reactions ======================
     tools/lib/film-scenes/science-g4/changes-and-reactions.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/changes-and-reactions.json.

     The lesson's own drawings come from ART, so the child sees here what they
     step through two steps later: the particle model (ART.kit.particleSvg, the
     demo's Heat it / Cool it states) and the two beakers of the reaction
     experiment (ART.sim("reaction", "draw", a, b)).

     THE ARROWS. This lesson is about which changes can be undone, so an arrow
     that points the wrong way teaches the misconception. There is exactly one
     rule in this film and every arrow keeps it:
       crWayBack(...)  two heads, teal   - only under a change that CAN be undone
       crNoWayBack(...) one head, and the return arrow crossed out in red
                       - only under a change that CANNOT be undone
     crWayBack is used for melting/freezing, for the sand mixture, for chocolate
     and for salt. crNoWayBack is used for the fizzing beaker, for burning wood
     and for a baked cake. Neither is drawn anywhere else.

     This file: the palette, the marks every chapter shares, the title motif,
     and the chapters "Melting" and "Freezing". Every top-level name here starts
     with cr, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, melting: P.accent, freezing: P.blue, mixing: P.good,
    reaction: P.gold, undone: P.plum, safe: P.accent, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function crOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function crFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* a square wave for the particle model's jiggle: pure, and never Math.random */
  function crJiggle(t) { return Math.sin(t * 9.4) >= 0 ? 1 : -1; }

  /* ---- marks this film shares --------------------------------------------- */

  /* one word in a pill, shown from its cue until the next one takes the slot.
     items: [{at, text, col}], newest wins. */
  function crSlot(t, x, y, items, size) {
    var out = "";
    for (var k = 0; k < items.length; k++) {
      var at = items[k].at;
      var a = on(t, at == null ? null : at + (k ? 0.12 : 0), 0.3);
      var z = k + 1 < items.length ? on(t, items[k + 1].at, 0.22) : 0;
      var o = a * (1 - z);
      if (o > 0) out += MK.pill(x, y, items[k].text, o, { size: size || 26, col: items[k].col || P.gold });
    }
    return out;
  }

  /* A change that CAN be undone: one bar with a head at each end, teal.
     Only ever drawn under a sentence that says the change can be undone. */
  function crWayBack(cx, cy, half, u, col) {
    if (!(u > 0)) return "";
    col = col || P.good;
    var h = Math.min(half * 0.9, 15), o = clamp(u, 0, 1);
    return G(L(cx - half + h * 0.7, cy, cx + half - h * 0.7, cy, col, 7) +
      Pth("M" + n2(cx - half) + "," + n2(cy) + " L" + n2(cx - half + h) + "," + n2(cy - h * 0.72) +
        " L" + n2(cx - half + h) + "," + n2(cy + h * 0.72) + " Z", col) +
      Pth("M" + n2(cx + half) + "," + n2(cy) + " L" + n2(cx + half - h) + "," + n2(cy - h * 0.72) +
        " L" + n2(cx + half - h) + "," + n2(cy + h * 0.72) + " Z", col),
      { opacity: o, transform: around(cx, cy, 0.8 + 0.2 * o) });
  }

  /* A change that CANNOT be undone: the forward arrow alone, and the way back
     drawn faint and struck through in red. u draws the forward arrow, v the
     refusal. Only ever drawn under a sentence that says there is no way back. */
  function crNoWayBack(cx, cy, half, u, v) {
    var out = MK.arrow(cx - half, cy - 9, cx + half, cy - 9, u, P.gold, 7);
    if (v > 0) {
      var o = clamp(v, 0, 1), y2 = cy + 12;
      out += G(MK.arrow(cx + half, y2, cx - half, y2, 1, P.muted, 6), { opacity: 0.4 * o });
      out += L(cx - half * 0.55, y2 - 13 * o, cx + half * 0.55, y2 + 13 * o, P.bad, 7, { opacity: o });
      out += L(cx + half * 0.55, y2 - 13 * o, cx - half * 0.55, y2 + 13 * o, P.bad, 7, { opacity: o });
    }
    return out;
  }

  /* a cube of ice, centred on (cx, cy) */
  function crIce(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var h = s / 2;
    return G(R(cx - h, cy - h, s, s, s * 0.17, "#BFE3F5", "#6FA8C8", Math.max(2, s * 0.07)) +
      R(cx - h + s * 0.15, cy - h + s * 0.13, s * 0.3, s * 0.16, s * 0.06, "#FFFFFF", null, null, { opacity: 0.8 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* a drop of water, its round bottom centred on (x, y) */
  function crDrop(x, y, r, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", "#7FC4EA") +
      C(x, y, r, "#7FC4EA") + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.75 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* fixed numbers for anything scattered: never Math.random */
  var CR_SCATTER = [0.17, 0.68, 0.39, 0.91, 0.24, 0.55, 0.08, 0.83, 0.46, 0.72, 0.31, 0.6];

  /* bubbles of gas rising out of a beaker mouth at (x, y), from `at` until
     `until`, reaching `rise` px above it */
  function crBubbles(t, at, until, x, y, rise, n, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "";
    for (var k = 0; k < (n || 9); k++) {
      var born = at + k * 0.11, life = 1.35;
      if (t < born) continue;
      var ph = ((t - born) / life) % 1, cyc = Math.floor((t - born) / life);
      if (until != null && born + cyc * life > until) continue;
      var r = 5 + 7 * CR_SCATTER[k % 12];
      var bx = x + (CR_SCATTER[(k + 3) % 12] - 0.5) * 96 * (0.35 + ph);
      var by = y - rise * ph;
      out += C(bx, by, r * (0.6 + 0.4 * ph), "#EAF6FF", "#BFE3F5", 2, { opacity: clamp(Math.min(1 - ph, ph * 6), 0, 1) * clamp(o, 0, 1) });
    }
    return out;
  }

  /* liquid pouring from (x0, y0) down to y1, drifting dx, between `from` and
     `until`: drops only, each a pure function of t */
  function crPourDrops(t, from, until, x0, y0, y1, dx, r) {
    if (from == null || t < from || t > until + 0.7) return "";
    var out = "";
    for (var k = 0; k < 5; k++) {
      var born = from + k * 0.15;
      if (t < born) continue;
      var ph = ((t - born) / 0.68) % 1, cyc = Math.floor((t - born) / 0.68);
      if (born + cyc * 0.68 > until) continue;
      var x = x0 + dx * ph + (CR_SCATTER[k] - 0.5) * 9, y = lerp(y0, y1, ph * ph);
      out += crDrop(x, y, r || 7, Math.min(1, (1 - ph) * 4, ph * 8));
    }
    return out;
  }

  /* a badge saying a NEW substance is here, or (crossed) that there is none */
  function crNewBadge(cx, cy, s, p, crossed) {
    if (!(p > 0)) return "";
    var w = s * 6, h = s * 1.6;
    var out = R(cx - w / 2, cy - h / 2, w, h, h / 2, crossed ? P.card : "#2B4A38", crossed ? P.line : P.good, 3) +
      Tx(cx, cy + s * 0.26, "new substance", "lab", "middle", { "font-size": s * 0.72, fill: crossed ? P.muted : P.good });
    if (crossed) {
      out += L(cx - w * 0.44, cy - h * 0.34, cx + w * 0.44, cy + h * 0.34, P.bad, 6);
      out += L(cx + w * 0.44, cy - h * 0.34, cx - w * 0.44, cy + h * 0.34, P.bad, 6);
    }
    return MK.pop(out, cx, cy, p);
  }

  /* ==== the title motif ========================================================
     The whole lesson in one picture: on the left a change that goes both ways
     (ice and water, with the two-headed arrow), on the right one that does not
     (the beaker fizzing, with its new gas). The beaker is the lesson kit's own
     (ART.kit.beakerSvg, the drawing of the experiment the child will run).
     In the spoken title chapter each half arrives as it is named; on the two
     cards, with no scene, the whole picture simply stands. */
  function crMotifBeaker(k, cx, cy, fizz) {
    /* beakerSvg draws in a 320 x 220 space: the beaker at x = 230 spans
       186..274 across and 50..182 down, so its middle is (230, 116). */
    var g = ART.kit.beakerSvg(230, fizz ? "#BFE3F5" : "#E9E4D6", fizz ? 130 : 46, !!fizz, "", "");
    return G(g, { transform: "translate(" + n2(cx - 230 * k) + "," + n2(cy - 116 * k) + ") scale(" + n3(k) + ")" });
  }

  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null, full = s ? 0 : 1, out = "";
    var cMelts = s ? sc(s, 0, "melts") : null, cBurns = s ? sc(s, 0, "burns") : null,
      cKind = s ? sc(s, 0, "kind") : null, cNothing = s ? sc(s, 1, "nothing") : null,
      cNew = s ? sc(s, 1, "new") : null;
    var mel = Math.max(full, on(t, cMelts, 0.7));
    var fiz = Math.max(full, on(t, cBurns, 0.7));
    var kin = Math.max(full, on(t, cKind, 0.6));
    var not = Math.max(full, on(t, cNothing, 0.5));
    var nw = Math.max(full, on(t, cNew, 0.5));

    out += C(180, 180, 172, "#123247");
    /* the two halves, kept apart by the lesson's own line of thought */
    out += L(180, 34, 180, 326, P.line, 3, { opacity: 0.35 + 0.65 * kin, "stroke-dasharray": "10 9" });

    /* left: ice and water, and the arrow that goes both ways */
    out += crIce(98, 104, 64, 0.35 + 0.65 * mel);
    out += crDrop(98, 268, 27, mel);
    out += crWayBack(98, 186, 44, mel, P.good);
    out += MK.tick(146, 302, 20, Math.max(full, popIn(t, cNothing, 0.4)));
    if (not > 0) out += Tx(98, 334, "nothing new", "lab mid good", "middle", { opacity: not });

    /* right: the beaker, and the gas that was not there before */
    out += crMotifBeaker(0.95, 254, 186, fiz > 0.5);
    out += G(crBubbles(t, cBurns == null ? (s ? null : 0) : cBurns, null, 254, 126, 74, 7, fiz), {});
    out += MK.glow(254, 150, 74, P.gold, fiz * (0.5 + 0.5 * breathe(t)));
    if (nw > 0) out += Tx(254, 334, "something new", "lab mid gold", "middle", { opacity: nw });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Ice melting to water, and a beaker fizzing to make a new gas">' + out + "</svg>";
  }

  /* ==== the particle model, the lesson's own drawing ===========================
     ART.kit.particleSvg(state, jiggle, tick) in its 320 x 220 space:
       state 0 cold solid, 1 warm solid (both green, in 5 rows of 8 at
       x = 80 + c*23, y = 97 + r*23), 2 liquid (blue, 4 rows of 10 at
       y = 189 - k*20; even rows slide left, odd rows slide right, tick by tick).
     The box the child sees is x 36..284, y 30..200. */
  var CR_PART = { x: 44, y: 28, k: 1.75 };
  function crPX(v) { return CR_PART.x + v * CR_PART.k; }
  function crPY(v) { return CR_PART.y + v * CR_PART.k; }
  function crPartCard(state, jiggle, tick, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.kit.particleSvg(state, jiggle, tick), CR_PART.x, CR_PART.y, 320 * CR_PART.k, 220 * CR_PART.k),
      { opacity: clamp(o, 0, 1) });
  }
  function crPartFrame() {
    return R(CR_PART.x - 10, CR_PART.y - 10, 320 * CR_PART.k + 20, 220 * CR_PART.k + 20, 20, P.card, P.line, 2);
  }
  /* the five rows of a solid, dashed, breaking apart as `br` goes 0 -> 1 */
  function crRowLines(o, br) {
    if (!(o > 0)) return "";
    var out = "", gap = 70 * br;
    for (var r = 0; r < 5; r++) {
      var y = crPY(97 + r * 23);
      out += L(crPX(64) - gap, y, crPX(158) - gap, y, P.gold, 4, { "stroke-dasharray": "13 9", opacity: clamp(o, 0, 1) * (1 - br * 0.75) });
      out += L(crPX(162) + gap, y, crPX(256) + gap, y, P.gold, 4, { "stroke-dasharray": "13 9", opacity: clamp(o, 0, 1) * (1 - br * 0.75) });
    }
    return out;
  }
  /* a particle shown vibrating on the spot: a short bar with a head each way */
  function crVib(cx, cy, len, o) {
    if (!(o > 0)) return "";
    return G(L(cx - len, cy, cx + len, cy, P.accent, 6) +
      Pth("M" + n2(cx - len - 5) + "," + n2(cy) + " l13,-9 v18 z", P.accent) +
      Pth("M" + n2(cx + len + 5) + "," + n2(cy) + " l-13,-9 v18 z", P.accent), { opacity: clamp(o, 0, 1) });
  }
  var CR_VIB_AT = [[103, 120], [172, 143], [218, 166]];

  /* ==== chapter: Melting ======================================================== */
  function crMeltChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSolid = c(0, "solid"), cRows = c(0, "rows"), cVibr = c(0, "vibrate");
    var cWarm = c(1, "warm"), cEnergy = c(1, "energy"), cHarder = c(1, "harder");
    var cBreak = c(2, "break"), cSlide = c(2, "slide");
    var cMelted = c(3, "melted"), cLiquid = c(3, "liquid");
    var cSame = c(4, "same"), cArr = c(4, "arrange");

    var warmU = on(t, cHarder, 0.5);                      /* cold solid -> warm solid */
    var liqU = on(t, cBreak, 0.6);                        /* warm solid -> liquid */
    var j = crJiggle(t);
    var tick = cBreak == null ? 0 : Math.floor(Math.max(0, t - cBreak) * 3.4);
    var out = crPartFrame();

    /* the lesson's own drawing, each state laid over the last as it is reached */
    out += crPartCard(0, j, 0, 1);
    if (warmU > 0) out += crPartCard(1, j, 0, warmU);
    if (liqU > 0) out += crPartCard(2, j, tick, liqU);

    /* "sit in rows": the rows drawn on; "break out of their rows": they part */
    out += crRowLines(on(t, cRows, 0.5) * (1 - liqU), ease(on(t, cBreak, 0.9)));
    /* "vibrating on the spot", then harder as it is heated */
    var vib = on(t, cVibr, 0.45) * (1 - liqU), len = lerp(22, 44, on(t, cHarder, 0.6));
    for (var v = 0; v < 3; v++) out += crVib(crPX(CR_VIB_AT[v][0]), crPY(CR_VIB_AT[v][1]), len, vib);
    /* "Warm it up": the heat arrives under the box (a bar, not a glow: a glow
       wide enough to read would spill below the 440 box) */
    var heat = on(t, cWarm, 0.5);
    if (heat > 0) {
      out += R(CR_PART.x + 40, 424, 320 * CR_PART.k - 80, 12, 6, P.accent, null, null,
        { opacity: heat * (0.72 + 0.28 * breathe(t)) });
      out += MK.glow(crPX(160), 398, 36, P.accent, heat * (0.6 + 0.4 * breathe(t)));
    }
    /* "slide past each other": the lesson's liquid slides its rows in turn,
       even rows to the left, odd rows to the right */
    var sl = on(t, cSlide, 0.55) * liqU;
    out += MK.arrow(crPX(206), crPY(189), crPX(118), crPY(189), sl, P.gold, 7);
    out += MK.arrow(crPX(118), crPY(169), crPX(206), crPY(169), on(t, cSlide == null ? null : cSlide + 0.3, 0.55) * liqU, P.gold, 7);

    /* ---- the right column: solid, heat, liquid ---- */
    out += MK.pop(Em(730, 112, 82, "\u{1F9CA}"), 730, 112, popIn(t, cSolid, 0.45));
    out += MK.pill(730, 176, "solid water", on(t, cSolid, 0.4), { size: 24, col: "#6FA8C8" });
    out += MK.pop(Em(886, 62, 58, "\u{1F525}"), 886, 62, popIn(t, cWarm, 0.45));
    out += MK.arrow(806, 112, 966, 112, on(t, cEnergy, 0.6), P.accent, 8);
    out += crDrop(1032, 140, 34, on(t, cLiquid, 0.5));
    out += MK.pill(1032, 200, "liquid water", on(t, cLiquid, 0.4), { size: 24, col: "#6FA8C8" });
    out += MK.tick(1104, 96, 20, popIn(t, cMelted, 0.4));
    /* "melted" hands off to "the same water particles" through the one slot
       helper, so the two pills crossfade instead of fading independently */
    out += crSlot(t, 896, 258, [
      { at: cMelted, text: "melted", col: P.gold },
      { at: cSame, text: "the same water particles", col: P.good }
    ], 28);

    /* what the particles are doing, one phrase at a time */
    out += crSlot(t, 896, 320, [
      { at: cVibr, text: "vibrating on the spot" },
      { at: cHarder, text: "vibrating harder", col: P.accent },
      { at: cBreak, text: "out of their rows", col: P.accent },
      { at: cSlide, text: "sliding past each other", col: P.gold }
    ]);
    out += MK.pill(896, 392, "a new arrangement", on(t, cArr, 0.45), { size: 26, col: P.teal });
    return svg(out);
  }

  /* ==== chapter: Freezing ========================================================
     The first two beats run the lesson's particle drawing backwards, liquid to
     solid. The last two leave it for the cycle itself: ice and water, and the
     two-headed arrow that says this change goes both ways. */

  /* a tick count that slides the liquid's rows and then slows to a stop, so
     the particles visibly lose energy. Monotone, and a pure function of t. */
  function crSlowTick(t, start, slowAt, ramp) {
    var e = Math.max(0, t - start);
    if (slowAt == null || t <= slowAt) return Math.floor(e * 3.4);
    var s = slowAt - start, d = Math.min(t - slowAt, ramp);
    return Math.floor(s * 3.4 + 3.4 * (d - d * d / (2 * ramp)));
  }

  function crFreezeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCool = c(0, "cool"), cLose = c(0, "lose"), cSlow = c(0, "slow");
    var cLock = c(1, "lock"), cFrozen = c(1, "frozen");
    var cCycle = c(2, "cycle"), cThousand = c(2, "thousand");
    var cNothing = c(3, "nothing"), cPhysical = c(3, "physical");

    var toCycle = crFrom(t, scene, 2);                    /* the picture changes for the last two beats */
    var out = "";

    if (toCycle < 1) {
      var lockU = on(t, cLock, 0.7);
      var j = crJiggle(t);
      var tick = crSlowTick(t, scene.start, cSlow, 2.2);
      var box = crPartFrame() + crPartCard(2, j, tick, 1);
      if (lockU > 0) box += crPartCard(0, j, 0, lockU);
      /* "cool the water down": the cold settles over the box */
      var cold = on(t, cCool, 0.6);
      box += MK.glow(crPX(160), 62, 60, P.blue, cold * (0.55 + 0.45 * breathe(t)));
      box += MK.pop(Em(crPX(160), crPY(4), 54, "❄️"), crPX(160), crPY(4), popIn(t, cCool, 0.45));
      /* "lose energy and slow": the sliding arrows shrink away */
      var sl = (1 - on(t, cSlow, 1.4)) * (1 - lockU) * crOnly(t, scene, 0);
      box += MK.arrow(crPX(206), crPY(189), crPX(118), crPY(189), sl, P.muted, 7);
      box += MK.arrow(crPX(118), crPY(169), crPX(206), crPY(169), sl, P.muted, 7);
      /* "lock back into rows": the rows come back */
      box += crRowLines(on(t, cLock, 0.6), 1 - ease(on(t, cLock, 0.9)));

      box += crSlot(t, 896, 150, [
        { at: cCool, text: "cooling down", col: P.blue },
        { at: cLose, text: "losing energy", col: P.blue },
        { at: cLock, text: "locked back into rows", col: P.good }
      ]);
      box += MK.pop(Em(896, 268, 96, "\u{1F9CA}"), 896, 268, popIn(t, cFrozen, 0.5));
      box += MK.pill(896, 350, "frozen: ice again", on(t, cFrozen, 0.45), { size: 26, col: "#6FA8C8" });
      out += G(box, { opacity: 1 - toCycle });
    }

    if (toCycle > 0) {
      var cyc = "";
      /* the cycle: ice on the left, water on the right, and one arrow with a
         head at each end, because this change really does go both ways */
      cyc += crIce(352, 214, 132, 1);
      cyc += MK.pill(352, 322, "ice", 1, { size: 30, col: "#6FA8C8" });
      cyc += crDrop(812, 240, 56, 1);
      cyc += MK.pill(812, 322, "water", 1, { size: 30, col: "#6FA8C8" });
      var cy = on(t, cCycle, 0.7);
      cyc += crWayBack(582, 214, 132, cy, P.good);
      cyc += MK.pill(582, 150, "melting", cy, { size: 26, col: P.accent });
      cyc += MK.pill(582, 282, "freezing", cy, { size: 26, col: P.blue });
      /* "a thousand times": the arrow keeps going */
      var th = on(t, cThousand, 0.5);
      if (th > 0) cyc += MK.pill(582, 356, "again and again", th * (0.55 + 0.45 * breathe(t)), { size: 26, col: P.gold });
      /* "Nothing new is ever made" / "a physical process" */
      cyc += crNewBadge(582, 60, 30, popIn(t, cNothing, 0.45), true);
      cyc += MK.pill(582, 412, "a physical process", on(t, cPhysical, 0.3), { size: 32, col: P.good });
      cyc += MK.tick(800, 412, 22, popIn(t, cPhysical == null ? null : cPhysical + 0.12, 0.3));
      out += G(cyc, { opacity: toCycle });
    }
    return svg(out);
  }

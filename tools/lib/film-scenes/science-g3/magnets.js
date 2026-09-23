  /* ==== Grade 3 Science, Lesson 11: Magnets ==================================
     tools/lib/film-scenes/science-g3/magnets.js, with -2.js: the film's
     pictures, after the shared marks (MK) and before the engine's tail, all in
     one scope. The storyboard is
     science/grade-3-app/lecture-video/magnets.json.

     The lesson's own drawings come from ART, so the child sees here what they
     drive two steps later: the two bar magnets of the magnetPoles sim
     (ART.kit.magnetPair, in the chapter "Attract and repel"), the magnet test
     scene of the "Will it stick?" step (ART.magnet, in "Magnetic or not?") and
     the kit's own nail, foil, wire and fridge drawings (ART.ICONS).

     A SINGLE bar magnet is drawn here (mgBar), because the kit draws only a
     PAIR and the first two chapters are about one magnet. It is the kit's own
     bar: the same halves, the same red #D9473F for north and blue #3B7FD1 for
     south, the same white N and S, as magnetPair() draws them.

     This file: the palette, the small drawings every chapter shares, the title
     motif, and the chapters "Two poles" and "Where the pull is strongest".
     Every top-level name here starts with mg, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, poles: P.gold, count: P.blue, push: P.accent,
    materials: P.good, work: P.plum, recap: P.teal
  };

  /* the kit's own magnet colours (science.js :: magnetPair) */
  var MG_RED = "#D9473F", MG_BLUE = "#3B7FD1", MG_STEEL = "#C8D3DC";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function mgOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function mgFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var MG_SCATTER = [0.22, 0.78, 0.41, 0.93, 0.08, 0.63, 0.35, 0.86, 0.17, 0.55, 0.71, 0.29];

  /* ---- the bar magnet, as the lesson kit paints one --------------------------- */
  /* opt: {flip (S|N instead of N|S), o (opacity), lit (0-1 white flash on the
     whole bar), litL / litR (a flash on one half), fs (letter size)} */
  function mgBar(cx, cy, w, h, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var x = cx - w / 2, hw = w / 2, fs = opt.fs || h * 0.6;
    var colL = opt.flip ? MG_BLUE : MG_RED, colR = opt.flip ? MG_RED : MG_BLUE;
    var chL = opt.flip ? "S" : "N", chR = opt.flip ? "N" : "S";
    var litL = Math.max(opt.litL || 0, opt.lit || 0), litR = Math.max(opt.litR || 0, opt.lit || 0);
    var out = R(x, cy - h / 2, hw, h, 0, colL) + R(x + hw, cy - h / 2, hw, h, 0, colR);
    if (litL > 0) out += R(x, cy - h / 2, hw, h, 0, "#FFFFFF", null, null, { opacity: 0.38 * litL });
    if (litR > 0) out += R(x + hw, cy - h / 2, hw, h, 0, "#FFFFFF", null, null, { opacity: 0.38 * litR });
    out += R(x, cy - h / 2, w, h, 0, "none", "rgba(0,0,0,0.28)", 2) +
      L(cx, cy - h / 2, cx, cy + h / 2, "rgba(0,0,0,0.28)", 2) +
      Tx(x + hw / 2, cy + fs * 0.35, chL, "lab", "middle", { "font-size": fs, fill: "#FFFFFF", "font-weight": 800 }) +
      Tx(x + hw + hw / 2, cy + fs * 0.35, chR, "lab", "middle", { "font-size": fs, fill: "#FFFFFF", "font-weight": 800 });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a steel paperclip, centred on (cx, cy); s = 1 draws one about 16 x 28 */
  function mgClip(cx, cy, s, rot, o) {
    if (!(o > 0)) return "";
    var d = "M-7,-13 L-7,7 A7,7 0 0 0 7,7 L7,-9 A4.5,4.5 0 0 0 -2,-9 L-2,9";
    return G(Pth(d, null, MG_STEEL, 2.6),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot || 0) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
  }
  /* where the eight paperclips of one cluster hang, relative to an end's centre */
  var MG_CLUSTER = [[-45, 30], [-15, 34], [15, 33], [45, 28], [-32, 74], [-2, 79], [28, 76], [56, 66]];
  var MG_CLIP_ROT = [-14, 6, -8, 16, -20, 4, 12, 22];
  function mgCluster(cx, cy, o, from) {
    var out = "";
    for (var k = 0; k < MG_CLUSTER.length; k++) {
      var u = clamp(o * 2 - k * 0.09, 0, 1);
      if (u <= 0) continue;
      var dx = MG_CLUSTER[k][0], dy = MG_CLUSTER[k][1];
      var sx = from ? lerp(from[0], cx + dx, u) : cx + dx, sy = from ? lerp(from[1], cy + dy, u) : cy + dy;
      out += mgClip(sx, sy, 1.25, MG_CLIP_ROT[k] * u, Math.min(1, u * 2));
    }
    return out;
  }

  /* a word in a pill with a line to the thing it names (the Grade 1 films' ppLabel) */
  function mgLabel(t, x, y, text, at, to, now, size, anchor, from) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted, f = from || [x, y + (size || 26) * 0.92];
    return MK.leader(f[0], f[1], to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: anchor || "middle", col: now ? P.gold : P.line });
  }

  /* ==== the title ================================================================
     One bar magnet with paperclips clinging to both ends, and under it the two
     magnets that pull or push. In the spoken title chapter the magnet arrives
     on "A magnet", the paperclips fly to it on "pulls some things", the poles
     are ringed on "two ends called poles"; then a second magnet slides in on
     "two magnets", the pair closes on "they pull", springs apart on "they
     push", and the facing poles are ringed on "which poles meet". On the two
     cards it simply stands. */
  function titleMotif(o) {
    var t = o.t || 0, s0 = o.scene, out = "";
    var cMag = s0 ? sc(s0, 0, "magnet") : null, cPulls = s0 ? sc(s0, 0, "pulls") : null, cPoles = s0 ? sc(s0, 0, "poles") : null;
    var cTwo = s0 ? sc(s0, 1, "two") : null, cPull = s0 ? sc(s0, 1, "pull") : null,
      cPush = s0 ? sc(s0, 1, "push") : null, cMeet = s0 ? sc(s0, 1, "meet") : null;

    out += C(180, 180, 172, "#123247");

    /* the one magnet, and its paperclips */
    var appear = s0 ? Math.min(1.08, popIn(t, cMag, 0.5)) : 1;
    var ringO = s0 ? on(t, cPoles, 0.45) : 0;
    if (appear > 0) {
      out += MK.glow(112, 126, 58, P.gold, ringO * 0.9) + MK.glow(248, 126, 58, P.gold, ringO * 0.9);
      out += G(mgBar(180, 126, 232, 72, { lit: bump(t, cPoles, 0.7) }), { transform: around(180, 126, appear), opacity: Math.min(1, appear) });
      var clipsO = s0 ? on(t, cPulls, 0.55) : 1;
      if (clipsO > 0) {
        for (var k = 0; k < 3; k++) {
          var u = clamp(clipsO * 1.6 - k * 0.14, 0, 1);
          var ly = 104 + k * 22, lx = lerp(20, 76 - k * 4, u), rx = lerp(340, 284 + k * 4, u);
          out += mgClip(lx, ly, 1.1, -12 + k * 10, u) + mgClip(rx, ly, 1.1, 12 - k * 10, u);
        }
      }
      if (ringO > 0) {
        out += C(112, 126, 46, "none", P.gold, 4, { opacity: ringO }) + C(248, 126, 46, "none", P.gold, 4, { opacity: ringO });
      }
    }

    /* the two magnets that pull, then push */
    var pairO = s0 ? Math.min(1.08, popIn(t, cTwo, 0.45)) : 1;
    if (pairO > 0) {
      var gap = 34;
      if (s0) { gap = lerp(34, 6, on(t, cPull, 0.6)); gap = lerp(gap, 72, on(t, cPush, 0.5)); }
      var half = 52 + gap / 2, lc = 180 - half, rc = 180 + half;
      var rFlip = !(s0 && cPush != null && t >= cPush);
      var pair = mgBar(lc, 252, 104, 38, { flip: true, fs: 24 }) + mgBar(rc, 252, 104, 38, { flip: rFlip, fs: 24 });
      if (s0) {
        var pu = on(t, cPull, 0.5) * (1 - on(t, cPush, 0.4));
        pair += MK.arrow(lc - 74, 252, lc - 60, 252, pu, P.gold, 6) + MK.arrow(rc + 74, 252, rc + 60, 252, pu, P.gold, 6);
        var ps = on(t, cPush, 0.5);
        pair += MK.arrow(lc - 60, 252, lc - 78, 252, ps, P.accent, 6) + MK.arrow(rc + 60, 252, rc + 78, 252, ps, P.accent, 6);
        var mo = on(t, cMeet, 0.45);
        if (mo > 0) pair += C(180, 252, 30 + gap / 2, "none", P.gold, 4, { opacity: mo, "stroke-dasharray": "10 8" });
      }
      out += G(pair, { transform: around(180, 252, pairO), opacity: Math.min(1, pairO) });
    }

    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A bar magnet with a north pole and a south pole, and two magnets meeting">' + out + "</svg>";
  }

  /* ==== chapter: two poles ==========================================================
     One bar magnet, drawn big. Its ends light up as they are called poles, each
     pole is named with a pill and a line, each half flashes as its colour is
     said, and the lesson's own misconception ("Children think one end is the
     magnet and the other is not") is asked in a bubble and then crossed out as
     paperclips fly to BOTH ends. */
  var MG_P = { cx: 470, cy: 212, w: 520, h: 158 };
  function mgPolesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBar = c(0, "bar"), cEnds = c(0, "ends"), cPoles = c(0, "poles");
    var cNorth = c(1, "north"), cN = c(1, "n"), cSouth = c(1, "south"), cS = c(1, "s");
    var cRed = c(2, "red"), cBlue = c(2, "blue");
    var cThink = c(3, "think"), cOne = c(3, "one");
    var cBoth = c(4, "both"), cDiff = c(4, "different");
    var x0 = MG_P.cx - MG_P.w / 2, x1 = MG_P.cx + MG_P.w / 2, top = MG_P.cy - MG_P.h / 2, bot = MG_P.cy + MG_P.h / 2;
    var lc = MG_P.cx - MG_P.w / 4, rc = MG_P.cx + MG_P.w / 4, out = "";

    /* the ends, lit as they are called poles */
    var po = on(t, cPoles, 0.5);
    out += MK.glow(x0 + 52, MG_P.cy, 132, P.gold, po * (0.7 + 0.3 * breathe(t))) +
      MK.glow(x1 - 52, MG_P.cy, 132, P.gold, po * (0.7 + 0.3 * breathe(t)));

    /* the magnet itself */
    var app = Math.min(1.08, popIn(t, cBar, 0.5));
    out += G(mgBar(MG_P.cx, MG_P.cy, MG_P.w, MG_P.h, {
      litL: Math.max(bump(t, cN, 0.7), bump(t, cRed, 0.9)),
      litR: Math.max(bump(t, cS, 0.7), bump(t, cBlue, 0.9))
    }), { transform: around(MG_P.cx, MG_P.cy, app), opacity: Math.min(1, app) });

    /* "two ends": a bracket round each end */
    var eo = on(t, cEnds, 0.5) * (1 - mgFrom(t, scene, 1));
    if (eo > 0) {
      var bw = 104;
      out += Pth("M" + n2(x0 + bw) + "," + n2(top - 16) + " L" + n2(x0 - 16) + "," + n2(top - 16) +
        " L" + n2(x0 - 16) + "," + n2(bot + 16) + " L" + n2(x0 + bw) + "," + n2(bot + 16), null, P.gold, 5, { opacity: eo });
      out += Pth("M" + n2(x1 - bw) + "," + n2(top - 16) + " L" + n2(x1 + 16) + "," + n2(top - 16) +
        " L" + n2(x1 + 16) + "," + n2(bot + 16) + " L" + n2(x1 - bw) + "," + n2(bot + 16), null, P.gold, 5, { opacity: eo });
    }

    /* the two names, with a line down to the half each belongs to */
    var nameO = 1 - on(t, cThink, 0.45);
    if (nameO > 0) {
      out += G(mgLabel(t, lc, 92, "north pole", cNorth, [lc, top - 8], cS == null || t < cS, 30) +
        mgLabel(t, rc, 92, "south pole", cSouth, [rc, top - 8], cS != null && t >= cS, 30), { opacity: nameO });
    }

    /* "painted red for north and blue for south": a chip of each colour */
    var two = mgOnly(t, scene, 2);
    if (two > 0) {
      var ro = popIn(t, cRed, 0.4) * two, bo = popIn(t, cBlue, 0.4) * two;
      if (ro > 0) out += MK.pop(R(lc - 34, bot + 26, 68, 52, 12, MG_RED, "#FFFFFF", 3), lc, bot + 52, ro);
      if (bo > 0) out += MK.pop(R(rc - 34, bot + 26, 68, 52, 12, MG_BLUE, "#FFFFFF", 3), rc, bot + 52, bo);
    }

    /* the lesson's misconception, asked and then crossed out */
    var bubO = on(t, cThink, 0.45);
    if (bubO > 0) {
      out += MK.bubble(700, 18, 420, 104, "Only one end?", bubO, 724, 140);
      out += MK.qmark(x1 + 62, bot - 18, 32, on(t, cOne, 0.4) * (1 - on(t, cBoth, 0.4)));
      out += C(x1 - 52, MG_P.cy, 94, "none", P.gold, 4, { opacity: on(t, cOne, 0.4) * (1 - on(t, cBoth, 0.4)), "stroke-dasharray": "12 9" });
      out += MK.cross(1108, 34, 32, popIn(t, cBoth, 0.45));
    }

    /* "Both ends pull": paperclips fly to BOTH ends, and both ends tick */
    var pull = on(t, cBoth, 0.9);
    if (pull > 0) {
      out += mgCluster(x0 + 46, bot - 4, pull, [x0 - 150, bot + 90]);
      out += mgCluster(x1 - 46, bot - 4, pull, [x1 + 150, bot + 90]);
      out += MK.tick(x0 - 24, MG_P.cy, 26, popIn(t, cDiff, 0.4)) + MK.tick(x1 + 24, MG_P.cy, 26, popIn(t, cDiff, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: where the pull is strongest ==========================================
     The lesson's demo, in its own order: dip the magnet in the pot, lift it out
     with the paperclips clinging to the two ends and one in the middle, count
     them, write 8, 1, 8 in a table, draw the same numbers as a bar chart, and
     read the pattern off it. The table and the chart are the lesson's own
     (CLIP_TABLE and CLIP_CHART in content/lesson-11.py): the same three rows,
     the same numbers, the same red, grey and blue bars. */
  var MG_C = { cx: 300, w: 380, h: 112, card: { x: 616, y: 28, w: 526, h: 318 } };
  /* The pot of loose paperclips, in two halves: the back and the clips lying in
     it are drawn BEFORE the magnet and its front wall AFTER, so a magnet dipped
     into it goes behind the wall and is in the pot rather than on top of it. */
  var MG_POT = { x: 104, y: 292, w: 392, h: 128, rim: 52 };
  function mgPot(t, o, front) {
    if (!(o > 0)) return "";
    var K = MG_POT, out;
    if (front) {
      out = R(K.x, K.y + K.rim, K.w, K.h - K.rim, 14, P.cell) +
        R(K.x, K.y, K.w, K.h, 14, "none", P.line, 3) +
        Tx(K.x + K.w / 2, K.y + K.h - 32, "a pot of paperclips", "lab mid muted", "middle");
      return G(out, { opacity: clamp(o, 0, 1) });
    }
    out = R(K.x, K.y, K.w, K.h, 14, "#0E2434");
    for (var k = 0; k < 9; k++) {
      var x = K.x + 34 + MG_SCATTER[k] * 324, y = K.y + 18 + MG_SCATTER[(k + 4) % 12] * 30;
      out += mgClip(x, y, 1.05, MG_SCATTER[(k + 2) % 12] * 180 - 90, 1);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the table and the bar chart, drawn in the card on the right */
  function mgTable(t, cTable, cNorth, cMid, cSouth) {
    var K = MG_C.card, out = R(K.x, K.y, K.w, K.h, 18, P.night, P.line, 2);
    out += Tx(K.x + 28, K.y + 52, "Part of the magnet", "lab mid gold", "start") +
      Tx(K.x + K.w - 28, K.y + 52, "Paperclips", "lab mid gold", "end");
    var rows = [["north pole", "8", cNorth], ["middle", "1", cMid], ["south pole", "8", cSouth]];
    for (var k = 0; k < 3; k++) {
      var y = K.y + 100 + k * 68;
      out += L(K.x + 20, y - 34, K.x + K.w - 20, y - 34, P.line, 1.5);
      out += Tx(K.x + 28, y + 10, rows[k][0], "lab big", "start", { opacity: on(t, cTable, 0.5) });
      var no = popIn(t, rows[k][2], 0.4);
      if (no > 0) out += MK.pop(Tx(K.x + K.w - 60, y + 14, rows[k][1], "lab huge", "middle", { fill: P.gold }), K.x + K.w - 60, y, no);
    }
    return out;
  }
  function mgChart(t, cChart, cTall, cTiny, cPattern) {
    var K = MG_C.card, base = K.y + 258, top = K.y + 62, out = R(K.x, K.y, K.w, K.h, 18, P.night, P.line, 2);
    var xs = [K.x + 118, K.x + 263, K.x + 408], cols = [MG_RED, P.muted, MG_BLUE], vals = [8, 1, 8], names = ["north", "middle", "south"];
    out += L(K.x + 56, top - 14, K.x + 56, base, P.line, 2) + L(K.x + 56, base, K.x + K.w - 26, base, P.line, 2);
    out += Tx(K.x + 44, base + 6, "0", "lab small muted", "end") + Tx(K.x + 44, top + 6, "8", "lab small muted", "end");
    for (var k = 0; k < 3; k++) {
      var u = clamp(on(t, cChart, 0.5) * 1.4 - k * 0.12, 0, 1), h = (base - top) * (vals[k] / 8) * u;
      if (u <= 0) continue;
      var fl = k === 1 ? bump(t, cTiny, 0.9) : bump(t, cTall, 1.1);
      out += R(xs[k] - 46, base - h, 92, h, 4, cols[k]);
      if (fl > 0) out += R(xs[k] - 46, base - h, 92, h, 4, "#FFFFFF", null, null, { opacity: 0.4 * fl });
      out += Tx(xs[k], base - h - 14, String(vals[k]), "lab big", "middle", { opacity: u }) +
        Tx(xs[k], base + 34, names[k], "lab mid muted", "middle", { opacity: u });
    }
    /* the pattern: a line over the tops, high, low, high */
    var pu = on(t, cPattern, 0.9);
    if (pu > 0) {
      var y8 = base - (base - top), y1 = base - (base - top) / 8;
      var pts = [[xs[0], y8 - 9], [xs[1], y1 - 9], [xs[2], y8 - 9]];
      var d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]) + " Q" + n2((pts[0][0] + pts[1][0]) / 2) + "," + n2(pts[1][1] - 18) +
        " " + n2(pts[1][0]) + "," + n2(pts[1][1]) + " Q" + n2((pts[1][0] + pts[2][0]) / 2) + "," + n2(pts[1][1] - 18) + " " + n2(pts[2][0]) + "," + n2(pts[2][1]);
      out += Pth(d, null, P.gold, 5, { opacity: pu, "stroke-dasharray": n2(700 * pu) + " 700" });
    }
    return out;
  }

  function mgCountChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDip = c(0, "dip"), cPot = c(0, "pot"), cLift = c(0, "lift");
    var cEnds = c(1, "ends"), cMiddle = c(1, "middle");
    var cCount = c(2, "count"), cTable = c(2, "table");
    var cNorth = c(3, "north"), cMid = c(3, "mid"), cSouth = c(3, "south");
    var cChart = c(4, "chart"), cTall = c(5, "tall"), cTiny = c(5, "tiny"), cPattern = c(5, "pattern");

    var dip = on(t, cDip, 0.7), lift = on(t, cLift, 0.7), out = "", left = "";
    /* the magnet stands in the middle until the table needs the right-hand side */
    var slide = lerp(210, 0, on(t, cTable == null ? null : cTable - 0.35, 0.45));
    var cy = lerp(lerp(120, 330, dip), 158, lift);
    var x0 = MG_C.cx - MG_C.w / 2, x1 = MG_C.cx + MG_C.w / 2, bot = cy + MG_C.h / 2;

    /* the pot, and the magnet that dips into it */
    var potO = (1 - mgFrom(t, scene, 1)) * (1 - 0.45 * lift);
    left += mgPot(t, potO, false);
    left += MK.glow(MG_C.cx, 330, 110, P.gold, on(t, cPot, 0.5) * (1 - lift) * 0.85);
    left += mgBar(MG_C.cx, cy, MG_C.w, MG_C.h, { fs: 62 });
    left += mgPot(t, potO, true);

    /* the paperclips it lifts out: eight at each end, one in the middle */
    if (lift > 0) {
      left += mgCluster(x0 + 48, bot - 6, lift, null) + mgCluster(x1 - 48, bot - 6, lift, null);
      left += mgClip(MG_C.cx, bot + 26, 1.25, 6, Math.min(1, lift * 2));
      var eo = on(t, cEnds, 0.5) * (1 - mgFrom(t, scene, 2));
      if (eo > 0) left += MK.glow(x0 + 48, bot + 34, 92, P.gold, eo) + MK.glow(x1 - 48, bot + 34, 92, P.gold, eo);
      var mo = on(t, cMiddle, 0.5) * (1 - mgFrom(t, scene, 2));
      if (mo > 0) left += C(MG_C.cx, bot + 26, 44, "none", P.muted, 4, { opacity: mo, "stroke-dasharray": "10 8" });
      /* counted: 8, 1, 8 under each part */
      var counts = [[x0 + 48, "8", cCount], [MG_C.cx, "1", cCount == null ? null : cCount + 0.45], [x1 - 48, "8", cCount == null ? null : cCount + 0.9]];
      for (var k = 0; k < 3; k++) {
        var no = popIn(t, counts[k][2], 0.4);
        if (no > 0) left += MK.pop(Tx(counts[k][0], 404, counts[k][1], "lab huge", "middle", { fill: P.gold }), counts[k][0], 390, no);
      }
    }
    out += G(left, { transform: "translate(" + n2(slide) + ",0)" });

    /* the table, then the same numbers as a bar chart */
    var ch = on(t, cChart, 0.6);
    if (ch < 1) out += G(mgTable(t, cTable, cNorth, cMid, cSouth), { opacity: on(t, cTable, 0.5) * (1 - ch) });
    if (ch > 0) out += G(mgChart(t, cChart, cTall, cTiny, cPattern), { opacity: ch });
    return svg(out);
  }

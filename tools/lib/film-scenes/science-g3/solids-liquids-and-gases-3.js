  /* ==== chapters: gases, and sand and honey ==================================
     tools/lib/film-scenes/science-g3/solids-liquids-and-gases-3.js.

     Gases: the lesson's balloon of air, untied, spreading through a room, and
     the lesson's own correction ("Children think gas is nothing").
     Sand and honey: the lesson's three sorting bins (its State sorter step:
     Solid, Liquid, Gas) with its two hard cases put into them - sand, which
     pours and is lots of tiny solids, and honey, which is slow and still
     flows. */

  /* ---- gases ------------------------------------------------------------------ */
  var SL_ROOM = { x: 56, y: 78, w: 700, h: 320 };

  /* n specks inside the ellipse (cx, cy, rx, ry), spread out by u */
  function slGasInBalloon(cx, cy, rx, ry, sx, sy, n, u, o, t) {
    if (!(o > 0)) return "";
    var out = "", e = ease(clamp(u, 0, 1));
    for (var k = 0; k < n; k++) {
      var a = SL_SCATTER[(k * 3 + 1) % SL_SCATTER.length], b = SL_SCATTER[(k * 5 + 2) % SL_SCATTER.length];
      var rr = Math.sqrt(a) * 0.82, th = b * Math.PI * 2;
      var tx = cx + rr * rx * Math.cos(th), ty = cy + rr * ry * Math.sin(th);
      out += C(lerp(sx, tx, e) + Math.sin(t * 1.4 + k) * 3 * e, lerp(sy, ty, e) + Math.cos(t * 1.2 + k) * 3 * e,
        5 + 2 * a, SL_GAS, null, null, { opacity: 0.9 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function slGasesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGas = c(0, "gas"), cSpread = c(0, "spread"), cSpace = c(0, "space");
    var cUntie = c(1, "untie"), cRush = c(1, "rush"), cRoom = c(1, "room");
    var cSee = c(2, "cannot"), cThere = c(2, "there"), cWave = c(2, "wave");
    var cNothing = c(3, "nothing"), cAir = c(3, "air"), cSomething = c(3, "something");
    var R0 = SL_ROOM, out = "";

    var leave = on(t, cRush, 1.5);                   /* the air leaves the balloon */
    var bx = 292, by = 232, brx = 92 * (1 - 0.62 * leave), bry = 108 * (1 - 0.62 * leave);

    /* the room */
    out += R(R0.x, R0.y, R0.w, R0.h, 18, "#0E2434", P.line, 3, { "stroke-dasharray": "16 11" });
    out += L(R0.x + 10, R0.y + R0.h - 8, R0.x + R0.w - 10, R0.y + R0.h - 8, P.line, 5);
    out += R(R0.x + 6, R0.y + 6, R0.w - 12, R0.h - 12, 14, "none", P.gold, 4,
      { opacity: Math.max(bump(t, cRoom, 1.6), 0) });
    out += MK.pill(R0.x + 96, R0.y + 28, "the room", on(t, cRoom, 0.45), { size: 24, col: P.gold });

    /* faded once the child is told they cannot see it, and never quite gone */
    var dim = 1 - 0.8 * on(t, cSee, 0.7) + 0.5 * bump(t, cThere, 1.4);

    out += slBalloon(bx, by, brx, bry, leave > 0.12 ? 1 : 0, 1 - 0.85 * on(t, cRoom, 1.0));
    /* inside the balloon first, then out through its neck and across the room */
    var inside = on(t, cSpread, 1.3);
    out += G(slGasInBalloon(bx, by, brx * 0.84, bry * 0.84, bx, by + bry * 0.6, 14, inside, 1 - leave, t), { opacity: clamp(dim, 0, 1) });
    out += slGasFill(R0.x + 14, R0.y + 14, R0.w - 28, R0.h - 34, bx, by + bry + 10, 26, leave, clamp(leave * dim, 0, 1), t);
    /* the balloon holds its shape full of air: "every bit of space it can" */
    out += E(bx, by, brx + 12, bry + 12, "none", P.gold, 4, { opacity: bump(t, cSpace, 1.6) * (1 - leave) });
    out += MK.pill(bx, 406, "it fills the whole balloon", on(t, cSpace, 0.45) * (1 - on(t, cUntie, 0.5)), { size: 24, col: P.gold });
    out += MK.ripple(bx, by + bry + 14, t, cUntie, P.gold);
    out += MK.arrow(bx + 20, by + bry + 26, bx + 150, by + bry + 4, on(t, cRush, 0.6) * (1 - on(t, cSee, 0.6)), P.gold, 7);

    /* "Wave your hand and feel it": a hand, waving, in the air that is there */
    var wave = on(t, cWave, 0.4);
    if (wave > 0) {
      var sw = Math.sin((t - cWave) * 6.2) * 17;
      out += G(Em(0, 0, 150, "✋"), { transform: "translate(596,262) rotate(" + n2(sw) + ")", opacity: wave });
      out += Pth("M498,214 q-26,48 0,96", null, P.gold, 4, { opacity: wave * 0.8 });
      out += Pth("M470,196 q-34,66 0,132", null, P.gold, 4, { opacity: wave * 0.5 });
    }

    /* the lesson's correction, on the right */
    var nx = 952;
    out += MK.pill(nx, 118, "a gas is nothing", on(t, cNothing, 0.45), { size: 28, col: P.line });
    out += MK.qmark(1128, 118, 24, on(t, cNothing, 0.5));
    out += MK.cross(nx, 202, 30, popIn(t, cSomething, 0.4));
    out += MK.pill(nx, 292, "air is a gas", on(t, cAir, 0.45), { size: 28, col: P.gold });
    out += MK.pill(nx, 348, "and a gas is something", on(t, cSomething, 0.45), { size: 22, col: P.gold });
    out += MK.tick(nx, 404, 26, popIn(t, cSomething == null ? null : cSomething + 0.3, 0.4));
    return svg(out);
  }

  /* ---- sand and honey ---------------------------------------------------------- */
  var SL_BIN_X = [236, 584, 932];
  var SL_BINS = [
    { pic: "\u{1F9F1}", label: "Solid", ask: "keeps its shape?" },
    { pic: "\u{1F30A}", label: "Liquid", ask: "flows?" },
    { pic: "\u{1F4A8}", label: "Gas", ask: "spreads out?" }
  ];

  /* one grain of sand, drawn big: it has a shape of its own */
  function slGrain(cx, cy, s, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(-s) + ",0 L" + n2(-0.6 * s) + "," + n2(-0.78 * s) + " L" + n2(0.24 * s) + "," + n2(-s) +
      " L" + n2(0.92 * s) + "," + n2(-0.42 * s) + " L" + n2(0.84 * s) + "," + n2(0.5 * s) + " L" + n2(0.1 * s) + "," + n2(0.96 * s) +
      " L" + n2(-0.68 * s) + "," + n2(0.66 * s) + " Z", SL_SAND, SL_SANDL, s * 0.09),
      { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* a hand lens: its lens centred on (cx, cy), `under` drawn again inside it */
  function slLens(cx, cy, r, under, o) {
    if (!(o > 0)) return "";
    var h = Math.SQRT1_2, out = "";
    out += L(cx - r * h, cy + r * h, cx - r * 1.62 * h - 20, cy + r * 1.62 * h + 20, "#6B4AA0", 24);
    out += C(cx, cy, r, "#0F2A3C");
    out += G(under, {});
    out += C(cx, cy, r - 4, "#BFE3F5", null, null, { opacity: 0.1 });
    out += C(cx, cy, r, "none", "#8A63C4", 12);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a heap of sand on the floor, grown to u, with grains still falling into it */
  function slHeap(t, cx, baseY, w, u, from, until) {
    if (!(u > 0)) return "";
    var hw = w / 2 * ease(clamp(u, 0, 1)), hh = 74 * ease(clamp(u, 0, 1)), out = "";
    out += Pth("M" + n2(cx - hw) + "," + n2(baseY) + " Q" + n2(cx - hw * 0.28) + "," + n2(baseY - hh) + " " + n2(cx) + "," + n2(baseY - hh) +
      " Q" + n2(cx + hw * 0.28) + "," + n2(baseY - hh) + " " + n2(cx + hw) + "," + n2(baseY) + " Z", SL_SAND, SL_SANDL, 3);
    if (from != null) {
      for (var k = 0; k < 10; k++) {
        var born = from + k * 0.12;
        if (t < born) continue;
        var ph = ((t - born) / 0.85) % 1, cyc = Math.floor((t - born) / 0.85);
        if (born + cyc * 0.85 > until) continue;
        var dx = (SL_SCATTER[k] - 0.5) * 46;
        out += C(cx + dx * ph, lerp(baseY - 168, baseY - hh - 4, ph * ph), 5, SL_SAND, null, null, { opacity: Math.min(1, (1 - ph) * 5) });
      }
    }
    return out;
  }

  function slSandBins(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var ats = [c(0, "keep"), c(0, "flow"), c(0, "spread")];
    var only0 = slOnly(t, scene, 0), out = "";
    SL_BINS.forEach(function (b, k) {
      var p = popIn(t, ats[k], 0.4), x = SL_BIN_X[k];
      if (p <= 0) return;
      out += G(MK.pic(x, 96, 84, b.pic), { transform: around(x, 96, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      out += Tx(x, 166, b.label, "lab big", "middle", { opacity: Math.min(1, p), fill: P.ink });
      out += MK.pill(x, 232, b.ask, on(t, ats[k], 0.45) * only0, { size: 26, col: P.gold });
    });
    return out;
  }

  function slSandChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPours = c(1, "pours"), cCall = c(1, "call");
    var cGrain = c(2, "grain"), cKeeps = c(2, "keeps"), cTiny = c(2, "tiny");
    var cSlow = c(3, "slow"), cBut = c(3, "but"), cLiquid = c(3, "liquid");
    var out = slSandBins(t, scene);

    /* the sand: it pours, and one grain of it keeps its shape */
    var sandOn = slFrom(t, scene, 1) * (1 - slFrom(t, scene, 3));
    if (sandOn > 0) {
      var s = "";
      var stop = cGrain == null ? (cPours == null ? 0 : cPours + 2.2) : cGrain - 0.2;
      s += slHeap(t, 360, 412, 300, on(t, cPours, 0.9), cPours == null ? null : cPours + 0.2, stop);
      s += MK.qmark(SL_BIN_X[1] + 96, 96, 26, on(t, cCall, 0.5) * (1 - on(t, cTiny, 0.5)));
      s += MK.leader(430, 320, SL_BIN_X[1] - 6, 140, on(t, cCall, 0.7) * (1 - on(t, cTiny, 0.5)), P.muted);
      /* one grain, under the lens */
      /* a smaller lens than the first cut, and higher: at r = 106 its handle
         hung 20 px below the 1168 x 440 box and its label sat under the Gas
         bin's own */
      var lens = on(t, cGrain, 0.45);
      if (lens > 0) {
        var gx = 790, gy = 296, r = 86;
        s += slLens(gx, gy, r, slGrain(gx, gy, 58, 1) +
          Pth("M" + n2(gx - 58) + "," + n2(gy) + " L" + n2(gx - 34.8) + "," + n2(gy - 45.2) + " L" + n2(gx + 13.9) + "," + n2(gy - 58) +
            " L" + n2(gx + 53.4) + "," + n2(gy - 24.4) + " L" + n2(gx + 48.7) + "," + n2(gy + 29) + " L" + n2(gx + 5.8) + "," + n2(gy + 55.7) +
            " L" + n2(gx - 39.4) + "," + n2(gy + 38.3) + " Z", null, P.gold, 5, { opacity: bump(t, cKeeps, 1.8) }), lens);
        s += MK.leader(470, 344, gx - r - 8, gy + 26, on(t, cGrain, 0.7), P.gold);
        s += MK.pill(gx, 182, "one grain", lens, { size: 26, col: P.gold });
        s += MK.tick(gx + r + 6, gy - r + 22, 28, popIn(t, cKeeps == null ? null : cKeeps + 0.5, 0.4));
      }
      /* sorted: not a liquid, a heap of tiny solids. The cross belongs to the
         sand and goes out with it; the verdict under Solid is drawn outside
         this group, so the honey does not erase where the sand ended up. */
      s += MK.cross(SL_BIN_X[1] + 96, 96, 28, popIn(t, cTiny, 0.4));
      out += G(s, { opacity: sandOn });
    }
    out += MK.tick(SL_BIN_X[0] + 96, 96, 28, popIn(t, cTiny == null ? null : cTiny + 0.35, 0.4));
    out += MK.pill(SL_BIN_X[0], 232, "sand", on(t, cTiny == null ? null : cTiny + 0.4, 0.45), { size: 26, col: P.good });

    /* the honey: slow, and it still flows */
    var honeyOn = slFrom(t, scene, 3);
    if (honeyOn > 0) {
      var h = "";
      var tip = 62 * on(t, cSlow, 1.1);
      /* the pot sits high enough for the honey to FALL into the glass: level
         with it, a 17 px rope over 212 px read as a plank between the two */
      h += G(MK.pic(0, 0, 150, "\u{1F36F}"), { transform: "translate(392,264) rotate(" + n2(tip) + ")" });
      h += slStream(t, cSlow == null ? null : cSlow + 0.8, cBut == null ? 0 : cBut + 1.6, 452, 284, 672, 348, 17, SL_HONEY);
      h += slGlass(700, 292, 128, 104, 78, on(t, cBut, 1.4) * 0.6, 1, SL_HONEY, "#F6CE6B");
      h += MK.pill(392, 402, "slowly", on(t, cSlow, 0.45), { size: 26, col: P.muted });
      h += MK.pill(900, 352, "but it flows", on(t, cBut, 0.45), { size: 24, col: P.gold });
      h += MK.tick(SL_BIN_X[1] + 96, 96, 28, popIn(t, cLiquid, 0.4));
      h += MK.pill(SL_BIN_X[1], 232, "honey", on(t, cLiquid == null ? null : cLiquid + 0.3, 0.45), { size: 26, col: P.good });
      out += G(h, { opacity: honeyOn });
    }
    return svg(out);
  }

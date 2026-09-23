  /* ==== chapter: many kinds of rock ===========================================
     tools/lib/film-scenes/science-g2/rocks-and-the-earth-2.js.

     The six rocks of the lesson's "Not all rock is the same" step, in the order
     its cards stand in: granite, chalk, sandstone, marble, slate, pumice. They
     sit in a strip along the top, the one being named lit and the others dimmed
     (rule 3), and that rock is drawn large below it while its properties are
     said, one pill at a time, each with a line to the rock. What the words name
     is what moves: granite's speckles arrive on "speckles", chalk crumbles into
     dust and writes on a board, sandstone's grains arrive on "grainy", marble
     takes a polish on "shiny", slate splits into three sheets on "It splits",
     and pumice fills with holes and then floats on water. */

  var RK_STRIP_X = [89, 279, 469, 659, 849, 1039];
  var RK_BIG = { x: 360, y: 296, r: 116 };

  /* a property, in a pill on the right with a line to the big rock */
  function rkLabel(t, y, text, at, to, now) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    return MK.leader(592, y, to[0], to[1], on(t, at, 0.6), now ? P.gold : P.muted) +
      MK.pill(600, y, text, Math.min(1, o), { size: 26, anchor: "start", col: now ? P.gold : P.line, fill: now ? "#1B3A52" : P.card });
  }

  /* the strip of six, the named one lit */
  function rkStrip(t, scene, kk) {
    var out = "";
    RK_ORDER.forEach(function (kind, k) {
      var x = RK_STRIP_X[k], here = k === kk;
      var seen = on(t, sc(scene, k, kind), 0.4);
      var o = here ? 1 : 0.42 + 0.18 * seen;
      if (here) out += C(x, 74, 58, "#1B3A52", P.gold, 3, { opacity: on(t, sc(scene, k, kind), 0.4) });
      out += rkRock(kind, x, 74, 42, o, { show: 1, sheen: 0, split: 0 });
      out += rkName(x, 142, kind, 1, here);
    });
    return out;
  }

  /* ---- what each rock does while it is named ---------------------------------- */

  /* chalk dust falling off the rock, and the board it writes on */
  function rkChalkExtras(t, scene, cx, cy, r) {
    var cCrumb = sc(scene, 1, "crumbles"), cWrite = sc(scene, 1, "write"), out = "";
    if (cCrumb != null && t >= cCrumb) {
      for (var k = 0; k < 10; k++) {
        var born = cCrumb + k * 0.11, ph = ((t - born) / 1.1) % 1;
        if (t < born) continue;
        var x = cx - r * 0.7 + RK_SCATTER[k] * r * 1.4;
        var y = cy + r * 0.5 + ph * (r * 0.55);
        out += C(x, y, 5 - 2 * ph, "#EDE7D8", null, null, { opacity: (1 - ph) * on(t, cCrumb, 0.3) });
      }
    }
    var wo = on(t, cWrite, 0.28);
    if (wo > 0) {
      /* 0.7 s from just after the word: at 1.1 s from +0.25 the last stroke was
         still being drawn when the chapter moved on to sandstone */
      var bx = 886, by = 232, bw = 200, bh = 132, u = on(t, cWrite == null ? null : cWrite + 0.12, 0.7);
      out += G(R(bx, by, bw, bh, 12, "#1E2A22", "#6B4A2B", 7) +
        (u > 0 ? Pth("M" + n2(bx + 30) + "," + n2(by + 86) + " q" + n2(22 * u) + "," + n2(-56 * u) + " " + n2(46 * u) + ",2" +
          (u > 0.55 ? " q" + n2(20 * u) + "," + n2(-52 * u) + " " + n2(44 * u) + ",0" : ""), null, "#F7F4EC", 8) : ""),
        { opacity: wo });
      out += G(MK.pic(bx + 172, by + 128, 62, ART.ICONS.chalk), { opacity: wo, transform: tr(0, -10 * on(t, cWrite == null ? null : cWrite + 0.1, 0.5)) });
    }
    return out;
  }

  /* a heap of loose sand beside the rock, for "like sand stuck together" */
  function rkSandExtras(t, scene) {
    var cSand = sc(scene, 2, "sand"), cStuck = sc(scene, 2, "stuck"), out = "";
    var o = on(t, cSand, 0.5);
    if (o <= 0) return "";
    var hx = 960, hy = 348;
    out += Pth("M" + n2(hx - 86) + "," + n2(hy) + " q" + n2(86) + "," + n2(-66) + " " + n2(172) + ",0 Z", "#C9A26B", "#8A6A3A", 3, { opacity: o });
    for (var k = 0; k < 16; k++) {
      var gx = hx - 74 + RK_SCATTER[k] * 148, gy = hy - 6 - RK_SCATTER[(k + 5) % RK_SCATTER.length] * 46;
      out += C(gx, gy, 3.6, k % 2 ? "#EBD2A8" : "#A5814F", null, null, { opacity: o * 0.95 });
    }
    out += MK.pill(hx, hy + 34, "loose sand", o, { size: 22, col: P.line });
    /* "stuck together": the heap presses in on itself */
    var st = bump(t, cStuck, 1.3);
    if (st > 0) {
      out += MK.arrow(hx - 128, hy - 22, hx - 96 + 14 * st, hy - 22, 1, P.gold, 6);
      out += MK.arrow(hx + 128, hy - 22, hx + 96 - 14 * st, hy - 22, 1, P.gold, 6);
    }
    return out;
  }

  /* marble: a smooth glide across the top, then the polish */
  function rkMarbleExtras(t, scene, cx, cy, r) {
    var cSmooth = sc(scene, 3, "smooth"), u = on(t, cSmooth, 1.1);
    if (u <= 0) return "";
    var x0 = cx - r * 0.92, x1 = cx + r * 0.92, y = cy - r * 0.82 - 22;
    var out = Pth("M" + n2(x0) + "," + n2(y + 16) + " q" + n2(r * 0.9) + "," + n2(-30) + " " + n2(r * 1.84) + ",16",
      null, P.gold, 4, { "stroke-dasharray": n2(r * 2.1), "stroke-dashoffset": n2(r * 2.1 * (1 - u)), opacity: 0.95 });
    var px = lerp(x0, x1, u), py = y + 16 - 30 * 4 * u * (1 - u) * 0.5;
    out += C(px, py, 9, P.gold);
    return out;
  }

  /* slate: how thin one sheet is, measured off the top sheet. The words
     "thin flat sheets" are already in a pill of their own on the right, so
     this marks the sheet rather than saying it twice. */
  function rkSlateExtras(t, scene, cx, cy, r) {
    var cSheets = sc(scene, 4, "sheets"), o = on(t, cSheets, 0.5);
    if (o <= 0) return "";
    var top = cy - r * 0.46 - r * 0.123, x = cx - r * 1.32;
    return G(MK.arrow(x, top - 28, x, top - 3, 1, P.gold, 5) + MK.arrow(x, top + 32, x, top + 7, 1, P.gold, 5) +
      Tx(x - 14, top + 10, "thin", "lab mid gold", "end"), { opacity: o });
  }

  /* pumice: the water it floats on */
  function rkPumiceWater(t, scene, o) {
    if (!(o > 0)) return "";
    var y = 372;
    return G(R(176, y, 392, 62, 10, "#2C6FA8", "#3B7FD1", 3) +
      Pth("M176," + n2(y + 4) + " q49,-9 98,0 t98,0 t98,0 t98,0", null, "#7FC4EA", 4, { opacity: 0.8 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the big rock, and its properties ---------------------------------------- */
  function rkBigRock(t, scene, k) {
    var kind = RK_ORDER[k], cx = RK_BIG.x, cy = RK_BIG.y, r = RK_BIG.r, out = "", opt = { show: 1 };
    var c = function (name) { return sc(scene, k, name); };
    var pills = [], extras = "", before = "";

    if (kind === "granite") {
      opt.show = 0.3 + 0.7 * on(t, c("speckles"), 1.2);
      pills = [["very hard", c("hard")], ["speckles", c("speckles")], ["different colours", c("colours")]];
      var co = on(t, c("colours"), 0.5);
      if (co > 0) {
        ["#F4F1E8", "#C1553F", "#2E2E33", "#7F97AE"].forEach(function (col, n) {
          extras += C(930 + n * 46, 362, 19 * Math.min(1, popIn(t, c("colours") + n * 0.14, 0.35)), col, P.line, 2, { opacity: co });
        });
      }
    } else if (kind === "chalk") {
      pills = [["soft and white", c("soft")], ["it crumbles", c("crumbles")], ["write with it", c("write")]];
      extras = rkChalkExtras(t, scene, cx, cy, r);
    } else if (kind === "sandstone") {
      opt.show = 0.3 + 0.7 * on(t, c("grainy"), 1.1);
      pills = [["grainy", c("grainy")], ["like sand", c("sand")], ["stuck together", c("stuck")]];
      extras = rkSandExtras(t, scene);
    } else if (kind === "marble") {
      opt.sheen = on(t, c("shiny"), 1.3);
      pills = [["smooth", c("smooth")], ["shiny when polished", c("shiny")]];
      extras = rkMarbleExtras(t, scene, cx, cy, r);
    } else if (kind === "slate") {
      opt.split = on(t, c("splits"), 1.2);
      pills = [["dark", c("dark")], ["it splits", c("splits")], ["thin flat sheets", c("sheets")]];
      extras = rkSlateExtras(t, scene, cx, cy, r);
    } else if (kind === "pumice") {
      opt.show = 0.3 + 0.7 * on(t, c("holes"), 1.1);
      pills = [["full of holes", c("holes")], ["so light", c("light")], ["it floats", c("floats")]];
      var fl = on(t, c("floats"), 1.0);
      cy = cy + 30 * fl + (fl > 0.9 ? 4 * Math.sin(t * 2.2) : 0);
      /* the water goes down BEHIND the rock, and again at a fifth over it, so
         the part under the surface shows through and the rest sits on top */
      before = rkPumiceWater(t, scene, on(t, c("light"), 0.6));
      extras = rkPumiceWater(t, scene, on(t, c("light"), 0.6) * 0.34);
    }

    out += before;
    out += rkRock(kind, cx, cy, r, 1, opt);
    out += extras;

    /* the property pills, newest gold. Slate's three point at its three
       sheets, which have slid apart by then and are nowhere near where the
       whole lump was. */
    var ys = pills.length === 2 ? [228, 330] : [196, 286, 376];
    var tos = kind === "slate"
      ? [[cx + r * 0.62, cy - r * 0.46], [cx + r * 0.94, cy], [cx + r * 1.24, cy + r * 0.46]]
      : [[cx + r * 0.76, cy - r * 0.42], [cx + r * 0.50, cy + r * 0.14], [cx + r * 0.24, cy + r * 0.70]];
    var newest = -1;
    pills.forEach(function (p, n) { if (p[1] != null && t >= p[1]) newest = n; });
    pills.forEach(function (p, n) { out += rkLabel(t, ys[n], p[0], p[1], tos[n], n === newest); });
    return out;
  }

  /* ---- "Not all rock is the same" ------------------------------------------------ */
  var RK_ROW_X = [130, 306, 482, 658, 834, 1010];
  function rkKindsSummary(t, scene) {
    var cGrey = sc(scene, 6, "grey"), cSame = sc(scene, 6, "same"), out = "";
    /* the idea a child comes in with, crossed out in the lesson's own words */
    var go = on(t, cGrey, 0.4);
    out += MK.pill(500, 58, "all rock is grey and hard", go, { size: 27, col: P.bad, ink: P.muted });
    out += MK.cross(786, 58, 30, popIn(t, cGrey == null ? null : cGrey + 0.45, 0.4));
    /* the six, every one different */
    RK_ORDER.forEach(function (kind, k) {
      var p = popIn(t, cSame == null ? null : cSame + k * 0.13, 0.4);
      var o = 0.55 + 0.45 * Math.min(1, p);
      out += rkRock(kind, RK_ROW_X[k], 248, 62, o, { show: 1 });
      out += rkName(RK_ROW_X[k], 344, kind, o, p > 0);
    });
    out += MK.pill(584, 412, "six rocks, six sets of properties", on(t, cSame == null ? null : cSame + 0.9, 0.5), { size: 26, col: P.gold });
    return out;
  }

  function rkKindsChapter(scene, beat, t, i) {
    var k = i - scene.first, last = scene.beats.length - 1, out = "";
    var u = last < scene.beats.length ? into(t, scene.first + last) : 0;
    if (u < 1) {
      var kk = Math.min(k, last - 1), body = rkStrip(t, scene, kk);
      var v = kk > 0 ? into(t, scene.first + kk) : 1;
      if (v < 1 && kk > 0) body += G(rkBigRock(t, scene, kk - 1), { opacity: 1 - v });
      body += G(rkBigRock(t, scene, kk), { opacity: v });
      out += G(body, { opacity: 1 - u });
    }
    if (u > 0) out += G(rkKindsSummary(t, scene), { opacity: u });
    return svg(out);
  }

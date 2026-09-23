  /* ==== chapters: testing rocks, and where rock comes from ====================
     tools/lib/film-scenes/science-g2/rocks-and-the-earth-3.js.

     Testing rocks is the lesson's "Rock tester" step and the table its "Record"
     step fills in: the coin scratch (the kit's own coin drawing), the drop of
     water, and the hand lens, each done to the rocks the line names, with the
     lesson's own four-row table for the water test.

     Where rock comes from is the lesson's "Rock getters" demo, frame by frame:
     ART.scene("extract", 0), (1) and (2) are its quarry, its mine and its
     riverbed, placed whole as cards with room round them. */

  /* ---- testing ----------------------------------------------------------------- */

  /* the coin, dragged across a rock: it leaves a groove on a soft one */
  function rkCoin(t, at, cx, cy, r, scratches) {
    var o = on(t, at, 0.35);
    if (o <= 0) return "";
    var u = on(t, at == null ? null : at + 0.3, 1.0);
    var x0 = cx - r * 0.86, x1 = cx + r * 0.86, y = cy - r * 0.30;
    var out = "";
    /* a groove, not a white line: chalk is white and a white mark on it is
       no mark at all */
    if (scratches && u > 0.02) out += L(x0, y + 10, lerp(x0, x1, u), y + 10, "#8C826D", 8, { opacity: 0.95 });
    out += G(MK.pic(lerp(x0, x1, u), y - 30, 74, ART.ICONS.coin), { opacity: o });
    return out;
  }

  function rkTestIntro(t, scene) {
    var cTest = sc(scene, 0, "test"), cProps = sc(scene, 0, "properties"), cLike = sc(scene, 0, "like"), out = "";
    var cx = 400, cy = 250, r = 110;
    out += MK.glow(cx, cy, 190, P.blue, on(t, cTest, 0.6) * (0.6 + 0.4 * breathe(t)));
    out += rkRock("granite", cx, cy, r, 1, { show: 1 });
    out += C(cx, cy, r + 26, "none", P.gold, 4, { opacity: bump(t, cTest, 1.4), "stroke-dasharray": "16 11" });
    out += MK.pill(cx, cy - r - 62, "properties", popIn(t, cProps, 0.4) > 0 ? 1 : 0, { size: 30, col: P.gold });
    ["hard, or soft?", "soaks water, or not?", "grainy, or smooth?"].forEach(function (s, n) {
      var at = cLike == null ? null : cLike + n * 0.26, o = on(t, at, 0.4);
      if (o <= 0) return;
      out += MK.leader(742, 150 + n * 100, cx + r * 0.80, cy - 50 + n * 56, on(t, at, 0.6), P.muted);
      out += MK.pill(750, 150 + n * 100, s, Math.min(1, o), { size: 26, anchor: "start", col: P.line });
    });
    return out;
  }

  function rkScratchPic(t, scene) {
    var cScratch = sc(scene, 1, "scratch"), cCoin = sc(scene, 1, "coin"),
      cChalk = sc(scene, 1, "chalk"), cGranite = sc(scene, 1, "granite"), out = "";
    var ax = 340, bx = 832, cy = 232, r = 100;
    out += rkRock("chalk", ax, cy, r, 1, { show: 1 });
    out += rkRock("granite", bx, cy, r, 1, { show: 1 });
    out += rkName(ax, 360, "chalk", 1, cChalk != null && t >= cChalk);
    out += rkName(bx, 360, "granite", 1, cGranite != null && t >= cGranite);
    /* the coin itself, held up first, then dragged across each rock */
    var hold = on(t, cCoin, 0.4) * (1 - on(t, cChalk, 0.4));
    if (hold > 0) out += G(MK.pic(584, 104, 86, ART.ICONS.coin), { opacity: hold, transform: around(584, 104, 1 + 0.08 * breathe(t)) });
    out += MK.pill(584, 200, "scratch it", on(t, cScratch, 0.4) * (1 - on(t, cChalk, 0.5)), { size: 26, col: P.gold });
    out += rkCoin(t, cChalk, ax, cy, r, true);
    out += rkCoin(t, cGranite, bx, cy, r, false);
    out += MK.tick(216, 414, 22, popIn(t, cChalk == null ? null : cChalk + 0.85, 0.35));
    out += MK.pill(346, 414, "it scratches", on(t, cChalk == null ? null : cChalk + 0.85, 0.4), { size: 24, col: P.good, ink: P.good });
    out += MK.cross(722, 414, 22, popIn(t, cGranite == null ? null : cGranite + 0.80, 0.35));
    out += MK.pill(830, 414, "too hard", on(t, cGranite == null ? null : cGranite + 0.80, 0.4), { size: 24, col: P.bad, ink: P.bad });
    return out;
  }

  function rkWaterPic(t, scene) {
    var cDrop = sc(scene, 2, "drop"), cSoak = sc(scene, 2, "soak"), cRun = sc(scene, 2, "run"), out = "";
    var cx = 584, cy = 286, r = 112;
    out += rkRock("sandstone", cx, cy, r, 1, { show: 1 });
    /* drops falling from above onto the rock */
    if (cDrop != null && t >= cDrop) {
      for (var k = 0; k < 4; k++) {
        var born = cDrop + k * 0.32, ph = ((t - born) / 0.9) % 1;
        if (t < born || born + Math.floor((t - born) / 0.9) * 0.9 > cDrop + 2.4) continue;
        var y = lerp(78, cy - r * 0.70, ph * ph);
        out += G(Pth("M" + n2(cx - 9) + "," + n2(y + 4) + " L" + n2(cx) + "," + n2(y - 16) + " L" + n2(cx + 9) + "," + n2(y + 4) + " Z", "#7FC4EA") +
          C(cx, y + 6, 9, "#7FC4EA"), { opacity: Math.min(1, (1 - ph) * 4, ph * 8) });
      }
    }
    out += MK.pill(cx, 54, "one drop of water", on(t, cDrop, 0.4), { size: 26, col: "#7FC4EA" });
    /* soak in: an arrow down into the rock; run off: an arrow away to the side */
    out += MK.arrow(cx - 40, cy - 30, cx - 40, cy + 62, on(t, cSoak, 0.6), "#7FC4EA", 8);
    out += MK.pill(cx - 176, cy + 74, "soak in?", on(t, cSoak, 0.4), { size: 26, col: "#7FC4EA" });
    out += MK.arrow(cx + 40, cy - 34, cx + 168, cy + 44, on(t, cRun, 0.6), "#7FC4EA", 8);
    out += MK.pill(cx + 268, cy + 58, "run off?", on(t, cRun, 0.4), { size: 26, col: "#7FC4EA" });
    out += MK.qmark(cx, cy - r - 46, 28, on(t, cRun, 0.5));
    return out;
  }

  /* the lesson's own record table: four rocks, one property */
  var RK_TABLE = [
    { kind: "granite", soaks: false, cue: "granite" },
    { kind: "chalk", soaks: true, cue: "chalk" },
    { kind: "sandstone", soaks: true, cue: "sandstone" },
    { kind: "marble", soaks: false, cue: "marble" }
  ];
  function rkTablePic(t, scene) {
    var x = 284, y = 26, w = 600, hh = 62, rh = 84, out = "";
    out += R(x, y, w, hh + rh * 4, 18, P.card, P.line, 2);
    out += R(x, y, w, hh, 18, P.cell);
    out += R(x, y + hh - 18, w, 18, 0, P.cell);
    out += Tx(x + 34, y + hh / 2 + 8, "Rock", "lab mid muted", "start");
    out += Tx(x + w - 34, y + hh / 2 + 8, "Soaks up water?", "lab mid muted", "end");
    /* the row being named: the last one whose word has been said */
    var now = -1;
    RK_TABLE.forEach(function (row, k) { var a = sc(scene, 3, row.cue); if (a != null && t >= a) now = k; });
    RK_TABLE.forEach(function (row, k) {
      var ry = y + hh + k * rh, at = sc(scene, 3, row.cue), o = on(t, at, 0.4);
      if (k) out += L(x + 16, ry, x + w - 16, ry, P.line, 1.5);
      out += R(x + 8, ry + 5, w - 16, rh - 10, 12, "#1B3A52", P.gold, 3, { opacity: k === now ? 1 : 0.0 });
      out += rkRock(row.kind, x + 62, ry + rh / 2, 28, 1, { show: 1 });
      out += Tx(x + 116, ry + rh / 2 + 10, row.kind, "lab big", "start");
      if (row.soaks) out += MK.tick(x + w - 62, ry + rh / 2, 24, popIn(t, at, 0.4));
      else out += MK.cross(x + w - 62, ry + rh / 2, 24, popIn(t, at, 0.4));
      out += Tx(x + w - 108, ry + rh / 2 + 9, row.soaks ? "yes" : "no", "lab mid " + (row.soaks ? "good" : "bad"), "end", { opacity: on(t, at, 0.5) });
    });
    out += MK.pill(1026, 150, "your own table", on(t, sc(scene, 3, "chalk"), 0.5), { size: 24, col: P.line });
    return out;
  }

  /* The hand lens. It stays over the sandstone and magnifies whatever is under
     it - all three rocks are drawn again inside it, scaled about the lens
     centre, so the glass can never show a rock that is not there. It used to
     slide from rock to rock and magnify the rock it was heading for, which left
     it empty for most of the slide; the three words are 0.4 s apart here, so
     each one rings its own rock instead. */
  function rkLensPic(t, scene) {
    var cLens = sc(scene, 4, "lens"), cGrainy = sc(scene, 4, "grainy"), cSmooth = sc(scene, 4, "smooth"), cHoles = sc(scene, 4, "holes");
    var xs = [284, 584, 884], kinds = ["sandstone", "marble", "pumice"], names = ["grainy", "smooth", "full of holes"];
    var cues = [cGrainy, cSmooth, cHoles], cy = 240, r = 80, out = "", rocks = "";
    kinds.forEach(function (kind, k) { rocks += rkRock(kind, xs[k], cy, r, 1, { show: 1 }); });
    out += rocks;
    var newest = -1;
    cues.forEach(function (c, k) { if (c != null && t >= c) newest = k; });
    kinds.forEach(function (kind, k) {
      var said = on(t, cues[k], 0.4);
      /* only the rock being named wears the ring; the rest keep their word.
         The ring rises in 0.22 s because the three words are about 0.55 s
         apart: a 0.4 s fade was still arriving when the next word took it. */
      out += C(xs[k], cy, r + 20, "none", P.gold, 4, { opacity: k === newest ? on(t, cues[k], 0.22) : 0, "stroke-dasharray": "15 10" });
      out += MK.pill(xs[k], cy + 142, names[k], said, { size: 26, col: k === newest ? P.gold : P.line });
    });
    var lo = on(t, cLens, 0.4);
    if (lo > 0) {
      var lx = 300, ly = 256, lr = 76;
      out += el("clipPath", { id: "rkLensClip" }, C(lx, ly, lr - 6));
      out += G(C(lx, ly, lr, "#0F2A3C") + G(rocks, { transform: around(lx, ly, 2.0) }), { "clip-path": "url(#rkLensClip)", opacity: lo });
      out += G(Pth("M" + n2(lx - lr * 0.62) + "," + n2(ly - lr * 0.22) + " A" + n2(lr * 0.66) + "," + n2(lr * 0.66) + " 0 0 1 " + n2(lx - lr * 0.20) + "," + n2(ly - lr * 0.64), null, "#FFFFFF", 6, { opacity: 0.45 }) +
        C(lx, ly, lr, "none", "#8A8F96", 11) +
        L(lx + lr * 0.70, ly + lr * 0.70, lx + lr * 1.30, ly + lr * 1.30, "#4E6070", 20), { opacity: lo });
    }
    out += MK.pill(584, 56, "look with a hand lens", lo, { size: 26, col: P.gold });
    return out;
  }

  function rkTestSummary(t, scene) {
    var cOwn = sc(scene, 5, "own"), cFinds = sc(scene, 5, "finds"), out = "";
    out += MK.glow(280, 244, 180, P.good, on(t, cOwn, 0.6) * 0.8);
    out += rkRock("granite", 280, 244, 110, 1, { show: 1 });
    out += MK.list(566, 132, [
      { text: "scratch it with a coin", at: cOwn, mark: "tick", markAt: cFinds },
      { text: "drop water on it", at: cOwn == null ? null : cOwn + 0.24, mark: "tick", markAt: cFinds == null ? null : cFinds + 0.18 },
      { text: "look with a hand lens", at: cOwn == null ? null : cOwn + 0.48, mark: "tick", markAt: cFinds == null ? null : cFinds + 0.36 }
    ], t, { lh: 86, cls: "lab big", markR: 22 });
    out += MK.pill(280, 400, "its own properties", on(t, cOwn, 0.5), { size: 26, col: P.gold });
    return out;
  }

  function rkTestingChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? rkTestIntro(t, scene) : k === 1 ? rkScratchPic(t, scene) :
        k === 2 ? rkWaterPic(t, scene) : k === 3 ? rkTablePic(t, scene) :
        k === 4 ? rkLensPic(t, scene) : rkTestSummary(t, scene);
    }
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- where rock comes from ------------------------------------------------------ */

  var RK_CARD = { x: 300, y: 60, w: 520, h: 325 };
  function rkExtractCard(state) {
    return R(RK_CARD.x - 10, RK_CARD.y - 10, RK_CARD.w + 20, RK_CARD.h + 20, 20, P.card, P.line, 2) +
      ART.place(ART.scene("extract", state), RK_CARD.x, RK_CARD.y, RK_CARD.w, RK_CARD.h);
  }
  /* a point of the 320 x 200 drawing, in the film's space */
  function rkCX(v) { return RK_CARD.x + v * RK_CARD.w / 320; }
  function rkCY(v) { return RK_CARD.y + v * RK_CARD.h / 200; }

  function rkFactoryPic(t, scene) {
    var cFactory = sc(scene, 0, "factory"), cDug = sc(scene, 0, "dug"), cEarth = sc(scene, 0, "earth"), out = "";
    /* The factory stands from the chapter's first frame - gating it on the word
       "factory" left the stage empty for the first second of the chapter - and
       the cross lands on the word. */
    var fo = into(t, scene.first);
    out += G(Em(306, 236, 190, "\u{1F3ED}"), { opacity: fo });
    out += MK.cross(306, 236, 76, popIn(t, cFactory == null ? null : cFactory + 0.55, 0.4));
    out += MK.pill(306, 386, "not made in a factory", on(t, cFactory, 0.4), { size: 26, col: P.bad, ink: P.muted });
    /* dug out: the ground, and a pick striking the rock in it */
    var go = on(t, cDug, 0.45);
    if (go > 0) {
      var gx = 640, gy = 168, gw = 434, gh = 214;
      out += G(R(gx, gy, gw, 26, 0, P.grass) + R(gx, gy + 26, gw, 46, 0, "#6B4A2B") + R(gx, gy + 72, gw, gh - 72, 0, "#5B5D63") +
        rkRock("granite", gx + 128, gy + 146, 48, 1, { show: 1 }) +
        rkRock("sandstone", gx + 300, gy + 132, 42, 1, { show: 1 }) +
        R(gx, gy, gw, gh, 14, "none", P.line, 3), { opacity: go });
      /* the swing carries the head down INTO the soil: it stopped at -4 degrees
         before, so the pick waved above ground it never struck */
      var sw = cDug == null ? 0 : Math.max(0, Math.sin((t - cDug) * 5.4));
      out += G(Em(0, 0, 74, "⛏️"), { transform: "translate(" + n2(gx + 96) + "," + n2(gy - 10) + ") rotate(" + n2(-34 + 48 * sw) + ")", opacity: go });
      out += MK.pill(gx + gw / 2, 412, "dug out of the Earth", on(t, cEarth, 0.4), { size: 26, col: P.gold });
    }
    return out;
  }

  /* how wide MK.pill draws a word, so a line can start at its left edge and
     nothing runs off the right of the 1168 box */
  function rkPillW(text, size) { return String(text).length * size * 0.56 + size * 1.3; }
  /* A caption to the right of the card, with a line to the thing it names. The
     line is KEPT once it is drawn, gold while its words are being said and
     faint afterwards: two of these chapters name their second and third thing
     about a third of a second apart, and a 0.7 s line that only the newest row
     owned was wiped off the card before it ever reached its target. */
  function rkRightLabel(t, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 22;
    return G(MK.leader(1004 - rkPillW(text, size) / 2 - 8, y, to[0], to[1], on(t, at, 0.4), now ? P.gold : P.muted),
      { opacity: now ? 1 : 0.32 }) +
      MK.pill(1004, y, text, Math.min(1, o), { size: size, col: now ? P.gold : P.line });
  }

  function rkPlacePic(t, scene, k) {
    var state = k - 1, out = rkExtractCard(state);
    var c = function (name) { return sc(scene, k, name); };
    var spec = [
      { name: "quarry", at: c("quarry"), rows: [["a huge open pit", c("pit"), [rkCX(120), rkCY(124)]], ["cut and blasted out", c("cut"), [rkCX(74), rkCY(74)]], ["carried away in blocks", c("blocks"), [rkCX(238), rkCY(132)]]] },
      { name: "mine", at: c("mine"), rows: [["tunnels underground", c("deep"), [rkCX(70), rkCY(95)]], ["miners with lamps", c("lamps"), [rkCX(226), rkCY(132)]], ["they dig the rock out", c("dig"), [rkCX(98), rkCY(128)]]] },
      { name: "riverbed", at: c("riverbed"), rows: [["water wore the rock", c("worn"), [rkCX(160), rkCY(108)]], ["into smooth pebbles", c("pebbles"), [rkCX(240), rkCY(166)]]] }
    ][state];
    out += MK.pill(146, 122, spec.name, on(t, spec.at, 0.4), { size: 32, col: P.gold });
    var newest = -1;
    spec.rows.forEach(function (row, n) { if (row[1] != null && t >= row[1]) newest = n; });
    spec.rows.forEach(function (row, n) {
      out += rkRightLabel(t, 134 + n * 106, row[0], row[1], row[2], n === newest);
    });
    return out;
  }

  /* "The smooth pebbles and gravel are scooped out": pebbles leave the river
     and pile up beside it, and the pile is still there when the line ends */
  function rkScoopPic(t, scene) {
    var cSmooth = sc(scene, 4, "smooth"), cGravel = sc(scene, 4, "gravel"), cScoop = sc(scene, 4, "scooped");
    var out = rkExtractCard(2), hx = 1004, hy = 318;
    out += MK.pill(146, 122, "riverbed", 1, { size: 32, col: P.line, ink: P.muted });
    out += rkRightLabel(t, 118, "smooth pebbles", cSmooth, [rkCX(240), rkCY(166)], cGravel == null || t < cGravel);
    /* "gravel" names the heap directly under it, so it needs no line and
       cannot cross the one above */
    out += MK.pill(hx, 216, "gravel", on(t, cGravel, 0.4), { size: 22, col: P.gold });
    var so = on(t, cGravel, 0.4);
    if (so > 0) {
      /* the heap they are scooped into, standing on the ground */
      out += L(hx - 118, hy + 45, hx + 118, hy + 45, "#63636A", 4, { opacity: so });
      out += Pth("M" + n2(hx - 96) + "," + n2(hy + 44) + " q" + n2(96) + "," + n2(-74) + " " + n2(192) + ",0 Z", "#9A9A9E", "#63636A", 3, { opacity: so });
      for (var k = 0; k < 5; k++) {
        var x0 = rkCX(80 + k * 44), y0 = rkCY(168 - (k % 2) * 12);
        var x1 = hx - 62 + k * 30, y1 = hy + 30 - (k % 2) * 16;
        var born = (cGravel == null ? cScoop : cGravel) + k * 0.20, u = clamp((t - born) / 0.7, 0, 1);
        if (t < born) continue;
        var x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(Math.PI * u) * 92;
        out += E(x, y, 15, 9, "#C6C6CA", "#7C7C83", 2);
      }
      out += MK.pill(hx, hy + 102, "scooped out", on(t, cScoop, 0.4), { size: 22, col: P.gold });
    }
    return out;
  }

  function rkWhereChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? rkFactoryPic(t, scene) : k === 4 ? rkScoopPic(t, scene) : rkPlacePic(t, scene, k);
    }
    return svg(crossfade(t, i, scene, draw));
  }

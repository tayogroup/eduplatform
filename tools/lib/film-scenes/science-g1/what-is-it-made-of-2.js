
  /* ==== What Is It Made Of?, part 2: "Seven materials" and "Testing materials" */

  /* ==== chapter: Seven materials =============================================
     The lesson's explore step: a card for each of its seven materials, holding
     the thing the lesson makes of it (chair, spoon, bottle, window, stone wall,
     book, T-shirt), turned up as each material is named. Then "material" is not
     just cloth: the word spans all seven. Then the seven things go back into a
     room, where each is labelled with its material. */
  var SEVEN = [
    { cue: "wood", mat: "wood", pic: PIC.chair, obj: "chair", room: [575, 290, 150], lab: [575, 404] },
    { cue: "metal", mat: "metal", pic: PIC.spoon, obj: "spoon", room: [880, 222, 70], lab: [880, 152] },
    { cue: "plastic", mat: "plastic", pic: PIC.bottle, obj: "bottle", room: [650, 120, 84], lab: [650, 46] },
    { cue: "glass", mat: "glass", pic: PIC.window, obj: "window", room: [162, 132, 156], lab: [162, 250] },
    { cue: "rock", mat: "rock", pic: PIC.rock, obj: "stone wall", room: [1062, 372, 116], lab: [1062, 286] },
    { cue: "paper", mat: "paper", pic: PIC.book, obj: "book", room: [518, 128, 76], lab: [518, 46] },
    { cue: "fabric", mat: "fabric", pic: PIC.tshirt, obj: "T-shirt", room: [340, 104, 110], lab: [340, 196] }
  ];
  var SV = { y: 252, w: 148, h: 210, x0: 98, dx: 162 };
  function svX(k) { return SV.x0 + SV.dx * k; }

  /* a room: a wall, a floor, a shelf, a little table and a peg */
  function sevenRoom() {
    var wood = "#8A6443", dark = "#5E4330";
    return R(12, 4, 1144, 324, 22, P.cell, P.line, 3) +
      R(12, 330, 1144, 104, 16, "#0E2233", P.line, 3) +
      R(452, 162, 256, 12, 5, wood, dark, 2) + Pth("M474,174 L474,198 L498,174 Z", dark) + Pth("M686,174 L686,198 L662,174 Z", dark) +
      R(798, 254, 164, 13, 5, wood, dark, 2) + L(814, 267, 814, 331, dark, 7) + L(946, 267, 946, 331, dark, 7) +
      /* the peg, and the hanger the T-shirt hangs from */
      Pth("M340,52 L340,64 M300,82 L340,64 L380,82", null, P.muted, 4) + C(340, 50, 7, P.muted);
  }

  /* how far card k is dimmed while "material" means only cloth */
  function sevenDim(t, k, clothAt, sciAt) {
    return k === 6 ? 1 : 1 - 0.72 * on(t, clothAt, 0.4) * (1 - on(t, sciAt == null ? null : sciAt + 0.1 * k, 0.35));
  }
  function sevenLift(t, k, sevenAt, clothAt, sciAt) {
    return 1 + 0.07 * bump(t, sevenAt == null ? null : sevenAt + k * 0.1, 0.5) +
      (k === 6 ? 0.06 * on(t, clothAt, 0.4) * (1 - on(t, sciAt, 0.4)) : 0);
  }

  function wmSeven(scene, beat, t, i) {
    var b = scene.first, out = "", cards = "";
    var cues = SEVEN.map(function (s) { return sc(scene, 0, s.cue); });
    var sevenAt = sc(scene, 1, "seven"), everyAt = sc(scene, 1, "every");
    var matAt = sc(scene, 2, "material"), clothAt = sc(scene, 2, "cloth"), sciAt = sc(scene, 2, "science"), anyAt = sc(scene, 2, "anything");
    var lookAt = sc(scene, 3, "look"), almostAt = sc(scene, 3, "almost"), sevAt = sc(scene, 3, "seven");
    /* the cards' frames and words go quickly; the room comes in as the things fly into it */
    var roomU = scene.beats.length > 3 ? into(t, b + 3) : 0;
    var roomO = on(t, lookAt == null ? null : lookAt + 0.2, 1.0);

    if (roomO > 0) out += G(sevenRoom(), { opacity: roomO });

    /* "material": only cloth, then all seven */
    var wo = on(t, matAt, 0.45);
    if (wo > 0) cards += Tx(584, 66, "material", "lab huge", "middle", { opacity: wo, transform: "translate(0," + n2((1 - wo) * 10) + ")" });
    var cl = on(t, clothAt, 0.4) * (1 - on(t, sciAt, 0.3));
    if (cl > 0) {
      cards += G(MK.leader(700, 52, 1018, 116, on(t, clothAt, 0.45), P.gold), { opacity: cl }) +
        MK.pill(svX(6), SV.y - SV.h / 2 - 24, "cloth", cl, { size: 22, col: P.gold, fill: P.card, ink: P.gold });
    }
    var br = on(t, sciAt == null ? null : sciAt + 0.2, 0.7);
    if (br > 0) {
      var x0 = svX(0), x1 = svX(6), mid = 584, yb = 108, reach = lerp(0, x1 - mid, br);
      cards += G(L(mid, 82, mid, yb, P.gold, 4) + L(mid - reach, yb, mid + reach, yb, P.gold, 4) +
        SEVEN.map(function (s, k) { var x = svX(k); return Math.abs(x - mid) <= reach + 1 ? L(x, yb, x, SV.y - SV.h / 2 - 6, P.gold, 4) : ""; }).join(""),
        { opacity: Math.min(1, br * 1.4) });
    }

    /* the cards */
    for (var k = 0; k < SEVEN.length; k++) {
      var p = popIn(t, cues[k], 0.4);
      if (p <= 0) continue;
      var s = SEVEN[k], cx = svX(k), top = SV.y - SV.h / 2;
      var next = k + 1 < SEVEN.length ? cues[k + 1] : cues[k] + 0.9;
      var now = next != null && t < next;
      var wb = 1 + 0.22 * bump(t, anyAt == null ? null : anyAt + k * 0.1, 0.55);
      var lit = everyAt != null && t >= everyAt ? on(t, everyAt, 0.4) * (0.5 + 0.5 * breathe(t + k * 0.3)) : 0;
      cards += G((now ? R(cx - SV.w / 2 - 6, top - 6, SV.w + 12, SV.h + 12, 24, "none", "rgba(244,201,93,0.28)", 6) : "") +
        R(cx - SV.w / 2, top, SV.w, SV.h, 18, now ? P.card : P.tealSoft, now ? P.gold : P.teal, 3 + 2.5 * lit) +
        Tx(cx, top + 138, s.obj, "lab mid", "middle") +
        G(Tx(cx, top + 186, s.mat, "lab big gold", "middle"), { transform: around(cx, top + 176, wb) }),
        { opacity: Math.min(1, p) * sevenDim(t, k, clothAt, sciAt), transform: around(cx, SV.y, Math.min(p, 1.1) * sevenLift(t, k, sevenAt, clothAt, sciAt)) });
    }
    var sv = on(t, sevenAt, 0.45);
    if (sv > 0) cards += Tx(584, 414, "7 materials", "lab huge gold", "middle", { opacity: sv, transform: "translate(0," + n2((1 - sv) * 10) + ")" });
    if (roomU < 1) out += G(cards, { opacity: 1 - roomU });

    /* the seven things: in their cards, then flying to their places in the room */
    for (var j = 0; j < SEVEN.length; j++) {
      var pj = popIn(t, cues[j], 0.4);
      if (pj <= 0) continue;
      var sj = SEVEN[j], f = on(t, lookAt == null ? null : lookAt + j * 0.07, 1.1);
      var px = lerp(svX(j), sj.room[0], f), py = lerp(SV.y - SV.h / 2 + 64, sj.room[1], f), size = lerp(84, sj.room[2], f);
      var sc0 = Math.min(pj, 1.1) * lerp(sevenLift(t, j, sevenAt, clothAt, sciAt), 1, f);
      out += G(MK.pic(px, py, size, sj.pic), { opacity: Math.min(1, pj) * lerp(sevenDim(t, j, clothAt, sciAt), 1, f), transform: around(px, py, sc0) });
    }

    /* the room's labels, as "almost everything" is said */
    if (roomU > 0) {
      for (var m = 0; m < SEVEN.length; m++) {
        var lo = popIn(t, almostAt == null ? null : almostAt + m * 0.2, 0.35);
        if (lo <= 0) continue;
        var lb = 1 + 0.12 * bump(t, sevAt == null ? null : sevAt + m * 0.08, 0.5);
        out += G(MK.pill(SEVEN[m].lab[0], SEVEN[m].lab[1], SEVEN[m].mat, 1, { size: 24, col: P.gold, fill: P.card, ink: P.gold }),
          { transform: around(SEVEN[m].lab[0], SEVEN[m].lab[1], Math.min(lo, 1.1) * lb), opacity: Math.min(1, lo) });
      }
    }
    return svg(out);
  }

  /* ==== chapter: Testing materials ============================================
     The lesson's material tester: its test buttons (science.css .tests, teal
     until used on this material), the material in its box doing what the
     lesson makes it do (the press squashes it, the bend bends it, the water
     falls on it), and a badge for the property each test finds. The sponge
     first; then the metal spoon beside it, which does not squash, does not
     bend, and lets the water run off. */
  var TB = [
    { id: "press", pic: PIC.press, label: "Press it", w: 176 },
    { id: "bend", pic: PIC.bend, label: "Bend it", w: 164 },
    { id: "water", pic: PIC.drop, label: "Pour water on it", w: 286 }
  ];
  (function () { var x = (1168 - (176 + 164 + 286 + 36)) / 2; TB.forEach(function (b) { b.x = x + b.w / 2; x += b.w + 18; }); })();
  var TS = { top: 90, h: 226, w: 500, y: 206, size: 128, badgeY: 376, btnY: 14 };
  var SPONGE_BADGES = ["soft", "bendy", "soaks up water"], SPOON_BADGES = ["hard", "stiff", "waterproof"];

  /* the tester's button: teal with its darker step under it, or ghost once used */
  function testButton(b, t, ghost, tapAt, o) {
    var down = 3 * bump(t, tapAt, 0.35), x = b.x - b.w / 2, y = TS.btnY + down, out = "";
    if (ghost) out += R(x, y, b.w, 52, 16, "rgba(255,255,255,0.07)", P.line, 1.5);
    else out += R(x, TS.btnY + 5, b.w, 52, 16, "#1E8C86") + R(x, y, b.w, 52, 16, P.teal);
    out += Em(x + 30, y + 26, 26, b.pic) + Tx(x + 52, y + 34, b.label, "lab", "start", { fill: ghost ? P.ink : "#06231F" });
    var ring = bump(t, tapAt, 0.6);
    if (ring > 0) out += R(x - 6, TS.btnY - 6, b.w + 12, 66, 20, "none", P.gold, 4, { opacity: ring });
    return G(out, { opacity: o });
  }

  /* one box of the tester, with its name tag; kids = what is inside it */
  function testBox(cx, label, edge, kids) {
    var x = cx - TS.w / 2, tw = label.length * 19 * 0.56 + 28;
    return R(x, TS.top, TS.w, TS.h, 22, P.cell, edge || P.line, edge ? 3.5 : 2) + kids +
      R(x + 14, TS.top + 12, tw, 36, 18, "rgba(0,0,0,0.35)") + Tx(x + 14 + tw / 2, TS.top + 37, label, "lab mid", "middle");
  }

  /* badges under a box: those found so far, over dashed places for the rest */
  function badgeRow(cx, texts, ats, t, slots, bumpAt) {
    var ws = texts.map(wmBadgeW), total = ws.reduce(function (a, c) { return a + c; }, 0) + 14 * (texts.length - 1);
    var x = cx - total / 2, out = "";
    texts.forEach(function (tx, k) {
      var bx = x + ws[k] / 2, p = popIn(t, ats[k], 0.35);
      if (slots > 0 && p <= 0) out += R(x, TS.badgeY - 23, ws[k], 46, 23, "none", P.line, 2.5, { opacity: slots, "stroke-dasharray": "8 7" });
      var bb = 1 + 0.12 * bump(t, bumpAt == null ? null : bumpAt + k * 0.12, 0.5);
      out += G(wmBadge(bx, TS.badgeY, tx, p), { transform: around(bx, TS.badgeY, bb) });
      x += ws[k] + 14;
    });
    return out;
  }

  /* Water poured on: drops fall from y0 to y1 across x0..x1, one every 0.22 s
     from `at` until `until`. Soaked up, a drop ends where it lands; run off, it
     slides away to the side and falls. XS is a fixed scatter, not a random one. */
  function dropsOn(t, at, until, x0, x1, y0, y1, runoff) {
    if (at == null || t < at) return "";
    var out = "", XS = [0.18, 0.62, 0.38, 0.84, 0.28, 0.72, 0.5, 0.1, 0.9], every = 0.22, fall = 0.42;
    for (var k = 0; k < 40; k++) {
      var st = at + k * every;
      if (st > until) break;
      var u = (t - st) / fall;
      if (u < 0) break;
      var xs = XS[k % XS.length], x = lerp(x0, x1, xs);
      if (u <= 1) out += wmDrop(x, lerp(y0, y1, u * u), 9, null, 1);
      else if (runoff) {
        var v = (u - 1) * fall / 0.5, side = xs < 0.5 ? -1 : 1;
        if (v < 1) out += wmDrop(x + side * 70 * v, y1 + 10 * v + 60 * v * v, 8, null, 1 - v * 0.6);
      }
    }
    return out;
  }

  /* two arrows curling down at the ends of a thing centred on (cx, cy): a bend */
  function bendArrows(cx, cy, half, u, o, r) {
    if (!(u > 0) || !(o > 0)) return "";
    r = r || 62;
    return G(wmArc(cx - half, cy + r * 0.65, r, -Math.PI * 0.62, -Math.PI * 0.98, u, P.gold, 7) +
      wmArc(cx + half, cy + r * 0.65, r, -Math.PI * 0.38, -Math.PI * 0.02, u, P.gold, 7), { opacity: o });
  }

  function wmTesting(scene, beat, t, i) {
    var b = scene.first, out = "";
    var testAt = sc(scene, 0, "test"), eachAt = sc(scene, 0, "each"), propAt = sc(scene, 0, "property");
    var pressAt = sc(scene, 1, "press"), squashAt = sc(scene, 1, "squash"), softAt = sc(scene, 1, "soft");
    var bendAt = sc(scene, 2, "bend"), bendsAt = sc(scene, 2, "bends");
    var wetAt = sc(scene, 3, "wet"), soaksAt = sc(scene, 3, "soaks");
    var spoonAt = sc(scene, 4, "spoon"), hardAt = sc(scene, 4, "hard"), stiffAt = sc(scene, 4, "stiff"), waterAt = sc(scene, 4, "water");
    var everyAt = sc(scene, 5, "every"), lotsAt = sc(scene, 5, "lots");
    var spoonOn = spoonAt != null && t >= spoonAt, allOn = everyAt != null && t >= everyAt;

    /* the sponge's box in the middle, moving left to make room for the spoon's */
    var slide = on(t, spoonAt, 0.8), ax = lerp(584, 296, slide), bx = 872;

    /* the buttons: teal until used on this material, then ghost; teal again for the spoon */
    var taps = [[pressAt, hardAt], [bendAt, stiffAt], [wetAt, waterAt]];
    TB.forEach(function (bt, k) {
      var o = on(t, eachAt == null ? null : eachAt + k * 0.15, 0.35);
      if (o <= 0) return;
      var sp = taps[k][0], mt = taps[k][1];
      var ghost = spoonOn ? (mt != null && t >= mt + 0.2) : (sp != null && t >= sp + 0.2);
      out += testButton(bt, t, ghost, mt != null && t >= mt ? mt : sp, o);
    });

    /* the sponge */
    var ap = popIn(t, testAt, 0.45);
    if (ap > 0) {
      /* the press lets go inside its own line; the bend, said late in its line,
         holds until the next test starts and straightens as that one begins */
      var sq = on(t, squashAt, 0.45) * (1 - on(t, softAt == null ? null : softAt + 0.6, 0.35));
      var bd = on(t, bendsAt, 0.5) * (1 - on(t, BEATS[b + 3].start - 0.1, 0.3));
      var wet = on(t, soaksAt, 0.6);
      var tf = wmMix(wmMix({}, { sx: 1.15, sy: 0.7 }, sq), { rot: -25, skew: 18 }, bd);
      tf.dy = 8 * wet;
      var bottom = TS.y + TS.size * 0.48, inner = "";
      /* squashed about its bottom, so it stays on the floor of the box; bent about its middle */
      inner += wmShaped(ax, TS.y, TS.size, PIC.sponge, tf, ax, lerp(bottom, TS.y, bd),
        { style: "filter:brightness(" + n3(1 - 0.24 * wet) + ") saturate(" + n3(1 + 0.25 * wet) + ")" });
      /* press: the arrow waits above it, then pushes it down */
      var pa = on(t, pressAt == null ? null : pressAt + 0.15, 0.4) * (1 - on(t, softAt == null ? null : softAt + 0.6, 0.3));
      if (pa > 0) {
        var tipY = lerp(TS.y - TS.size * 0.5 - 6, bottom - TS.size * 0.7 - 4, sq);
        inner += G(MK.arrow(ax, tipY - 46, ax, tipY, 1, P.gold, 9), { opacity: pa });
      }
      var ba = on(t, bendAt == null ? null : bendAt + 0.15, 0.45) * (1 - on(t, BEATS[b + 3].start - 0.1, 0.3));
      inner += bendArrows(ax, TS.y, 96, ba, Math.min(1, ba * 1.5));
      /* water: drops fall onto it and are soaked up */
      inner += dropsOn(t, wetAt == null ? null : wetAt + 0.25, soaksAt == null ? t : soaksAt + 0.9, ax - 44, ax + 44, TS.top + 16, TS.y - 42, false);
      out += G(testBox(ax, "sponge", spoonOn ? null : P.gold, inner),
        { transform: around(ax, TS.top + TS.h / 2, Math.min(ap, 1.08)), opacity: Math.min(1, ap) });
      out += badgeRow(ax, SPONGE_BADGES, [softAt, bendsAt == null ? null : bendsAt + 0.5, soaksAt == null ? null : soaksAt + 0.4], t,
        on(t, propAt, 0.4), lotsAt);
    }

    /* the metal spoon: pressed, bent and wetted, and it does not change */
    var bo = on(t, spoonAt == null ? null : spoonAt + 0.3, 0.6);
    if (bo > 0) {
      var inB = "";
      var shake = 2.5 * Math.sin((t - (hardAt || 0)) * 40) * bump(t, hardAt == null ? null : hardAt + 0.3, 0.3);
      inB += G(MK.pic(bx, TS.y, 120, PIC.spoon), { transform: "translate(0," + n2(shake) + ")" });
      var pb = on(t, hardAt == null ? null : hardAt - 0.05, 0.25) * (1 - on(t, stiffAt == null ? null : stiffAt - 0.05, 0.25));
      if (pb > 0) {
        var push = on(t, hardAt == null ? null : hardAt + 0.15, 0.2);
        inB += G(MK.arrow(bx, TS.y - 108 + 14 * push, bx, TS.y - 58 + 14 * push, 1, P.gold, 9), { opacity: pb });
      }
      var bb = bump(t, stiffAt == null ? null : stiffAt - 0.05, 0.9);
      inB += bendArrows(bx, TS.y, 90, Math.min(1, bb * 2), bb);
      inB += dropsOn(t, waterAt == null ? null : waterAt - 0.1, waterAt == null ? t : waterAt + 1.4, bx - 40, bx + 40, TS.top + 16, TS.y - 38, true);
      out += G(testBox(bx, "metal spoon", allOn ? null : P.gold, inB),
        { transform: around(bx, TS.top + TS.h / 2, lerp(0.92, 1, bo)), opacity: bo });
      out += G(badgeRow(bx, SPOON_BADGES, [hardAt == null ? null : hardAt + 0.3, stiffAt == null ? null : stiffAt + 0.3, waterAt == null ? null : waterAt + 0.5], t, 0, lotsAt), { opacity: bo });
    }

    /* "Every material": both boxes light */
    var ev = on(t, everyAt, 0.45);
    if (ev > 0) {
      out += R(ax - TS.w / 2 - 8, TS.top - 8, TS.w + 16, TS.h + 16, 28, "none", P.accent, 4, { opacity: ev * (0.55 + 0.35 * breathe(t)) }) +
        R(bx - TS.w / 2 - 8, TS.top - 8, TS.w + 16, TS.h + 16, 28, "none", P.accent, 4, { opacity: ev * (0.55 + 0.35 * breathe(t + 0.4)) });
    }
    return svg(out);
  }

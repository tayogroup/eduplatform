
  /* ==== Our Earth, Our Sun, part 2: "Mostly water" and "Under the ground" ====== */

  /* ==== Mostly water ============================================================
     The lesson's globe, then its experiment: the globe is caught ten times, it
     spins as the globeCatch sim spins it (137 degrees a catch), and the finger
     lands where the lesson says it did - on water or on land, for real: the
     point under the fingertip is turned with the land, so a "land" catch is
     always on green. The tally fills as it goes, then sorts itself: 7 and 3. */
  var EO_WG = { x: 40, y: 4, s: 396 };                  /* disk centre (238, 202), radius 148.5: room under it for "mostly water" */
  var EO_W_SEA = [250, 150], EO_W_LAND = [222, 104];   /* where the key points: open sea, and inside a land (measured) */
  var EO_LANDINGS = ["water", "water", "land", "water", "water", "water", "land", "water", "land", "water"];   /* science.js globeCatch.LANDINGS */
  /* Where each catch's fingertip lands, in the drawing's own (unturned) space.
     Measured against the lesson's globe (isPointInFill on its land): each is of
     the kind the lesson says, at least 22 units from any coast, and - once the
     globe is turned 137 degrees a catch - clear of the clouds, which do not
     turn, and 40 units from every earlier landing, so the finger moves about. */
  var EO_CATCH_PTS = [[150, 175], [170, 195], [115, 120], [200, 155], [155, 185], [155, 240], [130, 105], [235, 155], [110, 125], [200, 245]];
  var EO_ROW = { water: 84, land: 190 }, EO_DOT_Y = 300;

  /* When each catch lands: from just after "Catch a globe" to just before the
     next line stops, so all ten are caught before "Seven catches" is said. The
     fifth lands as "look under your finger" is said and is held there, so there
     is a finger to look under; four go before it, and five after. */
  function eoCatches(scene) {
    var a = sc(scene, 2, "catch"), F = sc(scene, 3, "finger");
    if (a == null) return null;
    var t0 = a + 0.5, t1 = spokenEnd(scene.first + 3) - 0.4, out = [], k;
    var f = clamp(F == null ? lerp(t0, t1, 0.45) : F - 0.1, t0 + 2.4, t1 - 2.4);
    var before = [0, 0.27, 0.52, 0.76, 1];
    for (k = 0; k < 5; k++) out.push(lerp(t0, f, before[k]));
    for (k = 0; k < 5; k++) out.push(lerp(f + 1.5, t1, k / 4));
    return out;
  }
  function eoSpin(plan, k) { return Math.min(0.4, 0.6 * (k ? plan[k] - plan[k - 1] : 0.7)); }
  function eoDotX(slot) { return 570 + slot * 56 + (slot >= 7 ? 34 : 0); }

  function sceneWater(scene, beat, t, i) {
    var W = EO_WG, out = "", plan = eoCatches(scene);
    /* the throw: each catch spins the globe on by 137 degrees, with a little hop */
    var turn = 0, hop = 0, last = -1;
    if (plan) for (var k = 0; k < 10; k++) {
      var sp = eoSpin(plan, k);
      turn += 137 * inAt(t, plan[k] - sp, sp);
      hop += bump(t, plan[k] - sp, sp);
      if (t >= plan[k]) last = k;
    }
    var gy = W.y - 24 * hop, cx = W.x + W.s / 2, cy = gy + W.s / 2, rad = W.s * 0.375;

    /* "Look at Earth": it comes a little closer */
    var look = 0.9 + 0.1 * on(t, sc(scene, 0, "look"), 1.0);
    /* "Most of it is blue", and at the end, "mostly water" */
    var blue = eoShow(t, scene, 0, "blue", 0.5), mostly = on(t, sc(scene, 5, "mostly"), 0.6);
    var ring = Math.max(blue * (0.55 + 0.45 * breathe(t)), mostly * (0.7 + 0.3 * breathe(t)));
    var globe = "";
    if (ring > 0) globe += C(cx, cy, rad + 12, "none", P.blue, 10, { opacity: ring }) + MK.glow(cx, cy, rad + 40, P.blue, ring * 0.8);
    /* bare: its square of space would show against the stage's glow */
    globe += ART.place(eoGlobe(turn, "wa", true), W.x, gy, W.s, W.s);
    out += G(globe, { transform: around(cx, cy, look) });
    /* at the foot of the box, so it settles DOWN into place rather than rising from below it */
    out += eoLabel(cx, 418, "mostly water", "lab huge", "middle", mostly,
      { fill: P.blue, transform: "translate(0," + n2(-(1 - Math.min(1, mostly)) * 10) + ")" });

    /* the finger, on the latest catch, until the globe is thrown again */
    if (last >= 0) {
      var next = last + 1 < 10 ? plan[last + 1] - eoSpin(plan, last + 1) : BEATS[scene.first + 4].start + 0.6;
      var fo = Math.min(inAt(t, plan[last], 0.12), 1 - inAt(t, next - 0.12, 0.12));
      var land = EO_LANDINGS[last], pt = EO_CATCH_PTS[last];
      var f = eoGlobePt(W.x, gy, W.s, 137 * (last + 1), pt[0], pt[1]);
      out += MK.ripple(f[0], f[1], t, plan[last], land === "water" ? "#9CC6FF" : "#B6F0A0");
      out += C(f[0], f[1], 9, land === "water" ? EO.ocean : EO.land, P.ink, 3, { opacity: fo }) + MK.finger(f[0], f[1], fo);
      out += C(f[0], f[1], 22, "none", P.gold, 4, { opacity: fo * bump(t, sc(scene, 3, "finger"), 0.9) });
    }

    /* the key, which becomes the tally */
    var keyA = popIn(t, sc(scene, 0, "blue"), 0.4), keyB = popIn(t, sc(scene, 1, "land"), 0.4);
    var isWater = on(t, sc(scene, 1, "water"), 0.4), sea = on(t, sc(scene, 1, "sea"), 0.4);
    var counting = on(t, sc(scene, 2, "q"), 0.4);
    var nWater = 0, nLand = 0;
    if (plan) for (var c = 0; c <= last; c++) { if (EO_LANDINGS[c] === "water") nWater++; else nLand++; }
    var rows = [
      ["water", EO.ocean, keyA, nWater, "seven", 4],
      ["land", EO.land, keyB, nLand, "three", 4]
    ];
    rows.forEach(function (r, n) {
      if (r[2] <= 0) return;
      var y = EO_ROW[r[0]], named = n === 0 ? on(t, sc(scene, 1, "water"), 0.5) : 1;
      var flash = bump(t, sc(scene, 3, r[0]), 1.0);
      /* a row is brightest while it is the one being said */
      var dimmed = n === 0 ? 1 - 0.45 * on(t, sc(scene, 1, "land"), 0.4) * eoUntil(t, scene, 1) : 1;
      /* "blue" gives way to "water": the first goes before the second comes, so
         the two words never lie on top of each other */
      var row = (flash > 0 ? R(540, y - 36, 420, 72, 18, "#1B3A52", P.gold, 3, { opacity: flash }) : "") + C(566, y, 24, r[1], P.ink, 2) +
        (n === 0 ? G(Tx(606, y + 11, "blue", "lab big", "start", { fill: P.blue }), { opacity: 1 - clamp(named * 2, 0, 1) }) : "") +
        G(Tx(606, y + 11, r[0], "lab big", "start") + Em(606 + r[0].length * 18 + 26, y, 30, n === 0 ? "\u{1F4A7}" : "⛰️"), { opacity: n === 0 ? clamp(named * 2 - 1, 0, 1) : 1 });
      if (n === 0 && sea > 0) row += G(Em(622, y + 44, 26, "\u{1F30A}") + Tx(646, y + 52, "the sea", "lab mid muted", "start"), { opacity: sea });
      out += G(row, { opacity: Math.min(1, r[2]) * dimmed, transform: around(566, y, 0.9 + 0.1 * Math.min(r[2], 1.05) + 0.06 * flash) });
      /* the count */
      if (counting > 0) {
        var hit = bump(t, sc(scene, 4, r[4]), 1.0), sayIt = on(t, sc(scene, 4, r[4]), 0.4);
        var box = R(990, y - 38, 112, 76, 18, hit > 0.05 || sayIt > 0 ? "#1B3A52" : P.card, sayIt > 0 ? P.gold : P.line, sayIt > 0 ? 3 : 2);
        var inside = plan && t >= plan[0] - 0.3 ? Tx(1046, y + 16, String(r[3]), "lab huge", "middle", { "font-size": 48 }) : MK.qmark(1046, y, 22, 1);
        out += G(box + inside, { opacity: counting, transform: around(1046, y, 1 + 0.14 * hit) });
      }
    });

    /* the key's lines: blue to the sea, then green to the land */
    var la = on(t, sc(scene, 1, "water"), 0.7), lb = on(t, sc(scene, 1, "land"), 0.7), keyEnd = eoUntil(t, scene, 1);
    if (la > 0) {
      var ps = eoGlobePt(W.x, gy, W.s, 0, EO_W_SEA[0], EO_W_SEA[1]);
      out += G(MK.leader(540, EO_ROW.water, ps[0], ps[1], la, P.blue), { opacity: keyEnd * (1 - 0.65 * lb) });
    }
    if (lb > 0) {
      var pl = eoGlobePt(W.x, gy, W.s, 0, EO_W_LAND[0], EO_W_LAND[1]);
      out += G(MK.leader(540, EO_ROW.land, pl[0], pl[1], lb, P.good), { opacity: keyEnd });
    }

    /* the ten catches, one dot each, filled as they land; on "Seven catches" they
       sort themselves, the seven on water together and the three on land */
    var dots = on(t, sc(scene, 2, "catch"), 0.4);
    if (dots > 0) {
      var sortU = on(t, sc(scene, 4, "seven"), 0.9), w = 0, l = 0;
      for (var j = 0; j < 10; j++) {
        var isW = EO_LANDINGS[j] === "water", slot = isW ? w++ : 7 + l++;
        var x = lerp(eoDotX(j), eoDotX(slot), sortU), got = plan ? popIn(t, plan[j], 0.3) : 0;
        out += C(x, EO_DOT_Y, 20, "none", P.line, 2, { opacity: dots });
        if (got > 0) out += C(x, EO_DOT_Y, 17 * Math.min(got, 1.1), isW ? EO.ocean : EO.land, null, null, { opacity: dots });
      }
      var more = on(t, sc(scene, 5, "more"), 0.5);
      if (more > 0) {
        out += R(eoDotX(0) - 30, EO_DOT_Y - 30, eoDotX(6) - eoDotX(0) + 60, 60, 30, "none", P.blue, 4, { opacity: more });
        out += R(eoDotX(7) - 30, EO_DOT_Y - 30, eoDotX(9) - eoDotX(7) + 60, 60, 30, "none", P.good, 3, { opacity: more * 0.8 });
        out += eoLabel((eoDotX(0) + eoDotX(6)) / 2, EO_DOT_Y + 76, "more water", "lab big", "middle", more, { fill: P.blue });
      }
    }
    return svg(out);
  }

  /* ==== Under the ground ========================================================
     The lesson's dig (SCENES.ground: 0 grass, 1 soil, 2 stones in soil, 3 rock),
     each state arriving as it is named, with the spade's thud. Each layer is
     labelled with the lesson's word as it is said; the one being said is bright
     and the ones before it dim. */
  /* SCENES.ground is 320 x 300. The card is 432 high, not 440, so that the
     spade's thud (the card drops 4 px) never reaches the spoken line below. */
  var EO_GR = { x: 108, y: 4, k: 432 / 300 };
  function eoGr(px, py) { return [EO_GR.x + px * EO_GR.k, EO_GR.y + py * EO_GR.k]; }
  var EO_PICK_Y = [50, 148, 188, 268];                   /* where the lesson draws the spade in each state */

  function sceneGround(scene, beat, t, i) {
    var out = "", K = EO_GR.k, cw = 320 * K;
    var steps = [[1, sc(scene, 0, "dig")], [2, sc(scene, 2, "stones")], [3, sc(scene, 3, "deeper")]];
    var st = 0, from = 0, at = null;
    steps.forEach(function (s) { if (s[1] != null && t >= s[1]) { from = st; st = s[0]; at = s[1]; } });
    var u = at == null ? 1 : inAt(t, at, 0.35);
    var thud = at == null ? 0 : bump(t, at, 0.3);
    var card = ART.place(ART.scene("ground", from), EO_GR.x, EO_GR.y, cw, 300 * K) +
      (u > 0 ? ART.place(ART.scene("ground", st), EO_GR.x, EO_GR.y, cw, 300 * K, 'opacity="' + n2(u) + '"') : "");
    out += G(card, { transform: "translate(0," + n2(thud * 4) + ")" });
    var pick = eoGr(160, EO_PICK_Y[st] - 12);
    if (at != null) out += MK.ripple(pick[0], pick[1], t, at, P.gold);
    out += MK.qmark(pick[0] + 64, 58, 26, eoShow(t, scene, 0, "what", 0.4) * (1 - on(t, sc(scene, 0, "dig"), 0.3)));

    /* "Plants grow in it": a seedling comes up out of the soil */
    var sprout = popIn(t, sc(scene, 1, "plants"), 0.6);
    if (sprout > 0) { var sp = eoGr(272, 60); out += MK.pop(Em(sp[0], sp[1] - 20, 46, "\u{1F331}"), sp[0], sp[1], sprout); }

    /* "The soil runs out": the edge of the soil, where the rock begins */
    var edge = bump(t, sc(scene, 3, "out"), 1.6);
    if (edge > 0) out += G(Pth("M0 164 q40 -10 80 0 t80 0 t80 0 t80 0", null, P.gold, 4 / K), { transform: "translate(" + EO_GR.x + "," + EO_GR.y + ") scale(" + n3(K) + ")", opacity: edge });

    /* the lesson's words, each with its line into the layer */
    var names = [
      { k: 0, at: "grass", text: "grass", y: 100, to: [284, 67] },
      { k: 1, at: "soil", text: "soil", y: 164, to: [290, 112], sub: ["dark", "dark and crumbly"] },
      { k: 2, at: "stones", text: "stones", y: 256, to: [260, 145], sub: ["piece", "a tiny piece of rock"] },
      { k: 3, at: "rock", text: "rock", y: 374, to: [290, 236] }
    ];
    var labels = eoUntil(t, scene, 3), cur = -1;
    names.forEach(function (n, j) { var a = sc(scene, n.k, n.at); if (a != null && t >= a) cur = j; });
    if (labels > 0) names.forEach(function (n, j) {
      var a = sc(scene, n.k, n.at), o = on(t, a, 0.4);
      if (o <= 0) return;
      var bright = j === cur ? 1 : 0.42, p = eoGr(n.to[0], n.to[1]);
      out += G(MK.leader(632, n.y - 10, p[0], p[1], on(t, a, 0.6), j === cur ? P.gold : P.muted), { opacity: labels * (j === cur ? 1 : 0.4) });
      out += G(eoLabel(646, n.y, n.text, "lab huge", "start", o), { opacity: labels * bright });
      if (n.sub) out += G(eoLabel(648, n.y + 34, n.sub[1], "lab mid", "start", on(t, sc(scene, n.k, n.sub[0]), 0.4), { fill: P.gold }), { opacity: labels * bright });
      if (n.k === 2) out += C(p[0], p[1], 26, "none", P.gold, 4, { opacity: labels * o * (j === cur ? 1 : 0) });
    });

    /* "So land is soil on top, and rock underneath" */
    var sum = eoFrom(t, scene, 4) * eoUntil(t, scene, 4);
    if (sum > 0) {
      var every = sc(scene, 4, "every"), glow = every == null ? 0 : on(t, every, 0.4) * (0.55 + 0.45 * breathe(t));
      [["soil", "soil on top", 74, 164, EO.soil], ["rock", "rock underneath", 164, 300, EO.rock]].forEach(function (b) {
        var a = sc(scene, 4, b[0]), o = on(t, a, 0.45);
        if (o <= 0) return;
        var y0 = EO_GR.y + b[2] * K + 4, y1 = EO_GR.y + b[3] * K - 4, bx = EO_GR.x + cw + 18;
        out += G(Pth("M" + n2(bx) + "," + n2(y0) + " q14,0 14,14 V" + n2((y0 + y1) / 2 - 12) + " q0,12 12,12 q-12,0 -12,12 V" + n2(y1 - 14) + " q0,14 -14,14", null, P.gold, 4) +
          Tx(bx + 40, (y0 + y1) / 2 + 14, b[1], "lab huge", "start"), { opacity: sum * o });
        if (glow > 0) out += R(EO_GR.x, y0 - 4, cw, y1 - y0 + 8, 6, "none", P.gold, 3, { opacity: sum * glow * 0.8 });
      });
    }

    /* "A pebble is a small piece of rock. A mountain is a huge piece of rock." */
    var five = eoFrom(t, scene, 5);
    if (five > 0) {
      var peb = sc(scene, 5, "pebble"), mtn = sc(scene, 5, "mountain"), huge = sc(scene, 5, "huge");
      var pp = popIn(t, peb, 0.45), mp = popIn(t, mtn, 0.5);
      out += MK.pop(MK.pic(700, 318, 96, "\u{1FAA8}"), 700, 318, pp) + eoLabel(700, 410, "pebble", "lab big", "middle", on(t, peb, 0.4));
      out += MK.pop(Em(962, 222, 250, "\u{1F3D4}️"), 962, 300, mp) + eoLabel(962, 410, "mountain", "lab big", "middle", on(t, mtn, 0.4));
      var hu = on(t, huge, 0.7);
      if (hu > 0) {
        out += R(EO_GR.x + 3, EO_GR.y + 164 * K + 2, cw - 6, (300 - 164) * K - 5, 6, "none", P.gold, 4, { opacity: hu * (0.6 + 0.4 * breathe(t)) });
        out += MK.leader(648, 326, EO_GR.x + cw - 26, 376, hu, P.gold) + MK.leader(842, 246, EO_GR.x + cw - 26, 266, hu, P.gold);
        out += eoLabel(830, 50, "rock", "lab huge", "middle", on(t, huge, 0.5), { fill: P.gold });
      }
    }
    return svg(out);
  }

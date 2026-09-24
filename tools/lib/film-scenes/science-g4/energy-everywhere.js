  /* ==== Grade 4 Science, Lesson 8: Energy Everywhere ==========================
     tools/lib/film-scenes/science-g4/energy-everywhere.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/energy-everywhere.json.

     The lesson's own pictures, so the child sees here what they tap later: the
     energy hunt's six cards with the lesson's own labels and subtitles, the
     transfers demo's five frames (food, muscle, ball, the wall, the lamp), and
     the bounce experiment drawn by the lesson's OWN sim - ART.sim("energyDrop",
     "draw", n, y), the drawing its "Drop the ball" button steps through, with
     the marked scale on the left and the ball / sound / warmth bars on the
     right that always total 100.

     Energy is never drawn as a substance pouring out of things. The lesson is
     explicit that you cannot hold a handful of it ("things HAVE energy, and it
     is not made of stuff"), so it is shown the three ways the lesson shows it:
     the thing that has it, an arrow for a transfer, and the sim's bars for how
     much went where.

     This file: the palette, the helpers and small drawings every chapter
     shares, the title motif and the chapter "Energy is everywhere". Every
     top-level name starts with ee, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, everywhere: P.gold, nothing: P.blue, rule: P.plum,
    bounce: P.accent, leak: P.gold, chart: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function eeOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function eeFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var EE_SCATTER = [0.22, 0.78, 0.41, 0.63, 0.09, 0.91, 0.35, 0.57, 0.14, 0.86, 0.48, 0.71];

  /* ---- small drawings the chapters share --------------------------------------- */

  /* a card: the dark plate everything on the stage sits on */
  function eeCard(x, y, w, h, lit, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* An elastic band stretched between two fingers, drawn (not the lesson's
     curly-loop emoji) because the film needs it to stretch and snap back.
     u is 0 slack, 1 stretched; wob wobbles it after it is let go. */
  function eeBandPic(cx, cy, size, u, wob) {
    var hw = lerp(size * 0.34, size * 0.78, u), ry = lerp(size * 0.28, size * 0.10, u) + (wob || 0);
    var d = "M" + n2(cx - hw) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy - ry) + " " + n2(cx + hw) + "," + n2(cy) +
      " Q" + n2(cx) + "," + n2(cy + ry) + " " + n2(cx - hw) + "," + n2(cy) + " Z";
    return Pth(d, "none", "#E9744F", Math.max(3, size * 0.09)) +
      C(cx - hw, cy, size * 0.10, "#C68642", "#8B5E2A", 2) +
      C(cx + hw, cy, size * 0.10, "#C68642", "#8B5E2A", 2);
  }

  /* speed streaks behind a thing moving to the right */
  function eeStreaks(x, y, len, o, n) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < (n || 3); k++) {
      var dy = (k - 1) * 20;
      out += L(x - len * (0.5 + 0.5 * EE_SCATTER[k]), y + dy, x, y + dy, P.gold, 4, { opacity: 0.8 * clamp(o, 0, 1) });
    }
    return out;
  }

  /* a word in a pill with a leader line to the thing it names */
  function eeLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return (to ? MK.leader(anchor === "end" ? x + 8 : x - 8, y, to[0], to[1], on(t, at, 0.6), col) : "") +
      MK.pill(x, y, text, o, { size: size || 26, anchor: anchor || "start", col: now ? P.gold : P.line });
  }

  /* the six things of the lesson's energy hunt, in the lesson's own words */
  var EE_HUNT = [
    { pic: "⚽", label: "a moving ball", sub: "movement energy" },
    { pic: null, label: "a stretched band", sub: "stored energy" },
    { pic: "\u{1F50A}", label: "sound", sub: "energy in the air" },
    { pic: "☀️", label: "light", sub: "energy from the Sun" },
    { pic: "\u{1F525}", label: "heat", sub: "energy in warm things" },
    { pic: "\u{1F34E}", label: "food", sub: "stored energy" }
  ];

  /* ==== the title motif ===========================================================
     The lesson's own six energy things in a ring round its own energy symbol.
     In the spoken title chapter the symbol pops on "makes things happen", the
     six appear on "in everything", a hand closes on nothing and is crossed out
     on "cannot hold it", and pulses run out to the six on "what it does". On
     the two cards it simply stands. */
  /* index 1 (the band) is null: it is drawn by eeBandPic below, not the
     curly-loop emoji, for the same reason the hunt card is (see eeBandPic's
     own comment) - this machine's curly loop reads as an abstract squiggle,
     not a stretched band. */
  var EE_RING = [
    "⚽", null, "\u{1F50A}", "☀️", "\u{1F525}", "\u{1F34E}"
  ];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cHappen = sn ? sc(sn, 0, "happen") : null, cEvery = sn ? sc(sn, 0, "every") : null;
    var cHold = sn ? sc(sn, 1, "hold") : null, cDoes = sn ? sc(sn, 1, "does") : null;
    var core = sn ? popIn(t, cHappen, 0.5) : 1;
    var shown = sn ? tally(t, cEvery, 6, 1.1) : 6;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 116, P.gold, core * (0.72 + 0.28 * breathe(t)));

    /* pulses out to the six: what energy DOES */
    var doesU = sn ? on(t, cDoes, 0.9) : 0;
    for (var k = 0; k < 6; k++) {
      if (k >= shown) continue;
      var a = -Math.PI / 2 + k * Math.PI / 3;
      var x = 180 + Math.cos(a) * 126, y = 180 + Math.sin(a) * 126;
      if (doesU > 0) {
        var ph = clamp(doesU * 1.35 - k * 0.06, 0, 1);
        out += L(180 + Math.cos(a) * 62, 180 + Math.sin(a) * 62,
          lerp(180 + Math.cos(a) * 62, x - Math.cos(a) * 26, ph),
          lerp(180 + Math.sin(a) * 62, y - Math.sin(a) * 26, ph), P.gold, 4, { opacity: 0.8 * doesU });
      }
      var ringPic = k === 1 ? eeBandPic(x, y, 50, 1, 0) : MK.pic(x, y, 50, EE_RING[k]);
      out += MK.pop(ringPic, x, y, sn ? popIn(t, cEvery == null ? null : cEvery + k * 0.18, 0.4) : 1);
    }

    /* the energy symbol itself */
    out += MK.pop(Em(180, 180, 112, "⚡"), 180, 180, core);

    /* "you cannot hold it": a hand closes over it, and is crossed out */
    if (sn && cHold != null) {
      var hold = on(t, cHold, 0.4) * (1 - on(t, cDoes, 0.4));
      if (hold > 0) {
        out += G(Em(180, 196, 116, "✋"), { opacity: hold });
        out += MK.cross(180, 180, 66, popIn(t, cHold + 0.3, 0.4) * hold);
      }
    }

    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Six things that have energy around an energy symbol">' + out + "</svg>";
  }

  /* ==== chapter: energy is everywhere ==============================================
     The lesson's energy hunt as its six cards, one lit as it is named and the
     rest dimmed (rule 3). The last beat covers the lesson's own misconception
     line - energy is not only electricity - over the dimmed board. */
  var EE_M = 20, EE_GAP = 14, EE_CW = (1168 - 2 * EE_M - 2 * EE_GAP) / 3, EE_CH = 176, EE_TOP = 8;
  function eeBox(k) {
    var col = k % 3, row = Math.floor(k / 3);
    return { x: EE_M + col * (EE_CW + EE_GAP), y: EE_TOP + row * (EE_CH + EE_GAP), w: EE_CW, h: EE_CH };
  }

  /* when each card is found, and which beat lights it */
  function eeFound(scene) {
    var s3 = sc(scene, 3, "light");
    return [sc(scene, 1, "ball"), sc(scene, 2, "band"), sc(scene, 3, "sound"),
      s3, s3 == null ? null : s3 + 0.45, sc(scene, 4, "food")];
  }
  var EE_ACTIVE = { 1: [0], 2: [1], 3: [2, 3, 4], 4: [5] };

  function eeHuntCard(t, scene, k, beatK, foundAt) {
    var b = eeBox(k), item = EE_HUNT[k], out = "";
    var got = on(t, foundAt[k], 0.4);
    var act = (EE_ACTIVE[beatK] || []).indexOf(k) >= 0 ? got : 0;
    var cx = b.x + b.w / 2, cy = b.y + 64;
    var pop = popIn(t, foundAt[k], 0.45);
    /* "an energy hunt": the six empty places; "Six things": a mark in each */
    var boardO = on(t, sc(scene, 0, "hunt"), 0.55);
    var qShown = Math.max(k < tally(t, sc(scene, 0, "six"), 6, 1.0) ? 1 : 0, eeFrom(t, scene, 1));

    out += eeCard(b.x, b.y, b.w, b.h, act > 0.5, 1);
    if (got < 1) out += MK.qmark(cx, cy, 30, (1 - got) * 0.9 * qShown);
    if (got <= 0) return G(out, { opacity: 0.4 * boardO });

    /* the picture: the lesson's emoji, or the drawn band for the stretched one */
    if (k === 1) {
      var cStored = sc(scene, 2, "stored"), cGo = sc(scene, 2, "go");
      var u = on(t, cStored, 0.5) * (1 - on(t, cGo, 0.22));
      var wob = cGo == null || t < cGo ? 0 : 9 * Math.sin((t - cGo) * 17) * Math.exp(-(t - cGo) * 3.2);
      out += G(eeBandPic(cx, cy, 112, u, wob), { transform: around(cx, cy, Math.min(1, pop)), opacity: Math.min(1, pop) });
      out += MK.ripple(cx, cy, t, cGo, P.gold);
      if (u > 0.2) out += MK.glow(cx, cy, 58, P.gold, u * 0.8);
    } else {
      var shift = 0, streak = 0;
      if (k === 0) {
        var cFast = sc(scene, 1, "faster");
        streak = on(t, cFast, 0.5) * act;
        shift = 26 * streak;
      }
      if (streak > 0) out += eeStreaks(cx + shift - 48, cy, 60, streak);
      out += MK.pop(MK.pic(cx + shift, cy, 84, item.pic), cx, cy, pop);
    }

    /* sound spreading, on its own two cues */
    if (k === 2) {
      var cSound = sc(scene, 3, "sound"), cAir = sc(scene, 3, "air");
      out += MK.waves(cx + 30, cy, t, cSound, { dir: 0, spread: 1.0, n: 3, period: 1.1, reach: 96, col: P.gold });
      out += MK.waves(cx - 30, cy, t, cAir, { dir: Math.PI, spread: 1.0, n: 3, period: 1.1, reach: 96, col: P.gold });
    }
    /* light and heat glow when the Sun is named */
    if (k === 3 || k === 4) {
      var cSun = sc(scene, 3, "sun");
      out += MK.glow(cx, cy, 84, P.gold, on(t, cSun, 0.5) * act * (0.7 + 0.3 * breathe(t)));
    }

    out += Tx(cx, b.y + 126, item.label, "lab big", "middle", { opacity: got });
    out += Tx(cx, b.y + 157, item.sub, "lab mid muted readable", "middle", { opacity: got });
    return G(out, { opacity: 0.42 + 0.58 * got, transform: around(cx, b.y + b.h / 2, act > 0 ? 1 + 0.02 * act : 1) });
  }

  /* the last beat: not only electricity */
  function eeNotOnly(t, scene, o) {
    if (!(o > 0)) return "";
    var cOnly = sc(scene, 5, "only"), cCup = sc(scene, 5, "cup"), cDrum = sc(scene, 5, "drum");
    var out = R(140, 108, 888, 224, 24, P.card, P.gold, 3);
    out += L(452, 140, 452, 300, P.line, 2);
    /* electricity, crossed out: it is one way energy travels, not all of it */
    out += MK.pop(Em(296, 196, 96, "⚡"), 296, 196, popIn(t, cOnly, 0.4));
    out += MK.pill(296, 288, "only electricity", on(t, cOnly, 0.4), { size: 24, col: P.line, ink: P.muted });
    out += L(196, 288, 396, 288, P.bad, 4, { opacity: on(t, cOnly == null ? null : cOnly + 0.35, 0.4) });
    out += MK.cross(356, 152, 24, popIn(t, cOnly == null ? null : cOnly + 0.35, 0.4), P.bad);
    /* a hot cup and a loud drum have it too */
    out += MK.pop(Em(640, 196, 96, "☕"), 640, 196, popIn(t, cCup, 0.4));
    out += MK.pill(640, 288, "a hot cup", on(t, cCup, 0.4), { size: 24, col: P.good });
    out += MK.tick(716, 152, 22, popIn(t, cCup == null ? null : cCup + 0.3, 0.4));
    out += MK.pop(Em(872, 196, 96, "\u{1F941}"), 872, 196, popIn(t, cDrum, 0.4));
    out += MK.pill(872, 288, "a loud drum", on(t, cDrum, 0.4), { size: 24, col: P.good });
    out += MK.tick(948, 152, 22, popIn(t, cDrum == null ? null : cDrum + 0.3, 0.4));
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function eeEverywhereChapter(scene, beat, t, i) {
    var beatK = i - scene.first, foundAt = eeFound(scene), out = "";
    var last = eeOnly(t, scene, 5), grid = 1 - 0.8 * last;

    var cards = "";
    for (var k = 0; k < 6; k++) cards += eeHuntCard(t, scene, k, beatK, foundAt);
    out += G(cards, { opacity: grid });

    /* "Six things": a question mark in each empty card, counted in */
    var cSix = sc(scene, 0, "six");
    out += MK.pill(584, 406, "six things, all with energy", on(t, cSix, 0.4) * eeOnly(t, scene, 0), { size: 26, col: P.gold });
    /* "from the Sun": light and heat together */
    out += MK.pill(584, 406, "light and heat come from the Sun", on(t, sc(scene, 3, "sun"), 0.4) * eeOnly(t, scene, 3), { size: 26, col: P.gold });
    /* "every material": every card flashes */
    var mat = bump(t, sc(scene, 4, "material"), 1.4);
    if (mat > 0) {
      for (var m = 0; m < 6; m++) {
        var bx = eeBox(m);
        out += R(bx.x, bx.y, bx.w, bx.h, 20, "none", P.gold, 4, { opacity: mat * grid });
      }
      out += MK.pill(584, 406, "energy is in every material", mat, { size: 26, col: P.gold });
    }

    out += eeNotOnly(t, scene, last);
    return svg(out);
  }

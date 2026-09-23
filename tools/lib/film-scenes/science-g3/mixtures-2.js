  /* ==== Grade 3 Science, Lesson 8: Mixtures, part 2 ============================
     The two solid/solid separations: the sieve and the magnet. The sieve is the
     lesson kit's own drawing (ART.ICONS.sieve, the picture on the Separator
     button and on the sort step's sieve bin), so the child watches the sieve
     they tap two steps later. The magnet is the lesson's own magnet emoji, the
     one on its magnet bin and in SIMS.separate. */

  /* ---- the kit's sieve, and where its parts sit ------------------------------
     ICONS.sieve draws in a 64 x 64 box: the mesh mouth is the straight line
     y = 28 from x = 6 to x = 46, the bowl is the arc below it, reaching y = 48,
     and the handle runs right from x = 44. Placed at (cx, cy) at `size`, every
     one of those is (v - 32) / 64 * size away from the centre. */
  var MX_SIEVE = { cx: 580, cy: 172, size: 300 };
  function mxSieveGeo(g) {
    var s = g.size;
    return {
      rimY: g.cy + (28 - 32) / 64 * s,
      x0: g.cx + (6 - 32) / 64 * s,
      x1: g.cx + (46 - 32) / 64 * s,
      bowlX: g.cx + (26 - 32) / 64 * s,
      botY: g.cy + (48 - 32) / 64 * s
    };
  }
  /* the sieve itself, tilted `tilt` degrees about its own centre */
  function mxSieve(g, o, tilt) {
    if (!(o > 0)) return "";
    return G(MK.pic(g.cx, g.cy, g.size, ART.ICONS.sieve), {
      opacity: clamp(o, 0, 1),
      transform: tilt ? "rotate(" + n2(tilt) + "," + n2(g.cx) + "," + n2(g.cy) + ")" : null
    });
  }

  /* ==== chapter: the sieve =======================================================
     Beat 0 keeps the bowl of the last chapter and ticks off the two properties
     it just proved. Beat 1 compares the two sizes and brings the sieve in. Beat
     2 shakes it and the sand pours through into a bowl below. Beat 3 lights the
     stones still sitting in the mesh. */
  var MX_LOW = { cx: 552, rimY: 320, rx: 150, depth: 70 };

  function mxSieveChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cKept = c(0, "kept"), cApart = c(0, "apart");
    var cSizes = c(1, "sizes"), cSieve = c(1, "sieve");
    var cShake = c(2, "shake"), cFalls = c(2, "falls");
    var cBig = c(3, "big"), cStay = c(3, "stay"), cSize = c(3, "size");
    var g = mxSieveGeo(MX_SIEVE), out = "";

    /* ---- beat 0: the mixture, and the two properties it kept ----------------
       It stays until the sieve arrives in beat 1, so the child still has the
       mixture in front of them while its two sizes are compared. */
    var srcO = 1 - on(t, cSieve == null ? null : cSieve - 0.35, 0.5);
    if (srcO > 0) {
      var a = "", lit = on(t, cKept, 0.5) * mxOnly(t, scene, 0);
      var inside = mxGrains(330, 206, 140, 30, 26, 26, 7.5, 1, 5, { lit: lit * (0.5 + 0.5 * breathe(t)) });
      inside += mxStone(272, 210, 76, 1, lit * (0.6 + 0.4 * breathe(t)));
      inside += mxStone(348, 196, 88, 1, lit * (0.6 + 0.4 * breathe(t + 0.5)));
      inside += mxStone(408, 218, 66, 1, lit * (0.6 + 0.4 * breathe(t + 1)));
      a += mxBowl(330, 190, 170, 108, 1, inside);
      /* the words of beat 0 go with beat 0; only the mixture itself waits for
         the sieve, so nothing of this beat is left under the size card */
      var w0 = mxOnly(t, scene, 0), b0 = "";
      b0 += MK.pill(556, 128, "fine, it pours", on(t, cKept, 0.45), { size: 26, anchor: "start", col: P.gold });
      b0 += MK.pill(556, 214, "big and hard", on(t, cKept == null ? null : cKept + 0.5, 0.45), { size: 26, anchor: "start", col: P.gold });
      var ap = on(t, cApart, 0.55);
      if (ap > 0) {
        b0 += MK.arrow(330, 330, lerp(330, 176, ap), lerp(330, 392, ap), ap, P.teal, 7);
        b0 += MK.arrow(330, 330, lerp(330, 484, ap), lerp(330, 392, ap), ap, P.teal, 7);
        b0 += MK.pill(700, 330, "get them apart", ap, { size: 26, anchor: "start", col: P.teal });
      }
      a += G(b0, { opacity: w0 });
      out += G(a, { opacity: srcO });
    }

    /* ---- beat 1: two very different sizes ----------------------------------- */
    var szO = on(t, cSizes, 0.5);
    if (szO > 0) {
      var z = "";
      z += R(790, 74, 348, 230, 20, P.card, P.line, 2);
      z += mxStone(872, 164, 136, 1, 0);
      z += Tx(872, 266, "big", "lab big muted", "middle");
      z += mxGrains(1056, 168, 32, 26, 14, 14, 6.5, 1, 17, {});
      z += Tx(1056, 266, "fine", "lab big muted", "middle");
      z += L(964, 104, 964, 274, P.line, 2, { "stroke-dasharray": "8 7" });
      z += MK.pill(964, 344, "different sizes",
        on(t, cSizes == null ? null : cSizes + 0.3, 0.45) * mxSpan(t, scene, 1, 3), { size: 28, col: P.gold });
      out += G(z, { opacity: szO });
    }

    /* ---- beats 1-3: the sieve does the work --------------------------------- */
    var svO = on(t, cSieve, 0.55);
    if (svO > 0) {
      var shakeEnd = cFalls == null ? null : spokenEnd(scene.first + 3) - 0.2;
      var shaking = cShake != null && shakeEnd != null && t > cShake && t < shakeEnd;
      var tilt = shaking ? 4.5 * Math.sin((t - cShake) * 15) : 0;

      /* how much of the sand has gone through */
      var fallSpan = 1.5;
      var poured = cFalls == null ? 0 : clamp((t - cFalls) / fallSpan, 0, 1);
      var held = Math.max(0, Math.round(14 * (1 - poured)));

      /* The kit's sieve is an OPAQUE half disc, so what it holds is drawn on
         TOP of it, resting on the mesh line (g.rimY) - drawn underneath, the
         mixture was invisible and the sieve arrived empty. */
      var inMesh = mxGrains(g.bowlX, g.rimY - 8, (g.x1 - g.x0) * 0.42, 9, 14, held, 6.5, 1, 23, {});
      var stoneLit = on(t, cBig, 0.45) * (0.55 + 0.45 * breathe(t));
      inMesh += mxStone(g.bowlX - 52, g.rimY - 14, 62, 1, stoneLit);
      inMesh += mxStone(g.bowlX + 4, g.rimY - 20, 74, 1, on(t, cBig == null ? null : cBig + 0.25, 0.45) * (0.55 + 0.45 * breathe(t + 0.6)));
      inMesh += mxStone(g.bowlX + 58, g.rimY - 12, 56, 1, on(t, cBig == null ? null : cBig + 0.5, 0.45) * (0.55 + 0.45 * breathe(t + 1.2)));
      out += G(mxSieve(MX_SIEVE, 1, 0) + inMesh, {
        opacity: svO,
        transform: tilt ? "rotate(" + n2(tilt) + "," + n2(MX_SIEVE.cx) + "," + n2(MX_SIEVE.cy) + ")" : null
      });

      /* the bowl below, filling with the sand that got through */
      var lowO = on(t, cSieve == null ? null : cSieve + 0.3, 0.5);
      var caught = cFalls == null ? 0 : tally(t, cFalls + 0.35, 26, fallSpan);
      out += mxBowl(MX_LOW.cx, MX_LOW.rimY, MX_LOW.rx, MX_LOW.depth, lowO,
        mxGrains(MX_LOW.cx, MX_LOW.rimY + 12, MX_LOW.rx * 0.78, 22, 26, caught, 7, 1, 31, {}));
      out += mxFall(t, cFalls, shakeEnd == null ? 0 : shakeEnd - 0.3, g.bowlX, g.botY + 6, MX_LOW.rimY - 8, 46, 9, 6, svO);

      /* the stones stay behind, and that is separation by size */
      var st = on(t, cStay, 0.5);
      if (st > 0) out += G(MK.leader(292, 132, g.bowlX - 52, g.rimY - 14, on(t, cStay, 0.7), P.gold) +
        MK.pill(290, 132, "stones stay", st, { size: 26, anchor: "end", col: P.gold }), { opacity: st });
      out += MK.pill(964, 344, "separated by size", on(t, cSize, 0.45), { size: 28, col: P.teal });
      out += MK.tick(964, 404, 28, popIn(t, cSize == null ? null : cSize + 0.45, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: the magnet ======================================================
     A tray of iron filings mixed into sand, both too small for a sieve. The
     magnet sweeps over and the filings jump up to it; the sand is left. Then the
     lesson's own warning: not every metal is magnetic. */

  var MX_TRAY = { x: 96, y: 214, w: 660, h: 126 };

  /* a steel paperclip, drawn rather than emoji: this machine's paperclip has
     eyes (the brief, rule 5), and the lesson means a plain steel clip */
  function mxClip(cx, cy, s, col) {
    var u = s / 100;
    return G(Pth("M-18,-34 L-18,26 A18,18 0 0 0 18,26 L18,-16 A11,11 0 0 0 -4,-16 L-4,30",
      null, col || "#C6D0DA", 9 * 1), { transform: tr(cx, cy, u) });
  }
  /* a length of copper wire, bent into two waves */
  function mxWire(cx, cy, s) {
    var u = s / 100;
    return G(Pth("M-44,6 C-28,-26 -8,32 8,0 C22,-28 38,18 48,-6", null, "#C9743A", 11) +
      Pth("M-44,6 C-28,-26 -8,32 8,0 C22,-28 38,18 48,-6", null, "#E29B62", 4), { transform: tr(cx, cy, u) });
  }

  function mxMagnetChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFilings = c(0, "filings"), cTiny = c(0, "tiny"), cNoSieve = c(0, "nosieve");
    var cMagnetic = c(1, "magnetic"), cSweep = c(1, "sweep");
    var cJump = c(2, "jump"), cLeft = c(2, "left");
    var cCareful = c(3, "careful"), cSteel = c(3, "steel"), cCopper = c(3, "copper");
    var out = "";

    var A = mxSpan(t, scene, 0, 3), B = mxFrom(t, scene, 3);

    /* ---- beats 0-2: the tray, the sweep, the jump --------------------------- */
    if (A > 0) {
      var a = "", trO = on(t, cFilings, 0.5);
      a += R(MX_TRAY.x, MX_TRAY.y, MX_TRAY.w, MX_TRAY.h, 18, P.cell, P.line, 3, { opacity: trO });

      /* where the magnet is: it enters on "Sweep a magnet" and stops inside the beat */
      var sweepSpan = cSweep == null ? 1 : Math.max(0.7, Math.min(1.7, spokenEnd(scene.first + 1) - cSweep - 0.15));
      var sw = cSweep == null ? 0 : ease((t - cSweep) / sweepSpan);
      var magX = lerp(150, 470, sw), magY = 120;
      var jump = on(t, cJump, 0.55);

      /* the sand grains (they never move) and the iron filings (they do) */
      var lit = on(t, cMagnetic, 0.5);
      var grains = "";
      for (var k = 0; k < 44; k++) {
        var gx = MX_TRAY.x + 30 + mxR(k, 0) * (MX_TRAY.w - 60);
        var gy = MX_TRAY.y + 22 + mxR(k, 1) * (MX_TRAY.h - 44);
        var iron = k % 2 === 0;
        if (!iron) { grains += C(gx, gy, 5 + 2 * mxR(k, 2), k % 4 ? MX_SAND : MX_SAND2); continue; }
        var tx = magX + (mxR(k, 3) * 2 - 1) * 56, ty = magY + 52 + mxR(k, 4) * 22;
        var u = ease(jump - 0.35 * mxR(k, 5));
        var x = lerp(gx, tx, u), y = lerp(gy, ty, u);
        /* a gold RING round each filing, not a gold disc: a filled halo the
           colour of sand made the iron read as more sand */
        if (lit > 0 && u < 0.6) grains += C(x, y, 11, "none", P.gold, 2.5, { opacity: 0.7 * lit * (0.5 + 0.5 * breathe(t + k)) });
        grains += C(x, y, 5.5 + 2 * mxR(k, 2), k % 4 === 0 ? MX_IRON : MX_IRON2);
      }
      a += G(grains, { opacity: trO });

      /* "both tiny": the same grains seen close up */
      var lens = popIn(t, cTiny, 0.45) * (1 - jump);
      if (lens > 0) a += MK.pop(mxLens(946, 108, 84,
        mxGrains(946, 108, 54, 46, 9, 9, 11.5, 1, 41, { cols: [MX_IRON, MX_SAND, MX_IRON2] }), 1, 2.3) +
        MK.pill(946, 216, "the same size", 1, { size: 24, col: P.line, ink: P.muted }), 946, 130, lens);

      /* "A sieve cannot help": the sieve drawn big enough to be read AROUND
         the cross that strikes it out */
      var ns = popIn(t, cNoSieve, 0.45) * (1 - jump);
      if (ns > 0) a += MK.pop(mxSieve({ cx: 946, cy: 336, size: 170 }, 1, 0) +
        MK.cross(946, 336, 54, 1), 946, 336, ns);

      /* the magnet itself */
      if (sw > 0) {
        a += G(MK.pic(magX, magY, 118, "\u{1F9F2}"), { opacity: Math.min(1, sw * 3) });
        if (lit > 0) a += MK.glow(magX, magY + 30, 96, P.gold, 0.5 * lit * (0.5 + 0.5 * breathe(t)));
      }
      if (on(t, cMagnetic, 0.45) > 0 && jump < 0.5)
        a += MK.pill(300, 66, "only the iron is magnetic", on(t, cMagnetic, 0.45), { size: 26, col: P.gold });

      var lf = on(t, cLeft, 0.5);
      if (lf > 0) a += MK.leader(846, 392, 700, MX_TRAY.y + 76, on(t, cLeft, 0.7), P.muted) +
        MK.pill(850, 392, "the sand is left", lf, { size: 26, anchor: "start", col: P.line, ink: P.muted });

      out += G(a, { opacity: A });
    }

    /* ---- beat 3: not every metal is magnetic -------------------------------- */
    if (B > 0) {
      var b = "", sO = on(t, cSteel, 0.5), cO = on(t, cCopper, 0.5);
      /* both card frames rise with the beat itself, so the screen is never
         blank while the voice reaches the first thing it names */
      var frame = Math.min(1, B) * 0.55;
      b += MK.pic(300, 42, 48, "⚠️", { opacity: Math.min(1, B) });
      b += MK.pill(620, 40, "not every metal is magnetic", on(t, cCareful, 0.45), { size: 30, col: P.gold });
      b += R(72, 84, 500, 300, 22, P.card, sO > 0.5 ? P.good : P.line, 3, { opacity: Math.max(frame, sO) });
      b += MK.pop(mxClip(258, 208, 150, "#C6D0DA") + MK.pic(430, 208, 104, "\u{1F9F2}"), 322, 208, popIn(t, cSteel, 0.45));
      b += Tx(322, 320, "steel: magnetic", "lab big", "middle", { opacity: sO });
      b += MK.tick(500, 132, 30, popIn(t, cSteel == null ? null : cSteel + 0.45, 0.4));

      b += R(596, 84, 500, 300, 22, P.card, cO > 0.5 ? P.bad : P.line, 3, { opacity: Math.max(frame, cO) });
      b += MK.pop(mxWire(782, 208, 150) + MK.pic(954, 208, 104, "\u{1F9F2}"), 846, 208, popIn(t, cCopper, 0.45));
      b += Tx(846, 320, "copper wire: not", "lab big", "middle", { opacity: cO });
      b += MK.cross(1024, 132, 30, popIn(t, cCopper == null ? null : cCopper + 0.45, 0.4));
      out += G(b, { opacity: B });
    }
    return svg(out);
  }

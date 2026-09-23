  /* ==== Grade 3 Science, Lesson 8: Mixtures ==================================
     tools/lib/film-scenes/science-g3/mixtures.js, with -2.js, -3.js and -4.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/mixtures.json.

     The lesson's own separate sim draws two emoji and a caption, so the four
     mixtures are drawn here. Where the kit HAS a drawing the film uses it: the
     sieve (ART.ICONS.sieve, the picture on the lesson's own Separator button
     and on its sieve bin), the stones (the rock the lesson's rock emoji becomes),
     the iron nail and the copper wire of its "not every metal is magnetic"
     line, and the beaker of sand and water the kit draws in SIMS.reaction
     ("sand and water: a mixture").

     This file: the palette, the small drawings every chapter shares, the title
     motif and the chapter "What a mixture is". Every top-level name here starts
     with mx, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, mixture: P.gold, sieve: P.blue, magnet: P.plum,
    filter: P.good, dissolve: P.accent, risks: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function mxOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function mxFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 from beat a on, back to 0 as beat b comes in */
  function mxSpan(t, scene, a, b) { return mxFrom(t, scene, a) * (1 - (b < scene.beats.length ? into(t, scene.first + b) : 0)); }

  /* fixed numbers for anything scattered: never Math.random */
  var MX_S = [0.13, 0.71, 0.42, 0.88, 0.27, 0.59, 0.05, 0.94, 0.36, 0.66, 0.19, 0.81,
    0.48, 0.08, 0.77, 0.31, 0.62, 0.22, 0.91, 0.51, 0.03, 0.69, 0.39, 0.85];
  function mxR(k, i) { return MX_S[(k * 5 + i * 7 + 3) % MX_S.length]; }

  /* ---- colours the film's own drawings use ------------------------------------
     The sand is the kit's own sand (SIMS.reaction draws #C9A26B under water);
     the ceramic is the kit's sieve (#DCE5EC on #56687A); the water is the kit's
     blue (#3B7FD1). */
  var MX_SAND = "#D9B87C", MX_SAND2 = "#C9A26B", MX_SAND3 = "#A87F45";
  var MX_IRON = "#5E6874", MX_IRON2 = "#7C8794";
  var MX_SALT = "#F1F5F9", MX_WATER = "#3B7FD1", MX_WATER2 = "#7FC4EA";
  var MX_WARE = "#DCE5EC", MX_WARE_E = "#56687A", MX_WARE_IN = "#C2CFDA";

  /* ---- small drawings every chapter shares ------------------------------------- */

  /* `shown` of n grains scattered in the ellipse (cx, cy, rx, ry) */
  function mxGrains(cx, cy, rx, ry, n, shown, r, o, seed, opt) {
    if (!(o > 0) || !(shown > 0)) return "";
    opt = opt || {};
    var out = "", lit = opt.lit || 0, cols = opt.cols || [MX_SAND, MX_SAND2, MX_SAND3];
    for (var k = 0; k < n && k < shown; k++) {
      var a = mxR(k + seed, 0) * Math.PI * 2, d = Math.sqrt(mxR(k + seed, 1));
      var x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      var rr = r * (0.7 + 0.55 * mxR(k + seed, 2));
      if (lit > 0) out += C(x, y, rr * 2.6, P.gold, null, null, { opacity: 0.4 * lit });
      out += C(x, y, rr, cols[k % cols.length]);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a mound of sand standing on (cx, baseY) */
  function mxHeap(cx, baseY, w, h, o) {
    if (!(o > 0) || !(w > 2) || !(h > 0)) return "";
    var out = Pth("M" + n2(cx - w / 2) + "," + n2(baseY) + " Q" + n2(cx) + "," + n2(baseY - h * 2) +
      " " + n2(cx + w / 2) + "," + n2(baseY) + " Z", MX_SAND, null, null);
    for (var k = 0; k < 9; k++) {
      var u = mxR(k, 3), x = cx + (u * 2 - 1) * w * 0.4;
      var top = baseY - h * 2 * (1 - Math.pow((x - cx) / (w / 2), 2)) * 0.5;
      out += C(x, lerp(top + 4, baseY - 3, mxR(k, 4)), 2.6 + 1.6 * mxR(k, 5), k % 2 ? MX_SAND3 : MX_SAND2);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the lesson's stone (its rock emoji, which the kit draws itself) */
  function mxStone(cx, cy, size, o, ring) {
    if (!(o > 0)) return "";
    return (ring > 0 ? C(cx, cy, size * 0.56, "none", P.gold, 5, { opacity: ring }) : "") +
      MK.pic(cx, cy, size, "\u{1FAA8}", { opacity: clamp(o, 0, 1) });
  }

  /* a ceramic bowl seen from a little above; `inside` is drawn in it */
  function mxBowl(cx, rimY, rx, depth, o, inside) {
    if (!(o > 0)) return "";
    var ry = rx * 0.22;
    var body = "M" + n2(cx - rx) + "," + n2(rimY) + " C" + n2(cx - rx) + "," + n2(rimY + depth * 1.3) +
      " " + n2(cx + rx) + "," + n2(rimY + depth * 1.3) + " " + n2(cx + rx) + "," + n2(rimY) + " Z";
    return G(Pth(body, MX_WARE, MX_WARE_E, 3) +
      E(cx, rimY, rx * 0.97, ry * 0.97, MX_WARE_IN) +
      (inside || "") +
      E(cx, rimY, rx, ry, "none", MX_WARE_E, 3), { opacity: clamp(o, 0, 1) });
  }

  /* grains falling from (x0, y0) to y1 between `from` and `until`, drifting dx */
  function mxFall(t, from, until, x0, y0, y1, dx, n, r, o, cols) {
    if (from == null || !(o > 0) || t < from || t > until + 0.8) return "";
    var out = "", span = 0.62;
    for (var k = 0; k < n; k++) {
      var born = from + k * (span / n);
      if (t < born) continue;
      var cyc = Math.floor((t - born) / span);
      if (born + cyc * span > until) continue;
      var ph = ((t - born) / span) % 1;
      var x = x0 + (mxR(k, 6) * 2 - 1) * dx, y = lerp(y0, y1, ph * ph);
      out += C(x, y, r * (0.75 + 0.5 * mxR(k, 7)), (cols || [MX_SAND, MX_SAND2])[k % 2],
        null, null, { opacity: Math.min(1, ph * 9, (1 - ph) * 5) });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names; the newest is gold */
  function mxLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    return MK.leader(x - 10, y, to[0], to[1], on(t, at, 0.6), now ? P.gold : P.muted) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* A magnifying glass: a lens over (cx, cy) with `inner` drawn only inside it.
     The clip's id is made from where the lens is, so a frame drawn twice writes
     the same markup and two lenses in one frame never share one. */
  function mxLens(cx, cy, r, inner, o, handleA) {
    if (!(o > 0)) return "";
    var id = "mxLens" + Math.round(cx) + "_" + Math.round(cy) + "_" + Math.round(r), a = handleA == null ? 0.85 : handleA;
    return G(C(cx, cy, r, "#0E2434") +
      el("clipPath", { id: id }, C(cx, cy, r - 2)) +
      G(inner || "", { "clip-path": "url(#" + id + ")" }) +
      L(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + 52), cy + Math.sin(a) * (r + 52), "#8A6A3A", 15) +
      C(cx, cy, r, "none", P.gold, 7), { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ================================================================
     A bowl of sand and stones. In the spoken title chapter the sand pours in on
     "sand", the stones drop in on "stones", a gold ring closes round the bowl on
     "a mixture", and on "stays exactly itself" the sand and the stones light in
     turn inside it. On the two cards the bowl simply stands, full. */
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cSand = sc0 ? sc(sc0, 0, "sand") : null, cStone = sc0 ? sc(sc0, 0, "stones") : null;
    var cMix = sc0 ? sc(sc0, 0, "mixture") : null, cStays = sc0 ? sc(sc0, 1, "stays") : null;
    var sandU = sc0 ? tally(t, cSand, 30, 0.9) : 30;
    var stoneU = sc0 ? tally(t, cStone, 4, 0.7) : 4;
    var mix = sc0 ? on(t, cMix, 0.6) : 0, stays = sc0 ? on(t, cStays, 0.7) : 0;

    out += el("clipPath", { id: "mxMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += G(MK.glow(180, 206, 150, P.gold, mix * (0.6 + 0.4 * breathe(t))), { "clip-path": "url(#mxMotifClip)" });

    var inside = mxGrains(180, 208, 104, 30, 30, sandU, 7, 1, 2, { lit: stays * (0.5 + 0.5 * breathe(t)) });
    for (var k = 0; k < 4; k++) {
      if (k >= stoneU) break;
      var sx = 128 + k * 36 + (k % 2) * 8, sy = 196 + (k % 2 ? 14 : -2);
      inside += mxStone(sx, sy, 50, 1, stays * (0.5 + 0.5 * breathe(t + k * 0.5)));
    }
    out += G(mxBowl(180, 200, 122, 86, 1, inside), { "clip-path": "url(#mxMotifClip)" });
    if (mix > 0) out += C(180, 216, 152, "none", P.gold, 6, { opacity: mix * 0.85 });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A bowl holding a mixture of sand and stones">' + out + "</svg>";
  }

  /* ==== chapter: what a mixture is ================================================
     Two materials on their own first (sand pouring through a pair of hands, and
     three of the lesson's stones), then the same two in one bowl. The
     misconception the lesson names - "mixing makes one new material" - is shown
     and crossed out, and then a magnifying glass over the bowl shows that each
     material is exactly what it was. */

  var MX_BOWL = { cx: 392, rimY: 206, rx: 208, depth: 150 };

  /* the bowl of sand and stones, with `sandU` grains and `stoneU` stones in it */
  var MX_STONES = [[318, 216, 78], [392, 200, 92], [456, 222, 70], [356, 244, 58], [432, 252, 54]];
  function mxMixBowl(t, sandU, stoneU, o, opt) {
    opt = opt || {};
    var inside = mxGrains(MX_BOWL.cx, MX_BOWL.rimY + 16, MX_BOWL.rx * 0.82, 34, 34, sandU, 7.5, 1, 5,
      { lit: opt.litSand || 0 });
    for (var k = 0; k < MX_STONES.length; k++) {
      if (k >= stoneU) break;
      inside += mxStone(MX_STONES[k][0], MX_STONES[k][1], MX_STONES[k][2], 1, opt.litStone || 0);
    }
    return mxBowl(MX_BOWL.cx, MX_BOWL.rimY, MX_BOWL.rx, MX_BOWL.depth, o, inside);
  }

  function mxMixtureChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSand = c(0, "sand"), cFine = c(0, "fine"), cPour = c(0, "pour");
    var cStones = c(1, "stones"), cBig = c(1, "big"), cNoPour = c(1, "nopour");
    var cMix = c(2, "mix"), cMixture = c(2, "mixture"), cTwo = c(2, "two");
    var cThink = c(3, "think"), cNew = c(3, "newmat"), cNot = c(3, "not");
    var cLook = c(4, "look"), cStillS = c(4, "sand"), cStillR = c(4, "stones");
    var cNothing = c(5, "nothing"), cKeeps = c(5, "keeps");

    var A = 1 - into(t, scene.first + 2), B = into(t, scene.first + 2), out = "";

    /* ---- the two materials on their own ------------------------------------- */
    if (A > 0) {
      var a = "";
      /* sand: a pair of hands, and the grains pouring through them onto a heap */
      var sO = on(t, cSand, 0.45);
      a += R(64, 46, 488, 348, 22, P.card, P.line, 2, { opacity: sO });
      a += MK.pill(308, 88, "sand", sO, { size: 30, col: P.gold });
      a += MK.pop(Em(308, 176, 132, "\u{1F932}"), 308, 176, popIn(t, cSand, 0.45));
      var pourU = on(t, cPour, 0.35), stop0 = spokenEnd(scene.first) - 0.5;
      a += mxHeap(308, 356, 60 + 150 * pourU, 12 + 30 * pourU, sO);
      a += mxFall(t, cPour == null ? null : cPour + 0.15, stop0, 308, 232, 348, 26, 7, 6, pourU);
      /* "Fine grains": a few of them seen close up */
      var fine = popIn(t, cFine, 0.4);
      if (fine > 0) a += MK.pop(mxLens(470, 296, 62,
        mxGrains(470, 296, 40, 34, 9, 9, 11, 1, 9, {}), 1, 2.2), 470, 296, fine);

      /* stones: three of the lesson's own, big and hard, and they do not pour */
      var rO = on(t, cStones, 0.45);
      a += R(616, 46, 488, 348, 22, P.card, P.line, 2, { opacity: rO });
      a += MK.pill(860, 88, "stones", rO, { size: 30, col: P.gold });
      a += mxStone(742, 214, 168, popIn(t, cStones, 0.4), 0);
      a += mxStone(886, 186, 200, popIn(t, cStones == null ? null : cStones + 0.2, 0.4), 0);
      a += mxStone(1006, 232, 142, popIn(t, cStones == null ? null : cStones + 0.4, 0.4), 0);
      var bigU = on(t, cBig, 0.5);
      if (bigU > 0) {
        a += MK.arrow(886, 296, lerp(886, 790, bigU), 296, bigU, P.gold, 6);
        a += MK.arrow(886, 296, lerp(886, 982, bigU), 296, bigU, P.gold, 6);
        a += MK.pill(886, 340, "big and hard", bigU, { size: 26, col: P.gold });
      }
      var npU = on(t, cNoPour, 0.45);
      if (npU > 0) {
        a += MK.arrow(1052, 300, 1052, 360, npU, P.muted, 7);
        a += MK.cross(1052, 332, 40, popIn(t, cNoPour == null ? null : cNoPour + 0.3, 0.35));
      }
      out += G(a, { opacity: A });
    }

    /* ---- the two of them in one bowl ---------------------------------------- */
    if (B > 0) {
      var b = "", lens = on(t, cLook, 0.5) * mxSpan(t, scene, 4, 5);
      var sandU = tally(t, cMix, 34, 0.8), stoneU = tally(t, cMix == null ? null : cMix + 0.25, 5, 0.6);
      if (cMix == null) { sandU = 34; stoneU = 5; }
      b += mxMixBowl(t, sandU, stoneU, 1, {
        litSand: on(t, cStillS, 0.4) * mxOnly(t, scene, 4) * (0.5 + 0.5 * breathe(t)),
        litStone: on(t, cStillR, 0.4) * mxOnly(t, scene, 4) * (0.6 + 0.4 * breathe(t))
      });
      b += MK.pill(MX_BOWL.cx, 76, "mixture", on(t, cMixture, 0.4) * mxOnly(t, scene, 2), { size: 34, col: P.gold });

      /* "two materials": one word for each, pointing into the bowl */
      var two = mxOnly(t, scene, 2);
      if (two > 0) {
        b += G(mxLabel(t, 700, 134, "sand", cTwo, [540, 230], true, 28) +
          mxLabel(t, 700, 258, "stones", cTwo == null ? null : cTwo + 0.4, [392, 200], true, 28), { opacity: two });
      }

      /* the misconception, shown and crossed out */
      var thinkO = mxOnly(t, scene, 3);
      if (thinkO > 0) {
        var th = "";
        th += MK.qmark(886, 108, 34, popIn(t, cThink, 0.4));
        var blob = popIn(t, cNew, 0.45);
        if (blob > 0) {
          th += MK.pop(Pth("M812,260 C800,196 856,152 906,164 C962,178 986,232 964,282 C944,326 848,326 812,260 Z", "#8D8274", "#6C6255", 4) +
            C(870, 216, 9, "#736A5D") + C(916, 240, 7, "#736A5D") + C(896, 194, 6, "#736A5D"), 886, 232, blob);
          th += MK.pill(886, 340, "one new material", Math.min(1, blob), { size: 26, col: P.line, ink: P.muted });
        }
        th += MK.cross(886, 236, 96, popIn(t, cNot, 0.4));
        out += G(th, { opacity: thinkO * B });
      }

      /* "Look closely": the magnifying glass over the bowl */
      if (lens > 0) {
        /* the stones to the left in the lens and the sand to its right, so
           each label's line can end on the thing it names and not between
           the two */
        var big = mxGrains(446, 232, 66, 60, 16, 16, 16, 1, 11,
          { lit: on(t, cStillS, 0.4) * (0.5 + 0.5 * breathe(t)) }) +
          mxStone(318, 212, 148, 1, on(t, cStillR, 0.4) * (0.6 + 0.4 * breathe(t))) +
          mxStone(326, 320, 116, 1, on(t, cStillR, 0.4) * (0.6 + 0.4 * breathe(t)));
        out += G(mxLens(MX_BOWL.cx, MX_BOWL.rimY + 44, 132, big, 1, 0.95), { opacity: lens });
        out += G(mxLabel(t, 700, 132, "still sand", cStillS, [446, 232], true, 28) +
          mxLabel(t, 700, 348, "still stones", cStillR, [326, 320], true, 28), { opacity: lens });
      }

      /* what each material kept */
      var keep = mxOnly(t, scene, 5);
      if (keep > 0) {
        var kp = "", k1 = popIn(t, cKeeps, 0.4), k2 = popIn(t, cKeeps == null ? null : cKeeps + 0.45, 0.4);
        kp += MK.tick(MX_BOWL.cx, 92, 34, popIn(t, cNothing, 0.4));
        kp += MK.pop(R(664, 86, 466, 132, 20, P.cell, P.teal, 3) +
          mxHeap(736, 176, 96, 28, 1) + Tx(812, 168, "fine, it pours", "lab big", "start"), 897, 152, k1);
        kp += MK.pop(R(664, 250, 466, 132, 20, P.cell, P.teal, 3) +
          mxStone(736, 316, 96, 1, 0) + Tx(812, 328, "big and hard", "lab big", "start"), 897, 316, k2);
        out += G(kp, { opacity: keep * B });
      }
      out = G(b, { opacity: B }) + out;
    }
    return svg(out);
  }

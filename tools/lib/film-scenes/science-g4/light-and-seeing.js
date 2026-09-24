  /* ==== Grade 4 Science, Lesson 9: Light and Seeing ===========================
     tools/lib/film-scenes/science-g4/light-and-seeing.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/light-and-seeing.json.

     Two of the chapters are the lesson's own drawings, so the child sees here
     what they use two steps later: the mirror experiment (ART.sim "rayMirror",
     at the states its two buttons reach - the ray missing the eye, the ray
     reaching it, and the book in the way) and the labelling figure
     (ART.figure "ray", whose four parts are the four labels the diagram step
     asks for). The rest of the lesson's light steps are emoji frames with no
     drawing of their own, so the torch, the clouds, the corner, the mirror,
     the book and the eye are drawn here, in the colours the kit's own light
     sims use for them.

     EVERY RAY IN THIS FILM TRAVELS SOURCE -> OBJECT -> EYE. The one place a
     ray leaves an eye is the old idea in "How the idea changed", which is
     crossed out and dimmed as the line says it was wrong.

     This file: the palette, the shared small drawings, the title motif and the
     chapter "Light in straight lines". Every top-level name starts with las,
     so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, straight: P.gold, reflect: P.blue, mirror: P.accent,
    seeing: P.gold, oldidea: P.plum, diagram: P.good, recap: P.teal
  };

  /* the colours the lesson's own light drawings use */
  var LAS_RAY = "#F4C95D";          /* the kit's ray gold (rayMirror, FIGURES.ray) */
  var LAS_GLASS = "#BFE3F5";        /* the kit's mirror */
  var LAS_WALL = "#4A5560";         /* brick */
  var LAS_WALL_EDGE = "#6A7783";
  var LAS_LIT = "#E9D9B8";          /* a surface with light on it */
  var LAS_DARK_SURF = "#2A2F35";    /* a dark surface, which soaks light up */
  var LAS_PAPER = "#F2EFE6";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function lasOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function lasFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* one of the film's own chapters by id, so a recap card can ask for a cue */
  function lasScene(id) {
    for (var k = 0; k < F.scenes.length; k++) if (F.scenes[k].id === id) return F.scenes[k];
    return null;
  }

  /* ---- small drawings the chapters share --------------------------------------- */

  /* An eye looking right (dx 1) or left (dx -1); the pupil opens with `wide`.
     The pupil is always smaller than the iris round it: with the two radii
     equal the eye reads as a dark disc with a white blob in it. */
  function lasEye(cx, cy, s, dx, wide, o) {
    if (!(o > 0)) return "";
    var g = dx * s * 0.2, p = s * (0.13 + 0.16 * clamp(wide, 0, 1));
    return G(Pth("M" + n2(cx - s) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy - s * 0.76) + " " + n2(cx + s) + "," + n2(cy) +
        " Q" + n2(cx) + "," + n2(cy + s * 0.76) + " " + n2(cx - s) + "," + n2(cy) + " Z", "#FFFFFF", P.edge, 3) +
      C(cx + g, cy, s * 0.46, "#6B4A2B") + C(cx + g, cy, p, "#0B1D2C") +
      C(cx + g - s * 0.15, cy - s * 0.17, s * 0.07, "#FFFFFF"),
      { opacity: n2(clamp(o, 0, 1)) });
  }

  /* a torch, its glow breathing while it is on */
  function lasTorch(cx, cy, size, t, o) {
    if (!(o > 0)) return "";
    return MK.glow(cx - size * 0.06, cy, size * 0.72, P.gold, clamp(o, 0, 1) * (0.7 + 0.3 * breathe(t))) +
      G(Em(cx, cy, size, "\u{1F526}"), { opacity: n2(Math.min(1, o)) });
  }

  /* a straight ray with an arrow on it: the only way light moves in this film */
  function lasRay(x1, y1, x2, y2, u, col, w) { return MK.arrow(x1, y1, x2, y2, u, col || LAS_RAY, w || 7); }

  /* a fan of short rays leaving (cx, cy) - a rough surface scattering light */
  function lasScatter(cx, cy, r0, r1, a0, a1, n, u, col, w) {
    if (!(u > 0)) return "";
    var out = "";
    for (var k = 0; k < n; k++) {
      var a = lerp(a0, a1, n < 2 ? 0.5 : k / (n - 1));
      out += MK.arrow(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0,
        cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, u, col || LAS_RAY, w || 5);
    }
    return out;
  }

  /* the one thing light cannot do, drawn so it can be crossed out: a dashed
     curve bending round a corner. It is never gold, so it never reads as a ray. */
  function lasBentPath(d, u, col) {
    if (!(u > 0)) return "";
    return Pth(d, null, col || P.plum, 5, { opacity: n2(clamp(u, 0, 1)), "stroke-dasharray": "14 12" });
  }

  /* ==== the title ==============================================================
     The film's one sentence as a picture: a torch, a book and an eye, with the
     light going torch -> book -> eye. In the spoken title chapter the first ray
     grows on "travels in straight lines", a dashed curve tries to bend round a
     corner and is crossed out on "bend round a corner", the book flashes on
     "bounces off it", and the second ray reaches the eye on "into your eye".
     On the two cards it stands finished, and the crossed curve is left off. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cStraight = s ? sc(s, 0, "straight") : null, cCorner = s ? sc(s, 0, "corner") : null,
      cBounce = s ? sc(s, 1, "bounces") : null, cEye = s ? sc(s, 1, "eye") : null;
    var a = s ? on(t, cStraight, 0.8) : 1, bend = s ? on(t, cCorner, 0.5) : 0,
      x = s ? popIn(t, cCorner == null ? null : cCorner + 0.55, 0.4) : 0,
      hit = s ? popIn(t, cBounce, 0.45) : 1, b = s ? on(t, cEye, 0.8) : 1;

    out += R(12, 44, 336, 276, 20, "#12283A", P.line, 3);
    out += lasRay(76, 272, 152, 252, a, LAS_RAY, 8);
    out += G(Em(186, 240, 68, "\u{1F4D5}"), { transform: around(186, 240, 0.96 + 0.06 * Math.min(hit, 1)) });
    out += MK.ripple(186, 214, t, cBounce, P.gold);
    out += lasRay(208, 214, 268, 152, b, LAS_RAY, 8);
    out += lasEye(296, 122, 34, -1, b, 0.35 + 0.65 * b);
    out += G(lasTorch(54, 278, 56, t, 1), {});
    if (bend > 0) {
      out += lasBentPath("M96,262 C118,196 92,156 146,140", bend);
      out += MK.cross(120, 186, 22, x);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A torch shining on a book, and the light going from the book into an eye">' + out + "</svg>";
  }

  /* ==== chapter: light in straight lines =======================================
     The lesson's demo step, whose six frames have no drawing of their own.
     Beats 0 and 1: its first two frames side by side - a torch beam in dusty
     air, and sunlight through a gap in the clouds. Beats 2 and 3: its third
     frame, the corner, drawn as a plan of a wall with a book on one side and an
     eye on the other, so the child can see the rays stop at the wall. Beat 4:
     its fourth frame, what a ray is - a straight line with an arrow. */

  /* ---- beats 0 and 1: two panels ---------------------------------------------- */
  var LAS_DUST = [[0.18, -0.52], [0.31, 0.34], [0.42, -0.15], [0.52, 0.62], [0.61, -0.44],
    [0.68, 0.18], [0.76, -0.68], [0.84, 0.42], [0.9, -0.22], [0.95, 0.7]];

  function lasBeamPic(t, scene) {
    var cTorch = sc(scene, 0, "torch"), cDusty = sc(scene, 0, "dusty"), cStraight = sc(scene, 0, "straight");
    var cClouds = sc(scene, 1, "clouds"), cLines = sc(scene, 1, "lines");
    var out = "";

    /* ---- the torch in dusty air, on the left ---- */
    var pa = popIn(t, BEATS[scene.first].start - GAP + 0.1, 0.5);
    var lit = on(t, cTorch, 0.7);
    out += R(40, 44, 522, 352, 20, P.card, P.line, 2, { opacity: n2(Math.min(1, pa)) });
    if (lit > 0) {
      out += el("polygon", { points: "160,214 546,148 546,280",
        fill: LAS_RAY, opacity: n2(0.26 * lit) });
    }
    /* the dust the beam shows up in */
    var dust = on(t, cDusty, 0.7);
    if (dust > 0) {
      for (var k = 0; k < LAS_DUST.length; k++) {
        var u = LAS_DUST[k][0], px = lerp(180, 530, u), half = lerp(16, 64, u);
        out += C(px, 214 + LAS_DUST[k][1] * half, 4.5, "#FFF6DC", null, null,
          { opacity: n2(dust * (0.55 + 0.45 * breathe(t + k))) });
      }
    }
    /* "dead straight": a dashed straight edge laid along the middle of the beam */
    var str = on(t, cStraight, 0.5);
    if (str > 0) {
      out += L(162, 214, 546, 214, P.ink, 3, { opacity: n2(0.9 * str), "stroke-dasharray": "14 11" });
      out += MK.pill(360, 348, "dead straight", str, { size: 26, col: P.gold });
    }
    out += G(lasTorch(110, 214, 92, t, Math.min(1, popIn(t, cTorch, 0.45))), {});
    out += Tx(300, 92, "a torch beam in dusty air", "lab mid muted readable", "middle", { opacity: n2(Math.min(1, pa)) });

    /* ---- sunlight through the clouds, on the right ---- */
    var pb = popIn(t, cClouds, 0.5);
    if (pb > 0) {
      var cl = "";
      cl += R(606, 44, 522, 352, 20, P.card, P.line, 2);
      cl += R(620, 336, 494, 46, 10, P.grass);
      /* the shafts come in just behind the panel, not on the "straight lines"
         cue three quarters of the way through the line, which left the panel a
         bare cloud for two seconds */
      var sh = on(t, cClouds == null ? null : cClouds + 0.35, 0.8);
      if (sh > 0) {
        for (var j = 0; j < 4; j++) {
          var sx = 780 + j * 60, ex = 730 + j * 92;
          cl += el("polygon", { points: n2(sx) + ",186 " + n2(sx + 26) + ",186 " +
            n2(lerp(sx + 26, ex + 40, 1)) + "," + n2(lerp(186, 336, sh)) + " " + n2(lerp(sx, ex, 1)) + "," + n2(lerp(186, 336, sh)),
            fill: LAS_RAY, opacity: n2(0.34 * sh) });
          cl += L(sx + 13, 186, lerp(sx + 13, ex + 20, 1), lerp(186, 336, sh), LAS_RAY, 4, { opacity: n2(0.8 * sh) });
        }
      }
      /* "in straight lines": a ruler edge laid down the middle shaft */
      var ln = bump(t, cLines, 2.0);
      if (ln > 0) {
        cl += L(897, 190, 936, 330, P.ink, 3, { opacity: n2(0.9 * ln), "stroke-dasharray": "13 10" });
        cl += C(916, 260, 34, "none", P.gold, 4, { opacity: n2(ln) });
      }
      cl += Em(866, 150, 132, "⛅");
      cl += Tx(866, 92, "sunlight through a gap in the clouds", "lab mid muted readable", "middle");
      out += G(cl, { opacity: n2(Math.min(1, pb)), transform: around(866, 220, Math.min(pb, 1.06)) });
    }
    return out;
  }

  /* ---- beats 2 and 3: the corner ----------------------------------------------
     A plan of a corner: a wall going up and a wall going right, a book on the
     far side and an eye on this side. Every ray from the book is straight; the
     ones aimed at the eye stop dead at the wall, and the ones that get past go
     off into open space. The only bending line is dashed, plum and crossed. */
  var LAS_CN = { bx: 280, by: 150, ex: 860, ey: 372, wx: 560, ww: 44, wy: 40, wh: 260, hy: 256, hh: 44, hx2: 1140 };
  /* the fan, in degrees: 2 and 3 are aimed past the corner and stop at the wall */
  var LAS_FAN = [
    { a: -150, len: 205, stop: false },
    { a: -104, len: 136, stop: false },
    { a: -20, len: 0, stop: true },
    { a: 20.9, len: 0, stop: true },
    { a: 55, len: 345, stop: false }
  ];
  function lasFanEnd(f) {
    var r = f.a * Math.PI / 180;
    if (!f.stop) return [LAS_CN.bx + Math.cos(r) * f.len, LAS_CN.by + Math.sin(r) * f.len];
    var len = (LAS_CN.wx - LAS_CN.bx) / Math.cos(r);
    return [LAS_CN.wx, LAS_CN.by + Math.sin(r) * len];
  }

  function lasCornerPic(t, scene) {
    var cCorner = sc(scene, 2, "corner"), cBend = sc(scene, 2, "bend");
    var cTravels = sc(scene, 3, "travels"), cMisses = sc(scene, 3, "misses");
    var out = "";

    /* the two walls, and the corner where they meet */
    out += R(LAS_CN.wx, LAS_CN.wy, LAS_CN.ww, LAS_CN.wh, 6, LAS_WALL, LAS_WALL_EDGE, 3);
    out += R(LAS_CN.wx, LAS_CN.hy, LAS_CN.hx2 - LAS_CN.wx, LAS_CN.hh, 6, LAS_WALL, LAS_WALL_EDGE, 3);
    for (var b = 0; b < 5; b++) out += L(LAS_CN.wx + 6, LAS_CN.wy + 30 + b * 44, LAS_CN.wx + LAS_CN.ww - 6, LAS_CN.wy + 30 + b * 44, LAS_WALL_EDGE, 2);
    for (var c = 0; c < 6; c++) out += L(LAS_CN.wx + 96 + c * 92, LAS_CN.hy + 6, LAS_CN.wx + 96 + c * 92, LAS_CN.hy + LAS_CN.hh - 6, LAS_WALL_EDGE, 2);

    /* the rays: straight, from the book, as the line says they travel straight */
    var go = on(t, cTravels, 0.8);
    if (go > 0) {
      for (var k = 0; k < LAS_FAN.length; k++) {
        var e = lasFanEnd(LAS_FAN[k]);
        out += lasRay(LAS_CN.bx, LAS_CN.by, e[0], e[1], go, LAS_RAY, LAS_FAN[k].stop ? 7 : 5);
        if (LAS_FAN[k].stop && go > 0.9) out += C(e[0], e[1], 9, P.bad, null, null, { opacity: n2(go) });
      }
    }
    /* the book behind the corner, and the eye on this side */
    out += Em(LAS_CN.bx, LAS_CN.by, 86, "\u{1F4D5}");
    out += MK.pill(LAS_CN.bx, 250, "round the corner", lasFrom(t, scene, 2), { size: 24, col: P.line });
    out += lasEye(LAS_CN.ex, LAS_CN.ey, 54, -1, 0.55, 1);
    out += MK.pill(1024, LAS_CN.ey, "your eye", lasFrom(t, scene, 2), { size: 24, col: P.line });

    /* "you cannot see round a corner": the corner itself, ringed */
    out += R(LAS_CN.wx - 8, LAS_CN.hy - 8, LAS_CN.ww + 16, LAS_CN.hh + 16, 10, "none", P.gold, 4,
      { opacity: n2(bump(t, cCorner, 1.8)) });
    /* "light will not bend round it": a dashed curve that tries, and is crossed */
    var bend = on(t, cBend, 0.7) * (1 - 0.35 * on(t, cTravels, 0.6));
    if (bend > 0) {
      out += lasBentPath("M330,196 C500,250 520,330 620,346 L" + n2(LAS_CN.ex - 70) + ",360", bend);
      out += MK.cross(516, 314, 34, popIn(t, cBend == null ? null : cBend + 0.45, 0.4));
    }
    /* "and misses your eye": the ray that gets past goes nowhere near it */
    var miss = on(t, cMisses, 0.5);
    if (miss > 0) {
      out += MK.cross(744, LAS_CN.ey, 34, popIn(t, cMisses, 0.4));
      out += MK.pill(LAS_CN.ex, 418, "no light arrives", miss, { size: 20, col: P.muted, ink: P.muted });
    }
    return out;
  }

  /* ---- beat 4: what a ray is --------------------------------------------------- */
  function lasRayPic(t, scene) {
    var cRays = sc(scene, 4, "rays"), cArrows = sc(scene, 4, "arrows");
    var arr = on(t, cArrows, 0.5), out = "";
    var ends = [[900, 108], [916, 214], [900, 320]];
    /* The rays grow over the gap and the first words, not from the "as rays"
       cue in the middle of the line: waiting for the cue left the card empty
       but for the torch for a second and a half. The word still lands on
       something - the pill. */
    var t0 = BEATS[scene.first + 4].start - GAP;

    out += R(124, 48, 900, 344, 20, P.card, P.line, 2);
    for (var k = 0; k < 3; k++) {
      var u = ease(clamp((t - t0 - k * 0.16) / 0.8, 0, 1));
      out += lasRay(324, 214, ends[k][0], ends[k][1], u, LAS_RAY, 8);
      if (arr > 0) out += C(ends[k][0], ends[k][1], 26, "none", P.gold, 4, { opacity: n2(bump(t, cArrows, 2.2)) });
    }
    out += G(lasTorch(250, 214, 104, t, 1), {});
    out += MK.pill(574, 352, "a ray: a straight line with an arrow", on(t, cRays, 0.45), { size: 28, col: P.gold });
    return out;
  }

  function lasStraightChapter(scene, beat, t, i) {
    var k = i - scene.first, out = "";
    if (k < 2) return svg(lasBeamPic(t, scene));
    if (k < 4) {
      var u = into(t, scene.first + 2);
      return svg(lasCornerPic(t, scene) + (u < 1 ? G(lasBeamPic(t, scene), { opacity: n2(1 - u) }) : ""));
    }
    var v = into(t, scene.first + 4);
    out += lasRayPic(t, scene);
    return svg(out + (v < 1 ? G(lasCornerPic(t, scene), { opacity: n2(1 - v) }) : ""));
  }

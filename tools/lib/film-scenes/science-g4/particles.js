  /* ==== Grade 4 Science, Lesson 6: Particles ==================================
     tools/lib/film-scenes/science-g4/particles.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     science/grade-4-app/lecture-video/particles.json.

     The lesson's own drawing carries the whole film: ART.kit.particleSvg(state,
     jiggle, tick) is the box the child heats and cools in the Melt and freeze
     experiment two steps later. state 0 is the cold solid (five rows of eight,
     jiggling a little), 1 the warm solid (the same rows, jiggling three times
     as hard) and 2 the liquid (four staggered rows that slide past each other,
     alternate rows in opposite directions, as tick advances). Nothing here
     redraws those particles; the film supplies the row lines, the arrows, the
     zoom and the labels around them, and passes jiggle and tick as pure
     functions of t.

     This file: the palette, the box helpers, the small drawings every chapter
     shares, the title motif and the chapter "Everything is particles". Every
     top-level name starts with pa or PA, so nothing here can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, particles: P.blue, solid: P.gold, liquid: P.teal,
    words: P.plum, powders: P.accent, model: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 1 during the chapter's beat k alone: for a thing that belongs to it (rule 7) */
  function paOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var a = k === 0 ? 1 : into(t, scene.first + k);
    var z = k + 1 < scene.beats.length ? into(t, scene.first + k + 1) : 0;
    return a * (1 - z);
  }
  /* 1 from the chapter's beat k on: for a thing that stays */
  function paFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 from beat k0 until beat k1 comes in */
  function paSpan(t, scene, k0, k1) { return paFrom(t, scene, k0) * (1 - (k1 < scene.beats.length ? into(t, scene.first + k1) : 0)); }
  /* fixed numbers for anything scattered: never Math.random */
  var PA_SCATTER = [0.17, 0.83, 0.41, 0.66, 0.08, 0.92, 0.55, 0.29, 0.74, 0.13, 0.61, 0.37,
    0.88, 0.22, 0.70, 0.46, 0.05, 0.95, 0.33, 0.58, 0.79, 0.11, 0.64, 0.27];
  function paRnd(k) { return PA_SCATTER[((k % PA_SCATTER.length) + PA_SCATTER.length) % PA_SCATTER.length]; }

  /* ---- the lesson's particle box --------------------------------------------
     particleSvg draws in a 320 x 220 viewBox, so a box here keeps that shape
     and paBX / paBY put a point of the lesson's drawing in film coordinates. */
  var PA_BOX = { x: 40, y: 16, w: 540, h: 371.25 };
  function paBX(box, v) { return box.x + v * box.w / 320; }
  function paBY(box, v) { return box.y + v * box.h / 220; }
  function paBS(box, v) { return v * box.w / 320; }
  /* the vibration passed to particleSvg: state 0 draws it at 1.2x, state 1 at 3x */
  function paJig(t, amp) { return (amp == null ? 1 : amp) * Math.sin(t * 22.5); }
  function paBoxCard(box, o) {
    return R(box.x - 9, box.y - 9, box.w + 18, box.h + 18, 18, P.card, P.line, 2, o == null ? null : { opacity: clamp(o, 0, 1) });
  }
  function paBoxAt(box, state, jig, tick) {
    return ART.place(ART.kit.particleSvg(state, jig, tick), box.x, box.y, box.w, box.h);
  }
  /* the rows of the solid, in film coordinates: 5 rows of 8, 23 apart from (80, 97) */
  function paRowY(box, r) { return paBY(box, 97 + r * 23); }
  function paColX(box, c) { return paBX(box, 80 + c * 23); }
  /* the liquid's rows: 4 of them, 20 apart, the lowest at y = 189. Rows 0 and 2
     slide left and rows 1 and 3 right (particleSvg: shift = floor(tick / 2) *
     (k % 2 ? 1 : -1)), so an arrow drawn here goes the way its row really goes. */
  function paLiqY(box, k) { return paBY(box, 189 - k * 20); }
  function paLiqDir(k) { return k % 2 ? 1 : -1; }

  /* ---- small drawings the chapters share -------------------------------------- */

  /* one particle, drawn as the lesson draws it */
  function paBall(cx, cy, r, fill, o) {
    if (o != null && !(o > 0)) return "";
    return C(cx, cy, r, fill || "#7BC47F", "#1B2A3A", Math.max(1.5, r * 0.17), o == null ? null : { opacity: clamp(o, 0, 1) });
  }
  /* two arcs either side of a particle: it is shaking */
  function paShake(cx, cy, r, o, col) {
    if (!(o > 0)) return "";
    var d = r * 1.5, w = Math.max(2.5, r * 0.14), c = col || P.gold;
    return G(Pth("M" + n2(cx - d) + "," + n2(cy - r * 0.6) + " q" + n2(-r * 0.5) + "," + n2(r * 0.6) + " 0," + n2(r * 1.2), null, c, w) +
      Pth("M" + n2(cx + d) + "," + n2(cy - r * 0.6) + " q" + n2(r * 0.5) + "," + n2(r * 0.6) + " 0," + n2(r * 1.2), null, c, w),
      { opacity: clamp(o, 0, 1) });
  }
  /* mix two #rrggbb colours */
  function paMix(a, b, u) {
    u = clamp(u, 0, 1);
    var ca = parseInt(a.slice(1), 16), cb = parseInt(b.slice(1), 16), out = "#";
    for (var k = 16; k >= 0; k -= 8) {
      var v = Math.round(lerp((ca >> k) & 255, (cb >> k) & 255, u));
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  }
  /* the lesson's own drawing with the colour taken out of its particles, for
     "real particles have no colour": the model's green is for us. */
  function paGrey(markup, u) {
    return u <= 0 ? markup : String(markup).split("#7BC47F").join(paMix("#7BC47F", "#A8AEB5", clamp(u, 0, 1)));
  }
  /* a word in a gold pill with a line to the thing it names */
  function paLabel(t, x, y, text, at, to, size, col) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    return (to ? MK.leader(x, y + (to[1] > y ? 20 : -20), to[0], to[1], on(t, at, 0.7), col || P.gold) : "") +
      MK.pill(x, y, text, o, { size: size || 26, col: col || P.gold });
  }
  /* a drop of water, its round bottom centred on (x, y) */
  function paDrop(x, y, r, o, fill) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.88) + "," + n2(y - r * 0.44) + " L" + n2(x) + "," + n2(y - r * 2.15) +
        " L" + n2(x + r * 0.88) + "," + n2(y - r * 0.44) + " Z", fill || "#5FA8DC") +
      C(x, y, r, fill || "#5FA8DC") + C(x - r * 0.33, y - r * 0.3, r * 0.26, "#FFFFFF", null, null, { opacity: 0.7 }),
      { opacity: clamp(o, 0, 1) });
  }
  /* a thermometer standing on (x, y), h tall, filled to u */
  function paThermo(x, y, h, u, o) {
    if (!(o > 0)) return "";
    var w = 20, bulb = 24, top = y - h;
    return G(R(x - w / 2, top, w, h, w / 2, "#F2EFE6", "#3A3A3A", 3) + C(x, y, bulb, "#D9473F", "#3A3A3A", 3) +
      R(x - w / 2 + 5, lerp(y - 8, top + 8, clamp(u, 0, 1)), w - 10, y - 8 - lerp(y - 8, top + 8, clamp(u, 0, 1)), 5, "#D9473F"),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif =========================================================
     What the lesson is: a spoon, water and a child above the lesson's own box of
     particles. In the spoken title chapter each thing lights as it is named, and
     the box comes in on "particles"; on the two cards it simply stands. */
  var PA_MOTIF = [{ pic: "\u{1F944}", at: "spoon", x: 74 }, { pic: "\u{1F4A7}", at: "water", x: 180 }, { pic: "\u{1F9D2}", at: "you", x: 286 }];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var box = { x: 20, y: 104, w: 320, h: 220 };
    var boxAt = sn ? sc(sn, 1, "particles") : null, smallAt = sn ? sc(sn, 1, "small") : null;
    var boxO = sn ? lerp(0.5, 1, on(t, boxAt, 0.6)) : 1;
    out += R(10, 96, 340, 236, 20, P.card, P.line, 3, { opacity: 0.35 + 0.65 * boxO });
    if (boxO > 0) out += G(paBoxAt(box, 0, paJig(t, 1.15), 0), { opacity: boxO });
    PA_MOTIF.forEach(function (m, k) {
      var lit = sn ? popIn(t, sc(sn, 0, m.at), 0.4) : 1;
      out += G(MK.pic(m.x, 48, 62, m.pic), { opacity: 0.3 + 0.7 * Math.min(1, lit) , transform: around(m.x, 48, 0.9 + 0.1 * Math.min(1, lit)) });
    });
    /* "far too small to see": a ring closes on one particle of the model */
    var sm = sn ? on(t, smallAt, 0.7) : 0;
    if (sm > 0) out += C(paBX(box, 149), paBY(box, 143), lerp(74, 20, sm), "none", P.gold, 4, { opacity: sm });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A spoon, water and a child above a box of particles">' + out + "</svg>";
  }

  /* ==== chapter: everything is particles =========================================
     Four things the lesson names (a spoon, water, the air, you), each with
     particles inside; then the lesson's own box, named as the model. */
  var PA_THINGS = [
    { pic: "\u{1F944}", label: "a spoon", at: "spoon" },
    { pic: "\u{1F4A7}", label: "water", at: "water" },
    { pic: "\u{1F4A8}", label: "the air", at: "air" },
    { pic: "\u{1F9D2}", label: "you", at: "you" }
  ];
  var PA_TDOTS = [[-70, 166], [-42, 186], [-14, 164], [14, 186], [42, 164], [70, 184], [-56, 204], [0, 206], [56, 204]];
  var PA_TILE = { y: 112, w: 240, h: 252, gap: 22 };
  function paTileX(k) { return (1168 - 4 * PA_TILE.w - 3 * PA_TILE.gap) / 2 + k * (PA_TILE.w + PA_TILE.gap); }

  function paThingTile(k, t, appear, lit, dots) {
    var x = paTileX(k), cx = x + PA_TILE.w / 2, y = PA_TILE.y, th = PA_THINGS[k];
    if (!(appear > 0)) return "";
    var out = R(x, y, PA_TILE.w, PA_TILE.h, 20, lit > 0.5 ? "#1B3A52" : P.card, lit > 0.5 ? P.gold : P.line, lit > 0.5 ? 4 : 2);
    out += MK.pic(cx, y + 86, 96, th.pic);
    out += Tx(cx, y + PA_TILE.h - 16, th.label, "lab big", "middle", lit > 0.5 ? { fill: P.gold } : null);
    var n = Math.min(PA_TDOTS.length, Math.round(dots * PA_TDOTS.length));
    for (var d = 0; d < n; d++) out += paBall(cx + PA_TDOTS[d][0] + Math.sin(t * 9 + d * 2.1) * 1.6, y + PA_TDOTS[d][1] + Math.cos(t * 8 + d) * 1.6, 9);
    return G(out, { opacity: clamp(0.35 + 0.65 * Math.min(1, appear) * (lit < 0 ? 0.45 : 1), 0, 1),
      transform: around(cx, y + PA_TILE.h / 2, 0.96 + 0.04 * Math.min(1, appear) + (lit > 0.5 ? 0.03 : 0)) });
  }

  function paParticlesChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cEvery = c(0, "everything"), cParts = c(0, "particles"), cEye = c(0, "eye");
    var cAll = c(1, "all");
    var cModel = c(2, "model"), cPic = c(2, "picture"), cSee = c(2, "see");
    var cThis = c(3, "this"), cForty = c(3, "forty"), cReal = c(3, "real");

    var a = paSpan(t, scene, 0, 2), b = paFrom(t, scene, 2), out = "";

    /* --- the four things (beats 1 and 2) --- */
    if (a > 0) {
      var named = -1;
      for (var k = 3; k >= 0; k--) if (c(1, PA_THINGS[k].at) != null && t >= c(1, PA_THINGS[k].at)) { named = k; break; }
      var allOn = on(t, cAll, 0.5);
      var tiles = "";
      for (var m = 0; m < 4; m++) {
        var app = on(t, cEvery, 0.5 + m * 0.12);
        var lit = allOn > 0.5 ? 1 : named < 0 ? 0 : m === named ? 1 : -1;
        var dots = Math.max(on(t, cParts, 1.1), allOn);
        tiles += paThingTile(m, t, app, lit, dots);
      }
      /* "far too small for any eye to see" */
      var eye = popIn(t, cEye, 0.4);
      if (eye > 0) {
        tiles += MK.pop(MK.pic(404, 46, 62, "\u{1F441}️"), 404, 46, Math.min(1, eye));
        tiles += MK.cross(448, 32, 22, popIn(t, cEye == null ? null : cEye + 0.25, 0.35));
        tiles += MK.pill(664, 46, "far too small to see", on(t, cEye == null ? null : cEye + 0.1, 0.4), { size: 28, col: P.gold });
      }
      out += G(tiles, { opacity: a });
    }

    /* --- the model (beats 3 and 4) --- */
    if (b > 0) {
      /* The box comes in with the beat, not with a cue: the four things fade
         out as b fades in, so the stage is never empty while the line runs up
         to "a model" (it was blank for a second and a half before). */
      var box = { x: 40, y: 30, w: 520, h: 357.5 }, mo = "";
      mo += paBoxCard(box);
      mo += paBoxAt(box, 0, paJig(t, 1.15), 0);
      /* a gold frame round the whole model as it is named */
      var fr = on(t, cThis, 0.5);
      if (fr > 0) mo += R(box.x - 9, box.y - 9, box.w + 18, box.h + 18, 18, "none", P.gold, 4, { opacity: fr });
      mo += MK.pill(860, 76, "a model", on(t, cModel, 0.4), { size: 34, col: P.gold });
      mo += MK.pill(860, 146, "a picture of an idea", on(t, cPic, 0.4), { size: 27 });
      /* the light behind it as the model is drawn so you can see it */
      var seen = on(t, cSee, 0.7);
      if (seen > 0) mo += MK.glow(box.x + box.w / 2, box.y + box.h / 2, 206, P.gold, 0.5 * seen * (0.6 + 0.4 * breathe(t)));
      /* "Forty balls in a box": counted up, over the model */
      var nf = tally(t, cForty, 40, 1.5);
      if (nf > 0) {
        mo += MK.pill(860, 232, String(nf) + " balls", 1, { size: 40, col: P.gold, ink: P.gold });
        mo += Tx(860, 288, "in one box", "lab mid muted", "middle");
      }
      /* "standing for the real thing": a line back to the spoon */
      var re = on(t, cReal, 0.6);
      if (re > 0) {
        mo += MK.pic(1000, 366, 86, "\u{1F944}", { opacity: re });
        mo += MK.leader(700, 366, 940, 366, re, P.gold);
        mo += MK.pill(700, 320, "the real thing", re, { size: 25, anchor: "start" });
      }
      out += G(mo, { opacity: b });
    }
    return svg(out);
  }

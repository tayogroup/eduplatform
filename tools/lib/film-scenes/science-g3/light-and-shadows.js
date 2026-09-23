  /* ==== Grade 3 Science, Lesson 10: Light and Shadows =========================
     tools/lib/film-scenes/science-g3/light-and-shadows.js, with -2.js, -3.js
     and -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/light-and-shadows.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the light tester (ART.sim "lightThrough", the drawing
     of its predictEach step, with window glass, tracing paper and a book in
     it), the three bins of its sort step, and the shadow-size experiment
     (ART.sim "shadowSize", the three positions its two buttons step through).
     The demo step has no drawing of its own - it is four emoji frames - so the
     torch, the hand and the wall of "A shadow" are drawn here, in the same
     colours the lesson's own sims use for them.

     This file: the palette, the shared small drawings, the title motif and the
     chapter "Three kinds of material". Every top-level name starts with ls, so
     nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, materials: P.gold, shadow: P.blue, size: P.accent,
    question: P.plum, eye: P.gold, then: P.good, recap: P.teal
  };

  /* the colours the lesson's own light sims use */
  var LS_WALL_LIT = "#E9D9B8";      /* shadowSize's wall */
  var LS_WALL_OFF = "#3A3A3A";      /* lightThrough's wall with no light on it */
  var LS_WALL_THROUGH = "#F4C95D";  /* lit right through */
  var LS_WALL_SOME = "#8A7A4A";     /* lit dimly */
  var LS_SHADOW = "#111111";        /* shadowSize's shadow */
  var LS_BEAM = "#F4C95D";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function lsOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function lsFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has the cue been reached? (null cues never have) */
  function lsPast(t, at) { return at != null && t >= at; }

  /* ---- small drawings the chapters share --------------------------------------- */

  /* two hex colours mixed */
  function lsMix(a, b, u) {
    u = clamp(u, 0, 1);
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, u));
    var g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, u));
    var c = Math.round(lerp(pa & 255, pb & 255, u));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + c).toString(16).slice(1);
  }

  /* a beam of light from the torch at (ax, ay), spreading to half-height `half`
     at x = bx. The lesson's sims draw theirs as one pale gold triangle. */
  function lsBeam(ax, ay, bx, half, o) {
    if (!(o > 0)) return "";
    return el("polygon", { points: n2(ax) + "," + n2(ay) + " " + n2(bx) + "," + n2(ay - half) + " " + n2(bx) + "," + n2(ay + half),
      fill: LS_BEAM, opacity: n2(0.24 * clamp(o, 0, 1)) });
  }

  /* the wedge of blocked light behind an object: the cone from the torch at
     (ax, ay) past the object's edges, on to the wall at x = bx */
  function lsCone(ax, ay, ox, half, bx, o) {
    if (!(o > 0)) return "";
    var k = (bx - ax) / (ox - ax);
    return el("polygon", { points: n2(ox) + "," + n2(ay - half) + " " + n2(bx) + "," + n2(ay - half * k) + " " +
      n2(bx) + "," + n2(ay + half * k) + " " + n2(ox) + "," + n2(ay + half),
      fill: P.night, opacity: n2(0.62 * clamp(o, 0, 1)) });
  }

  /* an emoji drawn as its own black silhouette: a shadow of the real thing */
  function lsSilhouette(cx, cy, size, ch, o) {
    if (!(o > 0)) return "";
    return G(Em(cx, cy, size, ch), { style: "filter:brightness(0)", opacity: n2(clamp(o, 0, 1) * 0.86) });
  }

  /* a word in a pill with a line to the thing it names (the film points with a
     line, never with a character) */
  function lsLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now === false ? P.muted : P.gold;
    var from = anchor === "end" ? x + 8 : anchor === "start" ? x - 8 : x;
    return (to ? MK.leader(from, y, to[0], to[1], on(t, at, 0.6), col) : "") +
      MK.pill(x, y, text, o, { size: size || 26, anchor: anchor || "middle", col: col });
  }

  /* ==== the title ==============================================================
     A torch, a toy and a wall: the beam reaches the wall, the toy stands in it,
     and the wall behind the toy stays dark. In the spoken title chapter the
     beam grows on "Light goes through", the toy drops into it on "blocked by
     others", the blocked wedge darkens on "Where the light is blocked" and the
     dark band on the wall is ringed on "a shadow". On the two cards it stands
     finished. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cLight = s ? sc(s, 0, "light") : null, cBlock = s ? sc(s, 0, "blocked") : null,
      cWhere = s ? sc(s, 1, "where") : null, cShadow = s ? sc(s, 1, "shadow") : null;
    var beam = s ? on(t, cLight, 0.8) : 1, toy = s ? popIn(t, cBlock, 0.5) : 1,
      dark = s ? on(t, cWhere, 0.7) : 1, ring = s ? popIn(t, cShadow, 0.45) : 0;
    var ax = 92, ay = 182, wx = 272, half = 44, k = (wx - ax) / (186 - ax);

    out += R(12, 44, 336, 276, 20, "#12283A", P.line, 3);
    /* the wall, dull until the light reaches it */
    out += R(wx, 60, 62, 244, 4, lsMix("#5E5A50", LS_WALL_LIT, beam));
    out += lsBeam(ax, ay, wx, half, beam);
    out += lsCone(ax, ay, 186, 30, wx, dark * toy);
    /* the dark band on the wall, where the toy blocked the light */
    if (toy > 0 && dark > 0) out += R(wx, ay - 30 * k, 62, 60 * k, 3, LS_SHADOW, null, null, { opacity: n2(dark * Math.min(1, toy)) });
    if (ring > 0) out += R(wx - 4, ay - 30 * k - 4, 70, 60 * k + 8, 6, "none", P.gold, 4, { opacity: n2(Math.min(1, ring)) });
    out += G(Em(186, ay, 60, "\u{1F9F8}"), { transform: around(186, ay, Math.min(toy, 1.1)), opacity: n2(Math.min(1, toy)) });
    out += MK.glow(ax - 6, ay, 54, P.gold, beam * 0.9);
    out += Em(64, ay, 54, "\u{1F526}");
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A torch shining past a toy, with the toy\'s shadow on the wall behind">' + out + "</svg>";
  }

  /* ==== chapter: three kinds of material =========================================
     The lesson's own light tester (ART.sim "lightThrough", the drawing of its
     "Will the light get through?" step), with the three materials that step
     names first: window glass, tracing paper and a book. The beam beyond the
     material and the colour of the wall behind it are the sim's own three
     states - all through, some through, none - so the wall the child sees here
     is the wall the sim shows them. The three words stand beside it, each with
     the picture the step gives that answer. The last line turns into the sort
     step's three bins, with its own items dropping into them. */
  var LS_TEST = { x: 50, y: 48, w: 592, h: 370, k: 1.85 };
  function lsTX(v) { return LS_TEST.x + v * LS_TEST.k; }
  function lsTY(v) { return LS_TEST.y + v * LS_TEST.k; }

  /* the lesson's tester with a material in it, the beam beyond it at `lvl` and
     the wall behind it `wall`: act()'s own three outcomes, drawn */
  function lsTester(pic, lvl, wall) {
    var m = ART.sim("lightThrough", "init");
    var slot = '<g id="lm"></g>', beam = 'opacity="0"/>', w0 = 'fill="#3A3A3A" id="lw"';
    if (m.indexOf(slot) < 0 || m.indexOf(beam) < 0 || m.indexOf(w0) < 0)
      throw new Error("lightThrough.init no longer draws its material, beam and wall the way this film expects");
    return m.replace(slot, '<g id="lm">' + (pic ? ART.glyphAt(150, 118, 48, ART.icon(pic)) : "") + "</g>")
      .replace(beam, 'opacity="' + n2(lvl) + '"/>')
      .replace(w0, 'fill="' + wall + '" id="lw"');
  }

  /* which material is in the tester, and how much light is getting past it */
  var LS_MATS = [
    { pic: "\u{1FA9F}", word: "transparent", got: "all through", lvl: 0.35, wall: LS_WALL_THROUGH, ans: "☀️" },
    { pic: "\u{1F4C4}", word: "translucent", got: "some through", lvl: 0.12, wall: LS_WALL_SOME, ans: "\u{1F324}️" },
    { pic: "\u{1F4D5}", word: "opaque", got: "none", lvl: 0, wall: LS_WALL_OFF, ans: "\u{1F311}" }
  ];
  function lsMatState(t, scene) {
    var cGlass = sc(scene, 0, "glass"), cThrough = sc(scene, 0, "through"),
      cPaper = sc(scene, 2, "paper"), cSome = sc(scene, 2, "some"),
      cBook = sc(scene, 4, "book");
    if (lsPast(t, cBook)) return { k: 2, u: 0, shown: 2, at: cBook };
    if (lsPast(t, cSome)) return { k: 1, u: on(t, cSome, 0.7), shown: 1, at: cPaper };
    if (lsPast(t, cPaper)) return { k: 1, u: 0, shown: 1, at: cPaper };
    if (lsPast(t, cThrough)) return { k: 0, u: on(t, cThrough, 0.7), shown: 0, at: cGlass };
    if (lsPast(t, cGlass)) return { k: 0, u: 0, shown: 0, at: cGlass };
    return { k: 0, u: 0, shown: -1, at: null };
  }

  /* beats 0 to 4: the tester, and the three words beside it */
  function lsMatPic(t, scene) {
    var st = lsMatState(t, scene), m = st.shown < 0 ? null : LS_MATS[st.shown], out = "";
    var cTorch = sc(scene, 0, "torch"), cWall = sc(scene, 1, "wall"), cClear = sc(scene, 1, "clear"),
      cBlur = sc(scene, 2, "blurred"), cShapes = sc(scene, 3, "shapes"), cNone = sc(scene, 4, "none");
    var wall = lsMix(LS_WALL_OFF, m ? m.wall : LS_WALL_OFF, st.u);

    out += R(LS_TEST.x - 8, LS_TEST.y - 8, LS_TEST.w + 16, LS_TEST.h + 16, 18, P.card, P.line, 2);
    out += ART.place(lsTester(m ? m.pic : null, m ? m.lvl * st.u : 0, wall), LS_TEST.x, LS_TEST.y, LS_TEST.w, LS_TEST.h);
    /* the torch, as it is named */
    out += MK.glow(lsTX(30), lsTY(104), 64, P.gold, on(t, cTorch, 0.5) * (0.7 + 0.3 * breathe(t)));
    /* the material, as each one is put in front of the torch */
    out += MK.ripple(lsTX(150), lsTY(100), t, st.at, P.gold);
    /* the wall behind it, ringed on "The wall behind is bright" */
    out += R(lsTX(286), lsTY(6), 28 * LS_TEST.k, 188 * LS_TEST.k, 6, "none", P.gold, 4, { opacity: n2(bump(t, cWall, 1.6)) });
    /* light scattered by the tracing paper: short rays fanning out behind it */
    var blur = bump(t, cBlur, 2.2);
    if (blur > 0) {
      for (var r = 0; r < 7; r++) {
        var a = (r - 3) * 0.19;
        out += L(lsTX(162), lsTY(100), lsTX(162) + Math.cos(a) * 150, lsTY(100) + Math.sin(a) * 150, LS_BEAM, 4,
          { opacity: n2(0.75 * blur), "stroke-dasharray": "9 11" });
      }
    }
    /* you see clearly; no clear shapes; no light at all. Each mark belongs to
       the beat that says it and goes with it: the tick for "you see clearly"
       used to stay on the wall while the next line said "no clear shapes", and
       the cross for that line then popped in on top of it. */
    out += MK.tick(lsTX(300), lsTY(30), 26, popIn(t, cClear, 0.4) * lsOnly(t, scene, 1));
    out += MK.cross(lsTX(300), lsTY(30), 26, popIn(t, cShapes, 0.4) * lsOnly(t, scene, 3));
    out += MK.cross(lsTX(210), lsTY(100), 34, popIn(t, cNone, 0.4) * lsOnly(t, scene, 4));

    /* the three words, each with the picture the lesson's step gives its answer */
    var ys = [110, 225, 340], word = [sc(scene, 1, "word"), sc(scene, 3, "word"), sc(scene, 4, "word")];
    for (var k = 0; k < 3; k++) {
      var o = on(t, word[k], 0.4);
      if (o <= 0) continue;
      var now = st.shown === k;
      out += MK.pill(690, ys[k], LS_MATS[k].word, o, { size: 30, anchor: "start", col: now ? P.gold : P.line });
      out += Tx(696, ys[k] + 46, LS_MATS[k].got, "lab mid muted readable", "start", { opacity: n2(o) });
      /* a word already said stays legible: at 0.45 the sun of "all through"
         went a muddy brown and stopped being a sun */
      out += G(MK.pic(1094, ys[k], 64, LS_MATS[k].ans), { opacity: n2(o * (now ? 1 : 0.72)) });
    }
    return out;
  }

  /* beat 5: the sort step's three bins, with its own items dropping in */
  var LS_BINS = [
    { pic: "\u{1F453}", label: "Transparent", items: ["\u{1F4A7}", "\u{1FA9F}"] },
    { pic: "\u{1F324}️", label: "Translucent", items: ["\u{1F4C4}", "tissue"] },
    { pic: "\u{1F311}", label: "Opaque", items: ["\u{1F944}", "\u{1F9F1}"] }
  ];
  function lsBinPic(t, scene) {
    var at = [sc(scene, 5, "a"), sc(scene, 5, "b"), sc(scene, 5, "c")], out = "";
    /* The three bins arrive WITH the beat, over the same gap the tester fades
       out across, and light as their word is said. They used to wait for the
       "sort it" cue in the middle of the line, which left the stage empty for
       the two seconds before it. */
    var t0 = BEATS[scene.first + 5].start - GAP;
    for (var k = 0; k < 3; k++) {
      var x = 48 + k * 368, o = ease(clamp((t - t0 - k * 0.12) / 0.5, 0, 1));
      if (o <= 0) continue;
      var lit = popIn(t, at[k], 0.4);
      out += R(x, 74, 336, 312, 22, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? P.gold : P.line, lit > 0 ? 3 : 2, { opacity: n2(o) });
      out += G(MK.pic(x + 168, 146, 88, LS_BINS[k].pic), { opacity: n2(o) });
      out += Tx(x + 168, 242, LS_BINS[k].label, "lab big", "middle", { opacity: n2(o), fill: lit > 0 ? P.gold : P.ink });
      for (var j = 0; j < 2; j++) {
        var p = popIn(t, at[k] == null ? null : at[k] + 0.2 + j * 0.22, 0.4);
        if (p <= 0) continue;
        var ix = x + 110 + j * 116, item = LS_BINS[k].items[j];
        out += G(MK.pic(ix, 318, 66, item === "tissue" ? ART.ICONS.tissue : item), { transform: around(ix, 318, Math.min(p, 1.1)), opacity: n2(Math.min(1, p)) });
      }
    }
    return out;
  }

  function lsMaterialsChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k < 5) return svg(lsMatPic(t, scene));
    var u = into(t, scene.first + 5);
    return svg(lsBinPic(t, scene) + (u < 1 ? G(lsMatPic(t, scene), { opacity: n2(1 - u) }) : ""));
  }

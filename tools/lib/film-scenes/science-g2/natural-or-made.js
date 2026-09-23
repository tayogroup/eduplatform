  /* ==== Grade 2 Science, Lesson 4: Natural or Made? ===========================
     tools/lib/film-scenes/science-g2/natural-or-made.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/natural-or-made.json.

     This lesson draws no figure, sim or habitat scene of its own: its steps are
     explore cards, two sort bins, a material tester and a results table. So the
     film's pictures are the lesson's own PICTURES - the kit's drawings for
     wood, rock, glass and the kettle (ART.ICONS, which the lesson shows in
     place of the Emoji 13 characters) and the same emoji the lesson prints for
     wool, plastic, brick, paper, metal and the sponge - arranged as the steps
     the child is about to do.

     This file: the palette, the small drawings every chapter shares, the title
     motif and the chapter "Natural materials". Every top-level name here starts
     with nm, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, natural: P.good, made: P.accent, testing: P.blue,
    waterproof: P.teal, job: P.gold, recap: P.teal
  };

  /* ---- the lesson's own picture for each material ---------------------------
     The Emoji 13 characters (wood, rock, glass, kettle) are swapped for the
     kit's own drawings by ART.icon, which MK.pic calls, exactly as the lesson
     swaps them; the rest are the emoji the lesson prints. ART.ICONS.glass is a
     PANE of glass - the material - which is the lesson's own distinction
     between the window and what it is made of. */
  var NM_PIC = {
    wood: "\u{1FAB5}", stone: "\u{1FAA8}", wool: "\u{1F9F6}",
    plastic: "\u{1F9F4}", brick: "\u{1F9F1}", paper: "\u{1F4C4}", metal: "\u{1F944}",
    sponge: "\u{1F9FD}", tree: "\u{1F333}", sheep: "\u{1F411}", factory: "\u{1F3ED}",
    kettle: "\u{1FAD6}", bike: "\u{1F6B2}", boot: "\u{1F462}", drop: "\u{1F4A7}",
    lens: "\u{1F50D}", torch: "\u{1F526}", press: "\u{1F447}", scissors: "✂️",
    hand: "✋"
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function nmOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function nmFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* a cue plus a delay, without repeating the null test everywhere */
  function nmAfter(at, d) { return at == null ? null : at + d; }
  /* fixed numbers for anything scattered: never Math.random */
  var NM_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.79, 0.46, 0.71, 0.31, 0.86];

  /* ---- small drawings the chapters share --------------------------------------- */

  /* the film's own plate under one of the lesson's drawings */
  function nmTile(cx, cy, w, h, lit, o) {
    if (!(o > 0)) return "";
    return R(cx - w / 2, cy - h / 2, w, h, 18, lit ? "#173A50" : P.cell, lit ? P.gold : P.line, lit ? 3 : 2,
      { opacity: clamp(o, 0, 1) });
  }
  /* the dashed outline of a tile that is not filled yet */
  function nmGhost(cx, cy, w, h, o) {
    if (!(o > 0)) return "";
    return R(cx - w / 2, cy - h / 2, w, h, 18, "none", P.line, 3,
      { "stroke-dasharray": "12 10", opacity: clamp(o, 0, 1) });
  }

  /* a drop of water, its round bottom centred on (x, y) */
  function nmDrop(x, y, r, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", "#7FC4EA") +
      C(x, y, r, "#7FC4EA") + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.75 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* a flame under a furnace or a kettle: three tongues on a fixed wave.
     The WIDE, rounded end sits on the hob at y and the tongue narrows to a tip
     at y - h. Drawn the other way round - a point at the bottom and a bulge on
     top - it reads as a falling drop of water, which is the next chapter. */
  function nmFlame(x, y, s, t, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 3; k++) {
      var w = s * (0.9 - k * 0.22), h = s * (1.5 - k * 0.3) * (0.88 + 0.12 * Math.sin(t * 7 + k * 1.7));
      var col = k === 0 ? "#F0806F" : k === 1 ? "#F4C95D" : "#FFF2C4";
      out += Pth("M" + n2(x - w * 0.62) + "," + n2(y) +
        " C" + n2(x - w * 0.88) + "," + n2(y - h * 0.44) + " " + n2(x - w * 0.34) + "," + n2(y - h * 0.58) + " " + n2(x) + "," + n2(y - h) +
        " C" + n2(x + w * 0.34) + "," + n2(y - h * 0.58) + " " + n2(x + w * 0.88) + "," + n2(y - h * 0.44) + " " + n2(x + w * 0.62) + "," + n2(y) +
        " C" + n2(x + w * 0.3) + "," + n2(y + h * 0.09) + " " + n2(x - w * 0.3) + "," + n2(y + h * 0.09) + " " + n2(x - w * 0.62) + "," + n2(y) +
        " Z", col);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a heap of sand, for "glass is made by melting sand" */
  function nmSand(cx, baseY, w, o) {
    if (!(o > 0)) return "";
    var h = w * 0.42;
    var out = Pth("M" + n2(cx - w / 2) + "," + n2(baseY) + " Q" + n2(cx) + "," + n2(baseY - h * 1.9) + " " +
      n2(cx + w / 2) + "," + n2(baseY) + " Z", "#E3C98C", "#C9A85F", 3);
    for (var k = 0; k < 8; k++) {
      out += C(cx - w * 0.34 + NM_SCATTER[k] * w * 0.68, baseY - 7 - NM_SCATTER[(k + 4) % 12] * h * 0.8, 2.6, "#B9944F");
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a block of ground with a stone still in it: where stone is dug from. The
     kit's own soil drawing has a seedling growing out of it, which would say
     "a plant" beside a line about digging up rock, so this one is the film's. */
  function nmGroundBlock(cx, cy, w, h, o) {
    if (!(o > 0)) return "";
    var x = cx - w / 2, y = cy - h / 2, top = y + h * 0.4, bot = y + h;
    /* the ground: a flat surface with a gentle roll, and the earth under it */
    var d = "M" + n2(x) + "," + n2(top + 4) + " Q" + n2(x + w * 0.3) + "," + n2(top - 7) + " " +
      n2(x + w * 0.55) + "," + n2(top + 2) + " Q" + n2(x + w * 0.8) + "," + n2(top + 9) + " " +
      n2(x + w) + "," + n2(top + 1) + " L" + n2(x + w) + "," + n2(bot) + " L" + n2(x) + "," + n2(bot) + " Z";
    var out = Pth(d, "#6E4520", "#8A5A2E", 5);
    for (var k = 0; k < 7; k++) {
      out += C(x + 12 + NM_SCATTER[k] * (w - 24), top + 26 + NM_SCATTER[(k + 5) % 12] * (bot - top - 36), 3.4, "#9C7048");
    }
    /* the stone, half in the ground and half out of it */
    var sx = cx, sy = top + 4, r = w * 0.3;
    out += Pth("M" + n2(sx - r) + "," + n2(sy + r * 0.66) + " L" + n2(sx - r * 1.06) + "," + n2(sy - r * 0.1) +
      " L" + n2(sx - r * 0.2) + "," + n2(sy - r * 0.78) + " L" + n2(sx + r * 0.92) + "," + n2(sy - r * 0.2) +
      " L" + n2(sx + r * 0.86) + "," + n2(sy + r * 0.66) + " Z", "#8F8F8F", "#555555", 4);
    out += Pth("M" + n2(sx - r * 0.2) + "," + n2(sy - r * 0.78) + " L" + n2(sx - r * 1.06) + "," + n2(sy - r * 0.1) +
      " L" + n2(sx + r * 0.92) + "," + n2(sy - r * 0.2) + " Z", "#A8A8A8");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ==================================================================
     The lesson's own question as one picture: a round window split down the
     middle, a tree growing on one side and a factory standing on the other. In
     the spoken title chapter each half lights as it is said, and the two badges
     are the lecture's own part icons: the lens of "Testing for properties" on
     "test materials", and the kettle of "Chosen for the job" on "why each one
     is chosen". On the two cards it simply stands. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene || null, out = "";
    var nat = sn ? popIn(t, sc(sn, 0, "nature"), 0.5) : 1;
    var man = sn ? popIn(t, sc(sn, 0, "people"), 0.5) : 1;
    var tst = sn ? popIn(t, sc(sn, 1, "test"), 0.45) : 1;
    var why = sn ? popIn(t, sc(sn, 1, "why"), 0.45) : 1;
    out += el("clipPath", { id: "nmTitleClip" }, C(180, 180, 170));
    out += C(180, 180, 170, "#123247");
    out += G(
      R(10, 244, 340, 110, 0, "#1B3A2B") +
      MK.glow(102, 190, 112, P.good, Math.min(1, nat) * 0.9) +
      G(MK.pic(102, 186, 130, NM_PIC.tree), { opacity: Math.min(1, nat) }) +
      MK.glow(258, 196, 108, P.accent, Math.min(1, man) * 0.9) +
      G(MK.pic(258, 192, 120, NM_PIC.factory), { opacity: Math.min(1, man) }),
      { "clip-path": "url(#nmTitleClip)" });
    out += L(180, 22, 180, 338, P.gold, 4, { "stroke-dasharray": "12 10", opacity: 0.85 });
    out += C(180, 180, 170, "none", P.line, 3);
    out += MK.pop(C(180, 312, 44, "#0E2434", P.gold, 3) + MK.pic(180, 312, 42, NM_PIC.lens), 180, 312, tst);
    out += MK.pop(C(292, 70, 40, "#0E2434", P.gold, 3) + MK.pic(292, 70, 38, NM_PIC.kettle), 292, 70, why);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circle split in two: a tree on one side, a factory on the other">' + out + "</svg>";
  }

  /* ==== chapter: natural materials ==================================================
     The lesson's first three explore cards, as three "where it came from"
     groups: a tree gives wood, a sheep gives wool, the ground gives stone. Each
     group is built on its own beat, and on the last beat all three are bright,
     each is ticked, and a factory is crossed out for "People do not make it". */
  var NM_GRP = [196, 584, 972];

  /* `named` is how bright this group is on the LAST beat, where the rule is
     read: the two that grow light on "grows" and the dug one on "dug up", so
     each half of the rule points at its own groups rather than all three
     brightening at once (rule 3). */
  function nmGroupOp(t, scene, k, named) {
    var intro = nmFrom(t, scene, k), cur = nmOnly(t, scene, k), last = nmFrom(t, scene, 3);
    return intro * (0.45 + 0.55 * Math.max(cur, last * Math.max(0.35, named || 0)));
  }

  /* one group: the source on the left, an arrow, the material on the right.
     opt: {srcSize, matSize, rot (the material turned, 0..1), srcDraw (markup
     drawn instead of a picture, already placed)} */
  function nmSource(cx, srcPic, matPic, name, srcAt, matAt, arrAt, t, opt) {
    opt = opt || {};
    var lit = on(t, matAt, 0.4), sp = popIn(t, srcAt, 0.45), out = "";
    out += nmTile(cx + 96, 142, 172, 200, lit > 0.5, lit);
    out += MK.pop(G(MK.pic(cx + 96, 138, opt.matSize || 112, matPic),
      opt.rot ? { transform: "rotate(" + n2(opt.rot * 320) + " " + n2(cx + 96) + " 138)" } : {}),
      cx + 96, 138, popIn(t, matAt, 0.45));
    out += MK.pop(opt.srcDraw ? opt.srcDraw : MK.pic(cx - 108, 138, opt.srcSize || 118, srcPic), cx - 108, 138, sp);
    out += MK.arrow(cx - 44, 140, cx + 4, 140, on(t, arrAt, 0.5), P.gold, 8);
    out += MK.pill(cx + 96, 268, name, lit, { size: 28, col: P.gold });
    return out;
  }

  function nmNaturalChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var gr = c(3, "grows"), dg = c(3, "dug"), pe = c(3, "people"), out = "";
    /* each group is ticked as ITS OWN line calls it natural - "it is natural",
       "It is natural", "natural too" - not all three at the rule beat */
    var lit3 = [on(t, gr, 0.4), on(t, gr, 0.4), on(t, dg, 0.4)];

    /* wood comes from trees */
    out += G(
      nmSource(NM_GRP[0], NM_PIC.tree, NM_PIC.wood, "wood", c(0, "trees"), c(0, "wood"), c(0, "grows"), t) +
      MK.tick(NM_GRP[0] + 96, 340, 24, popIn(t, c(0, "natural"), 0.4)),
      { opacity: nmGroupOp(t, scene, 0, lit3[0]) });

    /* wool comes from sheep: cut off with the shears, and spun */
    out += G(
      nmSource(NM_GRP[1], NM_PIC.sheep, NM_PIC.wool, "wool", c(1, "sheep"), c(1, "wool"), c(1, "grows"), t,
        { rot: on(t, c(1, "spun"), 1.2) }) +
      MK.pop(Em(NM_GRP[1] - 46, 56, 50, NM_PIC.scissors), NM_GRP[1] - 46, 56,
        popIn(t, c(1, "cut"), 0.4) * nmOnly(t, scene, 1)) +
      MK.tick(NM_GRP[1] + 96, 340, 24, popIn(t, c(1, "natural"), 0.4)),
      { opacity: nmGroupOp(t, scene, 1, lit3[1]) });

    /* stone is dug out of the ground */
    out += G(
      nmSource(NM_GRP[2], null, NM_PIC.stone, "stone", c(2, "stone"), c(2, "stone"), c(2, "dug"), t,
        { srcDraw: nmGroundBlock(NM_GRP[2] - 108, 140, 126, 130, 1) }) +
      MK.tick(NM_GRP[2] + 96, 340, 24, popIn(t, c(2, "too"), 0.4)),
      { opacity: nmGroupOp(t, scene, 2, lit3[2]) });

    /* the last beat: the rule, and the factory that made none of it */
    var rule = on(t, c(3, "natural"), 0.5);
    if (rule > 0) out += MK.pill(340, 390, "natural: it grows, or it is dug up", rule,
      { size: 31, col: P.good, ink: P.ink });
    var pp = popIn(t, pe, 0.45);
    if (pp > 0) {
      out += MK.pop(MK.pic(744, 388, 80, NM_PIC.factory), 744, 388, pp);
      out += MK.cross(744, 388, 36, popIn(t, nmAfter(pe, 0.3), 0.4));
      out += MK.pill(966, 390, "people made none of it", on(t, nmAfter(pe, 0.25), 0.5),
        { size: 26, col: P.bad });
    }
    return svg(out);
  }


  /* ==== chapters: a backbone inside, and no backbone ===========================
     tools/lib/film-scenes/science-g4/backbone-or-not-2.js.

     "A backbone inside" is the lesson's own skeleton (ART.figure("skeleton")),
     with the same chain of small bones drawn big beside it, and then in a
     panel under each of the lecture's five vertebrates. "No backbone" is the
     lecture's four soft invertebrates, each with that panel empty: the chain
     as an outline only, crossed out - where a backbone would be, and is not. */

  /* a pill with a leader that starts at the pill's own edge, so the line never
     runs under the word (MK.pill's width, from its own arithmetic) */
  function bnTag(t, cx, cy, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 28;
    var w = String(text).length * size * 0.56 + size * 1.3;
    var ex = to[0] < cx ? cx - w / 2 - 4 : cx + w / 2 + 4;
    return MK.leader(ex, cy, to[0], to[1], on(t, at, 0.6), now ? P.gold : P.muted) +
      MK.pill(cx, cy, text, o, { size: size, col: now ? P.gold : P.line });
  }

  /* What is inside this animal: a small panel under it holding the same chain
     of bones the film has just drawn big, or - for an invertebrate - that
     chain as an outline only, crossed out.

     Two earlier cuts were wrong, and both were caught in the sheets rather
     than by reading the code. The chain drawn ALONG each animal's back sat
     over the frog's eyes and above the fish's fin, and read as something
     stuck on top; the same chain inside a dark lens on the animal's body read
     as a mouthful of TEETH, on the frog exactly where its mouth is. A panel
     below the animal is plainly a diagram of what is in it, and needs no
     guess about where a cartoon animal's spine runs. */
  var BN_PANEL_Y = 258, BN_PANEL_W = 108, BN_PANEL_H = 48;
  function bnInsidePanel(cx, o, empty, u) {
    if (!(o > 0)) return "";
    var pts = [[cx - 37, BN_PANEL_Y], [cx + 37, BN_PANEL_Y]];
    return G(L(cx, BN_PANEL_Y - BN_PANEL_H / 2 - 4, cx, BN_PANEL_Y - BN_PANEL_H / 2 - 22, empty ? P.muted : P.gold, 3) +
      R(cx - BN_PANEL_W / 2, BN_PANEL_Y - BN_PANEL_H / 2, BN_PANEL_W, BN_PANEL_H, 14, P.cell, empty ? P.muted : P.gold, 2) +
      (empty ? bnGhostSpine(pts, 5, u, 23, 1) + MK.cross(cx, BN_PANEL_Y, 15, clamp((u - 0.62) / 0.3, 0, 1))
             : bnSpine(pts, 5, u, 23, 1)),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the lesson's skeleton, placed ------------------------------------------- */
  var BN_SKEL = { x: 24, y: 12, w: 257.5, h: 416 };     /* 260 x 420 */
  function bnKX(v) { return BN_SKEL.x + v * BN_SKEL.w / 260; }
  function bnKY(v) { return BN_SKEL.y + v * BN_SKEL.h / 420; }
  /* the figure with only the spine lit, once `lit` is true */
  function bnSkeleton(lit) {
    var fig = ART.figure("skeleton");
    if (!lit) return fig;
    BN_SKEL_REST.forEach(function (p) { fig = ART.dim(fig, p, 0.35); });
    return ART.ring(fig, "spine", "#F4C95D", 7);
  }

  /* ==== chapter: a backbone inside ==================================================
     beat 0  the lesson's skeleton; its spine rings gold, the same twelve small
             bones stand big beside it, and the soft body fades in over them
     beats 1-2  the lecture's five animals, a backbone in a panel under each
     beat 3  the five groups, ticked, and your own skeleton for "So are you" */

  var BN_CHAIN = { x: 760, top: 40, bot: 400, n: 12, size: 36 };
  function bnBigChain(t, at, small) {
    var out = R(BN_CHAIN.x - 46, BN_CHAIN.top - 18, 92, BN_CHAIN.bot - BN_CHAIN.top + 36, 26, P.cell, P.line, 2, { opacity: on(t, at, 0.5) });
    out += bnSpine([[BN_CHAIN.x, BN_CHAIN.top], [BN_CHAIN.x, BN_CHAIN.bot]], BN_CHAIN.n,
      on(t, small, 1.1), BN_CHAIN.size, on(t, at, 0.5));
    return out;
  }

  function bnSpinePic(t, scene) {
    var cBack = sc(scene, 0, "backbone"), cSpine = sc(scene, 0, "spine"),
      cSmall = sc(scene, 0, "small"), cIn = sc(scene, 0, "inside");
    var lit = cBack != null && t >= cBack, out = "";
    out += bnCard(14, 2, 278, 436);
    out += ART.place(bnSkeleton(lit), BN_SKEL.x, BN_SKEL.y, BN_SKEL.w, BN_SKEL.h);
    out += G(bnSoftBody(on(t, cIn, 0.7)), { transform: tr(BN_SKEL.x, BN_SKEL.y, BN_SKEL.w / 260) });
    if (lit) out += MK.glow(bnKX(130), bnKY(180), 96, P.gold, on(t, cBack, 0.6) * (0.55 + 0.45 * breathe(t)));
    out += bnTag(t, 440, 66, "backbone", cBack, [bnKX(146), bnKY(120)], true);
    /* the same bones, big: a line from the figure's spine to the chain beside it */
    out += MK.leader(BN_CHAIN.x - 52, 200, bnKX(150), 200, on(t, cSpine, 0.7), P.gold);
    out += bnBigChain(t, cSpine, cSmall);
    out += bnTag(t, 1010, 200, "small bones", cSmall, [BN_CHAIN.x + 48, 200], true);
    out += bnTag(t, 440, 372, "inside you", cIn, [bnKX(150), bnKY(346)], true);
    return out;
  }

  /* the five vertebrates of the lecture, a backbone in a panel under each */
  var BN_VERT_ROW = [
    { at: "dog", pic: "\u{1F415}", name: "dog" },
    { at: "bird", pic: "\u{1F426}", name: "bird" },
    { at: "fish", pic: "\u{1F41F}", name: "fish" },
    { at: "frog", pic: "\u{1F438}", name: "frog" },
    { at: "snake", pic: "\u{1F40D}", name: "snake" }
  ];
  var BN_ROW_X = [154, 374, 594, 814, 1034], BN_ROW_Y = 164, BN_ROW_S = 124;

  function bnVertRowPic(t, scene) {
    var out = "", cWith = sc(scene, 2, "with"), cVert = sc(scene, 2, "vert");
    var latest = -1;
    BN_VERT_ROW.forEach(function (a, k) { if (sc(scene, 1, a.at) != null && t >= sc(scene, 1, a.at)) latest = k; });
    BN_VERT_ROW.forEach(function (a, k) {
      var at = sc(scene, 1, a.at), p = popIn(t, at, 0.4);
      if (!(p > 0)) return;
      var x = BN_ROW_X[k], now = k === latest;
      out += G(MK.pop(MK.pic(x, BN_ROW_Y, BN_ROW_S, a.pic), x, BN_ROW_Y, p), { opacity: now ? 1 : 0.86 });
      /* what is inside it: the same chain of small bones, in a panel below */
      var flash = bump(t, cWith == null ? null : cWith + k * 0.08, 1.0);
      out += bnInsidePanel(x, on(t, at == null ? null : at + 0.12, 0.45), false,
        on(t, at == null ? null : at + 0.12, 0.7));
      if (flash > 0.15) out += R(x - BN_PANEL_W / 2, BN_PANEL_Y - BN_PANEL_H / 2, BN_PANEL_W, BN_PANEL_H, 14,
        "none", P.gold, 4, { opacity: flash });
      out += MK.pill(x, 324, a.name, Math.min(1, p), { size: 25, col: now ? P.gold : P.line });
    });
    /* the word for what has just been drawn under every one of them */
    var vo = popIn(t, cVert, 0.45);
    if (vo > 0) {
      out += MK.pop(MK.pic(378, 400, 58, "\u{1F9B4}"), 378, 400, vo);
      out += MK.pill(600, 400, "vertebrates", Math.min(1, vo), { size: 38, col: P.gold, ink: P.gold });
    }
    return out;
  }

  /* the five groups, ticked as they are said, and your own skeleton for "you" */
  var BN_GROUPS = [
    { at: "mammals", text: "Mammals" }, { at: "birds", text: "Birds" }, { at: "fish", text: "Fish" },
    { at: "reptiles", text: "Reptiles" }, { at: "amphibians", text: "Amphibians" }
  ];
  function bnGroupsPic(t, scene) {
    var cYou = sc(scene, 3, "you"), out = "";
    out += MK.list(90, 106, BN_GROUPS.map(function (g) {
      return { text: g.text, at: sc(scene, 3, g.at), mark: "tick" };
    }), t, { lh: 64, cls: "lab big", markR: 20 });
    var yo = on(t, cYou, 0.5);
    out += bnCard(820, 14, 268, 412, 0.35 + 0.65 * yo);
    out += G(ART.place(bnSkeleton(yo > 0.4), 830, 24, 247.6, 400), { opacity: 0.4 + 0.6 * yo });
    if (yo > 0) {
      out += MK.glow(954, 210, 110, P.gold, yo * (0.5 + 0.5 * breathe(t)));
      out += MK.tick(700, 210, 30, popIn(t, cYou == null ? null : cYou + 0.25, 0.4));
      out += MK.pill(700, 300, "you", Math.min(1, popIn(t, cYou, 0.4)), { size: 32, col: P.gold });
    }
    return out;
  }

  function bnVertChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(bnSpinePic(t, scene));
    if (k === 3) {
      var u = into(t, i);
      return svg(bnGroupsPic(t, scene) + (u < 1 ? G(bnVertRowPic(t, scene), { opacity: 1 - u }) : ""));
    }
    /* beats 1 and 2 are one picture that grows, so nothing flickers between them */
    if (k === 1) {
      var v = into(t, i);
      return svg(bnVertRowPic(t, scene) + (v < 1 ? G(bnSpinePic(t, scene), { opacity: 1 - v }) : ""));
    }
    return svg(bnVertRowPic(t, scene));
  }

  /* ==== chapter: no backbone ========================================================
     beat 0  the kit's worm, and beside it the chain drawn as an outline only:
             where a backbone would be. Crossed out on "no bones at all"
     beat 1  the lecture's other three: a slug the film draws, the kit's
             jellyfish, an octopus
     beat 2  the word, with the lesson's own "no backbone" bin picture
     beat 3  most animals in the world: a long bar and a short one */

  function bnWormPic(t, scene) {
    var cWorm = sc(scene, 0, "worm"), cNo = sc(scene, 0, "no"), cBones = sc(scene, 0, "bones");
    var out = "", p = popIn(t, cWorm, 0.45);
    out += MK.pop(MK.pic(330, 210, 300, "\u{1FAB1}"), 330, 210, p);
    out += MK.pill(330, 352, "worm", Math.min(1, p), { size: 30, col: P.gold });
    /* where a backbone would be: the same chain, as an outline, and nothing in it */
    var go = on(t, cNo, 0.5);
    out += R(710, 60, 396, 300, 24, P.cell, P.line, 2, { opacity: go, "stroke-dasharray": "12 8" });
    out += bnGhostSpine([[908, 108], [908, 312]], 8, on(t, cNo, 0.9), 34, go);
    out += Tx(908, 402, "no backbone", "lab big muted", "middle", { opacity: go });
    out += MK.cross(908, 210, 76, popIn(t, cBones, 0.5));
    return out;
  }

  var BN_SOFT_X = [170, 460, 750, 1032], BN_SOFT_Y = 160, BN_SOFT_S = 158;
  function bnSoftRowPic(t, scene) {
    var out = "", cInv = sc(scene, 2, "inv"), cWithout = sc(scene, 2, "without");
    var row = [
      { at: sc(scene, 0, "worm"), name: "worm", draw: function () { return MK.pic(BN_SOFT_X[0], BN_SOFT_Y, BN_SOFT_S, "\u{1FAB1}"); } },
      { at: sc(scene, 1, "slug"), name: "slug", draw: function () { return bnSlug(BN_SOFT_X[1], BN_SOFT_Y, BN_SOFT_S * 0.71, 1); } },
      { at: sc(scene, 1, "jelly"), name: "jellyfish", draw: function () { return MK.pic(BN_SOFT_X[2], BN_SOFT_Y, BN_SOFT_S, "\u{1FABC}"); } },
      { at: sc(scene, 1, "octopus"), name: "octopus", draw: function () { return MK.pic(BN_SOFT_X[3], BN_SOFT_Y, BN_SOFT_S, "\u{1F419}"); } }
    ];
    var latest = -1;
    row.forEach(function (r, k) { if (r.at != null && t >= r.at) latest = k; });
    row.forEach(function (r, k) {
      var p = popIn(t, r.at, 0.4);
      if (!(p > 0)) return;
      var now = k === latest, x = BN_SOFT_X[k];
      out += G(MK.pop(r.draw(), x, BN_SOFT_Y, p) +
        bnInsidePanel(x, on(t, r.at == null ? null : r.at + 0.12, 0.45), true,
          on(t, r.at == null ? null : r.at + 0.12, 0.8)) +
        MK.pill(x, 324, r.name, Math.min(1, p), { size: 25, col: now ? P.gold : P.line }),
        { opacity: now ? 1 : 0.58 });
      /* "Animals without a backbone": each empty panel glows in turn, the
         same staggered wave the vertebrate row's panels flash on "with a
         backbone" - a bright colour here rather than the vert row's gold,
         since a gold ring on an already-gold panel border barely showed
         (checked in the sheets: the "start" and "with" stills read alike) */
      var flash = bump(t, cWithout == null ? null : cWithout + k * 0.08, 1.0);
      if (flash > 0.05) out += MK.glow(x, BN_PANEL_Y, 70, P.accent, flash * 0.6) +
        R(x - BN_PANEL_W / 2, BN_PANEL_Y - BN_PANEL_H / 2, BN_PANEL_W, BN_PANEL_H, 14,
          "none", P.accent, 4, { opacity: flash });
    });
    var vo = popIn(t, cInv, 0.45);
    if (vo > 0) {
      out += MK.pop(MK.pic(340, 400, 56, "\u{1F6AB}"), 340, 400, vo);
      out += MK.pill(600, 400, "invertebrates", Math.min(1, vo), { size: 36, col: P.plum, ink: P.plum });
    }
    return out;
  }

  /* most animals in the world: two bars, no numbers - the lesson gives none */
  function bnMostPic(t, scene) {
    var cMost = sc(scene, 3, "most"), cWorld = sc(scene, 3, "world"), cInv = sc(scene, 3, "inv");
    var out = "", wo = popIn(t, cWorld, 0.5);
    out += MK.pop(Em(190, 220, 230, "\u{1F30D}"), 190, 220, wo);
    var a = on(t, cInv, 0.9), b = on(t, cMost, 0.7);
    out += Tx(400, 118, "invertebrates", "lab big", "start", { fill: P.plum });
    out += R(400, 134, 680 * a, 62, 16, P.plum, null, null, { opacity: 0.9 });
    out += Tx(400, 272, "vertebrates", "lab big", "start", { fill: P.blue });
    out += R(400, 288, 116 * b, 62, 16, P.blue, null, null, { opacity: 0.9 });
    out += MK.pill(880, 388, "most animals", on(t, cMost, 0.5), { size: 30, col: P.plum });
    return out;
  }

  function bnInvertChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(bnWormPic(t, scene));
    if (k === 3) {
      var u = into(t, i);
      return svg(bnMostPic(t, scene) + (u < 1 ? G(bnSoftRowPic(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 1) {
      var v = into(t, i);
      return svg(bnSoftRowPic(t, scene) + (v < 1 ? G(bnWormPic(t, scene), { opacity: 1 - v }) : ""));
    }
    return svg(bnSoftRowPic(t, scene));
  }

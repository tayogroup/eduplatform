  /* ==== chapters: light into the eye, what people used to think, and the recap
     tools/lib/film-scenes/science-g3/light-and-shadows-4.js.

     The lesson's fourth and fifth lecture parts have no drawing of their own -
     its context step is four emoji cards - so the torch, the Sun, the toy and
     the eye are drawn here, in the same gold the lesson's light sims use for
     their beams. The dark room IS one of the kit's drawings (SIMS.darkRoom,
     "A room, completely dark"), so it is the kit's, lit and then unlit, which
     is what the line says happens. */

  /* ---- things both chapters draw --------------------------------------------- */

  /* an eye looking right (dx 1) or left (dx -1); the pupil opens with `wide`.
     The pupil is always smaller than the iris round it: at wide = 1 the two
     radii used to be equal, so the brown iris vanished and the eye read as a
     dark disc with a white blob in it. */
  function lsEye(cx, cy, s, dx, wide, o) {
    if (!(o > 0)) return "";
    var g = dx * s * 0.2, p = s * (0.16 + 0.2 * clamp(wide, 0, 1));
    return G(Pth("M" + n2(cx - s) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy - s * 0.76) + " " + n2(cx + s) + "," + n2(cy) +
        " Q" + n2(cx) + "," + n2(cy + s * 0.76) + " " + n2(cx - s) + "," + n2(cy) + " Z", "#FFFFFF", P.edge, 3) +
      C(cx + g, cy, s * 0.42, "#6B4A2B") + C(cx + g, cy, p, "#0B1D2C") +
      C(cx + g - s * 0.13, cy - s * 0.15, s * 0.07, "#FFFFFF"),
      { opacity: n2(clamp(o, 0, 1)) });
  }

  /* short rays around (cx, cy): a thing making light of its own */
  function lsRays(cx, cy, r0, r1, n, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < n; k++) {
      var a = (k / n) * Math.PI * 2 - Math.PI / 2;
      out += L(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1,
        P.gold, 6, { opacity: n2(0.9 * clamp(o, 0, 1)) });
    }
    return out;
  }

  /* one of the film's own chapters by id, so a recap card can ask for a cue */
  function lsScene(id) {
    for (var k = 0; k < F.scenes.length; k++) if (F.scenes[k].id === id) return F.scenes[k];
    return null;
  }

  /* ---- light into the eye -------------------------------------------------------
     Beat 0: the torch and the Sun side by side, each making its own light.
     Beat 1: the light's journey - out of the torch, off the toy of the
     experiment two chapters back, and into an eye. Beats 2 and 3: the kit's own
     room, which goes dark as the line says "a completely dark room". */

  /* one light source on a card, its rays coming out on "their own light" */
  function lsSourceCard(cx, pic, p, own, t) {
    if (!(p > 0)) return "";
    return G(R(cx - 176, 96, 352, 236, 22, P.card, P.line, 2) +
      MK.glow(cx, 196, 116, P.gold, own * (0.7 + 0.3 * breathe(t))) +
      lsRays(cx, 196, 74, 108, 8, own) +
      Em(cx, 196, 118, pic) +
      Tx(cx, 302, "makes its own light", "lab mid muted readable", "middle"),
      { transform: around(cx, 214, Math.min(p, 1.1)), opacity: n2(Math.min(1, p)) });
  }

  function lsSourcesPic(t, scene) {
    var cTorch = sc(scene, 0, "torch"), cSun = sc(scene, 0, "sun"),
      cSrc = sc(scene, 0, "sources"), cOwn = sc(scene, 0, "own");
    var own = on(t, cOwn, 0.6), out = "";
    out += lsSourceCard(346, "\u{1F526}", popIn(t, cTorch, 0.45), own, t);
    out += lsSourceCard(822, "☀️", popIn(t, cSun, 0.45), own, t);
    out += MK.pill(584, 388, "light source", on(t, cSrc, 0.45), { size: 34, col: P.gold });
    return out;
  }

  /* the journey: torch -> toy -> eye */
  var LS_EY = { tx: 150, ty: 306, ox: 556, oy: 318, ex: 952, ey: 126 };
  function lsRayPic(t, scene) {
    var cSrc = sc(scene, 1, "source"), cBou = sc(scene, 1, "bounces"), cEye = sc(scene, 1, "eye");
    var a = on(t, cSrc, 0.7), b = on(t, cEye, 0.6), out = "";

    out += MK.glow(LS_EY.tx + 16, LS_EY.ty, 92, P.gold, (0.35 + 0.65 * a) * (0.7 + 0.3 * breathe(t)));
    out += Em(LS_EY.tx, LS_EY.ty, 112, "\u{1F526}");
    /* out of the torch and on to the toy */
    out += MK.arrow(LS_EY.tx + 66, LS_EY.ty - 4, LS_EY.ox - 80, LS_EY.oy - 4, a, P.gold, 8);
    out += Em(LS_EY.ox, LS_EY.oy, 132, "\u{1F9F8}");
    /* it bounces off, and goes UP to the eye, so the turn is the bounce */
    out += MK.ripple(LS_EY.ox - 30, LS_EY.oy - 34, t, cBou, P.gold);
    out += MK.pill(LS_EY.ox, 414, "bounces off", on(t, cBou, 0.4), { size: 28, col: P.gold });
    out += MK.arrow(LS_EY.ox + 72, LS_EY.oy - 46, LS_EY.ex - 66, LS_EY.ey + 54, b, P.gold, 8);
    out += lsEye(LS_EY.ex, LS_EY.ey, 76, -1, b, b);
    out += MK.pill(LS_EY.ex, 238, "your eye", b, { size: 28, col: P.gold });
    return out;
  }

  /* the kit's own room, lit, and with the light gone out */
  function lsRoomCard(dark) {
    return ART.place(ART.sim("darkRoom", "draw", true, !dark), 96, 52, 592, 370);
  }
  function lsDarkPic(t, scene) {
    var cSee = sc(scene, 2, "see"), cDark = sc(scene, 2, "dark"), cNothing = sc(scene, 2, "nothing");
    var cHard = sc(scene, 3, "hard"), cNo = sc(scene, 3, "nolight");
    var d = on(t, cDark, 0.9), out = "";

    out += R(88, 44, 608, 386, 18, P.card, P.line, 2);
    if (d < 1) out += G(lsRoomCard(false), { opacity: n2(1 - d) });
    if (d > 0) out += G(lsRoomCard(true), { opacity: n2(d) });
    /* the room's own words, which it prints too dark to read on this stage */
    out += Tx(392, 252, "no light at all", "lab big muted", "middle", { opacity: n2(d) });
    /* an eye beside it, looking, and finding nothing. "However hard you look"
       opens the pupil wide and leans the whole eye in - it must NOT be drawn
       as lines going out from the eye towards the room, which is the eye-beam
       idea the very next chapter exists to correct. */
    var look = on(t, cHard, 0.5);
    out += G(lsEye(920, 214, 86, -1, 0.15 + 0.85 * look, 1),
      { transform: around(920, 214, 1 + 0.12 * look) });
    /* "that is how you see": the room is still lit, and the eye can */
    out += MK.tick(920, 84, 32, popIn(t, cSee, 0.4) * (1 - d));
    out += MK.cross(1076, 214, 44, popIn(t, cNothing, 0.4));
    out += MK.pill(920, 368, "no light to see by", on(t, cNo, 0.45), { size: 26, col: P.muted, ink: P.muted });
    return out;
  }

  function lsEyeChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(lsSourcesPic(t, scene));
    if (k === 1) {
      var u = into(t, i);
      return svg(lsRayPic(t, scene) + (u < 1 ? G(lsSourcesPic(t, scene), { opacity: n2(1 - u) }) : ""));
    }
    /* the room comes in LIT, over the gap before "That is how you see", and its
       lamp goes out inside it as the line reaches "a completely dark room" */
    var v = into(t, scene.first + 2), out = "";
    if (v < 1) out += G(lsRayPic(t, scene), { opacity: n2(1 - v) });
    out += G(lsDarkPic(t, scene), v < 1 ? { opacity: n2(v) } : {});
    return svg(out);
  }

  /* ---- what people used to think ------------------------------------------------
     The first two cards of the lesson's context step, side by side: "beams from
     the eyes", which is what people thought, and "light into the eye", which
     testing showed. The old idea is crossed out and dimmed as the line says it
     was wrong, and the arrow between them is what testing changed. */
  var LS_TH = { ax: 24, bx: 624, y: 46, w: 520, h: 310 };
  function lsThenCard(x, title, o) {
    return R(x, LS_TH.y, LS_TH.w, LS_TH.h, 22, P.card, P.line, 2, { opacity: n2(o) }) +
      Tx(x + LS_TH.w / 2, LS_TH.y + 52, title, "lab big", "middle", { opacity: n2(o), fill: P.gold });
  }

  function lsThenChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLong = c(0, "long"), cBeams = c(0, "beams");
    var cSens = c(1, "sensible"), cWrong = c(1, "wrong");
    var cTest = c(2, "testing"), cSrc = c(2, "source"), cEye = c(2, "eye");
    var cSci = c(3, "science"), cIdeas = c(3, "test");
    var old = on(t, cLong, 0.5), wrong = on(t, cWrong, 0.6), out = "";
    /* alone on the stage the old idea stands in the middle, and slides left as
       the other card arrives, so neither beat is half an empty screen */
    var dx = lerp(300, 0, on(t, cTest, 0.9));

    /* what people thought: beams coming OUT of the eye */
    if (old > 0) {
      var left = lsThenCard(LS_TH.ax, "Long ago", old);
      var beams = on(t, cBeams, 0.8);
      left += lsEye(150, 216, 62, 1, 0.4, old);
      left += Em(430, 216, 104, "\u{1F9F8}", { opacity: n2(old) });
      for (var r = 0; r < 3; r++) {
        left += MK.arrow(212, 216 + (r - 1) * 16, lerp(212, 366, beams), 216 + (r - 1) * 46, beams > 0 ? 1 : 0, P.plum, 6);
      }
      left += MK.pill(284, 330, "seemed sensible", on(t, cSens, 0.45) * (1 - 0.7 * wrong),
        { size: 24, col: P.muted, ink: P.muted });
      out += G(left, { opacity: n2(1 - 0.62 * wrong), transform: tr(dx, 0) });
    }
    out += G(MK.cross(284, 216, 76, popIn(t, cWrong, 0.45)), { transform: tr(dx, 0) });

    /* what testing showed: a source, a thing, and the light going in */
    var now = on(t, cTest, 0.5);
    if (now > 0) {
      var right = lsThenCard(LS_TH.bx, "Testing showed", now);
      var a = on(t, cSrc, 0.7), b = on(t, cEye, 0.7);
      right += MK.glow(712, 168, 60, P.gold, now * (0.5 + 0.5 * a));
      right += Em(704, 168, 78, "\u{1F526}", { opacity: n2(now) });
      right += Em(884, 286, 96, "\u{1F9F8}", { opacity: n2(now) });
      right += MK.arrow(742, 200, 834, 254, a, P.gold, 7);
      right += MK.arrow(930, 254, 1030, 200, b, P.gold, 7);
      right += lsEye(1066, 168, 56, -1, b, now);
      right += MK.tick(1090, 296, 28, popIn(t, cEye == null ? null : cEye + 0.5, 0.4));
      out += G(right, { opacity: n2(now) });
    }

    /* the idea changed, because people tested it */
    out += MK.arrow(560, 200, 616, 200, on(t, cSci, 0.6), P.good, 8);
    out += MK.pill(584, 402, "test your ideas", on(t, cIdeas, 0.45), { size: 26, col: P.good });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The three words, the shadow, what changes its size, and why you see. The
     size card's shadow shrinks as the line says "Nearer the wall, smaller". */
  function lsRecapSize(cx, cy, size, t) {
    var s = lsScene("recap"), at = s ? sc(s, 2, "small") : null;
    var h = lerp(size * 1.0, size * 0.44, on(t, at, 0.9));
    return R(cx + size * 0.2, cy - size * 0.62, size * 0.42, size * 1.24, 6, LS_WALL_LIT) +
      R(cx + size * 0.26, cy - h / 2, size * 0.3, h, 4, "#111111") +
      Em(cx - size * 0.42, cy, size * 0.82, "\u{1F9F8}");
  }

  /* the last card draws what it names: a source, the light, and an eye */
  function lsRecapEye(cx, cy, size) {
    return Em(cx - size * 0.52, cy, size * 0.78, "\u{1F526}") +
      MK.arrow(cx - size * 0.18, cy, cx + size * 0.18, cy, 1, P.gold, size * 0.1) +
      lsEye(cx + size * 0.54, cy, size * 0.3, -1, 1, 1);
  }

  var LS_RECAP = MK.recapKind([
    { beat: 0, at: "a", title: "Transparent", sub: "all the light, seen clearly", pic: "\u{1FA9F}" },
    { beat: 0, at: "b", title: "Translucent", sub: "some light, no clear shapes", pic: "\u{1F324}️" },
    { beat: 0, at: "c", title: "Opaque", sub: "no light at all", pic: "\u{1F311}" },
    { beat: 1, at: "shadow", title: "A shadow", sub: "where light is blocked", pic: "\u{1F464}" },
    { beat: 2, at: "size", title: "Big and small", sub: "nearer the torch, bigger", pic: lsRecapSize },
    { beat: 3, at: "eye", title: "Into your eye", sub: "and testing changes science", pic: lsRecapEye }
  ], { goBeat: 3, goAt: "test" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Transparent, translucent and opaque",
      "How a shadow is made, and what changes its size",
      "Why you see, and what people used to think"
    ] }),
    materials: lsMaterialsChapter,
    shadow: lsShadowChapter,
    size: lsSizeChapter,
    question: lsQuestionChapter,
    eye: lsEyeChapter,
    then: lsThenChapter,
    recap: LS_RECAP
  };

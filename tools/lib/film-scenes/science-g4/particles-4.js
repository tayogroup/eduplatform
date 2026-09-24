  /* ==== Particles, part 4: a model, not a photograph, and the recap ============
     tools/lib/film-scenes/science-g4/particles-4.js. The lesson's own box is
     shown with its colour taken away as the voice says the colour is for us
     (paGrey, part 1) - the one place the film changes the lesson's drawing, and
     it changes it into the thing the lesson says is true. The count is the box's
     own forty particles, counted up over the picture that holds them. */

  /* a deterministic stand-in for scatter: the same number for the same k, for ever */
  function paHash(k) { var v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }

  /* ==== chapter: a model, not a photograph ======================================= */
  function paModelChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cUse = c(0, "useful"), cPhoto = c(0, "photograph");
    var cCol = c(1, "colour"), cGreen = c(1, "green"), cSee = c(1, "see");
    var cSmall = c(2, "smaller"), cKinds = c(2, "kinds");
    var cForty = c(3, "forty"), cDrop = c(3, "drop"), cCount = c(3, "count");

    var box = PA_BOX, out = "", drain = on(t, cCol, 1.1) * (1 - paFrom(t, scene, 3));
    out += paBoxCard(box);
    out += paGrey(paBoxAt(box, 0, paJig(t, 1.15), 0), drain);
    var b0 = paOnly(t, scene, 0), b1 = paOnly(t, scene, 1), b2 = paOnly(t, scene, 2), b3 = paOnly(t, scene, 3);

    /* beat 1: useful, and not a photograph */
    if (b0 > 0) {
      var g0 = "";
      g0 += MK.pill(880, 116, "useful", on(t, cUse, 0.4), { size: 34, col: P.good });
      g0 += MK.tick(1030, 116, 28, popIn(t, cUse == null ? null : cUse + 0.3, 0.4));
      g0 += MK.pic(880, 268, 148, "\u{1F4F7}");
      g0 += MK.cross(958, 330, 40, popIn(t, cPhoto, 0.4));
      g0 += MK.pill(880, 398, "not a photograph", on(t, cPhoto, 0.4), { size: 30, col: P.bad });
      out += G(g0, { opacity: b0 });
    }

    /* beat 2: the green is ours, not theirs */
    if (b1 > 0) {
      var g1 = "";
      g1 += paBall(790, 214, 62, "#7BC47F");
      g1 += Tx(790, 310, "in the model", "lab mid muted readable", "middle");
      g1 += MK.arrow(872, 214, 944, 214, on(t, cGreen, 0.5), P.gold, 7);
      g1 += paBall(1030, 214, 62, "#A8AEB5", on(t, cGreen, 0.6));
      g1 += Tx(1030, 310, "no colour of its own", "lab mid muted readable", "middle", { opacity: on(t, cGreen, 0.6) });
      g1 += MK.pill(910, 104, "the colour is for us", on(t, cCol, 0.4), { size: 29, col: P.gold });
      g1 += MK.pic(842, 392, 68, "\u{1F441}️", { opacity: on(t, cSee, 0.5) });
      g1 += MK.pill(1000, 392, "so we can see them", on(t, cSee, 0.4), { size: 25 });
      out += G(g1, { opacity: b1 });
    }

    /* beat 3: far smaller, and in many kinds */
    if (b2 > 0) {
      var g2 = "", sm = on(t, cSmall, 0.9);
      g2 += paBall(712, 168, 58);
      g2 += Tx(712, 254, "the model's ball", "lab mid muted readable", "middle");
      g2 += MK.arrow(786, 168, 906, 168, sm, P.gold, 6);
      g2 += C(966, 168, lerp(58, 6, sm), "#7BC47F", "#1B2A3A", Math.max(1, lerp(10, 1.6, sm)), { opacity: sm });
      g2 += C(966, 168, lerp(74, 26, sm), "none", P.gold, 3, { opacity: sm * 0.9 });
      g2 += Tx(966, 254, "a real one", "lab mid muted readable", "middle", { opacity: sm });
      g2 += MK.pill(880, 100, "far smaller than this", on(t, cSmall, 0.4), { size: 27, col: P.gold });
      var kn = popIn(t, cKinds, 0.5);
      if (kn > 0) {
        g2 += MK.pop(paBall(712, 338, 26), 712, 338, kn);
        g2 += MK.pop(paBall(806, 338, 24, "#5FA8DC") + paBall(846, 338, 24, "#5FA8DC"), 826, 338, kn);
        g2 += MK.pop(paBall(930, 326, 20, "#C08A4A") + paBall(908, 356, 20, "#C08A4A") + paBall(952, 356, 20, "#C08A4A"), 930, 344, kn);
        g2 += MK.pop(C(1042, 338, 28, "none", "#B78BD1", 12), 1042, 338, kn);
        g2 += MK.pill(880, 408, "many kinds and shapes", on(t, cKinds, 0.5), { size: 26 });
      }
      out += G(g2, { opacity: b2 });
    }

    /* beat 4: forty here, more than you could count in one drop */
    if (b3 > 0) {
      var g3 = "", n = tally(t, cForty, 40, 1.4);
      if (n > 0) {
        g3 += MK.pill(712, 150, String(n), 1, { size: 60, col: P.gold, ink: P.gold });
        g3 += Tx(712, 232, "in the model", "lab mid muted readable", "middle");
      }
      var dr = on(t, cDrop, 0.5);
      if (dr > 0) {
        var dx = 968, dy = 300, r = 92;
        g3 += el("clipPath", { id: "paDropClip" },
          Pth("M" + n2(dx - r * 0.88) + "," + n2(dy - r * 0.44) + " L" + n2(dx) + "," + n2(dy - r * 2.15) +
            " L" + n2(dx + r * 0.88) + "," + n2(dy - r * 0.44) + " Z", "#000") + C(dx, dy, r, "#000"));
        g3 += paDrop(dx, dy, r, dr);
        var swarm = "", many = on(t, cDrop == null ? null : cDrop + 0.35, 1.0);
        if (many > 0) {
          for (var k = 0; k < 240; k++) {
            var px = dx - r + paHash(k) * 2 * r, py = dy - r * 2.2 + paHash(k + 400) * r * 3.3;
            swarm += C(px + Math.sin(t * 3 + k) * 1.4, py + Math.cos(t * 3.4 + k) * 1.4, 3.4, "#FFFFFF", null, null, { opacity: 0.92 });
          }
          g3 += G(swarm, { "clip-path": "url(#paDropClip)", opacity: many });
        }
        g3 += MK.pill(880, 408, "more than you could count", on(t, cCount, 0.4), { size: 27, col: P.gold });
      }
      out += G(g3, { opacity: b3 });
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  function paRecapSolid(cx, cy, size, t) {
    var out = "", d = size * 0.3, r = size * 0.14;
    for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++)
      out += paBall(cx + (b - 1) * d + ((a + b) % 2 ? 1.6 : -1.6) * Math.sin(t * 22.5), cy + (a - 1) * d + ((a + b) % 2 ? -1.6 : 1.6) * Math.sin(t * 22.5), r);
    return out;
  }
  function paRecapLiquid(cx, cy, size, t) {
    var out = "", d = size * 0.3, r = size * 0.14, off = ((t * 14) % d);
    for (var a = 0; a < 3; a++) for (var b = -1; b < 3; b++)
      out += paBall(cx + (b - 1) * d + (a % 2 ? off : -off) + (a % 2 ? d / 2 : 0), cy + (a - 1) * d, r, "#5FA8DC");
    return out;
  }
  function paRecapMoving(cx, cy, size, t) {
    var r = size * 0.3;
    return paBall(cx + Math.sin(t * 22.5) * r * 0.22, cy + Math.cos(t * 19.5) * r * 0.14, r) + paShake(cx, cy, r, 1);
  }
  function paRecapPowder(cx, cy, size, t) {
    return paHeapOf(cx, cy + size * 0.42, "#D9B27C", size * 0.075, "", 1, t, null, size / 108);
  }
  var PA_RECAP = MK.recapKind([
    { beat: 0, at: "solid", title: "In a solid", sub: "rows, vibrating on the spot", pic: paRecapSolid },
    { beat: 0, at: "liquid", title: "In a liquid", sub: "touching, sliding past", pic: paRecapLiquid },
    { beat: 1, at: "never", title: "Never still", sub: "heat, and they move more", pic: paRecapMoving },
    { beat: 2, at: "powder", title: "A powder", sub: "the grains roll, not the particles", pic: paRecapPowder },
    { beat: 3, at: "model", title: "A model", sub: "a picture of an idea", pic: "\u{1F4D0}" }
  ], { goBeat: 3, goAt: "model" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What a solid looks like inside", "Why a liquid flows and a solid does not", "Why sand pours, and what a model leaves out"] }),
    particles: paParticlesChapter, solid: paSolidChapter, liquid: paLiquidChapter,
    words: paWordsChapter, powders: paPowdersChapter, model: paModelChapter, recap: PA_RECAP
  };

  /* ==== Grade 4 Science, Lesson 3: Staying Healthy ============================
     tools/lib/film-scenes/science-g4/staying-healthy.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/staying-healthy.json.

     This lesson draws nothing of its own: every one of its six steps is a sort,
     a demo, an explore or a question list, so its pictures are the lesson's
     emoji and its words. The film therefore draws the things the lesson names
     -- the bottle and its label, the measured dose, the locked cupboard, the
     germ, the body that learns, the five reasons to move, the two bins of its
     evidence sort and its four health jobs -- and uses the lesson's own emoji
     where the lesson shows one (the health worker, the puppy, the bar chart).

     This file: the palette, the drawings every chapter shares, the title motif
     and the chapter "Medicines, used safely". Every top-level name here starts
     with sh, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, medicines: P.gold, infectious: P.blue, vaccines: P.plum,
    moving: P.good, evidence: P.accent, jobs: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function shOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function shFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var SH_SCATTER = [0.17, 0.83, 0.39, 0.62, 0.08, 0.95, 0.47, 0.28, 0.71, 0.54, 0.12, 0.88];

  /* ---- drawings this film shares ---------------------------------------------- */

  /* A brown child (the owner, 2026-09-19), feet on (cx, groundY) and h tall, so
     the top of the head is exactly groundY - h and the body about 0.47 h wide.
     opt: {ill, shirt}. An ill child has a downturned mouth and two plum marks,
     as the lesson's own poorly face does. */
  function shChild(cx, groundY, h, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var sk = "#C68642", shirt = opt.shirt || P.teal;
    var hr = h * 0.145, hy = groundY - h * 0.855, out = "";
    out += L(cx - h * 0.06, groundY - h * 0.36, cx - h * 0.085, groundY - h * 0.02, "#27506E", h * 0.078);
    out += L(cx + h * 0.06, groundY - h * 0.36, cx + h * 0.085, groundY - h * 0.02, "#27506E", h * 0.078);
    out += L(cx - h * 0.135, groundY - h * 0.65, cx - h * 0.235, groundY - h * 0.40, sk, h * 0.062);
    out += L(cx + h * 0.135, groundY - h * 0.65, cx + h * 0.235, groundY - h * 0.40, sk, h * 0.062);
    out += R(cx - h * 0.145, groundY - h * 0.70, h * 0.29, h * 0.37, h * 0.07, shirt);
    out += R(cx - h * 0.036, groundY - h * 0.745, h * 0.072, h * 0.06, 0, sk);
    out += C(cx, hy, hr, sk);
    out += Pth("M" + n2(cx - hr * 1.02) + "," + n2(hy - hr * 0.1) +
      " a" + n2(hr * 1.02) + "," + n2(hr * 1.02) + " 0 0 1 " + n2(hr * 2.04) + ",0 z", "#2A1B12");
    out += C(cx - hr * 0.34, hy - hr * 0.04, hr * 0.115, "#22140C");
    out += C(cx + hr * 0.34, hy - hr * 0.04, hr * 0.115, "#22140C");
    if (opt.ill) {
      out += Pth("M" + n2(cx - hr * 0.36) + "," + n2(hy + hr * 0.56) + " q" + n2(hr * 0.36) + "," + n2(-hr * 0.3) + " " + n2(hr * 0.72) + ",0",
        null, "#22140C", Math.max(2, hr * 0.12));
      out += C(cx - hr * 0.62, hy + hr * 0.24, hr * 0.17, P.plum, null, null, { opacity: 0.7 });
      out += C(cx + hr * 0.62, hy + hr * 0.24, hr * 0.17, P.plum, null, null, { opacity: 0.7 });
    } else {
      out += Pth("M" + n2(cx - hr * 0.36) + "," + n2(hy + hr * 0.34) + " q" + n2(hr * 0.36) + "," + n2(hr * 0.38) + " " + n2(hr * 0.72) + ",0",
        null, "#22140C", Math.max(2, hr * 0.12));
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* The same child, seated on a stool: the hip drops to the seat and the leg
     folds, so a child told to sit still is drawn sitting still rather than
     standing under the word. The mouth is flat, not smiling, and not ill. */
  function shSitting(cx, groundY, h, o, shirt) {
    if (!(o > 0)) return "";
    var sk = "#C68642", sy = groundY - h * 0.24, out = "";
    var hr = h * 0.145, hy = sy - h * 0.525;
    out += R(cx - h * 0.205, sy, h * 0.41, h * 0.055, h * 0.02, "#2E5D7C");
    out += R(cx - h * 0.165, sy + h * 0.055, h * 0.045, h * 0.185, 0, "#24506D");
    out += R(cx + h * 0.12, sy + h * 0.055, h * 0.045, h * 0.185, 0, "#24506D");
    out += L(cx - h * 0.02, sy - h * 0.03, cx + h * 0.20, sy - h * 0.03, "#27506E", h * 0.082);
    out += L(cx + h * 0.20, sy - h * 0.03, cx + h * 0.20, groundY - h * 0.02, "#27506E", h * 0.082);
    out += L(cx - h * 0.135, sy - h * 0.33, cx - h * 0.195, sy - h * 0.05, sk, h * 0.062);
    out += L(cx + h * 0.135, sy - h * 0.33, cx + h * 0.20, sy - h * 0.07, sk, h * 0.062);
    out += R(cx - h * 0.145, sy - h * 0.37, h * 0.29, h * 0.37, h * 0.07, shirt || P.teal);
    out += R(cx - h * 0.036, sy - h * 0.425, h * 0.072, h * 0.06, 0, sk);
    out += C(cx, hy, hr, sk);
    out += Pth("M" + n2(cx - hr * 1.02) + "," + n2(hy - hr * 0.1) +
      " a" + n2(hr * 1.02) + "," + n2(hr * 1.02) + " 0 0 1 " + n2(hr * 2.04) + ",0 z", "#2A1B12");
    out += C(cx - hr * 0.34, hy - hr * 0.04, hr * 0.115, "#22140C");
    out += C(cx + hr * 0.34, hy - hr * 0.04, hr * 0.115, "#22140C");
    out += L(cx - hr * 0.34, hy + hr * 0.46, cx + hr * 0.34, hy + hr * 0.46, "#22140C", Math.max(2, hr * 0.12));
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a heart, its point down, s from the centre */
  function shHeart(cx, cy, s, o, col) {
    if (!(o > 0)) return "";
    var d = "M0," + n2(s * 0.88) + " C" + n2(-s * 1.16) + "," + n2(s * 0.04) + " " + n2(-s * 0.64) + "," + n2(-s * 0.94) + " 0," + n2(-s * 0.3) +
      " C" + n2(s * 0.64) + "," + n2(-s * 0.94) + " " + n2(s * 1.16) + "," + n2(s * 0.04) + " 0," + n2(s * 0.88) + " Z";
    return G(Pth(d, col || "#E4524B"), { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* A germ: a round body with short spikes and two dark specks, in the plum of
     the lesson's own germ picture. k gives each one its own wobble, so a row of
     them is never a row of identical discs, and it is still pure in t. */
  function shGerm(cx, cy, r, o, t, k) {
    if (!(o > 0)) return "";
    var wob = Math.sin((t || 0) * 2.6 + (k || 0) * 1.7) * r * 0.1, out = "";
    for (var n = 0; n < 8; n++) {
      var a = n * Math.PI / 4 + (k || 0) * 0.4 + (t || 0) * 0.22;
      out += L(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9,
        cx + Math.cos(a) * r * 1.52, cy + Math.sin(a) * r * 1.52, "#9B62BC", Math.max(1.4, r * 0.2));
    }
    out += C(cx, cy, r + wob, P.plum);
    out += C(cx - r * 0.3, cy - r * 0.26, r * 0.2, "#381C46");
    out += C(cx + r * 0.28, cy + r * 0.12, r * 0.16, "#381C46");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a shield: one of the fighters the lesson says the body makes */
  function shShield(cx, cy, s, o, col) {
    if (!(o > 0)) return "";
    var d = "M0," + n2(-s) + " L" + n2(s * 0.82) + "," + n2(-s * 0.58) + " L" + n2(s * 0.82) + "," + n2(s * 0.22) +
      " Q" + n2(s * 0.82) + "," + n2(s * 0.9) + " 0," + n2(s * 1.12) +
      " Q" + n2(-s * 0.82) + "," + n2(s * 0.9) + " " + n2(-s * 0.82) + "," + n2(s * 0.22) +
      " L" + n2(-s * 0.82) + "," + n2(-s * 0.58) + " Z";
    return G(Pth(d, col || P.good, P.ground, Math.max(1.5, s * 0.14)), { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* A medicine bottle: amber body, white cap, a label with three ruled lines.
     w is the body's width; the whole drawing is about 1.4 w tall. */
  function shBottle(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var h = w * 1.4, out = "";
    out += R(cx - w * 0.23, cy - h * 0.63, w * 0.46, h * 0.16, 5, "#C9D6E2", "#8FA3B5", 2);
    out += R(cx - w / 2, cy - h * 0.48, w, h * 0.96, w * 0.15, "#C4762F", "#8A4E19", 3);
    out += R(cx - w * 0.38, cy - h * 0.22, w * 0.76, h * 0.54, 6, P.paper, "#CFC6B2", 2);
    out += R(cx - w * 0.3, cy - h * 0.13, w * 0.6, 5, 2.5, "#9A9182");
    out += R(cx - w * 0.3, cy - h * 0.03, w * 0.44, 5, 2.5, "#9A9182");
    out += R(cx - w * 0.3, cy + h * 0.07, w * 0.54, 5, 2.5, "#9A9182");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* The cup a dose is measured in. `fill` is how full it is, 1 being level with
     the rim; past that it spills. The gold dashes across it are the amount the
     label gives (0.7 of the cup), so "the right amount" is the liquid sitting
     exactly on that line and "the wrong amount" is the liquid over the top. */
  function shCup(cx, cy, w, h, fill, o, t, from) {
    if (!(o > 0)) return "";
    var x = cx - w / 2, y = cy - h / 2, lv = clamp(fill, 0, 1), out = "";
    var lineY = y + h - (h - 8) * 0.7 - 4;
    out += R(x, y, w, h, 9, "rgba(255,255,255,0.07)");
    out += R(x + 4, y + h - 4 - (h - 8) * lv, w - 8, (h - 8) * lv, 0, "#E9744F");
    out += R(x, y, w, h, 9, "none", "#CFDDE9", 5);
    out += L(x + 7, lineY, x + w - 7, lineY, P.gold, 4, { "stroke-dasharray": "10 7" });
    if (fill > 1.02 && from != null && t != null) {
      out += R(x + 4, y + 2, w - 8, 9, 4, "#E9744F");
      for (var k = 0; k < 4; k++) {
        var born = from + 0.12 + k * 0.24, side = k % 2 ? 1 : -1;
        if (t < born) continue;
        var ph = ((t - born) / 0.85) % 1;
        out += C(cx + side * (w / 2 - 6) + side * 9 * ph, y + 8 + (h + 40) * ph * ph, 7, "#E9744F", null, null, { opacity: 1 - ph });
      }
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a line to the thing it names; gold while it is the
     one being talked about, quiet once the voice has moved on */
  function shLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* a dark card to stand a drawing on */
  function shCard(x, y, w, h, o, lit) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title =================================================================
     A brown child in a round window, with a beating heart: the body the whole
     lesson is about. On "Your body" the child comes in, on "stay healthy" the
     window warms green, on "up to you" a gold ring closes round it; then the
     film's four ideas take their places on the rim as they are named. On the
     two cards the child simply stands there, with all four. */
  var SH_RIM = [
    ["med", "\u{1F48A}", 81, 81], ["vac", "\u{1F489}", 279, 81],
    ["mov", "\u{1F3C3}\u{1F3FE}", 279, 279], ["ev", "\u{1F4CA}", 81, 279]
  ];
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var pb = s ? popIn(t, sc(s, 0, "body"), 0.55) : 1;
    var gl = s ? on(t, sc(s, 0, "healthy"), 0.7) : 1;
    var yr = s ? on(t, sc(s, 0, "you"), 0.6) : 1;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 190, 146, P.good, gl * (0.6 + 0.4 * breathe(t)));
    out += shChild(180, 306, 224, Math.min(1, pb), { shirt: P.teal });
    out += shHeart(180, 208, 25 * (1 + 0.1 * Math.sin(t * 5.2)), Math.min(1, pb) * (0.35 + 0.65 * gl));
    out += C(180, 180, 172, "none", P.line, 3);
    if (yr > 0) out += C(180, 180, 164, "none", P.gold, 5, { opacity: yr * 0.9, "stroke-dasharray": "14 10" });
    SH_RIM.forEach(function (r) {
      var p = s ? popIn(t, sc(s, 1, r[0]), 0.4) : 1;
      if (!(p > 0)) return;
      out += G(C(r[2], r[3], 34, P.card, P.teal, 3) + Em(r[2], r[3], 40, r[1]),
        { transform: around(r[2], r[3], Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A child, a beating heart, and the four ideas of the lesson">' + out + "</svg>";
  }

  /* ==== chapter: medicines, used safely ==========================================
     The lesson's medicine sort, as a picture. The bottle stands at the left for
     the whole chapter, because everything said here is about it; the panel
     beside it is the beat's own: the child it treats, the right amount against
     the wrong amount, the grown-up reading the label, the double dose, and the
     cupboard with the lock. The label carries no dose figure of its own: the
     lesson never gives one, so its value is left as a ruled line. */
  var SH_MED_G = 372;

  function shMedPanel(k, t, scene) {
    var c = function (kk, n) { return sc(scene, kk, n); };
    var out = "";
    if (k === 0) {
      var cT = c(0, "treats");
      out += shChild(560, SH_MED_G, 236, 1, { ill: true, shirt: P.plum });
      out += MK.pill(560, 410, "an illness", 1, { size: 24, col: P.line });
      out += MK.arrow(672, 250, 830, 250, on(t, cT, 0.7), P.gold, 8);
      out += shChild(940, SH_MED_G, 236, popIn(t, cT, 0.5) > 0 ? Math.min(1, popIn(t, cT, 0.5)) : 0, { shirt: P.good });
      out += MK.tick(1056, 152, 30, popIn(t, cT == null ? null : cT + 0.55, 0.35));
      return out;
    }
    if (k === 1) {
      var cR = c(1, "right"), cW = c(1, "wrong");
      out += shCup(600, 200, 152, 196, 0.7 * on(t, cR, 0.7), 1, t, null);
      out += MK.tick(600, 340, 27, popIn(t, cR == null ? null : cR + 0.45, 0.35));
      out += MK.pill(600, 406, "right amount", 1, { size: 24, col: P.good });
      out += shCup(930, 200, 152, 196, 1.3 * on(t, cW, 0.7), 1, t, cW);
      out += MK.cross(930, 340, 27, popIn(t, cW == null ? null : cW + 0.45, 0.35));
      out += MK.pill(930, 406, "wrong amount", 1, { size: 24, col: P.bad });
      return out;
    }
    if (k === 2) {
      var cG = c(2, "grown"), cD = c(2, "dose"), cL = c(2, "label");
      out += R(596, 76, 528, 278, 20, P.paper, "#CFC6B2", 2);
      out += Tx(632, 124, "MEDICINE", "lab small dark caps", "start");
      out += Tx(632, 190, "Dose", "lab big dark", "start");
      out += L(748, 182, 1084, 182, "#B7AE9C", 4, { "stroke-dasharray": "12 8" });
      out += Tx(632, 254, "Use by", "lab big dark", "start");
      out += L(784, 246, 1084, 246, "#B7AE9C", 4, { "stroke-dasharray": "12 8" });
      out += Tx(632, 318, "Keep out of reach of children", "lab mid dark", "start");
      out += Em(452, 190, 168, "\u{1F469}\u{1F3FE}\u200D\u2695\uFE0F", { opacity: Math.min(1, popIn(t, cG, 0.45)), transform: around(452, 190, Math.min(1.1, popIn(t, cG, 0.45))) });
      out += shCup(452, 348, 96, 116, 0.7 * on(t, cD, 0.8), 1, t, null);
      var dr = on(t, cD, 0.5);
      if (dr > 0) out += R(616, 154, 492, 54, 12, "none", P.gold, 4, { opacity: dr * (0.65 + 0.35 * breathe(t)) });
      var lr = on(t, cL, 0.5);
      if (lr > 0) {
        out += MK.leader(232, 232, 588, 215, on(t, cL, 0.7), P.gold);
        out += R(590, 70, 540, 290, 24, "none", P.gold, 5, { opacity: lr });
      }
      return out;
    }
    if (k === 3) {
      /* ONE cup, with the label's own amount dashed across it. On "double the
         dose" the level climbs to twice that line and spills over the rim, so
         the picture is the sentence: two doses do not fit in one child. */
      var cM = c(3, "more"), cB = c(3, "double");
      var mu = on(t, cM, 0.6), bu = on(t, cB, 0.9);
      out += shCup(540, 200, 158, 190, 0.7 + 0.62 * bu, 1, t, cB);
      out += MK.pill(540, 372, "the label's amount", 1 - bu, { size: 24, col: P.gold });
      out += MK.pill(540, 372, "double the dose", bu, { size: 24, col: P.bad });
      out += MK.arrow(760, 300, 760, 140, mu, P.gold, 9);
      out += MK.pill(760, 326, "more", mu, { size: 26, col: P.gold });
      out += MK.cross(760, 96, 30, popIn(t, cM == null ? null : cM + 0.5, 0.35));
      out += Em(986, 196, 104, "\u26A0\uFE0F", { opacity: on(t, cB == null ? null : cB + 0.45, 0.4) });
      out += MK.pill(986, 306, "poison", on(t, cB == null ? null : cB + 0.65, 0.4), { size: 26, col: P.bad });
      return out;
    }
    var cK = c(4, "locked"), cN = c(4, "nobody");
    var du = on(t, cK, 0.85);
    out += R(392, 66, 312, 208, 14, "#123247", P.line, 3);
    out += shBottle(470, 176, 72, 1);
    out += Em(624, 176, 62, "\u{1F48A}");
    out += R(392, 66, 156 * du, 208, 14, "#1C3F59", "#2E5D7C", 3);
    out += R(704 - 156 * du, 66, 156 * du, 208, 14, "#1C3F59", "#2E5D7C", 3);
    out += Em(548, 174, 84, "\u{1F512}", { opacity: on(t, cK == null ? null : cK + 0.75, 0.4) });
    out += R(376, 286, 344, 13, 6, "#2E5D7C");
    out += shChild(856, 396, 202, 1, { shirt: P.blue });
    out += shChild(1064, 396, 202, 1, { shirt: P.accent });
    var nu = on(t, cN, 0.45);
    if (nu > 0) {
      out += Em(960, 268, 56, "\u{1F48A}", { opacity: nu });
      out += MK.cross(960, 268, 42, popIn(t, cN == null ? null : cN + 0.3, 0.4));
    }
    return out;
  }

  function shMedChapter(scene, beat, t, i) {
    var cMed = sc(scene, 0, "medicine"), out = "";
    out += shBottle(150, 232, 152, on(t, cMed, 0.5));
    out += MK.pill(150, 392, "medicine", on(t, cMed, 0.45), { size: 28, col: P.gold });
    out += crossfade(t, i, scene, function (n) { return shMedPanel(n - scene.first, t, scene); });
    return svg(out);
  }

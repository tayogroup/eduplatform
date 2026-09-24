  /* ==== Staying Healthy, part 2 ===============================================
     tools/lib/film-scenes/science-g4/staying-healthy-2.js: the chapters
     "Diseases that spread" and "How a vaccine works". The second follows the
     lesson's own five-frame vaccine demo in its own order: a germ gets in, the
     body is slow and you are ill, the vaccine shows a harmless piece while you
     are well, the body learns, the real germ is beaten fast, and the animals
     are vaccinated too. */

  /* a face with measles spots: the skin the film draws its children in */
  function shSpotty(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var sp = [[-0.42, -0.1], [0.3, -0.3], [0.48, 0.22], [-0.2, 0.46], [0.06, -0.52], [-0.56, 0.3], [0.2, 0.6]], out = "";
    out += C(cx, cy, r, "#C68642");
    out += Pth("M" + n2(cx - r * 1.02) + "," + n2(cy - r * 0.1) +
      " a" + n2(r * 1.02) + "," + n2(r * 1.02) + " 0 0 1 " + n2(r * 2.04) + ",0 z", "#2A1B12");
    out += C(cx - r * 0.34, cy - r * 0.04, r * 0.11, "#22140C");
    out += C(cx + r * 0.34, cy - r * 0.04, r * 0.11, "#22140C");
    out += Pth("M" + n2(cx - r * 0.3) + "," + n2(cy + r * 0.56) + " q" + n2(r * 0.3) + "," + n2(-r * 0.22) + " " + n2(r * 0.6) + ",0",
      null, "#22140C", Math.max(2, r * 0.1));
    for (var k = 0; k < sp.length; k++) out += C(cx + sp[k][0] * r, cy + sp[k][1] * r, r * 0.1, "#D4453E");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: diseases that spread ==============================================
     The chain first: three children, and the germ hopping from one to the next
     as "spread from one living thing" is said. Then the lesson's own three
     examples, a cold, measles and a blight on potatoes, each as it is named.
     Then the term itself, over a small chain. Then the three kinds of living
     thing that catch them. */
  var SH_CHAIN = [200, 484, 768];

  function shInfPanel(k, t, scene) {
    var c = function (kk, n) { return sc(scene, kk, n); };
    var out = "", n;
    if (k === 0) {
      var cI = c(0, "illness"), cS = c(0, "spread");
      var hop = on(t, cS, 1.1), caught = on(t, cS == null ? null : cS + 0.95, 0.4);
      out += MK.glow(SH_CHAIN[0], 236, 130, P.plum, on(t, cI, 0.5) * (0.6 + 0.4 * breathe(t)));
      out += shChild(SH_CHAIN[0], 348, 232, 1, { ill: true, shirt: P.blue });
      out += shChild(SH_CHAIN[1], 348, 232, 1 - caught, { shirt: P.teal });
      out += shChild(SH_CHAIN[1], 348, 232, caught, { ill: true, shirt: P.teal });
      out += shChild(SH_CHAIN[2], 348, 232, 1, { shirt: P.gold });
      out += MK.arrow(SH_CHAIN[0] + 74, 200, SH_CHAIN[1] - 74, 200, hop, P.plum, 8);
      if (hop > 0) out += shGerm(lerp(SH_CHAIN[0] + 74, SH_CHAIN[1] - 74, hop), 200 - 46 * Math.sin(Math.PI * hop), 26, 1, t, 1);
      out += MK.pill(SH_CHAIN[0], 408, "ill", 1, { size: 24, col: P.line });
      out += MK.pill(SH_CHAIN[1], 408, "then ill too", caught, { size: 24, col: P.plum });
      return out;
    }
    if (k === 1) {
      var cG = c(1, "germs"), ex = [[c(1, "cold"), 470, "a cold"], [c(1, "measles"), 745, "measles"], [c(1, "blight"), 1020, "a blight on potatoes"]];
      out += shGerm(178, 196, 74, popIn(t, cG, 0.5), t, 0);
      out += MK.pill(178, 336, "germs", on(t, cG, 0.45), { size: 28, col: P.plum });
      for (n = 0; n < 3; n++) {
        var p = popIn(t, ex[n][0], 0.42), x = ex[n][1];
        if (!(p > 0)) continue;
        var inner = shCard(x - 125, 82, 250, 268, 1, true);
        if (n === 0) inner += Em(x, 190, 96, "\u{1F927}");
        else if (n === 1) inner += shSpotty(x, 190, 50, 1);
        else {
          inner += Em(x, 186, 92, "\u{1F954}");
          inner += C(x - 22, 176, 8, "#5B3A1C") + C(x + 16, 200, 7, "#5B3A1C") + C(x + 2, 152, 6, "#5B3A1C");
        }
        inner += Tx(x, 318, ex[n][2], n === 2 ? "lab mid" : "lab big", "middle");
        out += G(inner, { transform: around(x, 216, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      }
      return out;
    }
    if (k === 2) {
      var cN = c(2, "name"), pn = popIn(t, cN, 0.45);
      for (n = 0; n < 3; n++) {
        out += shChild(400 + n * 184, 400, 148, 1, { ill: n < 2, shirt: n === 0 ? P.blue : n === 1 ? P.teal : P.gold });
        if (n < 2) out += MK.arrow(400 + n * 184 + 48, 316, 400 + (n + 1) * 184 - 48, 316, 1, P.plum, 6);
      }
      out += MK.pill(584, 176, "infectious diseases", pn, { size: 44, col: P.gold, fill: "#1B3A52" });
      return out;
    }
    var kinds = [[c(3, "plants"), 244, "\u{1F331}", "Plants"], [c(3, "animals"), 584, "\u{1F415}", "Animals"], [c(3, "people"), 924, null, "People"]];
    for (n = 0; n < 3; n++) {
      var q = popIn(t, kinds[n][0], 0.42), cx = kinds[n][1];
      if (!(q > 0)) continue;
      var card = shCard(cx - 140, 62, 280, 312, 1, true);
      if (kinds[n][2]) card += Em(cx, 190, 118, kinds[n][2]);
      else card += shChild(cx, 258, 172, 1, { shirt: P.accent });
      card += shGerm(cx + 88, 110, 22, 1, t, n + 2);
      card += Tx(cx, 342, kinds[n][3], "lab big", "middle");
      out += G(card, { transform: around(cx, 218, Math.min(q, 1.1)), opacity: Math.min(1, q) });
    }
    return out;
  }

  function shInfChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (n) { return shInfPanel(n - scene.first, t, scene); }));
  }

  /* ==== chapter: how a vaccine works ===============================================
     One stage for the lesson's first four frames, so the body on the right is
     the same body throughout and the learner watches it change: a germ gets in,
     the days pass and the child is ill, the vaccine shows a harmless piece
     while the child is well, the shields are made, the real germ is stopped.
     The fifth frame, the animals, replaces it at the last beat. */
  var SH_BODY = { x: 664, y: 44, w: 420, h: 356, cx: 874, ground: 374 };
  /* where the three shields are born: beside the child, never over them */
  var SH_SHIELD_AT = [[726, 148], [726, 262], [1018, 200]];

  function shVacBody(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGerm = c(0, "germ"), cWork = c(0, "work");
    var cDays = c(1, "days"), cIll = c(1, "ill");
    var cVac = c(2, "vaccine"), cHarm = c(2, "harmless"), cWell = c(2, "well");
    var cLearn = c(3, "learns"), cNot = c(3, "notill");
    var cReal = c(4, "real"), cReady = c(4, "ready"), cFast = c(4, "fast");
    var out = "", k;

    /* the body, and the child in it. The child turns ill AS the days pass --
       the lesson's own second frame -- so the frame under "you are ill" shows
       an ill child rather than one who becomes ill after the line ends. */
    out += R(SH_BODY.x, SH_BODY.y, SH_BODY.w, SH_BODY.h, 28, P.card, P.line, 2);
    out += Tx(SH_BODY.x + 20, SH_BODY.y + 38, "your body", "lab mid muted", "start");
    var illness = on(t, cDays == null ? null : cDays + 0.3, 1.1) * (1 - on(t, cWell, 0.45));
    out += shChild(SH_BODY.cx, SH_BODY.ground, 296, 1 - illness, { shirt: P.teal });
    out += shChild(SH_BODY.cx, SH_BODY.ground, 296, illness, { ill: true, shirt: P.teal });

    /* the first germ gets in, and the body does not know what to do */
    var g1 = on(t, cGerm, 1.2), gone = on(t, cVac, 0.5);
    if (g1 > 0 && gone < 1) {
      out += shGerm(lerp(150, SH_BODY.cx - 96, g1), lerp(208, 236, g1), 30, 1 - gone, t, 0);
      out += MK.pill(160, 300, "a new germ", on(t, cGerm, 0.4) * (1 - gone) * (1 - into(t, scene.first + 1)), { size: 24, col: P.plum });
    }
    var wq = on(t, cWork, 0.45) * (1 - gone);
    if (wq > 0) {
      out += MK.qmark(1000, 158, 26, wq);
      out += MK.qmark(1046, 104, 20, wq * (0.5 + 0.5 * breathe(t)));
    }

    /* the days pass, slowly, and the child is ill */
    var dv = on(t, cDays, 0.4) * (1 - into(t, scene.first + 2));
    if (dv > 0) {
      for (k = 0; k < 3; k++) {
        var at = cDays == null ? null : cDays + 0.2 + k * 0.35;
        out += MK.pill(176 + k * 154, 330, "day " + (k + 1), on(t, at, 0.35) * dv, { size: 26, col: P.plum });
      }
      out += MK.pill(330, 226, "slow", on(t, cDays == null ? null : cDays + 1.15, 0.4) * dv, { size: 26, col: P.muted });
      out += MK.pill(SH_BODY.x + 96, 414, "ill", on(t, cIll, 0.4) * dv, { size: 24, col: P.plum });
    }

    /* the vaccine: a syringe, and the harmless piece it shows the body */
    var vs = on(t, cVac, 0.45) * (1 - into(t, scene.first + 4));
    if (vs > 0) {
      out += Em(228, 214, 132, "\u{1F489}", { opacity: vs });
      out += MK.pill(228, 322, "a vaccine", vs, { size: 26, col: P.gold });
      var hp = on(t, cHarm, 1.0);
      if (hp > 0) out += G(shGerm(lerp(300, SH_BODY.cx - 104, hp), lerp(228, 250, hp), 22, 1, t, 3), { opacity: vs * (0.45 + 0.2 * (1 - hp)) }) +
        MK.pill(430, 138, "a harmless piece", on(t, cHarm, 0.4) * vs, { size: 24, col: P.line });
    }
    out += MK.pill(SH_BODY.x + 118, 414, "well, not ill", on(t, cWell, 0.45) * (1 - into(t, scene.first + 4)), { size: 24, col: P.good });

    /* The body learns: three shields, which stay for the rest of the chapter.
       They are born BESIDE the child, never over them -- the first cut put one
       across the face and it read as a mask -- and close ranks on the body's
       left edge, where the real germ arrives, when "ready" is said. */
    var made = tally(t, cLearn, 3, 0.9);
    for (k = 0; k < 3; k++) {
      if (made <= k) continue;
      var born = SH_SHIELD_AT[k], ready = on(t, cReady, 0.6);
      out += shShield(lerp(born[0], SH_BODY.x + 44, ready), lerp(born[1], 150 + k * 82, ready), 30,
        popIn(t, cLearn == null ? null : cLearn + k * 0.45, 0.4), P.good);
    }
    out += MK.tick(SH_BODY.x + SH_BODY.w - 42, 92, 26, popIn(t, cNot, 0.4) * (1 - into(t, scene.first + 4)));

    /* the real germ arrives, and is stopped at the shields */
    var rg = on(t, cReal, 0.9);
    if (rg > 0) {
      /* the shields turn it away: it is pushed BACK from the wall, not through
         it, and the cross lands on it while it is still there to be crossed */
      var stop = on(t, cFast, 0.4);
      var gx = lerp(120, SH_BODY.x - 22, rg) - 128 * stop;
      out += shGerm(gx, 236, 32, 1 - on(t, cFast == null ? null : cFast + 0.55, 0.45), t, 5);
      out += MK.pill(160, 336, "the real germ", on(t, cReal, 0.4), { size: 24, col: P.plum });
      out += MK.cross(SH_BODY.x - 26, 236, 34, popIn(t, cFast == null ? null : cFast + 0.05, 0.28));
      out += MK.pill(SH_BODY.x + 150, 414, "ready, and fast", on(t, cFast, 0.4), { size: 24, col: P.good });
    }
    return out;
  }

  var SH_VAC_ANIMALS = [["puppies", 244, "\u{1F415}", "puppies"], ["kittens", 584, "\u{1F408}", "kittens"], ["farm", 924, "\u{1F404}", "farm animals"]];
  function shVacAnimals(scene, t) {
    var out = "";
    for (var k = 0; k < 3; k++) {
      var a = SH_VAC_ANIMALS[k], at = sc(scene, 5, a[0]), p = popIn(t, at, 0.42), cx = a[1];
      if (!(p > 0)) continue;
      var card = shCard(cx - 140, 58, 280, 310, 1, true);
      card += Em(cx, 176, 124, a[2]);
      card += Em(cx + 86, 262, 62, "\u{1F489}");
      card += MK.tick(cx - 86, 258, 26, popIn(t, at == null ? null : at + 0.4, 0.35));
      card += Tx(cx, 336, a[3], "lab big", "middle");
      out += G(card, { transform: around(cx, 214, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    }
    return out;
  }

  function shVacChapter(scene, beat, t, i) {
    var u = scene.beats.length > 5 ? into(t, scene.first + 5) : 0, out = "";
    if (u < 1) out += G(shVacBody(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(shVacAnimals(scene, t), { opacity: u });
    return svg(out);
  }

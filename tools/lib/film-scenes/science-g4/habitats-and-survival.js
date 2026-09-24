  /* ==== Grade 4 Science, Lesson 5: Habitats and Survival ======================
     tools/lib/film-scenes/science-g4/habitats-and-survival.js, with -2.js,
     -3.js and -4.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/habitats-and-survival.json.

     The lesson's own things are what is drawn: the habitat sort's four bins
     and their pictures (desert, Arctic, rainforest, ocean) with its first four
     animals; the kit's own polar bear, Arctic fox and woodlouse drawings
     (lesson-kit/_icons.py, which is what the lesson shows too); the kit's
     desert and Arctic habitat scenes (ART.scene("habitat", 1) and 3) as the
     places those animals belong; the lookup step's fact card; the ask step's
     damp and dry patches; and the context step's road, streetlight, recycling
     centre and park pond.

     This file: the palette, the helpers every chapter shares, the title motif
     and the chapter "Suited to the place". Every top-level name starts with
     hs, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, suited: P.gold, matters: P.accent, elsewhere: P.blue,
    question: P.plum, near: P.good, sides: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hsOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hsFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k comes in, then 0: a view that is replaced */
  function hsUntil(t, scene, k) { return 1 - hsFrom(t, scene, k); }
  /* fixed numbers for anything scattered: never Math.random */
  var HS_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.79, 0.46, 0.71, 0.13, 0.87];

  /* ---- small drawings every chapter shares ------------------------------------ */

  /* a card plate: the dark stage's own panel, for one of the lesson's drawings */
  function hsPlate(x, y, w, h, o, col, sw) {
    if (!(o > 0)) return "";
    return R(x - 8, y - 8, w + 16, h + 16, 18, P.card, col || P.line, sw || 2, { opacity: clamp(o, 0, 1) });
  }

  /* one of the kit's habitat scenes (0 pond, 1 desert, 2 forest, 3 Arctic),
     whole, on its plate. Its own viewBox is 320 x 200, so w / h is 1.6. */
  function hsHabitat(state, x, y, w, o, col, sw) {
    if (!(o > 0)) return "";
    var h = w / 1.6;
    return G(hsPlate(x, y, w, h, 1, col, sw) + ART.place(ART.scene("habitat", state), x, y, w, h), { opacity: clamp(o, 0, 1) });
  }
  /* a word in a pill with a line to the thing it names; the newest is gold */
  function hsLabel(t, x, y, text, at, to, now, opt) {
    opt = opt || {};
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    var from = opt.anchor === "start" ? [x - 8, y] : opt.anchor === "end" ? [x + 8, y] : [x, y + (opt.up ? -22 : 22)];
    return MK.leader(from[0], from[1], to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: opt.size || 26, anchor: opt.anchor, col: now ? P.gold : P.line });
  }

  /* wavy lines of heat rising from (x, y), n of them, each a pure function of t */
  function hsHeat(x, y, w, h, n, t, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < n; k++) {
      var ph = ((t * 0.55) + HS_SCATTER[k % HS_SCATTER.length]) % 1;
      var cx = x + (k + 0.5) * w / n, top = y - h * ph, a = (1 - ph) * (ph < 0.15 ? ph / 0.15 : 1);
      out += Pth("M" + n2(cx) + "," + n2(top) + " q" + n2(-9) + "," + n2(-12) + " 0," + n2(-24) +
        " q9,-12 0,-24", null, P.accent, 4, { opacity: 0.75 * a * clamp(o, 0, 1) });
    }
    return out;
  }

  /* a snowflake-blue arrow of cold, coming in and stopping short */
  function hsCold(x1, y1, x2, y2, u) { return MK.arrow(x1, y1, x2, y2, u, "#8FC8EC", 7); }

  /* the lesson's four habitat bins, exactly as the sort draws them */
  var HS_BINS = [
    { id: "desert", label: "Desert", pic: "\u{1F3DC}️", animal: "\u{1F42A}", name: "camel" },
    { id: "arctic", label: "Arctic", pic: "\u{1F9CA}", animal: null, name: "polar bear" },
    { id: "forest", label: "Rainforest", pic: "\u{1F334}", animal: "\u{1F412}", name: "monkey" },
    { id: "ocean", label: "Ocean", pic: "\u{1F30A}", animal: "\u{1F40B}", name: "whale" }
  ];
  function hsBinAnimal(k) { return k === 1 ? ART.ICONS.polarbear : HS_BINS[k].animal; }

  /* ==== the title ==============================================================
     The two places the film opens on, as the lesson kit draws them: the desert
     (its camel, cactus, lizard and scorpion) above the Arctic (its polar bear
     and seal). In the spoken title chapter each lights as it is named, each
     gets a tick on "suited to its home", and a question mark asks on "anywhere
     else". Every mark sits in the strip beside the drawings, never over one.
     On the two cards they simply stand. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cDesert = sn ? sc(sn, 0, "desert") : null, cArctic = sn ? sc(sn, 0, "arctic") : null;
    var cCamel = sn ? sc(sn, 0, "camel") : null, cBear = sn ? sc(sn, 0, "bear") : null;
    var cSuited = sn ? sc(sn, 1, "suited") : null, cElse = sn ? sc(sn, 1, "else") : null;
    var dx = 18, dy = 36, aw = 236, ah = aw / 1.6, ay = 200;

    /* the marks live in the strip to the right of both cards, never over one */
    var dl = sn ? on(t, cDesert, 0.5) : 0, al = sn ? on(t, cArctic, 0.5) : 0;
    var q = sn ? popIn(t, cElse, 0.45) : 0;
    var dCol = q > 0.3 ? P.plum : dl > 0.5 ? P.gold : P.line, aCol = q > 0.3 ? P.plum : al > 0.5 ? P.blue : P.line;
    out += R(dx - 7, dy - 7, aw + 14, ah + 14, 16, P.card, dCol, q > 0.3 || dl > 0.5 ? 4 : 2);
    out += ART.place(ART.scene("habitat", 1), dx, dy, aw, ah);
    /* "A camel": its own ring, popping onto the camel drawn inside the desert
       plate the moment it is named (the kit's own scene draws it at x 60,
       y 170, size 44 in its 320 x 200 space; scaled and placed here). A ring
       (a hard stroke) reads over the sandy plate where a soft glow of the
       same warm colour would not, and the whole card is still fading in
       during this first second besides. */
    var camelPop = sn ? popIn(t, cCamel, 0.4) : 0;
    if (camelPop > 0) out += C(dx + 61, dy + 116, 30, "none", P.gold, 4, { opacity: Math.min(1, camelPop), transform: around(dx + 61, dy + 116, Math.min(1.08, camelPop)) });
    out += R(dx - 7, ay - 7, aw + 14, ah + 14, 16, P.card, aCol, q > 0.3 || al > 0.5 ? 4 : 2);
    out += ART.place(ART.scene("habitat", 3), dx, ay, aw, ah);
    /* "A polar bear": the same, on the bear inside the Arctic plate (drawn
       at x 85, y 172, size 50). */
    var bearPop = sn ? popIn(t, cBear, 0.4) : 0;
    if (bearPop > 0) out += C(dx + 63, ay + 114, 30, "none", P.gold, 4, { opacity: Math.min(1, bearPop), transform: around(dx + 63, ay + 114, Math.min(1.08, bearPop)) });

    if (sn) {
      /* "suited to its home": a tick beside each place */
      out += MK.tick(306, 110, 21, popIn(t, cSuited, 0.4));
      out += MK.tick(306, 274, 21, popIn(t, cSuited == null ? null : cSuited + 0.3, 0.4));
      /* "anywhere else": the question, between the two and over neither */
      if (q > 0) out += MK.pop(C(306, 192, 30, P.ground, P.plum, 3) +
        Tx(306, 205, "?", "lab huge", "middle", { fill: P.plum }), 306, 192, q);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A desert with a camel, above the icy Arctic with a polar bear">' + out + "</svg>";
  }

  /* ==== chapter: suited to the place ==========================================
     Three views. The lesson's own sort board (its four bins, its first four
     animals), then the camel with the three features the explore step names,
     then the polar bear with the fur and fat the lesson describes. */

  /* ---- view A: the sort board ------------------------------------------------ */
  var HS_BW = 254, HS_BH = 286, HS_BY = 66, HS_BX0 = 46, HS_BGAP = 20;
  function hsBinX(k) { return HS_BX0 + k * (HS_BW + HS_BGAP); }

  function hsBoard(scene, t, o) {
    if (!(o > 0)) return "";
    var c = function (k, name) { return sc(scene, k, name); };
    var cHab = c(0, "habitat"), cWild = c(0, "wild"), cFour = c(0, "four");
    var cFeat = c(2, "features"), cPart = c(2, "part");
    var plates = on(t, cHab, 0.5), out = "";

    HS_BINS.forEach(function (b, k) {
      var x = hsBinX(k), cx = x + HS_BW / 2;
      var aAt = c(1, ["camel", "bear", "monkey", "whale"][k]);
      var hAt = c(1, ["desert", "arctic", "forest", "ocean"][k]);
      var lit = on(t, hAt, 0.45), ap = popIn(t, aAt, 0.45);
      /* "Here are four": each one counted, its edge flashing in turn */
      var count = bump(t, cFour == null ? null : cFour + k * 0.2, 0.8);
      out += R(x, HS_BY, HS_BW, HS_BH, 20, P.card, lit > 0.4 ? P.gold : P.line, lit > 0.4 ? 4 : 2, { opacity: plates });
      if (count > 0) out += R(x, HS_BY, HS_BW, HS_BH, 20, "none", P.gold, 5, { opacity: count });
      var pop = popIn(t, cWild == null ? null : cWild + k * 0.22, 0.4);
      if (pop > 0) {
        out += MK.pop(MK.pic(cx, HS_BY + 78, 94, b.pic), cx, HS_BY + 78, pop);
        out += G(Tx(cx, HS_BY + 158, b.label, "lab big", "middle"), { opacity: Math.min(1, pop) });
      }
      if (ap > 0) {
        /* the animal drops into its bin, and its features flash on "features" */
        var fl = bump(t, cFeat == null ? null : cFeat + k * 0.16, 0.7);
        out += MK.pop(MK.pic(cx, HS_BY + 228, 90, hsBinAnimal(k)), cx, HS_BY + 228, ap);
        if (fl > 0) out += C(cx, HS_BY + 228, 54 + 6 * fl, "none", P.gold, 4, { opacity: fl });
      }
    });
    /* the word, and what a feature is */
    out += MK.pill(584, 28, "habitat", on(t, cHab, 0.4), { size: 30, col: P.gold });
    out += MK.pill(584, 400, "a feature is a part of its body", on(t, cPart, 0.4), { size: 26, col: P.line });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- view B: the camel and its features -------------------------------------
     The lesson's three: a hump of fat, wide feet, long lashes (the explore
     step's "hump, wide feet, long lashes"). The targets are points on the
     camel glyph, measured off the preview sheets. */
  var HS_CAMEL = { cx: 372, cy: 206, size: 250 };
  var HS_CAMEL_AT = { hump: [431, 112], feet: [345, 322], eye: [297, 128] };

  function hsCamelView(scene, t, o) {
    if (!(o > 0)) return "";
    var cHump = sc(scene, 3, "hump"), cFeet = sc(scene, 3, "feet"),
      cLash = sc(scene, 4, "lashes"), cEvery = sc(scene, 4, "every");
    var out = "", every = on(t, cEvery, 0.5);

    /* the desert it is suited to, as the kit draws it */
    out += hsHabitat(1, 760, 112, 372, 1, every > 0.4 ? P.gold : P.line, every > 0.4 ? 4 : 2);
    if (every > 0.4) out += MK.glow(946, 224, 196, P.gold, (every - 0.4) / 0.6 * 0.9);

    var cCamel = sc(scene, 3, "camel"), nod = bump(t, cCamel, 0.8);
    if (nod > 0) out += MK.glow(HS_CAMEL.cx, HS_CAMEL.cy, 168, P.gold, nod * 0.9);
    out += G(Em(HS_CAMEL.cx, HS_CAMEL.cy, HS_CAMEL.size, "\u{1F42A}"),
      { transform: around(HS_CAMEL.cx, HS_CAMEL.cy, 1 + 0.05 * nod) });

    var now = cLash != null && t >= cLash ? "lash" : cFeet != null && t >= cFeet ? "feet" : "hump";
    out += hsLabel(t, 474, 58, "a hump of fat", cHump, HS_CAMEL_AT.hump, now === "hump" || every > 0.4, { anchor: "middle" });
    out += hsLabel(t, 70, 352, "wide feet", cFeet, HS_CAMEL_AT.feet, now === "feet" || every > 0.4, { anchor: "start" });
    out += hsLabel(t, 150, 76, "long lashes", cLash, HS_CAMEL_AT.eye, now === "lash" || every > 0.4, { anchor: "middle" });

    /* grains of sand blown at the eye, turned away by the lashes */
    var lo = on(t, cLash == null ? null : cLash + 0.2, 0.4);
    if (lo > 0) {
      for (var k = 0; k < 5; k++) {
        var ph = ((t * 0.9) + HS_SCATTER[k]) % 1;
        var x = lerp(HS_CAMEL_AT.eye[0] - 140, HS_CAMEL_AT.eye[0] - 24, ph);
        var y = HS_CAMEL_AT.eye[1] + 8 + (HS_SCATTER[k + 4] - 0.5) * 30;
        out += C(x, y, 5, "#E0B86A", null, null, { opacity: lo * (1 - ph) });
      }
    }
    /* every feature suits the desert */
    out += MK.tick(700, 380, 22, popIn(t, cEvery, 0.4));
    out += MK.pill(896, 380, "suited to the desert", every, { size: 26, col: P.gold });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- view C: the polar bear, fur over fat -----------------------------------
     The kit's own polar bear drawing (the one the lesson's sort shows), and a
     cut through its coat beside it: thick fur, then a layer of fat, then the
     bear. The Arctic cold comes down and stops at the fur. */
  var HS_BEAR = { cx: 292, cy: 218, size: 280 };
  function hsBX(v) { return HS_BEAR.cx + (v - 32) * HS_BEAR.size / 64; }
  function hsBY(v) { return HS_BEAR.cy + (v - 32) * HS_BEAR.size / 64; }
  var HS_CUT = { x: 542, y: 112, w: 244, h: 216 };

  function hsBearView(scene, t, o) {
    if (!(o > 0)) return "";
    var cBear = sc(scene, 5, "bear"), cFur = sc(scene, 5, "fur"), cFat = sc(scene, 5, "fat"),
      cCold = sc(scene, 5, "cold"), cReach = sc(scene, 5, "reach");
    var out = "", furO = on(t, cFur, 0.45), fatO = on(t, cFat, 0.45);

    /* the Arctic it is suited to */
    out += hsHabitat(3, 830, 130, 300, 1, P.line, 2);

    /* it is already standing when the line starts; its name makes it glow */
    var nod = bump(t, cBear, 0.8);
    if (nod > 0) out += MK.glow(HS_BEAR.cx, HS_BEAR.cy, 176, P.gold, nod * 0.85);
    out += G(MK.pic(HS_BEAR.cx, HS_BEAR.cy, HS_BEAR.size, ART.ICONS.polarbear),
      { transform: around(HS_BEAR.cx, HS_BEAR.cy, 1 + 0.04 * nod) });

    /* a cut through the coat, lined up with the bear's back */
    var cut = Math.max(furO, fatO);
    if (cut > 0) {
      var x = HS_CUT.x, y = HS_CUT.y, w = HS_CUT.w, h = HS_CUT.h;
      var furH = 78, fatH = 64;
      out += L(hsBX(31), hsBY(25), lerp(hsBX(31), x, cut), lerp(hsBY(25), y, cut), P.gold, 2.5, { opacity: 0.8, "stroke-dasharray": "8 7" });
      out += L(hsBX(31), hsBY(31), lerp(hsBX(31), x, cut), lerp(hsBY(31), y + h, cut), P.gold, 2.5, { opacity: 0.8, "stroke-dasharray": "8 7" });
      out += G(R(x, y, w, h, 16, "#20465F", P.line, 2) +
        R(x, y, w, furH, 0, "#EDF1F5") +
        R(x, y + furH, w, fatH, 0, "#F4C95D") +
        R(x, y + furH + fatH, w, h - furH - fatH, 0, "#1B3A52") +
        R(x, y, w, h, 16, "none", P.line, 3) +
        Tx(x + w / 2, y + 48, "thick fur", "lab dark", "middle") +
        Tx(x + w / 2, y + furH + 40, "a layer of fat", "lab dark", "middle") +
        Tx(x + w / 2, y + furH + fatH + 46, "the bear", "lab", "middle"),
        { opacity: clamp(cut, 0, 1) });
      /* little hairs on top of the fur */
      for (var k = 0; k < 11; k++) {
        var hx = x + 12 + k * (w - 24) / 10;
        out += L(hx, y + 2, hx - 4, y - 12, "#EDF1F5", 3, { opacity: furO });
      }
      /* the fat band is named after the fur */
      if (fatO > 0) out += R(x, y + furH, w, fatH, 0, "none", P.goldDeep, 3, { opacity: fatO });
    }

    /* the Arctic cold comes down, and stops at the fur */
    var cold = on(t, cCold, 0.5), stop = on(t, cReach, 0.45);
    if (cold > 0) {
      for (var j = 0; j < 3; j++) {
        var ax = HS_CUT.x + 54 + j * 68;
        out += hsCold(ax, 46, ax, HS_CUT.y - 10, on(t, cCold == null ? null : cCold + j * 0.18, 0.45));
      }
      out += Tx(HS_CUT.x + HS_CUT.w / 2, 30, "the Arctic cold", "lab", "middle", { fill: "#8FC8EC", opacity: cold });
    }
    if (stop > 0) {
      out += L(HS_CUT.x - 6, HS_CUT.y + 2, HS_CUT.x + HS_CUT.w + 6, HS_CUT.y + 2, "#8FC8EC", 6, { opacity: stop });
      out += MK.cross(HS_CUT.x - 44, HS_CUT.y + 34, 24, popIn(t, cReach, 0.4), "#8FC8EC");
      out += MK.glow(HS_CUT.x + HS_CUT.w / 2, HS_CUT.y + 180, 92, P.accent, stop * (0.6 + 0.4 * breathe(t)));
      out += MK.pill(HS_CUT.x + HS_CUT.w / 2, HS_CUT.y + HS_CUT.h + 44, "warm inside", stop, { size: 26, col: P.accent });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsSuitedChapter(scene, beat, t, i) {
    var out = "";
    out += hsBoard(scene, t, hsUntil(t, scene, 3));
    out += hsCamelView(scene, t, hsFrom(t, scene, 3) * hsUntil(t, scene, 5));
    out += hsBearView(scene, t, hsFrom(t, scene, 5));
    return svg(out);
  }

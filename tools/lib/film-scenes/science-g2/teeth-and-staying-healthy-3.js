  /* ==== chapters: a healthy body, when you are ill, and the recap ============
     tools/lib/film-scenes/science-g2/teeth-and-staying-healthy-3.js.

     A healthy body is the lesson's own "Healthy choices" sort: its three
     things (good food, keeping clean, moving), its own pictures for each, and
     the water and the good night's sleep it ends on. When you are ill is its
     "Signs of illness" demo, frame by frame, with the same faces it shows.
     People are drawn brown by the engine (renderer.skin); the lesson's own
     illness faces are smileys, which have no skin tone to take. */

  /* ---- the three things that keep a body healthy --------------------------- */
  var TH_H = [
    { pic: "\u{1F96C}", cap: "good food", cue: "food" },
    { pic: "\u{1F9FC}", cap: "keeping clean", cue: "clean" },
    { pic: "\u{1F3C3}", cap: "moving", cue: "moving" }
  ];
  /* The cards stop at y 328, so the row of pictures under them (drawn about
     y 382, and an emoji's box is taller than its size) stays inside the 440. */
  var TH_HC = { x: 44, y: 92, w: 344, h: 236, gap: 26 };
  function thHX(n) { return TH_HC.x + n * (TH_HC.w + TH_HC.gap); }

  function thHealthyChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cThree = c(0, "three"), cFood = c(0, "food"), cClean = c(0, "clean"), cMove = c(0, "moving");
    var cDiet = c(1, "diet"), cAll = c(1, "all"), cFruit = c(1, "fruit");
    var cWash = c(2, "wash"), cEat = c(2, "eat"), cGerms = c(2, "germs");
    var cMove2 = c(3, "move"), cRun = c(3, "run"), cPlay = c(3, "play"), cClimb = c(3, "climb"),
      cHeart = c(3, "heart"), cMuscles = c(3, "muscles");
    var cRest = c(4, "rest"), cWater = c(4, "water"), cSleep = c(4, "sleep");
    var out = "", n;

    /* which of the three the voice is on now: that card is lit, the others quiet */
    var focus = cRest != null && t >= cRest ? -1
      : cMove2 != null && t >= cMove2 ? 2 : cWash != null && t >= cWash ? 1 : cDiet != null && t >= cDiet ? 0 : -2;
    var born = [cFood, cClean, cMove];
    var rest = thFrom(t, scene, 4);
    for (n = 0; n < 3; n++) {
      var o = Math.min(1, popIn(t, cThree == null ? null : cThree + n * 0.2, 0.4));
      if (o <= 0) continue;
      var lit = on(t, born[n], 0.4), quiet = focus === -2 ? 1 : focus === n ? 1 : lerp(1, 0.38, inAt(t, BEATS[scene.first + 1].start - GAP, 0.5));
      quiet = quiet * (1 - rest);   /* all the way out on "Then rest", not to a tenth */
      var x = thHX(n), y = TH_HC.y;
      out += G(R(x, y, TH_HC.w, TH_HC.h, 22, lit > 0.5 && focus === n ? "#183B33" : P.card,
          lit > 0.5 && focus === n ? P.good : P.line, lit > 0.5 && focus === n ? 3 : 2) +
        MK.pop(MK.pic(x + TH_HC.w / 2, y + 100, 104, TH_H[n].pic), x + TH_HC.w / 2, y + 100, Math.min(1.06, popIn(t, born[n], 0.45))) +
        Tx(x + TH_HC.w / 2, y + 206, TH_H[n].cap, "lab big", "middle", { opacity: lit }),
        { opacity: clamp(o * quiet, 0, 1) });
    }

    /* ---- beat 1: your diet is everything you eat and drink ---- */
    var b1 = thOnly(t, scene, 1);
    if (b1 > 0.01) {
      var pan = MK.pill(thHX(0) + TH_HC.w / 2, 46, "your diet", on(t, cDiet, 0.4), { size: 29, col: P.good });
      var food = ["\u{1F34E}", "\u{1F955}", "\u{1F95B}", "\u{1F4A7}"];
      for (n = 0; n < 4; n++) {
        var fo = Math.min(1.06, popIn(t, cAll == null ? null : cAll + n * 0.16, 0.35));
        if (fo <= 0) continue;
        var bmp = n < 2 ? 1 + 0.1 * bump(t, cFruit, 0.8) : 1;
        /* onto `pan`, never `out`: on `out` they missed the beat's own fade
           and sat at full brightness over the start of the next line. */
        pan += MK.pop(MK.pic(96 + n * 78, 382, 62, food[n]), 96 + n * 78, 382, fo * bmp);
      }
      pan += MK.tick(thHX(0) + TH_HC.w - 34, TH_HC.y + 34, 22, popIn(t, cFruit, 0.4));
      out += G(pan, { opacity: b1 });
    }

    /* ---- beat 2: wash your hands before you eat ---- */
    var b2 = thOnly(t, scene, 2);
    if (b2 > 0.01) {
      var mid = thHX(1) + TH_HC.w / 2, pan2 = "";
      pan2 += MK.pill(mid, 46, "before you eat", on(t, cEat, 0.4), { size: 29, col: P.good });
      var ho = Math.min(1.06, popIn(t, cWash, 0.45));
      if (ho > 0) pan2 += MK.pop(MK.pic(mid - 74, 382, 80, "\u{1F932}"), mid - 74, 382, ho) +
        MK.pop(MK.pic(mid + 78, 382, 72, "\u{1F37D}️"), mid + 78, 382, Math.min(1.06, popIn(t, cEat, 0.45)));
      /* the germs on the hands, washed away as they are named */
      var go = on(t, cGerms, 0.4), away = on(t, cGerms == null ? null : cGerms + 0.9, 0.9);
      if (go > 0) for (n = 0; n < 3; n++)
        pan2 += thGerm(mid - 104 + n * 34, 370 - n * 10 + 38 * away, 12, go * (1 - away), t, n + 2);
      /* A TICK, not a cross: everywhere else in this film a red cross means
         "not this" (the sweets and the fizzy drink), and washing your hands
         before you eat is the thing the lesson asks you to do. */
      pan2 += MK.tick(mid - 158, 382, 21, popIn(t, cGerms == null ? null : cGerms + 1.1, 0.4));
      out += G(pan2, { opacity: b2 });
    }

    /* ---- beat 3: move every day ---- */
    var b3 = thOnly(t, scene, 3);
    if (b3 > 0.01) {
      var mx = thHX(2) + TH_HC.w / 2, pan3 = "";
      var doing = ["\u{1F3C3}", "⚽", "\u{1F9D7}"], at3 = [cRun, cPlay, cClimb];
      for (n = 0; n < 3; n++)
        pan3 += MK.pop(MK.pic(mx - 116 + n * 116, 382, 80, doing[n]), mx - 116 + n * 116, 382, Math.min(1.06, popIn(t, at3[n], 0.35)));
      var beat3 = popIn(t, cHeart, 0.4);
      if (beat3 > 0) pan3 += G(MK.pic(mx - 66, 46, 62, "❤️"), { transform: around(mx - 66, 46, 0.92 + 0.16 * breathe(t * 1.6)), opacity: Math.min(1, beat3) });
      pan3 += MK.pop(MK.pic(mx + 66, 46, 62, "\u{1F4AA}"), mx + 66, 46, Math.min(1.06, popIn(t, cMuscles, 0.4)));
      out += G(pan3, { opacity: b3 });
    }

    /* ---- beat 4: then rest ---- */
    if (rest > 0.01) {
      var items = [{ x: 250, pic: "\u{1F9D8}", cap: "rest", at: cRest },
        { x: 584, pic: "\u{1F4A7}", cap: "drink water", at: cWater },
        { x: 918, pic: "\u{1F6CF}️", cap: "a good night's sleep", at: cSleep }];
      var pan4 = "";
      for (n = 0; n < 3; n++) {
        var it = items[n], oi = Math.min(1.06, popIn(t, it.at, 0.45));
        if (oi <= 0) continue;
        pan4 += MK.pop(MK.pic(it.x, 206, 136, it.pic), it.x, 206, oi);
        pan4 += Tx(it.x, 334, it.cap, "lab big", "middle", { opacity: Math.min(1, on(t, it.at, 0.5)) });
      }
      out += G(pan4, { opacity: rest });
    }
    return svg(out);
  }

  /* ==== chapter: when you are ill =============================================
     The lesson's own "Signs of illness" demo: its faces, one at a time, with
     the signs listed beside them as they are said, and the grown-up its last
     frame shows. */
  var TH_FACE = { x: 276, y: 206, s: 246 };

  function thIllChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cIll = c(0, "ill"), cNot = c(0, "not");
    var cGerms = c(1, "germs"), cSigns = c(1, "signs");
    var cHot = c(2, "hot"), cFever = c(2, "fever"), cShiver = c(2, "shivery");
    var cCough = c(3, "cough"), cNose = c(3, "nose"), cTired = c(3, "tired"), cToo = c(3, "too");
    var cHide = c(4, "hide"), cTell = c(4, "tell"), cBetter = c(4, "better");
    var cRest = c(5, "rest"), cWater = c(5, "water"), cMend = c(5, "mend");
    var out = "", n;

    /* "Do not hide it": the ill face dims and SINKS AWAY, and comes back on
       "Tell a grown-up" as the doctor arrives. The hiding is what is shown
       going wrong; nothing is marked on the child. (A red cross used to be
       drawn across the face, and in this film a cross means "not this" - the
       sweets and the fizzy drink wear one. A panel drawn over the face instead
       read as a missing picture.) */
    var hide = on(t, cHide, 0.45) * (1 - on(t, cTell, 0.5));
    var hideDrop = 34 * hide;   /* 34, so the face's box stays inside the 440 */
    var mend = on(t, cMend, 0.7);
    /* "You may feel shivery": the face shakes while that is said */
    var shake = cShiver == null ? 0 : 5 * Math.sin((t - cShiver) * 17) * on(t, cShiver, 0.4) * (1 - on(t, cCough, 0.4));
    out += MK.glow(TH_FACE.x, TH_FACE.y, 190, mend > 0.4 ? P.good : P.plum, Math.max(on(t, cIll, 0.7) * 0.8 * (1 - mend), mend * 0.85));

    /* the lesson's four faces, each showing while its own sign is spoken */
    /* The sleeping face ends at "Do not hide it": the lesson's own ill face is
       what "tell a grown-up" and "your body will mend" are said over. */
    var faces = [["\u{1F912}", cIll, cHot], ["\u{1F975}", cHot, cCough], ["\u{1F927}", cCough, cTired],
      ["\u{1F634}", cTired, cHide], ["\u{1F912}", cHide, null]];
    for (n = 0; n < faces.length; n++) {
      var fo = on(t, faces[n][1], 0.45) * (1 - on(t, faces[n][2], 0.45)) * (1 - 0.62 * hide);
      if (fo <= 0.004) continue;
      var tilt = n === 0 ? 5 * on(t, cNot, 0.6) * (1 - on(t, cHot, 0.4)) : 0;
      out += G(MK.pic(TH_FACE.x + shake, TH_FACE.y + hideDrop, TH_FACE.s, faces[n][0]),
        { opacity: clamp(fo, 0, 1), transform: "rotate(" + n2(tilt) + " " + n2(TH_FACE.x) + " " + n2(TH_FACE.y) + ")" });
    }
    out += MK.pill(TH_FACE.x, 396, "not working as it should", on(t, cNot, 0.4) * thOnly(t, scene, 0), { size: 28, col: P.plum });

    /* germs getting in: three of them cross to the face and fade into it */
    var gi = on(t, cGerms, 0.35) * thOnly(t, scene, 1);
    if (gi > 0) for (n = 0; n < 3; n++) {
      var u = clamp((t - cGerms - n * 0.2) / 1.1, 0, 1);
      out += thGerm(lerp(560, TH_FACE.x + 40, u), lerp(96 + n * 74, TH_FACE.y - 20 + n * 26, u), 14, gi * (1 - u * u), t, n);
    }

    /* the thermometer, for the fever */
    var th = on(t, cHot, 0.45) * (1 - on(t, cCough, 0.5));
    if (th > 0) {
      var rise = on(t, cHot == null ? null : cHot + 0.2, 1.0);
      out += G(R(464, 106, 32, 200, 16, "#E7F1F7", "#93AABE", 3) + C(480, 324, 28, "#E9744F") +
        R(471, 302 - 184 * rise, 18, 184 * rise, 9, "#E9744F") +
        L(500, 150, 518, 150, "#93AABE", 4) + L(500, 192, 518, 192, "#93AABE", 4) +
        L(500, 234, 518, 234, "#93AABE", 4), { opacity: th });
    }
    /* shivery: the face itself shakes, with three motion marks beside it and
       clear of it (drawn over the face they read as blobs stuck to it) */
    var sh = on(t, cShiver, 0.4) * (1 - on(t, cCough, 0.4));
    if (sh > 0) for (n = 0; n < 3; n++) {
      var yy = TH_FACE.y - 62 + n * 62;
      out += L(62, yy, 62 + 48 * sh, yy, P.plum, 6, { opacity: sh * (0.5 + 0.5 * breathe(t + n)) });
    }

    /* ---- the signs, listed as they are said ---- */
    /* The list goes ALL the way out on "Do not hide it": at a fifth it stayed
       under the doctor, and the leader line ran through its rows. */
    var listO = on(t, cSigns, 0.5) * (1 - thFrom(t, scene, 4));
    if (listO > 0.01) {
      var rows = [
        { text: "a fever", at: cFever }, { text: "a cough", at: cCough },
        { text: "a runny nose", at: cNose }, { text: "feeling very tired", at: cTired }
      ];
      var puls = 1 + 0.06 * bump(t, cToo, 0.9);
      out += G(Tx(620, 78, "signs you can see and feel", "lab big muted", "start") +
        MK.list(620, 136, rows, t, { lh: 60, cls: "lab big" }),
        { opacity: clamp(listO, 0, 1), transform: around(620, 200, puls) });
    }

    /* ---- beat 4: do not hide it; tell a grown-up ---- */
    var b4 = thOnly(t, scene, 4);   /* beat 4 ALONE: on beat 5 the bed and the glass have that side */
    if (b4 > 0.01) {
      var pan = "";
      var to = Math.min(1.06, popIn(t, cTell, 0.45));
      if (to > 0) {
        pan += MK.pop(MK.pic(806, 238, 210, "\u{1F469}‍⚕️"), 806, 238, to);
        pan += MK.leader(TH_FACE.x + 120, TH_FACE.y - 40, 716, 200, on(t, cTell == null ? null : cTell + 0.2, 0.7), P.gold);
        pan += Tx(806, 384, "tell a grown-up", "lab big", "middle", { opacity: Math.min(1, on(t, cTell, 0.5)) });
      }
      pan += MK.tick(978, 104, 26, popIn(t, cBetter, 0.4));
      out += G(pan, { opacity: clamp(b4, 0, 1) });
    }

    /* ---- beat 5: rest, drink water, and the body mends ---- */
    var b5 = thOnly(t, scene, 5);
    if (b5 > 0.01) {
      var pan5 = "";
      /* Where the grown-up stood: hard against the right edge they left the
         middle of the frame empty. */
      pan5 += MK.pop(MK.pic(706, 216, 150, "\u{1F6CF}️"), 706, 216, Math.min(1.06, popIn(t, cRest, 0.45)));
      pan5 += Tx(706, 342, "rest", "lab big", "middle", { opacity: Math.min(1, on(t, cRest, 0.5)) });
      pan5 += MK.pop(MK.pic(982, 216, 138, "\u{1F4A7}"), 982, 216, Math.min(1.06, popIn(t, cWater, 0.45)));
      pan5 += Tx(982, 342, "drink water", "lab big", "middle", { opacity: Math.min(1, on(t, cWater, 0.5)) });
      pan5 += MK.pill(TH_FACE.x, 402, "your body will mend", on(t, cMend, 0.4), { size: 29, col: P.good, ink: P.ink });
      out += G(pan5, { opacity: b5 });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------- */
  var TH_RECAP = MK.recapKind([
    { beat: 0, at: "teeth", title: "Three kinds of teeth", sub: "incisors cut, canines tear, molars grind",
      pic: function (cx, cy, size) { var s = size * 0.34; return thTooth(cx, cy - s * 0.12, s, 1, 0, 0.55); } },
    { beat: 1, at: "brush", title: "Brush", sub: "twice a day, two whole minutes", pic: ART.ICONS.toothbrush },
    { beat: 2, at: "healthy", title: "A healthy body", sub: "good food, keeping clean, moving", pic: "\u{1F4AA}" },
    { beat: 3, at: "ill", title: "Feeling ill?", sub: "tell a grown-up, rest, drink water", pic: "\u{1F912}" }
  ], { goBeat: 3, goAt: "mend" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The three kinds of teeth, and what each one does",
      "How to brush, and what sugar does to a tooth",
      "What keeps a body healthy, and what illness looks like"] }),
    teeth: thTeethChapter, brush: thBrushChapter, sugar: thSugarChapter,
    healthy: thHealthyChapter, ill: thIllChapter, recap: TH_RECAP
  };

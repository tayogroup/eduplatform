  /* ==== Grade 2 Science, Lesson 2: Teeth and Staying Healthy ==================
     tools/lib/film-scenes/science-g2/teeth-and-staying-healthy.js, with -2.js
     and -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/teeth-and-staying-healthy.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the tap figure of the mouth (ART.figure("mouth"):
     tongue, molars, canines, incisors, one kind named at a time), the lesson's
     own pictures for what each tooth does (an apple, meat, peanuts, from its
     "Tooth jobs" step), the kit's own toothbrush drawing, and the pictures its
     "Healthy choices" sort and its "Signs of illness" demo show.

     This file: the palette, the drawings every chapter shares, the title motif
     and the chapter "Three kinds of teeth". Every top-level name here starts
     with th, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, teeth: P.gold, brush: P.blue, sugar: P.accent,
    healthy: P.good, ill: P.plum, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function thOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function thFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var TH_SCATTER = [0.21, 0.78, 0.44, 0.93, 0.07, 0.61, 0.35, 0.86, 0.52, 0.14, 0.69, 0.29];

  /* ---- drawings this film shares ---------------------------------------------- */

  /* One tooth of its own, a molar with two roots, in a local box of
     x -50..50, y -62..74, drawn in the kit's tooth colours (FIGURES.mouth
     fills #FFFDF6 over #D9D2C0). s is the crown's half width. `hole` opens a
     dark pit in the crown, for the germs' work in the Sugar chapter. */
  var TH_TOOTH_D = "M-50,-20 C-50,-58 -28,-62 -14,-48 C-6,-58 6,-58 14,-48 C28,-62 50,-58 50,-20 " +
    "L50,4 C50,22 38,26 34,44 L28,66 C26,74 16,74 14,66 L6,30 C4,22 -4,22 -6,30 L-14,66 " +
    "C-16,74 -26,74 -28,66 L-34,44 C-38,26 -50,22 -50,4 Z";
  function thTooth(cx, cy, s, o, hole, shine) {
    if (!(o > 0)) return "";
    var inner = Pth(TH_TOOTH_D, "#FFFDF6", "#D9D2C0", 3);
    if (shine > 0) inner += Pth("M-32,-38 C-24,-50 -10,-52 -4,-46", null, "#FFFFFF", 7, { opacity: 0.8 * clamp(shine, 0, 1) });
    if (hole > 0) inner += C(-2, -26, 23 * clamp(hole, 0, 1), "#3A2418") +
      C(-2, -26, 23 * clamp(hole, 0, 1), "none", "#8A6A4A", 3);
    return G(inner, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s / 50) + ")", opacity: clamp(o, 0, 1) });
  }

  /* A germ: a round body with short spikes and two dark specks, the colour of
     the lesson's own germ picture. k gives each one its own wobble, so a row
     of them is never a row of identical discs - and it is a pure function of t. */
  function thGerm(cx, cy, r, o, t, k) {
    if (!(o > 0)) return "";
    var wob = Math.sin((t || 0) * 2.3 + k * 1.7) * r * 0.1, out = "";
    for (var n = 0; n < 7; n++) {
      var a = n * Math.PI * 2 / 7 + k * 0.5;
      out += L(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9,
        cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 1.5, P.plum, Math.max(1.4, r * 0.22));
    }
    out += C(cx, cy, r + wob, P.plum);
    out += C(cx - r * 0.32, cy - r * 0.24, r * 0.2, "#3B1F4A");
    out += C(cx + r * 0.3, cy + r * 0.1, r * 0.16, "#3B1F4A");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* The lesson kit's own toothbrush drawing (its bristles point up and to the
     right), size px, centred on (cx, cy) and turned `rot` degrees. */
  function thBrush(cx, cy, size, rot, o) {
    if (!(o > 0)) return "";
    return G(MK.pic(cx, cy, size, ART.ICONS.toothbrush),
      { transform: "rotate(" + n2(rot || 0) + " " + n2(cx) + " " + n2(cy) + ")", opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a line to the thing it names; gold while it is the
     one being talked about, quiet once the voice has moved on */
  function thLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* ==== the title ==============================================================
     The lesson's own mouth, in a round window. In the spoken title chapter the
     three kinds of teeth light one at a time, on "cut", "tear" and "grind";
     the kit's toothbrush comes in on "Look after them", and the whole thing
     warms green on "your whole body". On the two cards the mouth simply is. */
  var TH_KINDS = [["incisors", "cut"], ["canines", "tear"], ["molars", "grind"]];
  function thMotifMouth(t, o) {
    var fig = ART.figure("mouth");
    if (!o.scene) return fig;
    var at = {}, k;
    for (k = 0; k < 3; k++) at[TH_KINDS[k][0]] = sc(o.scene, 0, TH_KINDS[k][1]);
    if (at.incisors == null || t < at.incisors) return fig;
    for (k = 0; k < 3; k++) {
      var me = TH_KINDS[k][0], next = k < 2 ? at[TH_KINDS[k + 1][0]] : null;
      var a = on(t, at[me], 0.3) * (1 - on(t, next, 0.3));
      if (a > 0.004) fig = ART.ring(fig, me, "rgba(244,201,93," + n2(a) + ")", 6);
    }
    for (k = 0; k < 3; k++) {
      var b = lerp(0.4, 1, on(t, at[TH_KINDS[k][0]], 0.45));
      if (b < 0.995) fig = ART.dim(fig, TH_KINDS[k][0], b);
    }
    return ART.dim(fig, "tongue", 0.32);
  }

  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var lookAt = o.scene ? sc(o.scene, 1, "look") : null, bodyAt = o.scene ? sc(o.scene, 1, "body") : null;
    out += el("clipPath", { id: "thMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 166, P.good, on(t, bodyAt, 0.7) * (0.6 + 0.4 * breathe(t)));
    out += G(ART.place(thMotifMouth(t, o), 14, 56, 332, 249), { "clip-path": "url(#thMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    var bo = Math.min(1, popIn(t, lookAt, 0.4));
    if (bo > 0) out += G(thBrush(288, 292, 80, -8, 1), { transform: around(288, 292, Math.min(1.06, popIn(t, lookAt, 0.4))), opacity: bo });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="An open mouth showing the three kinds of teeth, with a toothbrush">' +
      out + "</svg>";
  }

  /* ==== chapter: three kinds of teeth =========================================
     The lesson's tap figure of the mouth, big on the left, with the three
     cards of its "Tooth jobs" step on the right - the same pictures and the
     same words (incisors cut, canines tear, molars grind). Rule 3: only the
     kind being named wears the lesson's gold tap outline, the kinds named
     before are shown by brightness, and the tongue stays quiet because it is
     not a tooth. */
  var TH_M = { x: 24, y: 8, w: 560, h: 420, k: 1.75 };
  function thMX(v) { return TH_M.x + v * TH_M.k; }
  function thMY(v) { return TH_M.y + v * TH_M.k; }
  /* where each kind sits in the lesson's drawing, in the film's space */
  var TH_AT = {
    incisors: [thMX(161), thMY(72)], canines: [thMX(207), thMY(77)], molars: [thMX(249), thMY(89)]
  };
  /* FIGURES.mouth draws the incisors' two rows with an outline rect each, and
     ART.ring styles only the first it finds, so the lower row is drawn here,
     from the same rect, with the same alpha. */
  var TH_LOWER = [122, 148, 78, 40, 8];

  var TH_JOBS = [
    { part: "incisors", pic: "\u{1F34E}", label: "incisors cut" },
    { part: "canines", pic: "\u{1F356}", label: "canines tear" },
    { part: "molars", pic: "\u{1F95C}", label: "molars grind" }
  ];
  var TH_CARD = { x: 628, y: 22, w: 508, h: 122, gap: 17 };
  function thCardY(n) { return TH_CARD.y + n * (TH_CARD.h + TH_CARD.gap); }
  function thJobCard(n, o, q, fill, lit, kick) {
    if (!(o > 0)) return "";
    var c = TH_JOBS[n], x = TH_CARD.x, y = thCardY(n), w = TH_CARD.w, h = TH_CARD.h;
    var out = R(x, y, w, h, 20, lit > 0.5 ? "#2A3A2E" : P.card, lit > 0.5 ? P.gold : P.line, lit > 0.5 ? 3 : 2);
    if (fill > 0) {
      /* kick: the job word itself ("they cut", "they tear", "grind and mash")
         nudges the picture of the job, so the card answers the second half of
         the line as well as the first. */
      out += MK.pop(MK.pic(x + 74, y + h / 2, 76, c.pic), x + 74, y + h / 2, Math.min(1.06, fill) + 0.13 * (kick || 0));
      out += Tx(x + 144, y + h / 2 + 11, c.label, "lab big", "start", { opacity: Math.min(1, fill) });
    } else {
      out += MK.qmark(x + 74, y + h / 2, 27, q);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* The food between the RIGHT molars: the same pair the "molars grind" card
     points at, so the label and the food it names are on the same side. */
  var TH_GRIND = [thMX(249), (thMY(110) + thMY(136)) / 2];

  function thTeethChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOpen = c(0, "open"), cThree = c(0, "three"), cShape = c(0, "shape"), cJob = c(0, "job");
    var cInc = c(1, "incisors"), cFlat = c(1, "flat"), cAtFront = c(1, "front"), cCut = c(1, "cut");
    var cCan = c(2, "canines"), cPoint = c(2, "pointed"), cBeside = c(2, "beside"), cTear = c(2, "tear");
    var cMol = c(3, "molars"), cBig = c(3, "big"), cBumps = c(3, "bumps"), cAtBack = c(3, "back");
    var cGrind = c(4, "grind"), cSmall = c(4, "small");
    var cBite = c(5, "bite"), cFront = c(5, "front"), cOff = c(5, "off"), cBack = c(5, "back"), cChew = c(5, "chew");
    var out = "", n;

    /* which kind wears the lesson's gold outline, and when it hands it on */
    var alpha = { incisors: 0, canines: 0, molars: 0 };
    var RING = [["incisors", cInc, cCan], ["canines", cCan, cMol], ["molars", cMol, cFront],
      ["incisors", cFront, cBack], ["molars", cBack, null]];
    RING.forEach(function (r) {
      var a = on(t, r[1], 0.35) * (1 - on(t, r[2], 0.35));
      if (a > alpha[r[0]]) alpha[r[0]] = a;
    });
    /* "three kinds of teeth": each kind flashes once, in turn */
    for (n = 0; n < 3; n++) {
      var fl = bump(t, cThree == null ? null : cThree + n * 0.34, 0.62);
      if (fl > alpha[TH_KINDS[n][0]]) alpha[TH_KINDS[n][0]] = fl;
    }
    /* the shape words widen the outline of the kind being described */
    var widen = { incisors: bump(t, cFlat, 0.9), canines: bump(t, cPoint, 0.9),
      molars: Math.max(bump(t, cBig, 0.9), bump(t, cBumps, 0.9)) };

    /* brightness: a kind not yet named is dim, and the tongue stays dim */
    var dimAt = BEATS[scene.first + 1].start - GAP, floor = lerp(1, 0.48, inAt(t, dimAt, 0.5));
    var named = { incisors: cInc, canines: cCan, molars: cMol };
    var fig = ART.figure("mouth");
    for (n = 0; n < 3; n++) {
      var p = TH_KINDS[n][0];
      if (alpha[p] > 0.004) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(alpha[p]) + ")", 5 + 5 * widen[p]);
    }
    /* Dim AFTER ringing, never before: ART.dim writes its opacity inside the
       part's own <g ...>, and after that ART.ring cannot find the part. */
    for (n = 0; n < 3; n++) {
      var q = TH_KINDS[n][0], lit = lerp(floor, 1, on(t, named[q], 0.45));
      if (lit < 0.995) fig = ART.dim(fig, q, lit);
    }
    fig = ART.dim(fig, "tongue", lerp(1, 0.3, inAt(t, dimAt, 0.5)));

    /* "Open wide": the mouth opens, and grows to exactly its own size */
    var openU = on(t, cOpen, 0.5);
    if (openU <= 0) return svg("");
    out += G(ART.place(fig, TH_M.x, TH_M.y, TH_M.w, TH_M.h),
      { transform: around(thMX(160), thMY(120), lerp(0.88, 1, openU)), opacity: openU });
    /* the lower incisors' own outline, which ART.ring cannot reach */
    if (alpha.incisors > 0.004) out += R(thMX(TH_LOWER[0]), thMY(TH_LOWER[1]), TH_LOWER[2] * TH_M.k, TH_LOWER[3] * TH_M.k,
      TH_LOWER[4] * TH_M.k, "none", P.gold, (5 + 5 * widen.incisors) * TH_M.k, { opacity: alpha.incisors });

    /* "At the front", "Beside them", "At the back": the place is tapped as it
       is said, and the kind that lives there is named half a second later. */
    out += MK.ripple(TH_AT.incisors[0], TH_AT.incisors[1], t, cAtFront, P.gold);
    out += MK.ripple(TH_AT.canines[0], TH_AT.canines[1], t, cBeside, P.gold);
    out += MK.ripple(TH_AT.molars[0], TH_AT.molars[1], t, cAtBack, P.gold);

    /* ---- the three cards of the lesson's own "Tooth jobs" step ---- */
    /* The cards are the beats before this one: they go ALL the way out, not to a
       tenth, or the apple sits over a ghost of "molars grind". */
    var cardsO = 1 - thFrom(t, scene, 5);
    var cards = "";
    for (n = 0; n < 3; n++) {
      var born = popIn(t, cShape == null ? null : cShape + n * 0.22, 0.4);
      var fill = popIn(t, named[TH_JOBS[n].part], 0.45);
      var litNow = alpha[TH_JOBS[n].part] > 0.4 ? 1 : 0;
      cards += thJobCard(n, Math.min(1, born), on(t, cJob == null ? null : cJob + n * 0.16, 0.35), fill, litNow,
        bump(t, [cCut, cTear, cGrind][n], 0.8));
      /* a line from the card to the kind it names, while that kind is named */
      if (alpha[TH_JOBS[n].part] > 0.06 && born > 0)
        cards += MK.leader(TH_CARD.x - 10, thCardY(n) + TH_CARD.h / 2, TH_AT[TH_JOBS[n].part][0], TH_AT[TH_JOBS[n].part][1],
          on(t, named[TH_JOBS[n].part], 0.7), "rgba(244,201,93," + n2(Math.min(1, alpha[TH_JOBS[n].part])) + ")");
    }
    out += G(cards, { opacity: cardsO });

    /* ---- "Molars grind and mash your food into small pieces" ---- */
    var gu = on(t, cGrind, 0.4) * thOnly(t, scene, 4), su = on(t, cSmall, 0.5);
    if (gu > 0) {
      var press = 0.5 + 0.5 * Math.sin((t - cGrind) * 7.5);
      var ar = 15 * press * gu;
      out += MK.arrow(TH_GRIND[0], TH_GRIND[1] - 58, TH_GRIND[0], TH_GRIND[1] - 26 + ar, gu, P.gold, 9);
      out += MK.arrow(TH_GRIND[0], TH_GRIND[1] + 58, TH_GRIND[0], TH_GRIND[1] + 26 - ar, gu, P.gold, 9);
      if (su < 1) out += E(TH_GRIND[0], TH_GRIND[1], 26 + 8 * press, 22 - 7 * press, "#D9A05B", "#8B6A3A", 3,
        { opacity: gu * (1 - su) });
      if (su > 0) for (n = 0; n < 5; n++) {
        var a2 = n * 1.256 + 0.4, d = 30 * su;
        out += C(TH_GRIND[0] + Math.cos(a2) * d, TH_GRIND[1] + Math.sin(a2) * d * 0.8, 7, "#D9A05B", null, null, { opacity: su * gu });
      }
    }

    /* ---- "Bite an apple": the front teeth cut, the back teeth chew ---- */
    var bo = Math.min(1, popIn(t, cBite, 0.45));
    if (bo > 0) {
      var ax = 884, ay = 206, ao = thOnly(t, scene, 5);
      var gone = on(t, cOff, 0.35);
      out += G(MK.pic(ax, ay, 190, "\u{1F34E}"), { opacity: bo * ao, transform: around(ax, ay, Math.min(1.06, popIn(t, cBite, 0.45))) });
      /* the piece the incisors cut off, then carried back to the molars */
      if (gone > 0) {
        out += C(ax - 74, ay - 14, 34 * gone, P.ground, null, null, { opacity: ao });
        var go = on(t, cBack, 0.6), px = lerp(ax - 118, TH_GRIND[0], go), py = lerp(ay - 16, TH_GRIND[1], go);
        var shrink = 1 - 0.55 * on(t, cChew, 0.6);
        out += G(C(px, py, 29 * shrink, "#D9433B", "#8E2B26", 3) + C(px - 8 * shrink, py - 9 * shrink, 9 * shrink, "#F7C9B6"),
          { opacity: ao * gone });
        /* chewed: small pieces beside it */
        var ch = on(t, cChew, 0.7);
        if (ch > 0) for (n = 0; n < 4; n++)
          out += C(px + Math.cos(n * 1.57 + 0.6) * 34 * ch, py + Math.sin(n * 1.57 + 0.6) * 27 * ch, 6.5, "#D9433B", null, null, { opacity: ch * ao });
      }
      /* which teeth are doing it, said in the lesson's own words */
      out += thLabel(t, 664, 344, "front teeth cut", cFront, TH_AT.incisors, cBack == null || t < cBack, 25);
      out += thLabel(t, 664, 416, "back teeth chew", cBack, TH_AT.molars, cBack != null && t >= cBack, 25);
    }
    return svg(out);
  }

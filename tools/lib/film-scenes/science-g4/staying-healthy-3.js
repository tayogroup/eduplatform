  /* ==== Staying Healthy, part 3 ===============================================
     tools/lib/film-scenes/science-g4/staying-healthy-3.js: the chapters
     "Moving every day", "Evidence or opinion" and "Health science near you",
     the recap, and KINDS. The five cards of the moving chapter are the lesson's
     own five reasons, in its order and its words; the two bins of the evidence
     chapter are the bins of its sort; and the four jobs are its four. */

  /* a bar that fills to v, for how strong something is */
  function shBar(x, y, w, h, v, col, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h / 2, P.cell, P.line, 2) +
      R(x + 3, y + 3, Math.max(0, (w - 6) * clamp(v, 0, 1)), h - 6, (h - 6) / 2, col), { opacity: clamp(o, 0, 1) });
  }

  /* one card of the lesson's sort: a picture and a line or two, on paper */
  function shSortCard(cx, cy, w, h, pic, lines, o, s) {
    if (!(o > 0)) return "";
    var inner = R(-w / 2, -h / 2, w, h, 16, P.paper, "#CFC6B2", 2) + Em(-w / 2 + 48, 0, 58, pic);
    var y0 = 8 - (lines.length - 1) * 15;
    for (var k = 0; k < lines.length; k++) inner += Tx(-w / 2 + 90, y0 + k * 30, lines[k], "lab mid dark", "start");
    return G(inner, { transform: tr(cx, cy, s), opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: moving every day ==================================================
     The lesson's five reasons along the top, each lighting as it is named, and
     the beat's own action beneath: the body that stops moving and weakens, the
     muscle that works against the one that never does, the heart speeding up
     when the running starts, the three that follow, and the four ways of
     moving that all count. */
  var SH_MOVE = [
    [1, "muscles", "\u{1F4AA}\u{1F3FE}", "stronger muscles"],
    [2, "heart", "❤️", "a stronger heart"],
    [3, "bones", "\u{1F9B4}", "strong bones"],
    [3, "sleep", "\u{1F634}", "better sleep"],
    [3, "feel", "\u{1F60A}", "a better mood"]
  ];

  function shMoveChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var out = "", k, cx;

    /* Only the reason being named wears gold; the ones already named go quiet
       in teal, and the ones still to come stay dim (rule 3). */
    var last = -1;
    for (k = 0; k < 5; k++) { var a0 = c(SH_MOVE[k][0], SH_MOVE[k][1]); if (a0 != null && t >= a0) last = k; }
    for (k = 0; k < 5; k++) {
      var m = SH_MOVE[k], at = c(m[0], m[1]), p = popIn(t, at, 0.42);
      var now = k === last, done = p > 0 && !now;
      cx = 128 + k * 228;
      out += R(cx - 106, 22, 212, 176, 20, p > 0 ? "#1B3A52" : P.card, now ? P.gold : done ? P.teal : P.line, now ? 3 : 2);
      out += G(Em(cx, 88, 70, m[2]) + Tx(cx, 162, m[3], "lab mid", "middle"),
        { opacity: 0.3 + 0.7 * Math.min(1, p), transform: around(cx, 100, 0.94 + 0.06 * Math.min(p, 1)) });
    }

    var o0 = shOnly(t, scene, 0);
    if (o0 > 0) {
      /* the child bounces while "built to move", then SITS on a stool while
         "sit still all day" is said, and the strength bar drains after them */
      var cBuilt = c(0, "built"), cStill = c(0, "still"), cWeak = c(0, "weaker");
      var stillU = on(t, cStill, 0.5), mv = on(t, cBuilt, 0.4) * (1 - stillU);
      out += G(shChild(210, 408, 184, 1 - stillU, { shirt: P.good }),
        { transform: "translate(0," + n2(-Math.abs(mv * 11 * Math.sin(t * 6))) + ")", opacity: o0 });
      out += G(shSitting(210, 408, 184, stillU, P.good), { opacity: o0 });
      out += MK.pill(300, 300, "sit still", stillU * o0, { size: 26, anchor: "start", col: P.muted });
      var wk = on(t, cWeak, 0.8);
      out += shBar(520, 286, 380, 38, 1 - 0.62 * wk, wk > 0.5 ? P.bad : P.good, o0);
      out += Tx(522, 268, "strong", "lab mid muted", "start", { opacity: o0 });
      out += MK.pill(920, 305, "weaker", wk * o0, { size: 26, anchor: "start", col: P.bad });
    }

    var o1 = shOnly(t, scene, 1);
    if (o1 > 0) {
      var cMu = c(1, "muscles"), cSm = c(1, "smaller");
      var up = on(t, cMu, 0.8), dn = on(t, cSm, 0.8), seen = on(t, cMu, 0.4);
      out += Em(430, 310, 112 * (1 + 0.36 * up), "\u{1F4AA}\u{1F3FE}", { opacity: seen * o1 });
      out += MK.arrow(556, 330, 556, 240, up * o1, P.good, 8);
      out += MK.pill(430, 410, "works", seen * o1, { size: 26, col: P.good });
      out += Em(806, 310, 112 * (1 - 0.4 * dn), "\u{1F4AA}\u{1F3FE}", { opacity: seen * o1 });
      out += MK.arrow(930, 250, 930, 340, dn * o1, P.muted, 8);
      out += MK.pill(806, 410, "never works", on(t, cSm, 0.45) * o1, { size: 26, col: P.muted });
    }

    var o2 = shOnly(t, scene, 2);
    if (o2 > 0) {
      var cHe = c(2, "heart"), cRu = c(2, "running"), cSt = c(2, "stronger");
      var rt = cRu == null ? Infinity : cRu;
      var ph = 3.2 * t + 5.6 * Math.max(0, t - rt);
      var size = 54 * (1 + 0.13 * Math.sin(ph)) * (1 + 0.26 * on(t, cSt, 0.8));
      out += shHeart(420, 310, size, on(t, cHe, 0.5) * o2);
      out += MK.pill(420, 412, "a muscle too", on(t, cHe, 0.45) * o2, { size: 26, col: P.bad });
      out += Em(812, 306, 156, "\u{1F3C3}\u{1F3FE}", { opacity: on(t, cRu, 0.45) * o2 });
      out += MK.pill(812, 412, "running", on(t, cRu, 0.45) * o2, { size: 26, col: P.good });
      out += MK.tick(560, 252, 28, popIn(t, cSt == null ? null : cSt + 0.3, 0.35) * (o2 > 0.5 ? 1 : 0));
    }

    var o3 = shOnly(t, scene, 3);
    if (o3 > 0) {
      var three = [["bones", 584], ["sleep", 812], ["feel", 1040]];
      for (k = 0; k < 3; k++) {
        var a3 = c(3, three[k][0]);
        cx = three[k][1];
        out += G(MK.leader(cx, 208, cx, 320, on(t, a3, 0.5), P.gold), { opacity: o3 });
        out += G(MK.tick(cx, 368, 32, popIn(t, a3 == null ? null : a3 + 0.35, 0.4)), { opacity: o3 });
      }
    }

    var o4 = shOnly(t, scene, 4);
    if (o4 > 0) {
      var ways = [["sport", 260, "⚽", "sport"], ["walking", 520, "\u{1F6B6}", "walking"],
        ["dancing", 780, "\u{1F483}", "dancing"], ["playing", 1040, "\u{1F938}", "playing"]];
      for (k = 0; k < 4; k++) {
        var a4 = c(4, ways[k][0]), q = popIn(t, a4, 0.4);
        if (!(q > 0)) continue;
        cx = ways[k][1];
        out += G(Em(cx, 306, 112, ways[k][2]), { opacity: Math.min(1, q) * o4, transform: around(cx, 306, Math.min(q, 1.1)) });
        out += G(MK.tick(cx + 76, 242, 24, popIn(t, a4 == null ? null : a4 + 0.3, 0.35)), { opacity: o4 });
        out += MK.pill(cx, 400, ways[k][3], Math.min(1, q) * o4, { size: 24, col: P.good });
      }
    }
    return svg(out);
  }

  /* ==== chapter: evidence or opinion ===============================================
     The lesson's own two bins stand on the right for the whole chapter, because
     the chapter is that sort. The point is made first, then what counts as
     evidence, then the lesson's own two cards travel to the bin each belongs
     in: the opinion, and the doctors' measurement. */
  var SH_BINS = [[740, "\u{1F4CA}", "Evidence"], [1024, "\u{1F4AC}", "Opinion"]];

  function shEvPanel(k, t, scene) {
    var c = function (kk, n) { return sc(scene, kk, n); };
    var out = "";
    if (k === 0) {
      var cP = c(0, "point"), cB = c(0, "back");
      out += MK.bubble(40, 76, 404, 112, "Moving keeps you healthy", on(t, cP, 0.5), 150, 238);
      out += Em(576, 300, 100, "\u{1F4CA}", { opacity: Math.min(1, popIn(t, cB, 0.45)), transform: around(576, 300, Math.min(1.1, popIn(t, cB, 0.45))) });
      out += MK.arrow(528, 256, 444, 210, on(t, cB == null ? null : cB + 0.25, 0.6), P.good, 8);
      out += MK.pill(576, 392, "evidence", on(t, cB, 0.45), { size: 26, col: P.good });
      return out;
    }
    if (k === 1) {
      var cTe = c(1, "tested");
      var rows = [
        { text: "measured", at: c(1, "measured"), mark: "tick" },
        { text: "counted", at: c(1, "counted"), mark: "tick" },
        { text: "tested", at: cTe, mark: "tick" }
      ];
      out += MK.list(316, 168, rows, t, { lh: 92, cls: "lab huge", markR: 30 });
      out += MK.arrow(640, 318, 708, 266, on(t, cTe == null ? null : cTe + 0.5, 0.6), P.good, 8);
      return out;
    }
    if (k === 2) {
      var cO = c(2, "opinion"), cN = c(2, "nobody"), f2 = on(t, cO, 1.25);
      out += shSortCard(lerp(390, 1024, f2), lerp(316, 330, f2), 286, 120, "\u{1F644}",
        ["I think PE", "is boring"], on(t, cO, 0.35), lerp(1, 0.86, f2));
      out += MK.pill(1024, 408, "not measured", on(t, cN, 0.45), { size: 24, col: P.bad });
      return out;
    }
    /* the opinion card stays where it was sorted, so the sort accumulates */
    var cD = c(3, "doctors"), cT = c(3, "that"), f3 = on(t, cD, 1.25);
    out += shSortCard(1024, 330, 286, 120, "\u{1F644}", ["I think PE", "is boring"], 0.5, 0.86);
    out += shSortCard(lerp(390, 740, f3), lerp(316, 330, f3), 286, 120, "❤️",
      ["Doctors measured", "stronger hearts"], on(t, cD, 0.35), lerp(1, 0.86, f3));
    out += MK.tick(740, 412, 26, popIn(t, cT, 0.4));
    return out;
  }

  /* The bins stand for the whole chapter, and so does the child making the
     point: they are the one who has to back it up. A bin is GOLD only while its
     own card is being sorted -- the first cut left Opinion gold under "That is
     evidence", so the lit bin and the spoken line disagreed -- and goes quiet
     in teal once the next one is being decided. */
  function shEvChapter(scene, beat, t, i) {
    var out = "", k;
    var b3 = into(t, scene.first + 3);
    var evLit = on(t, sc(scene, 3, "doctors"), 0.5);
    var opLit = on(t, sc(scene, 2, "opinion"), 0.5);
    for (k = 0; k < 2; k++) {
      var b = SH_BINS[k];
      var now = k === 0 ? evLit : opLit * (1 - b3), was = k === 0 ? 0 : opLit * b3;
      out += R(b[0] - 98, 40, 196, 210, 20, now > 0.5 || was > 0.5 ? "#1B3A52" : P.card,
        now > 0.5 ? P.gold : was > 0.5 ? P.teal : P.line, now > 0.5 ? 3 : 2);
      out += Em(b[0], 118, 80, b[1]);
      out += Tx(b[0], 216, b[2], "lab big", "middle");
    }
    out += shChild(150, 424, 176, 1, { shirt: P.teal });
    out += crossfade(t, i, scene, function (n) { return shEvPanel(n - scene.first, t, scene); });
    return svg(out);
  }

  /* ==== chapter: health science near you ===========================================
     A street of four places, which rises when "your own area" is said, and the
     lesson's own four jobs above them, lighting one at a time. The lab is not
     crossed out: the lesson says science is not ONLY in a lab, so the lab stays
     and the street is what is added. */
  var SH_JOBS = [
    [190, "\u{1F48A}", "pharmacist", "pharmacy"],
    [455, "\u{1F489}", "nurse", "clinic"],
    [720, "\u{1F415}", "vet", "vet"],
    [985, "\u{1F3C3}\u{1F3FE}", "PE teacher", "school"]
  ];

  function shJobsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLab = c(0, "lab"), cArea = c(0, "area"), cSafe = c(1, "safe"), cSchool = c(3, "school");
    var ats = [c(1, "pharm"), c(2, "nurse"), c(2, "vet"), c(3, "pe")];
    var cards = shFrom(t, scene, 1), out = "", k;
    /* the job being named wears gold; the ones already named go quiet in teal */
    var last = -1;
    for (k = 0; k < 4; k++) if (ats[k] != null && t >= ats[k]) last = k;

    out += R(52, 396, 1064, 13, 6, "#2E5D7C", null, null, { opacity: on(t, cArea, 0.5) });
    for (k = 0; k < 4; k++) {
      var j = SH_JOBS[k], cx = j[0];
      var rise = on(t, cArea == null ? null : cArea + k * 0.13, 0.5);
      if (rise > 0) {
        var bd = R(cx - 92, 300, 184, 96, 8, "#1A3C58", P.line, 2) +
          R(cx - 74, 310, 148, 32, 6, P.cell) + Tx(cx, 335, j[3], "lab mid", "middle") +
          R(cx - 60, 352, 40, 32, 5, "#0E2740") + R(cx + 20, 352, 40, 32, 5, "#0E2740") +
          R(cx - 18, 356, 36, 40, 4, "#2A5573");
        out += G(bd, { transform: "translate(0," + n2((1 - rise) * 40) + ")", opacity: rise });   /* 40, not 60: at 60 a rising building hung 16 px below the box */
      }
      if (cards > 0) {
        var p = popIn(t, ats[k], 0.42), now = k === last, done = p > 0 && !now;
        out += G(R(cx - 105, 40, 210, 168, 20, p > 0 ? "#1B3A52" : P.card,
            now ? P.gold : done ? P.teal : P.line, now ? 3 : 2) +
          Em(cx, 102, 80, j[1]) + Tx(cx, 184, j[2], "lab mid", "middle"),
          { opacity: cards * (0.32 + 0.68 * Math.min(1, p)) });
      }
    }
    /* the lab is on stage from the chapter's first frame -- it was blank for a
       second before "not only in a lab" -- and its name pops on the cue */
    var labO = 1 - cards;
    if (labO > 0) {
      out += Em(584, 156, 170, "\u{1F52C}", { opacity: into(t, scene.first) * labO });
      out += MK.pill(584, 268, "a lab", on(t, cLab, 0.45) * labO, { size: 28, col: P.line });
    }
    /* "how much of it is safe": the pharmacist's own measured dose, in the band
       between the cards and the street, so it sits on nothing */
    var safeO = on(t, cSafe, 0.5) * cards * shOnly(t, scene, 1);
    if (safeO > 0) {
      out += G(shCup(128, 254, 58, 64, 0.7, 1, t, null), { opacity: safeO });
      out += MK.pill(176, 254, "the safe amount", safeO, { size: 22, anchor: "start", col: P.gold });
    }
    /* "a whole school": children in front of the school */
    var school = on(t, cSchool, 0.8) * cards;
    if (school > 0) {
      for (k = 0; k < 5; k++) {
        var sx = 909 + k * 38, so = on(t, cSchool == null ? null : cSchool + k * 0.12, 0.35);
        out += shChild(sx, 396, 72, so * school, { shirt: k % 2 ? P.gold : P.teal });
      }
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var SH_RECAP = MK.recapKind([
    { beat: 0, at: "medicine", title: "Medicines", sub: "the right amount, a grown-up", pic: "\u{1F48A}" },
    { beat: 1, at: "infect", title: "Infectious", sub: "it spreads from one to another",
      pic: function (cx, cy, size, t) { return shGerm(cx, cy, size * 0.4, 1, t, 0); } },
    { beat: 1, at: "vaccine", title: "Vaccines", sub: "ready before the germ arrives", pic: "\u{1F489}" },
    { beat: 2, at: "move", title: "Move every day", sub: "muscles, heart, bones, sleep, mood", pic: "\u{1F3C3}\u{1F3FE}" },
    { beat: 3, at: "evidence", title: "Evidence", sub: "measured, counted or tested", pic: "\u{1F4CA}" },
    { beat: 3, at: "near", title: "Science near you", sub: "pharmacist, nurse, vet, PE teacher", pic: "\u{1F3E5}" }
  ], { goBeat: 3, goAt: "near" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Medicines, used safely", "Infectious diseases, and vaccines", "Moving every day, and proving a point"] }),
    medicines: shMedChapter, infectious: shInfChapter, vaccines: shVacChapter,
    moving: shMoveChapter, evidence: shEvChapter, jobs: shJobsChapter, recap: SH_RECAP
  };

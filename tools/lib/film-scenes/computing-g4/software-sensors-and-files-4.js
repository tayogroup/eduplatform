  /* ==== Software, Sensors and Files, part 4: how big is a file? ===============
     tools/lib/film-scenes/computing-g4/software-sensors-and-files-4.js. See the
     header of software-sensors-and-files.js.

     Every size here is the lesson's own: a story about 20 KB, a photo about
     3 MB, a song about 5 MB, a film about 2 GB, a game from a few MB to 50 GB.
     The bars are drawn on a log scale (a kilobyte to fifty gigabytes spans
     seven and a half orders of magnitude, and a straight scale would draw the
     story as a hairline and the game as the whole screen), so what the film
     draws is the lesson's own ordering, not a new claim about exact bytes. */

  /* ---- the size ladder: one log scale, shared by "How big is a file?" and
     "Smallest to biggest", so a photo's bar is the same height in both. ---- */
  var SSF_BASE = 400, SSF_TOP = 62, SSF_H = SSF_BASE - SSF_TOP;
  var SSF_LOG_MIN = 3, SSF_LOG_MAX = Math.log(5e10) / Math.LN10;   /* KB to 50 GB */
  function ssfNorm(bytes) { return clamp((Math.log(bytes) / Math.LN10 - SSF_LOG_MIN) / (SSF_LOG_MAX - SSF_LOG_MIN), 0, 1); }
  function ssfSizeY(norm) { return SSF_BASE - SSF_H * norm; }

  var SSF_SIZE = [
    { id: "text", pic: "\u{1F4C4}", label: "Text", amount: "about 20 KB", bytes: 2e4 },
    { id: "image", pic: "\u{1F5BC}️", label: "Image", amount: "about 3 MB", bytes: 3e6 },
    { id: "audio", pic: "\u{1F3B5}", label: "Audio", amount: "about 5 MB", bytes: 5e6 },
    { id: "video", pic: "\u{1F3AC}", label: "Video", amount: "about 2 GB", bytes: 2e9 }
  ];
  var SSF_BAR_X = [150, 380, 610, 840], SSF_BAR_W = 96, SSF_GAME_X = 1050;

  /* one bar, growing from the baseline to a share `grow` of its full height.
     `labelO` is the amount text's OWN opacity, separate from the bar and icon
     (`o`): the sizes chapter uses it so "about 20 KB" / "about 3 MB" appear
     when the number itself is said (cTwenty, cThree), not a moment earlier
     when the bar and icon are only just named. Omitted, it falls back to `o`,
     which is every other caller (the song/film bars, the order row, the
     compare bars) - none of them names its own figure a beat late. */
  function ssfBar(x, w, bytes, grow, o, col, item, labelO) {
    if (!(o > 0)) return "";
    var full = ssfSizeY(ssfNorm(bytes)), top = lerp(SSF_BASE, full, clamp(grow, 0, 1));
    var out = R(x, top, w, SSF_BASE - top, 8, col, null, null, { opacity: o });
    if (item) {
      out += Em(x + w / 2, top - 34, 40, item.pic, { opacity: o });
      var lo = labelO == null ? o : labelO;
      if (lo > 0) out += Tx(x + w / 2, top - 8, item.amount, "lab small", "middle", { opacity: lo });
    }
    return out;
  }

  /* ==== chapter: how big is a file? ============================================
     The unit ladder first - a kilobyte, a megabyte, a gigabyte, each a
     thousand times the last - then the lesson's own five files rising out of
     it in the order the lecture names them. */
  function ssfSizesChapter(scene, beat, t, i) {
    var cBytes = sc(scene, 0, "bytes"), cKb = sc(scene, 0, "kb"), cThousand = sc(scene, 0, "thousand");
    var cMb = sc(scene, 1, "mb"), cGb = sc(scene, 1, "gb");
    var cStory = sc(scene, 2, "story"), cTwenty = sc(scene, 2, "twenty"), cTiny = sc(scene, 2, "tiny");
    var cPhoto = sc(scene, 3, "photo"), cThree = sc(scene, 3, "three"), cDots = sc(scene, 3, "dots");
    var cSong = sc(scene, 4, "song"), cFilm = sc(scene, 4, "film"), cTwo = sc(scene, 4, "two");
    var cGame = sc(scene, 5, "game"), cFew = sc(scene, 5, "few"), cFifty = sc(scene, 5, "fifty");
    var out = "";

    /* the axis and its three reference lines */
    var axisO = on(t, cBytes, 0.5);
    out += L(60, SSF_BASE, 1140, SSF_BASE, P.line, 3, { opacity: axisO });
    [["KB", 1e3, cKb], ["MB", 1e6, cMb], ["GB", 1e9, cGb]].forEach(function (g) {
      var go = on(t, g[2], 0.5), y = ssfSizeY(ssfNorm(g[1]));
      if (go <= 0) return;
      out += L(60, y, 1140, y, P.line, 1.5, { opacity: go * 0.5, "stroke-dasharray": "4 8" });
      out += Tx(70, y - 8, g[0], "lab small muted", "start", { opacity: go });
    });
    if (bump(t, cThousand, 1.6) > 0.02)
      out += MK.pill(210, ssfSizeY(ssfNorm(1e3)) - 26, "about a thousand bytes", bump(t, cThousand, 1.6),
        { size: 16, col: P.muted, ink: P.muted });

    /* the four files, one bar each, growing as its own beat names it. Text and
       image each get a second cue for their OWN number (cTwenty, cThree) -
       the amount label waits for it, so "about 20 KB" / "about 3 MB" appear
       exactly when "twenty kilobytes" / "three megabytes" is said rather than
       a moment earlier with the bar. Audio and video have no such second cue
       in this beat, so their labels behave as before, appearing with the bar. */
    var growAt = { text: cStory, image: cPhoto, audio: cSong, video: cFilm };
    var numAt = { text: cTwenty, image: cThree };
    SSF_SIZE.forEach(function (item, k) {
      var at = growAt[item.id], g = on(t, at, 0.9);
      var na = numAt[item.id], lo = na ? on(t, na, 0.4) : on(t, at, 0.35);
      out += ssfBar(SSF_BAR_X[k], SSF_BAR_W, item.bytes, g, on(t, at, 0.35), P.plum, item, lo);
    });
    if (bump(t, cTiny, 1.6) > 0.02) out += MK.pill(SSF_BAR_X[0] + SSF_BAR_W / 2, SSF_BASE + 18, "tiny", bump(t, cTiny, 1.6), { size: 18, col: P.plum, ink: P.plum });
    if (bump(t, cDots, 1.8) > 0.02) out += MK.pill(SSF_BAR_X[1] + SSF_BAR_W / 2, SSF_BASE + 18, "millions of dots", bump(t, cDots, 1.8), { size: 16, col: P.plum, ink: P.plum });
    if (bump(t, cTwo, 2.0) > 0.02) out += MK.pill(SSF_BAR_X[3] + SSF_BAR_W / 2, ssfSizeY(ssfNorm(2e9)) - 60, "two gigabytes", bump(t, cTwo, 2.0), { size: 16, col: P.plum, ink: P.plum });

    /* the game: not one size but a band, from a few MB to fifty GB */
    var lowY = ssfSizeY(ssfNorm(5e6)), highY = ssfSizeY(ssfNorm(5e10));
    var gGrow = on(t, cGame, 0.5);
    if (gGrow > 0) {
      var curLow = lerp(SSF_BASE, lowY, Math.min(1, on(t, cFew, 0.8)));
      var curHigh = lerp(curLow, highY, Math.min(1, on(t, cFifty, 0.9)));
      out += R(SSF_GAME_X, curHigh, SSF_BAR_W, curLow - curHigh, 8, "rgba(183,139,209,0.28)", P.plum, 2, { opacity: gGrow });
      out += Em(SSF_GAME_X + SSF_BAR_W / 2, curHigh - 34, 40, "\u{1F3AE}", { opacity: gGrow });
      out += Tx(SSF_GAME_X + SSF_BAR_W / 2, Math.min(curLow, SSF_BASE - 8), "a few MB", "lab small", "middle", { opacity: on(t, cFew, 0.6) });
      out += Tx(SSF_GAME_X + SSF_BAR_W / 2, curHigh - 8, "fifty GB", "lab small", "middle", { opacity: on(t, cFifty, 0.6) });
    }
    return svg(out);
  }

  /* ==== chapter: smallest to biggest ===========================================
     Beat 0: the same four bars, now side by side in order, smallest first.
     Beats 1-2: the misconception the lesson itself corrects - drawn as the
     child pictures it (a long story bigger than a photo), THEN CLEARED before
     the true comparison is drawn beside it, never crossed out on top of the
     right answer. Beat 3: the file format, not the page count, decides. */
  function ssfOrderRow(scene, t) {
    var cOrder = sc(scene, 0, "order"), cFour = sc(scene, 0, "four");
    var out = L(60, SSF_BASE, 1140, SSF_BASE, P.line, 3, { opacity: on(t, cOrder, 0.5) });
    var n = tally(t, cFour, SSF_SIZE.length, 2.2);
    SSF_SIZE.forEach(function (item, k) {
      var g = k < n ? 1 : 0;
      out += ssfBar(SSF_BAR_X[k], SSF_BAR_W, item.bytes, g, on(t, cFour, 0.4), P.gold, item);
    });
    out += MK.arrow(SSF_BAR_X[0], 46, SSF_BAR_X[3] + SSF_BAR_W, 46, on(t, cFour, 0.6), P.gold, 6);
    out += Tx((SSF_BAR_X[0] + SSF_BAR_X[3] + SSF_BAR_W) / 2, 26, "smallest first", "lab mid", "middle",
      { opacity: on(t, cFour, 0.6).toFixed(3) });
    return out;
  }

  var SSF_BOOK = { x: 260, y: 120 }, SSF_PH = { x: 620, y: 120 };
  function ssfBookIcon(cx, cy, size, o) {
    if (!(o > 0)) return "";
    return G(R(cx - size * 0.30, cy - size * 0.38, size * 0.60, size * 0.76, 6, "#C76B3B", "#A9552B", 2) +
      L(cx, cy - size * 0.30, cx, cy + size * 0.30, "#A9552B", 2), { opacity: o });
  }
  function ssfOrderCompare(scene, t) {
    var cThink = sc(scene, 1, "think"), cLonger = sc(scene, 1, "longer"), cPhoto1 = sc(scene, 1, "photo");
    var cNot = sc(scene, 2, "not"), cBook = sc(scene, 2, "book"), cSmaller = sc(scene, 2, "smaller");
    var cFormat = sc(scene, 3, "format"), cDecides = sc(scene, 3, "decides"), cPages = sc(scene, 3, "pages");
    var out = "", corrected = ssfPast(t, cNot);

    if (!corrected) {
      /* the wrong idea, drawn as the child pictures it: the story bigger,
         with a question over it - and NOTHING of the correct answer is on
         screen yet for it to sit on top of */
      var pB = popIn(t, cThink, 0.45), pP = popIn(t, cPhoto1, 0.45);
      if (pB > 0) out += G(ssfBookIcon(SSF_BOOK.x, SSF_BOOK.y, 220, 1) + Tx(SSF_BOOK.x, SSF_BOOK.y + 130, "a long story", "lab big", "middle"),
        { transform: around(SSF_BOOK.x, SSF_BOOK.y, Math.min(1.06, pB)), opacity: Math.min(1, pB) });
      if (pP > 0) out += G(Em(SSF_PH.x, SSF_PH.y, 120, "\u{1F5BC}️") + Tx(SSF_PH.x, SSF_PH.y + 90, "a photo", "lab big", "middle"),
        { transform: around(SSF_PH.x, SSF_PH.y, Math.min(1.06, pP) * 0.62), opacity: Math.min(1, pP) });
      out += MK.qmark(440, 60, 30, popIn(t, cLonger, 0.4));
      out += MK.pill(440, 300, "bigger?", on(t, cLonger, 0.5), { size: 22, col: P.bad, ink: P.bad });
    } else {
      /* the correct comparison, drawn fresh: two bars, the story tiny beside
         the photo, exactly the ladder the lesson already gave both of them.
         The axis and the photo bar (already familiar from "How big is a
         file?") settle in on "not"; the STORY bar - "a whole book of text" -
         rises on cBook, so the word gets the thing it names growing rather
         than landing on a frame the previous cue had already finished. */
      var g = on(t, cNot, 0.8), gBook = on(t, cBook, 0.8);
      out += L(60, SSF_BASE, 700, SSF_BASE, P.line, 3, { opacity: g });
      out += ssfBar(180, 120, SSF_SIZE[0].bytes, gBook, gBook, P.good, SSF_SIZE[0]);
      out += ssfBar(440, 120, SSF_SIZE[1].bytes, g, g, P.good, SSF_SIZE[1]);
      out += MK.pill(360, ssfSizeY(ssfNorm(SSF_SIZE[1].bytes)) - 70, "smaller than one photo", on(t, cSmaller, 0.5),
        { size: 20, col: P.good, ink: P.good });

      var fmt = on(t, cFormat, 0.5);
      if (fmt > 0) {
        out += G(R(860, 90, 240, 150, 20, P.cell, P.gold, 3) + Em(980, 150, 56, "\u{1F4C1}") +
          Tx(980, 214, "the file format", "lab mid", "middle"), { opacity: fmt });
        out += MK.arrow(860, 165, 700, ssfSizeY(ssfNorm(SSF_SIZE[1].bytes)) + 20, on(t, cDecides, 0.6), P.gold, 6);
      }
      var pg = popIn(t, cPages, 0.42);
      if (pg > 0) {
        out += G(R(940, 280, 190, 120, 18, P.cell, P.line, 2) +
          Array.from({ length: 3 }, function (_, r) { return L(970, 310 + r * 24, 1090, 310 + r * 24, P.muted, 4); }).join("") +
          Tx(1035, 380, "many pages?", "lab small muted", "middle"),
          { transform: around(1035, 340, Math.min(1.06, pg)), opacity: Math.min(1, pg) });
        out += MK.cross(1035, 340, 68, popIn(t, cPages == null ? null : cPages + 0.35, 0.4));
      }
    }
    return out;
  }
  function ssfOrderChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(ssfOrderRow(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(ssfOrderCompare(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------- */
  var SSF_RECAP = MK.recapKind([
    { beat: 0, at: "app", title: "Applications", sub: "do jobs for you", pic: "\u{1F3A8}" },
    { beat: 0, at: "systems", title: "Systems software", sub: "runs the machine", pic: "⚙️" },
    { beat: 1, at: "input", title: "Input devices", sub: "record data", pic: "⌨️" },
    { beat: 1, at: "output", title: "Output devices", sub: "communicate information", pic: "\u{1F5A5}️" },
    { beat: 2, at: "sizes", title: "File sizes", sub: "very different sizes", pic: "\u{1F3AC}" }
  ], { goBeat: 2, goAt: "sizes" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Applications do jobs; systems software runs the machine",
      "Input devices record data; output devices communicate it",
      "Text, image, audio, video, games: very different sizes"
    ] }),
    apps: ssfAppsChapter, systems: ssfSystemsChapter, inputs: ssfInputsChapter,
    outputs: ssfOutputsChapter, sizes: ssfSizesChapter, order: ssfOrderChapter,
    recap: SSF_RECAP
  };

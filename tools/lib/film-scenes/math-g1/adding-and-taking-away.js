  /* ==== Grade 1 Mathematics, Lesson 2: Adding and Taking Away =================
     tools/lib/film-scenes/math-g1/adding-and-taking-away.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/adding-and-taking-away.json.

     Mathematics has no lesson kit, so the drawings come from the shared maths
     picture library, ART (tools/lib/ehel-film-art-math.js): ten frames, number
     lines, bar models, arrays and shilling coins. Only two things are drawn
     here that the library cannot do - a row of counters whose members move or
     change colour ONE AT A TIME (ataDots), and the lesson's ladybird - and
     both are noted in the film's report.

     This file: the placing helpers, the dot row, the title motif, and the
     chapters "Adding" and "Taking away". Every top-level name here starts with
     ata, so nothing can replace a name of the engine, ART or MK.

     THE NUMBERS ARE THE LESSON'S OWN, and every picture is counted against the
     sentence it sits under: 3 and 2 make 5; count on from 3 to 5, the SAME sum
     by a second method; 7 take away 3 is 4, with THREE counters leaving the
     card and FOUR staying; count back 7, 6, 5, 4. */

  var HUE = {
    title: P.teal, adding: P.teal, takeaway: P.accent, more: P.plum,
    bonds: P.gold, doubles: P.good, coins: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ataOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ataFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* When the k-th of n things counted by tally(t, at, n, span) arrives. Kept
     here rather than written out at each call site because the two have to
     AGREE: a number popped at at + k * 0.28 beside a tally stepping every 0.38
     flickers off between the two, which is what the first cut of the doubles
     chapter did. */
  function ataStep(at, k, n, span) { return at == null ? null : at + (n < 2 ? 0 : k * (span / (n - 1))); }

  /* ---- placing one of the library's drawings ----------------------------------
     ART.place keeps a drawing's aspect ratio, so a box of the wrong shape
     letterboxes it and every coordinate worked out from the box is wrong. This
     reads the drawing's own viewBox and gives it a box of exactly its shape,
     centred on (cx, cy) at `scale`; the object it returns maps card
     coordinates to film coordinates, so a ring can be put on a named counter. */
  function ataFit(markup, cx, cy, scale) {
    var m = /viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(String(markup));
    if (!m) throw new Error("ataFit: that drawing has no viewBox: " + String(markup).slice(0, 48));
    var cw = parseFloat(m[1]), ch = parseFloat(m[2]);
    var w = cw * scale, h = ch * scale, x = cx - w / 2, y = cy - h / 2;
    return {
      svg: ART.place(markup, x, y, w, h), x: x, y: y, w: w, h: h, s: scale,
      X: function (v) { return x + v * scale; },
      Y: function (v) { return y + v * scale; }
    };
  }
  /* the same, faded */
  function ataAt(markup, cx, cy, scale, o) {
    if (!(o > 0)) return "";
    var f = ataFit(markup, cx, cy, scale);
    return o >= 1 ? f.svg : G(f.svg, { opacity: clamp(o, 0, 1) });
  }

  /* A number line placed so its AXIS stays at the same height whatever jumps
     it is carrying. ART.numberLine makes the card 70 px taller the moment its
     first arc appears, so a card centred on a point jolts upwards as the
     counting starts - and every ring worked out from the old height lands in
     the wrong place for one beat. ATA_LINE_PAD is the library's own pad. */
  var ATA_LINE_PAD = 36;
  function ataLine(o, cx, axisY, scale) {
    var ay = ((o.jumps && o.jumps.length) ? 96 : 26) + 20;
    var markup = ART.numberLine(o);
    var m = /viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(markup);
    var f = ataFit(markup, cx, axisY - ay * scale + (parseFloat(m[2]) * scale) / 2, scale);
    f.axis = axisY;
    /* where the value v sits on the line, in film coordinates */
    f.V = function (v) {
      return f.X(ATA_LINE_PAD + ((v - o.from) / (o.to - o.from)) * (o.width - 2 * ATA_LINE_PAD));
    };
    return f;
  }

  /* ---- a row of counters the film can move one at a time ----------------------
     ART.counters draws a row in one colour and cannot move or recolour a
     single counter, which four chapters here need. This is the same counter -
     ART's dot radius and the lessons' palette - on a card of the lessons' own
     white, so it sits beside the library's drawings without looking foreign.
     `each(i)` returns {fill, dx, dy, o, ring} for counter i, or nothing.
     `box` is the CARD's own opacity (1 by default, 0 for no card): a card
     drawn solid while its counters are still fading in is an empty white
     rectangle, which is what the first frame of Taking away showed. */
  function ataDots(n, x, y, pitch, r, each, box) {
    var out = "", i, s, fill, o, bo = box == null ? 1 : box;
    if (bo > 0) {
      var bw = (n - 1) * pitch + 2 * r + 56, bh = 2 * r + 56;
      out += R(x - r - 28, y - r - 28, bw, bh, 20, ART.C.card, ART.C.line, 2, { opacity: clamp(bo, 0, 1) });
    }
    for (i = 0; i < n; i++) {
      s = (each ? each(i) : null) || {};
      o = s.o == null ? 1 : s.o;
      if (!(o > 0)) continue;
      fill = s.fill || ART.C.accent;
      out += C(x + i * pitch + (s.dx || 0), y + (s.dy || 0), r, fill, null, null, { opacity: clamp(o, 0, 1) });
      if (s.ring > 0) out += C(x + i * pitch + (s.dx || 0), y + (s.dy || 0), r + 9, "none", P.gold, 5, { opacity: clamp(s.ring, 0, 1) });
    }
    return out;
  }
  /* the centre of counter i of such a row */
  function ataDotX(x, pitch, i) { return x + i * pitch; }

  /* a big number on the dark stage, popped in */
  function ataBig(cx, cy, text, p, col) {
    if (!(p > 0)) return "";
    return MK.pop(Tx(cx, cy + 22, String(text), "lab huge", "middle", { fill: col || P.gold }), cx, cy, p);
  }

  /* A RUNNING count - one, two, three - which is not the same thing. popIn
     restarts at zero every time the number changes, so a counter drawn with it
     blinks out for a frame on each step; the doubles chapter did exactly that,
     and a preview still caught it showing nothing at all. This stays on and
     gives the new number a nudge instead. */
  function ataCount(cx, cy, n, at, t, col) {
    if (!(n > 0)) return "";
    var s = 1 + 0.24 * bump(t, at, 0.5);
    return G(Tx(cx, cy + 22, String(n), "lab huge", "middle", { fill: col || P.gold }), { transform: around(cx, cy, s) });
  }

  /* ==== the title motif ============================================================
     A ten frame of five, three in the accent and two in the teal - the film's
     first sum, 3 and 2 make 5 - with a plus that pops as "come together" is
     said and a minus on "go away". The SECOND line names the three things the
     film does, and each has its own answer here: the plus swells on "add", the
     minus on "take away", and on "pairs of ten" the frame's five empty cells
     light one at a time, which is the five that would make it ten. On the two
     cards no scene is passed, every cue is null, and it simply stands. */
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "", k;
    var cAdd = sc0 ? sc(sc0, 0, "together") : null, cAway = sc0 ? sc(sc0, 0, "away") : null;
    var cAdd2 = sc0 ? sc(sc0, 1, "add") : null, cAway2 = sc0 ? sc(sc0, 1, "takeaway") : null,
      cTen2 = sc0 ? sc(sc0, 1, "ten") : null;
    var pAdd = sc0 ? popIn(t, cAdd, 0.4) : 1, pAway = sc0 ? popIn(t, cAway, 0.4) : 1;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 176, 150, P.teal, 0.8);
    var f = ataFit(ART.tenFrame(5, { split: 3, colour: "accent", second: "teal", label: false }), 180, 186, 1.05);
    out += f.svg;
    /* the five empty cells, on the bottom row of a frame of five */
    var lit = tally(t, cTen2, 5, 1.0) * (cTen2 == null ? 0 : 1);
    for (k = 0; k < 5; k++) {
      if (k >= lit) continue;
      out += C(f.X(46 + 44 * k), f.Y(90), 18 * f.s, "none", P.gold, 4,
        { opacity: popIn(t, ataStep(cTen2, k, 5, 1.0), 0.3) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    out += MK.pop(C(96, 74, 34, "#123247", P.good, 4) +
      L(78, 74, 114, 74, P.good, 7) + L(96, 56, 96, 92, P.good, 7), 96, 74, pAdd * (1 + 0.3 * bump(t, cAdd2, 0.8)));
    out += MK.pop(C(264, 74, 34, "#123247", P.accent, 4) +
      L(246, 74, 282, 74, P.accent, 7), 264, 74, pAway * (1 + 0.3 * bump(t, cAway2, 0.8)));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A ten frame holding three red counters and two green ones, with a plus sign and a minus sign">' + out + "</svg>";
  }

  /* ==== chapter: Adding ==============================================================
     Two groups of counters (3 and 2) push together into the lesson's own ten
     frame, which is then counted one to five; then the number line counts on
     from four to seven. The ten frame's split colours keep the three and the
     two visible inside the five, which is what "combining two sets" means. */
  var ATA_A = {
    groupY: 176, aX: 372, bX: 736, aTo: 470, bTo: 660,
    frameX: 584, frameY: 150, frameS: 1.45,
    lineX: 470, lineAxis: 240, lineW: 720, lineS: 1.2
  };

  function ataAddingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAdding = c(0, "adding"), cTog0 = c(0, "together");
    var cThree = c(1, "three"), cTwo = c(1, "two");
    var cPush = c(2, "push"), cCount = c(2, "count");
    var nums = [c(3, "one"), c(3, "two"), c(3, "three"), c(3, "four"), c(3, "five")], cMake = c(3, "make");
    var cStart = c(4, "start"), cOn = c(4, "counton"), cFour = c(4, "four"), cFive = c(4, "five");
    var out = "";

    /* beat 0: two groups drift together, and a plus lands between them */
    var b0 = ataOnly(t, scene, 0);
    if (b0 > 0) {
      var u = on(t, cTog0, 0.9), gx = lerp(420, 496, u), hx = lerp(748, 672, u);
      out += G(C(gx, 210, 84, "rgba(53,191,178,0.16)", P.teal, 4, { "stroke-dasharray": "12 9" }) +
        C(hx, 210, 84, "rgba(233,116,79,0.16)", P.accent, 4, { "stroke-dasharray": "12 9" }) +
        MK.pop(L(566, 210, 602, 210, P.gold, 8) + L(584, 192, 584, 228, P.gold, 8), 584, 210, popIn(t, cAdding, 0.45)),
        { opacity: b0 });
    }

    /* beats 1-2: the two groups, then the push that makes them one */
    var b12 = Math.max(ataOnly(t, scene, 1), ataOnly(t, scene, 2));
    if (b12 > 0) {
      var push = on(t, cPush, 0.9), fade = 1 - push;
      var ax = lerp(ATA_A.aX, ATA_A.aTo, push), bx = lerp(ATA_A.bX, ATA_A.bTo, push);
      out += G(ataAt(ART.counters(3, { cols: 3, colour: "accent", label: false }), ax, ATA_A.groupY, 1.5, popIn(t, cThree, 0.4)) +
        ataAt(ART.counters(2, { cols: 2, colour: "teal", label: false }), bx, ATA_A.groupY, 1.5, popIn(t, cTwo, 0.4)) +
        MK.pop(L(lerp(552, 566, push), ATA_A.groupY, lerp(588, 602, push), ATA_A.groupY, P.gold, 7) +
          L(lerp(570, 584, push), ATA_A.groupY - 18, lerp(570, 584, push), ATA_A.groupY + 18, P.gold, 7),
          570, ATA_A.groupY, popIn(t, cTwo == null ? null : cTwo + 0.25, 0.4)),
        { opacity: b12 * fade });
    }

    /* beats 2-3: the ten frame of five, counted one at a time */
    var frameO = on(t, cPush == null ? null : cPush + 0.35, 0.6) * (1 - into(t, scene.first + 4));
    if (frameO > 0) {
      var f = ataFit(ART.tenFrame(5, { split: 3, colour: "accent", second: "teal", label: false }),
        ATA_A.frameX, ATA_A.frameY, ATA_A.frameS);
      var inner = f.svg, k, said = 0;
      /* a ten frame's counters: cell 40, gap 4, pad 6, edge 20 -> 46 + 44k across the top row */
      for (k = 0; k < 5; k++) {
        var ringO = popIn(t, nums[k], 0.35) * (1 - on(t, cMake, 0.5));
        if (ringO > 0) inner += C(f.X(46 + 44 * k), f.Y(46), 17 * f.s, "none", P.gold, 5, { opacity: Math.min(1, ringO) });
        if (nums[k] != null && t >= nums[k]) said = k + 1;
      }
      /* the running count, beside the frame, then the sum */
      if (said > 0 && (cMake == null || t < cMake)) inner += ataCount(940, ATA_A.frameY, said, nums[said - 1], t, P.gold);
      inner += MK.pill(940, ATA_A.frameY, "3 + 2 = 5", on(t, cMake, 0.4), { size: 38, col: P.gold });
      /* "count every counter": a pool of light under the frame while it is counted */
      /* the pool sits a little below the frame and is 160 wide: at 210 it ran 60 px off the top of the box, which --sweep found and no still did */
      inner += MK.glow(ATA_A.frameX, ATA_A.frameY + 26, 160, P.teal, on(t, cCount, 0.6) * 0.8 * (1 - on(t, cMake, 0.6)));
      out += G(inner, { opacity: clamp(frameO, 0, 1) });
    }

    /* beat 4: the SAME sum again, three and two, counted on rather than
       counted all - start at three, then four, then five. Landing on five
       is what makes this a second way to the answer the child just heard,
       not a new sum. */
    var b4 = ataFrom(t, scene, 4);
    if (b4 > 0) {
      var jumps = [], marks = [{ at: 3, colour: "accent", label: "3" }];
      if (cFour != null && t >= cFour) jumps.push({ from: 3, to: 4 });
      if (cFive != null && t >= cFive) { jumps.push({ from: 4, to: 5 }); marks.push({ at: 5, colour: "teal", label: "5" }); }
      var nl = ataLine({ from: 0, to: 10, labelEvery: 1, width: ATA_A.lineW, marks: marks, jumps: jumps, label: false },
        ATA_A.lineX, ATA_A.lineAxis, ATA_A.lineS);
      var nlOut = nl.svg;
      nlOut += C(nl.V(3), ATA_A.lineAxis, 30, "none", P.gold, 5,
        { opacity: on(t, cStart, 0.45) * (1 - on(t, cFive, 0.5)) });
      nlOut += MK.pill(1030, 196, "3 + 2 = 5", popIn(t, cFive == null ? null : cFive + 0.2, 0.4), { size: 34, col: P.gold });
      nlOut += MK.pill(1030, 286, "count on", on(t, cOn, 0.4) * (1 - on(t, cFive, 0.5)), { size: 28, col: P.teal });
      out += G(nlOut, { opacity: clamp(b4, 0, 1) });
    }
    return svg(out);
  }

  /* ==== chapter: Taking away =========================================================
     Seven counters on a card. On "take three of them away" the three on the
     right slide OUT of the card and fade, each crossed as it goes, so what
     leaves is three and what stays is four; the four that stay are then
     counted one at a time. The number line counts back 7, 6, 5, 4 to the same
     answer, which is the lesson's own second method for the same subtraction. */
  var ATA_T = { x: 300, y: 140, pitch: 82, r: 28, n: 7, keep: 4 };

  function ataTakeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cStarts = c(0, "starts"), cGoes = c(0, "goes");
    var cSeven = c(1, "seven"), cThree = c(1, "three");
    var cGone = c(2, "gone"), cCount = c(2, "count");
    var cFour = c(3, "four"), cSum = c(3, "sum");
    var cBack = c(4, "back"), cStart = c(4, "start");
    var backs = [c(4, "six"), c(4, "five"), c(4, "four")];
    var out = "", k;

    var appear = Math.max(on(t, cStarts, 0.5), on(t, cSeven, 0.4));
    var leave = on(t, cThree, 1.6);
    var stay = tally(t, cCount, 4, 1.5) * (cCount == null ? 0 : 1);
    /* how far the three that go have travelled, and how fast they fade: gone
       by the time the sentence has finished naming them, and never past the box */
    function goneDx(q) { return 240 + (q - 4) * 28; }
    function goneDy(q) { return 110 + (q - 4) * 14; }
    var faded = 1 - clamp(leave * 1.4, 0, 1);

    var ringsGo = 1 - into(t, scene.first + 4);   /* they belong to the counting beat */
    out += ataDots(ATA_T.n, ATA_T.x, ATA_T.y, ATA_T.pitch, ATA_T.r, function (q) {
      if (q < ATA_T.keep) {
        return { fill: ART.C.accent, o: appear,
          ring: q < stay ? popIn(t, ataStep(cCount, q, 4, 1.5), 0.3) * ringsGo : 0 };
      }
      return { fill: ART.C.accent, o: appear * faded, dx: leave * goneDx(q), dy: leave * goneDy(q) };
    }, appear);

    /* "some of it goes": a quiet arrow off the card, before any number is said */
    var g0 = on(t, cGoes, 0.6) * ataOnly(t, scene, 0);
    if (g0 > 0) out += G(MK.arrow(870, ATA_T.y, 1010, ATA_T.y, g0, P.muted, 6), { opacity: g0 });

    /* each of the three is crossed as it leaves */
    if (leave > 0 && leave < 1) {
      var cp = Math.min(1, leave * 6) * Math.min(1, faded * 2);   /* solid early, gone with the counter */
      for (k = ATA_T.keep; k < ATA_T.n; k++) {
        out += MK.cross(ataDotX(ATA_T.x, ATA_T.pitch, k) + leave * goneDx(k), ATA_T.y + leave * goneDy(k), 22, cp, P.bad);
      }
    }
    /* "Those three have gone" */
    out += MK.pill(960, 92, "3 gone", on(t, cGone, 0.4) * (1 - on(t, cSum, 0.5)), { size: 32, col: P.bad, ink: P.bad });
    /* the running count of the four that stay, then "four are left", then the sum */
    if (stay > 0 && (cFour == null || t < cFour)) out += ataCount(970, 168, stay, ataStep(cCount, stay - 1, 4, 1.5), t, P.gold);
    out += MK.pill(970, 168, "4 left", popIn(t, cFour, 0.4) * (1 - on(t, cSum, 0.5)), { size: 32, col: P.gold });
    out += MK.pill(970, 168, "7 − 3 = 4", on(t, cSum, 0.45), { size: 36, col: P.gold });

    /* beat 4: the same answer again, by counting back */
    var b4 = ataFrom(t, scene, 4);
    if (b4 > 0) {
      var jumps = [], marks = [{ at: 7, colour: "accent", label: "7" }], landed = 7;
      var steps = [[7, 6], [6, 5], [5, 4]];
      for (var q = 0; q < 3; q++) if (backs[q] != null && t >= backs[q]) { jumps.push({ from: steps[q][0], to: steps[q][1] }); landed = steps[q][1]; }
      if (landed === 4) marks.push({ at: 4, colour: "teal", label: "4" });
      var nl = ataLine({ from: 0, to: 10, labelEvery: 1, width: 720, marks: marks, jumps: jumps, label: false }, 470, 348, 1.2);
      var nlOut = nl.svg;
      nlOut += C(nl.V(7), 348, 30, "none", P.gold, 5, { opacity: on(t, cStart, 0.45) * (1 - on(t, backs[2], 0.5)) });
      nlOut += MK.pill(1030, 330, "count back", on(t, cBack, 0.4), { size: 28, col: P.accent });
      out += G(nlOut, { opacity: clamp(b4, 0, 1) });
    }
    return svg(out);
  }


  /* ==== Counting to Twenty, part 3 ===========================================
     The chapters "Twos, tens and pairs" (the lesson's Counting in tens,
     Counting in twos, Odd and even, Every other number) and "Bigger, smaller,
     first" (More or fewer, Compare to 20, Put them in order, First second
     third), then "What you now know" and the KINDS table the engine's tail
     needs. Continues counting-to-twenty.js and counting-to-twenty-2.js. */

  /* ==== chapter: twos, tens and pairs ========================================== */
  var CTW_SOCK_X = [260, 584, 908];

  function ctwTwosBeat(scene, k, t) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var out = "";

    if (k === 0) {
      /* whole frames of ten: ten, twenty */
      var cTens = c(0, "tens"), cTen = c(0, "ten"), cTwenty = c(0, "twenty");
      var n = ctwStep(t, [cTen, cTwenty]) * 10;
      var b = ctwAt(ctwTF(n, 2, n > 0), 560, 186, 900, 300);
      out += b.draw();
      out += ctwRing(b, ctwFrameRect(0), on(t, cTens, 0.5), P.line, 9);
      out += ctwRing(b, ctwFrameRect(1), on(t, cTens, 0.5), P.line, 9);
      out += ctwRing(b, ctwFrameRect(0), on(t, cTen, 0.5), P.good, 9);
      out += ctwRing(b, ctwFrameRect(1), on(t, cTwenty, 0.5), P.good, 9);
      out += MK.pill(b.X(ctwFrameRect(0)[0] + CTW_TF.fw / 2), 392, "one ten", popIn(t, cTen, 0.4), { size: 32, col: P.good });
      out += MK.pill(b.X(ctwFrameRect(1)[0] + CTW_TF.fw / 2), 392, "two tens", popIn(t, cTwenty, 0.4), { size: 32, col: P.good });
      return out;
    }

    if (k === 1) {
      /* socks come in pairs: two, four, six */
      var cS = c(1, "socks"), cTwo = c(1, "two"), cFour = c(1, "four"), cSix = c(1, "six");
      var at = [cTwo, cFour, cSix];
      CTW_SOCK_X.forEach(function (x, j) {
        var p = popIn(t, cS == null ? null : cS - 0.25 + j * 0.16, 0.4);
        if (p > 0) {
          out += MK.pop(Em(x - 60, 196, 106, "\u{1F9E6}") + Em(x + 60, 196, 106, "\u{1F9E6}"), x, 196, p);
          out += R(x - 118, 120, 236, 156, 24, "none", P.line, 3, { opacity: Math.min(1, p) * 0.9 });
        }
        out += ctwNum(x, 340, String((j + 1) * 2), 56, popIn(t, at[j], 0.4), P.gold);
      });
      return out;
    }

    if (k === 2) {
      /* pair them up: three pairs, nobody left over */
      var cP = c(2, "pair"), cTh = c(2, "three"), cNo = c(2, "nobody");
      var b2 = ctwAt(ART.counters(6, { pairs: true, label: " " }), 452, 196, 560, 300);
      out += b2.draw();
      for (var rp = 0; rp < 3; rp++) {
        out += MK.ripple(b2.X(44 + rp * 58), b2.Y(66), t, cP == null ? null : cP + rp * 0.18, P.gold);
      }
      var got = tally(t, cTh, 3, 0.9);
      for (var j2 = 0; j2 < got; j2++) out += ctwNum(b2.X(44 + j2 * 58), b2.Y(-4), String(j2 + 1), 38, 1, P.gold);
      out += MK.pill(920, 172, "3 pairs", popIn(t, cTh, 0.4), { size: 36, col: P.gold });
      out += MK.tick(920, 300, 34, popIn(t, cNo, 0.4));
      return out;
    }

    if (k === 3) {
      /* six is even, seven is odd */
      var cE = c(3, "even"), cA = c(3, "alone"), cO = c(3, "odd");
      var left = ctwAt(ART.counters(6, { pairs: true, label: "6" }), 306, 190, 440, 270);
      var right = ctwAt(ART.counters(7, { pairs: true, markOdd: true, label: "7" }), 862, 190, 480, 270);
      var ro = popIn(t, cA == null ? null : cA - 0.35, 0.45);
      out += left.draw();
      if (ro > 0) out += MK.pop(right.draw(), 862, 190, ro);
      out += MK.pill(306, 384, "even", popIn(t, cE == null ? null : cE + 0.35, 0.4), { size: 36, col: P.good });
      out += C(right.X(218), right.Y(45), 30 * right.s, "none", P.bad, 4, { opacity: on(t, cA, 0.5) });
      out += MK.pill(862, 384, "odd", popIn(t, cO, 0.4), { size: 36, col: P.accent });
      return out;
    }

    /* k === 4: even, odd, even, odd, all the way to twenty */
    var cAl = c(4, "altern"), cT = c(4, "turns"), cTw = c(4, "twenty");
    var line = ctwAt(ART.numberLine({ from: 0, to: 20, step: 1, labelEvery: 2, width: 1060 }), 584, 268, 1120, 130);
    out += line.draw();
    var LX = function (v) { return line.X(36 + (v / 20) * 988); };
    var dots = tally(t, cAl, 21, 3.4);
    for (var v = 0; v < dots; v++) {
      out += C(LX(v), line.y - 30, 11, v % 2 === 0 ? P.teal : P.plum);
    }
    out += MK.pill(160, 74, "even", on(t, cAl, 0.5), { size: 28, col: P.teal });
    out += MK.pill(300, 74, "odd", on(t, cAl, 0.5), { size: 28, col: P.plum });
    /* every other number: a hop from each even number to the next */
    var hops = tally(t, cT, 10, 1.9);
    for (var hp = 0; hp < hops; hp++) {
      var ax = LX(hp * 2), bx = LX(hp * 2 + 2), hy = line.y - 44;
      out += Pth("M" + n2(ax) + "," + n2(hy) + " Q" + n2((ax + bx) / 2) + "," + n2(hy - 34) + " " + n2(bx) + "," + n2(hy),
        null, P.gold, 3.5, { opacity: 0.9 });
    }
    out += C(LX(20), line.Y(46), 22, "none", P.gold, 4, { opacity: on(t, cTw, 0.5) });
    out += MK.pill(1010, 74, "20", popIn(t, cTw, 0.4), { size: 32, col: P.gold });
    return out;
  }

  function ctwTwosChapter(scene, beat, t, i) { return ctwChapter(scene, t, i, ctwTwosBeat); }

  /* ==== chapter: bigger, smaller, first ======================================== */
  var CTW_RUNNER_X = [880, 748, 616, 484, 352];
  function ctwRace(t, at) {
    var out = "";
    CTW_RUNNER_X.forEach(function (x, j) {
      var p = at == null ? 1 : popIn(t, at + j * 0.05, 0.32);
      if (p > 0) out += MK.pop(Em(x, 236, 92, "\u{1F3C3}"), x, 236, p);
    });
    out += Em(1024, 232, 88, "\u{1F6A9}");
    return out;
  }

  function ctwOrderBeat(scene, k, t) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var out = "";

    if (k === 0) {
      /* which is bigger: nine or fifteen? */
      var cW = c(0, "which"), cN = c(0, "nine"), cL = c(0, "line");
      out += MK.qmark(584, 62, 36, on(t, cW, 0.45));
      var cards = ctwAt(ART.sequence({ terms: [9, 15], label: false }), 584, 166, 420, 160);
      var co = popIn(t, cN, 0.45);
      if (co > 0) out += MK.pop(cards.draw(), 584, 166, co);
      var lo = popIn(t, cL, 0.45);
      if (lo > 0) {
        var l0 = ctwAt(ART.numberLine({ from: 0, to: 20, step: 1, labelEvery: 5, width: 1000 }), 584, 336, 1060, 130);
        out += MK.pop(l0.draw(), 584, 336, lo);
      }
      return out;
    }

    if (k === 1) {
      /* fifteen sits further to the right */
      var cR = c(1, "right"), cB = c(1, "bigger");
      var l1 = ctwAt(ART.numberLine({ from: 0, to: 20, step: 1, labelEvery: 5,
        marks: [{ at: 9, label: "9", colour: "plum" }, { at: 15, label: "15", colour: "accent" }], width: 1000 }),
        584, 240, 1060, 160);
      out += l1.draw();
      var LX1 = function (v) { return l1.X(36 + (v / 20) * 928); };
      out += MK.arrow(LX1(9), l1.y - 24, LX1(15), l1.y - 24, on(t, cR, 0.6), P.gold, 8);
      out += MK.pill(584, 386, "15 is bigger", popIn(t, cB, 0.4), { size: 36, col: P.good });
      out += MK.tick(852, 386, 28, popIn(t, cB == null ? null : cB + 0.4, 0.4));
      return out;
    }

    if (k === 2) {
      /* smallest first */
      var cOr = c(2, "order"), cSm = c(2, "small");
      var terms = ["?", "?", "?"], want = [c(2, "four"), c(2, "nine"), c(2, "fifteen")], vals = [4, 9, 15];
      for (var j = 0; j < 3; j++) if (want[j] != null && t >= want[j]) terms[j] = vals[j];
      var seq = ctwAt(ART.sequence({ terms: terms, label: false }), 584, 190, 760, 230);
      var so = popIn(t, cOr, 0.45);
      if (so > 0) out += MK.pop(seq.draw(), 584, 190, so);
      out += MK.pill(238, 358, "smallest", popIn(t, cSm, 0.4), { size: 30, col: P.gold });
      out += MK.arrow(332, 358, 862, 358, on(t, cSm, 0.7), P.gold, 8);
      for (var q = 0; q < 3; q++) out += MK.ripple(seq.X(56 + q * 86), seq.Y(56), t, want[q], P.gold);
      return out;
    }

    if (k === 3) {
      /* first, second and third are places in a line */
      var cF = c(3, "first"), cP = c(3, "place");
      out += ctwRace(t, cF);
      var names = ["1st", "2nd", "3rd"];
      for (var r = 0; r < 3; r++) {
        out += MK.pill(CTW_RUNNER_X[r], 130, names[r], popIn(t, cF == null ? null : cF + r * 0.4, 0.4), { size: 34, col: P.gold });
      }
      var po = on(t, cP, 0.7);
      out += L(322, 320, lerp(322, 1000, po), 320, P.gold, 4, { "stroke-dasharray": "12 9", opacity: po });
      return out;
    }

    /* k === 4: count from the front, nearest the flag */
    var cFr = c(4, "front"), cFl = c(4, "flag"), cIs = c(4, "isfirst");
    out += ctwRace(t, null);
    out += MK.glow(1024, 232, 92, P.gold, on(t, cFl, 0.5) * (0.6 + 0.4 * breathe(t)));
    out += ctwFinger(884, 300, on(t, cFr, 0.4));
    out += C(880, 232, 66, "none", P.good, 4, { opacity: on(t, cFl == null ? null : cFl + 0.3, 0.5) });
    out += MK.pill(880, 122, "1st", popIn(t, cIs, 0.4), { size: 38, col: P.good });
    out += MK.tick(1024, 122, 28, popIn(t, cIs == null ? null : cIs + 0.4, 0.4));
    return out;
  }

  function ctwOrderChapter(scene, beat, t, i) { return ctwChapter(scene, t, i, ctwOrderBeat); }

  /* ==== what you now know ====================================================== */
  function ctwCard(markup) {
    return function (cx, cy, size) { return ctwAt(markup, cx, cy, size * 3.8, size * 1.45).draw(); };
  }
  var CTW_RECAP = MK.recapKind([
    { beat: 0, at: "count", title: "Count to 20", sub: "one number for each thing",
      pic: ctwCard(ctwTF(20, 2, false)) },
    { beat: 0, at: "zero", title: "Zero", sub: "none at all", pic: "0️⃣" },
    { beat: 1, at: "teen", title: "Ten and some more", sub: "10 and 3 make 13",
      pic: ctwCard(ART.tenFrame(13, { frames: 2, split: 10, label: false })) },
    { beat: 1, at: "twos", title: "Twos and tens", sub: "2, 4, 6 and 10, 20",
      pic: ctwCard(ART.numberLine({ from: 0, to: 20, step: 2, labelEvery: 2, width: 520 })) },
    { beat: 2, at: "pairs", title: "Odd and even", sub: "pair them up",
      pic: ctwCard(ART.counters(6, { pairs: true, label: false })) },
    { beat: 3, at: "first", title: "First, second, third", sub: "a place in a line", pic: "\u{1F947}" }
  ], { goBeat: 3, goAt: "first" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Counting to twenty, one at a time", "Ten and some more", "Odd, even, and who is first"] }),
    count: ctwCountChapter, look: ctwLookChapter, teen: ctwTeenChapter,
    twos: ctwTwosChapter, order: ctwOrderChapter, recap: CTW_RECAP
  };

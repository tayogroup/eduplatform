  /* ==== chapters: two ways to grow up, and how long does it take? ==============
     tools/lib/film-scenes/science-g3/growing-up-3.js. The two kinds of model
     and the recap are in growing-up-4.js. */

  /* ---- two ways to grow up ----------------------------------------------------
     The lesson's own "Changes shape, or just grows?" sort: its two bins, with
     its own labels and bin pictures, and its eight baby animals in the order it
     lists them. Each animal flies into its bin as the voice names it, so the
     child has seen the sort done before they do it. */
  var GU_BINY = 150, GU_BINH = 264, GU_BINW = 494, GU_BINX = [74, 600];
  var GU_BINL = ["Looks like a small adult", "Changes shape completely"];
  var GU_BINP = ["\u{1F415}", "\u{1F98B}"];
  var GU_ROWY = 62, GU_ROWS = 74;

  /* the eight items of the lesson's step, in its order; slot is the place in
     the bin, which is the order the voice names them */
  var GU_SORT = [
    { label: "puppy", bin: 0, slot: 0, beat: 1, at: "puppy" },
    { label: "tadpole", bin: 1, slot: 0, beat: 2, at: "tad" },
    { label: "caterpillar", bin: 1, slot: 1, beat: 2, at: "cat" },
    { label: "chick", bin: 0, slot: 1, beat: 1, at: "chick" },
    { label: "baby", bin: 0, slot: 4, beat: 1, at: "baby" },
    { label: "foal", bin: 0, slot: 2, beat: 1, at: "foal" },
    { label: "ladybird larva", bin: 1, slot: 2, beat: 2, at: "larva" },
    { label: "kitten", bin: 0, slot: 3, beat: 1, at: "kitten" }
  ];
  function guSortPic(k) {
    return ["\u{1F436}", ART.ICONS.tadpole, "\u{1F41B}", "\u{1F423}", "\u{1F476}\u{1F3FE}",
      "\u{1F40E}", ART.ICONS.larva, "\u{1F431}"][k];
  }
  /* where item k waits, and where it lands */
  function guRowAt(k) { return [108 + k * 136, GU_ROWY, GU_ROWS]; }
  function guBinAt(it) {
    return it.bin === 0 ? [130 + it.slot * 92, 318, 66] : [700 + it.slot * 146, 318, 76];
  }

  function guSortChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTwo = c(0, "two"), cSort = c(0, "sort"), cKeep = c(1, "keep"), cChange = c(2, "change"),
      cSize = c(3, "size"), cLook = c(3, "look");
    var b1 = guOnly(t, scene, 1), b2 = guOnly(t, scene, 2), b3 = guOnly(t, scene, 3);
    var out = "";

    /* the two bins, the one being filled lit */
    for (var n = 0; n < 2; n++) {
      var p = popIn(t, cTwo == null ? null : cTwo + n * 0.18, 0.45);
      if (p <= 0) continue;
      var lit = (n === 0 ? b1 : b2) > 0.5;
      out += G(guPanel(GU_BINX[n], GU_BINY, GU_BINW, GU_BINH, lit, 1),
        { transform: around(GU_BINX[n] + GU_BINW / 2, GU_BINY + GU_BINH / 2, Math.min(p, 1.06)) });
      out += G(MK.pic(GU_BINX[n] + 50, 196, 48, GU_BINP[n]) +
        Tx(GU_BINX[n] + 88, 206, GU_BINL[n], "lab big", "start"), { opacity: Math.min(1, p) });
      /* beat 3: both bins ringed, because the shape decides which one */
      out += R(GU_BINX[n] - 6, GU_BINY - 6, GU_BINW + 12, GU_BINH + 12, 26, "none", P.gold, 3,
        { opacity: on(t, cLook, 0.5) * b3 * (0.6 + 0.4 * breathe(t + n * 0.5)), "stroke-dasharray": "14 10" });
    }

    /* the eight babies: waiting in a row, then flown into their bin */
    for (var k = 0; k < GU_SORT.length; k++) {
      var it = GU_SORT[k], app = popIn(t, cSort == null ? null : cSort + k * 0.08, 0.4);
      if (app <= 0) continue;
      var a = guRowAt(k), b = guBinAt(it), u = ease(on(t, c(it.beat, it.at), 0.5));
      var x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), s = lerp(a[2], b[2], u);
      /* guPic, not MK.pic: the tadpole and the ladybird larva are near-black
         and were dark smudges on the dark stage until they got their plate */
      out += G(guPic(x, y, s, guSortPic(k)), { transform: around(x, y, Math.min(app, 1.1)), opacity: Math.min(1, app) });
      if (u > 0.55) out += Tx(b[0], b[1] + 58, it.label, "lab mid", "middle", { opacity: (u - 0.55) / 0.45 });
    }

    /* "Keep your shape", "change shape completely": the bin being filled says so */
    /* inside the bin, under its label: at y 128 these sat three pixels under
       the babies still waiting in the row above and read as crowding them */
    out += MK.pill(GU_BINX[0] + GU_BINW / 2, 252, "keeps its shape", on(t, cKeep, 0.4) * b1, { size: 24, col: P.good });
    out += MK.pill(GU_BINX[1] + GU_BINW / 2, 252, "a new shape", on(t, cChange, 0.4) * b2, { size: 24, col: P.accent });

    /* beat 3: not by size - by the change of shape */
    if (b3 > 0) {
      /* the cross sits BESIDE the ruler, not over it: at r 40 on the same
         centre its two bars and its disc hid the ruler, and the sheet showed a
         red no-sign with nothing recognisable inside it */
      var ps = popIn(t, cSize, 0.4) * b3;
      out += MK.pop(MK.pic(378, 64, 84, "\u{1F4CF}"), 378, 64, ps) + MK.cross(436, 36, 22, ps);
      out += MK.pill(772, 62, "the change of shape", on(t, cLook, 0.4) * b3, { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ---- how long does it take? --------------------------------------------------
     The lesson's own record step: its three rows, its two columns and its three
     answers, filled in one row at a time as the voice reads them. The animal in
     each row is drawn at its own size, so the pattern the lesson's second
     reading question asks for - the bigger the animal, the longer it takes - is
     there to see beside the arrow. */
  /* The column split moved left from 640 to 610 on 2026-09-23: "a few months"
     at lab big is about 196 px wide, and from the old answer column it reached
     the table's own right edge. The Animal column still holds its widest row
     ("butterfly", ending about x 535) with room to spare. */
  var GU_TX0 = 230, GU_TX1 = 930, GU_TSP = 610, GU_TY = [56, 106, 204, 302, 400];
  var GU_TROW = [
    { label: "butterfly", size: 64, ans: "a few weeks", beat: 1, at: "weeks" },
    { label: "frog", size: 78, ans: "a few months", beat: 2, at: "months" },
    { label: "human", size: 92, ans: "many years", beat: 3, at: "years" }
  ];
  function guTrowPic(r) { return ["\u{1F98B}", "\u{1F438}", "\u{1F9D1}\u{1F3FE}"][r]; }
  function guTansPic(r) { return ["\u{1F4C5}", "\u{1F5D3}️", "\u{1F382}"][r]; }

  function guTableChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTimes = c(0, "times"), cTable = c(0, "table"), cBig = c(3, "bigger"), cLonger = c(3, "longer");
    var grid = on(t, cTable, 0.9), head = on(t, cTable == null ? null : cTable + 0.3, 0.5);
    var out = "";

    /* the row being read, lit under everything else */
    for (var r = 0; r < 3; r++) {
      var lit = guOnly(t, scene, r + 1) * on(t, sc(scene, GU_TROW[r].beat, GU_TROW[r].at), 0.4);
      if (lit > 0) out += R(GU_TX0, GU_TY[r + 1], GU_TX1 - GU_TX0, GU_TY[r + 2] - GU_TY[r + 1], 0, "#1B3A52", null, null, { opacity: lit });
    }

    /* the table, drawing itself from the left as "A table" is said */
    if (grid > 0) {
      var ex = lerp(GU_TX0, GU_TX1, grid);
      out += R(GU_TX0, GU_TY[0], ex - GU_TX0, GU_TY[4] - GU_TY[0], 14, "none", P.line, 2.5);
      for (var g = 1; g < 4; g++) out += L(GU_TX0, GU_TY[g], ex, GU_TY[g], P.line, 2);
      if (ex > GU_TSP) out += L(GU_TSP, GU_TY[0], GU_TSP, lerp(GU_TY[0], GU_TY[4], on(t, cTable == null ? null : cTable + 0.35, 0.5)), P.line, 2);
      out += Tx(GU_TX0 + 24, GU_TY[0] + 34, "Animal", "lab big muted", "start", { opacity: head });
      out += Tx(GU_TSP + 24, GU_TY[0] + 34, "Time to grow up", "lab big muted", "start", { opacity: head });
    }

    /* the three animals, each at its own size, and its name */
    for (var k = 0; k < 3; k++) {
      var row = GU_TROW[k], cy = (GU_TY[k + 1] + GU_TY[k + 2]) / 2;
      var p = popIn(t, cTimes == null ? null : cTimes + k * 0.2, 0.45);
      if (p <= 0) continue;
      /* on "The bigger the animal" each row's animal swells in turn, down the
         column where they are already drawn at three sizes */
      out += G(MK.pic(316, cy, row.size, guTrowPic(k)),
        { transform: around(316, cy, Math.min(p, 1.1) + 0.14 * bump(t, cBig == null ? null : cBig + k * 0.2, 0.55)), opacity: Math.min(1, p) });
      out += Tx(400, cy + 10, row.label, "lab big", "start", { opacity: Math.min(1, p) });
      /* the answer, written in as the voice says it */
      var pa = popIn(t, sc(scene, row.beat, row.at), 0.45);
      if (pa <= 0) continue;
      out += G(MK.pic(658, cy, 54, guTansPic(k)), { transform: around(658, cy, Math.min(pa, 1.1)), opacity: Math.min(1, pa) });
      out += Tx(694, cy + 10, row.ans, "lab big gold", "start", { opacity: Math.min(1, pa) });
    }

    /* "the longer it takes": down the table, weeks to years */
    /* The arrow grows on "The bigger the animal" and is named on "the longer it
       takes", so a two-second draw is not cued into the last second of the film's
       last teaching line. */
    var lo = on(t, cBig, 1.0);
    if (lo > 0) {
      out += MK.arrow(980, 140, 980, lerp(140, 380, lo), 1, P.gold, 7);
      out += MK.pill(1072, 262, "longer", on(t, cLonger, 0.4), { size: 26, col: P.gold });
    }
    return svg(out);
  }

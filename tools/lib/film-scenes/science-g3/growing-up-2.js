  /* ==== chapters: from egg to butterfly, and babies and chicks ===================
     tools/lib/film-scenes/science-g3/growing-up-2.js. */

  /* ---- from egg to butterfly ------------------------------------------------------
     The four stages of the lesson's own "From egg to butterfly" step, round a
     ring, because the lesson's home project puts them "in a circle with arrows
     drawn between them" - and because the models chapter later calls a drawing
     like this a diagram. Each stage is the lesson's own picture: a leaf for the
     egg, the caterpillar, the kit's chrysalis, the butterfly. Beside the ring,
     one big picture of whatever the line is about. */
  var GU_BC = [420, 220], GU_BR = 128, GU_BS = 92;
  var GU_BNODE = [[420, 92], [548, 220], [420, 348], [292, 220]];
  var GU_BPIC = ["\u{1F343}", "\u{1F41B}", null, "\u{1F98B}"];       /* [2] is the kit's chrysalis */

  function guBflyPic(k) { return k === 2 ? ART.ICONS.chrysalis : GU_BPIC[k]; }

  /* an arrow along the ring from node a to node b, clear of both pictures */
  function guRingArrow(a, b, u) {
    if (!(u > 0)) return "";
    var pa = GU_BNODE[a], pb = GU_BNODE[b];
    var dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.hypot(dx, dy), cut = 60 / len;
    return MK.arrow(pa[0] + dx * cut, pa[1] + dy * cut, pb[0] - dx * cut, pb[1] - dy * cut, u, P.gold, 6);
  }

  /* a leaf, big, centred on (cx, cy), with bites taken out of it as `bites` grows */
  function guLeaf(cx, cy, s, bites, o) {
    if (!(o > 0)) return "";
    var out = Pth("M" + n2(cx - s * 0.5) + "," + n2(cy + s * 0.3) +
      " C" + n2(cx - s * 0.5) + "," + n2(cy - s * 0.35) + " " + n2(cx + s * 0.2) + "," + n2(cy - s * 0.5) + " " + n2(cx + s * 0.5) + "," + n2(cy - s * 0.42) +
      " C" + n2(cx + s * 0.44) + "," + n2(cy + s * 0.3) + " " + n2(cx - s * 0.1) + "," + n2(cy + s * 0.44) + " " + n2(cx - s * 0.5) + "," + n2(cy + s * 0.3) + " Z", "#4CB65C", "#2F8F45", 3);
    out += Pth("M" + n2(cx - s * 0.5) + "," + n2(cy + s * 0.3) + " L" + n2(cx + s * 0.46) + "," + n2(cy - s * 0.4), null, "#2F8F45", 3);
    var spots = [[0.3, -0.26], [0.02, -0.34], [-0.26, 0.04]];
    for (var k = 0; k < spots.length; k++) {
      var p = clamp(bites - k, 0, 1);
      if (p <= 0) continue;
      out += C(cx + spots[k][0] * s, cy + spots[k][1] * s, s * 0.13 * p, P.ground);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the detail beside the ring, one per line */
  function guBflyDetail(t, scene, k) {
    var c = function (n, name) { return sc(scene, n, name); };
    var out = "";
    if (k === 0) {
      /* The leaf is where the beat starts, so that "a tiny egg" and "on a leaf"
         each have a whole pop of their own and both finish inside the line. */
      var cE = c(0, "egg"), cLf = c(0, "leaf");
      out += guLeaf(990, 232, 215, 0, into(t, scene.first));
      var pe = popIn(t, cE, 0.4);
      out += MK.pop(E(962, 196, 13, 17, "#F4EBD0", "#C9B98A", 3), 962, 196, pe);
      out += MK.leader(902, 96, 950, 182, on(t, cE == null ? null : cE + 0.2, 0.4), P.gold);
      out += MK.pill(902, 80, "egg", Math.min(1, pe), { size: 24, col: P.gold });
      var pl = popIn(t, cLf, 0.4);
      out += MK.leader(1074, 352, 1032, 300, on(t, cLf == null ? null : cLf + 0.1, 0.35), P.gold);
      out += MK.pill(1074, 374, "leaf", Math.min(1, pl), { size: 24, col: P.gold });
    } else if (k === 1) {
      var ce = c(1, "eats"), cg = c(1, "grow");
      out += guLeaf(1000, 190, 200, tally(t, ce, 3, 1.2), on(t, c(1, "cat"), 0.4));
      var grow = on(t, cg, 0.9);
      out += MK.pic(880 + 40 * grow, 318, 76 + 54 * grow, "\u{1F41B}", { opacity: on(t, c(1, "cat"), 0.4) });
    } else if (k === 2 || k === 3) {
      var cH = c(2, "hang"), cS = c(2, "still");
      var swing = cH == null || t < cH ? 0 : 15 * Math.exp(-(t - cH) * 1.0) * Math.sin((t - cH) * 5) * (1 - on(t, cS, 0.7));
      var body = MK.pic(965, 224, 224, ART.ICONS.chrysalis);
      out += G(body, { transform: "rotate(" + n2(swing) + " 965 143)", opacity: on(t, cH, 0.5) });
      if (k === 3) {
        var ci = c(3, "inside"), ca = c(3, "alive");
        out += MK.glow(965, 240, 86, P.gold, on(t, ci, 0.8) * (0.5 + 0.5 * breathe(t)));
        out += G(MK.pic(965, 240, 78, "\u{1F98B}"), { opacity: 0.55 * on(t, ci, 0.9) });
        out += MK.tick(1094, 152, 24, popIn(t, ca, 0.4));
        out += MK.pill(965, 384, "changing inside", on(t, ci, 0.5), { size: 22, col: P.gold });
      }
    } else if (k === 4) {
      var cO = c(4, "out"), cW = c(4, "wings"), cL = c(4, "lay");
      var open = 0.42 + 0.58 * on(t, cW, 0.8), lift = 26 * on(t, cL, 0.7);
      out += G(MK.pic(965, 214 - lift, 168, "\u{1F98B}"),
        { transform: "translate(" + n2(965 * (1 - open)) + ",0) scale(" + n3(open) + ",1)", opacity: on(t, cO, 0.4) });
      out += guArc(902, 150, 700, 26, 466, 78, on(t, cL, 0.8), P.gold, 5);
    }
    return out;
  }

  function guBflyChapter(scene, beat, t, i) {
    var c = function (n, name) { return sc(scene, n, name); };
    var k = i - scene.first;
    var appear = [c(0, "egg"), c(1, "cat"), c(2, "chrys"), c(4, "out")];
    var labels = ["egg", "caterpillar", "chrysalis", "butterfly"];
    var out = "";

    /* the ring: a stage and the arrow into it, as each is named */
    out += guRingArrow(0, 1, on(t, appear[1], 0.5));
    out += guRingArrow(1, 2, on(t, appear[2], 0.5));
    out += guRingArrow(2, 3, on(t, appear[3], 0.5));
    out += guRingArrow(3, 0, on(t, c(4, "lay"), 0.5));
    for (var n = 0; n < 4; n++) {
      var p = popIn(t, appear[n], 0.45);
      if (p <= 0) continue;
      var bright = n === [0, 1, 2, 2, 3][k];
      var node = MK.pop(MK.pic(GU_BNODE[n][0], GU_BNODE[n][1], GU_BS, guBflyPic(n)), GU_BNODE[n][0], GU_BNODE[n][1], p);
      /* The lesson's own egg card is a LEAF emoji with no egg drawn on it, and
         the ring's first node wears the pill "egg". The film lays the egg onto
         the leaf, the same pale oval the big picture beside the ring uses, so
         the label and the picture say the same thing (brief, rule 8). */
      if (n === 0) node += MK.pop(E(426, 98, 9, 12, "#F4EBD0", "#C9B98A", 3), 426, 98, p);
      out += G(node, { opacity: bright ? 1 : 0.5 });
      var lo = Math.min(1, p);
      if (n === 0) out += MK.pill(420, 28, labels[0], lo, { size: 22, col: bright ? P.gold : P.line });
      if (n === 1) out += MK.pill(620, 220, labels[1], lo, { size: 22, anchor: "start", col: bright ? P.gold : P.line });
      if (n === 2) out += MK.pill(420, 416, labels[2], lo, { size: 22, col: bright ? P.gold : P.line });
      if (n === 3) out += MK.pill(218, 220, labels[3], lo, { size: 22, anchor: "end", col: bright ? P.gold : P.line });
    }

    /* the big picture beside it, crossfading from line to line */
    out += G(guBflyDetail(t, scene, k), { opacity: 1 });
    if (k > 0 && into(t, i) < 1) out += G(guBflyDetail(t, scene, k - 1), { opacity: 1 - into(t, i) });
    return svg(out);
  }

  /* ---- babies and chicks ------------------------------------------------------------
     The lesson's own "Babies and chicks grow bigger" demo, both rows at once:
     baby, child, adult above; chick and grown bird below, each the picture the
     demo's frames use. The dashed outline round each is the same shape at every
     size, which is the whole point of the chapter. */
  var GU_HUM = [[190, 170, 96, "\u{1F476}\u{1F3FE}"], [420, 170, 126, "\u{1F9D2}\u{1F3FE}"], [650, 170, 156, "\u{1F9D1}\u{1F3FE}"]];
  var GU_BIRD = [[190, 352, 92, "\u{1F423}"], [420, 352, 126, "\u{1F426}"]];

  /* how far the grown bird is off the ground at t, once "can fly" is said.
     It was 9 to 22 px and was not visible as a change on the contact sheet -
     the bird looked the same height on "a few weeks" and on "can fly", which
     is the one word the lift exists to answer. 18 to 32 px reads, and still
     clears the child above it (whose card bottom is y 233). */
  function guBirdUp(t, fly) { return fly * (18 + 14 * (0.5 + 0.5 * Math.sin(t * 2.8))); }

  /* The same shape, at the size of the thing it is round. A row's two or three
     members share one pair of factors, because "same shape, bigger" is the whole
     chapter; the birds need their own pair, being wider than they are tall. */
  function guShape(x, y, size, o, wf, hf) {
    if (!(o > 0)) return "";
    var w = size * (wf || 0.68), h = size * (hf || 0.96);
    return R(x - w / 2, y - h / 2, w, h, size * 0.24, "none", P.teal, 3,
      { opacity: clamp(o, 0, 1), "stroke-dasharray": "11 8" });
  }

  function guBiggerChapter(scene, beat, t, i) {
    var c = function (n, name) { return sc(scene, n, name); };
    var k = i - scene.first;
    var cBaby = c(0, "baby"), cChild = c(2, "child"), cAdult = c(2, "adult"), cChick = c(3, "chick");
    var appear = [cBaby, cChild, cAdult];
    var out = "";

    /* the humans, each with the arrow that brought it */
    out += MK.arrow(246, 170, 349, 170, on(t, cChild, 0.5), P.gold, 6);
    out += MK.arrow(491, 170, 564, 170, on(t, cAdult, 0.5), P.gold, 6);
    for (var n = 0; n < 3; n++) {
      var h = GU_HUM[n], p = popIn(t, appear[n], 0.45);
      if (p > 0) out += MK.pop(MK.pic(h[0], h[1], h[2], h[3]), h[0], h[1], p);
    }
    /* the birds */
    var fly = on(t, c(3, "fly"), 0.5);
    out += MK.arrow(244, 352, 349, 352, on(t, c(3, "weeks"), 0.5), P.gold, 6);
    var pc = popIn(t, cChick, 0.45);
    if (pc > 0) out += MK.pop(MK.pic(GU_BIRD[0][0], GU_BIRD[0][1], GU_BIRD[0][2], GU_BIRD[0][3]), GU_BIRD[0][0], GU_BIRD[0][1], pc);
    var pb = popIn(t, c(3, "weeks"), 0.45);
    if (pb > 0) {
      /* The bird leaves the ground on "can fly" and stays up, breathing: three
         speed lines behind it landed on the arrow it had just flown along and
         read as a second arrow. */
      var up = guBirdUp(t, fly);
      out += MK.pop(MK.pic(GU_BIRD[1][0], GU_BIRD[1][1] - up, GU_BIRD[1][2], GU_BIRD[1][3]), GU_BIRD[1][0], GU_BIRD[1][1], pb);
    }

    /* beat 0: it cannot walk or talk yet, and it drinks milk */
    var b0 = guOnly(t, scene, 0), cNot = c(0, "cannot");
    if (b0 > 0) {
      var p1 = popIn(t, cNot, 0.35) * b0, p2 = popIn(t, cNot == null ? null : cNot + 0.5, 0.35) * b0;
      out += MK.cross(700, 140, 26, p1) + MK.pill(740, 140, "walk", Math.min(1, p1), { size: 24, anchor: "start", col: P.bad });
      out += MK.cross(700, 240, 26, p2) + MK.pill(740, 240, "talk", Math.min(1, p2), { size: 24, anchor: "start", col: P.bad });
      out += MK.pop(MK.pic(890, 336, 126, "\u{1F37C}"), 890, 336, popIn(t, c(0, "milk"), 0.45) * b0);
    }

    /* beat 1: the shape of a person, and the same shape bigger. The outlines
       are drawn round the baby, never round the child and adult, who are not
       on screen until the next line (the first cut outlined empty air). */
    var b1 = guOnly(t, scene, 1), cShape = c(1, "shape"), cBig = c(1, "bigger");
    if (b1 > 0) {
      out += guShape(GU_HUM[0][0], GU_HUM[0][1], GU_HUM[0][2], on(t, cShape, 0.5) * b1);
      out += MK.pill(500, 56, "the same shape", Math.min(1, popIn(t, cShape, 0.4)) * b1, { size: 26, col: P.teal });
      for (var z = 1; z < 3; z++)
        out += guShape(GU_HUM[0][0], GU_HUM[0][1], GU_HUM[0][2] * (1 + z * 0.38),
          on(t, cBig == null ? null : cBig + (z - 1) * 0.35, 0.5) * b1);
      out += MK.pill(500, 300, "only bigger", Math.min(1, popIn(t, cBig, 0.4)) * b1, { size: 26, col: P.gold });
    }

    /* beat 2: that takes many years */
    var b2 = guOnly(t, scene, 2), cYears = c(2, "years");
    if (b2 > 0) {
      out += MK.pop(MK.pic(912, 156, 112, "\u{1F382}"), 912, 156, popIn(t, cYears, 0.45) * b2);
      out += MK.pill(912, 250, "many years", Math.min(1, popIn(t, cYears, 0.4)) * b2, { size: 26, col: P.gold });
    }

    /* beat 3: in a few weeks */
    var b3 = guOnly(t, scene, 3);
    if (b3 > 0) out += MK.pill(620, 352, "a few weeks", Math.min(1, popIn(t, c(3, "weeks"), 0.4)) * b3, { size: 24, anchor: "start", col: P.gold });

    /* beat 4: same shape, bigger - and the frog, which is not */
    var b4 = guOnly(t, scene, 4), cSame = c(4, "same"), cNo = c(4, "not");
    if (b4 > 0) {
      for (var m = 0; m < 3; m++) out += guShape(GU_HUM[m][0], GU_HUM[m][1], GU_HUM[m][2], on(t, cSame == null ? null : cSame + m * 0.16, 0.45) * b4);
      /* the grown bird is still bobbing, so its outline bobs with it */
      for (var q = 0; q < 2; q++) out += guShape(GU_BIRD[q][0], GU_BIRD[q][1] - (q === 1 ? guBirdUp(t, fly) : 0),
        GU_BIRD[q][2], on(t, cSame == null ? null : cSame + 0.48 + q * 0.16, 0.45) * b4, 0.9, 0.97);
      var pf = popIn(t, cNo, 0.45) * b4;
      out += MK.pop(guPic(884, 300, 88, ART.ICONS.tadpole), 884, 300, pf);
      out += MK.arrow(932, 300, 986, 300, on(t, cNo == null ? null : cNo + 0.2, 0.5) * b4, P.gold, 6);
      out += MK.pop(MK.pic(1032, 300, 88, "\u{1F438}"), 1032, 300, popIn(t, cNo == null ? null : cNo + 0.35, 0.45) * b4);
      out += MK.pill(958, 392, "changes shape", Math.min(1, pf), { size: 24, col: P.accent });
    }
    return svg(out);
  }

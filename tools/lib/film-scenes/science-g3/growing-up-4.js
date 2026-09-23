  /* ==== chapters: two kinds of model, and what you now know =====================
     tools/lib/film-scenes/science-g3/growing-up-4.js. */

  /* ---- two kinds of model ------------------------------------------------------
     The lesson's own two bins, one example each. The diagram is the frog's life
     cycle drawn as a labelled circle - the lesson's own first sorting item, and
     the shape its home project asks the child to draw - built out of the kit's
     frogspawn, tadpole and froglet drawings and the lesson's frog. The physical
     models are the lesson's own three: the plastic butterfly whose wings open,
     the globe and the toy skeleton.

     Beat 0 builds the cycle large in the middle, with four things round it that
     are not part of the idea; they fade as "shows an idea clearly" is said, and
     the cycle then moves into the diagram panel. */
  var GU_PANY = 96, GU_PANH = 318, GU_PANW = 514, GU_PANX = [60, 594];
  var GU_MLAB = ["frogspawn", "tadpole", "froglet", "frog"];
  function guMpic(k) { return [ART.ICONS.frogspawn, ART.ICONS.tadpole, ART.ICONS.froglet, "\u{1F438}"][k]; }
  /* the label of node k, as [x, y, anchor], for a ring of radius r about (cx, cy) */
  function guMlabAt(k, cx, cy, r) {
    /* the frog's label sits UNDER it: to its left is where the eye's pointer
       comes in, and the two were written through each other */
    return [[cx + 35, cy - r + 6, "start"], [cx + r + 38, cy + 6, "start"],
      [cx + 35, cy + r + 6, "start"], [cx - r, cy + r * 0.62 + 6, "middle"]][k];
  }
  /* the four stages round a circle, with an arrow from each to the next */
  function guCycle(t, cx, cy, r, size, at, labO) {
    var out = "", pos = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    for (var k = 0; k < 4; k++) {
      var a = pos[k], b = pos[(k + 1) % 4], u = on(t, at == null ? null : at + (k + 1) * 0.22, 0.45);
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), cut = (size * 0.62) / len;
      out += MK.arrow(a[0] + dx * cut, a[1] + dy * cut, b[0] - dx * cut, b[1] - dy * cut, u, P.gold, 5);
    }
    for (var n = 0; n < 4; n++) {
      var p = popIn(t, at == null ? null : at + n * 0.22, 0.4);
      if (p <= 0) continue;
      out += MK.pop(guPic(pos[n][0], pos[n][1], size, guMpic(n)), pos[n][0], pos[n][1], p);
      if (labO > 0) {
        var la = guMlabAt(n, cx, cy, r);
        out += Tx(la[0], la[1], GU_MLAB[n], "lab mid gold", la[2], { opacity: clamp(labO, 0, 1) });
      }
    }
    return out;
  }

  /* an eye, looking right: the film's way of saying a diagram is read */
  function guEye(cx, cy, s, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(cx - s) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy - s * 0.78) + " " + n2(cx + s) + "," + n2(cy) +
        " Q" + n2(cx) + "," + n2(cy + s * 0.78) + " " + n2(cx - s) + "," + n2(cy) + " Z", "#FFFFFF", P.edge, 3) +
      C(cx + s * 0.16, cy, s * 0.36, "#6B4A2B") + C(cx + s * 0.2, cy, s * 0.17, "#0B1D2C") +
      C(cx + s * 0.06, cy - s * 0.12, s * 0.08, "#FFFFFF"), { opacity: clamp(o, 0, 1) });
  }

  /* the four things that are not part of the idea, round the big cycle */
  var GU_REST = [[372, 96], [796, 96], [372, 344], [796, 344]];
  function guRestPic(k) { return ["\u{1F41F}", "\u{1F33F}", ART.ICONS.rock, "\u{1F4A7}"][k]; }

  function guModelsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cModels = c(0, "models"), cIdea = c(0, "idea"), cDraw = c(1, "drawing"), cLabels = c(1, "labels"),
      cDiag = c(1, "diagram"), cRead = c(1, "read"), cPlas = c(2, "plastic"), cPhys = c(2, "phys"),
      cGlobe = c(3, "globe"), cSkel = c(3, "skel"), cHold = c(3, "hold");
    var m = guFrom(t, scene, 1);                 /* 0 in the middle, 1 in the left panel */
    var b3 = guFrom(t, scene, 3);
    var out = "";

    /* the two panels, each lit while it is being talked about */
    if (m > 0) {
      var litL = guOnly(t, scene, 1) > 0.5, litR = (guOnly(t, scene, 2) + guOnly(t, scene, 3)) > 0.5;
      out += guPanel(GU_PANX[0], GU_PANY, GU_PANW, GU_PANH, litL, m);
      out += guPanel(GU_PANX[1], GU_PANY, GU_PANW, GU_PANH, litR, m);
    }

    /* the four things the model leaves out */
    for (var k = 0; k < 4; k++) {
      var po = popIn(t, cModels == null ? null : cModels + 0.2 + k * 0.12, 0.4) * (1 - on(t, cIdea, 0.7));
      if (po > 0) out += G(MK.pic(GU_REST[k][0], GU_REST[k][1], 62, guRestPic(k)),
        { transform: around(GU_REST[k][0], GU_REST[k][1], Math.min(po, 1.1)), opacity: Math.min(1, po) * 0.75 });
    }

    /* the cycle: big in the middle, then smaller in the diagram panel */
    var cx = lerp(584, 317, m), cy = lerp(220, 258, m), r = lerp(100, 76, m), sz = lerp(82, 58, m);
    out += MK.glow(cx, cy, r + 70, P.gold, on(t, cIdea, 0.7) * (1 - m) * (0.55 + 0.45 * breathe(t)));
    out += guCycle(t, cx, cy, r, sz, cModels, on(t, cLabels, 0.5));

    /* "is a diagram. You read it." */
    out += MK.pill(317, 126, "diagram", on(t, cDiag, 0.4) * m, { size: 26, col: P.gold });
    out += guEye(126, 258, 34, on(t, cRead, 0.45));
    out += L(166, 258, lerp(166, 206, on(t, cRead, 0.45)), 258, P.gold, 3, { opacity: on(t, cRead, 0.45), "stroke-dasharray": "9 7" });
    out += Tx(317, 402, "you read it", "lab mid muted", "middle", { opacity: on(t, cRead, 0.45) });

    /* the physical models: the plastic butterfly, then the globe and the toy
       skeleton beside it. Its wings open and close all the while. */
    var pb = popIn(t, cPlas, 0.45);
    if (pb > 0) {
      var bx = lerp(851, 700, b3), by = lerp(258, 262, b3), bs = lerp(150, 96, b3);
      var open = cPlas == null ? 1 : 0.32 + 0.68 * (0.5 + 0.5 * Math.sin((t - cPlas) * 2.4));
      out += G(G(MK.pic(bx, by, bs, "\u{1F98B}"),
        { transform: "translate(" + n2(bx) + "," + n2(by) + ") scale(" + n3(open) + ",1) translate(" + n2(-bx) + "," + n2(-by) + ")" }),
        { transform: around(bx, by, Math.min(pb, 1.1)), opacity: Math.min(1, pb) });
    }
    out += MK.pill(851, 126, "physical model", on(t, cPhys, 0.4) * m, { size: 26, col: P.gold });
    var pg = popIn(t, cGlobe, 0.45), pk = popIn(t, cSkel, 0.45);
    if (pg > 0) out += MK.pop(MK.pic(851, 262, 104, "\u{1F30D}"), 851, 262, pg);
    if (pk > 0) out += MK.pop(MK.pic(1002, 262, 96, "\u{1F9B4}"), 1002, 262, pk);
    /* "You can hold a physical model and turn it": a hand under it, and the turn */
    var ph = popIn(t, cHold, 0.45);
    if (ph > 0) out += MK.pop(MK.pic(851, 340, 70, "\u{1F91A}"), 851, 340, ph);
    out += guTurn(851, 262, 56, on(t, cHold == null ? null : cHold + 0.25, 0.7), P.gold);
    out += Tx(851, 402, "you hold it", "lab mid muted", "middle", { opacity: on(t, cHold, 0.5) });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  function guPair(cx, cy, size, a, b, arrow) {
    var out = guPic(cx - size * 0.44, cy, size * 0.74, a) + guPic(cx + size * 0.44, cy, size * 0.74, b);
    if (arrow) out += MK.arrow(cx - size * 0.12, cy, cx + size * 0.12, cy, 1, P.gold, 4);
    return out;
  }
  var GU_RECAP = MK.recapKind([
    { beat: 0, at: "frog", title: "Frog", sub: "tadpole into frog: a new shape",
      pic: function (cx, cy, size) { return guPair(cx, cy, size, ART.ICONS.tadpole, "\u{1F438}", true); } },
    { beat: 0, at: "bfly", title: "Butterfly", sub: "caterpillar into butterfly",
      pic: function (cx, cy, size) { return guPair(cx, cy, size, "\u{1F41B}", "\u{1F98B}", true); } },
    { beat: 1, at: "keep", title: "Chick and baby", sub: "the same shape, bigger",
      pic: function (cx, cy, size) { return guPair(cx, cy, size, "\u{1F423}", "\u{1F476}\u{1F3FE}", false); } },
    { beat: 2, at: "speed", title: "Weeks, months, years", sub: "each at its own speed",
      pic: function (cx, cy, size) {
        return MK.pic(cx - size * 0.5, cy, size * 0.6, "\u{1F4C5}") + MK.pic(cx, cy, size * 0.6, "\u{1F5D3}️") +
          MK.pic(cx + size * 0.5, cy, size * 0.6, "\u{1F382}");
      } },
    { beat: 3, at: "diagram", title: "Diagram", sub: "a drawing you read", pic: "\u{270F}️" },
    { beat: 3, at: "phys", title: "Physical model", sub: "a thing you hold", pic: "\u{1F30D}" }
  ], { goBeat: 3, goAt: "phys" });

  var KINDS = {
    title: MK.titleKind({ sub: ["A frog and a butterfly change shape", "A chick and a baby only grow bigger", "Diagrams, and models you can hold"] }),
    frog: guFrogChapter, butterfly: guBflyChapter, bigger: guBiggerChapter,
    twoways: guSortChapter, table: guTableChapter, models: guModelsChapter, recap: GU_RECAP
  };

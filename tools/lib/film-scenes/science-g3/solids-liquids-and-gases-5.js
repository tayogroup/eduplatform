  /* ==== chapter: the right equipment, the recap, and KINDS ====================
     tools/lib/film-scenes/science-g3/solids-liquids-and-gases-5.js.

     The four tools LESSON["lecture"] part 5 names, each with the unit the
     lesson gives it, one lit at a time as it is named and the ones already
     named left dim (rule 3). Then the lesson's own "Children reach for a ruler
     for everything" correction: a ruler stood against a jug of water, and a
     cross. The ruler and the measuring jug are drawn (slRuler, slMeasJug) so
     they are the same two objects the previous chapter measured with. */

  var SL_CARD = { y: 76, w: 260, h: 248 };
  function slCardX(k) { return 28 + k * 284; }
  function slCardCx(k) { return slCardX(k) + SL_CARD.w / 2; }

  function slToolCards(t, scene, allLit) {
    var c = function (k, n) { return sc(scene, k, n); };
    var tools = [
      { at: c(1, "ruler"), title: "a ruler", unit: "length, in centimetres",
        draw: function (cx, o) { return slRuler(cx - 102, 140, 204, 58, 8, 9, o); } },
      { at: c(2, "jug"), title: "a measuring jug", unit: "liquid, in millilitres",
        draw: function (cx, o) { return slMeasJug(cx, 172, 152, 0.7, o); } },
      { at: c(3, "therm"), title: "a thermometer", unit: "how hot it is",
        draw: function (cx, o) { return G(Em(cx, 170, 112, "\u{1F321}️"), { opacity: clamp(o, 0, 1) }); } },
      { at: c(3, "scales"), title: "scales", unit: "how heavy it is",
        draw: function (cx, o) { return G(Em(cx, 170, 108, "⚖️"), { opacity: clamp(o, 0, 1) }); } }
    ];
    /* the newest one named is the lit one; the ones before it stay dim */
    var newest = -1;
    tools.forEach(function (tool, k) { if (tool.at != null && t >= tool.at) newest = k; });
    var out = "";
    tools.forEach(function (tool, k) {
      var named = on(t, tool.at, 0.45);
      var lit = allLit ? 1 : k === newest ? named : named * 0.45;
      var x = slCardX(k), cx = slCardCx(k);
      out += R(x, SL_CARD.y, SL_CARD.w, SL_CARD.h, 20, lit > 0.7 ? "#1B3A52" : P.card,
        lit > 0.7 ? P.gold : P.line, lit > 0.7 ? 3 : 2, { opacity: 0.35 + 0.65 * Math.max(lit, named * 0.6) });
      /* every tool is on its card from the chapter's first line, faint: four
         empty boxes are nothing for a child to look at while they are named */
      out += tool.draw(cx, Math.max(0.3, lit));
      out += Tx(cx, 256, tool.title, "lab big", "middle", { opacity: named, fill: lit > 0.7 ? P.gold : P.ink });
      out += Tx(cx, 292, tool.unit, "lab mid muted readable", "middle", { opacity: named });
      if (allLit) out += MK.tick(x + SL_CARD.w - 30, SL_CARD.y + 30, 20, popIn(t, sc(scene, 5, "tool"), 0.4));
    });
    return out;
  }

  /* beats 0 to 3: the four tools, named one at a time */
  function slToolsRow(t, scene) {
    var out = slToolCards(t, scene, false);
    out += MK.pill(584, 382, "the right equipment for the job",
      on(t, sc(scene, 0, "choose"), 0.45) * (1 - on(t, sc(scene, 1, "ruler"), 0.5)), { size: 28, col: P.gold });
    return out;
  }

  /* beat 4: the lesson's own correction - a ruler cannot measure how much */
  function slToolsWrong(t, scene) {
    var cCannot = sc(scene, 4, "cannot"), cMuch = sc(scene, 4, "much"), cJug = sc(scene, 4, "jug");
    var out = "";
    out += slMeasJug(716, 238, 290, 0.72, 1);
    /* the box takes in the handle on the left and the lip on the right, so
       what it rings is the whole jug and not the jug minus its handle */
    out += R(552, 118, 310, 242, 18, "none", P.gold, 4,
      { opacity: bump(t, cJug, 1.7), "stroke-dasharray": "15 10" });
    /* a ruler stood up against it, and a cross */
    var rp = on(t, cCannot, 0.5);
    if (rp > 0) {
      out += G(slRuler(0, 0, 296, 78, 10, 11, rp), { transform: "translate(504,96) rotate(90)" });
      out += MK.cross(466, 244, 38, popIn(t, cCannot == null ? null : cCannot + 0.5, 0.4));
    }
    out += MK.pill(228, 194, "how much water?", on(t, cMuch, 0.45), { size: 28, col: P.line });
    out += MK.qmark(228, 300, 32, on(t, cMuch, 0.55));
    out += MK.pill(984, 400, "a jug, not a ruler", on(t, cJug, 0.5), { size: 24, col: P.good });
    return out;
  }

  /* beat 5: all four, with the unit each one measures in */
  function slToolsAll(t, scene) {
    var out = slToolCards(t, scene, true);
    out += MK.pill(584, 382, "and always in a standard unit", on(t, sc(scene, 5, "unit"), 0.45), { size: 28, col: P.good });
    return out;
  }

  function slToolsChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k <= 3 ? slToolsRow(t, scene) : k === 4 ? slToolsWrong(t, scene) : slToolsAll(t, scene);
    }
    var k = i - scene.first;
    return svg(k === 4 || k === 5 ? crossfade(t, i, scene, draw) : draw(i));
  }

  /* ==== what you now know ======================================================= */

  var SL_RECAP = MK.recapKind([
    { beat: 0, at: "solid", title: "Solid", sub: "keeps its own shape", pic: "\u{1F9CA}" },
    { beat: 0, at: "liquid", title: "Liquid", sub: "takes the shape of its container", pic: "\u{1F4A7}" },
    { beat: 1, at: "gas", title: "Gas", sub: "spreads out to fill the space", pic: "\u{1F4A8}" },
    { beat: 1, at: "sand", title: "Sand", sub: "lots of tiny solids, so it pours",
      pic: function (cx, cy, size) {
        return slGrain(cx - size * 0.3, cy + size * 0.12, size * 0.2, 1) +
          slGrain(cx + size * 0.28, cy + size * 0.16, size * 0.17, 1) +
          slGrain(cx, cy - size * 0.16, size * 0.24, 1);
      } },
    { beat: 2, at: "units", title: "Standard units", sub: "a centimetre is the same for everyone",
      pic: function (cx, cy, size) { return slRuler(cx - size * 0.72, cy - size * 0.2, size * 1.44, size * 0.42, 6, 7, 1); } },
    { beat: 2, at: "kit", title: "The right equipment", sub: "for what you want to measure",
      /* spread wide enough not to touch: at 0.42 the jug's handle and its lip
         ran into the two emoji and the three read as one jumble */
      pic: function (cx, cy, size) {
        return G(Em(cx - size * 0.6, cy, size * 0.46, "\u{1F321}️") + Em(cx + size * 0.6, cy, size * 0.46, "⚖️"), {}) +
          slMeasJug(cx, cy, size * 0.6, 0.7, 1);
      } }
  ], { goBeat: 2, goAt: "kit" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Keeps its shape, flows, or spreads out", "How a solid and a liquid differ", "Centimetres, and the right equipment"] }),
    states: slStatesChapter, shapes: slShapesChapter, gases: slGasesChapter,
    sand: slSandChapter, units: slUnitsChapter, tools: slToolsChapter, recap: SL_RECAP
  };

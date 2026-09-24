  /* ==== Particles, part 3: the three words, and why sand pours =================
     tools/lib/film-scenes/science-g4/particles-3.js. The three cards are the
     lesson's own explore step (material, substance, particle), with its pictures
     and its subtitles. The sand is the film's own drawing, and it is drawn the
     way the lesson's liquid is drawn: rows of grains that slide past each other
     in opposite directions, so the child sees the same motion twice and the
     words "the grains, not the particles" have a picture to sit on. Inside one
     grain the film shows the lesson's box again, packed in rows. */

  /* ==== chapter: material, substance, particle ==================================== */
  var PA_WORDS = [
    { title: "material", sub: "what a thing is made of", at: "material" },
    { title: "substance", sub: "one pure kind of stuff", at: "substance" },
    { title: "particle", sub: "a tiny bit of a substance", at: "particle" }
  ];
  var PA_WCARD = { y: 68, w: 340, h: 300, gap: 24 };
  function paWordX(k) { return (1168 - 3 * PA_WCARD.w - 2 * PA_WCARD.gap) / 2 + k * (PA_WCARD.w + PA_WCARD.gap); }
  var PA_MIX = ["#C08A4A", "#7BC47F", "#5FA8DC", "#C08A4A", "#7BC47F", "#5FA8DC"];
  var PA_DOTX = [-72, -43, -14, 15, 44, 73];

  function paWordCard(k, t, appear, lit, dots, dotCol, anyLit) {
    if (!(appear > 0)) return "";
    var x = paWordX(k), cx = x + PA_WCARD.w / 2, y = PA_WCARD.y, w = PA_WORDS[k];
    var out = R(x, y, PA_WCARD.w, PA_WCARD.h, 20, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 4 : 2);
    if (k === 0) out += MK.pic(cx, y + 92, 116, ART.ICONS.wood);
    else if (k === 1) out += paDrop(cx, y + 112, 44, 1);
    else out += paBall(cx + Math.sin(t * 22.5) * 3, y + 96, 46);
    out += Tx(cx, y + 218, w.title, "lab big", "middle", lit ? { fill: P.gold } : null);
    out += Tx(cx, y + 266, w.sub, "lab mid muted readable", "middle");
    for (var d = 0; d < Math.min(6, Math.round(dots * 6)); d++)
      out += paBall(cx + PA_DOTX[d], y + 160 + (d % 2 ? 7 : 0), 11, dotCol === "mix" ? PA_MIX[d] : dotCol || "#5FA8DC");
    return G(out, { opacity: clamp((lit || !anyLit ? 1 : 0.42) * Math.min(1, appear), 0, 1),
      transform: around(cx, y + PA_WCARD.h / 2, 0.96 + 0.04 * Math.min(1, appear) + (lit ? 0.02 : 0)) });
  }

  function paWordsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cThree = c(0, "three");
    var cMat = c(1, "material"), cMade = c(1, "made"), cWood = c(1, "wood"), cMix = c(1, "mixture");
    var cSub = c(2, "substance"), cPure = c(2, "pure"), cThru = c(2, "through"), cWater = c(2, "water");
    var cPart = c(3, "particle"), cTiny = c(3, "tiny"), cOf = c(3, "of");
    /* each card wears the gold ring from the moment its own word is said, and
       loses it when the next word is said: one at a time (rule 3) */
    var litAt = [cMat, cSub, cPart];
    function paWordLit(k) {
      var a = on(t, litAt[k], 0.4), nx = k < 2 ? on(t, litAt[k + 1], 0.4) : 0;
      return a * (1 - nx);
    }
    var anyLit = paWordLit(0) > 0.5 || paWordLit(1) > 0.5 || paWordLit(2) > 0.5;
    var out = "";
    /* Three empty places, opening with the chapter so the stage is never blank,
       and each going gold in turn on "three words apart" before it fills with
       its own word. */
    var slotIn = into(t, scene.first);
    for (var p = 0; p < 3; p++) {
      var slot = slotIn * clamp(1 - Math.min(1, popIn(t, sc(scene, 0, PA_WORDS[p].at), 0.45)), 0, 1);
      if (slot > 0) {
        var gold = on(t, cThree == null ? null : cThree + p * 0.22, 0.3);
        out += R(paWordX(p), PA_WCARD.y, PA_WCARD.w, PA_WCARD.h, 20, P.card,
          paMix("#93AABE", "#F4C95D", gold), 3 + gold, { "stroke-dasharray": "14 11", opacity: 0.85 * clamp(slot, 0, 1) });
        if (gold > 0) out += Tx(paWordX(p) + PA_WCARD.w / 2, PA_WCARD.y + PA_WCARD.h / 2 + 22,
          String(p + 1), "lab huge", "middle", { fill: P.gold, opacity: 0.9 * gold * clamp(slot, 0, 1) });
      }
    }
    for (var k = 0; k < 3; k++) {
      var app = popIn(t, sc(scene, 0, PA_WORDS[k].at), 0.45);
      var dots = k === 0 ? on(t, cMix, 0.9) : k === 1 ? Math.max(on(t, cPure, 0.9), on(t, cOf, 0.9)) : 0;
      out += paWordCard(k, t, app, paWordLit(k) > 0.5, dots, k === 0 ? "mix" : "#5FA8DC", anyLit);
    }
    /* beat 2: wood is a material, and a mixture of substances */
    if (paOnly(t, scene, 1) > 0.3) {
      /* "what a thing is made of": the lesson's own example - a tree's trunk is
         made of wood - with a line from the tree to the wood in the card */
      var made = on(t, cMade, 0.5) * paOnly(t, scene, 1);
      if (made > 0) {
        out += MK.pic(96, 36, 58, "\uD83C\uDF33", { opacity: clamp(made, 0, 1) });
        out += MK.leader(124, 56, 178, 124, made, P.gold);
      }
      out += MK.glow(220, 160, 116, P.gold, 0.85 * bump(t, cWood, 1.2));
      out += MK.pill(220, 406, "a mixture of substances", on(t, cMix, 0.4) * paOnly(t, scene, 1), { size: 23, col: P.gold });
    }
    /* beat 3: one pure kind of stuff, the same all the way through */
    out += MK.pill(584, 406, "one kind, all the way through", on(t, cThru, 0.4) * paOnly(t, scene, 2), { size: 23, col: P.gold });
    /* the tick for "Water is one" belongs on the SUBSTANCE card, beside its drop */
    out += MK.tick(700, 110, 26, popIn(t, cWater, 0.4) * paOnly(t, scene, 2));
    /* beat 4: a particle is one of the tiny bits a substance is made of */
    var tie = on(t, cTiny, 0.7) * paOnly(t, scene, 3);
    if (tie > 0) out += MK.leader(756, 228, 900, 164, tie, P.gold);
    out += MK.pill(948, 406, "one tiny bit of it", on(t, cOf, 0.4) * paOnly(t, scene, 3), { size: 23, col: P.gold });
    return svg(out);
  }

  /* ==== chapter: why sand pours =================================================== */
  var PA_CUP = { cx: 341, top: 232, bot: 384, halfTop: 106, halfBot: 76 };
  function paCupHalf(y) { return lerp(PA_CUP.halfBot, PA_CUP.halfTop, clamp((PA_CUP.bot - y) / (PA_CUP.bot - PA_CUP.top), 0, 1)); }
  function paCupPath() {
    var C0 = PA_CUP;
    return "M" + n2(C0.cx - C0.halfTop) + "," + n2(C0.top) + " L" + n2(C0.cx - C0.halfBot) + "," + n2(C0.bot) +
      " L" + n2(C0.cx + C0.halfBot) + "," + n2(C0.bot) + " L" + n2(C0.cx + C0.halfTop) + "," + n2(C0.top);
  }
  /* the grains in the cup: five rows, and with slide > 0 alternate rows move in
     opposite directions, the way the lesson's liquid rows do */
  function paCupSand(t, fill, slide, ring) {
    var rows = "", n = Math.round(clamp(fill, 0, 1) * 5);
    for (var r = 0; r < n; r++) {
      var y = PA_CUP.bot - 16 - r * 25, half = paCupHalf(y), off = slide > 0 ? ((t * 17 * (r % 2 ? 1 : -1)) % 25) : 0;
      for (var k = -1; k < 10; k++) {
        var x = PA_CUP.cx - half + 8 + k * 25 + off;
        if (x < PA_CUP.cx - half - 14 || x > PA_CUP.cx + half + 14) continue;
        rows += C(x, y, 11, k % 3 === 1 ? "#C79A5E" : "#D9B27C", "#94713F", 2);
      }
    }
    var out = el("clipPath", { id: "paCupClip" }, Pth(paCupPath() + " Z", "#000")) +
      G(rows, { "clip-path": "url(#paCupClip)" });
    if (ring > 0) out += C(PA_CUP.cx + 33, PA_CUP.bot - 91, 21, "none", "#FFFFFF", 5, { opacity: clamp(ring, 0, 1) });
    return out;
  }
  function paCup(t, o, fill, slide, ring, lit) {
    if (!(o > 0)) return "";
    return G(Pth(paCupPath(), "none", lit > 0.5 ? P.gold : "#E6E1D4", 6) + paCupSand(t, fill, slide, ring),
      { opacity: clamp(o, 0, 1) });
  }
  /* the scoop that pours, and the grains falling from its lip */
  function paPour(t, at, until, o) {
    if (!(o > 0)) return "";
    var out = G(R(-62, -34, 124, 68, 14, "#F2EFE6", "#3A3A3A", 4) +
      C(-26, 6, 10, "#D9B27C", "#94713F", 2) + C(-2, 10, 10, "#C79A5E", "#94713F", 2) + C(22, 6, 10, "#D9B27C", "#94713F", 2),
      { transform: "translate(242,116) rotate(42)", opacity: clamp(o, 0, 1) });
    if (at == null || t < at) return out;
    for (var k = 0; k < 7; k++) {
      var born = at + k * 0.16, ph = ((t - born) / 0.62) % 1;
      if (t < born || born + Math.floor((t - born) / 0.62) * 0.62 > until) continue;
      out += C(lerp(292, 336, ph) + (paRnd(k) - 0.5) * 14, lerp(152, PA_CUP.top + 18, ph * ph), 10,
        "#D9B27C", "#94713F", 2, { opacity: Math.min(1, (1 - ph) * 5, ph * 9) });
    }
    return out;
  }
  /* two rows of grains rolling past each other, each with a spoke that turns */
  function paGrainZoom(t, at, o) {
    if (!(o > 0)) return "";
    var x0 = 690, x1 = 1078, yA = 218, yB = 282, r = 32, step = 68;
    var u = at == null ? 0 : Math.max(0, t - at) * 28;
    var out = el("clipPath", { id: "paRollClip" }, R(x0, yA - 48, x1 - x0, yB - yA + 96)), rows = "";
    var inner = paBall(0, 0, 7) + paBall(-15, 0, 7) + paBall(15, 0, 7) + paBall(0, -15, 7) + paBall(0, 15, 7);
    for (var k = -2; k < 8; k++) {
      var ox = (((u % step) + step) % step), a = u / r;
      rows += G(C(0, 0, r, "#D9B27C", "#94713F", 3) + inner,
        { transform: "translate(" + n2(x0 + 24 + k * step + ox) + "," + yA + ") rotate(" + n2(a * 57.3) + ")" });
      rows += G(C(0, 0, r, "#C79A5E", "#94713F", 3) + inner,
        { transform: "translate(" + n2(x0 + 24 + k * step - ox) + "," + yB + ") rotate(" + n2(-a * 57.3) + ")" });
    }
    out += G(rows, { "clip-path": "url(#paRollClip)" });
    out += MK.arrow(834, 150, 1014, 150, 1, P.gold, 7);
    out += MK.arrow(934, 350, 754, 350, 1, P.gold, 7);
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* a heap of one powder, with its name, and a little of it pouring in */
  /* A mound of one powder: the same mound for all three, filled with grains of
     that powder's own size, so salt, sugar and flour differ by their grain and
     not by how much of them there is. */
  function paHeapOf(cx, base, col, r, name, o, t, pourAt, scale) {
    if (!(o > 0)) return "";
    var sc0 = scale || 1, W = 124 * sc0, H = 86 * sc0, step = 2 * r + 1.5, out = "", k = 0;
    for (var y = base - r; y > base - H; y -= step * 0.8, k++) {
      var hw = W * (1 - (base - y) / H), n = Math.max(1, Math.floor((2 * hw) / step));
      for (var j = 0; j < n; j++)
        out += C(cx - (n - 1) * step / 2 + j * step + (k % 2 ? step * 0.22 : 0), y, r, col, "#8E8A7E", 1.6);
    }
    if (name) out += Tx(cx, base + 46, name, "lab big", "middle");
    if (pourAt != null && t >= pourAt) {
      for (var d = 0; d < 3; d++) {
        var ph = ((t - pourAt) / 0.62 + d * 0.33) % 1;
        out += C(cx + (paRnd(d + 5) - 0.5) * 20, lerp(base - H - 124, base - H - 10, ph), r, col, "#8E8A7E", 1.6,
          { opacity: Math.min(1, (1 - ph) * 3.5, ph * 7) });
      }
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function paPowdersChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPour = c(0, "pour"), cCup = c(0, "cup"), cShape = c(0, "shape"), cLiquid = c(0, "liquid");
    var cSolid = c(1, "solid"), cGrain = c(1, "grain"), cLens = c(1, "lens");
    var cKeeps = c(2, "keeps"), cInside = c(2, "inside"), cRows = c(2, "rows");
    var cNot = c(3, "not"), cGrains = c(3, "grains"), cRoll = c(3, "rolling");
    var cSalt = c(4, "salt"), cSugar = c(4, "sugar"), cFlour = c(4, "flour"), cPowders = c(4, "powders"), cPours = c(4, "pour");

    var cup = Math.max(paSpan(t, scene, 0, 2), paOnly(t, scene, 3)), zoom = paOnly(t, scene, 2), heaps = paOnly(t, scene, 4);
    var out = "";

    /* --- beats 1, 2 and 4: the cup of sand --- */
    if (cup > 0) {
      var g = "", fill = Math.max(on(t, cShape, 1.3), paFrom(t, scene, 1));
      g += paPour(t, cPour, cPour == null ? 0 : cPour + 1.9, paOnly(t, scene, 0));
      g += paCup(t, 1, fill, paOnly(t, scene, 3) * on(t, cGrains, 0.6), on(t, cGrain, 0.5) * paOnly(t, scene, 1),
        on(t, cCup, 0.4) * paOnly(t, scene, 0));
      if (paOnly(t, scene, 0) > 0.3) {
        var b0 = paOnly(t, scene, 0);
        g += MK.pill(341, 408, "it takes the cup's shape", on(t, cShape, 0.4) * b0, { size: 26, col: P.gold });
        g += MK.pic(880, 200, 132, "\u{1F4A7}", { opacity: on(t, cLiquid, 0.5) * b0 });
        g += MK.pill(880, 322, "it behaves like a liquid", on(t, cLiquid, 0.4) * b0, { size: 27 });
      }
      if (paOnly(t, scene, 1) > 0.3) {
        var b1 = paOnly(t, scene, 1);
        g += MK.pill(880, 130, "but sand is a solid", on(t, cSolid, 0.4) * b1, { size: 29, col: P.gold });
        g += MK.tick(1092, 130, 26, popIn(t, cSolid == null ? null : cSolid + 0.4, 0.4) * b1);
        var lens = on(t, cGrain, 0.8) * b1;
        if (lens > 0) g += MK.pic(lerp(760, 478, lens), lerp(150, PA_CUP.bot - 188, lens), 104, "\u{1F50D}", { opacity: lens });
        g += MK.glow(374, PA_CUP.bot - 91, 62, P.gold, 0.9 * on(t, cLens, 0.5) * b1);
        g += MK.leader(456, PA_CUP.bot - 166, 394, PA_CUP.bot - 104, on(t, cLens, 0.5) * b1, P.gold);
        g += MK.pill(880, 336, "one grain, through a lens", on(t, cLens, 0.4) * b1, { size: 26 });
      }
      if (paOnly(t, scene, 3) > 0.3) {
        var b3 = paOnly(t, scene, 3);
        g += paGrainZoom(t, cGrains, on(t, cGrains, 0.5) * b3);
        g += MK.pill(880, 92, "the grains roll", on(t, cGrains, 0.4) * b3, { size: 29, col: P.gold });
        /* stacked on one side, so the two rows plainly go opposite ways: the
           cup's row 1 slides right and row 2 slides left (paCupSand's off) */
        g += MK.arrow(462, PA_CUP.bot - 41, 560, PA_CUP.bot - 41, on(t, cGrains, 0.5) * b3, P.gold, 6);
        g += MK.arrow(560, PA_CUP.bot - 70, 462, PA_CUP.bot - 70, on(t, cGrains, 0.5) * b3, P.gold, 6);
        g += MK.pill(880, 408, "not the particles inside them", on(t, cNot, 0.4) * b3, { size: 25 });
      }
      out += G(g, { opacity: cup });
    }

    /* --- beat 3: one grain, magnified, with the lesson's box inside it --- */
    if (zoom > 0) {
      var z = "", gx = 300, gy = 214, box = { x: 640, y: 50, w: 480, h: 330 };
      var gp = "M" + n2(gx - 118) + "," + n2(gy - 46) + " L" + n2(gx - 62) + "," + n2(gy - 122) +
        " L" + n2(gx + 54) + "," + n2(gy - 118) + " L" + n2(gx + 124) + "," + n2(gy - 22) +
        " L" + n2(gx + 82) + "," + n2(gy + 104) + " L" + n2(gx - 58) + "," + n2(gy + 118) + " Z";
      z += C(gx, gy, 170, P.card, P.line, 3);
      z += Pth(gp, "#D9B27C", "#94713F", 4);
      z += G(Pth(gp, "none", P.gold, 6, { "stroke-dasharray": "15 11" }),
        { transform: around(gx, gy, 1.09), opacity: on(t, cKeeps, 0.6) });
      z += MK.pill(300, 408, "one grain, a tiny solid", on(t, cKeeps, 0.4), { size: 26, col: P.gold });
      var ins = on(t, cInside, 0.5);
      if (ins > 0) {
        z += paBoxCard(box, ins);
        z += G(paBoxAt(box, 0, paJig(t, 1.15), 0), { opacity: ins });
        z += MK.leader(478, 200, 622, 200, on(t, cInside, 0.8), P.gold);
        z += G(paRowLines(box, t, cRows, 0), { opacity: 1 });
      }
      out += G(z, { opacity: zoom });
    }

    /* --- beat 5: salt, sugar and flour --- */
    if (heaps > 0) {
      var h = "";
      h += MK.pill(584, 70, "powders", on(t, cPowders, 0.4), { size: 34, col: P.gold });
      var pAt = cPours == null ? null : cPours + 0.1;
      h += paHeapOf(250, 318, "#F2F1EC", 12, "salt", popIn(t, cSalt, 0.4), t, pAt);
      h += paHeapOf(584, 318, "#FBF4DC", 16, "sugar", popIn(t, cSugar, 0.4), t, pAt);
      h += paHeapOf(918, 318, "#F0E6D2", 7, "flour", popIn(t, cFlour, 0.4), t, pAt);
      h += MK.pill(584, 408, "solids that pour", on(t, cPours, 0.4), { size: 30, col: P.gold });
      out += G(h, { opacity: heaps });
    }
    return svg(out);
  }

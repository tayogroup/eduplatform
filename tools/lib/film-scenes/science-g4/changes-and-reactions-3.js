  /* ==== Changes and Reactions, part 3: Can it be undone?, Plan to stay safe,
     and the recap ==============================================================
     tools/lib/film-scenes/science-g4/changes-and-reactions-3.js.

     "Can it be undone?" is the lesson's own change sorter, with the lesson's
     own bins (Physical change, Chemical reaction) and four of its own items.
     Each item lands under the mark its sentence earns and no other: chocolate
     and salt get the two-headed arrow, wood and a cake get the one-way arrow
     with the return struck out. */

  var CR_BIN = { y: 118, h: 300, w: 490, left: 70, right: 608 };
  function crBinX(b) { return b ? CR_BIN.right : CR_BIN.left; }
  function crSlotX(b, s) { return crBinX(b) + (s ? 362 : 128); }
  var CR_ITEM_Y = CR_BIN.y + 134, CR_LABEL_Y = CR_BIN.y + 198, CR_MARK_Y = CR_BIN.y + 246;

  function crBinCard(b, title, pic, o, lit) {
    if (!(o > 0)) return "";
    var x = crBinX(b);
    return G(R(x, CR_BIN.y, CR_BIN.w, CR_BIN.h, 22, lit > 0.5 ? "#16354A" : P.card, lit > 0.5 ? P.teal : P.line, lit > 0.5 ? 3 : 2) +
      MK.pic(x + 54, CR_BIN.y + 46, 46, pic) +
      Tx(x + 94, CR_BIN.y + 58, title, "lab big", "start"), { opacity: clamp(o, 0, 1) });
  }

  /* one item of the sorter: it appears at the top, travels to its bin, and the
     mark it earns is drawn under it */
  function crSortItem(t, it, scene) {
    var app = popIn(t, it.appear, 0.45);
    if (!(app > 0)) return "";
    var u = on(t, it.travel, 0.8);
    var sx = 584, sy = 76, tx = crSlotX(it.bin, it.slot), ty = CR_ITEM_Y;
    var x = lerp(sx, tx, u), y = lerp(sy, ty, u), size = lerp(98, 84, u);
    var out = MK.pop(MK.pic(x, y, size, it.pic), x, y, Math.min(app, 1.1));
    if (u > 0.55) {
      var lo = clamp((u - 0.55) / 0.45, 0, 1);
      out += Tx(tx, CR_LABEL_Y, it.label, "lab", "middle", { opacity: lo });
    }
    if (u >= 1) {
      var land = on(t, it.land, 0.6);
      if (it.kind === "back") out += crWayBack(tx, CR_MARK_Y, 62, land, P.good);
      else out += crNoWayBack(tx, CR_MARK_Y, 62, land, on(t, it.land == null ? null : it.land + 0.28, 0.5));
    }
    return out;
  }

  function crUndoneChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTest = c(0, "test"), cBack = c(0, "back");
    var items = [
      { pic: "\u{1F36B}", label: "chocolate melting", bin: 0, slot: 0, kind: "back",
        appear: c(1, "melt"), travel: c(1, "sets"), land: c(1, "still") },
      { pic: "\u{1F9C2}", label: "salt dissolving", bin: 0, slot: 1, kind: "back",
        appear: c(2, "dissolve"), travel: c(2, "dry"), land: c(2, "left") },
      { pic: "\u{1F525}", label: "wood burning", bin: 1, slot: 0, kind: "noback",
        appear: c(3, "burn"), travel: c(3, "ash"), land: c(3, "never") },
      { pic: "\u{1F382}", label: "a cake baking", bin: 1, slot: 1, kind: "noback",
        appear: c(4, "bake"), travel: c(4, "unbake"), land: c(4, "newsub") }
    ];
    var bins = popIn(t, cTest, 0.5);
    var litL = items[0].land != null && t >= items[0].land ? 1 : 0;
    var litR = items[2].land != null && t >= items[2].land ? 1 : 0;
    var out = crBinCard(0, "Physical change", "\u{1F504}", bins, litL) +
      crBinCard(1, "Chemical reaction", "\u{1F195}", bins, litR);
    out += MK.bubble(264, 16, 640, 80, "Can you get the same substance back?",
      on(t, cBack, 0.5) * crOnly(t, scene, 0), null, null);
    for (var k = 0; k < items.length; k++) out += crSortItem(t, items[k], scene);
    return svg(out);
  }

  /* ==== chapter: Plan to stay safe ==============================================
     The lesson's risk planner as a table: a risk on the left, the plan that
     removes it on the right. Every risk and every plan is one the lesson names. */
  var CR_ROW_Y = [158, 246, 334];

  function crSafeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSpray = c(0, "spray"), cSmash = c(0, "smash"), cBurn = c(0, "burn");
    var cRisk = c(1, "risk"), cPlan = c(1, "plan");
    var cGoggles = c(2, "goggles"), cTray = c(2, "tray"), cHands = c(2, "hands");
    var cGrown = c(3, "grownup"), cTaste = c(3, "taste");

    var risks = [
      { at: cSpray, pic: "\u{1F4A5}", text: "fizz can spray" },
      /* the lesson pictures this risk with ART.ICONS.glass, which is a PANE of
         glass; beside "beakers can smash" it reads as a window, so the film
         draws the beaker it is talking about (see the report on lesson-7.py) */
      { at: cSmash, pic: function (cx, cy) { return crCardBeaker(cx, cy, 62); }, text: "beakers can smash" },
      { at: cBurn, pic: "\u{1F525}", text: "pans burn" }
    ];
    var plans = [
      { at: cGoggles, picAt: cGoggles, pic: "\u{1F97D}", text: "goggles on" },
      { at: cHands, picAt: cTray, pic: "\u{1F6B6}\u{1F3FE}", text: "a tray, two hands" },
      { at: cGrown, picAt: cGrown, pic: "\u{1F9D1}\u{1F3FE}‍\u{1F373}", text: "a grown-up" }
    ];
    var out = "";
    /* the two column headings */
    var rh = on(t, cRisk, 0.5), ph = on(t, cPlan, 0.5);
    out += Tx(168, 92, "Risk", "lab big caps", "start", { opacity: 0.4 + 0.6 * rh, fill: P.bad });
    out += Tx(700, 92, "Plan", "lab big caps", "start", { opacity: 0.4 + 0.6 * ph, fill: P.good });
    out += L(168, 108, 480, 108, P.bad, 3, { opacity: rh });
    out += L(700, 108, 1010, 108, P.good, 3, { opacity: ph });

    for (var k = 0; k < 3; k++) {
      var y = CR_ROW_Y[k], r = risks[k], p = plans[k];
      var ro = popIn(t, r.at, 0.45);
      if (ro > 0) {
        var rp = typeof r.pic === "function" ? r.pic(176, y) : MK.pic(176, y, 60, r.pic);
        out += MK.pop(rp, 176, y, Math.min(ro, 1.1));
        out += Tx(230, y + 10, r.text, "lab big", "start", { opacity: Math.min(1, ro) });
      }
      out += MK.arrow(520, y, 640, y, on(t, cPlan == null ? null : cPlan + k * 0.14, 0.5), P.muted, 7);
      var po = popIn(t, p.picAt, 0.45);
      if (po > 0) out += MK.pop(MK.pic(706, y, 60, p.pic), 706, y, Math.min(po, 1.1));
      var to = on(t, p.at, 0.4);
      if (to > 0) out += Tx(760, y + 10, p.text, "lab big", "start", { opacity: to, fill: P.good });
      out += MK.tick(1118, y, 20, popIn(t, p.at == null ? null : p.at + 0.3, 0.4));
    }

    /* the rule that covers everything else */
    var ta = on(t, cTaste, 0.5);
    if (ta > 0) {
      out += MK.pill(608, 410, "never, ever taste anything", ta, { size: 28, col: P.bad });
      out += MK.pop(Em(344, 408, 46, "\u{1F6AB}"), 344, 408, popIn(t, cTaste, 0.35));
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------
     The mixing card carries a beaker of sand and water, the thing the Mixing
     chapter is about. It is drawn here rather than lifted from the lesson kit:
     the kit's beaker is outlined in #3A3A3A for its own light card, which is
     invisible on the dark card of the recap (tried, and it read as a blue
     square). The chapter itself still shows the lesson's own drawing. */
  function crCardBeaker(cx, cy, size) {
    var w = size * 0.74, h = size * 0.94, x0 = cx - w / 2, y0 = cy - h / 2, r = w * 0.13;
    return Pth("M" + n2(x0) + "," + n2(y0) + " v" + n2(h - r) + " q0," + n2(r) + " " + n2(r) + "," + n2(r) +
        " h" + n2(w - 2 * r) + " q" + n2(r) + ",0 " + n2(r) + "," + n2(-r) + " v" + n2(-(h - r)),
        null, "#CBD8E4", Math.max(2.5, size * 0.055)) +
      R(x0 + 4, y0 + h * 0.42, w - 8, h * 0.44, 3, "#3B7FD1", null, null, { opacity: 0.85 }) +
      R(x0 + 4, y0 + h * 0.78, w - 8, h * 0.11, 3, "#C9A26B");
  }

  var CR_RECAP = MK.recapKind([
    { beat: 0, at: "melt", title: "Melting and freezing", sub: "the particles rearrange; nothing new",
      pic: function (cx, cy, size) { return crIce(cx - size * 0.42, cy - size * 0.06, size * 0.7, 1) + crDrop(cx + size * 0.46, cy + size * 0.3, size * 0.26, 1); } },
    { beat: 1, at: "mixing", title: "Mixing", sub: "both substances keep themselves",
      pic: function (cx, cy, size) { return crCardBeaker(cx, cy, size); } },
    { beat: 2, at: "reaction", title: "Chemical reaction", sub: "new substances, and no way back", pic: "\u{1F9EA}" },
    { beat: 3, at: "goggles", title: "Stay safe", sub: "goggles on before you pour", pic: "\u{1F97D}" }
  ], { goBeat: 3, goAt: "goggles" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Melting and freezing, particle by particle", "A mixture, and a chemical reaction", "Spot the risk, and plan to stay safe"] }),
    melting: crMeltChapter, freezing: crFreezeChapter, mixing: crMixChapter,
    reaction: crReactChapter, undone: crUndoneChapter, safe: crSafeChapter, recap: CR_RECAP
  };

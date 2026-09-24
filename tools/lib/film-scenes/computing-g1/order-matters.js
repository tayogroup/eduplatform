  /* ==== Grade 1 Computing, Lesson 2: Order Matters ============================
     tools/lib/film-scenes/computing-g1/order-matters.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/order-matters.json.

     THE ORDER IS THE TEACHING. Every wrong order in this film is drawn by
     handing the LESSON'S OWN scene the wrong list - ART.scene("dress",
     ["shoes", "socks"]) and ART.scene("sandwich", ["bread", "butter", "top",
     "jam"]) - so the kit paints the socks over the shoes and the jam over the
     top slice and writes its own caption ("socks on the OUTSIDE of the
     shoes!", "the filling is on TOP of the sandwich!"). The film draws no
     picture of a mistake of its own anywhere.
     A step list is built across a beat with ids.slice(0, n), the same growing
     prefix the lesson's own paintScene uses.

     This file: the palette, the algorithm-list drawing every chapter shares,
     the two scene boxes, the title motif and the chapter "Socks and shoes".
     Every top-level name here starts with om, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, socks: P.gold, sandwich: P.accent, bug: P.plum,
    fix: P.good, change: P.blue, safe: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function omOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function omFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function omPast(t, at) { return at != null && t >= at; }

  /* ---- the steps, in the lesson's own words ----------------------------------- */

  /* The lesson's swatch("butter") is a colour block, not an emoji, so it is one
     here too; everything else is the emoji the lesson's own step carries. */
  function omPic(cx, cy, size, pic) {
    if (pic === "butter")
      return R(cx - size * 0.40, cy - size * 0.30, size * 0.80, size * 0.60, size * 0.15, "#F4C95D", "#D0A326", 2);
    return Em(cx, cy, size, pic);
  }

  var OM_STEP = {
    bread:  { pic: "\u{1F35E}", label: "bread on the plate" },
    butter: { pic: "butter",    label: "butter on the bread" },
    jam:    { pic: "\u{1F353}", label: "jam on the butter" },
    top:    { pic: "\u{1F96A}", label: "top slice on top" },
    milk:   { pic: "\u{1F95B}", label: "pour milk on the bread" },
    cheese: { pic: "\u{1F9C0}", label: "cheese on the butter" },
    banana: { pic: "\u{1F34C}", label: "banana on the butter" },
    cut:    { pic: "\u{1F52A}", label: "cut it in half" },
    socks:  { pic: "\u{1F9E6}", label: "put on socks" },
    shoes:  { pic: "\u{1F45F}", label: "put on shoes" }
  };

  /* One row of an algorithm: a number, the step's picture and its words.
     opt: {o, col (a border and number colour), fill, mark ("tick"|"cross"|
     "bug"), markP, dimmed} */
  function omRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = OM_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = Math.min(26, h * 0.30);
    var body = R(x, y, w, h, h * 0.26, opt.fill || P.cell, col, sw) +
      C(x + h * 0.50, y + h / 2, h * 0.26, P.card, col, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.11, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.32 }) +
      omPic(x + h * 1.18, y + h / 2, h * 0.50, st.pic) +
      Tx(x + h * 1.58, y + h / 2 + fs * 0.35, st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.42, my = y + h / 2, mr = h * 0.26, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 1.9, "\u{1F41B}"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.45 : 1) });
  }

  /* An empty slot, for "it has four steps" before any of them is read out. */
  function omSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.26, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.50, y + h / 2, h * 0.26, P.card, P.line, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.11, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.32 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the two boxes the lesson's own scenes are drawn in ---------------------- */

  var OM_DRESS = { x: 620, y: 14, w: 440, h: 412.5 };   /* the kit's dress scene is 320 x 300 */
  var OM_SAND = { x: 620, y: 34, w: 460, h: 345 };      /* and its sandwich scene 320 x 240 */
  function omDX(v) { return OM_DRESS.x + v * OM_DRESS.w / 320; }
  function omDY(v) { return OM_DRESS.y + v * OM_DRESS.h / 300; }
  function omSX(v) { return OM_SAND.x + v * OM_SAND.w / 320; }
  function omSY(v) { return OM_SAND.y + v * OM_SAND.h / 240; }
  function omDress(ids, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene("dress", ids), OM_DRESS.x, OM_DRESS.y, OM_DRESS.w, OM_DRESS.h) +
      R(OM_DRESS.x, OM_DRESS.y, OM_DRESS.w, OM_DRESS.h, 6, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }
  function omSandwich(ids, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene("sandwich", ids), OM_SAND.x, OM_SAND.y, OM_SAND.w, OM_SAND.h) +
      R(OM_SAND.x, OM_SAND.y, OM_SAND.w, OM_SAND.h, 6, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }
  /* the same drawing in a box of its own, for the two-up comparison */
  function omDressAt(ids, x, y, w, o) {
    if (!(o > 0)) return "";
    var h = w * 300 / 320;
    return G(ART.place(ART.scene("dress", ids), x, y, w, h) +
      R(x, y, w, h, 6, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }

  /* ---- the panel every teaching chapter shares -------------------------------- */

  var OM_PANEL = { x: 40, w: 520 };
  /* where the k-th of n rows sits, for rows h tall with gap between them */
  function omRowY(k, n, h, gap) { return (440 - n * h - (n - 1) * gap) / 2 + k * (h + gap); }

  /* ==== the title ===============================================================
     Two numbered tiles - a sock, then a shoe - and, under them, the same two
     tiles the other way round with a cross: the whole lesson in one picture.
     In the spoken title chapter each tile arrives as it is named, the arrow
     draws on "Same two steps", the second arrow on "a different order", and
     the cross lands on "a very silly outcome". On the two cards it stands
     still. */
  function omTile(x, y, s, n, pic, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s, s * 0.20, P.cell, col || P.line, 3) +
      C(x + s * 0.20, y + s * 0.20, s * 0.15, P.card, col || P.line, 2) +
      Tx(x + s * 0.20, y + s * 0.20 + s * 0.07, String(n), "lab", "middle", { fill: col || P.muted, "font-size": s * 0.20 }) +
      Em(x + s * 0.54, y + s * 0.60, s * 0.50, pic),
      { transform: around(x + s / 2, y + s / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSocks = sn ? sc(sn, 0, "socks") : null, cShoes = sn ? sc(sn, 0, "shoes") : null,
      cOther = sn ? sc(sn, 0, "other") : null, cSame = sn ? sc(sn, 1, "same") : null,
      cOrder = sn ? sc(sn, 1, "order") : null, cOut = sn ? sc(sn, 1, "outcome") : null;
    var pA = sn ? popIn(t, cSocks, 0.4) : 1, pB = sn ? popIn(t, cShoes, 0.4) : 1;
    var low = sn ? popIn(t, cOther, 0.45) : 1;
    var a1 = sn ? on(t, cSame, 0.5) : 1, a2 = sn ? on(t, cOrder, 0.5) : 1, x1 = sn ? popIn(t, cOut, 0.4) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the right order: socks, then shoes */
    out += MK.arrow(104, 64, 250, 64, a1, P.good, 7);
    out += omTile(44, 82, 124, 1, "\u{1F9E6}", pA, P.good);
    out += omTile(192, 82, 124, 2, "\u{1F45F}", pB, P.good);
    /* the other way round, smaller, with a cross */
    out += MK.arrow(88, 238, 192, 238, a2 * low, P.bad, 6);
    out += omTile(56, 252, 78, 1, "\u{1F45F}", low, P.bad);
    out += omTile(150, 252, 78, 2, "\u{1F9E6}", low, P.bad);
    out += MK.cross(284, 291, 30, x1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Socks then shoes, and the same two steps the other way round">' + out + "</svg>";
  }

  /* ==== chapter: socks and shoes ==================================================
     The lesson's own demo. The two steps stand in a list on the left and the
     lesson's dress scene is built from that list on the right: follow the list
     and Sami is dressed; swap the two rows and the kit itself paints the socks
     over the shoes and says so. The last beat sets the two outcomes side by
     side - both drawn by the kit, from the two orders. */
  var OM_SOCK_ROW = { h: 104, gap: 64 };
  function omSocksRowY(slot) { return 150 + slot * (OM_SOCK_ROW.h + OM_SOCK_ROW.gap); }

  function omSocksMain(scene, t) {
    var cSami = sc(scene, 0, "sami"), cTwo = sc(scene, 0, "two"),
      cSocks = sc(scene, 0, "socks"), cShoes = sc(scene, 0, "shoes");
    var cFollow = sc(scene, 1, "follow"), cReady = sc(scene, 1, "ready");
    var cSwap = sc(scene, 2, "swap"), cFirst = sc(scene, 2, "first"), cSocks2 = sc(scene, 2, "socks");
    var cOhno = sc(scene, 3, "ohno"), cOutside = sc(scene, 3, "outside");
    var out = "";

    /* which order the list is in, and how much of it the scene has been given */
    var sw = on(t, cSwap, 0.65);
    var swapped = omPast(t, cSwap);
    var order = swapped ? ["shoes", "socks"] : ["socks", "shoes"];
    var built = 0;
    if (swapped) built = omPast(t, cSocks2) ? 2 : omPast(t, cFirst) ? 1 : 0;
    else if (omPast(t, cFollow)) built = tally(t, cFollow, 2, 0.8);

    /* the lesson's scene, built from exactly that list */
    out += omDress(order.slice(0, built), on(t, cSami, 0.5));

    /* the list: each row slides to its new slot as the two are swapped, and
       ticks as the lesson's scene takes it on */
    out += MK.pill(48, 96, "Algorithm", on(t, cTwo, 0.45), { size: 24, anchor: "start", col: P.gold, ink: P.gold });
    ["socks", "shoes"].forEach(function (id, k) {
      var o = on(t, k === 0 ? cSocks : cShoes, 0.45);
      if (o <= 0) return;
      var slot = lerp(k, 1 - k, sw), y = omSocksRowY(slot), n = sw >= 0.5 ? 2 - k : k + 1;
      /* when this step is actually done: following the list, or after the swap */
      var doneAt = swapped ? (order[0] === id ? cFirst : cSocks2)
        : (cFollow == null ? null : cFollow + (id === "socks" ? 0 : 0.45));
      var live = built > 0 && order[built - 1] === id;
      out += omRow(OM_PANEL.x, y, OM_PANEL.w, OM_SOCK_ROW.h, n, id,
        { o: o, col: live ? P.gold : null,
          mark: !swapped && omPast(t, doneAt) ? "tick" : null, markP: popIn(t, doneAt, 0.35) });
      out += MK.ripple(OM_PANEL.x + 52, y + OM_SOCK_ROW.h / 2, t, doneAt, P.gold);
    });

    /* ready to go: the whole dressed child is right */
    var rd = popIn(t, cReady, 0.4) * (1 - on(t, cSwap, 0.4));
    out += MK.tick(1016, 62, 30, rd);
    /* oh no: the kit has already drawn and captioned the socks over the shoes */
    out += MK.cross(1016, 62, 30, popIn(t, cOhno, 0.4));
    var os = on(t, cOutside, 0.5);
    if (os > 0) out += E(omDX(160), omDY(246), 64 + 4 * breathe(t), 36 + 3 * breathe(t), "none", P.bad, 5, { opacity: os });
    return out;
  }

  /* the last beat: the same two steps, the two orders, the two outcomes, each
     outcome drawn by the lesson from its own list */
  var OM_CMP = [
    { cx: 300, ids: ["socks", "shoes"], col: P.good },
    { cx: 860, ids: ["shoes", "socks"], col: P.bad }
  ];
  function omSocksCompare(scene, t) {
    var cSame = sc(scene, 4, "same"), cOrder = sc(scene, 4, "order"), cOutcome = sc(scene, 4, "outcome");
    var out = "", sw = on(t, cOrder, 0.6), p = popIn(t, cSame, 0.4);
    OM_CMP.forEach(function (c, side) {
      out += omDressAt(c.ids, c.cx - 170, 10, 340, 1);
      c.ids.forEach(function (id, k) {
        /* the right-hand pair swaps as "a different order" is said */
        var slot = side === 1 ? lerp(1 - k, k, sw) : k;
        out += omTile(c.cx - 86 + slot * 98, 338, 74, Math.round(slot) + 1, OM_STEP[id].pic, p, c.col);
      });
    });
    out += MK.tick(440, 44, 26, popIn(t, cOutcome, 0.4));
    out += MK.cross(1000, 44, 26, popIn(t, cOutcome == null ? null : cOutcome + 0.35, 0.4));
    return out;
  }

  function omSocksChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(omSocksMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(omSocksCompare(scene, t), { opacity: u });
    return svg(out);
  }

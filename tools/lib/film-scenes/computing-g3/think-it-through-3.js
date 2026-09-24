  /* ==== Think It Through, part 3: dividing the task ============================
     The chapters "Divide the task" and "Easier to follow, easier to edit".
     Both draw the lesson's own ten steps of getting ready for school and its
     own four sections - wash, dress, breakfast, bag - so the counts the voice
     says (ten steps, four sections, three in wash) are the number of things
     actually drawn. The ten chips are ONE set of objects: in the first chapter
     they stand in a single long list and fly into their sections, and in the
     second they are already sitting in them. */

  var TI_TASK = [
    { id: "teeth",  pic: "\u{1F9B7}", label: "brush your teeth", bin: "wash" },
    { id: "shirt",  pic: "\u{1F455}", label: "put on your shirt", bin: "dress" },
    { id: "cereal", pic: "\u{1F33E}", label: "pour the cereal", bin: "breakfast" },
    { id: "book",   pic: "\u{1F4DA}", label: "pack your book", bin: "bag" },
    { id: "face",   pic: "\u{1F9FC}", label: "wash your face", bin: "wash" },
    { id: "shoes",  pic: "\u{1F45F}", label: "put on your shoes", bin: "dress" },
    { id: "milk",   pic: "\u{1F95B}", label: "pour on the milk", bin: "breakfast" },
    { id: "lunch",  pic: "\u{1F371}", label: "pack your lunch", bin: "bag" },
    /* the lesson's own picture for this step is a lotion bottle; a film may not
       put a bottle beside "brush your hair" (rule 8), so it draws the brushing */
    { id: "hair",   pic: "\u{1F487}", label: "brush your hair", bin: "wash" },
    { id: "socks",  pic: "\u{1F9E6}", label: "put on socks", bin: "dress" }
  ];
  var TI_BIN = [
    { id: "wash", label: "Wash", pic: "\u{1F9FC}" },
    { id: "dress", label: "Dress", pic: "\u{1F455}" },
    { id: "breakfast", label: "Breakfast", pic: "\u{1F963}" },
    { id: "bag", label: "Bag", pic: "\u{1F392}" }
  ];
  /* which section each step belongs to, and where it sits inside it */
  var TI_IN = {};
  TI_BIN.forEach(function (b) { TI_IN[b.id] = TI_TASK.filter(function (s) { return s.bin === b.id; }); });
  function tiSlotOf(item) { return TI_IN[item.bin].indexOf(item); }

  /* one step, as a chip: the same object in the long list and in its section */
  function tiChip(x, y, w, h, item, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var col = opt.col || P.line;
    return G(R(x, y, w, h, h * 0.34, opt.fill || P.cell, col, opt.col ? 3 : 1.6) +
      Em(x + h * 0.66, y + h / 2, h * 0.68, item.pic) +
      Tx(x + h * 1.18, y + h / 2 + 7, item.label, "lab mid", "start"),
      { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1) });
  }

  /* ---- chapter: divide the task ------------------------------------------------ */

  var TI_LONG = { x: 40, y: 60, w: 300, pitch: 34, h: 30 };
  var TI_BINBOX = { w: 330, h: 188, cols: [410, 772], rows: [22, 230] };
  function tiBinBox(k) {
    return { x: TI_BINBOX.cols[k % 2], y: TI_BINBOX.rows[Math.floor(k / 2)], w: TI_BINBOX.w, h: TI_BINBOX.h };
  }
  function tiBinChipAt(binIndex, slot) {
    var b = tiBinBox(binIndex);
    return { x: b.x + 15, y: b.y + 62 + slot * 42, w: 300, h: 36 };
  }

  function tiBinFrame(b, title, pic, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    return G(R(b.x, b.y, b.w, b.h, 20, P.card, opt.col || P.line, opt.col ? 4 : 2) +
      Em(b.x + 34, b.y + 34, 34, pic) +
      Tx(b.x + 62, b.y + 44, title, "lab big", "start") +
      (opt.tag ? Tx(b.x + b.w - 16, b.y + 42, opt.tag, "lab mid gold", "end") : ""),
      { transform: around(b.x + b.w / 2, b.y + b.h / 2, Math.min(1.05, o)), opacity: Math.min(1, o) });
  }

  function tiDivideChapter(scene, beat, t, i) {
    var cBig = sc(scene, 0, "big"), cTen = sc(scene, 0, "ten");
    var cFollow = sc(scene, 1, "follow"), cEdit = sc(scene, 1, "edit");
    var cDivide = sc(scene, 2, "divide");
    var binCue = [sc(scene, 2, "wash"), sc(scene, 2, "dress"), sc(scene, 2, "breakfast"), sc(scene, 2, "bag")];
    var cEvery = sc(scene, 3, "every"), cTeeth = sc(scene, 3, "teeth"), cShirt = sc(scene, 3, "shirt");
    var cFour = sc(scene, 4, "four"), cSub = sc(scene, 4, "subtask");
    var out = "";

    out += MK.pill(190, 28, "one big task", popIn(t, cBig, 0.45), { size: 24, col: P.plum, ink: P.plum });
    var shown = tally(t, cTen, 10, 1.3);

    /* the four sections */
    TI_BIN.forEach(function (b, k) {
      out += tiBinFrame(tiBinBox(k), b.label, b.pic, popIn(t, binCue[k], 0.4),
        { tag: popIn(t, cSub, 0.4) > 0.5 ? "sub-task" : null });
    });

    /* "Every step goes into one section": a gold ring round all four at once */
    var everyPulse = bump(t, cEvery, 1.0);
    if (everyPulse > 0.02) TI_BIN.forEach(function (b, k) {
      var box = tiBinBox(k);
      out += G(R(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 24, "none", P.gold, 4), { opacity: everyPulse });
    });

    /* the ten steps, each flying from the long list into its own section */
    var rank = 0;
    TI_TASK.forEach(function (item, k) {
      if (k >= shown) return;
      var flyAt = item.id === "teeth" ? cTeeth : item.id === "shirt" ? cShirt
        : (cFour == null ? null : cFour + rank * 0.17);
      if (item.id !== "teeth" && item.id !== "shirt") rank++;
      var u = on(t, flyAt, 0.55);
      var from = { x: TI_LONG.x, y: TI_LONG.y + k * TI_LONG.pitch, w: TI_LONG.w, h: TI_LONG.h };
      var binIndex = TI_BIN.map(function (b) { return b.id; }).indexOf(item.bin);
      var to = tiBinChipAt(binIndex, tiSlotOf(item));
      out += tiChip(lerp(from.x, to.x, u), lerp(from.y, to.y, u), lerp(from.w, to.w, u), lerp(from.h, to.h, u),
        item, 1, { col: u > 0 && u < 1 ? P.gold : null });
    });

    /* one long list is hard to follow, and hard to edit */
    var fade = 1 - on(t, cDivide, 0.4);
    out += MK.qmark(640, 150, 48, on(t, cFollow, 0.5) * fade);
    var ed = popIn(t, cEdit, 0.45) * fade;
    out += MK.pop(Em(624, 300, 62, "✏️"), 624, 300, ed);
    out += MK.cross(686, 268, 24, ed);
    return svg(out);
  }

  /* ---- chapter: easier to follow, easier to edit ------------------------------
     The same four sections, side by side and already full, so that one change
     to one of them can be seen leaving the other three alone. */

  var TI_ROWBOX = { y: 48, w: 272, h: 344, xs: [24, 308, 592, 876] };
  var TI_TOAST = {
    cereal: { id: "toast", pic: "\u{1F35E}", label: "make the toast", bin: "breakfast" },
    milk: { id: "butter", pic: "\u{1F9C8}", label: "butter the toast", bin: "breakfast" }
  };

  function tiEditChapter(scene, beat, t, i) {
    var cFollow = sc(scene, 0, "follow"), cShort = sc(scene, 0, "short"), cWhere = sc(scene, 0, "where");
    var cEdit = sc(scene, 1, "edit"), cToast = sc(scene, 1, "toast");
    var cNochange = sc(scene, 2, "nochange"), cStays = sc(scene, 2, "stays");
    var cLate = sc(scene, 3, "late"), cWhich = sc(scene, 3, "which");
    var out = "", shown = tally(t, cFollow, 4, 0.7);
    var clear = 1 - on(t, cLate, 0.5);      /* the ticks and the ring make way for the search */
    var swapped = on(t, cToast, 0.5);

    TI_BIN.forEach(function (b, k) {
      if (k >= shown) return;
      var box = { x: TI_ROWBOX.xs[k], y: TI_ROWBOX.y, w: TI_ROWBOX.w, h: TI_ROWBOX.h };
      var mine = TI_IN[b.id];
      var ring = b.id === "breakfast" ? on(t, cStays, 0.5) * clear : 0;
      out += tiBinFrame(box, b.label, b.pic, popIn(t, cFollow == null ? null : cFollow + k * 0.16, 0.4),
        { col: ring > 0.5 ? P.gold : null });
      /* how short each section is: below the heading and right-anchored, so
         "Breakfast" (nine letters, unlike Wash/Dress/Bag) never runs under it */
      out += MK.pill(box.x + box.w - 20, box.y + 86, String(mine.length) + " steps",
        popIn(t, cShort == null ? null : cShort + k * 0.1, 0.4), { size: 18, col: P.teal, ink: P.teal, anchor: "end" });
      mine.forEach(function (item, s) {
        var x = box.x + 14, y = box.y + 110 + s * 44;
        var alt = TI_TOAST[item.id];
        if (alt && swapped > 0) {
          out += tiChip(x, y, 244, 36, item, 1 - swapped);
          out += tiChip(x, y, 244, 36, alt, swapped, { col: P.gold });
        } else out += tiChip(x, y, 244, 36, item, 1);
      });
      /* the three sections a breakfast change does not touch */
      if (b.id !== "breakfast")
        out += MK.tick(box.x + box.w - 26, box.y + box.h - 24, 22,
          popIn(t, cNochange == null ? null : cNochange + k * 0.18, 0.4) * clear);
      /* one section at a time, and you know which one you are in */
      var here = bump(t, cWhere == null ? null : cWhere - 0.9 + k * 0.42, 1.1);
      if (here > 0.02) out += G(R(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 24, "none", P.good, 4),
        { opacity: here * clear });
    });
    out += MK.pop(Em(624, 27, 40, "✏️"), 624, 27, popIn(t, cEdit, 0.45) * clear);
    out += MK.pop(Em(880, 27, 38, "\u{1F9D2}"), 880, 27, popIn(t, cWhere, 0.45) * clear);

    /* if you are late, which section took too long? */
    var late = popIn(t, cLate, 0.45);
    out += MK.pop(Em(96, 27, 40, "⏰"), 96, 27, late);
    var look = on(t, cWhich, 0.4);
    if (look > 0) {
      var u = clamp((t - cWhich) / 2.0, 0, 1), gx = lerp(160, 1012, ease(u));
      out += G(Em(gx, 403, 50, "\u{1F50D}") + MK.qmark(gx, 350, 26, 1), { opacity: look });
    }
    return svg(out);
  }

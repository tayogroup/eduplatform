  /* ==== Grade 4 Computing, Lesson 3: Sub-routines ==============================
     tools/lib/film-scenes/computing-g4/sub-routines.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/sub-routines.json.

     THE EXPANSION IS THE KIT'S. This lesson's claim is that a named sub-routine
     does the SAME thing as the steps it stands for, so the film must not do
     that arithmetic itself. SR_FLAT is ART.algo.subExpand(SR_MAIN, SR_SUBS) -
     the lesson's own subExpand, the one computing.js marks "mirrored in
     _rules.py" - and the ribbon of finished steps in "Following a call" is
     drawn from it, item by item, in its order. The five-line main algorithm and
     the steps it ends up doing therefore end in the same place by construction.
     A load-time check below refuses the page if that expansion is not the shape
     this film draws, so a changed rule stops the render instead of drawing a
     wrong picture.

     Nothing here is spoken as a COUNT. The lesson's own "Five lines, and behind
     them twenty steps" does not match the steps the lesson lists, so the film
     shows the steps and says "every step in the parts" instead of a number.

     This file: the palette, the lesson's own algorithms, the row and box
     drawings every chapter shares, and the title motif. Every top-level name
     here starts with sr, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, decompose: P.gold, main: P.accent, follow: P.plum,
    reuse: P.good, once: P.blue, recap: P.teal
  };

  /* ---- the lesson's own steps, words and pictures -----------------------------
     Every label and every emoji is the one lesson-3.py carries, so the child
     watches the picture they tap two steps later. (Two of them are the lesson's
     own odd choices - a lotion bottle for "Brush your hair", a necktie for
     "Put on pyjamas" - and are reported rather than quietly swapped; the
     pyjamas row is drawn with no picture at all, since a necktie beside those
     words would say the wrong thing.) */
  var SR_SUBS = {
    WASH: [
      { id: "face", label: "Wash your face", pic: "\u{1F9FC}" },
      { id: "teeth", label: "Brush your teeth", pic: "\u{1F9B7}" },
      { id: "hair", label: "Brush your hair", pic: "\u{1F9F4}" }
    ],
    DRESS: [
      { id: "shirt", label: "Shirt on", pic: "\u{1F455}" },
      { id: "trousers", label: "Trousers on", pic: "\u{1F456}" },
      { id: "socks", label: "Socks on", pic: "\u{1F9E6}" },
      { id: "shoes", label: "Shoes on", pic: "\u{1F45F}" }
    ],
    BREAKFAST: [
      { id: "bowl", label: "Get the bowl", pic: "\u{1F963}" },
      { id: "cereal", label: "Pour the cereal", pic: "\u{1F33E}" },
      { id: "milk", label: "Pour on the milk", pic: "\u{1F95B}" }
    ],
    BAG: [
      { id: "books", label: "Pack your books", pic: "\u{1F4DA}" },
      { id: "lunch", label: "Pack your lunch", pic: "\u{1F371}" },
      { id: "coat", label: "Get your coat", pic: "\u{1F9E5}" }
    ],
    STORY: [
      { id: "book", label: "Choose a book", pic: "\u{1F4D6}" },
      { id: "read", label: "Read one chapter", pic: "\u{1F4D6}" },
      { id: "mark", label: "Bookmark in", pic: "\u{1F516}" }
    ]
  };
  var SR_ORDER = ["WASH", "DRESS", "BREAKFAST", "BAG"];
  var SR_BIN = { WASH: "\u{1F9FC}", DRESS: "\u{1F455}", BREAKFAST: "\u{1F963}", BAG: "\u{1F392}" };

  var SR_MAIN = [
    { kind: "call", sub: "WASH" }, { kind: "call", sub: "DRESS" },
    { kind: "call", sub: "BREAKFAST" }, { kind: "call", sub: "BAG" },
    { id: "leave", label: "Leave the house", pic: "\u{1F6AA}" }
  ];
  var SR_BED = [
    { id: "pyjamas", label: "Put on pyjamas", pic: null },
    { kind: "call", sub: "WASH" }, { kind: "call", sub: "STORY" },
    { id: "lights", label: "Lights off", pic: "\u{1F4A1}" }
  ];
  /* the step the "Change it in one place" chapter adds to WASH */
  var SR_FLOSS = { id: "floss", label: "Floss", pic: null, added: true };

  /* ---- the kit's own expansion ------------------------------------------------
     What the five-line main algorithm actually does, worked out by the lesson's
     subExpand rather than by this film. The check refuses the page if it is not
     four calls, every sub-routine's steps in order, and Leave the house last. */
  var SR_FLAT = ART.algo.subExpand(SR_MAIN, SR_SUBS);
  var SR_ISCALL = function (s) { return String(s.id).slice(0, 5) === "call:"; };
  var SR_STEPS = SR_FLAT.filter(function (s) { return !SR_ISCALL(s); });
  (function () {
    var want = 1;
    SR_ORDER.forEach(function (n) { want += SR_SUBS[n].length; });
    if (SR_FLAT.length - SR_STEPS.length !== SR_ORDER.length || SR_STEPS.length !== want ||
        SR_STEPS[SR_STEPS.length - 1].id !== "leave")
      throw new Error("sub-routines: ART.algo.subExpand no longer opens the main algorithm out the way this film draws it");
  })();
  /* how many of SR_STEPS belong to the sub-routines before this one */
  function srBefore(name) {
    var n = 0;
    for (var k = 0; k < SR_ORDER.length && SR_ORDER[k] !== name; k++) n += SR_SUBS[SR_ORDER[k]].length;
    return n;
  }

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, back to 0 as beat k + 1 comes in */
  function srOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on */
  function srFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  function srPast(t, at) { return at != null && t >= at; }

  /* ---- one line of an algorithm ------------------------------------------------
     A call line carries the lesson's own parcel and reads "do NAME"; every other
     line carries its own picture and its own words.
     opt: {n, o, fs, col, fill, mark, markP, faded} */
  function srLabel(item) { return item.kind === "call" ? "do " + item.sub : item.label; }
  function srPicOf(item) { return item.kind === "call" ? "\u{1F4E6}" : item.pic; }

  function srRow(x, y, w, h, item, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var call = item.kind === "call";
    var col = opt.col || (call ? P.gold : P.line), sw = opt.col ? 3.5 : call ? 3 : 2;
    var fs = opt.fs || Math.min(22, h * 0.44);
    var body = R(x, y, w, h, h * 0.28, opt.fill || (call ? "#1B3A52" : P.cell), col, sw);
    var px = x + h * 0.52;
    if (opt.n != null) {
      body += C(x + h * 0.52, y + h / 2, h * 0.27, P.card, col, 2) +
        Tx(x + h * 0.52, y + h / 2 + h * 0.12, String(opt.n), "lab", "middle",
          { fill: call ? P.gold : P.muted, "font-size": h * 0.34 });
      px = x + h * 1.16;
    }
    var pc = srPicOf(item);
    if (pc) body += Em(px, y + h / 2, h * 0.54, pc);
    body += Tx(px + (pc ? h * 0.42 : -h * 0.30), y + h / 2 + fs * 0.35, srLabel(item), "lab", "start",
      { "font-size": fs, fill: call ? P.gold : item.added ? P.good : P.ink });
    if (item.added) body += Tx(x + w - h * 0.34, y + h / 2 + fs * 0.38, "+", "lab", "middle",
      { "font-size": fs * 1.5, fill: P.good });
    var mx = x + w - h * 0.40, my = y + h / 2, mr = Math.min(h * 0.28, 18), p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.faded ? 0.42 : 1) });
  }

  /* ---- a panel of lines, with a name above it ---------------------------------
     opt: {o, fs, gap, title, titleCol, rows (how many lines are showing),
     rowOpt (k) -> the k-th line's opt} */
  function srPanel(x, y, w, h, items, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var gap = opt.gap == null ? 10 : opt.gap;
    var n = items.length, rh = (h - (n - 1) * gap) / n, out = "";
    if (opt.title) out += MK.pill(x, y - 24, opt.title, o, { size: 20, anchor: "start", col: opt.titleCol || P.line, ink: opt.titleCol || P.muted });
    items.forEach(function (item, k) {
      var ro = opt.rowOpt ? opt.rowOpt(k) : {};
      if (ro === null) return;
      out += srRow(x, y + k * (rh + gap), w, rh, item,
        Object.assign({ n: k + 1, fs: opt.fs }, ro));
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a sub-routine box ------------------------------------------------------
     The parcel and the NAME on a bar, and the sub-routine's own steps under it.
     opt: {o, col, done (how many steps are ticked), live (which step is lit),
     fs, steps (the list, so the floss chapter can add one), open (0 -> 1: the
     steps sliding out from under the bar)} */
  function srBox(x, y, w, h, name, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, steps = opt.steps || SR_SUBS[name] || [];
    var th = Math.min(46, h * 0.28), open = opt.open == null ? 1 : clamp(opt.open, 0, 1);
    var out = R(x, y, w, h, 18, P.card, col, opt.col ? 3.5 : 2) +
      R(x, y, w, th, 18, col, null, null, { opacity: 0.22 }) +
      Em(x + th * 0.62, y + th / 2, th * 0.56, "\u{1F4E6}") +
      Tx(x + th * 1.05, y + th / 2 + 8, name, "lab caps", "start", { "font-size": Math.min(24, th * 0.54), fill: col === P.line ? P.ink : col });
    if (open > 0 && steps.length) {
      var gap = 7, top = y + th + 10, rh = (h - th - 20 - (steps.length - 1) * gap) / steps.length;
      steps.forEach(function (st, k) {
        var ro = { n: null, fs: opt.fs || Math.min(19, rh * 0.5), o: open };
        if (opt.done != null && k < opt.done) { ro.mark = "tick"; ro.markP = 1; }
        if (opt.live === k) { ro.col = P.gold; ro.fill = "#1B3A52"; }
        out += srRow(x + 12, top + k * (rh + gap), w - 24, rh, st, ro);
      });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ===============================================================
     The whole lesson in one picture: a short main algorithm on the left, and one
     of its lines jumping out into a named box of steps and back again. In the
     spoken title chapter the card arrives on "a big job", its lines on "named
     parts", the WASH box on "a sub-routine" and the two arrows on "with a name".
     On the two cards everything stands still. */
  var SR_MOTIF_MAIN = [SR_MAIN[0], SR_MAIN[1], SR_MAIN[4]];

  /* the motif's own little box: the parcel, the NAME and the three pictures, in
     a row. Words at this size would run out of the box, and the card behind the
     title and end cards is decoration rather than reading. */
  function srMotifBox(x, y, w, h) {
    var th = 32;
    var out = R(x, y, w, h, 16, P.card, P.gold, 3) + R(x, y, w, th, 16, P.gold, null, null, { opacity: 0.22 }) +
      Em(x + 22, y + th / 2, 20, "\u{1F4E6}") +
      Tx(x + 38, y + th / 2 + 6, "WASH", "lab caps", "start", { "font-size": 17, fill: P.gold });
    SR_SUBS.WASH.forEach(function (st, k) {
      out += Em(x + w * (0.22 + k * 0.28), y + th + (h - th) * 0.55, 34, st.pic);
    });
    return out;
  }

  /* The main algorithm above, the named box of steps below, and the jump out of
     line one and back into line two. The card is wide and the box sits under it,
     so no label can run into anything. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cBig = sn ? sc(sn, 0, "big") : null, cParts = sn ? sc(sn, 0, "parts") : null,
      cSub = sn ? sc(sn, 1, "sub") : null, cName = sn ? sc(sn, 1, "name") : null;
    var pCard = sn ? popIn(t, cBig, 0.45) : 1;
    var pBox = sn ? popIn(t, cParts, 0.45) : 1;
    var aOut = sn ? on(t, cSub, 0.5) : 1;
    var aBack = sn ? on(t, cName, 0.5) : 1;

    out += MK.pop(R(24, 16, 312, 172, 24, P.card, P.line, 3), 180, 102, pCard);
    SR_MOTIF_MAIN.forEach(function (item, k) {
      out += srRow(36, 30 + k * 52, 288, 44, item,
        { n: k + 1, fs: 19, o: Math.min(1, sn ? popIn(t, cBig == null ? null : cBig + 0.18 + k * 0.16, 0.4) : 1) });
    });
    out += MK.pop(srMotifBox(100, 236, 160, 108), 180, 290, pBox);
    out += MK.arrow(342, 52, 272, 244, aOut, P.gold, 7);
    out += MK.arrow(88, 244, 18, 108, aBack, P.good, 7);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A main algorithm whose first line jumps into a named box of steps and back">' + out + "</svg>";
  }

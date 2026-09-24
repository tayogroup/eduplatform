  /* ==== Grade 3 Computing, Lesson 2: Concise Algorithms ========================
     tools/lib/film-scenes/computing-g3/concise-algorithms.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/concise-algorithms.json.

     THE COMPARISON IS THE TEACHING, and a comparison is the easiest thing to
     draw misleadingly. Two rules hold this film to it:

       - every count the voice says is the number of rows actually drawn -
         ten and seven for the cake, nine and six for the present, eleven and
         five for the plants, eighteen and six for the table;
       - when the film says the short algorithm does the same job, the two end
         in the SAME PICTURE, drawn by the lesson's own scene from both lists.
         -2.js asserts that at load: ART.scene("cake", the ten) and
         ART.scene("cake", the seven) differ only in the aria-label the kit
         builds out of the ids, and the same for the present's nine and six.
         So the film never draws a "same" it has not checked.

     This file: the palette, the step table and the row every chapter's list is
     made of, the two boxes the lesson's own scenes sit in, the title motif and
     the chapter "Efficient means concise". Every top-level name here starts
     with ca, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, efficient: P.gold, cake: P.accent, present: P.plum,
    repeat: P.good, better: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function caPast(t, at) { return at != null && t >= at; }

  /* ---- the steps, in the lesson's own words ----------------------------------
     Five pictures are DRAWN rather than taken from an emoji, because the
     lesson's own emoji for them says a different thing from the lesson's own
     words: a shower head for "the watering can", scissors for "tape the paper
     down", a fork-and-knife for "a fork" AND again for "a plate", and one
     cup-with-straw for both the cup and the jug. Rule 8 - a picture must match
     what is said about it - so the film draws the object the words name. All of
     them are reported as faults in the lesson; none is fixed here. */
  function caPic(cx, cy, size, pic) {
    var s = size * 0.46;
    if (pic === "can")
      return G(Pth("M" + n2(cx + s * 0.4) + "," + n2(cy - s * 0.1) + " L" + n2(cx + s * 1.02) + "," + n2(cy - s * 0.58) +
          " L" + n2(cx + s * 1.1) + "," + n2(cy - s * 0.34) + " L" + n2(cx + s * 0.5) + "," + n2(cy + s * 0.16) + " Z", "#6E9DE8", "#3B6FB8", 2) +
        Pth("M" + n2(cx - s * 0.36) + "," + n2(cy - s * 0.3) + " q" + n2(s * 0.36) + "," + n2(-s * 0.62) + " " + n2(s * 0.72) + ",0", null, "#3B6FB8", Math.max(2, s * 0.16)) +
        R(cx - s * 0.6, cy - s * 0.3, s * 1.1, s * 0.86, s * 0.16, "#6E9DE8", "#3B6FB8", 2));
    if (pic === "plate")
      return C(cx, cy, s * 0.88, "#FFFDF6", "#C6D3DE", Math.max(2, s * 0.12)) +
        C(cx, cy, s * 0.58, "none", "#E3EAF0", Math.max(1.5, s * 0.08));
    if (pic === "tape")
      return G(R(cx - s * 0.78, cy - s * 0.3, s * 1.56, s * 0.6, s * 0.12, "#FFF8D0", "#E0D6A0", 2),
        { transform: "rotate(-14 " + n2(cx) + " " + n2(cy) + ")" });
    if (pic === "fork")
      return G(R(cx - s * 0.1, cy - s * 0.34, s * 0.2, s * 1.1, s * 0.09, "#C6D3DE") +
        Pth("M" + n2(cx - s * 0.34) + "," + n2(cy - s * 0.92) + " v" + n2(s * 0.42) +
          " q0," + n2(s * 0.2) + " " + n2(s * 0.34) + "," + n2(s * 0.2) +
          " q" + n2(s * 0.34) + ",0 " + n2(s * 0.34) + "," + n2(-s * 0.2) + " v" + n2(-s * 0.42), "#C6D3DE") +
        L(cx, cy - s * 0.92, cx, cy - s * 0.52, P.cell, Math.max(1.5, s * 0.1)));
    if (pic === "jug")
      return G(Pth("M" + n2(cx - s * 0.46) + "," + n2(cy - s * 0.52) + " L" + n2(cx + s * 0.44) + "," + n2(cy - s * 0.52) +
          " L" + n2(cx + s * 0.34) + "," + n2(cy + s * 0.62) + " L" + n2(cx - s * 0.36) + "," + n2(cy + s * 0.62) + " Z", "#BFE3F5", "#3B6FB8", 2) +
        Pth("M" + n2(cx - s * 0.46) + "," + n2(cy - s * 0.52) + " q" + n2(-s * 0.3) + "," + n2(-s * 0.04) + " " + n2(-s * 0.26) + "," + n2(s * 0.24), null, "#3B6FB8", Math.max(2, s * 0.14)) +
        Pth("M" + n2(cx + s * 0.42) + "," + n2(cy - s * 0.3) + " q" + n2(s * 0.4) + "," + n2(s * 0.22) + " 0," + n2(s * 0.5), null, "#3B6FB8", Math.max(2, s * 0.14)));
    return Em(cx, cy, size, pic);
  }

  var CA_STEP = {
    /* the door and the juice, from the lesson's "Long or concise?" step */
    door1:  { pic: "\u{1F6AA}", label: "Open the door" },
    door2:  { pic: "\u{1F6AA}", label: "Open the door" },
    walkin: { pic: "\u{1F6B6}", label: "Walk in" },
    cup:    { pic: "\u{1F964}", label: "Get a cup" },
    wave:   { pic: "\u{1F431}", label: "Wave at the cat" },
    juice:  { pic: "\u{1F9C3}", label: "Pour the juice" },
    /* baking a cake */
    bowl:   { pic: "\u{1F963}", label: "Get a big bowl" },
    flour:  { pic: "\u{1F33E}", label: "Flour and sugar" },
    phone:  { pic: "\u{1F4DE}", label: "Phone a friend" },
    eggs:   { pic: "\u{1F95A}", label: "Crack in two eggs" },
    mix:    { pic: "\u{1F944}", label: "Mix it all together" },
    mix2:   { pic: "\u{1F944}", label: "Mix it again" },
    hat:    { pic: "\u{1F3A9}", label: "Put on a funny hat" },
    tin:    { pic: "\u{1F958}", label: "Pour it into the tin" },
    oven:   { pic: "\u{1F525}", label: "Bake it in the oven" },
    cool:   { pic: "⏲️", label: "Let it cool" },
    /* wrapping a present for Nora */
    box:    { pic: "\u{1F9F8}", label: "Teddy in a box" },
    lid:    { pic: "\u{1F4E6}", label: "Put the lid on" },
    paper:  { pic: "\u{1F381}", label: "Wrap it in paper" },
    unwrap: { pic: "\u{1F440}", label: "Unwrap it to check" },
    paper2: { pic: "\u{1F381}", label: "Wrap it in paper again" },
    tape:   { pic: "tape",      label: "Tape the paper down" },
    ribbon: { pic: "\u{1F380}", label: "Tie a ribbon round it" },
    count:  { pic: "\u{1F522}", label: "Count to one hundred" },
    tag:    { pic: "\u{1F3F7}️", label: "Stick on a name tag" },
    /* watering three plants */
    can:    { pic: "can",       label: "Get the watering can" },
    fill:   { pic: "\u{1F4A7}", label: "Fill the can" },
    pour:   { pic: "\u{1F331}", label: "Pour on a plant" },
    walk:   { pic: "\u{1F6B6}", label: "Walk to the next plant" },
    away:   { pic: "\u{1F6AA}", label: "Put the can away" },
    /* laying the table for four */
    wipe:   { pic: "\u{1F9FD}", label: "Wipe the table" },
    plate:  { pic: "plate",     label: "Put down a plate" },
    fork:   { pic: "fork",      label: "Put a fork on the left" },
    knife:  { pic: "\u{1F52A}", label: "Put a knife on the right" },
    cup2:   { pic: "\u{1F964}", label: "Put a cup at the top" },
    jug:    { pic: "jug",       label: "Put the jug in the middle" }
  };

  /* One row of an algorithm: a number, the step's picture and its words.
     opt: {o, col (a border and number colour), fill, mark ("tick"|"cross"|
     "cut"), markP, dim} */
  function caRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = CA_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = clamp(h * 0.56, 19, 26);
    var body = R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, sw) +
      C(x + h * 0.52, y + h / 2, h * 0.28, P.card, col, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.13, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.38 }) +
      caPic(x + h * 1.26, y + h / 2, h * 0.58, st.pic) +
      Tx(x + h * 1.66, y + h / 2 + fs * 0.35, st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.44, my = y + h / 2, mr = h * 0.28, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "cut") body += MK.pop(Em(mx, my, mr * 2.0, "✂️"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1) });
  }

  /* an empty slot, for "it has ten steps" before any of them is read out */
  function caSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.30, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.52, y + h / 2, h * 0.28, P.card, P.line, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.13, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.38 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* the gold bracket that says "this run is written once", with its label
     beside it, outside the list's left edge */
  function caBracket(x, yTop, yBot, label, o, col) {
    if (!(o > 0)) return "";
    col = col || P.gold;
    var w = 16, mid = (yTop + yBot) / 2;
    return G(Pth("M" + n2(x) + "," + n2(yTop) + " h" + n2(-w) + " V" + n2(yBot) + " h" + n2(w), null, col, 5) +
      Tx(x - w - 12, mid - 6, label, "lab", "end", { fill: col, "font-size": 22 }) +
      Tx(x - w - 12, mid + 20, "written once", "lab mid muted", "end"),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the lesson's own scenes, in a box of the film's space ------------------ */

  /* the kit's cake and present scenes are 320 x 240 */
  var CA_SC = { x: 578, y: 14, w: 544, h: 408 };
  function caSX(v) { return CA_SC.x + v * CA_SC.w / 320; }
  function caSY(v) { return CA_SC.y + v * CA_SC.h / 240; }
  function caScene(name, ids, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene(name, ids), CA_SC.x, CA_SC.y, CA_SC.w, CA_SC.h) +
      R(CA_SC.x, CA_SC.y, CA_SC.w, CA_SC.h, 6, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }

  /* ---- the title motif -------------------------------------------------------
     Ten little rows beside seven, and one cake under both: the whole lesson in
     one picture. Ten rows are drawn and seven are drawn, so the counting claim
     the film opens with is true of the picture the child is looking at. */
  var CA_M = { x1: 42, x2: 232, w: 86, rh: 13, gap: 5, top: 104 };
  function caMiniRows(x, n, top, o, col, crossed) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < n; k++) {
      var bad = crossed && crossed.indexOf(k) >= 0;
      var y = top + k * (CA_M.rh + CA_M.gap);
      out += R(x, y, CA_M.w, CA_M.rh, 5, bad ? "#4A2A2A" : P.cell, bad ? P.bad : (col || P.line), bad ? 2 : 1.5);
      if (bad) out += L(x + 6, y + CA_M.rh / 2, x + CA_M.w - 6, y + CA_M.rh / 2, P.bad, 2.5);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cTen = sn ? sc(sn, 0, "ten") : null, cSeven = sn ? sc(sn, 0, "seven") : null,
      cSame = sn ? sc(sn, 0, "same") : null, cConcise = sn ? sc(sn, 1, "concise") : null,
      cJob = sn ? sc(sn, 1, "job") : null, cWaste = sn ? sc(sn, 1, "waste") : null;
    var pTen = sn ? popIn(t, cTen, 0.45) : 1, pSeven = sn ? popIn(t, cSeven, 0.45) : 1;
    var pSame = sn ? popIn(t, cSame, 0.45) : 1, ring = sn ? on(t, cConcise, 0.5) : 1;
    var pJob = sn ? popIn(t, cJob, 0.4) : 1, pWaste = sn ? popIn(t, cWaste, 0.45) : 1;

    var tallH = 10 * (CA_M.rh + CA_M.gap) - CA_M.gap;
    var shortH = 7 * (CA_M.rh + CA_M.gap) - CA_M.gap;
    var shortTop = CA_M.top + (tallH - shortH) / 2;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    out += Tx(CA_M.x1 + CA_M.w / 2, 92, "10 steps", "lab mid muted", "middle", { opacity: pTen });
    out += Tx(CA_M.x2 + CA_M.w / 2, 92, "7 steps", "lab mid muted", "middle", { opacity: pSeven });
    out += caMiniRows(CA_M.x1, 10, CA_M.top, pTen, P.line, [2, 5, 6]);
    out += caMiniRows(CA_M.x2, 7, shortTop, pSeven, P.good);
    /* the ring that says which one is concise */
    if (ring > 0) out += R(CA_M.x2 - 10, shortTop - 10, CA_M.w + 20, shortH + 20, 12, "none", P.gold, 4, { opacity: ring });
    /* scissors between them, and the one cake both lists end at */
    out += MK.pop(Em(180, CA_M.top + tallH / 2, 46, "✂️"), 180, CA_M.top + tallH / 2, pWaste);
    out += MK.leader(CA_M.x1 + CA_M.w / 2, CA_M.top + tallH + 10, 180, 306, pSame > 0 ? Math.min(1, pSame) : 0, P.muted);
    out += MK.leader(CA_M.x2 + CA_M.w / 2, shortTop + shortH + 10, 180, 306, pSame > 0 ? Math.min(1, pSame) : 0, P.muted);
    out += MK.pop(Em(180, 310, 52, "\u{1F382}"), 180, 310, pSame);
    out += MK.tick(268, 312, 21, pJob);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Ten steps beside seven steps, and one cake under both">' + out + "</svg>";
  }

  /* ==== chapter: efficient means concise =========================================
     The lesson's own two pairs. The door algorithm has its second step cut and
     the child still walks in; the juice algorithm has the wave cut and the
     juice is still poured. The OUTCOME CARD on the right never changes while a
     step is cut, which is the whole claim: same job, fewer steps. */
  var CA_E = { x: 52, w: 520, h: 94, gap: 26 };
  var CA_EOUT = { x: 648, y: 54, w: 466, h: 330 };
  function caERowY(slot, n) {
    var span = n * (CA_E.h + CA_E.gap) - CA_E.gap;
    return (440 - span) / 2 + slot * (CA_E.h + CA_E.gap);
  }

  /* the job the algorithm is for, and a tick once it is done. Both halves of
     this chapter use it, so "the job" stays in the same place on screen while
     the list beside it gets shorter. */
  function caJobCard(kind, o, tickP, ask) {
    if (!(o > 0)) return "";
    var b = CA_EOUT, cx = b.x + b.w / 2, out = "";
    out += R(b.x, b.y, b.w, b.h, 26, P.card, P.line, 3);
    out += MK.pill(cx, b.y + 36, "The job", 1, { size: 21, col: P.muted, ink: P.muted });
    if (kind === "door") {
      out += Em(cx - 96, b.y + 168, 116, "\u{1F6AA}");
      out += Em(cx + 74, b.y + 172, 92, "\u{1F9D2}");
      out += MK.arrow(cx - 22, b.y + 176, cx + 22, b.y + 176, 1, P.muted, 6);
      out += Tx(cx, b.y + 274, "you walk in", "lab big", "middle");
    } else {
      out += Em(cx - 58, b.y + 128, 84, "\u{1F9C3}");
      out += Em(cx + 46, b.y + 176, 106, "\u{1F964}");
      out += MK.arrow(cx - 34, b.y + 152, cx + 14, b.y + 172, 1, P.muted, 6);
      out += Tx(cx, b.y + 274, "the juice is poured", "lab big", "middle");
    }
    if (ask > 0) out += MK.qmark(cx, b.y + 176, 52, ask);
    out += MK.tick(b.x + b.w - 42, b.y + 40, 26, tickP);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the job card, said again: it is the SAME card, so the mark has to be the
     card itself rather than a tick that is already sitting on it */
  function caSameJob(t, at) {
    var f = bump(t, at, 1.8);
    if (!(f > 0.02)) return "";
    return R(CA_EOUT.x - 3, CA_EOUT.y - 3, CA_EOUT.w + 6, CA_EOUT.h + 6, 28, "none", P.good, 5, { opacity: f });
  }

  /* one of the two three-step algorithms, with its middle step cut */
  function caEList(ids, shows, cut, numbers, marks, t) {
    var out = "", n = 3;
    var top3 = caERowY(0, 3), top2 = caERowY(0, 2);
    ids.forEach(function (id, k) {
      var o = shows[k];
      if (!(o > 0)) return;
      var goes = k === 1;
      var slot = k === 2 ? lerp(2, 1, cut) : k;
      var base = lerp(top3, top2, cut);
      var y = base + slot * (CA_E.h + CA_E.gap);
      var mk = marks[k] || {};
      if (goes) {
        if (cut >= 1) return;
        out += G(caRow(CA_E.x, top3 + (CA_E.h + CA_E.gap), CA_E.w, CA_E.h, 2, id,
          { o: o, col: mk.col, mark: mk.mark, markP: mk.p }),
          { opacity: 1 - cut, transform: around(CA_E.x + CA_E.w / 2, top3 + CA_E.h * 1.5 + CA_E.gap, 1 - 0.35 * cut) });
        return;
      }
      out += caRow(CA_E.x, y, CA_E.w, CA_E.h, numbers[k](cut), id,
        { o: o, col: mk.col, mark: mk.mark, markP: mk.p });
    });
    return out;
  }

  function caDoorHalf(scene, t) {
    var cJob = sc(scene, 0, "job"), cWaste0 = sc(scene, 0, "waste");
    var cFirst = sc(scene, 1, "first"), cSecond = sc(scene, 1, "second"),
      cWalk = sc(scene, 1, "walkin"), cAlready = sc(scene, 1, "already");
    var cWaste = sc(scene, 2, "waste"), cCut = sc(scene, 2, "cut"), cStill = sc(scene, 2, "still");
    var out = "", cut = on(t, cCut, 0.65);

    out += caJobCard("door", 1, popIn(t, cJob, 0.45), on(t, cJob == null ? null : cJob - 0.6, 0.4) * (1 - on(t, cJob, 0.4)));
    /* the three dashed slots, before any step is read out */
    var slots = on(t, cJob, 0.5) * (1 - on(t, cFirst, 0.4));
    for (var k = 0; k < 3; k++) out += caSlot(CA_E.x, caERowY(k, 3), CA_E.w, CA_E.h, k + 1, slots);
    out += MK.pop(Em(CA_E.x + CA_E.w + 34, caERowY(1, 3) + CA_E.h / 2, 54, "✂️"),
      CA_E.x + CA_E.w + 34, caERowY(1, 3) + CA_E.h / 2, popIn(t, cWaste0, 0.45) * (1 - on(t, cFirst, 0.4)));

    out += caEList(["door1", "door2", "walkin"],
      [on(t, cFirst, 0.45), on(t, cSecond, 0.45), on(t, cWalk, 0.45)], cut,
      [function () { return 1; }, function () { return 2; }, function (u) { return u >= 0.5 ? 2 : 3; }],
      [null,
        { col: caPast(t, cAlready) ? (caPast(t, cWaste) ? P.bad : P.gold) : null,
          mark: caPast(t, cWaste) ? "cross" : null, p: popIn(t, cWaste, 0.4) },
        null], t);
    /* the door is already open: the card's door flashes as the words are said */
    var fl = bump(t, cAlready, 1.4);
    if (fl > 0.02) out += C(CA_EOUT.x + CA_EOUT.w / 2 - 96, CA_EOUT.y + 168, 78, "none", P.gold, 5, { opacity: fl });
    /* and you still walk in: the SAME card, said again - it never changed */
    out += caSameJob(t, cStill);
    return out;
  }

  function caJuiceHalf(scene, t) {
    var cCup = sc(scene, 3, "cup"), cWave = sc(scene, 3, "wave"),
      cPour = sc(scene, 3, "pour"), cNothing = sc(scene, 3, "nothing");
    var cCutW = sc(scene, 4, "cutwave"), cPoured = sc(scene, 4, "poured"), cConcise = sc(scene, 4, "concise");
    var out = "", cut = on(t, cCutW, 0.65);

    out += caJobCard("juice", 1, popIn(t, cPour, 0.4), 0);
    out += caEList(["cup", "wave", "juice"],
      [on(t, cCup, 0.45), on(t, cWave, 0.45), on(t, cPour, 0.45)], cut,
      [function () { return 1; }, function () { return 2; }, function (u) { return u >= 0.5 ? 2 : 3; }],
      [null,
        { col: caPast(t, cNothing) ? P.bad : null,
          mark: caPast(t, cNothing) ? "cross" : null, p: popIn(t, cNothing, 0.4) },
        null], t);
    out += caSameJob(t, cPoured);
    out += MK.pill(CA_EOUT.x + CA_EOUT.w / 2, 412, "concise: every step is needed", on(t, cConcise, 0.45),
      { size: 23, col: P.good, ink: P.good });
    return out;
  }

  function caEfficientChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(caDoorHalf(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(caJuiceHalf(scene, t), { opacity: u });
    return svg(out);
  }

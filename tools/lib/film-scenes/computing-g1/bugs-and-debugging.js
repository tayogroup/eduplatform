  /* ==== Grade 1 Computing, Lesson 5: Bugs and Debugging =======================
     tools/lib/film-scenes/computing-g1/bugs-and-debugging.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/bugs-and-debugging.json.

     What comes from the lesson rather than from here:
       ART.block(id)            every block's label, icon and category, so the
                                film's blocks read and colour exactly as the
                                ones the child drags two steps later
       ART.run(sprite, ids)     where the dog ACTUALLY ends up after a program,
                                worked out by the lesson's own stage - so the
                                buggy program's dog comes home and the fixed
                                one's dog reaches square two because the lesson
                                says so, not because this file says so
       ART.scene("handwash", …) the lesson's own washing-hands picture, painted
                                from the list of step ids done so far. A wrong
                                order is shown by passing the wrong list.

     This file: the palette, the blocks, the marks and small drawings the
     chapters share, the title motif and the chapter "The first bug". Every
     top-level name here starts with bd, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, moth: P.gold, runit: P.blue, find: P.accent,
    fix: P.good, everyday: P.plum, everyone: P.gold, recap: P.teal
  };

  /* the lesson's block colours (computing.css: .block.move/.look/.control) */
  var BD_CAT = { move: P.teal, look: P.plum, control: P.accent };
  var BD_INK = "#06231F";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone */
  function bdOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }

  /* ---- the lesson's blocks ---------------------------------------------------
     One block, drawn as the lesson draws it: the category's colour, its icon
     and its label, both read out of the kit. opt: {outline, outlineW, opacity,
     pop (scaled about its centre), dx, label (a word of the film's own)} */
  function bdBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var b = ART.block(id);
    var fill = BD_CAT[b.cat] || P.teal;
    var out = R(x, y, w, h, h * 0.18, fill) +
      Em(x + h * 0.56, y + h * 0.52, h * 0.44, b.icon) +
      Tx(x + h * 1.02, y + h * 0.63, opt.label || b.label, "lab", "start", { "font-size": h * 0.36, fill: BD_INK });
    if (opt.outline) out += R(x - 5, y - 5, w + 10, h + 10, h * 0.18 + 5, "none", opt.outline, opt.outlineW || 5);
    var o = opt.opacity == null ? 1 : opt.opacity;
    if (!(o > 0)) return "";
    var p = opt.pop == null ? 1 : opt.pop;
    return G(out, { opacity: Math.min(1, o), transform: (opt.dx ? "translate(" + n2(opt.dx) + ",0) " : "") + around(x + w / 2, y + h / 2, p) });
  }

  /* an empty slot where a block belongs */
  function bdSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.18, "none", P.line, 4, { opacity: Math.min(1, o), "stroke-dasharray": "12 10" });
  }

  /* ---- small drawings of the film's own ---------------------------------------- */

  /* a moth: a furry body, two pairs of wings that flap with `f` (0 to 1), and
     two antennae. Drawn rather than borrowed: the emoji for an insect is a
     caterpillar and the one for a butterfly is not a moth. */
  function bdMoth(cx, cy, s, f, o) {
    if (!(o > 0)) return "";
    var sp = 0.72 + 0.28 * (f || 0);
    var wing = function (dir) {
      return G(Pth("M0,-0.06 C-0.52,-0.62 -0.98,-0.44 -0.92,-0.02 C-0.88,0.34 -0.46,0.46 -0.04,0.24 Z", "#C9B79C", "#8B6A3A", 0.035) +
        Pth("M-0.2,-0.2 C-0.52,-0.34 -0.74,-0.26 -0.76,-0.04", null, "#8B6A3A", 0.03),
        { transform: "scale(" + n3(dir) + ",1) scale(1," + n3(sp) + ")" });
    };
    var body = E(0, 0, 0.13, 0.46, "#6B5238") + C(0, -0.42, 0.14, "#5A442E") +
      Pth("M-0.05,-0.54 C-0.18,-0.78 -0.3,-0.86 -0.4,-0.88", null, "#5A442E", 0.035) +
      Pth("M0.05,-0.54 C0.18,-0.78 0.3,-0.86 0.4,-0.88", null, "#5A442E", 0.035);
    return G(wing(1) + wing(-1) + body, { transform: tr(cx, cy, s), opacity: clamp(o, 0, 1) });
  }

  /* the lesson's own Run control: a round green button with a triangle in it */
  function bdRunButton(cx, cy, r, o, press) {
    if (!(o > 0)) return "";
    var p = 1 - 0.1 * (press || 0);
    return G(C(cx, cy, r, P.good, "#2A8A6A", r * 0.1) +
      Pth("M" + n2(cx - r * 0.24) + "," + n2(cy - r * 0.38) + " L" + n2(cx + r * 0.42) + "," + n2(cy) +
        " L" + n2(cx - r * 0.24) + "," + n2(cy + r * 0.38) + " Z", "#06231F") +
      Tx(cx, cy + r * 1.72, "Run", "lab", "middle", { "font-size": r * 0.72, fill: P.good }),
      { opacity: clamp(o, 0, 1), transform: around(cx, cy, p) });
  }

  /* a circular arrow round (cx, cy): run it AGAIN */
  function bdLoopArrow(cx, cy, r, u, col) {
    if (!(u > 0)) return "";
    var a0 = -0.6, a1 = a0 + 5.2 * clamp(u, 0, 1);
    var big = a1 - a0 > Math.PI ? 1 : 0;
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var out = Pth("M" + n2(x0) + "," + n2(y0) + " A" + n2(r) + "," + n2(r) + " 0 " + big + " 1 " + n2(x1) + "," + n2(y1), null, col || P.gold, 6);
    if (u >= 0.98) {
      var h = 15, ta = a1 + Math.PI / 2;
      out += Pth("M" + n2(x1 + Math.cos(ta) * h) + "," + n2(y1 + Math.sin(ta) * h) +
        " L" + n2(x1 + Math.cos(ta + 2.5) * h) + "," + n2(y1 + Math.sin(ta + 2.5) * h) +
        " L" + n2(x1 + Math.cos(ta - 2.5) * h) + "," + n2(y1 + Math.sin(ta - 2.5) * h) + " Z", col || P.gold);
    }
    return out;
  }

  /* ==== the title motif ============================================================
     The lesson's own three blocks, with the bug on the second one. In the
     spoken title chapter the bug crawls on as "a mistake" is named, a
     magnifier finds it on "Finding the bug", the wrong block is swapped on
     "fixing it", and a tick lands on "debugging". On the two cards, where
     there is no chapter to ask, it simply stands with the bug on it. */
  var BD_MOTIF = { x: 52, y: 44, w: 256, h: 272, bx: 74, bw: 212, bh: 62 };
  function bdMotifRow(k) { return BD_MOTIF.y + 26 + k * 82; }
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cMistake = sc0 ? sc(sc0, 0, "mistake") : null, cBug = sc0 ? sc(sc0, 0, "bug") : null;
    var cFind = sc0 ? sc(sc0, 1, "find") : null, cFix = sc0 ? sc(sc0, 1, "fix") : null, cDebug = sc0 ? sc(sc0, 1, "debug") : null;
    var fixed = on(t, cFix, 0.5), found = on(t, cFind, 0.5), tick = popIn(t, cDebug, 0.4);
    /* with no chapter (the title and end cards) the bug is simply there */
    var bugOn = sc0 ? popIn(t, cBug, 0.45) * (1 - fixed) : 1;
    var wrong = sc0 ? 1 - fixed : 1;

    out += R(BD_MOTIF.x, BD_MOTIF.y, BD_MOTIF.w, BD_MOTIF.h, 24, P.card, P.line, 3);
    out += bdBlock(BD_MOTIF.bx, bdMotifRow(0), BD_MOTIF.bw, BD_MOTIF.bh, "right", { opacity: 1 });
    /* the second block: move left while it is wrong, move right once it is fixed */
    if (wrong > 0.02) out += bdBlock(BD_MOTIF.bx, bdMotifRow(1), BD_MOTIF.bw, BD_MOTIF.bh, "left",
      { opacity: wrong, outline: P.accent, outlineW: 5 });
    if (fixed > 0.02) out += bdBlock(BD_MOTIF.bx, bdMotifRow(1), BD_MOTIF.bw, BD_MOTIF.bh, "right",
      { opacity: fixed, pop: popIn(t, cFix, 0.45), outline: P.good, outlineW: 5 });
    out += bdBlock(BD_MOTIF.bx, bdMotifRow(2), BD_MOTIF.bw, BD_MOTIF.bh, "jump", { opacity: 1 });
    /* "a mistake": the wrong block glows before the bug crawls on */
    if (sc0) out += MK.glow(BD_MOTIF.x + BD_MOTIF.w / 2, bdMotifRow(1) + BD_MOTIF.bh / 2, 150, P.accent,
      on(t, cMistake, 0.6) * wrong * (0.6 + 0.4 * breathe(t)));
    /* the bug itself, sitting on the wrong block */
    if (bugOn > 0) out += MK.pop(Em(300, bdMotifRow(1) + 22, 62, "\u{1F41B}"), 300, bdMotifRow(1) + 22, bugOn);
    /* "Finding the bug": a magnifier comes down onto it */
    if (found > 0) out += G(Em(0, 0, 76, "\u{1F50D}"), { transform: tr(lerp(316, 286, found), lerp(96, bdMotifRow(1) + 26, found)), opacity: found * (1 - fixed * 0.8) });
    if (tick > 0) out += MK.tick(300, bdMotifRow(2) + 16, 26, tick);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A three-block program with a bug on the second block">' + out + "</svg>";
  }

  /* ==== chapter: the first bug ======================================================
     A room with a computer filling it, a person beside it for scale, and the
     moth found inside. Drawn here rather than borrowed: the lesson's demo
     shows this story as five emoji frames, and none of them is a room-sized
     computer. Nothing in it contradicts the lesson; every word is the
     lesson's own. */
  var BD_ROOM = { x: 44, y: 34, w: 656, h: 382 };
  var BD_CAB = [92, 268, 444], BD_CABW = 156, BD_CABY = 112, BD_CABH = 216;
  var BD_FLOOR = 336;
  var BD_ZOOM = { x: 930, y: 180, r: 128 };

  /* one cabinet of the big computer: two tape reels turning, and a grid of
     lights. `spin` is where the reels have got to; `lit` fades the lights. */
  function bdCabinet(x, spin, lit, t) {
    var out = R(x, BD_CABY, BD_CABW, BD_CABH, 10, "#2B5673", P.line, 3);
    out += L(x + 42, BD_CABY + 24, x + 114, BD_CABY + 24, "#4A3A28", 5);
    [42, 114].forEach(function (dx, k) {
      var cx = x + dx, cy = BD_CABY + 54, a = spin + k * 37;
      out += C(cx, cy, 30, P.dark, "#93AABE", 6) + C(cx, cy, 21, "#4A3A28") + C(cx, cy, 8, "#93AABE");
      for (var s = 0; s < 4; s++) {
        var ang = (a + s * 45) * Math.PI / 180;
        out += L(cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 9, cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20, "#93AABE", 3.5);
      }
    });
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
      var k = r * 4 + c;
      var on1 = Math.sin(t * 3.1 + k * 1.7 + x) > 0 ? 1 : 0.15;
      var col = lit > 0 ? (k % 3 === 0 ? P.gold : P.good) : P.line;
      out += R(x + 16 + c * 33, BD_CABY + 122 + r * 28, 22, 15, 4, col, null, null,
        { opacity: lit > 0 ? (0.2 + 0.8 * on1) * lit + 0.18 * (1 - lit) : 0.28 });
    }
    return out;
  }

  function bdMothChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLong = c(0, "long"), cRoom = c(0, "room");
    var cStopped = c(1, "stopped"), cWhy = c(1, "why");
    var cInside = c(2, "inside"), cInsect = c(2, "insect"), cMoth = c(2, "moth");
    var cCalled = c(3, "called"), cReal = c(3, "real");
    var cStuck = c(4, "stuck"), cFamous = c(4, "famous");
    var out = "";

    var roomIn = popIn(t, cLong, 0.6);
    if (!(roomIn > 0)) roomIn = into(t, scene.first);
    var lit = 1 - on(t, cStopped, 0.6);
    var spin = 62 * (cStopped == null ? t : Math.min(t, cStopped));

    /* the room, with everything inside it clipped to its rounded walls */
    out += el("clipPath", { id: "bdRoomClip" }, R(BD_ROOM.x, BD_ROOM.y, BD_ROOM.w, BD_ROOM.h, 20));
    var room = R(BD_ROOM.x, BD_ROOM.y, BD_ROOM.w, BD_ROOM.h, 0, "#0E2434") +
      R(BD_ROOM.x, BD_FLOOR, BD_ROOM.w, BD_ROOM.y + BD_ROOM.h - BD_FLOOR, 0, "#17384F") +
      L(BD_ROOM.x, BD_FLOOR, BD_ROOM.x + BD_ROOM.w, BD_FLOOR, P.line, 3);
    BD_CAB.forEach(function (x) { room += bdCabinet(x, spin, lit, t); });
    /* the panel of the middle cabinet swings open on "Inside the machine" */
    var openU = on(t, cInside, 0.55);
    if (openU < 1) room += R(BD_CAB[1], BD_CABY, BD_CABW, BD_CABH, 10, "#3A6C90", P.line, 3, { opacity: 1 - openU }) +
      C(BD_CAB[1] + BD_CABW - 18, BD_CABY + BD_CABH / 2, 6, "#93AABE", null, null, { opacity: 1 - openU });
    /* a person, for scale: the machine is more than twice as tall */
    room += Em(632, 288, 104, "\u{1F9D1}");
    out += G(room, { "clip-path": "url(#bdRoomClip)", opacity: clamp(roomIn, 0, 1) });
    out += R(BD_ROOM.x, BD_ROOM.y, BD_ROOM.w, BD_ROOM.h, 20, "none", P.line, 3, { opacity: clamp(roomIn, 0, 1) });

    /* "as big as a whole room": the width of the room, measured */
    var wu = on(t, cRoom, 0.7), mid = BD_ROOM.x + BD_ROOM.w / 2;
    out += MK.arrow(mid, 398, lerp(mid, BD_ROOM.x + 20, wu), 398, wu, P.gold, 6);
    out += MK.arrow(mid, 398, lerp(mid, BD_ROOM.x + BD_ROOM.w - 20, wu), 398, wu, P.gold, 6);
    out += MK.pill(mid, 368, "a whole room", on(t, cRoom, 0.5), { size: 24, col: P.gold });

    /* "nobody knew why" */
    out += MK.qmark(mid, 74, 30, on(t, cWhy, 0.5) * (1 - on(t, cInsect, 0.5)));

    /* the moth found inside the open cabinet, and the magnified view of it */
    var mothX = BD_CAB[1] + 78, mothY = BD_CABY + 150;
    out += bdMoth(mothX, mothY, 62, breathe(t), openU);
    out += MK.ripple(mothX, mothY, t, cInside, P.gold);

    var zoom = on(t, cInsect, 0.5) * (1 - on(t, cStuck, 0.5));
    if (zoom > 0) {
      var zu = on(t, cInsect, 0.7);
      out += L(mothX + 22, mothY - 14, lerp(mothX + 22, BD_ZOOM.x - 112, zu), lerp(mothY - 14, BD_ZOOM.y - 62, zu), P.gold, 2.5, { opacity: 0.8 * zoom, "stroke-dasharray": "8 7" });
      out += L(mothX + 22, mothY + 14, lerp(mothX + 22, BD_ZOOM.x - 112, zu), lerp(mothY + 14, BD_ZOOM.y + 62, zu), P.gold, 2.5, { opacity: 0.8 * zoom, "stroke-dasharray": "8 7" });
      var named = on(t, cMoth, 0.4);
      out += G(C(BD_ZOOM.x, BD_ZOOM.y, BD_ZOOM.r, "#123247", named > 0.5 ? P.gold : P.line, 4) +
        bdMoth(BD_ZOOM.x, BD_ZOOM.y, 150 + 14 * named, breathe(t), 1), { opacity: zoom });
      out += MK.ripple(BD_ZOOM.x, BD_ZOOM.y, t, cMoth, P.gold);
    }

    /* "People already called a mistake a bug": the word, and what it means */
    var wc = on(t, cCalled, 0.45);
    if (wc > 0) {
      out += G(R(786, 344, 292, 68, 18, P.cell, P.line, 2) +
        Em(826, 378, 34, "\u{1F41B}") +
        Tx(856, 388, "bug = a mistake", "lab", "start", { "font-size": 26 }), { opacity: wc });
      out += MK.glow(932, 378, 58, P.gold, bump(t, cReal, 1.1));
    }

    /* "They stuck the moth in their notebook" */
    var nb = on(t, cStuck, 0.5);
    if (nb > 0) {
      var page = R(786, 36, 292, 296, 14, P.paper);
      for (var r2 = 0; r2 < 4; r2++) page += L(806, 250 + r2 * 22, 1058, 250 + r2 * 22, "#C9BFA8", 2);
      page += L(818, 36, 818, 332, "#E3B7A8", 2);
      page += bdMoth(946, 142, 122, 0, 1);
      /* two strips of tape, one over each wing tip, as the engineers taped it */
      page += R(846, 116, 74, 20, 3, "#E8DFC8", "#CFC3A4", 1.5, { opacity: 0.7, transform: "rotate(-18 883 126)" });
      page += R(976, 116, 74, 20, 3, "#E8DFC8", "#CFC3A4", 1.5, { opacity: 0.7, transform: "rotate(18 1013 126)" });
      page += Tx(932, 238, "bug", "lab dark", "middle", { "font-size": 44 });
      out += G(page, { opacity: nb, transform: around(932, 184, 0.94 + 0.06 * nb) });
      out += MK.glow(932, 226, 92, P.gold, on(t, cFamous, 0.6) * (0.6 + 0.4 * breathe(t)));
    }
    return svg(out);
  }

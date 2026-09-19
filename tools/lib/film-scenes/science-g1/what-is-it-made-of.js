
  /* ==== Grade 1 Science, Lesson 4: What Is It Made Of? =====================
     tools/lib/film-scenes/science-g1/what-is-it-made-of.js, then -2, -3 and
     -4: the film's pictures, joined in that order into one script between the
     shared engine's head and tail, after tools/lib/ehel-film-marks.js (MK) and
     the Science lesson kit's drawings (ART). See lecture-video/BRIEF.md.

     The five teaching chapters are the five parts of LESSON["lecture"] in
     content/lesson-4.py, in order, and every picture is one the lesson itself
     shows the child: the objects and materials of its explore and sort steps,
     the sponge and metal spoon of its material tester, the ball of clay, the
     elastic band and the stone of its shape experiment (SIMS.shapeChange.items,
     the stone in the kit's own drawing), and the window and raincoat of its
     context step. The lesson moves its things with CSS transforms (the tester's
     press and bend, the experiment's squash, bend, twist and stretch); the film
     uses those same transforms, drawn as SVG, as a pure function of t.

     This part: the shared pieces, the title, and "Object and material". */

  /* One colour per chapter; neighbours differ, and the title and recap are teal. */
  var HUE = {
    title: P.teal, objects: P.gold, seven: P.plum, testing: P.accent,
    shape: P.blue, job: P.good, recap: P.teal
  };

  /* The lesson's own pictures. MK.pic swaps an emoji too new for old devices
     (the rock, the wood, the window) for the kit's drawing, as the lesson does;
     glass has no emoji and is the kit's drawing, icon("glass"), outright. */
  var PIC = {
    spoon: "\u{1F944}", chair: "\u{1FA91}", bottle: "\u{1F9F4}", window: "\u{1FA9F}",
    rock: "\u{1FAA8}", book: "\u{1F4D6}", tshirt: "\u{1F455}", door: "\u{1F6AA}",
    pencil: "✏️", metal: "⚙️", wood: "\u{1FAB5}", fabric: "\u{1F9F5}",
    paper: "\u{1F4C4}", glass: ART.ICONS.glass, sponge: "\u{1F9FD}", clay: "\u{1F7E4}",
    band: "➰", coat: "\u{1F9E5}", pillow: "\u{1F6CF}️", press: "\u{1F447}",
    bend: "↩️", drop: "\u{1F4A7}"
  };

  /* ==== shared pieces ======================================================== */

  /* A tap card as the lesson draws one (science.css .tapcard): the thing's
     picture and its name, and under them what it is made of once that is said.
     o: {pic, size, label, sub, subO, edge ("now" gold, "heard" teal, "gold"),
         op, s (scale about the centre), dash} */
  function wmCard(cx, cy, w, h, o) {
    var st = o.edge || "", out = "";
    var fill = st === "heard" ? P.tealSoft : st === "gold" ? "#2A3A3C" : P.card;
    var edge = st === "now" || st === "gold" ? P.gold : st === "heard" ? P.teal : P.line;
    if (st === "now") out += R(cx - w / 2 - 6, cy - h / 2 - 6, w + 12, h + 12, 24, "none", "rgba(244,201,93,0.28)", 6);
    out += R(cx - w / 2, cy - h / 2, w, h, 18, fill, edge, 3, o.dash ? { "stroke-dasharray": "10 8" } : null);
    var size = o.size || h * 0.46, lines = (o.label ? 1 : 0) + (o.sub ? 1 : 0);
    var py = cy - h / 2 + 16 + size / 2 + (lines === 0 ? (h - 32 - size) / 2 : lines === 1 ? 4 : 0);
    if (o.pic) out += MK.pic(cx, py, size, o.pic);
    if (o.label) out += Tx(cx, cy + h / 2 - (o.sub ? 50 : 22), o.label, "lab " + (o.big ? "big" : "mid"), "middle");
    if (o.sub && o.subO > 0) out += Tx(cx, cy + h / 2 - 16, o.sub, "lab mid gold", "middle", { opacity: Math.min(1, o.subO) });
    return G(out, { opacity: o.op == null ? 1 : o.op, transform: o.s != null && o.s !== 1 ? around(cx, cy, o.s) : null });
  }

  /* a result badge, as the tester shows one (science.css .badge) */
  function wmBadge(x, y, text, p, anchor) {
    if (!(p > 0)) return "";
    var size = 24, w = String(text).length * size * 0.57 + size * 1.3, h = 46;
    var left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
    return G(R(left, y - h / 2, w, h, h / 2, P.tealSoft, P.teal, 2.5) +
      Tx(left + w / 2, y + size * 0.36, text, "lab", "middle", { "font-size": size }),
      { transform: around(left + w / 2, y, Math.max(0.001, p)), opacity: Math.min(1, p) });
  }
  function wmBadgeW(text) { return String(text).length * 24 * 0.57 + 24 * 1.3; }

  /* a word above a column, as the sort step's bin names */
  function wmHead(x, y, text, col, o) {
    if (!(o > 0)) return "";
    return Tx(x, y, text, "lab big", "middle", { fill: col, opacity: o, transform: "translate(0," + n2((1 - Math.min(1, o)) * 8) + ")" });
  }

  /* an emoji or kit drawing with a transform about the point (ox, oy):
     tf = {sx, sy, rot (degrees), skew (degrees), dx, dy}, the lesson's CSS
     transform written as rotate() skewX() scale(), which covers all four of
     its shape changes */
  function wmShaped(cx, cy, size, pic, tf, ox, oy, extra) {
    tf = tf || {};
    var m = "translate(" + n2(ox + (tf.dx || 0)) + "," + n2(oy + (tf.dy || 0)) + ")" +
      (tf.rot ? " rotate(" + n2(tf.rot) + ")" : "") + (tf.skew ? " skewX(" + n2(tf.skew) + ")" : "") +
      " scale(" + n3(tf.sx == null ? 1 : tf.sx) + "," + n3(tf.sy == null ? 1 : tf.sy) + ")" +
      " translate(" + n2(-ox) + "," + n2(-oy) + ")";
    return G(MK.pic(cx, cy, size, pic), Object.assign({ transform: m }, extra || {}));
  }
  function wmMix(a, b, u) {
    return { sx: lerp(a.sx == null ? 1 : a.sx, b.sx == null ? 1 : b.sx, u), sy: lerp(a.sy == null ? 1 : a.sy, b.sy == null ? 1 : b.sy, u),
      rot: lerp(a.rot || 0, b.rot || 0, u), skew: lerp(a.skew || 0, b.skew || 0, u), dx: lerp(a.dx || 0, b.dx || 0, u), dy: lerp(a.dy || 0, b.dy || 0, u) };
  }

  /* a raindrop, point up, centred on (x, y) */
  function wmDrop(x, y, s, col, op) {
    if (!(op > 0)) return "";
    return Pth("M" + n2(x) + "," + n2(y - 1.3 * s) + " C" + n2(x + 0.25 * s) + "," + n2(y - 0.6 * s) + " " + n2(x + s) + "," + n2(y - 0.1 * s) + " " + n2(x + s) + "," + n2(y + 0.35 * s) +
      " A" + n2(s) + "," + n2(s) + " 0 0 1 " + n2(x - s) + "," + n2(y + 0.35 * s) +
      " C" + n2(x - s) + "," + n2(y - 0.1 * s) + " " + n2(x - 0.25 * s) + "," + n2(y - 0.6 * s) + " " + n2(x) + "," + n2(y - 1.3 * s) + " Z",
      col || "#6FB7F0", null, null, { opacity: op });
  }

  /* a curved arrow along a circle about (cx, cy), from angle a0 to a1 (radians),
     grown to u: a bend or a twist */
  function wmArc(cx, cy, r, a0, a1, u, col, w) {
    if (!(u > 0)) return "";
    col = col || P.gold; w = w || 7;
    var a = lerp(a0, a1, u), sweep = a1 > a0 ? 1 : 0, large = Math.abs(a - a0) > Math.PI ? 1 : 0;
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
    var dirn = a1 > a0 ? 1 : -1, tx = -Math.sin(a) * dirn, ty = Math.cos(a) * dirn, h = w * 2.4;
    var bx = x1 - tx * h * 0.55, by = y1 - ty * h * 0.55;
    return Pth("M" + n2(x0) + "," + n2(y0) + " A" + n2(r) + "," + n2(r) + " 0 " + large + " " + sweep + " " + n2(bx) + "," + n2(by), null, col, w) +
      Pth("M" + n2(x1 + tx * h * 0.45) + "," + n2(y1 + ty * h * 0.45) +
        " L" + n2(x1 - tx * h * 0.6 - ty * h * 0.6) + "," + n2(y1 - ty * h * 0.6 + tx * h * 0.6) +
        " L" + n2(x1 - tx * h * 0.6 + ty * h * 0.6) + "," + n2(y1 - ty * h * 0.6 - tx * h * 0.6) + " Z", col, col, 2);
  }

  /* ==== the title ============================================================
     The seven materials of the lesson in a ring around the thing being asked
     about, and a question mark: what is it made of? In the spoken title the
     materials arrive on "Everything around you", and the spoon, the chair and
     the window take the middle as each is named. */
  var RING = [PIC.wood, PIC.metal, PIC.bottle, PIC.glass, PIC.rock, PIC.paper, PIC.fabric];
  function titleMotif(o) {
    var t = o.t || 0, spoken = !!(o.spoken && o.scene), out = "";
    var every = spoken ? sc(o.scene, 0, "every") : null, matAt = spoken ? sc(o.scene, 0, "material") : null;
    var centre = [[PIC.spoon, spoken ? sc(o.scene, 1, "spoon") : -1], [PIC.chair, spoken ? sc(o.scene, 1, "chair") : -1],
      [PIC.window, spoken ? sc(o.scene, 1, "window") : -1]];
    var what = spoken ? sc(o.scene, 1, "what") : -1;
    for (var k = 0; k < RING.length; k++) {
      var a = -Math.PI / 2 + k * 2 * Math.PI / RING.length, x = 180 + 132 * Math.cos(a), y = 180 + 132 * Math.sin(a);
      var p = spoken ? popIn(t, every == null ? null : every + k * 0.14, 0.4) : 1;
      if (p <= 0) continue;
      var s = 1 + 0.14 * bump(t, matAt == null ? null : matAt + k * 0.08, 0.5);
      out += G(C(x, y, 40, P.card, P.line, 3) + MK.pic(x, y, 46, RING[k]), { transform: around(x, y, Math.min(p, 1.1) * s), opacity: Math.min(1, p) });
    }
    out += C(180, 180, 84, P.cell, P.teal, 4, { "stroke-dasharray": "12 9" });
    /* the middle: the spoon, the chair and the window, side by side, each
       arriving as it is named and staying (named 0.6 s apart, one replacing
       the next would flick past) */
    var XS3 = [128, 180, 232];
    for (var j = 0; j < centre.length; j++) {
      var at = centre[j][1];
      if (at == null) continue;
      var q = at < 0 ? 1 : popIn(t, at, 0.35);
      if (q <= 0) continue;
      out += G(MK.pic(XS3[j], 182, 52, centre[j][0]), { transform: around(XS3[j], 182, Math.min(q, 1.1)), opacity: Math.min(1, q) });
    }
    /* the question mark sits in the gap between the wood and the metal */
    var qo = what == null ? 0 : what < 0 ? 1 : popIn(t, what, 0.4);
    if (qo > 0) out += G(C(216, 104, 22, P.gold) + Tx(216, 115, "?", "lab", "middle", { fill: "#142B3E", "font-size": 30 }),
      { transform: around(216, 104, Math.min(qo, 1.1)), opacity: Math.min(1, qo) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The seven materials around a spoon, and a question mark">' + out + "</svg>";
  }

  var wmTitle = MK.titleKind({ sub: ["Objects, and what they are made of.", "Testing materials, and changing their shape.", "The right material for the job."] });

  /* ==== chapter: Object and material ==========================================
     The lesson's demo, as a table: the object on the left, the material it is
     made of on the right. The spoon is pointed at; an arrow finds its metal; the
     chair finds its wood; each column lights as it is named; "made of spoon" is
     crossed out; then wood alone makes a chair, a pencil and a door. */
  var OBJ = { ox: 250, mx: 900, r1: 150, r2: 342, w: 236, h: 164 };

  function objectsTable(scene, t) {
    var b = scene.first, out = "";
    var spoonAt = sc(scene, 0, "spoon"), objAt = sc(scene, 0, "object"), pointAt = sc(scene, 0, "point");
    var metalAt = sc(scene, 1, "metal"), matAt = sc(scene, 1, "material");
    var chairAt = sc(scene, 2, "chair"), woodAt = sc(scene, 2, "wood");
    var colObj = sc(scene, 3, "object"), colMat = sc(scene, 3, "material");
    var qAt = sc(scene, 4, "q"), noAt = sc(scene, 4, "no"), isAt = sc(scene, 4, "is"), backAt = sc(scene, 4, "metal");

    /* the two column frames, lit in turn */
    var fo = on(t, colObj, 0.4) * (1 - on(t, colMat, 0.4)), fm = on(t, colMat, 0.4) * (1 - on(t, BEATS[b + 4].start - 0.1, 0.4));
    if (fo > 0) out += R(OBJ.ox - 142, 66, 284, 370, 26, "rgba(53,191,178,0.08)", P.teal, 4, { opacity: fo * (0.75 + 0.25 * breathe(t)) });
    if (fm > 0) out += R(OBJ.mx - 142, 66, 284, 370, 26, "rgba(244,201,93,0.08)", P.gold, 4, { opacity: fm * (0.75 + 0.25 * breathe(t)) });

    out += wmHead(OBJ.ox, 44, "Object", P.teal, on(t, objAt, 0.45));
    out += wmHead(OBJ.mx, 44, "Material", P.gold, on(t, matAt, 0.45));

    /* the arrows: "made of" */
    [[OBJ.r1, metalAt], [OBJ.r2, woodAt]].forEach(function (r) {
      var u = on(t, r[1], 0.6);
      if (u <= 0) return;
      out += MK.arrow(OBJ.ox + OBJ.w / 2 + 16, r[0], OBJ.mx - OBJ.w / 2 - 16, r[0], u, P.muted, 6);
      out += Tx((OBJ.ox + OBJ.mx) / 2, r[0] - 20, "made of", "lab mid muted", "middle", { opacity: clamp(u * 1.6 - 0.6, 0, 1) });
    });

    /* the objects */
    var bumpObj = 1 + 0.06 * bump(t, colObj, 0.7), bumpMat = 1 + 0.06 * bump(t, colMat, 0.7);
    var sp = popIn(t, spoonAt, 0.45);
    if (sp > 0) out += wmCard(OBJ.ox, OBJ.r1, OBJ.w, OBJ.h, { pic: PIC.spoon, size: 86, label: "spoon", big: true,
      edge: t >= objAt ? "heard" : "", s: Math.min(sp, 1.1) * bumpObj * (1 + 0.07 * bump(t, isAt, 0.8)), op: Math.min(1, sp) });
    /* "Spoon is what it is": the object lights */
    var isO = bump(t, isAt, 1.4);
    if (isO > 0) out += R(OBJ.ox - OBJ.w / 2 - 10, OBJ.r1 - OBJ.h / 2 - 10, OBJ.w + 20, OBJ.h + 20, 26, "none", P.teal, 5, { opacity: isO });
    var ch = popIn(t, chairAt, 0.45);
    if (ch > 0) out += wmCard(OBJ.ox, OBJ.r2, OBJ.w, OBJ.h, { pic: PIC.chair, size: 86, label: "chair", big: true,
      edge: "heard", s: Math.min(ch, 1.1) * bumpObj, op: Math.min(1, ch) });

    /* the materials; the metal steps aside for "made of spoon" and comes back */
    var away = on(t, qAt, 0.4) * (1 - on(t, backAt, 0.4));
    var mt = popIn(t, metalAt == null ? null : metalAt + 0.4, 0.45);
    if (mt > 0) out += wmCard(OBJ.mx, OBJ.r1, OBJ.w, OBJ.h, { pic: PIC.metal, size: 86, label: "metal", big: true,
      edge: t >= matAt ? "gold" : "", s: Math.min(mt, 1.1) * bumpMat * (1 + 0.08 * bump(t, backAt, 0.7)), op: Math.min(1, mt) * (1 - 0.92 * away) });
    var wd = popIn(t, woodAt == null ? null : woodAt + 0.4, 0.45);
    if (wd > 0) out += wmCard(OBJ.mx, OBJ.r2, OBJ.w, OBJ.h, { pic: PIC.wood, size: 86, label: "wood", big: true,
      edge: "gold", s: Math.min(wd, 1.1) * bumpMat, op: Math.min(1, wd) });

    /* "Is the spoon made of spoon? No." The crossed-out card stays until the
       metal takes its place again, so the slot is never empty. */
    var gh = on(t, qAt, 0.4) * (1 - on(t, backAt == null ? null : backAt - 0.1, 0.35));
    if (gh > 0) {
      out += G(wmCard(OBJ.mx, OBJ.r1, OBJ.w, OBJ.h, { pic: PIC.spoon, size: 86, label: "spoon?", big: true, dash: true }) +
        MK.cross(OBJ.mx + OBJ.w / 2 - 6, OBJ.r1 - OBJ.h / 2 + 6, 26, popIn(t, noAt, 0.35)), { opacity: gh });
    }
    out += MK.tick(OBJ.mx + OBJ.w / 2 - 6, OBJ.r1 - OBJ.h / 2 + 6, 26, popIn(t, backAt == null ? null : backAt + 0.2, 0.35) * (1 - on(t, BEATS[b + 5].start - 0.2, 0.3)));

    /* "a thing you can point at": the shared finger, turned to point left, comes
       in from the right at the height of the spoon's picture; gone before the
       arrow to its material is drawn there */
    var fg = on(t, pointAt, 0.3) * (1 - on(t, BEATS[b + 1].start + 0.3, 0.35));
    if (fg > 0) {
      var tipX = lerp(OBJ.ox + OBJ.w / 2 + 54, OBJ.ox + OBJ.w / 2 + 4, on(t, pointAt, 0.45)), tipY = OBJ.r1 - 18;
      out += G(MK.finger(tipX, tipY, fg), { transform: "rotate(-90 " + n2(tipX) + " " + n2(tipY) + ")" });
      out += MK.ripple(OBJ.ox + OBJ.w / 2 - 4, tipY, t, pointAt == null ? null : pointAt + 0.45, P.teal);
    }
    return out;
  }

  /* "One material can make many objects": wood, and a chair, a pencil and a door */
  function objectsFan(scene, t) {
    var k = 5, out = "";
    var one = sc(scene, k, "one"), many = sc(scene, k, "many");
    /* [cue, picture, name, row centre]: three rows of 116, inside 440 */
    var things = [["chairs", PIC.chair, "chair", 88], ["pencils", PIC.pencil, "pencil", 224], ["doors", PIC.door, "door", 360]];
    var g = 0.6 + 0.4 * breathe(t);
    out += MK.glow(290, 236, 190, P.gold, on(t, one, 0.5) * g);
    out += wmCard(290, 236, 270, 230, { pic: PIC.wood, size: 120, label: "wood", big: true, edge: "gold", s: 1 + 0.07 * bump(t, one, 0.7) });
    out += wmHead(290, 74, "One material", P.gold, on(t, one, 0.45));
    things.forEach(function (th, j) {
      var at = sc(scene, k, th[0]), y = th[3];
      var slot = on(t, many == null ? null : many + j * 0.15, 0.35);
      if (slot > 0 && !(at != null && t >= at + 0.45)) out += R(760, y - 56, 270, 112, 18, "none", P.line, 3, { opacity: slot, "stroke-dasharray": "10 8" });
      out += MK.leader(427, 236, 756, y, on(t, at, 0.35), P.gold);
      var p = popIn(t, at == null ? null : at + 0.12, 0.35);
      if (p > 0) out += G(R(760, y - 56, 270, 112, 18, P.tealSoft, P.teal, 3) + MK.pic(830, y, 76, th[1]) + Tx(948, y + 11, th[2], "lab big", "middle"),
        { transform: around(895, y, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });
    return out;
  }

  function wmObjects(scene, beat, t, i) {
    var fan = scene.first + 5, u = scene.beats.length > 5 ? into(t, fan) : 0, out = "";
    if (u < 1) out += G(objectsTable(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(objectsFan(scene, t), { opacity: u });
    return svg(out);
  }

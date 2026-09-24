  /* ==== Grade 2 Computing, Lesson 6: Bee-Bot Journeys =========================
     tools/lib/film-scenes/computing-g2/bee-bot-journeys.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/bee-bot-journeys.json.

     THE GRID IS DRAWN HERE, and that is deliberate. The lesson keeps Robo's
     grid inside robotGrid(o), a closure that needs the lesson page's own
     element ids, so there is nothing to lift. What IS lifted is every rule the
     film narrates: ART.robo.DIRS (which way each facing moves), ART.robo.TURN_L
     and TURN_R (what a turn button does), ART.robo.ANGLE (how far the pointer
     swings) and ART.robo.CMD (what each button is called). bbRun below is the
     kit's own run() loop - facing, then the move, then the wall and edge test -
     written against those tables, so a route this film narrates and a route the
     lesson runs cannot disagree.

     Every journey drawn is one of the lesson's own levels:
       Journey 1  start [0,4] facing up, shop  [0,1]      F F F
       Journey 2  start [0,4] facing up, house [2,2]      F F R F F
       Journey 4  start [2,4] facing up, wall [2,2],
                  school [2,1]                            F L F R F F R F
       Program 1  start [0,0] facing DOWN, shop [1,2]     F F L F   (predict)

     This file: the palette, the grid, the robot, the buttons and their chips,
     the memory strip, and the title motif. Every top-level name starts with bb,
     so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, robot: P.gold, clear: P.accent, squares: P.blue,
    wall: P.plum, predict: P.good, work: P.gold, recap: P.teal
  };

  var BB_RAD = Math.PI / 180;

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function bbOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function bbFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function bbPast(t, at) { return at != null && t >= at; }

  /* ==== the grid ==============================================================
     A 5 x 5 mat of squares, the lesson's own colours: the checker of #17384F
     and #1B3A52, a #2B5673 edge, and gold for a square the child has picked. */

  var BB_G = { x: 736, y: 30, cell: 76, cols: 5, rows: 5 };      /* 736..1116, 30..410 */
  function bbX(g, c) { return g.x + (c + 0.5) * g.cell; }
  function bbY(g, r) { return g.y + (r + 0.5) * g.cell; }

  /* o: the whole mat's opacity. opt: {at (the cue it wipes in on), lit ([c, r]
     drawn gold), t} */
  function bbGrid(g, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var out = "", r, c;
    for (r = 0; r < g.rows; r++) for (c = 0; c < g.cols; c++) {
      var u = opt.at == null ? 1 : on(opt.t, opt.at + (r + c) * 0.035, 0.3);
      if (!(u > 0)) continue;
      var lit = opt.lit && opt.lit[0] === c && opt.lit[1] === r;
      out += R(g.x + c * g.cell + 1, g.y + r * g.cell + 1, g.cell - 2, g.cell - 2, g.cell * 0.12,
        lit ? P.gold : ((r + c) % 2 ? "#17384F" : "#1B3A52"), "#2B5673", 2, { opacity: u });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a gold ring round one square, for "it does not move at all" */
  function bbCellRing(g, c, r, o, col) {
    if (!(o > 0)) return "";
    return R(g.x + c * g.cell + 3, g.y + r * g.cell + 3, g.cell - 6, g.cell - 6, g.cell * 0.12,
      "none", col || P.gold, 5, { opacity: clamp(o, 0, 1) });
  }

  /* the lesson's own wall and destination pictures, at the kit's own size
     (34 in a 56 square, so 0.607 of a cell). dx, dy and k move and shrink it,
     which is how a destination stays visible when the robot parks on it: the
     lesson's own grid simply hides the target under the robot, and a film whose
     voice says "the robot is at school" has to show the school. */
  function bbOnCell(g, c, r, pic, o, dx, dy, k) {
    if (!(o > 0)) return "";
    return MK.pic(bbX(g, c) + (dx || 0), bbY(g, r) + (dy || 0), g.cell * 0.607 * (k || 1), pic,
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the robot =============================================================
     The kit's own drawing: a teal pool, the gold pointer (0,-30 9,-16 -9,-16)
     turned by ANGLE, and the robot itself, all drawn for a 56-square and scaled
     to whatever square this film is using. ang is in the kit's degrees, so 0 is
     up, 90 right, 180 down, 270 left - and it is UNWRAPPED (see bbRun), so a
     left turn from "down" swings the pointer anticlockwise rather than three
     quarters the other way. */
  function bbRobot(x, y, ang, s, o) {
    if (!(o > 0)) return "";
    return G(C(0, 0, 24, "#35BFB2", null, null, { opacity: 0.35 }) +
      G('<polygon points="0,-30 9,-16 -9,-16" fill="#F4C95D"/>', { transform: "rotate(" + n2(ang) + ")" }) +
      Em(0, 3, 28, "\u{1F916}"),
      { transform: "translate(" + n2(x) + "," + n2(y) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
  }
  /* the pointer alone, for the ghost that shows a predicted facing */
  function bbPointer(x, y, ang, s, o, col) {
    if (!(o > 0)) return "";
    return G('<polygon points="0,-30 9,-16 -9,-16" fill="' + (col || P.gold) + '"/>',
      { transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(ang) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
  }

  /* ==== the rules =============================================================
     The kit's run(): a turn changes the facing only, a move goes one square the
     way DIRS says the facing goes (backwards the opposite way, without
     turning), and a wall or the edge stops it there. Each entry is where the
     robot IS after that command, so entry 0 is the start. */
  function bbRun(lv) {
    var st = { pos: lv.start.slice(), facing: lv.facing }, ang = ART.robo.ANGLE[lv.facing];
    var out = [{ pos: st.pos.slice(), facing: st.facing, ang: ang, cmd: null }];
    (lv.prog || []).forEach(function (cmd) {
      if (cmd === "L") st.facing = ART.robo.TURN_L[st.facing];
      else if (cmd === "R") st.facing = ART.robo.TURN_R[st.facing];
      else {
        var d = ART.robo.DIRS[st.facing], sign = cmd === "F" ? 1 : -1;
        var nc = st.pos[0] + d[0] * sign, nr = st.pos[1] + d[1] * sign;
        var wall = (lv.walls || []).some(function (w) { return w[0] === nc && w[1] === nr; });
        if (!(nc < 0 || nr < 0 || nc >= lv.cols || nr >= lv.rows || wall)) st.pos = [nc, nr];
      }
      /* unwrap the kit's angle to the nearest turn of the pointer */
      var want = ART.robo.ANGLE[st.facing];
      while (want - ang > 180) want -= 360;
      while (ang - want > 180) want += 360;
      ang = want;
      out.push({ pos: st.pos.slice(), facing: st.facing, ang: ang, cmd: cmd });
    });
    return out;
  }
  /* where the robot is after u commands, u a real number: between two commands
     it slides and spins from one to the next */
  function bbWhere(steps, u) {
    if (steps.length < 2) return { c: steps[0].pos[0], r: steps[0].pos[1], ang: steps[0].ang };
    var k = clamp(Math.floor(u), 0, steps.length - 2), f = ease(clamp(u - k, 0, 1));
    var a = steps[k], b = steps[k + 1];
    return { c: lerp(a.pos[0], b.pos[0], f), r: lerp(a.pos[1], b.pos[1], f), ang: lerp(a.ang, b.ang, f) };
  }
  /* how many commands have run by t: from `at`, one every `per` seconds */
  function bbProgress(t, at, steps, per, from) {
    var f = from || 0;
    if (at == null || t < at) return f;
    return clamp(f + (t - at) / per, 0, steps.length - 1);
  }
  /* the robot of a journey, drawn where the run has got to */
  function bbRunRobot(g, steps, u, o, dx, dy, k) {
    var w = bbWhere(steps, u);
    return bbRobot(bbX(g, w.c) + (dx || 0), bbY(g, w.r) + (dy || 0), w.ang, (g.cell / 56) * (k || 1), o);
  }
  /* is the robot standing on this square? */
  function bbOccupied(steps, u, cell) {
    var w = bbWhere(steps, u);
    return Math.abs(w.c - cell[0]) < 0.4 && Math.abs(w.r - cell[1]) < 0.4;
  }
  /* the squares a run passes through, as a list of [c, r] */
  function bbPath(steps) {
    var out = [];
    steps.forEach(function (s) {
      var last = out[out.length - 1];
      if (!last || last[0] !== s.pos[0] || last[1] !== s.pos[1]) out.push(s.pos.slice());
    });
    return out;
  }
  /* a dotted route through those squares, drawn in as u goes 0 -> 1 */
  function bbRoute(g, path, u, col) {
    if (!(u > 0) || path.length < 2) return "";
    var pts = path.map(function (p) { return [bbX(g, p[0]), bbY(g, p[1])]; });
    var total = polyLen(pts), end = polyAt(pts, total * clamp(u, 0, 1));
    var d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]);
    for (var k = 1; k <= end[2]; k++) d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]);
    d += " L" + n2(end[0]) + "," + n2(end[1]);
    return Pth(d, null, col || P.gold, Math.max(3, g.cell * 0.09),
      { "stroke-dasharray": n2(g.cell * 0.04) + " " + n2(g.cell * 0.21), opacity: 0.95 });
  }

  /* ==== the buttons on its back ===============================================
     Drawn rather than set in emoji: this machine's ⬆️ is a blue-and-white tile
     and its ↺ is a thin glyph, and a Grade 2 child has to read these at a
     glance. The words are the kit's own (ART.robo.CMD). */

  function bbArc(r, a0, a1) {
    var p0 = [r * Math.cos(a0 * BB_RAD), r * Math.sin(a0 * BB_RAD)];
    var p1 = [r * Math.cos(a1 * BB_RAD), r * Math.sin(a1 * BB_RAD)];
    return "M" + n2(p0[0]) + "," + n2(p0[1]) + " A" + n2(r) + "," + n2(r) + " 0 " +
      (Math.abs(a1 - a0) > 180 ? 1 : 0) + " " + (a1 > a0 ? 1 : 0) + " " + n2(p1[0]) + "," + n2(p1[1]);
  }
  function bbHead(px, py, ax, ay, hs, col) {
    var a = Math.atan2(ay, ax);
    return Pth("M" + n2(px) + "," + n2(py) +
      " L" + n2(px - Math.cos(a) * hs - Math.sin(a) * hs * 0.62) + "," + n2(py - Math.sin(a) * hs + Math.cos(a) * hs * 0.62) +
      " L" + n2(px - Math.cos(a) * hs + Math.sin(a) * hs * 0.62) + "," + n2(py - Math.sin(a) * hs - Math.cos(a) * hs * 0.62) + " Z",
      col, col, 2);
  }
  /* one command's icon, centred on (0, 0) in a box `size` across */
  function bbIcon(kind, size, col) {
    if (kind === "F" || kind === "B") {
      var h = size * 0.38, up = kind === "F" ? -1 : 1;
      return MK.arrow(0, -h * up, 0, h * up, 1, col, size * 0.15);
    }
    var r = size * 0.29, cw = kind === "R", a0 = cw ? -70 : 250, a1 = cw ? 250 : -70;
    var px = r * Math.cos(a1 * BB_RAD), py = r * Math.sin(a1 * BB_RAD);
    var tx = cw ? -Math.sin(a1 * BB_RAD) : Math.sin(a1 * BB_RAD);
    var ty = cw ? Math.cos(a1 * BB_RAD) : -Math.cos(a1 * BB_RAD);
    return Pth(bbArc(r, a0, a1), null, col, size * 0.13) + bbHead(px, py, tx, ty, size * 0.21, col);
  }
  function bbLabel(kind) {
    return ART.robo.CMD[kind] ? ART.robo.CMD[kind].label : kind;
  }

  /* A button on the robot's back. opt: {o, lit, col, fill, ink} */
  function bbButton(x, y, w, h, kind, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.lit ? (opt.col || P.gold) : P.line, ink = opt.lit ? (opt.col || P.gold) : P.muted;
    var s = Math.min(h * 0.78, w * 0.34);
    return G(R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, opt.lit ? 4 : 2) +
      G(bbIcon(kind, s, ink), { transform: tr(x + h * 0.56, y + h / 2) }) +
      Tx(x + h * 1.02, y + h / 2 + 9, bbLabel(kind), "lab", "start", { fill: opt.lit ? P.ink : P.muted, "font-size": Math.min(26, h * 0.36) }),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, opt.lit ? 1.03 : 1) });
  }

  /* GO and CLEAR: the two the lesson names in capitals. kind is "GO" or "CLEAR". */
  function bbBigButton(x, y, w, h, kind, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var go = kind === "GO", base = go ? P.good : P.bad;
    var col = opt.lit ? base : P.line, ink = opt.lit ? base : P.muted;
    var body = R(x, y, w, h, h * 0.30, opt.lit ? (go ? "#12402F" : "#3E1E1E") : P.cell, col, opt.lit ? 4 : 2);
    var gx = x + h * 0.58, gy = y + h / 2, gs = h * 0.34;
    if (go) body += Pth("M" + n2(gx - gs * 0.55) + "," + n2(gy - gs) + " L" + n2(gx + gs * 0.8) + "," + n2(gy) +
      " L" + n2(gx - gs * 0.55) + "," + n2(gy + gs) + " Z", ink, ink, 2);
    else body += Pth("M" + n2(gx - gs * 0.8) + "," + n2(gy - gs * 0.6) + " L" + n2(gx + gs * 0.8) + "," + n2(gy + gs * 0.6) +
      " M" + n2(gx + gs * 0.8) + "," + n2(gy - gs * 0.6) + " L" + n2(gx - gs * 0.8) + "," + n2(gy + gs * 0.6), null, ink, h * 0.13);
    body += Tx(x + h * 1.05, y + h / 2 + 10, kind, "lab", "start", { fill: opt.lit ? P.ink : P.muted, "font-size": Math.min(30, h * 0.40) });
    return G(body, { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, opt.lit ? 1.03 : 1) });
  }

  /* ==== the memory: the presses the robot is holding ==========================
     One chip per press, in the order they were pressed. A chip that is running
     is gold; a chip left over from an old program is drawn quieter. */
  function bbChip(x, y, w, h, kind, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.now ? P.gold : opt.old ? "#7E6A52" : P.line;
    var ink = opt.now ? P.gold : opt.old ? P.muted : P.ink;
    var s = Math.min(h * 0.46, w * 0.46);
    var body = R(x, y, w, h, h * 0.24, opt.now ? "#3A3016" : P.cell, col, opt.now ? 4 : 2) +
      G(bbIcon(kind, s, ink), { transform: tr(x + w / 2, y + h * 0.36) }) +
      Tx(x + w / 2, y + h * 0.86, bbLabel(kind), "lab small", "middle", { fill: ink });
    /* which press this is, in the order they were pressed */
    if (opt.n != null) body += C(x + 17, y + 17, 12, P.card, col, 2) +
      Tx(x + 17, y + 23, String(opt.n), "lab small", "middle", { fill: ink });
    return G(body, { opacity: clamp(o, 0, 1) * (opt.old ? 0.75 : 1), transform: around(x + w / 2, y + h / 2, opt.now ? 1.05 : 1) });
  }

  /* A strip of chips inside (x, y, w, h). items: [{kind, o, now, old}]. `slots`
     fixes the chip width when the strip is still filling up, so the chips do
     not shuffle sideways as they arrive. */
  function bbStrip(x, y, w, h, items, slots) {
    var n = Math.max(slots || items.length, 1), gap = Math.min(14, w * 0.03);
    var cw = (w - (n - 1) * gap) / n, out = "";
    items.forEach(function (it, k) {
      out += bbChip(x + k * (cw + gap), y, cw, h, it.kind, it);
    });
    return out;
  }
  /* the empty tray the chips land in */
  function bbTray(x, y, w, h, label, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 18, "rgba(23,56,79,0.55)", P.line, 2, { "stroke-dasharray": "12 9" }) +
      (label ? Tx(x + 16, y - 14, label, "lab small caps muted", "start") : ""), { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title =============================================================
     The whole lesson in one picture: a mat, the robot on it, the shop it is
     going to, and the buttons that get it there. In the spoken title chapter
     the squares wipe in on "a grid of squares", the robot pops on "A floor
     robot", the four buttons on "Press its buttons", GO lights on "press GO",
     and on "off it goes" the robot drives the lesson's own Journey 2 route -
     forward, forward, turn right, forward, forward - to the shop. On the two
     cards it stands at the shop with its route behind it. */
  var BB_TG = { x: 52, y: 28, cell: 64, cols: 4, rows: 4 };
  var BB_TITLE_RUN = bbRun({ start: [0, 3], facing: "up", prog: ["F", "F", "R", "F", "F"], cols: 4, rows: 4 });
  var BB_TITLE_PATH = bbPath(BB_TITLE_RUN);

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cGrid = sn ? sc(sn, 0, "grid") : null, cRobot = sn ? sc(sn, 0, "robot") : null;
    var cBtn = sn ? sc(sn, 1, "buttons") : null, cGo = sn ? sc(sn, 1, "go") : null, cOff = sn ? sc(sn, 1, "off") : null;

    var occ = bbOccupied(BB_TITLE_RUN, sn ? bbProgress(t, cOff, BB_TITLE_RUN, 0.62) : BB_TITLE_RUN.length - 1, [2, 1]);
    out += bbGrid(BB_TG, 0.4, {});
    out += bbGrid(BB_TG, 1, { at: sn ? cGrid : null, t: t });
    out += bbOnCell(BB_TG, 2, 1, "\u{1F3EA}", sn ? popIn(t, cGrid, 0.6) : 1,
      occ ? -11 : 0, occ ? -11 : 0, occ ? 0.76 : 1);

    var u = sn ? bbProgress(t, cOff, BB_TITLE_RUN, 0.62) : BB_TITLE_RUN.length - 1;
    out += bbRoute(BB_TG, BB_TITLE_PATH, sn ? on(t, cOff, 1.1) : 1, P.gold);
    out += bbRunRobot(BB_TG, BB_TITLE_RUN, u, sn ? popIn(t, cRobot, 0.45) : 1,
      occ ? 11 : 0, occ ? 11 : 0, occ ? 0.84 : 1);

    /* the four buttons, then GO */
    var bp = sn ? popIn(t, cBtn, 0.45) : 1, gp = sn ? popIn(t, cGo, 0.4) : 1;
    ["F", "B", "L", "R"].forEach(function (kind, k) {
      out += G(MK.pop(R(0, 0, 46, 46, 14, P.cell, P.line, 2) + G(bbIcon(kind, 30, P.ink), { transform: tr(23, 23) }),
        23, 23, bp), { transform: tr(52 + k * 54, 300) });
    });
    out += G(MK.pop(R(0, 0, 82, 46, 16, gp > 0 ? "#12402F" : P.cell, P.good, 3) +
      Tx(41, 32, "GO", "lab big good", "middle"), 41, 23, gp), { transform: tr(272, 300) });

    return '<svg viewBox="0 0 360 360" role="img" aria-label="A floor robot on a grid of squares, its route to the shop, and the buttons on its back">' +
      G(out, { transform: tr(0, 0) }) + "</svg>";
  }

  /* ==== Loops in Algorithms, part 2: counting the turns, and no count at all ==
     tools/lib/film-scenes/computing-g4/loops-in-algorithms-2.js. See the
     header of loops-in-algorithms.js.

     Both chapters read their turns off ART.algo.flatten, the lesson's own
     unroller: the teeth loop gives eight brushing steps in four turns, and the
     traffic-light forever box gives its rounds and then the lesson's own Stop,
     which is the only thing in it that ever ends. */

  /* ==== chapter: counting the turns =========================================
     The lesson's brushing algorithm - put paste on the brush, repeat 4 times
     [brush the top teeth, brush the bottom teeth], rinse - beside the lesson's
     own teeth scene and the counter the loop keeps out of sight. */
  var LP_TEETH_BLOCKS = [
    { id: "paste" },
    { kind: "repeat", times: 4, body: [{ id: "top" }, { id: "bottom" }] },
    { id: "rinse" }
  ];
  var LP_TEETH_FLAT = ART.algo.flatten(LP_TEETH_BLOCKS);
  /* the eight the film says: two steps inside the loop, four turns of it */
  var LP_TEETH_BRUSH = LP_TEETH_FLAT.filter(function (s) { return s.j >= 0; });
  var LP_TEETH_TURNS = LP_TEETH_BLOCKS[1].times;

  var LP_CT = { x: 40, w: 500, rowH: 56, bodyH: 54, bodyGap: 8, gap: 12 };
  var LP_CT_Y = (function () {
    var y = 40, o = { paste: y };
    y += LP_CT.rowH + LP_CT.gap;
    o.box = y;
    y += lpBoxH(2, LP_CT.bodyH, LP_CT.bodyGap) + LP_CT.gap;
    o.rinse = y;
    o.bottom = y + LP_CT.rowH;
    return o;
  })();
  var LP_CT_BX = LP_CT.x + 24, LP_CT_BW = LP_CT.w - 48;
  var LP_TEETH_BOX = { x: 580, y: 46, w: 348, h: 261 };

  function lpCountMain(scene, t) {
    var cRepeat = sc(scene, 0, "repeat"), cTop = sc(scene, 0, "top"),
      cBottom = sc(scene, 0, "bottom"), cRinse0 = sc(scene, 0, "rinse");
    var cCc = sc(scene, 1, "cc"), cCounter = sc(scene, 1, "counter");
    var cOne = sc(scene, 2, "one"), cUp = sc(scene, 2, "up");
    var cFour = sc(scene, 3, "four"), cStops = sc(scene, 3, "stops"), cRinse = sc(scene, 3, "rinse");
    var cIter = sc(scene, 4, "iter"), cCcLoop = sc(scene, 4, "ccLoop");
    var out = "", body = ["top", "bottom"], bodyAt = [cTop, cBottom];

    /* how far round the loop the film has gone, in the lesson's own steps */
    var runFrom = lpLast(t, cOne, cUp);
    var brushed = runFrom != null ? tally(t, cOne, LP_TEETH_BRUSH.length, 4.6)
      : lpPast(t, cBottom) ? 2 : lpPast(t, cTop) ? 1 : 0;
    var step = brushed > 0 ? LP_TEETH_BRUSH[brushed - 1] : null;
    var turn = step ? step.t : 0;
    var finished = lpPast(t, cStops) || brushed >= LP_TEETH_BRUSH.length;
    var rinsed = lpPast(t, cRinse);

    /* the algorithm */
    var show = on(t, cRepeat, 0.5);
    out += lpRow(LP_CT.x, LP_CT_Y.paste, LP_CT.w, LP_CT.rowH, 1, "paste", { o: show });
    out += lpBox(LP_CT.x, LP_CT_Y.box, LP_CT.w, 2, LP_CT.bodyH, LP_CT.bodyGap,
      { o: show, kind: "repeat", times: LP_TEETH_TURNS, turn: turn || null,
        col: finished ? P.good : P.gold });
    body.forEach(function (id, k) {
      var by = lpBoxTop(LP_CT_Y.box, k, LP_CT.bodyH, LP_CT.bodyGap);
      var live = !finished && step && step.j === k;
      out += lpRow(LP_CT_BX, by, LP_CT_BW, LP_CT.bodyH, k + 2, id,
        { o: Math.max(show * 0.55, on(t, bodyAt[k], 0.4)), col: live ? P.gold : null,
          fill: live ? "#1B3A52" : null });
      out += MK.ripple(LP_CT_BX + 38, by + LP_CT.bodyH / 2, t, bodyAt[k], P.gold);
    });
    out += lpRow(LP_CT.x, LP_CT_Y.rinse, LP_CT.w, LP_CT.rowH, 4, "rinse",
      { o: Math.max(show * 0.55, on(t, cRinse0, 0.4)), col: rinsed ? P.good : null,
        mark: rinsed ? "tick" : null, markP: popIn(t, cRinse, 0.35) });
    /* the row brightens from 0.55 as "Then rinse" is said, which on its own is
       a change the eye can miss: the tap says which row it is */
    out += MK.ripple(LP_CT.x + 38, LP_CT_Y.rinse + LP_CT.rowH / 2, t, cRinse0, P.gold);
    /* the loop is done and the algorithm carries on */
    out += MK.arrow(LP_CT.x + LP_CT.w / 2, LP_CT_Y.box + lpBoxH(2, LP_CT.bodyH, LP_CT.bodyGap) + 2,
      LP_CT.x + LP_CT.w / 2, LP_CT_Y.rinse - 3, on(t, cStops, 0.5), P.good, 7);

    /* the lesson's own teeth scene, given the steps that have been done */
    var ids = [];
    if (lpPast(t, cRepeat)) ids.push("paste");
    if (brushed > 0) ids.push("brush");
    if (rinsed) ids.push("rinse");
    out += G(ART.place(ART.scene("teeth", ids), LP_TEETH_BOX.x, LP_TEETH_BOX.y, LP_TEETH_BOX.w, LP_TEETH_BOX.h) +
      R(LP_TEETH_BOX.x, LP_TEETH_BOX.y, LP_TEETH_BOX.w, LP_TEETH_BOX.h, 8, "none", P.line, 3),
      { opacity: on(t, cRepeat, 0.6) });

    /* the counter: it arrives when the film says the loop has one */
    var cnt = on(t, cCounter, 0.5);
    out += lpCounter(1042, 150, 70, LP_TEETH_TURNS, turn, cnt,
      { col: finished ? P.good : P.gold, label: "counter" });
    if (bump(t, cCc, 1.6) > 0.02)
      out += R(LP_CT.x - 6, LP_CT_Y.box - 6, LP_CT.w + 12, lpBoxH(2, LP_CT.bodyH, LP_CT.bodyGap) + 12,
        24, "none", P.ink, 3, { opacity: bump(t, cCc, 1.6) });
    if (bump(t, cFour, 1.8) > 0.02) out += MK.glow(1042, 150, 106, P.good, bump(t, cFour, 1.8));
    out += Tx(1042, 340, "one, two, three, four", "lab mid muted readable", "middle",
      { opacity: on(t, cUp, 0.5).toFixed(3) });
    /* the lesson's own closing word for this: each time round the loop, said
       once the loop has already stopped and been rinsed, so the algorithm and
       the counter on screen are exactly what "iteration" names. Placed in the
       open band under the box and the dial's count-up line - the space beside
       the dial is too narrow for a pill this long (it would run past x=1168,
       over the teeth scene box beside it). */
    out += MK.pill(584, 400, "one time round = one iteration", on(t, cIter, 0.5),
      { size: 24, col: P.blue, ink: P.blue });
    if (bump(t, cCcLoop, 1.6) > 0.02)
      out += R(LP_CT.x - 6, LP_CT_Y.box - 6, LP_CT.w + 12, lpBoxH(2, LP_CT.bodyH, LP_CT.bodyGap) + 12,
        24, "none", P.ink, 3, { opacity: bump(t, cCcLoop, 1.6) });
    return out;
  }

  /* the last beat: the eight steps the four turns actually make, two columns
     of four, straight out of ART.algo.flatten */
  var LP_EIGHT = { colX: [560, 880], y: 96, rowH: 74, tileW: 190, tileH: 58 };
  function lpCountEight(scene, t) {
    var cTwo = sc(scene, 5, "two"), cTurns = sc(scene, 5, "turns"), cEight = sc(scene, 5, "eight");
    var out = "", head = on(t, cTwo, 0.5), rows = on(t, cTurns, 0.5);
    /* the empty grid arrives with the chapter's own crossfade. Waiting for the
       first cue left about a third of a second with the previous picture gone
       and nothing yet in its place. */
    var appear = Math.max(into(t, scene.first + 5), rows);
    out += Tx(LP_EIGHT.colX[0], 62, "brush the top teeth", "lab", "middle", { opacity: head.toFixed(3) });
    out += Tx(LP_EIGHT.colX[1], 62, "brush the bottom teeth", "lab", "middle", { opacity: head.toFixed(3) });
    var n = tally(t, cTurns, LP_TEETH_BRUSH.length, 1.6);
    LP_TEETH_BRUSH.forEach(function (s, k) {
      var col = s.j, row = s.t - 1;
      var x = LP_EIGHT.colX[col] - LP_EIGHT.tileW / 2, y = LP_EIGHT.y + row * LP_EIGHT.rowH;
      var p = k < n ? 1 : 0;
      out += G(R(x, y, LP_EIGHT.tileW, LP_EIGHT.tileH, 16, p ? "#1B3A52" : P.cell, p ? P.gold : P.line, p ? 3 : 2) +
        Em(x + LP_EIGHT.tileW / 2, y + LP_EIGHT.tileH / 2, 34, "\u{1F9B7}"),
        { opacity: (0.34 + 0.66 * p) * appear });
    });
    for (var r = 0; r < LP_TEETH_TURNS; r++)
      out += Tx(246, LP_EIGHT.y + r * LP_EIGHT.rowH + 38, "time " + (r + 1) + " of " + LP_TEETH_TURNS,
        "lab", "start", { fill: P.gold, opacity: rows.toFixed(3) });
    out += MK.pill(584, 416, "eight brushing steps in all", on(t, cEight, 0.5),
      { size: 26, col: P.good, ink: P.good });
    return out;
  }

  function lpCountChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "";
    if (u < 1) out += G(lpCountMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(lpCountEight(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: a loop with no count =======================================
     The lesson's traffic lights. The forever box holds the four signals and no
     number; flattening it gives the rounds and then the lesson's own Stop,
     which is the only step in the whole thing that ever ends it. */
  var LP_LIGHT_BODY = ["red", "redamber", "green", "amber"];
  var LP_LIGHT_BLOCKS = [{ kind: "forever", body: LP_LIGHT_BODY.map(function (id) { return { id: id }; }) }];
  var LP_LIGHT_FLAT = ART.algo.flatten(LP_LIGHT_BLOCKS);
  /* the lesson puts its Stop at the end of a forever box, and nowhere else */
  var LP_LIGHT_STOP = LP_LIGHT_FLAT[LP_LIGHT_FLAT.length - 1];

  /* which lamps each signal lights */
  var LP_LAMPS = { red: [1, 0, 0], redamber: [1, 1, 0], green: [0, 0, 1], amber: [0, 1, 0] };
  var LP_FV = { x: 40, w: 470, rowH: 52, gap: 7 };
  var LP_FV_BOX_Y = 34, LP_FV_BX = LP_FV.x + 24, LP_FV_BW = LP_FV.w - 48;
  var LP_FV_H = lpBoxH(4, LP_FV.rowH, LP_FV.gap);

  /* a traffic light on its pole: three lamps, red at the top */
  function lpTrafficLight(cx, top, on3, o) {
    if (!(o > 0)) return "";
    var w = 118, h = 292, lampR = 36, out = "";
    out += R(cx - 13, top + h - 6, 26, 66, 6, "#4A6376");
    out += R(cx - w / 2, top, w, h, 22, "#20303C", "#0B1D2C", 4);
    ["red", "amber", "green"].forEach(function (name, k) {
      var cy = top + 56 + k * 92, lit = on3 && on3[k];
      if (lit) out += MK.glow(cx, cy, lampR * 2.1, LP_LIGHT[name], 0.9);
      out += C(cx, cy, lampR, lit ? LP_LIGHT[name] : LP_LIGHT.off, "#0B1D2C", 3);
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function lpForeverMain(scene, t) {
    var cLights = sc(scene, 0, "lights"), cRed = sc(scene, 0, "red"), cRa = sc(scene, 0, "ra"),
      cGreen = sc(scene, 0, "green"), cAmber = sc(scene, 0, "amber");
    var cForever = sc(scene, 1, "forever"), cNoCount = sc(scene, 1, "nocount");
    var cNoEnd = sc(scene, 2, "noend"), cOutside = sc(scene, 2, "outside");
    var out = "";

    /* beat 0 names the four signals one at a time; after that the loop simply
       goes round, as it would on the road */
    var named = lpPast(t, cAmber) ? 3 : lpPast(t, cGreen) ? 2 : lpPast(t, cRa) ? 1 : lpPast(t, cRed) ? 0 : -1;
    var free = lpPast(t, cForever);
    var idx = free ? (Math.floor((t - BEATS[scene.first + 1].start) / 1.25) + 4) % 4 : named;
    var round = free ? 2 + Math.floor((t - BEATS[scene.first + 1].start) / 5.0) : 1;

    out += lpBox(LP_FV.x, LP_FV_BOX_Y, LP_FV.w, 4, LP_FV.rowH, LP_FV.gap,
      { o: on(t, cLights, 0.5), kind: "forever", times: null, turn: free ? round : null, col: P.accent });
    LP_LIGHT_BODY.forEach(function (id, k) {
      var by = lpBoxTop(LP_FV_BOX_Y, k, LP_FV.rowH, LP_FV.gap);
      var live = idx === k;
      out += lpRow(LP_FV_BX, by, LP_FV_BW, LP_FV.rowH, k + 1, id,
        { o: on(t, cLights, 0.5), col: live ? P.accent : null, fill: live ? "#3A2A28" : null, fs: 21 });
    });
    /* the way back to the first step, which is all a forever box has */
    var loopO = on(t, cNoEnd, 0.6);
    if (loopO > 0) {
      var ax = LP_FV_BX + LP_FV_BW + 12, bend = ax + 50;
      var y1 = lpBoxTop(LP_FV_BOX_Y, 3, LP_FV.rowH, LP_FV.gap) + LP_FV.rowH / 2;
      var y0 = lpBoxTop(LP_FV_BOX_Y, 0, LP_FV.rowH, LP_FV.gap) + LP_FV.rowH / 2;
      out += G(Pth("M" + n2(ax) + "," + n2(y1) + " C" + n2(bend) + "," + n2(y1) + " " +
        n2(bend) + "," + n2(y0) + " " + n2(ax) + "," + n2(y0), null, P.accent, 5) +
        Pth("M" + n2(ax) + "," + n2(y0) + " L" + n2(ax + 15) + "," + n2(y0 - 10) + " L" +
          n2(ax + 15) + "," + n2(y0 + 10) + " Z", P.accent, P.accent, 2), { opacity: loopO });
    }
    /* the Stop the lesson itself puts at the end of a forever box */
    var st = on(t, cOutside, 0.5);
    out += lpRow(LP_FV.x, LP_FV_BOX_Y + LP_FV_H + 12, LP_FV.w, LP_FV.rowH, null, "stop",
      { o: st, col: P.good, fs: 21 });

    /* the lights themselves */
    out += lpTrafficLight(700, 46, idx >= 0 ? LP_LAMPS[LP_LIGHT_BODY[idx]] : [0, 0, 0], on(t, cLights, 0.6));
    /* the counter a forever loop has not got */
    var nc = on(t, cNoCount, 0.5);
    out += lpCounter(980, 150, 68, null, 0, nc, { label: "no counter at all" });
    out += MK.cross(980, 150, 40, popIn(t, cNoCount == null ? null : cNoCount + 0.35, 0.4));
    if (bump(t, cForever, 1.6) > 0.02)
      out += R(LP_FV.x - 6, LP_FV_BOX_Y - 6, LP_FV.w + 12, LP_FV_H + 12, 24, "none", P.ink, 3,
        { opacity: bump(t, cForever, 1.6) });
    return out;
  }

  /* beats 3 and 4: what stops it, and that forever is not broken */
  var LP_STOPPERS = [
    { label: "a switch", draw: "switch" },
    { label: "a person", pic: "\u{1F9D2}" },
    { label: "a power cut", draw: "plug" }
  ];
  function lpSwitch(cx, cy, size) {
    var s = size / 44;
    return G(R(-20, -12, 40, 24, 12, "#20303C", "#93AABE", 3) + C(-8, 0, 9, "#F0806F", "#93AABE", 2),
      { transform: tr(cx, cy, s) });
  }
  /* a plug pulled out of its socket: a power cut, which the plug emoji on
     this machine does not read as */
  function lpPlugOut(cx, cy, size) {
    var s = size / 46;
    return G(R(-26, -17, 22, 34, 5, "#20303C", "#93AABE", 2.6) +
      C(-19, -6, 2.8, "#93AABE") + C(-19, 6, 2.8, "#93AABE") +
      R(6, -15, 18, 30, 5, "#B9C8D6", "#5A7387", 2.4) +
      L(-1, -6, 6, -6, "#B9C8D6", 3.4) + L(-1, 6, 6, 6, "#B9C8D6", 3.4) +
      Pth("M24,0 q12,4 13,-9", null, "#5A7387", 3), { transform: tr(cx, cy, s) });
  }
  function lpStopCard(x, y, w, h, item, o) {
    if (!(o > 0)) return "";
    var body = R(x, y, w, h, 22, P.cell, P.good, 3) +
      (item.draw === "switch" ? lpSwitch(x + 72, y + h / 2, 62)
        : item.draw === "plug" ? lpPlugOut(x + 72, y + h / 2, 60)
        : Em(x + 72, y + h / 2, 58, item.pic)) +
      Tx(x + 132, y + h / 2 + 10, item.label, "lab big", "start");
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }
  function lpForeverStop(scene, t) {
    var cSw = sc(scene, 3, "sw"), cPers = sc(scene, 3, "pers"), cPow = sc(scene, 3, "pow"),
      cIndef = sc(scene, 3, "indef");
    var cBroken = sc(scene, 4, "broken"), cClocks = sc(scene, 4, "clocks"), cGoing = sc(scene, 4, "going");
    var out = "", at = [cSw, cPers, cPow];
    LP_STOPPERS.forEach(function (item, k) {
      out += lpStopCard(40, 26 + k * 130, 440, 114, item, popIn(t, at[k], 0.4));
    });
    out += MK.pill(836, 44, "an indefinite loop: no set number", on(t, cIndef, 0.5),
      { size: 24, col: P.accent, ink: P.accent });
    /* "does not mean broken": the word itself, crossed out */
    out += MK.pill(788, 114, "broken", on(t, cBroken, 0.5), { size: 24, col: P.bad, ink: P.bad });
    out += MK.cross(898, 114, 26, popIn(t, cBroken == null ? null : cBroken + 0.3, 0.4));
    /* the two the lesson names beside traffic lights */
    var keep = [{ pic: "⏰", label: "a clock" }, { pic: "\u{1F3AE}", label: "a game" }];
    keep.forEach(function (c, k) {
      var p = popIn(t, cClocks == null ? null : cClocks + k * 0.35, 0.4);
      if (!(p > 0)) return;
      var x = 560 + k * 296;
      out += G(R(x, 166, 256, 188, 24, P.cell, P.teal, 3) + Em(x + 128, 238, 76, c.pic) +
        Tx(x + 128, 324, c.label, "lab big", "middle"),
        { transform: around(x + 128, 260, Math.min(1.06, p)), opacity: Math.min(1, p) });
    });
    out += MK.pill(836, 398, "meant to keep going", on(t, cGoing, 0.5), { size: 25, col: P.good, ink: P.good });
    return out;
  }

  function lpForeverChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(lpForeverMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(lpForeverStop(scene, t), { opacity: u });
    return svg(out);
  }

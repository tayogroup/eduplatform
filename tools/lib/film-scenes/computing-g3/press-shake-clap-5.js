  /* ==== Press, Shake, Clap, part 5: computers control machines ================
     tools/lib/film-scenes/computing-g3/press-shake-clap-5.js. See the header of
     press-shake-clap.js.

     The lesson's four machines, drawn rather than borrowed: the kit has no
     drawing of a lift or a washing machine, and this film's own rule is that
     if the words name a colour, a side or a number the picture shows it - so
     the traffic lights go red, then amber, then green, in that order, and the
     lift climbs to the floor whose button is lit. Each one animates as it is
     named and has finished by the end of its beat. */

  /* All four cards stand there from the start, empty and faint, and each one
     fills as its machine is named: four dim slots read as "four machines
     coming", where one card alone in the left corner reads as a mistake. */
  function psTile(x, y, w, h, label, o, inner) {
    var k = clamp(o == null ? 1 : o, 0, 1);
    return G(R(x, y, w, h, 22, P.card, P.line, 2), { opacity: 0.34 + 0.66 * k }) +
      (k > 0 ? G(inner + Tx(x + w / 2, y + h - 18, label, "lab mid muted readable", "middle"),
        { opacity: k, transform: around(x + w / 2, y + h / 2, 0.94 + 0.06 * k) }) : "");
  }

  /* red, then amber, then green: the order the lesson's own step gives */
  function psTraffic(x, y, w, h, u) {
    var cx = x + w / 2, top = y + 24, lamp = 26, gap = 14;
    var step = u <= 0 ? -1 : u < 0.34 ? 0 : u < 0.67 ? 1 : 2;
    var cols = ["#E5484D", "#F4C95D", "#4FD1A0"], out = "";
    out += R(cx - 46, top, 92, lamp * 3 + gap * 4, 16, P.dark, P.edge, 3) +
      R(cx - 9, top + lamp * 3 + gap * 4, 18, 46, 4, P.edge);
    for (var k = 0; k < 3; k++) {
      var lit = k === step;
      out += C(cx, top + gap + lamp / 2 + k * (lamp + gap), lamp / 2, lit ? cols[k] : "#17384F", lit ? cols[k] : P.line, 2);
      if (lit) out += MK.glow(cx, top + gap + lamp / 2 + k * (lamp + gap), 34, cols[k], 0.9);
    }
    return out;
  }

  /* a shop front: a fascia with the sensor on it, and two glass doors that
     slide apart. Wide rather than tall, so it cannot be mistaken for the
     lift two tiles along. */
  function psDoor(x, y, w, h, u) {
    var fw = 190, fh = 118, fx = x + w / 2 - fw / 2, fy = y + 96, cx = x + w / 2;
    /* the two panels stay inside the doorway and narrow as they slide into it,
       which is how a door is drawn small: a dark gap opens down the middle */
    var pw = (fw / 2) * (1 - 0.46 * ease(u));
    var out = R(fx - 18, fy - 48, fw + 36, 40, 8, P.dark, P.edge, 3) +
      R(fx - 10, fy - 6, fw + 20, fh + 14, 6, P.body, P.edge, 4) + R(fx, fy, fw, fh, 2, "#0A1B27") +
      R(fx, fy, pw, fh, 2, "#2E5B78", P.plastic, 2.5) +
      R(fx + fw - pw, fy, pw, fh, 2, "#2E5B78", P.plastic, 2.5) +
      L(fx + pw - 11, fy + 34, fx + pw - 11, fy + 84, P.plastic, 4) +
      L(fx + fw - pw + 11, fy + 34, fx + fw - pw + 11, fy + 84, P.plastic, 4);
    /* the sensor on the fascia, and the two arcs it looks down with */
    out += C(cx, fy - 28, 9, u > 0 ? P.good : P.muted, P.edge, 2);
    if (u > 0) {
      for (var k = 1; k <= 2; k++) {
        var rr = 12 + k * 9;
        out += Pth("M" + n2(cx - rr * 0.8) + "," + n2(fy - 28 + rr * 0.6) +
          " A" + n2(rr) + "," + n2(rr) + " 0 0 0 " + n2(cx + rr * 0.8) + "," + n2(fy - 28 + rr * 0.6),
          null, P.good, 3, { opacity: 0.8 - k * 0.2 });
      }
    }
    return out;
  }

  /* a drum with washing in it, turning and stopping */
  function psWasher(x, y, w, h, u) {
    var cx = x + w / 2, cy = y + 128, r = 52;
    var out = R(cx - 80, y + 36, 160, 162, 14, P.plastic, P.edge, 3) +
      R(cx - 64, y + 46, 76, 16, 6, P.dark);
    for (var d = 0; d < 3; d++) out += C(cx + 28 + d * 17, y + 54, 5, P.dark);
    out += C(cx, cy, r, "#0A1B27", P.edge, 4) + C(cx, cy, r - 10, "#16405A", P.line, 2);
    var a = ease(u) * 720, wash = "";
    [["#F4C95D", 0], ["#6E9DE8", 2.1], ["#F0806F", 4.2]].forEach(function (c) {
      wash += R(cx + Math.cos(c[1]) * 20 - 13, cy + Math.sin(c[1]) * 20 - 9, 26, 18, 8, c[0]);
    });
    out += G(wash, { transform: "rotate(" + n2(a) + " " + n2(cx) + " " + n2(cy) + ")", opacity: 0.9 });
    return out;
  }

  /* a lift that climbs to floor 3, with the floors numbered beside the shaft
     and the button that was pressed lit */
  function psLift(x, y, w, h, u, lit) {
    var sx = x + w / 2 - 28, sy = y + 34, sw = 86, sh = 156, car = 40, fl = sh / 3;
    var out = R(sx - 6, sy - 6, sw + 12, sh + 12, 8, P.dark, P.edge, 3) + R(sx, sy, sw, sh, 2, "#0A1B27");
    for (var k = 0; k < 3; k++) {
      out += L(sx, sy + fl * (k + 1), sx + sw, sy + fl * (k + 1), P.line, 1.5);
      out += Tx(sx - 16, sy + fl * k + fl / 2 + 7, String(3 - k), "lab", "middle", { fill: P.muted, "font-size": 19 });
    }
    var floorY = function (n) { return sy + sh - (n - 1) * fl - car - 8; };
    var cy = lerp(floorY(1), floorY(3), ease(u));
    out += R(sx + 10, cy, sw - 20, car, 4, P.plastic, P.edge, 2) + L(sx + sw / 2, cy, sx + sw / 2, cy + car, P.edge, 2);
    out += C(sx + sw + 24, sy + 20, 15, lit > 0 ? P.gold : P.cell, P.edge, 2.5) +
      Tx(sx + sw + 24, sy + 26, "3", "lab", "middle", { fill: lit > 0 ? P.dark : P.muted, "font-size": 19 });
    return out;
  }

  /* the small computer the lesson says is inside each one */
  function psInsideChip(cx, cy, p) {
    if (!(p > 0)) return "";
    return MK.pop(psChip({ cx: cx, cy: cy, r: 13 }, 0) + C(cx, cy, 5, P.good), cx, cy, p);
  }

  var PS_TILES = [
    { label: "traffic lights", draw: psTraffic },
    { label: "an automatic door", draw: psDoor },
    { label: "a washing machine", draw: psWasher },
    { label: "a lift", draw: psLift }
  ];
  var PS_TILE = { y: 66, w: 262, h: 254, gap: 30 };
  function psTileX(k) { return 22 + k * (PS_TILE.w + PS_TILE.gap); }

  /* the first beat: a program on a screen, and an arrow out of it */
  function psMachinesScreen(scene, t) {
    var cScreens = sc(scene, 0, "screens"), cMoves = sc(scene, 0, "moves");
    var out = "", o = on(t, cScreens, 0.5);
    out += psScreen(300, 96, 300, o);
    ["light", "beep", "motor"].forEach(function (id, k) {
      out += psBlock(322, 118 + k * 56, 256, 48, id, on(t, cScreens == null ? null : cScreens + 0.2 + k * 0.16, 0.4));
    });
    out += MK.arrow(646, 200, 828, 200, on(t, cMoves, 0.6), P.good, 10);
    var sp = psSpin(t, cMoves, 1.3);
    out += G(Em(0, 0, 90, "⚙️"), { transform: tr(900, 200) + " rotate(" + n2(sp) + ")", opacity: on(t, cMoves, 0.5) });
    out += MK.pill(450, 372, "not only a screen", o, { size: 24, col: P.muted, ink: P.muted });
    out += MK.pill(900, 372, "a real thing moves", on(t, cMoves, 0.5), { size: 24, col: P.good, ink: P.good });
    return out;
  }

  function psMachinesTiles(scene, t) {
    var cMotor = sc(scene, 1, "motor");
    var cTraffic = sc(scene, 1, "traffic"), cDoor = sc(scene, 1, "door");
    var cWashing = sc(scene, 2, "washing"), cLift = sc(scene, 2, "lift"), cFloor = sc(scene, 2, "floor");
    var cInside = sc(scene, 3, "inside"), cFollowing = sc(scene, 3, "following");
    var at = [cTraffic, cDoor, cWashing, cLift], out = "";
    /* "Through a motor or a switch" names the mechanism, before "traffic
       lights" and "a door" name two things it drives: a small gear turns
       once, above the spot the traffic-lights tile is about to fill, and has
       settled and faded by the time that tile starts to fill - so "motor"
       moves something of its own rather than borrowing the traffic tile's
       cue. */
    var mIn = on(t, cMotor, 0.3), mOut = 1 - on(t, cTraffic, 0.4);
    var mo = Math.min(mIn, Math.max(0, mOut));
    if (mo > 0) {
      var mx = psTileX(0) + PS_TILE.w / 2, my = PS_TILE.y - 28;
      out += G(Em(0, 0, 38, "⚙️"),
        { transform: tr(mx, my) + " rotate(" + n2(psSpin(t, cMotor, 0.8)) + ")", opacity: mo });
    }
    PS_TILES.forEach(function (tile, k) {
      var x = psTileX(k), u = on(t, at[k], 1.5), o = on(t, at[k] == null ? null : at[k] - 0.15, 0.45);
      var inner = k === 3 ? tile.draw(x, PS_TILE.y, PS_TILE.w, PS_TILE.h, u, on(t, cFloor, 0.4))
        : tile.draw(x, PS_TILE.y, PS_TILE.w, PS_TILE.h, u);
      out += psTile(x, PS_TILE.y, PS_TILE.w, PS_TILE.h, tile.label, o, inner);
      out += psInsideChip(x + PS_TILE.w - 30, PS_TILE.y + 26, popIn(t, cInside == null ? null : cInside + k * 0.14, 0.4));
    });
    out += MK.pill(584, 380, "inside each one: a computer following a program",
      on(t, cFollowing, 0.5), { size: 24, col: P.good, ink: P.good });
    return out;
  }

  function psMachinesChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(psMachinesScreen(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(psMachinesTiles(scene, t), { opacity: u });
    return svg(out);
  }

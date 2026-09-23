  /* ==== Electricity and Circuits, part 2 ======================================
     The hardware this film has to draw itself, and the chapter "What
     electricity does".

     The lesson draws a circuit and nothing else electrical, so the socket, the
     plug's home, the light switch, the power lines, the broken wire and the
     torch are drawn here rather than borrowed - and drawn rather than left to
     an emoji, because this machine's emoji are not to be trusted for a thing
     that must look exact (the brief's rule 5). The appliances in the row below
     ARE the lesson's own pictures: its bulb, its kettle icon, its frying pan,
     its fridge icon, its car and its radio. */

  /* ---- a wall socket, face on ------------------------------------------------ */
  function ecSocket(cx, cy, size, o) {
    if (!(o > 0)) return "";
    var w = size, h = size * 0.9, dk = "#16242F";
    var g = R(-w / 2, -h / 2, w, h, size * 0.11, "#E6ECF2", "#93AABE", 4) +
      R(-w / 2 + size * 0.05, -h / 2 + size * 0.045, w - size * 0.1, h - size * 0.09, size * 0.08, "none", "#C6D3DE", 2) +
      R(-w * 0.045, -h * 0.36, w * 0.09, h * 0.22, 3, dk) +
      R(-w * 0.33, h * 0.02, w * 0.21, h * 0.08, 3, dk) +
      R(w * 0.12, h * 0.02, w * 0.21, h * 0.08, 3, dk) +
      C(-w * 0.41, h * 0.0, size * 0.03, "#93AABE") + C(w * 0.41, h * 0.0, size * 0.03, "#93AABE");
    return G(g, { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* ---- a plug for that socket -------------------------------------------------
     The lesson's own picture for a plug is the plug emoji, and this machine
     draws that as a two-round-pin plug with its pins pointing UP - which
     cannot go into the three-hole socket above it, and was slid up beside the
     socket's face and stopped there, so "Only a plug goes in a socket" was
     said over a plug that visibly neither fitted nor went in. So the plug is
     drawn here too (rule 5), with the socket's own three holes as its three
     pins: (cx, cy) is the PIN TIPS' plane and the pins point LEFT, so sliding
     cx to the socket's face and drawing the socket on top of it puts the plug
     in, body flush against the face, pins out of sight inside. */
  function ecPlugPic(cx, cy, size, o) {
    if (!(o > 0)) return "";
    var pin = size * 0.26, pw = Math.max(5, size * 0.075), w = size * 0.86, h = size * 0.72;
    var g = "", bx = cx + pin;
    /* three pins: the earth pin on top and a little longer, as it is on a plug */
    g += R(cx, cy - h * 0.30 - pw / 2, pin * 1.2, pw, pw * 0.35, "#C9D4DE", "#8FA3B5", 2);
    g += R(cx + pin * 0.2, cy + h * 0.06 - pw / 2, pin, pw, pw * 0.35, "#C9D4DE", "#8FA3B5", 2);
    g += R(cx + pin * 0.2, cy + h * 0.30 - pw / 2, pin, pw, pw * 0.35, "#C9D4DE", "#8FA3B5", 2);
    /* the body, and the cable out of the back of it */
    g += Pth("M" + n2(bx + w) + "," + n2(cy + h * 0.16) + " q" + n2(size * 0.26) + ",0 " +
      n2(size * 0.36) + "," + n2(-size * 0.26), null, "#33566F", Math.max(6, size * 0.1));
    g += R(bx, cy - h / 2, w, h, size * 0.13, "#E6ECF2", "#93AABE", 4);
    g += R(bx + w * 0.17, cy - h * 0.29, w * 0.52, h * 0.58, size * 0.07, "none", "#C6D3DE", 2);
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a light switch on the wall -------------------------------------------- */
  function ecSwitchPlate(cx, cy, size, up, o) {
    if (!(o > 0)) return "";
    var w = size * 0.78, h = size;
    var g = R(-w / 2, -h / 2, w, h, size * 0.1, "#E6ECF2", "#93AABE", 4) +
      R(-w * 0.28, -h * 0.3, w * 0.56, h * 0.6, 6, "#F4F7FA", "#B4C1CC", 2) +
      R(-w * 0.28, up ? -h * 0.3 : h * 0.0, w * 0.56, h * 0.3, 6, "#C4CFD9") +
      C(-w * 0.41, 0, size * 0.028, "#93AABE") + C(w * 0.41, 0, size * 0.028, "#93AABE");
    return G(g, { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* ---- power lines: two poles and three sagging wires ------------------------ */
  function ecPowerLines(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var g = "", x1 = x + w * 0.14, x2 = x + w * 0.86, top = y + h * 0.16;
    [x1, x2].forEach(function (px) {
      g += L(px, y + h, px, top - 18, "#8A7761", 11) +
        L(px - w * 0.09, top, px + w * 0.09, top, "#8A7761", 8) +
        L(px - w * 0.065, top + 26, px + w * 0.065, top + 26, "#8A7761", 7);
    });
    for (var k = 0; k < 3; k++) {
      var wy = top + (k === 2 ? 26 : 0) + (k === 0 ? -2 : k === 1 ? 2 : 0);
      var dx = k === 2 ? w * 0.06 : w * 0.085;
      g += Pth("M" + n2(x1 - (k === 1 ? -dx : dx)) + "," + n2(wy) +
        " Q" + n2((x1 + x2) / 2) + "," + n2(wy + 46 + k * 8) + " " + n2(x2 + (k === 1 ? -dx : dx)) + "," + n2(wy),
        null, "#5E7B94", 4);
    }
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a broken wire: the plastic split and the metal showing ---------------- */
  function ecBrokenWire(cx, cy, len, o, flash) {
    if (!(o > 0)) return "";
    var half = len * 0.40, h = 13, lx = cx - len / 2, rx = cx + len / 2, g = "";
    if (flash > 0) g += MK.glow(cx, cy, 86, P.bad, flash);
    g += R(lx, cy - h, half, h * 2, h, "#33566F", "#1E3B52", 3);
    g += R(rx - half, cy - h, half, h * 2, h, "#33566F", "#1E3B52", 3);
    g += R(lx + 6, cy - h + 5, half - 16, 6, 3, "#4D7998");
    g += R(rx - half + 10, cy - h + 5, half - 16, 6, 3, "#4D7998");
    /* the metal strands showing where the plastic is split */
    for (var k = -1; k <= 1; k++) {
      g += Pth("M" + n2(lx + half) + "," + n2(cy + k * 6) + " q13," + n2(k * 4 - 1) + " 24," + n2(k * 9), null, "#D89B4A", 4);
      g += Pth("M" + n2(rx - half) + "," + n2(cy + k * 6) + " q-13," + n2(k * 4 - 1) + " -24," + n2(k * 9), null, "#D89B4A", 4);
    }
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a length of wire -------------------------------------------------------
     Gold plastic with the bare metal showing at each end, so it reads as the
     same thing as the gold wires in the lesson's own circuit drawing. The
     lesson's builder button for a wire is the curly-loop emoji, which this
     machine draws as a purple squiggle: not a wire to a seven-year-old
     (rule 5), and the one part of its builder whose picture had to be drawn
     here instead of borrowed. */
  function ecWirePic(cx, cy, size) {
    var w = size, h = size * 0.17, x0 = cx - w / 2, x1 = cx + w / 2, sw = Math.max(6, size * 0.1);
    var ax = x0 + w * 0.17, bx = x1 - w * 0.17;
    return Pth("M" + n2(ax) + "," + n2(cy + h) +
      " C" + n2(x0 + w * 0.42) + "," + n2(cy - h * 2.4) + " " + n2(x1 - w * 0.42) + "," + n2(cy + h * 2.4) +
      " " + n2(bx) + "," + n2(cy - h), null, P.gold, sw) +
      L(x0, cy + h, ax, cy + h, "#DCE6EE", sw * 0.85) +
      L(bx, cy - h, x1, cy - h, "#DCE6EE", sw * 0.85);
  }

  /* ---- drops of water, at fixed places ---------------------------------------- */
  var EC_DROPS = [[-46, -38], [-8, -58], [34, -34], [-34, 22], [26, 30], [58, -6]];
  function ecDrops(cx, cy, n, o) {
    if (!(o > 0)) return "";
    var g = "";
    for (var k = 0; k < n && k < EC_DROPS.length; k++) {
      var x = cx + EC_DROPS[k][0], y = cy + EC_DROPS[k][1], r = 9;
      g += Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.4) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.4) + " Z", "#7FC4EA") + C(x, y, r, "#7FC4EA");
    }
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a torch -----------------------------------------------------------------
     o: {on (the lamp lit), beam (0..1), cut (opened up, showing the battery,
     the two metal strips and the little lamp), sw (0 off to 1 on: where the
     slider sits)}. Drawn about (cx, cy) at scale s, pointing right; at s = 1 it
     is about 230 across and 110 tall, and its beam reaches 300 to the right.
     EC_TP is where its three insides are, for the ring that names each one. */
  var EC_TP = { batt: [-94, -19, 110, 38], strip: 26, stripX: [-104, 58], lamp: [72, 0, 15] };
  function ecTorch(cx, cy, s, o) {
    o = o || {};
    var lit = !!o.on, g = "", k;
    if (o.beam > 0) {
      g += Pth("M104,-50 L300,-126 L300,126 L104,50 Z", P.gold, null, null, { opacity: 0.16 * o.beam }) +
        Pth("M104,-30 L300,-76 L300,76 L104,30 Z", P.gold, null, null, { opacity: 0.2 * o.beam });
    }
    g += R(-126, -25, 18, 50, 8, "#9BB0C2", "#6E8496", 2);
    g += R(-112, -33, 174, 66, 15, o.cut ? "#1B3550" : "#2B5673", "#93AABE", 3);
    if (!o.cut) for (k = 0; k < 3; k++) g += L(-70 + k * 26, -28, -70 + k * 26, 28, "#23485F", 5);
    g += Pth("M62,-34 L100,-54 L100,54 L62,34 Z", "#8FA3B5", "#C6D3DE", 3);
    if (o.cut) {
      /* opened up: the battery, the two metal strips and the little lamp, each
         its own colour, and the glass left as glass so the lamp is the only
         round gold thing in the head */
      g += R(EC_TP.batt[0], EC_TP.batt[1], EC_TP.batt[2], EC_TP.batt[3], 6, "#F4C95D", "#C79C22", 3);
      g += R(EC_TP.batt[0] + EC_TP.batt[2], -8, 8, 16, 3, "#C79C22");
      g += L(EC_TP.stripX[0], -EC_TP.strip, EC_TP.stripX[1], -EC_TP.strip, "#DCE6EE", 7);
      g += L(EC_TP.stripX[0], EC_TP.strip, EC_TP.stripX[1], EC_TP.strip, "#DCE6EE", 7);
      if (lit) g += MK.glow(EC_TP.lamp[0], 0, 48, P.gold, 0.9);
      g += C(EC_TP.lamp[0], 0, EC_TP.lamp[2], lit ? P.gold : "#12283A", "#C6D3DE", 3);
      g += E(100, 0, 10, 54, "#BBD3E4", "#C6D3DE", 3, { opacity: 0.4 });
    } else {
      g += E(100, 0, 10, 54, lit ? P.gold : "#12283A", "#C6D3DE", 3);
      if (lit) g += MK.glow(102, 0, 66, P.gold, 0.85);
    }
    g += R(-54, -47, 60, 20, 10, "#17384F", "#93AABE", 3) +
      R(-51 + 30 * clamp(o.sw == null ? (lit ? 1 : 0) : o.sw, 0, 1), -44, 26, 14, 7, lit ? P.gold : "#B9C8D6");
    return G(g, { transform: tr(cx, cy, s) });
  }

  /* ==== chapter: what electricity does ==========================================
     The lesson's own electric helpers, in the order its lecture names them:
     a lamp, a kettle, cooking, the fridge, a toy that moves, a radio. Each
     card lights as it is named, and a gold line along the foot - the
     electricity - reaches it as it does. */
  var EC_USE_Y = 96, EC_USE_H = 196, EC_USE_W = 170, EC_BUS = 372;
  var EC_USES = [
    { label: "lighting", pic: "\u{1F4A1}", job: "light" },
    { label: "heating", pic: "\u{1FAD6}", job: "heat" },
    { label: "cooking", pic: "\u{1F373}", job: "cook" },
    { label: "keeping cold", pic: null, job: "cold" },
    { label: "moving", pic: "\u{1F697}", job: "move" },
    { label: "making sound", pic: "\u{1F4FB}", job: "sound" }
  ];
  function ecUseX(k) { return 29 + k * (EC_USE_W + 18); }

  /* the little mark that says what the electricity is doing in that card */
  function ecJob(kind, cx, cy, t, at, u) {
    if (at == null || !(u > 0)) return "";
    var g = "", k;
    if (kind === "light") {
      for (k = 0; k < 8; k++) {
        var a = k * Math.PI / 4, r0 = 52, r1 = 52 + 22 * (0.7 + 0.3 * breathe(t));
        g += L(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, P.gold, 5);
      }
      g = MK.glow(cx, cy, 72, P.gold, 0.9) + g;
    } else if (kind === "heat" || kind === "cook") {
      for (k = 0; k < 3; k++) {
        var hx = cx - 26 + k * 26, ph = (t * 0.9 + k * 0.33) % 1;
        g += Pth("M" + n2(hx) + "," + n2(cy - 46 - 26 * ph) + " q9,-11 0,-22 q-9,-11 0,-22",
          null, P.accent, 4, { opacity: (1 - ph) * 0.95 });
      }
    } else if (kind === "cold") {
      for (k = 0; k < 3; k++) {
        var fx = cx - 38 + k * 38, fy = cy - 48 + (k === 1 ? -12 : 4), fr = 13;
        for (var a2 = 0; a2 < 3; a2++) {
          var an = a2 * Math.PI / 3;
          g += L(fx - Math.cos(an) * fr, fy - Math.sin(an) * fr, fx + Math.cos(an) * fr, fy + Math.sin(an) * fr, "#9BD5F0", 3);
        }
      }
      g = MK.glow(cx, cy, 70, P.blue, 0.8) + g;
    } else if (kind === "move") {
      g += MK.arrow(cx + 36, cy + 42, cx + 74, cy + 42, 1, P.gold, 6);
    } else if (kind === "sound") {
      g += MK.waves(cx, cy - 6, t, at, { dir: -1.5, spread: 1.1, n: 3, period: 1.1, reach: 48, col: P.gold });
    }
    return G(g, { opacity: clamp(u, 0, 1) });
  }

  function ecUsesChapter(scene, beat, t, i) {
    var lit = [sc(scene, 0, "lamp"), sc(scene, 1, "kettle"), sc(scene, 1, "cooks"),
      sc(scene, 2, "fridge"), sc(scene, 2, "toys"), sc(scene, 3, "radio")];
    var jobs = [sc(scene, 0, "light"), sc(scene, 1, "heat"), sc(scene, 1, "cooks"),
      sc(scene, 2, "cold"), sc(scene, 2, "toys"), sc(scene, 3, "sound")];
    var cJobs = sc(scene, 0, "jobs"), cOnly = sc(scene, 3, "only");
    var all = on(t, cOnly, 0.6), out = "";

    /* the supply along the foot, reaching as far as the newest lit card */
    var busO = on(t, cJobs, 0.5);
    out += L(62, EC_BUS, 1140, EC_BUS, P.line, 6, { opacity: busO });
    out += MK.pic(34, EC_BUS, 38, "⚡", { opacity: busO });
    var reach = 62;
    for (var q = 0; q < 6; q++) if (ecAt(t, lit[q])) reach = Math.max(reach, ecUseX(q) + EC_USE_W / 2 + 26);
    if (all > 0) reach = lerp(reach, 1140, all);
    if (reach > 62) out += L(62, EC_BUS, reach, EC_BUS, P.gold, 6, { opacity: Math.max(busO, all) });

    EC_USES.forEach(function (u, k) {
      var x = ecUseX(k), cx = x + EC_USE_W / 2, p = popIn(t, lit[k], 0.4);
      var isLit = p > 0;
      var glowU = isLit ? Math.max(0, 1 - all) + all * (0.55 + 0.45 * breathe(t + k * 0.35)) : 0;
      out += ecCard(x, EC_USE_Y, EC_USE_W, EC_USE_H, 0.34 + 0.66 * Math.min(1, p),
        isLit ? (all > 0 ? P.gold : P.teal) : P.line, isLit);
      if (isLit) out += L(cx, EC_USE_Y + EC_USE_H, cx, EC_BUS, P.gold, 4, { opacity: 0.85 * glowU });
      var picY = EC_USE_Y + 74;
      out += ecJob(u.job, cx, picY, t, jobs[k], on(t, jobs[k], 0.45) * Math.min(1, p));
      out += G(MK.pic(cx, picY, 84, u.pic == null ? ART.ICONS.fridge : u.pic),
        { transform: around(cx, picY, isLit ? Math.min(1.06, p) : 0.9), opacity: isLit ? 1 : 0.4 });
      out += ecCap(cx, EC_USE_Y + 162, u.label, isLit ? 1 : 0.45, "lab mid");
    });
    return svg(out);
  }

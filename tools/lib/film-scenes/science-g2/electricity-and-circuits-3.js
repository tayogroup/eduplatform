  /* ==== Electricity and Circuits, part 3 ======================================
     The chapter "Staying safe": the lesson's own Safe / Not safe sort, one
     pair at a time. Safe is on the left with a tick, not safe on the right
     with a cross, which is the order its two bins are in. The last beat is
     the rules again, ticked, beside the circuit the child is about to build -
     the lesson's own "I can follow the safety rules when I build a circuit"
     (2TWSc.04). */

  var EC_PANE = { y: 66, h: 300, w: 480, lx: 86, rx: 602 };
  function ecPaneCx(x) { return x + EC_PANE.w / 2; }
  function ecPane(x, o, inner, cap, mark, markP) {
    if (!(o > 0)) return "";
    var cx = ecPaneCx(x), col = markP > 0 ? (mark === "tick" ? P.good : P.bad) : P.line;
    return G(ecCard(x, EC_PANE.y, EC_PANE.w, EC_PANE.h, 1, col, markP > 0) + inner +
      ecCap(cx, EC_PANE.y + EC_PANE.h - 26, cap, 1, "lab big") +
      (mark === "tick" ? MK.tick(x + EC_PANE.w - 50, EC_PANE.y + 50, 27, markP)
        : mark === "cross" ? MK.cross(x + EC_PANE.w - 50, EC_PANE.y + 50, 27, markP) : ""),
      { opacity: clamp(o, 0, 1) });
  }

  function ecSafeChapter(scene, beat, t, i) {
    var f = scene.first;
    var LX = EC_PANE.lx, RX = EC_PANE.rx, LC = ecPaneCx(LX), RC = ecPaneCx(RX);

    function draw(j) {
      var k = j - f, c = function (n) { return sc(scene, k, n); }, out = "";

      if (k === 0) {                                  /* a wall socket is strong */
        var cSock = c("socket"), cStrong = c("strong"), cHurt = c("hurt");
        var hurt = on(t, cHurt, 0.5);
        out += MK.glow(470, 200, 160, P.bad, hurt * (0.55 + 0.45 * breathe(t)));
        out += ecSocket(470, 200, 210, popIn(t, cSock, 0.45));
        var wp = popIn(t, cStrong, 0.4);
        out += MK.pop(MK.pic(790, 196, 122, "⚠️"), 790, 196, wp * (1 + 0.08 * hurt * breathe(t)));
        out += MK.pill(470, 358, "a wall socket", on(t, cSock, 0.5), { size: 26, col: P.line });
        return out;
      }

      if (k === 1) {                                  /* only a plug goes in a socket */
        var cPlug = c("plug"), cGoes = c("goes"), cNever = c("never"), cPen = c("pencil");
        var gu = on(t, cGoes, 0.7), pu = on(t, cPen, 0.7);
        /* The plug is drawn BEFORE the socket, so the socket's face covers its
           pins at the end of the travel: it goes in and stays in, which is
           what the line says. Its journey ends with the pin tips at the
           socket's own face (right edge LC - 16, pins 0.26 of the size long),
           so the body finishes flush against it. */
        var plugS = 104, plugEnd = LC - 16 - plugS * 0.26;
        out += ecPane(LX, on(t, cPlug, 0.45),
          ecPlugPic(lerp(LC + 120, plugEnd, gu), 196, plugS, 1) +
          ecSocket(LC - 92, 196, 152, 1) +
          MK.ripple(LC - 92, 196, t, cGoes == null ? null : cGoes + 0.55, P.good),
          "only a plug", "tick", popIn(t, cGoes == null ? null : cGoes + 0.6, 0.35));
        out += ecPane(RX, on(t, cNever, 0.45),
          ecSocket(RC - 92, 196, 152, 1) +
          MK.pic(lerp(RC + 138, RC + 40, pu), 190, 92, "✏️"),
          "never a pencil", "cross", popIn(t, cPen == null ? null : cPen + 0.5, 0.35));
        return out;
      }

      if (k === 2) {                                  /* dry hands, never wet ones */
        var cDry = c("dry"), cSw = c("switch"), cWater = c("water"), cThru = c("through");
        out += ecPane(LX, on(t, cDry, 0.45),
          ecSwitchPlate(LC - 88, 192, 138, true, 1) + MK.pic(LC + 74, 206, 104, "✋"),
          "dry hands", "tick", popIn(t, cSw == null ? null : cSw + 0.35, 0.35));
        out += ecPane(RX, on(t, cWater, 0.45),
          ecSwitchPlate(RC - 88, 192, 138, true, 1) + MK.pic(RC + 74, 206, 104, "✋") +
          ecDrops(RC + 74, 196, 6, on(t, cWater, 0.5)),
          "wet hands", "cross", popIn(t, cThru == null ? null : cThru + 0.3, 0.35));
        return out;
      }

      if (k === 3) {                                  /* kites and broken wires */
        var cKite = c("kite"), cLines = c("lines"), cBroken = c("broken"), cTell = c("tell");
        var ku = on(t, cKite, 0.8);
        out += ecPane(LX, on(t, cKite, 0.45),
          ecPowerLines(LX + 26, 112, 428, 196, 1) +
          MK.pic(lerp(LC + 20, LC + 44, ku), lerp(262, 150, ku), 86, "\u{1FA81}") +
          MK.glow(LC, 190, 130, P.bad, on(t, cLines, 0.5) * (0.4 + 0.3 * breathe(t))),
          "power lines", "cross", popIn(t, cLines == null ? null : cLines + 0.35, 0.35));
        out += ecPane(RX, on(t, cBroken, 0.45),
          ecBrokenWire(RC - 34, 168, 290, 1, on(t, cBroken, 0.5) * (0.5 + 0.5 * breathe(t))) +
          /* The two stand on one line and the grown-up is HALF AGAIN as tall:
             at 84 and 96 this machine drew two near-identical round faces with
             the same hair, and a seven-year-old could not see which one the
             line tells them to fetch. */
          MK.pic(RC - 108, 274, 74, "\u{1F9D2}", { opacity: on(t, cBroken, 0.5) }) +
          MK.pic(RC + 112, 252, 118, "\u{1F9D1}", { opacity: popIn(t, cTell, 0.4) }),
          "tell a grown-up", "tick", popIn(t, cTell == null ? null : cTell + 0.4, 0.35));
        return out;
      }

      if (k === 4) {                                  /* a small cell is safe to hold */
        var cCell = c("cell"), cSafe = c("safe"), cMouth = c("mouth");
        out += ecPane(LX, on(t, cCell, 0.45),
          MK.pic(LC - 16, 214, 138, "✋") + MK.pic(LC + 52, 168, 80, "\u{1F50B}"),
          "safe to hold", "tick", popIn(t, cSafe == null ? null : cSafe + 0.3, 0.35));
        out += ecPane(RX, on(t, cMouth, 0.45),
          MK.pic(RC - 70, 192, 86, "\u{1F50B}") + MK.pic(RC + 66, 200, 100, "\u{1F444}"),
          "never in your mouth", "cross", popIn(t, cMouth == null ? null : cMouth + 0.45, 0.35));
        return out;
      }

      /* the rules again, ticked, beside the circuit the child is about to build */
      var cRules = c("rules"), cBuild = c("build"), cSafe2 = c("safe");
      var m = ecMap(620, 84, 1.5), on2 = ecAt(t, cBuild);
      out += MK.list(70, 168, [
        { text: "Only plugs in sockets", at: cRules, mark: "tick", markAt: cRules == null ? null : cRules + 0.3 },
        { text: "Dry hands on switches", at: cRules == null ? null : cRules + 0.35, mark: "tick", markAt: cRules == null ? null : cRules + 0.65 },
        { text: "Tell a grown-up", at: cRules == null ? null : cRules + 0.7, mark: "tick", markAt: cRules == null ? null : cRules + 1.0 }
      ], t, { lh: 72, cls: "lab big", markR: 19 });
      var bo = on(t, cBuild, 0.5);
      if (bo > 0) {
        out += G(ecPlaceCircuit({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: on2 }, m), { opacity: bo });
        out += MK.glow(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), 92, P.gold,
          bo * on(t, cSafe2, 0.5) * (0.5 + 0.5 * breathe(t)));
      }
      out += MK.tick(556, 244, 38, popIn(t, cSafe2, 0.3));
      return out;
    }

    return svg(crossfade(t, i, scene, draw));
  }

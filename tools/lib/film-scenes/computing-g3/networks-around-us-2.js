  /* ==== Networks Around Us, part 2: the classroom, and the services ===========
     tools/lib/film-scenes/computing-g3/networks-around-us-2.js. See the header
     of networks-around-us.js.

     The two kit figures this film uses are built once here, at load, rather
     than in a draw function a render calls thousands of times. */
  var NW_LAPTOP = ART.figure("laptop");      /* 360 x 268 */
  var NW_TABLET = ART.figure("tablet");      /* 260 x 378 */

  /* a thing carried from a to b, arcing over */
  function nwFly(a, b, u, w, col) {
    if (!(u > 0)) return "";
    var v = clamp(u, 0, 1);
    return nwPage(lerp(a[0], b[0], v), lerp(a[1], b[1], v) - 30 * Math.sin(Math.PI * v), w || 40, 1, col || P.gold);
  }
  function nwFlyPic(a, b, u, size, ch) {
    if (!(u > 0)) return "";
    var v = clamp(u, 0, 1);
    return Em(lerp(a[0], b[0], v), lerp(a[1], b[1], v) - 30 * Math.sin(Math.PI * v), size, ch);
  }

  /* ==== chapter: around your classroom ===========================================
     The room the child is sitting in: the computers, the smartboard at the
     front and the multifunction device by the door, counted on to the network
     one kind at a time. The last beat sets one shared machine against three
     machines in three rooms. */
  var NW_PCS = [170, 330, 490];

  function nwClassRoom(scene, t) {
    var cLook = sc(scene, 0, "look"), cCount = sc(scene, 0, "count");
    var cPCs = sc(scene, 1, "computers"), cBoard = sc(scene, 1, "board");
    var cScreen = sc(scene, 2, "screen"), cNet = sc(scene, 2, "network");
    var cMfd = sc(scene, 3, "mfd"), cJobs = sc(scene, 3, "jobs");
    var room = on(t, cLook, 0.6), out = "";
    var n = nwPast(t, cMfd) ? 5 : nwPast(t, cBoard) ? 4 : nwPast(t, cPCs) ? 3 : 0;

    /* the room */
    out += G(R(24, 24, 1120, 392, 22, P.card, P.line, 3) +
      L(40, 336, 1128, 336, P.line, 3), { opacity: room });

    /* the door, and the wall socket the board's cable runs to */
    out += G(R(1036, 96, 96, 316, 10, P.cell, P.line, 3) + R(1050, 112, 68, 284, 6, P.card, P.line, 2) +
      C(1060, 262, 7, P.plastic), { opacity: room });
    out += G(R(44, 232, 40, 40, 6, P.cell, P.line, 2) + R(56, 244, 16, 16, 3, P.ground), { opacity: room });

    /* the smartboard at the front, with the teacher's writing on it */
    var bo = nwPast(t, cBoard) ? 1 : 0.62, bcol = nwPast(t, cBoard) && !nwPast(t, cMfd) ? P.gold : P.line;
    out += G(nwBoardScreen(300, 158, 340, bcol, on(t, cScreen, 1.0)), { opacity: room * bo });
    out += G(nwCable([130, 196], [84, 244], on(t, cNet, 0.7), P.gold, 5) +
      MK.pill(96, 300, "to the switch", on(t, cNet, 0.5), { size: 22, anchor: "start", col: P.gold, ink: P.gold }),
      { opacity: room });

    /* the computers */
    NW_PCS.forEach(function (x, k) {
      var p = popIn(t, cPCs == null ? null : cPCs + k * 0.16, 0.38);
      out += G(Em(x, 372, 72, "\u{1F4BB}"), { opacity: room * (nwPast(t, cPCs) ? 1 : 0.5), transform: around(x, 372, 0.9 + 0.1 * Math.min(1, Math.max(p, room))) });
      out += MK.ripple(x, 372, t, cPCs == null ? null : cPCs + k * 0.16, P.gold);
    });

    /* the multifunction device by the door, and its three jobs */
    var mo = nwPast(t, cMfd) ? 1 : 0.55;
    out += G(Em(944, 314, 108, "\u{1F5A8}️"), { opacity: room * mo, transform: around(944, 314, 0.92 + 0.08 * popIn(t, cMfd, 0.4)) });
    if (nwPast(t, cMfd)) out += C(944, 306, 78, "none", P.gold, 4, { opacity: 0.8 });
    ["prints", "scans", "copies"].forEach(function (w, k) {
      out += MK.pill(700, 128 + k * 58, w, on(t, cJobs == null ? null : cJobs + k * 0.26, 0.4), { size: 25, col: P.gold, ink: P.gold });
    });

    /* how many are on the network so far */
    out += MK.pill(960, 62, "on the network: " + (n || "?"), on(t, cCount, 0.5), { size: 26, col: n ? P.teal : P.line, ink: P.ink });
    return out;
  }

  /* the last beat: one machine everybody shares, or three machines in three rooms */
  function nwClassCompare(scene, t) {
    var cShare = sc(scene, 4, "share"), cThree = sc(scene, 4, "three");
    var sh = on(t, cShare, 0.7), th = on(t, cThree, 0.6), out = "";

    out += R(40, 34, 520, 380, 22, P.card, P.good, 3);
    out += MK.pill(300, 74, "one machine", 1, { size: 26, col: P.good, ink: P.good });
    out += Em(300, 186, 104, "\u{1F5A8}️");
    [128, 300, 472].forEach(function (x, k) {
      out += Em(x, 356, 58, "\u{1F4BB}");
      out += MK.arrow(x, 320, lerp(x, 300, 0.72), 238, clamp(sh * 1.25 - k * 0.12, 0, 1), P.good, 6);
    });
    out += MK.tick(506, 80, 26, popIn(t, cShare == null ? null : cShare + 0.5, 0.4));

    if (th > 0) {
      var r = R(608, 34, 520, 380, 22, P.card, P.bad, 3) + MK.pill(868, 74, "three machines", 1, { size: 26, col: P.bad, ink: P.bad });
      [0, 1, 2].forEach(function (k) {
        var x = 630 + k * 170;
        r += R(x, 120, 156, 264, 14, P.cell, P.line, 2) + Em(x + 78, 196, 62, "\u{1F5A8}️") + Em(x + 78, 320, 48, "\u{1F4BB}");
      });
      r += MK.cross(1094, 80, 26, popIn(t, cThree == null ? null : cThree + 0.5, 0.4));
      out += G(r, { opacity: th });
    }
    return out;
  }

  function nwClassroomChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(nwClassRoom(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(nwClassCompare(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: what being joined lets you do ===================================
     The five services the lesson names, as a row of cards that light one at a
     time, and above them the thing itself happening across the network. */
  var NW_SERVICES = [
    { id: "files", label: "digital files", pic: "\u{1F4C4}" },
    { id: "printed", label: "printed documents", pic: "\u{1F5A8}️" },
    { id: "web", label: "the World Wide Web", pic: "\u{1F310}" },
    { id: "email", label: "email", pic: "✉️" },
    { id: "calls", label: "video calls", pic: "\u{1F4DE}" }
  ];
  var NW_SVC = { y: 322, w: 210, h: 100, gap: 14, x0: 31 };

  function nwServiceRow(scene, t) {
    var cAt = [sc(scene, 0, "services"), sc(scene, 1, "files"), sc(scene, 2, "printed"),
      sc(scene, 3, "web"), sc(scene, 4, "email"), sc(scene, 4, "calls")];
    var out = "", open = on(t, cAt[0], 0.6);
    NW_SERVICES.forEach(function (s, k) {
      var at = k < 4 ? cAt[k + 1] : cAt[5];
      var lit = nwPast(t, at), p = popIn(t, at, 0.4);
      var x = NW_SVC.x0 + k * (NW_SVC.w + NW_SVC.gap);
      var slot = on(t, cAt[0] == null ? null : cAt[0] + 0.15 + k * 0.12, 0.4);
      if (slot <= 0) return;
      out += G(R(x, NW_SVC.y, NW_SVC.w, NW_SVC.h, 18, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2,
        lit ? null : { "stroke-dasharray": "10 8" }) +
        Em(x + NW_SVC.w / 2, NW_SVC.y + 38, 44, s.pic) +
        Tx(x + NW_SVC.w / 2, NW_SVC.y + 82, s.label, "lab mid" + (lit ? "" : " muted"), "middle"),
        { opacity: slot * (lit ? 1 : 0.6) * Math.max(open, 0.001), transform: around(x + NW_SVC.w / 2, NW_SVC.y + NW_SVC.h / 2, lit ? Math.min(1.05, 0.96 + p * 0.09) : 0.96) });
    });
    return out;
  }

  /* beat 0: one laptop, joined to the switch, and the network behind it */
  function nwSvcJoined(scene, t) {
    var cBecause = sc(scene, 0, "because");
    var u = on(t, cBecause, 0.8), out = "";
    out += ART.place(NW_LAPTOP, 90, 62, 300, 223);
    out += nwCable([396, 176], [604, 170], u, u > 0.5 ? P.gold : P.line, 6);
    out += nwSwitchBox(700, 170, 200, u > 0.5 ? P.gold : P.line);
    out += nwCable([800, 160], [892, 96], clamp(u * 1.4 - 0.3, 0, 1), P.line, 5);
    out += nwCable([800, 186], [892, 248], clamp(u * 1.4 - 0.45, 0, 1), P.line, 5);
    out += nwServerBox(940, 96, 74, P.line);
    out += Em(944, 248, 74, "\u{1F5A8}️");
    return out;
  }

  /* beat 1: a page saved on the server, opened on another laptop */
  function nwSvcFiles(scene, t) {
    var cSave = sc(scene, 1, "save"), out = "";
    var up = on(t, cSave, 0.9), down = on(t, cSave == null ? null : cSave + 1.05, 0.7);
    out += ART.place(NW_LAPTOP, 40, 74, 250, 186);
    out += ART.place(NW_LAPTOP, 878, 74, 250, 186);
    out += nwServerBox(584, 150, 118, P.gold);
    out += MK.pill(584, 258, "server", 1, { size: 24, col: P.gold, ink: P.gold });
    out += nwCable([296, 152], [520, 150], 1, P.line, 5);
    out += nwCable([648, 150], [872, 152], 1, P.line, 5);
    out += nwFly([200, 128], [584, 150], up, 44, P.gold);
    out += nwFly([584, 150], [1002, 128], down, 44, P.gold);
    out += MK.tick(700, 246, 26, popIn(t, cSave == null ? null : cSave + 0.95, 0.4));
    return out;
  }

  /* beat 2: a document sent from a tablet, across the network, to the printer */
  function nwSvcPrint(scene, t) {
    var cPrint = sc(scene, 2, "print"), out = "";
    var go = on(t, cPrint, 1.0), mid = clamp(go * 2, 0, 1), back = clamp(go * 2 - 1, 0, 1);
    out += ART.place(NW_TABLET, 108, 22, 180, 262);
    out += nwWireless([300, 150], [500, 166], 1);
    out += nwSwitchBox(584, 170, 150, P.line);
    out += nwCable([660, 170], [840, 166], 1, P.line, 5);
    out += Em(932, 162, 130, "\u{1F5A8}️");
    out += nwFly([300, 128], [584, 150], mid, 42, P.gold);
    out += nwFly([584, 150], [900, 140], back, 42, P.gold);
    out += nwPage(932, 250, 48, popIn(t, cPrint == null ? null : cPrint + 1.5, 0.4), P.good);
    return out;
  }

  /* beat 3: pages kept on computers all over the world, brought to the board */
  var NW_WORLD = [[-0.9, 118], [-0.2, 128], [0.5, 118], [1.2, 126], [2.1, 120], [2.8, 128]];
  function nwSvcWeb(scene, t) {
    var cWeb = sc(scene, 3, "web"), cWorld = sc(scene, 3, "world"), out = "";
    var n = tally(t, cWeb, NW_WORLD.length, 1.0), come = on(t, cWorld, 0.85);
    out += Em(290, 156, 168, "\u{1F310}");
    for (var k = 0; k < n; k++)
      out += nwPage(290 + Math.cos(NW_WORLD[k][0]) * NW_WORLD[k][1], 156 + Math.sin(NW_WORLD[k][0]) * NW_WORLD[k][1] * 0.86,
        34, popIn(t, cWeb == null ? null : cWeb + k * 0.17, 0.35), P.blue);
    var land = clamp((come - 0.68) / 0.32, 0, 1);
    out += nwBoardScreen(880, 150, 340, come > 0.6 ? P.gold : P.line, 0);
    if (come > 0)
      out += nwPage(lerp(380, 880, come), lerp(100, 146, come) - 30 * Math.sin(Math.PI * come),
        lerp(44, 92, land), 1, P.blue);
    return out;
  }

  /* beat 4: a message across the network, and two faces both ways */
  function nwSvcTalk(scene, t) {
    var cEmail = sc(scene, 4, "email"), cCalls = sc(scene, 4, "calls");
    var out = "", go = on(t, cEmail, 1.0), call = popIn(t, cCalls, 0.45);
    out += Em(96, 176, 84, "\u{1F4BB}");
    out += Em(466, 176, 84, "\u{1F4F1}");
    out += nwCable([146, 176], [416, 176], clamp(go * 1.6, 0, 1), P.line, 5);
    out += nwFlyPic([120, 148], [450, 148], go, 56, "✉️");
    if (call > 0) {
      var c = "";
      [[664, 24], [908, 148]].forEach(function (b, k) {
        c += R(b[0], b[1], 200, 146, 16, P.card, P.teal, 3) + R(b[0] + 12, b[1] + 12, 176, 108, 10, P.ground) +
          Em(b[0] + 100, b[1] + 66, 70, "\u{1F9D1}");
      });
      c += MK.waves(872, 106, t, cCalls, { dir: 0.55, spread: 0.9, n: 3, reach: 80, col: P.teal });
      c += MK.waves(902, 212, t, cCalls, { dir: Math.PI + 0.55, spread: 0.9, n: 3, reach: 80, col: P.teal });
      out += G(c, { opacity: Math.min(1, call) });
    }
    return out;
  }

  function nwServicesChapter(scene, beat, t, i) {
    var top = [nwSvcJoined, nwSvcFiles, nwSvcPrint, nwSvcWeb, nwSvcTalk];
    return svg(nwServiceRow(scene, t) +
      crossfade(t, i, scene, function (j) {
        var k = j - scene.first;
        return top[k] ? top[k](scene, t) : "";
      }));
  }

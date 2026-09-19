
  /* ==== My Body and My Senses, part 3 ==========================================
     "Alike and different", "Measuring in hand spans", the recap, and KINDS. */

  /* ==== chapter: alike and different ============================================
     The lesson's four friends, named one at a time. Below them two panels, the
     lecture's own two words: "alike" takes what most people have (two eyes,
     hair) as it is said, and each of the four friends is ticked; "different"
     takes the ways they differ (brown or green eyes, curly or straight hair).
     On the next line the panels step back for the lesson's correction: a
     difference is not better or worse, it is only "not the same". On the last
     line each panel is lit as its word is said. */
  var MB_FRIENDS = [
    ["Amal", "\u{1F467}\u{1F3FE}", "amal"], ["Sami", "\u{1F466}\u{1F3FD}", "sami"],
    ["Nora", "\u{1F467}\u{1F3FB}", "nora"], ["Omar", "\u{1F466}\u{1F3FF}", "omar"]
  ];
  var MB_HAIR = "#8A5A34";

  /* an eye, as the child's eyes are drawn but big: white, a coloured iris, a pupil */
  function mbEye(cx, cy, s, iris) {
    return G(Pth("M-40,0 Q0,-32 40,0 Q0,32 -40,0 Z", "#FFFFFF", "#0B1D2C", 3) +
      C(0, 0, 16, iris) + C(0, 0, 7, "#14100C") + C(5, -5, 3.5, "#FFFFFF"),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ")" });
  }
  /* a head with hair: "cap" (short hair), "curly" or "straight" */
  var MB_HAIR_EDGE = "#A8764A";
  function mbHead(cx, cy, s, hair) {
    var out = "";
    /* straight hair hangs down both sides of the face, cut level */
    if (hair === "straight") out += Pth("M-37,28 L-37,-4 A37,37 0 0 1 37,-4 L37,28 Z", MB_HAIR, MB_HAIR_EDGE, 1.5) +
      L(-33, 0, -33, 24, MB_HAIR_EDGE, 1.5) + L(33, 0, 33, 24, MB_HAIR_EDGE, 1.5);
    out += C(0, 0, 30, MB_SKIN);
    if (hair === "curly") {
      for (var k = 0; k <= 8; k++) {
        var a = Math.PI * (1.05 + 0.9 * k / 8);
        out += C(32 * Math.cos(a), 32 * Math.sin(a) - 2, 11, MB_HAIR, MB_HAIR_EDGE, 1.5);
      }
      out += C(-10, -30, 11, MB_HAIR, MB_HAIR_EDGE, 1.5) + C(10, -30, 11, MB_HAIR, MB_HAIR_EDGE, 1.5);
    } else if (hair === "straight") {
      /* a straight fringe, cut level across the forehead */
      out += Pth("M-28.3,-10 L28.3,-10 A30,30 0 0 0 -28.3,-10 Z", MB_HAIR, MB_HAIR_EDGE, 1.5) +
        L(-12, -12, -12, -27, MB_HAIR_EDGE, 1.5) + L(0, -12, 0, -29, MB_HAIR_EDGE, 1.5) + L(12, -12, 12, -27, MB_HAIR_EDGE, 1.5);
    } else {
      out += Pth("M-31,-4 Q-33,-38 0,-38 Q33,-38 31,-4 Q27,-24 0,-26 Q-27,-24 -31,-4 Z", MB_HAIR, MB_HAIR_EDGE, 1.5);
    }
    out += C(-11, 3, 3.6, "#14100C") + C(11, 3, 3.6, "#14100C") + Pth("M-9,13 Q0,20 9,13", null, "#7A2E2E", 3);
    return G(out, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ")" });
  }
  function mbPanel(x, w, word, col, lit) {
    return R(x, 170, w, 264, 22, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? col : P.line, 2 + lit) +
      Tx(x + w / 2, 212, word, "lab big", "middle", { fill: col });
  }

  function sceneAlike(scene, beat, t, i) {
    var s0 = scene.first, out = "";
    var two = cue(s0 + 1, "two"), hair = cue(s0 + 2, "hair");
    var ou = into(t, s0 + 3) * (1 - into(t, s0 + 4));
    MB_FRIENDS.forEach(function (f, k) {
      var cx = 239 + k * 230, p = popIn(t, cue(s0, f[2]), 0.4);
      if (p <= 0) return;
      out += MK.pop(MK.pic(cx, 58, 86, f[1]) + Tx(cx, 138, f[0], "lab big", "middle"), cx, 90, p);
      out += MK.tick(cx + 50, 22, 15, popIn(t, two == null ? null : two + k * 0.12, 0.35) * (1 - on(t, BEATS[s0 + 2].start - GAP, 0.3)));
      out += MK.tick(cx + 50, 22, 15, popIn(t, hair == null ? null : hair + k * 0.12, 0.35) * (1 - on(t, BEATS[s0 + 3].start - GAP, 0.3)));
    });
    var pu = into(t, s0 + 1);
    if (pu > 0) {
      var glowA = on(t, cue(s0 + 4, "alike"), 0.4), glowD = on(t, cue(s0 + 4, "different"), 0.4);
      var pan = mbPanel(60, 500, "alike", P.good, glowA) + mbPanel(608, 500, "different", P.blue, glowD);
      pan += MK.pop(mbEye(265, 262, 0.9, "#5A3A22") + mbEye(355, 262, 0.9, "#5A3A22"), 310, 262, popIn(t, two, 0.4)) +
        Tx(310, 318, "two eyes", "lab big", "middle", { opacity: on(t, two, 0.4) });
      pan += MK.pop(mbEye(780, 262, 0.9, "#7A4B22"), 780, 262, popIn(t, cue(s0 + 1, "brown"), 0.4)) +
        Tx(780, 318, "brown", "lab big", "middle", { opacity: on(t, cue(s0 + 1, "brown"), 0.4) });
      pan += MK.pop(mbEye(936, 262, 0.9, "#4E9A48"), 936, 262, popIn(t, cue(s0 + 1, "green"), 0.4)) +
        Tx(936, 318, "green", "lab big", "middle", { opacity: on(t, cue(s0 + 1, "green"), 0.4) });
      pan += MK.pop(mbHead(262, 376, 1.05, "cap"), 262, 376, popIn(t, hair, 0.4)) +
        Tx(312, 387, "hair", "lab big", "start", { opacity: on(t, hair, 0.4) });
      pan += MK.pop(mbHead(700, 376, 1.05, "curly"), 700, 376, popIn(t, cue(s0 + 2, "curly"), 0.4)) +
        Tx(750, 387, "curly", "lab big", "start", { opacity: on(t, cue(s0 + 2, "curly"), 0.4) });
      pan += MK.pop(mbHead(890, 376, 1.05, "straight"), 890, 376, popIn(t, cue(s0 + 2, "straight"), 0.4)) +
        Tx(940, 387, "straight", "lab big", "start", { opacity: on(t, cue(s0 + 2, "straight"), 0.4) });
      out += G(pan, { opacity: pu * (1 - ou) });
    }
    /* "Different does not mean better or worse. It just means not the same."
       The two panels make way for one card that says it. */
    if (ou > 0) {
      var A = function (n) { return cue(s0 + 3, n); };
      var ov = R(60, 170, 1048, 264, 22, "#1B3A52", P.blue, 3) +
        Tx(584, 238, "different", "lab huge", "middle", { fill: P.blue, "font-size": 52 });
      ov += G(mbChip(470, 310, "better", 1, "", "middle", 28) + MK.cross(554, 310, 20, popIn(t, A("better") == null ? null : A("better") + 0.35, 0.35)),
        { opacity: on(t, A("better"), 0.35) });
      ov += G(mbChip(698, 310, "worse", 1, "", "middle", 28) + MK.cross(776, 310, 20, popIn(t, A("worse") == null ? null : A("worse") + 0.35, 0.35)),
        { opacity: on(t, A("worse"), 0.35) });
      ov += G(Tx(584, 394, "not the same", "lab big", "middle") + MK.tick(722, 384, 20, popIn(t, A("same") == null ? null : A("same") + 0.3, 0.35)),
        { opacity: on(t, A("same"), 0.35) });
      out += G(ov, { opacity: ou });
    }
    return svg(out);
  }

  /* ==== chapter: measuring in hand spans ==========================================
     Long ago: hands laid along a plank and feet along the floor, counted as they
     go down. A hand span: one hand, stretched, the thumb and the little finger
     marked as they are named and the span between them drawn as a measurement.
     Then the lesson's measuring: hand after hand from the child's feet to the
     top of its head, counted, nine for Amal; the lesson's table takes Amal's
     nine, then Sami's ten and Nora's eight, and Sami's row is marked tallest. */
  var MB_ROT_FLAT = -MB_SPAN_DEG;          /* the span lying along the x axis, thumb left */
  var MB_ROT_UP = -90 - MB_SPAN_DEG;       /* the span standing up, thumb at the bottom */
  /* a hand at scale s and rotation rot placed so its thumb tip is at (x, y) */
  function mbHandFrom(x, y, s, rot, extra) {
    var o = mbHandPt(MB_THUMB, 0, 0, s, rot);
    return mbHand(x - o[0], y - o[1], s, rot, extra);
  }
  /* a bare foot seen from above, heel at (x, y), toes along +x: a sole that
     widens from the heel to the ball, and five toes in an arc, big toe first */
  function mbFoot(x, y, s) {
    var out = Pth("M2,0 C2,-12 18,-15 40,-15 C62,-16 84,-22 92,-8 C97,4 88,20 68,19 C50,18 40,11 22,12 C8,13 2,9 2,0 Z", MB_SKIN, MB_SKIN_EDGE, 2.5);
    [[103, -15, 8], [106, -1, 6.2], [103, 10, 5.4], [97, 18, 4.8], [89, 24, 4.3]].forEach(function (q) { out += C(q[0], q[1], q[2], MB_SKIN, MB_SKIN_EDGE, 2); });
    return G(out, { transform: "translate(" + n2(x) + "," + n2(y) + ") scale(" + n3(s) + ")" });
  }

  function mbLongAgo(scene, bi, t) {
    var A = function (n) { return cue(bi, n); }, out = "", s = 1.0, span = MB_SPAN * s;
    var old = on(t, A("long"), 0.5);
    out += G(R(150, 118, 5 * span + 60, 58, 10, "#8A5A2B", "#5E3B1C", 3) +
      L(170, 136, 5 * span + 190, 136, "#A6703A", 3) + L(170, 158, 5 * span + 190, 158, "#A6703A", 3) +
      L(120, 368, 1050, 368, P.line, 4), { opacity: old });
    /* both counts finish before the line does, even on a voice 10% quicker */
    var nh = tally(t, A("hands"), 5, 1.2);
    for (var k = 0; k < nh; k++) {
      var hx = 180 + k * span, p = popIn(t, A("hands") + k * 0.3, 0.3);
      out += MK.pop(mbHandFrom(hx, 147, s, MB_ROT_FLAT), hx + span / 2, 147, p) +
        Tx(hx + span / 2, 262, String(k + 1), "lab big", "middle", { fill: P.teal, opacity: Math.min(1, p) });
    }
    var nf = tally(t, A("feet"), 3, 0.5);
    for (var f = 0; f < nf; f++) {
      var fx = 240 + f * 124, fp = popIn(t, A("feet") + f * 0.25, 0.3);
      out += MK.pop(mbFoot(fx, 330, 1.05), fx + 55, 330, fp) +
        Tx(fx + 55, 408, String(f + 1), "lab big", "middle", { fill: P.teal, opacity: Math.min(1, fp) });
    }
    return out;
  }

  function mbSpanPic(scene, bi, t) {
    var A = function (n) { return cue(bi, n); }, out = "", s = 2.3, hx = 584, hy = 300;
    var th = mbHandPt(MB_THUMB, hx, hy, s, MB_ROT_FLAT), li = mbHandPt(MB_LITTLE, hx, hy, s, MB_ROT_FLAT);
    out += MK.pop(mbHand(hx, hy, s, MB_ROT_FLAT), hx, hy, popIn(t, A("span"), 0.45));
    var tu = on(t, A("thumb"), 0.35), lu = on(t, A("little"), 0.35);
    out += G(C(th[0], th[1], 13, P.gold, P.ground, 3) + Tx(th[0] - 22, th[1] + 58, "thumb", "lab big", "end", { fill: P.gold }), { opacity: tu });
    out += G(C(li[0], li[1], 13, P.gold, P.ground, 3) + Tx(li[0] + 22, li[1] + 58, "little finger", "lab big", "start", { fill: P.gold }), { opacity: lu });
    var du = on(t, A("little") == null ? null : A("little") + 0.35, 0.7), top = 70;
    if (du > 0) {
      out += G(L(th[0], th[1] - 18, th[0], top - 16, P.gold, 3, { "stroke-dasharray": "8 8" }) +
        L(li[0], li[1] - 18, li[0], top - 16, P.gold, 3, { "stroke-dasharray": "8 8" }), { opacity: du });
      var mid = (th[0] + li[0]) / 2;
      out += MK.arrow(mid, top, lerp(mid, th[0], du), top, 1, P.gold, 5) + MK.arrow(mid, top, lerp(mid, li[0], du), top, 1, P.gold, 5);
    }
    out += Tx(584, 44, "hand span", "lab big", "middle", { fill: du > 0 ? P.gold : P.muted, opacity: on(t, A("span"), 0.4) });
    return out;
  }

  /* the measuring picture of the last three lines */
  var MB_MEAS_BOX = { x: 150, y: 24, s: 1.04 };
  var MB_TABLE = [["Amal", "\u{1F467}\u{1F3FE}", "9", 3, "amal"], ["Sami", "\u{1F466}\u{1F3FD}", "10", 4, "sami"], ["Nora", "\u{1F467}\u{1F3FB}", "8", 4, "nora"]];
  function mbMeasuring(scene, t) {
    var s0 = scene.first, b = MB_MEAS_BOX, out = "";
    var put = cue(s0 + 2, "put"), keep = cue(s0 + 2, "keep"), head = cue(s0 + 2, "head");
    var floor = b.y + 354 * b.s, top = b.y + 16 * b.s, unit = (floor - top) / 9, hs = unit / MB_SPAN, col = 470;
    out += L(110, floor, 640, floor, P.line, 4);
    out += mbPut(MB_FIG, b);
    var n = 0;
    for (var k = 0; k < 9; k++) {
      var at = k === 0 ? (put == null ? null : put + 0.3) : keep == null || head == null ? null : keep + (head + 0.3 - keep) * (k - 1) / 7;
      var p = popIn(t, at, 0.28);
      if (p <= 0) continue;
      n++;
      var y = floor - k * unit;
      out += MK.pop(mbHandFrom(col, y, hs, MB_ROT_UP), col, y - unit / 2, p) +
        Tx(col + 44, y - unit / 2 + 8, String(k + 1), "lab", "start", { fill: P.teal, opacity: Math.min(1, p) });
    }
    var nine = cue(s0 + 3, "nine");
    if (n > 0) out += G(Tx(600, 236, String(n), "lab huge", "middle", { fill: P.teal, "font-size": 64 }) +
      Tx(600, 272, n === 1 ? "hand span" : "hand spans", "lab", "middle", { fill: P.teal }),
      { transform: around(600, 236, 1 + 0.15 * bump(t, nine, 0.7)) });
    var amal = cue(s0 + 3, "amal");
    out += G(MK.pic(250, 416, 34, MB_TABLE[0][1]) + Tx(276, 426, "Amal", "lab big", "start"), { opacity: on(t, amal, 0.4) });
    /* the lesson's record table */
    var tu = on(t, cue(s0 + 3, "write"), 0.45);
    if (tu > 0) {
      var tx = 690, tw = 460;
      out += G(Tx(tx + 16, 66, "Friend", "lab big", "start", { fill: P.teal }) + Tx(tx + tw - 16, 66, "Hand spans", "lab big", "end", { fill: P.teal }) +
        L(tx, 84, tx + tw, 84, P.line, 2), { opacity: tu });
      var most = cue(s0 + 4, "most"), tall = cue(s0 + 4, "tallest");
      MB_TABLE.forEach(function (r, j) {
        var at = j === 0 ? cue(s0 + 3, "table") : cue(s0 + 4, r[4]);
        var ro = on(t, at, 0.4);
        if (ro <= 0) return;
        var y = 104 + j * 92, win = j === 1 && tall != null && t >= tall;
        out += G(R(tx, y, tw, 78, 16, win ? "#1B3A52" : P.card, win ? P.gold : P.line, win ? 3 : 2) +
          MK.pic(tx + 42, y + 39, 44, r[1]) + Tx(tx + 76, y + 50, r[0], "lab big", "start") +
          G(Tx(tx + tw - 40, y + 54, r[2], "lab huge", "middle", { fill: j === 1 && most != null && t >= most ? P.gold : P.ink }),
            { transform: around(tx + tw - 40, y + 39, popIn(t, at + 0.3, 0.35) * (1 + (j === 1 ? 0.25 * bump(t, most, 0.8) : 0))) }),
          { opacity: ro });
        if (win) out += mbChip(tx + tw / 2 + 20, y + 39, "tallest", on(t, tall, 0.35), "now", "middle", 22);
      });
    }
    return out;
  }

  function sceneMeasure(scene, beat, t, i) {
    var s0 = scene.first, k = i - s0;
    if (k >= 2) {
      var u = into(t, s0 + 2), out = G(mbMeasuring(scene, t), { opacity: u });
      if (u < 1) out = G(mbSpanPic(scene, s0 + 1, t), { opacity: 1 - u }) + out;
      return svg(out);
    }
    return svg(crossfade(t, i, scene, function (bi) { return bi === s0 ? mbLongAgo(scene, bi, t) : mbSpanPic(scene, bi, t); }));
  }

  /* ==== chapter: what you now know =================================================
     The shared recap, five cards lit as they are said; on "Clap your hands" two
     pairs of hands clap three times in the empty corners below the cards (the
     lesson's own clapping picture, from its "Move your body" step). */
  function mbRecap(scene, beat, t, i) {
    var clap = sc(scene, 3, "clap"), claps = "";
    if (clap != null && t >= clap) [[92, 330], [1076, 330]].forEach(function (p) {
      var o = on(t, clap, 0.3), s = 1 + 0.2 * (bump(t, clap + 0.1, 0.4) + bump(t, clap + 0.55, 0.4) + bump(t, clap + 1.0, 0.4));
      claps += G(MK.pic(p[0], p[1], 96, "\u{1F44F}"), { opacity: o, transform: around(p[0], p[1], s) }) + MK.ripple(p[0], p[1] - 40, t, clap + 0.1, P.teal);
    });
    return mbRecapCards(scene, beat, t, i).replace("</svg></div>", claps + "</svg></div>");
  }
  var mbRecapCards = MK.recapKind([
    { beat: 0, at: "parts", title: "Body parts", sub: "head, arms, hands, tummy, legs, feet",
      pic: function (cx, cy, size) { return mbPut(MB_FIG, { x: cx - 42, y: cy - 66, s: 0.325 }); } },
    { beat: 1, at: "senses", title: "Five senses", sub: "sight, hearing, smell, taste, touch",
      pic: function (cx, cy, size) { return MB_SENSE_PICS.map(function (p, k) { return MK.pic(cx + (k - 2) * 62, cy, 50, p); }).join(""); } },
    { beat: 1, at: "safe", title: "They keep you safe", sub: "a car, smoke, a cup that is too hot",
      pic: function (cx, cy, size) { return MK.pic(cx - 80, cy, 64, "\u{1F697}") + MK.pic(cx, cy, 64, "\u{1F525}") + MK.pic(cx + 80, cy, 64, "☕"); } },
    { beat: 2, at: "alike", title: "Alike and different", sub: "Amal, Sami, Nora and Omar",
      pic: function (cx, cy, size) { return MB_FRIENDS.map(function (f, k) { return MK.pic(cx + (k - 1.5) * 70, cy, 60, f[1]); }).join(""); } },
    { beat: 2, at: "measure", title: "Hand spans", sub: "Sami is ten hand spans tall",
      pic: function (cx, cy, size) { return mbHand(cx, cy + 16, 0.75, MB_ROT_FLAT); } }
  ], { goBeat: 3, goAt: "know" });

  var KINDS = {
    title: mbTitle, body: sceneBody, senses: sceneSenses, safe: sceneSafe,
    alike: sceneAlike, measure: sceneMeasure, recap: mbRecap
  };

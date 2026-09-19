
  /* ==== Alive or Never Alive, part 3 of 3: the experiment, being a scientist, the recap ==== */

  var NOPE = "\u{1F6AB}", SUNNY = "☀️", POTTED = "\u{1FAB4}", THUMB = "\u{1F44D}", EYES = "\u{1F440}", THINK = "\u{1F4AD}";
  var STEPS = [["\u{1F50D}", "look closely", "looks"], ["❓", "ask a question", "asks"], ["\u{1F9EA}", "try something", "tries"], ["\u{1F4DD}", "write it down", "writes"]];

  /* ==== chapter: does a plant need water? ======================================
     The two pots of the lesson's plantWater experiment, exactly as it opens
     (Day 1, "water every day" and "no water"). One is watered from a can, the
     other gets a no-water sign; what is the same and what is different is laid
     out beside them; then the prediction, and five days to wait. The pots never
     change: the child finds out in the lesson. */
  var POTS = { sun: true, labelA: "water every day", labelB: "no water" };
  var PS = 420 / 320, PX = 50, PY = 30;                      /* the pots: 320 x 290, drawn 420 x 380.6 */
  var POT_A = PX + 90 * PS, POT_B = PX + 230 * PS, POT_TOP = PY + 110 * PS;

  function potsCard(o, same) {
    return G(R(40, 20, 440, 401, 18, P.card, P.line, 2) + ART.place(ART.pots(0, 0, 1, POTS), PX, PY, 420, 380.6) +
      (same > 0 ? G(R(236, 186, 48, 10, 4, P.gold, P.body, 2) + R(236, 206, 48, 10, 4, P.gold, P.body, 2), { opacity: same }) : ""),
      { opacity: Math.min(1, o), transform: around(260, 220, 0.94 + 0.06 * Math.min(o, 1.05)) });
  }

  /* a watering can, its rose at (x, y), tipped by `tilt` degrees */
  function wateringCan(x, y, tilt, o) {
    if (!(o > 0)) return "";
    return G(Pth("M44,36 L4,4", null, P.body, 13) + Pth("M44,36 L4,4", null, P.blue, 7) +
      R(40, -8, 72, 60, 12, P.blue, P.body, 4) + Pth("M60,-8 Q78,-34 96,-8", null, P.body, 6) +
      R(-7, -7, 16, 14, 4, P.body),
      { transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(tilt) + ")", opacity: o });
  }
  /* a shower from the can's rose onto the soil of the watered pot */
  var SOIL_A = PY + 186 * PS, SPRAY = [-26, -8, 10, -18, 2, -32, 16, -12, -2, 8, -22, 12];
  function pour(t, at, until) {
    if (at == null || t < at || t > until + 0.6) return "";
    var out = "";
    for (var k = 0; k < 16; k++) {
      var t0 = at + k * 0.07;
      if (t0 > until || t < t0 || t > t0 + 0.55) continue;
      var u = (t - t0) / 0.55, x = lerp(194, POT_A + 10 + SPRAY[k % SPRAY.length], u), y = lerp(126, SOIL_A, u * u);
      out += Pth("M" + n2(x) + "," + n2(y - 11) + " Q" + n2(x + 7) + "," + n2(y) + " " + n2(x) + "," + n2(y + 5) + " Q" + n2(x - 7) + "," + n2(y) + " " + n2(x) + "," + n2(y - 11) + " Z",
        "#3B8FD9", "#FFFFFF", 1.5, { opacity: u > 0.85 ? (1 - u) / 0.15 : 1 });
    }
    return out;
  }

  /* what is the same and what is different: each pot's things, side by side */
  function sameRows(t, only, o) {
    if (!(o > 0)) return "";
    var rows = [[POTTED, "=", POTTED, 0.5], [SUNNY, "=", SUNNY, 0.75], [DROP, "≠", NOPE, 0]], out = "";
    rows.forEach(function (r, k) {
      var p = popIn(t, only == null ? null : only + r[3], 0.4), y = 90 + k * 104, hot = k === 2;
      if (p <= 0) return;
      out += G(R(560, y - 44, 460, 88, 20, hot ? "#1B3A52" : P.card, hot ? HUE.water : P.line, hot ? 4 : 2) +
        MK.pic(660, y, 64, r[0]) + MK.pic(920, y, 64, r[2]) +
        Tx(790, y + 17, r[1], "lab huge", "middle", { fill: hot ? P.gold : P.muted }),
        { opacity: Math.min(1, p) * o, transform: around(790, y, 0.9 + 0.1 * Math.min(p, 1.1)) });
    });
    return out;
  }

  function sceneWater(scene, beat, t, i) {
    var k = i - scene.first, hue = HUE.water, c = function (b, n) { return sc(scene, b, n); };
    var how = c(0, "how"), two = c(0, "two"), same = c(0, "same");
    var water = c(1, "water"), other = c(1, "other"), none = c(1, "none");
    var only = c(2, "only"), fair = c(2, "fair");
    var predict = c(3, "predict"), sayIt = c(3, "say"), wrong = c(3, "wrong");
    var watch = c(4, "watch"), five = c(4, "five"), see = c(4, "see");
    var out = "";

    /* "How can you find out?": a question, answered by two plants */
    out += MK.qmark(840, 220, 58, span(t, how == null ? null : how + 0.1, two));
    out += potsCard(popIn(t, two, 0.5), span(t, same, beatStart(scene, 1)));

    /* water one; the other gets none */
    var canO = span(t, water, water == null ? null : water + 1.5, 0.3, 0.3);
    out += wateringCan(196, 118, -35 * on(t, water == null ? null : water + 0.15, 0.3), canO) + pour(t, water == null ? null : water + 0.3, water == null ? 0 : water + 1.2);
    var np = popIn(t, other, 0.4);
    if (np > 0) out += G(Em(POT_B, 106, 58, NOPE), { transform: around(POT_B, 106, Math.min(np, 1.1) * (1 + 0.2 * bump(t, none, 0.7))), opacity: Math.min(1, np) });

    /* only the water is different: a fair test */
    var so = 1 - into(t, scene.first + 3) * (k >= 3 ? 1 : 0);
    out += sameRows(t, only, k >= 2 ? so : 0);
    if (k >= 2) out += MK.pill(790, 404, "fair test", on(t, fair, 0.4) * so, { size: 32, col: P.gold, ink: P.gold });

    /* predict: what will happen to the plant with no water? */
    var bo = on(t, predict, 0.45);
    if (bo > 0) {
      out += G(MK.bubble(560, 36, 470, 96, "What will happen?", 1), { opacity: bo, transform: around(795, 84, 1 + 0.05 * bump(t, sayIt, 0.8) + 0.05 * bump(t, see, 0.9)) });
      out += G(MK.leader(566, 112, POT_B + 44, 152, on(t, predict + 0.25, 0.5), P.paper), { opacity: bo });
      out += MK.pill(700, 188, "predict", bo, { size: 30, col: hue });
      var tp = popIn(t, wrong, 0.45) * (1 - on(t, beatStart(scene, 4), 0.4));
      if (tp > 0) out += G(Em(1094, 84, 84, THUMB), { transform: around(1094, 84, Math.min(tp, 1.1)), opacity: Math.min(1, tp) });
    }

    /* then five days, and at the end of them, what happens is still a question */
    var dayO = on(t, watch, 0.4);
    if (dayO > 0) {
      var n = tally(t, five, 5, 1.0);
      for (var d = 0; d < 5; d++) {
        var x = 628 + d * 112, p = d < n ? popIn(t, five + d * 0.25, 0.35) : 0, last = d === 4;
        out += G(R(x - 48, 262, 96, 104, 16, p > 0 ? "#1B3A52" : P.card, p > 0 ? hue : P.line, p > 0 ? 3 : 2) +
          Tx(x, 292, "Day", "lab mid muted", "middle") + (p > 0 ? Tx(x, 346, String(d + 1), "lab huge", "middle", { opacity: Math.min(1, p) }) : ""),
          { opacity: dayO });
        if (last) out += MK.qmark(x + 44, 262, 24, Math.min(1, p) * (1 + 0.25 * bump(t, see, 1.0)));
      }
    }
    return svg(out);
  }

  /* ==== chapter: being a scientist =============================================
     The lecture's four things a scientist does, each with the lesson's own
     step picture (explore, ask, experiment, record), lit as it is said. Then
     the record step's table, empty and waiting ("After 5 days" is what the
     child will see), and last the prediction set beside what happened. */
  var CW = 270, CX0 = 17;
  /* the four cards; `fly` (0..1) carries the last, "write it down", to the
     corner of the table that follows, as the other three fade */
  function stepCards(scene, t, o, fly) {
    var out = "";
    STEPS.forEach(function (s, k) {
      var x = CX0 + k * (CW + 18), cx = x + CW / 2, at = sc(scene, 0, s[2]), p = popIn(t, at, 0.4), lit = p > 0;
      var m = k === 3 ? fly || 0 : 0, keep = k === 3 ? 1 : o;
      var bob = lit && at != null ? -6 * Math.sin((t - at) * 3) * Math.exp(-(t - at) * 1.2) : 0;
      var ex = lerp(cx, 86, m), ey = lerp(168 + bob, 92, m), es = lerp(116, 84, m);
      /* a flying card carries its frame with it, shrinking and fading, so the
         picture does not seem to leave its card behind */
      var carry = m > 0 ? "translate(" + n2(ex) + "," + n2(ey) + ") scale(" + n3(lerp(1, 0.45, m)) + ") translate(" + n2(-cx) + ",-168)" : null;
      out += G(G(R(x, 60, CW, 290, 24, lit ? "#1B3A52" : P.card, lit ? HUE.scientist : P.line, lit ? 3 : 2) +
          Tx(cx, 300, s[1], "lab big", "middle", lit ? {} : { fill: P.muted }), { opacity: (k === 3 ? 1 - m : 1), transform: carry }) +
        Em(ex, ey, es, s[0]),
        { opacity: (0.4 + 0.6 * Math.min(1, p)) * keep, transform: m > 0 ? null : around(cx, 205, 0.95 + 0.05 * Math.min(p, 1.1)) });
    });
    return out;
  }

  function recordTable(scene, t, o, noIcon) {
    var c = function (n) { return sc(scene, 1, n); }, write = c("write"), table = c("table"), forget = c("forget");
    var out = "", d = on(t, table, 0.8);
    if (!noIcon) out += G(Em(86, 92, 84, STEPS[3][0]), { transform: around(86, 92, 1 + 0.15 * bump(t, write == null ? null : write + 0.4, 0.7)) });
    if (d > 0) {
      out += el("clipPath", { id: "aonaTable" }, R(150, 56, 868, 330, 18)) +
        G(R(150, 56, 868 * d, 66, 0, P.cell) + L(150, 122, 150 + 868 * d, 122, P.line, 3) + L(150, 254, 150 + 868 * d, 254, P.line, 3) +
          L(650, 56, 650, 56 + 330 * d, P.line, 3), { "clip-path": "url(#aonaTable)" }) +
        R(150, 56, 868, 330, 18, "none", P.line, 3, { opacity: d }) +
        Tx(400, 100, "Plant", "lab big", "middle", { opacity: d }) + Tx(834, 100, "After 5 days", "lab big", "middle", { opacity: d });
      [[DROP, "watered plant", 188], [NOPE, "plant with no water", 320]].forEach(function (r, k) {
        var ro = on(t, table + 0.4 + k * 0.3, 0.4);
        out += G(Em(200, r[2], 58, r[0]) + Tx(244, r[2] + 11, r[1], "lab big", "start"), { opacity: ro });
        out += MK.qmark(834, r[2], 30, ro * (1 + 0.25 * bump(t, forget == null ? null : forget + k * 0.3, 0.8)));
      });
    }
    return G(out, { opacity: o });
  }

  function compareCards(scene, t, o) {
    var say = sc(scene, 2, "say"), matched = sc(scene, 2, "matched"), out = "";
    [[90, THINK, "my prediction", matched], [688, EYES, "what happened", say]].forEach(function (s) {
      var p = popIn(t, s[3], 0.45), lit = p > 0;
      out += R(s[0], 70, 390, 280, 24, lit ? "#1B3A52" : P.card, lit ? HUE.scientist : P.line, lit ? 3 : 2);
      if (lit) out += G(Em(s[0] + 195, 180, 124, s[1]) + Tx(s[0] + 195, 312, s[2], "lab big", "middle"),
        { opacity: Math.min(1, p), transform: around(s[0] + 195, 210, 0.9 + 0.1 * Math.min(p, 1.1)) });
    });
    var q = popIn(t, matched == null ? null : matched + 0.45, 0.4);
    if (q > 0) out += G(R(556, 214, 56, 11, 5, P.gold) + R(556, 236, 56, 11, 5, P.gold) + Tx(584, 190, "?", "lab huge gold", "middle"),
      { opacity: Math.min(1, q), transform: around(584, 226, Math.min(q, 1.1) * (1 + 0.08 * breathe(t))) });
    return G(out, { opacity: o });
  }

  function sceneScientist(scene, beat, t, i) {
    var k = i - scene.first, u = into(t, i);
    if (k === 0) return svg(stepCards(scene, t, 1, 0));
    /* the "write it down" card becomes the table's corner picture: it flies
       there over the line's first second, as "write" is said, and the table
       (whose own picture sits exactly where the card lands) takes over once
       it has arrived */
    if (k === 1) {
      var m = inAt(t, BEATS[i].start - 0.1, 1.0);
      return svg(m < 1 ? stepCards(scene, t, 1 - u, m) + recordTable(scene, t, 1, true) : recordTable(scene, t, 1));
    }
    return svg((u < 1 ? recordTable(scene, t, 1 - u) : "") + compareCards(scene, t, u));
  }

  /* ==== the recap =============================================================== */
  var RECAP = [
    { beat: 0, at: "goat", title: "Alive", pic: function (cx, cy, s) { return goatAt(cx - 8, cy + s * 0.46, s) + MK.tick(cx + s * 0.78, cy - s * 0.28, s * 0.22, 1); } },
    { beat: 1, at: "stone", title: "Never alive", pic: function (cx, cy, s) { return stoneAt(cx - s * 0.95, cy, s * 0.9) + Em(cx, cy, s * 0.78, SPOON) + Em(cx + s * 0.95, cy, s * 0.78, CAR); } },
    { beat: 1, at: "animals", title: "Animals need", pic: function (cx, cy, s) { return Em(cx - s * 0.9, cy, s * 0.7, AIR) + Em(cx, cy, s * 0.7, DROP) + Em(cx + s * 0.9, cy, s * 0.7, FISH); } },
    { beat: 2, at: "plants", title: "Plants need", pic: function (cx, cy, s) { return Em(cx - s * 0.9, cy, s * 0.7, DROP) + MK.pic(cx, cy, s * 0.95, POTTED) + Em(cx + s * 0.9, cy, s * 0.7, SUNNY); } },
    { beat: 3, at: "sci", title: "A scientist", pic: function (cx, cy, s) { var o = ""; STEPS.forEach(function (x, k) { o += Em(cx + (k - 1.5) * s * 0.72, cy, s * 0.58, x[0]); }); return o; } }
  ];

  var KINDS = {
    title: MK.titleKind({ sub: ["What alive means, and never alive.", "What animals and plants need.", "How a scientist finds things out."] }),
    alive: sceneAlive, never: sceneNever, animals: sceneAnimals, plants: scenePlants,
    water: sceneWater, scientist: sceneScientist,
    recap: MK.recapKind(RECAP, { goBeat: 3, goAt: "go" })
  };

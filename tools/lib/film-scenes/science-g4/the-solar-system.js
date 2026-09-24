  /* ==== Grade 4 Science, Lesson 12: The Solar System ==========================
     tools/lib/film-scenes/science-g4/the-solar-system.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/the-solar-system.json.

     The lesson's own drawings come from ART where it has one: the day and
     night sim (ART.sim("dayNight", "draw", 0..3), the drawing the lesson's
     Spin on six hours button steps through, with its globe, its "you" marker
     and its stick and shadow), and the kit's own rock for an asteroid. The
     planets, the belt, the comet, the football model and the two sky models
     are drawn here, because the lesson draws those with coloured circle emoji
     and the film must show what its words say: eight planets in order, Jupiter
     biggest, Saturn's rings, Neptune farthest out.

     This file: the palette, the planets every chapter shares, the title motif
     and the chapter "The spinning Earth". Every top-level name here starts
     with ss or SS, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, spin: P.blue, centre: P.gold, rocks: P.plum,
    scale: P.accent, found: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ssOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ssFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 from beat a until beat b comes in (b may be past the last beat) */
  function ssSpan(t, scene, a, b) {
    return ssFrom(t, scene, a) * (1 - (b < scene.beats.length ? into(t, scene.first + b) : 0));
  }
  /* fixed numbers for anything scattered: never Math.random */
  var SS_SCATTER = [
    0.17, 0.83, 0.41, 0.62, 0.09, 0.95, 0.28, 0.54, 0.73, 0.36,
    0.88, 0.05, 0.49, 0.67, 0.22, 0.91, 0.13, 0.58, 0.77, 0.31,
    0.44, 0.86, 0.02, 0.69, 0.25, 0.52, 0.97, 0.38, 0.61, 0.15
  ];

  /* ---- the eight planets ------------------------------------------------------
     Drawn here rather than taken from the lesson, which shows each planet as a
     coloured circle emoji. The colours and the order of the sizes are the
     lesson's own words: Mercury small and rocky, Venus wrapped in cloud, Earth
     with water, Mars red, Jupiter the biggest with a storm, Saturn's rings of
     ice and rock, Uranus pale blue-green, Neptune deep blue and farthest out.
     The radii are a readable order of size, not a scale model: the scale
     chapter is the one that makes the scale claim. */
  var SS_PLANETS = [
    { name: "Mercury", r: 10, fill: "#9E8D7C" },
    { name: "Venus", r: 14, fill: "#E4B565" },
    { name: "Earth", r: 15, fill: "#3B7FD1" },
    { name: "Mars", r: 12, fill: "#C4542F" },
    { name: "Jupiter", r: 35, fill: "#D6A96B" },
    { name: "Saturn", r: 28, fill: "#E5CE95", ring: true },
    { name: "Uranus", r: 22, fill: "#8FD3D6" },
    { name: "Neptune", r: 21, fill: "#3D5FC4" }
  ];

  /* half of Saturn's ring: the far half behind the disc, the near half in front */
  function ssRingArc(cx, cy, r, upper) {
    var rx = r * 2.05, ry = r * 0.5;
    return G(Pth("M" + n2(cx + rx) + "," + n2(cy) + " A" + n2(rx) + "," + n2(ry) + " 0 0 " +
      (upper ? 0 : 1) + " " + n2(cx - rx) + "," + n2(cy), null, "#CDB484", Math.max(2, r * 0.24)),
      { transform: "rotate(-15 " + n2(cx) + " " + n2(cy) + ")" });
  }
  /* planet k, centred on (cx, cy); s scales it (1 = the radius in SS_PLANETS) */
  function ssPlanet(cx, cy, k, s) {
    var p = SS_PLANETS[k], r = p.r * (s == null ? 1 : s), u = r / p.r, out = "";
    var put = function (inner) { return G(inner, { transform: tr(cx, cy, u) }); };
    if (p.ring) out += ssRingArc(cx, cy, r, true);
    out += C(cx, cy, r, p.fill);
    if (k === 0) out += put(C(-3, -3, 2.6, "#7E6E5F") + C(4, 3, 2, "#7E6E5F"));
    if (k === 1) out += put(E(0, -4, 11, 3, "#F2D9A6", null, null, { opacity: 0.7 }) +
      E(-2, 5, 10, 2.6, "#F2D9A6", null, null, { opacity: 0.6 }));
    if (k === 2) out += put(Pth("M-10,-4 q6,-6 11,-1 q2,6 -4,7 q-9,1 -7,-6z", "#4CB65C") +
      Pth("M1,6 q6,-2 8,3 q-4,5 -9,1z", "#4CB65C"));
    if (k === 3) out += put(C(-4, -4, 3, "#A8431F") + C(5, 4, 2.4, "#A8431F"));
    if (k === 4) out += put(E(0, -13, 32, 5, "#C2925A") + E(0, 3, 34, 6, "#C2925A") +
      E(0, 19, 28, 5, "#C2925A") + E(12, 8, 8, 5, "#B8523A"));
    if (k === 5) out += put(E(0, -6, 25, 4, "#D4B978", null, null, { opacity: 0.7 }));
    if (k === 6) out += put(E(0, 2, 19, 5, "#A7E2E4", null, null, { opacity: 0.6 }));
    if (k === 7) out += put(E(-3, -4, 12, 4, "#6F8EDD", null, null, { opacity: 0.7 }) + C(5, 6, 4, "#25409B"));
    out += C(cx, cy, r, "none", "rgba(255,255,255,0.28)", Math.max(1, r * 0.1));
    if (p.ring) out += ssRingArc(cx, cy, r, false);
    return out;
  }

  /* the Sun: the kit's gold, with a soft corona and slowly turning rays */
  function ssSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.22;
    for (var k = 0; k < 12; k++) {
      var a = a0 + k * Math.PI / 6;
      rays += L(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2,
        cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 1.5, P.gold, Math.max(2, r * 0.1));
    }
    return G(MK.glow(cx, cy, r * 2.4, P.gold, 0.95) + rays + C(cx, cy, r, P.gold) +
      C(cx, cy, r * 0.62, "#FFE49A", null, null, { opacity: 0.55 }), { opacity: clamp(o, 0, 1) });
  }

  /* a lump of rock of the kit's own colours, size px across, turned rot */
  function ssRock(cx, cy, size, rot, o) {
    if (!(o > 0)) return "";
    var s = size / 40;
    return G(Pth("M-17,3 L-11,-13 L4,-18 L16,-7 L14,9 L1,18 L-12,14z", "#8C8378", "#5E564C", 2) +
      Pth("M-8,-6 L0,-10 L5,-3 L-2,2z", "#A49A8D"),
      { transform: tr(cx, cy, s) + " rotate(" + n2(rot || 0) + ")", opacity: clamp(o, 0, 1) });
  }

  /* a comet: an icy head at (cx, cy) with a tail of length len pointing along
     `ang` (radians, away from the Sun), grown to u */
  function ssComet(cx, cy, ang, len, u, o) {
    if (!(o > 0)) return "";
    var l = len * clamp(u, 0, 1), out = "";
    if (l > 4) {
      var w = 16;
      out += Pth("M" + n2(cx + Math.sin(ang) * w) + "," + n2(cy - Math.cos(ang) * w) +
        " L" + n2(cx + Math.cos(ang) * l) + "," + n2(cy + Math.sin(ang) * l) +
        " L" + n2(cx - Math.sin(ang) * w) + "," + n2(cy + Math.cos(ang) * w) + " Z",
        "#9BE8F2", null, null, { opacity: 0.42 });
      out += L(cx, cy, cx + Math.cos(ang) * l * 0.82, cy + Math.sin(ang) * l * 0.82, "#D8F6FB", 4, { opacity: 0.75 });
    }
    out += MK.glow(cx, cy, 34, "#9BE8F2", 0.9) + C(cx, cy, 11, "#E8FBFF", "#8FD8E6", 2);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names; the newest gold */
  function ssLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now === false ? P.muted : P.gold;
    var from = anchor === "end" ? x + 8 : x - 8;
    return MK.leader(from, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 24, anchor: anchor || "start", col: col });
  }

  /* ==== the title motif ==========================================================
     The Solar System seen from above: the Sun at the centre, the eight planets
     on their orbits in order, the belt of rock between Mars and Jupiter, and a
     comet on a long loop with its tail pointing away from the Sun.

     In the spoken title chapter it BUILDS, one thing per phrase, because the
     first line names the Earth and the Earth used to be absent for all of it:
     the Sun alone, then the rings of the system on "cross the sky", then the
     Earth on "The Earth spins" - turning, with its red marker carried round the
     ring on "carries you round" - then in the second line the other seven
     planets on "eight planets", the belt on "a belt of rock", and the comet on
     "comets made of ice". On the two cards, which pass no scene, the whole
     system simply stands. */
  var SS_ORBITS = [40, 52, 64, 76, 108, 126, 144, 160];
  var SS_BELT_R = 90;
  var SS_ANG = [200, 300, 40, 130, 250, 340, 80, 165];
  var SS_MARK_R = 9.5;
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSky = sn ? sc(sn, 0, "sky") : null;
    var cSpins = sn ? sc(sn, 0, "spins") : null, cRound = sn ? sc(sn, 0, "round") : null;
    var cPl = sn ? sc(sn, 1, "planets") : null, cRock = sn ? sc(sn, 1, "rock") : null, cCom = sn ? sc(sn, 1, "comets") : null;
    var stage = sn ? on(t, cSky, 0.7) : 1;
    var earth = sn ? popIn(t, cSpins, 0.5) : 1;
    var nPl = sn ? tally(t, cPl, 8, 1.5) : 8;
    var rockO = sn ? on(t, cRock, 0.6) : 1;
    var comO = sn ? popIn(t, cCom, 0.5) : 1;
    /* how far planet p has come in: the Earth answers to the first line */
    function came(p) {
      if (!sn) return 1;
      if (p === 2 && earth > 0) return Math.max(earth, cPl == null ? 0 : popIn(t, cPl + 2 * (1.5 / 7), 0.35));
      if (cPl == null || p >= nPl) return 0;
      return popIn(t, cPl + p * (1.5 / 7), 0.35);
    }

    out += C(180, 180, 176, "#0A1B29", P.line, 2, { opacity: Math.max(stage, 0.001) });
    /* the orbits */
    for (var k = 0; k < 8; k++) {
      var oo = sn ? (came(k) > 0 ? 1 : 0.22) : 1;
      out += C(180, 180, SS_ORBITS[k], "none", P.line, 1.6, { opacity: 0.55 * oo * stage });
    }
    /* the belt of rock between Mars and Jupiter */
    if (rockO > 0) {
      var belt = "";
      for (var b = 0; b < 22; b++) {
        var ba = SS_SCATTER[b] * Math.PI * 2, br = SS_BELT_R + (SS_SCATTER[(b + 7) % 30] - 0.5) * 14;
        belt += C(180 + Math.cos(ba) * br, 180 + Math.sin(ba) * br, 2 + SS_SCATTER[(b + 3) % 30] * 2, "#A49A8D");
      }
      out += G(belt, { opacity: rockO });
    }
    /* the planets, in order out from the Sun */
    for (var p = 0; p < 8; p++) {
      var pop = came(p);
      if (!(pop > 0)) continue;
      var a = SS_ANG[p] * Math.PI / 180, px = 180 + Math.cos(a) * SS_ORBITS[p], py = 180 + Math.sin(a) * SS_ORBITS[p];
      out += MK.pop(ssPlanet(px, py, p, 0.36), px, py, pop);
      /* the Earth turns, and carries its marker round with it */
      if (p === 2 && sn && cSpins != null && t >= cSpins) {
        var so = on(t, cSpins, 0.4), spin = (t - cSpins) * 2.2;
        out += C(px, py, SS_MARK_R, "none", P.gold, 1.6, { opacity: 0.85 * so });
        if (cRound != null && t >= cRound) {
          var sw = Math.min(Math.PI * 1.55, (t - cRound) * 2.2), a0 = spin - sw;
          out += Pth("M" + n2(px + Math.cos(a0) * SS_MARK_R) + "," + n2(py + Math.sin(a0) * SS_MARK_R) +
            " A" + n2(SS_MARK_R) + "," + n2(SS_MARK_R) + " 0 " + (sw > Math.PI ? 1 : 0) + " 1 " +
            n2(px + Math.cos(spin) * SS_MARK_R) + "," + n2(py + Math.sin(spin) * SS_MARK_R),
            null, P.gold, 2.6, { opacity: 0.9 });
        }
        out += C(px + Math.cos(spin) * SS_MARK_R, py + Math.sin(spin) * SS_MARK_R, 2.8, "#D9473F");
      }
    }
    /* a comet on a long loop, its tail pointing away from the Sun */
    if (comO > 0) {
      var cx = 180 + Math.cos(2.5) * 148, cy = 180 + Math.sin(2.5) * 148;
      out += G(E(180, 180, 150, 96, "none", "#5C8FA6", 1.4, { opacity: 0.4, "stroke-dasharray": "7 6", transform: "rotate(24 180 180)" }), { opacity: comO });
      out += G(ssComet(cx, cy, 2.5, 74, 1, 1), { transform: around(cx, cy, 0.5), opacity: Math.min(1, comO) });
    }
    out += ssSun(180, 180, 22, 1, t);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Solar System: the Sun at the centre, eight planets, a belt of rock and a comet">' + out + "</svg>";
  }

  /* ==== chapter: the spinning Earth ==============================================
     The lesson's own day and night drawing, as a card on the left: its Sun, its
     globe, the red "you" marker that turns with it, and its stick and shadow.
     The card steps through the four quarters the lesson's Spin button steps
     through, as each is named. On the right, the same stick seen from where the
     child stands, drawn big, so the swinging shadow is large enough to watch. */
  var SS_DAY = { x: 48, y: 18, k: 1.825 };
  function ssDX(v) { return SS_DAY.x + v * SS_DAY.k; }
  function ssDY(v) { return SS_DAY.y + v * SS_DAY.k; }
  function ssDayCard(h) {
    return R(SS_DAY.x - 10, SS_DAY.y - 10, 320 * SS_DAY.k + 20, 220 * SS_DAY.k + 20, 18, P.card, P.line, 2) +
      ART.place(ART.sim("dayNight", "draw", h), SS_DAY.x, SS_DAY.y, 320 * SS_DAY.k, 220 * SS_DAY.k);
  }

  /* where the card is in its spin: a float, 0 sunrise, 1 midday, 2 sunset,
     3 midnight, and back to 0..2 as the last line swings the shadow */
  function ssSpinAt(t, scene) {
    var cFaces = sc(scene, 2, "faces"), cTurn = sc(scene, 3, "turn"), cAway = sc(scene, 4, "away"), cSw = sc(scene, 5, "swings");
    /* 1.5 s for the whole swing, sunrise to sunset: it is the one thing the
       last line asks the child to watch, and it has about three seconds. */
    if (cSw != null && t >= cSw) return clamp((t - cSw) / 1.5, 0, 2);
    if (cAway != null && t >= cAway) return 3;
    if (cTurn != null && t >= cTurn) return 2;
    if (cFaces != null && t >= cFaces) return 1;
    return 0;
  }

  /* the stick as you see it from the ground: the Sun on its arc, the shadow
     swinging and changing length. u is ssSpinAt's 0..2 (day only). */
  var SS_STICK = { x: 898, ground: 356, h: 96, R: 168 };
  /* Where the Sun stands, and the shadow it casts, for u = ssSpinAt's 0..2
     (the daylight half). The Sun climbs to 68 degrees at midday rather than
     straight overhead, because a Sun exactly overhead casts NO shadow and the
     lesson's own caption says "the shadow short". `len` is the shadow ON THE
     GROUND and `tip` where it ends, always away from the Sun; the direction
     turns over at midday, where the shadow is at its shortest, so it swings
     round without ever jumping. */
  function ssSunAt(u) {
    var S = SS_STICK;
    u = clamp(u, 0, 2);
    var deg = u <= 1 ? 158 - 46 * u : 112 - 90 * (u - 1);
    var a = deg * Math.PI / 180, elev = Math.max(14, deg <= 90 ? deg : 180 - deg);
    var len = Math.min(2.4 * S.h, S.h / Math.tan(elev * Math.PI / 180));
    return {
      a: a, x: S.x + S.R * Math.cos(a), y: S.ground - S.R * Math.sin(a),
      len: len, tip: S.x + (Math.cos(a) < 0 ? len : -len)
    };
  }
  /* The ground is a STRIP, not a line, because the shadow lies on it: drawn as
     a sliver above an 8 px line, the shadow was hidden under the line itself
     and the one thing this chapter asks the child to watch was invisible. */
  var SS_GRASS = 20;
  function ssGround(o) {
    return R(SS_STICK.x - 250, SS_STICK.ground, 500, SS_GRASS, 0, "#6B4A2B", null, null, o == null ? null : { opacity: o });
  }
  function ssStickPanel(t, u, o) {
    if (!(o > 0)) return "";
    var S = SS_STICK, k = ssSunAt(u), g = S.ground, out = "";
    out += ssGround();
    /* the path the Sun takes, at the radius it actually travels on */
    out += Pth("M" + n2(S.x - S.R) + "," + n2(g) + " A" + n2(S.R) + "," + n2(S.R) + " 0 0 1 " + n2(S.x + S.R) + "," + n2(g),
      null, P.line, 1.6, { opacity: 0.45, "stroke-dasharray": "9 8" });
    out += ssSun(k.x, k.y, 22, 1, t);
    /* the shadow lying along the ground, then the stick that casts it */
    out += L(S.x, g + 10, k.tip, g + 10, "#12212D", 12, { opacity: 0.95 });
    out += R(S.x - 6, g - S.h, 12, S.h + 4, 5, "#8B6A3A", "#6B4A2B", 2);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the clock of one spin: twenty-four marks and a hand that goes round once */
  function ssClock(t, cHours, cDay, o) {
    if (!(o > 0)) return "";
    var cx = 898, cy = 196, r = 108, out = "", k;
    out += C(cx, cy, r + 16, P.card, P.line, 2);
    for (k = 0; k < 24; k++) {
      var a = -Math.PI / 2 + k * Math.PI / 12, big = k % 6 === 0;
      out += L(cx + Math.cos(a) * (r - (big ? 16 : 9)), cy + Math.sin(a) * (r - (big ? 16 : 9)),
        cx + Math.cos(a) * r, cy + Math.sin(a) * r, big ? P.gold : P.muted, big ? 4 : 2);
    }
    var u = clamp(on(t, cHours, 1.6), 0, 1), ha = -Math.PI / 2 + u * Math.PI * 2;
    out += Pth("M" + n2(cx) + "," + n2(cy - r + 22) + " A" + n2(r - 22) + "," + n2(r - 22) + " 0 " +
      (u > 0.5 ? 1 : 0) + " 1 " + n2(cx + Math.cos(ha) * (r - 22)) + "," + n2(cy + Math.sin(ha) * (r - 22)),
      null, P.gold, 5, { opacity: u > 0.01 ? 1 : 0 });
    out += L(cx, cy, cx + Math.cos(ha) * (r - 26), cy + Math.sin(ha) * (r - 26), P.gold, 6) + C(cx, cy, 7, P.gold);
    out += Tx(cx, cy + 58, "24 hours", "lab big gold", "middle");
    out += MK.pill(cx, cy + r + 62, "one spin = one day", on(t, cDay, 0.4), { size: 26, col: P.gold });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function ssSpinChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSpins = c(0, "spins"), cHours = c(0, "hours"), cDay = c(0, "day");
    var cAxis = c(1, "axis"), cLine = c(1, "line"), cPoles = c(1, "poles");
    var cFaces = c(2, "faces"), cIsDay = c(2, "day"), cMid = c(2, "midday"), cHigh = c(2, "high");
    var cTurn = c(3, "turn"), cLow = c(3, "low"), cSet = c(3, "sunset");
    var cAway = c(4, "away"), cNight = c(4, "night"), cStill = c(4, "still"), cYou = c(4, "you");
    var cSw = c(5, "swings"), cLen = c(5, "length");

    /* The card steps in quarters and the sky beside it moves continuously, so
       the card shows the quarter NEAREST the sky, not the one behind it. With
       floor, the swing of the last line left the card saying "midday: the Sun
       is high, the shadow short" beside a low Sun and a long shadow. */
    var u = ssSpinAt(t, scene), h = clamp(Math.round(u), 0, 3);
    var gx = ssDX(160), gy = ssDY(110), gr = 70 * SS_DAY.k, out = "";
    out += ssDayCard(h);

    /* "The Earth spins": a turning arrow round the lesson's globe, over the top
       drawn down its left side as the words are said.
       Two things fix its shape. It must turn the way the lesson's globe turns,
       which is ANTICLOCKWISE - the "you" marker goes top, left, bottom, right
       as the Spin button is pressed (the sim says so in its own comment), so
       the head leads towards the smaller screen angle. And it must keep to the
       LEFT of the globe. The lesson draws its from-where-you-stand inset over
       the globe's lower right, so a ring right round the globe crossed it; and
       the "you" marker sits on top of the globe at sunrise with its label
       above it, so an arc over the top crossed that. -120 to -240 degrees is
       the left side alone: clear of the inset, of "you", and of the Sun. */
    var sp = on(t, cSpins, 1.0), rr = gr + 44;
    if (sp > 0) {
      var a1 = -120 * Math.PI / 180, aN = lerp(a1, -240 * Math.PI / 180, sp);
      out += Pth("M" + n2(gx + Math.cos(a1) * rr) + "," + n2(gy + Math.sin(a1) * rr) +
        " A" + n2(rr) + "," + n2(rr) + " 0 0 0 " + n2(gx + Math.cos(aN) * rr) + "," + n2(gy + Math.sin(aN) * rr),
        null, P.gold, 6, { opacity: 0.9 });
      out += MK.arrow(gx + Math.cos(aN + 0.2) * rr, gy + Math.sin(aN + 0.2) * rr,
        gx + Math.cos(aN - 0.06) * rr, gy + Math.sin(aN - 0.06) * rr, 1, P.gold, 6);
    }

    /* "its axis": the imaginary line through the middle, pole to pole */
    var ax = on(t, cAxis, 0.4) * ssSpan(t, scene, 1, 2), ln = on(t, cLine, 0.7);
    if (ax > 0) {
      /* The axis runs clear of the lesson's own "you" marker, which sits at
         the top of its globe at sunrise, and of the card's caption below. */
      var top = 34, bot = 376;
      out += L(gx, lerp(gy, top, ln), gx, lerp(gy, bot, ln), P.gold, 3.5, { opacity: ax, "stroke-dasharray": "12 9" });
      var po = popIn(t, cPoles, 0.4) * ax;
      if (po > 0) {
        out += MK.pop(C(gx, top + 6, 9, "none", P.gold, 3), gx, top + 6, po) +
          MK.pop(C(gx, bot - 6, 9, "none", P.gold, 3), gx, bot - 6, po);
        /* both labels to the LEFT of the axis: on the right the top one landed
           on the lesson's own "you" label, which sits over the globe's north
           pole at sunrise - the quarter this card is showing. */
        out += Tx(gx - 22, top + 12, "pole", "lab small gold", "end", { opacity: Math.min(1, po) }) +
          Tx(gx - 22, bot + 6, "pole", "lab small gold", "end", { opacity: Math.min(1, po) });
      }
      /* the word sits inside the card, beside the axis, so its line crosses
         nothing (it used to reach across and land on the clock) */
      out += ssLabel(t, 404, 42, "axis", cAxis, [gx + 5, top + 2], true, 28);
    }

    /* the right-hand side: the clock for the first two lines, then the stick */
    out += ssClock(t, cHours, cDay, ssSpan(t, scene, 0, 2));
    out += ssStickPanel(t, u, ssFrom(t, scene, 2) * (1 - (h === 3 ? on(t, cNight, 0.5) : 0)));
    /* at midnight there is no Sun in the sky and no shadow */
    if (h === 3) {
      var nn = on(t, cNight, 0.5);
      if (nn > 0) {
        var stars = "";
        for (var s = 0; s < 14; s++) {
          stars += C(700 + SS_SCATTER[s] * 420, 120 + SS_SCATTER[(s + 11) % 30] * 190,
            1.6 + SS_SCATTER[(s + 5) % 30] * 2, P.ink, null, null, { opacity: 0.5 + 0.4 * SS_SCATTER[(s + 2) % 30] });
        }
        out += G(ssGround() + stars +
          R(892, 260, 12, 100, 5, "#8B6A3A", "#6B4A2B", 2) +
          Tx(898, 414, "no Sun, no shadow: night", "lab mid muted", "middle"), { opacity: nn });
      }
    }
    /* the panel's own caption, over both the day and the night view */
    out += Tx(660, 42, "from where you stand", "lab mid muted", "start",
      { opacity: Math.min(1, ssFrom(t, scene, 2)) });

    /* a leader from the lesson's own little stick to the big one beside it. It
       lands ON the stick: it used to stop in mid-air short of it and read as a
       line to nothing. */
    var zo = on(t, cFaces, 0.7) * ssFrom(t, scene, 2) * (1 - (h === 3 ? on(t, cNight, 0.5) : 0));
    if (zo > 0) out += MK.leader(ssDX(288), ssDY(150), SS_STICK.x - 12, 302, zo, P.teal);

    /* The word for the quarter the card is in. It heads the view from the
       ground, on the right: at 340, 424 it sat squarely on the lesson's own
       caption ("midday: the Sun is high, the shadow short") and hung 7 px under
       the box as well. */
    out += MK.pill(1046, 44, "day", popIn(t, cIsDay, 0.4) * ssOnly(t, scene, 2), { size: 26, col: P.gold });
    out += MK.pill(1046, 44, "sunset", popIn(t, cSet, 0.4) * ssOnly(t, scene, 3), { size: 26, col: P.gold });
    out += MK.pill(1046, 44, "night", popIn(t, cNight, 0.4) * ssOnly(t, scene, 4), { size: 26, col: P.blue });
    /* "the Sun looks high", "the Sun looks low": a ring on the Sun in the sky.
       The Sun's place comes from ssSunAt and from nowhere else - this ring and
       the shadow rule below each carried their own copy of the angle, and both
       copies were of an OLDER ssSunAt, so the ring sat 20 px off the Sun at
       sunrise and 64 px off it at midday. */
    var hi = bump(t, cHigh, 1.1) * ssOnly(t, scene, 2), lo = bump(t, cLow, 1.1) * ssOnly(t, scene, 3);
    var sun = ssSunAt(u);
    if (hi + lo > 0) out += C(sun.x, sun.y, 40, "none", P.gold, 4, { opacity: Math.max(hi, lo) });
    /* "The Sun did not move. You did.": the lesson's Sun is ringed where it has
       stood all chapter, and the "you" marker, now on the far side, is ringed
       after it. There was a cross above the Sun here; a cross ON the Sun is
       read as the Sun being wrong, not as the Sun staying put. */
    var st = bump(t, cStill, 1.3), yo = on(t, cYou, 0.4) * ssOnly(t, scene, 4);
    if (st > 0) out += C(ssDX(20), ssDY(110), 40 * SS_DAY.k + 10, "none", P.gold, 4, { opacity: st });
    if (yo > 0) out += C(ssDX(160) + Math.cos((-3 * 90 - 90) * Math.PI / 180) * 70 * SS_DAY.k,
      ssDY(110) + Math.sin((-3 * 90 - 90) * Math.PI / 180) * 70 * SS_DAY.k, 26, "none", P.good, 4, { opacity: Math.min(1, yo) });
    /* "changes its length": the shadow's own length, measured under it, so the
       rule ends exactly where the shadow does */
    var le = on(t, cLen, 0.5) * ssOnly(t, scene, 5);
    if (le > 0) {
      var ly = SS_STICK.ground + SS_GRASS + 14;
      out += L(SS_STICK.x, ly, sun.tip, ly, P.gold, 4, { opacity: le }) +
        C(sun.tip, ly, 6, P.gold, null, null, { opacity: le }) +
        L(SS_STICK.x, ly - 9, SS_STICK.x, ly + 9, P.gold, 3, { opacity: le });
    }
    return svg(out);
  }


  /* ==== Our Earth, Our Sun, part 3: the Sun, the stars, the recap, KINDS ======= */

  /* the lesson's sky (SCENES.sky, 320 x 260), as a card on the left */
  var EO_SKY = { x: 40, y: 10, k: 420 / 260 };
  function eoSk(px, py) { return [EO_SKY.x + px * EO_SKY.k, EO_SKY.y + py * EO_SKY.k]; }
  var EO_SKY_W = 320 * EO_SKY.k;
  /* the stars the lesson draws in the night sky */
  var EO_STARS = [[40, 40, 2.5], [90, 90, 1.8], [150, 30, 2], [210, 70, 2.6], [270, 40, 1.8], [240, 130, 2], [60, 140, 1.6], [120, 150, 2.2], [290, 110, 1.6], [180, 120, 1.4]];

  /* the sky card, moving from state to state as each is named */
  function eoSkyCard(t, steps, extra) {
    var st = steps[0][0], from = st, at = null;
    for (var k = 1; k < steps.length; k++) if (steps[k][1] != null && t >= steps[k][1]) { from = st; st = steps[k][0]; at = steps[k][1]; }
    var u = at == null ? 1 : inAt(t, at, 0.8), h = 260 * EO_SKY.k;
    /* a frame, because the night sky is the stage's own colour: without one it
       is loose stars over a green bar */
    return R(EO_SKY.x - 2, EO_SKY.y - 2, EO_SKY_W + 4, h + 4, 5, "none", P.line, 3) +
      ART.place(ART.scene("sky", from), EO_SKY.x, EO_SKY.y, EO_SKY_W, h, extra) +
      (u > 0 && st !== from ? ART.place(ART.scene("sky", st), EO_SKY.x, EO_SKY.y, EO_SKY_W, h, 'opacity="' + n2(u) + '"') : "");
  }
  var EO_SKY_CLIP = '<defs><clipPath id="eo-skyclip"><rect x="' + EO_SKY.x + '" y="' + EO_SKY.y + '" width="' + n2(EO_SKY_W) + '" height="420"/></clipPath></defs>';

  /* ==== The Sun gives light and heat ============================================
     First the lesson's sky, night to sunrise to midday, with a thermometer that
     rises as the Sun warms things. Then the lesson's own test: the two cups in
     the sun and the shade (SIMS.sunShade), their thermometers climbing hour by
     hour exactly as the kit's "Wait an hour" climbs them. */
  var EO_CUP = { x: (1168 - 320 * 440 / 240) / 2, k: 440 / 240 };   /* SIMS.sunShade is 320 x 240 */
  function eoCp(px, py) { return [EO_CUP.x + px * EO_CUP.k, py * EO_CUP.k]; }

  function eoSunSky(scene, t) {
    var out = EO_SKY_CLIP + eoSkyCard(t, [[0, null], [1, sc(scene, 1, "rises")], [2, sc(scene, 2, "midday")]]);
    /* "light fills the sky": the light spreads out from the rising Sun */
    var fill = on(t, sc(scene, 1, "light"), 1.2) * eoUntil(t, scene, 1);
    if (fill > 0) { var s1 = eoSk(62, 200); out += G(MK.glow(s1[0], s1[1], 120 + 360 * fill, EO.sun, 1.6 * fill), { "clip-path": "url(#eo-skyclip)" }); }
    /* "It warms the ground": heat rising off the lesson's grass */
    var gw = on(t, sc(scene, 2, "ground"), 0.4);
    if (gw > 0) { var g1 = eoSk(90, 214), g2 = eoSk(230, 214); out += eoShimmer(g1[0], g1[1], 70, t, gw) + eoShimmer(g2[0], g2[1], 70, t + 0.4, gw); }

    /* the thermometer: cool at night, a little warmer at sunrise, warm at midday */
    var tx = 660, ty = 34, th = 250;
    var v = 22 + 8 * on(t, sc(scene, 1, "rises"), 1.5);
    var rise0 = sc(scene, 2, "ground"), rise1 = sc(scene, 2, "skin");
    if (rise0 != null) v += 50 * inAt(t, rise0, Math.max(0.8, (rise1 == null ? rise0 + 1.5 : rise1) - rise0 + 0.5));
    var therm = popIn(t, sc(scene, 0, "cool"), 0.45);
    if (therm > 0) {
      var warm = clamp((v - 28) / 40, 0, 1);
      out += MK.pop(eoTherm(tx, ty, th, v, EO.cool) + G(eoTherm(tx, ty, th, v, EO.warm), { opacity: warm }), tx, ty + th / 2, therm);
    }

    /* the lesson's words */
    out += eoLabel(740, 118, "dark", "lab huge", "start", eoShow(t, scene, 0, "dark", 0.4), { "font-size": 60 });
    out += eoLabel(740, 206, "cooler", "lab huge", "start", eoShow(t, scene, 0, "cool", 0.4), { "font-size": 60, fill: EO.cool });
    out += eoLabel(740, 150, "light", "lab huge", "start", eoShow(t, scene, 1, "light", 0.5), { "font-size": 72, fill: P.gold });
    var two = eoFrom(t, scene, 2);
    if (two > 0) {
      out += eoLabel(740, 92, "warm", "lab huge", "start", on(t, sc(scene, 2, "ground"), 0.4), { "font-size": 60, fill: EO.warm });
      [["ground", "the ground", 176], ["sea", "the sea", 268], ["skin", "your skin", 360]].forEach(function (w) {
        var a = sc(scene, 2, w[0]), o = popIn(t, a, 0.4);
        if (o <= 0) return;
        var icon = w[0] === "ground" ? R(746, w[2] - 22, 58, 44, 8, EO.soil) + R(746, w[2] - 22, 58, 12, 5, EO.grass) :
          Em(775, w[2], 50, w[0] === "sea" ? "\u{1F30A}" : "\u{1F9D2}");
        /* each thing glows warm as it is named */
        out += C(775, w[2], 40, EO.warm, null, null, { opacity: 0.32 * on(t, a, 0.5) * (0.7 + 0.3 * breathe(t)) }) +
          MK.pop(icon, 775, w[2], o) + eoLabel(826, w[2] + 11, w[1], "lab big", "start", o);
      });
    }
    return out;
  }

  function eoSunCups(scene, t) {
    var K = EO_CUP.k, out = "";
    var wait = sc(scene, 4, "wait"), warmer = sc(scene, 4, "warmer"), cool = sc(scene, 4, "cool");
    var H = wait == null ? 0 : 3 * inAt(t, wait, Math.max(1.2, (warmer == null ? wait + 2 : warmer) - wait + 0.15));
    var hour = Math.floor(H + 0.02);
    var warn = eoFrom(t, scene, 6);
    out += G(ART.place(ART.sim("sunShade", "draw", hour, 20 + H * 22, 20 + H * 5), EO_CUP.x, 0, 320 * K, 440), { opacity: 1 - 0.95 * warn });

    /* "Put one cup of water in the sun. Put one in the shade." */
    var three = eoUntil(t, scene, 3);
    var rs = on(t, sc(scene, 3, "sun"), 0.4), rh = on(t, sc(scene, 3, "shade"), 0.4);
    var cs = eoCp(60, 170), ch = eoCp(250, 170);
    if (rs > 0) out += C(cs[0], cs[1], 58, "none", P.gold, 5, { opacity: three * rs * (1 - 0.6 * rh) }) + MK.ripple(cs[0], cs[1], t, sc(scene, 3, "sun"), P.gold);
    if (rh > 0) out += C(ch[0], ch[1], 58, "none", P.blue, 5, { opacity: three * rh }) + MK.ripple(ch[0], ch[1], t, sc(scene, 3, "shade"), P.blue);

    /* "Wait an hour. The cup in the sun gets warmer. The shade one stays cool." */
    var four = eoUntil(t, scene, 4) * eoFrom(t, scene, 4);
    if (four > 0) {
      var hg = on(t, wait, 0.4);
      /* the hourglass turns as the hours go by; the count shows once an hour has passed */
      out += G(Em(150, 96, 82, "⏳", { transform: "rotate(" + n2(180 * H) + " 150 96)" }) +
        (hour >= 1 ? Tx(150, 190, hour === 1 ? "1 hour" : hour + " hours", "lab big", "middle") : ""), { opacity: four * hg });
      var tS = eoCp(110, 60), tH = eoCp(300, 60);
      var wo = on(t, warmer, 0.45), co = on(t, cool, 0.45);
      if (wo > 0) {
        out += R(tS[0] - 22, tS[1] - 12, 44, 118 * K * 0.95, 22, "none", P.gold, 4, { opacity: four * wo * (1 - 0.6 * co) });
        out += G(MK.leader(252, 272, tS[0] - 24, 262, wo, EO.warm), { opacity: four });
        out += eoLabel(240, 286, "warmer", "lab huge", "end", wo * four, { fill: EO.warm });
      }
      if (co > 0) {
        out += R(tH[0] - 22, tH[1] - 12, 44, 118 * K * 0.95, 22, "none", P.blue, 4, { opacity: four * co });
        out += G(MK.leader(922, 272, tH[0] + 24, 262, co, EO.cool), { opacity: four });
        out += eoLabel(934, 286, "cool", "lab huge", "start", co * four, { fill: EO.cool });
      }
    }

    /* "The Sun is a source of light and heat. Both come from the Sun." */
    var five = eoUntil(t, scene, 5) * eoFrom(t, scene, 5);
    if (five > 0) {
      var src = sc(scene, 5, "source"), both = sc(scene, 5, "both"), sp = eoCp(60, 40);
      var so = on(t, src, 0.5);
      /* the Sun sits 73 px from the top of the box, so its glow may reach 70 */
      out += G(MK.glow(sp[0], sp[1], 70, EO.sun, 2.2 * so * (0.75 + 0.25 * breathe(t))) +
        C(sp[0], sp[1], 56 + 6 * breathe(t), "none", P.gold, 4, { opacity: so }), { opacity: five });
      [["light", P.gold, [262, 92], 0], ["heat", EO.warm, [262, 226], 0.35]].forEach(function (a) {
        var u = on(t, src == null ? null : src + a[3], 0.6), end = a[2];
        if (u <= 0) return;
        var ang = Math.atan2(end[1] - sp[1], end[0] - sp[0]), sx = sp[0] + Math.cos(ang) * 60, sy = sp[1] + Math.sin(ang) * 60;
        var flow = "";
        if (both != null && t >= both) for (var j = 0; j < 3; j++) {
          var ph = ((t - both) * 0.9 + j / 3) % 1;
          flow += C(lerp(sx, end[0], ph), lerp(sy, end[1], ph), 7, a[1], null, null, { opacity: Math.sin(Math.PI * ph) * on(t, both, 0.4) });
        }
        out += G(MK.arrow(sx, sy, end[0], end[1], u, a[1], 7) + flow, { opacity: five });
        out += G(eoLabel(end[0] - 24, end[1] + 16, a[0], "lab huge", "end", u, { fill: a[1], "font-size": 54 }), { opacity: five });
      });
    }

    /* "Never look straight at the Sun. It is so bright it can hurt your eyes." */
    if (warn > 0) {
      var nv = sc(scene, 6, "never"), ey = sc(scene, 6, "eyes");
      var wp = popIn(t, nv, 0.45), look = on(t, nv == null ? null : nv + 0.3, 0.6);
      out += MK.pop(Em(584, 86, 104, "⚠️"), 584, 86, wp);
      out += G(eoSunBall(372, 300, 62, { glow: 1, spin: t * 8 }), { opacity: warn });
      out += G(Em(806, 300, 150, "\u{1F440}"), { opacity: Math.min(1, wp) });
      if (look > 0) out += G(L(716, 300, lerp(716, 486, look), 300, P.ink, 4, { "stroke-dasharray": "14 12" }), { opacity: look * 0.8 });
      var no = popIn(t, ey, 0.45);
      if (no > 0) out += MK.pop(C(806, 300, 104, "none", P.bad, 14) + L(806 - 73, 300 - 73, 806 + 73, 300 + 73, P.bad, 14), 806, 300, no);
    }
    return out;
  }

  function sceneSun(scene, beat, t, i) {
    var toCups = eoFrom(t, scene, 3), out = "";
    if (toCups < 1) out += G(eoSunSky(scene, t), { opacity: 1 - toCups });
    if (toCups > 0) out += G(eoSunCups(scene, t), { opacity: toCups });
    return svg(out);
  }

  /* ==== The Sun is a star ======================================================
     The lesson's night sky; one of its tiny lights, up close, is a huge glowing
     ball like the Sun, and goes back to being a dot far away. Then the lesson's
     "The Sun is a star", and why it looks so big: it is the nearest one. */
  var EO_BALL = [880, 214];

  function eoStarSky(scene, t) {
    /* the lesson's picture steps back once the near-and-far picture beside it is the one being explained */
    var out = G(eoSkyCard(t, [[0, null], [3, sc(scene, 2, "star")]]), { opacity: 1 - 0.45 * on(t, sc(scene, 2, "big"), 0.5) });
    var toSun = on(t, sc(scene, 2, "star"), 0.8);
    /* "tiny lights": the lesson's stars twinkle */
    var tw = on(t, sc(scene, 0, "lights"), 0.5) * (1 - toSun);
    if (tw > 0) EO_STARS.forEach(function (s, j) {
      var p = eoSk(s[0], s[1]), k = 0.5 + 0.5 * Math.sin(t * 4.2 + j * 1.9);
      out += C(p[0], p[1], s[2] * EO_SKY.k * (1.6 + 1.4 * k), "#fff", null, null, { opacity: tw * (0.35 + 0.5 * k) }) +
        C(p[0], p[1], s[2] * EO_SKY.k * 5, "#fff", null, null, { opacity: tw * 0.12 * k });
    });
    /* "They are stars" */
    var so = eoShow(t, scene, 0, "stars", 0.4), sAt = sc(scene, 0, "stars");
    if (so > 0) {
      out += eoLabel(648, 214, "stars", "lab huge", "start", so, { "font-size": 72 });
      [8, 4, 5].forEach(function (n, j) {
        var p = eoSk(EO_STARS[n][0], EO_STARS[n][1]), u = on(t, sAt == null ? null : sAt + j * 0.18, 0.5);
        out += G(MK.leader(636, 196, p[0] + 8, p[1], u, P.gold), { opacity: so });
      });
    }

    /* "Each star is a huge ball of hot, glowing gas, very far away." */
    var ball = sc(scene, 1, "ball"), gas = sc(scene, 1, "gas"), far = sc(scene, 1, "far");
    var near = on(t, ball, 1.0) * (1 - on(t, far, 1.0)), star = eoSk(EO_STARS[8][0], EO_STARS[8][1]);
    var one = eoUntil(t, scene, 1);
    if (near > 0.001) {
      var bx = lerp(star[0], EO_BALL[0], near), by = lerp(star[1], EO_BALL[1], near), br = lerp(3, 116, near);
      out += G(L(star[0], star[1], bx, by - br, "#fff", 2) + L(star[0], star[1], bx, by + br, "#fff", 2), { opacity: 0.3 * near * one });
      out += G(eoSunBall(bx, by, br, { glow: on(t, gas, 0.5) * (0.65 + 0.35 * breathe(t)) + 0.2, spin: t * 14 }), { opacity: one });
      out += C(bx, by, br * (0.72 + 0.08 * breathe(t * 1.7)), "#FFE9A8", null, null, { opacity: 0.5 * on(t, gas, 0.5) * one });
    }
    var fo = on(t, far == null ? null : far + 0.6, 0.5) * one;
    if (fo > 0) {
      out += C(star[0], star[1], 9 + 5 * breathe(t), "none", P.gold, 3, { opacity: fo });
      out += G(L(star[0] + 14, star[1] + 6, EO_BALL[0] - 138, EO_BALL[1] - 10, P.gold, 3, { "stroke-dasharray": "10 10" }), { opacity: fo });
      out += eoLabel(EO_BALL[0] - 122, EO_BALL[1] + 4, "very far away", "lab huge", "start", fo);
    }

    /* "The Sun is a star too. It looks big because it is the nearest one." */
    var big = sc(scene, 2, "big"), nearest = sc(scene, 2, "nearest");
    var dg = popIn(t, big, 0.5), nr = on(t, nearest, 0.5);
    if (dg > 0) {
      var d = ART.place(eoGlobe(0, "sd", true), 596, 166, 100, 100) + eoSunBall(806, 216, 50, { glow: 0.6, spin: t * 5 });
      [[1010, 196], [1072, 238], [1128, 206]].forEach(function (p, j) {
        var k = 0.5 + 0.5 * Math.sin(t * 3.8 + j * 2.1);
        d += C(p[0], p[1], 3.6 + 1.6 * k, "#fff") + C(p[0], p[1], 12, "#fff", null, null, { opacity: 0.12 + 0.1 * k });
      });
      out += MK.pop(d, 860, 216, dg);
      out += eoLabel(646, 318, "Earth", "lab big", "middle", dg);
    }
    if (nr > 0) {
      out += G(L(650, 356, 806, 356, P.gold, 5) + L(650, 344, 650, 368, P.gold, 5) + L(806, 344, 806, 368, P.gold, 5), { opacity: nr });
      out += eoLabel(728, 404, "nearest", "lab huge", "middle", nr, { fill: P.gold });
      out += G(L(830, 356, 1128, 356, P.muted, 3, { "stroke-dasharray": "10 10" }), { opacity: on(t, nearest == null ? null : nearest + 0.4, 0.5) });
      out += eoLabel(1060, 404, "far away", "lab big muted", "middle", on(t, nearest == null ? null : nearest + 0.4, 0.5));
    }
    return out;
  }

  function sceneStar(scene, beat, t, i) {
    var last = eoFrom(t, scene, 3), out = "";
    if (last < 1) out += G(eoStarSky(scene, t), { opacity: 1 - last });
    if (last > 0) {
      /* "Earth is our planet. The Sun is our star." */
      var pa = sc(scene, 3, "planet"), sa = sc(scene, 3, "star"), pp = popIn(t, pa, 0.5), sp = popIn(t, sa, 0.5);
      out += G(MK.pop(ART.place(eoGlobe(0, "op", true), 136, 24, 310, 310), 291, 179, pp) +
        eoLabel(291, 404, "our planet", "lab huge", "middle", on(t, pa, 0.45), { "font-size": 52 }) +
        /* the box is inset so the glow stays inside while the Sun pops in past full size */
        MK.pop(eoSunBall(862, 178, 82, { glow: 0.9, spin: t * 6, box: [0, 20, 1168, 420] }), 862, 178, sp) +
        eoLabel(862, 404, "our star", "lab huge", "middle", on(t, sa, 0.45), { "font-size": 52, fill: P.gold }), { opacity: last });
    }
    return svg(out);
  }

  /* ==== What you now know ======================================================= */
  var EO_RECAP = [
    { beat: 0, at: "planet", title: "Our planet", sub: "Earth, where we live",
      pic: function (cx, cy, s) { return ART.place(eoGlobe(0, "r1", true), cx - 58, cy - 58, 116, 116); } },
    { beat: 0, at: "water", title: "Mostly water", sub: "7 of 10 catches on water",
      pic: function (cx, cy) {
        var o = "";
        for (var j = 0; j < 10; j++) o += C(cx - 117 + j * 26, cy, 10, j < 7 ? EO.ocean : EO.land, P.ink, 1.5);
        return o;
      } },
    { beat: 1, at: "land", title: "Soil and rock", sub: "soil on top, rock underneath",
      pic: function (cx, cy) { return ART.place(ART.scene("ground", 3), cx - 56, cy - 52, 112, 105); } },
    { beat: 2, at: "heat", title: "Light and heat", sub: "the Sun gives us both",
      pic: function (cx, cy) { return ART.place(ART.scene("sky", 2), cx - 64, cy - 52, 128, 104); } },
    { beat: 2, at: "star", title: "A star", sub: "the nearest star to Earth",
      pic: function (cx, cy, s, t) { return eoSunBall(cx, cy, 28, { glow: 0.5, spin: t * 6 }); } }
  ];

  var KINDS = {
    title: MK.titleKind({ sub: ["The planet we live on, and its water.", "What the land is made of.", "What the Sun gives us, and what it is."] }),
    planet: scenePlanet, water: sceneWater, ground: sceneGround, sun: sceneSun, star: sceneStar,
    recap: MK.recapKind(EO_RECAP, { goBeat: 3, goAt: "go" })
  };


  /* ==== Sounds Near and Far, part 4: "Look after your ears", the recap, and
     KINDS ===================================================================== */

  /* ==== chapter: look after your ears ===========================================
     One picture a line. The ear hears a gentle sound, then a very loud one
     hurts it. The two rules the lecture gives, each crossed: a shout into an
     ear, a drum next to a head. The lesson's sound makers, and the drum hit
     gently. Then the lesson's own advice: cover your ears and move away, and
     the loud sound no longer reaches you. Loud sound is red here, and only here. */
  var SN_LOUD = "#E5533D";

  function snEarHurt(scene, t) {
    var c = function (name) { return sc(scene, 0, name); };
    var hear = c("hear"), loud = c("loud"), hurt = c("hurt");
    var dx = 236, dy = 224, ex = 820, ey = 206, out = "";
    var reach = ex - 96 - dx - 84;
    out += snWaves(dx, dy, t, hear, { dir: -0.03, spread: 0.7, n: 3, period: 1.4, r0: 84, reach: reach, w: 5, floor: 0.5, until: loud });
    out += snWaves(dx, dy, t, loud, { dir: -0.03, spread: 0.75, n: 5, period: 0.8, r0: 84, reach: reach, w: 15, floor: 0.9, col: SN_LOUD });
    var jd = loud != null && t >= loud ? 3 * Math.sin((t - loud) * 61) : 0;
    out += G(MK.pic(dx, dy, 150, "\u{1F941}"), { transform: tr(jd, 0) + " " + around(dx, dy, 1 + 0.12 * bump(t, loud, 0.6)) });
    var hu = on(t, hurt, 0.35), je = hurt != null && t >= hurt ? 5 * Math.sin((t - hurt) * 47) : 0;
    out += MK.glow(ex, ey, 110, P.gold, on(t, hear, 0.5) * (1 - on(t, loud, 0.4)));
    out += MK.glow(ex, ey, 160, P.bad, hu * (1.6 + 0.6 * breathe(t)));
    out += G(MK.pic(ex, ey, 200, "\u{1F442}"), { transform: tr(je, 0) });
    out += MK.pop(MK.pill(ex, 396, "hurt", 1, { size: 30, col: P.bad, ink: P.bad }), ex, 396, popIn(t, hurt, 0.4));
    return out;
  }

  /* two things never to do, each on a card with a cross */
  function snNever(scene, t) {
    var c = function (name) { return sc(scene, 1, name); };
    var shout = c("shout"), drum = c("drum"), out = "";
    /* a card grows in without overshooting, so it never leaves the box */
    var card = function (x, at, inner) {
      var p = on(t, at, 0.4);
      return p > 0 ? G(R(x, 20, 548, 400, 28, P.paper) + inner, { opacity: p, transform: around(x + 274, 220, 0.9 + 0.1 * p) }) : "";
    };
    /* the first card comes in with its line; its shout starts on "shout" */
    out += card(10, BEATS[scene.first + 1].start - 0.2,
      MK.pic(150, 206, 200, "\u{1F5E3}\uFE0F") +
      snWaves(236, 186, t, shout, { dir: 0, spread: 0.75, n: 4, period: 0.7, r0: 30, reach: 150, w: 12, floor: 0.85, col: SN_LOUD }) +
      MK.pic(454, 196, 136, "\u{1F442}") +
      MK.cross(496, 352, 34, popIn(t, shout == null ? null : shout + 0.8, 0.35)));
    out += card(610, drum,
      MK.pic(746, 286, 130, "\u{1F941}") +
      snWaves(746, 286, t, drum, { dir: -0.55, spread: 0.9, n: 4, period: 0.7, r0: 70, reach: 110, w: 12, floor: 0.85, col: SN_LOUD }) +
      MK.pic(972, 180, 170, "\u{1F9D2}") +
      MK.cross(1096, 352, 34, popIn(t, drum == null ? null : drum + 0.8, 0.35)));
    return out;
  }

  /* the lesson's sound makers (its "Safe ears" step), and the drum hit gently */
  var SN_MAKERS = [
    { pic: "\u{1F941}", name: "drum", x: 176 },
    { pic: "whistle", name: "whistle", x: 448 },
    { pic: "\u{1F96B}", name: "shaker", x: 720 },
    { pic: "\u{1F514}", name: "bell", x: 992 }
  ];
  function snMakers(scene, t) {
    var c = function (name) { return sc(scene, 2, name); };
    var use = c("use"), gently = c("gently"), out = "";
    SN_MAKERS.forEach(function (m, j) {
      var p = popIn(t, use == null ? null : use + j * 0.16, 0.4);
      if (p <= 0) return;
      var lv = j === 0 ? 1 : lerp(1, 0.35, on(t, gently, 0.4));
      var pic = m.pic === "whistle" ? ART.ICONS.whistle : m.pic;
      out += G(MK.pop(MK.pic(m.x, 150, 124, pic), m.x, 150, p) + Tx(m.x, 266, m.name, "lab big", "middle", { opacity: Math.min(1, p) }), { opacity: lv });
    });
    out += snBoth(176, 150, t, gently, { r0: 70, reach: 34, n: 2, period: 1.3, w: 4, op: 0.85 });
    out += MK.pop(MK.pill(176, 340, "gently", 1, { size: 30, col: P.good, ink: P.good }), 176, 340, popIn(t, gently, 0.4));
    out += MK.tick(296, 340, 24, popIn(t, gently == null ? null : gently + 0.4, 0.35));
    return out;
  }

  /* cover your ears and move away: the loud sound stops reaching the child */
  function snCover(scene, t) {
    var c = function (name) { return sc(scene, 3, name); };
    var cover = c("cover"), move = c("move"), start = BEATS[scene.first + 3].start - 0.3;
    var dx = 170, dy = 230, m = on(t, move == null ? null : move - 0.15, 0.9);
    var kx = lerp(470, 930, m), ky = 206, out = "";
    out += snWaves(dx, dy, t, start, { dir: 0, spread: 0.95, n: 5, period: 0.8, r0: 80, reach: 330, w: 13, floor: 0.15, col: SN_LOUD });
    out += MK.pic(dx, dy, 140, "\u{1F941}");
    out += MK.pic(kx, ky, 170, "\u{1F9D2}");
    var cv = on(t, cover, 0.5);
    if (cv > 0) {
      var hx = lerp(150, 80, cv), op = Math.min(1, cv * 2);
      out += G(MK.pic(0, 0, 76, "\u270B"), { transform: tr(kx - hx, ky + 14), opacity: op }) +
        G(MK.pic(0, 0, 76, "\u270B"), { transform: tr(kx + hx, ky + 14) + " scale(-1,1)", opacity: op });
    }
    out += MK.tick(kx + 118, ky - 96, 26, popIn(t, move == null ? null : move + 0.55, 0.35));
    return out;
  }

  function snEars(scene, beat, t, i) {
    var pics = [snEarHurt, snNever, snMakers, snCover];
    return svg(crossfade(t, i, scene, function (bi) { return pics[bi - scene.first](scene, t); }));
  }

  /* ==== the recap's two drawn pictures ========================================== */
  function snRecapBand(cx, cy, size, t) {
    var x1 = cx - size * 0.62, x2 = cx + size * 0.62, y = cy, a = size * 0.16, out = "";
    out += C(x1, y, size * 0.07, "#C9A36A") + C(x2, y, size * 0.07, "#C9A36A");
    for (var k = 0; k <= 6; k++) {
      var d = a * Math.cos(Math.PI * k / 6);
      out += Pth("M" + n2(x1) + "," + n2(y) + " Q" + n2(cx) + "," + n2(y + 2 * d) + " " + n2(x2) + "," + n2(y), null, SN_RUBBER, 4, { opacity: 0.25 });
    }
    return out + Pth("M" + n2(x1) + "," + n2(y) + " Q" + n2(cx) + "," + n2(y + 2 * a * Math.sin(t * 50)) + " " + n2(x2) + "," + n2(y), null, SN_RUBBER, 5);
  }
  function snRecapFar(cx, cy, size, t) {
    var bx = cx - size * 0.6, out = "";
    for (var k = 0; k < 3; k++) {
      var r = size * (0.42 + k * 0.3), g = SN_GAIN[k * 3];
      out += Pth("M" + n2(bx + r * Math.cos(-0.6)) + "," + n2(cy + r * Math.sin(-0.6)) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " +
        n2(bx + r * Math.cos(0.6)) + "," + n2(cy + r * Math.sin(0.6)), null, P.gold, 3 + 6 * g, { opacity: 0.25 + 0.75 * g });
    }
    return out + MK.pic(bx, cy, size * 0.62, "\u{1F514}");
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Every sound has a source", "Sound is shaking", "Near is loud, far is quiet"] }),
    source: snSource,
    shake: snShake,
    nearfar: snNearFar,
    table: snLoudness,
    ears: snEars,
    recap: MK.recapKind([
      { beat: 0, at: "source", title: "A source", sub: "every sound comes from one", pic: "\u{1F941}" },
      { beat: 0, at: "shakes", title: "Shaking", sub: "shaking makes a sound", pic: snRecapBand },
      { beat: 1, at: "further", title: "Far is quiet", sub: "the further, the quieter", pic: snRecapFar },
      { beat: 2, at: "table", title: "A table", sub: "loud, medium, quiet", pic: "\u{1F4DD}" },
      { beat: 3, at: "ears", title: "Your ears", sub: "look after them", pic: "\u{1F442}" }
    ], { goBeat: 3, goAt: "after" })
  };


  /* ==== Alive or Never Alive, part 2 of 3: what animals need, what plants need ==== */

  var CAT = "\u{1F431}", CHILD = "\u{1F9D2}", AIR = "\u{1F32C}️", FISH = "\u{1F41F}", WOOL = "\u{1F9F6}";

  /* ==== chapter: what animals need =============================================
     The lesson's cat, and its sort ("What does the cat need?"): the three needs
     fill a "needs" box as each is said, the ball of wool rolls into "wants",
     and the child joins the cat, needing the same three things. */
  var NEED_Y = [150, 256, 362];
  var NEEDS = [[AIR, "air", "air"], [DROP, "water", "water"], [FISH, "food", "food"]];

  /* breath: small puffs leaving (x, y) to the right, while it breathes */
  function breath(x, y, t, at, dur) {
    if (at == null || t < at || t > at + dur) return "";
    var out = "", fade = 1 - clamp((t - at - dur + 0.5) / 0.5, 0, 1);
    for (var k = 0; k < 3; k++) {
      var ph = ((t - at) / 1.1 + k / 3) % 1, px = x + 10 + 90 * ph, py = y - 6 * Math.sin(ph * 6);
      out += Pth("M" + n2(px) + "," + n2(py) + " q12,-12 24,0 t24,0", null, P.sky, 5, { opacity: (1 - ph) * fade });
    }
    return out;
  }

  function sceneAnimals(scene, beat, t, i) {
    var hue = HUE.animals, c = function (b, n) { return sc(scene, b, n); };
    var catIn = c(0, "cat"), animal = c(0, "animal"), three = c(0, "three");
    var got = [c(1, "air"), c(1, "water"), c(1, "food")];
    var wool = c(2, "wool"), wants = c(2, "wants"), diff = c(2, "diff");
    var you = c(3, "you"), again = [c(3, "air"), c(3, "water"), c(3, "food")], likeCat = c(3, "cat");
    var out = ground(268, 330, 194, inAt(t, scene.start, 0.5));

    /* the cat, which starts at each need as it is named; then the child */
    var cp = popIn(t, catIn, 0.45);
    var pulse = 1 + 0.07 * (bump(t, animal, 0.7) + bump(t, got[0], 0.6) + bump(t, got[1], 0.6) + bump(t, got[2], 0.6) + bump(t, likeCat, 0.7));
    if (cp > 0) out += G(Em(172, 232, 178, CAT), { transform: around(172, 320, Math.min(cp, 1.1) * pulse), opacity: Math.min(1, cp) });
    out += breath(242, 262, t, got[0], 2.4);
    var yp = popIn(t, you, 0.45);
    if (yp > 0) out += G(Em(372, 244, 150, CHILD), { transform: around(372, 320, Math.min(yp, 1.1) * (1 + 0.07 * bump(t, likeCat, 0.7))), opacity: Math.min(1, yp) });
    out += MK.pill(272, 396, "animals", on(t, you, 0.45), { size: 28, col: hue, ink: hue });

    /* the needs box: three places on "three things", filled as each is said,
       and lit again when the child is said to need them too */
    var bo = on(t, three, 0.4);
    if (bo > 0) {
      var nb = R(470, 18, 420, 404, 24, P.card, P.line, 2) +
        Tx(680, 72, "needs", "lab big", "middle", { fill: P.good, transform: around(680, 62, 1 + 0.15 * bump(t, diff, 0.8)) });
      for (var r = 0; r < 3; r++) {
        var y = NEED_Y[r], so = on(t, three + r * 0.18, 0.3), p = popIn(t, got[r], 0.4), lit = bump(t, again[r], 0.9);
        if (so <= 0) continue;
        nb += G(C(548, y, 44, lit > 0 ? "#1B3A52" : P.cell, lit > 0.05 ? hue : P.line, 2 + 3 * lit, { "stroke-dasharray": p > 0 ? null : "8 7" }), { opacity: so });
        if (p > 0) nb += G(Em(548, y, 62, NEEDS[r][0]), { transform: around(548, y, Math.min(p, 1.1) * (1 + 0.15 * lit)), opacity: Math.min(1, p) }) +
          Tx(616, y + 11, NEEDS[r][1], "lab big", "start", { opacity: Math.min(1, p) });
      }
      out += G(nb, { opacity: bo });
    }

    /* the wants box, and the ball of wool rolling into it */
    var wo = on(t, wool == null ? null : wool - 0.1, 0.4);
    if (wo > 0) {
      out += G(R(912, 18, 252, 404, 24, P.card, P.line, 2) +
        Tx(1038, 72, "wants", "lab big muted", "middle", { transform: around(1038, 62, 1 + 0.15 * (bump(t, wants, 0.8) + bump(t, diff, 0.8))) }), { opacity: wo });
      var roll = on(t, wool, 0.7), wx = lerp(1080, 1038, roll);   /* from further right it left the box while turning */
      out += G(Em(wx, 250, 104, WOOL), { opacity: Math.min(1, roll * 2), transform: "rotate(" + n2(-200 * (1 - roll)) + " " + n2(wx) + " 250)" });
    }
    return svg(out);
  }

  /* ==== chapter: what plants need ==============================================
     The kit's own drawings. The growing seed (ART.scene "plant", the lesson
     kit's seed-to-flower states) grows on "grows into a new plant"; then the
     tap plant (ART.figure "plant"), whose leaves and roots are pointed at with
     the lesson's own tap outline, one part at a time: light from the Sun
     reaches the leaves, water rises from the soil into the roots, and air
     moves round it. The last line takes the water away and leaves a question. */
  var FIG = { x: 72, y: 6, s: 380 / 320 };                  /* the tap plant: 320 x 360, drawn 380 x 427.5 */
  function fx(x) { return FIG.x + x * FIG.s; }
  function fy(y) { return FIG.y + y * FIG.s; }
  var LEAVES = [fx(248), fy(170)], ROOTS = [fx(210), fy(290)], SUN = [560, 100];
  var LABEL_X = 800;

  /* The seed grows through the kit's six states, 0.22 s each, from just after
     "A seed", so the flower is out before the line ends: begun on "grows" it
     was still at three leaves when the next line cut to the tap plant. */
  var GROW_STEP = 0.22;
  function seedScene(t, grows, seed) {
    var raw = grows == null || t < grows ? 0 : 1 + Math.floor((t - grows) / GROW_STEP), st = Math.min(5, raw);
    var u = raw === 0 || raw > 5 ? 1 : ease(((t - grows) % GROW_STEP) / (GROW_STEP * 0.6));
    var box = function (s, o) { return G(ART.place(ART.scene("plant", s), 82, 70, 360, 360), { opacity: o }); };
    return R(72, 60, 380, 380, 18, P.card, P.line, 2) + (st > 0 && u < 1 ? box(st - 1, 1) : "") + box(st, u) +
      G(C(82 + 160 * 1.125, 70 + 250 * 1.125, 24, "none", P.gold, 5), { opacity: bump(t, seed, 1.3) });
  }

  /* the tap plant: `ring` its part being named, `bright` the parts already
     named; with neither, the whole plant is bright. The rest is darkened, not
     faded: the flower is drawn over the leaves, and at ART.dim's opacity the
     leaves showed through it as a ghost. A brightness filter keeps each part
     opaque, as the lesson draws it. */
  function shade(markup, part) {
    var at = markup.indexOf('<g data-part="' + part + '"');
    if (at < 0) throw new Error("the plant figure has no part " + JSON.stringify(part));
    return markup.slice(0, at + 2) + ' style="filter:brightness(0.42) saturate(0.55)"' + markup.slice(at + 2);
  }
  function plantFigure(ring, bright) {
    var svgp = ART.figure("plant");
    if (ring || bright.length) ART.parts(svgp).forEach(function (p) { if (p !== ring && bright.indexOf(p) < 0) svgp = shade(svgp, p); });
    if (ring) svgp = ART.ring(svgp, ring, P.gold, 6);
    return R(62, 0, 400, 440, 22, P.card, P.line, 2) + ART.place(svgp, FIG.x, FIG.y, 380, 427.5);
  }

  function sun(o, t) {
    if (!(o > 0)) return "";
    var rays = "";
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4 + t * 0.4;
      rays += L(SUN[0] + 48 * Math.cos(a), SUN[1] + 48 * Math.sin(a), SUN[0] + 64 * Math.cos(a), SUN[1] + 64 * Math.sin(a), P.gold, 6);
    }
    return G(MK.glow(SUN[0], SUN[1], 76, P.gold, 1) + rays + C(SUN[0], SUN[1], 38, P.gold), { opacity: Math.min(1, o), transform: around(SUN[0], SUN[1], Math.min(o, 1.1)) });
  }

  /* light: beams travelling from the Sun to the leaves */
  function beams(t, at, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "", tg = [[fx(210), fy(150)], [fx(120), fy(140)], [fx(196), fy(186)]];
    tg.forEach(function (p, k) {
      var u = clamp((t - at - k * 0.15) / 0.7, 0, 1);
      if (u <= 0) return;
      out += L(SUN[0] - 30, SUN[1] + 26, lerp(SUN[0] - 30, p[0], u), lerp(SUN[1] + 26, p[1], u), P.gold, 4, { "stroke-dasharray": "10 8", opacity: 0.85 * o });
    });
    return out;
  }

  /* food being made in the leaves: small sparkles */
  var SPARKS = [[120, 140], [200, 120], [150, 170], [226, 150], [104, 118], [180, 190]];
  function sparkles(t, at, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "";
    SPARKS.forEach(function (p, k) {
      var a = clamp((t - at - k * 0.12) / 0.3, 0, 1) * (0.55 + 0.45 * Math.sin(t * 5 + k * 1.7));
      var x = fx(p[0]), y = fy(p[1]), r = 7;
      if (a > 0) out += Pth("M" + n2(x) + "," + n2(y - r * 1.6) + " L" + n2(x + r * 0.45) + "," + n2(y - r * 0.45) + " L" + n2(x + r * 1.6) + "," + n2(y) +
        " L" + n2(x + r * 0.45) + "," + n2(y + r * 0.45) + " L" + n2(x) + "," + n2(y + r * 1.6) + " L" + n2(x - r * 0.45) + "," + n2(y + r * 0.45) +
        " L" + n2(x - r * 1.6) + "," + n2(y) + " L" + n2(x - r * 0.45) + "," + n2(y - r * 0.45) + " Z", "#FFF3C4", null, null, { opacity: a * o });
    });
    return out;
  }

  /* water: drops rising from the soil into the roots and up the stem */
  function rising(t, at, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "", path = [[fx(150), fy(356)], [fx(160), fy(300)], [fx(160), fy(256)], [fx(160), fy(150)]];
    for (var k = 0; k < 6; k++) {
      var ph = ((t - at) / 2.2 + k / 6) % 1, p = polyAt(path, ph * polyLen(path));
      var start = clamp((t - at - k * 0.18) / 0.3, 0, 1);
      out += C(p[0] + (k % 2 ? 7 : -7), p[1], 7, "#6EC6F5", "#FFFFFF", 2, { opacity: o * start * (ph > 0.9 ? (1 - ph) * 10 : 1) });
    }
    return out;
  }

  /* air: curls moving round the plant */
  function airCurls(t, at, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "";
    [[fx(282), fy(96)], [fx(40), fy(80)], [fx(292), fy(196)]].forEach(function (p, k) {
      var ph = ((t - at) / 2.4 + k / 3) % 1, x = p[0] + 40 * ph - 20, a = clamp((t - at - k * 0.2) / 0.3, 0, 1) * Math.sin(Math.PI * ph);
      out += Pth("M" + n2(x - 26) + "," + n2(p[1]) + " q13,-14 26,0 t26,0 m-18,14 q9,-9 18,0", null, P.sky, 4, { opacity: a * o });
    });
    return out;
  }

  /* a label on the right, and a line from it to the thing it names (only the
     label being said draws its line) */
  function label(text, y, o, tip, lineO, col) {
    if (!(o > 0)) return "";
    var w = text.length * 28 * 0.56 + 28 * 1.3;
    return MK.leader(LABEL_X - w / 2 - 4, y, tip[0], tip[1], clamp(lineO, 0, 1) >= 1 ? 1 : lineO, col) +
      MK.pill(LABEL_X, y, text, o, { size: 28, col: col });
  }

  function scenePlants(scene, beat, t, i) {
    var k = i - scene.first, hue = HUE.plants, c = function (b, n) { return sc(scene, b, n); };
    var plants = c(0, "plants"), seed = c(0, "seed"), grows = c(0, "grows");
    var eat = c(1, "eat"), food = c(1, "food"), leaves = c(1, "leaves"), light = c(2, "light");
    var water = c(3, "water"), air = c(3, "air"), roots = c(3, "roots"), find = c(4, "find"), none = c(4, "none");
    var out = "";

    /* 1: the seed grows; "Plants are alive too" ticks it, as the goat was */
    if (k === 0 || into(t, scene.first + 1) < 1) {
      var so = k === 0 ? 1 : 1 - into(t, scene.first + 1);
      out += G(seedScene(t, seed == null ? grows : seed + 0.35, seed) +
        MK.tick(700, 214, 40, popIn(t, plants, 0.4)) + MK.pill(850, 214, "alive", on(t, plants, 0.4), { size: 34, col: P.good, ink: P.good }), { opacity: so });
    }
    if (k === 0) return svg(out);

    /* 2 to 5: the tap plant */
    var u = into(t, scene.first + 1);
    /* one part ringed at a time: the leaves while they are named, the roots
       while they are; the leaves stay bright once named; the whole plant is
       bright again for the last line */
    var ring = null, bright = [];
    if (k === 1 && leaves != null && t >= leaves) ring = "leaves";
    if (k === 2) bright = ["leaves"];
    if (k === 3) { bright = ["leaves"]; if (roots != null && t >= roots) ring = "roots"; }
    var end = on(t, none, 0.5), quiet = on(t, find, 0.5), later = 1 - 0.6 * on(t, beatStart(scene, 3), 0.5);
    var f = plantFigure(ring, bright);
    f += sparkles(t, food, (1 - quiet) * later) + sun(popIn(t, light, 0.45), t) + beams(t, light, (1 - quiet) * later);
    f += rising(t, water, 1 - end) + airCurls(t, air, 1 - quiet);

    /* "do not eat like animals": the lesson's own picture for the cat's food
       step, crossed out, until the plant is seen making its own */
    var ep = popIn(t, eat, 0.4) * (1 - on(t, food, 0.4));
    if (ep > 0) f += G(Em(LABEL_X, 250, 92, "\u{1F37D}️") + MK.cross(LABEL_X, 250, 60, 1), { transform: around(LABEL_X, 250, Math.min(ep, 1.1)), opacity: Math.min(1, ep) });

    /* the labels: each drawn as it is said, its line only while it is said */
    var fade = 1 - on(t, find, 0.5), now = function (at, next) { return at == null || t < at ? 0 : 1 - inAt(t, next, 0.4); };
    f += label("light", 84, on(t, light, 0.4) * fade, [SUN[0] + 70, SUN[1]], on(t, light, 0.5) * now(light, water), P.gold);
    f += label("leaves", 178, on(t, leaves, 0.4) * fade, LEAVES, on(t, leaves, 0.5) * now(leaves, light), hue);
    f += label("air", 262, on(t, air, 0.4) * fade, [fx(300), fy(200)], on(t, air, 0.5) * now(air, roots), P.sky);
    f += label("roots", 346, on(t, roots, 0.4) * fade, ROOTS, on(t, roots, 0.5) * now(roots, find), hue);
    f += label("water", 412, on(t, water, 0.4) * fade, [fx(236), fy(340)], on(t, water, 0.5) * now(water, air), P.blue);

    /* 5: no water, and a question */
    var q = popIn(t, none, 0.45);
    if (q > 0) f += G(Em(740, 250, 96, DROP) + MK.cross(740, 250, 58, 1), { transform: around(740, 250, Math.min(q, 1.1)), opacity: Math.min(1, q) }) +
      MK.qmark(930, 250, 66, Math.min(1, popIn(t, none == null ? null : none + 0.35, 0.45)));
    return svg(out + G(f, { opacity: u }));
  }

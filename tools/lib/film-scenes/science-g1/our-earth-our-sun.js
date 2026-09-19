
  /* ==== Grade 1 Science, Lesson 8: Our Earth, Our Sun ========================
     tools/lib/film-scenes/science-g1/our-earth-our-sun.js, with -2.js and -3.js
     after it: three parts of ONE script, joined in order between the engine's
     head and tail (science/grade-1-app/lecture-video/BRIEF.md).

       this part  the colours, the shared helpers, the title, "Our planet"
       -2.js      "Mostly water" and "Under the ground"
       -3.js      the two Sun chapters, the recap, and KINDS

     The pictures are the lesson's own, through ART: the zoom from a house to
     the planet, the globe the child catches ten times (science.js SCENES.globe,
     spun as the globeCatch sim spins it), the ground dug down to rock
     (SCENES.ground), the sky from night to midday and the Sun drawn as a star
     (SCENES.sky), and the two cups in the sun and the shade (SIMS.sunShade).
     What the film adds is only what a still picture cannot do: the zoom
     between the lesson's pictures, the finger and the tally of the catch, the
     heat and the light arriving, labels, and leader lines. */

  var HUE = {
    title: P.teal, planet: P.good, water: P.blue, ground: P.accent,
    sun: P.gold, star: P.plum, recap: P.teal
  };

  /* the lesson's own colours, from its drawings in science.js */
  var EO = {
    ocean: "#3B7FD1", land: "#4CB65C", soil: "#6B4A2B", rock: "#7D7F86", grass: "#3E8E4A",
    sun: "#F4C95D", warm: "#E9744F", cool: "#6E9DE8", sky: "#BFE3F5"
  };

  /* ==== timing helpers ======================================================== */

  /* 1 while beat k of the scene is on screen, fading out as the next beat of the
     same chapter comes in; a chapter's last beat keeps its things to the end */
  function eoUntil(t, scene, k) {
    var nb = scene.first + k + 1;
    return nb < scene.first + scene.beats.length ? 1 - inAt(t, BEATS[nb].start - GAP, 0.4) : 1;
  }
  /* from beat k's phrase `name` until the next beat takes over */
  function eoShow(t, scene, k, name, span) { return on(t, sc(scene, k, name), span || 0.4) * eoUntil(t, scene, k); }
  /* 0 before beat k of the scene, 1 once it has come in */
  function eoFrom(t, scene, k) { return k <= 0 ? 1 : inAt(t, BEATS[scene.first + k].start - GAP, 0.45); }
  /* 1 while beat k is the beat on screen: the brightness of "the one being named" */
  function eoNow(t, scene, k) { return eoFrom(t, scene, k) * eoUntil(t, scene, k); }

  /* ==== the lesson's globe ======================================================
     SCENES.globe(turn) is a 320 x 320 drawing: space, and the Earth, a disk of
     radius 120 at (160, 160) whose land is turned `turn` degrees. Its clip has
     an id, so a frame that shows two globes gives each its own. */
  var EO_GLOBE_BACK = '<rect width="320" height="320" fill="#0B1D2C"/>';
  function eoGlobe(turn, id, bare) {
    var s = ART.scene("globe", turn || 0);
    if (id) s = s.replace(/gclip/g, "gclip-" + id);
    /* bare: without its square of space, for a picture that is not a card */
    if (bare) s = s.replace(EO_GLOBE_BACK, "");
    return s;
  }
  /* where the drawing's point (px, py), turned with the land, lands on the page
     when the globe is placed at (x, y) with size s */
  function eoGlobePt(x, y, s, turn, px, py) {
    var a = (turn || 0) * Math.PI / 180, dx = px - 160, dy = py - 160, k = s / 320;
    return [x + (160 + dx * Math.cos(a) - dy * Math.sin(a)) * k, y + (160 + dx * Math.sin(a) + dy * Math.cos(a)) * k];
  }

  /* ==== the Sun, drawn as the lesson draws it ==================================
     SCENES.sky(3), "The Sun is a star": a gold disk of radius 58 with eight rays
     reaching 100 from its centre, 6 wide. The same proportions at any size. */
  function eoSunBall(cx, cy, r, o) {
    o = o || {};
    var out = "", len = r * 100 / 58, w = Math.max(1.5, r * 6 / 58), spin = o.spin || 0;
    for (var k = 0; k < 8; k++) {
      var a = (k * 45 + spin) * Math.PI / 180;
      out += L(cx, cy, cx + Math.sin(a) * len, cy - Math.cos(a) * len, EO.sun, w);
    }
    /* the glow stays inside the drawing's box (the scene's 1168 x 440, or o.box):
       past it, it would lie over the chapter heading or the spoken line */
    var b = o.box || [0, 0, 1168, 440];
    var gr = Math.min(r * 2.2, cx - b[0], b[2] - cx, cy - b[1], b[3] - cy) - 3;
    return (o.glow && gr > r ? MK.glow(cx, cy, gr, EO.sun, o.glow) : "") + out + C(cx, cy, r, EO.sun);
  }

  /* a thermometer drawn as SIMS.sunShade draws its two: a white tube 12 x 90,
     a coloured line v high (the kit's own a and b: 20 at the start, 86 after
     three hours in the sun), and a bulb of radius 10 */
  function eoTherm(x, y, h, v, col) {
    var k = h / 90;
    return R(x - 6 * k, y, 12 * k, h, 6 * k, "#fff") +
      R(x - 4 * k, y + (88 - v) * k, 8 * k, v * k, 4 * k, col) + C(x, y + 92 * k, 10 * k, col);
  }

  /* heat rising: three wavy lines that drift up and fade */
  function eoShimmer(x, y, w, t, o, col) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 3; k++) {
      var ph = (t * 0.8 + k / 3) % 1, yy = y - ph * 34, xx = x + (k - 1) * w * 0.34;
      out += Pth("M" + n2(xx) + "," + n2(yy) + " q7,-7 0,-14 t0,-14", null, col || EO.warm, 4, { opacity: o * Math.sin(Math.PI * ph) });
    }
    return out;
  }

  /* a map pin, its point at (x, y): your house */
  function eoPin(x, y, o, s) {
    if (!(o > 0)) return "";
    return G(Pth("M0,0 C-4,-10 -13,-15 -13,-26 A13,13 0 1 1 13,-26 C13,-15 4,-10 0,0 Z", EO.sun, P.ground, 2.5) +
      C(0, -26, 5, P.ground), { transform: tr(x, y, s || 1), opacity: o });
  }

  /* a ring that draws itself round a circle */
  function eoRing(cx, cy, r, u, col, w) {
    if (!(u > 0)) return "";
    var c = 2 * Math.PI * r;
    return C(cx, cy, r, "none", col || P.gold, w || 5, {
      "stroke-dasharray": n2(c) + " " + n2(c), "stroke-dashoffset": n2(c * (1 - clamp(u, 0, 1))),
      transform: "rotate(-90 " + n2(cx) + " " + n2(cy) + ")"
    });
  }

  /* a label that rises in */
  function eoLabel(x, y, text, cls, anchor, o, extra) {
    if (!(o > 0)) return "";
    return Tx(x, y, text, cls, anchor, Object.assign({ opacity: Math.min(1, o), transform: "translate(0," + n2((1 - Math.min(1, o)) * 10) + ")" }, extra || {}));
  }

  /* ==== the title =================================================================
     The Earth and the Sun, each arriving as it is named. */
  function titleMotif(o) {
    var t = o.t || 0, e = 1, s = 1, pe = 0, ps = 0;
    if (o.spoken && o.scene) {
      e = popIn(t, sc(o.scene, 0, "earth"), 0.5); s = popIn(t, sc(o.scene, 0, "sun"), 0.5);
      /* "What is Earth made of? And what does the Sun give us?": each swells as it is asked about */
      pe = bump(t, sc(o.scene, 1, "made"), 1.0); ps = bump(t, sc(o.scene, 1, "give"), 1.0);
    }
    /* the Earth's disk: centre (138, 218), radius 268 * 0.375 */
    var ring = pe > 0 ? C(138, 218, 108, "none", P.teal, 6, { opacity: pe }) : "";
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Earth and the Sun">' +
      /* the box is inset so the glow still fits the motif when the Sun swells */
      MK.pop(eoSunBall(272, 86, 40, { glow: 0.9 + 1.2 * ps, spin: t * 5, box: [12, 12, 348, 348] }), 272, 86, s * (1 + 0.14 * ps)) +
      MK.pop(ART.place(eoGlobe(0, "tm", true), 4, 84, 268, 268) + ring, 138, 218, e * (1 + 0.12 * pe)) +
      "</svg>";
  }

  /* ==== Our planet ==================================================================
     The lesson's zoom (SCENES.zoom: a house, a town, a country, the planet) as
     ONE continuous zoom out. Each picture shrinks into the middle of the next,
     and a pin keeps your house's place until it is a speck on the lesson's
     globe. Level k is 4^k units across; the camera shows 4^L units across the
     window, so each "Zoom out" moves L on by one. */
  var EO_ZOOM = { x: 58, y: 4, w: 460, h: 432, cx: 288, cy: 214, base: 258 };
  var EO_HOME = [115, 109];   /* your house on the globe: the middle of its largest land (measured) */
  /* the lesson's own zoom pictures (SCENES.zoom), so the film shows what the
     lesson shows: its country is the kit's map of one land since 2026-09-19 */
  var EO_LEVELS = [
    { pic: ART.scene("zoom", 0), label: "your house", k: 0, at: "house" },
    { pic: ART.scene("zoom", 1), label: "your town", k: 0, at: "town" },
    { pic: ART.scene("zoom", 2), label: "your country", k: 1, at: "country" },
    { pic: null, label: "the whole Earth", k: 2, at: "earth" }
  ];
  /* the globe is 64 units across its disk, so its drawing is 64 * 320 / 240 units,
     and it sits so that EO_HOME is at the house */
  var EO_GS = 64 * 320 / 240;
  var EO_GC = [-(EO_HOME[0] - 160) * EO_GS / 320, -(EO_HOME[1] - 160) * EO_GS / 320];
  /* the houses of everyone you know: more points inside the land (measured) */
  var EO_HOMES = [[96, 100], [134, 96], [112, 126], [205, 95], [240, 100], [222, 122], [119, 200], [118, 222], [212, 194], [232, 203], [54, 166]];

  function eoZoomL(t, scene) {
    return on(t, sc(scene, 0, "zoom"), 1.2) + on(t, sc(scene, 1, "zoom"), 1.2) + on(t, sc(scene, 2, "zoom"), 1.5);
  }
  function eoLevelOp(L, k) {
    var fin = k === 0 ? 1 : ease((L - (k - 1) - 0.05) / 0.45);
    var fout = k === 3 ? 1 : 1 - ease((L - k - 0.3) / 0.45);
    return fin * fout;
  }

  function scenePlanet(scene, beat, t, i) {
    var Z = EO_ZOOM, L = eoZoomL(t, scene), z = Z.base / Math.pow(4, L);
    var pan = clamp(L - 2, 0, 1), cam = [EO_GC[0] * pan, EO_GC[1] * pan];
    /* "floating in space": from then on the planet drifts gently up and down,
       and everything on it (the pin, the houses, the line to the lens) with it */
    var space = sc(scene, 2, "space"), bob = space == null ? 0 : on(t, space, 1.0) * 6 * Math.sin((t - space) * 1.9);
    var px = function (wx) { return Z.cx + (wx - cam[0]) * z; };
    var py = function (wy) { return Z.cy + bob + (wy - cam[1]) * z; };

    /* the zoom, inside its window */
    var inner = "";
    for (var k = 3; k >= 0; k--) {
      var op = eoLevelOp(L, k);
      if (op <= 0.001) continue;
      if (k === 3) {
        var gs = EO_GS * z;
        inner += ART.place(eoGlobe(0, "pl"), px(EO_GC[0]) - gs / 2, py(EO_GC[1]) - gs / 2, gs, gs, 'opacity="' + n2(op) + '"');
      } else {
        inner += MK.pic(px(0), py(0), Math.pow(4, k) * z * 0.94, EO_LEVELS[k].pic, { opacity: op });
      }
    }
    var home = [px(0), py(0)];
    inner += eoPin(home[0], home[1], ease((L - 0.35) / 0.4));
    var out = '<defs><clipPath id="eo-zoomclip"><rect x="' + Z.x + '" y="' + Z.y + '" width="' + Z.w + '" height="' + Z.h + '" rx="30"/></clipPath></defs>' +
      R(Z.x, Z.y, Z.w, Z.h, 30, P.ground, P.line, 2) + G(inner, { "clip-path": "url(#eo-zoomclip)" });

    /* the ladder: your house, your town, your country, the whole Earth, each lit
       as it is named, the ones already named dimmer */
    var ladder = eoUntil(t, scene, 2), lit = -1;
    for (var r = 0; r < 4; r++) if (sc(scene, EO_LEVELS[r].k, EO_LEVELS[r].at) != null && t >= sc(scene, EO_LEVELS[r].k, EO_LEVELS[r].at)) lit = r;
    if (ladder > 0) for (var r2 = 0; r2 < 4; r2++) {
      var lv = EO_LEVELS[r2], at = sc(scene, lv.k, lv.at), p = popIn(t, at, 0.4);
      if (p <= 0) continue;
      var y = 30 + r2 * 98, now = r2 === lit, x = 590;
      var icon = lv.pic ? MK.pic(x + 50, y + 40, 50, lv.pic) : ART.place(eoGlobe(0, "ld", true), x + 12, y + 2, 76, 76);
      var row = R(x, y, 570, 80, 18, now ? "#1B3A52" : P.card, now ? P.good : P.line, now ? 3 : 2) + icon +
        Tx(x + 104, y + 51, lv.label, "lab big" + (now ? "" : " muted"), "start");
      if (r2 > 0) row += Pth("M" + (x + 40) + "," + (y - 14) + " l10,9 l10,-9", null, P.muted, 3);
      out += G(row, { opacity: ladder * Math.min(1, p) * (now ? 1 : 0.55), transform: around(x + 285, y + 40, 0.94 + 0.06 * Math.min(p, 1.06)) });
    }

    /* "Earth is the planet we live on. Everyone you know lives on it." */
    var three = eoUntil(t, scene, 3) * eoFrom(t, scene, 3);
    var gsz = EO_GS * z, gx = px(EO_GC[0]) - gsz / 2, gy = py(EO_GC[1]) - gsz / 2;
    /* "a round planet": its outline flashes */
    var roundFlash = bump(t, sc(scene, 2, "round"), 1.4);
    if (roundFlash > 0) out += G(eoRing(gx + gsz / 2, gy + gsz / 2, gsz * 0.375 + 7, 1, P.gold, 5), { opacity: roundFlash });
    if (three > 0) {
      out += eoLabel(598, 168, "planet Earth", "lab huge", "start", on(t, sc(scene, 3, "planet"), 0.45) * three, { "font-size": 64 });
      var ev = sc(scene, 3, "everyone");
      var houses = "";
      for (var h = 0; h < EO_HOMES.length; h++) {
        var hp = popIn(t, ev == null ? null : ev + 0.12 * h, 0.35);
        if (hp <= 0) continue;
        var q = eoGlobePt(gx, gy, gsz, 0, EO_HOMES[h][0], EO_HOMES[h][1]);
        houses += MK.pop(Em(q[0], q[1] - 8, 24, "\u{1F3E0}"), q[0], q[1], hp);
      }
      out += G(houses, { opacity: three });
      out += eoLabel(600, 262, "everyone you know", "lab big", "start", on(t, ev, 0.45) * three, { fill: P.gold });
    }

    /* "The ground looks flat, because Earth is so big. From space, it is round." */
    var four = eoFrom(t, scene, 4);
    if (four > 0) {
      var flat = sc(scene, 4, "flat"), big = sc(scene, 4, "big"), round = sc(scene, 4, "round");
      var lo = popIn(t, flat, 0.45), cxL = 872, cyL = 186, rL = 150;
      if (lo > 0) {
        var lens = R(cxL - rL, cyL - rL, rL * 2, rL * 2, 0, EO.sky) +
          C(cxL, cyL + 70 + 2400, 2400, EO.grass) + C(cxL, cyL + 96 + 2400, 2400, EO.soil) +
          Em(cxL, cyL + 12, 118, "\u{1F9CD}");
        out += MK.pop('<defs><clipPath id="eo-lens"><circle cx="' + cxL + '" cy="' + cyL + '" r="' + rL + '"/></clipPath></defs>' +
          G(lens, { "clip-path": "url(#eo-lens)" }) + C(cxL, cyL, rL, "none", P.gold, 5), cxL, cyL, lo);
        out += eoLabel(cxL, 404, "looks flat", "lab huge", "middle", on(t, flat == null ? null : flat + 0.2, 0.4));
      }
      /* the lens is a close look at the tiny spot your house stands on */
      var hx = home[0], hy = home[1];
      var lu = on(t, big, 0.7);
      if (lu > 0) {
        var ang = Math.atan2(hy - cyL, hx - cxL);
        out += MK.leader(cxL + Math.cos(ang) * rL, cyL + Math.sin(ang) * rL, hx, hy, lu, P.gold);
        out += C(hx, hy, 8 + 10 * bump(t, big == null ? null : big + 0.6, 0.7), "none", P.gold, 3, { opacity: lu });
      }
      var gr = on(t, round, 1.0), gcx = gx + gsz / 2, gcy = gy + gsz / 2, grad = gsz * 0.375;
      out += eoRing(gcx, gcy, grad + 7, gr, P.gold, 6);
      out += eoLabel(gcx, 420, "round", "lab huge", "middle", on(t, round == null ? null : round + 0.3, 0.4), { fill: P.gold });
    }
    return svg(out);
  }

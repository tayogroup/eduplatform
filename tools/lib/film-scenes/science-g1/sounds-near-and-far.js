
  /* ==== Grade 1 Science, Lesson 6: Sounds Near and Far =======================
     The film's pictures, in four parts joined in order into one scope
     (sounds-near-and-far.js, -2.js, -3.js, -4.js), between the shared engine's head
     and tail, after ART (the lesson kit's own drawings) and MK (the shared
     marks). Every name the parts define starts with "sn", so none of them can
     replace an engine's, a mark's or another part's.

     The film is silent apart from the voice, so every sound is SHOWN: it
     leaves the thing making it as rings, bright close by and fainter as they
     spread. The bell and the child are the lesson's own soundFar drawing, and
     the loudness its meter shows is the lesson's own number for each step.

     This part: the colours, the sound marks the chapters share, the title
     motif, and the chapter "Every sound has a source". */

  var HUE = {
    title: P.teal, source: P.gold, shake: P.plum, nearfar: P.blue,
    table: P.accent, ears: P.good, recap: P.teal
  };

  /* how loud the bell is at 0 to 6 steps away: soundFar.run's gainFor in the
     lesson kit, which sets the lesson's loudness meter */
  var SN_GAIN = [1, 0.62, 0.4, 0.26, 0.17, 0.11, 0.07];
  function snGain(steps) {
    if (!(steps > 0)) return 1;
    if (steps >= 6) return SN_GAIN[6];
    var k = Math.floor(steps);
    return lerp(SN_GAIN[k], SN_GAIN[k + 1], steps - k);
  }

  /* Sound leaving a thing at (x, y): arcs born at radius r0, one after another
     from `at`, each growing by `reach` over `period` seconds and fading to
     `floor` of its brightness as it goes. None is born after `until`; the ones
     already out finish their journey, as a sound does when its source stops.
     MK.waves draws the same idea with every arc out at once; these start at the
     thing, so a sound visibly begins where it is made.
     o: {dir, spread (radians), n (arcs a period), period, r0, reach, col, w, floor, op, until} */
  function snWaves(x, y, t, at, o) {
    if (at == null || t < at) return "";
    o = o || {};
    var dir = o.dir || 0, spread = o.spread == null ? 1 : o.spread, n = o.n || 3, period = o.period || 1.2;
    var r0 = o.r0 == null ? 18 : o.r0, reach = o.reach || 140, col = o.col || P.gold, w = o.w || 5;
    var floor = o.floor == null ? 0 : o.floor, op = o.op == null ? 1 : o.op, gap = period / n;
    var last = o.until == null ? t : Math.min(t, o.until), out = "";
    var j0 = Math.max(0, Math.ceil((t - period - at) / gap - 1e-9)), j1 = Math.floor((last - at) / gap + 1e-9);
    for (var j = j0; j <= j1; j++) {
      var ph = (t - (at + j * gap)) / period;
      if (ph < 0 || ph >= 1) continue;
      var r = r0 + reach * ph, a0 = dir - spread / 2, a1 = dir + spread / 2;
      out += Pth("M" + n2(x + r * Math.cos(a0)) + "," + n2(y + r * Math.sin(a0)) +
        " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(x + r * Math.cos(a1)) + "," + n2(y + r * Math.sin(a1)),
        null, col, w * (1 - 0.4 * ph), { opacity: op * lerp(1, floor, ph) * clamp(ph * 7, 0, 1) });
    }
    return out;
  }

  /* the same, out of both sides of a thing */
  function snBoth(x, y, t, at, o) {
    var a = Object.assign({}, o || {}), b = Object.assign({}, o || {});
    a.dir = 0; b.dir = Math.PI;
    return snWaves(x, y, t, at, a) + snWaves(x, y, t, at, b);
  }

  /* a bell swinging when it is rung at each of the times in `rings` (degrees) */
  function snSwing(t, rings, amp) {
    var a = 0;
    (rings || []).forEach(function (at) {
      if (at == null || t < at || t > at + 1.6) return;
      a += (amp || 13) * Math.sin((t - at) * 2 * Math.PI * 2.4) * Math.exp(-(t - at) * 2.6);
    });
    return a;
  }

  /* ==== the title motif ========================================================
     The lesson's bell and a child along the ground from it, with the bell's
     sound between them: bright at the bell and faint by the time it reaches
     the child. In the spoken title chapter it answers the two lines: the bell
     starts ringing on "A bell rings" and glows on "loud", the child appears on
     "Far away" and a faint ring reaches it on "quiet"; then the bell glows for
     "Where", swings hard for "What makes them" and the faint ring comes again
     for "why". Behind the cards it simply rings. */
  function titleMotif(o) {
    var t = o.t, ring = 0, kid = 1, loud = null, quiet = null, where = null, makes = null, why = null;
    if (o.scene) {
      var c = function (k, name) { return sc(o.scene, k, name); };
      ring = c(0, "bell");
      if (ring == null) ring = BEATS[o.scene.first].start;
      var far = c(0, "far");
      kid = far == null ? 1 : popIn(t, far, 0.45);
      loud = c(0, "loud"); quiet = c(0, "quiet"); where = c(1, "where"); makes = c(1, "makes"); why = c(1, "why");
    }
    var bx = 82, by = 176, kx = 292, ky = 196;
    var s = G(L(22, 250, 342, 250, P.line, 5) +
      [120, 160, 200, 240, 280, 320].map(function (x) { return L(x, 250, x, 264, P.line, 4); }).join(""));
    s += snWaves(bx, by, t, ring, { dir: 0, spread: 1.25, n: 3, period: 1.5, r0: 50, reach: 190, w: 10, floor: 0.12 });
    s += MK.glow(bx, by, 70, P.gold, (t >= ring ? 0.8 : 0) + 1.4 * bump(t, loud, 1.0) + 1.4 * bump(t, where, 1.0));
    var swing = (t >= ring ? 9 * Math.sin((t - ring) * 5.2) : 0) + 14 * Math.sin(((t - (makes || 0)) * 9)) * bump(t, makes, 1.2);
    s += G(MK.pic(bx, by, 96, "\u{1F514}"), { transform: "rotate(" + n2(swing) + " " + bx + " " + (by - 44) + ")" });
    var heard = bump(t, quiet, 1.1) + bump(t, why, 1.1);
    if (heard > 0) s += C(kx, ky, 46, "none", P.gold, 3, { opacity: 0.55 * heard });
    if (kid > 0) s += MK.pop(MK.pic(kx, ky, 72, "\u{1F9D2}"), kx, ky, kid);
    return '<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">' + s + "</svg>";
  }

  /* ==== chapter: every sound has a source ======================================
     The lecture's four sources in a row, each sounding as it is named (the
     drum, the bell, the bird, the rain), then all of them for "Every sound",
     and every one marked "source". "Boom" and "Tweet" name one each. Then the
     drum and the lesson's own child (the kit's body figure, drawn on the dark
     page as the lesson draws it): the sound travels from the drum to the ears,
     the ears are ringed as they are named, the ears hear and the drum makes. */
  var SN_SOURCES = [
    { pic: "\u{1F941}", name: "drum", x: 146 },
    { pic: "\u{1F514}", name: "bell", x: 438 },
    { pic: "\u{1F426}", name: "bird", x: 730 },
    { pic: "\u{1F327}\uFE0F", name: "rain", x: 1022 }
  ];
  var SN_ROW_Y = 164;

  function snSourceRow(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var every = c(1, "every"), some = c(1, "somewhere"), src = c(1, "source");
    var boom = c(2, "boom"), tweet = c(2, "tweet"), out = "";
    SN_SOURCES.forEach(function (s, k) {
      var at = c(0, s.name), p = popIn(t, at, 0.4), y = SN_ROW_Y;
      if (p <= 0) return;
      /* the third line names the drum ("Boom") and then the bird ("Tweet"):
         the one named is bright, the one named before it half, the rest faint */
      var lv1 = k === 0 ? 1 : 0.35, lv2 = k === 2 ? 1 : k === 0 ? 0.6 : 0.35, lv = 1;
      if (boom != null && t >= boom) lv = tweet == null || t < tweet ? lerp(1, lv1, on(t, boom, 0.4)) : lerp(lv1, lv2, on(t, tweet, 0.4));
      var own = k === 0 ? boom : k === 2 ? tweet : null;
      var grow = 1 + 0.12 * bump(t, at, 0.6) + 0.16 * bump(t, own, 0.7) + 0.08 * bump(t, every == null ? null : every + k * 0.12, 0.6);
      var wv = { r0: 72, reach: 58, period: 1.0, n: 2, w: 5 };
      var sound = snBoth(s.x, y, t, at, Object.assign({}, wv, { until: at + 2.0 }));
      if (every != null) sound += snBoth(s.x, y, t, every + k * 0.12, Object.assign({}, wv, { until: src == null ? every + 2 : src + 0.4 }));
      if (own != null) sound += snBoth(s.x, y, t, own, Object.assign({}, wv, { reach: 74, w: 7, until: k === 0 && tweet != null ? tweet - 0.3 : null }));
      var glow = some == null ? 0 : on(t, some + k * 0.1, 0.4) * (boom == null || t < boom ? 1 : 1 - on(t, boom, 0.4));
      var tag = src == null ? 0 : popIn(t, src + k * 0.16, 0.35);
      var tagOn = (k === 0 && boom != null && t >= boom && (tweet == null || t < tweet)) || (k === 2 && tweet != null && t >= tweet);
      out += G(MK.glow(s.x, y, 100, P.gold, 1.5 * glow) + sound +
        G(MK.pic(s.x, y, 126, s.pic), { transform: around(s.x, y, Math.min(p, 1.1) * grow) }) +
        Tx(s.x, y + 122, s.name, "lab big", "middle") +
        MK.pop(MK.pill(s.x, y + 184, "source", 1, { size: 26, col: P.gold, ink: P.gold, fill: tagOn ? "#3A3420" : P.card }), s.x, y + 184, tag),
        { opacity: Math.min(1, p) * lv });
    });
    return out;
  }

  /* the lesson's body figure, 260 x 400, drawn at 1.05 */
  var SN_BODY = { x: 632, y: 10, s: 1.05 };
  var SN_OTHER_PARTS = ["head", "eyes", "nose", "mouth", "tummy", "arms", "hands", "legs", "feet"];
  function snBodyAt(bx, by) { return [SN_BODY.x + bx * SN_BODY.s, SN_BODY.y + by * SN_BODY.s]; }

  function snSourceEar(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var ears = c(3, "ears"), hearing = c(3, "hearing"), hear = c(4, "hear"), not = c(4, "not"), makes = c(4, "makes");
    var start = BEATS[scene.first + 3].start - 0.3;
    /* the drum, and the ear nearest it: the figure's right ear, on our left */
    var dx = 190, dy = 226, ear = snBodyAt(84, 66);
    var dist = Math.hypot(ear[0] - dx, ear[1] - dy), dir = Math.atan2(ear[1] - dy, ear[0] - dx);
    var period = 1.3, n = 3, r0 = 84, reach = dist - r0 + 6;
    var out = snWaves(dx, dy, t, start, { dir: dir, spread: 0.26, n: n, period: period, r0: r0, reach: reach, w: 7, floor: 0.5 });
    /* how much sound is at the ear just now: an arc arriving lights the ring */
    var at = 0;
    for (var j = Math.max(0, Math.floor((t - start - period) / (period / n))); j <= Math.floor((t - start) / (period / n)); j++) {
      var r = r0 + reach * (t - start - j * period / n) / period;
      at = Math.max(at, 1 - clamp(Math.abs(r - dist) / 46, 0, 1));
    }
    var fig = ART.figure("body"), ro = on(t, ears, 0.4);
    if (ro > 0) {
      fig = ART.ring(fig, "ears", "rgba(244,201,93," + n2(ro) + ")", 4 + 3 * at * on(t, hear, 0.3) + 2 * bump(t, ears, 0.7));
      SN_OTHER_PARTS.forEach(function (part) { fig = ART.dim(fig, part, lerp(1, 0.35, ro)); });
    }
    out += ART.place(fig, SN_BODY.x, SN_BODY.y, 260 * SN_BODY.s, 400 * SN_BODY.s);
    out += G(MK.pic(dx, dy, 150, "\u{1F941}"), { transform: around(dx, dy, 1 + 0.12 * bump(t, makes, 0.7)) });
    out += MK.pill(dx, 356, "source", 1, { size: 26, col: P.gold, ink: P.gold });
    /* the ears named, then the sense */
    var far = snBodyAt(176, 66), lx = 930;
    out += MK.leader(lx - 6, far[1], far[0] + 16, far[1], on(t, ears, 0.5), P.gold);
    out += MK.pop(MK.pill(lx, far[1], "ears", 1, { size: 28, col: P.gold, anchor: "start" }), lx + 50, far[1], popIn(t, ears, 0.4));
    out += MK.pop(MK.pill(lx, 156, "hearing", 1, { size: 28, col: P.good, ink: P.good, anchor: "start" }), lx + 70, 156, popIn(t, hearing, 0.4));
    /* ears hear it and do not make it; the drum makes it */
    out += MK.list(lx - 8, 250, [{ text: "hears", at: hear, mark: "tick" }, { text: "makes", at: not, mark: "cross" }], t, { lh: 64, markR: 18 });
    out += MK.list(dx - 70, 414, [{ text: "makes", at: makes, mark: "tick" }], t, { markR: 18 });
    return out;
  }

  function snSource(scene, beat, t, i) {
    var k = i - scene.first, u = k === 3 ? into(t, i) : k > 3 ? 1 : 0, out = "";
    if (u < 1) out += G(snSourceRow(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(snSourceEar(scene, t), { opacity: u });
    return svg(out);
  }

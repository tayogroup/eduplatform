
  /* ==== Grade 2 Science, Lesson 5: Changing Materials ==========================
     tools/lib/film-scenes/science-g2/changing-materials.js, part 1 of 4 (-2.js,
     -3.js and -4.js follow it in the same scope). The storyboard is
     science/grade-2-app/lecture-video/changing-materials.json, and BRIEF.md
     beside it says how a film is made.

     One chapter per part of LESSON["lecture"] in content/lesson-5.py: the same
     material back (ice, then chocolate), a new material (the egg), burning,
     baking, and safe with heat. Where the lesson draws, the film draws the
     lesson's drawing: the egg in the pan of its experiment (ART.sim
     "newMaterial"), heated three times and cooled, exactly as the child will
     press Heat and Cool. Where the lesson shows an emoji (the demo's ice, drop,
     egg, pan, bread and cake; the safety step's cook, gloves and hand), the
     film shows that emoji.

     What MOVES in front of the child is drawn here: the candle burning down
     shorter (cmCandle takes the wax it has left), the dough rising and browning
     into a loaf (cmDough) and the cake mix doming in its tin (cmTin), both
     inside the oven's window. The egg is the lesson's own drawing and moves in
     it, not here. Everything else the film shows - the ice and the water, the
     bar of chocolate and the melted puddle, the wood and the ash - is drawn at
     the TWO states the change picture needs, one either side of the arrow,
     because that is what a change picture says: this became that.

     One picture runs through the whole film, the lesson's one question, "can
     you get the first material back?": a change is the first material, an
     arrow to what it became, and an arrow BACK, which ends in a tick when you
     can get the first material back and is stopped by a cross when you cannot
     (cmChange). Same material: the loop closes. New material: it cannot.

     Part 1: the palette, the timing helpers, the drawings the chapters share,
     the change picture and the title motif. Every top-level name here starts
     with cm, so nothing can replace a name of the engine, ART or MK. */

  var HUE = { title: P.teal, same: P.blue, egg: P.gold, burn: P.accent, bake: P.plum, safe: P.good, recap: P.teal };

  /* the colours of the things drawn: the egg and the pan as the lesson's own
     newMaterial drawing has them, the fridge as its icons */
  var CM = {
    ice: "#A9DDF6", iceTop: "#D8F2FD", iceSide: "#72BFE6", iceEdge: "#3F8FC0",
    choc: "#6B3A1E", chocTop: "#85502C", chocEdge: "#3E1F0D", chocWet: "#5A2F17",
    ash: "#B3BBC2", ashDark: "#7D8791", smoke: "#9AA6B1",
    wax: "#F4EAD2", waxEdge: "#C9B68E", flameOut: "#E9744F", flame: "#F4A93B", flameIn: "#FFE08A",
    dough: "#EFE0BE", doughEdge: "#C8B084", crust: "#C98A3E", crustDark: "#8E5A22",
    mix: "#F3D98B", mixEdge: "#D9B458",
    body: "#F2F5F8", bodyEdge: "#6F7C88", handle: "#56616B",
    steel: "#A9B7C4", steelDark: "#6F7C88", plate: "#DCE6EE",
    white: "#FFFDF6", whiteEdge: "#D9D2C0", yolk: "#F4C95D",
    pan: "#4A5A6A", panEdge: "#3A4754",
    skin: "#A86B3C", skinDark: "#8A5530", hair: "#2A1A12", shirt: "#4E86C4", shirtDark: "#3A6A9E"
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function cmOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* A chapter whose picture changes only at some beats: starts lists the beat
     (k, in the chapter) each picture begins at, and draw(n) draws picture n.
     The old picture fades as the new one comes in, in the pause before its
     beat; a picture that carries on across a beat is drawn once, so it never
     dips the way crossfading it with itself would. */
  function cmPhased(t, i, scene, starts, draw) {
    var k = i - scene.first, n = 0;
    for (var q = 0; q < starts.length; q++) if (k >= starts[q]) n = q;
    var u = n > 0 && k === starts[n] ? into(t, i) : 1, out = "";
    if (u < 1) out += G(draw(n - 1), { opacity: 1 - u });
    return out + G(draw(n), { opacity: u });
  }
  /* fixed numbers for anything scattered: never Math.random */
  var CM_SCATTER = [0.13, 0.71, 0.42, 0.88, 0.27, 0.59, 0.05, 0.94, 0.36, 0.66, 0.19, 0.81];

  /* one colour part of the way to another */
  function cmHex(c) { c = String(c).replace("#", ""); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function cmMix(a, b, u) {
    var x = cmHex(a), y = cmHex(b); u = clamp(u, 0, 1);
    return "rgb(" + Math.round(lerp(x[0], y[0], u)) + "," + Math.round(lerp(x[1], y[1], u)) + "," + Math.round(lerp(x[2], y[2], u)) + ")";
  }

  /* ---- small drawings -------------------------------------------------------- */

  /* a plate, seen from the front and a little above, centred on (cx, cy) */
  function cmPlate(cx, cy, rx) {
    return E(cx, cy + 4, rx, rx * 0.2, "#9FB0BF") + E(cx, cy, rx, rx * 0.2, CM.plate, P.edge, 3) + E(cx, cy - 1, rx * 0.74, rx * 0.12, "none", "#B9C8D6", 2);
  }

  /* An ice cube: its front face is an s px square with (x, y) its top left
     corner, and the top and side faces are drawn behind and above it. */
  function cmCube(x, y, s) {
    var dx = s * 0.3, dy = -s * 0.24;
    return Pth("M" + n2(x) + "," + n2(y) + " L" + n2(x + dx) + "," + n2(y + dy) + " L" + n2(x + s + dx) + "," + n2(y + dy) + " L" + n2(x + s) + "," + n2(y) + " Z", CM.iceTop, CM.iceEdge, 2.5) +
      Pth("M" + n2(x + s) + "," + n2(y) + " L" + n2(x + s + dx) + "," + n2(y + dy) + " L" + n2(x + s + dx) + "," + n2(y + s + dy) + " L" + n2(x + s) + "," + n2(y + s) + " Z", CM.iceSide, CM.iceEdge, 2.5) +
      R(x, y, s, s, s * 0.08, CM.ice, CM.iceEdge, 2.5) +
      L(x + s * 0.16, y + s * 0.2, x + s * 0.16, y + s * 0.62, "#FFFFFF", s * 0.07, { opacity: 0.8 }) +
      L(x + s * 0.3, y + s * 0.16, x + s * 0.5, y + s * 0.16, "#FFFFFF", s * 0.06, { opacity: 0.65 });
  }

  /* The Sun, gold, its rays turning slowly */
  function cmSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.32, cy + Math.sin(a) * r * 1.32, cx + Math.cos(a) * r * 1.74, cy + Math.sin(a) * r * 1.74, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.3, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* A bar of chocolate lying on (cx, by), w across. melt 0 -> 1: the squares
     soften and it slumps into a glossy runny puddle. */
  function cmChoc(cx, by, w, melt, t) {
    var m = clamp(melt, 0, 1), out = "";
    if (m > 0) {
      var pw = w * (0.4 + 0.42 * m), wob = 1 + 0.02 * Math.sin((t || 0) * 2.7);
      out += G(E(cx, by - 6, pw * wob, pw * 0.2, CM.chocWet, CM.chocEdge, 3) +
        E(cx - pw * 0.3, by - 10 - pw * 0.04, pw * 0.3, pw * 0.05, "#FFFFFF", null, null, { opacity: 0.35 }) +
        E(cx + pw * 0.28, by - 4, pw * 0.14, pw * 0.028, "#FFFFFF", null, null, { opacity: 0.2 }), { opacity: Math.min(1, m * 3) });
    }
    if (m < 1) {
      var h = w * 0.36, x = cx - w / 2, y = by - h - w * 0.1, sq = "";
      for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) {
        sq += R(x + w * 0.05 + c * w * 0.23, y + h * 0.1 + r * h * 0.44, w * 0.2, h * 0.36, 5, CM.chocTop, CM.chocEdge, 1.5);
      }
      var bar = R(x, y + w * 0.1, w, h, 8, CM.chocEdge) + R(x, y, w, h, 8, CM.choc, CM.chocEdge, 3) + sq;
      var sy = 1 - 0.85 * ease(m), sx = 1 + 0.2 * m;
      out += G(bar, { transform: "translate(" + n2(cx) + "," + n2(by) + ") scale(" + n3(sx) + "," + n3(sy) + ") translate(" + n2(-cx) + "," + n2(-by) + ")", opacity: 1 - clamp((m - 0.6) / 0.4, 0, 1) });
    }
    return out;
  }

  /* A fridge in the kit's colours (lesson-kit _icons.py "fridge"): the freezer
     on top. open 0 -> 1 swings a door open so what is inside shows; frost
     0 -> 1 is the cold in there. which: "freezer" or "fridge". */
  function cmFridge(x, y, w, h, which, open, frost, t) {
    var fh = h * 0.36, out = "";
    out += R(x + 6, y + h - 4, 20, 14, 4, CM.handle) + R(x + w - 26, y + h - 4, 20, 14, 4, CM.handle);
    out += R(x, y, w, h, 14, CM.body, CM.bodyEdge, 5);
    var dy = which === "freezer" ? y : y + fh, dh = which === "freezer" ? fh : h - fh;
    var inner = R(x + 12, dy + 12, w - 24, dh - 24, 8, cmMix("#DDEFF7", "#BFE3F5", frost), CM.bodyEdge, 3);
    if (which === "fridge") inner += L(x + 14, dy + dh * 0.5, x + w - 14, dy + dh * 0.5, "#9FB0BF", 4);
    out += G(inner, { opacity: open });
    /* the frost: a cold blue light and a snowflake */
    if (frost > 0 && open > 0) out += G(MK.glow(x + w / 2, dy + dh / 2, Math.min(w, dh) * 0.7, "#BFE3F5", frost) +
      Em(x + w - 42, dy + 38, 34, "❄️", { opacity: frost * (0.75 + 0.25 * Math.sin((t || 0) * 3)) }), { opacity: open });
    out += L(x, y + fh, x + w, y + fh, CM.bodyEdge, 5);
    /* the doors: shut, the door is the front; open, it has swung out to the right */
    var shut = 1 - open;
    if (shut > 0) out += G(R(x + 22, (which === "freezer" ? y : y + fh) + 18, 10, dh * 0.4, 5, CM.handle), { opacity: shut });
    if (open > 0) out += G(Pth("M" + n2(x + w) + "," + n2(dy + 3) + " L" + n2(x + w + 46) + "," + n2(dy + 16) + " L" + n2(x + w + 46) + "," + n2(dy + dh - 16) + " L" + n2(x + w) + "," + n2(dy + dh - 3) + " Z", "#E3E9EE", CM.bodyEdge, 4), { opacity: open });
    /* the other door's handle */
    out += R(x + 22, (which === "freezer" ? y + fh : y) + 18, 10, (which === "freezer" ? h - fh : fh) * 0.4, 5, CM.handle);
    return out;
  }

  /* The egg as the lesson draws it in its pan (newMaterial: the white #FFFDF6
     once cooked, see-through while raw, the yolk #F4C95D), seen from above.

     `pan` draws the pan's own bottom under it, and on the raw egg it is not
     decoration: the lesson paints the raw white at rgba(255,253,246,0.55) over
     a #4A5A6A pan (science.js, SIMS.newMaterial), so what shows through the
     egg is the pan. On the film's dark stage with nothing behind it, the same
     wash reads as an opaque grey egg - the opposite of "runny and clear". So
     wherever the film says the egg is clear, it draws the pan under it. */
  function cmEgg(cx, cy, r, cooked, pan) {
    var c = clamp(cooked, 0, 1);
    var base = pan ? E(cx, cy + r * 0.1, r * 1.42, r * 0.98, CM.pan, CM.panEdge, 3) : "";
    /* in the pan, the lesson's own number for the raw white, 0.55; the 0.44 is
       only a fallback for an egg with nothing behind it, and every raw egg in
       this film has the pan, so what it really covers is a half-cooked one */
    var raw = pan ? 0.55 : 0.44;
    var d = "M" + n2(cx - r) + "," + n2(cy + r * 0.05) + " C" + n2(cx - r * 1.02) + "," + n2(cy - r * 0.55) + " " + n2(cx - r * 0.35) + "," + n2(cy - r * 0.78) + " " + n2(cx + r * 0.12) + "," + n2(cy - r * 0.7) +
      " C" + n2(cx + r * 0.7) + "," + n2(cy - r * 0.66) + " " + n2(cx + r * 1.05) + "," + n2(cy - r * 0.3) + " " + n2(cx + r * 0.96) + "," + n2(cy + r * 0.12) +
      " C" + n2(cx + r * 0.88) + "," + n2(cy + r * 0.62) + " " + n2(cx + r * 0.2) + "," + n2(cy + r * 0.76) + " " + n2(cx - r * 0.3) + "," + n2(cy + r * 0.66) +
      " C" + n2(cx - r * 0.8) + "," + n2(cy + r * 0.56) + " " + n2(cx - r * 0.98) + "," + n2(cy + r * 0.4) + " " + n2(cx - r) + "," + n2(cy + r * 0.05) + " Z";
    return base + Pth(d, CM.white, CM.whiteEdge, 2, { "fill-opacity": n2(raw + (1 - raw) * c) }) +
      C(cx + r * 0.02, cy - r * 0.02, r * 0.34, CM.yolk, "#D9A93A", 2) + C(cx - r * 0.08, cy - r * 0.12, r * 0.09, "#FFF3C4", null, null, { opacity: 0.8 });
  }

  /* flames standing on (cx, by), s px tall, flickering; o fades them */
  function cmFlames(cx, by, s, t, o, n) {
    if (!(o > 0) || s < 1) return "";
    n = n || 3;
    var out = "", xs = n === 1 ? [0] : [-0.36, 0, 0.36];
    xs.forEach(function (fx, k) {
      var hk = s * (k === 1 || n === 1 ? 1 : 0.72) * (0.9 + 0.1 * Math.sin(t * (9 + k * 2.3) + k * 1.7));
      var wk = s * (n === 1 ? 0.34 : 0.3), x = cx + fx * s, lean = 0.08 * s * Math.sin(t * 5 + k);
      var tongue = function (hh, ww, col) {
        return Pth("M" + n2(x - ww) + "," + n2(by) + " C" + n2(x - ww * 1.1) + "," + n2(by - hh * 0.45) + " " + n2(x - ww * 0.2 + lean) + "," + n2(by - hh * 0.62) + " " + n2(x + lean) + "," + n2(by - hh) +
          " C" + n2(x + ww * 0.3 + lean) + "," + n2(by - hh * 0.6) + " " + n2(x + ww * 1.1) + "," + n2(by - hh * 0.45) + " " + n2(x + ww) + "," + n2(by) + " Z", col);
      };
      out += tongue(hk, wk, CM.flameOut) + tongue(hk * 0.7, wk * 0.66, CM.flame) + tongue(hk * 0.38, wk * 0.34, CM.flameIn);
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* smoke: puffs rising from (cx, by) from `from`, until `until` (then they
     thin out), each a pure function of t */
  function cmSmoke(cx, by, t, from, until, o, rise) {
    if (from == null || t < from || !(o > 0)) return "";
    var out = "", R0 = rise || 220, start = clamp((t - from) / 0.5, 0, 1);
    for (var k = 0; k < 6; k++) {
      var born = from + k * 0.35;
      if (t < born) continue;
      var ph = ((t - born) / 2.1) % 1, cyc = Math.floor((t - born) / 2.1);
      if (until != null && born + cyc * 2.1 > until) continue;
      var x = cx + Math.sin(ph * 4 + k * 1.3) * 16 + (CM_SCATTER[k] - 0.5) * 30 + ph * 30, y = by - R0 * ph;
      out += C(x, y, 14 + 26 * ph, CM.smoke, null, null, { opacity: 0.55 * (1 - ph) * Math.min(1, ph * 6) * start });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a heap of ash on (cx, by), w across; embers glow in it while `hot` */
  function cmAsh(cx, by, w, o, hot, t) {
    if (!(o > 0)) return "";
    var h = w * 0.3, out = Pth("M" + n2(cx - w / 2) + "," + n2(by) + " C" + n2(cx - w * 0.36) + "," + n2(by - h * 0.9) + " " + n2(cx - w * 0.12) + "," + n2(by - h * 1.1) + " " + n2(cx) + "," + n2(by - h) +
      " C" + n2(cx + w * 0.16) + "," + n2(by - h * 1.08) + " " + n2(cx + w * 0.38) + "," + n2(by - h * 0.8) + " " + n2(cx + w / 2) + "," + n2(by) + " Z", CM.ash, CM.ashDark, 3);
    [[-0.22, 0.45], [0.05, 0.7], [0.24, 0.4], [-0.05, 0.3], [0.14, 0.2]].forEach(function (q, k) {
      out += C(cx + q[0] * w, by - q[1] * h, w * 0.022, CM.ashDark);
      if (hot > 0) out += C(cx + (q[0] + 0.05) * w, by - q[1] * h * 0.6, w * 0.02, CM.flameOut, null, null, { opacity: hot * (0.5 + 0.5 * Math.sin(t * 4 + k * 2)) });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a candle on its dish, standing on (cx, by), h px of wax left, lit */
  function cmCandle(cx, by, h, t, lit) {
    var w = 58, top = by - 16 - h, out = "";
    out += E(cx, by - 6, 68, 14, "#B9C8D6", P.edge, 3);
    out += R(cx - w / 2, top, w, h + 10, 6, CM.wax, CM.waxEdge, 3) + E(cx, top, w / 2, 8, "#FBF4E2", CM.waxEdge, 2);
    /* two drips of wax down its side */
    out += Pth("M" + n2(cx - w / 2 + 8) + "," + n2(top + 2) + " q-2,18 2,26 q4,6 5,-4 l0,-22z", "#FBF4E2");
    out += Pth("M" + n2(cx + w / 2 - 14) + "," + n2(top + 3) + " q2,12 1,16 q3,5 5,-2 l0,-14z", "#FBF4E2");
    out += L(cx, top - 2, cx, top - 14, "#3A2E26", 3);
    if (lit > 0) out += G(MK.glow(cx, top - 34, 60, P.gold, 0.9) + cmFlames(cx, top - 10, 44, t, 1, 1), { opacity: clamp(lit, 0, 1) });
    return out;
  }

  /* wisps rising from (x, y) into the air, for the wax that burns away */
  function cmWisps(x, y, t, o, n) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < (n || 3); k++) {
      var ph = ((t * 0.45 + k / (n || 3)) % 1), yy = y - 150 * ph, xx = x + (k - 1) * 22;
      out += Pth("M" + n2(xx) + "," + n2(yy) + " q14,-16 0,-32 t0,-32", null, "#C9D4DE", 4, { opacity: (1 - ph) * Math.min(1, ph * 5) * 0.8 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* dough on (cx, by), w across; bake 0 -> 1 rises it and browns it into a
     loaf with the baker's cuts on top */
  function cmDough(cx, by, w, bake) {
    var b = clamp(bake, 0, 1), h = w * (0.34 + 0.2 * b), col = cmMix(CM.dough, CM.crust, b), edge = cmMix(CM.doughEdge, CM.crustDark, b);
    var d = "M" + n2(cx - w / 2) + "," + n2(by) + " C" + n2(cx - w * 0.54) + "," + n2(by - h * 0.9) + " " + n2(cx - w * 0.26) + "," + n2(by - h * 1.06) + " " + n2(cx) + "," + n2(by - h) +
      " C" + n2(cx + w * 0.26) + "," + n2(by - h * 1.06) + " " + n2(cx + w * 0.54) + "," + n2(by - h * 0.9) + " " + n2(cx + w / 2) + "," + n2(by) + " Z";
    var out = Pth(d, col, edge, 3);
    out += E(cx - w * 0.14, by - h * 0.78, w * 0.16, h * 0.08, "#FFFFFF", null, null, { opacity: 0.25 * (1 - b) + 0.12 });
    if (b > 0.3) for (var k = 0; k < 3; k++) {
      var sx = cx - w * 0.22 + k * w * 0.22;
      out += Pth("M" + n2(sx - w * 0.07) + "," + n2(by - h * 0.62) + " L" + n2(sx + w * 0.07) + "," + n2(by - h * 0.86), null, CM.crustDark, 4, { opacity: clamp((b - 0.3) / 0.4, 0, 1) });
    }
    return out;
  }

  /* A cake tin on (cx, by), w across, seen a little from above so the mix in
     it shows: bake 0 -> 1 domes the runny mix into a sponge with a golden top. */
  function cmTin(cx, by, w, bake) {
    var b = clamp(bake, 0, 1), th = w * 0.3, top = by - th, out = "";
    var rise = w * 0.2 * ease(b), fill = cmMix(CM.mix, "#D9A45B", b), edge = cmMix(CM.mixEdge, CM.crustDark, b);
    /* the tin itself */
    out += Pth("M" + n2(cx - w / 2) + "," + n2(top) + " L" + n2(cx + w / 2) + "," + n2(top) +
      " L" + n2(cx + w * 0.44) + "," + n2(by) + " L" + n2(cx - w * 0.44) + "," + n2(by) + " Z", CM.steel, CM.steelDark, 3);
    out += L(cx - w * 0.47, top + th * 0.45, cx + w * 0.47, top + th * 0.45, CM.steelDark, 2, { opacity: 0.55 });
    /* the mix, in the open top; it domes as it bakes */
    if (rise > 1) out += Pth("M" + n2(cx - w * 0.48) + "," + n2(top) + " C" + n2(cx - w * 0.44) + "," + n2(top - rise * 1.25) +
      " " + n2(cx + w * 0.44) + "," + n2(top - rise * 1.25) + " " + n2(cx + w * 0.48) + "," + n2(top) + " Z", fill, edge, 3);
    out += E(cx, top, w * 0.48, w * 0.11, fill, edge, 3);
    if (b < 0.6) out += E(cx - w * 0.14, top - 2, w * 0.15, w * 0.035, "#FFFFFF", null, null, { opacity: 0.45 * (1 - b / 0.6) });
    /* the rim, in front of the mix */
    out += E(cx, top, w * 0.5, w * 0.115, "none", CM.steelDark, 4);
    return out;
  }

  /* ---- the change picture ------------------------------------------------------
     A curved arrow from p0 to p2 bowed through p1, grown to u; its head is
     drawn at the tip and the line stops under the head. */
  /* where the bow's tip is at u: the verdict mark sits ON the tip of the way
     back, not at the middle of a curve the arrow never reached (a stopped
     back arrow ends about 30 px right of the apex, so a cross drawn at the
     apex sat beside its own arrowhead rather than on it). */
  function cmBowAt(p0, p1, p2, u) {
    var v = 1 - u;
    return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]];
  }
  function cmBow(p0, p1, p2, u, col, w) {
    if (!(u > 0.01)) return "";
    var N = 28, pts = [];
    for (var k = 0; k <= N; k++) {
      var v = u * k / N, a = 1 - v;
      pts.push([a * a * p0[0] + 2 * a * v * p1[0] + v * v * p2[0], a * a * p0[1] + 2 * a * v * p1[1] + v * v * p2[1]]);
    }
    var tx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), ty = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]);
    var ang = Math.atan2(ty, tx), e = pts[N], h = Math.min(w * 2.6, polyLen(pts) * 0.7), cut = h * 0.8;
    /* stop the line under the head */
    var line = [pts[0]], total = polyLen(pts), keep = total - cut;
    if (keep > 0) { var q = polyAt(pts, keep); for (var j = 1; j <= q[2]; j++) line.push(pts[j]); line.push([q[0], q[1]]); }
    var d = "M" + line.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" L");
    return (keep > 0 ? Pth(d, null, col, w) : "") +
      Pth("M" + n2(e[0]) + "," + n2(e[1]) + " L" + n2(e[0] - Math.cos(ang) * h - Math.sin(ang) * h * 0.62) + "," + n2(e[1] - Math.sin(ang) * h + Math.cos(ang) * h * 0.62) +
        " L" + n2(e[0] - Math.cos(ang) * h + Math.sin(ang) * h * 0.62) + "," + n2(e[1] - Math.sin(ang) * h - Math.cos(ang) * h * 0.62) + " Z", col, col, 2);
  }

  /* The film's one picture of a change, in a box at (x, y), w across and 300
     high: the first material (a) on the left, what it became (b) on the right,
     the change (word) arching over from a to b, and the way back arching under
     from b to a. o: {a, b: fn(cx, cy, size, t) or a picture; word, backWord;
     aO, bO, fwd, back (0..1 each); verdict "tick" | "cross", vp (its pop)}.
     A tick: the way back reaches a. A cross: it is stopped halfway. */
  function cmChange(x, y, w, o, t) {
    var s = o.size || 112, ax = x + s * 0.6 + 6, bx = x + w - s * 0.6 - 6, cy = y + 150, mx = (ax + bx) / 2, out = "";
    var draw = function (p, cx, op) {
      if (!(op > 0)) return "";
      return G(typeof p === "function" ? p(cx, cy, s, t) : MK.pic(cx, cy, s, p), { opacity: clamp(op, 0, 1), transform: around(cx, cy, 0.9 + 0.1 * Math.min(1, op)) });
    };
    out += draw(o.a, ax, o.aO == null ? 1 : o.aO) + draw(o.b, bx, o.bO == null ? 1 : o.bO);
    var p0 = [ax + s * 0.5, cy - 44], p2 = [bx - s * 0.5, cy - 44];
    out += cmBow(p0, [mx, cy - 150], p2, o.fwd || 0, o.fwdCol || P.gold, 9);
    if (o.word && o.fwd > 0) out += Tx(mx, cy - 108, o.word, "lab big", "middle", { fill: o.fwdCol || P.gold, opacity: clamp((o.wordO == null ? o.fwd * 1.5 : o.wordO), 0, 1) });
    var cross = o.verdict === "cross", q0 = [bx - s * 0.5, cy + 44], q2 = [ax + s * 0.5, cy + 44], q1 = [mx, cy + 150];
    var stop = cross ? 0.42 : 1;
    out += cmBow(q0, q1, q2, (o.back || 0) * stop, o.backCol || P.teal, 9);
    var apex = cmBowAt(q0, q1, q2, cross ? stop : 0.5);
    if (o.backWord && o.back > 0)
      out += Tx(cross ? (apex[0] + q0[0]) / 2 : mx, cy + 158, o.backWord, "lab big", "middle", { fill: o.backCol || P.teal, opacity: clamp((o.backWordO == null ? o.back * 1.5 : o.backWordO), 0, 1) });
    if (o.vp > 0) {
      var r = 25;
      out += C(apex[0], apex[1], r + 3, P.ground, null, null, { opacity: Math.min(1, o.vp) });
      out += cross ? MK.cross(apex[0], apex[1], r, o.vp) : MK.tick(apex[0], apex[1], r, o.vp);
    }
    return out;
  }

  /* ---- pictures of the materials, for the change picture and the recap --------- */
  function cmIconIce(cx, cy, s) { return cmCube(cx - s * 0.36, cy - s * 0.24, s * 0.62); }
  function cmIconWater(cx, cy, s) { return MK.pic(cx, cy, s, "\u{1F4A7}"); }
  function cmIconChoc(cx, cy, s, t) { return cmChoc(cx, cy + s * 0.22, s * 0.9, 0, t); }
  function cmIconMelted(cx, cy, s, t) { return cmChoc(cx, cy + s * 0.2, s * 0.9, 1, t); }
  /* the raw egg is always drawn in the pan, so its white reads as see-through
     and not as grey; the cooked one takes the pan only where it stands beside
     the raw one, and goes without it where it is a symbol on a card */
  function cmIconRaw(cx, cy, s) { return cmEgg(cx, cy, s * 0.52, 0, 1); }
  function cmIconCooked(cx, cy, s, t, pan) { return cmEgg(cx, cy, s * 0.52, 1, pan); }
  function cmIconWood(cx, cy, s) { return MK.pic(cx, cy, s, ART.ICONS.wood); }
  function cmIconAsh(cx, cy, s, t) { return cmSmoke(cx + s * 0.05, cy + s * 0.02, (t || 0) + 3, 0, null, 1, s * 0.86) + cmAsh(cx, cy + s * 0.44, s * 1.16, 1, 0, t); }
  /* Baking has no icons of its own: its chapter draws the dough and the tin
     full size, going into the oven and coming out, so there is nothing for a
     small one to say. */

  /* ==== the title =====================================================================
     The lesson's two kinds of change, one above the other: ice melts into water
     and freezes back (the loop closes, a tick), and a raw egg cooks and cannot
     go back (a cross). In the spoken title the egg cooks on "a new material",
     the ice melts on "do not", and both ways back are tried on "back". Behind
     the cards it stands finished. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.spoken ? o.scene : null;
    var newAt = s ? sc(s, 0, "new") : null, notAt = s ? sc(s, 0, "not") : null, askAt = s ? sc(s, 1, "ask") : null, backAt = s ? sc(s, 1, "back") : null;
    var egg = s ? on(t, newAt, 1.0) : 1, ice = s ? on(t, notAt, 1.0) : 1, back = s ? on(t, backAt, 0.9) : 1;
    var eggLit = s ? 0.35 + 0.65 * on(t, newAt, 0.4) : 1, iceLit = s ? 0.35 + 0.65 * on(t, notAt, 0.4) : 1;
    var out = R(8, 8, 344, 344, 40, "#123247", P.line, 3);
    /* the ice: a cube that melts into water, and freezes back */
    out += G(G(cmIconIce(96, 112, 82), { transform: around(96, 112, 1 - 0.12 * bump(t, notAt, 0.8)) }) + cmIconWater(266, 110, 78), { opacity: iceLit });
    out += cmBow([146, 88], [181, 34], [216, 88], ice, P.gold, 7);
    out += cmBow([216, 138], [181, 192], [146, 138], back, P.teal, 7);
    /* the egg: raw, then cooked for good */
    var cookU = s ? on(t, newAt == null ? null : newAt + 0.3, 1.1) : 1;
    out += G(cmIconRaw(96, 256, 92) + G(cmEgg(266, 256, 38, cookU, 1), { opacity: s ? on(t, newAt, 0.5) : 1 }), { opacity: eggLit });
    out += cmBow([146, 230], [181, 176], [216, 230], egg, P.gold, 7);
    out += cmBow([216, 282], [181, 336], [146, 282], back * 0.42, P.teal, 7);
    /* the question, and its two answers */
    if (s) out += MK.qmark(326, 184, 16, on(t, askAt, 0.4) * (1 - on(t, backAt, 0.4)));
    var vp = s ? popIn(t, backAt == null ? null : backAt + 0.75, 0.35) : 1;
    if (vp > 0) out += C(181, 165, 19, "#123247", null, null, { opacity: Math.min(1, vp) }) + MK.tick(181, 165, 17, vp) +
      C(185, 309, 19, "#123247", null, null, { opacity: Math.min(1, vp) }) + MK.cross(185, 309, 17, vp);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Ice melts into water and freezes back; a raw egg cooks and cannot go back">' + out + "</svg>";
  }

  /* ==== Grade 2 Science, Lesson 9: Rocks and the Earth ========================
     tools/lib/film-scenes/science-g2/rocks-and-the-earth.js, with -2.js, -3.js
     and -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/rocks-and-the-earth.json.

     The lesson draws its six rocks with emoji that show where the rock comes
     from or what it is used for - a desert for sandstone, a temple for marble,
     a house for slate, a volcano for pumice - and the film's lines name what
     each rock LOOKS like (speckles, grains, flat sheets, holes). Rule 8 of the
     brief says the picture has to show what the words say, so the six rocks are
     drawn here, each with its own texture, and the lesson's own drawings are
     used where they are the rock itself: ICONS.chalk for the stick you write
     with, ICONS.coin for the scratch test, ICONS.rock for a plain stone, and
     ART.scene("extract", 0..2) - the quarry, the mine and the riverbed the
     lesson's demo step walks through - for where rock comes from.

     This file: the palette, the timing helpers, the six rocks, and the title
     motif. Every top-level name starts with rk. */

  var HUE = {
    title: P.teal, kinds: P.gold, testing: P.blue, where: P.accent,
    around: P.plum, helping: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function rkOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function rkFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var RK_SCATTER = [0.17, 0.63, 0.41, 0.86, 0.29, 0.74, 0.08, 0.95, 0.52, 0.36, 0.68, 0.23,
    0.81, 0.47, 0.12, 0.59, 0.90, 0.33, 0.71, 0.05, 0.44, 0.78, 0.26, 0.61];

  /* ---- the six rocks ----------------------------------------------------------
     One lumpy body in unit space (-1..1), three forms so the six do not look
     stamped from one mould, and a texture per kind drawn from fixed numbers.
     Nothing here clips, so the same rock can be drawn twice in one frame
     without two clipPaths of one id disagreeing. */
  var RK_FORMS = [
    [[-1.00, -0.06], [-0.80, -0.58], [-0.30, -0.84], [0.28, -0.88], [0.76, -0.56], [1.00, -0.02], [0.84, 0.54], [0.34, 0.86], [-0.30, 0.84], [-0.82, 0.50]],
    [[-0.98, -0.18], [-0.66, -0.66], [-0.12, -0.88], [0.44, -0.80], [0.92, -0.42], [0.98, 0.16], [0.68, 0.70], [0.10, 0.88], [-0.46, 0.78], [-0.88, 0.36]],
    [[-0.96, 0.02], [-0.72, -0.52], [-0.22, -0.82], [0.36, -0.86], [0.82, -0.50], [0.98, 0.08], [0.76, 0.60], [0.22, 0.84], [-0.36, 0.82], [-0.86, 0.46]]
  ];
  var RK_KINDS = {
    granite:   { form: 0, fill: "#8E8E92", edge: "#55555A", top: "#B4B4B8", lo: "#6B6B70" },
    chalk:     { form: 1, fill: "#F2EFE4", edge: "#B4AD9C", top: "#FFFFFF", lo: "#DAD3C2" },
    sandstone: { form: 2, fill: "#C9A26B", edge: "#8A6A3A", top: "#DFBC8A", lo: "#AD8650" },
    marble:    { form: 0, fill: "#E9ECF0", edge: "#97A4AF", top: "#FFFFFF", lo: "#CFD7DF" },
    slate:     { form: 1, fill: "#44515D", edge: "#1F2831", top: "#5C6B78", lo: "#333E48" },
    pumice:    { form: 2, fill: "#BEB7AB", edge: "#867F73", top: "#D4CDC1", lo: "#9C9589" }
  };
  var RK_ORDER = ["granite", "chalk", "sandstone", "marble", "slate", "pumice"];

  function rkPoly(cx, cy, r, form, squash) {
    var pts = RK_FORMS[form], d = "";
    for (var k = 0; k < pts.length; k++) {
      d += (k ? " L" : "M") + n2(cx + pts[k][0] * r) + "," + n2(cy + pts[k][1] * r * (squash || 0.82));
    }
    return d + " Z";
  }

  /* granite's speckles, sandstone's grains, pumice's holes: fixed unit places
     well inside the body, so none can sit on the rim */
  var RK_SPOTS = [
    [-0.52, -0.30], [0.10, -0.46], [0.54, -0.22], [-0.18, -0.06], [0.34, 0.12],
    [-0.60, 0.16], [0.02, 0.38], [0.60, 0.34], [-0.34, 0.44], [0.24, -0.20],
    [-0.06, 0.06], [0.46, -0.48]
  ];

  /* one rock. `lit` 0..1 fades it; `show` 0..1 is how much of its texture has
     arrived (granite's speckles, sandstone's grains, pumice's holes count in);
     `sheen` 0..1 slides marble's polish across it; `split` 0..1 opens slate. */
  function rkRock(kind, cx, cy, r, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var K = RK_KINDS[kind], show = opt.show == null ? 1 : opt.show, out = "";
    var body = rkPoly(cx, cy, r, K.form), sq = 0.82;

    if (kind === "slate" && opt.split > 0) {
      /* three thin sheets sliding apart, the lesson's "splits into thin flat
         sheets": the same body cut in three bands, each band's own slice */
      var s = opt.split, out2 = "";
      for (var b = 0; b < 3; b++) {
        var dy = (b - 1) * r * 0.46 * s, dx = (b - 1) * r * 0.30 * s;
        var h = r * sq * 0.30;
        out2 += G(R(cx - r * 0.94, cy - h / 2, r * 1.88, h * 1.02, h * 0.34, K.fill, K.edge, 3) +
          R(cx - r * 0.94, cy - h / 2, r * 1.88, h * 0.30, h * 0.20, K.top, null, null, { opacity: 0.55 }),
          { transform: tr(dx, dy) });
      }
      return G(out2, { opacity: clamp(o, 0, 1) });
    }

    out += Pth(body, K.fill, K.edge, Math.max(2, r * 0.07));
    /* a lit top face and a shaded foot, so it reads as a solid lump */
    out += Pth("M" + n2(cx - r * 0.80) + "," + n2(cy - r * sq * 0.36) +
      " L" + n2(cx - r * 0.28) + "," + n2(cy - r * sq * 0.80) +
      " L" + n2(cx + r * 0.30) + "," + n2(cy - r * sq * 0.82) +
      " L" + n2(cx + r * 0.16) + "," + n2(cy - r * sq * 0.22) + " Z", K.top, null, null, { opacity: 0.55 });
    out += Pth("M" + n2(cx - r * 0.72) + "," + n2(cy + r * sq * 0.34) +
      " L" + n2(cx + r * 0.30) + "," + n2(cy + r * sq * 0.42) +
      " L" + n2(cx + r * 0.62) + "," + n2(cy + r * sq * 0.06) +
      " L" + n2(cx + r * 0.84) + "," + n2(cy + r * sq * 0.22) +
      " L" + n2(cx + r * 0.32) + "," + n2(cy + r * sq * 0.86) +
      " L" + n2(cx - r * 0.30) + "," + n2(cy + r * sq * 0.84) + " Z", K.lo, null, null, { opacity: 0.5 });

    if (kind === "granite") {
      /* speckles of different colours: the lesson's "speckled with crystals" */
      var cols = ["#F4F1E8", "#C1553F", "#2E2E33", "#F4F1E8", "#7F97AE", "#2E2E33"];
      var many = Math.round(12 * clamp(show, 0, 1));
      for (var k = 0; k < many; k++) {
        var p = RK_SPOTS[k], rr = r * (0.055 + 0.035 * RK_SCATTER[k]);
        out += C(cx + p[0] * r * 0.82, cy + p[1] * r * sq * 0.80, rr, cols[k % cols.length], null, null, { opacity: 0.95 });
        out += C(cx + p[1] * r * 0.62, cy - p[0] * r * sq * 0.58, rr * 0.7, cols[(k + 3) % cols.length], null, null, { opacity: 0.8 });
      }
    } else if (kind === "sandstone") {
      var grains = Math.round(22 * clamp(show, 0, 1));
      for (var g = 0; g < grains; g++) {
        var a = g * 2.399, rad = 0.26 + 0.62 * ((g * 7) % 11) / 11;
        var gx = cx + Math.cos(a) * rad * r * 0.86, gy = cy + Math.sin(a) * rad * r * sq * 0.84;
        out += C(gx, gy, r * 0.045, g % 2 ? "#EBD2A8" : "#A5814F", null, null, { opacity: 0.9 });
      }
    } else if (kind === "marble") {
      out += Pth("M" + n2(cx - r * 0.80) + "," + n2(cy - r * sq * 0.10) + " q" + n2(r * 0.36) + "," + n2(-r * 0.30) + " " + n2(r * 0.74) + ",0 q" + n2(r * 0.34) + "," + n2(r * 0.28) + " " + n2(r * 0.72) + "," + n2(-r * 0.08), null, "#A9B6C2", Math.max(1.5, r * 0.035), { opacity: 0.85 });
      out += Pth("M" + n2(cx - r * 0.56) + "," + n2(cy + r * sq * 0.46) + " q" + n2(r * 0.40) + "," + n2(-r * 0.22) + " " + n2(r * 0.84) + "," + n2(r * 0.06), null, "#BAC5CF", Math.max(1.2, r * 0.028), { opacity: 0.8 });
      if (opt.sheen > 0) {
        var u = clamp(opt.sheen, 0, 1), sx = lerp(cx - r * 1.1, cx + r * 1.1, u);
        out += Pth("M" + n2(sx - r * 0.16) + "," + n2(cy - r * sq * 0.92) + " L" + n2(sx + r * 0.16) + "," + n2(cy - r * sq * 0.92) +
          " L" + n2(sx - r * 0.06) + "," + n2(cy + r * sq * 0.92) + " L" + n2(sx - r * 0.38) + "," + n2(cy + r * sq * 0.92) + " Z",
          "#FFFFFF", null, null, { opacity: 0.55 * Math.sin(Math.PI * u) });
      }
    } else if (kind === "pumice") {
      var holes = Math.round(11 * clamp(show, 0, 1));
      for (var h2 = 0; h2 < holes; h2++) {
        var q = RK_SPOTS[h2 % RK_SPOTS.length], hr = r * (0.07 + 0.05 * RK_SCATTER[h2 + 4]);
        out += C(cx + q[0] * r * 0.78, cy + q[1] * r * sq * 0.76, hr, "#6E685D", null, null, { opacity: 0.92 });
        out += C(cx + q[0] * r * 0.78 - hr * 0.22, cy + q[1] * r * sq * 0.76 - hr * 0.24, hr * 0.5, "#4E4941", null, null, { opacity: 0.8 });
      }
    } else if (kind === "chalk") {
      out += Pth("M" + n2(cx - r * 0.50) + "," + n2(cy + r * sq * 0.10) + " q" + n2(r * 0.30) + "," + n2(-r * 0.16) + " " + n2(r * 0.62) + "," + n2(r * 0.04), null, "#DDD6C5", Math.max(1.2, r * 0.03), { opacity: 0.7 });
    } else if (kind === "slate") {
      for (var l = 0; l < 4; l++) {
        var ly = cy + (l - 1.5) * r * sq * 0.34;
        out += L(cx - r * 0.72, ly, cx + r * 0.74, ly - r * 0.06, "#66737F", Math.max(1.4, r * 0.035), { opacity: 0.7 });
      }
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the rock's name under it */
  function rkName(cx, y, text, o, now) {
    return MK.pill(cx, y, text, o, { size: 24, col: now ? P.gold : P.line, ink: now ? P.ink : P.muted, fill: now ? "#1B3A52" : P.card });
  }

  /* ==== the title ==============================================================
     A round window cut down through the ground: grass, then soil, then the rock
     the land is made of, with four of the lesson's six rocks set in it, a house
     on the grass and a pick above. In the spoken title chapter the soil band,
     then the rock below, then the rocks themselves, then the pick and the house
     arrive on their own words. On the two cards it simply stands. */
  var RK_SET = [
    { kind: "granite", x: 104, y: 232, r: 42 },
    { kind: "chalk", x: 214, y: 218, r: 36 },
    { kind: "sandstone", x: 128, y: 314, r: 34 },
    { kind: "pumice", x: 262, y: 304, r: 34 }
  ];
  function rkTitleMotifBody(t, o) {
    var scene = o.scene, out = "";
    var cSoil = scene ? sc(scene, 0, "soil") : null, cLand = scene ? sc(scene, 0, "land") : null,
      cRock = scene ? sc(scene, 0, "rock") : null, cKinds = scene ? sc(scene, 1, "kinds") : null,
      cDig = scene ? sc(scene, 1, "dig") : null, cUse = scene ? sc(scene, 1, "use") : null;
    var st = function (at) { return scene ? on(t, at, 0.5) : 1; };

    out += el("clipPath", { id: "rkMotifClip" }, C(180, 180, 170));
    var inner = "";
    inner += R(0, 0, 360, 116, 0, "#183449");                    /* the air above */
    inner += R(0, 96, 360, 22, 0, P.grass);                      /* grass */
    inner += R(0, 118, 360, 44, 0, "#6B4A2B");                   /* the soil */
    inner += R(0, 162, 360, 198, 0, "#4A4C52");                  /* the rock the land is made of */
    inner += Pth("M0,162 L68,178 L142,160 L214,180 L284,162 L360,178 V200 H0 Z", "#5B5D63");
    /* the soil band, named */
    inner += R(0, 118, 360, 44, 0, P.gold, null, null, { opacity: 0.30 * bump(t, cSoil, 1.4) });
    /* "the land": the surface line runs across */
    inner += L(0, 96, 360, 96, P.gold, 5, { opacity: st(cLand) * (scene ? 1 - on(t, cRock, 0.6) * 0.7 : 0.35) });
    /* "made of rock": the rock below lights */
    /* a pale GREY flash, not gold: gold over #4A4C52 came out brown and the
       rock band read as a second, thicker band of soil */
    inner += R(0, 162, 360, 198, 0, "#C3C6CE", null, null, { opacity: scene ? 0.34 * bump(t, cRock, 1.8) : 0.05 });
    /* four rocks set in it, arriving one after another on "many kinds" */
    RK_SET.forEach(function (it, k) {
      var p = scene ? popIn(t, cKinds == null ? null : cKinds + k * 0.22, 0.4) : 1;
      inner += rkRock(it.kind, it.x, it.y, it.r, Math.min(1, p), { show: 1 });
    });
    inner += Em(258, 86, 40, "\u{1F3E0}", { opacity: st(cUse) });       /* what people use it for */
    out += G(inner, { "clip-path": "url(#rkMotifClip)" });
    out += C(180, 180, 170, "none", P.line, 3);
    /* the pick: it swings down onto the rock as "dig it out" is said */
    var dig = st(cDig);
    if (dig > 0) {
      var sw = scene && cDig != null && t >= cDig ? Math.sin((t - cDig) * 6.0) : 0;
      out += G(Em(0, 0, 58, "⛏️"), { transform: "translate(96,116) rotate(" + n2(-28 + 24 * Math.max(0, sw)) + ")", opacity: dig });
    }
    return out;
  }
  function titleMotif(o) {
    var t = o.t || 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A cut down through the ground: grass, soil, and the rock the land is made of">' +
      rkTitleMotifBody(t, o) + "</svg>";
  }

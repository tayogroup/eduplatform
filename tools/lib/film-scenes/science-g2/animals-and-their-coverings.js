
  /* ==== Grade 2 Science, Lesson 1: Animals and Their Coverings ================
     tools/lib/film-scenes/science-g2/animals-and-their-coverings.js, part 1 of
     4: the colours, the timing helpers, the four coverings drawn close up, the
     title motif and the chapter "Coverings". Parts -2, -3 and -4 follow in the
     same scope (the storyboard's renderer.scenes lists all four), and -4
     defines KINDS. The storyboard is
     science/grade-2-app/lecture-video/animals-and-their-coverings.json.

     Every animal is the picture the lesson itself shows (content/lesson-1.py):
     the cat, bird, fish, frog and child of its explore step, the sort step's
     bins and its dog, duck, crocodile and penguin, the order step's egg,
     chick, young hen and grown hen, the demo's baby, child and grown-up, and
     its own bird diagram. The lesson has no picture of a covering close up,
     so the film draws each one the way the lesson says it: fur as soft hair
     all over, feathers, scales as small hard plates that overlap, and smooth,
     wet skin. Every top-level name here starts with ac.

     See src/prototypes/ehel-academy/science/grade-2-app/lecture-video/BRIEF.md. */

  var HUE = {
    title: P.teal, coverings: P.gold, sort: P.blue, alike: P.accent,
    grow: P.good, parents: P.plum, diagram: P.gold, recap: P.teal
  };

  /* the lesson's own pictures; the feather is Emoji 13, so MK.pic draws the
     kit's feather for it, as the lesson does */
  var AC = {
    cat: "\u{1F431}", catBody: "\u{1F408}", bird: "\u{1F426}", fish: "\u{1F41F}", frog: "\u{1F438}",
    child: "\u{1F9D2}", dog: "\u{1F415}", duck: "\u{1F986}", croc: "\u{1F40A}", penguin: "\u{1F427}",
    feather: "\u{1FAB6}", egg: "\u{1F95A}", hatch: "\u{1F423}", young: "\u{1F425}", hen: "\u{1F414}",
    baby: "\u{1F476}", adult: "\u{1F9D1}", water: "\u{1F30A}"
  };

  /* ---- timing ---------------------------------------------------------------- */
  /* 0 -> 1 as the chapter's beat k comes in, back to 0 as beat k + 1 comes in */
  function acOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k, a = k === 0 ? 1 : into(t, b), z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function acFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* on from `at`, off again from `until` */
  function acSpan(t, at, until, a, b) {
    if (at == null) return 0;
    return on(t, at, a || 0.35) * (until == null ? 1 : 1 - inAt(t, until, b || 0.35));
  }
  /* fixed numbers for anything scattered: never Math.random */
  var AC_R = [0.13, 0.71, 0.42, 0.88, 0.27, 0.59, 0.05, 0.94, 0.36, 0.66, 0.19, 0.81, 0.52, 0.33, 0.77, 0.08,
    0.61, 0.24, 0.97, 0.45, 0.69, 0.15, 0.84, 0.39, 0.57, 0.02, 0.73, 0.29, 0.91, 0.48, 0.11, 0.64];
  function acRnd(k) { return AC_R[((k % 32) + 32) % 32]; }
  /* an emoji popped in about its own centre */
  function acPop(x, y, size, pic, p, extra) {
    if (!(p > 0)) return "";
    return G(MK.pic(x, y, size, pic), Object.assign({ transform: around(x, y, Math.min(p, 1.1)), opacity: Math.min(1, p) }, extra || {}));
  }

  /* ---- the four coverings, close up -------------------------------------------
     Each fills the square round (cx, cy) of half-width r; the caller clips it. */
  /* fur: soft hair all over, the ginger of the lesson's cat; sway 0..1 moves it */
  function acFur(cx, cy, r, t, sway) {
    var out = R(cx - r, cy - r, 2 * r, 2 * r, 0, "#E0953A"), sp = r / 5, n = 0;
    for (var gy = -r - sp; gy <= r + sp; gy += sp * 0.7) {
      for (var gx = -r - sp; gx <= r + sp; gx += sp * 0.9) {
        n++;
        var x = cx + gx + (acRnd(n) - 0.5) * sp * 0.8, y = cy + gy + (acRnd(n + 9) - 0.5) * sp * 0.6;
        var a = -1.15 + (acRnd(n + 5) - 0.5) * 0.5 + (sway || 0) * 0.22 * Math.sin(t * 2.6 + n * 0.7);
        var len = sp * (1.2 + acRnd(n + 11) * 0.6), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
        var mx = x + Math.cos(a + 0.55) * len * 0.5, my = y + Math.sin(a + 0.55) * len * 0.5;
        var v = acRnd(n + 3), col = v < 0.42 ? "#A85A16" : v < 0.8 ? "#F4BD68" : "#FBE3B0";
        out += Pth("M" + n2(x) + "," + n2(y) + " Q" + n2(mx) + "," + n2(my) + " " + n2(ex) + "," + n2(ey), null, col, Math.max(1.6, r * 0.03));
      }
    }
    return out;
  }
  /* feathers: rows of them, each row lying over the one below; the red of the
     lesson's bird, or (dark) the penguin's */
  var AC_FEA = { red: ["#E8305E", "#F4507A", "#D6275A", "#8E1537", "#FFB3C7"], dark: ["#3E4270", "#4B5087", "#343861", "#1C1F3D", "#A9AEDC"] };
  function acFeathers(cx, cy, r, pal) {
    var f = AC_FEA[pal || "red"], out = R(cx - r, cy - r, 2 * r, 2 * r, 0, f[3]), w = r / 2.4, h = w * 1.3, rows = [];
    for (var y = cy - r - h * 0.5; y <= cy + r + 4; y += h * 0.52) rows.push(y);
    for (var q = rows.length - 1; q >= 0; q--) {
      for (var x = cx - r - w + (q % 2 ? w / 2 : 0), m = 0; x <= cx + r + w; x += w, m++) {
        var y0 = rows[q];
        out += Pth("M" + n2(x - w / 2) + "," + n2(y0) + " C" + n2(x - w / 2) + "," + n2(y0 + h * 0.7) + " " + n2(x - w * 0.16) + "," + n2(y0 + h) + " " + n2(x) + "," + n2(y0 + h) +
          " C" + n2(x + w * 0.16) + "," + n2(y0 + h) + " " + n2(x + w / 2) + "," + n2(y0 + h * 0.7) + " " + n2(x + w / 2) + "," + n2(y0) + " Z", f[(q + m) % 3], f[3], 2) +
          L(x, y0 + 2, x, y0 + h * 0.84, f[4], 2.4);
      }
    }
    return out;
  }
  /* ONE feather, in the same palette as the close-up above. The kit's feather
     drawing (what MK.pic makes of \u{1FAB6}) is blue, which is right where a
     feather stands for the idea - the Feathers bin of the sort - and wrong when
     it is meant to have come off the bird standing beside it: the lesson's bird
     is the red one, and its close-up in the lens is red. */
  function acFeather1(cx, cy, size, pal) {
    var f = AC_FEA[pal || "red"], w = size * 0.6, h = size * 0.9;
    var top = cy - h * 0.5, vane = cy + h * 0.24, quill = cy + h * 0.5, out = "";
    /* the vane: a tip at the top, widest a third of the way down, closing on
       the shaft above the bare quill */
    out += Pth("M" + n2(cx) + "," + n2(top) +
      " C" + n2(cx + w * 0.58) + "," + n2(top + h * 0.2) + " " + n2(cx + w * 0.5) + "," + n2(vane - h * 0.14) + " " + n2(cx) + "," + n2(vane) +
      " C" + n2(cx - w * 0.5) + "," + n2(vane - h * 0.14) + " " + n2(cx - w * 0.58) + "," + n2(top + h * 0.2) + " " + n2(cx) + "," + n2(top) + " Z",
      f[1], f[3], Math.max(1.5, size * 0.025));
    /* barbs, swept down and out from the shaft, so it is a feather and not a leaf */
    for (var k = 1; k <= 7; k++) {
      var u = k / 8, y = top + (vane - top) * u, sp = w * 0.46 * Math.sin(Math.PI * Math.min(1, u * 1.2));
      out += L(cx, y - (vane - top) * 0.09, cx - sp, y + (vane - top) * 0.06, f[0], Math.max(1.2, size * 0.022)) +
        L(cx, y - (vane - top) * 0.09, cx + sp, y + (vane - top) * 0.06, f[2], Math.max(1.2, size * 0.022));
    }
    out += L(cx, top + h * 0.04, cx, quill, f[4], Math.max(1.8, size * 0.05));
    return out;
  }

  /* scales: small hard plates that overlap, the lesson's blue fish. `rows` of
     them are laid from the bottom up, each new row landing over the last. */
  function acScales(cx, cy, r, rows, flash) {
    var s = r / 3.4, out = R(cx - r, cy - r, 2 * r, 2 * r, 0, "#173E73"), list = [];
    for (var y = cy + r + s * 0.6; y >= cy - r - s; y -= s * 0.95) list.push(y);
    list.forEach(function (y, q) {
      var p = clamp((rows == null ? 99 : rows) - q, 0, 1);
      if (p <= 0) return;
      var dy = -s * 0.9 * (1 - ease(p)), o = Math.min(1, p * 1.6), fl = q === Math.floor((rows || 0) - 0.01) ? flash || 0 : 0;
      for (var x = cx - r - s + (q % 2 ? s : 0); x <= cx + r + s; x += 2 * s) {
        out += G(C(x, y + dy, s, "#3D83EC", "#A7CBFF", Math.max(2, r * 0.022)) +
          Pth("M" + n2(x - s * 0.62) + "," + n2(y + dy + s * 0.3) + " Q" + n2(x) + "," + n2(y + dy + s * 0.86) + " " + n2(x + s * 0.62) + "," + n2(y + dy + s * 0.3), null, "#6FA5F5", Math.max(2, r * 0.02)) +
          (fl > 0 ? C(x, y + dy, s, "none", P.gold, 4, { opacity: fl }) : ""), { opacity: o });
      }
    });
    return out;
  }
  /* smooth skin: one colour, a shine, and (wet) drops of water on it */
  var AC_DROPS = [[0.34, 0.12, 0.1], [-0.22, 0.4, 0.08], [0.5, -0.32, 0.07], [-0.52, -0.02, 0.09], [0.08, 0.62, 0.07], [-0.1, -0.5, 0.06]];
  /* faint creases, so bare skin close up reads as skin and not as a ball */
  var AC_CREASE = [[-0.62, -0.28, 0.5], [-0.3, 0.3, 0.42], [0.22, -0.52, 0.38], [0.36, 0.44, 0.46], [-0.02, 0.06, 0.34], [0.6, -0.06, 0.3]];
  function acSmooth(cx, cy, r, c1, c2, id, wet) {
    var out = '<defs><radialGradient id="' + id + '" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient></defs>' +
      R(cx - r, cy - r, 2 * r, 2 * r, 0, "url(#" + id + ")") +
      E(cx - r * 0.3, cy - r * 0.46, r * 0.38, r * 0.12, "#FFFFFF", null, null, { opacity: 0.3, transform: "rotate(-22 " + n2(cx - r * 0.3) + " " + n2(cy - r * 0.46) + ")" });
    if (!wet) AC_CREASE.forEach(function (d, k) {
      var x = cx + d[0] * r, y = cy + d[1] * r, w = d[2] * r;
      out += Pth("M" + n2(x - w / 2) + "," + n2(y) + " Q" + n2(x) + "," + n2(y + (k % 2 ? w : -w) * 0.22) + " " + n2(x + w / 2) + "," + n2(y),
        null, "#FFFFFF", Math.max(1.4, r * 0.022), { opacity: 0.14 });
    });
    if (wet) AC_DROPS.forEach(function (d) {
      var x = cx + d[0] * r, y = cy + d[1] * r, rr = d[2] * r;
      out += C(x, y, rr, "#D8F6FF", "#FFFFFF", 1.5, { opacity: 0.6 }) + C(x - rr * 0.32, y - rr * 0.32, rr * 0.3, "#FFFFFF", null, null, { opacity: 0.95 });
    });
    return out;
  }
  /* covering k of the chapter (0 fur, 1 feathers, 2 scales, 3 a frog's skin, 4 your skin) */
  function acCovering(k, cx, cy, r, t, o, id) {
    o = o || {};
    if (k === 0) return acFur(cx, cy, r, t, o.sway);
    if (k === 1) return acFeathers(cx, cy, r);
    if (k === 2) return acScales(cx, cy, r, o.rows, o.flash);
    if (k === 3) return acSmooth(cx, cy, r, "#9BE38F", "#2E8A46", id + "g", true);
    return acSmooth(cx, cy, r, "#D59455", "#A2622C", id + "g", false);
  }
  /* a round close-up: covering `inner` shown inside a circle, opened by a wipe from the centre */
  function acLens(cx, cy, r, inner, id, reveal, ring, o) {
    if (!(o > 0)) return "";
    var rr = r * clamp(reveal, 0, 1);
    return G(C(cx, cy, r, P.cell) + (rr > 0.5 ? el("clipPath", { id: id }, C(cx, cy, rr)) + G(inner, { "clip-path": "url(#" + id + ")" }) : "") +
      C(cx, cy, r, "none", ring || P.line, 6), { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ====================================================================
     The four bins of the lesson's sort, as four quarters of one round window:
     the cat on fur, the bird on feathers, the fish on scales, the frog on skin.
     Spoken, the animals come in on "Every animal", their coverings on "a
     covering", and each quarter lights as its covering is named. On the cards
     it simply stands. */
  var AC_Q = [[0, 0, AC.cat], [1, 0, AC.bird], [0, 1, AC.fish], [1, 1, AC.frog]];
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, c = function (k, n) { return s ? sc(s, k, n) : null; };
    var cAnimal = c(0, "animal"), cCover = c(0, "covering"), cDiff = c(1, "different");
    var hot = [c(1, "fur"), c(1, "feathers"), c(1, "scales"), c(1, "skin")];
    var out = el("clipPath", { id: "acMotifClip" }, C(180, 180, 172)) + C(180, 180, 172, "#123247"), tex = "", pics = "";
    var cov = s ? on(t, cCover, 0.7) : 1;
    /* while the four are named one by one, the others are darker */
    var dimAll = s ? on(t, hot[0], 0.3) * (1 - on(t, cDiff, 0.45)) : 0;
    AC_Q.forEach(function (q, k) {
      var x0 = q[0] * 180, y0 = q[1] * 180, cx = x0 + 90, cy = y0 + 90;
      var now = s ? on(t, hot[k], 0.25) * (1 - on(t, k < 3 ? hot[k + 1] : cDiff, 0.25)) : 0;
      var lit = 1 - 0.62 * dimAll * (1 - now);
      tex += el("clipPath", { id: "acMotifQ" + k }, R(x0, y0, 180, 180)) +
        G(acCovering(k, cx, cy, 92, t, { sway: 0.4 }, "acMotif" + k), { "clip-path": "url(#acMotifQ" + k + ")", opacity: cov * lit });
      var p = s ? popIn(t, cAnimal == null ? null : cAnimal + k * 0.16, 0.45) : 1;
      var px = 100 + q[0] * 160, py = 100 + q[1] * 160, big = 1 + 0.1 * bump(t, s ? hot[k] : null, 0.8);
      if (p > 0) pics += G(C(px, py, 52, P.ground, null, null, { opacity: 0.62 }) + MK.pic(px, py, 92, q[2]),
        { transform: around(px, py, Math.min(p, 1.1) * big), opacity: Math.min(1, p) * lerp(0.5, 1, (lit - 0.38) / 0.62) });
    });
    out += G(tex, { "clip-path": "url(#acMotifClip)" });
    out += L(180, 8, 180, 352, "#0B1D2C", 6) + L(8, 180, 352, 180, "#0B1D2C", 6);
    out += pics + C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A cat on fur, a bird on feathers, a fish on scales and a frog on skin">' + out + "</svg>";
  }

  /* ==== chapter: coverings ============================================================
     One animal at a time, big on the left, as its line names it; its covering
     opens close up in the round window beside it as the covering is named, with
     the lesson's word for it. Each animal then drops into a row along the
     bottom, with its word, so the row fills: cat fur, bird feathers, fish
     scales, frog skin. The child comes last, and on "You are an animal too"
     joins the row, which rises and is ringed as one group: animals. */
  var AC_COVS = [
    { pic: AC.cat, word: "fur", name: "cat", at: "fur", spot: [0.14, 0.2] },
    { pic: AC.bird, word: "feathers", name: "bird", at: "feathers", spot: [0.1, 0.1] },
    { pic: AC.fish, word: "scales", name: "fish", at: "scales", spot: [-0.02, 0.12] },
    { pic: AC.frog, word: "skin", name: "frog", at: "skin", spot: [0.02, 0.3] },
    { pic: AC.child, word: "skin", name: "you", at: "you", spot: [0.17, 0.2] }
  ];
  /* ay is 184, not 170: at 230 px an emoji reaches about 140 px above its own
     centre, so the bird rising on "help it fly" drew 27 px above the box. */
  var ACV = { ax: 222, ay: 184, as: 230, lx: 590, ly: 166, lr: 134, wx: 780 };
  var AC_TILE = { x0: 85, step: 202, y: 356, w: 190, h: 76, es: 54 };
  /* the row rises and grows a little for the last line: a point of it, moved */
  function acRowXY(x, y, g) { var s = 1 + 0.1 * g; return [584 + (x - 584) * s, 394 + (y - 394) * s - 150 * g]; }
  function acRowTransform(g) { return "translate(0," + n2(-150 * g) + ") " + around(584, 394, 1 + 0.1 * g); }
  function acRowTile(k, lit) {
    var x = AC_TILE.x0 + k * AC_TILE.step, y = AC_TILE.y, cv = AC_COVS[k];
    if (!lit) return R(x, y, AC_TILE.w, AC_TILE.h, 18, "none", P.line, 2, { "stroke-dasharray": "10 8", opacity: 0.5 });
    return R(x, y, AC_TILE.w, AC_TILE.h, 18, P.card, P.line, 2) + MK.pic(x + 42, y + 38, AC_TILE.es, cv.pic) +
      Tx(x + 80, y + 46, cv.word, "lab", "start");
  }

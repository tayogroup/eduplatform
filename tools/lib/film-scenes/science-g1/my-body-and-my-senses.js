
  /* ==== Grade 1 Science, Lesson 3: My Body and My Senses =====================
     The film's pictures, in three parts joined into one script between the
     shared engine's head and tail (tools/lib/ehel-film-engine-head.js):
       this file   the colours, the child, the title, "The parts of your body"
       -2.js       "Your five senses" and "Your senses keep you safe"
       -3.js       "Alike and different", "Measuring in hand spans", the recap, KINDS

     The child is the lesson's own tap figure, ART.figure("body"): the drawing the
     learner taps two steps later, with its ten parts. A part wears its own tap
     outline only while it is being named, and the parts already named are shown
     by brightness (the brief's rule 3). Every name below starts with mb, so no
     function here can replace one of the engine's by sharing its name. */

  var HUE = {
    title: P.teal, body: P.gold, senses: P.plum, safe: P.accent,
    alike: P.blue, measure: P.good, recap: P.teal
  };

  /* ==== the child ============================================================ */
  var MB_FIG = ART.figure("body");
  var MB_PARTS = ART.parts(MB_FIG);   /* head eyes ears nose mouth tummy arms hands legs feet */
  var MB_DIM = 0.35;
  var MB_SENSE_PICS = ["\u{1F441}️", "\u{1F442}", "\u{1F443}", "\u{1F445}", "✋"];

  /* The child as the lesson draws it. o.ring: the part being named, outlined in
     gold; o.lit(part) -> 0 (not named yet, faded to MB_DIM) .. 1 (named, bright). */
  function mbChild(o) {
    o = o || {};
    var s = MB_FIG;
    if (o.ring) s = ART.ring(s, o.ring, o.ringCol || P.gold, o.ringW || 5);
    if (o.lit) MB_PARTS.forEach(function (p) {
      var v = clamp(o.lit(p), 0, 1);
      if (v < 1) s = ART.dim(s, p, MB_DIM + (1 - MB_DIM) * v);
    });
    return s;
  }
  /* a box for the child in the film's space: its top-left and its scale (the
     figure is 260 x 400), a point of the figure in the film's space, and the
     child put in the box */
  function mbPt(b, p) { return [b.x + p[0] * b.s, b.y + p[1] * b.s]; }
  function mbPut(markup, b, extra) { return ART.place(markup, b.x, b.y, 260 * b.s, 400 * b.s, extra); }

  /* Where a pointing line meets each part's tap outline, from the left (L) and
     from the right (R), in the figure's own 260 x 400 space. The tummy is met
     at its lower corner, through the gap between the hand and the leg, so its
     line crosses nothing on the way. */
  var MB_ANCHOR = {
    head: { L: [93, 27], R: [167, 27] },
    eyes: { L: [104, 51], R: [156, 51] },
    ears: { L: [72, 66], R: [188, 66] },
    nose: { L: [119, 80], R: [141, 80] },
    mouth: { L: [106, 92], R: [154, 92] },
    tummy: { L: [85, 227], R: [175, 227] },
    arms: { L: [30, 170], R: [230, 170] },
    hands: { L: [28, 238], R: [232, 238] },
    legs: { L: [88, 300], R: [172, 300] },
    feet: { L: [80, 343], R: [180, 343] }
  };
  function mbAnchor(b, part, side) { return mbPt(b, MB_ANCHOR[part][side]); }

  /* The child with every part glowing: the skin, which is all over the body.
     A drop shadow follows the drawing's own outline, so the glow is the child's
     shape and nothing else. */
  function mbSkinGlow(markup, b, o, id) {
    if (!(o > 0)) return "";
    return el("filter", { id: id, x: "-30%", y: "-20%", width: "160%", height: "140%" },
      el("feDropShadow", { dx: 0, dy: 0, stdDeviation: 9, "flood-color": P.gold, "flood-opacity": 1 })) +
      G(mbPut(markup, b), { filter: "url(#" + id + ")", opacity: o }) + G(mbPut(markup, b), { filter: "url(#" + id + ")", opacity: 0.6 * o });
  }

  /* a word in a chip, as the lesson's part list draws one (science.css
     .partlist): muted until its part is named, gold while it is being named,
     green once found. anchor "end" puts the chip's right edge at x. */
  function mbChip(x, y, text, o, state, anchor, size) {
    if (!(o > 0)) return "";
    size = size || 26;
    var w = text.length * size * 0.56 + size * 1.3, h = size * 1.7;
    var left = anchor === "end" ? x - w : anchor === "start" ? x : x - w / 2;
    var col = state === "now" ? P.gold : state === "found" ? P.good : P.line;
    var ink = state === "now" ? P.ink : state === "found" ? P.good : P.muted;
    return G(R(left, y - h / 2, w, h, h / 2, state === "now" ? "#1B3A52" : P.card, col, state === "now" ? 3 : 2) +
      Tx(left + w / 2, y + size * 0.36, text, "lab", "middle", { "font-size": size, fill: ink }), { opacity: o });
  }

  /* ==== the title motif ========================================================
     The child and the five senses around it. In the spoken title the parts are
     outlined one at a time on "every part has a name", and the senses arrive on
     "five senses"; on the two cards everything is simply there. */
  var MB_SWEEP = ["head", "arms", "hands", "tummy", "legs", "feet", "eyes", "ears", "nose", "mouth"];
  var MB_SPOTS = [[42, 74], [318, 118], [42, 184], [318, 228], [42, 294]];
  function titleMotif(o) {
    var t = o.t || 0, scene = o.scene;
    var b = { x: 180 - 130 * 0.78, y: 24, s: 0.78 };
    var sweep = scene ? sc(scene, 0, "name") : null, senses = scene ? sc(scene, 1, "senses") : null, world = scene ? sc(scene, 1, "world") : null;
    var fig = MB_FIG;
    if (sweep != null && t >= sweep) {
      var k = Math.floor((t - sweep) / 0.24);
      if (k < MB_SWEEP.length) fig = ART.ring(fig, MB_SWEEP[k], P.gold, 7);
    }
    var out = mbPut(fig, b);
    MB_SPOTS.forEach(function (p, k) {
      /* the senses arrive on "five senses" and all pulse on "about the world" */
      var s = scene ? popIn(t, senses == null ? null : senses + k * 0.2, 0.35) : 1;
      if (s <= 0) return;
      s *= 1 + 0.18 * bump(t, world == null ? null : world + k * 0.08, 0.55);
      out += G(C(p[0], p[1], 32, P.card, P.line, 2) + MK.pic(p[0], p[1], 40, MB_SENSE_PICS[k]),
        { transform: around(p[0], p[1], s), opacity: Math.min(1, s) });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A child, and the five senses">' + out + "</svg>";
  }

  var mbTitle = MK.titleKind({
    sub: ["The parts of your body, and your five senses.", "How people are alike, and different.", "Measuring your friends in hand spans."]
  });

  /* A magnifying lens on the child's face: the same drawing, the same outline,
     at `zoom` times, clipped to a circle of radius r at (cx, cy). u (0..1) grows
     it out of the child's own head, and the cone joins the two. */
  var MB_FACE = [130, 64];
  function mbLens(markup, fig, cx, cy, r, zoom, u, id) {
    if (!(u > 0)) return "";
    var h = mbPt(fig, MB_FACE), rh = 50 * fig.s;
    var x = lerp(h[0], cx, u), y = lerp(h[1], cy, u), rr = lerp(rh, r, u), z = lerp(fig.s, zoom, u);
    var b = { x: x - MB_FACE[0] * z, y: y - MB_FACE[1] * z, s: z };
    var cone = Pth("M" + n2(h[0]) + "," + n2(h[1] - rh) + " L" + n2(x) + "," + n2(y - rr) +
      " L" + n2(x) + "," + n2(y + rr) + " L" + n2(h[0]) + "," + n2(h[1] + rh) + " Z", P.gold, null, null, { opacity: 0.07 * u });
    return cone + el("clipPath", { id: id }, C(x, y, rr)) + C(x, y, rr, P.card) +
      G(mbPut(markup, b), { "clip-path": "url(#" + id + ")" }) + C(x, y, rr, "none", P.gold, 4, { opacity: u });
  }
  /* a point of the face as the lens shows it (fully grown) */
  function mbLensPt(p, cx, cy, zoom) { return [cx + (p[0] - MB_FACE[0]) * zoom, cy + (p[1] - MB_FACE[1]) * zoom]; }

  /* ==== chapter: the parts of your body =========================================
     The lesson's label step: the child, and its ten part names in two lists.
     Each part is named in the order the lecture names them; as it is said its
     chip turns gold, a line runs from the chip to the part, the part is
     outlined and it comes up to full brightness. The next part takes the
     outline and the line; the one before keeps its brightness and its chip
     turns green, as the lesson marks a part found. The face parts are small on
     the whole child, so on "On your face" a lens grows out of its head and the
     four are pointed at there, at 2.1 times; on the next line it goes back. */
  var MB_BODY_BOX = { x: 360, y: 4, s: 1.08 };
  var MB_LENS = { x: 830, y: 170, r: 132, zoom: 2.1 };
  var MB_BODY_ORDER = [
    /* part, beat, cue, where its chip is (L: left list, R: right, F: by the lens), the chip's y */
    ["head", 1, "head", "L", 44], ["arms", 2, "arms", "L", 176], ["hands", 2, "hands", "L", 252],
    ["tummy", 3, "tummy", "R", 396], ["legs", 4, "legs", "L", 322], ["feet", 4, "feet", "L", 396],
    ["eyes", 5, "eyes", "F", 60], ["ears", 5, "ears", "F", 126], ["nose", 5, "nose", "F", 206], ["mouth", 5, "mouth", "F", 280]
  ];
  var MB_CHIP_L = 308, MB_CHIP_R = 700, MB_CHIP_F = 1000;

  function sceneBody(scene, beat, t, i) {
    var b = MB_BODY_BOX, L = MB_LENS, find = sc(scene, 0, "find"), touch = sc(scene, 0, "touch"), all = sc(scene, 6, "all");
    var face = sc(scene, 5, "face"), back = BEATS[scene.first + 6].start - GAP;
    var lensU = on(t, face, 0.6) * (1 - on(t, back, 0.5));
    var at = MB_BODY_ORDER.map(function (o) { return sc(scene, o[1], o[2]); });
    var ring = null, lines = "", chips = "", lit = {};
    MB_BODY_ORDER.forEach(function (o, k) {
      var a = at[k], next = k + 1 < at.length ? at[k + 1] : all;
      var named = a != null && t >= a, now = named && (next == null || t < next);
      lit[o[0]] = named ? on(t, a, 0.35) : 1 - on(t, find, 0.6);
      if (now) ring = o[0];
      /* the face chips stand beside the child with the tummy's, and step
         aside to the right while the lens needs the room */
      var side = o[3], cy = o[4], cx = side === "L" ? MB_CHIP_L : side === "R" ? MB_CHIP_R : lerp(MB_CHIP_R, MB_CHIP_F, lensU);
      var state = !named ? "" : now ? "now" : "found";
      var pulse = all != null && t >= all ? 1 + 0.06 * bump(t, all + k * 0.05, 0.5) : 1;
      chips += G(mbChip(cx, cy, o[0], on(t, find == null ? null : find + k * 0.08, 0.3), state, side === "L" ? "end" : "start"),
        { transform: around(cx + (side === "L" ? -50 : 50), cy, pulse) });
      if (!now) return;
      var x1 = side === "L" ? MB_CHIP_L + 8 : cx - 8;
      var p = side === "F" ? mbLensPt(MB_ANCHOR[o[0]].R, L.x, L.y, L.zoom) : mbAnchor(b, o[0], side === "L" ? "L" : "R");
      lines += G(MK.leader(x1, cy, p[0], p[1], on(t, a, 0.35), P.gold), { opacity: side === "F" ? lensU : 1 });
    });
    var fig = mbChild({ ring: ring, lit: function (p) { return lit[p]; } });
    var out = "";
    /* "all of these parts": the whole child glows green, as the lesson marks a
       part it has found (science.css .found) */
    var ag = on(t, all, 0.6);
    if (ag > 0) out += el("filter", { id: "mbFound", x: "-30%", y: "-20%", width: "160%", height: "140%" },
      el("feDropShadow", { dx: 0, dy: 0, stdDeviation: 8, "flood-color": P.good, "flood-opacity": 0.9 })) +
      G(mbPut(fig, b), { filter: "url(#mbFound)", opacity: ag });
    out += mbPut(fig, b);
    /* "from your shoulders": a point where each arm joins the body */
    var sh = sc(scene, 2, "shoulders"), so = on(t, sh, 0.3) * (1 - on(t, sc(scene, 2, "hands"), 0.3));
    if (so > 0) [[84, 132], [176, 132]].forEach(function (p) {
      var q = mbPt(b, p);
      out += C(q[0], q[1], 9, P.gold, P.ground, 2.5, { opacity: so }) + MK.ripple(q[0], q[1], t, sh, P.gold);
    });
    out += mbLens(fig, b, L.x, L.y, L.r, L.zoom, lensU, "mbLensClip");
    out += lines + chips;
    /* "Touch it on yourself too": a hand waves beside the child */
    var th = on(t, touch, 0.35) * (1 - on(t, at[0], 0.3));
    if (th > 0) {
      out += G(C(990, 200, 60, "#1B3A52", P.gold, 3) + Em(990, 202, 68, "✋", { transform: "rotate(" + n2(14 * Math.sin((t - touch) * 7)) + " 990 230)" }),
        { opacity: th });
      out += MK.ripple(990, 200, t, touch + 0.2, P.gold);
    }
    out += MK.tick(990, 200, 40, popIn(t, all == null ? null : all + 0.4, 0.4));
    return svg(out);
  }

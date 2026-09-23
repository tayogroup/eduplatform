  /* ==== Grade 3 Science, Lesson 5: Inside Your Body ===========================
     tools/lib/film-scenes/science-g3/inside-your-body.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/inside-your-body.json.

     The body is the lesson's OWN drawing throughout: ART.figure("organs"), the
     figure the child taps in "Find the organs" and labels in "Label a diagram
     of the organs". Only the organ being named wears the lesson's gold tap
     outline (ART.ring); the ones named before it stay bright and the ones not
     named yet sit at 0.35 (ART.dim), which is rule 3 of the brief.

     This file: the palette, the body panel every chapter shares, the small
     drawings, the title motif, and the chapter "Five organs". Every top-level
     name here starts with ib, so nothing can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, organs: P.gold, brainlungs: P.plum, heart: P.accent,
    gut: P.good, diagram: P.blue, model: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ibOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ibFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var IB_SCATTER = [0.17, 0.64, 0.38, 0.91, 0.23, 0.55, 0.08, 0.86, 0.44, 0.72, 0.11, 0.97,
                    0.31, 0.68, 0.05, 0.79, 0.49, 0.26, 0.93, 0.58];

  /* ---- the lesson's body, and where each organ sits in it ---------------------
     ART.figure("organs") is drawn in a 260 x 420 viewBox. The points below are
     read from its own paths: the brain's outline circle, the left lung's lobe,
     the heart (its <g> is translated up 46, so its 246 sits at 200), the
     stomach's bag and the middle of the intestine's coil. */
  var IB_FIG = { x: 84, y: 12, w: 260, h: 420 };
  function ibFX(v) { return IB_FIG.x + v * IB_FIG.w / 260; }
  function ibFY(v) { return IB_FIG.y + v * IB_FIG.h / 420; }
  var IB_ORGANS = [
    { id: "brain", label: "brain", pic: "\u{1F9E0}", at: [130, 60] },
    { id: "lungs", label: "lungs", pic: "\u{1FAC1}", at: [94, 212] },
    { id: "heart", label: "heart", pic: "\u{1FAC0}", at: [130, 196] },
    { id: "stomach", label: "stomach", pic: "\u{1F372}", at: [164, 318] },
    { id: "intestine", label: "intestine", pic: "\u{1F300}", at: [104, 352] }
  ];
  var IB_IDS = IB_ORGANS.map(function (o) { return o.id; });
  function ibOrgan(id) { return IB_ORGANS.filter(function (o) { return o.id === id; })[0]; }
  /* where a leader line should end, in the film's space */
  function ibAt(id) { var o = ibOrgan(id); return [ibFX(o.at[0]), ibFY(o.at[1])]; }

  /* The lesson's figure with a gold tap outline on the organ being named and
     the rest faded. Ring BEFORE dim, never after: ART.dim writes its opacity
     inside the part's own <g ...>, and ART.ring then cannot find the part. */
  function ibBody(opt) {
    opt = opt || {};
    var fig = ART.figure("organs"), ring = opt.ring || {}, lit = opt.lit || {};
    IB_IDS.forEach(function (p) {
      if (ring[p] > 0.004) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(clamp(ring[p], 0, 1)) + ")", opt.width || 6);
    });
    IB_IDS.forEach(function (p) {
      var o = lit[p] == null ? 1 : clamp(lit[p], 0, 1);
      if (o < 0.995) fig = ART.dim(fig, p, o);
    });
    return fig;
  }
  /* the body, whole, on its own card, with room round it (rule: never crop one) */
  function ibBodyCard(fig) {
    return R(IB_FIG.x - 14, IB_FIG.y - 8, IB_FIG.w + 28, IB_FIG.h + 16, 22, P.card, P.line, 2) +
      ART.place(fig, IB_FIG.x, IB_FIG.y, IB_FIG.w, IB_FIG.h);
  }

  /* ---- small drawings of the film's own --------------------------------------- */

  /* a word in a pill, with a leader from it to the thing it names; the newest
     is gold, one named before it keeps its line, quieter */
  function ibLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    var from = anchor === "end" ? x + 8 : x - 8;
    return MK.leader(from, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: anchor || "start", col: now ? P.gold : P.line });
  }

  /* a drop of blood, its round bottom centred on (x, y) */
  function ibDrop(x, y, r, o, col) {
    if (!(o > 0)) return "";
    col = col || "#E0564C";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", col) +
      C(x, y, r, col) + C(x - r * 0.32, y - r * 0.3, r * 0.26, "#FFFFFF", null, null, { opacity: 0.6 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* a lump of food, and then the mush it becomes: a soft blob of n bumps */
  function ibFood(cx, cy, r, o, col, seed) {
    if (!(o > 0)) return "";
    var d = "", n = 7;
    for (var k = 0; k < n; k++) {
      var a = k * 2 * Math.PI / n, rr = r * (0.78 + 0.34 * IB_SCATTER[(k + (seed || 0)) % IB_SCATTER.length]);
      var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.86;
      d += (k ? " L" : "M") + n2(x) + "," + n2(y);
    }
    return Pth(d + " Z", col || "#C98A3E", "#8B5A22", 2, { opacity: clamp(o, 0, 1), "stroke-linejoin": "round" });
  }

  /* eyes with a "no" sign over them: we cannot see inside ourselves */
  function ibNoLook(cx, cy, size, o) {
    if (!(o > 0)) return "";
    var r = size * 0.56, w = size * 0.085;
    return G(Em(cx, cy, size * 0.8, "\u{1F440}") +
      C(cx, cy, r, "none", P.bad, w) +
      L(cx - r * 0.72, cy + r * 0.72, cx + r * 0.72, cy - r * 0.72, P.bad, w),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title =================================================================
     The lesson's own body in a round window. In the spoken title chapter the
     five organs light one at a time, from the brain down, on "five organs";
     each one pulses on "has a job"; the whole body glows on "needs every one".
     On the two cards it simply stands. */
  var IB_MOTIF = { x: 87, y: 30, w: 186, h: 300 };
  function ibMX(v) { return IB_MOTIF.x + v * IB_MOTIF.w / 260; }
  function ibMY(v) { return IB_MOTIF.y + v * IB_MOTIF.h / 420; }
  function ibMotifBody(t, o) {
    if (!o.scene) return ibBody();
    var five = sc(o.scene, 0, "five");
    if (five == null || t < five) return ibBody();
    var step = (t - five) / 0.3, k = Math.floor(step), ring = {}, lit = {};
    IB_IDS.forEach(function (p, n) {
      if (n > k) lit[p] = 0.32;
      else if (n === k && k < IB_IDS.length) ring[p] = clamp(1 - (step - k) * 0.6, 0, 1);
    });
    return ibBody({ ring: ring, lit: lit, width: 7 });
  }
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var jobAt = o.scene ? sc(o.scene, 1, "job") : null, needAt = o.scene ? sc(o.scene, 1, "needs") : null;
    var workAt = o.scene ? sc(o.scene, 0, "work") : null;
    out += el("clipPath", { id: "ibMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 168, P.teal, on(t, needAt, 0.6) * (0.7 + 0.3 * breathe(t)));
    out += G(ART.place(ibMotifBody(t, o), IB_MOTIF.x, IB_MOTIF.y, IB_MOTIF.w, IB_MOTIF.h), { "clip-path": "url(#ibMotifClip)" });
    /* "hard at work": every organ beats, softly and together, from that word on */
    if (workAt != null && t >= workAt) {
      var w = on(t, workAt, 0.5) * (jobAt == null || t < jobAt ? 1 : 0);
      if (w > 0) IB_ORGANS.forEach(function (g, n) {
        var b = 0.35 + 0.65 * breathe(t + n * 0.22);
        out += C(ibMX(g.at[0]), ibMY(g.at[1]), 11 + 9 * b, "none", P.gold, 3, { opacity: w * b * 0.85 });
      });
    }
    if (jobAt != null) {
      IB_ORGANS.forEach(function (g, n) {
        var b = bump(t, jobAt + n * 0.13, 0.8);
        if (b > 0) out += C(ibMX(g.at[0]), ibMY(g.at[1]), 13 + 11 * b, "none", P.gold, 3.5, { opacity: b });
      });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The inside of a body: brain, lungs, heart, stomach and intestine">' + out + "</svg>";
  }

  /* ==== chapter: five organs =========================================================
     The lesson's body on the left. Beat 0 names what an organ IS; beat 1 takes
     the organs out of sight ("You cannot see them with your eyes") and puts
     them back ("Here is where they sit"); beats 2 and 3 name the five, each
     with the lesson's own picture of it and a line to where it sits. */
  /* `place` is the cue for the WORDS that say where the organ sits ("in your
     head", "in your chest"): the picture and the word arrive on the organ's own
     name, and the line to the body runs on the place. Beat 3 names three organs
     and no places, so those rows fall back to the organ's cue. */
  var IB_ROWS = [
    { id: "brain", k: 2, y: 40, place: "head" }, { id: "lungs", k: 2, y: 130, place: "chest" },
    { id: "heart", k: 3, y: 220 }, { id: "stomach", k: 3, y: 310 }, { id: "intestine", k: 3, y: 400 }
  ];
  var IB_ROW_X = 600, IB_ROW_PIC = 654, IB_ROW_PILL = 702;

  function ibMapChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cOrgan = c(0, "organ"), cIn = c(0, "inside"), cJob = c(0, "job");
    var cCannot = c(1, "cannot"), cWhere = c(1, "where");
    var named = {}, sits = {}, out = "";
    IB_ROWS.forEach(function (r) {
      named[r.id] = c(r.k, r.id);
      var pl = r.place ? c(r.k, r.place) : null;
      sits[r.id] = pl == null ? named[r.id] : pl;
    });

    /* how bright each organ is: hidden on "cannot see them", back on "where
       they sit", then all but the named one at 0.35 from beat 2 on */
    var hide = on(t, cCannot, 0.5) * (1 - on(t, cWhere, 0.5));
    var listing = into(t, scene.first + 2), lit = {}, ring = {};
    IB_ROWS.forEach(function (r, n) {
      var o = lerp(1, 0.08, hide);
      lit[r.id] = lerp(o, lerp(0.35, 1, on(t, named[r.id], 0.45)), listing);
      var nx = IB_ROWS[n + 1];
      ring[r.id] = on(t, named[r.id], 0.35) * (nx ? 1 - on(t, named[nx.id], 0.35) : 1);
    });

    out += ibBodyCard(ibBody({ ring: ring, lit: lit }));

    /* beat 0: what an organ is, and a ring round the whole of the inside */
    var first = ibOnly(t, scene, 0);
    if (first > 0.01) {
      var io = on(t, cIn, 0.5) * first;
      if (io > 0) out += R(ibFX(40), ibFY(24), ibFX(224) - ibFX(40), ibFY(404) - ibFY(24), 40, "none", P.teal, 4,
        { opacity: io * 0.9, "stroke-dasharray": "14 11" });
      out += MK.pill(760, 150, "organ", popIn(t, cOrgan, 0.45) * first, { size: 46, col: P.gold });
      var jo = on(t, cJob, 0.45) * first;
      if (jo > 0) out += Tx(760, 232, "a part inside you", "lab big muted", "middle", { opacity: jo }) +
        Tx(760, 276, "with a job to do", "lab big muted", "middle", { opacity: jo });
      IB_ORGANS.forEach(function (g, n) {
        var b = bump(t, cJob == null ? null : cJob + n * 0.14, 0.85) * first;
        if (b > 0) out += C(ibFX(g.at[0]), ibFY(g.at[1]), 15 + 13 * b, "none", P.gold, 4, { opacity: b });
      });
    }

    /* beat 1: the eyes cannot see in */
    var second = ibOnly(t, scene, 1);
    if (second > 0.01) {
      out += ibNoLook(760, 172, 150, on(t, cCannot, 0.45) * second * (1 - on(t, cWhere, 0.4)));
      /* the arrow ends at the near edge of the body's own card (its right side
         is at IB_FIG.x + IB_FIG.w + 14), so "here is where they sit" points at
         the body and not at the gap beside it. */
      var wo = on(t, cWhere, 0.45) * second;
      if (wo > 0) out += MK.arrow(648, 292, IB_FIG.x + IB_FIG.w + 26, 252, wo, P.gold, 9) +
        MK.pill(800, 292, "here they are", wo, { size: 30, col: P.gold });
    }

    /* beats 2 and 3: the five, each with the lesson's own picture and a line */
    IB_ROWS.forEach(function (r) {
      var g = ibOrgan(r.id), o = popIn(t, named[r.id], 0.45);
      if (!(o > 0)) return;
      out += MK.leader(IB_ROW_X, r.y, ibAt(r.id)[0], ibAt(r.id)[1], on(t, sits[r.id], 0.6), ring[r.id] > 0.5 ? P.gold : P.muted);
      out += MK.pop(MK.pic(IB_ROW_PIC, r.y, 52, g.pic), IB_ROW_PIC, r.y, o);
      out += MK.pill(IB_ROW_PILL, r.y, g.label, Math.min(1, o), { size: 30, anchor: "start", col: ring[r.id] > 0.5 ? P.gold : P.line });
    });
    return svg(out);
  }


  /* ==== Grade 4 Science, Lesson 2: Backbone or Not? ===========================
     tools/lib/film-scenes/science-g4/backbone-or-not.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/backbone-or-not.json.

     The lesson's own drawings come from ART, so the film draws a skeleton and
     an insect exactly as the course draws them, not an invented one: the
     "Tap the part" figure that belongs to Lesson 1, Bones and Muscles
     (ART.figure("skeleton"), whose spine really is a chain of twelve small
     bones), and the Stage 3 beetle seen from above (ART.figure("insect"),
     whose six legs and their joints are drawn). Lesson 2 itself has no
     figure, sim or scene step of its own - nothing in it is ever tapped - so
     these are drawn because they are the course's own pictures of a skeleton
     and an insect, the ones this grade's child has already met, not because
     anything here leads to a tap. And the kit's own icons for the pictures no
     emoji draws on a school device: the worm, the jellyfish, the woodlouse,
     the beetle and the rock.

     The animals are the lesson's own: the five of the lecture's first part,
     the four of its second, the ten of the backbone sort and the minibeasts
     of its key.

     Every top-level name here starts with bn, so nothing can replace a name of
     the engine, ART or MK. Nothing here is a function of anything but t. */

  var HUE = {
    title: P.teal, vert: P.blue, invert: P.plum, exo: P.gold,
    key: P.accent, sort: P.good, lookup: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function bnOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function bnFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- a backbone ------------------------------------------------------------
     The lesson's spine is twelve small bones in a chain (FIGURES.skeleton draws
     twelve 16 x 10 rects, 14 apart, in #E9E4D6). Drawn here along any line, so
     the same chain of small bones can lie along an animal's back or stand on
     its own, big, beside the figure it came from. `u` is how much of the chain
     has arrived, 0 to 1; a bone is wider across the chain than along it,
     exactly as the lesson draws one. */
  var BN_BONE = "#E9E4D6", BN_BONE_EDGE = "#A79C82";
  function bnSpine(pts, n, u, size, o, col) {
    if (!(u > 0) || (o != null && !(o > 0))) return "";
    var len = polyLen(pts), out = "", shown = n * clamp(u, 0, 1);
    for (var k = 0; k < n; k++) {
      var p = clamp(shown - k, 0, 1);
      if (p <= 0) break;
      var at = polyAt(pts, len * (k + 0.5) / n), s = at[2];
      var ang = Math.atan2(pts[s + 1][1] - pts[s][1], pts[s + 1][0] - pts[s][0]) * 180 / Math.PI;
      out += G(R(-size * 0.31, -size * 0.5, size * 0.62, size, size * 0.2, col || BN_BONE, BN_BONE_EDGE, Math.max(1, size * 0.07)),
        { transform: "translate(" + n2(at[0]) + "," + n2(at[1]) + ") rotate(" + n2(ang) + ") scale(" + n3(0.6 + 0.4 * p) + ")", opacity: p });
    }
    return o == null ? out : G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the same chain as an outline only: where a backbone WOULD be, and is not */
  function bnGhostSpine(pts, n, u, size, o) {
    if (!(u > 0) || !(o > 0)) return "";
    var len = polyLen(pts), out = "", shown = n * clamp(u, 0, 1);
    for (var k = 0; k < n; k++) {
      var p = clamp(shown - k, 0, 1);
      if (p <= 0) break;
      var at = polyAt(pts, len * (k + 0.5) / n), s = at[2];
      var ang = Math.atan2(pts[s + 1][1] - pts[s][1], pts[s + 1][0] - pts[s][0]) * 180 / Math.PI;
      out += G(R(-size * 0.31, -size * 0.5, size * 0.62, size, size * 0.2, "none", P.muted, Math.max(1.5, size * 0.09), { "stroke-dasharray": "5 4" }),
        { transform: "translate(" + n2(at[0]) + "," + n2(at[1]) + ") rotate(" + n2(ang) + ")", opacity: p * 0.9 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* ---- small marks the chapters share ------------------------------------------ */

  /* a card behind one of the lesson's light drawings, with room around it */
  function bnCard(x, y, w, h, o) {
    return R(x, y, w, h, 20, P.card, P.line, 2, o == null ? null : { opacity: clamp(o, 0, 1) });
  }
  /* a soft body: the shape the lesson's bones sit inside, in the kit's own skin
     colour (#C68642, its body figure), drawn in the skeleton figure's own
     coordinates so it lands on the bones */
  function bnSoftBody(o) {
    if (!(o > 0)) return "";
    var s = "#C68642";
    return G(C(130, 50, 46, s) +
      Pth("M84,108 Q74,200 90,300 L170,300 Q186,200 176,108 Z", s) +
      L(94, 118, 58, 250, s, 32) + L(166, 118, 202, 250, s, 32) +
      L(110, 292, 100, 404, s, 36) + L(150, 292, 160, 404, s, 36),
      { opacity: clamp(o, 0, 1) * 0.26 });
  }

  /* a slug: no emoji draws one, and the snail is a different animal in this
     lesson, so the film draws it - a soft body, two eye stalks, no shell */
  function bnSlug(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var body = "#9A8362", dark = "#7A664A";
    return G(Pth("M-0.62,0.20 Q-0.70,-0.16 -0.42,-0.20 Q-0.10,-0.26 0.16,-0.24 Q0.56,-0.22 0.62,0.02 Q0.66,0.20 0.30,0.22 L-0.50,0.22 Z", body, dark, 0.035) +
      Pth("M-0.42,-0.20 Q-0.24,-0.34 -0.10,-0.22", null, dark, 0.03) +
      L(-0.56, -0.16, -0.70, -0.40, dark, 0.045) + L(-0.44, -0.20, -0.52, -0.44, dark, 0.045) +
      C(-0.70, -0.42, 0.045, "#3A2A1A") + C(-0.52, -0.46, 0.045, "#3A2A1A") +
      R(-0.60, 0.20, 1.14, 0.06, 0.03, dark),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ============================================================
     The lesson's own skeleton in a round window, with the worm and the beetle
     at its feet: the film's three answers to "backbone or not". In the spoken
     title chapter the skeleton arrives on "a skeleton like yours", its spine
     lights on "a backbone", the worm comes in crossed on "some have none", and
     the beetle in its case on "a skeleton outside". On the two cards all three
     simply stand. */
  var BN_SKEL_REST = ["skull", "jaw", "ribcage", "hip", "armbones", "legbones"];
  function bnMotifSkeleton(t, o) {
    var fig = ART.figure("skeleton");
    if (!o.scene) return fig;
    var back = sc(o.scene, 1, "backbone");
    if (back == null || t < back) return fig;
    BN_SKEL_REST.forEach(function (p) { fig = ART.dim(fig, p, 0.35); });
    return ART.ring(fig, "spine", "#F4C95D", 7);
  }
  function titleMotif(o) {
    var t = o.t || 0, out = "", S = o.scene;
    var skAt = S ? sc(S, 0, "skeleton") : null, backAt = S ? sc(S, 1, "backbone") : null;
    var noneAt = S ? sc(S, 1, "none") : null, outAt = S ? sc(S, 1, "outside") : null;
    var figO = S ? on(t, skAt, 0.7) : 1;
    var wo = S ? popIn(t, noneAt, 0.4) : 1, bo = S ? popIn(t, outAt, 0.4) : 1;
    out += el("clipPath", { id: "bnMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 150, 118, P.gold, S ? on(t, backAt, 0.6) * (0.6 + 0.4 * breathe(t)) : 0.4);
    out += G(ART.place(bnMotifSkeleton(t, o), 93, 36, 174, 281), { "clip-path": "url(#bnMotifClip)", opacity: figO });
    out += MK.pop(MK.pic(64, 266, 58, "\u{1FAB1}"), 64, 266, wo);
    if (wo > 0) out += MK.cross(40, 226, 15, Math.min(1, wo));
    /* the kit's beetle is drawn in near-black on a near-black stage, so it
       stands on a light plate of its own, as the lesson's pages give it */
    out += MK.pop(C(296, 266, 38, "#EAF0F4") + MK.pic(296, 266, 58, ART.ICONS.beetle), 296, 266, bo);
    if (bo > 0) out += E(296, 266, 36, 32, "none", P.gold, 4, { opacity: Math.min(1, bo) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A human skeleton with its spine lit, a worm with no backbone, and a beetle wearing its skeleton outside">' + out + "</svg>";
  }

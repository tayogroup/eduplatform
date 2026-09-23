  /* ==== Grade 2 Science, Lesson 6: Forces Change Things =======================
     tools/lib/film-scenes/science-g2/forces-change-things.js, part 1 of 3
     (-2.js and -3.js follow it in the same scope, after the shared marks MK
     and before the engine's tail). The storyboard is
     science/grade-2-app/lecture-video/forces-change-things.json, and the
     BRIEF.md beside it says how a film is made.

     One chapter per part of LESSON["lecture"] in content/lesson-6.py. Where
     the lesson draws, the film draws the lesson's drawing: the toy car on the
     track marked in steps is ART.sim("pushBall", "draw", x, label, "\u{1F697}"),
     the very drawing the experiment step puts in front of the child, and the
     sponge, the wooden block and the table's three hands are the lesson's own
     pictures. The paperclip is DRAWN rather than taken from the emoji: this
     machine's \u{1F4CE} has a face on it, and the clip has to bend and stay
     bent.

     One colour rule runs through the whole film, and it is the lesson's own
     idea: a FORCE is a gold arrow, wherever it comes from - a kick, a hand,
     the floor rubbing, a wall pushing back.

     Part 1: the palette, the shared helpers, the title motif and the chapter
     "A force changes movement". Every top-level name starts with fc. */

  var HUE = {
    title: P.teal, move: P.gold, bigger: P.accent, graph: P.blue,
    shape: P.plum, cause: P.good, recap: P.teal
  };

  var FC_BALL = "⚽", FC_FOOT = "\u{1F9B6}", FC_HAND = "✋";
  var FC_FORCE = P.gold;

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function fcOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function fcFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* 0 -> 1 between two times, so a move that starts on one cue is finished on
     the next one however long the real voice turns out to make the line */
  function fcSpan(t, from, to, shape) {
    if (from == null || to == null || !(to > from)) return 0;
    var u = clamp((t - from) / (to - from), 0, 1);
    return shape ? shape(u) : u;
  }
  /* 0 -> 1, fast then slowing: a thing pushed once, coming to rest */
  function fcGlide(u) { u = clamp(u, 0, 1); return 1 - (1 - u) * (1 - u); }
  /* 0 -> 1, slow then fast: a thing being pushed along, speeding up */
  function fcSpeedUp(u) { u = clamp(u, 0, 1); return u * u; }
  /* 0 -> 1, still moving when it arrives: a roll that something has to stop */
  function fcRoll(u) { u = clamp(u, 0, 1); return Math.pow(u, 0.8); }

  /* ---- small drawings the film shares ------------------------------------------ */

  /* a football of `size`, turned `spin` degrees about its own centre */
  function fcFootball(cx, cy, size, spin, o) {
    if (o != null && !(o > 0)) return "";
    return Em(cx, cy, size, FC_BALL, {
      transform: "rotate(" + n2(spin || 0) + " " + n2(cx) + " " + n2(cy) + ")",
      opacity: o == null ? null : clamp(o, 0, 1)
    });
  }
  /* how far a ball of that size has turned, in degrees, after rolling d px */
  function fcSpin(d, size) { return d / (size * 0.45) * 57.2958; }

  /* where the ball has been: a dot every sixth of a second of its own past, so
     the dots spread out as it speeds up and bunch as it slows. Pure in t. */
  function fcTrail(t, from, posFn, y, o) {
    if (from == null || t < from || !(o > 0)) return "";
    var here = posFn(t), out = "";
    for (var k = 1; k <= 9; k++) {
      var tk = t - k * 0.16;
      if (tk < from) break;
      var x = posFn(tk);
      if (Math.abs(x - here) < 24) continue;
      out += C(x, y, 6, FC_FORCE, null, null, { opacity: 0.34 * (1 - k / 10) * o });
    }
    return out;
  }

  /* speed lines behind a ball moving to the right (or to the left if back);
     `off` clears the ball itself, so they never draw across it */
  function fcWhoosh(cx, cy, len, o, back, off) {
    if (!(o > 0) || !(len > 0)) return "";
    var d = back ? 1 : -1, out = "", a = off == null ? 58 : off;
    for (var k = 0; k < 3; k++) {
      var yy = cy - 16 + k * 16, l = len * (k === 1 ? 1 : 0.68);
      out += L(cx + d * a, yy, cx + d * (a + l), yy, FC_FORCE, 5, { opacity: 0.8 * o });
    }
    return out;
  }

  /* a clock face whose hand sweeps round: time passing while nothing happens */
  function fcClock(cx, cy, r, t, from, o) {
    if (!(o > 0) || from == null) return "";
    var a = (t - from) * 2.4 - Math.PI / 2;
    return G(C(cx, cy, r, P.card, P.line, 4) +
      L(cx, cy, cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, P.muted, 5) +
      L(cx, cy, cx + Math.cos(a / 12 - Math.PI / 2) * r * 0.44, cy + Math.sin(a / 12 - Math.PI / 2) * r * 0.44, P.muted, 6) +
      C(cx, cy, r * 0.09, P.muted),
      { opacity: clamp(o, 0, 1) });
  }

  /* the little glossary marks of the chapter's last line: what a force did */
  function fcJobMark(kind, cx, cy, o) {
    if (!(o > 0)) return "";
    var g = "";
    if (kind === "start") g = MK.arrow(cx - 52, cy, cx + 2, cy, 1, FC_FORCE, 9) + fcFootball(cx + 36, cy, 44, 0);
    else if (kind === "faster") g = MK.arrow(cx - 88, cy, cx + 6, cy, 1, FC_FORCE, 13) + fcFootball(cx + 42, cy, 44, 70);
    else if (kind === "slow") g = fcFootball(cx - 40, cy, 44, -40) + MK.arrow(cx + 56, cy, cx - 10, cy, 1, FC_FORCE, 9);
    else if (kind === "stop") g = fcFootball(cx - 24, cy, 44, 0) + L(cx + 22, cy - 26, cx + 22, cy + 26, FC_FORCE, 10);
    else g = Pth("M" + n2(cx - 56) + "," + n2(cy + 22) + " L" + n2(cx - 4) + "," + n2(cy + 22) + " L" + n2(cx + 50) + "," + n2(cy - 26),
      null, P.muted, 4, { "stroke-dasharray": "9 7" }) +
      MK.arrow(cx - 4, cy + 58, cx - 4, cy + 32, 1, FC_FORCE, 8) + fcFootball(cx + 44, cy - 20, 44, 40);
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ===============================================================
     The lesson in one picture: a ball on the floor with a gold push behind it
     and a teal pull in front of it, a sponge squashed flat under them, and a
     still ball that waits until a force arrives. In the spoken title each
     happens as it is said; behind the two cards it stands finished. */
  function fcSponge(cx, cy, size, squash, o) {
    if (o != null && !(o > 0)) return "";
    var sx = 1 + 0.6 * squash, sy = 1 - 0.55 * squash;
    return G(MK.pic(cx, cy, size, "\u{1F9FD}"), {
      transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(sx) + "," + n3(sy) + ") translate(" + n2(-cx) + "," + n2(-cy) + ")",
      opacity: o == null ? null : clamp(o, 0, 1)
    });
  }

  function titleMotif(o) {
    var t = o.t || 0, s = o.spoken ? o.scene : null, out = "";
    var pushAt = s ? sc(s, 0, "push") : null, pullAt = s ? sc(s, 0, "pull") : null,
      forceAt = s ? sc(s, 0, "force") : null, movesAt = s ? sc(s, 0, "moves") : null;
    var shapeAt = s ? sc(s, 1, "shape") : null, nothAt = s ? sc(s, 1, "nothing") : null,
      selfAt = s ? sc(s, 1, "itself") : null;

    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "fcMotifClip" }, C(180, 180, 172));

    var inner = "";
    inner += L(28, 172, 332, 172, P.line, 5);
    inner += L(28, 300, 332, 300, P.line, 5);

    /* the ball: pushed from behind, and pulled on a string towards a hand.
       The pull arrow points TOWARDS the hand, which is the lesson's own frame
       ("A pull on a string: it comes towards you", and its word `towards`,
       "Moving nearer to something"). It used to point leftwards INTO the
       ball, which is this film's mark for a push back (fcJobMark "slow"), and
       it lay along the string so the string could not be seen at all. It is
       drawn clear of the string now, and the string shortens as the ball
       comes nearer the hand. */
    var pu = s ? on(t, pushAt, 0.4) : 1, pl = s ? on(t, pullAt, 0.5) : 1;
    var mv = s ? fcGlide((t - (movesAt == null ? 1e9 : movesAt)) / 1.1) : 1;
    var bx = lerp(126, 206, mv), by = 142;
    inner += MK.arrow(bx - 86, by, bx - 38, by, pu, FC_FORCE, 10);
    if (pl > 0) {
      inner += Pth("M" + n2(bx + 28) + "," + n2(by + 4) + " Q" + n2(bx + 96) + "," + n2(by + 30) + " 282," + n2(by + 16),
        null, P.teal, 5, { opacity: pl });
      inner += G(MK.pic(300, by + 18, 42, FC_HAND), { opacity: pl });
      inner += MK.arrow(bx + 38, by - 36, bx + 108, by - 36, pl, P.teal, 10);
    }
    inner += fcFootball(bx, by, 66, fcSpin(bx - 126, 66));
    var fo = s ? bump(t, forceAt, 1.1) : 0;
    if (fo > 0) inner += MK.glow(bx - 62, by, 48, FC_FORCE, fo) + MK.glow(bx + 73, by - 36, 44, P.teal, fo);

    /* the sponge, squashed flat by a push from above */
    var sq = s ? on(t, shapeAt, 0.55) : 1;
    inner += MK.arrow(96, 218, 96, 258, sq, FC_FORCE, 10);
    inner += fcSponge(96, 282, 76, sq, 1);

    /* "nothing by itself": a still ball that waits, and then a force arrives */
    var no = s ? popIn(t, nothAt, 0.4) : 1, se = s ? on(t, selfAt, 0.5) : 1;
    if (no > 0) {
      inner += G(C(252, 278, 38, "none", P.muted, 3, { "stroke-dasharray": "9 8" }) +
        fcFootball(252, 278, 52, 0), { opacity: Math.min(1, no) });
      inner += MK.arrow(186, 278, 218, 278, se, FC_FORCE, 9);
    }

    out += G(inner, { "clip-path": "url(#fcMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A ball pushed from behind and pulled on a string towards a hand, and a sponge squashed flat">' + out + "</svg>";
  }

  /* ==== chapter: a force changes movement =======================================
     The lesson's five demo frames, on one floor seen from above so that the
     turn can be seen as a turn. One ball is kicked, pushed along, pushed back
     and stopped; a second rolls in and is tapped on the side, and its path
     bends where the finger touched it. Each move is anchored between two of
     its own line's cues, so it is finished exactly when the line says it is,
     whatever the real voice does to the timing. The last line lays the five
     jobs out as the marks the film has just drawn. */
  var FC_FLOOR = { x: 20, y: 54, w: 1128, h: 358 }, FC_LANE = 268, FC_BSZ = 84;
  function fcFloor() {
    var s = R(FC_FLOOR.x, FC_FLOOR.y, FC_FLOOR.w, FC_FLOOR.h, 26, "#15324A", P.line, 2);
    for (var k = 1; k < 5; k++)
      s += L(FC_FLOOR.x + 18, FC_FLOOR.y + k * 72, FC_FLOOR.x + FC_FLOOR.w - 18, FC_FLOOR.y + k * 72, P.line, 2, { opacity: 0.5 });
    return s;
  }

  function fcMoveChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cStill = c(0, "still"), cEver = c(0, "ever"), cForce = c(0, "force");
    var cKick = c(1, "kick"), cKForce = c(1, "force"), cHit = c(1, "kick2"), cStart = c(1, "starts");
    var cPush = c(2, "push"), cRolls = c(2, "rolls"), cFast = c(2, "faster");
    var cBack = c(3, "back"), cSlows = c(3, "slows"), cStops = c(3, "stops");
    var cTap = c(4, "tap"), cTurns = c(4, "turns"), cDir = c(4, "direction"), cWay = c(4, "way");
    var cBegin = c(5, "begin"), cFaster2 = c(5, "faster"), cSlow2 = c(5, "slow"), cStop2 = c(5, "stop"), cTurn2 = c(5, "turn");

    var out = fcFloor();
    var toB = into(t, scene.first + 4);          /* ball A gives way to ball B */
    var last = into(t, scene.first + 5);         /* the five jobs take the stage */

    /* ---- ball A: still, kicked, pushed along, pushed back, stopped ---------- */
    /* 250 -> 480 -> 820 -> 950. The far end is where a hand of its own can
       still stand inside the box: an emoji's drawn box is about 1.4 times its
       font size across and 1.8 times it down, which --sweep found the hard way. */
    function ax(tt) {
      return 250 +
        230 * fcSpan(tt, cStart, spokenEnd(scene.first + 1), fcGlide) +
        340 * fcSpan(tt, cPush, spokenEnd(scene.first + 2), fcSpeedUp) +
        130 * fcSpan(tt, cBack, cStops, fcGlide);
    }
    var A = "", bx = ax(t);
    A += fcTrail(t, cStart, ax, FC_LANE, 1);

    /* beat 0: a still ball, time passing, and the force that has not come */
    var b0 = fcOnly(t, scene, 0);
    if (b0 > 0) {
      var so = on(t, cStill, 0.4) * b0;
      A += C(250, FC_LANE, 58 + 6 * bump(t, cStill, 0.9), "none", P.teal, 5, { opacity: so });
      A += MK.pill(254, FC_LANE - 100, "still", so, { size: 30, col: P.teal });
      A += fcClock(478, FC_LANE - 22, 58, t, cEver, on(t, cEver, 0.5) * b0);
      A += MK.qmark(250, FC_LANE + 106, 28, on(t, cForce, 0.4) * b0);
    }

    /* beat 1: the kick */
    var ko = on(t, cKick, 0.35) * fcOnly(t, scene, 1);
    if (ko > 0) {
      var swing = cHit == null ? 0 : ease((t - cHit + 0.4) / 0.5);
      var fx = lerp(70, 104, swing);
      /* the foot is MIRRORED: this machine draws \u{1F9B6} with its toes to the
         left, so unflipped it kicks away from the ball it is about to kick */
      A += G(MK.pic(fx, FC_LANE, 84, FC_FOOT),
        { opacity: ko, transform: "translate(" + n2(2 * fx) + ",0) scale(-1,1)" });
      A += MK.arrow(fx + 46, FC_LANE, 200, FC_LANE, on(t, cKForce, 0.35), FC_FORCE, 11);
      A += MK.pill(254, FC_LANE - 104, "a force", on(t, cKForce, 0.4) * ko, { size: 30, col: FC_FORCE });
    }
    A += MK.ripple(202, FC_LANE, t, cHit, FC_FORCE);

    /* beat 2: pushed along, so it speeds up */
    var po = on(t, cPush, 0.35) * fcOnly(t, scene, 2);
    if (po > 0) {
      A += MK.arrow(bx - 168, FC_LANE, bx - 60, FC_LANE, on(t, cPush, 0.4), FC_FORCE, 13);
      A += MK.pill(bx - 76, FC_LANE - 104, "speeds up", on(t, cFast, 0.4) * po, { size: 30, col: FC_FORCE });
    }

    /* beat 3: pushed back, so it slows and stops */
    var ho = on(t, cBack, 0.35) * fcOnly(t, scene, 3);
    if (ho > 0) {
      A += G(MK.pic(bx + 130, FC_LANE, 86, FC_HAND), { opacity: ho });
      A += MK.arrow(bx + 96, FC_LANE, bx + 56, FC_LANE, on(t, cBack, 0.4), FC_FORCE, 13);
      A += MK.pill(bx - 30, FC_LANE - 104, "slows down", on(t, cSlows, 0.4) * ho * (1 - on(t, cStops, 0.5)), { size: 30, col: FC_FORCE });
      A += MK.pill(bx - 30, FC_LANE - 104, "stops", on(t, cStops, 0.4) * ho, { size: 30, col: P.teal });
    }
    A += fcFootball(bx, FC_LANE, FC_BSZ, fcSpin(bx - 250, FC_BSZ));
    out += G(A, { opacity: 1 - toB });

    /* ---- ball B: tapped on the side, so it turns ---------------------------- */
    /* ball B leaves slowly, so the stage is never bare while the last line
       waits for its first word */
    var showB = toB * (1 - inAt(t, BEATS[scene.first + 5].start + 0.1, 1.1));
    if (showB > 0) {
      var B = "", TAPX = 548, ENDX = 1020, ENDY = 110;
      var goB = BEATS[scene.first + 4].start - GAP + 0.3;
      var arrive = cTurns == null ? goB + 1.2 : cTurns - 0.1;
      var px = lerp(120, TAPX, fcSpan(t, goB, arrive, fcRoll)), py = FC_LANE;
      var turnU = fcSpan(t, cTurns, spokenEnd(scene.first + 4), fcGlide);
      if (turnU > 0) { px = lerp(TAPX, ENDX, turnU); py = lerp(FC_LANE, ENDY, turnU); }
      B += L(120, FC_LANE, Math.min(px, TAPX), FC_LANE, P.muted, 3, { "stroke-dasharray": "11 9", opacity: 0.85 });
      if (turnU > 0) B += L(TAPX, FC_LANE, px, py, FC_FORCE, 3, { "stroke-dasharray": "11 9", opacity: 0.9 });
      var fo2 = on(t, cTap, 0.35) * (1 - on(t, cTurns == null ? null : cTurns + 0.6, 0.5));
      /* the force arrow leans in from the LEFT of the finger. Drawn straight
         up the finger's own x it covered the pointing digit completely and
         all that was left was a gold arrow with a brown lump behind it. */
      B += MK.finger(TAPX + 4, FC_LANE + 62, fo2);
      B += MK.arrow(TAPX - 60, FC_LANE + 112, TAPX - 22, FC_LANE + 36, on(t, cTap == null ? null : cTap + 0.2, 0.35) * (fo2 > 0 ? 1 : 0), FC_FORCE, 10);
      B += MK.ripple(TAPX, FC_LANE + 42, t, cTurns, FC_FORCE);
      B += fcFootball(px, py, FC_BSZ, fcSpin(Math.hypot(px - 120, py - FC_LANE), FC_BSZ));
      B += MK.pill(880, 316, "direction", on(t, cDir, 0.4), { size: 32, col: FC_FORCE });
      B += MK.pill(880, 372, "the way it is going", on(t, cWay, 0.4), { size: 24, col: P.line, ink: P.muted });
      out += G(B, { opacity: showB });
    }

    /* ---- the last line: the five things a force did ------------------------- */
    if (last > 0) {
      var jobs = [
        { k: "start", at: cBegin, x: 148, w: "start" },
        { k: "faster", at: cFaster2, x: 388, w: "speed up" },
        { k: "slow", at: cSlow2, x: 632, w: "slow" },
        { k: "stop", at: cStop2, x: 832, w: "stop" },
        { k: "turn", at: cTurn2, x: 1024, w: "turn" }
      ];
      var J = "";
      jobs.forEach(function (j) {
        var p = Math.min(1, popIn(t, j.at, 0.38));
        J += fcJobMark(j.k, j.x, 194, p);
        J += MK.pill(j.x, 318, j.w, p, { size: 32, col: FC_FORCE });
      });
      out += G(J, { opacity: last });
    }
    return svg(out);
  }

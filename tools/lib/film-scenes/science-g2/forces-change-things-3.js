  /* ==== Forces Change Things, part 3 of 3 =====================================
     "A force changes shape", "Nothing changes by itself" and the recap. Same
     scope as parts 1 and 2.

     The three things are the lesson's own shape test: a sponge, a metal
     paperclip and a wooden block, squashed and bent by a hand. The sponge and
     the block are the lesson's pictures (the block is the kit's own drawing,
     which is what ART.icon gives for \u{1FAB5}); the sponge is squashed with
     the lesson's own transform, scale(1.6, 0.45), and the clip bent with the
     lesson's rotate(-30) skewX(20). The clip itself is DRAWN: this machine's
     paperclip emoji has a face on it. */

  /* The card, and the three heights inside it that everything is hung from:
     the pill above the picture, the picture, then the label and the mark. The
     picture is small enough that the squash and bend arrows fit OUTSIDE it and
     still clear both the pill and the label - the first cut drew the lower
     bend arrow straight across the words "a metal paperclip". */
  var FC_CARD = [40, 424, 808], FC_CW = 320, FC_CY = 36, FC_CH = 300;
  var FC_PILLY = 66, FC_PICY = 170, FC_LABY = 276, FC_MARKY = 314;
  var FC_ROWS_SHAPE = [
    { label: "a sponge" }, { label: "a metal paperclip" }, { label: "a wooden block" }
  ];
  function fcCardCx(k) { return FC_CARD[k] + FC_CW / 2; }

  /* the metal paperclip, bent by bend (0 -> 1) with the lesson's own transform */
  function fcClip(cx, cy, s, bend, o) {
    if (!(o > 0)) return "";
    var d = "M5,-20 L5,22 Q5,35 -4,35 Q-14,35 -14,22 L-14,-26 Q-14,-41 0,-41 Q14,-41 14,-26 L14,26";
    return G(Pth(d, null, "#CBD6E0", 7) + Pth(d, null, "#8FA3B4", 2.4, { opacity: 0.5 }), {
      transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ") rotate(" + n2(-30 * bend) + ") skewX(" + n2(20 * bend) + ")",
      opacity: clamp(o, 0, 1)
    });
  }

  /* two arrows pressing a thing from above and below */
  function fcSquashArrows(cx, cy, reach, u, big) {
    if (!(u > 0)) return "";
    var w = big ? 9 : 5, len = big ? 26 : 18;
    return MK.arrow(cx, cy - reach - len, cx, cy - reach, u, FC_FORCE, w) +
      MK.arrow(cx, cy + reach + len, cx, cy + reach, u, FC_FORCE, w);
  }
  /* two arrows pushing opposite ways, top and bottom: a bend */
  function fcBendArrows(cx, cy, u) {
    if (!(u > 0)) return "";
    return MK.arrow(cx - 20, cy - 64, cx + 46, cy - 64, u, FC_FORCE, 8) +
      MK.arrow(cx + 20, cy + 64, cx - 46, cy + 64, u, FC_FORCE, 8);
  }

  function fcShapeChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cShape = c(0, "shape"), cSquash = c(0, "squash"), cFlat = c(0, "flat");
    var cLet = c(1, "go"), cBack = c(1, "back");
    var cBend = c(2, "bend"), cChanges = c(2, "changes"), cStays = c(2, "stays");
    var cTry = c(3, "try"), cNothing = c(3, "nothing"), cSmall = c(3, "small");
    var cShape2 = c(4, "shape"), cMove = c(4, "movement");

    var k1 = into(t, scene.first + 2), k2 = into(t, scene.first + 3), k3 = into(t, scene.first + 4);
    var live = [1 - k1, k1 * (1 - k2), k2 * (1 - k3)];
    var out = "";

    /* the three cards, the one being talked about bright and the rest dimmed */
    FC_ROWS_SHAPE.forEach(function (th, k) {
      var lit = Math.max(live[k], k3);
      var o = 0.38 + 0.62 * lit;
      var cx = fcCardCx(k);
      out += G(R(FC_CARD[k], FC_CY, FC_CW, FC_CH, 22, lit > 0.5 ? "#1B3A52" : P.card, lit > 0.5 ? P.plum : P.line, lit > 0.5 ? 3 : 2) +
        Tx(cx, FC_LABY, th.label, "lab big", "middle"), { opacity: o });
    });

    /* the sponge: squashed flat, and springing back */
    var sq = on(t, cSquash, 0.5) * (1 - on(t, cLet, 0.45));
    var spring = on(t, cBack, 0.5);
    var squash = clamp(sq - spring, 0, 1);
    var bounce = 1 + 0.12 * bump(t, cBack, 0.7);
    out += G(fcSquashArrows(fcCardCx(0), FC_PICY, 52 - 24 * squash, on(t, cSquash, 0.4) * (1 - on(t, cLet, 0.4)), true), { opacity: 0.38 + 0.62 * Math.max(live[0], k3) });
    out += G(G(fcSponge(fcCardCx(0), FC_PICY, 92, squash, 1), { transform: around(fcCardCx(0), FC_PICY, bounce) }), { opacity: 0.38 + 0.62 * Math.max(live[0], k3) });
    out += MK.pill(fcCardCx(0), FC_PILLY, "flat", on(t, cFlat, 0.4) * live[0] * (1 - spring), { size: 24, col: FC_FORCE });
    out += MK.tick(fcCardCx(0), FC_MARKY, 22, popIn(t, cBack == null ? null : cBack + 0.5, 0.35));

    /* the paperclip: bent, and it stays bent */
    var bend = on(t, cBend == null ? null : cBend + 0.15, 0.7);
    out += G(fcBendArrows(fcCardCx(1), FC_PICY, on(t, cBend, 0.4) * (1 - on(t, cStays, 0.45))), { opacity: 0.38 + 0.62 * Math.max(live[1], k3) });
    /* the clip it WAS, faint behind the clip it is: the lesson's own bend is a
       rotate and a skew, which on its own reads as a paperclip merely tilted.
       The ghost is what makes "it changes shape" something a child can see. */
    out += G(fcClip(fcCardCx(1), FC_PICY, 1.3, 0, 0.3 * Math.min(1, bend * 2)) +
      fcClip(fcCardCx(1), FC_PICY, 1.3, bend, 1), { opacity: 0.38 + 0.62 * Math.max(live[1], k3) });
    out += MK.pill(fcCardCx(1), FC_PILLY, "stays bent", on(t, cStays, 0.4) * live[1], { size: 24, col: FC_FORCE });
    out += MK.tick(fcCardCx(1), FC_MARKY, 22, popIn(t, cChanges == null ? null : cChanges + 0.3, 0.35));

    /* the wooden block: a push too small to change it */
    out += G(fcSquashArrows(fcCardCx(2), FC_PICY, 54, on(t, cTry, 0.4) * (1 - on(t, cSmall == null ? null : cSmall + 0.7, 0.5)), false), { opacity: 0.38 + 0.62 * Math.max(live[2], k3) });
    out += G(MK.pic(fcCardCx(2), FC_PICY, 96, "\u{1FAB5}"), { opacity: 0.38 + 0.62 * Math.max(live[2], k3) });
    out += MK.pill(fcCardCx(2), FC_PILLY, "push too small", on(t, cSmall, 0.4) * live[2], { size: 22, col: FC_FORCE });
    out += MK.cross(fcCardCx(2), FC_MARKY, 22, popIn(t, cNothing == null ? null : cNothing + 0.3, 0.35));

    /* the last line: shape, and movement too */
    var mo = on(t, cMove, 0.5);
    if (mo > 0) {
      out += MK.arrow(496, 388, 586, 388, mo, FC_FORCE, 12);
      out += fcFootball(638, 388, 56, fcSpin(80 * mo, 56), mo);
    }
    var so = bump(t, cShape2, 1.2);
    if (so > 0) {
      out += C(fcCardCx(0), FC_MARKY, 30, "none", P.good, 4, { opacity: so });
      out += C(fcCardCx(1), FC_MARKY, 30, "none", P.good, 4, { opacity: so });
    }
    return svg(out);
  }

  /* ==== chapter: nothing changes by itself =====================================
     The lesson's own last demo, seen from the side: the ball rolls, the floor
     rubs against it all the way along, and the wall stops it. Then the three
     changes the objective names, each with the one cause under them. */
  var FC_GROUND = 372, FC_WALL = 1048;
  function fcWall(o) {
    if (!(o > 0)) return "";
    var s = R(FC_WALL, 166, 66, FC_GROUND - 166, 5, "#A2533C", "#7B3E2C", 3), y;
    for (var r = 0; r < 6; r++) {
      y = 166 + 34 + r * 34;
      if (y < FC_GROUND) s += L(FC_WALL + 2, y, FC_WALL + 64, y, "#7B3E2C", 3);
      s += L(FC_WALL + (r % 2 ? 22 : 44), y - 34, FC_WALL + (r % 2 ? 22 : 44), Math.min(y, FC_GROUND), "#7B3E2C", 3);
    }
    return G(s, { opacity: clamp(o, 0, 1) });
  }
  /* the rubbing between the floor and the ball.
     ONE unbroken saw-tooth from fromX to toX, so it reads as a rough floor the
     ball is rubbing along. Separate three-stroke marks spaced out along it read
     as a row of the letter N, which is what the first cut drew. */
  function fcRub(fromX, toX, u) {
    if (!(u > 0) || !(toX > fromX + 14)) return "";
    var end = fromX + (toX - fromX) * clamp(u, 0, 1), step = 13;
    var d = "M" + n2(fromX) + "," + n2(FC_GROUND - 3), x = fromX, up = true;
    while (x < end - 0.5) {
      x = Math.min(x + step, end);
      d += " L" + n2(x) + "," + n2(FC_GROUND - (up ? 14 : 3));
      up = !up;
    }
    return Pth(d, null, FC_FORCE, 3.4, { opacity: 0.9 });
  }

  /* One of the three changes the objective names. The empty card is drawn from
     the start of the beat and only its CONTENTS wait for their cue, so the
     stage is never bare while the line gets to its first word. */
  function fcMiniPanel(x, kind, word, p, pulse) {
    var y = 74, w = 340, h = 236, cx = x + w / 2, fy = y + 168, g = "";
    var card = R(x, y, w, h, 20, P.card, P.line, 2) + L(x + 24, fy, x + w - 24, fy, P.line, 4);
    if (!(p > 0)) return card;
    var aw = 8 * (1 + 0.35 * clamp(pulse || 0, 0, 1));
    if (kind === "faster") {
      g += fcFootball(x + 232, fy - 34, 62, 90);
      g += MK.arrow(x + 54, fy - 34, x + 172, fy - 34, 1, FC_FORCE, aw);
    } else if (kind === "slower") {
      g += fcFootball(x + 122, fy - 34, 62, -50);
      g += MK.arrow(x + 288, fy - 34, x + 182, fy - 34, 1, FC_FORCE, aw);
    } else {
      g += Pth("M" + n2(x + 44) + "," + n2(fy - 50) + " L" + n2(x + 160) + "," + n2(fy - 50) + " L" + n2(x + 284) + "," + n2(fy - 122),
        null, P.muted, 3.5, { "stroke-dasharray": "10 8" });
      g += MK.arrow(x + 160, fy - 6, x + 160, fy - 34, 1, FC_FORCE, aw);
      g += fcFootball(x + 272, fy - 114, 62, 40);
    }
    g += Tx(cx, y + 222, word, "lab big", "middle");
    return card + MK.pop(g, cx, y + h / 2, p);
  }

  function fcCauseChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRolling = c(0, "rolling"), cSlow = c(0, "slow"), cGo = c(0, "go");
    var cFloor = c(1, "floor"), cAlong = c(1, "along"), cRubbing = c(1, "rubbing"), cFriction = c(1, "friction");
    var cWall = c(2, "wall"), cBack = c(2, "back");
    var cFast = c(3, "faster"), cSlower = c(3, "slower"), cTurns = c(3, "turns"), cCause = c(3, "cause");

    var last = into(t, scene.first + 3);
    var out = "";

    if (last < 1) {
      var A = "";
      var start = BEATS[scene.first].start + 0.5;
      var stop = cWall == null ? start + 9 : Math.max(cWall, start + 1);
      var px = lerp(150, 1004, fcRoll((t - start) / (stop - start)));
      var py = FC_GROUND - FC_BSZ / 2;

      A += R(20, 106, 1128, 292, 26, "#15324A", P.line, 2);
      A += R(40, FC_GROUND, 1088, 16, 8, "#6B4A2B");
      A += fcWall(1);
      /* "the floor rubs against it": the floor lights, and the rubbing shows */
      var fl = bump(t, cFloor, 1.3);
      if (fl > 0) A += R(40, FC_GROUND - 3, 1088, 22, 10, "none", FC_FORCE, 4, { opacity: fl });
      A += fcRub(180, Math.min(px - 46, 986), on(t, cAlong, 1.1));
      /* the ball, and where it has been */
      A += fcTrail(t, start, function (tt) { return lerp(150, 1004, fcRoll((tt - start) / (stop - start))); }, py, 1);
      A += fcFootball(px, py, FC_BSZ, fcSpin(px - 150, FC_BSZ));
      A += C(px, py, 56 + 6 * bump(t, cRolling, 0.9), "none", P.teal, 5, { opacity: on(t, cRolling, 0.4) * fcOnly(t, scene, 0) });
      A += fcWhoosh(px, py, 62 * (1 - 0.85 * clamp(on(t, cSlow, 1.3), 0, 1)), on(t, cRolling, 0.4) * fcOnly(t, scene, 0), false);
      /* "it does not run out of go": the thought the lesson says children have */
      var gb = on(t, cGo, 0.5) * fcOnly(t, scene, 0);
      if (gb > 0) {
        var bx = clamp(px, 210, 900);
        A += MK.bubble(bx - 172, 130, 344, 92, "ran out of go", gb, bx, py - 52);
        A += MK.cross(bx + 162, 138, 30, Math.min(1, popIn(t, cGo == null ? null : cGo + 0.45, 0.4)));
      }
      /* "that rubbing is a force called friction": the force pushing back */
      var rb = on(t, cRubbing, 0.45) * (1 - on(t, cBack, 0.5));
      if (rb > 0) {
        A += MK.arrow(px + 10, py - 78, px - 78, py - 78, on(t, cRubbing, 0.45), FC_FORCE, 10);
        A += MK.pill(px - 34, py - 134, "friction", on(t, cFriction, 0.4), { size: 30, col: FC_FORCE });
      }
      /* the wall pushes back */
      var wo = bump(t, cWall, 1.3);
      if (wo > 0) A += R(FC_WALL - 3, 163, 72, FC_GROUND - 160, 7, "none", FC_FORCE, 4, { opacity: wo });
      A += MK.arrow(FC_WALL - 4, py - 78, FC_WALL - 96, py - 78, on(t, cBack, 0.45), FC_FORCE, 11);
      A += MK.ripple(FC_WALL - 6, py, t, cBack, FC_FORCE);
      out += G(A, { opacity: 1 - last });
    }

    if (last > 0) {
      var B = "";
      var pulse = bump(t, cCause, 1.4);
      B += fcMiniPanel(40, "faster", "speeds up", Math.min(1, popIn(t, cFast, 0.4)), pulse);
      B += fcMiniPanel(414, "slower", "slows down", Math.min(1, popIn(t, cSlower, 0.4)), pulse);
      B += fcMiniPanel(788, "turn", "turns", Math.min(1, popIn(t, cTurns, 0.4)), pulse);
      var co = on(t, cCause, 0.5);
      if (co > 0) {
        B += MK.leader(584, 388, 210, 316, co, FC_FORCE);
        B += MK.leader(584, 388, 584, 316, co, FC_FORCE);
        B += MK.leader(584, 388, 958, 316, co, FC_FORCE);
        B += MK.pill(584, 412, "a force", co, { size: 30, col: FC_FORCE });
      }
      out += G(B, { opacity: last });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------ */
  var FC_RECAP = MK.recapKind([
    /* the card says "a push or a pull", so it draws both: the gold push behind
       the ball, and the teal pull on a string towards a hand. It used to draw
       the push alone. */
    { beat: 0, at: "force", title: "A force", sub: "a push or a pull",
      pic: function (cx, cy, size) {
        var bx = cx - size * 0.3;
        return MK.arrow(bx - size * 0.86, cy, bx - size * 0.46, cy, 1, FC_FORCE, size * 0.15) +
          fcFootball(bx, cy, size * 0.78, 30) +
          Pth("M" + n2(bx + size * 0.4) + "," + n2(cy + size * 0.08) +
            " Q" + n2(bx + size * 0.88) + "," + n2(cy + size * 0.34) +
            " " + n2(bx + size * 1.22) + "," + n2(cy + size * 0.2), null, P.teal, Math.max(3, size * 0.06)) +
          MK.pic(bx + size * 1.5, cy + size * 0.16, size * 0.55, FC_HAND) +
          MK.arrow(bx + size * 0.46, cy - size * 0.44, bx + size * 1.08, cy - size * 0.44, 1, P.teal, size * 0.15);
      } },
    { beat: 1, at: "bigger", title: "Bigger push", sub: "a bigger move, and the graph shows it",
      pic: function (cx, cy, size) {
        var w = size * 0.2, base = cy + size * 0.46, g = L(cx - size * 0.56, base + 4, cx + size * 0.56, base + 4, P.ink, 3);
        [0.34, 0.64, 0.96].forEach(function (h, k) {
          g += R(cx - size * 0.46 + k * size * 0.34, base - size * h, w, size * h, 4, P.teal);
        });
        return g;
      } },
    { beat: 2, at: "shape", title: "Changes shape", sub: "squash a sponge and it goes flat",
      pic: function (cx, cy, size) { return fcSponge(cx, cy, size * 0.86, 0.72, 1); } },
    { beat: 3, at: "nothing", title: "Nothing by itself", sub: "ask what made it change",
      pic: function (cx, cy, size) {
        return fcFootball(cx - size * 0.2, cy, size * 0.8, 0) + MK.qmark(cx + size * 0.44, cy - size * 0.3, size * 0.22, 1);
      } }
  ], { goBeat: 3, goAt: "ask" });

  var KINDS = {
    title: MK.titleKind({ sub: ["A push or a pull is a force", "Bigger push, further roll", "Nothing changes by itself"] }),
    move: fcMoveChapter, bigger: fcBiggerChapter, graph: fcGraphChapter,
    shape: fcShapeChapter, cause: fcCauseChapter, recap: FC_RECAP
  };

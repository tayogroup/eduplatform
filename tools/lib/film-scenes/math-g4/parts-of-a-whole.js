  /* ==== Grade 4 Mathematics, Lesson 4: Parts of a Whole ======================
     tools/lib/film-scenes/math-g4/parts-of-a-whole.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/parts-of-a-whole.json.

     EVERY DIVISION HERE IS EQUAL BY CONSTRUCTION, which is the whole of this
     lesson: a shape cut into fifths whose pieces differ teaches the very
     misconception the lesson exists to correct, and nothing downstream can
     see it. So the bars are ART.fraction, which cuts its bar into cells of
     exactly bw / parts and its circle into wedges of exactly 360 / parts; the
     loose pieces this file draws itself are widths of the SAME inner width
     divided by 2, 4 and 8 in arithmetic; the hundred square is ART.grid at
     10 by 10, split at 5 and 5; and wherever two bars are compared they are
     the same drawing placed at the same x and the same width, so 1/2, 2/4 and
     4/8 shade the same number of pixels.

     Mathematics has no lesson kit, so the pictures come from ART
     (tools/lib/ehel-film-art-math.page.js) and from the lesson page's own
     numbers: one bar cut into 2, 4 and 8 (step 4); 3 cakes shared between 4
     children (step 5); one fifth of 20 counters (step 6); one half, two
     quarters and four eighths (step 8); 25 of 100 squares (step 9); three
     quarters against five eighths (step 10).

     This file: the palette, the shared small drawings, the title motif and
     the chapter "More parts, smaller parts". Every top-level name starts with
     pw, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, more: P.gold, divide: P.accent, amount: P.blue,
    equiv: P.plum, percent: P.good, compare: P.gold, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function pwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function pwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the shared drawings ------------------------------------------------ */

  /* ART.fraction's bar card is 440 x 148 with label: false, its bar inset by
     22 all round: this is that card's geometry once it is placed in the film's
     space, so a mark can sit exactly on a cut. */
  function pwBox(x, y, w) {
    var s = w / 440;
    return { s: s, x: x + 22 * s, y: y + 22 * s, w: 396 * s, h: 104 * s, bot: y + 126 * s, card: y + 148 * s };
  }
  /* one bar, cut into `parts` equal cells, the first `shaded` of them filled */
  function pwBar(parts, shaded, x, y, w, col) {
    return ART.place(ART.fraction({ shape: "bar", parts: parts, shaded: shaded, label: false, colour: col || "teal" }),
      x, y, w, w * 148 / 440);
  }
  /* the same card, uncut: one whole */
  function pwWhole(x, y, w) {
    var b = pwBox(x, y, w), s = b.s;
    return R(x + s, y + s, w - 2 * s, 148 * s - 2 * s, 20 * s, ART.C.card, ART.C.line, 2 * s) +
      R(b.x, b.y, b.w, b.h, 8 * s, ART.C.cell) +
      R(b.x, b.y, b.w, b.h, 8 * s, "none", ART.C.ink, 3.5 * s);
  }
  /* a fraction written the way a child writes it, centred on (cx, cy) */
  function pwGlyph(cx, cy, a, b, size, col, o) {
    if (!(o > 0)) return "";
    return G(Tx(cx, cy - size * 0.30, String(a), "lab", "middle", { "font-size": size, fill: col }) +
      L(cx - size * 0.40, cy, cx + size * 0.40, cy, col, Math.max(2.5, size * 0.09)) +
      Tx(cx, cy + size * 0.92, String(b), "lab", "middle", { "font-size": size, fill: col }),
      { opacity: clamp(o, 0, 1) });
  }
  /* one loose piece of a bar: a rounded block in the bar's own colours */
  function pwPiece(x, y, w, h, o, col, lit) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 8, col || ART.C.teal) +
      R(x, y, w, h, 8, "none", lit ? P.gold : ART.C.ink, lit ? 5 : 3),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ======================================================
     Three eighths of a circle: the lesson's own signature fraction, and the one
     the child folds a paper circle to find. The eight wedges are ART's, so they
     are exactly 360 / 8 each. */
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var cutAt = o.scene ? sc(o.scene, 0, "cut") : null;
    var eqAt = o.scene ? sc(o.scene, 0, "equal") : null;
    var frAt = o.scene ? sc(o.scene, 0, "frac") : null;
    var cx = 180, cy = 135, r = 90;

    out += C(180, 176, 170, "#123247");
    out += MK.glow(cx, cy, 138, P.teal, 0.5 + 0.3 * (o.scene ? on(t, eqAt, 0.8) : 1));
    out += ART.place(ART.fraction({ shape: "circle", parts: 8, shaded: 3, label: false, colour: "teal" }), 50, 22, 260, 225);
    /* "Cut a whole": eight short gold cuts flick out along the eight radii */
    var cutU = o.scene ? bump(t, cutAt, 1.1) : 0;
    if (cutU > 0) {
      for (var k = 0; k < 8; k++) {
        var a = (k / 8) * Math.PI * 2 - Math.PI / 2;
        out += L(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2,
          cx + Math.cos(a) * r * (1.02 + 0.12 * cutU), cy + Math.sin(a) * r * (1.02 + 0.12 * cutU),
          P.gold, 5, { opacity: cutU });
      }
    }
    /* "equal parts": the rim rings gold */
    var eq = o.scene ? on(t, eqAt, 0.6) : 0;
    if (eq > 0) out += C(cx, cy, r + 5, "none", P.gold, 5, { opacity: eq });
    out += C(180, 176, 170, "none", P.line, 3);
    /* One slot under the circle, and one thing in it at a time. On the first
       line it holds the lesson's own fraction, three eighths; on the second it
       shows, in turn, the three things the film goes on to do. */
    var b1 = o.scene && o.scene.beats.length > 1 ? into(t, o.scene.first + 1) : 0;
    out += pwGlyph(cx, 296, 3, 8, 44, P.gold, (o.scene ? popIn(t, frAt, 0.4) : 1) * (1 - b1));
    if (o.scene && b1 > 0) {
      var cmpAt = sc(o.scene, 1, "compare"), shAt = sc(o.scene, 1, "share"), pcAt = sc(o.scene, 1, "pct");
      var showCmp = on(t, cmpAt, 0.35) * (1 - on(t, shAt, 0.35));
      var showSh = on(t, shAt, 0.35) * (1 - on(t, pcAt, 0.35));
      var showPc = on(t, pcAt, 0.35);
      if (showCmp > 0) out += Tx(cx, 306, ">", "lab", "middle", { "font-size": 60, fill: P.gold, opacity: showCmp });
      if (showSh > 0) {
        var sh = "";
        for (var g = 0; g < 2; g++) {
          var gx = cx - 46 + g * 92;
          sh += R(gx - 32, 262, 64, 58, 12, "none", P.gold, 3);
          sh += C(gx - 14, 280, 8, P.gold) + C(gx + 14, 280, 8, P.gold) + C(gx, 302, 8, P.gold);
        }
        out += G(sh, { opacity: showSh });
      }
      if (showPc > 0) out += Tx(cx, 308, "%", "lab", "middle", { "font-size": 58, fill: P.gold, opacity: showPc });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circle cut into eight equal parts, three of them shaded: three eighths">' + out + "</svg>";
  }

  /* ==== chapter: more parts, smaller parts ===================================
     One whole bar across the top, cut into 2, then 4, then 8 - the lesson's own
     slider, at the three sizes it names. Underneath, "every size you have
     tried, one part of each": one half, one quarter and one eighth of the SAME
     whole, drawn to the same scale, so the shrinking is a length and not a
     claim. Their widths are the bar's own inner width divided by 2, 4 and 8. */
  var PW_M = { x: 214, y: 10, w: 740 };
  var PW_MB = pwBox(PW_M.x, PW_M.y, PW_M.w);                 /* the bar's box */
  var PW_PY = 296, PW_PH = 52, PW_LY = 388;                  /* the pieces row */
  var PW_PIECES = (function () {
    var wid = [PW_MB.w / 2, PW_MB.w / 4, PW_MB.w / 8], gap = 34, tot = 0, k;
    for (k = 0; k < 3; k++) tot += wid[k];
    var x = (1168 - (tot + 2 * gap)) / 2, out = [];
    for (k = 0; k < 3; k++) { out.push({ x: x, w: wid[k], den: [2, 4, 8][k] }); x += wid[k] + gap; }
    return out;
  })();

  function pwMoreChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWhole = c(0, "whole"), cTwo = c(0, "two");
    var cHalf = c(1, "half"), cFour = c(1, "four");
    var cQuarter = c(2, "quarter"), cHalfSize = c(2, "halfsize");
    var cEight = c(3, "eight"), cEighth = c(3, "eighth"), cAgain = c(3, "again");
    var cNever = c(4, "never"), cSmaller = c(4, "smaller");
    var cBottom = c(5, "bottom"), cPiece = c(5, "piece");
    var out = "";

    /* which cut the bar is showing, and how far it has changed into it */
    var steps = [{ at: null, parts: 0 }, { at: cTwo, parts: 2 }, { at: cFour, parts: 4 }, { at: cEight, parts: 8 }];
    var now = 0, k;
    for (k = 1; k < steps.length; k++) if (steps[k].at != null && t >= steps[k].at) now = k;
    var u = now === 0 ? 1 : clamp((t - steps[now].at) / 0.5, 0, 1);
    function bar(n) { return n === 0 ? pwWhole(PW_M.x, PW_M.y, PW_M.w) : pwBar(n, 1, PW_M.x, PW_M.y, PW_M.w); }
    if (u < 1 && now > 0) out += G(bar(steps[now - 1].parts), { opacity: 1 - u });
    out += G(bar(steps[now].parts), { opacity: u });

    /* "one whole bar": the whole bar rings once, before any cut */
    var wo = bump(t, cWhole, 1.2) * (1 - on(t, cTwo, 0.4));
    if (wo > 0) out += R(PW_MB.x - 6, PW_MB.y - 6, PW_MB.w + 12, PW_MB.h + 12, 12, "none", P.gold, 5, { opacity: wo });

    /* "The whole never changes": the same outline again, over the cut bar */
    var nv = on(t, cNever, 0.5) * pwOnly(t, scene, 4);
    if (nv > 0) out += R(PW_MB.x - 6, PW_MB.y - 6, PW_MB.w + 12, PW_MB.h + 12, 12, "none", P.gold, 5,
      { opacity: nv, "stroke-dasharray": "14 10" });

    /* one part of each, appearing as its size is tried */
    var at = [cHalf, cQuarter, cEighth];
    for (k = 0; k < 3; k++) {
      var pc = PW_PIECES[k], o = popIn(t, at[k], 0.42);
      if (!(o > 0)) continue;
      out += G(pwPiece(pc.x, PW_PY, pc.w, PW_PH, 1, ART.C.teal, false),
        { transform: around(pc.x + pc.w / 2, PW_PY + PW_PH / 2, Math.min(1, o)) });
      out += pwGlyph(pc.x + pc.w / 2, PW_LY, 1, pc.den, 28, P.ink, Math.min(1, o));
    }

    /* "half the size of a half": the half piece splits at its own middle, so
       the mark sits exactly one quarter-width in, and the two halves of it are
       each the width of the quarter piece beside it */
    var hs = on(t, cHalfSize, 0.5) * pwOnly(t, scene, 2);
    if (hs > 0) {
      var mid = PW_PIECES[0].x + PW_PIECES[0].w / 2;
      out += L(mid, PW_PY - 10, mid, PW_PY + PW_PH + 10, P.gold, 4, { opacity: hs, "stroke-dasharray": "9 7" });
      /* the left half of the half, and the quarter piece: the same width */
      out += R(PW_PIECES[0].x - 4, PW_PY - 4, PW_PIECES[0].w / 2 + 8, PW_PH + 8, 10, "none", P.gold, 4,
        { opacity: hs, "stroke-dasharray": "10 7" });
      out += R(PW_PIECES[1].x - 4, PW_PY - 4, PW_PIECES[1].w + 8, PW_PH + 8, 10, "none", P.gold, 4,
        { opacity: hs * on(t, cHalfSize == null ? null : cHalfSize + 0.4, 0.4), "stroke-dasharray": "10 7" });
    }

    /* "Smaller again": the eighth piece pulses on its own line */
    var ag = bump(t, cAgain, 1.1);
    if (ag > 0) out += R(PW_PIECES[2].x - 5, PW_PY - 5, PW_PIECES[2].w + 10, PW_PH + 10, 10, "none", P.gold, 4, { opacity: ag });

    /* "smaller parts": an arrow along the tops of the three, left to right */
    var sm = on(t, cSmaller, 0.7) * pwOnly(t, scene, 4);
    if (sm > 0) out += MK.arrow(PW_PIECES[0].x + PW_PIECES[0].w / 2, 276,
      PW_PIECES[2].x + PW_PIECES[2].w / 2, 276, sm, P.gold, 6);

    /* "a bigger bottom number": the 8 underneath the eighth is ringed */
    var bo = on(t, cBottom, 0.45) * pwOnly(t, scene, 5);
    if (bo > 0) out += C(PW_PIECES[2].x + PW_PIECES[2].w / 2, PW_LY + 26, 20, "none", P.gold, 4, { opacity: bo });
    /* "a bigger piece": it is not - the smallest piece is crossed */
    out += MK.cross(PW_PIECES[2].x + PW_PIECES[2].w + 46, PW_PY + PW_PH / 2, 22, popIn(t, cPiece, 0.4));

    return svg(out);
  }

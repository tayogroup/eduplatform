  /* ==== Grade 4 Computing, Lesson 12: Caesar and Pigpen ========================
     tools/lib/film-scenes/computing-g4/caesar-and-pigpen.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/caesar-and-pigpen.json.

     EVERY ENCIPHERED LETTER IN THIS FILM COMES FROM THE LESSON'S OWN RULE.
     Computing has no ART.sim - the Caesar strip and the Pigpen grid are each a
     closure inside the lesson's own cipher() activity and cannot be lifted -
     so the wheel and the grid are drawn here, in the engine's idiom, but every
     letter written on them is computed by calling ART.caesar(text, shift) or
     ART.pigpen(letter), never typed by hand. A cipher this film gets wrong
     would show it wrong on screen, on its own, the moment the lesson's rule
     changed under it.

     This file: the palette, the alphabet wheel (title motif and the Caesar
     chapter), and the letter-box readout used for cat/fdw. Every top-level
     name starts with cp, so nothing here can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, caesar: P.gold, pigpen: P.plum, key: P.accent,
    today: P.blue, roundtrip: P.good, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------ */
  function cpPast(t, at) { return at != null && t >= at; }

  /* ---- the plain alphabet, and the claims this film makes about it --------
     CP_ALPHA is just the 26 letters in order - data, not a cipher rule. Every
     ENCIPHERED value below is computed by ART.caesar, the lesson's own rule
     (computing.js: caesarShift, mirrored in _rules.py), so "cat becomes fdw"
     and "y shifted 3 is b" can never drift from what the lesson's own cipher
     step would produce. */
  var CP_ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
  var CP_SHIFT = 3;
  var CP_CAT = "cat";
  var CP_FDW = ART.caesar(CP_CAT, CP_SHIFT);          /* the lesson's own "fdw" */
  var CP_A_D = ART.caesar("a", CP_SHIFT);             /* the lesson's own "d" */
  var CP_Y_B = ART.caesar("y", CP_SHIFT);             /* the lesson's own "b", wrapping round */
  var CP_BACK = ART.caesar(CP_FDW, -CP_SHIFT);        /* shifted back: the lesson's own "cat" again */

  /* a position on a 26-point ring, letter 0 at the top, clockwise */
  function cpAngPos(cx, cy, r, k) {
    var a = -Math.PI / 2 + k * (2 * Math.PI / 26);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

  /* ---- the alphabet wheel --------------------------------------------------
     Outer ring: the plain alphabet, fixed. Inner ring: ART.caesar(letter,
     shift) at the SAME angle as its plain letter, so a line from one to the
     other is exactly the lesson's own strip (top row the real letter, bottom
     row what it becomes) bent into a circle. opt: {outerOn, innerOn, fs,
     highlight: {idx: [...], spoke: bool}} */
  function cpWheel(cx, cy, R, shift, opt) {
    opt = opt || {};
    var outerOn = opt.outerOn == null ? 1 : opt.outerOn;
    var innerOn = opt.innerOn == null ? 0 : opt.innerOn;
    if (!(outerOn > 0) && !(innerOn > 0)) return "";
    var rOuter = R, rInner = R * 0.62, fs = opt.fs || 15;
    var hi = opt.highlight || {}, hiIdx = hi.idx || [];
    var out = C(cx, cy, rOuter + fs, "none", P.line, 1.6, { opacity: outerOn * 0.55 });
    if (innerOn > 0) out += C(cx, cy, rInner + fs * 0.85, "none", P.line, 1.2,
      { "stroke-dasharray": "4 5", opacity: innerOn * 0.55 });
    for (var k = 0; k < 26; k++) {
      var lit = hiIdx.indexOf(k) >= 0;
      var op = cpAngPos(cx, cy, rOuter, k);
      if (outerOn > 0) out += Tx(op[0], op[1] + fs * 0.34, CP_ALPHA[k], "lab", "middle",
        { "font-size": lit ? fs * 1.3 : fs, fill: lit ? P.gold : P.ink, opacity: outerOn });
      if (innerOn > 0) {
        var ip = cpAngPos(cx, cy, rInner, k);
        var enc = ART.caesar(CP_ALPHA[k], shift);
        out += Tx(ip[0], ip[1] + fs * 0.30, enc, "lab", "middle",
          { "font-size": lit ? fs * 1.15 : fs * 0.84, fill: lit ? P.gold : P.muted, opacity: innerOn });
        if (lit && hi.spoke) out += L(op[0], op[1], ip[0], ip[1], P.gold, 2, { opacity: innerOn * 0.75 });
      }
    }
    return G(out, {});
  }

  /* ---- a letter in a box, for the encode/decode readouts ------------------ */
  function cpLetterBox(x, y, w, h, ch, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 12, P.cell, col || P.line, col ? 3 : 2) +
      Tx(x + w / 2, y + h / 2 + h * 0.16, String(ch).toUpperCase(), "lab big", "middle", { "font-size": h * 0.42 }),
      { opacity: clamp(o, 0, 1) });
  }
  function cpWordRow(x, y, cw, ch, gap, letters, revealed, o, col) {
    var out = "";
    for (var k = 0; k < letters.length; k++)
      out += cpLetterBox(x + k * (cw + gap), y, cw, ch, k < revealed ? letters[k] : "?", o, col);
    return out;
  }

  /* ==== the title motif ======================================================
     The wheel, a lock in the middle of it, and the three glyphs of "cat" in
     Pigpen underneath: both ciphers in one picture. On the spoken title
     chapter each piece arrives as it is named; on the two cards it stands
     still (o.scene is absent, so every on() below reads as fully in). */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene;
    var cOrders = sn ? sc(sn, 0, "orders") : null, cNobody = sn ? sc(sn, 0, "nobody") : null;
    var cCipher = sn ? sc(sn, 1, "cipher") : null, cRule = sn ? sc(sn, 1, "rule") : null;
    var wheelOn = sn ? on(t, cOrders, 0.7) : 1;
    var lockOn = sn ? on(t, cNobody, 0.6) : 1;
    var pigOn = sn ? on(t, cCipher, 0.6) : 1;
    var ruleOn = sn ? on(t, cRule, 0.6) : 1;
    var out = R(6, 10, 348, 340, 30, P.card, P.line, 3);
    out += G(cpWheel(180, 168, 108, CP_SHIFT, { outerOn: wheelOn, innerOn: wheelOn, fs: 11 }), {});
    out += G(Em(180, 168, 46, "\u{1F512}"), { opacity: lockOn });
    var py = 306;
    out += G(
      ART.place(ART.pigpen("c"), 92, py, 46, 46) +
      ART.place(ART.pigpen("a"), 144, py, 46, 46) +
      ART.place(ART.pigpen("t"), 196, py, 46, 46),
      { opacity: pigOn });
    out += Tx(180, 294, "a rule, not a guess", "lab mid muted", "middle", { opacity: ruleOn });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A Caesar wheel with a lock at its centre, and the word cat in Pigpen shapes">' + out + "</svg>";
  }

  /* ==== chapter: the Caesar cipher ==========================================
     The wheel appears as "every letter" is said; the shift and a becomes d
     pop in with the key; cat becomes fdw is read off the wheel and off a
     letter-box readout; the wrap at y is shown on the wheel itself; and the
     last beat runs the SAME wheel and readout backwards, decrypting fdw with
     ART.caesar(fdw, -3) - the lesson's own "shift back". */
  function cpCaesarChapter(scene, beat, t, i) {
    var cEvery = sc(scene, 0, "every"), cAlpha = sc(scene, 0, "alphabet");
    var cKey = sc(scene, 1, "key"), cThree = sc(scene, 1, "three"), cAd = sc(scene, 1, "ad");
    var cCat = sc(scene, 2, "cat"), cMoved = sc(scene, 2, "moved");
    var cWrap = sc(scene, 3, "wrap"), cY = sc(scene, 3, "y");
    var cBack = sc(scene, 4, "back"), cCat2 = sc(scene, 4, "cat");

    var wx = 300, wy = 230, wr = 148;
    var wheelOn = on(t, cEvery, 0.6);
    var innerOn = on(t, cKey, 0.6);
    var shiftBadge = popIn(t, cThree, 0.4);

    var hiIdx = [], spoke = false, label = null, labelAt = null;
    if (cpPast(t, cAd)) { hiIdx = [0]; spoke = true; label = "a becomes " + CP_A_D; labelAt = cAd; }
    if (cpPast(t, cCat)) { hiIdx = [2, 0, 19]; spoke = true; label = CP_CAT + " becomes " + CP_FDW; labelAt = cCat; }
    if (cpPast(t, cMoved)) { label = "each letter moved 3 places"; labelAt = cMoved; }
    if (cpPast(t, cWrap)) { hiIdx = [25, 0]; spoke = true; label = "the end wraps round to the start"; labelAt = cWrap; }
    if (cpPast(t, cY)) { hiIdx = [24]; spoke = true; label = "y shifted 3 is " + CP_Y_B; labelAt = cY; }
    if (cpPast(t, cBack)) { hiIdx = [5, 3, 22]; spoke = true; label = "shift back by 3"; labelAt = cBack; }
    if (cpPast(t, cCat2)) { hiIdx = [5, 3, 22]; spoke = true; label = CP_FDW + " says " + CP_BACK + " again"; labelAt = cCat2; }

    var out = "";
    out += cpWheel(wx, wy, wr, CP_SHIFT, { outerOn: wheelOn, innerOn: innerOn, fs: 14, highlight: { idx: hiIdx, spoke: spoke } });

    if (shiftBadge > 0) out += G(
      C(wx, wy, 42, P.card, P.gold, 3) + Tx(wx, wy + 13, "+3", "lab big", "middle", { "font-size": 36, fill: P.gold }),
      { opacity: Math.min(1, shiftBadge), transform: around(wx, wy, Math.min(1.08, shiftBadge)) });

    if (label) out += MK.pill(wx, 46, label, on(t, labelAt, 0.4), { size: 21, col: P.gold, ink: P.gold });

    /* the wrap: a short curve bending past the wheel's centre from z to a */
    if (cpPast(t, cWrap)) {
      var pz = cpAngPos(wx, wy, wr, 25), pa = cpAngPos(wx, wy, wr, 0);
      out += Pth("M" + n2(pz[0]) + "," + n2(pz[1]) + " Q" + n2(wx) + "," + n2(wy) + " " + n2(pa[0]) + "," + n2(pa[1]),
        null, P.gold, 3, { opacity: on(t, cWrap, 0.5) * 0.8 });
    }

    /* the readout: cat -> fdw while decoding is not yet shown; fdw -> cat once it is */
    var rx = 780, ry = 176;
    if (!cpPast(t, cBack)) {
      var showWord = on(t, cCat, 0.5);
      if (showWord > 0) {
        out += Tx(rx, ry - 20, CP_CAT, "lab big muted", "start", { opacity: showWord });
        var revealed = cpPast(t, cMoved) ? 3 : tally(t, cCat, 3, 1.4);
        out += cpWordRow(rx, ry, 78, 88, 12, CP_FDW.split(""), revealed, showWord, P.gold);
      }
    } else {
      var backOn = on(t, cBack, 0.5);
      out += Tx(rx, ry - 20, CP_FDW, "lab big muted", "start", { opacity: backOn });
      var revealed2 = cpPast(t, cCat2) ? 3 : tally(t, cBack, 3, 1.2);
      out += cpWordRow(rx, ry, 78, 88, 12, CP_BACK.split(""), revealed2, backOn, P.good);
    }
    if (cpPast(t, cAlpha)) { /* "along the alphabet" names the ring itself: no extra picture needed */ }

    return svg(out);
  }

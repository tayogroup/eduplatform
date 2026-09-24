  /* ==== Grade 3 Computing, Lesson 12: Secret Codes ============================
     tools/lib/film-scenes/computing-g3/secret-codes.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/secret-codes.json.

     THE CIPHER IS THE LESSON'S, NOT THE FILM'S. Every number on screen comes
     out of ART.code / ART.decode, which are computing.js's own codeWord and
     decodeCode (the 1 = a rule, 3DC.05). Nothing here holds a table of
     letters and numbers, so the strip, the worked words and the long coded
     message cannot disagree with the lesson the child is about to do.
     The lesson's cipher WHEEL is a closure inside its activity and cannot be
     lifted (there is no ART.sim in Computing), so the code strip is drawn
     here, in the engine's idiom, and filled from the rule.

     This file: the palette, the code strip and the tiles every chapter shares,
     the title motif and the chapter "Why ciphers". Every top-level name here
     starts with sec - never sc, which is the engine's cue lookup.  */

  var HUE = {
    title: P.teal, why: P.accent, code: P.gold, write: P.blue,
    read: P.good, names: P.plum, "break": P.gold, recap: P.teal
  };

  /* ---- the lesson's rule ------------------------------------------------------
     a..z and the number of each, asked of the kit one letter at a time. */
  var SEC_ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
  var SEC_NUM = SEC_ALPHA.map(function (c) { return ART.code(c)[0]; });
  /* a word as the lesson encodes it, and numbers as the lesson decodes them */
  function secCode(word) { return ART.code(word); }
  function secDecode(nums) { return ART.decode(nums); }
  /* where a letter sits on the strip (0-25) */
  function secAt(letter) { return SEC_ALPHA.indexOf(String(letter).toLowerCase()); }

  /* ---- timing ------------------------------------------------------------------ */
  function secPast(t, at) { return at != null && t >= at; }
  /* 0 -> 1 from the chapter's beat k on */
  function secFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as beat k comes in and back to 0 as beat k + 1 does: beat k alone */
  function secOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }

  /* ==== the code strip ==========================================================
     The alphabet with its number under every letter - the strip the lesson
     puts on screen for the child, and the thing this film points at whenever
     a letter is turned into a number or back.
       box  {x, y, w, h, gap}
       opt  {shown: how many cells are there (26 by default),
             lit: {index -> 0..1}, litCol, num: {index -> 0..1} (how far each
             NUMBER has arrived; 1 everywhere by default), o} */
  function secCellW(box) { return (box.w - 25 * box.gap) / 26; }
  function secCellX(box, k) { return box.x + k * (secCellW(box) + box.gap); }
  function secCellCx(box, k) { return secCellX(box, k) + secCellW(box) / 2; }

  function secStrip(box, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var cw = secCellW(box), h = box.h, shown = opt.shown == null ? 26 : opt.shown;
    var lit = opt.lit || {}, nums = opt.num, col = opt.litCol || P.gold, out = "";
    var lf = Math.min(30, h * 0.34), nf = Math.min(24, h * 0.27);
    for (var k = 0; k < 26; k++) {
      if (k >= shown) break;
      var x = secCellX(box, k), cx = x + cw / 2, p = clamp(lit[k] || 0, 0, 1);
      out += R(x, box.y, cw, h, 9, p > 0.02 ? "#1E4257" : P.cell, p > 0.02 ? col : P.line, p > 0.02 ? 3.5 : 1.5);
      out += Tx(cx, box.y + h * 0.40, SEC_ALPHA[k], "lab", "middle",
        { "font-size": lf, fill: p > 0.02 ? col : P.ink });
      out += L(x + cw * 0.18, box.y + h * 0.50, x + cw * 0.82, box.y + h * 0.50, P.line, 1.5);
      var no = nums ? clamp(nums[k] == null ? 0 : nums[k], 0, 1) : 1;
      if (no > 0.02)
        out += Tx(cx, box.y + h * 0.85, String(SEC_NUM[k]), "lab", "middle",
          { "font-size": nf, fill: p > 0.02 ? col : P.muted, opacity: no });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- tiles: a letter, or a number, in a box ---------------------------------- */
  /* opt: {col, fill, size (the tile's side), o, fs} */
  function secTile(cx, cy, w, h, text, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, fs = opt.fs || Math.min(h * 0.52, w * 0.62);
    return G(R(cx - w / 2, cy - h / 2, w, h, h * 0.2, opt.fill || P.cell, col, opt.col ? 3.5 : 2) +
      Tx(cx, cy + fs * 0.35, String(text), "lab", "middle", { "font-size": fs, fill: opt.ink || P.ink }),
      { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* a card carrying a message: a label above it and the message inside */
  function secCard(cx, cy, w, h, text, label, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, body = R(cx - w / 2, cy - h / 2, w, h, 16, opt.fill || P.card, col, opt.col ? 3.5 : 2);
    if (text != null) body += Tx(cx, cy + (h * 0.5) * 0.34, String(text), "lab", "middle",
      { "font-size": opt.fs || Math.min(34, h * 0.46), fill: opt.ink || P.ink });
    if (label) body += Tx(cx, cy - h / 2 - 14, label, "lab mid", "middle", { fill: opt.labCol || P.muted });
    return G(body, { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  /* the rule, as a box a message passes through: the key and "1 = a" */
  function secRuleBox(cx, cy, w, h, o, col) {
    if (!(o > 0)) return "";
    col = col || P.gold;
    return G(R(cx - w / 2, cy - h / 2, w, h, 14, "#2E2A18", col, 3.5) +
      Em(cx - w * 0.26, cy + 2, h * 0.44, "\u{1F511}") +
      Tx(cx + w * 0.12, cy + h * 0.16, "1 = a", "lab", "middle", { "font-size": h * 0.38, fill: col }),
      { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  /* ==== the title motif ==========================================================
     The whole lesson in one picture: cat, the rule, 3 1 20 - and, between them,
     the computers on the way that never get to read it. In the spoken title
     chapter each piece arrives as it is named; on the two silent cards it
     stands still. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cMsg = sn ? sc(sn, 0, "message") : null, cComp = sn ? sc(sn, 0, "computers") : null;
    var cCipher = sn ? sc(sn, 1, "cipher") : null, cCat = sn ? sc(sn, 1, "cat") : null,
      cCode = sn ? sc(sn, 1, "code") : null, cKey = sn ? sc(sn, 1, "key") : null;
    var pMsg = sn ? popIn(t, cMsg, 0.42) : 1, pCat = sn ? on(t, cCat, 0.4) : 1;
    var pComp = sn ? tally(t, cComp, 3, 0.6) : 3;
    var pRule = sn ? popIn(t, cCipher, 0.42) : 1, pCode = sn ? popIn(t, cCode, 0.42) : 1;
    var glow = sn ? on(t, cKey, 0.45) : 1;

    out += R(8, 18, 344, 324, 30, P.card, P.line, 3);
    /* the plain word, going down through the rule and out as numbers */
    out += G(R(40, 52, 160, 56, 14, P.cell, P.teal, 3) +
      Tx(120, 92, "cat", "lab", "middle", { "font-size": 34, fill: pCat > 0.02 ? P.ink : P.cell }),
      { transform: around(120, 80, Math.min(1.06, pMsg)), opacity: Math.min(1, pMsg) });
    out += MK.arrow(120, 112, 120, 150, Math.min(1, pMsg), P.muted, 6);
    out += secRuleBox(120, 176, 160, 56, pRule, P.gold);
    if (glow > 0) out += MK.glow(120, 176, 70, P.gold, glow * 0.9);
    out += MK.arrow(120, 208, 120, 246, Math.min(1, pRule), P.muted, 6);
    out += G(R(34, 272, 172, 56, 14, P.cell, P.gold, 3) +
      Tx(120, 310, secCode("cat").join(" "), "lab", "middle", { "font-size": 32, fill: P.gold }),
      { transform: around(120, 300, Math.min(1.06, pCode)), opacity: Math.min(1, pCode) });
    /* the computers it passes on the way, which never get to read it */
    for (var k = 0; k < 3; k++) {
      if (k >= pComp) break;
      var cy = 88 + k * 88;
      out += G(R(250, cy - 24, 64, 48, 6, P.cell, P.line, 2) + R(258, cy - 17, 48, 28, 2, P.ground) +
        R(268, cy + 24, 28, 6, 2, P.line), { opacity: 0.9 });
      out += Tx(282, cy + 7, "?", "lab", "middle", { "font-size": 22, fill: P.muted, opacity: Math.min(1, pCode) });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The word cat, the rule 1 equals a, and the same word in code as 3 1 20">' + out + "</svg>";
  }

  /* ==== chapter: why ciphers =====================================================
     The lesson's own picture of the problem: a message going from you to the
     bank along a cable, three computers hanging off it on the way, and what
     each of them can read. The message card carries the lesson's own word -
     hat, which its birthday-surprise step sends as 8 1 20 - and the code on it
     is asked of the rule, not typed here. */
  var SEC_HOP = [340, 584, 828];
  var SEC_WIRE = { y: 210, x0: 140, x1: 1010 };
  var SEC_SCREEN = { y: 252, w: 132, h: 88 };
  var SEC_EX = [
    { cx: 214, text: "passwords" },
    { cx: 584, text: "bank details" },
    { cx: 950, text: "private messages" }
  ];

  /* one computer on the way: a stalk down from the cable, a screen, and
     whatever that computer can make of the message */
  function secHop(cx, text, ink, o) {
    if (!(o > 0)) return "";
    var w = SEC_SCREEN.w, h = SEC_SCREEN.h, y = SEC_SCREEN.y;
    var body = L(cx, SEC_WIRE.y, cx, y, P.line, 4) +
      R(cx - w / 2, y, w, h, 10, P.body, P.edge, 3) +
      R(cx - w / 2 + 11, y + 11, w - 22, h - 22, 4, P.ground);
    if (text != null)
      body += Tx(cx, y + h / 2 + 9, text, "lab", "middle", { "font-size": 26, fill: ink || P.ink });
    body += R(cx - 26, y + h, 52, 9, 3, P.edge);
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  function secWhyChapter(scene, beat, t, i) {
    var cMsg = sc(scene, 0, "message"), cComp = sc(scene, 0, "computers");
    var cSee1 = sc(scene, 1, "see"), cRead1 = sc(scene, 1, "read");
    var cCipher = sc(scene, 2, "cipher"), cRule = sc(scene, 2, "rule"), cNon = sc(scene, 2, "nonsense");
    var cOnly = sc(scene, 3, "only"), cKey = sc(scene, 3, "key");
    var cHide = sc(scene, 4, "hide"), cSee2 = sc(scene, 4, "see"), cRead2 = sc(scene, 4, "read");
    var cPass = sc(scene, 5, "password"), cBank = sc(scene, 5, "bank"), cPriv = sc(scene, 5, "private");
    var out = "", coded = secPast(t, cRule), plain = "hat", cipher = secCode(plain).join(" ");

    /* the three things that travel in cipher, along the top */
    SEC_EX.forEach(function (ex, k) {
      out += MK.pill(ex.cx, 44, ex.text, on(t, [cPass, cBank, cPriv][k], 0.4),
        { size: 24, col: P.gold, ink: P.gold });
    });

    /* the cable, you at one end and the bank at the other */
    var o0 = on(t, cMsg, 0.5);
    out += L(SEC_WIRE.x0, SEC_WIRE.y, SEC_WIRE.x1, SEC_WIRE.y, P.line, 6, { opacity: o0 });
    out += G(Em(88, SEC_WIRE.y, 62, "\u{1F9D2}") + Tx(88, SEC_WIRE.y + 56, "you", "lab mid muted", "middle"), { opacity: o0 });
    out += G(Em(1080, SEC_WIRE.y, 62, "\u{1F3E6}") + Tx(1080, SEC_WIRE.y + 56, "the bank", "lab mid muted", "middle"), { opacity: o0 });

    /* the computers on the way, and what each can make of the message */
    var hops = tally(t, cComp, 3, 0.7);
    var shows = secPast(t, cRead1);
    SEC_HOP.forEach(function (cx, k) {
      var ho = k < hops ? on(t, cComp == null ? null : cComp + k * 0.24, 0.4) : 0;
      out += secHop(cx, shows ? (coded ? cipher : plain) : null, coded ? P.muted : P.bad, ho);
      if (ho <= 0) return;
      /* it can SEE the message: an eye, from "can see it", bumped again later */
      var eye = on(t, cSee1, 0.45) * 0.85 + 0.15 * bump(t, cSee2, 1.1);
      out += G(Em(cx, 372, 36, "\u{1F440}"), { opacity: clamp(eye, 0, 1) });
      /* and, once it is in cipher, it cannot READ it */
      out += MK.qmark(cx + 84, SEC_SCREEN.y + 26, 21, on(t, cNon, 0.45));
      out += MK.cross(cx, 300, 26, popIn(t, cRead2 == null ? null : cRead2 + k * 0.16, 0.4));
    });

    /* the rule, applied at your end */
    out += secRuleBox(92, 330, 162, 58, popIn(t, cCipher, 0.45), P.gold);
    out += MK.leader(92, 300, 92, 254, on(t, cRule, 0.5), P.gold);

    /* the message riding the cable: it carries plain text, then ciphertext */
    var per = 5.4, u = ((t - scene.start) / per) % 1, mx = lerp(180, 970, u);
    var mo = clamp(Math.min(u, 1 - u) / 0.11, 0, 1) * o0;
    if (mo > 0.01) {
      var flip = on(t, cRule, 0.45);
      if (flip < 1) out += secCard(mx, 168, 156, 54, plain, null, { o: (1 - flip) * mo, col: P.bad });
      if (flip > 0) out += secCard(mx, 168, 156, 54, cipher, null, { o: flip * mo, col: P.gold, ink: P.gold });
    }

    /* the bank has the key, so for the bank it is words again */
    var kp = popIn(t, cOnly, 0.45);
    out += MK.pop(Em(1080, 300, 46, "\u{1F511}"), 1080, 300, kp);
    out += secCard(1064, 372, 176, 54, plain, null, { o: on(t, cKey, 0.45), col: P.good });
    out += MK.tick(1150, 346, 16, popIn(t, cKey == null ? null : cKey + 0.45, 0.35));
    /* it does not HIDE the message: the cable and the card are plainly there */
    var hb = bump(t, cHide, 1.6);
    if (hb > 0.02) out += R(SEC_WIRE.x0 - 8, 140, SEC_WIRE.x1 - SEC_WIRE.x0 + 16, 88, 14, "none", P.gold, 4, { opacity: hb });
    return svg(out);
  }

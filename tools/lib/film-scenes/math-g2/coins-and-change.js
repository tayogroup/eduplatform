
  /* ==== Grade 2 Mathematics, Lesson 2: Coins and Change =======================
     tools/lib/film-scenes/math-g2/coins-and-change.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/coins-and-change.json.

     Mathematics has no lesson kit, so every drawing here is either one of
     ART's (tools/lib/ehel-film-art-math.page.js - the shared Maths pictures)
     or built from the engine's own helpers. The coins and notes are
     ART.coins, drawn with coinsUpTo: 50 because in THIS lesson 1, 5, 10, 20
     and 50 are coins and 100 is the note (coins-and-change.html: MONEY =
     [1, 5, 10, 20, 50] and kind(v) makes a note only at 100).

     EVERY TOTAL ON SCREEN IS COMPUTED FROM THE VALUES DRAWN. ccSum() adds the
     same array that ART.coins is handed, so a purse and its total cannot
     disagree - which is the one thing a money film must not get wrong.

     This file: the palette, the timing helpers, the shared small drawings, the
     title motif and the chapter "Know your money". Every top-level name starts
     with cc, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.gold, know: P.gold, count: P.teal, make: P.blue,
    write: P.plum, compare: P.accent, more: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ccOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ccFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k comes in, then 0: for a thing that is put away */
  function ccUntil(t, scene, k) { return 1 - ccFrom(t, scene, k); }

  /* ---- nesting one of ART's cards -------------------------------------------
     ART.place needs the box; the card says how big it is in its own viewBox, so
     the size is read from the markup rather than worked out again here. Passing
     the true aspect means a point inside the card maps exactly into the film's
     1168 x 440 space, which is what ccSpot returns. */
  function ccBox(markup) {
    var q = /viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(String(markup));
    if (!q) throw new Error("coins-and-change: that is not one of ART's drawings");
    return { w: +q[1], h: +q[2] };
  }
  function ccFit(markup, cx, cy, s) {
    var b = ccBox(markup);
    return ART.place(markup, cx - b.w * s / 2, cy - b.h * s / 2, b.w * s, b.h * s);
  }
  function ccSpot(markup, cx, cy, s, px, py) {
    var b = ccBox(markup);
    return [cx - b.w * s / 2 + px * s, cy - b.h * s / 2 + py * s];
  }

  /* ---- money ------------------------------------------------------------------ */

  /* 1, 5, 10, 20 and 50 are coins in this lesson; 100 is the note */
  function ccCoins(values, perRow) {
    return ART.coins(values, { coinsUpTo: 50, perRow: perRow || Math.min(5, values.length) });
  }
  function ccSum(values) { var s = 0, k; for (k = 0; k < values.length; k++) s += values[k]; return s; }
  function ccSh(n) { return ART.money(n, "sh"); }
  /* the centre of item k of a ONE-ROW coins card, in that card's own viewBox:
     ART.coins lays a row out at x = 20 + 90k, y = 20, each coin 76 x 76 */
  function ccSlot(k) { return [58 + 90 * k, 58]; }

  /* A loose coin, not on a card: the same face ART.coins draws (gold disc, the
     lessons' coin colours, the value and sh on it), scaled to r and free to
     stand anywhere. ART has no coin outside a card, and the title motif and
     the "big coin, small coin" beat both need one. */
  function ccCoin(cx, cy, r, v, o) {
    if (!(o > 0)) return "";
    return G(C(0, 0, r, ART.C.coin, ART.C.gold, r * 0.143) +
      E(-r * 0.257, -r * 0.314, r * 0.429, r * 0.314, ART.C.coinLit, null, null, { opacity: 0.6 }) +
      Tx(0, -r * 0.171, String(v), "lab", "middle", { "font-size": r * 0.686, fill: ART.C.coinInk, "dominant-baseline": "central" }) +
      Tx(0, r * 0.486, "sh", "lab", "middle", { "font-size": r * 0.4, fill: ART.C.coinInk, "dominant-baseline": "central" }),
      { transform: tr(cx, cy), opacity: Math.min(1, o) });
  }

  /* The purse the lesson keeps money in: a soft container behind the coins,
     with a rim and a clasp. ART has no purse. */
  function ccPurse(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var lip = 26;
    return G(R(x, y, w, h, 30, P.tealSoft, P.line, 3) +
      R(x + 16, y - lip / 2, w - 32, lip, lip / 2, P.line, null, null, { opacity: 0.5 }) +
      C(x + w / 2, y - lip / 2 + lip / 2, 8, P.gold),
      { opacity: Math.min(1, o) });
  }

  /* a word in a pill with a leader line to the thing it names, the film's one
     way of pointing (MK.leader; no cartoon teacher) */
  function ccPoint(t, at, x, y, text, to, size, col, mul) {
    var m = mul == null ? 1 : mul, o = on(t, at, 0.4) * m;
    if (o <= 0) return "";
    col = col || P.gold;
    return G(MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col), { opacity: m }) +
      MK.pill(x, y - 30, text, o, { size: size || 26, col: col });
  }

  /* ==== the title motif ==========================================================
     A purse holding a 50, a 20 and a 5, with the 100 note lying above it, out
     of the purse. In the spoken title chapter the purse arrives, then the
     coins, then the note; each value lights in turn, the coins are counted on
     to 75 sh while the note steps back, and the total lands at the bottom. On
     the two cards it simply stands. */
  var CC_MOTIF = [{ v: 50, x: 108, y: 176 }, { v: 20, x: 180, y: 168 }, { v: 5, x: 252, y: 176 }];
  /* the count the title says out loud: the running total of the coins above,
     worked out from them rather than written down beside them */
  var CC_MOTIF_RUN = (function () { var r = [], n = 0, k;
    for (k = 0; k < CC_MOTIF.length; k++) { n += CC_MOTIF[k].v; r.push(n); } return r; })();

  function ccMotifNote(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var h = w * 64 / 116;
    return G(R(-w / 2, -h / 2, w, h, w * 0.086, ART.C.note, ART.C.teal, w * 0.035) +
      Tx(0, -h * 0.094, "100", "lab", "middle", { "font-size": w * 0.233, fill: ART.C.noteInk, "dominant-baseline": "central" }) +
      Tx(0, h * 0.25, "sh", "lab", "middle", { "font-size": w * 0.121, fill: ART.C.noteInk, "dominant-baseline": "central" }),
      { transform: tr(cx, cy), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, S = o.scene, out = "";
    var cMoney = S ? sc(S, 0, "money") : null, cCoins = S ? sc(S, 0, "coins") : null, cNotes = S ? sc(S, 0, "notes") : null;
    var cValue = S ? sc(S, 1, "value") : null, cCount = S ? sc(S, 1, "count") : null, cWorth = S ? sc(S, 1, "worth") : null;
    /* on a card there is no chapter, so nothing waits for a cue */
    var pop = function (at, d) { return S ? popIn(t, at == null ? null : at + (d || 0), 0.4) : 1; };
    var lit = function (at, d) { return S ? on(t, at == null ? null : at + (d || 0), 0.45) : 0; };

    out += el("clipPath", { id: "ccMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#12283A");
    out += MK.glow(180, 226, 150, P.gold, S ? lit(cWorth, 0) * (0.65 + 0.35 * breathe(t)) : 0);

    var body = "";
    /* the note, above the purse and never in it; it steps back while the coins are counted */
    var noteDim = 1 - 0.68 * lit(cCount, 0);
    body += G(ccMotifNote(180, 74, 124, pop(cNotes)), { opacity: noteDim });
    /* the purse */
    body += ccPurse(60, 196, 240, 116, pop(cMoney));
    /* the three coins, one after another */
    CC_MOTIF.forEach(function (c, k) {
      body += ccCoin(c.x, c.y, 42, c.v, pop(cCoins, k * 0.22));
      /* each value lights in turn on "its own value" */
      var g = lit(cValue, k * 0.3);
      if (g > 0) body += C(c.x, c.y, 50, "none", P.gold, 4, { opacity: g * (0.45 + 0.55 * breathe(t + k)) });
      /* counted on: 50, then 70, then 75 */
      /* the running count and the total belong to the spoken chapter; on the
         two cards the motif simply stands, with nothing half-counted on it */
      var n = S ? pop(cCount, k * 0.42) : 0;
      if (n > 0) body += MK.pop(Tx(c.x, 128, String(CC_MOTIF_RUN[k]), "lab big", "middle", { fill: P.gold }), c.x, 122, n);
    });
    out += G(body, { "clip-path": "url(#ccMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    out += MK.pill(180, 334, ccSh(ccSum([50, 20, 5])), S ? Math.min(1, pop(cWorth)) : 0, { size: 30, col: P.gold });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A purse holding a 50, a 20 and a 5 shilling coin, with a 100 shilling note above it">' + out + "</svg>";
  }

  /* ==== chapter: Know your money ==================================================
     Beats 0 to 2 are the lesson's own money on the table: the row of coins
     (1, 5, 10, 20, 50) and the 100 note beside it, from ART.coins. Beat 3 is
     the lesson's warning, drawn as two loose coins - a big 5 and a small 20 -
     because a white card round each would be the very size the beat says to
     ignore. */
  var CC_KNOW_VALUES = [1, 5, 10, 20, 50];
  var CC_KNOW_S = 1.25, CC_KNOW_CX = 398, CC_KNOW_CY = 178;
  var CC_NOTE_S = 1.5, CC_NOTE_CX = 928, CC_NOTE_CY = 178;

  function ccKnowChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSh = c(0, "shillings"), cPrint = c(0, "printed");
    var cCoins = c(1, "coins"), cList = c(1, "list");
    var cNote = c(2, "note"), cWorth = c(2, "worth"), cHundred = c(2, "hundred");
    var cBig = c(3, "big"), cRead = c(3, "read"), cSize = c(3, "size");
    var out = "";

    /* ---- beats 0 to 2: the money on the table ---- */
    var table = ccUntil(t, scene, 3);
    if (table > 0) {
      var row = ccCoins(CC_KNOW_VALUES), note = ccCoins([100]);
      var a = "";
      /* the coins and the note are both there from the first line, which names
         both ("every coin and note"); each is framed as it is talked about */
      a += ccFit(row, CC_KNOW_CX, CC_KNOW_CY, CC_KNOW_S);
      a += ccFit(note, CC_NOTE_CX, CC_NOTE_CY, CC_NOTE_S);
      var rb = ccBox(row), nb = ccBox(note);
      /* "the coins": a frame round the row. "a note": a frame round the note. */
      var fc = on(t, cCoins, 0.45), fn = on(t, cNote, 0.45);
      if (fc > 0) a += R(CC_KNOW_CX - rb.w * CC_KNOW_S / 2 - 9, CC_KNOW_CY - rb.h * CC_KNOW_S / 2 - 9,
        rb.w * CC_KNOW_S + 18, rb.h * CC_KNOW_S + 18, 26, "none", P.teal, 4, { opacity: fc });
      if (fn > 0) a += R(CC_NOTE_CX - nb.w * CC_NOTE_S / 2 - 9, CC_NOTE_CY - nb.h * CC_NOTE_S / 2 - 9,
        nb.w * CC_NOTE_S + 18, nb.h * CC_NOTE_S + 18, 26, "none", P.plum, 4, { opacity: fn });
      /* "shillings": the word, once */
      a += MK.pill(398, 52, "shillings", on(t, cSh, 0.4) * ccOnly(t, scene, 0), { size: 30, col: P.gold });
      /* "its value printed on it": the 10 on the coin, then the 100 on the note */
      var tenAt = ccSpot(row, CC_KNOW_CX, CC_KNOW_CY, CC_KNOW_S, ccSlot(2)[0], ccSlot(2)[1]);
      a += ccPoint(t, cPrint, 300, 392, "its value", tenAt, 26, null, ccOnly(t, scene, 0));
      if (cPrint != null) a += C(tenAt[0], tenAt[1], 52, "none", P.gold, 4,
        { opacity: on(t, cPrint, 0.4) * (0.4 + 0.6 * breathe(t)) * ccOnly(t, scene, 0) });
      var noteAt = ccSpot(note, CC_NOTE_CX, CC_NOTE_CY, CC_NOTE_S, 78, 52);
      a += ccPoint(t, cPrint == null ? null : cPrint + 0.7, 830, 392, "its value", noteAt, 26, null, ccOnly(t, scene, 0));
      /* "one, five, ten, twenty and fifty": each coin lights in turn */
      var n = tally(t, cList, 5, 1.7);
      for (var k = 0; k < n; k++) {
        var p = ccSpot(row, CC_KNOW_CX, CC_KNOW_CY, CC_KNOW_S, ccSlot(k)[0], ccSlot(k)[1]);
        var age = clamp(1 - (n - 1 - k) * 0.45, 0.25, 1), here = ccOnly(t, scene, 1);
        a += MK.glow(p[0], p[1], 66, P.gold, age * here);
        a += C(p[0], p[1], 53, "none", P.gold, 4, { opacity: age * here });
      }
      /* "worth more than most coins", and "This one is 100" */
      a += MK.pill(CC_NOTE_CX, 330, "more than most coins", on(t, cWorth, 0.4) * ccOnly(t, scene, 2), { size: 22, col: P.plum });
      a += MK.pill(CC_NOTE_CX, 386, ccSh(100), on(t, cHundred, 0.4) * ccOnly(t, scene, 2), { size: 32, col: P.gold });
      out += G(a, { opacity: table });
    }

    /* ---- beat 3: a big coin worth less than a small one ---- */
    var warn = ccFrom(t, scene, 3);
    if (warn > 0) {
      var b = "";
      b += ccCoin(360, 196, 112, 5, popIn(t, cBig, 0.45));
      b += ccCoin(792, 196, 50, 20, popIn(t, cBig == null ? null : cBig + 0.35, 0.45));
      /* "Read the number": the small coin's number first, then the big one's */
      b += ccPoint(t, cRead, 900, 96, ccSh(20), [800, 180], 26, P.good);
      b += ccPoint(t, cRead == null ? null : cRead + 0.6, 176, 96, ccSh(5), [330, 170], 26, P.gold);
      /* "not the size": the width of the big coin, crossed out; the 20 ticked */
      var sz = on(t, cSize, 0.5);
      if (sz > 0) {
        b += L(248, 356, 248, 380, P.muted, 3, { opacity: sz });
        b += L(472, 356, 472, 380, P.muted, 3, { opacity: sz });
        b += L(248, 368, 472, 368, P.muted, 3, { opacity: sz, "stroke-dasharray": "10 8" });
        b += MK.cross(360, 368, 26, popIn(t, cSize == null ? null : cSize + 0.2, 0.4));
        b += MK.tick(792, 292, 26, popIn(t, cSize == null ? null : cSize + 0.55, 0.4));
      }
      out += G(b, { opacity: warn });
    }
    return svg(out);
  }

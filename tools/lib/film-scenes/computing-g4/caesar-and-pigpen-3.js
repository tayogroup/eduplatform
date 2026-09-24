  /* ==== Caesar and Pigpen, part 3: encryption today, the round trip, recap ===
     tools/lib/film-scenes/computing-g4/caesar-and-pigpen-3.js. See the header
     of caesar-and-pigpen.js.

     Neither chapter here names a specific letter or cipher output, so neither
     needs ART.caesar or ART.pigpen: "today" is about the LENGTH of a key, not
     what it turns a letter into, and "the round trip" is the four names a
     message passes through, illustrated with a plain word rather than a
     ciphered one. The closing cards reuse both, plus the wheel and Pigpen
     glyphs, from file 1 and file 2. */

  /* a labelled stage box: plain text, or ciphertext */
  function cpStageBox(x, y, w, h, label, pic, o, col) {
    if (!(o > 0)) return "";
    return G(
      R(x, y, w, h, 18, P.cell, col || P.line, col ? 3 : 2) +
      Em(x + w / 2, y + h * 0.36, h * 0.5, pic) +
      Tx(x + w / 2, y + h * 0.82, label, "lab mid", "middle"),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, 0.9 + 0.1 * Math.min(1, o)) });
  }

  /* ==== chapter: encryption today ============================================
     A short key (Caesar's 25 tries) beside a long one (today's), a message
     scrambled and unscrambled with placeholder blocks (no letters claimed -
     the point is length, not a specific cipher), and the age-of-the-universe
     line the lesson's own world text carries. */
  function cpTodayChapter(scene, beat, t, i) {
    var cBrowser = sc(scene, 0, "browser"), cMessages = sc(scene, 0, "messages"), cSame = sc(scene, 0, "same");
    var cScramble = sc(scene, 1, "scramble"), cUnscramble = sc(scene, 1, "unscramble");
    var cDiff = sc(scene, 2, "difference"), cLong = sc(scene, 2, "long");
    var cTrying = sc(scene, 3, "trying"), cUniverse = sc(scene, 3, "universe");
    var cPassword = sc(scene, 4, "password"), cCard = sc(scene, 4, "card"), cSafe = sc(scene, 4, "safe");

    var out = "";
    var browserOn = on(t, cBrowser, 0.5);
    out += G(Em(110, 74, 60, "\u{1F310}"), { opacity: browserOn });
    var msgOn = on(t, cMessages, 0.5);
    out += G(Em(210, 74, 52, "\u{1F4AC}"), { opacity: msgOn });
    var sameOn = on(t, cSame, 0.5);
    if (sameOn > 0) out += MK.pill(160, 130, "the very same idea", sameOn, { size: 19, col: P.blue, ink: P.blue });

    /* scramble / unscramble: a word turned to blocks and back. Purely
       illustrative - no letters are claimed, so nothing here calls ART.caesar. */
    var wx = 60, wy = 200, cw = 50, ch = 58, wgap = 8, letters = "safe".split("");
    var scrOn = on(t, cScramble, 0.5), unscrOn = on(t, cUnscramble, 0.5);
    var scrambled = scrOn > 0 && unscrOn <= 0;
    if (scrOn > 0) {
      letters.forEach(function (ch2, k) {
        var glyph = scrambled ? "░" : ch2.toUpperCase();
        out += cpLetterBox(wx + k * (cw + wgap), wy, cw, ch, glyph, 1, scrambled ? P.bad : P.good);
      });
      out += MK.pill(wx + 2 * (cw + wgap), wy - 22, scrambled ? "scrambled" : "unscrambled", 1,
        { size: 17, col: scrambled ? P.bad : P.good, ink: scrambled ? P.bad : P.good });
    }

    /* a short key beside a long one */
    var diffOn = on(t, cDiff, 0.5);
    if (diffOn > 0) {
      out += R(60, 320, 60, 16, 6, P.gold, null, null, { opacity: diffOn });
      out += Tx(60, 310, "Caesar: 25 keys", "lab small muted", "start", { opacity: diffOn });
    }
    var longW = 60 + tally(t, cLong, 1, 1) * 420;
    var longOn = on(t, cLong, 0.6);
    if (longOn > 0) {
      out += R(60, 356, longW, 16, 6, P.blue, null, null, { opacity: longOn });
      out += Tx(60, 346, "today: enormously long", "lab small muted", "start", { opacity: longOn });
    }

    var tryOn = on(t, cTrying, 0.5);
    var uniOn = on(t, cUniverse, 0.5);
    if (tryOn > 0) out += G(Em(880, 110, 58, "⏳"), { opacity: tryOn });
    if (uniOn > 0) {
      out += G(Em(970, 110, 58, "\u{1F30C}"), { opacity: uniOn });
      out += MK.pill(925, 170, "longer than the age of the universe", uniOn, { size: 19, col: P.blue, ink: P.blue });
    }

    var pwOn = on(t, cPassword, 0.5), cardOn = on(t, cCard, 0.5), safeOn = on(t, cSafe, 0.5);
    if (pwOn > 0) out += G(Em(730, 340, 48, "\u{1F511}"), { opacity: pwOn });
    if (pwOn > 0) out += Tx(730, 378, "your password", "lab small muted", "middle", { opacity: pwOn });
    if (cardOn > 0) out += G(Em(870, 340, 48, "\u{1F4B3}"), { opacity: cardOn });
    if (cardOn > 0) out += Tx(870, 378, "your card number", "lab small muted", "middle", { opacity: cardOn });
    if (safeOn > 0) {
      out += G(Em(1010, 340, 48, "\u{1F512}"), { opacity: safeOn });
      out += MK.pill(870, 412, "safe on the way", safeOn, { size: 19, col: P.good, ink: P.good });
    }

    return svg(out);
  }

  /* ==== chapter: the round trip ==============================================
     Plain text -> (encrypt, with the key) -> ciphertext -> (travels) ->
     (decrypt, with the key) -> plain text again, in the lesson's own four
     names. At the close, the wheel and three Pigpen glyphs stand for both
     ciphers making the same trip. */
  function cpRoundtripChapter(scene, beat, t, i) {
    var cJourney = sc(scene, 0, "journey"), cName = sc(scene, 0, "name");
    var cPlain = sc(scene, 1, "plain"), cRead = sc(scene, 1, "read");
    var cEncrypt = sc(scene, 2, "encrypt"), cCipher = sc(scene, 2, "ciphertext");
    var cTravels = sc(scene, 3, "travels"), cDecrypt = sc(scene, 3, "decrypt");
    var cBack = sc(scene, 4, "back"), cBoth = sc(scene, 4, "both");

    var bw = 210, bh = 100, by = 140, gap = 70;
    var x1 = 40, x2 = x1 + bw + gap, x3 = x2 + bw + gap;
    var out = "";

    var journeyOn = on(t, cJourney, 0.5);
    if (journeyOn > 0) out += MK.pill(x1 + bw / 2, by - 46, "one journey, four names", on(t, cName, 0.5), { size: 18, col: P.good, ink: P.good });

    var plainOn = on(t, cPlain, 0.5);
    out += cpStageBox(x1, by, bw, bh, "plain text", "\u{1F4C4}", plainOn, P.blue);
    if (on(t, cRead, 0.5) > 0) out += MK.pill(x1 + bw / 2, by - 12, "anybody could read it", on(t, cRead, 0.5), { size: 16, col: P.blue, ink: P.blue });

    var encOn = on(t, cEncrypt, 0.5);
    out += MK.arrow(x1 + bw + 8, by + bh / 2, x2 - 8, by + bh / 2, encOn, P.gold, 6);
    if (encOn > 0) out += G(Em((x1 + bw + x2) / 2, by - 16, 30, "\u{1F511}"), { opacity: encOn });

    var cipherOn = on(t, cCipher, 0.5);
    out += cpStageBox(x2, by, bw, bh, "ciphertext", "\u{1F510}", cipherOn, P.plum);
    var travelOn = on(t, cTravels, 0.6);
    if (travelOn > 0) out += MK.waves(x2 + bw / 2, by - 4, t, cTravels, { n: 2, dir: -Math.PI / 2, spread: 1.4, reach: 28, col: P.plum });

    var decOn = on(t, cDecrypt, 0.5);
    out += MK.arrow(x2 + bw + 8, by + bh / 2, x3 - 8, by + bh / 2, decOn, P.gold, 6);
    if (decOn > 0) out += G(Em((x2 + bw + x3) / 2, by - 16, 30, "\u{1F511}"), { opacity: decOn });

    var backOn = on(t, cBack, 0.5);
    out += cpStageBox(x3, by, bw, bh, "plain text", "\u{1F4C4}", backOn, P.good);

    var bothOn = on(t, cBoth, 0.5);
    if (bothOn > 0) {
      out += G(cpWheel(945, 120, 62, CP_SHIFT, { outerOn: 1, innerOn: 0, fs: 9 }), { opacity: bothOn });
      out += G(
        ART.place(ART.pigpen("c"), 905, 240, 44, 44) +
        ART.place(ART.pigpen("a"), 953, 240, 44, 44) +
        ART.place(ART.pigpen("t"), 1001, 240, 44, 44),
        { opacity: bothOn });
      out += Tx(975, 314, "Caesar and Pigpen, both", "lab mid muted", "middle", { opacity: bothOn });
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------- */
  var CP_RECAP = MK.recapKind([
    { beat: 0, at: "caesar", title: "Caesar", sub: "shifts every letter along the alphabet", pic: "\u{1F511}" },
    { beat: 1, at: "pigpen", title: "Pigpen", sub: "gives each letter the shape of its pen", pic: "\u{1F437}" },
    { beat: 2, at: "key", title: "The key", sub: "25 shifts is a weak secret", pic: "\u{1F513}" },
    { beat: 3, at: "trip", title: "The round trip", sub: "plain text, ciphertext, plain text again", pic: "\u{1F4C4}" }
  ], { goBeat: 3, goAt: "trip" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Caesar's cipher: shift the alphabet along",
      "Pigpen's cipher: swap letters for shapes",
      "And why the key is the only real secret"
    ] }),
    caesar: cpCaesarChapter,
    pigpen: cpPigpenChapter,
    key: cpKeyChapter,
    today: cpTodayChapter,
    roundtrip: cpRoundtripChapter,
    recap: CP_RECAP
  };

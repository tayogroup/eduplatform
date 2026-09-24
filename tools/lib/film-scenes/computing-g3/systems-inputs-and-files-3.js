  /* ==== Systems, Inputs and Files, part 3: files, and what you now know =======
     tools/lib/film-scenes/computing-g3/systems-inputs-and-files-3.js. See the
     header of systems-inputs-and-files.js.

     The five file-type cards use the lesson's OWN five emoji and its own
     example for each (a story, a song, a photo, a film, a game), and the
     "record yourself singing" question is the lesson's own quiz item from the
     "explore" step. The recap chapter is written by hand rather than with
     MK.recapKind, because two of its four beats each name TWO ideas and every
     one of them needs its own moment on screen, not only the card's. */

  /* ==== chapter: what kind of file? ================================================ */
  var SIF_DRIVE = { x: 584, y: 78 };
  var SIF_CARD_Y = 150, SIF_CARD_H = 210, SIF_CARD_W = 206, SIF_CARD_GAP = 16;
  var SIF_FILES = [
    { pic: "\u{1F4C4}", title: "Text", sub: "a story" },
    { pic: "\u{1F3B5}", title: "Audio", sub: "a song" },
    { pic: "\u{1F5BC}\uFE0F", title: "Image", sub: "a photo" },
    { pic: "\u{1F3AC}", title: "Video", sub: "a film" },
    { pic: "\u{1F3AE}", title: "Game", sub: "a game" }
  ];
  function sifCardX(k) { return 37 + k * (SIF_CARD_W + SIF_CARD_GAP); }
  function sifCardC(k) { return [sifCardX(k) + SIF_CARD_W / 2, SIF_CARD_Y + SIF_CARD_H / 2]; }
  function sifFileCard(k, o, col) {
    if (!(o > 0)) return "";
    var x = sifCardX(k), cx = x + SIF_CARD_W / 2;
    return G(R(x, SIF_CARD_Y, SIF_CARD_W, SIF_CARD_H, 20, P.card, col || P.line, col ? 3 : 2) +
      Em(cx, SIF_CARD_Y + 72, 66, SIF_FILES[k].pic) +
      Tx(cx, SIF_CARD_Y + 136, SIF_FILES[k].title, "lab big", "middle") +
      Tx(cx, SIF_CARD_Y + 168, SIF_FILES[k].sub, "lab mid muted readable", "middle"),
      { opacity: o, transform: around(cx, SIF_CARD_Y + SIF_CARD_H / 2, 0.95 + 0.05 * Math.min(1, o)) });
  }

  function sifFilesChapter(scene, beat, t, i) {
    var cHarddrive = sc(scene, 0, "harddrive"), cType = sc(scene, 0, "type");
    var cText = sc(scene, 1, "text"), cAudio = sc(scene, 1, "audio");
    var cImage = sc(scene, 2, "image"), cVideo = sc(scene, 2, "video");
    var cGame = sc(scene, 3, "game"), cReady = sc(scene, 3, "ready");
    var cRecord = sc(scene, 4, "record"), cAudiofile = sc(scene, 4, "audiofile"), cHoldssound = sc(scene, 4, "holdssound");
    var cDecides2 = sc(scene, 5, "decides2"), cOpens = sc(scene, 5, "opens");
    var out = "";

    var drOn = on(t, cHarddrive, 0.5);
    out += G(Em(SIF_DRIVE.x, SIF_DRIVE.y, 84, "\u{1F4BE}"), { opacity: drOn });
    out += MK.qmark(SIF_DRIVE.x + 52, SIF_DRIVE.y - 30, 22, on(t, cType, 0.4) * (1 - fecPastSafe(t, cText)));

    var audioRinged = fecPastSafe(t, cAudiofile) && !fecPastSafe(t, cDecides2);
    for (var k = 0; k < 5; k++) {
      var cues = [cText, cAudio, cImage, cVideo, cGame];
      out += sifFileCard(k, on(t, cues[k], 0.4), k === 1 && audioRinged ? P.gold : null);
    }
    /* "ready to run": the game card glows */
    var gameC = sifCardC(4);
    out += MK.glow(gameC[0], gameC[1], 120, P.good, popIn(t, cReady, 0.4) * 0.6);
    out += MK.tick(sifCardX(4) + SIF_CARD_W - 26, SIF_CARD_Y + 22, 20, popIn(t, cReady, 0.4));

    /* record yourself singing: a microphone above the audio card, and its answer */
    var micOn = popIn(t, cRecord, 0.42);
    var audioC = sifCardC(1);
    if (micOn > 0) out += MK.pop(Em(audioC[0], SIF_DRIVE.y + 6, 56, "\u{1F3A4}"), audioC[0], SIF_DRIVE.y + 6, micOn);
    out += MK.leader(audioC[0], SIF_DRIVE.y + 30, audioC[0], SIF_CARD_Y - 4, on(t, cAudiofile, 0.5), P.gold);
    out += MK.tick(audioC[0] + 60, SIF_CARD_Y + 20, 20, popIn(t, cHoldssound, 0.4));

    /* the type decides which program opens it: the hard drive feeds every card */
    var feedOn = on(t, cDecides2, 0.6);
    if (feedOn > 0) for (var m = 0; m < 5; m++) {
      var c = sifCardC(m);
      out += MK.leader(SIF_DRIVE.x, SIF_DRIVE.y + 44, c[0], SIF_CARD_Y - 4, feedOn, P.blue);
    }
    var openOn = popIn(t, cOpens, 0.42);
    if (openOn > 0) {
      for (var n = 0; n < 5; n++) out += MK.tick(sifCardX(n) + SIF_CARD_W - 26, SIF_CARD_Y + 22, 20, Math.min(1, openOn));
      out += MK.pill(584, 40, "opens the right program", Math.min(1, openOn), { size: 20, col: P.blue, ink: P.blue });
    }
    return svg(out);
  }

  /* ==== chapter: what you now know =================================================
     Four cards, each holding the lesson's own idea and, where its beat names
     two things, a second detail that arrives with the second phrase. */
  var SIF_RC = { x: [4, 591, 4, 591], y: [4, 4, 227, 227], w: 573, h: 209 };
  function sifRecapFrame(k, on1, title) {
    var x = SIF_RC.x[k], y = SIF_RC.y[k], w = SIF_RC.w, h = SIF_RC.h, cx = x + w / 2;
    return G(R(x, y, w, h, 24, on1 > 0 ? "#1B3A52" : P.card, on1 > 0 ? P.teal : P.line, on1 > 0 ? 3 : 2) +
      Tx(cx, y + 40, title, "lab big", "middle"),
      { opacity: 0.34 + 0.66 * Math.min(1, on1) });
  }

  function sifRecapChapter(scene, beat, t, i) {
    var cSystem2 = sc(scene, 0, "system2");
    var cHwrecap = sc(scene, 1, "hwrecap"), cSwrecap = sc(scene, 1, "swrecap");
    var cManrecap = sc(scene, 2, "manrecap"), cAutorecap = sc(scene, 2, "autorecap");
    var cTypesrecap = sc(scene, 3, "typesrecap"), cHdrecap = sc(scene, 3, "hdrecap");
    var out = "";

    /* card 0: one working system */
    var a0 = popIn(t, cSystem2, 0.42);
    out += sifRecapFrame(0, a0, "One working system");
    if (a0 > 0) out += MK.pop(Em(SIF_RC.x[0] + SIF_RC.w / 2 - 70, SIF_RC.y[0] + 130, 62, "⌨️"), SIF_RC.x[0] + SIF_RC.w / 2 - 70, SIF_RC.y[0] + 130, a0) +
      MK.arrow(SIF_RC.x[0] + SIF_RC.w / 2 - 30, SIF_RC.y[0] + 130, SIF_RC.x[0] + SIF_RC.w / 2 + 30, SIF_RC.y[0] + 130, Math.min(1, a0), P.gold, 6) +
      MK.pop(Em(SIF_RC.x[0] + SIF_RC.w / 2 + 70, SIF_RC.y[0] + 130, 62, "\u{1F5A5}\uFE0F"), SIF_RC.x[0] + SIF_RC.w / 2 + 70, SIF_RC.y[0] + 130, a0);

    /* card 1: whose job (hardware, then software) */
    var a1h = popIn(t, cHwrecap, 0.42), a1s = popIn(t, cSwrecap, 0.42);
    out += sifRecapFrame(1, Math.max(a1h, a1s), "Whose job?");
    if (a1h > 0) out += MK.pop(Em(SIF_RC.x[1] + 150, SIF_RC.y[1] + 130, 60, "\u{1F5A5}\uFE0F"), SIF_RC.x[1] + 150, SIF_RC.y[1] + 130, a1h) +
      Tx(SIF_RC.x[1] + 150, SIF_RC.y[1] + 180, "senses, shows, stores", "lab mid muted readable", "middle", { opacity: Math.min(1, a1h) });
    if (a1s > 0) out += MK.pop(Em(SIF_RC.x[1] + 420, SIF_RC.y[1] + 130, 60, "\u{1F9E0}"), SIF_RC.x[1] + 420, SIF_RC.y[1] + 130, a1s) +
      Tx(SIF_RC.x[1] + 420, SIF_RC.y[1] + 180, "decides, calculates", "lab mid muted readable", "middle", { opacity: Math.min(1, a1s) });

    /* card 2: manual, or automatic (a person, then a sensor) */
    var a2m = popIn(t, cManrecap, 0.42), a2a = popIn(t, cAutorecap, 0.42);
    out += sifRecapFrame(2, Math.max(a2m, a2a), "Manual, or automatic?");
    if (a2m > 0) out += MK.pop(Em(SIF_RC.x[2] + 150, SIF_RC.y[2] + 130, 60, "\u{1F590}\uFE0F"), SIF_RC.x[2] + 150, SIF_RC.y[2] + 130, a2m) +
      Tx(SIF_RC.x[2] + 150, SIF_RC.y[2] + 180, "manual: a person", "lab mid muted readable", "middle", { opacity: Math.min(1, a2m) });
    if (a2a > 0) out += MK.pop(Em(SIF_RC.x[2] + 420, SIF_RC.y[2] + 130, 60, "\u{1F916}"), SIF_RC.x[2] + 420, SIF_RC.y[2] + 130, a2a) +
      Tx(SIF_RC.x[2] + 420, SIF_RC.y[2] + 180, "automatic: a sensor", "lab mid muted readable", "middle", { opacity: Math.min(1, a2a) });

    /* card 3: five file types, then where they live */
    var a3t = popIn(t, cTypesrecap, 0.42), a3h = popIn(t, cHdrecap, 0.42);
    out += sifRecapFrame(3, Math.max(a3t, a3h), "Five types of file");
    if (a3t > 0) SIF_FILES.forEach(function (f, k) {
      var x = SIF_RC.x[3] + 110 + k * 88;
      out += MK.pop(Em(x, SIF_RC.y[3] + 128, 46, f.pic), x, SIF_RC.y[3] + 128, popIn(t, cTypesrecap == null ? null : cTypesrecap + k * 0.1, 0.34));
    });
    out += MK.pill(SIF_RC.x[3] + SIF_RC.w / 2, SIF_RC.y[3] + 178, "on the hard drive", Math.min(1, a3h), { size: 20, col: P.gold, ink: P.gold });

    return svg(out);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["A working system: hardware and software", "Manual and automatic inputs", "Five types of file, on the hard drive"] }),
    system: sifSystemChapter, roles: sifRolesChapter, inputs: sifInputsChapter,
    files: sifFilesChapter, recap: sifRecapChapter
  };

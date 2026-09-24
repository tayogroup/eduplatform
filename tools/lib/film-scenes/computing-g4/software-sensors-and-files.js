  /* ==== Grade 4 Computing, Lesson 13: Software, Sensors and Files =============
     tools/lib/film-scenes/computing-g4/software-sensors-and-files.js, with
     -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/software-sensors-and-files.json.

     Computing has no ART.sim, so the device rows, the file bars and the size
     ladder are drawn here in the engine's idiom. The one thing the kit does
     draw is the computer itself: ART.figure("laptop") is the machine the
     systems chapter is about, and its own screen and keyboard outlines are
     rung with ART.ring as the voice names them, exactly as the lesson rings
     them when a child taps.

     Every reading, message and file size is the lesson's: h e l l o, 21
     degrees, a night of logger readings, 22 degrees on the screen, battery
     low, the class list, the fridge light, and 20 KB / 3 MB / 5 MB / 2 GB /
     a few MB to 50 GB.

     This file: the palette, the shared card and tile helpers, the title motif
     and the chapter "Applications do jobs". Every top-level name starts with
     ssf, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, apps: P.gold, systems: P.blue, inputs: P.accent,
    outputs: P.good, sizes: P.plum, order: P.gold, recap: P.teal
  };

  /* ---- timing --------------------------------------------------------------
     The same three helpers every film in this set uses. */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function ssfPast(t, at) { return at != null && t >= at; }
  /* 1 while the thing named at `at` is the thing being named: a gold border
     that moves on rather than accumulating (rule 3, one part at a time) */
  function ssfNow(t, at, hold) {
    if (at == null || t < at) return 0;
    var u = (t - at) / (hold || 1.4);
    return u >= 1 ? 0 : 1;
  }

  /* ---- shared pieces --------------------------------------------------------
     A card, an empty slot and a tile: the three shapes the whole film is made
     of, so a border colour means the same thing in every chapter - gold while
     the voice is naming it, green once it is settled, a plain line otherwise. */

  function ssfBox(x, y, w, h, r, col, o, fill) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, r, fill || P.card, col || P.line, col ? 3.5 : 2, { opacity: clamp(o, 0, 1) });
  }
  function ssfSlot(x, y, w, h, r, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, r, P.card, P.line, 2, { "stroke-dasharray": "11 9", opacity: clamp(o, 0, 1) * 0.9 });
  }
  /* gold while it is being named, green when it is done, otherwise nothing */
  function ssfCol(now, done) { return now > 0 ? P.gold : done ? P.good : null; }

  /* A mouse, drawn rather than taken from the emoji font: the lesson's laptop
     figure has a touchpad and no mouse, and the voice says mouse. */
  function ssfMouse(cx, cy, s, col) {
    return E(cx, cy, s * 0.34, s * 0.50, P.plastic, col || P.edge, 2.5) +
      L(cx, cy - s * 0.50, cx, cy - s * 0.14, col || P.edge, 2.5) +
      R(cx - s * 0.05, cy - s * 0.36, s * 0.10, s * 0.17, s * 0.05, "#2B5673");
  }

  /* A power button, drawn for the same reason. */
  function ssfPower(cx, cy, r, col, o) {
    if (!(o > 0)) return "";
    var a = r * 0.46;
    return G(C(cx, cy, r, P.card, col, 3) +
      Pth("M" + n2(cx - a * 0.86) + "," + n2(cy - a * 0.18) +
        " A " + n2(a) + "," + n2(a) + " 0 1 0 " + n2(cx + a * 0.86) + "," + n2(cy - a * 0.18), null, col, 3) +
      L(cx, cy - r * 0.62, cx, cy + r * 0.04, col, 3), { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif =======================================================
     The whole lesson in one picture: a machine with two layers of software in
     it, data coming in from a sensor, information going out to a screen, and
     four files of very different sizes underneath. In the spoken title
     chapter the application layer arrives on "open Paint to draw", the systems
     layer on "the operating system", the rest of the machine on "Both are
     software", and each layer is ringed as its job is said. On the two cards
     it stands still. */
  var SSF_MOTIF_BARS = [
    { pic: "\u{1F4C4}", w: 34 }, { pic: "\u{1F5BC}️", w: 78 },
    { pic: "\u{1F3B5}", w: 106 }, { pic: "\u{1F3AC}", w: 174 }
  ];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cPaint = sn ? sc(sn, 0, "paint") : null, cOs = sn ? sc(sn, 0, "os") : null,
      cBoth = sn ? sc(sn, 1, "both") : null, cJob = sn ? sc(sn, 1, "job") : null,
      cRuns = sn ? sc(sn, 1, "runs") : null;
    var pApp = sn ? popIn(t, cPaint, 0.42) : 1, pSys = sn ? popIn(t, cOs, 0.42) : 1;
    var rest = sn ? on(t, cBoth, 0.6) : 1;
    var litApp = sn ? on(t, cJob, 0.45) : 1, litSys = sn ? on(t, cRuns, 0.45) : 1;

    /* the machine */
    out += R(92, 54, 176, 178, 20, P.card, P.line, 3, { opacity: 0.35 + 0.65 * rest });
    /* the application layer */
    if (pApp > 0) out += G(R(108, 72, 144, 64, 12, P.cell, litApp > 0.2 ? P.gold : P.line, litApp > 0.2 ? 3.5 : 2) +
      Em(134, 106, 30, "\u{1F3A8}") + Em(180, 106, 30, "\u{1F310}") + Em(226, 106, 30, "\u{1F3AE}"),
      { transform: around(180, 104, Math.min(1.08, pApp)), opacity: Math.min(1, pApp) });
    /* the systems layer */
    if (pSys > 0) out += G(R(108, 150, 144, 64, 12, P.tealSoft, litSys > 0.2 ? P.gold : P.line, litSys > 0.2 ? 3.5 : 2) +
      Em(180, 183, 40, "⚙️"),
      { transform: around(180, 182, Math.min(1.08, pSys)), opacity: Math.min(1, pSys) });
    out += Tx(180, 248, "the computer", "lab", "middle", { "font-size": 17, fill: P.muted, opacity: rest });
    /* data in, information out */
    out += G(Em(32, 143, 32, "\u{1F321}️"), { opacity: rest });
    out += MK.arrow(58, 143, 86, 143, rest, P.accent, 6);
    out += MK.arrow(274, 143, 302, 143, rest, P.good, 6);
    out += G(Em(328, 143, 32, "\u{1F5A5}️"), { opacity: rest });
    /* four files, four sizes */
    SSF_MOTIF_BARS.forEach(function (b, k) {
      var y = 268 + k * 24;
      out += G(Em(66, y, 20, b.pic) + R(88, y - 7, b.w, 14, 7, k > 2 ? P.gold : k > 0 ? P.goldDeep : P.line),
        { opacity: rest });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A computer with an application layer and a systems layer, data coming in and information going out, and four files of different sizes">' +
      out + "</svg>";
  }

  /* ==== chapter: applications do jobs ==========================================
     Four jobs appear first as empty slots - to draw, to read pages, to play,
     to write - and then the application that does each job lands in its slot
     as it is named. The gold border moves from one card to the next, so only
     the card being named is ringed; a card already named keeps a plain border
     until "All four are applications" turns them all green. */
  var SSF_APPS = [
    { pic: "\u{1F3A8}", name: "Paint", job: "to draw" },
    { pic: "\u{1F310}", name: "A browser", job: "to read pages" },
    { pic: "\u{1F3AE}", name: "A game", job: "to play" },
    { pic: "✏️", name: "A writing program", job: "to write" }
  ];
  var SSF_APP_BOX = { x: 28, y: 110, w: 260, h: 280, pitch: 284 };

  function ssfAppCard(k, o, col, fill, tickP) {
    var b = SSF_APP_BOX, a = SSF_APPS[k], x = b.x + k * b.pitch, cx = x + b.w / 2;
    if (!(o > 0)) return "";
    var out = R(x, b.y, b.w, b.h, 22, P.cell, col || P.line, col ? 3.5 : 2) +
      Em(cx, b.y + 104, 94, a.pic) +
      Tx(cx, b.y + 196, a.name, "lab big", "middle", { "font-size": a.name.length > 12 ? 23 : 30 }) +
      Tx(cx, b.y + 236, a.job, "lab mid muted", "middle");
    if (tickP > 0) out += MK.tick(x + b.w - 32, b.y + 32, 20, tickP);
    return G(out, { transform: around(cx, b.y + b.h / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  function ssfAppsChapter(scene, beat, t, i) {
    var cApplication = sc(scene, 0, "application"), cOpen = sc(scene, 0, "open"), cJob = sc(scene, 0, "job");
    var cPaint = sc(scene, 1, "paint"), cBrowser = sc(scene, 1, "browser"), cGame = sc(scene, 1, "game");
    var cWriting = sc(scene, 2, "writing"), cAll = sc(scene, 2, "all");
    var b = SSF_APP_BOX, out = "";
    var at = [cPaint, cBrowser, cGame, cWriting];
    var slots = tally(t, cApplication, 4, 0.9), jobs = tally(t, cJob, 4, 0.8);
    var allDone = ssfPast(t, cAll);

    SSF_APPS.forEach(function (a, k) {
      var x = b.x + k * b.pitch, cx = x + b.w / 2;
      var filled = on(t, at[k], 0.45), pop = popIn(t, at[k], 0.42);
      if (filled < 1) {
        /* the empty slot, with the job it is waiting for */
        var so = (k < slots ? 1 : 0) * (1 - filled);
        out += ssfSlot(x, b.y, b.w, b.h, 22, so);
        if (so > 0 && k < jobs) {
          out += MK.qmark(cx, b.y + 104, 40, so * on(t, cJob, 0.4));
          out += Tx(cx, b.y + 236, a.job, "lab mid muted", "middle", { opacity: so * on(t, cJob == null ? null : cJob + k * 0.2, 0.4) });
        }
      }
      if (pop > 0) {
        var now = ssfNow(t, at[k], 1.3) * (allDone ? 0 : 1);
        out += ssfAppCard(k, pop, ssfCol(now, allDone), null,
          popIn(t, cAll == null ? null : cAll + 0.15 + k * 0.16, 0.35));
        out += MK.ripple(cx, b.y + 104, t, at[k], P.gold);
      }
    });

    /* "you open": a finger on the first slot, before any application is in it */
    var fo = on(t, cOpen, 0.4) * (1 - on(t, cPaint, 0.4));
    out += MK.finger(b.x + b.w / 2, b.y + 132, fo);
    out += MK.ripple(b.x + b.w / 2, b.y + 132, t, cOpen, P.gold);

    /* "All four are applications" */
    out += MK.pill(584, 62, "Applications", on(t, cAll, 0.45), { size: 28, col: P.good, ink: P.good });
    return svg(out);
  }

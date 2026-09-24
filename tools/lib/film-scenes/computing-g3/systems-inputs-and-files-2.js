  /* ==== Systems, Inputs and Files, part 2: whose job, and manual or automatic
     tools/lib/film-scenes/computing-g3/systems-inputs-and-files-2.js. See the
     header of systems-inputs-and-files.js.

     Both chapters are two columns filling in as their own words are said. The
     roles chapter's two real pairs are the lesson's OWN sort-step sentences
     ("Showing a picture on the screen: the screen is hardware; the app
     deciding what picture: software." / "Storing a file: the hard drive is
     hardware; the program that saves it is software.") - not new examples.
     The input chapter's eight devices and two bins are the lesson's own
     "Input detective" step, keyboard/mouse/touchscreen/microphone against
     thermometer/light sensor/barcode scanner/automatic door. */

  /* ==== chapter: whose job is it? =================================================
     Hardware senses, shows, stores, sounds - four icons, one per verb, counted
     out as the words are said. Software decides and calculates - two of the
     lesson's own paired examples (the screen/app pair, the hard drive/program
     pair), then the sum. The last beat draws a line between every pair. */
  var SIF_HW_COL = { x: 40, y: 74, w: 500 };
  var SIF_SW_COL = { x: 628, y: 74, w: 500 };
  var SIF_ROLE_ITEMS = [
    { pic: "⌨️", label: "senses" }, { pic: "\u{1F5A5}\uFE0F", label: "shows" },
    { pic: "\u{1F4BE}", label: "stores" }, { pic: "\u{1F50A}", label: "sounds" }
  ];
  function sifRoleY(k) { return SIF_HW_COL.y + 56 + k * 76; }
  function sifRoleRow(colX, y, pic, label, o, col) {
    if (!(o > 0)) return "";
    return G(R(colX, y, 500, 62, 16, P.cell, col || P.line, 2) +
      Em(colX + 42, y + 31, 40, pic) + Tx(colX + 82, y + 38, label, "lab mid", "start"), { opacity: o });
  }

  function sifRolesChapter(scene, beat, t, i) {
    var cTouch = sc(scene, 0, "touch"), cJob1 = sc(scene, 0, "job1");
    var cShowing = sc(scene, 1, "showing"), cScreenHw2 = sc(scene, 1, "screenhw2"),
      cDeciding = sc(scene, 1, "deciding"), cSw2 = sc(scene, 1, "sw2");
    var cInstr = sc(scene, 2, "instructions"), cDecideCalc = sc(scene, 2, "decidecalc");
    var cStoring = sc(scene, 3, "storing"), cHdHw = sc(scene, 3, "hdhw"),
      cProgSaves = sc(scene, 3, "programsaves"), cSw3 = sc(scene, 3, "sw3");
    var cSum = sc(scene, 4, "sum"), cProcessor = sc(scene, 4, "processor");
    var cEveryJob = sc(scene, 5, "everyjob"), cBoth = sc(scene, 5, "both");
    var out = "";

    out += Tx(SIF_HW_COL.x, SIF_HW_COL.y + 20, "Hardware", "lab big hue", "start", { fill: P.gold, opacity: on(t, cTouch, 0.4) });
    out += Tx(SIF_SW_COL.x, SIF_SW_COL.y + 20, "Software", "lab big hue", "start", { fill: P.blue, opacity: on(t, cInstr, 0.4) });
    out += MK.pop(Em(SIF_SW_COL.x + 128, SIF_SW_COL.y + 16, 30, "\u{1F9E0}"), SIF_SW_COL.x + 128, SIF_SW_COL.y + 16, popIn(t, cDecideCalc, 0.4));

    /* four hardware icons, one per verb, counted out as the words are said */
    var n = tally(t, cJob1, 4, 1.0);
    SIF_ROLE_ITEMS.forEach(function (it, k) {
      if (k >= n) return;
      var lit = (k === 1 && fecPastSafe(t, cShowing) && !fecPastSafe(t, cSw2)) ||
        (k === 2 && fecPastSafe(t, cStoring) && !fecPastSafe(t, cSw3));
      out += sifRoleRow(SIF_HW_COL.x, sifRoleY(k), it.pic, it.label, popIn(t, cJob1 == null ? null : cJob1 + k * 0.16, 0.35), lit ? P.gold : null);
      out += MK.ripple(SIF_HW_COL.x + 42, sifRoleY(k) + 31, t, k === 1 ? cShowing : k === 2 ? cStoring : null, P.gold);
    });
    /* the screen and the hard drive each get their own "hardware" pill,
       right where the sentence names them so */
    out += MK.pill(SIF_HW_COL.x + 340, sifRoleY(1) - 18, "hardware", popIn(t, cScreenHw2, 0.36), { size: 20, col: P.gold, ink: P.gold });
    out += MK.pill(SIF_HW_COL.x + 340, sifRoleY(2) - 18, "hardware", popIn(t, cHdHw, 0.36), { size: 20, col: P.gold, ink: P.gold });

    /* the screen / app-decides pair, appearing together as "deciding" is said */
    var appOn = on(t, cDeciding, 0.45);
    if (appOn > 0) out += sifRoleRow(SIF_SW_COL.x, sifRoleY(1), "\u{1F3A8}", "decides which picture", appOn, P.gold);
    out += MK.leader(SIF_HW_COL.x + 500, sifRoleY(1) + 31, SIF_SW_COL.x, sifRoleY(1) + 31, appOn, P.gold);
    out += MK.pill(SIF_SW_COL.x + 340, sifRoleY(1) - 18, "software", popIn(t, cSw2, 0.36), { size: 20, col: P.blue, ink: P.blue });

    /* the hard drive / program-saves pair, the same way */
    var saveOn = on(t, cProgSaves, 0.45);
    if (saveOn > 0) out += sifRoleRow(SIF_SW_COL.x, sifRoleY(2), "\u{1F4C1}", "saves the file", saveOn, P.gold);
    out += MK.leader(SIF_HW_COL.x + 500, sifRoleY(2) + 31, SIF_SW_COL.x, sifRoleY(2) + 31, saveOn, P.gold);
    out += MK.pill(SIF_SW_COL.x + 340, sifRoleY(2) - 18, "software", popIn(t, cSw3, 0.36), { size: 20, col: P.blue, ink: P.blue });

    /* the sum: software calculates too */
    var sumOn = on(t, cSum, 0.45);
    if (sumOn > 0) out += sifRoleRow(SIF_SW_COL.x, sifRoleY(3), "\u{1F9EE}", "37 + 48", sumOn) +
      Tx(SIF_SW_COL.x + 500, sifRoleY(3) + 38, "the processor", "lab mid muted", "end", { opacity: on(t, cProcessor, 0.4) });

    /* every job has both halves: a tick on each column */
    var both = popIn(t, cBoth, 0.4);
    if (both > 0) {
      out += MK.tick(SIF_HW_COL.x + 470, SIF_HW_COL.y - 4, 24, Math.min(1, both));
      out += MK.tick(SIF_SW_COL.x + 470, SIF_SW_COL.y - 4, 24, Math.min(1, both));
      out += MK.pill(584, 40, "every job: both", Math.min(1, popIn(t, cEveryJob, 0.42)), { size: 22, col: P.good, ink: P.good });
    }
    return svg(out);
  }

  /* ==== chapter: manual, or automatic? =============================================
     The lesson's own two bins and eight devices. The four manual ones arrive
     together as they are all named in one beat; three automatic ones the same
     way, and the automatic door on its own, one beat later. */
  var SIF_MAN_BIN = { x: 34, y: 60, w: 542, h: 356 };
  var SIF_AUTO_BIN = { x: 592, y: 60, w: 542, h: 356 };
  var SIF_MANUAL = [
    { pic: "⌨️", label: "keyboard" }, { pic: "\u{1F5B1}\uFE0F", label: "mouse" },
    { pic: "\u{1F446}", label: "touchscreen" }, { pic: "\u{1F3A4}", label: "microphone" }
  ];
  var SIF_AUTO3 = [
    { pic: "\u{1F321}\uFE0F", label: "thermometer" }, { pic: "\u{1F506}", label: "light sensor" },
    { pic: "\u{1F4E6}", label: "barcode scanner" }
  ];
  function sifDevCard(box, k, cols, pic, label, o) {
    if (!(o > 0)) return "";
    var w = (box.w - 24) / cols, h = 112, x = box.x + 12 + (k % cols) * w, y = box.y + 92 + Math.floor(k / cols) * (h + 14);
    return G(R(x, y, w - 12, h, 16, P.cell, P.line, 2) +
      Em(x + (w - 12) / 2, y + 44, 42, pic) + Tx(x + (w - 12) / 2, y + 90, label, "lab mid", "middle"),
      { opacity: o, transform: around(x + (w - 12) / 2, y + h / 2, 0.94 + 0.06 * Math.min(1, o)) });
  }
  /* the card's own centre, for a leader, a wave or a glow to point at */
  function sifDevCentre(box, k, cols) {
    var w = (box.w - 24) / cols, h = 112, x = box.x + 12 + (k % cols) * w, y = box.y + 92 + Math.floor(k / cols) * (h + 14);
    return [x + (w - 12) / 2, y + h / 2];
  }

  /* beats 7-8: two more automatic inputs, the lesson's own extra examples
     from LESSON["lecture"]'s fifth part, "Automatic inputs that read you" -
     one that reads the person (a fingerprint or a face: biometric) and one
     that reads a tag (RFID, the way a bus pass is read). Both icons are the
     lesson's OWN choices: LESSON["words"]' cards for "biometric" and "RFID"
     use the same pointing-finger and card emoji drawn here. */
  var SIF_READ_BIO = { x: 60, y: 50, w: 500, h: 340 };
  var SIF_READ_RFID = { x: 608, y: 50, w: 500, h: 340 };

  function sifInputsChapter(scene, beat, t, i) {
    var cManual = sc(scene, 0, "manual"), cPerson = sc(scene, 0, "person");
    var cKb2 = sc(scene, 1, "kb2"), cMouse = sc(scene, 1, "mouse"), cTouch2 = sc(scene, 1, "touch2"), cMic = sc(scene, 1, "mic");
    var cAuto = sc(scene, 2, "automatic"), cSensor = sc(scene, 2, "sensor"), cNoPerson = sc(scene, 2, "noperson");
    var cThermo = sc(scene, 3, "thermo"), cLight = sc(scene, 3, "light"), cBarcode = sc(scene, 3, "barcode"), cSenses = sc(scene, 3, "senses");
    var cDoor = sc(scene, 4, "door"), cSpots = sc(scene, 4, "spots"), cByItself = sc(scene, 4, "byitself");
    var cNotBetter = sc(scene, 5, "notbetter"), cNoPerson2 = sc(scene, 5, "noperson2"), cRightJob = sc(scene, 5, "rightjob");
    var cAutomatic2 = sc(scene, 6, "automatic2"), cFingerprint = sc(scene, 6, "fingerprint"),
      cFace = sc(scene, 6, "face"), cBiometric = sc(scene, 6, "biometric");
    var cTag = sc(scene, 7, "tag"), cRfid = sc(scene, 7, "rfid"), cWave = sc(scene, 7, "wave"), cBuspass = sc(scene, 7, "buspass");
    var out = "", chain = "", toRead = into(t, scene.first + 6);

    chain += G(R(SIF_MAN_BIN.x, SIF_MAN_BIN.y, SIF_MAN_BIN.w, SIF_MAN_BIN.h, 24, "none", P.gold, 3), { opacity: on(t, cManual, 0.5) });
    chain += MK.pop(Em(SIF_MAN_BIN.x + 40, SIF_MAN_BIN.y + 36, 42, "\u{1F590}\uFE0F"), SIF_MAN_BIN.x + 40, SIF_MAN_BIN.y + 36, popIn(t, cManual, 0.4));
    chain += Tx(SIF_MAN_BIN.x + 80, SIF_MAN_BIN.y + 44, "Manual: a person does it", "lab big", "start", { opacity: on(t, cPerson, 0.4) });

    chain += G(R(SIF_AUTO_BIN.x, SIF_AUTO_BIN.y, SIF_AUTO_BIN.w, SIF_AUTO_BIN.h, 24, "none", P.plum, 3), { opacity: on(t, cAuto, 0.5) });
    chain += MK.pop(Em(SIF_AUTO_BIN.x + 40, SIF_AUTO_BIN.y + 36, 42, "\u{1F916}"), SIF_AUTO_BIN.x + 40, SIF_AUTO_BIN.y + 36, popIn(t, cAuto, 0.4));
    chain += Tx(SIF_AUTO_BIN.x + 80, SIF_AUTO_BIN.y + 44, "Automatic: a sensor does it", "lab big", "start", { opacity: on(t, cSensor, 0.4) });

    var manN = tally(t, cKb2, 4, 1.3);
    var manAt = [cKb2, cMouse, cTouch2, cMic];
    SIF_MANUAL.forEach(function (d, k) {
      if (k >= manN) return;
      chain += sifDevCard(SIF_MAN_BIN, k, 2, d.pic, d.label, popIn(t, manAt[k], 0.36));
    });

    var autoN = tally(t, cThermo, 3, 1.0);
    var autoAt = [cThermo, cLight, cBarcode];
    SIF_AUTO3.forEach(function (d, k) {
      if (k >= autoN) return;
      chain += sifDevCard(SIF_AUTO_BIN, k, 2, d.pic, d.label, popIn(t, autoAt[k], 0.36));
    });
    /* "each senses without being asked": the three cards just placed flash together */
    var senseFl = bump(t, cSenses, 1.1);
    if (senseFl > 0) [0, 1, 2].forEach(function (k) {
      if (k >= autoN) return;
      var c = sifDevCentre(SIF_AUTO_BIN, k, 2);
      chain += R(c[0] - 118, c[1] - 55, 236, 110, 18, "none", P.plum, 5, { opacity: senseFl });
    });

    var doorC = sifDevCentre(SIF_AUTO_BIN, 3, 2);
    if (fecPastSafe(t, cDoor)) chain += sifDevCard(SIF_AUTO_BIN, 3, 2, "\u{1F6AA}", "automatic door", popIn(t, cDoor, 0.4));
    chain += MK.waves(doorC[0], doorC[1], t, cSpots, { dir: -Math.PI / 2, n: 2, reach: 70, col: P.plum });
    /* "all by itself": the door's own glow, once it has opened */
    chain += MK.glow(doorC[0], doorC[1], 90, P.plum, Math.min(1, bump(t, cByItself, 1.3)) * 0.7 + (fecPastSafe(t, cByItself) ? 0.18 : 0));

    /* no person: manual has a person icon, automatic does not */
    chain += MK.cross(SIF_AUTO_BIN.x + SIF_AUTO_BIN.w - 34, SIF_AUTO_BIN.y + 36, 20, popIn(t, cNoPerson, 0.35));

    /* not better, just different: a balance between the two bins */
    var bal = popIn(t, cNotBetter, 0.4);
    if (bal > 0) {
      chain += MK.pop(Em(584, 236, 60, "⚖️"), 584, 236, bal);
      chain += MK.tick(SIF_MAN_BIN.x + 30, SIF_MAN_BIN.y + SIF_MAN_BIN.h - 20, 22, popIn(t, cRightJob, 0.4));
      chain += MK.tick(SIF_AUTO_BIN.x + 30, SIF_AUTO_BIN.y + SIF_AUTO_BIN.h - 20, 22, popIn(t, cRightJob, 0.4));
      chain += MK.pill(584, 300, "no person needed", popIn(t, cNoPerson2, 0.42), { size: 20, col: P.plum, ink: P.plum });
    }
    /* the eight-device grid fades once the two extra automatic inputs arrive */
    out += G(chain, { opacity: Math.max(0, 1 - toRead) });

    if (toRead > 0) {
      /* left: automatic inputs that read the person - a fingerprint or a face */
      var bioOn = popIn(t, cAutomatic2, 0.45);
      if (bioOn > 0) {
        out += G(R(SIF_READ_BIO.x, SIF_READ_BIO.y, SIF_READ_BIO.w, SIF_READ_BIO.h, 24, "none", P.plum, 3), { opacity: bioOn });
        out += MK.pop(Em(SIF_READ_BIO.x + SIF_READ_BIO.w / 2, SIF_READ_BIO.y + 90, 86, "\u{1F446}"),
          SIF_READ_BIO.x + SIF_READ_BIO.w / 2, SIF_READ_BIO.y + 90, bioOn);
      }
      var fpOn = Math.min(1, popIn(t, cFingerprint, 0.4));
      if (fpOn > 0) out += MK.pill(SIF_READ_BIO.x + 130, SIF_READ_BIO.y + 190, "a fingerprint", fpOn, { size: 20, col: P.plum, ink: P.plum });
      var faceOn = Math.min(1, popIn(t, cFace, 0.4));
      if (faceOn > 0) out += MK.pop(Em(SIF_READ_BIO.x + 350, SIF_READ_BIO.y + 190, 30, "\u{1F642}"), SIF_READ_BIO.x + 350, SIF_READ_BIO.y + 190, faceOn) +
        MK.pill(SIF_READ_BIO.x + 400, SIF_READ_BIO.y + 190, "a face", faceOn, { size: 20, col: P.plum, ink: P.plum, anchor: "start" });
      out += MK.pill(SIF_READ_BIO.x + SIF_READ_BIO.w / 2, SIF_READ_BIO.y + SIF_READ_BIO.h - 34, "biometric",
        popIn(t, cBiometric, 0.42), { size: 24, col: P.gold, ink: P.gold, fill: "#3A2F12" });

      /* right: automatic inputs that read a tag - RFID, the way a bus pass is read */
      var tagOn = popIn(t, cTag, 0.45);
      if (tagOn > 0) {
        out += G(R(SIF_READ_RFID.x, SIF_READ_RFID.y, SIF_READ_RFID.w, SIF_READ_RFID.h, 24, "none", P.plum, 3), { opacity: tagOn });
        out += MK.pop(Em(SIF_READ_RFID.x + 130, SIF_READ_RFID.y + 150, 76, "\u{1F4B3}"), SIF_READ_RFID.x + 130, SIF_READ_RFID.y + 150, tagOn);
      }
      out += MK.pill(SIF_READ_RFID.x + 130, SIF_READ_RFID.y + 232, "RFID", on(t, cRfid, 0.4), { size: 20, col: P.plum, ink: P.plum });
      out += MK.waves(SIF_READ_RFID.x + 250, SIF_READ_RFID.y + 150, t, cWave, { dir: 0, spread: 1.4, n: 2, reach: 70, col: P.plum });
      var busOn = popIn(t, cBuspass, 0.45);
      if (busOn > 0) out += MK.pop(Em(SIF_READ_RFID.x + 370, SIF_READ_RFID.y + 150, 76, "\u{1F68C}"), SIF_READ_RFID.x + 370, SIF_READ_RFID.y + 150, busOn);
      out += MK.pill(SIF_READ_RFID.x + 370, SIF_READ_RFID.y + 232, "a bus pass", Math.min(1, popIn(t, cBuspass, 0.42)), { size: 20, col: P.plum, ink: P.plum });
    }
    return svg(out);
  }

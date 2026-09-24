  /* ==== Software, Sensors and Files, part 3: data in, information out =========
     tools/lib/film-scenes/computing-g4/software-sensors-and-files-3.js. See the
     header of software-sensors-and-files.js.

     Every device here, and every reading on it, is the lesson's own: the
     keyboard's h e l l o, the sensor's 21 degrees, the logger's four readings,
     the motion sensor's runner icon, the screen's 22 degrees, the speaker's
     battery low, the printer's class list, the fridge's red light. Computing
     has no ART.sim, so the device rows and the data-flow arrow are drawn here
     in the engine's idiom; nothing in this film invents a reading the lesson
     does not already give. */

  /* ---- a device row, shared by inputs (data flowing in) and outputs (data
     flowing out): an icon, the lesson's own label, and the lesson's own
     reading, gold while it is being named and settled once it is done. ---- */
  var SSF_ROW = { x: 40, w: 470, h: 54, gap: 8 };
  function ssfRowY(k) { return 20 + k * (SSF_ROW.h + SSF_ROW.gap); }
  /* revealO: the reading's own opacity, separate from the row's - so a beat
     that names the row AND, a moment later, the reading itself ("the letters
     a person types", "how warm it is") can move the reading in on its own
     word rather than have it arrive early with the row. extra: a second small
     icon, popped in beside the tick, for a beat that names one more thing
     about the row ("all by itself", "a sensor with a memory"). */
  function ssfDeviceRow(k, item, state, o, showsText, revealO, extra) {
    if (!(o > 0)) return "";
    var r = SSF_ROW, y = ssfRowY(k), col = state === "now" ? P.gold : state === "done" ? P.good : P.line;
    var sw = state === "now" ? 3.5 : 2;
    var out = R(r.x, y, r.w, r.h, 14, P.cell, col, sw, { opacity: clamp(o, 0, 1) }) +
      Em(r.x + 34, y + r.h / 2, 32, item.pic, { opacity: clamp(o, 0, 1) }) +
      Tx(r.x + 64, y + r.h / 2 - 4, item.label, "lab mid", "start", { opacity: clamp(o, 0, 1), "font-size": 20 });
    var sh = showsText == null ? item.shows : showsText;
    var showO = revealO == null ? 1 : revealO;
    if (sh) out += Tx(r.x + 64, y + r.h / 2 + 17, sh, "lab small muted", "start",
      { opacity: clamp(o, 0, 1) * (state === "wait" ? 0 : 1) * showO });
    if (extra && extra.p > 0) out += G(Em(r.x + r.w - 58, y + r.h / 2, 26, extra.pic),
      { transform: around(r.x + r.w - 58, y + r.h / 2, Math.min(1.06, extra.p)), opacity: Math.min(1, extra.p) });
    if (state === "done") out += MK.tick(r.x + r.w - 26, y + r.h / 2, 15, 1);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: input devices record data ====================================
     Six of the lesson's own inputs, named one at a time, each settling once
     the next is named. On the right, the data itself: it goes IN, so a tray
     collects one chip per device. The logger's own beat - "every minute all
     night" - grows ITS OWN ROW's reading, the same four the lesson gives it,
     one at a time, then boxes them as "kept". */
  var SSF_IN = [
    { id: "keyboard", pic: "⌨️", label: "Keyboard", shows: "h e l l o", beat: 1, cue: "keyboard", reveal: "letters" },
    { id: "camera", pic: "\u{1F4F7}", label: "Camera", shows: "a picture", beat: 2, cue: "camera" },
    { id: "mic", pic: "\u{1F3A4}", label: "Microphone", shows: "a sound", beat: 2, cue: "mic" },
    { id: "sensor", pic: "\u{1F321}️", label: "Temperature sensor", shows: "21°C", beat: 3, cue: "sensor", reveal: "warm", extraCue: "itself", extraPic: "\u{1F916}" },
    { id: "motion", pic: "\u{1F3C3}", label: "Motion sensor", shows: "moved!", beat: 4, cue: "motion", reveal: "moved" },
    { id: "logger", pic: "\u{1F4C8}", label: "Data logger", shows: "", beat: 5, cue: "logger", extraCue: "memory", extraPic: "\u{1F9E0}" }
  ];
  var SSF_TRAY = { x: 820, y: 42, w: 260, h: 232 };

  function ssfInputsChapter(scene, beat, t, i) {
    var cRecord = sc(scene, 0, "record"), cIn = sc(scene, 0, "in");
    var cues = {}, revealCues = {}, extraCues = {};
    SSF_IN.forEach(function (d) {
      cues[d.id] = sc(scene, d.beat, d.cue);
      if (d.reveal) revealCues[d.id] = sc(scene, d.beat, d.reveal);
      if (d.extraCue) extraCues[d.id] = sc(scene, d.beat, d.extraCue);
    });
    var cEvery = sc(scene, 6, "every"), cKeeps = sc(scene, 6, "keeps");
    var out = "";

    /* the tray: data goes IN, so the arrow points down into it, and each
       device named so far leaves one chip inside */
    out += MK.arrow(SSF_TRAY.x + SSF_TRAY.w / 2, 8, SSF_TRAY.x + SSF_TRAY.w / 2, 36, on(t, cIn, 0.5), P.accent, 8);
    out += R(SSF_TRAY.x, SSF_TRAY.y, SSF_TRAY.w, SSF_TRAY.h, 18, P.card, P.accent, 3, { opacity: on(t, cRecord, 0.5) });
    out += Tx(SSF_TRAY.x + SSF_TRAY.w / 2, SSF_TRAY.y + SSF_TRAY.h + 24, "data", "lab mid muted readable", "middle",
      { opacity: on(t, cRecord, 0.5).toFixed(3) });

    var chips = 0;
    var readings = ["20°", "21°", "21°", "22°"];
    var loggerN = tally(t, cEvery, readings.length, 2.2);
    var kept = ssfPast(t, cKeeps);

    SSF_IN.forEach(function (item, k) {
      var at = cues[item.id];
      var now = at != null && t >= at && t < at + 1.3;
      var doneRow = at != null && t >= at + 1.3;
      var state = now ? "now" : doneRow ? "done" : "wait";
      var o = on(t, at, 0.4);
      var showsText = item.shows;
      if (item.id === "logger") {
        showsText = readings.slice(0, loggerN).join(" ");
        if (kept) { state = "done"; }
      }
      var revealO = item.reveal ? on(t, revealCues[item.id], 0.4) : null;
      var extra = item.extraCue ? { pic: item.extraPic, p: popIn(t, extraCues[item.id], 0.42) } : null;
      out += ssfDeviceRow(k, item, state, o, showsText, revealO, extra);
      if (item.id === "logger" && kept)
        out += MK.pill(SSF_ROW.x + SSF_ROW.w + 44, ssfRowY(k) + SSF_ROW.h / 2, "keeps them all",
          on(t, cKeeps, 0.45), { size: 18, col: P.good, ink: P.good, anchor: "start" });
      if (doneRow) {
        chips++;
        var cx = SSF_TRAY.x + 34 + ((chips - 1) % 3) * 82, cy = SSF_TRAY.y + 42 + Math.floor((chips - 1) / 3) * 68;
        out += G(R(cx - 24, cy - 24, 48, 48, 10, P.cell, P.accent, 2) + Em(cx, cy, 30, item.pic),
          { transform: around(cx, cy, Math.min(1.06, popIn(t, at + 1.2, 0.4))) });
      }
    });
    return svg(out);
  }

  /* ==== chapter: output devices communicate ====================================
     Four of the lesson's own outputs, the same row and the same rhythm,
     mirrored: the arrow now leads OUT, to the person watching. */
  var SSF_OUT = [
    { id: "screen", pic: "\u{1F5A5}️", label: "Screen", shows: "22°C today", beat: 1, cue: "screen", extraCue: "weather", extraPic: "☀️", reveal: "degrees" },
    { id: "speaker", pic: "\u{1F50A}", label: "Speaker", shows: "battery low", beat: 2, cue: "speaker", reveal: "low" },
    { id: "printer", pic: "\u{1F5A8}️", label: "Printer", shows: "the class list", beat: 3, cue: "printer", reveal: "list", extraCue: "paper", extraPic: "\u{1F4C4}" },
    { id: "light", pic: "\u{1F534}", label: "Warning light", shows: "fridge door open", beat: 4, cue: "red", reveal: "fridge" }
  ];

  function ssfOutputsChapter(scene, beat, t, i) {
    var cCommunicate = sc(scene, 0, "communicate"), cOut = sc(scene, 0, "out");
    var cues = {}, revealCues = {}, extraCues = {};
    SSF_OUT.forEach(function (d) {
      cues[d.id] = sc(scene, d.beat, d.cue);
      if (d.reveal) revealCues[d.id] = sc(scene, d.beat, d.reveal);
      if (d.extraCue) extraCues[d.id] = sc(scene, d.beat, d.extraCue);
    });
    var cVoice = sc(scene, 2, "voice"), cOne = sc(scene, 4, "one");
    var out = "";

    out += R(SSF_TRAY.x, SSF_TRAY.y, SSF_TRAY.w, SSF_TRAY.h, 18, P.card, P.good, 3, { opacity: on(t, cCommunicate, 0.5) });
    out += Tx(SSF_TRAY.x + SSF_TRAY.w / 2, SSF_TRAY.y - 14, "information", "lab mid muted readable", "middle",
      { opacity: on(t, cCommunicate, 0.5).toFixed(3) });
    out += MK.arrow(SSF_TRAY.x + SSF_TRAY.w / 2, SSF_TRAY.y + SSF_TRAY.h + 6, SSF_TRAY.x + SSF_TRAY.w / 2, SSF_TRAY.y + SSF_TRAY.h + 40,
      on(t, cOut, 0.5), P.good, 8);
    out += Em(SSF_TRAY.x + SSF_TRAY.w / 2, SSF_TRAY.y + SSF_TRAY.h + 70, 38, "\u{1F9D2}", { opacity: on(t, cOut, 0.5) });

    var chips = 0;
    SSF_OUT.forEach(function (item, k) {
      var at = cues[item.id];
      var now = at != null && t >= at && t < at + 1.4;
      var doneRow = at != null && t >= at + 1.4;
      var state = now ? "now" : doneRow ? "done" : "wait";
      var o = on(t, at, 0.4);
      var revealO = item.reveal ? on(t, revealCues[item.id], 0.4) : null;
      var extra = item.extraCue ? { pic: item.extraPic, p: popIn(t, extraCues[item.id], 0.42) } : null;
      out += ssfDeviceRow(k, item, state, o, null, revealO, extra);
      if (now || doneRow) {
        chips++;
        var cx = SSF_TRAY.x + 34 + ((chips - 1) % 3) * 82, cy = SSF_TRAY.y + 42 + Math.floor((chips - 1) / 3) * 68;
        out += G(R(cx - 24, cy - 24, 48, 48, 10, P.cell, P.good, 2) + Em(cx, cy, 30, item.pic),
          { transform: around(cx, cy, Math.min(1.06, popIn(t, at + 0.9, 0.4))) });
      }
    });

    /* "A voice note is information as sound": waves from the speaker's own
       row, rather than a second speaker drawn over it */
    var speakerY = ssfRowY(1) + SSF_ROW.h / 2;
    out += MK.waves(SSF_ROW.x + 34, speakerY, t, cVoice, { dir: -Math.PI / 2, spread: 1.4, reach: 60, col: P.good });

    /* "one light, one piece of information": the row's own red light,
       breathing, with the count named beside it rather than a second card */
    var lightY = ssfRowY(3) + SSF_ROW.h / 2;
    if (on(t, cues.light, 0.4) > 0) {
      var flash = bump(t, cues.light, 1.6);
      if (flash > 0.02) out += MK.glow(SSF_ROW.x + 34, lightY, 44, P.bad, flash * 0.7);
    }
    out += MK.pill(SSF_ROW.x + SSF_ROW.w / 2, lightY + 60, "one light, one piece of information",
      on(t, cOne, 0.5), { size: 18, col: P.good, ink: P.good });
    return svg(out);
  }

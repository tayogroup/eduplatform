  /* ==== Grade 4 Computing, Lesson 4: Inputs Decide Outputs ====================
     tools/lib/film-scenes/computing-g4/inputs-decide-outputs.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/inputs-decide-outputs.json.

     WHICH BRANCH IS LIT IS NEVER THE FILM'S OPINION. A branch film's easiest
     fault is drawing the wrong arm as taken, so no frame here decides one:
     every lit arm comes from the lesson's own ART.algo.branchRun run on the
     lesson's own round, and the unrolled step count from ART.algo.expandLoop.
     The rounds below are the three in lesson-4.py's "branch" and "branchbuild"
     steps, copied field for field; the RULE that reads them is the kit's.
     -3.js ends with a load-time check that the pictures agree with it.

     There is no ART.sim in Computing (see the brief), so the flow chart, the
     repeat box and the unrolled strip are drawn here, in the engine's idiom.

     This file: the palette, the step cards, the flow chart every branch
     chapter shares, the title motif and the chapter "One question, two
     answers". Every top-level name starts with ido. */

  var HUE = {
    title: P.teal, fork: P.gold, inputs: P.accent, write: P.plum,
    loop: P.good, unroll: P.blue, recap: P.teal
  };

  /* ---- the lesson's own rounds ------------------------------------------------
     lesson-4.py :: LESSON["steps"], the "branch" and "branchbuild" configs.
     ART.algo.branchRun takes inputs[0].id as the yes arm, so the ids and their
     order matter and are kept exactly as the lesson has them. */

  var IDO_SCHOOL = {
    task: "leave for school", question: "is it raining?",
    inputs: [{ id: "yes", label: "Yes, it is raining", pic: "\u{1F327}️" },
             { id: "no", label: "No, it is sunny", pic: "☀️" }],
    before: [{ id: "dress", label: "Get dressed", pic: "\u{1F455}" },
             { id: "bag", label: "Pick up your bag", pic: "\u{1F392}" }],
    yes: [{ id: "coat", label: "Put on your raincoat", pic: "\u{1F9E5}" },
          { id: "umbrella", label: "Take the umbrella", pic: "☂️" }],
    no: [{ id: "glasses", label: "Put on sunglasses", pic: "\u{1F576}️" },
         { id: "hat", label: "Take a sun hat", pic: "\u{1F452}" }],
    after: [{ id: "walk", label: "Walk to school", pic: "\u{1F6B6}" }]
  };

  var IDO_QUIZ = {
    task: "answer a quiz question", question: "is the answer right?",
    inputs: [{ id: "right", label: "Yes, it is right", pic: "✅" },
             { id: "wrong", label: "No, it is wrong", pic: "❌" }],
    before: [{ id: "read", label: "Read the answer", pic: "\u{1F440}" }],
    yes: [{ id: "tick", label: "Show a tick", pic: "✅" },
          { id: "point", label: "Add a point", pic: "⭐" },
          { id: "welldone", label: "Say well done", pic: "\u{1F389}" }],
    no: [{ id: "cross", label: "Show a cross", pic: "❌" },
         { id: "hint", label: "Show a hint", pic: "\u{1F4A1}" }],
    after: [{ id: "next", label: "Go to the next question", pic: "➡️" }]
  };

  var IDO_BOOK = {
    task: "borrow a library book", question: "is the book on the shelf?",
    inputs: [{ id: "yes", label: "Yes, it is on the shelf", pic: "\u{1F4DA}" },
             { id: "no", label: "No, someone has it", pic: "\u{1F6AB}" }],
    before: [{ id: "look", label: "Look on the shelf for the book", pic: "\u{1F50D}" }],
    yes: [{ id: "desk", label: "Take it to the desk", pic: "\u{1F4D6}" },
          { id: "card", label: "Scan your library card", pic: "\u{1F4C7}" }],
    no: [{ id: "save", label: "Ask for it to be saved for you", pic: "\u{1F4DD}" }],
    after: [{ id: "thanks", label: "Say thank you to the librarian", pic: "\u{1F642}" }]
  };

  /* The lesson's rule, not a copy of it: the whole run for one input, and the
     arm alone (the run with the before and after steps taken off the ends). */
  function idoRun(round, inputId) { return ART.algo.branchRun(round, inputId); }
  function idoArm(round, inputId) {
    var full = idoRun(round, inputId);
    return full.slice(round.before.length, full.length - round.after.length);
  }

  /* ---- timing ----------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function idoOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on */
  function idoFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  function idoPast(t, at) { return at != null && t >= at; }
  /* the first of these cues that has a time, or null */
  function idoAny() {
    for (var k = 0; k < arguments.length; k++) if (arguments[k] != null) return arguments[k];
    return null;
  }

  /* ---- words ------------------------------------------------------------------- */

  /* up to `lines` lines of at most `max` characters, split at spaces */
  function idoWrap(text, max, lines) {
    var words = String(text).split(" "), out = [], cur = "";
    for (var k = 0; k < words.length; k++) {
      var next = cur ? cur + " " + words[k] : words[k];
      if (next.length > max && cur) { out.push(cur); cur = words[k]; } else cur = next;
    }
    if (cur) out.push(cur);
    if (lines && out.length > lines) out = out.slice(0, lines - 1).concat([out.slice(lines - 1).join(" ")]);
    return out;
  }

  /* ---- the two things this film draws itself ------------------------------------ */

  /* A watering can. The lesson's own step carries a shower head for "get the can
     out of the shed" and a door for "put the can away"; a film that says "the
     can" beside a shower would break the brief's rule 8, so the can is drawn.
     Reported in the film's notes, not fixed in the lesson. */
  function idoCan(cx, cy, s, o, col) {
    if (!(o > 0)) return "";
    col = col || P.plastic;
    var w = s * 0.62, h = s * 0.46;
    var body = R(cx - w / 2, cy - h / 2, w, h, s * 0.10, col, P.edge, 2) +
      Pth("M" + n2(cx - w / 2) + "," + n2(cy - h / 2 + 4) +
        " L" + n2(cx - w / 2 - s * 0.34) + "," + n2(cy - h / 2 - s * 0.16) +
        " L" + n2(cx - w / 2 - s * 0.30) + "," + n2(cy - h / 2 - s * 0.04) +
        " L" + n2(cx - w / 2) + "," + n2(cy + h / 2 - 6) + " Z", col, P.edge, 2) +
      Pth("M" + n2(cx + w / 2 - 2) + "," + n2(cy - h / 2 + 3) +
        " q" + n2(s * 0.22) + ",0 " + n2(s * 0.22) + "," + n2(h * 0.5) +
        " q0," + n2(h * 0.42) + " -" + n2(s * 0.18) + "," + n2(h * 0.42), null, P.edge, 4) +
      R(cx - w / 2 + 3, cy - h / 2 - 5, w * 0.34, 6, 3, P.edge);
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* one of the lesson's step pictures, or the drawn can for the three can steps */
  var IDO_CAN_STEPS = { can: 1, fill: 1, away: 1 };
  function idoPic(cx, cy, size, step, o) {
    if (step && IDO_CAN_STEPS[step.id]) {
      return idoCan(cx, cy, size * 1.06, o == null ? 1 : o) +
        (step.id === "fill" ? Em(cx - size * 0.30, cy - size * 0.40, size * 0.34, "\u{1F4A7}") : "") +
        (step.id === "away" ? Em(cx + size * 0.34, cy - size * 0.34, size * 0.34, "\u{1F6AA}") : "");
    }
    return Em(cx, cy, size, step ? step.pic : "");
  }

  /* ---- step cards ---------------------------------------------------------------
     A ROW: the picture on the left and the words on one line beside it, for the
     steps that stand in a program. opt: {o, col, fill, size, fade, mark, markP} */
  function idoRow(x, y, w, h, step, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0) || !step) return "";
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2, fs = opt.size || 20;
    var body = R(x, y, w, h, h * 0.28, opt.fill || P.cell, col, sw) +
      idoPic(x + h * 0.52, y + h / 2, h * 0.56, step) +
      Tx(x + h * 1.02, y + h / 2 + fs * 0.35, step.label, "lab", "start", { "font-size": fs });
    if (opt.mark) {
      var mx = x + w - h * 0.42, my = y + h / 2, mr = h * 0.26, p = opt.markP == null ? 1 : opt.markP;
      body += opt.mark === "tick" ? MK.tick(mx, my, mr, p) : MK.cross(mx, my, mr, p);
    }
    return G(body, { opacity: clamp(o, 0, 1) * (opt.fade == null ? 1 : opt.fade) });
  }

  /* A CHIP: the picture above its words, for the steps that stand in a row. */
  function idoChip(x, y, w, h, step, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0) || !step) return "";
    var col = opt.col || P.line, fs = opt.size || 17;
    var lines = idoWrap(step.label, Math.max(8, Math.floor((w - 16) / (fs * 0.55))), 2);
    var top = h * (lines.length > 1 ? 0.33 : 0.38);
    var body = R(x, y, w, h, 18, opt.fill || P.cell, col, opt.col ? 3.5 : 2) +
      idoPic(x + w / 2, y + top, h * 0.40, step);
    lines.forEach(function (ln, k) {
      body += Tx(x + w / 2, y + h - 18 - (lines.length - 1 - k) * (fs + 4), ln, "lab", "middle", { "font-size": fs });
    });
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  /* ==== the flow chart ==========================================================
     The picture the three branch chapters share, in the 1168 x 440 space:

         +-- before steps --+        +===== YES lane ==========+
         |   the question   |  -->   +=========================+
         +------------------+  -->   +===== NO lane ===========+
         +---------- then, either way: the after steps --------+

     Nothing in here chooses an arm. idoFlow is given `lit`, and every caller
     gets `lit` from idoRun / idoArm, which are the kit's own branchRun. */

  var FLOW = {
    left: { x: 16, w: 392 },
    rowH: 56, rowGap: 8,
    q: { y: 160, h: 170 },
    lane: { x: 476, w: 676, h: 174, yes: 6, no: 196, head: 46, rowH: 46, gap: 12 },
    bar: { x: 16, y: 384, w: 1136, h: 52 }
  };
  function idoLaneY(which) { return which === "yes" ? FLOW.lane.yes : FLOW.lane.no; }
  /* where the k-th of `slots` rows sits inside a lane */
  function idoLaneRowY(which, slots, k) {
    var L2 = FLOW.lane, y = idoLaneY(which);
    var top = y + L2.head + (L2.h - L2.head - slots * L2.rowH - (slots - 1) * L2.gap) / 2;
    return top + k * (L2.rowH + L2.gap);
  }

  /* the before steps, stacked and centred above the question box */
  function idoBefore(round, o, opt) {
    opt = opt || {};
    var n = round.before.length, h = FLOW.rowH, gap = FLOW.rowGap;
    var top = (FLOW.q.y - 16 - n * h - (n - 1) * gap) / 2 + 8, out = "";
    round.before.forEach(function (st, k) {
      out += idoRow(FLOW.left.x, top + k * (h + gap), FLOW.left.w, h, st,
        { o: typeof o === "function" ? o(k, st) : o, col: opt.col, fill: opt.fill, fade: opt.fade });
    });
    return out;
  }

  /* the question box: a ? badge, the lesson's own question, and the input that
     answered it when one has been given */
  function idoQuestion(round, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var b = FLOW.q, x = FLOW.left.x, w = FLOW.left.w, cx = x + w / 2;
    var col = opt.col || P.line;
    var out = R(x, b.y, w, b.h, 26, P.card, col, opt.col ? 4 : 2);
    out += C(cx, b.y + 54, 34, P.cell, col, 3);
    out += Tx(cx, b.y + 68, "?", "lab", "middle", { "font-size": 48, fill: opt.col || P.muted });
    var tx = opt.text == null ? 1 : opt.text;
    if (tx > 0) {
      idoWrap(round.question, 28, 2).forEach(function (ln, k, all) {
        out += Tx(cx, b.y + 126 + k * 32 - (all.length - 1) * 4, ln, "lab", "middle",
          { "font-size": 25, opacity: clamp(tx, 0, 1) });
      });
    }
    if (opt.input) {
      var ip = opt.inputP == null ? 1 : opt.inputP;
      out += MK.pop(C(x + w - 40, b.y + 40, 27, P.cell, P.gold, 3) + Em(x + w - 40, b.y + 40, 30, opt.input.pic),
        x + w - 40, b.y + 40, ip);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* one lane: its header (the answer and the input that gives it) and the arm's
     steps. `steps` is what the kit returned, never a list this file picked. */
  function idoLane(which, round, steps, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var L2 = FLOW.lane, y = idoLaneY(which), x = L2.x, w = L2.w;
    var col = opt.col || P.line, input = round.inputs[which === "yes" ? 0 : 1];
    var out = R(x, y, w, L2.h, 22, opt.fill || P.card, col, opt.col ? 4 : 2);
    out += L(x + 16, y + L2.head, x + w - 16, y + L2.head, col, 2, { opacity: 0.6 });
    out += MK.pill(x + 22, y + L2.head / 2 + 1, which === "yes" ? "Yes" : "No",
      opt.headP == null ? 1 : opt.headP,
      { size: 21, anchor: "start", col: col, ink: opt.col || P.ink, fill: P.cell });
    var hp = opt.headP == null ? 1 : opt.headP;
    if (hp > 0) {
      out += G(Em(x + 128, y + L2.head / 2, 28, input.pic) +
        Tx(x + 150, y + L2.head / 2 + 7, input.label, "lab", "start", { "font-size": 19, fill: P.muted }),
        { opacity: clamp(hp, 0, 1) });
    }
    var n = opt.slots || steps.length;
    steps.forEach(function (st, k) {
      out += idoRow(x + 22, idoLaneRowY(which, n, k), w - 44, L2.rowH, st,
        { o: typeof opt.step === "function" ? opt.step(k, st) : (opt.step == null ? 1 : opt.step),
          size: 21, col: opt.stepCol, fill: opt.stepFill });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the bar under both lanes: the steps that run whatever the answer */
  function idoBar(round, o, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var b = FLOW.bar, col = opt.col || P.line;
    var out = R(b.x, b.y, b.w, b.h, 20, opt.fill || P.card, col, opt.col ? 4 : 2);
    out += Tx(b.x + 26, b.y + b.h / 2 + 7, "Then, either way:", "lab", "start",
      { "font-size": 20, fill: opt.col || P.muted });
    var x0 = b.x + 214, cw = 330;
    round.after.forEach(function (st, k) {
      out += idoRow(x0 + k * (cw + 12), b.y + 6, cw, b.h - 12, st,
        { o: opt.step == null ? 1 : opt.step, size: 20, col: opt.stepCol, fill: P.cell });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the two arrows out of the question box, and the two that come back */
  function idoArrows(t, o, litYes, litNo) {
    if (!(o > 0)) return "";
    var qx = FLOW.left.x + FLOW.left.w + 6, lx = FLOW.lane.x - 8;
    var yesY = FLOW.lane.yes + FLOW.lane.h / 2, noY = FLOW.lane.no + FLOW.lane.h / 2;
    var out = "";
    out += MK.arrow(qx, 226, lx, yesY, o, litYes > 0 ? P.good : P.line, litYes > 0 ? 8 : 5);
    out += MK.arrow(qx, 268, lx, noY, o, litNo > 0 ? P.good : P.line, litNo > 0 ? 8 : 5);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the whole chart, from one description ------------------------------------
     cfg: {round, before, question, qText, qCol, input, inputP, yes, no,
           yesSteps, noSteps, yesCol, noCol, yesStep, noStep, bar, barCol,
           barStep, arrows, litYes, litNo} */
  function idoFlow(t, cfg) {
    var out = "";
    out += idoBefore(cfg.round, cfg.before, { col: cfg.beforeCol, fade: cfg.beforeFade });
    out += idoQuestion(cfg.round, cfg.question, { text: cfg.qText, col: cfg.qCol, input: cfg.input, inputP: cfg.inputP });
    out += idoArrows(t, cfg.arrows, cfg.litYes || 0, cfg.litNo || 0);
    out += idoLane("yes", cfg.round, cfg.yesSteps || [], cfg.yes, { col: cfg.yesCol, step: cfg.yesStep, headP: cfg.yesHead, slots: cfg.yesSlots });
    out += idoLane("no", cfg.round, cfg.noSteps || [], cfg.no, { col: cfg.noCol, step: cfg.noStep, headP: cfg.noHead, slots: cfg.noSlots });
    out += idoBar(cfg.round, cfg.bar, { col: cfg.barCol, step: cfg.barStep });
    return out;
  }

  /* ==== the title motif ==========================================================
     One question, and the two things it can hand you: the umbrella on the yes
     side and the sunglasses on the no side. In the spoken title chapter the
     question arrives first, then each arm as it is named. */
  function idoMotifArm(x, y, w, col, pic, label, p) {
    if (!(p > 0)) return "";
    return G(R(x, y, w, 96, 22, P.cell, col, 3) +
      Em(x + w / 2, y + 36, 42, pic) +
      Tx(x + w / 2, y + 78, label, "lab", "middle", { "font-size": 19, fill: col }),
      { transform: around(x + w / 2, y + 48, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cAsk = sn ? sc(sn, 0, "ask") : null, cYes = sn ? sc(sn, 0, "yes") : null,
      cNo = sn ? sc(sn, 0, "no") : null,
      cOne = sn ? sc(sn, 1, "one") : null, cTwo = sn ? sc(sn, 1, "two") : null,
      cDec = sn ? sc(sn, 1, "decides") : null;
    var pQ = sn ? popIn(t, idoAny(cAsk, cOne), 0.45) : 1;
    var pY = sn ? popIn(t, cYes, 0.45) : 1, pN = sn ? popIn(t, cNo, 0.45) : 1;
    var aOne = sn ? on(t, cOne, 0.5) : 1, aTwo = sn ? on(t, cTwo, 0.5) : 1;
    var aDec = sn ? on(t, cDec, 0.6) : 1;

    out += R(8, 16, 344, 328, 30, P.card, P.line, 3);
    /* the question, at the fork */
    out += MK.pop(R(78, 40, 204, 92, 22, P.cell, P.gold, 3) +
      Em(128, 86, 40, "\u{1F327}️") +
      Tx(206, 95, "Raining?", "lab", "middle", { "font-size": 24, fill: P.gold }), 180, 86, pQ);
    /* the two arms */
    out += MK.arrow(150, 146, 92, 196, aOne || pY, P.good, 6);
    out += MK.arrow(212, 146, 270, 196, aTwo || pN, P.blue, 6);
    out += idoMotifArm(22, 206, 140, P.good, "☂️", "Yes", pY);
    out += idoMotifArm(200, 206, 140, P.blue, "\u{1F576}️", "No", pN);
    /* the input is what decided it */
    if (aDec > 0) out += G(Tx(180, 330, "the input decides", "lab", "middle",
      { "font-size": 20, fill: P.gold }), { opacity: aDec });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="One question, is it raining, with an umbrella on the yes side and sunglasses on the no side">' + out + "</svg>";
  }

  /* ==== chapter: one question, two answers =======================================
     The lesson's own leaving-for-school round, built up as it is described:
     the two steps everyone does, the question, then each arm. The last beat
     hands the kit the raining input and lights whatever branchRun returns. */
  function idoForkChapter(scene, beat, t, i) {
    var cFork = sc(scene, 0, "fork"), cQ0 = sc(scene, 0, "question");
    var cDress = sc(scene, 1, "dress"), cBag = sc(scene, 1, "bag"), cQ1 = sc(scene, 1, "question");
    var cAsk = sc(scene, 2, "ask"), cYes = sc(scene, 2, "yes"), cYSteps = sc(scene, 2, "steps");
    var cNo = sc(scene, 3, "no"), cNSteps = sc(scene, 3, "steps"), cAfter = sc(scene, 3, "after");
    var cSame = sc(scene, 4, "same"), cOnly = sc(scene, 4, "only");

    var R0 = IDO_SCHOOL;
    /* the arms, from the kit */
    var armY = idoArm(R0, "yes"), armN = idoArm(R0, "no");
    /* the last beat: the raining input, and whatever the kit says it runs */
    var takenY = idoPast(t, cOnly) ? idoRun(R0, R0.inputs[0].id) : null;
    var runs = function (st) { return takenY ? takenY.indexOf(st) >= 0 : true; };

    var lit = on(t, cOnly, 0.6);
    var sameP = bump(t, cSame, 1.8);
    var out = "";

    out += idoFlow(t, {
      round: R0,
      before: function (k) { return on(t, k === 0 ? cDress : cBag, 0.45); },
      beforeCol: sameP > 0.3 ? P.gold : null,
      question: on(t, idoAny(cQ0, cFork), 0.5),
      qText: on(t, idoAny(cQ1, cAsk), 0.5),
      qCol: idoPast(t, cAsk) ? P.gold : null,
      input: takenY ? R0.inputs[0] : null,
      inputP: popIn(t, cOnly, 0.4),
      arrows: on(t, cFork, 0.6),
      litYes: lit, litNo: 0,
      yes: on(t, cFork, 0.6),
      no: on(t, cFork, 0.6),
      yesHead: on(t, cYes, 0.4),
      noHead: on(t, cNo, 0.4),
      yesSteps: armY, noSteps: armN,
      yesStep: function (k) { return on(t, cYSteps == null ? null : cYSteps + k * 0.45, 0.4); },
      noStep: function (k) { return on(t, cNSteps == null ? null : cNSteps + k * 0.45, 0.4); },
      bar: on(t, cAfter, 0.5),
      barCol: sameP > 0.3 ? P.gold : null,
      barStep: on(t, cAfter, 0.5)
    });

    /* "Only one answer's steps run": the arm the kit did NOT return goes dark,
       and the one it did keeps its colour. Nothing here picks the arm. */
    if (lit > 0) {
      var dead = armN.every(function (st) { return !runs(st); }) ? "no" : "yes";
      var dy = idoLaneY(dead);
      out += R(FLOW.lane.x, dy, FLOW.lane.w, FLOW.lane.h, 22, P.ground, null, null, { opacity: 0.66 * lit });
      out += MK.cross(FLOW.lane.x + FLOW.lane.w - 46, dy + FLOW.lane.head / 2, 22, popIn(t, cOnly, 0.5));
      var live = dead === "no" ? "yes" : "no", ly = idoLaneY(live);
      out += R(FLOW.lane.x - 3, ly - 3, FLOW.lane.w + 6, FLOW.lane.h + 6, 25, "none", P.good,
        4, { opacity: lit * (0.7 + 0.3 * breathe(t)) });
      out += MK.tick(FLOW.lane.x + FLOW.lane.w - 46, ly + FLOW.lane.head / 2, 22, popIn(t, cOnly, 0.5));
    }
    /* "the steps before and after are the same": both ends flash together */
    if (sameP > 0) {
      out += R(FLOW.left.x - 3, 11, FLOW.left.w + 6, 128, 20, "none", P.gold, 4, { opacity: sameP });
      out += R(FLOW.bar.x - 3, FLOW.bar.y - 3, FLOW.bar.w + 6, FLOW.bar.h + 6, 22, "none", P.gold, 4, { opacity: sameP });
    }
    return svg(out);
  }

  /* ==== Collecting Data, part 4: the backup, and what you now know ==============
     tools/lib/film-scenes/computing-g2/collecting-data-4.js.

     The backup chapter is the Cambridge Learner's Book part the lesson added:
     the same fruit data on paper, on the school computer and in the backup,
     and then the two things that can go wrong. The paper is spoilt and the
     computer breaks, and only the backup is still there - which is the
     lesson's own reason for keeping data on computers, drawn once. */

  var CD_BK = {
    paper: { x: 36, y: 110, w: 300, h: 250 },
    lap: { x: 400, y: 112, w: 330, h: 246 },
    card: { x: 800, y: 112, w: 332, h: 246 }
  };

  function cdBackupChapter(scene, beat, t, i) {
    var cCannot = sc(scene, 0, "cannot"), cBackup = sc(scene, 0, "backup");
    var cCopy = sc(scene, 1, "copy"), cElse = sc(scene, 1, "else");
    var cSpill = sc(scene, 2, "spill"), cGone = sc(scene, 2, "gone");
    var cBreaks = sc(scene, 3, "breaks"), cStill = sc(scene, 3, "still");
    var out = "", B = CD_BK;

    /* the paper chart, and the water that ends it */
    var pp = popIn(t, cCannot, 0.45), spill = on(t, cSpill, 0.6), gone = on(t, cGone, 0.5);
    out += Tx(B.paper.x + B.paper.w / 2, B.paper.y - 14, "on paper", "lab mid muted", "middle",
      { opacity: Math.min(1, pp) });
    out += MK.pop(cdPaper(B.paper.x, B.paper.y, B.paper.w, B.paper.h, 1),
      B.paper.x + B.paper.w / 2, B.paper.y + B.paper.h / 2, pp);
    out += cdChart(B.paper.x + 20, B.paper.y + 16, B.paper.w - 40, { ink: "#2A2A2A", mark: "#3B3B3B",
      rowH: 56, em: 28, markX: 118, countX: 222, markH: 26, o: Math.min(1, pp) * (1 - 0.75 * gone) });
    out += cdSpill(B.paper.x + B.paper.w * 0.52, B.paper.y + B.paper.h * 0.55, 84, spill);
    if (spill > 0) out += MK.pic(B.paper.x + 58, B.paper.y + 44, 54, "\u{1F4A7}", { opacity: spill });
    out += MK.cross(B.paper.x + B.paper.w - 26, B.paper.y + B.paper.h - 24, 27, popIn(t, cGone, 0.4));

    /* the school computer, until the day it breaks. Same fruit data as the
       paper and the backup card beside it: cdLaptop (collecting-data.js)
       already draws the kit's laptop with the answers over its "hello"
       placeholder screen, so this chapter calls it rather than drawing the
       bare figure again. */
    var lp = popIn(t, cBackup, 0.45), broke = on(t, cBreaks, 0.55);
    out += Tx(B.lap.x + B.lap.w / 2, B.lap.y - 14, "the school computer", "lab mid muted", "middle",
      { opacity: Math.min(1, lp) });
    if (lp > 0)
      out += cdLaptop(B.lap.x, B.lap.y, B.lap.w, B.lap.h, Math.min(1, lp) * (1 - 0.62 * broke));
    /* the word arrives on the computer, and hands over to the card that is the
       backup itself; leaving it lit under a computer that has just broken reads
       as a label for the broken thing */
    out += MK.pill(B.lap.x + B.lap.w / 2, B.lap.y + B.lap.h + 34, "backup",
      Math.min(1, lp) * (1 - 0.85 * on(t, cCopy, 0.5)), { size: 24, col: P.gold, ink: P.gold });
    out += MK.cross(B.lap.x + B.lap.w - 20, B.lap.y + 16, 28, popIn(t, cBreaks, 0.4));

    /* the second copy, kept somewhere else */
    var bp = popIn(t, cCopy, 0.45), el = on(t, cElse, 0.5), still = popIn(t, cStill, 0.4);
    out += Tx(B.card.x + B.card.w / 2, B.card.y - 14, "the backup", "lab mid muted", "middle",
      { opacity: Math.min(1, bp) });
    out += MK.arrow(740, 235, 790, 235, on(t, cCopy, 0.5), P.teal, 8);
    out += MK.glow(B.card.x + B.card.w / 2, B.card.y + B.card.h / 2, 190, P.good, still * 0.9);
    out += MK.pop(R(B.card.x, B.card.y, B.card.w, B.card.h, 22, P.card, still > 0 ? P.good : P.teal, 3),
      B.card.x + B.card.w / 2, B.card.y + B.card.h / 2, bp);
    if (bp > 0) {
      out += MK.pop(Em(B.card.x + 166, B.card.y + 104, 92, "\u{1F4BE}"), B.card.x + 166, B.card.y + 94, bp);
      CD_FRUIT.forEach(function (f, k) {
        var x = B.card.x + 44 + k * 72, y = B.card.y + 190, p = popIn(t, cCopy == null ? null : cCopy + 0.3 + k * 0.14, 0.35);
        out += MK.pop(R(x - 26, y - 26, 52, 52, 12, P.cell, P.line, 2) + Em(x, y, 30, f.pic) +
          Tx(x, y + 44, String(f.n), "lab mid muted", "middle"), x, y, p);
      });
    }
    if (el > 0) {
      out += G(Em(B.card.x + 40, B.card.y + 44, 44, "\u{1F3E0}"), { opacity: el });
      out += Tx(B.card.x + B.card.w / 2, B.card.y + B.card.h + 26, "kept somewhere else", "lab mid muted", "middle",
        { opacity: el });
    }
    out += MK.tick(B.card.x + B.card.w - 22, B.card.y + 18, 28, still);
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own five words for this step: a purpose, the question it
     decides, the form that records, what makes a question statistical, and the
     backup the Learner's Book part adds. */
  var CD_RECAP = MK.recapKind([
    { beat: 0, at: "purpose", title: "Purpose", sub: "why we are asking", pic: "\u{1F3AF}" },
    { beat: 0, at: "question", title: "Question", sub: "what we ask everybody", pic: "❓" },
    { beat: 1, at: "form", title: "Form", sub: "it records and counts", pic: "\u{1F4DD}" },
    { beat: 2, at: "statistical", title: "Statistical", sub: "you can count or measure it", pic: "\u{1F522}" },
    { beat: 2, at: "backup", title: "Backup", sub: "a second copy, kept safe", pic: "\u{1F4BE}" }
  ], { goBeat: 2, goAt: "backup" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Why data is safer on a computer than on paper",
      "How to collect answers you can really count",
      "Which questions give data, and which give stories"
    ] }),
    keep: cdKeepChapter, purpose: cdPurposeChapter, ways: cdWaysChapter,
    stat: cdStatChapter, kinds: cdKindsChapter, backup: cdBackupChapter, recap: CD_RECAP
  };

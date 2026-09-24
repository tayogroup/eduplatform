  /* ==== Programs with Loops, part 4 ==========================================
     The last chapter, the recap, the chapter table, and the check that the
     number of passes this film DRAWS is the number the lesson's own stage
     actually made. */

  /* ==== chapter: where these blocks live ======================================
     The lesson's fifth lecture part: the blocks here have Scratch names, and
     Scratch has a comment beside any block, just as this does. Your block on
     the left, its real name on the right, joined as each pair is said. */
  var PL_SC = { y0: 175, h: 64, gap: 16 };
  var PL_SC_ROWS = [
    { id: "jump", name: "change y by 50" },
    { id: "right", name: "move 10 steps" },
    { id: "repeat4", name: "repeat 4" }
  ];
  function plScY(k) { return PL_SC.y0 + k * (PL_SC.h + PL_SC.gap); }

  /* a Scratch name, on a card striped in that block's own category colour */
  function plName(x, y, w, h, text, col, o) {
    if (!(o > 0)) return "";
    var fs = Math.min(26, h * 0.34);
    return G(R(x, y, w, h, 12, P.cell, P.line, 2) + R(x, y, 10, h, 5, col) +
      Tx(x + 28, y + h / 2 + fs * 0.35, text, "lab", "start", { "font-size": fs }),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, plPop(o)) });
  }
  /* the comment the lesson writes beside a repeat block */
  var PL_WALL = "one jump for each wall in the level";

  function plScratchChapter(scene, beat, t, i) {
    var cThese = sc(scene, 0, "these"), cScratch = sc(scene, 0, "scratch"), cSchools = sc(scene, 0, "schools");
    var cNames = sc(scene, 1, "names"), cJump = sc(scene, 1, "jump");
    var cMove = sc(scene, 2, "move"), cRep = sc(scene, 2, "rep");
    var cComment = sc(scene, 3, "comment"), cJust = sc(scene, 3, "just");
    var out = "", gone = into(t, scene.first + 3);

    /* the top strip stays through the chapter */
    out += MK.pop(Em(500, 56, 54, "\u{1F431}"), 500, 56, popIn(t, cScratch, 0.45));
    out += MK.pill(600, 56, "Scratch", on(t, cScratch, 0.45), { size: 24, anchor: "start", col: P.teal, ink: P.teal });
    var kids = tally(t, cSchools, 3, 0.7);
    for (var c = 0; c < 3; c++)
      out += MK.pop(Em(860 + c * 62, 56, 48, "\u{1F9D2}"), 860 + c * 62, 56, c < kids ? 1 : 0);

    /* the two columns: your block, and what it is really called */
    if (gone < 1) {
      var cols = "", nameAt = [cJump, cMove, cRep];
      cols += MK.pill(60, 118, "Your blocks", on(t, cThese, 0.4), { size: 21, anchor: "start", col: P.gold, ink: P.gold });
      cols += MK.pill(620, 118, "In Scratch", on(t, cNames, 0.4), { size: 21, anchor: "start", col: P.teal, ink: P.teal });
      var shown = tally(t, cThese, 3, 0.7);
      for (var k = 0; k < 3; k++) {
        var y = plScY(k), cy = y + PL_SC.h / 2, row = PL_SC_ROWS[k];
        cols += plBlock(60, y, 290, PL_SC.h, row.id, { o: k < shown ? 1 : 0, col: plPast(t, nameAt[k]) ? P.gold : null });
        var named = popIn(t, nameAt[k], 0.45);
        if (named > 0) cols += plName(620, y, 400, PL_SC.h, row.name, PL_CAT[ART.block(row.id).cat], named);
        else cols += plSlot(620, y, 400, PL_SC.h, on(t, cNames, 0.4));
        cols += MK.leader(354, cy, 612, cy, on(t, nameAt[k], 0.5), P.gold);
      }
      out += G(cols, { opacity: 1 - gone });
    }

    /* and a comment beside any block, just as this does: the same note beside
       the Scratch block and beside the one the child has been using */
    if (gone > 0) {
      var one = "", pA = popIn(t, cComment, 0.5), pB = popIn(t, cJust, 0.5);
      one += MK.pill(130, 150, "In Scratch", on(t, cComment, 0.4), { size: 20, anchor: "start", col: P.teal, ink: P.teal });
      one += plName(130, 180, 320, 76, "repeat 4", P.accent, pA);
      one += plNote(510, 180, 460, 76, PL_WALL, pA, { per: 26, size: 20 });
      one += MK.leader(456, 218, 502, 218, on(t, cComment, 0.45), P.gold);
      one += MK.tick(1014, 218, 26, popIn(t, cComment == null ? null : cComment + 0.4, 0.4));
      one += MK.pill(130, 292, "Your block", on(t, cJust, 0.4), { size: 20, anchor: "start", col: P.gold, ink: P.gold });
      one += plBlock(130, 322, 320, 76, "repeat4", { o: pB });
      one += plNote(510, 322, 460, 76, PL_WALL, pB, { per: 26, size: 20 });
      one += MK.leader(456, 360, 502, 360, on(t, cJust, 0.45), P.gold);
      one += MK.tick(1014, 360, 26, popIn(t, cJust == null ? null : cJust + 0.4, 0.4));
      out += G(one, { opacity: gone });
    }
    return svg(out);
  }

  /* ==== what you now know =====================================================
     The lesson's own five words, and its own definitions of them. */
  var PL_RECAP = MK.recapKind([
    { beat: 0, at: "repeat", title: "Repeat block", sub: "runs the block after it", pic: "\u{1F501}" },
    { beat: 0, at: "iteration", title: "Iteration", sub: "one time round a repeat", pic: "\u{1F504}" },
    { beat: 1, at: "fold", title: "Fold", sub: "same block, one repeat", pic: "\u{1F9F9}" },
    { beat: 1, at: "output", title: "Output", sub: "what the program makes happen", pic: "\u{1F4E4}" },
    { beat: 2, at: "comment", title: "Comment", sub: "a note beside a block, for people", pic: "\u{1F4AC}" }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How a repeat block runs one block again and again",
      "How to fold a long program into a short one",
      "What a comment is, and why it helps"
    ] }),
    repeat: plRepeatChapter, build: plBuildChapter, fold: plFoldChapter,
    comment: plCommentChapter, why: plWhyChapter, scratch: plScratchChapter,
    recap: PL_RECAP
  };

  /* ==== the passes this film draws, against the passes the lesson made ========
     The words say three times in two chapters and the pictures count to three
     in both. These read the lesson's own rules and its own stage, so if the
     repeat block, the move cap or the grow cap ever change, the page stops
     loading with the reason - instead of a film that says three and draws
     something else. */
  (function () {
    function must(what, ok) { if (!ok) throw new Error("Programs with Loops: " + what); }
    must("the repeat block no longer repeats the block after it three times",
      ART.program.expand(["repeat3", "jump"]).join() === "jump,jump,jump");
    must("this film draws " + PL_JUMPS + " jumps and the kit makes " +
      ART.program.expand(["repeat3", "jump"]).length,
      PL_JUMPS === ART.program.expand(["repeat3", "jump"]).length);
    must("the built program no longer moves the cat three squares right (it ends at " +
      PL_BUILD_END.x + ", and the film draws 3 squares lit)", PL_BUILD_END.x === 3);
    must("go home no longer resets the cat before the repeat runs",
      ART.program.expand(PL_BUILD_PROG).filter(function (id) { return id === "right"; }).length === 3);
    must("the long program and the folded one no longer do the same thing",
      ART.program.same(PL_LONG, PL_SHORT) === true);
    must("the folded program's output is no longer the long one's (" +
      PL_FOLD_END.scale + " against " + PL_LONG_END.scale + ")",
      PL_FOLD_END.scale === PL_LONG_END.scale);
  })();

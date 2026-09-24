  /* ==== Objects and Plans, part 2: planning, and building one at a time ========
     tools/lib/film-scenes/computing-g2/objects-and-plans-2.js. See the header
     of objects-and-plans.js.

     The two chapters here are the lesson's own two halves of "plan, then
     build": first the cat, the dog and the tree each get a plan (and the tree
     gets none, which is the lesson's point), then the cat's plan is built,
     run and checked before the dog's is touched. */

  /* ==== chapter: a plan for each object ==========================================
     Beats 0-1 on the stage, where "two spaces to the right" can be counted;
     beats 2-4 as three plan rows, one per object. */
  var PL_S = { x: 224, y: 40, w: 720, h: 250 };
  /* The tree stands on the SECOND square, near its right-hand edge (a square
     runs from 1.5 to 2.5 squares out), so the cat lands on the same square and
     beside the tree rather than on top of it: a 56 px cat drawn over a 52 px
     tree hides it completely, and "walk to the tree" then ends with no tree. */
  var PL_CAT = 420, PL_TREE = 647.8;
  var PL_CARD = { x: 264, y: 312, w: 640, h: 108 };

  function plWalkPicture(scene, t) {
    /* beat 0 says "Before you build, plan. What should each object do?"
       (before, plan, each); beat 1 "The cat walks to the tree, then says
       hello. That is its plan." (walks, hello, plan) - there is no "two" in
       either line, so the two-square count rides the same "walks" cue as
       the walk itself. */
    var cBefore = sc(scene, 0, "before"), cPlan = sc(scene, 0, "plan"), cCat = sc(scene, 0, "each");
    var cWalk = sc(scene, 1, "walks"), cHello = sc(scene, 1, "hello");
    var out = "", sq = opSQ(PL_S.h);

    out += opStage(PL_S.x, PL_S.y, PL_S.w, PL_S.h, into(t, scene.first), { squares: 3, cx: PL_CAT });
    out += opProp(PL_TREE, PL_S.y, PL_S.h, OP_TREE, into(t, scene.first), { scale: 0.92, dy: -26 });
    /* "Before you build" - the plan card's own empty frame is what there is
       to show before anything is planned */
    var frame = on(t, cBefore, 0.5) * (1 - on(t, cPlan, 0.5));
    if (frame > 0) out += R(PL_CARD.x, PL_CARD.y, PL_CARD.w, PL_CARD.h, 22, "none", P.line, 2,
      { "stroke-dasharray": "10 8", opacity: frame });

    /* the two spaces the plan is about, counted after the walk. They are drawn
       as hops ABOVE the floor: a marker on the square the cat lands on is a
       marker the cat then stands on top of. */
    var count = tally(t, cWalk, 2, 0.6);
    for (var k = 0; k < count; k++) {
      var x0 = PL_CAT + k * sq, x1 = PL_CAT + (k + 1) * sq, mid = (x0 + x1) / 2;
      out += G(Pth("M" + n2(x0) + ",152 Q" + n2(mid) + ",104 " + n2(x1) + ",152", null, P.gold, 4,
        { "stroke-dasharray": "11 9" }) +
        C(mid, 128, 18, P.card, P.gold, 3) +
        Tx(mid, 136, String(k + 1), "lab", "middle", { fill: P.gold }),
        { opacity: on(t, opAfter(cWalk, k * 0.3), 0.35) });
    }

    /* the cat walks the two squares of its own plan */
    var walk = on(t, cWalk, 0.9), st = opTween(OP_HOME, OP_R2, walk);
    var catX = PL_CAT + st.x * sq;
    out += opSprite(PL_CAT, PL_S.y, PL_S.h, st, OP_CAT, 1);
    if (on(t, cCat, 0.5) > 0 && on(t, cWalk, 0.3) < 1)
      out += C(PL_CAT, 186, 58, "none", P.gold, 4, { opacity: on(t, cCat, 0.5) * (1 - on(t, cWalk, 0.3)) });
    out += MK.bubble(catX - 62, 44, 124, 52, "Hello!", on(t, cHello, 0.4), catX, 150);

    /* the plan, in the lesson's own words, written as it is said */
    var card = on(t, cPlan, 0.5);
    if (card > 0) {
      out += G(R(PL_CARD.x, PL_CARD.y, PL_CARD.w, PL_CARD.h, 22, P.paper) +
        Tx(PL_CARD.x + PL_CARD.w / 2, PL_CARD.y + 38, "the cat's plan", "lab dark", "middle", { "font-size": 21 }),
        { opacity: card });
      out += MK.qmark(584, PL_CARD.y + 74, 28, card * (1 - on(t, cWalk, 0.4)));
      out += Tx(300, PL_CARD.y + 84, "walk to the tree,", "lab big dark", "start", { opacity: on(t, cWalk, 0.45) });
      out += Tx(576, PL_CARD.y + 84, "then say hello", "lab big dark", "start", { opacity: on(t, cHello, 0.45) });
    }
    return out;
  }

  var PL_ROW = { x: 30, w: 1108, h: 122, gap: 15, top: 22, bx: 234, bh: 56, fs: 23 };
  function plRowY(k) { return PL_ROW.top + k * (PL_ROW.h + PL_ROW.gap); }
  var PL_OBJ = [
    { pic: OP_CAT, name: "cat", ids: ["right", "right", "say"] },
    { pic: OP_DOG, name: "dog", ids: ["jump", "jump", "spin"] },
    { pic: OP_TREE, name: "tree", ids: [] }
  ];

  function plRowsPicture(scene, t) {
    /* beat 2 is "The dog jumps twice, then spins. That is a different plan."
       (jumps, spins, diff) - it is entirely about the dog, not the cat, so
       the dog becomes the ringed row here; the cat's row is already settled
       from the first half and needs no cue of its own. beat 4 is "What
       should the tree do? Nothing. It gets no blocks at all." (tree,
       nothing, none). */
    var cJumps = sc(scene, 2, "jumps"), cSpins = sc(scene, 2, "spins"), cDiff = sc(scene, 2, "diff");
    var cOther = sc(scene, 3, "other");
    var cTree = sc(scene, 4, "tree"), cNothing = sc(scene, 4, "nothing"), cNo = sc(scene, 4, "none");
    var out = "", ring = opPast(t, cTree) ? 2 : opPast(t, cJumps) ? 1 : 0;
    var doneAt = [cJumps, cTree, null];

    PL_OBJ.forEach(function (o, k) {
      var y = plRowY(k), col = k === ring ? P.gold : (opPast(t, doneAt[k]) ? P.good : null);
      out += R(PL_ROW.x, y, PL_ROW.w, PL_ROW.h, 22, P.cell, col || P.line, col ? 4 : 2);
      out += Em(94, y + 61, 62, o.pic);
      out += Tx(142, y + 70, o.name, "lab", "start", { fill: col || P.muted });
      out += L(210, y + 18, 210, y + 104, P.line, 2);
      /* the empty plan each object starts with */
      var bx = PL_ROW.bx, by = y + 33;
      if (k < 2) {
        o.ids.forEach(function (id, b) {
          var w = opBlockW(id, PL_ROW.fs, PL_ROW.bh);
          out += opSlot(bx, by, w, PL_ROW.bh, 1);
          bx += w + 14;
        });
      } else {
        out += opSlot(bx, by, 300, PL_ROW.bh, 1);
        out += MK.qmark(bx + 150, by + PL_ROW.bh / 2, 22, 1 - on(t, cNo, 0.4));
      }
      if (opPast(t, doneAt[k])) out += MK.tick(1090, y + 61, 22, popIn(t, doneAt[k], 0.35));
    });

    /* the cat's three blocks are already settled, carried over from the
       first half; the dog's fill in as its own beat names them: jump and
       jump together, then spin */
    out += opBlockRow(PL_ROW.bx, plRowY(0) + 33, PL_ROW.bh, PL_OBJ[0].ids, t, undefined, { fs: PL_ROW.fs });
    out += opBlockRow(PL_ROW.bx, plRowY(1) + 33, PL_ROW.bh, PL_OBJ[1].ids, t,
      [cJumps, opAfter(cJumps, 0.32), cSpins], { fs: PL_ROW.fs });
    /* the dog's plan is not the cat's, and the film says so beside it -
       then beat 3 names why: "The dog is a different object, so it gets
       different blocks", which is this row's own three blocks, glowing */
    var diff = on(t, cDiff, 0.5);
    if (diff > 0) out += MK.pill(890, plRowY(1) + 61, "a different plan", diff, { size: 22, col: P.gold, ink: P.gold });
    var otherFlash = bump(t, cOther, 1.2);
    if (otherFlash > 0.02) out += R(PL_ROW.bx - 4, plRowY(1) + 29, 308, PL_ROW.bh + 8, 16, "none", P.gold, 4, { opacity: otherFlash });

    /* the tree: nothing to do, so no blocks at all */
    var flash = bump(t, cNothing, 1.1);
    if (flash > 0.02) out += R(PL_ROW.bx - 4, plRowY(2) + 29, 308, PL_ROW.bh + 8, 16, "none", P.gold, 4, { opacity: flash });
    out += MK.cross(PL_ROW.bx + 150, plRowY(2) + 61, 26, popIn(t, cNo, 0.4));
    out += MK.pill(700, plRowY(2) + 61, "no blocks", on(t, cNo, 0.45), { size: 22, col: P.bad, ink: P.bad });
    return out;
  }

  function plChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(plWalkPicture(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(plRowsPicture(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: build one, test one =============================================
     Beats 0-3: the cat's program is built, run and checked before the dog's
     is started, on the lesson's own stage. Beat 4, "Test each program as you
     build it. Then every bug stays small.", is the chapter's own punchline,
     so it is where the two ways round appear side by side - test at the end
     and a bug has two panels to hide in; test as you build and it can only
     be in the one you just made. */
  var BU_S = { x: 40, y: 16, w: 1088, h: 176 };
  var BU_CAT = 260, BU_TREE = 420.4, BU_DOG = 820;   /* on the second square, beside where the cat lands */
  var BU_P = [
    { x: 48, pic: OP_CAT, name: "cat", ids: ["right", "right", "say"] },
    { x: 604, pic: OP_DOG, name: "dog", ids: ["jump", "jump", "spin"] }
  ];
  var BU_PY = 212, BU_PW = 516, BU_PH = 214, BU_BH = 44;
  /* the dog's hop on this stage's smaller sprite (BU_S.h = 176, against the
     "objects" chapter's fixed 84 px sprite and its 34 px dogHop) - jump below
     is 0..1 and was passed straight into opSprite's PIXEL hop with no
     amplitude, so the dog moved under a pixel. Same ratio as dogHop's own
     34 / 84. */
  var BU_HOP = 24;

  function buBuildPicture(scene, t) {
    /* beat 0 "Now build. Turn each plan into blocks, one object at a time."
       (build, turn, one); beat 1 "Build the cat's program first: move
       right, move right, say hello." (catp, right, say) - the cat's blocks
       are named here, not run yet; beat 2 "Run it. Did the cat do its plan?
       Yes it did. That was a test." (run, did, yes, test) - the cat walks
       and says hello once "Run it" is said; beat 3 "Now build the dog's
       program: jump, jump, spin. Run that one too." (dogp, jjs, runtoo). */
    var cBuild = sc(scene, 0, "build"), cTurn = sc(scene, 0, "turn"), cOne = sc(scene, 0, "one");
    var cCatp = sc(scene, 1, "catp"), cCatBlocks = sc(scene, 1, "right");
    var cRun = sc(scene, 2, "run"), cHello = sc(scene, 2, "yes"), cDid = sc(scene, 2, "did");
    var cDogB = sc(scene, 3, "dogp"), cJJS = sc(scene, 3, "jjs"), cRun2 = sc(scene, 3, "runtoo");
    var cJumps = cRun2, cSpins = opAfter(cRun2, 1.0);
    var out = "", sq = opSQ(BU_S.h);

    out += opStage(BU_S.x, BU_S.y, BU_S.w, BU_S.h, into(t, scene.first), { squares: 2, cx: BU_CAT });
    out += opProp(BU_TREE, BU_S.y, BU_S.h, OP_TREE, into(t, scene.first), { scale: 0.92, dy: -20 });

    /* the cat runs its own program */
    var walk = on(t, cRun, 1.0), st = opTween(OP_HOME, OP_R2, walk);
    var catX = BU_CAT + st.x * sq;
    out += opSprite(BU_CAT, BU_S.y, BU_S.h, st, OP_CAT, 1);
    out += MK.bubble(catX - 58, 24, 116, 48, "Hello!", on(t, cHello, 0.4), catX, 96);

    /* then the dog runs its own */
    var d = cJumps == null ? -1 : t - cJumps, sd = cSpins == null ? -1 : t - cSpins;
    var jump = d >= 0 && d < 0.45 ? Math.sin(Math.PI * (d / 0.45))
      : d >= 0.5 && d < 0.95 ? Math.sin(Math.PI * ((d - 0.5) / 0.45)) : 0;
    var spin = sd >= 0 ? 360 * ease(sd / 0.9) : 0;
    out += opSprite(BU_DOG, BU_S.y, BU_S.h, OP_HOME, OP_DOG, 1, jump * BU_HOP, spin);

    /* "Turn each plan into blocks, one object at a time" - the empty
       workspace glows before the cat's panel actually opens (turn), and the
       cat on the stage glows on its own once "one object at a time" names
       it as the one being worked on first */
    var turnGlow = on(t, cTurn, 0.6) * (1 - popIn(t, cBuild, 0.4));
    if (turnGlow > 0.02) out += MK.glow(BU_P[0].x + BU_PW / 2, BU_PY + BU_PH / 2, 110, P.gold, turnGlow * 0.5);
    var oneGlow = on(t, cOne, 0.5);
    if (oneGlow > 0.02) out += MK.glow(BU_CAT, BU_S.y + BU_S.h - 60, 70, P.gold, oneGlow * 0.6);

    /* the two script panels: the cat's is built, run and ticked before the
       dog's panel is opened at all */
    var open = [popIn(t, cBuild, 0.4), popIn(t, cDogB, 0.4)];
    var filled = [cCatBlocks, cJJS], pressed = [cRun, cRun2];
    var doneAt = [opAfter(cDid, 0.1), opAfter(cSpins, 1.0)];
    var catpFlash = bump(t, cCatp, 0.8);
    BU_P.forEach(function (p, k) {
      if (!(open[k] > 0)) return;
      /* "the cat's program" names the panel that is already open */
      if (k === 0 && catpFlash > 0.02) out += MK.glow(p.x + BU_PW / 2, BU_PY + BU_PH / 2, 110, P.teal, catpFlash * 0.4);
      /* gold while this object is the one being worked on, green once its own
         program has run and been checked */
      var working = k === 1 ? true : !opPast(t, cDogB);
      var ring = opPast(t, doneAt[k]) ? P.good : working ? P.gold : null;
      var body = opPanel(p.x, BU_PY, BU_PW, BU_PH, p.pic, p.name, 1, { ring: ring });
      var seen = k === 0 ? tally(t, cCatBlocks, 3, 0.9) : 3;
      p.ids.forEach(function (id, b) {
        var w = opBlockW(id, 20, BU_BH), yy = BU_PY + 62 + b * (BU_BH + 8);
        if (b < seen) body += opSlot(p.x + 24, yy, w, BU_BH, 1);
      });
      body += opBlockCol(p.x + 24, BU_PY + 62, BU_BH, p.ids, t, filled[k], { fs: 20, gap: 8 });
      body += opRunBtn(p.x + 300, 300, 150, 54, on(t, opAfter(filled[k], 0.8), 0.4), bump(t, pressed[k], 0.5));
      body += MK.ripple(p.x + 322, 327, t, pressed[k], P.good);
      body += MK.tick(p.x + BU_PW - 46, BU_PY + 38, 22, popIn(t, doneAt[k], 0.4));
      out += G(body, { transform: around(p.x + BU_PW / 2, BU_PY + BU_PH / 2, Math.min(open[k], 1.05)), opacity: Math.min(1, open[k]) });
    });
    return out;
  }

  /* ---- the two ways round ------------------------------------------------------ */
  function buChip(cx, cy, s, id, o) {
    if (!(o > 0)) return "";
    var b = ART.block(id);
    return G(R(cx - s / 2, cy - s / 2, s, s, s * 0.24, OP_FILL[b.cat] || P.teal) + Em(cx, cy, s * 0.56, b.icon),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) });
  }
  function buMini(x, y, pic, name, ids, o, t, at, col) {
    if (!(o > 0)) return "";
    var body = R(x, y, 300, 92, 18, P.card, col || P.line, col ? 4 : 2) +
      Em(x + 38, y + 46, 44, pic) + Tx(x + 68, y + 24, name, "lab mid", "start", { fill: col || P.muted });
    ids.forEach(function (id, k) {
      body += buChip(x + 118 + k * 52, y + 52, 42, id, popIn(t, opAfter(at, k * 0.2), 0.35));
    });
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* beat 4, the chapter's last: "Test each program as you build it. Then
     every bug stays small." (test, small) - the only spare beat this
     chapter has, so both halves of the comparison ride it: the LEFT side
     opens as "Test" is said and plays out testing nothing until the very
     end, where a bug turns up with nowhere obvious to look; the RIGHT side
     recaps the two panels from beats 1-3, already ticked, as "stays small"
     is said. */
  function buCompare(scene, t) {
    var cTest = sc(scene, 4, "test"), cSmall = sc(scene, 4, "small");
    var left = "", right = "";

    left += MK.pill(300, 40, "test at the end", on(t, cTest, 0.45), { size: 24, col: P.bad, ink: P.bad });
    left += buMini(60, 84, OP_CAT, "cat", BU_P[0].ids, popIn(t, cTest, 0.4), t, cTest, null);
    left += buMini(60, 196, OP_DOG, "dog", BU_P[1].ids, popIn(t, opAfter(cTest, 0.4), 0.4), t, opAfter(cTest, 0.4), null);
    left += opRunBtn(150, 316, 150, 52, on(t, opAfter(cTest, 0.9), 0.4), bump(t, opAfter(cTest, 1.2), 0.5));
    left += MK.ripple(172, 342, t, opAfter(cTest, 1.2), P.good);
    left += MK.qmark(420, 130, 28, popIn(t, opAfter(cTest, 1.4), 0.4));
    left += MK.qmark(420, 242, 28, popIn(t, opAfter(cTest, 1.6), 0.4));
    left += MK.glow(420, 342, 74, P.bad, on(t, opAfter(cTest, 1.8), 0.5));
    left += MK.pop(Em(420, 342, 68, "\u{1F41B}"), 420, 342, popIn(t, opAfter(cTest, 1.9), 0.4));

    /* cSmall is "every bug stays small", the last phrase in the chapter's
       last beat, so this whole side is kept tight - nothing here should
       still be finishing after the beat itself runs out */
    right += MK.pill(868, 40, "test as you build", on(t, cSmall, 0.4), { size: 24, col: P.good, ink: P.good });
    right += buMini(628, 84, OP_CAT, "cat", BU_P[0].ids, popIn(t, cSmall, 0.35), t, cSmall, P.good);
    right += buMini(628, 196, OP_DOG, "dog", BU_P[1].ids, popIn(t, opAfter(cSmall, 0.15), 0.35), t, opAfter(cSmall, 0.15), P.gold);
    [0, 1].forEach(function (k) {
      var y = 84 + k * 112, at = opAfter(cSmall, 0.3 + k * 0.2);
      right += opRunBtn(952, y + 22, 120, 46, on(t, opAfter(cSmall, 0.1), 0.35), bump(t, at, 0.4));
      right += MK.ripple(970, y + 45, t, at, P.good);
      right += MK.tick(1108, y + 46, 24, popIn(t, opAfter(at, 0.25), 0.35));
    });

    var fade = 1 - 0.6 * on(t, opAfter(cTest, 1.9), 0.6);
    return G(left, { opacity: fade }) + right;
  }

  function buChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(buBuildPicture(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(buCompare(scene, t), { opacity: u });
    return svg(out);
  }

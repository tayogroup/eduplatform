
  /* ==== Electricity and Magnets, part 3: the magnet chapters, the recap ======== */

  /* ==== chapter: what a magnet does ==============================================
     The lesson's own magnet experiment (ART.magnet), twice, side by side. On the
     left the paperclip: the magnet comes near, and the clip jumps across the
     gap before the magnet reaches it; later it is pulled off, and comes away.
     On the right paper: the magnet comes all the way and touches it, and
     nothing happens. Between them the lesson's word, attract, "pull towards";
     and "sticks", which belongs to glue. */
  var EM_MG = { ax: 0, bx: 688, y: 4, w: 480, h: 300, s: 1.5 };
  function emMgX(cardX, x) { return cardX + x * EM_MG.s; }
  function emMgY(y) { return EM_MG.y + y * EM_MG.s; }

  function sceneMagnet(scene, beat, t, i) {
    var b0 = scene.first, attractsAt = sc(scene, 0, "attracts"), pullTo = sc(scene, 0, "pull");
    var nearAt = sc(scene, 1, "near"), jumpsAt = sc(scene, 1, "jumps");
    var beforeAt = sc(scene, 2, "before"), touchAt = sc(scene, 2, "touches");
    var bringAt = sc(scene, 3, "bring"), paperAt = sc(scene, 3, "paper"), nothingAt = sc(scene, 3, "nothing");
    var sticksAt = sc(scene, 4, "sticks"), glueAt = sc(scene, 4, "glue");
    var offAt = sc(scene, 5, "pull"), easyAt = sc(scene, 5, "easy"), againAt = sc(scene, 5, "attracts");
    /* card A: the magnet arrives as the clip jumps, and the clip is later pulled back */
    var reachA = nearAt == null ? 0 : 0.75 * ease((t - nearAt) / Math.max(0.6, (jumpsAt - nearAt) - 0.05));
    var jumpA = on(t, jumpsAt, 0.28) * (1 - (offAt == null ? 0 : ease((t - offAt - 0.2) / Math.max(0.7, (easyAt || offAt + 1) - offAt + 0.1))));
    var out = ART.place(ART.magnet(EM_CLIP, reachA, jumpA), EM_MG.ax, EM_MG.y, EM_MG.w, EM_MG.h);
    var clipX = emMgX(EM_MG.ax, 230 - 40 * jumpA), clipY = emMgY(123);
    /* "A magnet": the magnet, pointed at */
    out += C(emMgX(EM_MG.ax, 71), emMgY(96), 58, "none", P.accent, 5, { opacity: bump(t, sc(scene, 0, "magnet"), 1.2) });
    /* attract means pull towards: an arrow from the clip to the magnet */
    var pa = on(t, pullTo, 0.5) * (1 - on(t, nearAt, 0.3));
    if (pa > 0) out += MK.arrow(clipX - 24, clipY - 8, emMgX(EM_MG.ax, 112), emMgY(100), pa, P.accent, 7);
    if (jumpsAt != null) out += MK.ripple(emMgX(EM_MG.ax, 190), clipY, t, jumpsAt + 0.26, P.accent);
    /* it jumped before the magnet touched it: where it was, and the gap it crossed */
    var gh = on(t, beforeAt, 0.4) * (1 - on(t, bringAt, 0.4));
    if (gh > 0) {
      /* the clip where it was, a dashed hop from there to the magnet, and on
         the ground below, the gap the magnet never closed */
      var gx0 = emMgX(EM_MG.ax, 189), gx1 = emMgX(EM_MG.ax, 219), gy = emMgY(168), fl = bump(t, touchAt, 0.8);
      var ax = emMgX(EM_MG.ax, 230), bx = emMgX(EM_MG.ax, 192), hy = emMgY(98);
      out += G(MK.pic(ax, clipY, 48 * EM_MG.s, EM_CLIP), { opacity: 0.4 * gh }) +
        G(Pth("M" + n2(ax) + "," + n2(hy) + " Q" + n2((ax + bx) / 2) + "," + n2(hy - 46) + " " + n2(bx + 6) + "," + n2(hy - 6), null, P.accent, 4, { "stroke-dasharray": "8 7" }) +
          Pth("M" + n2(bx - 4) + "," + n2(hy + 4) + " L" + n2(bx + 14) + "," + n2(hy - 6) + " L" + n2(bx + 2) + "," + n2(hy - 20) + " Z", P.accent) +
          L(gx0, gy, gx1, gy, P.accent, 5 + 3 * fl) + L(gx0, gy - 14, gx0, gy + 14, P.accent, 5) + L(gx1, gy - 14, gx1, gy + 14, P.accent, 5), { opacity: gh });
    }
    /* pulled off, and it comes away easily */
    var pl = on(t, offAt, 0.4) * (1 - on(t, againAt, 0.4));
    if (pl > 0) out += MK.arrow(clipX + 26, clipY, clipX + 110, clipY, pl, P.accent, 7);
    out += Tx(240, 350, "paperclip", "lab big", "middle") + MK.tick(346, 340, 19, popIn(t, jumpsAt == null ? null : jumpsAt + 0.3, 0.35));
    /* card B: paper, waiting dim until it is named; then the magnet comes right
       up to it, and nothing happens */
    var bo = 0.3 + 0.7 * into(t, b0 + 3);
    if (bo > 0) {
      var reachB = bringAt == null ? 0 : ease((t - bringAt) / Math.max(0.8, (nothingAt - bringAt) - 0.2));
      out += G(ART.place(ART.magnet("\u{1F4C4}", reachB, 0), EM_MG.bx, EM_MG.y, EM_MG.w, EM_MG.h) +
        Tx(928, 350, "paper", "lab big", "middle", { opacity: on(t, paperAt, 0.4) }) +
        MK.cross(1010, 340, 19, popIn(t, nothingAt, 0.35)), { opacity: bo });
    }
    /* between them: the word, and what it means */
    var wa = popIn(t, attractsAt, 0.45), wb = 1 + 0.12 * bump(t, againAt, 0.7);
    if (wa > 0) out += MK.pop(MK.pill(584, 60, "attract", 1, { size: 30, col: P.plum }), 584, 60, wa * wb);
    var wp = on(t, pullTo, 0.4);
    if (wp > 0) out += Tx(584, 124, "pull towards", "lab", "middle", { opacity: wp, "font-size": 26 }) + MK.arrow(640, 154, 528, 154, wp, P.plum, 6);
    /* "sticks" is glue's word */
    var sk = popIn(t, sticksAt, 0.4);
    if (sk > 0) out += MK.pop(MK.pill(576, 246, "sticks", 1, { size: 26 }), 576, 246, sk) + MK.cross(664, 246, 16, popIn(t, sticksAt + 0.35, 0.3));
    var gl = popIn(t, glueAt, 0.45);
    if (gl > 0) out += MK.pop(emGlue(572, 432, 100) + Tx(572, 401, "glue", "lab mid", "middle", { fill: "#FFFFFF" }), 572, 380, gl) +
      MK.tick(648, 380, 18, popIn(t, glueAt + 0.35, 0.3));
    return svg(EM_DEFS + out);
  }

  /* ==== chapter: iron and steel ==================================================
     The lesson's magnet test and its record table, together: each thing is put
     in the experiment as it is named and the magnet brought up, and its row of
     the table is filled in, Yes or No. Kitchen foil waits for a prediction
     before it is tested. Then the table shows the pattern: every Yes is steel. */
  var EM_ST = { x: 8, y: 26, w: 512, h: 320 };
  var EM_ROWS = [
    { mat: "steel", rest: " paperclip", pic: EM_CLIP, yes: true },
    { mat: "wooden", rest: " block", pic: "\u{1FAB5}", yes: false },
    { mat: "steel", rest: " tin lid", pic: "\u{1F96B}", yes: true },
    { mat: "plastic", rest: " cup", pic: "\u{1F964}", yes: false },
    { mat: "kitchen", rest: " foil", pic: EM_FOIL, yes: false }
  ];

  /* when each thing is tested: in (swapped into the experiment), go (the magnet
     starts), done (its row is filled in) */
  function emTests(scene) {
    var plan = [
      { row: 0, in: sc(scene, 1, "clip"), first: true }, { row: 2, in: sc(scene, 1, "lid") },
      { row: 1, in: sc(scene, 2, "block") }, { row: 3, in: sc(scene, 2, "cup") },
      { row: 4, in: sc(scene, 3, "foil"), go: sc(scene, 4, "test"), done: sc(scene, 4, "nothing") }
    ];
    plan.forEach(function (p) {
      if (p.in == null) return;
      if (p.go == null && p.row !== 4) p.go = p.in + (p.first ? 0.1 : 0.25);
      if (p.done == null && p.row !== 4) p.done = p.go + (EM_ROWS[p.row].yes ? 0.72 : 0.55);
    });
    return plan;
  }

  function sceneSteel(scene, beat, t, i) {
    var plan = emTests(scene), cur = plan[0];
    for (var k = 1; k < plan.length; k++) if (plan[k].in != null && t >= plan[k].in) cur = plan[k];
    var row = EM_ROWS[cur.row], go = cur.go, target = row.yes ? 0.75 : 1;
    var reach = go == null ? 0 : target * ease((t - go) / (cur.row === 4 ? 0.9 : 0.45));
    var jump = row.yes && go != null ? on(t, go + 0.48, 0.2) : 0;
    var dip = 0;
    plan.forEach(function (p) { if (!p.first && p.in != null) dip = Math.max(dip, bump(t, p.in - 0.25, 0.5)); });
    var testAt = sc(scene, 0, "test"), tableAt = sc(scene, 0, "table"), metalAt = sc(scene, 3, "metal"), predictAt = sc(scene, 3, "predict");
    var nothingAt = sc(scene, 4, "nothing"), everyAt = sc(scene, 4, "every");
    var lookAt = sc(scene, 5, "table"), ironAt = sc(scene, 5, "iron"), look = on(t, lookAt, 0.5), iron = on(t, ironAt, 0.4);
    /* the experiment waits dim until "Test each thing" */
    var out = G(ART.place(ART.magnet(row.pic, reach, jump), EM_ST.x, EM_ST.y, EM_ST.w, EM_ST.h),
      { opacity: (0.4 + 0.6 * on(t, testAt, 0.5)) * (1 - 0.8 * dip) }) +
      R(EM_ST.x - 6, EM_ST.y - 6, EM_ST.w + 12, EM_ST.h + 12, 12, "none", P.good, 4, { opacity: bump(t, testAt, 1.0) });
    if (cur.done != null && row.yes) out += MK.ripple(EM_ST.x + 190 * 1.6, EM_ST.y + 123 * 1.6, t, go + 0.68, P.good);
    /* under the experiment: foil is metal; predict; not magnetic */
    var fade = 1 - 0.6 * look;
    var mo = popIn(t, metalAt, 0.4);
    if (mo > 0) out += G(MK.pop(MK.pill(60, 392, "metal", 1, { size: 24, col: P.gold }), 60, 392, mo), { opacity: fade });
    var ch = popIn(t, predictAt, 0.4) * (1 - on(t, everyAt, 0.4)), right = on(t, nothingAt, 0.4);
    if (ch > 0) {
      var pulse = right > 0 ? 1 : 0.75 + 0.25 * breathe(t);
      out += MK.pop(MK.pill(198, 392, "Attracted", pulse * (1 - 0.6 * right), { size: 24, col: P.line }), 198, 392, ch) +
        MK.pop(MK.pill(390, 392, "Not attracted", pulse, { size: 24, col: right > 0.5 ? P.good : P.line, fill: right > 0.5 ? "#15433A" : P.card }), 390, 392, ch) +
        G(MK.qmark(EM_ST.x + 230 * 1.6, EM_ST.y + 62 * 1.6, 22, 1), { opacity: ch * (1 - right) });
    }
    var nm = popIn(t, everyAt, 0.4);
    if (nm > 0) out += G(MK.pop(MK.pill(232, 392, "not magnetic", 1, { size: 24, col: P.bad }), 232, 392, nm), { opacity: fade });
    /* the table */
    var tp = popIn(t, tableAt, 0.45);
    if (tp <= 0) return svg(out);
    out += G(R(556, 4, 608, 432, 18, P.card, look > 0 ? P.gold : P.line, 2 + 2 * look * (0.6 + 0.4 * breathe(t))) +
      Tx(646, 40, "Thing", "lab mid muted", "start") + Tx(1060, 40, "Attracted?", "lab mid muted", "middle"), { opacity: Math.min(1, tp) });
    EM_ROWS.forEach(function (r, k) {
      var ro = on(t, tableAt + k * 0.16, 0.35);
      if (ro <= 0) return;
      var y = 58 + k * 75, yc = y + 34, test = null;
      plan.forEach(function (p) { if (p.row === k) test = p; });
      var live = cur.row === k && test.in != null && t >= test.in - 0.1 && (test.done == null || t < test.done + 0.6);
      var dimNo = r.yes ? 1 : 1 - 0.6 * look, glowYes = r.yes ? look : 0;
      var mat = iron > 0 && r.mat === "steel" ? "fill:" + P.gold : "fill:" + P.ink;
      var body = R(566, y, 588, 68, 14, live ? "#1B3A52" : glowYes > 0 ? "#15433A" : P.cell, live ? P.good : glowYes > 0 ? P.good : "none", 2) +
        MK.pic(608, yc, 50, r.pic) +
        el("text", { x: 646, y: yc + 10, "class": "lab big", "text-anchor": "start" },
          '<tspan style="' + mat + '">' + r.mat + "</tspan>" + r.rest);
      var dp = test && test.done != null ? popIn(t, test.done, 0.35) : 0;
      if (dp > 0) body += MK.pop(Tx(1044, yc + 10, r.yes ? "Yes" : "No", "lab big " + (r.yes ? "good" : "bad"), "middle"), 1044, yc, dp) +
        (r.yes ? MK.tick(1112, yc, 18, dp) : MK.cross(1112, yc, 18, dp));
      else if (k === 4 && predictAt != null && t >= predictAt) body += Tx(1044, yc + 10, "?", "lab big muted", "middle", { opacity: on(t, predictAt, 0.4) });
      out += G(body, { opacity: Math.min(1, tp) * ro * dimNo });
    });
    return svg(EM_DEFS + out);
  }

  /* ==== the recap, and the kinds ================================================= */
  var KINDS = {
    title: MK.titleKind({ sub: ["What needs electricity, and where it comes from.", "Three rules to keep you safe.", "What a magnet attracts, and what it does not."] }),
    needs: sceneNeeds,
    source: sceneSource,
    safety: sceneSafety,
    magnet: sceneMagnet,
    steel: sceneSteel,
    recap: MK.recapKind([
      { beat: 0, at: "need", title: "Needs electricity", pic: "\u{1F4A1}" },
      { beat: 0, at: "from", title: "Socket or battery", pic: function (cx, cy, size) {
        return emSocket(cx - size * 0.42, cy, size * 0.62, 0) + MK.pic(cx + size * 0.42, cy, size * 0.8, "\u{1F50B}");
      } },
      { beat: 1, at: "rules", title: "Three safety rules", pic: "⚠️" },
      { beat: 2, at: "attracts", title: "Iron and steel", pic: function (cx, cy, size) {
        return MK.pic(cx - size * 0.3, cy, size * 0.9, "\u{1F9F2}") + MK.pic(cx + size * 0.42, cy + size * 0.06, size * 0.7, EM_CLIP);
      } },
      { beat: 2, at: "metal", title: "Not every metal", pic: EM_FOIL }
    ], { goBeat: 3, goAt: "go" })
  };

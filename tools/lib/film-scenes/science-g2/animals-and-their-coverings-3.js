  /* ==== Animals and Their Coverings, part 3 of 4: the chapters "Alike and
     different" and "Growing up" =================================================

     Alike and different is the lesson's own pair, the cat and the dog of its
     lecture part 2: both have four legs, two ears and fur, and only the cat can
     pull its claws in. The paws are drawn rather than emoji, because the
     picture has to show the claws out and then pulled in.

     Growing up is the lesson's order step (egg, chick, young hen, grown hen)
     and its demo (a baby, a child, a grown-up), in the lesson's own order. */

  /* ---- a paw, drawn: the pad, four toes, and claws out or pulled in ----------
     claws 0..1 is how far the claws reach past the toes. */
  var AC_TOE = [[-0.56, -0.18, 0.20], [-0.20, -0.34, 0.22], [0.20, -0.34, 0.22], [0.56, -0.18, 0.20]];
  function acPaw(cx, cy, r, claws, o, col) {
    if (!(o > 0)) return "";
    col = col || { fill: "#E8A85C", line: "#A85A16" };
    var out = E(cx, cy + r * 0.36, r * 0.54, r * 0.4, col.fill, col.line, r * 0.055);
    AC_TOE.forEach(function (d) {
      var x = cx + d[0] * r, y = cy + d[1] * r, rr = d[2] * r;
      var a = -Math.PI / 2 + d[0] * 1.15;                 /* the claw points out and up */
      var len = rr * 1.5 * clamp(claws, 0, 1);
      if (len > 1) {
        var tipx = x + Math.cos(a) * (rr + len), tipy = y + Math.sin(a) * (rr + len);
        var bx = x + Math.cos(a) * rr * 0.7, by = y + Math.sin(a) * rr * 0.7;
        out += Pth("M" + n2(bx - Math.sin(a) * rr * 0.44) + "," + n2(by + Math.cos(a) * rr * 0.44) +
          " Q" + n2(bx + Math.cos(a) * len * 0.7 - Math.sin(a) * rr * 0.5) + "," + n2(by + Math.sin(a) * len * 0.7 + Math.cos(a) * rr * 0.5) +
          " " + n2(tipx) + "," + n2(tipy) +
          " Q" + n2(bx + Math.cos(a) * len * 0.45 + Math.sin(a) * rr * 0.22) + "," + n2(by + Math.sin(a) * len * 0.45 - Math.cos(a) * rr * 0.22) +
          " " + n2(bx + Math.sin(a) * rr * 0.44) + "," + n2(by - Math.cos(a) * rr * 0.44) + " Z", "#FFF4DF", "#C9A46C", r * 0.03);
      }
      out += E(x, y, rr, rr * 0.92, col.fill, col.line, r * 0.05);
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: alike and different ==================================================
     Left, what the cat and the dog share, ticked as each is said. Right, the one
     difference the lesson names: the cat's claws come out and pull back in, and
     the dog's do not. The two words of the last line label the two halves. */
  var AC_BOTH = [["four legs", "legs"], ["two ears", "ears"], ["fur", "fur"]];

  function acAlikeChapter(scene, beat, t, i) {
    var c = function (b, n) { return sc(scene, b, n); }, out = "";
    var cCat = c(0, "cat"), cDog = c(0, "dog");
    var cClaws = c(1, "claws"), cPull = c(1, "pull"), cDog2 = c(1, "dog");
    var cAlike = c(2, "alike"), cDiff = c(2, "different");

    /* ---- the left half: alike ---- */
    var lo = on(t, cCat, 0.5);
    var rowsO = on(t, c(0, "legs"), 0.4);
    if (rowsO > 0) out += R(60, 262, 464, 172, 22, P.card, P.good, 2,
      { opacity: rowsO, "stroke-opacity": 0.32 + 0.68 * on(t, cAlike, 0.5) });
    out += acPop(150, 158, 190, AC.catBody, popIn(t, cCat, 0.45));
    out += acPop(404, 158, 190, AC.dog, popIn(t, cDog, 0.45));
    AC_BOTH.forEach(function (row, k) {
      var rat = c(0, row[1]), o = on(t, rat, 0.4);
      if (o <= 0) return;
      var y = 296 + k * 54;
      out += MK.tick(106, y, 18, popIn(t, rat, 0.4)) +
        Tx(148, y + 11, row[0], "lab big", "start", { opacity: o, transform: "translate(" + n2((1 - o) * 14) + ",0)" });
    });
    if (lo > 0) out += MK.pill(287, 32, "alike", on(t, cAlike, 0.45), { size: 30, col: P.good, ink: P.good, fill: P.ground });

    /* ---- the divider, drawn as the second line starts ---- */
    var dv = on(t, cClaws, 0.7);
    if (dv > 0) out += L(566, 74, 566, lerp(74, 424, dv), P.line, 3, { "stroke-dasharray": "12 10", opacity: dv });

    /* ---- the right half: different ---- */
    var ro = on(t, cClaws, 0.45);
    if (ro > 0) {
      out += R(606, 80, 542, 340, 22, P.card, P.accent, 2,
        { opacity: ro, "stroke-opacity": 0.3 + 0.7 * on(t, cDiff, 0.5) });
      /* the cat: its claws come out, then pull back in. They SHORTEN into the
         paw and never reach nothing: the line is "a cat has claws it can pull
         in", and for all but half a second of the chapter this is the only
         picture of a claw a learner gets ("claws" is said once in the whole
         lesson). At 0 the cat sat clawless beside a dog whose claws are always
         out, which is the opposite of what is being said. */
      var outc = on(t, cClaws, 0.55) * (1 - 0.7 * on(t, cPull, 0.7));
      out += G(MK.pic(664, 160, 86, AC.catBody), { opacity: ro });
      out += acPaw(790, 160, 74, outc, ro);
      /* the pull: two short arrows pressing the claws back into the paw */
      var pu = on(t, cPull, 0.5) * (1 - inAt(t, (cPull == null ? 0 : cPull) + 1.4, 0.5));
      if (cPull != null && pu > 0) out += MK.arrow(686, 112, 736, 140, pu, P.good, 6) +
        MK.arrow(894, 112, 844, 140, pu, P.good, 6);
      out += MK.pill(1010, 160, "can pull them in", on(t, cPull, 0.55), { size: 20, col: P.good, ink: P.good });
      out += MK.tick(1010, 232, 18, popIn(t, cPull == null ? null : cPull + 0.6, 0.4));
    }
    /* the dog: its claws stay where they are */
    var dgo = on(t, cDog2, 0.45);
    if (dgo > 0) {
      out += G(MK.pic(664, 330, 86, AC.dog), { opacity: dgo });
      out += acPaw(790, 330, 74, 1, dgo, { fill: "#C79A68", line: "#7E5330" });
      out += MK.pill(1010, 330, "cannot", on(t, cDog2, 0.6), { size: 20, col: P.bad, ink: P.bad });
      out += MK.cross(1010, 400, 18, popIn(t, cDog2 == null ? null : cDog2 + 0.35, 0.4));
    }
    if (ro > 0) out += MK.pill(876, 32, "different", on(t, cDiff, 0.45), { size: 30, col: P.accent, ink: P.accent, fill: P.ground });
    return svg(out);
  }

  /* ==== chapter: growing up ===========================================================
     The lesson's order step across the top - egg, chick, young hen, grown hen -
     with the grown hen's own egg curving back to the start. On the fourth line
     the row lifts and shrinks to make room for the lesson's demo: a baby, a
     child and a grown-up. On the last line a gold arrow runs under each row: the
     same thing happens to both. */
  var AC_HEN = [[AC.egg, "egg"], [AC.hatch, "chick"], [AC.young, "young hen"], [AC.hen, "grown hen"]];
  var AC_HEN_X = [190, 450, 710, 970];
  var AC_PPL = [[AC.baby, "baby"], [AC.child, "child"], [AC.adult, "grown-up"]];
  var AC_PPL_X = [340, 610, 880];
  /* the last line of that beat is "A grown-up is taller", so the three are
     drawn at three heights and stood on ONE baseline, rather than at one size
     with the word taller over them. An emoji reaches about 0.61 of its size
     above its own centre, which is what keeps the grown-up clear of its pill. */
  var AC_PPL_S = [92, 108, 122], AC_PPL_FOOT = 380;
  function acPplY(k) { return AC_PPL_FOOT - AC_PPL_S[k] * 0.61; }
  var AC_CAPS = [["cannot walk or talk", 0], ["walks and talks", 1], ["taller", 2]];

  function acGrowChapter(scene, beat, t, i) {
    var c = function (b, n) { return sc(scene, b, n); }, out = "";
    var cEgg = c(0, "egg"), cHatch = c(0, "hatches"), cChick = c(0, "chick");
    var cBig = c(1, "bigger"), cFea = c(1, "feathers"), cYoung = c(1, "young");
    var cGrown = c(2, "grown"), cEggs = c(2, "eggs");
    var cBaby = c(3, "baby"), cCannot = c(3, "cannot"), cChild = c(3, "child"), cAdult = c(3, "adult");
    var cPeople = c(4, "people"), cAnimals = c(4, "animals");
    var up = into(t, scene.first + 3);
    var hy = lerp(150, 86, up), hs = lerp(132, 84, up), hl = lerp(246, 152, up);
    var at = [cEgg, cChick, cYoung, cGrown];

    /* the arrows between the four stages */
    for (var k = 1; k < 4; k++) {
      var u = on(t, at[k], 0.6);
      if (u <= 0) continue;
      out += MK.arrow(AC_HEN_X[k - 1] + hs * 0.58, hy, AC_HEN_X[k] - hs * 0.58, hy, u, P.good, 6);
    }
    /* the four stages */
    AC_HEN.forEach(function (st, k) {
      var p = popIn(t, at[k], 0.45);
      if (p <= 0) return;
      var x = AC_HEN_X[k], grow = k === 1 ? 1 + 0.12 * on(t, cBig, 0.8) : 1;
      var shake = k === 0 ? 3.5 * Math.sin((t - (cHatch == null ? 0 : cHatch)) * 26) * bump(t, cHatch, 0.9) : 0;
      out += G(MK.pic(x + shake, hy, hs * grow, st[0]), { transform: around(x, hy, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      out += Tx(x, hl, st[1], "lab mid muted", "middle", { opacity: Math.min(1, p) });
    });
    /* the egg cracks open */
    var cr = on(t, cHatch, 0.4) * (1 - on(t, cChick, 0.5));
    if (cr > 0) out += Pth("M" + n2(AC_HEN_X[0] - hs * 0.21) + "," + n2(hy - hs * 0.04) +
      " l" + n2(hs * 0.1) + "," + n2(hs * 0.1) + " l" + n2(hs * 0.11) + ",-" + n2(hs * 0.11) +
      " l" + n2(hs * 0.11) + "," + n2(hs * 0.1), null, P.ground, 4, { opacity: cr });
    /* the chick grows feathers */
    var fo = popIn(t, cFea, 0.45) * (1 - up);
    if (fo > 0) {
      var fx = AC_HEN_X[1] + hs * 0.64, fy = hy - hs * 0.5;
      out += G(MK.pic(fx, fy, 72, AC.feather), { transform: around(fx, fy, Math.min(fo, 1.1)), opacity: Math.min(1, fo) });
    }
    /* she lays eggs of her own: one pops beside her, and the cycle closes */
    var eo = on(t, cEggs, 0.4) * (1 - up);
    if (eo > 0) {
      var ex = AC_HEN_X[3] + hs * 0.64, ey = hy + hs * 0.3;
      out += G(MK.pic(ex, ey, 60, AC.egg), { transform: around(ex, ey, Math.min(popIn(t, cEggs, 0.4), 1.1)), opacity: eo });
      var u2 = on(t, cEggs, 0.75), LEN = 980, endy = hy + hs * 0.64;
      out += Pth("M" + n2(ex) + "," + n2(ey + 30) + " C1010,336 300,336 " + n2(AC_HEN_X[0] + 16) + "," + n2(endy),
        null, P.good, 5, { opacity: eo, "stroke-dasharray": n2(LEN) + " " + n2(LEN), "stroke-dashoffset": n2(LEN * (1 - u2)) });
      if (u2 > 0.9) out += Pth("M" + n2(AC_HEN_X[0] + 16) + "," + n2(endy) + " l14,20 l8,-26 Z", P.good, P.good, 2, { opacity: eo });
    }

    /* the people, once the row has lifted */
    var pat = [cBaby, cChild, cAdult], capAt = [cCannot, cChild, cAdult];
    AC_PPL.forEach(function (st, k) {
      var p = popIn(t, pat[k], 0.45);
      if (p <= 0) return;
      var x = AC_PPL_X[k];
      var py = acPplY(k), ps = AC_PPL_S[k];
      if (k > 0) out += MK.arrow(AC_PPL_X[k - 1] + 78, 318, x - 78, 318, on(t, pat[k], 0.6), P.good, 6);
      out += G(MK.pic(x, py, ps, st[0]), { transform: around(x, py, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      out += Tx(x, 398, st[1], "lab mid muted", "middle", { opacity: Math.min(1, p) });
      /* each caption hangs off its OWN person's head, 30 px above it, and a
         short dashed tether says so. Drawn at one shared y of 208 the three
         gold pills sat in the gap under the hen row's labels and read as a
         band belonging to the hens, 60 to 100 px above the people they
         describe. The heads are at three heights, so the pills stagger with
         them, which is itself the "taller" the third one says. */
      var capY = py - 0.61 * ps - 30, cp = on(t, capAt[k], 0.45);
      out += MK.pill(x, capY, AC_CAPS[k][0], cp, { size: 20, col: P.gold, ink: P.gold });
      if (cp > 0) out += L(x, capY + 18, x, py - 0.61 * ps, P.gold, 2,
        { "stroke-dasharray": "5 5", opacity: 0.7 * cp });
    });

    /* the last line: the same thing happens in both rows. The hens' arrow runs
       ABOVE their row, not in the gap below their labels: down there it landed
       32 px over the captions and the two golds read as one band. */
    out += MK.arrow(236, 424, 984, 424, on(t, cPeople, 1.0), P.gold, 7);
    out += MK.arrow(118, 20, 1042, 20, on(t, cAnimals, 1.0), P.gold, 7);
    return svg(out);
  }

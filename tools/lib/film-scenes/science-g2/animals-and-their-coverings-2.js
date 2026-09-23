
  /* ==== Animals and Their Coverings, part 2 of 4: the chapters "Coverings" and
     "Sort by covering" ============================================================ */

  function acCoveringsChapter(scene, beat, t, i) {
    var k = i - scene.first, out = "", c = function (b, n) { return sc(scene, b, n); };
    var names = [c(0, "cat"), c(1, "bird"), c(2, "fish"), c(3, "frog"), c(4, "you")];
    var covs = [c(0, "fur"), c(1, "feathers"), c(2, "scales"), c(3, "skin"), c(4, "you")];
    /* the close-up, its word and the pointers are gone BEFORE the child crosses
       the space they were in: the child's flight path runs through the window */
    var cAnimal = c(4, "animal"), g = on(t, cAnimal, 0.9), fin = 1 - clamp(g * 2.4, 0, 1);
    var cFly = c(1, "fly"), birdDy = -34 * on(t, cFly, 1.0) + 4 * Math.sin((t - (cFly || 0)) * 7) * bump(t, cFly, 1.6);
    /* how far animal j has gone from the big place into its tile */
    var flight = function (j) { return j < 4 ? into(t, scene.first + j + 1) : g; };
    var mainY = function (j) { return ACV.ay + (j === 1 ? birdDy : 0); };

    /* the row along the bottom: a dashed slot until its animal lands in it */
    var row = "";
    for (var j = 0; j < 5; j++) row += acRowTile(j, flight(j) >= 1);
    /* the ring round the whole row waits until the child has landed in it: at
       +0.5 it drew itself, and its "animals" pill, straight across the child
       still arcing over the row */
    var box = on(t, cAnimal == null ? null : cAnimal + 0.9, 0.45);
    if (box > 0) row += R(71, 344, 1026, 100, 28, "none", P.teal, 3, { "stroke-dasharray": "16 11", opacity: box }) +
      MK.pill(584, 312, "animals", box, { size: 30, col: P.teal, ink: P.teal, fill: P.ground });
    out += G(row, { transform: acRowTransform(g) });

    /* the close-up window: the covering being named opens in it; the one before fades */
    var lens = C(ACV.lx, ACV.ly, ACV.lr, P.cell);
    for (var q = Math.max(0, k - 1); q <= k; q++) {
      var fade = q < k ? 1 - into(t, scene.first + k) : 1, rev = on(t, covs[q], 0.6);
      if (fade <= 0 || rev <= 0) continue;
      var opts = { sway: on(t, c(0, "soft"), 0.5), flash: bump(t, c(2, "overlap"), 0.9) };
      if (q === 2) opts.rows = 1.4 + 9 * clamp((t - (covs[2] + 0.15)) / Math.max(0.5, c(2, "overlap") + 0.7 - covs[2] - 0.15), 0, 1);
      lens += el("clipPath", { id: "acLens" + q }, C(ACV.lx, ACV.ly, ACV.lr * (q < k ? 1 : rev))) +
        G(acCovering(q, ACV.lx, ACV.ly, ACV.lr, t, opts, "acLensSkin" + q), { "clip-path": "url(#acLens" + q + ")", opacity: fade });
    }
    lens += C(ACV.lx, ACV.ly, ACV.lr, "none", P.line, 6);

    /* the zoom from the animal to the window, and the lesson's word for the covering */
    var zoom = "", words = "";
    for (var z = Math.max(0, k - 1); z <= k; z++) {
      var zo = on(t, covs[z], 0.45) * (z < k ? 1 - into(t, scene.first + k) : 1) * fin;
      if (zo <= 0) continue;
      var sx = ACV.ax + AC_COVS[z].spot[0] * ACV.as, sy = mainY(z) + AC_COVS[z].spot[1] * ACV.as;
      zoom += G(L(sx, sy - 18, ACV.lx - 30, ACV.ly - ACV.lr + 3, P.gold, 3, { "stroke-dasharray": "9 8" }) +
        L(sx, sy + 18, ACV.lx - 30, ACV.ly + ACV.lr - 3, P.gold, 3, { "stroke-dasharray": "9 8" }) + C(sx, sy, 18, "none", P.gold, 4), { opacity: zo });
      var wp = popIn(t, covs[z], 0.4);
      if (wp > 0) words += G(Tx(ACV.wx, 118, AC_COVS[z].word, "lab huge", "start", { fill: P.gold, "font-size": 58 }),
        { opacity: Math.min(1, wp) * (z < k ? 1 - into(t, scene.first + k) : 1) * fin, transform: around(ACV.wx, 100, Math.min(wp, 1.1)) });
    }
    out += zoom + G(lens, { opacity: fin }) + words;

    /* the cat: "to keep it warm" */
    out += MK.glow(ACV.ax, ACV.ay, 176, P.accent, on(t, c(0, "warm"), 0.5) * (0.7 + 0.3 * breathe(t)) * (1 - flight(0)));
    /* the bird: "light and warm": one of its feathers drifts down, light as it is */
    var cLight = c(1, "light"), fl = on(t, cLight, 0.4) * (1 - flight(1));
    if (fl > 0) {
      var fu = clamp((t - cLight) / 2.0, 0, 1), fx = 930 + 30 * Math.sin((t - cLight) * 3.1), fy = lerp(196, 300, ease(fu));
      /* drawn in the bird's own red, not the kit's blue feather: it is one of
         THIS bird's feathers, and the close-up in the lens beside it is red */
      out += G(acFeather1(fx, fy, 104, "red"), { opacity: fl, transform: "rotate(" + n2(18 * Math.sin((t - cLight) * 3.1)) + " " + n2(fx) + " " + n2(fy) + ")" });
    }
    /* the frog: no fur, no feathers, no scales */
    var noO = 1 - flight(3);
    [["nofur", 0], ["nofeathers", 1], ["noscales", 2]].forEach(function (n, m) {
      var p = popIn(t, c(3, n[0]), 0.4) * noO;
      if (p <= 0) return;
      var x = 830 + m * 118, y = 276, id = "acNo" + m;
      out += MK.pop(C(x, y, 46, P.cell) + el("clipPath", { id: id }, C(x, y, 46)) + G(acCovering(m, x, y, 46, t, {}, id), { "clip-path": "url(#" + id + ")" }) +
        C(x, y, 46, "none", P.line, 3), x, y, p) + MK.cross(x + 32, y - 32, 20, popIn(t, c(3, n[0]) + 0.2, 0.35) * noO);
    });
    /* you: "hair on your head" */
    var cHair = c(4, "hair"), ho = on(t, cHair, 0.4) * (1 - clamp(g * 2.4, 0, 1));
    if (ho > 0) out += MK.leader(348, 44, ACV.ax + 0.04 * ACV.as, ACV.ay - 0.36 * ACV.as, on(t, cHair, 0.6), P.gold) +
      MK.pill(356, 44, "hair", ho, { size: 28, anchor: "start", col: P.gold });

    /* the animals: big as each is named, then OVER the row and down into their
       own tile. The path is an arc, not a straight line: every animal starts at
       the same place on the left and the tiles fill left to right, so a straight
       lerp drags each one across the tiles already filled - the child crossed
       the whole row and sat on the "scales" tile with the word half under it.
       The lift is scaled by how far it has to travel, so the cat (which barely
       moves) does not leap. */
    for (var a = 0; a < 5; a++) {
      var p = popIn(t, names[a], 0.45), f = flight(a);
      if (p <= 0 || f >= 1) continue;
      var tgt = acRowXY(AC_TILE.x0 + a * AC_TILE.step + 42, AC_TILE.y + 38, g), s = AC_TILE.es * (1 + 0.1 * g);
      var lift = Math.min(100, Math.abs(tgt[0] - ACV.ax) * 0.14);
      var pos = acHop([ACV.ax, mainY(a)], tgt, f, lift), size = lerp(ACV.as, s, f);
      var x = pos[0], y = pos[1];
      out += G(MK.pic(x, y, size, AC_COVS[a].pic), { transform: around(x, y, f > 0 ? 1 : Math.min(p, 1.1)), opacity: Math.min(1, p) });
    }
    return svg(out);
  }

  /* ==== chapter: sort by covering =====================================================
     The lesson's own sort: its four bins (Fur with the cat, Feathers with the
     feather, Scales with the fish, Bare skin with the frog) and its dog, duck,
     crocodile and penguin. Each animal goes into its bin as its covering is
     named. The penguin swims, and heads for the fish; it is a bird, so it goes
     in with the feathers. Last, a close look at its outside, and the water it
     lives in crossed out. */
  var AC_BINS = [["Fur", AC.cat], ["Feathers", AC.feather], ["Scales", AC.fish], ["Bare skin", AC.frog]];
  function acBinX(b) { return 76 + b * 260; }
  /* 208 with a 214-tall bin: popIn overshoots to 1.1 about the bin's centre, and
     at 214 / 218 the bottom edge went 4 px past the box on the way in. */
  var AC_BIN_Y = 208;
  /* the waiting animals, and where each one ends up: [pic, bin, slot] */
  var AC_SORT = [[AC.dog, 0, 0, 236], [AC.duck, 1, 0, 460], [AC.croc, 2, 0, 684], [AC.penguin, 1, 1, 908]];
  function acSlot(b, s) { return [acBinX(b) + 66 + s * 104, 364]; }
  /* a jump along an arc from a to b, u 0..1 */
  function acHop(a, b, u, lift) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (lift || 80)]; }

  function acSortChapter(scene, beat, t, i) {
    var c = function (b, n) { return sc(scene, b, n); }, out = "", hue = HUE.sort;
    var cSort = c(0, "sort"), cAnimals = c(0, "animals"), cSame = c(0, "same"), cTog = c(0, "together");
    var goes = [c(1, "dog"), c(1, "duck"), c(1, "croc")], yes = [c(1, "fur"), c(1, "feathers"), c(1, "scales")];
    var cPen = c(2, "penguin"), cSwim = c(2, "swims"), cFish = c(2, "fish"), cBird = c(2, "bird"), cFea = c(2, "feathers");
    var cLook = c(3, "look"), cLives = c(3, "lives");

    /* the bins, and a tick on each as the covering that fills it is named */
    var ticks = [[yes[0]], [yes[1], cFea], [yes[2]], []];
    AC_BINS.forEach(function (bn, b) {
      var p = popIn(t, cSort == null ? null : cSort + b * 0.12, 0.45);
      if (p <= 0) return;
      var x = acBinX(b), lit = bump(t, cTog, 1.0), hp = 1 + 0.18 * bump(t, cSame == null ? null : cSame + b * 0.12, 0.8);
      var g = R(x, AC_BIN_Y, 236, 214, 22, P.card, lit > 0.05 ? hue : P.line, 2 + 3 * lit) + L(x + 14, AC_BIN_Y + 72, x + 222, AC_BIN_Y + 72, P.line, 2) +
        G(MK.pic(x + 40, AC_BIN_Y + 36, 50, bn[1]), { transform: around(x + 40, AC_BIN_Y + 36, hp) }) +
        Tx(x + 74, AC_BIN_Y + 46, bn[0], "lab", "start", { "font-size": 27 });
      ticks[b].forEach(function (at) { g += MK.tick(x + 214, AC_BIN_Y + 2, 18, popIn(t, at, 0.35)); });
      out += MK.pop(g, x + 118, AC_BIN_Y + 107, p);
    });
    /* the penguin tries the fish, and is crossed - beside the penguin where it
       hovers, never on the bin's own corner, where the crocodile's tick sits */
    out += MK.cross(acBinX(2) + 174, 132, 22, popIn(t, cFish == null ? null : cFish + 0.5, 0.35) * (1 - on(t, cBird, 0.4)));

    /* the water the penguin swims in. It stays where it swam until "Look at the
       outside", when it slides up beside the close-up, so the two halves of that
       line stand side by side: the outside on the left, where it lives on the
       right, and only the left one decides.
       It sits HIGH, at the penguin's own feet, and smaller than a bin's icon:
       at y 162 and 92 px across its bottom edge ran into the top-left corner of
       the Bare skin bin, a bin the penguin has nothing to do with, for the
       first three cues of the line. Nothing may come within about 20 px of
       AC_BIN_Y, which is what the slid position at y 128 already keeps. */
    var home = [AC_SORT[3][3], 134], wo = on(t, cSwim, 0.4), acSlide = on(t, cLook, 0.7);
    var wx = lerp(home[0], 742, acSlide), wy = lerp(home[1], 128, acSlide);
    if (wo > 0) {
      out += G(MK.pic(wx, wy, 76, AC.water), { opacity: wo * (1 - 0.45 * on(t, cBird, 0.5)) });
      out += MK.cross(wx + 48, wy - 26, 26, popIn(t, cLives, 0.4));
      out += MK.pill(742, 30, "where it lives", acSlide, { size: 26, col: P.muted, ink: P.muted });
    }
    /* the animals: waiting in a row, then each to its bin */
    AC_SORT.forEach(function (a, n) {
      var p = popIn(t, cAnimals == null ? null : cAnimals + n * 0.14, 0.45);
      if (p <= 0) return;
      var start = [a[3], 100], pos = start, size = 118;
      if (n < 3) {
        var u = on(t, goes[n], 0.9);
        pos = acHop(start, acSlot(a[1], a[2]), u, 70); size = lerp(118, 100, u);
      } else {
        /* swims: it bobs on the water; not a fish: over the fish's bin; a bird: into feathers */
        var bob = on(t, cSwim, 0.3) * (1 - on(t, cFish, 0.3)) * 7 * Math.sin((t - (cSwim || 0)) * 6.5);
        var toFish = on(t, cFish, 0.7), toBird = on(t, cBird, 0.9), over = [acBinX(2) + 118, 176];
        pos = acHop(start, over, toFish, 40);
        pos = [pos[0], pos[1] + bob];
        if (toBird > 0) pos = acHop(pos, acSlot(1, 1), toBird, 90);
        size = lerp(lerp(118, 108, toFish), 100, toBird);
      }
      var pulse = n === 3 ? 1 + 0.12 * bump(t, cPen, 0.7) : 1 + 0.12 * bump(t, yes[n], 0.7);
      out += G(MK.pic(pos[0], pos[1], size, a[0]), { transform: around(pos[0], pos[1], Math.min(p, 1.1) * pulse), opacity: Math.min(1, p) });
    });

    /* "Look at the outside of the animal": a close look at the penguin, feathers */
    /* The window sits straight above the penguin, over its OWN bin: beside the
       Scales bin a feather close-up at this size read as scales. */
    var lk = on(t, cLook, 0.5);
    if (lk > 0) {
      var ps = acSlot(1, 1), lx = ps[0], ly = 132, r = 74;
      out += G(L(ps[0], ps[1] - 44, lx, ly + r + 8, P.gold, 3, { "stroke-dasharray": "9 8" }) +
        C(ps[0], ps[1], 40, "none", P.gold, 4) + C(lx, ly, r, P.cell) + el("clipPath", { id: "acPenLens" }, C(lx, ly, r * lk)) +
        G(acFeathers(lx, ly, r, "dark"), { "clip-path": "url(#acPenLens)" }) + C(lx, ly, r, "none", P.gold, 5), { opacity: Math.min(1, lk * 1.5) });
      /* the close-up is named. A penguin's feathers are dark and small, and
         unnamed at this size a child can read them as the scales we have just
         said it does not have. */
      out += MK.pill(lx, 30, "feathers", lk, { size: 26, col: P.gold, ink: P.gold });
    }
    return svg(out);
  }

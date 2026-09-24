  /* ==== Sides and Corners, part 2 ==============================================
     tools/lib/film-scenes/math-g2/sides-and-corners-2.js: the chapters
     "Naming a shape" and "Solid shapes". Joined to part 1 and part 3 in one
     scope; see the header of sides-and-corners.js. */

  /* ==== chapter: naming a shape ==================================================
     Five of ART's own flat shapes in a row, each with its sides numbered by
     the library from the shape's own geometry, and each lit as the voice names
     it: triangle, square, rectangle, pentagon, hexagon. The last beat drops
     the row for one big square, which tips over and is still a square. */
  var SAC_NAMES = [
    { k: "triangle", beat: 1, at: "tri", ring: "three" },
    { k: "square", beat: 1, at: "sq", ring: "four" },
    { k: "rectangle", beat: 1, at: "rect", ring: "four" },
    { k: "pentagon", beat: 2, at: "pent", ring: "five" },
    { k: "hexagon", beat: 2, at: "hex", ring: "six" }
  ];
  var SAC_NW = 212, SAC_NH = SAC_NW * 288 / 276, SAC_NX0 = 10, SAC_NGAP = 22, SAC_NY = 108;
  function sacNameX(k) { return SAC_NX0 + k * (SAC_NW + SAC_NGAP); }

  function sacNameRow(t, scene) {
    var out = "", k;
    /* the triangle is already the one being looked at while the first line is
       said, so "Counting the sides" has something to point at */
    var firstAt = sc(scene, 0, "counting");
    for (k = 0; k < SAC_NAMES.length; k++) {
      var c = SAC_NAMES[k], x = sacNameX(k);
      var at = sc(scene, c.beat, c.at);
      var p = k === 0 ? Math.max(popIn(t, firstAt, 0.45), popIn(t, at, 0.45)) : popIn(t, at, 0.45);
      var ring = bump(t, sc(scene, c.beat, c.ring), 1.0);
      var lit = Math.max(Math.min(1, p), ring);
      var cx = x + SAC_NW / 2, cy = SAC_NY + SAC_NH / 2;
      out += G(ART.place(ART.shape2d(c.k, { sides: true, label: true }), x, SAC_NY, SAC_NW, SAC_NH),
        { opacity: (0.2 + 0.8 * lit).toFixed(3), transform: around(cx, cy, 0.94 + 0.06 * Math.min(p, 1.1)) });
      /* the ring on the words that say how many sides */
      if (ring > 0)
        out += R(x - 6, SAC_NY - 6, SAC_NW + 12, SAC_NH + 12, 26, "none", P.gold, 5, { opacity: ring });
    }
    /* "the shape's name": the first card's caption, underlined */
    var nameU = on(t, sc(scene, 0, "name"), 0.5) * (1 - Math.min(1, sacFrom(t, scene, 1)));
    if (nameU > 0) {
      var lx = sacNameX(0) + SAC_NW / 2, ly = SAC_NY + SAC_NH * 266 / 288 + 16;
      out += MK.glow(lx, ly - 14, 86, P.gold, nameU * (0.6 + 0.4 * breathe(t)));
      out += L(lx - 58 * nameU, ly, lx + 58 * nameU, ly, P.gold, 4);
    }
    return out;
  }

  /* the last beat: one square, tipped over, still a square */
  /* The card TURNS, so it has to fit the 1168 x 440 box turned: at 32 degrees
     a 252 x 263 card reaches 177 px from its middle, which is why it is that
     size and centred on (470, 220) rather than drawn as large as the space. */
  var SAC_TIPW = 252, SAC_TIPH = SAC_TIPW * 288 / 276, SAC_TIPX = 440 - 126, SAC_TIPY = 220 - SAC_TIPW * 288 / 276 / 2;
  function sacTipped(t, scene) {
    var cx = SAC_TIPX + SAC_TIPW / 2, cy = SAC_TIPY + SAC_TIPH / 2;
    var a = 32 * ease(clamp((t - (sc(scene, 3, "turned") || 0)) / 0.9, 0, 1));
    if (sc(scene, 3, "turned") == null) a = 0;
    var ringP = bump(t, sc(scene, 3, "tipped"), 1.1);
    var out = G(ART.place(ART.shape2d("square", { sides: true, corners: true, label: true }),
      SAC_TIPX, SAC_TIPY, SAC_TIPW, SAC_TIPH), { transform: "rotate(" + n2(a) + " " + n2(cx) + " " + n2(cy) + ")" });
    if (ringP > 0) out += C(cx, cy, 190, "none", P.gold, 5, { opacity: ringP });
    out += MK.tick(830, 216, 76, popIn(t, sc(scene, 3, "still"), 0.45));
    return out;
  }

  function sacNameChapter(scene, beat, t, i) {
    var u = scene.beats.length > 3 ? into(t, scene.first + 3) : 0;
    var out = "";
    if (u < 1) out += G(sacNameRow(t, scene), { opacity: 1 - u });
    if (u > 0) out += G(sacTipped(t, scene), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: solid shapes ====================================================
     ART's see-through cube, with its faces, then its edges, then its corners
     marked one at a time as they are counted; three tiles on the right hold
     the running totals, and every one of them is the library's own count for
     a cube: 6 faces, 12 edges, 8 corners. The last beat swaps the cube for a
     tin and a ball beside the cylinder and the sphere they really are. */
  var SAC_CUBE = { x: 40, y: 58, s: 336 };
  var SAC_TILEX = 420, SAC_TILEW = 452;

  function sacUpTo(n) { var a = [], i; for (i = 0; i < n; i++) a.push(i); return a; }

  /* how many faces, edges and corners are marked at t */
  function sacSolidCounts(t, scene, k) {
    var faces = 0, edges = 0, verts = 0;
    var faceAt = sc(scene, 0, "face"), oneAt = sc(scene, 1, "one"), sixAt = sc(scene, 1, "six");
    var edgeAt = sc(scene, 2, "edge"), twelveAt = sc(scene, 2, "twelve");
    var eightAt = sc(scene, 3, "eight"), diceAt = sc(scene, 3, "dice");
    if (faceAt != null && t >= faceAt) faces = 1;
    if (oneAt != null && sixAt != null && t >= oneAt)
      faces = Math.max(faces, tally(t, oneAt, 6, Math.max(sixAt - oneAt, 0.5)));
    if (edgeAt != null && t >= edgeAt) edges = 1;
    if (twelveAt != null && t >= twelveAt)
      edges = Math.max(edges, tally(t, twelveAt, 12, Math.max(spokenEnd(scene.first + 2) - twelveAt, 0.6) + 0.7));
    if (eightAt != null && t >= eightAt)
      verts = tally(t, eightAt, 8, Math.max((diceAt == null ? eightAt + 1.2 : diceAt) - eightAt, 0.6));
    return { faces: faces, edges: edges, verts: verts, k: k };
  }

  function sacCubeGroup(t, scene, c) {
    var out = "", opt = {};
    /* the faces are cleared once the edges are being counted, so only one
       thing at a time is being pointed at (rule 3) */
    if (c.k < 2 && c.faces) opt.faces = sacUpTo(c.faces);
    if (c.edges) opt.edges = sacUpTo(c.edges);
    if (c.verts) opt.vertices = sacUpTo(c.verts);
    out += ART.place(ART.solid("cube", opt), SAC_CUBE.x, SAC_CUBE.y, SAC_CUBE.s, SAC_CUBE.s);
    /* "you could paint it": a pool of light over the face just marked */
    var paint = bump(t, sc(scene, 0, "paint"), 1.2);
    if (paint > 0) out += MK.glow(SAC_CUBE.x + SAC_CUBE.s * 0.40, SAC_CUBE.y + SAC_CUBE.s * 0.44, 92, P.gold, paint);
    /* "Count the faces of the cube": the whole cube is rung before the
       counting itself starts, on the word one */
    var ring = bump(t, sc(scene, 1, "count"), 1.1);
    if (ring > 0) out += R(SAC_CUBE.x - 6, SAC_CUBE.y - 6, SAC_CUBE.s + 12, SAC_CUBE.s + 12, 26,
      "none", P.gold, 5, { opacity: ring });
    return out;
  }

  var SAC_SQ = sacPoly(4, 58, -45);
  function sacSolidRight(t, scene, c) {
    var out = "";
    /* "every face of a cube is a square" */
    var sq = popIn(t, sc(scene, 0, "square"), 0.45) * (1 - Math.min(1, sacFrom(t, scene, 1)));
    if (sq > 0) out += MK.pop(sacCard(950, 130, 180, 180, 1) + sacFace(1040, 220, SAC_SQ, 1), 1040, 220, sq);
    /* "a dice is a cube" */
    var dice = popIn(t, sc(scene, 3, "dice"), 0.45);
    if (dice > 0) out += MK.pop(sacCard(950, 130, 180, 180, 1) + Em(1040, 220, 126, "\u{1F3B2}"), 1040, 220, dice);
    return out;
  }

  /* beat 4: a tin and a ball, each beside the solid it is */
  function sacRealThings(t, scene) {
    var out = "";
    var tin = popIn(t, sc(scene, 4, "tin"), 0.45), cyl = popIn(t, sc(scene, 4, "cyl"), 0.45);
    var ball = popIn(t, sc(scene, 4, "ball"), 0.45), sph = popIn(t, sc(scene, 4, "sph"), 0.45);
    if (tin > 0) out += MK.pop(Em(150, 224, 136, "\u{1F96B}"), 150, 224, tin);
    if (cyl > 0) out += G(ART.place(ART.solid("cylinder", {}), 268, 82, 268, 268), { opacity: Math.min(1, cyl) });
    out += MK.arrow(232, 224, 274, 224, on(t, sc(scene, 4, "cyl"), 0.5), P.gold, 7);
    if (ball > 0) out += MK.pop(Em(660, 224, 136, "⚽"), 660, 224, ball);
    if (sph > 0) out += G(ART.place(ART.solid("sphere", {}), 778, 82, 268, 268), { opacity: Math.min(1, sph) });
    out += MK.arrow(742, 224, 784, 224, on(t, sc(scene, 4, "sph"), 0.5), P.gold, 7);
    return out;
  }

  /* beat 5: two of the lesson's own FLAT objects (its step 12 list), a door
     beside the rectangle it is and a clock face beside the circle it is.
     2Gg.08 asks for 2D AND 3D shapes in familiar objects; every object this
     chapter showed before this beat was solid. Same layout as sacRealThings
     on purpose, so "flat too" reads as the same kind of picture again. */
  var SAC_FLATH = 268 * 288 / 276;
  function sacFlatThings(t, scene) {
    var out = "";
    var door = popIn(t, sc(scene, 5, "door"), 0.45), rect = popIn(t, sc(scene, 5, "rect"), 0.45);
    var clockf = popIn(t, sc(scene, 5, "clockf"), 0.45), circ = popIn(t, sc(scene, 5, "circ"), 0.45);
    if (door > 0) out += MK.pop(Em(150, 224, 136, "\u{1F6AA}"), 150, 224, door);
    if (rect > 0) out += G(ART.place(ART.shape2d("rectangle", { label: true }), 268, 82, 268, SAC_FLATH), { opacity: Math.min(1, rect) });
    out += MK.arrow(232, 224, 274, 224, on(t, sc(scene, 5, "rect"), 0.5), P.gold, 7);
    if (clockf > 0) out += MK.pop(Em(660, 224, 136, "\u{1F55B}"), 660, 224, clockf);
    if (circ > 0) out += G(ART.place(ART.shape2d("circle", { label: true }), 778, 82, 268, SAC_FLATH), { opacity: Math.min(1, circ) });
    out += MK.arrow(742, 224, 784, 224, on(t, sc(scene, 5, "circ"), 0.5), P.gold, 7);
    return out;
  }

  function sacSolidChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var u = scene.beats.length > 4 ? into(t, scene.first + 4) : 0;
    var v = scene.beats.length > 5 ? into(t, scene.first + 5) : 0;
    var c = sacSolidCounts(t, scene, k);
    var out = "";
    if (u < 1) out += G(sacCubeGroup(t, scene, c) + sacSolidRight(t, scene, c), { opacity: 1 - u });
    if (u > 0) {
      if (v < 1) out += G(sacRealThings(t, scene), { opacity: u * (1 - v) });
      if (v > 0) out += G(sacFlatThings(t, scene), { opacity: u * v });
    }
    if (u < 1) out += G(
      sacTile(SAC_TILEX, 30, SAC_TILEW, 112, "faces", c.faces, P.accent, 1, c.faces > 0) +
      sacTile(SAC_TILEX, 162, SAC_TILEW, 112, "edges", c.edges, P.teal, 1, c.edges > 0) +
      sacTile(SAC_TILEX, 294, SAC_TILEW, 112, "corners", c.verts, P.plum, 1, c.verts > 0),
      { opacity: 1 - u });
    return svg(out);
  }

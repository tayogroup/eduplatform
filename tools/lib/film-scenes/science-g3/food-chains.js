  /* ==== Grade 3 Science, Lesson 6: Food Chains =================================
     tools/lib/film-scenes/science-g3/food-chains.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     science/grade-3-app/lecture-video/food-chains.json.

     The lesson's own drawing of the chain comes from ART: the chain builder of
     the "Build a food chain" step (ART.kit.foodChainSvg: grass, rabbit and fox,
     built link by link, with the roles printed above them and the lesson's own
     "the arrow means is eaten by" line under them). The film shows it whole and
     never crops it. Everything else is drawn from the lesson's own pictures:
     its eight sorting animals and their two bins, its three cards on a string,
     and its four things people do.

     This file: the palette, the small drawings every chapter shares, the title
     motif and the chapter "The producer". Every top-level name here starts with
     fc, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, producers: P.good, consumers: P.gold, sort: P.plum,
    arrow: P.accent, model: P.blue, people: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function fcOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function fcFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var FC_SCATTER = [0.17, 0.63, 0.41, 0.86, 0.29, 0.72, 0.08, 0.95, 0.52, 0.34, 0.77, 0.21];

  /* ---- the lesson's pictures, by name ----------------------------------------
     Exactly the emoji the lesson writes, so the film and the steps agree. */
  var FC = {
    grass: "\u{1F33F}", rabbit: "\u{1F407}", fox: "\u{1F98A}",
    oak: "\u{1F333}", owl: "\u{1F989}", fish: "\u{1F41F}", cow: "\u{1F404}", dandelion: "\u{1F33C}",
    snail: "\u{1F40C}", frog: "\u{1F438}", heron: "\u{1F9A2}", caterpillar: "\u{1F41B}", bird: "\u{1F426}",
    spray: "\u{1F9EA}", oil: "\u{1F6E2}️", milk: "\u{1F95B}",
    plate: "\u{1F37D}️", seedling: "\u{1F331}", sun: "☀️",
    hand: "✋", link: "\u{1F517}", roadworks: "\u{1F6A7}", arrow: "➡️"
  };

  /* ---- small drawings of the film's own --------------------------------------- */

  /* the Sun, the kit's gold, with eight rays turning slowly */
  function fcSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.32, cy + Math.sin(a) * r * 1.32, cx + Math.cos(a) * r * 1.78, cy + Math.sin(a) * r * 1.78, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.3, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* a drop of water, its round bottom centred on (x, y) */
  function fcDrop(x, y, r, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", "#7FC4EA") +
      C(x, y, r, "#7FC4EA") + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.75 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* air: three curved strokes blowing to the right, centred on (x, y) */
  function fcBreeze(x, y, s, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 3; k++) {
      var dy = (k - 1) * s * 0.34, w = s * (k === 1 ? 1 : 0.76);
      out += Pth("M" + n2(x - w / 2) + "," + n2(y + dy) + " q" + n2(w * 0.4) + "," + n2(-s * 0.22) + " " + n2(w * 0.72) + ",0" +
        " q" + n2(w * 0.24) + "," + n2(s * 0.2) + " " + n2(w * 0.12) + "," + n2(s * 0.16), null, "#9FC6E6", Math.max(2, s * 0.11));
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a band of grass-green ground from x0 to x1, its top at y */
  function fcGround(x0, y, x1, o) {
    if (!(o > 0)) return "";
    return G(R(x0, y, x1 - x0, 14, 7, P.grass) + R(x0, y, x1 - x0, 5, 3, "#5FB86C", null, null, { opacity: 0.7 }), { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill, with a leader line from it to the thing it names. The
     newest is gold; one named before it keeps its line, quieter. */
  function fcLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return (to ? MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col) : "") +
      MK.pill(x, y, text, o, { size: size || 26, anchor: anchor || "middle", col: now ? P.gold : P.line });
  }

  /* one slot of a chain strip: a dashed box that fills with a picture */
  function fcSlot(cx, cy, s, o, pic, lit) {
    if (!(o > 0)) return "";
    var h = s * 0.94;
    return G(R(cx - s / 2, cy - h / 2, s, h, 14, lit > 0 ? "#1B3A52" : "none", lit > 0 ? P.gold : P.line, 3,
        lit > 0 ? null : { "stroke-dasharray": "9 8" }) +
      (pic && lit > 0 ? MK.pic(cx, cy, s * 0.6, pic, { opacity: clamp(lit, 0, 1) }) : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title =================================================================
     The lesson's own chain builder, whole, under a Sun. In the spoken title
     chapter the fox is ringed on "has to eat", a question mark asks where its
     food came from, an arrow sweeps back along the chain on "Follow the food
     back", and the grass lights on "a plant". On the two cards it simply
     stands. */
  var FC_M = { x: 26, y: 132, s: 308 };
  function fcMX(v) { return FC_M.x + v * FC_M.s / 320; }
  function fcMY(v) { return FC_M.y + v * FC_M.s / 320; }

  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var chain = ART.kit.foodChainSvg({ grass: true, rabbit: true, fox: true });
    out += R(20, 20, 320, 320, 30, "#123247", P.line, 3);
    out += fcSun(180, 82, 22, 1, t);
    out += ART.place(chain, FC_M.x, FC_M.y, FC_M.s, FC_M.s * 200 / 320);
    if (!o.scene) return '<svg viewBox="0 0 360 360" role="img" aria-label="A food chain: grass, rabbit, fox">' + out + "</svg>";

    var cEat = sc(o.scene, 0, "eat"), cCome = sc(o.scene, 0, "come");
    var cFollow = sc(o.scene, 1, "follow"), cPlant = sc(o.scene, 1, "plant");
    var gx = fcMX(60), rx = fcMX(160), fx = fcMX(260), gy = fcMY(102);

    var eat = on(t, cEat, 0.4) * (1 - on(t, cFollow, 0.5));
    if (eat > 0) out += C(fx, gy, 29 + 4 * breathe(t), "none", P.gold, 4, { opacity: eat });
    out += MK.qmark(fx + 34, gy - 42, 17, popIn(t, cCome, 0.4) * (1 - on(t, cFollow, 0.5)));
    /* "Follow the food back": each link lights in turn, fox, rabbit, grass.
       NEVER an arrow. The lesson's own misconception is an arrow drawn the
       wrong way round ("The arrow points from the food to the eater"), and a
       gold arrow from the fox to the grass, drawn across the lesson's own
       card, is that mistake made twice the size of the right ones. */
    /* one link lit at a time, so the eye is walked back rather than shown
       three rings at once (rule 3) */
    var back = tally(t, cFollow, 3, 0.9), bxs = [fx, rx, gx];
    for (var k = 0; k < 3; k++) {
      if (back <= k) continue;
      var atk = cFollow == null ? null : cFollow + k * 0.45;
      var off = k < 2 ? on(t, cFollow == null ? null : cFollow + (k + 1) * 0.45, 0.3) : on(t, cPlant, 0.5);
      out += C(bxs[k], gy, 27 + 4 * breathe(t), "none", P.gold, 4,
        { opacity: on(t, atk, 0.3) * (1 - off) });
    }
    var pl = on(t, cPlant, 0.5);
    if (pl > 0) out += MK.glow(gx, gy, 52, P.good, pl * (0.7 + 0.3 * breathe(t))) +
      C(gx, gy, 27 + 4 * breathe(t), "none", P.good, 4, { opacity: pl });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A food chain: grass, rabbit, fox">' + out + "</svg>";
  }


  /* ==== chapter: the producer ======================================================
     The lesson's grass, big, with the three things it makes its food from on
     the left (sunlight, water and air, the lesson's own list) and, on the
     right, the plate it never uses and the food it makes instead. The last
     beat lays out the three-link strip the rest of the film fills in. */
  var FC_PG = { x: 400, y: 244, size: 176, ground: 346 };
  var FC_IN = [
    { y: 92,  cue: "sun",   text: "sunlight", from: [232, 104], to: [306, 198] },
    { y: 196, cue: "water", text: "water",    from: [232, 206], to: [302, 238] },
    { y: 300, cue: "air",   text: "air",      from: [232, 304], to: [306, 280] }
  ];

  function fcProducersChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNoEat = c(0, "noeat"), cMakes = c(0, "makes");
    var cProduces = c(1, "produces"), cProducer = c(1, "producer");
    var cGrass = c(2, "grass"), cNoEat2 = c(2, "noeat");
    var cChain = c(3, "chain"), cPlant = c(3, "plant"), cSun = c(3, "sun");
    var out = "", sunBig = on(t, cSun, 0.5);

    /* the field the grass stands in */
    out += fcGround(268, FC_PG.ground, 536, 1);
    var glow = Math.max(on(t, cGrass, 0.5) * fcOnly(t, scene, 2), sunBig * 0.9);
    if (glow > 0) out += MK.glow(FC_PG.x, FC_PG.y, 130, P.good, glow * (0.7 + 0.3 * breathe(t)));
    out += MK.pic(FC_PG.x, FC_PG.y, FC_PG.size, FC.grass);
    var ringG = on(t, cGrass, 0.4) * fcOnly(t, scene, 2);
    if (ringG > 0) out += E(FC_PG.x, FC_PG.y + 4, 100, 94, "none", P.good, 4, { opacity: ringG });

    /* sunlight, water and air, each named in turn, each with an arrow into the plant */
    FC_IN.forEach(function (row, k) {
      var at = c(0, row.cue), o = on(t, at, 0.4);
      if (o <= 0) return;
      var lit = k === 0 && sunBig > 0 ? 1 : 0;
      if (k === 0) out += fcSun(150, row.y, 26 + 4 * sunBig, o, t);
      else if (k === 1) out += fcDrop(150, row.y + 22, 24, o);
      else out += fcBreeze(150, row.y, 66, o);
      out += MK.pill(150, row.y + 62, row.text, o, { size: 24, col: lit ? P.gold : P.line });
      out += MK.arrow(row.from[0], row.from[1], row.to[0], row.to[1], on(t, at == null ? null : at + 0.2, 0.55) * (lit ? 1 : 1), lit ? P.gold : P.good, 6);
    });

    /* the plate it never uses: "a plant does not eat", said in beat 0 and again in beat 2 */
    var p0 = on(t, cNoEat, 0.4) * fcOnly(t, scene, 0), p2 = on(t, cNoEat2, 0.4) * fcOnly(t, scene, 2);
    var plate = Math.max(p0, p2);
    if (plate > 0) {
      /* the cross sits on the plate's corner, not over the whole of it: at the
         plate's own size it hid the thing it was crossing out */
      out += G(MK.pic(712, 116, 102, FC.plate), { opacity: plate });
      out += MK.cross(756, 154, 28, Math.max(popIn(t, cNoEat == null ? null : cNoEat + 0.25, 0.4) * (p0 > p2 ? 1 : 0),
        popIn(t, cNoEat2 == null ? null : cNoEat2 + 0.25, 0.4) * (p2 > 0 ? 1 : 0)));
    }
    /* and the food it makes instead */
    out += MK.arrow(512, 244, 600, 244, on(t, cMakes, 0.5), P.gold, 7);
    out += MK.pill(682, 244, "food", popIn(t, cMakes == null ? null : cMakes + 0.3, 0.4) + 0.1 * bump(t, cProduces, 0.8),
      { size: 34, col: P.gold, ink: P.gold });

    /* "we call it a producer" */
    out += MK.pill(FC_PG.x, 400, "producer", popIn(t, cProducer, 0.45), { size: 38, col: P.gold, ink: P.gold });

    /* every food chain starts with a plant: the strip the rest of the film fills */
    var strip = on(t, cChain, 0.5);
    if (strip > 0) {
      var xs = [790, 910, 1030], first = popIn(t, cPlant, 0.45);
      for (var k = 0; k < 3; k++) out += fcSlot(xs[k], 372, 78, strip, k === 0 ? FC.grass : null, k === 0 ? first : 0);
      out += MK.arrow(834, 372, 868, 372, strip, P.muted, 5);
      out += MK.arrow(954, 372, 988, 372, strip, P.muted, 5);
      out += Tx(910, 296, "every food chain", "lab mid muted", "middle", { opacity: strip });
    }
    return svg(out);
  }

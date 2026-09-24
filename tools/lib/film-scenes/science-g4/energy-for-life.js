  /* ==== Grade 4 Science, Lesson 4: Energy for Life ============================
     tools/lib/film-scenes/science-g4/energy-for-life.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/energy-for-life.json.

     The lesson's own pictures come through: the demo's five frames (the Sun,
     a plant, a rabbit, a fox, and you), the sort step's three bins and their
     animals, the explore step's four predator-and-prey cards, the lesson kit's
     own food chain drawing (ART.kit.foodChainSvg, built then broken) and the
     order step's sea chain, whose seal is the kit's drawing because the seal
     emoji is too new for a school device (MK.pic -> ART.icon).

     This file: the palette, the timing helpers, the small drawings the film
     shares, the title motif and the chapter "Energy for life". Every top-level
     name here starts with ef, so nothing can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, energy: P.gold, light: P.good, eaters: P.accent,
    hunt: P.plum, model: P.blue, diagram: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function efOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function efFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the lesson's own pictures, by name ------------------------------------ */
  var EF = {
    sun: "☀️", plant: "\u{1F33F}", rabbit: "\u{1F407}", fox: "\u{1F98A}",
    you: "\u{1F3C3}\u{1F3FE}", bolt: "⚡", fire: "\u{1F525}", seedling: "\u{1F331}",
    meat: "\u{1F356}", plate: "\u{1F37D}️", horse: "\u{1F40E}", elephant: "\u{1F418}",
    lion: "\u{1F981}", owl: "\u{1F989}", shark: "\u{1F988}", bear: "\u{1F43B}",
    pig: "\u{1F416}", person: "\u{1F9D1}", mouse: "\u{1F401}", zebra: "\u{1F993}",
    frog: "\u{1F438}", fishSmall: "\u{1F41F}", fishBig: "\u{1F420}", seal: "\u{1F9AD}",
    arrow: "➡️", water: "\u{1F4A7}", air: "\u{1F4A8}"
  };

  /* ---- small drawings of the film's own --------------------------------------- */

  /* a card the film puts a picture on, so a light lesson drawing has a plate */
  function efCard(x, y, w, h, o, lit) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* a small gold token of energy, travelling: the thing the lesson says moves
     from the Sun into the plant and on along the chain */
  function efToken(x, y, r, o) {
    if (!(o > 0)) return "";
    return G(MK.glow(x, y, r * 2.6, P.gold, 0.9) + C(x, y, r, P.gold, "#7A5A10", 2) +
      Em(x, y, r * 1.5, EF.bolt), { opacity: clamp(o, 0, 1) });
  }
  /* the token sliding from a to b as u goes 0 -> 1 */
  function efTravel(ax, ay, bx, by, u, r) {
    if (!(u > 0) || u >= 1) return "";
    return efToken(lerp(ax, bx, u), lerp(ay, by, u) - 26 * Math.sin(Math.PI * u), r || 17, Math.min(1, u * 6, (1 - u) * 6));
  }

  /* three dashed rays of sunlight from (sx, sy) towards (tx, ty), drawn as u
     goes 0 -> 1 */
  function efRays(sx, sy, tx, ty, u, spread) {
    if (!(u > 0)) return "";
    var out = "", a = Math.atan2(ty - sy, tx - sx), s = spread == null ? 26 : spread;
    for (var k = -1; k <= 1; k++) {
      var ox = -Math.sin(a) * k * s, oy = Math.cos(a) * k * s;
      out += L(sx + ox, sy + oy, lerp(sx + ox, tx + ox, u), lerp(sy + oy, ty + oy, u), P.gold, 4,
        { opacity: 0.85, "stroke-dasharray": "11 9" });
    }
    return out;
  }

  /* a heron: the bird the lesson says hunts the frog. Drawn, because no emoji
     is a heron and a plain bird beside the word would be the wrong picture. */
  function efHeron(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var g = "";
    g += L(-6, 26, -8, 48, "#E0A33C", 3.2) + L(6, 26, 10, 48, "#E0A33C", 3.2);
    g += L(-8, 48, -16, 50, "#E0A33C", 3.2) + L(10, 48, 2, 50, "#E0A33C", 3.2);
    g += E(0, 14, 24, 16, "#DCE6EE", "#8FA4B4", 2.2);
    g += Pth("M14,4 C26,-2 22,-22 8,-26", null, "#DCE6EE", 9);
    g += C(6, -29, 8, "#DCE6EE", "#8FA4B4", 2);
    g += Pth("M13,-30 L34,-26 L13,-24 Z", "#E0A33C");
    g += C(8, -31, 1.9, "#1B2A36");
    g += Pth("M-22,12 q14,-8 22,2 q-12,8 -22,-2z", "#B9C8D6");
    return G(g, { transform: tr(cx, cy, s), opacity: clamp(o, 0, 1) });
  }

  /* a fly, the small thing the frog hunts */
  function efFly(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var g = E(0, 0, 9, 6, "#33404C") + C(-8, -1, 4.5, "#33404C") +
      E(-1, -9, 9, 5, "#CBD8E4", "#8FA4B4", 1.2, { transform: "rotate(-22)" }) +
      E(3, 8, 9, 5, "#CBD8E4", "#8FA4B4", 1.2, { transform: "rotate(22)" });
    return G(g, { transform: tr(cx, cy, s), opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names; the newest is
     gold, one named before it keeps its line, quieter */
  function efLabel(t, x, y, text, at, to, now, size, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 24, anchor: anchor || "middle", col: now ? P.gold : P.line });
  }

  /* ==== the title ==============================================================
     The lesson's own trail in a round window: the Sun above, and grass, rabbit
     and fox in a row with the arrows between them. In the spoken title chapter
     the Sun arrives on "from the Sun", the plant on "into a plant" and the
     rest on "a food chain"; before that a bolt of energy sits in the middle,
     for "needs energy". On the two cards the whole trail simply stands. */
  function titleMotif(o) {
    var t = o.t || 0, S = o.scene, out = "";
    var cLiving = S ? sc(S, 0, "living") : null, cEnergy = S ? sc(S, 0, "energy") : null, cHealthy = S ? sc(S, 0, "healthy") : null;
    var cSun = S ? sc(S, 1, "sun") : null, cPlant = S ? sc(S, 1, "plant") : null, cChain = S ? sc(S, 1, "chain") : null;
    var show = function (at) { return S ? on(t, at, 0.5) : 1; };
    var sunO = show(cSun), plantO = show(cPlant), chainO = show(cChain);
    /* the window itself opens on "living": before that there is nothing to see */
    var livingO = show(cLiving);
    /* the bolt holds the middle of the window until the Sun takes it over */
    var boltO = S ? on(t, cEnergy, 0.5) * (1 - on(t, cSun, 0.5)) : 0;
    /* a ring of good health glows around the window on "stay healthy" */
    var healthyO = show(cHealthy);

    out += el("clipPath", { id: "efMotifClip" }, C(180, 180, 172));
    var body = C(180, 180, 172, "#123247") +
      G(
        MK.glow(180, 92, 92, P.gold, sunO * (0.7 + 0.3 * breathe(t))) +
        Em(180, 92, 78, EF.sun, { opacity: sunO }) +
        efRays(164, 138, 96, 214, Math.min(sunO, plantO), 20) +
        Em(84, 250, 66, EF.plant, { opacity: plantO }) +
        Em(180, 250, 66, EF.rabbit, { opacity: chainO }) +
        Em(276, 250, 66, EF.fox, { opacity: chainO }) +
        MK.arrow(118, 250, 146, 250, chainO, P.gold, 5) +
        MK.arrow(214, 250, 242, 250, chainO, P.gold, 5) +
        efToken(180, 180, 34, boltO),
        { "clip-path": "url(#efMotifClip)" }) +
      C(180, 180, 172, "none", P.line, 3);
    out += G(body, { opacity: livingO });
    if (healthyO > 0) out += C(180, 180, 177, "none", P.good, 3, { opacity: healthyO * (0.55 + 0.45 * breathe(t)) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Sunlight reaching a plant, a rabbit and a fox in a food chain">' + out + "</svg>";
  }

  /* ==== chapter: energy for life ==================================================
     One bolt of energy above, and the three things the lesson says take it:
     growing, moving and staying warm. Each card arrives on its own words. On
     "No energy, no movement" the bolt goes out and the cards go dark; on the
     last line it lights again and the question the next chapter answers
     appears beside it. */
  var EF_E = { bx: 584, by: 80, cy: 186, ch: 228, cw: 320 };
  var EF_E_CARDS = [
    { x: 40, pic: EF.seedling, word: "growing" },
    { x: 424, pic: EF.you, word: "moving" },
    { x: 808, pic: EF.fire, word: "staying warm" }
  ];

  function efEnergyChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNothing = c(0, "nothing"), cGrowing = c(0, "growing");
    var cMoving = c(1, "moving"), cWarm = c(1, "warm");
    var cNo = c(2, "no"), cStop = c(2, "stop"), cHappen = c(2, "happen");
    var cGet = c(3, "get"), cWhere = c(3, "where");
    var out = "";

    /* the bolt goes out for its own line only */
    var third = efOnly(t, scene, 2);
    var dark = on(t, cNo, 0.45) * third;
    var flat = on(t, cHappen, 0.5) * third;
    var boltO = on(t, cNothing, 0.5);
    var relit = on(t, cGet, 0.5) * efFrom(t, scene, 3);

    out += MK.glow(EF_E.bx, EF_E.by, 78, P.gold, boltO * (1 - dark) * (0.65 + 0.35 * breathe(t)));
    out += G(Em(EF_E.bx, EF_E.by, 92, EF.bolt), { opacity: boltO * (1 - 0.72 * dark) });
    if (relit > 0) out += C(EF_E.bx, EF_E.by, 66, "none", P.gold, 4, { opacity: relit * (0.5 + 0.5 * breathe(t)) });
    out += MK.pill(EF_E.bx, 150, "energy", boltO, { size: 26, col: dark > 0.5 ? P.line : P.gold });
    if (dark > 0) out += MK.cross(EF_E.bx + 84, EF_E.by - 8, 26, popIn(t, cNo, 0.4) * third, P.bad);

    /* the three things that take energy, each on the words that name it */
    var at = [cGrowing, cMoving, cWarm];
    EF_E_CARDS.forEach(function (card, k) {
      var p = popIn(t, at[k], 0.42);
      if (p <= 0) return;
      var cx = card.x + EF_E.cw / 2, fade = 1 - 0.68 * flat;
      var g = efCard(card.x, EF_E.cy, EF_E.cw, EF_E.ch, 1, false) +
        MK.pic(cx, EF_E.cy + 78, 100, card.pic) +
        Tx(cx, EF_E.cy + 196, card.word, "lab big", "middle") +
        efToken(card.x + EF_E.cw - 34, EF_E.cy + 30, 15, (1 - dark) * 0.95);
      out += G(g, { transform: around(cx, EF_E.cy + EF_E.ch / 2, Math.min(p, 1.06)), opacity: Math.min(1, p) * fade });
      if (k === 1 && dark > 0) out += MK.cross(cx, EF_E.cy + 78, 46, popIn(t, cStop, 0.4) * third, P.bad);
    });

    /* "Where does it start?" */
    var q = popIn(t, cWhere, 0.4) * efFrom(t, scene, 3);
    out += MK.qmark(380, EF_E.by, 40, Math.min(1, q));
    out += MK.qmark(788, EF_E.by, 40, Math.min(1, q));
    return svg(out);
  }

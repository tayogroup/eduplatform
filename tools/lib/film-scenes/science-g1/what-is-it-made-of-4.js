
  /* ==== What Is It Made Of?, part 4: "What you now know", and KINDS ========== */

  /* when the recap's k-th beat says the phrase named `name` */
  function wmRecapCue(k, name) {
    for (var s = 0; s < F.scenes.length; s++) if (F.scenes[s].id === "recap") return sc(F.scenes[s], k, name);
    return null;
  }

  /* Five cards, lit as each is said, with the pictures the chapters used; each
     picture also moves on its own words: the spoon and its metal as "object"
     and "material" are said, the seven materials in a ripple, the sponge
     pressed as "tests" are said, the clay squashed on "change shape". */
  var wmRecap = MK.recapKind([
    { beat: 0, at: "object", title: "Object and material", sub: "A spoon is made of metal.",
      pic: function (cx, cy, size, t) {
        var a = 1 + 0.2 * bump(t, wmRecapCue(0, "object"), 0.7), b = 1 + 0.2 * bump(t, wmRecapCue(0, "material"), 0.7);
        var xa = cx - size * 0.72, xb = cx + size * 0.72;
        return G(MK.pic(xa, cy, size * 0.9, PIC.spoon), { transform: around(xa, cy, a) }) +
          MK.arrow(cx - size * 0.2, cy, cx + size * 0.2, cy, 1, P.muted, 5) +
          G(MK.pic(xb, cy, size * 0.9, PIC.metal), { transform: around(xb, cy, b) });
      } },
    { beat: 1, at: "seven", title: "Seven materials", sub: "wood, metal, plastic, glass and more",
      pic: function (cx, cy, size, t) {
        var out = "", s = size * 0.46, at = wmRecapCue(1, "seven");
        for (var k = 0; k < RING.length; k++) {
          var x = cx + (k - 3) * s * 1.08;
          out += G(MK.pic(x, cy, s, RING[k]), { transform: around(x, cy, 1 + 0.3 * bump(t, at == null ? null : at + k * 0.09, 0.5)) });
        }
        return out;
      } },
    { beat: 1, at: "tests", title: "Tests find properties", sub: "soft, bendy, hard, stiff",
      pic: function (cx, cy, size, t) {
        var p = bump(t, wmRecapCue(1, "tests"), 1.0);
        return wmShaped(cx, cy, size, PIC.sponge, { sx: 1 + 0.15 * p, sy: 1 - 0.3 * p }, cx, cy + size * 0.48);
      } },
    { beat: 2, at: "shape", title: "Some change shape", sub: "Clay does. A stone does not.",
      pic: function (cx, cy, size, t) {
        var sq = on(t, wmRecapCue(2, "shape"), 0.6), xc = cx - size * 0.62;
        return wmShaped(xc, cy, size * 0.9, PIC.clay, wmMix({}, SHAPE_SQUASH, sq), xc, cy + size * 0.43) +
          MK.pic(cx + size * 0.62, cy, size * 0.95, PIC.rock);
      } },
    { beat: 3, at: "right", title: "The right material", sub: "glass for a window", pic: PIC.window }
  ], { goBeat: 3, goAt: "hunt" });

  var KINDS = {
    title: wmTitle, objects: wmObjects, seven: wmSeven, testing: wmTesting,
    shape: wmShape, job: wmJob, recap: wmRecap
  };

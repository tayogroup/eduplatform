  /* ==== chapters: round and round, what people used to think, the recap ========
     tools/lib/film-scenes/science-g3/the-moon-3.js. */

  /* ---- round and round --------------------------------------------------------
     The model the child builds two steps later, the lesson's own drawing
     (ART.kit.earthMoonSvg): the path, the Earth, the Moon, and its own caption
     counting the days and the hours as the model moves. Below it, one day as a
     bar: half of it light, half of it dark. */

  var TM_MODEL = { x: 240, y: 30, w: 540, h: 337.5 };    /* 320 x 200, drawn at 1.6875 */
  var TM_EC = [510, 198.75], TM_ER = 57.4;               /* the Earth in film coordinates */

  function tmOrbitAngle(t, scene) {
    var cTrav = sc(scene, 0, "travels"), cTrip = sc(scene, 1, "trip");
    return lerp(110 * on(t, cTrav, 1.4), 470, on(t, cTrip, 2.6));
  }
  function tmSpin(t, scene) {
    return 360 * on(t, sc(scene, 2, "spins"), 2.4) + 360 * on(t, sc(scene, 3, "spin"), 2.6);
  }

  function tmOrbitChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTrav = c(0, "travels"), cOrbit = c(0, "orbit");
    var cTrip = c(1, "trip"), cMonth = c(1, "month"), cNotDay = c(1, "day");
    var cSpins = c(2, "spins"), cDay = c(2, "day");
    var cSpin = c(3, "spin"), cNight = c(3, "night");
    var cBuild = c(4, "build"), cMove = c(4, "move");
    var out = "", ang = tmOrbitAngle(t, scene), spin = tmSpin(t, scene);

    var cap = "";
    if (cSpin != null && t >= cSpin) cap = "one spin: one day";
    else if (cSpins != null && t >= cSpins) cap = "the Earth spins: " + Math.min(24, Math.round(spin / 15)) + " hours";
    else if (cTrip != null && t >= cTrip) cap = "the Moon goes round the Earth: " + Math.round((ang - 110) / 360 * 28) + " days";

    out += tmCard(TM_MODEL.x, TM_MODEL.y, TM_MODEL.w, TM_MODEL.h, 1);
    out += ART.place(ART.kit.earthMoonSvg({
      earth: true, moon: true, orbit: cOrbit != null && t >= cOrbit, angle: ang, spin: spin, cap: cap
    }), TM_MODEL.x, TM_MODEL.y, TM_MODEL.w, TM_MODEL.h);

    /* the Moon, ringed as it is named */
    var mr = ang * Math.PI / 180;
    out += C(TM_EC[0] + Math.cos(mr) * 168.75, TM_EC[1] + Math.sin(mr) * 101.25, 27, "none", P.gold, 4,
      { opacity: on(t, cTrav, 0.5) * (1 - on(t, cSpins, 0.5)) });
    /* a sticker on the Earth, so its spin can be seen */
    var so = on(t, cSpins, 0.45), sa = (spin - 90) * Math.PI / 180;
    if (so > 0) out += C(TM_EC[0] + Math.cos(sa) * 46, TM_EC[1] + Math.sin(sa) * 46, 8, P.gold, "#FFFFFF", 2.5,
      { opacity: so });

    /* the path, named */
    out += tmLabel(t, 812, 60, "the path: an orbit", cOrbit, [TM_EC[0] + 168.75, TM_EC[1]], true, 24);
    /* one trip round: four weeks, not a day */
    out += MK.pill(960, 126, "about four weeks: a month", on(t, cMonth, 0.45), { size: 24, col: P.gold });
    var nd = popIn(t, cNotDay, 0.4) * tmOnly(t, scene, 1);
    if (nd > 0) {
      out += MK.cross(830, 182, 24, nd, P.bad);
      out += MK.pill(866, 182, "not one day", Math.min(1, nd), { size: 22, anchor: "start", col: P.bad, ink: P.bad });
    }
    /* one spin: one day */
    out += MK.pill(960, 250, "one spin = one day", on(t, cDay, 0.45), { size: 24, col: P.good });

    /* one day as a bar: half light, half dark */
    var bo = on(t, cNight, 0.5);
    if (bo > 0) {
      out += G(R(300, 385, 210, 34, 0, P.gold) + R(510, 385, 210, 34, 0, "#14283A") +
        R(300, 385, 420, 34, 8, "none", P.line, 2) +
        Tx(405, 410, "day", "lab dark", "middle") + Tx(615, 410, "night", "lab", "middle"), { opacity: bo });
      var f = (spin / 360) % 1;
      out += C(300 + 420 * f, 402, 11, P.ink, P.ground, 3, { opacity: bo });
    }

    /* what the child will build */
    out += R(228, 18, 564, 361, 18, "none", P.gold, 4,
      { opacity: on(t, cBuild, 0.5), "stroke-dasharray": "16 10" });
    out += MK.pill(960, 318, "Turn one month", popIn(t, cMove, 0.4), { size: 22, col: P.teal });
    out += MK.pill(960, 372, "Spin one day", popIn(t, cMove == null ? null : cMove + 0.25, 0.4), { size: 22, col: P.teal });
    return svg(out);
  }

  /* ---- what people used to think ----------------------------------------------
     The four pictures of the lesson's own history step, in its own words: a
     flat Earth, the Sun going round us, the telescope, astronauts. The two old
     ideas are crossed and the two better looks are ticked on the last line. */

  var TM_IDEAS = [
    { x: 149, draw: function () { return tmFlatEarth(149, 150, 92); }, label: "a flat Earth" },
    { x: 439, pic: "☀️", label: "the Sun going round us" },
    { x: 729, pic: "\u{1F52D}", label: "the telescope" },
    { x: 1019, pic: "\u{1F468}\u{1F3FE}‍\u{1F680}", label: "astronauts" }
  ];

  function tmIdeasChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var at = [c(0, "ago"), c(1, "watched"), c(2, "tele"), c(3, "astro")];
    var cPlate = c(0, "plate"), cRound = c(1, "round"), cRocky = c(2, "rocky"), cCraters = c(2, "craters");
    var cPhoto = c(3, "photo"), cChanges = c(4, "changes"), cCare = c(4, "carefully");
    var out = "";

    TM_IDEAS.forEach(function (d, k) {
      var p = popIn(t, at[k], 0.45);
      if (!(p > 0)) return;
      var inner = R(d.x - 136, 56, 272, 288, 20, P.card, P.line, 2) +
        (d.draw ? d.draw() : MK.pic(d.x, 148, 100, d.pic)) +
        Tx(d.x, 324, d.label, "lab readable", "middle");
      out += G(inner, { transform: around(d.x, 200, Math.min(1, p)), opacity: Math.min(1, p) });
    });

    /* "like a plate" */
    var pl = popIn(t, cPlate, 0.4);
    out += MK.pop(E(149, 256, 62, 15, "#9FB0BD", "#6F7C88", 3) + E(149, 249, 46, 9, "#C6D2DB"), 149, 256, pl);
    /* "went round us": a ring round the Sun */
    var ro = on(t, cRound, 0.6);
    if (ro > 0) out += Pth("M375,148 A64,64 0 1 1 439,212", null, P.gold, 4,
      { "stroke-dasharray": "12 9", opacity: ro }) +
      Pth("M431,220 L439,212 L447,220 Z", P.gold, P.gold, 2, { opacity: ro });
    /* "a rocky ball, with craters" */
    var rk = popIn(t, cRocky, 0.4);
    if (rk > 0) {
      var craters = "";
      var cs = [[-14, -10, 9], [10, 4, 7], [-4, 14, 5]];
      for (var n = 0; n < 3; n++) {
        var cp = popIn(t, cCraters == null ? null : cCraters + n * 0.14, 0.32);
        if (cp > 0) craters += C(729 + cs[n][0], 252 + cs[n][1], cs[n][2], "#C9C2B0", "#9A9382", 2,
          { opacity: Math.min(1, cp) });
      }
      out += G(tmMoon(729, 252, 38, 4) + craters, { transform: around(729, 252, Math.min(1, rk)), opacity: Math.min(1, rk) });
    }
    /* "photographed the Earth" */
    var ph = popIn(t, cPhoto, 0.4);
    if (ph > 0) out += G(ART.place(ART.scene("globe", 0), 1019 - 44, 208, 88, 88), { opacity: Math.min(1, ph) }) +
      R(1019 - 50, 202, 100, 100, 10, "none", P.ink, 3, { opacity: Math.min(1, ph) * 0.8 });

    /* the two old ideas, and the two better looks */
    out += MK.cross(149 + 108, 82, 24, popIn(t, cChanges, 0.4), P.bad);
    out += MK.cross(439 + 108, 82, 24, popIn(t, cChanges == null ? null : cChanges + 0.22, 0.4), P.bad);
    out += MK.tick(729 + 108, 82, 24, popIn(t, cCare, 0.4));
    out += MK.tick(1019 + 108, 82, 24, popIn(t, cCare == null ? null : cCare + 0.22, 0.4));
    out += MK.pill(584, 404, "better looking changes what we know", on(t, cCare, 0.5), { size: 26, col: P.gold });
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------ */
  var TM_RECAP = MK.recapKind([
    { beat: 0, at: "spheres", title: "Three spheres", sub: "the Earth, the Sun, the Moon",
      pic: function (cx, cy, size) {
        return C(cx - size * 0.42, cy, size * 0.2, "#3B7FD1") + C(cx, cy, size * 0.3, P.gold) +
          tmMoon(cx + size * 0.42, cy, size * 0.2, 4);
      } },
    { beat: 1, at: "phases", title: "Phases", sub: "new, crescent, half, full",
      pic: function (cx, cy, size) {
        return tmMoon(cx - size * 0.46, cy, size * 0.2, 0) + tmMoon(cx, cy, size * 0.2, 2) +
          tmMoon(cx + size * 0.46, cy, size * 0.2, 4);
      } },
    { beat: 1, at: "ball", title: "Always a ball", sub: "we see the sunlit half",
      pic: function (cx, cy, size) { return tmMoon(cx, cy, size * 0.42, 3); } },
    { beat: 2, at: "round", title: "Its orbit", sub: "round the Earth in a month",
      pic: function (cx, cy, size) {
        return E(cx, cy, size * 0.5, size * 0.3, "none", "#4A5A6A", 2.5, { "stroke-dasharray": "7 6" }) +
          C(cx, cy, size * 0.17, "#3B7FD1") + C(cx + size * 0.5, cy, size * 0.08, "#D9D2C0");
      } },
    { beat: 2, at: "spins", title: "The Earth spins", sub: "once every day", pic: "\u{1F30D}" },
    { beat: 3, at: "change", title: "Ideas change", sub: "better looking, better knowing", pic: "\u{1F52D}" }
  ], { goBeat: 3, goAt: "change" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Three spheres: the Earth, the Sun and the Moon", "The phases of the Moon, month after month", "How the Earth and the Moon move"] }),
    spheres: tmSpheresChapter, month: tmMonthChapter, ball: tmBallChapter,
    orbit: tmOrbitChapter, ideas: tmIdeasChapter, recap: TM_RECAP
  };

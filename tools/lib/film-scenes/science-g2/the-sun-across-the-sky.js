  /* ==== Grade 2 Science, Lesson 10: The Sun Across the Sky =====================
     tools/lib/film-scenes/science-g2/the-sun-across-the-sky.js, with -2.js,
     -3.js and -4.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/the-sun-across-the-sky.json.

     The lesson's own drawings are used where the lesson draws the thing:
     ART.scene("sky", 1 | 2 | 4) are three of the frames its "Sunrise to
     sunset" demo steps through, and they close the sunset chapter; and
     ART.scene("globe", turn) is its Earth, turning in the last chapter.

     The Sun's path with the stick and its shadow is drawn HERE rather than
     taken from ART.sim("sunPath", "draw", 0..4). That drawing puts the shadow
     on the SAME side of the stick as the Sun in all five of its states, which
     is the very thing the lesson's own explain() block tells the child is
     wrong ("Children expect the shadow to point at the Sun. It points away
     from the Sun, on the opposite side of the stick"). Reported, not fixed:
     the lesson is not this film's to change.

     The stage here is drawn to scale instead: a shadow's length is the
     stick's own shadow by similar triangles, so the grazing ray drawn in
     "Sunrise in the east" really does pass over the stick's top and land on
     the tip of the shadow.

     Every top-level name starts with sas, so nothing here can replace a name
     of the engine, ART or MK. This file: the palette, the sky stage the three
     daytime chapters share, the title motif, and "Sunrise in the east". */

  var HUE = {
    title: P.teal, sunrise: P.gold, midday: P.accent, sunset: P.plum,
    measure: P.blue, record: P.good, earth: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function sasOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function sasFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the sky stage ---------------------------------------------------------
     u = 0 is the eastern horizon (LEFT) and u = 1 the western one (RIGHT), the
     same way round as the lesson's own sky scenes and its EAST / WEST words. */
  var SAS_H = 270;                 /* the horizon */
  var SAS_SX = 584;                /* where the stick stands */
  var SAS_STICKH = 40;             /* how tall it is */
  var SAS_TOP = SAS_H - SAS_STICKH;
  var SAS_DROP = 40;               /* how far down the ground a shadow lies */
  var SAS_DAY = "#BFE3F5", SAS_DUSK = "#F0A56B", SAS_GRASS = "#3E8E4A";
  var SAS_WOOD = "#6B4A2B", SAS_SHADE = "#0B1D2C", SAS_GOLD = "#F4C95D";
  /* the moments of the day this film stands the Sun at.
     rise and after are as low as the picture allows: the shadow's length is
     the stick's own by similar triangles, so a Sun near the horizon throws one
     longer than the stage. At 0.11 and 0.89 the Sun sits about 74 px above the
     horizon - plainly low, as the line says - and the shadow still ends inside
     the box (978 and 190), so the grazing ray really does land on its tip.
     A 40 px stick is what buys that: a taller one pushes the tip off the side.
     after is the MIRROR of rise, and has to be: the lesson measures both at
     three hands ("The morning shadow is long: three hands ... The afternoon
     shadow is long again: three"), and the film says so four beats later, so
     the bracket it labels "long again" must be the length of the one it
     labelled "long" - 394 px either side of the stick (review, 2026-09-23: it
     was 0.85, which drew 214 px, a little over half).
     evening is lower still, so the Sun visibly sinks on "sinks low in the west
     and disappears" and the shadow runs off the western edge on the way out,
     as one does outdoors.
     noon is a shade short of the arc's top (0.5) on purpose: exactly overhead
     the shadow is a vertical stub hidden under the stick, and 0.44 leans it a
     little west, still 3 px below the apex and still the shortest of the day */
  var SAS_U = { rise: 0.11, morning: 0.34, noon: 0.44, after: 0.89, evening: 0.91 };

  function sasSunAt(u) {
    u = clamp(u, 0, 1);
    var v = 1 - u;
    return [v * v * 150 + 2 * v * u * 584 + u * u * 1018,
            v * v * SAS_H + 2 * v * u * (-110) + u * u * SAS_H];
  }
  /* where the stick's shadow ends: the ray from the Sun over the stick's top,
     down to the ground. A Sun lower than the stick's top casts a shadow longer
     than the picture, so it runs off the side, as it does outdoors. */
  function sasTip(sx, sy) {
    var gap = SAS_TOP - sy;
    if (!(gap > 14)) return sx < SAS_SX ? 1072 : 96;
    return clamp(SAS_SX + SAS_STICKH * (SAS_SX - sx) / gap, 96, 1072);
  }
  function sasMix(a, b, u) {
    u = clamp(u, 0, 1);
    var ch = function (h, k) { return parseInt(h.substr(1 + k * 2, 2), 16); };
    return "rgb(" + Math.round(lerp(ch(a, 0), ch(b, 0), u)) + "," +
      Math.round(lerp(ch(a, 1), ch(b, 1), u)) + "," + Math.round(lerp(ch(a, 2), ch(b, 2), u)) + ")";
  }

  /* the Sun: the kit's gold, with eight rays turning slowly */
  function sasSunDisc(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.25;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3,
        cx + Math.cos(a) * r * 1.72, cy + Math.sin(a) * r * 1.72, SAS_GOLD, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.1, P.gold, 0.9) + rays + C(cx, cy, r, SAS_GOLD), { opacity: clamp(o, 0, 1) });
  }

  /* EAST or WEST on the grass, lit gold while it is being said */
  function sasCompass(x, word, anchor, lit) {
    var out = Tx(x, 418, word, "lab big", anchor, { fill: "#F7F4EC" });
    if (lit > 0) out += Tx(x, 418, word, "lab big", anchor, { fill: SAS_GOLD, opacity: lit }) +
      R(anchor === "end" ? x - 94 : x - 2, 428, 94 * lit, 5, 3, SAS_GOLD, null, null, { opacity: lit });
    return out;
  }

  /* the landscape: sky, ground, the Sun's dashed path, EAST and WEST, the
     stick and its shadow, the Sun.
     o: {u, sunO, sunDip, stickO, shadowO, shadowFade, eastLit, westLit}
     sunDip drops the DISC alone, below the horizon at sunrise and sunset. The
     shadow is measured from the Sun's real place on the arc, because a disc
     dipped under the horizon has no ray over the stick at all and the tip
     would jump to the far edge in one frame; the shadow fades with the Sun
     instead (shadowFade), which is what a child sees outdoors. */
  function sasStage(t, o) {
    o = o || {};
    var u = clamp(o.u == null ? SAS_U.rise : o.u, 0, 1), s = sasSunAt(u);
    var d = Math.min(1, Math.abs(u - 0.5) / 0.36), out = "";
    out += R(0, 0, 1168, SAS_H, 0, sasMix(SAS_DAY, SAS_DUSK, d * d));
    out += R(0, SAS_H, 1168, 440 - SAS_H, 0, SAS_GRASS);
    out += Pth("M150," + SAS_H + " Q584,-110 1018," + SAS_H, null, "#FFFFFF", 2.5,
      { "stroke-dasharray": "9 12", opacity: 0.5 });
    out += sasCompass(34, "EAST", "start", o.eastLit || 0) + sasCompass(1134, "WEST", "end", o.westLit || 0);

    var sho = o.shadowO == null ? 1 : clamp(o.shadowO, 0, 1);
    var fade = o.shadowFade == null ? 1 : clamp(o.shadowFade, 0, 1);
    if (sho > 0 && fade > 0) {
      var tip = sasTip(s[0], s[1]);
      out += L(SAS_SX, SAS_H, lerp(SAS_SX, tip, sho), lerp(SAS_H, SAS_H + SAS_DROP, sho),
        SAS_SHADE, 15, { opacity: 0.55 * fade });
    }
    var sto = o.stickO == null ? 1 : clamp(o.stickO, 0, 1);
    if (sto > 0) out += R(SAS_SX - 6, lerp(SAS_H, SAS_TOP, sto), 12, SAS_STICKH * sto, 3, SAS_WOOD);
    out += sasSunDisc(s[0], s[1] + (o.sunDip || 0), 32, o.sunO == null ? 1 : o.sunO, t);
    return out;
  }

  /* ==== the title motif ===========================================================
     The Sun's whole day in a round window: the dashed path, the Sun on it, the
     stick and its shadow. In the spoken title chapter the Sun travels from the
     eastern horizon to the western one on "move across the sky", and the two
     ends are ringed on "rise" and on "set". On the two cards it stands at
     midday. */
  var SAS_M = { h: 236, sx: 180, stick: 34, drop: 22 };
  function sasMotifSun(u) {
    u = clamp(u, 0, 1);
    var v = 1 - u;
    return [v * v * 52 + 2 * v * u * 180 + u * u * 308, v * v * SAS_M.h + 2 * v * u * (-84) + u * u * SAS_M.h];
  }
  function sasMotifTip(sx, sy) {
    var gap = (SAS_M.h - SAS_M.stick) - sy;
    if (!(gap > 8)) return sx < SAS_M.sx ? 348 : 12;
    return clamp(SAS_M.sx + SAS_M.stick * (SAS_M.sx - sx) / gap, 12, 348);
  }
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cMove = sn ? sc(sn, 0, "move") : null, cRise = sn ? sc(sn, 1, "rise") : null,
      cSet = sn ? sc(sn, 1, "set") : null, cSh = sn ? sc(sn, 1, "shadows") : null;
    var u = sn ? lerp(0.16, 0.86, on(t, cMove, 2.6)) : 0.5;
    var s = sasMotifSun(u), tip = sasMotifTip(s[0], s[1]);
    var d = Math.min(1, Math.abs(u - 0.5) / 0.36);

    out += el("clipPath", { id: "sasMotifClip" }, C(180, 180, 170));
    out += G(
      R(0, 0, 360, SAS_M.h, 0, sasMix(SAS_DAY, SAS_DUSK, d * d)) +
      R(0, SAS_M.h, 360, 360 - SAS_M.h, 0, SAS_GRASS) +
      Pth("M52," + SAS_M.h + " Q180,-84 308," + SAS_M.h, null, "#FFFFFF", 2, { "stroke-dasharray": "7 9", opacity: 0.55 }) +
      L(SAS_M.sx, SAS_M.h, tip, SAS_M.h + SAS_M.drop, SAS_SHADE, 9,
        { opacity: 0.55 * (sn ? Math.max(0.4, on(t, cSh, 0.6)) : 1) }) +
      R(SAS_M.sx - 4, SAS_M.h - SAS_M.stick, 8, SAS_M.stick, 3, SAS_WOOD) +
      sasSunDisc(s[0], s[1], 17, 1, t) +
      C(52, SAS_M.h, 15 + 5 * bump(t, cRise, 1.6), "none", SAS_GOLD, 4, { opacity: bump(t, cRise, 1.6) }) +
      C(308, SAS_M.h, 15 + 5 * bump(t, cSet, 1.6), "none", SAS_GOLD, 4, { opacity: bump(t, cSet, 1.6) }),
      { "clip-path": "url(#sasMotifClip)" });
    out += C(180, 180, 170, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Sun crossing the sky above a stick and its shadow">' + out + "</svg>";
  }

  /* ==== chapter: sunrise in the east ==============================================
     The Sun comes up low in the east, the stick goes in, its shadow sweeps out
     to the west, the light is shown arriving and being blocked, and the last
     two beats say which way the shadow points and why. */
  function sasSunriseChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cUp = c(0, "up"), cLow = c(0, "low"), cEast = c(0, "east");
    var cStick = c(1, "stick"), cShadow = c(1, "shadow");
    var cDark = c(2, "dark"), cBlocks = c(2, "blocks");
    var cLong = c(3, "long"), cStretch = c(3, "stretch"), cWest = c(3, "west");
    var cAway = c(4, "away"), cOpp = c(4, "opposite");

    var u = SAS_U.rise, s = sasSunAt(u), tip = sasTip(s[0], s[1]);
    var rise = on(t, cUp, 1.0);
    var stickO = Math.max(on(t, cStick, 0.5), sasFrom(t, scene, 2));
    var shadowO = Math.max(on(t, cShadow, 0.8), sasFrom(t, scene, 2));
    /* the Sun waits just above the eastern horizon, dim, and lifts and
       brightens on "comes up": a chapter that opens on an empty sky is a
       second of nothing */
    var out = sasStage(t, {
      u: u, sunO: 0.3 + 0.7 * rise, sunDip: (1 - rise) * 84, stickO: stickO, shadowO: shadowO,
      eastLit: bump(t, cEast, 1.8), westLit: bump(t, cWest, 1.8)
    });

    /* "low in the east": how little sky there is under the Sun */
    var lo = on(t, cLow, 0.5) * sasOnly(t, scene, 0);
    if (lo > 0) {
      out += L(s[0], s[1] + 38, s[0], SAS_H, SAS_GOLD, 3, { "stroke-dasharray": "8 8", opacity: lo });
      out += MK.pill(s[0] + 100, (s[1] + SAS_H) / 2, "low", lo, { size: 26, col: P.gold });
    }

    /* "the dark patch": the shadow named, with the lesson's own word */
    var dk = on(t, cDark, 0.5) * sasOnly(t, scene, 2);
    if (dk > 0) {
      var mid = (SAS_SX + tip) / 2;
      /* the gold is a HALO round the shadow, never a lid on it: it is drawn
         wider than the 15 px shadow and the shadow is then drawn again on top,
         so on "the dark patch" the thing being named is the darkest thing on
         the screen (review, 2026-09-23: a 19 px gold band over a 15 px shadow
         covered it, and it read pale olive on the word "dark").
         The core is OPAQUE, in the colour the 0.55 shadow already has over
         this grass, so the halo cannot tint the thing it is pointing at: a
         second 0.55 pass measured rgb(68,78,57) against rgb(34,80,57) one
         beat later, which is the same fault a shade weaker. */
      out += L(SAS_SX, SAS_H, tip, SAS_H + SAS_DROP, SAS_GOLD, 29, { opacity: 0.5 * bump(t, cDark, 1.4) });
      out += L(SAS_SX, SAS_H, tip, SAS_H + SAS_DROP, sasMix(SAS_GRASS, SAS_SHADE, 0.55), 15);
      out += MK.leader(mid, 226, mid + 10, SAS_H + 16, on(t, cDark, 0.6), P.gold);
      out += MK.pill(mid, 206, "shadow", dk, { size: 26, col: P.gold });
    }
    /* "blocks the light": two rays stop at the stick, and the one that grazes
       its top lands exactly on the tip of the shadow */
    var bl = on(t, cBlocks, 0.8) * sasOnly(t, scene, 2);
    if (bl > 0) {
      out += L(s[0], s[1], lerp(s[0], tip, bl), lerp(s[1], SAS_H, bl), SAS_GOLD, 4,
        { "stroke-dasharray": "11 9", opacity: 0.95 });
      out += L(s[0], s[1] + 18, lerp(s[0], SAS_SX - 7, bl), lerp(s[1] + 18, 234, bl), SAS_GOLD, 5, { opacity: 0.95 });
      out += L(s[0], s[1] + 34, lerp(s[0], SAS_SX - 7, bl), lerp(s[1] + 34, 256, bl), SAS_GOLD, 5, { opacity: 0.95 });
      /* the lit side of the stick, and the dark side it throws */
      out += R(SAS_SX - 7, SAS_TOP, 4, SAS_STICKH, 2, SAS_GOLD, null, null,
        { opacity: on(t, cBlocks == null ? null : cBlocks + 0.4, 0.4) * bl });
    }

    /* "is long", then "stretches across the ground, pointing west" */
    var lg = on(t, cLong, 0.5) * sasOnly(t, scene, 3);
    if (lg > 0) {
      out += L(SAS_SX, 336, SAS_SX, 350, SAS_GOLD, 4, { opacity: lg }) + L(tip, 336, tip, 350, SAS_GOLD, 4, { opacity: lg });
      out += L(SAS_SX, 343, lerp(SAS_SX, tip, on(t, cLong, 0.9)), 343, SAS_GOLD, 4, { opacity: lg });
      out += MK.pill((SAS_SX + tip) / 2, 378, "long", lg, { size: 26, col: P.gold });
    }
    out += MK.arrow(SAS_SX + 30, 298, tip - 16, 304, on(t, cStretch, 0.9) * sasOnly(t, scene, 3), P.gold, 8);

    /* "away from the Sun, on the opposite side of the stick" */
    var aw = sasOnly(t, scene, 4);
    if (aw > 0) {
      /* the arrow runs the way the shadow points: away from the Sun */
      out += MK.arrow(SAS_SX + 28, 240, tip - 22, 240, on(t, cAway, 0.8) * aw, P.gold, 8);
      var op = on(t, cOpp, 0.6) * aw;
      if (op > 0) {
        out += L(SAS_SX, 120, SAS_SX, 396, SAS_GOLD, 3, { "stroke-dasharray": "10 9", opacity: op });
        out += MK.pill(448, 130, "the Sun", op, { size: 24, col: P.gold });
        out += MK.pill(812, 130, "the shadow", op, { size: 24, col: P.gold });
      }
    }
    return svg(out);
  }

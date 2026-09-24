  /* ==== Networks and the Internet, part 4 =====================================
     The chapter "When it is not there", and the two cards. The lesson's
     Offline tester is a closure inside its own activity, so its tablet and its
     seven apps are drawn here, with the lesson's own labels and its own
     verdicts: a video online, a video call and a message need other computers;
     drawing, a saved game and your own photos do not. */

  var NW_TAB = { x: 96, y: 44, w: 300, h: 360 };
  var NW_APPS = [
    { glyph: "\u{1F3AC}", label: "Video online", at: "video", beat: 3, mark: "cross" },
    { glyph: "\u{1F4DE}", label: "Video call", at: "call", beat: 3, mark: "cross" },
    { glyph: "✉️", label: "Message", at: "message", beat: 3, mark: "cross" },
    { glyph: "\u{1F3A8}", label: "Drawing", at: "draw", beat: 5, mark: "tick" },
    { glyph: "\u{1F3AE}", label: "Saved game", at: "game", beat: 5, mark: "tick" },
    { glyph: "\u{1F5BC}️", label: "Photos", at: "photos", beat: 5, mark: "tick" }
  ];
  var NW_CAUSES = [
    { x: 300, glyph: "✈️", label: "on a plane", at: "plane" },
    { x: 584, glyph: "\u{1F687}", label: "in a tunnel", at: "tunnel" },
    { x: 868, glyph: "\u{1F4E1}", label: "the router breaks", at: "breaks" }
  ];
  function nwAppSlot(k) { return [160 + (k % 3) * 86, 158 + Math.floor(k / 3) * 110]; }

  /* the tablet: a dark slab with a screen */
  function nwTablet(o, ring) {
    if (!(o > 0)) return "";
    var b = NW_TAB;
    return G(R(b.x, b.y, b.w, b.h, 26, P.cell, ring > 0 ? P.good : P.line, ring > 0 ? 5 : 3) +
      R(b.x + 16, b.y + 32, b.w - 32, b.h - 64, 12, "#0A1B28") +
      C(b.x + b.w / 2, b.y + b.h - 16, 7, P.line), { opacity: clamp(o, 0, 1) });
  }

  function nwOffChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSome = c(0, "sometimes"), cNot = c(0, "notavail");
    var cOff = c(2, "off"), cTry = c(2, "try");
    var cNeed = c(4, "need"), cReach = c(4, "reached");
    var cAlready = c(6, "already"), cNobody = c(6, "nobody");
    var out = "", early = 1 - nwFrom(t, scene, 2), late = nwFrom(t, scene, 2);

    /* ---- the first two lines: the link to the world, and what breaks it ---- */
    if (early > 0) {
      var so = popIn(t, cSome, 0.45), br = on(t, cNot, 0.5);
      var g = G(Em(300, 196, 108, "\u{1F4F1}") + Em(868, 196, 108, "\u{1F30D}") +
        L(372, 196, lerp(372, 560, 1 - br * 0.45), 196, P.teal, 5, { "stroke-dasharray": "10 12", opacity: 1 - br * 0.5 }) +
        L(796, 196, lerp(796, 610, 1 - br * 0.45), 196, P.teal, 5, { "stroke-dasharray": "10 12", opacity: 1 - br * 0.5 }) +
        MK.cross(584, 196, 40, popIn(t, cNot, 0.4)), { opacity: Math.min(1, so) * early });
      out += g;
      NW_CAUSES.forEach(function (ca) {
        var p = popIn(t, c(1, ca.at), 0.45);
        if (!(p > 0)) return;
        out += G(Em(ca.x, 352, 62, ca.glyph) + Tx(ca.x, 404, ca.label, "lab mid muted", "middle") +
          (ca.at === "breaks" ? MK.cross(ca.x + 36, 326, 18, Math.min(1, p)) : ""),
          { transform: around(ca.x, 352, Math.min(1, p)), opacity: Math.min(1, p) * early });
      });
    }

    /* ---- the rest: switch it off, and try each thing ---------------------- */
    if (late <= 0) return svg(out);
    var ringO = on(t, cNobody, 0.6);
    out += G(nwTablet(1, ringO), { opacity: late });

    /* the switch, flipped on "Switch it off" */
    var u = on(t, cOff, 0.5);
    out += G(Tx(496, 90, "Internet", "lab big", "start") +
      R(660, 62, 112, 50, 25, u > 0.5 ? "#4A2A2A" : "#1E4437", u > 0.5 ? P.bad : P.good, 3) +
      C(lerp(746, 686, u), 87, 18, u > 0.5 ? P.bad : P.good) +
      Tx(792, 98, u > 0.5 ? "OFF" : "ON", "lab big", "start", { fill: u > 0.5 ? P.bad : P.good }),
      { opacity: late });

    /* the six things, on the screen and in a list, each decided as it is named */
    var rows = NW_APPS.map(function (a, k) {
      return { text: a.label, at: cTry == null ? null : cTry + k * 0.12, mark: a.mark, markAt: c(a.beat, a.at) };
    });
    out += G(MK.list(496, 168, rows, t, { lh: 44, cls: "lab big", markR: 16 }), { opacity: late });
    NW_APPS.forEach(function (a, k) {
      var p = popIn(t, cTry == null ? null : cTry + k * 0.12, 0.4);
      if (!(p > 0)) return;
      var s = nwAppSlot(k), at = c(a.beat, a.at);
      var glow = a.mark === "tick" ? bump(t, cAlready == null ? null : cAlready + (k - 3) * 0.18, 1.0) : 0;
      var dim = a.mark === "cross" && cAlready != null && t >= cAlready ? 0.4 : 1;
      out += G(C(s[0], s[1], 34, P.good, null, null, { opacity: 0.3 * glow }) + Em(s[0], s[1], 58, a.glyph) +
        (a.mark === "tick" ? MK.tick(s[0] + 26, s[1] - 28, 14, popIn(t, at, 0.35))
          : MK.cross(s[0] + 26, s[1] - 28, 14, popIn(t, at, 0.35))),
        { transform: around(s[0], s[1], Math.min(1, p)), opacity: Math.min(1, p) * late * dim });
    });

    /* "need other computers, and they cannot be reached" */
    var no = popIn(t, cNeed, 0.45);
    if (no > 0) {
      var away = cNobody != null && t >= cNobody ? 0.35 : 1;
      out += G(Em(1076, 190, 84, "\u{1F5A5}️") + Tx(1076, 250, "far away", "lab mid muted", "middle"),
        { transform: around(1076, 190, Math.min(1, no)), opacity: Math.min(1, no) * late * away });
      var re = on(t, cReach, 0.6);
      if (re > 0) out += G(L(812, 190, lerp(812, 900, re), 190, P.gold, 5, { "stroke-dasharray": "10 10" }) +
        MK.cross(930, 190, 22, popIn(t, cReach == null ? null : cReach + 0.35, 0.35)), { opacity: late });
    }
    return svg(out);
  }

  /* ---- what you now know --------------------------------------------------- */
  var NW_RECAP = MK.recapKind([
    { beat: 0, at: "network", title: "Network", sub: "devices joined so they can share", pic: "\u{1F517}" },
    { beat: 1, at: "router", title: "Router", sub: "the box every device joins", pic: "\u{1F4E1}" },
    { beat: 1, at: "wire", title: "Wired", sub: "a cable carries it", pic: "\u{1F50C}" },
    { beat: 1, at: "none", title: "Wireless", sub: "through the air, still connected", pic: "\u{1F4F6}" },
    { beat: 2, at: "internet", title: "The internet", sub: "computers all round the world", pic: "\u{1F30D}" },
    { beat: 3, at: "gone", title: "Not always there", sub: "then the rest carries on", pic: "\u{1F4F4}" }
  ], { goBeat: 3, goAt: "carries" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What a network is", "Wires, and no wires at all", "The internet, and when it is off"] }),
    network: nwNetworkChapter,
    router: nwRouterChapter,
    wires: nwWiresChapter,
    world: nwWorldChapter,
    off: nwOffChapter,
    recap: NW_RECAP
  };

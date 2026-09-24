  /* ==== Networks and the Internet, part 3 =====================================
     The chapter "The internet". The lesson's own drawing of the world
     (ART.scene "internet", states 2 and 3) is NOT used here: its caption is
     wider than its own 320-unit viewBox and clips, which is a fault in the
     lesson's art and neither this film's to fix nor to hide. The world is
     drawn here instead, out of the same pieces the lesson's drawing is made
     of - a blue globe, computers on it, gold links between them, and one
     envelope crossing. */

  var NW_G = [700, 220], NW_GR = 150;
  var NW_WN = [[-92, -58], [-16, -104], [70, -84], [112, -20], [86, 72], [6, 110],
    [-74, 86], [-114, 14], [-40, 26], [46, 20]];
  var NW_WL = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    [8, 1], [8, 6], [9, 3], [9, 5], [8, 9], [0, 8]];
  function nwNode(k) { return [NW_G[0] + NW_WN[k][0], NW_G[1] + NW_WN[k][1]]; }

  var NW_HOME = [164, 226];
  var NW_ROUTER = [400, 240];
  var NW_SCHOOL = [352, 372];
  var NW_GRAN = [1046, 148];

  /* the home network card: a house and its three devices, joined */
  function nwHomeCard(t, o, ringO) {
    if (!(o > 0)) return "";
    var x = NW_HOME[0], y = NW_HOME[1], out = R(40, 130, 248, 192, 22, P.card, ringO > 0.5 ? P.gold : P.line, ringO > 0.5 ? 4 : 3);
    var kids = [[100, 272, "\u{1F4BB}"], [164, 272, "\u{1F4F1}"], [228, 272, "\u{1F5A8}️"]];
    kids.forEach(function (k) { out += L(x, y - 6, k[0], k[1] - 20, P.gold, 3, { opacity: 0.8 }); });
    out += Em(x, y - 34, 58, "\u{1F3E0}");
    kids.forEach(function (k) { out += Em(k[0], k[1], 36, k[2]); });
    out += Tx(x, 312, "your network", "lab mid muted", "middle");
    return G(out, { transform: around(x, y, Math.min(1, o)), opacity: clamp(o, 0, 1) });
  }

  function nwWorldChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHome = c(0, "home"), cMany = c(0, "millions"), cRound = c(0, "around");
    var cJoin = c(1, "many"), cNet = c(1, "internet");
    var cJoins = c(2, "joins");
    var cSchool = c(3, "school"), cGran = c(3, "grandma");
    var cSend = c(4, "send"), cCross = c(4, "crosses"), cSec = c(4, "second");
    var cNotOne = c(5, "notone"), cLots = c(5, "lots");
    var out = "";

    var netO = on(t, cNet, 0.6);
    out += nwGlobe(NW_G[0], NW_G[1], NW_GR, 1);
    if (netO > 0) out += MK.glow(NW_G[0], NW_G[1], NW_GR + 40, P.gold, netO * (0.5 + 0.3 * breathe(t)));

    /* "around the world": a gold ring drawn right round the globe */
    var ru = on(t, cRound, 1.0), circ = 2 * Math.PI * (NW_GR + 12);
    if (ru > 0) out += C(NW_G[0], NW_G[1], NW_GR + 12, "none", P.gold, 4,
      { "stroke-dasharray": n2(circ * ru) + " " + n2(circ), transform: "rotate(-90 " + NW_G[0] + " " + NW_G[1] + ")" });

    /* "millions more": the other networks arrive; "Join many networks": the links */
    var grown = tally(t, cMany, NW_WN.length, 1.2);
    var linkU = on(t, cJoin, 1.2);
    NW_WL.forEach(function (lk, k) {
      if (lk[0] >= grown || lk[1] >= grown) return;
      var a = nwNode(lk[0]), b = nwNode(lk[1]);
      out += L(a[0], a[1], b[0], b[1], P.gold, 3, { opacity: 0.85 * clamp(linkU * 1.5 - k * 0.05, 0, 1) });
    });
    var flash = cLots == null ? null : cLots;
    for (var k = 0; k < grown; k++) {
      var p = nwNode(k), pop = popIn(t, cMany == null ? null : cMany + k * 0.11, 0.35);
      var fl = bump(t, flash == null ? null : flash + k * 0.07, 0.7);
      out += G(Em(p[0], p[1], 36, NW_GLYPH[k % 3]) + C(p[0], p[1], 24, "none", P.gold, 3, { opacity: fl }),
        { transform: around(p[0], p[1], Math.min(1, pop)), opacity: Math.min(1, pop) });
    }

    /* the home network, and the router that joins it to the world */
    out += nwHomeCard(t, popIn(t, cHome, 0.5), on(t, cHome, 0.4) * nwOnly(t, scene, 0));
    var jo = on(t, cJoins, 0.7);
    if (jo > 0) {
      out += G(Em(NW_ROUTER[0], NW_ROUTER[1], 54, "\u{1F4E1}") +
        Tx(NW_ROUTER[0], NW_ROUTER[1] + 46, "router", "lab mid muted", "middle"),
        { transform: around(NW_ROUTER[0], NW_ROUTER[1], Math.min(1, popIn(t, cJoins, 0.4))) });
      out += nwCable(300, 234, lerp(300, 372, jo), lerp(234, 238, jo), 1, P.gold, 5);
      out += nwCable(430, 238, lerp(430, 570, jo), lerp(238, 232, jo), 1, P.gold, 5);
    }

    /* a school far away, and Grandma's phone */
    var so = popIn(t, cSchool, 0.45);
    if (so > 0) {
      var n6 = nwNode(6);
      out += nwCable(NW_SCHOOL[0] + 30, NW_SCHOOL[1] - 22, n6[0], n6[1] + 18, on(t, cSchool, 0.6), P.gold, 4);
      out += G(Em(NW_SCHOOL[0], NW_SCHOOL[1], 60, "\u{1F3EB}") + Tx(NW_SCHOOL[0], NW_SCHOOL[1] + 48, "a school", "lab mid muted", "middle"),
        { transform: around(NW_SCHOOL[0], NW_SCHOOL[1], Math.min(1, so)), opacity: Math.min(1, so) });
    }
    var go = popIn(t, cGran, 0.45);
    if (go > 0) {
      var n3 = nwNode(3);
      out += nwCable(NW_GRAN[0] - 26, NW_GRAN[1] + 24, n3[0], n3[1] - 14, on(t, cGran, 0.6), P.gold, 4);
      out += G(Em(NW_GRAN[0], NW_GRAN[1], 60, "\u{1F475}") + Em(NW_GRAN[0] + 42, NW_GRAN[1] + 22, 34, "\u{1F4F2}") +
        Tx(NW_GRAN[0], NW_GRAN[1] + 56, "Grandma", "lab mid muted", "middle"),
        { transform: around(NW_GRAN[0], NW_GRAN[1], Math.min(1, go)), opacity: Math.min(1, go) });
    }

    /* "Send Grandma a message, and it crosses the whole world": one flight,
       out of the house and straight across the globe to Grandma - it does not
       stop at any computer along the way, which is not something the lesson
       says. Two legs only so a distinct thing happens on each named cue. */
    var live = nwOnly(t, scene, 4);
    if (live > 0) {
      var p1 = nwAlong(t, cSend == null ? null : cSend + 0.25, 0.9, NW_HOME[0], NW_HOME[1] - 70, nwNode(3)[0], nwNode(3)[1], 40, "✉️", 30);
      var p3 = nwAlong(t, cCross, 0.7, nwNode(3)[0], nwNode(3)[1], NW_GRAN[0] - 30, NW_GRAN[1] + 14, 40, "✉️", 24);
      out += nwFly(p3 || p1, live);
      /* "crosses the whole world": the road it took, lit */
      var ct = on(t, cCross, 0.5);
      if (ct > 0) {
        var road = [[NW_HOME[0], NW_HOME[1] - 70], nwNode(3), [NW_GRAN[0] - 30, NW_GRAN[1] + 14]];
        for (var q = 1; q < road.length; q++)
          out += L(road[q - 1][0], road[q - 1][1], road[q][0], road[q][1], P.good, 5, { opacity: ct * 0.9 });
      }
      out += MK.pill(700, 404, "about 1 second", on(t, cSec, 0.45) * live, { size: 30, col: P.good });
    }

    /* "not one big computer. It is millions of them, joined." - the globe and
       everything on it fades out first, so the wrong card never sits over
       the right picture; it fades back in as "millions of them" is said,
       which is the correct picture answering the contrast */
    var bg = out;
    var one = on(t, cNotOne, 0.45) * (1 - on(t, cLots == null ? null : cLots + 0.55, 0.55));
    var card = "";
    if (one > 0) {
      card = G(R(566, 120, 268, 196, 22, P.card, P.bad, 4) + Em(700, 206, 104, "\u{1F5A5}️") +
        MK.cross(786, 152, 40, 1), { opacity: one });
    }
    return svg(G(bg, { opacity: 1 - one }) + card);
  }

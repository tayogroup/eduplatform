  /* ==== Machines, Things and Robots, part 2: the Internet of Things ============
     tools/lib/film-scenes/computing-g3/machines-things-and-robots-2.js. See the
     header of machines-things-and-robots.js.

     Four ordinary things gain a chip and a wireless ripple, one at a time, and
     become the Internet of Things. Then the lesson's own correction - smart
     means connected, not clever - and two of its own examples: a smart watch
     sending steps to a phone, and a smart bulb switched on from another town.
     The lamp that is "just a switch" is drawn in its OWN place at the end,
     never on top of the smart bulb it is contrasted with. */

  var MT_IOT = [
    { id: "bulb", pic: "\u{1F4A1}", label: "a bulb" },
    { id: "doorbell", pic: "\u{1F6CE}️", label: "a doorbell" },
    { id: "thermostat", pic: "\u{1F321}️", label: "a thermostat" },
    { id: "plug", pic: "\u{1F50C}", label: "a plug" }
  ];
  var MT_IOT_CARD = { w: 266, h: 128, gap: 14, y: 20 };
  function mtIotX(k) { return 31 + k * (MT_IOT_CARD.w + MT_IOT_CARD.gap); }

  function mtIotChapter(scene, beat, t, i) {
    var cBulb = sc(scene, 0, "bulb1"), cDoorbell = sc(scene, 0, "doorbell1"),
      cTherm = sc(scene, 0, "thermostat1"), cPlug = sc(scene, 0, "plug1");
    var cComp = sc(scene, 1, "computer2"), cNet = sc(scene, 1, "internet2");
    var cIot = sc(scene, 2, "iotdevice"), cSmart = sc(scene, 2, "smartdev1");
    var cClever = sc(scene, 3, "notclever"), cConn = sc(scene, 3, "meansconnected");
    var cWatch = sc(scene, 4, "watch1"), cSteps = sc(scene, 4, "counts1"), cSend = sc(scene, 4, "sendsphone1");
    var cSwitch = sc(scene, 5, "switchesphone"), cTown = sc(scene, 5, "anothertown");
    var cLamp = sc(scene, 6, "lampbeside"), cNotSmart = sc(scene, 6, "notsmart1");
    var at = { bulb: cBulb, doorbell: cDoorbell, thermostat: cTherm, plug: cPlug };
    var u1 = into(t, scene.first + 4), out = "", top = "";

    /* the four things, each gaining a chip and a ripple as its own computer
       connects it to the internet */
    MT_IOT.forEach(function (row, k) {
      var o = on(t, at[row.id], 0.5);
      if (o <= 0) return;
      var x = mtIotX(k), cx = x + MT_IOT_CARD.w / 2;
      top += mtCard(x, MT_IOT_CARD.y, MT_IOT_CARD.w, MT_IOT_CARD.h, row.pic, row.label, { o: o });
      var cp = popIn(t, cComp, 0.4);
      if (cp > 0) top += mtChip(x + MT_IOT_CARD.w - 26, MT_IOT_CARD.y + 24, 26, Math.min(1, cp));
      top += MK.waves(x + MT_IOT_CARD.w - 26, MT_IOT_CARD.y + 24, t, cNet, { n: 3, reach: 26, period: 1, col: P.blue });
    });
    /* "an Internet of Things device": the label the four things earn together */
    var ip = popIn(t, cIot, 0.42);
    if (ip > 0) {
      top += MK.glow(584, 220, 64, P.blue, Math.min(1, ip) * 0.8);
      top += MK.pill(584, 220, "Internet of Things device", ip, { size: 26, col: P.blue, ink: P.blue });
    }
    /* "a smart device": the shorter name for the same thing, said right after */
    var sdp = popIn(t, cSmart, 0.42);
    if (sdp > 0) top += MK.pill(584, 270, "a smart device", sdp, { size: 20, col: P.gold, ink: P.gold });
    /* smart does not mean clever, it means connected - two words, judged */
    var wp = popIn(t, cClever, 0.42);
    if (wp > 0) {
      top += MK.pill(430, 340, "clever", wp, { size: 24, col: P.muted, ink: P.muted });
      top += MK.cross(430 + 6 * 6 + 14, 340, 22, popIn(t, cClever == null ? null : cClever + 0.3, 0.35));
    }
    var cp2 = popIn(t, cConn, 0.42);
    if (cp2 > 0) {
      top += MK.pill(760, 340, "connected", cp2, { size: 24, col: P.good, ink: P.good });
      top += MK.tick(760 + 9 * 6 + 14, 340, 22, popIn(t, cConn == null ? null : cConn + 0.3, 0.35));
    }
    out += G(top, { opacity: 1 - u1 });

    /* three of the lesson's own examples, left to right, each staying once it
       has arrived: a watch sending steps, a bulb switched from far away, and -
       in its own space, never on the bulb's picture - the lamp that is not */
    var bot = "";
    var wo = on(t, cWatch, 0.5);
    if (wo > 0) {
      bot += G(Em(140, 210, 74, "⌚") + Tx(140, 268, "a smart watch", "lab mid", "middle"), { opacity: wo });
      var sp = on(t, cSteps, 0.5);
      if (sp > 0) bot += MK.pill(140, 320, "counts steps", sp, { size: 20, col: P.blue, ink: P.blue });
      var sd = on(t, cSend, 0.5);
      bot += MK.arrow(180, 210, 290, 210, sd, P.blue, 6);
      if (sd > 0) bot += MK.pop(Em(320, 210, 60, "\u{1F4F1}"), 320, 210, sd);
    }
    var swp = on(t, cSwitch, 0.5);
    if (swp > 0) {
      bot += MK.pop(Em(520, 150, 56, "\u{1F4F1}"), 520, 150, swp);
      bot += MK.arrow(560, 165, 700, 210, on(t, cTown, 0.6), P.gold, 7, { "stroke-dasharray": "3 3" });
      var tp = popIn(t, cTown, 0.42);
      if (tp > 0) {
        bot += MK.glow(760, 230, 60, P.gold, Math.min(1, tp) * 0.85);
        bot += MK.pop(Em(760, 230, 68, "\u{1F4A1}"), 760, 230, tp);
        bot += MK.pill(760, 300, "another town", tp, { size: 20, col: P.gold, ink: P.gold });
      }
    }
    var lp = on(t, cLamp, 0.5);
    if (lp > 0) {
      bot += G(mtLampBase(940, 190, 1), { opacity: lp });
      bot += Tx(940, 260, "just a switch", "lab mid", "middle", { opacity: lp });
      bot += MK.cross(940, 150, 26, popIn(t, cNotSmart, 0.4));
    }
    out += G(bot, { opacity: u1 });
    return svg(out);
  }

  /* a table lamp with a plain rocker switch on its cord - drawn, not an
     emoji, so it reads as ordinary rather than as a bulb of any kind */
  function mtLampBase(cx, cy, o) {
    if (!(o > 0)) return "";
    return R(cx - 46, cy + 46, 92, 14, 5, P.plastic, P.line, 2) +
      L(cx, cy + 46, cx, cy - 6, P.plastic, 6) +
      Pth("M" + n2(cx - 40) + "," + n2(cy - 6) + " L" + n2(cx + 40) + "," + n2(cy - 6) +
        " L" + n2(cx + 26) + "," + n2(cy - 56) + " L" + n2(cx - 26) + "," + n2(cy - 56) + " Z", P.gold, P.line, 2) +
      mtSwitch(cx + 34, cy + 30, 30, false);
  }

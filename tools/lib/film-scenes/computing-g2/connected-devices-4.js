  /* ==== Connected Devices, part 4: what you keep private, and the recap ========
     tools/lib/film-scenes/computing-g2/connected-devices-4.js. See the header of
     connected-devices.js. The three personal things, the password and the
     malware file are the lesson's own added lecture part and its word cards. */

  /* ==== chapter: what you keep private ============================================
     First the three things the lesson calls personal information, going out over
     the network with no way back. Then the password, which is for two people
     only, and the file from someone you do not know. */
  var CD_PERSONAL = [
    { x: 70, icon: "\u{1F9D2}", label: "your full name" },
    { x: 434, icon: "\u{1F3E0}", label: "your address" },
    { x: 798, icon: "\u{1F3EB}", label: "your school" }
  ];
  function cdPrivateOut(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var at = [c(0, "name"), c(0, "address"), c(0, "school")];
    var cPers = c(0, "personal"), cShare = c(1, "share"), cBack = c(1, "back");
    var out = "", sent = on(t, cShare, 0.8);

    out += MK.pill(584, 56, "personal information", on(t, cPers, 0.45), { size: 26, col: P.gold, ink: P.gold });
    CD_PERSONAL.forEach(function (card, k) {
      var p = popIn(t, at[k], 0.42);
      if (!(p > 0)) return;
      var cx = card.x + 150;
      out += G(R(card.x, 92, 300, 150, 24, P.cell, cdHot(t, at[k]) ? P.gold : P.line, cdHot(t, at[k]) ? 4 : 2) +
        Em(cx, 150, 62, card.icon) + Tx(cx, 218, card.label, "lab big", "middle"),
        { transform: around(cx, 167, Math.min(1.06, p)), opacity: Math.min(1, p) });
      out += cdWire(k === 1 ? [[cx, 246], [cx, 300]] : [[cx, 246], [cx, 300], [584, 300]], sent, P.gold, 5);
    });
    out += cdRouter(584, 330, 0.9, on(t, cShare, 0.5));
    out += MK.glow(584, 330, 105, P.gold, sent * 0.85);
    /* and no way back */
    out += MK.arrow(760, 332, 760, 258, on(t, cBack, 0.5), P.bad, 7);
    out += MK.cross(760, 238, 22, popIn(t, cBack == null ? null : cBack + 0.4, 0.4));
    return out;
  }

  function cdPrivateKeep(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPass = c(2, "password"), cGrown = c(2, "grownup"), cLock = c(2, "private");
    var cMal = c(3, "malware"), cHarm = c(3, "harm"), cNever = c(3, "never");
    var out = "", left = on(t, cPass, 0.5), right = on(t, cMal, 0.5);

    /* the password */
    out += G(R(60, 56, 510, 330, 26, P.card, cLock != null && t >= cLock ? P.good : P.line, 3) +
      R(92, 112, 446, 100, 22, P.cell, P.line, 2) +
      Em(150, 162, 48, "\u{1F511}") +
      Tx(200, 176, "••••••", "lab huge gold", "start") +
      Tx(200, 202, "a password", "lab mid muted", "start"),
      { opacity: clamp(Math.min(1, left), 0, 1) });
    var g = popIn(t, cGrown, 0.45);
    if (g > 0) {
      /* a child and an adult, and they must not be the same drawing: this
         machine draws the person emoji as the same face as the child one, so
         the grown-up is a woman, and bigger */
      out += MK.pop(Em(190, 292, 56, "\u{1F9D2}") + Tx(190, 344, "you", "lab mid", "middle"), 190, 300, g);
      out += MK.pop(Em(340, 288, 72, "\u{1F469}") + Tx(340, 344, "a grown-up", "lab mid", "middle"), 340, 300, popIn(t, cGrown == null ? null : cGrown + 0.3, 0.45));
      out += MK.tick(452, 288, 26, popIn(t, cGrown == null ? null : cGrown + 0.6, 0.4));
    }
    out += MK.pop(Em(498, 160, 56, "\u{1F512}"), 498, 160, popIn(t, cLock, 0.45));

    /* the file from someone you do not know */
    out += G(R(598, 56, 530, 330, 26, P.card, cNever != null && t >= cNever ? P.bad : P.line, 3),
      { opacity: clamp(Math.max(0.22, Math.min(1, right)), 0, 1) });
    var m = popIn(t, cMal, 0.45);
    if (m > 0) {
      out += MK.pop(Em(1010, 150, 58, "\u{1F9D1}") + Tx(1010, 206, "someone you do not know", "lab small muted", "middle"), 1010, 160, m);
      out += MK.arrow(962, 158, 900, 166, on(t, cMal == null ? null : cMal + 0.4, 0.5), P.bad, 6);
      out += MK.pop(R(640, 104, 240, 124, 18, P.cell, P.line, 2) + Em(700, 170, 62, "\u{1F4C4}") +
        Tx(760, 250, "a file", "lab mid muted", "middle"), 760, 166, m);
      out += MK.pop(Em(846, 132, 44, "⚠️"), 846, 132, popIn(t, cHarm, 0.4));
      /* NOT a bug emoji here: in this course a bug is a mistake in a program,
         and malware is not one. The file itself goes red instead. */
      out += R(640, 104, 240, 124, 18, "none", P.bad, 3,
        { opacity: clamp(popIn(t, cHarm == null ? null : cHarm + 0.3, 0.4), 0, 1) });
      out += MK.cross(760, 166, 52, popIn(t, cNever, 0.45));
      out += MK.pill(820, 322, "do not open it", on(t, cNever == null ? null : cNever + 0.3, 0.45), { size: 25, col: P.bad, ink: P.bad });
    }
    return out;
  }

  function cdPrivateChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(cdPrivateOut(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cdPrivateKeep(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== what you now know =========================================================
     One card per idea, in the lesson's own words. The first two are drawn rather
     than set in an emoji: a row of the lesson's devices, and the pair that works
     together with the network between them. */
  function cdCardDevices(cx, cy, size) {
    var s = size * 0.46;
    return Em(cx - size * 0.42, cy, s, CD_DEV.laptop.pic) + Em(cx, cy, s, CD_DEV.printer.pic) +
      Em(cx + size * 0.42, cy, s, CD_DEV.tv.pic);
  }
  function cdCardPair(cx, cy, size) {
    return L(cx - size * 0.3, cy, cx + size * 0.3, cy, P.gold, 4) +
      Em(cx - size * 0.42, cy, size * 0.5, CD_DEV.phone.pic) +
      Em(cx + size * 0.42, cy, size * 0.5, CD_DEV.printer.pic);
  }

  var CD_RECAP = MK.recapKind([
    { beat: 0, at: "join", title: "Devices", sub: "phones, printers, TVs, watches", pic: cdCardDevices },
    { beat: 1, at: "together", title: "Together", sub: "each does what the other cannot", pic: cdCardPair },
    { beat: 1, at: "wired", title: "Wired and wireless", sub: "cables, or through the air", pic: "\u{1F50C}" },
    { beat: 2, at: "bars", title: "Is it there?", sub: "bars, lights and loading", pic: "\u{1F4F6}" },
    { beat: 2, at: "share", title: "Share with care", sub: "who will see it?", pic: "\u{1F512}" }
  ], { goBeat: 2, goAt: "share" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Which devices can join a network", "Wires, wi-fi, and how to tell it is there", "What sharing means, and what stays private"] }),
    join: cdJoinChapter, together: cdTogetherChapter, wires: cdWiresChapter,
    signal: cdSignalChapter, sharing: cdSharingChapter, "private": cdPrivateChapter,
    recap: CD_RECAP
  };

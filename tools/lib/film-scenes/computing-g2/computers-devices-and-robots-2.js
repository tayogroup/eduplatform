  /* ==== Grade 2 Computing, Lesson 11, part 2 ===================================
     The chapters "What people do better" and "The right device". Joined to
     computers-devices-and-robots.js and -3.js and -4.js into one script, so the
     cdr* helpers, HUE and KINDS from part 1 are already here.

     NOTHING CORRECT IS CROSSED OUT IN EITHER CHAPTER. In the people chapter the
     computer is not marked wrong - it carries a question mark, because the
     lesson's point is that it cannot do these jobs at all, not that it is bad at
     them. In the device chapter all four devices keep their place on the row and
     only the one being named is ringed in gold. */

  /* ==== chapter: what people do better ==========================================
     The lesson's own three people jobs, each with the picture its job sorter
     gives it: a hug, a present, two friends being fair. The computer stands to
     the left with a question mark and the words "a computer cannot", and never
     moves again. */

  var CDR_JOBS = [
    { pic: "\u{1F917}", l1: "comfort a friend", l2: "who has fallen over", a: "comfort", b: "sad" },
    { pic: "\u{1F381}", l1: "choose a present", l2: "Grandma will love", a: "present", b: "grandma" },
    { pic: "\u{1F91D}", l1: "be fair", l2: "when both want the toy", a: "fair", b: "toy" }
  ];
  var CDR_JOB_X = [282, 574, 866], CDR_JOB_W = 280, CDR_JOB_Y = 44, CDR_JOB_H = 280;

  function cdrJobCard(x, item, p, sub, badge) {
    if (!(p > 0)) return "";
    var cx = x + CDR_JOB_W / 2, y = CDR_JOB_Y, h = CDR_JOB_H;
    var out = R(x, y, CDR_JOB_W, h, 20, P.cell, P.good, 3);
    out += Em(cx, y + 100, 92, item.pic);
    out += Tx(cx, y + 220, item.l1, "lab big", "middle");
    if (sub > 0) out += Tx(cx, y + 256, item.l2, "lab mid muted readable", "middle", { opacity: clamp(sub, 0, 1) });
    /* "Those jobs are ours": a person on each card, top right */
    if (badge > 0) out += MK.pop(C(x + CDR_JOB_W - 34, y + 34, 25, P.card, P.good, 3) +
      Em(x + CDR_JOB_W - 34, y + 34, 30, "\u{1F9D1}"), x + CDR_JOB_W - 34, y + 34, badge);
    return G(out, { transform: around(cx, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  KINDS.people = function (scene, beat, t, i) {
    var cCannot = sc(scene, 0, "cannot");
    var cFast = sc(scene, 4, "fast"), cOurs = sc(scene, 4, "ours");
    var out = "", k;

    /* the computer: a question mark, never a cross */
    var pc = on(t, cCannot, 0.5);
    if (pc > 0) out += G(R(24, CDR_JOB_Y, 230, CDR_JOB_H, 20, P.card, P.line, 2) +
      Em(139, CDR_JOB_Y + 100, 92, "\u{1F4BB}") +
      MK.qmark(139, CDR_JOB_Y + 192, 30, on(t, cCannot, 1.0)) +
      Tx(139, CDR_JOB_Y + 248, "a computer", "lab big", "middle") +
      Tx(139, CDR_JOB_Y + 276, "cannot do these", "lab mid muted readable", "middle"), { opacity: pc });

    /* the three jobs, one per beat */
    for (k = 0; k < 3; k++) {
      var cA = sc(scene, 1 + k, CDR_JOBS[k].a), cB = sc(scene, 1 + k, CDR_JOBS[k].b);
      out += cdrJobCard(CDR_JOB_X[k], CDR_JOBS[k], popIn(t, cA, 0.42), on(t, cB, 0.45),
        popIn(t, cOurs == null ? null : cOurs + k * 0.16, 0.36));
    }

    /* fast is not the same as kind */
    out += MK.pill(139, 392, "fast", on(t, cFast, 0.4), { size: 24, col: P.gold, ink: P.gold });
    out += G(Tx(430, 400, "not the same as", "lab mid muted readable", "middle"), { opacity: on(t, cFast, 0.5) });
    out += MK.pill(714, 392, "kind, and fair", on(t, cFast == null ? null : cFast + 0.45, 0.4),
      { size: 24, col: P.good, ink: P.good });
    return svg(out);
  };

  /* ==== chapter: the right device ===============================================
     Two pictures. First the lesson's OWN laptop (ART.figure) as one example of a
     device, with the chip that is the computer inside it, and the lesson's two
     questions - where you are, and what it is for. Then the four devices the
     lesson names, in a row, each ringed as it is spoken, and two of the lesson's
     own situations pointing at the device that fits. */

  /* a chip, drawn rather than borrowed: no emoji here reads as one */
  function cdrChip(cx, cy, s, col, o) {
    if (!(o > 0)) return "";
    var w = 46 * s, h = 40 * s, out = R(cx - w / 2, cy - h / 2, w, h, 6 * s, P.dark, col, 3 * s), k;
    for (k = 0; k < 3; k++) {
      var y = cy - h / 2 + h * (k + 1) / 4;
      out += L(cx - w / 2 - 9 * s, y, cx - w / 2, y, col, 3 * s) + L(cx + w / 2, y, cx + w / 2 + 9 * s, y, col, 3 * s);
    }
    out += R(cx - w * 0.2, cy - h * 0.2, w * 0.4, h * 0.4, 3 * s, col, null, null, { opacity: 0.75 });
    return G(out, { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function cdrAskCard(x, y, w, h, pic, label, p) {
    if (!(p > 0)) return "";
    var cx = x + w / 2;
    return G(R(x, y, w, h, 20, P.card, P.blue, 3) + Em(cx, y + 58, 62, pic) +
      Tx(cx, y + 136, label, "lab big", "middle"),
      { transform: around(cx, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  function cdrWhatIsADevice(scene, t) {
    var cDevice = sc(scene, 0, "device"), cInside = sc(scene, 0, "inside");
    var cWhere = sc(scene, 1, "where"), cFor = sc(scene, 1, "forwhat");
    var out = "", p = popIn(t, cDevice, 0.5);

    out += MK.pill(584, 52, "a device", on(t, cDevice, 0.4), { size: 26, col: P.gold, ink: P.gold });
    if (p > 0) out += G(ART.place(ART.figure("laptop"), 444, 86, 280, 208),
      { transform: around(584, 190, Math.min(1.04, p)), opacity: Math.min(1, p) });

    /* the computer inside it; it fades back when the two questions arrive */
    var fade = 1 - 0.55 * into(t, scene.first + 1);
    var pIn = popIn(t, cInside, 0.45);
    if (pIn > 0) out += G(MK.leader(584, 322, 584, 300, on(t, cInside, 0.4), P.gold) +
      cdrChip(584, 356, 1.6, P.gold, pIn) +
      MK.pill(584, 412, "a computer inside", on(t, cInside == null ? null : cInside + 0.3, 0.4),
        { size: 22, col: P.gold, ink: P.gold }), { opacity: fade });

    out += cdrAskCard(52, 120, 300, 180, "\u{1F4CD}", "where you are", popIn(t, cWhere, 0.45));
    out += MK.arrow(360, 190, 434, 190, on(t, cWhere == null ? null : cWhere + 0.25, 0.5), P.blue, 7);
    out += cdrAskCard(816, 120, 300, 180, "\u{1F3AF}", "what it is for", popIn(t, cFor, 0.45));
    out += MK.arrow(808, 190, 734, 190, on(t, cFor == null ? null : cFor + 0.25, 0.5), P.blue, 7);
    return out;
  }

  var CDR_DEV = [
    { pic: "\u{1F4F2}", l1: "Phone", l2: "in a pocket, anywhere", a: "phone", b: "pocket" },
    { pic: "\u{1F4BB}", l1: "Laptop", l2: "lots of typing", a: "laptop", b: "typing" },
    { pic: "\u{1F5A5}️", l1: "Desktop", l2: "one desk, a big screen", a: "desktop", b: "screen" },
    { pic: "\u{1F50A}", l1: "Smart speaker", l2: "when your hands are busy", a: "speaker", b: "hands" }
  ];
  var CDR_DEV_X = [34, 314, 594, 874], CDR_DEV_W = 260, CDR_DEV_Y = 44, CDR_DEV_H = 250;

  function cdrDevTile(x, item, p, sub, col) {
    if (!(p > 0)) return "";
    var cx = x + CDR_DEV_W / 2, y = CDR_DEV_Y, h = CDR_DEV_H;
    var out = R(x, y, CDR_DEV_W, h, 20, P.cell, col || P.line, col ? 3.5 : 2);
    out += Em(cx, y + 96, 92, item.pic);
    out += Tx(cx, y + 188, item.l1, "lab big", "middle");
    if (sub > 0) out += Tx(cx, y + 224, item.l2, "lab mid muted readable", "middle", { opacity: clamp(sub, 0, 1) });
    return G(out, { transform: around(cx, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, p) });
  }

  /* one of the lesson's own situations, pointing at the device that fits */
  function cdrCase(cx, cy, pic, text, o) {
    if (!(o > 0)) return "";
    var w = 250, h = 64;
    return G(R(cx - w / 2, cy - h / 2, w, h, 20, P.card, P.gold, 3) +
      Em(cx - 82, cy, 44, pic) + Tx(cx - 48, cy + 10, text, "lab big", "start"),
      { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  function cdrFourDevices(scene, t) {
    var cBus = sc(scene, 6, "bus"), cCook = sc(scene, 6, "cooking");
    var out = "", k;

    for (k = 0; k < 4; k++) {
      var cA = sc(scene, 2 + k, CDR_DEV[k].a), cB = sc(scene, 2 + k, CDR_DEV[k].b);
      var nextA = k < 3 ? sc(scene, 3 + k, CDR_DEV[k + 1].a) : null;
      var col = null;
      if (cdrPast(t, cBus) || cdrPast(t, cCook)) {
        if ((k === 0 && cdrPast(t, cBus)) || (k === 3 && cdrPast(t, cCook))) col = P.gold;
      } else if (cdrPast(t, cA) && !cdrPast(t, nextA)) col = P.gold;
      out += cdrDevTile(CDR_DEV_X[k], CDR_DEV[k], popIn(t, cA, 0.42), on(t, cB, 0.45), col);
    }

    out += MK.leader(330, 342, 190, 302, on(t, cBus == null ? null : cBus + 0.3, 0.45), P.gold);
    out += cdrCase(330, 372, "\u{1F68C}", "on the bus", popIn(t, cBus, 0.42));
    out += MK.leader(846, 342, 980, 302, on(t, cCook == null ? null : cCook + 0.3, 0.45), P.gold);
    out += cdrCase(846, 372, "\u{1F373}", "messy hands", popIn(t, cCook, 0.42));
    return out;
  }

  KINDS.device = function (scene, beat, t, i) {
    var toRow = into(t, scene.first + 2), out = "";
    if (toRow < 1) out += G(cdrWhatIsADevice(scene, t), { opacity: 1 - toRow });
    if (toRow > 0) out += G(cdrFourDevices(scene, t), { opacity: toRow });
    return svg(out);
  };

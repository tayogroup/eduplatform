
  /* ==== chapters: a skeleton outside, and using a key ==========================
     tools/lib/film-scenes/science-g4/backbone-or-not-3.js.

     "A skeleton outside" draws the course's own beetle seen from above
     (ART.figure("insect"), a Stage 3 drawing): its six legs are drawn, and so
     are their joints, so the case the film traces round the whole animal and
     the joints it marks are on the drawing itself, exact rather than
     invented. Lesson 2 has no figure, sim or scene step, so nothing here is
     ever tapped; the beetle is drawn because it is the course's own picture
     of an insect, the one this grade's child has already met. Then the
     lesson's four exoskeleton animals, and its snail, whose shell is
     neither.

     "Use a key" walks the lesson's own key (KEY in content/lesson-2.py), in
     its own words, over its own six-legged, wingless minibeast: legs? six?
     wings? - an ant. */

  /* ---- the lesson's beetle, placed --------------------------------------------- */
  var BN_BUG = { x: 300, y: 70, k: 480 / 360 };         /* 360 x 240 drawn at 480 x 320 */
  function bnBX(v) { return BN_BUG.x + v * BN_BUG.k; }
  function bnBY(v) { return BN_BUG.y + v * BN_BUG.k; }
  /* a closed line round the whole beetle - legs, antennae and wings inside it */
  var BN_CASE = "M50,125 C50,52 104,24 175,26 C256,24 322,54 322,125 C322,196 256,226 175,224 C104,226 50,198 50,125 Z";
  /* where the lesson draws the bend in each of the six legs */
  var BN_JOINTS = [[120, 70], [170, 59], [220, 70], [120, 180], [170, 191], [220, 180]];

  function bnCasePath(o, hard) {
    if (!(o > 0)) return "";
    return G(Pth(BN_CASE, hard > 0 ? "rgba(244,201,93," + n2(0.09 * hard) + ")" : null, P.gold, (6 + 4 * (hard || 0)) / BN_BUG.k),
      { transform: tr(BN_BUG.x, BN_BUG.y, BN_BUG.k), opacity: clamp(o, 0, 1) });
  }
  function bnBugCard(t, at) {
    var p = popIn(t, at, 0.5);
    return bnCard(288, 58, 504, 344, Math.min(1, p)) +
      MK.pop(ART.place(ART.figure("insect"), BN_BUG.x, BN_BUG.y, 480, 320), 540, 230, p);
  }

  /* ==== chapter: a skeleton outside ================================================= */

  /* beats 0, 1, 2 and 4 are one picture: the beetle in its case, with the marks
     of whichever line is being said. Each beat's own marks fade with the beat. */
  function bnBugPic(t, scene, k) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var cSome = c(0, "some"), cWear = c(0, "wear"), cOut = c(0, "outside");
    var cHard = c(1, "hard"), cWhole = c(1, "whole"), cJoint = c(1, "joints"), cBend = c(1, "bend");
    var cExo = c(2, "exo"), cMeans = c(2, "means");
    var cProt = c(4, "protects"), cMus = c(4, "muscles"), cIn = c(4, "inside");
    var out = bnBugCard(t, cSome);

    /* the case: it arrives on "on the outside" and stays for the chapter */
    var caseO = on(t, cOut, 0.6), hard = on(t, cHard, 0.6);
    out += MK.glow(bnBX(186), bnBY(125), 196, P.gold, caseO * (0.20 + 0.16 * bump(t, cWhole, 1.3) * 5));
    out += bnCasePath(caseO, hard);
    /* "wear their skeleton": an arrow from inside the body out to the case */
    out += MK.arrow(bnBX(200), bnBY(125), bnBX(316), bnBY(125), on(t, cWear, 0.6) * bnOnly(t, scene, 0), P.gold, 7);

    /* "with joints so it can bend": a dot on each leg's own bend, then the
       bend itself, opening and closing at the two front legs */
    var jn = tally(t, cJoint, 6, 0.7), jo = on(t, cJoint, 0.4) * bnFrom(t, scene, 1);
    for (var j = 0; j < jn && jo > 0; j++)
      out += C(bnBX(BN_JOINTS[j][0]), bnBY(BN_JOINTS[j][1]), 11, P.gold, P.ground, 3, { opacity: jo });
    var bend = on(t, cBend, 0.5) * bnOnly(t, scene, 1);
    if (bend > 0) {
      var sw = 0.4 + 0.6 * breathe(t);
      [0, 2].forEach(function (jj) {
        var x = bnBX(BN_JOINTS[jj][0]), y = bnBY(BN_JOINTS[jj][1]), a0 = -0.4, a1 = a0 + 1.5 * sw, r = 30;
        out += Pth("M" + n2(x + r * Math.cos(a0)) + "," + n2(y + r * Math.sin(a0)) +
          " A" + r + "," + r + " 0 0 1 " + n2(x + r * Math.cos(a1)) + "," + n2(y + r * Math.sin(a1)),
          null, P.gold, 5, { opacity: bend });
      });
    }

    /* "It protects them": four knocks stop dead at the case */
    var prot = on(t, cProt, 0.5) * bnOnly(t, scene, 4);
    if (prot > 0) {
      var knock = [[330, 120, 370, 145], [560, 70, 560, 112], [770, 300, 726, 288], [520, 400, 520, 362]];
      out += MK.glow(bnBX(186), bnBY(125), 196, P.good, prot * (0.5 + 0.5 * breathe(t)));
      knock.forEach(function (q, n) {
        var u = clamp((t - cProt - n * 0.12) / 0.45, 0, 1);
        out += MK.arrow(q[0], q[1], q[2], q[3], u * prot, P.good, 6);
        out += MK.ripple(q[2], q[3], t, cProt + n * 0.12 + 0.45, P.good);
      });
    }
    /* "their muscles pull on it from inside": four pulls, out onto the case */
    var mus = on(t, cMus, 0.5) * bnOnly(t, scene, 4);
    if (mus > 0) {
      var pull = [[170, 125, 74, 125], [170, 125, 175, 40], [230, 125, 310, 125], [190, 160, 200, 214]];
      pull.forEach(function (q, n) {
        out += MK.arrow(bnBX(q[0]), bnBY(q[1]), bnBX(q[2]), bnBY(q[3]),
          on(t, cMus + n * 0.1, 0.5) * mus, P.accent, 7);
      });
      out += Tx(540, 424, "muscles inside", "lab big", "middle", { fill: P.accent, opacity: on(t, cIn, 0.5) * mus });
    }

    /* the right-hand column: the words of the line being said, and no others */
    var o0 = bnOnly(t, scene, 0), o1 = bnOnly(t, scene, 1), o2 = bnOnly(t, scene, 2), o4 = bnOnly(t, scene, 4);
    if (o0 > 0) out += G(bnTag(t, 960, 150, "on the outside", cOut, [bnBX(322) + 6, bnBY(120)], true), { opacity: o0 });
    if (o1 > 0) out += G(MK.pill(960, 108, "a hard case", on(t, cHard, 0.4), { size: 30, col: P.gold }) +
      MK.pill(960, 200, "the whole body", on(t, cWhole, 0.4), { size: 30, col: P.gold }) +
      bnTag(t, 960, 330, "joints", cJoint, [bnBX(232), bnBY(70)], true), { opacity: o1 });
    if (o2 > 0) out += G(MK.pill(960, 130, "exoskeleton", on(t, cExo, 0.4), { size: 34, col: P.gold, ink: P.gold }) +
      Tx(960, 250, "exo means outside", "lab big gold", "middle", { opacity: on(t, cMeans, 0.5) }) +
      MK.arrow(900, 288, 752, 268, on(t, cMeans == null ? null : cMeans + 0.25, 0.5), P.gold, 6), { opacity: o2 });
    if (o4 > 0) out += G(MK.pill(960, 120, "it protects them", on(t, cProt, 0.4), { size: 28, col: P.good }) +
      MK.pill(960, 350, "muscles pull on it", on(t, cMus, 0.4), { size: 28, col: P.accent }), { opacity: o4 });
    return out;
  }

  /* the lesson's four animals that wear one */
  var BN_EXO_ROW = [
    { at: "insects", name: "insects", pic: null },
    { at: "spiders", name: "spiders", pic: "\u{1F577}️" },
    { at: "crabs", name: "crabs", pic: "\u{1F980}" },
    { at: "woodlice", name: "woodlice", pic: null }
  ];
  var BN_EXO_X = [146, 438, 730, 1022];
  function bnExoRowPic(t, scene) {
    var out = "", latest = -1;
    BN_EXO_ROW.forEach(function (a, k) { if (sc(scene, 3, a.at) != null && t >= sc(scene, 3, a.at)) latest = k; });
    BN_EXO_ROW.forEach(function (a, k) {
      var at = sc(scene, 3, a.at), p = popIn(t, at, 0.4);
      if (!(p > 0)) return;
      var x = BN_EXO_X[k], now = k === latest;
      var pic = a.pic || (k === 0 ? ART.ICONS.beetle : ART.ICONS.woodlouse);
      /* the kit's own drawings are near-black line work meant for a light page:
         each stands on a plate of its own, as the brief asks */
      var plate = a.pic ? "" : E(x, 196, 110, 102, "#EAF0F4");
      out += G(MK.pop(plate + MK.pic(x, 196, 186, pic), x, 196, p) +
        E(x, 196, 112, 104, "none", P.gold, 5, { opacity: Math.min(1, p) * (now ? 1 : 0.5) }) +
        MK.pill(x, 342, a.name, Math.min(1, p), { size: 27, col: now ? P.gold : P.line }),
        { opacity: now ? 1 : 0.6 });
    });
    out += Tx(584, 62, "a hard case over the whole body", "lab big gold", "middle",
      { opacity: on(t, sc(scene, 3, "insects"), 0.6) });
    return out;
  }

  /* the snail: a shell on its back, and a soft body that comes out of it */
  var BN_SNAIL = { x: 392, y: 212, s: 326 };
  function bnSnailPic(t, scene) {
    var cSnail = sc(scene, 5, "snail"), cDiff = sc(scene, 5, "different"),
      cNb = sc(scene, 5, "notback"), cNe = sc(scene, 5, "notexo");
    var cBody = sc(scene, 6, "body"), cOut = sc(scene, 6, "out"), cCover = sc(scene, 6, "cover");
    var S = BN_SNAIL, out = "", p = popIn(t, cSnail, 0.45);
    /* where the shell and the soft body sit in this emoji, measured off a
       sheet: the spiral is up and to the right, the head and foot come out of
       it to the left and along the bottom */
    var shell = [S.x + S.s * 0.19, S.y + S.s * 0.07], soft = [S.x - S.s * 0.28, S.y + S.s * 0.153];
    out += MK.pop(MK.pic(S.x, S.y, S.s, "\u{1F40C}"), S.x, S.y, p);
    /* the shell, ringed as it is called a shell */
    var so0 = on(t, cSnail == null ? null : cSnail + 0.2, 0.5) * bnFrom(t, scene, 5);
    out += E(shell[0], shell[1], S.s * 0.42, S.s * 0.43, "none", P.gold, 5, { opacity: so0 });
    out += MK.leader(478, 58, shell[0] + 8, shell[1] - S.s * 0.41, so0, P.gold);
    out += MK.pill(478, 34, "shell", so0, { size: 27, col: P.gold });

    /* beat 5: it is neither of the two skeletons the film has just shown */
    var o5 = bnOnly(t, scene, 5);
    if (o5 > 0) {
      var card = "";
      card += R(700, 34, 448, 168, 18, P.cell, P.line, 2, { opacity: on(t, cNb, 0.5) });
      card += bnGhostSpine([[750, 118], [922, 118]], 5, on(t, cNb, 0.8), 38, on(t, cNb, 0.5));
      card += Tx(1046, 128, "backbone", "lab big muted", "middle", { opacity: on(t, cNb, 0.5) });
      card += MK.cross(834, 118, 44, popIn(t, cNb == null ? null : cNb + 0.35, 0.4));
      card += R(700, 238, 448, 168, 18, P.cell, P.line, 2, { opacity: on(t, cNe, 0.5) });
      card += G(Pth(BN_CASE, null, P.muted, 8), { transform: "translate(760,276) scale(0.46)", opacity: on(t, cNe, 0.5) });
      card += Tx(1046, 332, "exoskeleton", "lab big muted", "middle", { opacity: on(t, cNe, 0.5) });
      card += MK.cross(846, 322, 44, popIn(t, cNe == null ? null : cNe + 0.35, 0.4));
      card += MK.glow(S.x, S.y, 200, P.gold, bump(t, cDiff, 1.2) * 0.9);
      out += G(card, { opacity: o5 });
    }

    /* beat 6: the soft body comes out of it, so the shell covers only the shell's part */
    var o6 = bnOnly(t, scene, 6);
    if (o6 > 0) {
      var six = "";
      six += E(soft[0], soft[1], S.s * 0.23, S.s * 0.38, "none", P.good, 5, { opacity: on(t, cBody, 0.5) });
      six += MK.pill(226, 404, "soft body", on(t, cBody, 0.5), { size: 27, col: P.good });
      six += MK.arrow(shell[0] - S.s * 0.18, shell[1] + S.s * 0.18, soft[0] + S.s * 0.06, soft[1] + S.s * 0.10,
        on(t, cOut, 0.7), P.good, 8);
      /* the whole animal, dashed, so the gold ring round the shell is plainly
         the smaller of the two: that is what "does not cover the whole body"
         means, and a second ring on the shell alone did not say it */
      six += E(S.x + 3, S.y + 2, S.s * 0.53, S.s * 0.52, "none", P.muted, 4,
        { opacity: on(t, cCover, 0.5), "stroke-dasharray": "13 9" });
      six += MK.pill(930, 120, "the shell covers", on(t, cCover, 0.5), { size: 30, col: P.gold });
      six += MK.pill(930, 196, "only part of it", on(t, cCover == null ? null : cCover + 0.2, 0.5), { size: 30, col: P.muted });
      six += MK.leader(930, 240, shell[0] + S.s * 0.43, shell[1] + 20, on(t, cCover == null ? null : cCover + 0.4, 0.6), P.muted);
      out += G(six, { opacity: o6 });
    }
    return out;
  }

  function bnExoChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 3) return svg(crossfade(t, i, scene, function (bi) {
      return bi - scene.first === 3 ? bnExoRowPic(t, scene) : bnBugPic(t, scene, bi - scene.first);
    }));
    if (k === 4) {
      var u = into(t, i);
      return svg(bnBugPic(t, scene, 4) + (u < 1 ? G(bnExoRowPic(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 5) {
      var v = into(t, i);
      return svg(bnSnailPic(t, scene) + (v < 1 ? G(bnBugPic(t, scene, 4), { opacity: 1 - v }) : ""));
    }
    if (k === 6) return svg(bnSnailPic(t, scene));
    return svg(bnBugPic(t, scene, k));
  }

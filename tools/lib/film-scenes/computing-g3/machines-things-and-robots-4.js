  /* ==== Machines, Things and Robots, part 4: a robot's own parts, and recap ====
     tools/lib/film-scenes/computing-g3/machines-things-and-robots-4.js. See the
     header of machines-things-and-robots.js.

     A robot arm, drawn once and pointed at one part at a time - the program
     that decides, the motors that move it, the sensors that tell it where it
     is, and the stop button a person presses. Each part stays visible once
     named, but dims to about a third once the next part takes its turn, the
     same rule Science's Bones and Muscles film used for one bone at a time.
     Then the recap: the lesson's own four ideas, as cards. */

  /* how bright a part is: full while it is the one just named, dimmed to
     about a third once the next part's cue arrives, gone before its own cue */
  function mtDim(t, shownAt, nextAt) {
    var e = on(t, shownAt, 0.4);
    if (e <= 0) return 0;
    var d = nextAt == null ? 0 : on(t, nextAt, 0.6);
    return e * (1 - d * 0.65);
  }

  var MT_ARM = { baseX: 240, baseY: 356, pivotX: 314, pivotY: 356, elbowX: 424, elbowY: 244, tipX: 560, tipY: 150 };

  function mtRobotPartsChapter(scene, beat, t, i) {
    var cProgram = sc(scene, 0, "programdecides"), cMove = sc(scene, 0, "movehereweld");
    var cMotors = sc(scene, 1, "motorsout1"), cMoveArm = sc(scene, 1, "movearm1");
    var cSensors = sc(scene, 2, "sensorsin1"), cTellWhere = sc(scene, 2, "tellwhere1");
    var cStop = sc(scene, 3, "stopbtn1"), cEveryStop = sc(scene, 3, "everymotorstops1");
    var cFactory = sc(scene, 4, "factoryrobot1"), cCompCtl = sc(scene, 4, "computercontrolling1"), cDoor2 = sc(scene, 4, "automaticdoor1");
    var A = MT_ARM, out = "";

    /* the arm itself, once there is a program to talk about. It swings a
       little further out as "move the arm" is said, and freezes - every
       motor at once - once the stop button is actually pressed. */
    var skel = on(t, cProgram, 0.5);
    if (skel > 0) {
      var freezeAmt = on(t, cEveryStop, 0.4) * (1 - into(t, scene.first + 4));
      var reach = 1 - 0.16 * freezeAmt + 0.05 * bump(t, cMoveArm, 1.0);
      var ex = A.baseX + (A.elbowX - A.baseX) * reach, ey = A.elbowY + (1 - reach) * 30;
      var tx = A.baseX + (A.tipX - A.baseX) * reach, ty = A.tipY + (1 - reach) * 40;
      out += G(R(A.baseX, A.baseY, 140, 40, 10, P.body, P.line, 3) +
        L(A.pivotX, A.pivotY, ex, ey, P.plastic, 14) + L(ex, ey, tx, ty, P.plastic, 12) +
        Pth("M" + n2(tx - 4) + "," + n2(ty) + " l-26,-20 M" + n2(tx + 4) + "," + n2(ty) + " l26,-20", null, P.dark, 8) +
        C(A.pivotX, A.pivotY, 16, P.dark, P.line, 3) + C(ex, ey, 13, P.dark, P.line, 3),
        { opacity: skel });
    }

    /* the program: a chip beside the base, deciding the moves */
    var pOp = mtDim(t, cProgram, cMotors);
    if (pOp > 0) {
      out += G(mtChip(150, 300, 46, 1) + MK.leader(174, 322, A.baseX + 10, A.baseY + 6, 1, P.gold), { opacity: pOp });
      out += MK.pill(150, 356, "the program", pOp, { size: 18, col: P.gold, ink: P.gold });
    }
    var mvp = popIn(t, cMove, 0.4) * (1 - into(t, scene.first + 1));
    if (mvp > 0) out += MK.pill(150, 250, "move, weld, move back", mvp, { size: 16, col: P.gold, ink: P.gold });

    /* the motors: the two joints, moving the arm where the program says */
    var motOp = mtDim(t, cMotors, cSensors);
    if (motOp > 0) {
      out += G(C(A.pivotX, A.pivotY, 22, "none", P.blue, 4) + C(A.elbowX, A.elbowY, 19, "none", P.blue, 4) +
        MK.leader(A.pivotX + 30, A.pivotY, 760, 130, 1, P.blue), { opacity: motOp });
      out += MK.pill(880, 130, "motors: outputs", motOp, { size: 20, col: P.blue, ink: P.blue });
    }

    /* the sensors: near the gripper, telling the program where the arm is -
       a dotted pulse travels back from the sensor to the base as it does */
    var senOp = mtDim(t, cSensors, cStop);
    if (senOp > 0) {
      var tx2 = A.baseX + (A.tipX - A.baseX), eyeX = tx2 + 30, eyeY = A.tipY - 6;
      out += G(C(eyeX, eyeY, 13, P.card, P.plum, 3) + C(eyeX, eyeY, 5, P.plum) +
        MK.leader(eyeX + 14, eyeY - 4, 860, 220, 1, P.plum), { opacity: senOp });
      out += MK.pill(980, 220, "sensors: inputs", senOp, { size: 20, col: P.plum, ink: P.plum, anchor: "end" });
      var tw = on(t, cTellWhere, 0.7);
      if (tw > 0 && tw < 1) out += C(lerp(eyeX, A.pivotX, tw), lerp(eyeY, A.pivotY, tw), 7, P.plum);
    }

    /* the stop button: a person's own input, by the base */
    var stopOp = mtDim(t, cStop, cFactory);
    if (stopOp > 0) {
      var pr = popIn(t, cStop, 0.35), hit = on(t, cEveryStop, 0.4);
      out += G(C(206, 372, 20, hit > 0 ? P.bad : P.card, P.bad, 3) +
        MK.leader(206, 392, 760, 310, 1, P.bad), { opacity: stopOp });
      out += MK.pop(Em(206, 372, 20, "\u{1F6D1}"), 206, 372, pr);
      out += MK.pill(880, 310, "the stop button: an input", stopOp, { size: 18, col: P.bad, ink: P.bad });
      if (hit > 0) out += C(206, 372, 20 + 14 * hit, "none", P.bad, 3, { opacity: 1 - hit });
    }

    /* the whole robot is a computer controlling a machine - a soft ring round
       the whole arm, and the chip that decides it all pulses once more */
    var fp = popIn(t, cFactory, 0.42);
    if (fp > 0) out += MK.glow((A.baseX + A.tipX) / 2, 230, 170, P.good, Math.min(1, fp) * 0.3);
    var ctlOp = bump(t, cCompCtl, 1.2);
    if (ctlOp > 0) out += C(150, 300, 38 + 8 * ctlOp, "none", P.good, 4, { opacity: 1 - ctlOp });

    /* just like the automatic door - in the one clear space left, between
       the arm and the label cluster, never on top of either */
    var dp = popIn(t, cDoor2, 0.42);
    if (dp > 0) {
      out += MK.pill(560, 356, "just like the automatic door", dp, { size: 17, col: P.good, ink: P.good });
      out += MK.glow(560, 400, 36, P.good, Math.min(1, dp) * 0.65);
      out += MK.pop(Em(560, 400, 40, "\u{1F6AA}"), 560, 400, dp);
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     Four of the lesson's own five words: control, the Internet of Things,
     manufacturing and robot. The last beat names both "sensors in" and
     "motors out", so the robot card's own picture reads both cues (the eye
     for the sensor, the gear for the motor) rather than only the first of
     them - recapKind's card pops in on one cue, but its pic may be a
     function of t, and that function can read the recap's own scene. */
  var MT_RECAP_SCENE = null;
  function mtRobotRecapPic(cx, cy, size, t) {
    var sn = MT_RECAP_SCENE;
    var cSen = sn ? sc(sn, 3, "sensorsin2") : null, cMot = sn ? sc(sn, 3, "motorsout2") : null;
    var sOn = Math.min(1, on(t, cSen, 0.35)), mOn = Math.min(1, on(t, cMot, 0.35));
    var out = "";
    if (sOn > 0) out += G(Em(cx - size * 0.26, cy, size * 0.52, "\u{1F441}️"), { opacity: sOn });
    if (mOn > 0) out += G(Em(cx + size * 0.26, cy, size * 0.52, "⚙️"), { opacity: mOn });
    return out;
  }
  var MT_RECAP = MK.recapKind([
    { beat: 0, at: "control4", title: "Control", sub: "a program decides", pic: "\u{1F3AE}" },
    { beat: 1, at: "iotcap1", title: "Internet of Things", sub: "connected, not clever", pic: "\u{1F310}" },
    { beat: 2, at: "factoryjobs1", title: "Manufacturing", sub: "making things in a factory", pic: "\u{1F3ED}" },
    { beat: 3, at: "sensorsin2", title: "Robot", sub: "sensors in, motors out", pic: mtRobotRecapPic }
  ], { goBeat: 3, goAt: "sensorsin2" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What a program controls", "What makes a thing part of the Internet of Things", "Why a factory uses robots, and what a robot is made of"] }),
    control: mtControlChapter, iot: mtIotChapter, line: mtLineChapter, why: mtWhyChapter,
    robotparts: mtRobotPartsChapter,
    recap: function (scene, beat, t, i) { MT_RECAP_SCENE = scene; return MT_RECAP(scene, beat, t, i); }
  };

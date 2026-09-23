  /* ==== chapters: sorting and the fact card, the beetle diagram, the recap =====
     tools/lib/film-scenes/science-g3/animal-groups-3.js.

     "Sort by the features" is the lesson's own group sorter: its six bins,
     its three tricky animals (the whale, the penguin and the bat, each with
     the feature that decides it), then its reptile-and-amphibian fact card,
     the secondary source the child reads two steps later.

     "Label a diagram" is the lesson's tap figure of a beetle
     (ART.figure("insect")) with the lesson's own six labels placed on it one
     at a time. Rule 3: the lesson's gold tap outline goes on the ONE part
     being named, and a part already named is shown by its label turning
     green - never by a second outline, because five of this figure's six
     outlines are boxes that would stack over each other and read as debug
     boxes (the fault the Bones and Muscles film shipped). */

  /* ---- the lesson's six bins, in its own order, with its own pictures ------ */
  var AG_BINS = [
    { label: "Fish", pic: "\u{1F420}" }, { label: "Amphibians", pic: ART.ICONS.tadpole },
    { label: "Reptiles", pic: "\u{1F98E}" }, { label: "Birds", pic: "\u{1F426}" },
    { label: "Mammals", pic: "\u{1F415}" }, { label: "Insects", pic: "\u{1F41C}" }
  ];
  var AG_BIN_X = [114, 302, 490, 678, 866, 1054];
  /* the three animals the lesson's sorter uses to break the "where it lives"
     habit, with the beat that sorts each and the bin it goes in */
  var AG_SORTED = [
    { k: 1, pic: "\u{1F40B}", bin: 4, why: "milk for its calf", why_at: "milk", group_at: "mammal", off: -30 },
    { k: 2, pic: "\u{1F427}", bin: 3, why: "feathers", why_at: "feathers", group_at: "bird", off: 0 },
    { k: 3, pic: "\u{1F987}", bin: 4, why: "fur and milk", why_at: "fur", group_at: "mammal", off: 30 }
  ];

  function agBin(k, o, ringO) {
    if (!(o > 0)) return "";
    var cx = AG_BIN_X[k], b = AG_BINS[k];
    return G(R(cx - 85, 316, 170, 112, 18, P.cell, P.line, 2) +
      R(cx - 85, 316, 170, 112, 18, "none", P.gold, 3, { opacity: clamp(ringO || 0, 0, 1) }) +
      MK.pic(cx, 356, 48, b.pic) + Tx(cx, 410, b.label, "lab mid muted", "middle"),
      { transform: around(cx, 372, Math.min(o, 1.08)), opacity: Math.min(1, o) });
  }

  function agSortPic(t, scene, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSort = c(0, "sort"), cSkin = c(0, "skin"), cLegs = c(0, "legs"), cFeeds = c(0, "feeds");
    var out = "", k = i - scene.first;

    AG_SORTED.forEach(function (a) {
      /* one that has already been sorted sits above its bin */
      if (k <= a.k) return;
      var bx = AG_BIN_X[a.bin] + a.off;
      out += MK.pic(bx, 284, 56, a.pic);
      out += MK.tick(bx + 32, 256, 15, 1);
    });
    AG_BINS.forEach(function (b, n) {
      var cur = AG_SORTED.filter(function (a) { return a.k === k && a.bin === n; })[0];
      out += agBin(n, popIn(t, cSort == null ? null : cSort + n * 0.13, 0.36),
        cur ? on(t, c(k, cur.group_at), 0.4) : 0);
    });

    /* the first line: what to ask about */
    var q = agOnly(t, scene, 0);
    [[250, cSkin, "skin?"], [584, cLegs, "legs?"], [918, cFeeds, "milk?"]].forEach(function (p) {
      out += MK.pill(p[0], 196, p[2], on(t, p[1], 0.4) * q, { size: 30, col: P.gold, fill: "#1B3A52" });
    });
    out += MK.qmark(584, 96, 40, on(t, cSort, 0.5) * q);

    /* the animal being sorted now, and the feature that decides it */
    var a0 = AG_SORTED.filter(function (a) { return a.k === k; })[0];
    if (a0) {
      var pc = c(k, a0.group_at === "mammal" && k === 3 ? "bat" : k === 1 ? "whale" : k === 2 ? "peng" : "bat");
      var pa = popIn(t, pc, 0.45), why = c(k, a0.why_at), gr = c(k, a0.group_at);
      out += MK.pop(MK.pic(584, 142, 132, a0.pic), 584, 142, pa);
      out += MK.pill(584, 240, a0.why, on(t, why, 0.4), { size: 26, col: P.gold, fill: "#1B3A52" });
      var bx = AG_BIN_X[a0.bin] + a0.off;
      out += MK.arrow(584, 272, bx, 306, on(t, gr, 0.6), P.gold, 8);
      out += MK.tick(bx + 56, 292, 20, popIn(t, gr == null ? null : gr + 0.45, 0.35));
    }
    return out;
  }

  /* the lesson's fact card: the three lines the child reads for the tricky ones */
  var AG_CARD_LINES = [
    "Reptiles have dry, scaly skin. Eggs on land.",
    "Amphibians have smooth, damp skin. Eggs in water.",
    "A crocodile has dry scales and lays its eggs on land."
  ];
  function agLookPic(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMix = c(4, "mix"), cLook = c(4, "look"), cCard = c(5, "card"), cSource = c(5, "source"), cWrote = c(5, "wrote");
    var cCroc = c(6, "croc"), cRivers = c(6, "rivers"), cDry = c(6, "dry"), cRept = c(6, "rept");
    var out = "", mix = agOnly(t, scene, 4), card = on(t, cCard, 0.6);

    /* "Some groups are easy to mix up" */
    if (mix > 0.004) {
      var m = "";
      m += MK.pop(MK.pic(330, 186, 152, "\u{1F98E}"), 330, 186, popIn(t, cMix, 0.42));
      m += MK.pop(MK.pic(838, 186, 152, "\u{1F438}"), 838, 186, popIn(t, cMix == null ? null : cMix + 0.25, 0.42));
      m += MK.pill(330, 300, "reptile?", on(t, cMix, 0.5), { size: 28, col: P.line });
      m += MK.pill(838, 300, "amphibian?", on(t, cMix, 0.5), { size: 28, col: P.line });
      m += MK.qmark(584, 200, 48, on(t, cMix == null ? null : cMix + 0.5, 0.5));
      m += MK.arrow(584, 330, 584, 396, on(t, cLook, 0.5), P.gold, 8);
      out += G(m, { opacity: mix });
    }

    /* the fact card itself */
    if (card > 0) {
      var k = "";
      k += R(140, 56, 890, 300, 20, P.paper);
      k += Tx(584, 108, "Reptiles and amphibians: what is the difference?", "lab big dark", "middle");
      k += L(190, 128, 980, 128, "#B9C0CC", 2);
      AG_CARD_LINES.forEach(function (line, n) {
        var o = on(t, cCard == null ? null : cCard + 0.25 + n * 0.22, 0.4);
        if (n === 2) o = on(t, cCroc, 0.4);
        if (o <= 0) return;
        if (n === 2) k += R(178, 246, 700, 38, 9, P.gold, null, null, { opacity: 0.32 * on(t, cDry, 0.5) });
        k += Tx(190, 178 + n * 48, line, "lab dark", "start", { opacity: o });
      });
      k += MK.pop(MK.pic(944, 228, 104, "\u{1F40A}"), 944, 228, popIn(t, cCroc, 0.45));
      k += MK.tick(944, 314, 22, popIn(t, cRept, 0.38));
      k += MK.glow(584, 266, 150, P.gold, bump(t, cRivers, 1.2) * 0.5);
      k += MK.pill(584, 398, "a secondary source", on(t, cSource, 0.45) * (1 - on(t, cWrote, 0.45)), { size: 28, col: P.gold, fill: "#1B3A52" });
      k += MK.pill(584, 398, "somebody else wrote it down", on(t, cWrote, 0.45), { size: 28, col: P.gold, fill: "#1B3A52" });
      out += G(k, { opacity: card });
    }
    return out;
  }

  function agSortChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 3) return svg(agSortPic(t, scene, i));
    if (k === 4) {
      var u = into(t, i);
      return svg(G(agSortPic(t, scene, scene.first + 3), { opacity: 1 - u }) + G(agLookPic(t, scene), { opacity: u }));
    }
    return svg(agLookPic(t, scene));
  }

  /* ---- label a diagram --------------------------------------------------------- */
  /* 360 x 240 drawn at 570 x 380. The beetle itself fills only the middle of
     its own viewBox (x 64-302, y 33-217), so at this size it reaches film
     x 400-777, y 92-384 and still clears the three labels down the left and
     the two down the right. */
  var AG_FIG = { x: 299, y: 40, k: 570 / 360 };
  function agFX(v) { return AG_FIG.x + v * AG_FIG.k; }
  function agFY(v) { return AG_FIG.y + v * AG_FIG.k; }
  /* the lesson's own six labels (INSECT in content/lesson-3.py), where each
     pill sits and where its line lands on the beetle */
  var AG_LABELS = [
    { part: "antennae", text: "antennae", x: 40, y: 110, anchor: "start", to: [agFX(76), agFY(68)], beat: 5, cue: "ant" },
    /* the head line lands on the front rim, where the leader's own end dot sits
       ON the gold outline. Landing it under the eyes instead put a third white
       dot in a row with the two the figure draws, and read as a third eye. */
    { part: "head", text: "head", x: 40, y: 240, anchor: "start", to: [agFX(100), agFY(125)], glow: [agFX(122), agFY(125)], beat: 2, cue: "head" },
    { part: "legs", text: "six legs", x: 40, y: 368, anchor: "start", to: [agFX(126), agFY(178)], beat: 3, cue: "legs" },
    { part: "wings", text: "wings", x: 1128, y: 130, anchor: "end", to: [agFX(272), agFY(74)], beat: 5, cue: "wings" },
    { part: "abdomen", text: "abdomen", x: 1128, y: 250, anchor: "end", to: [agFX(288), agFY(125)], beat: 4, cue: "abdomen" },
    { part: "thorax", text: "thorax", x: 570, y: 32, anchor: "middle", to: [agFX(170), agFY(96)], beat: 3, cue: "thorax" }
  ];

  /* "the eyes and the mouth": the beetle HAS two white eyes of its own
     (FIGURES.insect draws them at 112,118 and 112,132), so each is ringed as
     it is said. It has NO mouth drawn, and the film does not give it one. The
     lesson never says where an insect's mouth is - it says only "The head,
     with the eyes and the mouth" - so a mark placed at the front of the head
     would be the film claiming something the lesson does not. Two tries were
     looked at on the sheet first and both failed on their own account as well:
     an arc on the head's rim read as part of the gold outline 8 px away, and a
     dot beside the eyes read as a THIRD EYE at full size, the head being only
     about 70 px across here. So the mouth cue taps the head the lesson DOES
     draw: a ripple on its own outline, and the pool of light behind it.
     o fades all of it out with the beat. */
  function agFaceMarks(t, cEyes, cMouth, o) {
    if (!(o > 0)) return "";
    var out = "";
    [118, 132].forEach(function (ey, k) {
      var p = popIn(t, cEyes == null ? null : cEyes + k * 0.18, 0.32);
      if (p > 0) out += MK.pop(C(agFX(112), agFY(ey), 6.5 * AG_FIG.k, "none", P.gold, 3), agFX(112), agFY(ey), p);
    });
    /* The eyes are the lesson's own: ART.figure("insect") draws them, so the
       film rings what the child will tap. The MOUTH is named by the lesson
       ("The head, with the eyes and the mouth", content/lesson-3.py:11) and
       never placed by it, so on that word the whole HEAD lights instead of a
       mark the lesson does not draw - the same rule that took "at the front"
       out of the line (the lead, 2026-09-23). */
    out += MK.glow(agFX(112), agFY(126), 54 * AG_FIG.k, P.gold, bump(t, cMouth, 1.5) * 0.5);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function agDiagramChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDiag = c(0, "diagram"), cLabels = c(0, "labels"), cParts = c(0, "parts");
    var cModel = c(1, "model"), cBeetle = c(1, "beetle"), cBody = c(3, "body");
    var out = "", early = 1 - agFrom(t, scene, 2);

    /* when each label is said, and which part is being named right now */
    var at = {}, now = null, alpha = 0;
    AG_LABELS.forEach(function (lb) { at[lb.part] = c(lb.beat, lb.cue); });
    ["head", "thorax", "legs", "abdomen", "antennae", "wings"].forEach(function (p) {
      if (at[p] != null && t >= at[p]) { now = p; alpha = on(t, at[p], 0.35); }
    });
    /* "Six legs join there" keeps the outline on the thorax it is about */
    if (now === "legs") { now = "thorax"; alpha = 1; }

    /* a pool of light behind the part being named, rather than a second outline */
    AG_LABELS.forEach(function (lb) {
      var gp = lb.glow || [lb.to[0] + (lb.anchor === "end" ? -40 : 40), lb.to[1]];
      out += MK.glow(gp[0], gp[1], 86, P.gold, bump(t, at[lb.part], 1.6) * 0.85);
    });
    /* "You will label one of a beetle" */
    out += R(agFX(40), agFY(6), agFX(320) - agFX(40), agFY(232) - agFY(6), 28, "none", P.gold, 4,
      { opacity: on(t, cBeetle, 0.5) * early, "stroke-dasharray": "16 11" });
    out += agBeetle(now, alpha, AG_FIG.x, AG_FIG.y, 570, 380);
    out += agFaceMarks(t, c(2, "eyes"), c(2, "mouth"), agOnly(t, scene, 2));

    /* the two words the first lines teach */
    out += MK.pill(40, 40, "a diagram", on(t, cDiag, 0.45) * early, { size: 28, anchor: "start", col: P.gold, fill: "#1B3A52" });
    out += MK.pill(40, 106, "a kind of model", on(t, cModel, 0.45) * early, { size: 28, anchor: "start", col: P.teal, fill: "#123A40" });
    /* "labels that name the parts": a dot waiting at every label's place */
    AG_LABELS.forEach(function (lb, n) {
      var o = popIn(t, cLabels == null ? null : cLabels + n * 0.1, 0.3) * early * (1 - on(t, at[lb.part], 0.4));
      if (o > 0) out += C(lb.to[0], lb.to[1], 8, P.gold, null, null, { opacity: Math.min(1, o) * (0.45 + 0.55 * bump(t, cParts, 1.5)) });
    });

    /* the lesson's labels, one at a time: gold as it is said, green once done */
    AG_LABELS.forEach(function (lb) {
      var state = now === lb.part || (now === "thorax" && lb.part === "legs" && cBody != null && t >= at.legs) ? "now"
        : at[lb.part] != null && t >= at[lb.part] ? "done" : "";
      if (lb.part === now) state = "now";
      out += agLabel(t, lb.x, lb.y, lb.text, at[lb.part], lb.to, state, 30, lb.anchor);
    });
    /* the misconception the lesson names: the thorax is not the whole body */
    out += MK.pill(570, 410, "the body has three parts", on(t, cBody, 0.45) * agOnly(t, scene, 3), { size: 24, col: P.teal, fill: "#123A40" });
    return svg(out);
  }

  /* ---- what you now know -------------------------------------------------------
     One card per group, with the lesson's own key feature under it, word for
     word from the "Six groups of animals" step. */
  var AG_RECAP = MK.recapKind([
    { beat: 0, at: "fish", title: "Fish", sub: AG_GROUPS[0].sub, pic: AG_GROUPS[0].pic },
    { beat: 0, at: "amph", title: "Amphibians", sub: AG_GROUPS[1].sub, pic: AG_GROUPS[1].pic },
    { beat: 1, at: "rept", title: "Reptiles", sub: AG_GROUPS[2].sub, pic: AG_GROUPS[2].pic },
    { beat: 1, at: "bird", title: "Birds", sub: AG_GROUPS[3].sub, pic: AG_GROUPS[3].pic },
    { beat: 2, at: "mam", title: "Mammals", sub: AG_GROUPS[4].sub, pic: AG_GROUPS[4].pic },
    { beat: 2, at: "ins", title: "Insects", sub: AG_GROUPS[5].sub, pic: AG_GROUPS[5].pic }
  ], { goBeat: 3, goAt: "sort" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Six groups, and the features that mark each one", "Sort by features, not by where an animal lives", "Label a diagram of a beetle"] }),
    features: agFeaturesChapter, pair: agPairChapter, sort: agSortChapter,
    diagram: agDiagramChapter, recap: AG_RECAP
  };

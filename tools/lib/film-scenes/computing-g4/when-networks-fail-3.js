  /* ==== When Networks Fail, part 3: why anyone bothers, and the recap =========
     tools/lib/film-scenes/computing-g4/when-networks-fail-3.js. See the header
     of when-networks-fail.js.

     The lesson's own three examples of cybercrime, its own defence, and its
     own "a thief takes a laptop full of encrypted records - they have taken a
     brick" line, drawn without a criminal ever appearing: a hand takes the
     laptop, never a person, and nothing here is crossed out except that the
     laptop's own screen cannot be read. */

  var WNF_CRIME = { y: 54, h: 104, w: 320, gap: 40 };
  function wnfCrimeX(k) { return (1168 - 3 * WNF_CRIME.w - 2 * WNF_CRIME.gap) / 2 + k * (WNF_CRIME.w + WNF_CRIME.gap); }
  function wnfCrimeCard(k, pic, label, o) {
    if (!(o > 0)) return "";
    var x = wnfCrimeX(k), y = WNF_CRIME.y, w = WNF_CRIME.w, h = WNF_CRIME.h;
    var body = R(x, y, w, h, 18, "#2E2340", P.plum, 3) +
      Em(x + h * 0.5, y + h * 0.42, h * 0.5, pic) +
      Tx(x + w / 2, y + h * 0.84, label, "lab mid", "middle");
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function wnfCyberChapter(scene, beat, t, i) {
    var cCyber = sc(scene, 0, "cyber"), cThrough = sc(scene, 0, "through");
    var cSteal = sc(scene, 1, "steal"), cLock = sc(scene, 1, "lock");
    var cPretend = sc(scene, 2, "pretend"), cDefence = sc(scene, 2, "defence");
    var cThief = sc(scene, 3, "thief"), cBrick = sc(scene, 3, "brick");
    var cThere = sc(scene, 4, "there"), cSchools = sc(scene, 4, "schools");
    var out = "";

    var cyberO = on(t, cCyber, 0.5);
    if (cyberO > 0) out += Tx(584, 22, "Cybercrime", "lab mid", "middle", { fill: P.plum, opacity: cyberO });
    var through = on(t, cThrough, 0.4);
    if (through > 0) out += Tx(584, 44, "crime done through computers and networks", "lab small muted readable", "middle",
      { opacity: through });

    out += wnfCrimeCard(0, "\u{1F5C3}️", "stealing data", on(t, cSteal, 0.4));
    out += wnfCrimeCard(1, "\u{1F4B0}", "locking files, demanding money", on(t, cLock, 0.4));
    out += wnfCrimeCard(2, "\u{1F3E6}", "pretending to be a bank", on(t, cPretend, 0.4));

    var pDef = popIn(t, cDefence, 0.45);
    if (pDef > 0) {
      out += G(Em(584, 190, 62, "\u{1F6E1}️"), { transform: around(584, 190, Math.min(1.08, pDef)), opacity: Math.min(1, pDef) });
      out += Tx(584, 236, "encryption: the main defence", "lab mid", "middle", { fill: P.good, opacity: Math.min(1, pDef) });
    }

    /* the laptop, taken - and it is a brick */
    var lx = 300, ly = 344;
    var pThief = popIn(t, cThief, 0.45);
    if (pThief > 0) {
      out += G(Em(lx, ly, 92, "\u{1F4BB}"), { transform: around(lx, ly, Math.min(1.08, pThief)), opacity: Math.min(1, pThief) });
      out += Em(lx + 46, ly + 30, 34, "\u{1F512}", { opacity: Math.min(1, pThief) });
      out += G(Em(lx - 74, ly - 10, 40, "\u{1F590}️"), { opacity: Math.min(1, pThief) });
    }
    var pBrick = on(t, cBrick, 0.5);
    if (pBrick > 0) {
      out += Tx(500, ly - 4, "=", "lab huge", "middle", { fill: P.muted, opacity: pBrick });
      out += G(Em(600, ly, 82, "\u{1F9F1}"), { transform: around(600, ly, Math.min(1.08, popIn(t, cBrick, 0.4))), opacity: pBrick });
      out += Tx(600, ly + 76, "just a brick", "lab mid", "middle", { fill: P.good, opacity: pBrick });
    }
    if (wnfPast(t, cThere)) out += Tx(lx, ly - 92, "there, and unreadable", "lab mid", "middle",
      { fill: P.plum, opacity: on(t, cThere, 0.5) });

    var pSchool = on(t, cSchools, 0.5);
    if (pSchool > 0) {
      out += Em(880, ly - 6, 56, "\u{1F3E5}", { opacity: pSchool });
      out += MK.tick(908, ly - 44, 18, popIn(t, cSchools, 0.4));
      out += Em(1000, ly - 6, 56, "\u{1F3EB}", { opacity: pSchool });
      out += MK.tick(1028, ly - 44, 18, popIn(t, cSchools, 0.4));
      out += Tx(940, ly + 74, "hospitals and schools encrypt", "lab mid", "middle", { fill: P.good, opacity: pSchool });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------- */
  var WNF_RECAP = MK.recapKind([
    { beat: 0, at: "links", title: "Network failure", sub: "breaks the links, not the devices", pic: "\u{1F4F4}" },
    { beat: 1, at: "server", title: "The server", sub: "out of reach, so saved work waits", pic: "\u{1F5C4}️" },
    { beat: 2, at: "enc", title: "Encryption", sub: "scrambles data; the key unscrambles it", pic: "\u{1F512}" },
    { beat: 3, at: "padlock", title: "Look for the padlock", sub: "the main defence against cybercrime", pic: "\u{1F6E1}️" }
  ], { goBeat: 3, goAt: "cyber" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "The four things that can break a network",
      "What still works, and what needs another device",
      "Where encryption keeps data safe, and why"
    ] }),
    "break": wnfBreakChapter, stops: wnfStopsChapter, scramble: wnfScrambleChapter,
    where: wnfWhereChapter, cyber: wnfCyberChapter, recap: WNF_RECAP
  };

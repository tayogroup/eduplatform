  /* ==== Data Detectives, part 2 ==============================================
     The chapters "Asking a computer" and "Recording on a form". See
     data-detectives.js for the lists these draw from and for the naming rule.

     The apps are the lesson's own four ways of asking (weather app, map app,
     search the web, our class table) and every answer shown is the lesson's
     own result string. The form is drawn on the kit's own tablet
     (ART.figure "tablet"), because the lesson draws its form on a tablet too;
     the form itself is drawn here, since the kit keeps it in a closure. */

  /* ---- chapter: asking a computer ---------------------------------------- */

  var DD_APPS = [
    { id: "weather", pic: "\u{1F326}️", lines: ["Weather app"] },
    { id: "map", pic: "\u{1F5FA}️", lines: ["Map app"] },
    { id: "search", pic: "\u{1F50E}", lines: ["Search", "the web"] },
    { id: "table", pic: "\u{1F4CA}", lines: ["Our class", "table"] }
  ];
  var DD_ACARD = { w: 252, h: 206, y: 104, gap: 12 };
  function ddAppX(k) {
    var total = DD_APPS.length * DD_ACARD.w + (DD_APPS.length - 1) * DD_ACARD.gap;
    return (1168 - total) / 2 + k * (DD_ACARD.w + DD_ACARD.gap);
  }
  /* "Each kind a different way": every card takes a stripe of its own colour,
     one after another. The four cards are already on screen by then - the
     first cut drew a leader from the question mark to each of them, and over
     that distance the lines were all but horizontal and read as stray rules. */
  var DD_APPCOL = [P.blue, P.plum, P.gold, P.teal];
  function ddAppCard(k, p, lit, dimmed, t, at, tint) {
    if (!(p > 0)) return "";
    var a = DD_APPS[k], x = ddAppX(k), y = DD_ACARD.y, w = DD_ACARD.w, h = DD_ACARD.h;
    var out = ddCard(x, y, w, h, lit, 1);
    if (tint > 0) out += R(x + 18, y + 12, w - 36, 8, 4, DD_APPCOL[k], null, null, { opacity: clamp(tint, 0, 1) });
    out += MK.pic(x + w / 2, y + 70, 64, a.pic);
    a.lines.forEach(function (s, q) { out += Tx(x + w / 2, y + 146 + q * 34, s, "lab big", "middle"); });
    if (lit) out += MK.ripple(x + w / 2, y + 70, t, at, P.gold);
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(p, 1.08)),
      opacity: Math.min(1, p) * (dimmed ? 0.4 : 1) });
  }
  /* which app answers which of the chapter's beats, and what it answers -
     the lesson's own result lines */
  var DD_ASKS = [
    null,
    { beat: 1, app: 0, q: "Will it rain tomorrow?", pic: "☔", ask: "rain", tap: "weather", ans: "Tomorrow: rain in the afternoon." },
    { beat: 2, app: 1, q: "Which way is the park?", pic: "\u{1F333}", ask: "park", tap: "map", ans: "Turn left, then walk 5 minutes." },
    { beat: 3, app: 2, q: "How do you spell elephant?", pic: "\u{1F418}", ask: "spell", tap: "search", ans: "e-l-e-p-h-a-n-t" },
    { beat: 4, app: 3, q: "How many children in our class like apples?", pic: "\u{1F34E}", ask: "notknow", tap: "ourtable", ans: "Apples: 2 children." }
  ];
  function ddAskChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMany = c(0, "many"), cEach = c(0, "each");
    var cNot = c(4, "notknow");
    var out = "";

    /* which question is on screen, and which app is answering it */
    var here = i - scene.first;
    var a = DD_ASKS[here] || null;
    var cAsk = a ? c(a.beat, a.ask) : null, cTap = a ? c(a.beat, a.tap) : null;
    var lit = a && cTap != null && t >= cTap ? a.app : -1;

    DD_APPS.forEach(function (app, q) {
      out += ddAppCard(q, popIn(t, cMany == null ? null : cMany + q * 0.26, 0.42), lit === q, a != null && lit !== q, t, cTap,
        on(t, cEach == null ? null : cEach + q * 0.13, 0.35));
    });

    /* the first beat: the question that has many kinds */
    var first = ddOnly(t, scene, 0);
    if (first > 0) out += G(MK.glow(584, 58, 54, P.gold, on(t, cMany, 0.5) * 0.9) +
      MK.qmark(584, 50, 32, on(t, cMany, 0.4)), { opacity: first });

    /* the question being asked, and the answer that came back */
    if (a) {
      var qo = on(t, cAsk, 0.4), qw = a.q.length * 30 * 0.56 + 39;
      out += MK.pic(628 - qw / 2 - 34, 48, 46, a.pic, { opacity: qo });
      out += MK.pill(628, 48, a.q, qo, { size: 30, col: P.gold });
      var ao = on(t, cTap == null ? null : cTap + 0.3, 0.4);
      out += MK.pill(584, 374, a.ans, ao, { size: 26, col: P.good, ink: P.good });
      if (lit >= 0) out += MK.leader(ddAppX(lit) + DD_ACARD.w / 2, DD_ACARD.y + DD_ACARD.h + 6, 584, 352,
        on(t, cTap == null ? null : cTap + 0.15, 0.4), P.good);
    }

    /* the last beat: the web does not know about our class; our table does */
    if (here === 4) {
      out += MK.cross(ddAppX(2) + DD_ACARD.w - 26, DD_ACARD.y + 26, 24, popIn(t, cNot, 0.4));
      out += MK.tick(ddAppX(3) + DD_ACARD.w - 26, DD_ACARD.y + 26, 24, popIn(t, cTap, 0.4));
    }
    return svg(out);
  }

  /* ---- chapter: recording on a form --------------------------------------- */

  /* the kit's own tablet, and where its screen lands in the film's space */
  var DD_TAB = { x: 36, y: 32, h: 372 };
  DD_TAB.s = DD_TAB.h / 378;
  DD_TAB.w = 260 * DD_TAB.s;
  function ddTX(v) { return DD_TAB.x + v * DD_TAB.s; }
  function ddTY(v) { return DD_TAB.y + v * DD_TAB.s; }
  var DD_SCR = { x: ddTX(36), y: ddTY(44), w: 188 * DD_TAB.s, h: 270 * DD_TAB.s };
  var DD_FORM_ROW = { x: ddTX(44), w: 172 * DD_TAB.s, h: 36, pitch: 41, top: 44 };

  /* the form on the tablet's screen: the lesson's question, its four options,
     and Submit. `chosen` is the option the child has tapped, or null. */
  function ddFormOnTablet(t, chosen, cTap, cSubmit) {
    var out = ART.place(ART.figure("tablet"), DD_TAB.x, DD_TAB.y, DD_TAB.w, DD_TAB.h);
    var mid = DD_SCR.x + DD_SCR.w / 2;
    out += R(DD_SCR.x, DD_SCR.y, DD_SCR.w, DD_SCR.h, 6, P.ground);
    out += Tx(mid, DD_SCR.y + 26, "Favourite fruit?", "lab mid", "middle");
    DD_FRUIT.forEach(function (f, k) {
      var y = DD_SCR.y + DD_FORM_ROW.top + k * DD_FORM_ROW.pitch, on1 = chosen === f.id;
      out += R(DD_FORM_ROW.x, y, DD_FORM_ROW.w, DD_FORM_ROW.h, 9, on1 ? "#1B3A52" : P.cell, on1 ? P.gold : P.line, on1 ? 2.5 : 1.5);
      out += C(DD_FORM_ROW.x + 18, y + 18, 7, "none", on1 ? P.gold : P.muted, 2);
      if (on1) out += C(DD_FORM_ROW.x + 18, y + 18, 3.6, P.gold);
      out += MK.pic(DD_FORM_ROW.x + 44, y + 18, 20, f.pic);
      out += Tx(DD_FORM_ROW.x + 62, y + 25, f.label, "lab mid", "start");
      if (on1) out += MK.ripple(DD_FORM_ROW.x + 44, y + 18, t, cTap, P.gold);
    });
    var sy = DD_SCR.y + DD_SCR.h - 36;
    out += MK.pill(mid, sy, "Submit", 1, { size: 18, col: chosen ? P.teal : P.line, fill: chosen ? "#14414A" : P.card });
    if (cSubmit != null) out += MK.ripple(mid, sy, t, cSubmit, P.teal);
    return out;
  }

  function ddFormChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cForm = c(0, "form"), cInto = c(0, "into");
    var cAmal = c(1, "amal"), cTap = c(1, "tap"), cSubmit = c(1, "submit");
    var cSaid = c(2, "said"), cOwn = c(2, "own");
    var cSix = c(3, "six"), cKeeps = c(3, "keeps");
    var out = "";

    /* how many friends have been recorded by now */
    var rec = 0;
    if (cSubmit != null && t >= cSubmit + 0.3) rec = 1;
    var later = tally(t, cSix, DD_PEOPLE.length, 2.0);
    if (later > rec) rec = later;
    var counts = ddCounts(rec);

    /* the tablet, with Banana tapped from its own cue on */
    var chosen = cTap != null && t >= cTap ? "banana" : null;
    out += ddFormOnTablet(t, chosen, cTap, cSubmit);
    /* "A form": the screen rings */
    var fo = on(t, cForm, 0.45) * ddOnly(t, scene, 0);
    if (fo > 0) out += R(DD_SCR.x - 5, DD_SCR.y - 5, DD_SCR.w + 10, DD_SCR.h + 10, 9, "none", P.gold, 4, { opacity: fo });

    /* the table the form fills */
    var tab = ddFruitTable(380, 140, 740, t, 1, { rh: 48, rows: function (f) { return counts[f.id]; },
      lit: function (f) { return rec > 0 && rec <= DD_PEOPLE.length && DD_PEOPLE[rec - 1].answer === f.id && t < BEATS[scene.first + 2].start; } });
    var rule = ddOnly(t, scene, 2);
    out += G(tab.markup, { opacity: 1 - 0.86 * rule });
    /* "into a computer": from the form to the table */
    out += MK.arrow(ddTX(248), 268, 366, 268, on(t, cInto, 0.5) * ddOnly(t, scene, 0), P.gold, 7);

    /* the friend who is answering, and what they said */
    var one = ddOnly(t, scene, 1) + ddOnly(t, scene, 2);
    if (one > 0) {
      var p = DD_PEOPLE[0], po = on(t, cAmal, 0.45);
      out += G(MK.pic(408, 78, 74, p.pic, { opacity: po }) +
        MK.bubble(470, 26, 500, 82, "“" + p.say + "”", po, 440, 96) +
        Tx(408, 134, p.name, "lab mid", "middle", { opacity: po }),
        { opacity: clamp(one, 0, 1) });
    }
    /* whose data it is: what the person said, not what you like */
    if (rule > 0) {
      out += G(R(372, 214, 760, 200, 22, P.ground, P.line, 2) +
        MK.tick(470, 274, 26, popIn(t, cSaid, 0.4)) +
        MK.pill(800, 274, "What Amal said", on(t, cSaid, 0.4), { size: 28, col: P.good, ink: P.good }) +
        MK.cross(470, 358, 26, popIn(t, cOwn, 0.4)) +
        MK.pill(800, 358, "What you like", on(t, cOwn, 0.4), { size: 28, col: P.bad, ink: P.bad }),
        { opacity: rule });
    }
    /* all six friends, and every answer kept */
    var six = ddFrom(t, scene, 3);
    if (six > 0) {
      var row = "";
      DD_PEOPLE.forEach(function (q, k) {
        var o = popIn(t, cSix == null ? null : cSix + k * 0.3, 0.35);
        if (o <= 0) return;
        var x = 412 + k * 118;
        row += G(MK.pic(x, 62, 52, q.pic) + Tx(x, 108, q.name, "lab mid", "middle"),
          { transform: around(x, 70, Math.min(o, 1.08)), opacity: Math.min(1, o) });
      });
      out += G(row, { opacity: six });
      out += MK.glow(750, 288, 148, P.good, on(t, cKeeps, 0.6) * six * 0.8);
    }
    return svg(out);
  }


  /* ==== My Body and My Senses, part 2 =========================================
     "Your five senses" and "Your senses keep you safe", and three drawings
     part 3 uses too: a hand, the wisps that rise off bread or a hot drink, and
     smoke. */

  /* A hand with its fingers stretched wide, in the lesson child's skin colour.
     Local space: the palm is centred near (0, 5); MB_THUMB and MB_LITTLE are the
     tips of the thumb and the little finger, MB_SPAN apart: one hand span. */
  var MB_SKIN = "#C68642", MB_SKIN_EDGE = "#8A5A2B";
  var MB_FINGERS = [[-28, 12, -74, -12, 18], [-20, -20, -30, -70, 16], [-5, -24, -4, -78, 16], [10, -22, 22, -72, 16], [24, -14, 52, -52, 15]];
  var MB_THUMB = [-74, -12], MB_LITTLE = [52, -52];
  var MB_SPAN = Math.hypot(MB_LITTLE[0] - MB_THUMB[0], MB_LITTLE[1] - MB_THUMB[1]);
  var MB_SPAN_DEG = Math.atan2(MB_LITTLE[1] - MB_THUMB[1], MB_LITTLE[0] - MB_THUMB[0]) * 180 / Math.PI;
  function mbHand(x, y, s, rot, extra) {
    var out = "";
    MB_FINGERS.forEach(function (f) { out += L(f[0], f[1], f[2], f[3], MB_SKIN_EDGE, f[4] + 5); });
    out += R(-32, -24, 64, 58, 18, MB_SKIN, MB_SKIN_EDGE, 2.5);
    MB_FINGERS.forEach(function (f) { out += L(f[0], f[1], f[2], f[3], MB_SKIN, f[4]); });
    return G(out, Object.assign({ transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(rot || 0) + ") scale(" + n3(s) + ")" }, extra || {}));
  }
  /* where mbHand(x, y, s, rot) puts a point p of the hand's own space */
  function mbHandPt(p, x, y, s, rot) {
    var a = (rot || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
    return [x + s * (p[0] * c - p[1] * si), y + s * (p[0] * si + p[1] * c)];
  }

  /* three wavy strands rising off (x, y) from time `at`: a smell, or steam */
  function mbWisps(x, y, t, at, col, rise, drift) {
    if (at == null || t < at) return "";
    var out = "", fade = clamp((t - at) / 0.4, 0, 1);
    rise = rise || 80; drift = drift || 0;
    for (var k = 0; k < 3; k++) {
      var ph = ((t - at) / 1.5 + k / 3) % 1, x0 = x + (k - 1) * 18 + drift * ph, y0 = y - rise * ph;
      out += Pth("M" + n2(x0) + "," + n2(y0) + " q9,-9 0,-18 q-9,-9 0,-18 q9,-9 0,-18", null, col, 4,
        { opacity: fade * Math.sin(Math.PI * ph) });
    }
    return out;
  }
  /* smoke: puffs leaving (x, y) one after another, drifting by (dx, dy) */
  function mbSmoke(x, y, t, at, dx, dy) {
    if (at == null || t < at) return "";
    var out = "";
    for (var k = 0; k < 8; k++) {
      var age = t - at - k * 0.28;
      if (age < 0) continue;
      var ph = (age / 2.2) % 1;
      out += C(x + dx * ph + 9 * Math.sin(ph * 7 + k), y + dy * ph - 16 * Math.sin(ph * 3.1), 10 + 22 * ph, "#AAB7C4", null, null,
        { opacity: 0.62 * (1 - ph) * Math.min(1, age / 0.3) });
    }
    return out;
  }

  /* ==== chapter: your five senses ==============================================
     The child stays on the left. The five senses arrive as five cards, each
     with the part it uses. Then one sense a line: its part is outlined on the
     child (in the lens for the four on the face, as in the chapter before), a
     line runs from the sense's name to it, and the things that sense tells you
     about arrive as they are said. Touch is the skin, so the whole child glows;
     on "not only your hands" the hands are outlined, and on "all over you"
     taps land on the feet, the legs, the tummy, the arms and the head. */
  var MB_SENSES = [
    { word: "sight", part: "eyes", ring: "eyes" }, { word: "hearing", part: "ears", ring: "ears" },
    { word: "smell", part: "nose", ring: "nose" }, { word: "taste", part: "tongue", ring: "mouth" },
    { word: "touch", part: "skin", ring: null }
  ];
  var MB_SENSE_BOX = { x: 20, y: 4, s: 1.08 };
  var MB_SLENS = { x: 432, y: 164, r: 120, zoom: 1.9 };
  var MB_TABS_X = [604, 706, 833, 935, 1037];
  var MB_TAPS = [[130, 343], [110, 290], [130, 175], [44, 171], [130, 36]];

  function mbThing(cx, cy, size, pic, word, p) {
    if (!(p > 0)) return "";
    return MK.pop(MK.pic(cx, cy, size, pic), cx, cy, p) + Tx(cx, 390, word, "lab big", "middle", { opacity: Math.min(1, p) });
  }
  function mbShapes(cx, cy) {
    return C(cx - 58, cy, 24, P.bad) + R(cx - 22, cy - 22, 44, 44, 4, P.blue) +
      Pth("M" + n2(cx + 58) + "," + n2(cy - 26) + " L" + n2(cx + 84) + "," + n2(cy + 22) + " L" + n2(cx + 32) + "," + n2(cy + 22) + " Z", P.gold);
  }

  /* what the panel on the right shows during the chapter's k-th line */
  function mbSensePanel(scene, bi, t) {
    var k = bi - scene.first, out = "";
    var A = function (n) { return cue(bi, n); };
    if (k === 0) {
      MB_SENSES.forEach(function (s, j) {
        var cx = 405 + j * 170, p = popIn(t, A("five") == null ? null : A("five") + j * 0.25, 0.4);
        if (p <= 0) return;
        out += MK.pop(R(cx - 75, 60, 150, 300, 22, P.card, P.line, 2) + C(cx, 150, 56, "#1B3A52") + MK.pic(cx, 150, 78, MB_SENSE_PICS[j]) +
          Tx(cx, 260, s.word, "lab big", "middle"), cx, 210, p);
        out += Tx(cx, 312, s.part, "lab", "middle", { fill: P.gold, opacity: on(t, A("part") == null ? null : A("part") + j * 0.25, 0.35) });
      });
      return out;
    }
    var j = Math.min(k - 1, 4), s = MB_SENSES[j], head = on(t, A("sense") == null ? BEATS[bi].start : A("sense"), 0.4);
    out += G(C(650, 124, 46, "#1B3A52", P.gold, 3) + MK.pic(650, 126, 62, MB_SENSE_PICS[j]) +
      Tx(716, 140, s.word, "lab huge", "start", { fill: P.gold }), { opacity: head });
    if (k <= 4) {
      var pt = mbLensPt(MB_ANCHOR[s.ring].R, MB_SLENS.x, MB_SLENS.y, MB_SLENS.zoom);
      out += MK.leader(600, 124, pt[0], pt[1], on(t, A("part"), 0.35), P.gold);
    }
    if (k === 1) {
      out += mbThing(700, 296, 84, "\u{1F3A8}", "colours", popIn(t, A("a"), 0.4));
      var sp = popIn(t, A("b"), 0.4);
      if (sp > 0) out += MK.pop(mbShapes(890, 296), 890, 296, sp) + Tx(890, 390, "shapes", "lab big", "middle", { opacity: Math.min(1, sp) });
      var lp = popIn(t, A("c"), 0.4);
      if (lp > 0) out += MK.glow(1070, 290, 70, P.gold, 0.7 + 0.3 * breathe(t)) + mbThing(1070, 296, 84, "\u{1F4A1}", "light", lp);
    } else if (k === 2) {
      var loud = on(t, A("b"), 0.5), snd = A("a");
      out += G(MK.waves(686, 296, t, snd, { dir: Math.PI, spread: 1.1, reach: 70, period: 1.0 }), { opacity: 1 - loud });
      out += MK.waves(686, 296, t, A("b"), { dir: Math.PI, spread: 1.3, n: 4, reach: 150, period: 0.9 });
      out += MK.pop(MK.pic(740, 296, 84, "\u{1F941}"), 740, 296, popIn(t, snd, 0.4));
      out += Tx(740, 390, "loud", "lab big", "middle", { opacity: loud });
      out += G(MK.waves(986, 300, t, A("c"), { dir: Math.PI, spread: 0.8, n: 2, reach: 40, period: 1.4, col: P.muted }), { opacity: 0.7 });
      out += mbThing(1020, 296, 70, "\u{1F514}", "quiet", popIn(t, A("c"), 0.4));
    } else if (k === 3) {
      /* the smell drifts off towards the nose in the lens */
      out += mbWisps(740, 262, t, A("a"), P.gold, 60, -150) + mbThing(760, 300, 84, "\u{1F35E}", "bread", popIn(t, A("a"), 0.4));
      out += mbWisps(990, 262, t, A("b"), P.plum, 60, -150) + mbThing(1010, 300, 84, "\u{1F338}", "flowers", popIn(t, A("b"), 0.4));
    } else if (k === 4) {
      out += mbThing(700, 296, 84, "\u{1F36C}", "sweet", popIn(t, A("a"), 0.4));
      out += mbThing(880, 296, 84, "\u{1F9C2}", "salty", popIn(t, A("b"), 0.4));
      out += mbThing(1060, 296, 84, "\u{1F34B}", "sour", popIn(t, A("c"), 0.4));
    } else if (k === 5) {
      out += mbThing(662, 296, 80, "\u{1F375}", "hot", popIn(t, A("a"), 0.4));
      out += mbThing(816, 296, 80, "\u{1F9CA}", "cold", popIn(t, A("b"), 0.4));
      out += mbThing(968, 296, 80, "\u{1FAA8}", "rough", popIn(t, A("c"), 0.4));
      out += mbThing(1106, 296, 80, "\u{1F944}", "smooth", popIn(t, A("d"), 0.4));
    } else {
      var all = on(t, A("all"), 0.45);
      out += Tx(880, 300, "skin", "lab huge", "middle", { fill: P.gold, opacity: all, "font-size": 64 }) +
        Tx(880, 360, "all over you", "lab big", "middle", { opacity: on(t, A("all") == null ? null : A("all") + 0.3, 0.4) });
    }
    return out;
  }

  function sceneSenses(scene, beat, t, i) {
    var b = MB_SENSE_BOX, Ls = MB_SLENS, s0 = scene.first;
    var lensU = on(t, BEATS[s0 + 1].start - GAP, 0.6) * (1 - on(t, BEATS[s0 + 5].start - GAP, 0.5));
    var ring = null;
    for (var j = 0; j < 4; j++) { var pc = cue(s0 + 1 + j, "part"); if (pc != null && t >= pc) ring = MB_SENSES[j].ring; }
    var skin = cue(s0 + 5, "part"), hands = cue(s0 + 6, "hands"), tap = cue(s0 + 6, "skin");
    if (skin != null && t >= skin) ring = null;
    if (hands != null && t >= hands) ring = "hands";
    var fig = mbChild({ ring: ring });
    var out = mbSkinGlow(fig, b, on(t, skin, 0.6), "mbSkin") + mbPut(fig, b);
    /* taps from "Your skin" on, so the last has faded before the line ends */
    MB_TAPS.forEach(function (p, k) {
      var q = mbPt(b, p);
      out += MK.ripple(q[0], q[1], t, tap == null ? null : tap + k * 0.25, P.gold);
    });
    out += mbLens(fig, b, Ls.x, Ls.y, Ls.r, Ls.zoom, lensU, "mbSLens");
    /* the five senses as the lesson's chips: gold while it is the one being
       told, green once told */
    var tabs = into(t, s0 + 1);
    if (tabs > 0) MB_SENSES.forEach(function (s, j) {
      var told = cue(s0 + 1 + j, "sense"), next = j < 4 ? cue(s0 + 2 + j, "sense") : null;
      var st = told == null || t < told ? "" : next == null || t < next ? "now" : "found";
      out += mbChip(MB_TABS_X[j], 34, s.word, tabs, st, "start", 22);
    });
    out += crossfade(t, i, scene, function (bi) { return mbSensePanel(scene, bi, t); });
    return svg(out);
  }

  /* ==== chapter: your senses keep you safe =====================================
     The lesson's three: a car you hear coming, smoke you smell before you see
     the fire, a cup your skin feels is too hot. The three cards arrive on
     "about the world" and take their senses' names on "keep you safe"; then
     each plays on its own line. Its body part is marked as it is named, and the
     danger does what the line says: the car's sound arrives before the car,
     the smoke comes over the wall before the fire shows, and the hand touches
     the cup and comes away before it is burnt. */
  var MB_CARD_X = [4, 399, 794], MB_CARD_W = 370;
  var MB_SAFE_WORDS = ["hearing", "smell", "touch"];

  /* an organ close-up that is marked when it is named */
  function mbOrgan(cx, cy, pic, t, at) {
    var m = on(t, at, 0.35);
    return (m > 0 ? C(cx, cy, 66, "#1B3A52", P.gold, 5, { opacity: m }) : "") +
      G(MK.pic(cx, cy, 100, pic), { transform: around(cx, cy, 1 + 0.15 * bump(t, at, 0.6)) });
  }

  function mbSafeScene(c, x, t, bi) {
    var A = function (n) { return cue(bi, n); }, out = "";
    if (c === 0) {
      var car = A("car"), carX = lerp(x + 450, x + 262, inAt(t, car == null ? 1e9 : car, 1.5));
      out += R(x, 246, MB_CARD_W, 74, 0, "#2B3A4A") + L(x, 283, x + MB_CARD_W, 283, "#E9E4D6", 4, { "stroke-dasharray": "22 16" });
      out += MK.waves(Math.min(carX - 58, x + 352), 250, t, A("listen"), { dir: Math.PI, spread: 1.0, n: 3, reach: 150, period: 1.0 });
      out += MK.pic(carX, 262, 96, "\u{1F697}");
      out += mbOrgan(x + 80, 136, "\u{1F442}", t, A("ears"));
    } else if (c === 1) {
      var fire = A("fire");
      out += mbSmoke(x + 280, 188, t, A("smoke"), -165, -60);
      out += MK.pic(x + 280, lerp(262, 172, on(t, fire, 0.6)), 84, "\u{1F525}");
      out += MK.pic(x + 280, 272, 156, "\u{1F9F1}");
      out += mbOrgan(x + 80, 136, "\u{1F443}", t, A("nose"));
    } else {
      /* the fingers reach the cup just after "a cup", stay until "too hot",
         and come away */
      var skin = A("skin"), cupAt = A("cup"), hot = A("hot"), back = on(t, hot, 0.3);
      var reach = skin == null ? 0 : inAt(t, skin, Math.max(0.6, (cupAt == null ? skin + 1.2 : cupAt) - skin + 0.25));
      var hx = lerp(x + 70, x + 172, reach * (1 - back));
      out += R(x + 150, 300, 214, 14, 6, "#8A5A2B");
      var red = on(t, hot, 0.3);
      if (red > 0) out += MK.glow(x + 272, 250, 90, P.bad, red);
      out += mbWisps(x + 272, 210, t, A("cup"), red > 0.5 ? P.bad : "#E9E4D6", 34, 0) + MK.pic(x + 272, 256, 100, "☕");
      out += MK.glow(hx, 250, 70, P.gold, on(t, skin, 0.4)) + mbHand(hx, 250, 0.8, 90);
      out += Tx(x + 272, 92, "too hot", "lab big", "middle", { fill: P.bad, opacity: red });
      out += MK.tick(x + 70, 120, 26, popIn(t, A("burns"), 0.4));
    }
    return out;
  }

  function sceneSafe(scene, beat, t, i) {
    var s0 = scene.first, out = "", world = cue(s0, "world"), safe = cue(s0, "safe");
    for (var c = 0; c < 3; c++) {
      var x = MB_CARD_X[c], bi = s0 + 1 + c, p = popIn(t, world == null ? null : world + c * 0.2, 0.4);
      if (p <= 0) continue;
      var live = i === bi, waiting = i > s0 && i < bi;
      var card = R(x, 4, MB_CARD_W, 432, 22, live ? "#1B3A52" : P.card, live ? P.accent : P.line, live ? 3 : 2) +
        el("clipPath", { id: "mbCard" + c }, R(x + 4, 8, MB_CARD_W - 8, 340, 18)) +
        G(mbSafeScene(c, x, t, bi), { "clip-path": "url(#mbCard" + c + ")" }) +
        Tx(x + MB_CARD_W / 2, 404, MB_SAFE_WORDS[c], "lab big", "middle",
          { fill: live ? P.accent : P.ink, opacity: on(t, safe == null ? null : safe + c * 0.25, 0.35) });
      out += G(card, { opacity: Math.min(1, p) * (waiting ? 0.55 : 1), transform: around(x + MB_CARD_W / 2, 220, 0.94 + 0.06 * Math.min(p, 1.05)) });
    }
    return svg(out);
  }

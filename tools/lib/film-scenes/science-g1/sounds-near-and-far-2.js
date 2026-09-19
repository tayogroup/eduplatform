
  /* ==== Sounds Near and Far, part 2: "Sound is shaking" and "Near and far" == */

  /* ==== chapter: sound is shaking ==============================================
     The lesson's elastic band (its demo's first frame), stretched round two
     posts. A finger plucks it, it shakes so fast it blurs, and its sound
     spreads out of it. On the right, "shaking" makes "sound", and becomes the
     scientists' word, "vibrating". The hum is the lesson's own picture for it
     (the demo's speaking head), with a hand on the throat that shakes. Then a
     finger stops the band, and with the shaking the sound stops. */
  var SN_BAND = { x1: 150, x2: 590, y: 200, r: 21, mx: 370 };
  var SN_RUBBER = "#E9744F";

  function snBandShape(d, amp, t) {
    var a = SN_BAND, top = a.y - a.r, bot = a.y + a.r, out = "";
    var post = function (x) {
      return R(x - 9, a.y, 18, 104, 5, "#8C6A45", "#5E4328", 2) + C(x, a.y, 15, "#C9A36A", "#5E4328", 3);
    };
    out += L(90, a.y + 104, 650, a.y + 104, P.line, 5) + post(a.x1) + post(a.x2);
    out += Pth("M" + a.x1 + "," + bot + " A" + a.r + "," + a.r + " 0 0 1 " + a.x1 + "," + top +
      " L" + a.x2 + "," + top + " A" + a.r + "," + a.r + " 0 0 1 " + a.x2 + "," + bot, null, SN_RUBBER, 9);
    var strand = function (dd, op, w) {
      return Pth("M" + a.x1 + "," + bot + " Q" + a.mx + "," + n2(bot + 2 * dd) + " " + a.x2 + "," + bot, null, SN_RUBBER, w || 9, { opacity: op });
    };
    if (amp > 0.5) {
      /* shaking too fast to see: the band is a blur between its two extremes */
      for (var k = 0; k <= 8; k++) out += strand(amp * Math.cos(Math.PI * k / 8), 0.16, 8);
      out += strand(amp * Math.sin((t * 8.3) * 2 * Math.PI), 0.9, 9);
    } else out += strand(d, 1, 9);
    return out;
  }

  /* how far the plucked strand is pulled, the shaking's size, and the finger */
  function snBandState(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var pluck = c(0, "pluck"), rel = c(0, "shakes"), stop = c(4, "touch");
    var bot = SN_BAND.y + SN_BAND.r, st = { d: 0, amp: 0, finger: "" };
    if (pluck != null && t >= pluck - 0.3) {
      var reach = inAt(t, pluck - 0.3, 0.5), pull = inAt(t, pluck + 0.25, 0.5);
      var tipY = lerp(bot + 130, bot, reach) + 34 * pull;
      if (rel == null || t < rel) { st.d = 34 * pull; st.finger = MK.finger(SN_BAND.mx, tipY, reach); }
      else st.finger = MK.finger(SN_BAND.mx, lerp(bot + 34, bot + 150, inAt(t, rel, 0.4)), 1 - inAt(t, rel + 0.1, 0.35));
    }
    if (rel != null && t >= rel) {
      st.amp = 30 * (0.55 + 0.45 * Math.exp(-(t - rel) / 0.9));
      if (stop != null && t >= stop + 0.35) st.amp *= 1 - inAt(t, stop + 0.35, 0.3);
    }
    return st;
  }

  function snShakeBand(scene, t, k) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var st = snBandState(scene, t), out = "", a = SN_BAND;
    var rel = c(0, "shakes"), twang = c(1, "twang"), stop = c(4, "touch");
    /* the sound: faint as it starts to shake, full from "a twang", gone with the shaking */
    var until = stop == null ? null : stop + 0.35;
    var up = { dir: -Math.PI / 2, spread: 2.0, n: 3, period: 1.1, r0: 58, reach: 88, w: 6, until: until };
    var down = Object.assign({}, up, { dir: Math.PI / 2, r0: 60, reach: 50 });
    if (rel != null) {
      var soft = twang == null ? until : twang;
      out += G(snWaves(a.mx, a.y, t, rel + 0.1, Object.assign({}, up, { until: soft })) +
        snWaves(a.mx, a.y, t, rel + 0.1, Object.assign({}, down, { until: soft })), { opacity: 0.45 });
    }
    out += snWaves(a.mx, a.y, t, twang, up) + snWaves(a.mx, a.y, t, twang, down);
    out += snBandShape(st.d, st.amp, t);
    out += MK.pop(Tx(610, 104, "twang!", "lab huge gold", "middle"), 610, 90, popIn(t, twang, 0.4) * (k === 1 ? 1 : 1 - inAt(t, BEATS[scene.first + 2].start, 0.4)));
    /* "blurry": a word and a line to the blur */
    var blur = on(t, c(0, "blurry"), 0.45) * (k === 0 ? 1 : 1 - into(t, scene.first + 1));
    out += G(MK.leader(236, 370, 318, 250, on(t, c(0, "blurry"), 0.5), P.gold) + MK.pill(236, 390, "blurry", 1, { size: 26, col: P.gold }), { opacity: blur });
    out += st.finger;
    /* a finger stops it */
    var touch = c(4, "touch");
    if (touch != null && t >= touch - 0.3) {
      var fy = lerp(a.y + a.r + 140, a.y + a.r, inAt(t, touch - 0.3, 0.6));
      out += MK.finger(a.mx - 60, fy, inAt(t, touch - 0.3, 0.3));
    }
    return out;
  }

  /* the right-hand side: shaking makes sound; the word; no shaking, no sound */
  function snShakeWords(scene, t, k) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var x = 930, out = "";
    if (k === 1 || k === 2) {
      var made = c(1, "made"), word = c(2, "word"), vib = c(2, "vibrating");
      var gone = k === 2 ? 1 - on(t, word, 0.4) : 1;
      out += MK.pop(Tx(x, 136, "shaking", "lab huge", "middle", { fill: P.plum }), x, 124, popIn(t, made, 0.4));
      out += G(MK.arrow(x, 164, x, 236, on(t, made == null ? null : made + 0.35, 0.5), P.gold, 8) +
        MK.pop(Tx(x, 290, "sound", "lab huge gold", "middle"), x, 276, popIn(t, made == null ? null : made + 0.8, 0.4)), { opacity: gone });
      if (k === 2) {
        out += Tx(x, 214, "scientists say", "lab big muted", "middle", { opacity: on(t, word, 0.4) });
        out += MK.pop(Tx(x, 292, "vibrating", "lab huge", "middle", { fill: P.plum }), x, 278, popIn(t, vib, 0.4));
        out += MK.pop(MK.pic(x, 362, 70, "\u3030\uFE0F"), x, 362, popIn(t, vib == null ? null : vib + 0.2, 0.4));
      }
    }
    if (k === 4) {
      var ns = c(4, "noshake"), nz = c(4, "nosound");
      out += MK.pop(Tx(x, 136, "no shaking", "lab huge muted", "middle"), x, 124, popIn(t, ns, 0.4));
      out += MK.arrow(x, 164, x, 236, on(t, nz == null ? null : nz - 0.25, 0.4), P.line, 8);
      out += MK.pop(Tx(x, 290, "no sound", "lab huge", "middle"), x, 276, popIn(t, nz, 0.4));
      out += MK.cross(x, 350, 24, popIn(t, nz == null ? null : nz + 0.3, 0.35));
    }
    return out;
  }

  /* the hum: the lesson's speaking head (its demo's and its quiz's picture for
     a hum), on a light disc so its dark purple shows on the dark page. The
     glyph's neck ends just under its chin, so a hand at the throat would cover
     the mouth: the film gives it a neck and shoulders in its own purple
     (#4F327C, sampled from the glyph), and the hand rests on that throat. */
  var SN_HEAD = { x: 360, y: 190, s: 0.96, purple: "#4F327C" };
  function snHum(scene, t) {
    var c = function (name) { return sc(scene, 3, name); };
    var hum = c("hum"), hand = c("hand"), feel = c("feel");
    var cx = 360, cy = 214, H = SN_HEAD, out = "";
    var at = function (x, y) { return n2(H.x + x * H.s) + "," + n2(H.y + y * H.s); };
    out += '<clipPath id="snHumDisc">' + C(cx, cy, 178) + "</clipPath>" + C(cx, cy, 178, P.paper);
    out += G(Pth("M" + at(-112, 100) + " L" + at(-16, 100) + " L" + at(0, 178) + " L" + at(-124, 178) + " Z", H.purple) +
      E(H.x - 62 * H.s, H.y + 224 * H.s, 160 * H.s, 68 * H.s, H.purple), { "clip-path": "url(#snHumDisc)" });
    out += MK.pic(H.x, H.y, 250 * H.s, "\u{1F5E3}\uFE0F");
    out += snWaves(H.x + 96, H.y + 40, t, hum, { dir: 0, spread: 1.1, n: 3, period: 1.0, r0: 44, reach: 96, w: 6 });
    out += MK.pop(Tx(cx + 330, cy - 70, "hmmm", "lab huge gold", "middle"), cx + 330, cy - 84, popIn(t, hum, 0.4));
    /* the hand slides to the throat; from "feel it shaking" it shakes */
    var hx = H.x + 12, hy = H.y + 150, u = on(t, hand, 0.6);
    var jig = feel != null && t >= feel ? 4 * Math.sin((t - feel) * 2 * Math.PI * 11) : 0;
    if (u > 0) {
      out += G(MK.pic(0, 0, 92, "\u270B"), { transform: tr(lerp(cx + 300, hx, u) + jig, lerp(cy + 150, hy, u)), opacity: Math.min(1, u * 2) });
    }
    var f = on(t, feel, 0.4);
    if (f > 0) {
      for (var s = -1; s <= 1; s += 2) {
        for (var m = 0; m < 2; m++) {
          var rr = 64 + m * 18 + 6 * Math.sin((t - feel) * 2 * Math.PI * 3 + m);
          out += Pth("M" + n2(hx + s * rr * Math.cos(0.5)) + "," + n2(hy - rr * Math.sin(0.5)) +
            " A" + n2(rr) + "," + n2(rr) + " 0 0 " + (s > 0 ? 1 : 0) + " " + n2(hx + s * rr * Math.cos(0.5)) + "," + n2(hy + rr * Math.sin(0.5)),
            null, P.gold, 5, { opacity: f * (1 - m * 0.35) });
        }
      }
      out += MK.leader(cx + 322, cy + 150, hx + 96, hy + 20, on(t, feel, 0.5), P.gold) +
        MK.pop(MK.pill(cx + 330, cy + 170, "shaking", 1, { size: 28, col: P.gold, anchor: "start" }), cx + 400, cy + 170, popIn(t, feel, 0.4));
    }
    return out;
  }

  function snShake(scene, beat, t, i) {
    var k = i - scene.first, out = "";
    var pic = function (kk) { return kk === 3 ? snHum(scene, t) : snShakeBand(scene, t, kk) + snShakeWords(scene, t, kk); };
    /* the hum is its own picture; the band's picture carries on round it */
    var u = into(t, i);
    if ((k === 3 || k === 4) && u < 1) out += G(pic(k - 1), { opacity: 1 - u }) + G(pic(k), { opacity: u });
    else out += pic(k);
    return svg(out);
  }

  /* ==== chapter: near and far ===================================================
     The lesson's experiment in the lesson's own drawing, ART.sim("soundFar",
     "draw", steps): the bell, and the child who steps away from it. Each time
     the bell is rung its sound leaves it as a ring, the SAME ring every time,
     which fades as it spreads: its brightness at each step is the lesson's own
     number (SN_GAIN), what the lesson's loudness meter shows, and the meter
     here reads it when the ring reaches the child. From "the same", a second
     meter shows the bell itself, which never gets quieter.

     The lesson's drawing is 344 wide. It was 320, and at six steps the child ran
     past the right edge (its ink ends at x 324.8) and was cut in half; this
     film found that and reframed its own copy to 344, and on 2026-09-19 the
     lesson itself was widened to match, so the film now uses the drawing as it
     is. The child slides between steps as the lesson's own 400 ms ease does,
     and the bell swings. */
  var SN_FAR = { x: 20, y: 30, k: 1.9, w: 344, h: 200 };
  function snFarAt(sx, sy) { return [SN_FAR.x + sx * SN_FAR.k, SN_FAR.y + sy * SN_FAR.k]; }
  var SN_BELL = snFarAt(57.5, 121.5);                 /* the bell's ink, measured: x 33.8-81.2, y 96-147 */
  function snKidX(steps) { return SN_FAR.x + (98.8 + 34 * steps) * SN_FAR.k; }   /* the child's ink centre */
  var SN_KID_Y = SN_FAR.y + 122.9 * SN_FAR.k;
  var SN_STEP = 34 * SN_FAR.k, SN_NEAR = (98.8 - 57.5) * SN_FAR.k;
  var SN_RING_R0 = 48, SN_RING_V = 300, SN_RING_SLOW = 170;
  var SN_FAR_BELL = '<text x="22" y="140" font-size="52">\u{1F514}</text>';

  function snFarSvg(steps, pos, swing) {
    var m = ART.sim("soundFar", "draw", steps);
    var fixes = [
      /* the lesson's drawing is as wide as this film places it */
      ['viewBox="0 0 ' + SN_FAR.w + ' 200"', 'viewBox="0 0 ' + SN_FAR.w + ' 200"'],
      /* the child, at its place between two steps; the lesson's own 400 ms
         transition is left out, because a film moves nothing by itself */
      ['<text x="' + (66 + steps * 34) + '" y="140" font-size="48" style="transition: x 400ms ease">', '<text x="' + n2(66 + pos * 34) + '" y="140" font-size="48">'],
      [SN_FAR_BELL, '<g transform="rotate(' + n2(swing) + ' 57.5 98)">' + SN_FAR_BELL + "</g>"]
    ];
    fixes.forEach(function (f) {
      if (m.indexOf(f[0]) < 0) throw new Error("sounds-near-and-far: the lesson's soundFar drawing no longer contains " + f[0] +
        ". The film places that drawing at its width, moves its child and swings its bell; look at the drawing again before changing this.");
      m = m.replace(f[0], f[1]);
    });
    return m;
  }

  /* where the child is (steps, for the drawing's words; pos, for where it is
     drawn), and every time the bell is rung, with where the child stood */
  function snFarPlan(scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var moves = [], rings = [];
    var step = c(1, "step"), going = c(2, "going");
    if (step != null) moves.push({ at: step, to: 1 });
    if (going != null) for (var s = 2; s <= 6; s++) moves.push({ at: going + (s - 2) * 0.56, to: s });
    var add = function (at, steps, slow) { if (at != null) rings.push({ at: at, steps: steps, slow: !!slow }); };
    add(c(0, "ring"), 0);
    add(c(1, "again"), 1);
    if (going != null) for (var s2 = 2; s2 <= 6; s2++) add(going + (s2 - 2) * 0.56 + 0.3, s2);
    var same = c(3, "same");
    add(same, 6); add(same == null ? null : same + 1.3, 6); add(c(3, "not"), 6);
    add(c(4, "way"), 6, true);
    add(c(5, "further"), 6);
    rings.forEach(function (r) {
      var v = r.slow ? SN_RING_SLOW : SN_RING_V;
      r.v = v;
      r.arrive = r.at + (SN_NEAR + r.steps * SN_STEP - 30 - SN_RING_R0) / v;
    });
    return { moves: moves, rings: rings };
  }

  function snFarKid(plan, t) {
    var steps = 0, pos = 0;
    plan.moves.forEach(function (mv) {
      if (t < mv.at) return;
      steps = mv.to;
      pos = lerp(mv.to - 1, mv.to, ease((t - mv.at) / 0.4));
    });
    return { steps: steps, pos: pos };
  }

  /* one ring of the bell: two circles, the second just behind the first,
     bright at the bell and fading, step by step, as the lesson's numbers do */
  function snFarRing(t, r) {
    var out = "";
    for (var k = 0; k < 2; k++) {
      var age = t - r.at - k * 0.13;
      if (age < 0) continue;
      var rad = SN_RING_R0 + r.v * age;
      if (rad > 760) continue;
      var g = snGain((rad - SN_NEAR) / SN_STEP), op = (0.16 + 0.84 * g) * clamp(age / 0.08, 0, 1) * (k ? 0.7 : 1);
      out += C(SN_BELL[0], SN_BELL[1], rad, "none", "#0B1D2C", 3 + 9 * g + 4, { opacity: 0.22 * op }) +
        C(SN_BELL[0], SN_BELL[1], rad, "none", P.gold, 3 + 9 * g, { opacity: op });
    }
    return out;
  }

  /* the lesson's loudness meter: quiet on the left, loud on the right */
  function snMeter(x, y, w, v, pic, label, o, hot) {
    if (!(o > 0)) return "";
    var h = 38, out = MK.pic(x - 44, y + h / 2, 54, pic) + Tx(x, y - 14, label, "lab mid muted", "start");
    out += R(x, y, w, h, h / 2, P.card, hot ? P.gold : P.line, 2 + 2 * (hot || 0));
    if (v > 0) out += R(x + 4, y + 4, Math.max(h - 8, (w - 8) * v), h - 8, (h - 8) / 2, "url(#snMeterFill)");
    out += Tx(x, y + h + 28, "quiet", "lab mid muted", "start") + Tx(x + w, y + h + 28, "loud", "lab mid muted", "end");
    return G(out, { opacity: o });
  }

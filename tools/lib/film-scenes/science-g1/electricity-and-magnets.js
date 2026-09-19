
  /* ==== Grade 1 Science, Lesson 7: Electricity and Magnets =====================
     tools/lib/film-scenes/science-g1/electricity-and-magnets.js, -2.js and -3.js:
     the pictures of the lesson's unit lecture film, joined into one script
     between the shared engine's head and tail, after the shared marks (MK) and
     the lesson kit's own drawings (ART). See
     science/grade-1-app/lecture-video/BRIEF.md.

     Where the lesson draws a thing, the film draws the lesson's picture: the
     magnet experiment is ART.magnet, the kit's own drawing stands in for the
     emoji too new for old devices (the wooden block), and the lesson's other
     things are its own emoji through MK.pic. Three are drawn here instead,
     because the lesson's emoji shows something else on this machine:
       - the paperclip: Windows draws U+1F4CE with eyes (EM_CLIP);
       - kitchen foil: the lesson gives it U+1F9EF, which is a fire
         extinguisher, so the kit's own "foil" drawing is used (EM_FOIL);
       - the fridge: the lesson gives it U+1F9CA, an ice cube (emFridge).
     The electric things that have to switch on and off (the lamp on its
     table, the socket and plug, the torch and its batteries, the wall switch)
     are drawn so that they can.

     This part: the chapters' colours, the drawings the chapters share, and the
     title motif. -2 draws "What needs electricity", "Where it comes from" and
     "Three safety rules"; -3 "What a magnet does", "Iron and steel", the recap
     and KINDS. Every name here starts "em" or "EM_", so none can replace one
     of the engine's. */

  var HUE = {
    title: P.teal, needs: P.gold, source: P.blue, safety: P.accent,
    magnet: P.plum, steel: P.good, recap: P.teal
  };

  /* the paperclip, as a 64 x 64 drawing that ART.magnet and MK.pic both take */
  var EM_CLIP_D = "M27 22 V45 A5 5 0 0 0 37 45 V14 A8 8 0 0 0 21 14 V49 A11 11 0 0 0 43 49 V21";
  var EM_CLIP = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="' + EM_CLIP_D + '" fill="none" stroke="#4E5B68" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + EM_CLIP_D + '" fill="none" stroke="#D3DBE3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* the kit's own drawing of kitchen foil */
  var EM_FOIL = ART.ICONS.foil;

  /* Soft light: MK.glow's stacked discs read as grey plates on the dark cards,
     so a thing that is on sits in a radial halo. Every drawing that uses one
     puts EM_DEFS first. */
  function emGrad(id, col) {
    return '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + col + '" stop-opacity="0.62"/>' +
      '<stop offset="0.5" stop-color="' + col + '" stop-opacity="0.2"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>';
  }
  var EM_DEFS = "<defs>" + emGrad("emHaloGold", "#F4C95D") + emGrad("emHaloGood", "#4FD1A0") + emGrad("emHaloWhite", "#FFF6D6") + "</defs>";
  function emHalo(cx, cy, r, which, o) {
    if (!(o > 0)) return "";
    return C(cx, cy, r, "url(#" + (which || "emHaloGold") + ")", null, null, { opacity: Math.min(1, o) });
  }

  /* a thing with its power off: grey and dim, d from 0 (on) to 1 (off) */
  function emDark(markup, d) {
    if (!(d > 0)) return markup;
    return G(markup, { style: "filter:grayscale(" + n2(d) + ") brightness(" + n2(1 - 0.5 * d) + ")" });
  }

  /* a small snowflake: the fridge is cold */
  function emSnow(cx, cy, r, col, o) {
    var out = "";
    for (var k = 0; k < 3; k++) {
      var a = k * Math.PI / 3, dx = r * Math.cos(a), dy = r * Math.sin(a);
      out += L(cx - dx, cy - dy, cx + dx, cy + dy, col, r * 0.24);
    }
    return G(out, { opacity: o });
  }

  /* a fridge, s tall, centred on (cx, cy); cold 0..1 lights its snowflake */
  function emFridge(cx, cy, s, cold) {
    var w = s * 0.58, x = cx - w / 2, y = cy - s / 2, split = y + s * 0.36, sw = Math.max(2, s * 0.03);
    return R(x, y, w, s, s * 0.08, "#EEF3F7", "#8FA3B3", sw) +
      L(x + sw, split, x + w - sw, split, "#8FA3B3", sw) +
      R(x + w - s * 0.13, y + s * 0.1, s * 0.045, s * 0.16, s * 0.02, "#6B7F90") +
      R(x + w - s * 0.13, split + s * 0.08, s * 0.045, s * 0.3, s * 0.02, "#6B7F90") +
      R(x + s * 0.06, y + s - sw, s * 0.08, s * 0.05, 2, "#6B7F90") + R(x + w - s * 0.14, y + s - sw, s * 0.08, s * 0.05, 2, "#6B7F90") +
      emSnow(x + s * 0.17, y + s * 0.18, s * 0.08, "#4F86D9", 0.3 + 0.7 * (cold || 0));
  }

  /* a light bulb, its glass radius r centred on (cx, cy); lit 0..1 */
  function emBulb(cx, cy, r, lit) {
    var g = clamp(lit || 0, 0, 1), out = "";
    if (g > 0) {
      out += emHalo(cx, cy, r * 1.75, "emHaloGold", g);
      [180, 215, 250, 290, 325, 360].forEach(function (deg) {
        var a = deg * Math.PI / 180;
        out += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, cx + Math.cos(a) * r * (1.3 + 0.38 * g), cy + Math.sin(a) * r * (1.3 + 0.38 * g), P.gold, r * 0.11, { opacity: g });
      });
    }
    var neck = "M" + n2(cx - r * 0.56) + "," + n2(cy + r * 0.78) + " L" + n2(cx - r * 0.4) + "," + n2(cy + r * 1.22) +
      " L" + n2(cx + r * 0.4) + "," + n2(cy + r * 1.22) + " L" + n2(cx + r * 0.56) + "," + n2(cy + r * 0.78) + " Z";
    out += Pth(neck, "#DDE6EE", "#8FA3B3", r * 0.05) + C(cx, cy, r, "#DDE6EE", "#8FA3B3", r * 0.05);
    if (g > 0) out += Pth(neck, "#FFE38A", null, null, { opacity: g }) + C(cx, cy, r, "#FFE38A", P.goldDeep, r * 0.05, { opacity: g });
    /* the filament: two wires up from the base, and a little coil between them */
    var fc = g > 0.5 ? "#C07A00" : "#8FA3B3", coil = "M" + n2(cx - r * 0.24) + "," + n2(cy + r * 0.05);
    for (var q = 0; q < 4; q++) coil += " q" + n2(r * 0.06) + "," + n2(-r * 0.2) + " " + n2(r * 0.12) + ",0";
    out += L(cx - r * 0.24, cy + r * 0.8, cx - r * 0.24, cy + r * 0.05, fc, r * 0.05) + L(cx + r * 0.24, cy + r * 0.8, cx + r * 0.24, cy + r * 0.05, fc, r * 0.05) +
      Pth(coil, null, fc, r * 0.07);
    for (var k = 0; k < 3; k++) out += R(cx - r * 0.44, cy + r * (1.22 + k * 0.2), r * 0.88, r * 0.16, r * 0.06, k === 2 ? "#56626E" : "#8C97A3");
    return out;
  }

  /* a table lamp standing on (bx, by); s = 1 is 196 px tall; glow 0..1 */
  function emLamp(bx, by, s, glow) {
    var g = clamp(glow || 0, 0, 1), top = by - 196 * s, rim = by - 128 * s, out = "";
    if (g > 0) {
      out += emHalo(bx, rim - 24 * s, 150 * s, "emHaloGold", g) +
        Pth("M" + n2(bx - 60 * s) + "," + n2(rim) + " L" + n2(bx + 60 * s) + "," + n2(rim) + " L" + n2(bx + 116 * s) + "," + n2(by) +
        " L" + n2(bx - 116 * s) + "," + n2(by) + " Z", P.gold, null, null, { opacity: 0.3 * g });
    }
    return out + R(bx - 5 * s, rim, 10 * s, by - rim - 12 * s, 3 * s, "#8FA3B3") +
      R(bx - 44 * s, by - 16 * s, 88 * s, 16 * s, 8 * s, "#6B7F90", "#4E5B68", 2) +
      C(bx, rim - 2 * s, 17 * s, g > 0.5 ? "#FFE8A3" : "#C9D1D9", g > 0.5 ? P.gold : "#8FA3B3", 2) +
      Pth("M" + n2(bx - 36 * s) + "," + n2(top) + " L" + n2(bx + 36 * s) + "," + n2(top) + " L" + n2(bx + 62 * s) + "," + n2(rim) +
        " L" + n2(bx - 62 * s) + "," + n2(rim) + " Z", g > 0.5 ? "#FBE3A8" : "#D9C08A", "#A07E3A", 3 * s);
  }

  /* a wall socket with two holes, s wide, centred on (cx, cy); lit 0..1 */
  function emSocket(cx, cy, s, lit) {
    return emHalo(cx, cy, s * 1.15, "emHaloGold", lit) +
      R(cx - s / 2, cy - s / 2, s, s, s * 0.16, "#F4F6F8", "#9AA7B4", Math.max(2, s * 0.04)) +
      C(cx, cy, s * 0.33, "#E4E9EE", "#C3CCD5", Math.max(1.5, s * 0.025)) +
      C(cx - s * 0.14, cy, s * 0.065, "#33404C") + C(cx + s * 0.14, cy, s * 0.065, "#33404C");
  }

  /* a plug that fits a socket s wide, its body centred on (cx, cy); pins 0..1 is
     how much of its two pins shows (0 once it is pushed in). Its lead leaves
     from (cx, cy + s / 4). */
  function emPlug(cx, cy, s, pins) {
    var w = s * 0.46, h = s * 0.5, out = "", pl = s * 0.26 * clamp(pins, 0, 1);
    if (pl > 0.5) out += R(cx - s * 0.17, cy - h / 2 - pl, s * 0.06, pl + 4, s * 0.02, "#C9D1D9", "#8C97A3", 1) +
      R(cx + s * 0.11, cy - h / 2 - pl, s * 0.06, pl + 4, s * 0.02, "#C9D1D9", "#8C97A3", 1);
    return out + R(cx - w / 2, cy - h / 2, w, h, s * 0.1, "#3F4E5C", "#C3CCD5", Math.max(2, s * 0.035)) +
      L(cx - w * 0.26, cy - h * 0.08, cx + w * 0.26, cy - h * 0.08, "#6B7F90", Math.max(1, s * 0.025)) +
      L(cx - w * 0.26, cy + h * 0.12, cx + w * 0.26, cy + h * 0.12, "#6B7F90", Math.max(1, s * 0.025));
  }
  /* a lamp's lead: light enough to see on the dark cards */
  var EM_CABLE = "#A9B6C2";

  /* a battery lying down, its left end at (x, cy), w x h; lit 0..1 */
  function emCell(x, cy, w, h, lit) {
    return (lit > 0 ? R(x - 5, cy - h / 2 - 5, w + 16, h + 10, h / 2, P.gold, null, null, { opacity: 0.35 * lit }) : "") +
      R(x + w, cy - h * 0.22, w * 0.07, h * 0.44, 2, "#C9D1D9") +
      R(x, cy - h / 2, w, h, h * 0.28, "#4FAE5A", "#256030", Math.max(1.5, h * 0.07)) +
      R(x + w * 0.7, cy - h / 2, w * 0.3, h, h * 0.28, "#2F7A3A") +
      L(x + w * 0.2, cy, x + w * 0.4, cy, "#FFFFFF", h * 0.12) + L(x + w * 0.3, cy - h * 0.2, x + w * 0.3, cy + h * 0.2, "#FFFFFF", h * 0.12);
  }

  /* a torch pointing right; the left end of its body at (x, y), y its middle.
     lit 0..1 lights the bulb and the beam, which reaches beam px; xray 0..1
     opens a window on the two batteries inside it */
  function emTorch(x, y, lit, xray, beam) {
    var out = "", g = clamp(lit || 0, 0, 1), bx = x + 214, hx = x + 256;
    if (g > 0) out += Pth("M" + n2(hx) + "," + n2(y - 26) + " L" + n2(hx + beam) + "," + n2(y - 80) + " L" + n2(hx + beam) + "," + n2(y + 80) +
      " L" + n2(hx) + "," + n2(y + 26) + " Z", P.gold, null, null, { opacity: 0.32 * g }) + emHalo(hx + 8, y, 64, "emHaloWhite", g);
    out += R(x, y - 28, bx - x + 4, 56, 18, "#3F6E91", "#1F4260", 3) +
      L(x + 14, y - 28, x + 14, y + 28, "#1F4260", 3) + L(x + 22, y - 28, x + 22, y + 28, "#1F4260", 3) +
      Pth("M" + n2(bx) + "," + n2(y - 28) + " L" + n2(bx + 30) + "," + n2(y - 42) + " L" + n2(hx) + "," + n2(y - 42) +
        " L" + n2(hx) + "," + n2(y + 42) + " L" + n2(bx + 30) + "," + n2(y + 42) + " L" + n2(bx) + "," + n2(y + 28) + " Z", "#3F6E91", "#1F4260", 3) +
      E(hx, y, 9, 37, g > 0.5 ? "#FFF1B8" : "#C9D6E0", "#1F4260", 2) +
      R(x + 170, y - 37, 30, 11, 4, P.accent);
    if (xray > 0) out += G(R(x + 34, y - 20, 150, 40, 10, "#0B1D2C") + emCell(x + 40, y, 60, 26, g) + emCell(x + 112, y, 60, 26, g), { opacity: xray });
    return out;
  }

  /* a wall light switch, s tall, centred on (cx, cy); up 1 is on, 0 is off */
  function emSwitch(cx, cy, s, up) {
    var w = s * 0.72, u = clamp(up, 0, 1), ly = cy + s * 0.2 - s * 0.4 * u;
    return R(cx - w / 2, cy - s / 2, w, s, s * 0.14, "#F4F6F8", "#9AA7B4", 2) +
      R(cx - w * 0.16, cy - s * 0.3, w * 0.32, s * 0.6, s * 0.08, "#C3CCD5") +
      R(cx - w * 0.22, ly - s * 0.12, w * 0.44, s * 0.24, s * 0.08, u > 0.5 ? "#FFFFFF" : "#DDE3E9", "#8C97A3", 2) +
      C(cx, cy - s * 0.4, s * 0.05, P.gold, null, null, { opacity: 0.25 + 0.75 * u });
  }

  /* a bottle of glue, s tall, standing on (cx, by) */
  function emGlue(cx, by, s) {
    return R(cx - s * 0.3, by - s * 0.72, s * 0.6, s * 0.72, s * 0.1, "#F4F6F8", "#9AA7B4", 2) +
      R(cx - s * 0.3, by - s * 0.5, s * 0.6, s * 0.24, 0, "#6E9DE8") +
      Pth("M" + n2(cx - s * 0.3) + "," + n2(by - s * 0.7) + " Q" + n2(cx - s * 0.3) + "," + n2(by - s * 0.86) + " " + n2(cx - s * 0.12) + "," + n2(by - s * 0.86) +
        " L" + n2(cx + s * 0.12) + "," + n2(by - s * 0.86) + " Q" + n2(cx + s * 0.3) + "," + n2(by - s * 0.86) + " " + n2(cx + s * 0.3) + "," + n2(by - s * 0.7) + " Z",
        "#F4F6F8", "#9AA7B4", 2) +
      Pth("M" + n2(cx - s * 0.13) + "," + n2(by - s * 0.86) + " L" + n2(cx + s * 0.13) + "," + n2(by - s * 0.86) + " L" + n2(cx + s * 0.03) + "," + n2(by - s * 1.02) +
        " L" + n2(cx - s * 0.03) + "," + n2(by - s * 1.02) + " Z", "#E9744F", "#B5532F", 2);
  }

  /* the danger-of-electricity sign: a yellow triangle with a black lightning bolt */
  function emHazard(cx, cy, s) {
    var h = s * 0.87;
    return Pth("M" + n2(cx) + "," + n2(cy - h * 0.6) + " L" + n2(cx + s / 2) + "," + n2(cy + h * 0.4) + " L" + n2(cx - s / 2) + "," + n2(cy + h * 0.4) + " Z",
        "#F4C95D", "#1B1B1B", s * 0.06) +
      Pth("M" + n2(cx + s * 0.07) + "," + n2(cy - h * 0.34) + " L" + n2(cx - s * 0.12) + "," + n2(cy + h * 0.06) + " L" + n2(cx + s * 0.01) + "," + n2(cy + h * 0.06) +
        " L" + n2(cx - s * 0.07) + "," + n2(cy + h * 0.32) + " L" + n2(cx + s * 0.14) + "," + n2(cy - h * 0.06) + " L" + n2(cx + s * 0.02) + "," + n2(cy - h * 0.06) + " Z", "#1B1B1B");
  }

  /* a horseshoe magnet, poles down; the centre of its bend at (cx, cy), s its outer radius */
  function emHorseshoe(cx, cy, s) {
    var ri = s * 0.45, yb = cy + s * 0.95, tip = s * 0.34, x0 = cx - s, x1 = cx - ri, x2 = cx + ri, x3 = cx + s;
    var d = "M" + n2(x0) + "," + n2(yb) + " V" + n2(cy) + " A" + n2(s) + "," + n2(s) + " 0 0 1 " + n2(x3) + "," + n2(cy) + " V" + n2(yb) +
      " H" + n2(x2) + " V" + n2(cy) + " A" + n2(ri) + "," + n2(ri) + " 0 0 0 " + n2(x1) + "," + n2(cy) + " V" + n2(yb) + " Z";
    return Pth(d, "#E5484D", "#A8323A", s * 0.05) +
      R(x0, yb - tip, s - ri, tip, 0, "#DCE2E8", "#8C97A3", s * 0.04) + R(x2, yb - tip, s - ri, tip, 0, "#DCE2E8", "#8C97A3", s * 0.04) +
      Pth("M" + n2(cx - s * 0.74) + "," + n2(cy) + " A" + n2(s * 0.74) + "," + n2(s * 0.74) + " 0 0 1 " + n2(cx - s * 0.2) + "," + n2(cy - s * 0.71),
        null, "#FFFFFF", s * 0.08, { opacity: 0.35 });
  }

  /* dots that flow along a path (a function u 0..1 -> [x, y]) from t0: a train
     that runs out from the start, then keeps coming */
  function emFlow(path, t, t0, speed, n, r, col, o) {
    if (t0 == null || t < t0 || !(o > 0)) return "";
    var phase = (t - t0) * speed, out = "";
    for (var k = 0; k < n; k++) {
      var u = phase - k / n;
      if (u < 0) continue;
      var p = path(u % 1);
      out += C(p[0], p[1], r, col, null, null, { opacity: o });
    }
    return out;
  }

  /* a polyline drawn frac of its way, as a path's d */
  function emPolyD(pts, frac) {
    var s = polyLen(pts) * clamp(frac, 0, 1), d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]);
    for (var k = 1; k < pts.length; k++) {
      var seg = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (s >= seg) { d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]); s -= seg; continue; }
      var u = seg ? s / seg : 0;
      d += " L" + n2(lerp(pts[k - 1][0], pts[k][0], u)) + "," + n2(lerp(pts[k - 1][1], pts[k][1], u));
      break;
    }
    return d;
  }

  /* a cubic curve and a point on it */
  function emCubic(a, b, c, d) {
    return {
      d: "M" + n2(a[0]) + "," + n2(a[1]) + " C" + n2(b[0]) + "," + n2(b[1]) + " " + n2(c[0]) + "," + n2(c[1]) + " " + n2(d[0]) + "," + n2(d[1]),
      at: function (u) {
        var v = 1 - u;
        return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
                v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
      }
    };
  }

  /* ==== the title motif ========================================================
     The lesson in one picture: a switch and the lamp it lights, and a magnet
     pulling a paperclip up to it. In the spoken title the switch is pressed on
     "Press a switch" and goes on just before "the lamp lights up", the bulb
     brightens again on "Electricity"; the magnet's pull reaches across the gap
     on "pulls a paperclip", and the clip jumps up to it on "does not even have
     to touch". On the cards, all of it has happened. */
  function titleMotif(o) {
    var t = o.t || 0, lit = 1, pull = 1, up = 1, press = null, zap = 0, reach = 0;
    if (o.scene) {
      var lampAt = sc(o.scene, 0, "lamp");
      press = sc(o.scene, 0, "switch");
      up = on(t, lampAt == null ? null : lampAt - 0.25, 0.2);
      lit = on(t, lampAt, 0.4);
      zap = bump(t, sc(o.scene, 0, "elec"), 0.8);
      pull = on(t, sc(o.scene, 1, "touch"), 0.35);
      reach = on(t, sc(o.scene, 1, "pulls"), 0.4) * (1 - pull);
    }
    var cy = lerp(314, 256, pull), lines = "";
    /* the pull, across the gap: dashes that run up from the clip to the poles */
    if (reach > 0) for (var k = -1; k <= 1; k++) lines += L(256 + k * 24, 244, 256 + k * 24, 292, P.gold, 4,
      { opacity: reach, "stroke-dasharray": "7 7", "stroke-dashoffset": n2((t * 40) % 14) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A switch, the lamp it lights, and a magnet pulling a paperclip">' + EM_DEFS +
      Pth("M73,268 C100,268 108,252 108,216", null, EM_CABLE, 5) + emSwitch(50, 268, 64, up) +
      (press != null ? MK.ripple(50, 268, t, press + 0.1, P.gold) : "") +
      G(emBulb(108, 116, 54, lit * (0.88 + 0.12 * breathe(t))), { transform: around(108, 150, 1 + 0.06 * zap) }) +
      emHorseshoe(256, 176, 62) + lines +
      G(MK.pic(256, cy, 86, EM_CLIP), { transform: "rotate(90 256 " + n2(cy) + ")" }) +
      "</svg>";
  }

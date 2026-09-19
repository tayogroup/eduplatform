  /* ==== marks shared by every film ============================================
     tools/lib/ehel-film-marks.js. A storyboard lists it first in
     renderer.scenes, so it sits between the engine's head and the film's own
     pictures, in the same scope: it uses the head's svg helpers and palette,
     and every film that uses it ticks, crosses, points and recaps alike.

     Everything is one object, MK, so a film's own function of the same name
     can never replace one of these without anybody noticing. Like the rest of
     a film, every mark is a pure function of the time it is given.

       MK.tick(cx, cy, r, p)  MK.cross(cx, cy, r, p, col)  MK.qmark(cx, cy, r, o)
                                  a round mark that pops in as p goes 0 -> 1
       MK.pop(markup, cx, cy, p)  any markup, popped in about (cx, cy)
       MK.ripple(x, y, t, at, col)  a tap: a ring that spreads and fades
       MK.finger(x, y, op)        a pointing finger whose tip is at (x, y)
       MK.pic(cx, cy, size, pic, extra)
                                  an emoji, or one of the lesson's <svg> drawings,
                                  centred on (cx, cy); a Science film gets the
                                  kit's own drawing for an emoji too new for old
                                  devices, as the lesson does
       MK.arrow(x1, y1, x2, y2, u, col, w)
                                  an arrow that grows from (x1, y1) to (x2, y2)
       MK.leader(x1, y1, x2, y2, u, col)
                                  a line that draws itself, ending in a dot
       MK.waves(x, y, t, at, o)   sound spreading from (x, y) while it plays
       MK.glow(cx, cy, r, col, o) a soft pool of light
       MK.pill(x, y, text, o, opt) a word in a rounded box
       MK.bubble(x, y, w, h, text, o, tx, ty)
                                  a speech bubble whose tail points at (tx, ty)
       MK.list(x, y, rows, t, opt) rows that appear as they are said, each
                                  with a tick or a cross when it is decided
       MK.titleKind(opt)          the spoken title chapter, as a KINDS entry
       MK.recapKind(cards, opt)   the "what you now know" chapter, as a KINDS entry
  */
  var MK = (function () {
    function tick(cx, cy, r, p) {
      if (!(p > 0)) return "";
      return G(C(cx, cy, r, "rgba(79,209,160,0.22)", P.good, r * 0.12) +
        Pth("M" + n2(cx - r * 0.42) + "," + n2(cy + r * 0.02) + " L" + n2(cx - r * 0.1) + "," + n2(cy + r * 0.34) +
          " L" + n2(cx + r * 0.46) + "," + n2(cy - r * 0.32), null, P.good, r * 0.2),
        { transform: around(cx, cy, p), opacity: Math.min(1, p) });
    }

    function cross(cx, cy, r, p, col) {
      if (!(p > 0)) return "";
      col = col || P.bad;
      var d = r * 0.36;
      return G(C(cx, cy, r, "rgba(240,128,111,0.18)", col, r * 0.12) +
        L(cx - d, cy - d, cx + d, cy + d, col, r * 0.2) + L(cx + d, cy - d, cx - d, cy + d, col, r * 0.2),
        { transform: around(cx, cy, p), opacity: Math.min(1, p) });
    }

    function qmark(cx, cy, r, o) {
      if (!(o > 0)) return "";
      return G(C(cx, cy, r, P.cell, P.line, 2) + Tx(cx, cy + r * 0.42, "?", "lab muted", "middle", { "font-size": r * 1.2 }), { opacity: o });
    }

    function pop(markup, cx, cy, p) {
      if (!(p > 0)) return "";
      return G(markup, { transform: around(cx, cy, p), opacity: Math.min(1, p) });
    }

    function ripple(x, y, t, at, col) {
      if (at == null || t < at || t > at + 0.8) return "";
      var u = (t - at) / 0.8;
      return C(x, y, 8 + 36 * u, "none", col || P.ink, 1 + 4 * (1 - u), { opacity: 1 - u }) +
        (u < 0.3 ? C(x, y, 11, col || P.ink, null, null, { opacity: 0.55 * (1 - u / 0.3) }) : "");
    }

    function finger(x, y, op) {
      if (!(op > 0)) return "";
      return G(Em(x + 5, y + 27, 50, "\u{1F446}"), { opacity: op });
    }

    function pic(cx, cy, size, p, extra) {
      var s = String(p == null ? "" : p);
      if (typeof ART === "object" && ART && ART.icon) s = ART.icon(s);
      /* markup around one of the kit's drawings (the lesson's zoom scene gives
         its country as <span><svg ...></span>): draw the drawing. Anything else
         starting with "<" would break the film's svg, so it is refused. */
      if (s.charAt(0) === "<" && s.slice(0, 4) !== "<svg") {
        var inner = s.match(/<svg[\s\S]*<\/svg>/);
        if (!inner) throw new Error("MK.pic: markup with no drawing in it: " + s.slice(0, 40));
        s = inner[0];
      }
      if (s.slice(0, 4) === "<svg") {
        var body = s.replace(/ width="1em" height="1em"/, "").replace(/ style="vertical-align:[^"]*"/, "");
        return G('<svg x="' + n2(cx - size / 2) + '" y="' + n2(cy - size / 2) + '" width="' + n2(size) + '" height="' + n2(size) + '"' + body.slice(4), extra);
      }
      return Em(cx, cy, size, s, extra);
    }

    /* The head never reaches back past the tail: while the arrow is still short
       the head shrinks with it (it used to hang behind the tail, and poked out
       of the box for a few frames when a tail sat near the edge). */
    function arrow(x1, y1, x2, y2, u, col, w) {
      if (!(u > 0)) return "";
      col = col || P.gold; w = w || 8;
      var ex = lerp(x1, x2, u), ey = lerp(y1, y2, u), a = Math.atan2(y2 - y1, x2 - x1);
      var len = Math.hypot(ex - x1, ey - y1);
      if (len < 1) return "";
      var h = Math.min(w * 2.6, len * 0.7);
      var bx = ex - Math.cos(a) * h * 0.8, by = ey - Math.sin(a) * h * 0.8;
      return L(x1, y1, bx, by, col, w) +
        Pth("M" + n2(ex) + "," + n2(ey) +
          " L" + n2(ex - Math.cos(a) * h - Math.sin(a) * h * 0.62) + "," + n2(ey - Math.sin(a) * h + Math.cos(a) * h * 0.62) +
          " L" + n2(ex - Math.cos(a) * h + Math.sin(a) * h * 0.62) + "," + n2(ey - Math.sin(a) * h - Math.cos(a) * h * 0.62) + " Z", col, col, 2);
    }

    function leader(x1, y1, x2, y2, u, col) {
      if (!(u > 0)) return "";
      col = col || P.gold;
      var ex = lerp(x1, x2, u), ey = lerp(y1, y2, u);
      return L(x1, y1, ex, ey, col, 3) + C(x1, y1, 5, col) + (u >= 1 ? C(x2, y2, 7, col, P.ground, 2) : "");
    }

    /* o: {dir (radians, 0 = to the right), spread (radians), n rings, period s,
       reach px, col, until (time the sound stops; the rings then fade)} */
    function waves(x, y, t, at, o) {
      if (at == null || t < at) return "";
      o = o || {};
      var dir = o.dir || 0, spread = o.spread == null ? 0.9 : o.spread, n = o.n || 3, period = o.period || 1.2,
        reach = o.reach || 140, col = o.col || P.gold, fade = o.until == null ? 1 : 1 - clamp((t - o.until) / 0.5, 0, 1);
      if (fade <= 0) return "";
      var out = "", start = clamp((t - at) / 0.3, 0, 1);
      for (var k = 0; k < n; k++) {
        var ph = ((t - at) / period + k / n) % 1, r = 18 + reach * ph;
        var a0 = dir - spread / 2, a1 = dir + spread / 2;
        out += Pth("M" + n2(x + r * Math.cos(a0)) + "," + n2(y + r * Math.sin(a0)) +
          " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(x + r * Math.cos(a1)) + "," + n2(y + r * Math.sin(a1)),
          null, col, 5, { opacity: (1 - ph) * fade * start });
      }
      return out;
    }

    /* One disc filled with a radial gradient that fades to nothing at its rim.
       (Three stacked see-through discs showed as grey plates on the dark cards.)
       The gradient is defined beside each glow, under an id made from its
       colour, so every definition of one id is the same and any of them serves. */
    function glow(cx, cy, r, col, o) {
      if (!(o > 0)) return "";
      col = col || P.gold;
      var id = "mkglow" + String(col).replace(/[^0-9a-zA-Z]/g, "");
      return '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="' + col + '" stop-opacity="0.42"/>' +
        '<stop offset="0.55" stop-color="' + col + '" stop-opacity="0.16"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient></defs>' +
        C(cx, cy, r, "url(#" + id + ")", null, null, { opacity: Math.min(1, o) });
    }

    /* opt: {size (px, 22), col (border), fill, ink, anchor ("middle")} */
    function pill(x, y, text, o, opt) {
      if (!(o > 0)) return "";
      opt = opt || {};
      var size = opt.size || 22, w = String(text).length * size * 0.56 + size * 1.3, h = size * 1.8;
      var left = opt.anchor === "start" ? x : opt.anchor === "end" ? x - w : x - w / 2;
      return G(R(left, y - h / 2, w, h, h / 2, opt.fill || P.card, opt.col || P.line, 2) +
        Tx(left + w / 2, y + size * 0.36, text, "lab", "middle", { "font-size": size, fill: opt.ink || P.ink }), { opacity: o });
    }

    function bubble(x, y, w, h, text, o, tx, ty) {
      if (!(o > 0)) return "";
      var mx = x + w / 2, tail = tx == null ? "" :
        Pth("M" + n2(mx - 16) + "," + n2(y + h - 2) + " L" + n2(tx) + "," + n2(ty) + " L" + n2(mx + 16) + "," + n2(y + h - 2) + " Z", P.paper);
      return G(tail + R(x, y, w, h, 22, P.paper) + Tx(mx, y + h / 2 + 9, text, "lab big dark", "middle"), { opacity: o, transform: around(mx, y + h, 0.9 + 0.1 * Math.min(1, o)) });
    }

    /* rows: [{text, at, mark: "tick" | "cross", markAt}]; a row appears at its
       time, and its mark pops in at markAt (or just after the row).
       opt: {lh (line height, 50), cls ("lab big"), markR (17)} */
    function list(x, y, rows, t, opt) {
      opt = opt || {};
      var lh = opt.lh || 50, cls = opt.cls || "lab big", mr = opt.markR || 17, out = "";
      rows.forEach(function (r, k) {
        var o = on(t, r.at, 0.4);
        if (o <= 0) return;
        var ry = y + k * lh;
        out += Tx(x + mr * 2 + 16, ry + 10, r.text, cls, "start", { opacity: o, transform: "translate(" + n2((1 - o) * 14) + ",0)" });
        var mAt = r.markAt != null ? r.markAt : r.at == null ? null : r.at + 0.3;
        if (r.mark === "tick") out += tick(x + mr, ry, mr, popIn(t, mAt, 0.35));
        else if (r.mark === "cross") out += cross(x + mr, ry, mr, popIn(t, mAt, 0.35));
        else out += C(x + mr, ry, 6, P.muted, null, null, { opacity: o });
      });
      return out;
    }

    /* ---- two chapters every film has ------------------------------------------ */

    /* The spoken title chapter: the film's motif large on the left, its title
       and a few lines on the right, rising in as the first two lines are said.
       opt: {sub: [lines], motif: function (o) -> <svg> (the film's titleMotif by default)} */
    function titleKind(opt) {
      opt = opt || {};
      return function (scene, beat, t, i) {
        var one = scene.first, two = scene.first + (scene.beats.length > 1 ? 1 : 0);
        var a = inAt(t, BEATS[one].start, 1.0), b = inAt(t, BEATS[two].start, 0.7);
        var motif = (opt.motif || titleMotif)({ t: t, scene: scene, i: i, spoken: true });
        return '<div class="title">' +
          '<div class="tfig glow" style="opacity:' + (0.18 + a * 0.82).toFixed(3) +
            ";transform:translateY(" + ((1 - a) * 26).toFixed(2) + "px) scale(" + (0.94 + a * 0.06).toFixed(3) + ')">' + motif + "</div>" +
          '<div class="tw">' +
            '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">' + esc(F.subtitle) + " · Unit lecture</p>" +
            '<h1 style="text-wrap:balance;opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(F.title) + "</h1>" +
            '<p class="tsub" style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 12).toFixed(2) + 'px)">' +
              (opt.sub || []).map(esc).join("<br>") + "</p>" +
          "</div></div>";
      };
    }

    /* "What you now know": one card per idea, lit as it is said.
       cards: [{beat: k (the scene's k-th beat), at: cue name, title, sub, pic}]
       where pic is an emoji, one of the lesson's <svg> drawings, or a function
       (cx, cy, size, t) -> markup. opt: {goBeat, goAt}: from that cue every
       lit card breathes, for the film's last line. */
    /* The grid sits inside a 4 px margin, so a lit card's border (3 px, and a
       pop-in that overshoots) stays inside the 1168 x 440 box. A card's second
       line is lab mid, the brief's smallest size for words in a picture. */
    function recapKind(cards, opt) {
      opt = opt || {};
      var M = 4, n = cards.length, cols = n <= 3 ? n : n === 4 ? 2 : 3, rows = Math.ceil(n / cols), gap = 14;
      var w = (1168 - 2 * M - (cols - 1) * gap) / cols, h = Math.min(212, (440 - 2 * M - (rows - 1) * gap) / rows);
      var top = (440 - rows * h - (rows - 1) * gap) / 2;
      return function (scene, beat, t, i) {
        var out = "", go = opt.goAt ? sc(scene, opt.goBeat || 0, opt.goAt) : null;
        cards.forEach(function (c, k) {
          var row = Math.floor(k / cols), inRow = row < rows - 1 ? cols : n - cols * (rows - 1);
          var x = (1168 - inRow * w - (inRow - 1) * gap) / 2 + (k % cols) * (w + gap), y = top + row * (h + gap);
          var p = popIn(t, sc(scene, c.beat, c.at), 0.4), lit = p > 0;
          var pulse = go != null && t >= go ? 0.6 + 0.4 * breathe(t + k * 0.4) : 1;
          var size = h * 0.44, cx = x + w / 2, cy = y + h * 0.36;
          var art = typeof c.pic === "function" ? c.pic(cx, cy, size, t) : pic(cx, cy, size, c.pic);
          out += G(R(x, y, w, h, 22, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2, { "stroke-opacity": lit ? pulse : 1 }) +
            art + Tx(cx, y + h - 42, c.title, "lab big", "middle") +
            (c.sub ? Tx(cx, y + h - 15, c.sub, "lab mid muted readable", "middle") : ""),
            { opacity: 0.32 + 0.68 * Math.min(1, p), transform: around(cx, y + h / 2, lit ? 0.96 + 0.04 * Math.min(p, 1.08) : 0.96) });
        });
        return svg(out);
      };
    }

    return {
      tick: tick, cross: cross, qmark: qmark, pop: pop, ripple: ripple, finger: finger, pic: pic,
      arrow: arrow, leader: leader, waves: waves, glow: glow, pill: pill, bubble: bubble, list: list,
      titleKind: titleKind, recapKind: recapKind
    };
  })();

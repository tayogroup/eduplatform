    /* ==== the Mathematics films' pictures =====================================
       tools/lib/ehel-film-art-math.page.js, run inside ART's scope by
       tools/lib/ehel-film-art-math.js, which wraps this file and nothing else.

       The Science films SLICE their drawings out of the science lesson kit,
       because there is one. Mathematics has no kit: its lesson pages build ten
       frames, number lines, coins, clocks and bars out of HTML and CSS, and a
       different set in every lesson, so there is nothing to slice. These are
       therefore WRITTEN here, once, so that every Mathematics film draws the
       same ten frame as every other and as the lessons. The palette below is
       the lessons' own light :root (grade-1-app/g1v2/counting-to-twenty.html
       and its siblings), because the film's stage is dark and each drawing
       carries its own light card.

       Every function returns a complete <svg> with its own viewBox, so a frame
       stays a pure function of time: no Date, no Math.random, no timer, no CSS
       transition. A film nests one with ART.place(svg, x, y, w, h) in the
       1168 x 440 space a chapter draws into.

       What a film may draw:

         ART.tenFrame(n, o)          n counters in one or two frames of ten
                                     o: {frames 1-2, split, colour, label}
         ART.counters(n, o)          loose counters, in rows or in pairs
                                     o: {cols, pairs, markOdd, colour, label}
         ART.numberLine(o)           {from, to, step, labelEvery, marks, jumps,
                                     label} - ticks, markers and counting jumps
         ART.dice(faces, o)          one die or several: 1-6 pips  o: {total, label}
         ART.coins(values, o)        shilling coins and notes
                                     o: {total, unit, perRow, label}
         ART.clock(h, m, o)          an analogue face  o: {quarters, minuteNumbers,
                                     digital, label}
         ART.barModel(o)             {whole, parts, unknown, label} part-part-whole
         ART.array(rows, cols, o)    dots in rows and columns
                                     o: {colour, markRow, markCol, label}
         ART.fraction(o)             {shape "bar"|"circle", parts, shaded, label}
         ART.placeValue(o)           {value} or {hundreds, tens, ones}
                                     o: {lit, blocks, label} - flats, rods, cubes
         ART.tally(n, o)             tally marks in fives  o: {label}
         ART.barChart(o)             {bars, max, step, highlight, title, values}
         ART.pictogram(o)            {rows, each, shape, title, key} with a key line;
                                     key is a word, or [one, many]
         ART.balance(left, right, o) a pan balance  o: {tilt, label}
         ART.ruler(o)                {length, item, unit, label} a ruler and a thing
         ART.shape2d(kind, o)        square, rectangle, triangle, circle, pentagon,
                                     hexagon  o: {sides, corners, rightAngles, label}
         ART.grid(o)                 {cols, rows, fill, coords, points, label}
         ART.sequence(o)             {terms, step, arrows, label} one term missing
         ART.spinner(o)              {parts, pointer, title}
         ART.columnSum(o)            {a, b, op "+"|"-"|"x", carries, exchanges,
                                     answer, highlight, headings} a written method
         ART.calendar(o)             {month, year, days, start (0 = Monday), mark}
         ART.compass(o)              {points 4|8, facing, turn {quarters, way}}
         ART.symmetry(o)             {kind, lines, reflect} mirror lines of a shape
         ART.solid(kind, o)          cube, cuboid, pyramid, cylinder, cone, sphere;
                                     {faces, edges, vertices, counts} - true, or a
                                     list of which to mark; hidden parts dashed
         ART.jug(o)                  {capacity, step, minorPer, level, unit, kind}
         ART.sortDiagram(o)          {shape "venn"|"carroll", labels, items
                                     [{label, a, b}], title}
         ART.place(svg, x, y, w, h)  nest a drawing in a box of the film's space
         ART.C                       the lessons' light palette, by name
    */
    var FONT = '"Atkinson Hyperlegible", "Segoe UI", Arial, sans-serif';
    var NUMF = '"Inter", "Segoe UI", Arial, sans-serif';

    /* the lessons' light :root, measured from the Grade 1-4 lesson pages */
    var C = {
      ground: "#F3F8F5", card: "#FFFFFF", ink: "#1B2A2F", muted: "#6B7F82",
      line: "#D6E3DE", cell: "#E4EEE9",
      accent: "#F26B2A", accentInk: "#FFFFFF", accentSoft: "#FDE4D6",
      teal: "#1E8C86", tealSoft: "#D5EFEC", plum: "#8E5AA8", plumSoft: "#EADDF2",
      gold: "#C99700", goldSoft: "#FBEFC9",
      good: "#2E8B57", goodSoft: "#DCF3E4", bad: "#C4453A", badSoft: "#F9DEDB",
      coin: "#E8C766", coinLit: "#FFF4C2", coinInk: "#5A4300",
      note: "#BCE3DE", noteInk: "#10403C", bigNote: "#DCC6EA", bigNoteInk: "#3D1F4F"
    };
    /* the named colours a caller may ask for */
    var PICK = { accent: C.accent, teal: C.teal, plum: C.plum, gold: C.gold, good: C.good, bad: C.bad, ink: C.ink, muted: C.muted };

    function bad(where, msg) { throw new Error("mathArt." + where + ": " + msg); }
    function num(v) { return String(Math.round(v * 1000) / 1000); }
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /* ---- argument checking, so a wrong call names itself ------------------ */
    function whole(where, name, v, lo, hi) {
      if (typeof v !== "number" || !isFinite(v) || Math.floor(v) !== v)
        bad(where, name + " must be a whole number, got " + JSON.stringify(v));
      if (v < lo || v > hi) bad(where, name + " must be " + lo + " to " + hi + ", got " + v);
      return v;
    }
    function number(where, name, v, lo, hi) {
      if (typeof v !== "number" || !isFinite(v)) bad(where, name + " must be a number, got " + JSON.stringify(v));
      if (v < lo || v > hi) bad(where, name + " must be " + lo + " to " + hi + ", got " + v);
      return v;
    }
    function options(where, o) {
      if (o == null) return {};
      if (typeof o !== "object" || Array.isArray(o)) bad(where, "the options must be an object, got " + JSON.stringify(o));
      return o;
    }
    function listOf(where, name, v, lo, hi) {
      if (!Array.isArray(v)) bad(where, name + " must be an array, got " + JSON.stringify(v));
      if (v.length < lo || v.length > hi) bad(where, name + " must hold " + lo + " to " + hi + " items, got " + v.length);
      return v;
    }
    function colour(where, v, dflt) {
      if (v == null) return dflt;
      if (typeof v === "string" && PICK[v]) return PICK[v];
      if (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
      bad(where, "colour must be one of " + Object.keys(PICK).join(", ") + " or a #hex, got " + JSON.stringify(v));
    }

    /* ---- the markup helpers ----------------------------------------------- */
    /* A value holding a double quote is written in single quotes instead, which
       is how the font stack reaches the markup unmangled. */
    function att(o) {
      var s = "", k, v;
      for (k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        v = o[k];
        if (v == null || v === false) continue;
        v = typeof v === "number" ? num(v) : String(v);
        s += v.indexOf('"') >= 0 ? " " + k + "='" + v + "'" : " " + k + '="' + v + '"';
      }
      return s;
    }
    function el(tag, o, inner) { return "<" + tag + att(o || {}) + (inner == null ? "/>" : ">" + inner + "</" + tag + ">"); }
    function G(inner, o) { return el("g", o || {}, inner); }
    function more(base, extra) { var k; for (k in (extra || {})) base[k] = extra[k]; return base; }
    function R(x, y, w, h, rx, fill, stroke, sw, extra) {
      return el("rect", more({ x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), rx: rx, fill: fill || "none", stroke: stroke, "stroke-width": sw }, extra));
    }
    function Ci(cx, cy, r, fill, stroke, sw, extra) {
      return el("circle", more({ cx: cx, cy: cy, r: Math.max(0, r), fill: fill || "none", stroke: stroke, "stroke-width": sw }, extra));
    }
    function Ell(cx, cy, rx, ry, fill, extra) {
      return el("ellipse", more({ cx: cx, cy: cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: fill || "none" }, extra));
    }
    function L(x1, y1, x2, y2, stroke, sw, extra) {
      return el("line", more({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, "stroke-width": sw, "stroke-linecap": "round" }, extra));
    }
    function Pth(d, fill, stroke, sw, extra) {
      return el("path", more({ d: d, fill: fill || "none", stroke: stroke, "stroke-width": sw, "stroke-linecap": "round", "stroke-linejoin": "round" }, extra));
    }
    /* Text. A film places a drawing 300-560 px wide on a 1280 px frame, so a
       size here is very nearly a size on screen: nothing goes below 13. */
    function T(x, y, s, o) {
      o = o || {};
      return el("text", {
        x: x, y: y, "font-family": o.font === "num" ? NUMF : (o.font || null),
        "font-size": o.size == null ? 17 : o.size, "font-weight": o.weight == null ? 700 : o.weight,
        fill: o.fill || C.ink, "text-anchor": o.anchor || "middle",
        "dominant-baseline": o.baseline === false ? null : (o.baseline || "central"),
        opacity: o.opacity, style: "font-variant-numeric: tabular-nums"
      }, esc(s));
    }
    /* a number, in the lessons' Inter, tabular so digits do not shuffle */
    function N(x, y, s, size, fill, extra) {
      return T(x, y, s, more({ font: "num", size: size, fill: fill }, extra));
    }
    /* an arrowhead at (x, y), pointing along the angle a (degrees) */
    function head(x, y, a, fill, size) {
      var r = (a * Math.PI) / 180, w = size == null ? 8 : size;
      function p(d, s) { var q = r + (d * Math.PI) / 180; return num(x + s * Math.cos(q)) + "," + num(y + s * Math.sin(q)); }
      return el("polygon", { points: num(x) + "," + num(y) + " " + p(152, w * 1.7) + " " + p(-152, w * 1.7), fill: fill });
    }

    /* Every drawing is a light card on the film's dark stage. */
    function card(w, h, inner, o) {
      o = o || {};
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + num(w) + " " + num(h) +
        "\" font-family='" + FONT + "'>" +
        (o.bare ? "" : R(1, 1, w - 2, h - 2, o.radius == null ? 20 : o.radius, o.bg || C.card, C.line, 2)) +
        inner + "</svg>";
    }
    /* the caption a drawing carries when the caller asks for one */
    function labelOf(o, dflt) {
      if (o.label === true) return dflt == null ? null : String(dflt);
      if (o.label === false || o.label == null) return null;
      return String(o.label);
    }
    /* A caption never grows past its own card: a label longer than the drawing
       is wide is set smaller instead of hanging off the edge into the film's
       dark stage, which is what "a circle has no corners" did under a 276-wide
       shape before 2026-09-23. */
    /* A caption the caller ASKED for by setting an option - dice {total},
       solid {counts}, the jug's reading - is drawn without also being told
       label: true. Only label: false silences it, and a string replaces it.
       (Before 2026-09-23 these went through labelOf and were silently
       dropped: every one of them needed label: true as well.) */
    function auto(o, computed) {
      if (o.label === false) return null;
      if (typeof o.label === "string") return o.label;
      return computed == null ? null : String(computed);
    }
    function caption(w, y, s, size, fill) {
      var txt = String(s), want = size == null ? 23 : size;
      var fit = (w - 26) / (0.56 * Math.max(1, txt.length));
      return N(w / 2, y, txt, Math.max(13, Math.min(want, fit)), fill || C.ink);
    }
    /* a rectangle rounded on one end only, for the ends of a divided bar */
    function endCell(x, y, w, h, r, which, fill) {
      if (which === "both") return R(x, y, w, h, r, fill);
      if (which === "none") return R(x, y, w, h, 0, fill);
      if (which === "left")
        return Pth("M" + num(x + r) + "," + num(y) + " H" + num(x + w) + " V" + num(y + h) + " H" + num(x + r) +
          " A" + r + "," + r + " 0 0,1 " + num(x) + "," + num(y + h - r) + " V" + num(y + r) +
          " A" + r + "," + r + " 0 0,1 " + num(x + r) + "," + num(y) + " Z", fill);
      return Pth("M" + num(x) + "," + num(y) + " H" + num(x + w - r) +
        " A" + r + "," + r + " 0 0,1 " + num(x + w) + "," + num(y + r) + " V" + num(y + h - r) +
        " A" + r + "," + r + " 0 0,1 " + num(x + w - r) + "," + num(y + h) + " H" + num(x) + " Z", fill);
    }

    /* ==== the drawings ======================================================= */

    /* ---- ten frames -------------------------------------------------------
       The lesson's own: a dark frame, white cells, a fat round counter in each
       one that is filled. Counters fill across the top row first, as a child
       lays them out. */
    var TF = { cell: 40, gap: 4, pad: 6, dot: 15, edge: 20, between: 18 };
    function tenFrame(n, o) {
      o = options("tenFrame", o);
      whole("tenFrame", "n", n, 0, 20);
      var frames = o.frames == null ? (n > 10 ? 2 : 1) : whole("tenFrame", "frames", o.frames, 1, 2);
      if (n > frames * 10) bad("tenFrame", "n is " + n + ", which does not fit in " + frames + (frames === 1 ? " frame" : " frames"));
      var split = o.split == null ? n : whole("tenFrame", "split", o.split, 0, n);
      var first = colour("tenFrame", o.colour, C.accent), second = colour("tenFrame", o.second, C.teal);
      var fw = 5 * TF.cell + 4 * TF.gap + 2 * TF.pad, fh = 2 * TF.cell + TF.gap + 2 * TF.pad;
      var lab = labelOf(o, String(n));
      var w = 2 * TF.edge + frames * fw + (frames - 1) * TF.between;
      var h = TF.edge + fh + TF.edge + (lab ? 34 : 0);
      var s = "", f, k, col, row, x, i;
      for (f = 0; f < frames; f++) {
        x = TF.edge + f * (fw + TF.between);
        s += R(x, TF.edge, fw, fh, 11, C.ink);
        for (k = 0; k < 10; k++) {
          col = k % 5; row = k < 5 ? 0 : 1;
          i = f * 10 + k;
          s += R(x + TF.pad + col * (TF.cell + TF.gap), TF.edge + TF.pad + row * (TF.cell + TF.gap), TF.cell, TF.cell, 7, C.card);
          if (i < n) s += Ci(x + TF.pad + col * (TF.cell + TF.gap) + TF.cell / 2,
            TF.edge + TF.pad + row * (TF.cell + TF.gap) + TF.cell / 2, TF.dot, i < split ? first : second);
        }
      }
      if (lab) s += caption(w, TF.edge + fh + 20, lab, 25);
      return card(w, h, s);
    }

    /* ---- loose counters ---------------------------------------------------
       In rows, or boxed in pairs so that odd and even can be seen rather than
       counted: with markOdd the one left over is drawn on its own in red. */
    function counters(n, o) {
      o = options("counters", o);
      whole("counters", "n", n, 0, 30);
      var fill = colour("counters", o.colour, C.accent), lab = labelOf(o, String(n)), s = "", i, x, y;
      var edge = 20, cap = lab ? 34 : 0;
      if (o.pairs) {
        var boxes = Math.ceil(n / 2), perRow = Math.min(Math.max(boxes, 1), 7), bw = 48, bh = 92, gap = 10;
        var rows = Math.max(1, Math.ceil(boxes / perRow));
        var w = 2 * edge + perRow * bw + (perRow - 1) * gap, h = edge + rows * (bh + gap) - gap + edge + cap;
        for (i = 0; i < boxes; i++) {
          var lone = !!o.markOdd && i === boxes - 1 && n % 2 === 1;
          x = edge + (i % perRow) * (bw + gap); y = edge + Math.floor(i / perRow) * (bh + gap);
          s += R(x, y, bw, bh, 14, lone ? C.badSoft : C.cell, lone ? C.bad : C.line, 3, lone ? { "stroke-dasharray": "7 5" } : null);
          s += Ci(x + bw / 2, y + 25, 16, lone ? C.bad : fill);
          if (i * 2 + 1 < n) s += Ci(x + bw / 2, y + 67, 16, fill);
        }
        if (lab) s += caption(w, h - 22, lab, 25);
        return card(w, h, s);
      }
      var cols = o.cols == null ? (n > 10 ? 10 : 5) : whole("counters", "cols", o.cols, 1, 10);
      var cell = 42, rws = Math.max(1, Math.ceil(n / cols));
      var w2 = 2 * edge + Math.min(Math.max(n, 1), cols) * cell, h2 = edge + rws * cell + edge + cap;
      for (i = 0; i < n; i++) {
        s += Ci(edge + (i % cols) * cell + cell / 2, edge + Math.floor(i / cols) * cell + cell / 2, 16, fill);
      }
      if (lab) s += caption(w2, h2 - 22, lab, 25);
      return card(w2, h2, s);
    }

    /* ---- the number line --------------------------------------------------
       from, to and the tick step; markers sitting on the line; and the arcs a
       child draws when counting on or back. */
    function numberLine(o) {
      o = options("numberLine", o);
      var from = number("numberLine", "from", o.from, -1000, 10000);
      var to = number("numberLine", "to", o.to, -1000, 10000);
      if (to <= from) bad("numberLine", "to must be past from, got from " + from + " and to " + to);
      var step = o.step == null ? 1 : number("numberLine", "step", o.step, 0.001, 1000);
      var ticks = (to - from) / step;
      if (Math.abs(ticks - Math.round(ticks)) > 1e-6) bad("numberLine", "step " + step + " does not divide " + from + " to " + to + " into whole ticks");
      ticks = Math.round(ticks);
      if (ticks < 1 || ticks > 40) bad("numberLine", "that is " + ticks + " ticks; a film can read 1 to 40");
      var every = o.labelEvery == null ? step : number("numberLine", "labelEvery", o.labelEvery, step, to - from);
      var marks = o.marks == null ? (o.mark == null ? [] : [{ at: o.mark }]) : listOf("numberLine", "marks", o.marks, 0, 6);
      var jumps = o.jumps == null ? [] : listOf("numberLine", "jumps", o.jumps, 0, 6);
      var w = o.width == null ? 560 : number("numberLine", "width", o.width, 260, 1100);
      var pad = 36, x0 = pad, x1 = w - pad;
      var top = jumps.length ? 96 : 26, ay = top + 20;
      var lab = labelOf(o, null), h = ay + 62 + (lab ? 30 : 0);
      function X(v) { return x0 + ((v - from) / (to - from)) * (x1 - x0); }
      var s = "", i, v, big, m, j, ang;
      for (i = 0; i <= ticks; i++) {
        v = from + i * step;
        big = Math.abs(((v - from) / every) - Math.round((v - from) / every)) < 1e-6;
        s += L(X(v), ay - (big ? 13 : 7), X(v), ay + (big ? 13 : 7), C.ink, big ? 3 : 2);
        if (big) s += N(X(v), ay + 32, String(Math.round(v * 1000) / 1000), 17, C.ink);
      }
      s = L(x0 - 10, ay, x1 + 10, ay, C.ink, 4) + s;
      for (j = 0; j < jumps.length; j++) {
        var J = jumps[j];
        if (J == null || typeof J !== "object") bad("numberLine", "every jump is an object with from and to, got " + JSON.stringify(J));
        var a = number("numberLine", "the from of a jump", J.from, from, to), b = number("numberLine", "the to of a jump", J.to, from, to);
        if (a === b) bad("numberLine", "a jump goes from one number to another, and this one is " + a + " to " + b);
        var ja = X(a), jb = X(b), jc = colour("numberLine", J.colour, C.teal), ah = 56;
        var c1 = ja + (jb - ja) * 0.25, c2 = jb - (jb - ja) * 0.25;
        s += Pth("M" + num(ja) + "," + num(ay - 15) + " C" + num(c1) + "," + num(ay - 15 - ah) + " " + num(c2) + "," + num(ay - 15 - ah) + " " + num(jb) + "," + num(ay - 15), null, jc, 4);
        ang = (Math.atan2(ah, (jb - ja) * 0.25) * 180) / Math.PI;
        s += head(jb, ay - 15, ang, jc, 7);
        if (J.label != null) s += N((ja + jb) / 2, ay - 26 - ah * 0.86, String(J.label), 19, jc);
      }
      for (i = 0; i < marks.length; i++) {
        m = marks[i];
        if (typeof m === "number") m = { at: m };
        if (m == null || typeof m !== "object") bad("numberLine", "every mark is a number or an object with at, got " + JSON.stringify(marks[i]));
        var at = number("numberLine", "the at of a mark", m.at, from, to);
        var mc = colour("numberLine", m.colour, C.accent);
        s += Ci(X(at), ay, 14, mc, C.card, 4);
        /* The label goes in the row of tick numbers, on a card of its own, and
           covers the tick number it names. Above the line it would sit exactly
           where a jump arc lands. */
        if (m.label != null) {
          var mw = Math.max(34, 12 * String(m.label).length + 14);
          s += R(X(at) - mw / 2, ay + 19, mw, 28, 8, C.card);
          s += N(X(at), ay + 33, String(m.label), 20, mc);
        }
      }
      if (lab) s += caption(w, h - 22, lab, 23);
      return card(w, h, s);
    }

    /* ---- dice -------------------------------------------------------------- */
    var DIE = 80;
    function diePips(v) {
      var p = DIE * 0.25, c = [p, DIE / 2, DIE - p], out = "", set, i;
      if (v === 1) set = [[1, 1]];
      else if (v === 2) set = [[0, 0], [2, 2]];
      else if (v === 3) set = [[0, 0], [1, 1], [2, 2]];
      else if (v === 4) set = [[0, 0], [2, 0], [0, 2], [2, 2]];
      else if (v === 5) set = [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]];
      else set = [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]];
      for (i = 0; i < set.length; i++) out += Ci(c[set[i][0]], c[set[i][1]], 8.5, C.ink);
      return out;
    }
    function dice(faces, o) {
      o = options("dice", o);
      var faceList = Array.isArray(faces) ? faces : [faces];
      listOf("dice", "faces", faceList, 1, 5);
      var i, total = 0;
      for (i = 0; i < faceList.length; i++) { whole("dice", "every face", faceList[i], 1, 6); total += faceList[i]; }
      var edge = 20, gap = 22, lab = auto(o, o.total ? String(total) : null);
      var w = 2 * edge + faceList.length * DIE + (faceList.length - 1) * gap;
      var h = edge + DIE + edge + (lab ? 34 : 0), s = "";
      for (i = 0; i < faceList.length; i++) {
        s += G(R(0, 0, DIE, DIE, 16, C.card, C.ink, 3) + diePips(faceList[i]),
          { transform: "translate(" + num(edge + i * (DIE + gap)) + "," + num(edge) + ")" });
        if (i) s += N(edge + i * (DIE + gap) - gap / 2, edge + DIE / 2, "+", 28, C.muted);
      }
      if (lab) s += caption(w, edge + DIE + 20, lab, 25, C.accent);
      return card(w, h, s);
    }

    /* ---- money ------------------------------------------------------------
       Shillings, as the lessons write them: a gold coin with its value on it,
       a note as a rounded rectangle. Anything above coinsUpTo is drawn as a
       note; the big notes are the lessons' plum ones. */
    function money(v, unit) { return unit === "KSh" ? "KSh " + v : v + " " + (unit || "sh"); }
    function coinFace(v, unit) {
      var s = Ci(38, 38, 35, C.coin, C.gold, 5) + Ell(29, 27, 15, 11, C.coinLit, { opacity: 0.6 });
      return s + N(38, 32, String(v), 24, C.coinInk) + T(38, 55, unit || "sh", { size: 14, fill: C.coinInk });
    }
    function noteFace(v, unit, big) {
      var s = R(0, 0, 116, 64, 10, big ? C.bigNote : C.note, big ? C.plum : C.teal, 4);
      var ink = big ? C.bigNoteInk : C.noteInk;
      return s + N(58, 26, String(v), 27, ink) + T(58, 48, unit || "sh", { size: 14, fill: ink });
    }
    function coins(values, o) {
      o = options("coins", o);
      var vals = listOf("coins", "values", values, 1, 12), i, sum = 0;
      for (i = 0; i < vals.length; i++) { number("coins", "every value", vals[i], 0.5, 1000); sum += vals[i]; }
      var unit = o.unit == null ? "sh" : String(o.unit);
      if (unit !== "sh" && unit !== "KSh") bad("coins", "unit is sh or KSh, got " + JSON.stringify(o.unit));
      var upTo = o.coinsUpTo == null ? 20 : number("coins", "coinsUpTo", o.coinsUpTo, 1, 1000);
      var perRow = o.perRow == null ? 5 : whole("coins", "perRow", o.perRow, 1, 6);
      var items = [], it;
      for (i = 0; i < vals.length; i++) {
        it = vals[i] <= upTo
          ? { w: 76, h: 76, m: coinFace(vals[i], unit) }
          : { w: 116, h: 64, m: noteFace(vals[i], unit, vals[i] >= 200) };
        items.push(it);
      }
      var rows = [], r = [], gap = 14, edge = 20;
      for (i = 0; i < items.length; i++) { r.push(items[i]); if (r.length === perRow) { rows.push(r); r = []; } }
      if (r.length) rows.push(r);
      var wide = 0, j, rw;
      for (i = 0; i < rows.length; i++) {
        rw = 0;
        for (j = 0; j < rows[i].length; j++) rw += rows[i][j].w + (j ? gap : 0);
        rows[i].width = rw; rows[i].height = rows[i][0].h;
        for (j = 0; j < rows[i].length; j++) rows[i].height = Math.max(rows[i].height, rows[i][j].h);
        wide = Math.max(wide, rw);
      }
      var lab = auto(o, o.total ? "Total " + money(Math.round(sum * 100) / 100, unit) : null);
      var w = wide + 2 * edge, h = edge, x, y = edge, s = "";
      for (i = 0; i < rows.length; i++) {
        x = (w - rows[i].width) / 2;
        for (j = 0; j < rows[i].length; j++) {
          s += G(rows[i][j].m, { transform: "translate(" + num(x) + "," + num(y + (rows[i].height - rows[i][j].h) / 2) + ")" });
          x += rows[i][j].w + gap;
        }
        y += rows[i].height + gap;
      }
      h = y - gap + edge + (lab ? 36 : 0);
      if (lab) s += caption(w, h - 24, lab, 26, C.accent);
      return card(Math.max(w, lab ? 240 : 120), h, s);
    }

    /* ---- the clock --------------------------------------------------------
       The Grade 2 lesson's face, hand for hand: sixty ticks, the hour numbers
       inside them, a short fat hour hand in ink and a long thin minute hand in
       the accent, because that is what the lesson teaches a child to read. */
    function clock(h, m, o) {
      o = options("clock", o);
      whole("clock", "h", h, 1, 12);
      whole("clock", "m", m, 0, 59);
      var cx = 144, cy = 144, Rr = 112, face = 288, s = "", i, a, big, r1;
      if (o.quarters) {
        for (i = 0; i < 4; i += 2) {
          var a0 = ((-90 + i * 90) * Math.PI) / 180, a1 = ((-90 + (i + 1) * 90) * Math.PI) / 180;
          s += Pth("M" + cx + "," + cy + " L" + num(cx + Rr * Math.cos(a0)) + "," + num(cy + Rr * Math.sin(a0)) +
            " A" + Rr + "," + Rr + " 0 0,1 " + num(cx + Rr * Math.cos(a1)) + "," + num(cy + Rr * Math.sin(a1)) + " Z", C.tealSoft);
        }
      }
      s = Ci(cx, cy, Rr, C.card, C.ink, 4) + s;
      for (i = 0; i < 60; i++) {
        a = ((i * 6 - 90) * Math.PI) / 180; big = i % 5 === 0; r1 = big ? Rr - 14 : Rr - 7;
        s += L(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), cx + Rr * Math.cos(a), cy + Rr * Math.sin(a), C.ink, big ? 4 : 2);
        if (big) {
          s += N(cx + (Rr - 32) * Math.cos(a), cy + (Rr - 32) * Math.sin(a), String(i === 0 ? 12 : i / 5), 19, C.ink);
          if (o.minuteNumbers) s += N(cx + (Rr - 55) * Math.cos(a), cy + (Rr - 55) * Math.sin(a), String(i), 12, C.muted);
        }
      }
      var ha = ((((h % 12) / 12 + m / 720) * 360 - 90) * Math.PI) / 180, ma = (((m / 60) * 360 - 90) * Math.PI) / 180;
      s += L(cx, cy, cx + 58 * Math.cos(ha), cy + 58 * Math.sin(ha), C.ink, 10);
      s += L(cx, cy, cx + 90 * Math.cos(ma), cy + 90 * Math.sin(ma), C.accent, 6);
      s += Ci(cx, cy, 7.5, C.ink);
      var lab = labelOf(o, null), w = face, ht = face + (lab ? 34 : 0);
      if (o.digital) {
        w = face + 178;
        s += R(face + 14, cy - 42, 150, 84, 16, C.cell, C.line, 2);
        s += N(face + 89, cy, h + ":" + (m < 10 ? "0" + m : String(m)), 44, C.ink);
      }
      if (lab) s += caption(w, ht - 22, lab, 24);
      return card(w, ht, s);
    }

    /* ---- the bar model ----------------------------------------------------
       The whole above, the parts below, drawn to scale. One part (or the
       whole) may be the unknown, and is then the dashed accent box a child
       fills in. */
    function barModel(o) {
      o = options("barModel", o);
      var parts = listOf("barModel", "parts", o.parts, 2, 4), i, vals = [], labs = [], sum = 0, p;
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (typeof p === "number") p = { value: p };
        if (p == null || typeof p !== "object") bad("barModel", "every part is a number or an object with value, got " + JSON.stringify(parts[i]));
        number("barModel", "every part value", p.value, 0.001, 100000);
        vals.push(p.value); labs.push(p.label == null ? String(p.value) : String(p.label)); sum += p.value;
      }
      var wholeLab = o.whole == null ? String(Math.round(sum * 1000) / 1000)
        : (typeof o.whole === "number" ? String(o.whole) : String(o.whole));
      var unknown = o.unknown == null ? null : o.unknown;
      if (unknown !== null && unknown !== "whole" && (typeof unknown !== "number" || unknown < 0 || unknown >= parts.length))
        bad("barModel", "unknown is a part number 0 to " + (parts.length - 1) + " or the word whole, got " + JSON.stringify(o.unknown));
      var W = 520, edge = 24, inner = W - 2 * edge, bh = 62, gap = 16;
      var tone = [[C.tealSoft, C.teal], [C.accentSoft, C.accent], [C.plumSoft, C.plum], [C.goldSoft, C.gold]];
      var lab = labelOf(o, null), h = edge + bh + gap + bh + edge + (lab ? 32 : 0), s = "", x = edge, pw;
      var isW = unknown === "whole";
      s += R(edge, edge, inner, bh, 12, isW ? C.accentSoft : C.cell, isW ? C.accent : C.line, 3, isW ? { "stroke-dasharray": "9 6" } : null);
      s += N(W / 2, edge + bh / 2, isW ? "?" : wholeLab, 30, isW ? C.accent : C.ink);
      for (i = 0; i < parts.length; i++) {
        pw = (vals[i] / sum) * (inner - (parts.length - 1) * 8);
        var un = unknown === i, t = tone[i % tone.length];
        s += R(x, edge + bh + gap, pw, bh, 12, un ? C.accentSoft : t[0], un ? C.accent : t[1], 3, un ? { "stroke-dasharray": "9 6" } : null);
        s += N(x + pw / 2, edge + bh + gap + bh / 2, un ? "?" : labs[i], 28, un ? C.accent : t[1]);
        x += pw + 8;
      }
      if (lab) s += caption(W, h - 20, lab, 23);
      return card(W, h, s);
    }

    /* ---- the array --------------------------------------------------------
       Rows and columns of dots, with the count of each written beside them, so
       that 3 rows of 4 is something to see and not only to say. */
    function array(rows, cols, o) {
      o = options("array", o);
      whole("array", "rows", rows, 1, 12);
      whole("array", "cols", cols, 1, 12);
      var fill = colour("array", o.colour, C.teal), mark = colour("array", o.markColour, C.accent);
      var cell = 36, pad = 12, edge = 20, gutterL = 44, gutterT = 38;
      var mr = o.markRow == null ? null : whole("array", "markRow", o.markRow, 0, rows - 1);
      var mc = o.markCol == null ? null : whole("array", "markCol", o.markCol, 0, cols - 1);
      var pw = cols * cell + 2 * pad, ph = rows * cell + 2 * pad;
      var lab = labelOf(o, rows + (rows === 1 ? " row of " : " rows of ") + cols + " = " + rows * cols);
      var w = edge + gutterL + pw + edge, h = edge + gutterT + ph + edge + (lab ? 32 : 0);
      var px = edge + gutterL, py = edge + gutterT, s = "", i, j, dot;
      s += R(px, py, pw, ph, 16, C.cell, C.line, 2);
      for (i = 0; i < rows; i++) {
        for (j = 0; j < cols; j++) {
          dot = (mr === i || mc === j) ? mark : fill;
          s += Ci(px + pad + j * cell + cell / 2, py + pad + i * cell + cell / 2, 12.5, dot);
        }
      }
      s += L(px + pad, py - 14, px + pw - pad, py - 14, C.muted, 3);
      s += N((px + px + pw) / 2, py - 30, String(cols), 22, C.muted);
      s += L(px - 14, py + pad, px - 14, py + ph - pad, C.muted, 3);
      s += N(px - 30, py + ph / 2, String(rows), 22, C.muted);
      if (lab) s += caption(w, h - 20, lab, 23);
      return card(w, h, s);
    }

    /* ---- fractions --------------------------------------------------------
       A bar or a circle cut into equal parts, some of them shaded, and the
       fraction written the way a child writes it. */
    function fracGlyph(cx, cy, a, b, size, fill) {
      return N(cx, cy - size * 0.62, String(a), size, fill) +
        L(cx - size * 0.42, cy, cx + size * 0.42, cy, fill, Math.max(2.5, size * 0.09)) +
        N(cx, cy + size * 0.62, String(b), size, fill);
    }
    function fraction(o) {
      o = options("fraction", o);
      var shape = o.shape == null ? "bar" : String(o.shape);
      if (shape !== "bar" && shape !== "circle") bad("fraction", "shape is bar or circle, got " + JSON.stringify(o.shape));
      var parts = whole("fraction", "parts", o.parts, 2, 12);
      var on = [], i, k;
      if (Array.isArray(o.shaded)) {
        for (i = 0; i < o.shaded.length; i++) { whole("fraction", "every shaded part", o.shaded[i], 0, parts - 1); on[o.shaded[i]] = true; }
        k = o.shaded.length;
      } else {
        k = o.shaded == null ? 1 : whole("fraction", "shaded", o.shaded, 0, parts);
        for (i = 0; i < k; i++) on[i] = true;
      }
      var fill = colour("fraction", o.colour, C.teal);
      var edge = 22, s = "", w, h, x;
      var text = typeof o.label === "string" ? o.label : null, showFrac = o.label !== false;
      if (shape === "bar") {
        w = 440; h = edge + 104 + (showFrac ? 86 : 0) + (text ? 30 : 0) + edge;
        var bw = w - 2 * edge, cw = bw / parts;
        for (i = 0; i < parts; i++)
          s += endCell(edge + i * cw, edge, cw, 104, 8,
            parts === 1 ? "both" : i === 0 ? "left" : i === parts - 1 ? "right" : "none", on[i] ? fill : C.cell);
        for (i = 1; i < parts; i++) s += L(edge + i * cw, edge, edge + i * cw, edge + 104, C.ink, 2.5);
        s += R(edge, edge, bw, 104, 8, "none", C.ink, 3.5);
      } else {
        w = 300; h = edge + 216 + (showFrac ? 80 : 0) + (text ? 30 : 0) + edge;
        var cx = w / 2, cy = edge + 108, rr = 104;
        for (i = 0; i < parts; i++) {
          var a0 = ((i / parts) * 360 - 90) * Math.PI / 180, a1 = (((i + 1) / parts) * 360 - 90) * Math.PI / 180;
          var big = 1 / parts > 0.5 ? 1 : 0;
          s += Pth("M" + num(cx) + "," + num(cy) + " L" + num(cx + rr * Math.cos(a0)) + "," + num(cy + rr * Math.sin(a0)) +
            " A" + rr + "," + rr + " 0 " + big + ",1 " + num(cx + rr * Math.cos(a1)) + "," + num(cy + rr * Math.sin(a1)) + " Z",
            on[i] ? fill : C.cell, C.ink, 2.5);
        }
        s += Ci(cx, cy, rr, "none", C.ink, 3.5);
      }
      x = (shape === "bar" ? edge + 104 : edge + 216) + 46;
      if (showFrac) s += fracGlyph(w / 2, x, Array.isArray(o.shaded) ? o.shaded.length : k, parts, 30, fill);
      if (text) s += caption(w, h - 20, text, 23);
      return card(w, h, s);
    }

    /* ---- place value ------------------------------------------------------
       Hundreds, tens and ones in their columns: the digit, and under it the
       flats, rods and cubes it stands for, drawn as what they are - a flat is
       ten rods and a rod is ten cubes, and you can see it. */
    function flatBlock() {
      var s = R(0, 0, 38, 38, 3, C.tealSoft, C.teal, 1.6), i;
      for (i = 1; i < 10; i++) {
        s += L(i * 3.8, 0, i * 3.8, 38, C.teal, 0.6, { opacity: 0.5, "stroke-linecap": "butt" });
        s += L(0, i * 3.8, 38, i * 3.8, C.teal, 0.6, { opacity: 0.5, "stroke-linecap": "butt" });
      }
      return s + R(0, 0, 38, 38, 3, "none", C.teal, 1.6);
    }
    function rodBlock() {
      var s = R(0, 0, 11, 38, 2.5, C.goodSoft, C.good, 1.6), i;
      for (i = 1; i < 10; i++) s += L(0, i * 3.8, 11, i * 3.8, C.good, 0.6, { opacity: 0.55, "stroke-linecap": "butt" });
      return s + R(0, 0, 11, 38, 2.5, "none", C.good, 1.6);
    }
    function cubeBlock() { return R(0, 0, 13, 13, 2.5, C.accentSoft, C.accent, 1.6); }
    function placeValue(o) {
      o = options("placeValue", o);
      var hu, te, on;
      if (o.value != null) {
        whole("placeValue", "value", o.value, 0, 999);
        hu = Math.floor(o.value / 100); te = Math.floor(o.value / 10) % 10; on = o.value % 10;
      } else {
        hu = o.hundreds == null ? 0 : whole("placeValue", "hundreds", o.hundreds, 0, 9);
        te = o.tens == null ? 0 : whole("placeValue", "tens", o.tens, 0, 9);
        on = o.ones == null ? 0 : whole("placeValue", "ones", o.ones, 0, 9);
        if (o.hundreds == null && o.tens == null && o.ones == null)
          bad("placeValue", "give it a value, or hundreds, tens and ones");
      }
      var cols = o.columns == null ? (hu > 0 ? 3 : 2) : whole("placeValue", "columns", o.columns, 2, 3);
      if (cols === 2 && hu > 0) bad("placeValue", "there are " + hu + " hundreds, so it needs 3 columns, not 2");
      if (o.lit != null && o.lit !== "hundreds" && o.lit !== "tens" && o.lit !== "ones")
        bad("placeValue", "lit is hundreds, tens or ones, got " + JSON.stringify(o.lit));
      var blocks = o.blocks !== false;
      var set = [{ k: "hundreds", name: "HUNDREDS", n: hu, w: 42, per: 3, draw: flatBlock },
                 { k: "tens", name: "TENS", n: te, w: 15, per: 8, draw: rodBlock },
                 { k: "ones", name: "ONES", n: on, w: 17, per: 5, draw: cubeBlock }];
      if (cols === 2) set = set.slice(1);
      var cw = 150, gap = 14, edge = 20, blockH = blocks ? 132 : 0;
      var colH = 16 + 18 + 56 + blockH + 12;
      var lab = labelOf(o, String(hu * 100 + te * 10 + on));
      var w = 2 * edge + cols * cw + (cols - 1) * gap, h = edge + colH + edge + (lab ? 34 : 0);
      var s = "", i, j, x, lit, rows, bx, by, item;
      for (i = 0; i < set.length; i++) {
        item = set[i]; x = edge + i * (cw + gap); lit = o.lit === item.k;
        s += R(x, edge, cw, colH, 18, lit ? C.accentSoft : C.cell, lit ? C.accent : C.line, 2);
        s += T(x + cw / 2, edge + 22, item.name, { size: 13, fill: C.muted, weight: 700 });
        s += N(x + cw / 2, edge + 62, String(item.n), 44, C.ink);
        if (!blocks) continue;
        by = edge + colH - 14;
        rows = Math.ceil(item.n / item.per) || 0;
        for (j = 0; j < item.n; j++) {
          var r = Math.floor(j / item.per), c = j % item.per;
          var inRow = Math.min(item.per, item.n - r * item.per);
          bx = x + cw / 2 - (inRow * item.w - 4) / 2 + c * item.w;
          s += G(item.draw(), { transform: "translate(" + num(bx) + "," + num(by - (rows - r) * (item.k === "ones" ? 17 : 42)) + ")" });
        }
      }
      if (lab) s += caption(w, h - 22, lab, 26);
      return card(w, h, s);
    }

    /* ---- tally marks ------------------------------------------------------
       Four standing and one across, because that is how a five is counted. */
    function tally(n, o) {
      o = options("tally", o);
      whole("tally", "n", n, 0, 50);
      var gh = 46, pitch = 11, gw = 3 * pitch + 14, ggap = 24, perRow = 5, edge = 22;
      var groups = Math.ceil(n / 5) || 0, rows = Math.max(1, Math.ceil(groups / perRow));
      var lab = labelOf(o, String(n));
      var w = 2 * edge + perRow * gw + (perRow - 1) * ggap;
      var h = edge + rows * (gh + 20) - 20 + edge + (lab ? 34 : 0), s = "", g, i, x, y, k;
      for (g = 0; g < groups; g++) {
        k = Math.min(5, n - g * 5);
        x = edge + (g % perRow) * (gw + ggap); y = edge + Math.floor(g / perRow) * (gh + 20);
        for (i = 0; i < Math.min(k, 4); i++) s += L(x + i * pitch, y, x + i * pitch, y + gh, C.teal, 5.5);
        if (k === 5) s += L(x - 6, y + gh - 4, x + 3 * pitch + 6, y + 4, C.teal, 5.5);
      }
      if (lab) s += caption(w, h - 22, lab, 26);
      return card(w, h, s);
    }

    /* ---- the bar chart ----------------------------------------------------
       A scale that goes up in equal steps, labelled bars, and the value
       written on top of each one. */
    function niceStep(max, want) {
      var raw = max / want, pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / pow;
      return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
    }
    function barChart(o) {
      o = options("barChart", o);
      var bars = listOf("barChart", "bars", o.bars, 1, 8), i, vals = [], labs = [], top = 0, b;
      for (i = 0; i < bars.length; i++) {
        b = bars[i];
        if (b == null || typeof b !== "object") bad("barChart", "every bar is an object with label and value, got " + JSON.stringify(b));
        number("barChart", "every bar value", b.value, 0, 100000);
        if (b.label == null) bad("barChart", "bar " + i + " has no label");
        vals.push(b.value); labs.push(String(b.label)); top = Math.max(top, b.value);
      }
      if (top <= 0) top = 1;
      var step = o.step == null ? niceStep(top, 4) : number("barChart", "step", o.step, 0.001, 100000);
      var max = o.max == null ? Math.ceil(top / step) * step : number("barChart", "max", o.max, top, 100000);
      var lines = Math.round(max / step);
      if (lines > 12) bad("barChart", "that scale is " + lines + " steps tall; a film can read up to 12");
      var W = 540, edge = 22, gut = 52, plotH = 210, title = o.title == null ? null : String(o.title);
      var x0 = edge + gut, x1 = W - edge, y0 = edge + (title ? 34 : 6), y1 = y0 + plotH;
      var lab = labelOf(o, null);
      var h = y1 + 40 + edge + (lab ? 30 : 0), s = "", v, bw = Math.min(58, (x1 - x0) / bars.length - 14);
      var pitch = (x1 - x0) / bars.length;
      if (title) s += N(W / 2, edge + 14, title, 23, C.ink);
      for (i = 0; i <= lines; i++) {
        v = y1 - (i / lines) * plotH;
        s += L(x0, v, x1, v, i ? C.line : C.ink, i ? 1.5 : 3, { "stroke-linecap": "butt" });
        s += N(x0 - 12, v, String(Math.round(i * step * 100) / 100), 16, C.muted, { anchor: "end" });
      }
      s += L(x0, y0 - 6, x0, y1, C.ink, 3);
      for (i = 0; i < bars.length; i++) {
        var bh = (vals[i] / max) * plotH, cx = x0 + pitch * (i + 0.5), hot = o.highlight === i;
        s += R(cx - bw / 2, y1 - bh, bw, bh, 7, hot ? C.accent : C.teal);
        if (o.values !== false) s += N(cx, y1 - bh - 16, String(Math.round(vals[i] * 100) / 100), 19, hot ? C.accent : C.ink);
        s += T(cx, y1 + 22, labs[i], { size: 17, fill: C.muted });
      }
      if (lab) s += caption(W, h - 20, lab, 23);
      return card(W, h, s);
    }

    /* ---- the pictogram ----------------------------------------------------
       Rows of one repeated picture, and a key saying what one of them is
       worth. Circles may be halved; the other shapes may not, so a count that
       does not divide is refused rather than rounded. */
    function pictoGlyph(kind, half) {
      if (kind === "circle") {
        return half
          ? Pth("M0,-14 A14,14 0 0,0 0,14 Z", C.teal, C.teal, 2) + Ci(0, 0, 14, "none", C.teal, 2)
          : Ci(0, 0, 14, C.teal);
      }
      if (kind === "star") {
        var d = "", i, a, r;
        for (i = 0; i < 10; i++) {
          a = (i * 36 - 90) * Math.PI / 180; r = i % 2 ? 6.6 : 15;
          d += (i ? " L" : "M") + num(r * Math.cos(a)) + "," + num(r * Math.sin(a));
        }
        return Pth(d + " Z", C.gold, C.gold, 1.5);
      }
      return Ci(0, -8, 6.5, C.plum) + Pth("M-9,14 C-9,1 9,1 9,14 Z", C.plum, C.plum, 2);
    }
    function pictogram(o) {
      o = options("pictogram", o);
      var rows = listOf("pictogram", "rows", o.rows, 1, 6), i, j, r;
      var kind = o.shape == null ? "circle" : String(o.shape);
      if (kind !== "circle" && kind !== "star" && kind !== "person")
        bad("pictogram", "shape is circle, star or person, got " + JSON.stringify(o.shape));
      var each = o.each == null ? 1 : number("pictogram", "each", o.each, 0.5, 1000);
      var counts = [], labs = [], most = 0;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        if (r == null || typeof r !== "object") bad("pictogram", "every row is an object with label and count, got " + JSON.stringify(r));
        number("pictogram", "every row count", r.count, 0, 100000);
        if (r.label == null) bad("pictogram", "row " + i + " has no label");
        var g = r.count / each;
        if (Math.abs(g * 2 - Math.round(g * 2)) > 1e-6)
          bad("pictogram", "a count of " + r.count + " is not a whole or half number of pictures when each is " + each);
        if (kind !== "circle" && Math.abs(g - Math.round(g)) > 1e-6)
          bad("pictogram", "a count of " + r.count + " with each " + each + " is " + (Math.round(g * 10) / 10) +
            " pictures, and only a circle can be drawn as half of one");
        if (g > 10) bad("pictogram", "that is " + g + " pictures in one row; a film can read up to 10, so raise each");
        counts.push(g); labs.push(String(r.label)); most = Math.max(most, Math.ceil(g));
      }
      var edge = 22, gut = 118, pitch = 36, rowH = 42, title = o.title == null ? null : String(o.title);
      var W = edge + gut + Math.max(most, 3) * pitch + edge;
      var y0 = edge + (title ? 34 : 4);
      var lab = labelOf(o, null);
      var h = y0 + rows.length * rowH + 48 + edge + (lab ? 28 : 0), s = "", y;
      if (title) s += N(W / 2, edge + 14, title, 23, C.ink);
      for (i = 0; i < rows.length; i++) {
        y = y0 + i * rowH + rowH / 2;
        s += T(edge + gut - 14, y, labs[i], { size: 18, fill: C.muted, anchor: "end" });
        for (j = 0; j < Math.floor(counts[i]); j++)
          s += G(pictoGlyph(kind, false), { transform: "translate(" + num(edge + gut + pitch * j + 17) + "," + num(y) + ")" });
        if (counts[i] > Math.floor(counts[i]))
          s += G(pictoGlyph(kind, true), { transform: "translate(" + num(edge + gut + pitch * Math.floor(counts[i]) + 17) + "," + num(y) + ")" });
      }
      y = y0 + rows.length * rowH + 22;
      s += L(edge, y - 8, W - edge, y - 8, C.line, 2, { "stroke-linecap": "butt" });
      s += G(pictoGlyph(kind, false), { transform: "translate(" + num(edge + 20) + "," + num(y + 14) + ")" });
      /* key: the word for what ONE picture is worth. Give it two words,
         ["book", "books"], and the right one is used for the count. */
      var keyWord = "";
      if (Array.isArray(o.key)) {
        listOf("pictogram", "key", o.key, 2, 2);
        keyWord = " " + String(each === 1 ? o.key[0] : o.key[1]);
      } else if (o.key != null) keyWord = " " + String(o.key);
      s += T(edge + 42, y + 14, "= " + (Math.round(each * 100) / 100) + keyWord, { size: 18, fill: C.muted, anchor: "start" });
      if (lab) s += caption(W, h - 18, lab, 22);
      return card(W, h, s);
    }

    /* ---- the pan balance --------------------------------------------------
       Level when the two sides are equal, tipped towards the heavier one. Two
       numbers decide the tilt themselves; anything else needs to be told. */
    function balance(left, right, o) {
      o = options("balance", o);
      if (left == null || right == null) bad("balance", "it needs something in each pan, got " + JSON.stringify(left) + " and " + JSON.stringify(right));
      var nums = typeof left === "number" && typeof right === "number";
      var tilt = o.tilt;
      if (tilt != null && tilt !== "left" && tilt !== "right" && tilt !== "level")
        bad("balance", "tilt is left, right or level, got " + JSON.stringify(tilt));
      if (tilt == null) {
        if (!nums) bad("balance", "it can only work the tilt out from two numbers, so tell it tilt: left, right or level");
        tilt = left > right ? "left" : left < right ? "right" : "level";
      }
      var a = tilt === "level" ? 0 : tilt === "right" ? 9 : -9, rad = (a * Math.PI) / 180;
      var W = 540, px = W / 2, py = 74, arm = 158, edge = 20;
      var lab = labelOf(o, null), h = 252 + (lab ? 30 : 0), s = "";
      s += Pth("M" + num(px - 26) + ",200 L" + num(px) + "," + num(py) + " L" + num(px + 26) + ",200 Z", C.cell, C.muted, 2.5);
      s += R(px - 62, 200, 124, 16, 8, C.muted);
      /* The two strings run from the end of the beam itself to the rim of the
         dish, so the pan is always hanging from the beam however far it tips,
         and what is in the pan is drawn IN the pan. */
      function pan(sign, what, tone) {
        var ex = px + sign * arm * Math.cos(rad), ey = py + sign * arm * Math.sin(rad);
        var dy = ey + 48, g = "";
        g += L(ex, ey, ex - 54, dy, C.muted, 2.5) + L(ex, ey, ex + 54, dy, C.muted, 2.5);
        g += Pth("M" + num(ex - 56) + "," + num(dy) + " L" + num(ex + 56) + "," + num(dy) +
          " L" + num(ex + 40) + "," + num(dy + 42) + " L" + num(ex - 40) + "," + num(dy + 42) + " Z", tone[0], tone[1], 3);
        g += N(ex, dy + 20, String(what), 26, tone[1]);
        return g;
      }
      s += L(px - arm * Math.cos(rad), py - arm * Math.sin(rad), px + arm * Math.cos(rad), py + arm * Math.sin(rad), C.ink, 9);
      s += pan(-1, left, [C.tealSoft, C.teal]);
      s += pan(1, right, [C.accentSoft, C.accent]);
      s += Ci(px, py, 8, C.ink);
      if (lab) s += caption(W, h - 20, lab, 23);
      return card(W, h, s);
    }

    /* ---- the ruler --------------------------------------------------------
       The thing sits above the ruler with its ends dropped onto the scale, so
       that measuring is lining up and reading off, not counting marks. */
    function ruler(o) {
      o = options("ruler", o);
      var len = o.length == null ? 10 : whole("ruler", "length", o.length, 2, 20);
      var unit = o.unit == null ? "cm" : String(o.unit);
      var pitch = len <= 10 ? 42 : Math.floor(440 / len);
      /* the side margin holds the 0 and the last number, which are centred on
         the ruler's own ends and so hang half outside it */
      var edge = 34, item = o.item == null ? null : o.item, top = item ? 62 : 8;
      if (item != null && (typeof item !== "object" || Array.isArray(item)))
        bad("ruler", "item is an object with from and to, got " + JSON.stringify(item));
      var a = 0, b = 0, ic = C.teal;
      if (item) {
        a = number("ruler", "the from of item", item.from == null ? 0 : item.from, 0, len);
        b = number("ruler", "the to of item", item.to, 0, len);
        if (b <= a) bad("ruler", "the item must end past where it starts, got " + a + " to " + b);
        ic = colour("ruler", item.colour, C.teal);
      }
      var W = 2 * edge + len * pitch, ry = top + 8, rh = 66;
      var lab = labelOf(o, null), h = ry + rh + 16 + edge + (lab ? 30 : 0), s = "", i, x;
      function X(v) { return edge + v * pitch; }
      s += R(edge, ry, len * pitch, rh, 7, C.goldSoft, C.gold, 2.5);
      for (i = 0; i <= len * 2; i++) {
        x = edge + (i / 2) * pitch;
        var isCm = i % 2 === 0;
        s += L(x, ry, x, ry + (isCm ? 22 : 13), C.ink, isCm ? 2.5 : 1.8, { "stroke-linecap": "butt" });
        if (isCm) s += N(x, ry + 37, String(i / 2), 17, C.ink);
      }
      /* the unit sits under the numbers, at the left, where no end number is */
      s += T(edge + 26, ry + 57, unit, { size: 15, fill: C.muted, anchor: "start" });
      if (item) {
        s += R(X(a), top - 48, X(b) - X(a), 40, 10, C.tealSoft, ic, 3);
        s += N((X(a) + X(b)) / 2, top - 28, item.label == null ? (Math.round((b - a) * 100) / 100) + " " + unit : String(item.label), 21, ic);
        s += L(X(a), top - 6, X(a), ry + 26, ic, 2, { "stroke-dasharray": "5 4" });
        s += L(X(b), top - 6, X(b), ry + 26, ic, 2, { "stroke-dasharray": "5 4" });
      }
      if (lab) s += caption(W, h - 20, lab, 23);
      return card(W, h, s);
    }

    /* ---- flat shapes ------------------------------------------------------
       Sides counted at their middles, corners dotted, and the right angles
       marked where a shape has any - asking for them where there are none is
       a mistake worth being told about. */
    var SHAPES = {
      square: [[-84, -84], [84, -84], [84, 84], [-84, 84]],
      rectangle: [[-104, -64], [104, -64], [104, 64], [-104, 64]],
      triangle: [[0, -92], [92, 76], [-92, 76]],
      pentagon: null, hexagon: null, circle: null
    };
    function regular(n, r) {
      var pts = [], i, a;
      for (i = 0; i < n; i++) { a = ((i / n) * 360 - 90) * Math.PI / 180; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
      return pts;
    }
    function shape2d(kind, o) {
      o = options("shape2d", o);
      var k = String(kind);
      if (!Object.prototype.hasOwnProperty.call(SHAPES, k))
        bad("shape2d", "kind is one of " + Object.keys(SHAPES).join(", ") + ", got " + JSON.stringify(kind));
      var pts = k === "pentagon" ? regular(5, 94) : k === "hexagon" ? regular(6, 92) : SHAPES[k];
      var fill = colour("shape2d", o.fill, C.tealSoft), edgeC = colour("shape2d", o.colour, C.teal);
      var W = 276, cx = W / 2, cy = 132, s = "", i, d = "";
      var lab = labelOf(o, k), h = cy + 122 + (lab ? 34 : 0);
      if (o.rightAngles && k !== "square" && k !== "rectangle")
        bad("shape2d", "a " + k + " as drawn here has no right angles to mark");
      if (pts) {
        for (i = 0; i < pts.length; i++) d += (i ? " L" : "M") + num(cx + pts[i][0]) + "," + num(cy + pts[i][1]);
        s += Pth(d + " Z", fill, edgeC, 3.5);
      } else {
        s += Ci(cx, cy, 94, fill, edgeC, 3.5);
      }
      if (o.rightAngles) {
        for (i = 0; i < pts.length; i++) {
          var sx = pts[i][0] > 0 ? -1 : 1, sy = pts[i][1] > 0 ? -1 : 1;
          s += Pth("M" + num(cx + pts[i][0] + sx * 20) + "," + num(cy + pts[i][1]) +
            " L" + num(cx + pts[i][0] + sx * 20) + "," + num(cy + pts[i][1] + sy * 20) +
            " L" + num(cx + pts[i][0]) + "," + num(cy + pts[i][1] + sy * 20), null, C.accent, 3);
        }
      }
      if (o.sides) {
        if (!pts) bad("shape2d", "a circle has no sides to count");
        for (i = 0; i < pts.length; i++) {
          var j = (i + 1) % pts.length;
          var mx = cx + (pts[i][0] + pts[j][0]) / 2, my = cy + (pts[i][1] + pts[j][1]) / 2;
          var ln = Math.hypot(mx - cx, my - cy) || 1;
          mx += ((mx - cx) / ln) * 22; my += ((my - cy) / ln) * 22;
          s += Ci(mx, my, 15, C.card, C.accent, 2.5) + N(mx, my, String(i + 1), 18, C.accent);
        }
      }
      if (o.corners) {
        if (!pts) bad("shape2d", "a circle has no corners to mark");
        for (i = 0; i < pts.length; i++) s += Ci(cx + pts[i][0], cy + pts[i][1], 8, C.plum, C.card, 2.5);
      }
      if (lab) s += caption(W, h - 22, lab, 24);
      return card(W, h, s);
    }

    /* ---- the squared grid -------------------------------------------------
       Cells to fill for area, or numbered edges and plotted points for
       coordinates - along first, then up, as the lessons say. */
    function grid(o) {
      o = options("grid", o);
      var cols = whole("grid", "cols", o.cols, 1, 12), rows = whole("grid", "rows", o.rows, 1, 12);
      var cell = o.cell == null ? 36 : number("grid", "cell", o.cell, 18, 60);
      var fill = colour("grid", o.colour, C.gold), edge = 22, gut = o.coords ? 36 : 0;
      var on = {}, i, j, n = 0;
      if (Array.isArray(o.fill)) {
        for (i = 0; i < o.fill.length; i++) {
          var f = o.fill[i];
          if (!Array.isArray(f) || f.length !== 2) bad("grid", "every filled cell is a pair like [col, row], got " + JSON.stringify(f));
          whole("grid", "a filled cell column", f[0], 0, cols - 1);
          whole("grid", "a filled cell row", f[1], 0, rows - 1);
          on[f[0] + "," + f[1]] = true;
        }
        n = o.fill.length;
      } else if (o.fill != null) {
        n = whole("grid", "fill", o.fill, 0, cols * rows);
        for (i = 0; i < n; i++) on[(i % cols) + "," + Math.floor(i / cols)] = true;
      }
      if (o.numbers && o.coords)
        bad("grid", "a 100 square and a coordinate grid are different pictures: ask for numbers or for coords, not both");
      if (o.numbers && cols * rows > 100)
        bad("grid", "that is " + cols * rows + " numbered squares; a film can read up to 100");
      if (o.numbers && cell < 26)
        bad("grid", "a numbered square needs a cell of 26 or more, got " + cell);
      var gx = edge + gut, gy = edge, gw = cols * cell, gh = rows * cell;
      var lab = labelOf(o, n && !o.coords ? n + (n === 1 ? " square" : " squares") : null);
      var W = gx + gw + edge, h = gy + gh + gut + edge + (lab ? 30 : 0), s = "";
      for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
        var lit = !!on[i + "," + j];
        s += R(gx + i * cell, gy + j * cell, cell, cell, 0, lit ? fill : C.card);
        /* a 100 square: 1 to 100 written in, counting along the top row first */
        if (o.numbers) s += N(gx + i * cell + cell / 2, gy + j * cell + cell / 2,
          String(j * cols + i + 1), cell * 0.42, lit ? C.ink : C.muted);
      }
      for (i = 0; i <= cols; i++) s += L(gx + i * cell, gy, gx + i * cell, gy + gh, C.line, 1.6, { "stroke-linecap": "butt" });
      for (j = 0; j <= rows; j++) s += L(gx, gy + j * cell, gx + gw, gy + j * cell, C.line, 1.6, { "stroke-linecap": "butt" });
      if (o.coords) {
        s += L(gx, gy + gh, gx + gw, gy + gh, C.ink, 3) + L(gx, gy, gx, gy + gh, C.ink, 3);
        for (i = 0; i <= cols; i++) s += N(gx + i * cell, gy + gh + 20, String(i), 16, C.muted);
        for (j = 0; j <= rows; j++) s += N(gx - 18, gy + gh - j * cell, String(j), 16, C.muted);
        var pts = o.points == null ? [] : listOf("grid", "points", o.points, 0, 6);
        for (i = 0; i < pts.length; i++) {
          var p = pts[i];
          if (p == null || typeof p !== "object") bad("grid", "every point is an object with x and y, got " + JSON.stringify(p));
          whole("grid", "the x of a point", p.x, 0, cols);
          whole("grid", "the y of a point", p.y, 0, rows);
          var px = gx + p.x * cell, py = gy + gh - p.y * cell, pc = colour("grid", p.colour, C.accent);
          if (p.guides) {
            s += L(gx, py, px, py, C.teal, 2, { "stroke-dasharray": "5 4" });
            s += L(px, gy + gh, px, py, C.teal, 2, { "stroke-dasharray": "5 4" });
          }
          s += Ci(px, py, 9, pc, C.card, 3);
          if (p.label != null) s += N(px + 14, py - 17, String(p.label), 18, pc, { anchor: "start" });
        }
      } else {
        s += R(gx, gy, gw, gh, 0, "none", C.ink, 3);
      }
      if (lab) s += caption(W, h - 20, lab, 23);
      return card(W, h, s);
    }

    /* ---- a growing pattern ------------------------------------------------
       The terms in a row with one of them missing, and, if asked, what is done
       to get from each to the next. */
    function sequence(o) {
      o = options("sequence", o);
      var terms = listOf("sequence", "terms", o.terms, 2, 8), i, missing = 0;
      for (i = 0; i < terms.length; i++) {
        if (terms[i] === null) { missing++; continue; }
        if (typeof terms[i] !== "number" && typeof terms[i] !== "string")
          bad("sequence", "every term is a number, a string, or null for the missing one, got " + JSON.stringify(terms[i]));
      }
      if (missing > 2) bad("sequence", "that hides " + missing + " terms; a pattern a child can see hides one or two");
      var arrows = !!o.arrows, step = o.step;
      if (arrows && step == null) {
        for (i = 1; i < terms.length; i++) {
          if (typeof terms[i] === "number" && typeof terms[i - 1] === "number") { step = terms[i] - terms[i - 1]; break; }
        }
        if (step == null) bad("sequence", "it cannot see the step between these terms, so give it step");
      }
      if (step != null) number("sequence", "step", step, -10000, 10000);
      var box = 68, gap = arrows ? 50 : 18, edge = 22, top = arrows ? 42 : 22;
      var W = 2 * edge + terms.length * box + (terms.length - 1) * gap;
      var lab = labelOf(o, null), h = top + box + 22 + (lab ? 30 : 0), s = "", x;
      for (i = 0; i < terms.length; i++) {
        x = edge + i * (box + gap);
        if (terms[i] === null) {
          s += R(x, top, box, box, 14, C.card, C.accent, 3.5, { "stroke-dasharray": "9 6" });
          s += N(x + box / 2, top + box / 2, "?", 34, C.accent);
        } else {
          s += R(x, top, box, box, 14, C.tealSoft, C.teal, 2.5);
          s += N(x + box / 2, top + box / 2, String(terms[i]), 30, C.ink);
        }
        if (arrows && i) {
          var ax = x - gap + 6, bx = x - 6, my = top + box / 2;
          s += Pth("M" + num(ax) + "," + num(my) + " L" + num(bx - 8) + "," + num(my), null, C.teal, 3);
          s += head(bx, my, 0, C.teal, 6.5);
          s += N((ax + bx) / 2, top - 18, (step > 0 ? "+" : "") + step, 20, C.teal);
        }
      }
      if (lab) s += caption(W, h - 18, lab, 23);
      return card(W, h, s);
    }

    /* ---- the spinner ------------------------------------------------------ */
    var SECTOR = [[C.tealSoft, C.teal], [C.accentSoft, C.accent], [C.plumSoft, C.plum], [C.goldSoft, C.gold],
                  [C.goodSoft, C.good], [C.badSoft, C.bad], [C.cell, C.muted], [C.card, C.ink]];
    function spinner(o) {
      o = options("spinner", o);
      var labs = [], i;
      if (typeof o.parts === "number") {
        whole("spinner", "parts", o.parts, 2, 8);
        for (i = 0; i < o.parts; i++) labs.push(String(i + 1));
      } else {
        var ps = listOf("spinner", "parts", o.parts, 2, 8);
        for (i = 0; i < ps.length; i++) {
          if (typeof ps[i] === "string" || typeof ps[i] === "number") labs.push(String(ps[i]));
          else if (ps[i] && typeof ps[i] === "object" && ps[i].label != null) labs.push(String(ps[i].label));
          else bad("spinner", "every part is a word or an object with label, got " + JSON.stringify(ps[i]));
        }
      }
      var n = labs.length, pointer = o.pointer == null ? 0 : whole("spinner", "pointer", o.pointer, 0, n - 1);
      var W = 248, cx = W / 2, cy = 128, r = 106, s = "", a0, a1, mid, tone;
      var title = o.title == null ? null : String(o.title);
      var h = cy + r + 26 + (title ? 34 : 0);
      for (i = 0; i < n; i++) {
        a0 = ((i / n) * 360 - 90) * Math.PI / 180; a1 = (((i + 1) / n) * 360 - 90) * Math.PI / 180;
        tone = SECTOR[i % SECTOR.length];
        s += Pth("M" + num(cx) + "," + num(cy) + " L" + num(cx + r * Math.cos(a0)) + "," + num(cy + r * Math.sin(a0)) +
          " A" + r + "," + r + " 0 " + (1 / n > 0.5 ? 1 : 0) + ",1 " + num(cx + r * Math.cos(a1)) + "," + num(cy + r * Math.sin(a1)) + " Z",
          tone[0], C.ink, 2.5);
      }
      for (i = 0; i < n; i++) {
        mid = (((i + 0.5) / n) * 360 - 90) * Math.PI / 180;
        tone = SECTOR[i % SECTOR.length];
        s += N(cx + r * 0.74 * Math.cos(mid), cy + r * 0.74 * Math.sin(mid), labs[i], n > 6 ? 16 : 19, tone[1]);
      }
      s += Ci(cx, cy, r, "none", C.ink, 3.5);
      /* The needle stops short of the labels: pointing at a part must not mean
         covering up what the part says. */
      mid = (((pointer + 0.5) / n) * 360 - 90) * Math.PI / 180;
      s += L(cx, cy, cx + r * 0.46 * Math.cos(mid), cy + r * 0.46 * Math.sin(mid), C.ink, 6);
      s += head(cx + r * 0.54 * Math.cos(mid), cy + r * 0.54 * Math.sin(mid), (mid * 180) / Math.PI, C.ink, 9);
      s += Ci(cx, cy, 9, C.ink);
      if (title) s += caption(W, h - 20, title, 23);
      return card(W, h, s);
    }


    /* ---- the written method ------------------------------------------------
       A column calculation as the lesson draws it (grade-3-app/adding-and-money
       .colsum): the digits under their own place headings, the rule line, and
       the carry or the exchange written where a child writes it. The working
       is computed here, so a film cannot show a carry the sum does not have. */
    var PLACES = ["O", "T", "H", "Th"];
    function digitsOf(v, n) {
      var s = String(v), out = [], i;
      for (i = 0; i < n; i++) out.push(i < s.length ? s.charAt(s.length - 1 - i) : null);
      return out;                                   /* out[0] is the ones */
    }
    function columnSum(o) {
      o = options("columnSum", o);
      var op = o.op == null ? "+" : String(o.op);
      if (op !== "+" && op !== "-" && op !== "x")
        bad("columnSum", "op is +, - or x, got " + JSON.stringify(o.op));
      var a = whole("columnSum", "a", o.a, 0, 9999);
      var b = whole("columnSum", "b", o.b, op === "x" ? 2 : 0, op === "x" ? 9 : 9999);
      if (op === "-" && b > a)
        bad("columnSum", "a column subtraction writes the larger number on top, and " + a + " is less than " + b);
      var total = op === "+" ? a + b : op === "-" ? a - b : a * b;
      var cols = Math.max(String(a).length, op === "-" ? 1 : String(total).length, op === "x" ? 1 : String(b).length);
      if (cols > 4) bad("columnSum", "that is " + cols + " columns; a film can read up to 4 (thousands)");
      var da = digitsOf(a, cols), db = digitsOf(b, cols), dt = digitsOf(total, cols);
      /* the working, column by column from the ones */
      var carry = [], lend = [], borrow = [], i, s, c = 0, top = da.slice();
      if (op === "+" || op === "x") {
        for (i = 0; i < cols; i++) {
          s = (op === "+" ? Number(da[i] || 0) + Number(db[i] || 0) : Number(da[i] || 0) * b) + c;
          c = Math.floor(s / 10);
          carry[i + 1] = c || null;                 /* written above the NEXT column */
        }
      } else {
        for (i = 0; i < cols; i++) {
          if (Number(top[i] || 0) < Number(db[i] || 0)) {
            var k = i + 1;
            while (k < cols && Number(top[k] || 0) === 0) { top[k] = "9"; lend[k] = true; k++; }
            if (k < cols) { lend[k] = true; top[k] = String(Number(top[k]) - 1); }
            borrow[i] = true;
          }
        }
      }
      var showCarry = o.carries !== false && (op === "+" || op === "x");
      var showEx = o.exchanges !== false && op === "-";
      var ans = o.answer === false ? null : (typeof o.answer === "number" ? digitsOf(whole("columnSum", "answer", o.answer, 0, 99999), cols) : dt);
      var hi = o.highlight == null ? null : whole("columnSum", "highlight", o.highlight, 0, cols - 1);
      var COL = 58, edge = 22, W = 2 * edge + (cols + 1) * COL;
      var yH = 26, yC = 58, yA = 104, yB = 162, yR = 194, yAns = 226;
      var lab = labelOf(o, null), h = yAns + 34 + (lab ? 28 : 0), sVg = "";
      function xAt(i) { return W - edge - COL / 2 - i * COL; }
      if (hi != null) sVg += R(xAt(hi) - COL / 2 + 3, yH - 16, COL - 6, yR - yH + 24, 12, C.accentSoft, C.accent, 2);
      for (i = 0; i < cols; i++) {
        if (o.headings !== false) sVg += T(xAt(i), yH, PLACES[i], { size: 13, fill: C.muted });
        /* the row shows what was WRITTEN DOWN; an exchange strikes it and puts
           what it became above, which is where a child writes it */
        if (da[i] != null) sVg += N(xAt(i), yA, da[i], 38, lend[i] ? C.muted : C.ink);
        if (lend[i]) {
          sVg += L(xAt(i) - 17, yA + 15, xAt(i) + 17, yA - 15, C.accent, 2.5);
          sVg += N(xAt(i), yA - 34, top[i], 22, C.accent);
        }
        if (showEx && borrow[i]) sVg += N(xAt(i) - 26, yA - 16, "1", 20, C.accent);
        if (db[i] != null && op !== "x") sVg += N(xAt(i), yB, db[i], 38, C.ink);
        if (showCarry && carry[i]) sVg += N(xAt(i) - 20, yC, String(carry[i]), 20, C.accent);
        if (ans && ans[i] != null) sVg += N(xAt(i), yAns, ans[i], 38, C.good);
      }
      if (op === "x") sVg += N(xAt(0), yB, String(b), 38, C.ink);
      sVg += N(xAt(cols - 1) - COL, op === "x" ? yB : yB, op === "x" ? "×" : op === "-" ? "−" : "+", 32, C.muted);
      sVg += L(edge + 10, yR, W - edge - 10, yR, C.ink, 3, { "stroke-linecap": "butt" });
      sVg += L(edge + 10, yAns + 26, W - edge - 10, yAns + 26, C.ink, 2.5, { "stroke-linecap": "butt" });
      if (lab) sVg += caption(W, h - 18, lab, 22);
      return card(W, h, sVg);
    }

    /* ---- one month --------------------------------------------------------
       A film has no clock, so the month is told which weekday it starts on
       rather than working it out: start 0 is Monday, as the lesson's week
       begins. */
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"];
    var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    function calendar(o) {
      o = options("calendar", o);
      var mi;
      if (typeof o.month === "number") mi = whole("calendar", "month", o.month, 1, 12) - 1;
      else if (typeof o.month === "string") {
        mi = -1;
        for (var q = 0; q < 12; q++) if (MONTHS[q].toLowerCase() === o.month.toLowerCase()) mi = q;
        if (mi < 0) bad("calendar", "month is 1 to 12 or a month name, got " + JSON.stringify(o.month));
      } else bad("calendar", "it needs a month, 1 to 12 or a name");
      var days = o.days == null ? (mi === 1 && o.leap ? 29 : MONTH_DAYS[mi]) : whole("calendar", "days", o.days, 28, 31);
      var start = o.start == null ? 0 : whole("calendar", "start", o.start, 0, 6);
      var marks = {}, i, m, mc;
      var list = o.mark == null ? [] : (Array.isArray(o.mark) ? o.mark : [o.mark]);
      listOf("calendar", "mark", list, 0, 12);
      for (i = 0; i < list.length; i++) {
        m = typeof list[i] === "number" ? { date: list[i] } : list[i];
        if (m == null || typeof m !== "object") bad("calendar", "every mark is a date or an object with date, got " + JSON.stringify(list[i]));
        whole("calendar", "a marked date", m.date, 1, days);
        marks[m.date] = colour("calendar", m.colour, C.accent);
      }
      var cw = 52, ch = 44, edge = 20, headY = 34, weekY = 74, gridY = 92;
      var rows = Math.ceil((start + days) / 7);
      var W = 2 * edge + 7 * cw;
      var lab = labelOf(o, null), h = gridY + rows * ch + 14 + edge + (lab ? 28 : 0), s = "";
      s += N(W / 2, headY, MONTHS[mi] + (o.year == null ? "" : " " + o.year), 26, C.ink);
      for (i = 0; i < 7; i++) s += T(edge + i * cw + cw / 2, weekY, WEEK[i], { size: 14, fill: C.muted });
      for (i = 0; i < days; i++) {
        var cell = start + i, x = edge + (cell % 7) * cw, y = gridY + Math.floor(cell / 7) * ch;
        mc = marks[i + 1];
        if (mc) s += R(x + 3, y + 2, cw - 6, ch - 6, 11, C.accentSoft, mc, 2.5);
        else s += R(x + 3, y + 2, cw - 6, ch - 6, 11, C.cell);
        s += N(x + cw / 2, y + (ch - 4) / 2, String(i + 1), 20, mc ? mc : C.ink);
      }
      if (lab) s += caption(W, h - 18, lab, 22);
      return card(W, h, s);
    }

    /* ---- the compass ------------------------------------------------------
       Four points or eight, the direction being faced, and the turn that takes
       it to another one - a quarter, a half or three quarters, either way
       round, drawn as the arc a child sweeps with a finger. */
    var POINTS8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    var TURN_WORDS = { 1: "a quarter turn", 2: "a half turn", 3: "three quarter turns" };
    function compass(o) {
      o = options("compass", o);
      var pts = o.points == null ? 4 : whole("compass", "points", o.points, 4, 8);
      if (pts !== 4 && pts !== 8) bad("compass", "points is 4 or 8, got " + pts);
      var step = pts === 4 ? 2 : 1, shown = [], i;
      for (i = 0; i < 8; i += step) shown.push(i);
      var facing = o.facing == null ? "N" : String(o.facing).toUpperCase();
      var fi = POINTS8.indexOf(facing);
      if (fi < 0 || shown.indexOf(fi) < 0)
        bad("compass", "facing is one of " + shown.map(function (k) { return POINTS8[k]; }).join(", ") + ", got " + JSON.stringify(o.facing));
      var turn = o.turn == null ? null : o.turn;
      var ti = fi, quarters = 0, way = "clockwise";
      if (turn != null) {
        if (typeof turn !== "object" || Array.isArray(turn)) bad("compass", "turn is an object with quarters and way, got " + JSON.stringify(turn));
        quarters = whole("compass", "the quarters of a turn", turn.quarters, 1, 3);
        way = turn.way == null ? "clockwise" : String(turn.way);
        if (way !== "clockwise" && way !== "anticlockwise")
          bad("compass", "the way of a turn is clockwise or anticlockwise, got " + JSON.stringify(turn.way));
        ti = (((fi + (way === "clockwise" ? 2 : -2) * quarters) % 8) + 8) % 8;
      }
      var W = 292, cx = W / 2, cy = 150, r = 104, s = "";
      var lab = labelOf(o, turn ? TURN_WORDS[quarters] + " " + way : null);
      var h = cy + r + 40 + (lab ? 30 : 0);
      function ang(k) { return ((k * 45 - 90) * Math.PI) / 180; }
      s += Ci(cx, cy, r, C.card, C.line, 2.5);
      for (i = 0; i < shown.length; i++) {
        var k = shown[i], A = ang(k), main = k % 2 === 0;
        s += L(cx + (r - 14) * Math.cos(A), cy + (r - 14) * Math.sin(A), cx + r * Math.cos(A), cy + r * Math.sin(A), C.line, main ? 3 : 2);
        s += N(cx + (r + 19) * Math.cos(A), cy + (r + 19) * Math.sin(A), POINTS8[k], main ? 23 : 16, main ? C.ink : C.muted);
      }
      if (turn) {
        /* the arc from where it faces to where it ends, the short way round */
        var a0 = ang(fi), a1 = ang(ti), rr = r * 0.62, sweep = way === "clockwise" ? 1 : 0;
        var big = quarters === 3 ? 1 : 0;
        s += Pth("M" + num(cx + rr * Math.cos(a0)) + "," + num(cy + rr * Math.sin(a0)) +
          " A" + num(rr) + "," + num(rr) + " 0 " + big + "," + sweep + " " +
          num(cx + rr * Math.cos(a1)) + "," + num(cy + rr * Math.sin(a1)), null, C.teal, 4);
        s += head(cx + rr * Math.cos(a1), cy + rr * Math.sin(a1),
          ((a1 * 180) / Math.PI) + (way === "clockwise" ? 90 : -90), C.teal, 8);
        s += Ci(cx + r * 0.94 * Math.cos(a1), cy + r * 0.94 * Math.sin(a1), 9, C.teal, C.card, 3);
      }
      s += L(cx, cy, cx + r * 0.78 * Math.cos(ang(fi)), cy + r * 0.78 * Math.sin(ang(fi)), C.accent, 6);
      s += head(cx + r * 0.86 * Math.cos(ang(fi)), cy + r * 0.86 * Math.sin(ang(fi)), (ang(fi) * 180) / Math.PI, C.accent, 10);
      s += Ci(cx, cy, 9, C.accent);
      if (lab) s += caption(W, h - 20, lab, 22);
      return card(W, h, s);
    }

    /* ---- lines of symmetry ------------------------------------------------
       The mirror lines a shape really has, as angles measured from upright, in
       the order a lesson reveals them. A film may draw the first k of them, so
       that one line arrives at a time. */
    var SYM = {
      square: [0, 90, 45, 135], rectangle: [0, 90], triangle: [0],
      pentagon: [0, 72, 144, 216, 288], hexagon: [0, 30, 60, 90, 120, 150],
      circle: [0, 90, 45, 135]
    };
    function symSide(p, cx, cy, dx, dy) { return (p[0] - cx) * dy - (p[1] - cy) * dx; }
    /* the part of a polygon on one side of the mirror line */
    function clipHalf(pts, cx, cy, dx, dy, keep) {
      var out = [], i, A, B, sa, sb, t;
      for (i = 0; i < pts.length; i++) {
        A = pts[i]; B = pts[(i + 1) % pts.length];
        sa = symSide(A, cx, cy, dx, dy) * keep; sb = symSide(B, cx, cy, dx, dy) * keep;
        if (sa >= -1e-9) out.push(A);
        if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
          t = sa / (sa - sb);
          out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
        }
      }
      return out;
    }
    function polyD(pts) {
      var d = "", i;
      for (i = 0; i < pts.length; i++) d += (i ? " L" : "M") + num(pts[i][0]) + "," + num(pts[i][1]);
      return d + " Z";
    }
    function symmetry(o) {
      o = options("symmetry", o);
      var k = o.kind == null ? "square" : String(o.kind);
      if (!Object.prototype.hasOwnProperty.call(SYM, k))
        bad("symmetry", "kind is one of " + Object.keys(SYM).join(", ") + ", got " + JSON.stringify(o.kind));
      var all = SYM[k], pick = [], i;
      if (Array.isArray(o.lines)) {
        for (i = 0; i < o.lines.length; i++) { whole("symmetry", "every line", o.lines[i], 0, all.length - 1); pick.push(o.lines[i]); }
      } else {
        var n = o.lines == null ? all.length : whole("symmetry", "lines", o.lines, 0, all.length);
        for (i = 0; i < n; i++) pick.push(i);
      }
      if (o.reflect && !pick.length) bad("symmetry", "it cannot reflect over a mirror line when no line is drawn");
      var W = 292, cx = W / 2, cy = 146, rr = 98;
      var pts = k === "circle" ? null : (k === "pentagon" ? regular(5, rr) : k === "hexagon" ? regular(6, rr) : SHAPES[k]);
      var abs = pts ? pts.map(function (p) { return [cx + p[0], cy + p[1]]; }) : null;
      var lab = labelOf(o, all.length + (all.length === 1 ? " line of symmetry" : " lines of symmetry"));
      var h = cy + rr + 44 + (lab ? 30 : 0), s = "";
      var t0 = (all[pick[0]] == null ? 0 : all[pick[0]]) * Math.PI / 180;
      var dx = Math.sin(t0), dy = -Math.cos(t0);
      if (o.reflect) {
        if (!abs) bad("symmetry", "a circle has no half to reflect: every line through it is a mirror");
        s += Pth(polyD(clipHalf(abs, cx, cy, dx, dy, 1)), C.tealSoft, C.teal, 3.5);
        s += Pth(polyD(clipHalf(abs, cx, cy, dx, dy, -1)), C.goodSoft, C.good, 3, { "stroke-dasharray": "9 6" });
      } else if (abs) {
        s += Pth(polyD(abs), C.tealSoft, C.teal, 3.5);
      } else {
        s += Ci(cx, cy, rr, C.tealSoft, C.teal, 3.5);
      }
      /* Each line runs a little past the shape ALONG ITS OWN DIRECTION, so a
         rectangle's vertical mirror does not tower over it. */
      for (i = 0; i < pick.length; i++) {
        var t = (all[pick[i]] * Math.PI) / 180, ux = Math.sin(t), uy = -Math.cos(t), ext = 0, j;
        if (abs) for (j = 0; j < abs.length; j++)
          ext = Math.max(ext, Math.abs((abs[j][0] - cx) * ux + (abs[j][1] - cy) * uy));
        else ext = rr;
        ext += 16;
        s += L(cx - ux * ext, cy - uy * ext, cx + ux * ext, cy + uy * ext, C.accent, 3, { "stroke-dasharray": "10 7" });
      }
      if (lab) s += caption(W, h - 20, lab, 22);
      return card(W, h, s);
    }

    /* ---- solids -----------------------------------------------------------
       One fixed view, drawn see-through: the edges at the back are dashed,
       because counting a cube's twelve edges means pointing at the three a
       child cannot see. The cube and pyramid vertex, face and edge tables are
       the Shape and Measures film's own (tools/lib/ehel-math-lecture-scenes.js),
       kept in its counting order; the projection here is fixed rather than
       turning, because a frame is a pure function of time and these films do
       not spin. */
    var CUBE3 = {
      v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
      f: [[3, 2, 6, 7], [2, 1, 5, 6], [7, 6, 5, 4], [1, 0, 4, 5], [0, 3, 7, 4], [0, 1, 2, 3]],
      e: [[7, 6], [6, 5], [5, 4], [4, 7], [3, 2], [2, 1], [1, 0], [0, 3], [3, 7], [2, 6], [1, 5], [0, 4]],
      p: [7, 6, 5, 4, 3, 2, 1, 0]
    };
    var PYRAMID3 = {
      v: [[-1, -0.78, -1], [1, -0.78, -1], [1, -0.78, 1], [-1, -0.78, 1], [0, 1.12, 0]],
      f: [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]],
      e: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 4], [1, 4], [0, 4]],
      p: [4, 3, 2, 1, 0]
    };
    function scaled(geo, sx, sy, sz) {
      return { v: geo.v.map(function (p) { return [p[0] * sx, p[1] * sy, p[2] * sz]; }), f: geo.f, e: geo.e, p: geo.p };
    }
    var SOLID_COUNTS = {
      cube: [6, 12, 8], cuboid: [6, 12, 8], pyramid: [5, 8, 5],
      cylinder: [3, 2, 0], cone: [2, 1, 1], sphere: [1, 0, 0]
    };
    var RX = 0.36, RY = 0.66, LIGHT = [-0.32, 0.6, 0.73];
    function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
    function turn3(p) {
      var cy0 = Math.cos(RY), sy0 = Math.sin(RY), cx0 = Math.cos(RX), sx0 = Math.sin(RX);
      var x1 = p[0] * cy0 + p[2] * sy0, z1 = -p[0] * sy0 + p[2] * cy0;
      return [x1, p[1] * cx0 - z1 * sx0, p[1] * sx0 + z1 * cx0];
    }
    function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function vcross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function vunit(a) { var m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; }
    function vmean(ps) {
      var m = [0, 0, 0], i;
      for (i = 0; i < ps.length; i++) { m[0] += ps[i][0]; m[1] += ps[i][1]; m[2] += ps[i][2]; }
      return [m[0] / ps.length, m[1] / ps.length, m[2] / ps.length];
    }
    function markList(where, what, v, n) {
      var out = [], i;
      if (v === true) { for (i = 0; i < n; i++) out.push(i); return out; }
      if (!v) return out;
      listOf(where, what, v, 0, n);
      for (i = 0; i < v.length; i++) { whole(where, "every " + what, v[i], 0, n - 1); out.push(v[i]); }
      return out;
    }
    function solid(kind, o) {
      o = options("solid", o);
      var k = String(kind);
      if (!Object.prototype.hasOwnProperty.call(SOLID_COUNTS, k))
        bad("solid", "kind is one of " + Object.keys(SOLID_COUNTS).join(", ") + ", got " + JSON.stringify(kind));
      var cnt = SOLID_COUNTS[k], round = k === "cylinder" || k === "cone" || k === "sphere";
      if (o.edges && cnt[1] === 0) bad("solid", "a " + k + " has no edges to mark");
      if (o.vertices && cnt[2] === 0) bad("solid", "a " + k + " has no vertices to mark");
      var W = 300, cx = W / 2, cy = 150, s = "", i;
      var lab = auto(o, o.counts ? plural(cnt[0], "face", "faces") + ", " + plural(cnt[1], "edge", "edges") +
        ", " + plural(cnt[2], "vertex", "vertices") : null);
      var h = 300 + (lab ? 32 : 0);
      var faceOn = markList("solid", "face", o.faces, cnt[0]);
      var edgeOn = markList("solid", "edge", o.edges, cnt[1]);
      var vertOn = markList("solid", "vertex", o.vertices, cnt[2]);
      if (!round) {
        var geo = k === "cuboid" ? scaled(CUBE3, 1.42, 0.68, 0.9) : k === "pyramid" ? PYRAMID3 : CUBE3;
        var sc = k === "cuboid" ? 74 : k === "pyramid" ? 76 : 70;
        var P = geo.v.map(turn3), mid = vmean(P);
        var S = function (p) { return [cx + p[0] * sc, cy - p[1] * sc]; };
        var faces = geo.f.map(function (f, n) {
          var q = f.map(function (j) { return P[j]; }), m = vmean(q);
          var nn = vunit(vcross(vsub(q[1], q[0]), vsub(q[2], q[0])));
          if (vdot(nn, vsub(m, mid)) < 0) nn = [-nn[0], -nn[1], -nn[2]];
          return { k: n, idx: f, n: nn, front: nn[2] > 1e-6, m: m, d: polyD(q.map(S)) };
        });
        var seen = function (a, b) {
          for (var t = 0; t < faces.length; t++)
            if (faces[t].front && faces[t].idx.indexOf(a) >= 0 && (b == null || faces[t].idx.indexOf(b) >= 0)) return true;
          return false;
        };
        for (i = 0; i < faces.length; i++) if (!faces[i].front) s += Pth(faces[i].d, C.teal, null, 0, { "fill-opacity": 0.07 });
        for (i = 0; i < geo.e.length; i++)
          if (!seen(geo.e[i][0], geo.e[i][1]))
            s += L(S(P[geo.e[i][0]])[0], S(P[geo.e[i][0]])[1], S(P[geo.e[i][1]])[0], S(P[geo.e[i][1]])[1], C.muted, 2, { "stroke-dasharray": "7 5" });
        var front = faces.filter(function (f) { return f.front; }).sort(function (a, b) { return a.m[2] - b.m[2]; });
        for (i = 0; i < front.length; i++)
          s += Pth(front[i].d, C.teal, null, 0, { "fill-opacity": 0.16 + 0.42 * Math.max(0, vdot(front[i].n, LIGHT)) });
        for (i = 0; i < geo.e.length; i++)
          if (seen(geo.e[i][0], geo.e[i][1]))
            s += L(S(P[geo.e[i][0]])[0], S(P[geo.e[i][0]])[1], S(P[geo.e[i][1]])[0], S(P[geo.e[i][1]])[1],
              edgeOn.indexOf(i) >= 0 ? C.accent : C.teal, edgeOn.indexOf(i) >= 0 ? 5 : 3);
        for (i = 0; i < edgeOn.length; i++) {
          var e = geo.e[edgeOn[i]];
          if (!seen(e[0], e[1])) s += L(S(P[e[0]])[0], S(P[e[0]])[1], S(P[e[1]])[0], S(P[e[1]])[1], C.accent, 4, { "stroke-dasharray": "8 5" });
        }
        for (i = 0; i < faceOn.length; i++) {
          var fc = faces[faceOn[i]], q = S(fc.m);
          s += Ci(q[0], q[1], 15, fc.front ? C.card : "none", C.accent, fc.front ? 2.5 : 2, fc.front ? null : { "stroke-dasharray": "5 4" });
          s += N(q[0], q[1], String(faceOn[i] + 1), 18, C.accent, { opacity: fc.front ? 1 : 0.6 });
        }
        for (i = 0; i < vertOn.length; i++) {
          var j = geo.p[vertOn[i]], q2 = S(P[j]), vis = seen(j);
          s += Ci(q2[0], q2[1], 8, vis ? C.plum : "none", vis ? C.card : C.plum, 2.5, vis ? null : { "stroke-dasharray": "4 3" });
        }
      } else {
        var r = k === "cone" ? 70 : 78, hh = k === "sphere" ? 0 : 84, ry2 = k === "cone" ? 22 : 26;
        var apex = cy - hh / 2 - 44;
        function halfEll(x, y, rx2, ry3, top) {
          return "M" + num(x - rx2) + "," + num(y) + " A" + num(rx2) + "," + num(ry3) + " 0 0," + (top ? 1 : 0) + " " + num(x + rx2) + "," + num(y);
        }
        if (k === "cylinder") {
          s += Pth(halfEll(cx, cy + hh / 2, r, ry2, true), null, C.muted, 2, { "stroke-dasharray": "7 5" });
          /* down the left side, round the front of the base, up the right; the
             straight top is then covered by the top ellipse drawn over it */
          s += Pth("M" + num(cx - r) + "," + num(cy - hh / 2) + " L" + num(cx - r) + "," + num(cy + hh / 2) +
            " A" + num(r) + "," + num(ry2) + " 0 0,0 " + num(cx + r) + "," + num(cy + hh / 2) +
            " L" + num(cx + r) + "," + num(cy - hh / 2) + " Z", C.teal, C.teal, 3, { "fill-opacity": 0.22 });
          s += Ell(cx, cy - hh / 2, r, ry2, C.teal, { "fill-opacity": 0.45, stroke: C.teal, "stroke-width": 3 });
          if (edgeOn.indexOf(0) >= 0) s += Ell(cx, cy - hh / 2, r, ry2, "none", { stroke: C.accent, "stroke-width": 5 });
          if (edgeOn.indexOf(1) >= 0) s += Ell(cx, cy + hh / 2, r, ry2, "none", { stroke: C.accent, "stroke-width": 5, "stroke-dasharray": "9 6" });
          if (faceOn.indexOf(0) >= 0) s += Ci(cx, cy - hh / 2, 15, C.card, C.accent, 2.5) + N(cx, cy - hh / 2, "1", 18, C.accent);
          if (faceOn.indexOf(1) >= 0) s += Ci(cx + r * 0.52, cy, 15, C.card, C.accent, 2.5) + N(cx + r * 0.52, cy, "2", 18, C.accent);
          if (faceOn.indexOf(2) >= 0) s += Ci(cx, cy + hh / 2 + 6, 15, "none", C.accent, 2, { "stroke-dasharray": "5 4" }) + N(cx, cy + hh / 2 + 6, "3", 18, C.accent, { opacity: 0.6 });
        } else if (k === "cone") {
          s += Pth(halfEll(cx, cy + hh / 2, r, ry2, true), null, C.muted, 2, { "stroke-dasharray": "7 5" });
          s += Pth("M" + num(cx - r) + "," + num(cy + hh / 2) + " L" + num(cx) + "," + num(apex) +
            " L" + num(cx + r) + "," + num(cy + hh / 2) + " A" + num(r) + "," + num(ry2) + " 0 0,1 " + num(cx - r) + "," + num(cy + hh / 2) + " Z",
            C.teal, C.teal, 3, { "fill-opacity": 0.3 });
          if (edgeOn.indexOf(0) >= 0) s += Ell(cx, cy + hh / 2, r, ry2, "none", { stroke: C.accent, "stroke-width": 5 });
          if (vertOn.indexOf(0) >= 0) s += Ci(cx, apex, 9, C.plum, C.card, 2.5);
          if (faceOn.indexOf(0) >= 0) s += Ci(cx, cy + hh / 2 + 2, 15, C.card, C.accent, 2.5) + N(cx, cy + hh / 2 + 2, "1", 18, C.accent);
          if (faceOn.indexOf(1) >= 0) s += Ci(cx + r * 0.4, cy + 8, 15, C.card, C.accent, 2.5) + N(cx + r * 0.4, cy + 8, "2", 18, C.accent);
        } else {
          s += Ci(cx, cy, r + 14, C.teal, C.teal, 3, { "fill-opacity": 0.26 });
          s += Pth(halfEll(cx, cy, r + 14, 28, true), null, C.muted, 2, { "stroke-dasharray": "7 5" });
          s += Pth(halfEll(cx, cy, r + 14, 28, false), null, C.teal, 2.5);
          s += Ell(cx - 26, cy - 30, 22, 15, C.card, { opacity: 0.4 });
          if (faceOn.indexOf(0) >= 0) s += Ci(cx + 34, cy + 40, 15, C.card, C.accent, 2.5) + N(cx + 34, cy + 40, "1", 18, C.accent);
        }
      }
      if (lab) s += caption(W, h - 20, lab, 22);
      return card(W, h, s);
    }

    /* ---- the measuring jug ------------------------------------------------
       A scale with numbers, smaller marks between them, and a reading. The
       lesson's own question is "halfway between the 20 and the 30", so the
       marks between the numbers are what the picture is for: minorPer says how
       many spaces each numbered step is cut into. */
    function jug(o) {
      o = options("jug", o);
      var cap = o.capacity == null ? 1000 : number("jug", "capacity", o.capacity, 1, 100000);
      var step = o.step == null ? cap / 5 : number("jug", "step", o.step, 0.001, cap);
      var steps = cap / step;
      if (Math.abs(steps - Math.round(steps)) > 1e-6)
        bad("jug", "step " + step + " does not divide a capacity of " + cap + " into whole marks");
      steps = Math.round(steps);
      if (steps < 2 || steps > 10) bad("jug", "that is " + steps + " numbered marks; a film can read 2 to 10");
      var minor = o.minorPer == null ? 2 : whole("jug", "minorPer", o.minorPer, 1, 5);
      var level = o.level == null ? 0 : number("jug", "level", o.level, 0, cap);
      var unit = o.unit == null ? "ml" : String(o.unit);
      var plain = o.kind === "plain";
      if (o.kind != null && o.kind !== "jug" && o.kind !== "plain")
        bad("jug", "kind is jug or plain, got " + JSON.stringify(o.kind));
      var edge = 22, gx = edge + (plain ? 10 : 6), gw = 132, gy = 34, gh = 216;
      var W = gx + gw + 96 + edge;
      var lab = auto(o, (Math.round(level * 100) / 100) + " " + unit);
      var h = gy + gh + 26 + edge + (lab ? 30 : 0), s = "", i;
      function Y(v) { return gy + gh - (v / cap) * (gh - 18); }
      /* the glass: a touch narrower at the foot, with a lip and a handle */
      var top = gy, bot = gy + gh, inset = plain ? 0 : 9;
      s += Pth("M" + num(gx) + "," + num(top) + " L" + num(gx + inset) + "," + num(bot) +
        " L" + num(gx + gw - inset) + "," + num(bot) + " L" + num(gx + gw) + "," + num(top),
        C.cell, C.ink, 4);
      if (level > 0) {
        var wy = Y(level), f0 = inset * (wy - top) / (bot - top);
        s += Pth("M" + num(gx + f0) + "," + num(wy) + " L" + num(gx + inset) + "," + num(bot) +
          " L" + num(gx + gw - inset) + "," + num(bot) + " L" + num(gx + gw - f0) + "," + num(wy) + " Z",
          C.teal, null, 0, { "fill-opacity": 0.72 });
        s += L(gx + f0, wy, gx + gw - f0, wy, C.teal, 4);
      }
      if (!plain) {
        s += Pth("M" + num(gx + gw) + "," + num(top + 14) + " C" + num(gx + gw + 44) + "," + num(top + 24) +
          " " + num(gx + gw + 44) + "," + num(top + 96) + " " + num(gx + gw) + "," + num(top + 92), null, C.ink, 4);
        s += Pth("M" + num(gx - 2) + "," + num(top) + " L" + num(gx - 16) + "," + num(top - 10), null, C.ink, 4);
      }
      for (i = 0; i <= steps * minor; i++) {
        var v = (i / (steps * minor)) * cap, big = i % minor === 0, y = Y(v);
        s += L(gx + 4, y, gx + (big ? 44 : 26), y, C.ink, big ? 2.5 : 1.6, { "stroke-linecap": "butt" });
        if (big) s += N(gx + gw + (plain ? 14 : 52), y, String(Math.round(v * 100) / 100), 17, C.ink, { anchor: "start" });
      }
      s += T(gx + gw + (plain ? 14 : 52), Y(cap) - 24, unit, { size: 15, fill: C.muted, anchor: "start" });
      if (lab) s += caption(W, h - 20, lab, 23, C.teal);
      return card(W, h, s);
    }

    /* ---- sorting ----------------------------------------------------------
       The two pictures the lessons sort with: two rings that overlap, and the
       two-by-two grid with its yes and no headings. An item says whether it is
       in A and whether it is in B, and the picture works out where it goes. */
    function zoneOf(it) { return (it.a ? 1 : 0) + (it.b ? 2 : 0); }
    function sortDiagram(o) {
      o = options("sortDiagram", o);
      var shape = o.shape == null ? "venn" : String(o.shape);
      if (shape !== "venn" && shape !== "carroll")
        bad("sortDiagram", "shape is venn or carroll, got " + JSON.stringify(o.shape));
      var labels = listOf("sortDiagram", "labels", o.labels, 2, 2);
      var items = o.items == null ? [] : listOf("sortDiagram", "items", o.items, 0, 16);
      var zones = [[], [], [], []], i, it;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it == null || typeof it !== "object" || it.label == null)
          bad("sortDiagram", "every item is an object with label, a and b, got " + JSON.stringify(it));
        zones[zoneOf(it)].push(String(it.label));
      }
      for (i = 0; i < 4; i++)
        if (zones[i].length > 4) bad("sortDiagram", "that is " + zones[i].length + " items in one place; a film can read 4");
      var A = String(labels[0]), B = String(labels[1]);
      var edge = 22, s = "", W, h, lab = labelOf(o, null), title = o.title == null ? null : String(o.title);
      /* up to four items in a zone, laid out two by two */
      function fill(list, cx, cy, tone) {
        var out = "", n = list.length, k, ox, oy;
        for (k = 0; k < n; k++) {
          ox = n === 1 ? 0 : (k % 2 ? 30 : -30);
          oy = n <= 2 ? 0 : (k < 2 ? -17 : 17);
          out += N(cx + ox, cy + oy, list[k], 19, tone);
        }
        return out;
      }
      if (shape === "venn") {
        W = 500; h = (title ? 34 : 0) + 292 + (lab ? 28 : 0);
        /* the rings sit clear of the box's top, where their names go, and of
           its bottom corners, which is where anything in neither ring lives */
        var top = (title ? 34 : 0) + 8, r = 100, cy = top + 132, ax = W / 2 - 58, bx = W / 2 + 58;
        if (title) s += N(W / 2, edge, title, 23, C.ink);
        s += R(edge, top, W - 2 * edge, 262, 18, C.card, C.line, 2, { "stroke-dasharray": "9 6" });
        s += N(ax - 44, top + 18, A, 20, C.teal);
        s += N(bx + 44, top + 18, B, 20, C.gold);
        s += Ci(ax, cy, r, C.teal, C.teal, 3, { "fill-opacity": 0.18 });
        s += Ci(bx, cy, r, C.gold, C.gold, 3, { "fill-opacity": 0.18 });
        s += fill(zones[1], ax - 48, cy, C.ink);
        s += fill(zones[2], bx + 48, cy, C.ink);
        s += fill(zones[3], W / 2, cy, C.ink);
        s += fill(zones[0], edge + 56, top + 232, C.muted);
        if (lab) s += caption(W, h - 18, lab, 22);
        return card(W, h, s);
      }
      W = 520;
      var hd = 54, cw = (W - 2 * edge - 128) / 2, rh = 88;
      var gx = edge + 128, gy = (title ? 34 : 0) + 18;
      h = gy + hd + 2 * rh + 18 + edge + (lab ? 28 : 0);
      if (title) s += N(W / 2, edge, title, 23, C.ink);
      s += R(gx, gy, cw, hd, 0, C.cell, C.line, 2) + N(gx + cw / 2, gy + hd / 2, A, 18, C.ink);
      s += R(gx + cw, gy, cw, hd, 0, C.cell, C.line, 2) + N(gx + cw + cw / 2, gy + hd / 2, "not " + A, 18, C.muted);
      for (i = 0; i < 2; i++) {
        var ry = gy + hd + i * rh;
        s += R(edge, ry, 128, rh, 0, C.cell, C.line, 2);
        s += N(edge + 64, ry + rh / 2, i ? "not " + B : B, 18, i ? C.muted : C.ink);
        s += R(gx, ry, cw, rh, 0, C.card, C.line, 2);
        s += R(gx + cw, ry, cw, rh, 0, C.card, C.line, 2);
        s += fill(zones[i ? 1 : 3], gx + cw / 2, ry + rh / 2, C.ink);
        s += fill(zones[i ? 0 : 2], gx + cw + cw / 2, ry + rh / 2, i ? C.muted : C.ink);
      }
      s += R(edge, gy, 128, hd, 0, C.card, C.line, 2);
      if (lab) s += caption(W, h - 18, lab, 22);
      return card(W, h, s);
    }

    /* ---- putting one in a film -------------------------------------------
       Copied from the Science films' ART.place: one drawing, nested in a box
       of the chapter's 1168 x 440 space, its own viewBox scaling it to fit. */
    function place(markup, x, y, w, h, extra) {
      var s = String(markup);
      if (s.slice(0, 5) !== "<svg ") bad("place", "it nests one of these drawings, and this is not one: " + s.slice(0, 48));
      return '<svg x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' + (extra ? " " + extra : "") + s.slice(4);
    }

    var DRAWINGS = {
      tenFrame: tenFrame, counters: counters, numberLine: numberLine, dice: dice, coins: coins,
      clock: clock, barModel: barModel, array: array, fraction: fraction, placeValue: placeValue,
      tally: tally, barChart: barChart, pictogram: pictogram, balance: balance, ruler: ruler,
      shape2d: shape2d, grid: grid, sequence: sequence, spinner: spinner,
      columnSum: columnSum, calendar: calendar, compass: compass, symmetry: symmetry,
      solid: solid, jug: jug, sortDiagram: sortDiagram
    };

    /* ==== the self-test ======================================================
       Every drawing is made two or three times as the page loads, and every
       one is shown an argument it must refuse. A fault therefore stops the
       render with the drawing's own name in the message, instead of a film
       quietly drawing something wrong on one frame in nine hundred. */
    (function selfTest() {
      var tried = {}, k;
      function ok(name, markup) {
        if (typeof markup !== "string" || markup.slice(0, 5) !== "<svg ")
          throw new Error("mathArt self-test: " + name + " did not draw an <svg>");
        if (markup.indexOf("undefined") >= 0 || markup.indexOf("NaN") >= 0)
          throw new Error("mathArt self-test: " + name + " drew undefined or NaN into its markup");
        tried[name] = true;
        return markup;
      }
      function refuses(name, fn) {
        var threw = null;
        try { fn(); } catch (e) { threw = e; }
        if (!threw) throw new Error("mathArt self-test: " + name + " accepted an argument it has to refuse");
        if (String(threw.message).indexOf("mathArt." + name + ":") !== 0)
          throw new Error("mathArt self-test: " + name + " refused without naming itself: " + threw.message);
      }

      ok("tenFrame", tenFrame(0));
      ok("tenFrame", tenFrame(7, { label: true }));
      ok("tenFrame", tenFrame(14, { frames: 2, split: 10 }));
      refuses("tenFrame", function () { tenFrame(24); });
      refuses("tenFrame", function () { tenFrame(11, { frames: 1 }); });

      ok("counters", counters(6));
      ok("counters", counters(7, { pairs: true, markOdd: true }));
      ok("counters", counters(12, { cols: 4, colour: "teal" }));
      refuses("counters", function () { counters(31); });
      refuses("counters", function () { counters(3, { cols: 0 }); });

      ok("numberLine", numberLine({ from: 0, to: 10, mark: 4 }));
      ok("numberLine", numberLine({ from: 0, to: 20, labelEvery: 5, marks: [{ at: 7, colour: "teal", label: "7" }], jumps: [{ from: 4, to: 7, label: "+3" }] }));
      ok("numberLine", numberLine({ from: 0, to: 100, step: 10, label: "counting in tens" }));
      refuses("numberLine", function () { numberLine({ from: 10, to: 0 }); });
      refuses("numberLine", function () { numberLine({ from: 0, to: 10, step: 3 }); });

      ok("dice", dice(4));
      ok("dice", dice([3, 5], { total: true }));
      ok("dice", dice([1, 2, 6]));
      refuses("dice", function () { dice(7); });
      refuses("dice", function () { dice([]); });

      ok("coins", coins([10, 10, 5], { total: true }));
      ok("coins", coins([50, 100], { total: true }));
      ok("coins", coins([1, 2, 5, 10, 20, 50], { perRow: 3 }));
      refuses("coins", function () { coins([0]); });
      refuses("coins", function () { coins([10], { unit: "USD" }); });

      ok("clock", clock(3, 0));
      ok("clock", clock(4, 45, { quarters: true, digital: true }));
      ok("clock", clock(7, 20, { minuteNumbers: true, label: "twenty past 7" }));
      refuses("clock", function () { clock(13, 0); });
      refuses("clock", function () { clock(3, 75); });

      ok("barModel", barModel({ parts: [6, 4] }));
      ok("barModel", barModel({ whole: 20, parts: [{ value: 12 }, { value: 8 }], unknown: 1 }));
      ok("barModel", barModel({ parts: [5, 5, 5], unknown: "whole", label: "three fives" }));
      refuses("barModel", function () { barModel({ parts: [3] }); });
      refuses("barModel", function () { barModel({ parts: [3, 4], unknown: 9 }); });

      ok("array", array(3, 4, { label: true }));
      ok("array", array(2, 6, { markRow: 0 }));
      ok("array", array(5, 5, { colour: "plum", markCol: 2 }));
      refuses("array", function () { array(0, 3); });
      refuses("array", function () { array(3, 13); });

      ok("fraction", fraction({ parts: 4, shaded: 3 }));
      ok("fraction", fraction({ shape: "circle", parts: 8, shaded: 5 }));
      ok("fraction", fraction({ parts: 2, shaded: 1, label: "one half" }));
      refuses("fraction", function () { fraction({ parts: 1 }); });
      refuses("fraction", function () { fraction({ shape: "blob", parts: 4 }); });

      ok("placeValue", placeValue({ value: 347 }));
      ok("placeValue", placeValue({ value: 26, lit: "tens" }));
      ok("placeValue", placeValue({ hundreds: 2, tens: 0, ones: 5, blocks: false }));
      refuses("placeValue", function () { placeValue({ value: 1000 }); });
      refuses("placeValue", function () { placeValue({}); });

      ok("tally", tally(3));
      ok("tally", tally(13));
      ok("tally", tally(27));
      refuses("tally", function () { tally(51); });
      refuses("tally", function () { tally(2.5); });

      ok("barChart", barChart({ bars: [{ label: "Mon", value: 4 }, { label: "Tue", value: 7 }], title: "Books read" }));
      ok("barChart", barChart({ bars: [{ label: "red", value: 3 }, { label: "blue", value: 8 }, { label: "green", value: 5 }], highlight: 1 }));
      refuses("barChart", function () { barChart({ bars: [] }); });
      refuses("barChart", function () { barChart({ bars: [{ value: 3 }] }); });

      ok("pictogram", pictogram({ rows: [{ label: "Class 1", count: 6 }, { label: "Class 2", count: 3 }], key: ["child", "children"] }));
      ok("pictogram", pictogram({ rows: [{ label: "Monday", count: 10 }, { label: "Tuesday", count: 6 }], each: 2, shape: "star", title: "Stars won", key: "stars" }));
      refuses("pictogram", function () { pictogram({ rows: [{ label: "x", count: 5 }], each: 2, shape: "star" }); });
      refuses("pictogram", function () { pictogram({ rows: [{ count: 4 }] }); });

      ok("balance", balance(5, 5));
      ok("balance", balance(7, 3));
      ok("balance", balance("3 + 4", "7", { tilt: "level", label: "3 + 4 = 7" }));
      refuses("balance", function () { balance("a", "b"); });
      refuses("balance", function () { balance(1, 2, { tilt: "sideways" }); });

      ok("ruler", ruler({ length: 10, item: { from: 0, to: 7 } }));
      ok("ruler", ruler({ length: 6, item: { from: 1, to: 4, label: "3 cm" } }));
      ok("ruler", ruler({ length: 12 }));
      refuses("ruler", function () { ruler({ length: 1 }); });
      refuses("ruler", function () { ruler({ length: 10, item: { from: 5, to: 2 } }); });

      ok("shape2d", shape2d("square", { sides: true, corners: true, rightAngles: true }));
      ok("shape2d", shape2d("hexagon", { sides: true }));
      ok("shape2d", shape2d("circle"));
      refuses("shape2d", function () { shape2d("blob"); });
      refuses("shape2d", function () { shape2d("circle", { sides: true }); });
      refuses("shape2d", function () { shape2d("triangle", { rightAngles: true }); });

      ok("grid", grid({ cols: 6, rows: 4, fill: 12 }));
      ok("grid", grid({ cols: 5, rows: 5, coords: true, points: [{ x: 3, y: 2, label: "(3, 2)", guides: true }] }));
      ok("grid", grid({ cols: 4, rows: 3, fill: [[0, 0], [1, 0], [1, 1]] }));
      refuses("grid", function () { grid({ cols: 0, rows: 3 }); });
      refuses("grid", function () { grid({ cols: 4, rows: 3, fill: [[9, 0]] }); });

      ok("sequence", sequence({ terms: [2, 4, 6, null, 10], arrows: true }));
      ok("sequence", sequence({ terms: ["red", "blue", null] }));
      ok("sequence", sequence({ terms: [5, 10, 15, 20], label: "counting in fives" }));
      refuses("sequence", function () { sequence({ terms: [1] }); });
      refuses("sequence", function () { sequence({ terms: ["a", null], arrows: true }); });

      ok("spinner", spinner({ parts: 4 }));
      ok("spinner", spinner({ parts: ["red", "blue", "green"], pointer: 2, title: "Where will it stop?" }));
      ok("spinner", spinner({ parts: 8, pointer: 7 }));
      refuses("spinner", function () { spinner({ parts: 1 }); });
      refuses("spinner", function () { spinner({ parts: 3, pointer: 5 }); });

      ok("columnSum", columnSum({ a: 345, b: 278 }));
      ok("columnSum", columnSum({ a: 502, b: 247, op: "-", highlight: 0 }));
      ok("columnSum", columnSum({ a: 214, b: 3, op: "x", answer: false }));
      refuses("columnSum", function () { columnSum({ a: 12, b: 30, op: "-" }); });
      refuses("columnSum", function () { columnSum({ a: 1, b: 2, op: "/" }); });

      ok("calendar", calendar({ month: 3, start: 4, mark: 17 }));
      ok("calendar", calendar({ month: "February", leap: true, start: 0, year: 2028 }));
      ok("calendar", calendar({ month: 9, start: 6, mark: [{ date: 1, colour: "teal" }, { date: 30 }] }));
      refuses("calendar", function () { calendar({ month: 13 }); });
      refuses("calendar", function () { calendar({ month: 4, mark: 31 }); });

      ok("compass", compass({ facing: "N" }));
      ok("compass", compass({ facing: "E", turn: { quarters: 1, way: "clockwise" } }));
      ok("compass", compass({ points: 8, facing: "SW", turn: { quarters: 2, way: "anticlockwise" } }));
      refuses("compass", function () { compass({ facing: "NE" }); });
      refuses("compass", function () { compass({ facing: "N", turn: { quarters: 4 } }); });

      ok("symmetry", symmetry({ kind: "square" }));
      ok("symmetry", symmetry({ kind: "rectangle", lines: 1, reflect: true }));
      ok("symmetry", symmetry({ kind: "hexagon", lines: [0, 3] }));
      refuses("symmetry", function () { symmetry({ kind: "blob" }); });
      refuses("symmetry", function () { symmetry({ kind: "circle", reflect: true }); });

      ok("solid", solid("cube", { counts: true }));
      ok("solid", solid("cuboid", { edges: true }));
      ok("solid", solid("pyramid", { faces: true, vertices: true }));
      ok("solid", solid("cylinder", { faces: true, counts: true }));
      ok("solid", solid("cone", { vertices: [0] }));
      ok("solid", solid("sphere", { counts: true }));
      refuses("solid", function () { solid("prism"); });
      refuses("solid", function () { solid("sphere", { edges: true }); });
      refuses("solid", function () { solid("cube", { faces: [9] }); });

      ok("jug", jug({ capacity: 1000, step: 200, level: 600 }));
      ok("jug", jug({ capacity: 50, step: 10, minorPer: 5, level: 25, unit: "l", kind: "plain" }));
      ok("jug", jug({ capacity: 400, step: 100, level: 0 }));
      refuses("jug", function () { jug({ capacity: 1000, step: 300 }); });
      refuses("jug", function () { jug({ capacity: 1000, step: 100, level: 1200 }); });

      ok("sortDiagram", sortDiagram({ labels: ["even", "over 10"], items: [{ label: "4", a: true }, { label: "12", a: true, b: true }, { label: "7" }] }));
      ok("sortDiagram", sortDiagram({ shape: "carroll", labels: ["red", "round"], items: [{ label: "ball", a: true, b: true }, { label: "box" }], title: "Sort them" }));
      refuses("sortDiagram", function () { sortDiagram({ labels: ["one"] }); });
      refuses("sortDiagram", function () { sortDiagram({ labels: ["a", "b"], items: [{ a: true }] }); });

      ok("grid", grid({ cols: 10, rows: 10, numbers: true, fill: [[0, 0], [4, 3]] }));
      refuses("grid", function () { grid({ cols: 10, rows: 10, numbers: true, coords: true }); });
      refuses("grid", function () { grid({ cols: 10, rows: 10, numbers: true, cell: 20 }); });

      /* place, and the drawing it refuses to nest */
      if (place(tenFrame(5), 20, 30, 300, 200).indexOf('<svg x="20" y="30" width="300" height="200"') !== 0)
        throw new Error("mathArt self-test: place did not nest a drawing");
      refuses("place", function () { place("<div></div>", 0, 0, 10, 10); });

      for (k in DRAWINGS) {
        if (!Object.prototype.hasOwnProperty.call(DRAWINGS, k)) continue;
        if (!tried[k]) throw new Error("mathArt self-test: " + k + " is published and never drawn here; add it to the self-test");
      }
    })();

    return {
      tenFrame: tenFrame, counters: counters, numberLine: numberLine, dice: dice, coins: coins,
      clock: clock, barModel: barModel, array: array, fraction: fraction, placeValue: placeValue,
      tally: tally, barChart: barChart, pictogram: pictogram, balance: balance, ruler: ruler,
      shape2d: shape2d, grid: grid, sequence: sequence, spinner: spinner,
      columnSum: columnSum, calendar: calendar, compass: compass, symmetry: symmetry,
      solid: solid, jug: jug, sortDiagram: sortDiagram,
      place: place, C: C, money: money, esc: esc
    };

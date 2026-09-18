/* The browser half of tools/create-ehel-math-unit-lecture.js.
 *
 * One function matters: window.EHEL_FILM.frame(t) paints the whole 1280x720
 * composition for the absolute time t, and returns nothing. Nothing here
 * animates itself - no CSS transition, no requestAnimationFrame - because the
 * renderer screenshots frames one at a time and a self-animating page would
 * hand it whatever the clock happened to say. Every moving thing is a pure
 * function of t, so frame(12.5) draws the same pixels on the tenth run as on
 * the first.
 *
 * UNLIKE THE SCIENCE FILM, EVERY SHAPE HERE IS DRAWN FRESH. Science can lift
 * its skeleton and arm verbatim out of science.js because those are pure,
 * DOM-free functions. Grade 4 Maths' solids, angle wedge, symmetry lines and
 * grids are small closures inside c-shape-slides.js that read and write
 * module-level state and $("id").innerHTML directly - there is nothing to
 * import. So this file redraws the same IDEAS (a cube, a right angle, a
 * five-by-three grid) as its own SVG, matching the lesson's numbers and its
 * dark theme, but not sliced from its code. Owner decision, 2026-09-18 - see
 * the lecture-video README.
 */
(function () {
  "use strict";

  var W = 1280, H = 720;
  var F = window.FILM;            /* the storyboard, plus the measured timeline */

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /* ---- easing ------------------------------------------------------- */
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var ease = function (v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  var inAt = function (t, at, span) { return ease((t - at) / (span || 0.45)); };

  /* ---- the timeline --------------------------------------------------- */
  var BEATS = F.beats;
  var TOTAL = F.total;

  function beatAt(t) {
    for (var i = 0; i < BEATS.length; i++) if (t < BEATS[i].end) return i;
    return BEATS.length - 1;
  }

  function field(i, name, dflt) {
    for (var k = i; k >= 0; k--) {
      var b = BEATS[k];
      if (b.art && b.art[name] != null) return b.art[name];
      if (k < i && b.scene !== BEATS[i].scene) break;
    }
    return dflt;
  }

  function fieldAt(t, i, name, dflt) {
    var now = field(i, name, dflt);
    var prev = i > 0 ? field(i - 1, name, dflt) : dflt;
    if (prev === now || typeof now !== "number" || typeof prev !== "number") return now;
    return prev + (now - prev) * inAt(t, BEATS[i].start, 0.5);
  }

  /* Each scene owns a colour, exactly as the science film does, so the film
     reads as chapters. Every value is a g4-lesson.css dark-theme token - the
     film invents no colours of its own (see the film's CSS header). */
  var HUE = {
    title: "#35BFB2", solids: "#F4C95D", nets: "#E9744F", symmetry: "#B78BD1",
    angles: "#6E9DE8", tessellate: "#4FD1A0", area: "#F4C95D", perimeter: "#E9744F",
    compound: "#F4C95D", irregular: "#4FD1A0", scale: "#B78BD1", recap: "#35BFB2",
    reflect: "#35BFB2"
  };

  /* ---- chrome -------------------------------------------------------- */
  function chrome(scene, t) {
    var pct = clamp(t / TOTAL, 0, 1) * 100;
    return '<header class="bar">' +
      '<span class="mark">E</span>' +
      '<span class="brand">Ehel Academy<b>' + esc(F.subtitle) + "</b></span>" +
      '<span class="unit">' + esc(F.title) + "</span>" +
      "</header>" +
      '<div class="rail"><i style="width:' + pct.toFixed(3) + '%"></i></div>';
  }

  function heading(scene, t, i) {
    if (!scene.heading) return "";
    var at = BEATS[scene.first].start;
    var a = inAt(t, at, 0.55), b = inAt(t, at + 0.12, 0.55);
    var cs = (scene.codes || []).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
    return '<div class="kicker" style="opacity:' + b.toFixed(3) + '">' +
        '<i class="dot"></i>' +
        '<span class="eyebrow">Chapter ' + (BEATS[i].scene + 1) + " of " + F.scenes.length + "</span>" +
        (cs ? '<div class="codes">' + cs + "</div>" : "") +
      "</div>" +
      '<h2 class="sceneh" style="opacity:' + a.toFixed(3) +
      ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(scene.heading) + "</h2>";
  }

  function band(beat, t) {
    var o = inAt(t, beat.start, 0.34);
    return '<footer class="band">' +
      '<p style="opacity:' + o.toFixed(3) + ";transform:translateY(" + ((1 - o) * 9).toFixed(2) + 'px)">' +
      esc(beat.say) + "</p></footer>";
  }

  /* A small label/value strip, echoing the lesson's own "working" panel
     (lines($("work6"), [...]) in c-shape-slides.js) without being it - the
     lesson's version is DOM-coupled and this redraws the same idea. */
  function workRows(rows) {
    return '<div class="work">' + rows.map(function (r) {
      return '<div class="wrow' + (r.total ? " total" : "") + '"><b>' + esc(r.k) + "</b><span>" + r.v + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---- scene: the title card -------------------------------------------
     A motif of the three families this lesson touches - a solid, an angle,
     a grid - rather than any one figure, because no single shape stands for
     "shape and measures" the way the skeleton stands for Bones and Muscles. */
  function titleMotif(a) {
    return '<svg viewBox="0 0 300 300" role="img" aria-label="A cube, a right angle, and a measuring grid">' +
      '<g class="tmotif">' +
      '<path class="f1" d="M60,150 L150,150 L150,230 L60,230 Z"/>' +
      '<path class="f2" d="M60,150 L100,110 L190,110 L150,150 Z"/>' +
      '<path class="f3" d="M150,150 L190,110 L190,190 L150,230 Z"/>' +
      '<g transform="translate(170,40)"><path class="wedge" d="M0,80 L0,0 L80,80 Z"/><path class="sq" d="M0,60 L20,60 L20,80"/></g>' +
      '<g transform="translate(30,220)">' + gridCells(4, 3, 14) + "</g>" +
      "</g></svg>";
  }

  function sceneTitle(scene, beat, t) {
    var a = inAt(t, BEATS[scene.first].start, 1.0);
    var b = inAt(t, BEATS[scene.first + 1].start, 0.7);
    return '<div class="title">' +
      '<div class="tfig figure glow" style="opacity:' + (0.18 + a * 0.82).toFixed(3) +
        ";transform:translateY(" + ((1 - a) * 26).toFixed(2) + "px) scale(" + (0.94 + a * 0.06).toFixed(3) + ')">' +
        titleMotif(a) + "</div>" +
      '<div class="tw">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">' + esc(F.subtitle) + " · Unit lecture</p>" +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(F.title) + "</h1>" +
        '<p class="tsub" style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 12).toFixed(2) + 'px)">' +
          "Solids, nets, symmetry and angles.<br>Then area, perimeter, and reading a scale.</p>" +
      "</div></div>";
  }

  /* ---- shapes drawn fresh, matching the lesson's own dark-theme classes -- */
  function gridCells(cols, rows, cell) {
    var g = "";
    for (var x = 0; x < cols; x++) for (var y = 0; y < rows; y++)
      g += '<rect class="cell" x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '"/>';
    return g;
  }

  /* ---- scene: solids ----------------------------------------------------
     One solid shown large, the others waiting in a strip on the right - the
     same "figure + list" grammar the science film uses for its bones, redone
     with maths' own vocabulary of faces, edges and vertices. */
  var SOLIDS = {
    cube: { label: "Cube", faces: 6, edges: 12, vertices: 8, note: "6 identical squares",
      draw: '<path class="f1" d="M60,140 L160,140 L160,220 L60,220 Z"/><path class="f2" d="M60,140 L104,98 L204,98 L160,140 Z"/><path class="f3" d="M160,140 L204,98 L204,178 L160,220 Z"/>' },
    pyramid: { label: "Square-based pyramid", faces: 5, edges: 8, vertices: 5, note: "1 square + 4 triangles",
      draw: '<path class="f1" d="M40,210 L150,210 L192,178 L82,178 Z"/><path class="f2" d="M40,210 L150,210 L120,64 Z"/><path class="f3" d="M150,210 L192,178 L120,64 Z"/>' },
    cylinder: { label: "Cylinder", faces: 2, edges: 0, vertices: 0, curved: true, note: "2 circles + 1 curved surface",
      draw: '<path class="f3" d="M52,96 L52,196 A76,26 0 0,0 204,196 L204,96 Z"/><ellipse class="f1" cx="128" cy="96" rx="76" ry="26"/>' }
  };
  var SOLID_ORDER = ["cube", "pyramid", "cylinder"];

  function sceneSolids(scene, beat, t, i) {
    var key = field(i, "solid", null);
    var seen = {};
    for (var k = scene.first; k <= i; k++) { var s = BEATS[k].art && BEATS[k].art.solid; if (s) seen[s] = true; }
    var S = key ? SOLIDS[key] : null;

    var list = SOLID_ORDER.map(function (id, n) {
      var had = !!seen[id], now = id === key;
      var o = had ? 1 : 0.3;
      return '<li class="' + (now ? "now" : had ? "had" : "") + '" style="opacity:' + o + '">' +
        '<span class="tick">' + (had ? "✓" : n + 1) + "</span>" + esc(SOLIDS[id].label) + "</li>";
    }).join("");

    var fig = S
      ? '<svg viewBox="0 0 260 260" role="img" aria-label="' + esc(S.label) + '"><g class="solidfig">' + S.draw + "</g></svg>"
      : '<svg viewBox="0 0 260 260" role="img" aria-label="A solid"></svg>';

    var facts = S
      ? workRows([
          { k: "Flat faces", v: "<b>" + S.faces + "</b>" + (S.curved ? " + 1 curved surface" : "") },
          { k: "Edges", v: S.curved ? "no straight edges" : "<b>" + S.edges + "</b> — where two faces meet" },
          { k: "Vertices", v: S.curved ? "no corners" : "<b>" + S.vertices + "</b> — where the edges meet", total: true }
        ])
      : workRows([{ k: "A solid has", v: "flat faces, the edges where two meet, and vertices where edges meet", total: true }]);

    return '<div class="solids">' +
      '<div class="figure glow' + (S ? " lit" : "") + '">' + fig + "</div>" +
      '<div class="sside"><ol class="blist">' + list + "</ol>" + facts + "</div>" +
      "</div>";
  }

  /* ---- scene: nets ------------------------------------------------------
     A flat net on the left, the folded solid on the right, joined by an
     arrow that fills in once the beat says "folded". No 3D fold animation -
     see the README for why that was cut from this build. */
  function netSvg() {
    return '<svg viewBox="0 0 200 160" role="img" aria-label="A net of six squares"><g class="netfig">' +
      '<rect x="70" y="10" width="40" height="40"/><rect x="30" y="50" width="40" height="40"/>' +
      '<rect x="70" y="50" width="40" height="40"/><rect x="110" y="50" width="40" height="40"/>' +
      '<rect x="150" y="50" width="40" height="40"/><rect x="70" y="90" width="40" height="40"/>' +
      "</g></svg>";
  }

  /* The opacity that fades the net out and the cube in lives on the .figure
     wrapper itself, exactly as every other figure in this file does - an
     extra div between .figure and its svg breaks .figure svg's height:100%,
     because that percentage resolves against the wrapper's own (auto, and so
     effectively zero) height rather than the .figure box's explicit one. */
  /* Six squares in a straight line. The one arrangement a child is most likely
     to believe is a net of a cube, because it has the right number of squares,
     and the one that plainly cannot close: it rolls into a tube with nothing
     left over to become the top or the bottom. 4Gg.06 is MATCHING nets to
     solids, and matching needs something that does not match - one working net
     and no counter-example only shows what a net is. */
  function stripSvg() {
    var g = "";
    for (var k = 0; k < 6; k++) g += '<rect x="' + (5 + k * 40) + '" y="10" width="40" height="40"/>';
    return '<svg viewBox="0 0 250 60" role="img" aria-label="Six squares in a straight line"><g class="netfig">' + g + "</g></svg>";
  }

  function sceneNets(scene, beat, t, i) {
    if (field(i, "net", "cross") === "strip") {
      var s = inAt(t, BEATS[i].start + 0.2, 0.6);
      return '<div class="nets">' +
        '<div class="figure glow strip">' + stripSvg() + "</div>" +
        '<div class="sside"><div class="badge no" style="opacity:' + s.toFixed(3) + '">won’t fold into a cube</div>' +
          workRows([
            { k: "Six squares", v: "the right number" },
            { k: "Folded up", v: "a tube, with <b>no top and no bottom</b>", total: true }
          ]) +
        "</div></div>";
    }
    var folded = field(i, "folded", 0);
    var a = ease(folded);
    return '<div class="nets">' +
      '<div class="figure glow" style="opacity:' + (1 - a * 0.55).toFixed(3) + '">' + netSvg() + "</div>" +
      '<div class="arrow" style="opacity:' + a.toFixed(3) + '">→</div>' +
      '<div class="figure glow' + (a > 0.5 ? " lit" : "") + '" style="opacity:' + (0.25 + a * 0.75).toFixed(3) + '">' +
        '<svg viewBox="0 0 260 260" role="img" aria-label="A cube"><g class="solidfig">' + SOLIDS.cube.draw + "</g></svg>" +
      "</div></div>";
  }

  /* ---- scene: symmetry ----------------------------------------------- */
  var SYM_SHAPES = {
    square: { d: "M60,60 L200,60 L200,200 L60,200 Z", all: ["H", "V", "D1", "D2"] },
    triangle: { d: "M130,50 L200,200 L60,200 Z", all: ["V"] },
    parallelogram: { d: "M50,180 L110,80 L210,80 L150,180 Z", all: [] }
  };
  var SYM_LINES = {
    H: ["M30,130 L230,130"], V: ["M130,30 L130,230"],
    D1: ["M40,215 L215,40"], D2: ["M40,40 L215,215"]
  };
  var SYM_NAME = { H: "horizontal", V: "vertical", D1: "diagonal ⟋", D2: "diagonal ⟍" };

  function sceneSymmetry(scene, beat, t, i) {
    var shape = field(i, "shape", "square");
    var lines = field(i, "lines", []);
    var S = SYM_SHAPES[shape];
    var svg = '<path class="shape" d="' + S.d + '"/>' +
      lines.map(function (k) { return '<path class="mirror" d="' + SYM_LINES[k][0] + '"/>'; }).join("");
    var rows = ["H", "V", "D1", "D2"].map(function (k) {
      var found = lines.indexOf(k) >= 0;
      return '<li class="' + (found ? "had" : "") + '"><span class="tick">' + (found ? "✓" : "–") + "</span>" + SYM_NAME[k] + "</li>";
    }).join("");
    return '<div class="symmetry">' +
      '<div class="figure glow"><svg viewBox="0 0 260 260" role="img" aria-label="' + esc(shape) + ' with its lines of symmetry">' + svg + "</svg></div>" +
      '<div class="sside"><ol class="blist tight">' + rows + "</ol>" +
        '<p class="scount">' + (S.all.length === 0 ? "no lines of symmetry" : lines.length + " of " + S.all.length + " found") + "</p>" +
      "</div></div>";
  }

  /* ---- scene: angles ---------------------------------------------------- */
  function angleName(d) { return d < 90 ? "acute" : d === 90 ? "right" : "obtuse"; }

  /* L, the arm length, defaults to what every existing call has always drawn,
     so a call without it renders the identical figure. It exists for the
     compare view, where the whole point is two angles whose ARMS mislead. */
  function angleSvg(deg, L) {
    var cx = 40, cy = 200, a = (-deg * Math.PI) / 180;
    L = L || 210;
    var x = cx + L * Math.cos(a), y = cy + L * Math.sin(a);
    var r = 66, xs = cx + r, xe = cx + r * Math.cos(a), ye = cy + r * Math.sin(a);
    var svg = '<path class="wedge" d="M' + cx + "," + cy + " L" + xs + "," + cy + " A" + r + "," + r + " 0 0,0 " +
      xe.toFixed(1) + "," + ye.toFixed(1) + ' Z"/>';
    if (deg === 90) svg += '<path class="sq" d="M' + (cx + 24) + "," + cy + " L" + (cx + 24) + "," + (cy - 24) + " L" + cx + "," + (cy - 24) + '"/>';
    svg += '<line class="arm" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + L) + '" y2="' + cy + '"/>' +
      '<line class="arm now" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
      '<text class="deg" x="' + (cx + 84) + '" y="' + (cy - 24) + '">' + deg + "°</text>";
    return '<svg viewBox="0 0 300 260" role="img" aria-label="An angle of ' + deg + ' degrees">' + svg + "</svg>";
  }

  /* Two angles side by side for 4Gg.08's COMPARE, built on the misconception a
     Stage 4 child brings to it: that the angle with the longer lines is the
     bigger one. A has long arms and little turn; B has short arms and a lot.
     B is bigger, and the scene says why on the same frame. */
  function compareAngles(cmp, t, i) {
    var b = inAt(t, BEATS[i].start + 1.2, 0.7);
    var one = function (tag, spec, big) {
      return '<div class="cmpfig' + (big ? " big" : "") + '">' +
        '<div class="figure glow' + (big && b > 0.5 ? " lit" : "") + '">' + angleSvg(spec.deg, spec.L) + "</div>" +
        '<span class="cmptag">' + tag + "</span></div>";
    };
    return '<div class="angles compare">' +
      one("A", cmp.a, false) + one("B", cmp.b, true) +
      '<div class="sside"><div class="badge yes" style="opacity:' + b.toFixed(3) + '">B is bigger</div>' +
        workRows([
          { k: "Longer lines?", v: "they make an angle <b>no</b> bigger" },
          { k: "More turn?", v: "that is what makes it bigger", total: true }
        ]) +
      "</div></div>";
  }

  function sceneAngles(scene, beat, t, i) {
    var cmp = field(i, "compare", null);
    if (cmp) return compareAngles(cmp, t, i);
    var deg = fieldAt(t, i, "deg", 90);
    var name = angleName(Math.round(deg));
    var est = field(i, "estimate", null);
    return '<div class="angles">' +
      '<div class="figure glow lit">' + angleSvg(Math.round(deg)) + "</div>" +
      '<div class="sside"><div class="badge ' + name + '">' + name + "</div>" +
        workRows((est ? [{ k: "Estimate", v: est, total: true }] : []).concat([
          { k: "Right angle", v: "exactly 90° — a square corner", total: !est && name === "right" },
          { k: "Acute", v: "less than 90°", total: !est && name === "acute" },
          { k: "Obtuse", v: "more than 90°, less than 180°", total: !est && name === "obtuse" }
        ])) +
      "</div></div>";
  }

  /* ---- scene: tessellate -------------------------------------------- */
  function tessSvg(pattern) {
    if (pattern === "hexagon") {
      var g = "";
      for (var i = 0; i < 6; i++) {
        var a0 = i * 60 * Math.PI / 180, a1 = (i + 1) * 60 * Math.PI / 180;
        g += '<polygon class="' + (i % 2 ? "t1" : "t2") + '" points="130,130 ' +
          (130 + 78 * Math.cos(a0)).toFixed(1) + "," + (130 + 78 * Math.sin(a0)).toFixed(1) + " " +
          (130 + 78 * Math.cos(a1)).toFixed(1) + "," + (130 + 78 * Math.sin(a1)).toFixed(1) + '"/>';
      }
      return '<svg viewBox="0 0 260 260" role="img" aria-label="Six triangles making a hexagon">' + g + "</svg>";
    }
    if (pattern === "circles") {
      var c = "";
      for (var r = 0; r < 3; r++) for (var col = 0; col < 3; col++)
        c += '<circle class="t1" cx="' + (50 + col * 80) + '" cy="' + (50 + r * 80) + '" r="36"/>';
      return '<svg viewBox="0 0 260 260" role="img" aria-label="Circles packed together, leaving gaps">' + c + "</svg>";
    }
    return '<svg viewBox="0 0 260 260" role="img" aria-label="Two triangles making a square">' +
      '<polygon class="t1" points="70,60 70,190 200,190"/><polygon class="t2" points="70,60 200,60 200,190"/></svg>';
  }

  function sceneTessellate(scene, beat, t, i) {
    var pattern = field(i, "pattern", "triangles");
    var tessellates = pattern !== "circles";
    return '<div class="tessellate">' +
      '<div class="figure glow lit">' + tessSvg(pattern) + "</div>" +
      '<div class="sside"><div class="badge ' + (tessellates ? "yes" : "no") + '">' +
        (tessellates ? "tessellates" : "gaps left over") + "</div></div>" +
      "</div>";
  }

  /* ---- scenes: area, perimeter, compound, irregular ---------------------
     One renderer, four different pieces of data - the same reuse the science
     film gets from listScene(), here for four grids instead of three lists. */
  function gridScene(mode) {
    return function (scene, beat, t, i) {
      var cols = field(i, "cols", 9), rows = field(i, "rows", 7);
      var fillA = field(i, "fillA", null), fillB = field(i, "fillB", null), border = field(i, "border", null);
      var rowsData = field(i, "rowsData", []);
      /* showRows shades alternate rows of the fill, so "five in each row, three
         rows" is something the child can SEE while it is said. 4Gg.03 asks for
         the formula to be DERIVED; asserting length x width after a count is
         using it, and the rows are the step between the two. */
      var showRows = field(i, "showRows", false);
      var cell = Math.min(46, Math.floor(420 / cols), Math.floor(300 / rows));
      var vw = cols * cell + 20, vh = rows * cell + 20;
      var svg = gridCells(cols, rows, cell);
      var fill = function (cls, r) {
        if (!r) return "";
        var g = "";
        for (var x = r.x; x < r.x + r.w; x++) for (var y = r.y; y < r.y + r.h; y++)
          g += '<rect class="' + cls + (showRows && cls === "fillA" && (y - r.y) % 2 ? " alt" : "") +
            '" x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '"/>';
        return g;
      };
      /* perimeter draws the BOUNDARY, not a fill - the scene exists to keep
         "the distance round the edge" visually distinct from "the space
         inside", which a filled rectangle (indistinguishable from the area
         scene) would not do */
      var outline = border
        ? '<rect class="gridborder" x="' + (border.x * cell) + '" y="' + (border.y * cell) +
          '" width="' + (border.w * cell) + '" height="' + (border.h * cell) + '"/>'
        : "";
      svg = '<g transform="translate(10,10)">' + svg + fill("fillA", fillA) + fill("fillB", fillB) + outline + "</g>";
      return '<div class="' + mode + '">' +
        '<div class="figure glow lit"><svg viewBox="0 0 ' + vw + " " + vh + '" role="img" aria-label="A grid">' + svg + "</svg></div>" +
        '<div class="sside">' + workRows(rowsData) + "</div>" +
        "</div>";
    };
  }

  /* ---- scene: irregular (counting whole and part squares) ---------------
     The outline and the whole/part colouring are DERIVED from the same
     polygon, the way the lesson's own newBlob() classifies cells (point-in-
     polygon, five probes per cell) - fixed points rather than newBlob's
     Math.random(), so a re-render draws the identical leaf every time. */
  var BLOB_CELL = 34, BLOB_COLS = 8, BLOB_ROWS = 8;
  /* a fixed leaf shape (16 points on a wobbled ellipse) - classifies to 9
     whole squares and 12 part squares at the probes below; not hand-tuned
     cell by cell, so the outline and the colouring cannot disagree */
  var BLOB_PTS = [
    [5.86, 3.5], [5.86, 4.57], [5.05, 5.19], [4.16, 5.23], [3.5, 5.38], [2.66, 5.72],
    [1.69, 5.48], [1.33, 4.49], [1.66, 3.5], [1.98, 2.81], [2.08, 1.94], [2.55, 0.98],
    [3.5, 0.78], [4.27, 1.47], [4.66, 2.23], [5.21, 2.73]
  ];
  var BLOB_CELLS = null;   /* computed once, on first use */

  function blobPointInside(px, py) {
    var inside = false;
    for (var i = 0, j = BLOB_PTS.length - 1; i < BLOB_PTS.length; j = i++) {
      var xi = BLOB_PTS[i][0], yi = BLOB_PTS[i][1], xj = BLOB_PTS[j][0], yj = BLOB_PTS[j][1];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function blobCells() {
    if (BLOB_CELLS) return BLOB_CELLS;
    var probe = [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85], [0.5, 0.5]];
    var cells = [];
    for (var x = 0; x < BLOB_COLS; x++) for (var y = 0; y < BLOB_ROWS; y++) {
      var n = 0;
      for (var p = 0; p < probe.length; p++) if (blobPointInside(x + probe[p][0], y + probe[p][1])) n++;
      if (n === probe.length) cells.push([x, y, "whole"]);
      else if (n > 0) cells.push([x, y, "part"]);
    }
    BLOB_CELLS = cells;
    return cells;
  }

  function sceneIrregular(scene, beat, t, i) {
    var reveal = field(i, "reveal", "none");
    var cell = BLOB_CELL, cols = BLOB_COLS, rows = BLOB_ROWS, vw = cols * cell + 20, vh = rows * cell + 20;
    var cells = blobCells();
    var whole = cells.filter(function (c) { return c[2] === "whole"; }).length;
    var part = cells.filter(function (c) { return c[2] === "part"; }).length;
    var g = '<g transform="translate(10,10)">' + gridCells(cols, rows, cell);
    cells.forEach(function (c) {
      var show = c[2] === "whole" ? (reveal === "whole" || reveal === "all") : reveal === "all";
      if (show) g += '<rect class="' + (c[2] === "whole" ? "fillA" : "fillB") + '" x="' + (c[0] * cell) + '" y="' + (c[1] * cell) + '" width="' + cell + '" height="' + cell + '"/>';
    });
    g += '<path class="blobline" d="M' + BLOB_PTS.map(function (p) { return (p[0] * cell).toFixed(1) + "," + (p[1] * cell).toFixed(1); }).join(" L") + ' Z"/></g>';
    var est = whole + part / 2;
    return '<div class="irregular">' +
      '<div class="figure glow lit"><svg viewBox="0 0 ' + vw + " " + vh + '" role="img" aria-label="An irregular shape on a grid">' + g + "</svg></div>" +
      '<div class="sside">' + workRows([
        { k: "Whole squares", v: "<b>" + whole + "</b> completely inside" },
        { k: "Part squares", v: "<b>" + part + "</b> only partly covered" },
        { k: "Count parts as halves", v: part + " ÷ 2 = <b>" + (part / 2) + "</b>" },
        { k: "About", v: whole + " + " + (part / 2) + " = <b>" + est + "</b> squares", total: true }
      ]) + "</div></div>";
  }

  /* ---- scene: scale (reading between the marks) ------------------------- */
  function sceneScale(scene, beat, t, i) {
    var step = field(i, "step", 100), sub = field(i, "sub", 4), marks = field(i, "marks", 5), unit = field(i, "unit", "ml");
    var pos = fieldAt(t, i, "pos", 0);
    var top = (marks - 1) * sub;
    var whole = Math.floor(pos / sub), rem = pos - whole * sub;
    var value = Math.round((whole * step + (rem / sub) * step) * 100) / 100;
    var x0 = 40, x1 = 1000, w = x1 - x0;
    var g = '<line class="axis" x1="' + x0 + '" y1="120" x2="' + x1 + '" y2="120"/>';
    for (var m = 0; m < marks; m++) {
      var x = x0 + (m / (marks - 1)) * w;
      g += '<line class="big" x1="' + x + '" y1="96" x2="' + x + '" y2="144"/>';
      g += '<text class="lab" x="' + x + '" y="172">' + (m * step) + "</text>";
      if (m < marks - 1) for (var s = 1; s < sub; s++) {
        var xs = x + (s / sub) * (w / (marks - 1));
        g += '<line class="small" x1="' + xs + '" y1="104" x2="' + xs + '" y2="136"/>';
      }
    }
    var px = x0 + (pos / top) * w;
    g += '<polygon class="ptr" points="' + px + ',72 ' + (px - 12) + ',40 ' + (px + 12) + ',40" />';
    g += '<text class="val" x="' + px + '" y="24">' + value + " " + unit + "</text>";
    return '<div class="scale">' +
      '<div class="figure glow lit"><svg viewBox="0 0 1040 190" role="img" aria-label="A measuring scale">' + g + "</svg></div>" +
      '<div class="sside">' + workRows([
        { k: "Big marks", v: "every <b>" + step + " " + unit + "</b>" },
        { k: "Small marks", v: "split each gap into <b>" + sub + "</b>" },
        { k: "It reads", v: "<b>" + value + " " + unit + "</b>", total: true }
      ]) + "</div></div>";
  }

  /* ---- scene: recap ----------------------------------------------------- */
  function sceneRecap(scene, beat, t, i) {
    var lit = fieldAt(t, i, "lit", 0);
    var sign = field(i, "sign", false);
    var cards = (F.recap || []).map(function (r, n) {
      var on = clamp(lit - n + 1, 0, 1);
      return '<div class="card' + (on > 0.5 ? " on" : "") + '" style="opacity:' + (0.28 + on * 0.72).toFixed(3) +
        ";transform:translateY(" + ((1 - on) * 18).toFixed(2) + "px) scale(" + (0.96 + on * 0.04).toFixed(3) + ')">' +
        '<span class="ic">' + r[0] + "</span><b>" + esc(r[1]) + "</b><i>" + esc(r[2]) + "</i></div>";
    }).join("");
    var s = sign ? inAt(t, BEATS[i].start, 0.5) : 0;
    return '<div class="rows recap">' + cards +
      (sign ? '<div class="signoff" style="opacity:' + s.toFixed(3) + ";transform:scale(" + (0.9 + s * 0.1).toFixed(3) + ')">Now go and measure something yourself.</div>' : "") +
      "</div>";
  }

  /* ---- scene: reflect (4Gp.03) ------------------------------------------
     "Reflect 2D shapes in a horizontal or vertical mirror line, including
     where the mirror line is the edge of the shape, on square grids." The
     storyboard used to have no scene for this at all: it gathered the
     lesson's objectives by the 4Gg prefix, and 4Gp.03 sits in a different
     sub-strand, so it was never in the list to cover.

     The SHAPE MUST BE ASYMMETRIC. On a symmetric shape a reflection and a
     slide draw the same picture, and the scene would teach nothing about the
     one thing a child gets wrong - sliding instead of flipping. An L shows it.

     The motion carries the idea. A connector leaves each square and travels
     STRAIGHT across the line to where that square's image lands, and the
     image squares appear as the connectors arrive. Squares near the line travel
     a little, squares far from it travel a lot, which is what turns the shape
     over; a slide would move every square the same distance. */
  function reflectCells(cells, axis, m) {
    return cells.map(function (c) {
      return axis === "v" ? [2 * m - c[0] - 1, c[1]] : [c[0], 2 * m - c[1] - 1];
    });
  }

  function sceneReflect(scene, beat, t, i) {
    var cols = field(i, "cols", 11), rows = field(i, "rows", 8);
    var axis = field(i, "axis", "v"), m = field(i, "m", 5);
    var cells = field(i, "cells", []);
    var rowsData = field(i, "rowsData", []);
    /* the image is drawn afresh on each beat that asks for it, 0.5s in, so
       the child has a moment to look at the shape before its reflection */
    var reveal = field(i, "show", false) ? inAt(t, BEATS[i].start + 0.5, 1.4) : 0;
    var cell = Math.min(40, Math.floor(430 / cols), Math.floor(330 / rows));
    var img = reflectCells(cells, axis, m);
    var sq = function (c, cls, op) {
      return '<rect class="' + cls + '" x="' + (c[0] * cell) + '" y="' + (c[1] * cell) +
        '" width="' + cell + '" height="' + cell + '" opacity="' + op.toFixed(3) + '"/>';
    };
    var svg = gridCells(cols, rows, cell);
    var imgOp = clamp((reveal - 0.55) / 0.45, 0, 1);
    svg += img.map(function (c) { return sq(c, "img", imgOp); }).join("");
    svg += cells.map(function (c) { return sq(c, "obj", 1); }).join("");
    if (reveal > 0) {
      var p = clamp(reveal / 0.7, 0, 1);
      svg += cells.map(function (c, k) {
        var x1 = (c[0] + 0.5) * cell, y1 = (c[1] + 0.5) * cell;
        var x2 = (img[k][0] + 0.5) * cell, y2 = (img[k][1] + 0.5) * cell;
        return '<line class="link" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
          '" x2="' + (x1 + (x2 - x1) * p).toFixed(1) + '" y2="' + (y1 + (y2 - y1) * p).toFixed(1) + '"/>';
      }).join("");
    }
    var mline = axis === "v"
      ? '<line class="mline" x1="' + (m * cell) + '" y1="-8" x2="' + (m * cell) + '" y2="' + (rows * cell + 8) + '"/>'
      : '<line class="mline" x1="-8" y1="' + (m * cell) + '" x2="' + (cols * cell + 8) + '" y2="' + (m * cell) + '"/>';
    var vw = cols * cell + 20, vh = rows * cell + 20;
    return '<div class="reflect">' +
      '<div class="figure glow lit"><svg viewBox="0 0 ' + vw + " " + vh + '" role="img" aria-label="A shape and its reflection in a ' +
        (axis === "v" ? "vertical" : "horizontal") + ' mirror line"><g transform="translate(10,10)">' + svg + mline + "</g></svg></div>" +
      '<div class="sside">' + workRows(rowsData) + "</div>" +
      "</div>";
  }

  var KINDS = {
    title: sceneTitle,
    solids: sceneSolids,
    nets: sceneNets,
    symmetry: sceneSymmetry,
    reflect: sceneReflect,
    angles: sceneAngles,
    tessellate: sceneTessellate,
    area: gridScene("area"),
    perimeter: gridScene("perimeter"),
    compound: gridScene("compound"),
    irregular: sceneIrregular,
    scale: sceneScale,
    recap: sceneRecap
  };

  /* ---- the title card and the end card ---------------------------------
     Same shape as the science film's cards - see that file's comments for
     why these are timeline segments rather than beats. */
  function openCard(t) {
    var c = F.cards.open;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.15, 0.85);
    var b = inAt(t, c.start + 0.55, 0.9);
    var d = inAt(t, c.start + 1.15, 0.9);
    var out = 1 - ease((u - 0.86) / 0.14);
    return '<div class="card-slide open" style="opacity:' + (a * out).toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.13).toFixed(3) +
        ";transform:scale(" + (1.04 + u * 0.05).toFixed(4) + ')">' + titleMotif(1) + "</div>" +
      '<div class="cs-in">' +
        '<div class="cs-mark" style="opacity:' + a.toFixed(3) +
          ";transform:scale(" + (0.86 + a * 0.14).toFixed(3) + ')">E</div>' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">Ehel Academy · ' + esc(F.subtitle) + "</p>" +
        '<h1 style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 18).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + d.toFixed(3) + ')"></div>' +
        '<p class="cs-by" style="opacity:' + d.toFixed(3) +
          ";transform:translateY(" + ((1 - d) * 8).toFixed(2) + 'px)">' +
          "A short unit lecture by the Ehel Academy Virtual Teacher</p>" +
        '<p class="cs-sub" style="opacity:' + inAt(t, c.start + 1.55, 0.8).toFixed(3) +
          '">Cambridge Primary Mathematics 0096 · Stage ' + esc(F.stage) + "</p>" +
      "</div></div>";
  }

  function endCard(t) {
    var c = F.cards.end;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.35, 0.8);
    var b = inAt(t, c.start + 0.85, 0.8);
    var codes = (F.objectives || []).map(function (o, n) {
      var k = inAt(t, c.start + 1.15 + n * 0.09, 0.5);
      return '<span style="opacity:' + k.toFixed(3) +
        ";transform:translateY(" + ((1 - k) * 8).toFixed(2) + 'px)">' + esc(o[0]) + "</span>";
    }).join("");
    return '<div class="card-slide end" style="opacity:' + a.toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.11).toFixed(3) +
        ";transform:scale(" + (1.0 + u * 0.05).toFixed(4) + ')">' + titleMotif(1) + "</div>" +
      '<div class="cs-in">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">That is the whole lesson</p>' +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 14).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + b.toFixed(3) + ')"></div>' +
        '<p class="cs-cap" style="opacity:' + b.toFixed(3) + '">What this lesson covered</p>' +
        '<div class="cs-codes">' + codes + "</div>" +
        '<p class="cs-sign" style="opacity:' + inAt(t, c.start + 2.2, 0.8).toFixed(3) + '">' +
          '<span class="cs-mark sm">E</span>Ehel Academy · ' + esc(F.subtitle) + "</p>" +
      "</div></div>";
  }

  /* ---- the frame --------------------------------------------------------- */
  function frame(t) {
    var film = document.getElementById("film");
    if (F.cards && t < F.cards.open.end) {
      film.style.setProperty("--hue", HUE.title);
      film.innerHTML = openCard(t);
      return;
    }
    if (F.cards && t >= F.cards.end.start) {
      film.style.setProperty("--hue", HUE.recap);
      film.innerHTML = endCard(t);
      return;
    }

    var i = beatAt(t);
    var beat = BEATS[i];
    var scene = F.scenes[beat.scene];
    var draw = KINDS[scene.kind];

    var fade = inAt(t, scene.start, 0.4);
    film.style.setProperty("--hue", HUE[scene.id] || "#35BFB2");

    var span = Math.max(scene.end - scene.start, 0.001);
    var d = clamp((t - scene.start) / span, 0, 1);

    film.innerHTML =
      chrome(scene, t) +
      '<main class="stage" style="opacity:' + fade.toFixed(3) +
        ";transform:translateY(" + ((1 - fade) * 14 - d * 6).toFixed(2) +
        "px) scale(" + (1 + d * 0.012).toFixed(4) + ')">' +
        heading(scene, t, i) +
        draw(scene, beat, t, i) +
      "</main>" +
      band(beat, t);
  }

  window.EHEL_FILM = { frame: frame, total: TOTAL };
})();

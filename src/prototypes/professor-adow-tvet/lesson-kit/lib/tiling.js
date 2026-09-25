/* ====================================================================
   Home Repair — this module's own drawings.

   kit.js carries the machinery and every step kind this module uses
   (lecture, label, safety, order, browse, questions, words). Nothing
   here adds a renderer; it adds the PICTURES those renderers draw.
   A tiling page loads no carpentry file and no digital one.

   WHY THE WALL IS ALWAYS DRAWN WITH ITS NEIGHBOURS IN IT. Every picture
   in this lesson shows the broken tile surrounded by sound ones, because
   that is the whole difficulty of the job and the thing a photograph of
   a single tile would hide. Nothing here is hard; everything here is
   one slip away from turning a one-tile repair into a three-tile one,
   and a learner who only ever sees the tile being worked on has not
   been shown the risk.

   The grout lines are drawn as GAPS, not as lines on top of the tiles,
   so that a raked joint can be shown as an empty channel and a grouted
   one as a filled channel without redrawing the wall.
   ==================================================================== */
(function () {
  const C = window.CARP;
  const { el, svg, tok, R } = C;

  const TILE = "#DCE6EA", TILE_D = "#A8BCC6", TILE_FACE = "#E9F1F4";
  const GROUT = "#8C9AA3", BED = "#6E5B4A", BED_D = "#54453A";
  const STEEL = "#B9C6D0", STEEL_D = "#7E8E9B";
  const HANDLE = "#7A4A22", HANDLE_D = "#5E3A1B";
  const TAPE = "#E8D9A0", TAPE_D = "#C4B476";
  const ADHESIVE = "#CFCAC0";
  const ink = () => tok("--ink", "#E8F1F8");
  const muted = () => tok("--muted", "#93AABE");
  const teal = () => tok("--teal", "#4FBFA8");
  const bad = () => tok("--bad", "#F0806F");
  const good = () => tok("--good", "#4FD1A0");

  const box = (g, x, y, w, h, r, fill, stroke) =>
    el("rect", { x, y, width: w, height: h, rx: r, fill, stroke: stroke || TILE_D, "stroke-width": 2 }, g);
  const text = (g, x, y, s, size, anchor, fill) => {
    const t = el("text", { x, y, "font-size": size || 12, "text-anchor": anchor || "middle",
                           fill: fill || muted() }, g);
    t.textContent = s; return t;
  };
  const line = (g, x1, y1, x2, y2, stroke, w, extra) =>
    el("line", Object.assign({ x1, y1, x2, y2, stroke, "stroke-width": w || 2 }, extra || {}), g);
  const path = (g, d, fill, stroke, w, extra) =>
    el("path", Object.assign({ d, fill: fill || "none", stroke: stroke || "none", "stroke-width": w || 2 }, extra || {}), g);

  /* ---- the wall ------------------------------------------------------
     A 4x3 field of tiles with a 6px joint. `opts.broken` is the index of
     the tile that is damaged; `opts.missing` takes it out altogether.  */
  /* NOTHING HERE IS CLIPPED, and it is worth writing down why, because the
     evidence looks alarming. R.browse calls svg(360, 200) while these are
     registered at 380 x 240, so a glance at the viewBox says the bottom of
     the wall must be cut off. It is not: drawNamed scales the whole group by
     min(vb.w / spec.w, vb.h / spec.h) before drawing, so the declared size is
     a COORDINATE SPACE rather than a promise about pixels. Draw in whatever
     space suits the picture and let it scale — but keep the content close to
     the declared size, or the drawing arrives with a margin it did not ask
     for and looks small beside the others. */
  const TW = 74, TH = 60, JOINT = 6;
  const wallX = 36, wallY = 28;

  function tileXY(i) {
    const c = i % 4, r = Math.floor(i / 4);
    return [wallX + c * (TW + JOINT), wallY + r * (TH + JOINT)];
  }

  function drawWall(g, opts) {
    opts = opts || {};
    const target = opts.target == null ? 5 : opts.target;
    /* the bed shows through the joints and through any gap */
    box(g, wallX - JOINT, wallY - JOINT, 4 * TW + 5 * JOINT, 3 * TH + 4 * JOINT, 3,
      opts.raked ? BED : GROUT, GROUT);
    for (let i = 0; i < 12; i++) {
      const [x, y] = tileXY(i);
      if (i === target && opts.missing) {
        box(g, x, y, TW, TH, 2, BED, BED_D);
        if (opts.lumpy) {
          for (let k = 0; k < 5; k++) {
            el("ellipse", { cx: x + 12 + k * 13, cy: y + 18 + (k % 2) * 22, rx: 9, ry: 6,
                            fill: ADHESIVE, stroke: BED_D, "stroke-width": 1 }, g);
          }
        }
        continue;
      }
      box(g, x, y, TW, TH, 2, i === target && opts.newTile ? TILE_FACE : TILE, TILE_D);
      if (i === target && opts.broken) drawCrack(g, x, y);
    }
    return { target };
  }

  function drawCrack(g, x, y) {
    path(g, `M ${x + 8} ${y + 46} L ${x + 26} ${y + 24} L ${x + 22} ${y + 34} L ${x + 44} ${y + 12}`,
      null, bad(), 2.5);
    path(g, `M ${x + 26} ${y + 24} L ${x + 52} ${y + 40} L ${x + 66} ${y + 20}`, null, bad(), 2);
  }

  /* the masking X, drawn over whichever tile is the target */
  function drawTape(g, i) {
    const [x, y] = tileXY(i);
    const g2 = el("g", {}, g);
    for (const d of [[x + 4, y + 4, x + TW - 4, y + TH - 4], [x + TW - 4, y + 4, x + 4, y + TH - 4]]) {
      path(g2, `M ${d[0]} ${d[1]} L ${d[2]} ${d[3]}`, null, TAPE, 13, { "stroke-linecap": "square", opacity: 0.92 });
      path(g2, `M ${d[0]} ${d[1]} L ${d[2]} ${d[3]}`, null, TAPE_D, 13, { "stroke-linecap": "square", fill: "none", opacity: 0.25 });
    }
    return g2;
  }

  function drawHoles(g, i) {
    const [x, y] = tileXY(i);
    for (let k = 0; k < 5; k++) {
      const t = 0.14 + k * 0.18;
      el("circle", { cx: x + 4 + (TW - 8) * t, cy: y + 4 + (TH - 8) * t, r: 3, fill: "#22303A" }, g);
      el("circle", { cx: x + TW - 4 - (TW - 8) * t, cy: y + 4 + (TH - 8) * t, r: 3, fill: "#22303A" }, g);
    }
  }

  /* ---- the tools -----------------------------------------------------
     Drawn at a common scale on a board, because the label step asks the
     learner to pick one out of the set rather than admire it alone. */
  function chisel(g, x, y, w, bevel) {
    box(g, x, y + 10, w * 0.46, 18, 4, HANDLE, HANDLE_D);          /* handle */
    box(g, x + w * 0.46, y + 13, w * 0.42, 12, 1, STEEL, STEEL_D); /* shaft */
    path(g, bevel
      ? `M ${x + w * 0.88} ${y + 13} L ${x + w} ${y + 19} L ${x + w * 0.88} ${y + 25} z`
      : `M ${x + w * 0.88} ${y + 12} L ${x + w} ${y + 19} L ${x + w * 0.88} ${y + 26} z`,
      STEEL, STEEL_D, 1.5);
  }

  function rake(g, x, y) {
    box(g, x, y + 8, 46, 20, 5, HANDLE, HANDLE_D);
    line(g, x + 46, y + 18, x + 96, y + 18, STEEL_D, 4);
    path(g, `M ${x + 96} ${y + 10} l 14 8 l -14 8 z`, "#C9433A", "#8E2E28", 1.5);
  }

  function spreader(g, x, y, notched) {
    box(g, x, y + 6, 40, 18, 4, HANDLE, HANDLE_D);
    if (notched) {
      const g2 = el("g", {}, g);
      box(g2, x + 40, y, 74, 30, 2, STEEL, STEEL_D);
      for (let k = 0; k < 7; k++) box(g2, x + 46 + k * 10, y + 22, 5, 10, 0, tok("--card", "#112A3D"), "none");
    } else {
      box(g, x + 40, y + 2, 74, 26, 3, "#D8D2C4", "#A79F8E");
    }
  }

  function spacerCross(g, cx, cy, s) {
    const a = s * 0.3;
    path(g, `M ${cx - s} ${cy - a} h ${s - a} v ${-(s - a)} h ${2 * a} v ${s - a} h ${s - a} v ${2 * a} h ${-(s - a)} v ${s - a} h ${-2 * a} v ${-(s - a)} h ${-(s - a)} z`,
      "#E8C33A", "#B2941F", 1.5);
  }

  function goggles(g, x, y) {
    path(g, `M ${x} ${y + 16} q 30 -20 60 0 q -8 20 -30 20 q -22 0 -30 -20 z`, "#2E5A6E", "#1C3C4A", 2);
    el("ellipse", { cx: x + 18, cy: y + 18, rx: 11, ry: 9, fill: "#BEE3F0", opacity: 0.85 }, g);
    el("ellipse", { cx: x + 42, cy: y + 18, rx: 11, ry: 9, fill: "#BEE3F0", opacity: 0.85 }, g);
  }

  function glove(g, x, y) {
    path(g, `M ${x} ${y + 34} v -16 q 0 -8 7 -8 q 7 0 7 8 v -12 q 0 -8 7 -8 q 7 0 7 8 v 10 q 0 -8 7 -8 q 7 0 7 8 v 22 q 0 14 -14 14 h -14 q -14 0 -14 -18 z`,
      "#C96A3A", "#8E4623", 2);
  }

  /* ==== the registered drawings ======================================= */
  const TILING = {

    /* the tool board — the `label` step reads `parts` off this */
    toolBoard: {
      title: "the tools this job needs", w: 460, h: 300, draw(g) {
        chisel(g, 30, 24, 150, false);  text(g, 105, 16, "cold chisel", 11);
        chisel(g, 250, 24, 150, true);  text(g, 325, 16, "wood chisel", 11);
        rake(g, 30, 96);                text(g, 100, 88, "grout rake", 11);
        spreader(g, 250, 96, true);     text(g, 325, 88, "adhesive spreader", 11);
        spreader(g, 30, 170, false);    text(g, 100, 162, "grout spreader", 11);
        for (let k = 0; k < 3; k++) spacerCross(g, 268 + k * 34, 190, 13);
        text(g, 302, 162, "tile spacers", 11);
        goggles(g, 40, 236);            text(g, 70, 286, "goggles", 11);
        glove(g, 160, 228);             text(g, 186, 286, "gloves", 11);
        /* the drill, drawn small because it is the one tool most people own */
        box(g, 268, 240, 84, 30, 6, "#3C4B57", "#2A363F");
        box(g, 276, 270, 26, 24, 4, "#3C4B57", "#2A363F");
        line(g, 352, 255, 404, 255, STEEL_D, 5);
        text(g, 330, 292, "drill · 5 mm masonry bit", 11);
      },
      parts: [
        { id: "cold", label: "cold chisel", box: [24, 18, 168, 46],
          say: "The cold chisel. This is the one that breaks the tile OUT, working from the middle towards the edges. It is blunt on purpose — it is splitting a brittle thing, not cutting it." },
        { id: "wood", label: "wood chisel", box: [244, 18, 168, 46],
          say: "The wood chisel, used BEVEL SIDE DOWN to lift the last fragments and the old adhesive. Bevel down makes it ride up off the wall; bevel up drives it in behind the neighbouring tile." },
        { id: "rake", label: "grout rake", box: [24, 88, 168, 44],
          say: "The grout rake. It takes the grout out of the four joints BEFORE anything is broken, so the tile is no longer locked to its neighbours by a rim of set grout." },
        { id: "spreader", label: "adhesive spreader", box: [244, 88, 180, 48],
          say: "The notched adhesive spreader. The notches meter the bed: they leave ribs of a known height so the tile beds down flush instead of standing proud on a lump." },
        { id: "spacers", label: "tile spacers", box: [244, 162, 128, 52],
          say: "Tile spacers. They hold the joint an even width on all four sides while the adhesive goes off. Without them the tile drifts and the grout line tells everyone which tile was replaced." },
        { id: "ppe", label: "goggles and gloves", box: [24, 222, 200, 76],
          say: "Goggles and thick gloves, and neither is optional. A struck tile throws glazed splinters upwards, and a broken edge is as sharp as anything in the workshop." },
      ],
    },

    /* the wall, in the states the job passes through */
    wallBroken: { title: "the broken tile, in a sound wall", w: 380, h: 240,
      draw(g) { drawWall(g, { broken: true }); } },

    wallTaped: { title: "masked with two diagonals", w: 380, h: 240,
      draw(g) { drawWall(g, { broken: true }); drawTape(g, 5); } },

    wallDrilled: { title: "drilled along the tape", w: 380, h: 240,
      draw(g) { drawWall(g, { broken: true }); drawTape(g, 5); drawHoles(g, 5); } },

    wallRaked: { title: "grout raked from all four joints", w: 380, h: 240,
      draw(g) {
        drawWall(g, { broken: true });
        const [x, y] = tileXY(5);
        /* the four joints around the target, emptied to the bed */
        box(g, x - JOINT, y - JOINT, TW + 2 * JOINT, JOINT, 0, BED, BED_D);
        box(g, x - JOINT, y + TH, TW + 2 * JOINT, JOINT, 0, BED, BED_D);
        box(g, x - JOINT, y - JOINT, JOINT, TH + 2 * JOINT, 0, BED, BED_D);
        box(g, x + TW, y - JOINT, JOINT, TH + 2 * JOINT, 0, BED, BED_D);
        rake(g, x + TW + 16, y + 8);
      } },

    wallChipping: { title: "chipped from the centre outwards", w: 380, h: 240,
      draw(g) {
        drawWall(g, { broken: true });
        drawTape(g, 5);
        const [x, y] = tileXY(5);
        /* a hole opening at the CENTRE, fragments lifting away from it */
        path(g, `M ${x + 26} ${y + 20} L ${x + 50} ${y + 18} L ${x + 56} ${y + 40} L ${x + 30} ${y + 44} z`, BED, BED_D, 1.5);
        path(g, `M ${x + 58} ${y + 6} l 16 -10 l 6 12 z`, TILE, TILE_D, 1.2);
        path(g, `M ${x + 12} ${y + 52} l -14 12 l -4 -14 z`, TILE, TILE_D, 1.2);
        chisel(g, x + TW + 10, y + 6, 120, false);
        el("g", { transform: `rotate(-38 ${x + 40} ${y + 30})` }, g);
      } },

    wallBed: { title: "the bed, cleared flat", w: 380, h: 240,
      draw(g) { drawWall(g, { missing: true, lumpy: true }); chisel(g, wallX + 190, wallY + 70, 130, true); } },

    wallDryFit: { title: "dry-fitting before any adhesive", w: 380, h: 240,
      draw(g) {
        drawWall(g, { missing: true });
        const [x, y] = tileXY(5);
        /* the tile sitting proud on one edge: this is what "it rocks" looks like */
        el("g", { transform: `rotate(-4 ${x + TW / 2} ${y + TH / 2})` }, g);
        box(g, x, y - 5, TW, TH, 2, TILE_FACE, TILE_D);
        text(g, x + TW / 2, y + TH + 26, "it rocks — the bed is not flat", 12, "middle", bad());
      } },

    wallButtered: { title: "buttered and set flush", w: 380, h: 240,
      draw(g) {
        drawWall(g, { newTile: true });
        const [x, y] = tileXY(5);
        for (let k = 0; k < 4; k++) spacerCross(g, x + (k % 2 ? TW + 3 : -3), y + (k < 2 ? -3 : TH + 3), 9);
      } },

    wallGrouted: { title: "grouted, finished and polished", w: 380, h: 240,
      draw(g) {
        drawWall(g, { newTile: true });
        const [x, y] = tileXY(5);
        path(g, `M ${x + TW + 26} ${y + 10} q 18 14 0 28`, null, teal(), 3);
        text(g, x + TW / 2, y + TH + 26, "no longer the tile anyone looks at", 12, "middle", good());
      } },

    spacersOnly: { title: "tile spacers", w: 300, h: 180,
      draw(g) {
        for (let k = 0; k < 3; k++) spacerCross(g, 90 + k * 60, 90, 22);
      } },
  };

  C.registerAll(TILING, { w: 380, h: 240 });
})();

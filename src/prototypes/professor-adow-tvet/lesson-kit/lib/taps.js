/* ====================================================================
   Home Repair, unit HR.02 — the tap drawings.

   kit.js carries the machinery and every step kind this lesson uses
   (lecture, label, safety, order, browse, questions, words). Nothing
   here adds a renderer; it adds the PICTURES those renderers draw.

   EVERYTHING IS A CUTAWAY. A photograph of a tap shows a shiny object
   and hides the only thing that matters, which is what the stem does to
   the washer and what the washer does to the seat. A learner who has
   only seen the outside cannot reason about where the water is getting
   past, and "where is it getting past" is the whole diagnosis. So the
   body is drawn in section throughout, with the water path visible.

   THE TWO LEAKS ARE DRAWN DIFFERENTLY ON PURPOSE. A drip at the SPOUT
   and a weep at the STEM are different faults with different parts at
   fault, and a learner who does not separate them will strip a tap and
   replace a perfectly good washer. Every picture that shows a leak
   shows which of the two it is.

   UK / East African terms: tap, not faucet. Spout, not spigot. Gland
   nut and gland packing, not packing nut and packing. The source
   document is American and the wording here is not its wording.
   ==================================================================== */
(function () {
  const C = window.CARP;
  const { el, svg, tok, R } = C;

  const BRASS = "#C9A227", BRASS_D = "#94761A";
  const CHROME = "#C6D2DA", CHROME_D = "#8B9BA6";
  const BODY = "#AEBDC6", BODY_D = "#7A8A95";
  const RUBBER = "#3E4A52", RUBBER_D = "#252E34";
  const WATER = "#4FA3D1", WATER_D = "#2E7BA6";
  const PACK = "#D8CBA8", PACK_D = "#A99A73";
  const ink = () => tok("--ink", "#E8F1F8");
  const muted = () => tok("--muted", "#93AABE");
  const good = () => tok("--good", "#4FD1A0");
  const bad = () => tok("--bad", "#F0806F");
  const gold = () => tok("--gold", "#F4C95D");

  const box = (g, x, y, w, h, r, fill, stroke) =>
    el("rect", { x, y, width: w, height: h, rx: r, fill, stroke: stroke || BODY_D, "stroke-width": 2 }, g);
  const text = (g, x, y, s, size, anchor, fill) => {
    const t = el("text", { x, y, "font-size": size || 12, "text-anchor": anchor || "middle",
                           fill: fill || muted() }, g);
    t.textContent = s; return t;
  };
  const path = (g, d, fill, stroke, w, extra) =>
    el("path", Object.assign({ d, fill: fill || "none", stroke: stroke || "none", "stroke-width": w || 2 }, extra || {}), g);
  const line = (g, x1, y1, x2, y2, stroke, w, extra) =>
    el("line", Object.assign({ x1, y1, x2, y2, stroke, "stroke-width": w || 2 }, extra || {}), g);

  /* ---- the compression tap, in section --------------------------------
     Drawn once and reused, with flags for what is being shown. The body
     is a pillar tap: inlet at the bottom, seat above it, stem screwing
     down onto the seat, spout out to the left.                          */
  function tapBody(g, o) {
    o = o || {};
    const X = 180, Y = 40;                 /* top-left of the headwork */

    /* the body casting, in section */
    path(g, `M ${X - 54} ${Y + 96} h 108 v 118 h -26 v -52 h -56 v 52 h -26 z`, BODY, BODY_D, 2);
    /* the spout, out to the left */
    path(g, `M ${X - 54} ${Y + 120} h -74 v 26 h 48 v 44 h 26 z`, BODY, BODY_D, 2);
    /* the inlet below the seat */
    box(g, X - 20, Y + 214, 40, 34, 2, BODY, BODY_D);

    /* water standing in the inlet, always below the seat */
    if (o.water !== false) {
      path(g, `M ${X - 16} ${Y + 248} v -34 h 32 v 34 z`, WATER, "none", 0);
      el("rect", { x: X - 16, y: Y + 206, width: 32, height: 10, fill: WATER, opacity: 0.55 }, g);
    }

    /* the seat: a brass ring the washer closes onto */
    path(g, `M ${X - 22} ${Y + 206} h 16 v 10 h -16 z`, BRASS, BRASS_D, 1.5);
    path(g, `M ${X + 6} ${Y + 206} h 16 v 10 h -16 z`, BRASS, BRASS_D, 1.5);
    if (o.seatWorn) {
      path(g, `M ${X - 6} ${Y + 206} q 6 5 12 0`, "none", bad(), 2.5);
    }

    /* the stem, screwed down by `close` (0 = open, 1 = shut on the seat) */
    const close = o.close == null ? 0.55 : o.close;
    const stemY = Y + 120 + close * 62;
    box(g, X - 11, Y + 18, 22, stemY - Y - 18 + 40, 2, CHROME, CHROME_D);
    for (let k = 0; k < 5; k++) {            /* the thread on the stem */
      line(g, X - 11, Y + 46 + k * 11, X + 11, Y + 41 + k * 11, CHROME_D, 1.5);
    }

    /* the washer on the end of the stem, held by a brass screw */
    const wy = stemY + 40;
    if (o.washer !== false) {
      box(g, X - 20, wy, 40, 13, 2, o.washerWorn ? RUBBER_D : RUBBER, RUBBER_D);
      if (o.washerWorn) line(g, X - 12, wy + 6, X + 12, wy + 6, bad(), 2);
      el("circle", { cx: X, cy: wy + 6, r: 3.5, fill: BRASS, stroke: BRASS_D, "stroke-width": 1 }, g);
    }

    /* the gland nut, and the packing under it */
    if (o.packing) {
      box(g, X - 15, Y + 30, 30, 16, 1, PACK, PACK_D);
    }
    box(g, X - 30, Y + 46, 60, 26, 3, CHROME, CHROME_D);

    /* the handle and its cap */
    if (o.handle !== false) {
      path(g, `M ${X - 42} ${Y + 8} h 84 l -12 26 h -60 z`, CHROME, CHROME_D, 2);
      el("circle", { cx: X, cy: Y + 6, r: 11, fill: o.capOff ? "none" : CHROME, stroke: CHROME_D, "stroke-width": 2 }, g);
      if (o.capOff) el("circle", { cx: X, cy: Y + 6, r: 4, fill: BRASS_D }, g);
    }

    /* the two leaks, which are different faults */
    if (o.dripSpout) {
      for (let k = 0; k < 3; k++) {
        el("ellipse", { cx: X - 115, cy: Y + 200 + k * 26, rx: 4.5, ry: 6.5,
                        fill: WATER, opacity: 0.9 - k * 0.25 }, g);
      }
      text(g, X - 115, Y + 284, "drip at the spout", 12, "middle", bad());
    }
    if (o.weepStem) {
      for (let k = 0; k < 3; k++) {
        el("circle", { cx: X + 26 + k * 7, cy: Y + 56 + k * 9, r: 3.2 - k * 0.5,
                       fill: WATER, opacity: 0.9 - k * 0.22 }, g);
      }
      text(g, X + 96, Y + 52, "weep at the stem", 12, "middle", bad());
    }
    return { X, Y };
  }

  /* ---- tools ----------------------------------------------------------- */
  function seatDresser(g, x, y) {
    box(g, x - 8, y, 16, 54, 3, CHROME, CHROME_D);
    box(g, x - 26, y + 54, 52, 14, 2, BRASS, BRASS_D);
    box(g, x - 18, y - 22, 36, 22, 4, "#7A4A22", "#5E3A1B");
  }
  function seatWrench(g, x, y) {
    box(g, x - 6, y, 12, 56, 2, CHROME, CHROME_D);
    path(g, `M ${x - 11} ${y + 56} h 22 l -4 16 h -14 z`, CHROME, CHROME_D, 1.5);
    box(g, x - 30, y - 16, 60, 16, 3, "#7A4A22", "#5E3A1B");
  }
  function spanner(g, x, y, pad) {
    path(g, `M ${x} ${y} a 17 17 0 1 0 19 22 l 92 22 a 10 10 0 0 0 5 -20 l -92 -22 a 17 17 0 0 0 -24 -2 z`,
      CHROME, CHROME_D, 2);
    if (pad) box(g, x + 2, y + 4, 22, 22, 3, "#2B2B2B", "#111");
  }

  /* ==== the registered drawings ======================================= */
  const TAPS = {

    /* the cutaway the `label` step reads parts off */
    tapCutaway: {
      title: "a compression tap, in section", w: 460, h: 340,
      draw(g) { tapBody(g, { close: 0.35, packing: true }); },
      parts: [
        { id: "cap", label: "cap", box: [158, 26, 46, 34],
          say: "The cap. It either unscrews or prises off with a knife blade, and under it is the one screw holding the handle on. On a plastic cap, prise gently — it is the cheapest part of the tap and the easiest to break." },
        { id: "handle", label: "handle", box: [130, 42, 102, 34],
          say: "The handle. It lifts off the broached stem once its screw is out. If it is stuck, refit the screw a couple of turns and pull against that rather than levering on the finish." },
        { id: "gland", label: "gland nut", box: [142, 84, 78, 32],
          say: "The gland nut. Under it is the gland packing, and this is the nut you slacken to cure a WEEP at the stem. It is also what you tighten hand tight plus a half turn on the way back — not as hard as it will go." },
        { id: "stem", label: "stem", box: [160, 118, 42, 96],
          say: "The stem. It threads down into the body, and the handle turns it. Rotate it in the OPEN direction to thread it out of the tap altogether — that is how the headwork comes apart." },
        { id: "washer", label: "washer and brass screw", box: [150, 216, 62, 30],
          say: "The washer, on the end of the stem, held by a brass screw. This is the part that actually shuts the water off, and a hardened or grooved one is the commonest cause of a drip." },
        { id: "seat", label: "seat", box: [148, 240, 66, 24],
          say: "The seat: the brass ring the washer closes onto. If a tap needs a new washer every few months, the seat is damaged and it is the seat, not the washer, that is the fault." },
        { id: "spout", label: "spout", box: [42, 150, 100, 46],
          say: "The spout. A drip HERE is a washer or a seat. Water appearing anywhere else — around the handle — is a different fault and a different part." },
      ],
    },

    /* the two families */
    /* No caption inside these two. The body already reaches y 288 of a 300-high
       space, so a line at 330 fell outside it — and R.browse prints the item's
       own `say` underneath anyway, so it was saying the same thing twice. */
    typeCompression: { title: "washer (compression) type", w: 380, h: 300,
      draw(g) { tapBody(g, { close: 0.9, handle: true }); } },

    typeWasherless: { title: "washerless: disc, ball or cartridge", w: 380, h: 300,
      draw(g) {
        box(g, 126, 60, 108, 96, 6, BODY, BODY_D);
        el("circle", { cx: 180, cy: 108, r: 30, fill: CHROME, stroke: CHROME_D, "stroke-width": 2 }, g);
        el("circle", { cx: 180, cy: 108, r: 12, fill: RUBBER, stroke: RUBBER_D, "stroke-width": 1.5 }, g);
        path(g, `M 180 60 l 0 -34`, "none", CHROME_D, 6);
        path(g, `M 150 26 h 60`, "none", CHROME, 12);
        path(g, `M 126 120 h -60 v 24 h 34 v 40 h 26 z`, BODY, BODY_D, 2);
        text(g, 180, 232, "no washer inside", 12, "middle", gold());
      } },

    /* the stages of the job */
    stageIsolate: { title: "isolate the supply", w: 380, h: 300,
      draw(g) {
        line(g, 40, 200, 340, 200, CHROME_D, 14);
        el("circle", { cx: 150, cy: 200, r: 26, fill: BODY, stroke: BODY_D, "stroke-width": 2 }, g);
        path(g, `M 150 174 v -26 h 0`, "none", CHROME_D, 6);
        path(g, `M 126 148 h 48`, "none", "#C9433A", 10);
        text(g, 150, 252, "service valve", 12, "middle", good());
        el("circle", { cx: 280, cy: 200, r: 20, fill: BODY, stroke: BODY_D, "stroke-width": 2 }, g);
        text(g, 280, 252, "or the main stop tap", 12, "middle", muted());
        text(g, 190, 96, "then OPEN the tap and prove it runs dry", 13, "middle", gold());
      } },

    stageStripped: { title: "the headwork, out", w: 380, h: 300,
      draw(g) {
        tapBody(g, { handle: false, washer: false, close: 0, water: true });
        box(g, 296, 70, 22, 150, 2, CHROME, CHROME_D);
        box(g, 286, 220, 42, 13, 2, RUBBER, RUBBER_D);
        text(g, 307, 256, "stem, out", 12, "middle", muted());
      } },

    washerWorn: { title: "a washer that has failed", w: 380, h: 240,
      draw(g) {
        box(g, 60, 90, 110, 40, 4, RUBBER_D, RUBBER_D);
        path(g, `M 78 110 h 74`, "none", bad(), 3);
        text(g, 115, 160, "grooved and hard", 12, "middle", bad());
        box(g, 216, 90, 110, 40, 4, RUBBER, RUBBER_D);
        el("circle", { cx: 271, cy: 110, r: 5, fill: BRASS, stroke: BRASS_D, "stroke-width": 1 }, g);
        text(g, 271, 160, "the replacement — matched, not guessed", 12, "middle", good());
      } },

    seatReplaceable: { title: "a seat that can be renewed", w: 380, h: 240,
      draw(g) {
        el("circle", { cx: 120, cy: 110, r: 46, fill: BRASS, stroke: BRASS_D, "stroke-width": 2 }, g);
        path(g, `M 102 92 h 36 v 36 h -36 z`, tok("--ground", "#0B1D2C"), BRASS_D, 2);
        text(g, 120, 178, "square or hex hole — unscrew it", 12, "middle", good());
        el("circle", { cx: 268, cy: 110, r: 46, fill: BRASS, stroke: BRASS_D, "stroke-width": 2 }, g);
        el("circle", { cx: 268, cy: 110, r: 17, fill: tok("--ground", "#0B1D2C"), stroke: BRASS_D, "stroke-width": 2 }, g);
        text(g, 268, 178, "plain round hole — dress it in place", 12, "middle", gold());
      } },

    seatDressing: { title: "dressing the seat", w: 380, h: 300,
      draw(g) {
        tapBody(g, { handle: false, washer: false, close: 0, seatWorn: true });
        seatDresser(g, 180, 96);
        path(g, `M 214 120 a 34 34 0 0 1 -6 34`, "none", gold(), 3);
        text(g, 190, 292, "turn until it is smooth, then blow the chips out", 12, "middle", gold());
      } },

    packingWrap: { title: "new gland packing", w: 380, h: 240,
      draw(g) {
        box(g, 160, 40, 24, 150, 2, CHROME, CHROME_D);
        for (let k = 0; k < 3; k++) {
          el("ellipse", { cx: 172, cy: 96 + k * 13, rx: 30, ry: 7, fill: PACK, stroke: PACK_D, "stroke-width": 1.5 }, g);
        }
        text(g, 172, 214, "one turn, in the direction the nut tightens", 12, "middle", good());
      } },

    toolPadded: { title: "padded jaws", w: 380, h: 220,
      draw(g) {
        spanner(g, 70, 70, true);
        text(g, 190, 186, "tape on the jaws, or it marks the chrome", 12, "middle", gold());
      } },
  };

  C.registerAll(TAPS, { w: 380, h: 300 });
})();

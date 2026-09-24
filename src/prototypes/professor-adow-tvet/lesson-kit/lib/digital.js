/* ====================================================================
   Digital Skills for the Workshop — this module's own drawings.

   kit.js carries the machinery and every step kind this module uses
   (label, sort, browse, order, questions, safety, words). Nothing here
   adds a renderer; it adds the PICTURES those renderers draw, and
   nothing else. A carpentry page loads no digital file and a digital
   page loads no carpentry file.

   WHY THESE PICTURES AND NOT SCREENSHOTS. Every device in this module is
   drawn rather than photographed, for the same reason the carpentry
   tools are: a screenshot of one manufacturer's menu teaches that
   manufacturer's menu, and it is wrong within a year. A drawn meter has
   a display, a keypad and a probe because EVERY meter does, and that is
   the thing worth knowing. The learner's own meter will not look like
   this one, and it will have all four parts.
   ==================================================================== */
(function () {
  const C = window.CARP;
  const { el, svg, tok, R } = C;

  const STEEL = "#B9C6D0", STEEL_DARK = "#7E8E9B";
  const CASE = "#3C4B57", CASE_DARK = "#2A363F";
  const SCREEN = "#9FE2C0", SCREEN_DARK = "#4E8C6D";
  const LEAD = "#C9433A", WIRE = "#E8C33A";
  const ink = () => tok("--ink", "#E8F1F8");
  const muted = () => tok("--muted", "#93AABE");
  const teal = () => tok("--teal", "#4FBFA8");

  const box = (g, x, y, w, h, r, fill, stroke) =>
    el("rect", { x, y, width: w, height: h, rx: r, fill, stroke: stroke || CASE_DARK, "stroke-width": 2 }, g);
  const text = (g, x, y, s, size, anchor, fill) => {
    const t = el("text", { x, y, "font-size": size || 12, "text-anchor": anchor || "middle",
                           fill: fill || muted() }, g);
    t.textContent = s; return t;
  };

  /* ---- a handheld meter: the computer nobody calls a computer -------- */
  function drawMeter(g) {
    box(g, 96, 30, 148, 210, 14, CASE);                 /* body */
    box(g, 112, 48, 116, 56, 6, SCREEN, SCREEN_DARK);   /* display */
    text(g, 170, 84, "14.2", 30, "middle", "#123");
    text(g, 214, 96, "%", 13, "middle", "#2A5A42");
    for (let r = 0; r < 3; r++) {                        /* keypad */
      for (let c = 0; c < 3; c++) {
        box(g, 118 + c * 38, 120 + r * 34, 28, 24, 5, "#55636E", "#2A363F");
      }
    }
    el("line", { x1: 170, y1: 240, x2: 170, y2: 286, stroke: LEAD, "stroke-width": 5 }, g);
    el("path", { d: "M 162 286 h 16 l -8 26 z", fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
  }

  /* ---- a small site network ----------------------------------------- */
  function drawNetwork(g) {
    box(g, 24, 120, 92, 64, 8, CASE);                    /* the device */
    box(g, 34, 130, 72, 38, 4, SCREEN, SCREEN_DARK);
    text(g, 70, 200, "your device", 12);

    box(g, 186, 122, 108, 58, 10, CASE);                 /* the router */
    el("circle", { cx: 208, cy: 168, r: 5, fill: teal() }, g);
    el("circle", { cx: 226, cy: 168, r: 5, fill: teal() }, g);
    for (let i = 0; i < 3; i++) {
      el("path", { d: `M ${252 + i * 9} 140 q 8 -${10 + i * 8} 0 -${20 + i * 16}`,
                   fill: "none", stroke: teal(), "stroke-width": 2, opacity: 0.8 - i * 0.2 }, g);
    }
    text(g, 240, 200, "router / access point", 12);

    el("path", { d: "M 116 152 h 70", stroke: WIRE, "stroke-width": 4, fill: "none" }, g);
    el("path", { d: "M 294 152 h 78", stroke: WIRE, "stroke-width": 4, fill: "none" }, g);
    text(g, 412, 200, "the line out", 12);
    el("circle", { cx: 412, cy: 152, r: 34, fill: "none", stroke: STEEL, "stroke-width": 2 }, g);
    el("ellipse", { cx: 412, cy: 152, rx: 14, ry: 34, fill: "none", stroke: STEEL, "stroke-width": 1.5 }, g);
    el("path", { d: "M 378 152 h 68 M 384 134 h 56 M 384 170 h 56", stroke: STEEL, "stroke-width": 1.5, fill: "none" }, g);
  }

  /* ---- an automated machine: sensor, controller, actuator ------------ */
  function drawAuto(g) {
    box(g, 30, 104, 74, 52, 8, CASE);                    /* sensor */
    el("circle", { cx: 67, cy: 130, r: 13, fill: SCREEN, stroke: SCREEN_DARK, "stroke-width": 2 }, g);
    text(g, 67, 176, "sensor", 12);

    box(g, 168, 92, 110, 76, 10, CASE);                  /* controller */
    box(g, 180, 104, 86, 30, 4, SCREEN, SCREEN_DARK);
    for (let i = 0; i < 4; i++) el("circle", { cx: 190 + i * 22, cy: 150, r: 5, fill: "#55636E" }, g);
    text(g, 223, 188, "controller", 12);

    box(g, 344, 100, 70, 62, 8, "#6E7B86", CASE_DARK);   /* actuator */
    el("circle", { cx: 379, cy: 131, r: 19, fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
    el("path", { d: "M 379 112 v 38 M 360 131 h 38", stroke: CASE_DARK, "stroke-width": 3 }, g);
    text(g, 379, 182, "actuator", 12);

    el("path", { d: "M 104 130 h 64", stroke: WIRE, "stroke-width": 3, "marker-end": "url(#arrow)" }, g);
    el("path", { d: "M 278 130 h 66", stroke: WIRE, "stroke-width": 3, "marker-end": "url(#arrow)" }, g);
    text(g, 136, 118, "reads", 11);
    text(g, 311, 118, "drives", 11);
  }

  /* ---- the small devices the sorting and browsing steps show --------- */
  const DEVICES = {
    meter: {
      title: "moisture meter", w: 340, h: 330, draw: drawMeter,
      /* `label` needs parts AND the drawing in C.TOOLS. registerAll does
         both; a spec with parts that never reached TOOLS threw on
         tool.w and rendered as empty space. */
      parts: [
        { id: "display", label: "display", box: [108, 44, 124, 64],
          say: "The display. This is OUTPUT — the end of the chain, not the start. A reading appears here only because something was measured, something decided what it meant, and something drew it." },
        { id: "keypad", label: "keypad", box: [114, 116, 116, 96],
          say: "The keys. This is INPUT from you — which material, which scale, hold the reading. The same probe reading means a different number for softwood and for concrete, and the keys are how the meter is told which." },
        { id: "probe", label: "probe", box: [150, 240, 40, 76],
          say: "The probe. This is INPUT from the world. It is the only part touching the timber, and a bent or corroded probe gives a confident, wrong number." },
        { id: "body", label: "the body", box: [96, 30, 148, 210],
          say: "Inside the body: PROCESSING and STORAGE. A chip turns the probe's voltage into a percentage using a calibration table it has stored, and remembers your last setting when you switch it off." },
      ],
    },
    siteNetwork: {
      title: "a small site network", w: 470, h: 230, draw: drawNetwork,
      parts: [
        { id: "device", label: "your device", box: [20, 116, 100, 72],
          say: "Your device — a tablet, a phone, a laptop on the bench. It holds the job records until they can be sent." },
        { id: "router", label: "router", box: [182, 118, 116, 66],
          say: "The router, or access point. It joins the devices on site to each other AND to the line out. Devices can reach each other through it even when the line out is dead — which is why 'the wi-fi is working but nothing loads' is a real and common state." },
        { id: "line", label: "the line out", box: [300, 134, 74, 36],
          say: "The line leaving the building — fibre, copper or a mobile signal. This is the part you do not own and cannot fix, and the part that fails in weather." },
        { id: "internet", label: "the internet", box: [374, 114, 76, 76],
          say: "The internet: every other network, joined together. Your site network is one of them. The office server you send records to is sitting on another." },
      ],
    },
    autoMachine: {
      title: "an automated machine", w: 450, h: 210, draw: drawAuto,
      parts: [
        { id: "sensor", label: "sensor", box: [26, 100, 82, 60],
          say: "The sensor. It turns something physical — a temperature, a distance, a weight, a presence — into a number the controller can read. If the sensor is dirty or misaligned, everything after it is confidently wrong." },
        { id: "controller", label: "controller", box: [164, 88, 118, 84],
          say: "The controller. It holds the rule: IF the reading is this, THEN do that. This is the software part, and it is what changes when a machine is updated." },
        { id: "actuator", label: "actuator", box: [340, 96, 78, 70],
          say: "The actuator — a motor, a valve, a heater, a ram. It is the only part that moves anything, and it is the part that can hurt you. It acts when the controller says so, not when you are ready." },
      ],
    },

    laptop: { title: "laptop", w: 220, h: 160, draw(g) {
      box(g, 40, 30, 140, 88, 6, CASE);
      box(g, 50, 40, 120, 68, 3, SCREEN, SCREEN_DARK);
      el("path", { d: "M 22 118 h 176 l 12 20 H 10 z", fill: "#55636E", stroke: CASE_DARK, "stroke-width": 2 }, g);
    } },
    phone: { title: "phone", w: 140, h: 200, draw(g) {
      box(g, 40, 20, 62, 158, 10, CASE);
      box(g, 46, 32, 50, 128, 4, SCREEN, SCREEN_DARK);
    } },
    welder: { title: "welding inverter", w: 230, h: 180, draw(g) {
      box(g, 34, 44, 158, 104, 8, CASE);
      box(g, 46, 56, 62, 34, 4, SCREEN, SCREEN_DARK);
      el("circle", { cx: 150, cy: 76, r: 17, fill: "#55636E", stroke: CASE_DARK, "stroke-width": 2 }, g);
      el("line", { x1: 150, y1: 76, x2: 150, y2: 62, stroke: ink(), "stroke-width": 3 }, g);
      el("path", { d: "M 60 148 v 22 M 166 148 v 22", stroke: LEAD, "stroke-width": 5 }, g);
    } },
    chiller: { title: "chiller controller", w: 220, h: 170, draw(g) {
      box(g, 36, 40, 150, 92, 8, CASE);
      box(g, 48, 52, 84, 32, 4, SCREEN, SCREEN_DARK);
      text(g, 90, 76, "4.0", 20, "middle", "#123");
      el("circle", { cx: 158, cy: 68, r: 10, fill: teal() }, g);
      for (let i = 0; i < 3; i++) box(g, 52 + i * 34, 96, 26, 22, 4, "#55636E", CASE_DARK);
    } },
    spanner: { title: "spanner", w: 220, h: 130, draw(g) {
      el("path", { d: "M 34 58 a 20 20 0 1 0 22 26 l 108 26 a 12 12 0 0 0 6 -24 l -108 -26 a 20 20 0 0 0 -28 -2 z",
                   fill: STEEL, stroke: STEEL_DARK, "stroke-width": 2 }, g);
      el("circle", { cx: 44, cy: 70, r: 8, fill: tok("--ground", "#0B1D2C") }, g);
    } },
    tapeRule: { title: "steel rule", w: 240, h: 90, draw(g) {
      box(g, 24, 36, 192, 26, 2, "#F0E4B0", STEEL_DARK);
      for (let i = 1; i < 19; i++) {
        el("line", { x1: 24 + i * 10, y1: 36, x2: 24 + i * 10, y2: 36 + (i % 5 === 0 ? 14 : 8),
                     stroke: "#33414C", "stroke-width": 1 }, g);
      }
    } },
  };

  C.registerAll(DEVICES, { w: 340, h: 200 });
})();

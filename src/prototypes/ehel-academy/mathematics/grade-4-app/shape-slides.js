  /* ---- 1: the 2D faces of a 3D solid (4Gg.05) ---- */
  const SOLIDS = [
    { name: "Cube", faces: [[6, "square"]], e: 12, v: 8, curved: 0,
      draw: '<path class="f1" d="M35,50 L85,50 L85,100 L35,100 Z"></path><path class="f2" d="M35,50 L55,32 L105,32 L85,50 Z"></path><path class="f3" d="M85,50 L105,32 L105,82 L85,100 Z"></path>' },
    { name: "Cuboid", faces: [[6, "rectangle"]], e: 12, v: 8, curved: 0,
      draw: '<path class="f1" d="M28,55 L96,55 L96,95 L28,95 Z"></path><path class="f2" d="M28,55 L48,37 L116,37 L96,55 Z"></path><path class="f3" d="M96,55 L116,37 L116,77 L96,95 Z"></path>' },
    { name: "Square-based pyramid", faces: [[1, "square"], [4, "triangle"]], e: 8, v: 5, curved: 0,
      /* base parallelogram first, then the two visible slanting faces on top of it */
      draw: '<path class="f1" d="M25,110 L85,110 L115,88 L55,88 Z"></path><path class="f2" d="M25,110 L85,110 L72,26 Z"></path><path class="f3" d="M85,110 L115,88 L72,26 Z"></path>' },
    { name: "Triangular prism", faces: [[2, "triangle"], [3, "rectangle"]], e: 9, v: 6, curved: 0,
      draw: '<path class="f1" d="M30,100 L82,100 L56,52 Z"></path><path class="f2" d="M30,100 L50,82 L102,82 L82,100 Z"></path><path class="f3" d="M82,100 L102,82 L76,34 L56,52 Z"></path>' },
    { name: "Cylinder", faces: [[2, "circle"]], e: 2, v: 0, curved: 1,
      draw: '<path class="f3" d="M38,45 L38,100 A32,12 0 0,0 102,100 L102,45 Z"></path><ellipse class="f1" cx="70" cy="45" rx="32" ry="12"></ellipse>' },
    { name: "Cone", faces: [[1, "circle"]], e: 1, v: 1, curved: 1,
      draw: '<path class="f3" d="M38,105 A32,12 0 0,0 102,105 L70,32 Z"></path><ellipse class="f1" cx="70" cy="105" rx="32" ry="12"></ellipse>' },
  ];
  const FACE2D = {
    square: '<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28"></rect></svg>',
    rectangle: '<svg viewBox="0 0 40 40"><rect x="3" y="10" width="34" height="20"></rect></svg>',
    triangle: '<svg viewBox="0 0 40 40"><polygon points="20,6 36,34 4,34"></polygon></svg>',
    circle: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15"></circle></svg>',
  };
  let s1 = 0;
  const seen1 = new Set([0]);
  $("pickSolid").innerHTML = SOLIDS.map((s, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + s.name + "</button>").join("");
  function paint1() {
    const S = SOLIDS[s1];
    $("solid1").innerHTML = S.draw;
    $("faces1").innerHTML = S.faces.map((f) =>
      '<div class="facechip">' + FACE2D[f[1]] + "<b>" + f[0] + "</b><span>" + f[1] + (f[0] > 1 ? "s" : "") + "</span></div>").join("") +
      (S.curved ? '<div class="facechip curved"><svg viewBox="0 0 40 40"><path d="M8,32 Q20,4 32,32"></path></svg><b>1</b><span>curved surface</span></div>' : "");
    const flat = S.faces.reduce((a, f) => a + f[0], 0);
    lines($("work1"), [
      { k: "Flat faces", v: "<b>" + flat + "</b>" + (S.curved ? ", and 1 curved surface that is not flat" : "") },
      { k: "Their shapes", v: S.faces.map((f) => f[0] + " " + f[1] + (f[0] > 1 ? "s" : "")).join(" and ") },
      { k: "Edges", v: "<b>" + S.e + "</b> — where two faces meet" },
      { k: "Vertices", v: "<b>" + S.v + "</b> — where the edges meet", total: true },
    ]);
    $("fb1").innerHTML = "A " + S.name.toLowerCase() + " has <b>" + flat + "</b> flat face" + (flat === 1 ? "" : "s") + ".";
    seen1.add(s1);
    $("task1").textContent = "Solids opened up: " + seen1.size + " of " + SOLIDS.length;
    if (seen1.size >= 4) finish(0, "");
  }
  $("pickSolid").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    s1 = Number(b.dataset.i);
    [...$("pickSolid").children].forEach((c, i) => c.classList.toggle("on", i === s1));
    paint1(); say(SOLIDS[s1].name);
  });
  paint1();

  /* ---- 2: nets (4Gg.06) ---- */
  const NETS = shuffle([
    { a: "Cube", why: "Six squares in a cross fold up into a cube.",
      d: '<rect x="70" y="20" width="40" height="40"></rect><rect x="30" y="60" width="40" height="40"></rect><rect x="70" y="60" width="40" height="40"></rect><rect x="110" y="60" width="40" height="40"></rect><rect x="150" y="60" width="40" height="40"></rect><rect x="70" y="100" width="40" height="40"></rect>' },
    { a: "Square-based pyramid", why: "A square with a triangle on each side folds up to a point.",
      d: '<rect x="90" y="70" width="50" height="50"></rect><polygon points="90,70 140,70 115,25"></polygon><polygon points="90,120 140,120 115,165"></polygon><polygon points="90,70 90,120 45,95"></polygon><polygon points="140,70 140,120 185,95"></polygon>' },
    { a: "Triangular prism", why: "Three rectangles in a row with a triangle at each end folds into a prism.",
      d: '<rect x="60" y="55" width="45" height="34"></rect><rect x="60" y="89" width="45" height="34"></rect><rect x="60" y="123" width="45" height="34"></rect><polygon points="60,89 105,89 82,52"></polygon><polygon points="60,123 105,123 82,160"></polygon>' },
    { a: "Cylinder", why: "A rectangle rolls into the tube, and the two circles are the ends.",
      d: '<rect x="80" y="60" width="100" height="50"></rect><circle cx="130" cy="42" r="17"></circle><circle cx="130" cy="128" r="17"></circle>' },
  ]);
  const NETOPTS = ["Cube", "Square-based pyramid", "Triangular prism", "Cylinder", "Cone"];
  let n2 = 0, right2 = 0, lock2 = false;
  function paint2() {
    lock2 = false;
    $("fb2").textContent = ""; $("fb2").className = "fb";
    $("work2").innerHTML = "";
    if (n2 >= NETS.length) {
      $("net2").innerHTML = "";
      $("netpick").innerHTML = "";
      $("task2").textContent = right2 + " of " + NETS.length + " right.";
      if (right2 >= 3) finish(1, "");
      return;
    }
    $("net2").innerHTML = NETS[n2].d;
    const opts = shuffle([NETS[n2].a].concat(shuffle(NETOPTS.filter((o) => o !== NETS[n2].a)).slice(0, 2)));
    $("netpick").innerHTML = opts.map((o) => '<button type="button" class="choice" data-a="' + o + '">' + o + "</button>").join("");
    $("task2").textContent = "Net " + (n2 + 1) + " of " + NETS.length + " · " + right2 + " right";
  }
  $("netpick").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock2) return;
    lock2 = true;
    const ok = b.dataset.a === NETS[n2].a;
    if (ok) right2++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb2").textContent = (ok ? cheer() + " " : "It is a " + NETS[n2].a.toLowerCase() + ". ") + NETS[n2].why;
    $("fb2").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : NETS[n2].why);
    n2++;
    setTimeout(paint2, 2600);
  });
  paint2();

  /* ---- 3: every line of symmetry (4Gg.07) ---- */
  /* only shapes whose COMPLETE set of mirror lines is among these four are used, so
     "find all of them" is an honest instruction */
  const SYM = [
    { name: "Square", ok: ["H", "V", "D1", "D2"], d: "M50,50 L150,50 L150,150 L50,150 Z" },
    { name: "Rectangle", ok: ["H", "V"], d: "M30,65 L170,65 L170,135 L30,135 Z" },
    { name: "Diamond", ok: ["H", "V"], d: "M100,30 L165,100 L100,170 L35,100 Z" },
    { name: "Triangle", ok: ["V"], d: "M100,35 L160,155 L40,155 Z" },
    { name: "Parallelogram", ok: [], d: "M45,135 L85,65 L175,65 L135,135 Z" },
    { name: "Plus", ok: ["H", "V", "D1", "D2"], d: "M75,40 L125,40 L125,75 L160,75 L160,125 L125,125 L125,160 L75,160 L75,125 L40,125 L40,75 L75,75 Z" },
  ];
  const LINES = { H: ["Horizontal", "M20,100 L180,100"], V: ["Vertical", "M100,20 L100,180"],
    D1: ["Diagonal ⟋", "M28,172 L172,28"], D2: ["Diagonal ⟍", "M28,28 L172,172"] };
  let sy3 = 0, found3 = [], tried3 = [];
  $("pickSym").innerHTML = SYM.map((s, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + s.name + "</button>").join("");
  function paint3() {
    const S = SYM[sy3];
    let g = '<path class="shape" d="' + S.d + '"></path>';
    found3.forEach((k) => { g += '<path class="mirror" d="' + LINES[k][1] + '"></path>'; });
    $("sym3").innerHTML = g;
    $("lines3").innerHTML = Object.keys(LINES).map((k) =>
      '<button type="button" class="choice' + (found3.indexOf(k) >= 0 ? " right" : tried3.indexOf(k) >= 0 ? " wrong" : "") +
      '" data-k="' + k + '">' + LINES[k][0] + "</button>").join("");
    lines($("work3"), [
      { k: "Testing", v: S.name.toLowerCase() },
      { k: "Lines found", v: "<b>" + found3.length + "</b> of the " + S.ok.length + " it has" },
      { k: "How to test one", v: "fold along it; if the two halves land exactly on each other it is a line of symmetry" },
      { k: found3.length === S.ok.length ? "All found" : "Keep going",
        v: found3.length === S.ok.length
          ? (S.ok.length === 0 ? "a parallelogram has <b>no</b> lines of symmetry at all" : "<b>" + S.ok.map((k) => LINES[k][0].toLowerCase()).join(", ") + "</b>")
          : "try the ones you have not tested yet", total: true },
    ]);
    $("task3").textContent = S.name + ": " + found3.length + " of " + S.ok.length + " found";
    if (found3.length === S.ok.length && tried3.length >= 4 - S.ok.length) finish(2, "");
  }
  $("pickSym").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    sy3 = Number(b.dataset.i); found3 = []; tried3 = [];
    [...$("pickSym").children].forEach((c, i) => c.classList.toggle("on", i === sy3));
    $("fb3").textContent = ""; $("fb3").className = "fb";
    paint3(); say(SYM[sy3].name);
  });
  $("lines3").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    const k = b.dataset.k;
    if (found3.indexOf(k) >= 0 || tried3.indexOf(k) >= 0) return;
    const ok = SYM[sy3].ok.indexOf(k) >= 0;
    if (ok) found3.push(k); else tried3.push(k);
    $("fb3").innerHTML = ok ? cheer() + " The " + LINES[k][0].toLowerCase() + " line works."
      : "Not that one — folding along the " + LINES[k][0].toLowerCase() + " line does not match the halves up.";
    $("fb3").className = "fb " + (ok ? "good" : "bad");
    say($("fb3").textContent);
    paint3();
  });
  paint3();

  /* ---- 4: reflecting in a mirror line (4Gp.03) ---- */
  const REFS = [
    { name: "Mirror down the middle", axis: "V", at: 4, cells: [[1, 1], [2, 1], [1, 2], [1, 3], [3, 1]] },
    { name: "Mirror across", axis: "H", at: 4, cells: [[1, 1], [2, 1], [3, 1], [1, 2], [1, 3]] },
    { name: "Mirror on the shape's edge", axis: "V", at: 4, cells: [[2, 2], [3, 2], [3, 3], [3, 1], [2, 3]] },
  ];
  let r4 = 0, placed4 = [];
  const G = 8, CELL = 30, PAD = 10;
  $("pickRef").innerHTML = REFS.map((r, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + r.name + "</button>").join("");
  const mirrorOf = (c) => {
    const R = REFS[r4];
    return R.axis === "V" ? [2 * R.at - c[0], c[1]] : [c[0], 2 * R.at - c[1]];
  };
  function want4() { return REFS[r4].cells.map(mirrorOf); }
  function paint4() {
    const R = REFS[r4];
    let g = "";
    for (let x = 0; x < G; x++) for (let y = 0; y < G; y++)
      g += '<rect class="cell" data-x="' + x + '" data-y="' + y + '" x="' + (PAD + x * CELL) + '" y="' + (PAD + y * CELL) +
        '" width="' + CELL + '" height="' + CELL + '"></rect>';
    R.cells.forEach((c) => { g += '<rect class="orig" x="' + (PAD + c[0] * CELL) + '" y="' + (PAD + c[1] * CELL) +
      '" width="' + CELL + '" height="' + CELL + '"></rect>'; });
    placed4.forEach((c) => { g += '<rect class="mine" x="' + (PAD + c[0] * CELL) + '" y="' + (PAD + c[1] * CELL) +
      '" width="' + CELL + '" height="' + CELL + '"></rect>'; });
    g += R.axis === "V"
      ? '<line class="mir" x1="' + (PAD + R.at * CELL) + '" y1="' + PAD + '" x2="' + (PAD + R.at * CELL) + '" y2="' + (PAD + G * CELL) + '"></line>'
      : '<line class="mir" x1="' + PAD + '" y1="' + (PAD + R.at * CELL) + '" x2="' + (PAD + G * CELL) + '" y2="' + (PAD + R.at * CELL) + '"></line>';
    $("ref4").innerHTML = g;
    const w = want4();
    const done = w.every((c) => placed4.some((p) => p[0] === c[0] && p[1] === c[1])) && placed4.length === w.length;
    $("fb4").innerHTML = done ? cheer() + " Every square has landed opposite its partner."
      : placed4.length + " of " + w.length + " squares placed.";
    $("fb4").className = "fb " + (done ? "good" : "");
    $("task4").textContent = R.axis === "V" ? "The mirror runs top to bottom, so left and right swap over."
      : "The mirror runs left to right, so up and down swap over.";
    if (done) finish(3, "");
  }
  $("ref4").addEventListener("click", (e) => {
    const c = e.target.closest("rect.cell"); if (!c) return;
    const x = Number(c.dataset.x), y = Number(c.dataset.y);
    if (REFS[r4].cells.some((o) => o[0] === x && o[1] === y)) return;
    const i = placed4.findIndex((p) => p[0] === x && p[1] === y);
    if (i >= 0) placed4.splice(i, 1); else placed4.push([x, y]);
    paint4();
  });
  $("clear4").addEventListener("click", () => { placed4 = []; paint4(); });
  $("show4").addEventListener("click", () => { placed4 = want4(); paint4(); say("Each square is the same distance the other side of the line."); });
  $("pickRef").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    r4 = Number(b.dataset.i); placed4 = [];
    [...$("pickRef").children].forEach((c, i) => c.classList.toggle("on", i === r4));
    paint4();
  });
  paint4();

  /* ---- 5: combining shapes and tessellation (4Gg.01) ---- */
  const TILES = [
    { name: "Two triangles", makes: "a square", tess: true,
      why: "Two right-angled triangles with the same short sides join along the long side to make a square.",
      d: '<polygon class="t1" points="60,30 60,110 140,110"></polygon><polygon class="t2" points="60,30 140,30 140,110"></polygon>' },
    { name: "Two squares", makes: "a rectangle", tess: true,
      why: "Two squares side by side make a rectangle twice as wide as it is tall.",
      d: '<rect class="t1" x="50" y="45" width="70" height="70"></rect><rect class="t2" x="120" y="45" width="70" height="70"></rect>' },
    { name: "Six triangles", makes: "a hexagon", tess: true,
      why: "Six triangles with equal sides, fitted round a point, make a regular hexagon, and hexagons tile a floor with no gaps.",
      d: "HEX" },
    { name: "Circles", makes: "gaps", tess: false,
      why: "Circles cannot tessellate. However you pack them there are always gaps left between them.",
      d: "CIRC" },
  ];
  let t5 = 0;
  $("pickTile").innerHTML = TILES.map((t, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + t.name + "</button>").join("");
  function paint5() {
    const T = TILES[t5];
    let g = T.d;
    if (T.d === "HEX") {
      g = "";
      for (let i = 0; i < 6; i++) {
        const a0 = i * 60 * Math.PI / 180, a1 = (i + 1) * 60 * Math.PI / 180;
        g += '<polygon class="' + (i % 2 ? "t1" : "t2") + '" points="130,90 ' +
          (130 + 58 * Math.cos(a0)).toFixed(1) + "," + (90 + 58 * Math.sin(a0)).toFixed(1) + " " +
          (130 + 58 * Math.cos(a1)).toFixed(1) + "," + (90 + 58 * Math.sin(a1)).toFixed(1) + '"></polygon>';
      }
    } else if (T.d === "CIRC") {
      g = "";
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++)
        g += '<circle class="t1" cx="' + (50 + c * 40) + '" cy="' + (45 + r * 40) + '" r="20"></circle>';
    }
    $("tile5").innerHTML = g;
    lines($("work5"), [
      { k: "Put together", v: T.name.toLowerCase() },
      { k: "They make", v: "<b>" + T.makes + "</b>" },
      { k: "Tessellates?", v: T.tess ? "<b>yes</b> — copies fit together leaving no gaps" : "<b>no</b> — gaps are always left over" },
      { k: "Why", v: T.why, total: true },
    ]);
    $("fb5").innerHTML = T.name + " make " + T.makes + ".";
    $("task5").textContent = "Shapes that tessellate leave no gaps and no overlaps.";
    if (t5 === TILES.length - 1) finish(4, "");
  }
  $("pickTile").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    t5 = Number(b.dataset.i);
    [...$("pickTile").children].forEach((c, i) => c.classList.toggle("on", i === t5));
    paint5(); say(TILES[t5].why);
  });
  paint5();

  /* ---- 6: area and perimeter, formula and compound (4Gg.02, 4Gg.03) ---- */
  let mode6 = 0, w6 = 5, h6 = 3;
  $("pickArea").innerHTML = ["One rectangle", "An L shape"].map((m, i) =>
    '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + m + "</button>").join("");
  function paint6() {
    /* the grid is 7 rows deep and the L's foot needs two rows under the body,
       so in L mode the body cannot be taller than 5 or the foot is drawn short */
    const hMax = mode6 === 1 ? 5 : 6;
    $("h6").max = hMax;
    if (h6 > hMax) h6 = hMax;
    $("h6").value = h6;
    $("wLab6").textContent = w6;
    $("hLab6").textContent = h6;
    const C = 26, P = 8;
    let g = "";
    for (let x = 0; x < 9; x++) for (let y = 0; y < 7; y++)
      g += '<rect class="cell" x="' + (P + x * C) + '" y="' + (P + y * C) + '" width="' + C + '" height="' + C + '"></rect>';
    const inA = (x, y) => x < w6 && y < h6;
    const inB = (x, y) => inA(x, y) || (x < 2 && y >= h6 && y < h6 + 2);
    const inside = mode6 === 0 ? inA : inB;
    for (let x = 0; x < 9; x++) for (let y = 0; y < 7; y++)
      if (inside(x, y)) g += '<rect class="fillA" x="' + (P + x * C) + '" y="' + (P + y * C) + '" width="' + C + '" height="' + C + '"></rect>';
    $("area6").innerHTML = g;
    if (mode6 === 0) {
      lines($("work6"), [
        { k: "Count them", v: "<b>" + w6 * h6 + "</b> squares inside" },
        { k: "The short way", v: "width × height = " + w6 + " × " + h6 + " = <b>" + w6 * h6 + "</b>" },
        { k: "Area formula", v: "<b>area = length × width</b>, and it works for every rectangle" },
        { k: "Perimeter", v: "all the way round: 2 × (" + w6 + " + " + h6 + ") = <b>" + 2 * (w6 + h6) + "</b>", total: true },
      ]);
      $("fb6").innerHTML = "Area <b>" + w6 * h6 + "</b> squares, perimeter <b>" + 2 * (w6 + h6) + "</b>.";
    } else {
      const a = w6 * h6, b = 2 * 2, tot = a + b;
      lines($("work6"), [
        { k: "Split it up", v: "an L shape is just two rectangles joined" },
        { k: "The big one", v: w6 + " × " + h6 + " = <b>" + a + "</b>" },
        { k: "The small one", v: "2 × 2 = <b>" + b + "</b>" },
        { k: "Add the areas", v: a + " + " + b + " = <b>" + tot + "</b> squares", total: true },
      ]);
      $("fb6").innerHTML = "Two areas added: <b>" + tot + "</b> squares in all.";
    }
    $("task6").textContent = mode6 === 0 ? "Change the sides and check the rule still gives the count."
      : "A compound shape has no single formula — cut it into ones that do.";
    if (mode6 === 1) finish(5, "");
  }
  $("pickArea").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    mode6 = Number(b.dataset.i);
    [...$("pickArea").children].forEach((c, i) => c.classList.toggle("on", i === mode6));
    paint6(); say($("fb6").textContent);
  });
  $("w6").addEventListener("input", (e) => { w6 = Number(e.target.value); paint6(); });
  $("h6").addEventListener("input", (e) => { h6 = Number(e.target.value); paint6(); });
  paint6();

  /* ---- 7: estimating the area of an irregular shape (4Gg.04) ---- */
  let blob = null;
  function newBlob() {
    const C = 30, N = 8;
    const cx = 3.5 + (Math.random() - 0.5), cy = 3.5 + (Math.random() - 0.5);
    const rx = 2.2 + Math.random() * 0.7, ry = 1.8 + Math.random() * 0.7;
    const wob = 0.35 + Math.random() * 0.3, ph = Math.random() * 6.28;
    const pts = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 1 + wob * Math.sin(3 * a + ph);
      pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
    }
    const insidePt = (px, py) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    let whole = 0, part = 0;
    const cls = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      let n = 0;
      const probe = [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85], [0.5, 0.5]];
      probe.forEach((p) => { if (insidePt(x + p[0], y + p[1])) n++; });
      if (n === probe.length) { whole++; cls.push([x, y, "whole"]); }
      else if (n > 0) { part++; cls.push([x, y, "part"]); }
    }
    return { pts: pts, cells: cls, whole: whole, part: part, C: C };
  }
  function paint7() {
    const B = blob, C = B.C, P = 10;
    let g = "";
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++)
      g += '<rect class="cell" x="' + (P + x * C) + '" y="' + (P + y * C) + '" width="' + C + '" height="' + C + '"></rect>';
    B.cells.forEach((c) => {
      g += '<rect class="' + (c[2] === "whole" ? "fillA" : "fillB") + '" x="' + (P + c[0] * C) + '" y="' + (P + c[1] * C) +
        '" width="' + C + '" height="' + C + '"></rect>';
    });
    g += '<path class="blobline" d="M' + B.pts.map((p) => (P + p[0] * C).toFixed(1) + "," + (P + p[1] * C).toFixed(1)).join(" L") + ' Z"></path>';
    $("blob7").innerHTML = g;
    const est = B.whole + B.part / 2;
    lines($("work7"), [
      { k: "Whole squares", v: "<b>" + B.whole + "</b> completely inside" },
      { k: "Part squares", v: "<b>" + B.part + "</b> only partly inside" },
      { k: "Count the parts as halves", v: B.part + " ÷ 2 = <b>" + (B.part / 2) + "</b>" },
      { k: "So the area is about", v: B.whole + " + " + (B.part / 2) + " = <b>" + est + "</b> squares", total: true },
    ]);
    $("fb7").innerHTML = "About <b>" + est + "</b> squares. It is an <b>estimate</b> — some part squares hold more than half and some less.";
    $("task7").textContent = "Dark squares are wholly inside. Pale ones are cut by the edge.";
    finish(6, "");
  }
  $("new7").addEventListener("click", () => { blob = newBlob(); paint7(); say($("fb7").textContent); });
  blob = newBlob(); paint7();

  /* ---- 8: reading a scale with fractions (4Gg.09) ---- */
  const SCALES = [
    { name: "Measuring jug", unit: "ml", step: 100, marks: 5, sub: 4 },
    { name: "Kitchen scales", unit: "g", step: 500, marks: 5, sub: 4 },
    { name: "Thermometer", unit: "°C", step: 10, marks: 5, sub: 2 },
  ];
  let sc8 = 0, pos8 = 10;
  const WORDS8 = { 0: "exactly on", 1: "a quarter past", 2: "halfway past", 3: "three quarters past" };
  $("pickScale").innerHTML = SCALES.map((s, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + s.name + "</button>").join("");
  function paint8() {
    const S = SCALES[sc8], sub = S.sub, top = (S.marks - 1) * sub;
    $("pos8").max = top;
    if (pos8 > top) pos8 = top;
    $("pos8").value = pos8;
    const whole = Math.floor(pos8 / sub), rem = pos8 % sub;
    const value = whole * S.step + (rem / sub) * S.step;
    let g = '<line class="axis8" x1="30" y1="105" x2="230" y2="105"></line>';
    for (let m = 0; m < S.marks; m++) {
      const x = 30 + (m / (S.marks - 1)) * 200;
      g += '<line class="big8" x1="' + x + '" y1="88" x2="' + x + '" y2="122"></line>';
      g += '<text class="lab8" x="' + x + '" y="140">' + m * S.step + "</text>";
      if (m < S.marks - 1) for (let s = 1; s < sub; s++) {
        const xs = x + (s / sub) * (200 / (S.marks - 1));
        g += '<line class="small8" x1="' + xs + '" y1="96" x2="' + xs + '" y2="114"></line>';
      }
    }
    const px = 30 + (pos8 / top) * 200;
    g += '<polygon class="ptr" points="' + px + ',72 ' + (px - 8) + ',54 ' + (px + 8) + ',54"></polygon>';
    g += '<text class="val8" x="' + Math.min(214, Math.max(46, px)) + '" y="44">' + value + " " + S.unit + "</text>";
    $("scale8").innerHTML = g;
    const fracWord = rem === 0 ? "exactly on the mark" :
      sub === 4 ? (rem === 1 ? "a quarter of the way" : rem === 2 ? "halfway" : "three quarters of the way")
        : "halfway";
    lines($("work8"), [
      { k: "Big marks", v: "every <b>" + S.step + " " + S.unit + "</b>" },
      { k: "Small marks", v: "each gap is split into <b>" + sub + "</b>, so one small step is " + (S.step / sub) + " " + S.unit },
      { k: "The pointer", v: "past <b>" + whole * S.step + "</b> and " + fracWord + " to " + (whole + 1) * S.step },
      { k: "So it reads", v: "<b>" + value + " " + S.unit + "</b>", total: true },
    ]);
    $("fb8").innerHTML = "Reading: <b>" + value + " " + S.unit + "</b>.";
    $("task8").textContent = "Between the marks, the fraction of the gap is the fraction of " + S.step + " " + S.unit + ".";
    if (pos8 % sub !== 0) finish(7, "");
  }
  $("pickScale").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    sc8 = Number(b.dataset.i);
    [...$("pickScale").children].forEach((c, i) => c.classList.toggle("on", i === sc8));
    paint8(); say(SCALES[sc8].name);
  });
  $("pos8").addEventListener("input", (e) => { pos8 = Number(e.target.value); paint8(); });
  paint8();

  /* ---- 9: position and direction (4Gp.01) ---- */
  const DIRS = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
  const DIRNAME = { N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west" };
  let from9 = [3, 4], to9 = null, right9 = 0, asked9 = 0, lock9 = false;
  function newMove() {
    const keys = Object.keys(DIRS);
    for (let t = 0; t < 60; t++) {
      const k = keys[rnd(0, 7)], n = rnd(1, 3);
      const d = DIRS[k], nx = from9[0] + d[0] * n, ny = from9[1] + d[1] * n;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) return { k: k, n: n, to: [nx, ny] };
    }
    return { k: "E", n: 1, to: [from9[0] + 1, from9[1]] };
  }
  function paint9() {
    const C = 30, P = 10;
    let g = "";
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++)
      g += '<rect class="cell" data-x="' + x + '" data-y="' + y + '" x="' + (P + x * C) + '" y="' + (P + y * C) +
        '" width="' + C + '" height="' + C + '"></rect>';
    g += '<circle class="here" cx="' + (P + from9[0] * C + C / 2) + '" cy="' + (P + from9[1] * C + C / 2) + '" r="11"></circle>';
    if (to9 && to9.shown) g += '<circle class="there" cx="' + (P + to9.to[0] * C + C / 2) + '" cy="' + (P + to9.to[1] * C + C / 2) + '" r="11"></circle>';
    g += '<text class="compass" x="' + (P + 4 * C) + '" y="' + (P - 1) + '">N</text>';
    $("map9").innerHTML = g;
    $("order9").innerHTML = "Move <b>" + to9.n + "</b> square" + (to9.n === 1 ? "" : "s") + " from the dot. Which way lands you on the target?";
    $("dirs9").innerHTML = Object.keys(DIRS).map((k) => '<button type="button" class="choice dir" data-k="' + k + '">' + k + "</button>").join("");
    $("task9").textContent = "Answered " + asked9 + " · " + right9 + " right";
  }
  function nextMove() { to9 = newMove(); to9.shown = true; lock9 = false; paint9(); }
  $("dirs9").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || lock9) return;
    lock9 = true; asked9++;
    const ok = b.dataset.k === to9.k;
    if (ok) right9++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work9"), [
      { k: "From", v: "column " + from9[0] + ", row " + from9[1] },
      { k: "To", v: "column " + to9.to[0] + ", row " + to9.to[1] },
      { k: "That is", v: "<b>" + to9.n + "</b> square" + (to9.n === 1 ? "" : "s") + " <b>" + DIRNAME[to9.k] + "</b>" },
      { k: "Cardinal or ordinal", v: to9.k.length === 1 ? "north, east, south and west are the <b>cardinal</b> points" : "the in-between ones are the <b>ordinal</b> points", total: true },
    ]);
    $("fb9").innerHTML = (ok ? cheer() + " " : "It was " + DIRNAME[to9.k] + ". ") + "North is up the grid.";
    $("fb9").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "It was " + DIRNAME[to9.k]);
    if (right9 >= 3) finish(8, "");
    setTimeout(() => { from9 = to9.to.slice(); nextMove(); }, 2400);
  });
  nextMove();

  /* ---- 10: check ---- */
  const Q10 = shuffle([
    { q: "How many flat faces does a square-based pyramid have?", o: ["5", "4", "6"], a: 0, w: "One square base and four triangles round it — five faces in all." },
    { q: "Which solid has two circular faces and a curved surface?", o: ["A cylinder", "A cone", "A sphere"], a: 0, w: "A cone has only one circular face. A cylinder has one at each end." },
    { q: "Six squares in a cross fold up into which solid?", o: ["A cube", "A cuboid", "A pyramid"], a: 0, w: "Six identical squares make a cube — every face the same." },
    { q: "How many lines of symmetry does a rectangle have (not a square)?", o: ["2", "4", "1"], a: 0, w: "One horizontal and one vertical. The diagonals do not work: folding along them does not match the halves." },
    { q: "A parallelogram has how many lines of symmetry?", o: ["None", "Two", "Four"], a: 0, w: "It looks symmetrical because it has rotational symmetry, but no fold matches the halves up." },
    { q: "A rectangle is 6 squares wide and 4 tall. What is its area?", o: ["24 squares", "20 squares", "10 squares"], a: 0, w: "Area = length × width, so 6 × 4 = 24." },
    { q: "The same rectangle, 6 by 4. What is its perimeter?", o: ["20", "24", "10"], a: 0, w: "All the way round: 6 + 4 + 6 + 4, or 2 × (6 + 4) = 20." },
    { q: "An odd shape covers 9 whole squares and 6 part squares. Roughly what area is that?", o: ["About 12 squares", "About 15 squares", "About 9 squares"], a: 0, w: "Count each part square as about a half: 9 + 3 = about 12." },
    { q: "A jug is marked every 100 ml with three small marks between. What is one small step?", o: ["25 ml", "50 ml", "33 ml"], a: 0, w: "Three small marks cut the gap into four, so each step is 100 ÷ 4 = 25 ml." },
    { q: "Which of these is an ordinal point of the compass?", o: ["South-east", "South", "West"], a: 0, w: "North, east, south and west are the cardinal points. The four in between are the ordinal ones." },
  ]);
  let c10 = 0, right10 = 0, lock10 = false;
  function round10() {
    lock10 = false;
    $("fb10").textContent = ""; $("fb10").className = "fb";
    if (c10 >= Q10.length) {
      $("stem10").textContent = "That is all of them.";
      $("choices10").innerHTML = "";
      $("score10").textContent = right10 + " out of " + Q10.length + " right.";
      if (right10 >= 7) finish(9, "");
      else retryCheck($("fb10"), $("choices10"), right10, Q10.length, 7, function () { c10 = 0; right10 = 0; round10(); });
      return;
    }
    $("stem10").textContent = Q10[c10].q;
    const order = shuffle(Q10[c10].o.map((t, i) => ({ t: t, ok: i === Q10[c10].a })));
    $("choices10").innerHTML = order.map((o) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("score10").textContent = "Question " + (c10 + 1) + " of " + Q10.length + " · " + right10 + " right";
  }
  $("choices10").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock10) return;
    lock10 = true;
    const ok = b.dataset.ok === "1";
    if (ok) right10++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb10").textContent = (ok ? cheer() + " " : "") + Q10[c10].w;
    $("fb10").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q10[c10].w);
    c10++;
    setTimeout(round10, 2400);
  });
  round10();

  /* ---- 11: stickers ---- */
  const STICKERS = [["🧊", "The faces of a solid"], ["📦", "Fold it up: nets"], ["🦋", "Every line of symmetry"],
    ["🪞", "Reflect it in the mirror"], ["🔷", "Putting shapes together"], ["📐", "Area without counting"],
    ["🫐", "An odd shape on a grid"], ["🥛", "Reading between the marks"], ["🧭", "Which way from here?"], ["✅", "Show what I know"]];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span>' + s[0] + "</span><b>" + s[1] + "</b></div>").join("");
  }
  $("again").addEventListener("click", () => { show(0, true); });

  show(0, false);

  /* ---- your turn: the six slides that only demonstrated ---- */
  const askShuffle3 = (correct, a, b) => { const o = shuffle([correct, a, b]); return { o: o, i: o.indexOf(correct) }; };

  /* 1 (4Gg.05) counts FACES. Edges and vertices are the distractors because confusing
     the three is the whole difficulty. Curved solids are left out -- "how many faces"
     is not a fair question for a cylinder at this stage. */
  ask(1, () => {
    const flat = SOLIDS.filter((s) => s.curved === 0);
    const S1 = flat[rnd(0, flat.length - 1)];
    const n = S1.faces.reduce((t, f) => t + f[0], 0);
    const opts = pick3(n, [S1.e, S1.v, n + 2]);
    return { stem: "How many <b>flat faces</b> does a <b>" + S1.name.toLowerCase() + "</b> have?",
      opts: opts.map(String), ans: opts.indexOf(n),
      why: "A " + S1.name.toLowerCase() + " has <b>" + n + " faces</b>, " + S1.e +
        " edges and " + S1.v + " vertices — faces are the flat surfaces." };
  });

  /* 4 (4Gp.03) reflection across a vertical mirror: the image is as far the other side.
     The distractor that keeps the distance but not the side is the error to catch. */
  ask(4, () => {
    const mir = rnd(4, 7), d = rnd(1, 3), x = mir - d, img = mir + d;
    const opts = pick3(img, [x, mir, img + 1]);
    return { stem: "The mirror line is at <b>" + mir + "</b>. A dot sits at <b>" + x +
        "</b>. Where is its reflection?",
      opts: opts.map(String), ans: opts.indexOf(img),
      why: x + " is " + d + " square" + (d === 1 ? "" : "s") + " left of the line, so the " +
        "reflection is " + d + " to the right: <b>" + img + "</b>." };
  });

  /* 5 (4Gg.01) tessellation. The shapes that tile the plane alone are exactly these
     three regulars; pentagon and circle are the honest counter-examples. */
  ask(5, () => {
    const yes = ["triangle with equal sides", "square", "regular hexagon"][rnd(0, 2)];
    const no = shuffle(["regular pentagon", "circle", "regular octagon on its own"]).slice(0, 2);
    const q = askShuffle3(yes, no[0], no[1]);
    return { stem: "Which of these <b>tessellates</b> — fits together with no gaps at all?",
      opts: q.o, ans: q.i,
      why: "A <b>" + yes + "</b> tessellates: copies of it meet with no gap and no overlap. " +
        "The others always leave a gap." };
  });

  /* 6 (4Gg.02, 4Gg.03) area or perimeter of a rectangle, alternating -- and each one
     offers the OTHER as a distractor, which is the confusion worth testing. */
  ask(6, () => {
    const w = rnd(3, 12), h = rnd(2, 9), area = w * h, per = 2 * (w + h);
    if (rnd(0, 1) === 0) {
      const opts = pick3(area, [per, w + h, area + w]);
      return { stem: "A rectangle is <b>" + w + " cm</b> by <b>" + h + " cm</b>. What is its <b>area</b>?",
        opts: opts.map((v) => v + " cm²"), ans: opts.indexOf(area),
        why: "Area is length × width: " + w + " × " + h + " = <b>" + area + " cm²</b>." };
    }
    const opts = pick3(per, [area, w + h, per + 2]);
    return { stem: "A rectangle is <b>" + w + " cm</b> by <b>" + h + " cm</b>. What is its <b>perimeter</b>?",
      opts: opts.map((v) => v + " cm"), ans: opts.indexOf(per),
      why: "Perimeter is all the way round: " + w + " + " + h + " + " + w + " + " + h +
        " = <b>" + per + " cm</b>." };
  });

  /* 7 (4Gg.04) ESTIMATES an irregular area -- the verb Cambridge uses. Part squares
     count as a half each, so the answer is deliberately not a whole-square count. */
  ask(7, () => {
    const whole = rnd(8, 20), part = rnd(2, 5) * 2;      /* even, so the halves are exact */
    const est = whole + part / 2;
    const opts = pick3(est, [whole, whole + part, part]);
    return { stem: "A leaf covers <b>" + whole + " whole squares</b> and <b>" + part +
        " part squares</b>. What is the best estimate of its area?",
      opts: opts.map((v) => v + " squares"), ans: opts.indexOf(est),
      why: "Count each part square as a half: " + whole + " + " + (part / 2) + " = <b>" +
        est + " squares</b>." };
  });

  /* 8 (4Gg.09) reads between the marks. Halves and quarters only at this stage. */
  ask(8, () => {
    const step = [10, 20, 100][rnd(0, 2)], lo = rnd(1, 6) * step;
    const f = [[1, 2, "halfway"], [1, 4, "a quarter of the way"], [3, 4, "three quarters of the way"]][rnd(0, 2)];
    const val = lo + step * f[0] / f[1];
    const opts = pick3(val, [lo + step, lo, lo + step / 2]);
    return { stem: "The marks are <b>" + fmt(lo) + "</b> and <b>" + fmt(lo + step) +
        "</b>. The pointer is <b>" + f[2] + "</b> between them. What does it read?",
      opts: opts.map(fmt), ans: opts.indexOf(val),
      why: "The gap is " + fmt(step) + ", and " + f[2] + " along is " +
        fmt(step * f[0] / f[1]) + " past " + fmt(lo) + ": <b>" + fmt(val) + "</b>." };
  });

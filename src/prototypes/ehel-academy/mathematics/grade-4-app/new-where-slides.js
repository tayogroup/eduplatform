
  /* ---- shared by the new Where Things Are slides ---- */
  const W_CARD = ["N", "E", "S", "W"];
  const W_EIGHT = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const W_LONG = { N: "north", NE: "north-east", E: "east", SE: "south-east",
    S: "south", SW: "south-west", W: "west", NW: "north-west" };
  const W_STEP = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1],
    S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
  const W_C = 30, W_P = 10;                       /* cell size and padding, as slide 9 uses */
  const wCells = (mark) => {
    let g = "";
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++)
      g += '<rect class="cell' + (mark ? mark(x, y) : "") + '" data-x="' + x + '" data-y="' + y +
        '" x="' + (W_P + x * W_C) + '" y="' + (W_P + y * W_C) + '" width="' + W_C + '" height="' + W_C + '"></rect>';
    return g;
  };
  const wDot = (cls, x, y) => '<circle class="' + cls + '" cx="' + (W_P + x * W_C + W_C / 2) +
    '" cy="' + (W_P + y * W_C + W_C / 2) + '" r="11"></circle>';

  /* ---- 1: the cardinal points and quarter turns (4Gp.01) ---- */
  const W_TURNS = [[1, "a quarter turn clockwise"], [2, "a half turn"],
    [3, "three quarter turns clockwise"], [3, "a quarter turn anticlockwise"]];
  let w1 = null, w1right = 0, w1asked = 0, w1lock = false;
  function wNew1() {
    const from = rnd(0, 3), t = W_TURNS[rnd(0, W_TURNS.length - 1)];
    return { from: from, steps: t[0], name: t[1], to: (from + t[0]) % 4 };
  }
  function wPaint1() {
    const cx = 130, cy = 100, r = 62;
    const at = [[0, -1], [1, 0], [0, 1], [-1, 0]][w1.from];
    let g = '<circle class="cell" cx="' + cx + '" cy="' + cy + '" r="' + r + '"></circle>';
    W_CARD.forEach((k, i) => {
      const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][i];
      g += '<text class="compass" x="' + (cx + d[0] * (r + 14)) + '" y="' + (cy + d[1] * (r + 14) + 5) + '">' + k + "</text>";
    });
    g += '<line class="mir" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + at[0] * r) + '" y2="' + (cy + at[1] * r) + '"></line>';
    g += '<circle class="here" cx="' + (cx + at[0] * r) + '" cy="' + (cy + at[1] * r) + '" r="9"></circle>';
    $("wrose1").innerHTML = g;
    $("wq1").innerHTML = "You are facing <b>" + W_LONG[W_CARD[w1.from]] + "</b>. Make <b>" + w1.name + "</b>. Which way are you facing now?";
    $("wpick1").innerHTML = W_CARD.map((k) => '<button type="button" class="choice word" data-k="' + k + '">' + W_LONG[k] + "</button>").join("");
    $("wtask1").textContent = "Answered " + w1asked + " · " + w1right + " right";
  }
  $("wpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || w1lock) return;
    w1lock = true; w1asked++;
    const ok = b.dataset.k === W_CARD[w1.to];
    if (ok) w1right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("wwork1"), [
      { k: "Facing", v: W_LONG[W_CARD[w1.from]] },
      { k: "The turn", v: w1.name + ", which is <b>" + w1.steps + "</b> step" + (w1.steps === 1 ? "" : "s") + " round" },
      { k: "Counting round", v: W_CARD.map((k, i) => (i === w1.to ? "<b>" + k + "</b>" : k)).join(" → ") },
      { k: "Now facing", v: "<b>" + W_LONG[W_CARD[w1.to]] + "</b>", total: true },
    ]);
    $("wfb1").innerHTML = (ok ? cheer() + " " : "It is " + W_LONG[W_CARD[w1.to]] + ". ") +
      "The four points go round in order, so each quarter turn moves you on one.";
    $("wfb1").className = "fb " + (ok ? "good" : "bad");
    say($("wfb1").textContent);
    if (w1right >= 4) finish(0, "You can turn and say which way you face!");
    setTimeout(() => { w1 = wNew1(); w1lock = false; wPaint1(); }, 1900);
  });
  w1 = wNew1(); wPaint1();

  /* ---- 2: the ordinal points and their notation (4Gp.01) ---- */
  let w2 = null, w2right = 0, w2lock = false;
  function wNew2() {
    const i = rnd(0, 3) * 2;                       /* a cardinal index in the eight */
    const a = W_EIGHT[i], b = W_EIGHT[(i + 2) % 8], mid = W_EIGHT[(i + 1) % 8];
    return { a: a, b: b, mid: mid };
  }
  function wPaint2() {
    const cx = 130, cy = 100, r = 62;
    let g = '<circle class="cell" cx="' + cx + '" cy="' + cy + '" r="' + r + '"></circle>';
    W_EIGHT.forEach((k) => {
      const d = W_STEP[k], len = Math.abs(d[0]) + Math.abs(d[1]) > 1 ? 0.72 : 1;
      const hit = k === w2.a || k === w2.b;
      g += '<text class="compass' + (hit ? " here" : "") + '" x="' + (cx + d[0] * (r + 14) * len) +
        '" y="' + (cy + d[1] * (r + 14) * len + 5) + '">' + k + "</text>";
    });
    $("wrose2").innerHTML = g;
    $("wq2").innerHTML = "Which point lies <b>between " + W_LONG[w2.a] + " and " + W_LONG[w2.b] + "</b>?";
    $("wpick2").innerHTML = ["NE", "SE", "SW", "NW"].map((k) => '<button type="button" class="choice" data-k="' + k + '">' + k + "</button>").join("");
    $("wtask2").textContent = "Right so far: " + w2right + " of 4";
  }
  $("wpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || w2lock) return;
    w2lock = true;
    const ok = b.dataset.k === w2.mid;
    if (ok) w2right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("wwork2"), [
      { k: "The two points", v: W_LONG[w2.a] + " and " + W_LONG[w2.b] },
      { k: "Join the names", v: W_LONG[w2.a] + " + " + W_LONG[w2.b] + " = <b>" + W_LONG[w2.mid] + "</b>" },
      { k: "Written short", v: "<b>" + w2.mid + "</b>, and the north or south part always comes first", total: true },
    ]);
    $("wfb2").innerHTML = (ok ? cheer() + " " : "It is " + w2.mid + ". ") +
      "The in-between points are the <b>ordinal</b> ones, and their names are both cardinals joined.";
    $("wfb2").className = "fb " + (ok ? "good" : "bad");
    say($("wfb2").textContent);
    if (w2right >= 4) finish(1, "You know all eight points!");
    setTimeout(() => { w2 = wNew2(); w2lock = false; wPaint2(); }, 1900);
  });
  w2 = wNew2(); wPaint2();

  /* ---- 3: following a route of two moves (4Gp.01) ---- */
  let w3 = null, w3right = 0, w3lock = false;
  function wNew3() {
    for (let t = 0; t < 80; t++) {
      const sx = rnd(1, 6), sy = rnd(1, 6);
      const k1 = ["N", "E", "S", "W"][rnd(0, 3)], n1 = rnd(1, 3);
      const k2 = ["N", "E", "S", "W"][rnd(0, 3)], n2 = rnd(1, 3);
      if (k1 === k2) continue;
      const mx = sx + W_STEP[k1][0] * n1, my = sy + W_STEP[k1][1] * n1;
      const ex = mx + W_STEP[k2][0] * n2, ey = my + W_STEP[k2][1] * n2;
      if (mx < 0 || mx > 7 || my < 0 || my > 7 || ex < 0 || ex > 7 || ey < 0 || ey > 7) continue;
      if (ex === sx && ey === sy) continue;
      return { s: [sx, sy], m: [mx, my], e: [ex, ey], k1: k1, n1: n1, k2: k2, n2: n2 };
    }
    return { s: [1, 1], m: [3, 1], e: [3, 3], k1: "E", n1: 2, k2: "S", n2: 2 };
  }
  function wPaint3() {
    let g = wCells(null);
    g += wDot("here", w3.s[0], w3.s[1]);
    g += '<text class="compass" x="' + (W_P + 4 * W_C) + '" y="' + (W_P - 1) + '">N</text>';
    $("wmap3").innerHTML = g;
    $("wq3").innerHTML = "Start on the dot. Go <b>" + w3.n1 + " " + W_LONG[w3.k1] + "</b>, then <b>" +
      w3.n2 + " " + W_LONG[w3.k2] + "</b>. Tap the square you land on.";
    $("wtask3").textContent = "Routes finished: " + w3right + " of 3";
  }
  $("wmap3").addEventListener("click", (e) => {
    const c = e.target.closest("rect[data-x]"); if (!c || w3lock) return;
    w3lock = true;
    const x = Number(c.dataset.x), y = Number(c.dataset.y);
    const ok = x === w3.e[0] && y === w3.e[1];
    if (ok) w3right++;
    $("wmap3").innerHTML += wDot(ok ? "there" : "mine", x, y);
    if (!ok) $("wmap3").innerHTML += wDot("there", w3.e[0], w3.e[1]);
    lines($("wwork3"), [
      { k: "Start", v: "column " + w3.s[0] + ", row " + w3.s[1] },
      { k: "First move", v: w3.n1 + " " + W_LONG[w3.k1] + " → column " + w3.m[0] + ", row " + w3.m[1] },
      { k: "Second move", v: w3.n2 + " " + W_LONG[w3.k2] + " → column " + w3.e[0] + ", row " + w3.e[1] },
      { k: "Do them in order", v: "the second move starts from where the first one ended", total: true },
    ]);
    $("wfb3").innerHTML = ok ? cheer() + " That is where the route ends."
      : "Not there. The route ends at column " + w3.e[0] + ", row " + w3.e[1] + ".";
    $("wfb3").className = "fb " + (ok ? "good" : "bad");
    say($("wfb3").textContent);
    if (w3right >= 3) finish(2, "You can follow a route!");
    setTimeout(() => { w3 = wNew3(); w3lock = false; wPaint3(); }, 2100);
  });
  w3 = wNew3(); wPaint3();

  /* ---- 4: along first, then up (4Gp.02) ---- */
  let w4 = null, w4right = 0, w4lock = false;
  function wNew4() {
    let a = rnd(1, 7), b = rnd(1, 7);
    while (a === b) b = rnd(1, 7);
    return { a: a, b: b, want: rnd(0, 1) === 1 };   /* want true = ask for (a,b) */
  }
  function wPaint4() {
    const C = 28, P = 22, H = 260;
    const px = (v) => P + v * C, py = (v) => H - P - v * C;
    let g = "";
    for (let i = 0; i <= 8; i++) {
      g += '<line class="gl" x1="' + px(i) + '" y1="' + py(0) + '" x2="' + px(i) + '" y2="' + py(8) + '"></line>';
      g += '<line class="gl" x1="' + px(0) + '" y1="' + py(i) + '" x2="' + px(8) + '" y2="' + py(i) + '"></line>';
    }
    g += '<line class="ax" x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(8) + '" y2="' + py(0) + '"></line>';
    g += '<line class="ax" x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(0) + '" y2="' + py(8) + '"></line>';
    for (let i = 0; i <= 8; i += 2) {
      g += '<text class="lab" x="' + px(i) + '" y="' + (py(0) + 14) + '">' + i + "</text>";
      if (i) g += '<text class="lab" x="' + (px(0) - 10) + '" y="' + (py(i) + 4) + '">' + i + "</text>";
    }
    g += '<circle class="pt" data-p="ab" cx="' + px(w4.a) + '" cy="' + py(w4.b) + '" r="8"></circle>';
    g += '<circle class="pt" data-p="ba" cx="' + px(w4.b) + '" cy="' + py(w4.a) + '" r="8"></circle>';
    $("wxy4").innerHTML = g;
    const t = w4.want ? [w4.a, w4.b] : [w4.b, w4.a];
    $("wq4").innerHTML = "Tap the point at <b>(" + t[0] + ", " + t[1] + ")</b>.";
    $("wtask4").textContent = "Right so far: " + w4right + " of 4";
  }
  $("wxy4").addEventListener("click", (e) => {
    const p = e.target.closest("circle[data-p]"); if (!p || w4lock) return;
    w4lock = true;
    const ok = p.dataset.p === (w4.want ? "ab" : "ba");
    if (ok) w4right++;
    p.classList.add(ok ? "good" : "oops");
    const t = w4.want ? [w4.a, w4.b] : [w4.b, w4.a];
    lines($("wwork4"), [
      { k: "The pair", v: "(" + t[0] + ", " + t[1] + ")" },
      { k: "First number", v: "<b>" + t[0] + "</b> along the bottom" },
      { k: "Second number", v: "<b>" + t[1] + "</b> up the side" },
      { k: "Why order matters", v: "(" + t[0] + ", " + t[1] + ") and (" + t[1] + ", " + t[0] + ") are two different places", total: true },
    ]);
    $("wfb4").innerHTML = (ok ? cheer() + " " : "Not that one. ") + "Along the bottom first, then up the side.";
    $("wfb4").className = "fb " + (ok ? "good" : "bad");
    say($("wfb4").textContent);
    if (w4right >= 4) finish(3, "You read coordinates the right way round!");
    setTimeout(() => { w4 = wNew4(); w4lock = false; wPaint4(); }, 2000);
  });
  w4 = wNew4(); wPaint4();

  /* ---- 5: the coordinates of a shape's corners (4Gp.02) ---- */
  let w5 = null, w5right = 0, w5lock = false;
  function wNew5() {
    const x1 = rnd(0, 4), y1 = rnd(0, 4);
    const x2 = x1 + rnd(2, 3), y2 = y1 + rnd(2, 3);
    const corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
    return { x1: x1, y1: y1, x2: x2, y2: y2, corners: corners, pick: rnd(0, 3) };
  }
  function wPaint5() {
    const C = 28, P = 22, H = 260;
    const px = (v) => P + v * C, py = (v) => H - P - v * C;
    let g = "";
    for (let i = 0; i <= 8; i++) {
      g += '<line class="gl" x1="' + px(i) + '" y1="' + py(0) + '" x2="' + px(i) + '" y2="' + py(8) + '"></line>';
      g += '<line class="gl" x1="' + px(0) + '" y1="' + py(i) + '" x2="' + px(8) + '" y2="' + py(i) + '"></line>';
    }
    g += '<line class="ax" x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(8) + '" y2="' + py(0) + '"></line>';
    g += '<line class="ax" x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(0) + '" y2="' + py(8) + '"></line>';
    for (let i = 0; i <= 8; i += 2) {
      g += '<text class="lab" x="' + px(i) + '" y="' + (py(0) + 14) + '">' + i + "</text>";
      if (i) g += '<text class="lab" x="' + (px(0) - 10) + '" y="' + (py(i) + 4) + '">' + i + "</text>";
    }
    g += '<rect class="guide" x="' + px(w5.x1) + '" y="' + py(w5.y2) + '" width="' + ((w5.x2 - w5.x1) * C) +
      '" height="' + ((w5.y2 - w5.y1) * C) + '"></rect>';
    w5.corners.forEach((c, i) => {
      g += '<circle class="pt' + (i === w5.pick ? " tgt" : "") + '" cx="' + px(c[0]) + '" cy="' + py(c[1]) + '" r="' + (i === w5.pick ? 9 : 6) + '"></circle>';
    });
    $("wxy5").innerHTML = g;
    const c = w5.corners[w5.pick];
    const wrong1 = [c[1], c[0]], wrong2 = [c[0], c[1] + (c[1] < 7 ? 1 : -1)];
    const opts = shuffle([c, wrong1, wrong2].map((p) => p.join(",")));
    w5.opts = opts;
    $("wq5").innerHTML = "What are the coordinates of the <b>circled corner</b>?";
    $("wpick5").innerHTML = opts.map((o) => '<button type="button" class="choice" data-o="' + o + '">(' + o.replace(",", ", ") + ")</button>").join("");
    $("wtask5").textContent = "Right so far: " + w5right + " of 4";
  }
  $("wpick5").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-o]"); if (!b || w5lock) return;
    w5lock = true;
    const c = w5.corners[w5.pick];
    const ok = b.dataset.o === c.join(",");
    if (ok) w5right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("wwork5"), [
      { k: "Go along", v: "<b>" + c[0] + "</b> from the corner of the grid" },
      { k: "Then up", v: "<b>" + c[1] + "</b>" },
      { k: "So the corner is", v: "<b>(" + c[0] + ", " + c[1] + ")</b>" },
      { k: "All four corners", v: w5.corners.map((p) => "(" + p[0] + ", " + p[1] + ")").join(", "), total: true },
    ]);
    $("wfb5").innerHTML = (ok ? cheer() + " " : "It is (" + c[0] + ", " + c[1] + "). ") + "Along the bottom, then up the side.";
    $("wfb5").className = "fb " + (ok ? "good" : "bad");
    say($("wfb5").textContent);
    if (w5right >= 4) finish(4, "You can read every corner!");
    setTimeout(() => { w5 = wNew5(); w5lock = false; wPaint5(); }, 2100);
  });
  w5 = wNew5(); wPaint5();

  /* ---- 6: a mirror line on the edge of the shape (4Gp.03) ---- */
  let w6 = null, w6lock = false;
  function wNew6() {
    const w = rnd(2, 3), h = rnd(2, 3);
    const x1 = rnd(1, 3), y1 = rnd(1, 4);
    const cells = [];
    for (let x = x1; x < x1 + w; x++) for (let y = y1; y < y1 + h; y++) cells.push([x, y]);
    const m = x1 + w;                              /* the boundary just past the right edge */
    return { cells: cells, m: m, found: [], need: cells.length };
  }
  const wReflect = (x, m) => 2 * m - 1 - x;
  function wPaint6() {
    const mark = (x, y) => {
      if (w6.cells.some((c) => c[0] === x && c[1] === y)) return " orig";
      if (w6.found.some((c) => c[0] === x && c[1] === y)) return " mine";
      return "";
    };
    let g = wCells(mark);
    const mx = W_P + w6.m * W_C;
    g += '<line class="mir" x1="' + mx + '" y1="' + W_P + '" x2="' + mx + '" y2="' + (W_P + 8 * W_C) + '"></line>';
    $("wmir6").innerHTML = g;
    $("wq6").innerHTML = "The mirror runs along the <b>right edge</b> of the shape. Tap the " +
      w6.need + " squares of its reflection. <b>" + w6.found.length + "</b> found.";
    $("wtask6").textContent = "The reflection touches the shape, because the edge has no distance to cross.";
  }
  $("wmir6").addEventListener("click", (e) => {
    const c = e.target.closest("rect[data-x]"); if (!c || w6lock) return;
    const x = Number(c.dataset.x), y = Number(c.dataset.y);
    const want = w6.cells.some((p) => wReflect(p[0], w6.m) === x && p[1] === y);
    if (!want) {
      $("wfb6").innerHTML = "Not that square. Each one crosses the mirror and lands the same distance the other side.";
      $("wfb6").className = "fb bad";
      return;
    }
    if (w6.found.some((p) => p[0] === x && p[1] === y)) return;
    w6.found.push([x, y]);
    wPaint6();
    if (w6.found.length >= w6.need) {
      w6lock = true;
      const left = Math.min.apply(null, w6.cells.map((p) => p[0]));
      const right = Math.max.apply(null, w6.found.map((p) => p[0]));
      lines($("wwork6"), [
        { k: "The shape", v: "columns " + left + " to " + (w6.m - 1) },
        { k: "The mirror", v: "on the edge, just past column " + (w6.m - 1) },
        { k: "The square touching it", v: "column " + (w6.m - 1) + " is <b>right against</b> the mirror, so its partner is column " + w6.m + " — they touch" },
        { k: "The whole picture", v: "columns " + left + " to " + right + ", <b>twice as wide</b> as the shape", total: true },
      ]);
      $("wfb6").innerHTML = cheer() + " With the mirror on the edge, nothing has a gap to cross, so the reflection sits right against the shape.";
      $("wfb6").className = "fb good";
      say($("wfb6").textContent);
      finish(5, "You reflected it against its own edge!");
      setTimeout(() => { w6 = wNew6(); w6lock = false; $("wfb6").textContent = ""; $("wfb6").className = "fb"; wPaint6(); }, 2600);
    } else {
      $("wfb6").textContent = "";
      $("wfb6").className = "fb";
    }
  });
  w6 = wNew6(); wPaint6();

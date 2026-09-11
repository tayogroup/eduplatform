
  /* ==================================================================
     SIDES, SIZES AND SECONDS - Grade 3 geometry, measure and time.
     Cambridge Primary Mathematics 0096, Stage 3 (3Gg, 3Gt, 3Gp).
     ================================================================== */

  function offer(host, opts, right, onPick) {
    $(host).innerHTML = shuffle(opts).map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $(host).dataset.right = String(right); $(host).dataset.live = "1"; $(host).onclick = onPick;
  }
  function mark(host, btn, ok) {
    if ($(host).dataset.live !== "1") return false;
    $(host).dataset.live = "0";
    [...$(host).querySelectorAll(".choice")].forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? "right" : "wrong");
    if (!ok) { const r = $(host).dataset.right; [...$(host).querySelectorAll(".choice")].forEach((b) => { if (b.dataset.v === r) b.classList.add("right"); }); }
    return true;
  }
  function scoreLine(id, got, asked, target) { $(id).textContent = got + " right out of " + asked + (got >= target ? " - sticker earned!" : ""); }
  function nextQ(gen) { let item, guard = 0; do { item = gen(); } while (new Set(item.opts.map(String)).size !== item.opts.length && guard++ < 60); return item; }
  function uniq(list, want) { const out = []; for (const v of list) { if (out.length >= want) break; if (!out.includes(v)) out.push(v); } return out; }
  /* A regular polygon drawn on a circle. `wob` squashes it vertically to make it
     IRREGULAR - which must mean unequal SIDES, not merely unequal angles.
     Alternating the radius instead was the first attempt and was wrong: on an
     even-sided polygon it produces an equilateral shape, every side the same
     length, which is precisely what this lesson tells a child regular means. */
  function poly(cx, cy, r, n, rot, wob) {
    const sy = wob ? 0.56 : 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rot + i * 2 * Math.PI / n;
      pts.push([(cx + r * Math.cos(a)).toFixed(1), (cy + r * sy * Math.sin(a)).toFixed(1)]);
    }
    return pts;
  }
  const ptsStr = (pts) => pts.map((p) => p.join(",")).join(" ");

  /* ---- 1: naming flat shapes ---- 3Gg.01 identify, describe, classify, name and sketch 2D shapes */
  const SHAPES = [[3, "triangle"], [4, "quadrilateral"], [5, "pentagon"], [6, "hexagon"], [8, "octagon"]];
  let got1 = 0, asked1 = 0;
  function round1() {
    const [n, name] = SHAPES[rnd(0, SHAPES.length - 1)];
    const wob = rnd(0, 1) === 1;
    const pts = poly(150, 100, 74, n, -Math.PI / 2 + Math.random() * 1.2, wob);
    $("g1").innerHTML = '<polygon class="sh" points="' + ptsStr(pts) + '"></polygon>';
    $("say1").innerHTML = "Count the straight sides. What is this shape called?";
    const opts = uniq([name, ...shuffle(SHAPES.map((s) => s[1])).filter((x) => x !== name)], 4);
    offer("ch1", opts, name, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === name;
      if (!mark("ch1", b, ok)) return;
      asked1++; if (ok) got1++;
      $("fb1").className = "fb " + (ok ? "good" : "");
      $("fb1").textContent = (ok ? cheer() + " " : "") + "It has " + n + " straight sides and " + n + " corners, so it is a " + name + (wob ? " - a stretched one, but still a " + name + "." : ".");
      say(ok ? cheer() : n + " sides, so it is a " + name);
      scoreLine("sc1", got1, asked1, 4);
      if (got1 >= 4) finish(0, "");
      setTimeout(round1, 2100);
    });
  }
  round1();

  /* ---- 2: regular or irregular ---- 3Gg.01 differentiate between regular and irregular polygons */
  let got2 = 0, asked2 = 0;
  function round2() {
    const n = [5, 6, 8][rnd(0, 2)];
    const rightIdx = rnd(0, 2);
    let h = "";
    for (let i = 0; i < 3; i++) {
      const reg = i === rightIdx;
      const pts = poly(42, 42, 34, n, -Math.PI / 2, !reg);
      h += '<div class="pick" role="button" tabindex="0" aria-label="Shape ' + (i + 1) + '" data-r="' + (reg ? 1 : 0) + '"><svg viewBox="0 0 84 84" aria-hidden="true" focusable="false"><polygon fill="' + (reg ? "#1E8C86" : "#6B7F82") + '" stroke="#1B2A2F" stroke-width="2.5" points="' + ptsStr(pts) + '"></polygon></svg></div>';
    }
    $("sg2").innerHTML = h;
    $("say2").innerHTML = "All three have <b>" + n + " sides</b>. Which one is <b>regular</b> - every side the same length?";
    $("sg2").dataset.live = "1";
    $("sg2").onclick = (e) => {
      const c = e.target.closest(".pick"); if (!c || $("sg2").dataset.live !== "1") return;
      $("sg2").dataset.live = "0";
      const ok = c.dataset.r === "1";
      [...$("sg2").children].forEach((x) => { if (x.dataset.r === "1") x.classList.add("on"); else x.classList.add("off"); });
      asked2++; if (ok) got2++;
      $("fb2").className = "fb " + (ok ? "good" : "");
      $("fb2").textContent = (ok ? cheer() + " " : "Look again. ") + "All three are " + (n === 5 ? "pentagons" : n === 6 ? "hexagons" : "octagons") + " because all three have " + n + " sides. Only the regular one has every side and every corner the same.";
      say(ok ? cheer() : "The regular one has every side the same");
      scoreLine("sc2", got2, asked2, 3);
      if (got2 >= 3) finish(1, "");
      setTimeout(round2, 2400);
    };
  }
  round2();

  /* ---- 3: lines of symmetry ---- 3Gg.09 identify horizontal and vertical lines of symmetry */
  let got3 = 0, asked3 = 0;
  const SYM = [
    { name: "a square", pts: [[100, 40], [200, 40], [200, 140], [100, 140]], v: true, h: true },
    { name: "a rectangle", pts: [[70, 52], [230, 52], [230, 128], [70, 128]], v: true, h: true },
    { name: "an isosceles triangle", pts: [[150, 35], [220, 145], [80, 145]], v: true, h: false },
    { name: "a scalene triangle", pts: [[110, 35], [230, 145], [70, 130]], v: false, h: false },
    { name: "a parallelogram", pts: [[95, 55], [235, 55], [205, 140], [65, 140]], v: false, h: false },
    { name: "a kite", pts: [[150, 30], [210, 90], [150, 160], [90, 90]], v: true, h: false },
  ];
  function round3() {
    const s = SYM[rnd(0, SYM.length - 1)];
    const vertical = rnd(0, 1) === 1;
    const yes = vertical ? s.v : s.h;
    const line = vertical ? '<line class="mir" x1="150" y1="18" x2="150" y2="182"></line>' : '<line class="mir" x1="45" y1="90" x2="255" y2="90"></line>';
    $("g3").innerHTML = '<polygon class="sh plain" points="' + ptsStr(s.pts) + '"></polygon>' + line;
    $("say3").innerHTML = "Is the dashed <b>" + (vertical ? "vertical" : "horizontal") + "</b> line a line of symmetry for " + s.name + "?";
    $("ch3").innerHTML = ["yes", "no"].map((o) => '<button type="button" class="choice word" data-v="' + o + '">' + o + "</button>").join("");
    $("ch3").dataset.right = yes ? "yes" : "no"; $("ch3").dataset.live = "1";
    $("ch3").onclick = (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === (yes ? "yes" : "no");
      if (!mark("ch3", b, ok)) return;
      asked3++; if (ok) got3++;
      $("fb3").className = "fb " + (ok ? "good" : "");
      $("fb3").textContent = (ok ? cheer() + " " : "") + (yes
        ? "Folded along that line, the two halves land exactly on top of each other."
        : "Folded along that line the two halves do not match, so it is not a line of symmetry - even though it does cut the shape in two.");
      say(ok ? cheer() : yes ? "Yes, it folds exactly" : "No, the halves do not match");
      scoreLine("sc3", got3, asked3, 5);
      if (got3 >= 5) finish(2, "");
      setTimeout(round3, 2300);
    };
  }
  round3();

  /* ---- 4: reflection ---- 3Gp.02 sketch the reflection of a 2D shape in a horizontal or vertical mirror line */
  let got4 = 0, asked4 = 0;
  const CELL = 34, COLS = 8, ROWS = 6, OX = 12, OY = 20;
  function round4() {
    /* 3Gp.02 names a horizontal OR a vertical mirror line, so both are drawn.
       The shape always sits wholly on one side of it. */
    const vertical = rnd(0, 1) === 1;
    const mirrorCol = 4, mirrorRow = 3;
    const cells = [];
    let want;
    if (vertical) {
      const w = rnd(2, 3), h = rnd(2, 3), c0 = rnd(0, mirrorCol - w), r0 = rnd(0, ROWS - h);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (!(r === h - 1 && c === w - 1 && rnd(0, 1))) cells.push([c0 + c, r0 + r]);
      want = cells.map((q) => [2 * mirrorCol - 1 - q[0], q[1]]);
    } else {
      const w = rnd(2, 4), h = rnd(2, 3), c0 = rnd(0, COLS - w), r0 = rnd(0, mirrorRow - h);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (!(r === h - 1 && c === w - 1 && rnd(0, 1))) cells.push([c0 + c, r0 + r]);
      want = cells.map((q) => [q[0], 2 * mirrorRow - 1 - q[1]]);
    }
    let svg = "";
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const on = cells.some((q) => q[0] === c && q[1] === r);
      const target = want.some((q) => q[0] === c && q[1] === r);
      const pickable = vertical ? c >= mirrorCol : r >= mirrorRow;
      svg += '<rect class="cell' + (on ? " on" : "") + (pickable ? " pick" : "") + '"' + (pickable ? ' role="button" tabindex="0" aria-label="column ' + (c + 1) + ", row " + (r + 1) + '"' : "") + ' data-c="' + c + '" data-r="' + r + '" data-t="' + (target ? 1 : 0) + '" x="' + (OX + c * CELL) + '" y="' + (OY + r * CELL) + '" width="' + CELL + '" height="' + CELL + '"></rect>';
    }
    svg += vertical
      ? '<line class="mir" x1="' + (OX + mirrorCol * CELL) + '" y1="' + (OY - 8) + '" x2="' + (OX + mirrorCol * CELL) + '" y2="' + (OY + ROWS * CELL + 8) + '"></line>'
      : '<line class="mir" x1="' + (OX - 8) + '" y1="' + (OY + mirrorRow * CELL) + '" x2="' + (OX + COLS * CELL + 8) + '" y2="' + (OY + mirrorRow * CELL) + '"></line>';
    $("g4").innerHTML = svg;
    $("say4").innerHTML = "The mirror line is <b>" + (vertical ? "vertical" : "horizontal") + "</b>. Tap the <b>" + want.length + "</b> squares where the reflection goes.";
    let found = 0, slips = 0;
    $("g4").onclick = (e) => {
      const t = e.target.closest("rect"); if (!t || !t.classList.contains("pick") || t.dataset.done) return;
      t.dataset.done = "1";
      if (t.dataset.t === "1") {
        t.classList.add("on"); found++; say("yes");
        if (found === want.length) {
          asked4++; if (slips === 0) got4++;
          $("fb4").className = "fb good";
          $("fb4").textContent = cheer() + " Every square is the same distance from the mirror on both sides" + (slips ? ", though " + slips + " went astray on the way." : ".");
          scoreLine("sc4", got4, asked4, 2);
          if (got4 >= 2) finish(3, "");
          setTimeout(round4, 2600);
        }
      } else {
        slips++; t.style.fill = "var(--bad-soft)";
        $("fb4").className = "fb";
        $("fb4").textContent = "Not that one - count how far the square is from the mirror, then count the same on this side.";
        say("not there");
      }
    };
  }
  round4();

  /* ---- 5: solid shapes ---- 3Gg.05 identify, describe, sort, name and sketch 3D shapes / 3Gg.08 recognise drawings of 3D shapes */
  const SOLIDS = [
    { name: "cube", f: 6, e: 12, v: 8, draw: "cube" },
    { name: "cuboid", f: 6, e: 12, v: 8, draw: "cuboid" },
    { name: "cylinder", f: 3, e: 2, v: 0, draw: "cyl" },
    { name: "cone", f: 2, e: 1, v: 1, draw: "cone" },
    { name: "sphere", f: 1, e: 0, v: 0, draw: "sph" },
    { name: "square-based pyramid", f: 5, e: 8, v: 5, draw: "pyr" },
  ];
  let got5 = 0, asked5 = 0;
  function drawSolid(kind) {
    const S = { cube: [88, 88], cuboid: [130, 74] }[kind];
    if (kind === "cube" || kind === "cuboid") {
      const [w, h] = S, x = 150 - w / 2, y = 110 - h / 2, d = 28;
      return '<rect class="sh plain" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"></rect>' +
        '<polygon class="sh plain" points="' + x + "," + y + " " + (x + d) + "," + (y - d) + " " + (x + w + d) + "," + (y - d) + " " + (x + w) + "," + y + '"></polygon>' +
        '<polygon class="sh plain" points="' + (x + w) + "," + y + " " + (x + w + d) + "," + (y - d) + " " + (x + w + d) + "," + (y + h - d) + " " + (x + w) + "," + (y + h) + '"></polygon>';
    }
    if (kind === "cyl") return '<ellipse class="sh plain" cx="150" cy="62" rx="46" ry="15"></ellipse><path class="sh plain" d="M104 62 L104 145 A46 15 0 0 0 196 145 L196 62"></path>';
    if (kind === "cone") return '<path class="sh plain" d="M150 42 L196 140 A46 14 0 0 1 104 140 Z"></path>';
    if (kind === "sph") return '<circle class="sh plain" cx="150" cy="102" r="52"></circle><ellipse cx="150" cy="102" rx="52" ry="17" fill="none" stroke="#6B7F82" stroke-width="2" stroke-dasharray="5 4"></ellipse>';
    return '<polygon class="sh plain" points="150,40 208,140 92,140"></polygon><polygon class="sh plain" points="92,140 208,140 232,120 116,120"></polygon>';
  }
  function round5() {
    const s = SOLIDS[rnd(0, SOLIDS.length - 1)];
    $("g5").innerHTML = drawSolid(s.draw);
    $("clue5").className = "fb";
    $("clue5").textContent = s.f + " face" + (s.f === 1 ? "" : "s") + ", " + s.e + " edge" + (s.e === 1 ? "" : "s") + ", " + s.v + " corner" + (s.v === 1 ? "" : "s") + ".";
    $("say5").textContent = "Which solid shape is this?";
    const opts = uniq([s.name, ...shuffle(SOLIDS.map((x) => x.name)).filter((x) => x !== s.name)], 4);
    offer("ch5", opts, s.name, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === s.name;
      if (!mark("ch5", b, ok)) return;
      asked5++; if (ok) got5++;
      $("fb5").className = "fb " + (ok ? "good" : "");
      $("fb5").textContent = (ok ? cheer() + " " : "") + "A " + s.name + " has " + s.f + " faces, " + s.e + " edges and " + s.v + " corners. Some of them are hidden round the back of the drawing.";
      say(ok ? cheer() : "It is a " + s.name);
      scoreLine("sc5", got5, asked5, 4);
      if (got5 >= 4) finish(4, "");
      setTimeout(round5, 2400);
    });
  }
  round5();

  /* ---- 6: perimeter ---- 3Gg.03 / 3Gg.04 estimate, measure and calculate the perimeter */
  let got6 = 0, asked6 = 0;
  function round6() {
    const w = rnd(3, 12), h = rnd(2, 9);
    const answer = 2 * (w + h);
    const px = 40, py = 45, pw = 210, ph = 100;
    $("g6").innerHTML = '<rect class="sh" x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '"></rect>' +
      '<text class="lab" x="' + (px + pw / 2) + '" y="' + (py - 12) + '">' + w + " cm</text>" +
      '<text class="lab" x="' + (px + pw / 2) + '" y="' + (py + ph + 24) + '">' + w + " cm</text>" +
      '<text class="lab" x="' + (px - 18) + '" y="' + (py + ph / 2 + 5) + '">' + h + "</text>" +
      '<text class="lab" x="' + (px + pw + 20) + '" y="' + (py + ph / 2 + 5) + '">' + h + "</text>";
    $("say6").innerHTML = "The rectangle is <b>" + w + " cm</b> by <b>" + h + " cm</b>. What is the perimeter?";
    const opts = uniq([answer, w + h, w * h, answer + 2], 4);
    offer("ch6", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch6", b, ok)) return;
      asked6++; if (ok) got6++;
      $("fb6").className = "fb " + (ok ? "good" : "");
      $("fb6").textContent = (ok ? cheer() + " " : "") + w + " + " + h + " + " + w + " + " + h + " = " + answer + " cm. All four sides, not two.";
      say(ok ? cheer() : "The perimeter is " + answer + " centimetres");
      scoreLine("sc6", got6, asked6, 4);
      if (got6 >= 4) finish(5, "");
      setTimeout(round6, 2300);
    });
  }
  round6();

  /* ---- 7: area on a grid ---- 3Gg.03 / 3Gg.04 area on a square grid */
  let got7 = 0, asked7 = 0;
  function round7() {
    const C = 30, cols = 9, rows = 6, ox = 18, oy = 18;
    const w = rnd(2, 5), h = rnd(2, 4), c0 = rnd(0, cols - w), r0 = rnd(0, rows - h);
    const extra = rnd(0, 1) === 1 ? rnd(1, 3) : 0;
    const cells = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push([c0 + c, r0 + r]);
    for (let k = 0; k < extra; k++) {
      const c = c0 + w, r = r0 + k;
      if (c < cols && r < rows && !cells.some((p) => p[0] === c && p[1] === r)) cells.push([c, r]);
    }
    const answer = cells.length;
    let svg = "";
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = cells.some((p) => p[0] === c && p[1] === r);
      svg += '<rect class="cell' + (on ? " on" : "") + '" x="' + (ox + c * C) + '" y="' + (oy + r * C) + '" width="' + C + '" height="' + C + '"></rect>';
    }
    $("g7").innerHTML = svg;
    $("say7").innerHTML = "How many squares does the shape cover?";
    const opts = uniq([answer, answer + 1, answer - 1, 2 * (w + h)], 4).filter((v) => v > 0);
    offer("ch7", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch7", b, ok)) return;
      asked7++; if (ok) got7++;
      $("fb7").className = "fb " + (ok ? "good" : "");
      $("fb7").textContent = (ok ? cheer() + " " : "") + "It covers " + answer + " squares. That is the area - the space inside, not the distance round the edge.";
      say(ok ? cheer() : "The area is " + answer + " squares");
      scoreLine("sc7", got7, asked7, 4);
      if (got7 >= 4) finish(6, "");
      setTimeout(round7, 2300);
    });
  }
  round7();

  /* ---- 8: draw it ---- 3Gg.04 draw lines, rectangles and squares; calculate perimeter, and area on a square grid */
  const DC = 34, DCOLS = 8, DROWS = 6, DOX = 12, DOY = 20;
  let want8d = null, pickA = null, got8d = 0, asked8d = 0;
  function paint8d(sel) {
    let svg = "";
    for (let r = 0; r < DROWS; r++) for (let c = 0; c < DCOLS; c++) {
      const on = sel && c >= sel.c0 && c <= sel.c1 && r >= sel.r0 && r <= sel.r1;
      const corner = pickA && pickA[0] === c && pickA[1] === r;
      svg += '<rect class="cell' + (on ? " on" : "") + ' pick" role="button" tabindex="0" aria-label="column ' + (c + 1) + ", row " + (r + 1) + '" data-c="' + c + '" data-r="' + r + '" x="' + (DOX + c * DC) + '" y="' + (DOY + r * DC) + '" width="' + DC + '" height="' + DC + '"' + (corner && !sel ? ' fill="var(--accent)"' : "") + "></rect>";
    }
    $("g8d").innerHTML = svg;
  }
  function round8d() {
    const square = rnd(0, 2) === 0;
    const w = square ? rnd(2, 5) : rnd(2, 6);
    const h = square ? w : (function () { let v = rnd(2, 5); if (v === w) v = v === 5 ? 2 : v + 1; return v; })();
    want8d = { w: w, h: h, square: square };
    pickA = null;
    paint8d(null);
    $("say8d").innerHTML = square
      ? "Draw a <b>square</b> with sides of <b>" + w + "</b> squares. Tap two opposite corners."
      : "Draw a rectangle <b>" + w + "</b> squares wide and <b>" + h + "</b> squares tall. Tap two opposite corners.";
    $("fb8d").className = "fb"; $("fb8d").textContent = "";
  }
  $("g8d").addEventListener("click", (e) => {
    const t = e.target.closest("rect"); if (!t) return;
    const c = Number(t.dataset.c), r = Number(t.dataset.r);
    if (!pickA) { pickA = [c, r]; paint8d(null); say("Now the opposite corner."); return; }
    const sel = { c0: Math.min(pickA[0], c), c1: Math.max(pickA[0], c), r0: Math.min(pickA[1], r), r1: Math.max(pickA[1], r) };
    paint8d(sel);
    const w = sel.c1 - sel.c0 + 1, h = sel.r1 - sel.r0 + 1;
    const ok = w === want8d.w && h === want8d.h;
    asked8d++; if (ok) got8d++;
    const per = 2 * (w + h), area = w * h;
    $("fb8d").className = "fb " + (ok ? "good" : "");
    $("fb8d").textContent = (ok ? cheer() + " " : "That one is " + w + " by " + h + ". ")
      + "You drew " + w + " wide and " + h + " tall" + (w === h ? ", which is a square" : "") + ". Its perimeter is " + w + " + " + h + " + " + w + " + " + h + " = " + per + " squares, and its area is " + w + " \u00d7 " + h + " = " + area + " squares.";
    say(ok ? cheer() + " perimeter " + per + ", area " + area : "That one is " + w + " by " + h);
    scoreLine("sc8d", got8d, asked8d, 3);
    if (got8d >= 3) finish(7, "");
    pickA = null;
    setTimeout(round8d, 3000);
  });
  $("clr8d").addEventListener("click", () => { pickA = null; paint8d(null); });
  round8d();

  /* ---- 17: check ---- */
  const QS = [
    () => { const s = SHAPES[rnd(0, SHAPES.length - 1)]; return { q: "How many sides does a " + s[1] + " have?", opts: [s[0], s[0] + 1, s[0] - 1], a: s[0], why: "A " + s[1] + " has " + s[0] + " straight sides." }; },
    () => { const w = rnd(3, 9), h = rnd(2, 8); return { q: "A rectangle is " + w + " cm by " + h + " cm. What is its perimeter?", opts: [2 * (w + h), w + h, w * h], a: 2 * (w + h), why: w + " + " + h + " + " + w + " + " + h + " = " + 2 * (w + h) + " cm." }; },
    () => { const s = SOLIDS[rnd(0, 1)]; return { q: "How many faces does a " + s.name + " have?", opts: [s.f, s.f + 2, s.f - 2], a: s.f, why: "A " + s.name + " has " + s.f + " faces, some hidden at the back." }; },
    () => { return { q: "A shape covers 12 squares on a grid. What is that called?", opts: ["its area", "its perimeter", "its symmetry"], a: "its area", why: "Area is the space inside; perimeter is the distance round the edge." }; },
    () => { return { q: "How many lines of symmetry does a square have?", opts: [4, 2, 1], a: 4, why: "Two through the sides and two through the corners." }; },
    () => { return { q: "A shape is reflected in a mirror line. What happens to its size?", opts: ["it stays the same", "it doubles", "it halves"], a: "it stays the same", why: "A reflection turns a shape round; it does not resize it." }; },
  ];
;
  let qi = 0, got17 = 0, order17 = [];
  function round17() {
    if (qi >= order17.length) {
      $("q17").textContent = ""; $("ch17").innerHTML = "";
      $("fb17").className = "fb good"; $("fb17").textContent = "Finished! " + got17 + " out of " + order17.length + ".";
      $("sc17").textContent = "";
      if (got17 >= 4) finish(8, "You have finished the check.");
      else retryCheck($("fb17"), $("ch17"), got17, order17.length, 4, function () { qi = 0; got17 = 0; order17 = shuffle(QS); round17(); });
      return;
    }
    const item = nextQ(order17[qi]);
    $("q17").textContent = item.q; $("say17").textContent = item.q;
    offer("ch17", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch17", b, ok)) return;
      if (ok) got17++;
      qi++;
      $("fb17").className = "fb " + (ok ? "good" : "");
      $("fb17").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc17").textContent = got17 + " right out of " + qi;
      setTimeout(round17, 2100);
    });
  }
  order17 = shuffle(QS);
  round17();

  /* ---- 18: stickers ---- */
  const STICKERS = [
    ["🔺", "Naming flat shapes"],
    ["⬡", "Regular or irregular"],
    ["🦋", "Lines of symmetry"],
    ["↔️", "Mirror it"],
    ["📦", "Solid shapes"],
    ["🚧", "Perimeter"],
    ["🔲", "Area"],
    ["✏️", "Draw it yourself"],
    ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];

  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb18").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb18").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You know your shapes inside out." : got + " of " + STICKERS.length + " stickers so far.";
  }
  $("restart").addEventListener("click", () => location.reload());




  /* ==================================================================
     CONVINCING - "presenting evidence to justify or challenge a
     mathematical idea or solution" (Cambridge TWM.04).

     A tap-to-answer deck cannot ask a child to WRITE a justification, so
     this asks them to recognise one: a claim that is true, and three
     reasons for it of which only one does any work. It is an
     approximation of the characteristic and is recorded as one.

     Every wrong reason is either the misconception the lesson already
     teaches against, or something perfectly TRUE that explains nothing -
     and the second kind is the whole point of the step.

     It works out its own slide index from the DOM, so inserting it moved
     no other step and nothing had to be renumbered.
     ================================================================== */
  (function () {
    const BANK = [
      [
            "A squashed six-sided shape is still a hexagon.",
            "A hexagon is any shape with six straight sides; being squashed makes it irregular, not something else.",
            [
                  "Only regular shapes get names.",
                  "It is a hexagon because it is wide."
            ],
            "Regular tells you the sides are equal. The name tells you how many there are."
      ],
      [
            "A rectangle 6 cm by 2 cm has a perimeter of 16 cm.",
            "6 + 2 + 6 + 2 = 16, because the other two sides are the same as the first two.",
            [
                  "6 + 2 = 8.",
                  "6 × 2 = 12."
            ],
            "Only two numbers get written on a rectangle because the other two match. They still have to be added."
      ],
      [
            "Two shapes can cover the same number of squares and have different perimeters.",
            "Area is the space inside and perimeter is the distance round the edge, and they do not grow together.",
            [
                  "That cannot happen - same area always means same perimeter.",
                  "Only if one of them is a circle."
            ],
            "A long thin rectangle and a fat one can cover the same squares and have very different edges."
      ],
      [
            "A parallelogram has no line of symmetry.",
            "Folding it either way leaves the two halves not matching, even though the fold does make two equal pieces.",
            [
                  "It has none because it has four sides.",
                  "It has one straight down the middle."
            ],
            "Cutting into two equal pieces is not enough. The halves have to be mirror images."
      ],
      [
            "A square is also a rectangle.",
            "A rectangle is a four-sided shape with four right angles, and a square has those.",
            [
                  "They both have four sides.",
                  "A square is a smaller kind of rectangle."
            ],
            "Four sides alone would make a squashed diamond a rectangle too. It is the four right angles that decide it."
      ],
      [
            "A cube has 12 edges, not 6.",
            "An edge is where two faces meet, and the six faces meet along twelve lines.",
            [
                  "A cube has six faces, so it has six edges.",
                  "A cube is a solid shape."
            ],
            "Counting the faces and calling them edges is the usual slip. Hold a box and run a finger along one edge to see the difference."
      ]
];
    const host = document.getElementById("clW");
    if (!host) return;
    /* announce the result. Grade 3's shell marks every .fb and .score as a live
       region; Grade 1's does not, so the step does it for itself rather than
       depending on which shell it has been dropped into. */
    ["fbW", "scW", "clW"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    let got = 0, asked = 0, order = shuffle(BANK), qi = 0, live = false;
    function paint() {
      if (qi >= order.length) { order = shuffle(BANK); qi = 0; }
      const it = order[qi];
      document.getElementById("clW").textContent = it[0];
      document.getElementById("sayW").textContent = it[0] + " Which reason really explains it?";
      document.getElementById("chW").innerHTML = shuffle([it[1]].concat(it[2]))
        .map((o) => '<button type="button" class="choice word" data-v="' + esc(o) + '">' + esc(o) + "</button>").join("");
      document.getElementById("fbW").className = "fb";
      document.getElementById("fbW").textContent = "";
      live = true;
    }
    document.getElementById("chW").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = order[qi];
      const ok = b.dataset.v === it[1];
      [...document.getElementById("chW").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.v === it[1]) x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      asked++; if (ok) got++;
      const fb = document.getElementById("fbW");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not that one. ") + it[3];
      say(ok ? cheer() : it[3]);
      document.getElementById("scW").textContent = got + " right out of " + asked + (got >= 4 ? " - sticker earned!" : "");
      if (got >= 4) finish(SLOT, "");
      qi++;
      setTimeout(paint, 3400);
    });
    paint();
  })();

  show(0, false);
})();
</script>

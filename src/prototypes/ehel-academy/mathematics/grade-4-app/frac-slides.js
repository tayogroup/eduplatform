  /* ---- shared helpers ---- */
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const frac = (n, d) => '<span class="fr"><i>' + n + "</i><b>" + d + "</b></span>";
  const barHtml = (parts, shaded, cls) => {
    let h = "";
    for (let i = 0; i < parts; i++) h += '<i class="' + (i < shaded ? "on " : "") + (cls || "") + '"></i>';
    return h;
  };

  /* ---- 1: more parts, smaller parts (4Nf.01) ---- */
  let p1 = 4;
  const tried1 = new Set([4]);
  function paint1() {
    $("partsLab1").textContent = p1;
    $("bar1").innerHTML = barHtml(p1, 1);
    tried1.add(p1);
    const sizes = [...tried1].sort((a, b) => a - b);
    $("stack1").innerHTML = sizes.map((n) =>
      '<div class="srow2"><span class="slab">' + frac(1, n) + '</span><span class="sline"><i style="width:' +
      (100 / n).toFixed(2) + '%"></i></span></div>').join("");
    lines($("work1"), [
      { k: "The whole", v: "always the same bar, whatever you do to it" },
      { k: "Cut into " + p1, v: "each part is " + frac(1, p1) + " of it" },
      { k: "One part is", v: "<b>" + (100 % p1 === 0 ? String(100 / p1) : (100 / p1).toFixed(1)) + "%</b> of the bar" },
      { k: "So", v: "more parts means <b>smaller</b> parts, every time", total: true },
    ]);
    $("fb1").innerHTML = p1 === 2 ? "Two parts, and each one is half the bar — the biggest a part can be here."
      : frac(1, p1) + " is smaller than " + frac(1, p1 - 1) + ", because the same bar was cut into one more piece.";
    $("task1").textContent = "Sizes tried: " + sizes.length + " of 11";
    if (sizes.length >= 5) finish(0, "");
  }
  $("parts1").addEventListener("input", (e) => { p1 = Number(e.target.value); paint1(); });
  paint1();

  /* ---- 2: a fraction is a division (4Nf.02) ---- */
  let cakes2 = 1, kids2 = 4;
  $("pickCakes").innerHTML = [1, 3].map((c, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-c="' + c + '">' + c + (c === 1 ? " cake" : " cakes") + "</button>").join("");
  function paint2() {
    if (cakes2 === 3 && kids2 < 4) kids2 = 4;                 /* keeps the share a proper fraction */
    $("kids2").min = cakes2 === 3 ? 4 : 2;
    $("kids2").value = kids2;
    $("kidsLab2").textContent = kids2;
    let h = "";
    for (let c = 0; c < cakes2; c++) {
      let s = '<svg viewBox="0 0 100 100" class="cake">';
      for (let i = 0; i < kids2; i++) {
        const a0 = (i * 360 / kids2 - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / kids2 - 90) * Math.PI / 180;
        const big = 360 / kids2 > 180 ? 1 : 0;
        s += '<path class="' + (i === 0 ? "mine" : "") + '" d="M50,50 L' + (50 + 44 * Math.cos(a0)).toFixed(1) + "," +
          (50 + 44 * Math.sin(a0)).toFixed(1) + " A44,44 0 " + big + ",1 " + (50 + 44 * Math.cos(a1)).toFixed(1) + "," +
          (50 + 44 * Math.sin(a1)).toFixed(1) + ' Z"></path>';
      }
      h += s + "</svg>";
    }
    $("cakes2").innerHTML = h;
    const g = gcd(cakes2, kids2), simp = g > 1 ? frac(cakes2 / g, kids2 / g) : null;
    lines($("work2"), [
      { k: "To share", v: cakes2 + (cakes2 === 1 ? " cake" : " cakes") + " between " + kids2 + " children" },
      { k: "Cut each cake", v: "into " + kids2 + " equal slices, and give everyone one slice from each" },
      { k: "Each child gets", v: cakes2 + " slice" + (cakes2 === 1 ? "" : "s") + ", and each slice is " + frac(1, kids2) },
      { k: "Which is", v: cakes2 + " ÷ " + kids2 + " = <b>" + frac(cakes2, kids2) + "</b>" + (simp ? ", the same as " + simp : ""), total: true },
    ]);
    $("fb2").innerHTML = "The shaded slices are one child's share: " + frac(cakes2, kids2) + " of a cake.";
    $("task2").textContent = "The top number is what you shared. The bottom number is how many ways.";
    if (cakes2 === 3) finish(1, "");
  }
  $("pickCakes").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-c]"); if (!b) return;
    cakes2 = Number(b.dataset.c);
    [...$("pickCakes").children].forEach((c) => c.classList.toggle("on", Number(c.dataset.c) === cakes2));
    paint2(); say(cakes2 + " divided by " + kids2);
  });
  $("kids2").addEventListener("input", (e) => { kids2 = Number(e.target.value); paint2(); });
  paint2();

  /* ---- 3: a unit fraction as an operator (4Nf.03) ---- */
  const UNITS3 = [2, 3, 4, 5, 10];
  let u3 = 4, m3 = 5;
  $("pickUnit").innerHTML = UNITS3.map((k) => '<button type="button" class="chip' + (k === 4 ? " on" : "") +
    '" data-k="' + k + '">' + frac(1, k) + "</button>").join("");
  function paint3() {
    const amount = u3 * m3;
    $("amtLab3").textContent = amount;
    $("amt3").value = m3;
    let h = "";
    for (let g = 0; g < u3; g++) {
      h += '<div class="g3' + (g === 0 ? " mine" : "") + '">';
      for (let i = 0; i < m3; i++) h += "<i></i>";
      h += "</div>";
    }
    $("groups3").innerHTML = h;
    lines($("work3"), [
      { k: "The instruction", v: frac(1, u3) + " of " + amount },
      { k: "Make the groups", v: "share " + amount + " into <b>" + u3 + "</b> equal groups" },
      { k: "Each group has", v: amount + " ÷ " + u3 + " = <b>" + m3 + "</b>" },
      { k: "Take one group", v: "so " + frac(1, u3) + " of " + amount + " = <b>" + m3 + "</b>", total: true },
    ]);
    $("fb3").innerHTML = "The shaded group is " + frac(1, u3) + " of " + amount + ", which is <b>" + m3 + "</b>.";
    $("task3").textContent = "The bottom number tells you how many groups to make.";
    if (m3 !== 5 || u3 !== 4) finish(2, "");
  }
  $("pickUnit").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    u3 = Number(b.dataset.k);
    [...$("pickUnit").children].forEach((c) => c.classList.toggle("on", Number(c.dataset.k) === u3));
    paint3(); say("One " + (u3 === 2 ? "half" : u3 === 3 ? "third" : u3 === 4 ? "quarter" : u3 === 5 ? "fifth" : "tenth") + " of " + u3 * m3);
  });
  $("amt3").addEventListener("input", (e) => { m3 = Number(e.target.value); paint3(); });
  paint3();

  /* ---- 4: equivalent fractions (4Nf.04) ---- */
  const EQ = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]];
  let eq4 = 0;
  $("pickEq").innerHTML = EQ.map((f, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + frac(f[0], f[1]) + "</button>").join("");
  function family(n, d) {
    const out = [];
    for (let k = 1; k * d <= 12; k++) out.push([n * k, d * k]);
    return out;
  }
  function paint4() {
    const f = EQ[eq4], fam = family(f[0], f[1]);
    $("eq4").innerHTML = fam.map((g) =>
      '<div class="eqrow"><span class="slab">' + frac(g[0], g[1]) + '</span><span class="eqbar">' +
      barHtml(g[1], g[0]) + "</span></div>").join("");
    lines($("work4"), [
      { k: "Start with", v: frac(f[0], f[1]) },
      { k: "Cut each part in two", v: "twice as many parts, and twice as many shaded — " + frac(f[0] * 2, f[1] * 2) },
      { k: "Nothing moved", v: "the shaded length is identical in every bar above" },
      { k: "So", v: fam.map((g) => frac(g[0], g[1])).join(" = "), total: true },
    ]);
    $("fb4").innerHTML = "All " + fam.length + " of these are <b>equivalent</b> — different names for the same amount.";
    $("task4").textContent = "Multiply top and bottom by the same number and the value cannot change.";
    if (eq4 > 0) finish(3, "");
  }
  $("pickEq").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    eq4 = Number(b.dataset.i);
    [...$("pickEq").children].forEach((c, i) => c.classList.toggle("on", i === eq4));
    paint4(); say($("fb4").textContent);
  });
  paint4();

  /* ---- 5: percentages (4Nf.06) ---- */
  let n5 = 25;
  function paint5() {
    $("pctLab5").textContent = n5;
    let h = "";
    for (let i = 0; i < 100; i++) h += '<i class="' + (i < n5 ? "on" : "") + '"></i>';
    $("hund5").innerHTML = h;
    const g = gcd(n5, 100) || 1, sn = n5 / g, sd = 100 / g;
    $("reads5").innerHTML =
      '<div class="read3"><span class="r3lab">Fraction</span><b>' + frac(n5, 100) + "</b></div>" +
      '<div class="read3 hero3"><span class="r3lab">Percentage</span><b>' + n5 + "%</b></div>";
    lines($("work5"), [
      { k: "Squares shaded", v: "<b>" + n5 + "</b> out of 100" },
      { k: "As a fraction", v: frac(n5, 100) + (n5 > 0 && g > 1 ? ", which is the same as " + frac(sn, sd) : "") },
      { k: "The sign", v: "<b>%</b> means <b>out of a hundred</b>, so " + n5 + " out of 100 is written <b>" + n5 + "%</b>" },
      { k: "Say it", v: "&ldquo;" + n5 + " per cent&rdquo;", total: true },
    ]);
    $("fb5").innerHTML = n5 === 0 ? "Nothing shaded at all — that is <b>0%</b>."
      : n5 === 100 ? "Every square shaded — the whole thing, <b>100%</b>."
      : "<b>" + n5 + "%</b> of the square is shaded, and " + (100 - n5) + "% is not.";
    $("task5").textContent = "Try 50, then 25, then 10 — the ones worth knowing by heart.";
    if (n5 !== 25) finish(4, "");
  }
  $("pct5").addEventListener("input", (e) => { n5 = Number(e.target.value); paint5(); });
  paint5();

  /* ---- 6: comparing with equivalence (4Nf.07) ---- */
  const PAIRS = shuffle([
    [[1, 2], [2, 4]], [[1, 3], [1, 4]], [[2, 5], [3, 10]], [[3, 4], [5, 8]],
    [[2, 6], [1, 3]], [[3, 5], [7, 10]], [[1, 2], [5, 8]], [[2, 3], [3, 4]],
  ]);
  let c6 = 0, right6 = 0, lock6 = false;
  const SIGNS = [">", "<", "="];
  function paint6() {
    lock6 = false;
    $("fb6").textContent = ""; $("fb6").className = "fb";
    if (c6 >= PAIRS.length) {
      $("cmp6").innerHTML = "";
      $("signs6").innerHTML = "";
      $("work6").innerHTML = "";
      $("task6").textContent = right6 + " of " + PAIRS.length + " right.";
      if (right6 >= 6) finish(5, "");
      return;
    }
    const [A, B] = PAIRS[c6];
    $("cmp6").innerHTML =
      '<div class="cmpside"><span class="slab">' + frac(A[0], A[1]) + '</span><span class="eqbar">' + barHtml(A[1], A[0]) + "</span></div>" +
      '<div class="cmpside"><span class="slab">' + frac(B[0], B[1]) + '</span><span class="eqbar">' + barHtml(B[1], B[0]) + "</span></div>";
    $("signs6").innerHTML = SIGNS.map((s) => '<button type="button" class="choice sign" data-s="' + s + '">' + s + "</button>").join("");
    $("work6").innerHTML = "";
    $("task6").textContent = "Pair " + (c6 + 1) + " of " + PAIRS.length + " · " + right6 + " right";
  }
  $("signs6").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock6) return;
    lock6 = true;
    const [A, B] = PAIRS[c6];
    const lcm = (A[1] * B[1]) / gcd(A[1], B[1]);
    const a2 = A[0] * (lcm / A[1]), b2 = B[0] * (lcm / B[1]);
    const truth = a2 > b2 ? ">" : a2 < b2 ? "<" : "=";
    const ok = b.dataset.s === truth;
    if (ok) right6++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work6"), [
      { k: "Same bottom number", v: "both can be written in " + lcm + "ths" },
      { k: "Rewrite them", v: frac(A[0], A[1]) + " = " + frac(a2, lcm) + " and " + frac(B[0], B[1]) + " = " + frac(b2, lcm) },
      { k: "Now compare the tops", v: a2 + " " + truth + " " + b2 },
      { k: "So", v: frac(A[0], A[1]) + " <b>" + truth + "</b> " + frac(B[0], B[1]), total: true },
    ]);
    $("fb6").innerHTML = (ok ? cheer() + " " : "Not quite. ") + "In " + lcm + "ths they are " + a2 + " and " + b2 + ".";
    $("fb6").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "In " + lcm + "ths they are " + a2 + " and " + b2);
    c6++;
    setTimeout(paint6, 3000);
  });
  paint6();

  /* ---- 7: adding and subtracting, estimate first (4Nf.05) ---- */
  const BANDS = [["less", "less than a half"], ["about", "about a half"], ["more", "more than a half"]];
  let s7 = null, done7 = 0, lock7 = false;
  function newSum() {
    for (let tries = 0; tries < 200; tries++) {
      const d = [4, 5, 6, 8, 10][rnd(0, 4)];
      const plus = rnd(0, 1) === 1;
      let a, b, r;
      if (plus) { a = rnd(1, d - 2); b = rnd(1, d - 1 - a); r = a + b; }
      else { a = rnd(2, d - 1); b = rnd(1, a - 1); r = a - b; }
      if (r <= 0 || r >= d) continue;
      const v = r / d;
      const band = v < 0.5 ? "less" : v === 0.5 ? "about" : "more";
      if (v > 0.4 && v < 0.5) continue;          /* keep every answer clearly in one band */
      if (v > 0.5 && v < 0.6) continue;
      return { d: d, a: a, b: b, plus: plus, r: r, band: band };
    }
    return { d: 4, a: 1, b: 2, plus: true, r: 3, band: "more" };
  }
  function paint7() {
    lock7 = false;
    $("sum7").innerHTML = frac(s7.a, s7.d) + (s7.plus ? " + " : " − ") + frac(s7.b, s7.d) + " = ?";
    $("est7").innerHTML = BANDS.map((b) => '<button type="button" class="choice" data-b="' + b[0] + '">' + b[1] + "</button>").join("");
    $("bar7").innerHTML = "";
    $("work7").innerHTML = "";
    $("fb7").textContent = ""; $("fb7").className = "fb";
    $("task7").textContent = "Estimated " + done7 + " so far";
  }
  $("est7").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock7) return;
    lock7 = true;
    const ok = b.dataset.b === s7.band;
    b.classList.add(ok ? "right" : "wrong");
    done7++;
    $("bar7").innerHTML = barHtml(s7.d, s7.r);
    const g = gcd(s7.r, s7.d), simp = g > 1 ? frac(s7.r / g, s7.d / g) : null;
    lines($("work7"), [
      { k: "Same bottom number", v: "so every piece is the same size — " + frac(1, s7.d) },
      { k: "Count the pieces", v: s7.a + (s7.plus ? " + " : " − ") + s7.b + " = <b>" + s7.r + "</b> of them" },
      { k: "The answer", v: "<b>" + frac(s7.r, s7.d) + "</b>" + (simp ? ", the same as " + simp : "") },
      { k: "Against a half", v: frac(s7.r, s7.d) + " is " + BANDS.filter((x) => x[0] === s7.band)[0][1], total: true },
    ]);
    $("fb7").innerHTML = (ok ? cheer() + " " : "Close. ") + "The answer is " + frac(s7.r, s7.d) + ", which is " +
      BANDS.filter((x) => x[0] === s7.band)[0][1] + ".";
    $("fb7").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : $("fb7").textContent);
    if (done7 >= 3) finish(6, "");
  });
  $("new7").addEventListener("click", () => { s7 = newSum(); paint7(); });
  s7 = newSum(); paint7();

  /* ---- 8: check ---- */
  const Q8 = shuffle([
    { q: "Which is the bigger piece, a fifth or an eighth of the same cake?", o: ["A fifth", "An eighth", "They are the same"], a: 0, w: "Cutting into 5 makes bigger pieces than cutting into 8, because the cake is shared fewer ways." },
    { q: "Two cakes shared fairly between 8 children. How much does each child get?", o: ["A quarter", "An eighth", "A half"], a: 0, w: "2 ÷ 8 = two eighths, and two eighths is the same as one quarter." },
    { q: "What is a quarter of 24?", o: ["6", "4", "8"], a: 0, w: "Make 4 equal groups: 24 ÷ 4 = 6 in each, and one group is the quarter." },
    { q: "Which fraction is equivalent to three quarters?", o: ["Six eighths", "Four fifths", "Three eighths"], a: 0, w: "Multiply top and bottom by 2: 3 × 2 = 6 and 4 × 2 = 8, so three quarters is six eighths." },
    { q: "37 squares of a hundred square are shaded. What percentage is that?", o: ["37%", "3.7%", "63%"], a: 0, w: "Per cent means out of a hundred, so 37 out of 100 is simply 37%." },
    { q: "Which sign belongs between two thirds and three quarters?", o: ["<", ">", "="], a: 0, w: "In twelfths they are eight twelfths and nine twelfths, so two thirds is the smaller." },
    { q: "What is three fifths add one fifth?", o: ["Four fifths", "Four tenths", "Three fifths"], a: 0, w: "The pieces are the same size, so just count them: 3 fifths and 1 more fifth is 4 fifths." },
    { q: "Half of a hundred square is shaded. Which of these is NOT another name for it?", o: ["5%", "50%", "Fifty hundredths"], a: 0, w: "A half is 50 out of 100, so 50%. 5% would be only five squares." },
  ]);
  let c8 = 0, right8 = 0, lock8 = false;
  function round8() {
    lock8 = false;
    $("fb8").textContent = ""; $("fb8").className = "fb";
    if (c8 >= Q8.length) {
      $("stem8").textContent = "That is all of them.";
      $("choices8").innerHTML = "";
      $("score8").textContent = right8 + " out of " + Q8.length + " right.";
      if (right8 >= 6) finish(7, "");
      else retryCheck($("fb8"), $("choices8"), right8, Q8.length, 6, function () { c8 = 0; right8 = 0; round8(); });
      return;
    }
    $("stem8").textContent = Q8[c8].q;
    const order = shuffle(Q8[c8].o.map((t, i) => ({ t: t, ok: i === Q8[c8].a })));
    $("choices8").innerHTML = order.map((o) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("score8").textContent = "Question " + (c8 + 1) + " of " + Q8.length + " · " + right8 + " right";
  }
  $("choices8").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock8) return;
    lock8 = true;
    const ok = b.dataset.ok === "1";
    if (ok) right8++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb8").textContent = (ok ? cheer() + " " : "") + Q8[c8].w;
    $("fb8").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q8[c8].w);
    c8++;
    setTimeout(round8, 2400);
  });
  round8();

  /* ---- 9: stickers ---- */
  const STICKERS = [["🍰", "More parts, smaller parts"], ["➗", "A fraction is a division"], ["🍪", "A fraction of an amount"],
    ["🏷️", "Same value, different name"], ["💯", "Out of a hundred"], ["⚖️", "Which is bigger?"],
    ["➕", "Adding and taking away"], ["✅", "Show what I know"]];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span>' + s[0] + "</span><b>" + s[1] + "</b></div>").join("");
  }
  $("again").addEventListener("click", () => { show(0, true); });

  show(0, false);

  /* ---- your turn: the five slides that only demonstrated ---- */

  /* 1 (4Nf.01) the whole point of the slide: more parts means smaller parts, so the
     BIGGEST unit fraction is the one with the smallest denominator. */
  ask(1, () => {
    const ds = shuffle([2, 3, 4, 5, 6, 8, 10, 12]).slice(0, 3);
    const best = Math.min.apply(null, ds);
    return { stem: "Which of these is the <b>biggest</b> piece?",
      opts: ds.map((d) => frac(1, d)), ans: ds.indexOf(best),
      why: "Cutting the same whole into fewer parts makes each part bigger, so <b>1 over " +
        best + "</b> is the largest." };
  });

  /* 2 (4Nf.02) a fraction IS a division. The reversed fraction is the distractor
     because it is the error the slide exists to prevent. */
  ask(2, () => {
    const b = rnd(3, 8), a = rnd(2, b - 1);
    const q = shuffle([frac(a, b), frac(b, a), frac(1, b)]);
    return { stem: "<b>" + a + " cakes</b> are shared equally between <b>" + b +
        " children</b>. How much does each child get?",
      opts: q, ans: q.indexOf(frac(a, b)),
      why: a + " ÷ " + b + " is written <b>" + a + " over " + b + "</b> — the number being " +
        "shared goes on top." };
  });

  /* 3 (4Nf.03) a unit fraction as an operator. Totals are chosen to divide exactly. */
  ask(3, () => {
    const d = [2, 3, 4, 5, 6][rnd(0, 4)], tot = d * rnd(3, 9), n = tot / d;
    const opts = pick3(n, [tot - d, d, tot - n]);
    return { stem: "What is " + frac(1, d) + " of <b>" + tot + "</b>?",
      opts: opts.map(String), ans: opts.indexOf(n),
      why: "One part out of " + d + " equal parts: " + tot + " ÷ " + d + " = <b>" + n + "</b>." };
  });

  /* 4 (4Nf.04) equivalence. The distractors add to both parts instead of multiplying,
     and scale only the bottom -- the two things children actually do. */
  ask(4, () => {
    const b = rnd(2, 6), a = rnd(1, b - 1), k = rnd(2, 4);
    const q = shuffle([frac(a * k, b * k), frac(a + k, b + k), frac(a, b * k)]);
    return { stem: "Which fraction is equal to " + frac(a, b) + "?",
      opts: q, ans: q.indexOf(frac(a * k, b * k)),
      why: "Multiply <b>both</b> numbers by " + k + ": " + a + " × " + k + " = " + a * k +
        " and " + b + " × " + k + " = " + b * k + ". Adding to both would change the value." };
  });

  /* 5 (4Nf.06) per cent means out of a hundred, so the shaded count IS the percentage.
     The distractor is the unshaded remainder. */
  ask(5, () => {
    const n = rnd(5, 95);
    const opts = pick3(n, [100 - n, Math.round(n / 10), n + 10]);
    return { stem: "<b>" + n + "</b> of the 100 squares are shaded. What percentage is shaded?",
      opts: opts.map((v) => v + "%"), ans: opts.indexOf(n),
      why: "Per cent means <b>out of a hundred</b>, so " + n + " out of 100 is <b>" + n + "%</b>." };
  });

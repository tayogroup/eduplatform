  /* the shell's fmt() leaves a plain hyphen, so this lesson supplies the typographic
     minus it uses for negatives throughout — it is NOT one of the shell's helpers */
  const minus = (t) => String(t).replace("-", "−");
  const fmtn = (n) => minus(fmt(n));

  /* ---- number names, written out once and used by several slides ---- */
  const WORD_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const WORD_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function under100(n) {
    if (n < 20) return WORD_ONES[n];
    const t = Math.floor(n / 10), o = n % 10;
    return WORD_TENS[t] + (o ? "-" + WORD_ONES[o] : "");
  }
  function under1000(n) {
    if (n < 100) return under100(n);
    const h = Math.floor(n / 100), r = n % 100;
    return WORD_ONES[h] + " hundred" + (r ? " and " + under100(r) : "");
  }
  function numWords(n) {
    if (n < 0) return "negative " + numWords(-n);
    if (n < 1000) return under1000(n);
    const th = Math.floor(n / 1000), r = n % 1000;
    return under1000(th) + " thousand" + (r ? (r < 100 ? " and " : " ") + under1000(r) : "");
  }

  /* ---- 1: reading and writing number names (4Ni.01) ---- */
  const N1 = [4207, 15060, 903, -12, -350, 87415];
  let i1 = 0;
  const seen1 = new Set([0]);
  $("pickN1").innerHTML = N1.map((n, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + fmtn(n) + "</button>").join("");
  function paint1() {
    const n = N1[i1], neg = n < 0, a = Math.abs(n);
    $("num1").textContent = fmtn(n);
    $("words1").textContent = numWords(n);
    const th = Math.floor(a / 1000), r = a % 1000;
    lines($("work1"), [
      { k: "Thousands", v: th ? "<b>" + fmt(th) + "</b> thousand — " + under1000(th) + " thousand" : "none" },
      { k: "The rest", v: r ? "<b>" + r + "</b> — " + under1000(r) : "nothing left over" },
      { k: neg ? "Below zero" : "Put together", v: neg ? "the minus sign is read as <b>negative</b>, before the name" : "read the thousands, then the rest" },
      { k: "So it is", v: "<b>" + numWords(n) + "</b>", total: true },
    ]);
    $("fb1").innerHTML = fmtn(n) + " is <b>" + numWords(n) + "</b>.";
    seen1.add(i1);
    $("task1").textContent = "Read " + seen1.size + " of " + N1.length;
    if (seen1.size >= 4) finish(0, "");
  }
  $("pickN1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    i1 = Number(b.dataset.i);
    [...$("pickN1").children].forEach((c, i) => c.classList.toggle("on", i === i1));
    paint1(); say(numWords(N1[i1]));
  });
  paint1();

  /* ---- 2: odd, even and what adding them does (4Nc.02) ---- */
  let a2 = 7, b2 = 5;
  const par = (n) => (n % 2 === 0 ? "even" : "odd");
  function row2(n, cls) {
    let h = '<div class="prow2"><span class="pn">' + n + '</span><span class="pdots">';
    for (let i = 0; i < Math.floor(n / 2); i++) h += '<i class="pair ' + cls + '"></i>';
    if (n % 2) h += '<i class="odd1 ' + cls + '"></i>';
    return h + '</span><span class="ptag ' + par(n) + '">' + par(n) + "</span></div>";
  }
  function paint2() {
    $("aLab2").textContent = a2;
    $("bLab2").textContent = b2;
    const s = a2 + b2;
    $("pair2").innerHTML = row2(a2, "t1") + row2(b2, "t2") + '<div class="plus2">+</div>' + row2(s, "t3");
    const leftovers = (a2 % 2) + (b2 % 2);
    lines($("work2"), [
      { k: "First number", v: a2 + " pairs up with " + (a2 % 2 ? "<b>one left over</b>, so it is odd" : "<b>nothing left over</b>, so it is even") },
      { k: "Second number", v: b2 + " pairs up with " + (b2 % 2 ? "<b>one left over</b>, so it is odd" : "<b>nothing left over</b>, so it is even") },
      { k: "Put together", v: leftovers === 0 ? "no leftovers at all, so the total pairs up exactly"
        : leftovers === 1 ? "one leftover with nothing to join, so it is still there"
        : "<b>two</b> leftovers, and those two make a pair of their own" },
      { k: "The rule", v: par(a2) + " + " + par(b2) + " = <b>" + par(s) + "</b>, and it works for every pair you try", total: true },
    ]);
    $("fb2").innerHTML = a2 + " + " + b2 + " = <b>" + s + "</b>, which is <b>" + par(s) + "</b>.";
    $("task2").textContent = "Try odd + odd, even + even, and one of each.";
    if (leftovers === 2) finish(1, "");
  }
  $("a2").addEventListener("input", (e) => { a2 = Number(e.target.value); paint2(); });
  $("b2").addEventListener("input", (e) => { b2 = Number(e.target.value); paint2(); });
  paint2();

  /* ---- 3: a shape for an unknown quantity (4Nc.03) ---- */
  const SHAPES3 = ["▲", "■", "●", "◆"];
  let p3 = null, lock3 = false, done3 = 0;
  function newUnknown() {
    const plus = rnd(0, 1) === 1;
    const sh = SHAPES3[rnd(0, 3)];
    if (plus) { const a = rnd(12, 60), x = rnd(8, 40); return { sh: sh, a: a, x: x, tot: a + x, plus: true }; }
    const tot = rnd(40, 90), x = rnd(8, 30);
    return { sh: sh, a: tot - x, x: x, tot: tot, plus: false };
  }
  function paint3() {
    lock3 = false;
    const P = p3;
    $("eq3").innerHTML = P.plus
      ? P.a + " + <span class='unk'>" + P.sh + "</span> = " + P.tot
      : P.tot + " − <span class='unk'>" + P.sh + "</span> = " + P.a;
    /* percentages, not pixels: the wrapper has a border, so pixel widths would not add up to it */
    $("bar3").innerHTML = '<div class="bwhole">' +
      '<span class="bpart known" style="width:' + ((P.a / P.tot) * 100).toFixed(3) + '%">' + P.a + "</span>" +
      '<span class="bpart unknownp" style="width:' + ((P.x / P.tot) * 100).toFixed(3) + '%">' + P.sh + "</span></div>" +
      '<div class="btot">' + P.tot + " altogether</div>";
    const opts = shuffle([P.x, P.x + rnd(2, 9), Math.max(1, P.x - rnd(2, 9))]);
    $("opts3").innerHTML = opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("work3").innerHTML = "";
    $("fb3").textContent = ""; $("fb3").className = "fb";
    $("task3").textContent = "Solved " + done3 + " so far";
  }
  $("opts3").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock3) return;
    lock3 = true;
    const P = p3, ok = Number(b.dataset.v) === P.x;
    if (ok) done3++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work3"), [
      { k: "What is known", v: P.plus ? P.a + " and the total " + P.tot : "the total " + P.tot + " and what is left, " + P.a },
      { k: "The shape stands for", v: "the part nobody has told you" },
      { k: "Undo the sum", v: P.plus ? P.tot + " − " + P.a + " = <b>" + P.x + "</b>" : P.tot + " − " + P.a + " = <b>" + P.x + "</b>" },
      { k: "Check it", v: P.plus ? P.a + " + " + P.x + " = " + P.tot + " ✓" : P.tot + " − " + P.x + " = " + P.a + " ✓", total: true },
    ]);
    $("fb3").innerHTML = (ok ? cheer() + " " : "") + "The " + P.sh + " is <b>" + P.x + "</b>.";
    $("fb3").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "It is " + P.x);
    if (done3 >= 3) finish(2, "");
  });
  $("new3").addEventListener("click", () => { p3 = newUnknown(); paint3(); });
  p3 = newUnknown(); paint3();

  /* ---- 4: linear and non-linear sequences (4Nc.04) ---- */
  const SEQS = [
    { name: "Add 6", t: [4, 10, 16, 22, 28], next: 34, kind: "linear", rule: "add 6 every time" },
    { name: "Subtract 9", t: [70, 61, 52, 43, 34], next: 25, kind: "linear", rule: "subtract 9 every time" },
    { name: "Double", t: [3, 6, 12, 24, 48], next: 96, kind: "non-linear", rule: "double every time" },
    { name: "Growing steps", t: [1, 3, 6, 10, 15], next: 21, kind: "non-linear", rule: "add 2, then 3, then 4, then 5 — a bigger step each time" },
  ];
  let s4 = 0, lock4 = false, got4 = 0;
  $("pickSeq").innerHTML = SEQS.map((s, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + s.name + "</button>").join("");
  function paint4() {
    lock4 = false;
    const S = SEQS[s4];
    let h = "";
    S.t.forEach((v, i) => {
      if (i) { const d = S.t[i] - S.t[i - 1]; h += '<span class="step">' + (d > 0 ? "+" : "−") + Math.abs(d) + "</span>"; }
      h += '<span class="term4">' + v + "</span>";
    });
    h += '<span class="step">?</span><span class="term4 ghost4">?</span>';
    $("seq4").innerHTML = h;
    const opts = shuffle([S.next, S.next + rnd(2, 8), Math.max(1, S.next - rnd(2, 8))]);
    $("next4").innerHTML = opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("work4").innerHTML = "";
    $("fb4").textContent = ""; $("fb4").className = "fb";
    $("task4").textContent = "Rules found: " + got4 + " of " + SEQS.length;
  }
  $("pickSeq").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    s4 = Number(b.dataset.i);
    [...$("pickSeq").children].forEach((c, i) => c.classList.toggle("on", i === s4));
    paint4();
  });
  $("next4").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock4) return;
    lock4 = true;
    const S = SEQS[s4], ok = Number(b.dataset.v) === S.next;
    if (ok) got4++;
    b.classList.add(ok ? "right" : "wrong");
    const steps = S.t.slice(1).map((v, i) => v - S.t[i]);
    lines($("work4"), [
      { k: "The steps", v: steps.map((d) => (d > 0 ? "+" : "−") + Math.abs(d)).join(", ") },
      { k: "Are they the same?", v: S.kind === "linear" ? "<b>yes</b> — the same step every time" : "<b>no</b> — the step keeps changing" },
      { k: "So it is", v: "<b>" + S.kind + "</b>" },
      { k: "Term-to-term rule", v: "<b>" + S.rule + "</b>, so the next term is <b>" + S.next + "</b>", total: true },
    ]);
    $("fb4").innerHTML = (ok ? cheer() + " " : "") + "The next term is <b>" + S.next + "</b>.";
    $("fb4").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "The next term is " + S.next);
    $("task4").textContent = "Rules found: " + got4 + " of " + SEQS.length;
    if (got4 >= 3) finish(3, "");
  });
  paint4();

  /* ---- 5: the spatial pattern of square numbers (4Nc.05) ---- */
  let sq5 = 4;
  function paint5() {
    $("sqLab5").textContent = sq5;
    let h = "";
    for (let y = 0; y < sq5; y++) { h += '<div class="sqrow">';
      for (let x = 0; x < sq5; x++) h += '<i class="' + (x === sq5 - 1 || y === sq5 - 1 ? "edge" : "") + '"></i>';
      h += "</div>"; }
    $("sq5box").innerHTML = h;
    const sq = sq5 * sq5, prev = (sq5 - 1) * (sq5 - 1), added = sq - prev;
    lines($("work5"), [
      { k: "The square", v: sq5 + " rows of " + sq5 },
      { k: "How many dots", v: sq5 + " × " + sq5 + " = <b>" + sq + "</b>" },
      { k: "Written as", v: "<b>" + sq5 + "&sup2;</b>, said &ldquo;" + sq5 + " squared&rdquo;" },
      { k: sq5 === 1 ? "The first one" : "Added since the last", v: sq5 === 1 ? "one dot, and 1 × 1 = 1"
        : "the shaded L along two sides: <b>" + added + "</b> dots, and " + added + " is always <b>odd</b>", total: true },
    ]);
    $("fb5").innerHTML = "The square numbers run 1, 4, 9, 16, 25 — and the gaps between them are 3, 5, 7, 9, the <b>odd numbers</b>.";
    $("task5").textContent = "Each new square adds a strip down one side, along the bottom and one corner.";
    if (sq5 >= 5) finish(4, "");
  }
  $("sq5").addEventListener("input", (e) => { sq5 = Number(e.target.value); paint5(); });
  paint5();

  /* ---- 6: estimating before calculating (4Ni.02, 4Ni.05, 4Ni.06) ---- */
  const EMODE = ["Add or subtract", "Multiply", "Divide"];
  let em6 = 0, e6 = null, lock6 = false, done6 = 0;
  $("pickEst").innerHTML = EMODE.map((m, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + m + "</button>").join("");
  const round10 = (n) => Math.round(n / 10) * 10;
  const round100 = (n) => Math.round(n / 100) * 100;
  /* every generator is constrained so the ESTIMATE is a useful number rather than 0 */
  function newEst() {
    if (em6 === 0) {
      const plus = rnd(0, 1) === 1;
      if (plus) {
        const a = rnd(120, 880), b = rnd(110, 480);
        return { kind: 0, a: a, b: b, plus: true, exact: a + b, est: round100(a) + round100(b) };
      }
      const b = rnd(110, 380), a = b + rnd(160, 520);       /* a big enough gap that rounding cannot collapse it */
      return { kind: 0, a: a, b: b, plus: false, exact: a - b, est: round100(a) - round100(b) };
    }
    if (em6 === 1) {
      const a = rnd(112, 960), b = rnd(3, 9);
      return { kind: 1, a: a, b: b, exact: a * b, est: round100(a) * b };
    }
    const b = rnd(3, 8), q = rnd(4, 12), a = Math.min(99, b * q + rnd(0, b - 1));
    return { kind: 2, a: a, b: b, exact: Math.floor(a / b), rem: a % b, est: Math.round(round10(a) / b) };
  }
  function paint6() {
    lock6 = false;
    const E = e6;
    $("sum6").innerHTML = E.kind === 0 ? fmt(E.a) + (E.plus ? " + " : " − ") + fmt(E.b)
      : E.kind === 1 ? fmt(E.a) + " × " + E.b : fmt(E.a) + " ÷ " + E.b;
    const spread = E.kind === 2 ? 3 : E.kind === 1 ? Math.max(40, Math.round(E.est * 0.25)) : 100;
    const opts = shuffle([E.est, E.est + spread, Math.max(1, E.est - spread)]);
    $("est6").innerHTML = opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + fmt(o) + "</button>").join("");
    $("work6").innerHTML = "";
    $("fb6").textContent = ""; $("fb6").className = "fb";
    $("task6").textContent = "Estimated " + done6 + " so far";
  }
  $("est6").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock6) return;
    lock6 = true; done6++;
    const E = e6, ok = Number(b.dataset.v) === E.est;
    b.classList.add(ok ? "right" : "wrong");
    const rows = E.kind === 0 ? [
      { k: "Round them", v: fmt(E.a) + " ≈ " + fmt(round100(E.a)) + " and " + fmt(E.b) + " ≈ " + fmt(round100(E.b)) },
      { k: "Rough answer", v: fmt(round100(E.a)) + (E.plus ? " + " : " − ") + fmt(round100(E.b)) + " = <b>" + fmt(E.est) + "</b>" },
      { k: "Now exactly", v: fmt(E.a) + (E.plus ? " + " : " − ") + fmt(E.b) + " = <b>" + fmt(E.exact) + "</b>" },
      { k: "Close enough?", v: "the estimate was " + fmt(Math.abs(E.exact - E.est)) + " away, which tells you the exact answer is sensible", total: true },
    ] : E.kind === 1 ? [
      { k: "Round the big one", v: fmt(E.a) + " ≈ " + fmt(round100(E.a)) },
      { k: "Rough answer", v: fmt(round100(E.a)) + " × " + E.b + " = <b>" + fmt(E.est) + "</b>" },
      { k: "Now exactly", v: fmt(E.a) + " × " + E.b + " = <b>" + fmt(E.exact) + "</b>" },
      { k: "Close enough?", v: "off by " + fmt(Math.abs(E.exact - E.est)) + " — near enough to catch a wild mistake", total: true },
    ] : [
      { k: "Round the big one", v: fmt(E.a) + " ≈ " + fmt(round10(E.a)) },
      { k: "Rough answer", v: fmt(round10(E.a)) + " ÷ " + E.b + " ≈ <b>" + fmt(E.est) + "</b>" },
      { k: "Now exactly", v: fmt(E.a) + " ÷ " + E.b + " = <b>" + fmt(E.exact) + "</b>" + (E.rem ? " remainder " + E.rem : " exactly") },
      { k: "Close enough?", v: "the estimate lands within " + fmt(Math.abs(E.exact - E.est)) + " of it", total: true },
    ];
    lines($("work6"), rows);
    $("fb6").innerHTML = (ok ? cheer() + " " : "") + "About <b>" + fmt(E.est) + "</b>, and exactly <b>" + fmt(E.exact) +
      (E.kind === 2 && E.rem ? " remainder " + E.rem : "") + "</b>.";
    $("fb6").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "About " + E.est);
    if (done6 >= 3) finish(5, "");
  });
  $("pickEst").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    em6 = Number(b.dataset.i);
    [...$("pickEst").children].forEach((c, i) => c.classList.toggle("on", i === em6));
    e6 = newEst(); paint6();
  });
  $("new6").addEventListener("click", () => { e6 = newEst(); paint6(); });
  e6 = newEst(); paint6();

  /* ---- 7: all ten tables, and the associative property (4Ni.04, 4Ni.03) ---- */
  let tm7 = 0, q7 = null, lock7 = false, right7 = 0, asked7 = 0;
  const CHAINS = [
    { a: 4, b: 25, c: 3, easy: "b·a", why: "4 × 25 is 100, and 100 × 3 is easy." },
    { a: 2, b: 7, c: 50, easy: "a·c", why: "2 × 50 is 100, and 100 × 7 is easy." },
    { a: 5, b: 9, c: 20, easy: "a·c", why: "5 × 20 is 100, and 100 × 9 is easy." },
    { a: 8, b: 3, c: 5, easy: "a·c", why: "8 × 5 is 40, and 40 × 3 is easier than 24 × 5." },
  ];
  let ch7 = 0;
  $("pickTab").innerHTML = ["Times tables", "A shortcut"].map((m, i) =>
    '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + m + "</button>").join("");
  function newQ7() { const a = rnd(1, 10), b = rnd(1, 10); return { a: a, b: b, p: a * b }; }
  function paint7() {
    lock7 = false;
    $("tabWrap").hidden = tm7 !== 0;
    $("assocWrap").hidden = tm7 !== 1;
    $("work7").innerHTML = "";
    $("fb7").textContent = ""; $("fb7").className = "fb";
    if (tm7 === 0) {
      $("q7").innerHTML = q7.a + " × " + q7.b + " = ?";
      const opts = shuffle([q7.p, q7.p + q7.a, Math.max(1, q7.p - q7.b)]);
      $("ans7").innerHTML = opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
      $("task7").textContent = "Tables: " + right7 + " right of " + asked7;
    } else {
      const C = CHAINS[ch7];
      $("chain7").innerHTML = C.a + " × " + C.b + " × " + C.c + " = ?";
      $("group7").innerHTML = [
        { k: "a·b", t: "(" + C.a + " × " + C.b + ") × " + C.c },
        { k: "b·c", t: C.a + " × (" + C.b + " × " + C.c + ")" },
        { k: "a·c", t: "(" + C.a + " × " + C.c + ") × " + C.b },
      ].map((o) => '<button type="button" class="choice" data-k="' + o.k + '">' + o.t + "</button>").join("");
      $("task7").textContent = "Every grouping gives the same answer — one of them is easiest.";
    }
  }
  $("ans7").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock7) return;
    lock7 = true; asked7++;
    const ok = Number(b.dataset.v) === q7.p;
    if (ok) right7++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work7"), [
      { k: "The question", v: q7.a + " × " + q7.b },
      { k: "The answer", v: "<b>" + q7.p + "</b>" },
      { k: "It works both ways", v: q7.b + " × " + q7.a + " = <b>" + q7.p + "</b> as well" },
      { k: "Score", v: right7 + " right out of " + asked7, total: true },
    ]);
    $("fb7").innerHTML = (ok ? cheer() + " " : "") + q7.a + " × " + q7.b + " = <b>" + q7.p + "</b>.";
    $("fb7").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : q7.a + " times " + q7.b + " is " + q7.p);
    if (right7 >= 5) finish(6, "");
    setTimeout(() => { q7 = newQ7(); paint7(); }, 1900);
  });
  $("group7").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock7) return;
    lock7 = true;
    const C = CHAINS[ch7], ok = b.dataset.k === C.easy;
    const tot = C.a * C.b * C.c;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work7"), [
      { k: "All three groupings", v: "(" + C.a + "×" + C.b + ")×" + C.c + " = " + tot + ", " + C.a + "×(" + C.b + "×" + C.c + ") = " + tot + ", (" + C.a + "×" + C.c + ")×" + C.b + " = " + tot },
      { k: "So regrouping is safe", v: "the answer never changes — that is the <b>associative property</b>" },
      { k: "The easy one here", v: "<b>" + C.why + "</b>" },
      { k: "The answer", v: "<b>" + fmt(tot) + "</b>", total: true },
    ]);
    $("fb7").innerHTML = (ok ? cheer() + " " : "") + C.why + " The answer is <b>" + fmt(tot) + "</b>.";
    $("fb7").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : C.why);
    finish(6, "");
    ch7 = (ch7 + 1) % CHAINS.length;
    setTimeout(paint7, 2600);
  });
  $("pickTab").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    tm7 = Number(b.dataset.i);
    [...$("pickTab").children].forEach((c, i) => c.classList.toggle("on", i === tm7));
    paint7();
  });
  q7 = newQ7(); paint7();

  /* ---- 8: tests of divisibility (4Ni.08) ---- */
  const TESTS = [2, 5, 10, 25, 50, 100];
  const RULE = { 2: "the last digit is even", 5: "the last digit is 0 or 5", 10: "the last digit is 0",
    25: "the last two digits are 00, 25, 50 or 75", 50: "the last two digits are 00 or 50", 100: "the last two digits are 00" };
  let n8 = 0, tried8 = [];
  function newN8() {
    const pick = rnd(0, 3);
    if (pick === 0) return rnd(1, 40) * 25;
    if (pick === 1) return rnd(1, 20) * 50;
    if (pick === 2) return rnd(10, 99) * 10;
    return rnd(101, 999);
  }
  function paint8() {
    $("num8").textContent = fmt(n8);
    $("tests8").innerHTML = TESTS.map((t) => {
      const st = tried8.indexOf(t) >= 0 ? (n8 % t === 0 ? " right" : " wrong") : "";
      return '<button type="button" class="choice' + st + '" data-t="' + t + '">÷ ' + t + "</button>";
    }).join("");
    const last2 = fmt(n8).slice(-2);
    lines($("work8"), [
      { k: "The number", v: "<b>" + fmt(n8) + "</b>" },
      { k: "Its last digit", v: "<b>" + (n8 % 10) + "</b>" },
      { k: "Its last two digits", v: "<b>" + String(n8 % 100).padStart(2, "0") + "</b>" },
      { k: "Divides exactly by", v: TESTS.filter((t) => n8 % t === 0).map((t) => "<b>" + t + "</b>").join(", ") || "none of these", total: true },
    ]);
    $("task8").textContent = "Tested " + tried8.length + " of " + TESTS.length;
    if (tried8.length >= TESTS.length) finish(7, "");
  }
  $("tests8").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    const t = Number(b.dataset.t);
    if (tried8.indexOf(t) >= 0) return;
    tried8.push(t);
    const ok = n8 % t === 0;
    $("fb8").innerHTML = fmt(n8) + (ok ? " <b>does</b> divide by " + t : " does <b>not</b> divide by " + t) +
      " — the test is that " + RULE[t] + ".";
    $("fb8").className = "fb " + (ok ? "good" : "bad");
    say($("fb8").textContent);
    paint8();
  });
  $("new8").addEventListener("click", () => { n8 = newN8(); tried8 = []; $("fb8").textContent = ""; $("fb8").className = "fb"; paint8(); });
  n8 = newN8(); paint8();

  /* ---- 9: multiplying and dividing by 10 and 100, and rounding (4Np.02, 4Np.05) ---- */
  const OPS9 = [["× 10", 10, 1], ["× 100", 100, 1], ["÷ 10", 10, -1], ["÷ 100", 100, -1]];
  let o9 = 0, base9 = 3406;
  const COLS = ["100 000", "10 000", "1000", "100", "10", "1"];
  $("pickTen").innerHTML = OPS9.map((o, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") +
    '" data-i="' + i + '">' + o[0] + "</button>").join("");
  function digitsIn(n) {
    const s = String(Math.abs(n)).padStart(6, " ");
    return s.split("");
  }
  function paint9() {
    const O = OPS9[o9];
    const result = O[2] > 0 ? base9 * O[1] : base9 / O[1];
    const shift = (O[1] === 10 ? 1 : 2) * O[2];
    const rows = [["Start", base9], [O[0], result]];
    let h = '<div class="pvrow head">' + COLS.map((c) => "<span>" + c + "</span>").join("") + "<span></span></div>";
    rows.forEach((r) => {
      const ds = digitsIn(r[1]);
      h += '<div class="pvrow">' + ds.map((d) => '<span class="' + (d === " " ? "" : "d") + '">' + (d === " " ? "" : d) + "</span>").join("") +
        '<span class="rl">' + r[0] + "</span></div>";
    });
    $("pv9").innerHTML = h;
    const exact = Number.isInteger(result);
    lines($("work9"), [
      { k: "Start with", v: "<b>" + fmt(base9) + "</b>" },
      { k: O[0], v: "every digit moves <b>" + Math.abs(shift) + "</b> place" + (Math.abs(shift) === 1 ? "" : "s") + " to the <b>" + (shift > 0 ? "left" : "right") + "</b>" },
      { k: "The result", v: "<b>" + (exact ? fmt(result) : result) + "</b>" },
      { k: "Rounded", v: "to the nearest 10 000 that is <b>" + fmt(Math.round(result / 10000) * 10000) +
        "</b>, and to the nearest 100 000 it is <b>" + fmt(Math.round(result / 100000) * 100000) + "</b>", total: true },
    ]);
    $("fb9").innerHTML = fmt(base9) + " " + O[0] + " = <b>" + (exact ? fmt(result) : result) + "</b>.";
    $("task9").textContent = "The zero is not added — it fills the empty place the digits left behind.";
    if (o9 > 0) finish(8, "");
  }
  $("pickTen").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    o9 = Number(b.dataset.i);
    [...$("pickTen").children].forEach((c, i) => c.classList.toggle("on", i === o9));
    paint9(); say($("fb9").textContent);
  });
  paint9();

  /* ---- 10: comparing and ordering, including negatives (4Np.04) ---- */
  const PAIRS10 = shuffle([[-9, -2], [-5, 3], [0, -4], [-7, -7], [6, -6], [-1, -10], [-3, 0], [8, -8]]);
  let c10 = 0, right10 = 0, lock10 = false;
  function paint10() {
    lock10 = false;
    $("fb10").textContent = ""; $("fb10").className = "fb";
    $("work10").innerHTML = "";
    if (c10 >= PAIRS10.length) {
      $("cmp10").textContent = "That is all of them.";
      $("signs10").innerHTML = "";
      $("task10").textContent = right10 + " of " + PAIRS10.length + " right.";
      if (right10 >= 6) finish(9, "");
      return;
    }
    const [A, B] = PAIRS10[c10];
    let h = '<div class="nlbar"></div>';
    for (let v = -10; v <= 10; v++) {
      const x = ((v + 10) / 20) * 100;
      h += '<div class="nltick" style="left:' + x + '%"></div>';
      if (v % 5 === 0) h += '<div class="nllab" style="left:' + x + '%">' + minus(String(v)) + "</div>";
      /* when the two are equal they sit in the same place — draw ONE marker in both
         colours rather than stacking two, or the teal one appears to have vanished */
      if (A === B && v === A) h += '<div class="nlmark both" style="left:' + x + '%"></div>';
      else {
        if (v === A) h += '<div class="nlmark a" style="left:' + x + '%"></div>';
        if (v === B) h += '<div class="nlmark b" style="left:' + x + '%"></div>';
      }
    }
    $("nl10").innerHTML = h;
    $("cmp10").innerHTML = '<span class="cmpa">' + minus(String(A)) + '</span> ? <span class="cmpb">' + minus(String(B)) + "</span>";
    $("signs10").innerHTML = [">", "<", "="].map((s) => '<button type="button" class="choice sign10" data-s="' + s + '">' + s + "</button>").join("");
    $("task10").textContent = "Pair " + (c10 + 1) + " of " + PAIRS10.length + " · " + right10 + " right";
  }
  $("signs10").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock10) return;
    lock10 = true;
    const [A, B] = PAIRS10[c10];
    const truth = A > B ? ">" : A < B ? "<" : "=";
    const ok = b.dataset.s === truth;
    if (ok) right10++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("work10"), [
      { k: "On the line", v: A === B ? "both are in the same place" : minus(String(A > B ? A : B)) + " is further <b>right</b> than " + minus(String(A > B ? B : A)) },
      { k: "Further right means", v: "<b>bigger</b>, and that stays true below zero" },
      { k: "Careful", v: "&minus;9 is <b>smaller</b> than &minus;2, even though 9 is bigger than 2" },
      { k: "So", v: "<b>" + minus(String(A)) + " " + truth + " " + minus(String(B)) + "</b>", total: true },
    ]);
    $("fb10").innerHTML = (ok ? cheer() + " " : "") + minus(String(A)) + " " + truth + " " + minus(String(B)) + ".";
    $("fb10").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : "It is " + (truth === ">" ? "greater than" : truth === "<" ? "less than" : "equal to"));
    c10++;
    setTimeout(paint10, 2600);
  });
  paint10();

  /* ---- 11: check ---- */
  const Q11 = shuffle([
    { q: "How do you write 4,207 in words?", o: ["Four thousand two hundred and seven", "Four hundred and twenty-seven", "Forty thousand and seven"], a: 0, w: "Four thousand, then the rest: two hundred and seven." },
    { q: "An odd number added to an odd number always gives:", o: ["An even number", "An odd number", "It depends"], a: 0, w: "Each odd number has one counter left over. The two leftovers pair up with each other, so nothing is left." },
    { q: "If 38 + ▲ = 62, what is ▲?", o: ["24", "26", "100"], a: 0, w: "Undo the addition: 62 − 38 = 24." },
    { q: "3, 6, 12, 24 … is this linear or non-linear?", o: ["Non-linear", "Linear", "Neither"], a: 0, w: "The steps are +3, +6, +12 — they change every time, so it is not linear. The rule is to double." },
    { q: "Which of these is a square number?", o: ["49", "45", "50"], a: 0, w: "49 is 7 × 7, so its dots make a 7 by 7 square." },
    { q: "Roughly, what is 412 × 6?", o: ["About 2,400", "About 240", "About 24,000"], a: 0, w: "Round 412 to 400. 400 × 6 = 2,400, and the exact answer is 2,472." },
    { q: "Does 375 divide exactly by 25?", o: ["Yes", "No", "Only by 5"], a: 0, w: "The last two digits are 75, and 00, 25, 50 and 75 all divide by 25. In fact 375 = 25 × 15." },
    { q: "What is 3,406 × 100?", o: ["340,600", "34,060", "3,406,00"], a: 0, w: "Every digit moves two places left, and two zeros fill the empty places." },
    { q: "Which is bigger, −9 or −2?", o: ["−2", "−9", "They are equal"], a: 0, w: "−2 is further right on the number line, so it is the bigger of the two — even though 9 is bigger than 2." },
    { q: "4 × 25 × 3 is easiest if you first work out:", o: ["4 × 25", "25 × 3", "4 × 3"], a: 0, w: "4 × 25 is 100, and 100 × 3 is easy. Regrouping never changes the answer." },
  ]);
  let cq = 0, rq = 0, lockq = false;
  function round11() {
    lockq = false;
    $("fb11").textContent = ""; $("fb11").className = "fb";
    if (cq >= Q11.length) {
      $("stem11").textContent = "That is all of them.";
      $("choices11").innerHTML = "";
      $("score11").textContent = rq + " out of " + Q11.length + " right.";
      if (rq >= 7) finish(10, "");
      else retryCheck($("fb11"), $("choices11"), rq, Q11.length, 7, function () { cq = 0; rq = 0; round11(); });
      return;
    }
    $("stem11").textContent = Q11[cq].q;
    const order = shuffle(Q11[cq].o.map((t, i) => ({ t: t, ok: i === Q11[cq].a })));
    $("choices11").innerHTML = order.map((o) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("score11").textContent = "Question " + (cq + 1) + " of " + Q11.length + " · " + rq + " right";
  }
  $("choices11").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lockq) return;
    lockq = true;
    const ok = b.dataset.ok === "1";
    if (ok) rq++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb11").textContent = (ok ? cheer() + " " : "") + Q11[cq].w;
    $("fb11").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q11[cq].w);
    cq++;
    setTimeout(round11, 2400);
  });
  round11();

  /* ---- 12: stickers ---- */
  const STICKERS = [["🔤", "Saying it in words"], ["🔗", "Odd, even, and what happens"], ["🔺", "The shape that hides a number"],
    ["🪜", "What comes next?"], ["🟦", "Numbers that make squares"], ["🎯", "Estimate before you work"],
    ["✖️", "Tables, and a shortcut"], ["➗", "Does it divide exactly?"], ["🔟", "Ten times, a hundred times"],
    ["🌡️", "Below zero, in order"], ["✅", "Show what I know"]];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span>' + s[0] + "</span><b>" + s[1] + "</b></div>").join("");
  }
  $("again").addEventListener("click", () => { show(0, true); });

  show(0, false);

  /* ---- your turn: the four slides that only demonstrated ---- */

  /* 1 (4Ni.01) reads a number FROM ITS NAME -- the place-value trap is which
     column the lone digit sits in, so the distractors are the same digit misplaced. */
  ask(1, () => {
    const t = rnd(1, 9), u = rnd(1, 9), shape = rnd(0, 2);
    const mk = (mult) => t * 1000 + u * mult;
    const n = mk(shape === 0 ? 1 : shape === 1 ? 10 : 100);
    const others = [1, 10, 100].filter((m) => mk(m) !== n).map(mk);
    const opts = shuffle([n, others[0], others[1]]);
    return { stem: "Which one is <b>" + numWords(n) + "</b>?",
      opts: opts.map(fmt), ans: opts.indexOf(n),
      why: numWords(n) + " is <b>" + fmt(n) + "</b> — the zeros hold the empty places." };
  });

  /* 2 (4Nc.02) asks for the RULE, not the sum: the numbers are big enough that
     adding them up is the slower route. */
  ask(2, () => {
    const a = rnd(11, 48), b = rnd(11, 48), opts = ["odd", "even"];
    return { stem: "Without working it out: is <b>" + a + " + " + b + "</b> odd or even?",
      opts, ans: opts.indexOf(par(a + b)),
      why: par(a) + " + " + par(b) + " is <b>always " + par(a + b) + "</b>, whatever the numbers." };
  });

  /* 5 (4Nc.05) the next square. Distractors are the two near-misses a child gets by
     adding one side instead of the whole L. */
  ask(5, () => {
    const k = rnd(2, 9), n = k * k, nxt = (k + 1) * (k + 1);
    const opts = shuffle([nxt, n + k, n + 2 * k]);
    return { stem: "Square numbers go 1, 4, 9, 16 … Which comes straight after <b>" + n + "</b>?",
      opts: opts.map(String), ans: opts.indexOf(nxt),
      why: "<b>" + nxt + "</b> is " + (k + 1) + " × " + (k + 1) + ", and the L added on is " +
        (2 * k + 1) + " dots — an odd number, as always." };
  });

  /* 9 (4Np.02, 4Np.05) alternates the two things the slide shows: moving the digits,
     and rounding. The halfway case is excluded so "nearer" in the answer is true. */
  ask(9, () => {
    if (rnd(0, 1) === 0) {
      const base = rnd(12, 987), by = rnd(0, 1) === 1 ? 10 : 100, n = base * by;
      const opts = shuffle([n, base * (by === 10 ? 100 : 10), base]);
      return { stem: "What is <b>" + fmt(base) + " × " + by + "</b>?",
        opts: opts.map(fmt), ans: opts.indexOf(n),
        why: "Every digit moves <b>" + (by === 10 ? "one place" : "two places") +
          "</b> to the left, giving " + fmt(n) + ". Nothing is &ldquo;adding a zero&rdquo;." };
    }
    const to = rnd(0, 1) === 1 ? 100 : 1000;
    let n = rnd(1040, 9960);
    while (n % to === to / 2) n = rnd(1040, 9960);
    const r = Math.round(n / to) * to;
    const opts = shuffle([r, r + to, r - to]);
    return { stem: "Round <b>" + fmt(n) + "</b> to the nearest " + fmt(to) + ".",
      opts: opts.map(fmt), ans: opts.indexOf(r),
      why: fmt(n) + " is nearer to <b>" + fmt(r) + "</b> than to " + fmt(r === Math.floor(n / to) * to ? r + to : r - to) + "." };
  });

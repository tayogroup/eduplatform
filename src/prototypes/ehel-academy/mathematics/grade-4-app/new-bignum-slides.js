  /* ---- shared by the new Big Numbers and Below Zero slides ----

     Every name here is prefixed b, because all slide code in a composed lesson
     shares one scope and this file is grafted in beside num-slides.js, which
     already declares COLS, digitsIn and a base9 of its own. */
  const B_COLS = [100000, 10000, 1000, 100, 10, 1];
  const B_COLNAME = ["100 000", "10 000", "1000", "100", "10", "1"];
  const B_PLACEWORD = { 1: "ones", 10: "tens", 100: "hundreds", 1000: "thousands",
    10000: "ten thousands", 100000: "hundred thousands" };
  const bTerm = (v, ghost) => '<span class="term4' + (ghost ? " ghost4" : "") + '">' +
    (ghost ? "?" : fmt(v)) + "</span>";

  /* ---- 1: the value of a digit is decided by its place (4Np.01) ---- */
  let b1 = null, b1right = 0, b1lock = false;
  function bNew1() {
    const ds = B_COLS.map(() => rnd(0, 9));
    ds[0] = rnd(1, 9);                             /* a genuine six-digit number */
    const spots = [];
    ds.forEach((d, i) => { if (d > 0) spots.push(i); });
    const i = spots[rnd(0, spots.length - 1)];
    const n = ds.reduce((a, d, k) => a + d * B_COLS[k], 0);
    return { ds: ds, i: i, n: n, val: ds[i] * B_COLS[i] };
  }
  function bPaint1() {
    let h = '<div class="pvrow head">' + B_COLNAME.map((c) => "<span>" + c + "</span>").join("") + "<span></span></div>";
    h += '<div class="pvrow">' + b1.ds.map((d, k) => '<span class="' + (k === b1.i ? "d" : "") + '">' + d + "</span>").join("") +
      '<span class="rl">' + fmt(b1.n) + "</span></div>";
    $("bpv1").innerHTML = h;
    $("bq1").innerHTML = "The <b>" + b1.ds[b1.i] + "</b> is highlighted. What is it worth?";
    /* Every distractor is the SAME digit in another column, which is the whole
       misconception: a digit read without its place. */
    const cands = shuffle([10, 100, 1000, 10000, 100000, 1].map((p) => b1.ds[b1.i] * p))
      .filter((v) => v !== b1.val);
    const opts = pick3(b1.val, cands);
    $("bpick1").innerHTML = opts.map((v) => '<button type="button" class="choice word" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("btask1").textContent = "Right so far: " + b1right + " of 4";
  }
  $("bpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b1lock) return;
    b1lock = true;
    const ok = Number(b.dataset.v) === b1.val;
    if (ok) b1right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("bwork1"), [
      { k: "The number", v: "<b>" + fmt(b1.n) + "</b>" },
      { k: "The digit", v: "<b>" + b1.ds[b1.i] + "</b>, sitting in the <b>" + B_PLACEWORD[B_COLS[b1.i]] + "</b> column" },
      { k: "So it is worth", v: b1.ds[b1.i] + " &times; " + fmt(B_COLS[b1.i]) + " = <b>" + fmt(b1.val) + "</b>", total: true },
    ]);
    $("bfb1").innerHTML = (ok ? cheer() + " " : "It is worth " + fmt(b1.val) + ". ") +
      "A digit on its own tells you nothing &mdash; you have to read the <b>column</b> it is in.";
    $("bfb1").className = "fb " + (ok ? "good" : "bad");
    say($("bfb1").textContent);
    if (b1right >= 4) finish(0, "You can read what any digit is worth!");
    setTimeout(() => { b1 = bNew1(); b1lock = false; bPaint1(); }, 1900);
  });
  b1 = bNew1(); bPaint1();

  /* ---- 2: composing, decomposing and regrouping (4Np.03) ---- */
  const bSet = (s) => s[0] * 1000 + s[1] * 100 + s[2] * 10 + s[3];
  const bSay = (s) => s[0] + " thousands, " + s[1] + " hundreds, " + s[2] + " tens, " + s[3] + " ones";
  let b2 = null, b2right = 0, b2lock = false;
  function bNew2() {
    const t = rnd(2, 9), h = rnd(1, 8), te = rnd(1, 9), o = rnd(1, 9);
    /* right: a thousand swapped for ten hundreds -- the two slips beside it are
       taking the ten hundreds without paying the thousand, and paying the
       thousand but taking only one hundred back. */
    const right = [t - 1, h + 10, te, o];
    return { n: t * 1000 + h * 100 + te * 10 + o, parts: [t, h, te, o], right: right,
      opts: shuffle([right, [t, h + 10, te, o], [t - 1, h + 1, te, o]]) };
  }
  function bPaint2() {
    $("bnum2").textContent = fmt(b2.n);
    $("bq2").innerHTML = "Which of these is <b>another way</b> of making " + fmt(b2.n) + "?";
    $("bpick2").innerHTML = b2.opts.map((s, i) => '<button type="button" class="choice word" data-i="' + i + '">' + bSay(s) + "</button>").join("");
    $("btask2").textContent = "Right so far: " + b2right + " of 3";
  }
  $("bpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b || b2lock) return;
    b2lock = true;
    const s = b2.opts[Number(b.dataset.i)], ok = bSet(s) === b2.n;
    if (ok) b2right++;
    b.classList.add(ok ? "right" : "wrong");
    const rows = [{ k: "Ordinary way", v: bSay(b2.parts) + " = <b>" + fmt(b2.n) + "</b>" }];
    b2.opts.forEach((o) => {
      rows.push({ k: bSet(o) === b2.n ? "Same number" : "Not the same",
        v: bSay(o) + " = <b>" + fmt(bSet(o)) + "</b>" });
    });
    rows.push({ k: "The swap", v: "1 thousand became <b>10 hundreds</b>, so " + (b2.parts[0]) +
      " and " + b2.parts[1] + " became " + b2.right[0] + " and " + b2.right[1], total: true });
    lines($("bwork2"), rows);
    $("bfb2").innerHTML = (ok ? cheer() + " " : "It is " + bSay(b2.right) + ". ") +
      "You may swap <b>one thousand for ten hundreds</b> at any time &mdash; nothing has been added or taken away.";
    $("bfb2").className = "fb " + (ok ? "good" : "bad");
    say($("bfb2").textContent);
    if (b2right >= 3) finish(1, "You can regroup a number!");
    setTimeout(() => { b2 = bNew2(); b2lock = false; bPaint2(); }, 2400);
  });
  b2 = bNew2(); bPaint2();

  /* ---- 3: counting on and back in steps of constant size (4Nc.01) ---- */
  const B_STEPS = [2, 3, 4, 5, 6, 10, 20, 25, 50, 100, 200, 500, 1000, 2000];
  let b3 = null, b3right = 0, b3lock = false;
  function bNew3() {
    const step = B_STEPS[rnd(0, B_STEPS.length - 1)];
    const dir = rnd(0, 1) ? 1 : -1;
    const start = rnd(2, 40) * (step >= 100 ? 100 : 10) + rnd(0, 9);
    const terms = [];
    for (let i = 0; i < 5; i++) terms.push(start + dir * step * i);
    return { terms: terms, gap: rnd(1, 4), step: step, dir: dir };
  }
  function bPaint3() {
    $("bseq3").innerHTML = b3.terms.map((v, i) => bTerm(v, i === b3.gap)).join('<span class="step">&rarr;</span>');
    $("bq3").innerHTML = "What belongs in the <b>gap</b>?";
    const c = b3.terms[b3.gap];
    const opts = pick3(c, shuffle([c + b3.dir * b3.step, c - b3.dir * b3.step, c + b3.dir]));
    $("bpick3").innerHTML = opts.map((v) => '<button type="button" class="choice word" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("btask3").textContent = "Right so far: " + b3right + " of 4";
  }
  $("bpick3").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b3lock) return;
    b3lock = true;
    const c = b3.terms[b3.gap], ok = Number(b.dataset.v) === c;
    if (ok) b3right++;
    b.classList.add(ok ? "right" : "wrong");
    /* The step is DERIVED from two terms the learner can SEE, never quoted from the
       generator -- and the pair has to skip the gap, which is why z steps over it
       when the gap is second. The gap is never term 1, so term 0 is always shown. */
    const z = b3.gap === 1 ? 2 : 1;
    const shown = (b3.terms[z] - b3.terms[0]) / z;
    lines($("bwork3"), [
      { k: "Two terms", v: fmt(b3.terms[0]) + " then " + fmt(b3.terms[z]) },
      { k: "The step", v: fmt(b3.terms[z]) + " &minus; " + fmt(b3.terms[0]) +
        (z > 1 ? ", over " + z + " steps" : "") + ", so each step is <b>" +
        (shown > 0 ? "+" : "&minus;") + fmt(Math.abs(shown)) + "</b>" },
      { k: "The term before", v: "<b>" + fmt(b3.terms[b3.gap - 1]) + "</b>" },
      { k: "So the gap is", v: fmt(b3.terms[b3.gap - 1]) + " " + (shown > 0 ? "+" : "&minus;") +
        " " + fmt(Math.abs(shown)) + " = <b>" + fmt(c) + "</b>", total: true },
    ]);
    $("bfb3").innerHTML = (ok ? cheer() + " " : "It is " + fmt(c) + ". ") +
      "Find the <b>step</b> from two terms you can see, then use it once.";
    $("bfb3").className = "fb " + (ok ? "good" : "bad");
    say($("bfb3").textContent);
    if (b3right >= 4) finish(2, "You can find the step and fill the gap!");
    setTimeout(() => { b3 = bNew3(); b3lock = false; bPaint3(); }, 2100);
  });
  b3 = bNew3(); bPaint3();

  /* ---- 4: ordering positive and negative numbers (4Np.04) ----

     Comparing TWO numbers is the slide before this one. Ordering a whole set is a
     different job: the learner has to hold the ones already placed and keep asking
     which of what is left is furthest left on the line. */
  let b4 = null, b4sets = 0, b4lock = false;
  function bNew4() {
    for (let t = 0; t < 60; t++) {
      const pool = [];
      while (pool.length < 4) {
        const v = rnd(-25, 25);
        if (pool.indexOf(v) < 0) pool.push(v);
      }
      if (pool.filter((v) => v < 0).length >= 1 && pool.filter((v) => v > 0).length >= 1) {
        return { pool: pool, placed: [] };
      }
    }
    return { pool: [-12, 5, -3, 18], placed: [] };
  }
  function bPaint4() {
    const left = b4.pool.filter((v) => b4.placed.indexOf(v) < 0);
    $("bq4").innerHTML = b4.placed.length === 4
      ? "All four in order."
      : "Tap the <b>smallest</b> of the ones still left.";
    $("bpick4").innerHTML = b4.pool.map((v) => '<button type="button" class="choice' +
      (b4.placed.indexOf(v) < 0 ? '" data-v="' + v + '">' : ' right" disabled>') +
      (v < 0 ? "−" + Math.abs(v) : v) + "</button>").join("");
    $("bseq4").innerHTML = b4.placed.length
      ? b4.placed.map((v) => '<span class="term4">' + (v < 0 ? "−" + Math.abs(v) : v) + "</span>").join('<span class="step">&lt;</span>')
      : "";
    $("btask4").textContent = "Sets finished: " + b4sets + " of 2 · " + left.length + " still to place";
  }
  $("bpick4").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b4lock || b.disabled) return;
    const v = Number(b.dataset.v);
    const left = b4.pool.filter((x) => b4.placed.indexOf(x) < 0);
    const min = Math.min.apply(null, left);
    if (v !== min) {
      b.classList.add("wrong");
      $("bfb4").innerHTML = "Not yet &mdash; " + (min < 0 ? "−" + Math.abs(min) : min) +
        " is further <b>left</b> on the line than " + (v < 0 ? "−" + Math.abs(v) : v) + ", so it is smaller.";
      $("bfb4").className = "fb bad";
      say($("bfb4").textContent);
      setTimeout(() => b.classList.remove("wrong"), 900);
      return;
    }
    b4.placed.push(v);
    bPaint4();
    if (b4.placed.length < 4) {
      $("bfb4").innerHTML = "Yes &mdash; that is the smallest one left.";
      $("bfb4").className = "fb good";
      return;
    }
    b4lock = true;
    b4sets++;
    lines($("bwork4"), [
      { k: "In order", v: "<b>" + b4.placed.map((x) => (x < 0 ? "−" + Math.abs(x) : x)).join(" &lt; ") + "</b>" },
      { k: "Reading it back", v: "the same four, largest first: " +
        b4.placed.slice().reverse().map((x) => (x < 0 ? "−" + Math.abs(x) : x)).join(" &gt; ") },
      { k: "The rule", v: "further <b>right</b> on the line is always bigger, and every negative is left of every positive", total: true },
    ]);
    $("bfb4").innerHTML = cheer() + " All four in order, smallest to largest.";
    $("bfb4").className = "fb good";
    say($("bfb4").textContent);
    if (b4sets >= 2) finish(3, "You can put positives and negatives in order!");
    setTimeout(() => { b4 = bNew4(); b4lock = false; bPaint4(); }, 2400);
  });
  b4 = bNew4(); bPaint4();

  /* ---- 5: rounding as "which neighbour is nearer" (4Np.05) ---- */
  let b5 = null, b5right = 0, b5lock = false;
  function bNew5() {
    const place = [10, 100][rnd(0, 1)];
    const lo = rnd(place === 10 ? 12 : 3, place === 10 ? 480 : 96) * place;
    /* Halfway is the one case that cannot be worked out by looking, so it is
       dealt in deliberately rather than left to chance. */
    const off = rnd(1, 5) === 1 ? place / 2 : rnd(1, place - 1);
    return { place: place, lo: lo, hi: lo + place, n: lo + off, off: off,
      ans: Math.round((lo + off) / place) * place };
  }
  function bPaint5() {
    nline($("bnl5"), b5.lo, b5.hi, [b5.n], b5.place / 2, b5.place / 10);
    $("bq5").innerHTML = "Round <b>" + fmt(b5.n) + "</b> to the nearest <b>" + fmt(b5.place) + "</b>.";
    $("bpick5").innerHTML = [b5.lo, b5.hi].map((v) => '<button type="button" class="choice word" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("btask5").textContent = "Right so far: " + b5right + " of 4";
  }
  $("bpick5").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b5lock) return;
    b5lock = true;
    const ok = Number(b.dataset.v) === b5.ans;
    if (ok) b5right++;
    b.classList.add(ok ? "right" : "wrong");
    const half = b5.off === b5.place / 2;
    lines($("bwork5"), [
      { k: "It sits between", v: "<b>" + fmt(b5.lo) + "</b> and <b>" + fmt(b5.hi) + "</b>" },
      { k: "Back to " + fmt(b5.lo), v: fmt(b5.n) + " &minus; " + fmt(b5.lo) + " = <b>" + fmt(b5.off) + "</b>" },
      { k: "On to " + fmt(b5.hi), v: fmt(b5.hi) + " &minus; " + fmt(b5.n) + " = <b>" + fmt(b5.place - b5.off) + "</b>" },
      { k: half ? "Exactly halfway" : "The shorter trip",
        v: half ? "neither is nearer, so the rule sends it <b>up</b> to " + fmt(b5.ans)
                : "to <b>" + fmt(b5.ans) + "</b>", total: true },
    ]);
    $("bfb5").innerHTML = (ok ? cheer() + " " : "It rounds to " + fmt(b5.ans) + ". ") +
      (half ? "Halfway is the one case you have to be <b>told</b>: it goes up."
            : "Rounding is only ever asking <b>which neighbour is nearer</b>.");
    $("bfb5").className = "fb " + (ok ? "good" : "bad");
    say($("bfb5").textContent);
    if (b5right >= 4) finish(4, "You can round to the nearest ten and hundred!");
    setTimeout(() => { b5 = bNew5(); b5lock = false; bPaint5(); }, 2200);
  });
  b5 = bNew5(); bPaint5();

  /* ---- 6: the same number rounded to each place (4Np.05) ---- */
  const B_PLACES = [10, 100, 1000, 10000, 100000];
  let b6 = null, b6right = 0, b6lock = false;
  function bNew6() {
    const n = rnd(100000, 899999), p = B_PLACES[rnd(0, B_PLACES.length - 1)];
    return { n: n, p: p, ans: Math.round(n / p) * p };
  }
  function bPaint6() {
    $("bnum6").textContent = fmt(b6.n);
    $("bq6").innerHTML = "Round it to the nearest <b>" + fmt(b6.p) + "</b>.";
    const opts = pick3(b6.ans, shuffle([b6.ans + b6.p, b6.ans - b6.p,
      Math.round(b6.n / (b6.p * 10)) * (b6.p * 10), Math.floor(b6.n / b6.p) * b6.p]));
    $("bpick6").innerHTML = opts.map((v) => '<button type="button" class="choice word" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("btask6").textContent = "Right so far: " + b6right + " of 4";
  }
  $("bpick6").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || b6lock) return;
    b6lock = true;
    const ok = Number(b.dataset.v) === b6.ans;
    if (ok) b6right++;
    b.classList.add(ok ? "right" : "wrong");
    const lo = Math.floor(b6.n / b6.p) * b6.p, hi = lo + b6.p;
    lines($("bwork6"), [
      { k: "It sits between", v: "<b>" + fmt(lo) + "</b> and <b>" + fmt(hi) + "</b>" },
      { k: "The distances", v: fmt(b6.n - lo) + " back, " + fmt(hi - b6.n) + " on" },
      { k: "Nearest " + fmt(b6.p), v: "<b>" + fmt(b6.ans) + "</b>", total: true },
      { k: "All five places", v: B_PLACES.map((p) => fmt(p) + " &rarr; <b>" + fmt(Math.round(b6.n / p) * p) + "</b>").join(" &middot; ") },
    ]);
    $("bfb6").innerHTML = (ok ? cheer() + " " : "It is " + fmt(b6.ans) + ". ") +
      "One number, five different answers &mdash; so always read <b>which place</b> you are asked for.";
    $("bfb6").className = "fb " + (ok ? "good" : "bad");
    say($("bfb6").textContent);
    if (b6right >= 4) finish(5, "You can round to any place!");
    setTimeout(() => { b6 = bNew6(); b6lock = false; bPaint6(); }, 2600);
  });
  b6 = bNew6(); bPaint6();

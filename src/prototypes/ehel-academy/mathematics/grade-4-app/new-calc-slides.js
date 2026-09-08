  /* ---- shared by the new Ways to Calculate slides ----

     Prefixed wk. num-slides.js declares round10, round100, newEst and paint6 in the
     estimate slide this lesson keeps, and the donor's factor-pair slide arrives
     prefixed d6_, so the only rule here is to stay clear of both. */
  const WK_COLS = 6;
  function wkColumns(rows) {
    /* the place-value grid of num-extra.css: six digit cells and a label. Numbers
       are right-aligned into it by padding, exactly as slide 9 does. */
    return rows.map((r) => '<div class="pvrow">' +
      String(r.n).padStart(WK_COLS, " ").split("").map((d) =>
        '<span class="' + (d === " " ? "" : "d") + '">' + (d === " " ? "" : d) + "</span>").join("") +
      '<span class="rl">' + r.lab + "</span></div>").join("");
  }
  const wkDigits = (n) => String(n).padStart(3, "0").split("").map(Number);

  /* ---- 1: three-digit addition, exactly (4Ni.02) ----

     The kept estimate slide shows the exact answer in its WORKING but only ever asks
     for the estimate, and 4Ni.02 says "estimate, add and subtract". */
  let wk1 = null, wk1right = 0, wk1lock = false;
  function wkNew1() {
    for (let t = 0; t < 80; t++) {
      const a = rnd(126, 869), b = rnd(114, 758);
      const da = wkDigits(a), db = wkDigits(b);
      const carryOnes = da[2] + db[2] >= 10;
      const carryTens = da[1] + db[1] + (carryOnes ? 1 : 0) >= 10;
      if (!carryOnes && !carryTens) continue;        /* a sum with no carry teaches nothing here */
      if (a + b > 999) continue;
      return { a: a, b: b, sum: a + b, carryOnes: carryOnes, carryTens: carryTens };
    }
    return { a: 347, b: 185, sum: 532, carryOnes: true, carryTens: true };
  }
  function wkPaint1() {
    const P = wk1;
    $("wkcol1").innerHTML = wkColumns([{ n: P.a, lab: "" }, { n: P.b, lab: "+" }]);
    $("wkq1").innerHTML = "What is <b>" + P.a + " + " + P.b + "</b>?";
    /* the two distractors are a DROPPED CARRY, one from each column that has one --
       which is what a slip in this method actually produces */
    const cands = [];
    if (P.carryOnes) cands.push(P.sum - 10);
    if (P.carryTens) cands.push(P.sum - 100);
    $("wkpick1").innerHTML = pick3(P.sum, cands.concat([P.sum + 10, P.sum - 1]))
      .map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("wktask1").textContent = "Right so far: " + wk1right + " of 4";
  }
  $("wkpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || wk1lock) return;
    wk1lock = true;
    const P = wk1, ok = Number(b.dataset.v) === P.sum;
    if (ok) wk1right++;
    b.classList.add(ok ? "right" : "wrong");
    $("wkcol1").innerHTML = wkColumns([{ n: P.a, lab: "" }, { n: P.b, lab: "+" }, { n: P.sum, lab: "=" }]);
    const da = wkDigits(P.a), db = wkDigits(P.b);
    lines($("wkwork1"), [
      { k: "Ones", v: da[2] + " + " + db[2] + " = <b>" + (da[2] + db[2]) + "</b>" +
        (P.carryOnes ? ", so write " + ((da[2] + db[2]) % 10) + " and <b>carry 1 ten</b>" : "") },
      { k: "Tens", v: da[1] + " + " + db[1] + (P.carryOnes ? " + the carried 1" : "") + " = <b>" +
        (da[1] + db[1] + (P.carryOnes ? 1 : 0)) + "</b>" +
        (P.carryTens ? ", so write " + ((da[1] + db[1] + (P.carryOnes ? 1 : 0)) % 10) + " and <b>carry 1 hundred</b>" : "") },
      { k: "Hundreds", v: da[0] + " + " + db[0] + (P.carryTens ? " + the carried 1" : "") + " = <b>" +
        (da[0] + db[0] + (P.carryTens ? 1 : 0)) + "</b>" },
      { k: "So", v: P.a + " + " + P.b + " = <b>" + P.sum + "</b>", total: true },
    ]);
    $("wkfb1").innerHTML = (ok ? cheer() + " " : "It is " + P.sum + ". ") +
      "A carry is a whole <b>ten</b> or a whole <b>hundred</b> moving next door &mdash; drop one and the answer is out by exactly that much.";
    $("wkfb1").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb1").textContent);
    if (wk1right >= 4) finish(0, "You can add three-digit numbers exactly!");
    setTimeout(() => { wk1 = wkNew1(); wk1lock = false; wkPaint1(); }, 2600);
  });
  wk1 = wkNew1(); wkPaint1();

  /* ---- 2: three-digit subtraction, exactly (4Ni.02) ---- */
  let wk2 = null, wk2right = 0, wk2lock = false;
  function wkNew2() {
    for (let t = 0; t < 80; t++) {
      const a = rnd(320, 940), b = rnd(118, a - 100);
      const da = wkDigits(a), db = wkDigits(b);
      if (da[2] >= db[2] && da[1] >= db[1]) continue;     /* no exchange needed, so nothing to teach */
      return { a: a, b: b, diff: a - b };
    }
    return { a: 623, b: 187, diff: 436 };
  }
  function wkPaint2() {
    const P = wk2;
    $("wkcol2").innerHTML = wkColumns([{ n: P.a, lab: "" }, { n: P.b, lab: "&minus;" }]);
    $("wkq2").innerHTML = "What is <b>" + P.a + " &minus; " + P.b + "</b>?";
    /* THE distractor: each column done as bigger-minus-smaller, whichever way round
       the digits happen to be. It is the commonest wrong answer in the method and
       every other option here would let a learner reach the right one by elimination. */
    const da = wkDigits(P.a), db = wkDigits(P.b);
    const naive = Math.abs(da[0] - db[0]) * 100 + Math.abs(da[1] - db[1]) * 10 + Math.abs(da[2] - db[2]);
    $("wkpick2").innerHTML = pick3(P.diff, [naive, P.diff + 100, P.diff - 10])
      .map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("wktask2").textContent = "Right so far: " + wk2right + " of 4";
  }
  $("wkpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || wk2lock) return;
    wk2lock = true;
    const P = wk2, ok = Number(b.dataset.v) === P.diff;
    if (ok) wk2right++;
    b.classList.add(ok ? "right" : "wrong");
    $("wkcol2").innerHTML = wkColumns([{ n: P.a, lab: "" }, { n: P.b, lab: "&minus;" }, { n: P.diff, lab: "=" }]);
    const da = wkDigits(P.a), db = wkDigits(P.b);
    const borrowOnes = da[2] < db[2];
    const tensLeft = da[1] - (borrowOnes ? 1 : 0);
    const borrowTens = tensLeft < db[1];
    lines($("wkwork2"), [
      { k: "Ones", v: borrowOnes
        ? da[2] + " is less than " + db[2] + ", so <b>exchange a ten</b>: " + (da[2] + 10) + " − " + db[2] + " = <b>" + (da[2] + 10 - db[2]) + "</b>"
        : da[2] + " − " + db[2] + " = <b>" + (da[2] - db[2]) + "</b>" },
      { k: "Tens", v: (borrowOnes ? "one ten has gone, leaving " + tensLeft + ". " : "") +
        (borrowTens ? tensLeft + " is less than " + db[1] + ", so <b>exchange a hundred</b>: " + (tensLeft + 10) + " − " + db[1] + " = <b>" + (tensLeft + 10 - db[1]) + "</b>"
                    : tensLeft + " − " + db[1] + " = <b>" + (tensLeft - db[1]) + "</b>") },
      { k: "Hundreds", v: (borrowTens ? (da[0] - 1) + " left, and " + (da[0] - 1) + " − " + db[0] : da[0] + " − " + db[0]) +
        " = <b>" + (da[0] - (borrowTens ? 1 : 0) - db[0]) + "</b>" },
      { k: "So", v: P.a + " − " + P.b + " = <b>" + P.diff + "</b>", total: true },
    ]);
    $("wkfb2").innerHTML = (ok ? cheer() + " " : "It is " + P.diff + ". ") +
      "Never turn a column round. If there is too little, <b>exchange</b> from next door.";
    $("wkfb2").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb2").textContent);
    if (wk2right >= 4) finish(1, "You can take away with exchanging!");
    setTimeout(() => { wk2 = wkNew2(); wk2lock = false; wkPaint2(); }, 2800);
  });
  wk2 = wkNew2(); wkPaint2();

  /* ---- 3: the associative property used to simplify (4Ni.03) ----

     The kept slide regroups a chain of three numbers. Doubling one and halving the
     other is the same property on a PAIR, and it is the form the objective means by
     "use this to simplify calculations". */
  const WK_PAIRS = [[16, 25], [24, 25], [14, 50], [18, 50], [12, 25], [22, 50], [16, 50], [28, 25]];
  let wk3 = null, wk3right = 0, wk3lock = false;
  function wkNew3() {
    const p = WK_PAIRS[rnd(0, WK_PAIRS.length - 1)];
    return { a: p[0], b: p[1], prod: p[0] * p[1] };
  }
  function wkPaint3() {
    const P = wk3;
    $("wkq3").innerHTML = P.a + " &times; " + P.b;
    const right = (P.a / 2) + " × " + (P.b * 2);
    const opts = [right, (P.a * 2) + " × " + (P.b * 2), (P.a / 2) + " × " + P.b];
    $("wkpick3").innerHTML = shuffle(opts).map((o) =>
      '<button type="button" class="choice word" data-t="' + o + '">' + o + "</button>").join("");
    $("wktask3").textContent = "Which of these is the SAME answer, only easier? · right so far: " + wk3right + " of 4";
  }
  $("wkpick3").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || wk3lock) return;
    wk3lock = true;
    const P = wk3, right = (P.a / 2) + " × " + (P.b * 2), ok = b.dataset.t === right;
    if (ok) wk3right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("wkwork3"), [
      { k: "Halve one", v: P.a + " ÷ 2 = <b>" + P.a / 2 + "</b>" },
      { k: "Double the other", v: P.b + " × 2 = <b>" + P.b * 2 + "</b>" },
      { k: "Why it is allowed", v: "the halving and the doubling <b>cancel</b>, so the product cannot change" },
      { k: "Check both", v: P.a + " × " + P.b + " = <b>" + fmt(P.prod) + "</b>, and " + P.a / 2 + " × " +
        P.b * 2 + " = <b>" + fmt(P.prod) + "</b>", total: true },
    ]);
    $("wkfb3").innerHTML = (ok ? cheer() + " " : "It is " + right + ". ") +
      "Doubling <b>both</b> makes it four times too big, and halving one without doubling the other halves it &mdash; <b>one of each</b> is what leaves it alone.";
    $("wkfb3").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb3").textContent);
    if (wk3right >= 4) finish(2, "You can make a multiplication easier without changing it!");
    setTimeout(() => { wk3 = wkNew3(); wk3lock = false; wkPaint3(); }, 2800);
  });
  wk3 = wkNew3(); wkPaint3();

  /* ---- 4: multiplying up to 1000 by a 1-digit number (4Ni.05) ---- */
  let wk4 = null, wk4right = 0, wk4lock = false;
  function wkNew4() {
    for (let t = 0; t < 60; t++) {
      const a = rnd(112, 480), b = rnd(3, 8);
      if (wkDigits(a)[1] === 0) continue;          /* the middle part must exist to be forgotten */
      if (a * b > 3000) continue;
      return { a: a, b: b, prod: a * b, d: wkDigits(a) };
    }
    return { a: 342, b: 6, prod: 2052, d: [3, 4, 2] };
  }
  function wkPaint4() {
    const P = wk4;
    $("wkq4").innerHTML = fmt(P.a) + " &times; " + P.b;
    $("wkparts4").innerHTML = [P.d[0] * 100, P.d[1] * 10, P.d[2]]
      .map((v) => '<span class="term4">' + v + "</span>").join('<span class="step">+</span>');
    /* forgetting the tens part is the slip this method invites, so it is an option */
    const noTens = P.prod - P.d[1] * 10 * P.b;
    $("wkpick4").innerHTML = pick3(P.prod, [noTens, P.prod - P.d[2] * P.b, P.prod + 100])
      .map((v) => '<button type="button" class="choice" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("wktask4").textContent = "Right so far: " + wk4right + " of 4";
  }
  $("wkpick4").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || wk4lock) return;
    wk4lock = true;
    const P = wk4, ok = Number(b.dataset.v) === P.prod;
    if (ok) wk4right++;
    b.classList.add(ok ? "right" : "wrong");
    const parts = [P.d[0] * 100, P.d[1] * 10, P.d[2]];
    lines($("wkwork4"), [
      { k: "Break it up", v: fmt(P.a) + " = <b>" + parts.join(" + ") + "</b>" },
      { k: "Each part", v: parts.map((v) => v + " × " + P.b + " = <b>" + fmt(v * P.b) + "</b>").join("<br>") },
      { k: "Add them back", v: parts.map((v) => fmt(v * P.b)).join(" + ") + " = <b>" + fmt(P.prod) + "</b>" },
      { k: "Does it look right?", v: "the estimate was about " + fmt(Math.round(P.a / 100) * 100 * P.b) +
        ", so <b>" + fmt(P.prod) + "</b> is the right size", total: true },
    ]);
    $("wkfb4").innerHTML = (ok ? cheer() + " " : "It is " + fmt(P.prod) + ". ") +
      "Every part has to be multiplied &mdash; leave the <b>tens</b> out and the answer is short by " +
      fmt(P.d[1] * 10 * P.b) + ".";
    $("wkfb4").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb4").textContent);
    if (wk4right >= 4) finish(3, "You can multiply a big number by a small one!");
    setTimeout(() => { wk4 = wkNew4(); wk4lock = false; wkPaint4(); }, 2800);
  });
  wk4 = wkNew4(); wkPaint4();

  /* ---- 5: dividing up to 100 by a 1-digit number, with a remainder (4Ni.06) ---- */
  let wk5 = null, wk5right = 0, wk5lock = false;
  function wkNew5() {
    const b = rnd(3, 8), q = rnd(6, 15), r = rnd(1, b - 1);
    const a = Math.min(99, b * q + r);
    const qq = Math.floor(a / b), rr = a % b;
    return { a: a, b: b, q: qq, r: rr };
  }
  const wkAns5 = (q, r) => (r === 0 ? String(q) : q + " remainder " + r);
  function wkPaint5() {
    const P = wk5;
    $("wkq5").innerHTML = P.a + " &divide; " + P.b;
    const opts = [wkAns5(P.q, P.r), wkAns5(P.q + 1, P.r), wkAns5(P.q, 0)];
    const uniq = [];
    opts.forEach((o) => { if (uniq.indexOf(o) < 0) uniq.push(o); });
    while (uniq.length < 3) uniq.push(wkAns5(P.q - 1, P.r));
    $("wkpick5").innerHTML = shuffle(uniq.slice(0, 3)).map((o) =>
      '<button type="button" class="choice word" data-t="' + o + '">' + o + "</button>").join("");
    $("wktask5").textContent = "Right so far: " + wk5right + " of 4";
  }
  $("wkpick5").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || wk5lock) return;
    wk5lock = true;
    const P = wk5, right = wkAns5(P.q, P.r), ok = b.dataset.t === right;
    if (ok) wk5right++;
    b.classList.add(ok ? "right" : "wrong");
    const ten = P.q > 10 ? 10 : 5;          /* q is never below 6, so a rest of at least 1 is left */
    lines($("wkwork5"), [
      { k: "Take a big chunk", v: P.b + " × " + ten + " = " + P.b * ten + ", and " + P.a + " − " + P.b * ten +
        " = <b>" + (P.a - P.b * ten) + "</b> left" },
      { k: "Keep taking groups", v: P.b + " × " + (P.q - ten) + " = " + P.b * (P.q - ten) + ", and " +
        (P.a - P.b * ten) + " − " + P.b * (P.q - ten) + " = <b>" + P.r + "</b> left" },
      { k: "Groups taken", v: ten + " + " + (P.q - ten) + " = <b>" + P.q + "</b>" },
      { k: "What is left", v: P.r === 0 ? "<b>nothing</b> &mdash; it divided exactly"
        : "<b>" + P.r + "</b>, which will not make another group of " + P.b },
      { k: "So", v: P.a + " ÷ " + P.b + " = <b>" + right + "</b>", total: true },
    ]);
    $("wkfb5").innerHTML = (ok ? cheer() + " " : "It is " + right + ". ") +
      "Check it the other way round: " + P.b + " × " + P.q + " = " + P.b * P.q +
      (P.r ? ", and " + P.b * P.q + " + " + P.r + " = " + P.a : " = " + P.a) + ".";
    $("wkfb5").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb5").textContent);
    if (wk5right >= 4) finish(4, "You can divide and say what is left over!");
    setTimeout(() => { wk5 = wkNew5(); wk5lock = false; wkPaint5(); }, 3000);
  });
  wk5 = wkNew5(); wkPaint5();

  /* ---- 6: the relationship between multiples and factors (4Ni.07) ----

     The donor's slide above this one draws factor PAIRS as rectangles. The objective
     asks for the relationship, which is that the two words describe one fact from
     opposite ends -- and the way to test that is to make the learner pick the word. */
  let wk6 = null, wk6right = 0, wk6lock = false;
  const wk6seen = {};
  function wkNew6() {
    const f = rnd(2, 9), o = rnd(3, 11), big = f * o;
    return { f: f, big: big, o: o, asking: rnd(0, 1) ? "factor" : "multiple" };
  }
  function wkPaint6() {
    const P = wk6;
    $("wkq6").innerHTML = P.asking === "factor"
      ? P.f + " <span class='unk'>?</span> " + P.big
      : P.big + " <span class='unk'>?</span> " + P.f;
    const words = P.asking === "factor"
      ? ["is a factor of", "is a multiple of", "is the same as"]
      : ["is a multiple of", "is a factor of", "is the same as"];
    $("wkpick6").innerHTML = shuffle(words).map((w) =>
      '<button type="button" class="choice word" data-t="' + w + '">' + w + "</button>").join("");
    $("wktask6").textContent = "Fill the gap · right so far: " + wk6right + " of 4, both words needed";
  }
  $("wkpick6").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || wk6lock) return;
    wk6lock = true;
    const P = wk6, right = P.asking === "factor" ? "is a factor of" : "is a multiple of";
    const ok = b.dataset.t === right;
    if (ok) { wk6right++; wk6seen[P.asking] = true; }
    b.classList.add(ok ? "right" : "wrong");
    lines($("wkwork6"), [
      { k: "The one fact", v: "<b>" + P.f + " × " + P.o + " = " + P.big + "</b>" },
      { k: "From the small end", v: P.f + " divides " + P.big + " exactly, so <b>" + P.f +
        " is a factor of " + P.big + "</b>" },
      { k: "From the big end", v: P.big + " is in the " + P.f + " times table, so <b>" + P.big +
        " is a multiple of " + P.f + "</b>" },
      { k: "So the word depends on", v: "which end you are standing at &mdash; nothing else", total: true },
    ]);
    $("wkfb6").innerHTML = (ok ? cheer() + " " : "It should say &ldquo;" + right + "&rdquo;. ") +
      "The <b>smaller</b> number is always the factor and the <b>bigger</b> one is always the multiple.";
    $("wkfb6").className = "fb " + (ok ? "good" : "bad");
    say($("wkfb6").textContent);
    if (wk6right >= 4 && Object.keys(wk6seen).length >= 2) finish(5, "You know which word goes which way!");
    setTimeout(() => { wk6 = wkNew6(); wk6lock = false; wkPaint6(); }, 2800);
  });
  wk6 = wkNew6(); wkPaint6();

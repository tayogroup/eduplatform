  /* ---- shared by the new Patterns and Square Numbers slides ----

     Prefixed pt, not p: num-slides.js already has a top-level `p3` in the very
     slide this lesson keeps, and `par`, `row2`, `paint2`, `SEQS` and `s4` beside
     it. All slide code shares one scope in a composed lesson. */
  const PT_SHAPES = ["▲", "■", "●", "◆"];
  const ptPar = (n) => (n % 2 === 0 ? "even" : "odd");
  function ptRow(n, cls) {
    let h = '<div class="prow2"><span class="pn">' + n + '</span><span class="pdots">';
    for (let i = 0; i < Math.floor(n / 2); i++) h += '<i class="pair ' + cls + '"></i>';
    if (n % 2) h += '<i class="odd1 ' + cls + '"></i>';
    return h + '</span><span class="ptag ' + ptPar(n) + '">' + ptPar(n) + "</span></div>";
  }
  const ptBar = (parts, total) => '<div class="bwhole">' + parts.map((p) =>
    '<span class="bpart ' + (p.known ? "known" : "unknownp") + '" style="width:' +
    ((p.w / total) * 100).toFixed(3) + '%">' + p.t + "</span>").join("") + "</div>";

  /* Sequence generation, shared by the two slides below that use it. The kept slide
     prints +6 between every pair of terms and names its rule on its own chip, so it
     can only ever ask for one more term; these hide the steps. */
  function ptSeq() {
    const k = rnd(0, 3);
    if (k === 0) { const s = rnd(3, 40), d = rnd(2, 12);
      return { t: [0, 1, 2, 3].map((i) => s + d * i), kind: "linear",
        rule: "add " + d + " every time", next: s + d * 4, d: d }; }
    if (k === 1) { const s = rnd(60, 99), d = rnd(3, 11);
      return { t: [0, 1, 2, 3].map((i) => s - d * i), kind: "linear",
        rule: "subtract " + d + " every time", next: s - d * 4, d: -d }; }
    if (k === 2) { const s = rnd(2, 6);
      return { t: [0, 1, 2, 3].map((i) => s * Math.pow(2, i)), kind: "non-linear",
        rule: "double every time", next: s * 16 }; }
    const s = rnd(1, 5), g = rnd(2, 4);
    let v = s; const t = [v];
    for (let i = 0; i < 3; i++) { v += g + i; t.push(v); }
    return { t: t, kind: "non-linear", rule: "add one more each time than you added before",
      next: v + g + 3 };
  }
  const ptSteps = (t) => t.slice(1).map((v, i) => v - t[i]);
  const ptShowSeq = (el, t, withSteps) => {
    let h = "";
    t.forEach((v, i) => {
      if (i && withSteps) { const d = v - t[i - 1];
        h += '<span class="step">' + (d > 0 ? "+" : "−") + Math.abs(d) + "</span>"; }
      else if (i) h += '<span class="step">&rarr;</span>';
      h += '<span class="term4">' + v + "</span>";
    });
    el.innerHTML = h;
  };


  /* ---- 1: what taking away does to odd and even (4Nc.02) ----

     The addition half is the slide before this one. Subtraction is named in the
     objective too and was not taught anywhere; the interesting part is that the
     rule is the SAME one, which is only visible once both are on the page. */
  let pt1 = null, pt1lock = false;
  const pt1seen = {};
  function ptNew1() {
    for (let t = 0; t < 60; t++) {
      const a = rnd(6, 24), b = rnd(2, a - 2);
      if (a - b < 2) continue;
      return { a: a, b: b, d: a - b };
    }
    return { a: 12, b: 5, d: 7 };
  }
  function ptPaint1() {
    $("pteq1").innerHTML = pt1.a + " &minus; " + pt1.b + " = <span class='unk'>?</span>";
    $("ptpair1").innerHTML = ptRow(pt1.a, "t1") + '<div class="plus2">&minus;</div>' +
      ptRow(pt1.b, "t2");
    $("ptpick1").innerHTML = ["odd", "even"].map((k) =>
      '<button type="button" class="choice word" data-k="' + k + '">The answer is ' + k + "</button>").join("");
    const got = Object.keys(pt1seen).length;
    $("pttask1").textContent = "Combinations you have got right: " + got + " of 4 · " +
      "try odd − odd, even − even and one of each";
  }
  $("ptpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || pt1lock) return;
    pt1lock = true;
    const ok = b.dataset.k === ptPar(pt1.d);
    const combo = ptPar(pt1.a) + "-" + ptPar(pt1.b);
    if (ok) pt1seen[combo] = true;
    b.classList.add(ok ? "right" : "wrong");
    const leftovers = (pt1.a % 2) - (pt1.b % 2);
    lines($("ptwork1"), [
      { k: "The first", v: pt1.a + " pairs up with " + (pt1.a % 2 ? "<b>one left over</b>" : "<b>nothing left over</b>") + ", so it is " + ptPar(pt1.a) },
      { k: "Taking away", v: pt1.b + " pairs up with " + (pt1.b % 2 ? "<b>one left over</b>" : "<b>nothing left over</b>") + ", so it is " + ptPar(pt1.b) },
      { k: "The leftovers", v: leftovers === 0
        ? "either both had one spare and they cancel, or neither did &mdash; nothing is left over"
        : "only one of them had a spare, so a spare is still there at the end" },
      { k: "The rule", v: ptPar(pt1.a) + " &minus; " + ptPar(pt1.b) + " = <b>" + ptPar(pt1.d) +
        "</b>, exactly as it is for adding", total: true },
    ]);
    $("ptfb1").innerHTML = (ok ? cheer() + " " : "") + pt1.a + " &minus; " + pt1.b + " = <b>" +
      pt1.d + "</b>, which is <b>" + ptPar(pt1.d) + "</b>.";
    $("ptfb1").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb1").textContent);
    if (Object.keys(pt1seen).length >= 4) finish(0, "You know what taking away does to odd and even!");
    setTimeout(() => { pt1 = ptNew1(); pt1lock = false; ptPaint1(); }, 2200);
  });
  pt1 = ptNew1(); ptPaint1();

  /* ---- 2: the unknown as the first number, and as the whole (4Nc.03) ---- */
  let pt2 = null, pt2right = 0, pt2lock = false;
  function ptNew2() {
    const sh = PT_SHAPES[rnd(0, 3)];
    if (rnd(0, 1)) {                                  /* shape + known = total */
      const x = rnd(12, 48), a = rnd(9, 40);
      return { sh: sh, kind: "add", x: x, a: a, tot: x + a };
    }
    const a = rnd(8, 30), r = rnd(11, 45);            /* shape - known = what is left */
    return { sh: sh, kind: "take", x: a + r, a: a, r: r };
  }
  function ptPaint2() {
    const P = pt2;
    $("pteq2").innerHTML = P.kind === "add"
      ? "<span class='unk'>" + P.sh + "</span> + " + P.a + " = " + P.tot
      : "<span class='unk'>" + P.sh + "</span> &minus; " + P.a + " = " + P.r;
    $("ptbar2").innerHTML = P.kind === "add"
      ? ptBar([{ w: P.x, t: P.sh, known: false }, { w: P.a, t: P.a, known: true }], P.tot) +
        '<div class="btot">' + P.tot + " altogether</div>"
      : ptBar([{ w: P.r, t: P.r, known: true }, { w: P.a, t: P.a, known: true }], P.x) +
        '<div class="btot">' + P.sh + " altogether &mdash; and that is the part nobody has told you</div>";
    const opts = shuffle([P.x, P.x + rnd(2, 9), Math.max(1, P.x - rnd(2, 9))]);
    $("ptpick2").innerHTML = opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("pttask2").textContent = "Right so far: " + pt2right + " of 4";
  }
  $("ptpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || pt2lock) return;
    pt2lock = true;
    const P = pt2, ok = Number(b.dataset.v) === P.x;
    if (ok) pt2right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("ptwork2"), P.kind === "add" ? [
      { k: "What is known", v: "one part is " + P.a + ", and the whole is " + P.tot },
      { k: "The shape is", v: "the <b>other part</b>" },
      { k: "So take away", v: P.tot + " &minus; " + P.a + " = <b>" + P.x + "</b>" },
      { k: "Check it", v: P.x + " + " + P.a + " = " + P.tot + " ✓", total: true },
    ] : [
      { k: "What is known", v: "the bit taken off is " + P.a + ", and what is left is " + P.r },
      { k: "The shape is", v: "the <b>whole</b>, before anything was taken" },
      { k: "So add them back", v: P.r + " + " + P.a + " = <b>" + P.x + "</b>" },
      { k: "Check it", v: P.x + " &minus; " + P.a + " = " + P.r + " ✓", total: true },
    ]);
    $("ptfb2").innerHTML = (ok ? cheer() + " " : "The " + P.sh + " is " + P.x + ". ") +
      (P.kind === "add" ? "A missing <b>part</b> is found by taking the known part off the whole."
                        : "A missing <b>whole</b> is found by putting the pieces back together.");
    $("ptfb2").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb2").textContent);
    if (pt2right >= 4) finish(1, "You can find the shape wherever it stands!");
    setTimeout(() => { pt2 = ptNew2(); pt2lock = false; ptPaint2(); }, 2400);
  });
  pt2 = ptNew2(); ptPaint2();

  /* ---- 3: one shape used twice, and two different shapes (4Nc.03) ---- */
  let pt3 = null, pt3right = 0, pt3lock = false;
  function ptNew3() {
    const sh = PT_SHAPES[rnd(0, 3)];
    const k = rnd(0, 2);
    if (k < 2) {
      const n = k + 2, x = rnd(6, 24);               /* two or three of the same shape */
      return { sh: sh, n: n, x: x, tot: n * x, other: null };
    }
    let o = PT_SHAPES[rnd(0, 3)];
    while (o === sh) o = PT_SHAPES[rnd(0, 3)];
    const x = rnd(8, 30), ov = rnd(5, 25);
    return { sh: sh, n: 1, x: x, tot: x + ov, other: o, ov: ov };
  }
  function ptPaint3() {
    const P = pt3;
    $("pteq3").innerHTML = P.other
      ? "<span class='unk'>" + P.sh + "</span> + <span class='unk'>" + P.other + "</span> = " + P.tot +
        "<br><span class='unk'>" + P.other + "</span> = " + P.ov
      : new Array(P.n).fill("<span class='unk'>" + P.sh + "</span>").join(" + ") + " = " + P.tot;
    const parts = P.other
      ? [{ w: P.x, t: P.sh, known: false }, { w: P.ov, t: P.ov, known: true }]
      : new Array(P.n).fill(0).map(() => ({ w: P.x, t: P.sh, known: false }));
    $("ptbar3").innerHTML = ptBar(parts, P.tot) + '<div class="btot">' + P.tot + " altogether</div>";
    $("ptpick3").innerHTML = shuffle([P.x, P.x + rnd(1, 6), Math.max(1, P.x - rnd(1, 6))])
      .map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("pttask3").textContent = "Right so far: " + pt3right + " of 4";
  }
  $("ptpick3").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || pt3lock) return;
    pt3lock = true;
    const P = pt3, ok = Number(b.dataset.v) === P.x;
    if (ok) pt3right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("ptwork3"), P.other ? [
      { k: "Two shapes", v: "they are different shapes, so they are <b>different numbers</b>" },
      { k: "One is given", v: P.other + " = " + P.ov },
      { k: "So take it off", v: P.tot + " &minus; " + P.ov + " = <b>" + P.x + "</b>" },
      { k: "Check it", v: P.x + " + " + P.ov + " = " + P.tot + " ✓", total: true },
    ] : [
      { k: "The same shape", v: "it appears <b>" + P.n + "</b> times, and it is the same number each time" },
      { k: "So the total", v: "is made of <b>" + P.n + " equal parts</b>" },
      { k: "Share it out", v: P.tot + " ÷ " + P.n + " = <b>" + P.x + "</b>" },
      { k: "Check it", v: new Array(P.n).fill(P.x).join(" + ") + " = " + P.tot + " ✓", total: true },
    ]);
    $("ptfb3").innerHTML = (ok ? cheer() + " " : "The " + P.sh + " is " + P.x + ". ") +
      (P.other ? "<b>Different shapes</b> are different numbers, so the one you are told lets you find the other."
               : "The <b>same shape</b> is the same number every time, so the total splits into equal parts.");
    $("ptfb3").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb3").textContent);
    if (pt3right >= 4) finish(2, "You can work with a shape used more than once!");
    setTimeout(() => { pt3 = ptNew3(); pt3lock = false; ptPaint3(); }, 2400);
  });
  pt3 = ptNew3(); ptPaint3();

  /* ---- 4: same step, or changing step? (4Nc.04) ---- */
  let pt4 = null, pt4right = 0, pt4lock = false;
  const pt4seen = {};
  function ptPaint4() {
    ptShowSeq($("ptseq4"), pt4.t, false);
    $("ptq4").innerHTML = "Does this sequence take the <b>same step</b> every time?";
    $("ptpick4").innerHTML = [["linear", "Same step — linear"], ["non-linear", "Changing step — non-linear"]]
      .map((o) => '<button type="button" class="choice word" data-k="' + o[0] + '">' + o[1] + "</button>").join("");
    $("pttask4").textContent = "Right so far: " + pt4right + " of 4";
  }
  $("ptpick4").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || pt4lock) return;
    pt4lock = true;
    const ok = b.dataset.k === pt4.kind;
    if (ok) { pt4right++; pt4seen[pt4.kind] = true; }
    b.classList.add(ok ? "right" : "wrong");
    ptShowSeq($("ptseq4"), pt4.t, true);
    const st = ptSteps(pt4.t);
    lines($("ptwork4"), [
      { k: "The steps", v: "<b>" + st.map((d) => (d > 0 ? "+" : "−") + Math.abs(d)).join(", ") + "</b>" },
      { k: "Are they the same?", v: pt4.kind === "linear" ? "yes, every step is the same size" : "no, they change" },
      { k: "So it is", v: "<b>" + pt4.kind + "</b>", total: true },
    ]);
    $("ptfb4").innerHTML = (ok ? cheer() + " " : "It is " + pt4.kind + ". ") +
      "Linear means the <b>same step</b> every time. It does not mean the numbers are small or easy.";
    $("ptfb4").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb4").textContent);
    if (pt4right >= 4 && pt4seen.linear && pt4seen["non-linear"]) finish(3, "You can tell linear from non-linear!");
    setTimeout(() => { pt4 = ptSeq(); pt4lock = false; ptPaint4(); }, 2400);
  });
  pt4 = ptSeq(); ptPaint4();

  /* ---- 5: naming the term-to-term rule (4Nc.04) ---- */
  let pt5 = null, pt5right = 0, pt5lock = false, pt5opts = [];
  function ptPaint5() {
    ptShowSeq($("ptseq5"), pt5.t, false);
    $("ptq5").innerHTML = "What is the <b>term-to-term rule</b>?";
    /* Wrong rules are drawn from OTHER generated sequences, so each one is a rule
       somebody could really mean rather than a made-up sentence. */
    const wrong = [];
    for (let g = 0; g < 40 && wrong.length < 2; g++) {
      const c = ptSeq();
      if (c.rule !== pt5.rule && wrong.indexOf(c.rule) < 0) wrong.push(c.rule);
    }
    pt5opts = shuffle([pt5.rule].concat(wrong));
    $("ptpick5").innerHTML = pt5opts.map((r, i) =>
      '<button type="button" class="choice word" data-i="' + i + '">' + r + "</button>").join("");
    $("pttask5").textContent = "Right so far: " + pt5right + " of 4";
  }
  $("ptpick5").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b || pt5lock) return;
    pt5lock = true;
    const ok = pt5opts[Number(b.dataset.i)] === pt5.rule;
    if (ok) pt5right++;
    b.classList.add(ok ? "right" : "wrong");
    ptShowSeq($("ptseq5"), pt5.t.concat([pt5.next]), true);
    const st = ptSteps(pt5.t);
    lines($("ptwork5"), [
      { k: "The steps", v: "<b>" + st.map((d) => (d > 0 ? "+" : "−") + Math.abs(d)).join(", ") + "</b>" },
      { k: "The rule", v: "<b>" + pt5.rule + "</b>" },
      { k: "Using it once", v: "the term after " + pt5.t[3] + " is <b>" + pt5.next + "</b>" },
      { k: "Why the rule is worth more", v: "it gives you every term there will ever be, not just the next one", total: true },
    ]);
    $("ptfb5").innerHTML = (ok ? cheer() + " " : "The rule is to " + pt5.rule + ". ") +
      "A <b>term-to-term</b> rule tells you how to get from any term to the one after it.";
    $("ptfb5").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb5").textContent);
    if (pt5right >= 4) finish(4, "You can say the rule, not just the next number!");
    setTimeout(() => { pt5 = ptSeq(); pt5lock = false; ptPaint5(); }, 2600);
  });
  pt5 = ptSeq(); ptPaint5();

  /* ---- 6: the L between one square number and the next (4Nc.05) ---- */
  let pt6 = null, pt6right = 0, pt6lock = false;
  function ptNew6() { const n = rnd(2, 7); return { n: n, add: 2 * n + 1 }; }
  function ptPaint6() {
    const n = pt6.n;
    let h = "";
    for (let r = 0; r < n + 1; r++) {
      h += '<div class="sqrow">';
      for (let c = 0; c < n + 1; c++) h += "<i" + (r === n || c === n ? ' class="edge"' : "") + "></i>";
      h += "</div>";
    }
    $("ptsq6").innerHTML = h;
    $("ptq6").innerHTML = "A <b>" + n + " by " + n + "</b> square is being grown into a <b>" +
      (n + 1) + " by " + (n + 1) + "</b> one. How many dots are in the <b>L</b>?";
    $("ptpick6").innerHTML = pick3(pt6.add, [2 * n, n + 1, 2 * n + 2])
      .map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("pttask6").textContent = "Right so far: " + pt6right + " of 4";
  }
  $("ptpick6").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || pt6lock) return;
    pt6lock = true;
    const n = pt6.n, ok = Number(b.dataset.v) === pt6.add;
    if (ok) pt6right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("ptwork6"), [
      { k: "Down the side", v: "<b>" + n + "</b> new dots" },
      { k: "Along the bottom", v: "<b>" + n + "</b> new dots" },
      { k: "And the corner", v: "<b>1</b> more, where the two arms meet" },
      { k: "So the L holds", v: n + " + " + n + " + 1 = <b>" + pt6.add + "</b>", total: true },
      { k: "Check the squares", v: n + " × " + n + " = " + n * n + ", and " + (n + 1) + " × " +
        (n + 1) + " = " + (n + 1) * (n + 1) + ", a difference of <b>" + pt6.add + "</b>" },
      { k: "The pattern", v: "every L is the next <b>odd</b> number: 3, 5, 7, 9, 11 …" },
    ]);
    $("ptfb6").innerHTML = (ok ? cheer() + " " : "It is " + pt6.add + ". ") +
      "Two arms of <b>" + n + "</b> and the <b>one</b> corner dot &mdash; which is why the gaps between square numbers are the odd numbers.";
    $("ptfb6").className = "fb " + (ok ? "good" : "bad");
    say($("ptfb6").textContent);
    if (pt6right >= 4) finish(5, "You know what sits between one square and the next!");
    setTimeout(() => { pt6 = ptNew6(); pt6lock = false; ptPaint6(); }, 2600);
  });
  pt6 = ptNew6(); ptPaint6();

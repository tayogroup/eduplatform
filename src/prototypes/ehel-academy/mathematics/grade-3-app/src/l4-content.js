
  /* ==================================================================
     EQUAL PARTS - Grade 3 fractions.
     Cambridge Primary Mathematics 0096, Stage 3 (3Nf.01 - 3Nf.08).
     Stage 3 fractions are halves, thirds, quarters, fifths and tenths.
     Nothing here is ever cut into a denominator outside that set.
     ================================================================== */

  const DENS = [2, 3, 4, 5, 10];
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
  const NAMES = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"], 10: ["tenth", "tenths"] };
  function fracName(n, d) { const nm = NAMES[d]; return nm ? n + " " + nm[n === 1 ? 0 : 1] : n + "/" + d; }
  function fracHTML(n, d) { return '<span class="frac"><span class="num">' + n + '</span><span class="den">' + d + "</span></span>"; }
  function bar(host, d, on, second) {
    let h = "";
    for (let i = 0; i < d; i++) h += '<i class="' + (i < on ? "on" + (second && i >= second ? " b" : "") : "") + '"></i>';
    $(host).innerHTML = h;
  }

  /* ---- 1: equal parts or not ---- 3Nf.01 fractions are SEVERAL EQUAL PARTS */
  let got1 = 0, asked1 = 0;
  function shapeSvg(kind, d, on, equal) {
    /* a circle cut into d sectors; when equal is false one cut is moved so the parts differ */
    const cx = 70, cy = 70, r = 58;
    let h = '<svg class="fsvg" viewBox="0 0 140 140" role="img" aria-label="a shape cut into parts">';
    const bounds = [];
    if (equal) { for (let i = 0; i <= d; i++) bounds.push(i * 360 / d); }
    else {
      /* shift one boundary well off centre so at least two parts are visibly different */
      const shift = 360 / d / 2;
      for (let i = 0; i <= d; i++) bounds.push(i === 1 ? 360 / d + shift : i * 360 / d);
    }
    for (let i = 0; i < d; i++) {
      const a0 = (bounds[i] - 90) * Math.PI / 180, a1 = (bounds[i + 1] - 90) * Math.PI / 180;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const big = bounds[i + 1] - bounds[i] > 180 ? 1 : 0;
      h += '<path class="part' + (i < on ? " on" : "") + '" d="M' + cx + " " + cy + " L" + x0.toFixed(1) + " " + y0.toFixed(1) + " A" + r + " " + r + " 0 " + big + " 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + ' Z"></path>';
    }
    h += '<circle class="whole" cx="' + cx + '" cy="' + cy + '" r="' + r + '"></circle></svg>';
    return h;
  }
  function round1() {
    const d = DENS[rnd(0, DENS.length - 1)] === 10 ? 5 : DENS[rnd(0, 3)];
    const rightIdx = rnd(0, 2);
    let h = "";
    for (let i = 0; i < 3; i++) {
      const eq = i === rightIdx;
      h += '<div class="fcard" role="button" tabindex="0" aria-label="Shape ' + (i + 1) + '" data-i="' + i + '" data-eq="' + (eq ? 1 : 0) + '">' + shapeSvg(0, d, 0, eq) + '<span class="cap">' + (i + 1) + "</span></div>";
    }
    $("sh1").innerHTML = h;
    $("say1").innerHTML = "One of these is cut into <b>" + d + " equal parts</b>. Tap it.";
    $("sh1").onclick = (e) => {
      const c = e.target.closest(".fcard"); if (!c || $("sh1").dataset.live === "0") return;
      $("sh1").dataset.live = "0";
      const ok = c.dataset.eq === "1";
      asked1++; if (ok) got1++;
      $("fb1").className = "fb " + (ok ? "good" : "");
      $("fb1").textContent = (ok ? cheer() + " " : "Look again. ") + "Only equal parts are fractions - if one piece is bigger than another, the shape is cut into parts but not into " + NAMES[d][1] + ".";
      say(ok ? cheer() : "The parts have to be equal");
      scoreLine("sc1", got1, asked1, 4);
      if (got1 >= 4) finish(0, "");
      setTimeout(round1, 2000);
    };
    $("sh1").dataset.live = "1";
  }
  round1();

  /* ---- 2: all the parts make one whole ---- 3Nf.01 all the parts taken together equal one whole */
  let d2 = 4, on2 = 0;
  function paint2() {
    bar("bar2", d2, on2);
    $("show2").innerHTML = fracHTML(on2, d2) + (on2 === d2 ? " = 1 whole" : "");
    $("fb2").className = "fb" + (on2 === d2 ? " good" : "");
    $("fb2").textContent = on2 === d2
      ? "All " + d2 + " " + NAMES[d2][1] + " together make one whole - not nearly one, exactly one."
      : fracName(on2, d2) + " coloured, " + (d2 - on2) + " to go.";
    if (on2 === d2) finish(1, "");
  }
  $("den2").innerHTML = DENS.map((v) => '<button type="button" class="' + (v === d2 ? "on" : "") + '" data-v="' + v + '">' + NAMES[v][1] + "</button>").join("");
  $("den2").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    d2 = Number(b.dataset.v); on2 = 0;
    $("den2").innerHTML = DENS.map((v) => '<button type="button" class="' + (v === d2 ? "on" : "") + '" data-v="' + v + '">' + NAMES[v][1] + "</button>").join("");
    paint2(); say("Cut into " + d2 + " " + NAMES[d2][1]);
  });
  $("bar2").addEventListener("click", () => { on2 = on2 >= d2 ? 0 : on2 + 1; paint2(); say(fracName(on2, d2)); });
  paint2();

  /* ---- 3: same fraction, different shape ---- 3Nf.02 regardless of their shape or orientation */
  let got3 = 0, asked3 = 0;
  function round3() {
    const d = [2, 3, 4][rnd(0, 2)], n = 1;
    /* three cards show the target fraction shaded; three show a different one */
    const cards = [];
    for (let i = 0; i < 3; i++) cards.push({ d: d, n: n, match: true, rot: rnd(0, 3) });
    for (let i = 0; i < 3; i++) { let dd = [2, 3, 4, 5][rnd(0, 3)]; if (dd === d) dd = d === 2 ? 4 : 2; cards.push({ d: dd, n: 1, match: false, rot: rnd(0, 3) }); }
    const all = shuffle(cards);
    $("sh3").innerHTML = all.map((c, i) =>
      '<div class="fcard" role="button" tabindex="0" aria-label="Picture ' + (i + 1) + '" data-i="' + i + '" data-m="' + (c.match ? 1 : 0) + '" style="transform:rotate(' + c.rot * 30 + 'deg)">' + shapeSvg(0, c.d, c.n, true) + "</div>").join("");
    $("say3").innerHTML = "Tap every picture showing " + fracHTML(n, d) + " (" + fracName(n, d) + "). There are <b>three</b>.";
    let found = 0;
    $("sh3").onclick = (e) => {
      const c = e.target.closest(".fcard"); if (!c || c.dataset.spent) return;
      c.dataset.spent = "1";
      if (c.dataset.m === "1") { c.classList.add("sel"); found++; say("yes"); }
      else { c.style.opacity = ".3"; $("fb3").className = "fb"; $("fb3").textContent = "That one is not " + fracName(n, d) + "."; say("not that one"); return; }
      if (found === 3) {
        asked3++; got3++;
        $("fb3").className = "fb good";
        $("fb3").textContent = cheer() + " Different shapes, turned different ways - all of them " + fracName(n, d) + ". The shape does not decide the fraction; the size of the part does.";
        scoreLine("sc3", got3, asked3, 3);
        if (got3 >= 3) finish(2, "");
        setTimeout(round3, 2600);
      }
    };
  }
  round3();

  /* ---- 4: a fraction of a set ---- 3Nf.03 fractions can describe equal parts of a quantity or set */
  let got4 = 0, asked4 = 0;
  function round4() {
    const d = [2, 3, 4, 5][rnd(0, 3)];
    const each = rnd(2, 5), total = d * each;
    const n = rnd(1, d - 1);
    const answer = each * n;
    $("set4").innerHTML = Array.from({ length: total }, (_, i) => '<i class="' + (i < answer ? "on" : "") + '"></i>').join("");
    $("say4").innerHTML = ["Zara", "Yusuf", "Leila", "Ali"][rnd(0, 3)] + " has <b>" + total + "</b> beads. What is " + fracHTML(n, d) + " of them?";
    const opts = [answer];
    [d, each, answer + each, Math.max(1, answer - each), n].forEach((c) => { if (opts.length < 4 && c > 0 && !opts.includes(c)) opts.push(c); });
    offer("ch4", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch4", b, ok)) return;
      asked4++; if (ok) got4++;
      $("fb4").className = "fb " + (ok ? "good" : "");
      $("fb4").textContent = (ok ? cheer() + " " : "") + "Share " + total + " into " + d + " equal piles of " + each + ", then take " + n + " pile" + (n === 1 ? "" : "s") + ": " + answer + ".";
      say(ok ? cheer() : fracName(n, d) + " of " + total + " is " + answer);
      scoreLine("sc4", got4, asked4, 4);
      if (got4 >= 4) finish(3, "");
      setTimeout(round4, 2300);
    });
  }
  round4();

  /* ---- 5: the line means divide ---- 3Nf.04 a fraction as a division of the numerator by the denominator */
  let got5 = 0, asked5 = 0;
  function round5() {
    /* the objective names half, quarter and three-quarters only */
    const which = [[1, 2], [1, 4], [3, 4]][rnd(0, 2)];
    const n = which[0], d = which[1];
    $("q5").innerHTML = fracHTML(n, d);
    $("say5").innerHTML = "Which division does " + fracHTML(n, d) + " mean?";
    const right = n + " ÷ " + d;
    const opts = [right, d + " ÷ " + n, n + " ÷ " + (d + 1), (n + 1) + " ÷ " + d].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
    offer("ch5", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch5", b, ok)) return;
      asked5++; if (ok) got5++;
      $("fb5").className = "fb " + (ok ? "good" : "");
      $("fb5").textContent = (ok ? cheer() + " " : "") + fracName(n, d) + " means " + n + " shared between " + d + ". The line is a dividing line.";
      say(ok ? cheer() : fracName(n, d) + " means " + n + " divided by " + d);
      scoreLine("sc5", got5, asked5, 3);
      if (got5 >= 3) finish(4, "");
      setTimeout(round5, 2100);
    });
  }
  round5();

  /* ---- 6: a fraction of a number ---- 3Nf.05 fractions (half, quarter, three-quarters, third and tenth) can act as operators */
  const OPS = [[1, 2], [1, 4], [3, 4], [1, 3], [1, 10]];
  let got6 = 0, asked6 = 0;
  function round6() {
    const [n, d] = OPS[rnd(0, OPS.length - 1)];
    const each = rnd(2, 9), total = d * each;
    const answer = each * n;
    $("q6").innerHTML = fracHTML(n, d) + " of " + total;
    $("say6").innerHTML = ["Amina", "Omar", "Hodan", "Musa"][rnd(0, 3)] + " has <b>" + total + "</b> shillings. What is " + fracHTML(n, d) + " of that?";
    $("hint6").className = "fb";
    $("hint6").textContent = "Divide by " + d + " to find one part, then multiply by " + n + ".";
    const opts = [answer];
    [each, total - answer, answer + each, Math.max(1, answer - each), total / 2].forEach((c) => { if (opts.length < 4 && Number.isInteger(c) && c > 0 && !opts.includes(c)) opts.push(c); });
    offer("ch6", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch6", b, ok)) return;
      asked6++; if (ok) got6++;
      $("fb6").className = "fb " + (ok ? "good" : "");
      $("fb6").textContent = (ok ? cheer() + " " : "") + total + " ÷ " + d + " = " + each + ", then " + each + " × " + n + " = " + answer + ".";
      say(ok ? cheer() : total + " divided by " + d + " is " + each + ", times " + n + " is " + answer);
      scoreLine("sc6", got6, asked6, 4);
      if (got6 >= 4) finish(5, "");
      setTimeout(round6, 2400);
    });
  }
  round6();

  /* ---- 7: equivalence ---- 3Nf.06 recognise that two fractions can have an equivalent value (halves, quarters, fifths and tenths) */
  /* 3Nf.06 names halves, quarters, fifths and tenths - and nothing else.
     Eighths are not a Stage 3 denominator, so no pair here may use one. */
  const EQUIV = [[1, 2, 2, 4], [2, 4, 1, 2], [1, 2, 5, 10], [5, 10, 1, 2], [1, 5, 2, 10], [2, 10, 1, 5],
                 [2, 5, 4, 10], [4, 10, 2, 5], [3, 5, 6, 10], [6, 10, 3, 5], [4, 5, 8, 10], [8, 10, 4, 5]];
  let got7 = 0, asked7 = 0;
  function round7() {
    const [n1, d1, n2, d2] = EQUIV[rnd(0, EQUIV.length - 1)];
    bar("barA7", d1, n1);
    bar("barB7", d2, n2);
    $("q7").innerHTML = fracHTML(n1, d1) + " = ?";
    $("say7").innerHTML = "Which fraction is worth the same as " + fracHTML(n1, d1) + "?";
    const right = n2 + "/" + d2;
    const opts = [right];
    [n2 + 1 + "/" + d2, Math.max(1, n2 - 1) + "/" + d2, n1 + "/" + d2, n2 + "/" + d1].forEach((c) => { if (opts.length < 4 && !opts.includes(c)) opts.push(c); });
    offer("ch7", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch7", b, ok)) return;
      asked7++; if (ok) got7++;
      $("fb7").className = "fb " + (ok ? "good" : "");
      $("fb7").textContent = (ok ? cheer() + " " : "") + fracName(n1, d1) + " and " + fracName(n2, d2) + " colour exactly the same amount of the bar. Bigger numbers do not mean a bigger fraction.";
      say(ok ? cheer() : fracName(n1, d1) + " is the same as " + fracName(n2, d2));
      scoreLine("sc7", got7, asked7, 4);
      if (got7 >= 4) finish(6, "");
      setTimeout(round7, 2400);
    });
  }
  round7();

  /* ---- 8: add and subtract with the same denominator ---- 3Nf.07 within one whole */
  let got8 = 0, asked8 = 0;
  function round8() {
    const d = DENS[rnd(0, DENS.length - 1)];
    const adding = rnd(0, 1) === 1;
    let a, b2, answer;
    if (adding) { a = rnd(1, d - 2); b2 = rnd(1, d - 1 - a); answer = a + b2; }
    else { a = rnd(2, d); b2 = rnd(1, a - 1); answer = a - b2; }
    bar("bar8", d, adding ? a + b2 : a, adding ? a : null);
    $("q8").innerHTML = fracHTML(a, d) + (adding ? " + " : " − ") + fracHTML(b2, d) + " = ?";
    $("say8").innerHTML = "What is " + fracHTML(a, d) + (adding ? " + " : " − ") + fracHTML(b2, d) + "?";
    const right = answer + "/" + d;
    const opts = [right];
    /* the classic error: adding the bottoms too */
    [(adding ? a + b2 : a - b2) + "/" + (d + d), Math.min(d, answer + 1) + "/" + d, Math.max(1, answer - 1) + "/" + d].forEach((c) => { if (opts.length < 4 && !opts.includes(c)) opts.push(c); });
    offer("ch8", opts, right, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = btn.dataset.v === right;
      if (!mark("ch8", btn, ok)) return;
      asked8++; if (ok) got8++;
      $("fb8").className = "fb " + (ok ? "good" : "");
      $("fb8").textContent = (ok ? cheer() + " " : "") + a + (adding ? " + " : " − ") + b2 + " = " + answer + " pieces, and they are still " + NAMES[d][1] + ". The bottom number never changes.";
      say(ok ? cheer() : "The answer is " + fracName(answer, d));
      scoreLine("sc8", got8, asked8, 4);
      if (got8 >= 4) finish(7, "");
      setTimeout(round8, 2400);
    });
  }
  round8();

  /* ---- 9: compare ---- 3Nf.08 compare and order unit fractions and fractions with the same denominator using =, > and < */
  let got9 = 0, asked9 = 0;
  /* 3Nf.08 asks the learner to compare AND ORDER, so every other round puts
     three fractions up and asks for them in order rather than a single sign. */
  function showRow(which) {
    ["cmpA9", "cmp9", "cmpB9"].forEach((id) => { $(id).style.display = which === "compare" ? "" : "none"; });
    $("ord9").style.display = which === "order" ? "" : "none";
  }
  function barHTML(n, d) {
    let h = "";
    for (let i = 0; i < d; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>';
    return '<div style="display:flex;align-items:center;gap:10px;margin:8px 0"><span style="min-width:56px">' + fracHTML(n, d) + '</span><div class="fbar" style="height:34px;flex:1">' + h + "</div></div>";
  }
  function round9order() {
    showRow("order");
    const sameDen = rnd(0, 1) === 1;
    let set;
    if (sameDen) {
      const d = DENS[rnd(0, DENS.length - 1)];
      const ns = shuffle([...Array(d).keys()].map((k) => k + 1)).slice(0, 3).sort((a, b) => a - b);
      if (ns.length < 3) return round9();
      set = ns.map((n) => [n, d]);
    } else {
      const ds = shuffle(DENS).slice(0, 3);
      set = ds.map((d) => [1, d]);
    }
    const shown = shuffle(set);
    $("ord9").innerHTML = shown.map(([n, d]) => barHTML(n, d)).join("");
    $("say9").innerHTML = "Put these three in order, <b>smallest first</b>.";
    const asc = set.slice().sort((a, b) => a[0] / a[1] - b[0] / b[1]);
    const label = (list) => list.map(([n, d]) => n + "/" + d).join(" < ");
    const right = label(asc);
    const opts = [right, label(asc.slice().reverse()), label([asc[1], asc[0], asc[2]])].filter((v, i, a) => a.indexOf(v) === i);
    offer("ch9", opts, right, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = btn.dataset.v === right;
      if (!mark("ch9", btn, ok)) return;
      asked9++; if (ok) got9++;
      $("fb9").className = "fb " + (ok ? "good" : "");
      $("fb9").textContent = (ok ? cheer() + " " : "") + right + ". " + (sameDen ? "Same size pieces, so more pieces is more." : "Every one is a single piece, so the bigger the bottom number the smaller the piece.");
      say(ok ? cheer() : "In order: " + right.replace(/</g, "then"));
      scoreLine("sc9", got9, asked9, 4);
      if (got9 >= 4) finish(8, "");
      setTimeout(round9, 2600);
    });
  }
  function round9() {
    if (rnd(0, 1) === 1) return round9order();
    showRow("compare");
    const sameDen = rnd(0, 1) === 1;
    let n1, d1, n2, d2;
    if (sameDen) { const d = DENS[rnd(0, DENS.length - 1)]; d1 = d2 = d; n1 = rnd(1, d); do { n2 = rnd(1, d); } while (n2 === n1 && rnd(0, 3)); }
    else { n1 = n2 = 1; d1 = DENS[rnd(0, DENS.length - 1)]; do { d2 = DENS[rnd(0, DENS.length - 1)]; } while (d2 === d1 && rnd(0, 3)); }
    bar("cmpA9", d1, n1); bar("cmpB9", d2, n2);
    const v1 = n1 / d1, v2 = n2 / d2;
    const right = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
    $("cmp9").innerHTML = fracHTML(n1, d1) + '<span class="slot">?</span>' + fracHTML(n2, d2);
    $("say9").innerHTML = "Which sign goes between " + fracHTML(n1, d1) + " and " + fracHTML(n2, d2) + "?";
    $("ch9").innerHTML = [">", "<", "="].map((o) => '<button type="button" class="choice" data-v="' + o + '" style="font-size:30px">' + o + "</button>").join("");
    $("ch9").dataset.right = right; $("ch9").dataset.live = "1";
    $("ch9").onclick = (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = btn.dataset.v === right;
      if (!mark("ch9", btn, ok)) return;
      asked9++; if (ok) got9++;
      $("cmp9").innerHTML = fracHTML(n1, d1) + '<span class="slot">' + right + "</span>" + fracHTML(n2, d2);
      const why = right === "=" ? "They colour the same amount."
        : sameDen ? "Same size pieces, so more pieces wins."
        : "Both are one piece, but sharing between " + Math.min(d1, d2) + " gives a bigger piece than sharing between " + Math.max(d1, d2) + " - the bigger bottom number makes the smaller piece.";
      $("fb9").className = "fb " + (ok ? "good" : "");
      $("fb9").textContent = (ok ? cheer() + " " : "") + why;
      say(ok ? cheer() : why);
      scoreLine("sc9", got9, asked9, 4);
      if (got9 >= 4) finish(8, "");
      setTimeout(round9, 2400);
    };
  }
  round9();

  /* ---- 10: check ---- */
  const QS = [
    () => { const d = [2, 4, 5, 10][rnd(0, 3)], e2 = rnd(2, 6), tot = d * e2; return { q: "What is 1/" + d + " of " + tot + "?", opts: [e2, d, tot - e2], a: e2, why: tot + " ÷ " + d + " = " + e2 + "." }; },
    () => { const d = [3, 4, 5][rnd(0, 2)], e2 = rnd(2, 5), tot = d * e2, n = d - 1; return { q: "What is " + n + "/" + d + " of " + tot + "?", opts: [e2 * n, e2, tot], a: e2 * n, why: tot + " ÷ " + d + " = " + e2 + ", then × " + n + " = " + e2 * n + "." }; },
    () => { const d = [4, 5, 10][rnd(0, 2)], a = 1, b2 = 1; return { q: a + "/" + d + " + " + b2 + "/" + d + " = ?", opts: [(a + b2) + "/" + d, (a + b2) + "/" + (d + d), a + "/" + d], a: (a + b2) + "/" + d, why: "Count the pieces; the bottom number stays " + d + "." }; },
    () => { const d = [4, 5, 10][rnd(0, 2)]; return { q: "How many " + NAMES[d][1] + " make one whole?", opts: [d, d - 1, d + 1], a: d, why: "All " + d + " " + NAMES[d][1] + " together are one whole." }; },
    () => { return { q: "Which is bigger, 1/4 or 1/10?", opts: ["1/4", "1/10", "they are equal"], a: "1/4", why: "Sharing between 4 gives a bigger piece than sharing between 10." }; },
    () => { const d = [4, 5, 10][rnd(0, 2)], n = rnd(2, d - 1); return { q: "Which is bigger, " + n + "/" + d + " or " + (n - 1) + "/" + d + "?", opts: [n + "/" + d, (n - 1) + "/" + d, "they are equal"], a: n + "/" + d, why: "Same size pieces, so more pieces is more." }; },
    () => { return { q: "1/2 is the same as which fraction?", opts: ["5/10", "2/10", "1/10"], a: "5/10", why: "Five tenths colours exactly half the bar." }; },
    () => { return { q: "What does the line in 3/4 mean?", opts: ["3 shared between 4", "4 shared between 3", "3 add 4"], a: "3 shared between 4", why: "The fraction line is a dividing line." }; },
    () => { const d = [3, 4, 5][rnd(0, 2)]; return { q: "A shape is cut into " + d + " pieces, but one piece is bigger than the rest. Are they " + NAMES[d][1] + "?", opts: ["no", "yes"], a: "no", why: "Fractions must be equal parts." }; },
    () => { return { q: "Two shapes look different but each has half shaded. Is the shaded amount the same?", opts: ["yes", "no"], a: "yes", why: "The shape does not decide the fraction; the size of the part does." }; }
  ];
  let qi = 0, got10 = 0, order10 = [];
  function round10() {
    if (qi >= order10.length) {
      $("q10").textContent = ""; $("ch10").innerHTML = "";
      $("fb10").className = "fb good"; $("fb10").textContent = "Finished! " + got10 + " out of " + order10.length + ".";
      $("sc10").textContent = "";
      if (got10 >= 8) finish(9, "You have finished the check.");
      else retryCheck($("fb10"), $("ch10"), got10, order10.length, 8, function () { qi = 0; got10 = 0; order10 = shuffle(QS); round10(); });
      return;
    }
    const item = nextQ(order10[qi]);
    $("sc10").textContent = "Question " + (qi + 1) + " of " + order10.length + " \u00b7 " + got10 + " right";
    $("q10").textContent = item.q; $("say10").textContent = item.q;
    offer("ch10", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch10", b, ok)) return;
      if (ok) got10++;
      qi++;
      $("fb10").className = "fb " + (ok ? "good" : "");
      $("fb10").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc10").textContent = "Question " + qi + " of " + order10.length + " \u00b7 " + got10 + " right";
      setTimeout(round10, 2100);
    });
  }
  order10 = shuffle(QS);
  round10();

  /* ---- 11: stickers ---- */
  const STICKERS = [
    ["✂️", "Equal parts"], ["🥧", "All the parts make one"], ["🔷", "Same fraction, different shape"], ["🍬", "A fraction of a group"],
    ["➗", "The line means divide"], ["🔢", "A fraction of a number"], ["⚖️", "The same, in different pieces"], ["➕", "Adding pieces"],
    ["📏", "Which is bigger"], ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb11").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb11").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You understand fractions." : got + " of " + STICKERS.length + " stickers so far.";
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
            "A shape cut into 4 pieces is not always cut into quarters.",
            "Quarters have to be four equal pieces, and these are not the same size.",
            [
                  "Quarters have to be square.",
                  "You can only make quarters from a circle."
            ],
            "Equal is the word that does the work. Four pieces is not enough on its own."
      ],
      [
            "One half and five tenths are worth the same.",
            "Both colour exactly half the bar - the pieces are just smaller and there are more of them.",
            [
                  "5 and 10 are bigger numbers, so five tenths is bigger.",
                  "They both have a 5 in them."
            ],
            "Bigger numbers do not make a bigger fraction."
      ],
      [
            "One quarter is bigger than one tenth.",
            "Sharing between 4 gives everybody a bigger piece than sharing between 10.",
            [
                  "4 is smaller than 10, so one quarter is smaller.",
                  "They are both one piece, so they are equal."
            ],
            "With single pieces the bigger bottom number makes the smaller piece."
      ],
      [
            "Two fifths plus one fifth is three fifths, not three tenths.",
            "You counted pieces without changing their size, so the bottom number stays 5.",
            [
                  "5 + 5 = 10, so the bottom becomes 10.",
                  "2 + 1 = 3, so the answer is just 3."
            ],
            "The bottom number says how big each piece is. Adding pieces does not make them smaller."
      ],
      [
            "Three quarters of 20 is 15.",
            "20 ÷ 4 = 5 for one quarter, then 5 × 3 = 15 for three of them.",
            [
                  "3 × 4 = 12, and 20 − 12 = 8.",
                  "20 − 4 − 3 = 13."
            ],
            "Divide by the bottom to find one part, then multiply by the top."
      ],
      [
            "Two shapes can look completely different and both show one half.",
            "What makes it a half is the size of the part next to the whole, not the shape it happens to be.",
            [
                  "Only if the two shapes are the same size.",
                  "Only if both are cut straight down the middle."
            ],
            "A square cut corner to corner and a circle cut across are both halves."
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


  /* ==================================================================
     UP TO A THOUSAND - Grade 3 Number.

     Cambridge Primary Mathematics 0096, Stage 3. Every step below is
     written against a named objective and the objective is quoted in the
     comment above it, so a later reader can check the teaching against
     the framework without leaving the file.
     ================================================================== */

  const ONESW = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const TENSW = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function words(n) {
    if (n < 20) return ONESW[n];
    if (n < 100) { const t = Math.floor(n / 10), o = n % 10; return TENSW[t] + (o ? "-" + ONESW[o] : ""); }
    const h = Math.floor(n / 100), r = n % 100;
    return ONESW[h] + " hundred" + (r ? " and " + words(r) : "");
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function pick(arr, n) { return shuffle(arr).slice(0, n); }
  /* every choice list is shuffled, so the right answer is never in the same place twice */
  function offer(host, opts, right, onPick) {
    $(host).innerHTML = shuffle(opts).map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $(host).dataset.right = String(right);
    $(host).dataset.live = "1";
    $(host).onclick = onPick;
  }
  function mark(host, btn, ok) {
    if ($(host).dataset.live !== "1") return false;
    $(host).dataset.live = "0";
    [...$(host).querySelectorAll(".choice")].forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? "right" : "wrong");
    if (!ok) { const r = $(host).dataset.right; [...$(host).querySelectorAll(".choice")].forEach((b) => { if (b.dataset.v === r) b.classList.add("right"); }); }
    return true;
  }
  function scoreLine(id, got, asked, target) {
    $(id).textContent = got + " right out of " + asked + (got >= target ? " - sticker earned!" : "");
  }

  /* ---- 12: complements ---- 3Ni.03 recognise complements of 100 and complements of multiples of 10 or 100 (up to 1000) */
  let got12 = 0, asked12 = 0;
  function round12() {
    const toThousand = rnd(0, 1) === 1;
    const target = toThousand ? 1000 : 100;
    const have = toThousand ? rnd(1, 9) * 100 + (rnd(0, 1) ? 0 : rnd(1, 9) * 10) : rnd(11, 89);
    const answer = target - have;
    const pct = Math.round(100 * have / target);
    $("bar12").innerHTML =
      '<div class="cap"><span>have ' + have + "</span><span>make " + target + "</span></div>" +
      '<div class="bar"><div class="fill" style="width:' + pct + '%">' + have + '</div><div class="rest">?</div></div>' +
      '<div class="sum">' + have + " + ? = " + target + "</div>";
    const wrong = new Set([answer]);
    wrong.add(target - have + 10); wrong.add(Math.max(1, target - have - 10));
    if (!toThousand) wrong.add(100 - Math.floor(have / 10) * 10);
    offer("ch12", [...wrong].filter((v) => v > 0).slice(0, 4), answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch12", b, ok)) return;
      asked12++; if (ok) got12++;
      $("bar12").querySelector(".rest").textContent = answer;
      $("fb12").className = "fb " + (ok ? "good" : "");
      $("fb12").textContent = (ok ? cheer() + " " : "") + have + " + " + answer + " = " + target + ".";
      say(ok ? cheer() : have + " and " + answer + " make " + target);
      scoreLine("sc12", got12, asked12, 4);
      if (got12 >= 4) finish(0, "");
      setTimeout(round12, 1800);
    });
  }
  round12();

  /* ---- 13: any order ---- 3Ni.02 understand the commutative and associative properties of addition, and USE THESE TO SIMPLIFY */
  let trio13 = [], picked13 = [], got13 = 0, asked13 = 0;
  function round13() {
    const a = rnd(2, 8) * 10 + rnd(1, 9);
    const b = 100 - a;                 /* a and b are the pair that makes a round hundred */
    const c = rnd(2, 9) * 10;
    trio13 = shuffle([a, b, c]); picked13 = [];
    $("say13").innerHTML = "Add <b>" + trio13.join(" + ") + "</b>. Tap the <b>two</b> that make a round number first.";
    $("ch13").innerHTML = trio13.map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("ch13").onclick = (e) => {
      const btn = e.target.closest(".choice"); if (!btn || btn.disabled) return;
      const v = Number(btn.dataset.v);
      picked13.push(v); btn.classList.add("right"); btn.disabled = true; say(String(v));
      if (picked13.length < 2) return;
      const ok = picked13.reduce((s, x) => s + x, 0) === 100;
      asked13++; if (ok) got13++;
      const total = a + b + c;
      $("fb13").className = "fb " + (ok ? "good" : "");
      $("fb13").textContent = ok
        ? cheer() + " " + a + " + " + b + " = 100, then 100 + " + c + " = " + total + ". Choosing the order made it easy."
        : "That pair works, but " + a + " + " + b + " = 100 is the easy one. Then 100 + " + c + " = " + total + ".";
      say(a + " and " + b + " make one hundred, then add " + c + " to get " + total);
      scoreLine("sc13", got13, asked13, 3);
      if (got13 >= 3) finish(1, "");
      setTimeout(round13, 2200);
    };
  }
  round13();

  /* ---- 14 & 15: written methods ---- 3Ni.04 estimate, add and subtract whole numbers with up to three digits (regrouping of ones or tens) */
  const CX = [352, 262, 172, 92];
  function colFrame(a, b, sign) {
    const A = [0, 1, 2].map((i) => Math.floor(a / Math.pow(10, i)) % 10);
    const B = [0, 1, 2].map((i) => Math.floor(b / Math.pow(10, i)) % 10);
    return { A, B };
  }
  function addTrace(a, b) {
    const { A, B } = colFrame(a, b);
    const out = []; let carry = 0;
    for (let i = 0; i < 3; i++) { const s = A[i] + B[i] + carry; out.push({ A: A[i], B: B[i], carryIn: carry, sum: s, write: s % 10, carryOut: Math.floor(s / 10) }); carry = Math.floor(s / 10); }
    return { A, B, cols: out, thou: carry };
  }
  function subTrace(a, b) {
    const { A, B } = colFrame(a, b);
    const work = A.slice(), res = [], acts = [];
    for (let i = 0; i < 3; i++) {
      let act = null;
      const before = work[i];
      if (work[i] < B[i]) { let j = i + 1; while (work[j] === 0) { work[j] = 9; j++; } work[j] -= 1; work[i] += 10; act = { from: j }; }
      res.push(work[i] - B[i]); acts.push({ before, after: work[i], act });
    }
    return { A, B, work, res, acts };
  }
  function drawCols(id, A, B, sign, work, answer, upto, carries, thou) {
    let svg = "";
    svg += '<rect class="lit" x="' + (CX[upto] - 38) + '" y="36" width="76" height="192" rx="12"></rect>';
    ["ONES", "TENS", "HUNDREDS"].forEach((t, k) => { svg += '<text class="hd" x="' + CX[k] + '" y="24">' + t + "</text>"; });
    for (let i = 0; i < 3; i++) {
      const changed = work && work[i] !== A[i];
      svg += '<text class="dg' + (changed ? " spent" : "") + '" x="' + CX[i] + '" y="108">' + A[i] + "</text>";
      if (changed) {
        svg += '<line class="strike" x1="' + (CX[i] - 16) + '" y1="98" x2="' + (CX[i] + 16) + '" y2="90"></line>';
        svg += '<text class="carry" x="' + CX[i] + '" y="68">' + work[i] + "</text>";
      }
      if (carries && carries[i]) svg += '<text class="carry" x="' + CX[i + 1] + '" y="68">' + carries[i] + "</text>";
      svg += '<text class="dg" x="' + CX[i] + '" y="152">' + B[i] + "</text>";
      if (answer[i] !== null && answer[i] !== undefined) svg += '<text class="dg ans" x="' + CX[i] + '" y="212">' + answer[i] + "</text>";
    }
    if (thou) svg += '<text class="dg ans" x="' + CX[3] + '" y="212">' + thou + "</text>";
    svg += '<text class="sign" x="42" y="152">' + sign + "</text>";
    svg += '<line class="rule" x1="56" y1="172" x2="392" y2="172"></line>';
    $(id).innerHTML = svg;
  }
  function makeColumnStep(slideIdx, svgId, choicesId, fbId, scId, sayId, isAdd, target) {
    let a = 0, b = 0, T = null, col = 0, ansDigits = [null, null, null], got = 0, asked = 0;
    function fresh() {
      if (isAdd) {
        do { a = rnd(115, 799); b = rnd(115, 799); T = addTrace(a, b); } while (!T.cols.some((c) => c.carryOut));
      } else {
        do { a = rnd(220, 989); b = rnd(115, a - 60); T = subTrace(a, b); } while (!T.acts.some((x) => x.act));
      }
      col = 0; ansDigits = [null, null, null];
      paint();
    }
    function paint() {
      if (isAdd) {
        const carries = T.cols.map((c, i) => (i < 2 && c.carryOut && i < col ? c.carryOut : 0));
        drawCols(svgId, T.A, T.B, "+", null, ansDigits, col, carries, col > 2 ? T.thou : 0);
      } else {
        const shown = col === 0 ? T.A.slice() : T.A.map((v, i) => (i <= col || T.work[i] !== v ? T.work[i] : v));
        drawCols(svgId, T.A, T.B, "−", shown, ansDigits, col, null, 0);
      }
      const nm = ["ones", "tens", "hundreds"][Math.min(col, 2)];
      $(sayId).innerHTML = "Work the <b>" + nm + "</b> column. Tap the digit that goes under the line.";
    }
    function ask() {
      if (col > 2) return;
      const right = isAdd ? T.cols[col].write : T.res[col];
      const opts = new Set([right]);
      while (opts.size < 4) opts.add(rnd(0, 9));
      offer(choicesId, [...opts], right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = Number(btn.dataset.v) === right;
        if (!mark(choicesId, btn, ok)) return;
        asked++; if (ok) got++;
        ansDigits[col] = right;
        const nm = ["ones", "tens", "hundreds"][col];
        let why;
        if (isAdd) {
          const c = T.cols[col];
          why = c.A + " + " + c.B + (c.carryIn ? " + " + c.carryIn + " carried" : "") + " = " + c.sum + (c.carryOut ? ", so write " + c.write + " and carry " + c.carryOut : ", so write " + c.write);
        } else {
          const x = T.acts[col];
          why = x.act ? "You cannot take " + T.B[col] + " from " + x.before + ", so fetch a ten: " + x.after + " − " + T.B[col] + " = " + T.res[col] : x.before + " − " + T.B[col] + " = " + T.res[col];
        }
        $(fbId).className = "fb " + (ok ? "good" : "");
        $(fbId).textContent = (ok ? cheer() + " " : "") + cap(nm) + ": " + why + ".";
        say(ok ? cheer() : why);
        scoreLine(scId, got, asked, target);
        if (got >= target) finish(slideIdx, "");
        col++;
        setTimeout(() => {
          if (col > 2) {
            paint();
            const total = isAdd ? a + b : a - b;
            $(fbId).className = "fb good";
            $(fbId).textContent = a + (isAdd ? " + " : " − ") + b + " = " + total + ". Check it roughly: " + Math.round(a / 100) * 100 + (isAdd ? " + " : " − ") + Math.round(b / 100) * 100 + " = " + (isAdd ? Math.round(a / 100) * 100 + Math.round(b / 100) * 100 : Math.round(a / 100) * 100 - Math.round(b / 100) * 100) + ".";
            say(a + (isAdd ? " plus " : " minus ") + b + " is " + total);
            setTimeout(() => { fresh(); ask(); }, 2600);
          } else { paint(); ask(); }
        }, 1700);
      });
    }
    fresh(); ask();
  }
  makeColumnStep(2, "cs14", "ch14", "fb14", "sc14", "say14", true, 6);
  makeColumnStep(3, "cs15", "ch15", "fb15", "sc15", "say15", false, 6);

  /* ---- 16: money notation ---- 3Nm.01 interpret money notation for currencies that use a decimal point */
  let got16 = 0, asked16 = 0;
  function money(v) { return "sh " + v.toFixed(2); }
  function round16() {
    const sh = rnd(1, 9), c = rnd(0, 1) ? rnd(1, 9) * 10 : rnd(10, 99);
    const v = sh + c / 100;
    $("num16").textContent = money(v);
    const right = sh + " shillings and " + c + " cents";
    const opts = [right, sh + " shillings and " + (c % 10 === 0 ? c / 10 : Math.floor(c / 10)) + " cents", (sh + 1) + " shillings and " + c + " cents"];
    offer("ch16", [...new Set(opts)], right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch16", b, ok)) return;
      asked16++; if (ok) got16++;
      $("fb16").className = "fb " + (ok ? "good" : "");
      $("fb16").textContent = (ok ? cheer() + " " : "") + money(v) + " is " + right + ". The two figures after the dot are cents, and there are 100 cents in a shilling.";
      say(ok ? cheer() : money(v) + " is " + right);
      scoreLine("sc16", got16, asked16, 4);
      if (got16 >= 4) finish(4, "");
      setTimeout(round16, 2000);
    });
  }
  round16();

  /* ---- 17: change ---- 3Nm.02 add and subtract amounts of money to give change */
  let got17 = 0, asked17 = 0;
  function round17() {
    const price = rnd(1, 4) + rnd(1, 19) * 5 / 100;
    const paid = Math.ceil(price) + (rnd(0, 1) ? 0 : 1);
    const change = Math.round((paid - price) * 100) / 100;
    $("shop17").innerHTML =
      '<div class="tag"><span>it costs</span><b>' + money(price) + "</b></div>" +
      '<div class="tag paid"><span>you pay</span><b>' + money(paid) + "</b></div>";
    const opts = new Set([change.toFixed(2)]);
    opts.add((change + 0.1).toFixed(2)); opts.add(Math.max(0.05, change - 0.1).toFixed(2)); opts.add((change + 1).toFixed(2));
    offer("ch17", [...opts].slice(0, 4), change.toFixed(2), (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === change.toFixed(2);
      if (!mark("ch17", b, ok)) return;
      asked17++; if (ok) got17++;
      const upToWhole = Math.round((Math.ceil(price) - price) * 100);
      $("fb17").className = "fb " + (ok ? "good" : "");
      $("fb17").textContent = (ok ? cheer() + " " : "") + "Count on: " + money(price) + " + " + upToWhole + " cents makes " + money(Math.ceil(price)) + ", then on to " + money(paid) + ". Change is sh " + change.toFixed(2) + ".";
      say(ok ? cheer() : "The change is " + change.toFixed(2));
      scoreLine("sc17", got17, asked17, 4);
      if (got17 >= 4) finish(5, "");
      setTimeout(round17, 2400);
    });
  }
  round17();

  /* ---- ehel-g3-second-steps: estimate first ---- 3Ni.04 ESTIMATE, add and subtract whole numbers with up to three digits */
  (function () {
    const WHO = ["Yusuf", "Amina", "Musa", "Hodan", "Omar", "Leila", "Nadia", "Ali"];
    const r100 = (n) => Math.round(n / 100) * 100;
    const num = () => { let n; do { n = rnd(1, 8) * 100 + rnd(11, 89); } while (n % 100 === 50); return n; };
    let got = 0, asked = 0;
    function round() {
      const add = rnd(0, 1) === 1;
      let a, b, est, exact, guard = 0;
      do {
        a = num(); b = num();
        if (!add && b > a) { const t = a; a = b; b = t; }
        est = add ? r100(a) + r100(b) : r100(a) - r100(b);
        exact = add ? a + b : a - b;
      } while ((add ? exact >= 1000 : est < 100) || Math.abs(exact - est) >= 50 && guard++ < 200);
      const who = WHO[rnd(0, WHO.length - 1)];
      const q = add ? who + " adds " + a + " and " + b + ". About how much is that?"
                    : who + " takes " + b + " away from " + a + ". About how much is left?";
      $("qx21").textContent = q; $("sayx21").textContent = q;
      const opts = [est, est + 100, est > 100 ? est - 100 : est + 200];
      offer("chx21", opts, est, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = Number(btn.dataset.v) === est;
        if (!mark("chx21", btn, ok)) return;
        asked++; if (ok) got++;
        const why = a + " is about " + r100(a) + " and " + b + " is about " + r100(b) + ", so the answer is about " + est +
          ". The exact answer is " + exact + ", which is close to " + est + ".";
        $("fbx21").className = "fb " + (ok ? "good" : "");
        $("fbx21").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx21", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3200);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx21").closest(".slide"));
    round();
  })();

  /* ---- ehel-g3-second-steps: shopping with cents ---- 3Nm.02 add and subtract amounts of money; 3Nm.01 money notation */
  (function () {
    const WHO = ["Hodan", "Musa", "Nadia", "Omar", "Zara", "Ali", "Leila", "Yusuf"];
    const ITEMS = ["a pencil", "a rubber", "a ruler", "an exercise book", "a mango", "a bottle of water", "a bread roll", "a packet of crayons"];
    const money = (v) => "sh " + v.toFixed(2);
    let got = 0, asked = 0;
    function round() {
      const i1 = rnd(0, ITEMS.length - 1); let i2 = rnd(0, ITEMS.length - 1); while (i2 === i1) i2 = rnd(0, ITEMS.length - 1);
      let c1, c2; do { c1 = rnd(1, 19) * 5; c2 = rnd(1, 19) * 5; } while (c1 + c2 >= 100);
      const s1 = rnd(5, 45), s2 = rnd(5, 45);
      const p1 = s1 + c1 / 100, p2 = s2 + c2 / 100;
      const tot = Math.round((p1 + p2) * 100) / 100;
      const who = WHO[rnd(0, WHO.length - 1)];
      $("shopx22").innerHTML = '<div class="tag"><span>' + ITEMS[i1] + "</span><b>" + money(p1) + '</b></div><div class="tag"><span>' + ITEMS[i2] + "</span><b>" + money(p2) + "</b></div>";
      const q = who + " buys " + ITEMS[i1] + " and " + ITEMS[i2] + ". How much is that altogether?";
      $("qx22").textContent = q; $("sayx22").textContent = q;
      const right = money(tot);
      const opts = [right, money(tot + 1), money(Math.round((tot + 0.1) * 100) / 100)];
      offer("chx22", opts, right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx22", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "The shillings: " + s1 + " add " + s2 + " is " + (s1 + s2) + ". The cents: " + c1 + " add " + c2 + " is " + (c1 + c2) + ". Together that is " + right + ".";
        $("fbx22").className = "fb " + (ok ? "good" : "");
        $("fbx22").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx22", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3200);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx22").closest(".slide"));
    round();
  })();

  /* ---- 18: check ---- every question draws on a step above */
  const QS = [
    () => { let a = rnd(11, 89); while (a === 50 || a === 55) a = rnd(11, 89); return { q: a + " + ? = 100", opts: [100 - a, 100 - a + 10, a], a: 100 - a, why: a + " + " + (100 - a) + " = 100." }; },
    () => { let p, paid, ch; do { p = rnd(1, 4) + rnd(1, 9) * 10 / 100; paid = Math.ceil(p); ch = Math.round((paid - p) * 100) / 100; } while (Math.abs(ch - 0.5) < 0.001); return { q: "It costs sh " + p.toFixed(2) + " and you pay sh " + paid.toFixed(2) + ". What is the change?", opts: [ch.toFixed(2), (ch + 0.1).toFixed(2), (1 - ch).toFixed(2)], a: ch.toFixed(2), why: "Count on from sh " + p.toFixed(2) + " to sh " + paid.toFixed(2) + "." }; },
    () => { const sh = rnd(1, 9), c = rnd(10, 99); return { q: "How much is sh " + sh + "." + c + "?", opts: [sh + " shillings and " + c + " cents", sh + " shillings and " + Math.floor(c / 10) + " cents", c + " shillings and " + sh + " cents"], a: sh + " shillings and " + c + " cents", why: "The two figures after the dot are cents." }; },
    () => { const a = rnd(126, 498), b = rnd(126, 498); return { q: a + " + " + b + " = ?", opts: [a + b, a + b - 10, a + b + 10], a: a + b, why: "Work the ones, then the tens, then the hundreds: " + (a + b) + "." }; },
    () => { const a = rnd(320, 940), b = rnd(118, 285); return { q: a + " − " + b + " = ?", opts: [a - b, a - b - 10, a - b + 100], a: a - b, why: "Fetch a ten where the top digit is too small: " + (a - b) + "." }; },
    () => { const p = rnd(12, 48), c = 100 - p, r = rnd(11, 39); return { q: "Which two would you add first in " + p + " + " + r + " + " + c + "?", opts: [p + " and " + c, p + " and " + r, r + " and " + c], a: p + " and " + c, why: p + " + " + c + " = 100, which leaves an easy sum." }; },
  ];
;
  let qi = 0, got18 = 0, order18 = [];
  /* a question that offers the same answer twice has no single right answer;
     regenerate rather than ship an ambiguous one */
  function nextQ(gen) { let item, guard = 0; do { item = gen(); } while (new Set(item.opts.map(String)).size !== item.opts.length && guard++ < 60); return item; }
  function round18() {
    if (qi >= order18.length) {
      $("q18").textContent = "";
      $("ch18").innerHTML = "";
      $("fb18").className = "fb good";
      $("fb18").textContent = "Finished! " + got18 + " out of " + order18.length + ".";
      $("sc18").textContent = "";
      if (got18 >= 5) finish(8, "You have finished the check. Well done.");
      else retryCheck($("fb18"), $("ch18"), got18, order18.length, 5, function () { qi = 0; got18 = 0; order18 = shuffle(QS); round18(); });
      return;
    }
    const item = nextQ(order18[qi]);
    $("sc18").textContent = "Question " + (qi + 1) + " of " + order18.length + " \u00b7 " + got18 + " right";
    $("q18").textContent = item.q;
    $("say18").textContent = item.q;
    offer("ch18", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch18", b, ok)) return;
      if (ok) got18++;
      qi++;
      $("fb18").className = "fb " + (ok ? "good" : "");
      $("fb18").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc18").textContent = "Question " + qi + " of " + order18.length + " \u00b7 " + got18 + " right";
      setTimeout(round18, 2000);
    });
  }
  order18 = shuffle(QS);
  round18();

  /* ---- 19: stickers ---- */
  const STICKERS = [
    ["💯", "Make 100"],
    ["🔀", "Add in any order"],
    ["➕", "Adding with regrouping"],
    ["➖", "Taking away with regrouping"],
    ["💵", "Money and the dot"],
    ["🛒", "Giving change"],
    ["🎯", "Estimate first"],
    ["🛍️", "Shopping with cents"],
    ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];

  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb19").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb19").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You can add, take away and give change." : got + " of " + STICKERS.length + " stickers so far.";
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
            "63 + 28 is easier worked out as 63 + 30 − 2.",
            "30 is a round number to add, and taking the extra 2 back off puts it right.",
            [
                  "28 and 30 are the same.",
                  "You can add numbers in any order, so it does not matter."
            ],
            "The second one is perfectly true and still does not explain this move. Adding a round number is what makes it easier."
      ],
      [
            "You cannot work out 400 − 178 by taking the 0 from the 8 in the ones.",
            "Taking away does not work both ways round, so you have to fetch a ten instead.",
            [
                  "8 is bigger than 0, so you swap them over.",
                  "Both numbers have three digits."
            ],
            "Swapping the digits is the commonest wrong answer in the whole of subtraction. The column has to be exchanged, not turned round."
      ],
      [
            "62 + 38 = 100.",
            "62 needs 8 more to reach 70, and 70 needs 30 more to reach 100.",
            [
                  "6 + 3 is 9 and 2 + 8 is 10.",
                  "They are both two-digit numbers."
            ],
            "Making the tens add up to ten forgets the ones. Count on to the next ten first, then on to the hundred."
      ],
      [
            "In 247 + 185 the ones column makes a carry.",
            "7 + 5 is 12, and the extra ten cannot stay in the ones column.",
            [
                  "Every column addition makes a carry.",
                  "Both numbers are close to 200."
            ],
            "A carry is a real ten and has to be added in. Forget it and the answer is out by exactly ten, which looks so nearly right that nobody notices."
      ],
      [
            "sh 3.05 is three shillings and five cents, not fifty cents.",
            "The two figures after the dot are the cents, so 05 is five of them.",
            [
                  "The 5 is standing in the tens column.",
                  "There is a zero in the number."
            ],
            "A zero straight after the dot is holding the ten-cents column open. Read both figures after the dot, every time."
      ],
      [
            "If it costs sh 2.60 and you pay sh 5, the change is sh 2.40.",
            "Counting on: 2.60 to 3.00 is 40 cents, and 3.00 to 5.00 is two shillings.",
            [
                  "5 take away 2 is 3, and the 6 is left over.",
                  "You paid more than it cost."
            ],
            "Counting on is easier than taking away here, and it is what a shopkeeper actually does with the coins."
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

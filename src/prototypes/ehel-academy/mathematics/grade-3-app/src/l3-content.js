
  /* ==================================================================
     ROWS AND RULES - Grade 3 multiplication, division and sequences.
     Cambridge Primary Mathematics 0096, Stage 3.
     ================================================================== */

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
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
  function scoreLine(id, got, asked, target) { $(id).textContent = got + " right out of " + asked + (got >= target ? " - sticker earned!" : ""); }
  function dots(n) { let h = ""; for (let i = 0; i < n; i++) h += "<i></i>"; return h; }
  /* the answer is always first in the list, so no later filter can drop it */
  function withDistractors(answer, cands, want) {
    const list = [answer];
    for (const c of cands) { if (list.length >= want) break; if (c !== answer && c > 0 && !list.includes(c)) list.push(c); }
    let guard = 0;
    while (list.length < want && guard++ < 60) { const c = answer + rnd(1, 6) * (rnd(0, 1) ? 1 : -1); if (c > 0 && !list.includes(c)) list.push(c); }
    return list;
  }

  /* ---- 1: arrays ---- 3Ni.07 know the times tables / an array is the picture of one */
  let r1 = 4, c1 = 6;
  function paint1() {
    $("arr1").style.gridTemplateColumns = "repeat(" + c1 + ", 22px)";
    $("arr1").innerHTML = dots(r1 * c1);
    $("lab1").innerHTML = r1 + " × " + c1 + " = <b>" + r1 * c1 + "</b><small>" + r1 + " rows of " + c1 + "</small>";
    if (!done[0] && (r1 !== 4 || c1 !== 6)) finish(0, "");
    $("fb1").className = "fb"; $("fb1").textContent = r1 + " rows with " + c1 + " in each row is " + r1 * c1 + " altogether.";
  }
  $("ctl1").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.a;
    if (a === "r1") r1 = Math.min(9, r1 + 1); else if (a === "r-1") r1 = Math.max(1, r1 - 1);
    else if (a === "c1") c1 = Math.min(10, c1 + 1); else if (a === "c-1") c1 = Math.max(1, c1 - 1);
    paint1(); say(r1 + " times " + c1 + " is " + r1 * c1);
  });
  paint1();

  /* ---- 2: commutative ---- 3Ni.06 understand and explain the commutative property of multiplication */
  let a2 = 4, b2 = 6, turned2 = false;
  function paint2() {
    const rows = turned2 ? b2 : a2, cols = turned2 ? a2 : b2;
    $("arr2").style.gridTemplateColumns = "repeat(" + cols + ", 22px)";
    $("arr2").innerHTML = dots(rows * cols);
    $("lab2").innerHTML = rows + " × " + cols + " = <b>" + rows * cols + "</b><small>" + rows + " rows of " + cols + "</small>";
  }
  function new2() {
    a2 = rnd(2, 6); b2 = rnd(3, 9); if (a2 === b2) b2 = a2 + 1;
    turned2 = false; paint2();
    $("say2").innerHTML = "This is <b>" + a2 + " × " + b2 + "</b>. Press <b>Turn</b>.";
    $("fb2").className = "fb"; $("fb2").textContent = "";
  }
  $("turn2").addEventListener("click", () => {
    turned2 = !turned2; paint2();
    $("fb2").className = "fb good";
    $("fb2").textContent = a2 + " × " + b2 + " = " + b2 + " × " + a2 + " = " + a2 * b2 + ". The same dots, turned round - so learning one fact gives you two.";
    say(a2 + " times " + b2 + " and " + b2 + " times " + a2 + " are both " + a2 * b2);
    finish(1, "");
  });
  $("new2").addEventListener("click", new2);
  new2();

  /* ---- 3: times tables ---- 3Ni.07 know 1, 2, 3, 4, 5, 6, 8, 9 and 10 times tables */
  const TABLES = [1, 2, 3, 4, 5, 6, 8, 9, 10];
  let got3 = 0, asked3 = 0;
  function round3() {
    const a = TABLES[rnd(0, TABLES.length - 1)], b = rnd(2, 10);
    const answer = a * b;
    $("q3").textContent = a + " × " + b;
    $("say3").innerHTML = "What is <b>" + a + " × " + b + "</b>?";
    /* distractors are the neighbouring facts in the same table - the real confusions */
    const list = withDistractors(answer, [a * (b + 1), a * (b - 1), answer + a, answer - a, answer + 1], 4);
    offer("ch3", list, answer, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === answer;
      if (!mark("ch3", btn, ok)) return;
      asked3++; if (ok) got3++;
      $("fb3").className = "fb " + (ok ? "good" : "");
      $("fb3").textContent = (ok ? cheer() + " " : "") + a + " × " + b + " = " + answer + ".";
      say(ok ? cheer() : a + " times " + b + " is " + answer);
      scoreLine("sc3", got3, asked3, 8);
      if (got3 >= 8) finish(2, "");
      setTimeout(round3, 1500);
    });
  }
  round3();

  /* ---- 4: fact family ---- 3Ni.05 understand and explain the relationship between multiplication and division */
  let a4 = 4, b4 = 6, chosen4 = [], got4 = 0, asked4 = 0;
  function round4() {
    a4 = rnd(2, 6); b4 = rnd(3, 9); if (a4 === b4) b4 = a4 + 1;
    const p = a4 * b4;
    chosen4 = [];
    $("arr4").style.gridTemplateColumns = "repeat(" + b4 + ", 22px)";
    $("arr4").innerHTML = dots(p);
    $("say4").innerHTML = "This array is <b>" + a4 + " × " + b4 + "</b>. Tap all <b>four</b> true sentences.";
    const truth = [a4 + " × " + b4 + " = " + p, b4 + " × " + a4 + " = " + p, p + " ÷ " + a4 + " = " + b4, p + " ÷ " + b4 + " = " + a4];
    const lies = [a4 + " × " + b4 + " = " + (p + a4), p + " ÷ " + a4 + " = " + (b4 + 1), (p + 1) + " ÷ " + b4 + " = " + a4, a4 + " + " + b4 + " = " + p];
    const all = shuffle([...truth, ...shuffle(lies).slice(0, 2)]);
    $("fam4").innerHTML = all.map((t) => '<div role="button" tabindex="0" data-t="' + t + '">' + t + "</div>").join("");
    $("fam4").onclick = (e) => {
      const d = e.target.closest("div"); if (!d || d.classList.contains("on") || d.dataset.spent) return;
      const t = d.dataset.t;
      if (!truth.includes(t)) {
        d.dataset.spent = "1"; d.style.opacity = ".45";
        $("fb4").className = "fb"; $("fb4").textContent = "Not that one - check it against the picture.";
        say("Not that one");
        return;
      }
      d.classList.add("on"); chosen4.push(t); say(t.replace("×", "times").replace("÷", "shared between"));
      if (chosen4.length === 4) {
        asked4++; got4++;
        $("fb4").className = "fb good";
        $("fb4").textContent = cheer() + " One array, two times facts and two sharing facts - they are all the same fact.";
        scoreLine("sc4", got4, asked4, 2);
        if (got4 >= 2) finish(3, "");
        setTimeout(round4, 2400);
      }
    };
  }
  round4();

  /* ---- 5: distributive ---- 3Ni.06 distributive property / 3Ni.08 multiply whole numbers up to 100 by 2, 3, 4, 5 */
  let got5 = 0, asked5 = 0;
  function round5() {
    const n = rnd(12, 49), m = rnd(2, 5);
    const t = Math.floor(n / 10) * 10, o = n % 10;
    const answer = n * m;
    $("q5").textContent = n + " × " + m;
    $("sp5").innerHTML =
      '<div class="box t">' + t + " × " + m + " = " + t * m + "<small>the tens part</small></div>" +
      '<div class="box o">' + o + " × " + m + " = " + o * m + "<small>the ones part</small></div>";
    $("say5").innerHTML = "Split <b>" + n + "</b> into " + t + " and " + o + ". What is <b>" + n + " × " + m + "</b>?";
    const list = withDistractors(answer, [t * m, t * m + o, answer + m, answer - m, o * m + t], 4);
    offer("ch5", list, answer, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === answer;
      if (!mark("ch5", btn, ok)) return;
      asked5++; if (ok) got5++;
      $("fb5").className = "fb " + (ok ? "good" : "");
      $("fb5").textContent = (ok ? cheer() + " " : "") + t * m + " + " + o * m + " = " + answer + ". Both parts had to be multiplied.";
      say(ok ? cheer() : t * m + " plus " + o * m + " is " + answer);
      scoreLine("sc5", got5, asked5, 4);
      if (got5 >= 4) finish(4, "");
      setTimeout(round5, 2100);
    });
  }
  round5();

  /* ---- 6: estimate then multiply ---- 3Ni.08 ESTIMATE and multiply */
  let got6 = 0, asked6 = 0;
  function round6() {
    const n = rnd(21, 49), m = rnd(2, 5);
    const answer = n * m, near = Math.round(n / 10) * 10;
    $("q6").textContent = n + " × " + m;
    $("est6").className = "fb";
    $("est6").textContent = n + " is about " + near + ", and " + near + " × " + m + " = " + near * m + ". So expect something near " + near * m + ".";
    $("say6").innerHTML = "About " + near * m + ". Now tap the <b>exact</b> answer to " + n + " × " + m + ".";
    const list = withDistractors(answer, [near * m, answer + 10, answer - 10, answer + m], 4);
    offer("ch6", list, answer, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === answer;
      if (!mark("ch6", btn, ok)) return;
      asked6++; if (ok) got6++;
      $("fb6").className = "fb " + (ok ? "good" : "");
      $("fb6").textContent = (ok ? cheer() + " " : "") + n + " × " + m + " = " + answer + ", and the estimate said about " + near * m + ". Close, as it should be.";
      say(ok ? cheer() : n + " times " + m + " is " + answer);
      scoreLine("sc6", got6, asked6, 4);
      if (got6 >= 4) finish(5, "");
      setTimeout(round6, 2200);
    });
  }
  round6();

  /* ---- 7: sharing with a remainder ---- 3Ni.09 estimate and divide whole numbers up to 100 by 2, 3, 4 and 5 */
  let got7 = 0, asked7 = 0;
  function round7() {
    const g = rnd(2, 5), each = rnd(3, 12), rem = rnd(0, g - 1);
    const total = g * each + rem;
    $("q7").textContent = total + " ÷ " + g;
    /* 3Ni.09 asks the learner to ESTIMATE as well as divide, so the estimate is
       made first, out loud, against a friendly multiple of the divisor */
    const near = Math.floor(total / g) * g;
    $("say7").innerHTML = "Share <b>" + total + "</b> between <b>" + g + "</b>. " + near + " ÷ " + g + " = " + (near / g) + ", so expect about <b>" + (near / g) + "</b> each. Now work it out exactly.";
    let h = "";
    for (let k = 0; k < g; k++) h += '<div class="grp">' + dots(each) + "</div>";
    $("sb7").innerHTML = h;
    $("lo7").innerHTML = rem ? dots(rem) + " " + rem + " left over" : "nothing left over";
    const list = withDistractors(each, [each + 1, each - 1, each + rem, Math.ceil(total / g)], 4);
    offer("ch7", list, each, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === each;
      if (!mark("ch7", btn, ok)) return;
      asked7++; if (ok) got7++;
      $("fb7").className = "fb " + (ok ? "good" : "");
      $("fb7").textContent = (ok ? cheer() + " " : "") + total + " ÷ " + g + " = " + each + (rem ? " remainder " + rem + ". And " + rem + " is smaller than " + g + ", so the sharing really is finished." : " exactly.");
      say(ok ? cheer() : total + " shared between " + g + " is " + each + (rem ? " remainder " + rem : ""));
      scoreLine("sc7", got7, asked7, 4);
      if (got7 >= 4) finish(6, "");
      setTimeout(round7, 2400);
    });
  }
  round7();

  /* ---- 8: multiples ---- 3Ni.10 recognise multiples of 2, 5 and 10 */
  const WHICH8 = [2, 5, 10];
  let w8 = 5, base8 = 0, picked8 = 0, wrong8 = 0, rounds8 = 0;
  function round8() {
    base8 = rnd(1, 8) * 100;
    picked8 = 0; wrong8 = 0;
    $("which8").innerHTML = WHICH8.map((v) => '<button type="button" class="' + (v === w8 ? "on" : "") + '" data-v="' + v + '">multiples of ' + v + "</button>").join("");
    $("say8").innerHTML = "Tap every <b>multiple of " + w8 + "</b> between " + base8 + " and " + (base8 + 29) + ".";
    let h = "";
    for (let k = 0; k < 30; k++) { const v = base8 + k; h += '<button type="button" data-v="' + v + '">' + v + "</button>"; }
    $("g8").innerHTML = h;
    const want = [];
    for (let k = 0; k < 30; k++) if ((base8 + k) % w8 === 0) want.push(base8 + k);
    $("fb8").className = "fb"; $("fb8").textContent = "There are " + want.length + " to find.";
    $("g8").onclick = (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      const v = Number(b.dataset.v);
      b.disabled = true;
      if (v % w8 === 0) { b.classList.add("on"); picked8++; say(String(v)); }
      else { b.classList.add("miss"); wrong8++; $("fb8").textContent = v + " does not end the right way - it is not a multiple of " + w8 + "."; say("no"); }
      if (picked8 === want.length) {
        rounds8++;
        $("fb8").className = "fb good";
        $("fb8").textContent = cheer() + " All " + want.length + " found" + (wrong8 ? ", with " + wrong8 + " to spare" : " with none wrong") + ". Multiples of " + w8 + " always end in " + (w8 === 10 ? "0" : w8 === 5 ? "0 or 5" : "0, 2, 4, 6 or 8") + ".";
        scoreLine("sc8", rounds8, rounds8, 2);
        if (rounds8 >= 2) finish(7, "");
        setTimeout(round8, 2600);
      }
    };
  }
  $("which8").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; w8 = Number(b.dataset.v); round8(); });
  round8();

  /* ---- 9: the rule ---- 3Nc.05 recognise and extend linear sequences, and describe the term-to-term rule */
  let got9 = 0, asked9 = 0;
  function round9() {
    const up = rnd(0, 1) === 1;
    const step = [2, 3, 4, 5, 10, 25, 50][rnd(0, 6)] * (up ? 1 : -1);
    const start = up ? rnd(1, 20) * 5 : rnd(40, 100) * Math.max(1, Math.abs(step) / 5);
    const seq = [0, 1, 2, 3].map((k) => start + k * step).filter((v) => v >= 0);
    if (seq.length < 4) return round9();
    $("seq9").innerHTML = seq.map((v) => "<span>" + v + "</span>").join("") + '<span class="gap now">?</span>';
    const label = (s) => (s > 0 ? "add " : "take away ") + Math.abs(s);
    const right = label(step);
    const opts = new Set([right]);
    opts.add(label(-step)); opts.add(label(step > 0 ? step + 1 : step - 1)); opts.add(label(step * 2));
    offer("ch9", [...opts].slice(0, 4), right, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = btn.dataset.v === right;
      if (!mark("ch9", btn, ok)) return;
      asked9++; if (ok) got9++;
      const next = seq[3] + step;
      $("seq9").innerHTML = seq.map((v) => "<span>" + v + "</span>").join("") + '<span class="gap filled">' + next + "</span>";
      $("fb9").className = "fb " + (ok ? "good" : "");
      $("fb9").textContent = (ok ? cheer() + " " : "") + "The rule is " + right + ", so the next number is " + next + ".";
      say(ok ? cheer() : "The rule is " + right);
      scoreLine("sc9", got9, asked9, 4);
      if (got9 >= 4) finish(8, "");
      setTimeout(round9, 2000);
    });
  }
  round9();

  /* ---- 10: growing shapes ---- 3Nc.06 extend spatial patterns formed from adding a constant */
  let got10 = 0, asked10 = 0;
  function figure(count, cols, q) {
    return '<div class="fig' + (q ? " q" : "") + '"><div class="sq" style="grid-template-columns:repeat(' + cols + ',15px)">' + dots(count) + '</div><div class="cap">' + (q ? "?" : count) + "</div></div>";
  }
  function round10() {
    /* 3Nc.06 names adding AND subtracting a constant, so half the patterns shrink.
       A shrinking run starts high enough that the fourth picture is still positive. */
    const step = rnd(2, 4), cols = step;
    const grow = rnd(0, 1) === 1;
    const first = grow ? rnd(2, 4) : rnd(2, 4) + 3 * step;
    const d = grow ? step : -step;
    const counts = [0, 1, 2].map((k) => first + k * d);
    const answer = first + 3 * d;
    $("sh10").innerHTML = counts.map((c) => figure(c, cols, false)).join("") + figure(answer, cols, true);
    $("say10").innerHTML = "The pictures have " + counts.join(", ") + " squares. How many in the <b>next</b> one?";
    const list = withDistractors(answer, [answer + step, Math.max(1, answer - step), answer + 1, counts[2] + 1], 4);
    offer("ch10", list, answer, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === answer;
      if (!mark("ch10", btn, ok)) return;
      asked10++; if (ok) got10++;
      $("sh10").innerHTML = counts.map((c) => figure(c, cols, false)).join("") + figure(answer, cols, false);
      $("fb10").className = "fb " + (ok ? "good" : "");
      $("fb10").textContent = (ok ? cheer() + " " : "") + "Each picture " + (grow ? "adds " : "takes away ") + step + ", so " + counts[2] + (grow ? " + " : " − ") + step + " = " + answer + ".";
      say(ok ? cheer() : "Each one " + (grow ? "adds " : "takes away ") + step + ", so the next is " + answer);
      scoreLine("sc10", got10, asked10, 4);
      if (got10 >= 4) finish(9, "");
      setTimeout(round10, 2200);
    });
  }
  round10();

  /* ---- 11: the mystery box ---- 3Nc.04 recognise the use of an object to represent an unknown quantity */
  let got11 = 0, asked11 = 0;
  function round11() {
    const form = rnd(0, 2);
    let answer, html, why;
    if (form === 0) { const x = rnd(5, 40), b = rnd(3, 30); answer = x; html = '<span class="bx">?</span><span>+ ' + b + " = " + (x + b) + "</span>"; why = "Take the " + b + " back off " + (x + b) + " and the box must be " + x + "."; }
    else if (form === 1) { const x = rnd(5, 40), b = rnd(3, 20); answer = x; html = "<span>" + (x + b) + '</span><span>− <span class="bx">?</span> = ' + b + "</span>"; why = (x + b) + " take away " + x + " leaves " + b + ", so the box is " + x + "."; }
    /* the subtrahend is built from the answer, so the result can never go below zero -
       counting back past zero is Stage 5, not Stage 3 */
    else { const b = rnd(3, 20), x = b + rnd(2, 30); answer = x; html = '<span class="bx">?</span><span>− ' + b + " = " + (x - b) + "</span>"; why = "Add the " + b + " back on: " + (x - b) + " + " + b + " = " + x + "."; }
    if (answer <= 0) return round11();
    $("my11").innerHTML = html;
    $("say11").textContent = "What number is hiding in the box?";
    const list = withDistractors(answer, [answer + rnd(1, 5), Math.max(1, answer - rnd(1, 5)), answer + 10], 4);
    offer("ch11", list, answer, (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = Number(btn.dataset.v) === answer;
      if (!mark("ch11", btn, ok)) return;
      asked11++; if (ok) got11++;
      $("my11").innerHTML = html.replace('class="bx"', 'class="bx found"').replace(">?<", ">" + answer + "<");
      $("fb11").className = "fb " + (ok ? "good" : "");
      $("fb11").textContent = (ok ? cheer() + " " : "") + why;
      say(ok ? cheer() : why);
      scoreLine("sc11", got11, asked11, 4);
      if (got11 >= 4) finish(10, "");
      setTimeout(round11, 2200);
    });
  }
  round11();

  /* ---- 12: check ---- */
  const QS = [
    () => { const a = rnd(2, 9), b = rnd(2, 10); return { q: "What is " + a + " × " + b + "?", opts: [a * b, a * b + a, a * b - a], a: a * b, why: a + " × " + b + " = " + a * b + "." }; },
    () => { const a = rnd(3, 9), b = rnd(3, 9); return { q: a + " × " + b + " = " + a * b + ". So what is " + b + " × " + a + "?", opts: [a * b, a * b + 1, a + b], a: a * b, why: "Turning it round never changes the total." }; },
    () => { const a = rnd(2, 5); let b = rnd(3, 9); while (b === a || b + 1 === a) b = rnd(3, 9); return { q: "What is " + a * b + " ÷ " + a + "?", opts: [b, a, b + 1], a: b, why: "Ask what you multiply " + a + " by to reach " + a * b + "." }; },
    () => { let n = rnd(12, 40); while (n % 10 === 0) n = rnd(12, 40); const m = rnd(2, 5); const t = Math.floor(n / 10) * 10, o = n % 10; return { q: "What is " + n + " × " + m + "?", opts: [n * m, t * m, n * m + m], a: n * m, why: t * m + " + " + o * m + " = " + n * m + "." }; },
    () => { const g = rnd(2, 5), r = rnd(1, g - 1); let e2 = rnd(3, 9); while (e2 === g || e2 === r) e2 = rnd(3, 9); const tot = g * e2 + r; return { q: tot + " shared between " + g + ". What is left over?", opts: [r, g, e2], a: r, why: tot + " ÷ " + g + " = " + e2 + " remainder " + r + "." }; },
    () => { const n = [2, 5, 10][rnd(0, 2)]; const v = rnd(10, 99) * n; return { q: "Is " + v + " a multiple of " + n + "?", opts: ["yes", "no"], a: "yes", why: v + " lands on " + n + " when you count in " + n + "s from zero." }; },
    () => { const s = [2, 3, 5, 10][rnd(0, 3)]; const st = rnd(1, 9) * 5; return { q: "A sequence goes " + st + ", " + (st + s) + ", " + (st + 2 * s) + ". What is the rule?", opts: ["add " + s, "add " + (s + 1), "take away " + s], a: "add " + s, why: "Each term is " + s + " more than the one before." }; },
    () => { const b = rnd(2, 20); let x = rnd(6, 30); while (x === b) x = rnd(6, 30); return { q: "? + " + b + " = " + (x + b) + ". What is in the box?", opts: [x, x + b, b], a: x, why: (x + b) + " − " + b + " = " + x + "." }; },
    () => { const f = rnd(2, 4), st = rnd(2, 4); return { q: "Pictures grow " + f + ", " + (f + st) + ", " + (f + 2 * st) + " squares. How many next?", opts: [f + 3 * st, f + 2 * st + 1, f + 4 * st], a: f + 3 * st, why: "Each picture adds " + st + "." }; },
    () => { const n = rnd(21, 49), m = rnd(2, 5); const near = Math.round(n / 10) * 10; return { q: "Roughly, what is " + n + " × " + m + "?", opts: ["about " + near * m, "about " + near * m * 2, "about " + n], a: "about " + near * m, why: n + " is about " + near + ", and " + near + " × " + m + " = " + near * m + "." }; }
  ];
  let qi = 0, got12 = 0, order12 = [];
  /* a question that offers the same answer twice has no single right answer;
     regenerate rather than ship an ambiguous one */
  function nextQ(gen) { let item, guard = 0; do { item = gen(); } while (new Set(item.opts.map(String)).size !== item.opts.length && guard++ < 60); return item; }
  function round12() {
    if (qi >= order12.length) {
      $("q12").textContent = ""; $("ch12").innerHTML = "";
      $("fb12").className = "fb good"; $("fb12").textContent = "Finished! " + got12 + " out of " + order12.length + ".";
      $("sc12").textContent = "";
      if (got12 >= 7) finish(11, "You have finished the check.");
      else retryCheck($("fb12"), $("ch12"), got12, order12.length, 7, function () { qi = 0; got12 = 0; order12 = shuffle(QS); round12(); });
      return;
    }
    const item = nextQ(order12[qi]);
    $("q12").textContent = item.q; $("say12").textContent = item.q;
    offer("ch12", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch12", b, ok)) return;
      if (ok) got12++;
      qi++;
      $("fb12").className = "fb " + (ok ? "good" : "");
      $("fb12").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc12").textContent = got12 + " right out of " + qi;
      setTimeout(round12, 2000);
    });
  }
  order12 = shuffle(QS);
  round12();

  /* ---- 13: stickers ---- */
  const STICKERS = [
    ["🔲", "Rows and columns"], ["🔄", "Turn it round"], ["✖️", "The tables you need"], ["👨‍👩‍👧", "One array, four facts"],
    ["🪓", "Split it to multiply"], ["🎯", "Estimate, then multiply"], ["🍪", "Sharing and leftovers"], ["🔟", "Multiples"],
    ["📈", "The rule"], ["🔺", "Patterns that grow"], ["📦", "The mystery box"], ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb13").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb13").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You know your tables and your rules." : got + " of " + STICKERS.length + " stickers so far.";
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
            "If you know 8 × 5 = 40, you already know 5 × 8.",
            "Turning an array on its side does not change how many dots are in it.",
            [
                  "8 and 5 are both in the answer 40.",
                  "5 and 8 are both smaller than 40."
            ],
            "One array, read two ways. That is why every times fact you learn is really two."
      ],
      [
            "24 × 3 = 72.",
            "20 threes are 60 and 4 threes are 12, and 60 + 12 = 72.",
            [
                  "20 threes are 60, so the answer is 60.",
                  "24 and 3 both go into 72."
            ],
            "Both parts have to be multiplied. Stopping at the tens leaves you exactly the ones part short."
      ],
      [
            "17 shared between 5 leaves 2 over.",
            "5 threes are 15, and 17 − 15 = 2, and 2 is smaller than 5.",
            [
                  "17 and 5 are both odd numbers.",
                  "2 is left because 17 ends in a 7."
            ],
            "The check that costs nothing: the remainder must be smaller than the number of groups, or everybody could have had one more."
      ],
      [
            "245 is a multiple of 5.",
            "It ends in 5, and every multiple of 5 ends in 0 or 5.",
            [
                  "It has a 5 in it.",
                  "2 + 4 + 5 = 11, and 11 is odd."
            ],
            "Having a 5 somewhere is not the test. The last digit is."
      ],
      [
            "The sequence 4, 7, 10, 13 goes up in 3s.",
            "Every number is 3 more than the one before, and that happens every time.",
            [
                  "7 − 4 = 3.",
                  "It starts at 4 and ends at 13."
            ],
            "One gap is not enough. 2, 4, 8 looks like adding 2 until you reach the 8."
      ],
      [
            "If ? + 9 = 21 then the box is 12.",
            "Taking the 9 back off 21 leaves 12, and 12 + 9 = 21 puts it back.",
            [
                  "21 and 9 both have a 1 in them.",
                  "9 + 21 = 30, so the box is 30."
            ],
            "Undo what was done, then put your answer back in to check it."
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

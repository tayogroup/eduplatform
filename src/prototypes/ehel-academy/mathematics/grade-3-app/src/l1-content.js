
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

  /* ---- 1: three digits ---- 3Np.01 the value of each digit is determined by its position */
  const D1 = [0, 0, 0];
  let seen1 = 0;
  function blocks(n, k) {
    const cls = ["h", "t", "o"][k];
    let h = "";
    for (let i = 0; i < n; i++) h += '<span class="blk ' + cls + '"></span>';
    return h;
  }
  function paint1() {
    const mult = [100, 10, 1];
    $("pv1").innerHTML = ["Hundreds", "Tens", "Ones"].map((lab, k) =>
      '<div class="pvc"><span class="pvl">' + lab + '</span><span class="pvd">' + D1[k] + '</span>' +
      '<span class="pvw' + (D1[k] === 0 ? " none" : "") + '">' + (D1[k] === 0 ? "none here" : "worth " + D1[k] * mult[k]) + "</span>" +
      '<div class="pvb">' + blocks(D1[k], k) + "</div>" +
      '<div class="pvbtn"><button type="button" data-k="' + k + '" data-d="-1" aria-label="one fewer ' + lab + '">−</button><button type="button" data-k="' + k + '" data-d="1" aria-label="one more ' + lab + '">+</button></div></div>').join("");
    const n = D1[0] * 100 + D1[1] * 10 + D1[2];
    $("big1").textContent = n;
    $("worth1").innerHTML = D1[0] * 100 + " + " + D1[1] * 10 + " + " + D1[2] + " = <b>" + n + "</b>";
    if (seen1 >= 6 && D1[0] > 0 && !done[0]) { finish(0, "You have built numbers all the way up to a thousand. Sticker earned."); $("fb1").className = "fb good"; $("fb1").textContent = "Sticker earned! Keep building if you like."; }
  }
  $("pv1").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = Number(b.dataset.k), d = Number(b.dataset.d);
    D1[k] = Math.max(0, Math.min(9, D1[k] + d));
    seen1++;
    paint1();
    const mult = [100, 10, 1];
    say(D1[k] === 0 ? "no " + ["hundreds", "tens", "ones"][k] : D1[k] + " " + ["hundreds", "tens", "ones"][k] + ", worth " + D1[k] * mult[k]);
  });
  paint1();

  /* ---- 2: read and write ---- 3Ni.01 recite, read and write number names and whole numbers 0 to 1000 */
  let n2 = 0, got2 = 0, asked2 = 0;
  function round2() {
    n2 = rnd(101, 999);
    $("num2").textContent = n2;
    const right = cap(words(n2));
    const wrong = new Set();
    /* every distractor is a real misreading: digits swapped, a teen for a ten, the tens dropped */
    const h = Math.floor(n2 / 100), t = Math.floor(n2 / 10) % 10, o = n2 % 10;
    if (t !== o) wrong.add(cap(words(h * 100 + o * 10 + t)));
    if (t >= 2 && o > 0) wrong.add(cap(words(h * 100 + o)));
    wrong.add(cap(words(((h % 9) + 1) * 100 + t * 10 + o)));
    const opts = [right, ...[...wrong].filter((w) => w !== right).slice(0, 2)];
    offer("ch2", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch2", b, ok)) return;
      asked2++; if (ok) got2++;
      $("fb2").className = "fb " + (ok ? "good" : "");
      $("fb2").textContent = ok ? cheer() + " " + n2 + " is " + words(n2) + "." : "Not quite. " + n2 + " is " + words(n2) + ".";
      say(ok ? cheer() + " " + words(n2) : n2 + " is " + words(n2));
      scoreLine("sc2", got2, asked2, 4);
      if (got2 >= 4) finish(1, "");
      setTimeout(round2, 1600);
    });
  }
  round2();

  /* ---- 3: break it apart ---- 3Np.03 compose, decompose and regroup 3-digit numbers */
  let n3 = 0, picked3 = [], got3 = 0, asked3 = 0;
  function paint3() {
    $("parts3").innerHTML = picked3.length
      ? picked3.map((v) => "<span>" + v + "</span>").join('<span class="gap">+</span>')
      : '<span class="gap">tap the parts</span>';
  }
  function round3() {
    n3 = rnd(102, 989);
    const h = Math.floor(n3 / 100) * 100, t = Math.floor(n3 / 10) % 10 * 10, o = n3 % 10;
    const want = [h, t, o].filter((v) => v > 0);
    picked3 = []; paint3();
    $("num3").textContent = n3;
    const pool = new Set(want);
    while (pool.size < want.length + 3) {
      const c = shuffle([h + 100, h - 100, t + 10, t === 0 ? 10 : t - 10, o + 1, Math.floor(n3 / 10), n3 % 100])[0];
      if (c > 0 && !want.includes(c)) pool.add(c);
    }
    $("ch3").innerHTML = shuffle([...pool]).map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("ch3").onclick = (e) => {
      const b = e.target.closest(".choice"); if (!b || b.disabled) return;
      const v = Number(b.dataset.v);
      if (!want.includes(v) || picked3.includes(v)) {
        b.classList.add("wrong"); b.disabled = true;
        $("fb3").className = "fb"; $("fb3").textContent = v + " is not one of the parts of " + n3 + ".";
        say("Not that one.");
        return;
      }
      picked3.push(v); b.classList.add("right"); b.disabled = true; paint3();
      say(String(v));
      if (picked3.length === want.length) {
        asked3++; got3++;
        $("fb3").className = "fb good";
        $("fb3").textContent = cheer() + " " + want.join(" + ") + " = " + n3 + ".";
        say(want.join(" plus ") + " makes " + n3);
        scoreLine("sc3", got3, asked3, 3);
        if (got3 >= 3) finish(2, "");
        setTimeout(round3, 1900);
      }
    };
  }
  round3();

  /* ---- 4: regroup ---- 3Np.03 ...and regroup, using hundreds, tens and ones */
  let base4 = 348, moved4 = 0;
  function paint4() {
    const h = Math.floor(base4 / 100), t = Math.floor(base4 / 10) % 10, o = base4 % 10;
    const hh = (h - moved4) * 100, tt = t * 10 + moved4 * 100;
    $("rg4").innerHTML =
      '<span class="rp' + (moved4 ? " moved" : "") + '">' + hh + "</span>" +
      '<span class="op">+</span><span class="rp' + (moved4 ? " moved" : "") + '">' + tt + "</span>" +
      '<span class="op">+</span><span class="rp">' + o + "</span>" +
      '<span class="op">=</span><span class="rp">' + (hh + tt + o) + "</span>";
    $("rgmore").disabled = moved4 >= h;
    $("rgless").disabled = moved4 === 0;
    $("fb4").className = "fb" + (moved4 ? " good" : "");
    $("fb4").textContent = moved4 === 0
      ? base4 + " split the ordinary way: " + hh + " + " + tt + " + " + o + "."
      : moved4 + " hundred moved across as " + (moved4 * 10) + " tens - and the total is still " + base4 + ".";
  }
  $("rgmore").addEventListener("click", () => { moved4++; paint4(); say("One hundred moves across as ten tens. Still " + base4 + "."); if (moved4 >= 1) finish(3, ""); });
  $("rgless").addEventListener("click", () => { moved4--; paint4(); say("Put back. Still " + base4 + "."); });
  paint4();

  /* ---- 5: times ten ---- 3Np.02 use knowledge of place value to multiply whole numbers by 10 */
  let n5 = 35, was5 = 0;
  function paint5(after) {
    const d = [Math.floor(n5 / 100) % 10, Math.floor(n5 / 10) % 10, n5 % 10];
    $("pv5").innerHTML = ["Hundreds", "Tens", "Ones"].map((lab, k) =>
      '<div class="pvc' + (after && d[k] !== 0 ? " lit" : "") + '"><span class="pvl">' + lab + '</span><span class="pvd">' + d[k] + "</span>" +
      '<span class="pvw' + (d[k] === 0 ? " none" : "") + '">' + (d[k] === 0 ? "none here" : "worth " + d[k] * [100, 10, 1][k]) + "</span></div>").join("");
  }
  function new5() {
    n5 = rnd(11, 99); was5 = 0; paint5(false);
    $("x10").disabled = false;
    $("fb5").className = "fb"; $("fb5").textContent = "Now press × 10.";
    $("say5").innerHTML = "This number is <b>" + n5 + "</b>. Press <b>× 10</b> and watch the digits move.";
  }
  $("x10").addEventListener("click", () => {
    was5 = n5; n5 = n5 * 10; paint5(true);
    $("x10").disabled = true;
    $("fb5").className = "fb good";
    $("fb5").textContent = was5 + " × 10 = " + n5 + ". Every digit moved one column left, and a 0 holds the ones column open.";
    say(was5 + " times ten is " + n5 + ". Every digit moved one place to the left, and a zero holds the ones column open.");
    finish(4, "");
  });
  $("new5").addEventListener("click", new5);
  new5();

  /* ---- 6: count on and back ---- 3Nc.02 count on and back in steps of constant size: 1s, tens or hundreds, from any number */
  const STEPS6 = [1, 10, 100, -1, -10, -100];
  let step6 = 10, seq6 = [], got6 = 0, asked6 = 0;
  function paintChips6() {
    $("step6").innerHTML = STEPS6.map((v) => '<button type="button" class="' + (v === step6 ? "on" : "") + '" data-v="' + v + '">' + (v > 0 ? "+" : "−") + Math.abs(v) + "</button>").join("");
  }
  function round6() {
    /* The start is chosen so the run crosses a ten or a hundred - the step
       everyone gets wrong - AND so all four terms stay inside 0 to 1000, which
       is the range the objective names. Counting back past zero is Stage 5. */
    const mag = Math.abs(step6);
    let start;
    if (mag === 1) start = rnd(1, 8) * 100 + rnd(1, 9) * 10 + (step6 > 0 ? rnd(6, 9) : rnd(0, 3));
    else if (mag === 10) start = rnd(1, 8) * 100 + (step6 > 0 ? rnd(6, 9) : rnd(0, 3)) * 10 + rnd(0, 9);
    else start = (step6 > 0 ? rnd(1, 6) : rnd(4, 9)) * 100 + rnd(0, 99);
    seq6 = [start, start + step6, start + 2 * step6];
    const answer = start + 3 * step6;
    $("seq6").innerHTML = seq6.map((v) => "<span>" + v + "</span>").join("") + '<span class="gap now">?</span>';
    /* the answer is added first and never filtered, so it cannot be dropped */
    const list = [answer];
    const cands = [answer + step6, answer - step6 * 2, seq6[2] + (step6 > 0 ? 1 : -1) * mag * 10, answer + (step6 > 0 ? 1 : -1)];
    for (const c of cands) { if (list.length >= 4) break; if (c !== answer && c >= 0 && c <= 1000 && !list.includes(c)) list.push(c); }
    while (list.length < 3) { const c = answer + rnd(1, 3) * mag * (rnd(0, 1) ? 1 : -1); if (c >= 0 && c <= 1000 && !list.includes(c)) list.push(c); }
    offer("ch6", list, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch6", b, ok)) return;
      asked6++; if (ok) got6++;
      $("seq6").innerHTML = seq6.map((v) => "<span>" + v + "</span>").join("") + '<span class="gap filled">' + answer + "</span>";
      $("fb6").className = "fb " + (ok ? "good" : "");
      $("fb6").textContent = ok ? cheer() + " " + seq6[2] + " " + (step6 > 0 ? "+" : "−") + " " + Math.abs(step6) + " = " + answer + "." : "The step is " + (step6 > 0 ? "+" : "−") + Math.abs(step6) + ", so " + seq6[2] + " goes to " + answer + ".";
      say(ok ? cheer() : seq6[2] + (step6 > 0 ? " add " : " take away ") + Math.abs(step6) + " is " + answer);
      scoreLine("sc6", got6, asked6, 4);
      if (got6 >= 4) finish(5, "");
      setTimeout(round6, 1700);
    });
  }
  $("step6").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    step6 = Number(b.dataset.v); paintChips6();
    say("Counting " + (step6 > 0 ? "on in " : "back in ") + Math.abs(step6) + (Math.abs(step6) === 1 ? "s" : "s"));
    round6();
  });
  paintChips6(); round6();

  /* ---- 7: odd and even ---- 3Nc.03 use knowledge of even and odd numbers up to 10 to recognise and sort numbers */
  let n7 = 0, got7 = 0, asked7 = 0;
  function round7() {
    n7 = rnd(100, 999);
    $("num7").textContent = n7;
    const last = n7 % 10, right = last % 2 === 0 ? "even" : "odd";
    $("ch7").innerHTML = ["odd", "even"].map((o) => '<button type="button" class="choice word" data-v="' + o + '">' + o + "</button>").join("");
    $("ch7").dataset.right = right; $("ch7").dataset.live = "1";
    $("ch7").onclick = (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch7", b, ok)) return;
      asked7++; if (ok) got7++;
      $("fb7").className = "fb " + (ok ? "good" : "");
      $("fb7").textContent = (ok ? cheer() + " " : "Look again. ") + "It ends in " + last + ", and " + last + " is " + right + " - so " + n7 + " is " + right + ". The hundreds make no difference at all.";
      say(ok ? cheer() + " it ends in " + last + ", which is " + right : "It ends in " + last + ", so it is " + right);
      scoreLine("sc7", got7, asked7, 4);
      if (got7 >= 4) finish(6, "");
      setTimeout(round7, 1700);
    };
  }
  round7();

  /* ---- 8: compare ---- 3Np.04 compare and order 3-digit numbers using =, > and < */
  let got8 = 0, asked8 = 0;
  function round8() {
    let a = rnd(100, 999), b = rnd(100, 999);
    /* half the rounds share a hundreds digit, so the ones-first shortcut fails and the child must move along */
    if (rnd(0, 1)) b = Math.floor(a / 100) * 100 + rnd(0, 99);
    if (rnd(0, 7) === 0) b = a;
    const right = a > b ? ">" : a < b ? "<" : "=";
    $("cmp8").innerHTML = "<span>" + a + '</span><span class="slot">?</span><span>' + b + "</span>";
    $("ch8").innerHTML = [">", "<", "="].map((o) => '<button type="button" class="choice" data-v="' + o + '" style="font-size:30px">' + o + "</button>").join("");
    $("ch8").dataset.right = right; $("ch8").dataset.live = "1";
    $("ch8").onclick = (e) => {
      const btn = e.target.closest(".choice"); if (!btn) return;
      const ok = btn.dataset.v === right;
      if (!mark("ch8", btn, ok)) return;
      asked8++; if (ok) got8++;
      $("cmp8").innerHTML = "<span>" + a + '</span><span class="slot">' + right + "</span><span>" + b + "</span>";
      const ha = Math.floor(a / 100), hb = Math.floor(b / 100);
      const why = a === b ? "They are the same number." : ha !== hb ? "The hundreds settle it: " + ha + " against " + hb + "." : "Same hundreds, so move along to the tens and ones.";
      $("fb8").className = "fb " + (ok ? "good" : "");
      $("fb8").textContent = (ok ? cheer() + " " : "") + a + " " + right + " " + b + ". " + why;
      say(ok ? cheer() : a + " is " + (right === ">" ? "greater than " : right === "<" ? "less than " : "equal to ") + b);
      scoreLine("sc8", got8, asked8, 4);
      if (got8 >= 4) finish(7, "");
      setTimeout(round8, 1700);
    };
  }
  round8();

  /* ---- 9: order ---- 3Np.04 understand the relative size of quantities to compare and ORDER */
  let set9 = [], taken9 = [], got9 = 0, asked9 = 0;
  function paint9() {
    $("ord9").innerHTML = taken9.length ? taken9.map((v) => "<span>" + v + "</span>").join('<span class="gap">‹</span>') : '<span class="gap">smallest first</span>';
  }
  function round9() {
    const h = rnd(2, 7);
    /* three of the four share a hundreds digit, so length and first digit are both useless */
    set9 = shuffle([h * 100 + rnd(0, 30), h * 100 + rnd(40, 69), h * 100 + rnd(70, 99), (h + 1) * 100 + rnd(0, 40)]);
    taken9 = []; paint9();
    $("ch9").innerHTML = set9.map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("ch9").onclick = (e) => {
      const b = e.target.closest(".choice"); if (!b || b.disabled) return;
      const v = Number(b.dataset.v);
      const left = set9.filter((x) => !taken9.includes(x));
      const smallest = Math.min(...left);
      if (v !== smallest) {
        b.classList.add("wrong");
        $("fb9").className = "fb"; $("fb9").textContent = smallest + " is smaller than " + v + ", so " + smallest + " comes first.";
        say(smallest + " is smaller");
        setTimeout(() => b.classList.remove("wrong"), 700);
        return;
      }
      taken9.push(v); b.classList.add("right"); b.disabled = true; paint9(); say(String(v));
      if (taken9.length === set9.length) {
        asked9++; got9++;
        $("fb9").className = "fb good";
        $("fb9").textContent = cheer() + " " + taken9.join(" < ") + ".";
        say("In order: " + taken9.join(", "));
        scoreLine("sc9", got9, asked9, 3);
        if (got9 >= 3) finish(8, "");
        setTimeout(round9, 2000);
      }
    };
  }
  round9();

  /* ---- 10: rounding ---- 3Np.05 round 3-digit numbers to the nearest 10 or 100 */
  let got10 = 0, asked10 = 0;
  function round10() {
    const to = rnd(0, 1) ? 10 : 100;
    const n = rnd(101, 989);
    const lo = Math.floor(n / to) * to, hi = lo + to, mid = lo + to / 2;
    const exact = n % to === 0;
    const answer = exact ? n : (n >= mid ? hi : lo);
    const x = (v) => 52 + 416 * (v - lo) / to;
    let svg = '<line class="axis" x1="20" y1="70" x2="500" y2="70"></line>';
    for (let k = 0; k <= 10; k++) { const vx = 52 + 41.6 * k; svg += '<line class="tick" x1="' + vx.toFixed(1) + '" y1="64" x2="' + vx.toFixed(1) + '" y2="76"></line>'; }
    svg += '<line class="half" x1="' + x(mid).toFixed(1) + '" y1="52" x2="' + x(mid).toFixed(1) + '" y2="88"></line>';
    svg += '<text class="lab mid" x="' + x(mid).toFixed(1) + '" y="106">' + mid + "</text>";
    svg += '<circle class="pin" cx="' + x(lo).toFixed(1) + '" cy="70" r="6"></circle><text class="lab" x="' + x(lo).toFixed(1) + '" y="106">' + lo + "</text>";
    svg += '<circle class="pin" cx="' + x(hi).toFixed(1) + '" cy="70" r="6"></circle><text class="lab" x="' + x(hi).toFixed(1) + '" y="106">' + hi + "</text>";
    svg += '<circle class="dotv" cx="' + x(n).toFixed(1) + '" cy="70" r="8"></circle><text class="mark" x="' + x(n).toFixed(1) + '" y="40">' + n + "</text>";
    $("line10").innerHTML = svg;
    $("say10").innerHTML = "Round <b>" + n + "</b> to the nearest <b>" + to + "</b>.";
    offer("ch10", [lo, hi], answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch10", b, ok)) return;
      asked10++; if (ok) got10++;
      const why = exact ? n + " is already a " + to + "." : n === mid ? "Exactly halfway - and the rule everyone agreed on is that halfway goes up." : (n > mid ? n + " is past halfway (" + mid + "), so it goes up." : n + " has not reached halfway (" + mid + "), so it goes down.");
      $("fb10").className = "fb " + (ok ? "good" : "");
      $("fb10").textContent = (ok ? cheer() + " " : "") + n + " to the nearest " + to + " is " + answer + ". " + why;
      say(ok ? cheer() + " " + answer : n + " rounds to " + answer);
      scoreLine("sc10", got10, asked10, 4);
      if (got10 >= 4) finish(9, "");
      setTimeout(round10, 2000);
    });
  }
  round10();

  /* ---- 11: estimate ---- 3Nc.01 estimate the number of objects or people (up to 1000) */
  let got11 = 0, asked11 = 0;
  function round11() {
    const real = rnd(2, 9) * 50 + rnd(-18, 18);
    let h = "";
    for (let i = 0; i < real; i++) h += '<i style="left:' + (2 + Math.random() * 95).toFixed(2) + "%;top:" + (3 + Math.random() * 92).toFixed(2) + '%"></i>';
    $("box11").innerHTML = h;
    const near = Math.round(real / 50) * 50;
    const opts = [near, near + 150, Math.max(50, near - 150), near + 300];
    offer("ch11", [...new Set(opts)].slice(0, 4), near, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === near;
      if (!mark("ch11", b, ok)) return;
      asked11++; if (ok) got11++;
      $("fb11").className = "fb " + (ok ? "good" : "");
      $("fb11").textContent = (ok ? cheer() + " " : "") + "There were " + real + ", so about " + near + " was the closest. An estimate is meant to be close, not exact.";
      say(ok ? cheer() + " there were " + real : "There were " + real + ", so " + near + " was closest");
      scoreLine("sc11", got11, asked11, 3);
      if (got11 >= 3) finish(10, "");
      setTimeout(round11, 2200);
    });
  }
  round11();

  /* ---- 18: check ---- every question draws on a step above */
  const QS = [
    () => { const n = rnd(2, 9) * 100 + rnd(1, 9) * 10 + rnd(1, 9); const h = Math.floor(n / 100); return { q: "In " + n + ", what is the " + h + " worth?", opts: [h * 100, h, h * 10], a: h * 100, why: "It stands in the hundreds column, so it is worth " + h * 100 + "." }; },
    () => { const n = rnd(11, 89); return { q: "What is " + n + " × 10?", opts: [n * 10, n + 10, n * 100], a: n * 10, why: "Every digit moves one column left, so " + n + " × 10 = " + n * 10 + "." }; },
    () => { const n = rnd(2, 8) * 100 + rnd(51, 99); const r = Math.round(n / 100) * 100; return { q: "Round " + n + " to the nearest 100.", opts: [r, r - 100, Math.floor(n / 10) * 10], a: r, why: n + " is past halfway, so it rounds up to " + r + "." }; },
    () => { const n = rnd(100, 999); const last = n % 10; return { q: "Is " + n + " odd or even?", opts: [last % 2 === 0 ? "even" : "odd", last % 2 === 0 ? "odd" : "even"], a: last % 2 === 0 ? "even" : "odd", why: "It ends in " + last + ", so it is " + (last % 2 === 0 ? "even" : "odd") + "." }; },
    () => { const a = rnd(2, 8) * 100 + rnd(0, 99), b = Math.floor(a / 100) * 100 + rnd(0, 99); const s = a > b ? ">" : a < b ? "<" : "="; return { q: "Which sign goes between " + a + " and " + b + "?", opts: [">", "<", "="], a: s, why: a + " " + s + " " + b + "." }; },
    () => { const n = rnd(2, 8) * 100 + rnd(10, 99); const h = Math.floor(n / 100) * 100, t = Math.floor(n / 10) % 10 * 10, o = n % 10; return { q: "Which of these adds up to " + n + "?", opts: [h + " + " + t + " + " + o, h + " + " + (t + 10) + " + " + o, (h + 100) + " + " + t + " + " + o], a: h + " + " + t + " + " + o, why: n + " is " + h + " + " + t + " + " + o + "." }; },
    () => { const st = [10, 100][rnd(0, 1)]; const s = rnd(2, 7) * 100 + rnd(0, 9) * 10 + rnd(0, 9); return { q: "Count on in " + st + "s from " + s + ". What comes next?", opts: [s + st, s + st * 10, s + 1], a: s + st, why: s + " + " + st + " = " + (s + st) + "." }; },
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
      if (got18 >= 5) finish(11, "You have finished the check. Well done.");
      else retryCheck($("fb18"), $("ch18"), got18, order18.length, 5, function () { qi = 0; got18 = 0; order18 = shuffle(QS); round18(); });
      return;
    }
    const item = nextQ(order18[qi]);
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
      $("sc18").textContent = got18 + " right out of " + qi;
      setTimeout(round18, 2000);
    });
  }
  order18 = shuffle(QS);
  round18();

  /* ---- 19: stickers ---- */
  const STICKERS = [
    ["🏗️", "Three digits"],
    ["🔤", "Read it and write it"],
    ["✂️", "Break it apart"],
    ["🔄", "Regrouping"],
    ["✖️", "Ten times bigger"],
    ["👣", "Count in steps"],
    ["⚖️", "Odd or even"],
    ["📏", "Which is bigger"],
    ["🔢", "Put them in order"],
    ["🎯", "Rounding"],
    ["👀", "Estimating"],
    ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];

  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb19").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb19").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You know your numbers to a thousand." : got + " of " + STICKERS.length + " stickers so far.";
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
            "348 is bigger than 315.",
            "Both have 3 hundreds, so look at the tens: 4 tens beats 1 ten.",
            [
                  "348 has more digits than 315.",
                  "8 is bigger than 5."
            ],
            "Start at the biggest column. The hundreds match, so the tens settle it and the ones never get a say."
      ],
      [
            "70 × 10 = 700.",
            "Every digit moves one column left, so the 7 tens become 7 hundreds.",
            [
                  "You add a zero on the end.",
                  "70 and 10 both end in zero, so the answer does too."
            ],
            "Adding a zero happens to work for whole numbers and stops working the moment there is a decimal point. The move is the part that is actually true."
      ],
      [
            "462 is even.",
            "It ends in 2, and 2 shares into two equal groups.",
            [
                  "It has a 4 at the front, and 4 is even.",
                  "462 is a big number, and big numbers are even."
            ],
            "Only the last digit decides. The hundreds and the tens make no difference at all."
      ],
      [
            "In 505 the two 5s are not worth the same.",
            "The left 5 stands in the hundreds column and the right one in the ones, so they are worth 500 and 5.",
            [
                  "One of them is written first.",
                  "The 0 in the middle makes them different."
            ],
            "Position decides value. The digit only says how many."
      ],
      [
            "607 rounds to 610 to the nearest ten.",
            "607 is past 605, which is halfway between 600 and 610.",
            [
                  "600 is nearer because 607 starts with a 6.",
                  "607 has a 7 in it, and 7 is a big digit."
            ],
            "Find the two tens either side, mark halfway, then see which side the number falls."
      ],
      [
            "480 is nearer to 500 than to 400.",
            "480 is 20 away from 500 and 80 away from 400.",
            [
                  "It starts with a 4, so it belongs with 400.",
                  "480 is a big number."
            ],
            "The first digit tells you which two hundreds a number sits between. It does not tell you which of them it is nearer."
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

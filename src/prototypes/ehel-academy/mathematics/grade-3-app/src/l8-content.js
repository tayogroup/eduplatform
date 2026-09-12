
  /* ==================================================================
     ASK, COUNT AND CHART - Grade 3 statistics and probability.
     Cambridge Primary Mathematics 0096, Stage 3 (3Ss.01-03, 3Sp.01-02).
     ================================================================== */

  function offer(host, opts, right, onPick) {
    $(host).innerHTML = shuffle(opts).map((o) => '<button type="button" class="choice' + (String(o).length > 18 ? " word" : "") + '" data-v="' + o + '">' + o + "</button>").join("");
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
  const THINGS = ["Walk", "Bus", "Bicycle", "Car"];
  const FRUIT = ["Apples", "Bananas", "Mangoes", "Oranges"];

  /* ---- 1: statistical questions ---- 3Ss.01 answer non-statistical and statistical questions */
  const STATQ = [
    "How do the children in this class travel to school?",
    "What is the favourite fruit in Class 3?",
    "How many pets does each child in the class have?",
    "Which month has the most birthdays in our class?",
  ];
  const PLAINQ = [
    "How many legs has a spider?",
    "How many days are there in a week?",
    "What is 7 × 8?",
    "How many sides has a hexagon?",
  ];
  let got1 = 0, asked1 = 0;
  function round1() {
    const right = STATQ[rnd(0, STATQ.length - 1)];
    const opts = uniq([right, ...shuffle(PLAINQ)], 3);
    $("say1").innerHTML = "Which one do you need to <b>collect data</b> to answer?";
    offer("ch1", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch1", b, ok)) return;
      asked1++; if (ok) got1++;
      $("fb1").className = "fb " + (ok ? "good" : "");
      $("fb1").textContent = (ok ? cheer() + " " : "") + "The others have one answer that is the same for everybody, so there is nothing to collect. This one only has an answer once you have asked people, and the answers vary.";
      say(ok ? cheer() : "That one needs data");
      scoreLine("sc1", got1, asked1, 3);
      if (got1 >= 3) finish(0, "");
      setTimeout(round1, 2500);
    });
  }
  round1();

  /* ---- 2: tally chart ---- 3Ss.02 tally charts and frequency tables */
  let got2 = 0, asked2 = 0;
  function tallyMarks(n) {
    const b = Math.floor(n / 5), r = n % 5;
    let out = [];
    for (let i = 0; i < b; i++) out.push("卌");
    if (r) out.push("|".repeat(r));
    return out.join(" ") || "—";
  }
  function round2() {
    const rows = THINGS.map((t) => ({ t, n: rnd(1, 18) }));
    let h = "<tr><th>How we travel</th><th>Tally</th><th>Total</th></tr>";
    const askIdx = rnd(0, rows.length - 1);
    rows.forEach((r, i) => {
      h += "<tr><th>" + r.t + '</th><td class="marks">' + tallyMarks(r.n) + '</td><td class="n">' + (i === askIdx ? "?" : r.n) + "</td></tr>";
    });
    $("tb2").innerHTML = h;
    const answer = rows[askIdx].n;
    $("say2").innerHTML = "How many chose <b>" + rows[askIdx].t + "</b>? Count the bundles in fives.";
    const opts = uniq([answer, answer + 1, answer - 1, answer + 5], 4).filter((v) => v > 0);
    offer("ch2", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch2", b, ok)) return;
      asked2++; if (ok) got2++;
      const bundles = Math.floor(answer / 5), left = answer % 5;
      $("tb2").rows[askIdx + 1].cells[2].textContent = answer;
      $("fb2").className = "fb " + (ok ? "good" : "");
      $("fb2").textContent = (ok ? cheer() + " " : "") + bundles + " bundle" + (bundles === 1 ? "" : "s") + " of five is " + bundles * 5 + (left ? ", and " + left + " more makes " + answer : " altogether") + ".";
      say(ok ? cheer() : "It is " + answer);
      scoreLine("sc2", got2, asked2, 4);
      if (got2 >= 4) finish(1, "");
      setTimeout(round2, 2600);
    });
  }
  round2();

  /* ---- 3: pictogram ---- 3Ss.02 pictograms */
  let got3 = 0, asked3 = 0;
  function round3() {
    const per = [2, 5, 10][rnd(0, 2)];
    const rows = FRUIT.map((t) => {
      const whole = rnd(1, 5), half = rnd(0, 1);
      return { t, whole, half, n: whole * per + (half ? per / 2 : 0) };
    });
    const askIdx = rnd(0, rows.length - 1);
    $("key3").className = "fb";
    $("key3").innerHTML = "<b>Key:</b> 🍎 = " + per + " children. Half a picture = " + per / 2 + ".";
    $("pg3").innerHTML = rows.map((r) =>
      '<div class="pictorow"><span class="who">' + r.t + '</span><span class="ics">' + "🍎".repeat(r.whole) + (r.half ? "🌗" : "") + "</span></div>").join("");
    const answer = rows[askIdx].n;
    $("say3").innerHTML = "How many children chose <b>" + rows[askIdx].t + "</b>?";
    const opts = uniq([answer, rows[askIdx].whole + (rows[askIdx].half ? 1 : 0), answer + per, Math.max(1, answer - per)], 4);
    offer("ch3", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch3", b, ok)) return;
      asked3++; if (ok) got3++;
      const r = rows[askIdx];
      $("fb3").className = "fb " + (ok ? "good" : "");
      $("fb3").textContent = (ok ? cheer() + " " : "") + r.whole + " whole picture" + (r.whole === 1 ? "" : "s") + " × " + per + " = " + r.whole * per + (r.half ? ", plus half a picture (" + per / 2 + ") = " + answer : "") + ". Counting the pictures instead of reading the key gives " + (r.whole + (r.half ? 1 : 0)) + ".";
      say(ok ? cheer() : "It is " + answer);
      scoreLine("sc3", got3, asked3, 4);
      if (got3 >= 4) finish(2, "");
      setTimeout(round3, 2900);
    });
  }
  round3();

  /* ---- 4 and 7: bar charts ---- 3Ss.02 bar charts / 3Ss.03 interpret data */
  function drawBars(host, rows, step, hiIdx) {
    const max = Math.max(...rows.map((r) => r.n));
    const top = Math.ceil(max / step) * step || step;
    $(host).innerHTML = rows.map((r, i) =>
      '<div class="col"><span class="val">' + r.n + '</span><div class="bar' + (i === hiIdx ? " hi" : "") + '" style="height:' + Math.round(150 * r.n / top) + 'px"></div><span class="cap">' + r.t + "</span></div>").join("");
  }
  let got4 = 0, asked4 = 0;
  function round4() {
    const step = [1, 2, 5][rnd(0, 2)];
    const rows = THINGS.map((t) => ({ t, n: rnd(1, 8) * step }));
    const askIdx = rnd(0, rows.length - 1);
    drawBars("bc4", rows, step, -1);
    const answer = rows[askIdx].n;
    $("say4").innerHTML = "How many chose <b>" + rows[askIdx].t + "</b>?";
    const opts = uniq([answer, answer + step, Math.max(step, answer - step), answer + 2 * step], 4);
    offer("ch4", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch4", b, ok)) return;
      asked4++; if (ok) got4++;
      drawBars("bc4", rows, step, askIdx);
      $("fb4").className = "fb " + (ok ? "good" : "");
      $("fb4").textContent = (ok ? cheer() + " " : "") + "The " + rows[askIdx].t + " bar reaches " + answer + ".";
      say(ok ? cheer() : "It is " + answer);
      scoreLine("sc4", got4, asked4, 4);
      if (got4 >= 4) finish(3, "");
      setTimeout(round4, 2500);
    });
  }
  round4();

  let got7 = 0, asked7 = 0;
  function round7() {
    const rows = FRUIT.map((t) => ({ t, n: rnd(2, 14) }));
    drawBars("bc7", rows, 2, -1);
    const sorted = rows.slice().sort((a, b2) => b2.n - a.n);
    const kind = rnd(0, 3);
    let q, answer, opts;
    if (kind === 0) { q = "Which was chosen most?"; answer = sorted[0].t; opts = rows.map((r) => r.t); }
    else if (kind === 1) { q = "Which was chosen least?"; answer = sorted[sorted.length - 1].t; opts = rows.map((r) => r.t); }
    else if (kind === 2) { const d = sorted[0].n - sorted[sorted.length - 1].n; q = "How many more chose " + sorted[0].t + " than " + sorted[sorted.length - 1].t + "?"; answer = d; opts = uniq([d, d + 1, Math.max(1, d - 1), d + 2], 4); }
    else { const tot = rows.reduce((s, r) => s + r.n, 0); q = "How many children were asked altogether?"; answer = tot; opts = uniq([tot, tot + 2, tot - 2, sorted[0].n], 4); }
    $("say7").textContent = q;
    offer("ch7", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(answer);
      if (!mark("ch7", b, ok)) return;
      asked7++; if (ok) got7++;
      $("fb7").className = "fb " + (ok ? "good" : "");
      $("fb7").textContent = (ok ? cheer() + " " : "") + "The answer is " + answer + ". Remember the chart tells you about the children who were asked - not about anybody else, and not why they chose it.";
      say(ok ? cheer() : "The answer is " + answer);
      scoreLine("sc7", got7, asked7, 4);
      if (got7 >= 4) finish(6, "");
      setTimeout(round7, 2700);
    });
  }
  round7();

  /* ---- 5: Venn ---- 3Ss.02 Venn diagrams */
  let got5 = 0, asked5 = 0;
  const VTESTS = [
    { a: "even", b: "more than 20", fa: (n) => n % 2 === 0, fb: (n) => n > 20 },
    { a: "odd", b: "less than 15", fa: (n) => n % 2 === 1, fb: (n) => n < 15 },
    { a: "a multiple of 5", b: "even", fa: (n) => n % 5 === 0, fb: (n) => n % 2 === 0 },
    { a: "a multiple of 10", b: "more than 25", fa: (n) => n % 10 === 0, fb: (n) => n > 25 },
  ];
  function round5() {
    const t = VTESTS[rnd(0, VTESTS.length - 1)];
    const n = rnd(1, 40);
    const inA = t.fa(n), inB = t.fb(n);
    const zone = inA && inB ? "both" : inA ? "a" : inB ? "b" : "none";
    $("q5").textContent = n;
    $("say5").innerHTML = "Is <b>" + n + "</b> " + t.a + "? Is it " + t.b + "? Tap where it belongs.";
    $("vn5").innerHTML =
      '<rect x="4" y="4" width="392" height="232" fill="none" stroke="var(--line)" stroke-width="2.5" rx="12"></rect>' +
      '<circle cx="155" cy="120" r="86"></circle><circle class="b" cx="245" cy="120" r="86"></circle>' +
      '<text class="t" x="112" y="34">' + t.a + "</text><text class=\"t\" x=\"290\" y=\"34\">" + t.b + "</text>" +
      '<circle class="zone" role="button" tabindex="0" aria-label="' + t.a + " only" + '" data-z="a" cx="112" cy="120" r="42"></circle>' +
      '<circle class="zone" role="button" tabindex="0" aria-label="both ' + t.a + " and " + t.b + '" data-z="both" cx="200" cy="120" r="34"></circle>' +
      '<circle class="zone" role="button" tabindex="0" aria-label="' + t.b + " only" + '" data-z="b" cx="288" cy="120" r="42"></circle>' +
      '<rect class="zone" role="button" tabindex="0" aria-label="neither" data-z="none" x="10" y="196" width="120" height="34" rx="8"></rect>' +
      '<text x="70" y="219" style="pointer-events:none">neither</text>';
    $("vn5").dataset.live = "1";
    $("vn5").onclick = (e) => {
      const z = e.target.closest(".zone"); if (!z || $("vn5").dataset.live !== "1") return;
      $("vn5").dataset.live = "0";
      const ok = z.dataset.z === zone;
      [...$("vn5").querySelectorAll(".zone")].forEach((x) => { if (x.dataset.z === zone) x.classList.add("on"); });
      asked5++; if (ok) got5++;
      $("fb5").className = "fb " + (ok ? "good" : "");
      $("fb5").textContent = (ok ? cheer() + " " : "") + n + " is " + (inA ? "" : "not ") + t.a + " and " + (inB ? "" : "not ") + t.b + ", so it goes " + (zone === "both" ? "in the middle, where the hoops overlap" : zone === "none" ? "outside both hoops" : "in the " + (zone === "a" ? t.a : t.b) + " hoop only") + ".";
      say(ok ? cheer() : "It goes " + (zone === "both" ? "in the middle" : zone === "none" ? "outside both" : "in one hoop"));
      scoreLine("sc5", got5, asked5, 4);
      if (got5 >= 4) finish(4, "");
      setTimeout(round5, 2900);
    };
  }
  round5();

  /* ---- 6: Carroll ---- 3Ss.02 Carroll diagrams */
  let got6 = 0, asked6 = 0;
  function round6() {
    const t = VTESTS[rnd(0, VTESTS.length - 1)];
    const n = rnd(1, 40);
    const inA = t.fa(n), inB = t.fb(n);
    const want = (inA ? "a" : "na") + "-" + (inB ? "b" : "nb");
    $("q6").textContent = n;
    $("say6").innerHTML = "Is <b>" + n + "</b> " + t.a + "? Is it " + t.b + "? Tap the right box.";
    $("cr6").innerHTML =
      "<tr><th></th><th>" + t.b + "</th><th>not " + t.b + "</th></tr>" +
      "<tr><th>" + t.a + '</th><td role="button" tabindex="0" aria-label="' + t.a + " and " + t.b + '" data-k="a-b">?</td><td role="button" tabindex="0" aria-label="' + t.a + " and not " + t.b + '" data-k="a-nb">?</td></tr>' +
      "<tr><th>not " + t.a + '</th><td role="button" tabindex="0" aria-label="not ' + t.a + " and " + t.b + '" data-k="na-b">?</td><td role="button" tabindex="0" aria-label="not ' + t.a + " and not " + t.b + '" data-k="na-nb">?</td></tr>';
    $("cr6").dataset.live = "1";
    $("cr6").onclick = (e) => {
      const td = e.target.closest("td"); if (!td || $("cr6").dataset.live !== "1") return;
      $("cr6").dataset.live = "0";
      const ok = td.dataset.k === want;
      [...$("cr6").querySelectorAll("td")].forEach((x) => { if (x.dataset.k === want) { x.classList.add("on"); x.textContent = n; } else if (x === td) x.classList.add("no"); });
      asked6++; if (ok) got6++;
      $("fb6").className = "fb " + (ok ? "good" : "");
      $("fb6").textContent = (ok ? cheer() + " " : "") + n + " is " + (inA ? "" : "not ") + t.a + " and " + (inB ? "" : "not ") + t.b + ". A Carroll diagram holds the same information as a Venn diagram - the not-and-not box is the same as being outside both hoops.";
      say(ok ? cheer() : "It goes in the " + (inA ? "" : "not ") + t.a + " row");
      scoreLine("sc6", got6, asked6, 4);
      if (got6 >= 4) finish(5, "");
      setTimeout(round6, 3000);
    };
  }
  round6();

  /* ---- 8: choosing a representation ---- 3Ss.02 "Choose and explain which
     representation to use in a given situation". The six forms are each taught
     above; this is the sentence of the objective that asks the learner to pick
     between them, and it is the one place the lesson asks for a judgement
     rather than a count. */
  const PICKS = [
    {
      q: "Musa is standing by the road, counting cars as they drive past as fast as they come.",
      a: "a tally chart",
      why: "A tally is the only one you can keep up with while things are happening - one mark each, bundled in fives. You cannot draw a bar chart of cars that have already gone past."
    },
    {
      q: "Hodan has the totals already, and wants to see at a glance which fruit was most popular.",
      a: "a bar chart",
      why: "Height is the quickest thing an eye can compare. A tally would hold the same numbers, but you would have to count them all again to see which won."
    },
    {
      q: "Omar wants to show how many children chose each drink, using one picture to stand for five children.",
      a: "a pictogram",
      why: "A pictogram is a bar chart made of pictures, and its key is what lets one picture stand for five. Nothing else here uses a key."
    },
    {
      q: "Some children play football, some play chess, and Amina wants the ones who do both to stand out.",
      a: "a Venn diagram",
      why: "The overlap is the whole point, and only the Venn diagram has one. A bar chart would need a third bar for 'both' and would hide who they are."
    },
    {
      q: "Yusuf wants to sort numbers by two yes-or-no questions, with a box for every combination, including neither.",
      a: "a Carroll diagram",
      why: "Four boxes for four answers, and everything lands in exactly one. A Venn holds the same information, but 'neither' sits outside the hoops rather than in a box of its own."
    },
    {
      q: "Leila has finished counting and wants the totals written down neatly, ready to read off.",
      a: "a frequency table",
      why: "A table is for holding numbers, not for comparing them. It is what you make from a tally before you draw anything."
    },
  ];
  const FORMS = ["a tally chart", "a bar chart", "a pictogram", "a Venn diagram", "a Carroll diagram", "a frequency table"];
  let got8c = 0, asked8c = 0;
  function round8c() {
    const it = PICKS[rnd(0, PICKS.length - 1)];
    $("q8c").className = "fb";
    $("q8c").textContent = it.q;
    $("say8c").textContent = it.q;
    const opts = uniq([it.a].concat(shuffle(FORMS.filter((f) => f !== it.a))), 4);
    offer("ch8c", opts, it.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === it.a;
      if (!mark("ch8c", b, ok)) return;
      asked8c++; if (ok) got8c++;
      $("fb8c").className = "fb " + (ok ? "good" : "");
      $("fb8c").textContent = (ok ? cheer() + " " : "It is " + it.a + ". ") + it.why;
      say(ok ? cheer() : it.why);
      scoreLine("sc8c", got8c, asked8c, 4);
      if (got8c >= 4) finish(7, "");
      setTimeout(round8c, 3200);
    });
  }
  round8c();

  /* ---- 9: chance language ---- 3Sp.01 'it will happen', 'it will not happen', 'it might happen' */
  const CHANCE = [
    { t: "The sun will come up tomorrow morning.", a: "it will happen" },
    { t: "It will rain at some point next month.", a: "it might happen" },
    { t: "A cat will do your homework tonight.", a: "it will not happen" },
    { t: "You will roll a 7 on an ordinary six-sided dice.", a: "it will not happen" },
    { t: "You will roll a number less than 7 on an ordinary dice.", a: "it will happen" },
    { t: "The next car to pass will be red.", a: "it might happen" },
    { t: "December will come after November this year.", a: "it will happen" },
    { t: "You will grow younger next year.", a: "it will not happen" },
    { t: "Your teacher will wear blue tomorrow.", a: "it might happen" },
    { t: "A tossed coin will land on heads.", a: "it might happen" },
  ];
  const LIKELY = ["it will not happen", "it might happen", "it will happen"];
  let got8 = 0, asked8 = 0, cur8 = null;
  function round8() {
    cur8 = CHANCE[rnd(0, CHANCE.length - 1)];
    $("q8").textContent = cur8.t;
    $("say8").textContent = cur8.t;
    $("lk8").innerHTML = LIKELY.map((v) => '<button type="button" data-v="' + v + '">' + v + "</button>").join("");
    $("lk8").dataset.live = "1";
    $("lk8").onclick = (e) => {
      const b = e.target.closest("button"); if (!b || $("lk8").dataset.live !== "1") return;
      $("lk8").dataset.live = "0";
      const ok = b.dataset.v === cur8.a;
      [...$("lk8").children].forEach((x) => { if (x.dataset.v === cur8.a) x.classList.add("on"); });
      asked8++; if (ok) got8++;
      $("fb8").className = "fb " + (ok ? "good" : "");
      $("fb8").textContent = (ok ? cheer() + " " : "") + "This one is “" + cur8.a + "”. Save “will not” for things that truly cannot happen. If it could happen, even rarely, it might happen.";
      say(ok ? cheer() : cur8.a);
      scoreLine("sc8", got8, asked8, 5);
      if (got8 >= 5) finish(8, "");
      setTimeout(round8, 2900);
    };
  }
  round8();

  /* ---- 9: chance experiment ---- 3Sp.02 conduct chance experiments, and present and describe the results */
  const SECT = [{ n: "red", c: "#E9744F", w: 3 }, { n: "blue", c: "#35BFB2", w: 2 }, { n: "gold", c: "#F4C95D", w: 1 }];
  const TOTW = SECT.reduce((s, x) => s + x.w, 0);
  const tally9 = { red: 0, blue: 0, gold: 0 };
  let spins9 = 0, angle9 = 0;
  function paintSpinner() {
    let a0 = -90, h = "";
    SECT.forEach((s) => {
      const sweep = 360 * s.w / TOTW, a1 = a0 + sweep;
      const r = 78, cx = 95, cy = 95;
      const p0 = [cx + r * Math.cos(a0 * Math.PI / 180), cy + r * Math.sin(a0 * Math.PI / 180)];
      const p1 = [cx + r * Math.cos(a1 * Math.PI / 180), cy + r * Math.sin(a1 * Math.PI / 180)];
      h += '<path class="sec" fill="' + s.c + '" d="M' + cx + " " + cy + " L" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + " A" + r + " " + r + " 0 " + (sweep > 180 ? 1 : 0) + " 1 " + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + ' Z"></path>';
      a0 = a1;
    });
    h += '<line class="ndl" x1="95" y1="95" x2="95" y2="30" style="transform:rotate(' + angle9 + 'deg)"></line>';
    h += '<circle cx="95" cy="95" r="8" fill="var(--ink)"></circle>';
    $("sp9").innerHTML = h;
  }
  function landOn(deg) {
    /* the needle points up at 0deg; sectors are laid out clockwise from up */
    const d = ((deg % 360) + 360) % 360;
    let a = 0;
    for (const s of SECT) { const sweep = 360 * s.w / TOTW; if (d >= a && d < a + sweep) return s.n; a += sweep; }
    return SECT[SECT.length - 1].n;
  }
  function paintTot() {
    $("tot9").innerHTML = SECT.map((s) => "<span>" + s.n + ": <b>" + tally9[s.n] + "</b></span>").join("") + "<span>spins: <b>" + spins9 + "</b></span>";
    const exp = SECT.map((s) => s.n + " about " + Math.round(spins9 * s.w / TOTW)).join(", ");
    $("fb9").className = "fb" + (spins9 >= 30 ? " good" : "");
    $("fb9").textContent = spins9 === 0 ? "Spin it and keep the score."
      : spins9 < 30 ? "After only " + spins9 + " spins the counts can look like anything. Keep going."
      : "After " + spins9 + " spins: expected roughly " + exp + ". Red has the most room, so red comes up most - but only over many spins.";
    if (spins9 >= 30) finish(9, "");
  }
  function doSpin(times) {
    for (let k = 0; k < times; k++) {
      const deg = Math.random() * 360;
      tally9[landOn(deg)]++;
      spins9++;
      angle9 = deg + 360 * (k === times - 1 ? 3 : 0);
    }
    paintSpinner(); paintTot();
    if (times === 1) say(landOn(((angle9 % 360) + 360) % 360));
  }
  $("spin9").addEventListener("click", () => doSpin(1));
  $("spin9x").addEventListener("click", () => doSpin(20));
  paintSpinner(); paintTot();

  /* ---- 10: check ---- */
  const QS = [
    () => { const n = rnd(6, 19); return { q: "A tally shows " + Math.floor(n / 5) + " bundles of five and " + (n % 5) + " single marks. How many is that?", opts: [n, n + 1, n - 1], a: n, why: Math.floor(n / 5) + " × 5 = " + Math.floor(n / 5) * 5 + ", plus " + (n % 5) + " = " + n + "." }; },
    () => { const per = [2, 5, 10][rnd(0, 2)], w = rnd(2, 5); return { q: "On a pictogram one picture = " + per + " children. How many is " + w + " pictures?", opts: [w * per, w, w + per], a: w * per, why: w + " × " + per + " = " + w * per + "." }; },
    () => { const per = 10; return { q: "One picture = 10 children. How many is half a picture?", opts: [5, 1, 10], a: 5, why: "Half of 10 is 5." }; },
    () => { return { q: "Where does a number that is BOTH even AND more than 20 go on a Venn diagram?", opts: ["in the middle, where the hoops overlap", "outside both hoops", "in one hoop only"], a: "in the middle, where the hoops overlap", why: "Both answers are yes, so it belongs to both hoops at once." }; },
    () => { return { q: "Zara rolls an ordinary six-sided dice. Will she get a 7?", opts: ["it will not happen", "it might happen", "it will happen"], a: "it will not happen", why: "An ordinary dice has no 7 on it at all." }; },
    () => { return { q: "Ali tosses a coin. Will it land on heads?", opts: ["it might happen", "it will happen", "it will not happen"], a: "it might happen", why: "It could land either way." }; },
    () => { return { q: "Which question needs you to collect data?", opts: ["What is the favourite fruit in our class?", "How many days are in a week?", "How many sides has a hexagon?"], a: "What is the favourite fruit in our class?", why: "The answers would be different for different people." }; },
    () => { const a = rnd(6, 14), b2 = rnd(1, 5); return { q: "On a bar chart, Walk is " + a + " and Bus is " + b2 + ". How many more chose Walk?", opts: [a - b2, a + b2, a], a: a - b2, why: a + " − " + b2 + " = " + (a - b2) + "." }; },
    () => { return { q: "A spinner is half red, a quarter blue and a quarter gold. Which colour comes up most over many spins?", opts: ["red", "blue", "gold"], a: "red", why: "Red has the most room, so the arrow lands on it most often." }; },
    () => { return { q: "A Carroll diagram box says 'not even' and 'not more than 20'. Which number belongs there?", opts: [7, 22, 8], a: 7, why: "7 is odd and it is not more than 20." }; }
  ];
  let qi = 0, got10 = 0, order10 = [];
  function round10() {
    if (qi >= order10.length) {
      $("q10").textContent = ""; $("ch10").innerHTML = "";
      $("fb10").className = "fb good"; $("fb10").textContent = "Finished! " + got10 + " out of " + order10.length + ".";
      $("sc10").textContent = "";
      if (got10 >= 8) finish(10, "You have finished the check.");
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
      setTimeout(round10, 2200);
    });
  }
  order10 = shuffle(QS);
  round10();

  /* ---- 11: stickers ---- */
  const STICKERS = [
    ["❓", "A question worth asking"], ["✏️", "Tally marks"], ["🍎", "Pictograms"], ["📊", "Bar charts"],
    ["⭕", "Venn diagrams"], ["🔲", "Carroll diagrams"], ["🔍", "What the data says"], ["📈", "Choosing the right chart"], ["🎲", "Will, might, will not"],
    ["🎡", "Try it and see"], ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb11").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb11").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You can ask, count, chart and judge a chance." : got + " of " + STICKERS.length + " stickers so far.";
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
            "Asking the class their favourite fruit needs data; asking how many days are in a week does not.",
            "The first has different answers from different people; the second has one answer for everybody.",
            [
                  "The first is a longer question.",
                  "The second one is about maths and the first one is not."
            ],
            "The test is whether the answers would vary."
      ],
      [
            "On a pictogram where one picture means 5, four pictures mean 20.",
            "Each picture stands for 5, and 4 × 5 = 20.",
            [
                  "There are four pictures, so it is 4.",
                  "5 + 4 = 9."
            ],
            "Read the key first, every single time."
      ],
      [
            "Rolling a 7 on an ordinary dice will not happen.",
            "An ordinary dice only has the numbers 1 to 6 on it, so there is no 7 to land on.",
            [
                  "It could still happen, even if it hardly ever does.",
                  "It will not happen because 7 is a big number."
            ],
            "Save will not for things that genuinely cannot happen. Something that hardly ever happens still might."
      ],
      [
            "A tally is better than a bar chart for counting cars as they drive past.",
            "You can add one mark as each car passes; you cannot draw a bar for cars that have already gone.",
            [
                  "Tallies are always better than bar charts.",
                  "Bar charts do not work outdoors."
            ],
            "Each way of showing data is good at one thing. This one is about keeping up while it happens."
      ],
      [
            "A number in the middle of a Venn diagram is in both hoops.",
            "The middle is where the two hoops overlap, so it answers yes to both questions.",
            [
                  "The middle means it is in neither hoop.",
                  "The middle is for the ones you are not sure about."
            ],
            "Outside both hoops is the part that means neither."
      ],
      [
            "Three spins of a spinner do not tell you which colour will come up most often.",
            "A few spins can come out any way at all; the pattern only shows after many.",
            [
                  "Spinners are always fair.",
                  "Three spins is plenty to be sure."
            ],
            "The smallest colour can easily win the first three."
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

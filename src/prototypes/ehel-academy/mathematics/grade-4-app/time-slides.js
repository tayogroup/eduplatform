  /* ---- 1: units of time (4Gt.01) ---- */
  const UNITS1 = [
    { chip: "weeks → days", big: "week", small: "day", per: 7, max: 8 },
    { chip: "years → months", big: "year", small: "month", per: 12, max: 6 },
    { chip: "days → hours", big: "day", small: "hour", per: 24, max: 5 },
    { chip: "hours → minutes", big: "hour", small: "minute", per: 60, max: 5 },
    { chip: "minutes → seconds", big: "minute", small: "second", per: 60, max: 5 },
  ];
  let u1 = 0, many1 = 3;
  const seen1 = new Set();
  const pad2 = (n) => (n < 10 ? "0" : "") + n;
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  $("pick1").innerHTML = UNITS1.map((u, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + u.chip + "</button>").join("");
  function paint1() {
    const U = UNITS1[u1];
    if (many1 > U.max) many1 = U.max;
    $("many1").max = U.max;
    $("many1").value = many1;
    $("manyLab1").textContent = many1;
    const total = many1 * U.per;
    /* dots while they can still be counted; the numeral once they cannot */
    const dotty = total <= 60;
    let g = "";
    for (let i = 0; i < many1; i++) {
      g += '<div class="tgrp"><span class="glab">1 ' + U.big + "</span>";
      if (dotty) { g += '<div class="gdots">'; for (let j = 0; j < U.per; j++) g += "<i></i>"; g += "</div>"; }
      else g += '<div class="gnum">' + U.per + "</div>";
      g += "</div>";
    }
    $("groups1").innerHTML = g;
    lines($("work1"), [
      { k: "The rule", v: "1 " + U.big + " = <b>" + U.per + "</b> " + U.small + "s" },
      { k: "So " + plural(many1, U.big), v: many1 + " × " + U.per },
      { k: "Which is", v: "<b>" + fmt(total) + "</b> " + U.small + "s", total: true },
      { k: "And back again", v: fmt(total) + " ÷ " + U.per + " = <b>" + many1 + "</b> " + U.big + (many1 === 1 ? "" : "s") },
    ]);
    $("fb1").textContent = plural(many1, U.big) + " is " + plural(total, U.small) + ".";
    seen1.add(u1);
    $("task1").textContent = seen1.size >= 3
      ? "You have converted " + seen1.size + " of the 5."
      : "Try at least three of the five pairs.";
    if (seen1.size >= 3) finish(0, "");
  }
  $("pick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    u1 = Number(b.dataset.i);
    [...$("pick1").children].forEach((c, i) => c.classList.toggle("on", i === u1));
    paint1(); say(UNITS1[u1].chip.replace("→", "into"));
  });
  $("many1").addEventListener("input", (e) => { many1 = Number(e.target.value); paint1(); });
  paint1();

  /* ---- 2: clock faces, 12-hour and 24-hour (4Gt.02) ---- */
  let t2 = 9 * 60 + 35;                 /* minutes since midnight */
  const TARGETS2 = [14 * 60 + 30, 7 * 60 + 45, 18 * 60 + 15, 12 * 60, 21 * 60 + 5];
  let tgt2 = 0, hit2 = 0;
  const to12 = (t) => {
    const h = Math.floor(t / 60) % 24, m = t % 60;
    const s = h < 12 ? "am" : "pm", hh = ((h + 11) % 12) + 1;
    return hh + ":" + pad2(m) + " " + s;
  };
  const to24 = (t) => pad2(Math.floor(t / 60) % 24) + ":" + pad2(t % 60);
  function drawClock() {
    const h = Math.floor(t2 / 60) % 12, m = t2 % 60;
    const ha = (h + m / 60) * 30 - 90, ma = m * 6 - 90;
    const arm = (a, len, cls) => '<line class="' + cls + '" x1="100" y1="100" x2="' +
      (100 + len * Math.cos(a * Math.PI / 180)).toFixed(1) + '" y2="' +
      (100 + len * Math.sin(a * Math.PI / 180)).toFixed(1) + '"></line>';
    let s = '<circle class="face" cx="100" cy="100" r="92"></circle>';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 - 90, r1 = i % 5 === 0 ? 76 : 84;
      s += '<line class="tick' + (i % 5 === 0 ? " big" : "") + '" x1="' + (100 + r1 * Math.cos(a * Math.PI / 180)).toFixed(1) +
        '" y1="' + (100 + r1 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" x2="' + (100 + 88 * Math.cos(a * Math.PI / 180)).toFixed(1) +
        '" y2="' + (100 + 88 * Math.sin(a * Math.PI / 180)).toFixed(1) + '"></line>';
    }
    for (let i = 1; i <= 12; i++) {
      const a = i * 30 - 90;
      s += '<text class="cnum" x="' + (100 + 62 * Math.cos(a * Math.PI / 180)).toFixed(1) +
        '" y="' + (100 + 62 * Math.sin(a * Math.PI / 180) + 6).toFixed(1) + '">' + i + "</text>";
    }
    s += arm(ha, 44, "hand hour") + arm(ma, 66, "hand min") + '<circle class="pin" cx="100" cy="100" r="5"></circle>';
    $("clock2").innerHTML = s;
    $("r12").textContent = to12(t2);
    $("r24").textContent = to24(t2);
    const want = TARGETS2[tgt2];
    if (t2 === want) {
      $("fb2").textContent = "That is it — " + to12(t2) + " is " + to24(t2) + ".";
      $("fb2").className = "fb good";
      if (hit2 <= tgt2) { hit2 = tgt2 + 1; say(to12(t2) + " is the same moment as " + to24(t2)); }
      if (tgt2 < TARGETS2.length - 1) { tgt2++; setTimeout(() => { $("fb2").className = "fb"; drawClock(); }, 1400); }
      if (hit2 >= 3) finish(1, "");
    } else {
      $("fb2").className = "fb";
      $("fb2").textContent = "";
    }
    $("task2").textContent = "Set the clock to " + to24(TARGETS2[tgt2]) + "  ·  matched " + hit2 + " of 3";
  }
  $("h2").addEventListener("click", () => { t2 = (t2 + 60) % 1440; drawClock(); });
  $("m2").addEventListener("click", () => { t2 = (t2 + 5) % 1440; drawClock(); });
  drawClock();

  /* ---- 3: timetables (4Gt.03) ---- */
  const STOPS3 = ["Market Gate", "Riverside", "Hill Road", "School"];
  const BUSES3 = ["Bus A", "Bus B", "Bus C", "Bus D"];
  const TT3 = [                      /* minutes since midnight, stop x bus */
    [7 * 60 + 20, 8 * 60 + 5, 9 * 60 + 40, 11 * 60 + 15],
    [7 * 60 + 38, 8 * 60 + 23, 10 * 60 + 2, 11 * 60 + 31],
    [7 * 60 + 55, 8 * 60 + 40, 10 * 60 + 22, 11 * 60 + 46],
    [8 * 60 + 10, 8 * 60 + 55, 10 * 60 + 40, 12 * 60],
  ];
  const Q3 = [
    { q: "You must be at School by 09:00. Which is the latest bus you can take?", a: 1,
      why: "Bus B reaches School at 08:55, five minutes before nine. Bus C does not get there until 10:40." },
    { q: "Which bus takes the longest to get from Market Gate to School?", a: 2,
      why: "Bus C leaves Market Gate at 09:40 and reaches School at 10:40, which is a whole hour. A and B take 50 minutes, and D takes only 45." },
    { q: "You arrive at Riverside at 09:45. Which is the next bus?", a: 2,
      why: "Bus C calls at Riverside at 10:02, the first one after you get there." },
  ];
  let q3 = 0, right3 = 0, lock3 = false;
  function paint3() {
    let h = "<tr><th>Stop</th>" + BUSES3.map((b, i) => '<th class="pick" data-b="' + i + '">' + b + "</th>").join("") + "</tr>";
    STOPS3.forEach((s, r) => {
      h += "<tr><td>" + s + "</td>" + TT3[r].map((t) => "<td>" + to24(t) + "</td>").join("") + "</tr>";
    });
    $("tt3").innerHTML = h;
    $("fb3").textContent = Q3[q3].q;
    $("fb3").className = "fb";
    $("task3").textContent = "Tap a bus at the top  ·  " + right3 + " of " + Q3.length + " right";
    lock3 = false;
  }
  $("tt3").addEventListener("click", (e) => {
    const th = e.target.closest("th.pick"); if (!th || lock3) return;
    lock3 = true;
    const ok = Number(th.dataset.b) === Q3[q3].a;
    if (ok) right3++;
    $("fb3").textContent = (ok ? cheer() + " " : "Not that one. ") + Q3[q3].why;
    $("fb3").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q3[q3].why);
    if (right3 >= 2) finish(2, "");
    q3 = (q3 + 1) % Q3.length;
    setTimeout(paint3, 2600);
  });
  paint3();

  /* ---- 4: time intervals (4Gt.04) ---- */
  let mode4 = 0;
  const MODE4 = ["Clock time", "Days and months"];
  $("pick4").innerHTML = MODE4.map((m, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + m + "</button>").join("");
  let done4 = 0;
  function newInterval() {
    if (mode4 === 0) {
      /* deliberately never bridges through 60: the end minutes are always the larger */
      const h1 = rnd(7, 10), m1 = rnd(0, 6) * 5;
      const h2 = h1 + rnd(1, 3), m2 = m1 + rnd(1, 5) * 5;
      return { h1: h1, m1: m1, h2: h2, m2: Math.min(m2, 55) };
    }
    const d1 = rnd(2, 9), d2 = d1 + rnd(4, 18);
    return { d1: d1, d2: d2 };
  }
  let iv4 = newInterval();
  function paint4() {
    if (mode4 === 0) {
      const a = iv4.h1 * 60 + iv4.m1, b = iv4.h2 * 60 + iv4.m2;
      const hh = iv4.h2 - iv4.h1, mm = iv4.m2 - iv4.m1;
      lines($("work4"), [
        { k: "Starts at", v: "<b>" + to24(a) + "</b>" },
        { k: "Ends at", v: "<b>" + to24(b) + "</b>" },
        { k: "Whole hours first", v: iv4.h1 + " to " + iv4.h2 + " is <b>" + plural(hh, "hour") + "</b>" },
        { k: "Then the minutes", v: iv4.m1 + " to " + iv4.m2 + " is <b>" + plural(mm, "minute") + "</b>" },
        { k: "So it lasted", v: "<b>" + plural(hh, "hour") + " " + plural(mm, "minute") + "</b>", total: true },
      ]);
      /* the end mark sits at h2 + m2/60, so the line has to reach past h2 or it lands off the edge */
      nline($("line4"), iv4.h1, iv4.h2 + 1, [iv4.h1 + iv4.m1 / 60, iv4.h2 + iv4.m2 / 60], 1, 1);
      $("fb4").textContent = "From " + to24(a) + " to " + to24(b) + " is " + hh + " h " + mm + " min.";
    } else {
      const d = iv4.d2 - iv4.d1, w = Math.floor(d / 7), r = d % 7;
      lines($("work4"), [
        { k: "From", v: "<b>" + iv4.d1 + " March</b>" },
        { k: "To", v: "<b>" + iv4.d2 + " March</b>" },
        { k: "Count on", v: iv4.d2 + " − " + iv4.d1 + " = <b>" + d + " days</b>" },
        { k: "In weeks", v: d + " ÷ 7 = <b>" + plural(w, "week") + (r ? " and " + plural(r, "day") : " exactly") + "</b>", total: true },
      ]);
      nline($("line4"), 1, 31, [iv4.d1, iv4.d2], 5, 1);
      $("fb4").textContent = iv4.d1 + " March to " + iv4.d2 + " March is " + d + " days.";
    }
    $("task4").textContent = "Worked through " + done4 + " so far";
  }
  $("pick4").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    mode4 = Number(b.dataset.i);
    [...$("pick4").children].forEach((c, i) => c.classList.toggle("on", i === mode4));
    iv4 = newInterval(); paint4();
  });
  $("new4").addEventListener("click", () => {
    iv4 = newInterval(); done4++; paint4();
    if (done4 >= 3) finish(3, "");
    say($("fb4").textContent);
  });
  paint4();

  /* ---- 5: check ---- */
  const Q5 = shuffle([
    { q: "How many minutes are there in 3 hours?", o: ["180", "120", "300"], a: 0, w: "Each hour is 60 minutes, and 3 × 60 = 180." },
    { q: "How many days are there in 4 weeks?", o: ["28", "24", "30"], a: 0, w: "A week is 7 days, and 4 × 7 = 28." },
    { q: "Written as a 24-hour time, what is 2:30 pm?", o: ["14:30", "02:30", "12:30"], a: 0, w: "Afternoon times add 12 to the hour: 2 + 12 = 14." },
    { q: "Written as a 12-hour time, what is 19:05?", o: ["7:05 pm", "9:05 pm", "7:05 am"], a: 0, w: "19 − 12 = 7, and it is after midday, so 7:05 pm." },
    { q: "A film starts at 16:20 and ends at 18:45. How long is it?", o: ["2 h 25 min", "2 h 35 min", "1 h 25 min"], a: 0, w: "16 to 18 is 2 hours, and 20 to 45 is 25 minutes." },
    { q: "How many months are there in 3 years?", o: ["36", "30", "33"], a: 0, w: "A year is 12 months, and 3 × 12 = 36." },
    { q: "A train leaves at 13:20 and arrives at 14:05. How long does it take?", o: ["45 minutes", "85 minutes", "1 hour 45 min"], a: 0, w: "From 13:20 to 14:00 is 40 minutes, and 5 more makes 45." },
    { q: "From 5 March to 26 March is how many weeks?", o: ["3 weeks", "21 weeks", "2 weeks"], a: 0, w: "26 − 5 = 21 days, and 21 ÷ 7 = 3 weeks." },
  ]);
  let c5 = 0, right5 = 0, lock5 = false;
  function round5() {
    lock5 = false;
    $("fb5").textContent = ""; $("fb5").className = "fb";
    if (c5 >= Q5.length) {
      $("stem5").textContent = "That is all of them.";
      $("choices5").innerHTML = "";
      $("score5").textContent = right5 + " out of " + Q5.length + " right.";
      if (right5 >= 6) finish(4, "");
      else retryCheck($("fb5"), $("choices5"), right5, Q5.length, 6, function () { c5 = 0; right5 = 0; round5(); });
      return;
    }
    const q = Q5[c5];
    $("stem5").textContent = q.q;
    const order = shuffle(q.o.map((t, i) => ({ t: t, ok: i === q.a })));
    $("choices5").innerHTML = order.map((o, i) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("score5").textContent = "Question " + (c5 + 1) + " of " + Q5.length + "  ·  " + right5 + " right";
  }
  $("choices5").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock5) return;
    lock5 = true;
    const ok = b.dataset.ok === "1";
    if (ok) right5++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb5").textContent = (ok ? cheer() + " " : "") + Q5[c5].w;
    $("fb5").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q5[c5].w);
    c5++;
    setTimeout(round5, 2200);
  });
  round5();

  /* ---- 6: stickers ---- */
  const STICKERS = [["📏", "How long is that?"], ["🕰️", "Three ways to say one time"], ["🚌", "Reading a timetable"], ["⏱️", "How long between?"], ["✅", "Show what I know"]];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span>' + s[0] + "</span><b>" + s[1] + "</b></div>").join("");
  }
  $("again").addEventListener("click", () => { show(0, true); });

  show(0, false);

  /* ---- your turn: the three slides that only demonstrated ---- */
  const askShuffle3 = (correct, a, b) => { const o = shuffle([correct, a, b]); return { o: o, i: o.indexOf(correct) }; };

  /* 1 (4Gt.01) converts between units. The first distractor is the classic error of
     ADDING the two numbers instead of multiplying. */
  ask(1, () => {
    const U = UNITS1[rnd(0, UNITS1.length - 1)], k = rnd(2, Math.min(6, U.max));
    const n = k * U.per;
    const opts = pick3(n, [k + U.per, (k - 1) * U.per, n + U.per]);
    return { stem: "How many <b>" + U.small + "s</b> are there in <b>" + k + " " + U.big + "s</b>?",
      opts: opts.map(fmt), ans: opts.indexOf(n),
      why: "1 " + U.big + " = " + U.per + " " + U.small + "s, so " + k + " × " + U.per +
        " = <b>" + fmt(n) + "</b>." };
  });

  /* 2 (4Gt.02) 24-hour to 12-hour. Distractors are the am/pm slip and the next hour;
     "subtract 12" is deliberately NOT offered because for 13:00-23:59 it is correct. */
  ask(2, () => {
    const t = rnd(0, 23) * 60 + rnd(0, 11) * 5;
    const h = Math.floor(t / 60) % 24, m = t % 60;
    const hh = ((h + 11) % 12) + 1, suf = h < 12 ? "am" : "pm";
    const correct = hh + ":" + pad2(m) + " " + suf;
    const q = askShuffle3(correct,
      hh + ":" + pad2(m) + " " + (suf === "am" ? "pm" : "am"),
      ((hh % 12) + 1) + ":" + pad2(m) + " " + suf);
    return { stem: "The 24-hour clock shows <b>" + to24(t) + "</b>. What is that on a 12-hour clock?",
      opts: q.o, ans: q.i,
      why: "<b>" + correct + "</b> — anything before 12:00 is am, and from 12:00 on it is pm." };
  });

  /* 4 (4Gt.04) an interval. Built the way the slide builds one, so the end minutes are
     always the larger and the child never has to bridge through 60 here. */
  ask(4, () => {
    const h1 = rnd(7, 10), m1 = rnd(0, 5) * 5;
    const h2 = h1 + rnd(1, 3), m2 = m1 + rnd(1, 5) * 5;
    const dh = h2 - h1, dm = m2 - m1;
    const lab = (H, M) => H + " h " + M + " min";
    const q = askShuffle3(lab(dh, dm), lab(dh + 1, dm), lab(dh, dm - 5));
    return { stem: "How long is it from <b>" + pad2(h1) + ":" + pad2(m1) + "</b> to <b>" +
        pad2(h2) + ":" + pad2(m2) + "</b>?",
      opts: q.o, ans: q.i,
      why: "Whole hours first: " + pad2(h1) + ":" + pad2(m1) + " to " + pad2(h2) + ":" + pad2(m1) +
        " is " + dh + " h. Then on to " + pad2(h2) + ":" + pad2(m2) + " is " + dm + " min." };
  });

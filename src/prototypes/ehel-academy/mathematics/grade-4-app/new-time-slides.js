  /* ---- shared by the new Telling the Time slides ----

     Prefixed tm. Its own to12/to24/pad2 rather than the kept slides' -- those are
     declared inside slide 1's and slide 2's blocks, so relying on them would make
     these slides depend on the lesson's teaching ORDER, which is a table in
     compose-lessons.py and is meant to be free to change. */
  const TM_MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const TM_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const tmPad = (n) => (n < 10 ? "0" : "") + n;
  const tm24 = (t) => tmPad(Math.floor(t / 60) % 24) + ":" + tmPad(t % 60);
  const tm12 = (t) => {
    const h = Math.floor(t / 60) % 24, m = t % 60;
    return (((h + 11) % 12) + 1) + ":" + tmPad(m) + " " + (h < 12 ? "am" : "pm");
  };
  const tmPlural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

  /* ---- 1: converting between units in BOTH directions (4Gt.01) ----

     The kept slide only ever goes from the bigger unit to the smaller one, on a
     slider. Dividing back, and a mixed amount like 2 hours 15 minutes, are the two
     halves it cannot ask for. */
  const TM_UNITS = [
    { big: "week", small: "day", per: 7 },
    { big: "year", small: "month", per: 12 },
    { big: "day", small: "hour", per: 24 },
    { big: "hour", small: "minute", per: 60 },
    { big: "minute", small: "second", per: 60 },
  ];
  let tm1 = null, tm1right = 0, tm1lock = false;
  const tm1seen = {};
  function tmNew1() {
    const U = TM_UNITS[rnd(0, TM_UNITS.length - 1)], n = rnd(2, 6), k = rnd(0, 2);
    if (k === 0) return { U: U, n: n, kind: "down", ans: n * U.per };
    if (k === 1) return { U: U, n: n, kind: "up", ans: n };
    const r = rnd(1, U.per - 1);
    return { U: U, n: n, r: r, kind: "mixed", ans: n * U.per + r };
  }
  function tmPaint1() {
    const P = tm1, U = P.U;
    $("tmq1").innerHTML =
      P.kind === "down" ? "How many <b>" + U.small + "s</b> are there in <b>" + tmPlural(P.n, U.big) + "</b>?"
      : P.kind === "up" ? "How many <b>" + U.big + "s</b> is <b>" + tmPlural(P.n * U.per, U.small) + "</b>?"
      : "How many <b>" + U.small + "s</b> is <b>" + tmPlural(P.n, U.big) + " and " + tmPlural(P.r, U.small) + "</b>?";
    const cands = P.kind === "up"
      ? [P.n + 1, P.n - 1, P.n * U.per]
      : [P.ans + U.per, P.ans - U.per, P.n + U.per];
    $("tmpick1").innerHTML = pick3(P.ans, cands)
      .map((v) => '<button type="button" class="choice" data-v="' + v + '">' + fmt(v) + "</button>").join("");
    $("tmtask1").textContent = "Right so far: " + tm1right + " of 5 · directions done: " +
      Object.keys(tm1seen).length + " of 3";
  }
  $("tmpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || tm1lock) return;
    tm1lock = true;
    const P = tm1, U = P.U, ok = Number(b.dataset.v) === P.ans;
    if (ok) { tm1right++; tm1seen[P.kind] = true; }
    b.classList.add(ok ? "right" : "wrong");
    lines($("tmwork1"), [
      { k: "The fact", v: "1 " + U.big + " = <b>" + tmPlural(U.per, U.small) + "</b>" },
      { k: "Which way", v: P.kind === "up"
        ? "to the <b>bigger</b> unit, so <b>divide</b>"
        : "to the <b>smaller</b> unit, so <b>multiply</b>" },
      { k: "The working", v: P.kind === "down" ? P.n + " × " + U.per + " = <b>" + fmt(P.ans) + "</b>"
        : P.kind === "up" ? fmt(P.n * U.per) + " ÷ " + U.per + " = <b>" + P.ans + "</b>"
        : P.n + " × " + U.per + " = " + fmt(P.n * U.per) + ", then + " + P.r + " = <b>" + fmt(P.ans) + "</b>" },
      { k: "So", v: P.kind === "up" ? "<b>" + tmPlural(P.n * U.per, U.small) + " = " + tmPlural(P.ans, U.big) + "</b>"
        : "<b>" + fmt(P.ans) + " " + U.small + "s</b>", total: true },
    ]);
    $("tmfb1").innerHTML = (ok ? cheer() + " " : "It is " + fmt(P.ans) + ". ") +
      (P.kind === "up" ? "Going to a <b>bigger</b> unit always gives a <b>smaller</b> number."
                       : "Going to a <b>smaller</b> unit always gives a <b>bigger</b> number.");
    $("tmfb1").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb1").textContent);
    if (tm1right >= 5 && Object.keys(tm1seen).length >= 3) finish(0, "You can swap units both ways!");
    setTimeout(() => { tm1 = tmNew1(); tm1lock = false; tmPaint1(); }, 2400);
  });
  tm1 = tmNew1(); tmPaint1();

  /* ---- 2: reading an analogue clock (4Gt.02) ----

     The kept clock slide prints the 12-hour and 24-hour times beside the face and
     asks the learner to SET it, so the face never has to be read -- the boxes read
     it for them. Here there is nothing but hands. */
  let tm2 = null, tm2right = 0, tm2lock = false;
  function tmNew2() {
    const h = rnd(1, 12), m = rnd(0, 11) * 5;
    return { h: h, m: m };
  }
  function tmDrawClock(el, h, m) {
    const ha = (h % 12 + m / 60) * 30 - 90, ma = m * 6 - 90;
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
    el.innerHTML = s + arm(ha, 44, "hand hour") + arm(ma, 66, "hand min") +
      '<circle class="pin" cx="100" cy="100" r="5"></circle>';
  }
  const tmSay2 = (h, m) => h + ":" + tmPad(m);
  function tmPaint2() {
    tmDrawClock($("tmclock2"), tm2.h, tm2.m);
    $("tmq2").innerHTML = "What time is the clock showing?";
    /* The first distractor is the two hands READ THE WRONG WAY ROUND, which is the
       mistake this slide exists for: at 3:40 the long hand sits on the 8 and the
       short hand near the 4, so 8:20 looks right to a learner reading the long hand
       as the hour. */
    const swapH = tm2.m === 0 ? 12 : tm2.m / 5;
    const opts = [tmSay2(tm2.h, tm2.m), tmSay2(swapH, (tm2.h % 12) * 5),
      tmSay2(tm2.h % 12 + 1, tm2.m), tmSay2(tm2.h, (tm2.m + 5) % 60)];
    const uniq = [];
    opts.forEach((o) => { if (uniq.indexOf(o) < 0) uniq.push(o); });
    $("tmpick2").innerHTML = shuffle(uniq.slice(0, 3))
      .map((o) => '<button type="button" class="choice" data-t="' + o + '">' + o + "</button>").join("");
    $("tmtask2").textContent = "Right so far: " + tm2right + " of 5";
  }
  $("tmpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || tm2lock) return;
    tm2lock = true;
    const right = tmSay2(tm2.h, tm2.m), ok = b.dataset.t === right;
    if (ok) tm2right++;
    b.classList.add(ok ? "right" : "wrong");
    const nextH = tm2.h === 12 ? 1 : tm2.h + 1;
    lines($("tmwork2"), [
      { k: "The short hand", v: tm2.m === 0 ? "points straight at <b>" + tm2.h + "</b>"
        : "sits between <b>" + tm2.h + "</b> and <b>" + nextH + "</b>, so the hour is the one it has passed: <b>" + tm2.h + "</b>" },
      { k: "The long hand", v: "points at <b>" + (tm2.m === 0 ? 12 : tm2.m / 5) + "</b>, and each number is five minutes" },
      { k: "So the minutes", v: (tm2.m === 0 ? 12 : tm2.m / 5) + " × 5 = <b>" + tm2.m + "</b>" },
      { k: "The time is", v: "<b>" + right + "</b>", total: true },
    ]);
    $("tmfb2").innerHTML = (ok ? cheer() + " " : "It is " + right + ". ") +
      "The <b>short</b> hand is the hour and it counts the number it has <b>gone past</b>.";
    $("tmfb2").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb2").textContent);
    if (tm2right >= 5) finish(1, "You can read a clock face!");
    setTimeout(() => { tm2 = tmNew2(); tm2lock = false; tmPaint2(); }, 2400);
  });
  tm2 = tmNew2(); tmPaint2();

  /* ---- 3: writing a 12-hour time in 24-hour notation (4Gt.02) ---- */
  let tm3 = null, tm3right = 0, tm3lock = false;
  const tm3seen = {};
  function tmNew3() {
    const k = rnd(0, 5);
    const m = rnd(0, 11) * 5;
    /* midnight and midday are dealt in on purpose: they are the two the rule as
       usually remembered gets wrong, and at random they would hardly ever come up */
    if (k === 0) return { t: m, kind: "midnight" };                 /* 12:mm am */
    if (k === 1) return { t: 12 * 60 + m, kind: "midday" };          /* 12:mm pm */
    if (k < 4) return { t: rnd(1, 11) * 60 + m, kind: "am" };
    return { t: (rnd(13, 23)) * 60 + m, kind: "pm" };
  }
  function tmPaint3() {
    const t = tm3.t, h24 = Math.floor(t / 60), m = t % 60;
    $("tmq3").innerHTML = "Write <b>" + tm12(t) + "</b> in 24-hour time.";
    const wrong = [];
    if (tm3.kind === "midnight") wrong.push("12:" + tmPad(m), "24:" + tmPad(m));
    else if (tm3.kind === "midday") wrong.push("00:" + tmPad(m), "24:" + tmPad(m));
    else if (tm3.kind === "am") wrong.push(tmPad(h24 + 12) + ":" + tmPad(m), tmPad((h24 + 1) % 24) + ":" + tmPad(m));
    else wrong.push(tmPad(h24 - 12) + ":" + tmPad(m), tmPad((h24 - 1) % 24) + ":" + tmPad(m));
    const uniq = [tm24(t)];
    wrong.forEach((w) => { if (uniq.indexOf(w) < 0) uniq.push(w); });
    $("tmpick3").innerHTML = shuffle(uniq.slice(0, 3))
      .map((o) => '<button type="button" class="choice" data-t="' + o + '">' + o + "</button>").join("");
    $("tmtask3").textContent = "Right so far: " + tm3right + " of 5 · " +
      "kinds done: " + Object.keys(tm3seen).length + " of 4";
  }
  $("tmpick3").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || tm3lock) return;
    tm3lock = true;
    const right = tm24(tm3.t), ok = b.dataset.t === right;
    if (ok) { tm3right++; tm3seen[tm3.kind] = true; }
    b.classList.add(ok ? "right" : "wrong");
    const h12 = ((Math.floor(tm3.t / 60) + 11) % 12) + 1;
    lines($("tmwork3"), [
      { k: "Which half of the day", v: tm3.t < 12 * 60 ? "<b>am</b> &mdash; before midday" : "<b>pm</b> &mdash; after midday" },
      { k: "The rule", v: tm3.kind === "midnight"
          ? "the hour after <b>midnight</b> is written <b>00</b>, not 12 and not 24"
        : tm3.kind === "midday" ? "<b>midday</b> is already 12, so it stays <b>12</b> and nothing is added"
        : tm3.kind === "am" ? "morning hours are written as they are" : "afternoon hours have <b>12 added</b>" },
      { k: "The working", v: tm3.kind === "midnight" ? "12 becomes <b>00</b>"
        : tm3.kind === "midday" ? "12 stays <b>12</b>"
        : tm3.kind === "am" ? h12 + " stays <b>" + tmPad(h12) + "</b>"
        : h12 + " + 12 = <b>" + (h12 + 12) + "</b>" },
      { k: "So it is", v: "<b>" + right + "</b>", total: true },
    ]);
    $("tmfb3").innerHTML = (ok ? cheer() + " " : "It is " + right + ". ") +
      "24-hour time runs <b>00:00 to 23:59</b>, so there is no 24 and no need for am or pm.";
    $("tmfb3").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb3").textContent);
    if (tm3right >= 5 && Object.keys(tm3seen).length >= 4) finish(2, "You can write any time in 24-hour!");
    setTimeout(() => { tm3 = tmNew3(); tm3lock = false; tmPaint3(); }, 2600);
  });
  tm3 = tmNew3(); tmPaint3();

  /* ---- 4: using a timetable to choose (4Gt.03) ----

     The kept timetable slide asks the learner to follow one bus down a column. This
     one asks the question a timetable is actually for: which bus do I need? */
  const TM_STOPS = ["High Street", "Market Square", "The Library", "School Gate"];
  let tm4 = null, tm4right = 0, tm4lock = false;
  function tmNew4() {
    const first = rnd(7, 8) * 60 + rnd(0, 5) * 5, gap = rnd(15, 25);
    const hops = [0, rnd(6, 10), rnd(5, 9), rnd(4, 8)];
    const runs = [0, 1, 2, 3].map((i) => {
      const dep = first + gap * i, t = [];
      let at = dep;
      hops.forEach((h) => { at += h; t.push(at); });
      return t;
    });
    const stop = rnd(1, 3);
    /* the deadline sits between two buses' arrivals, so exactly one of them is the
       LATEST that still makes it -- and it is never simply the first or the last */
    const pick = rnd(1, 2);
    const by = runs[pick][stop] + rnd(1, gap - 1);
    return { runs: runs, stop: stop, by: by, ans: pick };
  }
  function tmPaint4() {
    const P = tm4;
    let h = "<tr><th>Stop</th>" + P.runs.map((r) => "<th>" + tm24(r[0]) + "</th>").join("") + "</tr>";
    TM_STOPS.forEach((s, i) => {
      h += "<tr><td>" + s + "</td>" + P.runs.map((r) => "<td>" + tm24(r[i]) + "</td>").join("") + "</tr>";
    });
    $("tmtt4").innerHTML = h;
    $("tmq4").innerHTML = "You must be at <b>" + TM_STOPS[P.stop] + "</b> by <b>" + tm24(P.by) +
      "</b>. Which bus do you catch &mdash; the <b>latest</b> one that still gets you there?";
    $("tmpick4").innerHTML = P.runs.map((r, i) =>
      '<button type="button" class="choice" data-i="' + i + '">' + tm24(r[0]) + "</button>").join("");
    $("tmtask4").textContent = "Right so far: " + tm4right + " of 4";
  }
  $("tmpick4").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b || tm4lock) return;
    tm4lock = true;
    const P = tm4, i = Number(b.dataset.i), ok = i === P.ans;
    if (ok) tm4right++;
    b.classList.add(ok ? "right" : "wrong");
    const rows = P.runs.map((r) => ({
      k: "The " + tm24(r[0]) + " bus",
      v: "reaches " + TM_STOPS[P.stop] + " at <b>" + tm24(r[P.stop]) + "</b>" +
        (r[P.stop] <= P.by ? " &mdash; in time" : " &mdash; too late"),
    }));
    rows.push({ k: "The latest in time", v: "<b>" + tm24(P.runs[P.ans][0]) + "</b>, arriving " +
      tm24(P.runs[P.ans][P.stop]) + ", which is " + (P.by - P.runs[P.ans][P.stop]) +
      " minutes to spare", total: true });
    lines($("tmwork4"), rows);
    $("tmfb4").innerHTML = (ok ? cheer() + " " : "It is the " + tm24(P.runs[P.ans][0]) + ". ") +
      "An earlier bus would get you there too &mdash; but you would be <b>waiting about</b>, so the latest one that makes it is the answer.";
    $("tmfb4").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb4").textContent);
    if (tm4right >= 4) finish(3, "You can choose the right bus from a timetable!");
    setTimeout(() => { tm4 = tmNew4(); tm4lock = false; tmPaint4(); }, 3000);
  });
  tm4 = tmNew4(); tmPaint4();

  /* ---- 5: adding days across the end of a month (4Gt.04) ---- */
  let tm5 = null, tm5right = 0, tm5lock = false;
  function tmNew5() {
    const m = rnd(0, 11), len = TM_LEN[m];
    const d = rnd(len - 8, len - 1), add = rnd(len - d + 1, len - d + 20);
    const over = d + add - len;
    return { m: m, len: len, d: d, add: add, over: over, left: len - d };
  }
  function tmPaint5() {
    const P = tm5, nm = (P.m + 1) % 12;
    $("tmq5").innerHTML = "It is <b>" + P.d + " " + TM_MONTHS[P.m] + "</b>. What is the date <b>" +
      P.add + " days</b> later?";
    $("tmcal5").innerHTML = [P.m, nm].map((k) =>
      '<div class="tgrp"><span class="glab">' + TM_MONTHS[k] + '</span><span class="gnum">' +
      TM_LEN[k] + '</span><span class="glab">days</span></div>').join("");
    /* over can be 1, and "0 April" is not a date -- a distractor has to be a thing
       somebody could believe, not an impossible string */
    const cands = [P.over + 1 + " " + TM_MONTHS[nm], P.over - 1 + " " + TM_MONTHS[nm],
      P.over + 2 + " " + TM_MONTHS[nm], P.over + " " + TM_MONTHS[(nm + 1) % 12]]
      .filter((c) => parseInt(c, 10) >= 1);
    const uniq = [P.over + " " + TM_MONTHS[nm]];
    cands.forEach((c) => { if (uniq.indexOf(c) < 0) uniq.push(c); });
    $("tmpick5").innerHTML = shuffle(uniq.slice(0, 3))
      .map((o) => '<button type="button" class="choice word" data-t="' + o + '">' + o + "</button>").join("");
    $("tmtask5").textContent = "Right so far: " + tm5right + " of 4";
  }
  $("tmpick5").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b || tm5lock) return;
    tm5lock = true;
    const P = tm5, nm = (P.m + 1) % 12, right = P.over + " " + TM_MONTHS[nm];
    const ok = b.dataset.t === right;
    if (ok) tm5right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("tmwork5"), [
      { k: TM_MONTHS[P.m] + " has", v: "<b>" + P.len + " days</b>" },
      { k: "Days left in it", v: P.len + " − " + P.d + " = <b>" + tmPlural(P.left, "day") + "</b>, which takes you to " +
        P.len + " " + TM_MONTHS[P.m] },
      { k: "Still to count", v: P.add + " − " + P.left + " = <b>" + tmPlural(P.over, "day") + "</b>" },
      { k: "So the date is", v: "<b>" + right + "</b>", total: true },
    ]);
    $("tmfb5").innerHTML = (ok ? cheer() + " " : "It is " + right + ". ") +
      "Use up what is <b>left</b> in the month first &mdash; only what is over goes into the next one.";
    $("tmfb5").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb5").textContent);
    if (tm5right >= 4) finish(4, "You can count days over the end of a month!");
    setTimeout(() => { tm5 = tmNew5(); tm5lock = false; tmPaint5(); }, 2800);
  });
  tm5 = tmNew5(); tmPaint5();

  /* ---- 6: intervals in months and years (4Gt.04) ----

     The kept interval slide does clock times and days within one month. Months and
     years are named in the objective and were not anywhere in the lesson. */
  let tm6 = null, tm6right = 0, tm6lock = false;
  const tm6seen = {};
  function tmNew6() {
    const y1 = rnd(2018, 2024);
    if (rnd(0, 1)) {                                  /* within one year */
      /* m1 stops at 9 so that rnd(m1 + 2, 11) always has a range: rnd(12, 11)
         returns 12, which is not a month, and TM_MONTHS[12] is undefined */
      const m1 = rnd(0, 9), m2 = rnd(m1 + 2, 11);
      return { y1: y1, m1: m1, y2: y1, m2: m2, kind: "months", ans: m2 - m1 };
    }
    const m1 = rnd(0, 11), y2 = y1 + rnd(1, 5), m2 = rnd(0, 11);
    return { y1: y1, m1: m1, y2: y2, m2: m2, kind: "years",
      ans: (y2 - y1) * 12 + (m2 - m1) };
  }
  function tmPaint6() {
    const P = tm6;
    $("tmq6").innerHTML = "How many <b>months</b> from <b>" + TM_MONTHS[P.m1] + " " + P.y1 +
      "</b> to <b>" + TM_MONTHS[P.m2] + " " + P.y2 + "</b>?";
    $("tmspan6").innerHTML = [["From", P.m1, P.y1], ["To", P.m2, P.y2]].map((c) =>
      '<div class="tgrp"><span class="glab">' + c[0] + '</span><span class="gnum">' +
      TM_MONTHS[c[1]] + '</span><span class="glab">' + c[2] + "</span></div>").join("");
    $("tmpick6").innerHTML = pick3(P.ans, [P.ans + 1, P.ans - 1, P.ans + 12].filter((v) => v >= 1))
      .map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    $("tmtask6").textContent = "Right so far: " + tm6right + " of 4 · both kinds needed";
  }
  $("tmpick6").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || tm6lock) return;
    tm6lock = true;
    const P = tm6, ok = Number(b.dataset.v) === P.ans;
    if (ok) { tm6right++; tm6seen[P.kind] = true; }
    b.classList.add(ok ? "right" : "wrong");
    const wholeYears = P.y2 - P.y1;
    lines($("tmwork6"), P.kind === "months" ? [
      { k: "The same year", v: "both dates are in <b>" + P.y1 + "</b>" },
      { k: "Count the months", v: TM_MONTHS[P.m1] + " to " + TM_MONTHS[P.m2] + " is <b>" +
        tmPlural(P.ans, "month") + "</b>" },
      { k: "Or take away", v: "month " + (P.m2 + 1) + " − month " + (P.m1 + 1) + " = <b>" + P.ans + "</b>", total: true },
    ] : [
      { k: "Whole years first", v: P.y1 + " to " + P.y2 + " is <b>" + tmPlural(wholeYears, "year") + "</b>" },
      { k: "In months", v: wholeYears + " × 12 = <b>" + wholeYears * 12 + "</b>" },
      { k: "Then the months", v: TM_MONTHS[P.m1] + " to " + TM_MONTHS[P.m2] + " is <b>" +
        (P.m2 - P.m1) + "</b>" + (P.m2 < P.m1 ? ", which is backwards, so it comes off" : "") },
      { k: "Altogether", v: wholeYears * 12 + " " + (P.m2 - P.m1 < 0 ? "−" : "+") + " " +
        Math.abs(P.m2 - P.m1) + " = <b>" + tmPlural(P.ans, "month") + "</b>", total: true },
    ]);
    $("tmfb6").innerHTML = (ok ? cheer() + " " : "It is " + tmPlural(P.ans, "month") + ". ") +
      "Count the <b>whole years</b> first and deal with the leftover months after &mdash; the same order as hours and then minutes.";
    $("tmfb6").className = "fb " + (ok ? "good" : "bad");
    say($("tmfb6").textContent);
    if (tm6right >= 4 && Object.keys(tm6seen).length >= 2) finish(5, "You can find a gap in months and years!");
    setTimeout(() => { tm6 = tmNew6(); tm6lock = false; tmPaint6(); }, 2800);
  });
  tm6 = tmNew6(); tmPaint6();


  /* ==================================================================
     SIDES, SIZES AND SECONDS - Grade 3 geometry, measure and time.
     Cambridge Primary Mathematics 0096, Stage 3 (3Gg, 3Gt, 3Gp).
     ================================================================== */

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
  function uniq(list, want) { const out = []; for (const v of list) { if (out.length >= want) break; if (!out.includes(v)) out.push(v); } return out; }
  /* A regular polygon drawn on a circle. `wob` squashes it vertically to make it
     IRREGULAR - which must mean unequal SIDES, not merely unequal angles.
     Alternating the radius instead was the first attempt and was wrong: on an
     even-sided polygon it produces an equilateral shape, every side the same
     length, which is precisely what this lesson tells a child regular means. */
  function poly(cx, cy, r, n, rot, wob) {
    const sy = wob ? 0.56 : 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rot + i * 2 * Math.PI / n;
      pts.push([(cx + r * Math.cos(a)).toFixed(1), (cy + r * sy * Math.sin(a)).toFixed(1)]);
    }
    return pts;
  }
  const ptsStr = (pts) => pts.map((p) => p.join(",")).join(" ");

  /* ---- 13: telling the time ---- 3Gt.02 read and record time in digital (12-hour) notation and on analogue clocks */
  let got13 = 0, asked13 = 0;
  function clockFace(hh, mm) {
    let svg = '<circle cx="100" cy="100" r="88" fill="var(--cell)" stroke="var(--ink)" stroke-width="4"></circle>';
    for (let k = 1; k <= 12; k++) {
      const a = (k * 30 - 90) * Math.PI / 180;
      svg += '<text class="lab" x="' + (100 + 70 * Math.cos(a)).toFixed(1) + '" y="' + (100 + 70 * Math.sin(a) + 6).toFixed(1) + '">' + k + "</text>";
    }
    const ma = (mm * 6 - 90) * Math.PI / 180;
    const ha = ((hh % 12) * 30 + mm * 0.5 - 90) * Math.PI / 180;
    svg += '<line class="arm" x1="100" y1="100" x2="' + (100 + 44 * Math.cos(ha)).toFixed(3) + '" y2="' + (100 + 44 * Math.sin(ha)).toFixed(3) + '"></line>';
    svg += '<line class="arm b" x1="100" y1="100" x2="' + (100 + 68 * Math.cos(ma)).toFixed(3) + '" y2="' + (100 + 68 * Math.sin(ma)).toFixed(3) + '" stroke-width="4"></line>';
    svg += '<circle cx="100" cy="100" r="6" fill="var(--ink)"></circle>';
    return svg;
  }
  const two = (n) => (n < 10 ? "0" : "") + n;
  function round13() {
    const hh = rnd(1, 12), mm = rnd(0, 11) * 5;
    $("g13").innerHTML = clockFace(hh, mm);
    $("say13").textContent = "What time is it?";
    const right = hh + ":" + two(mm);
    const opts = uniq([right, (hh % 12 + 1) + ":" + two(mm), hh + ":" + two((mm + 30) % 60), ((hh + 10) % 12 + 1) + ":" + two(mm)], 4);
    offer("ch13", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch13", b, ok)) return;
      asked13++; if (ok) got13++;
      $("fb13").className = "fb " + (ok ? "good" : "");
      $("fb13").textContent = (ok ? cheer() + " " : "") + "The short hand has passed " + hh + ", so the hour is " + hh + ". The long hand is at " + (mm / 5 === 0 ? 12 : mm / 5) + ", which is " + mm + " minutes.";
      say(ok ? cheer() : "It is " + right);
      scoreLine("sc13", got13, asked13, 4);
      if (got13 >= 4) finish(0, "");
      setTimeout(round13, 2500);
    });
  }
  round13();

  /* ---- 14: time intervals ---- 3Gt.04 the difference between a time and a time interval; find time intervals */
  let got14 = 0, asked14 = 0;
  const TIME_UNITS = [
    { t: "brushing your teeth", a: "minutes", w: ["seconds", "hours"] },
    { t: "blinking", a: "seconds", w: ["minutes", "days"] },
    { t: "a night's sleep", a: "hours", w: ["minutes", "weeks"] },
    { t: "the school holidays", a: "weeks", w: ["minutes", "years"] },
    { t: "growing from a baby to a grown-up", a: "years", w: ["days", "hours"] },
    { t: "a football match", a: "hours", w: ["seconds", "months"] },
    { t: "waiting for your next birthday", a: "months", w: ["minutes", "seconds"] },
    { t: "boiling a kettle", a: "minutes", w: ["days", "years"] },
  ];
  const LONG = [
    { u: "days", per: 7, big: "weeks" },
    { u: "months", per: 12, big: "years" },
    { u: "days", per: 1, big: "days" },
  ];
  function round14unit() {
    /* 3Gt.01 choose the appropriate unit of time for familiar activities */
    const it = TIME_UNITS[rnd(0, TIME_UNITS.length - 1)];
    $("cw14").style.display = "none";
    $("q14").className = "fb";
    $("q14").textContent = "Which unit would you use to measure " + it.t + "?";
    $("say14").textContent = "Which unit would you use to measure " + it.t + "?";
    offer("ch14", uniq([it.a].concat(it.w), 3), it.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === it.a;
      if (!mark("ch14", b, ok)) return;
      asked14++; if (ok) got14++;
      $("fb14").className = "fb " + (ok ? "good" : "");
      $("fb14").textContent = (ok ? cheer() + " " : "") + "You would measure " + it.t + " in " + it.a + ". Pick the unit that gives a sensible number - not so small that the number is huge, and not so big that the answer is nearly nothing.";
      say(ok ? cheer() : it.t + " is measured in " + it.a);
      scoreLine("sc14", got14, asked14, 5);
      if (got14 >= 5) finish(1, "");
      setTimeout(round14, 2700);
    });
  }
  function round14long() {
    /* 3Gt.04 find time intervals between the same units in days, weeks, months and years */
    const kind = rnd(0, 2);
    let q, answer, opts, why;
    if (kind === 0) {
      const w = rnd(2, 8); q = "How many days are there in " + w + " weeks?"; answer = w * 7;
      opts = uniq([answer, w * 5, answer + 7, w], 4); why = w + " \u00d7 7 = " + answer + " days.";
    } else if (kind === 1) {
      const y = rnd(2, 6); q = "How many months are there in " + y + " years?"; answer = y * 12;
      opts = uniq([answer, y * 10, answer + 12, y], 4); why = y + " \u00d7 12 = " + answer + " months.";
    } else {
      const m1 = rnd(1, 6), m2 = m1 + rnd(2, 6);
      const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      q = "How many months from " + MON[m1 - 1] + " to " + MON[m2 - 1] + " in the same year?"; answer = m2 - m1;
      opts = uniq([answer, answer + 1, Math.max(1, answer - 1), answer + 2], 4); why = "Count on from " + MON[m1 - 1] + " to " + MON[m2 - 1] + ": " + answer + " months.";
    }
    $("cw14").style.display = "none";
    $("q14").className = "fb"; $("q14").textContent = q;
    $("say14").textContent = q;
    offer("ch14", opts, answer, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = Number(b.dataset.v) === answer;
      if (!mark("ch14", b, ok)) return;
      asked14++; if (ok) got14++;
      $("fb14").className = "fb " + (ok ? "good" : "");
      $("fb14").textContent = (ok ? cheer() + " " : "") + why;
      say(ok ? cheer() : why);
      scoreLine("sc14", got14, asked14, 5);
      if (got14 >= 5) finish(1, "");
      setTimeout(round14, 2700);
    });
  }
  function round14() {
    const pickKind = rnd(0, 2);
    if (pickKind === 1) return round14unit();
    if (pickKind === 2) return round14long();
    $("cw14").style.display = "";
    $("q14").textContent = "";
    const h1 = rnd(1, 10), m1 = rnd(0, 11) * 5;
    const mins = rnd(1, 20) * 5;
    const start = h1 * 60 + m1, end = start + mins;
    const h2 = Math.floor(end / 60), m2 = end % 60;
    $("t14a").textContent = h1 + ":" + two(m1);
    $("t14b").textContent = h2 + ":" + two(m2);
    $("say14").innerHTML = "How long from <b>" + h1 + ":" + two(m1) + "</b> to <b>" + h2 + ":" + two(m2) + "</b>?";
    const fmt = (t) => t >= 60 ? (Math.floor(t / 60) + " hour" + (Math.floor(t / 60) === 1 ? "" : "s") + (t % 60 ? " " + (t % 60) + " minutes" : "")) : t + " minutes";
    const right = fmt(mins);
    const opts = uniq([right, fmt(mins + 5), fmt(Math.max(5, mins - 5)), fmt(mins + 60)], 4);
    offer("ch14", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch14", b, ok)) return;
      asked14++; if (ok) got14++;
      const toHour = (60 - m1) % 60;
      $("fb14").className = "fb " + (ok ? "good" : "");
      $("fb14").textContent = (ok ? cheer() + " " : "") + "Count on: " + (toHour ? toHour + " minutes to " + (h1 + 1) + ":00, then on to " + h2 + ":" + two(m2) + ". " : "") + "That is " + right + ".";
      say(ok ? cheer() : "It is " + right);
      scoreLine("sc14", got14, asked14, 4);
      if (got14 >= 4) finish(1, "");
      setTimeout(round14, 2700);
    });
  }
  round14();

  /* ---- 15: timetables ---- 3Gt.03 interpret and use the information in timetables (12-hour clock) */
  const STOPS = ["Market", "School", "Hospital", "Library", "Station"];
  let got15 = 0, asked15 = 0;
  function round15() {
    const start = rnd(7, 10) * 60 + rnd(0, 3) * 15;
    const gaps = [rnd(2, 4) * 5, rnd(2, 4) * 5, rnd(2, 4) * 5, rnd(2, 4) * 5];
    const buses = 3, spacing = rnd(3, 6) * 10;
    const times = [];
    for (let b2 = 0; b2 < buses; b2++) {
      const row = []; let t = start + b2 * spacing;
      for (let s = 0; s < STOPS.length; s++) { row.push(t); t += gaps[s] || 0; }
      times.push(row);
    }
    const fmt = (t) => Math.floor(t / 60) + ":" + two(t % 60);
    let h = "<tr><th>Stop</th>" + times.map((_, i) => "<th>Bus " + (i + 1) + "</th>").join("") + "</tr>";
    for (let s = 0; s < STOPS.length; s++) h += "<tr><th>" + STOPS[s] + "</th>" + times.map((row) => "<td>" + fmt(row[s]) + "</td>").join("") + "</tr>";
    $("tt15").innerHTML = h;
    const qb = rnd(0, buses - 1), qs = rnd(0, STOPS.length - 1);
    const askKind = rnd(0, 1);
    let q, right, opts;
    if (askKind === 0) {
      q = "What time does Bus " + (qb + 1) + " reach " + STOPS[qs] + "?";
      right = fmt(times[qb][qs]);
      opts = uniq([right, fmt(times[qb][qs] + 5), fmt(times[(qb + 1) % buses][qs]), fmt(times[qb][(qs + 1) % STOPS.length])], 4);
    } else {
      const s2 = (qs + 1) % STOPS.length;
      const from = Math.min(qs, s2), to = Math.max(qs, s2);
      const mins = times[qb][to] - times[qb][from];
      q = "How long does Bus " + (qb + 1) + " take from " + STOPS[from] + " to " + STOPS[to] + "?";
      right = mins + " minutes";
      opts = uniq([right, (mins + 5) + " minutes", Math.max(5, mins - 5) + " minutes", (mins + 10) + " minutes"], 4);
    }
    $("say15").textContent = q;
    offer("ch15", opts, right, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === right;
      if (!mark("ch15", b, ok)) return;
      asked15++; if (ok) got15++;
      [...$("tt15").querySelectorAll("td")].forEach((td) => td.classList.remove("hi"));
      const rowEl = $("tt15").rows[qs + 1];
      if (askKind === 0 && rowEl) rowEl.cells[qb + 1].classList.add("hi");
      $("fb15").className = "fb " + (ok ? "good" : "");
      $("fb15").textContent = (ok ? cheer() + " " : "") + "Find the row, then look along it to the right column. The answer is " + right + ".";
      say(ok ? cheer() : "It is " + right);
      scoreLine("sc15", got15, asked15, 4);
      if (got15 >= 4) finish(2, "");
      setTimeout(round15, 2800);
    });
  }
  round15();

  /* ---- 16: direction ---- 3Gp.01 interpret and create descriptions of position, direction and movement, including cardinal points */
  const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
  let pos16 = [1, 1], target16 = [1, 1], got16 = 0, asked16 = 0, moves16 = [];
  function paint16() {
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([c, r]);
    $("cp16").innerHTML = cells.map(([c, r]) => {
      if (c === 1 && r === 1) return '<div class="mid">📍</div>';
      const dir = c === 1 && r === 0 ? "N" : c === 1 && r === 2 ? "S" : c === 2 && r === 1 ? "E" : c === 0 && r === 1 ? "W" : null;
      return dir ? '<button type="button" data-d="' + dir + '">' + dir + "</button>" : "<span></span>";
    }).join("");
  }
  function round16() {
    const seq = [];
    for (let k = 0; k < rnd(2, 3); k++) seq.push(["N", "S", "E", "W"][rnd(0, 3)]);
    moves16 = seq; let i = 0;
    const names = { N: "north", S: "south", E: "east", W: "west" };
    $("say16").innerHTML = "Press the directions in order: <b>" + seq.map((d) => names[d]).join(", then ") + "</b>.";
    $("fb16").className = "fb"; $("fb16").textContent = "";
    $("cp16").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.d === seq[i]) {
        i++; say(names[b.dataset.d]);
        if (i === seq.length) {
          asked16++; got16++;
          $("fb16").className = "fb good";
          $("fb16").textContent = cheer() + " North is up, south is down, east is right and west is left - and they stay put whichever way you are facing.";
          scoreLine("sc16", got16, asked16, 3);
          if (got16 >= 3) finish(3, "");
          setTimeout(round16, 2400);
        } else {
          $("fb16").className = "fb"; $("fb16").textContent = i + " of " + seq.length + " done.";
        }
      } else {
        asked16++;
        $("fb16").className = "fb";
        $("fb16").textContent = "That is " + names[b.dataset.d] + ". The next one should be " + names[seq[i]] + ".";
        say("The next one is " + names[seq[i]]);
        scoreLine("sc16", got16, asked16, 3);
      }
    };
  }
  paint16(); round16();

  /* ---- ehel-g3-second-steps: which unit of time ---- 3Gt.01 choose the appropriate unit of time for familiar activities */
  (function () {
    const ITEMS = [
      { q: "About how long does Amina take to walk to school?", n: 15, a: "minutes", w: ["seconds", "hours"] },
      { q: "About how long can Musa hold his breath?", n: 20, a: "seconds", w: ["minutes", "hours"] },
      { q: "About how long does the bus from Nairobi to Mombasa take?", n: 8, a: "hours", w: ["minutes", "weeks"] },
      { q: "How old is Hodan's baby sister?", n: 7, a: "months", w: ["hours", "years"] },
      { q: "About how long is the long school holiday?", n: 6, a: "weeks", w: ["hours", "years"] },
      { q: "How old is Grandmother Halima?", n: 68, a: "years", w: ["months", "days"] },
      { q: "How long does Omar's football match last?", n: 90, a: "minutes", w: ["seconds", "days"] },
      { q: "About how long does Leila sleep every night?", n: 10, a: "hours", w: ["minutes", "weeks"] },
      { q: "About how long does it take Yusuf to tie his shoes?", n: 30, a: "seconds", w: ["hours", "days"] },
      { q: "How long does it take a mango tree to grow big enough for fruit?", n: 4, a: "years", w: ["days", "hours"] },
    ];
    let got = 0, asked = 0, last = -1;
    function round() {
      let i; do { i = rnd(0, ITEMS.length - 1); } while (i === last); last = i;
      const it = ITEMS[i];
      $("qx71").textContent = it.q; $("sayx71").textContent = it.q;
      const right = it.n + " " + it.a;
      offer("chx71", [right].concat(it.w.map((u) => it.n + " " + u)), right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx71", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "It is about " + right + ". " + it.n + " " + it.w[0] + " or " + it.n + " " + it.w[1] + " would not make sense.";
        $("fbx71").className = "fb " + (ok ? "good" : "");
        $("fbx71").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx71", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 2800);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx71").closest(".slide"));
    round();
  })();

  /* ---- ehel-g3-second-steps: which bus ---- 3Gt.03 interpret and USE the information in timetables (12-hour clock) */
  (function () {
    const PLACES = ["Market", "School", "Clinic", "Library"];
    const WHO = ["Hodan", "Musa", "Leila", "Omar", "Zara", "Yusuf", "Amina", "Ali"];
    const fmt = (t) => Math.floor(t / 60) + ":" + (t % 60 < 10 ? "0" : "") + (t % 60);
    let got = 0, asked = 0;
    function round() {
      const first = rnd(7, 9) * 60 + rnd(0, 5) * 5, gap = rnd(4, 6) * 5;
      const legs = [rnd(2, 4) * 5, rnd(2, 4) * 5, rnd(2, 4) * 5];
      const T = [0, 1, 2].map((b) => { let t = first + b * gap; const row = [t]; for (const l of legs) { t += l; row.push(t); } return row; });
      let h = "<tr><th>Stop</th><th>Bus 1</th><th>Bus 2</th><th>Bus 3</th></tr>";
      PLACES.forEach((p, s) => { h += "<tr><th>" + p + "</th>" + T.map((row) => "<td>" + fmt(row[s]) + "</td>").join("") + "</tr>"; });
      $("ttx72").innerHTML = h;
      const who = WHO[rnd(0, WHO.length - 1)], j = rnd(0, 2);
      let q, why;
      if (rnd(0, 1) === 0) {
        const by = T[j][3] + rnd(1, gap / 5 - 1) * 5;
        q = who + " is at the Market and must be at the Library by " + fmt(by) + ". Which bus should " + who + " catch?";
        why = "Bus " + (j + 1) + " reaches the Library at " + fmt(T[j][3]) + ", in time" +
          (j < 2 ? ", and Bus " + (j + 2) + " gets there at " + fmt(T[j + 1][3]) + ", which is too late." : ", and it is the last bus.");
      } else {
        const at = j === 0 ? T[0][0] - rnd(1, 3) * 5 : T[j - 1][0] + rnd(1, gap / 5 - 1) * 5;
        q = who + " gets to the Market at " + fmt(at) + ". Which is the first bus " + who + " can catch?";
        why = (j > 0 ? "Bus " + j + " left the Market at " + fmt(T[j - 1][0]) + ", before " + fmt(at) + ". " : "") +
          "Bus " + (j + 1) + " leaves the Market at " + fmt(T[j][0]) + ", so that is the first one " + who + " can catch.";
      }
      const right = "Bus " + (j + 1);
      $("qx72").textContent = q; $("sayx72").textContent = q;
      offer("chx72", ["Bus 1", "Bus 2", "Bus 3"], right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx72", btn, ok)) return;
        asked++; if (ok) got++;
        $("fbx72").className = "fb " + (ok ? "good" : "");
        $("fbx72").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx72", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3600);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx72").closest(".slide"));
    round();
  })();

  /* ---- ehel-g3-second-steps: find your way ---- 3Gp.01 interpret AND CREATE descriptions of position, direction and movement, including cardinal points */
  (function () {
    const PL = [
      { n: "Home", e: "\u{1F3E0}", c: 1, r: 3 }, { n: "School", e: "\u{1F3EB}", c: 3, r: 1 },
      { n: "Market", e: "\u{1F6D2}", c: 4, r: 3 }, { n: "Clinic", e: "\u{1F3E5}", c: 0, r: 0 },
      { n: "Shop", e: "\u{1F3EA}", c: 2, r: 4 }, { n: "Bus stop", e: "\u{1F68F}", c: 4, r: 0 },
      { n: "Park", e: "\u{1F333}", c: 0, r: 2 },
    ];
    const WHO = ["Amina", "Musa", "Hodan", "Omar", "Zara", "Yusuf", "Leila", "Ali"];
    const S = 64, X = 20, Y = 30;
    const at = (c, r) => PL.find((p) => p.c === c && p.r === r);
    function map(a, b) {
      let svg = '<text class="lab" x="' + (X + 5 * S + 20) + '" y="' + (Y + 16) + '">N</text><text class="lab" x="' + (X + 5 * S + 20) + '" y="' + (Y + 40) + '">↑</text>';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++)
        svg += '<rect class="cell' + (c === a.c && r === a.r ? " on" : "") + '" x="' + (X + c * S) + '" y="' + (Y + r * S) + '" width="' + S + '" height="' + S + '"></rect>';
      if (b) svg += '<rect class="rt" x="' + (X + b.c * S + 3) + '" y="' + (Y + b.r * S + 3) + '" width="' + (S - 6) + '" height="' + (S - 6) + '"></rect>';
      for (const p of PL) {
        svg += '<text x="' + (X + p.c * S + S / 2) + '" y="' + (Y + p.r * S + 34) + '" font-size="26" text-anchor="middle">' + p.e + "</text>";
        svg += '<text class="lab m" x="' + (X + p.c * S + S / 2) + '" y="' + (Y + p.r * S + 55) + '">' + p.n + "</text>";
      }
      $("gx73").innerHTML = svg;
    }
    const sq = (n) => n + " square" + (n > 1 ? "s" : "");
    function describe(dc, dr) {
      const parts = [];
      if (dc) parts.push(sq(Math.abs(dc)) + " " + (dc > 0 ? "east" : "west"));
      if (dr) parts.push(sq(Math.abs(dr)) + " " + (dr > 0 ? "south" : "north"));
      return "Go " + parts.join(", then ");
    }
    let got = 0, asked = 0;
    function round() {
      let A, B; do { A = PL[rnd(0, PL.length - 1)]; B = PL[rnd(0, PL.length - 1)]; } while (A === B);
      const dc = B.c - A.c, dr = B.r - A.r;
      const who = WHO[rnd(0, WHO.length - 1)];
      let q, right, opts;
      if (rnd(0, 1) === 0) {
        map(A, null);
        q = "Start at the " + A.n + ". " + describe(dc, dr) + ". Where are you?";
        right = B.n;
        const wrong = [at(A.c + dc, A.r - dr), at(A.c - dc, A.r + dr)].filter((p) => p && p !== B).map((p) => p.n);
        const rest = PL.filter((p) => p !== A && p !== B && wrong.indexOf(p.n) < 0).map((p) => p.n).sort(() => Math.random() - 0.5);
        opts = [right].concat(wrong.concat(rest).slice(0, 2));
      } else {
        map(A, B);
        q = "Which directions take " + who + " from the " + A.n + " to the " + B.n + "?";
        right = describe(dc, dr);
        const w1 = dr ? describe(dc, -dr) : describe(-dc, dr);
        const w2 = dc && dr ? describe(-dc, dr) : dc ? describe(dc + (dc > 0 ? 1 : -1), dr) : describe(dc, dr + (dr > 0 ? 1 : -1));
        opts = [right, w1, w2];
      }
      $("qx73").textContent = q; $("sayx73").textContent = q;
      offer("chx73", opts, right, (e) => {
        const btn = e.target.closest(".choice"); if (!btn) return;
        const ok = btn.dataset.v === right;
        if (!mark("chx73", btn, ok)) return;
        asked++; if (ok) got++;
        const why = "From the " + A.n + ", " + describe(dc, dr).replace(/^Go/, "go") + " and you reach the " + B.n + ". North is up the map and east is to the right.";
        $("fbx73").className = "fb " + (ok ? "good" : "");
        $("fbx73").textContent = (ok ? cheer() + " " : "") + why;
        say(ok ? cheer() : why);
        scoreLine("scx73", got, asked, 4);
        if (got >= 4) finish(SLOT, "");
        setTimeout(round, 3600);
      });
    }
    const SLOT = [...document.querySelectorAll(".slide")].indexOf($("qx73").closest(".slide"));
    round();
  })();

  /* ---- 17: check ---- */
  const QS = [
    () => { const h1 = rnd(1, 9), m1 = rnd(0, 5) * 10, add = rnd(1, 5) * 10; const t = h1 * 60 + m1 + add; return { q: "It is " + h1 + ":" + two(m1) + ". What time is it " + add + " minutes later?", opts: [Math.floor(t / 60) + ":" + two(t % 60), h1 + ":" + two((m1 + add) % 60), (h1 + 1) + ":" + two(m1)], a: Math.floor(t / 60) + ":" + two(t % 60), why: "Count on " + add + " minutes." }; },
    () => { return { q: "Which direction is the opposite of north?", opts: ["south", "east", "west"], a: "south", why: "North and south are opposites; east and west are the other pair." }; },
    () => { const h = rnd(1, 11); return { q: "What is quarter past " + h + " on a digital clock?", opts: [h + ":15", h + ":25", h + ":45"], a: h + ":15", why: "A quarter of an hour is 15 minutes, because a quarter of 60 is 15." }; },
    () => { const h = rnd(8, 10), m = rnd(0, 3) * 10, gap = rnd(2, 5) * 10; const t = m + gap; return { q: "A bus leaves at " + h + ":" + two(m) + " and arrives at " + (h + Math.floor(t / 60)) + ":" + two(t % 60) + ". How long is the journey?", opts: [gap + " minutes", (gap + 10) + " minutes", (gap - 10) + " minutes"], a: gap + " minutes", why: "Count on from " + h + ":" + two(m) + " to the arrival time." }; },
    () => { return { q: "You are facing west and you turn to your right. Which way are you facing?", opts: ["north", "south", "east"], a: "north", why: "Going clockwise from west comes north." }; },
    () => { return { q: "At half past 8, where is the hour hand?", opts: ["between 8 and 9", "on the 8", "on the 6"], a: "between 8 and 9", why: "The hour hand creeps all the time, so by half past it is halfway to 9." }; },
  ];
;
  let qi = 0, got17 = 0, order17 = [];
  function round17() {
    if (qi >= order17.length) {
      $("q17").textContent = ""; $("ch17").innerHTML = "";
      $("fb17").className = "fb good"; $("fb17").textContent = "Finished! " + got17 + " out of " + order17.length + ".";
      $("sc17").textContent = "";
      if (got17 >= 4) finish(7, "You have finished the check.");
      else retryCheck($("fb17"), $("ch17"), got17, order17.length, 4, function () { qi = 0; got17 = 0; order17 = shuffle(QS); round17(); });
      return;
    }
    const item = nextQ(order17[qi]);
    $("q17").textContent = item.q; $("say17").textContent = item.q;
    offer("ch17", item.opts, item.a, (e) => {
      const b = e.target.closest(".choice"); if (!b) return;
      const ok = b.dataset.v === String(item.a);
      if (!mark("ch17", b, ok)) return;
      if (ok) got17++;
      qi++;
      $("fb17").className = "fb " + (ok ? "good" : "");
      $("fb17").textContent = (ok ? cheer() + " " : "Not this time. ") + item.why;
      say(ok ? cheer() : item.why);
      $("sc17").textContent = got17 + " right out of " + qi;
      setTimeout(round17, 2100);
    });
  }
  order17 = shuffle(QS);
  round17();

  /* ---- 18: stickers ---- */
  const STICKERS = [
    ["🕰️", "Telling the time"],
    ["⏳", "How long it takes"],
    ["🚌", "Timetables"],
    ["🗺️", "North, south, east, west"],
    ["⏱️", "Which unit of time"],
    ["🚏", "Which bus to catch"],
    ["🚶", "Find your way"],
    ["✅", "Show what I know"],
    ["\ud83e\udd14", "How do you know"]
  ];

  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] + (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fb18").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fb18").textContent = got === STICKERS.length ? "All " + STICKERS.length + " stickers! You can read a clock, a timetable and a compass." : got + " of " + STICKERS.length + " stickers so far.";
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
            "At twenty five minutes to four, the hour is still 3.",
            "The short hand has passed the 3 and has not reached the 4 yet.",
            [
                  "The long hand is near the 4, so the hour is 4.",
                  "It is 4 because twenty five to four has a 4 in it."
            ],
            "Read the hour the short hand has passed, never the one it is heading for."
      ],
      [
            "From 10:40 to 11:15 is 35 minutes.",
            "10:40 to 11:00 is 20 minutes, and 11:00 to 11:15 is 15 more.",
            [
                  "15 take away 40 is 25.",
                  "It is less than a whole hour."
            ],
            "Time is not counted in tens, so the columns cannot be subtracted like ordinary numbers. Count up to the next hour first, then on."
      ],
      [
            "Quarter past three is 3:15.",
            "A quarter of an hour is 15 minutes, because a quarter of 60 is 15.",
            [
                  "A quarter means a small amount of time.",
                  "The hour hand is just past the 3."
            ],
            "Quarters here are quarters of SIXTY, not of a hundred. That is why quarter past is 15 and not 25."
      ],
      [
            "A timetable showing 08:15 and 08:45 has half an hour between the buses.",
            "45 minus 15 is 30 minutes, and 30 minutes is half an hour.",
            [
                  "There are two buses in that hour.",
                  "Both times end in a 5."
            ],
            "Two buses in an hour need not be half an hour apart: 08:05 and 08:50 are two buses with an uneven gap. Subtract the times."
      ],
      [
            "If you face north and turn to your right, you are facing east.",
            "Going clockwise the points run north, east, south, west, so a right turn from north lands on east.",
            [
                  "East is on the right-hand side of a map.",
                  "North and east are next to each other."
            ],
            "East being on the right of a map is perfectly true and is a fact about the map, not about which way your body turned."
      ],
      [
            "At half past six the hour hand sits between the 6 and the 7.",
            "The hour hand moves all the time, so by half past it has crept halfway to the next hour.",
            [
                  "The hour hand stays on the 6 until seven o'clock.",
                  "The minute hand is pointing at the 6."
            ],
            "That creeping hand is the same reason twenty-five to four still counts as 3 o'clock rather than 4."
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

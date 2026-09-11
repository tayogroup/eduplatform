  /* ---- shared data: one survey, used by slides 2, 3 and 5 ---- */
  const CATS = ["Walk", "Bus", "Car", "Bike"];
  const ICON = { Walk: "🚶", Bus: "🚌", Car: "🚗", Bike: "🚲" };
  const A4 = { Walk: 9, Bus: 6, Car: 4, Bike: 3 };     /* 22 children */
  const B4 = { Walk: 5, Bus: 11, Car: 4, Bike: 2 };    /* 22 children */
  const totalOf = (d) => CATS.reduce((s, c) => s + d[c], 0);
  const QUEUE = (function () {
    const q = [];
    CATS.forEach((c) => { for (let i = 0; i < A4[c]; i++) q.push(c); });
    return shuffle(q);
  })();

  /* ---- 1: planning an investigation (4Ss.01) ---- */
  const QS1 = [
    { q: "How do the children in our class travel to school?", collect: "One answer from each child: walk, bus, car or bike.",
      kind: "categorical", why: "The answers are <b>groups you can name</b> — walk, bus, car, bike. You cannot put them in order or add them up, so they are categorical." },
    { q: "How many brothers and sisters does each child have?", collect: "A whole number from each child: 0, 1, 2, 3 and so on.",
      kind: "discrete", why: "The answers are <b>numbers you count</b>, and only whole ones — nobody has two and a half sisters. That is discrete data." },
    { q: "Which fruit does our class like best?", collect: "One fruit named by each child.",
      kind: "categorical", why: "Fruit names are <b>groups</b>, not amounts. Categorical again." },
    { q: "How many books did each child read last month?", collect: "A whole number from each child.",
      kind: "discrete", why: "You are counting books, and you can only read a whole number of them. Discrete." },
  ];
  let q1 = 0, got1 = 0, lock1 = false;
  const KINDS = ["categorical", "discrete"];
  $("pickQ").innerHTML = QS1.map((x, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">Question ' + (i + 1) + "</button>").join("");
  function paint1() {
    const Q = QS1[q1];
    $("qcard").innerHTML = '<p class="qq">' + Q.q + '</p><p class="qc"><b>What you would collect:</b> ' + Q.collect + "</p>";
    $("kind1").innerHTML = KINDS.map((k) => '<button type="button" class="choice" data-k="' + k + '">' +
      (k === "categorical" ? "Groups you can name" : "Numbers you can count") + "</button>").join("");
    $("fb1").textContent = ""; $("fb1").className = "fb";
    $("task1").textContent = "Answered " + got1 + " of " + QS1.length;
    lock1 = false;
  }
  $("pickQ").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    q1 = Number(b.dataset.i);
    [...$("pickQ").children].forEach((c, i) => c.classList.toggle("on", i === q1));
    paint1();
  });
  $("kind1").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock1) return;
    lock1 = true;
    const ok = b.dataset.k === QS1[q1].kind;
    b.classList.add(ok ? "right" : "wrong");
    if (ok) got1++;
    $("fb1").innerHTML = (ok ? cheer() + " " : "") + QS1[q1].why;
    $("fb1").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : $("fb1").textContent);
    $("task1").textContent = "Answered " + got1 + " of " + QS1.length;
    if (got1 >= 3) finish(0, "");
  });
  paint1();

  /* ---- 2: tally chart and frequency table (4Ss.02) ---- */
  let n2 = 0;
  const tallyMarks = (n) => {
    let h = "";
    for (let g = 0; g < Math.floor(n / 5); g++) h += '<span class="gate">||||</span>';
    for (let r = 0; r < n % 5; r++) h += '<span class="mark">|</span>';
    return h || '<span class="none">—</span>';
  };
  function counts2() {
    const c = {}; CATS.forEach((k) => (c[k] = 0));
    for (let i = 0; i < n2; i++) c[QUEUE[i]]++;
    return c;
  }
  function paint2() {
    const c = counts2();
    let h = '<div class="trow thead"><span>Answer</span><span>Tally</span><span class="num">Frequency</span></div>';
    CATS.forEach((k) => {
      h += '<div class="trow"><span>' + ICON[k] + " " + k + '</span><span class="tal">' + tallyMarks(c[k]) +
        '</span><span class="num">' + c[k] + "</span></div>";
    });
    h += '<div class="trow tfoot"><span>Total</span><span></span><span class="num">' + n2 + "</span></div>";
    $("tally2").innerHTML = h;
    $("fb2").textContent = n2 === 0 ? "Nobody has answered yet."
      : n2 < QUEUE.length ? n2 + " of " + QUEUE.length + " children have answered."
      : "All " + QUEUE.length + " have answered. The frequencies add to " + n2 + ".";
    $("task2").textContent = "Every fifth mark is drawn across the gate, so you can count in fives.";
    if (n2 === QUEUE.length) finish(1, "");
  }
  $("one2").addEventListener("click", () => { if (n2 < QUEUE.length) { n2++; paint2(); say(QUEUE[n2 - 1]); } });
  $("all2").addEventListener("click", () => { n2 = QUEUE.length; paint2(); say("All twenty two have answered."); });
  $("reset2").addEventListener("click", () => { n2 = 0; paint2(); });
  paint2();

  /* ---- 3: pictogram, bar chart, dot plot (4Ss.02) ---- */
  const REPS = ["Pictogram", "Bar chart", "Dot plot"];
  const REPWHY = [
    "A pictogram uses a <b>key</b>, so one picture can stand for more than one child. Good when the numbers are big.",
    "A bar chart shows <b>how tall</b> each group is against a scale, so it is easy to compare them at a glance.",
    "A dot plot puts <b>one dot per child</b>, so you can still count the individuals as well as compare the groups.",
  ];
  let rep3 = 0;
  $("pickRep").innerHTML = REPS.map((r, i) => '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + r + "</button>").join("");
  function paint3() {
    const d = A4, max = Math.max.apply(null, CATS.map((c) => d[c]));
    let h = "";
    if (rep3 === 0) {
      h += '<p class="key">Key: ' + ICON.Walk + ' = 2 children</p>';
      CATS.forEach((c) => {
        const full = Math.floor(d[c] / 2), half = d[c] % 2;
        let pics = "";
        for (let i = 0; i < full; i++) pics += '<span class="pic">' + ICON[c] + "</span>";
        if (half) pics += '<span class="pic half">' + ICON[c] + "</span>";
        h += '<div class="prow"><span class="plab">' + c + '</span><span class="pics">' + pics + '</span><span class="pnum">' + d[c] + "</span></div>";
      });
    } else if (rep3 === 1) {
      h += '<div class="bars">';
      CATS.forEach((c) => {
        h += '<div class="bcol"><div class="bwrap"><div class="bbar" style="height:' + Math.round((d[c] / max) * 100) +
          '%"><span>' + d[c] + "</span></div></div><span class=\"blab\">" + c + "</span></div>";
      });
      h += "</div>";
    } else {
      CATS.forEach((c) => {
        let dots = "";
        for (let i = 0; i < d[c]; i++) dots += "<i></i>";
        h += '<div class="drow"><span class="plab">' + c + '</span><span class="dots2">' + dots + '</span><span class="pnum">' + d[c] + "</span></div>";
      });
    }
    $("rep3").innerHTML = h;
    $("fb3").innerHTML = REPWHY[rep3];
    $("task3").textContent = "Same 22 children every time — only the drawing changes.";
  }
  $("pickRep").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    rep3 = Number(b.dataset.i);
    [...$("pickRep").children].forEach((c, i) => c.classList.toggle("on", i === rep3));
    paint3(); say(REPS[rep3] + ". " + $("fb3").textContent);
    if (rep3 === REPS.length - 1) finish(2, "");
  });
  paint3();

  /* ---- 4: Venn and Carroll diagrams (4Ss.02) ---- */
  const NUMS = []; for (let i = 1; i <= 20; i++) NUMS.push(i);
  const isEven = (n) => n % 2 === 0, isBig = (n) => n > 10;
  const REGION = (n) => (isEven(n) ? 2 : 0) + (isBig(n) ? 1 : 0);   /* 0 odd/small 1 odd/big 2 even/small 3 even/big */
  let sort4 = 0;
  $("pickSort").innerHTML = ["A Venn diagram", "A Carroll diagram"].map((r, i) =>
    '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + r + "</button>").join("");
  function paint4() {
    const bucket = [[], [], [], []];
    NUMS.forEach((n) => bucket[REGION(n)].push(n));
    let h = "";
    if (sort4 === 0) {
      /* a real Venn: two overlapping hoops inside a box for everything else */
      const cluster = (nums, cx, cy) => {
        let t = "";
        nums.forEach((n, i) => {
          const col = i % 2, row = Math.floor(i / 2), wide = nums.length - row * 2 === 1;
          const x = wide ? cx : cx + (col ? 15 : -15), y = cy - 22 + row * 22;
          t += '<text class="vn" x="' + x + '" y="' + y + '">' + n + "</text>";
        });
        return t;
      };
      h += '<svg class="vennsvg" viewBox="0 0 340 232" role="img" aria-label="Two overlapping hoops sorting 1 to 20">' +
        '<rect class="uni" x="4" y="4" width="332" height="224" rx="14"></rect>' +
        '<circle class="hoopA" cx="132" cy="104" r="80"></circle>' +
        '<circle class="hoopB" cx="208" cy="104" r="80"></circle>' +
        '<text class="hl a" x="74" y="30">even</text>' +
        '<text class="hl b" x="266" y="30">more than 10</text>' +
        cluster(bucket[2], 86, 104) + cluster(bucket[3], 170, 104) + cluster(bucket[1], 254, 104) +
        '<text class="out" x="18" y="216">outside both: ' + bucket[0].join("  ") + "</text></svg>";
      $("fb4").innerHTML = "The middle holds the numbers that are <b>both</b> — even <b>and</b> more than 10. The ones outside both hoops are odd and 10 or less.";
    } else {
      h += '<table class="carroll"><tr><th></th><th>more than 10</th><th>not more than 10</th></tr>' +
        "<tr><th>even</th><td>" + bucket[3].join(" ") + "</td><td>" + bucket[2].join(" ") + "</td></tr>" +
        "<tr><th>not even</th><td>" + bucket[1].join(" ") + "</td><td>" + bucket[0].join(" ") + "</td></tr></table>";
      $("fb4").innerHTML = "A Carroll diagram gives every number <b>exactly one box</b>, including the ones that are neither.";
    }
    $("sort4").innerHTML = h;
    $("task4").textContent = "Both diagrams sort the same 20 numbers · " + bucket.map((b) => b.length).join(" + ") + " = " + NUMS.length;
    if (sort4 === 1) finish(3, "");
  }
  $("pickSort").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    sort4 = Number(b.dataset.i);
    [...$("pickSort").children].forEach((c, i) => c.classList.toggle("on", i === sort4));
    paint4(); say($("fb4").textContent);
  });
  paint4();

  /* ---- 5: interpreting two data sets (4Ss.03) ---- */
  const Q5 = [
    { q: "Which way of travelling is most common in Class 4B?", o: ["Bus", "Walk", "Car"], a: 0,
      w: "11 of the 22 children in 4B come by bus — exactly half the class, and more than any other way." },
    { q: "What is the same in both classes?", o: ["The same number of children come by car", "The most common answer", "Nobody cycles"], a: 0,
      w: "Four children come by car in each class. The most common answer differs — walking in 4A, the bus in 4B." },
    { q: "4A walks much more than 4B. Which is the best explanation to check first?", o: ["4A may live nearer the school", "4A has more children", "Walking is healthier"], a: 0,
      w: "Both classes have 22 children, so size cannot explain it. Where the children live is a real source of variation you could go and check." },
  ];
  let c5 = 0, right5 = 0, lock5 = false;
  function bars5(d, title) {
    const max = 12;
    let h = '<div class="mini"><p class="mlab">' + title + "</p><div class=\"bars\">";
    CATS.forEach((c) => {
      h += '<div class="bcol"><div class="bwrap"><div class="bbar" style="height:' + Math.round((d[c] / max) * 100) +
        '%"><span>' + d[c] + "</span></div></div><span class=\"blab\">" + c + "</span></div>";
    });
    return h + "</div></div>";
  }
  function paint5() {
    $("two5").innerHTML = bars5(A4, "Class 4A · " + totalOf(A4) + " children") + bars5(B4, "Class 4B · " + totalOf(B4) + " children");
    lock5 = false;
    $("fb5").textContent = ""; $("fb5").className = "fb";
    if (c5 >= Q5.length) {
      $("stem5").textContent = "That is all three.";
      $("choices5").innerHTML = "";
      $("task5").textContent = right5 + " of " + Q5.length + " right.";
      if (right5 >= 2) finish(4, "");
      return;
    }
    $("stem5").textContent = Q5[c5].q;
    const order = shuffle(Q5[c5].o.map((t, i) => ({ t: t, ok: i === Q5[c5].a })));
    $("choices5").innerHTML = order.map((o) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("task5").textContent = "Question " + (c5 + 1) + " of " + Q5.length + " · " + right5 + " right";
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
    setTimeout(paint5, 2600);
  });
  paint5();

  /* ---- 6: the language of chance (4Sp.01) ---- */
  const WORDS6 = ["impossible", "unlikely", "maybe", "likely", "certain"];   /* "even chance" is Stage 5's Sp.01 */
  const EV6 = shuffle([
    { e: "Rolling a number less than 7 on an ordinary dice", a: 4, w: "Every face is 1 to 6, and all of them are less than 7. It must happen, so it is certain." },
    { e: "Rolling a 7 on an ordinary dice", a: 0, w: "There is no 7 on a dice, so it cannot happen at all. That is impossible." },
    { e: "Rolling an even number on an ordinary dice", a: 2, w: "Three faces are even and three are odd, so it might happen and it might not. Maybe." },
    { e: "Taking a red counter from a bag of 9 red and 1 blue", a: 3, w: "Nine of the ten counters are red, so it will usually happen — likely, but not certain." },
    { e: "Taking a blue counter from a bag of 9 red and 1 blue", a: 1, w: "Only one counter in ten is blue, so it will not often happen. Unlikely, but not impossible." },
    { e: "Tossing a coin and getting heads", a: 2, w: "A coin has two sides, so heads might come up and it might not. Maybe." },
  ]);
  let e6 = 0, right6 = 0, lock6 = false;
  function paint6() {
    $("cl6").innerHTML = '<div class="cbar"></div>' + WORDS6.map((w, i) =>
      '<div class="cstop" style="left:' + (i / (WORDS6.length - 1)) * 100 + '%"><i></i><span>' + w + "</span></div>").join("");
    lock6 = false;
    $("fb6").textContent = ""; $("fb6").className = "fb";
    if (e6 >= EV6.length) {
      $("ev6").textContent = "That is all of them.";
      $("words6").innerHTML = "";
      $("task6").textContent = right6 + " of " + EV6.length + " right.";
      if (right6 >= 4) finish(5, "");
      return;
    }
    $("ev6").textContent = EV6[e6].e;
    $("words6").innerHTML = WORDS6.map((w, i) => '<button type="button" class="choice" data-i="' + i + '">' + w + "</button>").join("");
    $("task6").textContent = "Event " + (e6 + 1) + " of " + EV6.length + " · " + right6 + " right";
  }
  $("words6").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock6) return;
    lock6 = true;
    const ok = Number(b.dataset.i) === EV6[e6].a;
    if (ok) right6++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb6").textContent = (ok ? cheer() + " " : "") + EV6[e6].w;
    $("fb6").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : EV6[e6].w);
    e6++;
    setTimeout(paint6, 2600);
  });
  paint6();

  /* ---- 7: a chance experiment, few trials and many (4Sp.02) ---- */
  const SP = ["red", "blue", "green", "gold"];
  const SPHEX = { red: "var(--bad)", blue: "var(--teal)", green: "var(--good)", gold: "var(--gold)" };
  let last7 = null;
  function drawSpinner() {
    let s = "";
    SP.forEach((c, i) => {
      const a0 = (i * 90 - 90) * Math.PI / 180, a1 = ((i + 1) * 90 - 90) * Math.PI / 180;
      s += '<path d="M80,80 L' + (80 + 70 * Math.cos(a0)).toFixed(1) + "," + (80 + 70 * Math.sin(a0)).toFixed(1) +
        " A70,70 0 0,1 " + (80 + 70 * Math.cos(a1)).toFixed(1) + "," + (80 + 70 * Math.sin(a1)).toFixed(1) +
        ' Z" fill="' + SPHEX[c] + '" stroke="var(--card)" stroke-width="2"></path>';
    });
    s += '<circle cx="80" cy="80" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="2"></circle>';
    $("sp7").innerHTML = s;
  }
  function spin(n) {
    const c = {}; SP.forEach((k) => (c[k] = 0));
    for (let i = 0; i < n; i++) c[SP[rnd(0, 3)]]++;
    last7 = { n: n, c: c };
    const expect = n / 4;
    let h = '<p class="key">' + fmt(n) + " spins · each colour should come up about " + fmt(expect) + " times</p>";
    SP.forEach((k) => {
      const pc = (c[k] / n) * 100;
      h += '<div class="srow"><span class="plab">' + k + '</span><span class="sbarwrap"><span class="sbar" style="width:' +
        pc.toFixed(1) + "%;background:" + SPHEX[k] + '"></span></span><span class="pnum">' + fmt(c[k]) + " · " + pc.toFixed(0) + "%</span></div>";
    });
    $("res7").innerHTML = h;
    const worst = Math.max.apply(null, SP.map((k) => Math.abs(c[k] / n - 0.25))) * 100;
    $("fb7").innerHTML = "The furthest any colour landed from a quarter was <b>" + worst.toFixed(1) + " percentage points</b>.";
    $("task7").textContent = n >= 1000
      ? "With a thousand spins the four bars are nearly level — that is what more trials buys you."
      : "Now try more spins and watch the bars even out.";
    if (n >= 1000) finish(6, "");
    say(fmt(n) + " spins.");
  }
  document.querySelectorAll('#deck [data-n]').forEach((b) => b.addEventListener("click", () => spin(Number(b.dataset.n))));
  drawSpinner();
  spin(10);

  /* ---- 8: check ---- */
  const Q8 = shuffle([
    { q: "In a tally chart, what does a line drawn across four marks mean?", o: ["A group of 5", "A group of 4", "A mistake"], a: 0, w: "Four marks and one across them make a gate of five, so you can count the groups in fives." },
    { q: "Which data is categorical?", o: ["Favourite colour", "Number of pets", "Height in centimetres"], a: 0, w: "Colours are groups you can name. The other two are numbers you measure or count." },
    { q: "On a pictogram, one picture stands for 2 children. How many pictures show 9 children?", o: ["Four and a half", "Nine", "Eighteen"], a: 0, w: "9 ÷ 2 = 4 remainder 1, so four whole pictures and one half." },
    { q: "Where does a number go on a Carroll diagram if it is neither even nor more than 10?", o: ["In the fourth box", "Nowhere", "In the middle"], a: 0, w: "A Carroll diagram has a box for every combination, including 'neither' — that is what makes it different from a Venn diagram's middle." },
    { q: "Rolling a 7 on an ordinary six-sided dice is:", o: ["impossible", "unlikely", "certain"], a: 0, w: "There is no 7 on the dice, so it cannot happen at all." },
    { q: "A bag holds 9 red counters and 1 blue. Taking a red one is:", o: ["likely", "certain", "impossible"], a: 0, w: "Nine times out of ten it will be red — likely, but not certain, because the blue one is still in there." },
    { q: "Why spin a spinner 1000 times instead of 10?", o: ["The results settle nearer what should happen", "It is quicker", "It changes the spinner"], a: 0, w: "A few trials are lumpy by chance. More trials bring the proportions closer to the quarter each colour should get." },
    { q: "Two classes both have 22 children. 4A walks 9 and 4B walks 5. What can you say?", o: ["More of 4A walk", "4A is bigger", "4B has no walkers"], a: 0, w: "The classes are the same size, so the difference is real — 9 against 5 — and worth looking for a reason." },
  ]);
  let c8 = 0, right8 = 0, lock8 = false;
  function round8() {
    lock8 = false;
    $("fb8").textContent = ""; $("fb8").className = "fb";
    if (c8 >= Q8.length) {
      $("stem8").textContent = "That is all of them.";
      $("choices8").innerHTML = "";
      $("score8").textContent = right8 + " out of " + Q8.length + " right.";
      if (right8 >= 6) finish(7, "");
      else retryCheck($("fb8"), $("choices8"), right8, Q8.length, 6, function () { c8 = 0; right8 = 0; round8(); });
      return;
    }
    $("stem8").textContent = Q8[c8].q;
    const order = shuffle(Q8[c8].o.map((t, i) => ({ t: t, ok: i === Q8[c8].a })));
    $("choices8").innerHTML = order.map((o) => '<button type="button" class="choice" data-ok="' + (o.ok ? 1 : 0) + '">' + o.t + "</button>").join("");
    $("score8").textContent = "Question " + (c8 + 1) + " of " + Q8.length + " · " + right8 + " right";
  }
  $("choices8").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock8) return;
    lock8 = true;
    const ok = b.dataset.ok === "1";
    if (ok) right8++;
    b.classList.add(ok ? "right" : "wrong");
    $("fb8").textContent = (ok ? cheer() + " " : "") + Q8[c8].w;
    $("fb8").className = "fb " + (ok ? "good" : "bad");
    say(ok ? cheer() : Q8[c8].w);
    c8++;
    setTimeout(round8, 2300);
  });
  round8();

  /* ---- 9: stickers ---- */
  const STICKERS = [["❓", "What would answer it?"], ["✏️", "Tally, then count"], ["📊", "One set, three pictures"],
    ["⭕", "Sorting two ways at once"], ["🔍", "Two classes, one question"], ["🎲", "Impossible to certain"],
    ["🌀", "Spin it, and spin it again"], ["✅", "Show what I know"]];
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) => '<div class="sticker' + (done[i] ? " got" : "") + '"><span>' + s[0] + "</span><b>" + s[1] + "</b></div>").join("");
  }
  $("again").addEventListener("click", () => { show(0, true); });

  show(0, false);

  /* ---- your turn: the four slides that only demonstrated ---- */

  /* 2 (4Ss.02) reads a tally. The distractors are the two ways a child mis-reads a
     gate: counting gates instead of fives, and forgetting the loose marks. */
  ask(2, () => {
    const n = rnd(7, 29), g = Math.floor(n / 5), r = n % 5;
    const opts = pick3(n, [g + r, g * 5, n + 5]);
    return { stem: "A tally has <b>" + g + "</b> gates of five and <b>" + r +
        "</b> single mark" + (r === 1 ? "" : "s") + ". What is the frequency?",
      opts: opts.map(String), ans: opts.indexOf(n),
      why: g + " × 5 = " + g * 5 + ", then add the " + r + " left over: <b>" + n + "</b>." };
  });

  /* 3 (4Ss.02) reads a pictogram key -- the whole point is that one picture is not
     one child, so "how many pictures" is offered as a distractor. */
  ask(3, () => {
    const k = [2, 5, 10][rnd(0, 2)], p = rnd(3, 7), n = k * p;
    const opts = pick3(n, [p, k + p, n + k]);
    return { stem: "On a pictogram one picture stands for <b>" + k + " children</b>. " +
        "How many children do <b>" + p + " pictures</b> show?",
      opts: opts.map(String), ans: opts.indexOf(n),
      why: p + " pictures × " + k + " children each = <b>" + n + "</b>." };
  });

  /* 4 (4Ss.02) places a number in the Venn the slide draws: even, and more than 10.
     Options stay in a fixed order -- they are categories, and shuffling them would
     make the child re-read four labels every time instead of thinking about the number. */
  ask(4, () => {
    const n = rnd(1, 20), even = n % 2 === 0, big = n > 10;
    const opts = ["Both hoops", "Even only", "More than 10 only", "Outside both"];
    const ansI = even && big ? 0 : even ? 1 : big ? 2 : 3;
    return { stem: "Sorting 1 to 20 by <b>even</b> and <b>more than 10</b>. Where does <b>" +
        n + "</b> go?",
      opts: opts, ans: ansI,
      why: n + " is " + (even ? "even" : "odd") + " and " + (big ? "more than 10" : "10 or less") +
        ", so it belongs <b>" + opts[ansI].toLowerCase() + "</b>." };
  });

  /* 7 (4Sp.02) the point of the slide is that many trials settle towards the fraction,
     so the question asks for the expectation, not for what one run happened to give. */
  ask(7, () => {
    const spins = [100, 400, 1000][rnd(0, 2)], colours = 4, n = spins / colours;
    const opts = pick3(n, [colours, spins / 2, n * 2]);
    return { stem: "A spinner has <b>4 equal colours</b>. In about <b>" + fmt(spins) +
        " spins</b>, roughly how many would land on red?",
      opts: opts.map(fmt), ans: opts.indexOf(n),
      why: "Red is one colour out of four, so about a quarter: " + fmt(spins) + " ÷ 4 = <b>" +
        fmt(n) + "</b>. The more spins, the closer it gets." };
  });

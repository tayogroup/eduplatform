
  /* ---- shared by the new Parts of a Whole slides (2026-09-11 validation: grow the thinnest lessons; name local people) ---- */
  const NF_WHO = [["Amina", "her"], ["Musa", "his"], ["Hodan", "her"], ["Omar", "his"], ["Zara", "her"], ["Yusuf", "his"]];
  const NF_ONE = { 2: "half", 3: "third", 4: "quarter", 5: "fifth", 6: "sixth", 8: "eighth", 10: "tenth", 12: "twelfth" };
  const NF_MANY = { 2: "halves", 3: "thirds", 4: "quarters", 5: "fifths", 6: "sixths", 8: "eighths", 10: "tenths", 12: "twelfths" };
  const nfFr = (n, d) => '<span class="fr"><i>' + n + "</i><b>" + d + "</b></span>";
  const nfSay = (n, d) => n + " " + (n === 1 ? NF_ONE[d] : NF_MANY[d]);
  const nfGcd = (a, b) => (b ? nfGcd(b, a % b) : a);
  const nfLcm = (a, b) => a / nfGcd(a, b) * b;

  /* ---- 1: fractions of amounts, in real life (4Nf.03) ---- */
  let nf1 = null, nf1right = 0, nf1asked = 0, nf1lock = false;
  function nfNew1() {
    const d = [2, 3, 4, 5, 6, 8, 10][rnd(0, 6)], each = rnd(2, 9), total = d * each;
    const w = NF_WHO[rnd(0, NF_WHO.length - 1)], part = "one " + NF_ONE[d];
    const q = [
      w[0] + " has " + total + " mangoes and gives " + part + " of them to " + w[1] + " grandmother. How many mangoes does " + w[1] + " grandmother get?",
      w[0] + " saves " + total + " shillings and spends " + part + " of it on a pencil. How many shillings does the pencil cost?",
      "There are " + total + " children in " + w[0] + "'s class, and " + part + " of them walk to school. How many children walk?",
      w[0] + " collects " + total + " eggs, and " + part + " of them are brown. How many eggs are brown?",
    ][rnd(0, 3)];
    const opts = [each];
    for (const x of [d === 2 ? total : total - each, d, each + d, total]) if (opts.length < 3 && opts.indexOf(x) < 0) opts.push(x);
    return { d: d, each: each, total: total, q: q, opts: shuffle(opts) };
  }
  function nfPaint1() {
    $("nfq1").textContent = nf1.q;
    $("nfpick1").innerHTML = nf1.opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
    $("nfwork1").innerHTML = "";
    $("nffb1").textContent = ""; $("nffb1").className = "fb";
    $("nftask1").textContent = "Answered " + nf1asked + " · " + nf1right + " right";
  }
  $("nfpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || nf1lock) return;
    nf1lock = true; nf1asked++;
    const ok = Number(b.dataset.v) === nf1.each;
    if (ok) nf1right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("nfwork1"), [
      { k: "The whole", v: "<b>" + nf1.total + "</b>" },
      { k: nfFr(1, nf1.d) + " means", v: "share it into <b>" + nf1.d + "</b> equal groups" },
      { k: "One group", v: nf1.total + " ÷ " + nf1.d + " = <b>" + nf1.each + "</b>", total: true },
    ]);
    $("nffb1").innerHTML = (ok ? cheer() + " " : "It is " + nf1.each + ". ") + "One " + NF_ONE[nf1.d] + " of " + nf1.total +
      " means " + nf1.d + " equal groups, and each group holds " + nf1.each + ".";
    $("nffb1").className = "fb " + (ok ? "good" : "bad");
    say($("nffb1").textContent);
    if (nf1right >= 4) finish(0, "You can find a fraction of an amount!");
    setTimeout(() => { nf1 = nfNew1(); nf1lock = false; nfPaint1(); }, 2600);
  });
  nf1 = nfNew1(); nfPaint1();

  /* ---- 2: fractions in order, smallest first (4Nf.07) ---- */
  const NF_SETS = [
    [[1, 4], [1, 2], [5, 8]], [[3, 8], [1, 2], [3, 4]], [[1, 3], [1, 2], [5, 6]], [[2, 5], [1, 2], [7, 10]],
    [[1, 6], [1, 3], [1, 2]], [[5, 12], [1, 2], [2, 3]], [[1, 8], [3, 8], [3, 4]], [[3, 10], [1, 2], [4, 5]],
  ];
  let nf2 = null, nf2right = 0, nf2asked = 0, nf2lock = false;
  function nfNew2() {
    const s = NF_SETS[rnd(0, NF_SETS.length - 1)];
    const key = (list) => list.map((f) => f[0] + "/" + f[1]).join(",");
    const cands = [s.slice().reverse(), s.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]),
      [s[1], s[0], s[2]], [s[0], s[2], s[1]]];
    const opts = [s];
    for (const c of cands) if (opts.length < 3 && opts.every((o) => key(o) !== key(c))) opts.push(c);
    return { set: s, opts: shuffle(opts), key: key };
  }
  function nfPaint2() {
    $("nfq2").textContent = "Which list is in order, smallest first?";
    /* a gap, not a comma: beside a stacked fraction a comma sits on the baseline
       at the numerator's height and reads as an apostrophe */
    $("nfpick2").innerHTML = nf2.opts.map((o, i) => '<button type="button" class="choice word" data-i="' + i + '">' +
      o.map((f) => nfFr(f[0], f[1])).join('<span style="display:inline-block;width:18px"></span>') + "</button>").join("");
    $("nfwork2").innerHTML = "";
    $("nffb2").textContent = ""; $("nffb2").className = "fb";
    $("nftask2").textContent = "Answered " + nf2asked + " · " + nf2right + " right";
  }
  $("nfpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b || nf2lock) return;
    nf2lock = true; nf2asked++;
    const ok = nf2.key(nf2.opts[Number(b.dataset.i)]) === nf2.key(nf2.set);
    if (ok) nf2right++;
    b.classList.add(ok ? "right" : "wrong");
    const L = nf2.set.reduce((m, f) => nfLcm(m, f[1]), 1);
    const as = nf2.set.map((f) => [f[0] * L / f[1], L]);
    lines($("nfwork2"), [
      { k: "Same bottom number", v: "<b>" + L + "</b>" },
      { k: "Rewritten", v: nf2.set.map((f, i) => nfFr(f[0], f[1]) + " = " + nfFr(as[i][0], L)).join(" &nbsp; ") },
      { k: "Smallest first", v: nf2.set.map((f) => nfFr(f[0], f[1])).join(" &lt; "), total: true },
    ]);
    $("nffb2").innerHTML = (ok ? cheer() + " " : "") + "As " + NF_MANY[L] + " they are " +
      as.map((a) => a[0]).join(", ") + ", so the order is " + nf2.set.map((f) => nfSay(f[0], f[1])).join(", then ") + ".";
    $("nffb2").className = "fb " + (ok ? "good" : "bad");
    say($("nffb2").textContent);
    if (nf2right >= 4) finish(1, "You can put fractions in order!");
    setTimeout(() => { nf2 = nfNew2(); nf2lock = false; nfPaint2(); }, 3000);
  });
  nf2 = nfNew2(); nfPaint2();

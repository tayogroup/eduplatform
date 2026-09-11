# -*- coding: utf-8 -*-
"""Hold Grade 2 to Stage 2, and fill the three objectives it left open.

    python hold-stage-2.py            # report what would change
    python hold-stage-2.py --write    # change it

WHY. The 2026-09-09 clean-up removed 94 out-of-stage items and its README said
"every step is Stage 2 now". The 2026-09-11 validation found 16 more, in six of
the nine lessons, and a crash: Fair Shares step 8 drew thirds and sixths from a
name table that by then held only halves and quarters, so about half of all
page loads died before the step dots were drawn. Grade 3 then taught most of
the same steps again as its own Stage 3 content.

EVERY CHANGE IS IN PLACE. Grade 2 is live and routed, and progress is recorded
by step POSITION (step-01, step-02 ...). Deleting a step would move every later
step's record onto a different step, so each out-of-stage step is REWRITTEN in
its own slot and every lesson keeps its step count. The cost is the one Grade 1
accepted: a learner who had finished a rewritten step sees it ticked.

Where 0096 puts each thing that goes (src/curriculum/cambridge-mathematics-0096.json):
  cardinal points 3Gp.01 | km, and 1000 g = 1 kg, 1000 ml = 1 l 3Gg.02/.06/.07 |
  a time interval 3Gt.04 | giving change 3Nm.02 | money beyond 100 and
  regrouping 3Ni.04 | unit cost (proportion) 6Nf | thirds 3Nf | subtracting
  fractions 3Nf.07 | bar charts 3Ss.02 | a pictogram key of 2 - beyond 2Ss.02 |
  impossible-to-certain 4Sp.01, 'even chance' and fairness 5Sp.01 | the
  term-to-term rule 3Nc.05 | growing spatial patterns 3Nc.06 | finding a far
  term 5Nc.03.

And the three gaps it fills: 2Sp.02 (a chance experiment with two outcomes -
absent), 2Nc.04 (count on and back in 1s, 2s, 5s, 10s from any number - in
part) and 2Ss.01 (run an investigation - in part).

Guarded by the marker below; a second run changes nothing.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
MARK = "ehel-stage2-line"
WRITE = "--write" in sys.argv


def read(f):
    return io.open(os.path.join(HERE, f), encoding="utf-8", newline="").read()


def sub(s, old, new, n=1):
    c = s.count(old)
    if c != n:
        raise SystemExit("expected %d of %r, found %d" % (n, old[:90], c))
    return s.replace(old, new)


def section(s, say_prefix, new):
    """replace the whole <section ...> whose data-say starts with say_prefix"""
    key = '<section class="slide" data-say="' + say_prefix
    i = s.find(key)
    if i < 0 or s.find(key, i + 1) >= 0:
        raise SystemExit("section not found once: %r" % say_prefix[:60])
    i = s.rfind("\n", 0, i) + 1
    j = s.index("</section>", i) + len("</section>")
    return s[:i] + new.strip("\n") + s[j:]


def block(s, start, end, new):
    """replace from the start marker (inclusive) to the end marker (exclusive)"""
    i = s.find(start)
    if i < 0 or s.find(start, i + 1) >= 0:
        raise SystemExit("block start not found once: %r" % start[:60])
    j = s.find(end, i + len(start))
    if j < 0:
        raise SystemExit("block end not found: %r" % end[:60])
    return s[:i] + new.strip("\n").lstrip(" ") + "\n\n  " + s[j:].lstrip()


def css(s, rules):
    i = s.index("</style>")
    return s[:i] + rules + s[i:]


def check_items(s, items):
    """replace the whole CHECK array; every item carries a reason (why)"""
    i = s.index("  const CHECK = [")
    j = s.index("\n  ];", i) + len("\n  ];")
    body = ",\n".join("    " + it for it in items)
    return s[:i] + "  const CHECK = [\n" + body + "\n  ];" + s[j:]


def stickers(s, pairs):
    for old, new in pairs:
        s = sub(s, old, new)
    return s


def marker(s):
    return sub(s, "  const $ = (id) => document.getElementById(id);",
               "  /* " + MARK + ": held to Stage 2 by hold-stage-2.py (2026-09-11) */\n"
               "  const $ = (id) => document.getElementById(id);")


# ============================================================ Count It, Chart It
def count_it(s):
    s = css(s, """
  /* """ + MARK + """: Count It, Chart It - Carroll diagram, coin and spinner experiments, a survey */
  .carroll { display: grid; grid-template-columns: minmax(84px, auto) 1fr 1fr; gap: 6px; width: 100%; max-width: 480px; margin: 6px auto; }
  .carroll .cr-head, .carroll .cr-side { display: grid; place-items: center; text-align: center; font-weight: 700; font-size: 15px; line-height: 1.2; color: var(--ink); background: var(--cell); border-radius: 10px; padding: 6px 8px; }
  .carroll .cr-box { min-height: 66px; border-radius: 12px; border: 2px dashed var(--line); background: var(--card); font-size: 26px; color: var(--ink); cursor: pointer; }
  .carroll .cr-box.right { border-style: solid; border-color: var(--good); background: var(--good-soft); }
  .carroll .cr-box.wrong { border-style: solid; border-color: var(--bad); background: var(--bad-soft); }
  .coinface { display: inline-grid; place-items: center; width: 96px; height: 96px; border-radius: 50%; margin: 4px auto; font-weight: 800; font-size: 20px; background: var(--gold-soft); color: var(--gold-ink); border: 4px solid var(--gold); }
  .xtally { display: grid; gap: 6px; width: 100%; max-width: 420px; margin: 6px auto; }
  .xtally .tallyrow { display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 8px; background: var(--cell); border-radius: 10px; padding: 6px 10px; font-weight: 700; color: var(--ink); }
  .xtally button.tallyrow { border: 2px solid transparent; cursor: pointer; font: inherit; text-align: left; }
  .xtally button.tallyrow.wrong { border-color: var(--bad); }
  .xtally button.tallyrow.right { border-color: var(--good); }
""")
    # ---- 4: sorting two ways (Carroll) ----
    s = section(s, "Careful. Now one picture stands for two things.", """
    <section class="slide" data-say="A Carroll diagram sorts things two ways at once. Each thing goes in the one box where both labels are true.">
      <div class="slide-head"><span class="n">4</span><h2>Sorting two ways</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say4">Read the label <b>across the top</b> and the label <b>down the side</b>. Tap the box where <b>both</b> are true.</span></div>
      <div class="stage">
        <p class="fb" id="key4" style="font-size:48px;min-height:56px"></p>
        <div class="carroll" id="picto4"></div>
        <p class="fb" id="q4" style="font-size:21px"></p>
        <p class="fb" id="fb4"></p>
        <p class="fb small-fb" id="score4"></p>
      </div>
    </section>""")
    s = block(s, "/* ---- 4: pictogram with a key of 2 ---- */", "/* ---- 5: build a block graph ---- */", r"""
  /* ---- 4: sorting two ways - a Carroll diagram (0096 2Ss.02) ----
     Was 'When one picture means two': a pictogram key of 2 goes beyond 2Ss.02,
     whose list names Venn and Carroll diagrams, tally charts, block graphs and
     pictograms. The Carroll diagram was the one Stage 2 form the lesson lacked.
     Items are [picture, column, row]. */
  const CARROLL = [
    { across: ["can fly", "cannot fly"], down: ["has legs", "has no legs"],
      items: [["🦅", 0, 0], ["🐝", 0, 0], ["🦋", 0, 0], ["🐘", 1, 0], ["🐢", 1, 0], ["🐍", 1, 1], ["🐟", 1, 1], ["🐌", 1, 1]] },
    { across: ["is round", "is not round"], down: ["you can eat it", "you cannot eat it"],
      items: [["🍊", 0, 0], ["🍎", 0, 0], ["⚽", 0, 1], ["🏀", 0, 1], ["🍌", 1, 0], ["🥕", 1, 0], ["📘", 1, 1], ["📐", 1, 1]] },
  ];
  let set4 = null, order4 = [], placed4 = [], r4 = 0, right4 = 0, lock4 = false; const ROUNDS4 = 6;
  function paintCarroll4(show, wrongAt) {
    const S = set4;
    let h = '<div class="cr-head" aria-hidden="true"></div>' + S.across.map((t) => '<div class="cr-head">' + t + "</div>").join("");
    S.down.forEach((d, r) => {
      h += '<div class="cr-side">' + d + "</div>";
      [0, 1].forEach((c) => {
        const here = placed4.filter((it) => it[1] === c && it[2] === r).map((it) => it[0]).join(" ");
        const cls = show && show[0] === r && show[1] === c ? " right" : wrongAt && wrongAt[0] === r && wrongAt[1] === c ? " wrong" : "";
        h += '<button type="button" class="cr-box' + cls + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + S.across[c] + " and " + d + '">' + (here || "") + "</button>";
      });
    });
    $("picto4").innerHTML = h;
  }
  function round4() {
    lock4 = false; $("fb4").textContent = ""; $("fb4").className = "fb";
    if (r4 >= ROUNDS4) { $("picto4").innerHTML = ""; $("key4").textContent = ""; $("q4").textContent = ""; $("fb4").className = "fb good"; $("fb4").textContent = "You sorted " + right4 + " of " + ROUNDS4 + " into the right box!"; finish(3, "You can sort things two ways at once."); return; }
    if (r4 % 3 === 0) { set4 = CARROLL[(r4 / 3) % CARROLL.length]; order4 = shuffle(set4.items); placed4 = []; }
    const it = order4[r4 % 3];
    $("key4").textContent = it[0];
    $("score4").textContent = "Thing " + (r4 + 1) + " of " + ROUNDS4;
    $("q4").textContent = "Where does this one go? Tap its box.";
    paintCarroll4(null, null); say("Where does this one go? Tap its box.");
  }
  $("picto4").addEventListener("click", (e) => {
    const b = e.target.closest(".cr-box"); if (!b || lock4) return; lock4 = true;
    const it = order4[r4 % 3], r = Number(b.dataset.r), c = Number(b.dataset.c), ok = r === it[2] && c === it[1];
    if (ok) right4++;
    placed4.push(it); paintCarroll4([it[2], it[1]], ok ? null : [r, c]);
    const why = it[0] + " " + set4.across[it[1]] + " and " + set4.down[it[2]] + ", so it goes in that box.";
    $("fb4").className = "fb " + (ok ? "good" : "bad"); $("fb4").textContent = (ok ? cheer() + " " : "Not that box. ") + why;
    say((ok ? cheer() + " " : "") + why);
    r4++; setTimeout(round4, 2800);
  });
  round4();
""")
    # ---- 6: reading a block graph ----
    s = section(s, "This bar chart counts in twos.", """
    <section class="slide" data-say="A block graph has one block for each thing. Count the blocks to answer.">
      <div class="slide-head"><span class="n">6</span><h2>Reading a block graph</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say6">Each block is <b>one</b>. Count the blocks to answer.</span></div>
      <div class="stage">
        <svg class="chart" id="chart6" viewBox="0 0 340 240" role="img" aria-label="A block graph"></svg>
        <p class="fb" id="q6" style="font-size:21px"></p>
        <div class="choices" id="ch6"></div>
        <p class="fb" id="fb6"></p>
        <p class="fb small-fb" id="score6"></p>
      </div>
    </section>""")
    s = sub(s, "/* ---- 6: read a bar chart (scale 2) ---- */", "/* ---- 6: read a block graph (0096 2Ss.02, 2Ss.03) - was a bar chart with a scale of 2, which is 3Ss.02 ---- */")
    s = sub(s, "function newData6() { const C = C6[rnd(0, 1)]; data6 = { names: C.names, values: C.names.map(() => rnd(1, 9) * 2) }; drawChart($(\"chart6\"), data6.values, data6.names, 2); }",
            "function newData6() {\n    const C = C6[rnd(0, 1)]; let v;\n    /* one tallest and one shortest, or 'which was chosen most' has two answers */\n    do { v = C.names.map(() => rnd(1, 9)); } while (v.filter((x) => x === Math.max(...v)).length > 1 || v.filter((x) => x === Math.min(...v)).length > 1);\n    data6 = { names: C.names, values: v }; drawChart($(\"chart6\"), v, C.names, 1, v);\n  }")
    s = sub(s, "finish(5, \"You can read a bar chart with a scale.\")", "finish(5, \"You can read a block graph.\")")
    s = sub(s, "why = \"Its bar reaches \" + V[i] + \": \" + V[i] / 2 + \" steps of 2.\";", "why = \"Count the blocks: \" + N[i] + \" has \" + V[i] + \".\";")
    s = sub(s, "why = N[i] + \" has the tallest bar, at \" + V[i] + \".\";", "why = N[i] + \" has the tallest column, \" + V[i] + \" blocks.\";")
    s = sub(s, "why = N[i] + \" has the shortest bar, at \" + V[i] + \".\";", "why = N[i] + \" has the shortest column, \" + V[i] + \" blocks.\";")
    s = sub(s, "const wrongs = typeof a === \"number\" ? [a + 2, Math.max(1, a - 2)] : N.filter((n) => n !== a).slice(0, 2);\n    $(\"ch6\")",
            "const wrongs = typeof a === \"number\" ? [a + 1, a > 1 ? a - 1 : a + 2] : N.filter((n) => n !== a).slice(0, 2);\n    $(\"ch6\")")
    # ---- 7: toss a coin; 8: spin and record; 9: ask, collect, answer ----
    s = section(s, "How likely is it? Impossible, unlikely", """
    <section class="slide" data-say="A coin can land two ways, heads or tails. Toss it ten times and keep a tally. Then say what happened.">
      <div class="slide-head"><span class="n">7</span><h2>Toss a coin</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say7">Toss the coin <b>ten times</b>. The tally keeps count of <b>heads</b> and <b>tails</b>.</span></div>
      <div class="stage">
        <p class="eventcard" id="event7"><span class="coinface" id="coin7">?</span></p>
        <div class="bigbtns"><button type="button" class="big teal" id="toss7">Toss the coin</button></div>
        <div class="xtally" id="line7"></div>
        <p class="fb" id="q7" style="font-size:21px"></p>
        <div class="choices" id="ch7"></div>
        <p class="fb" id="fb7"></p>
        <p class="fb small-fb" id="score7"></p>
      </div>
    </section>""")
    s = section(s, "A bag of counters. Which colour", """
    <section class="slide" data-say="This spinner is half orange and half teal. Spin it ten times, and the block graph shows what happened.">
      <div class="slide-head"><span class="n">8</span><h2>Spin and record</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say8">Spin it <b>ten times</b>. Each spin adds a block to its colour.</span></div>
      <div class="stage">
        <div class="spinpair" id="bag8"></div>
        <div class="bigbtns"><button type="button" class="big teal" id="try8">Spin it</button></div>
        <svg class="chart" id="chart8" viewBox="0 0 340 240" role="img" aria-label="A block graph of the spins"></svg>
        <p class="fb" id="q8" style="font-size:21px"></p>
        <div class="choices" id="ch8"></div>
        <p class="fb" id="fb8"></p>
        <p class="fb small-fb" id="score8"></p>
      </div>
    </section>""")
    s = section(s, "Is the game fair? A fair game", """
    <section class="slide" data-say="An investigation starts with a question. Ask it, record every answer in a tally, then use the tally to answer.">
      <div class="slide-head"><span class="n">9</span><h2>Ask, collect, answer</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say9">Ask the class. Tap the row for each answer you hear, then use your tally.</span></div>
      <div class="stage">
        <p class="fb" id="rule9" style="font-size:21px"></p>
        <p class="eventcard" id="spin9"></p>
        <div class="xtally" id="ch9"></div>
        <p class="fb" id="q9" style="font-size:21px"></p>
        <div class="choices" id="ans9"></div>
        <p class="fb" id="fb9"></p>
        <p class="fb small-fb" id="score9"></p>
      </div>
    </section>""")
    s = block(s, "/* ---- 7: likelihood ---- */", "function choices(el, opts, wordy)", r"""
  /* ---- 7: a chance experiment with two outcomes - toss a coin (0096 2Sp.02) ----
     Was 'Impossible to certain': those words are 4Sp.01 and 'an even chance'
     is 5Sp.01. 2Sp.02 asks for exactly this, and nothing in Grade 2 did it:
     conduct a chance experiment with two outcomes, present and describe the
     results. Two runs of ten, then the question the experiment is for: did
     the second run come out the same as the first? */
  let toss7 = { h: 0, t: 0 }, runs7 = [], ask7 = 0, right7 = 0, lock7 = false, q7 = null;
  function tallyRows7(counts, names) { return names.map((n, i) => '<div class="tallyrow"><span>' + n + '</span><span class="marks">' + tallySvg(counts[i]) + '</span><span class="n">' + counts[i] + "</span></div>").join(""); }
  function paint7() { $("line7").innerHTML = tallyRows7([toss7.h, toss7.t], ["heads", "tails"]); $("score7").textContent = "Run " + (runs7.length + 1) + " of 2 - toss " + Math.min(10, toss7.h + toss7.t) + " of 10"; }
  function newRun7() { toss7 = { h: 0, t: 0 }; $("coin7").textContent = "?"; $("toss7").hidden = false; $("ch7").innerHTML = ""; $("q7").textContent = ""; paint7(); }
  function question7() {
    lock7 = false; $("fb7").textContent = ""; $("fb7").className = "fb";
    const n = runs7.length, last = runs7[n - 1];
    if (ask7 === 0) q7 = { q: "How many heads did you get?", a: String(last.h), opts: [last.h, last.h + 1, last.h > 0 ? last.h - 1 : last.h + 2].map(String), why: "The tally shows " + last.h + " heads and " + last.t + " tails: " + last.h + " + " + last.t + " = 10 tosses." };
    else if (ask7 === 1) { const a = last.h > last.t ? "heads" : last.t > last.h ? "tails" : "the same"; q7 = { q: "Which came up more often this time?", a, opts: ["heads", "tails", "the same"], why: last.h === last.t ? "Heads " + last.h + ", tails " + last.t + ": the same." : a + " came up " + Math.max(last.h, last.t) + " times out of 10." }; }
    else { const same = runs7[0].h === runs7[1].h; q7 = { q: "Did your two runs come out exactly the same?", a: same ? "yes, the same" : "no, different", opts: ["yes, the same", "no, different"], why: "Run 1 had " + runs7[0].h + " heads, run 2 had " + runs7[1].h + ". " + (same ? "The same this time - but it could have come out differently." : "A coin can land either way, so each run can come out differently.") }; }
    $("q7").textContent = q7.q; $("say7").textContent = q7.q;
    $("ch7").innerHTML = shuffle(q7.opts).filter((v, i, arr) => arr.indexOf(v) === i).map((v) => '<button type="button" class="choice' + (/[a-z]/.test(v) ? " word" : "") + '" data-v="' + v + '">' + v + "</button>").join("");
    say(q7.q);
  }
  $("toss7").addEventListener("click", () => {
    if (toss7.h + toss7.t >= 10) return;
    const heads = Math.random() < 0.5; if (heads) toss7.h++; else toss7.t++;
    $("coin7").textContent = heads ? "heads" : "tails"; paint7(); say(heads ? "heads" : "tails");
    if (toss7.h + toss7.t === 10) { $("toss7").hidden = true; runs7.push({ h: toss7.h, t: toss7.t }); ask7 = 0; setTimeout(question7, 900); }
  });
  $("ch7").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock7 || !q7) return; lock7 = true; const ok = b.dataset.v === q7.a;
    $("ch7").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.v === q7.a) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right7++;
    $("fb7").className = "fb " + (ok ? "good" : "bad"); $("fb7").textContent = (ok ? cheer() + " " : "Not quite. ") + q7.why; say((ok ? cheer() + " " : "") + q7.why);
    const lastAsk = runs7.length === 2 ? 2 : 1;
    if (ask7 < lastAsk) { ask7++; setTimeout(question7, 2800); return; }
    if (runs7.length < 2) { setTimeout(newRun7, 3000); return; }
    setTimeout(() => { $("ch7").innerHTML = ""; $("q7").textContent = ""; $("fb7").className = "fb good"; $("fb7").textContent = "You ran the experiment twice and answered " + right7 + " of 5."; finish(6, "You can do a chance experiment and say what happened."); }, 3000);
  });
  newRun7();

  /* ---- 8: spin and record - present the results as a block graph (0096 2Sp.02) ----
     Was 'What is in the bag?': 'most likely' is Stage 5 language. The spinner
     has two equal halves - two outcomes, as 2Sp.02 says - and the block graph
     is the child's own results, so the answers are read off what happened. */
  function spinnerSvg(parts, at) {
    const cx = 80, cy = 80, R = 68; let a0 = -90, svg = "";
    parts.forEach((p, i) => {
      const a1 = a0 + p * 360, r0 = (a0 * Math.PI) / 180, r1 = (a1 * Math.PI) / 180;
      svg += '<path class="s' + i + '" d="M' + cx + "," + cy + " L" + (cx + R * Math.cos(r0)).toFixed(1) + "," + (cy + R * Math.sin(r0)).toFixed(1) + " A" + R + "," + R + " 0 " + (p > 0.5 ? 1 : 0) + ",1 " + (cx + R * Math.cos(r1)).toFixed(1) + "," + (cy + R * Math.sin(r1)).toFixed(1) + ' Z"></path>';
      a0 = a1;
    });
    const na = ((at - 90) * Math.PI) / 180;
    svg += '<line class="needle" x1="80" y1="80" x2="' + (80 + 54 * Math.cos(na)).toFixed(1) + '" y2="' + (80 + 54 * Math.sin(na)).toFixed(1) + '"></line><circle class="pin" cx="80" cy="80" r="7"></circle>';
    return '<svg class="spinner" viewBox="0 0 160 160" role="img" aria-label="A spinner, half orange and half teal">' + svg + "</svg>";
  }
  let spins8 = [0, 0], run8 = 0, ask8 = 0, right8 = 0, lock8 = false, q8 = null;
  const COL8 = ["orange", "teal"];
  function paint8(at) { $("bag8").innerHTML = "<div>" + spinnerSvg([0.5, 0.5], at) + '<div class="who">the spinner</div></div>'; drawChart($("chart8"), spins8, COL8, 1, spins8); $("score8").textContent = "Run " + (run8 + 1) + " of 2 - spin " + (spins8[0] + spins8[1]) + " of 10"; }
  function newRun8() { spins8 = [0, 0]; ask8 = 0; $("try8").hidden = false; $("ch8").innerHTML = ""; $("q8").textContent = ""; paint8(0); }
  function question8() {
    lock8 = false; $("fb8").textContent = ""; $("fb8").className = "fb";
    const [o, t] = spins8;
    if (ask8 === 0) q8 = { q: "How many times did it land on teal?", a: String(t), opts: [t, t + 1, t > 0 ? t - 1 : t + 2].map(String), why: "The teal column has " + t + " blocks." };
    else { const a = o > t ? "orange" : t > o ? "teal" : "the same"; q8 = { q: "Which colour came up more often this time?", a, opts: ["orange", "teal", "the same"], why: o === t ? "Orange " + o + ", teal " + t + ": the same." : a + " has the taller column, " + Math.max(o, t) + " blocks. The halves are the same size, so next time it could be the other one." }; }
    $("q8").textContent = q8.q; $("say8").textContent = q8.q;
    $("ch8").innerHTML = shuffle(q8.opts).filter((v, i, arr) => arr.indexOf(v) === i).map((v) => '<button type="button" class="choice' + (/[a-z]/.test(v) ? " word" : "") + '" data-v="' + v + '">' + v + "</button>").join("");
    say(q8.q);
  }
  $("try8").addEventListener("click", () => {
    if (spins8[0] + spins8[1] >= 10) return;
    const k = Math.random() < 0.5 ? 0 : 1; spins8[k]++;
    paint8(k === 0 ? rnd(10, 170) : rnd(190, 350)); say(COL8[k]);
    if (spins8[0] + spins8[1] === 10) { $("try8").hidden = true; setTimeout(question8, 900); }
  });
  $("ch8").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock8 || !q8) return; lock8 = true; const ok = b.dataset.v === q8.a;
    $("ch8").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.v === q8.a) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right8++;
    $("fb8").className = "fb " + (ok ? "good" : "bad"); $("fb8").textContent = (ok ? cheer() + " " : "Not quite. ") + q8.why; say((ok ? cheer() + " " : "") + q8.why);
    if (ask8 === 0) { ask8++; setTimeout(question8, 2800); return; }
    run8++;
    if (run8 < 2) { setTimeout(newRun8, 3200); return; }
    setTimeout(() => { $("ch8").innerHTML = ""; $("q8").textContent = ""; $("fb8").className = "fb good"; $("fb8").textContent = "You recorded two runs and answered " + right8 + " of 4."; finish(7, "You can record an experiment in a block graph."); }, 3200);
  });
  newRun8();

  /* ---- 9: ask, collect, answer - a small investigation (0096 2Ss.01) ----
     Was 'Is it fair?', which is 5Sp.01. 2Ss.01 is 'conduct an investigation to
     answer questions', and the lesson only ever answered questions about data
     it handed over. Here the child does all three parts: hears each answer,
     records it, then answers the question from their own tally. */
  const SURVEYS9 = [
    { q: "What is the favourite fruit in our class?", names: [["🍌", "banana"], ["🍊", "orange"], ["🍎", "apple"]] },
    { q: "How do children in our class get to school?", names: [["🚶", "walk"], ["🚌", "bus"], ["🚲", "bike"]] },
  ];
  let sv9 = null, answers9 = [], tally9 = [0, 0, 0], at9 = 0, mistakes9 = 0, phase9 = 0, right9 = 0, lock9 = false, q9 = null, run9 = 0;
  function newSurvey9() {
    sv9 = SURVEYS9[run9 % SURVEYS9.length];
    let counts; do { counts = [rnd(2, 6), rnd(1, 5), rnd(1, 5)]; } while (counts.filter((x) => x === Math.max(...counts)).length > 1 || counts.reduce((a, b) => a + b, 0) > 12);
    answers9 = shuffle(counts.flatMap((n, i) => Array.from({ length: n }, () => i)));
    tally9 = [0, 0, 0]; at9 = 0; mistakes9 = 0; phase9 = 0;
    $("rule9").textContent = "Question: " + sv9.q; $("ans9").innerHTML = ""; $("q9").textContent = "";
    next9();
  }
  function paint9() { $("ch9").innerHTML = sv9.names.map((n, i) => '<button type="button" class="tallyrow" data-i="' + i + '"><span>' + n[0] + " " + n[1] + '</span><span class="marks">' + tallySvg(tally9[i]) + '</span><span class="n">' + tally9[i] + "</span></button>").join(""); }
  function next9() {
    paint9(); lock9 = false;
    if (at9 >= answers9.length) { phase9 = 1; $("spin9").textContent = "Everyone has answered."; ask9(0); return; }
    const n = sv9.names[answers9[at9]];
    $("spin9").textContent = "Child " + (at9 + 1) + " says: " + n[0] + " " + n[1];
    $("score9").textContent = "Answer " + (at9 + 1) + " of " + answers9.length; say(n[1]);
  }
  function ask9(k) {
    lock9 = false; $("fb9").textContent = ""; $("fb9").className = "fb";
    const most = tally9.indexOf(Math.max(...tally9)), pick = (most + 1 + rnd(0, 1)) % 3;
    q9 = k === 0 ? { k, q: "Use your tally. " + sv9.q, a: sv9.names[most][1], opts: sv9.names.map((n) => n[1]), why: sv9.names[most][1] + " has the most tally marks: " + tally9[most] + "." }
                 : { k, q: "How many children said " + sv9.names[pick][1] + "?", a: String(tally9[pick]), opts: [tally9[pick], tally9[pick] + 1, tally9[pick] + 2].map(String), why: "The tally for " + sv9.names[pick][1] + " shows " + tally9[pick] + "." };
    $("q9").textContent = q9.q; $("say9").textContent = q9.q;
    $("ans9").innerHTML = shuffle(q9.opts).map((v) => '<button type="button" class="choice' + (/[a-z]/.test(v) ? " word" : "") + '" data-v="' + v + '">' + v + "</button>").join("");
    say(q9.q);
  }
  $("ch9").addEventListener("click", (e) => {
    const b = e.target.closest(".tallyrow"); if (!b || phase9 !== 0 || lock9) return;
    const i = Number(b.dataset.i), want = answers9[at9];
    if (i !== want) { mistakes9++; b.classList.add("wrong"); $("fb9").className = "fb bad"; $("fb9").textContent = "Listen again: they said " + sv9.names[want][1] + "."; say("They said " + sv9.names[want][1]); return; }
    lock9 = true; tally9[i]++; at9++; $("fb9").textContent = ""; $("fb9").className = "fb"; setTimeout(next9, 500);
  });
  $("ans9").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock9 || !q9) return; lock9 = true; const ok = b.dataset.v === q9.a;
    $("ans9").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.v === q9.a) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right9++;
    $("fb9").className = "fb " + (ok ? "good" : "bad"); $("fb9").textContent = (ok ? cheer() + " " : "Not quite. ") + q9.why; say((ok ? cheer() + " " : "") + q9.why);
    if (q9.k === 0) { setTimeout(() => ask9(1), 2600); return; }
    run9++;
    if (run9 < 2) { setTimeout(newSurvey9, 3000); return; }
    setTimeout(() => { $("ans9").innerHTML = ""; $("q9").textContent = ""; $("fb9").className = "fb good"; $("fb9").textContent = "You ran two surveys and answered " + right9 + " of 4 from your own tally."; finish(8, "You can ask a question, collect the answers and use them."); }, 3000);
  });
  newSurvey9();

  """)
    s = check_items(s, [
        '{ q: "In a tally, how many does |||| crossed through stand for?", opts: [5, 4, 6], a: 5, why: "Four marks with one across them is a bundle of 5." }',
        '{ q: "A pictogram key says one ⭐ = 1. A row has 6 stars. How many is that?", opts: [6, 5, 7], a: 6, why: "Each star is 1, so 6 stars show 6." }',
        '{ q: "The bus column of a block graph has 7 blocks. How many chose bus?", opts: [7, 6, 8], a: 7, why: "One block is one child, so 7 blocks mean 7." }',
        '{ q: "In a Carroll diagram, where does a fish go?", opts: ["cannot fly, has no legs", "can fly, has legs", "cannot fly, has legs"], a: "cannot fly, has no legs", why: "A fish cannot fly and has no legs, so it goes in that box." }',
        '{ q: "You toss a coin. What can it land on?", opts: ["heads or tails", "only heads", "only tails"], a: "heads or tails", why: "A coin has two sides, so there are two ways it can land." }',
        '{ q: "You toss a coin 10 times and get 6 heads. How many tails?", opts: [4, 6, 10], a: 4, why: "There were 10 tosses: 10 − 6 = 4 tails." }',
        '{ q: "You toss the coin 10 more times. Will you get 6 heads again?", opts: ["maybe, maybe not", "yes, every time", "no, never"], a: "maybe, maybe not", why: "Each toss can land either way, so a new run can come out differently." }',
        '{ q: "You want to find the class\\u2019s favourite fruit. What do you do first?", opts: ["ask everyone and keep a tally", "guess", "count the fruit in a shop"], a: "ask everyone and keep a tally", why: "An investigation starts by asking and recording every answer." }',
        '{ q: "What is a tally chart good for?", opts: ["counting as you go", "measuring length", "telling the time"], a: "counting as you go", why: "You make one mark for each thing as you count, so nothing is missed." }',
        '{ q: "A block graph shows 6, 4, 8 and 2. How many altogether?", opts: [20, 18, 22], a: 20, why: "6 + 4 + 8 + 2 = 20." }',
    ])
    s = stickers(s, [('["🔑", "Reading a key"]', '["🗃️", "Sorting two ways"]'), ('["📊", "Bar charts"]', '["🧱", "Reading a block graph"]'),
                     ('["🎲", "Impossible to certain"]', '["🎲", "Toss a coin"]'), ('["🎒", "What is in the bag"]', '["🎡", "Spin and record"]'),
                     ('["⚖️", "Fair or not fair"]', '["📋", "Ask, collect, answer"]')])
    return s


# ============================================================ Patterns That Grow
def patterns(s):
    s = section(s, "A growing pattern gets bigger by the same amount each time.", """
    <section class="slide" data-say="Count on in steps. Pick a start and a step, then keep counting on: in ones, twos, fives or tens.">
      <div class="slide-head"><span class="n">5</span><h2>Counting on in steps</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say5">Count <b>on</b> from the start number, the same step each time.</span></div>
      <div class="stage">
        <div class="seq" id="stairs5"></div>
        <div class="choices" id="ch5"></div>
        <p class="fb" id="fb5"></p>
        <p class="fb small-fb" id="score5"></p>
      </div>
    </section>""")
    s = section(s, "Look at the numbers. What is added each time?", """
    <section class="slide" data-say="A number pattern goes up by the same amount each time. How does this one go up?">
      <div class="slide-head"><span class="n">6</span><h2>How does it go up?</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say6">Look at the jumps between the numbers. Does it go up in <b>ones, twos, fives or tens</b>?</span></div>
      <div class="stage">
        <div class="seq" id="seq6"></div>
        <div class="choices" id="ch6"></div>
        <p class="fb" id="fb6"></p>
        <p class="fb small-fb" id="score6"></p>
      </div>
    </section>""")
    s = sub(s, '<section class="slide" data-say="A number is missing from the pattern. Use the rule to find it.">',
            '<section class="slide" data-say="A number is missing from the pattern. Work out how it goes up, then fill the gap.">')
    s = sub(s, '<span id="say7">Find the rule first, then use it to fill the <b>gap</b>.</span>',
            '<span id="say7">Work out how it goes up, then fill the <b>gap</b>.</span>')
    s = section(s, "You do not have to draw every pattern.", """
    <section class="slide" data-say="Count back in steps. Start high, and take the same step away each time.">
      <div class="slide-head"><span class="n">8</span><h2>Counting back in steps</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say8">Count <b>back</b> from the start number, the same step each time.</span></div>
      <div class="stage">
        <div class="seq" id="stairs8"></div>
        <div class="choices" id="ch8"></div>
        <p class="fb" id="fb8"></p>
        <p class="fb small-fb" id="score8"></p>
      </div>
    </section>""")
    s = section(s, "Some patterns shrink. The same amount is taken away each time.", """
    <section class="slide" data-say="Patterns hide in the hundred square. The coloured numbers go up by the same amount. Tap the next one.">
      <div class="slide-head"><span class="n">9</span><h2>Hundred square patterns</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say9">The coloured numbers make a pattern. Tap the number that comes <b>next</b>.</span></div>
      <div class="stage">
        <div class="h100" id="stairs9"></div>
        <p class="fb" id="seq9" style="font-size:21px"></p>
        <p class="fb" id="fb9"></p>
        <p class="fb small-fb" id="score9"></p>
      </div>
    </section>""")
    s = css(s, """
  /* """ + MARK + """: Patterns That Grow - the hundred square */
  .h100 { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; width: 100%; max-width: 420px; margin: 6px auto; }
  .h100 button { aspect-ratio: 1; min-height: 28px; border: 0; border-radius: 6px; background: var(--cell); color: var(--ink); font: 700 13px "Inter", "Segoe UI", sans-serif; cursor: pointer; padding: 0; }
  .h100 button.on { background: var(--teal); color: var(--card); }
  .h100 button.right { background: var(--good); color: var(--card); }
  .h100 button.wrong { background: var(--bad); color: var(--card); }
""")
    s = block(s, "/* ---- 5: growing staircase ---- */", "/* ---- 6: find the rule ---- */", r"""
  /* ---- 5: counting on in steps from any number (0096 2Nc.04) ----
     Was a growing staircase of blocks - a spatial pattern from adding a
     constant, which is 3Nc.06. 2Nc.04 is 'count on and count back in ones,
     twos, fives or tens, starting from any number (0 to 100)', and Grade 2 only
     ever skip-counted from zero in an array. */
  const STEPS = [1, 2, 5, 10];
  const counts = (start, step, n) => Array.from({ length: n }, (_, i) => start + i * step);
  let r5 = 0, right5 = 0, lock5 = false, s5 = null; const ROUNDS5 = 5;
  function round5() {
    lock5 = false; $("fb5").textContent = ""; $("fb5").className = "fb";
    if (r5 >= ROUNDS5) { $("stairs5").innerHTML = ""; $("ch5").innerHTML = ""; $("fb5").className = "fb good"; $("fb5").textContent = "You counted on " + right5 + " of " + ROUNDS5 + " times!"; finish(4, "You can count on in steps from any number."); return; }
    const step = STEPS[r5 % 4], start = step === 10 ? rnd(3, 49) : step === 5 ? rnd(2, 60) : rnd(11, 80), arr = counts(start, step, 4), ans = start + 4 * step;
    s5 = { step, arr, ans };
    $("score5").textContent = "Count " + (r5 + 1) + " of " + ROUNDS5;
    $("stairs5").innerHTML = seqHtml(arr.concat([null]));
    $("say5").innerHTML = "Start at <b>" + start + "</b> and count on in <b>" + (step === 1 ? "ones" : step === 2 ? "twos" : step === 5 ? "fives" : "tens") + "</b>. What comes next?";
    $("ch5").innerHTML = shuffle([ans, ans + 1, ans - 1 === arr[3] ? ans + step : ans - 1]).filter((v, i, a) => a.indexOf(v) === i).map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    say("Start at " + start + " and count on in " + (step === 1 ? "ones" : step === 2 ? "twos" : step === 5 ? "fives" : "tens") + ". What comes next?");
  }
  $("ch5").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock5) return; lock5 = true; const ok = Number(b.dataset.v) === s5.ans;
    $("ch5").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (Number(c.dataset.v) === s5.ans) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right5++;
    $("stairs5").innerHTML = seqHtml(s5.arr.concat([s5.ans]));
    const why = s5.arr[3] + " + " + s5.step + " = " + s5.ans + ".";
    $("fb5").className = "fb " + (ok ? "good" : "bad"); $("fb5").textContent = (ok ? cheer() + " " : "") + why; say((ok ? cheer() + " " : "") + why);
    r5++; setTimeout(round5, 2400);
  });
""")
    # seqHtml is declared in step 6's block, which now runs AFTER step 5 - move the call out of the way
    s = sub(s, "  /* ---- 6: find the rule ---- */\n  let r6 = 0, right6 = 0, lock6 = false, seq6 = null; const ROUNDS6 = 4;\n  function seqHtml(arr, opts) {",
            "  /* ---- 6: how does it go up? (0096 2Nc.06) - steps of 1, 2, 5 and 10 only; 'the rule' is 3Nc.05 ---- */\n  let r6 = 0, right6 = 0, lock6 = false, seq6 = null; const ROUNDS6 = 4;\n  function seqHtml(arr, opts) {")
    s = sub(s, "  round6();\n\n  /* ---- 7: missing number ---- */", "  round6();\n  round5();\n\n  /* ---- 7: missing number ---- */")
    s = sub(s, "finish(5, \"You can find the rule of a growing pattern.\")", "finish(5, \"You can say how a number pattern goes up.\")")
    s = sub(s, "\"You found \" + right6 + \" of \" + ROUNDS6 + \" rules!\"", "\"You found \" + right6 + \" of \" + ROUNDS6 + \" patterns!\"")
    s = sub(s, "const step = [2, 3, 4, 5, 10, 6][rnd(0, 5)], start = rnd(1, 12);", "const step = STEPS[rnd(0, 3)], start = rnd(1, 40);")
    s = sub(s, "$(\"ch6\").innerHTML = shuffle([step, step + 1, step - 1 > 0 ? step - 1 : step + 2]).map((v) => '<button type=\"button\" class=\"choice\" data-v=\"' + v + '\">+' + v + \"</button>\").join(\"\");",
            "$(\"ch6\").innerHTML = shuffle(STEPS.filter((v) => v !== step).slice(0, 2).concat([step])).map((v) => '<button type=\"button\" class=\"choice word\" data-v=\"' + v + '\">up in ' + (v === 1 ? \"ones\" : v === 2 ? \"twos\" : v === 5 ? \"fives\" : \"tens\") + \"</button>\").join(\"\");")
    s = sub(s, "say(seq6.arr.join(\", \") + \". What is added each time?\");", "say(seq6.arr.join(\", \") + \". How does it go up?\");")
    s = sub(s, "const why = seq6.arr[1] + \" − \" + seq6.arr[0] + \" = \" + seq6.step + \", and every jump is the same. The rule is add \" + seq6.step + \".\";",
            "const why = seq6.arr[1] + \" − \" + seq6.arr[0] + \" = \" + seq6.step + \", and every jump is the same: it goes up in \" + (seq6.step === 1 ? \"ones\" : seq6.step === 2 ? \"twos\" : seq6.step === 5 ? \"fives\" : \"tens\") + \".\";")
    s = sub(s, "const step = [2, 3, 4, 5, 10, 25][rnd(0, 5)], start = rnd(1, 15), full = counts(start, step, 6), gap = rnd(1, 5);",
            "const step = STEPS[rnd(0, 3)], start = rnd(1, step === 10 ? 40 : 60), full = counts(start, step, 6), gap = rnd(1, 5);")
    s = sub(s, "const why = \"The rule is add \" + seq7.step + \". \" + seq7.full[seq7.gap - 1] + \" + \" + seq7.step + \" = \" + ans + \".\";",
            "const why = \"It goes up by \" + seq7.step + \" each time. \" + seq7.full[seq7.gap - 1] + \" + \" + seq7.step + \" = \" + ans + \".\";")
    s = block(s, "/* ---- 8: predict far ahead ---- */", "/* ---- 10: check ---- */", r"""
  /* ---- 8: counting back in steps (0096 2Nc.04) ----
     Was 'Predict far ahead' - jumping to pattern ten with a table, which is
     finding any term of a sequence, 5Nc.03. */
  let r8 = 0, right8 = 0, lock8 = false, s8 = null; const ROUNDS8 = 5;
  function round8() {
    lock8 = false; $("fb8").textContent = ""; $("fb8").className = "fb";
    if (r8 >= ROUNDS8) { $("stairs8").innerHTML = ""; $("ch8").innerHTML = ""; $("fb8").className = "fb good"; $("fb8").textContent = "You counted back " + right8 + " of " + ROUNDS8 + " times!"; finish(7, "You can count back in steps from any number."); return; }
    const step = STEPS[(r8 + 2) % 4], start = step === 10 ? rnd(55, 100) : step === 5 ? rnd(40, 100) : rnd(30, 100), arr = [start, start - step, start - 2 * step, start - 3 * step], ans = start - 4 * step;
    s8 = { step, arr, ans };
    $("score8").textContent = "Count " + (r8 + 1) + " of " + ROUNDS8;
    $("stairs8").innerHTML = seqHtml(arr.concat([null]));
    const w = step === 1 ? "ones" : step === 2 ? "twos" : step === 5 ? "fives" : "tens";
    $("say8").innerHTML = "Start at <b>" + start + "</b> and count back in <b>" + w + "</b>. What comes next?";
    $("ch8").innerHTML = shuffle([ans, ans + 2 * step, ans - 1]).filter((v, i, a) => a.indexOf(v) === i).map((v) => '<button type="button" class="choice" data-v="' + v + '">' + v + "</button>").join("");
    say("Start at " + start + " and count back in " + w + ". What comes next?");
  }
  $("ch8").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock8) return; lock8 = true; const ok = Number(b.dataset.v) === s8.ans;
    $("ch8").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (Number(c.dataset.v) === s8.ans) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right8++;
    $("stairs8").innerHTML = seqHtml(s8.arr.concat([s8.ans]));
    const why = s8.arr[3] + " − " + s8.step + " = " + s8.ans + ".";
    $("fb8").className = "fb " + (ok ? "good" : "bad"); $("fb8").textContent = (ok ? cheer() + " " : "") + why; say((ok ? cheer() + " " : "") + why);
    r8++; setTimeout(round8, 2400);
  });
  round8();

  /* ---- 9: patterns on the hundred square (0096 2Nc.06) ----
     Was 'Shrinking patterns', a staircase that loses blocks - 3Nc.06 again. A
     sequence to 100 on the hundred square is Stage 2's own. */
  let r9 = 0, right9 = 0, lock9 = false, s9 = null; const ROUNDS9 = 4;
  function round9() {
    lock9 = false; $("fb9").textContent = ""; $("fb9").className = "fb";
    if (r9 >= ROUNDS9) { $("stairs9").innerHTML = ""; $("seq9").textContent = ""; $("fb9").className = "fb good"; $("fb9").textContent = "You found " + right9 + " of " + ROUNDS9 + " next numbers!"; finish(8, "You can find patterns on the hundred square."); return; }
    const step = [10, 5, 2, 10][r9], start = step === 10 ? rnd(1, 9) : step === 5 ? rnd(1, 4) : rnd(1, 10), shown = counts(start, step, 4), ans = start + 4 * step;
    s9 = { step, shown, ans };
    $("score9").textContent = "Pattern " + (r9 + 1) + " of " + ROUNDS9;
    $("stairs9").innerHTML = Array.from({ length: 100 }, (_, i) => '<button type="button" data-n="' + (i + 1) + '"' + (shown.includes(i + 1) ? ' class="on"' : "") + ">" + (i + 1) + "</button>").join("");
    $("seq9").textContent = shown.join(", ") + ", ... ?";
    say(shown.join(", ") + ". Tap the next number in the pattern.");
  }
  $("stairs9").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || lock9) return; lock9 = true; const n = Number(b.dataset.n), ok = n === s9.ans;
    const want = $("stairs9").querySelector('[data-n="' + s9.ans + '"]'); if (want) want.classList.add("right");
    if (!ok) b.classList.add("wrong"); else right9++;
    const w = s9.step === 10 ? "ten, one row down" : s9.step === 5 ? "five" : "two";
    const why = "It goes up by " + w + ": " + s9.shown[3] + " + " + s9.step + " = " + s9.ans + ".";
    $("fb9").className = "fb " + (ok ? "good" : "bad"); $("fb9").textContent = (ok ? cheer() + " " : "") + why; say((ok ? cheer() + " " : "") + why);
    r9++; setTimeout(round9, 2600);
  });
  round9();
""")
    s = check_items(s, [
        '{ q: "In the pattern ABB ABB ABB, how long is the part that repeats?", opts: [3, 2, 9], a: 3, why: "A, B, B is three shapes, and then it starts again." }',
        '{ q: "Circle, square, circle, square, circle… what comes next?", opts: ["square", "circle", "triangle"], a: "square", why: "Circle and square take turns, so after a circle comes a square." }',
        '{ q: "10, 20, 30, 40… how does it go up?", opts: ["up in tens", "up in twos", "up in fives"], a: "up in tens", why: "Each number is 10 more than the one before." }',
        '{ q: "2, 4, 6, ?, 10. What is missing?", opts: [8, 7, 9], a: 8, why: "It goes up in twos: 6 + 2 = 8." }',
        '{ q: "5, 10, 15, 20… what comes next?", opts: [25, 30, 21], a: 25, why: "It goes up in fives: 20 + 5 = 25." }',
        '{ q: "Start at 37 and count on in tens: 37, 47, 57… what comes next?", opts: [67, 58, 77], a: 67, why: "Counting on in tens adds 10 each time: 57 + 10 = 67." }',
        '{ q: "Count back in twos: 30, 28, 26… what comes next?", opts: [24, 25, 22], a: 24, why: "Counting back in twos takes 2 away each time: 26 − 2 = 24." }',
        '{ q: "On a hundred square, 3, 13, 23 are coloured. What comes next?", opts: [33, 24, 30], a: 33, why: "Each one is 10 more, one row down: 23 + 10 = 33." }',
        '{ q: "Which is a repeating pattern?", opts: ["AB AB AB", "1, 2, 3, 4", "5, 10, 15, 20"], a: "AB AB AB", why: "A repeating pattern has a part that comes round again; the number patterns keep going up." }',
        '{ q: "Count back in fives from 50: 50, 45, 40… what comes next?", opts: [35, 30, 39], a: 35, why: "Counting back in fives takes 5 away each time: 40 − 5 = 35." }',
    ])
    s = stickers(s, [('["📶", "Growing patterns"]', '["👣", "Counting on in steps"]'), ('["🔎", "Find the rule"]', '["📈", "How it goes up"]'),
                     ('["🔮", "Predict far ahead"]', '["⏪", "Counting back"]'), ('["📉", "Shrinking patterns"]', '["💯", "Hundred square patterns"]')])
    return s


# ============================================================ Coins and Change
def coins(s):
    s = sub(s, "const MONEY = [1, 5, 10, 20, 50, 100, 200, 500, 1000];",
            "/* Stage 2 numbers stop at 100, so the notes stop there too (was 200, 500, 1000). */\n  const MONEY = [1, 5, 10, 20, 50, 100];")
    s = sub(s, "const PURSES = [[50, 20, 10, 5], [100, 50, 20, 20, 10], [20, 20, 10, 5, 5], [200, 100, 50, 10], [100, 100, 50, 20, 5]];",
            "const PURSES = [[50, 20, 10, 5], [50, 20, 20, 5], [20, 20, 10, 5, 5], [50, 10, 10, 5, 1], [20, 10, 5, 5, 1]];")
    s = sub(s, "const BUILD = { 3: { targets: [75, 130, 240], set: [1, 5, 10, 20, 50, 100], fewest: false }, 4: { targets: [180, 265, 340], set: [5, 10, 20, 50, 100, 200], fewest: true } };",
            "const BUILD = { 3: { targets: [35, 60, 85], set: [1, 5, 10, 20, 50], fewest: false }, 4: { targets: [45, 70, 95], set: [1, 5, 10, 20, 50], fewest: true } };")
    s = sub(s, s[s.index("  const ITEMS = [["):s.index("\n", s.index("  const ITEMS = [["))],
            '  /* prices within 100 whose digits never carry when two or three are added (2Ni.04: no regrouping) */\n'
            '  const ITEMS = [["✏️", "a pencil", 20], ["🍌", "a banana", 11], ["🥚", "an egg", 12], ["🧃", "a juice", 23], ["🍞", "a loaf", 42], ["🧼", "a bar of soap", 30], ["🍎", "an apple", 14], ["📒", "a notebook", 51], ["🥕", "a carrot", 10], ["🍊", "an orange", 13]];\n'
            '  const noCarry = (list) => list.reduce((a, it) => a + (it[2] % 10), 0) < 10 && list.reduce((a, it) => a + Math.floor(it[2] / 10), 0) < 10;')
    s = sub(s, "basket5 = shuffle(ITEMS).slice(0, b5 < 2 ? 2 : 3);", "do { basket5 = shuffle(ITEMS).slice(0, b5 < 2 ? 2 : 3); } while (!noCarry(basket5));")
    # ---- 6: how much more? ----
    s = section(s, "Change is what comes back.", """
    <section class="slide" data-say="You have some money, but not enough. Count on from what you have up to the price. The hops show how much more you need.">
      <div class="slide-head"><span class="n">6</span><h2>How much more?</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say6">Count <b>on</b> from what you have up to the price. The hops show how much <b>more</b> you need.</span></div>
      <div class="stage">
        <p class="fb" id="q6" style="font-size:20px"></p>
        <div class="timeline" id="line6"></div>
        <div class="total" id="now6"></div>
        <div class="bigbtns"><button type="button" class="big small" id="a1">+ 1</button><button type="button" class="big small" id="a5">+ 5</button><button type="button" class="big small teal" id="a10">+ 10</button><button type="button" class="big small teal" id="a50">+ 50</button><button type="button" class="big ghost small" id="undo6">↩ Undo</button><button type="button" class="big small" id="next6" hidden>Next one ▶</button></div>
        <p class="fb" id="fb6"></p>
        <p class="fb small-fb" id="score6"></p>
      </div>
    </section>""")
    s = sub(s, "  /* ---- 6: change ---- */\n  const HOPS = [[\"a1\", 1], [\"a5\", 5], [\"a10\", 10], [\"a50\", 50], [\"a100\", 100]];\n  const CHANGE = [[65, 100], [130, 200], [45, 100], [340, 500]];",
            "  /* ---- 6: how much more do you need? (0096 2Ni.03, 2Ni.04) ----\n     Was 'Counting the change' up to 500 sh: giving change is 3Nm.02 and the\n     numbers ran past 100. The same count-on line now finds how much MORE is\n     needed - a complement, counting on from a multiple of 10 or within 20. */\n  const HOPS = [[\"a1\", 1], [\"a5\", 5], [\"a10\", 10], [\"a50\", 50]];\n  const CHANGE = [[60, 100], [30, 80], [13, 20], [40, 70]];")
    s = sub(s, "$(\"now6\").innerHTML = \"You are on <b>\" + sh(at6) + \"</b> · change so far <b>\" + sh(at6 - price) + \"</b>\";",
            "$(\"now6\").innerHTML = \"You are on <b>\" + sh(at6) + \"</b> · more so far <b>\" + sh(at6 - price) + \"</b>\";")
    s = sub(s, "$(\"fb6\").textContent = \"You counted the change \" + right6 + \" times!\"; $(\"score6\").textContent = \"\"; finish(5, \"You can count change.\");",
            "$(\"fb6\").textContent = \"You found how much more \" + right6 + \" times!\"; $(\"score6\").textContent = \"\"; finish(5, \"You can find how much more you need.\");")
    s = sub(s, "const q = \"It costs \" + sh(price) + \" and you pay with \" + sh(paid) + \". Count on to \" + sh(paid) + \".\";",
            "const q = \"You have \" + sh(price) + \". It costs \" + sh(paid) + \". Count on to \" + sh(paid) + \".\";")
    s = sub(s, "$(\"fb6\").textContent = cheer() + \" \" + hops6.join(\" + \") + \" = \" + sh(change) + \" change.\";\n    say(cheer() + \" Your change is \" + change + \" shillings\");",
            "$(\"fb6\").textContent = cheer() + \" \" + hops6.join(\" + \") + \" = \" + sh(change) + \". You need \" + sh(change) + \" more.\";\n    say(cheer() + \" You need \" + change + \" shillings more\");")
    # ---- 7: writing money ----
    s = section(s, "One shilling is one hundred cents.", """
    <section class="slide" data-say="Money has its own way of writing. Forty-five shillings can be written 45 sh, or KSh 45. Both mean the same.">
      <div class="slide-head"><span class="n">7</span><h2>Writing money</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say7"><b>45 sh</b> and <b>KSh 45</b> both mean forty-five shillings. Tap the one that matches.</span></div>
      <div class="stage">
        <div class="swap"><span class="box" id="from7"></span><span class="eq">=</span><span class="box" id="to7">?</span></div>
        <div class="choices" id="ch7"></div>
        <p class="fb" id="fb7"></p>
        <p class="fb small-fb" id="score7"></p>
      </div>
    </section>""")
    s = block(s, "/* ---- 7: shillings and cents ---- */", "/* ---- 8: which purse is worth more", r"""
  /* ---- 7: writing money (0096 2Nm.01) ----
     Was 'Shillings and cents': 250 cents as '2 sh 50 c' is money notation of
     the kind 3Nm.01 introduces, and the numbers ran past 100. 2Nm.01 is
     'recognise value and money notation used in local currency' - so: the same
     amount written the shop way (KSh 45), the short way (45 sh) and in words. */
  const ONES7 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const TENS7 = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const words7 = (n) => (n < 20 ? ONES7[n] : n === 100 ? "one hundred" : TENS7[Math.floor(n / 10)] + (n % 10 ? "-" + ONES7[n % 10] : ""));
  const swap7 = (n) => (n % 10 && Math.floor(n / 10) ? (n % 10) * 10 + Math.floor(n / 10) : n + 10);
  const AMOUNTS7 = [45, 20, 75, 50, 12, 90, 36, 64];
  let c7 = 0, right7 = 0, lock7 = false, list7 = [], q7 = null;
  function round7() {
    lock7 = false; $("fb7").textContent = ""; $("fb7").className = "fb"; $("to7").textContent = "?";
    if (c7 === 0) list7 = shuffle(AMOUNTS7).slice(0, 5);
    if (c7 >= list7.length) { $("from7").textContent = ""; $("to7").textContent = ""; $("ch7").innerHTML = ""; $("fb7").className = "fb good"; $("fb7").textContent = "You matched " + right7 + " of " + list7.length + "!"; $("score7").textContent = ""; finish(6, "You can read and write money."); return; }
    const n = list7[c7], kind = c7 % 3;
    if (kind === 0) q7 = { from: words7(n) + " shillings", a: sh(n), opts: [sh(n), sh(swap7(n)), sh(n * 10 > 100 ? n + 5 : n * 10)] };
    else if (kind === 1) q7 = { from: "KSh " + n, a: sh(n), opts: [sh(n), sh(swap7(n)), sh(n + 5)] };
    else q7 = { from: sh(n), a: words7(n) + " shillings", opts: [words7(n) + " shillings", words7(swap7(n)) + " shillings", words7(n + 5 > 100 ? n - 5 : n + 5) + " shillings"] };
    q7.n = n;
    $("score7").textContent = "Match " + (c7 + 1) + " of " + list7.length;
    $("from7").textContent = q7.from;
    choices($("ch7"), q7.opts, true);
    const q = "Which one means " + q7.from + "?";
    $("say7").textContent = q; say(q);
  }
  $("ch7").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock7) return; lock7 = true;
    const ok = b.dataset.v === q7.a; reveal($("ch7"), q7.a, b); $("to7").textContent = q7.a;
    if (ok) right7++;
    $("fb7").className = "fb " + (ok ? "good" : "bad");
    $("fb7").textContent = (ok ? cheer() + " " : "It is " + q7.a + ". ") + "KSh " + q7.n + ", " + sh(q7.n) + " and " + words7(q7.n) + " shillings all mean the same money.";
    say(ok ? cheer() + " " + q7.a : "It is " + q7.a);
    c7++; setTimeout(round7, 3200);
  });
  round7();
""")
    s = sub(s, "    { a: [50, 50], b: [100, 20] },", "    { a: [50, 20, 10], b: [50, 5, 5, 10] },")
    s = block(s, "/* ---- 9: saving and spending ---- */", "function round9() {", r"""
  /* ---- 9: saving and spending ----
     Was up to 280 sh and 'how many weeks' by division: numbers past 100 and
     dividing are both beyond Stage 2. Saving is now repeated addition of 5s and
     10s (2Ni.05, 2Ni.07); spending takes one price away with no regrouping. */
  let s9 = 0, right9 = 0, lock9 = false, q9 = null;
  function make9(i) {
    if (i % 2 === 0) {
      const perWeek = [5, 10][rnd(0, 1)], weeks = rnd(3, perWeek === 5 ? 10 : 9), total = perWeek * weeks;
      return { q: "You save " + sh(perWeek) + " every week. How much do you have after " + weeks + " weeks?", a: sh(total), opts: [sh(total), sh(total + perWeek), sh(total - perWeek)],
        work: [{ k: "Each week", v: sh(perWeek) }, { k: weeks + " lots of " + perWeek, v: "= " + sh(total) }, { k: "Saved", v: sh(total), total: true }],
        why: "Each week adds " + sh(perWeek) + ", so " + weeks + " weeks is " + weeks + " lots of " + perWeek + ": " + sh(total) + "." };
    }
    let start, it;
    do { start = rnd(5, 9) * 10 + rnd(3, 9); it = ITEMS[rnd(0, ITEMS.length - 1)]; } while (it[2] % 10 > start % 10 || Math.floor(it[2] / 10) >= Math.floor(start / 10));
    const left = start - it[2];
    return { q: "You have " + sh(start) + ". You buy " + it[1] + " for " + sh(it[2]) + ". How much is left?", a: sh(left), opts: [sh(left), sh(left + 10), sh(start + it[2] > 100 ? left - 1 : start + it[2])],
      work: [{ k: "You had", v: sh(start) }, { k: start + " − " + it[2], v: "= " + sh(left) }, { k: "Left", v: sh(left), total: true }],
      why: start + " − " + it[2] + " = " + left + ": take away the tens, then the ones." };
  }
""")
    s = check_items(s, [
        '{ q: "How do we write forty shillings?", opts: ["40 sh", "4 sh", "400 sh"], a: "40 sh", why: "Forty is 4 tens, written 40, so forty shillings is 40 sh." }',
        '{ q: "A 50 and a 20 and a 10. How much altogether?", opts: ["80 sh", "70 sh", "90 sh"], a: "80 sh", why: "Start with the biggest: 50, then 70, then 80." }',
        '{ q: "Which is the fewest pieces for 70 sh?", opts: ["50 + 20", "20 + 20 + 20 + 10", "10 + 10 + 10 + 10 + 10 + 10 + 10"], a: "50 + 20", why: "Take the biggest that fits: 50, then 20 makes 70 with just 2 pieces." }',
        '{ q: "A juice is 45 sh and a bun is 30 sh. Total?", opts: ["75 sh", "65 sh", "85 sh"], a: "75 sh", why: "45 + 30: 4 tens and 3 tens make 7 tens, and 5 ones, so 75 sh." }',
        '{ q: "You have 60 sh. A ball costs 100 sh. How much more do you need?", opts: ["40 sh", "60 sh", "160 sh"], a: "40 sh", why: "Count on from 60 to 100 in tens: 70, 80, 90, 100 is 4 tens, 40 sh." }',
        '{ q: "KSh 25 is the same as…", opts: ["25 sh", "250 sh", "2 sh"], a: "25 sh", why: "KSh 25 and 25 sh are two ways of writing twenty-five shillings." }',
        '{ q: "A mango is 10 sh. How much for 3 mangoes?", opts: ["30 sh", "13 sh", "20 sh"], a: "30 sh", why: "3 lots of 10 is 30." }',
        '{ q: "Which is worth more: 20 sh + 20 sh + 5 sh, or one 50 sh note?", opts: ["the 50 sh note", "the three coins", "the same"], a: "the 50 sh note", why: "The coins make 45 sh, and 50 is more than 45." }',
        '{ q: "You save 10 sh a week. After 5 weeks you have…", opts: ["50 sh", "15 sh", "40 sh"], a: "50 sh", why: "5 lots of 10 is 50." }',
        '{ q: "You have 80 sh and spend 30 sh. What is left?", opts: ["50 sh", "110 sh", "60 sh"], a: "50 sh", why: "8 tens take away 3 tens leaves 5 tens: 50 sh." }',
    ])
    s = stickers(s, [('["🪙", "Coins and notes"]', '["💰", "Coins and notes"]'), ('["↩️", "Counting change"]', '["➕", "How much more"]'),
                     ('["💯", "Shillings and cents"]', '["✍️", "Writing money"]')])
    return s


# ============================================================ How Much, How Long
def how_much(s):
    s = css(s, "\n  /* " + MARK + ": How Much, How Long - the ribbon to estimate */\n  .rib9 { width: 100%; max-width: 440px; display: block; margin: 6px auto; }\n")
    s = sub(s, '<section class="slide" data-say="Which unit would you use? Centimetres for small things, metres for rooms, kilometres for journeys.">',
            '<section class="slide" data-say="Which unit would you use? Centimetres for small things, metres for big things like a room.">')
    s = sub(s, s[s.index("  const UNITS = ["):s.index("  let units4 = shuffle(UNITS)")],
            '  /* Stage 2 lengths are centimetres and metres (km is 3Gg.02; mm is in no Stage 1-3 objective). */\n'
            '  const UNITS = [\n'
            '    { ic: "✏️", t: "the length of a pencil", a: "cm", why: "A pencil is about 15 cm. Centimetres are for small things." },\n'
            '    { ic: "🚪", t: "the height of a door", a: "m", why: "A door is about 2 m tall. Metres are for big things." },\n'
            '    { ic: "👟", t: "the length of your shoe", a: "cm", why: "A shoe is about 20 cm. Centimetres are for small things." },\n'
            '    { ic: "🏫", t: "the length of the classroom", a: "m", why: "A classroom is several metres long. Metres are for big things." },\n'
            '    { ic: "🍎", t: "the mass of an apple", a: "g", why: "An apple is light, so grams." },\n'
            '    { ic: "🎒", t: "the mass of a school bag", a: "kg", why: "A bag full of books is heavy, so kilograms." },\n'
            '    { ic: "🥄", t: "the medicine in a spoon", a: "ml", why: "A spoonful is a tiny amount, so millilitres." },\n'
            '    { ic: "🚿", t: "the water in a bath", a: "l", why: "A bath holds a lot of water, so litres." },\n'
            '  ];\n')
    s = sub(s, "const UNAME = { mm: \"millimetres\", cm: \"centimetres\", m: \"metres\", km: \"kilometres\", g: \"grams\", kg: \"kilograms\", ml: \"millilitres\", l: \"litres\" };",
            "const UNAME = { cm: \"centimetres\", m: \"metres\", g: \"grams\", kg: \"kilograms\", ml: \"millilitres\", l: \"litres\" };")
    s = sub(s, "const family = [\"mm\", \"cm\", \"m\", \"km\"].includes(U.a) ? [\"mm\", \"cm\", \"m\", \"km\"] : [\"g\", \"kg\"].includes(U.a) ? [\"g\", \"kg\", \"ml\"] : [\"ml\", \"l\", \"g\"];\n    const opts = shuffle([U.a, ...shuffle(family.filter((f) => f !== U.a)).slice(0, 2)]);",
            "const pair = [\"cm\", \"m\"].includes(U.a) ? [\"cm\", \"m\"] : [\"g\", \"kg\"].includes(U.a) ? [\"g\", \"kg\"] : [\"ml\", \"l\"];\n    const other = [\"cm\", \"kg\", \"l\"].filter((f) => !pair.includes(f))[rnd(0, 1)];\n    const opts = shuffle(pair.concat([other]));")
    # ---- 6: kitchen scale, in grams ----
    s = sub(s, '<section class="slide" data-say="Read the kitchen scale. Each small mark is one hundred grams. One thousand grams make one kilogram.">',
            '<section class="slide" data-say="Read the kitchen scale. Each mark is one hundred grams. Read the number the needle points to.">')
    s = sub(s, "<h2>Grams and kilograms</h2>", "<h2>Reading a kitchen scale</h2>")
    s = sub(s, "<span id=\"say6\">Each small mark is <b>100 g</b>. <b>1000 g</b> make <b>1 kg</b>. What does the needle say?</span>",
            "<span id=\"say6\">Each mark is <b>100 g</b>. What does the needle say?</span>")
    s = sub(s, "g6 = rnd(1, 10) * 100; drawDial(g6);", "g6 = rnd(1, 9) * 100; drawDial(g6);")
    s = sub(s, "    const asKg = g6 % 500 === 0 && r6 >= 3;\n", "    const asKg = false; /* 1000 g = 1 kg is 3Gg.06 */\n")
    s = sub(s, "finish(5, \"You can read a scale in grams and kilograms.\")", "finish(5, \"You can read a kitchen scale.\")")
    s = sub(s, "const why = isKg ? \"1000 g is 1 kg, so \" + g6 + \" g is \" + ans + \" kg.\" : \"The needle points to \" + g6 + \" g\" + (g6 === 1000 ? \", which is 1 kg\" : \"\") + \".\";",
            "const why = \"The needle points to \" + g6 + \" g.\";")
    # ---- 7: the jug, in millilitres ----
    s = sub(s, "<h2>Millilitres and litres</h2>", "<h2>Reading a jug</h2>")
    s = sub(s, "<span id=\"say7\">Each mark is <b>100 ml</b>. <b>1000 ml</b> make <b>1 litre</b>. Pour, then read the level.</span>",
            "<span id=\"say7\">Each mark is <b>100 ml</b>. Pour, then read the level.</span>")
    s = sub(s, "'\">' + i * 100 + (i === 10 ? \" ml = 1 l\" : \" ml\") + \"</text>\"", "'\">' + i * 100 + \" ml</text>\"")
    s = sub(s, "$(\"level7\").textContent = ml7 + \" ml\" + (ml7 === 1000 ? \" — that is 1 litre, and the jug is full\" : ml7 === 500 ? \" — that is half a litre\" : \"\");",
            "$(\"level7\").textContent = ml7 + \" ml\" + (ml7 === 1000 ? \" — the jug is full\" : \"\");")
    s = sub(s, "const kind = right7 % 3;", "const kind = right7 % 2; /* pour or read; '1 litre is 1000 ml' is 3Gg.07 */")
    s = sub(s, "const why = quiz7.task === \"convert\" ? \"1 litre is 1000 ml.\" : \"The water reaches the \" + quiz7.a + \" ml mark.\";",
            "const why = \"The water reaches the \" + quiz7.a + \" ml mark.\";")
    s = sub(s, "finish(6, \"You can measure liquid!\"); setTimeout(ask7, 2000);", "finish(6, \"You can measure liquid!\"); setTimeout(ask7, 2000);")
    # ---- 8: which holds more?  9: estimate, then measure ----
    s = section(s, "How long does it take? Count on from the start time", """
    <section class="slide" data-say="Which holds more? Fill each one with cups of water and count the cups. The one that takes more cups holds more.">
      <div class="slide-head"><span class="n">8</span><h2>Which holds more?</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say8">Fill them with <b>cups</b> of water and count. The one that takes <b>more cups</b> holds more.</span></div>
      <div class="stage">
        <div class="clockpair" id="clocks8"></div>
        <div class="bigbtns"><button type="button" class="big teal" id="fill8">Fill them with cups</button></div>
        <div class="choices" id="ch8"></div>
        <p class="fb" id="fb8"></p>
        <p class="fb small-fb" id="score8"></p>
      </div>
    </section>""")
    s = section(s, "A calendar shows the days of a month.", """
    <section class="slide" data-say="Guess first, then measure. A good guess is close to the real length.">
      <div class="slide-head"><span class="n">9</span><h2>Estimate, then measure</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button><span id="say9">Look at the ribbon. <b>Guess</b> how long it is, then the ruler will <b>measure</b> it.</span></div>
      <div class="stage">
        <svg class="rib9" id="cal9" viewBox="0 0 340 110" role="img" aria-label="A ribbon to measure"></svg>
        <p class="fb" id="calname9" style="font-size:21px"></p>
        <div class="choices" id="ch9"></div>
        <p class="fb" id="fb9"></p>
        <p class="fb small-fb" id="score9"></p>
      </div>
    </section>""")
    s = block(s, "/* ---- 8: how long does it take ---- */", "function choices(el, opts, wordy)", r"""
  /* ---- 8: which holds more? capacity with non-standard units (0096 2Gg.07) ----
     Was 'How long does it take?': finding a time interval is 3Gt.04 - and its
     README said intervals had gone. Pairs are chosen so the taller one does
     not always hold more: counting cups is the point, not looking. */
  const JARS8 = [["jug", 6, 70, 90], ["bottle", 4, 34, 118], ["pot", 9, 110, 70], ["vase", 5, 44, 116], ["bowl", 3, 112, 34], ["bucket", 8, 88, 92]];
  let r8 = 0, right8 = 0, lock8 = false, q8 = null; const ROUNDS8 = 4;
  function jar8(j, cups) {
    let cupRow = "";
    if (cups) for (let i = 0; i < j[1]; i++) cupRow += '<rect x="' + (6 + (i % 5) * 22) + '" y="' + (140 + Math.floor(i / 5) * 22) + '" width="16" height="16" rx="4" fill="var(--teal)"></rect>';
    return '<div><svg viewBox="0 0 120 190" width="120" height="190" role="img" aria-label="the ' + j[0] + '"><rect x="' + ((120 - j[2]) / 2).toFixed(0) + '" y="' + (128 - j[3]) + '" width="' + j[2] + '" height="' + j[3] + '" rx="10" fill="var(--teal-soft)" stroke="var(--ink)" stroke-width="3"></rect>' + cupRow + '</svg><div class="clocklab">the ' + j[0] + (cups ? " · " + j[1] + " cups" : "") + "</div></div>";
  }
  function round8() {
    lock8 = false; $("fb8").textContent = ""; $("fb8").className = "fb"; $("ch8").innerHTML = "";
    if (r8 >= ROUNDS8) { $("clocks8").innerHTML = ""; $("fill8").hidden = true; $("fb8").className = "fb good"; $("fb8").textContent = "You compared " + right8 + " of " + ROUNDS8 + " pairs!"; finish(7, "You can find which holds more."); return; }
    let a, b; do { [a, b] = shuffle(JARS8).slice(0, 2); } while (a[1] === b[1]);
    q8 = { a, b, more: a[1] > b[1] ? a : b, diff: Math.abs(a[1] - b[1]), filled: false };
    $("score8").textContent = "Pair " + (r8 + 1) + " of " + ROUNDS8;
    $("clocks8").innerHTML = jar8(a, false) + jar8(b, false); $("fill8").hidden = false;
    $("say8").innerHTML = "Which holds more, the <b>" + a[0] + "</b> or the <b>" + b[0] + "</b>? Fill them with cups to find out.";
    say("Which holds more, the " + a[0] + " or the " + b[0] + "? Fill them with cups to find out.");
  }
  $("fill8").addEventListener("click", () => {
    if (!q8 || q8.filled) return; q8.filled = true; $("fill8").hidden = true;
    $("clocks8").innerHTML = jar8(q8.a, true) + jar8(q8.b, true);
    $("ch8").innerHTML = shuffle([q8.a[0], q8.b[0]]).map((v) => '<button type="button" class="choice word" data-v="' + v + '">the ' + v + "</button>").join("");
    say("The " + q8.a[0] + " took " + q8.a[1] + " cups. The " + q8.b[0] + " took " + q8.b[1] + ". Which holds more?");
  });
  $("ch8").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock8) return; lock8 = true; const ok = b.dataset.v === q8.more[0];
    $("ch8").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.v === q8.more[0]) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right8++;
    const why = "The " + q8.more[0] + " took " + q8.more[1] + " cups, " + q8.diff + " more, so it holds more" + (q8.more[3] < Math.max(q8.a[3], q8.b[3]) ? " - even though it is not the taller one." : ".");
    $("fb8").className = "fb " + (ok ? "good" : "bad"); $("fb8").textContent = (ok ? cheer() + " " : "") + why; say((ok ? cheer() + " " : "") + why);
    r8++; setTimeout(round8, 3200);
  });
  round8();

  /* ---- 9: estimate, then measure (0096 2Gg.03) ----
     Was a calendar step, which Half Past, Quarter To already teaches. 2Gg.03
     asks the child to ESTIMATE and measure lengths; Grade 2 measured and never
     estimated. The closest guess is the right one; the ruler then shows why. */
  let r9 = 0, right9 = 0, lock9 = false, len9 = 0, est9 = 0; const ROUNDS9 = 5;
  function ribbon9(len, withRuler) {
    const u = 20, x0 = 10;
    let svg = '<rect x="' + x0 + '" y="22" width="' + len * u + '" height="18" rx="4" fill="var(--plum)"></rect>';
    if (withRuler) {
      svg += '<rect x="' + x0 + '" y="54" width="' + 16 * u + '" height="40" rx="4" fill="var(--gold-soft)" stroke="var(--ink)" stroke-width="1.5"></rect>';
      for (let i = 0; i <= 16; i++) svg += '<line x1="' + (x0 + i * u) + '" y1="54" x2="' + (x0 + i * u) + '" y2="' + (i % 5 === 0 ? 70 : 64) + '" stroke="var(--ink)" stroke-width="1.5"></line><text x="' + (x0 + i * u) + '" y="86" text-anchor="middle" font-size="11" fill="var(--ink)">' + i + "</text>";
      svg += '<line x1="' + (x0 + len * u) + '" y1="18" x2="' + (x0 + len * u) + '" y2="58" stroke="var(--bad)" stroke-width="2" stroke-dasharray="4 3"></line>';
    }
    $("cal9").innerHTML = svg;
  }
  function round9() {
    lock9 = false; $("fb9").textContent = ""; $("fb9").className = "fb";
    if (r9 >= ROUNDS9) { $("cal9").innerHTML = ""; $("calname9").textContent = ""; $("ch9").innerHTML = ""; $("fb9").className = "fb good"; $("fb9").textContent = "You made " + right9 + " good guesses out of " + ROUNDS9 + "!"; finish(8, "You can estimate, then measure."); return; }
    len9 = rnd(3, 15); est9 = Math.max(2, len9 + [-1, 0, 1][rnd(0, 2)]);
    const far = [est9 + 7 <= 16 ? est9 + 7 : est9 - 7, est9 >= 9 ? est9 - 6 : est9 + 5].filter((v, i, a) => v > 0 && v !== est9 && a.indexOf(v) === i);
    $("score9").textContent = "Ribbon " + (r9 + 1) + " of " + ROUNDS9;
    ribbon9(len9, false);
    $("calname9").textContent = "About how long is the ribbon?";
    $("ch9").innerHTML = shuffle([est9].concat(far)).map((v) => '<button type="button" class="choice word" data-v="' + v + '">about ' + v + " cm</button>").join("");
    say("About how long is the ribbon? Guess first.");
  }
  $("ch9").addEventListener("click", (e) => {
    const b = e.target.closest(".choice"); if (!b || lock9) return; lock9 = true; const ok = Number(b.dataset.v) === est9;
    $("ch9").querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (Number(c.dataset.v) === est9) c.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); else right9++;
    ribbon9(len9, true);
    const why = "The ruler says " + len9 + " cm, so 'about " + est9 + " cm' was the closest guess.";
    $("fb9").className = "fb " + (ok ? "good" : "bad"); $("fb9").textContent = (ok ? cheer() + " " : "") + why; say((ok ? cheer() + " " : "") + why);
    r9++; setTimeout(round9, 3000);
  });
  round9();


  """)
    s = check_items(s, [
        '{ q: "Which unit would you use for the length of a pencil?", opts: ["cm", "m", "kg"], a: "cm", why: "A pencil is small, so centimetres." }',
        '{ q: "An object goes from 2 cm to 9 cm on a ruler. How long is it?", opts: ["7 cm", "9 cm", "11 cm"], a: "7 cm", why: "It did not start at 0, so count the centimetres from 2 to 9: 7 cm." }',
        '{ q: "The needle on a kitchen scale points to 300. It is showing…", opts: ["300 g", "3 g", "30 g"], a: "300 g", why: "The scale counts in grams, and the needle is on 300." }',
        '{ q: "Each mark on a jug is 100 ml. The water is at the 4th mark. How much water?", opts: ["400 ml", "4 ml", "40 ml"], a: "400 ml", why: "4 marks of 100 ml is 400 ml." }',
        '{ q: "Which unit would you use for the water in a bath?", opts: ["l", "cm", "g"], a: "l", why: "A bath holds a lot of water, so litres." }',
        '{ q: "A balance tips down on the left. The left side is…", opts: ["heavier", "lighter", "the same"], a: "heavier", why: "The heavier side goes down." }',
        '{ q: "The jug takes 6 cups of water. The bottle takes 4. Which holds more?", opts: ["the jug", "the bottle", "the same"], a: "the jug", why: "6 cups is more than 4 cups." }',
        '{ q: "You measure a book with cubes. Why must the cubes be the same size?", opts: ["so the count is fair", "so it looks nice", "so it is quicker"], a: "so the count is fair", why: "If the cubes are different sizes, the same book gives different counts." }',
        '{ q: "A pencil is 15 cm long. A crayon is 9 cm long. Which is longer?", opts: ["the pencil", "the crayon", "the same"], a: "the pencil", why: "15 cm is more than 9 cm." }',
        '{ q: "A scale goes 0, 10, 20 with one unmarked line halfway between each. What is the line between 10 and 20?", opts: [15, 11, 12], a: 15, why: "Halfway between 10 and 20 is 15." }',
    ])
    s = stickers(s, [('["🍎", "Grams and kilograms"]', '["🍎", "Reading a kitchen scale"]'), ('["🥤", "Millilitres and litres"]', '["🥤", "Reading a jug"]'),
                     ('["⏱️", "How long it takes"]', '["🥛", "Which holds more"]'), ('["📅", "Days and months"]', '["🎯", "Estimate, then measure"]')])
    return s


# ============================================================ Fair Shares
def fair_shares(s):
    s = sub(s, "const d = [2, 3, 4, 6][rnd(0, 3)], w = rnd(1, 2), rest = rnd(1, d - 1);",
            "const d = [2, 4][rnd(0, 1)], w = rnd(1, 2), rest = rnd(1, d - 1); /* halves and quarters only: NAMES has no thirds or sixths, and those are 3Nf - drawing them crashed the page */")
    s = sub(s, "<h2>Adding and taking away</h2>", "<h2>Putting parts together</h2>")
    s = sub(s, "/* ---- 7: adding and taking away ---- */", "/* ---- 7: putting parts together (0096 2Nf.06) - adding only; taking fractions away is 3Nf.07 ---- */")
    s = sub(s, "finish(6, \"You can add and take away fractions.\")", "finish(6, \"You can put quarters and halves together.\")")
    s = sub(s, "const add = r7 % 2 === 0, d = 4;", "const add = true, d = 4;")
    s = sub(s, "if (add) { a = rnd(1, d - 2); b = rnd(1, d - a - 1) || 1; } else { a = rnd(2, d); b = rnd(1, a - 1); }",
            "a = rnd(1, d - 1); b = rnd(1, d - a);")
    s = sub(s, "    { q: \"A class has 24 learners. Three quarters walk to school. How many walk?\", a: \"18\", opts: [\"18\", \"6\", \"12\"], w: [\"24 ÷ 4 = 6 in one quarter, and 3 × 6 = 18.\", \"6 is only one quarter.\"] },",
            "    { q: \"A class has 20 learners. Half of them walk to school. How many walk?\", a: \"10\", opts: [\"10\", \"20\", \"5\"], w: [\"Half of 20 is 10.\", \"20 is the whole class, not half of it.\"] },")
    s = sub(s, "    { q: \"A bottle holds 1 litre. Hodan drinks half. How many millilitres are left?\", a: \"500 ml\", opts: [\"500 ml\", \"100 ml\", \"250 ml\"], w: [\"Half of 1000 ml is 500 ml.\", \"Half the bottle is left.\"] },",
            "    { q: \"A jug holds 8 cups of juice. Hodan drinks a quarter of it. How many cups is that?\", a: \"2\", opts: [\"2\", \"4\", \"6\"], w: [\"A quarter of 8 is 8 shared into 4 equal parts: 2.\", \"4 would be half.\"] },")
    s = sub(s, "    { q: \"Three quarters of an hour is how many minutes?\", a: \"45 min\", opts: [\"45 min\", \"30 min\", \"75 min\"], w: [\"An hour is 60 minutes. 60 ÷ 4 = 15, and 3 × 15 = 45.\", \"\"] },",
            "    { q: \"There are 12 eggs. Three quarters of them are brown. How many brown eggs?\", a: \"9\", opts: [\"9\", \"3\", \"6\"], w: [\"A quarter of 12 is 3, so three quarters is 3 + 3 + 3 = 9.\", \"3 is only one quarter.\"] },")
    s = check_items(s, [
        '{ q: "A shape is cut into 4 pieces of different sizes. Is one piece a quarter?", opts: ["no", "yes"], a: "no", why: "Quarters must be 4 EQUAL parts." }',
        '{ q: "In 3/4, what does the 4 tell you?", opts: ["how many equal parts", "how many you take", "the answer"], a: "how many equal parts", why: "The bottom number says how many equal parts the whole is cut into." }',
        '{ q: "What is 1/4 of 12?", opts: [3, 4, 6], a: 3, why: "Share 12 into 4 equal groups: 3 in each." }',
        '{ q: "Which is the same as 1/2?", opts: ["2/4", "1/4", "4/4"], a: "2/4", why: "Two quarters cover the same as one half." }',
        '{ q: "Which is bigger: 1/2 or 1/4?", opts: ["1/2", "1/4"], a: "1/2", why: "Halves are bigger pieces than quarters." }',
        '{ q: "Which is bigger: 3/4 or 2/4?", opts: ["3/4", "2/4"], a: "3/4", why: "Same size pieces, and 3 of them is more than 2." }',
        '{ q: "1/4 + 2/4 = ?", opts: ["3/4", "2/4", "4/4"], a: "3/4", why: "1 quarter and 2 quarters make 3 quarters." }',
        '{ q: "1/2 + 1/4 = ?", opts: ["3/4", "2/6", "1/4"], a: "3/4", why: "A half is 2 quarters, and 2 quarters and 1 quarter make 3 quarters." }',
        '{ q: "How many quarters make one whole?", opts: [4, 2, 8], a: 4, why: "A whole cut into 4 equal parts has 4 quarters." }',
        '{ q: "5 quarters is the same as…", opts: ["1 whole and 1/4", "5 wholes", "1 whole and 1/2"], a: "1 whole and 1/4", why: "4 quarters make 1 whole, and 1 quarter is left over." }',
    ])
    s = stickers(s, [('["➕", "Adding and taking away"]', '["➕", "Putting parts together"]')])
    return s


# ============================================================ Which Way From Here
def which_way(s):
    s = sub(s, "  // compass, clockwise from the top\n  const DIRS = [\"north\", \"east\", \"south\", \"west\"];",
            "  // directions on the page, clockwise from the top. These were north, east,\n  // south and west - cardinal points are 3Gp.01, a stage above. (" + MARK + ")\n  const DIRS = [\"the top\", \"the right\", \"the bottom\", \"the left\"];")
    i = s.index("  const WORD = { north: \"up\"")
    j = s.index("  // one grid renderer for every step that draws a map")
    s = s[:i] + s[j:]
    s = sub(s, "const compassHtml = (mid, eight) => (eight ? [\"NW\", \"N\", \"NE\", \"W\", mid || \"•\", \"E\", \"SW\", \"S\", \"SE\"] : [\"\", \"N\", \"\", \"W\", mid || \"•\", \"E\", \"\", \"S\", \"\"])",
            "const compassHtml = (mid) => [\"\", \"↑\", \"\", \"←\", mid || \"•\", \"→\", \"\", \"↓\", \"\"]")
    s = sub(s, "const legWords = (leg) => sq(leg.n) + \" \" + DIRS[leg.d];", "const legWords = (leg) => sq(leg.n) + \" towards \" + DIRS[leg.d];")
    s = sub(s, "const flipped = legs.map((l) => sq(l.n) + \" \" + DIRS[(l.d + 2) % 4]).join(\", then \");", "const flipped = legs.map((l) => sq(l.n) + \" towards \" + DIRS[(l.d + 2) % 4]).join(\", then \");")
    s = sub(s, "const extra = legs.map((l) => sq(l.n + 1) + \" \" + DIRS[l.d]).join(\", then \");", "const extra = legs.map((l) => sq(l.n + 1) + \" towards \" + DIRS[l.d]).join(\", then \");")
    s = sub(s, "{ q: \"Two quarter turns the same way make…\", opts: [\"a half turn\", \"a full turn\", \"no turn\"], a: \"a half turn\" },",
            "{ q: \"You face the window and make a whole turn. Now you face…\", opts: [\"the window\", \"the door\", \"the floor\"], a: \"the window\" },")
    return s


def which_way_reasons(s):
    return check_items(s, [
        '{ q: "The ball is sitting on top of the box. The ball is…", opts: ["above the box", "below the box", "inside the box"], a: "above the box", why: "On top of something means above it." }',
        '{ q: "The red car is in the middle of the two blue ones. It is…", opts: ["between them", "beside them", "behind them"], a: "between them", why: "In the middle of two things is between them." }',
        '{ q: "<b>Forward</b> means…", opts: ["the way you are facing", "always up the page", "always to the right"], a: "the way you are facing", why: "Forward goes wherever you are facing, so turn first, then go." }',
        '{ q: "You walk to the door, turn round, and walk back. You went…", opts: ["forwards, then backwards", "up, then down", "left, then right"], a: "forwards, then backwards", why: "Turning round and walking back takes you back the way you came." }',
        '{ q: "The robot faces the top of the page and turns <b>right</b>. It now faces…", opts: ["the right of the page", "the left of the page", "the bottom of the page"], a: "the right of the page", why: "A quarter turn right from the top faces the right-hand side." }',
        '{ q: "You face the window and make a whole turn. Now you face…", opts: ["the window", "the door", "the floor"], a: "the window", why: "A whole turn goes all the way round, back to where you started." }',
        '{ q: "A reflection in a mirror line is…", opts: ["the same distance the other side", "always further away", "turned upside down"], a: "the same distance the other side", why: "Each point of the shape is copied the same distance away, on the other side of the line." }',
        '{ q: "When a shape is reflected, the reflection is…", opts: ["the same size", "always bigger", "always smaller"], a: "the same size", why: "A mirror flips a shape over; it does not grow or shrink it." }',
    ])


# ============================================================ reasons for the lessons whose checks stay
def tens_reasons(s):
    return check_items(s, [
        '{ q: "How many tens in 47?", opts: [4, 7, 47], a: 4, why: "47 is 4 tens and 7 ones." }',
        '{ q: "Round 63 to the nearest 10.", opts: [60, 70, 65], a: 60, why: "63 is nearer to 60 than to 70." }',
        '{ q: "34 + 25 = ?", opts: [59, 49, 69], a: 59, why: "3 tens + 2 tens = 5 tens, and 4 + 5 = 9 ones: 59." }',
        '{ q: "56 − 20 = ?", opts: [36, 46, 54], a: 36, why: "Take away 2 tens: 5 tens becomes 3 tens, so 36." }',
        '{ q: "4 × 5 = ?", opts: [20, 25, 9], a: 20, why: "4 lots of 5: 5, 10, 15, 20." }',
        '{ q: "12 shared between 3 is ? each", opts: [4, 3, 6], a: 4, why: "Give them out one at a time and each gets 4." }',
        '{ q: "Is 17 odd or even?", opts: ["odd", "even"], a: "odd", why: "Pair them up and one is left over, so 17 is odd." }',
        '{ q: "One more than 59 is ?", opts: [60, 58, 69], a: 60, why: "59 and one more is 6 tens exactly: 60." }',
    ])


def sides_reasons(s):
    return check_items(s, [
        '{ q: "How many sides does a hexagon have?", opts: [6, 5, 8], a: 6, why: "A hexagon has 6 straight sides." }',
        '{ q: "Which shape has no corners?", opts: ["circle", "triangle", "square"], a: "circle", why: "A circle is one curved line with no corners." }',
        '{ q: "A shape with 4 equal sides and 4 square corners is a…", opts: ["square", "rectangle", "pentagon"], a: "square", why: "All four sides the same and square corners: a square." }',
        '{ q: "How many faces does a cube have?", opts: [6, 8, 12], a: 6, why: "A cube has 6 flat faces, like a dice." }',
        '{ q: "Which solid is like a ball?", opts: ["sphere", "cylinder", "cone"], a: "sphere", why: "A sphere is round all over, like a ball." }',
        '{ q: "A line of symmetry means…", opts: ["both halves match", "the shape is big", "it has 4 sides"], a: "both halves match", why: "Fold along it and the two halves fit exactly." }',
        '{ q: "Two quarter turns the same way make…", opts: ["a half turn", "a whole turn", "no turn"], a: "a half turn", why: "A quarter and another quarter make a half turn." }',
        '{ q: "Facing up, you make a half turn. Now you face…", opts: ["down", "left", "up"], a: "down", why: "A half turn faces the opposite way." }',
        '{ q: "Turning <b>clockwise</b> means turning…", opts: ["the way a clock goes", "the way a clock does not go", "upside down"], a: "the way a clock goes", why: "Clockwise is the way the hands of a clock move round." }',
        '{ q: "How many edges does a cube have?", opts: [12, 6, 8], a: 12, why: "4 edges round the top, 4 round the bottom and 4 up the sides: 12." }',
    ])


def half_past_reasons(s):
    return check_items(s, [
        '{ q: "Which hand shows the hour?", opts: ["the short one", "the long one", "both"], a: "the short one", why: "The short hand shows the hour; the long hand shows the minutes." }',
        '{ q: "The long hand points to 6. That is…", opts: ["half past", "quarter past", "o\\u2019clock"], a: "half past", why: "At 6 the long hand has gone half way round." }',
        '{ q: "Quarter to 5 is the same as…", opts: ["4:45", "5:15", "4:15"], a: "4:45", why: "Quarter to 5 is 15 minutes before 5, which is 4:45." }',
        '{ q: "What is 3:20 in words?", opts: ["twenty past three", "twenty to three", "three past twenty"], a: "twenty past three", why: "20 minutes after 3 o\\u2019clock is twenty past three." }',
        '{ q: "The long hand goes all the way round once. How many minutes is that?", opts: [60, 100, 30], a: 60, why: "Once round the clock is an hour, and an hour is 60 minutes." }',
        '{ q: "Which one is the longest?", opts: ["an hour", "a minute", "a second"], a: "an hour", why: "An hour is longer than a minute, and a minute is longer than a second." }',
        '{ q: "Which one is the shortest?", opts: ["a day", "a week", "a month"], a: "a day", why: "A day is shorter than a week, and a week is shorter than a month." }',
        '{ q: "Which month comes after March?", opts: ["April", "February", "May"], a: "April", why: "The months go January, February, March, April…" }',
        '{ q: "The 1st of March is a Monday. What day is the 8th?", opts: ["Monday", "Sunday", "Tuesday"], a: "Monday", why: "7 days later is the same day of the week: one row down on the calendar." }',
    ])


def hub(s):
    s = sub(s, "<p class=\"covers\">Know the coins and notes, count what is in the purse, make an exact amount and then make it with the fewest pieces, work out what a basket costs, count the change, and work out which of two purses is worth more.</p>",
            "<p class=\"covers\">Know the coins and notes, count what is in the purse, make an exact amount and then make it with the fewest pieces, add up a basket, find how much more you need, write money the shop way, and work out which of two purses is worth more.</p>")
    s = sub(s, "<p class=\"covers\">Find the part that repeats and mend a pattern with a hole in it. Then patterns that grow rather than repeat: find the rule, fill the missing number, predict far ahead without drawing it, and make one that shrinks.</p>",
            "<p class=\"covers\">Find the part that repeats and mend a pattern with a hole in it. Then count on and back in ones, twos, fives and tens from any number, say how a number pattern goes up, fill the missing number, and find patterns on the hundred square.</p>")
    i = s.index("<h2>How Much, How Long</h2>")
    a = s.index("<p class=\"covers\">", i); b = s.index("</p>", a) + 4
    s = s[:a] + "<p class=\"covers\">Compare lengths, measure with cubes and then with a ruler, and draw a line to the length you are asked for. Choose the right unit, balance the scales, read a kitchen scale and a measuring jug, find which holds more by counting cups, estimate before you measure, and read a value that falls between the marks.</p>" + s[b:]
    i = s.index("<h2>Count It, Chart It</h2>")
    a = s.index("<p class=\"covers\">", i); b = s.index("</p>", a) + 4
    s = s[:a] + "<p class=\"covers\">Sort things into groups and then two ways at once, keep a tally, read a pictogram, and build and read a block graph. Then toss a coin and spin a spinner to see what happens, run a small survey of the class, and tell a regular pattern from a random one.</p>" + s[b:]
    return s


PLAN = [
    ("count-it-chart-it.html", count_it), ("patterns-that-grow.html", patterns), ("coins-and-change.html", coins),
    ("how-much-how-long.html", how_much), ("fair-shares.html", fair_shares), ("which-way-from-here.html", which_way),
    ("which-way-from-here.html", which_way_reasons), ("tens-and-ones.html", tens_reasons), ("sides-and-corners.html", sides_reasons),
    ("half-past-quarter-to.html", half_past_reasons), ("g2-index.html", hub),
]
files = {}
for f, fn in PLAN:
    if f not in files:
        cur = read(f)
        files[f] = None if MARK in cur else cur
        if files[f] is None:
            print("  already  %s" % f)
    if files[f] is not None:
        files[f] = fn(files[f])
changed = 0
for f, s2 in files.items():
    if s2 is None:
        continue
    if f != "g2-index.html":
        s2 = marker(s2)
    else:
        s2 = s2.replace("</style>", "  /* " + MARK + " */\n</style>", 1)
    if WRITE:
        io.open(os.path.join(HERE, f), "w", encoding="utf-8", newline="").write(s2)
    changed += 1
    print("  %s  %s" % ("changed" if WRITE else "would change", f))
print("\n  %d file(s) %s" % (changed, "changed" if WRITE else "to change - pass --write"))

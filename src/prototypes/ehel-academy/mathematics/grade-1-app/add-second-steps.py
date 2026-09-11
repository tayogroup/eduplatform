# -*- coding: utf-8 -*-
"""A second step for every Stage 1 objective that rested on ONE slide.

    python add-second-steps.py            # report
    python add-second-steps.py --write

AREAS 3 AND 8 OF THE 2026-09-11 RE-VALIDATION. Seventeen of the 36 Stage 1
objectives were taught by exactly one slide each, so a child met them once and
was then tested on them. Each now has a second step, and each second step comes
at the objective from a different side from the first:

  Counting to Twenty       1Nc.02 patterns   1Np.01 zero   1Nc.05 odd/even   1Np.04 ordinals
  Adding and Taking Away   1Ni.02 counting on   1Ni.04 pairs to 10   1Nm.01 coins
  Shapes and Sizes         1Gg.03 faces/edges   1Gg.06 flat/solid   1Gg.07 turning
                           1Gg.02 length   1Gg.04 mass   1Gg.05 capacity
                           1Gg.08 scales   1Gp.01 position
  Days, Months and Clocks  1Gt.01 units of time   1Gt.03 o'clock and half past

Days, Months and Clocks was the thinnest lesson (4 steps for 4 objectives) and
grows to 6.

WHERE THEY GO, AND WHAT IT COSTS. After the lesson's own steps and BEFORE the
check - the owner's choice, 2026-09-11, so every future child practises each
objective twice before the 75% check decides the lesson. Progress records steps
by POSITION (wire-progress.py :: sectionId, "step-" + index), so the check's id
moves: a child who already finished one of these four lessons comes back to find
the check undone and the FIRST new step ticked, because their stored check id
now names it. They redo the check and the new steps after the first. That was
put to the owner before this was written and accepted. The steps are appended
after the lesson's own rather than beside the slide each one follows up, so that
nothing BEFORE the check moves - explorationSteps in app.config.json names steps
by number, and none of those changes.

WHAT MOVES, all of it here and asserted before anything is written:
  - the new slides, each with its `<!-- N  CODE  title -->` comment, so
    annotate-objectives.py finds them already recorded;
  - the check's finish(i), by the number of steps added;
  - STICKERS, one per new step, before "Show what I know";
  - the shelf's "N of M stickers" line, which is now COUNTED from STICKERS. It
    was typed, and typed wrong in all four: the composed lessons kept the total
    of the page each was cut from, so Adding and Taking Away said "3 of 30" on a
    shelf of nine, and Days, Months and Clocks called its child a "shape star".

THE RUNNER, secondStep(), is written once per lesson in the prelude - before the
first `/* ---- N: ---- */` marker, where validate-against-framework.py attributes
nothing to any slide. It is the question-after-question shape Shapes and Sizes'
sequence() has, with two changes a Grade 1 explanation needs:
  - THE CHILD MOVES ON WITH A BUTTON, NOT A TIMER. say() stops whatever is
    playing, so sequence()'s 2.6-second timer cut every explanation off mid-
    sentence and cleared it from the screen; these explain every answer, which
    is the point of them;
  - a step may FLASH its picture behind a Look! button (1Nc.02: seeing how many
    WITHOUT counting is the objective, and a picture that stays up can be
    counted).
It takes ELEMENTS, not ids, so each step's own block names its slide with
$("...") - which is how validate-against-framework.py pairs a block with its
slide, and check-judging.py reads `el: {...}` + `ok:` the way it reads
sequence(). The blocks go AFTER the check's code and before the stickers', so the
check keeps the block it has always belonged to.

EVERY KEY IS WHERE check-answer-keys.py LOOKS: `items: [{ ask, opts: [{ t, ok }],
why }]`, the shape it already harvests.

Guarded by a marker; every anchor must match exactly once or the file is refused.
Written with the Write tool, never a heredoc (backslashes).
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-second-steps"


def ssml(calm, friendly, empathetic, cheerful):
    """The four voices every step's Explain speaks in, exactly as the lessons write them."""
    s = lambda xs: "".join("<s>%s</s>" % x for x in xs)
    return ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'
            % (s(calm), s(friendly), s(empathetic), s(cheerful)))


# ===========================================================================
# THE RUNNER - identical in all four lessons
# ===========================================================================
RUNNER = r'''

  /* ==== ehel-second-steps: the runner - see grade-1-app/add-second-steps.py ====
     Seventeen objectives rested on one slide each. Each now has a second step,
     after the lesson's own steps and before the check. One question after
     another, like sequence() in Shapes and Sizes, except that the child moves on
     with a button: say() stops whatever is playing, so a timer that draws the
     next question cuts the explanation off, and these explain every answer.
     o.flash (ms) shows the picture behind a Look! button, for seeing how many
     without counting. Takes ELEMENTS, so each step's own block names its slide. */
  function secondStep(o) {
    const el = o.el, items = o.items;
    const words = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    let i = 0, right = 0, lock = true;
    function options() {
      el.ch.innerHTML = shuffle(items[i].opts).map((c) => '<button type="button" class="choice' +
        (/^\s*\d+\s*$/.test(c.t) ? "" : " ss-w") + '" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      lock = false;
    }
    function draw() {
      const it = items[i];
      lock = true;
      el.next.hidden = true;
      el.say.innerHTML = it.ask;
      el.fb.className = "fb"; el.fb.textContent = "";
      el.score.textContent = (o.label || "Question") + " " + (i + 1) + " of " + items.length;
      if (o.flash) {
        el.stage.innerHTML = '<div class="ss-flash" style="visibility:hidden">' + it.pic + "</div>" +
          '<div class="bigbtns"><button type="button" class="big teal ss-look">Look!</button></div>';
        el.ch.innerHTML = "";
      } else {
        el.stage.innerHTML = it.pic || "";
        options();
      }
      say(words(it.ask));
    }
    el.stage.addEventListener("click", (e) => {
      const b = e.target.closest(".ss-look"); if (!b) return;
      const pic = el.stage.querySelector(".ss-flash");
      b.parentElement.remove();
      pic.style.visibility = "visible";
      setTimeout(() => { pic.style.visibility = "hidden"; options(); }, o.flash);
    });
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = items[i], ok = b.dataset.ok === "1";
      el.ch.querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (ok) right++; else b.classList.add("wrong");
      const pic = el.stage.querySelector(".ss-flash"); if (pic) pic.style.visibility = "visible";
      const msg = (ok ? cheer() + " " : "Not quite. ") + it.why;
      el.fb.className = "fb " + (ok ? "good" : "bad"); el.fb.textContent = msg;
      i++;
      if (i < items.length) el.next.hidden = false;
      else { el.score.textContent = "You got " + right + " of " + items.length + ". " + o.done; finish(o.finish); }
      say(msg);
    });
    el.next.addEventListener("click", () => { if (i < items.length) draw(); });
    draw();
  }
'''

# the pictures, in each family's own classes. Counting and Adding share one
# stylesheet (both were cut from up-to-twenty.html); Shapes and Days share another.
NUM_HELP = r'''  /* the second steps' pictures, in this lesson's own classes */
  const SS_PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const ssDice = (n) => '<div class="dice">' + Array.from({ length: 9 }, (_, i) => '<i class="' + (SS_PIPS[n].includes(i) ? "on" : "") + '"></i>').join("") + "</div>";
  const ssDomino = (a, b) => '<div class="ss-domino" role="img" aria-label="A domino">' + ssDice(a) + ssDice(b) + "</div>";
  const ssFrames = (n) => '<div class="frames"><div class="tenframe">' + frameHtml(Math.min(10, n)) + "</div>" +
    (n > 10 ? '<div class="tenframe">' + frameHtml(n - 10, "b") + "</div>" : "") + "</div>";
  function ssTrack(from, to, a, b) {
    let h = "";
    for (let n = from; n <= to; n++) h += '<b class="' + (a.includes(n) ? "a" : b.includes(n) ? "b" : "") + '">' + n + "</b>";
    return '<div class="ss-track" role="img" aria-label="The numbers ' + from + " to " + to + '">' + h + "</div>";
  }
  const ssLine = (list) => '<div class="queue"><div class="flag"></div>' + list.map((e) => '<span class="ss-who">' + e + "</span>").join("") + "</div>";
  const SS_SHELF = [["teal", 80], ["accent", 96], ["gold", 70], ["plum", 88], ["teal", 100], ["accent", 76], ["gold", 92], ["plum", 84]];
  const ssBooks = (letters) => '<div class="ss-books" role="img" aria-label="Books on a shelf">' + letters.split("").map((L, i) =>
    '<span class="ss-book" style="height:' + SS_SHELF[i % 8][1] + "px;background:var(--" + SS_SHELF[i % 8][0] + ')">' + L + "</span>").join("") + "</div>";
  const ssBaskets = (list, emo) => '<div class="ss-row">' + list.map((c) => '<div class="ss-cell"><div class="ss-box">' +
    (c[0] ? emo.repeat(c[0]) : "&nbsp;") + '</div><div class="ss-lab">' + c[1] + "</div></div>").join("") + "</div>";
  const ssBag = (n, more) => '<div class="ss-row"><div class="ss-cell"><div class="ss-bag">' + n + '</div><div class="ss-lab">in the bag</div></div>' +
    '<div class="ss-cell"><div class="ss-emo sm">' + more + '</div><div class="ss-lab">on the table</div></div></div>';
  const ssCoins = (list) => '<div class="coins">' + list.map((v) => '<span class="coin c' + v + ' still">' + v + "</span>").join("") + "</div>";
  const ssWho = (list) => '<div class="ss-row">' + list.map((w) => '<div class="ss-cell">' + ssCoins(w[1]) + '<div class="ss-lab">' + w[0] + "</div></div>").join("") + "</div>";
'''

ROW_HELP = r'''  function ssRow(cells, w) {
    return '<div class="ss-row">' + cells.map((c) => '<div class="ss-cell"><div class="ss-art"' + (w ? ' style="width:' + w + 'px"' : "") + ">" +
      c[0] + '</div><div class="ss-lab">' + c[1] + "</div></div>").join("") + "</div>";
  }
'''

SHAPE_HELP = r'''  /* the second steps' pictures, in this lesson's own classes */
  const ssSolid = (k) => '<svg viewBox="0 0 200 200" class="solid" role="img" aria-label="A ' + k + '">' + solidSvg(k) + "</svg>";
  const ssFlat = (i) => '<svg viewBox="0 0 200 200" role="img" aria-label="A ' + FLAT[i].name + '">' + flatSvg(FLAT[i], "b") + "</svg>";
  const ssPoly = (pts) => '<svg viewBox="0 0 200 200" role="img" aria-label="A flat shape">' + poly(pts, "b") + "</svg>";
  const ssBox = (svg) => '<div class="shapebox">' + svg + "</div>";
  const SS_ARROW = [[100, 20], [150, 90], [122, 90], [122, 178], [78, 178], [78, 90], [50, 90]];
  const SS_CROSS = [[76, 24], [124, 24], [124, 76], [176, 76], [176, 124], [124, 124], [124, 176], [76, 176], [76, 124], [24, 124], [24, 76], [76, 76]];
  const SS_HOUSE = [[100, 26], [168, 90], [168, 172], [32, 172], [32, 90]];
''' + ROW_HELP + r'''  function ssStack(cells) {
    return '<div class="ss-stack">' + cells.map((c) => '<div class="ss-srow"><span class="ss-lab">' + c[1] + "</span>" + c[0] + "</div>").join("") + "</div>";
  }
  const ssPencil = (len, col) => '<svg viewBox="0 0 150 30" role="img" aria-label="A pencil"><rect x="2" y="7" width="' + (len - 16) +
    '" height="16" rx="3" fill="var(--' + col + ')"></rect><polygon points="' + (len - 14) + ",7 " + (len + 2) + ",15 " + (len - 14) +
    ',23" fill="var(--gold)"></polygon></svg>';
  function ssRuler(n) {
    let t = "";
    for (let i = 0; i <= 10; i++) {
      const x = (16 + i * 16.8).toFixed(1);
      t += '<line x1="' + x + '" y1="34" x2="' + x + '" y2="' + (i % 5 === 0 ? 50 : 44) + '" stroke="var(--gold-ink)" stroke-width="2"></line>' +
        '<text x="' + x + '" y="63" font-size="11" text-anchor="middle" font-family="Inter" fill="var(--gold-ink)">' + i + "</text>";
    }
    const end = (16 + n * 16.8).toFixed(1);
    return '<svg viewBox="0 0 200 74" role="img" aria-label="A ruler with a ribbon on it">' +
      '<rect x="4" y="30" width="192" height="40" rx="6" fill="var(--gold)" stroke="var(--ink)" stroke-width="2"></rect>' + t +
      '<rect x="16" y="10" width="' + (n * 16.8).toFixed(1) + '" height="14" rx="3" fill="var(--accent)"></rect>' +
      '<line x1="' + end + '" y1="10" x2="' + end + '" y2="34" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 3"></line></svg>';
  }
  function ssThermo(v) {
    let t = "";
    for (let k = 0; k <= 5; k++) {
      const y = 110 - k * 18;
      t += '<line x1="52" y1="' + y + '" x2="62" y2="' + y + '" stroke="var(--ink)" stroke-width="2"></line>' +
        '<text x="66" y="' + (y + 4) + '" font-size="11" font-family="Inter" fill="var(--ink)">' + k * 10 + "</text>";
    }
    const top = 110 - (v / 10) * 18;
    return '<svg viewBox="0 0 100 150" role="img" aria-label="A thermometer">' +
      '<rect x="36" y="12" width="16" height="112" rx="8" fill="var(--cell)" stroke="var(--ink)" stroke-width="3"></rect>' +
      '<rect x="39" y="' + top + '" width="10" height="' + (124 - top) + '" fill="var(--bad)"></rect>' +
      '<circle cx="44" cy="128" r="14" fill="var(--bad)" stroke="var(--ink)" stroke-width="3"></circle>' + t + "</svg>";
  }
  function ssDial(n) {
    let t = "";
    for (let i = 0; i <= 5; i++) {
      const a = Math.PI * (1 + i / 5);
      t += '<text x="' + (60 + 34 * Math.cos(a)).toFixed(1) + '" y="' + (66 + 34 * Math.sin(a)).toFixed(1) +
        '" font-size="11" text-anchor="middle" font-family="Inter" fill="var(--ink)">' + i + "</text>";
    }
    const a = Math.PI * (1 + n / 5);
    return '<svg viewBox="0 -12 120 122" role="img" aria-label="Kitchen scales with a parcel">' +
      '<rect x="14" y="66" width="92" height="34" rx="8" fill="var(--muted)" stroke="var(--ink)" stroke-width="3"></rect>' +
      '<circle cx="60" cy="62" r="44" fill="var(--card)" stroke="var(--ink)" stroke-width="3"></circle>' + t +
      '<line x1="60" y1="62" x2="' + (60 + 26 * Math.cos(a)).toFixed(1) + '" y2="' + (62 + 26 * Math.sin(a)).toFixed(1) +
      '" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"></line>' +
      '<circle cx="60" cy="62" r="5" fill="var(--ink)"></circle><rect x="30" y="14" width="60" height="8" rx="4" fill="var(--teal)"></rect>' +
      '<text x="60" y="12" font-size="20" text-anchor="middle">📦</text></svg>';
  }
  function ssMJug(lv) {
    let t = "";
    for (let i = 1; i <= 4; i++) {
      const y = 120 - i * 22;
      t += '<line x1="66" y1="' + y + '" x2="84" y2="' + y + '" stroke="var(--ink)" stroke-width="2"></line>' +
        '<text x="90" y="' + (y + 4) + '" font-size="12" font-family="Inter" fill="var(--ink)">' + i + "</text>";
    }
    const top = 120 - lv * 22;
    return '<svg viewBox="0 0 110 132" role="img" aria-label="A measuring jug">' +
      '<rect x="18" y="' + top + '" width="66" height="' + (126 - top) + '" fill="var(--teal)" opacity="0.85"></rect>' +
      '<path d="M18,14 L18,126 L84,126 L84,14" fill="none" stroke="var(--ink)" stroke-width="4"></path>' + t + "</svg>";
  }
  const ssShelf = (a, b) => '<div class="picwrap" style="max-width:260px"><svg viewBox="0 0 200 170" role="img" aria-label="Two shelves">' +
    '<rect x="20" y="10" width="160" height="150" rx="6" fill="none" stroke="var(--line)" stroke-width="4"></rect>' +
    '<line x1="20" y1="85" x2="180" y2="85" stroke="var(--ink)" stroke-width="5"></line>' +
    '<line x1="20" y1="158" x2="180" y2="158" stroke="var(--ink)" stroke-width="5"></line>' +
    '<text x="100" y="78" font-size="48" text-anchor="middle">' + a + "</text>" +
    '<text x="100" y="151" font-size="48" text-anchor="middle">' + b + "</text></svg></div>";
'''

DAY_HELP = r'''  /* the second steps' pictures, in this lesson's own classes */
''' + ROW_HELP + r'''  function ssClock(h, half) {
    const at = (deg, len) => [(110 + len * Math.sin(deg * Math.PI / 180)).toFixed(1), (110 - len * Math.cos(deg * Math.PI / 180)).toFixed(1)];
    let s = '<circle class="face" cx="110" cy="110" r="96"></circle>';
    for (let i = 1; i <= 12; i++) {
      const p = at(i * 30, 86), q = at(i * 30, 96), n = at(i * 30, 68);
      s += '<line class="tick big" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"></line>' +
        '<text class="num" x="' + n[0] + '" y="' + n[1] + '">' + i + "</text>";
    }
    const hr = at((h % 12) * 30 + (half ? 15 : 0), 48), mn = at(half ? 180 : 0, 76);
    s += '<line class="hour" x1="110" y1="110" x2="' + hr[0] + '" y2="' + hr[1] + '"></line>' +
      '<line class="minute" x1="110" y1="110" x2="' + mn[0] + '" y2="' + mn[1] + '"></line>' +
      '<circle class="hub" cx="110" cy="110" r="6"></circle>';
    return '<svg class="clock big-clock" viewBox="0 0 220 220" role="img" aria-label="A clock">' + s + "</svg>";
  }
'''

CSS_BASE = """  .ss-row { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; align-items: flex-end; }
  .ss-cell { display: grid; justify-items: center; gap: 6px; }
  .ss-art { width: 104px; }
  .ss-art svg { width: 100%; height: auto; display: block; }
  .ss-lab { font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 20px; color: var(--ink); }
  .ss-emo { font-size: clamp(40px, 9vw, 60px); line-height: 1.2; text-align: center; }
  .ss-emo.sm { font-size: clamp(28px, 6vw, 40px); }
  .ss-flash { display: grid; place-items: center; min-height: 150px; }
"""
CSS_NUM = """  /* this stylesheet sets .choice to a fixed 78px at 34px type, for numbers */
  .choice.ss-w { height: auto; min-height: 64px; padding: 10px 16px; font-size: 22px; line-height: 1.25; }
  .ss-domino { display: flex; border: 5px solid var(--ink); border-radius: 18px; overflow: hidden; background: var(--card); }
  .ss-domino .dice { border: 0; border-radius: 0; grid-template-columns: repeat(3, 24px); grid-template-rows: repeat(3, 24px); gap: 6px; padding: 12px; }
  .ss-domino .dice + .dice { border-left: 4px solid var(--ink); }
  .ss-domino .dice i { width: 24px; height: 24px; }
  .ss-track { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; max-width: 560px; }
  .ss-track b { width: 38px; height: 40px; display: grid; place-items: center; border-radius: 10px; border: 2px solid var(--line);
    background: var(--card); font-family: "Inter", "Segoe UI", sans-serif; font-size: 18px; color: var(--ink); }
  .ss-track b.a { background: var(--teal); border-color: var(--teal); color: #06231F; }
  .ss-track b.b { background: var(--accent); border-color: var(--accent); color: #2A1F05; }
  .ss-who { font-size: 40px; line-height: 1; }
  .ss-books { display: flex; gap: 5px; align-items: flex-end; padding: 0 10px; border-bottom: 6px solid var(--line); }
  .ss-book { width: 34px; border-radius: 5px 5px 2px 2px; display: grid; align-items: end; justify-items: center; padding-bottom: 8px;
    font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 18px; color: #06231F; }
  .ss-box { min-width: 96px; min-height: 64px; padding: 8px 10px; border: 4px solid var(--gold); border-radius: 0 0 22px 22px;
    display: grid; place-items: center; font-size: 26px; }
  .ss-bag { width: 96px; height: 96px; border-radius: 22px 22px 34px 34px; background: var(--plum); color: #241733; display: grid;
    place-items: center; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 40px; }
  /* a phone: an 11-number track, the animal line and the shelf each stay on ONE row -
     a track that wraps after 8 splits the very row "every other number" is read along */
  @media (max-width: 480px) {
    .ss-track { gap: 3px; }
    .ss-track b { width: 24px; height: 32px; font-size: 13px; border-radius: 7px; }
    .ss-who { font-size: 30px; }
    .ss-book { width: 28px; font-size: 16px; }
  }
"""
CSS_SHAPE = """  .ss-stack { display: grid; gap: 12px; width: min(92%, 380px); }
  .ss-srow { display: grid; grid-template-columns: 32px 1fr; align-items: center; gap: 10px; }
  .ss-srow svg { width: 100%; height: auto; display: block; }
"""
CSS_DAY = """  .ss-art .big-clock .num { font-size: 22px; }
"""


# ===========================================================================
# THE STEPS
# ===========================================================================
COUNTING = [
    dict(code="1Nc.02", title="Patterns you know", label="Pattern", flash=1500,
         sticker=("🎲", "Patterns I know"),
         say="Press look. The picture shows for a moment. Then tap how many you saw, without counting.",
         prompt="Press <b>Look!</b> The picture shows for a moment. Say how many straight away, without counting.",
         explain=ssml(
             ["Some patterns you see so often that you know them straight away."],
             ["Five fingers on one hand.", "Five dots in a row, and more underneath.",
              "A domino with a four and a two.",
              "Look for the parts you know, then put them together: four and two make six, without counting one at a time."],
             ["Children try to count every dot, one by one, and the picture hides before they finish.",
              "You do not need to.", "Find a part you already know, like five, and add on the rest."],
             ["So press look, find the parts you know, and tap your answer."]),
         done="You can see how many without counting.",
         items=r'''
      { ask: "How many dots on the domino?", pic: ssDomino(4, 2),
        opts: [{ t: "6", ok: true }, { t: "5", ok: false }, { t: "7", ok: false }],
        why: "4 and 2 make 6. You know the 4 and the 2 without counting them." },
      { ask: "How many counters in the frame?", pic: ssFrames(8),
        opts: [{ t: "8", ok: true }, { t: "7", ok: false }, { t: "9", ok: false }],
        why: "A full row is 5, and 3 more make 8." },
      { ask: "How many fingers are up?", pic: '<div class="ss-emo">🖐️ ✌️</div>',
        opts: [{ t: "7", ok: true }, { t: "6", ok: false }, { t: "8", ok: false }],
        why: "One whole hand is 5 fingers. 5 and 2 more make 7." },
      { ask: "How many dots on this domino?", pic: ssDomino(5, 4),
        opts: [{ t: "9", ok: true }, { t: "8", ok: false }, { t: "10", ok: false }],
        why: "5 and 4 make 9. The 5 is the pattern with one dot in the middle." },
      { ask: "How many counters now?", pic: ssFrames(10),
        opts: [{ t: "10", ok: true }, { t: "9", ok: false }, { t: "11", ok: false }],
        why: "Both rows are full, and a full ten frame is always 10." },'''),
    dict(code="1Np.01", title="Zero means empty", label="Question",
         sticker=("🧺", "Zero means empty"),
         say="Zero means none at all. Look at each picture and tap the answer.",
         prompt="<b>Zero</b> means none at all. Tap the answer.",
         explain=ssml(
             ["Zero is the number for none at all."],
             ["An empty plate has zero mangoes.", "An empty ten frame has zero counters.",
              "If you have three sweets and eat all three, you have zero left.", "We write zero like this: 0."],
             ["Children sometimes think zero is not a number, because there is nothing to count.",
              "It is a number.", "It is the number that says none, and it comes just before one when you count."],
             ["So when you see nothing there, say zero, and tap 0."]),
         done="Zero means none at all.",
         items=r'''
      { ask: "How many counters are in the frame?", pic: ssFrames(0),
        opts: [{ t: "0", ok: true }, { t: "1", ok: false }, { t: "10", ok: false }],
        why: "The frame is empty. No counters at all is 0." },
      { ask: "Asha has 3 sweets. She eats all 3. How many are left?", pic: '<div class="ss-emo">🍬🍬🍬</div>',
        opts: [{ t: "0", ok: true }, { t: "3", ok: false }, { t: "1", ok: false }],
        why: "3 take away 3 leaves none, and none is 0." },
      { ask: "Which basket has <b>zero</b> apples?", pic: ssBaskets([[2, "A"], [0, "B"], [1, "C"]], "🍎"),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }, { t: "C", ok: false }],
        why: "Basket B has no apples in it at all, so it has zero apples." },
      { ask: "Count back: 3, 2, 1, and then?", pic: ssTrack(0, 5, [3, 2, 1], []),
        opts: [{ t: "0", ok: true }, { t: "4", ok: false }, { t: "10", ok: false }],
        why: "After 1 comes 0 when you count back. Zero comes just before 1." },
      { ask: "Which is <b>fewer</b>: 0 bananas or 1 banana?", pic: "",
        opts: [{ t: "0 bananas", ok: true }, { t: "1 banana", ok: false }],
        why: "0 is fewer than 1. You cannot have fewer than none." },'''),
    dict(code="1Nc.05", title="Every other number", label="Question",
         sticker=("🐸", "Every other number"),
         say="Count, and say every other number. The numbers you land on are all even, or all odd.",
         prompt="Say <b>every other number</b> as you count. Tap the answer.",
         explain=ssml(
             ["When you count, odd and even numbers take turns."],
             ["Start at zero and say every other number: zero, two, four, six, eight.", "Those are the even numbers.",
              "Start at one instead: one, three, five, seven, nine.", "Those are the odd numbers.",
              "Even, odd, even, odd, all the way to twenty."],
             ["Children think a big number must be even, or that odd means strange.", "Neither is true.",
              "Twenty is even and nineteen is odd, because they take turns, just like the small ones."],
             ["So hop along the numbers, jumping over every other one, and see where you land."]),
         done="Odd and even numbers take turns when you count.",
         items=r'''
      { ask: "Start at 0 and say every other number: 0, 2, 4, 6, 8. What comes next?", pic: ssTrack(0, 10, [0, 2, 4, 6, 8], []),
        opts: [{ t: "10", ok: true }, { t: "9", ok: false }, { t: "12", ok: false }],
        why: "Jump over 9 and land on 10. Every other number from 0 is even: 0, 2, 4, 6, 8, 10." },
      { ask: "Start at 1 and say every other number: 1, 3, 5, 7. What comes next?", pic: ssTrack(1, 11, [], [1, 3, 5, 7]),
        opts: [{ t: "9", ok: true }, { t: "8", ok: false }, { t: "11", ok: false }],
        why: "Jump over 8 and land on 9. Every other number from 1 is odd: 1, 3, 5, 7, 9." },
      { ask: "The coloured numbers are every other number, starting at 10. Is 17 coloured?", pic: ssTrack(10, 20, [10, 12, 14, 16, 18, 20], []),
        opts: [{ t: "No, 17 is odd", ok: true }, { t: "Yes, 17 is even", ok: false }],
        why: "Every other number goes 16, then 18, and jumps over 17. So 17 is not coloured: 17 is odd." },
      { ask: "Which of these numbers is <b>odd</b>?", pic: "",
        opts: [{ t: "13", ok: true }, { t: "12", ok: false }, { t: "18", ok: false }],
        why: "Say every other number from 1: 1, 3, 5, 7, 9, 11, 13. 13 is odd. 12 and 18 are even." },
      { ask: "Which of these numbers is <b>even</b>?", pic: "",
        opts: [{ t: "20", ok: true }, { t: "15", ok: false }, { t: "7", ok: false }],
        why: "Say every other number from 0 and you reach 20: 16, 18, 20. 20 is even." },
      { ask: "Odd and even take turns. 6 is even, so 7 is…", pic: "",
        opts: [{ t: "odd", ok: true }, { t: "even", ok: false }],
        why: "They take turns: even, odd, even, odd. After even 6 comes odd 7." },'''),
    dict(code="1Np.04", title="Places in a line", label="Question",
         sticker=("🦓", "Places in a line"),
         say="Count from the front of the line: first, second, third. Tap the answer.",
         prompt="Count from the front: <b>1st</b>, <b>2nd</b>, <b>3rd</b>, all the way to <b>10th</b>. Tap the answer.",
         explain=ssml(
             ["First, second and third tell you a place in a line, not how many there are."],
             ["Always start counting at the front.",
              "The one at the front is first, then second, then third, then fourth, fifth, sixth, seventh, eighth, ninth, and tenth.",
              "When we write them short, first is 1st, second is 2nd and third is 3rd."],
             ["Children start counting from the wrong end, or they count the flag as first.",
              "The flag is not in the line.", "Start with the one standing right behind it."],
             ["So point at the front one and say first, then keep going until you reach the one you want."]),
         done="You can say places in a line, from 1st to 10th.",
         items=r'''
      { ask: "The animals line up behind the flag. Which animal is <b>3rd</b>?", pic: ssLine(["🐘", "🦒", "🦓", "🦁", "🐒"]),
        opts: [{ t: "🦓 zebra", ok: true }, { t: "🦒 giraffe", ok: false }, { t: "🦁 lion", ok: false }],
        why: "Count from the flag: the elephant is 1st, the giraffe is 2nd and the zebra is 3rd." },
      { ask: "Which place is the <b>lion</b> in?", pic: ssLine(["🐘", "🦒", "🦓", "🦁", "🐒"]),
        opts: [{ t: "4th", ok: true }, { t: "3rd", ok: false }, { t: "5th", ok: false }],
        why: "Count from the flag: elephant 1st, giraffe 2nd, zebra 3rd, lion 4th." },
      { ask: "Which book is <b>6th</b> from the left?", pic: ssBooks("ABCDEFGH"),
        opts: [{ t: "F", ok: true }, { t: "E", ok: false }, { t: "G", ok: false }],
        why: "Count from the left: A is 1st, B 2nd, C 3rd, D 4th, E 5th and F is 6th." },
      { ask: "In a race, which runner wins?", pic: "",
        opts: [{ t: "the one who comes 1st", ok: true }, { t: "the one who comes 5th", ok: false }, { t: "the one who comes 10th", ok: false }],
        why: "1st means first over the line, so the runner who comes 1st wins the race." },
      { ask: "Which place comes just after <b>7th</b>?", pic: "",
        opts: [{ t: "8th", ok: true }, { t: "6th", ok: false }, { t: "9th", ok: false }],
        why: "Places go in counting order, so after 7th comes 8th." },
      { ask: "Which word says <b>10th</b>?", pic: "",
        opts: [{ t: "tenth", ok: true }, { t: "ten", ok: false }, { t: "tent", ok: false }],
        why: "10th is said tenth. Ten is the number 10, and a tent is something you sleep in." },'''),
]

ADDING = [
    dict(code="1Ni.02", title="Counting on", label="Question",
         sticker=("🦘", "I can count on"),
         say="Put the bigger number in your head, then count on. Tap the answer.",
         prompt="Put the first number in your head, then <b>count on</b>. How many <b>altogether</b>?",
         explain=ssml(
             ["You do not have to count everything from one."],
             ["Put the first number in your head.", "Say it, then count on the rest, one at a time.",
              "Six in your head, then count on three: seven, eight, nine.", "Nine altogether."],
             ["Children start again from one and count every counter, and they lose their place.",
              "Start from the number you already know, and it is much quicker."],
             ["So say the bigger number first, then count on with your fingers."]),
         done="You can count on to add.",
         items=r'''
      { ask: "Start at 6 and count on 3. Where do you land?", pic: ssTrack(2, 12, [6], []),
        opts: [{ t: "9", ok: true }, { t: "8", ok: false }, { t: "10", ok: false }],
        why: "Say 6 in your head, then count on: 7, 8, 9. You land on 9." },
      { ask: "8 sweets are in the bag and 2 more are on the table. How many altogether?", pic: ssBag(8, "🍬🍬"),
        opts: [{ t: "10", ok: true }, { t: "9", ok: false }, { t: "11", ok: false }],
        why: "Start at 8 and count on the 2: 9, 10. 8 and 2 make 10 altogether." },
      { ask: "To work out 3 + 9, which way is quicker?", pic: "",
        opts: [{ t: "Start at 9 and count on 3", ok: true }, { t: "Start at 3 and count on 9", ok: false }],
        why: "Start with the bigger number, 9, then count on just 3: 10, 11, 12. So 3 + 9 = 12." },
      { ask: "One plate has 4 mangoes and one has 5. Put them together. How many mangoes?", pic: '<div class="ss-emo sm">🥭🥭🥭🥭 &nbsp; 🥭🥭🥭🥭🥭</div>',
        opts: [{ t: "9", ok: true }, { t: "8", ok: false }, { t: "10", ok: false }],
        why: "Put the two plates together and count on from 5: 6, 7, 8, 9. 4 and 5 make 9." },
      { ask: "Start at 12 and count on 4. Where do you land?", pic: ssTrack(10, 20, [12], []),
        opts: [{ t: "16", ok: true }, { t: "15", ok: false }, { t: "17", ok: false }],
        why: "Say 12, then count on: 13, 14, 15, 16. You land on 16." },'''),
    dict(code="1Ni.04", title="Pairs that make 10", label="Question",
         sticker=("🤝", "Pairs that make 10"),
         say="Ten is a full frame. How many more make ten? Look at the empty spaces.",
         prompt="How many more <b>make 10</b>? Look at the empty spaces.",
         explain=ssml(
             ["Numbers come in pairs that make ten, and it helps to know them by heart."],
             ["A ten frame shows them.", "Seven counters leave three empty spaces, so seven and three make ten.",
              "One and nine, two and eight, three and seven, four and six, five and five.", "And ten and zero."],
             ["Children count the counters that are there, when the question asks about the spaces.",
              "Count the empty spaces instead.", "They are the number you need to make ten."],
             ["So look at the gaps, and say the pair out loud: seven and three make ten."]),
         done="You know the pairs that make 10.",
         items=r'''
      { ask: "How many more counters make 10?", pic: ssFrames(7),
        opts: [{ t: "3", ok: true }, { t: "7", ok: false }, { t: "4", ok: false }],
        why: "There are 7 counters and 3 empty spaces. 7 and 3 make 10." },
      { ask: "6 and ? make 10", pic: "",
        opts: [{ t: "4", ok: true }, { t: "3", ok: false }, { t: "5", ok: false }],
        why: "Count on from 6 to 10: 7, 8, 9, 10. That is 4 more, so 6 and 4 make 10." },
      { ask: "Which pair makes 10?", pic: "",
        opts: [{ t: "8 and 2", ok: true }, { t: "8 and 3", ok: false }, { t: "5 and 4", ok: false }],
        why: "8 and 2 make 10. 8 and 3 make 11, and 5 and 4 make 9." },
      { ask: "There are 10 children. 9 are sitting down. How many are standing up?", pic: "",
        opts: [{ t: "1", ok: true }, { t: "9", ok: false }, { t: "10", ok: false }],
        why: "9 and 1 make 10, so 1 child is standing up." },
      { ask: "How many more counters fill the frame?", pic: ssFrames(5),
        opts: [{ t: "5", ok: true }, { t: "4", ok: false }, { t: "6", ok: false }],
        why: "5 and 5 make 10: two full rows." },
      { ask: "The frame is full. 10 and ? make 10", pic: ssFrames(10),
        opts: [{ t: "0", ok: true }, { t: "1", ok: false }, { t: "10", ok: false }],
        why: "The frame is already full, so nothing more is needed. 10 and 0 make 10." },'''),
    dict(code="1Nm.01", title="Know your coins", label="Question",
         sticker=("💰", "I know my coins"),
         say="Look at the coins. The number on each coin says how many shillings it is worth. Tap the answer.",
         prompt="Look at the coins. The number on a <b>coin</b> says how many shillings it is worth.",
         explain=ssml(
             ["Our money is counted in shillings, and we write sh for short."],
             ["Each coin has a number on it.", "The number tells you how many shillings the coin is worth.",
              "A ten shilling coin is worth ten, even though it is only one coin.",
              "Two five shilling coins are worth the same as one ten."],
             ["Children think more coins always means more money.", "It does not.",
              "One ten shilling coin is worth more than three two shilling coins, because ten is more than six."],
             ["So read the number on each coin, and add them up before you decide."]),
         done="You know your coins and what they are worth.",
         items=r'''
      { ask: "Which coin is worth the <b>most</b>?", pic: ssCoins([2, 10, 5]),
        opts: [{ t: "10 sh", ok: true }, { t: "5 sh", ok: false }, { t: "2 sh", ok: false }],
        why: "The 10 shilling coin is worth the most. 10 is more than 5, and more than 2." },
      { ask: "Which coin is worth the <b>least</b>?", pic: ssCoins([5, 1, 2]),
        opts: [{ t: "1 sh", ok: true }, { t: "2 sh", ok: false }, { t: "5 sh", ok: false }],
        why: "The 1 shilling coin is worth the least, because 1 is the smallest number." },
      { ask: "Two 5 sh coins are worth the same as…", pic: ssCoins([5, 5]),
        opts: [{ t: "one 10 sh coin", ok: true }, { t: "one 5 sh coin", ok: false }, { t: "one 2 sh coin", ok: false }],
        why: "5 and 5 make 10, so two 5 shilling coins are worth the same as one 10 shilling coin." },
      { ask: "Hodan has one 10 sh coin. Ali has three 2 sh coins. Who has <b>more money</b>?", pic: ssWho([["Hodan", [10]], ["Ali", [2, 2, 2]]]),
        opts: [{ t: "Hodan", ok: true }, { t: "Ali", ok: false }],
        why: "Ali has more coins, but 2 and 2 and 2 make only 6 sh. Hodan has 10 sh, and 10 is more than 6." },
      { ask: "A pencil costs 6 sh. Which coins pay <b>exactly</b> 6 sh?", pic: '<div class="pricetag"><small>a pencil</small> 6 sh</div>',
        opts: [{ t: "5 sh and 1 sh", ok: true }, { t: "5 sh and 2 sh", ok: false }, { t: "2 sh and 2 sh", ok: false }],
        why: "5 and 1 make 6. 5 and 2 make 7, and 2 and 2 make only 4." },'''),
]

SHAPES = [
    dict(code="1Gg.03", title="Faces and edges", label="Shape",
         sticker=("🎲", "Faces and edges"),
         say="Look at each solid shape. Think about its faces and its edges, then tap the answer.",
         prompt="Look at the solid shape. Think about its <b>faces</b> and <b>edges</b>, flat or curved. Tap the answer.",
         explain=ssml(
             ["A face is a side of a solid shape, and an edge is where two faces meet."],
             ["A cube has six flat faces, like a dice.", "A sphere has one curved face and no edges at all, like a ball.",
              "A cylinder has two flat circles and one curved face, like a tin.",
              "A cone has one flat circle, one curved face, and one edge where they meet."],
             ["Children only count the faces they can see in the picture.",
              "A solid shape has faces at the back and underneath too.", "Imagine picking it up and turning it round."],
             ["So hold the shape in your mind, turn it round, and count every face."]),
         done="You can describe solid shapes by their faces and edges.",
         items=r'''
      { ask: "How many <b>faces</b> does a cube have?", pic: ssBox(ssSolid("cube")),
        opts: [{ t: "6", ok: true }, { t: "3", ok: false }, { t: "4", ok: false }],
        why: "A cube has 6 faces: top, bottom, front, back and two sides. The picture only shows 3 of them." },
      { ask: "Which shape has <b>no</b> edges?", pic: ssRow([[ssSolid("sphere"), "sphere"], [ssSolid("cube"), "cube"], [ssSolid("cone"), "cone"]]),
        opts: [{ t: "sphere", ok: true }, { t: "cube", ok: false }, { t: "cone", ok: false }],
        why: "A sphere is round all over, so it has no edges at all. A cube has 12 edges and a cone has 1." },
      { ask: "How many <b>flat</b> faces does a cylinder have?", pic: ssBox(ssSolid("cylinder")),
        opts: [{ t: "2", ok: true }, { t: "1", ok: false }, { t: "3", ok: false }],
        why: "A cylinder has 2 flat circles, one at each end, and 1 curved face around the middle, like a tin." },
      { ask: "How many <b>edges</b> does a cone have?", pic: ssBox(ssSolid("cone")),
        opts: [{ t: "1", ok: true }, { t: "0", ok: false }, { t: "2", ok: false }],
        why: "A cone has 1 edge, where its flat circle meets its curved face." },
      { ask: "Which shape has <b>only flat</b> faces?", pic: ssRow([[ssSolid("cuboid"), "cuboid"], [ssSolid("sphere"), "sphere"], [ssSolid("cylinder"), "cylinder"]]),
        opts: [{ t: "cuboid", ok: true }, { t: "sphere", ok: false }, { t: "cylinder", ok: false }],
        why: "A cuboid is like a box: all 6 of its faces are flat. A sphere and a cylinder each have a curved face." },
      { ask: "How many <b>faces</b> does a pyramid have?", pic: ssBox(ssSolid("pyramid")),
        opts: [{ t: "5", ok: true }, { t: "4", ok: false }, { t: "8", ok: false }],
        why: "This pyramid has a square underneath and 4 triangles, so 5 faces. 8 is how many edges it has." },'''),
    dict(code="1Gg.06", title="Flat shape, solid shape", label="Question",
         sticker=("✏️", "Flat shape, solid shape"),
         say="A flat shape lies on paper. A solid shape can be picked up and held. Tap the answer.",
         prompt="A <b>flat</b> shape is drawn on paper. A <b>solid</b> shape can be picked up. Tap the answer.",
         explain=ssml(
             ["Every solid shape is made of faces, and a face is a flat shape."],
             ["Draw round one face of a cube and you draw a square.", "The square is flat, and the cube is solid.",
              "A circle is flat, like a drawing of a ball.", "A sphere is solid, like the ball itself."],
             ["Children call a cube a square, because its faces are squares.", "A square is only one face.",
              "The whole cube, which you can hold, is a solid shape."],
             ["So ask yourself: could I pick it up? If you could, it is solid."]),
         done="You can tell a flat shape from a solid one.",
         items=r'''
      { ask: "Which one is <b>flat</b>?", pic: ssRow([[ssFlat(2), "A"], [ssSolid("cube"), "B"]]),
        opts: [{ t: "A, the square", ok: true }, { t: "B, the cube", ok: false }],
        why: "The square is flat: it is only a drawing on paper. The cube is solid: you can pick it up." },
      { ask: "Which one is <b>solid</b>?", pic: ssRow([[ssFlat(0), "A"], [ssSolid("sphere"), "B"]]),
        opts: [{ t: "B, the sphere", ok: true }, { t: "A, the circle", ok: false }],
        why: "The sphere is solid, like a ball. The circle is flat, like a drawing of a ball." },
      { ask: "Draw round one face of a cube. What shape have you drawn?", pic: ssBox(ssSolid("cube")),
        opts: [{ t: "a square", ok: true }, { t: "a cube", ok: false }, { t: "a circle", ok: false }],
        why: "Every face of a cube is a square. Your drawing is flat, so it is a square, not a cube." },
      { ask: "Which of these is a <b>solid</b> shape?", pic: "",
        opts: [{ t: "a cylinder", ok: true }, { t: "a rectangle", ok: false }, { t: "a triangle", ok: false }],
        why: "A cylinder is solid, like a tin. A rectangle and a triangle are flat." },
      { ask: "Draw round the flat end of a cylinder. What shape have you drawn?", pic: ssBox(ssSolid("cylinder")),
        opts: [{ t: "a circle", ok: true }, { t: "a square", ok: false }, { t: "a cylinder", ok: false }],
        why: "Each end of a cylinder is a flat circle, so your drawing is a circle." },
      { ask: "A football is…", pic: '<div class="ss-emo">⚽</div>',
        opts: [{ t: "a solid shape, a sphere", ok: true }, { t: "a flat shape, a circle", ok: false }],
        why: "You can hold a football, and it is round all over. It is a sphere, which is a solid shape." },'''),
    dict(code="1Gg.07", title="Will it look the same?", label="Question",
         sticker=("🌀", "Will it look the same?"),
         say="Imagine each shape turning. Which one would look exactly the same after the turn?",
         prompt="Imagine each shape making a <b>turn</b>. Does it look <b>the same</b> afterwards?",
         explain=ssml(
             ["Some shapes look exactly the same after you turn them, and some do not."],
             ["A quarter turn is like the hand of a clock moving from twelve to three.",
              "A square looks the same after a quarter turn, because all its sides are the same length.",
              "A circle looks the same however far you turn it.",
              "A rectangle stands up on its end, so it looks different, until it has turned half way round."],
             ["Children think every shape changes when it turns, or that every shape stays the same.",
              "It depends on the shape.", "Picture it turning in your head, and look at where its corners go."],
             ["So turn each shape in your mind, and ask: would I notice that it had moved?"]),
         done="You can tell when a shape looks the same as it turns.",
         items=r'''
      { ask: "Which shape looks <b>the same</b> after a quarter turn?", pic: ssRow([[ssFlat(2), "A"], [ssFlat(3), "B"], [ssPoly(SS_ARROW), "C"]]),
        opts: [{ t: "A", ok: true }, { t: "B", ok: false }, { t: "C", ok: false }],
        why: "Shape A is a square. All its sides are the same length, so after a quarter turn it looks just the same." },
      { ask: "Which shape looks the same <b>however</b> you turn it?", pic: ssRow([[ssFlat(1), "A"], [ssFlat(3), "B"], [ssFlat(0), "C"]]),
        opts: [{ t: "C", ok: true }, { t: "A", ok: false }, { t: "B", ok: false }],
        why: "Shape C is a circle. It is round all the way, so it looks the same whichever way it turns." },
      { ask: "Which of these looks <b>the same</b> after a quarter turn?", pic: ssRow([[ssPoly(SS_HOUSE), "A"], [ssPoly(SS_CROSS), "B"], [ssFlat(1), "C"]]),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }, { t: "C", ok: false }],
        why: "Shape B has 4 arms, all the same length. A quarter turn moves each arm to where the next one was, so it looks the same." },
      { ask: "Which shape looks <b>different</b> after a quarter turn?", pic: ssRow([[ssFlat(1), "A"], [ssFlat(0), "B"], [ssFlat(2), "C"]]),
        opts: [{ t: "A", ok: true }, { t: "B", ok: false }, { t: "C", ok: false }],
        why: "Shape A is a triangle. It points up before the turn and to the side after it, so it looks different." },
      { ask: "A rectangle looks different after a quarter turn. What about after a <b>half</b> turn?", pic: ssBox(ssFlat(3)),
        opts: [{ t: "It looks the same", ok: true }, { t: "It looks different", ok: false }],
        why: "After a half turn the rectangle is lying down again, with its long side at the bottom. It looks the same." },'''),
    # the lesson's own tree(h) draws a trunk only for h above 42 - below that the
    # trunk's height goes negative and the crown sinks under the ground. Its step
    # 6 passes 24; these stay above the line.
    dict(code="1Gg.02", title="Longer or shorter?", label="Question",
         sticker=("🐍", "Longer or shorter"),
         say="Compare them. Which is longer, taller or thinner? Tap the answer.",
         prompt="Compare them carefully: <b>longer</b>, <b>shorter</b>, <b>taller</b>, <b>thinner</b>. Tap the answer.",
         explain=ssml(
             ["To compare two lengths, start them at the same place."],
             ["Line two pencils up at one end.",
              "The one that reaches further at the other end is longer, and the other one is shorter.",
              "For trees and people we say tall, taller and tallest.",
              "For a rope or a worm we can say thin, thinner and thinnest."],
             ["Children look at only one end, or they choose the one that looks biggest overall.",
              "A thick worm is not a long worm.", "Check that the ends line up, then look at the other end."],
             ["So line them up, look along to the far end, and then choose your word."]),
         done="You can compare lengths with long, short, tall and thin.",
         items=r'''
      { ask: "Which pencil is <b>longer</b>?", pic: ssStack([[ssPencil(140, "accent"), "A"], [ssPencil(84, "teal"), "B"]]),
        opts: [{ t: "A", ok: true }, { t: "B", ok: false }],
        why: "The pencils start at the same place, and pencil A reaches further. A is longer." },
      { ask: "Which tree is the <b>tallest</b>?", pic: ssRow([[tree(62, "good"), "A"], [tree(80, "good"), "B"], [tree(48, "good"), "C"]], 70),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }, { t: "C", ok: false }],
        why: "The trees stand on the same ground, and tree B reaches highest. B is the tallest and C is the shortest." },
      { ask: "Which worm is the <b>thinnest</b>?", pic: ssRow([[worm(20, "plum"), "A"], [worm(6, "plum"), "B"], [worm(32, "plum"), "C"]]),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }, { t: "C", ok: false }],
        why: "Worm B is the thinnest: it is the narrowest from side to side. Worm C is the thickest." },
      { ask: "Which sentence is true?", pic: ssStack([[ribbon(40, "plum"), "A"], [ribbon(96, "gold"), "B"]]),
        opts: [{ t: "Ribbon A is shorter than ribbon B", ok: true }, { t: "Ribbon A is longer than ribbon B", ok: false }],
        why: "Both ribbons start at the same place, and ribbon A stops first. A is shorter, and B is longer." },
      { ask: "Which ribbon is the <b>shortest</b>?", pic: ssStack([[ribbon(70, "teal"), "A"], [ribbon(100, "accent"), "B"], [ribbon(38, "gold"), "C"]]),
        opts: [{ t: "C", ok: true }, { t: "A", ok: false }, { t: "B", ok: false }],
        why: "Ribbon C stops soonest, so C is the shortest. B is the longest." },'''),
    dict(code="1Gg.04", title="Heavier or lighter?", label="Question",
         sticker=("🎈", "Heavier or lighter"),
         say="Heavy, light, more and less. Think about how heavy each thing is, then tap the answer.",
         prompt="Think about how <b>heavy</b> each thing is. Tap the answer.",
         explain=ssml(
             ["On a balance, the heavier side always goes down."],
             ["The lighter side goes up.", "If both sides weigh the same, the balance stays level.",
              "Big things are not always heavy.", "A big balloon is lighter than a small stone."],
             ["Children think the bigger thing must be the heavier thing.", "Size can trick you.",
              "Look at which side goes down, or think about lifting it."],
             ["So picture lifting each one in your hands, and feel which one pulls down more."]),
         done="You can say heavier, lighter, more and less.",
         items=r'''
      { ask: "The balloon is bigger. Which one is <b>heavier</b>?", pic: balance(-1, "🎈", "🪨"),
        opts: [{ t: "🪨 the stone", ok: true }, { t: "🎈 the balloon", ok: false }],
        why: "The stone's side went down, so the stone is heavier. Bigger does not always mean heavier." },
      { ask: "Which one is <b>lighter</b>?", pic: balance(1, "🍍", "🍋"),
        opts: [{ t: "🍋 the lemon", ok: true }, { t: "🍍 the pineapple", ok: false }],
        why: "The lemon's side went up, so the lemon is lighter." },
      { ask: "You put 3 books on one side of a balance and 1 book on the other. Which side goes <b>down</b>?", pic: '<div class="ss-emo sm">📕📕📕 ⚖️ 📕</div>',
        opts: [{ t: "the side with 3 books", ok: true }, { t: "the side with 1 book", ok: false }, { t: "neither side", ok: false }],
        why: "3 books are heavier than 1 book. More mass on that side pulls it down." },
      { ask: "One brick goes on each side of a balance. What does the balance do?", pic: '<div class="ss-emo sm">🧱 ⚖️ 🧱</div>',
        opts: [{ t: "It stays level", ok: true }, { t: "The left side goes down", ok: false }, { t: "The right side goes down", ok: false }],
        why: "The two bricks weigh the same, so neither side goes down. The balance stays level." },
      { ask: "Which is <b>heavier</b>: a bucket full of water, or the same bucket empty?", pic: "",
        opts: [{ t: "the full bucket", ok: true }, { t: "the empty bucket", ok: false }],
        why: "The water has mass too, so the full bucket is heavier than the empty one." },'''),
    dict(code="1Gg.05", title="Pour and fill", label="Question",
         sticker=("💧", "Pour and fill"),
         say="Full, empty, more and less. Think about how much water each one holds, then tap the answer.",
         prompt="Think about how much each one <b>holds</b>: <b>full</b>, <b>empty</b>, <b>more</b> or <b>less</b>.",
         explain=ssml(
             ["Capacity is how much something can hold."],
             ["A bucket holds more than a cup, because it is bigger inside.",
              "When a container has no room left, it is full.", "When there is nothing in it, it is empty.",
              "Pour water from one jug into another, and the first one has less while the second has more."],
             ["Children look only at how tall a container is.", "A tall thin glass can hold less than a wide bowl.",
              "Think about how much space there is inside."],
             ["So picture pouring the water, and watch where it goes."]),
         done="You can say full, empty, more and less.",
         items=r'''
      { ask: "When both are full, which one holds <b>more</b> water?", pic: '<div class="ss-emo">🪣 &nbsp; ☕</div>',
        opts: [{ t: "the bucket", ok: true }, { t: "the cup", ok: false }],
        why: "A bucket is much bigger inside than a cup, so when both are full the bucket holds more." },
      { ask: "A cup is full of juice. You drink it all. Now the cup is…", pic: "",
        opts: [{ t: "empty", ok: true }, { t: "full", ok: false }, { t: "half full", ok: false }],
        why: "All the juice is gone and nothing is left in the cup, so it is empty." },
      { ask: "Which jug has the <b>most</b> water?", pic: jugRow([[0.3, "A"], [0.6, "B"], [0.9, "C"]]),
        opts: [{ t: "C", ok: true }, { t: "A", ok: false }, { t: "B", ok: false }],
        why: "The jugs are the same size, and the water in jug C comes up highest. C has the most." },
      { ask: "You pour a full jug into an empty jug the same size. What happens?", pic: "",
        opts: [{ t: "The first jug is empty and the second is full", ok: true }, { t: "Both jugs are full", ok: false }, { t: "Both jugs are empty", ok: false }],
        why: "The water moves across. The jug that was full is now empty, and the one that was empty is now full." },
      { ask: "Which jug holds <b>more</b>?", pic: jugRow([[0.5, "A"], [0.5, "B"]]),
        opts: [{ t: "They hold the same", ok: true }, { t: "A", ok: false }, { t: "B", ok: false }],
        why: "The water is at the same height in two jugs of the same size, so they hold the same amount." },'''),
    dict(code="1Gg.08", title="Read the numbers", label="Question",
         sticker=("🌡️", "Read the numbers"),
         say="Every measuring tool has numbers on it. Read the numbers, then tap the answer.",
         prompt="A ruler, scales, a jug and a thermometer all have a scale of <b>numbers</b>. Read them.",
         explain=ssml(
             ["A measuring tool has a scale of numbers, and the numbers tell you how much."],
             ["On a ruler, start at zero and see which number the end reaches.",
              "On a thermometer, the red line climbs higher, to bigger numbers, when it is hotter.",
              "On a measuring jug, more water reaches a bigger number.",
              "On scales, the pointer turns round to a bigger number for something heavier."],
             ["Children start measuring from the end of the ruler instead of from zero.",
              "Line the thing up with zero first.", "Then read the number at the other end."],
             ["So find zero, find where it stops, and read the number there."]),
         done="You can read the numbers on measuring tools.",
         items=r'''
      { ask: "The ribbon starts at 0. Which number does it reach?", pic: '<div class="picwrap" style="max-width:420px">' + ssRuler(6) + "</div>",
        opts: [{ t: "6", ok: true }, { t: "5", ok: false }, { t: "7", ok: false }],
        why: "The ribbon starts at 0 and stops at 6, so it is 6 long on this ruler." },
      { ask: "Which thermometer shows it is <b>hotter</b>?", pic: ssRow([[ssThermo(40), "A"], [ssThermo(10), "B"]], 116),
        opts: [{ t: "A", ok: true }, { t: "B", ok: false }],
        why: "The red line on A goes up to 40, much higher than the 10 on B. Higher numbers mean hotter." },
      { ask: "Which parcel is <b>heavier</b>?", pic: ssRow([[ssDial(2), "A"], [ssDial(4), "B"]], 130),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }],
        why: "The pointer on scales B turns round to 4, and on scales A only to 2. 4 is more, so parcel B is heavier." },
      { ask: "The water is at the 2 line. You pour in more water. Now the water reaches…", pic: '<div style="width:130px">' + ssMJug(2) + "</div>",
        opts: [{ t: "a bigger number", ok: true }, { t: "a smaller number", ok: false }, { t: "the same number", ok: false }],
        why: "More water fills the jug higher up, so it reaches a bigger number on the scale." },
      { ask: "To find out how <b>tall</b> you are, which tool do you use?", pic: "",
        opts: [{ t: "a tape measure", ok: true }, { t: "a thermometer", ok: false }, { t: "scales", ok: false }],
        why: "A tape measure has numbers along it, and it measures length, like how tall you are." },'''),
    dict(code="1Gp.01", title="Between, above, behind", label="Question",
         sticker=("🐶", "Between, above, behind"),
         say="Look at the picture. Tap the words that say where it is, or which way it is going.",
         prompt="Tap the words that say <b>where</b> it is, or <b>which way</b> it is going: between, above, behind, towards.",
         explain=ssml(
             ["Position words say where something is, and direction words say which way it is going."],
             ["Between means in the middle of two things.", "Above means higher up, and below means lower down.",
              "Behind means at the back, where it can be hidden.",
              "Towards means going closer, and away means going further off."],
             ["Children mix up words that come in pairs, like above and below, or towards and away.",
              "Each word has a partner that means the opposite.", "Say both words, then decide which one fits."],
             ["So point at the thing, look at what is next to it, and choose your word."]),
         done="You can say where things are and which way they go.",
         items=r'''
      { ask: "Which animal is <b>between</b> the cat and the rabbit?", pic: '<div class="ss-emo">🐱 🐶 🐰</div>',
        opts: [{ t: "🐶 the dog", ok: true }, { t: "🐱 the cat", ok: false }, { t: "🐰 the rabbit", ok: false }],
        why: "The dog is in the middle, with the cat on one side and the rabbit on the other. The dog is between them." },
      { ask: "What is <b>above</b> the ball?", pic: ssShelf("🧸", "⚽"),
        opts: [{ t: "🧸 the teddy", ok: true }, { t: "the floor", ok: false }],
        why: "The teddy is on the top shelf, higher up than the ball. The teddy is above the ball, and the floor is below it." },
      { ask: "Where is the ball?", pic: scene("behind"),
        opts: [{ t: "behind the box", ok: true }, { t: "on the box", ok: false }, { t: "in front of the box", ok: false }],
        why: "The box is in front and covers part of the ball, so the ball is behind the box." },
      { ask: "Is the child walking <b>towards</b> the house, or <b>away</b> from it?", pic: '<div class="ss-emo">🧒 ➡️ 🏠</div>',
        opts: [{ t: "towards the house", ok: true }, { t: "away from the house", ok: false }],
        why: "The arrow goes from the child to the house, so the child is getting closer. That is towards the house." },
      { ask: "Point <b>down</b>. What are you pointing at?", pic: "",
        opts: [{ t: "the floor", ok: true }, { t: "the sky", ok: false }],
        why: "Down is towards the floor. Up is towards the sky." },'''),
]

DAYS = [
    dict(code="1Gt.01", title="How long does it take?", label="Question",
         sticker=("⏱️", "How long it takes"),
         say="Seconds, minutes, hours, days, weeks, months and years. Think about how long each thing takes, then tap the answer.",
         prompt="Think about how long each thing takes: a <b>second</b>, a <b>minute</b>, an <b>hour</b>, a <b>day</b>, a <b>week</b> or a <b>year</b>.",
         explain=ssml(
             ["We use different words for short times and long times."],
             ["A blink takes less than a second.", "Eating a banana takes a few minutes.",
              "A night of sleep lasts many hours.", "A school holiday lasts weeks, and there are twelve months in a year."],
             ["Children think something that feels long must take a long time, like waiting for a treat.",
              "Waiting can feel long even when it is only a few minutes.", "Think about the clock, not the feeling."],
             ["So picture doing the thing, and ask: is that seconds, minutes, hours, days, or longer?"]),
         done="You can talk about short times and long times.",
         items=r'''
      { ask: "Which takes <b>longer</b>?", pic: '<div class="ss-emo">😴 &nbsp; 🍌</div>',
        opts: [{ t: "a night of sleep", ok: true }, { t: "eating a banana", ok: false }],
        why: "A night of sleep lasts many hours. Eating a banana takes only a few minutes." },
      { ask: "Which is the <b>shortest</b> time?", pic: "",
        opts: [{ t: "a blink of your eye", ok: true }, { t: "a football match", ok: false }, { t: "a day at school", ok: false }],
        why: "A blink is over in less than a second. A football match lasts more than an hour, and a school day lasts many hours." },
      { ask: "About how long is a <b>school holiday</b>?", pic: "",
        opts: [{ t: "a few weeks", ok: true }, { t: "a few seconds", ok: false }, { t: "a few minutes", ok: false }],
        why: "A school holiday lasts for weeks. Seconds and minutes are far too short." },
      { ask: "Which is <b>longer</b>: a month or a week?", pic: "",
        opts: [{ t: "a month", ok: true }, { t: "a week", ok: false }],
        why: "A month is about 4 weeks, so a month is longer than a week." },
      { ask: "From one birthday to your next birthday is…", pic: '<div class="ss-emo">🎂</div>',
        opts: [{ t: "a year", ok: true }, { t: "a week", ok: false }, { t: "a day", ok: false }],
        why: "Your birthday comes round once a year, so from one birthday to the next is a whole year: 12 months." },'''),
    dict(code="1Gt.03", title="Find the clock", label="Clock",
         sticker=("🕞", "Find the clock"),
         say="Read each clock. The short hand tells the hour, and the long hand says o'clock or half past. Tap the answer.",
         prompt="Read each clock. The <b>long</b> hand says <b>o'clock</b> or <b>half past</b>, and the <b>short</b> hand tells the hour.",
         explain=ssml(
             ["Every clock tells the time the same way, with its two hands."],
             ["The long hand pointing straight up to twelve means o clock.",
              "The long hand pointing straight down to six means half past.",
              "The short hand tells you which hour.",
              "At half past, the short hand sits halfway between two numbers."],
             ["Children read the long hand as the hour, because it is the bigger hand.",
              "The long hand only says o clock or half past.", "It is the short hand that tells you the hour."],
             ["So look at the long hand first, to see o clock or half past, and then read the short hand."]),
         done="You can find o'clock and half past on a clock.",
         items=r'''
      { ask: "Which clock shows <b>4 o'clock</b>?", pic: ssRow([[ssClock(4, true), "A"], [ssClock(4, false), "B"], [ssClock(5, false), "C"]], 124),
        opts: [{ t: "B", ok: true }, { t: "A", ok: false }, { t: "C", ok: false }],
        why: "On clock B the long hand points to 12 and the short hand points to 4. That is 4 o'clock." },
      { ask: "Which clock shows <b>half past 2</b>?", pic: ssRow([[ssClock(2, false), "A"], [ssClock(3, true), "B"], [ssClock(2, true), "C"]], 124),
        opts: [{ t: "C", ok: true }, { t: "A", ok: false }, { t: "B", ok: false }],
        why: "On clock C the long hand points to 6, so it is half past, and the short hand is just past 2." },
      { ask: "At <b>half past</b>, where does the long hand point?", pic: "",
        opts: [{ t: "to 6", ok: true }, { t: "to 12", ok: false }, { t: "to 3", ok: false }],
        why: "Half past means halfway round, so the long hand points straight down to 6." },
      { ask: "At <b>o'clock</b>, where does the long hand point?", pic: "",
        opts: [{ t: "to 12", ok: true }, { t: "to 6", ok: false }, { t: "to 1", ok: false }],
        why: "At o'clock the long hand points straight up to 12." },
      { ask: "School starts at <b>8 o'clock</b>. Where does the short hand point?", pic: "",
        opts: [{ t: "to 8", ok: true }, { t: "to 12", ok: false }, { t: "to 6", ok: false }],
        why: "At 8 o'clock the short hand points to 8, and the long hand points to 12." },'''),
]

# per lesson: the family, its steps, the check's finish() as the file writes it,
# the stickers marker the blocks go in front of, and the shelf lines to replace
PLAN = {
    "counting-to-twenty.html": dict(
        fam="num", steps=COUNTING, help=NUM_HELP, css=CSS_BASE + CSS_NUM,
        check='finish(%d, "You got " + right12',
        stick="  /* ---- 13: stickers ---- */\n",
        shelf_old='    const got = done.slice(0, 17).filter(Boolean).length;\n'
                  '    $("fb13").className = "fb " + (got === 30 ? "good" : ""); $("fb13").textContent = got === 30 ? "All 30 stickers! You are a number star." : got + " of 30 stickers so far.";\n',
        shelf_new='    /* ehel-second-steps: counted from STICKERS. It said "of 30", the total of the page this lesson was cut from */\n'
                  '    const all = STICKERS.length, got = done.slice(0, all).filter(Boolean).length;\n'
                  '    $("fb13").className = "fb " + (got === all ? "good" : ""); $("fb13").textContent = got === all ? "All " + all + " stickers! You are a number star." : got + " of " + all + " stickers so far.";\n'),
    "adding-and-taking-away.html": dict(
        fam="num", steps=ADDING, help=NUM_HELP, css=CSS_BASE + CSS_NUM,
        check='finish(%d, "You got " + right12',
        stick="  /* ---- 13: stickers ---- */\n",
        shelf_old='    const got = done.slice(0, 9).filter(Boolean).length;\n'
                  '    $("fb13").className = "fb " + (got === 30 ? "good" : ""); $("fb13").textContent = got === 30 ? "All 30 stickers! You are a number star." : got + " of 30 stickers so far.";\n',
        shelf_new='    /* ehel-second-steps: counted from STICKERS. It said "of 30", the total of the page this lesson was cut from */\n'
                  '    const all = STICKERS.length, got = done.slice(0, all).filter(Boolean).length;\n'
                  '    $("fb13").className = "fb " + (got === all ? "good" : ""); $("fb13").textContent = got === all ? "All " + all + " stickers! You are a number star." : got + " of " + all + " stickers so far.";\n'),
    "shapes-and-sizes.html": dict(
        fam="shape", steps=SHAPES, help=SHAPE_HELP, css=CSS_BASE + CSS_SHAPE,
        check='finish(%d, "Well done!")',
        stick="  /* ---- stickers ---- */\n",
        shelf_old='    const got = done.slice(0, 11).filter(Boolean).length;\n'
                  '    $("fbstick").className = "fb " + (got === 15 ? "good" : "");\n'
                  '    $("fbstick").textContent = got === 15 ? "All 15 stickers! You are a shape star." : got + " of 15 stickers so far.";\n',
        shelf_new='    /* ehel-second-steps: counted from STICKERS. It said "of 15", the total of the page this lesson was cut from */\n'
                  '    const all = STICKERS.length, got = done.slice(0, all).filter(Boolean).length;\n'
                  '    $("fbstick").className = "fb " + (got === all ? "good" : "");\n'
                  '    $("fbstick").textContent = got === all ? "All " + all + " stickers! You are a shape star." : got + " of " + all + " stickers so far.";\n'),
    "days-months-and-clocks.html": dict(
        fam="shape", steps=DAYS, help=DAY_HELP, css=CSS_BASE + CSS_DAY,
        check='finish(%d, "Well done!")',
        stick="  /* ---- stickers ---- */\n",
        shelf_old='    const got = done.slice(0, 5).filter(Boolean).length;\n'
                  '    $("fbstick").className = "fb " + (got === 15 ? "good" : "");\n'
                  '    $("fbstick").textContent = got === 15 ? "All 15 stickers! You are a shape star." : got + " of 15 stickers so far.";\n',
        shelf_new='    /* ehel-second-steps: counted from STICKERS. It said "of 15" and "a shape star", from the page this lesson was cut from */\n'
                  '    const all = STICKERS.length, got = done.slice(0, all).filter(Boolean).length;\n'
                  '    $("fbstick").className = "fb " + (got === all ? "good" : "");\n'
                  '    $("fbstick").textContent = got === all ? "All " + all + " stickers! You are a time star." : got + " of " + all + " stickers so far.";\n'),
}

FINISH = "  function finish(i, msg) {"
STICK_TAIL = '    ["✅", "Show what I know"],\n  ];'
CHECK_BADGE = '<span class="n">✓</span>'


def audit(st):
    """Refuse text that would break the markup or the checker's reading of it."""
    for k in ("say", "prompt", "title", "done"):
        assert '"' not in st[k], "%s: a double quote in %s" % (st["code"], k)
    assert "'" not in st["explain"], "%s: an apostrophe inside the single-quoted data-explain" % st["code"]
    assert ">" not in st["title"] and "<" not in st["title"], "%s: markup in the title" % st["code"]
    assert "\\" not in st["items"], "%s: a backslash in the items" % st["code"]
    oks = re.findall(r"ok: (true|false)", st["items"])
    asks = re.findall(r'\{ ask: "', st["items"])
    assert asks and oks.count("true") == len(asks), \
        "%s: %d questions but %d right answers" % (st["code"], len(asks), oks.count("true"))
    for m in re.finditer(r"opts: \[(.*?)\],\n", st["items"]):
        ts = re.findall(r'\{ t: "([^"]*)", ok: (?:true|false) \}', m.group(1))
        assert len(ts) == len(set(ts)) >= 2, "%s: repeated or missing options %r" % (st["code"], ts)
        assert m.group(1).count("ok: true") == 1, "%s: not exactly one right option %r" % (st["code"], ts)


def section(n, st, fam):
    sc = ('<p class="score" id="ss%dsc"></p>' % n) if fam == "shape" else \
         ('<p class="fb" id="ss%dsc" style="font-size:18px;color:var(--muted)"></p>' % n)
    return ('<!-- %d  %s  %s -->\n'
            '<section class="slide" data-explain=\'%s\' data-say="%s">\n'
            '      <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>\n'
            '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button>'
            '<span id="ss%dsay">%s</span></div>\n'
            '      <div class="stage" id="ss%dst"></div>\n'
            '      <div class="choices" id="ss%dch"></div>\n'
            '      <p class="fb" id="ss%dfb" role="status" aria-live="polite"></p>\n'
            '      <div class="bigbtns"><button type="button" class="big small teal" id="ss%dnx" hidden>Next question</button></div>\n'
            '      %s\n'
            '    </section>\n') % (n, st["code"], st["title"], st["explain"], st["say"], n, st["title"],
                                   n, st["prompt"], n, n, n, n, sc)


def block(n, idx, st):
    flash = ("\n    flash: %d," % st["flash"]) if st.get("flash") else ""
    return ('  /* ---- %d: %s - a second step for %s ---- */\n'
            '  secondStep({\n'
            '    el: { say: $("ss%dsay"), stage: $("ss%dst"), ch: $("ss%dch"), fb: $("ss%dfb"), score: $("ss%dsc"), next: $("ss%dnx") },\n'
            '    label: "%s",%s\n'
            '    items: [%s\n'
            '    ],\n'
            '    finish: %d,\n'
            '    done: "%s",\n'
            '  });\n\n') % (n, st["title"].lower().rstrip("?"), st["code"], n, n, n, n, n, n,
                            st["label"], flash, st["items"], idx, st["done"])


done = skipped = refused = 0
for name, plan in PLAN.items():
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    for st in plan["steps"]:
        audit(st)
    badges = [int(x) for x in re.findall(r'<span class="n">(\d+)</span>', s)]
    teach = len(badges)
    add = len(plan["steps"])
    bad = []
    if badges != list(range(1, teach + 1)):
        bad.append("step badges do not run 1..%d" % teach)
    for label, needle, want in (("check badge", CHECK_BADGE, 1), ("finish()", FINISH, 1),
                                ("stickers marker", plan["stick"], 1), ("sticker shelf tail", STICK_TAIL, 1),
                                ("shelf count lines", plan["shelf_old"], 1),
                                ("check finish(%d)" % teach, plan["check"] % teach, 1)):
        if s.count(needle) != want:
            bad.append("%s found %d times" % (label, s.count(needle)))
    stickers = re.search(r"const STICKERS = \[(.*?)\];", s, re.S)
    if not stickers or len(re.findall(r'\["', stickers.group(1))) != teach + 1:
        bad.append("STICKERS does not hold one per step plus the check")
    if not re.search(r"</(script|style)>\s*$", s):
        bad.append("page does not end on </script> or </style>")
    if bad:
        print("  REFUSED  %s  %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    first = teach + 1
    # 1. the slides, in front of the check
    at = s.rindex('<section class="slide"', 0, s.index(CHECK_BADGE))
    s = s[:at] + "".join(section(first + k, st, plan["fam"]) for k, st in enumerate(plan["steps"])) + s[at:]
    # 2. the runner and this lesson's pictures, in the prelude
    eol = s.index("\n", s.index(FINISH))
    s = s[:eol + 1] + RUNNER.lstrip("\n").replace("  /* ==== ehel-second-steps", "\n  /* ==== " + MARK, 1) + plan["help"] + s[eol + 1:]
    # 3. the steps' blocks, after the check's code and before the stickers'
    s = s.replace(plan["stick"], "".join(block(first + k, teach + k, st)
                                         for k, st in enumerate(plan["steps"])) + plan["stick"], 1)
    # 4. the check moves along by the steps added
    s = s.replace(plan["check"] % teach, plan["check"] % (teach + add), 1)
    # 5. one sticker per new step, before the check's
    s = s.replace(STICK_TAIL, "".join('    ["%s", "%s"],\n' % st["sticker"] for st in plan["steps"]) + STICK_TAIL, 1)
    # 6. the shelf counts its stickers instead of quoting another page's total
    s = s.replace(plan["shelf_old"], plan["shelf_new"], 1)
    # 7. the classes the pictures use
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-second-steps.py */\n" + plan["css"] + "</style>\n"

    assert s.count(MARK) >= 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-28s steps %d-%d added, the check is now finish(%d)"
          % ("wrote   " if WRITE else "would   ", name, first, first + add - 1, teach + add))
    done += 1

print("\n  %s: %d lesson(s) given second steps, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)

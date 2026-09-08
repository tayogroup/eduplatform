  /* ==================================================================
     THE DECK - lifted verbatim from mathematics/grade-1-app/g1v2 with
     the two progress hooks REMOVED, because the shared progress step in
     lesson-app-tools puts them back and its anchors only match the
     unwired shape. Do not re-add them by hand: the gate asserts the
     call sites, and a second copy would report every step twice.

     Do not name that tool's FILE anywhere in a generated page either.
     Its own filename is the marker it tests for idempotence, so a
     comment mentioning it makes the tool skip a page it has never
     touched - and the page then ships reporting nothing, silently.
     This comment used to do exactly that.
     ================================================================== */
  const $ = (id) => document.getElementById(id);
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cheer = () => ["Yes!", "Well done!", "Super!", "That's it!", "Brilliant!"][rnd(0, 4)];
  const plain = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();


  /* ---- deck ---- */
  const slides = [...document.querySelectorAll(".slide")];
  const done = new Array(slides.length).fill(false);
  let cur = 0;
  function paintDots() {
    $("dots").innerHTML = slides.map((s, i) => '<button type="button" class="' + (i === cur ? "now" : done[i] ? "done" : "") + '" data-i="' + i + '" aria-label="Step ' + (i + 1) + '"></button>').join("");
  }
  function show(i, speak) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    $("back").disabled = cur === 0;
    $("next").disabled = cur === slides.length - 1;
    $("where").textContent = cur === slides.length - 1 ? "The end" : "Step " + (cur + 1) + " of " + (slides.length - 1);
    paintDots();
    if (cur === slides.length - 1) paintStickers();
    if (speak) say(slides[cur].dataset.say);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("next").addEventListener("click", () => show(cur + 1, true));
  $("back").addEventListener("click", () => show(cur - 1, true));
  $("dots").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(Number(b.dataset.i), true); });
  document.querySelectorAll(".speak").forEach((b) => b.addEventListener("click", () => say(b.parentElement.querySelector("span").textContent)));
  function finish(i, msg) { if (!done[i]) { done[i] = true; paintDots(); } if (msg) say(msg); }

  /* Hand a score to the progress client, if this page has one.
     NAMING THE PIPELINE TOOL HERE BREAKS THE BUILD, which is why this comment
     talks around it. Each shared step uses its own filename as its
     idempotence marker and skips any page already containing it - so a
     comment mentioning the progress step made all ten pages read as "already
     reports", and they shipped with no progress block at all. Made once
     earlier in this build and made again here; the tell is the step printing
     "skip ... already reports" on a page it has never touched. */
  function reportScore(i, right, total, sub, subTitle) {
    if (window.__ehelScore) { try { window.__ehelScore(i, right, total, sub, subTitle); } catch (_) { /* never break the lesson */ } }
  }
  /* Participation, where the step asked something but marked nothing. */
  function reportAttempt(i, answered, total) {
    if (window.__ehelAttempt) { try { window.__ehelAttempt(i, answered, total); } catch (_) { /* same */ } }
  }
  /* A word the learner picked correctly for a sound or a picture - the one
     place this build has direct evidence that a word is known. */
  function reportKnown(words) {
    if (window.__ehelKnown) { try { window.__ehelKnown(words); } catch (_) { /* same */ } }
  }

  /* ---- one question after another ---- */
  function sequence(o) {
    let i = 0, right = 0, lock = false;
    const el = o.el;
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.say).innerHTML = it.ask;
      $(el.stage).innerHTML = it.pic || "";
      $(el.ch).innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice' + (o.smallOpts ? " small" : "") + '" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = (o.label || "Question") + " " + (i + 1) + " of " + o.items.length;
      /* A WAY BACK TO THE TEXT THE QUESTIONS ARE ABOUT. The unit story used
         to be the step immediately before this one. It was removed on
         2026-09-08 as a duplicate of the same story on the book shelf, and
         that left these questions with nothing to go back to and an
         instruction - "go back a step" - that then pointed at Games.

         The book opens RIGHT HERE rather than sending a five-year-old eight
         steps back to pick the right one out of seven. Same reader as the
         shelf (openBookReader), so the tap sounds and Listen come with it. */
      if (o.readAgain && o.readAgain.id && el.again) {
        $(el.stage).innerHTML = '<div class="bigbtns"><button type="button" class="big small ghost" id="'
          + el.again + '">\u{1F4D6} Read the story again</button></div>';
        const back = $(el.again);
        if (back) back.addEventListener("click", () => {
          const book = (o.readAgain.books || []).find((b) => b.id === o.readAgain.id);
          if (book) openBookReader(book, null);
        });
      }
      say(plain(it.ask));
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1", it = o.items[i];
      $(el.ch).querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = (ok ? cheer() + " " : "") + it.why;
      say((ok ? cheer() + " " : "") + it.why);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          reportScore(o.finish, right, o.items.length);
          finish(o.finish, o.done);
        } else draw();
      }, 2700);
    });
    draw();
  }
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
          finish(o.finish, o.done);
        } else draw();
      }, 2700);
    });
    draw();
  }
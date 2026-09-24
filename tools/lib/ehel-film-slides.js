
  /* ==== the slide driver ====================================================
     Appended AFTER the engine tail, and only when the page is built with
     --slides. It turns the same film into something a learner steps through
     at their own pace: one beat per slide, Back and Next, and the beat's own
     animation replayed on arrival rather than a frozen still.

     NOTHING IN THE ENGINE IS TOUCHED. The tail already ends by publishing

         window.EHEL_FILM = { frame: frame, total: TOTAL, cues: cues }

     and that is the whole contract this needs: frame(t) draws the film at
     any moment, cues(i) gives beat i's start and the moment its narration
     stops. Every film in the repo satisfies it, so this driver works for all
     of them, not just this one.

     WHY THE BEAT IS ANIMATED RATHER THAN FROZEN. A still has to be taken at
     some instant, and there is no instant that is right for every beat: at
     the moment the words stop, the halving joint in beat 2 has not finished
     closing, and "the two faces come together level" is the one thing that
     beat is for. Replaying the beat sidesteps the choice and is a better
     lesson anyway - the learner watches the plane travel, the saw cut and
     the joint close, as many times as they like.

     WHY THE HOLD TIME IS MEASURED AND NOT ASSUMED. After the narration stops
     a beat still has a gap before the next one, and some scenes keep moving
     into it while others have already begun to fade or have switched scene
     entirely - measured on the halving-joint film, 16 of 30 beats look
     different at the end of the beat than at the end of the words, and two
     render nothing at all there. So the driver finds, once at load, the last
     moment that still belongs to this beat, by asking the page: it steps
     forward while the narration band still reads as this beat's line. That
     is self-correcting, needs no per-film tuning, and cannot be wrong in the
     way a hand-picked offset can. */
  (function () {
    if (!window.EHEL_FILM || !window.FILM || !window.FILM.beats) return;

    var EF = window.EHEL_FILM;
    var BE = window.FILM.beats;
    var N = BE.length;
    var film = document.getElementById("film");

    /* The page's own stylesheet is the FILM's, and knows nothing about a
       learner pressing Next. These are the only rules the driver adds. */
    var css = document.createElement("style");
    css.textContent =
      /* The film's own stylesheet pins `body { width: 1280px; height: 720px }`,
         because a render page IS exactly one frame and never anything else.
         In a lesson iframe that is wrong twice over: the body stays 1280 wide
         however narrow the frame is, so everything centres inside 1280 and
         lands off to one side, with the narration band's first words past the
         left edge. Released here, and NOT by editing the film's stylesheet,
         which every other film still depends on. */
      "html,body{width:100%;min-width:0;max-width:100%;height:100%;" +
        "overflow:hidden;background:#0b1720}" +
      "body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin:0}" +
      /* overflow:hidden is load-bearing. A transform does NOT change layout
         size, so #film stays 1280 x 720 in the flow however small it is
         drawn; without clipping it here, that box overflows the flex column
         and drags the centring, which crops the narration band's first words
         off the left edge. */
      ".sl-fit{position:relative;flex:0 0 auto;overflow:hidden}" +
      ".sl-bar{display:flex;align-items:center;gap:10px;font:600 15px/1 Inter,system-ui,sans-serif}" +
      ".sl-bar button{font:inherit;padding:9px 16px;border-radius:999px;border:1px solid #2f4a5c;" +
        "background:#162836;color:#dbe9f2;cursor:pointer}" +
      ".sl-bar button:hover:not(:disabled){border-color:#4fbfa8;color:#fff}" +
      ".sl-bar button:disabled{opacity:.38;cursor:default}" +
      ".sl-bar #slCount{color:#8fa8b8;min-width:104px;text-align:center;font-variant-numeric:tabular-nums}" +
      "@media (prefers-reduced-motion:reduce){.sl-bar button{transition:none}}";
    document.head.appendChild(css);

    /* ---- fit the film to whatever it is shown in -------------------------
       The film is drawn at a fixed 1280 x 720. In a lesson it sits in an
       iframe that is rarely either. Scale it, rather than letting it spill
       or shrink to a corner. */
    var stageWrap = document.createElement("div");
    stageWrap.className = "sl-fit";
    film.parentNode.insertBefore(stageWrap, film);
    stageWrap.appendChild(film);

    function fit() {
      var s = Math.min(innerWidth / 1280, (innerHeight - 76) / 720);
      film.style.transformOrigin = "0 0";
      film.style.transform = "scale(" + s.toFixed(4) + ")";
      stageWrap.style.width = Math.round(1280 * s) + "px";
      stageWrap.style.height = Math.round(720 * s) + "px";
    }
    /* `resize` alone is not enough. In an iframe the first layout can happen
       AFTER the script runs, so a single fit() at init measures a viewport
       that is about to change and scales the film too large — it then sits
       cropped, and the narration band loses its first words off the left
       edge. Observe the element instead of trusting one measurement. */
    addEventListener("resize", fit);
    addEventListener("load", fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(document.documentElement);

    /* ---- what each beat's last frame is ---------------------------------
       Asked of the page, not assumed. bandOf(t) is the narration line the
       engine paints at t; while that still matches beat i's line, t is still
       beat i. */
    function bandOf(t) {
      EF.frame(t);
      var b = film.querySelector(".band");
      return b ? b.textContent.replace(/\s+/g, " ").trim() : "";
    }

    var HOLD = [];
    (function measureHolds() {
      for (var i = 0; i < N; i++) {
        var c = EF.cues(i);
        var mine = bandOf(c.spokenEnd - 0.05);
        var limit = (i < N - 1 ? EF.cues(i + 1).start : EF.total) - 0.05;
        var t = c.spokenEnd - 0.05, best = t;
        while (t < limit) {
          t += 0.1;
          if (bandOf(t) !== mine) break;
          best = t;
        }
        HOLD.push(best);
      }
    })();

    /* ---- the controls ---------------------------------------------------- */
    var bar = document.createElement("div");
    bar.className = "sl-bar";
    bar.innerHTML =
      '<button type="button" id="slBack" aria-label="Previous slide">&#8592; Back</button>' +
      '<button type="button" id="slAgain" aria-label="Play this slide again">&#8635; Again</button>' +
      '<span id="slCount" aria-live="polite"></span>' +
      '<button type="button" id="slNext" aria-label="Next slide">Next &#8594;</button>';
    document.body.appendChild(bar);

    var back = document.getElementById("slBack");
    var again = document.getElementById("slAgain");
    var next = document.getElementById("slNext");
    var count = document.getElementById("slCount");

    /* ---- playing one beat ------------------------------------------------ */
    var at = 0, raf = 0;

    function play(i) {
      cancelAnimationFrame(raf);
      at = i;
      var from = BE[i].start, to = HOLD[i];
      var t0 = performance.now();
      (function step(now) {
        var t = from + (now - t0) / 1000;
        if (t >= to) { EF.frame(to); paint(); return; }
        EF.frame(t);
        raf = requestAnimationFrame(step);
      })(t0);
      paint();
    }

    function paint() {
      count.textContent = "Slide " + (at + 1) + " of " + N;
      back.disabled = at === 0;
      next.disabled = at === N - 1;
      next.textContent = at === N - 1 ? "The end" : "Next →";
    }

    back.addEventListener("click", function () { if (at > 0) play(at - 1); });
    next.addEventListener("click", function () { if (at < N - 1) play(at + 1); });
    again.addEventListener("click", function () { play(at); });
    addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" && at < N - 1) play(at + 1);
      else if (e.key === "ArrowLeft" && at > 0) play(at - 1);
      else if (e.key === " ") { e.preventDefault(); play(at); }
    });

    /* Land on a slide WITHOUT replaying it: the beat's last frame, at once.
       A learner pressing Next wants to watch the plane travel and the joint
       close, so play() is the default — but a page deep-linking to slide 18
       should not make them sit through seven seconds first, and a check
       wanting the settled picture should not have to sleep for it. */
    function settle(i) {
      cancelAnimationFrame(raf);
      at = Math.max(0, Math.min(N - 1, i | 0));
      EF.frame(HOLD[at]);
      paint();
    }

    /* A lesson page asks for a slide by number: the step that embeds this
       can deep-link, and the film answers. */
    addEventListener("message", function (e) {
      var d = e.data || {};
      if (d.ehelSlide != null) (d.settle ? settle : play)(Math.max(0, Math.min(N - 1, d.ehelSlide | 0)));
    });

    window.EHEL_SLIDES = { play: play, settle: settle, count: N, hold: HOLD, at: function () { return at; } };

    fit();
    play(0);
  })();

  /* ==================================================================
     THE ENGLISH ACTIVITIES

     The Mathematics build's own rounds are one function per idea, each
     drawing into one slide's ids and calling finish(i) when the child has
     done the thing. These are the same shape, and the reason there are
     eight of them rather than one generic renderer is the same reason
     there are eight there: a step is a KIND of doing, and a renderer that
     covers every kind covers none of them well.

     What differs from Mathematics is where the sound comes from. Maths has
     no recordings, so every line is spoken by the voice engine. English
     has 93,065 committed clips of this exact content read by the approved
     Ehel voice, so a word, a story, a rule and a model sentence are PLAYED,
     and the voice engine is left to do what only it can - react to what the
     child just did, and read an instruction that nobody recorded.

     playClip() therefore falls back to say() rather than failing silently:
     a missing clip costs the child the recording, not the instruction.
     ================================================================== */

  /* ---- where a clip lives -----------------------------------------
     Descriptors in the unit JSON carry the course's own dev path
     (./media/audio/grade-1/<category>/<file>.mp3). Two things have to
     happen to it here, and both are shell/subjects/english.js's rules
     rather than new ones:

       - on the CDN the media tree is at the zone root, not beside the
         app, so the path is rewritten the way resolveMediaUrl does. One
         extra ../ over the shell's, because this build sits one level
         deeper than app/english/index.html.
       - the ?a= stamp is what makes a REPAIRED recording reach a child
         who already heard the broken one: English names its clips for
         their content, so a re-recording keeps its URL, and Bunny serves
         media max-age=31536000 with no ETag. The stamp is read out of
         english.js at build time so this build cannot drift behind it.

     "Dev" is the same test english.js makes - the hostname, not the path -
     so a lesson opened from a file:// URL or an artifact resolves as
     production and simply finds nothing, which is the honest answer.
     ------------------------------------------------------------------ */
  const AUDIO_IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
  function clip(source) {
    if (!source) return "";
    let s = String(source).replace(/^\.\//, "");
    if (AUDIO_IS_DEV) return "../" + s;
    const m = s.match(/media\/audio\/grade-(\d+)\/([a-z]+)\/(.+)$/i);
    if (!m) return "../" + s;
    return "../../../media/english/g" + String(m[1]).padStart(2, "0") +
      "/audio/" + m[2] + "/" + m[3] + "?a=" + LESSON.audioRelease;
  }

  /* One element, because two would talk over each other - the same reason
     the class controls are singletons. A clip that cannot be played hands
     the words to the voice engine instead. */
  const player = new Audio();
  player.preload = "none";
  function playClip(source, spokenFallback) {
    const url = clip(source);
    if (!url) { if (spokenFallback) say(spokenFallback); return Promise.resolve(false); }
    try { VOICE.stop && VOICE.stop(); } catch (_) { /* the voice may be mid-sentence */ }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => { if (settled) return; settled = true; resolve(ok); };
      player.onended = () => finish(true);
      player.onerror = () => { if (spokenFallback) say(spokenFallback); finish(false); };
      player.src = url;
      const p = player.play();
      if (p && p.catch) p.catch(() => { if (spokenFallback) say(spokenFallback); finish(false); });
    });
  }

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const picOf = (w) => (w.pic ? '<span class="pic" aria-hidden="true">' + w.pic + "</span>" : "");

  /* ---- a clip belongs to a slide, and every slide is in the DOM ----
     Every renderer draws once, at load, because the deck paints all its
     slides and hides them with CSS. So an unguarded auto-play on draw fires
     EVERY step's first clip the moment the page opens - measured: three
     recordings racing for one <audio> element before the child has done
     anything. They share the player, so the last one wins and a five-year-old
     hears a grammar rule read over a step they cannot see.

     Two halves to the fix, and both are needed. playHere() refuses to play
     for a slide that is not the one on screen, and ONSHOW gives a step a way
     to say its line when the learner actually arrives at it - otherwise
     silencing the load would silence the step for good.

     show() is wrapped rather than edited: it is lifted verbatim from the
     Mathematics build and the shared progress step patches it by matching
     its exact text. The header-bar step wraps it again afterwards for the
     same reason. (Neither of those tools is named here on purpose - see
     the note in the deck section.)
     ------------------------------------------------------------------ */
  const ONSHOW = [];
  const showWithoutClips = show;
  show = function (i, speak) {
    showWithoutClips(i, speak);
    const f = ONSHOW[cur];
    if (f) { try { f(); } catch (_) { /* a step must never break the deck */ } }
  };
  function playHere(idx, source, fallback) {
    if (cur === idx) playClip(source, fallback);
  }
  /* show(i, true) speaks the slide's data-say - the instruction - and the
     recording is the thing the instruction is about, so playing it straight
     away cuts the instruction off mid-sentence (playClip stops the voice on
     purpose, so the two cannot overlap either). Wait for her to finish, with
     a ceiling so a voice that never reports finishing cannot leave the step
     silent. */
  function afterVoice(fn) {
    let waited = 0;
    const t = setInterval(() => {
      waited += 200;
      if (!VOICE.speaking() || waited > 12000) { clearInterval(t); fn(); }
    }, 200);
  }

  /* ---- hear the word, tap the word --------------------------------
     The clip plays on its own, then the child picks. The distractors are
     other words from THIS unit, so a wrong tap is a word they are also
     learning rather than a word invented to be wrong.

     Pictures ride on the buttons where every option has one. Where any
     option is bare the whole round goes to words alone: a set where three
     choices carry a picture and one does not tells the child which one is
     the odd one out without their reading anything.
     ------------------------------------------------------------------ */
  function hearAndTap(o) {
    let i = 0, right = 0, lock = false;
    const el = o.el;
    function draw() {
      lock = false;
      const it = o.items[i];
      const opts = shuffle(it.opts);
      const withPics = opts.every((c) => c.pic);
      $(el.ask).innerHTML = o.ask || "Which word did you hear?";
      $(el.stage).innerHTML =
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.replay +
        '">&#128266; Hear it again</button></div>';
      $(el.ch).className = "wordbtns";
      $(el.ch).innerHTML = opts.map((c) =>
        '<button type="button" class="wordbtn" data-ok="' + (c.ok ? 1 : 0) + '">' +
        (withPics ? picOf(c) : "") + esc(c.w) + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = (o.label || "Word") + " " + (i + 1) + " of " + o.items.length;
      $(el.replay).addEventListener("click", () => playClip(it.audio, it.w));
      ONSHOW[o.finish] = () => afterVoice(() => playClip(it.audio, it.w));
      playHere(o.finish, it.audio, it.w);
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".wordbtn"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1", it = o.items[i];
      $(el.ch).querySelectorAll(".wordbtn").forEach((c) => {
        c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = ok ? cheer() + " " + it.w : "That word was " + it.w + ".";
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          $(el.stage).innerHTML = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          finish(o.finish, o.done);
        } else draw();
      }, 2200);
    });
    draw();
  }

  /* ---- the picture is the question, the word is the answer --------- */
  function pictureMatch(o) {
    let i = 0, right = 0, lock = false;
    const el = o.el;
    function draw() {
      lock = false;
      const it = o.items[i];
      $(el.ask).innerHTML = o.ask || "Which word is this?";
      $(el.stage).innerHTML = '<div class="askpic" aria-hidden="true">' + it.pic + "</div>";
      $(el.ch).className = "wordbtns";
      $(el.ch).innerHTML = shuffle(it.opts).map((c) =>
        '<button type="button" class="wordbtn" data-ok="' + (c.ok ? 1 : 0) + '">' + esc(c.w) + "</button>").join("");
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      $(el.score).textContent = (o.label || "Picture") + " " + (i + 1) + " of " + o.items.length;
    }
    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".wordbtn"); if (!b || lock) return;
      lock = true;
      const ok = b.dataset.ok === "1", it = o.items[i];
      $(el.ch).querySelectorAll(".wordbtn").forEach((c) => {
        c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = ok ? cheer() + " " + it.w : "It is " + it.w + ".";
      playClip(it.audio, it.w);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.stage).innerHTML = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          finish(o.finish, o.done);
        } else draw();
      }, 2200);
    });
    draw();
  }

  /* ---- one word at a time: the picture, the word, what it means ----
     Not a test. The child presses Next when they have said it, and the
     step is finished by reaching the end rather than by being right about
     anything - there is nothing here to be right about yet.
     ------------------------------------------------------------------ */
  function wordWalk(o) {
    let i = 0, si = 0;
    const el = o.el;
    // Cycling sentences within one word must NOT replay the word's own
    // audio - paint() redraws for both "next word" and "another sentence",
    // and only the FORMER should trigger it. Registered once per word in
    // draw(), not on every paint().
    function draw() {
      si = 0;
      const it = o.items[i];
      ONSHOW[o.finish] = () => afterVoice(() => playClip(it.audio, it.w));
      playHere(o.finish, it.audio, it.w);
      paint();
    }
    function paint() {
      const it = o.items[i];
      const sentences = it.sentences || [];
      $(el.ask).innerHTML = o.ask || "Say this word out loud.";
      $(el.stage).innerHTML =
        '<div class="wordcard">' +
        (it.pic ? '<div class="wordpic" aria-hidden="true">' + it.pic + "</div>"
                : '<div class="wordpic none" aria-hidden="true">&#128172;</div>') +
        '<div class="bigword">' + esc(it.w) + "</div>" +
        (it.pos ? '<div class="wordpos">' + esc(it.pos) + "</div>" : "") +
        (it.meaning ? '<p class="wordmeaning">' + esc(it.meaning) + "</p>" : "") +
        '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.replay +
        '">&#128266; Hear it</button></div>' +
        (sentences.length
          ? '<div class="wordsentencebox">' +
            '<p class="sentlabel">In a sentence &middot; ' + (si + 1) + " of " + sentences.length + "</p>" +
            '<p class="wordsentence">' + esc(sentences[si].text) + "</p>" +
            '<div class="bigbtns">' +
            '<button type="button" class="big small ghost" id="' + el.hearSent + '">&#128266; Hear the sentence</button>' +
            (sentences.length > 1
              ? '<button type="button" class="big small ghost" id="' + el.nextSent + '">Another sentence &#9654;</button>'
              : "") +
            "</div></div>"
          : "") +
        "</div>" +
        '<div class="bigbtns">' +
        '<button type="button" class="big small" id="' + el.next + '">' +
        (i === o.items.length - 1 ? "Done &#9654;" : "Next word &#9654;") + "</button></div>";
      $(el.score).textContent = (o.label || "Word") + " " + (i + 1) + " of " + o.items.length;
      $(el.replay).addEventListener("click", () => playClip(it.audio, it.w));
      if (sentences.length) {
        $(el.hearSent).addEventListener("click", () => playClip(sentences[si].audio, sentences[si].text));
        if (sentences.length > 1) {
          $(el.nextSent).addEventListener("click", () => { si = (si + 1) % sentences.length; paint(); });
        }
      }
      $(el.next).addEventListener("click", () => {
        i++;
        if (i >= o.items.length) {
          $(el.stage).innerHTML = "";
          $(el.score).textContent = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You met all " + o.items.length + " words. " + o.done;
          finish(o.finish, o.done);
        } else draw();
      });
    }
    draw();
  }

  /* ---- the story, a page at a time, read by the recording ----------
     ONE recording covers the whole text, which is why the shell's e-book
     refuses to put a Listen button on page four - it would start the story
     from the beginning. Here the pages are only a way of not showing a
     five-year-old nineteen paragraphs at once, and Listen is offered ONCE,
     on the page that starts the story. The line being looked at is lit in
     gold, the same "you are here" the dot rail uses.
     ------------------------------------------------------------------ */
  function storyRead(o) {
    let page = 0;
    const el = o.el;
    function draw() {
      const p = o.pages[page];
      $(el.ask).innerHTML = page === 0
        ? "Press Listen, then follow the words with your finger."
        : "Keep reading. Press Next when you are ready.";
      $(el.stage).innerHTML =
        (page === 0 ? '<div class="storytitle">' + esc(o.title) + "</div>" : "") +
        '<div class="story">' + p.map((t) => "<p>" + esc(t) + "</p>").join("") + "</div>" +
        '<div class="bigbtns">' +
        (page === 0
          ? '<button type="button" class="big small teal" id="' + el.replay + '">&#128266; Listen to the story</button>'
          : "") +
        '<button type="button" class="big small" id="' + el.next + '">' +
        (page === o.pages.length - 1 ? "I have read it &#9654;" : "Next page &#9654;") + "</button></div>";
      $(el.score).textContent = "Page " + (page + 1) + " of " + o.pages.length;
      if (page === 0) $(el.replay).addEventListener("click", () => playClip(o.audio, ""));
      $(el.next).addEventListener("click", () => {
        page++;
        if (page >= o.pages.length) {
          $(el.stage).innerHTML = "";
          $(el.score).textContent = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = o.done;
          finish(o.finish, o.done);
        } else draw();
      });
    }
    draw();
  }

  /* ---- what English does, one rule at a time ----------------------
     The pattern in gold is the thing to remember; the two notes under it
     are the unit's own commonMistake and memoryTip, which is teaching a
     Grade 1 child cannot get from an example alone.
     ------------------------------------------------------------------ */
  function ruleWalk(o) {
    let i = 0;
    const el = o.el;
    function draw() {
      const it = o.items[i];
      $(el.ask).innerHTML = esc(it.title);
      $(el.stage).innerHTML =
        '<div class="rule">' +
        (it.pattern ? '<div class="rulepattern">' + esc(it.pattern) + "</div>" : "") +
        (it.explanation ? "<p>" + esc(it.explanation) + "</p>" : "") +
        (it.mistake ? '<div class="note watch"><b>Watch out.</b> ' + esc(it.mistake) + "</div>" : "") +
        (it.tip ? '<div class="note"><b>Remember.</b> ' + esc(it.tip) + "</div>" : "") +
        (it.practice ? '<div class="note"><b>Your turn.</b> ' + esc(it.practice) + "</div>" : "") +
        "</div>" +
        '<div class="bigbtns">' +
        '<button type="button" class="big small teal" id="' + el.replay + '">&#128266; Hear it</button>' +
        '<button type="button" class="big small" id="' + el.next + '">' +
        (i === o.items.length - 1 ? "Done &#9654;" : "Next &#9654;") + "</button></div>";
      $(el.score).textContent = "Rule " + (i + 1) + " of " + o.items.length;
      $(el.replay).addEventListener("click", () => playClip(it.audio, it.explanation));
      $(el.next).addEventListener("click", () => {
        i++;
        if (i >= o.items.length) {
          $(el.stage).innerHTML = ""; $(el.score).textContent = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = o.done;
          finish(o.finish, o.done);
        } else draw();
      });
      ONSHOW[o.finish] = () => afterVoice(() => playClip(it.audio, it.explanation));
      playHere(o.finish, it.audio, it.explanation);
    }
    draw();
  }

  /* ---- say it out loud --------------------------------------------
     Nothing here can be marked, and the page does not pretend otherwise.
     The child hears the model and ticks that they said it; the tick is a
     record of having done it, not a score. Same rule the unit recap keeps
     about self-assessment - an unmeasured claim is not put on a child's
     page as if it were measured.
     ------------------------------------------------------------------ */
  function sayOutLoud(o) {
    const el = o.el;
    const said = new Array(o.items.length).fill(false);
    $(el.ask).innerHTML = o.ask || "Listen, then say it out loud.";
    $(el.stage).innerHTML = '<div class="saylines">' + o.items.map((it, k) =>
      '<div class="sayline" data-k="' + k + '">' +
      '<button type="button" class="hear" aria-label="Hear this line">&#128266;</button>' +
      "<span>" + esc(it.text) + "</span>" +
      '<button type="button" class="tick">I said it</button></div>').join("") + "</div>";
    $(el.score).textContent = "0 of " + o.items.length + " said";
    $(el.stage).addEventListener("click", (e) => {
      const row = e.target.closest(".sayline"); if (!row) return;
      const k = Number(row.dataset.k);
      if (e.target.closest(".hear")) { playClip(o.items[k].audio, o.items[k].text); return; }
      if (!e.target.closest(".tick")) return;
      said[k] = true;
      row.classList.add("said");
      row.querySelector(".tick").textContent = "✓ said";
      const n = said.filter(Boolean).length;
      $(el.score).textContent = n + " of " + o.items.length + " said";
      if (n === o.items.length) {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = o.done;
        finish(o.finish, o.done);
      }
    });
  }

  /* ---- build the sentence by tapping words ------------------------
     The tiles are the model sentence's own words plus two the unit
     teaches, shuffled. Tapping a tile moves it to the line and tapping it
     again sends it back, because a five-year-old's first tap is often a
     mistake and there is no undo worse than starting again.
     ------------------------------------------------------------------ */
  function buildSentence(o) {
    const el = o.el;
    let line = [];
    function draw() {
      const used = line.slice();
      $(el.ask).innerHTML = esc(o.ask);
      $(el.stage).innerHTML =
        '<div class="build">' +
        '<div class="buildline" id="' + el.line + '">' +
        (line.length ? line.map((t, k) => '<button type="button" class="tile" data-line="' + k + '">' + esc(t) + "</button>").join("")
                     : '<span style="color:var(--muted);font-size:17px">Tap the words to build the sentence.</span>') +
        "</div>" +
        '<div class="bigbtns" id="' + el.tiles + '">' +
        o.tiles.map((t, k) => used.includes(t) && used.filter((x) => x === t).length >= o.tiles.filter((x) => x === t).length
          ? "" : '<button type="button" class="tile" data-tile="' + k + '">' + esc(t) + "</button>").join("") +
        "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + el.check + '">Check it</button>' +
        '<button type="button" class="big small ghost" id="' + el.clear + '">Start again</button></div>' +
        "</div>";
      $(el.tiles).addEventListener("click", (e) => {
        const b = e.target.closest("[data-tile]"); if (!b) return;
        line.push(o.tiles[Number(b.dataset.tile)]); draw();
      });
      $(el.line).addEventListener("click", (e) => {
        const b = e.target.closest("[data-line]"); if (!b) return;
        line.splice(Number(b.dataset.line), 1); draw();
      });
      $(el.clear).addEventListener("click", () => { line = []; draw(); });
      $(el.check).addEventListener("click", () => {
        /* Both sides through the same tidy-up. The answer is a list of tiles
           joined with spaces, so it carries " ." exactly as the child's line
           does; normalising only the child's would make the step impossible
           to pass on every sentence that ends in a full stop, which is all of
           them. */
        const tidy = (s) => String(s).replace(/\s+([.!?])/g, "$1").replace(/\s+/g, " ").trim().toLowerCase();
        const got = tidy(line.join(" "));
        const want = tidy(o.answer);
        const ok = got === want;
        $(el.line).className = "buildline " + (ok ? "right" : "wrong");
        $(el.fb).className = "fb " + (ok ? "good" : "bad");
        /* the sentence read back to the child, not the tile list: "This is a
           chair ." is what the answer literally is, and it is not a sentence */
        const written = o.answer.replace(/\s+([.!?])/g, "$1").replace(/\s+/g, " ").trim();
        $(el.fb).textContent = ok ? cheer() + " " + written : "Not yet. Try the words in another order.";
        if (ok) finish(o.finish, o.done);
      });
    }
    draw();
  }

  /* ---- Memory Pairs: reveal on tap, connect word to meaning --------
     The pack's own description is "Reveal tiles and connect each word
     with its meaning", so tiles start face-down (a "?" back) and the tap
     reveals the text underneath - not just a plain tap-to-select grid.
     Round after round, the same shape every other step here uses; a round
     is done when its three pairs are all matched.
     ------------------------------------------------------------------ */
  function memoryPairs(o) {
    let r = 0;
    const el = o.el;
    function draw() {
      const round = o.items[r];
      let tiles = round.pairs.flatMap((p, pi) => [
        { text: p[0], pair: pi },
        { text: p[1], pair: pi },
      ]);
      tiles = shuffle(tiles).map((t, k) => ({ ...t, k }));
      let picked = [];
      let matched = 0;
      let lock = false;
      $(el.ask).innerHTML = round.prompt || "Tap two tiles that go together.";
      $(el.stage).innerHTML = '<div class="pairsgrid" id="' + el.grid + '"></div>';
      $(el.score).textContent = "Round " + (r + 1) + " of " + o.items.length;
      $(el.fb).textContent = ""; $(el.fb).className = "fb";
      const grid = $(el.grid);
      grid.innerHTML = tiles.map((t) =>
        '<button type="button" class="pairtile" data-k="' + t.k + '">' +
        '<span class="back" aria-hidden="true">?</span>' +
        '<span class="face">' + esc(t.text) + "</span></button>").join("");
      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".pairtile");
        if (!b || lock) return;
        const k = Number(b.dataset.k);
        if (b.classList.contains("matched") || b.classList.contains("revealed")) return;
        b.classList.add("revealed");
        picked.push({ k, pair: tiles[k].pair, el: b });
        if (picked.length < 2) return;
        lock = true;
        const [a, c] = picked;
        if (a.pair === c.pair) {
          a.el.classList.add("matched"); c.el.classList.add("matched");
          a.el.disabled = true; c.el.disabled = true;
          matched++;
          picked = []; lock = false;
          if (matched === round.pairs.length) {
            $(el.fb).className = "fb good";
            $(el.fb).textContent = cheer() + " Round " + (r + 1) + " matched.";
            setTimeout(() => {
              r++;
              if (r >= o.items.length) {
                $(el.stage).innerHTML = ""; $(el.score).textContent = "";
                $(el.fb).className = "fb good";
                $(el.fb).textContent = o.done;
                finish(o.finish, o.done);
              } else draw();
            }, 1100);
          }
        } else {
          a.el.classList.add("wrong"); c.el.classList.add("wrong");
          setTimeout(() => {
            a.el.classList.remove("revealed", "wrong");
            c.el.classList.remove("revealed", "wrong");
            picked = []; lock = false;
          }, 900);
        }
      });
    }
    draw();
  }

  /* ---- the stickers, one per step that can be earned --------------- */
  function paintStickers() {
    $("stickers").innerHTML = STICKERS.map((s, i) =>
      '<div class="sticker' + (done[i] ? " got" : "") + '"><span class="ic">' + s[0] + "</span>" + s[1] +
      (done[i] ? "" : '<br><small style="color:var(--muted);font-weight:400">not yet</small>') + "</div>").join("");
    const got = done.slice(0, STICKERS.length).filter(Boolean).length;
    $("fbstick").className = "fb " + (got === STICKERS.length ? "good" : "");
    $("fbstick").textContent = got === STICKERS.length
      ? "All " + STICKERS.length + " stickers! You finished the whole unit."
      : got + " of " + STICKERS.length + " stickers so far.";
    if (got === STICKERS.length) REACTION.lessonDone();
  }

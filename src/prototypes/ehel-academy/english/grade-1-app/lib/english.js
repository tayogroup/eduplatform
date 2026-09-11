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
    /* Silent while the deck paints -- see window.__ehelPainting. Returning
       false rather than throwing keeps every caller's promise chain intact. */
    if (window.__ehelPainting) return Promise.resolve(false);
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

  /* ---- the feedback can be heard AGAIN ------------------------------
     Every check step already speaks its correction as it appears and
     announces it in a live region. That is one hearing, at a moment the
     child does not choose: look away, or have a grown-up talking over it,
     and the teaching is gone. The explanation IS the teaching - "The word
     can tells what you are able to do" - and a five-year-old cannot
     re-read it.

     Three decisions, each of which could have gone the other way:

     THE BUTTON IS BUILT HERE, not written into the page, so that one
     definition serves all 23 feedback lines and the games' overlay rather
     than 23 copies in the builder's templates.

     IT SITS OUTSIDE THE LIVE REGION. Inside `.fb`, its own label would be
     read out as part of every correction - the live region is atomic, so a
     screen reader would announce the button on every answer.

     IT IS HIDDEN WHILE THERE IS NOTHING TO HEAR. An always-present button
     that says nothing on nine steps out of ten reads as broken, which is
     the rule Raise-hand and the capstone door already keep. It speaks
     `fb.textContent` - exactly what is on screen, so the voice and the
     words cannot drift, which is why the corrections were written as one
     expression in the first place.
     ------------------------------------------------------------------ */
  function wireFeedbackListen(root) {
    const scope = root || document;
    (scope.querySelectorAll ? scope.querySelectorAll(".fb") : []).forEach((fb) => {
      if (fb.dataset.hearWired) return;
      fb.dataset.hearWired = "1";
      const row = document.createElement("div");
      row.className = "fbrow";
      fb.parentNode.insertBefore(row, fb);
      row.appendChild(fb);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fbsay";
      btn.hidden = true;
      btn.setAttribute("aria-label", "Hear that again");
      btn.innerHTML = "&#128266;";
      btn.addEventListener("click", () => {
        const said = fb.textContent.trim();
        if (said) say(said);
      });
      row.appendChild(btn);
      /* The speaker carries the feedback's own colour - red beside a
         correction, green beside a cheer. It cannot inherit it: the button
         is a SIBLING of `.fb`, not a child, so `.fb.bad { color }` never
         reaches it. The state class is copied across instead, which needs
         no `:has()` and follows the theme through the same tokens. */
      const sync = () => {
        btn.hidden = !fb.textContent.trim();
        btn.className = "fbsay" + (fb.classList.contains("bad") ? " bad"
          : fb.classList.contains("good") ? " good" : "");
      };
      try {
        new MutationObserver(sync).observe(fb, { childList: true, characterData: true, subtree: true });
      } catch (_) { /* no observer, no button - never break the lesson */ }
      sync();
    });
  }
  wireFeedbackListen();
  /* the games build their feedback line inside an overlay that does not
     exist yet, so they wire theirs when they first use it */
  window.__ehelWireFeedback = wireFeedbackListen;

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
      if (!ok) b.classList.add("wrong"); else { right++; reportKnown(it.w); }
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      /* Spoken as well as printed. One expression for both so the voice cannot
         drift from the words on screen - the reason this section exists is that
         a five-year-old cannot read them. */
      const fbMsg = ok ? cheer() + " " + it.w : "That word was " + it.w + ".";
      $(el.fb).textContent = fbMsg;
      say(fbMsg);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = "";
          $(el.stage).innerHTML = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          reportScore(o.finish, right, o.items.length);
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
      if (!ok) b.classList.add("wrong"); else { right++; reportKnown(it.w || (it.opts || []).filter((c) => c.ok).map((c) => c.w)); }
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = ok ? cheer() + " " + it.w : "It is " + it.w + ".";
      /* NOT spoken by say(), deliberately, and this is the one feedback line in
         the build that is left to something else. playClip below plays the
         word's own recording, and playClip stops the voice - so a say() here
         would be cut off mid-sentence by the very clip that answers the
         question. The child hears the word either way, in the recorded voice
         rather than the tutor's. */
      playClip(it.audio, it.w);
      i++;
      setTimeout(() => {
        if (i >= o.items.length) {
          $(el.ch).innerHTML = ""; $(el.score).textContent = ""; $(el.stage).innerHTML = "";
          $(el.fb).className = "fb good";
          $(el.fb).textContent = "You got " + right + " of " + o.items.length + ". " + o.done;
          reportScore(o.finish, right, o.items.length);
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
      /* How many words the child has actually met. There is nothing to score
         on a walk-through, but "stopped at word 4 of 15" is a real fact and
         the step used to report nothing at all until the last card. */
      reportAttempt(o.finish, i + 1, o.items.length, "words");
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
      reportAttempt(o.finish, i + 1, o.items.length, "rules");   // rules met, as above
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
    let open = -1;                       // which line has the recorder under it
    function paint() {
      $(el.ask).innerHTML = o.ask || "Listen, then say it out loud.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="saylines">' + o.items.map((it, k) =>
        '<div class="sayline' + (said[k] ? " said" : "") + '" data-k="' + k + '">' +
        '<div class="sayrow">' +
        '<button type="button" class="hear" aria-label="Hear this line">&#128266;</button>' +
        "<span>" + esc(it.text) + "</span>" +
        (it.check
          ? '<button type="button" class="tick">' + (open === k ? "Hide" : "Say it &amp; check") + "</button>"
          : '<button type="button" class="tick">' + (said[k] ? "\u2713 said" : "I said it") + "</button>") +
        "</div>" +
        (open === k ? '<div class="sayspeech" id="' + el.stage + 'sp"></div>' : "") +
        "</div>").join("") + "</div>";
      $(el.score).textContent = said.filter(Boolean).length + " of " + o.items.length + " said";
      if (open > -1) {
        const it = o.items[open];
        speakingPanel($(el.stage + "sp"), {
          reference: it.text,
          audio: it.audio,
          onDone: () => { mark(open); open = -1; paint(); },
        });
      }
    }
    function mark(k) {
      said[k] = true;
      // Participation only. What a child said out loud is not marked here, and
      // the pronunciation check that does listen is explicitly not a grade.
      reportAttempt(o.finish, said.filter(Boolean).length, said.length, "lines");
      if (said.every(Boolean)) {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = o.done;
        finish(o.finish, o.done);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const row = e.target.closest(".sayline");
      if (!row || e.target.closest(".sayspeech")) return;   // the panel owns its own clicks
      const k = Number(row.dataset.k);
      if (e.target.closest(".hear")) { playClip(o.items[k].audio, o.items[k].text); return; }
      if (!e.target.closest(".tick")) return;
      /* A line the curriculum marked recordingRequired opens the recorder.
         One the curriculum did NOT is still the honour system, deliberately:
         33 of this grade's 60 speaking items ask for a recording and the
         rest are "point at things with a grown-up", which no microphone can
         check and which it would be dishonest to score. */
      if (o.items[k].check) { open = open === k ? -1 : k; paint(); return; }
      mark(k);
      paint();
    });
    paint();
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
    /* Wrong orders tried before the sentence came out right. Free to the
       child - the step lets them try until it works, and it should - but
       whether it took one go or six is exactly the kind of thing the other
       scored steps report, and it was being thrown away. */
    let tries = 0;
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
        tries += 1;
        $(el.line).className = "buildline " + (ok ? "right" : "wrong");
        $(el.fb).className = "fb " + (ok ? "good" : "bad");
        /* the sentence read back to the child, not the tile list: "This is a
           chair ." is what the answer literally is, and it is not a sentence */
        const written = o.answer.replace(/\s+([.!?])/g, "$1").replace(/\s+/g, " ").trim();
        const fbMsg = ok ? cheer() + " " + written : "Not yet. Try the words in another order.";
        $(el.fb).textContent = fbMsg;
        say(fbMsg);
        if (ok) {
          // One sentence, so one mark out of one: built it first time, or not.
          reportScore(o.finish, tries === 1 ? 1 : 0, 1);
          reportAttempt(o.finish, 1, tries, "goes");   // and how many goes it took
          finish(o.finish, o.done);
        }
      });
    }
    draw();
  }

  /* ---- the unit's video lesson ------------------------------------
     The recording the course already ships at
     english/grade-1/media/unit-N/, reached through ../grade-1/ - which
     resolves to the same place in local dev and on the CDN, exactly as
     ../ebooks/ does for the picture books. Nothing is copied.

     Units 1-9 only: lecture-media.json has no key 10, because Unit 10
     opens on the capstone instead. The builder makes this step only where
     a video actually exists rather than assuming ten of them.

     THE STEP IS FINISHED BY WATCHING, NOT BY PRESSING. `ended` marks it
     done on its own. The button beneath is there because a video can
     legitimately be watched elsewhere, or already have been watched last
     week, and a step a child cannot leave is a trap - but it says what it
     is ("I have watched it"), so pressing it is a claim the child makes
     rather than a way past.
     ------------------------------------------------------------------ */
  function lectureStep(o) {
    const el = o.el;
    const lec = o.lecture || {};
    if (!lec.video) return;
    $(el.stage).innerHTML =
      '<div class="lecture">' +
      /* THE POSTER IS HELD BACK UNTIL THE STEP IS REACHED. Every slide is in
         the DOM at once, so a `poster` attribute here is fetched the moment
         the page loads - and this one is a 137KB photograph, a third of the
         whole lesson's weight, for a step a child may never open. `preload`
         does not cover it: it governs the video DATA, not the poster, so
         "metadata" downloads the picture in full anyway. Measured cold on
         the CDN: 423KB a lesson, of which the poster was 137KB.

         It moves to data-poster and is promoted to the real attribute by the
         ONSHOW hook below, which the deck fires when the step is shown. A
         child who never opens the video lesson never pays for its picture. */
      '<video id="' + el.video + '" class="lecturevideo" controls preload="metadata"' +
      (lec.poster ? ' data-poster="' + esc(lec.poster) + '"' : "") + ">" +
      '<source src="' + esc(lec.video) + '" type="video/mp4">' +
      (lec.captions ? '<track kind="captions" srclang="en" label="English" src="' + esc(lec.captions) + '" default>' : "") +
      "</video></div>" +
      '<div class="bigbtns"><button type="button" class="big small ghost" id="' + el.next + '">I have watched it</button></div>';
    const video = $(el.video);
    /* Promote data-poster to the real attribute when the child arrives at
       this step - see the note on the markup above. Idempotent, and a no-op
       on a unit whose manifest carries no poster. */
    ONSHOW[o.finish] = () => {
      if (video.dataset.poster && !video.getAttribute("poster")) {
        video.setAttribute("poster", video.dataset.poster);
      }
    };
    /* Never autoplay. Every other step here plays its own recording when
       the child arrives, because those are two-second word clips; a lesson
       video starting itself is a room full of six-year-olds all playing
       different minutes of the same teacher. */
    /* HOW MUCH OF IT WAS PLAYED. Until 2026-09-08 both paths below sent the
       identical event, so the record could not tell a child who sat through
       the lesson from one who pressed the button on arrival; the first fix
       made it a yes or no, and this makes it the distance.

       Whole SECONDS against the video's own duration. The pair prints as
       "108 of 123" wherever a surface shows it, which is the right reading,
       and it still collapses to 0 / duration for a skip and duration /
       duration for a full watch - so nothing the yes-or-no said is lost. It
       falls back to that yes-or-no where the browser has not given us a
       duration yet, which is the only case a number would be a guess.

       FURTHEST REACHED, not current position: a child who watches to the end
       and drags back to a favourite bit has still watched it. */
    let furthest = 0;
    const secs = () => {
      const dur = Math.floor(video.duration || 0);
      const got = Math.min(Math.floor(furthest), dur || Infinity);
      return dur > 0 ? [got, dur] : null;
    };
    const reportWatched = (whole) => {
      const pair = secs();
      // The noun is what lets a family portal turn this into "watched 4%"
      // rather than printing "5 of 122" at a parent. Omitted on the fallback,
      // where the pair is a yes-or-no and counts nothing.
      if (pair) reportAttempt(o.finish, whole ? pair[1] : pair[0], pair[1], "seconds");
      else reportAttempt(o.finish, whole ? 1 : 0, 1);   // no duration to divide
    };
    video.addEventListener("timeupdate", () => {
      if (video.currentTime > furthest) furthest = video.currentTime;
    });
    // Pausing is where a child who wanders off leaves the record - without it
    // the only reports are the end and the button, and neither happens.
    video.addEventListener("pause", () => { if (!video.ended) reportWatched(false); });
    video.addEventListener("ended", () => {
      $(el.fb).className = "fb good";
      $(el.fb).textContent = "You watched the whole lesson.";
      furthest = Math.max(furthest, video.duration || 0);
      reportWatched(true);
      finish(o.finish, o.done);
    });
    video.addEventListener("play", () => VOICE.stop && VOICE.stop());
    $(el.next).addEventListener("click", () => {
      try { video.pause(); } catch (_) { /* nothing to pause */ }
      reportWatched(video.ended);
      finish(o.finish, o.done);
    });
  }

  /* ---- Let us talk: choose it, then SAY it -------------------------
     Two halves on purpose. Tapping answers "do you know what to say" -
     intent, which is what this step was always for. Speaking answers "can
     you say it", which is what the owner asked for on 2026-09-08 and what
     Azure can actually measure.

     THE SPEAKING HALF NEVER BLOCKS THE ROUND. The child moves on when they
     have said it, whatever came back: Azure scores against adult native
     speakers, these are five- and six-year-olds in their second language,
     and a round that will not let them past until a machine is satisfied is
     a round that ends in tears. The score coaches; the child decides.
     ------------------------------------------------------------------ */
  function letUsTalk(o) {
    let i = 0, right = 0, phase = "choose", lock = false;
    const el = o.el;

    function draw() {
      const it = o.items[i];
      $(el.score).textContent = (o.label || "Round") + " " + (i + 1) + " of " + o.items.length;
      if (phase === "choose") {
        lock = false;
        $(el.ask).innerHTML = it.ask;
        $(el.stage).className = "";
        $(el.stage).innerHTML = "";
        $(el.ch).innerHTML = shuffle(it.opts).map((c) =>
          '<button type="button" class="choice text" data-ok="' + (c.ok ? 1 : 0) + '">' + esc(c.t) + "</button>").join("");
        $(el.fb).textContent = ""; $(el.fb).className = "fb";
        say(plain(it.ask));
        return;
      }
      // phase === "say"
      $(el.ask).innerHTML = "Now say it out loud.";
      $(el.ch).innerHTML = "";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div id="' + el.stage + 'sp"></div>';
      speakingPanel($(el.stage + "sp"), {
        reference: it.reference || "",
        audio: "",
        onDone: () => {
          i++;
          if (i >= o.items.length) {
            $(el.stage).innerHTML = ""; $(el.score).textContent = "";
            $(el.fb).className = "fb good";
            $(el.fb).textContent = "You got " + right + " of " + o.items.length
              + " first time, and you said them all. " + o.done;
            /* THE CHOOSING HALF ONLY, and it says so on the row. This step is
               two things: tapping the right thing to say, which is a question
               with a right answer, and then saying it, which Azure listens to
               and which is deliberately never marked - it scores a five-year-
               old against adult native speakers.

               `right` was counted here and thrown away, so a real score sat
               in a local variable through every unit. It is sent under its
               own sub-key so the row cannot be read as a mark for the
               speaking that happens beside it. */
            reportScore(o.finish, right, o.items.length, "choosing", "choosing what to say");
            reportAttempt(o.finish, o.items.length, o.items.length);
            finish(o.finish, o.done);
            return;
          }
          phase = "choose";
          draw();
        },
      });
    }

    $(el.ch).addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || lock || phase !== "choose") return;
      lock = true;
      const ok = b.dataset.ok === "1", it = o.items[i];
      $(el.ch).querySelectorAll(".choice").forEach((c) => {
        c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong"); else right++;
      $(el.fb).className = "fb " + (ok ? "good" : "bad");
      $(el.fb).textContent = (ok ? cheer() + " " : "") + it.why;
      say((ok ? cheer() + " " : "") + it.why);
      setTimeout(() => { phase = "say"; draw(); }, 2200);
    });

    draw();
  }

  /* ---- the unit's hands-on jobs ------------------------------------
     Twelve per unit, and every one of them happens AWAY FROM THE SCREEN:
     colour the classroom picture, fold a name card, act out the rhyme.
     Nothing here can be marked by a page and nothing here pretends to be -
     no score, no right answer, no recorder.

     THE STEP IS FINISHED BY ONE BUTTON, not by twelve ticks. The shell's
     own classic renderer does the same, and the reason is that this is
     days of off-screen work with a grown-up: a step that will not complete
     until all twelve are ticked is a step almost no child ever completes,
     and a sticker nobody can earn stops meaning anything. The per-job ticks
     are there for the CHILD to keep their place, and they say how many are
     left; the button is what says "we did these".

     "How did I do?" reveals answerSummary, which exists on all 120 of them
     and which nothing in this build had ever drawn. It is written to the
     grown-up - "Scribbly, over-the-line colouring is completely fine" - so
     it is labelled as being for them rather than dressed up as the page
     marking a child's work.
     ------------------------------------------------------------------ */
  function activityList(o) {
    const el = o.el;
    const did = new Array(o.items.length).fill(false);
    const shown = new Array(o.items.length).fill(false);

    function paint() {
      $(el.ask).innerHTML = o.ask || "Jobs to do away from the screen.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="acts" id="' + el.acts + '">' + o.items.map((it, k) =>
        '<div class="act' + (did[k] ? " did" : "") + '" data-k="' + k + '">' +
        '<div class="act-head"><span class="act-n">' + it.n + "</span>" +
        (it.kind ? '<span class="act-kind">' + esc(it.kind) + "</span>" : "") +
        '<button type="button" class="hear" data-act="hear" aria-label="Hear this job">&#128266;</button></div>' +
        '<p class="act-lead">' + esc(it.lead) + "</p>" +
        (it.steps.length
          ? '<ol class="act-steps">' + it.steps.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>"
          : "") +
        (it.check
          ? '<button type="button" class="act-how" data-act="how">' +
            (shown[k] ? "Hide" : "How did I do?") + "</button>" +
            (shown[k] ? '<p class="act-check"><span>For your grown-up</span>' + esc(it.check) + "</p>" : "")
          : "") +
        '<button type="button" class="tick" data-act="tick">' + (did[k] ? "\u2713 done" : "I did this") + "</button>" +
        "</div>").join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + el.acts + 'fin">' +
        "We did these &#10003;</button></div>";

      const left = did.filter((x) => !x).length;
      reportAttempt(o.finish, did.filter(Boolean).length, did.length, "activities");
      $(el.score).textContent = did.filter(Boolean).length + " of " + o.items.length + " ticked"
        + (left ? "" : " - all of them");

      $(el.acts + "fin").addEventListener("click", () => {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = o.done;
        finish(o.finish, o.done);
      });
    }

    $(el.stage).addEventListener("click", (e) => {
      const card = e.target.closest(".act");
      const button = e.target.closest("[data-act]");
      if (!card || !button) return;
      const k = Number(card.dataset.k);
      /* The spoken fallback is the WHOLE job, not its first line. It used to
         be the lead alone, which was harmless while every job had a clip;
         a job whose clip has been withdrawn (its words rewritten, the
         recording not yet redone) would otherwise be read out as one
         sentence with its numbered steps missing. */
      if (button.dataset.act === "hear") {
        playClip(o.items[k].audio, [o.items[k].lead].concat(o.items[k].steps || []).join(" "));
        return;
      }
      if (button.dataset.act === "how") { shown[k] = !shown[k]; paint(); return; }
      if (button.dataset.act === "tick") { did[k] = !did[k]; paint(); }
    });

    paint();
  }

  /* ---- the plan for this unit --------------------------------------
     WHEN the unit happens and what to do on each school day of it. The
     term, the weeks and the dates come from the school's real 2026-27
     calendar (shell/study-plan.js), read at BUILD time - so this page and
     the shell course's own Study Plan cannot disagree about the year.

     IT COMPLETES ON BEING READ. There is nothing here to get right, and a
     plan a child has to finish before the unit will open is a lock on the
     front door. It is marked done as soon as it is drawn.

     "Nobody is behind" is on the page on purpose. A dated plan handed to a
     six-year-old is the first thing in this course that can make a child
     feel late, and the honest thing to say is that the dates are the
     school's guess at a pace, not a debt.
     ------------------------------------------------------------------ */
  function unitPlan(o) {
    const el = o.el;
    const p = o.plan || {};
    const days = p.days || [];
    const DAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="plan" id="' + el.plan + '">' +
      '<div class="plan-when">' +
      '<div><span>Term</span><strong>' + esc(String(p.term || "-")) + "</strong></div>" +
      '<div><span>Weeks</span><strong>' + (p.from === p.to ? esc(String(p.from))
        : esc(String(p.from) + "\u2013" + String(p.to))) + "</strong></div>" +
      '<div class="wide"><span>Dates</span><strong>' + esc(p.fromDate || "") +
      " \u2013 " + esc(p.toDate || "") + "</strong></div>" +
      "</div>" +
      '<p class="plan-note">' + esc(p.termDates ? "Term " + p.term + ": " + p.termDates : "") +
      (p.year ? "  \u00b7  " + esc(p.year) + " school year" : "") + "</p>" +
      days.map((line, k) =>
        '<div class="plan-day' + (k === days.length - 1 ? " last" : "") + '">' +
        '<span class="plan-wk">Week ' + (Math.floor(k / 5) + 1) + "</span>" +
        '<span class="plan-dow">' + DAY[k % 5] + "</span>" +
        '<span class="plan-do">' + esc(line) + "</span></div>").join("") +
      '<p class="plan-note">Nobody is behind. If a day takes two days, take two days.</p>' +
      "</div>";
    $(el.score).textContent = days.length + " school days";
    finish(o.finish, o.done);
  }

  /* ---- the unit's own readings, as a shelf -------------------------
     THE SAME SHAPE AS READING BOOKS (step 6), on the owner's instruction:
     three texts are a shelf of three cards, not a tab strip.

     DELIBERATELY NOT THE PICTURE BOOKS. That shelf is a separate thing and
     its books are ADAPTATIONS - the Unit 1 book is a 150-word retelling of
     this 219-word reading, and at least one comprehension answer lives here
     and in no page of it.

     THE PAGE FOLLOWS THE VOICE. The recording is ONE clip of the whole
     passage, so a manual Next put a child on page 1 while page 3 was being
     read. Each line's window of the audio is its share of the narration's
     CHARACTERS - the estimate english.js :: startNarrationSync already uses,
     and it says why: no clip in this course carries word timings, and a
     character share tracks a steady narrator closely enough to follow with a
     finger. The same estimate that highlights the line says which page it is
     on, so the page turns itself while the voice reads.

     Manual Back and Next still work; they simply stop the audio first,
     because a child who turns the page has decided where they are.
     ------------------------------------------------------------------ */
  function unitReadings(o) {
    const el = o.el;
    const read = new Array(o.items.length).fill(false);

    function drawShelf() {
      $(el.ask).innerHTML = o.ask || "Choose something to read.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf" id="' + el.pick + '">' + o.items.map((r, k) =>
        '<div class="bookcard' + (read[k] ? " played" : "") + '">' +
        '<span class="bookicon" aria-hidden="true">' + (read[k] ? "\u2705" : "\u{1F4D6}") + "</span>" +
        '<span class="booktitle">' + esc(r.title) + "</span>" +
        (r.kind ? '<span class="bookmeta">' + esc(r.kind) + "</span>" : "") +
        '<span class="bookmeta">' + r.pages.length + (r.pages.length === 1 ? " page" : " pages") + "</span>" +
        '<button type="button" class="big small teal" data-read="' + k + '">' +
        (read[k] ? "Read again \u25B6" : "Read \u25B6") + "</button></div>").join("") + "</div>";
      $(el.score).textContent = o.items.length + " things to read";
      $(el.pick).addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-read]");
        if (b) openReading(Number(b.dataset.read));
      });
    }

    /* One flat list of SENTENCES over the whole reading, each knowing its
       page. Sentences rather than paragraphs because a paragraph is four
       lines of a five-year-old's screen and highlighting all of it points at
       nothing. Split after end punctuation, keeping a closing quote with the
       sentence it ends - this text is full of "…she said." */
    function linesOf(item) {
      const out = [];
      item.pages.forEach((page, p) => {
        page.forEach((para) => {
          const parts = String(para).split(/(?<=[.!?][")\u201d]?)\s+/).filter((x) => x.trim());
          parts.forEach((t) => out.push({ page: p, text: t.trim(), chars: Math.max(1, t.trim().length) }));
        });
      });
      return out;
    }

    function openReading(k) {
      const it = o.items[k];
      const lines = linesOf(it);
      let page = 0;
      let player = null;
      let timer = null;
      let active = -1;

      const overlay = document.createElement("div");
      overlay.className = "book-reader read-reader";
      document.body.appendChild(overlay);

      // Each line's [start, end) window, in characters over the whole clip.
      let at = 0;
      const bounds = lines.map((l) => { const r = [at, at + l.chars]; at += l.chars; return r; });
      const totalChars = at;

      function stopAudio() {
        if (timer) { clearInterval(timer); timer = null; }
        if (player) { try { player.pause(); } catch (_) { /* already gone */ } player = null; }
        active = -1;
        overlay.querySelectorAll(".rd-line.on").forEach((n) => n.classList.remove("on"));
        const b = overlay.querySelector("#readListen");
        if (b) b.innerHTML = "\u{1F50A} Listen";
      }
      function close() {
        stopAudio();
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        drawShelf();
      }
      function onKey(ev) { if (ev.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);

      function tick() {
        if (!player || !totalChars) return;
        const d = player.duration;
        if (!Number.isFinite(d) || d <= 0) return;
        const pos = Math.min(Math.max(player.currentTime / d, 0), 1) * totalChars;
        let i = bounds.findIndex(([, e2]) => pos < e2);
        if (i === -1) i = lines.length - 1;
        if (i === active) return;
        active = i;
        // The page follows the voice: turn to whichever page the line is on.
        if (lines[i].page !== page) { page = lines[i].page; render(true); }
        overlay.querySelectorAll(".rd-line.on").forEach((n) => n.classList.remove("on"));
        const node = overlay.querySelector('.rd-line[data-i="' + i + '"]');
        if (node) { node.classList.add("on"); node.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      }

      function listen() {
        if (player) { stopAudio(); return; }
        const url = clip(it.audio);
        if (!url) { playClip(it.audio, ""); return; }
        player = new Audio(url);
        player.addEventListener("ended", () => stopAudio());
        player.addEventListener("error", () => stopAudio());
        player.play().then(() => {
          const b = overlay.querySelector("#readListen");
          if (b) b.innerHTML = "\u23F8 Pause";
          timer = setInterval(tick, 120);
        }).catch(() => { player = null; playClip(it.audio, ""); });
      }

      function render(keepAudio) {
        if (!keepAudio) stopAudio();
        const last = page === it.pages.length - 1;
        let n = 0;
        const body = it.pages[page].map((para) => {
          const parts = String(para).split(/(?<=[.!?][")\u201d]?)\s+/).filter((x) => x.trim());
          return "<p>" + parts.map((t) => {
            const idx = lines.findIndex((l, j) => j >= n && l.page === page && l.text === t.trim());
            n = idx > -1 ? idx + 1 : n;
            return '<span class="rd-line" data-i="' + idx + '">' + esc(t.trim()) + "</span>";
          }).join(" ") + "</p>";
        }).join("");
        overlay.innerHTML =
          '<div class="book-reader-top"><span class="booktitle">' + esc(it.title) + "</span>" +
          '<button type="button" class="book-close" aria-label="Close">&#10005;</button></div>' +
          '<div class="book-stage-wrap"><div class="read-stage"><div class="read-page' +
          (page === 0 ? " first" : "") + '">' +
          (page === 0 ? '<h3 class="read-title">' + esc(it.title) + "</h3>" : "") +
          body + "</div></div></div>" +
          '<div class="book-reader-bottom">' +
          '<button type="button" class="big small ghost" id="readBack"' + (page === 0 ? " disabled" : "") + ">&#9664; Back</button>" +
          '<button type="button" class="big small teal" id="readListen">' +
          (player ? "\u23F8 Pause" : "\u{1F50A} Listen") + "</button>" +
          '<span class="page-pips" aria-label="Page ' + (page + 1) + " of " + it.pages.length + '">' +
          it.pages.map((_, i) => '<i class="pip' + (i === page ? " on" : (i < page ? " done" : "")) + '"></i>').join("") +
          "</span>" +
          (last
            ? '<button type="button" class="big small" id="readDone">I have read it &#10003;</button>'
            : '<button type="button" class="big small" id="readNext">Next page &#9654;</button>') +
          "</div>";
        overlay.querySelector(".book-close").addEventListener("click", close);
        const back = overlay.querySelector("#readBack");
        if (back) back.addEventListener("click", () => { page--; render(false); });
        const next = overlay.querySelector("#readNext");
        if (next) next.addEventListener("click", () => { page++; render(false); });
        overlay.querySelector("#readListen").addEventListener("click", listen);
        const done = overlay.querySelector("#readDone");
        if (done) done.addEventListener("click", () => {
          read[k] = true;
          reportAttempt(o.finish, read.filter(Boolean).length, read.length, "readings");
          close();
          if (k === 0) {
            $(el.fb).className = "fb good";
            $(el.fb).textContent = o.done;
            finish(o.finish, o.done);
          }
        });
      }
      render(false);
    }

    drawShelf();
  }

  /* ---- what this unit is for --------------------------------------
     The unit's own learning outcomes, in the learner's words.
     `evidenceOfLearning` is deliberately NOT drawn: it is prose written for
     an adult ("Observed through pointing, speaking, drawing...") and belongs
     with the grown-up guide rather than on a five-year-old's page.
     ------------------------------------------------------------------ */
  function unitOverview(o) {
    const el = o.el;
    const d = o.data || {};
    const c = d.counts || {};
    const bits = [];
    if (c.words) bits.push(c.words + " new words");
    if (c.books) bits.push(c.books + " books");
    if (c.games) bits.push(c.games + " games");
    $(el.stage).className = "stagewide";
    $(el.stage).innerHTML =
      '<div class="ovw">' +
      (bits.length ? '<p class="ovw-bits">' + bits.map((b) => "<span>" + esc(b) + "</span>").join("") + "</p>" : "") +
      '<h3 class="ovw-h">By the end of this unit you will be able to&hellip;</h3>' +
      '<ol class="ovw-list">' + (d.outcomes || []).map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
      '<div class="bigbtns"><button type="button" class="big small teal" id="' + el.stage +
      'r">&#128266; Read it to me</button></div></div>';
    $(el.score).textContent = (d.outcomes || []).length + " things to learn";
    $(el.stage + "r").addEventListener("click", () =>
      say("By the end of this unit you will be able to. " + (d.outcomes || []).join(". ")));
    finish(o.finish, o.done);
  }

  /* ---- how did I do? ----------------------------------------------
     The unit's own selfAssessment statements, on their own authored scale.

     THE CHILD'S ANSWER AND NOTHING ELSE. No mark is inferred from the steps
     they finished: the only per-outcome signal a learner has actually given
     is this one, and a page that guesses makes a confident claim about
     something nobody measured. The shell's own recap keeps the same rule.

     NOT SENT AS A CHECKPOINT. A self-rating is a claim, not a mark, and "By
     myself" arriving in a gradebook would turn a child's confidence into a
     grade. Kept on the device, the way the shell keeps progress.self.
     ------------------------------------------------------------------ */
  function selfCheck(o) {
    const el = o.el;
    const KEY = "ehel-eng-g" + (LESSON.grade || 1) + "-u" + (o.unit || 1) + "-self-v1";
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) { saved = {}; }
    function store() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) { /* private mode */ } }

    function paint() {
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="selfs">' + o.items.map((it, k) =>
        '<div class="selfrow' + (saved[it.id] ? " answered" : "") + '">' +
        "<p>" + esc(it.say) + "</p><div class=\"selfopts\">" +
        it.scale.map((sc) =>
          '<button type="button" class="selfopt' + (saved[it.id] === sc ? " on" : "") +
          '" data-k="' + k + '" data-v="' + esc(sc) + '">' + esc(sc) + "</button>").join("") +
        "</div></div>").join("") + "</div>";
      const answered = o.items.filter((it) => saved[it.id]).length;
      // How many the child ANSWERED, never what they answered: a self-rating
      // is a claim, and "By myself" in a gradebook would be a grade for
      // confidence. The answers themselves stay on the device.
      reportAttempt(o.finish, answered, o.items.length, "questions");
      $(el.score).textContent = answered + " of " + o.items.length + " answered";
      if (answered === o.items.length) {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = o.done;
        finish(o.finish, o.done);
      }
    }
    $(el.stage).addEventListener("click", (e) => {
      const b = e.target.closest("[data-v]");
      if (!b) return;
      saved[o.items[Number(b.dataset.k)].id] = b.dataset.v;
      store();
      paint();
    });
    paint();
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

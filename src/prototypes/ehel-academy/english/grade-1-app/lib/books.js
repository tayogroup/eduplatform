  /* ==================================================================
     PICTURE BOOKS

     The shelf and reader do NOT copy the story pages anywhere. This build
     ships to app/english/grade-1-v2/, one directory below app/english/,
     the same level ../ebooks/ already lives at - the assets the shell's
     own reader already fetches from ./ebooks/. So the path from here is
     ../ebooks/<id>/<file>, and it resolves in local dev too: this page's
     own directory (english/grade-1-app/) sits beside english/ebooks/ on
     disk, exactly the same relative shape.

     Nothing is duplicated because nothing needs to be: the SVGs are
     fetched at READ time, one page at a time, same as the shell does.

     What is NOT ported: story narration is runtime TTS in the shell
     (aiVoiceUrl, a paid endpoint this standalone page has no business
     calling on its own), so a page's Listen button reads its text through
     this page's OWN voice engine (VOICE.say) instead - the same engine
     every other step's Explain button already uses. The tap-sound
     resolution tables ARE ported, verbatim, because they are small, pure
     data, and a tap that resolves to the wrong clip is a worse experience
     than porting forty lines.
     ================================================================== */

  const TAP_SOUND_MOOD_TYPES = new Set(["zebra", "elephant", "kiki", "duku", "lulu", "zuri", "goat", "hen", "monkey"]);
  const TAP_SOUND_MOODS = new Set(["happy", "sad", "surprised"]);
  const TAP_SOUND_ALIASES = { kite: "wind", moon: "lullaby", carrot: "crunch", scarecrow: "tree", lake: "puddle", fish: "puddle", boat: "wind", clock: "bell" };
  const TAP_VOICE_GROUPS = {
    amal: "child", nora: "child", mina: "child", adam: "child", idris: "child",
    noah: "child", sami: "child", maya: "child",
    samira: "child", hodan: "child", leo: "child",
    daniel: "child", theo: "child",
    yasmin: "woman", mum: "woman", hana: "woman", salma: "woman", faduma: "woman",
    leila: "woman",
    nadia: "woman", sarah: "woman", elena: "woman", talia: "woman", librarian: "woman",
    governor: "woman",
    omar: "man", dad: "man", grandpa: "man", rami: "man", mayor: "man", karim: "man",
    uncle: "man", lawyer: "man", caretaker: "man", labourer: "man",
  };

  const tapPlayer = new Audio();
  function ebookAsset(bookId, filename) {
    return new URL("../ebooks/" + bookId + "/" + filename, document.baseURI).href;
  }
  function playTapSound(type, mood) {
    if (!type) return;
    const voiceGroup = TAP_VOICE_GROUPS[type];
    const soundKey = voiceGroup
      ? voiceGroup + "-" + (TAP_SOUND_MOODS.has(mood) ? mood : "happy")
      : TAP_SOUND_MOOD_TYPES.has(type)
        ? type + "-" + (TAP_SOUND_MOODS.has(mood) ? mood : "happy")
        : TAP_SOUND_ALIASES[type] || type;
    try {
      tapPlayer.pause();
      tapPlayer.src = ebookAsset("tap-sounds", soundKey + ".mp3");
      tapPlayer.currentTime = 0;
      tapPlayer.play().catch(() => {});
    } catch (_) { /* a tap sound is a garnish; never let it break the reader */ }
  }
  function playStorySound(key) {
    if (!key) return;
    try {
      tapPlayer.pause();
      tapPlayer.src = ebookAsset("tap-sounds", key + ".mp3");
      tapPlayer.currentTime = 0;
      tapPlayer.play().catch(() => {});
    } catch (_) { /* same */ }
  }

  /* The full-viewport reader, lifted out of bookShelf so a SECOND caller
     can open one book directly: the story questions step needs to put the
     unit's own story back in front of a child who has forgotten it, and it
     is one of the seven books on the shelf rather than a page of its own.
     Same reader, same tap sounds, same Listen - one implementation. */
  function openBookReader(book, onFinish) {
      let page = 0;
      let reading = null;          // the sentence-by-sentence read-along, if running
      const overlay = document.createElement("div");
      overlay.className = "book-reader";
      document.body.appendChild(overlay);

      /* The page's text, as sentences, so the caption can highlight one at a
         time. A whole page lit up points at nothing. Split after end
         punctuation and keep a closing quote with the sentence it ends -
         these books are mostly dialogue. */
      const sentencesOf = (text) => String(text || "")
        .split(/(?<=[.!?][")\u201d]?)\s+/)
        .map((x) => x.trim())
        .filter(Boolean);

      let clipPlayer = null;

      function stopReading() {
        if (reading) { clearInterval(reading); reading = null; }
        if (clipPlayer) { try { clipPlayer.pause(); } catch (_) { /* gone */ } clipPlayer = null; }
        try { VOICE.stop(); } catch (_) { /* nothing to stop */ }
        overlay.querySelectorAll(".cap-line.on").forEach((n) => n.classList.remove("on"));
        const b = overlay.querySelector("#bookListen");
        if (b) b.innerHTML = "&#128266; Listen";
      }

      /* THE PRE-RENDERED CLIP, and the caption follows it.
         One clip per page (page-NN.mp3 beside page-NN.svg), so the highlight
         is the character-share estimate the unit readings use: no clip in this
         course carries word timings, and a line's share of the characters
         tracks a steady narrator closely enough to follow with a finger. */
      function playClipFor(lines, url) {
        let at = 0;
        const bounds = lines.map((t) => { const r = [at, at + Math.max(1, t.length)]; at += Math.max(1, t.length); return r; });
        const total = at;
        const caption = overlay.querySelector("#bookCaption");
        let active = -1;
        clipPlayer = new Audio(url);
        clipPlayer.addEventListener("ended", () => stopReading());
        clipPlayer.addEventListener("error", () => { clipPlayer = null; readFrom(lines, 0); });
        clipPlayer.play().then(() => {
          const b = overlay.querySelector("#bookListen");
          if (b) b.innerHTML = "\u23F8 Pause";
          reading = setInterval(() => {
            if (!clipPlayer || !caption) return;
            const d = clipPlayer.duration;
            if (!Number.isFinite(d) || d <= 0) return;
            const pos = Math.min(Math.max(clipPlayer.currentTime / d, 0), 1) * total;
            let i = bounds.findIndex(([, e2]) => pos < e2);
            if (i === -1) i = lines.length - 1;
            if (i === active) return;
            active = i;
            caption.querySelectorAll(".cap-line.on").forEach((n) => n.classList.remove("on"));
            const node = caption.querySelector('.cap-line[data-i="' + i + '"]');
            if (node) node.classList.add("on");
          }, 120);
        }).catch(() => {
          // Autoplay refused, or the file is not there. Fall back to the voice
          // rather than to silence.
          clipPlayer = null;
          readFrom(lines, 0);
        });
      }

      /* Speak sentence i, light it, and move on when the voice has actually
         finished it - the afterVoice() idiom from english.js, which polls
         VOICE.speaking() because the engine reports a queue rather than
         per-utterance events. The ceiling is the same guard: a voice that
         never reports finishing must not leave the caption stuck. */
      function readFrom(lines, i) {
        const caption = overlay.querySelector("#bookCaption");
        if (!caption || i >= lines.length) { stopReading(); return; }
        caption.querySelectorAll(".cap-line.on").forEach((n) => n.classList.remove("on"));
        const node = caption.querySelector('.cap-line[data-i="' + i + '"]');
        if (node) node.classList.add("on");
        VOICE.speak(lines[i]);
        let waited = 0;
        reading = setInterval(() => {
          waited += 150;
          if (!VOICE.speaking() && waited > 300) { clearInterval(reading); reading = null; readFrom(lines, i + 1); }
          else if (waited > 20000) { clearInterval(reading); reading = null; stopReading(); }
        }, 150);
      }

      function renderPage() {
        const p = book.pages[page];
        const last = page === book.pages.length - 1;
        overlay.innerHTML =
          '<div class="book-reader-top"><span class="booktitle">' + esc(book.title) + "</span>" +
          '<button type="button" class="book-close" aria-label="Close the book">&#10005;</button></div>' +
          '<div class="book-stage-wrap"><div class="book-stage" id="bookStage"></div></div>' +
          (p.text
            ? '<div class="book-caption" id="bookCaption">' + sentencesOf(p.text).map((t, i) =>
                '<span class="cap-line" data-i="' + i + '">' + esc(t) + "</span>").join(" ") + "</div>"
            : "") +
          '<div class="book-reader-bottom">' +
          '<button type="button" class="big small ghost" id="bookBack"' + (page === 0 ? " disabled" : "") + '>&#9664; Back</button>' +
          '<button type="button" class="big small teal" id="bookListen">&#128266; Listen</button>' +
          '<span class="book-page-count">Page ' + (page + 1) + " of " + book.pages.length + "</span>" +
          (last
            ? '<button type="button" class="big small" id="bookFinish">Finish book &#10003;</button>'
            : '<button type="button" class="big small" id="bookNext">Next &#9654;</button>') +
          "</div>";
        overlay.querySelector(".book-close").addEventListener("click", closeReader);
        const backBtn = overlay.querySelector("#bookBack");
        if (backBtn) backBtn.addEventListener("click", () => { stopReading(); page--; renderPage(); });
        const nextBtn = overlay.querySelector("#bookNext");
        if (nextBtn) nextBtn.addEventListener("click", () => { stopReading(); page++; renderPage(); });
        const finishBtn = overlay.querySelector("#bookFinish");
        if (finishBtn) finishBtn.addEventListener("click", () => {
          stopReading();
          closeReader();
          if (onFinish) onFinish();
        });
        overlay.querySelector("#bookListen").addEventListener("click", () => {
          if (reading) { stopReading(); return; }
          const lines = sentencesOf(p.text);
          if (!lines.length) return;
          overlay.querySelector("#bookListen").innerHTML = "\u23F8 Pause";
          // The rendered clip if there is one; the runtime voice if not.
          playClipFor(lines, ebookAsset(book.id, "page-" + String(page + 1).padStart(2, "0") + ".mp3"));
        });

        const stage = overlay.querySelector("#bookStage");
        fetch(ebookAsset(book.id, p.image))
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error("page fetch failed"))))
          .then((markup) => {
            if (!stage.isConnected) return;
            const svg = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
            if (!svg || svg.nodeName.toLowerCase() !== "svg") return;
            svg.setAttribute("role", "img");
            if (p.alt) svg.setAttribute("aria-label", p.alt);
            stage.innerHTML = "";
            stage.appendChild(svg);
            svg.addEventListener("pointerdown", (e) => {
              const target = e.target.closest && e.target.closest("[data-tap]");
              if (!target) return;
              playTapSound(target.dataset.tap, target.dataset.mood);
              target.classList.remove("tap-play");
              void target.getBoundingClientRect();
              target.classList.add("tap-play");
            });
          })
          .catch(() => { stage.innerHTML = '<p style="padding:20px;color:var(--muted)">This page could not be loaded.</p>'; });
        if (p.sound) playStorySound(p.sound);
      }
      function closeReader() {
        stopReading();
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
      function onKey(e) { if (e.key === "Escape") closeReader(); }
      document.addEventListener("keydown", onKey);
      renderPage();
    }

  function bookShelf(o) {
    const el = o.el;
    const books = o.items;
    /* WHICH books were read, not just that one was. Reading is the largest
       single block of screen time in the unit and its whole record used to be
       the step's own done flag - a child who read all seven and a child who
       opened one and pressed Done were indistinguishable. The shelf has known
       the answer all along; it simply never said it. Same participation report
       the unit's own readings already send, and for the same reason: a book
       read is a real fact and is not a mark. */
    const read = new Array(books.length).fill(false);

    function drawShelf() {
      $(el.ask).innerHTML = o.ask || "Choose a book to read.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf" id="' + el.shelf + '"></div>';
      const got = read.filter(Boolean).length;
      $(el.score).textContent = got
        ? got + " of " + books.length + (books.length === 1 ? " book read" : " books read")
        : books.length + (books.length === 1 ? " book" : " books");
      $(el.shelf).innerHTML = books.map((b, k) =>
        '<div class="bookcard' + (read[k] ? " played" : "") + '">' +
        '<span class="bookicon" aria-hidden="true">' + (read[k] ? "\u2705" : "\u{1F4D6}") + "</span>" +
        '<span class="booktitle">' + esc(b.title) + "</span>" +
        (b.author ? '<span class="bookmeta">by ' + esc(b.author) + "</span>" : "") +
        '<span class="bookmeta">' + b.pages.length + " pages</span>" +
        '<button type="button" class="big small teal" data-book="' + k + '">' +
        (read[k] ? "Read again ▶" : "Read ▶") + "</button></div>").join("");
      $(el.shelf).addEventListener("click", (e) => {
        const b = e.target.closest("[data-book]");
        if (!b) return;
        openReader(Number(b.dataset.book));
      });
    }

    function openReader(k) {
      openBookReader(books[k], () => {
        read[k] = true;
        reportAttempt(o.finish, read.filter(Boolean).length, read.length, "books");
        /* The step still COMPLETES on the first book finished - one book is
           what the unit asks for, and gating the rest of the unit on seven
           would be a different decision. What changed is only what is
           reported: the shelf now redraws so a child can see which ones they
           have been through. */
        finish(o.finish, o.done);
        drawShelf();
      });
    }

    drawShelf();
  }

  /* ==================================================================
     STORY QUESTIONS FOR EACH BOOK

     BOOK_COMPREHENSION_SETS in shell/subjects/english.js, read by the
     builder rather than copied - 18 questions for every Grade 1 unit, in
     three kinds, and all three are kept because dropping the two harder
     ones would leave the text MCQs alone and quietly halve the section:

       choice   the book's own page as a scene, then three text options
       picture  three book PAGES, tap the one the question describes
       order    three pages of one book, tap them in story order

     A question's `answer` is an index into the AUTHORED array, so the
     options are rendered through a per-question shuffled VIEW and the
     right answer is never a screen position - the same guard the shell's
     own renderer carries, and the same one the fluency author had to add
     after a section turned out to be passable by tapping the top option
     fifteen times.

     `page` is 1-BASED, matching the shell (`book.pages[pageNumber - 1]`).

     WRONG IS FREE HERE. A wrong tap says so and lets the child try again
     rather than marking and moving on: the answer is in a book they have,
     and going back to look it up is reading, not cheating.

     WHICH IS WHY THE SCORE HAD TO CHANGE, 2026-09-08. Reporting "solved out
     of asked" meant every child who reached the end scored 100%, because the
     step is built so that they can only reach the end by solving all of them.
     It was a number that could not vary - a mark in the gradebook that said
     nothing about the learner. What varies, and what a teacher can act on, is
     how many were right FIRST TIME. Retries stay free and are not punished:
     they cost the first-time score and nothing else, and the participation
     count beside it still says how far through they are.
     ================================================================== */
  function bookQuestions(o) {
    const el = o.el;
    const books = o.books || [];

    /* SORTED BY BOOK, IN THE SHELF'S OWN ORDER (owner, 2026-09-10), so "the
       first book, then the second" means the same thing here as on the shelf
       the child has just read from. Sorted HERE rather than by reordering the
       authored arrays: the questions live in BOOK_COMPREHENSION_SETS in
       shell/subjects/english.js, which is the one file this repo's own
       pre-commit guard names as co-edited, and doing it at render time covers
       every unit and every grade instead of forty arrays reordered by hand.

       THE PICTURE QUESTIONS GO LAST AND KEEP NO BOOK TITLE, and that is the
       whole reason this is not a one-line sort. A `choice` or an `order`
       question names one book. A `picture` question deliberately spans THREE
       - "Tap the picture of Miss Twiga" offers a page from each of three books
       and the child has to know which - so it has no book to sort under, and
       heading its slide with a book name would HAND OVER THE ANSWER: the
       answer to that one is the kiki-goes-to-school page. Six of the eighteen
       questions in a unit are this kind, so titling them would make a third of
       the section passable without looking at the pictures.

       The sort is stable on the authored order within each book, so the
       author's sequencing inside a book survives. */
    const bookRank = new Map(books.map((b, i) => [b.id, i]));
    const rankOf = (q) =>
      (q.book != null && bookRank.has(q.book) ? bookRank.get(q.book) : books.length);
    const questions = (o.items || [])
      .map((q, i) => [q, i])
      .sort((a, b) => rankOf(a[0]) - rankOf(b[0]) || a[1] - b[1])
      .map((pair) => pair[0]);

    const solved = new Set();
    /* Answered wrongly at least once before being solved. A reset on an
       `order` question counts, because tapping the pages in the wrong order
       IS the wrong answer to that question. */
    const missed = new Set();
    let index = 0;
    let picked = [];          // order-type taps so far, reset on every move

    const bookOf = (id) => books.find((b) => b.id === id);
    const pageArt = (id, pageNumber) => {
      const book = bookOf(id);
      const page = book && book.pages[pageNumber - 1];
      return page ? { src: ebookAsset(id, page.image), alt: page.alt || "" } : null;
    };
    const view = questions.map((q) =>
      shuffle([...Array(q.kind === "order" ? q.order.length : (q.options || q.pick).length).keys()]));

    function draw() {
      const q = questions[index];
      const v = view[index];
      const done = solved.has(index);
      const allDone = solved.size === questions.length;

      let answers = "";
      if (q.kind === "choice") {
        const art = pageArt(q.book, q.page);
        answers =
          (art ? '<figure class="bookq-scene"><img src="' + art.src + '" alt="' + esc(art.alt) + '"></figure>' : "") +
          '<div class="bigbtns">' + v.map((i) =>
            '<button type="button" class="choice" data-pick="' + i + '"' + (done ? " disabled" : "") + ">" +
            esc(q.options[i]) + "</button>").join("") + "</div>";
      } else if (q.kind === "picture") {
        answers = '<div class="bookq-pictures">' + v.map((i) => {
          const art = pageArt(q.pick[i].book, q.pick[i].page);
          return '<button type="button" class="bookq-picture" data-pick="' + i + '" aria-label="' +
            esc(art ? art.alt : "a page") + '"' + (done ? " disabled" : "") + ">" +
            (art ? '<img src="' + art.src + '" alt="">' : "") + "</button>";
        }).join("") + "</div>";
      } else {
        answers = '<div class="bookq-pictures bookq-order">' + v.map((slot) => {
          const art = pageArt(q.book, q.order[slot]);
          const at = picked.indexOf(slot);
          return '<button type="button" class="bookq-picture" data-order="' + slot + '" aria-label="' +
            esc(art ? art.alt : "a page") + '"' + (at > -1 || done ? " disabled" : "") + ">" +
            (art ? '<img src="' + art.src + '" alt="">' : "") +
            (at > -1 || done ? '<span class="bookq-order-badge">' + (done ? slot + 1 : at + 1) + "</span>" : "") +
            "</button>";
        }).join("") + "</div>";
      }

      /* The book's name above the question, so a child always knows which
         story they are being asked about. A picture question gets "Across the
         books" instead of a title - it is the same words on all six, so it
         gives nothing away, and it says why there is no book name rather than
         leaving the slide looking as though one is missing. */
      const b = q.book != null ? bookOf(q.book) : null;
      const eyebrow = b ? b.title : (q.kind === "picture" ? "Across the books" : "");
      $(el.ask).innerHTML =
        (eyebrow ? '<span class="qbook">' + esc(eyebrow) + "</span>" : "") + esc(q.q);
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML =
        '<div class="bookq" id="' + el.bq + '">' + answers + "</div>" +
        '<div class="bigbtns bookq-nav">' +
        '<button type="button" class="big small ghost" id="' + el.bq + 'prev"' + (index === 0 ? " disabled" : "") + ">&#9664; Back</button>" +
        '<button type="button" class="big small ghost" id="' + el.bq + 'next"' + (index === questions.length - 1 ? " disabled" : "") + ">Next &#9654;</button>" +
        "</div>";
      $(el.score).textContent = "Question " + (index + 1) + " of " + questions.length +
        "  \u00b7  " + solved.size + " answered";
      /* How far through, sent as they go - so a child who stops halfway is on
         the record as halfway rather than as nothing. */
      reportAttempt(o.finish, solved.size, questions.length, "questions");
      if (!done) { $(el.fb).textContent = ""; $(el.fb).className = "fb"; }

      $(el.bq).addEventListener("click", onTap);
      $(el.bq + "prev").addEventListener("click", () => { index--; picked = []; draw(); });
      $(el.bq + "next").addEventListener("click", () => { index++; picked = []; draw(); });

      /* The question read aloud, options included on a choice question -
         these are five- and six-year-olds, and not being able to read the
         question yet is the whole reason the section exists. */
      say(q.kind === "choice" ? q.q + " Is it " + q.options.join(", or ") + "?" : q.q);

      if (allDone) {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = "Every question has a star. " + o.done;
        // Right first time. See the note at the top of this section: solved
        // out of asked is 100% for everyone who gets here, so it is not a
        // score. This one varies, and retries are still free.
        reportScore(o.finish, questions.length - missed.size, questions.length);
        finish(o.finish, o.done);
      }
    }

    /* After a right answer, move to the next question still to do - behind
       as well as ahead, so a child who skipped around is walked back to the
       gap instead of running off the end. */
    function advance() {
      const ahead = questions.findIndex((_, i) => i > index && !solved.has(i));
      const anywhere = questions.findIndex((_, i) => !solved.has(i));
      index = ahead > -1 ? ahead : anywhere > -1 ? anywhere : index;
      picked = [];
      draw();
    }

    function onTap(e) {
      const q = questions[index];
      const pick = e.target.closest("[data-pick]");
      const step = e.target.closest("[data-order]");
      if (pick) {
        if (Number(pick.dataset.pick) === q.answer) {
          solved.add(index);
          playStorySound("child-happy");
          pick.classList.add("right");
          $(el.fb).className = "fb good";
          $(el.fb).textContent = cheer();
          setTimeout(advance, 900);
        } else {
          if (!solved.has(index)) missed.add(index);
          playStorySound("child-surprised");
          pick.classList.add("wrong");
          $(el.fb).className = "fb bad";
          $(el.fb).textContent = "Not that one - look again and try another.";
          setTimeout(() => pick.classList.remove("wrong"), 600);
        }
        return;
      }
      if (step) {
        const slot = Number(step.dataset.order);
        /* `order` is authored in story order, so the k-th tap must be slot k. */
        if (slot === picked.length) {
          picked.push(slot);
          if (picked.length === q.order.length) {
            solved.add(index);
            playStorySound("child-happy");
            $(el.fb).className = "fb good";
            $(el.fb).textContent = cheer() + " That is the order it happened in.";
            setTimeout(advance, 900);
            return;
          }
          draw();
        } else {
          if (!solved.has(index)) missed.add(index);
          playStorySound("child-surprised");
          picked = [];
          $(el.fb).className = "fb bad";
          $(el.fb).textContent = "Almost! Start again from what happened first.";
          setTimeout(draw, 650);
        }
      }
    }

    draw();
  }

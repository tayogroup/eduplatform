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

  function bookShelf(o) {
    const el = o.el;
    const books = o.items;
    let opened = false;

    function drawShelf() {
      $(el.ask).innerHTML = o.ask || "Choose a book to read.";
      $(el.stage).innerHTML = '<div class="shelf" id="' + el.shelf + '"></div>';
      $(el.score).textContent = books.length + (books.length === 1 ? " book" : " books");
      $(el.shelf).innerHTML = books.map((b, k) =>
        '<div class="bookcard"><span class="bookicon" aria-hidden="true">\u{1F4D6}</span>' +
        '<span class="booktitle">' + esc(b.title) + "</span>" +
        (b.author ? '<span class="bookmeta">by ' + esc(b.author) + "</span>" : "") +
        '<span class="bookmeta">' + b.pages.length + " pages</span>" +
        '<button type="button" class="big small teal" data-book="' + k + '">Read ▶</button></div>').join("");
      $(el.shelf).addEventListener("click", (e) => {
        const b = e.target.closest("[data-book]");
        if (!b) return;
        openReader(books[Number(b.dataset.book)]);
      });
    }

    function openReader(book) {
      opened = true;
      let page = 0;
      const overlay = document.createElement("div");
      overlay.className = "book-reader";
      document.body.appendChild(overlay);

      function renderPage() {
        const p = book.pages[page];
        const last = page === book.pages.length - 1;
        overlay.innerHTML =
          '<div class="book-reader-top"><span class="booktitle">' + esc(book.title) + "</span>" +
          '<button type="button" class="book-close" aria-label="Close the book">&#10005;</button></div>' +
          '<div class="book-stage-wrap"><div class="book-stage" id="bookStage"></div></div>' +
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
        if (backBtn) backBtn.addEventListener("click", () => { page--; renderPage(); });
        const nextBtn = overlay.querySelector("#bookNext");
        if (nextBtn) nextBtn.addEventListener("click", () => { page++; renderPage(); });
        const finishBtn = overlay.querySelector("#bookFinish");
        if (finishBtn) finishBtn.addEventListener("click", () => {
          closeReader();
          finish(o.finish, o.done);
        });
        overlay.querySelector("#bookListen").addEventListener("click", () => VOICE.speak(p.text));

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
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
      function onKey(e) { if (e.key === "Escape") closeReader(); }
      document.addEventListener("keydown", onKey);
      renderPage();
    }

    drawShelf();
  }

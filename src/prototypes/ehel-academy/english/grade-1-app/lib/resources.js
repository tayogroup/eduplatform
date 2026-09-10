  /* ==================================================================
     STUDENT RESOURCES - the drawer, not a step.

     Five things, every one of which the shell course already offers from
     its own Student resources page (english.js :: studentResourceCards).
     That page was read before any of this was built, on the owner's
     instruction, and the wording, the grouping and the "none of this is a
     step you have to finish" framing come from it.

       Core words        this unit's words, their meanings and a voice
       Glossary          995 Grade 1 words, searchable, each with a voice
       Unit study plan   jumps to the plan step, which is step 1
       Grade study plan  the year, on the hub
       How to write it   the pen writing each word, stroke by stroke
       Handwriting sheet the same words on ruled lines, to print

     NOTHING HERE COMPLETES ANYTHING. It is marked done on being opened,
     because a drawer you have to finish is not a drawer - the same reason
     the plan step ticks on being read.
     ================================================================== */
  function studentResources(o) {
    const el = o.el;
    const res = o.res || {};
    const DEV = ["localhost", "127.0.0.1"].includes(location.hostname);

    /* The glossary is NOT baked into the page: 995 entries with definitions
       and audio paths would be several hundred KB in each of ten pages. It
       ships on the content tier already, so it is fetched when the drawer is
       opened - and the two trees are laid out differently, which is the same
       dev/production split clip() makes for audio one file up. */
    const GLOSSARY_URL = DEV
      ? "../grade-1/data/sentence-glossary.json"
      : "../../../content/english/g01/sentence-glossary.json";
    let glossary = null;

    const CARDS = [
      { id: "words", icon: "\u{1F524}", title: "Core words", blurb: "Every new word in this unit, what it means, and a voice to listen to." },
      { id: "glossary", icon: "\u{1F50E}", title: "Word finder", blurb: "Look up any word Grade 1 teaches, from any unit." },
      { id: "plan", icon: "\u{1F4C5}", title: "The plan for this unit", blurb: "Which weeks this unit runs, and what to do each day." },
      { id: "gradeplan", icon: "\u{1F5FA}", title: "The whole year", blurb: "All ten units and where each one falls in the terms." },
      { id: "write", icon: "\u{270D}", title: "How to write it", blurb: "Watch the pen write each word, and see where to start." },
      { id: "sheet", icon: "\u{1F5A8}", title: "Handwriting sheet", blurb: "This unit's words on handwriting lines. Trace each one, then write it yourself." },
    ];
    /* Reference rather than activities, which is why these are cards and not
       steps: one is a timetable, the other is a letter to an adult. The guide
       is offered only where the unit authors one - 9 of the 10 do, and Unit 10
       does not, so it simply is not there, the way the shell drops it from the
       nav of a unit that lacks one. */
    if ((res.live || []).length) {
      CARDS.push({ id: "live", icon: "\u{1F4F9}", title: "Live sessions",
        blurb: "When your class meets your teacher, and what to bring." });
    }
    if (res.guide) {
      CARDS.push({ id: "guide", icon: "\u{1F46A}", title: res.guide.label || "Teacher & Parent Guide",
        blurb: "For your grown-up: what this unit teaches, and how to help." });
    }

    function drawShelf() {
      $(el.ask).innerHTML = o.ask || "Your word lists, your plans, and a pencil and paper.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf" id="' + el.res + '">' + CARDS.map((c) =>
        '<div class="bookcard"><span class="bookicon" aria-hidden="true">' + c.icon + "</span>" +
        '<span class="booktitle">' + esc(c.title) + "</span>" +
        '<span class="bookmeta">' + esc(c.blurb) + "</span>" +
        '<button type="button" class="big small teal" data-res="' + c.id + '">Open ▶</button></div>').join("") + "</div>";
      $(el.score).textContent = CARDS.length + " things for you";
      $(el.res).addEventListener("click", (e) => {
        const b = e.target.closest("[data-res]");
        if (b) open(b.dataset.res);
      });
    }

    /* One overlay shape for all of them, the same chrome the book reader and
       the reading reader use, so the drawer does not look like a third thing. */
    function panel(title, bodyHtml, footHtml) {
      const overlay = document.createElement("div");
      overlay.className = "book-reader res-reader";
      overlay.innerHTML =
        '<div class="book-reader-top"><span class="booktitle">' + esc(title) + "</span>" +
        '<button type="button" class="book-close" aria-label="Close">&#10005;</button></div>' +
        '<div class="book-stage-wrap"><div class="res-stage">' + bodyHtml + "</div></div>" +
        '<div class="book-reader-bottom">' + (footHtml || "") + "</div>";
      document.body.appendChild(overlay);
      const close = () => { try { VOICE.stop(); } catch (_) { /* nothing */ } overlay.remove(); document.removeEventListener("keydown", onKey); };
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);
      overlay.querySelector(".book-close").addEventListener("click", close);
      return { overlay, close };
    }

    function wordRows(groups) {
      return groups.map((g) =>
        '<section class="wordgroup"><h4>' + esc(g.title) + "</h4>" +
        g.words.map((w) =>
          '<div class="wordrow"><button type="button" class="hear" data-say="' + esc(w.w) +
          '" data-audio="' + esc(w.audio || "") + '" aria-label="Hear ' + esc(w.w) + '">&#128266;</button>' +
          '<strong>' + esc(w.w) + "</strong>" +
          (w.meaning ? "<span>" + esc(w.meaning) + "</span>" : "") + "</div>").join("") +
        "</section>").join("");
    }

    function wireHear(root) {
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-say]");
        if (b) playClip(b.dataset.audio, b.dataset.say);
      });
    }

    /* WHICH cards would be eight more section ids and the map is capped at
       twenty; how many were opened is the fact that fits, and it separates a
       child who found the word list from one who opened the drawer and left. */
    const opened = new Set();

    async function open(id) {
      opened.add(id);
      reportAttempt(o.finish, opened.size, CARDS.length, "cards");
      if (id === "plan") { finish(o.finish, o.done); show(0, true); return; }
      if (id === "gradeplan") { location.href = "index.html" + location.search; return; }

      if (id === "words") {
        const total = (res.words || []).reduce((a, g) => a + g.words.length, 0);
        const p = panel("Core words", '<div class="wordlist">' + wordRows(res.words || []) + "</div>",
          '<span class="book-page-count">' + total + " words in this unit</span>");
        wireHear(p.overlay);
        finish(o.finish, o.done);
        return;
      }

      if (id === "glossary") {
        const p = panel("Word finder",
          '<div class="glossary"><input type="search" id="gloxq" class="gloxq" placeholder="Type a word…" '
          + 'autocomplete="off" aria-label="Search the word list"><div id="gloxr" class="gloxr">Loading the word list…</div></div>',
          '<span class="book-page-count" id="gloxn"></span>');
        finish(o.finish, o.done);
        if (!glossary) {
          try {
            const r = await fetch(GLOSSARY_URL);
            glossary = r.ok ? (await r.json()).entries || {} : {};
          } catch (_) { glossary = {}; }
        }
        const keys = Object.keys(glossary).sort();
        /* Baked into the page rather than fetched with the glossary: 6.1 KB
           against several hundred, and wordPicture() is a shell function this
           build has no access to at runtime. */
        const pictures = res.pictures || {};
        const box = p.overlay.querySelector("#gloxr");
        const count = p.overlay.querySelector("#gloxn");
        if (!keys.length) { box.textContent = "The word list could not be loaded just now."; return; }
        const draw = (q) => {
          const term = String(q || "").trim().toLowerCase();
          // Words that START with what was typed first, then words that
          // merely contain it - a five-year-old typing "ca" wants "cat"
          // before "because".
          const hits = term
            ? keys.filter((k) => k.toLowerCase().startsWith(term)).concat(
                keys.filter((k) => !k.toLowerCase().startsWith(term) && k.toLowerCase().includes(term)))
            : keys;
          count.textContent = hits.length + " of " + keys.length + " words";
          box.innerHTML = hits.slice(0, 80).map((k) => {
            const e2 = glossary[k] || {};
            /* A narration is offered where it EXISTS. `available` and a source
               are both required: a Listen that plays nothing is worse than no
               Listen, which is the rule the hand-raise button keeps. Every one
               of the 995 entries satisfies both today, so this is a rule and
               not a filter - but it is the right way round. */
            const clipOf = (a) => (a && a.available && (a.source || a.normal)) || "";
            const wordSrc = clipOf(e2.wordAudio);
            const meaningSrc = clipOf(e2.definitionAudio);
            const pic = pictures[k] || "";
            const hear = (src, text, what) =>
              '<button type="button" class="hear" data-say="' + esc(text) +
              '" data-audio="' + esc(src) + '" aria-label="Hear ' + esc(what) + '">&#128266;</button>';
            return '<div class="gloxrow">' +
              /* Empty where the word has no picture - 54% of them are abstract,
                 and English's map shows nothing rather than something wrong. */
              '<span class="gloxpic" aria-hidden="true">' + esc(pic) + "</span>" +
              '<div class="gloxbody">' +
              '<div class="gloxhead"><strong>' + esc(k) + "</strong>" +
              (wordSrc ? hear(wordSrc, k, k) : "") + "</div>" +
              (e2.definition
                ? '<p class="gloxdef">' + esc(e2.definition) +
                  (meaningSrc ? hear(meaningSrc, e2.definition, "the meaning of " + k) : "") + "</p>"
                : "") +
              /* No recorded clip exists for an example, so this one passes NO
                 source and playClip falls through to say() - the app's own
                 voice. The button still reaches something, which is the test. */
              (e2.example
                ? '<p class="gloxeg">\u201c' + esc(e2.example) + "\u201d" +
                  hear("", e2.example, "the example for " + k) + "</p>"
                : "") +
              "</div></div>";
          }).join("") + (hits.length > 80 ? '<p class="gloxmore">Showing the first 80. Type a bit more.</p>' : "");
        };
        draw("");
        wireHear(box);
        const q = p.overlay.querySelector("#gloxq");
        q.addEventListener("input", () => draw(q.value));
        q.focus();
        return;
      }

      if (id === "live") {
        panel("Live sessions",
          '<div class="livelist">' + (res.live || []).map((x) =>
            '<article class="livecard"><span class="livewhen">Week ' + esc(String(x.week)) +
            " \u00b7 session " + esc(String(x.no)) +
            (x.mins ? " \u00b7 " + esc(String(x.mins)) + " min" : "") + "</span>" +
            "<h4>" + esc(x.title) + "</h4>" +
            (x.before ? "<p><strong>Before:</strong> " + esc(x.before) + "</p>" : "") +
            (x.agenda ? "<p><strong>In class:</strong> " + esc(x.agenda) + "</p>" : "") +
            (x.after ? "<p><strong>After:</strong> " + esc(x.after) + "</p>" : "") +
            "</article>").join("") + "</div>",
          '<span class="book-page-count">' + (res.live || []).length + " sessions in this unit</span>");
        finish(o.finish, o.done);
        return;
      }

      if (id === "guide") {
        const g = res.guide || {};
        panel(g.label || "Teacher & Parent Guide",
          '<div class="guide">' +
          (g.intro ? '<p class="guide-intro">' + esc(g.intro) + "</p>" : "") +
          (g.sections || []).map((sx) =>
            "<section><h4>" + esc(sx.title) + "</h4>" +
            String(sx.body || "").split(/\n{2,}/).filter((para) => para.trim())
              .map((para) => "<p>" + esc(para.trim()) + "</p>").join("") +
            /* the section's list, where it has one - the outcomes and the word
               groups are lists in every unit, and drew as bare headings until
               the builder passed them across */
            ((sx.items || []).length
              ? "<ul>" + sx.items.map((it) => "<li>" + esc(it) + "</li>").join("") + "</ul>"
              : "") +
            "</section>").join("") + "</div>",
          '<span class="book-page-count">For a grown-up</span>');
        finish(o.finish, o.done);
        return;
      }

      if (id === "write") { openHandwriting(); return; }
      if (id === "sheet") { printSheet(); return; }
    }

    /* ---- How to write it -------------------------------------------
       The pen path, stroke by stroke, from the SAME alphabet the shell
       course animates (cursive-strokes.js, inlined by the builder rather
       than copied). A body stroke is the letter, a join is the travel
       between letters, and a mark is what the hand does after lifting the
       pen - so the three are drawn in that order and named that way.

       cursiveCanWrite asks about the word AS SPELLED, so anything this
       alphabet cannot join is listed as skipped rather than animated into
       something it is not. */
    function openHandwriting() {
      const all = (res.words || []).flatMap((g) => g.words.map((w) => w.w));
      const writable = all.filter((w) => cursiveCanWrite(String(w).toLowerCase()));
      const skipped = all.length - writable.length;
      if (!writable.length) return;
      let at = 0;
      const p = panel("How to write it",
        '<div class="hw"><div class="hwpick" id="hwpick"></div>'
        + '<div class="hwstage" id="hwstage"></div><p class="hwsay" id="hwsay"></p></div>',
        '<button type="button" class="big small teal" id="hwplay">✎ Write it</button>'
        + '<span class="book-page-count">' + writable.length + " word" + (writable.length === 1 ? "" : "s")
        + (skipped ? " · " + skipped + " not joined" : "") + "</span>");
      finish(o.finish, o.done);
      const pick = p.overlay.querySelector("#hwpick");
      const stage = p.overlay.querySelector("#hwstage");
      const saying = p.overlay.querySelector("#hwsay");
      let timers = [];

      function stop() { timers.forEach(clearTimeout); timers = []; }

      function paintPicker() {
        pick.innerHTML = writable.map((w, k) =>
          '<button type="button" class="hwtab' + (k === at ? " on" : "") + '" data-w="' + k + '">' + esc(w) + "</button>").join("");
      }

      function draw(animate) {
        stop();
        const model = cursiveWord(String(writable[at]).toLowerCase());
        if (!model) return;
        const f = model.frame;
        const padX = 30, padY = 24;
        const w = model.width + padX * 2, h = (f.desc - f.asc) + padY * 2;
        const line = (y, cls) => '<line class="' + cls + '" x1="0" y1="' + (y + padY) + '" x2="' + w + '" y2="' + (y + padY) + '"/>';
        stage.innerHTML =
          '<svg viewBox="0 0 ' + w + " " + h + '" class="hwsvg" role="img" aria-label="How to write ' + esc(writable[at]) + '">' +
          line(f.asc, "hwl faint") + line(f.mid, "hwl faint") + line(f.base, "hwl base") + line(f.desc, "hwl faint") +
          model.strokes.map((st, i) =>
            '<path class="hws ' + st.kind + '" data-i="' + i + '" d="' + st.d +
            '" transform="translate(' + (st.dx + padX) + "," + padY + ')"/>').join("") +
          "</svg>";
        const paths = [...stage.querySelectorAll(".hws")];
        paths.forEach((el2) => {
          const len = el2.getTotalLength ? el2.getTotalLength() : 0;
          el2.style.strokeDasharray = len;
          el2.style.strokeDashoffset = animate ? len : 0;
        });
        saying.textContent = animate ? "" : "Press Write it to watch the pen.";
        if (!animate) return;
        let t = 0;
        paths.forEach((el2, i) => {
          const st = model.strokes[i];
          const len = el2.getTotalLength ? el2.getTotalLength() : 0;
          // A join is the pen travelling, so it goes quickly; a body stroke is
          // the letter and is worth watching.
          const ms = st.kind === "join" ? 220 : Math.max(420, len * 3.2);
          timers.push(setTimeout(() => {
            el2.style.transition = "stroke-dashoffset " + ms + "ms linear";
            el2.style.strokeDashoffset = 0;
            if (st.say) { saying.textContent = st.say; say(st.say); }
          }, t));
          t += ms + (st.kind === "join" ? 40 : 160);
        });
        timers.push(setTimeout(() => { saying.textContent = "That is " + writable[at] + "."; }, t + 120));
      }

      pick.addEventListener("click", (e) => {
        const b = e.target.closest("[data-w]");
        if (!b) return;
        at = Number(b.dataset.w); paintPicker(); draw(false);
      });
      p.overlay.querySelector("#hwplay").addEventListener("click", () => draw(true));
      paintPicker();
      draw(false);
    }

    /* ---- the handwriting sheet -------------------------------------
       Print, not download: the sheet exists to be written on with a pencil.
       The cursive face is the one the shell self-hosts - the CSS generic
       `cursive` is Comic Sans on Windows, which is unjoined print, so
       shipping the font is what makes this a handwriting sheet at all. */
    function printSheet() {
      /* NEVER EMIT A CLOSING STYLE TAG WHOLE, ANYWHERE IN THIS FILE - not in a
         string, and not in a comment either. lesson-app-tools'
         wire-navigation.py and add-header-bars.py both splice their CSS at the
         LAST occurrence of one in the built page, so a whole one down here is
         the last one, and their stylesheet lands inside this JavaScript.
         Both mistakes were made in turn: first in the printed markup below,
         then in the comment explaining the first. Every one of the ten pages
         failed to parse, and only parsing the BUILT pages caught it. */
      const words = (res.words || []).flatMap((g) => g.words.map((x) => x.w))
        .filter((w) => cursiveCanWrite(String(w).toLowerCase()));
      if (!words.length) return;
      const font = new URL("../../shared/fonts/EduNSWACTFoundation-normal-400-700.woff2", location.href).href;
      const rows = words.map((w) =>
        '<div class="row"><div class="lines"><span class="trace">' + esc(w) + " " + esc(w) + "</span></div>"
        + '<div class="lines empty"></div></div>').join("");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write('<!doctype html><meta charset="utf-8"><title>Handwriting - Unit '
        + res.unit + "</title><sty" + "le>"
        + '@font-face{font-family:"Ehel Cursive";src:url("' + font + '") format("woff2");font-weight:400 700;font-display:swap}'
        + "@page{size:A4 portrait;margin:14mm}"
        + 'body{font-family:"Inter",system-ui,sans-serif;color:#12232e;margin:0}'
        + "h1{font-size:19pt;margin:0 0 2mm}p.sub{margin:0 0 7mm;color:#5b6b76;font-size:10.5pt}"
        + ".row{break-inside:avoid;margin:0 0 7mm}"
        + ".lines{height:15mm;border-bottom:1.1pt solid #3b4a55;border-top:.6pt dashed #b9c4cc;"
        + "position:relative;margin-bottom:2.5mm}"
        + ".lines::before{content:'';position:absolute;left:0;right:0;top:50%;border-top:.6pt dashed #cfd8de}"
        + '.trace{font-family:"Ehel Cursive","Ehel Cursive",cursive;font-size:34pt;color:#b9c4cc;'
        + "position:absolute;left:2mm;bottom:0;line-height:1;letter-spacing:.06em}"
        + ".lines.empty{border-top-style:dashed}"
        + "</sty" + "le><h1>Handwriting · Unit " + res.unit + "</h1>"
        + '<p class="sub">Trace the grey words, then write each one yourself on the line underneath.</p>'
        + rows);
      win.document.close();
      finish(o.finish, o.done);
      // Give the face a moment to load, or the trace row prints in a fallback
      // that is not joined - which is the one thing this sheet is for.
      setTimeout(() => { try { win.focus(); win.print(); } catch (_) { /* the user can print it */ } }, 700);
    }

    drawShelf();
  }

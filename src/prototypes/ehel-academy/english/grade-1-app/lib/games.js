  /* ==================================================================
     THE GAME ZONE - the unit's whole authored game pack, one step.

     WHY A PICKER AND NOT A MARCH. Every Grade 1 unit ships twelve games
     of six rounds each in english/grade-1/data/games/unit-N.json. Eleven
     of them are playable here (the twelfth is `speaking`, which needs a
     recorder this build does not have and is reported as skipped rather
     than dropped in silence), so the pack is 66 rounds. An earlier
     version of this lesson carried TWO hand-picked games as two ordinary
     steps, which left nine authored games unreachable; rendering all
     eleven as one 66-round sequence would replace that with a step no
     six-year-old finishes. So this is the shape the shell's own Game Park
     uses: a shelf of cards, tap one, play its six rounds, come back.

     THE STICKER IS EARNED BY PLAYING TWO. One game is a tap-through;
     eleven is a school day. Two is twelve rounds, and the card shelf says
     so on its face and counts down, because a sticker whose condition is
     invisible is a sticker a child cannot aim at.

     FIVE MECHANICS, all read from the pack's own round shape rather than
     from any list here:
       choice    prompt + choices[] + answer + explanation
       spelling  prompt + clue + answer            -> letter tiles
       sentence  prompt + tokens[] + answer        -> word tiles
       sequence  the same shape as sentence
       pairs     prompt + pairs[[word, meaning]]   -> reveal-and-match

     A game plays in a full-viewport overlay, like the book reader above
     it, for the same reason: six rounds of tiles need the screen, not a
     third of it under a slide heading.
     ================================================================== */
  function gameZone(o) {
    const el = o.el;
    const pack = o.pack || {};
    const games = pack.games || [];
    const played = new Set();
    const NEEDED = Math.min(2, games.length);

    const tidy = (s) => String(s).replace(/\s+([.!?])/g, "$1").replace(/\s+/g, " ").trim();
    const same = (a, b) => tidy(a).toLowerCase() === tidy(b).toLowerCase();

    function drawShelf() {
      $(el.ask).innerHTML = o.ask || "Choose a game to play.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="shelf gamelist" id="' + el.gamelist + '"></div>';
      $(el.gamelist).innerHTML = games.map((g, k) =>
        '<div class="bookcard gamecard' + (played.has(g.id) ? " played" : "") + '">' +
        '<span class="bookicon" aria-hidden="true">' + (played.has(g.id) ? "✅" : "\u{1F3AE}") + "</span>" +
        '<span class="booktitle">' + esc(g.title) + "</span>" +
        (g.skill ? '<span class="bookmeta">' + esc(g.skill) + "</span>" : "") +
        '<span class="bookmeta">' + g.rounds.length + " rounds</span>" +
        '<button type="button" class="big small teal" data-game="' + k + '">' +
        (played.has(g.id) ? "Play again ▶" : "Play ▶") + "</button></div>").join("");
      $(el.gamelist).addEventListener("click", (e) => {
        const b = e.target.closest("[data-game]");
        if (b) openGame(games[Number(b.dataset.game)]);
      });
      paintCount();
    }

    /* The condition for the sticker, said out loud and kept current -
       "play two games" is only a goal if the child can see how far off it
       is. The skipped speaking game is named here too rather than being
       quietly absent from a count of twelve. */
    function paintCount() {
      const left = Math.max(0, NEEDED - played.size);
      $(el.score).textContent = games.length + " games"
        + (pack.skipped ? " (" + pack.skipped + " speaking game needs a grown-up, so it is not here)" : "");
      $(el.fb).className = "fb" + (left ? "" : " good");
      $(el.fb).textContent = left
        ? "Play " + left + (left === 1 ? " more game" : " games") + " to earn this step's sticker."
        : "You played " + played.size + ". " + o.done;
    }

    function openGame(game) {
      let r = 0, right = 0;
      const overlay = document.createElement("div");
      overlay.className = "book-reader game-overlay";
      document.body.appendChild(overlay);

      function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        drawShelf();
      }
      function onKey(e) { if (e.key === "Escape") close(); }
      document.addEventListener("keydown", onKey);

      function frame(bodyHtml, footHtml) {
        overlay.innerHTML =
          '<div class="book-reader-top"><span class="booktitle">' + esc(game.title) + "</span>" +
          '<button type="button" class="book-close" aria-label="Close the game">&#10005;</button></div>' +
          '<div class="book-stage-wrap"><div class="game-stage">' + bodyHtml + "</div></div>" +
          '<div class="book-reader-bottom">' +
          '<button type="button" class="big small ghost" id="gameQuit">&#9664; Back to games</button>' +
          '<span class="book-page-count">Round ' + Math.min(r + 1, game.rounds.length) + " of " + game.rounds.length + "</span>" +
          (footHtml || "") + "</div>";
        overlay.querySelector(".book-close").addEventListener("click", close);
        overlay.querySelector("#gameQuit").addEventListener("click", close);
      }

      function nextRound() {
        r++;
        if (r >= game.rounds.length) return endGame();
        setTimeout(drawRound, 900);
      }

      function endGame() {
        played.add(game.id);
        /* ONE ROW PER GAME. The reducer keys checkpoints by an arbitrary
           string, so a single game out of the twelve can carry its own score
           instead of the step reporting one number for the lot - which is what
           "activity level" has to mean for a step that holds twelve
           activities. */
        reportScore(o.finish, right, game.rounds.length, game.id, game.title);
        reportAttempt(o.finish, played.size, (pack.games || []).length, "games");
        /* No cheer over a bad round. "Brilliant! 0 of 6 right" was the
           first version, and a child who can count can read that as the
           page not paying attention. */
        const well = right * 2 >= game.rounds.length;
        frame(
          '<div class="game-done"><p class="gamebig">' + (well ? cheer() : "That is the game played.") + "</p>" +
          "<p>You finished <strong>" + esc(game.title) + "</strong> — " +
          right + " of " + game.rounds.length + " right.</p>" +
          "<p>Getting one wrong costs nothing in a game. It is for practising.</p></div>",
          '<button type="button" class="big small" id="gameOut">Back to the games &#10003;</button>');
        overlay.querySelector("#gameOut").addEventListener("click", close);
        say("You finished " + game.title + ".");
        if (played.size >= NEEDED) finish(o.finish, o.done);
      }

      /* ---- one round, dispatched on the pack's own `type` ---- */
      function drawRound() {
        const round = game.rounds[r];
        if (game.type === "choice") return drawChoice(round);
        if (game.type === "spelling") return drawSpelling(round);
        if (game.type === "pairs") return drawPairs(round);
        if (game.type === "speaking") return drawSpeaking(round);
        return drawTokens(round);   // sentence and sequence share a shape
      }

      function feedback(ok, message) {
        const fb = overlay.querySelector("#gameFb");
        if (!fb) return;
        fb.className = "fb " + (ok ? "good" : "bad");
        fb.textContent = message;
        say(message);
      }

      function drawChoice(round) {
        frame(
          '<p class="gameprompt">' + esc(round.prompt) + "</p>" +
          '<div class="bigbtns" id="gameCh">' +
          shuffle(round.choices).map((c) =>
            '<button type="button" class="choice" data-c="' + esc(c) + '">' + esc(c) + "</button>").join("") +
          "</div><div class='fb' id='gameFb'></div>");
        say(plain(round.prompt));
        let lock = false;
        overlay.querySelector("#gameCh").addEventListener("click", (e) => {
          const b = e.target.closest(".choice"); if (!b || lock) return;
          lock = true;
          const ok = same(b.dataset.c, round.answer);
          overlay.querySelectorAll("#gameCh .choice").forEach((c) => {
            c.disabled = true;
            if (same(c.dataset.c, round.answer)) c.classList.add("right");
          });
          if (!ok) b.classList.add("wrong"); else right++;
          feedback(ok, (ok ? cheer() + " " : "") + (round.explanation || round.answer));
          nextRound();
        });
      }

      /* Letter tiles. The pool is the answer's own letters plus two more
         drawn from the alphabet, so a word cannot be built by tapping every
         tile in the order they are given. */
      function drawSpelling(round) {
        const answer = String(round.answer);
        const letters = answer.replace(/[^A-Za-z]/g, "").split("");
        const extra = "abcdefghijklmnopqrstuvwxyz".split("")
          .filter((c) => !letters.includes(c)).slice(0, 26);
        const pool = shuffle(letters.concat([extra[letters.length % extra.length], extra[(letters.length + 7) % extra.length]]));
        let line = [];
        function paint() {
          frame(
            '<p class="gameprompt">' + esc(round.prompt) + "</p>" +
            (round.clue ? '<p class="gameclue">' + esc(round.clue) + "</p>" : "") +
            '<div class="buildline" id="gameLine">' +
            (line.length ? line.map((t, k) => '<button type="button" class="tile letter" data-line="' + k + '">' + esc(pool[t]) + "</button>").join("")
                         : '<span style="color:var(--muted);font-size:17px">Tap the letters to build the word.</span>') +
            "</div>" +
            '<div class="bigbtns" id="gameTiles">' +
            pool.map((t, k) => '<button type="button" class="tile letter" data-tile="' + k + '"' +
              (line.includes(k) ? " disabled" : "") + ">" + esc(t) + "</button>").join("") +
            "</div><div class='fb' id='gameFb'></div>",
            '<button type="button" class="big small" id="gameCheck">Check it</button>');
          overlay.querySelector("#gameTiles").addEventListener("click", (e) => {
            const b = e.target.closest("[data-tile]"); if (!b || b.disabled) return;
            line.push(Number(b.dataset.tile)); paint();
          });
          overlay.querySelector("#gameLine").addEventListener("click", (e) => {
            const b = e.target.closest("[data-line]"); if (!b) return;
            line.splice(Number(b.dataset.line), 1); paint();
          });
          overlay.querySelector("#gameCheck").addEventListener("click", () => {
            const got = line.map((k) => pool[k]).join("");
            const ok = got.toLowerCase() === letters.join("").toLowerCase();
            overlay.querySelector("#gameLine").className = "buildline " + (ok ? "right" : "wrong");
            if (ok) right++;
            feedback(ok, ok ? cheer() + " " + answer : "Not yet. The word is " + answer + ".");
            nextRound();
          });
        }
        /* `line` holds tile INDEXES, not letters, so a word with the same
           letter twice ("egg") does not disable both tiles on the first tap. */
        paint();
        say(plain(round.clue || round.prompt));
      }

      function drawTokens(round) {
        let line = [];
        function paint() {
          frame(
            '<p class="gameprompt">' + esc(round.prompt) + "</p>" +
            '<div class="buildline" id="gameLine">' +
            (line.length ? line.map((t, k) => '<button type="button" class="tile" data-line="' + k + '">' + esc(round.tokens[t]) + "</button>").join("")
                         : '<span style="color:var(--muted);font-size:17px">Tap the words to build the sentence.</span>') +
            "</div>" +
            '<div class="bigbtns" id="gameTiles">' +
            round.tokens.map((t, k) => '<button type="button" class="tile" data-tile="' + k + '"' +
              (line.includes(k) ? " disabled" : "") + ">" + esc(t) + "</button>").join("") +
            "</div><div class='fb' id='gameFb'></div>",
            '<button type="button" class="big small" id="gameCheck">Check it</button>');
          overlay.querySelector("#gameTiles").addEventListener("click", (e) => {
            const b = e.target.closest("[data-tile]"); if (!b || b.disabled) return;
            line.push(Number(b.dataset.tile)); paint();
          });
          overlay.querySelector("#gameLine").addEventListener("click", (e) => {
            const b = e.target.closest("[data-line]"); if (!b) return;
            line.splice(Number(b.dataset.line), 1); paint();
          });
          overlay.querySelector("#gameCheck").addEventListener("click", () => {
            /* Both sides through the same tidy-up, for the reason the
               buildSentence step records: the tokens carry their own full
               stop, so a raw join is " ." where the answer is "." and the
               round would be impossible to pass on every sentence. */
            const ok = same(line.map((k) => round.tokens[k]).join(" "), round.answer);
            overlay.querySelector("#gameLine").className = "buildline " + (ok ? "right" : "wrong");
            if (ok) right++;
            feedback(ok, ok ? cheer() + " " + tidy(round.answer) : "Not yet. It goes: " + tidy(round.answer));
            nextRound();
          });
        }
        paint();
        say(plain(round.prompt));
      }

      /* Reveal-and-match, the pack's own description ("Reveal tiles and
         connect each word with its meaning"), so the tiles start face down.
         A round is over when all its pairs are matched - there is no wrong
         answer to score, so the round counts as right once finished. */
      function drawPairs(round) {
        let tiles = round.pairs.flatMap((p, pi) => [{ text: p[0], pair: pi }, { text: p[1], pair: pi }]);
        tiles = shuffle(tiles).map((t, k) => ({ ...t, k }));
        let picked = [], matched = 0, lock = false;
        frame(
          '<p class="gameprompt">' + esc(round.prompt || "Tap two tiles that go together.") + "</p>" +
          '<div class="pairsgrid" id="gameGrid">' +
          tiles.map((t) => '<button type="button" class="pairtile" data-k="' + t.k + '">' +
            '<span class="back" aria-hidden="true">?</span>' +
            '<span class="face">' + esc(t.text) + "</span></button>").join("") +
          "</div><div class='fb' id='gameFb'></div>");
        say(plain(round.prompt || "Tap two tiles that go together."));
        overlay.querySelector("#gameGrid").addEventListener("click", (e) => {
          const b = e.target.closest(".pairtile");
          if (!b || lock) return;
          if (b.classList.contains("matched") || b.classList.contains("revealed")) return;
          b.classList.add("revealed");
          picked.push({ pair: tiles[Number(b.dataset.k)].pair, el: b });
          if (picked.length < 2) return;
          lock = true;
          const [a, c] = picked;
          if (a.pair === c.pair) {
            a.el.classList.add("matched"); c.el.classList.add("matched");
            a.el.disabled = true; c.el.disabled = true;
            matched++; picked = []; lock = false;
            if (matched === round.pairs.length) {
              right++;
              feedback(true, cheer() + " Every pair matched.");
              nextRound();
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

      /* Speaking Quest. The pack's rounds carry a `target` - what the child
         is asked to say - and no options, so the round IS the speaking panel.
         It counts as done when they have had a go, for the reason letUsTalk
         records: a game that will not let a five-year-old past until a
         scorer is happy is not a game. */
      function drawSpeaking(round) {
        /* Only a round whose target is a SENTENCE gets the recorder - the
           builder decides that (speakable_target) and 45 of this grade's 60
           rounds are adult-led activities instead: "Point to school things as
           an adult names them". Offering to score a child's pronunciation of
           an instruction would fail every child who did the activity right. */
        if (!round.reference) {
          frame(
            '<p class="gameprompt">' + esc(round.prompt) + "</p>" +
            '<div class="speech-target"><span>Do this</span><p>' + esc(round.target || "") + "</p></div>" +
            '<p class="speech-note">This one is for doing out loud, with a grown-up if one is there. '
            + "There is nothing to check - press Done when you have had a go.</p>",
            '<button type="button" class="big small" id="gameSpokeDone">Done &#10003;</button>');
          say(plain(round.target || round.prompt));
          overlay.querySelector("#gameSpokeDone").addEventListener("click", () => { right++; nextRound(); });
          return;
        }
        frame(
          '<p class="gameprompt">' + esc(round.prompt) + "</p>" +
          '<div id="gameSpeak"></div>');
        say(plain(round.prompt));
        speakingPanel(overlay.querySelector("#gameSpeak"), {
          reference: round.reference,
          audio: "",
          onResult: (r) => { if (r && r.heard && r.accuracy >= 60) right++; },
          onDone: () => nextRound(),
        });
      }

      drawRound();
    }

    drawShelf();
  }

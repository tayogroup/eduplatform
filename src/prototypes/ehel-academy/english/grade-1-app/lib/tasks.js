  /* ==================================================================
     THE UNIT'S WRITING AND SPEAKING TASKS, IN FULL

     Inlined only into an app whose app.config.json sets "taskSteps" (Grades
     1-4 do), so a build without the steps carries none of this code.
     build-lessons.py says why the step exists: "Write a sentence"
     and "Say it out loud" reach a slice of the unit's tasks, and the rest -
     including every task authored to close a Cambridge objective - were on no
     page of this build.

     PAPER WORK, the way activityList() is off-screen work: nothing marks
     it and nothing pretends to. A writing card keeps its model and its
     checklist behind buttons, so the learner writes first and looks second.
     The checklist is the unit's own successCriteria, which the course
     already writes in the learner's voice ("I chose one clear feeling"), so
     it is drawn as theirs - not as a note for a grown-up.

     A task that has not been through curriculum review says so on its
     card, the way the Fluency step says it for the same state.
     ================================================================== */
  function taskList(o) {
    const el = o.el;
    const did = new Array(o.items.length).fill(false);
    const open = o.items.map(() => ({ model: false, check: false }));

    function card(it, k) {
      let html = '<div class="act task' + (did[k] ? " did" : "") + '" data-k="' + k + '">' +
        '<div class="act-head"><span class="act-n">' + it.n + "</span>" +
        '<span class="task-title">' + esc(it.title) + "</span>" +
        '<button type="button" class="hear" data-act="hear" aria-label="Hear this task">&#128266;</button></div>';
      if (it.review) {
        html += '<p class="task-review">A teacher has not checked this task yet.</p>';
      }
      html += '<div class="task-lines">' + it.lines.map((t) => "<p>" + esc(t) + "</p>").join("") + "</div>";
      if (o.write) {
        if (it.length) html += '<p class="task-meta"><b>How long</b> ' + esc(it.length) + "</p>";
        if (it.support) html += '<p class="task-meta"><b>Stuck?</b> ' + esc(it.support) + "</p>";
        if (it.model) {
          html += '<button type="button" class="act-how" data-act="model">' +
            (open[k].model ? "Hide the example" : "See an example") + "</button>";
          if (open[k].model) html += '<p class="task-model">' + esc(it.model) + "</p>";
        }
        if (it.criteria && it.criteria.length) {
          html += '<button type="button" class="act-how" data-act="check">' +
            (open[k].check ? "Hide the checklist" : "Check my work") + "</button>";
          if (open[k].check) {
            html += '<ul class="task-check">' + it.criteria.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>";
            if (it.extension) html += '<p class="task-meta"><b>Want more?</b> ' + esc(it.extension) + "</p>";
          }
        }
      } else if (it.record) {
        html += '<p class="task-meta"><b>Tip</b> Record yourself on a phone or tablet if you can, then listen back.</p>';
      }
      return html + '<button type="button" class="tick" data-act="tick">' +
        (did[k] ? "✓ done" : "I did this") + "</button></div>";
    }

    function paint() {
      $(el.ask).innerHTML = o.write ? "Writing to do on paper." : "Speaking to do out loud.";
      $(el.stage).className = "stagewide";
      $(el.stage).innerHTML = '<div class="acts" id="' + el.tasks + '">' + o.items.map(card).join("") + "</div>" +
        '<div class="bigbtns"><button type="button" class="big small" id="' + el.tasks + 'fin">' +
        "I have done my tasks &#10003;</button></div>";

      const ticked = did.filter(Boolean).length;
      reportAttempt(o.finish, ticked, did.length, "tasks");
      $(el.score).textContent = ticked + " of " + o.items.length + " ticked"
        + (ticked === o.items.length ? " - all of them" : "");

      $(el.tasks + "fin").addEventListener("click", () => {
        $(el.fb).className = "fb good";
        $(el.fb).textContent = o.done;
        finish(o.finish, o.done);
      });
    }

    $(el.stage).addEventListener("click", (e) => {
      const card = e.target.closest(".task");
      const button = e.target.closest("[data-act]");
      if (!card || !button) return;
      const k = Number(card.dataset.k);
      const it = o.items[k];
      /* The spoken fallback is the whole task - its title and every line -
         for the reason activityList gives: a task whose clip is missing or
         withdrawn must not be read out as its first sentence alone. */
      if (button.dataset.act === "hear") { playClip(it.audio, [it.title].concat(it.lines).join(" ")); return; }
      if (button.dataset.act === "model") { open[k].model = !open[k].model; paint(); return; }
      if (button.dataset.act === "check") { open[k].check = !open[k].check; paint(); return; }
      if (button.dataset.act === "tick") { did[k] = !did[k]; paint(); }
    });

    paint();
  }

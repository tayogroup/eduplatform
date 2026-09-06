/* Raise a hand, the class chat, and the Join class pill.
 *
 * Extracted from course-app.js on 2026-09-07, unchanged apart from being wrapped
 * in mountLearnerControls() and taking its seven inputs as a config object.
 *
 * The reason it is a module and not a copy is written in the block below and is
 * worth repeating here: both controls are SINGLETONS that own polling state and
 * an unread dot, so a second copy polls twice and disagrees with itself about
 * whether a hand is up. The standalone Grade 1 Maths lesson pages needed these
 * controls; giving them their own copy is the one thing that must not happen.
 *
 * HAND_ENDPOINT and CHAT_ENDPOINT stay assigned from platformUrl() at top level
 * because check-platform-cors.mjs discovers endpoints by parsing exactly that
 * shape out of shell/*.js. Move them into the function and the release gate
 * silently stops probing two endpoints.
 */
import { platformUrl, platformHeaders } from "./wehel.js?v=wehel-4";
import { escapeHtml as sharedEscapeHtml } from "../shared/course-shell.js?v=20260721a";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (v = "") => sharedEscapeHtml(v);

const HAND_ENDPOINT = platformUrl("/local/hubredirect/course_hand_raise.php");
const CHAT_ENDPOINT = platformUrl("/local/hubredirect/course_group_chat.php");

/* Mounts both controls and returns placeLearnerControls, which the caller must
 * re-run on every deck mount: mountDeck() rebuilds its host with innerHTML, so a
 * button parented into .gc-top is destroyed by the next mount. */
export function mountLearnerControls({ token = "", launchToken = "", launchEndpoint = "",
                                       progressUnit = "" } = {}) {
  const PROGRESS_UNIT = progressUnit;
    // --- raise a hand ---------------------------------------------------------
    //
    // One live teacher runs two groups of nine out of phase: while one group is
    // taught, this learner works here with no adult in the room. The escalation
    // ladder they are taught is worked example, then Wehel, then the group chat,
    // then the teacher — and until now there was no fourth step, because a child
    // in the other breakout room had no way to say "I am stuck" that did not mean
    // interrupting the lesson next door by voice.
    //
    // The teacher sees it on live_group_board.php, where a raised hand sorts above
    // every inferred signal: staleness is the board GUESSING who needs help, and
    // this is the one thing the learner said out loud.
    //
    // SILENT UNLESS IT CAN DO SOMETHING, the same rule the subject picker keeps
    // above. The server answers `watched` — is this learner in an active class
    // group with a teacher on it — and the button is not mounted at all when it
    // is false. A tutoring learner working alone at nine at night must not be
    // offered a button that reaches nobody: they would wait for help that is not
    // coming instead of asking Wehel or re-reading the worked example, which is
    // worse than having no button.
    //
    // Assigned to a CONST from platformUrl() because that is the pattern
    // check-platform-cors.mjs reads to discover endpoints and decide whether each
    // needs Allow-Credentials — this one is token-authenticated and sends none,
    // like the progress gateway.

    // WHERE Raise hand and Class chat live, in ONE place (owner, 2026-09-03).
    //
    // They sit in the deck's own header when a deck is on the page, and in the
    // topbar otherwise. The learner asked for them in the deck header because the
    // deck's Full screen button (theatre mode) hides the topbar — so a child deep
    // in a slide deck, which is exactly when they are stuck, lost the only two
    // ways of reaching their teacher.
    //
    // MOVED, never cloned. Both controls are singletons that own polling state and
    // an unread dot; a second copy would poll twice and disagree with itself about
    // whether a hand is up.
    //
    // Called again on every deck mount, and that is not belt-and-braces:
    // mountDeck() rebuilds its host with innerHTML, so a button parented into
    // .gc-top is DESTROYED by the next mount — a filter change, a section change.
    // mountHandRaise/mountClassChat run once at init and are guarded by an
    // existence check, so nothing would ever recreate it and the control would be
    // gone until a reload. Re-placing on each mount is what makes the move safe.
    function placeLearnerControls({ toTopbar = false } = {}) {
      const deckTop = toTopbar ? null : $(".gc-top");
      const actions = $(".top-actions");
      for (const id of ["class-chat-toggle", "hand-raise"]) {
        const button = document.getElementById(id);
        if (!button) continue;
        // Before the Full screen button, so the header reads
        // heading · count · chat · hand · Full screen.
        const home = deckTop || actions;
        if (!home || button.parentElement === home) continue;
        const theatre = deckTop && deckTop.querySelector(".gc-theatre");
        if (theatre) deckTop.insertBefore(button, theatre);
        else if (deckTop) deckTop.appendChild(button);
        else actions.prepend(button);
        button.classList.toggle("in-deck-header", !!deckTop);
      }
    }
    // deck.js says a deck has been built; it cannot call in here (it is shared by
    // all six subjects and imports nothing from the shell), so it announces and
    // this listens — the seam already used for ehel:leave-to-board and
    // ehel:resume-lesson. One listener serves every subject.
    document.addEventListener("ehel:deck-mounted", placeLearnerControls);

    function mountHandRaise() {
      const actions = $(".top-actions");
      if (!actions || !launchToken || !launchEndpoint || $("#hand-raise")) return;

      // text/plain keeps this a SIMPLE request, so there is no CORS preflight —
      // the focus beacon's trick. Unlike that beacon this is a fetch and not
      // sendBeacon, because the learner needs the answer: the button's whole
      // honesty rests on knowing whether the hand actually went up.
      const post = (body) => fetch(HAND_ENDPOINT, {
        method: "POST", mode: "cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ token: launchToken, ...body }),
      }).then((response) => (response.ok ? response.json() : null)).catch(() => null);

      let up = false;
      let button = null;
      let poll = 0;

      const paint = () => {
        button.textContent = up ? "✋ Hand up" : "✋ Raise hand";
        button.setAttribute("aria-pressed", up ? "true" : "false");
        button.title = up
          ? "Your teacher can see your hand. Press again to put it down."
          : "Tell your teacher you are stuck. Keep working while you wait.";
        // Raised state inline rather than in a stylesheet class: course-ui.css is
        // imported by all six subjects and bundled into each release as
        // design-system.css, so one cosmetic rule there makes five other
        // subjects' app tiers stale (CLAUDE.md, the shared-stylesheet coupling).
        // seb-session.js styles its injected controls the same way.
        button.style.background = up ? "#1a67a3" : "white";
        button.style.color = up ? "#fff" : "";
        button.style.borderColor = up ? "#1a67a3" : "";
      };

      // Only while a hand is UP, so an ordinary lesson makes no repeat requests.
      // It exists because the TEACHER can lower this hand from the board when
      // they answer, and without it the child would still see their hand up.
      const watch = () => {
        clearInterval(poll);
        if (!up) return;
        poll = setInterval(async () => {
          const state = await post({});
          if (state && state.ok && !state.up && up) { up = false; paint(); clearInterval(poll); }
        }, 30000);
      };

      const toggle = async () => {
        button.disabled = true;
        const wanted = !up;
        const state = await post({ up: wanted, unit: PROGRESS_UNIT, section: location.hash.replace("#", "") });
        button.disabled = false;
        if (!state || !state.ok) {
          // Say what is true. A hand that silently failed to go up is the one
          // failure this control must never have, because the child then waits.
          button.title = "That did not send. Check your connection and try again.";
          return;
        }
        up = !!state.up;
        paint();
        watch();
      };

      // One request on mount, which also settles what a RELOAD should show: the
      // hand lives on the server, so a learner who refreshes must not see their
      // raised hand come back down while the teacher still has it flagged.
      post({}).then((state) => {
        if (!state || !state.ok || !state.watched) return;
        button = document.createElement("button");
        button.type = "button";
        button.id = "hand-raise";
        // top-grade-picker for a pill that already exists and is NOT hidden on
        // mobile the way .icon-button is — this control must reach a learner on a
        // phone. It also inherits the html.young-stage sizing, which makes the
        // button bigger and rounder at Stages 1-4, the learners most likely to
        // need it. Only the select-specific width and padding are overridden.
        button.className = "top-grade-picker top-hand-raise";
        button.style.cssText = "width:auto;padding:8px 12px;cursor:pointer";
        up = !!state.up;
        paint();
        button.addEventListener("click", toggle);
        actions.prepend(button);
        // The server answers after the page has rendered, so a deck is usually
        // already on screen by now; placement decides which header it belongs to.
        placeLearnerControls();
        watch();
      });
    }
    mountHandRaise();

    // --- the classroom chat, the learner's end --------------------------------
    // Step 3 of the escalation ladder, which named a group chat the platform did
    // not have. The room is ASYMMETRIC by safeguarding design ("no student-to-
    // student messaging", stated twice in the requirements and gated by
    // check-class-group-chat.php): the teacher's messages reach everyone, this
    // learner's reach the teacher alone — and their own bubble says so, because
    // a child must never believe the class read something the class cannot read.
    //
    // Mounts only when the server says the room exists and is enabled — the
    // Raise-hand rule. The server derives WHICH room from the roster; the app
    // never names a group.
    function mountClassChat() {
      const actions = $(".top-actions");
      if (!actions || !launchToken || !launchEndpoint || $("#class-chat-toggle")) return;

      // text/plain keeps this a SIMPLE request (no preflight), the hand's trick;
      // a fetch rather than a beacon because the reply carries the messages.
      const post = (body) => fetch(CHAT_ENDPOINT, {
        method: "POST", mode: "cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ token: launchToken, ...body }),
      }).then((response) => (response.ok ? response.json() : null)).catch(() => null);

      let lastId = 0;
      let open = false;
      let unread = false;
      let panel = null;
      let msgsEl = null;
      let button = null;
      // THE TUTORING SHAPE (owner, 2026-09-05). The same door answers a tutoring
      // learner with tutoring:true: their room is one thread per learner per
      // subject with the subject's teacher group on the other side, so the panel
      // says "Tutor chat", captions staff as "Tutor", offers a homework file
      // (JPEG, PNG, PDF, Word, PowerPoint) beside the camera, and says a reply
      // can take a while. Set from the first state read; null for a class room.
      let TUT = null;
      let threadId = 0;

      // NOTIFY, not just mark. The unread dot alone assumes a child scans the
      // topbar; a five-year-old deep in an exercise does not. So a new message
      // from someone else pulses the button and plays one soft two-note chime.
      // The chime is Web Audio (no asset, no permission dialog); browsers gate
      // audio behind a user gesture, so a blocked context fails silently and the
      // pulse still carries the signal. One chime per quiet period -- the flag
      // resets when the panel opens -- because a repeating ping during a lesson
      // is noise, not notice.
      let chimed = false;
      let audioCtx = null;
      const chime = () => {
        if (chimed) return;
        chimed = true;
        try {
          audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === "suspended") audioCtx.resume();
          const at = audioCtx.currentTime;
          [[523.25, 0], [659.25, 0.16]].forEach(([freq, delay]) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.value = freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.0001, at + delay);
            gain.gain.exponentialRampToValueAtTime(0.06, at + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + delay + 0.35);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(at + delay);
            osc.stop(at + delay + 0.4);
          });
        } catch (e) { /* never break the lesson; the pulse still shows */ }
      };
      // The pulse needs @keyframes, which inline styles cannot carry. The style
      // tag ships inside this module (not course-ui.css), so the shared-
      // stylesheet coupling is untouched, and it respects reduced-motion.
      if (!document.getElementById("class-chat-pulse-style")) {
        const st = document.createElement("style");
        st.id = "class-chat-pulse-style";
        st.textContent = "@keyframes ccPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}"
          + ".cc-pulse{animation:ccPulse .9s ease-in-out 4}"
          + "@media (prefers-reduced-motion: reduce){.cc-pulse{animation:none}}";
        document.head.appendChild(st);
      }

      const paintButton = () => {
        const label = TUT ? "💬 Tutor chat" : "💬 Class chat";
        button.textContent = unread ? label + " •" : label;
        button.title = unread
          ? (TUT ? "A tutor wrote something new." : "Your teacher wrote something new.")
          : (TUT
            ? `Write to your ${TUT.subjectlabel} tutors. Only they see what you write.`
            : "Talk to your teacher. The class sees what your teacher writes; only your teacher sees what you write.");
        button.style.background = unread ? "#1a67a3" : "white";
        button.style.color = unread ? "#fff" : "";
      };

      const append = (list) => {
        if (!list || !list.length) return;
        let sawOther = false;
        const nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 60;
        for (const m of list) {
          if (m.id <= lastId) continue;
          lastId = Math.max(lastId, m.id);
          if (!m.mine) sawOther = true;
          if (m.screenshot) {
            appendShotBubble(m);
            continue;
          }
          if (m.kind === "file") {
            appendFileBubble(m);
            continue;
          }
          const el = document.createElement("div");
          // Inline styles for the same reason the hand button carries them:
          // course-ui.css is bundled into all six subjects' releases, so one
          // cosmetic rule there makes five other app tiers stale.
          el.style.cssText = "max-width:92%;padding:" + PAD + ";border-radius:" + RADIUS + "px;"
            + "font-size:" + FS + "px;line-height:1.45;"
            + (m.mine
              ? "align-self:flex-end;background:#d7ecff;border-bottom-right-radius:6px;"
              : "background:#f2f4f6;border-bottom-left-radius:6px;");
          // An announcement is the teacher's raised voice: full-width banner, so
          // "everyone stop and listen" cannot be mistaken for conversation.
          if (m.announcement) {
            el.style.cssText = "max-width:100%;padding:" + (YOUNG ? "12px 15px" : "10px 13px") + ";"
              + "border-radius:" + RADIUS + "px;font-size:" + FS + "px;line-height:1.45;"
              + "background:#052c65;color:#fff;font-weight:700;";
            el.innerHTML = '<span style="display:block;font-size:10px;letter-spacing:.06em;'
              + 'text-transform:uppercase;opacity:.85;margin-bottom:3px">\uD83D\uDCE2 Teacher Message!</span>'
              + escapeHtml(m.body);
            msgsEl.appendChild(el);
            continue;
          }
          if (m.mine && m.toteacheronly) el.style.cssText += "background:#fff3cd;border:2px solid #ffe69c;";
          // No "(teacher)" suffix — the server sends staff as "Teacher" outright,
          // so the suffix would double it. Students arrive as first names.
          const who = m.mine ? "" : `<b style="display:block;font-size:11px;opacity:.75">${escapeHtml(m.name)}</b>`;
          const note = m.mine && m.toteacheronly
            ? '<small style="display:block;font-size:10px;color:#664d03;margin-top:3px">Only your teacher can see this</small>' : "";
          // An answer-to-class arrives with the question and without the asker.
          // The asker's own panel says "You asked" -- they know; nobody else does.
          const quote = m.quote
            ? `<span style="display:block;font-size:11px;font-style:italic;opacity:.8;border-left:3px solid #9ec5fe;padding-left:6px;margin-bottom:4px">${m.quote.mine ? "You asked" : "Someone asked"}: ${escapeHtml(m.quote.body)}</span>` : "";
          el.innerHTML = who + quote + escapeHtml(m.body) + note;
          msgsEl.appendChild(el);
        }
        if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
        if (sawOther && !open) {
          unread = true;
          paintButton();
          chime();
          button.classList.add("cc-pulse");
          setTimeout(() => button.classList.remove("cc-pulse"), 4000);
        }
      };

      // THE STUDENT'S GO LIVE, beside Raise hand. The server sends the group's
      // class on today's calendar with every chat poll -- the same lookup the
      // teacher's Go live uses, so the two ends cannot disagree about which
      // session is due. The link lands on live_sessions.php, which owns the join
      // window, approval states and waiting room; this button only says THAT
      // there is a class and WHEN, never re-implements whether joining is
      // allowed. Removed again when the calendar empties, so it can never offer
      // a class that is over -- the Raise-hand rule, applied to a link.
      let liveBtn = null;
      const paintLive = (sess) => {
        const actions = $(".top-actions");
        if (!sess || !sess.id || !actions) {
          if (liveBtn) { liveBtn.remove(); liveBtn = null; }
          return;
        }
        if (!liveBtn) {
          liveBtn = document.createElement("a");
          liveBtn.id = "class-go-live";
          liveBtn.className = "top-grade-picker top-class-live";
          liveBtn.target = "_blank";
          liveBtn.rel = "noopener";
          liveBtn.style.cssText = "width:auto;padding:8px 12px;cursor:pointer;border-radius:999px;"
            + "text-decoration:none;display:inline-flex;align-items:center";
          liveBtn.href = platformUrl("/local/hubredirect/live_sessions.php");
          actions.prepend(liveBtn);
        }
        // joinable, not due: due is the TEACHER'S lead (be in the room first);
        // a child's red button must mean the door will actually open. The
        // mismatch shipped and was caught by the owner's first real class.
        if (sess.joinable) {
          liveBtn.textContent = "🔴 Join class";
          liveBtn.title = "Your class is ready. Press to join your teacher.";
          liveBtn.style.background = "#b02a37";
          liveBtn.style.color = "#fff";
          liveBtn.style.borderColor = "#b02a37";
        } else {
          const when = new Date(sess.start * 1000);
          const hh = ("0" + when.getHours()).slice(-2) + ":" + ("0" + when.getMinutes()).slice(-2);
          liveBtn.textContent = "🔴 Class at " + hh;
          liveBtn.title = "Your class starts at " + hh + ". The button turns red when you can join.";
          liveBtn.style.background = "white";
          liveBtn.style.color = "";
          liveBtn.style.borderColor = "";
        }
      };

      const poll = async (body) => {
        const state = await post(body ? { body, since: lastId } : { since: lastId });
        if (state && state.ok && state.enabled) {
          append(state.messages);
          paintLive(state.livesession);
          // A refused message is SAID, kindly: the filter keeps phone numbers,
          // emails and links out of a child's message to an adult, and a message
          // that silently never appears reads as a broken chat.
          if (body && state.refused === "contact-details") {
            shotFailNote("Messages cannot include phone numbers, email addresses or links — that keeps you safe. Say it another way.");
          } else if (body && state.refused) {
            shotFailNote("That message could not be sent here.");
          }
        }
        return state;
      };

      // A homework file in the tutoring thread: fetched lazily through the same
      // door, which re-runs the visibility check. Images show inline; a PDF,
      // Word or PowerPoint file opens as a download. "Expired" is a real state:
      // files age out after 30 days while the message row stays.
      const appendFileBubble = (m) => {
        const el = document.createElement("div");
        el.style.cssText = "max-width:92%;padding:" + PAD + ";border-radius:" + RADIUS + "px;"
          + "font-size:" + (FS - 1) + "px;"
          + (m.mine ? "align-self:flex-end;background:#d7ecff;" : "background:#f2f4f6;");
        const name = (m.file && m.file.name) || "file";
        el.innerHTML = (m.mine ? "" : `<b style="display:block;font-size:11px;opacity:.75">${escapeHtml(m.name)}</b>`)
          + `<span>📎 ${escapeHtml(name)}</span>`;
        msgsEl.appendChild(el);
        post({ file: m.id, thread: threadId }).then((f) => {
          if (!f || !f.ok) return;
          const span = el.querySelector("span");
          if (f.gone) { span.textContent = `📎 ${name} (expired)`; return; }
          if (/^image\//.test(f.mime || "")) {
            const pic = document.createElement("img");
            pic.src = `data:${f.mime};base64,${f.base64}`;
            pic.alt = name;
            pic.style.cssText = "display:block;max-width:100%;border-radius:8px;margin-top:4px";
            el.appendChild(pic);
            span.remove();
            return;
          }
          const link = document.createElement("a");
          link.href = `data:${f.mime};base64,${f.base64}`;
          link.download = f.name || name;
          link.textContent = `⬇ Open ${f.name || name}`;
          link.style.cssText = "display:inline-block;margin-top:4px;color:#0b5f59;font-weight:700";
          el.appendChild(link);
        });
      };

      // A homework file, prepared in the browser the way Wehel's attachments
      // are: a photo is downscaled and re-encoded as JPEG (a phone photo is
      // 3-8MB and the homework on it is readable at 1280px); a PDF, Word or
      // PowerPoint file travels as it is, size-capped. The server proves the
      // type by magic bytes whatever is claimed here.
      const FILE_ACCEPT = ".pdf,.docx,.pptx,image/png,image/jpeg";
      const prepareFile = async (file) => {
        const name = String(file.name || "homework");
        const isImage = /^image\//.test(String(file.type));
        if (!isImage) {
          if (!/\.(pdf|docx|pptx)$/i.test(name)) throw new Error("PDF, Word (.docx), PowerPoint (.pptx), PNG and JPEG files work here.");
          if (file.size > 3 * 1024 * 1024) throw new Error(`${name} is too big — files up to 3MB work here.`);
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
            reader.addEventListener("error", () => reject(reader.error));
            reader.readAsDataURL(file);
          });
          return { name, data };
        }
        const bitmap = await createImageBitmap(file).catch(() => null);
        if (!bitmap) throw new Error(`${name} could not be read — try a JPG or PNG photo.`);
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        if (bitmap.close) bitmap.close();
        const data = canvas.toDataURL("image/jpeg", 0.8).split(",")[1] || "";
        if (!data) throw new Error(`${name} could not be read.`);
        return { name: name.replace(/\.[^.]*$/, "") + ".jpg", data };
      };
      const sendFile = async (file, attachBtn) => {
        attachBtn.disabled = true;
        try {
          const prepared = await prepareFile(file);
          const state = await post({ attachment: prepared, since: lastId });
          if (state && state.ok && state.enabled) append(state.messages);
          if (!state || !state.ok || state.filerejected) {
            const why = state && state.filerejected === "too-big" ? "That file is too big — up to 3MB works here."
              : state && state.filerejected === "type" ? "PDF, Word, PowerPoint, PNG and JPEG files work here."
              : "The file did not send. Try again, or describe the problem in a message.";
            shotFailNote(why);
          }
        } catch (e) {
          shotFailNote(e && e.message ? e.message : "The file could not be read.");
        } finally {
          attachBtn.disabled = false;
        }
      };

      // A screenshot bubble: the image is fetched lazily per message through the
      // same door, which re-runs the visibility check -- so a bubble and its
      // pixels can never diverge in who may see them. "Expired" is a real state:
      // images age out after 30 days while the message row stays.
      const appendShotBubble = (m) => {
        const el = document.createElement("div");
        el.style.cssText = "max-width:92%;padding:" + PAD + ";border-radius:" + RADIUS + "px;"
          + "font-size:" + (FS - 1) + "px;"
          + (m.mine ? "align-self:flex-end;background:#fff3cd;border:2px solid #ffe69c;" : "background:#f2f4f6;");
        el.innerHTML = (m.mine ? "" : `<b style="display:block;font-size:11px;opacity:.75">${escapeHtml(m.name)}</b>`)
          + '<span>📷 Screenshot</span>'
          + (m.mine ? `<small style="display:block;font-size:10px;color:#664d03;margin-top:3px">${TUT ? "Only your tutors can see this" : "Only your teacher can see this"}</small>` : "");
        msgsEl.appendChild(el);
        // The tutoring door serves every stored file through one verb; the
        // classroom door keeps its image verb. Both re-run the visibility check.
        post(TUT ? { file: m.id, thread: threadId } : { image: m.id }).then((img) => {
          if (!img || !img.ok) return;
          if (img.gone) { el.querySelector("span").textContent = "📷 Screenshot (expired)"; return; }
          const pic = document.createElement("img");
          pic.src = img.base64 ? `data:${img.mime || "image/jpeg"};base64,${img.base64}` : "data:image/jpeg;base64," + img.jpegbase64;
          pic.alt = "Screenshot";
          pic.style.cssText = "display:block;max-width:100%;border-radius:8px;margin-top:4px";
          el.insertBefore(pic, el.querySelector("small"));
          el.querySelector("span").remove();
        });
      };

      // THE CAPTURE IS A RENDER OF THE LESSON PAGE'S OWN DOM -- deliberately not
      // the browser screen-capture API, whose picker lets a five-year-old share
      // the family's whole desktop. This can only contain what the app renders
      // and what the child typed into it; that boundary is the safeguarding
      // design, and the preview below is the child seeing exactly what the
      // teacher will see before anything is sent.
      //
      // html2canvas is vendored beside lucide and lazy-loaded by deriving its URL
      // from the lucide script tag already on every page -- correct in local dev
      // and under v{TAG}/ alike, and the 200KB only ever loads when a child
      // presses the camera.
      const loadCapturer = () => new Promise((resolve, reject) => {
        if (window.html2canvas) return resolve(window.html2canvas);
        const lucideTag = document.querySelector('script[src*="lucide.min.js"]');
        if (!lucideTag) return reject(new Error("no anchor"));
        const tag = document.createElement("script");
        tag.src = lucideTag.src.replace(/lucide\.min\.js.*$/, "html2canvas.min.js");
        tag.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error("no symbol")));
        tag.onerror = () => reject(new Error("load failed"));
        document.head.appendChild(tag);
      });

      const shotFailNote = (text) => {
        if (!msgsEl) return;
        const note = document.createElement("div");
        note.textContent = text;
        note.style.cssText = "align-self:flex-end;font-size:11px;color:#664d03;background:#fff3cd;"
          + "border:1px solid #ffe69c;border-radius:8px;padding:4px 8px";
        msgsEl.appendChild(note);
        msgsEl.scrollTop = msgsEl.scrollHeight;
      };

      const captureAndPreview = async (cameraBtn) => {
        cameraBtn.disabled = true;
        try {
          const h2c = await loadCapturer();
          const target = document.querySelector("#content") || document.body;
          const canvas = await h2c(target, { logging: false, useCORS: false, scale: 1 });
          // Downscale to <=1280 wide, JPEG at 0.7: the server caps at 500KB
          // decoded and a retina render of a full page is several megabytes.
          const w = Math.min(1280, canvas.width);
          const scaled = document.createElement("canvas");
          scaled.width = w;
          scaled.height = Math.round(canvas.height * (w / canvas.width));
          scaled.getContext("2d").drawImage(canvas, 0, 0, scaled.width, scaled.height);
          const dataUrl = scaled.toDataURL("image/jpeg", 0.7);

          const overlay = document.createElement("div");
          // Above the chat panel in BOTH states (55/76 — see the toggle above), so
          // "your teacher will see exactly this" is never covered by the panel it
          // was opened from. It used to win on DOM order alone at an equal 70,
          // which stopped being true once the panel could outrank it in theatre.
          const shotZ = document.body.classList.contains("deck-theatre") ? 78 : 70;
          overlay.style.cssText = `position:fixed;inset:0;z-index:${shotZ};background:rgba(10,30,45,.75);`
            + "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px";
          overlay.innerHTML = '<div style="color:#fff;font:700 14px system-ui,sans-serif">'
            + "Send this picture to your teacher? Your teacher will see exactly this.</div>"
            + '<img alt="Preview" style="max-width:min(720px,92vw);max-height:60vh;border-radius:10px;'
            + 'box-shadow:0 10px 40px rgba(0,0,0,.4)" src="' + dataUrl + '">'
            + '<div style="display:flex;gap:10px">'
            + '<button type="button" data-shot-send style="border:1px solid #1a67a3;background:#1a67a3;color:#fff;'
            + 'border-radius:10px;padding:10px 20px;font:700 14px system-ui,sans-serif;cursor:pointer">Send to teacher</button>'
            + '<button type="button" data-shot-cancel style="border:1px solid #fff;background:transparent;color:#fff;'
            + 'border-radius:10px;padding:10px 20px;font:700 14px system-ui,sans-serif;cursor:pointer">Cancel</button></div>';
          document.body.appendChild(overlay);
          overlay.querySelector("[data-shot-cancel]").addEventListener("click", () => overlay.remove());
          overlay.querySelector("[data-shot-send]").addEventListener("click", async () => {
            overlay.remove();
            const state = await post({ screenshot: dataUrl, since: lastId });
            if (state && state.ok && state.enabled) {
              append(state.messages);
            }
            // A refused shot must SAY so -- a picture that silently never
            // appears is the same wound as every silent failure fixed today.
            if (!state || !state.ok || state.shotrejected) {
              shotFailNote("The picture did not send. Try again, or describe the problem in a message.");
            }
          });
        } catch (e) {
          shotFailNote("The picture could not be taken. You can describe the problem in a message instead.");
        } finally {
          cameraBtn.disabled = false;
        }
      };

      // CHILD-FRIENDLY SIZING, keyed on html.young-stage exactly as the
      // Raise-hand button already is: Grades/Stages 1-4 get bigger type, fatter
      // tap targets and rounder everything, because the audience is five and the
      // failure mode of small controls is a child who gives up rather than one
      // who complains. Upper stages keep a calmer version of the same skin.
      // Inline styles throughout for the standing reason: one cosmetic rule in
      // the shared stylesheet makes five other subjects' app tiers stale.
      const YOUNG = document.documentElement.classList.contains("young-stage");
      const FS = YOUNG ? 16 : 14;      // message text
      const PAD = YOUNG ? "10px 14px" : "8px 11px";
      const RADIUS = YOUNG ? 18 : 12;  // bubble corners

      const buildPanel = () => {
        panel = document.createElement("div");
        panel.id = "class-chat-panel";
        panel.style.cssText = "position:fixed;right:12px;bottom:74px;z-index:55;"
          + "width:min(" + (YOUNG ? 360 : 330) + "px,94vw);"
          + "max-height:60vh;display:none;flex-direction:column;background:#fdfdfb;"
          + "border:2px solid #bcd9f0;border-radius:" + (RADIUS + 4) + "px;"
          + "box-shadow:0 10px 34px rgba(16,64,102,.22);overflow:hidden";
        // The header is the sky gradient the app's own banners use, and it says
        // the whole privacy rule in words a child reads: who can see what.
        panel.innerHTML = '<div style="padding:' + (YOUNG ? 13 : 10) + 'px 15px;'
          + 'background:linear-gradient(90deg,#cfe9ff,#e9f6ff);border-bottom:2px solid #bcd9f0">'
          + '<div style="font-weight:900;font-size:' + (FS + 1) + 'px;color:#0a2c47">\uD83D\uDCAC '
          + (TUT ? "Tutor chat \u00B7 " + escapeHtml(TUT.subjectlabel) : "Class chat") + '</div>'
          + '<div style="font-weight:600;font-size:' + (FS - 4) + 'px;color:#3d6a8c;margin-top:1px">'
          + (TUT
            ? "Your " + escapeHtml(TUT.subjectlabel) + " tutors see what you write. A reply can take a while \u2014 ask Wehel while you wait."
            : "Everyone sees your teacher. Only your teacher sees you.") + '</div></div>'
          + '<div id="class-chat-msgs" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;'
          + 'flex-direction:column;gap:9px;min-height:110px;background:#fdfdfb"></div>'
          + '<form id="class-chat-form" style="display:flex;gap:8px;padding:11px 13px;'
          + 'border-top:2px solid #e3eef7;background:#f4f9fd">'
          + '<button type="button" id="class-chat-shot" title="Send a picture of this page to your ' + (TUT ? "tutors" : "teacher") + '" '
          + 'style="border:2px solid #bcd9f0;background:#fff;border-radius:999px;'
          + 'padding:' + (YOUNG ? "9px 13px" : "7px 11px") + ';font-size:' + (FS + 2) + 'px;cursor:pointer;line-height:1">\uD83D\uDCF7</button>'
          + (TUT
            ? '<button type="button" id="class-chat-attach" title="Attach your homework: a photo, PDF, Word or PowerPoint file" '
              + 'style="border:2px solid #bcd9f0;background:#fff;border-radius:999px;'
              + 'padding:' + (YOUNG ? "9px 13px" : "7px 11px") + ';font-size:' + (FS + 2) + 'px;cursor:pointer;line-height:1">\uD83D\uDCCE</button>'
              + '<input id="class-chat-file" type="file" accept="' + FILE_ACCEPT + '" hidden>'
            : "")
          + '<input id="class-chat-input" type="text" maxlength="1200" autocomplete="off" placeholder="' + (TUT ? "Ask your tutors…" : "Ask your teacher…") + '" '
          + 'style="flex:1;border:2px solid #bcd9f0;border-radius:999px;padding:' + (YOUNG ? "9px 15px" : "7px 13px") + ';'
          + 'font:inherit;font-size:' + FS + 'px;min-width:0;background:#fff">'
          + '<button type="submit" style="border:none;background:#1a67a3;color:#fff;border-radius:999px;'
          + 'padding:' + (YOUNG ? "9px 18px" : "7px 15px") + ';font:inherit;font-size:' + FS + 'px;font-weight:800;cursor:pointer">Send</button></form>';
        document.body.appendChild(panel);
        msgsEl = panel.querySelector("#class-chat-msgs");
        const shotBtn = panel.querySelector("#class-chat-shot");
        shotBtn.addEventListener("click", () => captureAndPreview(shotBtn));
        const attachBtn = panel.querySelector("#class-chat-attach");
        const fileInput = panel.querySelector("#class-chat-file");
        if (attachBtn && fileInput) {
          attachBtn.addEventListener("click", () => fileInput.click());
          fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            fileInput.value = "";
            if (file) sendFile(file, attachBtn);
          });
        }
        panel.querySelector("#class-chat-form").addEventListener("submit", (event) => {
          event.preventDefault();
          const inputEl = panel.querySelector("#class-chat-input");
          const text = (inputEl.value || "").trim();
          if (!text) return;
          inputEl.value = "";
          poll(text);
        });
      };

      post({}).then((state) => {
        if (!state || !state.ok || state.enabled === false) return;
        TUT = state.tutoring ? state : null;
        threadId = Number(state.threadid) || 0;
        button = document.createElement("button");
        button.type = "button";
        button.id = "class-chat-toggle";
        button.className = "top-grade-picker top-class-chat";
        // young-stage sizing comes from the class; the radius makes it read as a
        // friendly pill next to Raise hand rather than another form control.
        button.style.cssText = "width:auto;padding:8px 12px;cursor:pointer;border-radius:999px";
        paintButton();
        buildPanel();
        append(state.messages);
        // Anything already in the room counts as read history, not news.
        unread = false;
        paintButton();
        button.addEventListener("click", () => {
          open = !open;
          panel.style.display = open ? "flex" : "none";
          // The deck's theatre mode is a position:fixed overlay at z-index 70, so
          // the panel's usual 55 would put it BEHIND the slides — invisible at the
          // one moment the button was moved into the deck header for. Read at open
          // time rather than set once, because theatre is toggled after this panel
          // is built. The screenshot preview overlay is lifted with it (it is 70,
          // and must stay above the panel, not behind it).
          panel.style.zIndex = document.body.classList.contains("deck-theatre") ? "76" : "55";
          if (open) {
            unread = false;
            chimed = false;
            button.classList.remove("cc-pulse");
            paintButton();
            poll();
            msgsEl.scrollTop = msgsEl.scrollHeight;
            panel.querySelector("#class-chat-input")?.focus();
          }
        });
        actions.prepend(button);
        placeLearnerControls();
        paintLive(state.livesession);
        // Polled CLOSED as well as open, so a teacher's "everyone stop and
        // listen" reaches a child who never opened the panel — the unread dot is
        // the whole point of the broadcast half. ONE fixed cadence: a ternary on
        // `open` here would be evaluated once, at mount, when open is always
        // false — a dynamic cadence that does not exist. Opening the panel polls
        // immediately instead (the click handler above), which is the moment a
        // faster poll was for.
        setInterval(() => { if (!document.hidden) poll(); }, 15000);
      });
    }
    mountClassChat();
  return { placeLearnerControls, mountHandRaise, mountClassChat };
}

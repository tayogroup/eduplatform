# -*- coding: utf-8 -*-
"""Caption the Explain narration, one sentence at a time, in every subject.

    python tools/add-narration-captions.py <file> [<file> ...]        # report
    python tools/add-narration-captions.py --all                      # every page and generator
    python tools/add-narration-captions.py --all --write

WHAT IT IS FOR. The Explain mini-lesson is the only content in these builds that
exists as AUDIO ALONE - every question, option, score and feedback line is
already on the screen. A deaf or hard-of-hearing child gets nothing from it, and
a child who reads gets no way to follow along. There are 4,495 of them across the
lesson builds. This puts the words on screen as they are spoken, one sentence at
a time, in a band under the instruction row.

THE ONE REAL PROBLEM, and the reason this is not a CSS change. The engine has
two playback paths and they differ exactly where the captions live:

  next()   the browser voice, speaks SEGMENT BY SEGMENT already - `seg.text` is
           right there, so a caption is one line and is exactly synced.
  pump()   the platform voice, does `spoken(segs)` - it CONCATENATES the whole
           explain into one string and plays it as ONE clip. One callback at the
           end, nothing in between, so nothing can say which sentence is playing.

So a captioned line plays sentence by sentence instead, which is the only option
that is exactly right rather than estimated. Estimating each sentence's duration
from its length and advancing on a timer was rejected: drift across a 30-60
second explain is visible, and a caption showing the wrong sentence is worse than
no caption at all.

Three consequences, accepted deliberately:
  - a small gap between sentences, where one clip ran them together;
  - one request per sentence rather than one per explain. The CHARACTERS are the
    same and quiz_tts.php bills per character, so the bill should not move;
  - the clip cache is keyed by exact text, so per-sentence keys REUSE better.

SENTENCES, NOT SEGMENTS (owner, 2026-09-16). The authored SSML groups several
sentences into one <s> block in places, and the first prototype captioned the
whole block - three sentences landing on a child at once. sentenceSegs() splits
them, and it drives the CLIP as well as the caption, because the two have to be
the same unit or they cannot stay in step.

  It splits on . ! ? and the ellipsis ONLY when whitespace or the end follows,
  so "1.5" and "0.25" are left alone - Stage 4 maths and Science measurements are
  full of them. It is written as a character walk rather than a regex with a
  lookbehind on purpose: a lookbehind is a PARSE error on older Safari, and a
  parse error here would take the whole lesson down, not just the captions.

WHAT IT DOES NOT TOUCH. Nothing else that speaks is captioned: feedback, scores
and instructions are already on the screen in full, and captioning them would put
the same words on the page twice. Uncaptioned speech still goes out as one clip,
exactly as before.

ACCESSIBILITY, deliberately: the band is NOT an aria-live region. It changes
every few seconds and a screen reader is already reading the step; announcing
each sentence on top of that would talk over the thing the child asked for. The
text is present and readable; it is not announced.

IT REFUSES A FILE ANOTHER SESSION IS EDITING. Several builds are worked on at
once here and the tree routinely holds half-finished work; a patcher that writes
into it is how a peer's changes get carried off in someone else's commit. A file
with uncommitted changes is skipped and named, unless --allow-dirty says the
work is yours.

Guarded by a marker; every anchor must match exactly once or the file is refused.
The anchors are byte-identical across all 241 pages and all 7 generator sources.
"""
import io, os, re, sys, subprocess

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACADEMY = os.path.join(HERE, "src", "prototypes", "ehel-academy")
argv = sys.argv[1:]
WRITE = "--write" in argv
ALL = "--all" in argv
DIRTY_OK = "--allow-dirty" in argv
TARGETS = [a for a in argv if not a.startswith("--")]
MARK = "ehel-narration-caption"

CSS = """
<style>/* """ + MARK + """ - the spoken explain, on screen one sentence at a time */
  .narr { display: none; margin: 10px 0 14px; padding: 12px 16px; border: 1px solid var(--line);
    border-left: 4px solid var(--teal); border-radius: 12px; background: var(--card);
    color: var(--ink); font-size: clamp(16px, 2.2vw, 19px); line-height: 1.45;
    min-height: 3.1em; box-sizing: border-box; }
  .narr.on { display: block; }
  .narr .narr-k { display: block; font-size: 11px; letter-spacing: .09em; text-transform: uppercase;
    color: var(--muted); font-weight: 700; margin: 0 0 4px; }
  @media (prefers-reduced-motion: no-preference) { .narr.on { animation: narrIn .18s ease-out; } }
  @keyframes narrIn { from { opacity: .4 } to { opacity: 1 } }
</style>
"""

CAPTION_JS = r'''
    /* ==== ehel-narration-caption - see tools/add-narration-captions.py ====
       The band under the instruction row, and the only speech that writes to it. */
    let capEl = null;
    function capFor(host) {
      if (!host) return null;
      let el = host.querySelector(":scope > .narr");
      if (!el) {
        el = document.createElement("div");
        el.className = "narr";
        el.innerHTML = '<span class="narr-k">What I am saying</span><span class="narr-t"></span>';
        const bar = host.querySelector(":scope > .say");
        if (bar && bar.parentNode) bar.parentNode.insertBefore(el, bar.nextSibling);
        else host.insertBefore(el, host.firstChild);
      }
      return el;
    }
    function caption(text) {
      if (!capEl) return;
      const t = String(text == null ? "" : text).replace(PICTOGRAPH, " ").replace(/[ ]+/g, " ").trim();
      if (!t) return;
      capEl.querySelector(".narr-t").textContent = t;
      capEl.classList.add("on");
    }
    /* Hidden when speech is CUT OFF - a caption left behind by a stopped voice
       describes something the child is no longer hearing. A line that ends on its
       own keeps its last sentence on screen, to be read at leisure. */
    function capClear() {
      if (!capEl) return;
      capEl.classList.remove("on");
      capEl.querySelector(".narr-t").textContent = "";
      capEl = null;
    }
    /* ONE CAPTION PER SENTENCE. The authored SSML puts several sentences in one
       block in places, and a block of three landing at once is a wall of text to
       a six-year-old. This drives the CLIP too: caption and audio must be the
       same unit or they cannot stay in step.

       A full stop only ends a sentence when whitespace or the end follows, so
       "1.5" survives. Written as a walk rather than a regex lookbehind because a
       lookbehind is a PARSE error on older Safari, and that would take the whole
       lesson down rather than just the captions. */
    function sentenceSegs(segs) {
      const CLOSERS = "\"'”’)]";
      const out = [];
      for (const s of segs) {
        const t = s.text == null ? "" : String(s.text);
        if (!t) { out.push(s); continue; }
        const parts = [];
        let start = 0;
        for (let i = 0; i < t.length; i++) {
          const c = t.charAt(i);
          if (c !== "." && c !== "!" && c !== "?" && c !== "…") continue;
          let j = i + 1;
          while (j < t.length && CLOSERS.indexOf(t.charAt(j)) >= 0) j++;
          if (j < t.length && !/\s/.test(t.charAt(j))) continue;   /* 1.5, not a stop */
          const piece = t.slice(start, j).trim();
          if (piece) parts.push(piece);
          start = j;
          i = j - 1;
        }
        const tail = t.slice(start).trim();
        if (tail) parts.push(tail);
        if (parts.length < 2) { out.push(s); continue; }
        for (const p of parts) out.push(Object.assign({}, s, { text: p }));
      }
      return out;
    }
'''

SPEAK_OLD = """    function speak(x) {
      if (!SUPPORTED && !PLATFORM_VOICE.ready()) return;
      const ssml = wrap(x);
      if (!ssml) return;
      stop();
      const segs = flatten(ssml);"""
SPEAK_NEW = """    function speak(x, cap) {
      if (!SUPPORTED && !PLATFORM_VOICE.ready()) return;
      const ssml = wrap(x);
      if (!ssml) return;
      stop();
      /* ehel-narration-caption: AFTER stop(), which clears the last caption -
         setting it before would hand pump() a target stop() had just nulled */
      if (cap) capEl = cap;
      const segs = cap ? sentenceSegs(flatten(ssml)) : flatten(ssml);"""

PUMP_OLD = """      const line = spoken(segs);
      if (!line) { finished(); return; }
      PLATFORM_VOICE.play(line).then(finished, function (e) {
        if (mine !== turn || PLATFORM_VOICE.stopped(e)) return;
        inBrowser();
      });"""
PUMP_NEW = """      /* ehel-narration-caption: a captioned line plays one sentence at a time,
         because spoken(segs) below concatenates the whole explain into a single
         clip and a single clip cannot say which sentence is playing. Uncaptioned
         speech is untouched and still goes out as one clip. */
      if (capEl) {
        let k = 0;
        const stepOn = function () {
          if (mine !== turn) return;
          if (k >= segs.length) { finished(); return; }
          const seg = segs[k++];
          if (seg.pause != null) { timer = setTimeout(stepOn, Math.min(seg.pause, 400)); return; }
          const one = spoken([seg]);
          if (!one) { stepOn(); return; }
          caption(seg.text);
          PLATFORM_VOICE.play(one).then(stepOn, function (e) {
            if (mine !== turn || PLATFORM_VOICE.stopped(e)) return;
            /* the endpoint gave up part way: read the REST in the browser voice
               rather than dropping the child mid-explanation */
            queue = segs.slice(k - 1); at = 0; lineDone = finished; next(mine);
          });
        };
        stepOn();
        return;
      }
      const line = spoken(segs);
      if (!line) { finished(); return; }
      PLATFORM_VOICE.play(line).then(finished, function (e) {
        if (mine !== turn || PLATFORM_VOICE.stopped(e)) return;
        inBrowser();
      });"""

NEXT_OLD = """      const words = seg.text.replace(PICTOGRAPH, " ").replace(/[ ]+/g, " ").trim();
      if (!words) { next(mine); return; }"""
NEXT_NEW = """      const words = seg.text.replace(PICTOGRAPH, " ").replace(/[ ]+/g, " ").trim();
      if (!words) { next(mine); return; }
      caption(seg.text);                      /* ehel-narration-caption */"""

STOP_OLD = """      try { window.speechSynthesis.cancel(); } catch (e) {}
      PLATFORM_VOICE.stop();
      mark(false);"""
STOP_NEW = """      try { window.speechSynthesis.cancel(); } catch (e) {}
      PLATFORM_VOICE.stop();
      capClear();                             /* ehel-narration-caption */
      mark(false);"""

API_OLD = """    return {
      speak: speak, follow: follow, stop: stop, hush: hush,"""
API_NEW = """    /* ehel-narration-caption: the ONLY captioned entry point. Everything else
       that speaks is already written on the screen. */
    function explain(x, host) {
      const el = capFor(host);
      speak(x, el);
      /* the band opens on the PRESS, not on the first clip - so the page shifts
         while the child's finger is still on the button, never mid-activity */
      const segs = sentenceSegs(flatten(wrap(x) || ""));
      for (const s of segs) { if (s.text) { caption(s.text); break; } }
    }
    return {
      speak: speak, explain: explain, follow: follow, stop: stop, hush: hush,"""

BTN_OLD = """      b.addEventListener("click", () => {
        const ssml = explainerFor(host);
        if (ssml) VOICE.speak(ssml);
      });"""
BTN_NEW = """      b.addEventListener("click", () => {
        const ssml = explainerFor(host);
        if (ssml) VOICE.explain(ssml, host);   /* ehel-narration-caption */
      });"""

EDITS = [("speak(): take a caption target, split into sentences", SPEAK_OLD, SPEAK_NEW),
         ("pump(): a captioned line plays sentence by sentence", PUMP_OLD, PUMP_NEW),
         ("next(): the browser path captions each segment", NEXT_OLD, NEXT_NEW),
         ("stop(): hide a caption whose voice was cut off", STOP_OLD, STOP_NEW),
         ("VOICE.explain(): the only captioned entry point", API_OLD, API_NEW),
         ("the Explain button asks for a captioned line", BTN_OLD, BTN_NEW)]


def dirty(path):
    try:
        rel = os.path.relpath(path, HERE).replace("\\", "/")
        r = subprocess.run(["git", "diff", "--quiet", "--", rel], cwd=HERE)
        return r.returncode != 0
    except Exception:
        return False


def patch(path):
    s = io.open(path, encoding="utf-8", newline="").read()
    if MARK in s:
        return "already", None
    if "function pump() {" not in s:
        return "skip", "no voice engine"
    if dirty(path) and not DIRTY_OK:
        return "dirty", "another session has uncommitted changes here"
    bad = []
    for label, old, new in EDITS:
        if s.count(old) != 1:
            bad.append("%s: anchor matched %d times" % (label, s.count(old)))
    if "PICTOGRAPH" not in s:
        bad.append("no PICTOGRAPH to clean caption text with")
    if bad:
        return "refused", "; ".join(bad)

    s = s.replace("    function pump() {", CAPTION_JS.strip("\n") + "\n\n    function pump() {", 1)
    for label, old, new in EDITS:
        s = s.replace(old, new, 1)
    if path.endswith(".html"):
        s = s.rstrip() + "\n" + CSS
    assert s.count(MARK) >= 7
    if WRITE:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    return "ok", None


def every():
    out = []
    for root, dirs, files in os.walk(ACADEMY):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules", "media")]
        for f in files:
            if f.endswith((".html", ".js")):
                p = os.path.join(root, f)
                try:
                    if "function pump() {" in io.open(p, encoding="utf-8", errors="ignore").read():
                        out.append(p)
                except Exception:
                    pass
    return sorted(out)


files = every() if ALL else [os.path.abspath(t) for t in TARGETS]
if not files:
    sys.exit("nothing to do: pass file paths or --all")

tally = {}
notes = []
for p in files:
    state, why = patch(p)
    tally[state] = tally.get(state, 0) + 1
    if state in ("refused", "dirty"):
        notes.append("  %-8s %s\n           %s" % (state.upper(), os.path.relpath(p, HERE), why))

print("\n  %s %d file(s) carrying the voice engine\n" % ("WROTE" if WRITE else "would patch", len(files)))
for k in ("ok", "already", "dirty", "refused", "skip"):
    if tally.get(k):
        print("    %-9s %d" % (k, tally[k]))
if notes:
    print("\n  left alone:\n" + "\n".join(notes))
if not WRITE:
    print("\n  dry run -- pass --write")
sys.exit(1 if tally.get("refused") else 0)

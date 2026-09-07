# -*- coding: utf-8 -*-
"""
Insert the Convincing step ("How do you know?") into a lesson.

It goes BETWEEN the check and the sticker shelf, which is the one place a slide
can be added without moving any existing index: every finish(i) call in the
lesson refers to a slide before it, and the sticker shelf carries no index of
its own. The new step works out its own index from the DOM rather than being
told one, so nothing has to be counted by hand.
"""
import io, json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from banks import EXPLAIN, G3, G1

SLIDE = '''    <!-- how do you know -->
    <section class="slide" data-explain='%s' data-say="Only one of these three reasons really explains it. Which one?">
      <div class="slide-head"><span class="n">?</span><h2>How do you know?</h2></div>
      <div class="say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button><span id="sayW">Which reason really explains it?</span></div>
      <div class="stage">
        <p class="fb" id="clW" style="font-size:21px"></p>
        <div class="choices" id="chW"></div>
        <p class="fb" id="fbW"></p>
        <p class="score" id="scW"></p>
      </div>
    </section>

''' % EXPLAIN

JS = '''
  /* ==================================================================
     CONVINCING - "presenting evidence to justify or challenge a
     mathematical idea or solution" (Cambridge TWM.04).

     A tap-to-answer deck cannot ask a child to WRITE a justification, so
     this asks them to recognise one: a claim that is true, and three
     reasons for it of which only one does any work. It is an
     approximation of the characteristic and is recorded as one.

     Every wrong reason is either the misconception the lesson already
     teaches against, or something perfectly TRUE that explains nothing -
     and the second kind is the whole point of the step.

     It works out its own slide index from the DOM, so inserting it moved
     no other step and nothing had to be renumbered.
     ================================================================== */
  (function () {
    const BANK = %s;
    const host = document.getElementById("clW");
    if (!host) return;
    /* announce the result. Grade 3's shell marks every .fb and .score as a live
       region; Grade 1's does not, so the step does it for itself rather than
       depending on which shell it has been dropped into. */
    ["fbW", "scW", "clW"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    let got = 0, asked = 0, order = shuffle(BANK), qi = 0, live = false;
    function paint() {
      if (qi >= order.length) { order = shuffle(BANK); qi = 0; }
      const it = order[qi];
      document.getElementById("clW").textContent = it[0];
      document.getElementById("sayW").textContent = it[0] + " Which reason really explains it?";
      document.getElementById("chW").innerHTML = shuffle([it[1]].concat(it[2]))
        .map((o) => '<button type="button" class="choice word" data-v="' + esc(o) + '">' + esc(o) + "</button>").join("");
      document.getElementById("fbW").className = "fb";
      document.getElementById("fbW").textContent = "";
      live = true;
    }
    document.getElementById("chW").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = order[qi];
      const ok = b.dataset.v === it[1];
      [...document.getElementById("chW").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.v === it[1]) x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      asked++; if (ok) got++;
      const fb = document.getElementById("fbW");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not that one. ") + it[3];
      say(ok ? cheer() : it[3]);
      document.getElementById("scW").textContent = got + " right out of " + asked + (got >= 4 ? " - sticker earned!" : "");
      if (got >= 4) finish(SLOT, "");
      qi++;
      setTimeout(paint, 3400);
    });
    paint();
  })();
'''

STICKER = '["\\ud83e\\udd14", "How do you know"]'


def insert_slide(s):
    """put the new slide immediately before the last .slide (the sticker shelf)"""
    i = s.rfind('<section class="slide"')
    assert i > 0, "no slides found"
    # back up to the start of that line so indentation survives
    j = s.rfind("\n", 0, i) + 1
    return s[:j] + SLIDE + s[j:]


def append_sticker(s):
    """append one entry to const STICKERS = [ ... ]; whatever its formatting"""
    i = s.find("const STICKERS = [")
    assert i > 0, "no STICKERS array"
    k = i + len("const STICKERS = [")
    depth = 1
    while depth:
        c = s[k]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        k += 1
    j = k
    while s[j - 1] in " \t\r\n":
        j -= 1
    # an array that already ends with a trailing comma must not get a second
    # one: "],," is an elision, which leaves a HOLE and pushes this entry one
    # index past the slide it belongs to, so its sticker never lights
    sep = "" if s[j - 1] in "[," else ","
    # insert straight after the last entry and leave the array's own trailing
    # whitespace exactly as it was, so the diff is one line and nothing else
    return s[:j] + sep + "\n    " + STICKER + s[j:]


def js_for(bank):
    rows = [[c, a, w, n] for (c, a, w, n) in bank]
    return JS % json.dumps(rows, ensure_ascii=False, indent=6)


def count_stickers(s):
    i = s.find("const STICKERS = [")
    k = i + len("const STICKERS = [")
    depth = 1
    while depth:
        c = s[k]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        k += 1
    return s[i:k].count('["')


def unhardcode_total(s, n):
    """Some lessons write the sticker total as a literal, so adding one leaves
       the shelf saying "of 15" when there are 16. Point them at the array."""
    i = s.find("function paintStickers")
    if i < 0:
        return s
    j = s.find("$(\"restart\")", i)
    if j < 0:
        j = i + 900
    body = s[i:j]
    was = body
    body = re.sub(r"done\.slice\(0, %d\)" % n, "done.slice(0, STICKERS.length)", body)
    body = re.sub(r"got === %d\b" % n, "got === STICKERS.length", body)
    body = re.sub(r'"All %d stickers' % n, '"All " + STICKERS.length + " stickers', body)
    body = re.sub(r'" of %d stickers' % n, '" of " + STICKERS.length + " stickers', body)
    if body != was:
        print("      (sticker total was hard-coded as %d; now reads STICKERS.length)" % n)
    return s[:i] + body + s[j:]


def patch_built(path, bank):
    """a Grade 1 lesson: one built HTML file"""
    s = io.open(path, encoding="utf-8").read()
    n = count_stickers(s)
    s = insert_slide(s)
    s = append_sticker(s)
    s = unhardcode_total(s, n)
    i = s.rfind("})();")
    assert i > 0, "no closing IIFE"
    s = s[:i] + js_for(bank) + "\n" + s[i:]
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print("  patched", os.path.basename(path))


def patch_fragments(slug, bank):
    """a Grade 3 lesson: slides fragment + content fragment"""
    sp = "%s-slides.html" % slug
    s = io.open(sp, encoding="utf-8").read()
    s = insert_slide(s)
    io.open(sp, "w", encoding="utf-8", newline="").write(s)

    cp = "%s-content.js" % slug
    c = io.open(cp, encoding="utf-8").read()
    c = append_sticker(c)
    anchor = "  show(0, false);"
    assert c.count(anchor) == 1, "no show() anchor in " + cp
    c = c.replace(anchor, js_for(bank) + "\n" + anchor)
    io.open(cp, "w", encoding="utf-8", newline="").write(c)
    print("  patched", slug)


if __name__ == "__main__":
    which = sys.argv[1]
    if which == "g3":
        # 2026-09-07: five lessons became eight (src/split-lessons.py)
        order = ["up-to-a-thousand", "adding-and-money", "rows-and-rules", "equal-parts",
                 "shapes-and-symmetry", "measure-it", "time-and-direction", "ask-count-chart"]
        frag = dict(zip(order, ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"]))
        for name in order:
            patch_fragments(frag[name], G3[name])
    else:
        for name, bank in G1.items():
            patch_built(os.path.join(sys.argv[2], name + ".html"), bank)

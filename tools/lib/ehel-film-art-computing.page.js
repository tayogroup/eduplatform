
    /* ==== the film's side ======================================================
       tools/lib/ehel-film-art-computing.page.js, run inside ART's scope after
       the slices of computing.js, so SCENES, DRAWINGS, FIGURES, BLOCKS,
       spriteStage, pigpenSvg, esc and the rule functions above are the lesson's
       own. Every function returns markup or a number and changes nothing the
       film can see, so a frame stays a pure function of time.

       THE PICTURES
         ART.scene(name, ids)        one of the everyday tasks the algorithms are
                                     about, PAINTED FROM AN ORDERED LIST OF STEP
                                     IDS - see "the order is the teaching" below.
                                     dress, sandwich, teeth, handwash, tower,
                                     plant, catfeed (Stage 1); tea, bed (2);
                                     smoothie, kite, cake, present (3); and
                                     internet, which takes a number 0-3 instead
         ART.drawing(name, ids)      what Robo draws from the instructions it was
                                     given: house, boat. A precise id draws the
                                     part where it belongs; "roof-corner" or
                                     "huge-square" draws exactly what was said
         ART.figure(name)            hardware with a tap part on every piece:
                                     laptop, tablet (2CS.01)
         ART.pigpen(letter)          the Pigpen glyph for a letter, or for an
                                     index 0-25 (4DC.06)
         ART.leds(name)              Bitsy's 5 x 5 light pattern as five strings
                                     of "0" and "1": heart, smile, light, dark
         ART.names()                 what each of the four holds, by name

       PLACING AND MARKING THEM
         ART.place(svg, x, y, w, h)  nest one of the lesson's <svg> drawings in a
                                     box of the film's 1168 x 440 space
         ART.ring(svg, part, col, w) draw a figure part's own tap outline
         ART.dim(svg, part, opacity) fade one part of a figure
         ART.parts(svg)              the part names a figure has
         ART.foreign(html, x,y,w,h)  the LAST RESORT for a piece of the lesson
                                     that is HTML rather than svg (ART.stage).
                                     computing.css is not in the film, so it
                                     draws unstyled unless the film's own styles
                                     carry the classes. Prefer drawing it.

       THE RULES - what the lesson's machines actually do. These are the
       functions computing.js marks "mirrored in _rules.py", so a film that
       narrates an algorithm and the lesson that runs it cannot disagree.
         ART.block(id) / ART.blockIds()        a block's label, icon and category
         ART.program.expand(ids)               a script as the moves actually made
                                               (a repeat block unrolled)
         ART.program.words(ids)                "move right, then jump"
         ART.program.runWords(ids)             "jump 3 times, then say hello"
         ART.program.usesRepeat(ids)           is a repeat block in it
         ART.program.same(a, b)                do two scripts do the same thing
         ART.stage(sprites, opts)              the lesson's sprite stage, as HTML
         ART.run(sprites, ids, opts)           run a script on it and hand back
                                               the lesson's OWN end state:
                                               [{x, scale, spin, hidden}, ...]
         ART.robo                              Robo's rules: DIRS, TURN_L, TURN_R,
                                               ANGLE and CMD (the grid DRAWING
                                               cannot be lifted - see the module)
         ART.rule(rule, x)                     a machine's output: "double",
                                               "half", "add:3", "letters" ...
         ART.walkEnd(program)                  where a walk of right/left ends
         ART.code(word) / ART.decode(nums)     1 = a (3DC.05)
         ART.caesar(text, shift)               a Caesar shift (4DC.06)
         ART.rowMatches(row, spec)             does a row pass a filter
         ART.sortRows(rows, field, dir)        a table sorted the lesson's way
         ART.algo.expandLoop(b, body, n, a)    a looped program, unrolled
         ART.algo.flatten(blocks)              repeat and forever boxes, flattened,
                                               each item remembering its box and turn
         ART.algo.subExpand(main, subs)        a sub-routine call, opened out
         ART.algo.branchRun(round, inputId)    which way an if-branch goes
         ART.algo.best(algos, check)           which algorithm wins, and null if
                                               two tie
         ART.device.block(id) / .blockIds()    Bitsy's blocks
         ART.device.inputs                     its five inputs
         ART.device.plan(script)               what a device script does, with the
                                               repeats unrolled and where a
                                               forever loop goes back to
         ART.kit                               the sliced objects themselves, for
                                               anything not wrapped here
         ART.selftest                          what the load-time check exercised

       THE ORDER IS THE TEACHING, and it is why ART.scene takes a LIST.
       Half of Stage 1 is that a computer does what it is told in the order it
       is told. Every scene paints later ids over earlier ones, so a film shows
       a wrong order by passing a wrong list and nothing else:

           ART.scene("dress", ["socks", "shoes"])   socks, then shoes on top
           ART.scene("dress", ["shoes", "socks"])   socks OVER the shoes, and the
                                                    scene says so itself

       The scene draws its own consequence and labels it - "socks on the OUTSIDE
       of the shoes!", "the filling is on TOP of the sandwich!", "no lid on:
       smoothie everywhere!", "no string yet: the wind took the kite!" - so a
       film that wants the wrong order draws nothing extra. To build a scene up
       step by step over a beat, pass a growing prefix of the same list:
       ids.slice(0, n), which is exactly what the lesson's own paintScene does.
    */
    var num = function (v) { return String(Math.round(v * 100) / 100); };

    /* ---- the pictures ---------------------------------------------------- */
    function scene(name, ids) {
      if (typeof SCENES[name] !== "function")
        throw new Error("ART.scene: the lesson kit draws no scene " + JSON.stringify(name) + " (it has " + Object.keys(SCENES).join(", ") + ")");
      return SCENES[name](ids);
    }
    function drawing(name, ids) {
      if (typeof DRAWINGS[name] !== "function")
        throw new Error("ART.drawing: Robo draws no " + JSON.stringify(name) + " (it draws " + Object.keys(DRAWINGS).join(", ") + ")");
      return DRAWINGS[name](ids || []);
    }
    function figure(name) {
      if (typeof FIGURES[name] !== "function")
        throw new Error("ART.figure: the lesson kit draws no figure " + JSON.stringify(name) + " (it has " + Object.keys(FIGURES).join(", ") + ")");
      return FIGURES[name]();
    }
    /* a letter, or an index 0-25; the lesson's own pigpenIndex decides */
    function pigpen(letter) {
      var i = typeof letter === "number" ? letter : pigpenIndex(String(letter).toLowerCase().charAt(0));
      if (i == null || !(i >= 0 && i <= 25)) throw new Error("ART.pigpen: " + JSON.stringify(letter) + " is not a letter a-z");
      return pigpenSvg(i);
    }
    function leds(name) {
      if (!LED[name]) throw new Error("ART.leds: Bitsy has no pattern " + JSON.stringify(name) + " (it has " + Object.keys(LED).join(", ") + ")");
      return LED[name].slice();
    }
    function names() {
      return { scenes: Object.keys(SCENES), drawings: Object.keys(DRAWINGS), figures: Object.keys(FIGURES), leds: Object.keys(LED) };
    }

    /* ---- placing and marking --------------------------------------------- */
    /* one of the lesson's <svg> drawings, nested in a box of the scene's space;
       its own viewBox scales it to fit. A drawing that carries its own width
       and height (pigpenSvg does) has them taken off the root tag first, so the
       box given here is the one that wins rather than the one that happens to
       be parsed first. */
    var BOX_ATTR = { width: 1, height: 1, x: 1, y: 1 };
    function place(markup, x, y, w, h, extra) {
      var s = String(markup);
      if (s.slice(0, 5) !== "<svg ") throw new Error("ART.place nests one of the lesson's <svg> drawings, and this is not one: " + s.slice(0, 48));
      var close = s.indexOf(">");
      if (close < 0) throw new Error("ART.place: this drawing's root tag never closes");
      /* the root tag's attributes, one at a time, so that a value which happens
         to read like an attribute (an aria-label is a sentence) is never cut */
      var head = "", re = /\s([\w:.-]+)="([^"]*)"/g, m;
      while ((m = re.exec(s.slice(4, close)))) if (!BOX_ATTR[m[1]]) head += " " + m[1] + '="' + m[2] + '"';
      return '<svg x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' +
        (extra ? " " + extra : "") + head + s.slice(close);
    }
    /* A piece of the lesson that is HTML, carried into the film's svg. The
       lesson's stylesheet is NOT in the film, so this draws unstyled unless the
       film's own styles carry the classes; it is here so that ART.stage is
       reachable at all, not because a film should reach for it. */
    function foreign(html, x, y, w, h) {
      return '<foreignObject x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%">' + String(html) + "</div></foreignObject>";
    }

    /* A part is the <g> whose opening tag carries data-part="name". It is found
       by that attribute wherever it sits in the tag, so ring and dim can be
       applied in either order, and more than once. (The Science adapter learned
       this the hard way on 2026-09-19: dim wrote its opacity in front of
       data-part, the next lookup missed the part, and the throw landed on a
       frame --sample never lands on.) */
    function parts(markup) {
      var out = [], re = /<g\b[^>]*?\sdata-part="([^"]+)"/g, m;
      while ((m = re.exec(markup))) out.push(m[1]);
      return out;
    }
    function partTag(markup, part) {
      var a = markup.indexOf(' data-part="' + part + '"');
      var g = a < 0 ? -1 : markup.lastIndexOf("<g", a);
      if (a < 0 || g < 0 || markup.indexOf(">", g) < a) throw new Error("ART: this drawing has no part " + JSON.stringify(part) + " (it has " + parts(markup).join(", ") + ")");
      return { start: g, end: markup.indexOf(">", a) };
    }
    /* The lesson rings a part when the child finds it (computing.css: gold
       while it is pointed at, green once found). The same outline, drawn here.
       A second ring on the same part replaces the first. */
    function ring(markup, part, colour, width) {
      var tag = partTag(markup, part), o = markup.indexOf('class="outline"', tag.end), next = markup.indexOf(" data-part=", tag.end);
      if (o < 0 || (next >= 0 && o > next)) throw new Error("ART.ring: part " + part + " has no outline of its own");
      var rest = markup.slice(o + 'class="outline"'.length);
      if (rest.slice(0, 8) === ' style="') rest = rest.slice(rest.indexOf('"', 8) + 1);
      return markup.slice(0, o) + 'class="outline" style="stroke:' + (colour || "#F4C95D") + ";stroke-width:" + num(width || 5) + '"' + rest;
    }
    /* A second dim on the same part replaces the first; it never stacks. */
    function dim(markup, part, opacity) {
      var tag = partTag(markup, part);
      var open = markup.slice(tag.start, tag.end).replace(/ opacity="[^"]*"/, "") + ' opacity="' + num(opacity) + '"';
      return markup.slice(0, tag.start) + open + markup.slice(tag.end);
    }

    /* ---- the sprite stage ------------------------------------------------
       The one thing lifted here that wants a document: spriteStage writes its
       markup into a box and then finds the sprites it wrote BY ID, and run()
       changes their transforms. So there is a scratch box, off screen, that
       every call reuses; $ is opened for the length of the call and shut
       again, so nothing else in the kit can reach the page by accident.

       run() applies a block's effect immediately and only then waits out the
       animation, so a whole script can be run synchronously and the end state
       read off. That end state is the LESSON'S arithmetic - grow is x1.4 up to
       2.2, move right is one square up to three - which is the part a film
       actually wants; the markup is HTML and the lesson's CSS is not here.

       Each block run leaves one 720 ms timer behind that nobody waits for, and
       a jump leaves a second. They only ever touch the scratch box, so they are
       harmless - but work out a script's end state ONCE, beside the film's
       other constants, rather than inside a draw function that a render calls
       for every one of several thousand frames. */
    var HOST = null, STAGE_N = 0;
    function host() {
      if (!HOST) {
        HOST = document.createElement("div");
        HOST.id = "artscratch";
        HOST.setAttribute("aria-hidden", "true");
        HOST.style.cssText = "position:absolute;left:-9999px;top:0;width:560px;height:170px;overflow:hidden";
        document.body.appendChild(HOST);
      }
      return HOST;
    }
    function withDom(fn) {
      DOM_OPEN = true;
      try { return fn(); } finally { DOM_OPEN = false; }
    }
    function mount(sprites, opts) {
      var box = host();
      box.id = "artstage" + (++STAGE_N);      /* a fresh id, so a stale timer cannot find it */
      return withDom(function () { return { box: box, api: spriteStage(box, sprites, opts || {}) }; });
    }
    /* the lesson's stage as markup (see ART.foreign before using it) */
    function stage(sprites, opts) { return mount(sprites, opts).box.innerHTML; }
    /* run a script on the lesson's own stage and hand back where it ended */
    function run(sprites, ids, opts) {
      var m = mount(sprites, opts), k = (opts && opts.sprite) || 0;
      var moves = expandProgram(Array.isArray(ids) ? ids : [ids]);
      withDom(function () { moves.forEach(function (id) { m.api.run(id, k); }); });
      return m.api.state.map(function (s) { return { x: s.x, scale: s.scale, spin: s.spin, hidden: s.hidden }; });
    }

    /* ---- the rules -------------------------------------------------------- */
    function block(id) {
      if (!BLOCKS[id]) throw new Error("ART.block: the lesson kit has no block " + JSON.stringify(id) + " (it has " + Object.keys(BLOCKS).join(", ") + ")");
      return BLOCKS[id];
    }
    function deviceBlock(id) {
      if (!DEVICE_BLOCKS[id]) throw new Error("ART.device.block: Bitsy has no block " + JSON.stringify(id) + " (it has " + Object.keys(DEVICE_BLOCKS).join(", ") + ")");
      return DEVICE_BLOCKS[id];
    }

    /* ==== the load-time check ==============================================
       Everything above depends on the exact shape of markup the lesson makes,
       and a film draws thousands of frames without ever landing on the one
       that would have shown a break. So every drawing the kit has is made
       once, here, as the page loads: a change to the lesson stops the render
       by name instead of drawing something wrong, and the tool's own "the film
       page threw while loading" catches it before a single frame is bought.

       A check that passes over nothing is worth nothing, so it counts what it
       drew and refuses a count of zero.

       The ids a scene understands are read out of the scene's own source -
       has("socks"), id === "bread", and the keys of the layer and colour maps
       it carries - so a scene that grows a step is exercised with that step
       without anyone remembering to come back here. A scene ignores an id it
       does not know, so a stray match costs nothing. */
    function idsOf(fn) {
      var src = String(fn), out = [], seen = {}, m;
      var add = function (id) { if (id && !seen[id]) { seen[id] = 1; out.push(id); } };
      var call = /(?:has|includes|indexOf)\("([a-z][a-z0-9-]*)"\)/g;
      while ((m = call.exec(src))) add(m[1]);
      var eq = /id === "([a-z][a-z0-9-]*)"/g;
      while ((m = eq.exec(src))) add(m[1]);
      /* the keys of an object literal whose values are strings, colours or arrays:
         dress's layer, sandwich's fills and names, tower's size and colour */
      var key = /[{,]\s*([a-z][a-z0-9-]{1,14}):\s*['"[]/g;
      while ((m = key.exec(src))) add(m[1]);
      return out.slice(0, 24);
    }
    var TEST = { drawings: 0, checks: 0, scenes: 0, drawn: [] };
    function drew(what, markup) {
      TEST.drawings++;
      var s = String(markup);
      if (s.slice(0, 4) !== "<svg" || s.slice(-6) !== "</svg>")
        throw new Error("ART: " + what + " no longer returns one <svg> drawing (it starts " + JSON.stringify(s.slice(0, 40)) + ")");
      if (s.indexOf("undefined") >= 0 || s.indexOf("NaN") >= 0)
        throw new Error("ART: " + what + " drew undefined or NaN into its markup");
      return s;
    }
    function checked(what, ok) {
      TEST.checks++;
      if (!ok) throw new Error("ART: the lesson's rule " + what + " no longer does what a film is told it does");
    }

    Object.keys(SCENES).forEach(function (name) {
      TEST.scenes++;
      var ids = idsOf(SCENES[name]);
      /* the internet scene takes a number, not a list; everything else a list */
      if (!ids.length) { for (var s = 0; s <= 3; s++) drew("scene " + name + "(" + s + ")", scene(name, s)); return; }
      drew("scene " + name + "([])", scene(name, []));
      drew("scene " + name + " in order", scene(name, ids));
      drew("scene " + name + " backwards", scene(name, ids.slice().reverse()));
      /* the growing prefix a beat paints, which is how a film will call it */
      for (var k = 1; k < ids.length; k++) drew("scene " + name + " after " + k, scene(name, ids.slice(0, k)));
      TEST.drawn.push(name + ":" + ids.length);
    });
    Object.keys(DRAWINGS).forEach(function (name) {
      var ids = idsOf(DRAWINGS[name]);
      drew("drawing " + name + "([])", drawing(name, []));
      drew("drawing " + name + " in order", drawing(name, ids));
      for (var k = 1; k < ids.length; k++) drew("drawing " + name + " after " + k, drawing(name, ids.slice(0, k)));
      TEST.drawn.push(name + ":" + ids.length);
    });
    /* Every figure, and its tap parts rung and faded in both orders and twice
       over: each must leave exactly one opacity and one ring. A part with no
       outline of its own is one ring() refuses by name; it is skipped here,
       where a refusal would stop every film. */
    Object.keys(FIGURES).forEach(function (name) {
      var svg = drew("figure " + name, figure(name));
      var ps = parts(svg);
      if (!ps.length) throw new Error("ART: the " + name + " figure has no tap parts any more");
      ps.forEach(function (p) {
        try { ring(svg, p); } catch (e) { return; }
        var a = ring(dim(dim(ring(ring(svg, p), p, "#4FD1A0"), p, 0.5), p, 0.3), p);
        var tag = a.slice(partTag(a, p).start, partTag(a, p).end);
        checked("ring and dim on " + name + "'s " + p,
          (tag.match(/ opacity="/g) || []).length === 1 && (a.match(/class="outline" style="/g) || []).length === 1);
        drew("figure " + name + " with " + p + " rung", a);
      });
      /* placing it is the other thing every film does with it, and the box it
         is given must be the only box on the root tag - the laptop and the
         tablet are full of inner rects that carry a width of their own */
      var root = place(svg, 10, 20, 300, 300);
      root = root.slice(0, root.indexOf(">"));
      checked("place gives " + name + " one box", (root.match(/ width="/g) || []).length === 1 &&
        root.indexOf('width="300"') > 0 && root.indexOf('viewBox=') > 0);
    });
    for (var pgi = 0; pgi < 26; pgi++) drew("pigpen " + pgi, pigpen(pgi));
    checked("pigpen by letter", pigpen("a") === pigpen(0) && pigpen("Z") === pigpen(25));
    checked("place strips a drawing's own width", place(pigpen("a"), 0, 0, 40, 40).indexOf('width="40"') > 0 &&
      (place(pigpen("a"), 0, 0, 40, 40).match(/ width="/g) || []).length === 1);
    Object.keys(LED).forEach(function (n) { checked("Bitsy's " + n + " pattern", leds(n).length === 5 && leds(n).every(function (r) { return /^[01]{5}$/.test(r); })); });

    /* the sprite stage, and every block the lesson has, run on it */
    (function () {
      var one = stage("\u{1F431}");
      checked("the sprite stage draws a sprite", one.indexOf("spriteground") >= 0 && one.indexOf("class=\"sprite\"") >= 0);
      checked("the sprite stage draws two sprites", (stage(["\u{1F431}", "\u{1F436}"]).match(/class="sprite"/g) || []).length === 2);
      Object.keys(BLOCKS).forEach(function (id) {
        var end = run("\u{1F431}", [id])[0];
        checked("block " + id, end && typeof end.x === "number" && typeof end.scale === "number");
      });
      checked("move right is one square", run("\u{1F431}", ["right"])[0].x === 1);
      checked("move right stops at three", run("\u{1F431}", ["right", "right", "right", "right", "right"])[0].x === 3);
      checked("go home undoes a move", run("\u{1F431}", ["right", "right", "home"])[0].x === 0);
      checked("grow is capped", run("\u{1F431}", ["grow", "grow", "grow", "grow", "grow"])[0].scale <= 2.2);
      checked("a repeat block repeats the block after it",
        run("\u{1F431}", ["repeat3", "right"])[0].x === run("\u{1F431}", ["right", "right", "right"])[0].x);
      checked("a start position is kept", run("\u{1F431}", ["right"], { start: { x: -2 } })[0].x === -1);
      checked("two sprites keep their own places", run(["\u{1F431}", "\u{1F436}"], ["right"], { sprite: 1 })[0].x === 0);
    })();

    /* the rules mirrored in _rules.py */
    checked("expandProgram unrolls a repeat", expandProgram(["repeat2", "jump", "say"]).join() === "jump,jump,say");
    checked("usesRepeat", usesRepeat(["repeat2", "jump"]) === true && usesRepeat(["jump"]) === false);
    checked("sameEffect ignores a wait", sameEffect(["repeat3", "jump"], ["jump", "wait", "jump", "jump"]) === true);
    checked("programWords", programWords(["right", "jump"]).indexOf("move right") === 0);
    checked("runWords counts a run", runWords(["jump", "jump", "jump"]).indexOf("3 times") > 0);
    checked("rule double", ruleOutput("double", 4) === "8");
    checked("rule half of an odd number is nothing", ruleOutput("half", 5) === null && ruleOutput("half", 6) === "3");
    checked("rule add", ruleOutput("add:3", 4) === "7");
    checked("rule minus", ruleOutput("minus:3", 4) === "1");
    checked("rule times", ruleOutput("times:3", 4) === "12");
    checked("rule letters", ruleOutput("letters", "cat") === "3");
    checked("walkEnd", walkEnd([{ id: "right", n: 3 }, { id: "left", n: 1 }]) === 2);
    checked("1 = a", codeWord("cab").join() === "3,1,2" && decodeCode([3, 1, 2]) === "cab");
    checked("a Caesar shift", caesarShift("cab", 1) === "dbc");
    checked("rowMatches", rowMatches({ age: 7 }, { field: "age", op: "gt", value: 6 }) === true);
    checked("sortRows", sortRows([{ n: 3 }, { n: 1 }], "n", "asc").map(function (r) { return r.n; }).join() === "1,3");
    checked("expandLoop", expandLoop(["a"], ["b"], 2, ["c"]).join() === "a,b,b,c");
    checked("flattenAlgo counts the turns", flattenAlgo([{ kind: "repeat", times: 2, body: [{ id: "x", label: "x" }] }]).length === 2);
    checked("flattenAlgo ends a forever loop with Stop",
      flattenAlgo([{ kind: "forever", body: [{ id: "x", label: "x" }] }]).pop().id === "stop");
    checked("subExpand opens the sub-routine out",
      subExpand([{ kind: "call", sub: "s" }], { s: [{ id: "x", label: "x" }] }).length === 2);
    checked("branchRun takes the yes branch",
      branchRun({ inputs: [{ id: "hot" }, { id: "cold" }], yes: ["y"], no: ["n"] }, "hot").join() === "y");
    checked("bestAlgo refuses a tie",
      bestAlgo([{ id: "a", steps: [1] }, { id: "b", steps: [1] }], { kind: "fewest_steps" }) === null &&
      bestAlgo([{ id: "a", steps: [1] }, { id: "b", steps: [1, 2] }], { kind: "fewest_steps" }) === "a");
    /* Bitsy */
    checked("devicePlan unrolls a repeat",
      devicePlan(["whenA", "repeat2", "beep"]).plan.length === 2);
    checked("devicePlan remembers where a forever loop goes back to",
      devicePlan(["whenA", "beep", "forever", "bell"]).foreverAt === 1);
    Object.keys(DEVICE_BLOCKS).forEach(function (id) { checked("Bitsy's " + id, !!deviceBlock(id).label); });
    checked("Bitsy has five inputs", DEVICE_INPUTS.length === 5);
    /* Robo's rules */
    checked("Robo turns left", TURN_L.up === "left" && TURN_L.left === "down");
    checked("Robo turns right", TURN_R.up === "right" && TURN_R.right === "down");
    checked("Robo's facings", DIRS.up.join() === "0,-1" && DIRS.right.join() === "1,0");
    checked("Robo's four commands", Object.keys(CMD).join() === "F,B,L,R");

    /* The gate is shut again, and it must be: a film must not be able to reach
       the page through the lesson's $ once the check has run. */
    checked("the page gate is shut", (function () { try { $("film"); return false; } catch (e) { return true; } })());
    if (!TEST.drawings) throw new Error("ART: the load-time check drew nothing, so it proved nothing");
    if (typeof console !== "undefined" && console.log)
      console.log("ART (computing): " + TEST.drawings + " pictures drawn and " + TEST.checks +
        " rules checked at load, over " + TEST.scenes + " scenes, " + Object.keys(DRAWINGS).length +
        " Robo drawings and " + Object.keys(FIGURES).length + " figures");

    return {
      scene: scene, drawing: drawing, figure: figure, pigpen: pigpen, leds: leds, names: names,
      place: place, foreign: foreign, ring: ring, dim: dim, parts: parts,
      block: block, blockIds: function () { return Object.keys(BLOCKS); },
      stage: stage, run: run,
      program: { expand: expandProgram, words: programWords, runWords: runWords, usesRepeat: usesRepeat, same: sameEffect },
      robo: { DIRS: DIRS, TURN_L: TURN_L, TURN_R: TURN_R, ANGLE: ANGLE, CMD: CMD },
      rule: ruleOutput, walkEnd: walkEnd, code: codeWord, decode: decodeCode,
      caesar: caesarShift, rowMatches: rowMatches, sortRows: sortRows,
      algo: { expandLoop: expandLoop, flatten: flattenAlgo, subExpand: subExpand, branchRun: branchRun, best: bestAlgo },
      device: { block: deviceBlock, blockIds: function () { return Object.keys(DEVICE_BLOCKS); }, inputs: DEVICE_INPUTS, plan: devicePlan },
      kit: { SCENES: SCENES, DRAWINGS: DRAWINGS, FIGURES: FIGURES, BLOCKS: BLOCKS, DEVICE_BLOCKS: DEVICE_BLOCKS, LED: LED, pigpenSvg: pigpenSvg },
      esc: esc, selftest: TEST
    };

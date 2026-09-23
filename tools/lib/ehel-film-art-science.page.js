
    /* ==== the film's side ======================================================
       tools/lib/ehel-film-art-science.page.js, run inside ART's scope after the
       slices of science.js, so FIGURES, SCENES, potSvg, twoPots, SIMS, esc and
       glyphAt above are the lesson's own. Every function returns markup and
       changes nothing, so a frame stays a pure function of time.

         ART.figure(name)                         a tap figure, as an <svg>: plant, body (Stage 1);
                                                  mouth, circuit (2); organs, insect (3);
                                                  skeleton, earthLayers, ray (4)
         ART.scene(name, s)                       SCENES: plant 0-5, ground 0-3, globe(turn), sky 0-4;
                                                  zoom 0-3 is an emoji, not a drawing (Stage 1);
                                                  habitat, extract (2); gravity 0-1, fossil 0-3 (3);
                                                  volcano 0-3, quake 0-3 (4)
         ART.pots(a, b, day, opts)                two potted plants, 0 fresh to 4 drooped (twoPots)
         ART.pot(x, state, label, dark, cold)     one pot, a <g> in twoPots' 320 x 290 space
         ART.sim(name, "draw" | "init", ...)      a sim's own picture: soundFar draw(steps),
                                                  pushBall draw(x, label, thing), sunShade draw(hour, a, b),
                                                  shapeChange draw(item, anim) is HTML, not svg;
                                                  Stages 2-4: darkRoom draw(curtains, lamp), sunPath draw(0-4),
                                                  newMaterial draw(heat, cooled), friction draw(surface, x),
                                                  shadowSize draw(pos), separate draw(k) is HTML, states draw(s),
                                                  moonPhases draw(k), reaction draw(a, b), energyDrop draw(n, y),
                                                  rayMirror draw(angle, blocked), dayNight draw(h),
                                                  spinner draw(n, y, big, m); every other sim, init only
         ART.kit.<fn>(...)                        the kit's own drawing functions, for the states a
                                                  sim reaches only by running: circuitSvg(state),
                                                  forcemeterSvg(n, pic, label), magnetPair(gap, flipped),
                                                  earthMoonSvg(s), foodChainSvg(s), armSvg(bent, tricepsOn),
                                                  particleSvg(state, jiggle, tick), seriesSvg(s) (each an
                                                  <svg>); beakerSvg(x, fill, level, fizz, label, extra) (a <g>)
         ART.tank(pic, y)                         floatSink's tank, the thing dropped y px:
                                                  ART.TANK.float is where it floats, .sink the bottom
         ART.magnet(pic, reach, jump)             magnet's scene: the magnet moved reach (0-1),
                                                  the thing jumped to it by jump (0-1)
         ART.place(svg, x, y, w, h)               nest a drawing in a box of the film's 1168 x 440 space
         ART.ring(svg, part, colour, width)       draw a figure part's own tap outline
         ART.dim(svg, part, opacity)              fade one part of a figure
         ART.parts(svg)                           the part names a figure has
         ART.icon(pic)                            the kit's drawing for an emoji too new for old devices
         ART.glyphAt(cx, y, size, pic)            the lesson's way to put a picture inside a drawing
    */
    const num = (v) => String(Math.round(v * 100) / 100);

    /* A sim's drawing functions write box.innerHTML. A stand-in box collects
       the markup instead. */
    function boxed(fn) { const box = { innerHTML: "" }; fn(box); return box.innerHTML; }

    function figure(name) {
      if (typeof FIGURES[name] !== "function") throw new Error("ART.figure: the lesson kit draws no figure " + JSON.stringify(name) + " (it has " + Object.keys(FIGURES).join(", ") + ")");
      return FIGURES[name]();
    }
    function scene(name, s) {
      if (typeof SCENES[name] !== "function") throw new Error("ART.scene: the lesson kit draws no scene " + JSON.stringify(name) + " (it has " + Object.keys(SCENES).join(", ") + ")");
      return SCENES[name](s);
    }
    function pots(a, b, day, opts) { return boxed((box) => twoPots(box, a, b, day, opts || {})); }
    function sim(name, how) {
      const S = SIMS[name];
      if (!S) throw new Error("ART.sim: the lesson kit has no sim " + JSON.stringify(name) + " (it has " + Object.keys(SIMS).join(", ") + ")");
      if (how !== "draw" && how !== "init") throw new Error("ART.sim: a film may use a sim's draw or init, never " + JSON.stringify(how) + ": the rest runs the experiment");
      if (typeof S[how] !== "function") throw new Error("ART.sim: " + name + " has no " + how);
      const rest = Array.prototype.slice.call(arguments, 2);
      /* most draw into the box; sunPath's draw returns its markup instead */
      let back;
      const drawn = boxed((box) => { back = S[how].apply(S, [box].concat(rest)); });
      return drawn || (typeof back === "string" ? back : "");
    }

    /* the kit's drawing functions, sliced with the Stage 2-4 blocks */
    const kit = {
      circuitSvg: circuitSvg, forcemeterSvg: forcemeterSvg, magnetPair: magnetPair, earthMoonSvg: earthMoonSvg,
      foodChainSvg: foodChainSvg, armSvg: armSvg, particleSvg: particleSvg, beakerSvg: beakerSvg, seriesSvg: seriesSvg
    };

    /* the kit's own drawing for an Emoji 13+ picture, as the lesson build swaps it */
    function icon(p) {
      const s = String(p == null ? "" : p), cp = s.codePointAt(0);
      const name = cp != null ? BY_CODEPOINT[cp.toString(16)] : null;
      if (name && ICONS[name] && s.replace(/️/g, "") === String.fromCodePoint(cp)) return ICONS[name];
      return s;
    }

    /* floatSink draws an empty item group and act() drops a picture into it with
       a transition. A film places it at y instead: act()'s own two drops. */
    const TANK_ITEM = '<g id="fsitem" style="transition: transform 1100ms ease-in"></g>';
    const TANK = { top: 0, float: 56, sink: 188 };
    function tank(pic, y) {
      const m = sim("floatSink", "init");
      if (m.indexOf(TANK_ITEM) < 0) throw new Error("floatSink.init no longer draws its item group the way ART.tank expects");
      return m.replace(TANK_ITEM, '<g transform="translate(0,' + num(y || 0) + ')">' + (pic ? glyphAt(160, 40, 44, icon(pic)) : "") + "</g>");
    }

    /* magnet: act() slides the magnet 120 px and a magnetic thing jumps 40 px to it */
    const MAGNET_BAR = '<g id="mg" style="transition: transform 900ms ease-in-out">';
    const MAGNET_ITEM = '<g id="mi" style="transition: transform 400ms ease-in"></g>';
    function magnet(pic, reach, jump) {
      const m = sim("magnet", "init");
      if (m.indexOf(MAGNET_BAR) < 0 || m.indexOf(MAGNET_ITEM) < 0) throw new Error("magnet.init no longer draws its magnet and item the way ART.magnet expects");
      return m.replace(MAGNET_BAR, '<g transform="translate(' + num(120 * (reach || 0)) + ',0)">')
        .replace(MAGNET_ITEM, '<g transform="translate(' + num(-40 * (jump || 0)) + ',0)">' + (pic ? glyphAt(230, 140, 48, icon(pic)) : "") + "</g>");
    }

    /* one of the lesson's <svg> drawings, nested in a box of the scene's space;
       its own viewBox scales it to fit */
    function place(markup, x, y, w, h, extra) {
      const s = String(markup);
      if (s.slice(0, 5) !== "<svg ") throw new Error("ART.place nests one of the lesson's <svg> drawings, and this is not one: " + s.slice(0, 48));
      return '<svg x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' + (extra ? " " + extra : "") + s.slice(4);
    }

    /* A part is the <g> whose opening tag carries data-part="name". It is found
       by that attribute wherever it sits in the tag, so ring and dim can be
       applied in either order, and more than once. (They could not until
       2026-09-19: dim wrote its opacity in front of data-part, the next lookup
       missed the part, and the Parts of a Plant film found the throw on frames
       --sample never lands on.) */
    function parts(markup) {
      const out = [], re = /<g\b[^>]*?\sdata-part="([^"]+)"/g;
      let m;
      while ((m = re.exec(markup))) out.push(m[1]);
      return out;
    }
    function partTag(markup, part) {
      const a = markup.indexOf(' data-part="' + part + '"');
      const g = a < 0 ? -1 : markup.lastIndexOf("<g", a);
      if (a < 0 || g < 0 || markup.indexOf(">", g) < a) throw new Error("ART: this drawing has no part " + JSON.stringify(part) + " (it has " + parts(markup).join(", ") + ")");
      return { start: g, end: markup.indexOf(">", a) };
    }
    /* The lesson rings a part when the child finds it (science.css: gold while
       it is pointed at, green once found). The same outline, drawn here. A
       second ring on the same part replaces the first. */
    function ring(markup, part, colour, width) {
      const tag = partTag(markup, part), o = markup.indexOf('class="outline"', tag.end), next = markup.indexOf(" data-part=", tag.end);
      if (o < 0 || (next >= 0 && o > next)) throw new Error("ART.ring: part " + part + " has no outline of its own");
      let rest = markup.slice(o + 'class="outline"'.length);
      if (rest.slice(0, 8) === ' style="') rest = rest.slice(rest.indexOf('"', 8) + 1);
      return markup.slice(0, o) + 'class="outline" style="stroke:' + (colour || "#F4C95D") + ";stroke-width:" + num(width || 5) + '"' + rest;
    }
    /* A second dim on the same part replaces the first; it never stacks. */
    function dim(markup, part, opacity) {
      const tag = partTag(markup, part);
      const open = markup.slice(tag.start, tag.end).replace(/ opacity="[^"]*"/, "") + ' opacity="' + num(opacity) + '"';
      return markup.slice(0, tag.start) + open + markup.slice(tag.end);
    }

    /* Everything above that edits the lesson's markup depends on that markup's
       exact shape, so it is all tried once as the page loads: a change to the
       lesson stops the render here, by name, instead of drawing something else. */
    /* Every figure the kit has, so a Grade 2-4 figure is checked the same way.
       A part with no outline of its own is one ring() refuses by name; it is
       left out here, where a refusal would stop every film. */
    Object.keys(FIGURES).forEach((f) => {
      const svg = figure(f);
      if (!parts(svg).length) throw new Error("ART: the " + f + " figure has no tap parts any more");
      parts(svg).forEach((p) => {
        try { ring(svg, p); } catch (e) { return; }
        /* both orders, and twice over: each must leave one opacity and one ring */
        const a = ring(dim(dim(ring(ring(svg, p), p, "#4FD1A0"), p, 0.5), p, 0.3), p);
        const tag = a.slice(partTag(a, p).start, partTag(a, p).end);
        if ((tag.match(/ opacity="/g) || []).length !== 1 || (a.match(/class="outline" style="/g) || []).length !== 1)
          throw new Error("ART: ring and dim no longer leave one opacity and one ring on " + f + "'s " + p);
      });
    });
    tank("\u{1FAA8}", TANK.sink);
    magnet("\u{1F4CE}", 1, 1);

    return {
      figure: figure, scene: scene, pots: pots, pot: potSvg, sim: sim, tank: tank, TANK: TANK, magnet: magnet,
      kit: kit, place: place, ring: ring, dim: dim, parts: parts, icon: icon, glyphAt: glyphAt, esc: esc, ICONS: ICONS
    };

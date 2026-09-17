/* The browser half of tools/create-ehel-science-unit-lecture.py.
 *
 * One function matters: window.EHEL_FILM.frame(t) paints the whole 1280x720
 * composition for the absolute time t, and returns nothing. Nothing here
 * animates itself - no CSS transition, no requestAnimationFrame - because the
 * renderer screenshots frames one at a time and a self-animating page would
 * hand it whatever the clock happened to say. Every moving thing is a pure
 * function of t, so frame(12.5) draws the same pixels on the tenth run as on
 * the first.
 *
 * THE SKELETON AND THE ARM ARE NOT DRAWN HERE. They are lifted verbatim out of
 * science/lesson-kit/lib/science.js by the Python side and handed over as
 * window.ART, so the child watches the same drawing they tap in the lesson. The
 * one addition is armSvgAt(): armSvg() only knows three poses and a video needs
 * the motion between them, so armSvgAt() interpolates the same constants. Its
 * three endpoints are checked against armSvg() character for character at
 * render time - if the lesson's arm is redrawn and this is not, the build
 * refuses rather than shipping a video of an arm that no longer exists.
 */
(function () {
  "use strict";

  var W = 1280, H = 720;
  var F = window.FILM;            /* the storyboard, plus the measured timeline */
  var ART = window.ART;           /* skeletonSvg(), armSvg(), armSvgAt() */

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /* ---- easing ------------------------------------------------------- */
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  /* smoothstep: flat at both ends, so a thing that arrives does not jerk */
  var ease = function (v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  /* 0 before `at`, 1 once `span` seconds have passed */
  var inAt = function (t, at, span) { return ease((t - at) / (span || 0.45)); };

  /* ---- the timeline -------------------------------------------------
     FILM.beats is flat and already carries start/end in seconds, measured
     from the narration clips. Each beat knows its scene, so finding "where
     are we" is one scan; at 30fps over three minutes that is cheap enough
     not to need an index. */
  var BEATS = F.beats;
  var TOTAL = F.total;

  function beatAt(t) {
    for (var i = 0; i < BEATS.length; i++) if (t < BEATS[i].end) return i;
    return BEATS.length - 1;
  }

  /* The value of a numeric art field at time t, eased between the beat that
     set it last and the beat that sets it next. A field absent from a beat
     keeps the value it had, which is why a scene only writes what changes. */
  function field(i, name, dflt) {
    for (var k = i; k >= 0; k--) {
      var b = BEATS[k];
      if (b.art && b.art[name] != null) return b.art[name];
      if (k < i && b.scene !== BEATS[i].scene) break;
    }
    return dflt;
  }

  function fieldAt(t, i, name, dflt) {
    var now = field(i, name, dflt);
    var prev = i > 0 ? field(i - 1, name, dflt) : dflt;
    if (prev === now || typeof now !== "number" || typeof prev !== "number") return now;
    return prev + (now - prev) * inAt(t, BEATS[i].start, 0.5);
  }

  /* Each scene owns a colour, so the film reads as chapters rather than one
     long slide. Every value is a lesson.css dark-half token - the film invents
     no colours of its own. Keyed by scene id here rather than written into the
     storyboard, because it is a property of how the film LOOKS and the
     storyboard is what it SAYS. */
  var HUE = {
    title: "#35BFB2", bones: "#F4C95D", jobs: "#35BFB2", pull: "#E9744F",
    pair: "#B78BD1", health: "#4FD1A0", people: "#6E9DE8", recap: "#35BFB2"
  };

  /* ---- chrome -------------------------------------------------------- */
  function chrome(scene, t) {
    var pct = clamp(t / TOTAL, 0, 1) * 100;
    return '<header class="bar">' +
      '<span class="mark">E</span>' +
      '<span class="brand">Ehel Academy<b>' + esc(F.subtitle) + "</b></span>" +
      '<span class="unit">' + esc(F.title) + "</span>" +
      "</header>" +
      '<div class="rail"><i style="width:' + pct.toFixed(3) + '%"></i></div>';
  }

  /* The scene's title bar: a coloured dot, the chapter name, and the Cambridge
     codes pushed to the right. The codes used to float bottom-right over the
     stage, where four of them landed across the Conclusion card. Here they have
     a row of their own and cannot collide with anything.

     The heading leads the codes by a beat - that stagger is what makes a cut
     read as a new chapter rather than a repaint. */
  function heading(scene, t, i) {
    if (!scene.heading) return "";
    var at = BEATS[scene.first].start;
    var a = inAt(t, at, 0.55), b = inAt(t, at + 0.12, 0.55);
    var cs = (scene.codes || []).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
    return '<div class="kicker" style="opacity:' + b.toFixed(3) + '">' +
        '<i class="dot"></i>' +
        /* the CHAPTER, not the subject: the top bar already says "Grade 4
           Science" two lines above, and printing it twice tells a viewer
           nothing the second time */
        '<span class="eyebrow">Chapter ' + (BEATS[i].scene + 1) + " of " + F.scenes.length + "</span>" +
        (cs ? '<div class="codes">' + cs + "</div>" : "") +
      "</div>" +
      '<h2 class="sceneh" style="opacity:' + a.toFixed(3) +
      ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(scene.heading) + "</h2>";
  }

  /* The spoken line, on screen, one beat at a time. Not a caption track -
     that ships beside the file as .vtt - but the sentence being said, which
     is what a nine-year-old reading along needs. */
  function band(beat, t) {
    var o = inAt(t, beat.start, 0.34);
    return '<footer class="band">' +
      '<p style="opacity:' + o.toFixed(3) + ";transform:translateY(" + ((1 - o) * 9).toFixed(2) + 'px)">' +
      esc(beat.say) + "</p></footer>";
  }

  /* ---- scene: the title card ----------------------------------------- */
  function sceneTitle(scene, beat, t) {
    var a = inAt(t, BEATS[scene.first].start, 1.0);
    var b = inAt(t, BEATS[scene.first + 1].start, 0.7);
    return '<div class="title">' +
      '<div class="tfig figure glow" style="opacity:' + (0.18 + a * 0.82).toFixed(3) +
        ";transform:translateY(" + ((1 - a) * 26).toFixed(2) + "px) scale(" + (0.94 + a * 0.06).toFixed(3) + ')">' +
        ART.skeletonSvg() + "</div>" +
      '<div class="tw">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">' + esc(F.subtitle) + " · Unit lecture</p>" +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(F.title) + "</h1>" +
        '<p class="tsub" style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 12).toFixed(2) + 'px)">' +
          "About two hundred bones, and hundreds of muscles.<br>Here is how they move you.</p>" +
      "</div></div>";
  }

  /* ---- scene: the seven bones ----------------------------------------
     The lesson's own skeleton, one bone lit as it is named. Lighting is the
     lesson's own visual language: the .outline shape that a tapped bone gets
     a stroke on, in --gold while it is being named and --good once it has
     been. The list on the right fills in behind it. */
  var BONES = [
    ["skull", "skull"], ["jaw", "jaw"], ["ribcage", "rib cage"], ["spine", "spine"],
    ["hip", "hip"], ["armbones", "arm bones"], ["legbones", "leg bones"]
  ];

  function sceneBones(scene, beat, t, i) {
    var part = field(i, "part", null);
    var seen = {}, upto = -1;
    for (var k = scene.first; k <= i; k++) {
      var p = BEATS[k].art && BEATS[k].art.part;
      if (p) { seen[p] = true; }
    }
    for (var j = 0; j < BONES.length; j++) if (BONES[j][0] === part) upto = j;

    var pulse = 0.5 + 0.5 * Math.sin((t - (part ? BEATS[i].start : 0)) * 3.6);
    var svg = ART.skeletonSvg();

    /* Stroke the named bone's outline gold, the ones already named green.
       Done on the markup because the figure is re-emitted every frame. */
    svg = svg.replace(/<g data-part="([a-z]+)"([^>]*)>/g, function (m, id, rest) {
      var cls = seen[id] ? (id === part ? "now" : "had") : "";
      return '<g data-part="' + id + '"' + rest + ' class="' + cls + '">';
    });
    svg = svg.replace(/class="outline"/g, 'class="outline"');

    var list = BONES.map(function (b, n) {
      var had = !!seen[b[0]], now = b[0] === part;
      var o = had ? 1 : 0.3;
      return '<li class="' + (now ? "now" : had ? "had" : "") + '" style="opacity:' + o + '">' +
        '<span class="tick">' + (had ? "✓" : n + 1) + "</span>" + esc(b[1]) + "</li>";
    }).join("");

    return '<div class="bones">' +
      '<div class="figure glow' + (part ? " lit" : "") + '" style="--pulse:' + pulse.toFixed(3) + '">' + svg + "</div>" +
      '<div class="blist"><p class="eyebrow">Seven bones to know</p><ol>' + list + "</ol>" +
        '<p class="bcount">' + Object.keys(seen).length + " of 7</p></div>" +
      "</div>";
  }

  /* ---- scene: the four jobs ------------------------------------------ */
  function sceneJobs(scene, beat, t, i) {
    var lit = fieldAt(t, i, "lit", 0);
    var alive = field(i, "alive", false);
    var cards = F.jobs.map(function (j, n) {
      var on = clamp(lit - n, 0, 1);
      return '<div class="card' + (on > 0.5 ? " on" : "") + '" style="opacity:' + (0.28 + on * 0.72).toFixed(3) +
        ";transform:translateY(" + ((1 - on) * 18).toFixed(2) + "px) scale(" + (0.96 + on * 0.04).toFixed(3) + ')">' +
        '<span class="ic">' + j[0] + "</span>" +
        "<b>" + esc(j[1]) + "</b><i>" + esc(j[2]) + "</i></div>";
    }).join("");
    var aliveO = alive ? inAt(t, BEATS[i].start, 0.5) : 0;
    return '<div class="jobs">' +
      '<div class="figure glow">' + ART.skeletonSvg() + "</div>" +
      '<div class="jgrid">' + cards +
        '<div class="alive" style="opacity:' + aliveO.toFixed(3) +
          ";transform:translateY(" + ((1 - aliveO) * 14).toFixed(2) + 'px)">' +
          "<b>And bones are alive.</b> They grow with you, and a broken one mends itself.</div>" +
      "</div></div>";
  }

  /* ---- scene: the arm ------------------------------------------------
     The lesson's own arm, moving. In the last beat of the pair scene the two
     muscles take turns on a loop, which is the thing the still drawing cannot
     show and the reason this video exists. */
  /* armSvg's "tendons join muscle to bone" starts at x=210 in a 320-wide
     viewBox and is about 163 units long, so its last four words fall outside
     the drawing and an <svg> clips to its viewport. That is true in the lesson
     as well and is NOT fixed here - fixing it would edit the lesson's artwork,
     which the render gate would then refuse. The film widens the FRAME instead:
     the viewBox and the drawing's own background rect grow together, so the
     picture is identical and there is simply more of the page beside it.

     It grows UPWARDS for a second reason. The hand sits at (290, 112) on the
     forearm, and at the full -70 degree bend it rotates to about (211, -15) -
     outside the viewBox, so the bent arm loses its hand while the straight one
     keeps it. Same clip in the lesson; here the frame simply starts higher.
     -62 is measured, not guessed: the glyph's rotated bounds are y -54.6 to
     -12.7 in viewBox units at the full bend. */
  function reframe(svg) {
    return svg
      .replace('viewBox="0 0 320 220"', 'viewBox="-6 -62 398 282"')
      .replace('<rect width="320" height="220" fill="#F3EFE6"/>',
               '<rect x="-6" y="-62" width="398" height="282" fill="#F3EFE6"/>');
  }

  function sceneArm(scene, beat, t, i) {
    var b, tr;
    if (field(i, "cycle", false)) {
      var ph = (t - BEATS[i].start) / 2.6;
      var s = 0.5 - 0.5 * Math.cos(clamp(ph, 0, 99) * Math.PI);
      var w = (Math.sin((t - BEATS[i].start) * (Math.PI / 1.3) - Math.PI / 2) + 1) / 2;
      b = w; tr = 1 - w;
    } else {
      b = fieldAt(t, i, "biceps", 0);
      tr = fieldAt(t, i, "triceps", 0);
    }

    var chip = beat.chip ? '<div class="chip" style="opacity:' + inAt(t, beat.start, 0.4).toFixed(3) + '">' + esc(beat.chip) + "</div>" : "";
    var banner = beat.banner
      ? '<div class="banner" style="opacity:' + inAt(t, beat.start, 0.4).toFixed(3) +
        ";transform:scale(" + (0.94 + inAt(t, beat.start, 0.4) * 0.06).toFixed(3) + ')">' + esc(beat.banner) + "</div>"
      : "";

    /* How hard each muscle is pulling. TWO SHAPES, and which one is drawn is
       decided by whether the scene runs an enquiry chain, not by taste: the
       four enquiry cards and two full-height meters do not both fit the right
       column, and the first render of the pair scene cut the Conclusion card
       in half and printed the objective chips across what was left of it. */
    var meter = function (label, v, cls) {
      return '<div class="meter ' + cls + (v > 0.55 ? " on" : "") + '"><b>' + label + "</b>" +
        '<span class="track"><i style="width:' + (v * 100).toFixed(1) + '%"></i></span>' +
        "<em>" + (v > 0.55 ? "contracted" : "relaxed") + "</em></div>";
    };
    var pairMeter = function () {
      var row = function (label, v, cls) {
        return '<div class="prow ' + cls + (v > 0.55 ? " on" : "") + '">' +
          "<b>" + label + "</b>" +
          '<span class="track"><i style="width:' + (v * 100).toFixed(1) + '%"></i></span>' +
          "<em>" + (v > 0.55 ? "contracted" : "relaxed") + "</em></div>";
      };
      return '<div class="pairmeter">' + row("biceps", b, "bi") + row("triceps", tr, "tri") + "</div>";
    };
    var chain = enquiry(scene, beat, t, i);

    /* The banner belongs in the SIDE column, not over the drawing: laid on the
       picture it covered "triceps relaxed" and "tendons join muscle to bone",
       which are the two labels the sentence is about. */
    return '<div class="arm">' +
      '<div class="armfig">' + reframe(ART.armSvgAt(b, tr)) + "</div>" +
      '<div class="armside">' + chip +
        (chain ? pairMeter() : meter("biceps", b, "bi") + meter("triceps", tr, "tri")) +
        chain + banner +
      "</div></div>";
  }

  /* The working-scientifically chain, built one card at a time as the lecture
     asks, predicts, watches and concludes (4TWSp.03, 4TWSa.01, 4TWSa.03).
     The QUESTION card is here because 4TWSa.03 is not "make a conclusion" but
     "make a conclusion from results and relate it to the scientific question
     being investigated" - the question is asked in the narration and used to
     leave the screen before the answer it produced arrived. */
  var ENQ = [
    ["question", "Question", "How does the arm get straight again?"],
    ["predict", "Prediction", "When the triceps contracts, the arm will straighten."],
    ["result", "Result", "It straightened. The result supported the prediction."],
    ["conclude", "Conclusion", "A muscle can only pull, so every moving bone has a pair."]
  ];

  function enquiry(scene, beat, t, i) {
    var reached = {}, any = false;
    for (var k = scene.first; k <= i; k++) if (BEATS[k].enquiry) { reached[BEATS[k].enquiry] = BEATS[k].start; any = true; }
    if (!any) return "";
    return '<div class="enq">' + ENQ.map(function (e) {
      if (reached[e[0]] == null) return "";
      var o = inAt(t, reached[e[0]], 0.45);
      return '<div class="ecard ' + e[0] + '" style="opacity:' + o.toFixed(3) +
        ";transform:translateX(" + ((1 - o) * 14).toFixed(2) + 'px)"><b>' + e[1] + "</b><p>" + esc(e[2]) + "</p></div>";
    }).join("") + "</div>";
  }

  /* ---- scene: movement and health, people, and the recap --------------
     Three list scenes with the same shape and different data, so one
     renderer with the rows passed in. */
  function listScene(rows, cls) {
    return function (scene, beat, t, i) {
      var lit = fieldAt(t, i, "lit", 0);
      var sign = field(i, "sign", false);
      var cards = rows.map(function (r, n) {
        var on = clamp(lit - n, 0, 1);
        return '<div class="card' + (on > 0.5 ? " on" : "") + '" style="opacity:' + (0.26 + on * 0.74).toFixed(3) +
          ";transform:translateY(" + ((1 - on) * 20).toFixed(2) + "px) scale(" + (0.95 + on * 0.05).toFixed(3) + ')">' +
          '<span class="ic">' + r[0] + "</span><b>" + esc(r[1]) + "</b><i>" + esc(r[2]) + "</i></div>";
      }).join("");
      var s = sign ? inAt(t, BEATS[i].start, 0.5) : 0;
      return '<div class="' + cls + '">' + cards +
        (sign ? '<div class="signoff" style="opacity:' + s.toFixed(3) + ";transform:scale(" + (0.9 + s * 0.1).toFixed(3) + ')">Now go and do it yourself.</div>' : "") +
        "</div>";
    };
  }

  var KINDS = {
    title: sceneTitle,
    bones: sceneBones,
    jobs: sceneJobs,
    arm: sceneArm,
    health: null,   /* filled below, once F is known */
    people: null,
    recap: null
  };

  /* ---- the title card and the end card --------------------------------
     Neither is a scene and neither is a beat: a beat is one narration clip,
     and these are silent. They are held segments at the two ends of the
     timeline (FILM.cards), and frame() hands off to them before it looks for
     a beat at all - so no chrome, no lower third, nothing that belongs to the
     spoken film appears over them. */

  function openCard(t) {
    var c = F.cards.open;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.15, 0.85);         /* the mark and the rule */
    var b = inAt(t, c.start + 0.55, 0.9);          /* the title */
    var d = inAt(t, c.start + 1.15, 0.9);          /* the line under it */
    var out = 1 - ease((u - 0.86) / 0.14);         /* hand over to the film */
    return '<div class="card-slide open" style="opacity:' + (a * out).toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.13).toFixed(3) +
        ";transform:scale(" + (1.04 + u * 0.05).toFixed(4) + ')">' + ART.skeletonSvg() + "</div>" +
      '<div class="cs-in">' +
        '<div class="cs-mark" style="opacity:' + a.toFixed(3) +
          ";transform:scale(" + (0.86 + a * 0.14).toFixed(3) + ')">E</div>' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">Ehel Academy · ' + esc(F.subtitle) + "</p>" +
        '<h1 style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 18).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + d.toFixed(3) + ')"></div>' +
        '<p class="cs-by" style="opacity:' + d.toFixed(3) +
          ";transform:translateY(" + ((1 - d) * 8).toFixed(2) + 'px)">' +
          "A short unit lecture by the Ehel Academy Virtual Teacher</p>" +
        '<p class="cs-sub" style="opacity:' + inAt(t, c.start + 1.55, 0.8).toFixed(3) +
          '">Cambridge Primary Science 0097 · Stage ' + esc(F.stage) + "</p>" +
      "</div></div>";
  }

  function endCard(t) {
    var c = F.cards.end;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.35, 0.8);
    var b = inAt(t, c.start + 0.85, 0.8);
    var codes = (F.objectives || []).map(function (o, n) {
      /* staggered, so the eight codes arrive as a list being read rather than
         as one block appearing */
      var k = inAt(t, c.start + 1.15 + n * 0.09, 0.5);
      return '<span style="opacity:' + k.toFixed(3) +
        ";transform:translateY(" + ((1 - k) * 8).toFixed(2) + 'px)">' + esc(o[0]) + "</span>";
    }).join("");
    return '<div class="card-slide end" style="opacity:' + a.toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.11).toFixed(3) +
        ";transform:scale(" + (1.0 + u * 0.05).toFixed(4) + ')">' + ART.skeletonSvg() + "</div>" +
      '<div class="cs-in">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">That is the whole lesson</p>' +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 14).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + b.toFixed(3) + ')"></div>' +
        '<p class="cs-cap" style="opacity:' + b.toFixed(3) + '">What this lesson covered</p>' +
        '<div class="cs-codes">' + codes + "</div>" +
        '<p class="cs-sign" style="opacity:' + inAt(t, c.start + 2.2, 0.8).toFixed(3) + '">' +
          '<span class="cs-mark sm">E</span>Ehel Academy · ' + esc(F.subtitle) + "</p>" +
      "</div></div>";
  }

  /* ---- the frame ------------------------------------------------------ */
  function frame(t) {
    /* The cards own the whole frame at the two ends, before any beat is
       looked for. --hue is set first so they are tinted like everything else. */
    var film = document.getElementById("film");
    if (F.cards && t < F.cards.open.end) {
      film.style.setProperty("--hue", HUE.title);
      film.innerHTML = openCard(t);
      return;
    }
    if (F.cards && t >= F.cards.end.start) {
      film.style.setProperty("--hue", HUE.recap);
      film.innerHTML = endCard(t);
      return;
    }

    KINDS.health = KINDS.health || listScene(F.health, "rows three");
    KINDS.people = KINDS.people || listScene(F.people, "rows four");
    KINDS.recap = KINDS.recap || listScene(F.recap, "rows four recap");

    var i = beatAt(t);
    var beat = BEATS[i];
    var scene = F.scenes[beat.scene];
    var draw = KINDS[scene.kind];

    /* a scene change crossfades, so no cut lands mid-sentence */
    var fade = inAt(t, scene.start, 0.4);

    /* The scene's colour drives every accent through one custom property, so
       nothing downstream has to know which scene it is in. */
    film.style.setProperty("--hue", HUE[scene.id] || "#35BFB2");

    /* A slow drift across the whole scene - about 10px and 1.5% over its
       length. Small enough not to be seen as movement, large enough that a
       held shot does not read as a still. */
    var span = Math.max(scene.end - scene.start, 0.001);
    var d = clamp((t - scene.start) / span, 0, 1);

    film.innerHTML =
      chrome(scene, t) +
      '<main class="stage" style="opacity:' + fade.toFixed(3) +
        ";transform:translateY(" + ((1 - fade) * 14 - d * 6).toFixed(2) +
        "px) scale(" + (1 + d * 0.012).toFixed(4) + ')">' +
        heading(scene, t, i) +
        draw(scene, beat, t, i) +
      "</main>" +
      band(beat, t);
  }

  window.EHEL_FILM = { frame: frame, total: TOTAL };
})();

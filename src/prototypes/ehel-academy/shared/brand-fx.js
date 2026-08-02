/* Brand text shimmer (WebGL).
 *
 * Any element carrying [data-brand-fx] gets its text rendered through a
 * WebGL fragment shader: the glyphs are rasterised to a texture and an
 * animated teal->navy->gold gradient flows through them. The DOM text is
 * kept in place with a transparent fill, so layout, selection targets and
 * screen readers are untouched; the canvas is purely decorative
 * (aria-hidden). If WebGL is unavailable the element is left exactly as it
 * was -- plain styled text.
 *
 * Respects prefers-reduced-motion (renders one static frame, no loop) and
 * pauses when the tab is hidden.
 */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var VERT = [
    "attribute vec2 p;",
    "varying vec2 uv;",
    "void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }"
  ].join("\n");

  // Palette stays dark so the text remains readable on the light topbar.
  var FRAG = [
    "precision mediump float;",
    "varying vec2 uv;",
    "uniform sampler2D tx;",
    "uniform float t;",
    "vec3 palette(float k){",
    "  vec3 teal = vec3(0.024, 0.373, 0.345);",   // #065f58
    "  vec3 navy = vec3(0.090, 0.196, 0.302);",   // #17324d
    "  vec3 gold = vec3(0.678, 0.494, 0.114);",   // #ad7e1d
    "  k = fract(k);",
    "  if (k < 0.45) { return mix(teal, navy, smoothstep(0.0, 0.45, k)); }",
    "  if (k < 0.70) { return mix(navy, gold, smoothstep(0.45, 0.70, k)); }",
    "  return mix(gold, teal, smoothstep(0.70, 1.0, k));",
    "}",
    "void main(){",
    "  float a = texture2D(tx, uv).a;",
    "  if (a < 0.01) { discard; }",
    "  float wave = 0.10 * sin(uv.y * 5.0 + t * 0.9);",
    "  vec3 c = palette(uv.x * 0.85 - t * 0.06 + wave);",
    "  float sheen = pow(max(0.0, sin((uv.x - t * 0.11) * 6.28318)), 24.0);",
    "  c += sheen * 0.35;",
    "  gl_FragColor = vec4(c, a);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  function rasterise(el, rect, dpr) {
    var cs = getComputedStyle(el);
    var c2 = document.createElement("canvas");
    c2.width = Math.max(1, Math.ceil(rect.width * dpr));
    c2.height = Math.max(1, Math.ceil(rect.height * dpr));
    var ctx = c2.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    if (cs.letterSpacing && cs.letterSpacing !== "normal" && "letterSpacing" in ctx) {
      ctx.letterSpacing = cs.letterSpacing;
    }
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(el.textContent.trim(), 0, rect.height / 2 + 0.5);
    return c2;
  }

  function attach(el) {
    var rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) { return null; }
    var dpr = Math.min(window.devicePixelRatio || 1, 3);

    var canvas = document.createElement("canvas");
    canvas.className = "brand-fx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.max(1, Math.ceil(rect.width * dpr));
    canvas.height = Math.max(1, Math.ceil(rect.height * dpr));

    var gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false })
          || canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) { return null; }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { return null; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { return null; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rasterise(el, rect, dpr));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var tLoc = gl.getUniformLocation(prog, "t");
    el.classList.add("brand-fx-live");
    el.appendChild(canvas);

    return function draw(time) {
      gl.uniform1f(tLoc, time / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }

  function init(isretry) {
    var draws = [];
    var unsized = 0;
    var els = document.querySelectorAll("[data-brand-fx]");
    for (var i = 0; i < els.length; i++) {
      if (els[i].classList.contains("brand-fx-live")) { continue; }
      if (els[i].getBoundingClientRect().width < 2) { unsized++; continue; }
      try {
        var d = attach(els[i]);
        if (d) { draws.push(d); }
      } catch (e) { /* leave that element as plain text */ }
    }
    // Layout not settled yet (stylesheet still applying): one retry.
    if (unsized > 0 && !isretry) {
      setTimeout(function () { init(true); }, 400);
    }
    if (!draws.length) { return; }

    if (REDUCED) {
      for (var j = 0; j < draws.length; j++) { draws[j](0); }
      return;
    }
    var running = true;
    function frame(time) {
      if (running) {
        for (var k = 0; k < draws.length; k++) { draws[k](time); }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
    });
  }

  // Boot on window load, then wait for fonts: rasterising needs both final
  // layout (stylesheet applied, elements at their real size) and final glyph
  // metrics. fonts.ready alone fires before deferred stylesheets settle,
  // which measured the targets at zero width and silently attached nothing.
  function boot() {
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { init(false); });
    } else {
      init(false);
    }
  }
  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot);
  }
})();

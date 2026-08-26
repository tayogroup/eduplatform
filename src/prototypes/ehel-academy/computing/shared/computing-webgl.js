// Interactive WebGL scenes for the Computing course: binary counting, program
// flow (sequence, iteration, selection), variables, networks and packets,
// sorting and searching, pixels, the micro:bit LED grid, ciphers, robots,
// databases and spreadsheets — plus the word-explainer scenes the Stage 1-4
// Computing Words card shows (see computing-word-scenes.js), which animate the
// behaviour a vocabulary word names: a bug being found and fixed, a tally
// crossing its fifth mark, a backup copy travelling to a second drive.
//
// Shares the rendering approach of the mathematics geometry and science
// modules. What differs is what is being shown: computing ideas are almost all
// about behaviour over time — a value changing, data moving, a loop going
// round — so every scene animates rather than posing a static object.
const TAU = Math.PI * 2;
const COLORS = {
  teal: [0.06, 0.55, 0.49, 1], blue: [0.18, 0.42, 0.87, 1], gold: [0.98, 0.70, 0.20, 1],
  orange: [0.94, 0.42, 0.12, 1], pink: [0.86, 0.25, 0.57, 1], red: [0.91, 0.27, 0.25, 1],
  navy: [0.09, 0.20, 0.30, 1], gray: [0.62, 0.66, 0.70, 1], green: [0.24, 0.62, 0.32, 1],
};

const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let col = 0; col < 4; col += 1) for (let row = 0; row < 4; row += 1) {
    for (let k = 0; k < 4; k += 1) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  }
  return out;
}
function translation(x, y, z) { const m = identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
function scale(x, y, z) { const m = identity(); m[0] = x; m[5] = y; m[10] = z; return m; }
function rotationX(a) { const c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; }
function rotationY(a) { const c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; }
function rotationZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; }
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2), range = 1 / (near - far);
  return [f / aspect,0,0,0, 0,f,0,0, 0,0,(near + far) * range,-1, 0,0,near * far * range * 2,0];
}
function compose(object, group) {
  let m = group;
  m = multiply(m, translation(...(object.position || [0, 0, 0])));
  const r = object.rotation || [0, 0, 0];
  m = multiply(m, rotationZ(r[2])); m = multiply(m, rotationY(r[1])); m = multiply(m, rotationX(r[0]));
  return multiply(m, scale(...(object.scale || [1, 1, 1])));
}

function cubeMesh() {
  const faces = [
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]], [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
  ];
  const positions = [], normals = [], indices = [];
  faces.forEach((face) => { const start = positions.length / 3; face.slice(0, 4).forEach((p) => { positions.push(...p); normals.push(...face[4]); }); indices.push(start,start+1,start+2,start,start+2,start+3); });
  return { positions, normals, indices };
}
function roundMesh(sides = 24, rings = 12, sphere = false, topRadius = 1) {
  const positions = [], normals = [], indices = [];
  if (sphere) {
    for (let y = 0; y <= rings; y += 1) {
      const v = y / rings, phi = v * Math.PI;
      for (let x = 0; x <= sides; x += 1) { const theta = x / sides * TAU, nx = Math.sin(phi)*Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi)*Math.sin(theta); positions.push(nx,ny,nz); normals.push(nx,ny,nz); }
    }
    for (let y = 0; y < rings; y += 1) for (let x = 0; x < sides; x += 1) { const a=y*(sides+1)+x,b=a+sides+1; indices.push(a,b,a+1,b,b+1,a+1); }
    return { positions, normals, indices };
  }
  for (let i = 0; i <= sides; i += 1) {
    const a=i/sides*TAU,c=Math.cos(a),s=Math.sin(a), slope=1-topRadius;
    positions.push(c,-1,s,c*topRadius,1,s*topRadius); normals.push(c,slope,s,c,slope,s);
  }
  for (let i=0;i<sides;i+=1) { const a=i*2; indices.push(a,a+1,a+2,a+1,a+3,a+2); }
  for (const [y,radius,normal] of [[-1,1,-1],[1,topRadius,1]]) {
    const center=positions.length/3; positions.push(0,y,0); normals.push(0,normal,0);
    for (let i=0;i<=sides;i+=1) { const a=i/sides*TAU; positions.push(Math.cos(a)*radius,y,Math.sin(a)*radius); normals.push(0,normal,0); }
    for (let i=0;i<sides;i+=1) normal>0 ? indices.push(center,center+i+1,center+i+2) : indices.push(center,center+i+2,center+i+1);
  }
  return { positions, normals, indices };
}

function shader(gl, type, source) { const item=gl.createShader(type); gl.shaderSource(item,source); gl.compileShader(item); if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item)); return item; }
function createProgram(gl) {
  const vertex = shader(gl, gl.VERTEX_SHADER, `attribute vec3 a_position;attribute vec3 a_normal;uniform mat4 u_viewProjection;uniform mat4 u_model;varying float v_light;void main(){vec3 normal=normalize(mat3(u_model)*a_normal);v_light=.56+.44*max(dot(normal,normalize(vec3(.4,.8,1.0))),0.0);gl_Position=u_viewProjection*u_model*vec4(a_position,1.0);}`);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `precision mediump float;uniform vec4 u_color;varying float v_light;void main(){gl_FragColor=vec4(u_color.rgb*v_light,u_color.a);}`);
  const program=gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)); return program;
}
function uploadMesh(gl, mesh) {
  const result={count:mesh.indices.length};
  result.positions=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,result.positions); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.positions),gl.STATIC_DRAW);
  result.normals=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,result.normals); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.normals),gl.STATIC_DRAW);
  result.indices=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,result.indices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(mesh.indices),gl.STATIC_DRAW);
  return result;
}

const object = (mesh, position, size, color, rotation=[0,0,0]) => ({ mesh, position, scale: Array.isArray(size)?size:[size,size,size], color, rotation });
function arrow(objects, x, y, angle, color, length=1.25) {
  const dx=-Math.sin(angle),dy=Math.cos(angle), mid=[x+dx*length*.42,y+dy*length*.42,0];
  objects.push(object("cylinder",mid,[.11,length*.42,.11],color,[0,0,angle]));
  objects.push(object("cone",[x+dx*length,y+dy*length,0],[.26,.38,.26],color,[0,0,angle]));
}
function rectanglePoint(p, w, h) {
  // Walk the perimeter of a rectangle centred at origin; p in [0, 1).
  const per = 2 * (w + h), d = ((p % 1) + 1) % 1 * per;
  if (d < w) return [-w / 2 + d, -h / 2];
  if (d < w + h) return [w / 2, -h / 2 + (d - w)];
  if (d < 2 * w + h) return [w / 2 - (d - w - h), h / 2];
  return [-w / 2, h / 2 - (d - 2 * w - h)];
}

// Exported so the scene catalogue can be checked without a GL context: a scene
// that returns nothing, or emits a NaN coordinate or an unknown mesh, renders
// as a silently blank canvas in the browser.
//
// Every scene here animates something a still diagram cannot show — a value
// changing, data moving, a loop going round again, a branch being taken. That
// is the whole reason they exist: in computing the interesting part is almost
// always the behaviour over time, not the shape.
export function sceneObjects(id, time) {
  const objects = [];
  const step = (period) => Math.floor(time / period);

  if (id === "binary") {
    // Eight bits counting up, with the place value of every set bit lit.
    const value = step(0.9) % 256;
    for (let i = 0; i < 8; i += 1) {
      const bit = (value >> (7 - i)) & 1;
      const x = -3.15 + i * 0.9;
      objects.push(object("cube", [x, 0, 0], [.36, .36, .36], bit ? COLORS.gold : COLORS.navy));
      objects.push(object("cube", [x, -0.95, 0], [.34, .06, .34], COLORS.gray));
      // A column whose height is the place value this bit carries.
      if (bit) {
        const height = (7 - i) * 0.14 + 0.12;
        objects.push(object("cube", [x, 0.55 + height, 0], [.12, height, .12], COLORS.teal));
      }
    }
  } else if (id === "sequence") {
    // A token running along a line of instructions, one at a time.
    const count = 6;
    const active = step(0.75) % count;
    for (let i = 0; i < count; i += 1) {
      const x = -2.9 + i * 1.16;
      objects.push(object("cube", [x, 0, 0], [.48, .3, .3], i === active ? COLORS.gold : COLORS.navy));
      if (i < count - 1) objects.push(object("cube", [x + 0.58, 0, 0], [.1, .05, .05], COLORS.gray));
    }
    const t = (time / 0.75) % count;
    objects.push(object("sphere", [-2.9 + t * 1.16, 0.72, 0], .2, COLORS.orange));
  } else if (id === "loop") {
    // Iteration: the token goes round the same block again and again, and a
    // counter column grows by one each lap.
    const laps = 4;
    const p = (time * 0.32) % 1;
    const [lx, ly] = rectanglePoint(p, 3.4, 2.0);
    for (let i = 0; i < 4; i += 1) {
      const [bx, by] = rectanglePoint(i / 4 + 0.125, 3.4, 2.0);
      objects.push(object("cube", [bx, by, 0], [.44, .26, .26], COLORS.navy));
    }
    objects.push(object("sphere", [lx, ly, 0], .22, COLORS.gold));
    const lap = Math.floor(time * 0.32) % laps + 1;
    for (let i = 0; i < lap; i += 1) objects.push(object("cube", [2.9, -0.9 + i * 0.42, 0], [.2, .16, .2], COLORS.teal));
  } else if (id === "selection") {
    // IF / THEN / ELSE: the condition flips, and the token takes the other arm.
    const cond = step(2.2) % 2 === 0;
    objects.push(object("cube", [0, 1.25, 0], [.55, .38, .3], COLORS.gold, [0, 0, Math.PI / 4]));
    objects.push(object("cube", [-1.9, -0.9, 0], [.62, .34, .3], cond ? COLORS.teal : COLORS.gray));
    objects.push(object("cube", [1.9, -0.9, 0], [.62, .34, .3], cond ? COLORS.gray : COLORS.teal));
    for (let i = 0; i < 6; i += 1) {
      const f = i / 6;
      objects.push(object("sphere", [-0.35 - f * 1.35, 0.72 - f * 1.4, 0], .07, cond ? COLORS.teal : COLORS.navy));
      objects.push(object("sphere", [0.35 + f * 1.35, 0.72 - f * 1.4, 0], .07, cond ? COLORS.navy : COLORS.teal));
    }
    const drop = ((time % 2.2) / 2.2);
    const side = cond ? -1 : 1;
    objects.push(object("sphere", [side * drop * 1.9, 1.25 - drop * 2.15, 0], .2, COLORS.orange));
  } else if (id === "variable") {
    // A variable is one box holding one value: the old value is pushed out as
    // the new one is assigned.
    const phase = (time % 3) / 3;
    objects.push(object("cube", [0, 0, 0], [1.15, .8, .8], COLORS.navy));
    objects.push(object("cube", [0, 0, 0.82], [1.0, .66, .04], COLORS.gray));
    const incoming = Math.max(0, 1 - phase * 3);
    const outgoing = Math.max(0, (phase - 0.55) * 3);
    objects.push(object("sphere", [-2.6 * incoming, 0, 0.4], .3, COLORS.gold));
    if (outgoing > 0) objects.push(object("sphere", [2.6 * outgoing, -0.4 * outgoing, 0.4], .26, COLORS.gray));
  } else if (id === "network") {
    // A star network: a switch in the middle, devices around it, traffic
    // running out and back.
    const spokes = 6;
    objects.push(object("cube", [0, 0, 0], [.7, .28, .5], COLORS.navy));
    for (let i = 0; i < spokes; i += 1) {
      const a = i / spokes * TAU + time * 0.08;
      const x = Math.cos(a) * 2.5, y = Math.sin(a) * 1.7;
      objects.push(object("cube", [x, y, 0], [.42, .3, .1], COLORS.teal));
      const p = ((time * 0.6 + i * 0.17) % 1);
      const dir = i % 2 === 0 ? p : 1 - p;
      objects.push(object("sphere", [x * dir, y * dir, 0], .12, i % 2 === 0 ? COLORS.gold : COLORS.orange));
    }
  } else if (id === "packets") {
    // One file, split into packets that take different routes and are put back
    // in order at the far end.
    objects.push(object("cube", [-3.1, 0, 0], [.4, .62, .3], COLORS.navy));
    objects.push(object("cube", [3.1, 0, 0], [.4, .62, .3], COLORS.navy));
    for (let i = 0; i < 5; i += 1) {
      const p = ((time * 0.35 + i * 0.14) % 1);
      const lane = (i % 3) - 1;
      const bend = Math.sin(p * Math.PI) * lane * 0.85;
      objects.push(object("cube", [-3.1 + p * 6.2, bend, 0], [.22, .16, .16], [COLORS.gold, COLORS.teal, COLORS.orange, COLORS.blue, COLORS.pink][i]));
    }
    for (let lane = -1; lane <= 1; lane += 1) {
      for (let i = 0; i < 9; i += 1) {
        const p = i / 8;
        objects.push(object("sphere", [-3.1 + p * 6.2, Math.sin(p * Math.PI) * lane * 0.85, -0.3], .04, COLORS.gray));
      }
    }
  } else if (id === "clientserver") {
    // Request out, response back — the shape of every web page load.
    objects.push(object("cube", [-2.7, -0.4, 0], [.55, .38, .12], COLORS.teal));
    objects.push(object("cube", [-2.7, -0.95, 0], [.22, .18, .3], COLORS.gray));
    for (let i = 0; i < 3; i += 1) objects.push(object("cube", [2.7, -0.9 + i * 0.62, 0], [.5, .24, .4], COLORS.navy));
    const cycle = (time % 3) / 3;
    if (cycle < 0.5) {
      const p = cycle * 2;
      objects.push(object("sphere", [-2.7 + p * 5.4, 0.9, 0], .18, COLORS.gold));
    } else {
      const p = (cycle - 0.5) * 2;
      objects.push(object("cube", [2.7 - p * 5.4, 0.9, 0], [.2, .14, .14], COLORS.orange));
    }
  } else if (id === "sort") {
    // A sorting algorithm in progress: two bars swap on each tick until the
    // row is in order, then it shuffles and starts again.
    const values = [4, 1, 6, 3, 5, 2, 7];
    const total = values.length;
    const tick = step(0.5) % (total * total);
    const working = values.slice();
    let swaps = 0;
    for (let pass = 0; pass < total && swaps <= tick; pass += 1) {
      for (let i = 0; i < total - 1 - pass && swaps <= tick; i += 1) {
        if (working[i] > working[i + 1]) { const tmp = working[i]; working[i] = working[i + 1]; working[i + 1] = tmp; }
        swaps += 1;
      }
    }
    working.forEach((value, index) => {
      const height = value * 0.22;
      objects.push(object("cube", [-2.7 + index * 0.9, -1.1 + height, 0], [.3, height, .3], value === Math.max(...working) ? COLORS.gold : COLORS.teal));
    });
  } else if (id === "search") {
    // Binary search: the window halves each step and the discarded half greys
    // out, which is the whole point of the algorithm.
    const total = 16;
    const target = 11;
    const stepIndex = step(1.1) % 5;
    let low = 0, high = total - 1;
    for (let i = 0; i < stepIndex; i += 1) {
      const mid = Math.floor((low + high) / 2);
      if (mid < target) low = mid + 1; else if (mid > target) high = mid - 1;
    }
    for (let i = 0; i < total; i += 1) {
      const inWindow = i >= low && i <= high;
      const mid = Math.floor((low + high) / 2);
      objects.push(object("cube", [-3.3 + i * 0.44, 0, 0], [.17, inWindow ? .34 : .12, .17], i === mid ? COLORS.gold : inWindow ? COLORS.teal : COLORS.gray));
    }
    objects.push(object("cone", [-3.3 + target * 0.44, 0.85, 0], [.16, .3, .16], COLORS.orange, [Math.PI, 0, 0]));
  } else if (id === "pixels") {
    // An image is a grid of numbers: the picture builds pixel by pixel.
    const size = 8;
    const revealed = step(0.09) % (size * size + 12);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const dx = x - 3.5, dy = y - 3.5;
      const on = Math.sqrt(dx * dx + dy * dy) < 3.1;
      const shown = index < revealed;
      objects.push(object("cube", [-2.45 + x * 0.7, 2.45 - y * 0.7, 0], [.31, .31, shown && on ? .22 : .05], shown ? (on ? COLORS.blue : COLORS.navy) : COLORS.gray));
    }
  } else if (id === "ledmatrix") {
    // The micro:bit's 5x5 LED display running a light sequence.
    const frame = step(0.42) % 5;
    for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) {
      const lit = Math.abs(x - frame) <= 0 || (y === frame);
      const brightness = lit ? COLORS.red : COLORS.navy;
      objects.push(object("sphere", [-2 + x, 2 - y, 0], lit ? .34 : .22, brightness));
    }
    objects.push(object("cube", [0, 0, -0.55], [2.9, 2.9, .12], COLORS.green));
  } else if (id === "encryption") {
    // A Caesar shift: plaintext letters slide along to become ciphertext.
    const shift = (Math.sin(time * 0.5) * 0.5 + 0.5) * 3;
    for (let i = 0; i < 7; i += 1) {
      objects.push(object("cube", [-2.7 + i * 0.9, 1.1, 0], [.32, .32, .2], COLORS.teal));
      objects.push(object("cube", [-2.7 + i * 0.9 + shift * 0.3, -1.1, 0], [.32, .32, .2], COLORS.gold));
      objects.push(object("cylinder", [-2.7 + i * 0.9 + shift * 0.15, 0, 0], [.04, 1.05, .04], COLORS.gray, [0, 0, Math.atan2(shift * 0.3, -2.2)]));
    }
  } else if (id === "robot") {
    // A robot following a program on a grid: forward, forward, turn, repeat.
    for (let x = -3; x <= 3; x += 1) for (let y = -2; y <= 2; y += 1) {
      objects.push(object("cube", [x, y, -0.4], [.44, .44, .04], (x + y) % 2 === 0 ? COLORS.navy : COLORS.gray));
    }
    const path = [[-3, -2], [-2, -2], [-1, -2], [-1, -1], [-1, 0], [0, 0], [1, 0], [1, 1], [2, 1], [3, 1]];
    const p = (time * 0.7) % path.length;
    const index = Math.floor(p);
    const frac = p - index;
    const from = path[index];
    const to = path[(index + 1) % path.length];
    const x = from[0] + (to[0] - from[0]) * frac;
    const y = from[1] + (to[1] - from[1]) * frac;
    for (let i = 0; i <= index; i += 1) objects.push(object("sphere", [path[i][0], path[i][1], -0.2], .09, COLORS.teal));
    objects.push(object("cube", [x, y, 0], [.3, .3, .26], COLORS.orange));
    objects.push(object("cone", [x + (to[0] - from[0]) * 0.42, y + (to[1] - from[1]) * 0.42, 0], [.14, .22, .14], COLORS.gold, [0, 0, Math.atan2(to[0] - from[0], to[1] - from[1]) * -1]));
  } else if (id === "database") {
    // Records and fields: a query lights the rows that match a condition.
    const rows = 5, cols = 4;
    const matching = step(1.6) % rows;
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
      const hit = r === matching;
      objects.push(object("cube", [-2.4 + c * 1.6, 1.7 - r * 0.82, 0], [.72, .3, hit ? .3 : .1], r === 0 ? COLORS.navy : hit ? COLORS.gold : COLORS.teal));
    }
  } else if (id === "spreadsheet") {
    // A formula recalculating: the total column tracks the cells above it.
    const values = [2, 4, 3, 5].map((base, i) => base + Math.sin(time * 0.9 + i) * 1.6 + 2);
    values.forEach((value, i) => {
      const height = value * 0.2;
      objects.push(object("cube", [-2.6 + i * 1.1, -1.2 + height, 0], [.34, height, .34], COLORS.teal));
    });
    const total = values.reduce((sum, value) => sum + value, 0) * 0.05;
    objects.push(object("cube", [2.6, -1.2 + total, 0], [.4, total, .4], COLORS.gold));
  } else if (id === "abstraction") {
    // Decomposition: one big block breaks into parts, then reassembles.
    const phase = (Math.sin(time * 0.7) * 0.5 + 0.5);
    const parts = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    parts.forEach(([px, py], i) => {
      objects.push(object("cube", [px * phase * 1.7, py * phase * 1.2, 0], [.62, .5, .5], [COLORS.gold, COLORS.teal, COLORS.orange, COLORS.blue][i]));
    });
  } else if (id === "blocks") {
    // ScratchJr: blocks snap together into a program; when it runs, the
    // character obeys — and the Say block shows its message at the end.
    const cycle = time % 7;
    const palette = [COLORS.gold, COLORS.blue, COLORS.teal, COLORS.pink];
    const slotY = (i) => 1.7 - i * 0.62;
    const runStep = (cycle - 2.4) / 1.05;
    for (let i = 0; i < 4; i += 1) {
      const drop = Math.min(1, Math.max(0, (cycle - i * 0.55) / 0.45));
      const y = 3.2 - (3.2 - slotY(i)) * drop;
      const running = cycle > 2.4 && Math.floor(runStep) === i;
      objects.push(object("cube", [-2.5, y, 0], [.62, .24, .2], running ? COLORS.orange : palette[i]));
      objects.push(object("cube", [-2.5, y - 0.3, 0], [.14, .07, .18], COLORS.gray));
    }
    const steps = Math.max(0, Math.min(4, runStep));
    const cx = -0.3 + steps * 0.62;
    objects.push(object("cube", [cx, -0.7, 0], [.3, .38, .24], COLORS.teal));
    objects.push(object("sphere", [cx, -0.05, 0], .26, COLORS.gold));
    objects.push(object("cube", [0.95, -1.25, 0], [2.2, .06, .5], COLORS.gray));
    if (runStep > 3) objects.push(object("cube", [cx + 0.2, 0.75, 0], [.5, .3, .06], COLORS.pink));
  } else if (id === "precise") {
    // The same instructions followed exactly and followed sloppily: each sloppy
    // step drifts a little, the drift compounds, and only the precise robot
    // arrives at the goal.
    const steps = Math.min(1, (time % 4) / 2.8) * 6;
    for (let i = 0; i < 7; i += 1) objects.push(object("cube", [-2.7 + i * 0.9, -1.5, 0], [.4, .04, .4], COLORS.gray));
    objects.push(object("cone", [2.7, 1.15, 0], [.22, .32, .22], COLORS.gold, [Math.PI, 0, 0]));
    objects.push(object("cube", [-2.7 + steps * 0.9, 0.6, 0], [.26, .26, .26], COLORS.teal));
    let dx = 0, dy = 0;
    for (let i = 0; i < Math.floor(steps); i += 1) { dx += Math.sin(i * 3.7) * 0.14; dy += Math.cos(i * 2.9) * 0.2; }
    objects.push(object("cube", [-2.7 + steps * 0.9 + dx, -0.6 + dy, 0], [.26, .26, .26], COLORS.orange));
  } else if (id === "bugdebug") {
    // A bug is the step that is wrong. Run 1 goes off the path at it; the fix
    // swaps the step; run 2 goes straight through to the goal.
    const cycle = time % 9;
    const wrong = 3;
    const fixed = cycle > 5.2;
    for (let i = 0; i < 6; i += 1) {
      const swapping = i === wrong && cycle > 4 && cycle < 5.2;
      const lift = swapping ? Math.sin((cycle - 4) / 1.2 * Math.PI) * 1.1 : 0;
      objects.push(object("cube", [-2.9 + i * 1.16, lift, 0], [.48, .3, .3], i !== wrong ? COLORS.navy : fixed ? COLORS.green : COLORS.red));
    }
    objects.push(object("cone", [3.45, 0.95, 0], [.2, .3, .2], COLORS.gold, [Math.PI, 0, 0]));
    const runTime = cycle < 4 ? cycle : fixed ? cycle - 5.2 : -1;
    if (runTime >= 0) {
      const along = Math.min(runTime / 3.2, 1) * 5.4;
      let y = 0.72;
      if (!fixed && along > wrong) y = 0.72 - (along - wrong) * 0.85;
      objects.push(object("sphere", [-2.9 + Math.min(along, 5.4) * 1.16, y, 0], .2, fixed ? COLORS.teal : COLORS.orange));
    }
  } else if (id === "grouping") {
    // Collected data being put into groups: each piece flies to the set where
    // it belongs, one at a time.
    const bins = [[-2.2, COLORS.teal], [0, COLORS.gold], [2.2, COLORS.orange]];
    for (const [x, color] of bins) {
      objects.push(object("cube", [x, -1.55, 0], [.85, .07, .5], color));
      objects.push(object("cube", [x - 0.8, -1.25, 0], [.07, .32, .5], color));
      objects.push(object("cube", [x + 0.8, -1.25, 0], [.07, .32, .5], color));
    }
    const total = 9;
    const done = Math.floor(time / 0.8) % (total + 3);
    for (let i = 0; i < total; i += 1) {
      const [bx, color] = bins[i % 3];
      const home = [bx - 0.4 + Math.floor(i / 3) * 0.4, -1.2, 0];
      const start = [Math.sin(i * 4.1) * 2.6, 1.55 + Math.cos(i * 2.3) * 0.45, 0];
      if (i < done) objects.push(object("sphere", home, .17, color));
      else if (i === done) {
        const p = (time / 0.8) % 1;
        objects.push(object("sphere", [start[0] + (home[0] - start[0]) * p, start[1] + (home[1] - start[1]) * p, 0], .17, color));
      } else objects.push(object("sphere", start, .17, color));
    }
  } else if (id === "tally") {
    // One mark for each thing counted as it walks past — and the fifth mark
    // crosses the four, so the groups can be read at a glance.
    const counted = Math.floor(time / 0.7) % 14;
    const p = (time / 0.7) % 1;
    objects.push(object("sphere", [-3.4 + p * 6.8, -1.6, 0], .22, COLORS.teal));
    objects.push(object("cube", [0, -0.6, 0], [3.4, .04, .3], COLORS.gray));
    for (let i = 0; i < counted; i += 1) {
      const gx = -2.4 + Math.floor(i / 5) * 1.9;
      if (i % 5 < 4) objects.push(object("cube", [gx + (i % 5) * 0.34, 0.4, 0], [.06, .5, .1], COLORS.navy));
      else objects.push(object("cube", [gx + 0.51, 0.4, 0], [.06, .72, .1], COLORS.orange, [0, 0, Math.PI / 3.2]));
    }
  } else if (id === "pictogram") {
    // A pictogram: one little picture per thing counted, drawn in rows so a
    // longer row means a bigger count.
    const counts = [4, 2, 5];
    const rowColor = [COLORS.gold, COLORS.teal, COLORS.orange];
    const shown = Math.floor(time / 0.55) % 15;
    objects.push(object("cube", [-2.35, 0.1, 0], [.04, 2.1, .1], COLORS.gray));
    let seen = 0;
    counts.forEach((count, row) => {
      objects.push(object("cube", [-2.9, 1.2 - row * 1.1, 0], [.32, .32, .32], rowColor[row]));
      for (let i = 0; i < count; i += 1) {
        if (seen < shown) objects.push(object("sphere", [-1.85 + i * 0.8, 1.2 - row * 1.1, 0], .3, rowColor[row]));
        seen += 1;
      }
    });
  } else if (id === "bargraph") {
    // Counting builds the bars: each thing counted makes its bar one step
    // taller, until the whole collection can be read at a glance.
    const counts = [5, 3, 6, 4];
    const palette = [COLORS.teal, COLORS.gold, COLORS.orange, COLORS.blue];
    const done = Math.floor(time / 0.5) % (counts.reduce((a, b) => a + b, 0) + 4);
    let seen = 0;
    counts.forEach((count, col) => {
      const x = -2.2 + col * 1.5;
      let height = 0;
      for (let i = 0; i < count; i += 1) { if (seen < done) height += 1; seen += 1; }
      objects.push(object("cube", [x, -1.45, 0], [.5, .05, .5], COLORS.gray));
      if (height) objects.push(object("cube", [x, -1.4 + height * 0.21, 0], [.4, height * 0.21, .4], palette[col]));
    });
  } else if (id === "storage") {
    // Store the file so it is kept; then a second copy travels to another
    // drive — the backup that is safe if the first is lost.
    const cycle = time % 6;
    objects.push(object("cube", [0, -0.2, 0], [.8, .55, .5], COLORS.navy));
    objects.push(object("cube", [2.7, -0.2, 0], [.8, .55, .5], COLORS.teal));
    objects.push(object("cube", [0, -1.05, 0], [1.0, .08, .6], COLORS.gray));
    objects.push(object("cube", [2.7, -1.05, 0], [1.0, .08, .6], COLORS.gray));
    const arrive = Math.min(1, cycle / 2);
    objects.push(object("cube", [-3 + arrive * 3, 0.9 - arrive * 0.7, 0], [.3, .38, .08], COLORS.gold));
    if (cycle > 2) objects.push(object("sphere", [0, 0.28, 0.3], .09, COLORS.green));
    if (cycle > 2.6) {
      const copy = Math.min(1, (cycle - 2.6) / 2);
      objects.push(object("cube", [copy * 2.7, 0.75, 0], [.26, .32, .07], COLORS.gold));
      if (copy >= 1) objects.push(object("sphere", [2.7, 0.28, 0.3], .09, COLORS.green));
    }
  } else if (id === "barcode") {
    // The stripes hold a number: the scanner sweeps across and the digits
    // appear as it reads them.
    const widths = [.06, .14, .06, .2, .07, .06, .16, .07, .11, .06, .18, .09];
    const stripes = [];
    let sx = -2.2;
    for (const w of widths) { stripes.push([sx + w / 2, w]); sx += w + 0.14; }
    const right = sx - 0.14;
    objects.push(object("cube", [(-2.2 + right) / 2, 0.7, -0.12], [(right + 2.5) / 2, .68, .02], COLORS.gray));
    for (const [px, w] of stripes) objects.push(object("cube", [px, 0.7, 0], [w / 2, .55, .06], COLORS.navy));
    const scan = -2.5 + ((time * 1.6) % (right + 3.2));
    objects.push(object("cube", [scan, 0.7, 0.2], [.03, .8, .03], COLORS.red));
    stripes.forEach(([px], i) => {
      if (px < scan) objects.push(object("cube", [-2 + i * 0.38, -0.9, 0], [.1, .18, .1], COLORS.gold));
    });
  } else if (id === "devices") {
    // Four digital devices. The portable ones can be picked up and carried
    // about; the desktop stays where it is.
    const bob = (k) => Math.sin(time * 1.3 + k) * 0.12;
    objects.push(object("cube", [-2.9, -0.35, 0], [.3, .8, .5], COLORS.navy));
    objects.push(object("cube", [-1.9, -0.2, 0], [.55, .45, .07], COLORS.navy));
    objects.push(object("cube", [-1.9, -0.85, 0], [.28, .18, .2], COLORS.gray));
    objects.push(object("cube", [-0.3, 0.15 + bob(0), 0], [.55, .38, .06], COLORS.teal, [-0.35, 0, 0]));
    objects.push(object("cube", [-0.3, -0.25 + bob(0), 0.3], [.55, .05, .35], COLORS.teal));
    objects.push(object("cube", [1.3, 0.05 + bob(2), 0], [.42, .58, .05], COLORS.gold));
    objects.push(object("cube", [2.7, -bob(4) * 0.5, 0], [.24, .46, .05], COLORS.orange));
    objects.push(object("cube", [0, -1.35, 0], [3.4, .06, .8], COLORS.gray));
  } else if (id === "hardwaresoftware") {
    // Hardware is the parts you can touch — the tower, the screen, the
    // keyboard. Software is the stream of instructions flowing through them.
    objects.push(object("cube", [-2.2, -0.4, 0], [.55, .95, .6], COLORS.navy));
    objects.push(object("cube", [0.6, 0.45, 0], [.95, .68, .08], COLORS.navy));
    objects.push(object("cube", [0.6, -0.95, 0.3], [.85, .07, .45], COLORS.gray));
    for (let i = 0; i < 6; i += 1) {
      const p = (time * 0.5 + i / 6) % 1;
      const pos = p < 0.5
        ? [0.6 - p * 2 * 2.8, -0.95 + p * 2 * 0.55, 0.3 - p * 2 * 0.3]
        : [-2.2 + (p - 0.5) * 2 * 2.8, -0.4 + (p - 0.5) * 2 * 0.85, 0];
      objects.push(object("sphere", pos, .11, COLORS.gold));
    }
  } else if (id === "wiredwireless") {
    // Two ways to connect: along a cable, or through the air by radio waves —
    // the wireless data hops across with no cable at all.
    objects.push(object("cube", [-3.0, -0.7, 0], [.4, .3, .3], COLORS.teal));
    objects.push(object("cube", [-0.7, -0.7, 0], [.4, .3, .3], COLORS.teal));
    objects.push(object("cylinder", [-1.85, -0.7, 0], [.05, 0.95, .05], COLORS.gray, [0, 0, Math.PI / 2]));
    const wp = (time * 0.7) % 1;
    objects.push(object("sphere", [-3.0 + wp * 2.3, -0.55, 0], .12, COLORS.gold));
    objects.push(object("cube", [0.8, -0.7, 0], [.4, .3, .3], COLORS.orange));
    objects.push(object("cube", [3.1, -0.7, 0], [.4, .3, .3], COLORS.orange));
    const ap = (time * 0.7 + 0.4) % 1;
    objects.push(object("sphere", [0.8 + ap * 2.3, -0.7 + Math.sin(ap * Math.PI) * 1.25, 0], .12, COLORS.gold));
    for (let r = 0; r < 3; r += 1) {
      const rp = (time * 0.5 + r / 3) % 1;
      objects.push(object("sphere", [0.9 + rp * 0.55, -0.45 + rp * 0.45, 0], .05 + rp * 0.05, COLORS.gray));
    }
  } else if (id === "online") {
    // Connected, then not: the link to the internet forms and data flows, then
    // the link breaks and the icon shows the crossed-out "not available".
    const connected = Math.floor(time / 3.5) % 2 === 0;
    objects.push(object("cube", [-2.6, -0.4, 0], [.55, .4, .12], COLORS.navy));
    objects.push(object("cube", [-2.6, -0.95, 0], [.22, .16, .3], COLORS.gray));
    objects.push(object("sphere", [2.5, 0.25, 0], .72, COLORS.blue));
    if (connected) {
      for (let i = 0; i < 7; i += 1) objects.push(object("sphere", [-1.95 + i * 0.55, -0.3 + i * 0.08, 0], .06, COLORS.gray));
      const p = (time * 0.8) % 1;
      objects.push(object("sphere", [-1.95 + p * 3.85, -0.3 + p * 0.55, 0], .14, COLORS.gold));
      objects.push(object("sphere", [-2.6, 0.35, 0], .11, COLORS.green));
    } else {
      objects.push(object("cube", [-2.6, 0.38, 0], [.3, .05, .05], COLORS.red, [0, 0, Math.PI / 4]));
      objects.push(object("cube", [-2.6, 0.38, 0], [.3, .05, .05], COLORS.red, [0, 0, -Math.PI / 4]));
    }
  } else if (id === "marker") {
    // Marker down draws a line as it moves; marker up lifts, moves without
    // drawing, and comes back down — which is why the trail has a gap.
    const path = [[-2.6, -1], [-0.6, -1], [-0.6, 0.6], [1.4, 0.6], [1.4, -1], [3.0, -1]];
    const upLeg = 2;
    const cycle = (time * 0.45) % (path.length - 1);
    const leg = Math.floor(cycle), frac = cycle - leg;
    const [x1, y1] = path[leg], [x2, y2] = path[Math.min(leg + 1, path.length - 1)];
    const penUp = leg === upLeg;
    objects.push(object("cone", [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac + (penUp ? 1.1 : 0.55), 0], [.2, .5, .2], penUp ? COLORS.gray : COLORS.orange, [Math.PI, 0, 0]));
    objects.push(object("cube", [0.2, -1.45, 0], [3.2, .04, .9], COLORS.gray));
    for (let l = 0; l < path.length - 1; l += 1) {
      if (l === upLeg || l > leg) continue;
      const [ax, ay] = path[l], [bx, by] = path[l + 1];
      const end = l === leg ? frac : 1;
      const dots = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) * end / 0.2));
      for (let d = 0; d <= dots; d += 1) {
        const q = (d / dots) * end;
        objects.push(object("sphere", [ax + (bx - ax) * q, ay + (by - ay) * q, 0], .07, COLORS.teal));
      }
    }
  } else if (id === "questions") {
    // Two kinds of question: one with a single right answer, and a statistical
    // one where everybody answers differently — so you collect the answers.
    objects.push(object("cube", [-1.9, 1.35, 0], [.42, .42, .2], COLORS.navy, [0, 0, Math.PI / 4]));
    objects.push(object("cube", [1.7, 1.35, 0], [.42, .42, .2], COLORS.gold, [0, 0, Math.PI / 4]));
    const drop = Math.min(1, (time % 3) / 1.2);
    objects.push(object("sphere", [-1.9, 1.0 - drop * 1.9, 0], .24, COLORS.teal));
    const palette = [COLORS.teal, COLORS.orange, COLORS.blue, COLORS.pink];
    const counts = [2, 4, 1, 3];
    const shown = Math.floor(time / 0.6) % 12;
    let seen = 0;
    counts.forEach((count, col) => {
      objects.push(object("cube", [0.75 + col * 0.62, -1.35, 0], [.24, .04, .24], COLORS.gray));
      for (let i = 0; i < count; i += 1) {
        if (seen < shown) objects.push(object("sphere", [0.75 + col * 0.62, -1.15 + i * 0.36, 0], .16, palette[col]));
        seen += 1;
      }
    });
  } else if (id === "datatypes") {
    // Numerical data is numbers you can measure — the columns; categorical
    // data is named groups — the coloured sets.
    const heights = [3, 5, 2, 4];
    heights.forEach((h, i) => {
      const grow = Math.min(1, Math.max(0, time % 5 - i * 0.5));
      const height = h * 0.18 * grow + 0.03;
      objects.push(object("cube", [-3 + i * 0.55, -1.35 + height, 0], [.18, height, .18], COLORS.teal));
    });
    const groups = [[0.9, COLORS.gold], [1.9, COLORS.orange], [2.9, COLORS.pink]];
    groups.forEach(([x, color], g) => {
      for (let i = 0; i < 3; i += 1) {
        objects.push(object("sphere", [x + Math.sin(i * 2.6 + g) * 0.22, -0.7 + Math.cos(i * 2.1 + g) * 0.32, 0], .17, color));
      }
    });
    objects.push(object("cube", [0, -1.5, 0], [3.4, .05, .6], COLORS.gray));
  } else if (id === "malware") {
    // Malware is a program that sneaks in, copies itself, and crowds out the
    // device's real work — watch the flow thin as the copies spread.
    const cycle = time % 8;
    objects.push(object("cube", [0, -0.2, 0], [1.6, 1.1, .5], COLORS.navy));
    const infected = Math.min(1, Math.max(0, (cycle - 2) / 3.5));
    const flow = 5 - Math.floor(infected * 5);
    for (let i = 0; i < flow; i += 1) {
      const p = (time * 0.6 + i / 5) % 1;
      objects.push(object("sphere", [-2.8 + p * 5.6, 1.35, 0], .12, COLORS.teal));
    }
    const arrive = Math.min(1, cycle / 2);
    if (cycle < 2) objects.push(object("cube", [-2.8 + arrive * 2.6, 1.9 - arrive * 1.7, 0], [.2, .2, .2], COLORS.red));
    const copies = Math.min(8, Math.floor(Math.max(0, cycle - 2) * 2.2));
    for (let i = 0; i < copies; i += 1) {
      objects.push(object("cube", [-1.05 + (i % 4) * 0.7, -0.45 + Math.floor(i / 4) * 0.55, 0.35], [.2, .2, .2], COLORS.red));
    }
  } else if (id === "predict") {
    // Predicting: the ghost traces what you SAY the program will do, then the
    // real run follows — and you see whether the guess was right.
    const path = [[-2.6, -1.2], [-1.3, -1.2], [-1.3, 0], [0, 0], [1.3, 0], [1.3, 1.1], [2.6, 1.1]];
    for (const [x, y] of path) objects.push(object("cube", [x, y, -0.3], [.5, .5, .05], COLORS.navy));
    const walk = (t) => {
      const c = Math.max(0, Math.min(path.length - 1.001, t));
      const leg = Math.floor(c), frac = c - leg;
      const [x1, y1] = path[leg], [x2, y2] = path[leg + 1];
      return [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac];
    };
    const cycle = time % 6;
    const [gx, gy] = walk(cycle * 2.2);
    objects.push(object("sphere", [gx, gy, 0], .16, COLORS.gray));
    if (cycle > 2.2) {
      const [rx, ry] = walk((cycle - 2.2) * 2.2);
      objects.push(object("cube", [rx, ry, 0.1], [.24, .24, .24], COLORS.orange));
    }
  } else if (id === "realfictional") {
    // A real robot is a machine doing a job — the arm moving its load between
    // stands. A fictional robot lives in stories: it floats with nothing
    // holding it up, which no real robot can do.
    const angle = Math.sin(time * 0.9) * 0.7;
    const dir = [-Math.sin(angle), Math.cos(angle)];
    objects.push(object("cylinder", [-2.1, -1.15, 0], [.3, .22, .3], COLORS.gray));
    objects.push(object("cylinder", [-2.1 + dir[0] * 0.75, -0.95 + dir[1] * 0.75, 0], [.09, .75, .09], COLORS.navy, [0, 0, angle]));
    objects.push(object("cube", [-2.1 + dir[0] * 1.5, -0.95 + dir[1] * 1.5, 0], [.18, .18, .18], COLORS.teal));
    objects.push(object("cube", [-3.0, -1.3, 0], [.32, .1, .32], COLORS.gray));
    objects.push(object("cube", [-1.2, -1.3, 0], [.32, .1, .32], COLORS.gray));
    objects.push(object("cube", [-2.1, -1.45, 0], [1.3, .05, .6], COLORS.gray));
    const hover = Math.sin(time * 1.1) * 0.35;
    objects.push(object("cube", [1.9, 0.1 + hover, 0], [.4, .5, .3], COLORS.pink));
    objects.push(object("sphere", [1.9, 0.95 + hover, 0], .28, COLORS.gold));
    for (let i = 0; i < 4; i += 1) {
      const a = time * 1.4 + i / 4 * TAU;
      objects.push(object("sphere", [1.9 + Math.cos(a) * 0.95, 0.4 + hover + Math.sin(a) * 0.6, 0.3], .07, COLORS.gold));
    }
  } else if (id === "speed") {
    // The same steps at two speeds: speed is how fast the steps run, not
    // what the steps are.
    for (const [y, rate, color] of [[0.9, 1.6, COLORS.teal], [-0.9, 0.55, COLORS.orange]]) {
      for (let i = 0; i < 7; i += 1) objects.push(object("cube", [-2.7 + i * 0.9, y - 0.55, 0], [.36, .05, .36], COLORS.gray));
      objects.push(object("sphere", [-2.7 + ((time * rate) % 6) * 0.9, y, 0], .22, color));
    }
  } else if (id === "sound") {
    // A speaker turns data into sound: waves ripple out through the air, and
    // louder means bigger waves — watch the volume bars follow.
    const loud = 0.55 + 0.45 * Math.sin(time * 0.7);
    objects.push(object("cube", [-2.3, 0, 0], [.5, .8, .4], COLORS.navy));
    objects.push(object("cone", [-1.65, 0, 0], [.34, .3, .34], COLORS.gray, [0, 0, -Math.PI / 2]));
    for (let r = 0; r < 4; r += 1) {
      const p = (time * 0.55 + r / 4) % 1;
      const radius = 0.5 + p * 2.6;
      for (let a = -2; a <= 2; a += 1) {
        objects.push(object("sphere", [-1.4 + Math.cos(a * 0.32) * radius, Math.sin(a * 0.32) * radius * loud, 0], .07 + loud * 0.05, COLORS.gold));
      }
    }
    for (let i = 0; i < Math.max(1, Math.round(loud * 5)); i += 1) objects.push(object("cube", [2.6, -1 + i * 0.42, 0], [.3, .14, .3], COLORS.teal));
  } else if (id === "music") {
    // A melody is notes at different pitches; the beat is the steady pulse
    // underneath; the tempo is how fast that pulse goes — it changes halfway.
    const pitches = [0, 2, 4, 2, 5, 4, 2, 0];
    const tempo = Math.floor(time / 8) % 2 === 0 ? 0.55 : 0.32;
    const playing = Math.floor(time / tempo) % pitches.length;
    pitches.forEach((pitch, i) => {
      objects.push(object("sphere", [-2.8 + i * 0.8, -0.6 + pitch * 0.38, 0], i === playing ? .3 : .2, i === playing ? COLORS.gold : COLORS.teal));
    });
    const pulse = Math.abs(Math.sin(time / tempo * Math.PI));
    objects.push(object("cube", [-2.8 + playing * 0.8, -1.5 + pulse * 0.2, 0], [.24, .12, .24], COLORS.orange));
    objects.push(object("cube", [0, -1.75, 0], [3.3, .04, .4], COLORS.gray));
  } else if (id === "printer") {
    // Output on paper: each page slides out with its printing on it, and the
    // finished pages stack up.
    objects.push(object("cube", [-1.6, 0.35, 0], [1.0, .55, .8], COLORS.navy));
    objects.push(object("cube", [-1.6, -0.05, 0.75], [.8, .05, .1], COLORS.gray));
    const p = (time * 0.5) % 1;
    objects.push(object("cube", [-1.6 + p * 2.2, -0.15 - p * 0.35, 0.8], [.55, .02, .75], COLORS.gray));
    for (let l = 0; l < Math.floor(p * 5); l += 1) {
      objects.push(object("cube", [-1.85 + p * 2.2, -0.1 - p * 0.35, 0.55 + l * 0.28], [.3, .02, .05], COLORS.teal));
    }
    const done = Math.floor(time * 0.5) % 4;
    for (let i = 0; i < done; i += 1) objects.push(object("cube", [1.7, -1.15 + i * 0.09, 0], [.55, .03, .75], COLORS.gray));
  } else if (id === "frames") {
    // Animation: each frame is a still picture a little different from the
    // last; play them quickly and the eye sees movement.
    for (let f = 0; f < 4; f += 1) {
      objects.push(object("cube", [-3.0 + f * 1.05, 1.2, -0.1], [.44, .44, .04], COLORS.navy));
      objects.push(object("sphere", [-3.0 + f * 1.05, 0.95 + f * 0.2, 0], .12, COLORS.gold));
    }
    objects.push(object("cube", [1.9, -0.6, -0.1], [1.2, 1.05, .05], COLORS.navy));
    const p = (time * 1.6) % 4;
    const seq = Math.floor(p), frac = p - seq;
    const heights = [0, 0.2, 0.4, 0.6];
    const h = heights[seq] + (heights[(seq + 1) % 4] - heights[seq]) * frac;
    objects.push(object("sphere", [1.9, -0.9 + h * 1.6, 0], .26, COLORS.gold));
  } else if (id === "shapes") {
    // Drawing a shape is a program: forward along each side, turn at each
    // corner, four times round.
    const corners = [[-1.6, -1], [1.6, -1], [1.6, 0.9], [-1.6, 0.9]];
    const cycle = (time * 0.5) % 5;
    const side = Math.min(3, Math.floor(cycle));
    const frac = Math.min(1, cycle - side);
    for (let s = 0; s <= side; s += 1) {
      const [ax, ay] = corners[s], [bx, by] = corners[(s + 1) % 4];
      const end = s === side ? frac : 1;
      const dots = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) * end / 0.24));
      for (let d = 0; d <= dots; d += 1) {
        const q = (d / dots) * end;
        objects.push(object("sphere", [ax + (bx - ax) * q, ay + (by - ay) * q, 0], .08, COLORS.teal));
      }
    }
    const [cx1, cy1] = corners[side], [cx2, cy2] = corners[(side + 1) % 4];
    objects.push(object("cone", [cx1 + (cx2 - cx1) * frac, cy1 + (cy2 - cy1) * frac + 0.5, 0], [.18, .42, .18], COLORS.orange, [Math.PI, 0, 0]));
  } else if (id === "looks") {
    // The backdrop is the scene behind; a costume is the sprite's look.
    // Either can change while the sprite keeps moving — the program is the
    // same, only the looks swap.
    const backdrop = Math.floor(time / 3) % 2;
    const costume = Math.floor((time + 1.5) / 3) % 2;
    objects.push(object("cube", [0, 0.3, -0.6], [2.9, 1.7, .05], backdrop === 0 ? COLORS.blue : COLORS.green));
    const sx = Math.sin(time * 0.8) * 1.6;
    objects.push(object("cube", [sx, -0.75, 0], [.32, .4, .26], costume === 0 ? COLORS.gold : COLORS.pink));
    objects.push(object("sphere", [sx, -0.1, 0], .27, costume === 0 ? COLORS.orange : COLORS.teal));
    objects.push(object("cube", [0, -1.35, 0], [3.0, .06, .6], COLORS.gray));
  } else if (id === "manualautomatic") {
    // Manual input needs a person for every piece — one press, one value.
    // Automatic input streams in from a sensor by itself.
    const press = (time % 2) < 0.3;
    objects.push(object("cone", [-2.1, 1.25 - (press ? 0.25 : 0), 0], [.14, .35, .14], COLORS.gold, [Math.PI, 0, 0]));
    objects.push(object("cylinder", [-2.1, 0.55, 0], [.3, .1, .3], press ? COLORS.orange : COLORS.gray));
    objects.push(object("cube", [-2.1, -1.3, 0], [.55, .35, .45], COLORS.navy));
    const mp = (time % 2) / 2;
    if (mp < 0.85) objects.push(object("sphere", [-2.1, 0.3 - mp * 1.5, 0], .12, COLORS.teal));
    objects.push(object("cube", [2.2, 0.9, 0], [.45, .3, .3], COLORS.teal));
    for (let i = 0; i < 4; i += 1) {
      const p = (time * 0.8 + i / 4) % 1;
      objects.push(object("sphere", [2.2, 0.6 - p * 1.7, 0], .11, COLORS.gold));
    }
    objects.push(object("cube", [2.2, -1.3, 0], [.55, .35, .45], COLORS.navy));
  } else if (id === "sensors") {
    // A sensor measures the real world and turns it into readings a computer
    // can use — and the log keeps one reading after another, so you can see
    // how the measurement changed.
    const heat = 0.5 + 0.5 * Math.sin(time * 0.6);
    objects.push(object("sphere", [-2.8, 0.9, 0], .4 + heat * 0.25, COLORS.gold));
    objects.push(object("cube", [-0.9, 0, 0], [.5, .38, .35], COLORS.teal));
    const p = (time * 0.9) % 1;
    objects.push(object("sphere", [-2.3 + p * 1.4, 0.75 - p * 0.6, 0], .1, COLORS.orange));
    for (let i = 0; i < 8; i += 1) {
      const h = 0.25 + (0.5 + 0.5 * Math.sin((time - (7 - i) * 0.7) * 0.6)) * 0.85;
      objects.push(object("cube", [0.4 + i * 0.42, -1.3 + h / 2, 0], [.15, h / 2, .15], COLORS.navy));
    }
    objects.push(object("cube", [1.85, -1.4, 0], [1.9, .04, .4], COLORS.gray));
  } else if (id === "piechart") {
    // A pie chart: the whole circle is everything counted, and each colour's
    // share of the circle is its share of the whole.
    const shares = [[6, COLORS.teal], [4, COLORS.gold], [2, COLORS.orange]];
    const shown = Math.floor(time / 0.5) % 15;
    objects.push(object("cylinder", [0, 0, -0.2], [1.15, .06, 1.15], COLORS.navy, [Math.PI / 2, 0, 0]));
    let index = 0;
    for (const [count, color] of shares) {
      for (let i = 0; i < count; i += 1) {
        if (index < shown) {
          const a = index / 12 * TAU;
          objects.push(object("sphere", [Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0], .22, color));
        }
        index += 1;
      }
    }
  } else if (id === "events") {
    // An event starts a program: nothing runs until the button is pressed,
    // then the steps fire and the sprite reacts.
    const cycle = time % 4;
    const press = cycle < 0.35;
    objects.push(object("cone", [-2.4, 1.25 - (press ? 0.3 : 0), 0], [.16, .4, .16], COLORS.gold, [Math.PI, 0, 0]));
    objects.push(object("cylinder", [-2.4, 0.55, 0], [.4, .12, .4], press ? COLORS.orange : COLORS.red));
    const run = cycle >= 0.35 && cycle < 2.6 ? (cycle - 0.35) / 0.75 : -1;
    for (let i = 0; i < 3; i += 1) {
      objects.push(object("cube", [-0.9 + i * 1.0, 0.55, 0], [.4, .26, .24], run >= 0 && Math.floor(run) === i ? COLORS.gold : COLORS.navy));
    }
    const hop = run >= 0 ? Math.abs(Math.sin(run * Math.PI)) * 0.5 : 0;
    objects.push(object("cube", [1.9, -1.0 + hop, 0], [.3, .36, .24], COLORS.teal));
    objects.push(object("sphere", [1.9, -0.4 + hop, 0], .25, COLORS.gold));
    objects.push(object("cube", [0.3, -1.45, 0], [2.9, .05, .5], COLORS.gray));
  } else if (id === "gridcells") {
    // A spreadsheet is a grid: a row runs across, a column runs down, one
    // cell is active at a time, and a range is a block of cells together.
    const phase = Math.floor(time / 3) % 4;
    for (let r = 0; r < 4; r += 1) for (let c = 0; c < 5; c += 1) {
      let color = (r === 0 || c === 0) ? COLORS.navy : COLORS.gray;
      let depth = 0.04;
      if (phase === 0 && r === 2 && c > 0) { color = COLORS.gold; depth = 0.16; }
      if (phase === 1 && c === 3 && r > 0) { color = COLORS.teal; depth = 0.16; }
      if (phase === 2 && r === 2 && c === 3) { color = COLORS.orange; depth = 0.16 + Math.abs(Math.sin(time * 2)) * 0.12; }
      if (phase === 3 && r >= 1 && r <= 2 && c >= 2 && c <= 4) { color = COLORS.blue; depth = 0.16; }
      objects.push(object("cube", [-2.2 + c * 1.1, 1.1 - r * 0.75, 0], [.5, .33, depth], color));
    }
  } else if (id === "randompick") {
    // Random means the computer picks and you cannot know which before it
    // lands — a different box each round, decided by nothing you can see.
    const round = Math.floor(time / 2.5);
    const pick = Math.floor(Math.abs(Math.sin(round * 12.9898) * 43758.5453) % 4);
    const palette = [COLORS.teal, COLORS.gold, COLORS.orange, COLORS.blue];
    for (let i = 0; i < 4; i += 1) objects.push(object("cube", [-2.4 + i * 1.6, -0.9, 0], [.5, .4, .4], palette[i]));
    const p = (time % 2.5) / 2.5;
    const at = p < 0.7 ? Math.floor(p / 0.7 * 6) % 4 : pick;
    const hop = p < 0.7 ? Math.abs(Math.sin(p / 0.7 * 6 * Math.PI)) * 0.6 : 0;
    objects.push(object("sphere", [-2.4 + at * 1.6, -0.25 + hop, 0], .24, COLORS.pink));
  } else if (id === "comment") {
    // A comment is a note for people: the program runs straight past it, and
    // the computer never reads it — watch it stay grey while the blocks light.
    const active = step(0.75) % 5;
    for (let i = 0; i < 5; i += 1) {
      objects.push(object("cube", [-2.6 + i * 1.3, -0.4, 0], [.5, .3, .3], i === active ? COLORS.gold : COLORS.navy));
    }
    objects.push(object("cylinder", [-1.3, 0.45, 0], [.03, .35, .03], COLORS.gray));
    objects.push(object("cube", [-1.3, 1.1, 0], [.55, .3, .06], COLORS.gray));
    objects.push(object("sphere", [-2.6 + ((time / 0.75) % 5) * 1.3, 0.35, 0], .18, COLORS.orange));
  } else if (id === "subroutine") {
    // A sub-routine is steps you name once and call from the main program:
    // the token jumps in, runs them, and comes back to carry on.
    const mainX = (i) => -2.7 + i * 1.35;
    for (let i = 0; i < 4; i += 1) objects.push(object("cube", [mainX(i), 1.0, 0], [.5, .3, .3], i === 1 ? COLORS.gold : COLORS.navy));
    for (let i = 0; i < 3; i += 1) objects.push(object("cube", [-0.6 + i * 1.1, -1.1, 0], [.42, .26, .26], COLORS.teal));
    const route = [[mainX(0), 1.6], [mainX(1), 1.6], [-0.6, -0.5], [0.5, -0.5], [1.6, -0.5], [mainX(2), 1.6], [mainX(3), 1.6]];
    const p = Math.min(route.length - 1.001, (time % 8) / 8 * route.length);
    const leg = Math.floor(p), frac = p - leg;
    const [x1, y1] = route[leg], [x2, y2] = route[leg + 1];
    objects.push(object("sphere", [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac, 0], .19, COLORS.orange));
  } else if (id === "general") {
    // The input → process → output pipeline every unit rests on. Named
    // explicitly rather than left as the else-branch so the scene catalogue
    // check can see it: a scene that only exists as a fallback is one rename
    // away from silently rendering an empty canvas.
    const stages = [[-2.6, COLORS.teal], [0, COLORS.gold], [2.6, COLORS.orange]];
    stages.forEach(([x, color]) => objects.push(object("cube", [x, 0, 0], [.72, .5, .5], color)));
    const p = (time * 0.5) % 1;
    objects.push(object("sphere", [-2.6 + p * 5.2, 0.95, 0], .18, COLORS.navy));
    for (const x of [-1.3, 1.3]) objects.push(object("cube", [x, 0, 0], [.32, .05, .05], COLORS.gray));
  } else {
    // Unknown scene id: render the general pipeline rather than an empty
    // canvas, so a typo degrades to a useful diagram instead of a blank box.
    return sceneObjects("general", time);
  }
  return objects;
}

function createRenderer(canvas) {
  const gl=canvas.getContext("webgl",{antialias:true,alpha:true}); if(!gl) return null;
  const program=createProgram(gl); gl.useProgram(program);
  const locations={position:gl.getAttribLocation(program,"a_position"),normal:gl.getAttribLocation(program,"a_normal"),viewProjection:gl.getUniformLocation(program,"u_viewProjection"),model:gl.getUniformLocation(program,"u_model"),color:gl.getUniformLocation(program,"u_color")};
  const source={cube:cubeMesh(),sphere:roundMesh(20,12,true),cylinder:roundMesh(24,0,false,1),cone:roundMesh(24,0,false,0)};
  const meshes=Object.fromEntries(Object.entries(source).map(([key,value])=>[key,uploadMesh(gl,value)]));
  let yaw=.16,pitch=-.14,paused=false,start=performance.now(),pausedAt=0,drag=null,visible=true,frame=0;
  const resize=()=>{ const ratio=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio)); if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;} gl.viewport(0,0,w,h); };
  const draw=(now)=>{
    if(!canvas.isConnected) return;
    frame=requestAnimationFrame(draw); if(paused||!visible) return; resize();
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const t=(now-start)/1000,view=multiply(perspective(Math.PI/4,canvas.width/canvas.height,.1,100),translation(0,0,-7));
    gl.uniformMatrix4fv(locations.viewProjection,false,new Float32Array(view));
    const group=multiply(rotationX(pitch),rotationY(yaw+Math.sin(t*.35)*.08));
    for(const item of sceneObjects(canvas.dataset.computingScene,t)) {
      const mesh=meshes[item.mesh]; if(!mesh) continue; const model=compose(item,group);
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.positions); gl.enableVertexAttribArray(locations.position); gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normals); gl.enableVertexAttribArray(locations.normal); gl.vertexAttribPointer(locations.normal,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indices); gl.uniformMatrix4fv(locations.model,false,new Float32Array(model)); gl.uniform4fv(locations.color,item.color); gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
    }
  };
  canvas.addEventListener("pointerdown",e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.012;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag[1])*.012));drag=[e.clientX,e.clientY];});
  canvas.addEventListener("pointerup",()=>{drag=null;}); canvas.addEventListener("pointercancel",()=>{drag=null;});
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;},{threshold:.02}); observer.observe(canvas);
  frame=requestAnimationFrame(draw);
  return {
    toggle(){paused=!paused;if(paused)pausedAt=performance.now();else start+=performance.now()-pausedAt;return paused;},
    reset(){yaw=.16;pitch=-.14;start=performance.now();},
    destroy(){cancelAnimationFrame(frame);observer.disconnect();},
  };
}

// Mounted canvases, so a second init pass cannot build a second renderer on one
// canvas — and, more to the point, cannot attach the listeners below twice.
//
// This is DEFENSIVE. It is not fixing something observed, and the first version
// of this comment claimed it was: it said afterPaint and the grid renderers both
// init the same canvases. They do not overlap. `afterPaint` belongs to the DECK
// (deck.js) and is called with the slide track, and a deck diagram is flat
// (`interactive: false`) so it carries no scene canvas at all; the grid renderers
// scan the classic region instead. A grid renderer that redraws replaces its own
// DOM, so its canvases are new elements rather than remounted ones. Measured on
// the deployed pre-guard bundle rather than reasoned about — one click on Pause
// flipped the label exactly once, so exactly one listener was attached.
//
// It stays because the handlers below are listeners and the duplicate would be
// silent: a deck that ever drew an interactive diagram, or a renderer that ever
// re-inited without replacing its DOM, would double every toggle. A WeakSet keys
// on the element, so a canvas thrown away by a re-render is collected with it.
const mountedScenes = new WeakSet();

// A context can be lost long AFTER it was created, and nothing above notices.
// The browser honours a new context by evicting the oldest, and these pages mount
// many at once — one per concept or activity, eight on Computing's Stage 4 Build
// It, eleven on Stage 6 Lesson — against a cap of about sixteen on desktop and
// commonly eight on mobile. No error is thrown when it happens: the try/catch
// below only ever sees synchronous CREATION failure, so before this the canvas
// simply stopped drawing and the fallback beside it stayed hidden. The learner
// was left looking at an empty box where the model had been.
//
// preventDefault() is what makes the loss recoverable — without it the context is
// gone permanently and webglcontextrestored never fires at all.
function mountComputingScene(canvas) {
  if (mountedScenes.has(canvas)) return;
  const figure=canvas.closest("[data-computing-figure]");
  if (!figure) return;
  const fallback=figure.querySelector(".geometry-fallback"), controls=figure.querySelector(".geometry-controls");
  const toggle=figure.querySelector("[data-geometry-toggle]"), reset=figure.querySelector("[data-geometry-reset]");
  const degrade=(error)=>{ console.warn("Computing WebGL example unavailable",error); canvas.hidden=true; if(fallback) fallback.hidden=false; if(controls) controls.hidden=true; };
  const build=()=>{ const r=createRenderer(canvas); if(!r) throw new Error("WebGL unavailable"); return r; };
  let renderer=null;
  try { renderer=build(); } catch(error) { degrade(error); return; }
  mountedScenes.add(canvas);
  toggle?.addEventListener("click",event=>{ if(!renderer) return; const paused=renderer.toggle(); event.currentTarget.textContent=paused?"Play animation":"Pause animation"; });
  reset?.addEventListener("click",()=>renderer?.reset());
  canvas.addEventListener("webglcontextlost",(event)=>{
    event.preventDefault();
    renderer?.destroy(); renderer=null;
    degrade("the browser reclaimed this WebGL context");
  });
  canvas.addEventListener("webglcontextrestored",()=>{
    try {
      renderer=build();
      canvas.hidden=false; if(fallback) fallback.hidden=true; if(controls) controls.hidden=false;
      if(toggle) toggle.textContent="Pause animation";
    } catch(error) { degrade(error); }
  });
}

export function initComputingWebGL(root=document) {
  root.querySelectorAll("canvas[data-computing-scene]").forEach(mountComputingScene);
}

// Interactive WebGL scenes for the Computing course: binary counting, program
// flow (sequence, iteration, selection), variables, networks and packets,
// sorting and searching, pixels, the micro:bit LED grid, ciphers, robots,
// databases and spreadsheets.
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

export function initComputingWebGL(root=document) {
  root.querySelectorAll("canvas[data-computing-scene]").forEach((canvas)=>{
    const figure=canvas.closest("[data-computing-figure]");
    try {
      const renderer=createRenderer(canvas); if(!renderer) throw new Error("WebGL unavailable");
      figure.querySelector("[data-geometry-toggle]").addEventListener("click",event=>{const paused=renderer.toggle();event.currentTarget.textContent=paused?"Play animation":"Pause animation";});
      figure.querySelector("[data-geometry-reset]").addEventListener("click",()=>renderer.reset());
    } catch(error) {
      console.warn("Computing WebGL example unavailable",error); canvas.hidden=true; const fallback=figure.querySelector(".geometry-fallback"); if(fallback) fallback.hidden=false; const controls=figure.querySelector(".geometry-controls"); if(controls) controls.hidden=true;
    }
  });
}

// Interactive WebGL scenes for the Science course: orbits, particle states,
// waves, circuits, cells and forces. Shares the rendering approach of the
// mathematics geometry module but with science scene definitions.
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

function sceneObjects(id, time) {
  const objects = [];
  if (id === "orbit") {
    objects.push(object("sphere", [0, 0, 0], .62, COLORS.gold, [0, time * .3, 0]));
    const ea = time * .45, ex = Math.cos(ea) * 2.25, ez = Math.sin(ea) * 2.25;
    objects.push(object("sphere", [ex, 0, ez], .3, COLORS.blue, [0, time, 0]));
    const ma = time * 2.1, mx = ex + Math.cos(ma) * .62, mz = ez + Math.sin(ma) * .62;
    objects.push(object("sphere", [mx, 0, mz], .12, COLORS.gray));
    for (let i = 0; i < 24; i += 1) { const a = i / 24 * TAU; objects.push(object("sphere", [Math.cos(a) * 2.25, 0, Math.sin(a) * 2.25], .028, COLORS.gray)); }
  } else if (id === "states") {
    for (const [cx, kind] of [[-2, "solid"], [0, "liquid"], [2, "gas"]]) {
      objects.push(object("cube", [cx, -1.15, 0], [.85, .06, .85], COLORS.navy));
      if (kind === "solid") {
        for (let ix = 0; ix < 3; ix += 1) for (let iy = 0; iy < 3; iy += 1) {
          const j = Math.sin(time * 7 + ix * 2 + iy) * .035;
          objects.push(object("sphere", [cx - .4 + ix * .4 + j, -.75 + iy * .4, 0], .16, COLORS.teal));
        }
      } else if (kind === "liquid") {
        for (let i = 0; i < 8; i += 1) {
          const px = cx + Math.sin(time * .9 + i * 2.4) * .42, py = -.72 + (i % 3) * .3 + Math.cos(time * 1.2 + i) * .1;
          objects.push(object("sphere", [px, py, Math.sin(i) * .2], .16, COLORS.blue));
        }
      } else {
        for (let i = 0; i < 4; i += 1) {
          const a = time * (1.4 + i * .3) + i * 1.7;
          objects.push(object("sphere", [cx + Math.cos(a) * .55, -.2 + Math.sin(a * 1.3) * .75, Math.sin(a) * .4], .14, COLORS.orange));
        }
      }
    }
  } else if (id === "wave") {
    for (let i = 0; i < 13; i += 1) {
      const x = -2.7 + i * .45, y = Math.sin(time * 2.2 + i * .75) * .62;
      objects.push(object("sphere", [x, y, 0], .17, i % 2 ? COLORS.teal : COLORS.blue));
    }
    objects.push(object("cube", [0, -1.35, 0], [3, .04, .4], COLORS.gray));
  } else if (id === "circuit") {
    const w = 3.2, h = 2.1;
    objects.push(object("cube", [0, -h / 2, 0], [.55, .22, .22], COLORS.gold));
    objects.push(object("cube", [0, -h / 2, 0], [.06, .34, .06], COLORS.navy));
    for (const [x, y, sx, sy] of [[-w/2, 0, .05, h/2], [w/2, 0, .05, h/2], [-w/4 - .28, -h/2, w/4 - .25, .05], [w/4 + .28, -h/2, w/4 - .25, .05], [0, h/2, w/2, .05]]) {
      objects.push(object("cube", [x, y, 0], [sx, sy, .05], COLORS.navy));
    }
    const glow = 1 + Math.sin(time * 5) * .12;
    objects.push(object("sphere", [0, h / 2 + .1, 0], .3 * glow, COLORS.orange));
    for (let i = 0; i < 6; i += 1) {
      const [px, py] = rectanglePoint(time * .12 + i / 6, w, h);
      objects.push(object("sphere", [px, py, .1], .09, COLORS.teal));
    }
  } else if (id === "cell") {
    for (let i = 0; i < 16; i += 1) { const a = i / 16 * TAU; objects.push(object("sphere", [Math.cos(a) * 1.9, Math.sin(a) * 1.35, 0], .13, COLORS.teal)); }
    objects.push(object("sphere", [0, 0, 0], .5, COLORS.navy, [0, time * .4, 0]));
    for (let i = 0; i < 4; i += 1) {
      const a = time * .5 + i * TAU / 4;
      objects.push(object("sphere", [Math.cos(a) * 1.05, Math.sin(a) * .72, .15], .18, [COLORS.green, COLORS.gold, COLORS.pink, COLORS.orange][i]));
    }
  } else if (id === "forces") {
    objects.push(object("cube", [0, -1.05, 0], [2.9, .07, .8], COLORS.gray));
    const slide = Math.sin(time * .9) * .7;
    objects.push(object("cube", [slide, -.55, 0], [.5, .42, .5], COLORS.blue, [0, .2, 0]));
    arrow(objects, slide - 1.15, -.55, -Math.PI / 2, COLORS.green, 1);
    arrow(objects, slide + 1.15, -.55, Math.PI / 2, COLORS.red, .7);
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
    for(const item of sceneObjects(canvas.dataset.scienceScene,t)) {
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

export function initScienceWebGL(root=document) {
  root.querySelectorAll("canvas[data-science-scene]").forEach((canvas)=>{
    const figure=canvas.closest("[data-science-figure]");
    try {
      const renderer=createRenderer(canvas); if(!renderer) throw new Error("WebGL unavailable");
      figure.querySelector("[data-geometry-toggle]").addEventListener("click",event=>{const paused=renderer.toggle();event.currentTarget.textContent=paused?"Play animation":"Pause animation";});
      figure.querySelector("[data-geometry-reset]").addEventListener("click",()=>renderer.reset());
    } catch(error) {
      console.warn("Science WebGL example unavailable",error); canvas.hidden=true; const fallback=figure.querySelector(".geometry-fallback"); if(fallback) fallback.hidden=false; const controls=figure.querySelector(".geometry-controls"); if(controls) controls.hidden=true;
    }
  });
}

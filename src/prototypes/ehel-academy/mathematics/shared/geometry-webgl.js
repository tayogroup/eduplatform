const TAU = Math.PI * 2;
const COLORS = {
  teal: [0.06, 0.55, 0.49, 1], blue: [0.18, 0.42, 0.87, 1], gold: [0.98, 0.70, 0.20, 1],
  orange: [0.94, 0.42, 0.12, 1], pink: [0.86, 0.25, 0.57, 1], red: [0.91, 0.27, 0.25, 1], navy: [0.09, 0.20, 0.30, 1],
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
function edgeRods(objects, color) {
  const p=[-1,1];
  for(const y of p) for(const z of p) objects.push(object("cube",[0,y,z],[1.05,.045,.045],color));
  for(const x of p) for(const z of p) objects.push(object("cube",[x,0,z],[.045,1.05,.045],color));
  for(const x of p) for(const y of p) objects.push(object("cube",[x,y,0],[.045,.045,1.05],color));
}
function sceneObjects(id, time) {
  const objects=[];
  if (id === "2-0" || id === "2-2") {
    const meshes=id === "2-0"?["sphere","cube","cylinder","cone"]:["sphere","cube","cylinder","cone"];
    meshes.forEach((mesh,i)=>objects.push(object(mesh,[-2.35+i*1.55,0,0],mesh==="sphere"?.55:[.52,.62,.52],[COLORS.teal,COLORS.blue,COLORS.gold,COLORS.orange][i],[0,time*(i%2?.55:-.45),0])));
  } else if (id === "2-1") {
    objects.push(object("cube",[0,0,0],.92,COLORS.teal,[.15,0,0])); edgeRods(objects,COLORS.orange);
    [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].forEach(p=>objects.push(object("sphere",p,.09,COLORS.red)));
  } else if (id === "2-3") {
    [3,4,5,6].forEach((sides,i)=>objects.push(object(`prism${sides}`,[-2.35+i*1.55,0,0],[.58,.12,.58],[COLORS.orange,COLORS.blue,COLORS.pink,COLORS.teal][i],[Math.PI/2,0,time*.18])));
  } else if (id === "2-4" || id === "15-0" || id === "15-1") {
    const fold=.28+.24*Math.sin(time);
    objects.push(object("cube",[-.72,0,0],[.7,1,.08],COLORS.blue,[0,fold,0])); objects.push(object("cube",[.72,0,0],[.7,1,.08],COLORS.teal,[0,-fold,0])); objects.push(object("cube",[0,0,.12],[.025,1.2,.025],COLORS.pink));
  } else if (id === "2-5" || id === "15-2") {
    objects.push(object("prism4",[-2,0,0],[.7,.13,.7],COLORS.blue,[Math.PI/2,0,0])); objects.push(object("prism4",[0,0,0],[.7,.13,.7],COLORS.orange,[Math.PI/2,0,time*.7])); objects.push(object("prism3",[2,0,0],[.8,.13,.8],COLORS.teal,[Math.PI/2,Math.PI,0]));
  } else if (id === "15-3") {
    const cells=[[-1.2,.78,COLORS.orange],[-.4,.78,COLORS.blue],[-1.2,0,COLORS.pink],[-.4,-.78,COLORS.gold]];
    cells.forEach(([x,y,color])=>{objects.push(object("cube",[x,y,0],[.32,.32,.12],color));objects.push(object("cube",[-x,y,0],[.32,.32,.12],color));}); objects.push(object("cube",[0,0,.1],[.025,1.35,.025],COLORS.pink));
  } else if (id === "11-0" || id === "15-4") {
    arrow(objects,-.8,-.4,-Math.PI/2,COLORS.blue,1.35); arrow(objects,0,-.65,0,COLORS.teal,1.65); arrow(objects,.8,-.4,Math.PI/2,COLORS.orange,1.35); objects.push(object("sphere",[0,-.5,0],.22,COLORS.navy));
  } else if (id === "11-1" || id === "15-5") {
    objects.push(object("cylinder",[0,0,0],[1.45,.08,1.45],COLORS.blue,[Math.PI/2,0,0])); objects.push(object("sphere",[0,0,.16],.13,COLORS.navy)); arrow(objects,0,0,-time*.7,COLORS.orange,1.15); arrow(objects,0,0,time*.45,COLORS.teal,.82);
  } else if (id === "11-2") {
    objects.push(object("cube",[0,.55,0],[.08,.7,.08],COLORS.navy)); objects.push(object("cube",[.65,0,0],[.7,.08,.08],COLORS.navy)); arrow(objects,0,0,Math.min(Math.PI/2,(time%3)/2* Math.PI/2),COLORS.orange,1.15);
  } else if (id === "11-3") {
    arrow(objects,-1.15,-.75,0,COLORS.blue,1.5); arrow(objects,1.15,.75,Math.PI,COLORS.orange,1.5); const angle=Math.min(Math.PI,(time%4)/2*Math.PI); arrow(objects,0,-.1,angle,COLORS.teal,1.15);
  } else if (id === "11-4") {
    [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach((a,i)=>arrow(objects,0,0,a,[COLORS.teal,COLORS.orange,COLORS.blue,COLORS.pink][i],1.28)); objects.push(object("sphere",[0,0,0],.2,COLORS.navy));
  } else if (id === "11-5") {
    objects.push(object("cylinder",[0,0,0],[1.55,.08,1.55],COLORS.blue,[Math.PI/2,0,0])); objects.push(object("cube",[0,0,.14],[1.55,.045,.045],COLORS.pink)); objects.push(object("cube",[.48,.48,.18],[.72,.05,.05],COLORS.orange,[0,0,-Math.PI/4])); objects.push(object("sphere",[0,0,.22],.13,COLORS.red));
  }
  return objects;
}

function createRenderer(canvas) {
  const gl=canvas.getContext("webgl",{antialias:true,alpha:true}); if(!gl) return null;
  const program=createProgram(gl); gl.useProgram(program);
  const locations={position:gl.getAttribLocation(program,"a_position"),normal:gl.getAttribLocation(program,"a_normal"),viewProjection:gl.getUniformLocation(program,"u_viewProjection"),model:gl.getUniformLocation(program,"u_model"),color:gl.getUniformLocation(program,"u_color")};
  const source={cube:cubeMesh(),sphere:roundMesh(20,12,true),cylinder:roundMesh(24,0,false,1),cone:roundMesh(24,0,false,0)};
  for(let sides=3;sides<=6;sides+=1) source[`prism${sides}`]=roundMesh(sides,0,false,1);
  const meshes=Object.fromEntries(Object.entries(source).map(([key,value])=>[key,uploadMesh(gl,value)]));
  let yaw=.22,pitch=-.18,paused=false,start=performance.now(),pausedAt=0,drag=null,visible=true,frame=0;
  const resize=()=>{ const ratio=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio)); if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;} gl.viewport(0,0,w,h); };
  const draw=(now)=>{
    if(!canvas.isConnected) return;
    frame=requestAnimationFrame(draw); if(paused||!visible) return; resize();
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const t=(now-start)/1000,view=multiply(perspective(Math.PI/4,canvas.width/canvas.height,.1,100),translation(0,0,-7));
    gl.uniformMatrix4fv(locations.viewProjection,false,new Float32Array(view));
    const group=multiply(rotationX(pitch),rotationY(yaw+Math.sin(t*.45)*.12));
    for(const item of sceneObjects(canvas.dataset.geometryScene,t)) {
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
    reset(){yaw=.22;pitch=-.18;start=performance.now();},
    destroy(){cancelAnimationFrame(frame);observer.disconnect();},
  };
}

export function initGeometryWebGL(root=document) {
  root.querySelectorAll("canvas[data-geometry-scene]").forEach((canvas)=>{
    const figure=canvas.closest("[data-geometry-figure]");
    try {
      const renderer=createRenderer(canvas); if(!renderer) throw new Error("WebGL unavailable");
      figure.querySelector("[data-geometry-toggle]").addEventListener("click",event=>{const paused=renderer.toggle();event.currentTarget.textContent=paused?"Play animation":"Pause animation";});
      figure.querySelector("[data-geometry-reset]").addEventListener("click",()=>renderer.reset());
    } catch(error) {
      console.warn("Geometry WebGL example unavailable",error); canvas.hidden=true; figure.querySelector(".geometry-fallback").hidden=false; figure.querySelector(".geometry-controls").hidden=true;
    }
  });
}

import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * ParticleMorphScene — Concept "Matter, digitized".
 * ~60k GPU particles continuously morph between three forms — a physical
 * shipping CONTAINER, a digital BLOCK (ledger), and a SHIELD/lock — via
 * a position lerp in the vertex shader plus a curl-noise-style flow
 * field. Gold "verified" sparks fire the instant each form locks in, and
 * the cursor pushes the whole field like a current.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const NAVY = new THREE.Color('#16365f')
const GOLD = new THREE.Color('#bf8f2e') // brand gold
const SEG = 4.0 // seconds per form (hold + morph out)

export default class ParticleMorphScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._pointerWorld = new THREE.Vector3()
    this._init()
  }

  _init() {
    const { canvas } = this
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2))
    this.renderer.setSize(w, h, false)
    const pr = this.renderer.getPixelRatio()

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100)
    this.camera.position.set(0, 0, this.mobile ? 6.2 : 5.6)

    // sit the form on the right on desktop; lifted into the upper band on mobile
    this.group = new THREE.Group()
    this.group.position.set(this.mobile ? 0 : 1.32, this.mobile ? 0.95 : 0.05, 0)
    this.group.scale.setScalar(this.mobile ? 0.72 : 1)
    this.scene.add(this.group)

    const N = this.mobile ? 22000 : 60000
    this._buildParticles(N, pr)

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _buildParticles(N, pr) {
    const container = sampleContainer(N)
    const block = sampleBlock(N)
    const shield = sampleShield(N)
    const scatter = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    const seeds = new Float32Array(N)
    const rand = mulberry32(7)
    for (let i = 0; i < N; i++) {
      // start scattered on a loose sphere so the field flies into the container
      const u = rand() * 2 - 1
      const th = rand() * Math.PI * 2
      const r = 2.6 + rand() * 1.4
      const s = Math.sqrt(1 - u * u)
      scatter[i * 3] = Math.cos(th) * s * r
      scatter[i * 3 + 1] = u * r
      scatter[i * 3 + 2] = Math.sin(th) * s * r
      sizes[i] = 0.6 + rand() * 0.9
      seeds[i] = rand()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(container, 3)) // form A
    geo.setAttribute('aPosB', new THREE.BufferAttribute(block, 3)) // form B
    geo.setAttribute('aPosC', new THREE.BufferAttribute(shield, 3)) // form C
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uFrom: { value: 0 },
        uTo: { value: 1 },
        uMix: { value: 0 },
        uIntro: { value: 0 },
        uLock: { value: 0 },
        uNoiseAmp: { value: 0.16 },
        uPointer: { value: new THREE.Vector3(99, 99, 0) },
        uPointerStrength: { value: this.mobile ? 0.0 : 0.5 },
        uSize: { value: (this.mobile ? 2.5 : 2.2) * pr },
        uColor: { value: NAVY.clone() },
        uGold: { value: GOLD.clone() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    })

    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.group.add(this.points)
    this.u = mat.uniforms
  }

  setPointer(nx, ny) {
    this.target.set(nx, ny)
  }

  _updatePointerWorld() {
    // unproject the eased cursor onto the z = group.z plane (world space)
    const v = new THREE.Vector3(this.pointer.x, -this.pointer.y, 0.5).unproject(this.camera)
    v.sub(this.camera.position).normalize()
    const dist = (this.group.position.z - this.camera.position.z) / v.z
    this._pointerWorld.copy(this.camera.position).addScaledVector(v, dist)
  }

  animate() {
    if (!this.running) return
    this._raf = requestAnimationFrame(this.animate)
    const t = this.clock.getElapsedTime()

    this.pointer.x += (this.target.x - this.pointer.x) * 0.06
    this.pointer.y += (this.target.y - this.pointer.y) * 0.06

    // ---- morph clock: cycle through the 3 forms with a hold then a transition
    const cycle = (t / SEG) % 3
    const i = Math.floor(cycle)
    const frac = cycle - i
    const from = i
    const to = (i + 1) % 3
    // hold near the current form, then ease across to the next
    const m = smoothstep(0.42, 0.98, frac)
    // gold spark fires as the next form snaps into place
    const lock = Math.exp(-Math.pow((frac - 0.9) / 0.05, 2))

    this.u.uTime.value = t
    this.u.uFrom.value = from
    this.u.uTo.value = to
    this.u.uMix.value = m
    this.u.uLock.value = lock
    this.u.uIntro.value = easeOut(clamp01(t / 1.7))

    this._updatePointerWorld()
    this.u.uPointer.value.copy(this._pointerWorld)

    // gentle pointer parallax + idle drift on the whole field
    this.group.rotation.y = Math.sin(t * 0.1) * 0.12 + this.pointer.x * 0.5
    this.group.rotation.x = -this.pointer.y * 0.28

    this.renderer.render(this.scene, this.camera)
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2))
    this.renderer.setSize(w, h, false)
    this.u.uSize.value = (this.mobile ? 2.5 : 2.2) * this.renderer.getPixelRatio()
  }

  pause() {
    this.running = false
    if (this._raf) cancelAnimationFrame(this._raf)
  }

  resume() {
    if (this.running) return
    this.running = true
    this.clock.start()
    this._raf = requestAnimationFrame(this.animate)
  }

  dispose() {
    this.pause()
    window.removeEventListener('resize', this._onResize)
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    })
    this.renderer.dispose()
  }
}

/* ------------------------------------------------------------------ *
 * Shaders
 * ------------------------------------------------------------------ */

const NOISE = /* glsl */ `
  // Ashima 3D simplex noise (GLSL ES 1.0)
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
      +i.y+vec4(0.0,i1.y,i2.y,1.0))
      +i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 mm=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    mm=mm*mm;
    return 42.0*dot(mm*mm,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  // cheap divergence-ish flow vector (3 noise samples)
  vec3 flowVec(vec3 p){
    return vec3(
      snoise(p),
      snoise(p.yzx + 31.4),
      snoise(p.zxy - 17.2)
    );
  }
`

const VERT = /* glsl */ `
  attribute vec3 aPosB;
  attribute vec3 aPosC;
  attribute vec3 aScatter;
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform int uFrom;
  uniform int uTo;
  uniform float uMix;
  uniform float uIntro;
  uniform float uNoiseAmp;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform float uSize;
  varying float vSeed;
  varying float vSpark;
  ${NOISE}
  vec3 posFor(int idx){
    if(idx==0) return position;
    else if(idx==1) return aPosB;
    return aPosC;
  }
  void main(){
    vec3 p = mix(posFor(uFrom), posFor(uTo), uMix);
    p = mix(aScatter, p, uIntro);

    // curl-noise-style flow — swells while morphing, faint while idle
    float trans = sin(uMix * 3.14159265);
    vec3 flow = flowVec(p * 0.55 + uTime * 0.12 + aSeed * 8.0);
    p += flow * (uNoiseAmp * (0.18 + trans) + 0.02);

    // cursor pushes the field like a current
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec2 d = wp.xy - uPointer.xy;
    float dl = length(d) + 0.0001;
    float push = smoothstep(1.7, 0.0, dl) * uPointerStrength;
    wp.xy += (d / dl) * push;

    vSeed = aSeed;
    vSpark = trans;

    vec4 mv = viewMatrix * wp;
    gl_PointSize = uSize * aSize * (0.85 + trans * 0.5) * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uGold;
  uniform float uLock;
  uniform float uTime;
  varying float vSeed;
  varying float vSpark;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float dd = length(c);
    if(dd > 0.5) discard;
    float a = smoothstep(0.5, 0.06, dd);

    // gold "verified" sparks: ~18% of particles flash gold on lock-in
    float mask = step(0.82, fract(vSeed * 43.0));
    float spark = clamp(uLock, 0.0, 1.0) * mask;
    vec3 col = mix(uColor, uGold, spark);
    // a few permanent gold glints twinkling through the field
    float glint = step(0.985, fract(vSeed * 91.0 + uTime * 0.04));
    col = mix(col, uGold, glint * 0.7);

    gl_FragColor = vec4(col, a * (0.8 + spark * 0.2));
  }
`

/* ------------------------------------------------------------------ *
 * Point-cloud generators (each returns exactly N points)
 * ------------------------------------------------------------------ */

// elongated shipping container — points on the box surface
function sampleContainer(N) {
  const out = new Float32Array(N * 3)
  const hx = 1.18, hy = 0.56, hz = 0.56
  const ax = 4 * hy * hz
  const ay = 4 * hx * hz
  const az = 4 * hx * hy
  const tot = ax + ay + az
  const rand = mulberry32(11)
  for (let i = 0; i < N; i++) {
    const r = rand() * tot
    let x, y, z
    if (r < ax) {
      x = (rand() < 0.5 ? -1 : 1) * hx
      y = (rand() * 2 - 1) * hy
      z = (rand() * 2 - 1) * hz
    } else if (r < ax + ay) {
      x = (rand() * 2 - 1) * hx
      y = (rand() < 0.5 ? -1 : 1) * hy
      z = (rand() * 2 - 1) * hz
    } else {
      x = (rand() * 2 - 1) * hx
      y = (rand() * 2 - 1) * hy
      z = (rand() < 0.5 ? -1 : 1) * hz
    }
    out[i * 3] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z
  }
  return out
}

// digital ledger block — a crisp cube whose surface points snap to a grid
function sampleBlock(N) {
  const out = new Float32Array(N * 3)
  const h = 0.86
  const G = 7
  const step = (2 * h) / G
  const snap = (v) => Math.max(-h, Math.min(h, Math.round((v + h) / step) * step - h))
  const rand = mulberry32(23)
  for (let i = 0; i < N; i++) {
    const face = (rand() * 6) | 0
    let x = (rand() * 2 - 1) * h
    let y = (rand() * 2 - 1) * h
    let z = (rand() * 2 - 1) * h
    // pin one axis to a face, snap the in-plane axes to the grid
    if (face === 0) { x = -h; y = snap(y); z = snap(z) }
    else if (face === 1) { x = h; y = snap(y); z = snap(z) }
    else if (face === 2) { y = -h; x = snap(x); z = snap(z) }
    else if (face === 3) { y = h; x = snap(x); z = snap(z) }
    else if (face === 4) { z = -h; x = snap(x); y = snap(y) }
    else { z = h; x = snap(x); y = snap(y) }
    const j = 0.012
    out[i * 3] = x + (rand() * 2 - 1) * j
    out[i * 3 + 1] = y + (rand() * 2 - 1) * j
    out[i * 3 + 2] = z + (rand() * 2 - 1) * j
  }
  return out
}

// heraldic shield with a lock keyhole cut out of the centre
function sampleShield(N) {
  const out = new Float32Array(N * 3)
  const W = 1.7, H = 2.05
  const rand = mulberry32(41)
  const inside = (x, y) => {
    const v = (y + H / 2) / H // 0 bottom tip .. 1 top
    if (v < 0 || v > 1) return false
    let hw
    if (v < 0.62) hw = (W / 2) * Math.sqrt(Math.max(0, v / 0.62))
    else hw = (W / 2) * (v > 0.92 ? Math.sqrt(Math.max(0, (1 - v) / 0.08)) : 1)
    if (Math.abs(x) > hw) return false
    // keyhole: circle + stem cut out → reads as a lock
    const ky = 0.16
    const dxk = x, dyk = y - ky
    if (dxk * dxk + dyk * dyk < 0.15 * 0.15) return false
    if (Math.abs(x) < 0.06 && y < ky && y > ky - 0.34) return false
    return true
  }
  let n = 0
  while (n < N) {
    const x = (rand() * 2 - 1) * (W / 2)
    const y = (rand() * 2 - 1) * (H / 2)
    if (!inside(x, y)) continue
    // gentle front dome so the slab has volume
    const edge = 1 - Math.min(1, Math.abs(x) / (W / 2))
    out[n * 3] = x
    out[n * 3 + 1] = y
    out[n * 3 + 2] = (rand() * 2 - 1) * 0.14 + edge * 0.18
    n++
  }
  return out
}

/* ---------- helpers ---------- */
function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeOut(x) {
  return 1 - Math.pow(1 - clamp01(x), 3)
}
function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

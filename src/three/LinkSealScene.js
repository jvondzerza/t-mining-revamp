import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * LinkSealScene — Concept "The seal".
 * The T-Mining interlocking-hexagon mark rendered as two real beveled
 * gold links. On load they rotate in from apart and click together in
 * 3D (release secured), then idle with a slow spin + caustic glints. A
 * faint dotted globe is ghosted behind for maritime context.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const GOLD = new THREE.Color('#bf8f2e')
const NAVY = new THREE.Color('#16365f')

const ASSEMBLE = 1.8 // seconds for the two links to seat together
const DELAY = 0.35

export default class LinkSealScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._clicked = false
    this._init()
  }

  _init() {
    const { canvas } = this
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.7 : 2))
    this.renderer.setSize(w, h, false)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100)
    this.camera.position.set(0, 0, this.mobile ? 5.8 : 5.2)

    this.group = new THREE.Group()
    this.group.position.set(this.mobile ? 0 : 1.5, this.mobile ? 1.0 : 0.05, 0)
    this.group.scale.setScalar(this.mobile ? 0.52 : 0.9)
    this.scene.add(this.group)

    this._buildEnv()
    this._buildLights()
    this._buildGhostGlobe()
    this._buildLinks()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _buildEnv() {
    const cv = document.createElement('canvas')
    cv.width = 512
    cv.height = 256
    const ctx = cv.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.5, '#e7eef7')
    g.addColorStop(1, '#c2cfdf')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 256)
    for (const [x, y, r, a] of [[120, 60, 90, 0.95], [360, 110, 80, 0.7], [250, 30, 55, 0.85]]) {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
      rg.addColorStop(0, `rgba(255,255,255,${a})`)
      rg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = rg
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    const tex = new THREE.CanvasTexture(cv)
    tex.mapping = THREE.EquirectangularReflectionMapping
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this._env = pmrem.fromEquirectangular(tex).texture
    this.scene.environment = this._env
    tex.dispose()
    pmrem.dispose()
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.0)
    key.position.set(2, 4, 5)
    this.scene.add(key)
    this.glint1 = new THREE.PointLight(0xfff1d0, 22, 14)
    this.glint2 = new THREE.PointLight(0xdbe6ff, 16, 14)
    this.scene.add(this.glint1, this.glint2)
  }

  // a faint dotted sphere behind the links — maritime context, kept subtle
  _buildGhostGlobe() {
    const count = this.mobile ? 1100 : 1900
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fibSphere(count, 2.15)), 3))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: NAVY.clone() }, uSize: { value: 2.0 * this.renderer.getPixelRatio() } },
      vertexShader: `uniform float uSize;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=uSize*(5.8/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uColor;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);
        if(d>0.5)discard;float a=smoothstep(0.5,0.05,d)*0.16;gl_FragColor=vec4(uColor,a);}`,
    })
    this.ghost = new THREE.Points(geo, mat)
    this.ghost.position.z = -1.2
    this.group.add(this.ghost)
  }

  _buildLinks() {
    const Ro = 0.95
    const Ri = 0.66
    const td = 0.22
    const shape = hexRingShape(Ro, Ri)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: td,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 1,
    })
    geo.center()

    const mat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.26, envMapIntensity: 1.5 })

    this.linksGroup = new THREE.Group()
    this.group.add(this.linksGroup)

    this.linkA = new THREE.Mesh(geo, mat)
    this.linkB = new THREE.Mesh(geo.clone(), mat.clone())
    this.linksGroup.add(this.linkA, this.linkB)

    // interlock geometry (Hopf link): A in the XY plane, B in the XZ plane,
    // each centred half a ring-radius off origin so they thread each other
    const Rm = (Ro + Ri) / 2
    this.off = Rm / 2

    // click flash
    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialGlow(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    )
    this.flash.scale.set(2.6, 2.6, 1)
    this.linksGroup.add(this.flash)
  }

  setPointer(nx, ny) {
    this.target.set(nx, ny)
  }

  animate() {
    if (!this.running) return
    this._raf = requestAnimationFrame(this.animate)
    const t = this.clock.getElapsedTime()

    this.pointer.x += (this.target.x - this.pointer.x) * 0.05
    this.pointer.y += (this.target.y - this.pointer.y) * 0.05

    const a = clamp01((t - DELAY) / ASSEMBLE)
    const e = easeInOut(a)
    const off = this.off

    // --- link A: slides in from the left with a spin, seats in the XY plane
    this.linkA.position.set(THREE.MathUtils.lerp(-off - 1.7, -off, e), THREE.MathUtils.lerp(0.35, 0, e), 0)
    this.linkA.rotation.set(0, 0, THREE.MathUtils.lerp(-Math.PI * 1.5, 0, e))

    // --- link B: slides in from the right, settles into the XZ plane
    this.linkB.position.set(THREE.MathUtils.lerp(off + 1.7, off, e), THREE.MathUtils.lerp(-0.35, 0, e), 0)
    this.linkB.rotation.set(Math.PI / 2, THREE.MathUtils.lerp(Math.PI * 1.5, 0, e), 0)

    // --- click flash the moment they seat
    if (a >= 0.985 && !this._clicked) this._clicked = true
    if (this._clicked) {
      this.flash.material.opacity *= 0.88
    } else {
      this.flash.material.opacity = a > 0.9 ? (a - 0.9) / 0.1 : 0
    }

    // --- idle: the seated seal turns slowly with a little pointer parallax
    const idle = clamp01((t - DELAY - ASSEMBLE) / 1.0)
    this.linksGroup.rotation.y = idle * (t - DELAY - ASSEMBLE) * 0.32 + this.pointer.x * 0.5
    this.linksGroup.rotation.x = Math.sin(t * 0.5) * 0.12 * idle - this.pointer.y * 0.3

    // travelling caustic glints across the gold
    this.glint1.position.set(Math.cos(t * 1.2) * 3 + this.group.position.x, Math.sin(t * 0.9) * 2.4, 3)
    this.glint2.position.set(Math.cos(t * 0.8 + 2) * 3 + this.group.position.x, Math.sin(t * 1.4 + 1) * 2, 2.6)

    this.ghost.rotation.y += 0.0009

    this.renderer.render(this.scene, this.camera)
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.7 : 2))
    this.renderer.setSize(w, h, false)
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
    this._env?.dispose()
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => {
          if (m.map) m.map.dispose()
          m.dispose()
        })
      }
    })
    this.renderer.dispose()
  }
}

/* ---------- helpers ---------- */

// a hexagonal ring (outer hex with an inner hex hole) as a THREE.Shape
function hexRingShape(Ro, Ri) {
  const shape = new THREE.Shape()
  const hole = new THREE.Path()
  for (let i = 0; i <= 6; i++) {
    const ang = Math.PI / 6 + (i * Math.PI) / 3
    const ox = Math.cos(ang) * Ro
    const oy = Math.sin(ang) * Ro
    if (i === 0) shape.moveTo(ox, oy)
    else shape.lineTo(ox, oy)
  }
  for (let i = 0; i <= 6; i++) {
    const ang = Math.PI / 6 + (i * Math.PI) / 3
    const ix = Math.cos(ang) * Ri
    const iy = Math.sin(ang) * Ri
    if (i === 0) hole.moveTo(ix, iy)
    else hole.lineTo(ix, iy)
  }
  shape.holes.push(hole)
  return shape
}

function fibSphere(count, radius) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const tt = golden * i
    pts.push(Math.cos(tt) * r * radius, y * radius, Math.sin(tt) * r * radius)
  }
  return pts
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeInOut(x) {
  const k = clamp01(x)
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
}
function radialGlow() {
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,240,205,0.6)')
  g.addColorStop(1, 'rgba(255,240,205,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(cv)
}

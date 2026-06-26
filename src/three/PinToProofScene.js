import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * PinToProofScene — Concept "PIN → proof".
 * A fragile multi-digit release PIN. Copies bleed off and get
 * intercepted (the leak / fraud), then the digits implode and
 * crystallize into a single unforgeable, refracting token bound by an
 * interlocking-link seal. Loops; idles by slowly rotating + refracting.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const NAVY = '#0f2a4c'
const GOLD = new THREE.Color('#bf8f2e')
const RED = new THREE.Color('#d2453b')
const PIN = ['7', '3', '9', '1', '4', '2']
const LOOP = 13 // seconds per full cycle

// phase boundaries within the normalised loop (0..1)
const P = { assemble: 0.16, hold: 0.3, bleed: 0.54, implode: 0.66, crystal: 0.76 }

export default class PinToProofScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._textures = []
    this._init()
  }

  _init() {
    const { canvas } = this
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.6 : 2))
    this.renderer.setSize(w, h, false)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100)
    this.camera.position.set(0, 0, this.mobile ? 6.6 : 6)

    // sit the assembly to the right on desktop; smaller + lifted into the upper
    // area on mobile so the headline + copy below stay clear
    this.group = new THREE.Group()
    this.group.position.set(this.mobile ? 0 : 1.72, this.mobile ? 1.05 : 0.05, 0)
    this.group.scale.setScalar(this.mobile ? 0.58 : 0.85)
    this.scene.add(this.group)

    this._buildEnv()
    this._buildLights()
    this._buildPin()
    this._buildToken()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  // small studio-ish environment so the gold metal token has something to
  // reflect (reads as "refraction" as it spins)
  _buildEnv() {
    const cv = document.createElement('canvas')
    cv.width = 512
    cv.height = 256
    const ctx = cv.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.5, '#e8eef6')
    g.addColorStop(1, '#c4d0de')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 256)
    // a couple of bright spots → moving glints on the facets
    for (const [x, y, r, a] of [[140, 70, 90, 0.9], [380, 120, 70, 0.7], [260, 40, 50, 0.8]]) {
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
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(2, 3, 4)
    this.scene.add(key)
    // two orbiting point lights for travelling glints on the token
    this.glint1 = new THREE.PointLight(0xfff0cf, 26, 12)
    this.glint2 = new THREE.PointLight(0xcfe0ff, 18, 12)
    this.scene.add(this.glint1, this.glint2)
  }

  _buildPin() {
    this.pinGroup = new THREE.Group()
    this.group.add(this.pinGroup)
    this.digits = []
    this.leaks = []
    const spacing = 0.64
    const rand = mulberry32(99)

    PIN.forEach((ch, i) => {
      const tex = digitTexture(ch)
      this._textures.push(tex)
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), mat)
      const home = new THREE.Vector3((i - (PIN.length - 1) / 2) * spacing, 0, 0)
      mesh.position.copy(home)
      mesh.userData.home = home
      this.pinGroup.add(mesh)
      this.digits.push(mesh)

      // two "leak" copies per digit that bleed outward during the threat phase;
      // a third of them are intercepted (flash red and die early)
      for (let k = 0; k < 2; k++) {
        const lmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide })
        const lmesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), lmat)
        lmesh.position.copy(home)
        const ang = rand() * Math.PI * 2
        const intercepted = rand() < 0.4
        lmesh.userData = {
          home,
          dir: new THREE.Vector3(Math.cos(ang), Math.sin(ang) * 0.7, (rand() - 0.5) * 0.6),
          reach: 1.6 + rand() * 1.8,
          spin: (rand() - 0.5) * 4,
          intercepted,
          dieAt: intercepted ? 0.35 + rand() * 0.2 : 1,
        }
        this.pinGroup.add(lmesh)
        this.leaks.push(lmesh)
      }
    })
  }

  _buildToken() {
    this.tokenGroup = new THREE.Group()
    this.group.add(this.tokenGroup)

    // faceted gold crystal — the single unforgeable proof
    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.82, 0),
      new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.95, roughness: 0.16, flatShading: true, envMapIntensity: 1.4 })
    )
    this.tokenGroup.add(gem)
    this.gem = gem

    // crisp facet edges
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(gem.geometry),
      new THREE.LineBasicMaterial({ color: 0xfff1cf, transparent: true, opacity: 0.5 })
    )
    gem.add(edges)

    // two interlocking link rings — the seal binding the proof
    const ringMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.22, envMapIntensity: 1.5 })
    this.ringA = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.07, 16, 80), ringMat)
    this.ringB = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.07, 16, 80), ringMat.clone())
    this.ringB.rotation.y = Math.PI / 2
    this.tokenGroup.add(this.ringA, this.ringB)

    // white flash sprite for the crystallisation pop
    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialGlow(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    )
    this.flash.scale.set(3, 3, 1)
    this.tokenGroup.add(this.flash)

    this.tokenGroup.scale.setScalar(0.001)
  }

  setPointer(nx, ny) {
    this.target.set(nx, ny)
  }

  animate() {
    if (!this.running) return
    this._raf = requestAnimationFrame(this.animate)
    const t = this.clock.getElapsedTime()
    const L = (t % LOOP) / LOOP // 0..1 loop position

    this.pointer.x += (this.target.x - this.pointer.x) * 0.05
    this.pointer.y += (this.target.y - this.pointer.y) * 0.05
    this.group.rotation.y = this.pointer.x * 0.4
    this.group.rotation.x = -this.pointer.y * 0.25

    // ---- PIN digits: assemble → fragile hold → implode → hide
    const pinVisible = L < P.implode + 0.02
    this.digits.forEach((d, i) => {
      if (L < P.assemble) {
        const k = easeOut(clamp01(L / P.assemble - i * 0.04))
        d.material.opacity = k
        d.position.copy(d.userData.home).multiplyScalar(0.4 + 0.6 * k)
        d.position.y = d.userData.home.y + (1 - k) * 0.5
      } else if (L < P.bleed) {
        // fragile idle jitter
        d.material.opacity = 1
        const j = 0.012
        d.position.set(
          d.userData.home.x + Math.sin(t * 7 + i) * j,
          d.userData.home.y + Math.cos(t * 6 + i * 2) * j,
          0
        )
      } else if (L < P.implode) {
        d.material.opacity = 1
        d.position.copy(d.userData.home)
      } else if (L < P.crystal) {
        const k = easeIn(clamp01((L - P.implode) / (P.crystal - P.implode)))
        d.position.copy(d.userData.home).multiplyScalar(1 - k)
        d.scale.setScalar(1 - k)
        d.material.opacity = 1 - k
      } else {
        d.material.opacity = 0
        d.scale.setScalar(0.0001)
      }
      if (L < P.implode) d.scale.setScalar(1)
    })

    // ---- leak copies: bleed outward during the threat window, intercepted ones die early
    const inBleed = L >= P.hold && L < P.bleed
    this.leaks.forEach((lk) => {
      const u = lk.userData
      if (!inBleed) {
        lk.material.opacity = 0
        return
      }
      const p = (L - P.hold) / (P.bleed - P.hold) // 0..1
      if (p > u.dieAt) {
        lk.material.opacity = 0
        return
      }
      const local = p / u.dieAt
      lk.position.copy(u.home).addScaledVector(u.dir, easeOut(local) * u.reach)
      lk.rotation.z = local * u.spin
      lk.scale.setScalar(1 - local * 0.3)
      if (u.intercepted) {
        // flash red then snap out — the leak is caught
        const flash = local > 0.7 ? 1 : 0
        lk.material.color.lerpColors(new THREE.Color('#ffffff'), RED, 0.5 + flash * 0.5)
        lk.material.opacity = (1 - local) * (1 - flash * 0.6)
        lk.scale.setScalar(1 + flash * 0.5)
      } else {
        lk.material.color.setRGB(1, 1, 1)
        lk.material.opacity = (1 - local) * 0.8
      }
    })

    // ---- token: crystallize with overshoot, then idle refract
    let tScale = 0
    if (L >= P.implode && L < P.crystal) {
      const k = clamp01((L - P.implode) / (P.crystal - P.implode))
      tScale = easeOutBack(k)
      this.flash.material.opacity = Math.sin(k * Math.PI) * 0.9
    } else if (L >= P.crystal) {
      tScale = 1
      this.flash.material.opacity *= 0.9
    }
    this.tokenGroup.scale.setScalar(Math.max(0.0001, tScale))
    this.tokenGroup.visible = tScale > 0.001

    if (this.tokenGroup.visible) {
      this.gem.rotation.y = t * 0.6
      this.gem.rotation.x = Math.sin(t * 0.4) * 0.25
      this.ringA.rotation.z = t * 0.5
      this.ringA.rotation.x = Math.PI / 2.4
      this.ringB.rotation.z = -t * 0.45
      this.ringB.rotation.y = Math.PI / 2 + t * 0.3
    }

    // orbiting glints
    this.glint1.position.set(Math.cos(t * 1.1) * 3 + this.group.position.x, Math.sin(t * 0.9) * 2.2, 3)
    this.glint2.position.set(Math.cos(t * 0.8 + 2) * 3 + this.group.position.x, Math.sin(t * 1.3 + 1) * 2, 2.5)

    this.renderer.render(this.scene, this.camera)
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.6 : 2))
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
    this._textures.forEach((t) => t.dispose())
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

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeOut(x) {
  return 1 - Math.pow(1 - clamp01(x), 3)
}
function easeIn(x) {
  return clamp01(x) * clamp01(x)
}
function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const k = clamp01(x)
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
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

function digitTexture(ch) {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  ctx.clearRect(0, 0, s, s)
  ctx.fillStyle = NAVY
  ctx.font = '700 190px "Space Grotesk", "Inter", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, s / 2, s / 2 + 10)
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  return tex
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

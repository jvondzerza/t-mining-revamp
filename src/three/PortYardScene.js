import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * PortYardScene — Concept "Instanced port-yard".
 * A low 3/4 view across an endless, fog-faded field of stacked shipping
 * containers (one GPU InstancedMesh, ~10k boxes in a single draw call).
 * A gold "verified" hexagon token hovers over the focal container and
 * periodically stamps a chain-seal ring onto its doors; a warm light
 * sweep crosses the whole yard on a slow loop.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const BG = '#fbfcfe' // page background — distant rows dissolve into it

// muted maritime container palette (reads well on white under fog); the last
// entry is the brand gold, sprinkled rarely as an accent
const PALETTE = ['#1f3a5f', '#34597e', '#4f6f8c', '#2f6b6b', '#7a4b3a', '#5d7184']
const GOLD = new THREE.Color('#bf8f2e')

// container proportions (scene units) — long, low boxes
const CL = 2.2 // length (x)
const CH = 0.56 // height (y)
const CD = 1.0 // depth (z)

export default class PortYardScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._sweepU = null

    this._init()
  }

  _init() {
    const { canvas } = this
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.6 : 2))
    this.renderer.setSize(w, h, false)

    this.scene = new THREE.Scene()
    // fog tuned so far rows melt into the white page
    this.scene.fog = new THREE.Fog(BG, this.mobile ? 14 : 20, this.mobile ? 52 : 78)

    this.camera = new THREE.PerspectiveCamera(this.mobile ? 46 : 38, w / h, 0.1, 200)
    // low 3/4 sweep — look from front-left toward the back-right so the yard's
    // weight sits on the right and the headline (left) stays clean
    this.camBase = new THREE.Vector3(this.mobile ? -2 : -7, this.mobile ? 3.0 : 2.4, this.mobile ? 17 : 15)
    this.camLook = new THREE.Vector3(this.mobile ? 4 : 11, 0.7, -10)
    this.camera.position.copy(this.camBase)
    this.camera.lookAt(this.camLook)

    this._buildLights()
    this._buildGround()
    this._buildYard()
    this._buildFocal()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)

    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _buildLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb6c4d4, 1.05)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(-8, 12, 6)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xcdd9e8, 0.4)
    fill.position.set(10, 6, -4)
    this.scene.add(fill)
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(400, 400)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#dde5ee'),
      roughness: 1,
      metalness: 0,
      fog: true,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    this.scene.add(ground)
  }

  _buildYard() {
    // ---- lay out a grid of container stacks, with aisles every few columns
    const cols = this.mobile ? 34 : 64
    const rows = this.mobile ? 26 : 46
    const cellX = CL + 0.32
    const cellZ = CD + 0.28
    const aisleEvery = 6
    const aisleGap = 1.1

    // precompute x positions with periodic aisle gaps, centred on 0
    const xs = []
    let x = 0
    for (let c = 0; c < cols; c++) {
      xs.push(x)
      x += cellX + (c % aisleEvery === aisleEvery - 1 ? aisleGap : 0)
    }
    const xSpan = xs[xs.length - 1]
    const zSpan = (rows - 1) * cellZ

    // collect instance transforms first so we know the exact count
    const inst = []
    const rand = mulberry32(20240626)
    this._focal = null
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < 0.14) continue // gaps — an active, lived-in yard
        const px = xs[c] - xSpan / 2
        const pz = r * cellZ - zSpan + 6 // near rows around z=+6, receding to -
        const maxStack = 1 + Math.floor(rand() * rand() * 5) // skewed low
        for (let s = 0; s < maxStack; s++) {
          inst.push({ x: px, y: CH / 2 + s * CH, z: pz, c, r, s })
        }
        // remember a near, right-of-centre stack-top as the "verified" hero box
        const top = inst[inst.length - 1]
        if (!this._focal && pz > 2.5 && px > xSpan * 0.06 && px < xSpan * 0.2 && maxStack >= 2) {
          this._focal = { x: px, y: CH / 2 + (maxStack - 1) * CH, z: pz, top }
        }
      }
    }
    this._count = inst.length

    const geo = new THREE.BoxGeometry(CL, CH, CD)
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.08 })
    // inject a travelling warm light-sweep keyed off world-X
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSweep = { value: -40 }
      shader.uniforms.uSweepColor = { value: new THREE.Color('#e8c98a') }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;'
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uSweep;\nuniform vec3 uSweepColor;\nvarying vec3 vWPos;'
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n float sw = smoothstep(3.5, 0.0, abs(vWPos.x - uSweep));\n totalEmissiveRadiance += uSweepColor * sw * sw * 0.55;'
        )
      this._sweepU = shader.uniforms
    }

    const mesh = new THREE.InstancedMesh(geo, mat, this._count)
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)

    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const scl = new THREE.Vector3(1, 1, 1)
    const pos = new THREE.Vector3()
    const col = new THREE.Color()
    inst.forEach((it, i) => {
      pos.set(it.x, it.y, it.z)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
      // colour: palette pick with slight value jitter; rare gold accents
      if (rand() < 0.045) col.copy(GOLD)
      else col.set(PALETTE[(Math.random() * PALETTE.length) | 0])
      const jitter = 0.88 + rand() * 0.24
      col.multiplyScalar(jitter)
      mesh.setColorAt(i, col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    this.yard = mesh
    this.scene.add(mesh)

    // fallback focal if the search above found nothing
    if (!this._focal) this._focal = { x: xSpan * 0.12, y: CH * 1.5, z: 4, top: null }
  }

  _buildFocal() {
    const f = this._focal
    this.focalGroup = new THREE.Group()
    this.focalGroup.position.set(f.x, f.y, f.z)
    this.scene.add(this.focalGroup)

    // hovering gold hexagon "verified" token (flat hex disc, slight bevel glow)
    const hexGeo = new THREE.CircleGeometry(0.42, 6)
    const hexMat = new THREE.MeshStandardMaterial({
      color: GOLD,
      emissive: new THREE.Color('#7a5a18'),
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
      fog: false,
    })
    this.token = new THREE.Mesh(hexGeo, hexMat)
    this.token.rotation.x = -Math.PI / 2.1
    this.token.position.y = 0.9
    this.focalGroup.add(this.token)

    // inner ring detail on the token
    const ringGeo = new THREE.RingGeometry(0.22, 0.3, 6)
    const ringMat = new THREE.MeshBasicMaterial({ color: '#fff4d8', transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false })
    const tokenRing = new THREE.Mesh(ringGeo, ringMat)
    tokenRing.position.z = 0.01
    this.token.add(tokenRing)

    // the expanding "seal stamp" ring that pulses out across the doors
    const sealGeo = new THREE.RingGeometry(0.45, 0.58, 48)
    this.sealMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false })
    this.seal = new THREE.Mesh(sealGeo, this.sealMat)
    this.seal.rotation.x = -Math.PI / 2.1
    this.seal.position.y = 0.05
    this.focalGroup.add(this.seal)

    // a soft glow sprite behind the token for legibility on white
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialGlow(), color: GOLD, transparent: true, opacity: 0.5, depthWrite: false, fog: false })
    )
    glow.scale.set(2.4, 2.4, 1)
    glow.position.y = 0.9
    this.focalGroup.add(glow)
    this._tokenGlow = glow
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

    // gentle idle dolly + pointer parallax on the camera
    const px = this.pointer.x
    const py = this.pointer.y
    this.camera.position.x = this.camBase.x + Math.sin(t * 0.08) * 1.4 + px * 1.6
    this.camera.position.y = this.camBase.y - py * 0.8
    this.camera.position.z = this.camBase.z + Math.cos(t * 0.06) * 0.8
    this.camera.lookAt(this.camLook.x + px * 1.2, this.camLook.y, this.camLook.z)

    // sweep travels across the yard width on a slow loop
    if (this._sweepU) {
      const span = 60
      this._sweepU.uSweep.value = ((t * 7) % (span * 2)) - span
    }

    // focal token: bob, slow spin, periodic "stamp" → seal ring expands
    if (this.token) {
      this.token.rotation.z = t * 0.5
      const bob = Math.sin(t * 1.6) * 0.06
      this.token.position.y = 0.9 + bob
      this._tokenGlow.position.y = 0.9 + bob
      const pulse = 0.5 + Math.sin(t * 1.6) * 0.5
      this.token.material.emissiveIntensity = 0.4 + pulse * 0.5
      this._tokenGlow.material.opacity = 0.35 + pulse * 0.25

      // stamp cycle every ~5s
      const cycle = (t % 5) / 5
      const k = Math.min(1, cycle / 0.5) // 0→1 over first half, then hold
      const out = easeOutCubic(k)
      this.seal.scale.setScalar(0.6 + out * 2.4)
      this.sealMat.opacity = (1 - out) * 0.7 * (cycle < 0.5 ? 1 : 0)
    }

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
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((mm) => {
          if (mm.map) mm.map.dispose()
          mm.dispose()
        })
      }
    })
    this.renderer.dispose()
  }
}

/* ---------- helpers ---------- */

// deterministic PRNG so the yard layout is stable across reloads
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}

// a soft radial-gradient sprite texture for the token glow
function radialGlow() {
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.3, 'rgba(255,225,160,0.55)')
  g.addColorStop(1, 'rgba(255,225,160,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(cv)
  return tex
}

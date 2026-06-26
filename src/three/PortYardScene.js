import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import containerUrl from '../assets/container.glb?url'

/* ------------------------------------------------------------------ *
 * PortYardScene — Concept "Instanced port-yard".
 * A low 3/4 view across an endless, fog-faded field of stacked shipping
 * containers. A single low-poly container model (super_low_poly_container
 * .glb) is GPU-instanced thousands of times, grouped by carrier so each
 * group wears a real livery — MSC, CMA CGM, Hapag-Lloyd and DP World (the
 * container operators from the marquee), plus neutral grey for generic /
 * leased boxes. Each carrier's textures are baked once: the red source is
 * recoloured to the livery and the side gets the carrier name stencilled
 * on. A warm light-sweep crosses the yard.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const BG = '#fbfcfe' // page background — distant rows dissolve into it

const CL = 2.2 // target container length (scene units) — sets the overall scale

export default class PortYardScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._disposed = false
    this.yardMeshes = []

    // shared shader uniforms (live refs handed to every yard material)
    this.uSweep = { value: -40 }
    this.uSweepColor = { value: new THREE.Color('#e8c98a') }

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
    this._loadModel() // builds the yard + focal token once the GLB arrives

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
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#dde5ee'), roughness: 1, metalness: 0 })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    this.scene.add(ground)
  }

  _loadModel() {
    new GLTFLoader().load(
      containerUrl,
      (gltf) => {
        if (this._disposed) return
        try {
          const parts = this._prepareModel(gltf)
          const layout = this._computeLayout(CL, parts.H, parts.D)
          this._buildYard(parts, layout)
        } catch (err) {
          if (import.meta.env.DEV) console.warn('[PortYard] model build failed:', err?.message)
          this._buildFallbackYard()
        }
      },
      undefined,
      (err) => {
        if (this._disposed) return
        if (import.meta.env.DEV) console.warn('[PortYard] glb load failed, using boxes:', err?.message)
        this._buildFallbackYard()
      }
    )
  }

  // pull the two primitives (doors + sides) out of the gltf, bake them into a
  // single container that is length-along-X and base-aligned to y = 0
  _prepareModel(gltf) {
    gltf.scene.updateMatrixWorld(true)
    const meshes = []
    gltf.scene.traverse((o) => {
      if (o.isMesh) meshes.push(o)
    })

    // world-space bbox so any export scale is accounted for
    const box = new THREE.Box3()
    meshes.forEach((m) => {
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld)
      g.computeBoundingBox()
      box.union(g.boundingBox)
      g.dispose()
    })
    const size = box.getSize(new THREE.Vector3())
    const lengthRaw = Math.max(size.x, size.z)
    const widthRaw = Math.min(size.x, size.z)
    const s = CL / lengthRaw
    const H = size.y * s
    const D = widthRaw * s
    const rotate = size.z >= size.x // model's long axis is Z → turn it onto X

    // classify the two primitives by their texture aspect: the wide one is the
    // long corrugated side (gets the carrier name), the squarer one is the doors
    let front = null
    let sides = null
    this._sourceTextures = []
    meshes.forEach((m) => {
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld)
      if (rotate) g.rotateY(Math.PI / 2)
      g.scale(s, s, s)
      g.translate(0, H / 2, 0) // sit the base on the ground for clean stacking
      g.computeVertexNormals()
      const tex = m.material.map
      const img = tex?.image
      if (tex) this._sourceTextures.push(tex)
      const part = { geometry: g, image: img, flipY: tex ? tex.flipY : false }
      if (img && img.width / img.height >= 2) sides = part
      else front = part
    })
    if (!front) front = sides
    if (!sides) sides = front

    return { front, sides, H, D }
  }

  _computeLayout(L, H, D) {
    const cols = this.mobile ? 34 : 64
    const rows = this.mobile ? 26 : 46
    const cellX = L + 0.32
    const cellZ = D + 0.3
    const aisleEvery = 6
    const aisleGap = 1.1

    const xs = []
    let x = 0
    for (let c = 0; c < cols; c++) {
      xs.push(x)
      x += cellX + (c % aisleEvery === aisleEvery - 1 ? aisleGap : 0)
    }
    const xSpan = xs[xs.length - 1]
    const zSpan = (rows - 1) * cellZ

    const inst = []
    const rand = mulberry32(20240626)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < 0.14) continue // gaps — an active, lived-in yard
        const px = xs[c] - xSpan / 2
        const pz = r * cellZ - zSpan + 6
        const maxStack = 1 + Math.floor(rand() * rand() * 5)
        for (let s = 0; s < maxStack; s++) inst.push({ x: px, y: s * H, z: pz })
      }
    }
    return { inst }
  }

  _buildYard({ front, sides }, { inst }) {
    // assign each stack-box a carrier, grouped so we can bake one texture set
    // per carrier (livery colour + stencilled name) and instance them together
    const rand = mulberry32(1337)
    const groups = CARRIERS.map(() => [])
    inst.forEach((it) => groups[pickCarrierIndex(rand)].push(it))

    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const scl = new THREE.Vector3(1, 1, 1)
    const pos = new THREE.Vector3()
    const weather = new THREE.Color()

    groups.forEach((items, ci) => {
      if (!items.length) return
      const carrier = CARRIERS[ci]
      const skins = [
        [front.geometry, this._bakeTexture(front, carrier, false)],
        [sides.geometry, this._bakeTexture(sides, carrier, true)],
      ]
      skins.forEach(([geometry, tex]) => {
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0.04 })
        this._patchSweepOnly(mat)
        const mesh = new THREE.InstancedMesh(geometry, mat, items.length)
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
        items.forEach((it, i) => {
          pos.set(it.x, it.y, it.z)
          m.compose(pos, q, scl)
          mesh.setMatrixAt(i, m)
          const v = 0.86 + rand() * 0.2 // subtle per-box weathering
          weather.setRGB(v, v, v)
          mesh.setColorAt(i, weather)
        })
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        mesh.frustumCulled = false
        this.scene.add(mesh)
        this.yardMeshes.push(mesh)
      })
    })

    // the raw red source textures aren't needed once the liveries are baked
    this._sourceTextures?.forEach((t) => t.dispose())
    this._sourceTextures = null
  }

  // box-geometry fallback (only if the glb fails to load) — recoloured per
  // instance in JS so the yard still reads, just without the modelled detail
  _buildFallbackYard() {
    if (this._disposed) return
    const H = 0.78
    const D = 0.78
    const { inst } = this._computeLayout(CL, H, D)
    const count = inst.length

    const geo = new THREE.BoxGeometry(CL, H, D)
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.05 })
    this._patchSweepOnly(mat)
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const scl = new THREE.Vector3(1, 1, 1)
    const pos = new THREE.Vector3()
    const col = new THREE.Color()
    const rand = mulberry32(1337)
    inst.forEach((it, i) => {
      pos.set(it.x, it.y + H / 2, it.z)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
      const carrier = CARRIERS[pickCarrierIndex(rand)]
      col.set(carrier.hex).multiplyScalar(0.85 + rand() * 0.2)
      mesh.setColorAt(i, col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    this.scene.add(mesh)
    this.yardMeshes.push(mesh)
  }

  _patchSweepOnly(mat) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSweep = this.uSweep
      shader.uniforms.uSweepColor = this.uSweepColor
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;'
        )
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSweep;\nuniform vec3 uSweepColor;\nvarying vec3 vWPos;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n float sw = smoothstep(3.5, 0.0, abs(vWPos.x - uSweep));\n totalEmissiveRadiance += uSweepColor * sw * sw * 0.5;'
        )
    }
    mat.needsUpdate = true
  }

  // bake a per-carrier texture: recolour the red source by remapping its
  // luminance onto the carrier livery colour, then stencil the carrier name
  _bakeTexture(part, carrier, withName) {
    const img = part.image
    const w = img.width
    const h = img.height
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    // recolour: source luminance → carrier colour (keeps corrugation + shading)
    const id = ctx.getImageData(0, 0, w, h)
    const d = id.data
    const [cr, cg, cb] = carrier.rgb
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
      const f = Math.min(1.25, 0.32 + lum * 1.9)
      d[i] = Math.min(255, cr * f)
      d[i + 1] = Math.min(255, cg * f)
      d[i + 2] = Math.min(255, cb * f)
    }
    ctx.putImageData(id, 0, 0)

    // stencil the carrier name across the long side
    if (withName && carrier.name) {
      const name = carrier.name.toUpperCase()
      let size = Math.round(h * 0.3)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${size}px 'Space Grotesk','Inter',sans-serif`
      while (ctx.measureText(name).width > w * 0.66 && size > 8) {
        size -= 2
        ctx.font = `700 ${size}px 'Space Grotesk','Inter',sans-serif`
      }
      // the camera-facing long side samples the texture mirrored in U, so
      // pre-mirror the name here to make it read left-to-right in the yard
      ctx.save()
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      ctx.fillStyle = carrier.nameColor
      ctx.globalAlpha = 0.85
      ctx.fillText(name, w / 2, h * 0.5)
      ctx.restore()
    }

    const tex = new THREE.CanvasTexture(cv)
    tex.flipY = part.flipY // match the glTF UV orientation
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
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

    const px = this.pointer.x
    const py = this.pointer.y
    this.camera.position.x = this.camBase.x + Math.sin(t * 0.08) * 1.4 + px * 1.6
    this.camera.position.y = this.camBase.y - py * 0.8
    this.camera.position.z = this.camBase.z + Math.cos(t * 0.06) * 0.8
    this.camera.lookAt(this.camLook.x + px * 1.2, this.camLook.y, this.camLook.z)

    // warm light-sweep travels across the yard width on a loop
    const span = 60
    this.uSweep.value = ((t * 16) % (span * 2)) - span

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
    this._disposed = true
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

// real carrier liveries — the marquee entries that run branded container
// fleets, plus a neutral grey for the generic/leased boxes every yard has.
// `nameColor` is the stencilled name colour (dark on light liveries, light on
// dark ones). Weighted by how common each operator's boxes are. (The other
// marquee names are ports/platforms/roles with no container livery.)
const CARRIERS = [
  { name: 'MSC', hex: '#e0a92e', nameColor: '#2a3140', w: 4 }, // mustard gold
  { name: 'CMA CGM', hex: '#3f7cc2', nameColor: '#ffffff', w: 4 }, // mid blue
  { name: 'Hapag-Lloyd', hex: '#e8631a', nameColor: '#2a1a10', w: 3 }, // orange
  { name: 'DP World', hex: '#1b4a86', nameColor: '#ffffff', w: 3 }, // navy
  { name: null, hex: '#9aa4ae', nameColor: null, w: 4 }, // generic / leased grey
]
CARRIERS.forEach((c) => {
  c.rgb = hexToRgb(c.hex)
})
const CARRIER_TOTAL = CARRIERS.reduce((a, b) => a + b.w, 0)

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// pick a weighted carrier index
function pickCarrierIndex(rand) {
  let r = rand() * CARRIER_TOTAL
  for (let i = 0; i < CARRIERS.length; i++) {
    if (r < CARRIERS[i].w) return i
    r -= CARRIERS[i].w
  }
  return 0
}

// deterministic PRNG so the yard layout + colours are stable across reloads
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


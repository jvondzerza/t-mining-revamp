import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import containerUrl from '../assets/container.glb?url'

/* ------------------------------------------------------------------ *
 * PortYardScene — Concept "Instanced port-yard".
 * A low 3/4 view across an endless, fog-faded field of stacked shipping
 * containers. A single low-poly container model (super_low_poly_container
 * .glb) is GPU-instanced thousands of times in two draw calls (its doors
 * + its sides), and each instance is recoloured by a per-instance
 * HSV hue-shift baked into the material — so one red model becomes a
 * whole varied maritime fleet. A gold "verified" hexagon token hovers
 * over the focal stack and stamps a chain-seal ring on a loop; a warm
 * light-sweep crosses the yard.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const BG = '#fbfcfe' // page background — distant rows dissolve into it
const GOLD = new THREE.Color('#bf8f2e')

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
          this._buildFocal(layout.focal)
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

    const baked = meshes.map((m) => {
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld)
      if (rotate) g.rotateY(Math.PI / 2)
      g.scale(s, s, s)
      g.translate(0, H / 2, 0) // sit the base on the ground for clean stacking
      g.computeVertexNormals()
      return { geometry: g, material: m.material }
    })

    return { parts: baked, H, D }
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
    let focal = null
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < 0.14) continue // gaps — an active, lived-in yard
        const px = xs[c] - xSpan / 2
        const pz = r * cellZ - zSpan + 6
        const maxStack = 1 + Math.floor(rand() * rand() * 5)
        for (let s = 0; s < maxStack; s++) inst.push({ x: px, y: s * H, z: pz })
        if (!focal && pz > 2.5 && px > xSpan * 0.06 && px < xSpan * 0.2 && maxStack >= 2) {
          focal = { x: px, y: maxStack * H, z: pz }
        }
      }
    }
    if (!focal) focal = { x: xSpan * 0.12, y: H * 2, z: 4 }
    return { inst, focal, rand }
  }

  _buildYard({ parts }, { inst }) {
    const count = inst.length

    // per-instance HSV recolour attributes (one red model → a varied fleet)
    const aHue = new Float32Array(count)
    const aSat = new Float32Array(count)
    const aVal = new Float32Array(count)
    const rand = mulberry32(1337)
    for (let i = 0; i < count; i++) {
      const c = pickColor(rand)
      aHue[i] = c.h
      aSat[i] = c.s
      aVal[i] = c.v
    }

    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const scl = new THREE.Vector3(1, 1, 1)
    const pos = new THREE.Vector3()

    parts.forEach(({ geometry, material }) => {
      geometry.setAttribute('aHue', new THREE.InstancedBufferAttribute(aHue, 1))
      geometry.setAttribute('aSat', new THREE.InstancedBufferAttribute(aSat, 1))
      geometry.setAttribute('aVal', new THREE.InstancedBufferAttribute(aVal, 1))
      this._patchMaterial(material)

      const mesh = new THREE.InstancedMesh(geometry, material, count)
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
      inst.forEach((it, i) => {
        pos.set(it.x, it.y, it.z)
        m.compose(pos, q, scl)
        mesh.setMatrixAt(i, m)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.frustumCulled = false
      this.scene.add(mesh)
      this.yardMeshes.push(mesh)
    })
  }

  // box-geometry fallback (only if the glb fails to load) — recoloured per
  // instance in JS so the yard still reads, just without the modelled detail
  _buildFallbackYard() {
    if (this._disposed) return
    const H = 0.78
    const D = 0.78
    const layout = this._computeLayout(CL, H, D)
    const { inst, focal } = layout
    const count = inst.length

    const geo = new THREE.BoxGeometry(CL, H, D)
    geo.translate(0, 0, 0)
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
      const c = pickColor(rand)
      col.setHSL(c.h, c.s * 0.85, 0.26 + c.v * 0.16)
      mesh.setColorAt(i, col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    this.scene.add(mesh)
    this.yardMeshes.push(mesh)
    this._buildFocal(focal)
  }

  // inject the per-instance hue-shift recolour + the travelling light-sweep
  _patchMaterial(mat) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSweep = this.uSweep
      shader.uniforms.uSweepColor = this.uSweepColor
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute float aHue; attribute float aSat; attribute float aVal;
           varying vec3 vWPos; varying float vHue; varying float vSat; varying float vVal;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
           vHue = aHue; vSat = aSat; vVal = aVal;`
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uSweep; uniform vec3 uSweepColor;
           varying vec3 vWPos; varying float vHue; varying float vSat; varying float vVal;
           vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}
           vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);}`
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           {
             vec3 hsv = rgb2hsv(diffuseColor.rgb);
             hsv.x = vHue;
             hsv.y = clamp(hsv.y * vSat, 0.0, 1.0);
             hsv.z = clamp(hsv.z * vVal, 0.0, 1.0);
             diffuseColor.rgb = hsv2rgb(hsv);
           }`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float sw = smoothstep(3.5, 0.0, abs(vWPos.x - uSweep));
           totalEmissiveRadiance += uSweepColor * sw * sw * 0.5;`
        )
    }
    mat.needsUpdate = true
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

  _buildFocal(focal) {
    if (this._disposed) return
    this.focalGroup = new THREE.Group()
    this.focalGroup.position.set(focal.x, focal.y, focal.z)
    this.scene.add(this.focalGroup)

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

    const ringGeo = new THREE.RingGeometry(0.22, 0.3, 6)
    const ringMat = new THREE.MeshBasicMaterial({ color: '#fff4d8', transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false })
    const tokenRing = new THREE.Mesh(ringGeo, ringMat)
    tokenRing.position.z = 0.01
    this.token.add(tokenRing)

    const sealGeo = new THREE.RingGeometry(0.45, 0.58, 48)
    this.sealMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false })
    this.seal = new THREE.Mesh(sealGeo, this.sealMat)
    this.seal.rotation.x = -Math.PI / 2.1
    this.seal.position.y = 0.05
    this.focalGroup.add(this.seal)

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

    const px = this.pointer.x
    const py = this.pointer.y
    this.camera.position.x = this.camBase.x + Math.sin(t * 0.08) * 1.4 + px * 1.6
    this.camera.position.y = this.camBase.y - py * 0.8
    this.camera.position.z = this.camBase.z + Math.cos(t * 0.06) * 0.8
    this.camera.lookAt(this.camLook.x + px * 1.2, this.camLook.y, this.camLook.z)

    // sweep travels across the yard width on a slow loop
    const span = 60
    this.uSweep.value = ((t * 7) % (span * 2)) - span

    if (this.token) {
      this.token.rotation.z = t * 0.5
      const bob = Math.sin(t * 1.6) * 0.06
      this.token.position.y = 0.9 + bob
      this._tokenGlow.position.y = 0.9 + bob
      const pulse = 0.5 + Math.sin(t * 1.6) * 0.5
      this.token.material.emissiveIntensity = 0.4 + pulse * 0.5
      this._tokenGlow.material.opacity = 0.35 + pulse * 0.25

      const cycle = (t % 5) / 5
      const k = Math.min(1, cycle / 0.5)
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

// weighted maritime hue palette — mostly blues/teals, rare rust + gold accents.
// returns { h: hue 0..1, s: saturation multiplier, v: value multiplier }
const HUE_TABLE = [
  { h: [0.58, 0.63], s: [0.62, 0.82], v: [0.95, 1.08], w: 5 }, // deep blue
  { h: [0.54, 0.58], s: [0.62, 0.8], v: [0.95, 1.08], w: 4 }, // steel blue
  { h: [0.48, 0.53], s: [0.6, 0.8], v: [0.95, 1.08], w: 3 }, // teal
  { h: [0.6, 0.64], s: [0.4, 0.55], v: [1.0, 1.14], w: 3 }, // slate (paler, for contrast)
  { h: [0.44, 0.48], s: [0.55, 0.72], v: [0.9, 1.02], w: 2 }, // green-teal
  { h: [0.02, 0.06], s: [0.6, 0.78], v: [0.85, 0.98], w: 1.4 }, // rust
  { h: [0.1, 0.13], s: [0.82, 0.98], v: [1.02, 1.16], w: 1.2 }, // gold accent
]
const HUE_TOTAL = HUE_TABLE.reduce((a, b) => a + b.w, 0)

function pickColor(rand) {
  let r = rand() * HUE_TOTAL
  let row = HUE_TABLE[0]
  for (const e of HUE_TABLE) {
    if (r < e.w) {
      row = e
      break
    }
    r -= e.w
  }
  const lerp = (a, b) => a + (b - a) * rand()
  return { h: lerp(row.h[0], row.h[1]), s: lerp(row.s[0], row.s[1]), v: lerp(row.v[0], row.v[1]) }
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

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}

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
  return new THREE.CanvasTexture(cv)
}

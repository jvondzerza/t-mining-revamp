import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * LivingLedgerScene — Concept "Living ledger".
 * An evolution of the dot-globe: packets of light run the shipping
 * lanes, and each completed route mints a block that snaps onto a
 * luminous chain orbiting the planet — the ledger writing itself.
 * Reuses the globe / arcs / port-node language of the current hero.
 *
 * Drop-in replacement for GlobeScene: same public interface
 * (constructor(canvas, { mobile }), setPointer, pause, resume, dispose).
 * ------------------------------------------------------------------ */

const R = 1.6

const HUBS = [
  [51.22, 4.4], [51.95, 4.13], [53.55, 9.99], [51.95, 1.32], [39.45, -0.33],
  [35.76, -5.83], [25.27, 55.3], [1.35, 103.82], [31.23, 121.47], [22.32, 114.17],
  [35.1, 129.04], [35.65, 139.84], [-33.86, 151.2], [19.07, 72.87], [-29.86, 31.02],
  [-23.96, -46.33], [9.08, -79.68], [33.74, -118.27], [40.7, -74.0],
]
const ROUTES = [
  [0, 7], [0, 8], [0, 17], [0, 18], [0, 16], [0, 14], [0, 6], [0, 12],
  [1, 8], [2, 7], [3, 18], [5, 15], [7, 12], [7, 9], [8, 17], [10, 11],
  [6, 13], [4, 16], [15, 14], [9, 12], [17, 16], [2, 6],
]

const NAVY = '#16365f'
const COBALT = new THREE.Color('#2456e6')
const GOLD = new THREE.Color('#bf8f2e')

export default class LivingLedgerScene {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas
    this.mobile = mobile
    this.pointer = new THREE.Vector2(0, 0)
    this.target = new THREE.Vector2(0, 0)
    this.clock = new THREE.Clock()
    this.running = true
    this._raf = null
    this._init()
  }

  _init() {
    const { canvas } = this
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h, false)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100)
    this.camera.position.set(0, 0.1, this.mobile ? 6.6 : 6.3)

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(-3, 4, 5)
    this.scene.add(key)

    this.baseOffsetX = this.mobile ? 0.05 : 1.12
    this.baseOffsetY = this.mobile ? 0.62 : 0.08

    this.group = new THREE.Group()
    this.group.rotation.x = 0.12
    this.group.position.set(this.baseOffsetX, this.baseOffsetY, 0)
    this.scene.add(this.group)

    // planet spins on its own; ledger orbits independently
    this.planet = new THREE.Group()
    this.planet.rotation.y = -0.6
    this.group.add(this.planet)

    this._buildGlobe()
    this._buildHubs()
    this._buildRoutes() // also stores polylines for packets
    this._buildArcs()
    this._buildPackets()
    this._buildLedger()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _buildGlobe() {
    const count = this.mobile ? 2200 : 3400
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fibSphere(count, R)), 3))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(NAVY) },
        uSize: { value: (this.mobile ? 2.3 : 2.7) * this.renderer.getPixelRatio() },
      },
      vertexShader: `uniform float uTime;uniform float uSize;varying float vTw;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);
        float tw=sin(uTime*1.5+position.x*6.0+position.y*4.0)*0.5+0.5;vTw=tw;
        gl_PointSize=uSize*(0.7+tw*0.5)*(5.8/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uColor;varying float vTw;
        void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;
        float a=smoothstep(0.5,0.05,d)*(0.3+vTw*0.32);gl_FragColor=vec4(uColor,a);}`,
    })
    this.globe = new THREE.Points(geo, mat)
    this.planet.add(this.globe)

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.99, 48, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#eef3f9') })
    )
    this.planet.add(shell)
  }

  _buildHubs() {
    const geo = new THREE.BufferGeometry()
    const pos = []
    HUBS.forEach(([lat, lng]) => {
      const v = llToVec3(lat, lng, R * 1.005)
      pos.push(v.x, v.y, v.z)
    })
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: GOLD.clone() },
        uSize: { value: 8.5 * this.renderer.getPixelRatio() },
      },
      vertexShader: `uniform float uTime;uniform float uSize;varying float vP;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);
        float pulse=sin(uTime*2.2+position.z*3.0)*0.5+0.5;vP=pulse;
        gl_PointSize=uSize*(0.8+pulse*0.6)*(5.8/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uColor;varying float vP;
        void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;
        float core=smoothstep(0.5,0.0,d);float glow=smoothstep(0.5,0.2,d)*0.5;
        gl_FragColor=vec4(uColor,(core*(0.6+vP*0.4)+glow));}`,
    })
    this.hubs = new THREE.Points(geo, mat)
    this.planet.add(this.hubs)
  }

  // precompute each route's lifted polyline (shared by the arcs + the packets)
  _buildRoutes() {
    const SEG = this.mobile ? 40 : 60
    this.routeRings = []
    const n0 = new THREE.Vector3()
    const n1 = new THREE.Vector3()
    const cur = new THREE.Vector3()
    ROUTES.forEach((route) => {
      const a = llToVec3(...HUBS[route[0]]).normalize()
      const b = llToVec3(...HUBS[route[1]]).normalize()
      n0.copy(a)
      n1.copy(b)
      const alt = 0.18 + a.distanceTo(b) * 0.22
      const ring = []
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG
        slerp(n0, n1, t, cur)
        cur.normalize()
        ring.push(cur.clone().multiplyScalar(R * (1 + alt * Math.sin(Math.PI * t))))
      }
      this.routeRings.push(ring)
    })
    this._SEG = SEG
  }

  _buildArcs() {
    const SEG = this._SEG
    const positions = []
    const progress = []
    const seeds = []
    this.routeRings.forEach((ring, ri) => {
      const seed = ri / ROUTES.length
      for (let i = 0; i < SEG; i++) {
        const p = ring[i]
        const q = ring[i + 1]
        positions.push(p.x, p.y, p.z, q.x, q.y, q.z)
        progress.push(i / SEG, (i + 1) / SEG)
        seeds.push(seed, seed)
      }
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1))
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uBase: { value: new THREE.Color('#6a82c8') }, uBright: { value: GOLD.clone() } },
      vertexShader: `attribute float aProgress;attribute float aSeed;varying float vP;varying float vS;
        void main(){vP=aProgress;vS=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float uTime;uniform vec3 uBase;uniform vec3 uBright;varying float vP;varying float vS;
        void main(){float base=0.2;float head=fract(vP-uTime*0.13+vS*1.7);float pulse=smoothstep(0.12,0.0,head);
        vec3 col=mix(uBase,uBright,pulse);gl_FragColor=vec4(col,base+pulse*0.9);}`,
    })
    this.arcs = new THREE.LineSegments(geo, mat)
    this.planet.add(this.arcs)
  }

  _buildPackets() {
    const tex = radialGlow()
    this._packetTex = tex
    const N = this.mobile ? 7 : 11
    this.packets = []
    for (let i = 0; i < N; i++) {
      const gold = i % 3 === 0
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          color: gold ? GOLD.clone() : COBALT.clone(),
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      const s = gold ? 0.34 : 0.26
      spr.scale.set(s, s, 1)
      this.planet.add(spr)
      this.packets.push({
        spr,
        route: (Math.random() * ROUTES.length) | 0,
        t: Math.random(),
        speed: 0.08 + Math.random() * 0.09,
        delay: Math.random() * 2,
        gold,
      })
    }
  }

  _buildLedger() {
    this.ledger = new THREE.Group()
    this.ledger.rotation.x = 0.62 // incline the orbit
    this.ledger.rotation.z = -0.18
    this.group.add(this.ledger)

    this.MAX = this.mobile ? 40 : 56
    this.Rr = R * 1.5
    this.da = (Math.PI * 2) / this.MAX
    this.a0 = -Math.PI / 2
    this.blockBirth = new Float32Array(this.MAX)
    this.blockFinal = new Uint8Array(this.MAX)
    this.blockCount = 0
    this.ledgerState = 'fill'
    this.ledgerTimer = 0
    this.ledgerOpacity = 1

    // faint luminous chain path the blocks ride on
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(this.Rr, 0.01, 8, 220),
      new THREE.MeshBasicMaterial({ color: COBALT.clone(), transparent: true, opacity: 0.28 })
    )
    torus.rotation.x = Math.PI / 2
    this.ledger.add(torus)
    this.chainRing = torus

    // the minted blocks (one instanced mesh, hidden until popped in) — a faint
    // cobalt self-glow keeps the little beads legible on the white ground
    const geo = new THREE.BoxGeometry(0.27, 0.18, 0.18)
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.4, transparent: true, opacity: 1, emissive: new THREE.Color('#16306e'), emissiveIntensity: 0.6 })
    this.blocks = new THREE.InstancedMesh(geo, mat, this.MAX)
    this.blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const hidden = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001)
    for (let i = 0; i < this.MAX; i++) {
      this.blocks.setMatrixAt(i, hidden)
      this.blocks.setColorAt(i, COBALT)
    }
    this.blocks.instanceMatrix.needsUpdate = true
    this.ledger.add(this.blocks)

    this._m = new THREE.Matrix4()
    this._q = new THREE.Quaternion()
    this._e = new THREE.Euler()
    this._p = new THREE.Vector3()
    this._s = new THREE.Vector3()
    this._c = new THREE.Color()
  }

  _setBlock(k, scale) {
    const a = this.a0 + k * this.da
    this._p.set(Math.cos(a) * this.Rr, 0, Math.sin(a) * this.Rr)
    this._e.set(0, -a, 0)
    this._q.setFromEuler(this._e)
    this._s.setScalar(scale)
    this._m.compose(this._p, this._q, this._s)
    this.blocks.setMatrixAt(k, this._m)
  }

  _mintBlock(t) {
    if (this.blockCount >= this.MAX) return
    const k = this.blockCount
    this.blockBirth[k] = t
    this.blockFinal[k] = 0
    this._setBlock(k, 0.0001)
    this.blockCount++
    this.blocks.instanceMatrix.needsUpdate = true
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

    this.planet.rotation.y += 0.0015
    this.group.rotation.x = 0.12 + this.pointer.y * 0.16
    this.group.position.x = this.baseOffsetX + this.pointer.x * 0.14
    this.group.position.y = this.baseOffsetY - this.pointer.y * 0.08

    this.globe.material.uniforms.uTime.value = t
    this.hubs.material.uniforms.uTime.value = t
    this.arcs.material.uniforms.uTime.value = t

    this._updatePackets(t)
    this._updateLedger(t)

    this.renderer.render(this.scene, this.camera)
  }

  _updatePackets(t) {
    const step = 1 / 60
    this.packets.forEach((pk) => {
      if (pk.delay > 0) {
        pk.delay -= step
        pk.spr.material.opacity = 0
        return
      }
      pk.t += pk.speed * step
      if (pk.t >= 1) {
        // arrived → mint a ledger block, then respawn on a fresh route
        if (this.ledgerState === 'fill') this._mintBlock(t)
        pk.t = 0
        pk.route = (Math.random() * ROUTES.length) | 0
        pk.delay = 0.3 + Math.random() * 2.2
        pk.speed = 0.08 + Math.random() * 0.09
      }
      const ring = this.routeRings[pk.route]
      const f = pk.t * (ring.length - 1)
      const i = Math.floor(f)
      const frac = f - i
      const p0 = ring[i]
      const p1 = ring[Math.min(ring.length - 1, i + 1)]
      pk.spr.position.lerpVectors(p0, p1, frac)
      // brighten in the middle of the run, fade at the ends
      pk.spr.material.opacity = Math.sin(pk.t * Math.PI) * 0.95
    })
  }

  _updateLedger(t) {
    this.ledger.rotation.y += 0.0011

    // pop-in + fresh-mint colour for recently added blocks
    let dirty = false
    let colorDirty = false
    for (let k = Math.max(0, this.blockCount - 8); k < this.blockCount; k++) {
      const age = t - this.blockBirth[k]
      if (age < 0.55) {
        this._setBlock(k, easeOutBack(age / 0.55) * 1.0)
        dirty = true
      } else if (!this.blockFinal[k]) {
        this._setBlock(k, 1)
        this.blockFinal[k] = 1
        dirty = true
      }
      if (age < 1.6) {
        // fresh-minted blocks glow gold, then settle to cobalt
        const f = clamp01(age / 1.6)
        this._c.copy(GOLD).lerp(COBALT, f)
        this.blocks.setColorAt(k, this._c)
        colorDirty = true
      }
    }
    if (dirty) this.blocks.instanceMatrix.needsUpdate = true
    if (colorDirty && this.blocks.instanceColor) this.blocks.instanceColor.needsUpdate = true

    // simple loop: fill → hold → fade → reset, so the ledger keeps "writing"
    if (this.ledgerState === 'fill' && this.blockCount >= this.MAX) {
      this.ledgerState = 'hold'
      this.ledgerTimer = t
    } else if (this.ledgerState === 'hold' && t - this.ledgerTimer > 3.2) {
      this.ledgerState = 'fade'
      this.ledgerTimer = t
    } else if (this.ledgerState === 'fade') {
      const f = clamp01((t - this.ledgerTimer) / 1.3)
      this.ledgerOpacity = 1 - f
      if (f >= 1) {
        // reset to an empty chain and start a new epoch
        this.blockCount = 0
        this.blockFinal.fill(0)
        const hidden = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001)
        for (let i = 0; i < this.MAX; i++) this.blocks.setMatrixAt(i, hidden)
        this.blocks.instanceMatrix.needsUpdate = true
        this.ledgerState = 'fill'
        this.ledgerOpacity = 1
      }
    } else if (this.ledgerState === 'fill') {
      this.ledgerOpacity = Math.min(1, this.ledgerOpacity + 0.05)
    }
    this.blocks.material.opacity = this.ledgerOpacity
    this.chainRing.material.opacity = 0.28 * this.ledgerOpacity
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    this._packetTex?.dispose()
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
function llToVec3(lat, lng, radius = R) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
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
function slerp(n0, n1, t, out) {
  const dot = THREE.MathUtils.clamp(n0.dot(n1), -1, 1)
  const omega = Math.acos(dot)
  const so = Math.sin(omega)
  if (so < 1e-5) return out.copy(n0)
  const a = Math.sin((1 - t) * omega) / so
  const b = Math.sin(t * omega) / so
  return out.set(a * n0.x + b * n1.x, a * n0.y + b * n1.y, a * n0.z + b * n1.z)
}
function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const k = clamp01(x)
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
}
function radialGlow() {
  const s = 96
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(cv)
}

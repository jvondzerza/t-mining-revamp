import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * GlobeScene — an abstract dot-globe wrapped in animated great-circle
 * "trade routes". Each arc carries a travelling pulse of light, evoking
 * secure data flowing between ports across T-Mining's global network.
 * Plain three.js (no r3f) for full control + zero version coupling.
 * ------------------------------------------------------------------ */

const R = 1.6

// lat/lng of major maritime hubs — Antwerp (HQ) is index 0
const HUBS = [
  [51.22, 4.4], // Antwerp
  [51.95, 4.13], // Rotterdam
  [53.55, 9.99], // Hamburg
  [51.95, 1.32], // Felixstowe
  [39.45, -0.33], // Valencia
  [35.76, -5.83], // Tanger Med
  [25.27, 55.3], // Dubai
  [1.35, 103.82], // Singapore
  [31.23, 121.47], // Shanghai
  [22.32, 114.17], // Hong Kong
  [35.1, 129.04], // Busan
  [35.65, 139.84], // Tokyo
  [-33.86, 151.2], // Sydney
  [19.07, 72.87], // Mumbai
  [-29.86, 31.02], // Durban
  [-23.96, -46.33], // Santos
  [9.08, -79.68], // Panama
  [33.74, -118.27], // Los Angeles
  [40.7, -74.0], // New York
]

// route pairs (index into HUBS) — many radiate from Antwerp
const ROUTES = [
  [0, 7], [0, 8], [0, 17], [0, 18], [0, 16], [0, 14], [0, 6], [0, 12],
  [1, 8], [2, 7], [3, 18], [5, 15], [7, 12], [7, 9], [8, 17], [10, 11],
  [6, 13], [4, 16], [15, 14], [9, 12], [17, 16], [2, 6],
]

function llToVec3(lat, lng, radius = R) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// fibonacci sphere — even point distribution for the dot globe
function fibSphere(count, radius) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = golden * i
    pts.push(
      Math.cos(t) * r * radius,
      y * radius,
      Math.sin(t) * r * radius
    )
  }
  return pts
}

// slerp between two unit vectors
function slerp(n0, n1, t, out) {
  const dot = THREE.MathUtils.clamp(n0.dot(n1), -1, 1)
  const omega = Math.acos(dot)
  const so = Math.sin(omega)
  if (so < 1e-5) return out.copy(n0)
  const a = Math.sin((1 - t) * omega) / so
  const b = Math.sin(t * omega) / so
  return out.set(
    a * n0.x + b * n1.x,
    a * n0.y + b * n1.y,
    a * n0.z + b * n1.z
  )
}

export default class GlobeScene {
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

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h, false)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100)
    this.camera.position.set(0, 0.1, this.mobile ? 6.1 : 5.95)

    // push the globe toward the right on desktop so the headline reads clean;
    // on mobile lift it into the upper area, leaving the lower half for copy
    this.baseOffsetX = this.mobile ? 0.05 : 1.12
    this.baseOffsetY = this.mobile ? 0.62 : 0.08

    this.group = new THREE.Group()
    this.group.rotation.y = -0.6
    this.group.rotation.x = 0.12
    this.group.position.set(this.baseOffsetX, this.baseOffsetY, 0)
    this.scene.add(this.group)

    this._buildGlobe()
    this._buildHubs()
    this._buildArcs()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)

    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _buildGlobe() {
    const count = this.mobile ? 2200 : 3400
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(fibSphere(count, R))
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#16365f') },
        uSize: { value: (this.mobile ? 2.3 : 2.7) * this.renderer.getPixelRatio() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        varying float vTw;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // twinkle based on position + time
          float tw = sin(uTime * 1.5 + position.x * 6.0 + position.y * 4.0) * 0.5 + 0.5;
          vTw = tw;
          // crisp small points with gentle perspective depth
          gl_PointSize = uSize * (0.7 + tw * 0.5) * (5.8 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vTw;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.05, d) * (0.3 + vTw * 0.32);
          gl_FragColor = vec4(uColor, a);
        }
      `,
    })

    this.globe = new THREE.Points(geo, mat)
    this.group.add(this.globe)

    // opaque, near-background shell occludes the back-facing dots so the globe
    // reads as a solid sphere (subtle shading) rather than a busy see-through ball
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.99, 48, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#eef3f9') })
    )
    this.group.add(shell)
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
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#bf8f2e') },
        uSize: { value: 8.5 * this.renderer.getPixelRatio() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        varying float vP;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float pulse = sin(uTime * 2.2 + position.z * 3.0) * 0.5 + 0.5;
          vP = pulse;
          gl_PointSize = uSize * (0.8 + pulse * 0.6) * (5.8 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vP;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.2, d) * 0.5;
          gl_FragColor = vec4(uColor, (core * (0.6 + vP * 0.4) + glow));
        }
      `,
    })

    this.hubs = new THREE.Points(geo, mat)
    this.group.add(this.hubs)
  }

  _buildArcs() {
    const SEG = this.mobile ? 40 : 60
    const positions = []
    const progress = []
    const seeds = []

    const n0 = new THREE.Vector3()
    const n1 = new THREE.Vector3()
    const cur = new THREE.Vector3()

    ROUTES.forEach((route, ri) => {
      const a = llToVec3(...HUBS[route[0]]).normalize()
      const b = llToVec3(...HUBS[route[1]]).normalize()
      n0.copy(a)
      n1.copy(b)
      const dist = a.distanceTo(b)
      const alt = 0.18 + dist * 0.22
      const seed = ri / ROUTES.length

      const ring = []
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG
        slerp(n0, n1, t, cur)
        cur.normalize()
        const lift = R * (1 + alt * Math.sin(Math.PI * t))
        ring.push(cur.clone().multiplyScalar(lift))
      }
      // emit as line segments (pairs)
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
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uBase: { value: new THREE.Color('#6a82c8') },
        uBright: { value: new THREE.Color('#bf8f2e') },
      },
      vertexShader: /* glsl */ `
        attribute float aProgress;
        attribute float aSeed;
        varying float vProgress;
        varying float vSeed;
        void main() {
          vProgress = aProgress;
          vSeed = aSeed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uBase;
        uniform vec3 uBright;
        varying float vProgress;
        varying float vSeed;
        void main() {
          // base faint line
          float base = 0.2;
          // travelling pulse head
          float head = fract(vProgress - uTime * 0.13 + vSeed * 1.7);
          float pulse = smoothstep(0.12, 0.0, head);
          // fade pulse near endpoints so it "arrives"
          vec3 col = mix(uBase, uBright, pulse);
          float a = base + pulse * 0.9;
          gl_FragColor = vec4(col, a);
        }
      `,
    })

    this.arcs = new THREE.LineSegments(geo, mat)
    this.group.add(this.arcs)
  }

  setPointer(nx, ny) {
    this.target.set(nx, ny)
  }

  animate() {
    if (!this.running) return
    this._raf = requestAnimationFrame(this.animate)

    const t = this.clock.getElapsedTime()

    // ease pointer
    this.pointer.x += (this.target.x - this.pointer.x) * 0.05
    this.pointer.y += (this.target.y - this.pointer.y) * 0.05

    this.group.rotation.y += 0.0015
    this.group.rotation.x = 0.12 + this.pointer.y * 0.16
    this.group.position.x = this.baseOffsetX + this.pointer.x * 0.14
    this.group.position.y = this.baseOffsetY - this.pointer.y * 0.08

    this.globe.material.uniforms.uTime.value = t
    this.hubs.material.uniforms.uTime.value = t
    this.arcs.material.uniforms.uTime.value = t

    this.renderer.render(this.scene, this.camera)
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
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
        else obj.material.dispose()
      }
    })
    this.renderer.dispose()
  }
}

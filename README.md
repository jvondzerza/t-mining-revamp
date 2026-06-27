# T-Mining — Website Revamp (concept)

A concept redesign of [t-mining.be](https://www.t-mining.be/) — the
Antwerp blockchain-logistics company whose **Secure Container Release** product
replaces vulnerable PIN codes with trusted digital identity for maritime container
release.

Built as a React single-page experience with a custom **Three.js** hero — a low 3/4 view
across an endless, fog-faded **container yard** rendered from one GPU instanced mesh — and
**GSAP + Lenis** for scroll-driven storytelling. Crisp-white maritime theme: deep navy with
container-drawn **blue** and **orange** accents, and T-Mining's **gold** kept as the brand
signature. The official T-Mining logo lives in `public/logos/`.

> Concept / portfolio piece — not affiliated with T-Mining. Copy and figures are drawn
> from the public site and are illustrative. Carrier names and logos
> (MSC, CMA CGM, Hapag-Lloyd, DP World) are trademarks of their respective owners and
> appear only to depict a realistic container yard.

## Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| 3D | Three.js (hand-written scenes, no wrapper lib) + `GLTFLoader` |
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis (synced to the GSAP ticker) |
| Styling | Hand-rolled CSS design system (CSS custom properties) |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve the built bundle
```

## What's in here

The hero centrepiece is a procedural **port yard**: a low-poly shipping-container model
(`src/assets/container.glb`) is GPU-instanced thousands of times in a couple of draw calls,
laid out as stacked rows that recede into fog. Containers are grouped by **carrier** and
repainted into real liveries — **MSC** (gold), **CMA CGM** (blue), **Hapag-Lloyd** (orange),
**DP World** (navy), plus neutral grey for generic/leased boxes — with each carrier's logo
(from `src/assets/logos/`) composited onto the side. A warm light-sweep crosses the yard on
a loop. Liveries/weights are configured in the `CARRIERS` table at the bottom of
`PortYardScene.js`.

Section flow: **Preloader → Hero → carrier marquee → Mission → The Problem (the PIN-code
threat) → Secure Container Release → Three pillars (Security / Sustainability / Privacy) →
Network stats → Technology (blockchain & ID Wallet) → Insights → CTA → Footer.**

**Secure Container Release** is the narrative centrepiece — a "release card" stepping through
eDO issued → right transferred → identity verified → released. On desktop the card is sticky
and **scroll-driven** beside the steps; on mobile it becomes a self-contained **autoplaying
carousel** inside the card (looping, with prev/next + play-pause controls, segmented duration
bars, and full keyboard/`aria`/reduced-motion support) so the user can scroll past it freely.

```
src/
  three/PortYardScene.js   # the instanced container yard (vanilla three + GLTFLoader)
  components/              # Hero, HeroCanvas (mount), ErrorBoundary, Navbar, Preloader, sections…
  hooks/                  # useSmoothScroll (Lenis↔GSAP), useReveal (scroll reveals)
  lib/gsap.js             # registers ScrollTrigger
  assets/                 # container.glb + logos/*.svg
  styles/                 # index.css (design tokens) + components.css
```

## Performance & resilience

- **Three.js is lazy-loaded** (`React.lazy`) so it streams in behind the preloader instead of
  blocking first paint — the initial JS chunk stays ~105 KB gzipped.
- The whole yard renders from one **`InstancedMesh`** per primitive (a couple of draw calls);
  carrier textures are recoloured + logo-stamped **once** at load.
- On mobile the scene **drops instance count, caps `devicePixelRatio` (≤ 1.6) and disables
  antialiasing**; the camera is reframed so the headline stays clear.
- The scene **pauses** when scrolled out of view or the tab is hidden
  (`IntersectionObserver` + `visibilitychange`).
- An **`ErrorBoundary`** + WebGL guard wraps the canvas — if the model or WebGL is unavailable
  it falls back to recoloured boxes, then to the CSS gradient backdrop.
- Full **`prefers-reduced-motion`** support: the preloader, hero scene, scroll reveals and the
  SCR carousel all stand down to static states.
- Verified responsive with no horizontal overflow from 375 px up.

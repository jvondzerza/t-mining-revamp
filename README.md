# T-Mining — Website Revamp (concept)

An awwwards-style concept redesign of [t-mining.be](https://www.t-mining.be/) — the
Antwerp blockchain-logistics company whose **Secure Container Release** product
replaces vulnerable PIN codes with trusted digital identity for maritime container
release.

Built as a React single-page experience with a custom **Three.js** hero (a light, dotted
globe laced with trade-route arcs and gold port nodes) and **GSAP + Lenis** for
scroll-driven storytelling. Light, warm-paper theme with T-Mining's gold used as a
sparing accent; the official T-Mining logo (`public/logos/`) is used throughout.

> Concept / portfolio piece — not affiliated with T-Mining. Copy and figures are drawn
> from the public site and are illustrative.

## Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| 3D | Three.js (hand-written `GlobeScene`, no wrapper lib) |
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

The hero centrepiece is a procedural globe: a Fibonacci-distributed point sphere,
glowing port "hub" nodes at real maritime coordinates, and great-circle arcs (slerped
between hubs) carrying travelling light pulses via a custom GLSL shader — evoking secure
data flowing across the network.

Section flow: **Preloader → Hero → carrier marquee → Mission → The Problem (the PIN-code
threat) → Secure Container Release (sticky, scroll-driven steps) → Three pillars
(Security / Sustainability / Privacy) → Network stats → Technology (blockchain &
ID Wallet) → Insights → CTA → Footer.**

The marquee is a scrolling text band of ecosystem partners (carriers, ports, terminals,
forwarders, hauliers) separated by gold `+` marks.

```
src/
  three/GlobeScene.js     # the WebGL globe + trade-route arcs (vanilla three)
  components/             # Hero, Navbar, Preloader, Cursor, sections…
  hooks/                  # useSmoothScroll (Lenis↔GSAP), useReveal
  lib/gsap.js             # registers ScrollTrigger
  styles/                 # index.css (tokens) + components.css
```

## Performance & resilience

- **Three.js is lazy-loaded** (`React.lazy`) so it streams in behind the preloader
  instead of blocking first paint — the initial JS chunk is ~105 KB gzipped.
- The globe **pauses** when scrolled out of view or the tab is hidden
  (`IntersectionObserver` + `visibilitychange`), and caps `devicePixelRatio` at 2.
- An **`ErrorBoundary`** wraps the canvas — if WebGL is unavailable the page degrades
  gracefully to its CSS gradient backdrop.
- Full **`prefers-reduced-motion`** support: the preloader, globe and scroll reveals all
  stand down to static states.
- Lower particle counts and re-framed camera on mobile; verified responsive with no
  horizontal overflow from 375 px up.

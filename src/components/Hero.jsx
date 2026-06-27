import { useEffect, useRef, lazy, Suspense } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import ErrorBoundary from './ErrorBoundary'

// Three.js is heavy (~600KB) and only needed for the hero backdrop — load it
// lazily so it streams in behind the preloader instead of blocking first paint.
const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

export default function Hero() {
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // parallax the globe + fade hero copy on scroll out
      gsap.to('.hero__globe', {
        yPercent: 18,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__content', {
        yPercent: -14,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      ScrollTrigger.refresh()
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__globe">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <GlobeCanvas />
          </Suspense>
        </ErrorBoundary>
        <div className="hero__glow" aria-hidden="true" />
      </div>

      <div className="hero__content container">
        <div className="hero__top">
          <span className="hero__reveal hero__reveal--fade tag"><span className="dot" /> Blockchain logistics · since 2016</span>
        </div>

        <h1 className="hero__title display">
          <span className="mask"><span className="hero__reveal">Securing the</span></span>
          <span className="mask"><span className="hero__reveal">flow of <em>global</em></span></span>
          <span className="mask"><span className="hero__reveal">trade.</span></span>
        </h1>

        <div className="hero__bottom">
          <div className="mask hero__lead-mask">
            <p className="hero__reveal lead hero__lead">
              We build decentralized networks that make maritime supply chains
              radically more secure, sustainable and private — beginning with the
              one thing the world runs on: the container.
            </p>
          </div>
          <div className="hero__bottom-right">
            <div className="hero__coords" aria-hidden="true">
              <span>51.2194° N</span>
              <span>4.4025° E</span>
              <span>Port of Antwerp-Bruges</span>
            </div>
            <div className="hero__actions mask">
              <span className="hero__reveal hero__actions-inner">
                <a href="#solution" className="btn btn--primary" data-scroll="#solution">
                  Discover Secure Container Release <span className="arrow">↗</span>
                </a>
                <a href="#contact" className="btn" data-scroll="#contact">
                  Book a demo
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

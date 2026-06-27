import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'

const STEPS = [
  {
    k: 'eDO',
    title: 'The carrier issues an eDO',
    body: 'Instead of a PIN, the shipping line releases the container as an electronic Delivery Order — a secure, single-source token of ownership.',
    status: 'Token issued',
  },
  {
    k: 'transfer',
    title: 'The right to pick up moves digitally',
    body: 'Forwarders and hauliers pass that right from party to party. Each transfer is cryptographically signed — never copied, always revocable.',
    status: 'Right transferred',
  },
  {
    k: 'identity',
    title: 'The driver proves who they are',
    body: 'At the terminal gate the holder verifies with trusted digital identity. No code to steal, nothing to brute-force.',
    status: 'Identity verified',
  },
  {
    k: 'release',
    title: 'The container is released — and recorded',
    body: 'It is handed only to the rightful party, and every step is traceable end-to-end. Fraud loses its foothold.',
    status: 'Released · logged',
  },
]

const SLIDE_MS = 5000 // mobile autoplay: time each step is shown

export default function Solution() {
  const root = useRef(null)
  const [active, setActive] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [paused, setPaused] = useState(false)

  // mutable state the rAF loop reads without re-subscribing
  const activeRef = useRef(0)
  const pausedRef = useRef(false)
  const visibleRef = useRef(false)
  const progressRef = useRef(0)
  const barFills = useRef([])

  useEffect(() => {
    activeRef.current = active
  }, [active])
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // paint the segmented duration bars from the current step + progress
  const paintFills = () => {
    barFills.current.forEach((el, i) => {
      if (!el) return
      const v = i < activeRef.current ? 1 : i === activeRef.current ? progressRef.current : 0
      el.style.transform = `scaleX(${Math.min(1, Math.max(0, v))})`
    })
  }

  const goTo = (i) => {
    activeRef.current = i
    progressRef.current = reduceMotion ? 1 : 0
    setActive(i)
    paintFills()
  }
  const next = () => goTo((activeRef.current + 1) % STEPS.length)
  const prev = () => goTo((activeRef.current - 1 + STEPS.length) % STEPS.length)

  // track viewport mode + motion preference
  useEffect(() => {
    const mqM = window.matchMedia('(max-width: 1024px)')
    const mqR = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setIsMobile(mqM.matches)
      setReduceMotion(mqR.matches)
    }
    sync()
    mqM.addEventListener('change', sync)
    mqR.addEventListener('change', sync)
    return () => {
      mqM.removeEventListener('change', sync)
      mqR.removeEventListener('change', sync)
    }
  }, [])

  // DESKTOP: the active step follows the scroll (sticky card beside the steps)
  useEffect(() => {
    if (isMobile) return
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray('.solution__step')
      const grid = root.current.querySelector('.solution__grid')
      const card = root.current.querySelector('.release-card')
      const pickActive = () => {
        const cardLine = window.innerHeight * 0.18 + (card?.offsetHeight || 0) / 2
        let best = 0
        let bestDist = Infinity
        steps.forEach((step, i) => {
          const r = step.getBoundingClientRect()
          const d = Math.abs(r.top + r.height / 2 - cardLine)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        })
        setActive(best)
      }
      const st = ScrollTrigger.create({
        trigger: grid,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: pickActive,
        onRefresh: pickActive,
      })
      pickActive()
      return () => st.kill()
    }, root)
    return () => ctx.revert()
  }, [isMobile])

  // MOBILE: autoplay carousel, looping, independent of scroll
  useEffect(() => {
    if (!isMobile) return
    const card = root.current.querySelector('.release-card')

    // only run while the card is on screen
    const io = new IntersectionObserver(([e]) => (visibleRef.current = e.isIntersecting), { threshold: 0.35 })
    if (card) io.observe(card)

    let raf
    if (reduceMotion) {
      progressRef.current = 1
      paintFills()
    } else {
      let last = null
      const tick = (t) => {
        if (last == null) last = t
        const dt = t - last
        last = t
        const stalled = pausedRef.current || !visibleRef.current
        if (!stalled) {
          progressRef.current += dt / SLIDE_MS
          if (progressRef.current >= 1) {
            progressRef.current = 0
            const n = (activeRef.current + 1) % STEPS.length
            activeRef.current = n
            setActive(n)
          }
        }
        paintFills()
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [isMobile, reduceMotion])

  // repaint when the step changes (covers reduced-motion + manual nav)
  useEffect(() => {
    if (isMobile) paintFills()
  }, [active, isMobile])

  // arrow-key navigation when the carousel has focus
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  // announce step changes to screen readers only when not auto-rotating
  const live = paused || reduceMotion ? 'polite' : 'off'

  return (
    <section className="section solution" id="solution" ref={root}>
      <div className="container">
        <header className="solution__head">
          <span className="eyebrow" data-reveal="up">Secure Container Release</span>
          <h2 className="section-title" data-reveal="up">
            We replaced the PIN with proof.
          </h2>
          <p className="lead solution__intro" data-reveal="up">
            Secure Container Release is the electronic Delivery Order trusted by the
            world&rsquo;s largest carriers — turning container pickup from a shared
            secret into a chain of verified identity.
          </p>
        </header>

        <div className="solution__grid">
          <div className="solution__stage">
          {/* sticky visual */}
          <div className="solution__visual">
            <div className="release-card" data-active={STEPS[active].k}>
              <div className="release-card__top">
                <span className="release-card__brand">
                  <span className="dot" /> SCR · eDO
                </span>
                <span className="release-card__iso">ISO 27001</span>
              </div>

              <div className="release-card__id">
                <span className="release-card__label">Container</span>
                <span className="release-card__value">MSCU&nbsp;784 219&nbsp;1</span>
              </div>

              <div className="release-card__flow">
                {STEPS.map((s, i) => (
                  <div
                    key={s.k}
                    className={`release-node ${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}
                  >
                    <span className="release-node__dot" />
                    <span className="release-node__name">{s.k}</span>
                  </div>
                ))}
                <div className="release-card__rail">
                  <span style={{ transform: `scaleX(${active / (STEPS.length - 1)})` }} />
                </div>
              </div>

              <div className="release-card__status">
                <span className="release-card__shield" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.4" />
                    <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <span className="release-card__status-text">{STEPS[active].status}</span>
              </div>

              {/* mobile only: the steps become an autoplaying carousel inside the
                  card, below the status (hidden on desktop) */}
              <div
                className="release-carousel"
                role="group"
                aria-roledescription="carousel"
                aria-label="How Secure Container Release works"
                onKeyDown={onKeyDown}
              >
                <div className="release-card__steps" aria-live={live} aria-atomic="true">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.k}
                      className={`release-card__step ${i === active ? 'is-active' : ''}`}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.title}`}
                      aria-hidden={i !== active}
                    >
                      <span className="release-card__step-n">0{i + 1}</span>
                      <h3 className="release-card__step-title">{s.title}</h3>
                      <p className="release-card__step-body">{s.body}</p>
                    </div>
                  ))}
                </div>

                <div className="release-carousel__bars">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.k}
                      type="button"
                      className="release-carousel__bar"
                      aria-label={`Show step ${i + 1}: ${s.title}`}
                      aria-current={i === active ? 'step' : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className="release-carousel__bar-fill" ref={(el) => (barFills.current[i] = el)} />
                    </button>
                  ))}
                </div>

                <div className="release-carousel__buttons">
                  <button type="button" className="release-carousel__btn" aria-label="Previous step" onClick={prev}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {!reduceMotion && (
                    <button
                      type="button"
                      className="release-carousel__btn release-carousel__btn--play"
                      aria-label={paused ? 'Play steps' : 'Pause steps'}
                      aria-pressed={paused}
                      onClick={() => setPaused((p) => !p)}
                    >
                      {paused ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path d="M8 5.5 18 12 8 18.5Z" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <rect x="7.2" y="6" width="3.2" height="12" rx="1" fill="currentColor" />
                          <rect x="13.6" y="6" width="3.2" height="12" rx="1" fill="currentColor" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button type="button" className="release-carousel__btn" aria-label="Next step" onClick={next}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* steps (desktop column) */}
          <ol className="solution__steps">
            {STEPS.map((s, i) => (
              <li
                key={s.k}
                className={`solution__step ${i === active ? 'is-active' : ''}`}
              >
                <span className="solution__step-n">0{i + 1}</span>
                <h3 className="solution__step-title">{s.title}</h3>
                <p className="solution__step-body">{s.body}</p>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

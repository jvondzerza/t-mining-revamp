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

export default function Solution() {
  const root = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray('.solution__step')
      const grid = root.current.querySelector('.solution__grid')
      const card = root.current.querySelector('.release-card')

      // The active step is the one whose centre is closest to the card's centre
      // line, so the card updates as it lines up with the middle of each step.
      // Desktop: the card sits beside the steps (centre ≈ top:18vh + half its
      // height). Mobile: the card is pinned at the top and the steps scroll
      // through the band below it, so we target a point in the lower viewport.
      const pickActive = () => {
        const mobile = window.matchMedia('(max-width: 1024px)').matches
        const cardLine = mobile
          ? window.innerHeight * 0.6
          : window.innerHeight * 0.18 + (card?.offsetHeight || 0) / 2
        let best = 0
        let bestDist = Infinity
        steps.forEach((step, i) => {
          const r = step.getBoundingClientRect()
          const dist = Math.abs(r.top + r.height / 2 - cardLine)
          if (dist < bestDist) {
            bestDist = dist
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
  }, [])

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
            </div>
          </div>

          {/* steps */}
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
    </section>
  )
}

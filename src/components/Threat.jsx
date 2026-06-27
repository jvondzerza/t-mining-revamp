import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useT } from '../i18n'

export default function Threat() {
  const root = useRef(null)
  const pinRef = useRef(null)
  const t = useT()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // scramble the PIN to evoke a leaking / brute-forced code
      const chars = '0123456789'
      const target = pinRef.current
      const cells = target ? Array.from(target.querySelectorAll('span')) : []
      let tween
      const scramble = () => {
        cells.forEach((c) => {
          c.textContent = chars[Math.floor(Math.random() * 10)]
        })
      }
      tween = gsap.to(
        {},
        {
          duration: 0.08,
          repeat: -1,
          onRepeat: scramble,
          scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'bottom top', toggleActions: 'play pause resume pause' },
        }
      )

      // reveal the whole panel as one element — in from the side on desktop,
      // up from below on mobile
      const mm = gsap.matchMedia()
      const reveal = (from) =>
        gsap.fromTo(
          '.threat__right',
          { ...from, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.threat__right', start: 'top 82%' },
          }
        )
      mm.add('(min-width: 1025px)', () => reveal({ x: 28 }))
      mm.add('(max-width: 1024px)', () => reveal({ y: 28 }))

      return () => {
        tween && tween.kill()
        mm.revert()
      }
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section threat" ref={root} id="threat">
      <div className="container threat__grid">
        <div className="threat__left">
          <span className="eyebrow threat__eyebrow" data-reveal="up">{t.threat.eyebrow}</span>
          <h2 className="section-title threat__title" data-reveal="up">{t.threat.title}</h2>
          <p className="lead threat__lead" data-reveal="up">{t.threat.lead}</p>

          <div className="threat__pin" aria-hidden="true">
            <div className="threat__pin-label">{t.threat.pinLabel}</div>
            <div className="threat__pin-digits" ref={pinRef}>
              <span>4</span><span>7</span><span>1</span><span>9</span>
              <span>2</span><span>8</span>
            </div>
            <div className="threat__pin-bar"><i /></div>
          </div>
        </div>

        <div className="threat__right">
          {t.threat.risks.map((r) => (
            <article className="threat__risk" key={r.n}>
              <div className="threat__risk-content">
                <span className="threat__risk-n">{r.n}</span>
                <div>
                  <h3 className="threat__risk-title">{r.title}</h3>
                  <p className="threat__risk-body">{r.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

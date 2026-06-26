import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

const RISKS = [
  {
    n: '01',
    title: 'Shared by email & phone',
    body: 'A single PIN, forwarded across a dozen parties. Every hop is a copy nobody can revoke.',
  },
  {
    n: '02',
    title: 'Intercepted & abused',
    body: 'Codes are stolen, brokered and used by criminal networks to pull containers that were never theirs.',
  },
  {
    n: '03',
    title: 'No trace, no trust',
    body: 'When fraud happens, there is no record of who released what — and no way to prove who should have.',
  },
]

export default function Threat() {
  const root = useRef(null)
  const pinRef = useRef(null)

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
          <span className="eyebrow threat__eyebrow" data-reveal="up">The problem</span>
          <h2 className="section-title threat__title" data-reveal="up">
            A PIN code was never built to carry the weight of global trade.
          </h2>
          <p className="lead threat__lead" data-reveal="up">
            For decades a container has been released to whoever holds its release
            code. Those codes leak — and at the world&rsquo;s ports that leak fuels
            theft, fraud and trafficking on an industrial scale.
          </p>

          <div className="threat__pin" aria-hidden="true">
            <div className="threat__pin-label">Release PIN · intercepted</div>
            <div className="threat__pin-digits" ref={pinRef}>
              <span>4</span><span>7</span><span>1</span><span>9</span>
              <span>2</span><span>8</span>
            </div>
            <div className="threat__pin-bar"><i /></div>
          </div>
        </div>

        <div className="threat__right">
          {RISKS.map((r) => (
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

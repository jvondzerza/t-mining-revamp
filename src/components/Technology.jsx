import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

const FEATURES = [
  {
    k: 'Blockchain',
    title: 'A shared source of truth',
    body: 'A distributed ledger every party can verify and none can quietly rewrite. The history of a container is tamper-evident by construction.',
  },
  {
    k: 'ID Wallet',
    title: 'Identity you actually own',
    body: 'Self-sovereign digital identity lets a driver or company prove exactly who they are — without handing over a pile of private data to do it.',
  },
  {
    k: 'Decentralized',
    title: 'No honeypot to breach',
    body: 'There is no central vault of commercial secrets for attackers to target, and no single point of failure to take the network down.',
  },
]

export default function Technology() {
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // chain blocks link up as the section enters
      gsap.fromTo(
        '.tech__block',
        { y: 30, autoAlpha: 0, scale: 0.92 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.7,
          ease: 'back.out(1.6)',
          stagger: 0.12,
          scrollTrigger: { trigger: '.tech__chain', start: 'top 80%' },
        }
      )
      gsap.fromTo(
        '.tech__link',
        { scale: 0 },
        {
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.12,
          delay: 0.25,
          scrollTrigger: { trigger: '.tech__chain', start: 'top 80%' },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section technology" id="technology" ref={root}>
      <div className="container technology__grid">
        <div className="technology__left">
          <span className="eyebrow" data-reveal="up">The technology</span>
          <h2 className="section-title" data-reveal="up">
            Trust, without a middleman.
          </h2>
          <p className="lead technology__lead" data-reveal="up">
            Our solutions run on decentralized technology — blockchain and verifiable
            digital identity. The right to a container becomes a token only its true
            owner can hold, and identity is proven without ever exposing what should
            stay private.
          </p>

          <div className="tech__chain" aria-hidden="true">
            {['HASH', 'OWNER', 'SIGN', 'LOG'].map((b, i) => (
              <div className="tech__node" key={b}>
                <div className="tech__block">
                  <span className="tech__block-k">{b}</span>
                  <span className="tech__block-hex">0x{(i * 7 + 13).toString(16)}f…{(i * 3 + 9).toString(16)}a</span>
                </div>
                {i < 3 && <span className="tech__link" />}
              </div>
            ))}
          </div>
        </div>

        <div className="technology__right" data-reveal="stagger">
          {FEATURES.map((f) => (
            <article className="tech__feature" key={f.k} data-stagger-item>
              <span className="tech__feature-k">{f.k}</span>
              <h3 className="tech__feature-title">{f.title}</h3>
              <p className="tech__feature-body">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

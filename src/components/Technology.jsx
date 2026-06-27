import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useT } from '../i18n'

export default function Technology() {
  const root = useRef(null)
  const t = useT()

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
          <span className="eyebrow" data-reveal="up">{t.technology.eyebrow}</span>
          <h2 className="section-title" data-reveal="up">{t.technology.title}</h2>
          <p className="lead technology__lead" data-reveal="up">{t.technology.lead}</p>

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
          {t.technology.features.map((f) => (
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

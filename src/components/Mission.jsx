import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useT } from '../i18n'

export default function Mission() {
  const root = useRef(null)
  const t = useT()
  const text = t.mission.text

  // re-run when the copy changes (e.g. language switch) so the scrub retargets
  // the new word spans
  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray('.mission__word')
      gsap.fromTo(
        words,
        { color: 'rgba(113,128,141,0.4)' },
        {
          color: '#0f2a4c',
          stagger: 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 72%',
            end: 'bottom 62%',
            scrub: 0.6,
          },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [text])

  return (
    <section className="section mission" ref={root}>
      <div className="container">
        <span className="eyebrow" data-reveal="up">{t.mission.eyebrow}</span>
        <p className="mission__text">
          {text.split(' ').map((w, i) => (
            <span className="mission__word" key={i}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

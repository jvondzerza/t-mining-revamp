import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

const TEXT =
  'We build the networks that drive collaboration and digitization across supply chains — replacing fragile, fraud-prone processes with trusted digital identity and decentralized technology.'

export default function Mission() {
  const root = useRef(null)

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
  }, [])

  return (
    <section className="section mission" ref={root}>
      <div className="container">
        <span className="eyebrow" data-reveal="up">Our mission</span>
        <p className="mission__text">
          {TEXT.split(' ').map((w, i) => (
            <span className="mission__word" key={i}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

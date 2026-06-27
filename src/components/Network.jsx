import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useT } from '../i18n'

// numeric config (locale-independent); labels come from translations
const STATS = [
  { value: 5000, suffix: '+', fmt: true },
  { value: 25, suffix: '+' },
  { value: 3, suffix: '' },
  { value: 100, suffix: '%' },
]

function Counter({ value, suffix, fmt }) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 90%', once: true },
      onUpdate: () => {
        const n = Math.round(obj.v)
        node.textContent = fmt ? n.toLocaleString('en-US') : String(n)
      },
    })
    return () => tween.kill()
  }, [value, fmt])
  return (
    <span className="stat__num">
      <span ref={ref}>0</span>
      <span className="stat__suffix">{suffix}</span>
    </span>
  )
}

export default function Network() {
  const root = useRef(null)
  const t = useT()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // animate only the content of each stat — the grid cells + dividers stay put
      gsap.fromTo(
        '.stat__content',
        { y: 22, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.network__stats', start: 'top 82%' },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section network" id="network" ref={root}>
      <div className="container">
        <div className="network__head">
          <span className="eyebrow" data-reveal="up">{t.network.eyebrow}</span>
          <h2 className="section-title network__title" data-reveal="up">
            {t.network.title.pre}
            <span className="text-gold">{t.network.title.em}</span>
            {t.network.title.post}
          </h2>
          <p className="lead network__lead" data-reveal="up">{t.network.lead}</p>
        </div>

        <div className="network__stats">
          {STATS.map((s, i) => (
            <div className="stat" key={i}>
              <span className="stat__content">
                <Counter value={s.value} suffix={s.suffix} fmt={s.fmt} />
                <span className="stat__label">{t.network.stats[i]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

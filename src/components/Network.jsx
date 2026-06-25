import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

const STATS = [
  { value: 5000, suffix: '+', label: 'Logistics companies connected', fmt: true },
  { value: 25, suffix: '+', label: 'Countries on the network' },
  { value: 3, suffix: '', label: 'Of the world’s largest carriers' },
  { value: 100, suffix: '%', label: 'PIN-free container release' },
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
  return (
    <section className="section network" id="network">
      <div className="container">
        <div className="network__head">
          <span className="eyebrow" data-reveal="up">The network effect</span>
          <h2 className="section-title network__title" data-reveal="up">
            One network. <span className="text-gold">Every</span> party in the chain.
          </h2>
          <p className="lead network__lead" data-reveal="up">
            Security only works if everyone is on it. That&rsquo;s why Secure Container
            Release already links carriers, terminals, forwarders and hauliers into a
            single trusted fabric — and it keeps growing.
          </p>
        </div>

        <div className="network__stats" data-reveal="stagger">
          {STATS.map((s) => (
            <div className="stat" key={s.label} data-stagger-item>
              <Counter value={s.value} suffix={s.suffix} fmt={s.fmt} />
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

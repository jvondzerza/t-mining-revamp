import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'

export default function Preloader() {
  const root = useRef(null)
  const countRef = useRef(null)
  const barRef = useRef(null)
  const [hidden, setHidden] = useState(false)

  // run exactly once on mount — never restart on parent re-renders
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = root.current
    if (!el) return

    // capture nodes directly so timelines never re-resolve a removed selector
    const inner = el.querySelector('.preloader__inner')
    const panels = el.querySelectorAll('.preloader__panel')
    const slideReveals = document.querySelectorAll('.hero__reveal:not(.hero__reveal--fade)')
    const fadeReveals = document.querySelectorAll('.hero__reveal--fade')

    document.documentElement.classList.add('is-loading')
    document.body.style.overflow = 'hidden'
    window.__lenis?.stop?.()

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      document.documentElement.classList.remove('is-loading')
      document.body.style.overflow = ''
      window.__lenis?.start?.()
      setHidden(true)
    }

    const counter = { v: 0 }
    const tl = gsap.timeline({ onComplete: finish })

    if (reduce) {
      if (countRef.current) countRef.current.textContent = '100'
      tl.to(el, { autoAlpha: 0, duration: 0.3 })
      return () => tl.kill()
    }

    tl.to(counter, {
      v: 100,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (countRef.current)
          countRef.current.textContent = String(Math.round(counter.v)).padStart(2, '0')
        if (barRef.current) barRef.current.style.transform = `scaleX(${counter.v / 100})`
      },
    })
      // fade the whole loader UI (word + counter + bar) out BEFORE the wipe so
      // nothing lingers on top of the hero
      .to(inner, { autoAlpha: 0, y: -22, duration: 0.5, ease: 'power2.in' }, '-=0.25')
      .to(panels, {
        scaleY: 0,
        transformOrigin: 'top',
        duration: 0.85,
        ease: 'power4.inOut',
        stagger: 0.05,
      }, '-=0.05')
      .fromTo(
        slideReveals,
        { yPercent: 118 },
        { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, clearProps: 'transform' },
        '-=0.55'
      )
      // the eyebrow pill simply fades in rather than sliding up
      .fromTo(
        fadeReveals,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.0, ease: 'power2.out', clearProps: 'opacity,visibility' },
        '<'
      )

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hidden) return null

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="preloader__panels">
        <span className="preloader__panel" />
        <span className="preloader__panel" />
        <span className="preloader__panel" />
        <span className="preloader__panel" />
        <span className="preloader__panel" />
      </div>
      <div className="preloader__inner">
        <div className="preloader__word">
          <span>T&#8209;MINING</span>
        </div>
        <div className="preloader__meta">
          <span className="preloader__count" ref={countRef}>00</span>
          <span className="preloader__label">Securing global trade</span>
        </div>
        <div className="preloader__track">
          <span className="preloader__bar" ref={barRef} />
        </div>
      </div>
    </div>
  )
}

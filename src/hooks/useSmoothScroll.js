import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'

/**
 * Wires Lenis smooth-scrolling into GSAP's ScrollTrigger + ticker so
 * scroll-driven animations stay perfectly in sync with the eased scroll.
 */
export default function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // expose for anchor links / nav
    window.__lenis = lenis

    // delegated smooth-scroll for any [data-scroll="#id"] element
    const onClick = (e) => {
      const trigger = e.target.closest('[data-scroll]')
      if (!trigger) return
      const sel = trigger.getAttribute('data-scroll')
      const el = sel && document.querySelector(sel)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -20, duration: 1.3 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])
}

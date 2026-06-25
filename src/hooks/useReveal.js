import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

/**
 * Generic scroll reveal. Children matching [data-reveal] fade/rise into
 * view; elements with [data-reveal="lines"] split-reveal their text lines.
 */
export default function useReveal() {
  const scope = useRef(null)

  useEffect(() => {
    const el = scope.current
    if (!el) return

    const ctx = gsap.context(() => {
      // simple fade-rise items
      gsap.utils.toArray('[data-reveal="up"]').forEach((node) => {
        gsap.fromTo(
          node,
          { y: 40, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 88%' },
          }
        )
      })

      // staggered groups
      gsap.utils.toArray('[data-reveal="stagger"]').forEach((group) => {
        const items = group.querySelectorAll('[data-stagger-item]')
        gsap.fromTo(
          items,
          { y: 46, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.09,
            scrollTrigger: { trigger: group, start: 'top 82%' },
          }
        )
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return scope
}

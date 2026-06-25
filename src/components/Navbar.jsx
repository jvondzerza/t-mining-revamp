import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'

const LINKS = [
  { label: 'Solution', href: '#solution' },
  { label: 'Why it matters', href: '#pillars' },
  { label: 'Network', href: '#network' },
  { label: 'Technology', href: '#technology' },
  { label: 'Insights', href: '#insights' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const last = useRef(0)
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 400 && y > last.current)
      last.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (open) {
      window.__lenis?.stop?.()
      document.body.style.overflow = 'hidden'
      gsap.fromTo(
        '.mobile-menu__link',
        { yPercent: 120, opacity: 0 },
        { yPercent: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: 'power3.out', delay: 0.15 }
      )
    } else {
      window.__lenis?.start?.()
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    const el = document.querySelector(href)
    if (!el) return
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -20, duration: 1.3 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${hidden && !open ? 'is-hidden' : ''}`}>
        <a className="nav__logo" href="#top" onClick={(e) => go(e, '#top')} aria-label="T-Mining home">
          <img src="/logos/t-mining-logo.png" alt="T-Mining — Blockchain Logistics" className="nav__logo-img" />
        </a>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} className="nav__link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn nav__cta">
            Book a demo
            <span className="arrow">↗</span>
          </a>
          <button
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${open ? 'is-open' : ''}`} ref={menuRef}>
        <nav className="mobile-menu__nav">
          {LINKS.map((l) => (
            <div className="mobile-menu__line" key={l.href}>
              <a href={l.href} onClick={(e) => go(e, l.href)} className="mobile-menu__link">
                {l.label}
              </a>
            </div>
          ))}
          <div className="mobile-menu__line">
            <a href="#contact" onClick={(e) => go(e, '#contact')} className="mobile-menu__link mobile-menu__link--cta">
              Book a demo ↗
            </a>
          </div>
        </nav>
        <div className="mobile-menu__foot">
          <span>Antwerp · Belgium</span>
          <span>ISO 27001 : 2022</span>
        </div>
      </div>
    </>
  )
}

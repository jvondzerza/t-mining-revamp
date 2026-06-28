import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { useI18n } from '../i18n'
import LanguageSwitcher from './LanguageSwitcher'

const HREFS = ['#solution', '#pillars', '#network', '#technology', '#insights']

export default function Navbar() {
  const { t } = useI18n()
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
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/logos/t-mining-logo.png`} alt="T-Mining — Blockchain Logistics" className="nav__logo-img" />
        </a>

        <nav className="nav__links" aria-label="Primary">
          {HREFS.map((href, i) => (
            <a key={href} href={href} onClick={(e) => go(e, href)} className="nav__link">
              {t.nav.links[i]}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <LanguageSwitcher />
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn nav__cta">
            {t.nav.bookDemo}
            <span className="arrow">↗</span>
          </a>
          <button
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${open ? 'is-open' : ''}`} ref={menuRef}>
        <nav className="mobile-menu__nav">
          {HREFS.map((href, i) => (
            <div className="mobile-menu__line" key={href}>
              <a href={href} onClick={(e) => go(e, href)} className="mobile-menu__link">
                {t.nav.links[i]}
              </a>
            </div>
          ))}
          <div className="mobile-menu__line">
            <a href="#contact" onClick={(e) => go(e, '#contact')} className="mobile-menu__link mobile-menu__link--cta">
              {t.nav.bookDemo} ↗
            </a>
          </div>
        </nav>

        <div className="mobile-menu__lang">
          <span className="mobile-menu__lang-label">{t.nav.language}</span>
          <LanguageSwitcher variant="inline" />
        </div>

        <div className="mobile-menu__foot">
          <span>{t.nav.foot.location}</span>
          <span>{t.nav.foot.iso}</span>
        </div>
      </div>
    </>
  )
}

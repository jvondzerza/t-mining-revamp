'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LANGS } from '../i18n'
import { STORAGE_KEY } from '../i18n/dictionaries'
import { useI18n } from '../i18n'

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

// each language is its own statically-generated route; switching is navigation
const localeHref = (code) => `/${code}/`
const remember = (code) => {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore storage failures */
  }
}

/**
 * Language picker.
 *  - variant="dropdown" (default): a button + menu, for the desktop nav.
 *  - variant="inline": a row of buttons, for the mobile menu.
 */
export default function LanguageSwitcher({ variant = 'dropdown' }) {
  const { lang, t } = useI18n()

  if (variant === 'inline') {
    return (
      <div className="lang-inline" role="group" aria-label={t.nav.language}>
        {LANGS.map((l) => (
          <Link
            key={l.code}
            href={localeHref(l.code)}
            className={`lang-inline__btn ${l.code === lang ? 'is-active' : ''}`}
            aria-current={l.code === lang ? 'true' : undefined}
            onClick={() => remember(l.code)}
          >
            {l.short}
          </Link>
        ))}
      </div>
    )
  }

  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find((l) => l.code === lang) || LANGS[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (code) => {
    remember(code)
    setOpen(false)
  }

  return (
    <div className="lang" ref={ref}>
      <button
        type="button"
        className="lang__toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.nav.selectLanguage} (${current.label})`}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
        <span className="lang__current">{current.short}</span>
        <svg className={`lang__chev ${open ? 'is-open' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="lang__menu" role="menu" aria-label={t.nav.language}>
          {LANGS.map((l) => (
            <Link
              key={l.code}
              href={localeHref(l.code)}
              role="menuitemradio"
              aria-checked={l.code === lang}
              className={`lang__option ${l.code === lang ? 'is-active' : ''}`}
              onClick={() => choose(l.code)}
            >
              <span className="lang__option-code">{l.short}</span>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

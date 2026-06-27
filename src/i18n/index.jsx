import { createContext, useContext, useEffect, useState } from 'react'
import en from './en'
import nl from './nl'
import fr from './fr'

const DICT = { en, nl, fr }

// the languages offered in the switcher (order = display order)
export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'nl', label: 'Nederlands', short: 'NL' },
  { code: 'fr', label: 'Français', short: 'FR' },
]

const STORAGE_KEY = 'tmining-lang'

// saved choice → browser language → English
function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICT[saved]) return saved
  } catch {
    /* ignore storage failures */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return DICT[nav] ? nav : 'en'
}

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = (code) => {
    if (DICT[code]) setLangState(code)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICT[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useI18n must be used within <LanguageProvider>')
  return ctx
}

// convenience: just the translation dictionary for the current language
export const useT = () => useI18n().t

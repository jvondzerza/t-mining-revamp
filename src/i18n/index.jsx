'use client'

import { createContext, useContext } from 'react'
import { DICT, DEFAULT_LOCALE, LANGS } from './dictionaries'

export { LANGS }

const LangContext = createContext(null)

/**
 * Provides the active language + its dictionary. The language is fixed by the
 * route (one statically-generated page per locale), so this no longer detects
 * or stores anything — switching languages is navigation, handled by
 * <LanguageSwitcher>.
 */
export function LanguageProvider({ lang, children }) {
  const code = DICT[lang] ? lang : DEFAULT_LOCALE
  return (
    <LangContext.Provider value={{ lang: code, t: DICT[code] }}>
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

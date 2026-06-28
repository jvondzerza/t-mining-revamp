import en from './en'
import nl from './nl'
import fr from './fr'

// Pure data — no React. Safe to import from Server Components (layout/page
// metadata, sitemap) as well as the client provider.
export const DICT = { en, nl, fr }

export const LOCALES = ['en', 'nl', 'fr']
export const DEFAULT_LOCALE = 'en'

// remembered across visits so the root URL can send returning users to their language
export const STORAGE_KEY = 'tmining-lang'

// switcher display order + labels
export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'nl', label: 'Nederlands', short: 'NL' },
  { code: 'fr', label: 'Français', short: 'FR' },
]

export const getDict = (lang) => DICT[lang] || DICT[DEFAULT_LOCALE]

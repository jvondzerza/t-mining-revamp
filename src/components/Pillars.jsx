import { useT } from '../i18n'

const ICONS = [
  (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path d="M12 21c5-2 8-6 8-12V4a14 14 0 0 0-8 4 14 14 0 0 0-8-4v5c0 6 3 10 8 12Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 21V9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
]

export default function Pillars() {
  const t = useT()

  return (
    <section className="section pillars" id="pillars">
      <div className="container">
        <header className="pillars__head">
          <span className="eyebrow" data-reveal="up">{t.pillars.eyebrow}</span>
          <h2 className="section-title" data-reveal="up">{t.pillars.title}</h2>
        </header>

        <div className="pillars__grid" data-reveal="stagger">
          {t.pillars.items.map((p, i) => (
            <article className="pillar" key={p.index} data-stagger-item>
              <div className="pillar__top">
                <span className="pillar__icon">{ICONS[i]}</span>
                <span className="pillar__index">{p.index}</span>
              </div>
              <div className="pillar__num">
                <span className="pillar__pct">100%</span>
                <span className="pillar__word">{p.word}</span>
              </div>
              <p className="pillar__body">{p.body}</p>
              <span className="pillar__sheen" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const PILLARS = [
  {
    pct: '100%',
    word: 'Secure',
    title: 'Security',
    body: 'No PIN to leak. Every release is bound to a verified identity and signed end-to-end, so a container only ever moves to its rightful holder.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    pct: '100%',
    word: 'Paperless',
    title: 'Sustainability',
    body: 'Delivery orders go fully digital — no printouts, no couriers, no waste. A cleaner process for a sector under pressure to decarbonize.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 21c5-2 8-6 8-12V4a14 14 0 0 0-8 4 14 14 0 0 0-8-4v5c0 6 3 10 8 12Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 21V9" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    pct: '100%',
    word: 'Private',
    title: 'Privacy',
    body: 'Decentralized by design. Your commercial data stays yours — nothing pools inside a central middleman who can see, sell or lose it.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
]

export default function Pillars() {
  return (
    <section className="section pillars" id="pillars">
      <div className="container">
        <header className="pillars__head">
          <span className="eyebrow" data-reveal="up">Why it matters</span>
          <h2 className="section-title" data-reveal="up">
            Three promises we don&rsquo;t compromise on.
          </h2>
        </header>

        <div className="pillars__grid" data-reveal="stagger">
          {PILLARS.map((p) => (
            <article className="pillar" key={p.title} data-stagger-item>
              <div className="pillar__top">
                <span className="pillar__icon">{p.icon}</span>
                <span className="pillar__index">{p.title}</span>
              </div>
              <div className="pillar__num">
                <span className="pillar__pct">{p.pct}</span>
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

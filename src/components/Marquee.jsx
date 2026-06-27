import { useT } from '../i18n'

export default function Marquee() {
  const t = useT()
  const items = t.marquee.items

  return (
    <section className="marquee" aria-label={t.marquee.intro}>
      <div className="marquee__intro container">
        <span className="text-muted">{t.marquee.intro}</span>
      </div>
      <div className="marquee__viewport">
        <div className="marquee__track">
          {[0, 1].map((dup) => (
            <div className="marquee__row" key={dup} aria-hidden={dup === 1}>
              {items.map((it) => (
                <span className="marquee__item" key={it + dup}>
                  {it}
                  <svg viewBox="0 0 24 24" width="14" height="14" className="marquee__sep" aria-hidden="true">
                    <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

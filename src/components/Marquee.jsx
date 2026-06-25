const ITEMS = [
  'MSC',
  'Hapag-Lloyd',
  'CMA CGM',
  'Port of Antwerp-Bruges',
  'NxtPort',
  'DP World',
  'Terminal Operators',
  'Freight Forwarders',
  'Hauliers',
]

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Trusted across the supply chain">
      <div className="marquee__intro container">
        <span className="text-muted">Trusted across the maritime supply chain</span>
      </div>
      <div className="marquee__viewport">
        <div className="marquee__track">
          {[0, 1].map((dup) => (
            <div className="marquee__row" key={dup} aria-hidden={dup === 1}>
              {ITEMS.map((it) => (
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

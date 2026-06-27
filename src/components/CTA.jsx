import { useT } from '../i18n'

export default function CTA() {
  const t = useT()

  return (
    <section className="section cta" id="contact">
      <div className="cta__halo" aria-hidden="true" />
      <div className="container cta__inner">
        <span className="eyebrow cta__eyebrow" data-reveal="up">{t.cta.eyebrow}</span>
        <h2 className="cta__title display" data-reveal="up">
          {t.cta.title[0]}
          <br />
          {t.cta.title[1]}
        </h2>
        <p className="lead cta__lead" data-reveal="up">{t.cta.lead}</p>

        <div className="cta__actions" data-reveal="up">
          <a href="mailto:info@t-mining.be" className="btn btn--primary cta__btn">
            {t.cta.bookDemo} <span className="arrow">↗</span>
          </a>
          <a href="mailto:info@t-mining.be" className="cta__email">
            info@t-mining.be
          </a>
        </div>
      </div>
    </section>
  )
}

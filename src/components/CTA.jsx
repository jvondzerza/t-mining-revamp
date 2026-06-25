export default function CTA() {
  return (
    <section className="section cta" id="contact">
      <div className="cta__halo" aria-hidden="true" />
      <div className="container cta__inner">
        <span className="eyebrow cta__eyebrow" data-reveal="up">Get started</span>
        <h2 className="cta__title display" data-reveal="up">
          Let&rsquo;s secure your
          <br />
          container flow.
        </h2>
        <p className="lead cta__lead" data-reveal="up">
          See Secure Container Release on your own lanes. Book a 30-minute demo and
          we&rsquo;ll show you exactly where the PIN disappears.
        </p>

        <div className="cta__actions" data-reveal="up">
          <a href="mailto:info@t-mining.be" className="btn btn--primary cta__btn">
            Book a demo <span className="arrow">↗</span>
          </a>
          <a href="mailto:info@t-mining.be" className="cta__email">
            info@t-mining.be
          </a>
        </div>
      </div>
    </section>
  )
}

// English — the source copy. nl.js / fr.js mirror this structure exactly.
export default {
  seo: {
    title: 'T-Mining — Securing the Flow of Global Trade',
    description:
      'T-Mining builds decentralized networks that make maritime supply chains more secure, sustainable and private. Secure Container Release replaces vulnerable PIN codes with trusted digital identity.',
  },
  nav: {
    links: ['Solution', 'Why it matters', 'Network', 'Technology', 'Insights'],
    bookDemo: 'Book a demo',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
    selectLanguage: 'Select language',
    foot: { location: 'Antwerp · Belgium', iso: 'ISO 27001 : 2022' },
  },

  preloader: { label: 'Securing global trade' },

  hero: {
    tag: 'Blockchain logistics · since 2016',
    // each line is a list of segments; em = the gold-highlighted word
    title: [
      [{ t: 'Securing the' }],
      [{ t: 'flow of ' }, { t: 'global', em: true }],
      [{ t: 'trade.' }],
    ],
    lead: 'We build decentralized networks that make maritime supply chains radically more secure, sustainable and private — beginning with the one thing the world runs on: the container.',
    coords: ['51.2194° N', '4.4025° E', 'Port of Antwerp-Bruges'],
    discover: 'Discover Secure Container Release',
    bookDemo: 'Book a demo',
  },

  marquee: {
    intro: 'Trusted across the maritime supply chain',
    items: [
      'MSC',
      'Hapag-Lloyd',
      'CMA CGM',
      'Port of Antwerp-Bruges',
      'NxtPort',
      'DP World',
      'Terminal Operators',
      'Freight Forwarders',
      'Hauliers',
    ],
  },

  mission: {
    eyebrow: 'Our mission',
    text: 'We build the networks that drive collaboration and digitization across supply chains — replacing fragile, fraud-prone processes with trusted digital identity and decentralized technology.',
  },

  threat: {
    eyebrow: 'The problem',
    title: 'A PIN code was never built to carry the weight of global trade.',
    lead: 'For decades a container has been released to whoever holds its release code. Those codes leak — and at the world’s ports that leak fuels theft, fraud and trafficking on an industrial scale.',
    pinLabel: 'Release PIN · intercepted',
    risks: [
      {
        n: '01',
        title: 'Shared by email & phone',
        body: 'A single PIN, forwarded across a dozen parties. Every hop is a copy nobody can revoke.',
      },
      {
        n: '02',
        title: 'Intercepted & abused',
        body: 'Codes are stolen, brokered and used by criminal networks to pull containers that were never theirs.',
      },
      {
        n: '03',
        title: 'No trace, no trust',
        body: 'When fraud happens, there is no record of who released what — and no way to prove who should have.',
      },
    ],
  },

  solution: {
    eyebrow: 'Secure Container Release',
    title: 'We replaced the PIN with proof.',
    intro: 'Secure Container Release is the electronic Delivery Order trusted by the world’s largest carriers — turning container pickup from a shared secret into a chain of verified identity.',
    brand: 'SCR · eDO',
    iso: 'ISO 27001',
    containerLabel: 'Container',
    controls: {
      carouselLabel: 'How Secure Container Release works',
      prev: 'Previous step',
      next: 'Next step',
      play: 'Play steps',
      pause: 'Pause steps',
      slideLabel: 'Step {n} of {total}: {title}',
      goToLabel: 'Show step {n}: {title}',
    },
    steps: [
      {
        key: 'eDO',
        node: 'eDO',
        title: 'The carrier issues an eDO',
        body: 'Instead of a PIN, the shipping line releases the container as an electronic Delivery Order — a secure, single-source token of ownership.',
        status: 'Token issued',
      },
      {
        key: 'transfer',
        node: 'transfer',
        title: 'The right to pick up moves digitally',
        body: 'Forwarders and hauliers pass that right from party to party. Each transfer is cryptographically signed — never copied, always revocable.',
        status: 'Right transferred',
      },
      {
        key: 'identity',
        node: 'identity',
        title: 'The driver proves who they are',
        body: 'At the terminal gate the holder verifies with trusted digital identity. No code to steal, nothing to brute-force.',
        status: 'Identity verified',
      },
      {
        key: 'release',
        node: 'release',
        title: 'The container is released — and recorded',
        body: 'It is handed only to the rightful party, and every step is traceable end-to-end. Fraud loses its foothold.',
        status: 'Released · logged',
      },
    ],
  },

  pillars: {
    eyebrow: 'Why it matters',
    title: 'Three promises we don’t compromise on.',
    items: [
      {
        index: 'Security',
        word: 'Secure',
        body: 'No PIN to leak. Every release is bound to a verified identity and signed end-to-end, so a container only ever moves to its rightful holder.',
      },
      {
        index: 'Sustainability',
        word: 'Paperless',
        body: 'Delivery orders go fully digital — no printouts, no couriers, no waste. A cleaner process for a sector under pressure to decarbonize.',
      },
      {
        index: 'Privacy',
        word: 'Private',
        body: 'Decentralized by design. Your commercial data stays yours — nothing pools inside a central middleman who can see, sell or lose it.',
      },
    ],
  },

  network: {
    eyebrow: 'The network effect',
    title: { pre: 'One network. ', em: 'Every', post: ' party in the chain.' },
    lead: 'Security only works if everyone is on it. That’s why Secure Container Release already links carriers, terminals, forwarders and hauliers into a single trusted fabric — and it keeps growing.',
    stats: [
      'Logistics companies connected',
      'Countries on the network',
      'Of the world’s largest carriers',
      'PIN-free container release',
    ],
  },

  technology: {
    eyebrow: 'The technology',
    title: 'Trust, without a middleman.',
    lead: 'Our solutions run on decentralized technology — blockchain and verifiable digital identity. The right to a container becomes a token only its true owner can hold, and identity is proven without ever exposing what should stay private.',
    features: [
      {
        k: 'Blockchain',
        title: 'A shared source of truth',
        body: 'A distributed ledger every party can verify and none can quietly rewrite. The history of a container is tamper-evident by construction.',
      },
      {
        k: 'ID Wallet',
        title: 'Identity you actually own',
        body: 'Self-sovereign digital identity lets a driver or company prove exactly who they are — without handing over a pile of private data to do it.',
      },
      {
        k: 'Decentralized',
        title: 'No honeypot to breach',
        body: 'There is no central vault of commercial secrets for attackers to target, and no single point of failure to take the network down.',
      },
    ],
  },

  insights: {
    eyebrow: 'Insights',
    title: 'From the port up.',
    all: 'All articles',
    posts: [
      {
        cat: 'Insight',
        date: 'Jun 2026',
        title: 'Why container release fraud is really a security problem',
        read: '6 min read',
      },
      {
        cat: 'Product',
        date: 'May 2026',
        title: 'Self-sovereign identity arrives at the terminal gate',
        read: '4 min read',
      },
      {
        cat: 'Company',
        date: 'Apr 2026',
        title: 'T-Mining renews ISO 27001:2022 certification',
        read: '3 min read',
      },
    ],
  },

  cta: {
    eyebrow: 'Get started',
    title: ['Let’s secure your', 'container flow.'],
    lead: 'See Secure Container Release on your own lanes. Book a 30-minute demo and we’ll show you exactly where the PIN disappears.',
    bookDemo: 'Book a demo',
  },

  footer: {
    tag: 'Securing the flow of global trade with decentralized technology.',
    iso: 'ISO 27001 : 2022 certified',
    cols: [
      {
        title: 'Solution',
        links: ['Secure Container Release', 'Electronic Delivery Order', 'ID Wallet', 'Why privacy matters'],
      },
      {
        title: 'Company',
        links: ['About T-Mining', 'Insights', 'Careers', 'Contact'],
      },
      {
        title: 'Resources',
        links: ['White papers', 'Blockchain explained', 'Documentation', 'Login'],
      },
    ],
    hqLabel: 'Headquarters',
    hqLines: ['T-Mining NV · Antwerp, Belgium', 'Port of Antwerp-Bruges'],
    backToTop: 'Back to top',
    rights: 'All rights reserved.',
    credit: 'Concept revamp · built with React, Three.js & GSAP',
    legal: ['Privacy', 'Terms', 'Cookies'],
  },
}

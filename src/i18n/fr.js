// Français
export default {
  seo: {
    title: 'T-Mining — Sécuriser les flux du commerce mondial',
    description:
      'T-Mining construit des réseaux décentralisés qui rendent les chaînes logistiques maritimes plus sûres, durables et confidentielles. Secure Container Release remplace les codes PIN vulnérables par une identité numérique de confiance.',
  },
  nav: {
    links: ['Solution', 'Pourquoi c’est important', 'Réseau', 'Technologie', 'Analyses'],
    bookDemo: 'Réserver une démo',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    language: 'Langue',
    selectLanguage: 'Choisir la langue',
    foot: { location: 'Anvers · Belgique', iso: 'ISO 27001 : 2022' },
  },

  preloader: { label: 'Sécuriser le commerce mondial' },

  hero: {
    tag: 'Logistique blockchain · depuis 2016',
    title: [
      [{ t: 'Sécuriser les flux' }],
      [{ t: 'du commerce' }],
      [{ t: 'mondial', em: true }, { t: '.' }],
    ],
    lead: 'Nous bâtissons des réseaux décentralisés qui rendent les chaînes logistiques maritimes radicalement plus sûres, durables et confidentielles — à commencer par ce sur quoi le monde repose : le conteneur.',
    coords: ['51.2194° N', '4.4025° E', 'Port d’Anvers-Bruges'],
    discover: 'Découvrir Secure Container Release',
    bookDemo: 'Réserver une démo',
  },

  marquee: {
    intro: 'La confiance de toute la chaîne logistique maritime',
    items: [
      'MSC',
      'Hapag-Lloyd',
      'CMA CGM',
      'Port d’Anvers-Bruges',
      'NxtPort',
      'DP World',
      'Opérateurs de terminaux',
      'Transitaires',
      'Transporteurs',
    ],
  },

  mission: {
    eyebrow: 'Notre mission',
    text: 'Nous bâtissons les réseaux qui stimulent la collaboration et la digitalisation dans les chaînes logistiques — en remplaçant des processus fragiles et propices à la fraude par une identité numérique de confiance et une technologie décentralisée.',
  },

  threat: {
    eyebrow: 'Le problème',
    title: 'Un code PIN n’a jamais été conçu pour porter le poids du commerce mondial.',
    lead: 'Depuis des décennies, un conteneur est remis à quiconque détient son code de retrait. Ces codes fuient — et dans les ports du monde entier, cette fuite alimente le vol, la fraude et le trafic à l’échelle industrielle.',
    pinLabel: 'Code de retrait · intercepté',
    risks: [
      {
        n: '01',
        title: 'Partagé par e-mail et téléphone',
        body: 'Un seul code PIN, transféré à une dizaine de parties. Chaque étape est une copie que personne ne peut révoquer.',
      },
      {
        n: '02',
        title: 'Intercepté et détourné',
        body: 'Les codes sont volés, revendus et utilisés par des réseaux criminels pour retirer des conteneurs qui ne leur ont jamais appartenu.',
      },
      {
        n: '03',
        title: 'Aucune trace, aucune confiance',
        body: 'En cas de fraude, aucune trace n’indique qui a remis quoi — et aucun moyen de prouver qui aurait dû le faire.',
      },
    ],
  },

  solution: {
    eyebrow: 'Secure Container Release',
    title: 'Nous avons remplacé le code PIN par une preuve.',
    intro: 'Secure Container Release est l’ordre de livraison électronique auquel font confiance les plus grands armateurs du monde — transformant le retrait des conteneurs d’un secret partagé en une chaîne d’identités vérifiées.',
    brand: 'SCR · eDO',
    iso: 'ISO 27001',
    containerLabel: 'Conteneur',
    controls: {
      carouselLabel: 'Comment fonctionne Secure Container Release',
      prev: 'Étape précédente',
      next: 'Étape suivante',
      play: 'Lire les étapes',
      pause: 'Mettre en pause',
      slideLabel: 'Étape {n} sur {total} : {title}',
      goToLabel: 'Afficher l’étape {n} : {title}',
    },
    steps: [
      {
        key: 'eDO',
        node: 'eDO',
        title: 'L’armateur émet un eDO',
        body: 'Au lieu d’un code PIN, la compagnie maritime libère le conteneur sous forme d’ordre de livraison électronique — un titre de propriété sécurisé, à source unique.',
        status: 'Jeton émis',
      },
      {
        key: 'transfer',
        node: 'transfert',
        title: 'Le droit de retrait circule numériquement',
        body: 'Transitaires et transporteurs se transmettent ce droit de partie en partie. Chaque transfert est signé cryptographiquement — jamais copié, toujours révocable.',
        status: 'Droit transféré',
      },
      {
        key: 'identity',
        node: 'identité',
        title: 'Le chauffeur prouve son identité',
        body: 'À la porte du terminal, le détenteur se vérifie avec une identité numérique de confiance. Aucun code à voler, rien à forcer.',
        status: 'Identité vérifiée',
      },
      {
        key: 'release',
        node: 'libération',
        title: 'Le conteneur est libéré — et enregistré',
        body: 'Il n’est remis qu’à la partie légitime, et chaque étape est traçable de bout en bout. La fraude perd pied.',
        status: 'Libéré · journalisé',
      },
    ],
  },

  pillars: {
    eyebrow: 'Pourquoi c’est important',
    title: 'Trois promesses sur lesquelles nous ne transigeons pas.',
    items: [
      {
        index: 'Sécurité',
        word: 'Sûr',
        body: 'Aucun code PIN à divulguer. Chaque libération est liée à une identité vérifiée et signée de bout en bout, de sorte qu’un conteneur ne va qu’à son détenteur légitime.',
      },
      {
        index: 'Durabilité',
        word: 'Sans papier',
        body: 'Les ordres de livraison deviennent entièrement numériques — pas d’impressions, pas de coursiers, pas de gaspillage. Un processus plus propre pour un secteur sous pression pour se décarboner.',
      },
      {
        index: 'Confidentialité',
        word: 'Privé',
        body: 'Décentralisé dès la conception. Vos données commerciales restent les vôtres — rien ne s’accumule chez un intermédiaire central qui pourrait les voir, les vendre ou les perdre.',
      },
    ],
  },

  network: {
    eyebrow: 'L’effet de réseau',
    title: { pre: 'Un seul réseau. ', em: 'Chaque', post: ' maillon de la chaîne.' },
    lead: 'La sécurité ne fonctionne que si tout le monde y participe. C’est pourquoi Secure Container Release relie déjà armateurs, terminaux, transitaires et transporteurs en un seul tissu de confiance — et il ne cesse de croître.',
    stats: [
      'Entreprises logistiques connectées',
      'Pays sur le réseau',
      'Des plus grands armateurs du monde',
      'Libération de conteneurs sans code PIN',
    ],
  },

  technology: {
    eyebrow: 'La technologie',
    title: 'La confiance, sans intermédiaire.',
    lead: 'Nos solutions reposent sur une technologie décentralisée — blockchain et identité numérique vérifiable. Le droit à un conteneur devient un jeton que seul son véritable propriétaire peut détenir, et l’identité est prouvée sans jamais exposer ce qui doit rester privé.',
    features: [
      {
        k: 'Blockchain',
        title: 'Une source de vérité partagée',
        body: 'Un registre distribué que chaque partie peut vérifier et que nul ne peut réécrire en douce. L’historique d’un conteneur est infalsifiable par conception.',
      },
      {
        k: 'ID Wallet',
        title: 'Une identité qui vous appartient vraiment',
        body: 'L’identité numérique auto-souveraine permet à un chauffeur ou à une entreprise de prouver exactement qui ils sont — sans céder pour autant une montagne de données privées.',
      },
      {
        k: 'Décentralisé',
        title: 'Aucun pot de miel à pirater',
        body: 'Il n’existe aucun coffre central de secrets commerciaux à viser pour les attaquants, ni aucun point de défaillance unique pour faire tomber le réseau.',
      },
    ],
  },

  insights: {
    eyebrow: 'Analyses',
    title: 'Depuis le port.',
    all: 'Tous les articles',
    posts: [
      {
        cat: 'Analyse',
        date: 'juin 2026',
        title: 'Pourquoi la fraude au retrait de conteneurs est avant tout un problème de sécurité',
        read: '6 min de lecture',
      },
      {
        cat: 'Produit',
        date: 'mai 2026',
        title: 'L’identité auto-souveraine arrive à la porte du terminal',
        read: '4 min de lecture',
      },
      {
        cat: 'Entreprise',
        date: 'avr. 2026',
        title: 'T-Mining renouvelle sa certification ISO 27001:2022',
        read: '3 min de lecture',
      },
    ],
  },

  cta: {
    eyebrow: 'Commencer',
    title: ['Sécurisons votre', 'flux de conteneurs.'],
    lead: 'Découvrez Secure Container Release sur vos propres routes. Réservez une démo de 30 minutes et nous vous montrerons exactement où le code PIN disparaît.',
    bookDemo: 'Réserver une démo',
  },

  footer: {
    tag: 'Sécuriser les flux du commerce mondial grâce à la technologie décentralisée.',
    iso: 'Certifié ISO 27001 : 2022',
    cols: [
      {
        title: 'Solution',
        links: ['Secure Container Release', 'Electronic Delivery Order', 'ID Wallet', 'Pourquoi la confidentialité compte'],
      },
      {
        title: 'Entreprise',
        links: ['À propos de T-Mining', 'Analyses', 'Carrières', 'Contact'],
      },
      {
        title: 'Ressources',
        links: ['Livres blancs', 'La blockchain expliquée', 'Documentation', 'Connexion'],
      },
    ],
    hqLabel: 'Siège social',
    hqLines: ['T-Mining NV · Anvers, Belgique', 'Port d’Anvers-Bruges'],
    backToTop: 'Retour en haut',
    rights: 'Tous droits réservés.',
    credit: 'Refonte conceptuelle · réalisée avec React, Three.js & GSAP',
    legal: ['Confidentialité', 'Conditions', 'Cookies'],
  },
}

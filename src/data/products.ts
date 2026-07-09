export type ProductBadge = "Nouveau" | "Populaire" | "Bientôt";

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // CAD, prix en dollars
  originalPrice?: number;
  topicId: "differential-calculus" | "integral-calculus" | "linear-algebra" | "probability" | "bundle";
  features: string[];
  fileType: "pdf" | "video" | "bundle";
  badge?: ProductBadge;
  // URL Stripe Payment Link — à remplir depuis le dashboard Stripe pour chaque produit.
  // Tant que c'est vide, le bouton affiche "Bientôt disponible".
  stripeUrl: string;
};

// PLACEHOLDERS — Remplacer les stripeUrl par les vraies URLs de Payment Links créées dans le dashboard Stripe.
// Chaque Payment Link peut être configuré pour rediriger vers /achat-confirme?produit=<id> après paiement.
export const products: Product[] = [
  {
    id: "pack-intra-calcul",
    name: "Pack Intra — Calcul différentiel",
    tagline: "Prépare-toi à l'examen intra en 3 heures",
    description:
      "Formulaire complet, 40 problèmes types corrigés couvrant les limites, la dérivation et les applications, plus 5 vidéos de solutions détaillées pour les questions les plus complexes.",
    price: 29,
    originalPrice: 45,
    topicId: "differential-calculus",
    features: [
      "Formulaire officiel PDF (12 pages)",
      "40 problèmes types corrigés",
      "5 vidéos de solutions (~15 min chacune)",
      "Anciens intras corrigés (2 sessions)",
      "Accès à vie et mises à jour gratuites",
    ],
    fileType: "bundle",
    badge: "Populaire",
    stripeUrl: "",
  },
  {
    id: "pack-final-calcul",
    name: "Pack Final — Calcul différentiel",
    tagline: "Toute la matière de la session en un seul pack",
    description:
      "Couvre l'ensemble des chapitres, avec 60 problèmes de synthèse, des rappels visuels et 8 vidéos couvrant les questions à haute valeur.",
    price: 35,
    topicId: "differential-calculus",
    features: [
      "Formulaire complet PDF (18 pages)",
      "60 problèmes de révision corrigés",
      "8 vidéos de solutions",
      "Anciens finaux corrigés (3 sessions)",
      "Accès à vie",
    ],
    fileType: "bundle",
    stripeUrl: "",
  },
  {
    id: "pack-intra-integral",
    name: "Pack Intra — Calcul intégral",
    tagline: "Maîtrise les techniques d'intégration de l'intra",
    description:
      "Intégration par substitution, par parties et par fractions partielles — 40 problèmes types corrigés couvrant toute la matière de l'intra, plus 5 vidéos de solutions détaillées.",
    price: 29,
    originalPrice: 45,
    topicId: "integral-calculus",
    features: [
      "Formulaire officiel PDF (14 pages)",
      "40 problèmes types corrigés",
      "5 vidéos de solutions (~15 min chacune)",
      "Anciens intras corrigés (2 sessions)",
      "Accès à vie et mises à jour gratuites",
    ],
    fileType: "bundle",
    stripeUrl: "",
  },
  {
    id: "pack-final-integral",
    name: "Pack Final — Calcul intégral",
    tagline: "Applications et séries en profondeur",
    description:
      "Aires, volumes, intégrales impropres et séries numériques — 60 problèmes de synthèse avec explications visuelles et 8 vidéos couvrant les questions plus complexes.",
    price: 35,
    topicId: "integral-calculus",
    features: [
      "Formulaire complet PDF (20 pages)",
      "60 problèmes de révision corrigés",
      "8 vidéos de solutions",
      "Anciens finaux corrigés (3 sessions)",
      "Accès à vie",
    ],
    fileType: "bundle",
    stripeUrl: "",
  },
  {
    id: "pack-intra-algebre",
    name: "Pack Intra — Algèbre linéaire",
    tagline: "Systèmes, matrices et déterminants sans confusion",
    description:
      "Résolution de systèmes par Gauss-Jordan, opérations matricielles et calcul de déterminants — 40 problèmes types corrigés plus 5 vidéos de solutions détaillées.",
    price: 29,
    originalPrice: 45,
    topicId: "linear-algebra",
    features: [
      "Formulaire officiel PDF (12 pages)",
      "40 problèmes types corrigés",
      "5 vidéos de solutions (~15 min chacune)",
      "Anciens intras corrigés (2 sessions)",
      "Accès à vie et mises à jour gratuites",
    ],
    fileType: "bundle",
    stripeUrl: "",
  },
  {
    id: "pack-final-algebre",
    name: "Pack Final — Algèbre linéaire",
    tagline: "Vecteurs, droites et plans dans l'espace",
    description:
      "Espaces vectoriels, produits scalaire et vectoriel, droites et plans dans l'espace — 60 problèmes de synthèse et 8 vidéos couvrant les questions les plus complexes.",
    price: 35,
    topicId: "linear-algebra",
    features: [
      "Formulaire complet PDF (18 pages)",
      "60 problèmes de révision corrigés",
      "8 vidéos de solutions",
      "Anciens finaux corrigés (3 sessions)",
      "Accès à vie",
    ],
    fileType: "bundle",
    stripeUrl: "",
  },
  {
    id: "pack-intra-prob",
    name: "Pack Intra — Probabilités et Statistiques",
    tagline: "Maîtrise les concepts clés de l'intra",
    description:
      "Combinatoire, probabilité conditionnelle et lois discrètes expliquées avec 35 problèmes corrigés et 4 vidéos ciblées.",
    price: 29,
    originalPrice: 45,
    topicId: "probability",
    features: [
      "Formulaire complet PDF (10 pages)",
      "35 problèmes types corrigés",
      "4 vidéos de solutions",
      "Anciens intras corrigés (2 sessions)",
      "Accès à vie",
    ],
    fileType: "bundle",
    badge: "Nouveau",
    stripeUrl: "",
  },
  {
    id: "formulaire-prob",
    name: "Formulaire — Probabilités et Statistiques",
    tagline: "L'essentiel condensé sur 6 pages",
    description:
      "Toutes les formules importantes du cours, mises en forme pour être facilement consultables pendant l'étude ou lors des examens permis.",
    price: 7,
    topicId: "probability",
    features: [
      "6 pages PDF haute qualité",
      "Lois discrètes et continues",
      "Tests d'hypothèses et intervalles de confiance",
      "Format imprimable en A4",
    ],
    fileType: "pdf",
    stripeUrl: "",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

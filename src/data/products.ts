// Boutique — un seul package par cours.
//
// Chaque package contient exactement :
//   - Notes de cours complètes (PDF)
//   - Accès à vie au contenu du site + mises à jour gratuites
//   - 3 intras corrigés (PDF)
//   - 3 examens finaux corrigés (PDF)
//
// Contenu identique pour tous les packages → hardcodé dans ProductCard.
// Ici, seuls varient : nom, description, prix, URL Stripe, activation.
//
// Un produit avec `active: false` N'APPARAÎT PAS dans la boutique
// (au lieu d'être affiché en « Bientôt disponible »). Pour activer :
//   1. Créer un Payment Link dans le dashboard Stripe (attache les 7 PDF).
//   2. Coller l'URL dans `stripeUrl`.
//   3. Passer `active: true`.

export type CourseTopicId =
  | "differential-calculus"
  | "integral-calculus"
  | "linear-algebra"
  | "probability";

export type Product = {
  id: string;
  topicId: CourseTopicId;
  courseName: string;
  tagline: string;
  description: string;
  price: number;
  currency: "CAD";
  active: boolean;
  stripeUrl: string;
};

export const products: Product[] = [
  {
    id: "package-calcul-differentiel",
    topicId: "differential-calculus",
    courseName: "Calcul différentiel",
    tagline: "Réussis ton cours de Calcul différentiel",
    description:
      "Limites, dérivées et applications — les notes complètes du cours plus trois intras et trois finaux corrigés pour t'entraîner comme aux vrais examens.",
    price: 49,
    currency: "CAD",
    active: false,
    stripeUrl: "",
  },
  {
    id: "package-calcul-integral",
    topicId: "integral-calculus",
    courseName: "Calcul intégral",
    tagline: "Réussis ton cours de Calcul intégral",
    description:
      "Intégration, aires, volumes et séries — les notes complètes du cours plus trois intras et trois finaux corrigés pour t'entraîner comme aux vrais examens.",
    price: 49,
    currency: "CAD",
    active: false,
    stripeUrl: "",
  },
  {
    id: "package-algebre-lineaire",
    topicId: "linear-algebra",
    courseName: "Algèbre linéaire et géométrie vectorielle",
    tagline: "Réussis ton cours d'Algèbre linéaire",
    description:
      "Matrices, systèmes, espaces vectoriels et géométrie 3D — les notes complètes du cours plus trois intras et trois finaux corrigés pour t'entraîner comme aux vrais examens.",
    price: 49,
    currency: "CAD",
    active: false,
    stripeUrl: "",
  },
  {
    id: "package-probabilites-statistique",
    topicId: "probability",
    courseName: "Probabilités et statistique",
    tagline: "Réussis ton cours de Probabilités et statistique",
    description:
      "Statistiques descriptives, probabilités, inférence, corrélation et test du khi-carré — les notes complètes du cours plus trois intras et trois finaux corrigés pour t'entraîner comme aux vrais examens.",
    price: 49,
    currency: "CAD",
    active: false,
    stripeUrl: "",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getActiveProducts(): Product[] {
  return products.filter((p) => p.active && p.stripeUrl !== "");
}

// Boutique — un seul package par cours.
//
// Un seul paiement. 12 mois d'accès. Aucun abonnement.
//
// L'accès couvre la consultation en ligne et le téléchargement, mises à jour
// incluses, sans renouvellement automatique. Le modèle illimité qui figurait
// ici a été abandonné, et aucune formulation le laissant entendre ne doit
// revenir : elle serait fausse, et suffirait à justifier un remboursement.
// scripts/verifier-textes.sh échoue le build si une telle mention réapparaît.
//
// Contenu identique pour tous les packages → dans ProductCard.
// Ici, seuls varient : nom, description, prix, activation.
//
// ⚠️ `stripeUrl` est un vestige du modèle précédent — un Payment Link avec
// les PDF en pièces jointes, sans compte. Ce n'est plus l'architecture visée :
// l'achat passera par une session Stripe Checkout créée côté serveur, et
// l'accès sera octroyé par le webhook, jamais par la page de succès. Le champ
// disparaîtra quand ce parcours sera en place ; il reste vide d'ici là, ce qui
// garde `getActiveProducts()` sur une liste vide.
//
// La page /boutique n'utilise plus cette liste : elle présente le seul
// package en vente. `getProductById` sert encore à /achat-confirme.

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

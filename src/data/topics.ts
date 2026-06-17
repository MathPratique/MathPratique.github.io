export type Topic = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const topics: Topic[] = [
  {
    id: "differential-calculus",
    name: "Calcul différentiel",
    description: "Limites, dérivées et taux de variation — le langage du changement.",
    icon: "M3 17c3-1 4-9 7-9s3 9 6 9 4-9 5-9",
  },
  {
    id: "integral-calculus",
    name: "Calcul intégral",
    description: "Intégrales, aires et accumulation — sommer l'infiniment petit.",
    icon: "M3 17c3-1 4-9 7-9s3 9 6 9 4-9 5-9 M3 17h18",
  },
  {
    id: "linear-algebra",
    name: "Algèbre linéaire et géométrie vectorielle",
    description: "Vecteurs, matrices, espaces et transformations linéaires.",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM17.5 13.5l3 3.5-3 3.5",
  },
  {
    id: "probability",
    name: "Probabilités et statistiques",
    description: "Hasard, distributions et raisonnement dans l'incertitude.",
    icon: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  },
];

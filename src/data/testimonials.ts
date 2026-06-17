export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    quote:
      "Les solutions étape par étape m'ont enfin fait comprendre la règle de la chaîne. J'ai arrêté d'apprendre par cœur et j'ai commencé à voir pourquoi chaque étape se produit.",
    name: "Priya N.",
    role: "L2, Mathématiques appliquées",
    initials: "PN",
  },
  {
    id: "t2",
    quote:
      "J'utilise MathPratique entre les cours pour enchaîner des exercices. Vingt minutes par jour m'ont plus aidé pour mon partiel d'algèbre linéaire qu'une semaine de bachotage.",
    name: "Marcus T.",
    role: "L3, Informatique",
    initials: "MT",
  },
  {
    id: "t3",
    quote:
      "Enfin un site d'exercices qui n'a pas l'air conçu pour des collégiens. Propre, rapide, et les explications respectent le fait que je maîtrise déjà les bases.",
    name: "Elena R.",
    role: "M1, Statistique",
    initials: "ER",
  },
  {
    id: "t4",
    quote:
      "Les problèmes de probabilités m'ont poussé à vraiment raisonner sur le théorème de Bayes au lieu de coller des chiffres dans une formule incomprise.",
    name: "Jordan K.",
    role: "L1, Économie",
    initials: "JK",
  },
];

export type Topic = {
  id: string;
  name: string;
  description: string;
  icon: string;
  // Contenu enseignant prêt (notes version prof/étudiant, exercices avec démarches,
  // examens corrigés + grilles de correction). Sert à décider si la ligne
  // « Vous êtes enseignant? » s'affiche en bas des pages Pratique de ce cours.
  teacherContentReady?: boolean;
  /**
   * Adresse propre d'une vitrine dédiée, quand la matière en a une.
   *
   * Le calcul différentiel ne passe plus par le sélecteur générique et son
   * unique exercice écrit en dur : il a sa page, alimentée par la banque.
   * Toutes les portes d'entrée — accueil, page Exercices, ancien signet —
   * doivent y mener, sinon un visiteur tombe sur l'ancienne page et croit
   * que le site ne contient qu'un exercice.
   */
  pageDediee?: string;
  /**
   * Nombre d'exercices publiés sur cette vitrine.
   *
   * Écrit ici plutôt que déduit de la banque : importer les données ferait
   * entrer 425 ko dans le bundle de l'accueil, pour afficher un nombre.
   * Un test vérifie qu'il correspond au contenu réellement publié.
   */
  nbExercicesPublies?: number;
};

export const topics: Topic[] = [
  {
    id: "differential-calculus",
    name: "Calcul différentiel",
    description: "Limites, dérivées et taux de variation — le langage du changement.",
    icon: "M3 17c3-1 4-9 7-9s3 9 6 9 4-9 5-9",
    teacherContentReady: true,
    pageDediee: "/exercices/calcul-differentiel",
    nbExercicesPublies: 65,
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
    teacherContentReady: true,
  },
];

export type Chapter = {
  id: string;
  name: string;
  topicId: string;
};

export type Lesson = {
  id: string;
  number: number;
  name: string;
  chapterId: string;
};

export const chapters: Chapter[] = [
  { id: "matrices", name: "Matrices et opérations", topicId: "linear-algebra" },
  { id: "determinants", name: "Déterminants", topicId: "linear-algebra" },
  { id: "systemes", name: "Systèmes linéaires", topicId: "linear-algebra" },
  { id: "vecteurs-geo", name: "Vecteurs géométriques et algébriques", topicId: "linear-algebra" },
  { id: "espaces", name: "Espaces vectoriels", topicId: "linear-algebra" },
  { id: "produits-3d", name: "Produits et géométrie 3D", topicId: "linear-algebra" },
  { id: "droites-plans", name: "Droites et plans dans l'espace", topicId: "linear-algebra" },
];

export const lessons: Lesson[] = [
  // Chapitre 1 — Matrices et opérations
  { id: "L1", number: 1, name: "Définition d'une matrice", chapterId: "matrices" },
  { id: "L2", number: 2, name: "Opérations sur les matrices — partie 1", chapterId: "matrices" },
  { id: "L3", number: 3, name: "Opérations sur les matrices — partie 2", chapterId: "matrices" },
  { id: "L4", number: 4, name: "Multiplication matricielle — partie 1", chapterId: "matrices" },
  { id: "L5", number: 5, name: "Multiplication matricielle — partie 2", chapterId: "matrices" },
  { id: "L6", number: 6, name: "Transposée d'une matrice", chapterId: "matrices" },
  { id: "L7", number: 7, name: "Matrice inverse — partie 1", chapterId: "matrices" },
  { id: "L8", number: 8, name: "Matrice inverse — partie 2", chapterId: "matrices" },
  { id: "L9", number: 9, name: "Matrice inverse — partie 3", chapterId: "matrices" },

  // Chapitre 2 — Déterminants
  { id: "L10", number: 10, name: "Déterminant — partie 1", chapterId: "determinants" },
  { id: "L11", number: 11, name: "Déterminant — partie 2", chapterId: "determinants" },
  { id: "L12", number: 12, name: "Déterminant — partie 3", chapterId: "determinants" },
  { id: "L13", number: 13, name: "Propriétés des déterminants — partie 1", chapterId: "determinants" },
  { id: "L14", number: 14, name: "Propriétés des déterminants — partie 2", chapterId: "determinants" },
  { id: "L15", number: 15, name: "Calcul et propriétés de la matrice inverse — partie 1", chapterId: "determinants" },
  { id: "L16", number: 16, name: "Calcul et propriétés de la matrice inverse — partie 2", chapterId: "determinants" },

  // Chapitre 3 — Systèmes linéaires
  { id: "L17", number: 17, name: "Système d'équations linéaires", chapterId: "systemes" },
  { id: "L18", number: 18, name: "Réduction matricielle — partie 1", chapterId: "systemes" },
  { id: "L19", number: 19, name: "Réduction matricielle — partie 2", chapterId: "systemes" },
  { id: "L20", number: 20, name: "Rang et nombre de solutions", chapterId: "systemes" },
  { id: "L21", number: 21, name: "Méthode de Gauss-Jordan — partie 1", chapterId: "systemes" },
  { id: "L22", number: 22, name: "Méthode de Gauss-Jordan — partie 2", chapterId: "systemes" },

  // Chapitre 4 — Vecteurs géométriques et algébriques
  { id: "L23", number: 23, name: "Vecteurs géométriques — partie 1", chapterId: "vecteurs-geo" },
  { id: "L24", number: 24, name: "Vecteurs géométriques — partie 2", chapterId: "vecteurs-geo" },
  { id: "L25", number: 25, name: "Vecteurs géométriques — partie 3", chapterId: "vecteurs-geo" },
  { id: "L26", number: 26, name: "Démonstration en géométrie", chapterId: "vecteurs-geo" },
  { id: "L27", number: 27, name: "Vecteurs algébriques — partie 1", chapterId: "vecteurs-geo" },
  { id: "L28", number: 28, name: "Vecteurs algébriques — partie 2", chapterId: "vecteurs-geo" },
  { id: "L29", number: 29, name: "Vecteurs algébriques — partie 3", chapterId: "vecteurs-geo" },

  // Chapitre 5 — Espaces vectoriels
  { id: "L34", number: 34, name: "Combinaison linéaire", chapterId: "espaces" },
  { id: "L35", number: 35, name: "Ensemble générateur de V", chapterId: "espaces" },
  { id: "L36", number: 36, name: "Dépendance et indépendance linéaire", chapterId: "espaces" },
  { id: "L37", number: 37, name: "Base et composantes", chapterId: "espaces" },
  { id: "L38", number: 38, name: "Théorème sur les bases — partie 1", chapterId: "espaces" },
  { id: "L39", number: 39, name: "Théorème sur les bases — partie 2", chapterId: "espaces" },
  { id: "L40", number: 40, name: "Théorème sur les bases — partie 3", chapterId: "espaces" },

  // Chapitre 6 — Produits et géométrie 3D
  { id: "L43", number: 43, name: "Produit scalaire — partie 1", chapterId: "produits-3d" },
  { id: "L44", number: 44, name: "Produit scalaire — partie 2", chapterId: "produits-3d" },
  { id: "L45", number: 45, name: "Projection orthogonale", chapterId: "produits-3d" },
  { id: "L46", number: 46, name: "Produit vectoriel — partie 1", chapterId: "produits-3d" },
  { id: "L47", number: 47, name: "Produit vectoriel — partie 2", chapterId: "produits-3d" },
  { id: "L48", number: 48, name: "Produit mixte — partie 1", chapterId: "produits-3d" },
  { id: "L49", number: 49, name: "Produit mixte — partie 2", chapterId: "produits-3d" },

  // Chapitre 7 — Droites et plans dans l'espace
  { id: "L50", number: 50, name: "Droite dans l'espace", chapterId: "droites-plans" },
  { id: "L51", number: 51, name: "Position relative de deux droites", chapterId: "droites-plans" },
  { id: "L52", number: 52, name: "Distance d'un point à une droite", chapterId: "droites-plans" },
  { id: "L53", number: 53, name: "Distance entre deux droites", chapterId: "droites-plans" },
  { id: "L54", number: 54, name: "Plan dans l'espace", chapterId: "droites-plans" },
  { id: "L55", number: 55, name: "Position relative de deux plans", chapterId: "droites-plans" },
  { id: "L56", number: 56, name: "Distance entre un point et un plan", chapterId: "droites-plans" },
  { id: "L57", number: 57, name: "Interactions entre droites et plans — partie 1", chapterId: "droites-plans" },
  { id: "L58", number: 58, name: "Interactions entre droites et plans — partie 2", chapterId: "droites-plans" },
];

export function getChapterById(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getChaptersForTopic(topicId: string): Chapter[] {
  return chapters.filter((c) => c.topicId === topicId);
}

export function getLessonsForChapter(chapterId: string): Lesson[] {
  return lessons.filter((l) => l.chapterId === chapterId);
}

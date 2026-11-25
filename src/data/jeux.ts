// Les jeux du site, affichés sur /jeux. Ajouter un jeu = ajouter une entrée
// ici, déposer ses fichiers dans public/jeux/<slug>/, et ajouter sa page au
// pré-rendu (scripts/prerendre.mjs, mêmes titre et description).
//
// Chaque jeu est une page HTML autonome, affichée dans un iframe de même
// origine par src/pages/PageJeu.tsx : le jeu garde ses propres styles et ses
// commandes au clavier sans rien déranger dans le site. S'il a un classement,
// c'est la page du site qui lit et écrit Firestore pour lui (src/jeux/).

export type Jeu = {
  /** Adresse de la page : /jeux/<slug>. Aussi la clé de son classement. */
  slug: string;
  titre: string;
  /** Une phrase, pour la carte de /jeux. */
  resume: string;
  /** Les notions pratiquées, en quelques mots. */
  notions: string;
  /** Titre et description de la page, pour les moteurs de recherche. */
  titrePage: string;
  descriptionPage: string;
  /** La page HTML du jeu, dans public/. */
  fichier: string;
  /** Image de la carte (capture du jeu), dans public/. */
  image: string;
  /** Texte de remplacement de l'image. */
  imageAlt: string;
  /** Le jeu a-t-il un classement Firestore ? */
  classement: boolean;
};

export const JEUX: Jeu[] = [
  {
    slug: "jardin-des-derivees",
    titre: "Le jardin des dérivées",
    resume:
      "Un labyrinthe de haies en 3D, sans carte. Des grilles barrent le chemin : trouve la bonne dérivée pour les ouvrir, et la clé cachée de chaque jardin.",
    notions: "Règles de la puissance, du produit et du quotient, dérivée en chaîne",
    titrePage: "Le jardin des dérivées — un jeu de dérivées en 3D | MathPratique",
    descriptionPage:
      "Un labyrinthe en 3D où chaque grille s'ouvre avec la bonne dérivée : règle de la puissance, du produit, du quotient et dérivée en chaîne. Gratuit, sans compte, à jouer à l'ordinateur.",
    fichier: "/jeux/jardin-des-derivees/jeu.html",
    image: "/jeux/jardin-des-derivees/apercu.webp",
    imageAlt: "Une allée de haies de cèdres fermée par une grille de fer forgé, sous un ciel bleu.",
    classement: true,
  },
];

export function trouverJeu(slug: string | undefined): Jeu | undefined {
  return JEUX.find((j) => j.slug === slug);
}

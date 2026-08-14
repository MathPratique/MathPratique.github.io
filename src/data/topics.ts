/**
 * Palette d'un cours — source unique pour toutes les cartes du site.
 *
 * `bg`, `hoverBg`, `iconBg`, `ring` : la carte pleine (Exercices, Quiz,
 *   Boutique, TopicsShowcase de l'accueil). Toutes les cartes vraiment
 *   colorées passent par ces quatre champs.
 * `accentTexte`, `accentBouton` : versions sobres pour la page package
 *   du cours (badge, bouton d'achat, icônes de checklist). Le corps de
 *   la page reste neutre — voir §4 du prompt Boutique.
 */
export type CouleurCours = {
  bg: string;
  hoverBg: string;
  iconBg: string;
  ring: string;
  accentTexte: string;
  /** Badge « pastille » : fond pastel + texte foncé. Ex. étiquette « Boutique ». */
  accentBadge: string;
  accentBouton: string;
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  icon: string;
  couleur: CouleurCours;
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
  /**
   * Taille totale de la banque (gratuits + payants). Utilisé sur la carte
   * pour afficher « 65 exercices sur 305 » — le total réel, pas seulement
   * la portion accessible. Sans ce champ, seul `nbExercicesPublies` est
   * affiché (matières sans package).
   */
  nbExercicesTotal?: number;
  /**
   * Cache la carte dans les listes publiques (TopicPicker → page d'accueil
   * des cours et sélecteur du quiz personnalisé). Utile pour un cours dont
   * on ne veut aucune trace publique. À retirer quand le contenu est publié.
   */
  masquerListe?: boolean;
  /**
   * Le cours apparaît dans les listes mais avec la mention « À venir » et
   * une carte non cliquable — pas de lien, pas de curseur, pas de focus
   * clavier. Utile pour promettre visuellement un cours à venir sans
   * exposer une coquille vide.
   *
   * Sémantique distincte de `masquerListe` :
   *   masquerListe   → carte absente
   *   enPreparation  → carte présente mais inerte
   *
   * Le quiz personnalisé filtre les cours `enPreparation` (aucun contenu
   * à piocher) — voir TopicPicker avec `resterSurPlace = true`.
   */
  enPreparation?: boolean;
};

/**
 * Texte du badge d'une carte de matière — piloté strictement par les
 * données de `topics.ts`, aucune condition écrite en dur sur un `id`.
 *
 *   enPreparation                          → « À venir »
 *   nbExercicesTotal > nbExercicesPublies  → « X gratuits · Y avec le package »
 *   sinon                                   → « X exercices »
 *
 * @param gratuitsCalcule  Nombre de gratuits calculé en amont depuis le
 *   tableau `exercises` — évite d'importer `exercises` ici et le cycle
 *   potentiel avec des couches qui remonteraient vers topics.ts.
 */
export function badgeMatiere(topic: Topic, gratuitsCalcule: number): string {
  if (topic.enPreparation) return "À venir";
  const gratuits = topic.nbExercicesPublies ?? gratuitsCalcule;
  const total = topic.nbExercicesTotal;
  if (typeof total === "number" && total > gratuits) {
    return `${gratuits} gratuits · ${total} avec le package`;
  }
  return `${gratuits} exercice${gratuits > 1 ? "s" : ""}`;
}

export const topics: Topic[] = [
  {
    id: "differential-calculus",
    name: "Calcul différentiel",
    description: "Limites, dérivées et taux de variation — le langage du changement.",
    icon: "M3 17c3-1 4-9 7-9s3 9 6 9 4-9 5-9",
    couleur: {
      bg: "bg-indigo-500",
      hoverBg: "hover:bg-indigo-600",
      iconBg: "bg-indigo-400/40",
      ring: "ring-indigo-200",
      accentTexte: "text-indigo-700",
      accentBadge: "bg-indigo-100 text-indigo-700",
      accentBouton: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
    teacherContentReady: true,
    pageDediee: "/exercices/calcul-differentiel",
    nbExercicesPublies: 65,
    nbExercicesTotal: 305,
  },
  {
    id: "integral-calculus",
    name: "Calcul intégral",
    description: "Intégrales, aires et accumulation — sommer l'infiniment petit.",
    icon: "M3 17c3-1 4-9 7-9s3 9 6 9 4-9 5-9 M3 17h18",
    couleur: {
      bg: "bg-emerald-500",
      hoverBg: "hover:bg-emerald-600",
      iconBg: "bg-emerald-400/40",
      ring: "ring-emerald-200",
      accentTexte: "text-emerald-700",
      accentBadge: "bg-emerald-100 text-emerald-700",
      accentBouton: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    // Contenu à venir (matériel réel prévu pour l'automne 2026). La carte
    // reste visible dans les listes publiques mais rendue inerte — pas de
    // lien, pas de curseur, pas de focus clavier. Le quiz personnalisé la
    // filtre séparément (aucun contenu à piocher).
    enPreparation: true,
  },
  {
    id: "linear-algebra",
    name: "Algèbre linéaire et géométrie vectorielle",
    description: "Vecteurs, matrices, espaces et transformations linéaires.",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM17.5 13.5l3 3.5-3 3.5",
    couleur: {
      bg: "bg-fuchsia-500",
      hoverBg: "hover:bg-fuchsia-600",
      iconBg: "bg-fuchsia-400/40",
      ring: "ring-fuchsia-200",
      accentTexte: "text-fuchsia-700",
      accentBadge: "bg-fuchsia-100 text-fuchsia-700",
      accentBouton: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
    },
  },
  {
    id: "probability",
    name: "Probabilités et statistiques",
    description: "Hasard, distributions et raisonnement dans l'incertitude.",
    icon: "M4 19V9M10 19V5M16 19v-7M22 19H2",
    couleur: {
      bg: "bg-amber-500",
      hoverBg: "hover:bg-amber-600",
      iconBg: "bg-amber-400/40",
      ring: "ring-amber-200",
      accentTexte: "text-amber-700",
      accentBadge: "bg-amber-100 text-amber-700",
      accentBouton: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    teacherContentReady: true,
  },
];

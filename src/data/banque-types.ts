// ===========================================================================
//  Les types d'une banque d'exercices, indépendants du cours.
// ===========================================================================
//
// Extraits ici quand un deuxième cours est arrivé. Le module
// `calcul-differentiel/index.ts` garde ses propres définitions, identiques à
// celles-ci en plus strictes : il n'a pas été touché, parce qu'il est en
// production et que rien ne l'exige. Ses exercices restent assignables aux
// types ci-dessous — un champ obligatoire satisfait un champ optionnel.
//
// Deux champs sont optionnels ici alors qu'ils ne le sont pas côté calcul
// différentiel, et ce n'est pas un relâchement :
//
//   tempsEstime  les 63 exercices difficiles ajoutés au chapitre 2 de
//                prob-stat n'en ont pas — décision de l'auteur, pas un oubli
//   figure       aucun exercice de prob-stat n'a de figure

export type TypeExercice = "qcm" | "vrai-faux" | "calcul-court" | "calcul-long";
export type Difficulte = "facile" | "moyen" | "difficile";
export type Palier = "enonce" | "indice" | "reponse" | "demarche";

/** Choix d'un QCM ou d'un vrai/faux, tel qu'écrit dans les JSON. */
export type Choix = { cle: string; texte: string };

/**
 * Analyse d'un choix — présente dans l'étape « démarche », séparée des choix
 * pour que le DOM initial ne révèle pas la bonne réponse.
 *
 * `explication` est OPTIONNELLE, et le déclarer obligatoire a coûté un écran
 * blanc : 64 des 83 QCM de prob-stat n'en ont pas — leur banque d'origine ne
 * prévoyait pas d'explication par choix, et la conversion n'en a pas inventé.
 * Le type promettait une chaîne, l'affichage la passait à un composant qui
 * appelle des méthodes de chaîne dessus, et le clic sur une option faisait
 * tomber la page.
 *
 * Tout consommateur doit donc gérer son absence : montrer le verdict et la
 * bonne réponse suffit, l'explication est un bonus quand elle existe.
 */
export type AnalyseChoix = { cle: string; correct: boolean; explication?: string };

export type Etape =
  | {
      etape: "enonce";
      titre: string;
      texte: string;
      /** Chemin relatif au dossier du cours. Absent si le cours n'a pas de figures. */
      figure?: string;
      /** Présent pour les QCM et les vrai/faux. */
      choix?: Choix[];
    }
  | { etape: "indice" | "reponse"; titre: string; texte: string }
  | {
      etape: "demarche";
      titre: string;
      lignes: string[];
      /** Analyse de chaque choix pour les QCM. Absent pour les autres types. */
      analyseChoix?: AnalyseChoix[];
      /** Piège pédagogique classique, à afficher en fin de démarche. */
      piegeCourant?: string;
    };

export type Exercice = {
  id: string;
  chapitre: number;
  section: string;
  type: TypeExercice;
  difficulte: Difficulte;
  /** En minutes. Absent quand l'auteur n'en a pas fixé. */
  tempsEstime?: number;
  sectionNotes?: string;
  motsCles?: string[];
  savoirFaire?: string | string[];
  etapes: Etape[];
};

export type Chapitre = {
  numero: number;
  titre: string;
  /** Titre riche en notions, pour les en-têtes et le référencement. */
  intitule: string;
  exercices: Exercice[];
  /** Ce qui existe au-delà, compté sur les fiches — jamais sur le contenu. */
  autres: number;
  total: number;
};

export const LIB_TYPE: Record<TypeExercice, string> = {
  qcm: "Choix multiple",
  "vrai-faux": "Vrai ou faux",
  "calcul-court": "Courte démarche",
  "calcul-long": "Problème complet",
};

export const LIB_DIFFICULTE: Record<Difficulte, string> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
};

// ---------------------------------------------------------------------------
//  Le catalogue d'une banque — le schéma, écrit une fois pour toutes
// ---------------------------------------------------------------------------
//
// `catalogue.json` est importé par le site : il part dans le bundle
// JavaScript que télécharge chaque visiteur, dès la page d'accueil. Tout ce
// qu'il contient est donc PUBLIC.
//
// Il était jusqu'ici recopié tel quel depuis l'export du projet jumeau, sans
// schéma. C'est ainsi qu'un champ `code` portant le sigle du cours a fini en
// ligne : personne ne l'avait voulu, rien ne l'arrêtait. Or les fichiers de
// structure des projets jumeaux contiennent aussi `etablissement` et `auteur`
// — le prochain générateur qui les recopierait ferait fuir un nom
// d'établissement et un nom de personne de la même façon.
//
// D'où une LISTE BLANCHE, et non une liste noire : une clé absente de la
// liste est refusée, même inconnue aujourd'hui. Les scripts de
// synchronisation (`scripts/sync-banque-*.js`) échouent au lieu de publier.
// Ajouter une clé ici doit rester un geste délibéré, pesé au regard de la
// règle : aucun sigle de cours, aucun nom d'établissement, aucun nom de
// personne dans le matériel public.

/** Les seules clés de premier niveau qu'un catalogue public peut porter. */
export const CLES_CATALOGUE = [
  "cours",
  "droits",
  "commentaire",
  "heures",
  "totaux",
  "exercices",
] as const;

/**
 * Clés déjà rencontrées dans les fichiers de structure des projets jumeaux,
 * et qui ne doivent JAMAIS atteindre le bundle. La liste blanche les refuse
 * de toute façon ; les nommer ici sert au message d'erreur, qui dit alors
 * pourquoi la clé est interdite plutôt que simplement « inconnue ».
 */
export const CLES_INTERDITES_CATALOGUE: Record<string, string> = {
  code: "sigle de cours",
  etablissement: "nom d'établissement",
  auteur: "nom de personne",
};

export type CatalogueBanque = {
  cours: string;
  droits: string;
  commentaire?: string;
  /** Heures de théorie par chapitre — seul le calcul différentiel en a. */
  heures?: Record<string, number>;
  totaux: { gratuit: number; payant: number };
  exercices: unknown[];
};

/**
 * Les clés de premier niveau que le schéma refuse, chacune avec sa raison.
 * Tableau vide : le catalogue est publiable.
 */
export function clesRefuseesCatalogue(
  catalogue: Record<string, unknown>,
): { cle: string; raison: string }[] {
  const permises = new Set<string>(CLES_CATALOGUE);
  return Object.keys(catalogue)
    .filter((cle) => !permises.has(cle))
    .map((cle) => ({
      cle,
      raison: CLES_INTERDITES_CATALOGUE[cle] ?? "clé absente du schéma",
    }));
}

/** Le palier d'une étape, ou null si l'étape est absente. */
export function etape(ex: Exercice, palier: Palier): Etape | null {
  return ex.etapes.find((e) => e.etape === palier) ?? null;
}

export function enonce(ex: Exercice): string {
  const e = etape(ex, "enonce");
  return e && "texte" in e ? e.texte : "";
}

// ===========================================================================
//  La vitrine gratuite de Calcul différentiel.
// ===========================================================================
//
// Deux sources, produites par le projet de matériel de cours et recopiées
// ici telles quelles :
//
//   chNN.json       le CONTENU des 65 exercices ouverts, et rien d'autre
//   catalogue.json  une fiche signalétique par exercice — les 305, gratuits
//                   comme payants — sans le moindre contenu
//
// La séparation est faite à la source, par liste blanche : les 240 exercices
// payants n'ont ici que leur type, leur difficulté et leur chapitre. C'est
// ce qui permet d'annoncer « 48 autres avec le package » sans rien publier
// de ces 48. Il n'y a pas de filtrage à faire côté navigateur, et il ne doit
// pas y en avoir : ce qui n'est pas dans le fichier ne peut pas fuir.

import catalogue from "./catalogue.json";
import ch01 from "./ch01.json";
import ch02 from "./ch02.json";
import ch03 from "./ch03.json";
import ch04 from "./ch04.json";
import ch05 from "./ch05.json";
import ch06 from "./ch06.json";
import ch07 from "./ch07.json";

export type TypeExercice = "qcm" | "vrai-faux" | "calcul-court" | "calcul-long";
export type Difficulte = "facile" | "moyen" | "difficile";
export type Palier = "enonce" | "indice" | "reponse" | "demarche";

/** Choix d'un QCM ou d'un vrai/faux, tel qu'écrit dans les JSON. */
export type Choix = { cle: string; texte: string };

/**
 * Analyse d'un choix — présente dans l'étape « démarche », séparée des
 * choix pour que le DOM initial ne révèle pas la bonne réponse. Le JSON
 * servi au navigateur contient ces données, mais elles ne s'écrivent
 * dans le HTML rendu qu'après le clic de l'étudiant.
 */
export type AnalyseChoix = { cle: string; correct: boolean; explication: string };

export type Etape =
  | {
      etape: "enonce";
      titre: string;
      texte: string;
      /** Chemin relatif au dossier calcul-differentiel/, ex. « figures/CD-C01-E003.svg ». */
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
  tempsEstime: number;
  sectionNotes?: string;
  motsCles?: string[];
  savoirFaire?: string;
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

const BRUTS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07] as unknown as {
  chapitre: number;
  titre: string;
  exercices: Exercice[];
}[];

/**
 * Intitulés destinés aux en-têtes de section et aux moteurs de recherche.
 *
 * Les titres de la banque — « Limites », « Continuité » — sont exacts mais
 * ne disent rien à quelqu'un qui cherche « forme indéterminée » ou « taux
 * liés ». On garde le titre court pour la navigation et on ajoute un
 * intitulé qui nomme les notions réellement travaillées.
 */
const INTITULES: Record<number, string> = {
  1: "Fonctions, domaines et fonctions réciproques",
  2: "Limites, formes indéterminées et asymptotes",
  3: "Continuité, fonctions par parties et théorèmes",
  4: "La dérivée : taux de variation et définition par la limite",
  5: "Règles de dérivation, dérivation en chaîne et dérivation implicite",
  6: "Étude de fonction : nombres critiques, extremums et concavité",
  7: "Taux liés, optimisation et modélisation en sciences de la nature",
};

/** Compte des exercices payants par chapitre, tiré des fiches signalétiques. */
const FICHES = (catalogue as { exercices: { chapitre: number; acces: string }[] }).exercices;

export const CHAPITRES: Chapitre[] = BRUTS.map((c) => {
  const total = FICHES.filter((f) => f.chapitre === c.chapitre).length;
  return {
    numero: c.chapitre,
    titre: c.titre,
    intitule: INTITULES[c.chapitre] ?? c.titre,
    exercices: c.exercices,
    autres: total - c.exercices.length,
    total,
  };
});

export const TOTAL_GRATUITS = CHAPITRES.reduce((n, c) => n + c.exercices.length, 0);
export const TOTAL_BANQUE = FICHES.length;

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

/** Le palier d'une étape, ou null si l'étape est absente. */
export function etape(ex: Exercice, palier: Palier): Etape | null {
  return ex.etapes.find((e) => e.etape === palier) ?? null;
}

export function enonce(ex: Exercice): string {
  const e = etape(ex, "enonce");
  return e && "texte" in e ? e.texte : "";
}

// ═══════════════════════════════════════════════════════════════════════
//  Résolution des figures pré-rendues en SVG.
//
//  Le champ `figure` dans un énoncé contient un chemin relatif au JSON
//  (« figures/CD-C01-E003.svg »). Vite les hache au build via
//  import.meta.glob et sert des assets versionnés en production.
// ═══════════════════════════════════════════════════════════════════════

const svgUrls = import.meta.glob("./figures/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Table `nom-de-fichier → URL Vite`, dérivée du glob. */
const FIGURES: Map<string, string> = new Map(
  Object.entries(svgUrls).map(([chemin, url]) => {
    const nom = chemin.split("/").pop() ?? chemin;
    return [nom, url];
  }),
);

/**
 * Traduit une valeur de `enonce.figure` (chemin relatif au JSON) en URL
 * servable par le navigateur. Renvoie null si le SVG n'existe pas — utile
 * pour ne pas afficher une image cassée sur un exercice dont la figure n'a
 * pas encore été rendue.
 */
export function resoudreFigureUrl(cheminJson: string | undefined): string | null {
  if (!cheminJson) return null;
  const nom = cheminJson.split("/").pop() ?? cheminJson;
  return FIGURES.get(nom) ?? null;
}

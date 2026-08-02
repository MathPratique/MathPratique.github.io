// ===========================================================================
//  Le catalogue des documents téléchargeables.
// ===========================================================================
//
// Ce fichier ne contient QUE des noms et des chemins. Aucun contenu, aucune
// URL publique : les fichiers vivent dans un seau Cloud Storage privé, hors
// du dépôt GitHub Pages. Un PDF déposé dans `public/` serait servi à tout le
// monde, quelles que soient les règles écrites par ailleurs.
//
// Les chemins sont construits à partir de listes plutôt qu'écrits un par un :
// cinquante-sept entrées recopiées à la main finissent toujours par contenir
// une coquille, et une coquille ici se traduit par un fichier introuvable
// pour quelqu'un qui a payé.

import type { Document } from "./telechargement.js";

const COURS = "calcul-differentiel";

/** Racine dans le seau privé. Le seau lui-même n'est jamais public. */
const RACINE = `${COURS}`;

const CHAPITRES: { n: string; titre: string; fichier: string }[] = [
  { n: "1", titre: "Fonctions et domaines", fichier: "ch01-fonctions" },
  { n: "2", titre: "Limites", fichier: "ch02-limites" },
  { n: "3", titre: "Continuité", fichier: "ch03-continuite" },
  { n: "4", titre: "La dérivée : définition", fichier: "ch04-derivee-definition" },
  { n: "5", titre: "Règles de dérivation", fichier: "ch05-regles-derivation" },
  { n: "6", titre: "Étude de fonction", fichier: "ch06-etude-fonction" },
  { n: "7", titre: "Applications", fichier: "ch07-applications-sn" },
];

const SERIES = ["A", "B", "C", "D", "E"];

const EXAMENS: { id: string; titre: string }[] = [
  { id: "intra1", titre: "Examen intra 1" },
  { id: "intra2", titre: "Examen intra 2" },
  { id: "intra3", titre: "Examen intra 3" },
  { id: "intra4", titre: "Examen intra 4" },
  { id: "finalA", titre: "Examen final A" },
  { id: "finalB", titre: "Examen final B" },
];

function doc(
  id: string,
  titre: string,
  chemin: string,
  categorie: Document["categorie"]
): Document {
  return { id, coursId: COURS, titre, chemin: `${RACINE}/${chemin}`, categorie };
}

export const DOCUMENTS: Document[] = [
  // --- Notes de cours, deux versions par chapitre plus les recueils ---------
  doc("notes-complet-etudiant", "Notes complètes — version étudiant",
      "notes/calcul-differentiel-ETUDIANT.pdf", "notes"),
  doc("notes-complet-prof", "Notes complètes — version enseignant",
      "notes/calcul-differentiel-PROF.pdf", "notes"),
  ...CHAPITRES.flatMap((c) => [
    doc(`notes-${c.fichier}-etudiant`, `Chapitre ${c.n} — ${c.titre} (étudiant)`,
        `notes/${c.fichier}-ETUDIANT.pdf`, "notes"),
    doc(`notes-${c.fichier}-prof`, `Chapitre ${c.n} — ${c.titre} (enseignant)`,
        `notes/${c.fichier}-PROF.pdf`, "notes"),
  ]),

  // --- Recueils d'exercices et leurs solutions ------------------------------
  ...CHAPITRES.flatMap((c) => {
    const num = c.fichier.slice(0, 4); // « ch01 »
    return [
      doc(`exercices-${num}`, `Exercices — chapitre ${c.n} : ${c.titre}`,
          `exercices/${num}-recueil.pdf`, "exercices"),
      doc(`exercices-${num}-solutions`, `Solutions — chapitre ${c.n} : ${c.titre}`,
          `exercices/${num}-solutions.pdf`, "exercices"),
    ];
  }),

  // --- Séries de révision mélangées -----------------------------------------
  ...SERIES.flatMap((s) => [
    doc(`melimelo-${s}`, `Série de révision ${s}`, `revision/melimelo-${s}.pdf`, "revision"),
    doc(`melimelo-${s}-solutions`, `Série de révision ${s} — solutions`,
        `revision/melimelo-${s}-solutions.pdf`, "revision"),
  ]),

  // --- Examens : énoncé, corrigé, grille ------------------------------------
  ...EXAMENS.flatMap((e) => [
    doc(e.id, e.titre, `examens/${e.id}.pdf`, "examens"),
    doc(`${e.id}-corrige`, `${e.titre} — corrigé détaillé`, `examens/${e.id}-corrige.pdf`, "examens"),
    doc(`${e.id}-grille`, `${e.titre} — grille de correction`, `examens/${e.id}-grille.pdf`, "examens"),
  ]),
];

/** Recherche par identifiant. Renvoie null plutôt que undefined : la règle
 *  d'autorisation attend explicitement « pas de document ». */
export function trouverDocument(id: string): Document | null {
  return DOCUMENTS.find((d) => d.id === id) ?? null;
}

export const LIBELLES_CATEGORIES: Record<Document["categorie"], string> = {
  notes: "Notes de cours",
  exercices: "Exercices et solutions",
  revision: "Séries de révision",
  examens: "Examens et corrigés",
};

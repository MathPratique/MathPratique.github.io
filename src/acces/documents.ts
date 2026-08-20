// ===========================================================================
//  Le catalogue des documents téléchargeables.
// ===========================================================================
//
// Ce fichier ne contient QUE des noms, des chemins et des niveaux d'accès.
// Aucun contenu, aucune URL publique : les fichiers vivent dans un seau
// Cloud Storage privé, hors du dépôt GitHub Pages. Un PDF déposé dans
// `public/` serait servi à tout le monde, quelles que soient les règles
// écrites par ailleurs.
//
// Les chemins sont construits à partir de listes plutôt qu'écrits un par un :
// soixante-cinq entrées recopiées à la main finissent toujours par contenir
// une coquille, et une coquille ici se traduit par un fichier introuvable
// pour quelqu'un qui a payé.
//
// ─── Niveaux d'accès ─────────────────────────────────────────────────────
//
// Chaque document déclare la liste EXPLICITE des niveaux qui y ont droit.
// Ce n'est PAS une hiérarchie : « acheteur » n'inclut pas « restreint » par
// défaut, chaque document choisit ses ayants droit. Cette souplesse permet
// par exemple qu'un « restreint » (code de classe) reçoive la version
// ÉTUDIANT des notes, tandis qu'un « acheteur » reçoit la version PROF
// (plus complète). Aucun tri automatique par « qui paye le plus voit le
// plus » — la politique éditoriale décide, document par document.

/**
 * Les trois niveaux d'accès possibles, portés par le champ `niveau` d'un
 * `Acces`. Le défaut runtime (accès sans niveau, ou avec un niveau inconnu)
 * est « restreint » — cf. `niveauDe` dans telechargement.ts. Un accès mal
 * configuré doit donner TROP PEU, jamais trop.
 */
export type NiveauAcces = "restreint" | "acheteur" | "enseignant";

/**
 * Un document téléchargeable du catalogue.
 *
 * Ce type vit ici (et pas dans telechargement.ts) parce que le catalogue en
 * est la seule source. telechargement.ts l'importe pour raisonner sur les
 * autorisations, sans jamais en fabriquer.
 */
export type Document = {
  id: string;
  coursId: string;
  titre: string;
  /** Chemin dans le seau privé. Jamais exposé au navigateur. */
  chemin: string;
  categorie: "notes" | "exercices" | "revision" | "examens";
  /**
   * Liste explicite — pas de hiérarchie implicite. Un document visible à
   * un niveau donné doit y figurer, littéralement.
   */
  niveauxAutorises: NiveauAcces[];
};

const COURS = "calcul-differentiel";

/** Racine dans le seau privé. Le seau lui-même n'est jamais public. */
const RACINE = `${COURS}`;

// ─── Constantes de politique de niveau ───────────────────────────────────
//
// Chaque triplet reflète UNE décision éditoriale, nommée par ce qu'elle
// concerne — pas par la valeur de l'énumération. Deux constantes peuvent
// avoir la même valeur littérale (notes-PROF et examens partagent
// ["acheteur", "enseignant"]) : c'est voulu, la valeur commune n'est pas
// une coïncidence à extraire, ce sont deux politiques distinctes qui se
// trouvent aujourd'hui à coïncider et qui peuvent diverger demain.

/** Les notes version ÉTUDIANT : restreint (codes de classe) + enseignant. */
const NIVEAUX_NOTES_ETUDIANT: NiveauAcces[] = ["restreint", "enseignant"];

/** Les notes version PROF : réservées aux acheteurs (et enseignants). */
const NIVEAUX_NOTES_ENSEIGNANT: NiveauAcces[] = ["acheteur", "enseignant"];

/** Exercices et séries de révision : ouverts à tous les niveaux. */
const NIVEAUX_EXERCICES_REVISION: NiveauAcces[] = [
  "restreint",
  "acheteur",
  "enseignant",
];

/** Examens : réservés aux acheteurs (et enseignants). */
const NIVEAUX_EXAMENS: NiveauAcces[] = ["acheteur", "enseignant"];

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
  categorie: Document["categorie"],
  niveauxAutorises: NiveauAcces[],
): Document {
  return {
    id,
    coursId: COURS,
    titre,
    chemin: `${RACINE}/${chemin}`,
    categorie,
    niveauxAutorises,
  };
}

export const DOCUMENTS: Document[] = [
  // --- Notes de cours, deux versions par chapitre plus les recueils ---------
  doc(
    "notes-complet-etudiant",
    "Notes complètes — version étudiant",
    "notes/calcul-differentiel-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    "notes-complet-prof",
    "Notes complètes — version enseignant",
    "notes/calcul-differentiel-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  ...CHAPITRES.flatMap((c) => [
    doc(
      `notes-${c.fichier}-etudiant`,
      `Chapitre ${c.n} — ${c.titre} (étudiant)`,
      `notes/${c.fichier}-ETUDIANT.pdf`,
      "notes",
      NIVEAUX_NOTES_ETUDIANT,
    ),
    doc(
      `notes-${c.fichier}-prof`,
      `Chapitre ${c.n} — ${c.titre} (enseignant)`,
      `notes/${c.fichier}-PROF.pdf`,
      "notes",
      NIVEAUX_NOTES_ENSEIGNANT,
    ),
  ]),

  // --- Recueils d'exercices : énoncés, indices, corrigé ---------------------
  //
  // Trois fichiers par chapitre plutôt que deux : le PDF « indices » vit à
  // côté du corrigé complet, pour que l'étudiant qui bloque puisse recevoir
  // une piste sans consulter la solution intégrale. L'ordre ci-dessous
  // (énoncés → indices → corrigé) est aussi l'ordre d'affichage dans
  // /mon-compte — la progression pédagogique attendue.
  //
  // L'ID de l'énoncé garde la forme courte `exercices-chXX`, sans suffixe :
  // c'est le fichier « principal » du triplet, comme `intra1` l'est pour le
  // triplet énoncé / corrigé / grille des examens plus bas.
  ...CHAPITRES.flatMap((c) => {
    const num = c.fichier.slice(0, 4); // « ch01 »
    return [
      doc(
        `exercices-${num}`,
        `Exercices — chapitre ${c.n} : ${c.titre}`,
        `exercices/${num}-1-exercices.pdf`,
        "exercices",
        NIVEAUX_EXERCICES_REVISION,
      ),
      doc(
        `exercices-${num}-indices`,
        `Indices — chapitre ${c.n} : ${c.titre}`,
        `exercices/${num}-2-indices.pdf`,
        "exercices",
        NIVEAUX_EXERCICES_REVISION,
      ),
      doc(
        `exercices-${num}-corrige`,
        `Corrigé — chapitre ${c.n} : ${c.titre}`,
        `exercices/${num}-3-corrige.pdf`,
        "exercices",
        NIVEAUX_EXERCICES_REVISION,
      ),
    ];
  }),

  // --- Séries de révision mélangées -----------------------------------------
  ...SERIES.flatMap((s) => [
    doc(
      `melimelo-${s}`,
      `Série de révision ${s}`,
      `revision/melimelo-${s}.pdf`,
      "revision",
      NIVEAUX_EXERCICES_REVISION,
    ),
    doc(
      `melimelo-${s}-solutions`,
      `Série de révision ${s} — solutions`,
      `revision/melimelo-${s}-solutions.pdf`,
      "revision",
      NIVEAUX_EXERCICES_REVISION,
    ),
  ]),

  // --- Examens : énoncé, corrigé, grille ------------------------------------
  ...EXAMENS.flatMap((e) => [
    doc(e.id, e.titre, `examens/${e.id}.pdf`, "examens", NIVEAUX_EXAMENS),
    doc(
      `${e.id}-corrige`,
      `${e.titre} — corrigé détaillé`,
      `examens/${e.id}-corrige.pdf`,
      "examens",
      NIVEAUX_EXAMENS,
    ),
    doc(
      `${e.id}-grille`,
      `${e.titre} — grille de correction`,
      `examens/${e.id}-grille.pdf`,
      "examens",
      NIVEAUX_EXAMENS,
    ),
  ]),
];

/** Recherche par identifiant. Renvoie null plutôt que undefined : la règle
 *  d'autorisation attend explicitement « pas de document ». */
export function trouverDocument(id: string): Document | null {
  return DOCUMENTS.find((d) => d.id === id) ?? null;
}

/**
 * Vrai si ce document est visible pour ce niveau d'accès. Pas de hiérarchie :
 * on regarde uniquement la liste explicite `niveauxAutorises` du document.
 */
export function documentVisible(doc: Document, niveau: NiveauAcces): boolean {
  return doc.niveauxAutorises.includes(niveau);
}

/** Le catalogue filtré pour un niveau donné. */
export function documentsVisibles(niveau: NiveauAcces): Document[] {
  return DOCUMENTS.filter((d) => documentVisible(d, niveau));
}

export const LIBELLES_CATEGORIES: Record<Document["categorie"], string> = {
  notes: "Notes de cours",
  exercices: "Exercices et solutions",
  revision: "Séries de révision",
  examens: "Examens et corrigés",
};

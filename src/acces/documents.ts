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
// ⚠️ CE FICHIER PART AUSSI DANS LES CLOUD FUNCTIONS ────────────────────────
//
// `functions/tsconfig.json` remonte d'un cran pour inclure ce dossier :
// `obtenirLienTelechargement` appelle `trouverDocument()` avec SA PROPRE
// copie compilée du catalogue. Modifier ce fichier et pousser sur `main` met
// donc à jour le site, mais PAS la fonction — les cartes de téléchargement
// s'affichent et chaque demande répond `document-inconnu`.
//
// Toute modification ici exige, depuis la racine du dépôt :
//
//     firebase deploy --only functions
//
// Rien ne le détecte au build. Voir DETTE-TECHNIQUE.md, entrée du 2026-08-24.
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

/**
 * Un cours du catalogue.
 *
 * `id` sert à trois choses à la fois, et c'est délibéré : c'est la racine du
 * dossier dans le seau privé, la clé du document Firestore
 * `utilisateurs/{uid}/acces/{coursId}`, et la valeur comparée par
 * `deciderTelechargement` pour refuser un document d'un autre cours. Une
 * seule chaîne pour les trois — trois constantes finiraient par diverger, et
 * la divergence porterait sur qui a le droit de télécharger quoi.
 *
 * `prefixeId` préfixe les identifiants de documents du cours. Il existe pour
 * une raison précise : les identifiants doivent être uniques dans TOUT le
 * catalogue, or les schémas d'identifiants se répètent d'un cours à l'autre.
 * `exercices-ch01` conviendrait aussi bien au calcul différentiel qu'aux
 * probabilités — deux documents distincts, un seul identifiant, et le
 * mauvais fichier livré. Le préfixe rend la collision impossible par
 * construction plutôt que de compter sur le test qui la détecterait.
 *
 * Le calcul différentiel porte un préfixe VIDE, et n'en portera jamais : ses
 * identifiants sont déjà servis à des gens qui ont payé, cités dans l'UI et
 * dans les accès Firestore existants. Les renommer casserait leurs
 * téléchargements pour un gain purement esthétique. Tout cours ajouté après
 * lui prend un préfixe.
 */
type Cours = {
  id: string;
  prefixeId: string;
};

const CALCUL_DIFFERENTIEL: Cours = {
  id: "calcul-differentiel",
  prefixeId: "",
};

const PROBABILITES_STATISTIQUE: Cours = {
  id: "probabilites-statistique",
  prefixeId: "ps-",
};

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

type Chapitre = { n: string; titre: string; fichier: string };

const CHAPITRES_CALCUL: Chapitre[] = [
  { n: "1", titre: "Fonctions et domaines", fichier: "ch01-fonctions" },
  { n: "2", titre: "Limites", fichier: "ch02-limites" },
  { n: "3", titre: "Continuité", fichier: "ch03-continuite" },
  { n: "4", titre: "La dérivée : définition", fichier: "ch04-derivee-definition" },
  { n: "5", titre: "Règles de dérivation", fichier: "ch05-regles-derivation" },
  { n: "6", titre: "Étude de fonction", fichier: "ch06-etude-fonction" },
  { n: "7", titre: "Applications", fichier: "ch07-applications-sn" },
];

/**
 * Probabilités et statistique (201-SN1-RE). Les `fichier` sont les slugs
 * produits par `notes-201-SN1-RE/build.sh` — ASCII, minuscules, sans
 * underscore. Ils doivent correspondre au nom réel du PDF dans le seau :
 * un accent ou une majuscule de travers ici, et le fichier est introuvable
 * pour quelqu'un qui y a droit.
 */
const CHAPITRES_PROBSTAT: Chapitre[] = [
  { n: "1", titre: "Statistiques descriptives", fichier: "ch01-statistiques-descriptives" },
  { n: "2", titre: "Probabilités", fichier: "ch02-probabilites" },
  { n: "3", titre: "Inférence statistique", fichier: "ch03-inference-statistique" },
  {
    n: "4",
    titre: "Corrélation, régression et test du khi-carré",
    fichier: "ch04-correlation-regression-khi-carre",
  },
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

/**
 * Fabrique une entrée du catalogue. `cours` en premier paramètre parce que
 * c'est lui qui décide à la fois du préfixe d'identifiant et de la racine du
 * chemin — les deux endroits où une confusion entre cours se paie.
 */
function doc(
  cours: Cours,
  id: string,
  titre: string,
  chemin: string,
  categorie: Document["categorie"],
  niveauxAutorises: NiveauAcces[],
): Document {
  return {
    id: `${cours.prefixeId}${id}`,
    coursId: cours.id,
    titre,
    chemin: `${cours.id}/${chemin}`,
    categorie,
    niveauxAutorises,
  };
}

/**
 * Les deux versions d'un chapitre de notes. Identique pour tous les cours :
 * même paire de fichiers, même politique de niveaux, seul le slug change.
 */
function notesDeChapitre(cours: Cours, c: Chapitre): Document[] {
  return [
    doc(
      cours,
      `notes-${c.fichier}-etudiant`,
      `Chapitre ${c.n} — ${c.titre} (étudiant)`,
      `notes/${c.fichier}-ETUDIANT.pdf`,
      "notes",
      NIVEAUX_NOTES_ETUDIANT,
    ),
    doc(
      cours,
      `notes-${c.fichier}-prof`,
      `Chapitre ${c.n} — ${c.titre} (enseignant)`,
      `notes/${c.fichier}-PROF.pdf`,
      "notes",
      NIVEAUX_NOTES_ENSEIGNANT,
    ),
  ];
}

export const DOCUMENTS: Document[] = [
  // ═══ Calcul différentiel ═══════════════════════════════════════════════

  // --- Notes de cours, deux versions par chapitre plus les recueils ---------
  doc(
    CALCUL_DIFFERENTIEL,
    "notes-complet-etudiant",
    "Notes complètes — version étudiant",
    "notes/calcul-differentiel-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_DIFFERENTIEL,
    "notes-complet-prof",
    "Notes complètes — version enseignant",
    "notes/calcul-differentiel-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  ...CHAPITRES_CALCUL.flatMap((c) => notesDeChapitre(CALCUL_DIFFERENTIEL, c)),

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
  ...CHAPITRES_CALCUL.flatMap((c) => {
    const num = c.fichier.slice(0, 4); // « ch01 »
    return [
      doc(
        CALCUL_DIFFERENTIEL,
        `exercices-${num}`,
        `Exercices — chapitre ${c.n} : ${c.titre}`,
        `exercices/${num}-1-exercices.pdf`,
        "exercices",
        NIVEAUX_EXERCICES_REVISION,
      ),
      doc(
        CALCUL_DIFFERENTIEL,
        `exercices-${num}-indices`,
        `Indices — chapitre ${c.n} : ${c.titre}`,
        `exercices/${num}-2-indices.pdf`,
        "exercices",
        NIVEAUX_EXERCICES_REVISION,
      ),
      doc(
        CALCUL_DIFFERENTIEL,
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
      CALCUL_DIFFERENTIEL,
      `melimelo-${s}`,
      `Série de révision ${s}`,
      `revision/melimelo-${s}.pdf`,
      "revision",
      NIVEAUX_EXERCICES_REVISION,
    ),
    doc(
      CALCUL_DIFFERENTIEL,
      `melimelo-${s}-solutions`,
      `Série de révision ${s} — solutions`,
      `revision/melimelo-${s}-solutions.pdf`,
      "revision",
      NIVEAUX_EXERCICES_REVISION,
    ),
  ]),

  // --- Examens : énoncé, corrigé, grille ------------------------------------
  ...EXAMENS.flatMap((e) => [
    doc(
      CALCUL_DIFFERENTIEL,
      e.id,
      e.titre,
      `examens/${e.id}.pdf`,
      "examens",
      NIVEAUX_EXAMENS,
    ),
    doc(
      CALCUL_DIFFERENTIEL,
      `${e.id}-corrige`,
      `${e.titre} — corrigé détaillé`,
      `examens/${e.id}-corrige.pdf`,
      "examens",
      NIVEAUX_EXAMENS,
    ),
    doc(
      CALCUL_DIFFERENTIEL,
      `${e.id}-grille`,
      `${e.titre} — grille de correction`,
      `examens/${e.id}-grille.pdf`,
      "examens",
      NIVEAUX_EXAMENS,
    ),
  ]),

  // ═══ Probabilités et statistique (201-SN1-RE) ══════════════════════════
  //
  // Quatre chapitres, deux versions chacun : huit documents, tous en
  // catégorie « notes ».
  //
  // Trois absences, toutes voulues à ce stade :
  //
  //   - Pas de recueil complet. Le calcul différentiel en a un parce qu'il
  //     a un `main.tex` qui assemble ses chapitres ; les notes SN1 sont
  //     quatre documents autonomes, sans document maître. Le recueil
  //     viendra quand ce main existera.
  //   - Pas d'exercices. La banque SN1 est au format d'origine, sans les
  //     champs `acces`, `indice` ni `choix` dont dépend la production des
  //     cahiers — voir exercices-prob-stat/README.md.
  //   - Ni révision ni examens : rien n'est encore écrit.
  //
  // Ces catégories s'ajouteront ici sans rien changer à ce qui précède : un
  // document absent du catalogue est simplement un document que personne ne
  // peut demander.
  ...CHAPITRES_PROBSTAT.flatMap((c) => notesDeChapitre(PROBABILITES_STATISTIQUE, c)),
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

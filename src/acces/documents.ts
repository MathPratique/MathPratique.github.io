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

const CALCUL_INTEGRAL: Cours = {
  id: "calcul-integral",
  prefixeId: "ci-",
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

/**
 * Les trois cahiers qu'un chapitre peut avoir : les énoncés, les indices, le
 * corrigé.
 *
 * Un chapitre déclare EXPLICITEMENT lesquels existent. Il n'y a pas de
 * valeur par défaut « les trois » : un chapitre qui ne déclare rien ne publie
 * aucun cahier. C'est délibéré — le défaut doit être le silence, parce
 * qu'une entrée de catalogue sans fichier dans le seau produit une carte
 * visible dont le bouton échoue, pour quelqu'un qui a payé.
 *
 * Le chapitre 2 de prob-stat en est l'illustration : ses indices ne sont pas
 * écrits (97 exercices sur 160 n'en ont pas), donc il ne déclare que
 * `exercices` et `corrige`. Le jour où ils le seront, on ajoute `indices` à
 * sa liste et l'entrée apparaît — sans toucher à rien d'autre.
 *
 * Depuis le 2026-10-05, AUCUN cours ne déclare `indices` : le calcul
 * différentiel a fusionné les siens dans son corrigé. La valeur reste dans
 * le type parce que le mécanisme sert toujours — c'est la porte d'entrée
 * pour prob-stat.
 */
type Cahier = "exercices" | "indices" | "corrige";

/**
 * Ce qui distingue les trois cahiers dans le nom du fichier, l'identifiant et
 * le titre affiché. Le suffixe d'identifiant des énoncés est vide : leur id
 * garde la forme courte `exercices-chXX`, parce que c'est le fichier
 * « principal » du triplet — comme `intra1` l'est pour son triplet d'examen.
 */
const CAHIERS: Record<Cahier, { fichier: string; suffixeId: string; libelle: string }> = {
  exercices: { fichier: "1-exercices", suffixeId: "", libelle: "Exercices" },
  indices: { fichier: "2-indices", suffixeId: "-indices", libelle: "Indices" },
  corrige: { fichier: "3-corrige", suffixeId: "-corrige", libelle: "Corrigé" },
};

/**
 * L'ordre d'émission, qui est aussi l'ordre d'affichage dans /mon-compte :
 * énoncés → indices → corrigé, la progression pédagogique attendue. Il ne
 * dépend pas de l'ordre dans lequel un chapitre déclare ses cahiers.
 */
const ORDRE_CAHIERS: Cahier[] = ["exercices", "indices", "corrige"];

/**
 * Les cahiers du calcul différentiel : énoncés et corrigé.
 *
 * ⚠️ Le nom dit « COMPLETS » et la liste n'en contient que deux : c'est
 * voulu. « Complet » qualifie le cours, pas le type `Cahier` — ce sont tous
 * les cahiers que le calcul différentiel publie.
 *
 * Le cahier d'indices a été retiré le 2026-10-05. Il ne s'est rien perdu :
 * le corrigé émet l'indice de chaque exercice juste avant sa réponse finale,
 * donc l'étudiant qui bloque le trouve au même endroit qu'avant, sans
 * ouvrir un second document. Le cahier séparé faisait doublon, au prix de
 * 73 pages de PDF et de 7 entrées à tenir à jour.
 *
 * `indices` reste une valeur valide du type : prob-stat pourra la déclarer
 * le jour où ses indices seront écrits.
 */
const CAHIERS_CALCUL: Cahier[] = ["exercices", "corrige"];

type Chapitre = {
  n: string;
  titre: string;
  fichier: string;
  /** Les cahiers publiés pour ce chapitre. Absent ou vide : aucun. */
  cahiers?: Cahier[];
};

const CHAPITRES_CALCUL: Chapitre[] = [
  { n: "1", titre: "Fonctions et domaines", fichier: "ch01-fonctions", cahiers: CAHIERS_CALCUL },
  { n: "2", titre: "Limites", fichier: "ch02-limites", cahiers: CAHIERS_CALCUL },
  { n: "3", titre: "Continuité", fichier: "ch03-continuite", cahiers: CAHIERS_CALCUL },
  { n: "4", titre: "La dérivée : définition", fichier: "ch04-derivee-definition", cahiers: CAHIERS_CALCUL },
  { n: "5", titre: "Règles de dérivation", fichier: "ch05-regles-derivation", cahiers: CAHIERS_CALCUL },
  { n: "6", titre: "Étude de fonction", fichier: "ch06-etude-fonction", cahiers: CAHIERS_CALCUL },
  { n: "7", titre: "Applications", fichier: "ch07-applications-sn", cahiers: CAHIERS_CALCUL },
];

/**
 * Probabilités et statistique. Les `fichier` sont les slugs
 * produits par le `build.sh` du projet de notes — ASCII, minuscules, sans
 * underscore. Ils doivent correspondre au nom réel du PDF dans le seau :
 * un accent ou une majuscule de travers ici, et le fichier est introuvable
 * pour quelqu'un qui y a droit.
 */
const CHAPITRES_PROBSTAT: Chapitre[] = [
  // Les chapitres 2 et 3 ont des cahiers produits à ce jour, et seulement deux
  // des trois : les indices manquent dans les deux cas (69 exercices sur 166
  // au chapitre 2, 6 sur 103 au chapitre 3), donc le cahier d'indices n'est
  // pas généré. Les chapitres 1 et 4 ne déclarent aucun cahier — les leurs ne
  // sont pas générés du tout.
  { n: "1", titre: "Statistiques descriptives", fichier: "ch01-statistiques-descriptives" },
  {
    n: "2",
    titre: "Probabilités",
    fichier: "ch02-probabilites",
    cahiers: ["exercices", "corrige"],
  },
  {
    n: "3",
    titre: "Inférence statistique",
    fichier: "ch03-inference-statistique",
    cahiers: ["exercices", "corrige"],
  },
  {
    n: "4",
    titre: "Corrélation, régression et test du khi-carré",
    fichier: "ch04-correlation-regression-khi-carre",
  },
];

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
 * Les cahiers d'exercices d'un chapitre — ceux qu'il déclare, dans l'ordre
 * canonique et pas dans l'ordre de déclaration.
 *
 * Un chapitre sans `cahiers` n'en produit aucun : c'est le cas des chapitres
 * 1 et 4 de prob-stat, dont les cahiers ne sont pas encore générés. Rien
 * n'apparaît au catalogue tant que le PDF n'est pas dans le seau.
 */
function cahiersDeChapitre(cours: Cours, c: Chapitre): Document[] {
  const num = c.fichier.slice(0, 4); // « ch01 »
  return ORDRE_CAHIERS.filter((k) => (c.cahiers ?? []).includes(k)).map((k) => {
    const { fichier, suffixeId, libelle } = CAHIERS[k];
    return doc(
      cours,
      `exercices-${num}${suffixeId}`,
      `${libelle} — chapitre ${c.n} : ${c.titre}`,
      `exercices/${num}-${fichier}.pdf`,
      "exercices",
      NIVEAUX_EXERCICES_REVISION,
    );
  });
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

  // --- Recueils d'exercices : énoncés, corrigé ------------------------------
  //
  // Deux fichiers par chapitre. Le cahier d'indices a été retiré le
  // 2026-10-05 : le corrigé porte déjà l'indice de chaque exercice, juste
  // avant sa réponse finale. L'étudiant qui bloque le trouve donc sans
  // ouvrir la solution intégrale — ce que le cahier séparé servait à
  // garantir — mais dans un document de moins.
  //
  // Les PDF gardent leurs noms `1-exercices` et `3-corrige`, sans le « 2 »
  // intermédiaire. Renuméroter aurait cassé les chemins du seau et les
  // identifiants du catalogue pour un gain nul.
  //
  // L'ID de l'énoncé garde la forme courte `exercices-chXX`, sans suffixe :
  // c'est le fichier « principal » de la paire, comme `intra1` l'est pour le
  // triplet énoncé / corrigé / grille des examens plus bas.
  ...CHAPITRES_CALCUL.flatMap((c) => cahiersDeChapitre(CALCUL_DIFFERENTIEL, c)),

  // --- Série de révision cumulative -----------------------------------------
  //
  // Seule série publiée. Les cinq méli-mélos A–E ont été retirés du catalogue
  // le 2026-09-24 : leurs PDF restent dans le seau, mais plus rien ne les
  // déclare, donc `obtenirLienTelechargement` répond `document-inconnu` même
  // à qui devinerait l'URL. Leur machinerie (banque/meli-melo.json,
  // generer-melimelo.js, verifier-melimelo.py) reste en place dans le projet
  // jumeau : les séries continuent d'être générées et vérifiées, simplement
  // plus publiées. Les remettre en ligne ne demanderait qu'un bloc comme
  // celui-ci.
  //
  // Elle diffère des méli-mélos par sa source : ceux-ci tiraient leurs
  // exercices dans les banques de chapitre, tandis que celle-ci a ses
  // cinquante exercices en propre (`banque/revision-cumulative.json`). Ils
  // n'apparaissent dans aucun cahier de chapitre, et le recueil ne montre ni
  // le type, ni le niveau, ni le chapitre d'origine : l'étudiant doit
  // reconnaître la situation lui-même.
  doc(
    CALCUL_DIFFERENTIEL,
    "revision-cumulative",
    "Série de révision cumulative — chapitres 1 à 3",
    "revision/revision-cumulative.pdf",
    "revision",
    NIVEAUX_EXERCICES_REVISION,
  ),
  doc(
    CALCUL_DIFFERENTIEL,
    "revision-cumulative-solutions",
    "Série de révision cumulative — solutions",
    "revision/revision-cumulative-solutions.pdf",
    "revision",
    NIVEAUX_EXERCICES_REVISION,
  ),

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

  // ═══ Probabilités et statistique ═══════════════════════════════════════
  //
  // Quatre chapitres, deux versions chacun : huit documents, tous en
  // catégorie « notes ».
  //
  // Trois absences, toutes voulues à ce stade :
  //
  //   - Pas de recueil complet. Le calcul différentiel en a un parce qu'il
  //     a un `main.tex` qui assemble ses chapitres ; les notes de probabilités sont
  //     quatre documents autonomes, sans document maître. Le recueil
  //     viendra quand ce main existera.
  //   - Ni révision ni examens : rien n'est encore écrit.
  //
  // Ces catégories s'ajouteront ici sans rien changer à ce qui précède : un
  // document absent du catalogue est simplement un document que personne ne
  // peut demander.
  ...CHAPITRES_PROBSTAT.flatMap((c) => notesDeChapitre(PROBABILITES_STATISTIQUE, c)),

  // --- Cahiers d'exercices : chapitre 2 seulement ---------------------------
  //
  // Deux cahiers sur trois : les énoncés et le corrigé. Le cahier d'indices
  // n'existe pas — 97 des 160 exercices du chapitre n'ont pas d'indice, et
  // le générateur le saute plutôt que de produire 160 entrées vides.
  //
  // Les chapitres 1, 3 et 4 ne déclarent aucun cahier : ils ne sont pas
  // générés. Le catalogue ne connaît que ce qui est réellement dans le seau.
  ...CHAPITRES_PROBSTAT.flatMap((c) => cahiersDeChapitre(PROBABILITES_STATISTIQUE, c)),

  // ═══ Calcul intégral ════════════════════════════════════════════════════
  //
  // Cinq chapitres, complets : les notes dans leurs deux versions et un
  // document d'exercices par chapitre. Le catalogue est un INVENTAIRE, mais
  // l'inverse n'est pas vrai : un fichier peut vivre dans le seau sans être
  // déclaré ici, et il devient alors invisible et intéléchargeable. Les
  // examens n'existent pas encore pour ce cours, donc ils n'ont pas d'entrée
  // — leur politique d'accès, elle, existe déjà (NIVEAUX_EXAMENS) : les
  // publier plus tard ne demandera aucune modification de la logique d'accès.
  //
  // Les noms de fichiers dans le seau reprennent ceux de `build/` du projet
  // notes-calcul-integral, sans renommage : la comparaison des MD5 entre le
  // seau et le disque se fait ainsi fichier pour fichier. D'où le PROF en
  // majuscules dans le chemin des notes enseignant, alors que l'identifiant
  // dit « enseignant » comme partout ailleurs dans le catalogue.
  //
  // Plus aucune mention « exercices à venir » : les cinq chapitres ont leurs
  // exercices. Chacune a été retirée dans le commit même qui publiait les
  // exercices du chapitre concerné, jamais avant — un titre qui annonce comme
  // manquant un document déjà offert est aussi trompeur que l'inverse. Les
  // chapitres 4 et 5, publiés le 2026-10-05, n'en ont jamais porté : leurs
  // notes et leurs exercices sont partis dans le même lot.
  //
  // Les chapitres 6 à 9 ne sont pas déclarés. Ils n'apparaissent donc nulle
  // part — c'est ce que « grisé » veut dire ici : non pas une entrée inerte,
  // mais l'absence d'entrée.
  //
  // Un seul document d'exercices par chapitre : le recueil complet, qui
  // contient les énoncés, les réponses finales et les solutions détaillées,
  // ouvert aux trois niveaux comme les cahiers des autres cours.
  //
  // La version « énoncés seuls » n'est déclarée pour aucun chapitre. Pour les
  // chapitres 1 à 3, les PDF restent dans le seau aux chemins
  // `exercices/chNN-enonces-seul.pdf` (déclaration retirée le 2026-09-15) :
  // ils servent à distribuer un devoir hors du site. Non déclarés, ils sont
  // invisibles dans /mon-compte et refusés au téléchargement —
  // `trouverDocument` ne les connaît pas. Pour les chapitres 4 et 5, ces PDF
  // existent dans `build/` mais n'ont jamais été téléversés : rien à retirer.
  // Les déclarer un jour demanderait une entrée ici, et un téléversement pour
  // les chapitres 4 et 5.
  doc(
    CALCUL_INTEGRAL,
    "notes-ch01-integrale-indefinie-etudiant",
    "Chapitre 1 — Intégrale indéfinie et primitives (étudiant)",
    "notes/ch01-integrale-indefinie-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch01-integrale-indefinie-enseignant",
    "Chapitre 1 — Intégrale indéfinie et primitives (enseignant)",
    "notes/ch01-integrale-indefinie-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch02-integrale-definie-etudiant",
    "Chapitre 2 — Intégrale définie et théorème fondamental (étudiant)",
    "notes/ch02-integrale-definie-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch02-integrale-definie-enseignant",
    "Chapitre 2 — Intégrale définie et théorème fondamental (enseignant)",
    "notes/ch02-integrale-definie-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch03-techniques-integration-etudiant",
    "Chapitre 3 — Techniques d'intégration (étudiant)",
    "notes/ch03-techniques-integration-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch03-techniques-integration-enseignant",
    "Chapitre 3 — Techniques d'intégration (enseignant)",
    "notes/ch03-techniques-integration-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "exercices-ch01-complet",
    "Exercices, réponses et solutions — chapitre 1 : Intégrale indéfinie et primitives",
    "exercices/ch01-complet.pdf",
    "exercices",
    NIVEAUX_EXERCICES_REVISION,
  ),
  doc(
    CALCUL_INTEGRAL,
    "exercices-ch02-complet",
    "Exercices, réponses et solutions — chapitre 2 : Intégrale définie et théorème fondamental",
    "exercices/ch02-complet.pdf",
    "exercices",
    NIVEAUX_EXERCICES_REVISION,
  ),
  doc(
    CALCUL_INTEGRAL,
    "exercices-ch03-complet",
    "Exercices, réponses et solutions — chapitre 3 : Techniques d'intégration",
    "exercices/ch03-complet.pdf",
    "exercices",
    NIVEAUX_EXERCICES_REVISION,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch04-applications-integrale-definie-etudiant",
    "Chapitre 4 — Applications de l'intégrale définie (étudiant)",
    "notes/ch04-applications-integrale-definie-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch04-applications-integrale-definie-enseignant",
    "Chapitre 4 — Applications de l'intégrale définie (enseignant)",
    "notes/ch04-applications-integrale-definie-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "exercices-ch04-complet",
    "Exercices, réponses et solutions — chapitre 4 : Applications de l'intégrale définie",
    "exercices/ch04-complet.pdf",
    "exercices",
    NIVEAUX_EXERCICES_REVISION,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch05-equations-differentielles-etudiant",
    "Chapitre 5 — Équations différentielles et modélisation (étudiant)",
    "notes/ch05-equations-differentielles-ETUDIANT.pdf",
    "notes",
    NIVEAUX_NOTES_ETUDIANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "notes-ch05-equations-differentielles-enseignant",
    "Chapitre 5 — Équations différentielles et modélisation (enseignant)",
    "notes/ch05-equations-differentielles-PROF.pdf",
    "notes",
    NIVEAUX_NOTES_ENSEIGNANT,
  ),
  doc(
    CALCUL_INTEGRAL,
    "exercices-ch05-complet",
    "Exercices, réponses et solutions — chapitre 5 : Équations différentielles et modélisation",
    "exercices/ch05-complet.pdf",
    "exercices",
    NIVEAUX_EXERCICES_REVISION,
  ),
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

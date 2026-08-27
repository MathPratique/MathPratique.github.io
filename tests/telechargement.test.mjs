import test from "node:test";
import assert from "node:assert/strict";
import { deciderTelechargement, VALIDITE_LIEN_MINUTES } from "../.tmp-test/acces/telechargement.js";
import { DOCUMENTS, trouverDocument } from "../.tmp-test/acces/documents.js";
import { creerAcces } from "../.tmp-test/acces/regles.js";

const DEBUT = new Date("2026-09-01T12:00:00Z").getTime();
// Base d'accès pour les tests — « acheteur » par défaut, ce qui autorise
// tous les documents utilisés dans les cas de base (exercices, révision).
// Les tests qui doivent isoler un autre niveau passent une surcharge.
const acces = (surcharge = {}) => ({
  ...creerAcces({
    coursId: "calcul-differentiel",
    source: "achat",
    niveau: "acheteur",
    debut: DEBUT,
  }),
  ...surcharge,
});
const doc = trouverDocument("exercices-ch04");

// ---------------------------------------------------------------------------
//  Le catalogue
// ---------------------------------------------------------------------------

test("le catalogue couvre les 73 documents", () => {
  // Calcul différentiel — 65 :
  //   16 notes (7 chapitres × 2 versions + 2 recueils complets)
  //   21 exercices (7 chapitres × 3 : énoncés + indices + corrigé)
  //   10 révision (5 séries + 5 solutions)
  //   18 examens (6 × énoncé, corrigé, grille)
  // Probabilités et statistique — 8 :
  //    8 notes (4 chapitres × 2 versions ; pas de recueil complet, pas
  //      encore d'exercices, de révision ni d'examens)
  assert.equal(DOCUMENTS.length, 73);
  const parCategorie = DOCUMENTS.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] ?? 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(parCategorie, { notes: 24, exercices: 21, revision: 10, examens: 18 });

  const parCours = DOCUMENTS.reduce((acc, d) => {
    acc[d.coursId] = (acc[d.coursId] ?? 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(parCours, {
    "calcul-differentiel": 65,
    "probabilites-statistique": 8,
  });
});

test("chaque document déclare au moins un niveau autorisé", () => {
  for (const d of DOCUMENTS) {
    assert.ok(
      Array.isArray(d.niveauxAutorises) && d.niveauxAutorises.length > 0,
      `${d.id} n'a pas de niveauxAutorises`,
    );
    for (const n of d.niveauxAutorises) {
      assert.ok(
        ["restreint", "acheteur", "enseignant"].includes(n),
        `${d.id} : niveau inconnu ${n}`,
      );
    }
  }
});

test("aucun identifiant en double", () => {
  const ids = DOCUMENTS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("aucun chemin en double, et aucun ne sort du dossier de SON cours", () => {
  const chemins = DOCUMENTS.map((d) => d.chemin);
  assert.equal(new Set(chemins).size, chemins.length);
  for (const d of DOCUMENTS) {
    // Le dossier attendu est celui du cours du document, pas un cours codé
    // en dur : un document de prob-stat rangé sous calcul-differentiel/
    // serait servi à la mauvaise cohorte.
    assert.ok(d.chemin.startsWith(`${d.coursId}/`), `${d.id} : ${d.chemin}`);
    assert.ok(!d.chemin.includes(".."), `traversée de répertoire : ${d.chemin}`);
    assert.ok(d.chemin.endsWith(".pdf"), d.chemin);
  }
});

test("tout chemin tient dans un jeu de caractères sûr pour Cloud Storage", () => {
  // Un accent dans un nom de fichier se traduit par un téléchargement qui
  // échoue pour quelqu'un qui a payé : le nom du PDF sur le disque, le
  // chemin dans le seau et l'URL signée doivent être la même chaîne, et
  // l'encodage d'un « é » ne survit pas au trajet. Les notes SN1
  // s'appelaient Chapitre_1_ÉTUDIANT.pdf avant d'entrer au catalogue.
  //
  // Les majuscules restent admises : le suffixe -ETUDIANT / -PROF, mais
  // aussi melimelo-A.pdf et finalB.pdf, qui sont au catalogue depuis le
  // début. Ce qui est proscrit, c'est le non-ASCII, l'espace et
  // l'underscore.
  for (const d of DOCUMENTS) {
    assert.ok(
      /^[A-Za-z0-9/.-]+$/.test(d.chemin),
      `${d.id} : caractère interdit dans « ${d.chemin} »`,
    );
  }
});

test("un identifiant inconnu ne renvoie rien", () => {
  assert.equal(trouverDocument("nexiste-pas"), null);
  assert.equal(trouverDocument(""), null);
});

// ---------------------------------------------------------------------------
//  L'autorisation
// ---------------------------------------------------------------------------

test("un accès actif ouvre le document", () => {
  const d = deciderTelechargement(doc, acces(), DEBUT + 1000);
  assert.equal(d.autorise, true);
  assert.equal(d.chemin, "calcul-differentiel/exercices/ch04-1-exercices.pdf");
});

test("sans accès, rien", () => {
  const d = deciderTelechargement(doc, null, DEBUT);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "aucun-acces");
});

test("un accès expiré ne télécharge plus", () => {
  const a = acces();
  const d = deciderTelechargement(doc, a, a.dateFin + 1);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "acces-expire");
});

test("la dernière seconde d'accès fonctionne encore", () => {
  const a = acces();
  assert.equal(deciderTelechargement(doc, a, a.dateFin - 1).autorise, true);
  assert.equal(deciderTelechargement(doc, a, a.dateFin).autorise, false);
});

test("un accès à un autre cours ne donne rien", () => {
  const d = deciderTelechargement(doc, acces({ coursId: "calcul-integral" }), DEBUT);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "mauvais-cours");
});

test("un document inconnu est refusé AVANT toute question d'accès", () => {
  // Sinon, la réponse révélerait quels identifiants existent.
  const d = deciderTelechargement(null, null, DEBUT);
  assert.equal(d.raison, "document-inconnu");
  const e = deciderTelechargement(null, acces(), DEBUT);
  assert.equal(e.raison, "document-inconnu");
});

test("un code de classe donne les mêmes droits qu'un achat", () => {
  const d = deciderTelechargement(doc, acces({ source: "code-classe" }), DEBUT + 1000);
  assert.equal(d.autorise, true);
});

// ---------------------------------------------------------------------------
//  Niveaux d'accès — la garde applique la liste explicite niveauxAutorises
// ---------------------------------------------------------------------------

test("un document réservé aux acheteurs est refusé à un accès restreint", () => {
  // Un examen : niveauxAutorises = ["acheteur", "enseignant"], pas de « restreint ».
  const examen = trouverDocument("intra1");
  const a = acces({ niveau: "restreint" });
  const d = deciderTelechargement(examen, a, DEBUT + 1000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "document-restreint");
});

test("un accès sans niveau tombe sur « restreint » — défaut le plus restrictif", () => {
  // niveau absent → niveauDe renvoie « restreint » → examen refusé.
  const examen = trouverDocument("intra1");
  const a = acces({ niveau: undefined });
  const d = deciderTelechargement(examen, a, DEBUT + 1000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "document-restreint");
});

test("un accès avec un niveau bidon tombe sur « restreint » aussi", () => {
  const examen = trouverDocument("intra1");
  const a = acces({ niveau: "administrateur-tout-puissant" });
  const d = deciderTelechargement(examen, a, DEBUT + 1000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "document-restreint");
});

test("une note version ÉTUDIANT est visible pour un accès restreint", () => {
  // Notes ETUDIANT : niveauxAutorises = ["restreint", "enseignant"].
  const noteEtudiant = trouverDocument("notes-complet-etudiant");
  const a = acces({ niveau: "restreint" });
  const d = deciderTelechargement(noteEtudiant, a, DEBUT + 1000);
  assert.equal(d.autorise, true);
});

test("une note version ÉTUDIANT est refusée à un acheteur (pas d'inclusion implicite)", () => {
  // Confirme que ce N'EST PAS une hiérarchie : « acheteur » n'a pas droit
  // à ce que voit « restreint » par défaut.
  const noteEtudiant = trouverDocument("notes-complet-etudiant");
  const d = deciderTelechargement(noteEtudiant, acces(), DEBUT + 1000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "document-restreint");
});

test("le refus de niveau se déclenche AVANT le refus d'expiration", () => {
  // Un examen demandé par un accès restreint expiré doit remonter la raison
  // niveau, pas la raison expiration : le niveau ne varie pas avec le temps,
  // et informer sur l'expiration d'un document qu'on n'aurait jamais eu le
  // droit de voir serait une fuite d'information.
  const examen = trouverDocument("intra1");
  const a = acces({ niveau: "restreint" });
  const d = deciderTelechargement(examen, a, a.dateFin + 86400_000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "document-restreint");
});

test("le refus de niveau se déclenche APRÈS le refus mauvais-cours", () => {
  // Symétrique : un accès à un cours étranger doit remonter mauvais-cours
  // avant de parler de niveau (le niveau est du bon cours, il ne s'applique
  // pas au document d'un autre cours).
  const examen = trouverDocument("intra1");
  const a = acces({ coursId: "calcul-integral", niveau: "restreint" });
  const d = deciderTelechargement(examen, a, DEBUT + 1000);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "mauvais-cours");
});

test("INVARIANT — aucun chemin n'est jamais rendu sans autorisation", () => {
  const cas = [
    [null, null],
    [null, acces()],
    [doc, null],
    [doc, acces({ coursId: "autre" })],
  ];
  for (const [d, a] of cas) {
    const r = deciderTelechargement(d, a, DEBUT);
    assert.equal(r.autorise, false);
    assert.ok(!("chemin" in r), "aucun chemin ne doit fuiter sur un refus");
  }
  // Et pour un accès expiré, à toute date postérieure.
  const a = acces();
  for (const t of [a.dateFin, a.dateFin + 86400_000, a.dateFin + 1e10]) {
    const r = deciderTelechargement(doc, a, t);
    assert.equal(r.autorise, false);
    assert.ok(!("chemin" in r));
  }
});

test("la validité du lien reste courte", () => {
  assert.ok(VALIDITE_LIEN_MINUTES > 0 && VALIDITE_LIEN_MINUTES <= 30);
});

// ============================================================================
//  Tests de firestore.rules — collection devoirs/{coursId}.
// ============================================================================
//
// ⚠️ CE TEST NE S'EXÉCUTE PAS PAR `npm test` : il exige l'émulateur
// Firestore. Sans FIRESTORE_EMULATOR_HOST, la suite est SKIPPÉE avec un
// message clair. Même mécanique que tests/regles-progression.test.mjs.
//
// ─── Comment lancer, exactement ───────────────────────────────────────
//
//   cd <racine du dépôt>
//   firebase emulators:exec "node --test --test-concurrency=1 tests/regles-devoirs.test.mjs tests/regles-progression.test.mjs" \
//       --only firestore --project demo-mathpratique
//
// `--test-concurrency=1` est obligatoire avec plusieurs fichiers : ils
// partagent le même émulateur, et le `clearFirestore()` de ce fichier
// effacerait l'accès que l'autre vient d'écrire (vu le 2026-11-02 : le
// test « structure imbriquée » de la progression échouait en parallèle).
//
// Le projet « demo-… » n'existe pas : l'émulateur ne peut joindre aucune
// ressource réelle. Rien ne touche à la production.
//
// ─── Ce que ces tests garantissent ────────────────────────────────────
//
//   - un étudiant du groupe (accès restreint actif) lit, mais n'écrit pas ;
//   - un compte sans accès, un accès expiré, un acheteur, un enseignant,
//     un visiteur non connecté ne lisent pas ;
//   - seul l'administrateur écrit, avec la version comme verrou ;
//   - un étudiant d'un cours ne lit pas les devoirs d'un autre.
//
// L'uid administrateur est LU dans firestore.rules : le test vérifie la
// règle telle qu'elle sera déployée, pas une copie.
// ============================================================================

import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(RACINE, "firestore.rules"), "utf-8");
const ADMIN = /request\.auth\.uid == "([^"]+)"/.exec(rules)?.[1];

const skipReason = process.env.FIRESTORE_EMULATOR_HOST
  ? undefined
  : "émulateur Firestore requis — voir en-tête du fichier pour la commande";

const CD = "calcul-differentiel";
const PS = "probabilites-statistique";
const JOUR = 24 * 60 * 60 * 1000;

/** Un contenu valide, tel que l'écrit l'éditeur. */
const contenu = (version, semaines = [{ id: "s1", titre: "Semaine 1", date: null, note: "", exercices: ["CD-C01-E026"] }]) => ({
  semaines,
  version,
  dateMaj: serverTimestamp(),
});

describe("firestore.rules — devoirs/{coursId}", { skip: skipReason }, () => {
  let env;

  // Les comptes et leurs accès. Écrits règles désactivées : `acces` est
  // en écriture interdite au navigateur.
  const COMPTES = {
    etudiant: { [CD]: { niveau: "restreint", fin: +200 } },
    sansNiveau: { [CD]: { fin: +200 } },
    expire: { [CD]: { niveau: "restreint", fin: -1 } },
    acheteur: { [CD]: { niveau: "acheteur", fin: +200 } },
    enseignant: { [CD]: { niveau: "enseignant", fin: +200 } },
    etudiantPS: { [PS]: { niveau: "restreint", fin: +200 } },
    sansAcces: {},
  };

  before(async () => {
    assert.ok(ADMIN, "uid administrateur introuvable dans firestore.rules");
    env = await initializeTestEnvironment({ projectId: "demo-mathpratique", firestore: { rules } });
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const maintenant = Date.now();
      for (const [uid, cours] of Object.entries(COMPTES)) {
        for (const [coursId, { niveau, fin }] of Object.entries(cours)) {
          await setDoc(doc(db, `utilisateurs/${uid}/acces/${coursId}`), {
            coursId,
            source: "code-classe",
            ...(niveau ? { niveau } : {}),
            dateDebut: Timestamp.fromMillis(maintenant - 30 * JOUR),
            dateFin: Timestamp.fromMillis(maintenant + fin * JOUR),
            aTelecharge: false,
          });
        }
      }
      // Un document déjà en place, version 1, pour les lectures et les mises à jour.
      await setDoc(doc(db, `devoirs/${CD}`), { ...contenu(1), dateMaj: Timestamp.now() });
    });
  });

  after(async () => {
    await env?.cleanup();
  });

  const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
  const ref = (uid, coursId = CD) => doc(db(uid), `devoirs/${coursId}`);

  // --- Lecture ---------------------------------------------------------

  test("étudiant restreint, accès valide → LIT", async () => {
    await assertSucceeds(getDoc(ref("etudiant")));
  });

  test("accès sans champ « niveau » → LIT (défaut restreint, comme niveauDe)", async () => {
    await assertSucceeds(getDoc(ref("sansNiveau")));
  });

  test("accès restreint expiré → ne lit pas", async () => {
    await assertFails(getDoc(ref("expire")));
  });

  test("acheteur → ne lit pas", async () => {
    await assertFails(getDoc(ref("acheteur")));
  });

  test("enseignant → ne lit pas", async () => {
    await assertFails(getDoc(ref("enseignant")));
  });

  test("compte sans aucun accès → ne lit pas", async () => {
    await assertFails(getDoc(ref("sansAcces")));
  });

  test("visiteur non connecté → ne lit pas", async () => {
    await assertFails(getDoc(ref(null)));
  });

  test("étudiant de prob-stat → ne lit pas les devoirs de calcul différentiel", async () => {
    await assertFails(getDoc(ref("etudiantPS")));
  });

  test("étudiant de calcul différentiel → ne lit pas les devoirs de prob-stat", async () => {
    await assertFails(getDoc(ref("etudiant", PS)));
  });

  test("administrateur, sans aucun accès au cours → LIT", async () => {
    await assertSucceeds(getDoc(ref(ADMIN)));
  });

  // --- Écriture par un étudiant ----------------------------------------

  test("étudiant restreint → ne crée, ne modifie, ne supprime pas", async () => {
    await assertFails(setDoc(ref("etudiant"), contenu(2)));
    await assertFails(updateDoc(ref("etudiant"), { version: 2, dateMaj: serverTimestamp() }));
    await assertFails(deleteDoc(ref("etudiant")));
  });

  test("acheteur, compte sans accès, visiteur → n'écrivent pas", async () => {
    for (const uid of ["acheteur", "sansAcces", null]) {
      await assertFails(setDoc(ref(uid), contenu(2)));
    }
  });

  // --- Écriture par l'administrateur -------------------------------------

  test("administrateur : mise à jour avec version + 1 → ÉCRIT", async () => {
    await assertSucceeds(setDoc(ref(ADMIN), contenu(2)));
  });

  test("administrateur : création d'un document absent avec version 1 → ÉCRIT", async () => {
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), `devoirs/${CD}`)));
    await assertSucceeds(setDoc(ref(ADMIN), contenu(1)));
  });

  test("administrateur : création avec une autre version que 1 → refus", async () => {
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), `devoirs/${CD}`)));
    await assertFails(setDoc(ref(ADMIN), contenu(5)));
  });

  test("administrateur : version périmée (deux onglets) → refus", async () => {
    await assertSucceeds(setDoc(ref(ADMIN), contenu(2)));
    // Le second onglet part encore de la version 1 et propose 2.
    await assertFails(setDoc(ref(ADMIN), contenu(2)));
    await assertFails(setDoc(ref(ADMIN), contenu(1)));
  });

  test("administrateur : clé inconnue → refus", async () => {
    await assertFails(setDoc(ref(ADMIN), { ...contenu(2), auteur: "x" }));
  });

  test("administrateur : semaines qui ne sont pas une liste → refus", async () => {
    await assertFails(setDoc(ref(ADMIN), { ...contenu(2), semaines: { s1: [] } }));
  });

  test("administrateur : plus de 60 semaines → refus ; 60 → ÉCRIT", async () => {
    const semaine = (i) => ({ id: `s${i}`, titre: `S${i}`, date: null, note: "", exercices: [] });
    await assertFails(setDoc(ref(ADMIN), contenu(2, Array.from({ length: 61 }, (_, i) => semaine(i)))));
    await assertSucceeds(setDoc(ref(ADMIN), contenu(2, Array.from({ length: 60 }, (_, i) => semaine(i)))));
  });

  test("administrateur : dateMaj fournie par le navigateur → refus (horloge du serveur exigée)", async () => {
    await assertFails(setDoc(ref(ADMIN), { ...contenu(2), dateMaj: Timestamp.fromMillis(Date.now() - JOUR) }));
  });

  test("administrateur : cours non prévu (prob-stat) → refus", async () => {
    await assertFails(setDoc(ref(ADMIN, PS), contenu(1)));
  });

  test("administrateur : suppression → refus", async () => {
    await assertFails(deleteDoc(ref(ADMIN)));
  });
});

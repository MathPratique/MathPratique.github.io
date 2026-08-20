// ============================================================================
//  Tests de régression pour firestore.rules — collection progression.
// ============================================================================
//
// ⚠️ CE TEST NE S'EXÉCUTE PAS PAR `npm test`.
//
// Il exige l'émulateur Firestore actif, ce qui ne fait pas partie du
// `npm test` habituel (qui tourne les tests purs Node sans dépendance
// externe). Si la variable d'environnement FIRESTORE_EMULATOR_HOST n'est
// pas posée, le suite entier est SKIPPÉ avec un message clair — les tests
// n'échouent pas silencieusement.
//
// ─── Comment lancer, exactement ───────────────────────────────────────
//
//   cd <racine du dépôt>
//   firebase emulators:exec "node --test tests/regles-progression.test.mjs" \
//       --only firestore --project demo-mathpratique
//
// `firebase emulators:exec` démarre l'émulateur Firestore (Java), pose
// FIRESTORE_EMULATOR_HOST, exécute la commande, puis arrête l'émulateur
// proprement. Rien ne reste derrière.
//
// ─── Prérequis ────────────────────────────────────────────────────────
//
//   - firebase-tools installé (npm i -g firebase-tools OU global npm)
//   - Java (l'émulateur Firestore tourne dessus)
//   - @firebase/rules-unit-testing (devDependency de ce dépôt)
//
// ─── Pourquoi ce fichier existe ───────────────────────────────────────
//
// La règle firestore.rules pour utilisateurs/{uid}/progression/{coursId}
// exige que le document n'ait que ['completes', 'marques', 'dateMaj',
// 'version'] comme clés top-level (règle formeValide()). Le SDK client
// Firebase v12 traite `setDoc(ref, { "completes.EXO-1": ... },
// { merge: true })` comme la création d'un champ top-level LITTÉRALEMENT
// nommé « completes.EXO-1 » (le point n'est PAS interprété comme chemin
// nested pour setDoc merge:true, seulement pour updateDoc et
// mergeFields). Les règles refusent alors le write parce que la clé
// n'est pas dans la liste blanche.
//
// Ce piège a masqué un bogue de progression pendant deux jours en
// production. Ce fichier de tests le fige à jamais : toute régression
// qui rétablirait la dot-notation aplatie (ou toute règle plus stricte
// qui casserait la structure imbriquée actuelle) fait échouer un test.
//
// Le troisième test verrouille le CHEMIN DE DÉCOCHAGE — deleteField()
// dans la structure imbriquée. C'est le retrait d'un exercice de la
// liste, aussi important que l'ajout et sujet aux mêmes pièges de
// représentation.
// ============================================================================

import { describe, test, before, after } from "node:test";
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
  setDoc,
  serverTimestamp,
  deleteField,
  Timestamp,
} from "firebase/firestore";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(RACINE, "firestore.rules"), "utf-8");

// Détection : sans FIRESTORE_EMULATOR_HOST, on ne peut pas se connecter
// à un émulateur. `firebase emulators:exec` pose cette variable ; un
// simple `npm test` ne la pose pas. Dans ce dernier cas on skip avec un
// message clair plutôt que de crasher toute la suite.
const skipReason = process.env.FIRESTORE_EMULATOR_HOST
  ? undefined
  : "émulateur Firestore requis — voir en-tête du fichier pour la commande";

describe("firestore.rules — progression/{coursId}", { skip: skipReason }, () => {
  let env;
  const UID = "utilisateur-test-uid";
  const COURS = "calcul-differentiel";

  before(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-mathpratique",
      firestore: { rules },
    });
    // Seed : la règle accesValide() lit utilisateurs/{uid}/acces/{coursId}
    // et exige dateFin > request.time. Sans ce doc préalable, toute
    // écriture à progression est refusée quelle que soit la forme du
    // payload — les tests ne discrimineraient plus la clé aplatie vs
    // la structure imbriquée. On seed via withSecurityRulesDisabled
    // pour bypasser les règles (accès rejette write:if false).
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const debut = Date.now();
      await setDoc(doc(db, `utilisateurs/${UID}/acces/${COURS}`), {
        coursId: COURS,
        source: "test",
        niveau: "acheteur",
        dateDebut: Timestamp.fromMillis(debut),
        dateFin: Timestamp.fromMillis(debut + 24 * 60 * 60 * 1000),
        aTelecharge: false,
      });
    });
  });

  after(async () => {
    await env?.cleanup();
  });

  test("dot-notation aplatie 'completes.EXO' → REFUS par formeValide()", async () => {
    const db = env.authenticatedContext(UID).firestore();
    const ref = doc(db, `utilisateurs/${UID}/progression/${COURS}`);
    // C'était le format historique qui déclenchait le bogue silencieux.
    // Fige la règle : toute modification qui l'accepterait à nouveau
    // fait échouer ce test.
    await assertFails(
      setDoc(
        ref,
        {
          "completes.CD-C01-E001": serverTimestamp(),
          version: 1,
          dateMaj: serverTimestamp(),
        },
        { merge: true },
      ),
    );
  });

  test("structure imbriquée { completes: { 'EXO': ts } } → AUTORISATION", async () => {
    const db = env.authenticatedContext(UID).firestore();
    const ref = doc(db, `utilisateurs/${UID}/progression/${COURS}`);
    // Le format produit par store.ts après le fix — doit passer.
    await assertSucceeds(
      setDoc(
        ref,
        {
          completes: { "CD-C01-E001": serverTimestamp() },
          version: 1,
          dateMaj: serverTimestamp(),
        },
        { merge: true },
      ),
    );
  });

  test("deleteField() dans structure imbriquée (chemin de décochage) → AUTORISATION", async () => {
    const db = env.authenticatedContext(UID).firestore();
    const ref = doc(db, `utilisateurs/${UID}/progression/${COURS}`);
    // Le format produit par store.ts quand un exercice est DÉCOCHÉ.
    // Doit passer aussi, avec les mêmes clés top-level autorisées.
    // Sans ce test, on protégerait l'ajout mais pas le retrait.
    await assertSucceeds(
      setDoc(
        ref,
        {
          completes: { "CD-C01-E001": deleteField() },
          version: 1,
          dateMaj: serverTimestamp(),
        },
        { merge: true },
      ),
    );
  });
});

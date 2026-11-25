// ============================================================================
//  Tests de firestore.rules — classements/{jeu}/entrees/{uid}.
// ============================================================================
//
// ⚠️ CE TEST NE S'EXÉCUTE PAS PAR `npm test` : il exige l'émulateur
// Firestore. Sans FIRESTORE_EMULATOR_HOST, la suite est SKIPPÉE avec un
// message clair. Même mécanique que tests/regles-devoirs.test.mjs.
//
// ─── Comment lancer, exactement ───────────────────────────────────────
//
//   cd <racine du dépôt>
//   firebase emulators:exec "node --test --test-concurrency=1 tests/regles-classement.test.mjs tests/regles-devoirs.test.mjs tests/regles-progression.test.mjs" \
//       --only firestore --project demo-mathpratique
//
// `--test-concurrency=1` : les fichiers partagent le même émulateur, et le
// `clearFirestore()` de l'un effacerait ce que l'autre vient d'écrire.
//
// Le projet « demo-… » n'existe pas : rien ne touche à la production.
//
// ─── Ce que ces tests garantissent ────────────────────────────────────
//
//   - tout le monde lit le classement d'un jeu connu, même sans compte ;
//   - un joueur connecté crée et améliore SA PROPRE entrée, rien d'autre ;
//   - refusés : sans compte, l'entrée d'un autre, un temps sous 3 minutes ou
//     au-delà de 10 heures, un pseudonyme vide ou de plus de 20 caractères,
//     un champ en trop, une date inventée, un temps moins bon, une
//     suppression, un jeu inconnu.
// ============================================================================

import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp,
} from "firebase/firestore";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(RACINE, "firestore.rules"), "utf-8");

const skipReason = process.env.FIRESTORE_EMULATOR_HOST
  ? undefined
  : "émulateur Firestore requis — voir en-tête du fichier pour la commande";

const JEU = "jardin-des-derivees";
const entree = (pseudo, temps) => ({ pseudo, temps, date: serverTimestamp() });

describe("firestore.rules — classements/{jeu}/entrees/{uid}", { skip: skipReason }, () => {
  let env;
  const DATE_EN_PLACE = Timestamp.fromMillis(Date.UTC(2026, 10, 1));

  before(async () => {
    env = await initializeTestEnvironment({ projectId: "demo-mathpratique", firestore: { rules } });
  });

  beforeEach(async () => {
    await env.clearFirestore();
    // Une entrée déjà en place pour « ancien » : 6 min 40 s
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `classements/${JEU}/entrees/ancien`), { pseudo: "Renard", temps: 400, date: DATE_EN_PLACE });
    });
  });

  after(async () => {
    await env?.cleanup();
  });

  const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
  const ref = (uid, cible = uid, jeu = JEU) => doc(db(uid), `classements/${jeu}/entrees/${cible}`);

  // --- Lecture ---------------------------------------------------------

  test("visiteur sans compte → LIT le top 10", async () => {
    await assertSucceeds(getDocs(query(collection(db(null), `classements/${JEU}/entrees`), orderBy("temps"), limit(10))));
  });

  test("visiteur sans compte → lit une entrée", async () => {
    await assertSucceeds(getDoc(ref(null, "ancien")));
  });

  test("jeu inconnu → ne lit pas", async () => {
    await assertFails(getDoc(ref(null, "ancien", "autre-jeu")));
  });

  // --- Création -----------------------------------------------------------

  test("joueur connecté → CRÉE sa propre entrée", async () => {
    await assertSucceeds(setDoc(ref("nouveau"), entree("Loup des bois", 523.4)));
  });

  test("sans compte → ne crée pas", async () => {
    await assertFails(setDoc(ref(null, "nouveau"), entree("Anonyme", 523.4)));
  });

  test("l'entrée d'un autre → refusée", async () => {
    await assertFails(setDoc(ref("nouveau", "quelquun"), entree("Imposteur", 523.4)));
  });

  test("temps sous 3 minutes → refusé (179,9 s)", async () => {
    await assertFails(setDoc(ref("nouveau"), entree("Éclair", 179.9)));
  });

  test("temps de 3 minutes pile → accepté", async () => {
    await assertSucceeds(setDoc(ref("nouveau"), entree("Éclair", 180)));
  });

  test("temps au-delà de 10 heures → refusé", async () => {
    await assertFails(setDoc(ref("nouveau"), entree("Escargot", 36000.1)));
  });

  test("temps qui n'est pas un nombre → refusé", async () => {
    await assertFails(setDoc(ref("nouveau"), entree("Texte", "523")));
  });

  test("pseudonyme de 21 caractères → refusé ; de 20 → accepté", async () => {
    await assertFails(setDoc(ref("nouveau"), entree("a".repeat(21), 523.4)));
    await assertSucceeds(setDoc(ref("nouveau"), entree("a".repeat(20), 523.4)));
  });

  test("pseudonyme vide ou fait d'espaces → refusé", async () => {
    await assertFails(setDoc(ref("nouveau"), entree("", 523.4)));
    await assertFails(setDoc(ref("nouveau"), entree("   ", 523.4)));
  });

  test("champ en trop → refusé", async () => {
    await assertFails(setDoc(ref("nouveau"), { ...entree("Loup", 523.4), admin: true }));
  });

  test("date inventée (pas l'heure du serveur) → refusée", async () => {
    await assertFails(setDoc(ref("nouveau"), { pseudo: "Loup", temps: 523.4, date: Timestamp.fromMillis(Date.UTC(2020, 0, 1)) }));
  });

  test("champ manquant → refusé", async () => {
    await assertFails(setDoc(ref("nouveau"), { pseudo: "Loup", temps: 523.4 }));
  });

  test("jeu inconnu → ne crée pas", async () => {
    await assertFails(setDoc(ref("nouveau", "nouveau", "autre-jeu"), entree("Loup", 523.4)));
  });

  // --- Mise à jour --------------------------------------------------------

  test("meilleur temps → la mise à jour passe", async () => {
    await assertSucceeds(setDoc(ref("ancien"), entree("Renard", 350)));
  });

  test("temps moins bon → refusé", async () => {
    await assertFails(setDoc(ref("ancien"), entree("Renard", 450)));
  });

  test("même temps, même date, nouveau pseudonyme → accepté", async () => {
    await assertSucceeds(setDoc(ref("ancien"), { pseudo: "Renard roux", temps: 400, date: DATE_EN_PLACE }));
  });

  test("même temps avec une nouvelle date → refusé (la date suit le temps)", async () => {
    await assertFails(setDoc(ref("ancien"), entree("Renard roux", 400)));
  });

  test("meilleur temps avec l'ancienne date → refusé", async () => {
    await assertFails(setDoc(ref("ancien"), { pseudo: "Renard", temps: 350, date: DATE_EN_PLACE }));
  });

  test("meilleur temps mais sous 3 minutes → refusé", async () => {
    await assertFails(setDoc(ref("ancien"), entree("Renard", 120)));
  });

  test("améliorer l'entrée d'un autre → refusé", async () => {
    await assertFails(setDoc(ref("nouveau", "ancien"), entree("Renard", 300)));
  });

  // --- Suppression --------------------------------------------------------

  test("supprimer sa propre entrée → refusé", async () => {
    await assertFails(deleteDoc(ref("ancien")));
  });

  test("supprimer l'entrée d'un autre → refusé", async () => {
    await assertFails(deleteDoc(ref("nouveau", "ancien")));
  });

  test("les autres collections restent fermées (devoirs sans compte)", async () => {
    await assertFails(getDoc(doc(db(null), "devoirs/calcul-differentiel")));
    assert.ok(rules.includes("match /classements/{jeu}/entrees/{uid}"));
  });
});

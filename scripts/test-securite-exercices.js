#!/usr/bin/env node
/**
 * Test de sécurité de la Cloud Function `obtenirExercices`.
 *
 * Simule quatre configurations d'appel et vérifie que la Function répond
 * exactement comme spécifié :
 *
 *   1. sans authentification         → erreur `unauthenticated`
 *   2. auth mais sans accès          → erreur `permission-denied`
 *   3. auth + accès EXPIRÉ           → erreur `permission-denied`
 *   4. auth + accès valide           → succès avec 305 exos
 *
 * Objectif : garantir qu'aucune de ces 4 combinaisons ne peut être
 * confondue avec une autre, et surtout qu'aucune ne peut renvoyer les 240
 * payants sans passer par la règle serveur `verifierAcces()`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PRÉREQUIS
 *
 *   1. Émulateurs Firebase démarrés (Auth 9099, Firestore 8080, Functions 5001) :
 *        cd functions && npm run serve
 *      ou
 *        firebase emulators:start --only auth,firestore,functions
 *
 *   2. Configuration Firebase client dans .env.local
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage :
 *   node scripts/test-securite-exercices.js
 *
 * Le script sort avec 0 si les 4 tests passent, 1 sinon.
 */

import { initializeApp as adminInit } from "firebase-admin/app";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { getFirestore as adminFirestore, Timestamp } from "firebase-admin/firestore";

import { initializeApp as clientInit } from "firebase/app";
import {
  getAuth as clientGetAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";

// ─── Ce à quoi on s'attend ─────────────────────────────────────────────────
const ATTENDU = [
  { nom: "1. Sans auth",              codeErreur: "functions/unauthenticated" },
  { nom: "2. Auth sans accès",        codeErreur: "functions/permission-denied" },
  { nom: "3. Accès EXPIRÉ",           codeErreur: "functions/permission-denied" },
  { nom: "4. Accès valide",           codeErreur: null, exosAttendus: 305 },
];

// ─── Fixation des émulateurs ───────────────────────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const PROJET = "mathpratique-8dea1";

// Admin — bypass des règles pour installer les comptes de test.
adminInit({ projectId: PROJET });
const authAdmin = adminAuth();
const dbAdmin = adminFirestore();

// Client — SDK habituel du navigateur, branché sur les émulateurs.
// Pas besoin des vrais apiKey/appId : les émulateurs acceptent tout.
const clientApp = clientInit({
  apiKey: "emulator",
  authDomain: `${PROJET}.firebaseapp.com`,
  projectId: PROJET,
  appId: "1:0:web:0",
});
const authClient = clientGetAuth(clientApp);
connectAuthEmulator(authClient, "http://127.0.0.1:9099", { disableWarnings: true });
const fns = getFunctions(clientApp, "northamerica-northeast1");
connectFunctionsEmulator(fns, "127.0.0.1", 5001);
const obtenirExercices = httpsCallable(fns, "obtenirExercices");

// ─── Utilitaires ───────────────────────────────────────────────────────────
const MOT_DE_PASSE = "test-securite-12345";
const JOUR_MS = 24 * 60 * 60 * 1000;

async function creerCompte(email) {
  try {
    await authAdmin.deleteUser((await authAdmin.getUserByEmail(email)).uid);
  } catch {
    /* n'existait pas */
  }
  const user = await authAdmin.createUser({ email, password: MOT_DE_PASSE });
  return user.uid;
}

async function poserAccesValide(uid) {
  const debut = Date.now();
  const fin = debut + 90 * JOUR_MS;
  await dbAdmin.doc(`utilisateurs/${uid}/acces/calcul-differentiel`).set({
    coursId: "calcul-differentiel",
    source: "test",
    dateDebut: Timestamp.fromMillis(debut),
    dateFin: Timestamp.fromMillis(fin),
    aTelecharge: false,
    reference: `test-securite-${Date.now()}`,
  });
}

async function poserAccesExpire(uid) {
  const fin = Date.now() - JOUR_MS;
  const debut = fin - 30 * JOUR_MS;
  await dbAdmin.doc(`utilisateurs/${uid}/acces/calcul-differentiel`).set({
    coursId: "calcul-differentiel",
    source: "test",
    dateDebut: Timestamp.fromMillis(debut),
    dateFin: Timestamp.fromMillis(fin),
    aTelecharge: false,
    reference: `test-securite-expire-${Date.now()}`,
  });
}

async function appeler(coursId = "calcul-differentiel") {
  try {
    const res = await obtenirExercices({ coursId });
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, code: err?.code ?? "inconnu", message: err?.message };
  }
}

/**
 * Interrompt le test si le code renvoyé signale un problème d'INFRASTRUCTURE
 * plutôt qu'un refus légitime. Les codes attendus sont uniquement
 * `unauthenticated`, `permission-denied` ou un succès. Tout autre code
 * (`not-found` = Function absente, `internal` = crash serveur, réseau…)
 * signifie que le test lui-même n'est pas concluant : ni pass, ni fail
 * du contrat de sécurité — c'est le test qui est cassé.
 */
function stopSiInfraCassee(nom, resultat) {
  if (resultat.ok) return;
  const code = resultat.code;
  const codesLegitimes = new Set([
    "functions/unauthenticated",
    "functions/permission-denied",
  ]);
  if (codesLegitimes.has(code)) return;
  console.error(
    `\n✗ ${nom} — code ${code} : ${resultat.message ?? ""}\n\n` +
      `Ce code ne correspond ni à un refus légitime (unauthenticated /\n` +
      `permission-denied) ni à un succès. Le test n'est pas concluant :\n` +
      `  - functions/not-found  → la Function obtenirExercices n'est pas déployée\n` +
      `                            ou mal nommée. Vérifier que l'émulateur\n` +
      `                            Functions tourne et que le build fonctions est frais.\n` +
      `  - functions/internal   → crash côté serveur. Consulter les logs de la Function.\n` +
      `  - autres               → réseau, configuration, ou bug d'appel.\n\n` +
      `Le contrat de sécurité N'A PAS été vérifié.\n`,
  );
  process.exit(2);
}

function verifier(nom, resultat, attendu) {
  if (attendu.codeErreur) {
    if (resultat.ok) return { nom, passe: false, dit: `succès inattendu` };
    if (resultat.code !== attendu.codeErreur) {
      return { nom, passe: false, dit: `code ${resultat.code}, attendu ${attendu.codeErreur}` };
    }
    return { nom, passe: true };
  }
  if (!resultat.ok) {
    return { nom, passe: false, dit: `erreur ${resultat.code} : ${resultat.message}` };
  }
  const n = resultat.data?.exercices?.length ?? 0;
  if (n !== attendu.exosAttendus) {
    return { nom, passe: false, dit: `${n} exos reçus, attendu ${attendu.exosAttendus}` };
  }
  return { nom, passe: true };
}

// ─── Scénario ──────────────────────────────────────────────────────────────
async function main() {
  console.log("Test de sécurité — obtenirExercices\n");

  const resultats = [];

  // ── 1. Sans auth ────────────────────────────────────────────────────────
  console.log("  1/4  Appel sans authentification…");
  await signOut(authClient).catch(() => {});
  {
    const r = await appeler();
    stopSiInfraCassee(ATTENDU[0].nom, r);
    resultats.push(verifier(ATTENDU[0].nom, r, ATTENDU[0]));
  }

  // ── 2. Auth sans accès ──────────────────────────────────────────────────
  console.log("  2/4  Compte sans doc d'accès…");
  await creerCompte("sans-acces@test.mathpratique.ca");
  await signInWithEmailAndPassword(authClient, "sans-acces@test.mathpratique.ca", MOT_DE_PASSE);
  {
    const r = await appeler();
    stopSiInfraCassee(ATTENDU[1].nom, r);
    resultats.push(verifier(ATTENDU[1].nom, r, ATTENDU[1]));
  }
  await signOut(authClient);

  // ── 3. Auth avec accès expiré ───────────────────────────────────────────
  console.log("  3/4  Compte avec accès expiré la veille…");
  const uidExpire = await creerCompte("expire@test.mathpratique.ca");
  await poserAccesExpire(uidExpire);
  await signInWithEmailAndPassword(authClient, "expire@test.mathpratique.ca", MOT_DE_PASSE);
  {
    const r = await appeler();
    stopSiInfraCassee(ATTENDU[2].nom, r);
    resultats.push(verifier(ATTENDU[2].nom, r, ATTENDU[2]));
  }
  await signOut(authClient);

  // ── 4. Auth avec accès valide ───────────────────────────────────────────
  console.log("  4/4  Compte avec accès valide 90 jours…");
  const uidValide = await creerCompte("valide@test.mathpratique.ca");
  await poserAccesValide(uidValide);
  await signInWithEmailAndPassword(authClient, "valide@test.mathpratique.ca", MOT_DE_PASSE);
  {
    const r = await appeler();
    // Cas 4 : ok = succès légitime, ne pas stopper. Erreur = comme ci-dessus.
    if (!r.ok) stopSiInfraCassee(ATTENDU[3].nom, r);
    resultats.push(verifier(ATTENDU[3].nom, r, ATTENDU[3]));
  }
  await signOut(authClient);

  // ── Rapport ─────────────────────────────────────────────────────────────
  console.log("\nRésultats :\n");
  let echecs = 0;
  for (const r of resultats) {
    if (r.passe) {
      console.log(`  ✓ ${r.nom}`);
    } else {
      console.log(`  ✗ ${r.nom} — ${r.dit}`);
      echecs++;
    }
  }
  console.log();
  if (echecs === 0) {
    console.log("Tous les tests passent. La Function refuse correctement les 3 cas invalides.");
    process.exit(0);
  } else {
    console.error(`${echecs} test(s) en échec. La Function ne respecte pas le contrat de sécurité.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erreur inattendue :", err?.message ?? err);
  process.exit(2);
});

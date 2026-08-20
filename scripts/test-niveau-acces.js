#!/usr/bin/env node
// ============================================================================
//  Test de non-régression — la garde par niveau vient bien du SERVEUR.
// ============================================================================
//
// Cacher un document à l'affichage ne protège rien : un étudiant peut ouvrir
// la console de son navigateur et appeler obtenirLienTelechargement avec
// n'importe quel identifiant. Ce script reproduit exactement ce geste,
// automatisé : il se connecte comme un utilisateur réel (SDK CLIENT, pas
// Admin), demande l'URL d'un document, et affiche le verdict du serveur.
//
// À utiliser après un changement au catalogue, à niveauDe, à
// deciderTelechargement, ou après un redéploiement des Cloud Functions.
//
//   Attendu : un compte « restreint » qui demande « intra1 » se fait
//   refuser avec `functions/permission-denied` et le message
//   « Ce document n'est pas accessible à ton niveau d'accès. » — c'est le
//   MESSAGES_REFUS["document-restreint"] côté serveur qui remonte.
//
//   Attendu : un compte « acheteur » qui demande « intra1 » reçoit une
//   URL signée valide 15 min. Le même compte qui demande
//   « notes-complet-etudiant » (réservé à restreint + enseignant) doit
//   être refusé — c'est le test d'anti-hiérarchie.
//
// ⚠️ CIBLE : PRODUCTION. Aucun connectFunctionsEmulator ici — le point,
// c'est de tester ce que voit le monde réel, pas l'émulateur.
//
// Prérequis :
//   - .env.local à la racine avec les 6 VITE_FIREBASE_* remplis
//     (mêmes clés qu'utilise le site en production)
//   - Un compte réel dans Firebase Auth du projet (créé via /connexion)
//   - Le niveau du compte posé par scripts/acces-test.js (ou par le
//     webhook Stripe pour un vrai achat)
//
// Usage :
//   node scripts/test-niveau-acces.js --courriel <adresse> --document <id>
//
// Exemples :
//   node scripts/test-niveau-acces.js --courriel test@ex.com --document intra1
//   node scripts/test-niveau-acces.js --courriel test@ex.com --document exercices-ch04
//   node scripts/test-niveau-acces.js --courriel test@ex.com --document notes-complet-etudiant
//
// Le mot de passe est demandé de façon INTERACTIVE au démarrage, avec
// écho supprimé. Jamais en argument (traînerait dans l'historique shell),
// jamais dans un fichier (fuiterait à l'audit).
//
// Codes de sortie :
//   0  — URL signée obtenue (accès accordé)
//   1  — refus serveur OU erreur technique (voir stdout pour le code)
//   2  — arguments manquants ou invalides
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_ENV = resolve(RACINE, ".env.local");
// Doit correspondre à la région déclarée dans src/firebase/config.ts et
// dans les onCall() de functions/src/index.ts. Sans ça, httpsCallable
// pointerait par défaut sur us-central1 et ne trouverait pas la fonction.
const REGION_FONCTIONS = "northamerica-northeast1";

// ---------- Analyse des arguments ------------------------------------------

function argOpt(nom) {
  const idx = process.argv.indexOf(`--${nom}`);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const courriel = argOpt("courriel");
const documentId = argOpt("document");

if (!courriel || !documentId) {
  console.error(`
Usage :
  node scripts/test-niveau-acces.js --courriel <adresse> --document <identifiantDocument>

Le mot de passe est demandé de façon interactive à l'exécution.

Exemples :
  node scripts/test-niveau-acces.js --courriel test@ex.com --document intra1
  node scripts/test-niveau-acces.js --courriel test@ex.com --document exercices-ch04
`);
  process.exit(2);
}

// ---------- Lecture .env.local ---------------------------------------------
//
// Node ne charge pas .env automatiquement. Parseur minimaliste : lignes
// KEY=VALUE, commentaires # ignorés, guillemets encadrants dépouillés.

if (!existsSync(CHEMIN_ENV)) {
  console.error(`\n❌ Fichier introuvable : ${CHEMIN_ENV}\n`);
  console.error(`Ce script a besoin des 6 VITE_FIREBASE_* pour joindre la production.`);
  console.error(`Copie .env.example vers .env.local et remplis-le si absent.\n`);
  process.exit(1);
}

function lireEnvLocal(chemin) {
  const env = {};
  const brut = readFileSync(chemin, "utf-8");
  for (const l of brut.split(/\r?\n/)) {
    const ligne = l.trim();
    if (!ligne || ligne.startsWith("#")) continue;
    const idxEgal = ligne.indexOf("=");
    if (idxEgal < 0) continue;
    const cle = ligne.substring(0, idxEgal).trim();
    let valeur = ligne.substring(idxEgal + 1).trim();
    if (
      (valeur.startsWith('"') && valeur.endsWith('"')) ||
      (valeur.startsWith("'") && valeur.endsWith("'"))
    ) {
      valeur = valeur.slice(1, -1);
    }
    env[cle] = valeur;
  }
  return env;
}

const env = lireEnvLocal(CHEMIN_ENV);
const CLES_REQUISES = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];
const manquantes = CLES_REQUISES.filter((c) => !env[c]);
if (manquantes.length > 0) {
  console.error(`\n❌ Variables manquantes dans .env.local :`);
  for (const m of manquantes) console.error(`   - ${m}`);
  console.error("");
  process.exit(1);
}

// ---------- Saisie interactive du mot de passe (écho supprimé) --------------
//
// Node n'a pas de prompt de mot de passe natif. On utilise readline en
// substituant `_writeToOutput` par un no-op pendant la question : sur un
// TTY, readline gère l'écho lui-même (le terminal ne le fait pas en mode
// raw), et neutraliser cet écho suffit à cacher la frappe. C'est la
// méthode standard, sans dépendance ajoutée.

async function demanderMotDePasse(prompt) {
  process.stdout.write(prompt);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl._writeToOutput = () => {};
  try {
    const mdp = await rl.question("");
    process.stdout.write("\n");
    return mdp;
  } finally {
    rl.close();
  }
}

const motDePasse = await demanderMotDePasse(`Mot de passe pour ${courriel} : `);
if (!motDePasse) {
  console.error("\n❌ Mot de passe vide, opération annulée.\n");
  process.exit(1);
}

// ---------- Initialisation SDK client + connexion --------------------------
//
// SDK CLIENT (firebase) et non Admin (firebase-admin) : on veut se faire
// passer pour un utilisateur ordinaire, sans privilège serveur. Ce que
// voit ce script est exactement ce que verrait un étudiant qui appelle
// obtenirLienTelechargement depuis la console de son navigateur.

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const functions = getFunctions(app, REGION_FONCTIONS);

console.log(``);
console.log(`Cible    : ${env.VITE_FIREBASE_PROJECT_ID} (PRODUCTION)`);
console.log(`Région   : ${REGION_FONCTIONS}`);
console.log(`Compte   : ${courriel}`);
console.log(`Document : ${documentId}`);
console.log(``);
console.log(`Connexion en cours…`);

try {
  await signInWithEmailAndPassword(auth, courriel, motDePasse);
} catch (err) {
  const code = err?.code ?? String(err);
  const message = err?.message ?? "";
  console.error(`\n❌ Connexion échouée.`);
  console.error(`   code    : ${code}`);
  if (message) console.error(`   message : ${message}`);
  await deleteApp(app).catch(() => {});
  process.exit(1);
}

console.log(`Connexion OK — uid = ${auth.currentUser?.uid}`);
console.log(``);

// ---------- Appel obtenirLienTelechargement --------------------------------

console.log(`Appel obtenirLienTelechargement({ documentId: "${documentId}" })…`);
console.log(``);

let exitCode = 0;
try {
  const appeler = httpsCallable(functions, "obtenirLienTelechargement");
  const reponse = await appeler({ documentId });
  const { url, titre } = reponse.data ?? {};
  console.log(`✅ ACCÈS ACCORDÉ`);
  console.log(`   titre : ${titre ?? "(pas de titre retourné)"}`);
  const urlAffichee = typeof url === "string" ? url : "";
  console.log(
    `   url   : ${urlAffichee.substring(0, 100)}${urlAffichee.length > 100 ? "…" : ""}`,
  );
  console.log(``);
  console.log(`(La Function a signé une URL — le niveau de ce compte autorise`);
  console.log(`ce document, ou l'accès est actif et non restreint. La garde`);
  console.log(`serveur a laissé passer.)`);
  console.log(``);
} catch (err) {
  const code = err?.code ?? String(err);
  const message = err?.message ?? "";
  const details = err?.details;
  console.log(`⛔ ACCÈS REFUSÉ`);
  console.log(`   code    : ${code}`);
  if (message) console.log(`   message : ${message}`);
  if (details !== undefined) console.log(`   details : ${JSON.stringify(details)}`);
  console.log(``);
  console.log(`(La Function a refusé. Codes attendus selon le cas :`);
  console.log(`  functions/permission-denied  — niveau insuffisant, accès expiré,`);
  console.log(`                                 ou mauvais cours`);
  console.log(`  functions/not-found          — identifiant de document inconnu`);
  console.log(`  functions/unauthenticated    — token non transmis (bug SDK))`);
  console.log(``);
  exitCode = 1;
}

// ---------- Nettoyage ------------------------------------------------------

await signOut(auth).catch(() => {});
await deleteApp(app).catch(() => {});
process.exit(exitCode);

#!/usr/bin/env node
// ============================================================================
//  Outil d'administration LOCAL — liste les comptes Firebase Auth dont
//  l'adresse courriel n'est PAS vérifiée.
// ============================================================================
//
// Sert à relancer les seuls étudiants qui n'ont pas cliqué le lien de
// vérification envoyé à l'inscription. Si le courriel est mal tapé, aucun
// mail n'arrive et l'adresse restera « non vérifiée » — c'est le signal
// qu'il faut contacter l'étudiant par un autre canal pour corriger.
//
// ⚠️ USAGE LOCAL UNIQUEMENT. Signe avec la clé de service Firebase Admin —
// la plus puissante du projet. Ne pas déployer, ne pas embarquer.
//
// Prérequis :
//   1. Clé de service à la racine sous `serviceAccountKey.json`
//      (déjà dans .gitignore ; voir scripts/acces-test.js pour la marche
//      à suivre si tu ne l'as pas encore générée).
//   2. `firebase-admin` est déjà installé en devDependency.
//
// Usage :
//   node scripts/lister-comptes-non-verifies.js
//   node scripts/lister-comptes-non-verifies.js --depuis 2026-08-15
//   node scripts/lister-comptes-non-verifies.js --csv
//
// Options :
//   --depuis <ISO>   Ne lister que les comptes créés à partir de cette date
//                    (format YYYY-MM-DD). Utile pour cibler la cohorte du
//                    20 août sans faire remonter les comptes de test.
//   --csv            Sortir en CSV (courriel;date-création;uid) — pour
//                    coller dans un tableur ou un mail groupé.
//
// Comme il s'agit de lecture seule, aucun garde-fou « PRODUCTION » : le
// script n'écrit rien. Il refuse quand même de partir sans clé de service,
// pour éviter l'erreur silencieuse « aucun résultat » qui viendrait d'une
// mauvaise configuration.
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");

// ---------- Analyse des arguments -------------------------------------------

function argOpt(nom) {
  const idx = process.argv.indexOf(`--${nom}`);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}
function argFlag(nom) {
  return process.argv.includes(`--${nom}`);
}

const depuisBrut = argOpt("depuis");
const enCsv = argFlag("csv");

let depuisMs = null;
if (depuisBrut) {
  const d = new Date(depuisBrut);
  if (Number.isNaN(d.getTime())) {
    console.error(`\n❌ --depuis attend une date au format YYYY-MM-DD. Reçu : « ${depuisBrut} ».\n`);
    process.exit(2);
  }
  depuisMs = d.getTime();
}

// ---------- Initialisation Firebase Admin -----------------------------------
//
// Même détection que scripts/acces-test.js : si les variables d'émulateur
// sont posées, le SDK route localement et n'a pas besoin de la clé. Sinon,
// on exige la clé — pas de contact silencieux avec la production.

const modeEmulateur =
  !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!modeEmulateur && !existsSync(CHEMIN_CLE)) {
  console.error(`
❌ Clé de service introuvable : ${CHEMIN_CLE}

Ce script lirait dans le Firebase Auth de PRODUCTION sans les variables
d'émulateur, et il ne peut pas s'y authentifier sans la clé de service.

Choix :

  A) Cible l'ÉMULATEUR — pose la variable avant de relancer, en PowerShell :
       $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"

  B) Cible la PRODUCTION — télécharge la clé de service :
     Console Firebase → Paramètres du projet → Comptes de service
     → « Générer une nouvelle clé privée »
     → Enregistrer sous : serviceAccountKey.json  (à la racine du dépôt)
     → Vérifier que \`git status\` ne le voit pas (il est dans .gitignore).
`);
  process.exit(1);
}

if (modeEmulateur) {
  initializeApp({ projectId: "mathpratique-8dea1" });
} else {
  const cle = JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"));
  initializeApp({ credential: cert(cle) });
}

const auth = getAuth();

// ---------- Balayage des comptes --------------------------------------------
//
// `listUsers` paginé par 1000, ce qui suffit largement pour 40 étudiants
// et laisse la marge pour les cohortes suivantes. On filtre côté client
// parce que l'API n'expose pas de requête « emailVerified = false ».

const nonVerifies = [];
let pageToken = undefined;
let totalScannes = 0;

do {
  const page = await auth.listUsers(1000, pageToken);
  for (const u of page.users) {
    totalScannes++;
    if (u.emailVerified) continue;
    // Ignorer les comptes fédérés (Google, Apple…) qui ont leur propre
    // vérification implicite et ne recevraient pas de mail à relancer.
    // On ne garde que ceux qui ont AU MOINS un provider `password`.
    const aPassword = (u.providerData || []).some((p) => p.providerId === "password");
    if (!aPassword) continue;
    // Filtre --depuis : ne garder que les comptes créés à partir de la date
    const creeMs = u.metadata?.creationTime ? Date.parse(u.metadata.creationTime) : 0;
    if (depuisMs !== null && creeMs < depuisMs) continue;
    nonVerifies.push({
      email: u.email ?? "(sans courriel)",
      uid: u.uid,
      creeLe: u.metadata?.creationTime ?? "?",
      derniereConnexion: u.metadata?.lastSignInTime ?? "jamais",
    });
  }
  pageToken = page.pageToken;
} while (pageToken);

// Trier du plus récent au plus ancien — les nouveaux en tête.
nonVerifies.sort((a, b) => Date.parse(b.creeLe) - Date.parse(a.creeLe));

// ---------- Sortie ----------------------------------------------------------

if (enCsv) {
  console.log("courriel;creeLe;derniereConnexion;uid");
  for (const c of nonVerifies) {
    console.log(`${c.email};${c.creeLe};${c.derniereConnexion};${c.uid}`);
  }
} else {
  const cible = modeEmulateur ? "ÉMULATEUR" : "PRODUCTION";
  const filtre = depuisMs !== null ? ` depuis ${new Date(depuisMs).toISOString().slice(0, 10)}` : "";
  console.log(`\nCible : ${cible}`);
  console.log(`Comptes balayés : ${totalScannes}`);
  console.log(`Non vérifiés${filtre} : ${nonVerifies.length}\n`);
  if (nonVerifies.length === 0) {
    console.log("(rien à relancer)\n");
  } else {
    for (const c of nonVerifies) {
      console.log(`  ${c.email}`);
      console.log(`    créé : ${c.creeLe}`);
      console.log(`    dernière connexion : ${c.derniereConnexion}`);
      console.log(`    uid : ${c.uid}`);
    }
    console.log("");
  }
}

process.exit(0);

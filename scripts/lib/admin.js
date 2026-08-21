// ============================================================================
//  Init Firebase Admin partagée entre les scripts CLI qui touchent Firestore.
// ============================================================================
//
// Ce module encapsule la mécanique de sécurité qui a été introduite dans
// scripts/acces-test.js (commit d492e46, « Garde-fou production ») et qui
// doit se répéter identique dans TOUT script qui peut écrire en prod.
// Extraire, c'est garantir qu'un futur script ne parte pas avec une
// version affaiblie du garde-fou.
//
// Deux couches de sécurité :
//
//   1. **Détection du mode** — présence de FIRESTORE_EMULATOR_HOST ou
//      FIREBASE_AUTH_EMULATOR_HOST indique un test local. Sinon, cible
//      la production. Sans clé de service dans ce dernier cas, on refuse.
//
//   2. **Confirmation interactive** — en production, l'utilisateur doit
//      taper « PRODUCTION » en majuscules. Le message d'invite décrit
//      concrètement ce que le script s'apprête à faire, via le paramètre
//      `action`. `confirmerProduction: false` désactive ce prompt — à
//      utiliser UNIQUEMENT pour un script en lecture seule (dry-run
//      d'accorder-acces-lot par exemple), jamais pour un script qui
//      pourrait écrire.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const PROJET_FIREBASE = "mathpratique-8dea1";

/**
 * Initialise Firebase Admin et retourne les deux services les plus
 * utilisés. Refuse de partir sans clé de service en mode production,
 * exige la confirmation « PRODUCTION » sauf si on lit seulement.
 *
 * @param {object} opts
 * @param {string} opts.racineDepot - Chemin absolu de la racine du dépôt
 *        (où doit vivre serviceAccountKey.json).
 * @param {string} opts.action - Description ≤ 3 phrases de ce que le
 *        script fera, injectée dans le prompt PRODUCTION.
 * @param {boolean} [opts.confirmerProduction=true] - Passer false
 *        UNIQUEMENT pour un script qui ne fait que lire. Défaut sûr.
 * @returns {Promise<{db: import('firebase-admin/firestore').Firestore,
 *                    auth: import('firebase-admin/auth').Auth,
 *                    modeEmulateur: boolean}>}
 */
export async function initAdminOuMourir({
  racineDepot,
  action,
  confirmerProduction = true,
}) {
  const cheminCle = resolve(racineDepot, "serviceAccountKey.json");
  const modeEmulateur =
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

  if (!modeEmulateur && !existsSync(cheminCle)) {
    console.error(`
❌ Clé de service introuvable : ${cheminCle}

Ce script parlerait au Firestore de PRODUCTION sans les variables
d'environnement pointant vers l'émulateur, et il ne peut pas s'y
authentifier sans la clé de service.

Choix :

  A) Cible l'ÉMULATEUR — pose les deux variables avant de relancer, en PowerShell :
       $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
       $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"

  B) Cible la PRODUCTION — télécharge la clé de service :
     Console Firebase → Paramètres du projet → Comptes de service
     → « Générer une nouvelle clé privée »
     → Enregistrer sous : serviceAccountKey.json  (à la racine du dépôt)
     → Vérifier que \`git status\` ne la voit pas (elle est dans .gitignore).
`);
    process.exit(1);
  }

  if (modeEmulateur) {
    // L'émulateur ignore l'authentification, un projectId suffit.
    initializeApp({ projectId: PROJET_FIREBASE });
  } else {
    if (confirmerProduction) {
      await promptProduction(action);
    }
    const cle = JSON.parse(readFileSync(cheminCle, "utf-8"));
    initializeApp({ credential: cert(cle) });
  }

  return { db: getFirestore(), auth: getAuth(), modeEmulateur };
}

async function promptProduction(action) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ATTENTION — CIBLE : PRODUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${action}

Les variables FIRESTORE_EMULATOR_HOST et FIREBASE_AUTH_EMULATOR_HOST ne
sont PAS posées — toute écriture partira vers ${PROJET_FIREBASE}, visible
immédiatement par les vrais utilisateurs.

Si tu voulais cibler l'émulateur, annule ci-dessous et relance en posant
d'abord :
  $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
  $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"

Pour continuer en production, tape PRODUCTION (en majuscules) puis Entrée.
Toute autre saisie annule l'opération.
`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const reponse = (await rl.question("> ")).trim();
    if (reponse !== "PRODUCTION") {
      console.error("\nOpération annulée. Rien n'a été écrit.\n");
      process.exit(0);
    }
  } finally {
    rl.close();
  }
}

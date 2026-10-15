#!/usr/bin/env node
/**
 * Essai de bout en bout de `analyserNotes`, dans les émulateurs uniquement.
 *
 * Lancement (depuis la racine du dépôt) :
 *
 *   ANALYSE_NOTES_SIMULEE=1 firebase emulators:exec --only auth,firestore,functions \
 *     "node scripts/tester-analyse-notes.mjs"
 *
 * Et, pour vérifier qu'une panne du modèle rend l'analyse réservée, sans la
 * doublure :
 *
 *   firebase emulators:exec --only auth,firestore,functions \
 *     "node scripts/tester-analyse-notes.mjs --panne"
 *
 * Le script REFUSE de tourner hors des émulateurs : il crée des comptes,
 * écrit des accès et vide des compteurs. Rien de tout ça ne doit jamais
 * toucher la production.
 */

import { createRequire } from "node:module";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// pdf-lib est une dépendance des fonctions, pas du site : on le résout
// depuis leur dossier, pour fabriquer des PDF d'essai de N pages.
const { PDFDocument } = createRequire(new URL("../functions/package.json", import.meta.url))("pdf-lib");

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("\n❌ Ce script ne tourne que dans les émulateurs (firebase emulators:exec).\n");
  process.exit(1);
}

const PROJET = process.env.GCLOUD_PROJECT ?? "mathpratique-8dea1";
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const FONCTION = `http://127.0.0.1:5001/${PROJET}/northamerica-northeast1/analyserNotes`;
const modePanne = process.argv.includes("--panne");

initializeApp({ projectId: PROJET });
const db = getFirestore();

// Une chaîne qu'on glisse dans chaque texte envoyé. Si on la retrouve où que
// ce soit après coup — Firestore, journaux — c'est qu'un contenu d'étudiant
// a été conservé.
const SENTINELLE = `SENTINELLE-NOTES-${Math.random().toString(36).slice(2, 10)}`;

let echecs = 0;
const verifier = (condition, libelle, detail = "") => {
  console.log(`  ${condition ? "✅" : "❌"} ${libelle}${!condition && detail ? `\n       ${detail}` : ""}`);
  if (!condition) echecs++;
};

/** Un compte anonyme de l'émulateur : aucun mot de passe en jeu. */
async function nouveauCompte() {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=cle-factice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const j = await r.json();
  return { uid: j.localId, jeton: j.idToken };
}

async function donnerAcces(uid, coursId, niveau = "restreint") {
  const maintenant = Date.now();
  await db.doc(`utilisateurs/${uid}/acces/${coursId}`).set({
    coursId,
    source: "code-classe",
    niveau,
    dateDebut: Timestamp.fromMillis(maintenant - 86_400_000),
    dateFin: Timestamp.fromMillis(maintenant + 30 * 86_400_000),
    aTelecharge: false,
  });
}

/** Appelle la fonction comme le ferait le SDK client. */
async function analyser(jeton, donnees) {
  const r = await fetch(FONCTION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    body: JSON.stringify({ data: donnees }),
  });
  const brut = await r.text();
  let j;
  try {
    j = JSON.parse(brut);
  } catch {
    // Une réponse qui n'est pas du JSON : fonction absente, émulateur en
    // panne. On le rapporte comme un échec lisible au lieu de planter.
    return { erreur: { status: `HTTP_${r.status}`, message: brut.slice(0, 200) } };
  }
  return j.error ? { erreur: j.error } : { resultat: j.result };
}

async function quotaDe(uid) {
  return (await db.doc(`quotasAnalyse/${uid}`).get()).data();
}

/**
 * Ferme le client Firestore et laisse Node sortir de lui-même.
 *
 * Pas de `process.exit` : sous Windows, couper court pendant que libuv
 * referme ses sockets fait planter le processus (« UV_HANDLE_CLOSING »,
 * code 0xC0000409) APRÈS que tous les contrôles sont passés — un faux échec
 * très déroutant. Avec `exitCode`, Node attend que tout soit refermé.
 */
async function terminer(code) {
  await db.terminate();
  process.exitCode = code;
}

async function pdfDePages(n) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([300, 300]).drawText(`page ${i + 1}`);
  return Buffer.from(await doc.save()).toString("base64");
}

const TEXTE_CHAINE =
  `${SENTINELLE} Aujourd'hui : la dérivation en chaîne. Pour une composée, ` +
  "dy/dx = dy/du · du/dx. On dérive l'extérieur, puis la dérivée de l'intérieur.";

// ───────────────────────────────────────────────────────────────────────────
async function essaiPanne() {
  console.log("\n── Panne du modèle : l'analyse réservée doit être rendue ──────────");
  const u = await nouveauCompte();
  await donnerAcces(u.uid, "calcul-differentiel");
  const r = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
  verifier(r.erreur?.status === "UNAVAILABLE", "le modèle injoignable donne une erreur « indisponible »", JSON.stringify(r));
  verifier(/ne t'a pas été comptée/.test(r.erreur?.message ?? ""), "le message dit que l'analyse n'est pas comptée");
  const q = await quotaDe(u.uid);
  verifier((q?.utiliseesAujourdhui ?? 0) === 0, "le compteur est revenu à zéro", JSON.stringify(q));
}

async function essaiComplet() {
  console.log("\n── Refus avant tout calcul ───────────────────────────────────────");
  {
    const r = await analyser(null, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
    verifier(r.erreur?.status === "UNAUTHENTICATED", "non connecté : refusé");
    verifier(/Crée un compte/.test(r.erreur?.message ?? ""), "… avec l'invitation à créer un compte");

    const u = await nouveauCompte();
    const inconnu = await analyser(u.jeton, { coursId: "calcul-integral", texte: TEXTE_CHAINE });
    verifier(inconnu.erreur?.status === "NOT_FOUND", "cours sans catalogue : refusé");

    const long = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: "x".repeat(30_001) });
    verifier(long.erreur?.details?.raison === "texte-trop-long", "texte de 30 001 caractères : refusé");

    const gros = await analyser(u.jeton, {
      coursId: "calcul-differentiel",
      fichier: { mediaType: "image/png", donnees: "A".repeat(14_000_001) },
    });
    verifier(gros.erreur?.details?.raison === "fichier-trop-gros", "fichier de ~10,5 Mo : refusé");

    const pdf21 = await analyser(u.jeton, {
      coursId: "calcul-differentiel",
      fichier: { mediaType: "application/pdf", donnees: await pdfDePages(21) },
    });
    verifier(pdf21.erreur?.details?.raison === "pdf-trop-long", "PDF de 21 pages : refusé");

    const casse = await analyser(u.jeton, {
      coursId: "calcul-differentiel",
      fichier: { mediaType: "application/pdf", donnees: Buffer.from("pas un pdf").toString("base64") },
    });
    verifier(casse.erreur?.details?.raison === "pdf-illisible", "faux PDF : refusé plutôt que deviné");

    verifier((await quotaDe(u.uid)) === undefined, "aucun de ces refus n'a touché au compteur");
  }

  console.log("\n── Sans accès : un seul essai ────────────────────────────────────");
  {
    const u = await nouveauCompte();
    const premier = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
    verifier(premier.resultat !== undefined, "le premier essai passe", JSON.stringify(premier.erreur));
    verifier(premier.resultat?.restantes === 0, "… et annonce 0 analyse restante");
    const second = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
    verifier(second.erreur?.status === "RESOURCE_EXHAUSTED", "le second est refusé");
    verifier(/analyse d'essai/.test(second.erreur?.message ?? ""), "… avec le renvoi vers le package");
  }

  console.log("\n── Avec accès : dix par jour ─────────────────────────────────────");
  {
    const u = await nouveauCompte();
    await donnerAcces(u.uid, "calcul-differentiel");
    const restantes = [];
    for (let i = 0; i < 10; i++) {
      const r = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
      restantes.push(r.resultat?.restantes ?? "erreur");
    }
    verifier(
      JSON.stringify(restantes) === JSON.stringify([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]),
      "dix analyses, restantes 9 → 0",
      JSON.stringify(restantes),
    );
    const onzieme = await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE });
    verifier(onzieme.erreur?.status === "RESOURCE_EXHAUSTED", "la onzième est refusée");
  }

  console.log("\n── Cinq analyses simultanées, deux jetons restants ───────────────");
  {
    const u = await nouveauCompte();
    await donnerAcces(u.uid, "calcul-differentiel");
    const { jourLocal } = await import("../.tmp-test/notes/analyse.js");
    await db.doc(`quotasAnalyse/${u.uid}`).set({ jour: jourLocal(Date.now()), utiliseesAujourdhui: 8 });
    const lot = await Promise.all(
      Array.from({ length: 5 }, () => analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE })),
    );
    const passees = lot.filter((r) => r.resultat).length;
    verifier(passees === 2, "exactement deux passent", `${passees} sont passées`);
    verifier((await quotaDe(u.uid))?.utiliseesAujourdhui === 10, "le compteur s'arrête pile à dix");
  }

  console.log("\n── La réponse ────────────────────────────────────────────────────");
  {
    const u = await nouveauCompte();
    await donnerAcces(u.uid, "calcul-differentiel");
    const r = (await analyser(u.jeton, { coursId: "calcul-differentiel", texte: TEXTE_CHAINE })).resultat;
    verifier(r?.simule === true, "elle se déclare simulée");
    verifier(r?.detectees?.[0]?.id === "CD-5.1", "la doublure reconnaît la dérivation en chaîne", JSON.stringify(r?.detectees));
    verifier(r?.notions?.length === 44, "le catalogue du cours accompagne la réponse (44 notions)");
    verifier(
      r?.notions?.every((n) => !("motsCles" in n)),
      "… sans les mots-clés, qui restent sur le serveur",
    );

    const horsSujet = (
      await analyser(u.jeton, { coursId: "calcul-differentiel", texte: `${SENTINELLE} La Révolution française commence en 1789.` })
    ).resultat;
    verifier(horsSujet?.horsSujet === true && horsSujet.detectees.length === 0, "des notes d'histoire sont hors sujet");

    const pdf3 = await analyser(u.jeton, {
      coursId: "calcul-differentiel",
      fichier: { mediaType: "application/pdf", donnees: await pdfDePages(3) },
    });
    verifier(pdf3.resultat !== undefined, "un PDF de 3 pages passe", JSON.stringify(pdf3.erreur));
  }

  console.log("\n── Rien de l'étudiant n'est resté dans Firestore ─────────────────");
  {
    let documents = 0;
    let suspects = 0;
    const parcourir = async (refs) => {
      for (const ref of refs) {
        for (const doc of (await ref.get()).docs) {
          documents++;
          if (JSON.stringify(doc.data()).includes(SENTINELLE)) suspects++;
          await parcourir(await doc.ref.listCollections());
        }
      }
    };
    await parcourir(await db.listCollections());
    verifier(suspects === 0, `aucun des ${documents} documents ne contient la sentinelle`);
    const collections = (await db.listCollections()).map((c) => c.id).sort();
    verifier(
      JSON.stringify(collections) === JSON.stringify(["quotasAnalyse", "utilisateurs"]),
      "seules les collections attendues existent",
      collections.join(", "),
    );
    const exemple = (await db.collection("quotasAnalyse").limit(1).get()).docs[0]?.data() ?? {};
    verifier(
      Object.keys(exemple).every((k) => ["jour", "utiliseesAujourdhui", "essaiGratuitUtilise", "majLe"].includes(k)),
      "un compteur ne porte que des compteurs",
      Object.keys(exemple).join(", "),
    );
  }

  console.log(`\nSentinelle de cette exécution : ${SENTINELLE}`);
}

if (modePanne) await essaiPanne();
else await essaiComplet();

console.log(`${echecs === 0 ? "✅ tout passe" : `❌ ${echecs} échec(s)`}\n`);
await terminer(echecs === 0 ? 0 : 1);

// ===========================================================================
//  Orphelins et manquants du seau — LECTURE SEULE
// ===========================================================================
//
// La procedure de publication demande que « documents declares au catalogue
// = objets presents, aucun orphelin ». Ce script etablit les deux ecarts :
//
//   ORPHELIN  : un objet est dans le seau mais aucun document du catalogue
//               ne le declare. Personne ne peut le telecharger — il occupe
//               de l'espace et brouille les inventaires.
//   MANQUANT  : un document est declare mais son objet n'existe pas. La
//               carte s'affiche et le telechargement echoue.
//
// Aucune ecriture, aucune suppression.
// ===========================================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { DOCUMENTS } from "../src/acces/documents.ts";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

initializeApp({
  credential: cert(
    JSON.parse(readFileSync(resolve(RACINE, "serviceAccountKey.json"), "utf8")),
  ),
  storageBucket: "mathpratique-8dea1.firebasestorage.app",
});

const declares = new Set(DOCUMENTS.map((d) => d.chemin));
const [objets] = await getStorage().bucket().getFiles();
const noms = objets.map((o) => o.name);

const orphelins = noms.filter((n) => !declares.has(n)).sort();
const manquants = [...declares].filter((d) => !noms.includes(d)).sort();

console.log("CATALOGUE CONTRE SEAU — lecture seule");
console.log("=".repeat(78));
console.log(`  documents declares au catalogue : ${declares.size}`);
console.log(`  objets presents dans le seau    : ${noms.length}`);

console.log(`\n  ORPHELINS — dans le seau, hors catalogue : ${orphelins.length}`);
orphelins.forEach((n) => console.log("    " + n));

console.log(`\n  MANQUANTS — au catalogue, absents du seau : ${manquants.length}`);
manquants.forEach((n) => console.log("    " + n));

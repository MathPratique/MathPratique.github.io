#!/usr/bin/env node
/**
 * Refuse de livrer un fichier statique manquant ou corrompu.
 *
 * Pourquoi ce garde-fou existe
 * ----------------------------
 * Le site est une application à page unique servie par GitHub Pages, et le
 * déploiement copie l'accueil en 404 :
 *
 *     cp dist/index.html dist/404.html
 *
 * C'est indispensable au routage côté client, mais cela transforme toute URL
 * absente en une réponse HTTP 200 contenant du HTML. Un lien `<a download>`
 * vers un PDF manquant enregistre donc cette page d'accueil sous le nom du
 * PDF. L'utilisateur obtient un fichier `.pdf` qui n'en est pas un, et son
 * lecteur affiche une page blanche.
 *
 * Le site ne peut pas signaler l'erreur : de son point de vue, le serveur a
 * répondu « 200 OK ». La seule défense est en amont — casser le build.
 *
 * Ce script échoue donc si un fichier attendu est absent, vide, ou ne
 * commence pas par les octets qui identifient son format. Aucune dépendance :
 * Node seul.
 *
 * Usage :
 *   node scripts/verifier-fichiers-statiques.mjs public   (avant le build)
 *   node scripts/verifier-fichiers-statiques.mjs dist     (après le build)
 */

import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Les fichiers dont l'absence casse une promesse faite à l'utilisateur.
 * `signature` : les premiers octets attendus. `tailleMin` : en octets, pour
 * attraper un fichier tronqué ou un marqueur Git LFS non résolu.
 * `marqueur` (facultatif) : un texte qui doit figurer dans les 4 premiers ko,
 * pour distinguer une page HTML voulue de la page d'accueil renommée — les
 * deux commencent par « <!doctype html> ». Ni signature ni marqueur ne
 * contiennent de fin de ligne : Git peut les convertir sous Windows.
 */
const REQUIS = [
  {
    chemin: "enseignants/echantillon.pdf",
    signature: "%PDF",
    tailleMin: 50_000,
    role: "échantillon téléchargeable depuis /enseignants (version enseignant)",
    lien: "src/pages/Enseignants.tsx (PDF_ECHANTILLON)",
  },
  {
    chemin: "boutique/echantillon.pdf",
    signature: "%PDF",
    tailleMin: 50_000,
    role: "aperçu gratuit téléchargeable depuis /boutique (version étudiant)",
    lien: "src/pages/Boutique.tsx (PDF_APERCU)",
  },
  // Le jeu et ses deux bibliothèques : absents, l'iframe de /jeux/jardin-des-derivees
  // afficherait le site lui-même (sa page 404) au lieu du jeu.
  {
    chemin: "jeux/jardin-des-derivees/jeu.html",
    signature: "<!DOCTYPE html>",
    marqueur: "<title>Le jardin des dérivées — MathPratique</title>",
    tailleMin: 100_000,
    role: "le jeu, affiché dans un iframe par /jeux/jardin-des-derivees",
    lien: "src/data/jeux.ts (fichier)",
  },
  {
    chemin: "jeux/jardin-des-derivees/three.module.min.js",
    signature: "/**",
    marqueur: "Copyright 2010-2023 Three.js Authors",
    tailleMin: 500_000,
    role: "Three.js 0.160.0, importé par jeu.html",
    lien: "public/jeux/jardin-des-derivees/jeu.html (import)",
  },
  {
    chemin: "jeux/jardin-des-derivees/katex.min.js",
    signature: "!function(e,t){",
    tailleMin: 200_000,
    role: "KaTeX, chargé par jeu.html pour les formules",
    lien: "public/jeux/jardin-des-derivees/jeu.html (<script src>)",
  },
  {
    chemin: "jeux/jardin-des-derivees/apercu.webp",
    signature: "RIFF",
    tailleMin: 10_000,
    role: "image de la carte du jeu sur /jeux",
    lien: "src/data/jeux.ts (image)",
  },
];

function verifier(base) {
  const problemes = [];

  for (const f of REQUIS) {
    const complet = path.join(RACINE, base, f.chemin);
    const affiche = `${base}/${f.chemin}`;

    let taille;
    try {
      const st = statSync(complet);
      if (!st.isFile()) {
        problemes.push(`${affiche} n'est pas un fichier.`);
        continue;
      }
      taille = st.size;
    } catch {
      problemes.push(
        `${affiche} est absent.\n` +
          `      Rôle : ${f.role}.\n` +
          `      Référencé par : ${f.lien}.\n` +
          `      Sans lui, le site livre sa page d'accueil déguisée en fichier.`
      );
      continue;
    }

    if (taille < f.tailleMin) {
      problemes.push(
        `${affiche} ne fait que ${taille} octets ` +
          `(minimum attendu : ${f.tailleMin}). Fichier tronqué ?`
      );
      continue;
    }

    // Le cœur du contrôle : un PDF commence par « %PDF ». Une page d'accueil
    // renommée commence par « <!do ». C'est exactement le symptôme qu'on
    // cherche à rendre impossible.
    const debut = readFileSync(complet).subarray(0, f.signature.length).toString("latin1");
    if (debut !== f.signature) {
      problemes.push(
        `${affiche} ne commence pas par « ${f.signature} » mais par ` +
          `« ${debut.replace(/[\r\n]/g, "·")} ». Ce n'est pas le format annoncé.`
      );
      continue;
    }
    if (f.marqueur && !readFileSync(complet).subarray(0, 4096).toString("utf8").includes(f.marqueur)) {
      problemes.push(`${affiche} ne contient pas « ${f.marqueur} » au début. Ce n'est pas le fichier attendu.`);
      continue;
    }

    console.log(`  ok  ${affiche}  (${Math.round(taille / 1024)} ko)`);
  }

  return problemes;
}

const base = process.argv[2] ?? "public";
console.log(`Vérification des fichiers statiques dans ${base}/ :`);

const problemes = verifier(base);

if (problemes.length > 0) {
  console.error(`\nBuild interrompu — ${problemes.length} fichier(s) en défaut :\n`);
  for (const p of problemes) console.error(`  ✗ ${p}\n`);
  console.error(
    "Le déploiement est bloqué volontairement. Un fichier manquant ne\n" +
      "provoquerait aucune erreur visible en production : il serait servi\n" +
      "sous forme de page HTML portant l'extension attendue.\n"
  );
  process.exit(1);
}

console.log(`Tous les fichiers requis sont présents et valides.`);

#!/usr/bin/env node
/**
 * Pré-rendu des pages indexables, et production du plan du site.
 *
 * Le problème qu'on règle
 * -----------------------
 * L'application est rendue entièrement par le navigateur. Le HTML servi
 * contenait `<div id="root"></div>` et rien d'autre : un moteur de recherche
 * qui n'exécute pas le script ne voyait aucun exercice. Or ces pages sont le
 * canal d'acquisition du site — 65 exercices corrigés, avec leurs démarches
 * détaillées, qu'il faut pouvoir trouver depuis une recherche.
 *
 * Ce que fait ce script
 * ---------------------
 * Après `vite build`, il rend chaque route retenue avec React hors du
 * navigateur, injecte le HTML dans le gabarit produit par Vite, et écrit un
 * fichier par route. GitHub Pages les sert directement ; l'application React
 * reprend la main au chargement et l'utilisateur ne voit aucune différence.
 *
 * Aucun serveur n'est introduit : le résultat reste un site statique.
 *
 * Usage : node scripts/prerendre.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(RACINE, "dist");
const SSR = path.join(RACINE, "dist-ssr", "entry-server.js");

const DOMAINE = "https://mathpratique.ca";

/**
 * Les routes pré-rendues, avec leurs métadonnées.
 *
 * Toutes les routes ne le sont pas : `/mon-compte` et `/connexion` n'ont
 * aucun intérêt pour un moteur de recherche et changent selon l'utilisateur.
 * `/achat-confirme` non plus — c'est une page d'après-paiement.
 */
const ROUTES = [
  {
    chemin: "/",
    titre: "MathPratique — Pratique les maths avec sens",
    description:
      "Des exercices de maths corrigés, avec le raisonnement complet à chaque étape. Calcul différentiel, algèbre linéaire, probabilités et statistique.",
    priorite: "1.0",
  },
  {
    chemin: "/exercices/calcul-differentiel",
    titre: "Exercices de calcul différentiel corrigés — MathPratique",
    description:
      "65 exercices de calcul différentiel corrigés et gratuits : limites, formes indéterminées, dérivation en chaîne, taux liés, optimisation. Chaque exercice avec son indice, sa réponse finale et sa démarche détaillée.",
    priorite: "0.9",
  },
  {
    chemin: "/exercices/probabilites-statistique",
    titre: "Exercices de probabilités et statistique corrigés — MathPratique",
    description:
      "100 exercices de probabilités et statistique corrigés et gratuits (201-SN1-RE) : statistiques descriptives, dénombrement, probabilités conditionnelles, loi binomiale, loi normale, intervalles de confiance et tests d'hypothèse. Chaque exercice avec sa réponse finale et sa démarche détaillée.",
    priorite: "0.9",
  },
  {
    chemin: "/practice",
    titre: "Exercices de maths corrigés — MathPratique",
    description:
      "Choisis une matière et avance à ton rythme, avec des solutions détaillées étape par étape.",
    priorite: "0.8",
  },
  {
    chemin: "/boutique",
    titre: "Calcul différentiel — matériel complet — MathPratique",
    description:
      "Notes de cours, plus de 300 exercices corrigés, séries de révision et six examens avec corrigés détaillés. Un seul paiement, 12 mois d'accès, aucun abonnement.",
    priorite: "0.8",
  },
  {
    chemin: "/enseignants",
    titre: "Enseignants — MathPratique",
    description:
      "Matériel de calcul différentiel pour votre groupe : notes en version étudiant et enseignant, banque d'exercices, examens et grilles de correction.",
    priorite: "0.7",
  },
  {
    chemin: "/custom-quiz",
    titre: "Quiz personnalisé de maths — MathPratique",
    description:
      "Compose ton propre quiz : choisis les notions, le nombre de questions et le niveau.",
    priorite: "0.6",
  },
];

function echapper(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Remplace le titre, la description et le contenu du gabarit.
 *
 * Le gabarit est le `dist/index.html` produit par Vite : il porte déjà les
 * bonnes références aux fichiers compilés, avec leurs empreintes. Le
 * reconstruire à la main obligerait à les deviner.
 */
function injecter(gabarit, route, corps) {
  let html = gabarit;
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${echapper(route.titre)}</title>`
  );
  html = html.replace(
    /<meta name="description" content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${echapper(route.description)}" />`
  );
  // Adresse canonique : sans elle, la même page atteinte avec des paramètres
  // de filtre serait indexée plusieurs fois.
  const canonique = `<link rel="canonical" href="${DOMAINE}${route.chemin}" />`;
  html = html.replace("</head>", `    ${canonique}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${corps}</div>`);
  return html;
}

function planDuSite() {
  const entrees = ROUTES.map(
    (r) =>
      `  <url>\n    <loc>${DOMAINE}${r.chemin}</loc>\n` +
      `    <changefreq>monthly</changefreq>\n` +
      `    <priority>${r.priorite}</priority>\n  </url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entrees}\n</urlset>\n`;
}

async function main() {
  if (!existsSync(SSR)) {
    console.error(
      `Pré-rendu impossible : ${path.relative(RACINE, SSR)} est absent.\n` +
        "Le paquet de rendu hors navigateur doit être compilé avant :\n" +
        "  vite build --ssr src/entry-server.tsx --outDir dist-ssr"
    );
    process.exit(1);
  }

  const gabarit = readFileSync(path.join(DIST, "index.html"), "utf8");
  const { rendre } = await import(`file://${SSR}`);

  console.log("Pré-rendu des pages indexables :");
  for (const route of ROUTES) {
    const corps = await rendre(route.chemin);

    // Un corps vide signifierait que le rendu a échoué en silence — et on
    // publierait une page blanche en croyant l'avoir pré-rendue.
    if (corps.trim().length < 200) {
      console.error(`  ${route.chemin} : rendu vide (${corps.length} caractères)`);
      process.exit(1);
    }

    const html = injecter(gabarit, route, corps);
    const dossier =
      route.chemin === "/" ? DIST : path.join(DIST, route.chemin.replace(/^\//, ""));
    mkdirSync(dossier, { recursive: true });
    writeFileSync(path.join(dossier, "index.html"), html, "utf8");
    console.log(
      `  ${route.chemin.padEnd(34)} ${String(Math.round(html.length / 1024)).padStart(4)} ko`
    );
  }

  writeFileSync(path.join(DIST, "sitemap.xml"), planDuSite(), "utf8");
  writeFileSync(
    path.join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${DOMAINE}/sitemap.xml\n`,
    "utf8"
  );
  console.log(`  sitemap.xml et robots.txt écrits (${ROUTES.length} adresses)`);
}

main();

#!/usr/bin/env node
/**
 * Dérive la STRUCTURE du catalogue de notions depuis les banques.
 *
 * Une « notion » est une section de la banque : « 3.3 — Théorème central
 * limite ». Ce découpage existe déjà dans les exercices (champs `section` et
 * `sectionNotes`) ; ce script ne fait que le relever, il n'invente rien.
 *
 * Ce qu'il écrit :
 *   functions/src/notes/notions-<cours>.generated.ts
 *       id, chapitre, section, titre — et rien d'autre. Aucun énoncé, aucune
 *       solution : le catalogue vit dans le code de la Cloud Function et doit
 *       pouvoir y vivre sans risque.
 *
 * Ce qu'il n'écrit PAS : les mots-clés. Ils sont rédigés à la main dans
 * motsCles-<cours>.ts, relus par l'enseignant, et ne doivent jamais être
 * écrasés par une régénération. index.ts marie les deux et refuse de démarrer
 * si l'appariement est incomplet.
 *
 * Usage :
 *   node scripts/generer-catalogue-notions.mjs            # écrit
 *   node scripts/generer-catalogue-notions.mjs --verifier # compare seulement
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = resolve(SITE, "functions/src/notes");
const verifierSeulement = process.argv.includes("--verifier");

const COURS = [
  {
    id: "calcul-differentiel",
    prefixe: "CD",
    blob: "functions/src/data/exercices-cd.json",
    fichier: "notions-calcul-differentiel.generated.ts",
    constante: "NOTIONS_CALCUL_DIFFERENTIEL",
  },
  {
    id: "probabilites-statistique",
    prefixe: "PS",
    blob: "functions/src/data/exercices-ps.json",
    fichier: "notions-probabilites-statistique.generated.ts",
    constante: "NOTIONS_PROBABILITES_STATISTIQUE",
  },
];

/**
 * Libellés canoniques — une entrée par section dont les exercices ne
 * s'accordent pas sur un seul `sectionNotes`.
 *
 * CD-2.7 porte dix variantes de « Formes indéterminées — <technique> ». La
 * technique est un choix de résolution, pas une notion distincte : dans ses
 * notes, l'étudiant a un seul titre et une liste de cas. Les techniques
 * descendent donc dans les mots-clés, où elles servent à la détection.
 *
 * Toute section à libellés multiples SANS entrée ici fait échouer le script.
 * Choisir au hasard le libellé le plus fréquent donnerait un catalogue
 * plausible et faux, qui se corrigerait tout seul au prochain exercice ajouté.
 */
const LIBELLES_CANONIQUES = {
  "CD-2.7": "Formes indéterminées",
};

/**
 * Renommages éditoriaux — sections à libellé unique dont le libellé de la
 * banque nomme un type de document (« Exemples résolus », « Synthèse »)
 * plutôt qu'une notion. C'est pourtant ce que l'étudiant lira dans sa liste
 * de notions à cocher. Décidés par l'enseignant le 2026-10-15.
 *
 * Chaque entrée porte l'ANCIEN libellé, pas seulement le nouveau : si la
 * banque change un jour ce libellé, le renommage ne doit pas l'écraser en
 * silence. Le script s'arrête alors et demande qu'on le revoie.
 */
const RENOMMAGES = {
  "CD-1.2": ["Rappel : simplification d'expressions rationnelles", "Simplification d'expressions rationnelles"],
  "CD-1.3": ["Rappel : les fonctions de base et leurs graphiques", "Les fonctions de base et leurs graphiques"],
  "CD-1.4": ["Rappel : lois des exposants et propriétés des logarithmes", "Lois des exposants et propriétés des logarithmes"],
  "CD-1.6": ["Rappel : cercle trigonométrique et identités", "Cercle trigonométrique et identités"],
  "CD-5.7": ["Démonstrations", "Démonstrations des règles de dérivation"],
  "CD-7.6": ["Interpréter un résultat", "Interprétation d'un résultat en contexte"],
  "PS-2.8": ["Choix de la bonne formule", "Choisir entre permutation, arrangement et combinaison"],
  "PS-2.17": ["Exemples résolus (loi binomiale)", "Calculs avec la loi binomiale"],
  "PS-3.6": ["Exemples résolus (IC moyenne, grand échantillon)", "Calcul d'un intervalle de confiance (moyenne, grand échantillon)"],
  "PS-3.11": ["Méthode en 5 étapes", "Les étapes d'un test d'hypothèse"],
  "PS-3.13": ["Exemples résolus (test moyenne, grand échantillon)", "Test d'hypothèse pour la moyenne — grand échantillon"],
  "PS-3.16": ["Synthèse — Quel outil choisir ?", "Choisir le bon outil d'inférence"],
};

function notionsDuCours(cours) {
  const ex = JSON.parse(readFileSync(resolve(SITE, cours.blob), "utf8")).exercices;
  const parSection = new Map();
  for (const e of ex) {
    if (typeof e.section !== "string" || e.section.length === 0) {
      throw new Error(`${cours.id} : l'exercice ${e.id} n'a pas de section.`);
    }
    // Le codec d'URL du quiz (src/quiz/specs.ts) n'accepte que des entiers
    // séparés par des points : une section « 3.3a » serait écartée en
    // silence au décodage. Mieux vaut l'arrêter ici.
    if (!/^\d+(?:\.\d+)*$/.test(e.section)) {
      throw new Error(`${cours.id} : la section « ${e.section} » (exercice ${e.id}) n'est pas un numéro.`);
    }
    const cle = `${cours.prefixe}-${e.section}`;
    if (!parSection.has(cle)) {
      parSection.set(cle, { id: cle, chapitre: e.chapitre, section: e.section, libelles: new Map() });
    }
    const s = parSection.get(cle);
    if (s.chapitre !== e.chapitre) {
      throw new Error(`${cle} : section partagée entre les chapitres ${s.chapitre} et ${e.chapitre}.`);
    }
    const lib = e.sectionNotes;
    if (typeof lib !== "string" || lib.length === 0) {
      throw new Error(`${cours.id} : l'exercice ${e.id} n'a pas de sectionNotes.`);
    }
    s.libelles.set(lib, (s.libelles.get(lib) ?? 0) + 1);
  }

  const notions = [];
  const aArbitrer = [];
  const renommagesPerimes = [];
  for (const s of parSection.values()) {
    let titre;
    if (s.libelles.size === 1) {
      titre = [...s.libelles.keys()][0];
      const renommage = RENOMMAGES[s.id];
      if (renommage) {
        const [ancien, nouveau] = renommage;
        if (titre !== ancien) {
          renommagesPerimes.push(`${s.id} : la banque dit « ${titre} », le renommage attendait « ${ancien} »`);
          continue;
        }
        titre = nouveau;
      }
    } else if (LIBELLES_CANONIQUES[s.id]) {
      titre = LIBELLES_CANONIQUES[s.id];
    } else {
      aArbitrer.push(`${s.id} → ${[...s.libelles.keys()].join(" / ")}`);
      continue;
    }
    notions.push({ id: s.id, chapitre: s.chapitre, section: s.section, titre });
  }
  if (aArbitrer.length) {
    throw new Error(
      `${cours.id} : ${aArbitrer.length} section(s) à libellés multiples sans libellé canonique.\n` +
        aArbitrer.map((l) => `    ${l}`).join("\n") +
        `\n  Ajoute-les à LIBELLES_CANONIQUES après arbitrage de l'enseignant.`,
    );
  }
  if (renommagesPerimes.length) {
    throw new Error(
      `${cours.id} : ${renommagesPerimes.length} renommage(s) à revoir — le libellé a changé dans la banque.\n` +
        renommagesPerimes.map((l) => `    ${l}`).join("\n"),
    );
  }
  // Un renommage ou un arbitrage qui ne vise aucune section de ce cours :
  // la section a changé de numéro, la décision de l'enseignant pointe dans
  // le vide.
  const ids = new Set(notions.map((n) => n.id));
  const orphelins = [...Object.keys(RENOMMAGES), ...Object.keys(LIBELLES_CANONIQUES)].filter(
    (id) => id.startsWith(`${cours.prefixe}-`) && !ids.has(id),
  );
  if (orphelins.length) {
    throw new Error(`${cours.id} : libellé décidé pour une section absente de la banque — ${orphelins.join(", ")}`);
  }
  // Ordre de lecture : chapitre, puis numéro de section, composante par
  // composante. Surtout pas parseFloat : « 1.10 » vaudrait 1,1 et se
  // rangerait entre 1.1 et 1.2 — l'erreur a été faite une fois.
  notions.sort((a, b) => a.chapitre - b.chapitre || comparerSections(a.section, b.section));
  return notions;
}

/** « 1.2 » < « 1.10 » < « 1.10.1 » : on compare des entiers, pas des décimaux. */
function comparerSections(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? -1) - (pb[i] ?? -1);
    if (d !== 0) return d;
  }
  return 0;
}

function rendre(cours, notions) {
  const lignes = notions.map(
    (n) =>
      `  { id: ${JSON.stringify(n.id)}, chapitre: ${n.chapitre}, ` +
      `section: ${JSON.stringify(n.section)}, titre: ${JSON.stringify(n.titre)} },`,
  );
  return (
    `// Généré par scripts/generer-catalogue-notions.mjs — NE PAS ÉDITER À LA MAIN.\n` +
    `//\n` +
    `// Les ${notions.length} sections de la banque « ${cours.id} ». Les mots-clés qui servent\n` +
    `// à la détection sont ailleurs : voir motsCles-${cours.id}.ts.\n` +
    `\n` +
    `import type { Notion } from "./types.js";\n` +
    `\n` +
    `export const ${cours.constante}: Notion[] = [\n` +
    lignes.join("\n") +
    `\n];\n`
  );
}

if (!existsSync(SORTIE)) mkdirSync(SORTIE, { recursive: true });

let ecarts = 0;
for (const cours of COURS) {
  const notions = notionsDuCours(cours);
  const contenu = rendre(cours, notions);
  const chemin = resolve(SORTIE, cours.fichier);
  const avant = existsSync(chemin) ? readFileSync(chemin, "utf8") : null;
  const identique = avant === contenu;

  if (verifierSeulement) {
    console.log(`  ${cours.id.padEnd(26)} ${notions.length} notions   ${identique ? "à jour" : "DIFFÉRENT du fichier sur disque"}`);
    if (!identique) ecarts++;
  } else {
    writeFileSync(chemin, contenu, "utf8");
    console.log(`  ${cours.id.padEnd(26)} ${notions.length} notions → ${cours.fichier}${identique ? " (inchangé)" : ""}`);
  }
  const parCh = new Map();
  for (const n of notions) parCh.set(n.chapitre, (parCh.get(n.chapitre) ?? 0) + 1);
  console.log(
    `      ${[...parCh.entries()].sort((a, b) => a[0] - b[0]).map(([c, k]) => `ch${c} : ${k}`).join("   ")}`,
  );
}

if (verifierSeulement && ecarts) {
  console.error(`\n❌ ${ecarts} fichier(s) à régénérer : node scripts/generer-catalogue-notions.mjs\n`);
  process.exit(1);
}

// ===========================================================================
//  L'appel au modèle — et sa doublure pour les émulateurs
// ===========================================================================
//
// Ce module ne fait que parler au modèle. Le prompte, le schéma et la lecture
// de la réponse sont des fonctions pures de src/notes/prompte.ts, testées
// sans réseau ; la décision de croire ou non la réponse appartient à
// l'appelant (validerDetections).

import Anthropic from "@anthropic-ai/sdk";

import {
  consigneUtilisateur,
  lireReponse,
  MAX_JETONS_SORTIE,
  promptSysteme,
  schemaReponse,
  type CauseEchec,
} from "../../../src/notes/prompte.js";
import type { NotionComplete } from "./types.js";

/** Le modèle qui fait la détection. Haiku : la tâche est une classification. */
export const MODELE = "claude-haiku-5-5";

/**
 * Peu d'effort : classer une page parmi une centaine de notions ne demande
 * pas de longue réflexion, et c'est le réglage qui coûte le moins. Sur ce
 * modèle, baisser l'effort est la façon recommandée de réduire la
 * réflexion — plutôt que de la couper.
 */
const EFFORT = "low" as const;

export type EntreeModele = {
  coursId: string;
  catalogue: NotionComplete[];
  texte?: string;
  fichier?: { mediaType: string; donnees: Buffer };
};

export type MotifEchec = CauseEchec | "indisponible";

/** Une analyse qui n'a pas abouti, avec ce qu'il faut pour en parler. */
export class ErreurModele extends Error {
  readonly motif: MotifEchec;
  constructor(motif: MotifEchec, detail?: string) {
    super(detail ? `${motif} (${detail})` : motif);
    this.motif = motif;
  }
}

/**
 * La doublure n'est active QUE dans un émulateur, et seulement si on le
 * demande. Avec la seule variable d'environnement, un oubli de configuration
 * en production donnerait une analyse inventée qui se fait passer pour une
 * vraie — le pire des deux mondes.
 *
 *   ANALYSE_NOTES_SIMULEE=1       réponse inventée par correspondance de mots
 *   ANALYSE_NOTES_SIMULEE=panne   modèle injoignable — pour vérifier que
 *                                 l'analyse réservée est bien rendue
 */
export function modeSimule(): "reponse" | "panne" | null {
  if (process.env.FUNCTIONS_EMULATOR !== "true") return null;
  const v = process.env.ANALYSE_NOTES_SIMULEE;
  return v === "1" ? "reponse" : v === "panne" ? "panne" : null;
}

function aplatir(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr-FR");
}

/**
 * La doublure : une détection par simple correspondance de mots-clés.
 * Volontairement bête — elle n'est là que pour faire tourner l'interface, le
 * quota et les messages d'erreur sans dépenser un sou.
 */
export function reponseSimulee(entree: EntreeModele): unknown {
  if (!entree.texte) {
    return {
      notions: entree.catalogue.slice(0, 2).map((n) => ({ id: n.id, confiance: "moyenne" })),
      horsSujet: false,
    };
  }
  const texte = aplatir(entree.texte);
  const scores = entree.catalogue
    .map((n) => {
      const termes = [n.titre, ...n.motsCles];
      return { id: n.id, touches: termes.filter((t) => texte.includes(aplatir(t))).length };
    })
    .filter((s) => s.touches > 0)
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 4);
  return {
    notions: scores.map((s) => ({ id: s.id, confiance: s.touches >= 2 ? "elevee" : "moyenne" })),
    horsSujet: scores.length === 0,
  };
}

/** Le bloc qui porte le fichier de l'étudiant, s'il y en a un. */
function blocFichier(fichier: NonNullable<EntreeModele["fichier"]>): Anthropic.ContentBlockParam {
  const data = fichier.donnees.toString("base64");
  if (fichier.mediaType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  // validerEntree n'a laissé passer que ces trois types d'image.
  const mediaType = fichier.mediaType as "image/jpeg" | "image/png" | "image/webp";
  return { type: "image", source: { type: "base64", media_type: mediaType, data } };
}

/**
 * Renvoie le JSON BRUT du modèle. La validation contre le catalogue se fait
 * chez l'appelant : le module qui parle au modèle ne doit pas être aussi
 * celui qui décide si on le croit.
 *
 * Lève une ErreurModele si l'analyse n'aboutit pas — l'appelant rend alors
 * l'analyse réservée.
 */
export async function analyserAvecModele(entree: EntreeModele, cle: string): Promise<unknown> {
  const simulation = modeSimule();
  if (simulation === "reponse") return reponseSimulee(entree);
  if (simulation === "panne") throw new ErreurModele("indisponible", "panne simulée");

  // Une clé de l'API commence toujours par « sk-ant- ». Une autre forme
  // signale un secret mal enregistré (collage tronqué, mauvaise valeur) :
  // on le dit tout de suite au lieu d'attendre le 401 de l'API — et sans
  // jamais écrire la clé dans le journal.
  if (!cle.startsWith("sk-ant-")) {
    throw new ErreurModele("indisponible", "secret ANTHROPIC_API_KEY mal formé — ce n'est pas une clé « sk-ant- »");
  }

  // Un seul nouvel essai : au-delà, l'étudiant attend devant un indicateur
  // de chargement pour une analyse qui ne viendra probablement pas.
  const client = new Anthropic({ apiKey: cle, maxRetries: 1, timeout: 60_000 });

  // Le document d'abord, la consigne ensuite : c'est l'ordre dans lequel le
  // modèle lit le mieux une image ou un PDF.
  const contenu: Anthropic.ContentBlockParam[] = [];
  if (entree.fichier) contenu.push(blocFichier(entree.fichier));
  contenu.push({ type: "text", text: consigneUtilisateur(entree.texte) });

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: MODELE,
      max_tokens: MAX_JETONS_SORTIE,
      system: [
        {
          type: "text",
          text: promptSysteme(entree.coursId, entree.catalogue),
          // Le prompte système est identique d'un appel à l'autre pour un
          // même cours : en classe, quand trente étudiants analysent leurs
          // notes à quelques minutes d'intervalle, il n'est facturé plein
          // tarif qu'une fois.
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        effort: EFFORT,
        format: { type: "json_schema", schema: schemaReponse(entree.catalogue.map((n) => n.id)) },
      },
      messages: [{ role: "user", content: contenu }],
    });
  } catch (err) {
    // Ni le message d'erreur de l'API ni la requête ne sont recopiés : ils
    // pourraient contenir un extrait des notes. Le statut HTTP suffit.
    const statut = err instanceof Anthropic.APIError ? String(err.status ?? "réseau") : "réseau";
    throw new ErreurModele("indisponible", `HTTP ${statut}`);
  }

  const lecture = lireReponse(message);
  if (!lecture.ok) throw new ErreurModele(lecture.cause, lecture.detail);
  return lecture.json;
}

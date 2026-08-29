// ===========================================================================
//  useExercicesComplets — sert 65 exos à un visiteur, 305 à un détenteur.
// ===========================================================================
//
// Deux sources selon l'accès :
//
//   PAS D'ACCÈS   → les 65 gratuits du bundle (import statique)
//   ACCÈS VALIDE  → les 305 renvoyés par la Cloud Function `obtenirExercices`
//                   (bundle Functions, protégé par verifierAcces côté serveur).
//                   Cache localStorage entre les sessions.
//
// Le hook cache derrière une interface unique : un composant appelle
// `useExercicesComplets("calcul-differentiel")` et reçoit soit un tableau
// prêt (65 ou 305), soit un état de chargement pendant le premier fetch réseau.
//
// ─── Invalidation du cache localStorage ──────────────────────────────────
//
// L'invalidation gère la SÉCURITÉ. On purge :
//
//   1. À la déconnexion (auth change vers null)
//   2. Au changement de compte (uid différent de celui stocké)
//   3. Sur refus serveur (permission-denied) — la Function elle-même a
//      décidé que l'accès n'est plus valide
//   4. Filet uid : chaque lecture vérifie que le uid stocké correspond à
//      l'utilisateur courant, au cas où l'invalidation par événement échoue.
//
// L'invalidation gère aussi la FRAÎCHEUR par comparaison avec le hash
// MIROIR CLIENT — le hash posé par le script de sync du cours à côté de la
// banque, inliné au build Vite. À la lecture du cache, on compare le hash
// miroir stocké avec le miroir courant : différence = nouveau bundle
// déployé = purge + refetch. Un seul refetch par déploiement site.
//
// Le hash de la Function (contentHashFonction) est stocké tel quel après
// fetch mais N'EST PAS comparé au miroir pour déclencher une purge. Si le
// site est plus récent que les Functions (nouveau hash bundlé, ancien blob
// serveur), on aurait sinon une boucle : purge → fetch → hash Function ≠
// miroir → purge → …
//
// ⚠️ Si le miroir bundlé est absent (fichier version.ts manquant), on
// N'INVALIDE PAS le cache — 500 étudiants qui refetch à chaque navigation,
// c'est une facture Blaze. On journalise un avertissement une seule fois.

import { useEffect, useRef, useState } from "react";
import { CHAPITRES as CHAPITRES_CD } from "../data/calcul-differentiel";
import { CONTENT_HASH_CD } from "../data/calcul-differentiel/version";
import { CHAPITRES as CHAPITRES_PS } from "../data/probabilites-statistique";
import { CONTENT_HASH_PS } from "../data/probabilites-statistique/version";
import type { Exercice } from "../data/banque-types";
import { chargerFirebase } from "../firebase/config";
import { assurerAuthPrete } from "../firebase/authPrete";
import { useAuth } from "../firebase/useAuth";
import { useAcces } from "../firebase/useAcces";

type Provenance = "bundle" | "cache" | "reseau";

export type EtatBanque =
  | { statut: "chargement"; exercices: Exercice[]; provenance: "bundle" }
  | { statut: "actif"; exercices: Exercice[]; provenance: Provenance };

/**
 * Les cours servis par ce hook : leur vitrine bundlée et leur hash miroir.
 *
 * Le hash est propre à chaque cours — un redéploiement qui ne touche qu'une
 * banque n'invalide que son cache. Un cours absent de cette table n'a pas de
 * vitrine et le hook rend un tableau vide plutôt que d'échouer : c'est le cas
 * légitime d'une matière encore sans banque.
 */
const SOURCES: Record<string, { bundle: Exercice[]; hashClient: string }> = {
  "calcul-differentiel": {
    bundle: CHAPITRES_CD.flatMap((c) => c.exercices),
    hashClient: CONTENT_HASH_CD,
  },
  "probabilites-statistique": {
    bundle: CHAPITRES_PS.flatMap((c) => c.exercices),
    hashClient: CONTENT_HASH_PS,
  },
};

const AUCUN: Exercice[] = [];

const cleCache = (coursId: string) => `mp:banque:${coursId}`;

type CacheStructure = {
  uid: string;
  coursId: string;
  /** Hash retourné par la Function au moment du dernier fetch. */
  contentHashFonction: string;
  /** Hash miroir bundlé du cours au moment de l'écriture. */
  hashClient: string;
  exercices: Exercice[];
  dateMs: number;
};

// Journal one-shot par cause. Un `.add()` par avertissement, plus jamais
// rejournalisé pendant la durée de la page — évite la pollution console
// au fil des re-renders et des navigations SPA.
const dejaJournalise = new Set<string>();
function journaliserUneFois(cle: string, message: string): void {
  if (dejaJournalise.has(cle)) return;
  dejaJournalise.add(cle);
  // eslint-disable-next-line no-console
  console.warn(message);
}

function lireCache(coursId: string, uidCourant: string): CacheStructure | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(cleCache(coursId));
    if (!brut) return null;
    const parse = JSON.parse(brut) as CacheStructure;
    // Filet de sécurité (invalidation 4) : le uid stocké doit correspondre à
    // l'utilisateur courant. Si non, on purge — quelqu'un d'autre a peut-être
    // utilisé le navigateur, ou l'invalidation par événement a été manquée.
    if (parse.uid !== uidCourant || parse.coursId !== coursId) {
      localStorage.removeItem(cleCache(coursId));
      return null;
    }
    // Invalidation par fraîcheur du bundle client : le hash miroir bundlé au
    // build a-t-il changé depuis la dernière écriture de ce cache ?
    const hashClient = SOURCES[coursId]?.hashClient;
    if (typeof hashClient !== "string" || hashClient.length === 0) {
      // Miroir absent — ne pas purger (éviterait une facture Blaze si un
      // build cassé livrait un version.ts vide sur 500 étudiants). On sert
      // le cache tel quel et on avertit une seule fois, par cours.
      journaliserUneFois(
        `mp:banque:miroir-absent:${coursId}`,
        `[banque:${coursId}] Miroir de hash absent ou vide — le cache client ` +
          `ne s'invalide plus automatiquement au redéploiement du site. ` +
          `Relancer le script de synchronisation du cours pour régénérer ` +
          `src/data/${coursId}/version.ts.`,
      );
      return parse;
    }
    if (parse.hashClient !== hashClient) {
      // Le bundle client a été redéployé depuis la dernière écriture de ce
      // cache — le contenu a peut-être changé. Purge pour forcer un refetch.
      localStorage.removeItem(cleCache(coursId));
      return null;
    }
    return parse;
  } catch {
    return null;
  }
}

function ecrireCache(coursId: string, entree: CacheStructure): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cleCache(coursId), JSON.stringify(entree));
  } catch {
    // Quota dépassé : tant pis, on refetchera au prochain chargement.
  }
}

function purgerCache(coursId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(cleCache(coursId));
  } catch {
    /* ignore */
  }
}

export function useExercicesComplets(coursId: string): EtatBanque {
  const { utilisateur, chargement: chargementAuth } = useAuth();
  const acces = useAcces(coursId);
  const uid = utilisateur?.uid ?? null;

  // La vitrine du cours demandé. Un cours sans banque rend un tableau vide
  // plutôt qu'une erreur : c'est le cas légitime d'une matière à venir.
  const source = SOURCES[coursId];
  const bundle = source?.bundle ?? AUCUN;
  const hashClient = source?.hashClient ?? "";

  const [etat, setEtat] = useState<EtatBanque>({
    statut: "actif",
    exercices: bundle,
    provenance: "bundle",
  });

  // Purge sur changement de compte / déconnexion. On garde une trace du
  // dernier uid vu pour détecter le passage vers null (déconnexion) ou vers
  // un uid différent (changement de compte).
  const uidPrecedent = useRef<string | null>(uid);
  useEffect(() => {
    if (uidPrecedent.current !== null && uidPrecedent.current !== uid) {
      purgerCache(coursId);
      // Fallback au bundle tant que l'accès du nouveau uid n'est pas
      // encore chargé — évite d'afficher les 305 de l'ancien compte.
      setEtat({ statut: "actif", exercices: bundle, provenance: "bundle" });
    }
    uidPrecedent.current = uid;
  }, [uid, coursId]);

  // Charge les 305 quand l'accès est valide. Sinon reste sur les 65.
  useEffect(() => {
    if (chargementAuth || acces.chargement) return;
    if (!uid || !acces.etat.actif) {
      // Sans accès : on reste sur les 65 du bundle. Rien à faire.
      return;
    }

    // Priorité 1 : cache localStorage. Si présent avec le bon uid ET dont
    // le hashClient correspond au miroir bundlé courant, on affiche
    // immédiatement — pas de flash de chargement pour les visites
    // suivantes. `lireCache` a déjà purgé le cache s'il était périmé.
    const enCache = lireCache(coursId, uid);
    if (enCache) {
      setEtat({ statut: "actif", exercices: enCache.exercices, provenance: "cache" });
      return;
    }

    // Priorité 2 : fetch réseau. On passe en "chargement" mais on garde
    // les 65 du bundle sous la main — l'UI peut décider d'afficher un
    // squelette OU les 65 en attendant, selon son goût.
    setEtat({ statut: "chargement", exercices: bundle, provenance: "bundle" });

    let annule = false;
    (async () => {
      try {
        const services = await chargerFirebase();
        if (annule || !services) return;
        // Force la propagation du token Auth vers Functions SDK avant
        // l'appel. Sans ça, un appel juste après restauration de session
        // peut partir sans token → « unauthenticated ».
        await assurerAuthPrete(services.auth);
        if (annule) return;
        const { httpsCallable } = await import("firebase/functions");
        const appel = httpsCallable<{ coursId: string }, { contentHash: string; exercices: Exercice[] }>(
          services.functions,
          "obtenirExercices",
        );
        const reponse = await appel({ coursId });
        if (annule) return;
        const { contentHash, exercices } = reponse.data;
        // On stocke le hash miroir COURANT (bundlé au build) dans le cache,
        // pas le hash retourné par la Function. Sans ça, si le bundle
        // client est plus récent que les Functions déployées (nouveau
        // miroir mais ancien blob serveur), chaque chargement bouclerait :
        // purge → fetch → hash Function ≠ miroir → purge → …
        // La comparaison qui déclenche une purge (dans lireCache) est
        // strictement hashClient-vs-miroir, jamais Function-vs-miroir.
        ecrireCache(coursId, {
          uid,
          coursId,
          contentHashFonction: contentHash,
          hashClient,
          exercices,
          dateMs: Date.now(),
        });
        // Un écart Function/miroir signale un déploiement partiel (site
        // poussé sans redéploiement Functions, ou l'inverse). Ce n'est ni
        // une erreur ni une raison de refetch — on journalise une seule
        // fois par uid pour informer un développeur qui inspecte, sans
        // polluer la console.
        if (
          typeof hashClient === "string" &&
          hashClient.length > 0 &&
          contentHash !== hashClient
        ) {
          journaliserUneFois(
            `mp:banque:ecart-fn-miroir:${uid}`,
            `[banque:${coursId}] La Cloud Function renvoie contentHash="${contentHash}", ` +
              `le bundle client a hashClient="${hashClient}". ` +
              `Déploiement partiel probable — cache stable, pas de refetch.`,
          );
        }
        setEtat({ statut: "actif", exercices, provenance: "reseau" });
      } catch (err) {
        if (annule) return;
        const code = (err as { code?: string })?.code ?? String(err);
        // eslint-disable-next-line no-console
        console.warn(`[banque-cd] obtenirExercices a échoué (${code})`);
        if (code.includes("permission-denied") || code.includes("unauthenticated")) {
          // Le serveur refuse — accès expiré ou révoqué depuis la dernière
          // fois. On purge un éventuel cache et on repasse aux 65 du bundle.
          purgerCache(coursId);
          setEtat({ statut: "actif", exercices: bundle, provenance: "bundle" });
        } else {
          // Réseau, cold start dépassé, autre : on retombe sur le bundle
          // avec le statut actif — mieux que rien, l'utilisateur peut
          // travailler les 65 en attendant que ça remarche.
          setEtat({ statut: "actif", exercices: bundle, provenance: "bundle" });
        }
      }
    })();

    return () => {
      annule = true;
    };
  }, [uid, coursId, chargementAuth, acces.chargement, acces.etat.actif]);

  return etat;
}

/** Utilitaire pour l'affichage : regroupe les 305 (ou 65) par chapitre. */
export function grouperParChapitre(
  exercices: Exercice[],
): { numero: number; exercices: Exercice[] }[] {
  const map = new Map<number, Exercice[]>();
  for (const e of exercices) {
    if (!map.has(e.chapitre)) map.set(e.chapitre, []);
    map.get(e.chapitre)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([numero, exercices]) => ({ numero, exercices }));
}

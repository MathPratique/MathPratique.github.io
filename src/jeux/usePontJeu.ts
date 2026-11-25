// ===========================================================================
//  Pont entre la page d'un jeu et le jeu lui-même (iframe de même origine).
// ===========================================================================
//
// Le jeu (public/jeux/<slug>/jeu.html) ne contient ni configuration ni code
// Firebase. Il demande, par messages entre fenêtres :
//   'pret'        → la page répond 'etat' (connexion et classement)
//   'classement'  → 'reponse' avec le classement à jour
//   'inscrire'    → { temps, pseudo? } : inscrit un temps
//   'pseudo'      → { pseudo } : change le pseudonyme
//   'connexion'   → la page mène à /connexion, puis ramène au jeu
// et la page lui envoie 'etat' quand la connexion change.
//
// Sécurité : dans les deux sens, un message n'est pris en compte que s'il
// vient de la même origine (event.origin) et de la bonne fenêtre (ici,
// l'iframe du jeu) ; tout le reste est ignoré. Les envois précisent l'origine
// du site comme destinataire. Et ce sont les règles Firestore qui décident de
// ce qui s'écrit : un message trafiqué ne peut rien de plus qu'un joueur
// connecté dans la console de son navigateur.

import { useCallback, useEffect, useState, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chargerFirebase } from "../firebase/config";
import { useAuth } from "../firebase/useAuth";
import { changerPseudo, inscrireTemps, lireClassement, type DonneesClassement, type ResultatEcriture } from "./classement";

/** Identique dans le jeu (constante CANAL de jeu.html) : un test le vérifie. */
export const CANAL_JEU = "mathpratique:jeu";

const MESSAGE_ERREUR = "L’inscription n’a pas fonctionné. Réessaie dans un moment.";

type Message = { canal?: unknown; jeu?: unknown; type?: unknown; id?: unknown; temps?: unknown; pseudo?: unknown };
type Lecture = { donnees: DonneesClassement | null; erreur: boolean };

/**
 * Branche le pont pour le jeu `slug`, affiché dans `iframe`. Lit aussi le
 * classement pour la page elle-même (tableau sous le jeu, visible même sur
 * téléphone, où le jeu n'est pas chargé).
 */
export function usePontJeu(iframe: RefObject<HTMLIFrameElement | null>, slug: string, avecClassement: boolean) {
  const { utilisateur, chargement, disponible } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const uid = utilisateur?.uid ?? null;
  const [donnees, setDonnees] = useState<DonneesClassement | null>(null);
  const [erreur, setErreur] = useState(false);

  const envoyer = useCallback(
    (message: Record<string, unknown>) => {
      const fenetre = iframe.current?.contentWindow;
      if (fenetre) fenetre.postMessage({ canal: CANAL_JEU, jeu: slug, ...message }, window.location.origin);
    },
    [iframe, slug],
  );

  // Lit le classement avec le compte connecté à l'instant de la lecture (sans toucher à l'état React)
  const lire = useCallback(async (): Promise<Lecture> => {
    if (!avecClassement) return { donnees: null, erreur: false };
    const services = await chargerFirebase();
    if (!services) return { donnees: null, erreur: false };
    try {
      return { donnees: await lireClassement(services.db, slug, services.auth.currentUser?.uid ?? null), erreur: false };
    } catch (e) {
      console.warn("[classement] lecture impossible", e);
      return { donnees: null, erreur: true };
    }
  }, [avecClassement, slug]);

  // Retient une lecture pour le tableau de la page ; rend le classement lu
  const retenir = useCallback((l: Lecture) => {
    if (l.donnees) setDonnees(l.donnees);
    setErreur(l.erreur);
    return l.donnees;
  }, []);

  // Messages du jeu
  useEffect(() => {
    async function surMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;                       // autre origine : ignoré
      const fenetre = iframe.current?.contentWindow;
      if (!fenetre || e.source !== fenetre) return;                          // autre fenêtre : ignorée
      const m = e.data as Message;
      if (!m || typeof m !== "object" || m.canal !== CANAL_JEU || m.jeu !== slug) return;

      if (m.type === "connexion") {
        navigate("/connexion", { state: { retour: pathname } });
        return;
      }
      const services = await chargerFirebase();
      const compte = services?.auth.currentUser ?? null;
      const etat = (classement: DonneesClassement | null) => ({
        disponible: !!services && avecClassement,
        connecte: !!compte,
        classement,
      });

      if (m.type === "pret") {
        envoyer({ type: "etat", etat: etat(retenir(await lire())) });
        return;
      }
      if (typeof m.id !== "number") return;
      if (m.type === "classement") {
        const c = retenir(await lire());
        envoyer({ type: "reponse", id: m.id, ok: c !== null, etat: etat(c) });
        return;
      }
      if (m.type === "inscrire" || m.type === "pseudo") {
        let r: ResultatEcriture;
        if (!services || !compte || !avecClassement) {
          r = { ok: false, raison: "non-connecte", message: "Connecte-toi avec ton compte MathPratique pour inscrire ton temps." };
        } else {
          try {
            r = m.type === "inscrire"
              ? await inscrireTemps(services.db, slug, compte.uid, m.temps, "pseudo" in m ? m.pseudo : undefined)
              : await changerPseudo(services.db, slug, compte.uid, m.pseudo);
          } catch (err) {
            console.warn("[classement] écriture refusée", err);
            r = { ok: false, raison: "erreur", message: MESSAGE_ERREUR };
          }
        }
        envoyer({ type: "reponse", id: m.id, ...r, etat: etat(retenir(await lire())) });
      }
    }
    window.addEventListener("message", surMessage);
    return () => window.removeEventListener("message", surMessage);
  }, [iframe, slug, avecClassement, envoyer, lire, retenir, navigate, pathname]);

  // Connexion connue ou changée : classement relu, et le jeu en est informé
  useEffect(() => {
    if (chargement) return;
    let annule = false;
    lire().then((l) => {
      if (annule) return;
      const c = retenir(l);
      envoyer({ type: "etat", etat: { disponible: disponible && avecClassement, connecte: !!uid, classement: c } });
    });
    return () => {
      annule = true;
    };
  }, [uid, chargement, disponible, avecClassement, lire, retenir, envoyer]);

  return { donnees, erreur, disponible, connecte: !!uid, chargement };
}

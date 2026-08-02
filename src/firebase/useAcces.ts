// Charge l'accès de l'utilisateur connecté à un cours, et l'évalue avec LA
// règle commune. Tout composant qui a besoin de savoir « est-ce que cette
// personne a accès ? » passe par ici — jamais par un calcul de dates local.

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { lireAcces } from "./acces";
import { verifierAcces, type Acces, type EtatAcces } from "../acces/regles";

export type ResultatAcces = {
  chargement: boolean;
  acces: Acces | null;
  etat: EtatAcces;
  /** Non nul si la lecture a échoué — réseau coupé, règles trop strictes… */
  erreur: string | null;
};

const AUCUN: EtatAcces = {
  actif: false,
  joursRestants: 0,
  bientotExpire: false,
  seuilRappel: null,
};

/**
 * Le résultat est étiqueté par l'uid auquel il appartient.
 *
 * Sans cette étiquette, il faudrait remettre l'état à zéro dans l'effet à
 * chaque déconnexion — un setState synchrone qui provoque un rendu en
 * cascade. En comparant l'étiquette à l'utilisateur courant, un résultat
 * périmé est simplement ignoré : personne ne voit fugitivement l'accès du
 * compte précédent.
 */
type Charge = { uid: string; acces: Acces | null; erreur: string | null };

export function useAcces(coursId: string): ResultatAcces {
  const { utilisateur, chargement: chargementAuth, disponible } = useAuth();
  const [charge, setCharge] = useState<Charge | null>(null);

  const uid = utilisateur?.uid ?? null;

  useEffect(() => {
    if (!disponible || chargementAuth || !uid) return;
    let annule = false;
    lireAcces(uid, coursId)
      .then((acces) => {
        if (!annule) setCharge({ uid, acces, erreur: null });
      })
      .catch(() => {
        // En cas d'échec de lecture, on n'accorde rien. Une erreur réseau ne
        // doit jamais se traduire par un accès ouvert.
        if (!annule)
          setCharge({
            uid,
            acces: null,
            erreur: "Impossible de vérifier ton accès pour le moment.",
          });
      });
    return () => {
      annule = true;
    };
  }, [disponible, chargementAuth, uid, coursId]);

  // Un résultat ne compte que s'il appartient à l'utilisateur actuel.
  const pertinent = charge && charge.uid === uid ? charge : null;

  return {
    chargement: chargementAuth || (!!uid && disponible && pertinent === null),
    acces: pertinent?.acces ?? null,
    etat: pertinent?.acces ? verifierAcces(pertinent.acces) : AUCUN,
    erreur: pertinent?.erreur ?? null,
  };
}

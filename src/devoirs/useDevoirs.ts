// Les devoirs d'un cours, lus en direct. Partagé par la page étudiant et la
// page d'édition.
//
// Même étiquetage que useAcces : le résultat porte l'uid et le cours qui
// l'ont produit, et un résultat périmé (déconnexion, changement de compte)
// est ignoré au lieu d'être remis à zéro dans l'effet.

import { useEffect, useState } from "react";
import { chargerFirebase } from "../firebase/config";
import { abonnerDevoirs } from "./store";
import type { Devoirs } from "./regles";

type Charge = { cle: string; devoirs: Devoirs | null; erreur: string | null };

/**
 * `actif` faux : on ne lit rien (compte sans droit, ou droit pas encore
 * connu). `devoirs` reste null tant que la première lecture n'est pas
 * arrivée ; `erreur` porte le code Firebase d'un refus.
 */
export function useDevoirs(
  coursId: string,
  uid: string | null,
  actif: boolean,
): { devoirs: Devoirs | null; erreur: string | null } {
  const [charge, setCharge] = useState<Charge | null>(null);
  const cle = `${uid}:${coursId}`;

  useEffect(() => {
    if (!actif || !uid) return;
    let annule = false;
    let desabonner: (() => void) | null = null;
    (async () => {
      const services = await chargerFirebase();
      if (annule || !services) return;
      const fin = await abonnerDevoirs(
        services.db,
        coursId,
        (devoirs) => setCharge({ cle, devoirs, erreur: null }),
        (code) => setCharge({ cle, devoirs: null, erreur: code }),
      );
      if (annule) fin();
      else desabonner = fin;
    })().catch((err) => {
      if (!annule) setCharge({ cle, devoirs: null, erreur: String(err) });
    });
    return () => {
      annule = true;
      desabonner?.();
    };
  }, [actif, uid, coursId, cle]);

  const pertinent = actif && charge?.cle === cle ? charge : null;
  return { devoirs: pertinent?.devoirs ?? null, erreur: pertinent?.erreur ?? null };
}

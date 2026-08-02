// Le contexte d'authentification et son type, isolés du composant qui le
// fournit. Séparation imposée par le rechargement à chaud de React : un
// fichier qui exporte un composant ne doit rien exporter d'autre, sinon
// l'état est perdu à chaque sauvegarde pendant le développement.

import { createContext } from "react";
import type { User } from "firebase/auth";

export type ContexteAuth = {
  /** null = personne n'est connecté. */
  utilisateur: User | null;
  /** Vrai tant qu'on ne sait pas encore : évite de montrer « connecte-toi »
   *  une fraction de seconde à quelqu'un qui l'est déjà. */
  chargement: boolean;
  /** Faux tant que le projet Firebase n'est pas configuré. */
  disponible: boolean;
  connexionCourriel: (courriel: string, motDePasse: string) => Promise<void>;
  inscriptionCourriel: (courriel: string, motDePasse: string) => Promise<void>;
  connexionGoogle: () => Promise<void>;
  reinitialiserMotDePasse: (courriel: string) => Promise<void>;
  deconnexion: () => Promise<void>;
};

export const ContexteAuthentification = createContext<ContexteAuth | null>(null);

import { useContext } from "react";
import { ContexteAuthentification, type ContexteAuth } from "./contexte";

export function useAuth(): ContexteAuth {
  const c = useContext(ContexteAuthentification);
  if (!c) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return c;
}

/**
 * Traduit les codes d'erreur du SDK en phrases utiles.
 *
 * Firebase renvoie « auth/invalid-credential » pour un courriel inconnu
 * comme pour un mauvais mot de passe — c'est délibéré de leur part, pour ne
 * pas révéler quels comptes existent. On garde ce flou : le message ne dit
 * pas lequel des deux est en cause.
 */
export function messageErreurAuth(erreur: unknown): string {
  const code =
    typeof erreur === "object" && erreur !== null && "code" in erreur
      ? String((erreur as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Cette adresse courriel n'a pas un format valide.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Adresse courriel ou mot de passe incorrect.";
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cette adresse. Essaie de te connecter.";
    case "auth/weak-password":
      return "Le mot de passe doit faire au moins 6 caractères.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Attends quelques minutes avant de réessayer.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "La fenêtre de connexion a été fermée avant la fin.";
    case "auth/popup-blocked":
      return "Ton navigateur a bloqué la fenêtre de connexion. Autorise-la, ou utilise ton courriel et un mot de passe.";
    case "auth/network-request-failed":
      return "Connexion au réseau impossible. Vérifie ton accès Internet.";
    case "auth-indisponible":
      return "Les comptes ne sont pas encore ouverts.";
    default:
      return "Quelque chose n'a pas fonctionné. Réessaie dans un moment.";
  }
}

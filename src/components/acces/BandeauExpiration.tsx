// Bandeau de rappel affiché quand un accès approche de sa fin.
//
// Décision assumée : **pas de courriel**. Aucun mécanisme d'envoi n'existe, et
// en ajouter un pour deux rappels par an serait disproportionné. Le bandeau
// apparaît sur toutes les pages, ce qui suffit : quelqu'un qui utilise encore
// son matériel le verra, et quelqu'un qui ne l'utilise plus n'a rien à
// télécharger.
//
// Les seuils (30 puis 7 jours) viennent de src/acces/regles.ts — la même
// constante que celle citée dans la foire aux questions de la boutique.

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAcces } from "../../firebase/useAcces";
import { COURS_EN_VENTE } from "../../firebase/acces";
import { formaterDate } from "../../acces/regles";

/** Clé de mémorisation du rejet, par seuil : refermer le rappel « 30 jours »
 *  ne doit pas faire taire celui de « 7 jours », qui est plus urgent. */
const cleRejet = (seuil: number) => `rappel-expiration-rejete-${seuil}`;

export default function BandeauExpiration() {
  const { acces, etat } = useAcces(COURS_EN_VENTE);
  const [rejete, setRejete] = useState(false);

  if (!acces || !etat.actif || !etat.bientotExpire || etat.seuilRappel === null) {
    return null;
  }

  const cle = cleRejet(etat.seuilRappel);
  // sessionStorage plutôt que localStorage : le rappel revient à la prochaine
  // visite. Un accès qui expire mérite qu'on insiste un peu.
  if (rejete || sessionStorage.getItem(cle) === "oui") return null;

  const urgent = etat.seuilRappel <= 7;

  return (
    <div
      role="status"
      className={`border-b ${
        urgent ? "border-amber-300 bg-amber-50" : "border-brand-200 bg-brand-50"
      }`}
    >
      <div className="container-page flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className={urgent ? "text-amber-900" : "text-brand-900"}>
          <strong>
            {etat.joursRestants <= 1
              ? "Ton accès se termine aujourd'hui."
              : `Il te reste ${etat.joursRestants} jours d'accès.`}
          </strong>{" "}
          Il se termine le {formaterDate(acces.dateFin)}. Télécharge ce que tu
          veux garder — les documents téléchargés restent à toi.
        </p>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link
            to="/mon-compte"
            className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white ${
              urgent ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            Mes documents
          </Link>
          <button
            type="button"
            aria-label="Masquer ce rappel"
            onClick={() => {
              sessionStorage.setItem(cle, "oui");
              setRejete(true);
            }}
            className="text-ink-600 hover:text-ink-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

import { NavLink } from "react-router-dom";
import Logo from "../ui/Logo";
import { COPYRIGHT, EMAIL_CONTACT } from "../../data/site";

const lien = "cursor-pointer transition-colors duration-200 hover:text-brand-700";

// Les pages Politique de remboursement, Conditions d'utilisation et Politique
// de confidentialité existent en brouillon (2026-10-26) mais ne sont PAS
// liées ici : leurs liens s'ajouteront après révision.
const LIENS = [
  { to: "/", label: "Accueil" },
  { to: "/practice", label: "Exercices" },
  { to: "/outils/note-examen-final", label: "Calculateur de note finale" },
  { to: "/boutique", label: "Boutique" },
  { to: "/enseignants", label: "Enseignants" },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-brand-50/50">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-ink-600">
            Des exercices de maths corrigés pour les étudiants qui veulent
            comprendre pourquoi une réponse est juste, pas seulement laquelle
            elle est.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-ink-600 sm:max-w-md sm:justify-end"
          aria-label="Navigation du pied de page"
        >
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={lien}>
              {l.label}
            </NavLink>
          ))}
          <a href={`mailto:${EMAIL_CONTACT}`} className={lien}>
            Contact
          </a>
        </nav>
      </div>

      <div className="border-t border-brand-100">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{COPYRIGHT}</p>
          <p>Fait avec soin, pour la clarté avant la vitesse.</p>
        </div>
      </div>
    </footer>
  );
}

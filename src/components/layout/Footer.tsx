import { NavLink } from "react-router-dom";
import Logo from "../ui/Logo";

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

        <nav className="flex items-center gap-6 text-sm font-medium text-ink-600" aria-label="Navigation du pied de page">
          <NavLink to="/" className="cursor-pointer transition-colors duration-200 hover:text-brand-700">
            Accueil
          </NavLink>
          <NavLink to="/practice" className="cursor-pointer transition-colors duration-200 hover:text-brand-700">
            Exercices
          </NavLink>
        </nav>
      </div>

      <div className="border-t border-brand-100">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MathPratique. Conçu pour les étudiants, par des étudiants.</p>
          <p>Fait avec soin, pour la clarté avant la vitesse.</p>
        </div>
      </div>
    </footer>
  );
}

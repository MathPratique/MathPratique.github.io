import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../ui/Logo";
import clsx from "clsx";
import { useAuth } from "../../firebase/useAuth";

// `labelCourt` : le libellé de la barre en ligne, quand le nom complet y
// prend trop de place. Le menu déroulant garde toujours `label`.
type Lien = { to: string; label: string; labelCourt?: string };

const liensDeBase: Lien[] = [
  { to: "/", label: "Accueil" },
  { to: "/practice", label: "Exercices" },
  { to: "/custom-quiz", label: "Quiz personnalisé", labelCourt: "Quiz" },
  { to: "/outils/note-examen-final", label: "Calculateur" },
  { to: "/boutique", label: "Boutique" },
  { to: "/enseignants", label: "Enseignants" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { utilisateur, disponible } = useAuth();

  // Le lien de compte n'apparaît que si les comptes existent réellement.
  // Tant que Firebase n'est pas configuré, la barre reste telle quelle —
  // inutile d'offrir une porte qui ne mène nulle part.
  //
  // Les liens en ligne apparaissent à partir de `lg` (1024 px). Pas plus
  // haut : beaucoup de portables Windows affichés à 125 % ou 150 % ont une
  // largeur utile entre 1024 et 1279 px, et le menu déroulant y serait
  // malvenu. Pour tenir à 1024 px sans réduire le texte, « Quiz personnalisé »
  // devient « Quiz » dans la barre, et les liens ont un peu moins de marge
  // intérieure (12 px au lieu de 16). Mesuré le 2026-10-23 à 1024 px : il
  // reste 71 px libres entre le logo et les liens avec « Connexion », 56 px
  // avec « Mon compte » — la cible est d'au moins 40. À remesurer avant
  // d'ajouter une entrée.
  const links: Lien[] = disponible
    ? [...liensDeBase, { to: utilisateur ? "/mon-compte" : "/connexion", label: utilisateur ? "Mon compte" : "Connexion" }]
    : liensDeBase;

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="container-page">
        <nav
          className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white/80 px-4 py-3 shadow-sm shadow-brand-900/5 backdrop-blur-md sm:px-6"
          aria-label="Navigation principale"
        >
          <NavLink to="/" className="cursor-pointer" onClick={() => setOpen(false)}>
            <Logo />
          </NavLink>

          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                // Le nom complet reste celui qu'entend un lecteur d'écran.
                aria-label={link.labelCourt ? link.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    "cursor-pointer whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                  )
                }
              >
                {link.labelCourt ?? link.label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            className="cursor-pointer rounded-full p-2 text-brand-900 lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-2 flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-sm shadow-brand-900/5 backdrop-blur-md lg:hidden"
            >
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "cursor-pointer rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

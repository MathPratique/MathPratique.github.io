import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../ui/Logo";
import clsx from "clsx";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/practice", label: "Exercices" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

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

          <div className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            className="cursor-pointer rounded-full p-2 text-brand-900 sm:hidden"
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
              className="mt-2 flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-sm shadow-brand-900/5 backdrop-blur-md sm:hidden"
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

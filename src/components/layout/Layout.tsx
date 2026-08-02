import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BandeauExpiration from "../acces/BandeauExpiration";

export default function Layout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Sous la barre fixe, au-dessus du contenu : le rappel doit se voir
          sur toutes les pages, pas seulement dans le compte. */}
      <div className="pt-24">
        <BandeauExpiration />
      </div>
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { useAuth, messageErreurAuth } from "../firebase/useAuth";
import { MESSAGE_NON_CONFIGURE } from "../firebase/config";

type Mode = "connexion" | "inscription";

/**
 * Connexion et inscription sur le même écran.
 *
 * Un seul formulaire, un lien pour basculer. Deux pages séparées obligeraient
 * l'étudiant à deviner s'il a déjà un compte — question à laquelle il ne sait
 * souvent pas répondre après quelques mois.
 */
export default function Connexion() {
  const { utilisateur, chargement, disponible, connexionCourriel, inscriptionCourriel, connexionGoogle, reinitialiserMotDePasse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("connexion");
  const [courriel, setCourriel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Où renvoyer après connexion. Par défaut, la boutique : c'est de là que
  // vient la quasi-totalité des gens qui se connectent.
  const retour = (location.state as { retour?: string } | null)?.retour ?? "/mon-compte";

  if (!chargement && utilisateur) return <Navigate to={retour} replace />;

  if (!disponible) {
    return (
      <div className="container-page py-16 sm:py-20">
        <AnimatedSection className="mx-auto max-w-md text-center">
          <h1 className="text-balance text-3xl font-bold sm:text-4xl">Comptes</h1>
          <p className="mt-4 text-base text-ink-600">{MESSAGE_NON_CONFIGURE}</p>
          <Link
            to="/boutique"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
          >
            Voir le matériel
          </Link>
        </AnimatedSection>
      </div>
    );
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setEnvoi(true);
    try {
      if (mode === "connexion") await connexionCourriel(courriel, motDePasse);
      else await inscriptionCourriel(courriel, motDePasse);
      navigate(retour, { replace: true });
    } catch (err) {
      setErreur(messageErreurAuth(err));
    } finally {
      setEnvoi(false);
    }
  }

  async function avecGoogle() {
    setErreur(null);
    setInfo(null);
    try {
      await connexionGoogle();
      navigate(retour, { replace: true });
    } catch (err) {
      setErreur(messageErreurAuth(err));
    }
  }

  async function motDePasseOublie() {
    setErreur(null);
    setInfo(null);
    if (!courriel) {
      setErreur("Entre d'abord ton adresse courriel, puis reclique ici.");
      return;
    }
    try {
      await reinitialiserMotDePasse(courriel);
      // On confirme l'envoi sans dire si le compte existe : l'inverse
      // permettrait de découvrir qui est inscrit.
      setInfo("Si un compte existe pour cette adresse, un courriel vient d'y être envoyé.");
    } catch (err) {
      setErreur(messageErreurAuth(err));
    }
  }

  const champ =
    "mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500";

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-md">
        <h1 className="text-balance text-center text-3xl font-bold sm:text-4xl">
          {mode === "connexion" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="mt-3 text-center text-sm text-ink-600">
          {mode === "connexion"
            ? "Ton compte donne accès au matériel que tu as acheté."
            : "Un compte est nécessaire pour rattacher ton achat et retrouver ton matériel."}
        </p>

        <div className="mt-8 rounded-3xl border border-brand-100 bg-white p-6 sm:p-8">
          <button
            type="button"
            onClick={avecGoogle}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            {/* Le « G » de Google, dessiné plutôt que chargé depuis un CDN :
                aucune requête vers un tiers avant que l'usager ait cliqué. */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2.1H12v4h5.9a5 5 0 01-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.9z" />
              <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.4H2.3v2.8A10.9 10.9 0 0012 23z" />
              <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 010-4.2V7.3H2.3a11 11 0 000 9.8L6 14.3z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A10.9 10.9 0 002.3 7.3L6 10.1c.8-2.5 3.2-4.4 6-4.4z" />
            </svg>
            Continuer avec Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-600">
            <span className="h-px flex-1 bg-brand-100" />
            ou
            <span className="h-px flex-1 bg-brand-100" />
          </div>

          <form onSubmit={soumettre} noValidate>
            <label className="block text-sm font-medium text-ink-700">
              Adresse courriel
              <input
                type="email"
                required
                autoComplete="email"
                value={courriel}
                onChange={(e) => setCourriel(e.target.value)}
                className={champ}
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-ink-700">
              Mot de passe
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={champ}
              />
            </label>
            {mode === "inscription" && (
              <p className="mt-1.5 text-xs text-ink-600">Au moins 6 caractères.</p>
            )}

            {erreur && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {erreur}
              </p>
            )}
            {info && (
              <p role="status" className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/50"
            >
              {envoi ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {mode === "connexion" && (
            <button
              type="button"
              onClick={motDePasseOublie}
              className="mt-4 w-full text-center text-sm text-brand-700 hover:text-brand-800"
            >
              Mot de passe oublié ?
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink-600">
          {mode === "connexion" ? "Pas encore de compte ?" : "Tu en as déjà un ?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "connexion" ? "inscription" : "connexion");
              setErreur(null);
              setInfo(null);
            }}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            {mode === "connexion" ? "Crée-en un" : "Connecte-toi"}
          </button>
        </p>
      </AnimatedSection>
    </div>
  );
}

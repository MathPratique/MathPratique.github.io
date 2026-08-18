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
  const { utilisateur, chargement, disponible, connexionCourriel, inscriptionCourriel, reinitialiserMotDePasse } = useAuth();
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

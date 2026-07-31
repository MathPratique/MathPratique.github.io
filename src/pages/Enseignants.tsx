import { useEffect, useState, type FormEvent } from "react";
import AnimatedSection from "../components/ui/AnimatedSection";
import { EMAIL_CONTACT } from "../data/site";

// ═════════════════════════════════════════════════════════════════════════
//  Constantes de contenu — modifier ici plutôt que dans le JSX.
// ═════════════════════════════════════════════════════════════════════════

// Prix « à partir de » — jamais un montant ferme.
const PRIX_ADOPTION_MIN = 29; // $ CAD par étudiant
const PRIX_LICENCE_MIN = 400; // $ CAD par groupe, par session

// Endpoint Formspree. Tant que vide, le formulaire bascule sur mailto:.
// Format attendu : "https://formspree.io/f/xxxxxxxx".
const FORMSPREE_ENDPOINT = "";

// PDF de l'échantillon (chapitre complet version enseignant + une dizaine
// d'exercices). Le fichier est déposé dans public/enseignants/ ; sa présence
// est contrôlée au build par scripts/verifier-fichiers-statiques.mjs, car un
// fichier manquant serait servi sous forme de page d'accueil renommée en .pdf.
const PDF_ECHANTILLON = "/enseignants/echantillon.pdf";

// Nom sous lequel le fichier est enregistré : lisible, sans espace ni accent,
// et explicite une fois seul dans un dossier de téléchargements.
const NOM_TELECHARGEMENT = "calcul-differentiel-echantillon.pdf";

// Adresse mail de secours utilisée en fallback si Formspree n'est pas
// configuré. Elle vient de src/data/site.ts : une seule ligne à changer pour
// tout le site.

// Rate limit côté client : refuse une soumission < N minutes après la précédente.
const RATE_LIMIT_MINUTES = 30;
const RATE_LIMIT_KEY = "enseignants_last_submit";

// ═════════════════════════════════════════════════════════════════════════

type FormState = "idle" | "loading" | "success" | "error" | "rate-limited";

export default function Enseignants() {
  useEffect(() => {
    document.title = "Enseignants — MathPratique";
    const meta = document.querySelector("meta[name=\"description\"]");
    if (meta) {
      meta.setAttribute(
        "content",
        "Matériel de cours complet pour enseignants du collégial : notes en version enseignant et étudiant, exercices avec démarches, examens corrigés et grilles de correction. Adoption ou licence de groupe.",
      );
    }
  }, []);

  return (
    <div className="container-page py-12 sm:py-16">
      <Hero />
      <CeQueVousObtenez />
      <Echantillon />
      <ModelesUtilisation />
      <FAQ />
      <Contact />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  Sections
// ═════════════════════════════════════════════════════════════════════════

function Hero() {
  return (
    <AnimatedSection className="mx-auto max-w-3xl text-center">
      <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
        Pour les enseignants
      </span>
      <h1 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">
        Du matériel de cours complet, prêt à utiliser avec vos groupes.
      </h1>
      <p className="mt-4 text-balance text-lg text-ink-600">
        Notes de cours en version enseignant et version trouée pour les étudiants,
        banque d'exercices avec solutions détaillées, examens de pratique avec
        corrigés et grilles de correction. Vous adaptez, vous imprimez, vous
        enseignez.
      </p>
    </AnimatedSection>
  );
}

function CeQueVousObtenez() {
  const items: { titre: string; texte: string; emphase?: boolean }[] = [
    {
      titre: "Notes de cours en deux versions",
      texte:
        "Version enseignant complète et version étudiant trouée à compléter en classe. Format PDF imprimable.",
    },
    {
      titre: "Plus de 300 exercices classés",
      texte:
        "Par chapitre et par difficulté, avec réponses finales et démarches détaillées.",
    },
    {
      titre: "Séries mélangées pour la révision",
      texte:
        "Idéales pour les périodes de révision avant les évaluations, avec un dosage varié des difficultés.",
    },
    {
      titre: "Examens de pratique",
      texte:
        "Intras et finaux corrigés en détail, prêts à distribuer comme matériel de préparation.",
    },
    {
      titre: "Grilles de correction",
      texte:
        "Répartition des points par critère d'évaluation — vous ne partez jamais d'une page blanche.",
      emphase: true,
    },
    {
      titre: "Accès numérique + PDF",
      texte:
        "Vos étudiants accèdent en ligne au contenu du site, et vous téléchargez les PDF pour vos impressions.",
    },
  ];

  return (
    <AnimatedSection delay={0.05} className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Ce que vous obtenez
        </h2>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.titre}
            className={
              item.emphase
                ? "rounded-2xl border-2 border-brand-300 bg-brand-50/60 p-6 shadow-sm shadow-brand-900/5"
                : "rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5"
            }
          >
            <h3 className="font-display text-lg font-bold text-brand-900">
              {item.titre}
              {item.emphase && (
                <span className="ml-2 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                  Différenciateur
                </span>
              )}
            </h3>
            <p className="mt-2 text-sm text-ink-700">{item.texte}</p>
          </li>
        ))}
      </ul>
    </AnimatedSection>
  );
}

function Echantillon() {
  return (
    <AnimatedSection delay={0.1} className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Voyez le matériel avant de vous décider
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-ink-700">
          Un chapitre complet en version enseignant, plus une dizaine
          d'exercices avec leurs démarches détaillées. Aucune inscription
          demandée, aucun courriel à laisser.
        </p>
        <a
          href={PDF_ECHANTILLON}
          download={NOM_TELECHARGEMENT}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12M6 11l6 6 6-6M4 21h16" />
          </svg>
          Télécharger l'échantillon (PDF)
        </a>
      </div>
    </AnimatedSection>
  );
}

function ModelesUtilisation() {
  return (
    <AnimatedSection delay={0.15} className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Comment l'utiliser avec votre groupe
        </h2>
        <p className="mt-3 text-balance text-base text-ink-600">
          Deux formules, à vous de choisir celle qui convient le mieux à votre
          contexte.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <ModeleCard
          titre="Adoption"
          description="Vos étudiants achètent le matériel à tarif de groupe réduit. Vous recevez l'accès complet gratuitement, incluant la version enseignant, les corrigés et les grilles de correction."
          prixTexte={`À partir de ${PRIX_ADOPTION_MIN} $ par étudiant`}
          badge="Populaire"
        />
        <ModeleCard
          titre="Licence de groupe"
          description="Votre département, votre centre d'aide ou votre établissement paie une licence, et tous vos étudiants ont accès gratuitement."
          prixTexte={`À partir de ${PRIX_LICENCE_MIN} $ par groupe, par session`}
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-600">
        Une autre formule vous conviendrait mieux? Écrivez-nous, on s'adapte.
      </p>
    </AnimatedSection>
  );
}

function ModeleCard({
  titre,
  description,
  prixTexte,
  badge,
}: {
  titre: string;
  description: string;
  prixTexte: string;
  badge?: string;
}) {
  return (
    <div className="relative flex h-full flex-col rounded-3xl border border-brand-100 bg-white p-8 shadow-sm shadow-brand-900/5">
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <h3 className="font-display text-2xl font-bold text-brand-900">{titre}</h3>
      <p className="mt-4 text-sm text-ink-700">{description}</p>
      <p className="mt-6 font-display text-lg font-semibold text-brand-700">
        {prixTexte}
      </p>
    </div>
  );
}

function FAQ() {
  const items: { question: string; reponse: string }[] = [
    {
      question: "Est-ce que je peux adapter le matériel à ma façon d'enseigner?",
      reponse:
        "Oui. Vous recevez les fichiers PDF et pouvez les imprimer ou les distribuer tels quels. Une version source (Word ou LaTeX) peut être fournie sur demande selon la formule choisie, pour vous permettre de modifier des passages, ajouter vos propres exemples ou retirer une section.",
    },
    {
      question: "Est-ce que ça couvre l'ensemble du cours?",
      reponse:
        "Oui pour les cours actuellement disponibles : Calcul différentiel et Probabilités et statistique couvrent l'intégralité du plan-cadre ministériel. D'autres cours sont en préparation.",
    },
    {
      question: "Est-ce que je peux utiliser les examens comme évaluations dans mon cours?",
      reponse:
        "Ces examens sont conçus comme du matériel de pratique et sont accessibles à vos étudiants. Ils ne sont donc pas sécurisés au sens d'une évaluation officielle. Vous pouvez vous en inspirer pour construire vos propres évaluations, mais je ne recommande pas de les distribuer tels quels comme épreuves notées.",
    },
    {
      question: "Comment mes étudiants accèdent-ils au matériel?",
      reponse:
        "En formule Adoption, chaque étudiant paie en ligne et reçoit ses PDF par courriel plus l'accès au site. En formule Licence de groupe, vous recevez un code d'accès à distribuer à votre groupe.",
    },
    {
      question: "Quels cours sont disponibles?",
      reponse:
        "Actuellement : Calcul différentiel et Probabilités et statistique. Calcul intégral et Algèbre linéaire sont en cours de préparation — écrivez-nous si vous voulez être avisé quand ils seront prêts.",
    },
  ];

  return (
    <AnimatedSection delay={0.2} className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Questions fréquentes
        </h2>
        <div className="mt-10 space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-brand-100 bg-white p-5 open:shadow-sm open:shadow-brand-900/5"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold text-brand-900">
                <span>{item.question}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="mt-1 flex-shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-ink-700">{item.reponse}</p>
            </details>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  Formulaire de contact
// ═════════════════════════════════════════════════════════════════════════

function Contact() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot : si le champ appât est rempli, on prétend un succès sans envoyer.
    const honeypot = formData.get("website");
    if (typeof honeypot === "string" && honeypot.length > 0) {
      setState("success");
      return;
    }

    // Rate limit local (contournable, mais suffit pour du volume faible).
    const lastSubmit = Number(localStorage.getItem(RATE_LIMIT_KEY) ?? 0);
    const now = Date.now();
    if (lastSubmit && now - lastSubmit < RATE_LIMIT_MINUTES * 60 * 1000) {
      setState("rate-limited");
      return;
    }

    // Fallback mailto si Formspree n'est pas configuré : ouvre le client mail
    // avec un corps pré-rempli. On reste en état idle pour ne pas mentir.
    if (!FORMSPREE_ENDPOINT) {
      const subject = "Demande de matériel — MathPratique.ca (enseignant)";
      const bodyLines: string[] = [];
      formData.forEach((value, key) => {
        if (key === "website" || typeof value !== "string") return;
        if (value.trim()) bodyLines.push(`${key} : ${value}`);
      });
      const body = bodyLines.join("\n");
      window.location.href = `mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    setState("loading");
    setErrorMessage("");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      localStorage.setItem(RATE_LIMIT_KEY, String(now));
      setState("success");
      form.reset();
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  if (state === "success") {
    return (
      <AnimatedSection delay={0.25} className="mt-16 sm:mt-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-emerald-900">
            Message reçu, merci !
          </h2>
          <p className="mt-3 text-sm text-emerald-800">
            Je vous réponds en moins de deux jours ouvrables, à l'adresse que vous
            avez indiquée.
          </p>
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection delay={0.25} className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
            Une question, une demande?
          </h2>
          <p className="mt-3 text-balance text-base text-ink-600">
            Écrivez-nous, on répond en moins de deux jours ouvrables.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl border border-brand-100 bg-white p-8 shadow-sm shadow-brand-900/5"
          noValidate
        >
          {/* Honeypot — invisible pour les humains, alléchant pour les bots */}
          <div className="hidden" aria-hidden="true">
            <label>
              Ne remplissez pas ce champ
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <FormField label="Nom" name="nom" required />
          <FormField label="Courriel" name="courriel" type="email" required />
          <FormField label="Établissement" name="etablissement" />
          <FormField label="Cours enseigné" name="cours" />
          <FormField
            label="Nombre de groupes et d'étudiants"
            name="effectifs"
            placeholder="ex. 2 groupes, environ 70 étudiants"
          />

          <FormSelect
            label="Formule qui vous intéresse"
            name="formule"
            options={[
              { value: "", label: "— Choisir (facultatif) —" },
              { value: "adoption", label: "Adoption" },
              { value: "licence", label: "Licence de groupe" },
              { value: "je-ne-sais-pas", label: "Je ne sais pas encore" },
            ]}
          />

          <FormSelect
            label="Session visée"
            name="session"
            options={[
              { value: "", label: "— Choisir (facultatif) —" },
              { value: "automne-2026", label: "Automne 2026" },
              { value: "hiver-2027", label: "Hiver 2027" },
              { value: "plus-tard", label: "Plus tard" },
            ]}
          />

          <FormField label="Message" name="message" as="textarea" rows={4} />

          {state === "error" && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <p className="font-semibold">L'envoi a échoué.</p>
              <p className="mt-1">
                {errorMessage
                  ? `Détail : ${errorMessage}. `
                  : ""}
                Vous pouvez réessayer, ou nous écrire directement à{" "}
                <a
                  href={`mailto:${EMAIL_CONTACT}`}
                  className="font-semibold underline"
                >
                  {EMAIL_CONTACT}
                </a>.
              </p>
            </div>
          )}

          {state === "rate-limited" && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              Vous venez d'envoyer un message. Merci de patienter quelques
              minutes avant d'en envoyer un autre.
            </div>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {state === "loading" ? "Envoi en cours…" : "Envoyer la demande"}
          </button>

          <p className="text-center text-xs text-ink-600">
            Vos coordonnées sont utilisées uniquement pour répondre à votre demande.
          </p>
        </form>
      </div>
    </AnimatedSection>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  as,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  as?: "textarea";
  rows?: number;
}) {
  const id = `field-${name}`;
  const inputCls =
    "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm transition-colors duration-150 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-900">
        {label}
        {required && <span aria-hidden="true" className="ml-1 text-rose-600">*</span>}
        {required && <span className="sr-only"> (requis)</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={rows ?? 4}
          className={inputCls}
        />
      ) : (
        <input
          id={id}
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          autoComplete={type === "email" ? "email" : name === "nom" ? "name" : "off"}
          className={inputCls}
        />
      )}
    </div>
  );
}

function FormSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-900">
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm transition-colors duration-150 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
        defaultValue=""
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Exporté pour usage éventuel depuis d'autres pages.
export { EMAIL_CONTACT };

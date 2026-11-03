// L'édition des devoirs d'un cours, réservée au compte administrateur.
//
// Tout se fait ici, sans commit ni déploiement : ajouter ou retirer une
// semaine, choisir les exercices par chapitre et section (aucun ID à
// taper), coller une liste de numéros, réordonner, enregistrer. Un
// enregistrement réécrit le document `devoirs/{coursId}` d'un bloc, et les
// étudiants le voient aussitôt.
//
// Cette page n'est qu'une interface. La barrière est dans firestore.rules :
// seul l'uid administrateur peut écrire, et une version périmée est refusée.
//
// ─── Le brouillon ───────────────────────────────────────────────────────
// Tant qu'on n'a rien modifié, la page montre le document en direct. La
// première modification crée un brouillon, qui retient la version sur
// laquelle il s'appuie. Si une version plus récente arrive pendant ce
// temps (enregistrement fait dans un autre onglet), on le signale au lieu
// d'écraser l'une ou l'autre.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Mathematiques from "../components/practice/Mathematiques";
import { useAuth } from "../firebase/useAuth";
import { chargerFirebase, MESSAGE_NON_CONFIGURE } from "../firebase/config";
import { useExercicesComplets } from "../banque/useExercicesComplets";
import { LIB_DIFFICULTE, LIB_TYPE, enonce, type Exercice } from "../data/banque-types";
import {
  MAX_SEMAINES,
  UID_ADMINISTRATEUR,
  analyserListe,
  formaterDateDevoir,
  idsInconnus,
  trierParNumero,
  verifierSemaines,
  type Semaine,
} from "../devoirs/regles";
import { ConflitVersion, enregistrerDevoirs } from "../devoirs/store";
import { COURS_AVEC_DEVOIRS, type CoursDevoirs } from "../devoirs/cours";
import { useDevoirs } from "../devoirs/useDevoirs";
import { usePagePrivee } from "../devoirs/usePagePrivee";

/** Le brouillon : les semaines, la version dont il part, et s'il diffère. */
type Brouillon = { semaines: Semaine[]; version: number; modifie: boolean };

const champ =
  "mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500";
const boutonSecondaire =
  "inline-flex items-center justify-center rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50";
const boutonIcone =
  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30";

function nouvelId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function deplacer<T>(liste: T[], i: number, decalage: number): T[] {
  const j = i + decalage;
  if (j < 0 || j >= liste.length) return liste;
  const copie = [...liste];
  [copie[i], copie[j]] = [copie[j], copie[i]];
  return copie;
}

function Message({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-balance text-3xl font-bold sm:text-4xl">{titre}</h1>
        {children && <div className="mt-4 text-base text-ink-600">{children}</div>}
      </div>
    </div>
  );
}

export default function EditionDevoirs() {
  const { coursId = "" } = useParams();
  const cours = COURS_AVEC_DEVOIRS[coursId] ?? null;
  usePagePrivee(cours ? `Modifier les devoirs — ${cours.nom}` : "Modifier les devoirs");

  const { utilisateur, chargement, disponible } = useAuth();
  const uid = utilisateur?.uid ?? null;
  const estAdmin = uid !== null && uid === UID_ADMINISTRATEUR;
  const { devoirs, erreur } = useDevoirs(coursId, uid, cours !== null && estAdmin);

  // Le contenu des exercices, pour montrer un énoncé avant de le choisir :
  // toute la banque si ce compte a un accès au cours, la vitrine sinon.
  const banque = useExercicesComplets(coursId);
  const contenus = useMemo(
    () => new Map(banque.exercices.map((e) => [e.id, e])),
    [banque.exercices],
  );

  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  // Ce qu'on affiche : le brouillon s'il porte des modifications ou s'il est
  // au moins aussi récent que le document lu ; le document sinon.
  const actuel: Brouillon | null =
    brouillon && (brouillon.modifie || !devoirs || devoirs.version <= brouillon.version)
      ? brouillon
      : devoirs
        ? { semaines: devoirs.semaines, version: devoirs.version, modifie: false }
        : null;
  const modifie = actuel?.modifie ?? false;
  const conflit = modifie && devoirs !== null && actuel !== null && devoirs.version > actuel.version;

  // Quitter l'onglet avec des changements non enregistrés : le navigateur
  // demande confirmation.
  useEffect(() => {
    if (!modifie) return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [modifie]);

  if (!cours) return <Message titre="Page introuvable" />;
  if (!disponible) return <Message titre="Modifier les devoirs">{MESSAGE_NON_CONFIGURE}</Message>;
  if (chargement) return <Message titre="Modifier les devoirs">Un instant…</Message>;
  if (!utilisateur) {
    return <Navigate to="/connexion" state={{ retour: `/devoirs/${coursId}/edition` }} replace />;
  }
  if (!estAdmin) {
    return (
      <Message titre="Modifier les devoirs">
        Cette page est réservée à l'administrateur du site.
      </Message>
    );
  }

  const semaines = actuel?.semaines ?? [];
  const { avertissements } = verifierSemaines(semaines, cours.index);

  function modifier(transformer: (s: Semaine[]) => Semaine[]) {
    if (!actuel) return;
    setMessage(null);
    setBrouillon({ semaines: transformer(actuel.semaines), version: actuel.version, modifie: true });
  }

  function abandonner() {
    if (modifie && !window.confirm("Abandonner tes changements non enregistrés ?")) return;
    setBrouillon(null);
    setMessage(null);
  }

  async function enregistrer() {
    if (!actuel || !cours) return;
    const { bloquants } = verifierSemaines(actuel.semaines, cours.index);
    if (bloquants.length > 0) {
      setMessage({ ok: false, texte: bloquants.join(" ") });
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      const services = await chargerFirebase();
      if (!services) throw new Error(MESSAGE_NON_CONFIGURE);
      const version = await enregistrerDevoirs(services.db, coursId, actuel.semaines, actuel.version);
      setBrouillon({ semaines: actuel.semaines, version, modifie: false });
      const heure = new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
      setMessage({ ok: true, texte: `Enregistré à ${heure} (version ${version}). Les étudiants le voient déjà.` });
    } catch (err) {
      if (err instanceof ConflitVersion) {
        setMessage({
          ok: false,
          texte:
            `Une version plus récente (${err.versionEnPlace}) a été enregistrée ailleurs, ` +
            "sans doute dans un autre onglet. Rien n'a été écrasé. Charge la version " +
            "enregistrée pour continuer ; tes changements non enregistrés seront perdus.",
        });
      } else {
        const code = (err as { code?: string })?.code ?? String(err);
        console.warn(`[devoirs] enregistrement refusé (${code})`);
        setMessage({ ok: false, texte: `Enregistrement refusé (${code}). Rien n'a été modifié.` });
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Modifier les devoirs
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold sm:text-4xl">{cours.nom}</h1>
        <p className="mt-3 text-sm text-ink-600">
          {devoirs === null
            ? "Chargement…"
            : devoirs.version === 0
              ? "Aucun devoir enregistré pour l'instant."
              : `Version enregistrée : ${devoirs.version}.`}{" "}
          <Link to={`/devoirs/${coursId}`} className="font-semibold text-brand-700">
            Voir la page des étudiants
          </Link>
        </p>

        {erreur && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Lecture refusée ({erreur}). Vérifie que tu es connecté avec le compte administrateur.
          </p>
        )}

        {conflit && (
          <div role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Une version plus récente ({devoirs?.version}) a été enregistrée ailleurs pendant que
            tu modifiais celle-ci ({actuel?.version}).
            <button type="button" onClick={abandonner} className="ml-2 font-semibold underline">
              Charger la version enregistrée
            </button>
          </div>
        )}

        {avertissements.length > 0 && (
          <ul className="mt-6 space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}

        {actuel && (
          <>
            <div className="mt-8 space-y-5">
              {semaines.map((s, i) => (
                <EditeurSemaine
                  key={s.id}
                  semaine={s}
                  rang={i}
                  total={semaines.length}
                  cours={cours}
                  contenus={contenus}
                  changer={(nouvelle) =>
                    modifier((liste) => liste.map((x, j) => (j === i ? nouvelle : x)))
                  }
                  monter={() => modifier((liste) => deplacer(liste, i, -1))}
                  descendre={() => modifier((liste) => deplacer(liste, i, 1))}
                  retirer={() => {
                    const nom = s.titre.trim() || `la semaine ${i + 1}`;
                    const n = s.exercices.length;
                    if (!window.confirm(`Retirer « ${nom} » et ses ${n} exercice${n > 1 ? "s" : ""} ?`)) return;
                    modifier((liste) => liste.filter((_, j) => j !== i));
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={semaines.length >= MAX_SEMAINES}
              onClick={() =>
                modifier((liste) => [
                  ...liste,
                  { id: nouvelId(), titre: "", date: null, note: "", exercices: [] },
                ])
              }
              className={`mt-5 ${boutonSecondaire}`}
            >
              + Ajouter une semaine
            </button>
          </>
        )}

        {/* La barre d'enregistrement reste visible en bas de l'écran. */}
        <div className="sticky bottom-0 z-10 mt-8 border-t border-brand-100 bg-white/95 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={enregistrer}
              disabled={!modifie || enCours || conflit}
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
            {modifie && (
              <button type="button" onClick={abandonner} disabled={enCours} className={boutonSecondaire}>
                Annuler mes changements
              </button>
            )}
            <span className="text-sm text-ink-600">
              {modifie ? "Changements non enregistrés." : !message ? "Tout est enregistré." : ""}
            </span>
          </div>
          {message && (
            <p
              role={message.ok ? "status" : "alert"}
              className={`mt-2 text-sm ${message.ok ? "text-accent-600" : "text-red-700"}`}
            >
              {message.texte}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Une semaine
// ---------------------------------------------------------------------------

function EditeurSemaine({
  semaine,
  rang,
  total,
  cours,
  contenus,
  changer,
  monter,
  descendre,
  retirer,
}: {
  semaine: Semaine;
  rang: number;
  total: number;
  cours: CoursDevoirs;
  contenus: Map<string, Exercice>;
  changer: (s: Semaine) => void;
  monter: () => void;
  descendre: () => void;
  retirer: () => void;
}) {
  const [outil, setOutil] = useState<"choisir" | "coller" | null>(null);
  const date = formaterDateDevoir(semaine.date);
  const inconnus = new Set(idsInconnus(semaine.exercices, cours.index));
  // Le chapitre proposé par défaut : celui du dernier exercice de la semaine.
  const dernier = [...semaine.exercices].reverse().find((id) => cours.index.has(id));
  const chapitreParDefaut = dernier ? cours.index.get(dernier)!.chapitre : cours.fiches[0]?.chapitre ?? 1;
  const exos = semaine.exercices;
  const changerExos = (exercices: string[]) => changer({ ...semaine, exercices });

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <label className="block text-sm font-medium text-ink-700">
            Titre
            <input
              value={semaine.titre}
              onChange={(e) => changer({ ...semaine, titre: e.target.value })}
              placeholder="Cours du lundi 24 août, Semaine 3…"
              className={champ}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[13rem_1fr]">
            <label className="block text-sm font-medium text-ink-700">
              Date <span className="font-normal text-ink-600">(facultative)</span>
              <input
                type="date"
                value={semaine.date ?? ""}
                onChange={(e) => changer({ ...semaine, date: e.target.value || null })}
                className={champ}
              />
              {date && <span className="mt-1 block text-xs font-normal text-ink-600">{date}</span>}
            </label>
            <label className="block text-sm font-medium text-ink-700">
              Note <span className="font-normal text-ink-600">(facultative)</span>
              <textarea
                rows={2}
                value={semaine.note}
                onChange={(e) => changer({ ...semaine, note: e.target.value })}
                className={champ}
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 pt-6">
          <button type="button" onClick={monter} disabled={rang === 0} aria-label="Monter la semaine" className={boutonIcone}>
            ↑
          </button>
          <button type="button" onClick={descendre} disabled={rang === total - 1} aria-label="Descendre la semaine" className={boutonIcone}>
            ↓
          </button>
          <button type="button" onClick={retirer} aria-label="Retirer la semaine" className={`${boutonIcone} hover:text-red-700`}>
            ✕
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-ink-700">
          Exercices <span className="font-normal text-ink-600">({exos.length})</span>
        </p>
        {exos.length === 0 ? (
          <p className="mt-1 text-sm text-ink-600">Aucun exercice pour l'instant.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {exos.map((id, i) => {
              const r = cours.index.get(id);
              return (
                <li
                  key={id}
                  className={`inline-flex items-center gap-0.5 rounded-full border py-0.5 pl-3 pr-1 text-sm ${
                    inconnus.has(id) ? "border-red-300 bg-red-50 text-red-800" : "border-brand-200 text-brand-800"
                  }`}
                >
                  {r ? (
                    <span>
                      <span className="text-xs text-ink-600">ch. {r.chapitre}</span>{" "}
                      <span className="font-semibold">n° {r.numero}</span>{" "}
                      <span className="text-xs text-ink-600">§{r.section}</span>
                    </span>
                  ) : (
                    <span title="Absent du catalogue : caché aux étudiants">{id} (retiré)</span>
                  )}
                  <button type="button" onClick={() => changerExos(deplacer(exos, i, -1))} disabled={i === 0} aria-label="Avancer" className={boutonIcone}>
                    ←
                  </button>
                  <button type="button" onClick={() => changerExos(deplacer(exos, i, 1))} disabled={i === exos.length - 1} aria-label="Reculer" className={boutonIcone}>
                    →
                  </button>
                  <button type="button" onClick={() => changerExos(exos.filter((x) => x !== id))} aria-label="Retirer l'exercice" className={`${boutonIcone} hover:text-red-700`}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOutil(outil === "choisir" ? null : "choisir")}
          aria-expanded={outil === "choisir"}
          className={boutonSecondaire}
        >
          Choisir des exercices
        </button>
        <button
          type="button"
          onClick={() => setOutil(outil === "coller" ? null : "coller")}
          aria-expanded={outil === "coller"}
          className={boutonSecondaire}
        >
          Coller une liste
        </button>
        <button
          type="button"
          onClick={() => changerExos(trierParNumero(exos, cours.index))}
          disabled={exos.length < 2}
          className={boutonSecondaire}
        >
          Trier par numéro
        </button>
      </div>

      {outil === "choisir" && (
        <SelecteurExercices
          cours={cours}
          contenus={contenus}
          choisis={exos}
          chapitreInitial={chapitreParDefaut}
          basculer={(id) =>
            changerExos(exos.includes(id) ? exos.filter((x) => x !== id) : [...exos, id])
          }
        />
      )}
      {outil === "coller" && (
        <CollerListe
          cours={cours}
          semaine={semaine}
          chapitreInitial={chapitreParDefaut}
          ajouter={(titre, ids) => {
            changer({
              ...semaine,
              titre: semaine.titre.trim() ? semaine.titre : (titre ?? semaine.titre),
              exercices: [...exos, ...ids.filter((id) => !exos.includes(id))],
            });
          }}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
//  Choisir par chapitre et section
// ---------------------------------------------------------------------------

function SelecteurExercices({
  cours,
  contenus,
  choisis,
  chapitreInitial,
  basculer,
}: {
  cours: CoursDevoirs;
  contenus: Map<string, Exercice>;
  choisis: string[];
  chapitreInitial: number;
  basculer: (id: string) => void;
}) {
  const [chapitre, setChapitre] = useState(chapitreInitial);
  const [section, setSection] = useState("");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());

  const chapitres = [...new Set(cours.fiches.map((f) => f.chapitre))];
  const duChapitre = cours.fiches.filter((f) => f.chapitre === chapitre);
  const sections = [...new Set(duChapitre.map((f) => f.section))].sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true }),
  );
  const lignes = duChapitre.filter((f) => !section || f.section === section);
  const choisisSet = new Set(choisis);

  return (
    <div className="mt-4 rounded-xl bg-brand-50/50 p-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-medium text-ink-700">
          Chapitre
          <select
            value={chapitre}
            onChange={(e) => {
              setChapitre(Number(e.target.value));
              setSection("");
            }}
            className={champ}
          >
            {chapitres.map((c) => (
              <option key={c} value={c}>
                Chapitre {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-ink-700">
          Section
          <select value={section} onChange={(e) => setSection(e.target.value)} className={champ}>
            <option value="">Toutes ({duChapitre.length})</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                §{s} ({duChapitre.filter((f) => f.section === s).length})
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-3 max-h-[28rem] divide-y divide-brand-100 overflow-y-auto rounded-lg border border-brand-100 bg-white">
        {lignes.map((f) => {
          const r = cours.index.get(f.id)!;
          const ex = contenus.get(f.id);
          const ouvert = ouverts.has(f.id);
          return (
            <li key={f.id} className="px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={choisisSet.has(f.id)} onChange={() => basculer(f.id)} />
                  <span className="font-semibold text-brand-900">n° {r.numero}</span>
                  <span className="text-xs text-ink-600">§{f.section}</span>
                  <span className="text-xs text-ink-600">{LIB_TYPE[f.type]}</span>
                  <span className="text-xs text-ink-600">{LIB_DIFFICULTE[f.difficulte]}</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setOuverts((o) => {
                      const n = new Set(o);
                      if (n.has(f.id)) n.delete(f.id);
                      else n.add(f.id);
                      return n;
                    })
                  }
                  aria-expanded={ouvert}
                  className="text-xs font-semibold text-brand-700"
                >
                  {ouvert ? "Cacher l'énoncé" : "Énoncé"}
                </button>
              </div>
              {ouvert && (
                <div className="mt-2 rounded-lg bg-brand-50/60 p-3 text-[14px] leading-relaxed text-ink-900">
                  {ex ? (
                    <Mathematiques source={enonce(ex)} html />
                  ) : (
                    <span className="text-ink-600">
                      Énoncé non disponible : ce compte n'a pas d'accès au cours.
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Coller une liste de numéros
// ---------------------------------------------------------------------------

function CollerListe({
  cours,
  semaine,
  chapitreInitial,
  ajouter,
}: {
  cours: CoursDevoirs;
  semaine: Semaine;
  chapitreInitial: number;
  ajouter: (titre: string | null, ids: string[]) => void;
}) {
  const [chapitre, setChapitre] = useState(chapitreInitial);
  const [texte, setTexte] = useState("");
  const chapitres = [...new Set(cours.fiches.map((f) => f.chapitre))];
  const r = texte.trim() ? analyserListe(texte, chapitre, cours.index) : null;
  const nouveaux = r ? r.ids.filter((id) => !semaine.exercices.includes(id)) : [];
  const dejaLa = r ? r.ids.length - nouveaux.length : 0;
  const titreRepris = r?.titre && !semaine.titre.trim() ? r.titre : null;

  return (
    <div className="mt-4 rounded-xl bg-brand-50/50 p-4">
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <label className="text-sm font-medium text-ink-700">
          Chapitre
          <select value={chapitre} onChange={(e) => setChapitre(Number(e.target.value))} className={champ}>
            {chapitres.map((c) => (
              <option key={c} value={c}>
                Chapitre {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-ink-700">
          Numéros du cahier
          <textarea
            rows={2}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Cours du lundi 24 août : 26, 29, 31, 50 à 54 et 57"
            className={champ}
          />
        </label>
      </div>

      {r && (
        <div className="mt-3 space-y-2 text-sm">
          {r.ids.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {r.ids.map((id) => {
                const rep = cours.index.get(id)!;
                return (
                  <li
                    key={id}
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      semaine.exercices.includes(id) ? "bg-ink-600/10 text-ink-600" : "bg-white text-brand-800"
                    }`}
                  >
                    n° {rep.numero} · {id} · §{rep.section}
                  </li>
                );
              })}
            </ul>
          )}
          {titreRepris && <p className="text-ink-700">Titre repris : « {titreRepris} ».</p>}
          {dejaLa > 0 && <p className="text-ink-600">{dejaLa} déjà dans cette semaine (en gris).</p>}
          {r.horsChapitre.length > 0 && (
            <p className="text-red-700">
              Aucun exercice n° {r.horsChapitre.join(", ")} au chapitre {chapitre}.
            </p>
          )}
          {r.illisibles.length > 0 && (
            <p className="text-red-700">Non compris : {r.illisibles.map((m) => `« ${m} »`).join(", ")}.</p>
          )}
          <button
            type="button"
            disabled={nouveaux.length === 0 && !titreRepris}
            onClick={() => {
              ajouter(r.titre, nouveaux);
              setTexte("");
            }}
            className={boutonSecondaire}
          >
            Ajouter {nouveaux.length} exercice{nouveaux.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

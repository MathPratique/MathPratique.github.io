// QCM interactif de la vitrine Calcul différentiel.
//
// L'étudiant clique une option, puis voit si c'est juste ET l'explication
// spécifique de son choix (pas seulement la bonne réponse). C'est ce qui
// distingue un vrai QCM pédagogique d'un test de reconnaissance : on
// apprend AUSSI en essayant une mauvaise piste et en comprenant pourquoi.
//
// ─── Sécurité — la bonne réponse n'est PAS dans le DOM initial ───
//
// `analyseChoix` (qui contient `correct` et `explication`) est passé en
// prop mais ne s'écrit dans le HTML qu'APRÈS le clic. Un `View Source`
// avant tout choix ne montre que les libellés a/b/c/d.
//
// Aucun ordre significatif : les options sont rendues dans l'ordre du
// JSON (celui écrit par l'auteur — a, b, c, d), sans classe CSS qui
// distingue la bonne réponse tant qu'aucun choix n'est fait.

import { useState } from "react";
import Mathematiques from "./Mathematiques";
import type { AnalyseChoix, Choix } from "../../data/calcul-differentiel";

type Props = {
  choix: Choix[];
  analyseChoix?: AnalyseChoix[];
};

export default function QcmInteractif({ choix, analyseChoix }: Props) {
  const [choisi, setChoisi] = useState<string | null>(null);

  const analyseParCle = new Map((analyseChoix ?? []).map((a) => [a.cle, a]));
  const analyseChoisie = choisi ? analyseParCle.get(choisi) : undefined;

  return (
    <div className="mt-4">
      <ul className="space-y-2" role="radiogroup" aria-label="Choix de réponse">
        {choix.map((c) => {
          const selectionne = choisi === c.cle;
          const analyse = analyseParCle.get(c.cle);
          // Style qui trahit la bonne réponse SEULEMENT après un choix.
          // Avant : toutes les options sont neutres, indiscernables.
          const styleAppris = !choisi
            ? "border-brand-200 bg-white hover:border-brand-400 hover:bg-brand-50"
            : analyse?.correct
              ? "border-emerald-400 bg-emerald-50"
              : selectionne
                ? "border-rose-400 bg-rose-50"
                : "border-brand-100 bg-brand-50/40 opacity-70";
          return (
            <li key={c.cle}>
              <button
                type="button"
                role="radio"
                aria-checked={selectionne}
                disabled={choisi !== null}
                onClick={() => setChoisi(c.cle)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-colors duration-200 ${styleAppris} ${
                  choisi === null ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 font-mono text-xs font-semibold text-brand-700">
                  {c.cle}
                </span>
                <span className="flex-1 leading-relaxed text-ink-900">
                  <Mathematiques source={c.texte} html />
                </span>
                {/* Coche/croix visibles seulement APRÈS un choix. */}
                {choisi && analyse?.correct && (
                  <span aria-hidden className="text-emerald-600">✓</span>
                )}
                {choisi && selectionne && !analyse?.correct && (
                  <span aria-hidden className="text-rose-600">✗</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {analyseChoisie && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            analyseChoisie.correct
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-semibold">
            {analyseChoisie.correct
              ? "Bonne réponse !"
              : `Mauvaise réponse. La bonne est ${bonneCle(analyseChoix)}.`}
          </p>
          {/* L'explication par choix n'existe pas partout : 64 des 83 QCM de
              prob-stat n'en ont pas. Le verdict et la bonne réponse suffisent
              alors — passer `undefined` à <Mathematiques> faisait tomber la
              page entière au premier clic. */}
          {analyseChoisie.explication && (
            <div className="mt-1.5 leading-relaxed">
              <Mathematiques source={analyseChoisie.explication} html />
            </div>
          )}
          <button
            type="button"
            onClick={() => setChoisi(null)}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 text-xs font-semibold transition-colors duration-200 hover:bg-current/10"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

/** Renvoie la clé de la bonne réponse pour l'afficher dans le feedback. */
function bonneCle(analyseChoix?: AnalyseChoix[]): string {
  return analyseChoix?.find((a) => a.correct)?.cle ?? "?";
}

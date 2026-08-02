import test from "node:test";
import assert from "node:assert/strict";
import {
  preparer,
  inlineEnHtml,
  residusLatex,
} from "../.tmp-test/components/practice/latex-vers-html.js";
import { decouper } from "../.tmp-test/components/practice/decouper-latex.js";

test("align* devient un bloc mathématique que KaTeX sait rendre", () => {
  const r = preparer("Donc \\begin{align*} a &= b \\\\ c &= d \\end{align*} voilà.");
  assert.ok(r.includes("\\[\\begin{aligned}"));
  assert.ok(r.includes("\\end{aligned}\\]"));
  // Et le découpage doit y voir UN segment mathématique en bloc.
  const s = decouper(r);
  const maths = s.filter((x) => x.math);
  assert.equal(maths.length, 1);
  assert.equal(maths[0].bloc, true);
  assert.ok(maths[0].texte.includes("a &= b"));
});

test("tabular devient un tableau HTML, en-tête compris", () => {
  const src =
    "\\begin{center}\\renewcommand{\\arraystretch}{1.3}\\begin{tabular}{c|cc}" +
    "$x$ & $0$ & $1$ \\\\ \\hline $f'$ & $+$ & $-$ \\\\" +
    "\\end{tabular}\\end{center}";
  const r = preparer(src);
  assert.ok(r.includes("<table>"), r);
  assert.ok(r.includes("<th>$x$</th>"), r);
  assert.ok(r.includes("<td>$f'$</td>"), r);
  assert.ok(r.includes('class="tableau-latex"'), "il faut un conteneur qui défile");
  assert.ok(!r.includes("\\begin{tabular}"));
  assert.ok(!r.includes("arraystretch"));
  assert.ok(!r.includes("\\hline"));
});

test("un tableau à sept colonnes garde ses sept cellules", () => {
  const cells = ["a", "b", "c", "d", "e", "f", "g"].join(" & ");
  const r = preparer(`\\begin{tabular}{ccccccc}${cells} \\\\ 1 & 2 & 3 & 4 & 5 & 6 & 7\\\\\\end{tabular}`);
  assert.equal((r.match(/<th>/g) ?? []).length, 7);
  assert.equal((r.match(/<td>/g) ?? []).length, 7);
});

test("itemize devient une liste", () => {
  const r = preparer("Il faut :\\begin{itemize}\\item que $f$ soit continue\\item que $g$ existe\\end{itemize}");
  assert.ok(r.includes("<ul"));
  assert.equal((r.match(/<li>/g) ?? []).length, 2);
  assert.ok(r.includes("que $f$ soit continue"));
});

test("le décor de présentation disparaît sans emporter le contenu", () => {
  const r = preparer("\\footnotesize\\centering Texte utile \\hline encore utile");
  assert.ok(r.includes("Texte utile"));
  assert.ok(r.includes("encore utile"));
  assert.deepEqual(residusLatex(r), []);
});

test("les commandes en ligne deviennent du HTML", () => {
  assert.equal(inlineEnHtml("\\textbf{Étape 1.}"), "<strong>Étape 1.</strong>");
  assert.equal(inlineEnHtml("\\emph{note}"), "<em>note</em>");
  assert.equal(inlineEnHtml("\\textit{note}"), "<em>note</em>");
});

test("l'exposant ordinal français devient un <sup>", () => {
  // `\up` vient de babel-french, pas du projet : il n'existe pas hors LaTeX.
  assert.equal(
    inlineEnHtml("la 1\\up{re} et la 3\\up{e} seconde"),
    "la 1<sup>re</sup> et la 3<sup>e</sup> seconde"
  );
  assert.deepEqual(residusLatex(inlineEnHtml("80 \\up{o}C")), []);
});

test("les espacements LaTeX ne restent pas visibles", () => {
  const r = inlineEnHtml("(a) réponse \\qquad (b) autre \\quad fin");
  assert.deepEqual(residusLatex(r), []);
  assert.ok(r.includes("(a) réponse"));
  assert.ok(r.includes("(b) autre"));
});

test("les sauts de ligne deviennent des <br>", () => {
  assert.equal(inlineEnHtml("a \\\\[0.3em] b"), "a <br> b");
  assert.equal(inlineEnHtml("a \\\\ b"), "a <br> b");
});

test("INVARIANT — inlineEnHtml n'est jamais appliqué à une formule", () => {
  // Garde-fou documentaire : si un jour on l'appliquait à du math, `\text`
  // et `\quad` seraient détruits. Ce test fige l'attente.
  const formule = "\\text{sur } [0,1] \\quad a";
  assert.notEqual(inlineEnHtml(formule), formule, "la transformation abîme bien une formule");
  // Le composant ne doit donc l'appeler que sur les segments non math.
});

test("une chaîne sans LaTeX traverse intacte", () => {
  const s = "Calcule la dérivée de la fonction au point donné.";
  assert.equal(preparer(s), s);
  assert.equal(inlineEnHtml(s), s);
});

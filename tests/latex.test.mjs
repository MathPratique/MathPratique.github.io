import test from "node:test";
import assert from "node:assert/strict";
import { decouper, texteSeul } from "../.tmp-test/components/practice/decouper-latex.js";

const m = (s) => s.filter((x) => x.math).map((x) => x.texte);
const t = (s) => s.filter((x) => !x.math).map((x) => x.texte);

test("du texte sans mathématiques reste un seul segment", () => {
  const s = decouper("Calcule la dérivée de la fonction.");
  assert.equal(s.length, 1);
  assert.equal(s[0].math, false);
});

test("une formule en ligne est isolée du texte qui l'entoure", () => {
  const s = decouper("Soit $f(x) = x^2$ une fonction.");
  assert.deepEqual(t(s), ["Soit ", " une fonction."]);
  assert.deepEqual(m(s), ["f(x) = x^2"]);
  assert.equal(s.find((x) => x.math).bloc, false);
});

test("les deux formes de bloc sont reconnues et marquées comme telles", () => {
  for (const src of ["Ainsi \\[ v(t) = 3t \\] donc.", "Ainsi $$ v(t) = 3t $$ donc."]) {
    const s = decouper(src);
    assert.deepEqual(m(s), ["v(t) = 3t"], src);
    assert.equal(s.find((x) => x.math).bloc, true, src);
  }
});

test("deux formules voisines ne fusionnent pas", () => {
  // Le piège classique : `$a$ et $b$` lu comme une seule formule « a et b ».
  const s = decouper("Compare $a$ et $b$ pour conclure.");
  assert.deepEqual(m(s), ["a", "b"]);
  assert.deepEqual(t(s), ["Compare ", " et ", " pour conclure."]);
});

test("$$ n'est pas lu comme deux $ vides", () => {
  const s = decouper("$$x^2$$ puis $y$");
  assert.deepEqual(m(s), ["x^2", "y"]);
  assert.equal(s[0].bloc, true);
  assert.equal(s.filter((x) => x.math)[1].bloc, false);
});

test("les décimales à la québécoise traversent intactes", () => {
  const s = decouper("La hauteur est $h = -4{,}9\\,t^{2} + 30t$.");
  assert.deepEqual(m(s), ["h = -4{,}9\\,t^{2} + 30t"]);
});

test("une formule multiligne en bloc est capturée en entier", () => {
  const s = decouper("Donc \\[\n  a = b \\\\\n  c = d\n\\] et voilà.");
  assert.equal(m(s).length, 1);
  assert.ok(m(s)[0].includes("a = b"));
  assert.ok(m(s)[0].includes("c = d"));
});

test("un délimiteur orphelin ne mange pas le reste du texte", () => {
  const s = decouper("Le coût est de 30 $ pour cet exercice.");
  // Aucun `$` fermant : tout doit rester du texte.
  assert.deepEqual(m(s), []);
  assert.equal(s.map((x) => x.texte).join(""), "Le coût est de 30 $ pour cet exercice.");
});

test("le texte est reconstituable à l'identique hors mathématiques", () => {
  const src = "Soit $f$ définie par \\[ f(x)=x \\] sur $\\R$.";
  const s = decouper(src);
  const reconstitue = s.map((x) => (x.math ? "" : x.texte)).join("");
  assert.equal(reconstitue, "Soit  définie par  sur .");
});

test("texteSeul retire les mathématiques et les balises", () => {
  const r = texteSeul("<strong>Calcule</strong> $f'(x)$ pour $f(x)=x^2$ au point donné.");
  assert.equal(r, "Calcule  pour  au point donné.".replace(/\s+/g, " "));
});

test("une chaîne vide ne casse rien", () => {
  assert.deepEqual(decouper(""), []);
  assert.equal(texteSeul(""), "");
});

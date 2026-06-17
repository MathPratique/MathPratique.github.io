import type { MatrixCell, RichContent, RichPart } from "../data/exercises";

// Compact rich-content builders shared by quiz generators.

export const t = (s: string): RichPart => ({ type: "text", content: s });
export const sub = (s: string): RichPart => ({ type: "sub", content: s });
export const sup = (s: string): RichPart => ({ type: "sup", content: s });
export const mat = (
  data: MatrixCell[][],
  label?: string
): RichPart => ({ type: "matrix", data, label });
export const bold = (content: RichContent): RichPart => ({ type: "bold", content });
export const frac = (num: RichContent, den: RichContent): RichPart => ({
  type: "frac",
  num,
  den,
});
export const vec = (content: RichContent): RichPart => ({ type: "vec", content });

// Convert a Mat (number[][]) directly to a MatrixCell[][]. We accept number
// cells in the renderer so this is a no-op cast — but having a single name
// keeps the generator code readable.
export function asCells(M: number[][]): MatrixCell[][] {
  return M as MatrixCell[][];
}

// String version (useful when cells embed unevaluated expressions)
export function asStringCells(M: number[][]): MatrixCell[][] {
  return M.map((row) => row.map((v) => String(v)));
}

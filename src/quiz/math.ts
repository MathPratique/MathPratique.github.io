// Matrix-math helpers used by quiz generators.
// Matrices are stored as number[][] (rows × cols).

import { nonZero, randInt } from "./rng";

export type Mat = number[][];

export const rows = (A: Mat): number => A.length;
export const cols = (A: Mat): number => A[0]?.length ?? 0;

export function newMat(r: number, c: number, fill = 0): Mat {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => fill));
}

export function randMat(r: number, c: number, lo = -4, hi = 5): Mat {
  return Array.from({ length: r }, () =>
    Array.from({ length: c }, () => randInt(lo, hi))
  );
}

export function add(A: Mat, B: Mat): Mat {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

export function sub(A: Mat, B: Mat): Mat {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

export function scale(k: number, A: Mat): Mat {
  return A.map((row) => row.map((v) => v * k));
}

export function transpose(A: Mat): Mat {
  const out: Mat = newMat(cols(A), rows(A));
  for (let i = 0; i < rows(A); i++) {
    for (let j = 0; j < cols(A); j++) {
      out[j][i] = A[i][j];
    }
  }
  return out;
}

export function mul(A: Mat, B: Mat): Mat {
  const r = rows(A);
  const c = cols(B);
  const inner = cols(A);
  const out = newMat(r, c);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      let s = 0;
      for (let k = 0; k < inner; k++) s += A[i][k] * B[k][j];
      out[i][j] = s;
    }
  }
  return out;
}

export function det2(A: Mat): number {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function det3(A: Mat): number {
  const [a, b, c] = A[0];
  const [d, e, f] = A[1];
  const [g, h, i] = A[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

// 2x2 inverse — returns null if singular
export function inv2(A: Mat): Mat | null {
  const d = det2(A);
  if (d === 0) return null;
  // 1/d * [d -b; -c a]
  return [
    [A[1][1] / d, -A[0][1] / d],
    [-A[1][0] / d, A[0][0] / d],
  ];
}

// Generate a random 2x2 matrix with non-zero determinant (always invertible).
// We bias the diagonal away from zero and keep entries small for nice output.
export function randInvertible2x2(): Mat {
  for (let attempt = 0; attempt < 50; attempt++) {
    const A: Mat = [
      [nonZero(-3, 3), randInt(-3, 3)],
      [randInt(-3, 3), nonZero(-3, 3)],
    ];
    if (det2(A) !== 0) return A;
  }
  return [[1, 0], [0, 1]];
}

// 3x3 invertible — try a few random matrices until we find a non-singular one
export function randInvertible3x3(): Mat {
  for (let attempt = 0; attempt < 80; attempt++) {
    const A = randMat(3, 3, -2, 3);
    if (det3(A) !== 0) return A;
  }
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

// Format a number with sign for inline math text (e.g. "+ 3", "- 2").
// First-term style: pass leading=true to suppress a leading "+" sign.
export function fmtSigned(n: number, leading = false): string {
  if (leading) return n < 0 ? `-${Math.abs(n)}` : `${n}`;
  if (n < 0) return ` - ${Math.abs(n)}`;
  return ` + ${n}`;
}

// Cofactor of A at (i, j) (1-indexed in math, but here 0-indexed)
export function cofactor3(A: Mat, i: number, j: number): number {
  const minor: number[][] = [];
  for (let r = 0; r < 3; r++) {
    if (r === i) continue;
    const row: number[] = [];
    for (let c = 0; c < 3; c++) {
      if (c === j) continue;
      row.push(A[r][c]);
    }
    minor.push(row);
  }
  const m = minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0];
  return ((i + j) % 2 === 0 ? 1 : -1) * m;
}

export function cofactorMatrix3(A: Mat): Mat {
  const out = newMat(3, 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i][j] = cofactor3(A, i, j);
    }
  }
  return out;
}

// Format a fraction n/d using Math symbols (returns the simplified pair).
export function simplifyFrac(n: number, d: number): [number, number] {
  if (d === 0) return [n, d];
  const g = gcd(Math.abs(n), Math.abs(d));
  let nn = n / g;
  let dd = d / g;
  if (dd < 0) {
    nn = -nn;
    dd = -dd;
  }
  return [nn, dd];
}

function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

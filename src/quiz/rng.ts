// Tiny RNG helpers for quiz generators. We use Math.random for simplicity —
// re-rolling the quiz simply means re-rendering with fresh randomness.

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function nonZero(min: number, max: number): number {
  let v = randInt(min, max);
  if (v === 0) v = randInt(1, max);
  return v;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

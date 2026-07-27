import { Fragment } from "react";
import Matrix from "./Matrix";
import type {
  RichContent as RichContentValue,
  RichPart,
} from "../../data/exercises";

type RichContentProps = {
  content: RichContentValue;
  // Internal: disable list detection when rendering nested content
  // (list items, sub/sup/frac children, etc.). Enumeration detection
  // is only meaningful at the top level of an exercise prompt or step.
  allowList?: boolean;
};

export default function RichContent({ content, allowList = true }: RichContentProps) {
  if (typeof content === "string") {
    const parts = preprocessString(content, allowList);
    return (
      <>
        {parts.map((part, i) => (
          <Fragment key={i}>{renderPart(part)}</Fragment>
        ))}
      </>
    );
  }
  return (
    <>
      {content.map((part, i) => (
        <Fragment key={i}>{renderPart(part)}</Fragment>
      ))}
    </>
  );
}

function renderPart(part: RichPart) {
  switch (part.type) {
    case "text": {
      // Text parts also get diacritics preprocessing but no list detection
      // (lists are only meaningful at the top level of a string content).
      const inner = preprocessString(part.content, false);
      if (inner.length === 1 && inner[0].type === "text") {
        return <span className="whitespace-pre-line">{inner[0].content}</span>;
      }
      return (
        <>
          {inner.map((p, i) => (
            <Fragment key={i}>{renderPart(p)}</Fragment>
          ))}
        </>
      );
    }
    case "sub":
      return (
        <sub className="align-sub text-[0.78em] tracking-tight">
          <RichContent content={part.content} allowList={false} />
        </sub>
      );
    case "sup":
      return (
        <sup className="align-super text-[0.78em] tracking-tight">
          <RichContent content={part.content} allowList={false} />
        </sup>
      );
    case "matrix":
      return <Matrix data={part.data} label={part.label} inline />;
    case "cases":
      return <Cases rows={part.rows} />;
    case "frac":
      return <Frac num={part.num} den={part.den} />;
    case "bold":
      return (
        <strong className="font-semibold text-brand-900">
          <RichContent content={part.content} allowList={false} />
        </strong>
      );
    case "vec":
      return <Vec content={part.content} />;
    case "bar":
      return <Bar content={part.content} />;
    case "hat":
      return <Hat content={part.content} />;
    case "list":
      return <ListBlock intro={part.intro} items={part.items} trailing={part.trailing} />;
  }
}

// ══════════════════════════════════════════════════════════════════
// Overline / circumflex components — positioned in CSS so the mark
// stays horizontal and centered regardless of the underlying font's
// combining-mark support. Same pattern as Vec.
// ══════════════════════════════════════════════════════════════════

function Bar({ content }: { content: RichContentValue }) {
  return (
    <span className="relative inline-block px-px align-baseline leading-none">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-0.5 left-[6%] right-[6%] border-t border-current"
      />
      <span className="inline-block">
        <RichContent content={content} allowList={false} />
      </span>
    </span>
  );
}

function Hat({ content }: { content: RichContentValue }) {
  return (
    <span className="relative inline-block px-px align-baseline leading-none">
      <span
        aria-hidden="true"
        className="absolute -top-[0.55em] left-0 right-0 text-center text-[0.75em] leading-none text-current"
      >
        ˆ
      </span>
      <span className="inline-block">
        <RichContent content={content} allowList={false} />
      </span>
    </span>
  );
}

function Vec({ content }: { content: RichContentValue }) {
  return (
    <span className="relative inline-block px-px align-baseline leading-none">
      <span
        aria-hidden="true"
        className="absolute -top-1.5 left-0 right-0 text-center text-[0.65em] leading-none text-current"
      >
        →
      </span>
      <span className="inline-block">
        <RichContent content={content} allowList={false} />
      </span>
    </span>
  );
}

function Frac({
  num,
  den,
}: {
  num: RichContentValue;
  den: RichContentValue;
}) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.9em] leading-tight">
      <span className="block border-b border-current px-1 pb-0.5">
        <RichContent content={num} allowList={false} />
      </span>
      <span className="block px-1 pt-0.5">
        <RichContent content={den} allowList={false} />
      </span>
    </span>
  );
}

function bracePiece(i: number, total: number): string {
  if (total === 1) return "{";
  if (i === 0) return "⎧";
  if (i === total - 1) return "⎩";
  if (i === Math.floor(total / 2)) return "⎨";
  return "⎪";
}

function Cases({ rows }: { rows: RichContentValue[] }) {
  const ariaLabel = `Système de ${rows.length} équations`;
  return (
    <span
      className="mx-1 my-1 inline-flex items-stretch gap-2 align-middle"
      role="img"
      aria-label={ariaLabel}
    >
      <span
        aria-hidden="true"
        className="inline-flex flex-col items-center justify-between font-mono text-lg leading-none text-brand-800"
      >
        {rows.map((_, i) => (
          <span key={i} className="block">
            {bracePiece(i, rows.length)}
          </span>
        ))}
      </span>
      <span className="inline-flex flex-col gap-1">
        {rows.map((row, i) => (
          <span key={i} className="block">
            <RichContent content={row} allowList={false} />
          </span>
        ))}
      </span>
    </span>
  );
}

function ListBlock({
  intro,
  items,
  trailing,
}: {
  intro?: RichContentValue;
  items: RichContentValue[];
  trailing?: RichContentValue;
}) {
  const hasIntro = intro !== undefined && intro !== "";
  const hasTrailing = trailing !== undefined && trailing !== "";
  return (
    <>
      {hasIntro && (
        <span className="block">
          <RichContent content={intro} allowList={false} />
        </span>
      )}
      <ul className="my-2 ml-2 list-none space-y-1">
        {items.map((it, i) => (
          <li key={i} className="pl-1">
            <RichContent content={it} allowList={false} />
          </li>
        ))}
      </ul>
      {hasTrailing && (
        <span className="block">
          <RichContent content={trailing} allowList={false} />
        </span>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// Preprocessing: transform raw strings into RichPart[]
//   - detect enumerations (letter-labeled or bracket-interval)
//   - convert combining diacritics (macron U+0304, circumflex U+0302)
//     and precomposed macron letters into <Bar>/<Hat>
// ══════════════════════════════════════════════════════════════════

function preprocessString(s: string, allowList: boolean): RichPart[] {
  if (allowList) {
    const list = detectList(s);
    if (list) return [list];
  }
  return transformDiacritics(s);
}

// ---------- Diacritics ----------

// Precomposed math-notation letters. Only include letters whose precomposed
// form has no plausible linguistic use in French — so â/ê/î/ô/û (linguistic
// circumflex) and ā/ē/ī/ō/ū (macron, used in Māori/Latin transliterations)
// are deliberately excluded to avoid false positives on real words.
const PRECOMPOSED_BAR: Record<string, string> = {
  "Ȳ": "Y",
  "ȳ": "y",
};
const PRECOMPOSED_HAT: Record<string, string> = {
  "Ŷ": "Y",
  "ŷ": "y",
};

function transformDiacritics(s: string): RichPart[] {
  const parts: RichPart[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      parts.push({ type: "text", content: buf });
      buf = "";
    }
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = i + 1 < s.length ? s[i + 1] : "";
    if (PRECOMPOSED_BAR[c]) {
      flush();
      parts.push({ type: "bar", content: PRECOMPOSED_BAR[c] });
      continue;
    }
    if (PRECOMPOSED_HAT[c]) {
      flush();
      parts.push({ type: "hat", content: PRECOMPOSED_HAT[c] });
      continue;
    }
    if (next === "̄") {
      flush();
      parts.push({ type: "bar", content: c });
      i++;
      continue;
    }
    if (next === "̂") {
      flush();
      parts.push({ type: "hat", content: c });
      i++;
      continue;
    }
    buf += c;
  }
  flush();
  return parts;
}

// ---------- Enumeration detection ----------

type ListPart = { type: "list"; intro?: string; items: string[]; trailing?: string };

function detectList(s: string): ListPart | null {
  const letterList = detectLetterLabeledList(s);
  if (letterList) return letterList;
  const dataList = detectBracketIntervalList(s);
  if (dataList) return dataList;
  return null;
}

// Compute bracket depth at each character index. `(` and `[` increase depth,
// `)` and `]` decrease it. Used to identify "top-level" separators.
function computeDepths(s: string): number[] {
  const depths = new Array<number>(s.length);
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    depths[i] = depth;
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
  }
  return depths;
}

function splitAtTopLevel(s: string, sep: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (c === sep && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

function detectLetterLabeledList(s: string): ListPart | null {
  // Match "(a)", "(b)", ... at TOP LEVEL only (not inside another parenthesis
  // group like "(un chiffre) (a)" — extremely rare, but guard anyway).
  const depths = computeDepths(s);
  const markerRe = /\(([a-z])\)/g;
  const markers: { letter: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(s)) !== null) {
    if (depths[m.index] === 0) markers.push({ letter: m[1], index: m.index });
  }
  // Need at least (a) and (b), in the right order at the start of the sequence
  if (markers.length < 2) return null;
  if (markers[0].letter !== "a" || markers[1].letter !== "b") return null;

  const intro = s.slice(0, markers[0].index).trimEnd();

  const items: string[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : s.length;
    let item = s.slice(start, end).trim();
    // Remove trailing "; " that separated it from the next item
    item = item.replace(/\s*;\s*$/, "");
    items.push(item);
  }

  // Trailing text after the last item: strip a trailing "." from the last item
  // if it's just the sentence-ending period. If there's more after, extract it.
  const lastItem = items[items.length - 1];
  const trailingMatch = lastItem.match(/^(.+?[^\s\.])\.\s+([A-ZÀ-ÿ][\s\S]+)$/);
  let trailing: string | undefined;
  if (trailingMatch) {
    items[items.length - 1] = trailingMatch[1].trim();
    trailing = trailingMatch[2].trim();
  }

  return { type: "list", intro: intro || undefined, items, trailing };
}

function detectBracketIntervalList(s: string): ListPart | null {
  // Top-level segments separated by ";"
  const chunks = splitAtTopLevel(s, ";").map((c) => c.trim());
  if (chunks.length < 3) return null;

  // Middle chunks must all match the bracket-interval item shape:
  //   starts with "[" or "(", ends with a value after ":"
  const itemShape = /^[\[(][^\]\)]+[\]\)]\s*:\s*\S/;
  for (let i = 1; i < chunks.length - 1; i++) {
    if (!itemShape.test(chunks[i])) return null;
  }

  // First chunk: "<intro> : <first-item>"
  // Split at the first top-level ": " that is directly followed by "[" or "("
  const first = chunks[0];
  const firstDepths = computeDepths(first);
  let splitIdx = -1;
  for (let i = 0; i < first.length - 2; i++) {
    if (
      firstDepths[i] === 0 &&
      first[i] === ":" &&
      /\s/.test(first[i + 1]) &&
      /[\[(]/.test(first[i + 2].trim() ? first[i + 2] : first[i + 3] ?? "")
    ) {
      // Look ahead past whitespace for "["
      let j = i + 1;
      while (j < first.length && /\s/.test(first[j])) j++;
      if (j < first.length && (first[j] === "[" || first[j] === "(")) {
        splitIdx = i;
        break;
      }
    }
  }
  if (splitIdx === -1) return null;
  const intro = first.slice(0, splitIdx + 1).trim(); // includes the ":"
  const firstItem = first.slice(splitIdx + 1).trim();
  if (!itemShape.test(firstItem)) return null;

  // Last chunk: <last-item> [. <trailing>]
  const last = chunks[chunks.length - 1];
  const lastMatch = last.match(
    /^([\[(][^\]\)]+[\]\)]\s*:\s*[^\s.][^.]*?)(?:\.\s+([\s\S]+))?$/,
  );
  if (!lastMatch) return null;
  const lastItem = lastMatch[1].trim();
  const trailing = lastMatch[2] ? lastMatch[2].trim() : undefined;

  const items = [firstItem, ...chunks.slice(1, -1), lastItem];
  return { type: "list", intro, items, trailing };
}

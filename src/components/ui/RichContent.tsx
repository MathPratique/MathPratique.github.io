import { Fragment } from "react";
import Matrix from "./Matrix";
import type {
  RichContent as RichContentValue,
  RichPart,
} from "../../data/exercises";

type RichContentProps = {
  content: RichContentValue;
};

export default function RichContent({ content }: RichContentProps) {
  if (typeof content === "string") {
    return <span className="whitespace-pre-line">{content}</span>;
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
    case "text":
      return <span className="whitespace-pre-line">{part.content}</span>;
    case "sub":
      return (
        <sub className="align-sub text-[0.78em] tracking-tight">
          <RichContent content={part.content} />
        </sub>
      );
    case "sup":
      return (
        <sup className="align-super text-[0.78em] tracking-tight">
          <RichContent content={part.content} />
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
          <RichContent content={part.content} />
        </strong>
      );
    case "vec":
      return <Vec content={part.content} />;
  }
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
        <RichContent content={content} />
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
        <RichContent content={num} />
      </span>
      <span className="block px-1 pt-0.5">
        <RichContent content={den} />
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
            <RichContent content={row} />
          </span>
        ))}
      </span>
    </span>
  );
}

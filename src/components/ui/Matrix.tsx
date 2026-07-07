import type { MatrixCell, RichPart } from "../../data/exercises";
import RichContent from "./RichContent";

type MatrixProps = {
  data: MatrixCell[][];
  label?: string;
  inline?: boolean;
};

function isSep(cell: MatrixCell): cell is { type: "sep" } {
  return typeof cell === "object" && !Array.isArray(cell) && cell !== null && "type" in cell && cell.type === "sep";
}

function isRichCell(cell: MatrixCell): cell is RichPart[] {
  return Array.isArray(cell);
}

function cellToText(cell: MatrixCell): string {
  if (isSep(cell)) return "│";
  if (isRichCell(cell)) {
    return cell
      .map((p) => {
        if (p.type === "text") return p.content;
        if (p.type === "vec") {
          const inner = typeof p.content === "string" ? p.content : p.content.map((x) => (x.type === "text" ? x.content : "")).join("");
          return `${inner} (vecteur)`;
        }
        return "";
      })
      .join("");
  }
  return String(cell);
}

function ariaLabelFor(data: MatrixCell[][]): string {
  const rowDesc = data
    .map((row, i) => {
      const cells = row.map((c) => cellToText(c));
      return `ligne ${i + 1} : ${cells.join(", ")}`;
    })
    .join(" ; ");
  const cols = data[0]?.length ?? 0;
  return `Matrice ${data.length}×${cols} : ${rowDesc}`;
}

function gridTemplateFor(row: MatrixCell[], sepWidth: string, cellMin: string): string {
  return row
    .map((c) => (isSep(c) ? sepWidth : `minmax(${cellMin}, auto)`))
    .join(" ");
}

export default function Matrix({ data, label, inline = false }: MatrixProps) {
  const ariaLabel = ariaLabelFor(data);

  if (inline) {
    return (
      <span
        className="mx-1 inline-flex items-center gap-1.5 align-middle"
        role="img"
        aria-label={ariaLabel}
      >
        {label && (
          <span
            aria-hidden="true"
            className="font-mono text-sm font-semibold text-brand-900"
          >
            {label}
          </span>
        )}
        <span aria-hidden="true" className="relative inline-block px-2 py-1">
          <span className="absolute inset-y-0 left-0 w-1.5 border-y-2 border-l-2 border-brand-800" />
          <span className="absolute inset-y-0 right-0 w-1.5 border-y-2 border-r-2 border-brand-800" />
          <span
            className="inline-grid items-stretch gap-x-3 gap-y-0.5 font-mono text-sm tabular-nums text-ink-900"
            style={{ gridTemplateColumns: gridTemplateFor(data[0] ?? [], "0.75rem", "1rem") }}
          >
            {data.flatMap((row, i) =>
              row.map((cell, j) =>
                isSep(cell) ? (
                  <span
                    key={`${i}-${j}`}
                    aria-hidden="true"
                    className="block self-stretch border-l-2 border-dashed border-brand-700"
                  />
                ) : (
                  <span key={`${i}-${j}`} className="text-center">
                    {isRichCell(cell) ? <RichContent content={cell} /> : cell}
                  </span>
                )
              )
            )}
          </span>
        </span>
      </span>
    );
  }

  return (
    <div
      className="my-4 flex items-center gap-3"
      role="img"
      aria-label={ariaLabel}
    >
      {label && (
        <span
          aria-hidden="true"
          className="font-mono text-lg font-semibold text-brand-900"
        >
          {label}
        </span>
      )}
      <div aria-hidden="true" className="relative inline-block px-3 py-2">
        <span className="absolute inset-y-0 left-0 w-2 border-y-2 border-l-2 border-brand-800" />
        <span className="absolute inset-y-0 right-0 w-2 border-y-2 border-r-2 border-brand-800" />
        <div
          className="grid items-stretch gap-x-5 gap-y-1.5 font-mono text-base tabular-nums text-ink-900"
          style={{ gridTemplateColumns: gridTemplateFor(data[0] ?? [], "1rem", "1.25rem") }}
        >
          {data.flatMap((row, i) =>
            row.map((cell, j) =>
              isSep(cell) ? (
                <span
                  key={`${i}-${j}`}
                  aria-hidden="true"
                  className="block self-stretch border-l-2 border-dashed border-brand-700"
                />
              ) : (
                <span key={`${i}-${j}`} className="text-center">
                  {cell}
                </span>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

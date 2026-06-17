"""Parse the algebra exercises PDF text into structured JSON.

Reads pdf_extract.txt produced by extract_pdf.py and outputs linalg_exercises.json
that can be imported into the TypeScript data layer.

Approach:
  1. Split the text into exercises section (before "Solutions") and solutions section.
  2. Within each, find lesson headers ("Leçon N — Title") and exercise items ("N.").
  3. Extract difficulty stars (⋆, ⋆⋆, ⋆⋆⋆).
  4. Match each exercise to its solution by (lessonId, number).
  5. Best-effort math notation cleanup (join multi-line expressions).
"""
import json
import re
from pathlib import Path

EXTRACT_FILE = Path(__file__).parent / "pdf_extract.txt"
OUTPUT_FILE = Path(__file__).parent.parent / "src" / "data" / "linalg_exercises.json"

STAR = "⋆"
DIFF_MAP = {1: "Fondamental", 2: "Intermédiaire", 3: "Avancé"}

PAGE_MARK = re.compile(r"^=+\s*PAGE\s+\d+\s*=+$")
LESSON_HEADER = re.compile(r"^Leçon\s+(\d+)\s+[—–-]\s+(.+?)\s*$")
EX_NUM_LINE = re.compile(r"^(\d+)\.(\s|$)")
SOLUTIONS_MARK = re.compile(r"^(Solutions|Démarches et réponses)$")
HEADER_NOISE = re.compile(
    r"(Cahier d'exercices Algèbre|Démarches et réponses Algèbre|"
    r"Algèbre linéaire et géométrie vectorielle|"
    r"Cahier d'exercices — Leçons|^\d+$)"  # bare page numbers
)

def clean_lines(raw: str) -> list[str]:
    """Return non-empty stripped lines, dropping page markers and noisy headers."""
    out = []
    for ln in raw.splitlines():
        ln = ln.strip()
        if not ln:
            continue
        if PAGE_MARK.match(ln):
            continue
        if HEADER_NOISE.search(ln):
            continue
        out.append(ln)
    return out


def split_exercises_solutions(text: str) -> tuple[str, str]:
    """Split full extract into (exercises_text, solutions_text).

    Use the first occurrence of "Solutions\nDémarches et réponses" header.
    """
    # The exercises actually start around page 11 ("Leçon 1 — ..." after aide-mémoire).
    # The solutions section starts at page 38 with the explicit "Solutions" / "Démarches" header.
    # We find the page-38 header by looking for the unique two-line sequence.
    m = re.search(r"\n(Solutions\nDémarches et réponses\n)", text)
    if not m:
        # Fallback: look for first "Démarches et réponses" line
        m = re.search(r"\nDémarches et réponses\n", text)
        if not m:
            raise SystemExit("Could not locate solutions section.")
    return text[: m.start()], text[m.start() :]


def extract_difficulty(text: str) -> tuple[int, str]:
    """Strip leading ⋆ stars and return (count, remaining_text)."""
    # Allow leading whitespace then 1-3 stars (possibly with spaces between)
    m = re.match(r"^\s*((?:" + STAR + r"\s*){1,3})", text)
    if not m:
        return 0, text.lstrip()
    stars = m.group(1).count(STAR)
    return stars, text[m.end():].lstrip()


def split_items_by_number(lines: list[str], lesson_start: int) -> list[tuple[int, list[str]]]:
    """Within a lesson's lines, return list of (number, content_lines).

    A new item starts with a line beginning with `\\d+\\.`.
    Subsequent lines belong to the current item until next item or end.
    """
    items = []
    cur_num = None
    cur_lines: list[str] = []
    i = lesson_start
    while i < len(lines):
        ln = lines[i]
        # New lesson? stop
        if LESSON_HEADER.match(ln):
            break
        m = EX_NUM_LINE.match(ln)
        if m:
            # Flush previous
            if cur_num is not None:
                items.append((cur_num, cur_lines))
            cur_num = int(m.group(1))
            rest = ln[m.end():].strip()
            cur_lines = [rest] if rest else []
        else:
            if cur_num is not None:
                cur_lines.append(ln)
        i += 1
    if cur_num is not None:
        items.append((cur_num, cur_lines))
    return items


def parse_section(lines: list[str]) -> dict:
    """Walk the cleaned lines and yield {lessonId: {number, name, items: [{number, raw_lines}]}}."""
    result: dict[str, dict] = {}
    i = 0
    while i < len(lines):
        m = LESSON_HEADER.match(lines[i])
        if not m:
            i += 1
            continue
        lesson_num = int(m.group(1))
        lesson_name = m.group(2).strip()
        lesson_id = f"L{lesson_num}"

        # Collect items until next lesson header
        items = split_items_by_number(lines, i + 1)
        result[lesson_id] = {
            "number": lesson_num,
            "name": lesson_name,
            "items": items,
        }
        # Advance past these items
        # Find the line right after the items section
        i += 1
        # Skip until next lesson header
        while i < len(lines) and not LESSON_HEADER.match(lines[i]):
            i += 1
    return result


def join_math_lines(content_lines: list[str]) -> str:
    """Join a list of lines into a single string with best-effort math cleanup.

    Heuristics:
    - Join lines belonging to the same parenthesized expression (matrices).
    - Preserve sub-part markers a) b) c) on their own lines (use newline before them).
    - Replace multiple whitespace runs with single space.
    """
    text = "\n".join(content_lines).strip()
    # Compact spaces around line breaks inside parens (rough): replace "\n" between matrix
    # entries with " ". We detect this by tracking parenthesis depth.
    out = []
    depth = 0
    for ch in text:
        if ch in "([":
            depth += 1
            out.append(ch)
        elif ch in ")]":
            depth = max(0, depth - 1)
            out.append(ch)
        elif ch == "\n":
            if depth > 0:
                out.append(" ")
            else:
                out.append("\n")
        else:
            out.append(ch)
    joined = "".join(out)
    # Preserve a) b) c) sub-parts: ensure newline before each "a) " / "b) " etc.
    joined = re.sub(r"\s+(?=[a-h]\)\s)", "\n", joined)
    # Collapse runs of spaces
    joined = re.sub(r"[ \t]{2,}", " ", joined)
    # Collapse multiple newlines
    joined = re.sub(r"\n{2,}", "\n", joined)
    return joined.strip()


def derive_steps_and_answer(solution_text: str) -> tuple[list[str], str]:
    """From a solution block, split into logical sentences and extract a final answer.

    Strategy:
      - Flatten the multi-line block into one string (collapse whitespace runs).
      - Split on sentence boundaries (".", ";", ":") followed by a space + capital.
      - If the last sentence is short and contains "=" or "⇒", use it as the answer.
      - Otherwise return all sentences as steps with a generic answer placeholder.
    """
    if not solution_text:
        return ([], "Voir le solutionnaire.")

    # Collapse all whitespace into single spaces (we already joined math earlier)
    flat = re.sub(r"\s+", " ", solution_text).strip()
    if not flat:
        return ([], "Voir le solutionnaire.")

    # Split on sentence-final punctuation followed by space + uppercase letter.
    parts = re.split(r"(?<=[.;])\s+(?=[A-ZÀ-ÝŒ])", flat)
    parts = [p.strip(" \n") for p in parts if p.strip()]

    if not parts:
        return ([flat], "Voir la démarche.")

    # Avoid duplicating content as both step and answer when there's only one part
    if len(parts) == 1:
        return (parts, "Voir la démarche complète ci-dessus.")

    last = parts[-1]
    # Heuristic: short final sentence with an equals or implies sign → answer
    if len(last) <= 120 and ("=" in last or "⇒" in last or "≈" in last):
        return (parts[:-1], last)

    return (parts, "Voir la démarche complète ci-dessus.")


def main() -> None:
    raw = EXTRACT_FILE.read_text(encoding="utf-8")
    ex_text, sol_text = split_exercises_solutions(raw)

    ex_lines = clean_lines(ex_text)
    sol_lines = clean_lines(sol_text)

    ex_parsed = parse_section(ex_lines)
    sol_parsed = parse_section(sol_lines)

    print(f"Exercises section: {len(ex_parsed)} lessons")
    print(f"Solutions section: {len(sol_parsed)} lessons")

    # Build the final list of exercises
    exercises_out = []
    counts_per_difficulty = {"Fondamental": 0, "Intermédiaire": 0, "Avancé": 0}
    missing_solutions = 0

    for lesson_id, lesson in sorted(ex_parsed.items(), key=lambda kv: kv[1]["number"]):
        sol_lesson = sol_parsed.get(lesson_id, {"items": []})
        sol_map = {num: lines for num, lines in sol_lesson["items"]}

        for num, content_lines in lesson["items"]:
            joined = join_math_lines(content_lines)
            stars, prompt = extract_difficulty(joined)
            if not stars:
                # Try one more time on the raw first line
                if content_lines:
                    stars2, _ = extract_difficulty(content_lines[0])
                    if stars2:
                        stars = stars2
            difficulty = DIFF_MAP.get(stars, "Intermédiaire")

            sol_lines_for_item = sol_map.get(num)
            if sol_lines_for_item is None:
                missing_solutions += 1
                steps, answer = [], "Voir le solutionnaire."
            else:
                sol_joined = join_math_lines(sol_lines_for_item)
                steps, answer = derive_steps_and_answer(sol_joined)

            exercises_out.append({
                "id": f"{lesson_id}-E{num}",
                "topicId": "linear-algebra",
                "lessonId": lesson_id,
                "number": num,
                "title": f"Exercice {num}",
                "difficulty": difficulty,
                "prompt": prompt,
                "steps": steps,
                "answer": answer,
            })
            counts_per_difficulty[difficulty] += 1

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(exercises_out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(exercises_out)} exercises to {OUTPUT_FILE}")
    print(f"  Fondamental: {counts_per_difficulty['Fondamental']}")
    print(f"  Intermédiaire: {counts_per_difficulty['Intermédiaire']}")
    print(f"  Avancé: {counts_per_difficulty['Avancé']}")
    print(f"  Missing solutions: {missing_solutions}")


if __name__ == "__main__":
    main()

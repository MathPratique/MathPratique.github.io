"""Parse the LaTeX source of the algebra exercises book into structured JSON.

Outputs ``src/data/linalg_exercises.json`` with **rich content**: each prompt /
step / answer becomes a list of parts, each part being either a text segment
(with LaTeX → Unicode conversions applied) or a structured matrix
``{data: rows[][]}`` that the UI renders as a real grid.

Run with:  python parse_latex.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

TEX_PATH = Path(r"C:\Users\simon\Downloads\exercices_algebre_KDP.tex")
OUTPUT = (
    Path(__file__).parent.parent / "src" / "data" / "linalg_exercises.json"
)

DIFF_MAP = {
    "facile": "Fondamental",
    "moyen": "Intermédiaire",
    "difficile": "Avancé",
}


# --------------------------------------------------------------------------
# Brace-balanced helpers
# --------------------------------------------------------------------------

def find_matching_brace(s: str, open_pos: int) -> int:
    """Given the index of '{' in *s*, return the index AFTER its matching '}'."""
    if open_pos >= len(s) or s[open_pos] != "{":
        return -1
    depth = 1
    i = open_pos + 1
    while i < len(s) and depth > 0:
        c = s[i]
        if c == "\\" and i + 1 < len(s):
            i += 2
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        i += 1
    return i if depth == 0 else -1


# --------------------------------------------------------------------------
# Text cleanup (LaTeX → Unicode)
# --------------------------------------------------------------------------

# Single-pass regex substitutions for simple LaTeX commands and symbols.
SUBS: list[tuple[str, str]] = [
    # Arrows & relations
    (r"\\Rightarrow(?![A-Za-z])", "⇒"),
    (r"\\Leftarrow(?![A-Za-z])", "⇐"),
    (r"\\Leftrightarrow(?![A-Za-z])", "⇔"),
    (r"\\rightarrow(?![A-Za-z])", "→"),
    (r"\\leftarrow(?![A-Za-z])", "←"),
    (r"\\to(?![A-Za-z])", "→"),
    (r"\\neq(?![A-Za-z])", "≠"),
    (r"\\leq(?![A-Za-z])", "≤"),
    (r"\\geq(?![A-Za-z])", "≥"),
    (r"\\approx(?![A-Za-z])", "≈"),
    (r"\\equiv(?![A-Za-z])", "≡"),
    (r"\\sim(?![A-Za-z])", "∼"),
    # Operators
    (r"\\times(?![A-Za-z])", "×"),
    (r"\\cdot(?![A-Za-z])", "·"),
    (r"\\pm(?![A-Za-z])", "±"),
    (r"\\mp(?![A-Za-z])", "∓"),
    (r"\\circ(?![A-Za-z])", "∘"),
    # Vertical bar (set-builder, divisibility) — \mid inside matrix cells is
    # caught earlier by parse_matrix_body as a sep marker, so this only fires
    # for inline uses like {x | x ∈ ℝ}.
    (r"\\mid(?![A-Za-z])", "|"),
    (r"\\vert(?![A-Za-z])", "|"),
    # Set theory
    (r"\\in(?![A-Za-z])", "∈"),
    (r"\\notin(?![A-Za-z])", "∉"),
    (r"\\subset(?![A-Za-z])", "⊂"),
    (r"\\subseteq(?![A-Za-z])", "⊆"),
    (r"\\supset(?![A-Za-z])", "⊃"),
    (r"\\supseteq(?![A-Za-z])", "⊇"),
    (r"\\cup(?![A-Za-z])", "∪"),
    (r"\\cap(?![A-Za-z])", "∩"),
    (r"\\emptyset(?![A-Za-z])", "∅"),
    (r"\\forall(?![A-Za-z])", "∀"),
    (r"\\exists(?![A-Za-z])", "∃"),
    # Misc
    (r"\\infty(?![A-Za-z])", "∞"),
    (r"\\partial(?![A-Za-z])", "∂"),
    (r"\\nabla(?![A-Za-z])", "∇"),
    (r"\\angle(?![A-Za-z])", "∠"),
    (r"\\perp(?![A-Za-z])", "⊥"),
    (r"\\parallel(?![A-Za-z])", "∥"),
    (r"\\square(?![A-Za-z])", "□"),
    (r"\\checkmark(?![A-Za-z])", "✓"),
    (r"\\ldots(?![A-Za-z])", "…"),
    (r"\\cdots(?![A-Za-z])", "⋯"),
    (r"\\vdots(?![A-Za-z])", "⋮"),
    (r"\\ddots(?![A-Za-z])", "⋱"),
    # Number sets
    (r"\\mathbb\{R\}", "ℝ"),
    (r"\\mathbb\{N\}", "ℕ"),
    (r"\\mathbb\{Z\}", "ℤ"),
    (r"\\mathbb\{Q\}", "ℚ"),
    (r"\\mathbb\{C\}", "ℂ"),
    # Greek lowercase
    (r"\\alpha(?![A-Za-z])", "α"),
    (r"\\beta(?![A-Za-z])", "β"),
    (r"\\gamma(?![A-Za-z])", "γ"),
    (r"\\delta(?![A-Za-z])", "δ"),
    (r"\\epsilon(?![A-Za-z])", "ε"),
    (r"\\varepsilon(?![A-Za-z])", "ε"),
    (r"\\zeta(?![A-Za-z])", "ζ"),
    (r"\\eta(?![A-Za-z])", "η"),
    (r"\\theta(?![A-Za-z])", "θ"),
    (r"\\vartheta(?![A-Za-z])", "ϑ"),
    (r"\\iota(?![A-Za-z])", "ι"),
    (r"\\kappa(?![A-Za-z])", "κ"),
    (r"\\lambda(?![A-Za-z])", "λ"),
    (r"\\mu(?![A-Za-z])", "μ"),
    (r"\\nu(?![A-Za-z])", "ν"),
    (r"\\xi(?![A-Za-z])", "ξ"),
    (r"\\pi(?![A-Za-z])", "π"),
    (r"\\rho(?![A-Za-z])", "ρ"),
    (r"\\sigma(?![A-Za-z])", "σ"),
    (r"\\tau(?![A-Za-z])", "τ"),
    (r"\\upsilon(?![A-Za-z])", "υ"),
    (r"\\phi(?![A-Za-z])", "φ"),
    (r"\\varphi(?![A-Za-z])", "φ"),
    (r"\\chi(?![A-Za-z])", "χ"),
    (r"\\psi(?![A-Za-z])", "ψ"),
    (r"\\omega(?![A-Za-z])", "ω"),
    # Greek uppercase
    (r"\\Gamma(?![A-Za-z])", "Γ"),
    (r"\\Delta(?![A-Za-z])", "Δ"),
    (r"\\Theta(?![A-Za-z])", "Θ"),
    (r"\\Lambda(?![A-Za-z])", "Λ"),
    (r"\\Xi(?![A-Za-z])", "Ξ"),
    (r"\\Pi(?![A-Za-z])", "Π"),
    (r"\\Sigma(?![A-Za-z])", "Σ"),
    (r"\\Upsilon(?![A-Za-z])", "Υ"),
    (r"\\Phi(?![A-Za-z])", "Φ"),
    (r"\\Psi(?![A-Za-z])", "Ψ"),
    (r"\\Omega(?![A-Za-z])", "Ω"),
    # Spacing commands
    (r"\\quad(?![A-Za-z])", "  "),
    (r"\\qquad(?![A-Za-z])", "    "),
    (r"\\,", " "),
    (r"\\;", " "),
    (r"\\:", " "),
    (r"\\!", ""),
    (r"~", " "),
    # (superscripts handled separately: Unicode in matrix cells via clean_superscripts,
    # HTML <sup> in surrounding text via extract_parts)
    # \mathcal {X} just strips the command, keeping the letter
    (r"\\mathcal\{([^}]+)\}", r"\1"),
    (r"\\mathbf\{([^}]+)\}", r"\1"),
    (r"\\mathrm\{([^}]+)\}", r"\1"),
    # text decorations strip
    (r"\\text\{([^}]+)\}", r"\1"),
    (r"\\textbf\{([^}]+)\}", r"\1"),
    (r"\\textit\{([^}]+)\}", r"\1"),
    (r"\\emph\{([^}]+)\}", r"\1"),
    # \textsuperscript{e} → ^{e} so extract_parts can turn it into a real <sup>
    # (and \textsubscript symmetrically). Common in French ordinals like 3ᵉ.
    (r"\\textsuperscript\{([^}]+)\}", r"^{\1}"),
    (r"\\textsubscript\{([^}]+)\}", r"_{\1}"),
    # (Vectors handled separately: matrix cells get the Unicode combining arrow
    # via clean_vectors, surrounding text becomes structured {type: "vec"} parts
    # via parse_text_segment.)
    (r"\\hat\{([^}]+)\}", r"\1̂"),
    (r"\\overline\{([^}]+)\}", r"\1"),
    (r"\\bar\{([^}]+)\}", r"\1"),
    # \sqrt{x} → √(x)
    (r"\\sqrt\{([^{}]+)\}", r"√(\1)"),
    # Display math markers (keep inner content)
    (r"\\\[", " "),
    (r"\\\]", " "),
    # Inline math markers (just remove dollar signs)
    (r"\$", ""),
]


def apply_subs(text: str) -> str:
    for pat, repl in SUBS:
        text = re.sub(pat, repl, text)
    return text


def transform_fractions(s: str) -> str:
    """Convert \\frac{a}{b}, \\dfrac{a}{b}, \\tfrac{a}{b} → a/b with brace tracking."""
    cmds = ("\\frac", "\\dfrac", "\\tfrac")
    out: list[str] = []
    i = 0
    while i < len(s):
        matched = False
        for cmd in cmds:
            if s.startswith(cmd, i) and i + len(cmd) < len(s) and s[i + len(cmd)] == "{":
                num_open = i + len(cmd)
                num_end = find_matching_brace(s, num_open)
                if num_end == -1:
                    break
                if num_end < len(s) and s[num_end] == "{":
                    den_open = num_end
                    den_end = find_matching_brace(s, den_open)
                    if den_end == -1:
                        break
                    num = s[num_open + 1 : num_end - 1]
                    den = s[den_open + 1 : den_end - 1]
                    # Recursively transform nested fractions
                    num = transform_fractions(num)
                    den = transform_fractions(den)
                    out.append(f"({num})/({den})")
                    i = den_end
                    matched = True
                    break
        if not matched:
            out.append(s[i])
            i += 1
    return "".join(out)


SUBSCRIPT_MAP: dict[str, str] = {
    # Digits
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    # Letters that exist as Unicode subscripts
    "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
    "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
    "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
    "v": "ᵥ", "x": "ₓ",
    # Operators
    "+": "₊", "-": "₋", "=": "₌",
    "(": "₍", ")": "₎",
    ",": ",",  # no subscript comma, keep as-is
}


def to_subscript(content: str) -> str | None:
    """Return Unicode-subscripted text, or None if any character cannot be subscripted."""
    content = content.strip()
    if not content:
        return ""
    if all(c in SUBSCRIPT_MAP for c in content):
        return "".join(SUBSCRIPT_MAP[c] for c in content)
    return None


SUPERSCRIPT_MAP: dict[str, str] = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "i": "ⁱ", "n": "ⁿ", "T": "ᵀ",
}


def to_superscript(content: str) -> str | None:
    content = content.strip()
    if not content:
        return ""
    if all(c in SUPERSCRIPT_MAP for c in content):
        return "".join(SUPERSCRIPT_MAP[c] for c in content)
    return None


def clean_superscripts(s: str) -> str:
    """Convert ``^{...}`` and single-char ``^X`` to Unicode superscripts; fall back to ``^content``."""

    def repl_braced(m: re.Match[str]) -> str:
        content = m.group(1)
        sup = to_superscript(content)
        if sup is None:
            return "^" + content
        return sup

    s = re.sub(r"\^\{([^{}]+)\}", repl_braced, s)

    def repl_single(m: re.Match[str]) -> str:
        c = m.group(1)
        sup = to_superscript(c)
        if sup is None:
            return m.group(0)
        return sup

    s = re.sub(r"\^([A-Za-z0-9])", repl_single, s)
    return s


def clean_subscripts(s: str) -> str:
    """Convert `_{...}` and single-char `_X` to Unicode subscripts where possible;
    fall back to plain `_content` when a character can't be subscripted."""

    def repl_braced(m: re.Match[str]) -> str:
        content = m.group(1)
        sub = to_subscript(content)
        if sub is None:
            return "_" + content
        return sub

    s = re.sub(r"_\{([^{}]+)\}", repl_braced, s)

    def repl_single(m: re.Match[str]) -> str:
        c = m.group(1)
        sub = to_subscript(c)
        if sub is None:
            return m.group(0)
        return sub

    s = re.sub(r"_([A-Za-z0-9])", repl_single, s)
    return s


def _common_cleanup(s: str) -> str:
    """LaTeX cleanup shared by text segments and matrix cells (everything except
    fraction handling and subscript handling — those are done differently for
    text vs cells)."""
    # Strip LaTeX line comments first (a % outside of \% means rest-of-line is comment)
    s = re.sub(r"(?<!\\)%[^\n]*", "", s)
    s = apply_subs(s)
    # Strip a couple of straggler commands
    s = re.sub(r"\\(left|right)(?![A-Za-z])", "", s)
    s = re.sub(r"\\(par|\\)(?![A-Za-z])", "\n", s)
    s = re.sub(r"\\noindent(?![A-Za-z])", "", s)
    s = re.sub(r"\\smallskip\b|\\medskip\b|\\bigskip\b|\\vspace\{[^}]+\}", "", s)
    s = re.sub(r"\\(begin|end)\{align\*?\}", "", s)
    # Anything left of the form \cmd → just drop the backslash
    s = re.sub(r"\\([A-Za-z]+)", r"\1", s)
    # LaTeX-escaped braces `\{` `\}` (literal braces in math) → plain braces
    s = s.replace(r"\{", "{").replace(r"\}", "}")
    # Collapse whitespace
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\s*\n\s*", "\n", s)
    s = re.sub(r"\n{2,}", "\n", s)
    # Tight binary operators (× · ± ∓) — LaTeX commands like `\times 3`
    # leave a stray delimiter space behind after substitution.
    s = re.sub(r"\s*([×·±∓])\s*", r"\1", s)
    return s.strip()


def clean_text(s: str) -> str:
    """For text segments outside matrices. Leaves ``_{...}`` markers in place so
    that ``extract_parts`` can split them out as proper subscript parts later."""
    return _common_cleanup(s)


def clean_vectors(s: str) -> str:
    """Convert ``\\vec{X}`` and ``\\overrightarrow{X}`` to ``X⃗`` (combining arrow above)."""
    s = re.sub(r"\\vec\{([^{}]+)\}", r"\1⃗", s)
    s = re.sub(r"\\overrightarrow\{([^{}]+)\}", r"\1⃗", s)
    return s


def clean_cell(s: str) -> str:
    """For matrix cells. Fractions stay flat as ``(a)/(b)``, sub/superscripts go
    Unicode, vectors get a combining arrow — cells must stay flat strings so the
    grid layout stays aligned."""
    s = transform_fractions(s)
    s = clean_vectors(s)
    s = _common_cleanup(s)
    return clean_subscripts(clean_superscripts(s))


def parse_text_segment(text: str) -> list[dict[str, Any]]:
    """Walk a raw text segment (no matrix/cases envs) and emit parts:
    fractions become structured ``{type: "frac", num, den}`` parts; other text is
    cleaned and split into text/sub/sup parts via extract_parts."""
    parts: list[dict[str, Any]] = []
    if not text:
        return parts
    buf: list[str] = []

    def flush_buffer() -> None:
        if not buf:
            return
        raw = "".join(buf)
        # Remember whether the buffer began/ended with whitespace — clean_text
        # strips those, but we need to keep them as separators between this
        # chunk and adjacent structured parts (\vec, \frac, …).
        # Math-mode delimiters ($, \[, \], \(, \)) are invisible at render time
        # but live at the edge of the buffer in sources like
        # ``vecteur normal $\vec{n}$``. Strip them first so the boundary check
        # sees the actual textual whitespace that should be preserved.
        raw_for_boundary = re.sub(r"\$+|\\\[|\\\]|\\\(|\\\)", "", raw)
        had_leading = bool(raw_for_boundary) and raw_for_boundary[0].isspace()
        had_trailing = bool(raw_for_boundary) and raw_for_boundary[-1].isspace()
        cleaned = clean_text(raw)
        buf.clear()
        if not cleaned:
            if (had_leading or had_trailing) and parts:
                parts.append({"type": "text", "content": " "})
            return
        extracted = extract_parts(cleaned)
        if extracted:
            if had_leading and parts:
                first = extracted[0]
                if first["type"] == "text":
                    first["content"] = " " + first["content"]
                else:
                    extracted.insert(0, {"type": "text", "content": " "})
            if had_trailing:
                last = extracted[-1]
                if last["type"] == "text":
                    last["content"] = last["content"] + " "
                else:
                    extracted.append({"type": "text", "content": " "})
        parts.extend(extracted)

    frac_cmds = ("\\frac", "\\dfrac", "\\tfrac")
    vec_cmds = ("\\vec", "\\overrightarrow")
    i = 0
    while i < len(text):
        matched = False
        for cmd in frac_cmds:
            if (
                text.startswith(cmd, i)
                and i + len(cmd) < len(text)
                and text[i + len(cmd)] == "{"
            ):
                num_open = i + len(cmd)
                num_end = find_matching_brace(text, num_open)
                if num_end == -1:
                    break
                if num_end >= len(text) or text[num_end] != "{":
                    break
                den_open = num_end
                den_end = find_matching_brace(text, den_open)
                if den_end == -1:
                    break
                num_str = text[num_open + 1 : num_end - 1]
                den_str = text[den_open + 1 : den_end - 1]
                flush_buffer()
                parts.append({
                    "type": "frac",
                    "num": parse_text_segment(num_str),
                    "den": parse_text_segment(den_str),
                })
                i = den_end
                matched = True
                break
        if matched:
            continue
        for cmd in vec_cmds:
            if (
                text.startswith(cmd, i)
                and i + len(cmd) < len(text)
                and text[i + len(cmd)] == "{"
            ):
                open_pos = i + len(cmd)
                close_pos = find_matching_brace(text, open_pos)
                if close_pos == -1:
                    break
                inner = text[open_pos + 1 : close_pos - 1]
                flush_buffer()
                parts.append({
                    "type": "vec",
                    "content": parse_text_segment(inner),
                })
                i = close_pos
                matched = True
                break
        if not matched:
            buf.append(text[i])
            i += 1
    flush_buffer()
    return parts


def extract_parts(text: str) -> list[dict[str, Any]]:
    """Split a cleaned text string into rich parts: text + sub + sup markers."""
    if not text:
        return []
    parts: list[dict[str, Any]] = []
    # Match `_{...}`, `^{...}`, `_X`, or `^X`
    pat = re.compile(r"([_^])\{([^{}]+)\}|([_^])([A-Za-z0-9])")
    last = 0
    for m in pat.finditer(text):
        if m.start() > last:
            seg = text[last : m.start()]
            if seg:
                parts.append({"type": "text", "content": seg})
        marker = m.group(1) or m.group(3)
        content = (m.group(2) or m.group(4) or "").strip()
        if content:
            part_type = "sub" if marker == "_" else "sup"
            parts.append({"type": part_type, "content": content})
        last = m.end()
    if last < len(text):
        seg = text[last:]
        if seg:
            parts.append({"type": "text", "content": seg})
    return parts


def parse_array_body(body: str, colspec: str) -> list[list[Any]]:
    """Parse ``\\begin{array}{COLSPEC}...\\end{array}`` into rows.

    ``COLSPEC`` is the LaTeX column specification — letters ``c/l/r`` indicate a
    data column, ``|`` inserts a vertical separator. We produce the same cell
    structure as ``parse_matrix_body``: regular cells stay as strings, separators
    become ``{"type": "sep"}`` markers."""
    spec: list[str] = []
    for c in colspec or "":
        if c in "lcr":
            spec.append("data")
        elif c == "|":
            spec.append("sep")

    rows: list[list[Any]] = []
    for raw_row in re.split(r"\\\\", body):
        raw_row = raw_row.strip()
        if not raw_row:
            continue
        raw_cells = [c.strip() for c in raw_row.split("&")]
        cells: list[Any] = []
        data_idx = 0
        for col in spec:
            if col == "sep":
                cells.append({"type": "sep"})
            elif data_idx < len(raw_cells):
                cells.append(clean_cell(raw_cells[data_idx]))
                data_idx += 1
            else:
                cells.append("")
                data_idx += 1
        rows.append(cells)
    return rows


def parse_matrix_body(body: str) -> list[list[Any]]:
    """Parse the content of ``\\begin{pmatrix}...\\end{pmatrix}`` into rows of cells.

    Most cells are flat strings. Augmented-matrix separators (``\\mid``, ``\\vert``,
    ``\\|``) become ``{"type": "sep"}`` markers that the renderer turns into a
    vertical dashed line."""
    rows: list[list[Any]] = []
    sep_tokens = {r"\mid", r"\vert", r"\|"}
    for raw_row in re.split(r"\\\\", body):
        raw_row = raw_row.strip()
        if not raw_row:
            continue
        cells: list[Any] = []
        for raw_cell in raw_row.split("&"):
            stripped = raw_cell.strip()
            if stripped in sep_tokens:
                cells.append({"type": "sep"})
            else:
                cells.append(clean_cell(stripped))
        rows.append(cells)
    return rows


def strip_brace_labels(text: str) -> str:
    """Strip ``\\underbrace{X}_{...}`` and ``\\overbrace{X}^{...}`` wrappers,
    keeping only the inner content ``X``. The user reads which matrix is which
    from the surrounding equation (AX = B), so the labels aren't worth rendering."""
    out: list[str] = []
    i = 0
    while i < len(text):
        matched = False
        for cmd, label_marker in (("\\underbrace", "_"), ("\\overbrace", "^")):
            if (
                text.startswith(cmd, i)
                and i + len(cmd) < len(text)
                and text[i + len(cmd)] == "{"
            ):
                brace_open = i + len(cmd)
                brace_end = find_matching_brace(text, brace_open)
                if brace_end == -1:
                    break
                content = text[brace_open + 1 : brace_end - 1]
                j = brace_end
                # Skip optional label: _{X} or ^{X} or _X / ^X
                if j < len(text) and text[j] == label_marker:
                    if j + 1 < len(text) and text[j + 1] == "{":
                        label_end = find_matching_brace(text, j + 1)
                        if label_end != -1:
                            j = label_end
                    elif j + 1 < len(text):
                        j += 2
                out.append(content)
                i = j
                matched = True
                break
        if not matched:
            out.append(text[i])
            i += 1
    return "".join(out)


def split_cases_rows(body: str) -> list[str]:
    """Split a ``cases`` body on ``\\\\`` at top depth — keeping ``\\\\`` that live
    inside nested environments (typically ``pmatrix``) attached to their rows."""
    rows: list[str] = []
    depth = 0
    cur: list[str] = []
    i = 0
    while i < len(body):
        if body.startswith("\\begin{", i):
            close = body.find("}", i + 7)
            if close != -1:
                cur.append(body[i : close + 1])
                i = close + 1
                depth += 1
                continue
        if body.startswith("\\end{", i):
            close = body.find("}", i + 5)
            if close != -1:
                cur.append(body[i : close + 1])
                i = close + 1
                depth -= 1
                continue
        if body.startswith("\\\\", i) and depth == 0:
            joined = "".join(cur).strip()
            if joined:
                rows.append(joined)
            cur = []
            i += 2
            continue
        cur.append(body[i])
        i += 1
    if cur:
        rest = "".join(cur).strip()
        if rest:
            rows.append(rest)
    return rows


def parse_rich(text: str) -> list[dict[str, Any]]:
    """Convert LaTeX text containing inline matrices and case systems into a list of parts.

    Each part is one of:
      - ``{"type": "text", "content": "..."}``
      - ``{"type": "sub" | "sup", "content": "..."}``
      - ``{"type": "matrix", "data": [[...], ...]}``
      - ``{"type": "cases", "rows": [RichContent, ...]}``
    """
    # Strip \underbrace / \overbrace wrappers first — they're purely visual
    # labels in the printed book and just produce noise inline.
    text = strip_brace_labels(text)

    parts: list[dict[str, Any]] = []
    # Math environments we recognise. Backreference \1 ensures the closing tag
    # matches. For ``array`` the optional ``{colspec}`` after the opening tag is
    # captured into group 2.
    env_pat = re.compile(
        r"\\begin\{(pmatrix|bmatrix|vmatrix|Vmatrix|cases|array)\}"
        r"(?:\{([^{}]+)\})?"
        r"(.*?)\\end\{\1\}",
        re.DOTALL,
    )

    last_end = 0
    for m in env_pat.finditer(text):
        if m.start() > last_end:
            parts.extend(parse_text_segment(text[last_end : m.start()]))
        env, colspec, body = m.group(1), m.group(2), m.group(3)
        if env == "cases":
            row_strings = split_cases_rows(body)
            row_parts = [parse_rich(r) for r in row_strings]
            if row_parts:
                parts.append({"type": "cases", "rows": row_parts})
        elif env == "array":
            data = parse_array_body(body, colspec or "")
            if data:
                parts.append({"type": "matrix", "data": data})
        else:
            data = parse_matrix_body(body)
            if data:
                parts.append({"type": "matrix", "data": data})
        last_end = m.end()

    if last_end < len(text):
        parts.extend(parse_text_segment(text[last_end:]))

    # Merge adjacent text parts (some matrices are followed by punctuation)
    merged: list[dict[str, Any]] = []
    for p in parts:
        if (
            p["type"] == "text"
            and merged
            and merged[-1]["type"] == "text"
        ):
            merged[-1]["content"] = merged[-1]["content"] + " " + p["content"]
        else:
            merged.append(p)
    return merged


# --------------------------------------------------------------------------
# LaTeX structure parsing
# --------------------------------------------------------------------------

ENUM_TOKEN = re.compile(r"\\begin\{enumerate\}|\\end\{enumerate\}|\\item\b")


def split_top_items(body: str) -> list[str]:
    """Return the bodies of each top-level \\item inside the outer enumerate."""
    items: list[str] = []
    depth = 0
    cur_start: int | None = None
    for m in ENUM_TOKEN.finditer(body):
        tok = m.group(0)
        if tok == r"\begin{enumerate}":
            depth += 1
        elif tok == r"\end{enumerate}":
            if depth == 1 and cur_start is not None:
                items.append(body[cur_start : m.start()])
                cur_start = None
            depth -= 1
        else:  # \item
            if depth == 1:
                if cur_start is not None:
                    items.append(body[cur_start : m.start()])
                cur_start = m.end()
    return [item.strip() for item in items]


def extract_difficulty(item_body: str) -> tuple[str, str]:
    """Strip the first \\facile / \\moyen / \\difficile marker and return (difficulty, rest)."""
    m = re.search(r"\\(facile|moyen|difficile)\b\s*~?\s*", item_body)
    if not m:
        return ("Intermédiaire", item_body.strip())
    difficulty = DIFF_MAP[m.group(1)]
    rest = (item_body[: m.start()] + item_body[m.end() :]).strip()
    return difficulty, rest


def transform_subparts(body: str) -> str:
    """Replace ``\\begin{enumerate}[label=\\alph*)] ... \\end{enumerate}`` with 'a) ... b) ...' text.

    Does a single pass; the outer enumerate split happens after this.
    """
    pat = re.compile(
        r"\\begin\{enumerate\}\[label=\\alph\*\)\]\s*(.+?)\\end\{enumerate\}",
        re.DOTALL,
    )

    def repl(m: re.Match[str]) -> str:
        inner = m.group(1)
        # Split by top-level \item only (no nested enumerate expected at this level)
        items = re.split(r"\\item\b", inner)
        items = [x.strip() for x in items if x.strip()]
        letters = "abcdefghijklmnopqrstuvwxyz"
        return "\n" + "\n".join(f"{letters[i]}) {it}" for i, it in enumerate(items))

    return pat.sub(repl, body)


def parse_exercises_block(text: str) -> list[dict[str, Any]]:
    """Find \\section*{N — Title} blocks and return list of {lessonNumber, lessonName, items}."""
    section_pat = re.compile(r"\\section\*\{(\d+)\s*[—–-]\s*([^}]+)\}")
    sections = list(section_pat.finditer(text))
    result: list[dict[str, Any]] = []
    for i, m in enumerate(sections):
        num = int(m.group(1))
        name = m.group(2).strip()
        body_start = m.end()
        body_end = sections[i + 1].start() if i + 1 < len(sections) else len(text)
        body = text[body_start:body_end]
        body = transform_subparts(body)
        item_bodies = split_top_items(body)
        items = []
        for n, raw in enumerate(item_bodies, start=1):
            diff, rest = extract_difficulty(raw)
            content = parse_rich(rest)
            items.append({"number": n, "difficulty": diff, "content": content})
        result.append({"lessonNumber": num, "lessonName": name, "items": items})
    return result


_ANSWER_PREFIXES = ("⇒", "Donc ", "Ainsi ", "Solution", "Réponse", "Conclusion")


def _looks_like_answer(sentence: str) -> bool:
    s = sentence.strip()
    if not s:
        return False
    if "=" in s:
        return True
    return any(s.startswith(p) for p in _ANSWER_PREFIXES)


def bold_final_answer(parts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Bold the trailing run of answer-like sentences across inline parts.

    Treats the contiguous trailing run of ``text``/``sub``/``sup`` parts as one
    logical text for sentence detection, so an answer like
    ``rang(A:B)=3 (car la 3ᵉ ligne…)`` whose superscript splits it into 3 parts
    is still recognised in one piece. Stops at matrix/cases/frac block elements."""
    if not parts:
        return parts

    # Identify the trailing run of inline parts
    trailing_start = len(parts)
    for i in range(len(parts) - 1, -1, -1):
        if parts[i].get("type") in ("text", "sub", "sup"):
            trailing_start = i
        else:
            break
    if trailing_start == len(parts):
        return parts

    trailing = parts[trailing_start:]
    flat = ""
    boundaries = [0]  # boundaries[k] = end position (in flat) of trailing[k-1]
    for p in trailing:
        flat += p["content"]
        boundaries.append(len(flat))

    sentences = re.split(r"(?<=[.;:])\s+", flat)
    if not sentences:
        return parts

    answer_idx = len(sentences)
    for i in range(len(sentences) - 1, -1, -1):
        if _looks_like_answer(sentences[i]):
            answer_idx = i
        else:
            break
    if answer_idx >= len(sentences):
        return parts

    if answer_idx == 0:
        answer_pos = 0
    else:
        split_matches = list(re.finditer(r"(?<=[.;:])\s+", flat))
        if answer_idx - 1 >= len(split_matches):
            return parts
        answer_pos = split_matches[answer_idx - 1].end()

    answer_total = flat[answer_pos:].strip()
    if not answer_total or len(answer_total) > 240:
        return parts

    # Locate which trailing part contains answer_pos
    target_idx: int | None = None
    for k in range(len(trailing)):
        if boundaries[k] <= answer_pos < boundaries[k + 1]:
            target_idx = k
            break
    if target_idx is None:
        return parts

    target = trailing[target_idx]
    split_offset = answer_pos - boundaries[target_idx]

    rebuilt: list[dict[str, Any]] = list(parts[:trailing_start])
    rebuilt.extend(trailing[:target_idx])

    if target["type"] == "text":
        if split_offset > 0:
            rebuilt.append({"type": "text", "content": target["content"][:split_offset]})
        bold_content: list[dict[str, Any]] = []
        if split_offset < len(target["content"]):
            bold_content.append({"type": "text", "content": target["content"][split_offset:]})
        bold_content.extend(trailing[target_idx + 1 :])
        if bold_content:
            rebuilt.append({"type": "bold", "content": bold_content})
        else:
            return parts
    else:
        # Target is sub/sup — can't split mid-content. Keep it whole and bold
        # from the next part onward (or fall back if nothing remains).
        rebuilt.append(target)
        bold_content = list(trailing[target_idx + 1 :])
        if bold_content:
            rebuilt.append({"type": "bold", "content": bold_content})
        else:
            return parts
    return rebuilt


def count_prompt_subparts(parts: list[dict[str, Any]]) -> int:
    """How many distinct sub-part letters (a, b, c, …) appear in the prompt?"""
    letters: set[str] = set()
    for p in parts:
        if p["type"] == "text":
            for m in re.finditer(r"(?:^|\n)([a-h])\)[ \t]+", p["content"]):
                letters.add(m.group(1))
    return len(letters)


def split_by_semicolons_into_n(
    parts: list[dict[str, Any]], n: int
) -> list[list[dict[str, Any]]] | None:
    """Try splitting solution parts on '; ' boundaries; succeed only if we get exactly *n* groups."""
    if not parts or n < 2:
        return None

    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []

    def add_text(content: str) -> None:
        if not content:
            return
        if current and current[-1].get("type") == "text":
            current[-1]["content"] = current[-1]["content"] + content
        else:
            current.append({"type": "text", "content": content})

    def flush() -> None:
        nonlocal current
        if current:
            groups.append(current)
            current = []

    sep_pat = re.compile(r";[ \t\n]+")

    for part in parts:
        if part["type"] != "text":
            current.append(part)
            continue
        text = part["content"]
        last = 0
        for m in sep_pat.finditer(text):
            before = text[last : m.start()]
            if before:
                add_text(before)
            flush()
            last = m.end()
        trailing = text[last:]
        if trailing:
            add_text(trailing)
    flush()

    if len(groups) != n:
        return None

    letters = "abcdefghijklmnopqrstuvwxyz"
    result: list[list[dict[str, Any]]] = []
    for i, group in enumerate(groups):
        if group and group[0].get("type") == "text":
            group[0]["content"] = f"{letters[i]}) " + group[0]["content"].lstrip()
        else:
            group.insert(0, {"type": "text", "content": f"{letters[i]}) "})
        result.append(group)
    return result


def split_by_subparts(parts: list[dict[str, Any]]) -> list[list[dict[str, Any]]] | None:
    """If a solution mentions sub-part markers (a), b), c)) at sentence starts,
    split it into separate part-groups — one per sub-part. Returns None when no
    sub-part structure is detected (caller should keep the original)."""
    if not parts:
        return None

    marker_pat = re.compile(r"(?:^|(?<=[;\.\n]))[ \t]*([a-h])\)[ \t]+")

    # Count markers across all text parts to decide if this is a sub-part case
    marker_count = 0
    for p in parts:
        if p["type"] == "text":
            marker_count += len(marker_pat.findall(p["content"]))
    if marker_count < 2:
        return None

    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []

    def add_text(content: str) -> None:
        if not content:
            return
        if current and current[-1].get("type") == "text":
            current[-1]["content"] = current[-1]["content"] + content
        else:
            current.append({"type": "text", "content": content})

    def flush() -> None:
        nonlocal current
        if current:
            groups.append(current)
            current = []

    for part in parts:
        if part["type"] != "text":
            current.append(part)
            continue
        text = part["content"]
        last = 0
        for m in marker_pat.finditer(text):
            before = text[last : m.start()]
            before = re.sub(r"[\s;\.]+$", "", before)
            if before:
                add_text(before)
            flush()
            add_text(f"{m.group(1)}) ")
            last = m.end()
        trailing = text[last:]
        if trailing:
            add_text(trailing)
    flush()
    return [g for g in groups if g]


def parse_solutions_block(text: str) -> list[dict[str, Any]]:
    """Find \\solsec{N — Title} blocks and the \\sol{N}{method} entries inside them."""
    solsec_pat = re.compile(r"\\solsec\{(\d+)\s*[—–-]\s*([^}]+)\}")
    sections = list(solsec_pat.finditer(text))
    result: list[dict[str, Any]] = []
    for i, sm in enumerate(sections):
        num = int(sm.group(1))
        name = sm.group(2).strip()
        body_start = sm.end()
        body_end = sections[i + 1].start() if i + 1 < len(sections) else len(text)
        body = text[body_start:body_end]
        # Find each \sol{N}{method} with brace-balanced parsing
        sols: list[dict[str, Any]] = []
        i_cur = 0
        sol_pat = re.compile(r"\\sol\{(\d+)\}")
        for m in sol_pat.finditer(body):
            sol_num = int(m.group(1))
            # Method braces follow
            brace_open = m.end()
            while brace_open < len(body) and body[brace_open] != "{":
                brace_open += 1
            if brace_open >= len(body):
                continue
            method_end = find_matching_brace(body, brace_open)
            if method_end == -1:
                continue
            method_text = body[brace_open + 1 : method_end - 1]
            sols.append({
                "number": sol_num,
                "method": method_text,
                "method_end_pos": method_end,
                "start_pos": m.start(),
            })
        # Now determine content for each sol (between this method_end and next sol start)
        parsed_sols = []
        for j, s in enumerate(sols):
            content_start = s["method_end_pos"]
            content_end = sols[j + 1]["start_pos"] if j + 1 < len(sols) else len(body)
            content_text = body[content_start:content_end].strip()
            parsed_sols.append({
                "number": s["number"],
                "method": parse_rich(s["method"]),
                "content": parse_rich(content_text),
            })
        result.append({"lessonNumber": num, "lessonName": name, "sols": parsed_sols})
    return result


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> None:
    text = TEX_PATH.read_text(encoding="utf-8")
    # The solutions section starts at the first \solsec.
    sol_start = re.search(r"\\solsec\{1\b", text)
    if not sol_start:
        print("ERROR: could not locate solutions start (\\solsec{1...)")
        sys.exit(1)
    exercises_text = text[: sol_start.start()]
    solutions_text = text[sol_start.start() :]

    exercises = parse_exercises_block(exercises_text)
    solutions = parse_solutions_block(solutions_text)

    # Index solutions by (lessonNumber, sol_number)
    sol_index: dict[tuple[int, int], dict[str, Any]] = {}
    for lesson in solutions:
        for s in lesson["sols"]:
            sol_index[(lesson["lessonNumber"], s["number"])] = s

    diff_counts = {"Fondamental": 0, "Intermédiaire": 0, "Avancé": 0}
    no_solution = 0
    output: list[dict[str, Any]] = []

    for lesson in exercises:
        l_num = lesson["lessonNumber"]
        for item in lesson["items"]:
            sol = sol_index.get((l_num, item["number"]))
            if sol is None:
                steps: list[Any] = []
                answer: Any = "Voir le solutionnaire."
                no_solution += 1
            else:
                steps_list: list[Any] = []
                if sol["method"]:
                    steps_list.append(sol["method"])
                if sol["content"]:
                    split = split_by_subparts(sol["content"])
                    if not split:
                        # Fallback: if the prompt has sub-parts a/b/c… and the solution
                        # uses ';\quad' as separator, try splitting on '; '.
                        n_sub = count_prompt_subparts(item["content"])
                        if n_sub >= 2:
                            split = split_by_semicolons_into_n(sol["content"], n_sub)
                    if split:
                        steps_list.extend(bold_final_answer(group) for group in split)
                    else:
                        steps_list.append(bold_final_answer(sol["content"]))
                steps = steps_list
                answer = "Voir la démarche complète ci-dessus."

            output.append({
                "id": f"L{l_num}-E{item['number']}",
                "topicId": "linear-algebra",
                "lessonId": f"L{l_num}",
                "number": item["number"],
                "title": f"Exercice {item['number']}",
                "difficulty": item["difficulty"],
                "prompt": item["content"],
                "steps": steps,
                "answer": answer,
            })
            diff_counts[item["difficulty"]] += 1

    OUTPUT.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Exercises lessons: {len(exercises)}")
    print(f"Solutions lessons: {len(solutions)}")
    print(f"Wrote {len(output)} exercises to {OUTPUT}")
    print(f"  Fondamental:   {diff_counts['Fondamental']}")
    print(f"  Intermediaire: {diff_counts['Intermédiaire']}")
    print(f"  Avance:        {diff_counts['Avancé']}")
    print(f"  No solution:   {no_solution}")


if __name__ == "__main__":
    main()

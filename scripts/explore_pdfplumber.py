"""Quick exploration of pdfplumber's positional data on a page with matrices."""
import sys
from pathlib import Path
import pdfplumber

pdf_path = Path(r"C:\Users\simon\Downloads\exercices_algebre_KDP_final.pdf")
out_path = Path(__file__).parent / "explore_p11.txt"

page_num = int(sys.argv[1]) if len(sys.argv) > 1 else 11  # 1-indexed

with pdfplumber.open(str(pdf_path)) as pdf:
    page = pdf.pages[page_num - 1]
    words = page.extract_words(use_text_flow=False, keep_blank_chars=False)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(f"# Page {page_num} — {len(words)} words\n")
    # Sort by Y then X for visual order
    sorted_words = sorted(words, key=lambda w: (round(w["top"], 1), w["x0"]))
    for w in sorted_words:
        f.write(
            f"y={w['top']:6.2f}  x0={w['x0']:6.2f}  x1={w['x1']:6.2f}  "
            f"h={w['height']:5.2f}  text={w['text']!r}\n"
        )
print(f"Wrote {len(words)} words to {out_path}")

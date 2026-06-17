"""Extract text from the algebra exercises PDF to a UTF-8 file for further parsing.

Usage:
  python extract_pdf.py            -> writes all pages to ./pdf_extract.txt
  python extract_pdf.py START END  -> writes pages [START, END) to ./pdf_extract.txt
"""
import sys
from pathlib import Path
from pypdf import PdfReader

pdf_path = Path(r"C:\Users\simon\Downloads\exercices_algebre_KDP_final.pdf")
out_path = Path(__file__).parent / "pdf_extract.txt"

if not pdf_path.exists():
    print(f"ERROR: file not found: {pdf_path}")
    sys.exit(1)

reader = PdfReader(str(pdf_path))
total = len(reader.pages)

start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
end = int(sys.argv[2]) if len(sys.argv) > 2 else total

with open(out_path, "w", encoding="utf-8") as f:
    f.write(f"# PDF total pages: {total}\n\n")
    for i in range(start, min(end, total)):
        page = reader.pages[i]
        text = page.extract_text() or ""
        f.write(f"\n========== PAGE {i + 1} ==========\n")
        f.write(text)
        f.write("\n")

print(f"Wrote pages {start}..{min(end, total)} of {total} to {out_path}")
print(f"Size: {out_path.stat().st_size} bytes")

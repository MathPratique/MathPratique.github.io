"""Quick check: how did sub-part splitting affect the JSON?"""
import json
import sys
from pathlib import Path

# Force UTF-8 output so we can print Unicode subscripts on Windows
sys.stdout.reconfigure(encoding="utf-8")

p = Path(__file__).parent.parent / "src" / "data" / "linalg_exercises.json"
data = json.loads(p.read_text(encoding="utf-8"))

# Check a known sub-part case: L2-E1 (the A+B / 3A-2B exercise)
ex = next(e for e in data if e["id"] == "L2-E1")
print(f"=== {ex['id']} ({ex['difficulty']}) ===")
print(f"Steps: {len(ex['steps'])}")
for i, s in enumerate(ex["steps"]):
    if isinstance(s, str):
        print(f"  [{i}] STR: {s[:100]!r}")
    else:
        kind = "text" if s and s[0]["type"] == "text" else s[0]["type"]
        first_str = s[0]["content"][:100] if s[0]["type"] == "text" else "<matrix>"
        print(f"  [{i}] {len(s)} parts, first {kind}: {first_str!r}")

# Count how many exercises now have sub-part badges
sub_count = 0
for ex in data:
    for s in ex.get("steps", []):
        if isinstance(s, list) and s and s[0]["type"] == "text":
            first = s[0]["content"]
            if first and first[0:3] in {"a) ", "b) ", "c) ", "d) ", "e) ", "f) ", "g) ", "h) "}:
                sub_count += 1
                break
print(f"\nExercises with at least one sub-part step: {sub_count}")

# Inspect L1-E1 specifically
print("\n=== L1-E1 inspection ===")
ex = next(e for e in data if e["id"] == "L1-E1")
print("Prompt:")
for p in ex["prompt"]:
    if p["type"] == "text":
        # Show with explicit newlines visible
        print(f"  {p['content']!r}")
print(f"Steps count: {len(ex['steps'])}")
for i, s in enumerate(ex["steps"]):
    if isinstance(s, str):
        print(f"  [{i}] STR: {s[:120]!r}")
    else:
        kind = s[0]["type"]
        first_str = s[0]["content"][:120] if kind == "text" else "<matrix>"
        print(f"  [{i}] {len(s)} parts, first {kind}: {first_str!r}")

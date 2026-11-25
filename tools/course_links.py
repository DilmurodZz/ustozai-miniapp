# Puts the official course links into public/data/kurslar.json, so every "Ilovada ochish" button
# (Kurslar, the course page, the wheel, Kasb Kompasi results, Harvard) opens that exact course in the Ustoz AI app
# (the link opens the app when it is installed on the phone, otherwise the course page on ustoz.ai).
#   python -X utf8 tools/course_links.py "C:\Users\Dilmurod\Downloads\UstozAI-kurslar-havolalari.xlsx"
# The sheet: header row with "Havola" and "Kurs ID"; courses are matched by their ID.
# The links are also kept in tools/course_links.json, which build_kurslar.py keeps (it copies the old courses as they are).
import json, os, sys
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "public", "data", "kurslar.json")
KEEP = os.path.join(ROOT, "tools", "course_links.json")

wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
rows = list(wb.worksheets[0].iter_rows(values_only=True))
head = next(i for i, r in enumerate(rows) if r and "Havola" in r and "Kurs ID" in r)
hi, ii, ni = rows[head].index("Havola"), rows[head].index("Kurs ID"), rows[head].index("Kurs nomi")
links = {}
for r in rows[head + 1:]:
  if not r or not r[ii] or not r[hi]: continue
  u = str(r[hi]).strip()
  assert u.startswith("https://www.ustoz.ai/courses/") and str(r[ii]) in u, f"odd link: {r[ni]} {u}"
  links[str(r[ii]).strip()] = u

d = json.load(open(DATA, encoding="utf-8"))
changed = missing = 0
for c in d["courses"]:
  u = links.get(c["id"])
  if not u: missing += 1; print("not in the sheet, link kept:", c["title"]); continue
  if c.get("url") != u: c["url"] = u; changed += 1
json.dump(d, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(links, open(KEEP, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"links in the sheet {len(links)}, courses {len(d['courses'])}, updated {changed}, not in the sheet {missing}")

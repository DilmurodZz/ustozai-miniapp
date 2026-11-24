# Checks how reliable the Kurslar job data is (public/data/kurslar.json), before it is published.
#
#   python -X utf8 tools/check_kurslar.py <vacancies.xlsx>            automatic checks + a review sheet for a person
#   python -X utf8 tools/check_kurslar.py <vacancies.xlsx> --online   also opens every shown job link on hh.uz (closed ones)
#   python -X utf8 tools/check_kurslar.py --score <review.xlsx>        reads the ticked review sheet and gives the accuracy
#
# Automatic checks (no internet needed):
#   1. counts:      every course type's vacancy count and salary are counted again from the sheet and must equal kurslar.json
#   2. duplicates:  no job shown twice (same title and employer, or same link)
#   3. salaries:    lowest pay <= median, every shown job pays at least the minimum, "from" <= "to", a median only with 5+ salaries
#   4. dates:       every shown job is inside the data period
#   5. titles:      every shown job title is in Uzbek Latin (no Cyrillic left)
# The person check (the part only a person can do): 100 random vacancy-course matches go into an Excel sheet.
# Tick each one "to'g'ri" or "noto'g'ri", then run --score. Pass: 3 mistakes or fewer out of 100 (about 97% correct).
import json, os, re, sys, random, datetime, statistics, math, collections, time
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_kurslar as B

ROOT = B.ROOT
OUT_DIR = os.path.join(os.path.expanduser("~"), "Downloads")
CYR = re.compile(r"[А-Яа-яЁё]")
OK, BAD = "to'g'ri", "noto'g'ri"

def wilson_low(ok, n, z=1.96):
  # the lowest accuracy that 95% confidence allows, from ok correct out of n
  if not n: return 0
  p = ok / n
  return (p + z * z / (2 * n) - z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / (1 + z * z / n)

def checks(xlsx):
  V, fx = B.load_vac(xlsx)
  for v in V: B.prep(v)
  data = json.load(open(B.OUT, encoding="utf-8"))
  groups = data["groups"]
  res = []   # (name, passed, detail lines)

  # 1. counts and salaries recounted from the sheet
  bad = []
  hits = {}
  for g in B.G:
    if g["kind"] != "job" and not g.get("noexp"): continue
    m = B.matcher(g); hit = [v for v in V if m(v)]; hits[g["k"]] = (g, hit)
    j = groups.get(g["k"], {})
    sal = sorted(v["_sal"] for v in hit if v["_sal"])
    med = B.mln(statistics.median(sal)) if len(sal) >= 5 else None
    if j.get("related") != len(hit): bad.append(f"{g['name']}: ilovada {j.get('related')}, qayta sanalganda {len(hit)}")
    if j.get("medianMln") != med: bad.append(f"{g['name']}: o'rtacha maosh ilovada {j.get('medianMln')}, qayta hisoblanganda {med}")
  res.append(("Vakansiyalar soni va maosh qayta hisoblandi", not bad, bad or [f"{len(hits)} ta kurs turi tekshirildi, hammasi mos"]))

  # 2. duplicates
  bad = []
  for k, g in groups.items():
    seen, urls = set(), set()
    for x in g.get("jobs", []):
      key = (x.get("src", x["t"]).lower(), x["e"].lower())
      if key in seen: bad.append(f"{g['name']}: {x['t']} ({x['e']}) ikki marta")
      if x["u"] in urls: bad.append(f"{g['name']}: havola ikki marta {x['u']}")
      seen.add(key); urls.add(x["u"])
  res.append(("Takrorlangan e'lonlar yo'q", not bad, bad or ["Takror topilmadi"]))

  # 3. salaries
  bad = []
  for k, g in groups.items():
    if g.get("lowMln") and g.get("medianMln") and g["lowMln"] > g["medianMln"]: bad.append(f"{g['name']}: eng past maosh o'rtachadan baland")
    if g.get("medianMln") and (g.get("salaried") or 0) < 5: bad.append(f"{g['name']}: o'rtacha maosh 5 tadan kam maosh asosida")
    for x in g.get("jobs", []):
      lo, hi = x.get("lo"), x.get("hi")
      if (lo or hi or 0) < B.MIN_PAY: bad.append(f"{g['name']}: {x['t']} maoshi {B.MIN_PAY} mln dan kam")
      if lo and hi and lo > hi: bad.append(f"{g['name']}: {x['t']} maoshida 'dan' 'gacha'dan katta")
  res.append(("Maoshlar mantiqan to'g'ri", not bad, bad or ["Hammasi to'g'ri"]))

  # 4. dates inside the data period
  dates = sorted(str(v["published_at"])[:10] for v in V)
  first, last = dates[0], dates[-1]
  bad = [f"{g['name']}: {x['t']} sanasi {x['d']}" for g in groups.values() for x in g.get("jobs", []) if not (first <= x["d"] <= last)]
  res.append((f"E'lonlar davr ichida ({first} - {last})", not bad, bad or ["Hammasi davr ichida"]))

  # 5. titles in Uzbek Latin
  bad = [f"{g['name']}: {x['t']}" for g in groups.values() for x in g.get("jobs", []) + g.get("olx", []) if CYR.search(x["t"] + x.get("e", "") + x.get("c", ""))]
  res.append(("Sarlavhalar o'zbek lotinida", not bad, bad or ["Kirill harfi qolmagan"]))
  return V, groups, hits, res, (first, last)

def review_sheet(hits, groups, period, path, n=100):
  # 100 random matches, spread over all course types in proportion to how many vacancies each has
  pairs = [(g, v) for g, hit in hits.values() for v in hit]
  random.seed(period[1])
  pick = random.sample(pairs, min(n, len(pairs)))
  wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Tekshiruv"
  tr = json.load(open(B.TR, encoding="utf-8")) if os.path.exists(B.TR) else {}
  head = ["#", "Kurs turi", "Bu kurs qaysi ishga tayyorlaydi", "Vakansiya (asl nomi)", "Ish beruvchi", "Shahar", "Havola", "Baho", "Izoh", "Vakansiya (o'zbekcha yoki lotin harfida)"]
  ws.append(head)
  for i, (g, v) in enumerate(pick, 1):
    ws.append([i, g["name"], g.get("job", ""), v["_t"], str(v["employer_name"] or ""), str(v["city"] or ""), v["url"], "", "", tr.get(v["_t"], B.translit(v["_t"]))])
    ws.cell(row=i + 1, column=7).hyperlink = v["url"]
  dv = DataValidation(type="list", formula1=f'"{OK},{BAD}"', allow_blank=True); ws.add_data_validation(dv); dv.add(f"H2:H{len(pick) + 1}")
  for c in ws[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="2748F5"); c.alignment = Alignment(wrap_text=True, vertical="center")
  for col, w in zip("ABCDEFGHIJ", [5, 24, 34, 44, 26, 14, 34, 12, 28, 44]): ws.column_dimensions[col].width = w
  for row in ws.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
  ws.freeze_panes = "A2"
  s = wb.create_sheet("Natija")
  last = len(pick) + 1
  rows = [("Qanday tekshirish", "Har bir qatorda: shu vakansiya rostdan ham shu kurs o'rgatadigan ishmi? H ustunida to'g'ri yoki noto'g'ri tanlang."),
          ("Tekshirilgan", f"=COUNTA(Tekshiruv!H2:H{last})"), ("To'g'ri", f'=COUNTIF(Tekshiruv!H2:H{last},"{OK}")'),
          ("Noto'g'ri", f'=COUNTIF(Tekshiruv!H2:H{last},"{BAD}")'), ("Aniqlik", "=IF(B2=0,\"\",B3/B2)"),
          ("O'tish sharti", "100 tadan ko'pi bilan 3 ta noto'g'ri (taxminan 97% aniqlik)"), ("Natija", f'=IF(B2<{len(pick)},"Hali to\'liq tekshirilmagan",IF(B4<=3,"O\'TDI","O\'TMADI"))')]
  for r in rows: s.append(list(r))
  s.column_dimensions["A"].width = 18; s.column_dimensions["B"].width = 90; s["B5"].number_format = "0.0%"
  for c in s["A"]: c.font = Font(bold=True)
  # the 50 most shown job titles with their Uzbek translation, for a quick language check
  t = wb.create_sheet("Tarjimalar")
  t.append(["Asl nomi (hh.uz)", "Ilovadagi o'zbekcha nomi", "Baho", "Izoh"])
  cnt = collections.Counter((x.get("src", x["t"]), x["t"]) for g in groups.values() for x in g.get("jobs", []))
  for (src, uz), _ in cnt.most_common(50): t.append([src, uz, "", ""])
  dv2 = DataValidation(type="list", formula1=f'"{OK},{BAD}"', allow_blank=True); t.add_data_validation(dv2); dv2.add("C2:C51")
  for c in t[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="2748F5")
  for col, w in zip("ABCD", [50, 50, 12, 30]): t.column_dimensions[col].width = w
  wb.save(path)
  return len(pick)

def online(groups):
  # opens every shown hh.uz job: an archived or removed vacancy is reported so it can be dropped before publishing
  import urllib.request
  closed, failed, n = [], [], 0
  for g in groups.values():
    for x in g.get("jobs", []):
      if "hh.uz/vacancy/" not in x["u"]: continue
      n += 1
      try:
        req = urllib.request.Request(x["u"], headers={"User-Agent": "UstozAI-data-check/1.0", "Accept-Language": "ru"})
        html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
        if "Вакансия в архиве" in html or "vacancy-archive" in html: closed.append(f"{g['name']}: {x['t']} ({x['u']})")
      except Exception as e:
        code = getattr(e, "code", None)
        (closed if code == 404 else failed).append(f"{g['name']}: {x['t']} ({x['u']}) {code or e}")
      time.sleep(1)   # one page a second, to be polite to hh.uz
  return n, closed, failed

def score(path):
  wb = openpyxl.load_workbook(path, data_only=True); ws = wb["Tekshiruv"]
  vals = [str(r[7] or "").strip().lower() for r in ws.iter_rows(min_row=2, values_only=True) if r[0]]
  ok, bad = vals.count(OK), vals.count(BAD); n = ok + bad
  print(f"Tekshirilgan: {n} / {len(vals)}  to'g'ri: {ok}  noto'g'ri: {bad}")
  if not n: return
  print(f"Aniqlik: {ok / n:.1%}  (95% ishonch bilan kamida {wilson_low(ok, n):.1%})")
  wrong = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[0] and str(r[7] or "").strip().lower() == BAD]
  if wrong:
    print("Noto'g'ri deb belgilanganlar (shu kurs turi qoidasini tuzatish kerak):")
    for r in wrong: print(f"  #{r[0]} {r[1]}: {r[3]}  {('- ' + str(r[8])) if r[8] else ''}")
  print("NATIJA:", "O'TDI" if n == len(vals) and bad <= 3 else "O'TMADI" if bad > 3 else "hali to'liq tekshirilmagan")

def main():
  if "--score" in sys.argv: return score(sys.argv[sys.argv.index("--score") + 1])
  xlsx = sys.argv[1]
  V, groups, hits, res, period = checks(xlsx)
  day = datetime.date.today().isoformat()
  path = os.path.join(OUT_DIR, f"Kurslar tekshiruvi {day}.xlsx")
  n = review_sheet(hits, groups, period, path)
  lines = [f"# Kurslar ma'lumotlari tekshiruvi, {day}", "", f"Manba: {os.path.basename(xlsx)}, {len(V)} ta vakansiya, davr {period[0]} - {period[1]}", ""]
  for name, ok, detail in res:
    lines.append(f"- {"O'TDI " if ok else "XATO   "} {name}")
    lines += [f"    {d}" for d in detail[:15]]
  if "--online" in sys.argv:
    m, closed, failed = online(groups)
    lines.append(f"- {"O'TDI " if not closed else "XATO   "} Ko'rsatilgan {m} ta hh.uz e'loni ochildi: {len(closed)} tasi yopilgan, {len(failed)} tasini ochib bo'lmadi")
    lines += [f"    yopilgan: {d}" for d in closed[:30]] + [f"    ochilmadi: {d}" for d in failed[:10]]
  else:
    lines.append("-  ...    Havolalar tekshirilmadi: --online bilan ishga tushiring (internet kerak)")
  lines += ["", f"Odam tekshiruvi: {n} ta tasodifiy moslik \"{os.path.basename(path)}\" faylida (Yuklanmalar papkasi).",
            "H ustunida har birini to'g'ri / noto'g'ri deb belgilang, so'ng:", f"  python -X utf8 tools/check_kurslar.py --score \"{path}\""]
  rep = os.path.join(ROOT, "tools", "reports"); os.makedirs(rep, exist_ok=True)
  open(os.path.join(rep, f"check_{day}.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
  print("\n".join(lines))

if __name__ == "__main__":
  main()

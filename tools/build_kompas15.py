# Builds the Kasb Kompasi data from the developer handoff "Kasb-Kompasi-15.docx" (version kk15.1):
#   public/data/kompas15.json      the 15 questions, the 56 course groups, the 119 courses (only what the app needs) and the UI texts
#   tools/kompas15_fixtures.json   the 20 test cases, checked by tools/test_kompas15.js against public/kompas.js
#   public/i18n-ru.js, i18n-en.js  Russian and English for the new question texts, taken from the translations of the
#                                  same questions in the old spelling (only missing keys are added)
#   python -X utf8 tools/build_kompas15.py "C:\Users\Dilmurod\Downloads\Kasb-Kompasi-15.docx"
import json, os, re, subprocess, sys, zipfile
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with zipfile.ZipFile(sys.argv[1]) as z:
  data = json.loads(ET.fromstring(z.read("customXml/kasb15.xml")).text)
assert data["version"] == "kk15.1", data["version"]

def first_sentence(s):
  s = re.sub(r"\s+", " ", s or "").strip()
  m = re.match(r"(.{40,260}?[.!?])(\s|$)", s)
  return (m.group(1) if m else s[:220]).strip()

out = {
  "version": data["version"],
  "questions": [{
    "id": q["id"], "type": q["type"], "theme": q["theme"], "img": q["app_image"], "label": q["label"], "alt": q["alt_uz"],
    "q": q["prompt_uz"], "src": q["source_prompt_uz"],
    "o": [{"c": o["code"], "t": o["text_uz"], "src": o["source_text_uz"]} for o in q["options"]],
    **({"hint": q["hint_uz"]} if q.get("hint_uz") else {}),
  } for q in data["questions"]],
  "routes": [{k: r[k] for k in ("id", "name", "theme", "anchors", "goals", "device", "mode")} for r in data["routes"]],
  "courses": [{
    "no": c["guide_no"], "id": c["id"], "title": c["title"], "url": c["url"], "route": c["route_id"], "price": c["price_uzs"],
    "lessons": c["lessons"], "sec": c["video_seconds"], "teacher": c.get("teacher") or "", "about": first_sentence(c.get("description")),
  } for c in data["courses"]],
  "ui": data["ui"],
}
json.dump(out, open(os.path.join(ROOT, "public", "data", "kompas15.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({"fixtures": data["fixtures"]}, open(os.path.join(ROOT, "tools", "kompas15_fixtures.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# translations: the old app text (straight apostrophe) -> the new text in the handoff's spelling
norm = lambda s: s.replace("‘", "'").replace("’", "'").replace("ʻ", "'").replace("ʼ", "'").replace("«", '"').replace("»", '"')
pairs = []
for q in data["questions"]:
  pairs.append((q["prompt_uz"], q["source_prompt_uz"]))
  pairs += [(o["text_uz"], o["source_text_uz"]) for o in q["options"]]
  if q.get("hint_uz"): pairs.append((q["hint_uz"], q.get("source_hint_uz") or q["hint_uz"]))
for lang in ("ru", "en"):
  path = os.path.join(ROOT, "public", f"i18n-{lang}.js")
  js = open(path, encoding="utf-8").read()
  # the dictionary as the app sees it (the file is JavaScript, so node reads it)
  have = json.loads(subprocess.run(["node", "-e", "const I18N={ru:{},en:{}};eval(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(JSON.stringify(I18N[process.argv[2]]))", path, lang],
                                   capture_output=True, text=True, encoding="utf-8", check=True).stdout)
  add, miss = {}, []
  for new, old in pairs:
    if new in have or new in add: continue
    tr = have.get(norm(old)) or have.get(old)
    if tr: add[new] = tr
    else: miss.append(old)
  if add:
    i = js.rindex("});")
    js = js[:i] + "// Kasb Kompasi kk15.1 texts\n" + "".join(f"{json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)},\n" for k, v in add.items()) + js[i:]
    open(path, "w", encoding="utf-8", newline="").write(js)
  print(lang, "added", len(add), "without a translation", len(miss), miss[:5])
print("questions", len(out["questions"]), "routes", len(out["routes"]), "courses", len(out["courses"]))

# Makes small course pictures for the Kurslar list: public/img/c/<course id>.webp, 360 px wide (sharp on 2x screens), about 15 KB.
# The originals on upload.ustozai-app.uz are 0.2-3 MB each, which made the list slow on mobile data.
#   python -X utf8 tools/build_thumbs.py          only the missing ones
#   python -X utf8 tools/build_thumbs.py --all    all again (after course pictures change on ustoz.ai)
import io, json, os, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "img", "c")
os.makedirs(OUT, exist_ok=True)
courses = json.load(open(os.path.join(ROOT, "public", "data", "kurslar.json"), encoding="utf-8"))["courses"]
made = skipped = failed = 0
for c in courses:
  u, path = c.get("image"), os.path.join(OUT, c["id"] + ".webp")
  if not u: continue
  if os.path.exists(path) and "--all" not in sys.argv: skipped += 1; continue
  try:
    data = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "UstozAI-thumbs/1.0"}), timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert("RGB")
    w = 360; h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=74, method=6)
    made += 1
  except Exception as e:
    failed += 1; print("failed:", c["title"][:40], e)
print(f"made {made}, already there {skipped}, failed {failed}")

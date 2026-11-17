# Lists the Uzbek interface texts that still need a Russian or English translation.
#   python -X utf8 tools/i18n_keys.py            -> prints missing keys for ru and en
#   python -X utf8 tools/i18n_keys.py --all      -> prints every key found
# Keys come from: T("...") calls, visible text in the screen templates (between tags and in plain strings),
# and the Kurslar labels in data/kurslar.json (course type texts, levels). Course titles, descriptions and job
# titles are data and are not translated.
import re, json, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
FILES = ["app.js", "courses.js", "data.js", "duo.js", "game.js", "profile.js", "tools.js"]

def js_unescape(s):
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), s)

UZ = re.compile(r"[A-Za-z][a-z]*('|ʻ|’)?[a-z]+")
CODE = re.compile(r"^(#|\.|/|https?:|data:|[a-z]+[A-Z]|[a-z-]+$|[A-Z_]+$|\$\{|[0-9.]+(px|s|ms|%)?$)|[{};=<>]|=>|\(\)|\bvar\(|\brgba?\(")
UZWORDS = re.compile(r"\b(va|bilan|uchun|siz|sizning|qiling|o'|bo'l|kerak|yo'q|ha|ta|kun|soat|daqiqa|tanga|ball|ish|kurs|o'yin|boshlash|yangi|qayta|davom|chiqish|ulash|saqlash|bosqich|rekord|yugur|rasm|tayyor|kod|do'st|ovoz|xarita|manzil|savol|javob|to'g'ri|xato|g'alaba|tugadi|kuch|qalqon|sakrash|salto|gilam|tezlashdi|ketdik|olma|hoy|maktab|reyting|haftalik|bozor|dengiz|ichida|keyingi|qoldi|internet|ilova|ochilmadi|kamera|ruxsat|ulanmoqda|uzildi|yolg'iz|ismingiz|rang|o'yinchi|onlayn|ikkalangiz|ulanish|tanlang|kiriting|kiritting|boshqa|ko'rish|ulashish|lahza|zo'r|juda|yaqin|chap|o'ng|tepaga|pastga|bosing|suring|yuqori|past|o'rtacha|talab|vakansiya|maosh|yo'nalish|kasb|tip|natija|moslik|darajasi|kutiladigan|tavsiya|etilgan|topshirish|qaytadan|qatnashaman|hudud|viloyat|o'quvchi|profil|tanlov|asosiy|kurslar|chegirma|vositalar|mutolaa|kashf|tez kunda|xabar|ber|bering|ochish|yuklab|bepul|nusxa)\b", re.I)

def literals(src):
    out = set()
    for m in re.finditer(r'\bT\(\s*"((?:[^"\\]|\\.)*)"', src): out.add(js_unescape(m.group(1)))
    for m in re.finditer(r"\bT\(\s*'((?:[^'\\]|\\.)*)'", src): out.add(js_unescape(m.group(1)))
    return out

def visible(src):
    out = set()
    # text between tags inside templates
    for m in re.finditer(r">([^<>`$]{2,})<", src):
        t = m.group(1).strip()
        if t and UZ.search(t) and not CODE.search(t): out.add(t)
    # text before ${ or after } inside templates: e.g. "Saqlangan o'yin: ${...}"
    for m in re.finditer(r">([^<>`$]{3,})\$\{", src):
        t = m.group(1).strip()
        if UZWORDS.search(t): out.add(t)
    # plain double-quoted strings that read like Uzbek sentences or labels
    for m in re.finditer(r'"((?:[^"\\]|\\.){2,})"', src):
        t = js_unescape(m.group(1)).strip()
        if " " in t or UZWORDS.search(t):
            if UZWORDS.search(t) and not CODE.search(t) and not re.search(r"[<>]", t): out.add(t)
    return out

def data_keys():
    d = json.load(open(os.path.join(ROOT, "data", "kurslar.json"), encoding="utf-8"))
    out = set()
    for g in d["groups"].values():
        for k in ("job", "note", "mnote", "hint", "name", "level"):
            if g.get(k): out.add(g[k])
        if g.get("level"): out.add("Talab " + g["level"].lower() + ": {n} ta ish")
    return out

def all_keys():
    keys = set()
    for f in FILES:
        src = open(os.path.join(ROOT, f), encoding="utf-8").read()
        keys |= literals(src)
        if f not in ("profile.js", "tools.js"): keys |= visible(src)
    keys |= data_keys()
    return {k for k in keys if k.strip() and re.search(r"[A-Za-z]{2}", k)}

def existing(lang):
    p = os.path.join(ROOT, f"i18n-{lang}.js")
    src = open(p, encoding="utf-8").read()
    return {js_unescape(m.group(1)) for m in re.finditer(r'^\s*"((?:[^"\\]|\\.)*)"\s*:', src, re.M)}

if __name__ == "__main__":
    keys = all_keys()
    if "--all" in sys.argv:
        for k in sorted(keys): print(k)
    else:
        for lang in ("ru", "en"):
            miss = sorted(keys - existing(lang))
            print(f"--- {lang}: {len(miss)} missing of {len(keys)}")
            for k in miss: print(k)

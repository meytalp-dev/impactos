# -*- coding: utf-8 -*-
"""Build the self-contained רצף services verifier from oti-services.xlsx.

Reads the 'הכול' sheet, normalises rows, injects them as JSON into the
template (tools/retzef-services-verifier-template.html) and writes the final
mobile page to tools/retzef-services-verifier.html.
"""
import json
import os
import re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# xlsx lives in the user's Downloads folder (same place the foundations file did)
XLSX = os.path.join(os.path.expanduser("~"), "Downloads", "oti-services.xlsx")
TEMPLATE = os.path.join(HERE, "retzef-services-verifier-template.html")
CHECKS = os.path.join(HERE, "retzef-checks.json")
OUT = os.path.join(HERE, "retzef-services-verifier.html")

# normalise recommendation strings -> internal kind
REC_MAP = {
    "positive": "positive",
    "warm": "positive",      # only 3 rows, treat as positive
    "neutral": "neutral",
    "pending": "pending",
    "mixed": "mixed",
    "negative": "negative",
}
CONF_MAP = {"high": "high", "medium": "medium", "low": "low"}


def clean(v):
    if v is None:
        return ""
    s = str(v).strip()
    return s


def slug(s, i):
    base = re.sub(r"[^\w֐-׿]+", "-", s).strip("-").lower()
    return f"r{i:04d}-{base[:40]}" if base else f"r{i:04d}"


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["הכול"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [clean(h) for h in rows[0]]

    def idx(name):
        return hdr.index(name)

    i_name = idx("שם")
    i_cat = idx("קטגוריה")
    i_sub = idx("תת-קטגוריה")
    i_ages = idx("גילאים")
    i_region = idx("אזור")
    i_phone = idx("טלפון")
    i_web = idx("אתר")
    i_spec = idx("התמחות")
    i_rec = idx("המלצה")
    i_conf = idx("ביטחון")
    i_ment = idx("תדירות אזכור")
    i_quote = idx("הקשר/ציטוט")
    i_notes = idx("הערות")

    # optional automated checks (websites / phones / duplicates)
    checks = {}
    if os.path.exists(CHECKS):
        with open(CHECKS, encoding="utf-8") as f:
            checks = json.load(f)
        print(f"merging {len(checks)} automated checks from retzef-checks.json")

    def attach_checks(item):
        rec = checks.get(item["_id"])
        if not rec:
            return
        item["_site_status"] = rec.get("site_status", "none")
        item["_phone_status"] = rec.get("phone_status", "none")
        if rec.get("duplicate"):
            item["_duplicate"] = rec["duplicate"]
        site_ok = item["_site_status"] in ("live", "redirect", "blocked")
        phone_ok = item["_phone_status"] in ("ok", "partial")
        item["_no_contact"] = (not site_ok) and (not phone_ok)
        # conservative auto-recommendation: only genuine, actionable problems
        if item["_site_status"] == "dead":
            item["_auto_status"] = "review"
            note = "האתר רשום אבל לא נטען"
            if rec.get("site_note"):
                note += f" ({rec['site_note']})"
            item["_auto_note"] = note
        elif item["_phone_status"] == "invalid":
            item["_auto_status"] = "review"
            item["_auto_note"] = rec.get("phone_note", "טלפון בפורמט לא תקין")

    items = []
    # category order from first appearance
    cat_order = []
    cat_counts = {}
    for n, r in enumerate(rows[1:], start=1):
        def g(i):
            return clean(r[i]) if i < len(r) else ""
        name = g(i_name)
        if not name:
            continue
        cat = g(i_cat) or "ללא קטגוריה"
        rec_raw = g(i_rec).lower()
        rec = REC_MAP.get(rec_raw, "neutral")
        conf = CONF_MAP.get(g(i_conf).lower(), "")
        if cat not in cat_counts:
            cat_order.append(cat)
            cat_counts[cat] = 0
        cat_counts[cat] += 1
        item = {
            "_id": slug(name, n),
            "_section": cat,
            "_rec": rec,
            "name": name,
            "subcat": g(i_sub),
            "ages": g(i_ages),
            "region": g(i_region),
            "phone": g(i_phone),
            "website": g(i_web),
            "specialty": g(i_spec),
            "rec_raw": rec_raw,
            "conf": conf,
            "mentions": g(i_ment),
            "quote": g(i_quote),
            "notes": g(i_notes),
        }
        attach_checks(item)
        items.append(item)

    # build category chips html
    chips = []
    for c in cat_order:
        chips.append(
            f'<button class="chip" data-cat="{c}">{c} '
            f'<span class="count">{cat_counts[c]}</span></button>'
        )
    cat_chips_html = "\n    ".join(chips)

    data_json = json.dumps(items, ensure_ascii=False)

    with open(TEMPLATE, encoding="utf-8") as f:
        tpl = f.read()

    html = tpl.replace("__CAT_CHIPS__", cat_chips_html).replace("__DATA__", data_json)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"OK  {len(items)} services across {len(cat_order)} categories")
    print(f"    -> {OUT}")
    for c in cat_order:
        print(f"      {cat_counts[c]:4d}  {c}")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Deterministic enrichment for the רצף services list (no web access).

  1. Normalise Israeli phone numbers -> clean display + tel target.
  2. Infer websites for contact-less rows by matching their org "base name"
     to a sibling row in the same org family that already has a website
     (e.g. 'בית אקשטיין — סניף X' inherits b-e.org.il).
  3. Emit a human review doc of shared phone / website families.

Writes tools/retzef-enrich.json (merged by build-retzef-verifier.py) and
_handoff/retzef-related-groups.md (for eyeballing the families).
"""
import json
import os
import re
from collections import defaultdict

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
XLSX = os.path.join(os.path.expanduser("~"), "Downloads", "oti-services.xlsx")
ENRICH = os.path.join(HERE, "retzef-enrich.json")
REVIEW = os.path.join(ROOT, "_handoff", "retzef-related-groups.md")


def clean(v):
    return "" if v is None else str(v).strip()


def slug(s, i):
    base = re.sub(r"[^\w֐-׿]+", "-", s).strip("-").lower()
    return f"r{i:04d}-{base[:40]}" if base else f"r{i:04d}"


# ---------- phone normalisation ----------
def norm_phone(raw):
    raw = clean(raw)
    if not raw:
        return "", ""
    first = re.split(r"[\/,;|]| או ", raw)[0]
    d = re.sub(r"\D", "", first)
    if d.startswith("972"):
        d = "0" + d[3:]
    if re.match(r"^0(5\d|7\d)\d{7}$", d):          # mobile 10 digits
        return f"{d[0:3]}-{d[3:]}", d
    if re.match(r"^0[2-489]\d{7}$", d):             # landline 9 digits
        return f"{d[0:2]}-{d[2:]}", d
    star = re.match(r"^\*\d{3,4}$", first.strip())
    if star:
        return first.strip(), first.strip()
    return "", ""  # not a clean single number -> leave original in place


# ---------- org-family base name ----------
STOP_BASES = {"מרכז", "מכון", "עמותה", "בית", "אגודת", "קרן", "ארגון", "מוסד",
              "גן", "בית ספר", "שירות", "תכנית", "תוכנית", "מרפאת", "מעון",
              "דיור", "ביטוח לאומי", "משרד החינוך"}


def org_base(name):
    name = clean(name)
    # cut at the first separator that introduces a branch/qualifier
    base = re.split(r"\s[—–\-]\s|\s\(|,|/", name)[0].strip()
    base = base.strip("\"'״׳ ")
    return base


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["הכול"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [clean(h) for h in rows[0]]
    i_name, i_phone, i_web = hdr.index("שם"), hdr.index("טלפון"), hdr.index("אתר")

    recs = []
    for n, r in enumerate(rows[1:], start=1):
        name = clean(r[i_name]) if i_name < len(r) else ""
        if not name:
            continue
        recs.append({
            "_id": slug(name, n),
            "name": name,
            "phone": clean(r[i_phone]) if i_phone < len(r) else "",
            "website": clean(r[i_web]) if i_web < len(r) else "",
            "base": org_base(name),
        })

    def normweb(u):
        u = (u or "").strip().lower()
        u = re.sub(r"^https?://", "", u)
        u = re.sub(r"^www\.", "", u)
        return u.rstrip("/")

    # website by org base (only specific bases, single distinct site)
    base_sites = defaultdict(set)
    for x in recs:
        if x["website"] and x["base"] and x["base"] not in STOP_BASES and len(x["base"]) >= 5:
            base_sites[x["base"]].add(x["website"].strip())

    enrich = {}
    inherited = 0
    pnorm_count = 0
    for x in recs:
        rec = {}
        disp, tel = norm_phone(x["phone"])
        if disp:
            rec["phone_norm"] = disp
            rec["phone_tel"] = tel
            if disp.replace("-", "") != re.sub(r"\D", "", x["phone"]):
                pnorm_count += 1
        # inherit a website from an org sibling when this row has none
        if not x["website"] and x["base"] in base_sites and len(base_sites[x["base"]]) == 1:
            rec["found_website"] = next(iter(base_sites[x["base"]]))
            rec["found_website_src"] = "family"
            inherited += 1
        if rec:
            enrich[x["_id"]] = rec

    with open(ENRICH, "w", encoding="utf-8") as f:
        json.dump(enrich, f, ensure_ascii=False, indent=0)

    # ---- review doc: shared phone / website families ----
    def dig(s):
        return re.sub(r"\D", "", s or "")
    pg = defaultdict(list)
    wg = defaultdict(list)
    for x in recs:
        if x["phone"]:
            pg[dig(x["phone"])].append(x["name"])
        if x["website"]:
            wg[normweb(x["website"])].append(x["name"])
    pgroups = {k: v for k, v in pg.items() if len(v) > 1}
    wgroups = {k: v for k, v in wg.items() if len(v) > 1}

    lines = ["# מענים קשורים · רצף (טלפון/אתר משותף)\n",
             "> נוצר אוטומטית. אלה **לא כפילויות למחיקה** — אלה שירותים שונים של אותו ארגון ",
             "(סניפים/שלוחות/יחידות) שחולקים פרטי קשר. לעיון בלבד.\n",
             f"\n**{len(wgroups)} משפחות לפי אתר משותף · {len(pgroups)} לפי טלפון משותף**\n",
             "\n## לפי אתר משותף\n"]
    for site, names in sorted(wgroups.items(), key=lambda x: -len(x[1])):
        lines.append(f"- **{site}** ({len(names)}): " + " · ".join(names))
    lines.append("\n## לפי טלפון משותף\n")
    for ph, names in sorted(pgroups.items(), key=lambda x: -len(x[1])):
        label = ph if ph else "(ריק)"
        lines.append(f"- **{label}** ({len(names)}): " + " · ".join(names))
    with open(REVIEW, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"phones normalised (reformatted): {pnorm_count}")
    print(f"websites inherited from org family: {inherited}")
    print(f"shared-website families: {len(wgroups)} | shared-phone families: {len(pgroups)}")
    print(f"-> {ENRICH}")
    print(f"-> {REVIEW}")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Automated data checks for the רצף services list.

For every row in oti-services.xlsx ('הכול' sheet):
  - website  : HTTP-check the URL (live / redirect / dead / no-url)
  - phone    : validate Israeli phone format
  - contact  : flag rows with neither website nor phone
  - duplicate: flag repeated name / phone / website

Writes tools/retzef-checks.json keyed by the same _id slug the build script
uses, so build-retzef-verifier.py can merge the results into the page.
"""
import concurrent.futures as cf
import json
import os
import re
import ssl
import urllib.request
import urllib.error
from collections import Counter

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(os.path.expanduser("~"), "Downloads", "oti-services.xlsx")
OUT = os.path.join(HERE, "retzef-checks.json")

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
TIMEOUT = 9
WORKERS = 20
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def clean(v):
    return "" if v is None else str(v).strip()


def slug(s, i):
    base = re.sub(r"[^\w֐-׿]+", "-", s).strip("-").lower()
    return f"r{i:04d}-{base[:40]}" if base else f"r{i:04d}"


def ensure_url(u):
    u = clean(u)
    if not u:
        return ""
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u
    return u


# ---- phone validation (Israel) ----
def check_phone(raw):
    raw = clean(raw)
    if not raw:
        return {"phone_status": "none"}
    # could be several numbers separated by / , ;
    parts = re.split(r"[\/,;|]| או ", raw)
    digitsets = []
    for p in parts:
        d = re.sub(r"\D", "", p)
        if d.startswith("972"):
            d = "0" + d[3:]
        if d:
            digitsets.append(d)
    if not digitsets:
        return {"phone_status": "invalid", "phone_note": "אין ספרות בשדה הטלפון"}
    bad = []
    ok = []
    for d in digitsets:
        # mobile 05X = 10 digits; landline 0X = 9 digits; *NNNN short codes ok
        if re.match(r"^0(5\d|7\d)\d{7}$", d):          # mobile / VoIP 10 digits
            ok.append(d)
        elif re.match(r"^0[2-489]\d{7}$", d):           # landline 9 digits
            ok.append(d)
        elif re.match(r"^\*\d{3,4}$", clean(raw)):       # *2000 style
            ok.append(d)
        elif 3 <= len(d) <= 5:                            # short service code
            ok.append(d)
        else:
            bad.append(d)
    if ok and not bad:
        return {"phone_status": "ok"}
    if ok and bad:
        return {"phone_status": "partial", "phone_note": f"חלק מהמספרים חשודים: {', '.join(bad)}"}
    return {"phone_status": "invalid", "phone_note": f"פורמט לא תקין: {raw}"}


# ---- website check ----
def check_site(url):
    url = ensure_url(url)
    if not url:
        return {"site_status": "none"}
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=CTX) as resp:
            final = resp.geturl()
            code = resp.status
            redirected = final.rstrip("/") != url.rstrip("/")
            out = {"site_status": "live", "site_code": code, "site_final": final}
            if redirected:
                out["site_status"] = "redirect"
            return out
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 405, 406, 429, 503):
            # server is up but blocks bots — treat as live-ish, needs eyeball
            return {"site_status": "blocked", "site_code": e.code}
        return {"site_status": "dead", "site_code": e.code, "site_note": f"HTTP {e.code}"}
    except (urllib.error.URLError, ssl.SSLError, TimeoutError, ConnectionError) as e:
        reason = getattr(e, "reason", e)
        return {"site_status": "dead", "site_note": str(reason)[:120]}
    except Exception as e:  # noqa
        return {"site_status": "dead", "site_note": str(e)[:120]}


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["הכול"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [clean(h) for h in rows[0]]
    i_name, i_phone, i_web = hdr.index("שם"), hdr.index("טלפון"), hdr.index("אתר")

    records = []
    for n, r in enumerate(rows[1:], start=1):
        name = clean(r[i_name]) if i_name < len(r) else ""
        if not name:
            continue
        records.append({
            "_id": slug(name, n),
            "name": name,
            "phone": clean(r[i_phone]) if i_phone < len(r) else "",
            "website": clean(r[i_web]) if i_web < len(r) else "",
        })

    # duplicates by normalised name / phone / website
    def norm(s):
        return re.sub(r"\s+", " ", clean(s).lower())
    name_c = Counter(norm(x["name"]) for x in records)
    phone_c = Counter(re.sub(r"\D", "", x["phone"]) for x in records if x["phone"])
    web_c = Counter(ensure_url(x["website"]).rstrip("/").lower() for x in records if x["website"])

    checks = {}
    sites_to_check = [x for x in records if x["website"]]
    print(f"checking {len(sites_to_check)} websites with {WORKERS} workers...", flush=True)

    site_results = {}
    with cf.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        fut = {ex.submit(check_site, x["website"]): x["_id"] for x in sites_to_check}
        done = 0
        for f in cf.as_completed(fut):
            site_results[fut[f]] = f.result()
            done += 1
            if done % 40 == 0:
                print(f"  {done}/{len(sites_to_check)}", flush=True)

    for x in records:
        rec = {}
        rec.update(check_phone(x["phone"]))
        rec.update(site_results.get(x["_id"], {"site_status": "none"}))
        dups = []
        if name_c[norm(x["name"])] > 1:
            dups.append("שם")
        if x["phone"] and phone_c[re.sub(r'\D', '', x["phone"])] > 1:
            dups.append("טלפון")
        if x["website"] and web_c[ensure_url(x["website"]).rstrip("/").lower()] > 1:
            dups.append("אתר")
        if dups:
            rec["duplicate"] = dups
        # overall auto recommendation
        no_contact = rec.get("site_status") == "none" and rec.get("phone_status") in ("none", "invalid")
        if no_contact:
            rec["auto_status"] = "review"
            rec["auto_note"] = "אין אתר ואין טלפון תקין — אין דרך ליצור קשר"
        elif rec.get("site_status") == "dead":
            rec["auto_status"] = "review"
            rec["auto_note"] = "האתר לא נטען" + (f" ({rec.get('site_note','')})" if rec.get("site_note") else "")
        elif rec.get("phone_status") == "invalid":
            rec["auto_status"] = "review"
            rec["auto_note"] = rec.get("phone_note", "טלפון בפורמט לא תקין")
        checks[x["_id"]] = rec

    summary = Counter(v.get("site_status") for v in checks.values())
    psummary = Counter(v.get("phone_status") for v in checks.values())
    autoc = Counter(v.get("auto_status") for v in checks.values() if v.get("auto_status"))
    dupc = sum(1 for v in checks.values() if v.get("duplicate"))

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(checks, f, ensure_ascii=False, indent=0)

    print("\n=== DONE ===")
    print("site:", dict(summary))
    print("phone:", dict(psummary))
    print("auto-flagged (review):", dict(autoc))
    print("rows with duplicate signal:", dupc)
    print("->", OUT)


if __name__ == "__main__":
    main()

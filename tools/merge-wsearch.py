# -*- coding: utf-8 -*-
"""Merge the web-search agent results into retzef-enrich.json.

Reads tools/_wsearch/batch-*.json, HTTP-validates each found website, and
merges found websites/phones into the enrich file (without clobbering the
deterministic family-inheritance + phone_norm already there).
"""
import concurrent.futures as cf
import glob
import json
import os
import re
import ssl
import urllib.request
import urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
ENRICH = os.path.join(HERE, "retzef-enrich.json")
BATCHES = glob.glob(os.path.join(HERE, "_wsearch", "batch-*.json"))

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def ensure_url(u):
    u = (u or "").strip()
    if not u:
        return ""
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u
    return u


def norm_phone(raw):
    raw = (raw or "").strip()
    d = re.sub(r"\D", "", re.split(r"[\/,;|]| או ", raw)[0])
    if d.startswith("972"):
        d = "0" + d[3:]
    if re.match(r"^0(5\d|7\d)\d{7}$", d):
        return f"{d[0:3]}-{d[3:]}"
    if re.match(r"^0[2-489]\d{7}$", d):
        return f"{d[0:2]}-{d[2:]}"
    return raw  # keep whatever the agent returned


def check(url):
    url = ensure_url(url)
    if not url:
        return "none"
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=9, context=CTX) as r:
            return "live"
    except urllib.error.HTTPError as e:
        return "blocked" if e.code in (401, 403, 405, 406, 429, 503) else "dead"
    except Exception:
        return "dead"


def main():
    enrich = {}
    if os.path.exists(ENRICH):
        with open(ENRICH, encoding="utf-8") as f:
            enrich = json.load(f)

    found = {}
    for bf in sorted(BATCHES):
        try:
            arr = json.load(open(bf, encoding="utf-8"))
        except Exception as e:
            print("skip", bf, e)
            continue
        for it in arr:
            _id = it.get("_id")
            if _id:
                found[_id] = it

    # validate websites concurrently
    sites = {i: ensure_url(v.get("website")) for i, v in found.items() if v.get("website")}
    print(f"validating {len(sites)} found websites...")
    statuses = {}
    with cf.ThreadPoolExecutor(max_workers=20) as ex:
        futs = {ex.submit(check, u): i for i, u in sites.items()}
        for fut in cf.as_completed(futs):
            statuses[futs[fut]] = fut.result()

    added_site = added_dead = added_phone = 0
    for _id, v in found.items():
        rec = enrich.get(_id, {})
        url = ensure_url(v.get("website"))
        if url and not rec.get("found_website"):
            st = statuses.get(_id, "none")
            rec["found_website"] = url
            rec["found_website_src"] = "facebook" if v.get("source") == "facebook" else "web"
            rec["found_website_status"] = st
            rec["found_confidence"] = v.get("confidence", "")
            if st == "dead":
                added_dead += 1
            else:
                added_site += 1
        ph = norm_phone(v.get("phone"))
        if ph and not rec.get("phone_norm") and not rec.get("found_phone"):
            rec["found_phone"] = ph
            added_phone += 1
        if rec:
            enrich[_id] = rec

    with open(ENRICH, "w", encoding="utf-8") as f:
        json.dump(enrich, f, ensure_ascii=False, indent=0)

    print(f"added websites (live/redirect/blocked): {added_site}")
    print(f"found-but-dead websites (kept, flagged): {added_dead}")
    print(f"added phones: {added_phone}")
    print(f"total enrich records now: {len(enrich)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Batch-download aircraft photos from aviation-history.com for offline triage.

    python scripts/scrape_aviation_history.py --out D:/Trabajo-Final/av-history

Walks the aircraft index, follows each type page, saves every content image to
<out>/<manufacturer>/<file>.jpg and appends a manifest.tsv (image URL, source
page, local path) so provenance survives the triage.

The images are third-party and copyrighted: this is a private staging area.
Nothing here may be committed to NodeVSP-Surveying (see CLAUDE.md rule 2) --
picks go to NodeVSP's private docs/local/aircraft_photos/.
robots.txt (2026-09-19) disallows only /download/, which this never touches.
"""
import argparse, http.client, re, sys, time, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse

BASE = "http://www.aviation-history.com/"
INDEX = BASE + "index-aircraft.htm"
UA = "Mozilla/5.0 (compatible; aircraft-photo-triage/1.0)"

# 1990s HTML, no parser needed: quoted attrs only, tags never nested in attrs.
LINKS = re.compile(r'href="([^"]+\.html?)"', re.I)
IMGS = re.compile(r'(?:<img[^>]+src|href)="([^"]+\.(?:jpe?g|png|gif))"', re.I)
# site chrome: nav buttons, logos, banners -- all live under /images/
CHROME = re.compile(r'/images/|logo|banner|spacer', re.I)


# some filenames carry literal spaces ("RAAF_Mk8 _No77Sqn-2a.jpg")
FETCH_ERRORS = (urllib.error.URLError, http.client.HTTPException, OSError, ValueError)


def get(url):
    p = urlparse(url)
    url = p._replace(path=quote(unquote(p.path))).geturl()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def page_links(html, base):
    """Aircraft type pages: /<manufacturer>/<type>.htm, never an index."""
    out = []
    for href in LINKS.findall(html):
        url = urljoin(base, href.strip())
        p = urlparse(url)
        if p.netloc != urlparse(BASE).netloc:
            continue
        parts = p.path.strip("/").split("/")
        if len(parts) == 2 and not parts[1].startswith("index"):
            out.append(url)
    return dict.fromkeys(out)  # dedupe, keep order


def image_links(html, base):
    urls = (urljoin(base, s.strip()) for s in IMGS.findall(html))
    return dict.fromkeys(u for u in urls if not CHROME.search(urlparse(u).path))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", type=Path, required=True, help="staging dir (outside any repo)")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between requests")
    ap.add_argument("--limit", type=int, help="stop after N aircraft pages (smoke test)")
    ap.add_argument("--dry-run", action="store_true", help="list what would download")
    a = ap.parse_args()

    pages = list(page_links(get(INDEX).decode("latin-1"), INDEX))[: a.limit]
    print(f"{len(pages)} aircraft pages", file=sys.stderr)

    manifest = a.out / "manifest.tsv"
    got = new = 0
    for i, page in enumerate(pages, 1):
        time.sleep(a.delay)
        try:
            html = get(page).decode("latin-1")
        except FETCH_ERRORS as e:
            print(f"!! {page}: {e}", file=sys.stderr)
            continue
        for img in image_links(html, page):
            got += 1
            dest = a.out / unquote(urlparse(img).path).lstrip("/")
            if a.dry_run:
                print(f"{img} -> {dest}")
                continue
            if dest.exists():
                continue
            time.sleep(a.delay)
            try:
                data = get(img)
            except FETCH_ERRORS as e:
                print(f"!! {img}: {e}", file=sys.stderr)
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            with manifest.open("a", encoding="utf-8") as f:
                f.write(f"{img}\t{page}\t{dest.relative_to(a.out)}\n")
            new += 1
        print(f"[{i}/{len(pages)}] {page}  ({new} new / {got} seen)", file=sys.stderr)
    print(f"done: {new} new files, {got} images seen -> {a.out}", file=sys.stderr)


def selfcheck():
    html = '''<a HREF="/north-american/p51.html">P-51</a><a href="/index-engine.htm">x</a>
    <img border="0" src="/images/home.jpg"><img src="p51-9c.jpg"><IMG SRC=" p51-11a.jpg">'''
    assert list(page_links(html, INDEX)) == [BASE + "north-american/p51.html"]
    assert list(image_links(html, BASE + "north-american/p51.html")) == [
        BASE + "north-american/p51-9c.jpg", BASE + "north-american/p51-11a.jpg"]
    print("selfcheck ok")


if __name__ == "__main__":
    selfcheck() if "--selfcheck" in sys.argv else main()

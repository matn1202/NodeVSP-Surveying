"""Copy a NodeVSP stimulus bake into `public/stimuli/`, renaming by opaque id.

    python scripts/import_stimuli.py <baked-dir> [--gallery <gallery.json>] [--dry-run]

`<baked-dir>` is NodeVSP's `docs/local/stimuli/`, whose folders are named by the
slugified gallery TITLE. That slug names the aircraft, so it must not reach a
served URL -- see CLAUDE.md, rule 1. Each folder's `parts.obj.gz` is copied to
`public/stimuli/<id>/` where `<id>` is `sha1(<vsp3 filename>)[:8]`, the same id
`api/_stimuli.json` holds. Only the 3D model is taken: the bake's silhouette PNGs
are deliberately not used (too coarse), and the still images the game shows are
rendered from the OBJ by `scripts/render_stills.mjs` after an import.

Going slug -> filename needs the titles, which are deliberately not in this repo.
They come from NodeVSP's `service/examples/gallery.json`, found relative to the
bake directory (`<baked-dir>/../../../service/examples/gallery.json`, i.e. the bake
sitting at its documented `docs/local/stimuli/`) or named with `--gallery`.
Nothing here writes to NodeVSP.
"""
import hashlib
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STIMULI = os.path.join(ROOT, "api", "_stimuli.json")
OUT = os.path.join(ROOT, "public", "stimuli")


def slugify(s):
    """Gallery title -> folder name. Must match bake_stimuli.py's slug exactly.

    If a bake ever lands folders this does not reproduce, fix it HERE to match
    the bake -- the bake is upstream and this repo does not edit it."""
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def sid(filename):
    return hashlib.sha1(filename.encode()).hexdigest()[:8]


def main(src, gallery, dry):
    table = json.load(open(STIMULI, encoding="utf-8"))
    known = set(table.values())

    if gallery is None:
        gallery = os.path.join(src, os.pardir, os.pardir, os.pardir,
                               "service", "examples", "gallery.json")
    if not os.path.exists(gallery):
        sys.exit(f"gallery.json not found at {os.path.abspath(gallery)} -- pass "
                 "--gallery <path> if the bake is not at docs/local/stimuli/.")
    entries = json.load(open(gallery, encoding="utf-8"))

    # A collision would silently merge two aircraft's stimuli, so assert rather
    # than trust: all 86 slugs were distinct when this repo was set up, and the
    # corpus can grow.
    slugs = {}
    for e in entries:
        s = slugify(e["title"])
        if s in slugs:
            sys.exit(f"slug collision: {e['title']!r} and {slugs[s]!r} both "
                     f"slugify to {s!r}. Two aircraft would share one folder.")
        slugs[s] = e["file"]

    # `_stimuli.json` is the owner's curated keep-list (59 of 86), not a copy of
    # the gallery: a gallery model missing from it is excluded ON PURPOSE and is
    # skipped, never imported. The reverse -- a kept file the gallery no longer
    # has -- means the corpus was renamed under us, and that is fatal.
    gone = known - set(slugs.values())
    if gone:
        sys.exit(f"in _stimuli.json but not in gallery.json: {sorted(gone)}")

    moved = skipped = 0
    for slug, filename in sorted(slugs.items()):
        if filename not in known:
            continue
        a = os.path.join(src, slug)
        obj = os.path.join(a, "parts.obj.gz")
        if not os.path.exists(obj):
            skipped += 1
            continue
        b = os.path.join(OUT, sid(filename))
        print(f"{slug:44s} -> public/stimuli/{sid(filename)}/")
        if not dry:
            os.makedirs(b, exist_ok=True)  # never rmtree: the stills baked into it stay
            shutil.copy2(obj, os.path.join(b, "parts.obj.gz"))
        moved += 1

    # A bake folder matching no slug is NOT harmless silence: it is what
    # slugify drifting from the bake looks like, and the symptom is half the
    # stimulus set quietly missing rather than an error.
    stray = sorted(d for d in os.listdir(src)
                   if os.path.isdir(os.path.join(src, d)) and d not in slugs)
    for d in stray:
        print(f"  ! {d} matches no gallery title -- not imported")

    if not dry:
        # The client's list of what exists: ids only, plus whether 3D shipped.
        # It cannot read api/_stimuli.json (that maps ids to filenames).
        idx = {d: os.path.exists(os.path.join(OUT, d, "parts.obj.gz"))
               for d in sorted(os.listdir(OUT)) if os.path.isdir(os.path.join(OUT, d))}
        with open(os.path.join(OUT, "index.json"), "w") as fh:
            json.dump(idx, fh, indent=1)

    print(f"\n{moved} imported, {skipped} absent from the bake, "
          f"{len(stray)} unmatched{' (dry run, nothing written)' if dry else ''}")


if __name__ == "__main__":
    argv = sys.argv[1:]
    pos = [a for a in argv if not a.startswith("-")]
    if not pos:
        sys.exit(__doc__)
    g = None
    if "--gallery" in argv:
        g = argv[argv.index("--gallery") + 1]
        pos = [p for p in pos if p != g]
    main(pos[0], g, "--dry-run" in argv)

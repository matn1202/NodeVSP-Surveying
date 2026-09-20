"""Copy NodeVSP's generated briefs for the kept models into `public/briefs.json`.

    python scripts/import_briefs.py [<path-to-NodeVSP>]      (default ../NodeVSP)

Feeds the discrimination game. Output is `{<id>: {<level>: <brief text>}}` --
ids, never filenames, and only the 59 in `api/_stimuli.json`.

Two things this does that a plain copy would not:

* Any brief NodeVSP's own `leaks()` says names its aircraft is DROPPED. In the
  game a brief that says "F-16" is not a description to score, it is the answer.
  (This is the build-time counterpart of the tagger in NodeVSP's row 6; it is not
  applied to what participants write -- CLAUDE.md rule 4.)
* Levels come from the file, not the text: a `D_human_*` record carries only the
  brief text, so `public/briefs.json` is also what lets a `discriminate` record be
  matched back to (file, level) by exact text. Do not edit the text on the way in.

Read-only against NodeVSP: it imports `leaks` from `scripts/gate_run.py`, edits
nothing there.
"""
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# level name -> NodeVSP service/examples file.
#
# ONLY the Phase B descriptive corpus ships. The game asks a person to read a
# brief and pick one of four aircraft; the other levels are unreadable at that
# job, not merely long:
#
#   gate_briefs.json (Phase A, "L0")  ~520 words of measured cross-sections per
#       brief -- 5,000+ words over ten rounds. Nobody finishes, and a brief
#       scored ambiguous because it was skimmed measures fatigue, not ambiguity.
#   gate_briefs.pre48.json ("pre48")  ~167 words, but 32 of the 59 carry engine
#       tokens (EDIT_CURVE, XSec...) that read as a parts dump, not a request.
#   gate_briefs_l1/l2/_tuned          2-3 models each; no corpus-wide run exists.
#
# design is ~59 words, one sentence, already leaks()-clean. Add a level back by
# putting its row here and re-running -- deal() in discriminate/index.html picks
# uniformly across whatever levels a model has, so two levels means a 50/50 mix.
LEVELS = {
    "design": "gate_briefs_design.json",
}

nv = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, os.pardir, "NodeVSP"))
sys.path.insert(0, os.path.join(nv, "scripts"))
from gate_run import leaks  # noqa: E402

keep = json.load(open(os.path.join(ROOT, "api", "_stimuli.json"), encoding="utf-8"))
by_file = {f: i for i, f in keep.items()}
assert all(hashlib.sha1(f.encode()).hexdigest()[:8] == i for i, f in keep.items())

out = {}
for level, name in LEVELS.items():
    src = json.load(open(os.path.join(nv, "service", "examples", name), encoding="utf-8"))
    for f, text in src.items():
        if f not in by_file or not isinstance(text, str) or not text.strip():
            continue
        hit = leaks(text)
        if hit:
            print(f"  dropped {level} brief for {by_file[f]}: names {hit}")
            continue
        out.setdefault(by_file[f], {})[level] = text

with open(os.path.join(ROOT, "public", "briefs.json"), "w", encoding="utf-8") as fh:
    json.dump(dict(sorted(out.items())), fh, ensure_ascii=False, indent=1)
print(f"{len(out)} models, {sum(map(len, out.values()))} briefs -> public/briefs.json")

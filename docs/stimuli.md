# Stimuli — where they come from and how they land here

The survey shows two kinds of stimulus. Both are committed; a third, generated
one is a stand-in for the first.

| Stimulus | Produced by | Lives at | Committed |
|---|---|---|---|
| 3D model | a bake in NodeVSP | `public/stimuli/<id>/parts.obj.gz` | yes |
| Still images (front/rear) | rendered from the 3D model, here | `public/stimuli/<id>/still.<side>.webp` | yes |
| Photographs | sourced by the owner | a private blob store | **never** |

**The bake's silhouette PNGs are not used.** They were the original stimulus
(`docs/local/stimuli/<slug>/ref.{top,side,front}.png`, from
`gate_ladder._ref_silhouettes`) but read too coarsely at survey size, so the 3D
model is the stimulus now: it loads automatically on the brief page, no click
needed. The two `still.*.webp` files stand in for it only where a live 3D view
isn't practical — the discrimination game's four-model layout, and a
same-session fallback if a participant's browser can't run WebGL or reach the
three.js CDN. `import_stimuli.py` copies `parts.obj.gz` only; it never touches
the silhouette PNGs.

## Ids, not names

A stimulus is addressed by an **opaque id**: the first 8 hex characters of
`sha1(<vsp3 filename>)`. `api/_stimuli.json` maps every id to its filename.

## Which aircraft

59 of the 86 models in NodeVSP's example corpus — whole aircraft only. Engines,
component and test geometry, and non-aircraft are left out, along with a few
excluded by hand. `api/_stimuli.json` **is** that list: it is edited by hand,
never regenerated from the corpus, because regenerating it would restore every
model that was deliberately cut.

Every model is user-made and comes from the
[OpenVSP Airshow](https://airshow.openvsp.org). Their authors are credited in
`public/credits.json` (names only, deliberately not paired with the aircraft,
so the credits page can't be used as an answer key).

The id exists so that nothing a participant can see names the aircraft. The
upstream bake names its folders by the slugified model title
(`nasa-n2a-hybrid-wing-body`), which would put the answer in an image URL. The
import step renames on the way in; the slug never reaches a served path.

The client sends an id. `api/submit.js` resolves it to a filename and stores the
filename, because the analysis side downstream is keyed by filename. An id that
does not resolve is rejected — the store must never hold a key that cannot be
looked up later.

## Importing a bake

The bake runs in NodeVSP and writes `docs/local/stimuli/<slug>/`. From this repo:

```
python scripts/import_stimuli.py <path-to>/docs/local/stimuli --dry-run
python scripts/import_stimuli.py <path-to>/docs/local/stimuli
```

Always dry-run first and read the output. Three lines matter:

- `! <folder> matches no gallery title` — the bake's slug and the import's
  `slugify()` have drifted. Fix `slugify()` here to match the bake; the bake is
  upstream and this repo does not edit it. Ignoring this silently drops stimuli.
- `slug collision` — two models whose titles slugify identically. This aborts,
  because the alternative is two aircraft sharing one folder and nobody noticing.
- `in _stimuli.json but not in gallery.json` — a kept model was renamed or
  removed upstream. Fix its entry by hand.

A bake may contain all 86 models. The import copies the 59 kept ones and skips
the rest silently, because those are excluded on purpose.

`--gallery <path>` overrides where the titles are read from; by default the
script expects the bake at its documented location and finds the gallery
relative to it (`<baked-dir>/../../../service/examples/gallery.json`).

A real import also writes `public/stimuli/index.json`: `{<id>: <has 3D>}`. It is
how the pages learn which ids exist without ever seeing a filename. Every kept
model ships 3D today, so every value is `true`; the flag stays in case that
ever isn't so.

## Rendering the stills

```
npm i --no-save puppeteer-core     # once; no package.json, node_modules is gitignored
node scripts/render_stills.mjs [<id> ...]     # default: every id in index.json
```

Run this once after an import (or after any `parts.obj.gz` changes). It drives
`app/viewer.js` itself in a headless browser — via `scripts/render.html`, a page
that exists only for this script — so a still looks exactly like the live 3D
view, just frozen from two fixed angles. Needs the network once, for the same
pinned three.js CDN URLs the survey pages use.

## Generated briefs (the discrimination game)

```
python scripts/import_briefs.py [<path-to-NodeVSP>]     # default ../NodeVSP
```

Writes `public/briefs.json`, `{<id>: {<level>: <text>}}`, from NodeVSP's
`service/examples/gate_briefs*.json`, only for the kept models. **Only the
`design` level ships** — the Phase B descriptive corpus, ~59 words a brief. The
Phase A briefs (`gate_briefs.json`) are ~520 words of measured cross-sections
each, which is 5,000+ words of reading over ten rounds; a brief nobody finishes
scores as ambiguous for the wrong reason. `LEVELS` at the top of the script says
what each level is and how to add one back. Any brief NodeVSP's `leaks()` says names its aircraft
is dropped, because in the game it would be the answer. The text is copied
verbatim: a `discriminate` record stores the brief text, and that exact text is
what maps a score back to a `(file, level)`.

## Photographs

Sourced by the project owner, one folder per model, any number of images, plus an
optional one-line `credit.txt`. They are catalogued privately upstream and
uploaded to a blob store; this repo receives **public URLs only**.

The pages read `public/photos.json` — `{<id>: [{"url": "https://…", "credit": "…"}]}`,
committed, URLs only, `{}` until photos are uploaded. Upload each photo to a blob
path built from the **id**, never the title or filename, and keep `credit` lines
free of the aircraft's name. Until an id has an entry the photo task shows a
"no photographs yet" message and offers nothing to describe.

`public/photos/` is gitignored and holds nothing but a placeholder. Do not add an
exception to that rule. A copyrighted image committed to a public repository is
not removed by deleting it in a later commit — it stays in the history, and the
history is the part that is published.

## Views

The 3D viewer is orbit-only — the participant chooses the angle. The two baked
stills are fixed views, front-ish and rear-ish (see `render.html`'s `DIRS`), and
carry no overlay, no colour coding, no score stamped into the pixels. If a
candidate image has a number burned into it, it is the wrong image: it is a
scoring artifact from a different pipeline, and showing one both leaks the
answer and biases the description.

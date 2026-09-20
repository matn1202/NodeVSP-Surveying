# NodeVSP-Surveying

A web survey that shows people an aircraft — as an orbitable 3D model or a
photograph of the real thing — and collects the words they use to describe
it.

It supports [NodeVSP](https://github.com/matn1202/NodeVSP), which turns a
plain-language description of an aircraft into a real parametric model. To do
that well it has to understand how people actually describe aircraft, and that is
not something you can find out by guessing. Hence a survey.

Three tasks:

- **Describe the model** — an orbitable 3D view; write a description someone
  else could build from.
- **Describe the aircraft** — the same, from a photograph of the real thing.
- **Tell them apart** — four aircraft, one description, pick the match. Ten
  rounds. The score measures how ambiguous a generated description is.

Available in Spanish and English. Anonymous: no account, no email, no contact
details. See [docs/spec.md](docs/spec.md) for the full design and
[docs/stimuli.md](docs/stimuli.md) for where the images come from.

## Running it

Static pages, ES modules, no build step and no dependencies to install. Serve the
directory:

```
python -m http.server 8000
```

and open `http://localhost:8000/`. Submissions need the serverless function under
`api/`, which runs under `vercel dev`.

## Layout

```
index.html              consent, participant code and task picker
brief.html              the description task (?arm=D_human_model | D_human_photo)
discriminate/           the discrimination game
credits.html            the model authors, from public/credits.json
app.css                 design tokens and layout
app/                    ES modules — stimulus, viewer, validate, submit, copy, chrome, store
api/submit.js           POST /api/submit, the one function
api/_stimuli.json       id -> model filename, the curated keep-list (never served to pages)
public/stimuli/         3D models + rendered stills, addressed by opaque id (+ index.json)
public/briefs.json      NodeVSP's generated briefs for the game, by id and level
public/photos.json      photo URLs by id (photos themselves are never committed)
scripts/                import_stimuli.py, import_briefs.py, check.mjs
vercel.json             serve the repo root, not public/
docs/
```

## Checking

```
node scripts/check.mjs
```

No dependencies. Covers the brief hints, `api/submit.js` against a fake store
(round-trip, rejection of unknown ids, server-side scoring), id/stimulus
consistency, the copy table, and that nothing served names an aircraft.

## Deploy

Vercel, zero-config. `vercel.json` sets `outputDirectory` to the repo root: the
pages live there and Vercel would otherwise serve only `public/`.

The store is Vercel KV / Upstash Redis, reached over its REST API with plain
`fetch` (so there is still no `package.json`). The function reads
`KV_REST_API_URL` and `KV_REST_API_TOKEN` (or the `UPSTASH_REDIS_REST_*`
equivalents); records are appended to the list `survey:records`. To read them
back:

```
POST $KV_REST_API_URL   Authorization: Bearer $KV_REST_API_TOKEN
["LRANGE", "survey:records", 0, -1]
```

Two things a static deploy makes visible, both accepted: `api/_stimuli.json` is
in the public repo, and Vercel may also serve it as a static file. That guards
against a casual leak, not against someone reading the source (see CLAUDE.md,
rule 1).

## Credits

The aircraft models are user-made and come from the
[OpenVSP Airshow](https://airshow.openvsp.org). They belong to their authors, who
are listed in [public/credits.json](public/credits.json). This survey only
renders the models, as 3D views; it does not redistribute the
`.vsp3` files.

## Licence

MIT. Collected responses are research data for the NodeVSP project and are not
published from this repository.

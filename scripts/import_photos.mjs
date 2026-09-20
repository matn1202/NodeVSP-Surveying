// Upload aircraft photographs to a blob store and write the URL tables.
//
//   npm i --no-save @vercel/blob        (once; node_modules is gitignored, no package.json)
//   set BLOB_READ_WRITE_TOKEN=...       (from the Vercel project's Blob store)
//   node scripts/import_photos.mjs [<manifest>] [--dry-run]
//
// Photographs never enter this repository (CLAUDE.md rule 2). Two sources, both
// outside git, both ending as URLs only:
//
//   corpus    NodeVSP's docs/local/aircraft_photos.json, built by its
//             photo_manifest.py: {<vsp3 filename>: [{path, credit?}]}. Read-only
//             -- nothing here writes to NodeVSP.
//   unlisted  public/photos/unlisted/<name>/ in THIS repo, gitignored. Aircraft
//             with no .vsp3 in the corpus: a participant can still describe one,
//             but the brief cannot be scored against a reference model, so it
//             reaches the store under its own arm. Same conventions as upstream:
//             sorted filename order is display order, a credit.txt beside the
//             images is carried onto every one of them.
//
// The blob pathname is the opaque id, NEVER the slug or the folder name: a URL
// reading /boeing-737-800/1.jpg prints the answer in the network tab, which is
// rule 1 whether or not anything renders it.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UNLISTED_DIR = join(ROOT, 'public', 'photos', 'unlisted');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const CREDIT = 'credit.txt';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const manifestPath = resolve(args.find((a) => !a.startsWith('--'))
  ?? join(ROOT, '..', 'NodeVSP', 'docs', 'local', 'aircraft_photos.json'));

const sid = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const STIMULI = read(join(ROOT, 'api', '_stimuli.json'));

/** Images in a folder, in display order, plus the credit that covers them. */
function folder(dir) {
  const credit = existsSync(join(dir, CREDIT))
    ? readFileSync(join(dir, CREDIT), 'utf8').trim() || null
    : null;
  const images = readdirSync(dir)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()) && statSync(join(dir, f)).isFile())
    .sort();
  return { images: images.map((f) => join(dir, f)), credit };
}

// --- gather ------------------------------------------------------------------
// [{id, name, files: [abs path], credit}] for both sources. `name` is only ever
// used to key api/_unlisted.json server-side; it never reaches a URL.
const jobs = [];
let cut = 0;

if (existsSync(manifestPath)) {
  const base = join(dirname(manifestPath), '..', '..'); // <NodeVSP>/docs/local/x.json -> <NodeVSP>
  for (const [file, entries] of Object.entries(read(manifestPath))) {
    const id = sid(file);
    // _stimuli.json is the owner's curated keep-list. A manifest entry outside it
    // was cut on purpose -- skip it, never import it back.
    if (!Object.hasOwn(STIMULI, id)) { cut++; continue; }
    jobs.push({
      id,
      kind: 'corpus',
      files: entries.map((e) => resolve(base, e.path)),
      credit: entries.find((e) => e.credit)?.credit ?? null,
    });
  }
} else {
  console.warn(`no corpus manifest at ${manifestPath} -- unlisted photos only.`);
}

if (!existsSync(UNLISTED_DIR)) {
  mkdirSync(UNLISTED_DIR, { recursive: true });
  console.log(`created ${UNLISTED_DIR} -- one folder per aircraft, images inside.`);
}
for (const name of readdirSync(UNLISTED_DIR).sort()) {
  const dir = join(UNLISTED_DIR, name);
  if (!statSync(dir).isDirectory()) continue;
  const { images, credit } = folder(dir);
  if (!images.length) continue;
  const id = sid(`unlisted:${name}`);
  if (Object.hasOwn(STIMULI, id)) throw new Error(`unlisted ${name}: id ${id} collides with a corpus stimulus`);
  jobs.push({ id, kind: 'unlisted', name, files: images, credit });
}

const missing = jobs.flatMap((j) => j.files).filter((f) => !existsSync(f));
if (missing.length) throw new Error(`manifest points at files that are gone:\n  ${missing.join('\n  ')}`);

const shot = jobs.reduce((n, j) => n + j.files.length, 0);
console.log(`${jobs.length} aircraft, ${shot} images `
  + `(${jobs.filter((j) => j.kind === 'corpus').length} corpus, `
  + `${jobs.filter((j) => j.kind === 'unlisted').length} unlisted; ${cut} cut models skipped)`);
if (!jobs.length) process.exit(0);

// --- upload ------------------------------------------------------------------
const photos = {};
const unlistedPhotos = {};
const unlistedNames = {};

if (dry) {
  for (const j of jobs) for (const [i, f] of j.files.entries()) {
    console.log(`  would upload ${basename(f)} -> survey/${j.id}/${i + 1}${extname(f).toLowerCase()}`);
  }
  console.log('\n--dry-run: nothing uploaded, nothing written.');
  process.exit(0);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
const { put } = await import('@vercel/blob');

for (const j of jobs) {
  const entries = [];
  for (const [i, f] of j.files.entries()) {
    // Deterministic pathname + allowOverwrite: re-running replaces in place
    // rather than littering the store with copies.
    const { url } = await put(`survey/${j.id}/${i + 1}${extname(f).toLowerCase()}`, readFileSync(f), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    entries.push(j.credit ? { url, credit: j.credit } : { url });
  }
  if (j.kind === 'corpus') photos[j.id] = entries;
  else { unlistedPhotos[j.id] = entries; unlistedNames[j.id] = j.name; }
  console.log(`  ${j.id} ${entries.length} image(s)`);
}

const write = (rel, obj) => {
  writeFileSync(join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
  console.log(`wrote ${rel} (${Object.keys(obj).length})`);
};
write('public/photos.json', photos);
write('public/photos.unlisted.json', unlistedPhotos);
write('api/_unlisted.json', unlistedNames);
console.log('\nnow run: node scripts/check.mjs');

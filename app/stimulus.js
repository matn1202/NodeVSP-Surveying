import * as store from './store.js';
import { t } from './copy.js';

// Every path here is built from an opaque id. Nothing on the page may carry a
// name, a filename or a slug (CLAUDE.md rule 1).
const BASE = '/public/stimuli/';
export const STILLS = ['front', 'rear'];
export const still = (id, side) => `${BASE}${id}/still.${side}.webp`;
export const objUrl = (id) => `${BASE}${id}/parts.obj.gz`;

const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
};

/** {id: hasObj} for every stimulus that shipped. */
export const catalogue = () => json(`${BASE}index.json`);
/** {id: [{url, credit?}]} -- photo URLs only; the images live in a blob store. */
export const photos = () => json('/public/photos.json');
/** Same shape, for aircraft with no model in the corpus. Describable, but not
    scoreable, so they submit under their own arm -- see api/submit.js. */
export const unlistedPhotos = () => json('/public/photos.unlisted.json');
/** {id: {level: brief}} -- NodeVSP's generated briefs, for the game. */
export const briefs = () => json('/public/briefs.json');

export const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A random id this participant has not done in `arm`; forgets once all are done. */
export function pick(ids, arm) {
  const key = `seen.${arm}`;
  let seen = [];
  try { seen = JSON.parse(store.get(key) ?? '[]'); } catch { /* start fresh */ }
  let fresh = ids.filter((id) => !seen.includes(id));
  if (!fresh.length) { seen = []; fresh = ids; }
  const id = fresh[Math.floor(Math.random() * fresh.length)];
  store.set(key, JSON.stringify([...seen, id]));
  return id;
}

/** The two baked stills of a model as <img>s -- the game's stand-in for a live 3D view. */
export function stillImgs(id) {
  return STILLS.map((side) => {
    const img = new Image();
    img.src = still(id, side);
    img.alt = t(`still.${side}`);
    img.decoding = 'async';
    return img;
  });
}

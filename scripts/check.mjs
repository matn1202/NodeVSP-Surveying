// node scripts/check.mjs -- the repo's one runnable check. No framework, no deps.
// Covers: brief hints, /api/submit's boundary against a fake store, id <-> stimulus
// consistency, the copy table, and CLAUDE.md rule 1 (nothing served names an aircraft).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const require = createRequire(import.meta.url);
const STIMULI = JSON.parse(read('api/_stimuli.json'));
let n = 0;
const ok = (name) => { n++; console.log('ok  ', name); };

// --- brief hints (row 3) -----------------------------------------------------
{
  const { hints } = await import('../app/validate.js');
  const kinds = (s) => hints(s).map((h) => h.kind);
  const prose = 'The wing has a span of 18 m, no dihedral, and 30 degrees of sweep. Its three sections each carry a different chord. The body is 44 m in length, 3 m in width and 3 m in height, and its cross sections are rounded rectangles.';
  assert.deepEqual(kinds(prose), [], 'geometry vocabulary must never hint');
  assert.deepEqual(kinds('a root chord of 2.5 m'.padEnd(120, ' and so on')), []);
  assert.deepEqual(kinds('x'.repeat(100)), ['short']);
  assert.deepEqual(kinds(''), [], 'empty box: no hint');
  assert.deepEqual(kinds(prose + ' {'), ['punct']);
  for (const bad of ['root_chord: 2.5', 'Super_M_bot', 'XSecCurve', 'a->b', '`x`', 'x = 1', '{"a":1}']) {
    assert.ok(hints(prose + ' ' + bad).length, `should hint: ${bad}`);
  }
  assert.deepEqual(kinds(prose + ' snake_case'), ['ident']);
  assert.deepEqual(kinds('word '.repeat(1001)), ['long']);
  ok('validate.js hints');
}

// --- /api/submit (row 4) ------------------------------------------------------
{
  const handler = require('../api/submit.js');
  const [id1, id2] = Object.keys(STIMULI);
  const stored = [];
  process.env.KV_REST_API_URL = 'https://fake.invalid';
  process.env.KV_REST_API_TOKEN = 'tok';
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://fake.invalid');
    assert.equal(init.headers.Authorization, 'Bearer tok');
    const [cmd, key, val] = JSON.parse(init.body);
    assert.equal(cmd, 'RPUSH');
    assert.equal(key, 'survey:records');
    stored.push(JSON.parse(val));
    return { ok: true, status: 200 };
  };
  const call = async (method, body) => {
    const res = { code: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method, body }, res);
    return res;
  };
  const rec = { arm: 'D_human_model', id: id1, brief: 'a brief', participant: 'p1' };

  let r = await call('POST', rec);
  assert.equal(r.code, 200);
  assert.deepEqual(Object.keys(stored[0]).sort(), ['answer', 'arm', 'at', 'brief', 'correct', 'file', 'participant']);
  assert.equal(stored[0].file, STIMULI[id1], 'id resolved to the filename');
  assert.equal(stored[0].answer, null);
  assert.equal(stored[0].correct, null);
  assert.ok(!Number.isNaN(Date.parse(stored[0].at)));

  // Rule 3: whatever the brief says, it is stored -- code-shaped, tiny, naming the aircraft.
  for (const brief of ['{"root_chord": 2.5}', 'x', 'Make me an F-16']) {
    r = await call('POST', { ...rec, arm: 'D_human_photo', brief });
    assert.equal(r.code, 200, brief);
  }
  assert.equal(stored.at(-1).brief, 'Make me an F-16');
  assert.equal(stored.at(-1).arm, 'D_human_photo');

  // Row 5: the server scores the answer.
  await call('POST', { arm: 'discriminate', id: id1, brief: 'b', participant: 'p', answer: id1 });
  await call('POST', { arm: 'discriminate', id: id1, brief: 'b', participant: 'p', answer: id2 });
  assert.equal(stored.at(-2).correct, true);
  assert.equal(stored.at(-1).correct, false);
  assert.equal(stored.at(-1).answer, STIMULI[id2]);
  assert.equal(stored.at(-1).file, STIMULI[id1]);

  // The boundary: nothing unresolvable ever reaches the store.
  const before = stored.length;
  for (const bad of [
    { ...rec, id: 'deadbeef' },
    { ...rec, id: 'F-16C_Viper.vsp3' },
    { ...rec, id: '__proto__' },
    { ...rec, id: undefined },
    { arm: 'discriminate', id: id1, brief: 'b', participant: 'p', answer: 'nope' },
    { arm: 'discriminate', id: id1, brief: 'b', participant: 'p' },
    { ...rec, arm: 'other' },
    { ...rec, brief: 5 },
    { ...rec, participant: '' },
  ]) {
    r = await call('POST', bad);
    assert.equal(r.code, 400, JSON.stringify(bad));
  }
  assert.equal((await call('GET')).code, 405);
  assert.equal(stored.length, before, 'a rejected request stored something');
  assert.equal((await call('POST', JSON.stringify(rec))).code, 200, 'string body is parsed');

  // Unlisted aircraft: no .vsp3, so the key is prefixed and the arm is its own.
  // The table ships empty, so seed the very object submit.js resolved against
  // (same require cache) rather than carrying a fixture file for one assertion.
  const UNLISTED = require('../api/_unlisted.json');
  const wild = createHash('sha1').update('unlisted:test-aircraft').digest('hex').slice(0, 8);
  UNLISTED[wild] = 'test-aircraft';
  r = await call('POST', { arm: 'D_human_photo_unlisted', id: wild, brief: 'a brief', participant: 'p1' });
  assert.equal(r.code, 200);
  assert.equal(stored.at(-1).file, 'unlisted:test-aircraft', 'unlisted key is prefixed');
  assert.equal(stored.at(-1).arm, 'D_human_photo_unlisted', 'row 6 splits these off by arm');
  assert.equal(stored.at(-1).answer, null);
  // The two id spaces never cross, in either direction.
  assert.equal((await call('POST', { ...rec, arm: 'D_human_photo', id: wild })).code, 400);
  assert.equal((await call('POST', { ...rec, arm: 'D_human_photo_unlisted' })).code, 400);
  delete UNLISTED[wild];

  delete process.env.KV_REST_API_URL;
  assert.equal((await call('POST', rec)).code, 500, 'no store configured is a 500, not a silent drop');
  ok('api/submit.js round-trip and boundary');
}

// --- ids and stimuli ----------------------------------------------------------
{
  const ids = Object.keys(STIMULI);
  assert.equal(ids.length, 59);
  for (const [id, file] of Object.entries(STIMULI)) {
    assert.equal(createHash('sha1').update(file).digest('hex').slice(0, 8), id, `id is sha1(${file})[:8]`);
  }
  const dirs = readdirSync(join(ROOT, 'public/stimuli')).filter((d) => statSync(join(ROOT, 'public/stimuli', d)).isDirectory());
  assert.deepEqual(dirs.sort(), [...ids].sort(), 'public/stimuli holds exactly the kept ids');
  const index = JSON.parse(read('public/stimuli/index.json'));
  assert.deepEqual(Object.keys(index).sort(), [...ids].sort());
  for (const id of ids) {
    assert.ok(existsSync(join(ROOT, `public/stimuli/${id}/parts.obj.gz`)), `${id} parts.obj.gz`);
    for (const v of ['front', 'rear']) assert.ok(existsSync(join(ROOT, `public/stimuli/${id}/still.${v}.webp`)), `${id} still.${v}`);
    assert.equal(index[id], true, `${id} obj flag (every kept model ships 3D)`);
  }
  const briefs = JSON.parse(read('public/briefs.json'));
  for (const [id, byLevel] of Object.entries(briefs)) {
    assert.ok(id in STIMULI, `briefs.json holds an unknown id ${id}`);
    for (const text of Object.values(byLevel)) assert.equal(typeof text, 'string');
  }
  const photos = JSON.parse(read('public/photos.json'));
  for (const [id, list] of Object.entries(photos)) {
    assert.ok(id in STIMULI, `photos.json holds an unknown id ${id}`);
    for (const p of list) assert.match(p.url, /^https:\/\//, 'photos.json holds URLs only');
  }
  const unlisted = JSON.parse(read('api/_unlisted.json'));
  for (const [id, name] of Object.entries(unlisted)) {
    assert.equal(createHash('sha1').update(`unlisted:${name}`).digest('hex').slice(0, 8), id,
      `unlisted id is sha1(unlisted:${name})[:8]`);
    assert.ok(!(id in STIMULI), `unlisted id ${id} collides with a corpus stimulus`);
  }
  const unlistedPhotos = JSON.parse(read('public/photos.unlisted.json'));
  for (const [id, list] of Object.entries(unlistedPhotos)) {
    assert.ok(id in unlisted, `photos.unlisted.json holds an unknown id ${id}`);
    for (const p of list) assert.match(p.url, /^https:\/\//, 'photos.unlisted.json holds URLs only');
  }
  ok(`${ids.length} stimuli: ids, files, index, briefs, photos`);
}

// --- copy table ---------------------------------------------------------------
{
  const { copy } = await import('../app/copy.js');
  assert.deepEqual(Object.keys(copy.es).sort(), Object.keys(copy.en).sort(), 'es/en keys differ');
  const src = ['index.html', 'brief.html', 'credits.html', 'discriminate/index.html', ...readdirSync(join(ROOT, 'app')).filter((f) => f !== 'copy.js').map((f) => `app/${f}`)].map(read).join('\n');
  const used = new Set([...src.matchAll(/data-i18n(?:-attr)?="(?:\w+:)?([\w.]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/\bt\('([\w.]+)'/g)) used.add(m[1]);
  for (const k of used) assert.ok(k in copy.es, `copy key used but missing: ${k}`);
  for (const kind of ['model', 'photo']) for (const s of ['badge', 'h', 'prompt']) assert.ok(`brief.${kind}.${s}` in copy.es);
  for (const s of ['short', 'long', 'punct', 'ident']) assert.ok(`hint.${s}` in copy.es);
  for (const v of ['front', 'rear']) assert.ok(`still.${v}` in copy.es);
  for (const m of readFileSync(join(ROOT, 'index.html'), 'utf8').matchAll(/>([^<>{}]*[A-Za-z]{3,}[^<>{}]*)</g)) {
    if (!m[1].includes('NodeVSP')) assert.fail(`inline text in HTML: ${m[1].trim()}`);
  }
  ok('copy table: es/en parity, keys resolve, no inline text');
}

// --- rule 1: nothing served names an aircraft ---------------------------------
{
  const stems = Object.values(STIMULI).map((f) => f.replace(/\.vsp3$/i, '').toLowerCase()).filter((s) => s.length >= 4);
  const served = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`.replace(/^\.\//, '');
      if (e.isDirectory()) { if (!['.git', 'api', 'docs', 'scripts', 'node_modules', 'stimuli'].includes(e.name)) walk(rel); continue; }
      if (['.html', '.js', '.css', '.json'].includes(extname(e.name)) && e.name !== 'CLAUDE.md') served.push(rel);
    }
  };
  walk('.');
  for (const f of served) {
    const text = read(f).toLowerCase();
    assert.ok(!text.includes('.vsp3'), `${f} mentions .vsp3`);
    // credits.json is author names; briefs.json is prose and was leaks()-filtered on import.
    for (const s of stems) {
      if (f.endsWith('credits.json') || f.endsWith('briefs.json')) continue;
      assert.ok(!text.includes(s), `${f} contains the filename stem "${s}"`);
    }
  }
  assert.ok(served.some((f) => f.endsWith('briefs.json')) && served.includes('index.html'));
  ok(`rule 1: ${served.length} served files name no aircraft`);
}

console.log(`\n${n} checks passed`);

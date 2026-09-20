// POST /api/submit -- the one function (feat 61 row 4).
//
// The client posts an opaque stimulus `id`; this resolves it to the .vsp3
// filename via _stimuli.json and stores the FILENAME, because NodeVSP's
// fetch_survey.py looks records up in gallery.json by filename. An id that does
// not resolve is rejected: the store must never hold a key that cannot be looked
// up later. That is the one content rejection in the app (CLAUDE.md, rules 3-4);
// what a brief SAYS is never checked here.
//
// Store: Vercel KV / Upstash Redis over its REST API -- plain fetch, so the
// project needs no package.json. One list, one JSON record per element:
//   read it back:  POST <KV_REST_API_URL>  ["LRANGE","survey:records",0,-1]
// CommonJS on purpose: `require` of the JSON is what makes Vercel bundle it.
const STIMULI = require('./_stimuli.json');
// Aircraft with no .vsp3 in the corpus: photographed, describable, but with no
// reference model to score a brief against. Their key is prefixed `unlisted:`
// and they carry their own arm, so fetch_survey.py (row 6) splits them off by
// arm and never looks them up in gallery.json.
const UNLISTED = require('./_unlisted.json');

const ARMS = ['D_human_model', 'D_human_photo', 'D_human_photo_unlisted', 'discriminate'];
const KEY = 'survey:records';
// A payload guard against a runaway paste, not a length rule -- the 1000-word cap
// is a client hint and a real brief is nowhere near this.
const MAX_CHARS = 100000;

const known = (id) => typeof id === 'string' && Object.hasOwn(STIMULI, id);
const listed = (id) => typeof id === 'string' && Object.hasOwn(UNLISTED, id);

async function store(record) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('store is not configured');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(['RPUSH', KEY, JSON.stringify(record)]),
  });
  if (!r.ok) throw new Error(`store answered ${r.status}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch { b = null; }
  }
  const bad = (error) => res.status(400).json({ error });
  if (!b || typeof b !== 'object') return bad('body must be a JSON object');
  if (!ARMS.includes(b.arm)) return bad('unknown arm');
  // The two id spaces are disjoint and each arm resolves in exactly one of them,
  // so a corpus id cannot arrive dressed as unlisted, or the other way round.
  const wild = b.arm === 'D_human_photo_unlisted';
  if (wild ? !listed(b.id) : !known(b.id)) return bad('unknown stimulus id');
  if (typeof b.brief !== 'string' || b.brief.length > MAX_CHARS) return bad('brief must be a string');
  if (typeof b.participant !== 'string' || !b.participant || b.participant.length > 100) {
    return bad('participant must be a short string');
  }
  const game = b.arm === 'discriminate';
  if (game && !known(b.answer)) return bad('unknown answer id');

  const file = wild ? `unlisted:${UNLISTED[b.id]}` : STIMULI[b.id];
  const answer = game ? STIMULI[b.answer] : null;
  const record = {
    arm: b.arm,
    file,
    brief: b.brief,
    participant: b.participant,
    at: new Date().toISOString(), // the server's clock, not the participant's
    answer,
    correct: game ? answer === file : null,
  };
  try {
    await store(record);
  } catch (e) {
    console.error('submit: store failed:', e.message);
    return res.status(500).json({ error: 'could not store the record' });
  }
  return res.status(200).json({ ok: true, correct: record.correct });
};

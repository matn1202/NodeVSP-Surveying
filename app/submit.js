import * as store from './store.js';

/** One anonymous id per browser, to group a person's answers across tasks. */
export function participant() {
  let id = store.get('participant');
  if (!id) {
    // Blocked storage means a fresh id per page; harmless, just ungrouped.
    id = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).slice(0, 8);
    store.set('participant', id);
  }
  return id;
}

/** POST one record; throws on any failure so the caller can keep the text. */
export async function submit(fields) {
  const r = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fields, participant: participant() }),
  });
  if (!r.ok) throw new Error(`submit ${r.status}`);
  return r.json();
}

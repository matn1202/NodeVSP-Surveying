// Brief hints -- mirrors NodeVSP scripts/gate_run.py budget() (checked
// 2026-09-19). A HINT, never a rejection: the caller shows these and submits
// regardless. The guard is on SHAPE, never on vocabulary -- `root_chord: 2.5`
// gets a hint, "a root chord of 2.5 m" does not. Never add a word to this file.
export const MIN_CHARS = 120;
export const WORD_CAP = 1000;
const CODE_PUNCT = ['{', '}', '[', ']', '":', '=', '->', '`'];
// Copied exactly, not re-derived: both are wider than they look so they catch
// `Super_M_bot` and `XSecCurve`.
const SNAKE = /\b\w+_\w+\b/g;
const CAMEL = /\b[A-Za-z]+[a-z][A-Z]\w*\b/g;

/** Hints for `text`: [{kind: 'short'|'long'|'punct'|'ident', n?, list?}]. [] = clean. */
export function hints(text) {
  const out = [];
  const t = text.trim();
  if (!t) return out;
  const chars = [...t].length; // code points, like Python's len()
  if (chars < MIN_CHARS) out.push({ kind: 'short', n: chars, min: MIN_CHARS });
  const words = t.split(/\s+/).length;
  if (words > WORD_CAP) out.push({ kind: 'long', n: words, cap: WORD_CAP });
  const punct = CODE_PUNCT.filter((p) => text.includes(p)).sort();
  if (punct.length) out.push({ kind: 'punct', list: punct.join(' ') });
  const ids = [...new Set([...(text.match(SNAKE) ?? []), ...(text.match(CAMEL) ?? [])])].sort();
  if (ids.length) out.push({ kind: 'ident', list: ids.slice(0, 6).join(', ') });
  return out;
}

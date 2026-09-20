// localStorage that never throws: it can be blocked (private window, site data
// off). Falls back to memory, so a page still works -- it just forgets on reload.
const mem = new Map();

export function get(key) {
  try { return localStorage.getItem(key) ?? mem.get(key) ?? null; } catch { return mem.get(key) ?? null; }
}

export function set(key, value) {
  mem.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* memory copy above is the fallback */ }
}

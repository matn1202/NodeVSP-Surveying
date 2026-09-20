// Bake the game's still images from the 3D models: public/stimuli/<id>/still.{front,rear}.webp
//
//   npm i --no-save puppeteer-core          (once; node_modules is gitignored, no package.json)
//   node scripts/render_stills.mjs [<id> ...]     (default: every id in public/stimuli/index.json)
//   BROWSER=<path to chrome/edge> to override the browser it looks for.
//
// It renders through app/viewer.js, so a still looks exactly like the live 3D view.
// Needs the network once: three.js comes from the same pinned CDN URLs the page uses.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.gz': 'application/gzip' };
const browser = [process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
if (!browser) throw new Error('no browser found; set BROWSER=<path>');

const server = http.createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', TYPES[extname(p)] ?? 'application/octet-stream');
  createReadStream(p).pipe(res);
}).listen(0);
await new Promise((r) => server.once('listening', r));

const ids = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(JSON.parse(readFileSync(join(ROOT, 'public/stimuli/index.json'), 'utf8')));
const b = await puppeteer.launch({ executablePath: browser, headless: 'new', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await b.newPage();
await page.setViewport({ width: 640, height: 480 });
page.on('pageerror', (e) => console.error('page error:', e));
await page.goto(`http://localhost:${server.address().port}/scripts/render.html`);

let n = 0;
for (const id of ids) {
  for (const view of ['front', 'rear']) {
    await page.evaluate((i, v) => window.show(i, v), id, view);
    await (await page.$('#viewer')).screenshot({ path: join(ROOT, `public/stimuli/${id}/still.${view}.webp`), type: 'webp', quality: 88, omitBackground: true });
    await page.evaluate(() => window.done());
    n++;
  }
  process.stdout.write(`\r${n / 2}/${ids.length}`);
}
console.log(`\n${n} stills written`);
await b.close();
server.close();

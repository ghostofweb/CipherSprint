/*
 * Generates the CipherSprint brand pack into frontend/public:
 *   favicon.svg, favicon.ico (16/32/48), brand/icon-192.png, icon-512.png,
 *   icon-maskable-512.png, apple-touch-icon-180.png, og-image-1200x630.png
 *
 * The small-size mark is a simplified "c" + caret (the header keeps the
 * detailed traced logo, which turns to mush at 16px). Sources are drawn here
 * as SVG/HTML and rasterized with headless Chromium.
 *
 * Usage:  node scripts/build-brand-assets.mjs
 * Needs Playwright (npm i -D playwright && npx playwright install chromium),
 * or set PLAYWRIGHT_MODULE to an existing install's path.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, '..', 'frontend', 'public');
const BRAND = path.join(PUBLIC, 'brand');

let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright'));
} catch {
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium (or set PLAYWRIGHT_MODULE).');
  process.exit(1);
}

// Dracula, the default theme: the brand is dark-first.
const BG = '#282a36';
const FG = '#f8f8f2';
const ACCENT = '#bd93f9';
const UNTYPED = '#6272a4';
const SOFT = '#a4afd6';

// "c" + caret on a rounded tile. `scale` shrinks the mark inside the tile
// (maskable/apple icons need a safe zone); `radius` 0 gives a full-bleed tile.
const markSvg = ({ size = 64, radius = 14, scale = 1, tile = true } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  ${tile ? `<rect width="64" height="64" rx="${radius}" fill="${BG}"/>` : ''}
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32) translate(2.2 0)">
    <path d="M36 23.6A13 13 0 1 0 36 40.4" fill="none" stroke="${FG}" stroke-width="7" stroke-linecap="round"/>
    <rect x="45.5" y="13" width="5" height="38" rx="2.5" fill="${ACCENT}"/>
  </g>
</svg>`.trim();

const ogHtml = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0}
  body{width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;background:${BG};color:${FG};
       font-family:'Roboto Mono',Consolas,monospace;display:flex;flex-direction:column;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:20px;font-size:36px;font-weight:700}
  .typed{font-size:72px;line-height:1.35;white-space:pre;font-weight:400}
  .typed .u{color:${UNTYPED}}
  .typed .c{display:inline-block;width:6px;height:64px;margin:0 2px;background:${ACCENT};border-radius:3px;vertical-align:-10px}
  .tag{font-size:28px;color:${SOFT}}
</style></head><body>
  <div class="brand">${markSvg({ size: 64 })}CipherSprint</div>
  <div class="typed">the quick brown fox
jum<span class="c"></span><span class="u">ps over the lazy dog</span></div>
  <div class="tag">A minimal typing test. Friends, groups, leaderboards.</div>
</body></html>`;

// Minimal ICO container with embedded PNGs (supported since Windows Vista).
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0);
    e.writeUInt8(size === 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

await mkdir(BRAND, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

async function rasterSvg(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// favicon.svg (served as-is by modern browsers)
await writeFile(path.join(PUBLIC, 'favicon.svg'), markSvg());

// PNG sizes
const png = (size, opts) => rasterSvg(markSvg({ size, ...opts }), size);
await writeFile(path.join(BRAND, 'icon-192.png'), await png(192));
await writeFile(path.join(BRAND, 'icon-512.png'), await png(512));
await writeFile(path.join(BRAND, 'icon-maskable-512.png'), await png(512, { radius: 0, scale: 0.68 }));
await writeFile(path.join(BRAND, 'apple-touch-icon-180.png'), await png(180, { radius: 0, scale: 0.82 }));
await writeFile(path.join(BRAND, 'favicon-32.png'), await png(32));

// favicon.ico
const icoSizes = [16, 32, 48];
const icoPngs = [];
for (const size of icoSizes) icoPngs.push({ size, buf: await png(size, { radius: size <= 16 ? 3 : 14 * (size / 64) * 2 }) });
await writeFile(path.join(PUBLIC, 'favicon.ico'), buildIco(icoPngs));

// Social image
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(ogHtml);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await writeFile(path.join(BRAND, 'og-image-1200x630.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }));

await browser.close();
console.log('Brand assets written to frontend/public');

#!/usr/bin/env node
/**
 * Token guardrail: fails when UI code hard-codes what design/tokens.json owns.
 *   node design/lint-tokens.mjs <srcDir> [--allow <glob-ish substring>]...
 *
 * Blocks (outside theme/ and *.generated.* files):
 *   - hex colors (#abc, #aabbcc, #aabbccdd)      → use theme colors / CSS vars
 *   - rgb()/rgba()/hsl() literals                 → add an overlay/alpha token
 *   - named colors in style values ('white', …)   → use semantic roles
 *   - fontSize: <number>, borderRadius: <number>  → use type scale / radius tokens
 *   - fontFamily: '<literal>'                     → use theme font families
 *   - Tailwind palette classes (bg-blue-600, text-slate-500…)
 *   - Mantine palette props (color="blue")        → use semantic names
 * Allowed: 'transparent', 'currentColor', 'inherit'.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const root = args[0];
if (!root) {
  console.error('usage: lint-tokens.mjs <srcDir> [--allow substring]...');
  process.exit(2);
}
const allow = [];
for (let i = 1; i < args.length; i++) if (args[i] === '--allow') allow.push(args[++i]);

const SKIP_DIRS = new Set(['node_modules', '.next', 'out', 'dist', 'build']);
const isSkippedFile = (p) =>
  /(^|\/)theme\//.test(p) || /\.generated\./.test(p) || /\.d\.ts$/.test(p) || allow.some((a) => p.includes(a));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

const NAMED = 'white|black|red|green|blue|yellow|orange|purple|gray|grey|pink|navy|teal|silver|gold';
const TW_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
// `teal` / `navy` are BusPoint's own Mantine colors (generated from tokens), so they're allowed.
// `gray` is the token-generated mist scale in the console theme, so it's allowed too.
const MANTINE_PALETTE = 'blue|red|green|yellow|orange|cyan|grape|violet|indigo|pink|lime|dark';

const RULES = [
  { id: 'hex-color', re: /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?!\s*\{)/g, msg: 'hex color — use a semantic token' },
  { id: 'rgb-literal', re: /\b(?:rgba?|hsla?)\(\s*\d/g, msg: 'rgb/hsl literal — add an alpha/overlay token' },
  // Object/style syntax only (`color: 'white'`). JSX props like color="gray" are Mantine palette names, checked below.
  { id: 'named-color', re: new RegExp(`(?:color|Color|background|border\\w*)\\s*:\\s*['"](?:${NAMED.replace('|gray|grey', '').replace('|navy|teal', '')})['"]`, 'g'), msg: 'named color — use a semantic token' },
  { id: 'font-size', re: /fontSize\s*:\s*\d/g, msg: 'raw fontSize — use the type scale (variant / t.fs())' },
  // Circles (width + height + radius on one line) are geometry, not design radii.
  { id: 'radius', re: /borderRadius\s*:\s*\d{2,}/g, msg: 'raw borderRadius ≥10 — use t.radius.*', skipIf: /\bwidth\s*:/ },
  { id: 'font-family', re: /fontFamily\s*:\s*['"]/g, msg: 'literal fontFamily — use theme font families' },
  { id: 'tw-palette', re: new RegExp(`\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|shadow|decoration)-(?:${TW_PALETTE})(?:-\\d{2,3})?(?![\\w-])`, 'g'), msg: 'Tailwind palette class — use semantic utilities (bg-surface, text-fg-muted…)' },
  { id: 'mantine-palette', re: new RegExp(`\\bcolor(?:=|:\\s*)["'](?:${MANTINE_PALETTE})["']`, 'g'), msg: 'Mantine palette color — use semantic names (teal/navy/success/warning/danger/info)' },
];

let count = 0;
for (const file of walk(root)) {
  const rel = relative(process.cwd(), file);
  if (isSkippedFile(rel)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/token-lint-ignore/.test(line) || /^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const r of RULES) {
      r.re.lastIndex = 0;
      if (r.skipIf && r.skipIf.test(line)) continue;
      const m = r.re.exec(line);
      if (m) {
        count++;
        console.log(`${rel}:${i + 1}  ${r.msg}  [${r.id}]  ${m[0]}`);
      }
    }
  });
}
if (count) {
  console.error(`\n✗ ${count} token violation(s). Colors/sizes belong in design/tokens.json.`);
  process.exit(1);
}
console.log('✓ no hard-coded colors, font sizes, radii or palette classes');

#!/usr/bin/env node
// HAYAM — Google Flow runner (Nano Banana 2 keyframes + Omni Flash clips)
//
// Drives your own logged-in Chrome through the google-flow-mcp handlers.
// Usage (Windows PowerShell, from this folder):
//   node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step keys
//   node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step clips
//   node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step clips --only s3
//
// Before running: `npm run start-browser` inside google-flow-mcp, open a Flow
// project in that Chrome window, and upload the tracksuit photo into it.

import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { pathToFileURL, fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(HERE, 'state.json');
const RENDERS_DIR = path.join(HERE, '..', 'renders');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      out[key] = next && !next.startsWith('--') ? argv[++i] : true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const mcpDir = args.mcp || process.env.GOOGLE_FLOW_MCP;
const step = args.step || 'keys';
const only = args.only ? String(args.only).split(',') : null;
const rendersDir = args.renders || RENDERS_DIR;

if (!mcpDir || !fs.existsSync(path.join(mcpDir, 'src', 'index.js'))) {
  console.error('Pass --mcp <path to google-flow-mcp clone> (folder that contains src/index.js).');
  process.exit(1);
}

const mod = (rel) => import(pathToFileURL(path.join(mcpDir, 'src', rel)).href);
const { connectToBrowser, getPage } = await mod('browser/connect.js');
const { handleGenerateImage } = await mod('tools/generate-image.js');
const { handleGenerateVideo } = await mod('tools/generate-video.js');

const pack = JSON.parse(fs.readFileSync(path.join(HERE, 'prompts.json'), 'utf-8'));
const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) : { names: {} };
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, def) => {
  const a = (await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim();
  return a || def || '';
};

// Flow asset name for a logical ref ("tracksuit", "KEY-01", ...), as it
// appears in the @ panel. Asked once and remembered in state.json.
async function assetName(ref) {
  if (!state.names[ref]) {
    state.names[ref] = await ask(`Name of the "${ref}" asset as it shows in Flow's @ panel`, ref === 'tracksuit' ? 'Tracksuit' : ref);
    saveState();
  }
  return state.names[ref];
}

// The MCP video tool stops before Generate (paid). Click it here, after an
// explicit confirmation, using the same button the image tool uses.
async function clickGenerate(page) {
  const btn = page.locator('button:has-text("arrow_forward")').first();
  for (let i = 0; i < 10 && (await btn.isDisabled().catch(() => true)); i++) {
    await page.waitForTimeout(500);
  }
  await btn.click();
  const until = Date.now() + 5000;
  while (Date.now() < until) {
    const accept = page.getByRole('button', { name: /Accept|Approve/i }).first();
    if (await accept.isVisible().catch(() => false)) { await accept.click(); break; }
    await page.waitForTimeout(250);
  }
}

async function waitForFile(file) {
  console.log(`   ⤓ Download the best take into: ${file}`);
  console.log('     (press Enter when saved, or type "skip")');
  for (;;) {
    const a = (await rl.question('')).trim().toLowerCase();
    if (a === 'skip' || fs.existsSync(file)) return;
    console.log('     file not found yet — save it there, then press Enter.');
  }
}

async function ensureProject(page) {
  while (!page.url().includes('/project/')) {
    await ask('Open your HAYAM project in the Flow Chrome window, upload the tracksuit photo, then press Enter');
  }
  console.log(`✓ Project: ${page.url()}`);
}

async function runKeys(page) {
  for (const key of pack.keys) {
    if (only && !only.includes(key.id)) continue;
    const refs = [];
    for (const r of key.refs) refs.push(await assetName(r));
    console.log(`\n▶ ${key.id} — Nano Banana 2, 9:16, refs: ${refs.join(', ')}`);
    const go = await ask('Generate now? (uses credits) y/n', 'y');
    if (go.toLowerCase() !== 'y') continue;
    const res = await handleGenerateImage({
      prompt: key.prompt,
      model: pack.imageModel,
      ratio: pack.ratio,
      quantity: pack.imageQuantity,
      ingredients: refs,
      auto_confirm: true,
    });
    if (res.ingredients_failed?.length) {
      console.warn(`   ⚠ references not attached: ${res.ingredients_failed.join(', ')} — attach them by hand and regenerate.`);
    }
    console.log(`   ✓ ${res.image_count ?? '?'} image(s) in the project.`);
    console.log(`   Pick the best one and rename it to "${key.id}" in Flow (or tell me its name).`);
    state.names[key.id] = await ask(`   Asset name of the chosen ${key.id}`, key.id);
    saveState();
  }
}

async function runClips(page) {
  fs.mkdirSync(rendersDir, { recursive: true });
  for (const clip of pack.clips) {
    if (only && !only.includes(clip.id)) continue;
    const keyName = await assetName(clip.key);
    console.log(`\n▶ ${clip.id} — ${pack.videoModel}, ${pack.ratio}, ${pack.videoDuration}, from ${keyName}`);
    const res = await handleGenerateVideo({
      prompt: clip.prompt,
      model: pack.videoModel,
      ratio: pack.ratio,
      duration: pack.videoDuration,
      quantity: pack.videoQuantity,
      ingredients: [keyName],
    });
    if (res.ingredients_failed?.length) {
      console.warn(`   ⚠ ${keyName} was not attached — attach it by hand before generating.`);
    }
    console.log('   Prompt, model and reference are set. Check the Flow window.');
    const go = await ask('   Click Generate? (uses credits) y/n', 'y');
    if (go.toLowerCase() === 'y') {
      await clickGenerate(page);
      console.log('   ⏳ Generating — wait for the takes to finish in Flow.');
    }
    await waitForFile(path.join(rendersDir, `${clip.id}.mp4`));
  }
}

await connectToBrowser();
const page = getPage();
await ensureProject(page);

if (step === 'keys' || step === 'all') await runKeys(page);
if (step === 'clips' || step === 'all') await runClips(page);

console.log('\nDone. Next: .\\assemble.ps1  (cuts + master 9:16, 4:5, 1:1)');
rl.close();
process.exit(0);

import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFontAtlas, fontAtlas, validateFontAtlasManifest } from '../src/font-atlas.js';
import { validateProject } from '../src/project.js';
import { renderSvg } from '../src/svg.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = () => ({ version: 1, name: 'Noir lettering', font: 'monospace', size: 16, characters: ' AZ<&"~', columns: 3, cellWidth: 24, cellHeight: 32 });
const hash = data => createHash('sha256').update(data).digest('hex');
function temp(t) {
 const dir = fs.mkdtempSync(join(root, '.font-atlas-test-'));
 t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir;
}
function source(dir, input = base()) { const path = join(dir, 'input.json'); fs.writeFileSync(path, JSON.stringify(input, null, 2) + '\n'); return path; }
function noStage(dir) { assert.ok(!fs.readdirSync(dir).some(n => n.startsWith('.agent-draw-')), 'owned staging and successful backups are removed'); }
function crc(data) { let n = 0xffffffff; for (const byte of data) { n ^= byte; for (let j = 0; j < 8; j++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; } return (n ^ 0xffffffff) >>> 0; }
function chunk(tag, data) { const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(tag, 4); data.copy(bytes, 8); bytes.writeUInt32BE(crc(bytes.subarray(4, -4)), bytes.length - 4); return bytes; }
function png(width, height, { type = 6, filter = 0, extra = Buffer.alloc(0) } = {}) {
 const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = type;
 const raw = Buffer.alloc((width * 4 + 1) * height);
 for (let y = 0; y < height; y++) raw[y * (width * 4 + 1)] = filter;
 return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), extra, chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// Mock only the subprocess boundary. Production filesystem staging, SVG, XML,
// project validation, PNG validation, input rechecks and receipts execute normally.
function renderer(t, { render, probe } = {}) {
 const calls = [];
 t.mock.method(childProcess, 'spawnSync', (command, args, options) => {
  calls.push({ command, args, options });
  if (args[0] === '--version') return probe?.({ command, args, options }) ?? { status: 0, stdout: 'Inkscape 1.4 fixture\n', stderr: '' };
  const svg = fs.readFileSync(args[0], 'utf8'), width = Number(/<svg[^>]* width="(\d+)"/.exec(svg)[1]), height = Number(/<svg[^>]* height="(\d+)"/.exec(svg)[1]);
  const path = args.find(s => s.startsWith('--export-filename=')).slice('--export-filename='.length);
  fs.writeFileSync(path, png(width, height));
  return render?.({ command, args, options, width, height, path }) ?? { status: 0, stdout: '', stderr: '' };
 });
 syncBuiltinESMExports();
 t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
 return calls;
}

test('defaults normalize without mutation and yield a rebuildable 95-glyph project', () => {
 const input = { version: 1, name: 'Noir' }, before = JSON.stringify(input), { manifest, project, fnt } = createFontAtlas(input);
 assert.equal(JSON.stringify(input), before); assert.equal(manifest.characters.length, 95);
 assert.equal(manifest.characters[0], ' '); assert.equal(manifest.characters.at(-1), '~');
 assert.deepEqual(validateProject(project), project); assert.equal(project.layers.length, 95);
 assert.equal(project.width, 512); assert.equal(project.height, 288);
 assert.equal(project.layers[0].text, ' \u200b'); assert.match(fnt, /<char id="32"/);
 assert.equal(project.layers.filter(l => l.type === 'text').length, 95);
});

test('strict manifest refuses unknown fields, unusable glyph sets, invalid types and unsafe dimensions', () => {
 for (const change of [
  m => { m.version = 2; }, m => { m.unknown = 1; }, m => { m.name = ''; }, m => { m.name = 'bad\nname'; }, m => { m.font = 'font\x00'; },
  m => { m.size = 7; }, m => { m.size = 65; }, m => { m.size = '16'; }, m => { m.columns = 0; }, m => { m.columns = 17; }, m => { m.columns = 1.5; },
  m => { m.cellWidth = 15; }, m => { m.cellWidth = 129; }, m => { m.cellHeight = 15; }, m => { m.cellHeight = 129; },
  m => { m.characters = ''; }, m => { m.characters = 'AA'; }, m => { m.characters = ' '; }, m => { m.characters = ['A']; },
  m => { m.characters = '\nA'; }, m => { m.characters = '\x7f'; }, m => { m.characters = 'é'; }, m => { m.characters = '😀'; },
  m => { m.characters = 'A'.repeat(97); }, m => { m.size = 32; }, m => { m.cellHeight = 16; },
  m => { m.columns = 1; m.characters = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join(''); m.cellHeight = 128; },
  m => { m.columns = 16; m.cellWidth = 128; m.cellHeight = 128; m.characters = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join(''); }
 ]) { const m = base(); change(m); assert.throws(() => validateFontAtlasManifest(m), undefined, JSON.stringify(m)); }
 for (const input of [null, [], 1, 'manifest']) assert.throws(() => validateFontAtlasManifest(input));
 for (const key of ['font', 'size', 'characters', 'columns', 'cellWidth', 'cellHeight']) assert.throws(() => validateFontAtlasManifest({ ...base(), [key]: null }), undefined, key);
 assert.doesNotThrow(() => validateFontAtlasManifest({ ...base(), size: 8, cellWidth: 16, cellHeight: 16 }));
 assert.doesNotThrow(() => validateFontAtlasManifest({ ...base(), size: 64, cellWidth: 128, cellHeight: 128 }));
});

test('BMFont maps ordered ASCII IDs to exact cells, baseline and fixed advances, escaping XML', () => {
 const { project, fnt, manifest: m } = createFontAtlas({ ...base(), font: 'Mono & "family"' });
 const svg = renderSvg(project), cells = [...fnt.matchAll(/<char ([^>]+)\/>/g)].map(([_, attrs]) => Object.fromEntries([...attrs.matchAll(/(\w+)="(\d+)"/g)].map(([__, key, value]) => [key, Number(value)])));
 assert.equal(cells.length, m.characters.length); assert.match(fnt, /face="Mono &amp; &quot;family&quot;"/);
 assert.match(svg, /&lt;<\/tspan>/); assert.match(svg, /&amp;<\/tspan>/); assert.match(svg, /&quot;<\/tspan>/);
 assert.match(fnt, /lineHeight="32" base="18" scaleW="72" scaleH="96"/); assert.match(fnt, /file="font.png"/); assert.match(fnt, /kernings count="0"/);
 cells.forEach((cell, i) => {
  assert.equal(cell.id, m.characters.charCodeAt(i)); assert.equal(cell.x, (i % 3) * 24); assert.equal(cell.y, Math.floor(i / 3) * 32);
  assert.equal(cell.width, 24); assert.equal(cell.height, 32); assert.equal(cell.xadvance, 24); assert.equal(cell.xoffset, 0); assert.equal(cell.yoffset, 0);
  assert.ok(cell.x + cell.width <= project.width && cell.y + cell.height <= project.height);
  assert.equal(project.layers[i].x, cell.x + 2); assert.equal(project.layers[i].y, cell.y + 18);
 });
});

test('staged export retains source/project/output hashes and overwrites only its unchanged inventory', t => {
 const dir = temp(t), path = source(dir), before = fs.readFileSync(path), out = join(dir, 'out'), calls = renderer(t);
 const receipt = fontAtlas(path, out);
 assert.equal(receipt.ok, true); assert.equal(receipt.kind, 'font-atlas'); assert.equal(receipt.sourceSha256, hash(before));
 assert.equal(receipt.projectSha256, hash(fs.readFileSync(join(out, 'project.json'))));
 assert.deepEqual(fs.readFileSync(path), before); assert.deepEqual(fs.readFileSync(join(out, 'source-manifest.json')), before);
 assert.deepEqual(fs.readdirSync(out).sort(), ['font.fnt', 'font.png', 'font.svg', 'manifest.json', 'project.json', 'receipt.json', 'source-manifest.json']);
 for (const artifact of receipt.artifacts) assert.equal(artifact.sha256, hash(fs.readFileSync(join(out, artifact.name))));
 const project = validateProject(JSON.parse(fs.readFileSync(join(out, 'project.json'))));
 assert.equal(fs.readFileSync(join(out, 'font.svg'), 'utf8'), renderSvg(project));
 const bytes = fs.readFileSync(join(out, 'font.png')); assert.equal(bytes.readUInt32BE(16), project.width); assert.equal(bytes.readUInt32BE(20), project.height);
 assert.equal(calls.length, 2); assert.deepEqual(calls[0].args, ['--version']); assert.ok(calls[1].args.includes('--export-background-opacity=0')); assert.ok(calls[1].args.includes('--export-dpi=96'));
 assert.ok(calls[1].options.env.INKSCAPE_PROFILE_DIR.startsWith(dirname(calls[1].args[0]))); assert.equal(calls[1].options.env.DISPLAY, undefined);
 assert.equal(fontAtlas(path, out, { overwrite: true }).ok, true);
 assert.equal(fontAtlas(join(out, 'manifest.json'), join(dir, 'rebuilt')).ok, true); noStage(dir);
});

test('input and destination preflight protects sources, unrelated files and prior artifacts before probing', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'), calls = renderer(t);
 fontAtlas(path, out); calls.length = 0;
 assert.throws(() => fontAtlas(path, out), /already exists/);
 assert.throws(() => fontAtlas(path, dir, { overwrite: true }), /contain the source/);
 assert.throws(() => fontAtlas(path, dirname(root), { overwrite: true }), /contain the source/);
 fs.writeFileSync(join(out, 'keep.txt'), 'keep');
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /unrelated/); assert.equal(fs.readFileSync(join(out, 'keep.txt'), 'utf8'), 'keep'); fs.unlinkSync(join(out, 'keep.txt'));
 fs.appendFileSync(join(out, 'font.svg'), 'edit'); assert.throws(() => fontAtlas(path, out, { overwrite: true }), /changed since its receipt/);
 const unknown = join(dir, 'unknown'); fs.mkdirSync(unknown); fs.writeFileSync(join(unknown, 'font.png'), 'important');
 assert.throws(() => fontAtlas(path, unknown, { overwrite: true }), /receipt/);
 assert.equal(calls.length, 0); noStage(dir);
});

test('nonregular, missing, malformed and oversized source files are refused without a process', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'), calls = renderer(t);
 assert.throws(() => fontAtlas(dir, out), /regular file/); assert.throws(() => fontAtlas(join(dir, 'missing'), out), /regular file/);
 fs.writeFileSync(path, '{broken'); assert.throws(() => fontAtlas(path, out), /valid JSON/);
 fs.truncateSync(path, 2 * 1024 * 1024 + 1); assert.throws(() => fontAtlas(path, out), /byte limit/);
 assert.equal(calls.length, 0); assert.equal(fs.existsSync(out), false); noStage(dir);
});

test('symlink source, ancestor and destination entries are refused (virtual stat fixtures, no links created)', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); renderer(t); fontAtlas(path, out);
 const realStat = fs.lstatSync; let linked;
 t.mock.method(fs, 'lstatSync', (p, options) => p === linked ? { isSymbolicLink: () => true, isFile: () => false } : realStat(p, options)); syncBuiltinESMExports();
 linked = path; assert.throws(() => fontAtlas(path, join(dir, 'new')), /Symlinks/);
 linked = dir; assert.throws(() => fontAtlas(path, join(dir, 'new')), /Symlinks/);
 linked = out; assert.throws(() => fontAtlas(path, out, { overwrite: true }), /Symlinks/);
 linked = join(out, 'font.png'); assert.throws(() => fontAtlas(path, out, { overwrite: true }), /Unsafe output entry/);
 linked = undefined; noStage(dir);
});

test('corrupt, truncated, animated, RGB and wrong-canvas PNGs never publish', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); let mutate;
 renderer(t, { render: ({ path: pngPath, width, height }) => { fs.writeFileSync(pngPath, mutate(width, height)); } });
 const mutations = [
  () => Buffer.from('not PNG'), (w, h) => png(w + 1, h), (w, h) => png(w, h, { type: 2 }), (w, h) => png(w, h, { filter: 5 }),
  (w, h) => png(w, h, { extra: chunk('acTL', Buffer.alloc(8)) }), (w, h) => png(w, h).subarray(0, -12),
  (w, h) => { const b = png(w, h); b[29] ^= 1; return b; }, (w, h) => Buffer.concat([png(w, h), Buffer.from('trailing')]),
  (w, h) => { const b = Buffer.alloc(13); b.writeUInt32BE(w); b.writeUInt32BE(h, 4); b[8] = 8; b[9] = 6; return Buffer.concat([png(w, h).subarray(0, 8), chunk('IHDR', b), chunk('IDAT', deflateSync(Buffer.alloc(3))), chunk('IEND', Buffer.alloc(0))]); }
 ];
 for (mutate of mutations) { assert.throws(() => fontAtlas(path, out), /PNG verification failed/); assert.equal(fs.existsSync(out), false); noStage(dir); }
});

test('probe and rendering failures preserve prior output and clean owned staging', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); let failure = false, probeFailure = false;
 renderer(t, { probe: () => probeFailure ? { status: null, stdout: '', error: Object.assign(new Error('fixture probe failure'), { code: 'ETIMEDOUT' }) } : undefined, render: () => failure ? { status: 7, stderr: 'fixture render failure' } : undefined });
 fontAtlas(path, out); const before = fs.readFileSync(join(out, 'receipt.json'));
 failure = true; assert.throws(() => fontAtlas(path, out, { overwrite: true }), /export failed: exit 7/);
 probeFailure = true; assert.throws(() => fontAtlas(path, out, { overwrite: true }), /probe failed/);
 assert.deepEqual(fs.readFileSync(join(out, 'receipt.json')), before); noStage(dir);
});

test('input mutation and concurrent output changes refuse publication and preserve edits', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); let mutation;
 renderer(t, { render: () => { mutation?.(); } }); fontAtlas(path, out);
 const before = fs.readFileSync(join(out, 'receipt.json'));
 mutation = () => fs.appendFileSync(path, ' ');
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /Input changed during/);
 assert.deepEqual(fs.readFileSync(join(out, 'receipt.json')), before);
 mutation = () => fs.appendFileSync(join(out, 'receipt.json'), ' ');
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /Output changed during/);
 assert.equal(fs.readFileSync(join(out, 'receipt.json'), 'utf8'), before.toString() + ' ');
 mutation = () => fs.writeFileSync(join(out, 'important.txt'), 'keep');
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /unrelated/); assert.equal(fs.readFileSync(join(out, 'important.txt'), 'utf8'), 'keep'); fs.unlinkSync(join(out, 'important.txt'));
 mutation = () => fs.appendFileSync(join(out, 'font.svg'), 'external edit');
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /changed since its receipt/); assert.match(fs.readFileSync(join(out, 'font.svg'), 'utf8'), /external edit$/); noStage(dir);
});

test('failed publication restores previous output using its owned backup', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); renderer(t); fontAtlas(path, out);
 const before = fs.readFileSync(join(out, 'receipt.json')), realRename = fs.renameSync;
 t.mock.method(fs, 'renameSync', (from, to) => {
  if (from.includes('.agent-draw-font-atlas-') && to === out) throw new Error('fixture rename failure');
  return realRename(from, to);
 }); syncBuiltinESMExports();
 assert.throws(() => fontAtlas(path, out, { overwrite: true }), /fixture rename failure/);
 assert.deepEqual(fs.readFileSync(join(out, 'receipt.json')), before); noStage(dir);
});

test('deadline covers probing and rendering without sleeping or launching a process', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out'); let now = 10000, expireProbe = false;
 t.mock.method(Date, 'now', () => now);
 renderer(t, { probe: () => { if (expireProbe) now += 2000; }, render: () => { now += 2000; } });
 assert.throws(() => fontAtlas(path, out, { timeout: 1 }), /timed out/); noStage(dir);
 expireProbe = true; assert.throws(() => fontAtlas(path, out, { timeout: 1 }), /timed out/); noStage(dir);
 for (const timeout of [0, 301, 1.5, NaN, '5']) assert.throws(() => fontAtlas(path, out, { timeout }), /integer 1..300/);
 assert.equal(fs.existsSync(out), false);
});

test('CLI accepts font-atlas dispatch and rejects unsupported options before native execution', t => {
 const dir = temp(t), path = source(dir), out = join(dir, 'out');
 const cli = args => childProcess.spawnSync(process.execPath, [join(root, 'scripts/agent-draw.mjs'), ...args], { encoding: 'utf8' });
 assert.match(cli(['--help']).stdout, /font-atlas <manifest.json>/);
 for (const args of [['--gif'], ['--mp4'], ['--background', '#fff'], ['--overwrite', '--overwrite'], ['--timeout', '0'], ['--timeout', '301'], ['--timeout', '1.5'], ['--timeout'], ['--out'], ['--unknown']]) {
  const result = cli(['font-atlas', path, '--out', out, ...args]); assert.equal(result.status, 1, result.stderr); assert.equal(JSON.parse(result.stderr).ok, false);
 }
 assert.match(cli(['font-atlas', path]).stderr, /--out is required/);
 fs.writeFileSync(path, JSON.stringify(createFontAtlas(base()).project));
 assert.equal(JSON.parse(cli(['validate', path]).stdout).ok, true);
 assert.equal(JSON.parse(cli(['inspect', path]).stdout).layers.length, base().characters.length);
 assert.match(cli(['build', path]).stderr, /--out is required/);
 fs.writeFileSync(path, '{broken'); assert.match(cli(['font-atlas', path, '--out', out]).stderr, /Font atlas manifest must be valid JSON/);
 assert.equal(fs.existsSync(out), false); noStage(dir);
});

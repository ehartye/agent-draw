import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sequence, validateSequenceManifest } from '../src/sequence.js';
import { inspectInkscape } from '../src/inkscape.js';
import { renderSvg } from '../src/svg.js';
import { validateProject } from '../src/project.js';
import { cli, temp } from './helpers.js';
import { pngPixels } from './png.js';

const inkscape = inspectInkscape();
const hash = data => createHash('sha256').update(data).digest('hex');
const manifest = () => ({ version: 1, name: 'Authored elbow poses', fps: 6, loop: true, frames: ['poses/low.json', 'poses/high.json'] });
const pose = (high = false) => ({ version: 1, name: high ? 'Elbow up' : 'Elbow down', width: 160, height: 192, layers: [
 { name: 'Body', type: 'rectangle', x: 70, y: 85, width: 20, height: 60, color: '#667788', fillGradient: { type: 'linear', x1: 70, y1: 85, x2: 90, y2: 85, stops: [{ offset: 0, color: '#334455' }, { offset: 1, color: '#8899AA' }] } },
 { name: 'Authored bent arm', type: 'path', d: `M 88 80 L 116 ${high ? 60 : 100} L 136 80`, color: '#00000000', stroke: '#FF5522', strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' },
 { name: 'Foot registration', type: 'rectangle', x: 79, y: 176, width: 3, height: 5, color: '#223344' },
] });
function inputs(dir, m = manifest()) {
 mkdirSync(join(dir, 'poses'), { recursive: true });
 writeFileSync(join(dir, 'poses/low.json'), JSON.stringify(pose(), null, 1) + '\n\n');
 writeFileSync(join(dir, 'poses/high.json'), '\n' + JSON.stringify(pose(true), null, 3) + '\n');
 const source = join(dir, 'input.json'); writeFileSync(source, JSON.stringify(m, null, 2) + '\n'); return source;
}
const originalEnvironment = new WeakMap();
function override(t, value) {
 if (!originalEnvironment.has(t)) {
  const old = process.env.AGENT_DRAW_INKSCAPE; originalEnvironment.set(t, old);
  t.after(() => { if (old === undefined) delete process.env.AGENT_DRAW_INKSCAPE; else process.env.AGENT_DRAW_INKSCAPE = old; });
 }
 process.env.AGENT_DRAW_INKSCAPE = value;
}
function renderer(dir, script) {
 const path = join(dir, 'inkscape-fixture');
 writeFileSync(path, `#!${process.execPath}\nif(process.argv.includes('--version'))console.log('Inkscape 1.4 (fixture)');else {${script}}\n`, { mode: 0o700 }); return path;
}
function previous(out) {
 mkdirSync(out); const data = 'original'; writeFileSync(join(out, 'contact-sheet.svg'), data);
 writeFileSync(join(out, 'receipt.json'), JSON.stringify({ tool: 'agent-draw', kind: 'sequence', schemaVersion: 1, artifacts: [{ name: 'contact-sheet.svg', sha256: hash(data) }] }));
}
function noStage(dir) { assert.ok(!readdirSync(dir).some(name => name.startsWith('.agent-draw-')), 'staging and backups removed'); }

test('strict sequence manifest retains order, repeated hold frames and explicit loop intent without mutation', () => {
 const m = manifest(), before = JSON.stringify(m), result = validateSequenceManifest(m);
 assert.deepEqual(result, m); assert.equal(JSON.stringify(m), before); assert.notEqual(result.frames, m.frames);
 result.frames.reverse(); assert.equal(JSON.stringify(m), before);
 const one = manifest(); one.loop = false; one.frames = ['one.json']; assert.deepEqual(validateSequenceManifest(one), one);
 one.frames = Array(120).fill('same.json'); assert.equal(validateSequenceManifest(one).frames.length, 120);
});

test('strict sequence manifest rejects unknown fields, malformed names, timing and path escapes', () => {
 const bad = [
  m => { m.version = 2; }, m => { m.extra = 1; }, m => { m.name = ''; }, m => { m.name = ' leading'; }, m => { m.name = 'bad\nname'; }, m => { m.name = 'bad\ufffe'; }, m => { m.name = 'bad\uffff'; }, m => { m.name = 'a'.repeat(121); },
  m => { m.fps = 0; }, m => { m.fps = 31; }, m => { m.fps = 1.5; }, m => { m.fps = NaN; }, m => { m.fps = '6'; },
  m => { delete m.loop; }, m => { m.loop = 'true'; }, m => { m.frames = []; }, m => { m.frames = Array(121).fill('one.json'); }, m => { m.frames = 'one.json'; },
 ];
 for (const change of bad) { const m = manifest(); change(m); assert.throws(() => validateSequenceManifest(m)); }
 for (const value of [null, [], 'bad']) assert.throws(() => validateSequenceManifest(value), /must be an object/);
 for (const path of ['../one.json', '/one.json', 'https://host/one.json', 'file:one.json', 'C:\\one.json', 'poses/../one.json', './one.json', 'poses//one.json', 'one.svg', '$(touch x).json', 'one.json\0', '\\host\\one.json']) {
  const m = manifest(); m.frames = [path]; assert.throws(() => validateSequenceManifest(m), /relative JSON paths/);
 }
});

test('real drawn poses retain changed joint geometry, 160x192 foot registration, byte-exact inputs and rebuildability', { skip: !inkscape.ok }, t => {
 const dir = temp(t), source = inputs(dir), before = readFileSync(source), out = join(dir, 'out');
 const receipt = sequence(source, out);
 assert.equal(receipt.ok, true); assert.equal(receipt.kind, 'sequence'); assert.equal(receipt.frames, 2); assert.equal(receipt.durationSeconds, 2 / 6);
 assert.equal(receipt.width, 160); assert.equal(receipt.height, 192); assert.equal(receipt.loop, true);
 assert.deepEqual(receipt.seam, { closed: null, method: 'not automatically proven for independently drawn poses', requiresVisualReview: true });
 assert.deepEqual(receipt.formats, ['svg', 'png']); assert.deepEqual(receipt.contactSheetFrames, [0, 1]);
 assert.deepEqual(readdirSync(out).sort(), ['contact-sheet.png', 'contact-sheet.svg', 'frames', 'manifest.json', 'projects', 'receipt.json', 'source-manifest.json']);
 assert.deepEqual(readFileSync(source), before); assert.deepEqual(readFileSync(join(out, 'source-manifest.json')), before);
 assert.equal(receipt.sourceSha256, hash(before));
 for (const frame of receipt.sourceFrames) {
  const bytes = readFileSync(join(dir, frame.path));
  assert.deepEqual(readFileSync(join(out, frame.project)), bytes); assert.equal(frame.sha256, hash(bytes)); assert.equal(frame.bytes, bytes.length);
  assert.equal(readFileSync(join(out, frame.svg), 'utf8'), renderSvg(validateProject(JSON.parse(bytes))));
 }
 for (const artifact of receipt.artifacts) assert.equal(artifact.sha256, hash(readFileSync(join(out, artifact.name))));
 const lowSvg = readFileSync(join(out, 'frames/frame-0000.svg'), 'utf8'), highSvg = readFileSync(join(out, 'frames/frame-0001.svg'), 'utf8');
 assert.match(lowSvg, /d="M 88 80 L 116 100 L 136 80"/); assert.match(highSvg, /d="M 88 80 L 116 60 L 136 80"/);
 // Two fixed endpoints and a moved elbow cannot be explained by a rigid rotation.
 assert.doesNotMatch(lowSvg + highSvg, /transform=|<image/);
 const low = pngPixels(join(out, 'frames/frame-0000.png')), high = pngPixels(join(out, 'frames/frame-0001.png'));
 assert.equal(low.width, 160); assert.equal(low.height, 192); assert.equal(high.width, 160); assert.equal(high.height, 192);
 assert.equal(low.pixel(116, 100)[3], 255); assert.equal(high.pixel(116, 100)[3], 0);
 assert.equal(low.pixel(116, 60)[3], 0); assert.equal(high.pixel(116, 60)[3], 255);
 assert.deepEqual(low.pixel(80, 180), [34, 51, 68, 255]); assert.deepEqual(high.pixel(80, 180), low.pixel(80, 180));
 const rebuilt = sequence(join(out, 'manifest.json'), join(dir, 'rebuilt'));
 assert.equal(rebuilt.ok, true);
 for (const frame of receipt.sourceFrames) {
  assert.deepEqual(readFileSync(join(dir, 'rebuilt', frame.svg)), readFileSync(join(out, frame.svg)));
  assert.deepEqual(readFileSync(join(dir, 'rebuilt', frame.png)), readFileSync(join(out, frame.png)));
 }
 assert.equal(sequence(source, out, { overwrite: true }).ok, true); noStage(dir);
});

test('real contact sheet includes every pose in bounded rows with isolated gradient IDs', { skip: !inkscape.ok }, t => {
 const dir = temp(t), m = manifest(); m.frames = Array.from({ length: 9 }, (_, i) => i % 2 ? 'poses/high.json' : 'poses/low.json');
 const source = inputs(dir, m), out = join(dir, 'out'), receipt = sequence(source, out);
 assert.deepEqual(receipt.contactSheetFrames, Array.from({ length: 9 }, (_, i) => i));
 assert.deepEqual(receipt.contactSheet, { width: 1388, height: 468, columns: 8, rows: 2 });
 const sheet = readFileSync(join(out, 'contact-sheet.svg'), 'utf8');
 for (let i = 0; i < 9; i++) assert.match(sheet, new RegExp(`>Frame ${i}</text>`));
 const ids = [...sheet.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
 for (const [, id] of sheet.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(id));
 assert.doesNotMatch(sheet, /<image/); assert.match(sheet, /pose-8-gradient-layer-1/);
 const png = pngPixels(join(out, 'contact-sheet.png')); assert.equal(png.width, receipt.contactSheet.width); assert.equal(png.height, receipt.contactSheet.height);
 assert.equal(png.pixel(12 + 80, 240 + 180)[3], 255); noStage(dir);
});

test('projects must pass the normal strict validator, be static and share one canvas', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); override(t, join(dir, 'missing-renderer'));
 for (const change of [p => { p.extra = true; }, p => { p.layers[0].color = 'red'; }, p => { p.width = 161; }, p => { p.animation = null; }, p => { p.layers[1].d = 'M0 0<script/>'; }]) {
  const p = pose(true); change(p); writeFileSync(join(dir, 'poses/high.json'), JSON.stringify(p));
  assert.throws(() => sequence(source, out), /unknown field|color|same canvas|static projects|invalid SVG path/); assert.equal(existsSync(out), false); noStage(dir);
 }
 writeFileSync(join(dir, 'poses/high.json'), '{broken'); assert.throws(() => sequence(source, out), /must be valid JSON/);
 writeFileSync(source, '{broken'); assert.throws(() => sequence(source, out), /Sequence manifest must be valid JSON/);
});

test('manifest, each project, total input bytes and frame pixels have explicit limits', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); override(t, join(dir, 'missing-renderer'));
 truncateSync(source, 2 * 1024 * 1024 + 1); assert.throws(() => sequence(source, out), /byte limit/);
 inputs(dir); truncateSync(join(dir, 'poses/low.json'), 2 * 1024 * 1024 + 1); assert.throws(() => sequence(source, out), /byte limit/);
 const m = manifest(); m.frames = Array(17).fill('poses/low.json'); inputs(dir, m);
 const project = JSON.stringify(pose()); writeFileSync(join(dir, 'poses/low.json'), project.padEnd(2 * 1024 * 1024, ' '));
 assert.throws(() => sequence(source, out), /Total sequence input bytes exceed 32 MiB/);
 m.frames = Array(5).fill('poses/low.json'); inputs(dir, m);
 writeFileSync(join(dir, 'poses/low.json'), JSON.stringify({ version: 1, name: 'large', width: 4096, height: 4096, layers: [{ name: 'dot', type: 'rectangle', width: 1, height: 1, color: '#000000' }] }));
 assert.throws(() => sequence(source, out), /64 Mi pixels/); assert.equal(existsSync(out), false); noStage(dir);
});

test('input paths reject symlink files, symlink ancestors, directories and missing files', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'), m = manifest();
 symlinkSync(join(dir, 'poses/low.json'), join(dir, 'linked.json')); m.frames[0] = 'linked.json'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => sequence(source, out), /Symlinks/);
 symlinkSync(join(dir, 'poses'), join(dir, 'alias')); m.frames[0] = 'alias/low.json'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => sequence(source, out), /Symlinks/);
 m.frames[0] = 'missing.json'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => sequence(source, out), /regular file/);
 mkdirSync(join(dir, 'folder.json')); m.frames[0] = 'folder.json'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => sequence(source, out), /regular file/);
 symlinkSync(source, join(dir, 'manifest-link.json')); assert.throws(() => sequence(join(dir, 'manifest-link.json'), out), /Symlinks/); noStage(dir);
});

test('overwrite protects source manifest, separate project input directory, unrelated output and symlinks', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 assert.throws(() => sequence(source, out), /already exists/);
 assert.throws(() => sequence(source, dir, { overwrite: true }), /source manifest or project inputs/);
 assert.throws(() => sequence(source, join(dir, 'poses'), { overwrite: true }), /project inputs/);
 writeFileSync(join(out, 'important.txt'), 'keep'); assert.throws(() => sequence(source, out, { overwrite: true }), /unrelated/); assert.equal(readFileSync(join(out, 'important.txt'), 'utf8'), 'keep');
 const unknown = join(dir, 'unknown'); mkdirSync(unknown); writeFileSync(join(unknown, 'contact-sheet.svg'), 'keep'); assert.throws(() => sequence(source, unknown, { overwrite: true }), /receipt/);
 symlinkSync(out, join(dir, 'out-link')); assert.throws(() => sequence(source, join(dir, 'out-link'), { overwrite: true }), /Symlinks/);
 symlinkSync(dir, join(dir, 'parent-link')); assert.throws(() => sequence(source, join(dir, 'parent-link/new')), /Symlinks/); noStage(dir);
});

test('overwrite requires exact owned inventory and refuses edited artifacts or nested symlinks', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 writeFileSync(join(out, 'contact-sheet.svg'), 'user edit'); assert.throws(() => sequence(source, out, { overwrite: true }), /changed since its receipt/);
 writeFileSync(join(out, 'contact-sheet.svg'), 'original'); mkdirSync(join(out, 'frames')); copyFileSync(join(out, 'contact-sheet.svg'), join(out, 'frames/frame-0000.svg'));
 assert.throws(() => sequence(source, out, { overwrite: true }), /matching artifact inventory/);
 rmSync(join(out, 'frames/frame-0000.svg')); symlinkSync(join(out, 'contact-sheet.svg'), join(out, 'frames/frame-0000.svg'));
 assert.throws(() => sequence(source, out, { overwrite: true }), /Unsafe or unrelated frames/); noStage(dir);
});

test('an explicit missing Inkscape selection is authoritative and preserves prior output', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out); override(t, join(dir, 'missing-renderer'));
 assert.throws(() => sequence(source, out, { overwrite: true }), error => { assert.match(error.message, /Inkscape 1.2\+ CLI not found/); assert.equal(error.details.explicitOverride, true); return true; });
 assert.equal(readFileSync(join(out, 'contact-sheet.svg'), 'utf8'), 'original'); noStage(dir);
});

test('failed or incomplete rendering cleans staging and preserves previous output', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 for (const script of ["console.error('render failed');process.exitCode=3;", '', "require('node:fs').writeFileSync(process.argv.find(a=>a.startsWith('--export-filename=')).slice(18),'not a PNG');"]) {
  override(t, renderer(dir, script)); assert.throws(() => sequence(source, out, { overwrite: true }), /Inkscape sequence export failed|regular file|PNG verification/);
  assert.equal(readFileSync(join(out, 'contact-sheet.svg'), 'utf8'), 'original'); noStage(dir);
 }
});

test('one overall deadline includes rendering and dependency probes with cleanup', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 override(t, renderer(dir, 'setTimeout(()=>{},30000);'));
 let started = Date.now(); assert.throws(() => sequence(source, out, { overwrite: true, timeout: 1 }), /timed out|ETIMEDOUT/); assert.ok(Date.now() - started < 5000); noStage(dir);
 const slow = join(dir, 'slow-probe'); writeFileSync(slow, `#!${process.execPath}\nsetTimeout(()=>{},30000);\n`, { mode: 0o700 }); override(t, slow);
 started = Date.now(); assert.throws(() => sequence(source, out, { overwrite: true, timeout: 1 }), /probe failed|timed out/); assert.ok(Date.now() - started < 5000);
 assert.equal(readFileSync(join(out, 'contact-sheet.svg'), 'utf8'), 'original'); noStage(dir);
});

test('real renderer and version probe use one isolated temporary profile and clear displays', { skip: !inkscape.ok }, t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'), audit = join(dir, 'audit.jsonl'), fixture = join(dir, 'audited-inkscape');
 writeFileSync(fixture, `#!${process.execPath}\nconst fs=require('node:fs'),cp=require('node:child_process');fs.appendFileSync(${JSON.stringify(audit)},JSON.stringify({args:process.argv.slice(2),home:process.env.HOME,config:process.env.XDG_CONFIG_HOME,cache:process.env.XDG_CACHE_HOME,data:process.env.XDG_DATA_HOME,tmp:process.env.TMPDIR,profile:process.env.INKSCAPE_PROFILE_DIR,display:process.env.DISPLAY,wayland:process.env.WAYLAND_DISPLAY})+'\\n');const r=cp.spawnSync(${JSON.stringify(inkscape.command)},process.argv.slice(2),{stdio:'inherit'});process.exitCode=r.status;\n`, { mode: 0o700 });
 override(t, fixture); sequence(source, out);
 const calls = readFileSync(audit, 'utf8').trim().split('\n').map(line => JSON.parse(line)); assert.equal(calls.length, 4); assert.deepEqual(calls[0].args, ['--version']);
 const profile = calls[0].profile;
 for (const call of calls) {
  assert.equal(call.profile, profile); assert.equal(call.display, undefined); assert.equal(call.wayland, undefined);
  for (const key of ['home', 'config', 'cache', 'data', 'tmp', 'profile']) { assert.notEqual(call[key], process.env[key.toUpperCase()]); assert.equal(existsSync(call[key]), false); }
  assert.ok(!call.args.includes('--export-type=pdf'));
 }
 noStage(dir);
});

test('changed manifest or project inputs are refused after rendering without publishing', { skip: !inkscape.ok }, t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 for (const mutate of [source, join(dir, 'poses/low.json')]) {
  const before = readFileSync(mutate);
  override(t, renderer(dir, `const fs=require('node:fs'),cp=require('node:child_process');const r=cp.spawnSync(${JSON.stringify(inkscape.command)},process.argv.slice(2),{stdio:'inherit'});fs.appendFileSync(${JSON.stringify(mutate)},' ');process.exitCode=r.status;`));
  assert.throws(() => sequence(source, out, { overwrite: true }), /Input changed during sequence export/);
  writeFileSync(mutate, before); assert.equal(readFileSync(join(out, 'contact-sheet.svg'), 'utf8'), 'original'); noStage(dir);
 }
});

test('output edits during rendering are retained and publication is refused', { skip: !inkscape.ok }, t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 override(t, renderer(dir, `const fs=require('node:fs'),cp=require('node:child_process');const r=cp.spawnSync(${JSON.stringify(inkscape.command)},process.argv.slice(2),{stdio:'inherit'});fs.writeFileSync(${JSON.stringify(join(out, 'contact-sheet.svg'))},'edited during rendering');process.exitCode=r.status;`));
 assert.throws(() => sequence(source, out, { overwrite: true }), /Output artifact changed|Output changed during/);
 assert.equal(readFileSync(join(out, 'contact-sheet.svg'), 'utf8'), 'edited during rendering'); noStage(dir);
});

test('CLI accepts sequence, rejects unrelated flags and validates timeout before creating output', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out');
 for (const args of [['--gif'], ['--mp4'], ['--background', '#ffffff'], ['--overwrite', '--overwrite'], ['--timeout', '0'], ['--timeout', '601'], ['--timeout', '1.5'], ['--timeout'], ['--out'], ['--unknown']]) assert.equal(cli(['sequence', source, '--out', out, ...args]).status, 1);
 assert.equal(cli(['sequence', source]).status, 1); assert.equal(existsSync(out), false);
 for (const timeout of [0, 601, NaN, 1.5, '2']) assert.throws(() => sequence(source, out, { timeout }), /timeout/);
 if (inkscape.ok) { const run = cli(['sequence', source, '--out', out]); assert.equal(run.status, 0, run.stderr); assert.equal(JSON.parse(run.stdout).kind, 'sequence'); }
});

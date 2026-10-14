import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { atlas, validateAtlasManifest } from '../src/atlas.js';
import { inspectFfmpeg } from '../src/ffmpeg.js';
import { cli, temp } from './helpers.js';
import { pngPixels } from './png.js';

const ffmpeg = inspectFfmpeg();
const hash = data => createHash('sha256').update(data).digest('hex');
const base = () => ({ version: 1, name: 'dust-and-decay', width: 8, height: 16, columns: 2, pivot: { x: 0.5, y: 0.9375 }, clips: [{ id: 'drifter-idle', character: 'drifter', action: 'idle', fps: 6, loop: true, frames: ['one.png', 'two.png', 'three.png'] }] });
function crc(bytes) { let n = 0xffffffff; for (const byte of bytes) { n ^= byte; for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; } return (n ^ 0xffffffff) >>> 0; }
function chunk(tag, data) { const b = Buffer.alloc(data.length + 12); b.writeUInt32BE(data.length); b.write(tag, 4); data.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, b.length - 4)), b.length - 4); return b; }
function png(width, height, pixel, type = 6) {
 const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = type;
 const raw = Buffer.alloc((width * 4 + 1) * height);
 for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) Buffer.from(pixel(x, y)).copy(raw, y * (width * 4 + 1) + 1 + x * 4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const color = (frame, x, y) => [frame * 37 + x, y * 7, 29 + frame, x === 0 ? 0 : y === 0 ? 91 : 255];
function inputs(dir, manifest = base()) {
 let index = 0;
 for (const clip of manifest.clips) for (const file of clip.frames) writeFileSync(join(dir, file), png(manifest.width, manifest.height, (x, y) => color(index, x, y))), index++;
 const source = join(dir, 'input.json'); writeFileSync(source, JSON.stringify(manifest, null, 2) + '\n'); return source;
}
const originalEnvironment = new WeakMap();
function override(t, value) { if (!originalEnvironment.has(t)) { const old = process.env.AGENT_DRAW_FFMPEG; originalEnvironment.set(t, old); t.after(() => { if (old === undefined) delete process.env.AGENT_DRAW_FFMPEG; else process.env.AGENT_DRAW_FFMPEG = old; }); } process.env.AGENT_DRAW_FFMPEG = value; }
function encoder(dir, script) { const path = join(dir, 'ffmpeg-fixture'); writeFileSync(path, `#!${process.execPath}\nif(process.argv.includes('-version'))console.log('ffmpeg version 7.1 fixture');else {${script}}\n`, { mode: 0o700 }); return path; }
function previous(out) { mkdirSync(out); const data = 'original'; writeFileSync(join(out, 'sheet.png'), data); writeFileSync(join(out, 'receipt.json'), JSON.stringify({ tool: 'agent-draw', kind: 'atlas', schemaVersion: 1, artifacts: [{ name: 'sheet.png', sha256: hash(data) }] })); }
function noStage(dir) { assert.ok(!readdirSync(dir).some(name => name.startsWith('.agent-draw-')), 'staging and backups removed'); }

test('strict manifest validation normalizes transparent padding without mutating input', () => {
 const input = base(), before = JSON.stringify(input), result = validateAtlasManifest(input);
 assert.equal(result.padding, 2); assert.equal(JSON.stringify(input), before);
 assert.deepEqual(result.pivot, { x: 0.5, y: 0.9375 });
 const direction = base(); direction.clips[0].direction = 'south-west'; assert.equal(validateAtlasManifest(direction).clips[0].direction, 'south-west');
});

test('strict manifest rejects unknown fields, duplicate keys, malformed clips and bounds', () => {
 const bad = [
  m => { m.version = 2; }, m => { m.script = 'x'; }, m => { m.name = ''; }, m => { m.name = 'line\nbreak'; },
  m => { m.width = 0; }, m => { m.height = 8193; }, m => { m.columns = 0; }, m => { m.columns = 257; }, m => { m.columns = 1.5; },
  m => { m.padding = -1; }, m => { m.padding = 17; }, m => { m.pivot.x = 1.1; }, m => { m.pivot.y = NaN; }, m => { m.pivot.z = 1; },
  m => { m.clips = []; }, m => { m.clips[0].id = 'Bad ID'; }, m => { m.clips[0].direction = '../south'; }, m => { m.clips[0].fps = 0; }, m => { m.clips[0].fps = 121; }, m => { m.clips[0].loop = 'true'; }, m => { m.clips[0].frames = []; }, m => { m.clips[0].extra = 1; },
  m => { m.clips.push({ ...m.clips[0] }); }, m => { m.clips.push({ ...m.clips[0], id: 'other-id' }); },
  m => { m.clips[0].frames = Array(257).fill('one.png'); },
  m => { m.width = 8192; m.height = 8192; m.padding = 0; m.columns = 1; },
  m => { m.width = 8192; m.height = 1; m.columns = 1; m.clips[0].frames = ['one.png']; },
  m => { m.width = 4096; m.height = 4096; m.columns = 3; m.padding = 0; },
 ];
 for (const change of bad) { const m = base(); change(m); assert.throws(() => validateAtlasManifest(m)); }
 for (const path of ['../one.png', '/one.png', 'https://host/x.png', 'file:one.png', 'C:\\x.png', 'frames/../one.png', 'frames//one.png', 'one.svg', '$(script).png', 'one.png\0']) {
  const m = base(); m.clips[0].frames = [path]; assert.throws(() => validateAtlasManifest(m), /relative PNG paths/);
 }
});

test('real atlas preserves RGBA pixels, transparent gutters, unfilled cells and Phaser metadata', { skip: !ffmpeg.ok }, t => {
 const dir = temp(t), source = inputs(dir), before = readFileSync(source), out = join(dir, 'out'), receipt = atlas(source, out);
 assert.equal(receipt.ok, true); assert.equal(receipt.kind, 'atlas'); assert.equal(receipt.frames, 3); assert.equal(receipt.padding, 2);
 assert.deepEqual(readdirSync(out).sort(), ['animations.json', 'atlas.json', 'frames', 'manifest.json', 'receipt.json', 'sheet.png', 'source-manifest.json']);
 assert.deepEqual(readFileSync(source), before); assert.deepEqual(readFileSync(join(out, 'source-manifest.json')), before);
 const sheet = pngPixels(join(out, 'sheet.png')), data = JSON.parse(readFileSync(join(out, 'atlas.json'))), animation = JSON.parse(readFileSync(join(out, 'animations.json')));
 assert.equal(sheet.width, 22); assert.equal(sheet.height, 38);
 assert.deepEqual(data.meta, { image: 'sheet.png', format: 'RGBA8888', size: { w: 22, h: 38 }, scale: '1' });
 const names = ['drifter/idle/000', 'drifter/idle/001', 'drifter/idle/002']; assert.deepEqual(Object.keys(data.frames), names);
 for (let i = 0; i < names.length; i++) {
  const item = data.frames[names[i]], x = 2 + i % 2 * 10, y = 2 + Math.floor(i / 2) * 18;
  assert.deepEqual(item, { frame: { x, y, w: 8, h: 16 }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: 8, h: 16 }, sourceSize: { w: 8, h: 16 }, pivot: { x: 0.5, y: 0.9375 } });
  for (let dy = 0; dy < 16; dy++) for (let dx = 0; dx < 8; dx++) assert.deepEqual(sheet.pixel(x + dx, y + dy), color(i, dx, dy));
  assert.ok(x + 8 <= sheet.width && y + 16 <= sheet.height);
 }
 for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) {
  if (!Object.values(data.frames).some(({ frame: f }) => x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h)) assert.equal(sheet.pixel(x, y)[3], 0);
 }
 assert.deepEqual(animation, { version: 1, texture: 'dust-and-decay', atlas: 'atlas.json', clips: [{ ...base().clips[0], frames: names }] });
 for (const artifact of receipt.artifacts) assert.equal(artifact.sha256, hash(readFileSync(join(out, artifact.name))));
 assert.equal(receipt.sourceSha256, hash(before));
 for (const frame of receipt.sourceFrames) { assert.equal(frame.sha256, hash(readFileSync(join(dir, frame.path)))); assert.deepEqual(readFileSync(join(out, frame.name)), readFileSync(join(dir, frame.path))); }
 const rebuilt = atlas(join(out, 'manifest.json'), join(dir, 'rebuilt')); assert.equal(rebuilt.ok, true); assert.deepEqual(readFileSync(join(dir, 'rebuilt', 'sheet.png')), readFileSync(join(out, 'sheet.png')));
 assert.equal(atlas(source, out, { overwrite: true }).ok, true); noStage(dir);
});

test('case-study-sized sixteen frames keep exact 128x160 canvas and foot anchor', { skip: !ffmpeg.ok }, t => {
 const dir = temp(t), m = base(); m.width = 128; m.height = 160; m.columns = 8;
 m.clips = ['drifter', 'revenant'].map(character => ({ id: `${character}-idle`, character, action: 'idle', fps: 6, loop: true, frames: Array.from({ length: 8 }, (_, i) => `${character}-${i}.png`) }));
 const source = inputs(dir, m), out = join(dir, 'out'); atlas(source, out);
 const data = JSON.parse(readFileSync(join(out, 'atlas.json'))), sheet = pngPixels(join(out, 'sheet.png'));
 assert.equal(Object.keys(data.frames).length, 16); assert.equal(sheet.width, 1042); assert.equal(sheet.height, 326);
 Object.values(data.frames).forEach((f, i) => {
  assert.equal(f.pivot.x * f.sourceSize.w, 64); assert.equal(f.pivot.y * f.sourceSize.h, 150);
  assert.deepEqual(sheet.pixel(f.frame.x + 64, f.frame.y + 150), color(i, 64, 150).map(value => value & 255));
 });
});

test('direction is authored metadata and padding zero is supported', { skip: !ffmpeg.ok }, t => {
 const dir = temp(t), m = base(); m.padding = 0; m.columns = 3; m.clips[0].direction = 'south'; const source = inputs(dir, m), out = join(dir, 'out'); atlas(source, out);
 const data = JSON.parse(readFileSync(join(out, 'atlas.json'))); assert.deepEqual(data.meta.size, { w: 24, h: 16 }); assert.ok(data.frames['drifter/idle/south/000']);
});

test('input errors reject corrupt, wrong-size, RGB, APNG and non-PNG data before encoding', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); override(t, join(dir, 'missing-encoder'));
 const mutations = [Buffer.from('not PNG'), png(9, 16, () => [1, 2, 3, 255]), png(8, 16, () => [1, 2, 3, 255], 2)];
 const valid = png(8, 16, () => [1, 2, 3, 255]), badCrc = Buffer.from(valid); badCrc[29] ^= 1; mutations.push(badCrc, Buffer.concat([valid, Buffer.from('trailing')]), valid.subarray(0, -12));
 mutations.push(Buffer.concat([valid.subarray(0, 33), chunk('acTL', Buffer.alloc(8)), valid.subarray(33)]));
 for (const bytes of mutations) { writeFileSync(join(dir, 'one.png'), bytes); assert.throws(() => atlas(source, out), /PNG verification/); assert.equal(existsSync(out), false); noStage(dir); }
});

test('manifest and PNG reads have explicit byte limits', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out');
 writeFileSync(source, ' '.repeat(2 * 1024 * 1024 + 1)); assert.throws(() => atlas(source, out), /byte limit/);
 inputs(dir); truncateSync(join(dir, 'one.png'), 64 * 1024 * 1024 * 4 + 2 * 1024 * 1024 + 1);
 assert.throws(() => atlas(source, out), /byte limit/); assert.equal(existsSync(out), false); noStage(dir);
});

test('input paths reject symlink files, symlink parents, missing inputs and directories', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'), m = base();
 symlinkSync(join(dir, 'one.png'), join(dir, 'linked.png')); m.clips[0].frames[0] = 'linked.png'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => atlas(source, out), /Symlinks/);
 mkdirSync(join(dir, 'images')); copyFileSync(join(dir, 'one.png'), join(dir, 'images', 'one.png')); symlinkSync(join(dir, 'images'), join(dir, 'alias')); m.clips[0].frames[0] = 'alias/one.png'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => atlas(source, out), /Symlinks/);
 m.clips[0].frames[0] = 'missing.png'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => atlas(source, out), /regular file/);
 mkdirSync(join(dir, 'folder.png')); m.clips[0].frames[0] = 'folder.png'; writeFileSync(source, JSON.stringify(m)); assert.throws(() => atlas(source, out), /regular file/);
 symlinkSync(source, join(dir, 'manifest-link.json')); assert.throws(() => atlas(join(dir, 'manifest-link.json'), out), /Symlinks/); noStage(dir);
});

test('overwrite requires owned receipt and refuses source, unrelated entries and symlinks', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 assert.throws(() => atlas(source, out), /already exists/); assert.throws(() => atlas(source, dir, { overwrite: true }), /source manifest or frame inputs/);
 writeFileSync(join(out, 'important.txt'), 'keep'); assert.throws(() => atlas(source, out, { overwrite: true }), /unrelated/); assert.equal(readFileSync(join(out, 'important.txt'), 'utf8'), 'keep');
 const unknown = join(dir, 'unknown'); mkdirSync(unknown); writeFileSync(join(unknown, 'sheet.png'), 'keep'); assert.throws(() => atlas(source, unknown, { overwrite: true }), /receipt/);
 const link = join(dir, 'out-link'); symlinkSync(out, link); assert.throws(() => atlas(source, link, { overwrite: true }), /Symlinks/);
 const alias = join(dir, 'alias'); symlinkSync(dir, alias); assert.throws(() => atlas(source, join(alias, 'new-output')), /Symlinks/);
 noStage(dir);
});

test('output cannot contain frame inputs even when source manifest is elsewhere', t => {
 const dir = temp(t), m = base(); mkdirSync(join(dir, 'assets')); m.clips[0].frames = ['assets/one.png']; writeFileSync(join(dir, 'assets', 'one.png'), png(8, 16, () => [1, 2, 3, 255]));
 const source = join(dir, 'input.json'); writeFileSync(source, JSON.stringify(m)); assert.throws(() => atlas(source, join(dir, 'assets'), { overwrite: true }), /frame inputs/);
});

test('missing explicit FFmpeg is authoritative and leaves prior output intact', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out); override(t, join(dir, 'missing-encoder'));
 assert.throws(() => atlas(source, out, { overwrite: true }), error => { assert.match(error.message, /FFmpeg missing.*explicit AGENT_DRAW_FFMPEG/); assert.match(error.details.advice, /Atlas packing requires this FFmpeg selection/); assert.match(error.details.advice, /no atlas was created/); assert.doesNotMatch(error.details.advice, /Frames-only export remains available/); return true; });
 assert.equal(readFileSync(join(out, 'sheet.png'), 'utf8'), 'original'); noStage(dir);
});

test('failed encoding cleans staging and preserves previous output', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out); override(t, encoder(dir, "console.error('encoder unavailable');process.exitCode=3;"));
 assert.throws(() => atlas(source, out, { overwrite: true }), /FFmpeg atlas encoding failed: exit 3/); assert.equal(readFileSync(join(out, 'sheet.png'), 'utf8'), 'original'); noStage(dir);
});

test('export deadline includes encoding and cleans staging', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out); override(t, encoder(dir, 'setTimeout(()=>{},30000);'));
 const started = Date.now(); assert.throws(() => atlas(source, out, { overwrite: true, timeout: 1 }), /timed out|ETIMEDOUT/); assert.ok(Date.now() - started < 5000); assert.equal(readFileSync(join(out, 'sheet.png'), 'utf8'), 'original'); noStage(dir);
});

test('export deadline includes dependency version probes', t => {
 const dir = temp(t), source = inputs(dir), fixture = join(dir, 'slow-ffmpeg'); writeFileSync(fixture, `#!${process.execPath}\nsetTimeout(()=>{},30000);\n`, { mode: 0o700 }); override(t, fixture);
 const started = Date.now(); assert.throws(() => atlas(source, join(dir, 'out'), { timeout: 1 }), /timed out/); assert.ok(Date.now() - started < 5000); noStage(dir);
});

test('changed manifest or PNG inputs are refused after encoding', { skip: !ffmpeg.ok }, t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 const realCommand = ffmpeg.command;
 for (const mutate of [source, join(dir, 'one.png')]) {
  const before = readFileSync(mutate);
  const fixture = encoder(dir, `const fs=require('node:fs');const cp=require('node:child_process');const r=cp.spawnSync(${JSON.stringify(realCommand)},process.argv.slice(2),{stdio:'inherit'});fs.appendFileSync(${JSON.stringify(mutate)},' ');process.exitCode=r.status;`);
  override(t, fixture); assert.throws(() => atlas(source, out, { overwrite: true }), /Input changed during/); writeFileSync(mutate, before); assert.equal(readFileSync(join(out, 'sheet.png'), 'utf8'), 'original'); noStage(dir);
 }
});

test('output changes during encoding are preserved and publication is refused', { skip: !ffmpeg.ok }, t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out'); previous(out);
 override(t, encoder(dir, `const fs=require('node:fs');const cp=require('node:child_process');const r=cp.spawnSync(${JSON.stringify(ffmpeg.command)},process.argv.slice(2),{stdio:'inherit'});fs.writeFileSync(${JSON.stringify(join(out, 'sheet.png'))},'edited during export');process.exitCode=r.status;`));
 assert.throws(() => atlas(source, out, { overwrite: true }), /Output changed during/); assert.equal(readFileSync(join(out, 'sheet.png'), 'utf8'), 'edited during export'); noStage(dir);
});

test('CLI enforces atlas-only flags and timeout bounds', t => {
 const dir = temp(t), source = inputs(dir), out = join(dir, 'out');
 for (const args of [['--gif'], ['--mp4'], ['--background', '#fff'], ['--overwrite', '--overwrite'], ['--timeout', '0'], ['--timeout', '601'], ['--timeout', '1.5'], ['--timeout'], ['--out'], ['--unknown']]) assert.equal(cli(['atlas', source, '--out', out, ...args]).status, 1);
 assert.equal(cli(['atlas', source]).status, 1); assert.equal(existsSync(out), false);
 if (ffmpeg.ok) { const run = cli(['atlas', source, '--out', out]); assert.equal(run.status, 0, run.stderr); assert.equal(JSON.parse(run.stdout).kind, 'atlas'); }
});

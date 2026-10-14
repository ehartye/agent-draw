import { spawnSync } from 'node:child_process';
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { inspectFfmpeg } from './ffmpeg.js';

const toolVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const MAX_FRAMES = 256, MAX_PIXELS = 64 * 1024 * 1024, MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_PNG_BYTES = MAX_PIXELS * 4 + MAX_JSON_BYTES, MAX_INPUT_BYTES = MAX_PIXELS * 4 + MAX_FRAMES * 65536;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ROOT_FILES = ['sheet.png', 'atlas.json', 'animations.json', 'manifest.json', 'source-manifest.json', 'receipt.json'];
const sha256 = data => createHash('sha256').update(data).digest('hex');
const inside = (parent, child) => { const p = relative(parent, child); return p === '' || (p !== '..' && !p.startsWith('../') && !p.startsWith('..\\') && !isAbsolute(p)); };
function stat(path) { try { return lstatSync(path, { bigint: true }); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
function identity(s) { return [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String).join(':'); }
function remaining(deadline) { const ms = deadline - Date.now(); if (ms <= 0) throw new Error('Atlas export timed out'); return ms; }
function safePath(path) {
 for (let current = resolve(path);;) {
  if (stat(current)?.isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${current}`);
  const parent = dirname(current); if (parent === current) break; current = parent;
 }
}
function readRegular(path, limit, deadline) {
 remaining(deadline); safePath(path);
 const before = stat(path);
 if (!before?.isFile()) throw new Error(`Input must be a regular file: ${path}`);
 if (before.size > BigInt(limit)) throw new Error(`File exceeds byte limit (${limit}): ${path}`);
 let fd;
 try {
  fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0));
  const opened = fstatSync(fd, { bigint: true });
  if (!opened.isFile() || identity(opened) !== identity(before)) throw new Error(`Input changed while reading: ${path}`);
  const data = Buffer.alloc(Number(before.size)); let offset = 0;
  while (offset < data.length) { remaining(deadline); const count = readSync(fd, data, offset, Math.min(1024 * 1024, data.length - offset), null); if (!count) break; offset += count; }
  const extra = readSync(fd, Buffer.alloc(1), 0, 1, null), after = fstatSync(fd, { bigint: true });
  if (offset !== data.length || extra) throw new Error(`Input changed while reading: ${path}`);
  safePath(path);
  if (data.length > limit || identity(after) !== identity(before) || identity(stat(path) || {}) !== identity(before)) throw new Error(`Input changed while reading: ${path}`);
  remaining(deadline);
  return { data, path, identity: identity(before), sha256: sha256(data), bytes: data.length };
 } finally { if (fd !== undefined) closeSync(fd); }
}
function keys(value, allowed, label) {
 if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be an object`);
 for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}`);
}
function integer(value, min, max, label) { if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer ${min}..${max}`); }
function slug(value, label) { if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 64) throw new Error(`${label} must be a lowercase alphanumeric hyphen slug (1..64 characters)`); }
function framePath(value) {
 if (typeof value !== 'string' || value.length > 1024 || !/\.png$/i.test(value) || value.split('/').some(part => !/^[A-Za-z0-9_ .-]+$/.test(part) || part === '.' || part === '..')) throw new Error('Frame paths must be relative PNG paths with no traversal, URLs, or special characters');
 return value;
}

export function validateAtlasManifest(input) {
 keys(input, ['version', 'name', 'width', 'height', 'columns', 'padding', 'pivot', 'clips'], 'atlas manifest');
 if (input.version !== 1) throw new Error('Atlas manifest version must be 1');
 if (typeof input.name !== 'string' || input.name.trim() !== input.name || !input.name.length || input.name.length > 120 || /[\x00-\x1f\x7f]/.test(input.name)) throw new Error('name must be nonempty text, at most 120 characters, without control characters');
 integer(input.width, 1, 8192, 'width'); integer(input.height, 1, 8192, 'height'); integer(input.columns, 1, MAX_FRAMES, 'columns');
 const padding = input.padding === undefined ? 2 : input.padding; integer(padding, 0, 16, 'padding');
 keys(input.pivot, ['x', 'y'], 'pivot');
 for (const axis of ['x', 'y']) if (typeof input.pivot[axis] !== 'number' || !Number.isFinite(input.pivot[axis]) || input.pivot[axis] < 0 || input.pivot[axis] > 1) throw new Error(`pivot.${axis} must be a normalized number 0..1`);
 if (!Array.isArray(input.clips) || !input.clips.length || input.clips.length > MAX_FRAMES) throw new Error('clips must contain 1..256 clips');
 const ids = new Set(), names = new Set(); let frameCount = 0;
 const clips = input.clips.map((clip, i) => {
  keys(clip, ['id', 'character', 'action', 'direction', 'fps', 'loop', 'frames'], `clip ${i}`);
  for (const key of ['id', 'character', 'action']) slug(clip[key], `clip ${i}.${key}`);
  if (clip.direction !== undefined) slug(clip.direction, `clip ${i}.direction`);
  if (ids.has(clip.id)) throw new Error(`Duplicate clip id: ${clip.id}`); ids.add(clip.id);
  integer(clip.fps, 1, 120, `clip ${i}.fps`);
  if (typeof clip.loop !== 'boolean') throw new Error(`clip ${i}.loop must be boolean`);
  if (!Array.isArray(clip.frames) || !clip.frames.length || clip.frames.length > MAX_FRAMES) throw new Error(`clip ${i}.frames must contain 1..256 PNG paths`);
  frameCount += clip.frames.length; if (frameCount > MAX_FRAMES) throw new Error('Atlas is limited to 256 total frames');
  const frames = clip.frames.map((file, frame) => {
   framePath(file); const key = frameKey(clip, frame);
   if (names.has(key)) throw new Error(`Duplicate frame key: ${key}`); names.add(key); return file;
  });
  return { id: clip.id, character: clip.character, action: clip.action, ...(clip.direction === undefined ? {} : { direction: clip.direction }), fps: clip.fps, loop: clip.loop, frames };
 });
 const rows = Math.ceil(frameCount / input.columns), sheetWidth = input.columns * (input.width + padding) + padding, sheetHeight = rows * (input.height + padding) + padding;
 if (input.width * input.height * frameCount > MAX_PIXELS) throw new Error('Total frame pixels exceed 64 Mi pixels');
 if (sheetWidth > 8192 || sheetHeight > 8192 || sheetWidth * sheetHeight > MAX_PIXELS) throw new Error('Padded sheet exceeds 8192 per dimension or 64 Mi pixels');
 return { version: 1, name: input.name, width: input.width, height: input.height, columns: input.columns, padding, pivot: { x: input.pivot.x, y: input.pivot.y }, clips };
}
function frameKey(clip, i) { return [clip.character, clip.action, ...(clip.direction === undefined ? [] : [clip.direction]), String(i).padStart(3, '0')].join('/'); }

// Check the whole PNG container before passing it to the local decoder. The
// bounded contract is static, non-interlaced 8-bit RGBA, not arbitrary media.
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => { for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
function crc32(bytes, deadline) { let crc = 0xffffffff; for (let i = 0; i < bytes.length; i++) { crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8); if (!(i % 1048576)) remaining(deadline); } return (crc ^ 0xffffffff) >>> 0; }
function verifyPng(data, width, height, deadline) {
 const fail = message => { throw new Error(`PNG verification failed: ${message}`); };
 if (data.length < 45 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) fail('invalid signature or truncated PNG');
 let offset = 8, chunks = 0, seenHeader = false, seenEnd = false, idatEnded = false; const idat = [];
 while (offset < data.length) {
  remaining(deadline); if (++chunks > 4096 || offset + 12 > data.length) fail('invalid chunk count or length');
  const length = data.readUInt32BE(offset), end = offset + 12 + length, tag = data.toString('ascii', offset + 4, offset + 8);
  if (end > data.length || !/^[A-Za-z]{4}$/.test(tag)) fail('invalid chunk length or type');
  const chunk = data.subarray(offset + 8, end - 4);
  if (crc32(data.subarray(offset + 4, end - 4), deadline) !== data.readUInt32BE(end - 4)) fail(`bad ${tag} checksum`);
  if (!seenHeader && tag !== 'IHDR') fail('IHDR must be first');
  if (tag === 'IHDR') {
   if (seenHeader || length !== 13) fail('invalid IHDR'); seenHeader = true;
   if (chunk.readUInt32BE(0) !== width || chunk.readUInt32BE(4) !== height) fail(`expected fixed canvas ${width}x${height}`);
   if (chunk[8] !== 8 || chunk[9] !== 6 || chunk[10] || chunk[11] || chunk[12]) fail('only static non-interlaced 8-bit RGBA PNGs are supported');
  } else if (tag === 'IDAT') {
   if (idatEnded) fail('non-contiguous IDAT'); idat.push(chunk);
  } else {
   if (idat.length) idatEnded = true;
   if (['acTL', 'fcTL', 'fdAT'].includes(tag)) fail('animated PNG is not supported');
   if (tag === 'IEND') { if (length || !idat.length || end !== data.length) fail('invalid IEND or trailing data'); seenEnd = true; }
   else if (tag !== 'PLTE' && /^[A-Z]/.test(tag)) fail(`unsupported critical chunk ${tag}`);
  }
  offset = end;
 }
 if (!seenEnd) fail('missing IEND');
 let raw; const stride = width * 4 + 1, expected = stride * height;
 try { raw = inflateSync(Buffer.concat(idat), { maxOutputLength: expected }); } catch { fail('invalid or oversized image data'); }
 if (raw.length !== expected) fail('incorrect decoded image size');
 for (let y = 0; y < height; y++) if (raw[y * stride] > 4) fail('invalid row filter');
 remaining(deadline);
}
function checkOutput(target, inputs, overwrite, deadline) {
 safePath(target);
 if (target === dirname(target)) throw new Error('Unsafe output directory');
 for (const input of inputs) if (inside(target, input)) throw new Error('Output directory must not contain the source manifest or frame inputs');
 const existing = stat(target); if (!existing) return null;
 if (!overwrite) throw new Error('Output already exists; use a new directory or explicit --overwrite');
 if (!existing.isDirectory()) throw new Error('Output is not a directory');
 const files = [], snapshot = [['.', identity(existing)]];
 for (const name of readdirSync(target).sort()) {
  remaining(deadline); const path = join(target, name), s = stat(path);
  if (s?.isSymbolicLink()) throw new Error('Unsafe output entry: symlink');
  snapshot.push([name, identity(s || {})]);
  if (name === 'frames') {
   if (!s?.isDirectory()) throw new Error('Unsafe frames directory');
   for (const file of readdirSync(path).sort()) {
    const frame = stat(join(path, file));
    if (!/^frame-\d{4}\.png$/.test(file) || !frame?.isFile() || frame.isSymbolicLink()) throw new Error('Unsafe or unrelated frames entry');
    files.push(`frames/${file}`); snapshot.push([`frames/${file}`, identity(frame)]);
   }
  } else {
   if (!ROOT_FILES.includes(name)) throw new Error('Refusing to replace directory containing unrelated files');
   if (!s?.isFile()) throw new Error('Unsafe output entry');
   if (name !== 'receipt.json') files.push(name);
  }
 }
 let receipt;
 try { receipt = JSON.parse(readRegular(join(target, 'receipt.json'), MAX_JSON_BYTES, deadline).data); }
 catch { throw new Error('Overwrite requires an existing agent-draw atlas receipt'); }
 if (receipt.tool !== 'agent-draw' || receipt.kind !== 'atlas' || receipt.schemaVersion !== 1 || !Array.isArray(receipt.artifacts) || receipt.artifacts.length !== files.length) throw new Error('Overwrite requires an existing agent-draw atlas receipt with a matching artifact inventory');
 const owned = new Set();
 for (const artifact of receipt.artifacts) {
  if (!artifact || !files.includes(artifact.name) || owned.has(artifact.name) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Output contains unrelated files not owned by the atlas receipt');
  owned.add(artifact.name);
 }
 return JSON.stringify(snapshot);
}

export function atlas(source, out, { overwrite = false, timeout = 120 } = {}) {
 integer(timeout, 1, 600, 'timeout');
 const deadline = Date.now() + timeout * 1000, sourcePath = resolve(source), original = readRegular(sourcePath, MAX_JSON_BYTES, deadline);
 let parsed; try { parsed = JSON.parse(original.data.toString('utf8')); } catch { throw new Error('Atlas manifest must be valid JSON'); }
 const manifest = validateAtlasManifest(parsed), base = dirname(sourcePath), inputPaths = manifest.clips.flatMap(clip => clip.frames.map(file => resolve(base, file)));
 for (const path of inputPaths) { if (!inside(base, path)) throw new Error('Frame input escapes the manifest directory'); safePath(path); }
 const target = resolve(out), parent = dirname(target), initialOutput = checkOutput(target, [sourcePath, ...inputPaths], overwrite, deadline);
 mkdirSync(parent, { recursive: true }); safePath(parent);
 const stage = mkdtempSync(join(parent, '.agent-draw-atlas-'));
 let backup;
 try {
  const artifacts = [], snapshots = [original], sourceFrames = []; let totalBytes = 0, index = 0;
  const save = (name, data) => { remaining(deadline); writeFileSync(join(stage, name), data); artifacts.push({ name, sha256: sha256(data) }); };
  const saveJson = (name, value) => save(name, JSON.stringify(value, null, 2) + '\n');
  mkdirSync(join(stage, 'frames'));
  const retained = { ...manifest, clips: manifest.clips.map(clip => ({ ...clip, frames: [...clip.frames] })) };
  for (let c = 0; c < manifest.clips.length; c++) {
   const clip = manifest.clips[c];
   for (let f = 0; f < clip.frames.length; f++, index++) {
    const input = readRegular(inputPaths[index], MAX_PNG_BYTES, deadline); totalBytes += input.bytes;
    if (totalBytes > MAX_INPUT_BYTES) throw new Error('Total PNG input bytes exceed the bounded atlas limit');
    verifyPng(input.data, manifest.width, manifest.height, deadline);
    const name = `frames/frame-${String(index).padStart(4, '0')}.png`;
    save(name, input.data); snapshots.push({ ...input, data: undefined });
    sourceFrames.push({ path: clip.frames[f], name, key: frameKey(clip, f), sha256: input.sha256 }); retained.clips[c].frames[f] = name;
   }
  }
  save('source-manifest.json', original.data); saveJson('manifest.json', retained);
  const ffmpeg = inspectFfmpeg({ timeoutMs: Math.min(10000, remaining(deadline)) });
  remaining(deadline);
  if (!ffmpeg.ok) {
   const error = new Error(`FFmpeg ${ffmpeg.status}. Atlas export requires an existing FFmpeg installation. ${ffmpeg.explicitOverride ? 'The explicit AGENT_DRAW_FFMPEG selection is authoritative; check its path and permissions. ' : ''}No automatic installation was attempted. ${ffmpeg.installUrl}`);
   error.details = { ...ffmpeg, advice: 'Atlas packing requires this FFmpeg selection to pass its probe. ' + (ffmpeg.explicitOverride ? 'Check the explicit path and permissions; do not silently replace it. ' : 'Use an existing installation or request installation from the official source. ') + 'Other vector/frame export commands remain available, but no atlas was created. No automatic installation was attempted.' }; throw error;
  }
  const count = inputPaths.length, rows = Math.ceil(count / manifest.columns), { width, height, padding, columns, pivot } = manifest;
  const sheetWidth = columns * (width + padding) + padding, sheetHeight = rows * (height + padding) + padding;
  const command = ffmpeg.command.includes('/') || ffmpeg.command.includes('\\') ? resolve(ffmpeg.command) : ffmpeg.command;
  const child = spawnSync(command, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'file,pipe', '-f', 'image2', '-c:v', 'png', '-framerate', '1', '-start_number', '0', '-i', 'frames/frame-%04d.png', '-filter_threads', '1', '-vf', `format=rgba,tile=${columns}x${rows}:nb_frames=${count}:padding=${padding}:margin=${padding}:color=black@0`, '-frames:v', '1', '-c:v', 'png', '-pix_fmt', 'rgba', '-threads', '1', '-update', '1', 'sheet.png'], { cwd: stage, env: process.env, encoding: 'utf8', timeout: remaining(deadline), killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 });
  remaining(deadline);
  if (child.error || child.status !== 0) throw new Error(`FFmpeg atlas encoding failed: ${child.error?.message || `exit ${child.status}`}\n${(child.stderr || '').slice(-3000)}`);
  const sheet = readRegular(join(stage, 'sheet.png'), MAX_PNG_BYTES, deadline); verifyPng(sheet.data, sheetWidth, sheetHeight, deadline); artifacts.push({ name: 'sheet.png', sha256: sheet.sha256 });
  const frames = {};
  sourceFrames.forEach(({ key }, i) => { frames[key] = { frame: { x: padding + (i % columns) * (width + padding), y: padding + Math.floor(i / columns) * (height + padding), w: width, h: height }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: width, h: height }, sourceSize: { w: width, h: height }, pivot: { ...pivot } }; });
  saveJson('atlas.json', { frames, meta: { image: 'sheet.png', format: 'RGBA8888', size: { w: sheetWidth, h: sheetHeight }, scale: '1' } });
  saveJson('animations.json', { version: 1, texture: manifest.name, atlas: 'atlas.json', clips: manifest.clips.map(clip => ({ ...clip, frames: clip.frames.map((_, i) => frameKey(clip, i)) })) });
  const receipt = { schemaVersion: 1, tool: 'agent-draw', version: toolVersion, kind: 'atlas', ok: true, name: manifest.name, width, height, columns, rows, padding, pivot, frames: count, clips: manifest.clips.length, sheet: { width: sheetWidth, height: sheetHeight }, formats: ['png', 'phaser-json-hash'], source: sourcePath, sourceSha256: original.sha256, sourceFrames, manifest: 'manifest.json', sourceManifest: 'source-manifest.json', ffmpeg: ffmpeg.version, artifacts, limitations: ['Fixed canvas; no trimming, rotation, scaling, or generated poses.', 'Transparent gutters are not edge extrusion. Use nearest filtering or verify texture bleeding at game scale.'], warnings: child.stderr?.trim() ? [child.stderr.trim().slice(-1000)] : [] };
  writeFileSync(join(stage, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  for (const previous of snapshots) {
   const current = readRegular(previous.path, previous === original ? MAX_JSON_BYTES : MAX_PNG_BYTES, deadline);
   if (current.identity !== previous.identity || current.sha256 !== previous.sha256) throw new Error(`Input changed during atlas export: ${previous.path}`);
  }
  if (checkOutput(target, [sourcePath, ...inputPaths], overwrite, deadline) !== initialOutput) throw new Error('Output changed during atlas export; refusing to replace it');
  remaining(deadline);
  if (stat(target)) { backup = mkdtempSync(join(parent, '.agent-draw-backup-')); renameSync(target, join(backup, 'previous')); }
  try { renameSync(stage, target); } catch (error) { if (backup) renameSync(join(backup, 'previous'), target); throw error; }
  if (backup) { rmSync(backup, { recursive: true, force: true }); backup = undefined; }
  return { ...receipt, output: target };
 } finally {
  rmSync(stage, { recursive: true, force: true });
  if (backup && !stat(join(backup, 'previous'))) rmSync(backup, { recursive: true, force: true });
 }
}

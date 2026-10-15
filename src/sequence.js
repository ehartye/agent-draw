import { spawnSync } from 'node:child_process';
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { validateProject } from './project.js';
import { escapeXml, renderSvg } from './svg.js';
import { findInkscape } from './inkscape.js';

const toolVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const MAX_FRAMES = 120, MAX_PIXELS = 64 * 1024 * 1024, MAX_JSON_BYTES = 2 * 1024 * 1024, MAX_INPUT_BYTES = 32 * 1024 * 1024;
const MAX_ARTIFACT_BYTES = MAX_PIXELS * 4 + MAX_JSON_BYTES;
const ROOT_FILES = ['manifest.json', 'source-manifest.json', 'contact-sheet.svg', 'contact-sheet.png', 'receipt.json'];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const sha256 = data => createHash('sha256').update(data).digest('hex');
const inside = (parent, child) => { const p = relative(parent, child); return p === '' || (p !== '..' && !p.startsWith('../') && !p.startsWith('..\\') && !isAbsolute(p)); };
function stat(path) { try { return lstatSync(path, { bigint: true }); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
function identity(s) { return [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String).join(':'); }
function remaining(deadline) { const ms = deadline - Date.now(); if (ms <= 0) throw new Error('Sequence export timed out'); return ms; }
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
  if (identity(after) !== identity(before) || identity(stat(path) || {}) !== identity(before)) throw new Error(`Input changed while reading: ${path}`);
  remaining(deadline);
  return { data, path, identity: identity(before), sha256: sha256(data), bytes: data.length };
 } finally { if (fd !== undefined) closeSync(fd); }
}
function keys(value, allowed, label) {
 if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be an object`);
 for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}`);
}
function integer(value, min, max, label) { if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer ${min}..${max}`); }
function parseJson(data, label) { try { return JSON.parse(data.toString('utf8')); } catch { throw new Error(`${label} must be valid JSON`); } }

export function validateSequenceManifest(input) {
 keys(input, ['version', 'name', 'fps', 'loop', 'frames'], 'sequence manifest');
 if (input.version !== 1) throw new Error('Sequence manifest version must be 1');
 if (typeof input.name !== 'string' || input.name.trim() !== input.name || !input.name.length || input.name.length > 120 || /[\x00-\x1f\x7f\ufffe\uffff]/.test(input.name)) throw new Error('name must be nonempty text, at most 120 characters, without control characters');
 integer(input.fps, 1, 30, 'fps');
 if (typeof input.loop !== 'boolean') throw new Error('loop must be boolean');
 if (!Array.isArray(input.frames) || !input.frames.length || input.frames.length > MAX_FRAMES) throw new Error('frames must contain 1..120 project JSON paths');
 const frames = input.frames.map(file => {
  if (typeof file !== 'string' || file.length > 1024 || !/\.json$/i.test(file) || file.split('/').some(part => !/^[A-Za-z0-9_ .-]+$/.test(part) || part === '.' || part === '..')) throw new Error('Frame paths must be relative JSON paths with no traversal, URLs, or special characters');
  return file;
 });
 return { version: 1, name: input.name, fps: input.fps, loop: input.loop, frames };
}

// All content here comes from our strict project renderer, never imported XML.
// Each authored frame is included; rows and thumbnail size bound the review sheet.
function contactSheet(projects, name, deadline) {
 const { width, height } = projects[0], scale = Math.min(1, 192 / width, 192 / height);
 const w = Math.ceil(width * scale), h = Math.ceil(height * scale), gap = 12, label = 24;
 const columns = Math.min(8, projects.length), rows = Math.ceil(projects.length / columns);
 const sheetWidth = columns * (w + gap) + gap, sheetHeight = rows * (h + label + gap) + gap;
 const cells = projects.map((project, index) => {
  remaining(deadline);
  const svg = renderSvg(project);
  let body = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
  body = body.replace(/\bid="([^"]+)"/g, `id="pose-${index}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#pose-${index}-$1)`);
  const x = gap + (index % columns) * (w + gap), y = gap + Math.floor(index / columns) * (h + label + gap);
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${width} ${height}" overflow="hidden">${body}</svg><text x="${x}" y="${y + h + 18}" font-size="12" font-family="sans-serif" fill="#202020">Frame ${index}</text>`;
 }).join('\n');
 return { width: sheetWidth, height: sheetHeight, columns, rows, svg: `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}"><title>${escapeXml(name)}</title>\n${cells}\n</svg>\n` };
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => { for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
function crc32(bytes, deadline) { let crc = 0xffffffff; for (let i = 0; i < bytes.length; i++) { crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8); if (!(i % 1048576)) remaining(deadline); } return (crc ^ 0xffffffff) >>> 0; }
function verifyPng(data, width, height, deadline) {
 const fail = message => { throw new Error(`PNG verification failed: ${message}`); };
 if (data.length < 45 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) fail('invalid signature or truncated PNG');
 let offset = 8, chunks = 0, channels, seenHeader = false, seenEnd = false, idatEnded = false; const idat = [];
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
   if (chunk[8] !== 8 || ![2, 6].includes(chunk[9]) || chunk[10] || chunk[11] || chunk[12]) fail('expected static non-interlaced 8-bit RGB/RGBA PNG');
   channels = chunk[9] === 6 ? 4 : 3;
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
 const stride = width * channels + 1, expected = stride * height;
 let raw; try { raw = inflateSync(Buffer.concat(idat), { maxOutputLength: expected }); } catch { fail('invalid or oversized image data'); }
 if (raw.length !== expected) fail('incorrect decoded image size');
 for (let y = 0; y < height; y++) if (raw[y * stride] > 4) fail('invalid row filter');
 remaining(deadline);
}

function checkOutput(target, inputs, overwrite, deadline) {
 remaining(deadline); safePath(target);
 if (target === dirname(target)) throw new Error('Unsafe output directory');
 for (const input of inputs) if (inside(target, input)) throw new Error('Output directory must not contain the source manifest or project inputs');
 const existing = stat(target); if (!existing) return null;
 if (!overwrite) throw new Error('Output already exists; use a new directory or explicit --overwrite');
 if (!existing.isDirectory()) throw new Error('Output is not a directory');
 const files = [], snapshot = [['.', identity(existing)]];
 for (const name of readdirSync(target).sort()) {
  remaining(deadline); const path = join(target, name), s = stat(path);
  if (s?.isSymbolicLink()) throw new Error('Unsafe output entry: symlink');
  snapshot.push([name, identity(s || {})]);
  if (name === 'frames' || name === 'projects') {
   if (!s?.isDirectory()) throw new Error(`Unsafe ${name} directory`);
   const pattern = name === 'frames' ? /^frame-\d{4}\.(svg|png)$/ : /^frame-\d{4}\.json$/;
   for (const file of readdirSync(path).sort()) {
    const entry = stat(join(path, file));
    if (!pattern.test(file) || !entry?.isFile() || entry.isSymbolicLink()) throw new Error(`Unsafe or unrelated ${name} entry`);
    files.push(`${name}/${file}`); snapshot.push([`${name}/${file}`, identity(entry)]);
   }
  } else {
   if (!ROOT_FILES.includes(name)) throw new Error('Refusing to replace directory containing unrelated files');
   if (!s?.isFile()) throw new Error('Unsafe output entry');
   if (name !== 'receipt.json') files.push(name);
  }
 }
 let receipt;
 try { receipt = parseJson(readRegular(join(target, 'receipt.json'), MAX_JSON_BYTES, deadline).data, 'Receipt'); }
 catch { throw new Error('Overwrite requires an existing agent-draw sequence receipt'); }
 if (receipt.tool !== 'agent-draw' || receipt.kind !== 'sequence' || receipt.schemaVersion !== 1 || !Array.isArray(receipt.artifacts) || receipt.artifacts.length !== files.length) throw new Error('Overwrite requires an existing agent-draw sequence receipt with a matching artifact inventory');
 const owned = new Set();
 for (const artifact of receipt.artifacts) {
  if (!artifact || !files.includes(artifact.name) || owned.has(artifact.name) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Output contains unrelated files not owned by the sequence receipt');
  owned.add(artifact.name);
  if (readRegular(join(target, artifact.name), MAX_ARTIFACT_BYTES, deadline).sha256 !== artifact.sha256) throw new Error(`Output artifact changed since its receipt; refusing to replace: ${artifact.name}`);
 }
 return JSON.stringify(snapshot);
}

export function sequence(source, out, { overwrite = false, timeout = 120 } = {}) {
 integer(timeout, 1, 600, 'timeout');
 const deadline = Date.now() + timeout * 1000, sourcePath = resolve(source), original = readRegular(sourcePath, MAX_JSON_BYTES, deadline);
 const manifest = validateSequenceManifest(parseJson(original.data, 'Sequence manifest')), base = dirname(sourcePath);
 const inputPaths = manifest.frames.map(file => resolve(base, file));
 for (const path of inputPaths) { if (!inside(base, path)) throw new Error('Project input escapes the manifest directory'); safePath(path); }
 const target = resolve(out), parent = dirname(target), protectedInputs = [sourcePath, ...inputPaths];
 const initialOutput = checkOutput(target, protectedInputs, overwrite, deadline);
 const inputs = [], projects = []; let totalBytes = original.bytes, totalPixels = 0;
 for (const path of inputPaths) {
  const input = readRegular(path, MAX_JSON_BYTES, deadline); totalBytes += input.bytes;
  if (totalBytes > MAX_INPUT_BYTES) throw new Error('Total sequence input bytes exceed 32 MiB');
  const parsed = parseJson(input.data, `Project ${path}`);
  if (parsed && Object.hasOwn(parsed, 'animation')) throw new Error('Sequence frames must be static projects without animation');
  const project = validateProject(parsed, dirname(path));
  if (projects.length && (project.width !== projects[0].width || project.height !== projects[0].height)) throw new Error('All sequence frames must have the same canvas dimensions');
  totalPixels += project.width * project.height;
  if (totalPixels > MAX_PIXELS) throw new Error('Total sequence frame pixels exceed 64 Mi pixels');
  inputs.push(input); projects.push(project); remaining(deadline);
 }
 mkdirSync(parent, { recursive: true }); safePath(parent);
 const stage = mkdtempSync(join(parent, '.agent-draw-sequence-')); let work, backup;
 try {
  work = mkdtempSync(join(tmpdir(), 'agent-draw-sequence-'));
  for (const name of ['home', 'config', 'cache', 'data', 'tmp', 'inkscape']) mkdirSync(join(work, name));
  const env = { ...process.env, HOME: join(work, 'home'), XDG_CONFIG_HOME: join(work, 'config'), XDG_CACHE_HOME: join(work, 'cache'), XDG_DATA_HOME: join(work, 'data'), TMPDIR: join(work, 'tmp'), INKSCAPE_PROFILE_DIR: join(work, 'inkscape') };
  delete env.DISPLAY; delete env.WAYLAND_DISPLAY;
  const inkscape = findInkscape({ env, timeoutMs: Math.min(10000, remaining(deadline)) }); remaining(deadline);
  const artifacts = [], warnings = [], sourceFrames = [];
  const save = (name, data) => { remaining(deadline); writeFileSync(join(stage, name), data); artifacts.push({ name, sha256: sha256(data) }); };
  const saveJson = (name, value) => save(name, JSON.stringify(value, null, 2) + '\n');
  const rasterize = (name, width, height) => {
   const destination = name.replace(/\.svg$/, '.png');
   const result = spawnSync(inkscape.command, [join(stage, name), '--export-area-page', '--export-type=png', `--export-filename=${join(stage, destination)}`, '--export-dpi=96', '--export-background-opacity=0'], { env, encoding: 'utf8', timeout: remaining(deadline), killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 });
   remaining(deadline);
   if (result.error || result.status !== 0) throw new Error(`Inkscape sequence export failed: ${result.error?.message || `exit ${result.status}`}\n${(result.stderr || '').slice(-3000)}`);
   const png = readRegular(join(stage, destination), width * height * 4 + height + MAX_JSON_BYTES, deadline);
   verifyPng(png.data, width, height, deadline); artifacts.push({ name: destination, sha256: png.sha256 });
   if (result.stderr?.trim() && warnings.length < 10) warnings.push({ file: name, message: result.stderr.trim().slice(-1000) });
  };
  mkdirSync(join(stage, 'projects')); mkdirSync(join(stage, 'frames'));
  for (let index = 0; index < projects.length; index++) {
   const stem = `frame-${String(index).padStart(4, '0')}`, projectName = `projects/${stem}.json`, svg = `frames/${stem}.svg`, png = `frames/${stem}.png`;
   save(projectName, inputs[index].data); save(svg, renderSvg(projects[index])); rasterize(svg, projects[index].width, projects[index].height);
   sourceFrames.push({ index, path: manifest.frames[index], project: projectName, svg, png, sha256: inputs[index].sha256, bytes: inputs[index].bytes });
  }
  save('source-manifest.json', original.data);
  saveJson('manifest.json', { ...manifest, frames: sourceFrames.map(frame => frame.project) });
  const sheet = contactSheet(projects, manifest.name, deadline); save('contact-sheet.svg', sheet.svg); rasterize('contact-sheet.svg', sheet.width, sheet.height);
  const receipt = { schemaVersion: 1, tool: 'agent-draw', version: toolVersion, kind: 'sequence', ok: true, name: manifest.name, width: projects[0].width, height: projects[0].height, fps: manifest.fps, frames: projects.length, durationSeconds: projects.length / manifest.fps, loop: manifest.loop,
   seam: { closed: null, method: 'not automatically proven for independently drawn poses', requiresVisualReview: true },
   formats: ['svg', 'png'], source: sourcePath, sourceSha256: original.sha256, sourceFrames, manifest: 'manifest.json', sourceManifest: 'source-manifest.json', inputBytes: totalBytes,
   contactSheetFrames: projects.map((_, index) => index), contactSheet: { width: sheet.width, height: sheet.height, columns: sheet.columns, rows: sheet.rows }, inkscape: inkscape.version,
   limitations: ['Each frame uses its authored geometry. No interpolation, generated in-betweens, or automatic pose/foot registration.', 'Loop is playback intent; review the last-to-first transition visually. Matching first and last drawings is not required.'], artifacts, warnings };
  writeFileSync(join(stage, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  for (const previous of [original, ...inputs]) {
   const current = readRegular(previous.path, MAX_JSON_BYTES, deadline);
   if (current.identity !== previous.identity || current.sha256 !== previous.sha256) throw new Error(`Input changed during sequence export: ${previous.path}`);
  }
  if (checkOutput(target, protectedInputs, overwrite, deadline) !== initialOutput) throw new Error('Output changed during sequence export; refusing to replace it');
  remaining(deadline);
  if (stat(target)) { backup = mkdtempSync(join(parent, '.agent-draw-backup-')); renameSync(target, join(backup, 'previous')); }
  try { renameSync(stage, target); } catch (error) { if (backup) renameSync(join(backup, 'previous'), target); throw error; }
  if (backup) { rmSync(backup, { recursive: true, force: true }); backup = undefined; }
  return { ...receipt, output: target };
 } finally {
  if (work) rmSync(work, { recursive: true, force: true });
  rmSync(stage, { recursive: true, force: true });
  if (backup && !stat(join(backup, 'previous'))) rmSync(backup, { recursive: true, force: true });
 }
}

import { spawnSync } from 'node:child_process';
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { validateProject } from './project.js';
import { escapeXml, renderSvg } from './svg.js';
import { findInkscape } from './inkscape.js';

const toolVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const MAX_JSON_BYTES = 2 * 1024 * 1024, MAX_ARTIFACT_BYTES = 70 * 1024 * 1024;
const FILES = ['manifest.json', 'source-manifest.json', 'project.json', 'font.svg', 'font.png', 'font.fnt'];
const sha256 = data => createHash('sha256').update(data).digest('hex');
function stat(path) { try { return lstatSync(path, { bigint: true }); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
const identity = s => [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String).join(':');
function remaining(deadline) { const ms = deadline - Date.now(); if (ms <= 0) throw new Error('Font atlas export timed out'); return ms; }
function safePath(path) {
 for (let current = resolve(path);;) {
  if (stat(current)?.isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${current}`);
  const parent = dirname(current); if (current === parent) break; current = parent;
 }
}
function readRegular(path, limit, deadline) {
 remaining(deadline); safePath(path); const before = stat(path);
 if (!before?.isFile()) throw new Error(`Input must be a regular file: ${path}`);
 if (before.size > BigInt(limit)) throw new Error(`File exceeds byte limit (${limit}): ${path}`);
 let fd;
 try {
  fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0));
  const opened = fstatSync(fd, { bigint: true });
  if (!opened.isFile() || identity(opened) !== identity(before)) throw new Error(`Input changed while reading: ${path}`);
  const data = Buffer.alloc(Number(before.size)); let offset = 0;
  while (offset < data.length) { remaining(deadline); const n = readSync(fd, data, offset, Math.min(1048576, data.length - offset), null); if (!n) break; offset += n; }
  const extra = readSync(fd, Buffer.alloc(1), 0, 1, null);
  safePath(path);
  if (offset !== data.length || extra || identity(fstatSync(fd, { bigint: true })) !== identity(before) || identity(stat(path) || {}) !== identity(before)) throw new Error(`Input changed while reading: ${path}`);
  remaining(deadline); return { data, identity: identity(before), sha256: sha256(data) };
 } finally { if (fd !== undefined) closeSync(fd); }
}
function integer(value, min, max, label) { if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer ${min}..${max}`); }
function text(value, max, label) { if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > max || /[^\x20-\x7e]/.test(value)) throw new Error(`${label} must be printable ASCII text, at most ${max} characters, without surrounding whitespace`); }
function dimensions(m) { return { width: m.columns * m.cellWidth, height: Math.ceil(m.characters.length / m.columns) * m.cellHeight }; }

export function validateFontAtlasManifest(input) {
 if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) throw new Error('Font atlas manifest must be an object');
 for (const key of Object.keys(input)) if (!['version', 'name', 'font', 'size', 'characters', 'columns', 'cellWidth', 'cellHeight'].includes(key)) throw new Error(`Unknown font atlas manifest field: ${key}`);
 if (input.version !== 1) throw new Error('Font atlas manifest version must be 1');
 text(input.name, 120, 'name');
 const defaults = { font: 'monospace', size: 24, characters: Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join(''), columns: 16, cellWidth: 32, cellHeight: 48 };
 const m = { version: 1, name: input.name };
 for (const [key, fallback] of Object.entries(defaults)) m[key] = input[key] === undefined ? fallback : input[key];
 text(m.font, 128, 'font'); integer(m.size, 8, 64, 'size'); integer(m.columns, 1, 16, 'columns');
 integer(m.cellWidth, 16, 128, 'cellWidth'); integer(m.cellHeight, 16, 128, 'cellHeight');
 if (typeof m.characters !== 'string' || !m.characters.length || m.characters.length > 96 || /[^\x20-\x7e]/.test(m.characters) || new Set(m.characters).size !== m.characters.length || !m.characters.trim()) throw new Error('characters must contain unique printable ASCII glyphs (32..126), including a visible glyph, at most 96');
 if (m.cellWidth < m.size + 4 || m.cellHeight < Math.ceil(m.size * 1.5) + 4) throw new Error('Cells must allow size + 4 width and ceil(size * 1.5) + 4 height');
 const { width, height } = dimensions(m);
 if (width > 4096 || height > 4096 || width * height * m.characters.length > 134217728) throw new Error('Font atlas exceeds Draw canvas or layer pixel limits');
 return m;
}

function projectFor(m) {
 const { width, height } = dimensions(m);
 return validateProject({ version: 1, name: m.name, width, height, layers: [...m.characters].map((glyph, i) => ({
  name: `Glyph ${glyph.charCodeAt(0)}`, type: 'text', x: (i % m.columns) * m.cellWidth + 2, y: Math.floor(i / m.columns) * m.cellHeight + 2 + m.size,
  // Draw's string validator requires non-whitespace. ZWSP has no visible ink.
  text: glyph === ' ' ? ' \u200b' : glyph, font: m.font, size: m.size, color: '#FFFFFF'
 })) });
}

export function createFontAtlas(input) {
 const manifest = validateFontAtlasManifest(input), project = projectFor(manifest), m = manifest;
 const chars = [...m.characters].map((glyph, i) => `    <char id="${glyph.charCodeAt(0)}" x="${i % m.columns * m.cellWidth}" y="${Math.floor(i / m.columns) * m.cellHeight}" width="${m.cellWidth}" height="${m.cellHeight}" xoffset="0" yoffset="0" xadvance="${m.cellWidth}" page="0" chnl="15"/>`).join('\n');
 const fnt = `<?xml version="1.0" encoding="UTF-8"?>\n<font>\n  <info face="${escapeXml(m.font)}" size="${m.size}" bold="0" italic="0" charset="ASCII" unicode="1" stretchH="100" smooth="1" aa="1" padding="0,0,0,0" spacing="0,0"/>\n  <common lineHeight="${m.cellHeight}" base="${m.size + 2}" scaleW="${project.width}" scaleH="${project.height}" pages="1" packed="0"/>\n  <pages><page id="0" file="font.png"/></pages>\n  <chars count="${m.characters.length}">\n${chars}\n  </chars>\n  <kernings count="0"/>\n</font>\n`;
 return { manifest, project, fnt };
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => { for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; }
function verifyPng(data, width, height, deadline) {
 const fail = () => { throw new Error('Font atlas PNG verification failed'); };
 if (data.length < 45 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail();
 let offset = 8, header = false, endSeen = false, ended = false; const idat = [];
 while (offset < data.length) {
  remaining(deadline); if (offset + 12 > data.length) fail();
  const length = data.readUInt32BE(offset), end = offset + length + 12, tag = data.toString('ascii', offset + 4, offset + 8), bytes = data.subarray(offset + 8, end - 4);
  if (end > data.length || !/^[A-Za-z]{4}$/.test(tag) || crc32(data.subarray(offset + 4, end - 4)) !== data.readUInt32BE(end - 4)) fail();
  if (!header && tag !== 'IHDR') fail();
  if (tag === 'IHDR') {
   if (header || length !== 13 || bytes.readUInt32BE(0) !== width || bytes.readUInt32BE(4) !== height || bytes[8] !== 8 || bytes[9] !== 6 || bytes[10] || bytes[11] || bytes[12]) fail(); header = true;
  } else if (tag === 'IDAT') { if (ended) fail(); idat.push(bytes); }
  else {
   if (idat.length) ended = true;
   if (['acTL', 'fcTL', 'fdAT'].includes(tag)) fail();
   if (tag === 'IEND') { if (length || !idat.length || end !== data.length) fail(); endSeen = true; }
   else if (tag !== 'PLTE' && /^[A-Z]/.test(tag)) fail();
  }
  offset = end;
 }
 if (!endSeen) fail();
 const stride = width * 4 + 1, expected = stride * height; let raw;
 try { raw = inflateSync(Buffer.concat(idat), { maxOutputLength: expected }); } catch { fail(); }
 if (raw.length !== expected) fail();
 for (let y = 0; y < height; y++) if (raw[y * stride] > 4) fail();
 remaining(deadline);
}

function checkOutput(target, source, overwrite, deadline) {
 remaining(deadline); safePath(target);
 const rel = relative(target, source);
 if (target === dirname(target)) throw new Error('Unsafe output directory');
 if (rel === '' || (rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !isAbsolute(rel))) throw new Error('Output directory must not contain the source manifest');
 const existing = stat(target); if (!existing) return null;
 if (!overwrite) throw new Error('Output already exists; use a new directory or explicit --overwrite');
 if (!existing.isDirectory()) throw new Error('Output is not a directory');
 const snapshot = [['.', identity(existing)]], files = [];
 for (const name of readdirSync(target).sort()) {
  const s = stat(join(target, name));
  if (!s?.isFile() || s.isSymbolicLink()) throw new Error('Unsafe output entry');
  if (![...FILES, 'receipt.json'].includes(name)) throw new Error('Refusing to replace directory containing unrelated files');
  snapshot.push([name, identity(s)]); if (name !== 'receipt.json') files.push(name);
 }
 let receipt;
 try { receipt = JSON.parse(readRegular(join(target, 'receipt.json'), MAX_JSON_BYTES, deadline).data); }
 catch { throw new Error('Overwrite requires an existing agent-draw font-atlas receipt'); }
 if (receipt?.tool !== 'agent-draw' || receipt.kind !== 'font-atlas' || receipt.schemaVersion !== 1 || !Array.isArray(receipt.artifacts) || receipt.artifacts.length !== files.length) throw new Error('Overwrite requires a font-atlas receipt with matching artifact inventory');
 const owned = new Set();
 for (const a of receipt.artifacts) {
  if (!a || !files.includes(a.name) || owned.has(a.name) || !/^[a-f0-9]{64}$/.test(a.sha256)) throw new Error('Output contains unrelated files not owned by receipt');
  owned.add(a.name);
  if (readRegular(join(target, a.name), MAX_ARTIFACT_BYTES, deadline).sha256 !== a.sha256) throw new Error(`Output artifact changed since its receipt: ${a.name}`);
 }
 return JSON.stringify(snapshot);
}

export function fontAtlas(source, out, { overwrite = false, timeout = 60 } = {}) {
 integer(timeout, 1, 300, 'timeout');
 const deadline = Date.now() + timeout * 1000, sourcePath = resolve(source), original = readRegular(sourcePath, MAX_JSON_BYTES, deadline);
 let input; try { input = JSON.parse(original.data.toString('utf8')); } catch { throw new Error('Font atlas manifest must be valid JSON'); }
 const { manifest, project, fnt } = createFontAtlas(input), target = resolve(out), parent = dirname(target);
 const initialOutput = checkOutput(target, sourcePath, overwrite, deadline);
 mkdirSync(parent, { recursive: true }); safePath(parent);
 const stage = mkdtempSync(join(parent, '.agent-draw-font-atlas-')); let backup;
 try {
  // Both renderer profile and artifacts stay inside this owned staging tree.
  const work = join(stage, 'work'); mkdirSync(work);
  for (const name of ['home', 'config', 'cache', 'data', 'tmp', 'inkscape']) mkdirSync(join(work, name));
  const env = { ...process.env, HOME: join(work, 'home'), XDG_CONFIG_HOME: join(work, 'config'), XDG_CACHE_HOME: join(work, 'cache'), XDG_DATA_HOME: join(work, 'data'), TMPDIR: join(work, 'tmp'), TMP: join(work, 'tmp'), TEMP: join(work, 'tmp'), INKSCAPE_PROFILE_DIR: join(work, 'inkscape') };
  delete env.DISPLAY; delete env.WAYLAND_DISPLAY;
  const inkscape = findInkscape({ env, timeoutMs: Math.min(10000, remaining(deadline)) }); remaining(deadline);
  const artifacts = [], save = (name, data) => { remaining(deadline); writeFileSync(join(stage, name), data); artifacts.push({ name, sha256: sha256(data) }); };
  save('source-manifest.json', original.data); save('manifest.json', JSON.stringify(manifest, null, 2) + '\n'); save('project.json', JSON.stringify(project, null, 2) + '\n');
  save('font.svg', renderSvg(project)); save('font.fnt', fnt);
  const result = spawnSync(inkscape.command, [join(stage, 'font.svg'), '--export-area-page', '--export-type=png', `--export-filename=${join(stage, 'font.png')}`, '--export-dpi=96', '--export-background-opacity=0'], { env, encoding: 'utf8', timeout: remaining(deadline), killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 });
  remaining(deadline);
  if (result.error || result.status !== 0) throw new Error(`Inkscape font atlas export failed: ${result.error?.message || `exit ${result.status}`}\n${(result.stderr || '').slice(-3000)}`);
  const png = readRegular(join(stage, 'font.png'), MAX_ARTIFACT_BYTES, deadline); verifyPng(png.data, project.width, project.height, deadline); artifacts.push({ name: 'font.png', sha256: png.sha256 });
  const receipt = { schemaVersion: 1, tool: 'agent-draw', version: toolVersion, kind: 'font-atlas', ok: true, name: manifest.name, font: manifest.font, size: manifest.size, characters: manifest.characters, columns: manifest.columns, rows: Math.ceil(manifest.characters.length / manifest.columns), cellWidth: manifest.cellWidth, cellHeight: manifest.cellHeight, width: project.width, height: project.height, lineHeight: manifest.cellHeight, base: manifest.size + 2, xadvance: manifest.cellWidth, source: sourcePath, sourceSha256: original.sha256, sourceManifest: 'source-manifest.json', manifest: 'manifest.json', project: 'project.json', projectSha256: artifacts.find(a => a.name === 'project.json').sha256, editable: 'font.svg', image: 'font.png', bmfont: 'font.fnt', inkscape: inkscape.version, artifacts, warnings: result.stderr?.trim() ? [result.stderr.trim().slice(-2000)] : [], limitations: ['Fixed-cell advances, no measured glyph bearings or kerning. Font selection/fallback and ink fit require native visual review.'] };
  writeFileSync(join(stage, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  rmSync(work, { recursive: true, force: true });
  const current = readRegular(sourcePath, MAX_JSON_BYTES, deadline);
  if (current.identity !== original.identity || current.sha256 !== original.sha256) throw new Error('Input changed during font atlas export');
  if (checkOutput(target, sourcePath, overwrite, deadline) !== initialOutput) throw new Error('Output changed during font atlas export; refusing to replace it');
  remaining(deadline);
  if (stat(target)) { backup = mkdtempSync(join(parent, '.agent-draw-backup-')); renameSync(target, join(backup, 'previous')); }
  try { renameSync(stage, target); } catch (e) { if (backup) renameSync(join(backup, 'previous'), target); throw e; }
  if (backup) { rmSync(backup, { recursive: true, force: true }); backup = undefined; }
  return { ...receipt, output: target };
 } finally {
  rmSync(stage, { recursive: true, force: true });
  if (backup && !stat(join(backup, 'previous'))) rmSync(backup, { recursive: true, force: true });
 }
}

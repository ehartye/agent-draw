import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inspectInkscape, windowsInkscapeCandidates } from '../src/inkscape.js';
import { temp } from './helpers.js';

const env = { ProgramW6432: 'Z:\\Trusted Programs', ProgramFiles: 'z:/Trusted Programs', 'ProgramFiles(x86)': 'Z:\\Trusted Programs (x86)' };
const ready = { status: 0, stdout: 'Inkscape 1.4.3 (fixture)\n' };
const missing = () => ({ error: { code: 'ENOENT', message: 'not found' } });
const installed = windowsInkscapeCandidates(env);

test('bounded machine roots are case-insensitive, deduplicated and console-first', () => {
  assert.deepEqual(installed, ['Z:\\Trusted Programs\\Inkscape\\bin\\inkscape.com', 'Z:\\Trusted Programs\\Inkscape\\bin\\inkscape.exe', 'Z:\\Trusted Programs (x86)\\Inkscape\\bin\\inkscape.com', 'Z:\\Trusted Programs (x86)\\Inkscape\\bin\\inkscape.exe']);
  assert.deepEqual(windowsInkscapeCandidates({ programfiles: env.ProgramW6432, 'PROGRAMFILES(X86)': '' }), installed.slice(0, 2));
  assert.deepEqual(windowsInkscapeCandidates({ProgramW6432:'\\\\server\\share',ProgramFiles:'relative', 'ProgramFiles(x86)':'\\rooted'}), []);
  assert.equal(windowsInkscapeCandidates({}).length, 4);
});

test('PATH wins; machine discovery follows only missing PATH probes', () => {
  for (const chosen of ['inkscape.com', 'inkscape.exe', ...installed]) {
    const calls = [], report = inspectInkscape({ platform: 'win32', env, timeoutMs: 1234, spawn(command, args, options) {
      calls.push(command); assert.deepEqual(args, ['--version']); assert.equal(options.shell, undefined);
      assert.equal(options.timeout, 1234); assert.equal(options.maxBuffer, 1048576); assert.equal(options.env, env);
      return command === chosen ? ready : missing();
    }});
    const ordered = ['inkscape.com', 'inkscape.exe', ...installed];
    assert.equal(report.ok, true); assert.equal(report.command, chosen);
    assert.deepEqual(calls, ordered.slice(0, ordered.indexOf(chosen) + 1));
    assert.deepEqual(report.attempts.map(a=>a.command), calls);
  }
});

test('all missing candidates are reported without claiming a probe failure', () => {
  const report = inspectInkscape({ platform:'win32', env, spawn:missing });
  assert.equal(report.status, 'missing'); assert.equal(report.attempts.length, 6);
  assert.ok(report.attempts.every(a=>a.status==='missing')); assert.match(report.advice, /official Windows installer/);
});

for (const [status, result] of [
  ['probe-failed', { status: 7, stderr: 'denied' }],
  ['probe-failed', { error: { code:'ETIMEDOUT', message:'timed out' } }],
  ['unrecognized-version', { status:0, stdout:'another tool' }],
  ['too-old', { status:0, stdout:'Inkscape 1.1' }],
]) test(`${status} stops discovery at PATH or installed selection`, () => {
  for (const command of ['inkscape.com', installed[0]]) {
    const calls = [], report = inspectInkscape({ platform:'win32', env, spawn(c) { calls.push(c); return c===command ? result : missing(); } });
    assert.equal(report.status,status); assert.equal(report.command,command); assert.equal(calls.at(-1),command);
    if (status!=='too-old') { assert.match(report.advice,/failed its probe/); assert.ok(!report.advice.startsWith('Install')); }
  }
});

test('explicit override, including empty and missing, never discovers alternatives', () => {
  for (const command of ['', 'Z:\\Override With Spaces\\inkscape.com']) for (const result of [ready, missing(), {status:1,stderr:'bad override'}]) {
    const calls=[], report=inspectInkscape({platform:'win32',env:{...env,AGENT_DRAW_INKSCAPE:command},spawn(c){calls.push(c);return result;}});
    assert.deepEqual(calls,[command]); assert.equal(report.explicitOverride,true); assert.equal(report.command,command);
  }
});

test('existing selected executable with ENOENT is a failed launch, not a missing install', t => {
  const command=join(temp(t),'installed renderer');writeFileSync(command,'fixture');
  const report=inspectInkscape({platform:'win32',env:{AGENT_DRAW_INKSCAPE:command},spawn:missing});
  assert.equal(report.status,'probe-failed'); assert.equal(report.attempts.length,1);
});

test('non-Windows discovery remains unchanged', () => {
  for (const [platform,expected] of [['linux',['inkscape']],['darwin',['inkscape','/Applications/Inkscape.app/Contents/MacOS/inkscape']]]) {
    const report=inspectInkscape({platform,env,spawn:missing});assert.deepEqual(report.attempts.map(a=>a.command),expected);
  }
});

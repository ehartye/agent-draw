import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describeSource,installRuntime,resolveRuntime } from '../scripts/managed-runtime.js';
import { root,temp,project } from './helpers.js';
function sourceCopy(dir){const source=join(dir,'plugin');mkdirSync(source);for(const n of ['package.json','scripts','src'])cpSync(join(root,n),join(source,n),{recursive:true});return source;}
function home(t,path){const old=process.env.AGENT_DRAW_HOME;process.env.AGENT_DRAW_HOME=path;t.after(()=>{if(old===undefined)delete process.env.AGENT_DRAW_HOME;else process.env.AGENT_DRAW_HOME=old;});}
test('managed setup installs immutable fingerprinted copy, resolves, and is idempotent',t=>{const dir=temp(t),source=sourceCopy(dir);home(t,join(dir,'managed'));assert.throws(()=>resolveRuntime(source),/missing/);const d=installRuntime(source),again=installRuntime(source);assert.equal(d.root,again.root);assert.notEqual(d.root,source);assert.equal(describeSource(d.root).fingerprint,d.fingerprint);for(const n of d.files)assert.deepEqual(readFileSync(join(source,n)),readFileSync(join(d.root,n)));assert.equal(resolveRuntime(source).cli,join(d.root,'scripts/agent-draw.mjs'));});
test('managed runtime detects modified files, receipt fingerprint, and symlinks',t=>{const dir=temp(t),source=sourceCopy(dir);home(t,join(dir,'managed'));const d=installRuntime(source),file=join(d.root,'src/svg.js'),original=readFileSync(file);writeFileSync(file,'// tampered\n'+original);assert.throws(()=>resolveRuntime(source),/changed/);assert.throws(()=>installRuntime(source),/changed/);writeFileSync(file,original);writeFileSync(join(d.root,'managed-install.json'),JSON.stringify({fingerprint:'bad'}));assert.throws(()=>resolveRuntime(source),/changed/);symlinkSync(join(source,'package.json'),join(source,'src/linked'));assert.throws(()=>describeSource(source),/symlinks/);});
test('source change requires a new managed release without replacing prior release',t=>{const dir=temp(t),source=sourceCopy(dir);home(t,join(dir,'managed'));const old=installRuntime(source);writeFileSync(join(source,'src/svg.js'),readFileSync(join(source,'src/svg.js'),'utf8')+'\n// new revision\n');assert.throws(()=>resolveRuntime(source),/missing/);const next=installRuntime(source);assert.notEqual(old.fingerprint,next.fingerprint);assert.notEqual(old.root,next.root);assert.ok(existsSync(old.cli));assert.equal(describeSource(old.root).fingerprint,old.fingerprint);});
test('managed home cannot be source, inside source, or parent of source',t=>{const dir=temp(t),source=sourceCopy(dir);home(t,source);for(const path of [source,join(source,'runtime'),dir]){process.env.AGENT_DRAW_HOME=path;assert.throws(()=>installRuntime(source),/separate/);}});
test('managed wrapper executes isolated CLI and fails clearly before setup',t=>{const dir=temp(t),source=sourceCopy(dir);home(t,join(dir,'managed'));const run=(args)=>spawnSync(process.execPath,[join(source,'scripts/run-managed.js'),...args],{encoding:'utf8',env:process.env});assert.equal(run(['--help']).status,1);installRuntime(source);const p=join(dir,'project.json');writeFileSync(p,JSON.stringify(project()));const r=run(['validate',p]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).ok,true);});
test('managed home symlinks cannot bypass separation from plugin source',t=>{
 const dir=temp(t),source=sourceCopy(dir),alias=join(dir,'alias');
 symlinkSync(source,alias);
 home(t,alias);
 for(const candidate of [alias,join(alias,'nested-home')]){
  process.env.AGENT_DRAW_HOME=candidate;
  assert.throws(()=>installRuntime(source),/separate|symlink|Unsafe/i);
 }
 assert.equal(existsSync(join(source,'releases')),false);
});
test('releases directory symlink cannot write outside managed home',t=>{
 const dir=temp(t),source=sourceCopy(dir),managed=join(dir,'managed'),outside=join(dir,'outside');
 mkdirSync(managed);mkdirSync(outside);symlinkSync(outside,join(managed,'releases'));
 home(t,managed);
 assert.throws(()=>installRuntime(source),/outside.*home/);
 assert.throws(()=>resolveRuntime(source),/outside.*home/);
 assert.equal(existsSync(join(outside,describeSource(source).key)),false);
});

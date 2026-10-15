import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateSequenceManifest } from '../src/sequence.js';
import { validateProject } from '../src/project.js';
import { renderSvg } from '../src/svg.js';
import { root } from './helpers.js';

test('drawn pose guide manifests match the executable sequence schema', () => {
 for (const file of ['docs/sequence-format.md','skills/draw-export/references/drawn-sequence.md']) {
  for (const m of readFileSync(join(root,file),'utf8').matchAll(/```json\n([\s\S]*?)```/g)) assert.doesNotThrow(()=>validateSequenceManifest(JSON.parse(m[1])));
 }
});
test('drawn-fire example retains four different static vector drawings', () => {
 const base=join(root,'examples/drawn-fire');
 const manifest=validateSequenceManifest(JSON.parse(readFileSync(join(base,'manifest.json'),'utf8')));
 assert.equal(manifest.frames.length,4);
 const svgs=manifest.frames.map(file=>{
  const raw=JSON.parse(readFileSync(join(base,file),'utf8'));
  assert.equal(raw.animation,undefined);
  const visit=layers=>layers.forEach(layer=>{assert.equal(layer.transform,undefined);if(layer.children)visit(layer.children);});visit(raw.layers);
  const p=validateProject(raw);assert.deepEqual([p.width,p.height],[160,192]);
  return renderSvg({...p,name:'same-name-for-geometry-comparison'});
 });
 assert.equal(new Set(svgs).size,4);
});
test('scale and material study keeps a valid shared-ground calibration scene', () => {
 const raw=JSON.parse(readFileSync(join(root,'examples/scale-material-study.json'),'utf8'));
 assert.doesNotThrow(()=>validateProject(raw));
 const actor=raw.layers.find(layer=>layer.id==='scale-study-actor');
 const door=raw.layers.find(layer=>layer.name==='door recess');
 assert.equal(actor.transform.y+180*actor.transform.scaleY,door.y+door.height);
 assert.equal(door.height,80);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLibrary,drawing,project,MODELS} from './drawing.mjs';
import {GUIDE_PALETTE,applyGuidePalette} from '../guide-palette.mjs';
import {createEight} from '../generate-eight.mjs';
test('overhead projection ignores height and follows all compass facings',()=>{
 for(const [d,q] of Object.entries({S:[192,202],N:[192,182],E:[202,192],W:[182,192]})){assert.deepEqual(project([0,80,10],d).map(Math.round),q);assert.deepEqual(project([0,800,10],d).map(Math.round),q);}
});
test('full overhead set has distinct complete drawings and fixed anatomical sides',()=>{
 const lib=createLibrary();assert.equal(lib.assets.length,384);assert.equal(lib.entries.filter(x=>x.kind==='clip').length,32);
 for(const clip of lib.entries.filter(x=>x.kind==='clip'))assert.equal(new Set(clip.frames.map(f=>JSON.stringify(lib.projects[f.id].layers))).size,8);
 for(const model of Object.keys(MODELS))for(const d of lib.directions){const f=drawing(model,'run',d,0);assert.equal(f.world.sides.right.hip[0]>0,true);const guides=f.spec.layers.at(-1);assert.equal(guides.visible,false);assert.equal(guides.children.find(x=>x.name==='guide-left').stroke,GUIDE_PALETTE.left);assert.equal(guides.children.find(x=>x.name==='guide-right').stroke,GUIDE_PALETTE.right);assert.ok(!JSON.stringify(f.spec).includes('brow'));}
});
test('existing guide amendments preserve every visible contour and map legacy sides',()=>{
 const lib=createEight();for(const a of lib.assets){const before=lib.projects[a.id],after=applyGuidePalette(before,a.direction,!!a.legacyProfile);assert.deepEqual(after.layers.filter(x=>x.id!=='construction-guides'),before.layers.filter(x=>x.id!=='construction-guides'));assert.equal(after.layers.at(-1).visible,false);}
 for(const d of ['E','W']){const a=lib.assets.find(x=>x.direction===d&&x.legacyProfile),p=applyGuidePalette(lib.projects[a.id],d,true);assert.equal(p.layers.at(-1).children.find(x=>x.name.startsWith('guide-near')).stroke,GUIDE_PALETTE[d==='E'?'right':'left']);}
});
test('overhead running separates the returning arm and preserves measured lengths',()=>{
 const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
 for(const [model,m] of Object.entries(MODELS))for(let f=0;f<8;f++){
  const w=drawing(model,'run','S',f).world;
  for(const s of Object.values(w.sides))for(const [a,b,len] of [['shoulder','elbow',m.upperArm],['elbow','wrist',m.forearm],['wrist','hand',m.hand]])assert.ok(Math.abs(dist(s[a],s[b])-len)<1e-8);
  if(f===2||f===6){const z=Object.values(w.sides).map(s=>s.hand[2]-s.shoulder[2]);assert.ok(z[0]*z[1]<0,'both hands reach forward at the passing key');}
  const opposite=drawing(model,'run','S',(f+4)%8).world;
  for(const [a,b] of [['left','right'],['right','left']])assert.ok(dist(w.sides[a].hand.slice(1),opposite.sides[b].hand.slice(1))<1e-8);
 }
});

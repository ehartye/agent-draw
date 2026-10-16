import test from 'node:test';
import assert from 'node:assert/strict';
import {createLibrary,MODELS} from './generate.mjs';
import {validateProject} from '../../src/project.js';
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
const bend=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
test('both distinct models provide eight complete poses in both directions with editable guides',()=>{
 const lib=createLibrary();assert.equal(lib.entries.length,32);
 assert.ok(MODELS.rpg.headH>MODELS.human.headH);
 assert.ok(MODELS.rpg.upperLeg<MODELS.human.upperLeg*.65);
 assert.ok(MODELS.rpg.ribW>MODELS.human.ribW);
 for(const e of lib.entries){
  const p=lib.projects[e.id];validateProject(p);assert.equal(p.width,640);assert.equal(p.height,640);assert.ok(!p.animation);
  const g=p.layers.find(x=>x.name==='construction-guides');assert.equal(g.visible,false);assert.ok(g.children.length>=15);
  const names=p.layers.map(x=>x.name);assert.ok(names.indexOf('far-arm')<names.indexOf('torso'));assert.ok(names.indexOf('near-arm')>names.indexOf('torso'));
 }
});
test('actual paired limb contours keep model dimensions and anatomical bending in every pose and view',()=>{
 const lib=createLibrary();
 for(const e of lib.entries)for(const side of ['near','far']){
  const m=MODELS[e.model],p=lib.projects[e.id],sign=e.direction==='right'?1:-1;
  for(const limb of ['leg','arm']){
   const shape=p.layers.find(x=>x.name===side+'-'+limb).children[0];
   const v=shape.d?.match(/-?\d+(?:\.\d+)?/g).map(Number);
   const q=shape.points??Array.from({length:10},(_,i)=>v.slice(i*2,i*2+2));
   const a=mid(q[0],q[9]),b=mid(q[2],q[7]),c=mid(q[4],q[5]);
   assert.ok(Math.abs(dist(a,b)-m[limb==='leg'?'upperLeg':'upperArm'])<.2,`${e.id} ${side} ${limb} upper length`);
   assert.ok(Math.abs(dist(b,c)-m[limb==='leg'?'lowerLeg':'forearm'])<.2,`${e.id} ${side} ${limb} lower length`);
   assert.ok(sign*bend(a,b,c)*(limb==='leg'?1:-1)>0,`${e.id} ${side} ${limb} hinge reverses`);
  }
 }
});
test('left templates are actual reflected geometry and support feet register to the same ground',()=>{
 const lib=createLibrary();
 for(const e of lib.entries.filter(x=>x.direction==='right')){
  const left=lib.landmarks[e.id.replace(/right$/,'left')],right=lib.landmarks[e.id];
  for(const k of ['hip','shoulder','nearElbow','nearWrist','farElbow','farWrist','nearKnee','nearAnkle','farKnee','farAnkle'])assert.ok(dist(left[k],[640-right[k][0],right[k][1]])<.2);
  if(e.support!=='flight')for(const side of e.support==='both'?['near','far']:[e.support]){
   const foot=lib.projects[e.id].layers.find(x=>x.name===side+'-leg').children.find(x=>x.name===side+'-foot');assert.equal(Math.max(...foot.points.map(x=>x[1])),560);
  }
 }
});

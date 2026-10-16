import test from 'node:test';
import assert from 'node:assert/strict';
import {createEight} from './generate-eight.mjs';
import {MODELS,POSES,createLibrary} from './generate.mjs';
import {construct,drawing,FACINGS,project} from './directional.mjs';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('eight-direction catalogue keeps accepted profiles and gives every build every pose and two real loops',()=>{
 const lib=createEight(),original=createLibrary();assert.equal(lib.assets.length,384);assert.equal(lib.entries.length,160);
 for(const [model,m] of Object.entries(MODELS))for(const d of Object.keys(FACINGS)){
  const e=lib.entries.filter(x=>x.model===model&&x.direction===d);assert.equal(e.length,10);
  assert.deepEqual(e.filter(x=>x.kind==='pose').map(x=>x.pose),POSES);
  for(const clip of e.filter(x=>x.kind==='clip')){
   assert.equal(clip.frames.length,8);assert.equal(clip.loop,true);
   assert.equal(new Set(clip.frames.map(f=>JSON.stringify(lib.projects[f.id].layers))).size,8,'eight unique drawings, no duplicated passing holds');
  }
 }
 const visible=p=>p.layers.filter(x=>x.id!=='construction-guides');
 for(const [id,p] of Object.entries(original.projects))assert.deepEqual(visible(lib.projects[id]),visible(p),'accepted profile contours changed');
});
test('spatial anatomy preserves measured bones, forward knee flexion, planted soles and alternating swing',()=>{
 for(const m of Object.values(MODELS))for(const pose of [...POSES,'walk','run'])for(let f=0;f<(['walk','run'].includes(pose)?8:1);f++){
  const l=construct(m,pose,f);
  for(const s of Object.values(l.sides)){
   for(const [a,b,len] of [['hip','knee',m.upperLeg],['knee','ankle',m.lowerLeg],['shoulder','elbow',m.upperArm],['elbow','wrist',m.forearm],['wrist','hand',m.hand]])assert.ok(Math.abs(distance(s[a],s[b])-len)<1e-7,`${pose} ${f} ${a}/${b}`);
   const cross=(s.knee[1]-s.hip[1])*(s.ankle[2]-s.knee[2])-(s.knee[2]-s.hip[2])*(s.ankle[1]-s.knee[1]);assert.ok(cross>=0,`${pose} backward knee`);
   if(s.contact)assert.equal(s.ankle[1]-m.footH,0,'sole below ground');
  }
  if(['walk','run'].includes(pose)){
   const opposite=construct(m,pose,(f+4)%8);
   for(const [a,b] of [['left','right'],['right','left']])for(const k of ['knee','ankle','elbow','wrist'])assert.ok(distance(l.sides[a][k].slice(1),opposite.sides[b][k].slice(1))<1e-7,'limbs fail to alternate after half a stride');
   for(const s of Object.values(l.sides)){
    const legForward=s.ankle[2]-s.hip[2],armForward=s.elbow[2]-s.shoulder[2];
    if(f%4===0)assert.ok(legForward*armForward<0,'same-side leg and upper arm swing together');
   }
  }
 }
 for(const m of Object.values(MODELS)){
  assert.ok(Array.from({length:8},(_,f)=>construct(m,'run',f)).some(l=>Object.values(l.sides).every(s=>!s.contact)),'run has no flight');
  assert.ok(Array.from({length:8},(_,f)=>construct(m,'walk',f)).every(l=>Object.values(l.sides).some(s=>s.contact)),'walk loses support');
 }
});
test('turned drawings foreshorten, rear skulls have no front facial marks, and profile far arm stays behind torso',()=>{
 assert.ok(distance(project([0,0,0],'S'),project([0,0,100],'S'))<distance(project([0,0,0],'E'),project([0,0,100],'E')));
 for(const m of Object.values(MODELS))for(const d of Object.keys(FACINGS))for(let f=0;f<8;f++){
  const p=drawing(m,'run',d,f).spec;
  assert.equal(p.layers.at(-1).visible,false);assert.equal(p.layers.at(-1).name,'construction-guides');
  const names=p.layers.find(x=>x.name==='head').children.map(x=>x.name);
  if(['N','NE','NW'].includes(d)){assert.ok(names.includes('occiput-and-nape'));assert.ok(!names.some(x=>/brow|nose/.test(x)));}
  if(['E','W'].includes(d)){
   const ids=p.layers.map(x=>x.name),farArm=d==='E'?'right-arm':'left-arm';assert.ok(ids.indexOf(farArm)<ids.indexOf('torso'));
  }
 }
});
test('rear supporting feet expose a complete heel wall and an upper forefoot pointing away',()=>{
 for(const m of Object.values(MODELS))for(const d of ['N','NE','NW'])for(const pose of ['walk','run'])for(let f=0;f<8;f++){
  const result=drawing(m,pose,d,f);
  for(const [side,s] of Object.entries(result.world.sides))if(s.contact){
   const nodes=result.spec.layers.find(x=>x.name===side+'-leg').children,heel=nodes.find(x=>x.name===side+'-heel-wall'),upper=nodes.find(x=>x.name===side+'-foot-upper-plane');
   assert.equal(heel.points.length,4);assert.ok(distance(heel.points[0],heel.points[1])>5,'heel collapsed to a pointed wedge');
   const center=(a,b)=>a.map((v,i)=>(v+b[i])/2),back=center(upper.points[0],upper.points[1]),toe=center(upper.points[2],upper.points[3]);
   assert.ok(toe[1]<back[1],`${m.label}/${d}/${pose}/${f}: forefoot points toward viewer`);
   if(d==='NE')assert.ok(toe[0]>back[0]);if(d==='NW')assert.ok(toe[0]<back[0]);
  }
 }
});

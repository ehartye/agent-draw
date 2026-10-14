import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProject } from '../src/project.js';
import { renderSvg } from '../src/svg.js';
import { sampleAnimation,checkLoopSeam } from '../src/timeline.js';
const leaf=(name='leaf')=>({name,type:'rectangle',width:10,height:10,color:'#abcdef'});
const group=(id='body',children=[leaf()])=>({name:id,type:'group',id,children});
const project=(layers=[group()])=>({version:1,name:'Test',width:64,height:64,layers});
const animated=(property='x',values=[0,10,0],easing='linear',loop=true)=>({...project(),animation:{fps:12,frames:10,loop,tracks:[{target:'body',property,easing,keyframes:values.map((value,i)=>({frame:[0,5,loop?10:9][i],value}))}]}});

test('groups normalize transforms without changing static leaf defaults',()=>{
 const raw=leaf(),staticLeaf=validateProject(project([raw])).layers[0];
 const p=validateProject(project());
 assert.deepEqual(p.layers[0].children[0],staticLeaf);
 assert.deepEqual(p.layers[0].transform,{x:0,y:0,rotation:0,scaleX:1,scaleY:1,pivotX:0,pivotY:0});
 assert.equal('transform' in staticLeaf,false);
});
test('nested groups have stable IDs, labels, transform order and no paint inheritance',()=>{
 const outer=group('body',[group('arm',[leaf()])]);
 outer.name='Body & head';outer.transform={x:2,y:3,pivotX:4,pivotY:5,rotation:-90,scaleX:2,scaleY:3};
 const svg=renderSvg(validateProject(project([outer])));
 assert.match(svg,/id="part-body".*label="Body &amp; head".*transform="translate\(2,3\) translate\(4,5\) rotate\(270\) scale\(2,3\) translate\(-4,-5\)"/);
 assert.ok(svg.indexOf('part-body')<svg.indexOf('part-arm'));
 assert.match(svg,/fill="#abcdef"/);
 const another=group('other',[leaf('other-leaf')]);
 for(const layers of [[outer,another],[another,outer]])assert.match(renderSvg(validateProject(project(layers))),/id="part-body"/);
});
test('all supported leaf shapes can nest',()=>{
 const leaves=[leaf(),{name:'ellipse',type:'ellipse',width:4,height:5,color:'#000000'},{name:'polygon',type:'polygon',points:[[0,0],[1,1],[1,0]],color:'#000000'},{name:'path',type:'path',d:'M0 0 L1 1',color:'#000000'},{name:'text',type:'text',text:'hi',color:'#000000'}];
 const svg=renderSvg(validateProject(project([group('body',leaves)])));
 for(const tag of ['rect','ellipse','polygon','path','text'])assert.ok(svg.includes(`<${tag} `));
});
test('group strict fields, identifiers, visibility, names and finite transform bounds',()=>{
 for(const patch of [{id:'Body'},{id:'a'.repeat(65)},{id:''},{color:'#000000'},{visible:'yes'},{visible:null},{opacity:null},{transform:{x:null}},{transform:{extra:1}},{transform:null},{children:null}])assert.throws(()=>validateProject(project([{...group(),...patch}])));
 for(const [key,invalid] of Object.entries({x:8193,y:-8193,rotation:361,scaleX:0,scaleY:11,pivotX:Infinity,pivotY:NaN}))assert.throws(()=>validateProject(project([{...group(),transform:{[key]:invalid}}])));
 assert.throws(()=>validateProject(project([group('body'),{...group('body',[]),name:'different'}])),/duplicate group ID/);
 assert.throws(()=>validateProject(project([group('body',[leaf('body')])])),/duplicate layer name/);
});
test('group depth, node counts, leaf counts and original leaf-area budget are bounded',()=>{
 let node=leaf();for(let i=0;i<4;i++)node=group(`g${i}`,[node]);
 assert.doesNotThrow(()=>validateProject(project([node])));
 assert.throws(()=>validateProject(project([group('fifth',[node])])),/depth/);
 assert.throws(()=>validateProject(project(Array.from({length:65},(_,i)=>group(`g${i}`,[])))),/64 groups/);
 assert.throws(()=>validateProject(project([group('all',Array.from({length:129},(_,i)=>leaf(`leaf-${i}`)))])),/128 leaves/);
 const large=project([group('all',Array.from({length:9},(_,i)=>leaf(`leaf-${i}`)))]);large.width=large.height=4096;
 assert.throws(()=>validateProject(large),/layer budget/);
 const cyclic=group();cyclic.children=[cyclic];assert.throws(()=>validateProject(project([cyclic])));
});
test('tracks normalize defaults and validate targets, endpoints and strict keys',()=>{
 const input=animated();delete input.animation.loop;delete input.animation.tracks[0].easing;
 const p=validateProject(input);assert.equal(p.animation.loop,true);assert.equal(p.animation.tracks[0].easing,'linear');
 for(const patch of [{target:'leaf'},{property:'pivotX'},{easing:'ease'},{easing:null},{extra:1},{keyframes:[{frame:0,value:0},{frame:10,value:1}]},{keyframes:[{frame:1,value:0},{frame:10,value:0}]},{keyframes:[{frame:0,value:0},{frame:0,value:0},{frame:10,value:0}]}]){
  const a=animated();Object.assign(a.animation.tracks[0],patch);assert.throws(()=>validateProject(a));
 }
 const duplicate=animated();duplicate.animation.tracks.push(structuredClone(duplicate.animation.tracks[0]));assert.throws(()=>validateProject(duplicate),/duplicate/);
 const tooMany=animated();tooMany.animation.tracks=Array(65).fill(tooMany.animation.tracks[0]);assert.throws(()=>validateProject(tooMany),/1..64/);
 const tooManyKeys=animated();tooManyKeys.animation.tracks[0].keyframes=Array(65).fill({frame:0,value:0});assert.throws(()=>validateProject(tooManyKeys),/2..64/);
});
test('animation top-level bounds and property bounds apply to static validation too',()=>{
 for(const patch of [{fps:0},{fps:31},{fps:1.5},{frames:1},{frames:121},{loop:'true'},{loop:null},{tracks:[]},{extra:1}])assert.throws(()=>validateProject({...animated(),animation:{...animated().animation,...patch}}));
 for(const [property,value] of [['x',8193],['y',-8193],['rotation',361],['scaleX',0],['scaleY',11],['opacity',101]])assert.throws(()=>validateProject(animated(property,[value,value,value])));
 const p=animated();p.width=p.height=4096;assert.throws(()=>validateProject(p),/frame budget/);
});
test('sampling is absolute and pure, including keyframe boundaries and virtual endpoint',()=>{
 const p=animated();p.layers[0].transform={x:99};const before=structuredClone(p);
 assert.equal(sampleAnimation(p,2.5).layers[0].transform.x,5);
 assert.equal(sampleAnimation(p,5).layers[0].transform.x,10);
 assert.equal(sampleAnimation(p,10).layers[0].transform.x,0);
 const sampled=sampleAnimation(p,2);assert.equal('animation' in sampled,false);sampled.layers[0].children[0].width=1;
 assert.deepEqual(p,before);
 for(const frame of [-1,11,NaN,Infinity,'1'])assert.throws(()=>sampleAnimation(p,frame));
});
test('smoothstep, step, opacity and nonloop endpoint sampling',()=>{
 assert.ok(Math.abs(sampleAnimation(animated('x',[0,10,0],'smooth'),1).layers[0].transform.x-1.04)<1e-12);
 const step=animated('x',[0,10,0],'step');assert.equal(sampleAnimation(step,4).layers[0].transform.x,0);assert.equal(sampleAnimation(step,5).layers[0].transform.x,10);assert.equal(sampleAnimation(step,10).layers[0].transform.x,0);
 assert.equal(sampleAnimation(animated('opacity',[100,0,100]),2.5).layers[0].opacity,50);
 const nonloop=animated('x',[0,10,20],'linear',false);assert.equal(sampleAnimation(nonloop,9).layers[0].transform.x,20);assert.throws(()=>sampleAnimation(nonloop,10));assert.throws(()=>checkLoopSeam(nonloop));
});
test('canonical seam permits full rotation and rejects open loops',()=>{
 assert.deepEqual(checkLoopSeam(animated('rotation',[0,180,360])),{closed:true,method:'canonical SVG equality at virtual endpoint'});
 assert.deepEqual(checkLoopSeam(animated('rotation',[-360,0,360])).closed,true);
 assert.throws(()=>checkLoopSeam(animated('x',[0,10,1])),/endpoint/);
});

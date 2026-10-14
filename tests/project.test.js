import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { validateProject,validatePath,readProject } from '../src/project.js';
import { renderSvg,escapeXml } from '../src/svg.js';
import { project,rectangle,temp,cli } from './helpers.js';

test('normalization supplies defaults without mutating input',()=>{const input=project(),copy=structuredClone(input),p=validateProject(input);assert.deepEqual(input,copy);assert.deepEqual(p.layers[0],{...rectangle(),x:0,y:0,radius:0,visible:true,opacity:100});});
for(const [name,change] of Object.entries({version:{version:2},unknown:{script:'x'},width:{width:0},fraction:{height:1.2},infinite:{height:Infinity},layers:{layers:[]},tooMany:{layers:Array.from({length:129},(_,i)=>rectangle({name:String(i)}))},duplicate:{layers:[rectangle(),rectangle()]},budget:{width:4096,height:4096,layers:Array.from({length:9},(_,i)=>rectangle({name:String(i)}))},control:{name:'bad\u0000name'}}))test(`rejects invalid project: ${name}`,()=>assert.throws(()=>validateProject(project(change))));
for(const [name,change] of Object.entries({image:{type:'image',src:'/etc/passwd'},script:{onload:'alert(1)'},fillUrl:{color:'url(file:///etc/passwd)'},badColor:{color:'#fff'},badStroke:{stroke:'red'},strokeWidth:{strokeWidth:3},opacity:{opacity:101},visible:{visible:'false'},coordinate:{x:1.5},negativeSize:{width:-1},badRadius:{radius:-1},nan:{x:NaN},pathUnknown:{type:'__proto__'},badFont:{type:'text',width:undefined}}))test(`rejects invalid layer: ${name}`,()=>assert.throws(()=>validateProject(project({layers:[rectangle(change)]}))));
test('supports all shapes and alpha, stroke, visibility, and text defaults',()=>{const p=validateProject(project({layers:[rectangle({color:'#FF000080',stroke:'#00112280',opacity:42,visible:false}),{name:'Ellipse',type:'ellipse',width:10,height:12,color:'#123456'},{name:'Polygon',type:'polygon',points:[[0,0],[20.5,0],[0,20]],color:'#654321'},{name:'Path',type:'path',d:'M0 0 L20 20 Z',color:'#000000'},{name:'Text',type:'text',text:'Hello\nWorld',color:'#000000'}]}));assert.equal(p.layers[0].strokeWidth,1);assert.equal(p.layers[4].font,'DejaVu Sans');assert.equal(p.layers[4].size,32);const svg=renderSvg(p);for(const tag of ['rect','ellipse','polygon','path','text','tspan'])assert.ok(svg.includes(`<${tag} `));assert.match(svg,/fill-opacity="0.5019607843137255"/);assert.match(svg,/stroke-opacity="0.5019607843137255"/);assert.match(svg,/opacity="0.42" style="display:none"/);assert.ok(svg.indexOf('Rectangle')<svg.indexOf('Ellipse'));assert.ok(!svg.includes('<image'));});
test('escapes XML in every user-controlled string field',()=>{const attack='\"\'><script>alert(1)</script>&';const p=validateProject(project({name:attack,layers:[{name:attack,type:'text',text:attack,font:attack,color:'#000000'}]}));const svg=renderSvg(p);assert.ok(!svg.includes('<script'));assert.ok(!svg.includes('</script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.equal(escapeXml('&<>\"\''),'&amp;&lt;&gt;&quot;&apos;');assert.equal((svg.match(/&lt;script&gt;/g)||[]).length,4);});
for(const d of ['M0 0','m.5 -.5 2 3','M0 0 L1 2 3 4 H5 6 V7 8 Z','M0 0 C1 2 3 4 5 6 S1 2 3 4 Q1 2 3 4 T5 6','M0 0 A10 20 45 0 1 30 40 a1 2 0 1 0 3 4','M1e2 -2E-1l+2.5-.5z'])test(`accepts path ${d}`,()=>assert.doesNotThrow(()=>validatePath(d)));
for(const d of ['', 'L0 0','M','M0','M0 0 L1','M0 0 H','M0 0 C1 2 3 4','M0 0 S1 2 3','M0 0 Q1','M0 0 T1','M0 0 A1 2 3 0 1 5','M0 0 A1 2 3 2 1 5 6','M0 0 A-1 2 3 0 1 5 6','M0 0 Z 1 2','M0 0 X1 2','M0 0<script>','M1e999 0','M16385 0',`M0 0 ${'L0 0 '.repeat(3000)}`])test(`rejects malformed path ${d.slice(0,50)}`,()=>assert.throws(()=>validatePath(d)));
test('rejects polygon malformed pairs and out-of-range values',()=>{for(const points of [[[0,0],[1,1]],[[0,0],[1,1],[2]],[[0,0],[1,1],[Infinity,2]]])assert.throws(()=>validateProject(project({layers:[{name:'p',type:'polygon',points,color:'#000000'}]})));});
test('readProject resolves source symlinks and rejects malformed or oversized files',t=>{const dir=temp(t),p=join(dir,'p.json');writeFileSync(p,JSON.stringify(project()));symlinkSync(p,join(dir,'link'));assert.equal(readProject(join(dir,'link')).path,p);writeFileSync(p,'{broken');assert.throws(()=>readProject(p));writeFileSync(p,' '.repeat(2097153));assert.throws(()=>readProject(p),/2 MiB/);assert.throws(()=>readProject(dir));});
test('CLI validates and inspects normalized projects and rejects incorrect flags',t=>{const dir=temp(t),p=join(dir,'p.json');writeFileSync(p,JSON.stringify(project()));assert.equal(JSON.parse(cli(['validate',p]).stdout).ok,true);assert.equal(JSON.parse(cli(['inspect',p]).stdout).layers[0].opacity,100);for(const args of [['wat'],['validate',p,'extra'],['doctor','extra'],['build',p],['build',p,'--out'],['build',p,'--out','--overwrite'],['build',p,'--out','a','--out','b'],['build',p,'--out','a','--unknown'],['build',p,'--out','a','--timeout','NaN']]){const r=cli(args);assert.equal(r.status,1,JSON.stringify(args));assert.equal(JSON.parse(r.stderr).ok,false);}assert.equal(cli(['--help']).status,0);});
for(const codepoint of [0xfffe,0xffff]) {
 test(`rejects XML noncharacter U+${codepoint.toString(16).toUpperCase()} in names, text, and font`,()=>{
  const bad=`bad${String.fromCodePoint(codepoint)}value`;
  assert.throws(()=>validateProject(project({name:bad})),/invalid string/);
  assert.throws(()=>validateProject(project({layers:[rectangle({name:bad})]})),/invalid string/);
  for(const field of ['text','font']){
   const text={name:'Text',type:'text',text:'safe',font:'DejaVu Sans',color:'#000000',[field]:bad};
   assert.throws(()=>validateProject(project({layers:[text]})),/invalid string/);
  }
 });
}

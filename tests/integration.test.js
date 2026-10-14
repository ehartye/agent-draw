import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,mkdirSync,writeFileSync,readFileSync,readdirSync,symlinkSync,cpSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { build,findInkscape } from '../src/backend.js';
import { validateProject } from '../src/project.js';
import { root,project,rectangle,temp } from './helpers.js';
let inkscape;try{inkscape=findInkscape();}catch{}
const integration={skip:inkscape?false:'Inkscape 1.2+ is not installed; real export integration skipped'};
function pngPixels(file){const b=readFileSync(file),idat=[];let width,height,depth,type;for(let i=8;i<b.length;){const len=b.readUInt32BE(i),tag=b.toString('ascii',i+4,i+8),data=b.subarray(i+8,i+8+len);if(tag==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];assert.equal(data[12],0,'noninterlaced PNG');}if(tag==='IDAT')idat.push(data);i+=len+12;}assert.equal(depth,8);assert.ok([2,6].includes(type),`RGB/RGBA PNG, got ${type}`);const channels=type===6?4:3,stride=width*channels,raw=inflateSync(Buffer.concat(idat)),decoded=Buffer.alloc(height*stride);const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=channels?decoded[y*stride+x-channels]:0,b=y?decoded[(y-1)*stride+x]:0,c=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;assert.ok(filter<=4);decoded[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}return {width,height,pixel(x,y){const i=y*stride+x*channels;return [...decoded.subarray(i,i+3),channels===4?decoded[i+3]:255];}};}
test('refuses overwrite, unrelated files, source containment, symlink outputs and unsafe entries before export',t=>{const dir=temp(t),source=join(dir,'project.json');writeFileSync(source,JSON.stringify(project()));const p=validateProject(project()),out=join(dir,'out');mkdirSync(out);assert.throws(()=>build(p,source,out),/already exists/);writeFileSync(join(out,'precious.txt'),'keep');assert.throws(()=>build(p,source,out,{overwrite:true}),/unrelated/);assert.equal(readFileSync(join(out,'precious.txt'),'utf8'),'keep');assert.throws(()=>build(p,source,dir,{overwrite:true}),/source project/);const link=join(dir,'link');symlinkSync(out,link);assert.throws(()=>build(p,source,link,{overwrite:true}),/Unsafe/);const nested=join(dir,'nested');mkdirSync(nested);mkdirSync(join(nested,'drawing.svg'));assert.throws(()=>build(p,source,nested,{overwrite:true}),/Unsafe output entry/);const linked=join(dir,'linked');mkdirSync(linked);symlinkSync(source,join(linked,'drawing.svg'));assert.throws(()=>build(p,source,linked,{overwrite:true}),/Unsafe output entry/);assert.throws(()=>build(p,source,'/',{overwrite:true}),/Unsafe/);});
test('rejects invalid timeouts before touching the filesystem',t=>{const dir=temp(t);for(const timeout of [0,301,NaN,Infinity,1.5,'2'])assert.throws(()=>build(validateProject(project()),null,join(dir,'out'),{timeout}),/timeout/);assert.deepEqual(readdirSync(dir),[]);});
test('real Inkscape exports layered editable SVG, transparent colored PNG, and vector PDF with verified receipts',integration,t=>{const dir=temp(t),source=join(dir,'project.json'),input=project({width:100,height:100,layers:[rectangle({name:'bottom red',width:40,height:40}),rectangle({name:'top blue',x:20,y:20,width:30,height:30,color:'#0000ff'}),rectangle({name:'hidden green',width:100,height:100,color:'#00ff00',visible:false}),rectangle({name:'alpha yellow',x:60,y:0,width:20,height:20,color:'#ffff0080',opacity:50}),{name:'ellipse',type:'ellipse',x:60,y:30,width:20,height:20,color:'#00ff00'},{name:'polygon',type:'polygon',points:[[0,60],[20,60],[0,80]],color:'#ff00ff'},{name:'path',type:'path',d:'M30 60h20v20h-20z',color:'#00ffff'},{name:'text',type:'text',x:60,y:75,text:'Hi',size:14,color:'#000000'}]});writeFileSync(source,JSON.stringify(input));const out=join(dir,'output'),receipt=build(validateProject(input),source,out);assert.equal(receipt.ok,true);assert.match(receipt.inkscape,/Inkscape/);assert.deepEqual(receipt.layersBottomToTop,input.layers.map(l=>l.name));assert.equal(receipt.sourceSha256,createHash('sha256').update(readFileSync(source)).digest('hex'));assert.deepEqual(readdirSync(out).sort(),['drawing.pdf','drawing.png','drawing.svg','receipt.json']);for(const a of receipt.artifacts)assert.equal(a.sha256,createHash('sha256').update(readFileSync(join(out,a.name))).digest('hex'));const svg=readFileSync(join(out,'drawing.svg'),'utf8');assert.equal((svg.match(/inkscape:groupmode="layer"/g)||[]).length,8);assert.ok(!svg.includes('<image'));assert.ok(svg.includes('<text'));const image=pngPixels(join(out,'drawing.png'));assert.deepEqual([image.width,image.height],[100,100]);assert.deepEqual(image.pixel(10,10),[255,0,0,255]);assert.deepEqual(image.pixel(25,25),[0,0,255,255]);assert.equal(image.pixel(90,90)[3],0);const alpha=image.pixel(65,5);assert.deepEqual(alpha.slice(0,3),[255,255,0]);assert.ok(Math.abs(alpha[3]-64)<=1);assert.deepEqual(image.pixel(70,40),[0,255,0,255]);assert.deepEqual(image.pixel(5,65),[255,0,255,255]);assert.deepEqual(image.pixel(35,65),[0,255,255,255]);const pdf=readFileSync(join(out,'drawing.pdf'));assert.equal(pdf.toString('ascii',0,5),'%PDF-');assert.ok(!pdf.toString('latin1').match(/\/Subtype\s*\/Image\b/),'PDF retains vectors rather than embedding bitmap');assert.throws(()=>build(validateProject(input),source,out),/already exists/);assert.equal(build(validateProject(input),source,out,{overwrite:true}).ok,true);assert.deepEqual(readdirSync(dir).sort(),['output','project.json']);});
test('setup --check and managed doctor use actual Inkscape without plugin registration',integration,t=>{const dir=temp(t),source=join(dir,'plugin');mkdirSync(source);for(const n of ['package.json','scripts','src'])cpSync(join(root,n),join(source,n),{recursive:true});const env={...process.env,AGENT_DRAW_HOME:join(dir,'home')},run=(script,args)=>spawnSync(process.execPath,[join(source,'scripts',script),...args],{env,encoding:'utf8'});assert.equal(run('setup.js',['--check','--json']).status,1);const installed=run('setup.js',['--json']);assert.equal(installed.status,0,installed.stderr+installed.stdout);const record=JSON.parse(installed.stdout);assert.equal(record.ok,true);assert.equal(run('setup.js',['--check','--json']).status,0);const doctor=run('run-managed.js',['doctor']);assert.equal(doctor.status,0,doctor.stderr);assert.match(JSON.parse(doctor.stdout).inkscape.version,/Inkscape/);assert.ok(existsSync(record.cli));assert.equal(run('setup.js',['--unexpected']).status,1);});
function executableEnv(t,executable){
 const old=process.env.AGENT_DRAW_INKSCAPE;
 process.env.AGENT_DRAW_INKSCAPE=executable;
 t.after(()=>{if(old===undefined)delete process.env.AGENT_DRAW_INKSCAPE;else process.env.AGENT_DRAW_INKSCAPE=old;});
}
test('missing Inkscape executable fails cleanly without creating output',t=>{
 const dir=temp(t),out=join(dir,'output');
 executableEnv(t,join(dir,'does-not-exist'));
 assert.throws(()=>build(validateProject(project()),null,out),/Inkscape 1.2\+ CLI not found/);
 assert.deepEqual(readdirSync(dir),[]);
});
test('bounded export timeout cleans staging and preserves existing output',t=>{
 const dir=temp(t),fixture=join(dir,'timeout-inkscape'),out=join(dir,'output');
 // Trusted local fixture runs only the existing Node binary. No download or package install.
 writeFileSync(fixture,`#!${process.execPath}\nif(process.argv.includes('--version')){console.log('Inkscape 1.4 (test fixture)');}else{setTimeout(()=>{},30000);}\n`,{mode:0o700});
 mkdirSync(out);writeFileSync(join(out,'drawing.svg'),'original SVG');
 executableEnv(t,fixture);
 const started=Date.now();
 assert.throws(()=>build(validateProject(project()),null,out,{overwrite:true,timeout:1}),/timed out|ETIMEDOUT/);
 assert.ok(Date.now()-started<10000,'one-second deadline terminates a thirty-second child');
 assert.equal(readFileSync(join(out,'drawing.svg'),'utf8'),'original SVG');
 assert.deepEqual(readdirSync(out),['drawing.svg']);
 assert.deepEqual(readdirSync(dir).sort(),['output','timeout-inkscape']);
});
test('nonzero export exit preserves existing output and removes staging',t=>{
 const dir=temp(t),fixture=join(dir,'failed-inkscape'),out=join(dir,'output');
 writeFileSync(fixture,`#!${process.execPath}\nif(process.argv.includes('--version')){console.log('Inkscape 1.4 (test fixture)');}else{console.error('intentional fixture failure');process.exitCode=3;}\n`,{mode:0o700});
 mkdirSync(out);writeFileSync(join(out,'drawing.svg'),'original SVG');
 executableEnv(t,fixture);
 assert.throws(()=>build(validateProject(project()),null,out,{overwrite:true}),/exit 3.*\nintentional fixture failure/);
 assert.equal(readFileSync(join(out,'drawing.svg'),'utf8'),'original SVG');
 assert.deepEqual(readdirSync(dir).sort(),['failed-inkscape','output']);
});

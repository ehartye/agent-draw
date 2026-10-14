import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,mkdirSync,writeFileSync,readFileSync,readdirSync,symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { animate,contactSheetIndexes,renderContactSheet } from '../src/animation.js';
import { inspectFfmpeg } from '../src/ffmpeg.js';
import { inspectInkscape } from '../src/inkscape.js';
import { validateProject } from '../src/project.js';
import { temp,cli } from './helpers.js';
import { pngPixels } from './png.js';
const project=()=>({version:1,name:'Animated test',width:32,height:32,layers:[{name:'Body',type:'group',id:'body',children:[{name:'Square',type:'rectangle',width:8,height:8,color:'#ff0000',fillGradient:{type:'linear',x1:0,y1:0,x2:8,y2:0,stops:[{offset:0,color:'#ff0000'},{offset:1,color:'#0000ff'}]}}]}],animation:{fps:12,frames:4,loop:true,tracks:[{target:'body',property:'x',keyframes:[{frame:0,value:0},{frame:2,value:16},{frame:4,value:0}]}]}});
const inkscape=inspectInkscape(),ffmpeg=inspectFfmpeg();
function override(t,key,value){const old=process.env[key];process.env[key]=value;t.after(()=>{if(old===undefined)delete process.env[key];else process.env[key]=old;});}
function previous(out){mkdirSync(out);writeFileSync(join(out,'receipt.json'),JSON.stringify({tool:'agent-draw',kind:'animation',schemaVersion:1}));writeFileSync(join(out,'master.svg'),'original');}

test('contact sheet indexes are deterministic and generated IDs and references are unique',()=>{
 assert.deepEqual(contactSheetIndexes(24),[0,6,12,18,23]);assert.deepEqual(contactSheetIndexes(2),[0,1]);
 const sheet=renderContactSheet(validateProject(project()));
 const ids=[...sheet.svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,reference] of sheet.svg.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(reference));
 assert.match(sheet.svg,/sample-0-part-body/);assert.doesNotMatch(sheet.svg,/<image/);
});
test('rejects invalid timeouts and MP4 settings before creating output',t=>{
 const dir=temp(t),out=join(dir,'out');
 for(const timeout of [0,601,NaN,1.5,'2'])assert.throws(()=>animate(project(),null,out,{timeout}),/timeout/);
 assert.throws(()=>animate(project(),null,out,{mp4:true}),/explicit/);
 assert.throws(()=>animate(project(),null,out,{mp4:true,background:'red'}),/#RRGGBB/);
 const odd=project();odd.width=31;assert.throws(()=>animate(odd,null,out,{mp4:true,background:'#ffffff'}),/even canvas/);
 assert.deepEqual(readdirSync(dir),[]);
});
test('output guards protect source, unknown entries, symlinks and unrecognized directories',t=>{
 const dir=temp(t),source=join(dir,'input.json'),out=join(dir,'out');writeFileSync(source,JSON.stringify(project()));previous(out);
 assert.throws(()=>animate(project(),source,out),/already exists/);
 assert.throws(()=>animate(project(),source,dir,{overwrite:true}),/source project/);
 const link=join(dir,'link');symlinkSync(out,link);assert.throws(()=>animate(project(),source,link,{overwrite:true}),/Unsafe/);
 mkdirSync(join(out,'frames'));writeFileSync(join(out,'frames','important.txt'),'keep');assert.throws(()=>animate(project(),source,out,{overwrite:true}),/unrelated/);
 assert.equal(readFileSync(join(out,'frames','important.txt'),'utf8'),'keep');
 const unknown=join(dir,'unknown');mkdirSync(unknown);writeFileSync(join(unknown,'master.svg'),'user artwork');assert.throws(()=>animate(project(),source,unknown,{overwrite:true}),/receipt/);
});
test('explicit broken FFmpeg selection is authoritative and encoding failure preserves output',t=>{
 const dir=temp(t),missing=join(dir,'missing');assert.equal(inspectFfmpeg({env:{...process.env,AGENT_DRAW_FFMPEG:missing}}).status,'missing');
 if(!inkscape.ok)return;
 const out=join(dir,'out');previous(out);override(t,'AGENT_DRAW_FFMPEG',missing);
 assert.throws(()=>animate(project(),null,out,{gif:true,overwrite:true}),/FFmpeg missing/);
 assert.equal(readFileSync(join(out,'master.svg'),'utf8'),'original');assert.deepEqual(readdirSync(dir),['out']);
});
test('real frames-only export ignores missing optional FFmpeg, verifies transparent motion and file hashes',{skip:!inkscape.ok},t=>{
 const dir=temp(t),source=join(dir,'input.json'),out=join(dir,'out'),p=project();writeFileSync(source,JSON.stringify(p));
 override(t,'AGENT_DRAW_FFMPEG',join(dir,'missing'));
 const receipt=animate(p,source,out);assert.equal(receipt.ok,true);assert.equal(receipt.frames,4);assert.equal(receipt.durationSeconds,4/12);assert.equal(receipt.seam.closed,true);assert.equal(receipt.ffmpeg,null);
 assert.deepEqual(readdirSync(out).sort(),['contact-sheet.png','contact-sheet.svg','frames','master.svg','project.json','receipt.json']);
 assert.equal(readdirSync(join(out,'frames')).length,8);assert.deepEqual(p,JSON.parse(readFileSync(source,'utf8')));
 for(const artifact of receipt.artifacts)assert.equal(artifact.sha256,createHash('sha256').update(readFileSync(join(out,artifact.name))).digest('hex'));
 const first=pngPixels(join(out,'frames/frame-0000.png')),middle=pngPixels(join(out,'frames/frame-0002.png'));
 assert.equal(first.pixel(2,2)[3],255);assert.equal(first.pixel(18,2)[3],0);assert.equal(middle.pixel(2,2)[3],0);assert.equal(middle.pixel(18,2)[3],255);
 assert.equal(animate(p,source,out,{overwrite:true}).ok,true);assert.deepEqual(readdirSync(dir).sort(),['input.json','out']);
});
test('real optional FFmpeg GIF and MP4 export',{skip:!inkscape.ok||!ffmpeg.ok},t=>{
 const dir=temp(t),out=join(dir,'out'),receipt=animate(project(),null,out,{gif:true,mp4:true,background:'#ffffff'});
 assert.deepEqual(receipt.formats,['svg','png','gif','mp4']);assert.equal(receipt.background,'#ffffff');assert.ok(receipt.limitations[0].includes('1-bit'));
 assert.equal(readFileSync(join(out,'animation.gif')).toString('ascii',0,6),'GIF89a');assert.equal(readFileSync(join(out,'animation.mp4')).toString('ascii',4,8),'ftyp');
});
test('bounded export failure cleans private staging and preserves recognized output',t=>{
 const dir=temp(t),fixture=join(dir,'timeout-inkscape'),out=join(dir,'out');previous(out);
 writeFileSync(fixture,`#!${process.execPath}\nif(process.argv.includes('--version'))console.log('Inkscape 1.4 (fixture)');else setTimeout(()=>{},30000);\n`,{mode:0o700});override(t,'AGENT_DRAW_INKSCAPE',fixture);
 const started=Date.now();assert.throws(()=>animate(project(),null,out,{overwrite:true,timeout:1}),/timed out|ETIMEDOUT/);assert.ok(Date.now()-started<5000);
 assert.equal(readFileSync(join(out,'master.svg'),'utf8'),'original');assert.deepEqual(readdirSync(dir).sort(),['out','timeout-inkscape']);
});
test('CLI rejects duplicate or unknown animate flags and reports optional FFmpeg in doctor',t=>{
 const dir=temp(t),source=join(dir,'input.json');writeFileSync(source,JSON.stringify(project()));
 for(const args of [['--gif','--gif'],['--background'],['--unknown']])assert.equal(cli(['animate',source,'--out',join(dir,'out'),...args]).status,1);
 const doctor=cli(['doctor'],{AGENT_DRAW_FFMPEG:join(dir,'missing')});const report=JSON.parse(doctor.stdout);assert.equal(report.ffmpeg.optional,true);assert.equal(report.ffmpeg.ok,false);assert.equal(report.ok,report.inkscape.ok);
 assert.equal(existsSync(join(dir,'out')),false);
});

test('failed optional encoder cleans staging after successful renders and preserves old output',{skip:!inkscape.ok},t=>{
 const dir=temp(t),fixture=join(dir,'failed-ffmpeg'),out=join(dir,'out');previous(out);
 writeFileSync(fixture,`#!${process.execPath}\nif(process.argv.includes('-version'))console.log('ffmpeg version 7.1 fixture');else{console.error('encoder unavailable');process.exitCode=3;}\n`,{mode:0o700});override(t,'AGENT_DRAW_FFMPEG',fixture);
 assert.throws(()=>animate(project(),null,out,{overwrite:true,gif:true}),/FFmpeg GIF encoding failed.*exit 3/);
 assert.equal(readFileSync(join(out,'master.svg'),'utf8'),'original');assert.deepEqual(readdirSync(dir).sort(),['failed-ffmpeg','out']);
});
test('overall animation deadline includes version probes',t=>{
 const dir=temp(t),fixture=join(dir,'slow-inkscape');
 writeFileSync(fixture,`#!${process.execPath}\nsetTimeout(()=>{},30000);\n`,{mode:0o700});override(t,'AGENT_DRAW_INKSCAPE',fixture);
 const started=Date.now();assert.throws(()=>animate(project(),null,join(dir,'out'),{timeout:1}),/probe failed/);assert.ok(Date.now()-started<3000);assert.deepEqual(readdirSync(dir),['slow-inkscape']);
});
test('overwrite rejects symlinked and nested frame entries before rendering',t=>{
 const dir=temp(t),out=join(dir,'out');previous(out);mkdirSync(join(out,'frames'));
 symlinkSync(join(out,'master.svg'),join(out,'frames/frame-0000.svg'));
 assert.throws(()=>animate(project(),null,out,{overwrite:true}),/Unsafe or unrelated frames/);assert.equal(readFileSync(join(out,'master.svg'),'utf8'),'original');
});

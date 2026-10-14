import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, lstatSync, realpathSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { validateProject } from './project.js';
import { renderSvg } from './svg.js';
import { sampleAnimation, checkLoopSeam } from './timeline.js';
import { findInkscape } from './inkscape.js';
import { inspectFfmpeg, encodeAnimation } from './ffmpeg.js';
const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const inside=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
function stat(p){try{return lstatSync(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function canonical(p){return existsSync(p)?realpathSync(p):join(canonical(dirname(p)),basename(p));}
const names=['master.svg','project.json','contact-sheet.svg','contact-sheet.png','animation.gif','animation.mp4','receipt.json','frames'];
function checkOutput(target,source,overwrite){
 if(target===dirname(target)||stat(target)?.isSymbolicLink())throw new Error('Unsafe output directory');
 if(source&&inside(canonical(target),realpathSync(source)))throw new Error('Output directory must not contain the source project');
 if(!existsSync(target))return;
 if(!overwrite)throw new Error('Output already exists; use a new directory or explicit --overwrite');
 if(!stat(target).isDirectory())throw new Error('Output is not a directory');
 for(const name of readdirSync(target)){
  if(!names.includes(name))throw new Error('Refusing to replace directory containing unrelated files');
  const path=join(target,name),s=stat(path);
  if(s.isSymbolicLink())throw new Error('Unsafe output entry');
  if(name==='frames'){
   if(!s.isDirectory())throw new Error('Unsafe frames directory');
   for(const entry of readdirSync(path))if(!/^frame-\d{4}\.(svg|png)$/.test(entry)||!stat(join(path,entry)).isFile()||stat(join(path,entry)).isSymbolicLink())throw new Error('Unsafe or unrelated frames entry');
  }else if(!s.isFile())throw new Error('Unsafe output entry');
 }
 // Names alone are insufficient evidence that this is our generated directory.
 const receiptPath=join(target,'receipt.json');
 let receipt;try{receipt=JSON.parse(readFileSync(receiptPath,'utf8'));}catch{throw new Error('Overwrite requires an existing agent-draw animation receipt');}
 if(receipt.tool!=='agent-draw'||receipt.kind!=='animation'||receipt.schemaVersion!==1)throw new Error('Overwrite requires an existing agent-draw animation receipt');
}
export function contactSheetIndexes(frames){return [...new Set([0,Math.floor(frames/4),Math.floor(frames/2),Math.floor(3*frames/4),frames-1])];}
export function renderContactSheet(project,indexes=contactSheetIndexes(project.animation.frames)){
 const scale=Math.min(1,320/project.width,240/project.height),w=Math.ceil(project.width*scale),h=Math.ceil(project.height*scale),gap=12,label=24;
 const width=indexes.length*(w+gap)+gap,height=h+label+gap*2;
 const cells=indexes.map((frame,i)=>{
  // Only our generated renderer output enters this composition. No imported XML.
  const svg=renderSvg(sampleAnimation(project,frame));
  let body=svg.slice(svg.indexOf('>',svg.indexOf('<svg'))+1,svg.lastIndexOf('</svg>'));
  body=body.replace(/\bid="([^"]+)"/g,`id="sample-${i}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#sample-${i}-$1)`);
  const x=gap+i*(w+gap);
  return `<svg x="${x}" y="${gap}" width="${w}" height="${h}" viewBox="0 0 ${project.width} ${project.height}" overflow="hidden">${body}</svg><text x="${x}" y="${gap+h+18}" font-size="12" font-family="sans-serif" fill="#202020">Frame ${frame}</text>`;
 }).join('\n');
 return {svg:`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells}</svg>\n`,width,height};
}
function verifyPng(path,width,height){const png=readFileSync(path);if(png.length<33||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height)throw new Error('PNG verification failed');}

export function animate(input,source,out,{overwrite=false,timeout=120,gif=false,mp4=false,background}={}){
 if(!Number.isInteger(timeout)||timeout<1||timeout>600)throw new Error('timeout must be an integer 1..600 seconds');
 const deadline=Date.now()+timeout*1000,project=validateProject(input),a=project.animation;
 if(!a)throw new Error('Project has no animation');
 if(background!==undefined&&!/^#[0-9a-fA-F]{6}$/.test(background))throw new Error('background must be #RRGGBB');
 if(mp4&&!background)throw new Error('MP4 requires an explicit --background #RRGGBB');
 if(mp4&&(project.width%2||project.height%2))throw new Error('MP4 requires an even canvas width and height');
 const seam=a.loop?checkLoopSeam(project):{closed:null,method:'not applicable: non-looping animation'};
 const target=resolve(out),parent=dirname(target);checkOutput(target,source,overwrite);
 const sourceSha256=source?hash(source):null;
 const remaining=()=>{const ms=deadline-Date.now();if(ms<=0)throw new Error('Animation export timed out');return ms;};
 const inkscape=findInkscape({timeoutMs:Math.min(10000,remaining())}),ffmpeg=gif||mp4?inspectFfmpeg({timeoutMs:Math.min(10000,remaining())}):null;
 if(ffmpeg&&!ffmpeg.ok){const e=new Error(`FFmpeg ${ffmpeg.status}. ${ffmpeg.advice} ${ffmpeg.installUrl}`);e.details=ffmpeg;throw e;}
 mkdirSync(parent,{recursive:true});
 const stage=mkdtempSync(join(parent,'.agent-draw-animation-'));let work,backup;
 try{
  work=mkdtempSync(join(tmpdir(),'agent-draw-animation-'));
  for(const name of ['home','config','cache','data','tmp','inkscape'])mkdirSync(join(work,name));
  const env={...process.env,HOME:join(work,'home'),XDG_CONFIG_HOME:join(work,'config'),XDG_CACHE_HOME:join(work,'cache'),XDG_DATA_HOME:join(work,'data'),TMPDIR:join(work,'tmp'),INKSCAPE_PROFILE_DIR:join(work,'inkscape')};
  delete env.DISPLAY;delete env.WAYLAND_DISPLAY;
  const artifacts=[],warnings=[];
  const save=(name,data)=>{writeFileSync(join(stage,name),data);artifacts.push(name);};
  const rasterize=(name,width,height)=>{
   const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Animation export timed out');
   const destination=name.replace(/\.svg$/,'.png');
   const result=spawnSync(inkscape.command,[join(stage,name),'--export-area-page','--export-type=png',`--export-filename=${join(stage,destination)}`,'--export-dpi=96','--export-background-opacity=0'],{env,encoding:'utf8',timeout:remaining,killSignal:'SIGKILL',maxBuffer:4*1024*1024});
   if(result.error||result.status!==0)throw new Error(`Inkscape animation export failed: ${result.error?.message||`exit ${result.status}`}\n${(result.stderr||'').slice(-3000)}`);
   verifyPng(join(stage,destination),width,height);artifacts.push(destination);
   if(result.stderr?.trim()&&warnings.length<10)warnings.push({file:name,message:result.stderr.trim().slice(-1000)});
  };
  save('project.json',JSON.stringify(project,null,2)+'\n');
  mkdirSync(join(stage,'frames'));
  for(let frame=0;frame<a.frames;frame++){
   if(Date.now()>=deadline)throw new Error('Animation export timed out');
   const svg=renderSvg(sampleAnimation(project,frame));
   if(frame===0)save('master.svg',svg);
   const name=`frames/frame-${String(frame).padStart(4,'0')}.svg`;save(name,svg);rasterize(name,project.width,project.height);
  }
  const indexes=contactSheetIndexes(a.frames),sheet=renderContactSheet(project,indexes);save('contact-sheet.svg',sheet.svg);rasterize('contact-sheet.svg',sheet.width,sheet.height);
  if(ffmpeg)artifacts.push(...encodeAnimation({command:ffmpeg.command,stage,width:project.width,height:project.height,fps:a.fps,frames:a.frames,loop:a.loop,gif,mp4,background,deadline,env}));
  if(gif&&!['GIF87a','GIF89a'].includes(readFileSync(join(stage,'animation.gif')).toString('ascii',0,6)))throw new Error('GIF verification failed');
  if(mp4&&readFileSync(join(stage,'animation.mp4')).toString('ascii',4,8)!=='ftyp')throw new Error('MP4 verification failed');
  if(Date.now()>deadline)throw new Error('Animation export timed out');
  const receipt={schemaVersion:1,tool:'agent-draw',version,kind:'animation',ok:true,name:project.name,width:project.width,height:project.height,fps:a.fps,frames:a.frames,durationSeconds:a.frames/a.fps,loop:a.loop,seam,formats:['svg','png',...(gif?['gif']:[]),...(mp4?['mp4']:[])],editable:'master.svg',project:'project.json',contactSheetFrames:indexes,inkscape:inkscape.version,ffmpeg:ffmpeg?.version||null,background:mp4?background:null,limitations:gif?['GIF supports 1-bit transparency; partial alpha is thresholded at 128. Frame timing is quantized to GIF centiseconds.']:[],source:source||null,sourceSha256,artifacts:artifacts.map(name=>({name,sha256:hash(join(stage,name))})),warnings};
  writeFileSync(join(stage,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  checkOutput(target,source,overwrite);
  if(existsSync(target)){backup=mkdtempSync(join(parent,'.agent-draw-backup-'));renameSync(target,join(backup,'previous'));}
  try{renameSync(stage,target);}catch(error){if(backup)renameSync(join(backup,'previous'),target);throw error;}
  if(backup)rmSync(backup,{recursive:true,force:true});
  return {...receipt,output:target};
 }finally{if(work)rmSync(work,{recursive:true,force:true});rmSync(stage,{recursive:true,force:true});}
}

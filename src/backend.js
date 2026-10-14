import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, lstatSync, realpathSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { renderSvg } from './svg.js';
export function findInkscape(){
 const command=process.env.AGENT_DRAW_INKSCAPE||'inkscape';
 const r=spawnSync(command,['--version'],{encoding:'utf8',timeout:10000,maxBuffer:1048576});const version=(r.stdout||'').trim(),match=/Inkscape (\d+)\.(\d+)/.exec(version);
 if(r.status===0&&match&&(Number(match[1])>1||(Number(match[1])===1&&Number(match[2])>=2)))return {command,version};
 throw new Error('Inkscape 1.2+ CLI not found. Install Inkscape from its official distribution or set AGENT_DRAW_INKSCAPE to an existing executable.');
}
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const inside=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
function canonical(path){return existsSync(path)?realpathSync(path):join(canonical(dirname(path)),basename(path));}
const artifacts=['drawing.svg','drawing.png','drawing.pdf'];
function checkOutput(target,source,overwrite){
 if(target===dirname(target)||lstatSafe(target)?.isSymbolicLink())throw new Error('Unsafe output directory');
 if(source&&inside(canonical(target),realpathSync(source)))throw new Error('Output directory must not contain the source project');
 if(existsSync(target)){
  if(!overwrite)throw new Error('Output already exists; use a new directory or explicit --overwrite');
  if(!lstatSync(target).isDirectory())throw new Error('Output is not a directory');
  for(const n of readdirSync(target)){
   if(![...artifacts,'receipt.json'].includes(n))throw new Error('Refusing to replace directory containing unrelated files');
   const st=lstatSync(join(target,n));if(!st.isFile()||st.isSymbolicLink())throw new Error('Unsafe output entry');
  }
 }
}
export function build(project,source,out,{overwrite=false,timeout=60}={}){
 if(!Number.isInteger(timeout)||timeout<1||timeout>300)throw new Error('timeout must be an integer 1..300 seconds');
 const target=resolve(out),parent=dirname(target);checkOutput(target,source,overwrite);
 const inkscape=findInkscape();mkdirSync(parent,{recursive:true});
 const stage=mkdtempSync(join(parent,'.agent-draw-output-')),work=mkdtempSync(join(tmpdir(),'agent-draw-job-'));
 let backup;
 try{
  for(const n of ['home','config','cache','data','tmp','inkscape'])mkdirSync(join(work,n));
  const env={...process.env,HOME:join(work,'home'),XDG_CONFIG_HOME:join(work,'config'),XDG_CACHE_HOME:join(work,'cache'),XDG_DATA_HOME:join(work,'data'),TMPDIR:join(work,'tmp'),INKSCAPE_PROFILE_DIR:join(work,'inkscape')};
  delete env.DISPLAY;delete env.WAYLAND_DISPLAY;
  writeFileSync(join(stage,'drawing.svg'),renderSvg(project));
  const deadline=Date.now()+timeout*1000,warnings=[];
  for(const ext of ['png','pdf']){
   const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Inkscape build timed out');
   const args=[join(stage,'drawing.svg'),'--export-area-page',`--export-type=${ext}`,`--export-filename=${join(stage,'drawing.'+ext)}`];
   if(ext==='png')args.push('--export-dpi=96','--export-background-opacity=0');
   if(ext==='pdf')args.push('--export-text-to-path');
   const child=spawnSync(inkscape.command,args,{env,encoding:'utf8',timeout:remaining,killSignal:'SIGKILL',maxBuffer:4*1024*1024});
   if(child.error||child.status!==0)throw new Error(`Inkscape ${ext} export failed: ${child.error?.message||`exit ${child.status}`}\n${(child.stderr||child.stdout||'').slice(-5000)}`);
   if(child.stderr?.trim())warnings.push({format:ext,message:child.stderr.trim().slice(-2000)});
  }
  const png=readFileSync(join(stage,'drawing.png'));if(png.length<33||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.readUInt32BE(16)!==project.width||png.readUInt32BE(20)!==project.height)throw new Error('PNG verification failed');
  if(readFileSync(join(stage,'drawing.pdf')).toString('ascii',0,5)!=='%PDF-')throw new Error('PDF verification failed');
  const receipt={schemaVersion:1,tool:'agent-draw',version:'0.1.0',ok:true,name:project.name,width:project.width,height:project.height,inkscape:inkscape.version,layersBottomToTop:project.layers.map(l=>l.name),editable:'drawing.svg',source:source||null,sourceSha256:source?hash(source):null,artifacts:artifacts.map(name=>({name,sha256:hash(join(stage,name))})),warnings};
  writeFileSync(join(stage,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  // Recheck after export to avoid deleting newly added unrelated files.
  checkOutput(target,source,overwrite);
  if(existsSync(target)){backup=mkdtempSync(join(parent,'.agent-draw-backup-'));renameSync(target,join(backup,'previous'));}
  try{renameSync(stage,target);}catch(e){if(backup)renameSync(join(backup,'previous'),target);throw e;}
  if(backup)rmSync(backup,{recursive:true,force:true});
  return {...receipt,output:target};
 }finally{rmSync(work,{recursive:true,force:true});rmSync(stage,{recursive:true,force:true});}
}
function lstatSafe(p){try{return lstatSync(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}}

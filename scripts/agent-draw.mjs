#!/usr/bin/env node
import { readProject } from '../src/project.js';
import { inspectInkscape } from '../src/inkscape.js';
import { build, smokeTest } from '../src/backend.js';
import { animate } from '../src/animation.js';
import { atlas } from '../src/atlas.js';
import { inspectFfmpeg } from '../src/ffmpeg.js';
const usage='agent-draw doctor [--smoke] | validate <project.json> | inspect <project.json> | build <project.json> --out <directory> [--overwrite] [--timeout <1..300>] | animate <project.json> --out <directory> [--gif] [--mp4 --background #RRGGBB] [--overwrite] [--timeout <1..600>] | atlas <manifest.json> --out <directory> [--overwrite] [--timeout <1..600>]';
try{
 const [command,...args]=process.argv.slice(2);
 if(!command||['--help','help','-h'].includes(command)){console.log(usage);}
 else if(command==='doctor'){if(args.length>1||(args.length===1&&args[0]!=='--smoke'))throw new Error(usage);const inkscape=inspectInkscape();const report={ok:inkscape.ok,node:process.versions.node,inkscape:{...inkscape,version:inkscape.versionText,detectedVersion:inkscape.version},ffmpeg:inspectFfmpeg()};if(inkscape.ok&&args.includes('--smoke'))report.smoke=smokeTest();console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}
 else if(['validate','inspect','build','animate','atlas'].includes(command)){
  if(!args[0]||args[0].startsWith('--'))throw new Error(usage);
  const {path,project}=command==='atlas'?{path:args[0],project:null}:readProject(args[0]);
  if(!['build','animate','atlas'].includes(command)){if(args.length!==1)throw new Error(usage);console.log(JSON.stringify(command==='validate'?{ok:true,path,layers:project.layers.length}:project,null,2));}
  else{
   let out,overwrite=false,timeout=['animate','atlas'].includes(command)?120:60,gif=false,mp4=false,background;const seen=new Set();
   for(let i=1;i<args.length;i++){const flag=args[i];if(seen.has(flag))throw new Error(`Duplicate option ${flag}`);seen.add(flag);if(flag==='--out'){out=args[++i];if(!out||out.startsWith('--'))throw new Error('--out requires a directory');}else if(flag==='--overwrite')overwrite=true;else if(flag==='--timeout'){timeout=Number(args[++i]);}else if(command==='animate'&&flag==='--gif')gif=true;else if(command==='animate'&&flag==='--mp4')mp4=true;else if(command==='animate'&&flag==='--background'){background=args[++i];if(!background||background.startsWith('--'))throw new Error('--background requires #RRGGBB');}else throw new Error(`Unknown option ${flag}`);}
   if(!out)throw new Error('--out is required');console.log(JSON.stringify(command==='atlas'?atlas(path,out,{overwrite,timeout}):(command==='animate'?animate:build)(project,path,out,{overwrite,timeout,gif,mp4,background}),null,2));
  }
 }else throw new Error(usage);
}catch(e){console.error(JSON.stringify({ok:false,error:e.message,...(e.details?{details:e.details}:{})}));process.exitCode=1;}

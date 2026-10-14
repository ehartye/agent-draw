#!/usr/bin/env node
import { readProject } from '../src/project.js';
import { build, findInkscape } from '../src/backend.js';
const usage='agent-draw doctor | validate <project.json> | inspect <project.json> | build <project.json> --out <directory> [--overwrite] [--timeout <1..300>]';
try{
 const [command,...args]=process.argv.slice(2);
 if(!command||['--help','help','-h'].includes(command)){console.log(usage);}
 else if(command==='doctor'){if(args.length)throw new Error(usage);console.log(JSON.stringify({ok:true,node:process.versions.node,inkscape:findInkscape()},null,2));}
 else if(['validate','inspect','build'].includes(command)){
  if(!args[0]||args[0].startsWith('--'))throw new Error(usage);
  const {path,project}=readProject(args[0]);
  if(command!=='build'){if(args.length!==1)throw new Error(usage);console.log(JSON.stringify(command==='validate'?{ok:true,path,layers:project.layers.length}:project,null,2));}
  else{
   let out,overwrite=false,timeout=60;const seen=new Set();
   for(let i=1;i<args.length;i++){const flag=args[i];if(seen.has(flag))throw new Error(`Duplicate option ${flag}`);seen.add(flag);if(flag==='--out'){out=args[++i];if(!out||out.startsWith('--'))throw new Error('--out requires a directory');}else if(flag==='--overwrite')overwrite=true;else if(flag==='--timeout'){timeout=Number(args[++i]);}else throw new Error(`Unknown option ${flag}`);}
   if(!out)throw new Error('--out is required');console.log(JSON.stringify(build(project,path,out,{overwrite,timeout}),null,2));
  }
 }else throw new Error(usage);
}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}

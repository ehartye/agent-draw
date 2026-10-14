import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const rectangle=(changes={})=>({name:'Rectangle',type:'rectangle',width:20,height:20,color:'#ff0000',...changes});
export const project=(changes={})=>({version:1,name:'Test drawing',width:64,height:64,layers:[rectangle()],...changes});
export function temp(t){const p=mkdtempSync(join(tmpdir(),'agent-draw-test-'));t.after(()=>rmSync(p,{recursive:true,force:true}));return p;}
export function cli(args,env={}){return spawnSync(process.execPath,[join(root,'scripts/agent-draw.mjs'),...args],{encoding:'utf8',env:{...process.env,...env}});}

// Sample-owned recovery validator. This does not forge a native sequence receipt.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateProject} from '../../src/project.js';
import {renderSvg} from '../../src/svg.js';
const root=resolve('examples/human-mannequins'),stage=resolve(process.argv[2]),out=resolve(process.argv[3]);
if(existsSync(out))throw Error('Use a fresh recovery output directory');
const source=join(root,'sequence-eight-2.json'),manifest=JSON.parse(readFileSync(source)),sha=b=>createHash('sha256').update(b).digest('hex');
const recovered=[],remaining=[];
for(const [index,file] of manifest.frames.entries()){
 const stem=`frame-${String(index).padStart(4,'0')}`,png=join(stage,'frames',stem+'.png'),svg=join(stage,'frames',stem+'.svg'),project=join(stage,'projects',stem+'.json');
 if(!existsSync(png)){remaining.push(file);continue;}
 const bytes=readFileSync(join(root,file));if(sha(bytes)!==sha(readFileSync(project)))throw Error('Captured project differs: '+file);
 const expected=renderSvg(validateProject(JSON.parse(bytes)));
 if(sha(Buffer.from(expected))!==sha(readFileSync(svg)))throw Error('Captured SVG differs: '+file);
 recovered.push({index,path:file,project:`projects/${stem}.json`,svg:`frames/${stem}.svg`,png:`frames/${stem}.png`,sha256:sha(bytes),svgSha256:sha(readFileSync(svg)),pngSha256:sha(readFileSync(png))});
}
mkdirSync(join(out,'projects'),{recursive:true});mkdirSync(join(out,'frames'));
for(const f of recovered)for(const key of ['project','svg','png'])copyFileSync(join(stage,f[key]),join(out,f[key]));
writeFileSync(join(out,'receipt.json'),JSON.stringify({version:1,tool:'mannequin-recovery-validator',kind:'recovered-partial-sequence',ok:true,source,sourceSha256:sha(readFileSync(source)),sourceFrames:recovered,originalStage:stage,limitations:['Original process exit and native batch receipt were lost in the host crash. This is recovery/source binding, not a successful native sequence receipt. PNGs must additionally be decoded and checked by retain-eight.py.']},null,2)+'\n');
writeFileSync(join(root,'sequence-eight-recovery.json'),JSON.stringify({...manifest,name:'eight-direction-crash-remainder',frames:remaining},null,2)+'\n');
console.log(JSON.stringify({recovered:recovered.length,remaining:remaining.length,out}));

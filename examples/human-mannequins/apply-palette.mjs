// One-time, auditable hidden-guide amendment. Original native receipts remain
// unchanged; PNG reuse is justified by exact equality of visible source/SVG.
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createEight} from './generate-eight.mjs';
import {validateProject} from '../../src/project.js';
import {renderSvg} from '../../src/svg.js';
const root=dirname(fileURLToPath(import.meta.url)),lib=createEight(),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(join(root,p)),save=(p,v)=>writeFileSync(join(root,p),JSON.stringify(v,null,2)+'\n');
const oldBindings=JSON.parse(read('native-bindings-eight.json')).frames,frames=[];
const withoutGuides=p=>({...p,layers:p.layers.filter(x=>x.id!=='construction-guides')});
for(const a of lib.assets){
 const oldJson=read(a.json),oldSvg=read(a.svg),old=JSON.parse(oldJson),next=lib.projects[a.id],binding=oldBindings.find(x=>x.id===a.id);
 if(sha(oldJson)!==binding.jsonSha256||sha(oldSvg)!==binding.svgSha256||sha(read(a.png))!==binding.pngSha256)throw Error('Original binding mismatch: '+a.id+'; reconcile instead of replaying amendment');
 const before=renderSvg(validateProject(withoutGuides(old))),after=renderSvg(validateProject(withoutGuides(next)));
 if(before!==after||next.layers.at(-1).visible!==false)throw Error('Visible source changed: '+a.id);
 const newJson=JSON.stringify(next,null,2)+'\n',newSvg=renderSvg(validateProject(next));
 writeFileSync(join(root,a.json),newJson);writeFileSync(join(root,a.svg),newSvg);
 frames.push({id:a.id,originalJsonSha256:sha(oldJson),originalSvgSha256:sha(oldSvg),jsonSha256:sha(newJson),svgSha256:sha(newSvg),pngSha256:binding.pngSha256,visibleSvgSha256:sha(after),visibleSourceUnchanged:true,provenance:'hidden-guide-amendment; original native PNG reused'});
}
const {projects,landmarks,...catalog}=lib;save('library.json',catalog);save('guide-palette-bindings.json',{version:1,originalNativeBindings:'native-bindings-eight.json',scope:'Only hidden guide colors and pelvic guide axis changed. Visible geometry/SVG serialization identical; original PNG/native receipts retained, not relabeled as fresh renders.',frames});
console.log(JSON.stringify({amended:frames.length,pngsReusedWithExactVisibleSourceEquality:frames.length}));

import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createEight} from './generate-eight.mjs';
import {createLibrary} from './overhead/drawing.mjs';
import {validateProject} from '../../src/project.js';
import {renderSvg} from '../../src/svg.js';
const root=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const read=(folder,p)=>readFileSync(join(root,folder,p)),json=(folder,p)=>JSON.parse(read(folder,p));
for(const [folder,lib,bindingFile] of [['',createEight(),'guide-palette-bindings.json'],['overhead',createLibrary(),'native-bindings.json']]){
 const bindings=json(folder,bindingFile).frames;assert.equal(bindings.length,384);
 for(const a of lib.assets){
  const b=bindings.find(x=>x.id===a.id);assert.ok(b);
  const spec=lib.projects[a.id];assert.equal(read(folder,a.json).toString(),JSON.stringify(spec,null,2)+'\n',a.id+' generator drift');
  assert.equal(read(folder,a.svg).toString(),renderSvg(validateProject(spec)),a.id+' serializer drift');
  for(const kind of ['json','svg','png'])assert.equal(sha(read(folder,a[kind])),b[kind+'Sha256'],a.id+' '+kind+' drift');
 }
}
for(const page of json('overhead','pages.json'))assert.equal(read('overhead',`native-pages/${page.id}.svg`).toString(),renderSvg(validateProject(json('overhead',page.json))),page.id+' native SVG drift');
console.log(JSON.stringify({parentGuideAmendments:384,overheadFrames:384,nativePages:96,sourceGeneratorSerializerAndExportHashes:true}));

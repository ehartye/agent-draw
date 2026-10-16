import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLibrary} from './drawing.mjs';
import {validateProject} from '../../../src/project.js';
import {renderSvg} from '../../../src/svg.js';
const root=dirname(fileURLToPath(import.meta.url)),lib=createLibrary();
for(const d of ['projects','svg','pages','png','review','native-receipts'])mkdirSync(join(root,d),{recursive:true});
const save=(p,v)=>writeFileSync(join(root,p),JSON.stringify(v,null,2)+'\n');
for(const [id,spec] of Object.entries(lib.projects)){save(`projects/${id}.json`,spec);writeFileSync(join(root,'svg',id+'.svg'),renderSvg(validateProject(spec)));}
const {projects,landmarks,...catalog}=lib;save('library.json',catalog);save('landmarks.json',landmarks);save('clips.json',{version:1,camera:lib.camera,canvas:lib.canvas,clips:lib.entries.filter(x=>x.kind==='clip')});
const prefix=(node,key)=>{const out=structuredClone(node);out.name=key+'-'+out.name;if(out.id)out.id=key+'-'+out.id;if(out.children)out.children=out.children.map(x=>prefix(x,key));return out;};
function page(id,assets){
 const spec={version:1,name:id,width:768,height:768,layers:assets.map((a,i)=>({type:'group',id:`cell-${i}`,name:`cell-${i}`,transform:{x:(i%2)*384,y:Math.floor(i/2)*384},children:projects[a.id].layers.map(x=>prefix(x,`c${i}`))}))};
 validateProject(spec);save(`pages/${id}.json`,spec);return {id,json:`pages/${id}.json`,cells:assets.map((a,i)=>({id:a.id,box:[(i%2)*384,Math.floor(i/2)*384,(i%2+1)*384,(Math.floor(i/2)+1)*384]}))};
}
const pages=[];for(let i=0;i<lib.assets.length;i+=4)pages.push(page('overhead-page-'+String(i/4).padStart(3,'0'),lib.assets.slice(i,i+4)));
save('pages.json',pages);
for(let i=0;i<2;i++)save(`sequence-${i}.json`,{version:1,name:'overhead-native-'+i,fps:8,loop:false,frames:pages.slice(i*48,(i+1)*48).map(p=>p.json)});
const motionPages=pages.filter(p=>p.cells.every(c=>['walk','run'].includes(lib.assets.find(a=>a.id===c.id).pose)));
for(let i=0;i<2;i++)save(`sequence-motion-${i}.json`,{version:1,name:'overhead-motion-'+i,fps:8,loop:false,frames:motionPages.slice(i*32,(i+1)*32).map(p=>p.json)});
const keys=[];for(const model of ['human','rpg']){
 keys.push(page(`key-${model}-neutral`,['S','E','N','W'].map(direction=>lib.assets.find(a=>a.model===model&&a.pose==='neutral'&&a.direction===direction))));
 keys.push(page(`key-${model}-run`,['S','SE','N','NE'].map(direction=>lib.assets.find(a=>a.model===model&&a.pose==='run'&&a.direction===direction&&a.frame===2))));
}
save('keys.json',{version:1,name:'overhead-keys',fps:8,loop:false,frames:keys.map(p=>p.json)});
// A guide-visible native checkpoint verifies both the authored palette and
// true anatomical mapping, separate from the hidden-guide final art.
const guide=structuredClone(projects['human-run-S-02']);guide.name='overhead-guide-key';guide.layers.at(-1).visible=true;save('guide-key.json',guide);
console.log(JSON.stringify({drawings:lib.assets.length,clips:lib.entries.filter(x=>x.kind==='clip').length,pages:pages.length,keys:keys.length}));

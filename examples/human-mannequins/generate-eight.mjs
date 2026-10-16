import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLibrary,MODELS,POSES} from './generate.mjs';
import {drawing,FACINGS,PHASES} from './directional.mjs';
import {applyGuidePalette,GUIDE_PALETTE,GUIDE_LABELS} from './guide-palette.mjs';
export function createEight(){
 const old=createLibrary(),assets=[],entries=[],landmarks={},projects={};
 const asset=(id,model,pose,direction,spec,coords,extra={})=>{projects[id]=spec;landmarks[id]=coords;const a={id,model,pose,direction,json:`projects/${id}.json`,svg:`svg/${id}.svg`,png:`png/${id}.png`,...extra};assets.push(a);return a;};
 for(const [model,m] of Object.entries(MODELS))for(const direction of Object.keys(FACINGS)){
  for(const pose of POSES){
   if(['E','W'].includes(direction)){
    const id=`${model}-${pose}-${direction==='E'?'right':'left'}`;
    entries.push({...asset(id,model,pose,direction,old.projects[id],old.landmarks[id],{legacyProfile:true}),kind:'pose'});
   }else{const f=drawing(m,pose,direction);entries.push({...asset(f.id,model,pose,direction,f.spec,{world:f.world,projected:f.projected}),kind:'pose'});}
  }
  for(const pose of ['walk','run']){
   const frames=[];for(let i=0;i<8;i++){const f=drawing(m,pose,direction,i);frames.push(asset(f.id,model,pose,direction,f.spec,{world:f.world,projected:f.projected},{frame:i,phase:PHASES[i]}));}
   entries.push({id:`${model}-${pose}-${direction}`,model,pose,direction,kind:'clip',fps:pose==='walk'?8:12,loop:true,frames});
  }
 }
 for(const a of assets)projects[a.id]=applyGuidePalette(projects[a.id],a.direction,!!a.legacyProfile);
 return {version:3,revision:'mannequins-20261015-r4',models:MODELS,poses:[...POSES,'walk','run'],directions:Object.keys(FACINGS),guidePalette:GUIDE_PALETTE,guideLabels:GUIDE_LABELS,sideLabels:{left:'Historical reference-left = anatomical right',right:'Historical reference-right = anatomical left'},ground:560,entries,assets,projects,landmarks};
}
if(process.argv[1]?.endsWith('generate-eight.mjs')){
 const root=dirname(fileURLToPath(import.meta.url)),lib=createEight(),save=(name,v)=>writeFileSync(join(root,name),JSON.stringify(v,null,2)+'\n');mkdirSync(join(root,'projects'),{recursive:true});
 for(const [id,p] of Object.entries(lib.projects))save(`projects/${id}.json`,p);
 const {projects,landmarks,...catalog}=lib;save('library.json',catalog);save('landmarks.json',landmarks);
 const batches=[];for(let i=0;i<lib.assets.length;i+=96){const name=`sequence-eight-${batches.length}.json`;save(name,{version:1,name:`eight-direction-${batches.length}`,fps:8,loop:false,frames:lib.assets.slice(i,i+96).map(x=>x.json)});batches.push(name);}
 save('native-batches.json',batches);
 save('key-eight.json',{version:1,name:'eight-direction-keys',fps:8,loop:false,frames:lib.assets.filter(x=>['S','N','SE','NE'].includes(x.direction)&&((x.pose==='neutral')||(x.pose==='run'&&x.frame===2))).map(x=>x.json)});
 console.log(JSON.stringify({drawings:lib.assets.length,templates:lib.entries.filter(x=>x.kind==='pose').length,clips:lib.entries.filter(x=>x.kind==='clip').length,batches}));
}

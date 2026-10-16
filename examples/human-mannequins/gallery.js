const $=id=>document.getElementById(id),revision=document.documentElement.dataset.revision||'mannequins-20261015-r4';
const label=s=>s.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
const facing={S:'S · Front',SE:'SE · Front right',E:'E · Right',NE:'NE · Back right',N:'N · Back',NW:'NW · Back left',W:'W · Left',SW:'SW · Front left'};
const cards=[],texts=new Map();let current=null,frame=0,playing=false,last=0,raf=0,token=0;
const first=e=>e.kind==='clip'?e.frames[0]:e;
function downloads(e){const div=document.createElement('div');div.className='downloads';for(const [key,title] of [['json','Agent Draw JSON'],['svg','SVG'],['png','PNG']]){const a=document.createElement('a');a.href=e[key]+'?rev='+revision;a.download=e.id+'.'+key;a.textContent=title;div.append(a)}return div;}
async function svgText(e){if(!texts.has(e.id))texts.set(e.id,fetch(e.svg+'?rev='+revision).then(async r=>{if(!r.ok)throw Error('Drawing unavailable: '+e.id);return r.text();}));return texts.get(e.id);}
function ownedSvg(text,id){
 const doc=new DOMParser().parseFromString(text,'image/svg+xml'),svg=doc.documentElement;
 if(svg.localName!=='svg'||doc.querySelector('parsererror,script,image,foreignObject'))throw Error('Unexpected drawing contents');
 for(const node of svg.querySelectorAll('[id]')){if(node.id.endsWith('construction-guides')){node.setAttribute('data-template-guides','');node.style.display=$('guides').checked?'':'none';}node.id=id+'--'+node.id;}
 svg.setAttribute('aria-label',id.replaceAll('-',' '));svg.setAttribute('role','img');return document.importNode(svg,true);
}
async function cardGuides(){
 for(const {e,node,button} of cards){
  if(node.hidden)continue;
  if($('guides').checked){const text=await svgText(first(e));if($('guides').checked&&!node.hidden)button.replaceChildren(ownedSvg(text,'card-'+e.id));}
  else if(!button.querySelector('img')){const img=document.createElement('img');img.src=first(e).png+'?rev='+revision;img.alt='';img.loading='lazy';img.width=640;img.height=640;button.replaceChildren(img);}
 }
}
function filter(){for(const {e,node} of cards)node.hidden=['model','pose','direction'].some(key=>$(key).value!=='all'&&$(key).value!==e[key]);const shown=cards.filter(x=>!x.node.hidden);$('count').textContent=shown.length+' starter'+(shown.length===1?'':'s');const url=new URL(location.href);for(const key of ['model','pose','direction'])url.searchParams.set(key,$(key).value);history.replaceState(null,'',url);cardGuides().catch(fail);}
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='Play';$('play').setAttribute('aria-pressed','false');}
async function showFrame(index){
 if(!current)return;frame=(index+(current.frames?.length??1))%(current.frames?.length??1);
 const local=++token,e=current.kind==='clip'?current.frames[frame]:current,text=await svgText(e);
 if(local!==token)return;
 $('detail-art').replaceChildren(ownedSvg(text,'detail-'+e.id));$('detail-art').dataset.frame=String(frame);$('detail-art').dataset.id=e.id;
 $('detail-downloads').replaceChildren(downloads(e));
 $('frame-label').textContent=current.kind==='clip'?`${frame+1} / ${current.frames.length} · ${label(e.phase)}`:'Static pose';
 $('frame-range').value=String(frame);
 document.dispatchEvent(new CustomEvent('mannequinframe',{detail:{clip:current.id,frame,id:e.id}}));
}
function tick(time){
 if(!playing)return;
 const step=1000/(current.fps*Number($('speed').value));
 if(time-last>=step){const count=Math.floor((time-last)/step);last+=count*step;showFrame(frame+count).catch(fail);}
 raf=requestAnimationFrame(tick);
}
async function inspect(e){
 stop();current=e;token++;$('detail').dataset.clipReady='false';
 $('detail-guides').checked=$('guides').checked;
 $('detail-title').textContent=(e.model==='rpg'?'Compact RPG':'Human')+' · '+label(e.pose)+' · '+facing[e.direction];
 $('transport').hidden=e.kind!=='clip';$('frame-range').max=String((e.frames?.length??1)-1);
 $('detail').showModal();await showFrame(0);
 if(e.kind==='clip')await Promise.all(e.frames.map(svgText));
 if(current?.id===e.id&&$('detail').open)$('detail').dataset.clipReady='true';
}
function fail(error){$('status').hidden=false;$('status').textContent=error.message;document.body.dataset.error='true';stop();}
async function main(){
 const response=await fetch('library.json?rev='+revision);if(!response.ok)throw Error('Library unavailable');const lib=await response.json();
 if(lib.facingLabels)Object.assign(facing,lib.facingLabels);
 const legend=document.getElementById('palette-legend');
 if(legend&&lib.guidePalette)for(const [part,color] of Object.entries(lib.guidePalette)){const item=document.createElement('span'),swatch=document.createElement('i');swatch.style.backgroundColor=color;swatch.setAttribute('aria-hidden','true');item.append(swatch,document.createTextNode(lib.guideLabels[part]));legend.append(item);}
 for(const pose of lib.poses){const option=document.createElement('option');option.value=pose;option.textContent=label(pose);$('pose').append(option);}
 for(const d of lib.directions){const o=document.createElement('option');o.value=d;o.textContent=facing[d];$('direction').append(o);}$('direction').value='S';
 for(const e of lib.entries){
  const node=document.createElement('article');node.className='drawing';node.dataset.id=e.id;node.dataset.kind=e.kind;
  const button=document.createElement('button');button.className='art-button';button.setAttribute('aria-label','Inspect '+lib.models[e.model].label+' '+label(e.pose)+' facing '+e.direction);
  const img=document.createElement('img');img.src=first(e).png+'?rev='+revision;img.alt='';img.loading='lazy';img.width=640;img.height=640;button.append(img);
  const header=document.createElement('header'),h=document.createElement('h2'),caption=document.createElement('p');h.textContent=(e.kind==='clip'?'▶ ':'')+label(e.pose);caption.className='caption';caption.textContent=lib.models[e.model].label+' / '+facing[e.direction];header.append(h,caption);node.append(button,header);
  if(e.kind==='clip'){const info=document.createElement('p');info.className='clip-info';info.textContent=`8 drawn frames · ${e.fps} fps`;node.append(info);}else node.append(downloads(e));
  button.addEventListener('click',()=>inspect(e).catch(fail));cards.push({e,node,button});
 }
 const params=new URLSearchParams(location.search);for(const key of ['model','pose','direction'])if([...$(key).options].some(o=>o.value===params.get(key)))$(key).value=params.get(key);
 $('gallery').replaceChildren(...cards.map(x=>x.node));filter();$('status').hidden=true;document.body.dataset.ready='true';
}
for(const key of ['model','pose','direction'])$(key).addEventListener('change',filter);
$('guides').addEventListener('change',()=>{cardGuides().catch(fail);if(current&&$('detail').open)showFrame(frame).catch(fail);});
$('detail-guides').addEventListener('change',()=>{$('guides').checked=$('detail-guides').checked;cardGuides().catch(fail);showFrame(frame).catch(fail);});
$('close').addEventListener('click',()=>$('detail').close());$('detail').addEventListener('close',()=>{stop();current=null;token++;});
$('play').addEventListener('click',()=>{if(playing){stop();return;}playing=true;last=performance.now();$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{stop();showFrame(frame+delta).catch(fail);});
$('frame-range').addEventListener('input',()=>{stop();showFrame(Number($('frame-range').value)).catch(fail);});$('speed').addEventListener('change',()=>{last=performance.now();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
main().catch(fail);

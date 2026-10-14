import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const fail = message => { throw new Error(message); };
const obj = (v,p) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${p}: expected object`); };
const keys = (v,allowed,p) => { for (const k of Object.keys(v)) if (!allowed.includes(k)) fail(`${p}: unknown field ${k}`); };
const number = (v,min,max,p,integer=false) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail(`${p}: expected ${integer?'integer':'number'} ${min}..${max}`); return v; };
const str = (v,max,p) => { if (typeof v !== 'string' || !v.trim() || v.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/.test(v)) fail(`${p}: invalid string`); return v; };
export function validateProject(input, baseDir=process.cwd()) {
 obj(input,'project'); keys(input,['version','name','width','height','layers'],'project');
 if(input.version!==1) fail('project.version must be 1');
 const p={version:1,name:str(input.name,128,'name'),width:number(input.width,1,4096,'width',true),height:number(input.height,1,4096,'height',true),layers:[]};
 if(!Array.isArray(input.layers)||input.layers.length<1||input.layers.length>128) fail('layers: expected 1..128 layers');
 if(p.width*p.height*input.layers.length>134217728) fail('Project exceeds 128 megapixel layer budget');
 const names=new Set();
 for(const [i,v] of input.layers.entries()){
  const at=`layers[${i}]`; obj(v,at);
  const allowed={rectangle:['x','y','width','height','radius'],ellipse:['x','y','width','height'],polygon:['points'],text:['x','y','text','font','size'],path:['d']}[v.type];
  if(!allowed) fail(`${at}: unsupported type`);
  keys(v,['name','type','opacity','visible','color','stroke','strokeWidth','fillRule','strokeLinecap','strokeLinejoin','fillGradient',...allowed],at);
  const l={name:str(v.name,128,`${at}.name`),type:v.type,opacity:number(v.opacity??100,0,100,`${at}.opacity`),visible:v.visible??true};
  if(names.has(l.name)) fail(`${at}: duplicate layer name`); names.add(l.name);
  if(typeof l.visible!=='boolean') fail(`${at}.visible: expected boolean`);
  if(!['polygon','path'].includes(v.type)){l.x=number(v.x??0,-4096,4096,`${at}.x`,true);l.y=number(v.y??0,-4096,4096,`${at}.y`,true);}
  if(['rectangle','ellipse'].includes(v.type)){ l.width=number(v.width,1,8192,`${at}.width`,true);l.height=number(v.height,1,8192,`${at}.height`,true); }
  { if(typeof v.color!=='string'||!/^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$/.test(v.color)) fail(`${at}.color: expected #RRGGBB or #RRGGBBAA`);l.color=v.color; }
  if(v.type==='polygon'){
   if(!Array.isArray(v.points)||v.points.length<3||v.points.length>256) fail(`${at}.points: expected 3..256 coordinate pairs`);
   l.points=v.points.map((pt,j)=>{if(!Array.isArray(pt)||pt.length!==2) fail(`${at}.points[${j}]: expected pair`); return pt.map(n=>number(n,-4096,8192,`${at}.points[${j}]`));});
  }
  if(v.type==='text'){l.text=str(v.text,4096,`${at}.text`);l.font=str(v.font??'DejaVu Sans',128,`${at}.font`);l.size=number(v.size??32,1,512,`${at}.size`);}
  if(v.type==='rectangle')l.radius=number(v.radius??0,0,4096,`${at}.radius`);
  if(v.stroke!==undefined){if(typeof v.stroke!=='string'||!/^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$/.test(v.stroke))fail(`${at}.stroke: invalid color`);l.stroke=v.stroke;l.strokeWidth=number(v.strokeWidth??1,0,128,`${at}.strokeWidth`);}else if(v.strokeWidth!==undefined)fail(`${at}: strokeWidth requires stroke`);
  for(const [field,choices] of Object.entries({fillRule:['nonzero','evenodd'],strokeLinecap:['butt','round','square'],strokeLinejoin:['round','bevel','miter']})){
   if(v[field]!==undefined){
    if(!choices.includes(v[field]))fail(`${at}.${field}: expected ${choices.join(' or ')}`);
    if(field.startsWith('stroke')&&!l.stroke)fail(`${at}.${field}: requires stroke`);
    l[field]=v[field];
   }
  }
  if(v.fillGradient!==undefined)l.fillGradient=validateGradient(v.fillGradient,`${at}.fillGradient`);
  if(v.type==='path'){l.d=str(v.d,65536,`${at}.d`);validatePath(l.d,at);}
  p.layers.push(l);
 }
 return p;
}
export function readProject(file){const path=realpathSync(resolve(file));if(!statSync(path).isFile()||statSync(path).size>2097152) fail('Project JSON must be a file <=2 MiB');return {path,project:validateProject(JSON.parse(readFileSync(path,'utf8')),dirname(path))};}

export function validatePath(d,at='path'){
 const token=/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
 const tokens=d.match(token)||[];
 if(d.replace(token,'').replace(/[\s,]/g,'')||tokens.length>8192||!/[Mm]/.test(tokens[0]??''))fail(`${at}: invalid SVG path syntax`);
 const arity={m:2,l:2,h:1,v:1,c:6,s:4,q:4,t:2,a:7,z:0};
 let i=0;
 while(i<tokens.length){const cmd=tokens[i++],n=arity[cmd.toLowerCase()];if(n===undefined)fail(`${at}: path command required`);if(!n)continue;let count=0;
  while(i<tokens.length&&!/^[A-Za-z]$/.test(tokens[i])){const value=Number(tokens[i++]);number(value,-16384,16384,`${at}.d`);if(cmd.toLowerCase()==='a'&&[3,4].includes(count%7)&&![0,1].includes(value))fail(`${at}: arc flags must be 0 or 1`);if(cmd.toLowerCase()==='a'&&[0,1].includes(count%7)&&value<0)fail(`${at}: arc radius must be nonnegative`);count++;}
  if(!count||count%n)fail(`${at}: invalid argument count for ${cmd}`);
 }
}

export function validateGradient(value,at='fillGradient'){
 obj(value,at);
 const fields=value.type==='linear'?['x1','y1','x2','y2']:value.type==='radial'?['cx','cy','r']:null;
 if(!fields)fail(`${at}.type: expected linear or radial`);
 keys(value,['type','stops',...fields],at);
 const gradient={type:value.type};
 for(const field of fields){gradient[field]=number(value[field],field==='r'?Number.MIN_VALUE:-4096,8192,`${at}.${field}`);}
 if(value.type==='linear'&&value.x1===value.x2&&value.y1===value.y2)fail(`${at}: linear endpoints must differ`);
 if(!Array.isArray(value.stops)||value.stops.length<2||value.stops.length>16)fail(`${at}.stops: expected 2..16 stops`);
 let previous=-1;
 gradient.stops=value.stops.map((stop,i)=>{
  const where=`${at}.stops[${i}]`;obj(stop,where);keys(stop,['offset','color'],where);
  const offset=number(stop.offset,0,1,`${where}.offset`);
  if(offset<previous)fail(`${at}.stops: offsets must be nondecreasing`);previous=offset;
  if(typeof stop.color!=='string'||!/^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$/.test(stop.color))fail(`${where}.color: expected hex color`);
  return {offset,color:stop.color};
 });
 return gradient;
}

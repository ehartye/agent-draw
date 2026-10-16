import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateProject} from '../../src/project.js';

export const MODELS={
 human:{label:'Human',headH:54,headW:42,neck:17,torso:100,ribW:58,pelvisW:54,upperLeg:102,lowerLeg:98,upperArm:70,forearm:62,thigh:16,calf:12,arm:13,hand:22,footL:36,footH:14},
 rpg:{label:'Compact RPG',headH:76,headW:60,neck:13,torso:75,ribW:66,pelvisW:64,upperLeg:58,lowerLeg:54,upperArm:46,forearm:40,thigh:19,calf:14,arm:15,hand:20,footL:40,footH:18}
};
export const POSES=['neutral','walk-contact','walk-pass','run-push','run-flight','jump','crouch','reach'];
const colors={ink:'#293943',near:'#D0B99B',body:'#DCC9AB',light:'#F0DFC3',far:'#8F9CA0',guide:'#237A96',ground:'#C26646'};
const n=x=>Math.round(x*10)/10,rad=d=>d*Math.PI/180,xy=p=>p.map(n).join(' '),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(p,k)=>p.map(v=>v*k),unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/d,(b[1]-a[1])/d]};
const path=(name,d,color,strokeWidth=3)=>({type:'path',name,d,color,stroke:colors.ink,strokeWidth,strokeLinejoin:'round',strokeLinecap:'round'});
const line=(name,a,b,color=colors.guide,w=1.5)=>({...path(name,`M ${xy(a)} L ${xy(b)}`,'#00000000',w),stroke:color});
const poly=(name,points,color,w=3)=>({type:'polygon',name,points:points.map(p=>p.map(n)),color,stroke:colors.ink,strokeWidth:w,strokeLinejoin:'round'});
const group=(name,children,extra={})=>({type:'group',id:name,name,children,...extra});
const dot=(name,p,r,color)=>({type:'ellipse',name,x:Math.round(p[0]-r),y:Math.round(p[1]-r),width:r*2,height:r*2,color});
// Angles are measured from downward. These guides are flattened into contours.
function angles(root,a,b,upper,lower){const joint=add(root,[a*Math.sin(rad(upper)),a*Math.cos(rad(upper))]);return [joint,add(joint,[b*Math.sin(rad(lower)),b*Math.cos(rad(lower))])];}
function knee(h,a,upper,lower){
 const d=Math.hypot(a[0]-h[0],a[1]-h[1]);if(d>=upper+lower||d<=Math.abs(upper-lower))throw Error('Unreachable authored support');
 const u=unit(h,a),along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(upper*upper-along*along);
 return [h[0]+u[0]*along+u[1]*height,h[1]+u[1]*along-u[0]*height];
}
function landmarks(m,pose){
 const total=m.upperLeg+m.lowerLeg,A=560-m.footH,base=A-total*.98;
 const settings={
  neutral:{height:base,lean:0,feet:[16,-14],arms:[[4,18],[-10,-2]],support:'both'},
  'walk-contact':{height:A-total*.90,lean:4,feet:[total*.29,-total*.275],arms:[[-25,5],[25,55]],support:'both'},
  'walk-pass':{height:A-total*.96,lean:3,feet:[0,null],far:[45,-35],arms:[[15,45],[-15,15]],support:'near'},
  'run-push':{height:A-total*.92,lean:20,feet:[-total*.20,null],far:[55,-70],arms:[[45,110],[-45,20]],support:'near'},
  'run-flight':{height:base-24,lean:15,near:[65,-20],far:[-35,-125],arms:[[-40,30],[45,115]],support:'flight'},
  jump:{height:base-32,lean:8,near:[45,-20],far:[-25,-95],arms:[[120,160],[70,130]],support:'flight'},
  crouch:{height:A-total*.58,lean:35,feet:[total*.25,-total*.05],arms:[[20,105],[-20,65]],support:'both'},
  reach:{height:base,lean:5,feet:[16,-14],arms:[[100,140],[-5,15]],support:'both'}
 }[pose];
 const H=[320,settings.height],up=[Math.sin(rad(settings.lean)),-Math.cos(rad(settings.lean))],front=[-up[1],up[0]],C=add(H,mul(up,m.torso));
 const S=add(add(C,mul(front,-m.ribW*.16)),mul(up,-m.headH*.17));
 const leg=(side,index)=>{if(settings.feet?.[index]!==null&&settings.feet?.[index]!==undefined){const a=[320+settings.feet[index],A];return [knee(H,a,m.upperLeg,m.lowerLeg),a]};return angles(H,m.upperLeg,m.lowerLeg,...settings[side])};
 const [nk,na]=leg('near',0),[fk,fa]=leg('far',1),[ne,nw]=angles(S,m.upperArm,m.forearm,...settings.arms[0]),[fe,fw]=angles(S,m.upperArm,m.forearm,...settings.arms[1]);
 return {hip:H,chest:C,shoulder:S,head:add(C,mul(up,m.headH/2+m.neck)),up,front,nearKnee:nk,nearAnkle:na,farKnee:fk,farAnkle:fa,nearElbow:ne,nearWrist:nw,farElbow:fe,farWrist:fw,support:settings.support};
}
function contour(root,joint,end,widths){
 const u=unit(root,joint),v=unit(joint,end),sum=add(u,v),length=Math.hypot(...sum),bisector=length?mul(sum,1/length):u;
 const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t),centers=[root,mix(root,joint,.45),joint,mix(joint,end,.4),end],axes=[u,u,bisector,v,v];
 const edge=sign=>centers.map((p,i)=>[p[0]-sign*axes[i][1]*widths[i],p[1]+sign*axes[i][0]*widths[i]]);
 return [...edge(1),...edge(-1).reverse()];
}
function foot(name,k,a,m,color,grounded){
 const u=unit(a,k),front=[-u[1],u[0]],r=grounded?0:Math.atan2(u[1],u[0])+Math.PI/2-rad(10);
 const turn=([x,y])=>[a[0]+x*Math.cos(r)-y*Math.sin(r),a[1]+x*Math.sin(r)+y*Math.cos(r)];
 const q=[[0,0],[0,0],[8,0],[m.footL-4,m.footH-7],[m.footL,m.footH],[-12,m.footH]].map(turn);
 q[0]=add(add(a,mul(u,11)),mul(front,-7));q[1]=add(add(a,mul(u,11)),mul(front,7));
 const inset=q.map(p=>{const c=turn([7,4]);return add(c,mul([p[0]-c[0],p[1]-c[1]],.80))});
 return [poly(name,q,colors.ink,0),poly(name+'-surface',inset,color,0)];
}
function leg(side,l,m){
 const k=l[side+'Knee'],a=l[side+'Ankle'],color=side==='near'?colors.near:colors.far;
 return group(side+'-leg',[poly(side+'-leg-mass',contour(l.hip,k,a,[m.thigh*.6,m.thigh,m.thigh*.55,m.calf,6]),color),...foot(side+'-foot',k,a,m,color,l.support==='both'||l.support===side)]);
}
function arm(side,l,m){
 const e=l[side+'Elbow'],w=l[side+'Wrist'],s=l.shoulder,color=side==='near'?colors.near:colors.far;
 const q=contour(s,e,w,[m.arm*.8,m.arm,m.arm*.58,m.arm*.72,5]),u=unit(s,e),cap=add(s,mul(u,-m.arm*1.1)),f=unit(e,w),t=[-f[1],f[0]],hand=p=>add(add(w,mul(f,p[0])),mul(t,p[1]));
 const d=q.map((p,i)=>(i?'L ':'M ')+xy(p)).join(' ')+` Q ${xy(cap)} ${xy(q[0])} Z`;
 const handD=`M ${xy(hand([-4,-6]))} Q ${xy(hand([m.hand,-9]))} ${xy(hand([m.hand,0]))} Q ${xy(hand([m.hand,9]))} ${xy(hand([-4,6]))} Z`;
 return group(side+'-arm',[path(side+'-arm-mass',d,color),path(side+'-hand',handD,color)]);
}
function torso(l,m){
 const C=l.chest,H=l.hip,at=(x,y)=>add(add(C,mul(l.front,x)),mul(l.up,-y)),p=(x,y)=>add(add(H,mul(l.front,x)),mul(l.up,-y));
 const w=m.ribW/2,hip=m.pelvisW/2;
 return group('torso',[
  path('neck',`M ${xy(at(-9,-m.neck-6))} L ${xy(at(10,-m.neck-3))} L ${xy(at(13,9))} L ${xy(at(-13,9))} Z`,colors.near),
  path('abdomen',`M ${xy(at(-w*.75,38))} Q ${xy(at(4,26))} ${xy(at(w*.75,42))} L ${xy(p(hip*.6,-6))} Q ${xy(p(0,18))} ${xy(p(-hip*.8,-6))} Z`,colors.near),
  path('ribcage',`M ${xy(at(-w*.6,-1))} Q ${xy(at(w*.6,-10))} ${xy(at(w,17))} Q ${xy(at(w+5,40))} ${xy(at(w*.45,58))} Q ${xy(at(-w*.65,64))} ${xy(at(-w,36))} Q ${xy(at(-w-4,12))} ${xy(at(-w*.6,-1))} Z`,colors.body),
  path('pelvis',`M ${xy(p(-hip,-18))} Q ${xy(p(0,-28))} ${xy(p(hip,-15))} L ${xy(p(hip*.8,19))} Q ${xy(p(0,31))} ${xy(p(-hip*.8,17))} Z`,colors.body),
  line('shoulder-girdle',at(-w*.65,7),at(w*.65,14),colors.ink,2),
  line('pelvis-direction',p(-hip*.65,-5),p(hip*.65,0),colors.ink,1.5)
 ]);
}
function head(l,m){
 const at=(x,y)=>add(add(l.head,mul(l.front,x)),mul(l.up,-y)),w=m.headW/2,h=m.headH/2;
 return group('head',[
  path('skull-and-jaw',`M ${xy(at(-w,-h*.45))} Q ${xy(at(-w,-h-3))} ${xy(at(0,-h))} Q ${xy(at(w,-h))} ${xy(at(w,h*.05))} L ${xy(at(w+9,h*.23))} L ${xy(at(w*.8,h*.38))} L ${xy(at(w*.65,h*.87))} Q ${xy(at(-w*.1,h*1.15))} ${xy(at(-w*.7,h*.65))} Z`,colors.body),
  line('brow-plane',at(w*.3,-h*.1),at(w,-h*.08),colors.ink,1.5),
  path('ear-plane',`M ${xy(at(-w*.2,h*.05))} Q ${xy(at(-w*.6,-h*.1))} ${xy(at(-w*.5,h*.35))}`, '#00000000',1.5)
 ]);
}
function guides(l,m){
 const children=[line('guide-ground',[100,560],[540,560],colors.ground,1),line('guide-torso',l.hip,l.chest),line('guide-neck',l.chest,l.head),line('guide-head-axis',add(l.head,mul(l.up,-m.headH/2)),add(l.head,mul(l.up,m.headH/2)))];
 for(const side of ['near','far'])for(const [a,b] of [[l.hip,l[side+'Knee']],[l[side+'Knee'],l[side+'Ankle']],[l.shoulder,l[side+'Elbow']],[l[side+'Elbow'],l[side+'Wrist']]])children.push(line(`guide-${side}-${children.length}`,a,b,side==='near'?colors.guide:'#B95137',2));
 for(const [key,p] of Object.entries(l))if(Array.isArray(p)&&!['up','front'].includes(key))children.push(dot('landmark-'+key,p,3,key.startsWith('far')?'#B95137':colors.guide));
 return group('construction-guides',children,{visible:false});
}
function reflect(node){
 const p=structuredClone(node);
 if(p.children)p.children=p.children.map(reflect);
 else if(p.type==='polygon')p.points=p.points.map(([x,y])=>[n(640-x),y]);
 else if(p.type==='ellipse')p.x=640-p.x-p.width;
 else if(p.type==='path'){
  const tokens=p.d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)/g);let coordinate=0;
  p.d=tokens.map(t=>/^[A-Za-z]$/.test(t)?(coordinate=0,t):String(coordinate++%2?Number(t):n(640-Number(t)))).join(' ');
 }
 return p;
}
export function createLibrary(){
 const entries=[],projects={},allLandmarks={};
 for(const [model,m] of Object.entries(MODELS))for(const pose of POSES)for(const direction of ['right','left']){
  const l=landmarks(m,pose),id=`${model}-${pose}-${direction}`;
  let layers=[leg('far',l,m),arm('far',l,m),leg('near',l,m),torso(l,m),head(l,m),arm('near',l,m),guides(l,m)];
  if(direction==='left')layers=layers.map(reflect);
  const project={version:1,name:id,width:640,height:640,layers};validateProject(project);projects[id]=project;
  const coords=Object.fromEntries(Object.entries(l).map(([k,v])=>[k,Array.isArray(v)?v.map(n):v]));
  if(direction==='left')for(const [k,v] of Object.entries(coords))if(Array.isArray(v))coords[k]=['up','front'].includes(k)?[-v[0],v[1]]:[n(640-v[0]),v[1]];
  allLandmarks[id]=coords;entries.push({id,model,pose,direction,support:l.support,json:`projects/${id}.json`,svg:`svg/${id}.svg`,png:`png/${id}.png`});
 }
 return {entries,projects,landmarks:allLandmarks};
}
export function createComparison(lib=createLibrary()){
 const prefix=(node,key)=>{const p=structuredClone(node);p.name=key+'-'+p.name;if(p.id)p.id=key+'-'+p.id;if(p.children)p.children=p.children.map(x=>prefix(x,key));return p};
 const layers=[];
 for(const [i,key] of ['human','rpg'].entries()){
  const x=i*640;layers.push(group(key+'-figure',lib.projects[`${key}-neutral-right`].layers.map(p=>prefix(p,key)),{transform:{x}}));
  layers.push({type:'text',name:key+'-label',x:x+170,y:70,text:MODELS[key].label,font:'Segoe UI',size:28,color:colors.ink});
  layers.push({type:'text',name:key+'-caption',x:x+170,y:105,text:key==='human'?'Longer limbs / smaller head':'Shorter limbs / broader body',font:'Segoe UI',size:17,color:colors.ink});
 }
 const p={version:1,name:'human-and-compact-rpg-mannequins',width:1280,height:640,layers};validateProject(p);return p;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=dirname(fileURLToPath(import.meta.url)),lib=createLibrary();mkdirSync(join(root,'projects'),{recursive:true});
 const save=(p,v)=>writeFileSync(join(root,p),JSON.stringify(v,null,2)+'\n');
 for(const [id,p] of Object.entries(lib.projects))save(`projects/${id}.json`,p);
 save('library.json',{version:1,revision:'mannequins-20261015-r1',models:MODELS,poses:POSES,ground:560,entries:lib.entries});save('landmarks.json',lib.landmarks);
 save('sequence.json',{version:1,name:'human-mannequin-starters',fps:8,loop:false,frames:lib.entries.map(x=>x.json)});
 save('key-check.json',{version:1,name:'mannequin-key-check',fps:8,loop:false,frames:lib.entries.filter(e=>['neutral','run-flight','crouch'].includes(e.pose)&&e.direction==='right').map(x=>x.json)});
 save('comparison.json',createComparison(lib));
 console.log(JSON.stringify({templates:lib.entries.length,models:Object.keys(MODELS),poses:POSES}));
}

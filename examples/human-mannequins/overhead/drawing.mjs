import {construct,FACINGS,PHASES} from '../directional.mjs';
import {MODELS,POSES} from '../generate.mjs';
import {GUIDE_PALETTE,GUIDE_LABELS} from '../guide-palette.mjs';
import {validateProject} from '../../../src/project.js';
export {MODELS,POSES,FACINGS,PHASES};
const ink='#293943',body='#DCC9AB',warm='#D0B99B',light='#F0DFC3';
const n=x=>Math.round(x*100)/100,xy=p=>p.map(n).join(' '),add=(a,b)=>a.map((v,i)=>v+b[i]);
const polygon=q=>q.map((p,i)=>(i?'L ':'M ')+xy(p)).join(' ')+' Z';
const circle=(p,r)=>Array.from({length:16},(_,i)=>add(p,[r*Math.cos(i*Math.PI/8),r*Math.sin(i*Math.PI/8)]));
const path=(name,d,color,stroke=ink,w=2)=>({type:'path',name,d,color,stroke,strokeWidth:w,strokeLinejoin:'round',strokeLinecap:'round'});
const group=(name,children,extra={})=>({type:'group',id:name,name,children,...extra});
export function project(p,direction){const a=FACINGS[direction]*Math.PI/180;return [192+p[0]*Math.cos(a)+p[2]*Math.sin(a),192+p[2]*Math.cos(a)-p[0]*Math.sin(a)];}
function solid(parts){return parts.map(q=>{
 const area=q.reduce((s,p,i)=>{const z=q[(i+1)%q.length];return s+p[0]*z[1]-z[0]*p[1];},0);
 return polygon(area<0?[...q].reverse():q);
}).join(' ');}
function segment(a,b,r0,r1){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<.01)return circle(a,Math.max(r0,r1));const v=[-(b[1]-a[1])/d,(b[0]-a[0])/d];return [add(a,v.map(x=>x*r0)),add(b,v.map(x=>x*r1)),add(b,v.map(x=>-x*r1)),add(a,v.map(x=>-x*r0))];}
function mass(name,points,widths,color){const parts=points.map((p,i)=>circle(p,widths[i]));for(let i=0;i<points.length-1;i++)parts.push(segment(points[i],points[i+1],widths[i],widths[i+1]));const d=solid(parts);return [path(name+'-outline',d,color),path(name+'-surface',d,color,color,0)];}
export function drawing(model,pose,direction,frame=0){
 const m=MODELS[model],world=construct(m,pose,frame),P=p=>project(p,direction);
 if(['walk','run'].includes(pose))for(const s of Object.values(world.sides)){
  // The overhead camera exposes a bilateral forward reach hidden by the
  // elevated view. Offset upper-arm crossover toward the stance crossover
  // and retain a flexed elbow; every endpoint still uses measured lengths.
  const a=-(pose==='run'?64:26)*Math.cos(2*Math.PI*s.phase+Math.PI/4),b=a+(pose==='run'?65:22),rad=x=>x*Math.PI/180;
  const endpoint=(p,len,angle)=>[p[0],p[1]-len*Math.cos(rad(angle)),p[2]+len*Math.sin(rad(angle))];
  s.elbow=endpoint(s.shoulder,m.upperArm,a);s.wrist=endpoint(s.elbow,m.forearm,b);s.hand=endpoint(s.wrist,m.hand,b);
 }
 const id=`${model}-${pose}-${direction}${['walk','run'].includes(pose)?'-'+String(frame).padStart(2,'0'):''}`,nodes=[],projected={};
 const insert=(name,children,height)=>nodes.push({node:group(name,children),height});
 // The spatial constructor's historical keys are reference sides. In a
 // south-facing front view positive lateral is the person's anatomical left.
 const sides={left:world.sides.right,right:world.sides.left};
 for(const [side,s] of Object.entries(sides)){
  projected[side]=Object.fromEntries(Object.entries(s).map(([k,v])=>[k,Array.isArray(v)?P(v).map(n):v]));
  insert(side+'-leg',mass(side+'-leg',[P(s.hip),P(s.knee),P(s.ankle)],[m.thigh*.68,m.thigh*.53,m.calf*.55],warm),(s.hip[1]+s.knee[1]+s.ankle[1])/3);
  const a=s.ankle,half=m===MODELS.rpg?9:8,at=(x,z)=>P([a[0]+x,a[1],a[2]+z]);
  const foot=[at(-half,-10),at(half,-10),at(half+1,m.footL*.62),at(half*.7,m.footL),at(-half*.7,m.footL),at(-half-1,m.footL*.62)];
  insert(side+'-foot',[path(side+'-foot-top',polygon(foot),body),path(side+'-toe-seam',`M ${xy(at(-half*.8,m.footL*.70))} L ${xy(at(half*.8,m.footL*.70))}`,'#00000000',ink,1)],a[1]-5);
  const arm=mass(side+'-arm',[P(s.shoulder),P(s.elbow),P(s.wrist)],[m.arm*.83,m.arm*.59,5],warm);
  const palm=mass(side+'-hand',[P(s.wrist),P(s.hand)],[5,6],body);arm.push(...palm);
  insert(side+'-arm',arm,(s.shoulder[1]+s.elbow[1]+s.wrist[1])/3);
 }
 const C=world.chest,H=world.hip,at=(c,x,z)=>P([c[0]+x,c[1],c[2]+z]),w=world.width*.49,depth=m.ribW*.38;
 const hw=m.pelvisW*.6,p=(x,z)=>xy(at(H,x,z));
 insert('pelvis',[path('pelvic-volume',`M ${p(-hw,0)} Q ${p(-hw,-20)} ${p(-hw*.43,-20)} Q ${p(0,-23)} ${p(hw*.43,-20)} Q ${p(hw,-20)} ${p(hw,0)} Q ${p(hw,18)} ${p(0,20)} Q ${p(-hw,18)} ${p(-hw,0)} Z`,warm)],H[1]);
 // The lean exposes the lower back. Connect hip to rib cage as a continuous
 // mass instead of leaving a detached transverse pelvic block behind it.
 insert('lower-back',mass('abdominal-connection',[P(H),P(C)],[m.pelvisW*.48,w*.72],warm),H[1]+m.torso*.4);
 const q=(x,z)=>xy(at(C,x,z));
 insert('torso',[
  path('shoulder-and-ribcage',`M ${q(-w,-4)} Q ${q(-w*.85,-depth)} ${q(0,-depth)} Q ${q(w*.85,-depth)} ${q(w,-4)} Q ${q(w,depth*.6)} ${q(w*.68,depth)} Q ${q(0,depth*1.18)} ${q(-w*.68,depth)} Q ${q(-w,depth*.6)} ${q(-w,-4)} Z`,body),
  path('upper-back-plane',`M ${q(-w*.72,-7)} Q ${q(0,-depth*.9)} ${q(w*.72,-7)}`,'#00000000','#9A8269',1.2)
 ],C[1]-12);
 const h=[world.head[0],world.head[1],world.head[2]+3],r=m.headW*.5;
 const t=(x,z)=>xy(at(h,x,z));
 insert('head',[
  path('crown-and-nose',`M ${t(-r,-2)} Q ${t(-r,-r*.98)} ${t(0,-r*1.06)} Q ${t(r,-r*.98)} ${t(r,-2)} Q ${t(r,r*.58)} ${t(r*.27,r*.82)} L ${t(r*.14,r*1.09)} Q ${t(0,r*1.25)} ${t(-r*.14,r*1.09)} L ${t(-r*.27,r*.82)} Q ${t(-r,r*.58)} ${t(-r,-2)} Z`,light),
  path('crown-plane',`M ${t(-r*.62,-r*.31)} Q ${t(0,-r*.74)} ${t(r*.62,-r*.31)}`,'#00000000','#B39A79',1)
 ],h[1]);
 const guides=[];
 for(const [side,s] of Object.entries(sides)){
  const keys=['hip','knee','ankle','shoulder','elbow','wrist','hand'],joints=keys.map(k=>P(s[k]));
  const chain=(names)=>names.map((k,i)=>(i?'L ':'M ')+xy(P(s[k]))).join(' ');
  // L uses circular joints, R diamonds: identity does not depend on color alone.
  const markers=joints.map(p=>polygon(side==='left'?circle(p,2.8):[add(p,[0,-3.4]),add(p,[3.4,0]),add(p,[0,3.4]),add(p,[-3.4,0])]));
  guides.push(path('guide-'+side,chain(['hip','knee','ankle'])+' '+chain(['shoulder','elbow','wrist','hand'])+' '+markers.join(' '),'#00000000',GUIDE_PALETTE[side],1.7));
 }
 guides.push(path('guide-pelvis',`M ${xy(P(sides.left.hip))} L ${xy(P(sides.right.hip))}`,'#00000000',GUIDE_PALETTE.pelvis,2.5),path('guide-torso',`M ${xy(P(H))} L ${xy(P(C))}`,'#00000000',GUIDE_PALETTE.torso,2.5),path('guide-head',solid([circle(P(h),r*.75)]),'#00000000',GUIDE_PALETTE.head,2));
 const layers=nodes.sort((a,b)=>a.height-b.height).map(x=>x.node);layers.push(group('construction-guides',guides,{visible:false}));
 const spec={version:1,name:id,width:384,height:384,layers};validateProject(spec);return {id,spec,world,projected};
}
export function createLibrary(){
 const assets=[],entries=[],projects={},landmarks={};
 for(const model of Object.keys(MODELS))for(const direction of Object.keys(FACINGS)){
  const asset=(pose,i)=>{const f=drawing(model,pose,direction,i),a={id:f.id,model,pose,direction,json:`projects/${f.id}.json`,svg:`svg/${f.id}.svg`,png:`png/${f.id}.png`,...(['walk','run'].includes(pose)?{frame:i,phase:PHASES[i]}:{})};assets.push(a);projects[f.id]=f.spec;landmarks[f.id]={world:f.world,projected:f.projected};return a;};
  for(const pose of POSES)entries.push({...asset(pose,0),kind:'pose'});
  for(const pose of ['walk','run'])entries.push({id:`${model}-${pose}-${direction}`,model,pose,direction,kind:'clip',fps:pose==='walk'?8:12,loop:true,frames:Array.from({length:8},(_,i)=>asset(pose,i))});
 }
 return {version:3,revision:'overhead-20261015-r1',models:MODELS,poses:[...POSES,'walk','run'],directions:Object.keys(FACINGS),canvas:{width:384,height:384},camera:'orthographic overhead: screen uses lateral and forward; height controls overlap only',facingLabels:Object.fromEntries(Object.keys(FACINGS).map(d=>[d,d+' · '+({S:'Down',N:'Up',E:'Right',W:'Left',SE:'Down right',SW:'Down left',NE:'Up right',NW:'Up left'}[d])])),guidePalette:GUIDE_PALETTE,guideLabels:GUIDE_LABELS,entries,assets,projects,landmarks};
}

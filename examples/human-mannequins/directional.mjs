// Offline spatial construction, flattened to ordinary editable Agent Draw shapes.
// No runtime skeleton, rigid sprite rotation or interpolated body-part animation.
import {validateProject} from '../../src/project.js';
export const FACINGS={S:0,SE:45,E:90,NE:135,N:180,NW:225,W:270,SW:315};
export const PHASES=['contact','reception','passing','lift','opposite-contact','opposite-reception','opposite-passing','opposite-lift'];
const ink='#293943',body='#DCC9AB',near='#D0B99B',far='#9DA8A9',light='#F0DFC3';
const rad=d=>d*Math.PI/180,n=v=>Math.round(v*100)/100,add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const xy=p=>p.map(n).join(' '),norm=a=>{const d=Math.hypot(...a);return d>1e-8?mul(a,1/d):[0,1]};
const path=(name,d,color,w=2.5)=>({type:'path',name,d,color,stroke:ink,strokeWidth:w,strokeLinejoin:'round',strokeLinecap:'round'});
const poly=(name,q,color,w=2.5)=>({type:'polygon',name,points:q.map(p=>p.map(n)),color,stroke:ink,strokeWidth:w,strokeLinejoin:'round'});
const line=(name,a,b,color=ink,w=1.5)=>({...path(name,`M ${xy(a)} L ${xy(b)}`,'#00000000',w),stroke:color});
const group=(name,children,extra={})=>({type:'group',id:name,name,children,...extra});
export function project(p,direction){const a=rad(FACINGS[direction]);return [320+p[0]*Math.cos(a)+p[2]*Math.sin(a),560-p[1]+.18*(p[2]*Math.cos(a)-p[0]*Math.sin(a))];}
const depth=(p,d)=>p[2]*Math.cos(rad(FACINGS[d]))-p[0]*Math.sin(rad(FACINGS[d]));
function joint(root,ankle,upper,lower){
 const dy=ankle[1]-root[1],dz=ankle[2]-root[2],d=Math.hypot(dy,dz);
 if(d>=upper+lower||d<=Math.abs(upper-lower))throw Error(`Unreachable limb: ${d} / ${upper+lower}`);
 const along=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-along*along));
 // Knees flex forward in the sagittal plane, never through the back of the thigh.
 return [root[0],root[1]+dy/d*along+dz/d*h,root[2]+dz/d*along-dy/d*h];
}
function limbAngles(root,a,b,upper,lower){const e=add(root,[0,-a*Math.cos(rad(upper)),a*Math.sin(rad(upper))]);return [e,add(e,[0,-b*Math.cos(rad(lower)),b*Math.sin(rad(lower))])];}
export function construct(m,pose,frame=0){
 const total=m.upperLeg+m.lowerLeg,p=frame/8,isRun=pose==='run',moving=pose==='walk'||isRun;
 const settings={neutral:[.98,0], 'walk-contact':[.90,4],'walk-pass':[.96,3],'run-push':[.88,20],'run-flight':[1.06,15],jump:[1.10,8],crouch:[.58,35],reach:[.98,5]};
 const [height,lean]=moving?[isRun?.87-.055*Math.cos(4*Math.PI*p):.92-.025*Math.cos(4*Math.PI*p),isRun?13:4]:settings[pose];
 const hip=[0,m.footH+total*height,0],up=[0,Math.cos(rad(lean)),Math.sin(rad(lean))],forward=[0,-up[2],up[1]],chest=add(hip,mul(up,m.torso));
 const head=add(chest,mul(up,m.neck+m.headH/2)),width=m.label==='Human'?78:88,hipSpan=m.pelvisW*.27;
 const l={hip,chest,head,up,forward,width,ground:0,sides:{}};
 for(const [i,side] of ['left','right'].entries()){
  const sign=i===0?-1:1,q=(p+i*.5)%1,root=add(hip,[sign*hipSpan,0,0]);
  const shoulder=add(add(chest,mul(up,-m.headH*.12)),[sign*width*.47,0,-3]);let knee,ankle,contact=false,upper,lower;
  if(moving){
   const stance=isRun?.375:.625,travel=total*(isRun?.63:.58),t=q<stance?q/stance:(q-stance)/(1-stance);
   const z=q<stance?travel*(.5-t):travel*(-.5+t),lift=q<stance?0:total*(isRun?.48:.23)*Math.sin(Math.PI*t);
   ankle=[root[0],m.footH+lift,z];knee=joint(root,ankle,m.upperLeg,m.lowerLeg);contact=q<stance;
   upper=(isRun?48:26)*Math.cos(2*Math.PI*q+Math.PI);lower=upper+(isRun?78:22);
  }else{
   const actions={neutral:{feet:[16,-14],arms:[[4,18],[-10,-2]]},'walk-contact':{feet:[total*.29,-total*.275],arms:[[-25,5],[25,55]]},'walk-pass':{feet:[0,null],legs:[null,[45,-35]],arms:[[15,45],[-15,15]]},'run-push':{feet:[-total*.2,null],legs:[null,[55,-70]],arms:[[45,110],[-45,20]]},'run-flight':{legs:[[65,-20],[-35,-125]],arms:[[-40,30],[45,115]]},jump:{legs:[[45,-20],[-25,-95]],arms:[[120,160],[70,130]]},crouch:{feet:[total*.25,-total*.05],arms:[[20,105],[-20,65]]},reach:{feet:[16,-14],arms:[[100,140],[-5,15]]}}[pose];
   if(actions.feet?.[i]!=null){ankle=[root[0],m.footH,actions.feet[i]];knee=joint(root,ankle,m.upperLeg,m.lowerLeg);contact=true;}
   else [knee,ankle]=limbAngles(root,m.upperLeg,m.lowerLeg,...actions.legs[i]);
   [upper,lower]=actions.arms[i];
  }
  const [elbow,wrist]=limbAngles(shoulder,m.upperArm,m.forearm,upper,lower);
  // The hand continues the forearm; the palm stays attached across every pose.
  const hand=add(wrist,mul(norm(add(wrist,mul(elbow,-1))),m.hand));
  l.sides[side]={hip:root,shoulder,knee,ankle,elbow,wrist,hand,contact,phase:q};
 }
 return l;
}
function contour(a,b,c,widths){
 const u=norm(add(b,mul(a,-1))),v=norm(add(c,mul(b,-1))),bis=norm(add(u,v)),centers=[a,mix(a,b,.45),b,mix(b,c,.4),c],axes=[u,u,bis,v,v];
 const edge=s=>centers.map((p,i)=>[p[0]-s*axes[i][1]*widths[i],p[1]+s*axes[i][0]*widths[i]]);
 return [...edge(1),...edge(-1).reverse()];
}
function foldedMass(a,b,c,widths){
 const segment=(p,q,w0,wm,w1,t)=>{
  const u=norm(add(q,mul(p,-1))),v=[-u[1],u[0]],mid=mix(p,q,t);
  return [add(p,mul(v,w0)),add(mid,mul(v,wm)),add(q,mul(v,w1)),add(q,mul(v,-w1)),add(mid,mul(v,-wm)),add(p,mul(v,-w0))];
 };
 const circle=(p,r)=>Array.from({length:12},(_,i)=>add(p,[r*Math.cos(i*Math.PI/6),r*Math.sin(i*Math.PI/6)]));
 const parts=[segment(a,b,...widths.slice(0,3),.45),segment(b,c,...widths.slice(2),.4),circle(b,widths[2]),circle(a,widths[0])];
 // Consistent winding makes overlapping subpaths a solid union. Painting its
 // fill again over the stroked union removes internal crossing outline edges.
 return parts.map(q=>{
  const area=q.reduce((s,p,i)=>{const z=q[(i+1)%q.length];return s+p[0]*z[1]-z[0]*p[1];},0);
  if(area<0)q.reverse();return q.map((p,i)=>(i?'L ':'M ')+xy(p)).join(' ')+' Z';
 }).join(' ');
}
export function drawing(m,pose,direction,frame=0){
 const world=construct(m,pose,frame),P=p=>project(p,direction),front=Math.cos(rad(FACINGS[direction])),turn=Math.sin(rad(FACINGS[direction]));
 const nearest=depth([-1,0,0],direction)>=depth([1,0,0],direction)?'left':'right';
 const color=side=>side===nearest?near:far;
 const limb=(side,kind)=>{
  const s=world.sides[side],arm=kind==='arm',a=P(arm?s.shoulder:s.hip),b=P(arm?s.elbow:s.knee),c=P(arm?s.wrist:s.ankle),r=arm?m.arm:m.thigh;
  const widths=[r*.65,r,r*.55,arm?r*.72:m.calf,arm?5:6],q=contour(a,b,c,widths);
  const cap=add(a,mul(norm(add(a,mul(b,-1))),r*.9));
  const shapes=[arm?path(`${side}-${kind}-mass`,q.map((p,i)=>(i?'L ':'M ')+xy(p)).join(' ')+` Q ${xy(cap)} ${xy(q[0])} Z`,color(side)):poly(`${side}-${kind}-mass`,q,color(side))];
  const u=norm(add(b,mul(a,-1))),v=norm(add(c,mul(b,-1)));
  if(Math.abs(turn)<.1&&u[0]*v[0]+u[1]*v[1]<-.15){
   const d=foldedMass(a,b,c,widths);
   shapes.splice(0,1,path(`${side}-${kind}-mass`,d,color(side)),path(`${side}-${kind}-surface`,d,color(side),0));
  }
  if(arm){const end=P(s.hand);shapes.push(poly(`${side}-hand`,contour(c,mix(c,end,.5),end,[5,7,7,6,4]),color(side),2));}
  else{
   // Cuff follows the ankle, sole follows the ground plane. Never derive toe
   // orientation from an inverted shin vector or a world/local angle shortcut.
   const a=s.ankle,L=m.footL,zTilt=s.contact?0:Math.max(-.35,Math.min(.35,(s.knee[2]-a[2])/m.lowerLeg*.3));
   const local=(x,y,z)=>P(add(a,[x,y+z*zTilt,z]));
   const sole=-m.footH,half=8;
   const foot=[local(-half,8,-6),local(half,8,-6),local(half,2,L*.5),local(half,sole,L),local(-half,sole,L),local(-half,sole,-11)];
   if(front<-.1){
    // Rear cameras see a complete heel wall and the upper forefoot plane.
    // The missing second heel corner in the simpler profile wedge makes its
    // nearest lower corner look like a toe pointing toward the viewer.
    foot.push(local(half,sole,-11),local(-half,-m.footH*.2,-11),local(half,-m.footH*.2,-11),local(-half,-m.footH*.45,L-3),local(half,-m.footH*.45,L-3));
   }
   // Sort outline points in screen space to retain a solid foot at every yaw.
   const hull=convex(foot);shapes.push(poly(`${side}-foot`,hull,color(side),2.5));
   if(front<-.1){
    shapes.push(poly(`${side}-foot-upper-plane`,[local(-half,-m.footH*.2,-11),local(half,-m.footH*.2,-11),local(half,-m.footH*.45,L-3),local(-half,-m.footH*.45,L-3)],side===nearest?light:'#B6C0BC',1));
    shapes.push(poly(`${side}-heel-wall`,[local(-half,-m.footH*.2,-11),local(half,-m.footH*.2,-11),local(half,sole,-11),local(-half,sole,-11)],color(side),1));
   }else shapes.push(line(`${side}-foot-toe`,local(-half,sole+4,L*.78),local(half,sole+4,L*.78),ink,1));
  }
  const points=arm?[s.shoulder,s.elbow,s.wrist]:[s.hip,s.knee,s.ankle];
  return {node:group(`${side}-${kind}`,shapes),depth:points.reduce((sum,p)=>sum+depth(p,direction),0)/3};
 };
 const C=world.chest,H=world.hip,U=world.up;
 const radius=(lateral,sagittal)=>Math.hypot(lateral*Math.cos(rad(FACINGS[direction])),sagittal*turn);
 const chestW=radius(world.width*.47,m.ribW*.5),hipW=radius(m.pelvisW*.66,m.pelvisW*.5);
 const at=(center,x,y)=>add(P(add(center,mul(U,-y))),[x,0]);
 const torso=group('torso',[
  path('neck',`M ${xy(at(C,-9,-m.neck-6))} L ${xy(at(C,9,-m.neck-6))} L ${xy(at(C,13,8))} L ${xy(at(C,-13,8))} Z`,near),
  path('abdomen',`M ${xy(at(C,-chestW*.7,35))} L ${xy(at(C,chestW*.7,35))} L ${xy(at(H,hipW*.75,10))} Q ${xy(at(H,0,29))} ${xy(at(H,-hipW*.75,10))} Z`,near),
  path('ribcage',`M ${xy(at(C,-chestW*.7,-1))} Q ${xy(at(C,0,-12))} ${xy(at(C,chestW*.7,-1))} Q ${xy(at(C,chestW*1.1,18))} ${xy(at(C,chestW*.78,43))} Q ${xy(at(C,0,67))} ${xy(at(C,-chestW*.78,43))} Q ${xy(at(C,-chestW*1.1,18))} ${xy(at(C,-chestW*.7,-1))} Z`,body),
  path('pelvis',`M ${xy(at(H,-hipW,-17))} Q ${xy(at(H,0,-27))} ${xy(at(H,hipW,-17))} L ${xy(at(H,hipW*.77,18))} Q ${xy(at(H,0,29))} ${xy(at(H,-hipW*.77,18))} Z`,body)
 ]);
 const faceCenter=P(add(C,mul(world.forward,(front>=0?1:-1)*m.ribW*.40))),axisX=faceCenter[0];
 if(front>.1){torso.children.push(line('left-clavicle',at(C,-chestW*.75,6),[axisX,at(C,0,14)[1]],ink,1.3),line('right-clavicle',[axisX,at(C,0,14)[1]],at(C,chestW*.75,6),ink,1.3),line('sternum',[axisX,at(C,0,17)[1]],[axisX,at(C,0,40)[1]],'#9A8269',1));}
 else if(front<-.1){torso.children.push(line('spine',[axisX,at(C,0,8)[1]],[axisX,at(C,0,45)[1]],'#9A8269',1.3),line('left-scapula',at(C,-chestW*.65,13),[axisX-5,at(C,0,29)[1]],'#9A8269',1),line('right-scapula',[axisX+5,at(C,0,29)[1]],at(C,chestW*.65,13),'#9A8269',1));}
 const hp=P(world.head),hw=radius(m.headW*.5,m.headW*.52),hh=m.headH*.5;
 const headShapes=[path('skull-and-jaw',`M ${xy([hp[0]-hw,hp[1]-hh*.4])} Q ${xy([hp[0]-hw,hp[1]-hh])} ${xy([hp[0],hp[1]-hh])} Q ${xy([hp[0]+hw,hp[1]-hh])} ${xy([hp[0]+hw,hp[1]-hh*.4])} L ${xy([hp[0]+hw*.85,hp[1]+hh*.5])} Q ${xy([hp[0],hp[1]+hh*1.1])} ${xy([hp[0]-hw*.85,hp[1]+hh*.5])} Z`,body)];
 if(front>=-.01){
  const nose=hp[0]+turn*hw*.85;
  if(Math.abs(turn)>.5)headShapes.push(poly('nose-plane',[[nose,hp[1]-2],[nose+Math.sign(turn)*9,hp[1]+hh*.23],[nose,hp[1]+hh*.36]],body,1.5));
  else headShapes.push(path('nose-plane',`M ${xy([nose-2,hp[1]-2])} L ${xy([nose+3,hp[1]+hh*.25])} L ${xy([nose-2,hp[1]+hh*.3])}`,'#00000000',1.2));
  const left=hp[0]-hw*.55,right=hp[0]+hw*.55;
  if(turn<.9)headShapes.push(line('left-brow',[left,hp[1]-hh*.12],[nose-5,hp[1]-hh*.12],ink,1.5));
  if(turn>-.9)headShapes.push(line('right-brow',[nose+5,hp[1]-hh*.12],[right,hp[1]-hh*.12],ink,1.5));
 }else headShapes.push(path('occiput-and-nape',`M ${xy([hp[0]-hw*.45,hp[1]+hh*.55])} Q ${xy([hp[0],hp[1]+hh*.72])} ${xy([hp[0]+hw*.45,hp[1]+hh*.55])}`,'#00000000',1.2));
 const head=group('head',headShapes),limbs=['left','right'].flatMap(side=>[limb(side,'leg'),limb(side,'arm')]);
 // Legs emerge under the pelvic mass. Arms cross in front only when their
 // actual forearm depth puts them ahead of the rib cage in this camera view.
 const legs=limbs.filter(x=>x.node.name.endsWith('leg')).sort((a,b)=>a.depth-b.depth),arms=limbs.filter(x=>x.node.name.endsWith('arm')).sort((a,b)=>a.depth-b.depth);
 const bodyDepth=depth(add(C,mul(world.forward,(front>=0?1:-1)*m.ribW*.18)),direction);
 const behind=arms.filter(x=>x.depth<bodyDepth),ahead=arms.filter(x=>x.depth>=bodyDepth);
 // A side-view far shoulder belongs behind the body even at an identical stride depth.
 if(Math.abs(front)<.1){for(const arm of [...ahead])if(arm.node.name.startsWith(nearest==='left'?'right':'left')){behind.push(arm);ahead.splice(ahead.indexOf(arm),1);}}
 const guides=[];for(const [side,s] of Object.entries(world.sides)){
  const col=side==='left'?'#237A96':'#B95137';
  for(const [a,b] of [['hip','knee'],['knee','ankle'],['shoulder','elbow'],['elbow','wrist'],['wrist','hand']])guides.push(line(`guide-${side}-${a}-${b}`,P(s[a]),P(s[b]),col,1.5));
  for(const [k,p] of Object.entries(s))if(Array.isArray(p)){const q=P(p);guides.push({type:'ellipse',name:`joint-${side}-${k}`,x:Math.round(q[0]-2),y:Math.round(q[1]-2),width:4,height:4,color:col});}
 }
 guides.push(line('guide-spine',P(H),P(C),'#237A96'),line('guide-head',P(C),hp,'#237A96'));
 const layers=[...legs.map(x=>x.node),...behind.map(x=>x.node),torso,head,...ahead.map(x=>x.node),group('construction-guides',guides,{visible:false})];
 const id=`${m.label==='Human'?'human':'rpg'}-${pose}-${direction}${['walk','run'].includes(pose)?'-'+String(frame).padStart(2,'0'):''}`;
 const spec={version:1,name:id,width:640,height:640,layers};validateProject(spec);
 return {id,spec,world,projected:Object.fromEntries(Object.entries(world.sides).map(([side,s])=>[side,Object.fromEntries(Object.entries(s).map(([k,v])=>[k,Array.isArray(v)?P(v).map(n):v]))]))};
}
function convex(points){
 const q=points.map(p=>p.map(n)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),h=[];
 for(const p of q){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}const bottom=h.length;
 for(const p of q.slice(0,-1).reverse()){while(h.length>bottom&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}h.pop();return h;
}

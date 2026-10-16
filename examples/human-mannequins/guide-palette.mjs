// Anatomical identity is independent of camera, lighting and screen side.
export const GUIDE_PALETTE={left:'#2879C7',right:'#CC4B4B',head:'#B88016',torso:'#19877B',pelvis:'#8A57AE'};
export const GUIDE_LABELS={left:'L · Anatomical left',right:'R · Anatomical right',head:'H · Head',torso:'T · Torso',pelvis:'P · Pelvis'};
export function applyGuidePalette(spec,direction,legacy=false){
 const out=structuredClone(spec),guides=out.layers.find(x=>x.id==='construction-guides');
 if(!guides)throw Error('Missing construction guides');
 for(const node of guides.children){
  const key=node.name;let part;
  if(legacy){
   if(/near/i.test(key))part=direction==='E'?'right':'left';
   else if(/far/i.test(key))part=direction==='E'?'left':'right';
  }else{
   if(/-(left)-/.test(key))part='right';
   else if(/-(right)-/.test(key))part='left';
  }
  if(!part){if(/head|neck/i.test(key))part='head';else if(/hip|pelvis/i.test(key))part='pelvis';else if(!/ground/.test(key))part='torso';}
  if(!part)continue;
  const color=GUIDE_PALETTE[part];
  if(node.stroke)node.stroke=color;
  if(node.color!=='#00000000')node.color=color;
 }
 // Hip-joint markers retain limb identity; the transverse pelvic axis has
 // its own purple identity. Add it only once when reapplying the palette.
 if(!legacy&&!guides.children.some(x=>x.name==='guide-pelvis-axis')){
  const hips=['left','right'].map(side=>guides.children.find(x=>x.name===`joint-${side}-hip`));
  if(hips.every(Boolean)){const [a,b]=hips.map(x=>[x.x+x.width/2,x.y+x.height/2]);guides.children.push({type:'path',name:'guide-pelvis-axis',d:`M ${a.join(' ')} L ${b.join(' ')}`,color:'#00000000',stroke:GUIDE_PALETTE.pelvis,strokeWidth:2.5});}
 }
 return out;
}

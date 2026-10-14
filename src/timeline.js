import { validateProject } from './project.js';
import { renderSvg } from './svg.js';

// Tracks contain absolute property values. Validation also creates a fresh tree,
// so sampling never changes either the source or previously sampled frames.
export function sampleAnimation(project, frame) {
 const sampled=validateProject(project);
 const animation=sampled.animation;
 if(!animation)throw new Error('Project has no animation');
 const end=animation.loop?animation.frames:animation.frames-1;
 if(typeof frame!=='number'||!Number.isFinite(frame)||frame<0||frame>end)throw new Error(`frame: expected number 0..${end}`);
 const groups=new Map();
 function visit(layers){for(const layer of layers)if(layer.type==='group'){groups.set(layer.id,layer);visit(layer.children);}}
 visit(sampled.layers);
 for(const track of animation.tracks){
  const keys=track.keyframes;
  let value=keys.at(-1).value;
  for(let i=1;i<keys.length;i++){
   if(frame<keys[i].frame){
    const left=keys[i-1],right=keys[i];
    let t=(frame-left.frame)/(right.frame-left.frame);
    if(track.easing==='smooth')t=t*t*(3-2*t);
    if(track.easing==='step')t=0;
    value=left.value+(right.value-left.value)*t;
    break;
   }
  }
  const group=groups.get(track.target);
  if(track.property==='opacity')group.opacity=value;
  else group.transform[track.property]=value;
 }
 delete sampled.animation;
 return sampled;
}

export function checkLoopSeam(project) {
 const normalized=validateProject(project);
 if(!normalized.animation?.loop)throw new Error('Loop seam check requires a loop animation');
 if(renderSvg(sampleAnimation(normalized,0))!==renderSvg(sampleAnimation(normalized,normalized.animation.frames)))throw new Error('Animation loop seam is not closed');
 return {closed:true,method:'canonical SVG equality at virtual endpoint'};
}

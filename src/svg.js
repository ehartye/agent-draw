// Only validated schema data reaches this renderer; every text/attribute is escaped.
export const escapeXml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
function paint(color,kind){return `${kind}="${color.slice(0,7)}"${color.length===9?` ${kind}-opacity="${parseInt(color.slice(7),16)/255}"`:''}`;}
export function renderSvg(project){
 const definitions=[];
 const layers=project.layers.map((l,index)=>{
  let fill=paint(l.color,'fill');
  if(l.fillGradient){
   const g=l.fillGradient,id=`gradient-layer-${index+1}`,tag=g.type==='linear'?'linearGradient':'radialGradient';
   const fields=g.type==='linear'?['x1','y1','x2','y2']:['cx','cy','r'];
   definitions.push(`    <${tag} id="${id}" gradientUnits="userSpaceOnUse" ${fields.map(k=>`${k}="${g[k]}"`).join(' ')}>\n${g.stops.map(stop=>`      <stop offset="${stop.offset}" ${paint(stop.color,'stop-color').replace('stop-color-opacity','stop-opacity')}/>`).join('\n')}\n    </${tag}>`);
   fill=`fill="url(#${id})"`;
  }
  const attrs=`${fill} fill-rule="${l.fillRule??'nonzero'}"${l.stroke?` ${paint(l.stroke,'stroke')} stroke-width="${l.strokeWidth}" stroke-linejoin="${l.strokeLinejoin??'round'}" stroke-linecap="${l.strokeLinecap??'butt'}"`:''}`;
  let shape;
  if(l.type==='rectangle')shape=`<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" rx="${l.radius}" ${attrs}/>`;
  else if(l.type==='ellipse')shape=`<ellipse cx="${l.x+l.width/2}" cy="${l.y+l.height/2}" rx="${l.width/2}" ry="${l.height/2}" ${attrs}/>`;
  else if(l.type==='polygon')shape=`<polygon points="${l.points.map(p=>p.join(',')).join(' ')}" ${attrs}/>`;
  else if(l.type==='path')shape=`<path d="${escapeXml(l.d)}" ${attrs}/>`;
  else if(l.type==='text')shape=`<text x="${l.x}" y="${l.y}" font-family="${escapeXml(l.font)}" font-size="${l.size}" xml:space="preserve" ${attrs}>${l.text.split('\n').map((line,i)=>`<tspan x="${l.x}" dy="${i?l.size*1.2:0}">${escapeXml(line)}</tspan>`).join('')}</text>`;
  return `  <g id="layer-${index+1}" inkscape:groupmode="layer" inkscape:label="${escapeXml(l.name)}" opacity="${l.opacity/100}"${l.visible?'':' style="display:none"'}>\n    ${shape}\n  </g>`;
 });
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${project.width}" height="${project.height}" viewBox="0 0 ${project.width} ${project.height}">\n  <title>${escapeXml(project.name)}</title>\n${definitions.length?`  <defs>\n${definitions.join('\n')}\n  </defs>\n`:''}${layers.join('\n')}\n</svg>\n`;
}

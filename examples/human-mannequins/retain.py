"""Retain exact native Agent Draw exports and package reusable sources."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,shutil,sys,zipfile
root=Path(__file__).resolve().parent
source=Path(sys.argv[1]).resolve();comparison=Path(sys.argv[2]).resolve()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
library=json.loads((root/'library.json').read_text(encoding='utf-8'))
receipt=json.loads((source/'receipt.json').read_text(encoding='utf-8'))
assert receipt['ok'] and receipt['kind']=='sequence' and len(receipt['sourceFrames'])==32
for directory in ['svg','png','review']:(root/directory).mkdir(exist_ok=True)
bindings=[]
for entry,frame in zip(library['entries'],receipt['sourceFrames']):
 assert Path(frame['path']).stem==entry['id']
 assert sha(root/entry['json'])==frame['sha256']
 for kind in ['svg','png']:shutil.copyfile(source/frame[kind],root/entry[kind])
 im=Image.open(root/entry['png']).convert('RGBA');bounds=im.getbbox();assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<640 and bounds[3]<=562,(entry['id'],bounds)
 # Hidden guides must not silently become part of the clean drawing.
 assert im.getpixel((0,0))[3]==0
 svg=(root/entry['svg']).read_text(encoding='utf-8');assert '<image' not in svg and 'part-construction-guides' in svg and 'style="display:none"' in svg
 bindings.append({'id':entry['id'],'jsonSha256':sha(root/entry['json']),'svgSha256':sha(root/entry['svg']),'pngSha256':sha(root/entry['png']),'bounds':list(bounds),'sourceIndex':frame['index']})
for model in library['models']:
 for pose in library['poses']:
  strip=Image.new('RGB',(1280,640),'#e9f1f4');draw=ImageDraw.Draw(strip)
  for i,direction in enumerate(['right','left']):
   im=Image.open(root/'png'/f'{model}-{pose}-{direction}.png').convert('RGBA');strip.paste(im,(i*640,0),im);draw.text((i*640+16,14),f'{model} / {pose} / {direction}',fill='#243c4b');draw.line((i*640+100,560,i*640+540,560),fill='#bd7959')
  strip.save(root/'review'/f'{model}-{pose}.png')
c=json.loads((comparison/'receipt.json').read_text(encoding='utf-8'));assert c['ok']
for kind in ['svg','png','pdf']:shutil.copyfile(comparison/f'drawing.{kind}',root/f'comparison.{kind}')
shutil.copyfile(source/'receipt.json',root/'native-sequence-receipt.json')
shutil.copyfile(comparison/'receipt.json',root/'comparison-receipt.json')
(root/'native-bindings.json').write_text(json.dumps({'version':1,'frames':bindings,'scope':'Exact source/native binding, transparency and bounds. Drawing quality needs actual image review.'},indent=2),encoding='utf-8',newline='\n')
with zipfile.ZipFile(root/'human-mannequins.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
 for entry in library['entries']:
  for kind in ['json','svg','png']:z.write(root/entry[kind],entry[kind])
 for name in ['README.md','library.json','landmarks.json','comparison.json','comparison.svg','comparison.png','comparison.pdf','native-bindings.json']:z.write(root/name,name)
print(json.dumps({'nativeTemplates':len(bindings),'archive':str(root/'human-mannequins.zip')}))

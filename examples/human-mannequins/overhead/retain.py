"""Bind native pages to exact, unscaled individual crops and review sheets."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,shutil,sys,zipfile
root=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8',newline='\n')
lib=load(root/'library.json');assets={x['id']:x for x in lib['assets']};pages={x['json']:x for x in load(root/'pages.json')};bindings=[];seen=set()
for d in ['native-pages','native-receipts','png','review']:(root/d).mkdir(exist_ok=True)
sources=[Path(arg).resolve() for arg in sys.argv[1:]];selected={}
for batch,source in enumerate(sources):
 receipt=load(source/'receipt.json');assert receipt['ok'] and receipt['kind']=='sequence'
 for frame in receipt['sourceFrames']:selected[frame['path']]=batch
for batch,source in enumerate(sources):
 receipt=load(source/'receipt.json')
 shutil.copyfile(source/'receipt.json',root/'native-receipts'/f'batch-{batch}.json')
 for frame in receipt['sourceFrames']:
  if selected[frame['path']]!=batch:continue
  page=pages[frame['path']];page_source=root/page['json'];assert sha(page_source)==frame['sha256']==sha(source/frame['project'])
  for kind in ['svg','png']:shutil.copyfile(source/frame[kind],root/'native-pages'/f"{page['id']}.{kind}")
  native_png=root/'native-pages'/f"{page['id']}.png"
  with Image.open(native_png) as check:check.verify()
  im=Image.open(native_png).convert('RGBA');assert im.size==(768,768)
  spec=load(page_source)
  for i,cell in enumerate(page['cells']):
   key=cell['id'];assert key not in seen;seen.add(key);a=assets[key];individual=load(root/a['json'])
   def unprefix(node):
    node=dict(node);node['name']=node['name'].removeprefix(f'c{i}-')
    if 'id' in node:node['id']=node['id'].removeprefix(f'c{i}-')
    if 'children' in node:node['children']=[unprefix(x) for x in node['children']]
    return node
   cell_group=spec['layers'][i];assert [unprefix(x) for x in cell_group['children']]==individual['layers']
   assert cell_group['transform']=={'x':cell['box'][0],'y':cell['box'][1]}
   crop=im.crop(cell['box']);bbox=crop.getbbox();assert bbox and min(bbox[:2])>2 and max(bbox[2:])<382,(key,bbox)
   crop.save(root/a['png']);assert Image.open(root/a['png']).convert('RGBA').tobytes()==im.crop(cell['box']).tobytes()
   bindings.append({'id':key,'jsonSha256':sha(root/a['json']),'svgSha256':sha(root/a['svg']),'pngSha256':sha(root/a['png']),'nativePage':page['id'],'pageProjectSha256':sha(page_source),'pagePngSha256':sha(native_png),'crop':cell['box'],'bounds':bbox,'provenance':'exact unscaled crop of successful native Inkscape page'})
assert seen==set(assets),(len(seen),len(assets))
save(root/'native-bindings.json',{'version':1,'frames':bindings,'scope':'Individual PNGs are exact integer crops from native page exports; individual SVGs use validated Agent Draw serialization. No individual-process receipt is implied.'})
def sheet(items,dest):
 canvas=Image.new('RGB',(384*4,408*((len(items)+3)//4)),'#e9f1f4');d=ImageDraw.Draw(canvas)
 for i,a in enumerate(items):
  x=i%4*384;y=i//4*408;im=Image.open(root/a['png']).convert('RGBA');canvas.paste(im,(x,y+24),im);d.text((x+12,y+7),a['id'],fill='#243c4b')
 canvas.save(dest)
for model in lib['models']:
 for pose in [p for p in lib['poses'] if p not in ['walk','run']]:sheet([a for a in lib['assets'] if a['model']==model and a['pose']==pose],root/'review'/f'{model}-{pose}.png')
 for clip in [x for x in lib['entries'] if x['model']==model and x['kind']=='clip']:
  assert len({Image.open(root/a['png']).convert('RGBA').tobytes() for a in clip['frames']})==8
  sheet(clip['frames'],root/'review'/f"{clip['id']}.png")
# Technical comparison board uses native source pixels, no resizing or redraw.
board=Image.new('RGB',(768,280),'#f9fcfd');d=ImageDraw.Draw(board)
for i,model in enumerate(['human','rpg']):
 im=Image.open(root/f'png/{model}-neutral-S.png').convert('RGBA').crop((0,64,384,320));board.paste(im,(i*384,24),im);d.text((i*384+20,12),lib['models'][model]['label'],fill='#243c4b')
board.save(root/'comparison.png')
with zipfile.ZipFile(root/'overhead-mannequins.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
 for folder in ['projects','svg','png','pages','native-pages','native-receipts']:
  for p in sorted((root/folder).glob('*')):z.write(p,p.relative_to(root).as_posix())
 for name in ['README.md','library.json','landmarks.json','clips.json','native-bindings.json','pages.json','sequence-0.json','sequence-1.json','comparison.png']:z.write(root/name,name)
print(json.dumps({'drawings':len(seen),'nativePages':len(pages),'reviewSheets':len(list((root/'review').glob('*.png'))),'uniqueFramesPerClip':8,'archiveBytes':(root/'overhead-mannequins.zip').stat().st_size}))

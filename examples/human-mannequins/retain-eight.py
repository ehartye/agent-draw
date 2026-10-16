"""Retain native exports, build readable review sheets, package whole-frame clips."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,shutil,sys,zipfile
root=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
lib=json.loads((root/'library.json').read_text(encoding='utf-8'))
assets={e['id']:e for e in lib['assets']};seen=set();bindings=[];selected={};sources=[]
for d in ['svg','png','review-eight','native-receipts']:(root/d).mkdir(exist_ok=True)
for i,arg in enumerate(sys.argv[1:]):
 source=Path(arg).resolve();receipt=json.loads((source/'receipt.json').read_text(encoding='utf-8'))
 assert receipt['ok'] and receipt['kind'] in ['sequence','recovered-partial-sequence']
 sources.append((source,receipt))
 shutil.copyfile(source/'receipt.json',root/'native-receipts'/f'batch-{i}.json')
 for frame in receipt['sourceFrames']:selected[Path(frame['path']).stem]=i
for i,(source,receipt) in enumerate(sources):
 for frame in receipt['sourceFrames']:
  key=Path(frame['path']).stem
  if selected[key]!=i:continue # A later verified export supersedes this drawing.
  assert key in assets and key not in seen;seen.add(key);e=assets[key]
  assert sha(root/e['json'])==frame['sha256'],key
  for kind in ['svg','png']:shutil.copyfile(source/frame[kind],root/e[kind])
  if receipt['kind']=='recovered-partial-sequence':
   assert sha(root/e['svg'])==frame['svgSha256'] and sha(root/e['png'])==frame['pngSha256']
  with Image.open(root/e['png']) as check:check.verify()
  im=Image.open(root/e['png']).convert('RGBA');bounds=im.getbbox()
  assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<640 and bounds[3]<640,(key,bounds)
  assert im.getpixel((0,0))[3]==0
  svg=(root/e['svg']).read_text(encoding='utf-8');assert '<image' not in svg and 'part-construction-guides' in svg and 'style="display:none"' in svg
  bindings.append({'id':key,'jsonSha256':sha(root/e['json']),'svgSha256':sha(root/e['svg']),'pngSha256':sha(root/e['png']),'bounds':list(bounds),'batch':i,'sourceIndex':frame['index'],'provenance':receipt['kind']})
assert seen==set(assets),(len(seen),len(assets))
(root/'native-bindings-eight.json').write_text(json.dumps({'version':1,'frames':bindings,'scope':'Exact native/source bytes, transparency, bounds. Art and motion require separate review.'},indent=2)+'\n',encoding='utf-8',newline='\n')
def sheet(entries,dest,columns):
 # Source pixels are cropped, never resized; the person remains at native scale.
 h=520;w=360;canvas=Image.new('RGB',(w*columns,h*((len(entries)+columns-1)//columns)),'#e9f1f4');d=ImageDraw.Draw(canvas)
 for i,e in enumerate(entries):
  x=i%columns*w;y=i//columns*h
  src=Image.open(root/e['png']).convert('RGBA');crop=src.crop((140,80,500,600));b=src.getbbox();assert b[0]>=140 and b[1]>=80 and b[2]<=500 and b[3]<=600,e['id']
  canvas.paste(crop,(x,y),crop);d.text((x+10,y+7),e['id'],fill='#243c4b')
  if 'frame' in e:d.text((x+10,y+24),e['phase'],fill='#526c79')
 canvas.save(dest)
for model in lib['models']:
 for pose in [x for x in lib['poses'] if x not in ['walk','run']]:
  for name,dirs in [('cardinals',['S','E','N','W']),('diagonals',['SE','NE','NW','SW'])]:
   entries=[next(x for x in lib['assets'] if x['model']==model and x['pose']==pose and x['direction']==d) for d in dirs]
   sheet(entries,root/'review-eight'/f'{model}-{pose}-{name}.png',4)
 for clip in [e for e in lib['entries'] if e['model']==model and e['kind']=='clip']:sheet(clip['frames'],root/'review-eight'/f"{clip['id']}.png",4)
clips=[e for e in lib['entries'] if e['kind']=='clip']
(root/'clips.json').write_text(json.dumps({'version':1,'canvas':{'width':640,'height':640},'projection':{'origin':[320,560],'verticalScale':1,'depthSlope':.18,'south':'toward viewer','north':'away from viewer'},'clips':clips},indent=2)+'\n',encoding='utf-8',newline='\n')
with zipfile.ZipFile(root/'human-mannequins.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
 for e in lib['assets']:
  for kind in ['json','svg','png']:z.write(root/e[kind],e[kind])
 for name in ['README.md','library.json','landmarks.json','clips.json','comparison.json','comparison.svg','comparison.png','comparison.pdf','native-bindings-eight.json']:z.write(root/name,name)
 for receipt in sorted((root/'native-receipts').glob('*.json')):z.write(receipt,receipt.relative_to(root).as_posix())
print(json.dumps({'drawings':len(seen),'clips':len(clips),'reviewSheets':len(list((root/'review-eight').glob('*.png'))),'archive':str(root/'human-mannequins.zip')}))

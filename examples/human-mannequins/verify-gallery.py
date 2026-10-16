"""Exercise the actual tailnet gallery, all loops at both speeds, and served bytes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json,os
src=Path(__file__).resolve().parent;repo=src.parent.parent
overhead=os.environ.get('MANNEQUIN_OVERHEAD')=='1'
timing=os.environ.get('MANNEQUIN_TIMING','1')=='1'
if overhead:src=src/'overhead'
out=repo/'output'/os.environ.get('MANNEQUIN_BROWSER_OUT','eight-gallery-browser-r1');out.mkdir(exist_ok=True)
url='https://hal9000.taila5c443.ts.net:8468/mannequins/'
if overhead:url+='overhead/'
lib=json.loads((src/'library.json').read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
e={'errors':[],'served':{},'loops':[],'downloads':[]}
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 page=b.new_page(viewport={'width':1440,'height':1080},ignore_https_errors=True,accept_downloads=True)
 page.on('pageerror',lambda err:e['errors'].append(str(err)))
 response=page.goto(url+'?rev='+lib['revision'],wait_until='networkidle');assert response.status==200
 page.wait_for_selector('body[data-ready="true"]');assert page.locator('.drawing').count()==160
 assert page.locator('#palette-legend span').count()==5
 assert page.locator('.drawing:visible').count()==20
 page.screenshot(path=str(out/'gallery-desktop.png'))
 page.select_option('#direction','all');assert page.locator('.drawing:visible').count()==160
 page.select_option('#model','rpg');assert page.locator('.drawing:visible').count()==80
 page.select_option('#pose','run');assert page.locator('.drawing:visible').count()==8
 page.evaluate('window.frameTrace=[];document.addEventListener("mannequinframe",e=>window.frameTrace.push({...e.detail,time:performance.now()}))')
 for clip in [x for x in lib['entries'] if x['kind']=='clip']:
  page.select_option('#model',clip['model']);page.select_option('#pose',clip['pose']);page.select_option('#direction',clip['direction'])
  page.locator(f'[data-id="{clip["id"]}"] .art-button').click();page.wait_for_selector('#detail[data-clip-ready="true"]')
  assert page.locator('#detail-art').get_attribute('data-frame')=='0'
  # The backward control wraps to the last drawing; forward wraps back to first.
  page.click('#previous');page.wait_for_function('document.getElementById("detail-art").dataset.frame==="7"')
  page.click('#next');page.wait_for_function('document.getElementById("detail-art").dataset.frame==="0"')
  for speed in (['1','0.25'] if timing else []):
   page.select_option('#speed',speed);page.evaluate('window.frameTrace=[]');page.click('#play')
   page.wait_for_function('window.frameTrace.length>=10',timeout=15000);page.click('#play')
   trace=page.evaluate('window.frameTrace');assert len(trace)>=10
   assert all((z['frame']+1)%8==q['frame'] for z,q in zip(trace,trace[1:])),(clip['id'],speed,trace)
   assert any(z['frame']==7 and q['frame']==0 for z,q in zip(trace,trace[1:])),(clip['id'],'no wrap')
   intervals=[q['time']-z['time'] for z,q in zip(trace,trace[1:])]
   expected=1000/(clip['fps']*float(speed));assert abs(sum(intervals)/len(intervals)-expected)<expected*.2
   e['loops'].append({'clip':clip['id'],'speed':speed,'fps':clip['fps'],'trace':trace,'averageIntervalMs':sum(intervals)/len(intervals)})
  if clip['direction'] in ['S','NE']:
   page.check('#detail-guides');page.wait_for_function('getComputedStyle(document.querySelector("#detail [data-template-guides]")).display!=="none"')
   page.screenshot(path=str(out/f'{clip["id"]}-guides.png'));page.uncheck('#detail-guides')
  page.keyboard.press('Escape');assert not page.locator('#detail').evaluate('(d)=>d.open')
  print(('Reviewed playback ' if timing else 'Reviewed frame controls ')+clip['id'],flush=True)
  (out/'playback-progress.json').write_text(json.dumps({'loops':e['loops'],'errors':e['errors']},indent=2)+'\n',encoding='utf-8',newline='\n')
 # Static guide behavior and real downloads from one inspected source.
 page.select_option('#model','human');page.select_option('#pose','neutral');page.select_option('#direction','S')
 page.check('#guides');page.wait_for_selector('.drawing:visible [data-template-guides]')
 page.locator('.drawing:visible .art-button').click();page.wait_for_selector('#detail[data-clip-ready="true"]')
 assert page.locator('#transport').is_hidden()
 guide=page.locator('#detail [data-template-guides]')
 colors=guide.locator('[stroke]').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("stroke"))')
 assert set(lib['guidePalette'].values()).issubset(set(colors)),colors
 ids=page.evaluate('Array.from(document.querySelectorAll("[id]")).map(n=>n.id)');assert len(ids)==len(set(ids))
 for key,title in [('json','Agent Draw JSON'),('svg','SVG'),('png','PNG')]:
  with page.expect_download() as event:page.locator('#detail-downloads a').filter(has_text=title).click()
  download=event.value;dest=out/download.suggested_filename;download.save_as(dest)
  item=next(x for x in lib['assets'] if x['id']=='human-neutral-S');assert sha(dest.read_bytes())==sha((src/item[key]).read_bytes());e['downloads'].append(download.suggested_filename)
 page.keyboard.press('Escape');page.uncheck('#guides')
 archive='overhead-mannequins.zip' if overhead else 'human-mannequins.zip'
 common=['index.html','library.json','clips.json',archive,'comparison.png','landmarks.json']
 extra=['../gallery.js','../gallery.css','native-bindings.json','pages.json'] if overhead else ['gallery.js','gallery.css','comparison.svg','comparison.pdf','guide-palette-bindings.json']
 paths=common+extra+[a[k] for a in lib['assets'] for k in ['json','svg','png']]
 for name in paths:
  r=page.request.get(url+('' if name=='index.html' else name));assert r.status==200,(name,r.status)
  actual=sha(r.body());assert actual==sha((src/name).read_bytes()),name;e['served'][name]=actual
 with page.expect_download() as event:page.locator('a.bundle').click()
 event.value.save_as(out/archive);assert sha((out/archive).read_bytes())==sha((src/archive).read_bytes());e['downloads'].append(event.value.suggested_filename)
 page.select_option('#model','all');page.select_option('#pose','all');page.select_option('#direction','S')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(out/'gallery-mobile.png'));page.locator('.drawing:visible').first.scroll_into_view_if_needed();page.screenshot(path=str(out/'gallery-mobile-drawings.png'))
 r=page.request.get(url+('../../game.js' if overhead else '../game.js'));assert r.status==200 and 'construction-20261015-r11' in r.text()
 assert not e['errors'];e.update({'drawings':384,'cards':160,'servedFiles':len(paths),'timingTested':timing,'filterGuideStepAndWrap':True,'uniqueDOMIds':True,'phoneFit':True,'gamePreviewPreserved':True})
 b.close()
(out/'receipt.json').write_text(json.dumps(e,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({k:v for k,v in e.items() if k not in ['served','loops']}))

from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json,os
root=Path(__file__).resolve().parent.parent;src=root/'examples/human-mannequins';out=root/'output'/os.environ.get('MANNEQUIN_BROWSER_OUT','gallery-browser');out.mkdir(exist_ok=True)
url='https://hal9000.taila5c443.ts.net:8468/mannequins/';sha=lambda b:hashlib.sha256(b).hexdigest()
e={'errors':[],'served':{},'downloads':[]}
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);page=b.new_page(viewport={'width':1440,'height':1080},ignore_https_errors=True,accept_downloads=True);page.on('pageerror',lambda err:e['errors'].append(str(err)))
 r=page.goto(url,wait_until='networkidle');assert r.status==200;page.wait_for_selector('body[data-ready="true"]');assert page.locator('.drawing').count()==32;assert page.locator('.drawing:visible').count()==16
 ids=page.evaluate('Array.from(document.querySelectorAll("[id]")).map(n=>n.id)');assert len(ids)==len(set(ids))
 page.screenshot(path=str(out/'gallery-desktop.png'))
 page.select_option('#direction','all');assert page.locator('.drawing:visible').count()==32
 page.select_option('#model','rpg');assert page.locator('.drawing:visible').count()==16
 page.select_option('#pose','crouch');assert page.locator('.drawing:visible').count()==2
 page.check('#guides');assert page.evaluate('Array.from(document.querySelectorAll("[data-template-guides]")).every(g=>g.style.display!=="none")')
 for model in ['human','rpg']:
  page.select_option('#model',model);page.select_option('#pose','neutral');page.select_option('#direction','right');assert page.locator('.drawing:visible').count()==1
  page.locator('.drawing:visible .art-button').click();assert page.locator('#detail').evaluate('(d)=>d.open');assert page.locator('#detail [data-template-guides]').evaluate('(g)=>getComputedStyle(g).display')!='none'
  page.screenshot(path=str(out/f'{model}-guides.png'));page.keyboard.press('Escape');assert not page.locator('#detail').evaluate('(d)=>d.open')
 page.uncheck('#guides');assert page.evaluate('Array.from(document.querySelectorAll("[data-template-guides]")).every(g=>g.style.display==="none")')
 page.select_option('#model','all');page.select_option('#pose','all');page.select_option('#direction','right')
 lib=json.loads((src/'library.json').read_text(encoding='utf-8'));paths=['index.html','gallery.js','gallery.css','library.json','human-mannequins.zip','comparison.png','comparison.svg','comparison.pdf','landmarks.json']+[v[k] for v in lib['entries'] for k in ['json','svg','png']]
 for name in paths:
  r=page.request.get(url+('' if name=='index.html' else name));assert r.status==200,(name,r.status);actual=sha(r.body());assert actual==sha((src/name).read_bytes()),name;e['served'][name]=actual
 for suffix in ['json','svg','png']:
  link=page.locator('.drawing:visible .downloads a').filter(has_text={'json':'Agent Draw JSON','svg':'SVG','png':'PNG'}[suffix]).first
  with page.expect_download() as event:link.click()
  download=event.value;dest=out/download.suggested_filename;download.save_as(dest);key=lib['entries'][0][suffix];assert sha(dest.read_bytes())==sha((src/key).read_bytes());e['downloads'].append(download.suggested_filename)
 with page.expect_download() as event:page.locator('a.bundle').click()
 event.value.save_as(out/'human-mannequins.zip');assert sha((out/'human-mannequins.zip').read_bytes())==sha((src/'human-mannequins.zip').read_bytes());e['downloads'].append(event.value.suggested_filename)
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(out/'gallery-mobile.png'));page.locator('.drawing:visible').first.scroll_into_view_if_needed();page.screenshot(path=str(out/'gallery-mobile-drawings.png'))
 # The additive gallery must leave the existing game reachable.
 r=page.request.get(url+'../game.js');assert r.status==200 and 'construction-20261015-r11' in r.text()
 assert not e['errors'];e.update({'templates':32,'servedFiles':len(paths),'filterAndGuideToggle':True,'detailKeyboardClose':True,'uniqueDOMIds':True,'phoneFit':True,'gamePreviewPreserved':True})
 b.close()
(out/'receipt.json').write_text(json.dumps(e,indent=2),encoding='utf-8',newline='\n');print(json.dumps({k:v for k,v in e.items() if k not in ['served']}))

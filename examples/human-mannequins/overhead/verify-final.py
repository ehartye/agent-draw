"""Final deployed parity and mobile text after the small heading correction."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json
root=Path(__file__).resolve().parents[1];repo=root.parents[1]
evidence=repo/'docs/quality/overhead-mannequins-evidence'
sha=lambda b:hashlib.sha256(b).hexdigest()
report={'served':{},'frozenImages':[],'errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 page=browser.new_page(viewport={'width':390,'height':844},ignore_https_errors=True)
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 for kind,folder,base in [('parent',root,'https://hal9000.taila5c443.ts.net:8468/mannequins/'),('overhead',root/'overhead','https://hal9000.taila5c443.ts.net:8468/mannequins/overhead/')]:
  receipt=json.loads((evidence/(kind+'-browser')/'receipt.json').read_text(encoding='utf-8'))
  for name in receipt['served']:
   r=page.request.get(base+('' if name=='index.html' else name));assert r.status==200,(kind,name,r.status)
   digest=sha(r.body());assert digest==sha((folder/name).read_bytes()),(kind,name)
   report['served'][kind+'/'+name]=digest
 page.goto('https://hal9000.taila5c443.ts.net:8468/mannequins/overhead/?rev=overhead-20261015-r1',wait_until='networkidle');page.wait_for_selector('body[data-ready="true"]')
 assert ' '.join(page.locator('.intro h1').text_content().split())=='A view from above.'
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(evidence/'overhead-browser/gallery-mobile-final.png'))
 assert not report['errors'];browser.close()
for args_name in ['args-keys.json','args-final.json']:
 args=json.loads((evidence/args_name).read_text(encoding='utf-8-sig'))
 for task in args['tasks']:
  for image in task['images']:
   assert sha(Path(image['path']).read_bytes())==image['sha256'],image['id']
   report['frozenImages'].append({'id':image['id'],'sha256':image['sha256']})
report.update({'servedFiles':len(report['served']),'frozenImageAssignments':len(report['frozenImages']),'mobileHeadingAndFit':True})
(evidence/'post-text-change-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['served','frozenImages']}))

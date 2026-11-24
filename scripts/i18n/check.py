from pathlib import Path
from lxml import html, etree
import json, re, hashlib, subprocess

ROOT=Path(__file__).resolve().parents[2]
PAGES=['index.html','about/allyspan-and-logo/index.html','about/our-mission/index.html','about/our-support/index.html','about/connect/index.html','resources/introduction-to-classroom-studio/index.html','resources/qr-studio/index.html','showcase/publications/index.html','showcase/how-to-publish/index.html','showcase/submit-your-work/index.html','showcase/submission-privacy/index.html']
def route(p):return '/' if p=='index.html' else '/'+p.removesuffix('index.html')
for language in ['es','zh-hans']:
 for page in PAGES:
  p=ROOT/language/page;s=p.read_text();d=html.fromstring(s)
  assert d.get('lang')==('es' if language=='es' else 'zh-Hans'),p
  assert d.xpath('//link[@rel="canonical"]/@href')==['https://www.allyspan.org/'+language+route(page)],p
  assert set(d.xpath('//link[@hreflang]/@hreflang'))=={'en','es','zh-Hans','x-default'},p
  assert d.xpath('//*[@data-language-open]'),p
  assert d.xpath('//a[contains(@class,"skip-content")]/@href')==['#main-content'],p
  assert not d.xpath('//*[@id="languages-panel"]'),p
  assert not d.xpath('//footer//a'),p
  assert not d.xpath('//nav[contains(@class,"related-resources")]'),p
  # All localized internal destinations must exist; shared resources stay at their root paths.
  for href in d.xpath('//a/@href'):
   target=href.split('#')[0].split('?')[0]
   if target.startswith('/'+language+'/'):
    assert (ROOT/target.lstrip('/')/'index.html').exists(),(p,href)
  # SVG attribute spelling must survive translation.
  if '<svg' in s:assert 'viewBox=' in s,p
  # Preserve the backend contract even when labels are translated.
  if page=='showcase/submit-your-work/index.html':
   en=html.fromstring((ROOT/page).read_text())
   assert en.xpath('//input/@name|//textarea/@name|//select/@name')==d.xpath('//input/@name|//textarea/@name|//select/@name'),p
   for select in ['article-type','topic','language','participants']:
    e=en.xpath('//select[@id="'+select+'"]')[0];x=d.xpath('//select[@id="'+select+'"]')[0]
    assert [o.get('value',o.text or '') for o in e]==[o.get('value',o.text or '') for o in x],(p,select)
  for text in d.xpath('//script[@type="application/ld+json"]/text()'):json.loads(text)
site=etree.fromstring((ROOT/'sitemap.xml').read_bytes());locs=site.xpath('//*[local-name()="loc"]/text()');assert len(locs)==len(set(locs))
for lang in ['es','zh-hans']:
 for page in PAGES:assert 'https://www.allyspan.org/'+lang+route(page) in locs
article=(ROOT/'showcase/publications/psychedelics-in-new-york-city/index.html').read_text();assert '<html lang="en"' in article
assert not (ROOT/'es/showcase/publications/psychedelics-in-new-york-city/index.html').exists()
for lang in ['en','es','zh-hans']:
 text=(ROOT/'assets/i18n'/f'{lang}.js').read_text();payload=json.loads(text.removeprefix('window.ALLYSPAN_LOCALE=').strip().removesuffix(';'))
 assert payload['language']==('zh-Hans' if lang=='zh-hans' else lang)
for path in ['assets/i18n/language.js','showcase/submit-your-work/submission.js']:
 subprocess.run(['node','--check',str(ROOT/path)],check=True)
assert "split(t('.'))" not in (ROOT/'showcase/submit-your-work/submission.js').read_text()
files=[p for p in ROOT.rglob('*') if p.is_file() and ('es' in p.parts or 'zh-hans' in p.parts or p.suffix=='.html')]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
subprocess.run(['python',str(ROOT/'scripts/i18n/build.py')],check=True)
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files},'Generator is not idempotent'
print('PASS: 22 localized pages, links, canonical/hreflang, sitemap, SVG, structured data, form contracts, JavaScript syntax and repeatable build.')

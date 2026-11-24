"""Build static Spanish and Simplified Chinese pages without reserializing SVG/HTML.
Run from any directory: python scripts/i18n/build.py
English files remain the source of truth; translations are keyed to exact source text.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import json, re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
ORIGIN = 'https://www.allyspan.org'
PAGES = ['index.html','about/allyspan-and-logo/index.html','about/our-mission/index.html',
 'about/our-support/index.html','about/connect/index.html',
 'resources/introduction-to-classroom-studio/index.html','resources/qr-studio/index.html',
 'showcase/publications/index.html','showcase/how-to-publish/index.html',
 'showcase/submit-your-work/index.html','showcase/submission-privacy/index.html']
ARTICLE = 'showcase/publications/psychedelics-in-new-york-city/index.html'
def route(p): return '/' if p=='index.html' else '/'+p.removesuffix('index.html')
ROUTES = [route(p) for p in PAGES]
def localized(lang, path): return path if lang=='en' else '/'+lang.lower()+path
KEYS=json.loads((HERE/'catalog.json').read_text())
DICTS={'en':{},'es':{},'zh-Hans':{}}
for row in (HERE/'translations.tsv').read_text().splitlines():
 i,es,zh=row.split('\t');key=KEYS[int(i)];DICTS['es'][key]=es;DICTS['zh-Hans'][key]=zh
assert len(DICTS['es'])==len(KEYS), 'Incomplete translation catalogue'
for row in (HERE/'extras.tsv').read_text().splitlines():
 key,es,zh=row.split('\t');DICTS['es'][key]=es;DICTS['zh-Hans'][key]=zh
META={
 'index.html':('Explora la misión de Allyspan, Classroom Studio multilingüe, el generador QR gratis y nuestras publicaciones comunitarias.','了解 Allyspan 的社区使命、多语言 Classroom Studio、免费二维码生成器与社区议题出版物。'),
 'about/allyspan-and-logo/index.html':('Conoce el significado del nombre Allyspan, su árbol y sol dorados, y nuestro compromiso con la dignidad y el apoyo.','了解 Allyspan 名称、金色树与太阳徽标的寓意，以及我们对尊严、联结与持续支持的承诺。'),
 'about/our-mission/index.html':('Conoce la misión de Allyspan: dignidad, lucha contra la opresión, recursos comunitarios y aprendizaje accesible.','了解 Allyspan 如何通过社区资源导航、无障碍学习与公共讨论，践行尊严、反压迫与公平可及。'),
 'about/our-support/index.html':('Explora Classroom Studio, nuestro programa de Orientación Comunitaria en desarrollo y oportunidades de colaboración.','探索已上线的 Classroom Studio、开发中的社区资源导航项目，以及社区合作机会。'),
 'about/connect/index.html':('Contacta con Allyspan sobre preguntas, colaboraciones e ideas comunitarias, o solicita ayuda con Classroom Studio.','联系 Allyspan，咨询一般问题、合作与社区想法，或获取 Classroom Studio 使用支持。'),
 'resources/introduction-to-classroom-studio/index.html':('Aprende a crear presentaciones multilingües y compartir clases por QR. Una guía práctica de Allyspan Classroom Studio.','学习制作多语言演示文稿、通过二维码分享课程，并帮助学生跟随学习。Allyspan Classroom Studio 实用指南。'),
 'resources/qr-studio/index.html':('Generador de códigos QR gratis, sin registro ni seguimiento. Crea y descarga códigos imprimibles para clases y recursos.','免费二维码生成器，无需注册、不追踪扫描。在浏览器中创建并下载适合课堂链接、资料与日常分享的可打印二维码。'),
 'showcase/publications/index.html':('Lee The Allyspan Journal: investigación, políticas, experiencias y perspectivas de personas de todos los contextos.','阅读 The Allyspan Journal：研究、政策，以及不同背景人群的亲身经历与观点。探索社区议题出版物。'),
 'showcase/how-to-publish/index.html':('Guía de The Allyspan Journal: formatos, evidencia, ética, revisión editorial y derechos. Todas las personas pueden contribuir.','浏览 The Allyspan Journal 投稿指南：文章形式、证据、伦理、编辑审阅与发表权利。欢迎不同背景的人投稿。'),
 'showcase/submit-your-work/index.html':('Envía tu trabajo de forma privada a The Allyspan Journal. Revisa manuscrito, autoría y declaraciones antes de enviarlo.','向 The Allyspan Journal 私密投稿。发送前检查稿件、作者信息与声明。作品不会自动发表。'),
 'showcase/submission-privacy/index.html':('Cómo The Allyspan Journal procesa los manuscritos y los datos de autoría, y cómo solicitar retirada o eliminación.','了解 The Allyspan Journal 如何处理稿件与作者信息，以及如何申请撤稿或删除。')}

class Translator(HTMLParser):
 def __init__(self, source, language, page):
  super().__init__(convert_charrefs=True);self.source=source;self.language=language;self.page=page
  self.dictionary=DICTS[language];self.stack=[];self.edits=[]
  self.lines=[0]+[m.end() for m in re.finditer('\n',source)]
 def source_offset(self):
  line,col=self.getpos();return self.lines[line-1]+col
 def handle_starttag(self, tag, attrs):
  raw=self.get_starttag_text();new=raw;a=dict(attrs)
  if self.language!='en':
   for name in ['alt','aria-label','placeholder','title']:
    value=a.get(name)
    if value and value.strip() in self.dictionary:
     new=re.sub(r'(?<![\w-])'+name+r'=("[^"]*"|\x27[^\x27]*\x27)',name+'="'+escape(self.dictionary[value.strip()],quote=True)+'"',new,count=1)
   if tag=='html':new=re.sub(r'lang="[^"]*"','lang="'+self.language+'"',new)
   if tag=='option' and 'value' not in a:
    end=self.source.find('</option',self.source_offset()+len(raw));value=unescape(self.source[self.source_offset()+len(raw):end]).strip()
    new=new[:-1]+' value="'+escape(value,quote=True)+'">'
   if tag=='a' and a.get('href'):
    href=a['href'];u=urlsplit(href)
    if u.path and (not u.netloc or u.netloc in ['allyspan.org','www.allyspan.org']):
     p=u.path or '/'
     if p=='/home/':p='/'
     if p in ROUTES:
      target=localized(self.language,p)+('?' +u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
      new=new.replace('href="'+escape(href,quote=True)+'"','href="'+escape(target,quote=True)+'"')
   if tag=='meta' and a.get('content'):
    value=a['content'];translated=None
    if a.get('name')=='description' or a.get('property')=='og:description':translated=META[self.page][0 if self.language=='es' else 1]
    elif a.get('property')=='og:url':translated=ORIGIN+localized(self.language,route(self.page))
    elif value in self.dictionary:translated=self.dictionary[value]
    if translated is not None:new=new.replace('content="'+escape(value,quote=True)+'"','content="'+escape(translated,quote=True)+'"')
   if tag=='link' and a.get('rel')=='canonical':new=re.sub(r'href="[^"]*"','href="'+ORIGIN+localized(self.language,route(self.page))+'"',new)
  if new!=raw:self.edits.append((self.source_offset(),self.source_offset()+len(raw),new))
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(tag)
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if self.stack and self.stack[-1]==tag:self.stack.pop()
 def handle_endtag(self,tag):
  if tag in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
 def handle_data(self,data):
  if self.language=='en' or any(x in self.stack for x in ['script','style','svg']):return
  start=self.source_offset();end=self.source.find('<',start)
  if end<0:end=len(self.source)
  raw=self.source[start:end];key=unescape(raw).strip()
  if key in self.dictionary:
   leading=re.match(r'\s*',raw)[0];trailing=re.search(r'\s*$',raw)[0]
   self.edits.append((start,end,leading+escape(self.dictionary[key],quote=False)+trailing))
 def result(self):
  self.feed(self.source);out=self.source
  for start,end,replacement in sorted(self.edits,reverse=True):out=out[:start]+replacement+out[end:]
  return out

def prepare(source):
 if '/assets/navigation.js' not in source:
  source=source.replace('</head>','<script defer src="/assets/navigation.js?v=1"></script></head>')
 # Reuse the site's approved emblem instead of duplicating its large inline PNG per language.
 source=re.sub(r'src="data:image/png;base64,[A-Za-z0-9+/=\s]+"','src="/assets/emblem.png"',source)
 source=re.sub(r'<link[^>]*data-site-language[^>]*>','',source)
 source=re.sub(r'<(?:link|script)[^>]*data-language-asset[^>]*>(?:</script>)?','',source)
 source=re.sub(r'<section\b[^>]*id="languages-panel"[\s\S]*?</section>','',source)
 source=source.replace('data-panel="languages-panel"','data-language-open').replace('aria-controls="languages-panel"','').replace('aria-expanded="false" data-language-open','data-language-open')
 # The QR tool has its own compact header; give it the same globe entry point.
 if 'data-language-open' not in source:
  button='<button type="button" class="language-launch" data-language-open aria-label="Change language"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg></button>'
  source=source.replace('</header>',button+'</header>',1)
 return source

search=[]
for page in PAGES:
 s=(ROOT/page).read_text();title=unescape(re.search(r'<title>(.*?)</title>',s,re.S)[1]).split(' | ')[0]
 search.append({'title':title,'text':title,'url':route(page)})
for language in ['en','es','zh-Hans']:
 dictionary=DICTS[language]
 payload={'language':language,'routes':ROUTES,'messages':dictionary,
  'articleNotes':{k:DICTS[k]['This article is currently available in English. Translations will be added after review.'] for k in ['es','zh-Hans']},
  'search':[{'title':dictionary.get(x['title'],x['title']),'text':dictionary.get(x['text'],x['text']),'url':localized(language,x['url'])} for x in search]}
 (ROOT/'assets/i18n'/f'{language.lower()}.js').write_text('window.ALLYSPAN_LOCALE='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
 for page in PAGES:
  source=prepare((ROOT/page).read_text());out=Translator(source,language,page).result()
  links=''.join('<link data-site-language rel="alternate" hreflang="'+lang+'" href="'+ORIGIN+localized(lang,route(page))+'">' for lang in ['en','es','zh-Hans'])
  links+='<link data-site-language rel="alternate" hreflang="x-default" href="'+ORIGIN+route(page)+'">'
  assets='<link data-language-asset rel="stylesheet" href="/assets/i18n/language.css?v=2"><script data-language-asset src="/assets/i18n/'+language.lower()+'.js?v=2"></script><script data-language-asset src="/assets/i18n/language.js?v=2"></script>'
  out=out.replace('</head>',links+assets+'</head>')
  if language!='en':
   if page=='resources/qr-studio/index.html':
    heading='Crea tu <em>código <span class="title-gold">QR</span></em>' if language=='es' else '创建你的 <em><span class="title-gold">二维码</span></em>'
    out=re.sub(r'<h1 id="page-title">[\s\S]*?</h1>','<h1 id="page-title">'+heading+'</h1>',out,count=1)
   if page=='showcase/submit-your-work/index.html':
    out=out.replace('<div id="journal-security-check">','<p class="language-context-note">'+dictionary['Review and receipt emails currently use English.']+'</p><div id="journal-security-check">',1)
   # Keep the full research article in English; do not label an unreviewed translation as research.
   articleURL='/showcase/publications/psychedelics-in-new-york-city/'
   out=re.sub(r'(<a\b[^>]*href="'+re.escape(articleURL)+r'"[^>]*>)([\s\S]*?)(</a>)',lambda m:m[1]+m[2]+'<span class="article-language-badge">'+dictionary['English article']+'</span>'+m[3],out)
   if page in ['showcase/how-to-publish/index.html','showcase/submission-privacy/index.html']:
    note='<p class="language-context-note">'+dictionary['English is the original version. If wording differs, please consult the English text.']+' <a href="'+route(page)+'?lang=en" lang="en">English</a></p>'
    out=out.replace('<footer',note+'<footer',1)
  destination=ROOT/page if language=='en' else ROOT/language.lower()/page
  destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(out)

# Keep the existing mirrored home entry consistent without adding a duplicate indexed locale URL.
(ROOT/'home/index.html').write_text((ROOT/'index.html').read_text())
article=prepare((ROOT/ARTICLE).read_text())
assets='<link data-language-asset rel="stylesheet" href="/assets/i18n/language.css?v=2"><script data-language-asset src="/assets/i18n/en.js?v=2"></script><script data-language-asset src="/assets/i18n/language.js?v=2"></script>'
article=article.replace('</head>',assets+'</head>');(ROOT/ARTICLE).write_text(article)
old=(ROOT/'sitemap.xml').read_text()
for language in ['es','zh-Hans']:
 for page in PAGES:
  url=ORIGIN+localized(language,route(page))
  if '<loc>'+url+'</loc>' not in old:old=old.replace('</urlset>','  <url><loc>'+url+'</loc></url>\n</urlset>')
(ROOT/'sitemap.xml').write_text(old)
print('Built 22 localized pages, updated 13 English entry pages, language assets and sitemap.')

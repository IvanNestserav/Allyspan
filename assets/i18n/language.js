(()=>{'use strict';
const config=window.ALLYSPAN_LOCALE||{language:'en',routes:[]},dict=config.messages||{},locale=config.language||'en';
const t=(key,vars={})=>{let text=Object.prototype.hasOwnProperty.call(dict,key)?dict[key]:key;for(const [name,value]of Object.entries(vars))text=text.split('{'+name+'}').join(String(value));return text};
window.AllyspanI18n=Object.freeze({language:locale,t});
const basePath=pathname=>pathname.replace(/^\/(?:es|zh-hans)(?=\/|$)/,'').replace(/\/index\.html$/,'/')||'/';
const pathFor=(language,path)=>language==='en'?path:'/'+language.toLowerCase()+path;
let saved='en';try{saved=localStorage.getItem('allyspan-language')||'en'}catch{}
if(!['en','es','zh-Hans'].includes(saved))saved='en';
const path=basePath(location.pathname),known=config.routes.includes(path),isArticle=path==='/showcase/publications/psychedelics-in-new-york-city/';
function init(){
 // Explicit locale URLs always win. Remembered preference is applied to English entry pages only.
 if(locale==='en'&&known&&saved!=='en'&&!location.search){location.replace(pathFor(saved,path)+location.hash);return}
 const dialog=document.createElement('dialog');dialog.className='language-dialog';dialog.id='language-dialog';dialog.setAttribute('aria-labelledby','language-dialog-title');
 const head=document.createElement('header'),title=document.createElement('h2');title.id='language-dialog-title';title.textContent=t('Change language');
 const close=document.createElement('button');close.type='button';close.className='language-close';close.textContent='×';close.setAttribute('aria-label',t('Close'));head.append(title,close);
 const label=document.createElement('label');label.htmlFor='website-language';label.textContent=t('Language');const select=document.createElement('select');select.id='website-language';
 for(const [value,name]of [['en','English'],['es','Español'],['zh-Hans','简体中文']]){const option=document.createElement('option');option.value=value;option.textContent=name;option.lang=value;select.append(option)}
 const actions=document.createElement('div');actions.className='language-actions';const cancel=document.createElement('button'),confirm=document.createElement('button');for(const b of [cancel,confirm]){b.type='button';b.className='language-action'}cancel.textContent=t('Cancel');confirm.textContent=t('Confirm');actions.append(cancel,confirm);dialog.append(head,label,select,actions);document.body.append(dialog);
 let opener=null;const launchers=[...document.querySelectorAll('[data-language-open]')];
 for(const button of launchers){button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','language-dialog');button.setAttribute('aria-label',t('Change language'));button.addEventListener('click',()=>{opener=button;select.value=isArticle?saved:locale;dialog.showModal();select.focus()})}
 for(const b of [close,cancel])b.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>opener?.focus());
 confirm.addEventListener('click',()=>{const selected=select.value;const form=document.getElementById('submission-form');const dirty=form&&!form.hidden&&[...form.querySelectorAll('input:not([type=hidden]),textarea')].some(x=>x.type==='file'?x.files.length:x.type==='checkbox'?x.checked:!!x.value.trim());if(selected!==locale&&dirty&&!window.confirm(t('Changing language will clear the unfinished form. Continue?')))return;
  try{localStorage.setItem('allyspan-language',selected)}catch{}saved=selected;dialog.close();if(isArticle){updateArticleNotice();return}const destination=pathFor(selected,known?path:'/');if(destination!==location.pathname)location.assign(destination+location.search+location.hash);
 });
 function updateArticleNotice(){if(!isArticle)return;document.getElementById('article-language-note')?.remove();for(const a of document.querySelectorAll('a[href^="/"]')){const target=basePath(a.getAttribute('href').split(/[?#]/)[0]);if(config.routes.includes(target))a.href=pathFor(saved,target)}if(saved==='en')return;const p=document.createElement('p');p.id='article-language-note';p.className='article-language-note';p.lang=saved;p.textContent=config.articleNotes?.[saved]||t('This article is currently available in English. Translations will be added after review.');const main=document.querySelector('main');main?.prepend(p)}
 updateArticleNotice();
 // Translate generated interface labels only. User-entered manuscript text is never translated or stored.
 function translate(node){if(locale==='en')return;if(node.nodeType===3){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,svg,[data-no-translate],#review-summary dd,#preview-content dd,.visual-detail h4,.coauthor input'))return;const text=node.nodeValue,key=text.trim();if(Object.prototype.hasOwnProperty.call(dict,key)&&dict[key]!==key){node.nodeValue=text.replace(key,dict[key])}}else if(node.nodeType===1){for(const child of [...node.childNodes])translate(child)}}
 const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')translate(record.target);else for(const node of record.addedNodes)translate(node)}});observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 const search=document.querySelector('.search-form input');search?.addEventListener('input',()=>{const query=search.value.trim().toLocaleLowerCase();if(!query)return;const found=(config.search||[]).filter(x=>(x.title+' '+x.text).toLocaleLowerCase().includes(query));const list=document.querySelector('.search-results');if(!list)return;list.replaceChildren();for(const item of found){const li=document.createElement('li'),a=document.createElement('a');a.textContent=item.title;a.href=item.url;li.append(a);list.append(li)}if(!found.length){const li=document.createElement('li');li.textContent=t('No matching pages found');list.append(li)}});
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||event.defaultPrevented)return;const url=new URL(a.href,location.href);if(!['allyspan.org','www.allyspan.org'].includes(url.hostname)||url.searchParams.get('lang')==='en')return;const target=basePath(url.pathname);if(config.routes.includes(target)&&locale!=='en'){url.pathname=pathFor(locale,target);a.href=url.href}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

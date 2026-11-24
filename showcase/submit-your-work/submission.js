(()=>{'use strict';
const form=document.getElementById('submission-form'),steps=[...form.querySelectorAll('.form-step')],markers=[...form.querySelectorAll('.steps li')],error=document.getElementById('form-error');
const t=window.AllyspanI18n?.t||((key,vars={})=>key.replace(/\{(\w+)\}/g,(_,name)=>vars[name]??''));
const ranges=[[2500,5000],[2000,4000],[1500,3000],[1200,2500],[800,1500],[700,1200],[600,1000],[300,600]];
const el=id=>document.getElementById(id),words=value=>(value.trim().match(/\S+/g)||[]).length;
let current=0,authorSequence=0;
form.addEventListener('submit',e=>e.preventDefault());
function show(n){current=n;steps.forEach((s,i)=>s.hidden=i!==n);markers.forEach((m,i)=>i===n?m.setAttribute('aria-current','step'):m.removeAttribute('aria-current'));error.hidden=true;if(n===2)summary(el('review-summary'),false);steps[n].querySelector('h3').focus({preventScroll:true});const top=scrollY+form.getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().height-24;window.scrollTo({top:Math.max(0,top),behavior:'instant'})}
function count(id,min,max){const input=el(id),countNode=el(id+'-count');const update=()=>{const n=words(input.value);if(countNode)countNode.textContent=t('{n} words',{n});input.setCustomValidity(n>=min&&n<=max?'':t('Please use {min}-{max} words.',{min,max}))};input.addEventListener('input',update);update()}
count('summary',100,150);count('biography',50,80);
el('article-type').addEventListener('change',()=>{const range=ranges[el('article-type').selectedIndex-1],input=el('word-count');if(range){input.min=range[0];input.max=range[1];el('word-count-help').textContent=t('{min}-{max} words, following the contributor guide.',{min:range[0].toLocaleString(),max:range[1].toLocaleString()})}});
el('keywords').addEventListener('input',()=>{const v=[...new Set(el('keywords').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))];el('keywords').setCustomValidity(v.length>=4&&v.length<=6?'':t('Enter 4-6 different keywords, separated by commas.'))});
function fileCheck(id,extensions){el(id).addEventListener('change',()=>{const files=[...el(id).files];el(id).setCustomValidity(files.every(f=>extensions.includes(f.name.split('.').pop().toLowerCase()))?'':t('Choose a supported file format.'))})}
fileCheck('manuscript',['docx','doc','pages','txt','rtf','odt']);fileCheck('pdf',['pdf']);fileCheck('visuals',['png','jpg','jpeg']);
function toggle(select,box,required){el(select).addEventListener('change',()=>{const on=el(select).value===(select==='participants'?'Yes':'Other');el(box).hidden=!on;el(box).querySelectorAll('input,textarea').forEach(input=>{input.required=on&&required;const label=input.labels[0];if(label)label.textContent=label.textContent.replace(t(' (optional)'),'').replace(' *','')+(on&&required?' *':t(' (optional)'))})})}
toggle('language','language-extra',true);toggle('participants','ethics-extra',true);
function addField(parent,id,label,tag='textarea',required=true){const div=document.createElement('div');div.className='field';const l=document.createElement('label');l.htmlFor=id;l.textContent=label+(required?' *':t(' (optional)'));const input=document.createElement(tag);input.id=id;input.name=id;input.required=required;if(tag==='textarea')input.rows=3;div.append(l,input);parent.append(div);return input}
el('visuals').addEventListener('change',()=>{const container=el('visual-details');container.replaceChildren();[...el('visuals').files].forEach((file,i)=>{const part=document.createElement('section');part.className='visual-detail';const h=document.createElement('h4');h.textContent=file.name;part.append(h);addField(part,'visual-caption-'+i,t('Caption'));addField(part,'visual-alt-'+i,t('Alt text'));addField(part,'visual-source-'+i,t('Source and permission details'));container.append(part)})});
el('add-coauthor').addEventListener('click',()=>{const id=++authorSequence,part=document.createElement('section');part.className='coauthor';const h=document.createElement('h4');h.textContent=t('Coauthor');part.append(h);const name=addField(part,'coauthor-name-'+id,t('Publication name'),'input');addField(part,'coauthor-role-'+id,t('Role or affiliation'),'input',false);const bio=addField(part,'coauthor-bio-'+id,t('Short biography (50-80 words)'));bio.addEventListener('input',()=>{const n=words(bio.value);bio.setCustomValidity(n>=50&&n<=80?'':t('Please use 50-80 words.'))});bio.setCustomValidity(t('Please use 50-80 words.'));addField(part,'coauthor-contribution-'+id,t('Contribution'));const remove=document.createElement('button');remove.type='button';remove.textContent=t('Remove coauthor');remove.addEventListener('click',()=>{part.remove();el('add-coauthor').focus()});part.append(remove);el('coauthors').append(part);name.focus()});
function validate(){const invalid=[...steps[current].querySelectorAll('input,textarea,select')].find(x=>!x.closest('[hidden]')&&!x.checkValidity());if(invalid){error.textContent=t('Please check the highlighted field before continuing.');error.hidden=false;invalid.reportValidity();return false}return true}
form.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(validate())show(Number(b.dataset.next))}));form.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.back))));
function summary(container,all){container.replaceChildren();const dl=document.createElement('dl');const rows=[[t('Article title'),el('title').value],[t('Article type'),el('article-type').value],[t('Main topic'),el('topic').value],[t('Word count'),el('word-count').value],[t('Summary'),el('summary').value],[t('Keywords'),el('keywords').value],[t('Manuscript'),el('manuscript').files[0]?.name||t('None')],[t('Companion PDF'),el('pdf').files[0]?.name||t('None')],[t('Supporting images'),[...el('visuals').files].map(f=>f.name).join(', ')||t('None')],[t('Language'),el('language').value],[t('Translation notes'),el('language-notes').value],[t('Publication name'),el('author-name').value],[t('Private email'),el('email').value],[t('Role or affiliation'),el('affiliation').value],['ORCID',el('orcid').value],[t('Biography'),el('biography').value],[t('Contribution'),el('contribution').value],[t('Safety request'),el('safety').value]];form.querySelectorAll('.coauthor input,.coauthor textarea,.visual-detail textarea').forEach(x=>rows.push([x.labels[0].textContent.replace(' *',''),x.value]));if(all){['funding','ai','participants','ethics','permissions'].forEach(id=>{if(!el(id).closest('[hidden]'))rows.push([el(id).labels[0].textContent.replace(' *',''),el(id).value])});rows.push([t('Declarations'),t('All four declarations confirmed.')])}rows.filter(([,v])=>v).forEach(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=[t('Article type'),t('Main topic'),t('Language')].includes(k)?t(v):v;dl.append(dt,dd)});container.append(dl)}
el('preview-submission').addEventListener('click',()=>{if(validate()){summary(el('preview-content'),true);el('preview-dialog').showModal()}});el('close-preview').addEventListener('click',()=>el('preview-dialog').close());
// Live delivery is explicitly disabled until the Worker and receipt flow pass real delivery checks.
const liveConfig=window.ALLYSPAN_JOURNAL||{},sendButton=el('send-submission');
let apiBase='',securityWidget=null,securityToken='',sending=false,submissionId=null;
const MAX_ATTACHMENT_BYTES=10*1024*1024;
function totalBytes(){return ['manuscript','pdf','visuals'].reduce((sum,id)=>sum+[...el(id).files].reduce((n,f)=>n+f.size,0),0)}
function fileSizeCheck(){const file=el('manuscript').files[0];el('manuscript').setCustomValidity(totalBytes()>MAX_ATTACHMENT_BYTES?t('Attachments must total no more than 10 MB.'):file&&!['docx','doc','pages','txt','rtf','odt'].includes(file.name.split('.').pop().toLowerCase())?t('Choose a supported file format.'):'')}
['manuscript','pdf','visuals'].forEach(id=>el(id).addEventListener('change',fileSizeCheck));
function problem(message){error.textContent=t(message);error.hidden=false;error.focus()}
function refreshSend(){sendButton.disabled=sending||!apiBase||!securityToken;}
function resetSecurity(){securityToken='';if(securityWidget!==null&&window.turnstile)window.turnstile.reset(securityWidget);refreshSend()}
async function bootLive(){
 if(liveConfig.enabled!==true||!liveConfig.apiBase)return;
 try{
  const candidate=new URL(liveConfig.apiBase);if(candidate.protocol!=='https:'||candidate.search||candidate.hash||candidate.pathname!=='/'||candidate.hostname==='www.allyspan.org')return;
  const res=await fetch(candidate.origin+'/config',{cache:'no-store',credentials:'omit'});if(!res.ok)throw Error();const cfg=await res.json();if(!cfg.open||!cfg.siteKey||cfg.maxAttachmentBytes!==MAX_ATTACHMENT_BYTES){problem(t('Submissions are temporarily unavailable. Please try again later.'));return;}
  apiBase=candidate.origin;
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  script.addEventListener('load',()=>{
   securityWidget=window.turnstile.render('#journal-security-check',{sitekey:cfg.siteKey,action:'journal-submit',appearance:'interaction-only',language:window.AllyspanI18n?.language==='zh-Hans'?'zh-cn':window.AllyspanI18n?.language||'en',callback:token=>{securityToken=token;refreshSend()},'expired-callback':()=>{securityToken='';refreshSend()},'error-callback':()=>{securityToken='';refreshSend()}});
   const notice=document.querySelector('.preview-notice');notice.querySelector('strong').textContent=t('Submissions are open');notice.querySelector('p').textContent=t('Send your manuscript privately for editorial review. Nothing is published automatically.');
   document.querySelector('.send-note').textContent=t('Your manuscript will be sent privately to the Journal. We will email a receipt after delivery.');
   el('send-status').textContent=t('Questions or withdrawal requests: journal@allyspan.org');
   document.querySelector('.form-heading p:last-child').textContent=t('Required fields are marked *. Do not include confidential participant records.');
   el('preview-dialog').querySelector('p').textContent=t('Review your details before sending. Nothing is published automatically.');
  });
  script.addEventListener('error',()=>{apiBase='';refreshSend();problem(t('The security check could not load. Please try again later.'));});document.head.append(script);
 }catch{problem(t('The submission service could not be reached. Please try again later.'));}
}
function buildPayload(){const data=new FormData(form);form.querySelectorAll('#language-extra[hidden] input,#language-extra[hidden] textarea,#ethics-extra[hidden] textarea').forEach(input=>data.delete(input.name));data.set('submission-id',submissionId);data.set('cf-turnstile-response',securityToken);return data;}
sendButton.addEventListener('click',async()=>{
 if(sending||!apiBase||!securityToken)return;
 for(let i=0;i<steps.length;i++){const invalid=[...steps[i].querySelectorAll('input,textarea,select')].find(input=>!input.closest('#language-extra[hidden],#ethics-extra[hidden]')&&!input.checkValidity());if(invalid){show(i);invalid.reportValidity();return;}}
 if(totalBytes()>MAX_ATTACHMENT_BYTES){problem(t('Attachments must total no more than 10 MB.'));return;}
 submissionId??=crypto.randomUUID();sending=true;refreshSend();sendButton.textContent=t('Sending...');error.hidden=true;
 try{
  const res=await fetch(apiBase+'/submit',{method:'POST',body:buildPayload(),credentials:'omit',signal:AbortSignal.timeout(65000)});let result;try{result=await res.json()}catch{throw Error(t('We could not confirm delivery. Keep this page open and try again.'));}
  if(!res.ok||result.received!==true||typeof result.reference!=='string')throw Error(result.error||t('We could not confirm delivery. Please try again.'));
  form.hidden=true;const section=document.createElement('section');section.className='submission-confirmation';section.tabIndex=-1;const h=document.createElement('h2');h.textContent=t('Thank you for your submission');const text=document.createElement('p');text.textContent=t('Your work has been received for editorial review. Nothing has been published.');const ref=document.createElement('p');ref.textContent=t('Your reference: ')+result.reference;const receipt=document.createElement('p');receipt.textContent=result.receiptSent?t('A receipt email has been requested. If it does not arrive, check spam or contact journal@allyspan.org with your reference.'):result.message;const timing=document.createElement('p');timing.textContent=t('We aim to give an initial response within 15 business days of a complete submission.');section.append(h,text,ref,receipt,timing);form.after(section);section.focus();section.scrollIntoView({block:'center'});
 }catch(e){problem(e.message||t('We could not confirm delivery. Keep the form open and try again.'));resetSecurity();}
 finally{sending=false;sendButton.textContent=t('Send for editorial review');refreshSend()}
});
bootLive();

})();


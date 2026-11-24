// No manuscript storage or request-body logging. Files are delivered as email attachments.
const ORIGINS = new Set(['https://www.allyspan.org', 'https://allyspan.org']);
const MAX_FILES_BYTES = 10 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_FILES_BYTES + 512 * 1024;
const TYPES = new Map([
 ['Research Article',[2500,5000]],['Literature or Evidence Review',[2000,4000]],
 ['Policy Review or Policy Analysis',[1500,3000]],['Practice and Community Analysis',[1200,2500]],
 ['Student Perspectives / Community Voices',[800,1500]],['Book or Resource Review',[700,1200]],
 ['Commentary',[600,1000]],['Letter responding to published work',[300,600]]
]);
const TOPICS = new Set(['Community life','Systems and services','Justice and rights']);
const MIME = {docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',doc:'application/msword',pages:'application/vnd.apple.pages',txt:'text/plain',rtf:'application/rtf',odt:'application/vnd.oasis.opendocument.text',pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};
const words = s => (s.trim().match(/\S+/g)||[]).length;
class Invalid extends Error {}
function ready(env){return env.SUBMISSIONS_OPEN==='true' && Boolean(env.RESEND_API_KEY && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY && env.JOURNAL_RATE_LIMITER);}
function response(origin,data,status=200){const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};if(ORIGINS.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});return new Response(status===204?null:JSON.stringify(data),{status,headers});}
async function limitedBody(request){
 const declared=Number(request.headers.get('Content-Length'));
 if(Number.isFinite(declared)&&declared>MAX_BODY_BYTES)throw new Invalid('Attachments must total no more than 10 MB.');
 if(!request.body)throw new Invalid('The submission is empty.');
 const reader=request.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){await reader.cancel();throw new Invalid('Attachments must total no more than 10 MB.');}chunks.push(value);}}finally{reader.releaseLock();}
 return new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:new Blob(chunks)}).formData();
}
function text(form,key,max=3000,required=true){const value=form.get(key);if(value!==null&&typeof value!=='string')throw new Invalid('A text field contains an invalid file.');const s=(value||'').trim();if((required&&!s)||s.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s))throw new Invalid('Please check '+key+'.');return s;}
function wordRange(s,min,max,label){if(words(s)<min||words(s)>max)throw new Invalid(label+' must contain '+min+'-'+max+' words.');}
export async function validate(form){
 for(const [key] of form){if(form.getAll(key).length!==1 && key!=='visuals')throw new Invalid('Repeated fields are not supported.');}
 const title=text(form,'title',300),type=text(form,'article-type',100),topic=text(form,'topic',100),count=text(form,'word-count',8),range=TYPES.get(type);
 if(!range||!TOPICS.has(topic)||!/^\d+$/.test(count)||Number(count)<range[0]||Number(count)>range[1])throw new Invalid('Check the article type and manuscript word count.');
 const summary=text(form,'summary',15000);wordRange(summary,100,150,'The summary');
 const keywords=text(form,'keywords',1000),ks=[...new Set(keywords.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean))];if(ks.length<4||ks.length>6)throw new Invalid('Include 4-6 different keywords.');
 const name=text(form,'author-name',160),email=text(form,'email',254).toLowerCase();if(!/^[^\s<>(),;:"\\]+@[^\s<>(),;:"\\]+\.[^\s<>(),;:"\\]+$/.test(email))throw new Invalid('Enter one valid corresponding author email.');
 const biography=text(form,'biography',10000);wordRange(biography,50,80,'The biography');
 const language=text(form,'language',20);if(!['English','Other'].includes(language))throw new Invalid('Choose the manuscript language.');
 const details={title,'article-type':type,topic,'word-count':count,summary,keywords,language,'language-notes':text(form,'language-notes',3000,language==='Other'),'author-name':name,email,affiliation:text(form,'affiliation',300,false),orcid:text(form,'orcid',200,false),biography,contribution:text(form,'contribution',3000),safety:text(form,'safety',3000,false),funding:text(form,'funding',5000),ai:text(form,'ai',5000),participants:text(form,'participants',10),permissions:text(form,'permissions',5000)};
 if(!['Yes','No'].includes(details.participants))throw new Invalid('Complete the research ethics question.');
 if(details.participants==='Yes')details.ethics=text(form,'ethics',6000);
 for(let i=0;i<4;i++)if(text(form,'declaration-'+i,10)!=='on')throw new Invalid('Confirm all four author declarations.');
 const coauthorIds=new Set([...form.keys()].filter(k=>/^coauthor-(name|role|bio|contribution)-\d+$/.test(k)).map(k=>k.split('-').at(-1)));
 if(coauthorIds.size>20)throw new Invalid('For more than 20 coauthors, contact journal@allyspan.org.');
 for(const id of coauthorIds){const bio=text(form,'coauthor-bio-'+id,10000);wordRange(bio,50,80,'Each coauthor biography');for(const key of ['name','role','bio','contribution'])details['coauthor-'+key+'-'+id]=text(form,'coauthor-'+key+'-'+id,key==='bio'?10000:3000,key!=='role');}
 const rawFiles=[];
 const collect=(key,allowed,required=false,index=0)=>{const list=form.getAll(key).filter(f=>typeof f!=='string'&&f.name);if(required&&list.length!==1)throw new Invalid('Attach one editable manuscript.');if(key!=='visuals'&&list.length>1)throw new Invalid('Attach only one '+key+' file.');for(const file of list){const extension=file.name.split('.').pop().toLowerCase();if(!file.size||!allowed.includes(extension)||file.name.length>240)throw new Invalid('Unsupported or empty attachment.');rawFiles.push({file,extension,key,index:index++});}};
 collect('manuscript',['docx','doc','pages','txt','rtf','odt'],true);collect('pdf',['pdf']);collect('visuals',['png','jpg','jpeg']);
 if(rawFiles.filter(f=>f.key==='visuals').length>20)throw new Invalid('Use no more than 20 supporting images.');
 if(rawFiles.reduce((sum,f)=>sum+f.file.size,0)>MAX_FILES_BYTES)throw new Invalid('Attachments must total no more than 10 MB.');
 const attachments=[];
 for(const {file,extension,key,index} of rawFiles){
  const bytes=new Uint8Array(await file.arrayBuffer());
  const starts=(sig)=>sig.every((v,i)=>bytes[i]===v);
  const signature=extension==='pdf'?starts([37,80,68,70,45]):extension==='png'?starts([137,80,78,71,13,10,26,10]):['jpg','jpeg'].includes(extension)?starts([255,216,255]):['docx','pages','odt'].includes(extension)?starts([80,75]):extension==='doc'?starts([208,207,17,224,161,177,26,225]):extension==='rtf'?new TextDecoder().decode(bytes.slice(0,5))==='{\\rtf':true;
  if(!signature)throw new Invalid('An attachment does not match its file format.');
  if(extension==='txt'){try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(bytes.includes(0))throw Error();}catch{throw new Invalid('TXT manuscripts must be UTF-8 text.');}}
  if(key==='visuals')for(const sub of ['caption','alt','source'])details['visual-'+sub+'-'+index]=text(form,'visual-'+sub+'-'+index,5000);
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  attachments.push({filename:String(attachments.length+1).padStart(2,'0')+'-'+file.name.replace(/[^a-zA-Z0-9._ -]/g,'_'),content:btoa(binary),content_type:MIME[extension]});
 }
 return {details,attachments};
}
async function sendEmail(env,payload,key,send){
 const r=await send('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Email service unavailable');const d=await r.json();if(typeof d.id!=='string')throw Error('Email service unavailable');return d.id;
}
export function createHandler(send=fetch){return async function handle(request,env){
 const origin=request.headers.get('Origin')||'',url=new URL(request.url);
 if(request.method==='OPTIONS')return response(origin,{},ORIGINS.has(origin)?204:403);
 if(url.pathname==='/config'&&request.method==='GET')return response(origin,{open:ready(env),siteKey:ready(env)?env.TURNSTILE_SITE_KEY:null,maxAttachmentBytes:MAX_FILES_BYTES,version:1});
 if(url.pathname!=='/submit'||request.method!=='POST')return response(origin,{error:'Not found.'},404);
 if(!ORIGINS.has(origin))return response(origin,{error:'This form must be opened on Allyspan.'},403);
 if(!ready(env))return response(origin,{error:'Submissions are not open yet.'},503);
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return response(origin,{error:'Unable to verify this request.'},403);
 try{
  if(!(await env.JOURNAL_RATE_LIMITER.limit({key:ip})).success)return response(origin,{error:'Please wait a minute before trying again.'},429);
  if(!request.headers.get('Content-Type')?.startsWith('multipart/form-data'))return response(origin,{error:'Invalid submission format.'},415);
  const form=await limitedBody(request);
  if(text(form,'website',500,false))throw new Invalid('Unable to verify this request.');
  const token=text(form,'cf-turnstile-response',2048),id=text(form,'submission-id',36);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new Invalid('Please reopen the form and try again.');
  const {details,attachments}=await validate(form);
  const verification=await send('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:ip}),signal:AbortSignal.timeout(15000)});
  if(!verification.ok)throw Error('Verification unavailable');const v=await verification.json();
  if(!v.success||!['www.allyspan.org','allyspan.org'].includes(v.hostname)||v.action!=='journal-submit')return response(origin,{error:'Please complete the security check again.'},400);
  const ref='AJ-'+id.toUpperCase();
  const from='The Allyspan Journal <journal@allyspan.org>';
  const metadata=Object.entries(details).filter(([,val])=>val).map(([k,val])=>k+'\n'+val).join('\n\n');
  const editorial={from,to:['journal@allyspan.org'],reply_to:details.email,subject:'Journal submission '+ref+' - '+details.title.replace(/[\r\n]/g,' ').slice(0,150),text:'Private editorial submission\nReference: '+ref+'\nPolicy: Contributor guide v1.1 (October 17, 2026)\n\n'+metadata+'\n\nAll four author declarations confirmed. Submission is not acceptance. Attachments are untrusted author-provided files; handle cautiously.',attachments};
  await sendEmail(env,editorial,'journal/editorial/'+id,send);
  const receipt={from,to:[details.email],reply_to:'journal@allyspan.org',subject:'Your Allyspan Journal submission - '+ref,text:'Thank you for submitting your work to The Allyspan Journal.\n\nReference: '+ref+'\nTitle: '+details.title+'\n\nYour work has been received for confidential editorial assessment. Nothing has been published. Submission is not acceptance and grants no publication rights. Publication requires a separate agreement and your approval of the final proof.\n\nWe aim to give an initial response within 15 business days of a complete submission and will communicate significant delays.\n\nContributor guide: https://www.allyspan.org/showcase/how-to-publish/\nPolicy: Contributor guide v1.1 (October 17, 2026)\n\nFor questions or withdrawal requests, reply to journal@allyspan.org and include your reference.\n\nAllyspan Journal Editorial Team\nSupport that stays beside you'};
  try{await sendEmail(env,receipt,'journal/receipt/'+id,send);}catch{return response(origin,{received:true,reference:ref,receiptSent:false,message:'Your work was received, but we could not confirm your receipt email. Keep this reference and contact journal@allyspan.org if needed.'},202);}
  return response(origin,{received:true,reference:ref,receiptSent:true},201);
 }catch(e){return response(origin,{error:e instanceof Invalid?e.message:'We could not confirm delivery. Keep the form open and try again. If you have received a reference by email, contact journal@allyspan.org before resubmitting.'},e instanceof Invalid?400:503);}
};}
export default {fetch:createHandler()};

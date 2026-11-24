/* Shared menu behavior for every public website language. */
(()=>{'use strict';
function start(){
 const header=document.querySelector('.site-header');if(!header)return;
 const style=document.createElement('style');style.id='scroll-menu-style';
 style.textContent=`.site-header{transition:transform .22s ease;will-change:transform}.site-header.scroll-menu-hidden{transform:translateY(calc(-100% - 2px))}.nav-reveal-zone{display:none;position:fixed;top:0;left:0;right:0;height:var(--site-header-height,76px);z-index:21;pointer-events:none}@media(hover:hover){html.nav-menu-hidden .nav-reveal-zone{display:block;pointer-events:auto}}@media(prefers-reduced-motion:reduce){.site-header{transition:none}}@media print{.site-header.scroll-menu-hidden{transform:none}.nav-reveal-zone{display:none!important}}`;
 document.head.append(style);
 const revealZone=document.createElement('div');revealZone.className='nav-reveal-zone';revealZone.setAttribute('aria-hidden','true');document.body.append(revealZone);
 let lastY=Math.max(0,window.scrollY),travel=0,direction=0,scheduled=false,pointerInMenu=false;
 function show(){header.classList.remove('scroll-menu-hidden');document.documentElement.classList.remove('nav-menu-hidden')}
 function hide(){header.classList.add('scroll-menu-hidden');document.documentElement.classList.add('nav-menu-hidden')}
 function protectedMenu(){return pointerInMenu||header.contains(document.activeElement)||!!header.querySelector('[aria-expanded="true"]')||!!document.querySelector('dialog[open]')}
 function update(){scheduled=false;const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),y=Math.min(max,Math.max(0,window.scrollY)),delta=y-lastY;lastY=y;
  if(y<=12||protectedMenu()){show();travel=0;direction=0;return}
  if(Math.abs(delta)<1)return;const next=delta>0?1:-1;if(next!==direction){travel=0;direction=next}travel+=Math.abs(delta);
  if(travel<10)return;if(direction>0)show();else hide();travel=0;
 }
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
 header.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){pointerInMenu=true;show()}});
 header.addEventListener('pointerleave',()=>{pointerInMenu=false});
 revealZone.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')show()});
 header.addEventListener('focusin',show);
 new MutationObserver(()=>{if(protectedMenu())show()}).observe(header,{subtree:true,attributes:true,attributeFilter:['aria-expanded']});
 document.addEventListener('keydown',event=>{if(event.key==='Tab')show()});
 window.addEventListener('pageshow',()=>{lastY=Math.max(0,window.scrollY);travel=0;direction=0;show()});
 show();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

(async () => {
 const intro=document.querySelector('#startup-intro');if(!intro)return;
 document.documentElement.dataset.startup='checking';
 const complete=()=>{document.documentElement.dataset.startup='complete';document.dispatchEvent(new Event('qfsv:startup-complete'))};
 if(new URLSearchParams(location.search).get('preview')==='1'){intro.remove();complete();return}
 // Navigation within the app and refresh do not replay the intro.
 // A fresh browser tab has its own session and plays it once.
 const key='qfsv-startup-shown-v2';let seen=false;
 try{seen=sessionStorage.getItem(key)==='1'}catch{}
 const reload=performance.getEntriesByType('navigation')[0]?.type==='reload';
 if(seen||reload){intro.remove();complete();return}
 try{sessionStorage.setItem(key,'1')}catch{}
 intro.hidden=false;document.documentElement.dataset.startup='active';
 const circle=intro.querySelector('.startup-progress'),percentage=intro.querySelector('#startup-percent'),progress=intro.querySelector('[role=progressbar]'),image=intro.querySelector('img');
 image.onerror=()=>{image.onerror=null;image.src='./volvo70.webp'};image.src='./api/images/volvo70';
 const blocked=[...document.querySelectorAll('body > header, body > main, body > footer')];blocked.forEach(el=>el.inert=true);
 const started=performance.now();let finished=false,frame;
 const update=value=>{circle.setAttribute('stroke-dashoffset',String(100-value));const rounded=Math.min(100,Math.floor(value));percentage.textContent=rounded+' %';progress.setAttribute('aria-valuenow',String(rounded))};
 const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);update(100);requestAnimationFrame(()=>{intro.remove();blocked.forEach(el=>el.inert=false);complete()})};
 const animate=now=>{if(finished)return;const value=Math.min(100,(now-started)/50);update(value);if(value>=100)finish();else frame=requestAnimationFrame(animate)};
 frame=requestAnimationFrame(animate);setTimeout(finish,5000);
})();

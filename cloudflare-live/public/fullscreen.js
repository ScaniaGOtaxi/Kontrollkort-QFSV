(() => {
 if(new URLSearchParams(location.search).get('preview')==='1')return;
 const header=document.querySelector('body > header'),root=document.documentElement;
 const enter=root.requestFullscreen||root.webkitRequestFullscreen,leave=document.exitFullscreen||document.webkitExitFullscreen;
 if(!header||!enter||!leave||document.fullscreenEnabled===false)return;
 const button=document.createElement('button');button.type='button';button.className='fullscreen-toggle';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg><span>Helskärm</span>';
 const status=document.createElement('span');status.className='fullscreen-status';status.setAttribute('role','status');
 const active=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 const update=()=>{const full=active();button.querySelector('span').textContent=full?'Lämna helskärm':'Helskärm';button.setAttribute('aria-pressed',String(full));button.title=full?'Lämna helskärm (Esc)':'Visa appen i helskärm'};
 button.onclick=async()=>{button.disabled=true;status.textContent='';try{if(active())await leave.call(document);else await enter.call(root)}catch{status.textContent='Webbläsaren kunde inte växla helskärmsläge.'}finally{button.disabled=false;update()}};
 document.addEventListener('fullscreenchange',update);document.addEventListener('webkitfullscreenchange',update);
 let actions=header.querySelector('.header-app-actions');if(!actions){actions=document.createElement('div');actions.className='header-app-actions';header.append(actions)}actions.append(button,status);update();
})();

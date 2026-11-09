(() => {
 if(new URLSearchParams(location.search).get('preview')==='1')return;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 if('serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
 const header=document.querySelector('body > header');if(!header||standalone())return;
 let pending=null,dialog=null,dismissed=false;
 try{dismissed=sessionStorage.getItem('qfsv-install-dismissed')==='1'}catch{}
 const button=document.createElement('button');button.type='button';button.className='install-toggle';button.textContent='Installera';button.title='Installera QFSV som app';
 let actions=header.querySelector('.header-app-actions');if(!actions){actions=document.createElement('div');actions.className='header-app-actions';header.append(actions)}const controls=document.createElement('div');controls.className='install-controls';controls.hidden=dismissed;
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='install-dismiss';dismiss.textContent='×';dismiss.setAttribute('aria-label','Stäng installationsknappen');dismiss.title='Stäng installationsknappen';
 dismiss.onclick=()=>{dismissed=true;controls.hidden=true;dialog?.close();try{sessionStorage.setItem('qfsv-install-dismissed','1')}catch{}};
 controls.append(button,dismiss);actions.prepend(controls);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;const install=dialog?.querySelector('[data-install-now]');if(install)install.hidden=false});
 window.addEventListener('appinstalled',()=>{pending=null;controls.hidden=true;button.hidden=true;dialog?.close()});
 matchMedia('(display-mode: standalone)').addEventListener('change',()=>{button.hidden=standalone();controls.hidden=dismissed||standalone()});
 const guides={ios:['iPhone / iPad','Öppna appens webblänk i Safari.','Tryck på Dela och välj Lägg till på hemskärmen.','Bekräfta med Lägg till.'],android:['Android','Öppna appens webblänk i Chrome.','Välj Installera här, eller öppna webbläsarens meny ⋮ och välj Installera appen / Lägg till på startskärmen.','Bekräfta installationen.'],windows:['Windows','Öppna appens webblänk i Edge eller Chrome.','Välj Installera här, eller installationsikonen i webbläsarens adressfält.','Bekräfta. QFSV öppnas sedan i ett eget appfönster.']};
 const guide=key=>{const [title,...steps]=guides[key];return '<section><h3>'+title+'</h3><ol>'+steps.map(text=>'<li>'+text+'</li>').join('')+'</ol></section>'};
 button.onclick=()=>{
  if(dialog?.open)return;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),platform=ios?'ios':/Android/i.test(navigator.userAgent)?'android':'windows';
  dialog=document.createElement('dialog');dialog.className='app-dialog install-dialog';dialog.setAttribute('aria-labelledby','install-title');
  dialog.innerHTML='<form method="dialog" class="install-dialog-close"><button aria-label="Stäng installationshjälp">×</button></form><img class="install-icon" src="./icon-192.png" width="76" height="76" alt="Volvo L70H appikon"><h2 id="install-title">Installera QFSV</h2><p>Lägg appen på hemskärmen eller i Windows. Den öppnas i ett eget appfönster och använder samma gemensamma databas.</p>'+guide(platform)+'<button type="button" class="primary" data-install-now '+(pending?'':'hidden')+'>Installera appen</button><details><summary>Installation på andra enheter</summary>'+Object.keys(guides).filter(key=>key!==platform).map(guide).join('')+'</details><p class="sub">Internetanslutning behövs för den gemensamma databasen och för att skicka rapporter.</p><form method="dialog"><button>Stäng</button></form>';
  dialog.querySelector('[data-install-now]').onclick=async()=>{const event=pending;if(!event)return;pending=null;dialog.close();await event.prompt();await event.userChoice};
  const current=dialog;current.addEventListener('click',event=>{if(event.target!==current)return;const box=current.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)current.close()});current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null},{once:true});document.body.append(current);current.showModal();
 };
})();

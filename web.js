'use strict';
(()=>{
 const SETTINGS_KEY='vicious-cycle-web-media-v1';
 const defaults={music:true,musicVolume:30,sfx:true,sfxVolume:45,haptics:false};
 let media={...defaults};
 try{const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(saved){for(const k of ['music','sfx','haptics'])if(typeof saved[k]==='boolean')media[k]=saved[k];for(const k of ['musicVolume','sfxVolume'])if(Number.isFinite(saved[k]))media[k]=Math.max(0,Math.min(100,saved[k]));}}catch{}
 const music=new Audio('assets/audio/night-loop.mp3'),click=new Audio('assets/audio/button-click.mp3');
 music.loop=true;music.preload='none';click.preload='auto';let activated=false,audioIssue='',lastEffect='';
 const hasHaptics=typeof navigator.vibrate==='function';
 const audioStatus=()=>{$('audioStatus').textContent=audioIssue?webText(audioIssue):'';};
 function persistMedia(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(media));}catch{}}
 function playMusic(){
  if(!activated||!media.music||document.hidden){music.pause();return;}
  music.play()?.then(()=>{audioIssue='';audioStatus();}).catch(error=>{audioIssue=error.name==='NotAllowedError'?'audioBlocked':'audioFailed';audioStatus();});
 }
 function playClick(force=false){
  if((!force&&!media.sfx)||document.hidden)return;
  click.currentTime=0;click.play()?.then(()=>{if(audioIssue==='audioBlocked'){audioIssue='';audioStatus();}}).catch(error=>{audioIssue=error.name==='NotAllowedError'?'audioBlocked':'audioFailed';audioStatus();});
 }
 function syncMedia(){
  music.volume=media.musicVolume/100;click.volume=media.sfxVolume/100;
  $('musicEnabled').checked=media.music;$('sfxEnabled').checked=media.sfx;$('hapticsEnabled').checked=hasHaptics&&media.haptics;
  $('musicVolume').value=media.musicVolume;$('sfxVolume').value=media.sfxVolume;
  $('musicVolume').disabled=!media.music;$('sfxVolume').disabled=!media.sfx;
  $('hapticsEnabled').disabled=!hasHaptics;$('hapticsHelp').textContent=webText(hasHaptics?'hapticsAvailable':'hapticsUnavailable');audioStatus();
 }
 for(const [id,key]of [['musicEnabled','music'],['sfxEnabled','sfx'],['hapticsEnabled','haptics']])$(id).addEventListener('change',()=>{media[key]=$(id).checked;activated=true;persistMedia();syncMedia();playMusic();if(key==='haptics'&&hasHaptics){navigator.vibrate(media.haptics?30:0);}});
 for(const [id,key]of [['musicVolume','musicVolume'],['sfxVolume','sfxVolume']])$(id).addEventListener('input',()=>{media[key]=Number($(id).value);persistMedia();syncMedia();});
 $('testSound').onclick=()=>{activated=true;playClick(true);playMusic();};
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  activated=true;if(button.id!=='testSound')playClick();playMusic();
 },true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();click.pause();if(hasHaptics)navigator.vibrate(0);}else playMusic();});
 window.addEventListener('pagehide',()=>{music.pause();click.pause();if(hasHaptics)navigator.vibrate(0);});
 window.addEventListener('pageshow',()=>playMusic());
 $('coverSettings').onclick=()=>$('settings').showModal();
 for(const id of ['coverLanguage','introLanguage','gameLanguage','endingLanguage'])$(id).onclick=()=>$('languageDialog').showModal();
 for(const button of document.querySelectorAll('[data-language]'))button.onclick=()=>{
  stopTyping();setLanguage(button.dataset.language);localizePage();$('languageDialog').close();
  if(view==='intro')renderIntro();else if(view==='cover')showCover();else render();
 };
 // iPhone has no Vibration API. Other browsers may use the same short event cues.
 const originalRender=render;
 render=function(){originalRender();const n=STORY[state.id],effect=n.fx||n.mood;
  const key=state.id+':'+effect;
  if(media.haptics&&hasHaptics&&view==='game'&&!document.hidden&&effect&&key!==lastEffect){
   const pattern=['impact','alarm','scream','press'].includes(effect)?[25,35,40]:[20];navigator.vibrate(pattern);
  }lastEffect=key;
 };
 const originalPaint=paintScene;
 paintScene=function(pic,scene){originalPaint(pic,scene);const alt=languageViews[language]?.art?.[scene]||(language==='en'?EN_ART[scene]:ART[scene].name);if(alt)pic.setAttribute('aria-label',alt);};
 // Face-aware full bleed only on the standalone cover; story frames use contain.
 function fitCover(){const el=document.querySelector('.cover-image'),w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
  const scale=Math.max(w/1672,h/941),dw=1672*scale,dh=941*scale;
  const left=Math.min(0,Math.max(w-dw,w*.68-dw*.84));
  el.style.backgroundSize=dw+'px '+dh+'px';el.style.backgroundPosition=left+'px '+((h-dh)/2)+'px';
 }
 new ResizeObserver(fitCover).observe(document.querySelector('.cover-image'));fitCover();
 // Reposition image hotspots onto the fitted square, not the letterbox padding.
 const baseHotspots=setupHotspots;
 function fitHotspots(){const w=$('stage').clientWidth,h=$('stage').clientHeight,side=Math.min(w,h),items=STORY[state.id]?.hotspots||[];
  [...$('hotspots').children].forEach((button,index)=>{const point=items[index];if(!point)return;button.style.left=((w-side)/2+side*point.x/100)+'px';button.style.top=((h-side)/2+side*point.y/100)+'px';});
 }
 setupHotspots=function(n){baseHotspots(n);fitHotspots();};new ResizeObserver(fitHotspots).observe($('stage'));
 let offlineState='';
 function localizeExtras(){syncMedia();if(offlineState)$('offlineStatus').textContent=webText(offlineState);}
 document.addEventListener('game-language-change',localizeExtras);
 localizePage();syncMedia();
 const offline=$('downloadOffline');
 if(!('serviceWorker'in navigator)||!window.isSecureContext){offline.disabled=true;offlineState='offlineUnavailable';localizeExtras();return;}
 const workerReady=navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready);
 workerReady.catch(()=>{offline.disabled=true;offlineState='offlineUnavailable';localizeExtras();});
 offline.onclick=async()=>{
  offline.disabled=true;offlineState='';$('offlineStatus').textContent=webText('offlineBusy')+'…';
  try{const registration=await workerReady;const worker=registration.active;if(!worker)throw Error('No active worker');
   const channel=new MessageChannel();
   const completed=new Promise((resolve,reject)=>{channel.port1.onmessage=({data})=>{
    if(data.type==='progress')$('offlineStatus').textContent=webText('offlineBusy')+' '+data.done+' / '+data.total;
    else if(data.type==='done'){channel.port1.close();resolve();}else if(data.type==='error'){channel.port1.close();reject(Error('Incomplete download'));}
   };});
   worker.postMessage({type:'download-offline'},[channel.port2]);await completed;offlineState='offlineReady';
  }catch{offlineState='offlineError';}finally{offline.disabled=false;localizeExtras();}
 };
})();

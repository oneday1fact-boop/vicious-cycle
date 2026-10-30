'use strict';
importScripts('offline-assets.js');
const CACHE='vicious-cycle-ios-1.1.0-r1';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(OFFLINE_CORE);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('vicious-cycle-ios-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
async function rangeResponse(request,response){
 const range=request.headers.get('range');if(!range||response.status!==200)return response;
 const parts=/^bytes=(\d*)-(\d*)$/.exec(range);if(!parts)return response;
 const bytes=await response.arrayBuffer(),length=bytes.byteLength;
 let start=parts[1]?Number(parts[1]):Math.max(0,length-Number(parts[2]));
 let end=parts[1]?(parts[2]?Number(parts[2]):length-1):length-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=length||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+length}});
 end=Math.min(end,length-1);
 return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type')||'audio/mpeg','Content-Range':`bytes ${start}-${end}/${length}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(request.mode==='navigate'){
   try{const online=await fetch(request);if(online.ok){await cache.put('index.html',online.clone());return online;}}catch{}
   return (await cache.match('index.html'))||(await cache.match('./'))||new Response('Reconnect to load the game.',{status:503});
  }
  const stored=await cache.match(request,{ignoreSearch:true});if(stored)return rangeResponse(request,stored);
  const response=await fetch(request);
  if(response.ok&&response.status===200)await cache.put(new Request(url.origin+url.pathname),response.clone());
  return response;
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='download-offline')return;
 const port=event.ports[0];if(!port)return;
 event.waitUntil((async()=>{
  try{const cache=await caches.open(CACHE),files=[...new Set([...OFFLINE_CORE,...OFFLINE_ASSETS])];let done=0,cursor=0;
   async function worker(){while(cursor<files.length){const file=files[cursor++];const stored=await cache.match(file,{ignoreSearch:true});if(!stored){const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),30000);try{const response=await fetch(file,{cache:'reload',signal:abort.signal});if(!response.ok||response.status!==200)throw Error('Asset unavailable');await cache.put(file,response);}finally{clearTimeout(timeout);}}done++;port.postMessage({type:'progress',done,total:files.length});}}
   await Promise.all(Array.from({length:4},worker));port.postMessage({type:'done'});
  }catch{port.postMessage({type:'error'});}
 })());
});

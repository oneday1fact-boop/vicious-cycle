const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=fs.existsSync(path.join(__dirname,'dist/index.html'))?path.join(__dirname,'dist'):__dirname;
const data=require(path.join(root,'story.js')),{START,STORY,NOTES,CHAPTERS,CONTINUATIONS}=data;
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),i18n=fs.readFileSync(path.join(root,'i18n.js'),'utf8');
for(const [id,n] of Object.entries(STORY)){
 assert(n.text&&n.goal&&n.scene&&n.section,id);assert(n.text.length<=85,id+' long paragraph');assert(n.text.split('\n').length<=2,id+' too many lines');
 for(const v of n.variants||[])assert(v.text.length<=85,id+' long variant');
 assert(!(n.next&&n.choices),id+' ambiguous');
 for(const to of [n.next,n.continue,...(n.choices||[]).map(c=>c.to),...(n.resolve||[]).map(c=>c.to)].filter(Boolean))assert(STORY[to],id+' -> '+to);
 for(const k of [...(n.learn||[]),...(n.action?.learn||[]),...(n.extra?.learn||[]),...(n.hotspots||[]).flatMap(h=>h.learn||[])])assert(NOTES[k],id+' note '+k);
 if(n.end)assert(n.ending||n.continue,id+' abrupt ending');
 if(n.ending){assert(!n.next&&!n.continue);for(const e of [n.ending,...(n.ending.variants||[])]){assert.equal(e.paragraphs.length,3);for(const text of e.paragraphs)assert(text.length<=90,id+' long epilogue');}}
 assert(n.boundary!=='pending',id+' unfinished');
}
class El{
 constructor(){this.events={};this.textContent='';this.value='';this.children=[];this.style={setProperty(){}};this.dataset={};this.classes=new Set();this.attrs={};this.clientWidth=550;this.clientHeight=620;this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,v)=>v?this.classes.add(x):this.classes.delete(x),contains:x=>this.classes.has(x)};}
 set className(v){this.classes=new Set(v.split(/\s+/).filter(Boolean))}get className(){return [...this.classes].join(' ')}
 append(...x){this.children.push(...x)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}addEventListener(name,fn){this.events[name]=fn}showModal(){this.open=true}close(){this.open=false;this.events.close?.()}
 querySelectorAll(selector){const name=selector.slice(1);return this.children.flatMap(c=>typeof c==='object'?[...(c.classList.contains(name)?[c]:[]),...c.querySelectorAll(selector)]:[]);}
}
function boot(storage={}){
 const els={},el=id=>els[id]??=new El(),timers=new Map();let timerId=0;
 const ctx={...structuredClone(data),document:{documentElement:new El(),getElementById:el,createElement:()=>new El(),createTextNode:t=>t,querySelectorAll:()=>[],querySelector:s=>s==='.episode'?el('episode'):Object.values(els).find(e=>e.open)||null,addEventListener(){}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},setInterval:f=>{timers.set(++timerId,f);return timerId},clearInterval:id=>timers.delete(id),structuredClone,console};
 vm.createContext(ctx);vm.runInContext(i18n,ctx);vm.runInContext(app,ctx);return{ctx,els,storage,tick:()=>{for(const f of [...timers.values()])f();}};
}
const {ctx,els,storage}=boot(),run=s=>vm.runInContext(s,ctx);
const match=(r,f)=>Object.hasOwn(r,'value')?f[r.flag]===r.value:!!f[r.flag];
function routes(start,flags={},stop=null){const all=[];function walk(id,flags,steps,seen){assert(!seen.includes(id),'cycle '+id);const n=STORY[id];if(n.resolve){const r=n.resolve.find(r=>match(r,flags));if(r)return walk(r.to,flags,steps,[...seen,id]);}flags={...flags,...n.onEnter};if(id===stop||n.ending){all.push({steps,expected:id,flags});return;}if(n.continue){return walk(n.continue,{...flags,...((n.chapter||1)===1?{chapterOneResult:n.result}:{})},[...steps,{type:'continue',id}],[...seen,id]);}if(n.choices)n.choices.forEach((c,index)=>walk(c.to,{...flags,...c.set},[...steps,{type:'choice',id,index}],[...seen,id]));else{assert(n.next,id+' dead end');walk(n.next,flags,steps,[...seen,id]);}}walk(start,flags,[],[]);return all;}
const reached=new Set(),results=new Set(),actions=new Set();let completeSave;
function drive(route,seed=null){
 if(seed){ctx.testSeed=seed;run('prefs.speed=0;state=fresh();state.flags=structuredClone(testSeed);state.checkpoints[3]={id:"c3_wait",flags:structuredClone(state.flags),actions:{},notes:[],history:[]};go("c3_wait")');}else run('prefs.speed=0;start()');
 let step=0;
 for(let guard=0;guard<220;guard++){
  const s=run('state'),n=STORY[s.id];reached.add(s.id);
  if(s.id===route.expected){assert(n.end);break;}
  if(n.continue){const expected=route.steps[step++];assert.equal(expected.type,'continue');assert.equal(expected.id,s.id);const original=s.flags.chapterOneResult;els.chapterContinue.onclick();if(n.chapter>1)assert.equal(run('state.flags.chapterOneResult'),original);continue;}
  if(n.action&&!run('actionDone()')){actions.add(n.action.kind);const id=s.id;run('next()');assert.equal(run('state.id'),id);els.sceneAction.onclick();assert(els.infoDialog.open);assert(els.infoPicture.dataset.scene);els.infoContinue.onclick();assert(!els.infoDialog.open);assert.notEqual(run('state.id'),id);}
  else if(n.choices){const expected=route.steps[step++];assert.equal(expected.type,'choice');assert.equal(expected.id,s.id);assert.equal(els.choices.children.length,n.choices.length);els.choices.children[expected.index].onclick();}
  else run('next()');
 }
 const s=run('state');assert.equal(s.id,route.expected);assert.equal(step,route.steps.length);assert.equal(JSON.parse(storage['please-obey-chapter-one-v5']).id,s.id);
 if(STORY[s.id].ending){results.add(s.id);assert.equal(run('view'),'ending');els.epilogueNext.onclick();els.epilogueNext.onclick();assert(!els.endingActions.classList.contains('hidden'));assert(els.epilogueNext.classList.contains('hidden'));}
 if(s.id==='c2_endComplete'&&!completeSave)completeSave=structuredClone(s);
 return s;
}
// Exhaust the original chapters at their former boundary, keeping all legacy branch combinations.
const prefix=routes(START,{},'c2_endComplete');assert.equal(prefix.length,4446);
for(const r of prefix){const s=drive(r);const free=['withdraw','escape'].includes(s.flags.chapterOneResult),result=STORY[s.id].result;if(free){assert(['truthfulStatement','falseStatement','silentWitness'].includes(result));assert(!s.flags.joined);}else assert(['refusedTreatment','withdrawnTreatment','completedTreatment'].includes(result));if(result==='withdrawnTreatment')assert([1,7].includes(s.flags.treatmentDays));if(result==='completedTreatment')assert.equal(s.flags.treatmentDays,14);}
console.log('PASS original chapters: '+prefix.length+' route combinations.');
// Exhaust all paths in the new three-chapter continuation, rotating carried-over histories.
const suffix=routes('c3_wait');assert.equal(suffix.length,4320);
const seeds=[{chapterOneResult:'fourteen',joined:true,completedTreatment:true,treatmentDays:14,oldMocked:true,musicConcern:true,exitRecorded:true},{chapterOneResult:'surrender',joined:true,completedTreatment:true,treatmentDays:14,oldStopped:true,rear:true},{chapterOneResult:'betrayed',joined:true,completedTreatment:true,treatmentDays:14,oldWatched:true}];
for(let i=0;i<suffix.length;i++)drive(suffix[i],seeds[i%seeds.length]);
assert.equal(reached.size,Object.keys(STORY).length);assert.equal(results.size,10);assert.equal(actions.size,8);
console.log('PASS final chapters: '+suffix.length+' continuation routes; ten endings; every scene reachable.');
// Optional illustrated cards do not gate the main story.
for(const id of ['world','c2_fatal','c2_home','c2_complete','c3_depart','c4_edit']){run(`prefs.speed=0;start();go(${JSON.stringify(id)})`);const n=STORY[id];els.extraAction.onclick();assert(els.infoDialog.open);assert.equal(els.infoPicture.dataset.scene,n.extra.scene);for(const k of n.extra.learn)assert(run('state.notes').includes(k));const length=run('state.history.length');els.infoContinue.onclick();assert.equal(run('state.id'),id);els.extraAction.onclick();assert.equal(run('state.history.length'),length);els.infoDialog.close();run('next()');assert.equal(run('state.id'),n.next);}
// Evidence hotspots represent actual history rather than manufacturing proof.
run('start();go("c5_dossier")');assert.equal(els.hotspots.children.length,3);els.hotspots.children[1].onclick();assert(els.infoText.textContent.includes('沒有遇到'));els.infoDialog.close();run('state.flags.patrolAbuse=true;state.flags.reportCopy=true;state.flags.fullInterview=true;render()');
for(let i=0;i<3;i++){els.hotspots.children[i].onclick();assert(els.infoDialog.open);assert(!els.infoText.textContent.includes('沒有遇到'));els.infoContinue.onclick();assert.equal(run('state.id'),'c5_dossier');}
assert(run('state.notes').includes('evidenceMedical'));assert(run('state.notes').includes('evidencePatrol'));assert(run('state.notes').includes('evidenceVoice'));
// Legacy pending saves continue into chapter three and retain chapter-one outcomes.
{
 const a=boot({'please-obey-chapter-one-v5':JSON.stringify(completeSave)});a.els.resume.onclick();assert.equal(vm.runInContext('state.id',a.ctx),'c3_wait');assert.equal(vm.runInContext('state.flags.chapterOneResult',a.ctx),completeSave.flags.chapterOneResult);assert(vm.runInContext('state.checkpoints[3]',a.ctx));vm.runInContext('replayChapter(2)',a.ctx);assert.equal(vm.runInContext('state.id',a.ctx),CONTINUATIONS[completeSave.flags.chapterOneResult]);assert(!vm.runInContext('state.flags.joined',a.ctx));assert(!vm.runInContext('state.checkpoints[3]',a.ctx));
}
for(const [id,result]of[['endFourteen','fourteen'],['endEscape','escape'],['endWithdraw','withdraw'],['endSurrender','surrender'],['endBetrayed','betrayed']]){const a=boot({'please-obey-chapter-one-v5':JSON.stringify({id,flags:{},actions:{},notes:[],history:[]})});a.els.resume.onclick();assert.equal(vm.runInContext('state.id',a.ctx),CONTINUATIONS[result]);}
// Introduction stays short, with the therapy reveal held until the story.
{
 const a=boot({'please-obey-chapter-one-v5':JSON.stringify(completeSave)});a.els.start.onclick();assert.equal(a.els.introTitle.textContent,'四個人的夜晚');assert.equal(a.els.introProgress.textContent,'1 / 2');assert(!a.els.introCopy.textContent.includes('療程'));a.els.introNext.onclick();assert.equal(a.els.introTitle.textContent,'暴風雨前夕');assert(!a.els.enterStory.classList.contains('hidden'));assert.equal(JSON.parse(a.storage['please-obey-chapter-one-v5']).id,completeSave.id);a.els.enterStory.onclick();assert.equal(vm.runInContext('state.id',a.ctx),START);
}
// Rewinding the last choice removes the discarded decision; chapter replay removes later flags.
run('start();go("c5_finalChoice")');const before=run('structuredClone(state)');els.choices.children[0].onclick();run('next()');els.epilogueNext.onclick();els.epilogueNext.onclick();els.retryChoice.onclick();assert.equal(run('state.id'),'c5_finalChoice');assert(!run('state.flags.finalRoute'));assert.equal(run('state.history.length'),before.history.length);
run('start();state.flags.chapterOneResult="surrender";go("c2_endComplete");continueChapter();go("c3_end");continueChapter();go("c4_end");continueChapter()');assert.equal(run('state.id'),'c5_room');assert.equal(run('state.flags.chapterOneResult'),'surrender');els.chaptersBtn.onclick();assert.equal(els.chapterList.children.length,5);assert(!els.chapterList.children[3].disabled);els.chapterList.children[3].onclick();assert.equal(run('state.id'),'c4_home');assert(!run('state.checkpoints[5]'));
// Collection survives restarts and only shows discovered endings. Viewing does not overwrite the game.
assert.equal(run('collection.length'),10);const savedBefore=storage['please-obey-chapter-one-v5'];els.collectionBtn.onclick();assert.equal(els.collectionList.children.length,10);assert.equal(storage['please-obey-chapter-one-v5'],savedBefore);els.collection.close();run('start()');assert.equal(run('collection.length'),10);const fresh=boot();fresh.els.coverCollection.onclick();assert.equal(fresh.els.collectionList.children.filter(c=>c.classList.contains('is-locked')).length,10);
// Context-dependent paragraphs and epilogues remain honest about the player's actions.
run('state.flags.chapterOneResult="fourteen";go("endPublic")');assert(els.epilogueText.textContent.includes('死亡'));run('state.flags.chapterOneResult="surrender";render()');assert(!els.epilogueText.textContent.includes('死亡'));run('state.flags.treatmentDays=1;go("c2_endWithdraw")');assert(els.epilogueText.textContent.includes('一次'));run('state.flags.treatmentDays=7;render()');assert(els.epilogueText.textContent.includes('第七日'));run('state.flags.chapterOneResult="withdraw";go("c2_endTruth")');assert(els.epilogueText.textContent.includes('沒有參與'));run('state.flags.chapterOneResult="escape";render()');assert(els.epilogueText.textContent.includes('承認入屋'));
// Typing and reduced motion retain access to information and choices.
{const a=boot();vm.runInContext('start()',a.ctx);a.tick();assert(a.els.passage.textContent.length>0&&a.els.passage.textContent.length<STORY[START].text.length);a.els.passage.onclick();assert.equal(a.els.passage.textContent,vm.runInContext('STORY[START].text',a.ctx));a.ctx.matchMedia=()=>({matches:true});vm.runInContext('start()',a.ctx);assert.equal(vm.runInContext('typing',a.ctx),false);}
// Early endings return to an ancestor that really reaches a later chapter, not a closed sibling ending.
function followVisibleGuidance(context,elements){
 const evaluate=s=>vm.runInContext(s,context);
 for(let guard=0;guard<180;guard++){
  const current=evaluate('state'),n=STORY[current.id];
  if((n.chapter||1)>=3){assert(!current.guideTarget);return current;}
  assert(!n.ending,'guided route fell into '+current.id);
  if(n.continue){elements.chapterContinue.onclick();continue;}
  if(n.action&&!current.actions[current.id]){elements.sceneAction.onclick();elements.infoContinue.onclick();continue;}
  if(n.choices){assert(elements.choices.children.every(b=>!b.classList.contains('continues-story')));const index=n.choices.map((c,index)=>({c,index})).filter(({c})=>evaluate('canReachChapter('+JSON.stringify(c.to)+','+JSON.stringify({...current.flags,...c.set})+',3)')).at(-1)?.index;assert(Number.isInteger(index),current.id+' cannot continue after rewind');elements.choices.children[index].onclick();}
  else evaluate('next()');
 }
 assert.fail('guided return never reached chapter three');
}
const recoveryCases=[
 {end:'c2_endTruth',where:f=>f.plan==='declined',point:'planChoice'},
 {end:'c2_endTruth',where:f=>f.plan==='checked'&&!f.entered,point:'checkedEnter'},
 {end:'c2_endTruth',where:f=>f.chapterOneResult==='escape',point:'exitChoice'},
 {end:'c2_endAlibi',where:f=>f.plan==='trusted'&&!f.entered,point:'trustEnter'},
 {end:'c2_endRefuse',where:f=>!f.joined,point:null},
 {end:'c2_endWithdraw',where:f=>f.treatmentDays===1,point:'c2_stopReply'},
 {end:'c2_endWithdraw',where:f=>f.treatmentDays===7,point:'c2_finalDecision'}
];
for(const test of recoveryCases){
 const route=prefix.find(r=>r.expected===test.end&&test.where(r.flags));assert(route,'missing recovery case');
 const endingSave=drive(route),expected=run('findContinuation().snapshot.id');if(test.point)assert.equal(expected,test.point);
 assert(!els.routeRecovery.classList.contains('hidden'));run('state.epiloguePart=0;render()');assert(els.endingActions.classList.contains('hidden'));assert(!els.routeRecovery.classList.contains('hidden'));
 const collected=run('collection.length');els.returnToStory.onclick();assert.equal(run('state.id'),expected);assert(!run('state.guideTarget'));assert.equal(run('collection.length'),collected);assert(!run('state.flags.falseAlibi'));
 if((STORY[expected].chapter||1)===1){assert(!run('state.flags.chapterOneResult'));assert(!run('state.chapter2Start'));assert(!run('state.checkpoints[2]'));}
 followVisibleGuidance(ctx,els);
 // A reload of a legacy save reconstructs the same actual branch point from the original choice log.
 const legacy=structuredClone(endingSave);delete legacy.choiceTrail;
 const old=boot({'please-obey-chapter-one-v5':JSON.stringify(legacy)});vm.runInContext('prefs.speed=0',old.ctx);old.els.resume.onclick();assert(!old.els.routeRecovery.classList.contains('hidden'));old.els.returnToStory.onclick();assert.equal(vm.runInContext('state.id',old.ctx),expected);followVisibleGuidance(old.ctx,old.els);
}
// Very old saves with no choice history get a reachable chapter fallback rather than a closed chapter-two loop.
{
 const old=boot({'please-obey-chapter-one-v5':JSON.stringify({id:'c2_endSilence',flags:{chapterOneResult:'withdraw'},actions:{},notes:[],history:[]})});vm.runInContext('prefs.speed=0',old.ctx);old.els.resume.onclick();old.els.returnToStory.onclick();assert.equal(vm.runInContext('state.id',old.ctx),START);followVisibleGuidance(old.ctx,old.els);
}
// Main-story finales have already finished the game: they offer replay without inventing a sixth chapter.
run('start();go("endQuiet")');assert(els.routeRecovery.classList.contains('hidden'));
console.log('PASS early-ending recovery: cross-chapter rewinds, original flags restored, non-spoiling return still reaches chapter three, legacy and incomplete-save fallbacks, collection preserved.');
// Both languages cover every story field. Switching changes text, never branch facts or save progress.
{
 const b=boot(),evaluate=s=>vm.runInContext(s,b.ctx);
 evaluate('prefs.speed=0;start();next()');const original=evaluate('structuredClone(state)');
 b.els.gameLanguage.onclick();assert.equal(evaluate('language'),'en');assert.equal(b.els.passage.textContent,evaluate('STORY[state.id].text'));assert(!/[\u3400-\u9fff]/u.test(b.els.passage.textContent));assert.equal(evaluate('state.id'),original.id);assert.equal(JSON.stringify(evaluate('state.flags')),JSON.stringify(original.flags));
 b.els.choices.children[0].onclick();evaluate('next()');assert.equal(evaluate('state.id'),'coldWitness');b.els.choices.children[1].onclick();assert.equal(evaluate('state.flags.witnessChoice'),'backoff');
 const before=evaluate('JSON.stringify(state)');b.els.gameLanguage.onclick();assert.equal(evaluate('language'),'zh');assert.equal(evaluate('JSON.stringify(state)'),before);
 b.els.gameLanguage.onclick();b.els.homeBtn.onclick();const reload=boot({...b.storage});assert.equal(vm.runInContext('language',reload.ctx),'en');
 const visit=(value,key='')=>{if(key==='aliases')return;if(typeof value==='string')assert(!/[\u3400-\u9fff]/u.test(value),'untranslated '+value);else if(Array.isArray(value))value.forEach(v=>visit(v));else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>visit(v,k));};
 visit(evaluate('STORY'));visit(evaluate('NOTES'));visit(evaluate('PEOPLE'));visit(evaluate('CHAPTERS'));
 for(const n of Object.values(evaluate('STORY')))for(const c of n.choices||[])assert(c.aliases.length>=2);
 assert.equal(evaluate('recordedText("你叫停今次恐嚇。")'),'You put a stop to the intimidation.');
}
// Witness decisions have their own scenes and later footage; the second paragraph still has a choice.
for(let choice=0;choice<3;choice++){
 run('prefs.speed=0;start();next()');assert.equal(run('state.id'),'cold1');assert.equal(els.choices.children.length,3);els.choices.children[0].onclick();run('next()');assert.equal(run('state.id'),'coldWitness');els.choices.children[choice].onclick();const scene=run('currentScene');assert(scene.startsWith('tunnel'));run('next()');els.sceneAction.onclick();els.infoContinue.onclick();run('next()');assert.equal(run('state.id'),'worldRisk');els.extraAction.onclick();const words=['面孔','退後','車牌'];assert(els.infoText.textContent.includes(words[choice]));els.infoContinue.onclick();assert.equal(run('state.id'),'worldRisk');
}
// English is a complete playable route, including medical cards, late chapters and a formal ending.
{
 const b=boot({'vicious-cycle-language-v1':'en'}),evaluate=s=>vm.runInContext(s,b.ctx);evaluate('prefs.speed=0;start()');
 const picks={cold1:1,coldWitness:2,planChoice:1,trustEnter:1,exitChoice:1,c2_offer:1,c2_decide:1,c2_firstReaction:1,c2_day7Choice:2,c2_finalDecision:1,c3_before:1,c3_stageChoice:1,c3_releaseChoice:0,c4_homeChoice:1,c4_elderChoice:0,c4_patrolChoice:2,c5_finalChoice:1};
 let finished=false;
 for(let guard=0;guard<250;guard++){const st=evaluate('state'),n=evaluate('STORY[state.id]');if(n.ending){assert.equal(st.id,'endPublic');assert(b.els.epilogueText.textContent.includes('death'));assert.equal(b.els.endingTitle.textContent,'The Name on the Record');finished=true;break;}if(n.continue)b.els.chapterContinue.onclick();else if(n.action&&!st.actions[st.id]){b.els.sceneAction.onclick();assert(!/[\u3400-\u9fff]/u.test(b.els.infoText.textContent));b.els.infoContinue.onclick();}else if(n.choices){assert(Number.isInteger(picks[st.id]),st.id);b.els.choices.children[picks[st.id]].onclick();}else evaluate('next()');}
 assert(finished);assert(!app.includes('通往第'));assert(!app.includes('route-tag'));assert(!app.includes('continues-story'));
 // A save containing choices in both languages can still reconstruct old branch points.
 const end=structuredClone(evaluate('state'));delete end.choiceTrail;const trail=evaluate('recoverLegacyTrail('+JSON.stringify(end)+')');assert(trail.some(s=>s.id==='planChoice'));assert(trail.some(s=>s.id==='c2_finalDecision'));
}
console.log('PASS bilingual edition: complete English text, written Chinese, shared progress, language reload, mixed-language history, new witness decisions, and no future-chapter labels.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const[,id]of app.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(id),'missing DOM '+id);
const art=run('ART');for(const n of Object.values(STORY))assert(art[n.scene],n.scene);for(const a of Object.values(art))if(a.file)assert(fs.existsSync(path.join(root,a.file)),a.file);assert.equal(new Set(Object.values(art).filter(a=>a.file).map(a=>[a.file,a.col,a.row].join(':'))).size,64);
console.log('PASS complete game: 167 narrative nodes, five chapters, 64 scene frames, ten formal endings; chapter replay, collection, evidence, legacy saves and typing verified. Browser visual QA unavailable.');

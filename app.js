'use strict';
const $=id=>document.getElementById(id);
const SAVE_KEY='please-obey-chapter-one-v5',PREF_KEY='please-obey-prefs-v1',COLLECTION_KEY='vicious-cycle-endings-v1';
const CN=['','一','二','三','四','五','六','七','八','九','十'];
let collection=[];
const fresh=()=>({id:START,flags:{},actions:{},notes:[],history:[],checkpoints:{},choiceTrail:[]});
let state=fresh(),prefs={speed:20,size:21},saved=null,timer=null,typing=false,pending='',currentScene='cover',lastScene=null,view='cover',introPart=0,infoContext=null,recoveryPlan=null;
const ART={
 "tunnelThreat": {
  "file": "assets/scenes/tunnelThreat.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "隧道出口有一個人影，前景的手仍握着搶來的銀包"
 },
 "tunnelBeam": {
  "file": "assets/scenes/tunnelBeam.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "白光掃過混凝土牆壁與落地拐杖，一個影子遮住光線"
 },
 "tunnelWitness": {
  "file": "assets/scenes/tunnelWitness.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "出口的路人舉起電話錄影，前景是回頭的同伴"
 },
 "tunnelChase": {
  "file": "assets/scenes/tunnelChase.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗追向隧道出口，錄影的人退向明亮的店舖"
 },
 "tunnelBackOff": {
  "file": "assets/scenes/tunnelBackOff.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗攤開手退後，老人抱着拐杖，同伴在旁怒視"
 },
 "tunnelClip": {
  "file": "assets/scenes/tunnelClip.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "奶吧枱上的電話映出阿朗的臉，畫面內是隧道片段"
 },
 "backstage": {
  "file": "assets/scenes/backstage.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "後台枱上的咪，扭曲鏡面映出阿朗，橙色布幕遮住觀眾"
 },
 "stageTest": {
  "file": "assets/scenes/stageTest.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "演員俯身挑釁坐着的阿朗，醫生與台下觀眾注視"
 },
 "stageVoice": {
  "file": "assets/scenes/stageVoice.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗握着咪，站在橙色光束裡向台下說話"
 },
 "releaseDesk": {
  "file": "assets/scenes/releaseDesk.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "完成報告與照片放在枱上，林醫生在玻璃後看着"
 },
 "releaseDoor": {
  "file": "assets/scenes/releaseDoor.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗拿着衣物袋，走出高大的監獄門"
 },
 "homeDoor": {
  "file": "assets/scenes/homeDoor.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗站在已換租客的舊居門口，屋內堆着搬屋紙箱"
 },
 "mingGarage": {
  "file": "assets/scenes/mingGarage.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿明在車房將一杯熱水遞給阿朗"
 },
 "returnUnderpass": {
  "file": "assets/scenes/returnUnderpass.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "老人認出隧道裡的阿朗，旁人站在兩人之間"
 },
 "patrolVan": {
  "file": "assets/scenes/patrolVan.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿健與阿東穿上外判巡邏制服，站在開着的車門前"
 },
 "supportDesk": {
  "file": "assets/scenes/supportDesk.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "社區支援站裡，社工與阿朗在枱燈下交談"
 },
 "reporterStudio": {
  "file": "assets/scenes/reporterStudio.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿晴在小錄影室向阿朗展示錄音機，螢幕尚未開啟"
 },
 "soundSwitch": {
  "file": "assets/scenes/soundSwitch.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "手伸向電源掣，喇叭與播放器藏在橙黑陰影中"
 },
 "medicalRoom": {
  "file": "assets/scenes/medicalRoom.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "呂醫生在觀察室向阿朗解釋醫療記錄"
 },
 "governmentVisit": {
  "file": "assets/scenes/governmentVisit.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "主任笑着推過一份協議，阿朗的手停在紙邊"
 },
 "evidenceTable": {
  "file": "assets/scenes/evidenceTable.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "醫療文件、巡邏證件照片與錄音原檔攤在枱燈下"
 },
 "publicWitness": {
  "file": "assets/scenes/publicWitness.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗與何律師坐在作證席，面前有咪與完整紀錄"
 },
 "pressDivide": {
  "file": "assets/scenes/pressDivide.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗夾在兩邊宣傳人員與鏡頭之間，咪由兩面伸向他"
 },
 "recoveryRoom": {
  "file": "assets/scenes/recoveryRoom.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "清晨的小房間裡，阿朗坐在唱機旁，手留在停止掣附近"
 },
 "afterPrison": {
  "file": "assets/scenes/afterPrison.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "刑滿後，阿朗拿着衣物袋，站在已關門的奶吧前"
 },
 "afterTherapy": {
  "file": "assets/scenes/afterTherapy.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "巴士窗上倒映阿朗的臉，他握着座椅，凝視雨夜"
 },
 "afterTruth": {
  "file": "assets/scenes/afterTruth.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗在車房獨自做夜班，橙色門光照着工具"
 },
 "afterAlibi": {
  "file": "assets/scenes/afterAlibi.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "法庭桌上有錄音機與文件，阿朗的身影在玻璃後"
 },
 "afterSilence": {
  "file": "assets/scenes/afterSilence.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "咖啡店留下一部舊手機，窗外的阿朗獨自離去"
 },
 "publicStage": {
  "file": "assets/scenes/publicStage.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "公開評估的舞台只有一張椅，台下坐滿觀眾"
 },
 "cover": {
  "name": "橙黑陰影中的阿朗近鏡，直視玩家"
 },
 "halt": {
  "file": "assets/scenes/halt.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗伸手擋住阿東，老人縮在隧道牆邊"
 },
 "wallet": {
  "file": "assets/scenes/wallet.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "白袖手裡的破舊銀包與地上幾枚硬幣的特寫"
 },
 "cane": {
  "file": "assets/scenes/cane.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "黑靴踩住木拐杖，老人伸手想拿回"
 },
 "television": {
  "file": "assets/scenes/television.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "奶吧的舊電視，藍色畫面裡官員介紹行為矯正計劃"
 },
 "official": {
  "file": "assets/scenes/official.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "囚犯與試行計劃主任隔着灰色桌子會面"
 },
 "doctor": {
  "file": "assets/scenes/doctor.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "林醫生在診療室查看紀錄"
 },
 "terms": {
  "file": "assets/scenes/terms.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "同意書、鋼筆和印章的近鏡"
 },
 "refusal": {
  "file": "assets/scenes/refusal.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗將文件推回，轉向監獄走廊"
 },
 "signature": {
  "file": "assets/scenes/signature.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "白袖手在文件簽名，旁邊手指指出新增條款"
 },
 "suite": {
  "file": "assets/scenes/suite.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "開着門的放映室，橙色圓拱下有一張黑椅"
 },
 "projection": {
  "file": "assets/scenes/projection.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗坐在放映椅，投影光穿過房間，技術員在旁觀察"
 },
 "stopButton": {
  "file": "assets/scenes/stopButton.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "白袖手按下椅邊紅色停止掣"
 },
 "record": {
  "file": "assets/scenes/record.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "唱針壓在黑色唱片上，光線像一圈圈鐵欄"
 },
 "fists": {
  "file": "assets/scenes/fists.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗雙手緊抓黑色椅邊"
 },
 "haltedHand": {
  "file": "assets/scenes/haltedHand.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "伸向門口的手停在半空，技術員在門後看着"
 },
 "certificate": {
  "file": "assets/scenes/certificate.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "一份完成報告旁有清水與餐盤，人物陰影落在紙上"
 },
 "bedroom": {
  "file": "assets/scenes/bedroom.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "清晨雨中的小房間，阿朗坐在窗邊看手機"
 },
 "message": {
  "file": "assets/scenes/message.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "手機訊息畫面的近鏡，黑玻璃反射人影"
 },
 "kinMeeting": {
  "file": "assets/scenes/kinMeeting.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿健隔着咖啡店小桌望向阿朗，手中握住手機"
 },
 "solicitor": {
  "file": "assets/scenes/solicitor.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "何律師穿灰色西裝，與阿朗查看手機和資料"
 },
 "policeRoom": {
  "file": "assets/scenes/policeRoom.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗和何律師一起接受警方問話，桌上放着錄音機"
 },
 "morning": {
  "file": "assets/scenes/morning.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "阿朗拿着帽站在門口，面向灰白清晨"
 },
 "underpass": {
  "file": "assets/scenes/underpass.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "老人縮在隧道牆邊護住頭，四個人包圍他，拐杖和硬幣落在地上"
 },
 "bar": {
  "file": "assets/scenes/bar.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "扭曲圓鏡映出四人的奶吧會面，阿健將地址推向阿朗"
 },
 "address": {
  "file": "assets/scenes/address.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "黑色手套旁的地址紙特寫，桌面映出橙光和灑出的牛奶"
 },
 "exterior": {
  "file": "assets/scenes/exterior.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "黑樹枝遮住獨立屋，明亮窗口內有人影，地下窗口有狗"
 },
 "entry": {
  "file": "assets/scenes/entry.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "第一身視角翻入窄窗，碎碟在鞋下，狗站在走廊盡頭"
 },
 "confrontation": {
  "file": "assets/scenes/confrontation.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "屋主驚恐呼救，舉着木椅退到前門，前景是闖入者的白袖"
 },
 "alarm": {
  "file": "assets/scenes/alarm.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "懸垂的黑色電話筒特寫，枱上反射橙色警報光"
 },
 "aftermath": {
  "file": "assets/scenes/aftermath.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "傾斜視角的門廳，木椅倒下，擺設落地，電話筒仍然懸着"
 },
 "backdoor": {
  "file": "assets/scenes/backdoor.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "黑暗後門外，阿明站在霧中的花園小路等你"
 },
 "locked": {
  "file": "assets/scenes/locked.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "花園鐵閘的粗大鎖鏈特寫，外面空無一人"
 },
 "gate": {
  "file": "assets/scenes/gate.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "倒地的低視角，阿東站在眼前，阿健轉向車，遠處警車逼近"
 },
 "prison": {
  "file": "assets/scenes/prison.webp",
  "cols": 1,
  "rows": 1,
  "col": 0,
  "row": 0,
  "name": "高處俯視狹小牢房，阿朗獨坐床邊，鐵欄陰影切過地面"
 }
};
try{const p=JSON.parse(localStorage.getItem(PREF_KEY));if(p&&Number.isFinite(p.speed)&&Number.isFinite(p.size))prefs={speed:Math.max(0,Math.min(65,p.speed)),size:Math.max(18,Math.min(30,p.size))};}catch{}
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s)s.id=STORY[s.id]?s.id:LEGACY_IDS[s.id];if(s&&STORY[s.id]&&s.flags&&typeof s.flags==='object'&&s.actions&&typeof s.actions==='object'&&Array.isArray(s.notes)&&s.notes.every(k=>NOTES[k])&&Array.isArray(s.history))saved=s;}catch{}
if(saved){const names={'亞歷士':'阿朗','喬治':'阿健','迪姆':'阿東','彼特':'阿明'};const rename=t=>String(t??'').replace(/亞歷士|喬治|迪姆|彼特/g,n=>names[n]);saved.history=saved.history.map(e=>({who:rename(e.who),text:rename(e.text)}));}
try{const c=JSON.parse(localStorage.getItem(COLLECTION_KEY));if(Array.isArray(c))collection=c.filter(id=>STORY[id]?.ending);}catch{}
function persist(){delete state.guideTarget;saved=structuredClone(state);try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('saved').textContent=t('saved');}catch{$('saved').textContent=t('saveUnavailable');}}
function record(who,text){state.history.push({who,text});}
function learn(keys=[]){let changed=false;for(const k of keys)if(!state.notes.includes(k)){state.notes.push(k);changed=true;}if(changed)persist();}
function applyPrefs(){for(const id of ['passage','epilogueText'])$(id).style.fontSize=prefs.size+'px';$('speed').value=prefs.speed;$('size').value=prefs.size;}
function layoutScene(pic){const a=ART[pic.dataset.scene];if(!a?.file)return;pic.style.backgroundSize='contain';pic.style.backgroundPosition='center';}
function paintScene(pic,scene){const a=ART[scene];pic.dataset.scene=scene;pic.style.backgroundImage=a.file?'url("'+a.file+'")':'';pic.setAttribute('aria-label',language==='en'?(EN_ART[scene]||'Illustration for this scene'):a.name);layoutScene(pic);}
function layoutArt(){layoutScene($('picture'));}
function setArt(scene){currentScene=scene;$('picture').className='picture'+(scene==='cover'?' cover':'');paintScene($('picture'),scene);}
function flagMatches(v,flags){return Object.hasOwn(v,'value')?flags[v.flag]===v.value:!!flags[v.flag];}
function matches(v){return flagMatches(v,state.flags);}
function passageFor(n){const v=n.variants?.find(matches);return {text:v?.text??n.text,who:v?.who??n.who};}
function stopTyping(){if(timer)clearInterval(timer);timer=null;typing=false;}
function showView(name){stopTyping();if($('infoDialog').open)$('infoDialog').close();view=name;for(const [key,id] of Object.entries({cover:'coverScreen',intro:'introScreen',game:'game',ending:'endingScreen'}))$(id).classList.toggle('hidden',key!==name);if(typeof window!=='undefined')window.scrollTo(0,0);}
function showCover(){showView('cover');$('resume').classList.toggle('hidden',!saved);}
function renderIntro(){const index=introPart+1;$('introTitle').textContent=t('intro'+index+'Title');$('introCopy').textContent=t('intro'+index);$('introProgress').textContent=index+' / 2';$('introNext').classList.toggle('hidden',introPart===1);$('enterStory').classList.toggle('hidden',introPart!==1);}
function openIntro(){showView('intro');introPart=0;renderIntro();}
function reveal(){stopTyping();$('passage').textContent=pending;showControls();}
function actionDone(){return !!state.actions[state.id];}
const ICONS={document:'<path d="M16 8h25l9 9v39H16zM40 8v12h10M23 29h20M23 37h20M23 45h12"/>',screen:'<rect x="8" y="12" width="48" height="34" rx="3"/><path d="M22 54h20M32 46v8M27 23l13 7-13 7z"/>',phone:'<rect x="17" y="5" width="30" height="54" rx="4"/><path d="M23 17h18M23 26h18M23 35h12M29 51h6"/>',wallet:'<rect x="9" y="17" width="46" height="34" rx="4"/><path d="M9 23V13h37M40 30h15v13H40zM45 36h2"/>',window:'<path d="M12 8h40v48H12zM32 8v48M12 32h40M17 13l9 9M38 38l9 9"/>',paper:'<path d="M16 8h25l9 9v39H16zM40 8v12h10M23 29h20M23 37h20M23 45h12"/>',alarm:'<path d="M20 45h24l-4-8V25a8 8 0 0 0-16 0v12zM28 51h8M32 6v5M10 17l5 4M54 17l-5 4"/>',door:'<path d="M16 57V7h32v50M39 33h2M5 57h54"/>'};

function openInfo(n,mandatory){
 if($('infoDialog').open)$('infoDialog').close();
 const original=mandatory?n.action:n.extra,source={...original,...original.variants?.find(matches)},card=mandatory?(source.card||({wallet:t('wallet'),paper:t('paper'),window:t('window')})[source.kind]):null;
 infoContext={id:state.id,mandatory};$('infoTitle').textContent=source.title||source.label;
 $('infoText').textContent=card||source.feedback||source.text;$('infoCaption').textContent=card?(source.feedback||''):'';
 $('infoContinue').textContent=mandatory?t('continueStory'):t('backStory');
 $('infoStatus').textContent=source.learn?.length?t('infoRecorded'):t('infoReview');
 $('infoDialog').showModal();paintScene($('infoPicture'),source.scene||n.scene);$('extraAction').setAttribute('aria-expanded',String(!mandatory));
}
$('infoDialog').addEventListener('close',()=>{infoContext=null;$('extraAction').setAttribute('aria-expanded','false');});
$('infoContinue').onclick=()=>{const context=infoContext;$('infoDialog').close();if(context?.mandatory&&context.id===state.id)next();};
function paintAction(n){$('stage').classList.add('effect-'+n.action.kind);$('feedback').textContent=n.action.feedback;$('inspectAgain').classList.remove('hidden');$('inspectAgain').onclick=()=>openInfo(n,true);}
function setupAction(n){const b=$('sceneAction');b.replaceChildren();const icon=document.createElement('span');icon.className='action-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">'+ICONS[n.action.kind]+'</svg>';const label=document.createElement('span');label.textContent=n.action.label;b.append(icon,label);b.setAttribute('aria-label',n.action.label);const nodeId=state.id;b.onclick=()=>{if(state.id!==nodeId||actionDone())return;state.actions[nodeId]=true;record(t('inspectRole'),n.action.feedback);learn(n.action.learn);persist();paintAction(n);showControls();openInfo(n,true);};}
function setupExtra(n){const b=$('extraAction');b.textContent=n.extra.label;b.setAttribute('aria-expanded','false');const nodeId=state.id;b.onclick=()=>{if(state.id!==nodeId)return;if(!(n.extra.learn||[]).every(k=>state.notes.includes(k)))record(n.extra.title||t('tvNews'),n.extra.variants?.find(matches)?.text||n.extra.text);learn(n.extra.learn);persist();openInfo(n,false);};}
// 尋找確實能到後續章節的路；依當時旗標處理撤退與被捕，不能只看相鄰選項。
const routingFlags=[...new Set(Object.values(STORY).flatMap(n=>(n.resolve||[]).map(r=>r.flag)))],reachMemo=new Map();
function canReachChapter(id,flags,target,visiting=new Set()){
 const n=STORY[id];if(!n)return false;
 const key=JSON.stringify([id,target,...routingFlags.map(k=>flags[k])]);
 if(reachMemo.has(key))return reachMemo.get(key);if(visiting.has(key))return false;
 const branch=new Set(visiting);branch.add(key);let result=false;
 const redirect=n.resolve?.find(r=>flagMatches(r,flags));
 if(redirect)result=canReachChapter(redirect.to,flags,target,branch);
 else if((n.chapter||1)>=target)result=true;
 else{
  const nextFlags={...flags,...n.onEnter};
  if(n.choices)result=n.choices.some(c=>canReachChapter(c.to,{...nextFlags,...c.set},target,branch));
  else if(n.continue)result=canReachChapter(n.continue,(n.chapter||1)===1?{...nextFlags,chapterOneResult:n.result}:nextFlags,target,branch);
  else if(n.next)result=canReachChapter(n.next,nextFlags,target,branch);
 }
 reachMemo.set(key,result);return result;
}
// 舊存檔未有分岔快照：只根據已記錄的選擇還原，不能虛構未玩過的經歷。
function recoverLegacyTrail(source){
 const events=(source.history||[]).map((e,index)=>({...e,index})).filter(e=>e.who==='你嘅選擇'),trail=[];
 let id=START,flags={},actions={},notes=[],at=0;
 for(let guard=0;guard<500;guard++){
  const n=STORY[id];if(!n)break;
  const redirect=n.resolve?.find(r=>flagMatches(r,flags));if(redirect){id=redirect.to;continue;}
  flags={...flags,...n.onEnter};
  if(source.actions?.[id])actions[id]=true;
  const possible=[...(n.learn||[]),...(actions[id]?(n.action?.learn||[]):[]),...(n.extra?.learn||[])];
  for(const k of possible)if(source.notes?.includes(k)&&!notes.includes(k))notes.push(k);
  if(n.choices){
   const event=events[at],choice=event&&n.choices.find(c=>c.label===event.text||c.aliases?.includes(event.text));if(!choice){if(n.legacyNext){id=n.legacyNext;continue;}break;}
   const chapter=n.chapter||1,checkpoints={};
   for(const [key,value]of Object.entries(source.checkpoints||{}))if(Number(key)<=chapter)checkpoints[key]=structuredClone(value);
   const snapshot={id,flags:structuredClone(flags),actions:structuredClone(actions),notes:[...notes],history:structuredClone(source.history.slice(0,event.index)),checkpoints};
   if(chapter>=2&&source.chapter2Start)snapshot.chapter2Start=structuredClone(source.chapter2Start);
   trail.push(snapshot);flags={...flags,...choice.set};id=choice.to;at++;
  }else if(n.continue){if((n.chapter||1)===1)flags.chapterOneResult=n.result;id=n.continue;}
  else if(n.next)id=n.next;else break;
 }
 return trail;
}
function findContinuation(){
 const target=(STORY[state.id].chapter||1)+1;if(target>Object.keys(CHAPTERS).length)return null;
 const seek=trail=>{for(let i=trail.length-1;i>=0;i--){const snapshot=trail[i],n=STORY[snapshot?.id];if(n?.choices&&snapshot.flags&&n.choices.some(c=>canReachChapter(c.to,{...snapshot.flags,...c.set},target)))return{snapshot,trail:trail.slice(0,i),target};}return null;};
 const current=Array.isArray(state.choiceTrail)?state.choiceTrail:[];
 let found=seek(current);if(found)return found;
 const reconstructed=recoverLegacyTrail(state);found=seek(reconstructed);if(found)return found;
 if(state.lastChoice){found=seek([state.lastChoice]);if(found)return found;}
 // 若極舊存檔缺少選擇紀錄，就回到可行的已保存章節，明示要從頭重選。
 for(let chapter=(STORY[state.id].chapter||1);chapter>=1;chapter--){const base=chapterCheckpoint(chapter);if(base&&canReachChapter(base.id,base.flags,target))return{snapshot:structuredClone(base),trail:[],target,fallback:true};}
 return null;
}
function returnToContinuation(){
 const plan=findContinuation();if(!plan)return;
 state={...structuredClone(plan.snapshot),choiceTrail:structuredClone(plan.trail)};
 persist();render();
}
function choiceSnapshot(){return {id:state.id,flags:structuredClone(state.flags),actions:structuredClone(state.actions),notes:[...state.notes],history:structuredClone(state.history),checkpoints:structuredClone(state.checkpoints||{}),...(state.chapter2Start?{chapter2Start:structuredClone(state.chapter2Start)}:{})};}
function showControls(){
 const n=STORY[state.id],waiting=!!n.action&&!actionDone();learn(n.learn);
 $('actionLayer').classList.toggle('hidden',!waiting);$('actionHint').classList.toggle('hidden',!waiting);$('advance').classList.toggle('hidden',waiting||!!n.choices||!!n.end);$('advance').textContent=t('next');$('ending').classList.toggle('hidden',!n.end);$('choices').replaceChildren();$('extraAction').classList.toggle('hidden',!n.extra);
 if(n.extra)setupExtra(n);if(waiting)setupAction(n);if(n.action&&actionDone())paintAction(n);
 if(n.choices)for(const c of n.choices){const b=document.createElement('button');b.className='choice';const text=document.createElement('span');text.textContent=c.label;b.append(text);if(c.detail){const small=document.createElement('small');small.textContent=c.detail;b.append(small);}const nodeId=state.id;b.onclick=()=>{if(state.id!==nodeId)return;if(!Array.isArray(state.choiceTrail))state.choiceTrail=recoverLegacyTrail(state);const snapshot=choiceSnapshot();state.choiceTrail.push(snapshot);state.lastChoice=snapshot;record('你嘅選擇',c.label);Object.assign(state.flags,c.set||{});go(c.to);};$('choices').append(b);}
 const chapter=n.chapter||1;
 $('chapterContinue').classList.toggle('hidden',!n.continue);$('chapterContinue').textContent=t('chapterContinue',{n:numberLabel(n.nextChapter||chapter+1)});
 $('replayChapter').classList.toggle('hidden',!chapterCheckpoint(chapter));$('replayChapter').textContent=t('replay',{n:numberLabel(chapter)});
 if(n.end&&!n.ending){$('boundaryLabel').textContent=t('chapterEnd',{n:numberLabel(chapter)});$('outcome').textContent=chapter===1&&n.result==='withdraw'?t('withdrawSummary'):t('chapterSummary');}

}
function endingFor(n){return {...n.ending,paragraphs:n.ending.variants?.find(matches)?.paragraphs||n.ending.paragraphs};}
function renderEpilogue(){const e=endingFor(STORY[state.id]),part=Math.max(0,Math.min(e.paragraphs.length-1,state.epiloguePart||0));state.epiloguePart=part;$('epilogueText').textContent=e.paragraphs[part];$('epilogueProgress').textContent=(part+1)+' ／ '+e.paragraphs.length;const last=part===e.paragraphs.length-1;$('epilogueNext').classList.toggle('hidden',last);$('endingActions').classList.toggle('hidden',!last);}
function renderEnding(n){showView('ending');recoveryPlan=findContinuation();$('routeRecovery').classList.toggle('hidden',!recoveryPlan);if(recoveryPlan){const point=STORY[recoveryPlan.snapshot.id];$('returnRouteHint').textContent=t('returnHint');}const e=endingFor(n);paintScene($('endingPicture'),e.scene);$('endingTitle').textContent=e.title;$('endingNumber').textContent=t('endingNumber',{n:numberLabel(e.number),total:numberLabel(Object.values(STORY).filter(n=>n.ending).length)});$('retryChoice').classList.toggle('hidden',!state.lastChoice||!STORY[state.lastChoice.id]?.choices);$('endingReplay').classList.toggle('hidden',!chapterCheckpoint(n.chapter));$('endingReplay').textContent=t('replay',{n:numberLabel(n.chapter)});if(!collection.includes(state.id)){collection.push(state.id);try{localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));}catch{}}renderEpilogue();}
function render(){
 const n=STORY[state.id];if(n.ending){renderEnding(n);return;}showView('game');const line=passageFor(n);
 $('extraAction').classList.add('hidden');$('game').classList.toggle('quick-choice',!!n.quick);$('rewrite').classList.toggle('hidden',!n.overwrite);
 if(n.overwrite){$('rewriteFrom').textContent=n.overwrite.from;$('rewriteTo').textContent=n.overwrite.to;$('rewriteWhy').textContent=n.overwrite.reason;}
 $('stage').className='art'+(n.mood?' mood-'+n.mood:'')+(n.fx?' fx-'+n.fx:'');$('coinBurst').classList.toggle('hidden',n.fx!=='coins');$('cue').textContent=n.cue||'';$('cue').classList.toggle('hidden',!n.cue);setArt(n.scene);if(lastScene!==n.scene)$('picture').classList.add('scene-enter');lastScene=n.scene;
 $('location').textContent=n.section;document.querySelector('.episode').textContent=CHAPTERS[n.chapter||1];$('chapterBadge').textContent=t('chapterBadge',{n:numberLabel(n.chapter||1)});$('goalLabel').textContent=n.goalLabel||t('currentGoal');$('goalText').textContent=n.goal;$('speaker').textContent=line.who||' ';
 for(const id of ['ending','actionLayer','actionHint','inspectAgain'])$(id).classList.add('hidden');$('choices').replaceChildren();setupHotspots(n);$('feedback').textContent='';$('advance').classList.remove('hidden');$('advance').textContent=t('showAll');pending=line.text;$('passage').textContent='';
 if(prefs.speed===0||matchMedia('(prefers-reduced-motion: reduce)').matches){reveal();return;}typing=true;const chars=Array.from(pending);let at=0;timer=setInterval(()=>{$('passage').textContent+=chars[at++];if(at>=chars.length){stopTyping();showControls();}},prefs.speed);
}
function go(id){const n=STORY[id];if(n.resolve){const m=n.resolve.find(matches);if(m){go(m.to);return;}}state.id=id;state.epiloguePart=0;Object.assign(state.flags,n.onEnter||{});const line=passageFor(n);record(line.who,line.text);persist();render();}
function next(){if(view!=='game')return;if(typing){reveal();return;}const n=STORY[state.id];if(n.action&&!actionDone())return;if(n.next)go(n.next);}
function start(){state=fresh();go(START);}
function chapterCheckpoint(chapter){if(chapter===1)return {id:START,flags:{},actions:{},notes:[],history:[]};if(state.checkpoints?.[chapter])return state.checkpoints[chapter];if(chapter===2&&state.chapter2Start)return {id:CONTINUATIONS[state.chapter2Start.flags.chapterOneResult],...state.chapter2Start};return null;}
function continueChapter(){const n=STORY[state.id];if(!n.end||!n.continue)return;const target=n.nextChapter||(n.chapter||1)+1;if((n.chapter||1)===1)state.flags.chapterOneResult=n.result;const snapshot={id:n.continue,flags:structuredClone(state.flags),actions:structuredClone(state.actions),notes:[...state.notes],history:structuredClone(state.history)};state.checkpoints??={};state.checkpoints[target]=snapshot;if(target===2)state.chapter2Start=structuredClone(snapshot);go(n.continue);}
function replayChapter(chapter=STORY[state.id].chapter||1){const base=chapterCheckpoint(chapter);if(!base)return;const snapshot=structuredClone(base),checkpoints=structuredClone(state.checkpoints||{});for(const key of Object.keys(checkpoints))if(Number(key)>chapter)delete checkpoints[key];const choiceTrail=(Array.isArray(state.choiceTrail)?state.choiceTrail:recoverLegacyTrail(state)).filter(s=>(STORY[s.id]?.chapter||1)<chapter);state={...snapshot,checkpoints,choiceTrail,...(chapter>=2&&state.chapter2Start?{chapter2Start:structuredClone(state.chapter2Start)}:{})};go(state.id);}
function retryChoice(){const previous=state.lastChoice;if(!previous||!STORY[previous.id]?.choices)return;const trail=Array.isArray(state.choiceTrail)?state.choiceTrail:recoverLegacyTrail(state);const index=trail.map(s=>s.id).lastIndexOf(previous.id);state={...structuredClone(previous),choiceTrail:structuredClone(index>=0?trail.slice(0,index):[])};persist();render();}
$('start').onclick=openIntro;$('introNext').onclick=()=>{if(introPart<1){introPart++;renderIntro();}};$('enterStory').onclick=start;$('introBack').onclick=showCover;
for(const id of ['homeBtn','endingHome','boundaryHome'])$(id).onclick=showCover;
for(const id of ['restart','endingRestart'])$(id).onclick=openIntro;
$('chapterContinue').onclick=continueChapter;for(const id of ['replayChapter','endingReplay'])$(id).onclick=()=>replayChapter();$('retryChoice').onclick=retryChoice;$('returnToStory').onclick=returnToContinuation;
$('epilogueNext').onclick=()=>{const e=endingFor(STORY[state.id]);if((state.epiloguePart||0)<e.paragraphs.length-1){state.epiloguePart=(state.epiloguePart||0)+1;persist();renderEpilogue();}};
$('resume').onclick=()=>{if(!saved)return;state=structuredClone(saved);delete state.guideTarget;if(STORY[state.id].continue)continueChapter();else render();};
$('advance').onclick=next;$('passage').onclick=()=>{if(typing)reveal();};$('passage').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(typing)reveal();}};
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['BUTTON','INPUT'].includes(e.target.tagName)||e.target===$('passage'))return;if(view==='game'&&(e.key===' '||e.key==='Enter')){e.preventDefault();next();}});
function entry(root,title,text){const p=document.createElement('div');p.className='entry';const strong=document.createElement('strong');strong.textContent=title;p.append(strong,document.createTextNode(text));root.append(p);}
$('notesBtn').onclick=()=>{$('peopleList').replaceChildren();for(const p of PEOPLE)if(!p.requiresNote||state.notes.includes(p.requiresNote))entry($('peopleList'),p.name,p.text);$('noteList').replaceChildren();if(!state.notes.length)$('noteList').textContent=t('noClues');for(const k of state.notes)entry($('noteList'),NOTES[k].title,NOTES[k].text);$('notes').showModal();};
$('historyBtn').onclick=()=>{if(typing)reveal();$('entries').replaceChildren();for(const e of state.history)entry($('entries'),e.who==='你嘅選擇'?t('choiceRole'):(recordedText(e.who)||t('narrator')),recordedText(e.text));if(!state.history.length)$('entries').textContent=t('noHistory');$('history').showModal();};
$('settingsBtn').onclick=()=>$('settings').showModal();for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
for(const id of ['speed','size'])$(id).oninput=()=>{prefs[id]=Number($(id).value);applyPrefs();try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch{}if(id==='speed'&&typing)reveal();};
function setupHotspots(n){const root=$('hotspots');root.replaceChildren();for(const h of n.hotspots||[]){const b=document.createElement('button');b.className='hotspot';b.textContent=h.label;b.style.left=h.x+'%';b.style.top=h.y+'%';b.setAttribute('aria-haspopup','dialog');const id=state.id;b.onclick=()=>{if(state.id!==id)return;const source={...h,...h.variants?.find(matches)};if(!(h.learn||[]).every(k=>state.notes.includes(k)))record(h.title,source.text);learn(h.learn);persist();b.classList.add('is-read');openInfo({...n,extra:source},false);};if((h.learn||[]).every(k=>state.notes.includes(k)))b.classList.add('is-read');root.append(b);}}
function openChapters(){if(typing)reveal();$('chapterList').replaceChildren();for(const chapter of [1,2,3,4,5]){const base=chapterCheckpoint(chapter),b=document.createElement('button');b.className='chapter-option';b.textContent=CHAPTERS[chapter]+(base?' →':' / '+t('locked'));b.disabled=!base;b.onclick=()=>{$('chapters').close();replayChapter(chapter);};$('chapterList').append(b);}$('chapters').showModal();}
function openCollection(){if(typing)reveal();const endings=Object.entries(STORY).filter(([,n])=>n.ending).sort((a,b)=>a[1].ending.number-b[1].ending.number);$('collectionCount').textContent=t('collectionCount',{n:collection.length,total:endings.length});$('collectionList').replaceChildren();for(const [id,n] of endings){const known=collection.includes(id),card=document.createElement('article');card.className='collection-card'+(known?'':' is-locked');const art=document.createElement('div');art.className='collection-art';if(known){art.setAttribute('role','img');paintScene(art,n.ending.scene);}else{art.textContent='？';art.setAttribute('aria-hidden','true');}const title=document.createElement('h3');title.textContent=numberLabel(n.ending.number)+' / '+(known?n.ending.title:t('unknown'));card.append(art,title);$('collectionList').append(card);}$('collection').showModal();for(const el of $('collectionList').querySelectorAll('.collection-art'))layoutScene(el);}
$('chaptersBtn').onclick=openChapters;for(const id of ['collectionBtn','coverCollection','endingCollection'])$(id).onclick=openCollection;
new ResizeObserver(()=>{for(const el of $('collectionList').querySelectorAll('.collection-art'))layoutScene(el);}).observe($('collectionList'));
function toggleLanguage(){stopTyping();setLanguage(language==='en'?'zh':'en');localizePage();if(view==='intro')renderIntro();else if(view==='cover')showCover();else render();}
for(const id of ['coverLanguage','introLanguage','gameLanguage','endingLanguage'])$(id).onclick=toggleLanguage;
localizePage();applyPrefs();for(const id of ['picture','infoPicture','endingPicture'])new ResizeObserver(()=>layoutScene($(id))).observe($(id));showCover();

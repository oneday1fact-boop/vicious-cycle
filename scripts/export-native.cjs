const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {visible}=require('./localization.cjs');
const root=path.resolve(__dirname,'..'),game=path.join(root,'game');
const data=require(path.join(game,'story.js'));
const ctx={...structuredClone(data),structuredClone,localStorage:{getItem:()=>null,setItem(){}},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(game,'i18n.js'),'utf8'),ctx);
const app=fs.readFileSync(path.join(game,'app.js'),'utf8');
const artLiteral=app.match(/const ART=(\{[\s\S]*?\n\});/)[1];
const art=vm.runInNewContext('('+artLiteral+')');art.cover={file:'assets/creepy-cover.png',cols:1,rows:1,col:0,row:0,name:art.cover.name};
const exported=vm.runInContext('({start:START,languages:languageViews,ui:UI_TEXT,artEnglish:EN_ART})',ctx);
exported.art=art;exported.schema=2;
const labels=JSON.parse(fs.readFileSync(path.join(game,'native-ui.json'),'utf8'));
const nativeOverrides={savedLocal:['已儲存在此裝置','Saved on this device'],saveUnavailable:['無法儲存','Saving is unavailable'],readSettings:['遊戲設定','Game settings'],settingsHelp:['按一下文章即可顯示全文。減少動態不影響選擇與互動；音效和震動可分別設定。','Tap a passage to reveal it. Reduced motion preserves interactions. Music, button sounds and haptics have separate controls.'],collectionHelp:['重玩章節或返回分岔，探索其他結局。收藏會留在此裝置。','Replay a chapter or a story fork to discover more endings. Your collection stays on this device.']};
Object.assign(exported.ui,nativeOverrides);
for(const code of ['zh','en']){
 const locale=exported.languages[code];locale.ui=Object.fromEntries(Object.entries(exported.ui).map(([key,pair])=>[key,pair[code==='zh'?0:1]]));
 locale.nativeUi=labels[code];locale.art=code==='zh'?Object.fromEntries(Object.entries(art).map(([k,a])=>[k,a.name])):exported.artEnglish;locale.translationMode='bundled';
}
exported.languages['zh-Hans']=JSON.parse(fs.readFileSync(path.join(game,'locales/zh-Hans.json'),'utf8'));
exported.languages['zh-Hans'].translationMode='bundled';
for(const code of ['ja','es','fr']){
 const manual=JSON.parse(fs.readFileSync(path.join(game,`locales/${code}.json`),'utf8'));
 for(const key of Object.keys(exported.ui))if(!manual.ui[key])throw Error(`${code}: missing UI ${key}`);
 for(const key of Object.keys(labels.en))if(!manual.nativeUi[key])throw Error(`${code}: missing native label ${key}`);
 const locale=structuredClone(exported.languages.en);locale.ui=manual.ui;locale.nativeUi=manual.nativeUi;locale.translationMode='on-device';
 locale.art.cover=manual.ui.coverArt;exported.languages[code]=locale;
}
const plan=[];
function visit(value,parts=[]){
 if(typeof value==='string'){if(value.trim()&&visible(parts))plan.push({path:parts,source:value});return;}
 if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))visit(item,[...parts,key]);
}
visit(exported.languages.en);exported.translationPlan=plan;
exported.translationFingerprint=crypto.createHash('sha256').update(JSON.stringify({base:exported.languages.en,plan,labels})).digest('hex');
fs.writeFileSync(path.join(game,'native-data.json'),JSON.stringify(exported));
console.log(`Exported native story: ${Object.keys(exported.languages.en.story).length} nodes, ${Object.keys(art).length} art frames, six languages; ${plan.length} translated display fields.`);

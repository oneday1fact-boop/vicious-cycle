'use strict';
// Safari uses the three complete bundled editions. Android's ML Kit translator
// is deliberately not exposed as a browser feature.
const WEB_COPY = {
 zh: {language:'語言',audioHeading:'聲音與效果',music:'背景音樂',musicVolume:'音樂音量',sfx:'按鍵音效',sfxVolume:'音效音量',testSound:'試聽音效',vibration:'故事震動',iphoneHeading:'在 iPhone 上遊玩',installHelp:'Safari → 分享 → 加入主畫面，即可以全螢幕開啟。',offline:'下載離線遊戲',offlineBusy:'正在下載',offlineReady:'離線遊戲已準備好。請用相同的主畫面圖示或瀏覽器開啟。',offlineError:'下載未完成。請保持網絡連線，再試一次。',offlineUnavailable:'這個瀏覽器無法儲存離線遊戲；你仍可連線遊玩。',hapticsUnavailable:'iPhone 的 Safari 不提供震動功能。畫面效果及音效仍可使用。',hapticsAvailable:'輕微震動配合故事效果，可隨時關閉。',audioBlocked:'請按「試聽音效」啟動聲音，並檢查手機的音量。',audioFailed:'未能載入聲音。請檢查連線，再按「試聽音效」。',webLanguages:'網頁測試版提供繁體中文、簡體中文及英文。日文、西班牙文與法文的離線翻譯套件暫時只在 Android 版本提供。',localSave:'進度只儲存在這個瀏覽器；與 Android 分開。請在加入主畫面後開始正式測試。'},
 en: {language:'Language',audioHeading:'Sound & effects',music:'Background music',musicVolume:'Music volume',sfx:'Button sounds',sfxVolume:'Button volume',testSound:'Test sound',vibration:'Story haptics',iphoneHeading:'Play on iPhone',installHelp:'In Safari, tap Share → Add to Home Screen to play full screen.',offline:'Download for offline play',offlineBusy:'Downloading',offlineReady:'Ready for offline play. Reopen using the same Home Screen icon or browser.',offlineError:'Download incomplete. Stay connected and try again.',offlineUnavailable:'This browser cannot store an offline copy. You can still play online.',hapticsUnavailable:'Safari on iPhone does not support vibration. Visual effects and sound still work.',hapticsAvailable:'Short vibrations accompany story effects. Turn them off at any time.',audioBlocked:'Tap “Test sound” to enable audio, and check your phone volume.',audioFailed:'Audio could not load. Check your connection and tap “Test sound” again.',webLanguages:'This web test includes complete English, Traditional Chinese and Simplified Chinese editions. Japanese, Spanish and French story packs currently use the Android app’s on-device translator.',localSave:'Progress stays in this browser and is separate from Android. Add to Home Screen before starting your main test.'},
 'zh-Hans': {language:'语言',audioHeading:'声音与效果',music:'背景音乐',musicVolume:'音乐音量',sfx:'按键音效',sfxVolume:'音效音量',testSound:'试听音效',vibration:'故事震动',iphoneHeading:'在 iPhone 上游玩',installHelp:'Safari → 分享 → 添加到主屏幕，即可全屏打开。',offline:'下载离线游戏',offlineBusy:'正在下载',offlineReady:'离线游戏已准备好。请用相同的主屏幕图标或浏览器打开。',offlineError:'下载未完成。请保持网络连接，再试一次。',offlineUnavailable:'这个浏览器无法保存离线游戏；你仍可联网游玩。',hapticsUnavailable:'iPhone 的 Safari 不提供震动功能。画面效果及音效仍可使用。',hapticsAvailable:'轻微震动配合故事效果，可随时关闭。',audioBlocked:'请按“试听音效”启动声音，并检查手机音量。',audioFailed:'无法加载声音。请检查连接，再按“试听音效”。',webLanguages:'网页测试版提供繁体中文、简体中文及英文。日文、西班牙文与法文的离线翻译包暂时只在 Android 版本提供。',localSave:'进度只保存在这个浏览器；与 Android 分开。请在添加到主屏幕后开始正式测试。'}
};
const webText = key => WEB_COPY[language]?.[key] ?? WEB_COPY.en[key] ?? key;
UI_TEXT.readSettings=['遊戲設定','Game settings'];
UI_TEXT.settingsHelp=['點一下文章即可顯示全文。「減少動態」不會影響選擇和互動；聲音可以分別設定。','Tap a passage to reveal it. Reduced motion preserves choices and interactions. Sound controls are independent.'];
languageViews['zh-Hans']=SIMPLIFIED_EDITION;
historyTranslations['zh-Hans']={};
function linkHistory(source,target,dictionary){
 if(typeof source==='string'&&typeof target==='string'){dictionary[source]=target;return;}
 if(source&&target&&typeof source==='object'&&typeof target==='object')for(const key of Object.keys(source))if(key!=='aliases')linkHistory(source[key],target[key],dictionary);
}
for(const target of ['zh','en','zh-Hans'])for(const source of ['zh','en','zh-Hans'])linkHistory(languageViews[source],languageViews[target],historyTranslations[target]);
const bilingualSetLanguage=setLanguage,bilingualText=t,bilingualLocalize=localizePage;
setLanguage=function(next){
 if(next!=='zh-Hans'){bilingualSetLanguage(next);return;}
 language='zh-Hans';const edition=languageViews[language];
 for(const[id,n]of Object.entries(edition.story))STORY[id]=structuredClone(n);
 for(const[id,n]of Object.entries(edition.notes))NOTES[id]=structuredClone(n);
 PEOPLE.splice(0,PEOPLE.length,...structuredClone(edition.people));Object.assign(CHAPTERS,edition.chapters);
 try{localStorage.setItem('vicious-cycle-language-v1',language);}catch{}
};
t=function(key,params={}){
 if(language!=='zh-Hans')return bilingualText(key,params);
 let text=SIMPLIFIED_EDITION.ui[key]??UI_TEXT[key]?.[0]??key;
 if(key==='readSettings')text='游戏设置';
 if(key==='settingsHelp')text='点击文章即可显示全文。“减少动态”不会影响选择和互动；声音可以分别设置。';
 if(key==='savedLocal')text='进度保存在此浏览器';
 for(const[k,v]of Object.entries(params))text=text.replaceAll('{'+k+'}',String(v));return text;
};
localizePage=function(){
 bilingualLocalize();document.documentElement.lang=language==='zh'?'zh-Hant':language;
 for(const el of document.querySelectorAll('[data-web]'))el.textContent=webText(el.dataset.web);
 for(const id of ['coverLanguage','introLanguage','gameLanguage','endingLanguage']){const el=document.getElementById(id);if(el){el.textContent=webText('language');el.setAttribute('aria-label',webText('language'));}}
 for(const el of document.querySelectorAll('[data-language]'))el.setAttribute('aria-pressed',String(el.dataset.language===language));
 document.dispatchEvent(new Event('game-language-change'));
};
try{
 const selected=initialWebLanguage;
 const preferred=selected||(/\b(?:en)\b/i.test(navigator.language)?'en':/zh-(?:CN|SG|Hans)/i.test(navigator.language)?'zh-Hans':'zh');
 setLanguage(preferred);
}catch{}
